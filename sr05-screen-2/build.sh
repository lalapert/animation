#!/bin/sh
# Rebuild STILL RECORDING tape 5 "Screen 2" from the voice takes and effects in this folder.
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
sh tools/mux.sh out/video.mp4 out/mix.wav sr05-screen-2.mp4      # stops unless loudnorm runs in linear mode
$PY tools/srt.py
python3 tools/loudcheck.py sr05-screen-2.mp4 38.167 0.6 40.8 --skip 0:0.65 40.8:41.8
$PY tools/listencheck.py out/mix.wav --skip 0:0.65 38.1:38.7 40.75:41.8
