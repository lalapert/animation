"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 14 "Doomsday Weather" (length_test: current, 40-42 s with the end card; Look 2): on the roof, a doomsday weather
machine aimed at eight billion people; Cleo brought a sled. The lever gives one tiny cloud; it drifts over the edge and snows on
the back yard only. "Maximum doom!": the drift rises to the roof. "Get in." "A villain does not go sledding." Smash cut: "Wheeeee!"
Waist-deep in the yard: "Again! Again! I mean... phase two." "Sure." Script: channel/scripts/VL14_doomsday_weather.md
Gaps are measured from the end of one line's speech to the start of the next one's (the takes' own lead and tail silences are
read from the word timings in voice/out/<id>.json).
"""
import json, os, re
TAGS = re.compile(r"\[[^\]]*\]\s*")              # eleven_v4 audio tags: direction, never shown

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BPM = 126.0
BEAT = 60.0 / BPM
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
order = [l["id"] for l in cfg["lines"]]
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
WORDS = {k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"] for k in order}
LEAD = {k: WORDS[k][0]["t0"] for k in order}
SPEND = {k: WORDS[k][-1]["t1"] for k in order}
SUBCOL = {"VERA": "#d8ff7a", "CLEO": "#c9b8ff"}
GAP = {"L1": .3, "L2": .35, "L3": .3, "L4": None, "L5": None, "L6": .35, "L7": .4, "L8": None, "L9": .35, "L10": None,
       "L11": None, "L12": .4}


def word(k, w, i=0):
    """time of the i-th word of line k that starts with w (inside the take)"""
    return [x for x in WORDS[k] if x["w"].lower().strip(".,:!?").startswith(w)][i]


VO, T = [], {}
send = 0.0
for k in order:
    sp0 = send + (GAP[k] if GAP[k] is not None else 0)
    if k == "L4":                                   # the insert: the screen, the power needle, the wind-up; then the wide: a puff
        T["INS0"] = round(send + .08, 3); T["PUFF"] = round(T["INS0"] + 1.75, 3); sp0 = T["PUFF"] + .75
    if k == "L5":                                   # the cloud drifts across and over the edge; the view down on three yards
        T["DRIFT0"] = round(send + .1, 3); T["DRIFT1"] = round(T["DRIFT0"] + 1.6, 3)
        T["DOWN0"] = round(T["DRIFT1"] - .15, 3); T["SNOW0"] = round(T["DOWN0"] + .55, 3); T["DOWN1"] = round(T["DOWN0"] + 2.0, 3)
        sp0 = T["DOWN1"] + .2
    if k == "L8":                                   # MAX: the machine bucks, the drift rises from the yard to the roof
        T["RISE0"] = round(send + .15, 3); T["RISE1"] = round(T["RISE0"] + 1.9, 3); sp0 = T["RISE1"] + .2
    if k == "L10":                                  # smash cut on the last word: the slope, the sled from the roof to the yard
        T["SLOPE0"] = round(send + .08, 3); sp0 = T["SLOPE0"] + .2
    if k == "L11":                                  # the landing: waist-deep in the snow, the sled stuck up between them
        T["LAND"] = round(send + .2, 3); sp0 = T["LAND"] + .7
    start = sp0 - min(LEAD[k], .3)
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    if k == "L2":
        T["LIFT"] = round(start + word("L2", "sled")["t0"] - .15, 3)                 # she lifts the sled a little
    if k == "L3":
        T["LEVER1"] = round(start + word("L3", "doom")["t0"], 3)                     # "This is DOOM." the lever, all the way
    if k == "L7":
        T["LEVER2"] = round(start + word("L7", "doom")["t0"] - .05, 3)               # "Maximum DOOM!" the lever again, to MAX
    if k == "L8":
        T["LAY0"] = round(start + LEAD[k] - .1, 3); T["LAY1"] = round(T["LAY0"] + .9, 3)   # she lays the sled on the drift
    if k == "L10":
        T["RIDE1"] = round(start + SPEND[k] + .25, 3)                               # the sled reaches the bottom of the frame
    if k == "L11":
        T["COOL"] = round(start + word("L11", "i")["t0"] - .1, 3)                    # "I mean...": she catches herself
    send = start + SPEND[k]
T["BUTTON"] = round(send, 3)
ENDCARD = 2.5
DUR = round(send + .5 + ENDCARD, 2)                 # owner 11/13: the card holds 2.5 s after the button lands
assert T["BUTTON"] < DUR - ENDCARD, (T["BUTTON"], DUR - ENDCARD)
T["ASK"] = "DOOM OR SNOW DAY?"                      # owner 11/16: the two-choice question under the end card
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] + LEAD[v["id"]] - 0.1), 3)
    nxt = VO[i + 1]["t"] + LEAD[VO[i + 1]["id"]] - 0.14 if i + 1 < len(VO) else DUR - ENDCARD + .4
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.4, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + SPEND[v["id"]] - 0.02, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 40 <= DUR <= 42, DUR                         # length_test: current (review 11/26): 40-45 s, Volt Labs <= 42 s with the card
V = {v["id"]: v for v in VO}
V["L10"]["asr_final"] = "Whee!"                    # the same scream: the take alone transcribes as "Wee!", in the film as "Whee"
end = lambda k: V[k]["t"] + SPEND[k]
w = lambda k, x, i=0: V[k]["t"] + word(k, x, i)["t0"]
T["LOOK"] = 2                                       # Look 2 (vmkit.js how-to)
ACT = [["CLEO", w("L1", "eight"), "tilt", .8, .9],          # Cleo, listening: eight billion
       ["VERA", w("L2", "sled") + .25, "back", .8, .6],     # "I brought a sled." Vera recoils
       ["VERA", T["LEVER1"], "pop", 1.1, .7],               # "DOOM." (the lever)
       ["VERA", T["PUFF"] + .2, "pop", .9, .7],             # the tiny cloud
       ["CLEO", T["PUFF"] + .35, "tilt", -.6, 1.0],
       ["VERA", T["DRIFT0"] + .2, "turn", .5, 1.3],         # they follow it across
       ["CLEO", T["DRIFT0"] + .3, "turn", .4, 1.2],
       ["VERA", w("L5", "planet") - .1, "shake", 1, .8],    # "Not the yard! The PLANET!"
       ["CLEO", w("L6", "start") , "shrug", .7, .6],        # "It's a start."
       ["VERA", end("L6") + .1, "slump", .7, .6],
       ["VERA", T["LEVER2"], "pop", 1.2, .7],               # "Maximum DOOM!"
       ["CLEO", T["RISE0"] + .3, "lean", .6, 1.2],          # the drift comes up to the roof
       ["VERA", w("L9", "villain"), "back", .9, 1.2],       # "A villain does not go sledding." (haughty)
       ["VERA", V["L11"]["t"] + LEAD["L11"], "pop", 1.1, .6],   # "Again!"
       ["VERA", T["COOL"] + .1, "nod", .7, .7],             # "I mean... phase two."
       ["CLEO", w("L12", "sure"), "nod", .6, .6]]           # "Sure."
T["ACT"] = [[a, round(b, 3), c, d, e] for a, b, c, d, e in ACT]
SHOTS = [
    ["OPEN", 0.0, V["L2"]["t"]],                    # frame 1: the machine, its banner and screen, Vera at the lever, Cleo with the sled
    ["CLEO_CU", V["L2"]["t"], V["L3"]["t"]],        # "I brought a sled."
    ["VERA_MED", V["L3"]["t"], T["INS0"]],          # "This is not a snow day, Cleo. This is DOOM." (the lever)
    ["INSERT", T["INS0"], T["PUFF"] - .1],          # the screen TARGET: 8 BILLION PEOPLE and the power needle
    ["WIDE", T["PUFF"] - .1, T["DOWN0"]],           # one tiny cloud; "Why is it so small?"; it drifts across and over the edge
    ["DOWN", T["DOWN0"], T["DOWN1"]],               # three back yards: snow only in ours
    ["OTS_CLEO", T["DOWN1"], V["L6"]["t"]],         # "Not the yard! The PLANET!" over Cleo's shoulder
    ["CLEO_CU", V["L6"]["t"], V["L7"]["t"]],        # "It's a start."
    ["VERA_MED", V["L7"]["t"], T["RISE0"]],         # "Maximum doom!" (the lever)
    ["WIDE", T["RISE0"], V["L9"]["t"]],             # the drift rises to the roof; "Get in." she lays the sled on it
    ["VERA_PUSH", V["L9"]["t"], T["SLOPE0"]],       # "A villain does not go sledding." (push-in, the biggest punchline)
    ["SLOPE", T["SLOPE0"], T["LAND"]],              # smash cut: "Wheeeee!" down the drift from the roof to the yard
    ["YARD_VERA", T["LAND"], V["L12"]["t"]],        # waist-deep: "Again! Again! I mean... phase two."
    ["END", V["L12"]["t"], DUR],                    # "Sure." the two of them and the sled (faces under y 780 for the card)
]
SHOTS = [[n, round(a, 3), round(b, 3)] for n, a, b in SHOTS]
for a, b in zip(SHOTS, SHOTS[1:]):
    assert abs(a[2] - b[1]) < 1e-6 and a[2] > a[1], (a, b)
TL = {"BPM": BPM, "BEAT": BEAT, "BAR": 4 * BEAT, "DUR": DUR, "ENDCARD": ENDCARD, "VO": VO, "SHOTS": SHOTS, **T}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
CH = {k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["chars"] for k in V}
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\nwindow.CHARS = " + json.dumps(CH) + ";\n")
print("DUR", DUR, {k: T[k] for k in T if k != "ACT"})
for v in VO:
    print(f'{v["id"]:4} {v["who"]:9} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
