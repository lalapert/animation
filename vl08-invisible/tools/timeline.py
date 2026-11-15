"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 8 "Invisible": Vera drinks an invisibility potion; only her lab coat goes out into the street, where nobody is
impressed until her face comes back. Script: channel/scripts/VL08_invisible.md
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
SUBCOL = {"VERA": "#d8ff7a", "CLEO": "#c9b8ff", "MAN": "#ffd38a"}
WALK_V = 150 * 1.9                                      # a walk: px per second (travel.js, 1.9 steps a second)
EXIT_V = 420                                            # the coat striding out of the lab
COAT_X0, COAT_X = 145, 600                              # street: the coat steps out of the building door and walks to beside the man
MAN_X, CLEO_X, CLEO_X0 = 850, 880, 1230                 # the man behind the hedge; Cleo walks in from off right
HUD_LEN = 3.0
GAP = {"L1": 0.6, "L2": None, "L3": 0.45, "L4": None, "L5": 0.35, "L6": 0.4, "L7": 0.35, "L8": 0.35, "L9": 0.35,
       "L10": None, "L11": None, "L12": 0.3, "L13": None}
VO, t, T = [], 0.0, {}
for k in order:
    if k == "L2":                                       # the spec scan of the empty coat, then Cleo
        T["HUD0"] = round(t + .2, 3); T["HUD1"] = round(T["HUD0"] + HUD_LEN, 3); GAP["L2"] = round(T["HUD1"] + .2 - t, 3)
    if k == "L4":                                       # the coat strides out of the lab; the street; it walks in and stops
        T["EXIT"] = round(t + .1, 3); T["STREET"] = round(T["EXIT"] + 1.1, 3)
        T["OUT"] = round(T["STREET"] + .35, 3)           # the front door opens; it steps out
        T["ARRIVE"] = round(T["OUT"] + (COAT_X - COAT_X0) / WALK_V, 3)
        GAP["L4"] = round(T["ARRIVE"] + .3 - t, 3)
    start = t + (GAP[k] if GAP[k] is not None else 0)
    if k == "L10":                                      # after he tucks a dollar into the coat's pocket
        start = T["TIP_END"] + .25
    if k == "L11":                                      # the potion wears off: fizz, a flicker, her face; then he looks and screams
        T["FIZZ"] = round(t + .4, 3); T["VISIBLE"] = round(T["FIZZ"] + .55, 3); start = T["VISIBLE"] + .5
    if k == "L13":                                      # Cleo walks in from the right behind the hedge
        T["CWALK"] = round(t + .3, 3); T["CARRIVE"] = round(T["CWALK"] + (CLEO_X0 - CLEO_X) / WALK_V, 3); start = T["CARRIVE"] + .1
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    if k == "L9":
        T["TIP"] = round(start + .25, 3); T["TIP_END"] = round(start + 1.05, 3)
    if k == "L11":
        T["RUN"] = round(start + .35, 3)
    t = start + d
T["BOARDT"] = round(t + .6, 3)                           # the ninth rent circle (back in the lab)
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
T.update({"COAT_X0": COAT_X0, "COAT_X": COAT_X, "MAN_X": MAN_X, "CLEO_X": CLEO_X, "CLEO_X0": CLEO_X0, "WALK_V": WALK_V, "EXIT_V": EXIT_V})
SHOTS = [
    ["LAB_OPEN", 0.0, T["HUD0"]],                        # frame 1: the empty coat at the bench, goggles, the potion
    ["HUD", T["HUD0"], T["HUD1"]],
    ["CLEO_CU", T["HUD1"], V["L3"]["t"]],
    ["LAB_COAT", V["L3"]["t"], end("L3") - .3],
    ["LAB_WIDE", end("L3") - .3, T["STREET"]],          # it strides out
    ["STREET_WIDE", T["STREET"], V["L4"]["t"]],         # the coat walks down the street on its own
    ["COAT_CU", V["L4"]["t"], V["L5"]["t"]],
    ["MAN_CU", V["L5"]["t"], V["L6"]["t"]],
    ["COAT_CU", V["L6"]["t"], V["L7"]["t"]],
    ["MAN_CU", V["L7"]["t"], V["L8"]["t"]],
    ["COAT_CU", V["L8"]["t"], V["L9"]["t"]],
    ["TWO_SHOT", V["L9"]["t"], V["L10"]["t"]],          # the dollar into the pocket
    ["COAT_CU", V["L10"]["t"], V["L11"]["t"]],          # "...Thank you." and the potion wears off: her face comes back
    ["MAN_CU", V["L11"]["t"], T["RUN"] + .1],
    ["STREET_WIDE", T["RUN"] + .1, V["L12"]["t"]],      # he runs
    ["COAT_CU", V["L12"]["t"], T["CWALK"]],             # (Vera now)
    ["STREET_WIDE", T["CWALK"], V["L13"]["t"]],         # Cleo walks in
    ["CLEO_ST", V["L13"]["t"], T["BOARDT"]],
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
