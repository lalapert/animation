"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 10 "The Reverse Oven": Vera's Thanksgiving turkey is burnt; her reverse oven runs time backwards on whatever is inside:
golden, raw, the grocery bag, the receipt, the cash. Everything goes in for rent money, until Cleo puts in the alarm clock and
the whole episode rewinds to its first frame, which plays again. Script: channel/scripts/VL10_the_reverse_oven.md
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
RUN_V = 190 * 2.8                                       # a dash: px per second (as VL6)
VX, CX, CX_DIAL = 320, 900, 790                         # Vera (left), Cleo (right); Cleo leans in behind the oven to turn its dial
VX_GRAB = 250                                           # where Vera stops to grab the old laser gauntlet off the bench
REW_LEN = 3.2                                           # the rewind: the whole episode backwards, to frame 1
GAP = {"L1": 0.55, "L2": 0.35, "L3": 0.35, "L4": None, "L5": None, "L6": None, "L7": 0.35, "L8": None, "L9": 0.35,
       "L10": 0.3, "L11": None, "L12": None}
VO, t, T = [], 0.0, {}
for k in order:
    start = t + (GAP[k] if GAP[k] is not None else 0)
    if k == "L4":                                       # the tray slides in, the dial, then the burnt turkey un-burns
        T["REV0"] = round(T["DIAL"] + .15, 3); T["G1"] = round(T["REV0"] + 1.0, 3); start = T["G1"] + .25
    if k == "L5":
        T["RAW"] = round(t + .5, 3); start = T["RAW"] + .3
    if k == "L6":
        T["BAG"] = round(t + .3, 3); T["RECEIPT"] = round(T["BAG"] + .6, 3); T["CASH"] = round(T["RECEIPT"] + .6, 3)
        T["POP"] = round(T["CASH"] + .45, 3); start = T["POP"] + .5
    if k == "L8":                                       # the dash for the gauntlet and back; in it goes; more cash
        T["RUN0"] = round(t + .1, 3); T["GRAB"] = round(T["RUN0"] + (VX - VX_GRAB) / RUN_V, 3)
        T["RUN1"] = round(T["GRAB"] + .3, 3); T["BACK"] = round(T["RUN1"] + (VX - VX_GRAB) / RUN_V, 3)
        T["OPEN2"] = round(T["BACK"] + .05, 3); T["IN2"] = round(T["OPEN2"] + .35, 3); T["SHUT2"] = round(T["IN2"] + .2, 3)
        T["DIAL2"] = round(T["SHUT2"] + .25, 3); T["CASH2"] = round(T["DIAL2"] + .7, 3); T["POP2"] = round(T["CASH2"] + .3, 3)
        start = T["POP2"] + .45
    if k == "L11":                                      # Cleo puts the clock in and turns the dial: the rewind; then frame 1 again
        T["C_PICK"] = round(V0["L9"]["t"] - .7, 3)
        T["C_OPEN"] = round(t + .15, 3); T["C_IN"] = round(T["C_OPEN"] + .45, 3); T["C_SHUT"] = round(T["C_IN"] + .25, 3)
        T["C_LEAN"] = round(T["C_SHUT"] + .05, 3); T["C_DIAL"] = round(T["C_LEAN"] + .45, 3)
        T["REW0"] = round(T["C_DIAL"] + .3, 3); T["REW1"] = round(T["REW0"] + REW_LEN, 3)
        start = T["REW1"] + V0["L1"]["t"]
    if k == "L12":
        start = T["REW1"] + V0["L2"]["t"]
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    V0 = {v["id"]: v for v in VO}
    if k == "L3":                                       # "Then we un-cook it.": the door, the tray, the door, the dial
        T["OPEN1"] = round(start + .55, 3); T["SLIDE0"] = round(T["OPEN1"] + .25, 3); T["IN1"] = round(T["SLIDE0"] + .6, 3)
        T["SHUT1"] = round(T["IN1"] + .2, 3); T["DIAL"] = round(T["SHUT1"] + .3, 3)
        t = max(start + d, T["DIAL"])
        continue
    t = start + d
T["BOARDT"] = round(t + .45, 3)                          # the board, inside the end card (owner 11/16: no extra time)
ENDCARD = 2.5
DUR = round(T["BOARDT"] + ENDCARD, 2)                    # the card is up from BOARDT (the circle closes under it)
T["ASK"] = "DINNER OR CASH?"                             # owner 11/16: the two-choice question under the end card
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] - 0.08), 3)
    nxt = VO[i + 1]["t"] - 0.12 if i + 1 < len(VO) else T["BOARDT"]
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.45, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + v["dur"] - 0.05, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 40 <= DUR <= 42, DUR                              # runbook 11/16 + brief: 40-42 s with the card
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
assert end("L10") < T["C_OPEN"] and T["REW0"] > T["C_DIAL"]
T.update({"VX": VX, "CX": CX, "CX_DIAL": CX_DIAL, "VX_GRAB": VX_GRAB, "RUN_V": RUN_V, "REW_LEN": REW_LEN})
SHOTS = [
    ["VERA_OPEN", 0.0, V["L2"]["t"]],                   # frame 1: Vera big, the burnt turkey, the reverse oven
    ["CLEO_CU", V["L2"]["t"], V["L3"]["t"]],
    ["TWO", V["L3"]["t"], T["REV0"]],                   # the tray slides in, the dial
    ["OVEN_CU", T["REV0"], V["L4"]["t"]],               # un-burning: golden
    ["VERA_MED", V["L4"]["t"], T["RAW"] - .15],
    ["OVEN_CU", T["RAW"] - .15, V["L5"]["t"]],          # raw
    ["VERA_MED", V["L5"]["t"], T["BAG"] - .15],
    ["OVEN_CU", T["BAG"] - .15, T["POP"] + .3],         # the grocery bag, the receipt, the cash; the door pops open
    ["VERA_CU", T["POP"] + .3, T["RUN0"]],              # "It turned dinner back into money." "Everything goes in!"
    ["WIDE", T["RUN0"], T["POP2"] + .2],                # the dash, the gauntlet goes in, more cash
    ["VERA_MED", T["POP2"] + .2, V["L9"]["t"]],         # "Rent! Actual rent!"
    ["CLEO_MED", V["L9"]["t"], V["L10"]["t"]],          # "What about this?" (the alarm clock)
    ["VERA_CU", V["L10"]["t"], end("L10") + .15],
    ["TWO", end("L10") + .15, T["REW0"]],               # the clock goes in, Cleo turns the dial
    ["REWIND", T["REW0"], T["REW1"]],                   # the whole episode backwards to frame 1
    ["VERA_OPEN", T["REW1"], V["L12"]["t"]],            # ... and it plays again
    ["CLEO_CU", V["L12"]["t"], T["BOARDT"]],
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
