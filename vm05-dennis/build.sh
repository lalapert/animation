#!/bin/sh
# Rebuild Void Mart 5 "Dennis" from the voice takes and effects in this folder.
set -e
cd "$(dirname "$0")"
PY=.venv/bin/python
python3 tools/voice_eleven.py          # only missing takes
python3 tools/asr_eleven.py
$PY tools/timeline.py
python3 tools/sfx_eleven.py            # only missing effects
$PY tools/score.py
node tools/render.cjs events
$PY tools/mix.py
node tools/render.cjs video 4
sh tools/mux.sh out/video.mp4 out/mix.wav out/vm05-dennis.mp4
$PY tools/srt.py
$PY tools/check.py --mp4 out/vm05-dennis.mp4      # margins, loudness, linear loudnorm, blackdetect, speech-to-text, contact sheet
cp out/vm05-dennis.mp4 vm05-dennis.mp4    # the tracked file only after every check passed
