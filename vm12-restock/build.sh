#!/bin/sh
# Rebuild Void Mart 12 "Restock" from the voice takes and effects in this folder.
set -e
cd "$(dirname "$0")"
PY=.venv/bin/python
python3 ../channel/tools/script_to_lines.py ../channel/scripts/VM12_restock.md .   # the script is the source of the lines
python3 tools/voice_eleven.py          # only missing takes
python3 tools/asr_eleven.py
$PY tools/timeline.py
python3 tools/sfx_eleven.py            # only missing effects
$PY tools/score.py
node tools/render.cjs events
$PY tools/mix.py
node tools/render.cjs video 4
sh tools/mux.sh out/video.mp4 out/mix.wav out/vm12-restock.mp4
$PY tools/srt.py
$PY tools/check.py --mp4 out/vm12-restock.mp4      # margins, loudness, linear loudnorm, blackdetect, speech-to-text, contact sheet
cp out/vm12-restock.mp4 vm12-restock.mp4    # the tracked file only after every check passed
