#!/bin/sh
# Two-pass loudnorm (−14 LUFS, −1.5 dBTP) on the mix, then mux with the picture.
#   sh tools/mux.sh out/video.mp4 out/mix.wav a-year-on-the-sill.mp4
# Normalises to a WAV first and trims/pads it to the picture's length (ffmpeg 6.x loudnorm can misreport length).
set -e
V=$1; A=$2; OUT=$3
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
TMP=$(dirname "$OUT")/.norm.wav
ffmpeg -y -loglevel error -i "$A" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000,apad,atrim=0:$D" -ar 48000 -c:a pcm_s24le "$TMP"
AD=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP")
echo "picture $D s, audio $AD s"
awk -v a="$AD" -v d="$D" 'BEGIN { if (a < d - 0.05 || a > d + 0.05) { print "audio length mismatch"; exit 1 } }'
ffmpeg -y -loglevel error -i "$V" -i "$TMP" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -r 60 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$OUT"
rm -f "$TMP"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|Peak:" | sed 's/^ */  /'
ls -la "$OUT"
