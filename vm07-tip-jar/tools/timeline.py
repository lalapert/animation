"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Void Mart 7 "Tip Jar": a comet is the first tip, a trucker tips a tooth, MAGS takes 60% with a claw and turns a tip screen on Pip.
Script: channel/scripts/VM07_tip_jar.md
"""
import json, os, re
TAGS = re.compile(r"\[[^\]]*\]\s*")              # eleven_v4 audio tags: direction, never shown

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BPM = 120.0
BEAT = 60.0 / BPM
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
order = [l["id"] for l in cfg["lines"]]
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
SUBCOL = {"PIP": "#5fe3cc", "RAE": "#ffb066", "MAGS": "#ff7d8c", "CUST": "#ffd08a"}
RAE_STEP, RAE_SPS, RAE_X0, RAE_X1 = 120, 1.9, 740, 600
RAEWALK = (RAE_X0 - RAE_X1) / (RAE_STEP * RAE_SPS)
# pause before each line (comic timing). L3 waits for the pod and the tooth; L8 for the claw; L10 for the tip-screen press;
# L12 for Rae's walk, the coin and the second claw
POD_IN, TOOTH = 1.5, 1.9
GAP = {"L1": 1.75, "L2": 0.35, "L3": round(0.3 + POD_IN + TOOTH, 3), "L4": 0.35, "L5": 0.3, "L6": 0.55, "L7": 0.3, "L8": 2.3,
       "L9": 0.35, "L10": 2.6, "L11": 0.35, "L12": round(0.9 + RAEWALK + 0.2 + 0.8 + 1.2, 3)}
VO, t, T = [], 0.0, {}
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
for k in order:
    start = t + GAP[k]
    if k == "L3": T["POD0"] = round(t + 0.3, 3)                                                 # the trucker's pod hums in after "It's a comet."
    if k == "L8": T["CLAW0"] = round(t + 0.25, 3)                                               # the claw comes down after "have hands!"
    if k == "L10": T["PANEL0"] = round(t + 0.05, 3)                                             # the tip screen is up; the press beat
    if k == "L12": T["END0"] = round(t + 0.25, 3)                                               # MAGS goes back up, Rae walks over
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    t = start + d
END_BEAT = 2.4
DUR = round(t + END_BEAT, 2)
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] - 0.08), 3)
    nxt = VO[i + 1]["t"] - 0.12 if i + 1 < len(VO) else DUR - 0.3
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.45, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + v["dur"] - 0.05, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 38 <= DUR <= 60, DUR
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
# the comet: in from the top left, off the incident board (1 -> 0), into the jar
T["HIT"], T["LAND"] = 0.45, 1.15
# the trucker: pod in, grin, hand to the tooth, yank, drop it in the jar; he leaves during Pip's "still warm"
T["POD1"] = round(T["POD0"] + POD_IN, 3)
T["GRAB"] = round(T["POD1"] + 0.45, 3); T["YANK"] = round(T["GRAB"] + 0.55, 3); T["DROP"] = round(T["YANK"] + 0.6, 3)
T["PODOUT"] = round(V["L5"]["t"] + 0.5, 3)
# Pip picks the jar up to hug it (L5) and puts it down hard on "hands!" (L7)
T["HUG"] = round(V["L5"]["t"] - 0.3, 3)
w7 = W("L7"); T["SETDOWN"] = round(V["L7"]["t"] + [x for x in w7 if x["w"].lower().startswith("hands")][0]["t0"] - 0.05, 3)
# the claw: down 1.0 s, grab, up 0.55 s; it hangs by MAGS during L8, then goes back into the hatch
T["CLAWGRAB"] = round(T["CLAW0"] + 1.0, 3); T["CLAWUP"] = round(T["CLAWGRAB"] + 0.25, 3); T["CLAWTOP"] = round(T["CLAWUP"] + 0.55, 3)
T["CLAWIN"] = round(end("L8") + 0.3, 3)
# MAGS comes down on its pole during L9; the screen pops up after the line; Pip sweats, presses 30%
T["MAGSDOWN"] = round(V["L9"]["t"] + 0.2, 3)
T["SCREEN"] = round(end("L9") + 0.1, 3)
T["LENS"] = round(T["SCREEN"] + 0.55, 3)
T["PRESS"] = round(V["L10"]["t"] - 0.75, 3)
# the end: MAGS back up, Rae walks over, a coin, the claw again, her palm over the jar, two taps, the claw goes home
T["RAEW0"] = round(T["END0"] + 0.5, 3); T["RAEW1"] = round(T["RAEW0"] + RAEWALK, 3)
T["COIN"] = round(T["RAEW1"] + 0.55, 3)
T["CLAW2"] = round(T["COIN"] + 0.55, 3); T["COVER"] = round(T["CLAW2"] + 0.45, 3); T["CLAWSTOP"] = round(T["CLAW2"] + 0.85, 3)
T["TAP1"] = round(end("L12") + 0.25, 3); T["TAP2"] = round(T["TAP1"] + 0.32, 3); T["CLAWBACK"] = round(T["TAP2"] + 0.45, 3)
assert T["CLAWSTOP"] < V["L12"]["t"], (T["CLAWSTOP"], V["L12"]["t"])
assert T["CLAWBACK"] + 0.8 < DUR - 0.4, (T["CLAWBACK"], DUR)
T["RAE_X0"], T["RAE_X1"], T["RAE_STEP"], T["RAE_SPS"] = RAE_X0, RAE_X1, RAE_STEP, RAE_SPS
SHOTS = [
    ["WIDE_OPEN", 0.0, V["L1"]["t"] - 0.1],
    ["PIP_CU", V["L1"]["t"] - 0.1, V["L2"]["t"]],
    ["RAE_CU", V["L2"]["t"], T["POD0"]],
    ["WIDE_POD", T["POD0"], T["GRAB"] - 0.15],
    ["CUST_MED", T["GRAB"] - 0.15, V["L4"]["t"]],
    ["RAE_CU", V["L4"]["t"], V["L5"]["t"] - 0.1],
    ["PIP_HUG", V["L5"]["t"] - 0.1, V["L6"]["t"]],
    ["MAGS_CU", V["L6"]["t"], V["L7"]["t"]],
    ["PIP_CU", V["L7"]["t"], T["CLAW0"]],
    ["WIDE_CLAW", T["CLAW0"], V["L8"]["t"]],
    ["MAGS_CU", V["L8"]["t"], V["L9"]["t"]],
    ["TWO_SHOT", V["L9"]["t"], T["SCREEN"] + 0.3],
    ["TIP_CU", T["SCREEN"] + 0.3, V["L10"]["t"]],
    ["RAE_CU", V["L10"]["t"], V["L11"]["t"]],
    ["PIP_CU", V["L11"]["t"], T["END0"]],
    ["WIDE_END", T["END0"], DUR],
]
SHOTS = [[n, round(a, 3), round(b, 3)] for n, a, b in SHOTS]
for a, b in zip(SHOTS, SHOTS[1:]):
    assert abs(a[2] - b[1]) < 1e-6 and a[2] > a[1], (a, b)
TL = {"BPM": BPM, "BEAT": BEAT, "BAR": 4 * BEAT, "DUR": DUR, "VO": VO, "SHOTS": SHOTS, **T}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
CH = {k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["chars"] for k in V}
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\nwindow.CHARS = " + json.dumps(CH) + ";\n")
print("DUR", DUR, T)
for v in VO:
    print(f'{v["id"]:4} {v["who"]:5} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
