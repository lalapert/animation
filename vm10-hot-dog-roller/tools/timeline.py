"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Void Mart 10 "Hot Dog Roller": the hot dogs have been rolling since the Big Bang; Pip switches the roller off and time slows down;
only Rae moves at her usual speed and switches it back on; the customer bites. Script: channel/scripts/VM10_hot_dog_roller.md
Slow time: SLOW(t) below is the world's clock while the roller is off (film.js mirrors it; mix.py warps the room and the roller
with it, so picture and sound slow together). Rae and every spoken line run on real time.
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
RAE_X0, RAE_X1, RAE_STEP, RAE_SPS = 690, 560, 60, 1.9       # Rae's walk behind the counter to the roller's switch, at her usual speed
RAEWALK = (RAE_X0 - RAE_X1) / (RAE_STEP * RAE_SPS)
# pause before each line (comic timing): L3 waits for the welded hot dog; L8 for the second one and MAGS's jingle; L10 for the
# slow-down to settle; L11 for the switch back on and the world catching up; L13 for the bite
GAP = {"L1": 0.3, "L2": 0.3, "L3": 2.0, "L4": 0.75, "L5": 0.35, "L6": 0.35, "L7": 0.5, "L8": 1.35, "L9": 0.35, "L10": 2.9,
       "L11": 1.45, "L12": 0.35, "L13": 1.35}
VO, t, T = [], 0.0, {}
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
for k in order:
    start = t + GAP[k]
    if k == "L3": T["TONG0"] = round(t + 0.05, 3)                                               # Pip's tongs on the welded hot dog
    if k == "L8": T["TONG2"] = round(t + 0.2, 3)                                                # the second one
    if k == "L10": T["OFF"] = round(t + 0.15, 3)                                                # the switch: time slows
    if k == "L11": T["ON"] = round(t + 0.35, 3)                                                 # Rae switches it back on
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    t = start + d
END_BEAT = 2.7
ENDCARD = 2.5                                   # owner 11/13: the end card holds 2.5 s; the extra 1.25 s is a held tail after the button
DUR = round(t + END_BEAT + (ENDCARD - 1.25), 2)
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] - 0.08), 3)
    nxt = VO[i + 1]["t"] - 0.12 if i + 1 < len(VO) else DUR - 0.3
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.45, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + v["dur"] - 0.05, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 40 <= DUR <= 45, DUR                     # owner 11/16: 40-45 s with the end card
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
# the welded hot dog: tugged, cracks free, into a bun, handed over
T["CRACK"] = round(T["TONG0"] + 0.85, 3); T["HAND"] = round(T["CRACK"] + 0.6, 3)
T["TAP"] = round(end("L3") + 0.05, 3)                                                           # the customer taps it: tock tock
# slow time: the rate falls from 1 to SLOWR over DECEL after OFF, stays there, and comes back to 1 over ACCEL after ON
SLOWR, DECEL, ACCEL = 0.07, 0.8, 0.4
T["SLOWR"], T["DECEL"], T["ACCEL"] = SLOWR, DECEL, ACCEL
# Rae, at her usual speed: "Rule one:" where she stands, walks to the switch on "never turn off the roller." and flips it on
T["RAEW0"] = round(V["L10"]["t"] + 1.2, 3); T["RAEW1"] = round(T["RAEW0"] + RAEWALK, 3)
T["REACH"] = round(T["ON"] - 0.5, 3)
# in the slow time (world clock): a drop of drool starts to fall; Pip's slow blink
T["DROOL"] = round(T["OFF"] + 1.0, 3); T["PIPBLINK"] = round(T["OFF"] + 1.6, 3)
# after: the world catches up; the bite; the button
T["BITE"] = round(V["L13"]["t"] - 0.75, 3)
T["BUTTON"] = round(end("L13") + 0.45, 3)
assert T["BUTTON"] < DUR - ENDCARD, (T["BUTTON"], DUR - ENDCARD)
assert T["RAEW1"] < T["REACH"] - 0.1, (T["RAEW1"], T["REACH"])
T["RAE_X0"], T["RAE_X1"], T["RAE_STEP"], T["RAE_SPS"] = RAE_X0, RAE_X1, RAE_STEP, RAE_SPS
T["ASK"] = "EAT IT OR RUN?"                     # owner 11/16: the two-choice question under the end card
SHOTS = [
    ["OPEN", 0.0, V["L2"]["t"]],
    ["PIP_MED", V["L2"]["t"], T["HAND"] - 0.2],
    ["CUST_MED", T["HAND"] - 0.2, V["L4"]["t"]],
    ["RAE_CU", V["L4"]["t"], V["L5"]["t"]],
    ["CUST_MED", V["L5"]["t"], V["L6"]["t"]],
    ["RAE_CU", V["L6"]["t"], V["L7"]["t"]],
    ["CUST_MED", V["L7"]["t"], V["L8"]["t"] - 0.55],
    ["MAGS_MED", V["L8"]["t"] - 0.55, end("L8") + 0.1],
    ["PIP_MED", end("L8") + 0.1, T["OFF"] + 0.3],
    ["SLOW_WIDE", T["OFF"] + 0.3, V["L11"]["t"]],
    ["PIP_MED", V["L11"]["t"], V["L12"]["t"]],
    ["END_WIDE", V["L12"]["t"], DUR],                                                            # "It does that.", the bite, the button
]
SHOTS = [[n, round(a, 3), round(b, 3)] for n, a, b in SHOTS]
for a, b in zip(SHOTS, SHOTS[1:]):
    assert abs(a[2] - b[1]) < 1e-6 and a[2] > a[1], (a, b)
TL = {"BPM": BPM, "BEAT": BEAT, "BAR": 4 * BEAT, "DUR": DUR, "ENDCARD": ENDCARD, "VO": VO, "SHOTS": SHOTS, **T}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
CH = {k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["chars"] for k in V}
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\nwindow.CHARS = " + json.dumps(CH) + ";\n")
print("DUR", DUR, {k: v for k, v in T.items() if not k.startswith("RAE_")})
for v in VO:
    print(f'{v["id"]:4} {v["who"]:5} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
