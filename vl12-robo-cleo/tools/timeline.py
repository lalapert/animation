"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 12 "Robo-Cleo": Vera builds a robot to replace Cleo. It rings the desk bell eight times a second, then "press nothing
until I say so" -> "Pressing.": the lights, the toaster, the fridge's ice, running up and down the bench. Cleo: "Do not press your
off switch." -> "Pressing." It powers down and falls over. "It's me. But faster." "Double pay." "Double zero is still zero."
Cleo's finger over the robot's switch: "Triple! Triple zero!" "Deal." Script: channel/scripts/VL12_robo_cleo.md
Gaps are measured from the end of one line's speech to the start of the next one's (the takes' own lead and tail silences are
read from the word timings in voice/out/<id>.json).
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
WORDS = {k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"] for k in order}
LEAD = {k: WORDS[k][0]["t0"] for k in order}                      # silence before the first word of each take
SPEND = {k: WORDS[k][-1]["t1"] for k in order}                     # the end of the last word
SUBCOL = {"VERA": "#d8ff7a", "CLEO": "#c9b8ff", "ROBO": "#7ff3e6"}  # Robo-Cleo: its LED teal
VX, CX = 320, 900                                                  # Vera (left), Cleo (right), behind the bench
RX0, RX_L, RX_C = 585, 222, 615                                    # Robo-Cleo on the bench: home, at the toaster and fridge, in front of Cleo
RUN_V = 900.0                                                      # its run along the bench top, px per second
NDING, DING_DT = 8, .125                                           # eight presses of the desk bell in a second
GAP = {"L1": .3, "L2": .3, "L3": .3, "L4": None, "L5": None, "L6": None, "L7": .18, "L8": .18, "L9": None, "L10": None,
       "L11": None, "L12": .5, "L13": .22, "L14": None, "L15": .3}
VO, T = [], {}
send = 0.0                                                         # where the last line's speech ended
for k in order:
    sp0 = send + (GAP[k] if GAP[k] is not None else 0)            # where this line's speech starts
    if k == "L4":                                                  # the bell, eight times, as soon as she says "Press."
        T["DING0"] = round(send + .08, 3); T["DING1"] = round(T["DING0"] + (NDING - 1) * DING_DT, 3)
        sp0 = T["DING1"] + .45
    if k == "L5":                                                  # the head turns to the wall switch: off. "Pressing." in the dark
        T["TURN1"] = round(send - .3, 3); T["SW1"] = round(send + .12, 3); sp0 = T["SW1"] + .4
    if k == "L6":                                                  # on, off, on; the run left; the toaster; the ice
        T["SW2"] = round(send + .12, 3); T["SW3"] = round(T["SW2"] + .17, 3); T["SW4"] = round(T["SW3"] + .17, 3)
        T["RUN1"] = round(T["SW4"] + .14, 3); T["ARR1"] = round(T["RUN1"] + (RX0 - RX_L) / RUN_V, 3)
        T["TOAST1"] = round(T["ARR1"] + .1, 3); T["ICE1"] = round(T["TOAST1"] + .32, 3)
        sp0 = T["TOAST1"] + .25
    if k == "L9":                                                  # the robot runs back right and stops in front of Cleo
        sp0 = max(send + .2, T["ARR2"] + .15)
    if k == "L10":                                                 # it looks up at her, then down at its own switch
        T["LOOKDN"] = round(send + .1, 3); sp0 = T["LOOKDN"] + .4
    if k == "L11":                                                 # it presses OFF, powers down, falls over; Vera frozen
        T["OFF"] = round(send + .08, 3); T["FALL"] = round(T["OFF"] + .62, 3); T["LAND"] = round(T["FALL"] + .32, 3)
        sp0 = T["LAND"] + 1.0
    if k == "L14":                                                 # Cleo's finger over the robot's switch; its eyes blink on once
        T["HOVER0"] = round(send + .12, 3); T["HOVER"] = round(T["HOVER0"] + .35, 3); T["BLIP"] = round(T["HOVER"] + .25, 3)
        sp0 = T["BLIP"] + .22
    start = sp0 - min(LEAD[k], .3)
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    send = start + SPEND[k]
    V0 = {v["id"]: v for v in VO}
    if k == "L7":                                                  # "Pressing things.": both arms at once, toaster and ice again
        T["BOTH"] = round(start + LEAD[k] + .35, 3)
    if k == "L8":
        T["RUN2"] = round(start + LEAD[k] + .25, 3); T["ARR2"] = round(T["RUN2"] + (RX_C - RX_L) / RUN_V, 3)
    if k == "L15":
        T["UNHOVER"] = round(start + LEAD[k] + .35, 3)
T["BOARDT"] = round(send + .4, 3)                                  # the board, inside the end card (owner 11/16: no extra time)
ENDCARD = 2.5
DUR = round(T["BOARDT"] + ENDCARD, 2)
T["ASK"] = "CLEO OR ROBO-CLEO?"                                    # owner 11/16: the two-choice question under the end card
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] + LEAD[v["id"]] - 0.1), 3)
    nxt = VO[i + 1]["t"] + LEAD[VO[i + 1]["id"]] - 0.14 if i + 1 < len(VO) else T["BOARDT"]
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.4, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + SPEND[v["id"]] - 0.02, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 40 <= DUR <= 42, DUR                                        # brief: 40-42 s with the card
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
T.update({"VX": VX, "CX": CX, "RX0": RX0, "RX_L": RX_L, "RX_C": RX_C, "RUN_V": RUN_V, "NDING": NDING, "DING_DT": DING_DT})
SHOTS = [
    ["VERA_OPEN", 0.0, V["L2"]["t"]],                              # frame 1: Vera big, presenting Robo-Cleo on the bench
    ["PAIR", V["L2"]["t"], V["L3"]["t"]],                          # Cleo and her copy side by side: "Cheaper than free?"
    ["MID", V["L3"]["t"], T["SW4"] + .1],                          # "Press." the bell; "press nothing"; the switch; the dark
    ["WIDE", T["SW4"] + .1, V["L9"]["t"]],                         # the run, the toaster, the ice; back to Cleo
    ["CLEO_MED", V["L9"]["t"], T["LOOKDN"] - .05],                 # "Do not press your off switch."
    ["ROBO", T["LOOKDN"] - .05, T["LAND"] + .3],                   # it looks down; "Pressing."; off; it falls over
    ["VERA_CU", T["LAND"] + .3, V["L11"]["t"]],                    # Vera, frozen
    ["CLEO_CU", V["L11"]["t"], V["L13"]["t"]],                     # "It's me. But faster." "Double pay."
    ["VERA_MED", V["L13"]["t"], T["HOVER0"] - .05],                # "Double zero is still zero."
    ["THREAT", T["HOVER0"] - .05, V["L14"]["t"]],                  # Cleo's finger over the switch
    ["VERA_CU", V["L14"]["t"], V["L15"]["t"]],                     # "Triple! Triple zero!"
    ["THREAT", V["L15"]["t"], T["BOARDT"]],                        # "Deal." (the finger comes away)
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
    print(f'{v["id"]:4} {v["who"]:6} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
