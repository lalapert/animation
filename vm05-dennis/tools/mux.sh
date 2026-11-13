#!/bin/sh
# Two-pass loudnorm (-14 LUFS, -1.5 dBTP) on the mix, then mux with the picture.
#   sh tools/mux.sh out/video.mp4 out/mix.wav <name>.mp4
# Normalises to a WAV first, then trims it to the picture's length by sample count (a time-based trim in the same pass
# comes out ~60 ms short with ffmpeg 6.x loudnorm in linear mode).
# 11/13: the second pass must run in LINEAR mode (one plain gain, the mix's balance untouched). Linear needs the gain to keep
# the true peak under TP (mix.py's limiter sees to that) and the source LRA under the LRA target, so the target is 20 (it
# does not change a linear pass). The script prints the second pass's normalization_type to out/mux.log and stops if it is
# not linear.
set -e
V=$1; A=$2; OUT=$3
LOG=$(dirname "$A")/mux.log
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
N=$(awk -v d="$D" 'BEGIN { printf "%d", d * 48000 + 0.5 }')
LN="I=-14:TP=-1.5:LRA=20"
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=$LN:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
echo "pass 1: I $(get input_i) LUFS, TP $(get input_tp) dBTP, LRA $(get input_lra) LU" | tee "$LOG"
TMP0=$(dirname "$OUT")/.norm0.wav; TMP=$(dirname "$OUT")/.norm.wav
J2=$(ffmpeg -y -hide_banner -nostats -i "$A" -af "apad=pad_dur=1,loudnorm=$LN:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true:print_format=json,aresample=48000" -ar 48000 -c:a pcm_s24le "$TMP0" 2>&1 | sed -n '/^{/,/^}/p')
MODE=$(echo "$J2" | sed -n 's/.*"normalization_type" : "\([^"]*\)".*/\1/p')
echo "pass 2: normalization_type $MODE, output I $(echo "$J2" | sed -n 's/.*"output_i" : "\([^"]*\)".*/\1/p'), TP $(echo "$J2" | sed -n 's/.*"output_tp" : "\([^"]*\)".*/\1/p')" | tee -a "$LOG"
[ "$MODE" = "linear" ] || { echo "loudnorm fell back to $MODE mode: lower the mix's peaks (mix.json plr_db)"; exit 1; }
ffmpeg -y -loglevel error -i "$TMP0" -af "atrim=end_sample=$N" -c:a pcm_s24le "$TMP"
AD=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP")
echo "picture $D s, audio $AD s"
awk -v a="$AD" -v d="$D" 'BEGIN { if (a < d - 0.03 || a > d + 0.03) { print "audio length mismatch"; exit 1 } }'
ffmpeg -y -loglevel error -i "$V" -i "$TMP" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -r 60 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$OUT"
rm -f "$TMP" "$TMP0"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|Peak:" | sed 's/^ */  /'
ls -la "$OUT"
