#!/bin/sh
# Rebuild STILL RECORDING tape 6 "First Night" from the voice takes and effects in this folder.
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
sh tools/mux.sh out/video.mp4 out/mix.wav sr06-first-night.mp4      # stops unless loudnorm runs in linear mode
$PY tools/srt.py
python3 tools/loudcheck.py sr06-first-night.mp4 39.3 0.5 40.0 --skip 0:0.6 40:41
$PY tools/listencheck.py out/mix.wav --skip 0:0.55 39.25:41
