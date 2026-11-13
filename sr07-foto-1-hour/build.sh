#!/bin/sh
# Rebuild STILL RECORDING tape 7 "Foto 1 Hour" from the voice takes and effects in this folder.
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
sh tools/mux.sh out/video.mp4 out/mix.wav sr07-foto-1-hour.mp4      # stops unless loudnorm runs in linear mode
$PY tools/srt.py
python3 tools/loudcheck.py sr07-foto-1-hour.mp4 31.15 0.0 40.2 --skip 40.2:41.2
$PY tools/listencheck.py out/mix.wav --skip 31.1:31.9 40.15:41.2
