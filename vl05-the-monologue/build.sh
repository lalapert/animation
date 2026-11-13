#!/bin/sh
# Rebuild Volt Labs 5 "The Monologue" from the voice takes and effects in this folder (11/13: natural-sound pass, the Volt Labs band
# score, new first frame). Nothing here calls a paid API unless a take or an effect is missing (the tracked mp3s are decoded).
set -e
cd "$(dirname "$0")"
PY=.venv/bin/python
python3 ../channel/tools/script_to_lines.py ../channel/scripts/VL05_the_monologue.md .   # the script is the source of the lines
python3 tools/voice_eleven.py          # only missing takes
$PY tools/timeline.py
python3 tools/sfx_eleven.py            # only missing effects (decodes the tracked mp3s)
$PY tools/score.py                     # the Volt Labs band (tools/band.py), cued to the scene
node tools/render.cjs events
$PY tools/mix.py                       # room tone, foley in its space, voices, ducked music; asserts every line >= 8 dB clear
node tools/render.cjs video 3
sh tools/mux.sh out/video.mp4 out/mix.wav vl05-the-monologue.mp4   # stops unless the loudnorm second pass is linear
$PY tools/srt.py
python3 tools/final_check.py vl05-the-monologue.mp4                # duration, LUFS, true peak, blackdetect, STT of every line, contact sheets
