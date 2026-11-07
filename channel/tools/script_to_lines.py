"""Copy the script table of channel/scripts/<episode>.md into <episode folder>/voice/lines.json.
  python3 channel/tools/script_to_lines.py channel/scripts/VL03_help_wanted.md vl03-help-wanted
The table rows look like:  | L1 | VERA | `[grand]` | Name? | (stage directions) |
Each line keeps the episode's cast (from lines.json if it exists) and gets: text = "<tags> <line>", plain = the line,
sub = the line (with " / " turned into a line break). Rows whose id does not start with L (stage-only rows) are skipped.
"""
import json, os, re, sys

script, folder = sys.argv[1], sys.argv[2]
rows = []
for ln in open(script, encoding="utf-8"):
    if not ln.startswith("| L"): continue
    cells = [c.strip() for c in ln.strip().strip("|").split("|")]
    if len(cells) < 4: continue
    lid, who, tag, line = cells[0], cells[1].upper(), cells[2].strip("`").strip(), cells[3]
    tag = " ".join(re.findall(r"\[[^\]]*\]", tag))       # only [audio tags]; a note like "(no tag: ...)" means no tag
    if not re.fullmatch(r"L\d+[a-z]?", lid) or not line: continue
    plain = line.replace(" / ", " ")
    rows.append({"id": lid, "who": who, "text": (tag + " " if tag else "") + plain, "plain": plain, "sub": line.replace(" / ", "\n")})
p = os.path.join(folder, "voice", "lines.json")
cfg = json.load(open(p)) if os.path.exists(p) else {"model_id": "eleven_v4", "cast": {}}
old = {l["id"]: l for l in cfg.get("lines", [])}
for r in rows:                                   # keep a hand-made "asr" (Rae/Ray) and per-line settings if the line is unchanged
    o = old.get(r["id"])
    if o and o.get("plain") == r["plain"]:
        for k in ("asr", "settings", "gain_db", "noctx"):
            if k in o: r[k] = o[k]
missing = sorted({r["who"] for r in rows} - set(cfg["cast"]))
cfg["lines"] = rows
os.makedirs(os.path.dirname(p), exist_ok=True)
json.dump(cfg, open(p, "w"), indent=1, ensure_ascii=False)
print(len(rows), "lines →", p, "| cast missing:" if missing else "", " ".join(missing))
