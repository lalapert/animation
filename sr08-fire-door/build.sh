#!/bin/sh
# Rebuild STILL RECORDING tape 8 "Fire Door" from the voice takes and effects in this folder.
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
sh tools/mux.sh out/video.mp4 out/mix.wav sr08-fire-door.mp4      # stops unless loudnorm runs in linear mode
$PY tools/srt.py
python3 tools/loudcheck.py sr08-fire-door.mp4 24.0 0.0 35.5
$PY tools/listencheck.py out/mix.wav --skip 23.95:24.6 35.15:36.5
