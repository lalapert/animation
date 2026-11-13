"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 7 "Reduce to 1%": she shrinks the rent notice to 1%; the landlord comes down the stairs with a magnifying glass,
then copies his own notice at 400%. Script: channel/scripts/VL07_reduce_to_1.md
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
SUBCOL = {"VERA": "#d8ff7a", "CLEO": "#c9b8ff", "LANDLORD": "#ffd38a"}
WALK_V = 150 * 1.9                                      # the landlord walks: px per second (travel.js, 1.9 steps a second)
CX, VX, CPX = 200, 420, 620                             # Cleo, Vera, the copier (centre) on the bench
LX, LX_OFF = 870, 1200                                  # the landlord's spot, and off screen right (the stairs)
SPX = 470                                               # where the tiny copy lies on the bench
GAP = {"L1": 0.75, "L2": 0.4, "L3": 0.35, "L4": None, "L5": 0.35, "L6": None, "L7": 0.45, "L8": 0.35, "L9": 0.3,
       "L10": None, "L11": 0.45}
VO, t, T = [], 0.0, {}
for k in order:
    if k == "L4":                                       # the stairs door, three steps down, then he walks in from the right
        T["DOOR"] = round(t + .25, 3); T["WALKIN"] = round(T["DOOR"] + 1.3, 3)
        T["ARRIVE"] = round(T["WALKIN"] + (LX_OFF - LX) / WALK_V, 3)
        GAP["L4"] = round(T["ARRIVE"] + .05 - t, 3)
    if k == "L6":                                       # the magnifying glass comes down over the tiny copy
        T["MAG0"] = round(t + .15, 3); GAP["L6"] = .7
    if k == "L10":                                      # the dial to 400%, his notice into the slot, the copy erupts over Vera
        T["DIAL0"] = round(t + .25, 3); T["FEED"] = round(T["DIAL0"] + .9, 3); T["BLAST"] = round(T["FEED"] + .6, 3)
        GAP["L10"] = round(T["BLAST"] + 1.1 - t, 3)
    start = t + GAP[k]
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    t = start + d
T["WALKOUT"] = round(t + .1, 3)                          # "Friday." and he walks out to the right
T["FLAG"] = round(T["WALKOUT"] + .7, 3)                  # Vera's arm comes up out of the paper with the tiny notice
T["BOARDT"] = round(T["FLAG"] + 1.5, 3)                  # the eighth rent circle
ENDCARD = 2.5                                            # owner 11/13: the end card stays 2.5 s (vmkit endCard reads TL.ENDCARD)
DUR = round(T["BOARDT"] + 1.3 + .35 + ENDCARD, 2)        # the circle closes, then the card (its last 1.25 s is the held tail)
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
T.update({"CX": CX, "VX": VX, "CPX": CPX, "LX": LX, "LX_OFF": LX_OFF, "SPX": SPX, "WALK_V": WALK_V})
SHOTS = [
    ["COPIER_OPEN", 0.0, V["L1"]["t"] + 1.4],           # frame 1 to "Rent notice.": the copier, "1%", the notice going in, the speck
    ["VERA_CU", V["L1"]["t"] + 1.4, V["L2"]["t"]],
    ["CLEO_CU", V["L2"]["t"], V["L3"]["t"]],
    ["VERA_CU", V["L3"]["t"], end("L3") + .2],
    ["WIDE", end("L3") + .2, V["L4"]["t"]],
    ["LAND_CU", V["L4"]["t"], V["L5"]["t"]],
    ["VERA_CU", V["L5"]["t"], T["MAG0"]],
    ["MAG_CU", T["MAG0"], end("L6") + .15],
    ["VERA_CU", end("L6") + .15, V["L8"]["t"]],
    ["LAND_CU", V["L8"]["t"], V["L9"]["t"]],
    ["CLEO_CU", V["L9"]["t"], T["DIAL0"]],
    ["DIAL_CU", T["DIAL0"], T["BLAST"] - .1],
    ["WIDE", T["BLAST"] - .1, V["L10"]["t"]],
    ["PILE", V["L10"]["t"], V["L11"]["t"]],
    ["WIDE", V["L11"]["t"], T["BOARDT"]],
    ["BOARD_END", T["BOARDT"], DUR],
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
    print(f'{v["id"]:4} {v["who"]:8} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
