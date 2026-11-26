#!/bin/sh
# Contact sheet of the ENCODED file: one frame per second plus the given extra times (the scare frames), tape window only.
#   sh tools/cs.sh sr07-foto-1-hour.mp4 out/cs "31.17 31.2 31.22 31.24 31.4"
set -e
F=$1; D=$2; X=$3
rm -rf "$D"; mkdir -p "$D"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
T=0.25
for t in $(awk -v d="$DUR" 'BEGIN { for (t = .25; t < d; t += 1) printf "%.2f ", t }') $X; do
  ffmpeg -loglevel error -ss "$t" -i "$F" -frames:v 1 -q:v 3 "$D/t_$(printf '%06.2f' "$t").jpg"
done
"$(dirname "$0")/../.venv/bin/python" "$(dirname "$0")/winsheet.py" "$D/sheet.jpg" "$D"/t_*.jpg --cols 6 --w 300
