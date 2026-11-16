"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 9 "Self-Destruct": Vera installs a self-destruct button that looks exactly like Cleo's red button remote; Cleo, who
never smiles, is delighted, shuffles the two while Vera gets coffee, and presses one. It blows up only itself.
Script: channel/scripts/VL09_self_destruct.md
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
SUBCOL = {"VERA": "#d8ff7a", "CLEO": "#c9b8ff"}
WALK_V = 150 * 1.9                                      # a walk: px per second (travel.js, 1.9 steps a second)
VX, CX = 300, 760                                       # Vera (left) and Cleo (right) behind the bench
VX_OFF = -260                                           # off the left edge (the coffee is out that way)
AX = 560                                                # the self-destruct remote on the bench, between them
SWAP, NSWAP = .42, 5                                    # the shell game: five swaps
COUNT = 5                                               # the wall display counts 5 .. 0
GAP = {"L1": 0.55, "L2": 0.35, "L3": 0.3, "L4": 0.45, "L5": 0.45, "L6": None, "L7": 0.3, "L8": None, "L9": None,
       "L10": None, "L11": 0.35}
VO, t, T = [], 0.0, {}
for k in order:
    start = t + (GAP[k] if GAP[k] is not None else 0)
    if k == "L6":                                       # she went for coffee; Cleo shuffled; she walks back in and stops
        T["SHUF1"] = round(T["SHUF0"] + .75 + NSWAP * SWAP + .35, 3)
        T["RET0"] = round(T["SHUF1"] - .55, 3)
        T["ARR"] = round(T["RET0"] + (VX - VX_OFF) / WALK_V, 3)
        start = T["ARR"] + .4
    if k == "L8":                                       # Cleo picks one of them up
        T["PICK0"] = round(t + .15, 3); T["PICK1"] = round(T["PICK0"] + .75, 3); start = T["PICK1"] + .1
    if k == "L9":                                       # she presses it; the wall panel wakes up and counts down
        T["PRESS"] = round(t + .45, 3); T["ALARM"] = round(T["PRESS"] + .45, 3); T["ZERO"] = round(T["ALARM"] + COUNT, 3)
        start = T["ALARM"] + .6
    if k == "L10":                                      # at zero it blows up only itself
        start = T["ZERO"] + 1.0
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    if k == "L5":
        T["WALK0"] = round(start + 1.05, 3); T["GONE"] = round(T["WALK0"] + (VX - VX_OFF) / WALK_V, 3)
        T["SHUF0"] = round(start + d + .2, 3)
    t = start + d
T["BOARDT"] = round(t + .8, 3)                           # the tenth rent circle
ENDCARD = 2.5                                            # owner 11/13: the end card stays 2.5 s (vmkit endCard reads TL.ENDCARD)
DUR = round(T["BOARDT"] + 1.3 + .35 + ENDCARD, 2)        # the circle closes, then the card (its last 1.25 s is the held tail)
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] - 0.08), 3)
    nxt = VO[i + 1]["t"] - 0.12 if i + 1 < len(VO) else DUR - 0.3
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.45, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + v["dur"] - 0.05, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 38 <= DUR <= 42, DUR                              # runbook 11/16: Volt Labs 42 s or less
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
assert end("L9") < T["ZERO"] - .3, "the abort line must end before zero"
assert T["SHUF0"] > T["WALK0"] + .4                      # she is on her way out before the shuffle starts
T.update({"VX": VX, "CX": CX, "VX_OFF": VX_OFF, "AX": AX, "SWAP": SWAP, "NSWAP": NSWAP, "COUNT": COUNT, "WALK_V": WALK_V})
SHOTS = [
    ["CLEO_OPEN", 0.0, V["L1"]["t"] + 1.3],             # frame 1: Cleo smiling, two red buttons, Vera's arm pointing at the new one
    ["WIDE", V["L1"]["t"] + 1.3, V["L2"]["t"]],
    ["CLEO_CU", V["L2"]["t"], V["L3"]["t"]],
    ["VERA_CU", V["L3"]["t"], V["L4"]["t"]],
    ["CLEO_CU", V["L4"]["t"], V["L5"]["t"]],
    ["WIDE", V["L5"]["t"], T["SHUF0"]],                 # "Don't touch it. I'm getting coffee." and off she goes
    ["CLEO_MED", T["SHUF0"], T["SHUF1"]],               # the shell game
    ["WIDE", T["SHUF1"], V["L6"]["t"]],                 # she walks back in with a mug
    ["VERA_MED", V["L6"]["t"], V["L7"]["t"]],
    ["CLEO_CU", V["L7"]["t"], T["PICK0"]],
    ["CLEO_MED", T["PICK0"], V["L8"]["t"]],             # Cleo picks one up
    ["VERA_MED", V["L8"]["t"], T["PRESS"] - .35],
    ["CLEO_CU", T["PRESS"] - .35, T["ALARM"]],          # and presses it
    ["TWO", T["ALARM"], V["L9"]["t"]],                  # the panel wakes: beacon, red light, 5
    ["VERA_MED", V["L9"]["t"], end("L9") + .25],
    ["CLEO_CU", end("L9") + .25, T["ZERO"] - 1.0],      # Cleo, still delighted
    ["PANEL_CU", T["ZERO"] - 1.0, T["ZERO"]],           # 1 ...
    ["CLEO_MED", T["ZERO"], V["L10"]["t"]],             # 0: the remote in her hands blows up itself, and only itself
    ["TWO", V["L10"]["t"], V["L11"]["t"]],              # the lab is fine; the panel reads COMPLETE
    ["CLEO_CU", V["L11"]["t"], T["BOARDT"]],
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
