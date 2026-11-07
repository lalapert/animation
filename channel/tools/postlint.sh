#!/usr/bin/env bash
# Lint one post before it goes to Metricool (the ig-* skills in .claude/skills, reviewed 11/8: stdlib only, no network).
# usage: channel/tools/postlint.sh channel/ig/posts/<folder>.txt "<search term 1>,<search term 2>" "<YouTube title without the | ... #shorts tail>"
# 1) strips AI tells (em dashes, invisible characters, stock phrases) in place, showing the diff  2) caption lint  3) title hook score
set -e
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"; S="$ROOT/.claude/skills"
IN="$1"; OUT="$(mktemp)"
python3 -I "$S/ig-human/humanize.py" "$IN" -o "$OUT" --report
if ! cmp -s "$IN" "$OUT"; then echo "humanizer changed the text (diff below); the cleaned text replaces $IN"; diff "$IN" "$OUT" || true; cp "$OUT" "$IN"; fi
rm -f "$OUT"
python3 -I "$S/ig-caption/caption.py" "$IN" --keywords "$2"
if [ -n "$3" ]; then python3 -I "$S/ig-reel/hookscore.py" --hook "$3"; fi
