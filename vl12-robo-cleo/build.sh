#!/bin/sh
# Rebuild Volt Labs 12 "Robo-Cleo" from the voice takes and effects in this folder (natural sound, the Volt Labs band
# score). Nothing here calls a paid API unless a take or an effect is missing (the tracked mp3s are decoded).
set -e
cd "$(dirname "$0")"
PY=.venv/bin/python
python3 ../channel/tools/script_to_lines.py ../channel/scripts/VL12_robo_cleo.md .   # the script is the source of the lines
python3 tools/voice_eleven.py          # only missing takes
python3 tools/asr_eleven.py            # every take heard as written (exit 0)
$PY tools/timeline.py
python3 tools/sfx_eleven.py            # only missing effects (decodes the tracked mp3s)
$PY tools/score.py                     # the Volt Labs band (tools/band.py), cued to the scene
node tools/render.cjs events
$PY tools/mix.py                       # room tone, foley in its space, voices, ducked music; asserts every line >= 8 dB clear
node tools/render.cjs video 3
sh tools/mux.sh out/video.mp4 out/mix.wav out/vl12-robo-cleo.mp4   # stops unless the loudnorm second pass is linear (drafts stay in out/)
$PY tools/srt.py
python3 tools/final_check.py out/vl12-robo-cleo.mp4    # duration, LUFS, true peak, blackdetect, STT of every line, contact sheets
cp out/vl12-robo-cleo.mp4 vl12-robo-cleo.mp4                 # the tracked file only once every check passes
