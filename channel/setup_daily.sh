#!/bin/sh
# Daily-run setup: Python venv for our tools + CC0 instrument samples. Idempotent.
#   sh channel/setup_daily.sh
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
if [ ! -x .venv-daily/bin/python ]; then
  if command -v uv >/dev/null; then uv venv --quiet --python 3.12 .venv-daily && uv pip install --quiet --python .venv-daily/bin/python numpy scipy soundfile pillow
  else python3 -m venv .venv-daily && .venv-daily/bin/pip install --quiet numpy scipy soundfile pillow; fi
fi
A=${LEMO_ASSETS:-$HOME/lemo-assets}
if [ ! -f "$A/x/core/audio/instruments/index.json" ]; then
  mkdir -p "$A/x"
  for p in vsco2ce vcsl freepats; do
    curl -L --fail --retry 3 -sS -o "$A/instruments-$p.tar" "https://github.com/lemomo-ai/lemo-opuscar/releases/download/assets/instruments-$p.tar"
    tar xf "$A/instruments-$p.tar" -C "$A/x" --no-same-owner && rm "$A/instruments-$p.tar"
  done
fi
# each episode folder reaches the venv as .venv
for d in */; do [ -f "$d/film.js" ] && [ ! -e "$d/.venv" ] && ln -s ../.venv-daily "$d/.venv"; done
echo "ready: $ROOT/.venv-daily, samples in $A"
