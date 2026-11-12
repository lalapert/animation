#!/bin/sh
# Two-pass loudnorm (−14 LUFS, −1.5 dBTP) on the mix, then mux with the picture.
#   sh tools/mux.sh out/video.mp4 out/mix.wav <name>.mp4
# Normalises to a WAV first, then trims it to the picture's length by sample count (a time-based trim in the same pass
# comes out ~60 ms short with ffmpeg 6.x loudnorm in linear mode).
set -e
V=$1; A=$2; OUT=$3
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
N=$(awk -v d="$D" 'BEGIN { printf "%d", d * 48000 + 0.5 }')
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
TMP0=$(dirname "$OUT")/.norm0.wav; TMP=$(dirname "$OUT")/.norm.wav
ffmpeg -y -loglevel error -i "$A" -af "apad=pad_dur=1,loudnorm=I=-14:TP=-1.5:LRA=20:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" -ar 48000 -c:a pcm_s24le "$TMP0"
ffmpeg -y -loglevel error -i "$TMP0" -af "atrim=end_sample=$N" -c:a pcm_s24le "$TMP"
AD=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP")
echo "picture $D s, audio $AD s"
awk -v a="$AD" -v d="$D" 'BEGIN { if (a < d - 0.03 || a > d + 0.03) { print "audio length mismatch"; exit 1 } }'
ffmpeg -y -loglevel error -i "$V" -i "$TMP" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -r 60 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$OUT"
rm -f "$TMP" "$TMP0"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|Peak:" | sed 's/^ */  /'
ls -la "$OUT"
