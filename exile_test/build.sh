#!/bin/sh
# Rebuild the Exile House rigging test from the image pack in assets/ and the voice takes in voice/out/.
# Python with OpenCV: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt  (the cut-outs and the render)
# The mix uses the house helpers in ../vm13-rewards-program/tools (read-only) and ../.venv-daily.
set -e
cd "$(dirname "$0")"
PY=${PY:-.venv/bin/python}
DPY=../.venv-daily/bin/python
python3 tools/voice_eleven.py          # only missing takes (ElevenLabs eleven_v3, Korean)
python3 tools/asr_eleven.py            # every take heard as written (ElevenLabs speech-to-text, Korean)
$PY tools/cutout.py                    # flood-fill cut-outs, parts, decontaminated edges, fringe report
$PY tools/register.py                  # expression variants registered to the neutral busts
$PY tools/build_rig.py                 # torso, arm, Minsu's composite, weight maps, 4x layers
$PY tools/timeline.py                  # line starts, shots, cues, mouth states, blinks
$PY tools/render.py armcheck           # the attached-arm machine check on every frame of the arm shot + joint crops
$PY tools/render.py facecheck          # subtitles never over a face, faces in the 3:4 band
$PY tools/render.py video 4            # out/video.mp4 (1080x1920, 30 fps)
$DPY tools/score.py                    # the lo-fi bed (house band)
$DPY tools/mix.py                      # voices, room tone, foley, bed -> out/mix.wav + stems
sh tools/mux.sh out/video.mp4 out/mix.wav exile_test.mp4
$PY tools/stills.py                    # expression flick stills, arm stills, Gemini vs ours
$DPY tools/check.py                    # final checks -> out/final_check.json, review/contact_sheet_0.5s.jpg
