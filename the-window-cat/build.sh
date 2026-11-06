#!/bin/sh
# One command: picture + score + mix → the-window-cat.mp4 (1080×1920, 60 fps, −14 LUFS), .srt and poster.jpg
#   sh build.sh
# Needs: Node 20+ with Playwright + Chromium, ffmpeg, Python 3.11+ (or uv).
# Narration (voice/out/*.mp3) and sound effects (sfx/out/*.mp3) are already generated and kept in the repo;
# regenerate them with tools/voice_eleven.py and tools/sfx_eleven.py (ElevenLabs API key needed).
# The CC0 instrument samples (~1.1 GB) are downloaded once into $LEMO_ASSETS.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$HERE"
LEMO_ASSETS=${LEMO_ASSETS:-$HOME/lemo-assets}
export LEMO_INSTRUMENTS="$LEMO_ASSETS/x/core/audio/instruments"

# Python environment
if [ ! -x .venv/bin/python ]; then
  if command -v uv >/dev/null; then uv venv --quiet --python 3.12 .venv && uv pip install --quiet --python .venv/bin/python numpy scipy soundfile pillow
  else python3 -m venv .venv && .venv/bin/pip install --quiet numpy scipy soundfile pillow; fi
fi

# CC0 instrument samples (VSCO 2 CE, VCSL, FreePats), from the Lemo-Opuscar asset release
if [ ! -f "$LEMO_INSTRUMENTS/index.json" ]; then
  mkdir -p "$LEMO_ASSETS/x"
  for p in vsco2ce vcsl freepats; do
    curl -L --fail --retry 3 -o "$LEMO_ASSETS/instruments-$p.tar" "https://github.com/lemomo-ai/lemo-opuscar/releases/download/assets/instruments-$p.tar"
    tar xf "$LEMO_ASSETS/instruments-$p.tar" -C "$LEMO_ASSETS/x" --no-same-owner && rm "$LEMO_ASSETS/instruments-$p.tar"
  done
fi

# wav copies of the effects
for f in sfx/out/*.mp3; do w="${f%.mp3}.wav"; [ -f "$w" ] || ffmpeg -loglevel error -y -i "$f" -ar 48000 -ac 2 "$w"; done

.venv/bin/python tools/timeline.py > /dev/null          # timing → timeline.js + out/timeline.json
node tools/render.cjs events                             # the page's sound cues → out/events.json
.venv/bin/python tools/score.py                          # → out/music.wav
.venv/bin/python tools/mix.py                            # → out/mix.wav
node tools/render.cjs video 3                            # → out/video.mp4
sh tools/mux.sh out/video.mp4 out/mix.wav the-window-cat.mp4
.venv/bin/python tools/srt.py
node tools/render.cjs stills out/poster 44.5 && cp out/poster/t_044.50.jpg poster.jpg
echo "done: $HERE/the-window-cat.mp4"
