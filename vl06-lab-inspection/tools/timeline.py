"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 6 "Lab Inspection": the lab wall flips into a bakery for a city inspector. Script: channel/scripts/VL06_lab_inspection.md
"""
import json, os, re
TAGS = re.compile(r"\[[^\]]*\]\s*")              # eleven_v4 audio tags: direction, never shown

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BPM = 132.0
BEAT = 60.0 / BPM
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
order = [l["id"] for l in cfg["lines"]]
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
SUBCOL = {"VERA": "#d8ff7a", "CLEO": "#c9b8ff", "INSPECTOR": "#ffc8a8"}
WALK_V = 150 * 1.9                                      # the inspector walks: px per second
RUN_V = 190 * 2.8                                       # a dash behind the bench
IX, IX_OFF = 780, 1190                                  # the inspector's spot, and off screen right (the stairs)
VX0, CX0 = 260, 470                                     # Vera and Cleo at the start
BTN = {"L": 140, "C": 540, "R": 940}                    # the three little panel buttons on the bench; the big red one at x 340
CROI = 640                                              # the croissant basket
GAP = {"L1": 0.3, "L2": 0.35, "L3": 1.6, "L4": 0.4, "L5": 2.4, "L6": 0.3, "L7": 0.0, "L8": 0.4, "L9": 0.0, "L10": 0.4}
VO, t, T = [], 0.0, {}
for k in order:
    if k == "L7":                                       # croissant, swallow, the left panel flips back, Vera's dash; then "Clean. Quiet."
        T["PICK"] = round(t + .35, 3); T["BEEPS"] = round(t + .7, 3)
        T["VDASH1"] = round(t + .9, 3); T["SNATCH"] = round(T["VDASH1"] + abs(CROI - 60 - VX0) / RUN_V, 3); T["GULP"] = round(T["SNATCH"] + .35, 3)
        T["FLIPL"] = round(T["GULP"] + .7, 3); T["VDASH2"] = round(T["FLIPL"] + .25, 3)
        T["SLAML"] = round(T["VDASH2"] + abs(CROI - 60 - (BTN["L"] - 55)) / RUN_V, 3)
        GAP["L7"] = round(T["SLAML"] + .9 - t, 3)
    if k == "L9":                                       # the inspector walks out
        T["WALKOUT"] = round(t + .25, 3); GAP["L9"] = round(.25 + (IX_OFF - IX) / WALK_V - .4, 3)
    start = t + GAP[k]
    if k == "L1": T["SLAM"] = round(start - .72, 3)     # Vera slams the big red button (11/13: before frame 1, so the wall is already turning on frame 1)
    if k == "L3": T["WALKIN"] = round(start - .1 - (IX_OFF - IX) / WALK_V, 3)                 # walks in, arrives as he speaks
    if k == "L5": T["FLIPR"] = round(t + .3, 3); T["CDASH"] = round(t + .55, 3); T["SLAMR"] = round(T["CDASH"] + (BTN["R"] + 45 - CX0) / RUN_V, 3)
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    t = start + d
T["VRET"] = round(T["SLAML"] + 1.0, 3); T["CRET"] = round(T["WALKOUT"] + 1.0, 3)
T["BEEP2"] = round(t + .45, 3); T["HIC"] = round(t + 1.55, 3)
END_BEAT = 3.6
ENDCARD = 2.5                                           # owner 11/13: the end card stays 2.5 s (vmkit endCard reads TL.ENDCARD)
DUR = round(t + END_BEAT + ENDCARD - 1.25, 2)           # the extra 1.25 s is a held tail after the button; the button lands where it did
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] - 0.08), 3)
    nxt = VO[i + 1]["t"] - 0.12 if i + 1 < len(VO) else DUR - 0.3
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.45, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + v["dur"] - 0.05, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 38 <= DUR <= 62, DUR
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
W7 = json.load(open(os.path.join(HERE, "voice", "out", "L7.json")))["words"]
T["STAMP"] = round(V["L7"]["t"] + [x for x in W7 if x["w"].lower().startswith("five")][0]["t0"] - .05, 3)
T.update({"IX": IX, "IX_OFF": IX_OFF, "VX0": VX0, "CX0": CX0, "BTN": BTN, "CROI": CROI, "WALK_V": WALK_V, "RUN_V": RUN_V})
SHOTS = [
    ["WIDE_OPEN", 0.0, V["L2"]["t"]],
    ["VERA_MED", V["L2"]["t"], T["WALKIN"] + .3],
    ["WIDE", T["WALKIN"] + .3, V["L3"]["t"]],
    ["INSP_CU", V["L3"]["t"], V["L4"]["t"]],
    ["VERA_CU", V["L4"]["t"], T["FLIPR"] - .25],
    ["WIDE", T["FLIPR"] - .25, V["L5"]["t"]],
    ["INSP_CU", V["L5"]["t"], V["L6"]["t"]],
    ["VERA_CU", V["L6"]["t"], end("L6") + .25],
    ["WIDE", end("L6") + .25, V["L7"]["t"]],
    ["INSP_MED", V["L7"]["t"], V["L8"]["t"]],
    ["WIDE", V["L8"]["t"], V["L9"]["t"]],
    ["VERA_CU", V["L9"]["t"], V["L10"]["t"]],
    ["CLEO_CU", V["L10"]["t"], T["BEEP2"] - .1],
    ["VERA_END", T["BEEP2"] - .1, DUR],
]
SHOTS = [[n, round(a, 3), round(b, 3)] for n, a, b in SHOTS]
for a, b in zip(SHOTS, SHOTS[1:]):
    assert abs(a[2] - b[1]) < 1e-6 and a[2] > a[1], (a, b)
TL = {"BPM": BPM, "BEAT": BEAT, "BAR": 4 * BEAT, "DUR": DUR, "ENDCARD": ENDCARD, "VO": VO, "SHOTS": SHOTS, **T}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
CH = {k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["chars"] for k in V}
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\nwindow.CHARS = " + json.dumps(CH) + ";\n")
print("DUR", DUR, {k: T[k] for k in T})
for v in VO:
    print(f'{v["id"]:4} {v["who"]:5} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
