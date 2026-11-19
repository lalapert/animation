"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 11 "Doorbuster": one doom capacitor left in the whole city, a Black Friday line around the block, and a rocket strapped
to a shopping cart. Cleo lights it on "two"; past the line, through the opening doors, down the aisle, the last box grabbed, a crash
into a box pyramid. "I ordered one online." "You said 'rocket.'" She lights it again. Script: channel/scripts/VL11_doorbuster.md
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
words = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
SUBCOL = {"VERA": "#d8ff7a", "CLEO": "#c9b8ff", "SHOPPER": "#ffd38a", "EMPLOYEE": "#9fe6ff"}
CART_X0, DOOR_X = 420, 3100                              # the street: the end of the line; the store's doors
RUN_V, ACC = 760.0, .5                                   # the rocket cart: top speed px/s, seconds to reach it
AISLE_X0, GRAB_X, CRASH_X = -260, 1880, 2080             # the store: in at the left, the last box, the box pyramid
REVEAL = 1.9                                             # the pan along the line to the store
GAP = {"L1": .55, "L2": .35, "L3": None, "L4": .35, "L5": None, "L6": None, "L7": None, "L8": None, "L9": .35, "L10": .35,
       "L11": .35, "L12": None}
def run_time(dist):                                      # time to cover dist from a standstill (linear ramp to RUN_V over ACC)
    ramp = RUN_V * ACC / 2
    return (2 * dist * ACC / RUN_V) ** .5 if dist <= ramp else ACC + (dist - ramp) / RUN_V
VO, t, T = [], 0.0, {}
for k in order:
    start = t + (GAP[k] if GAP[k] is not None else 0)
    if k == "L3":                                        # the line, all the way to the store
        T["REV0"] = round(t + .3, 3); T["REV1"] = round(T["REV0"] + REVEAL, 3); start = T["REV1"] + .25
    if k == "L5":                                        # Cleo presses on "two"; the rocket lights; the cart shakes, then goes
        T["LAUNCH"] = round(T["IGNITE"] + .55, 3)
        T["DOOR"] = round(T["LAUNCH"] + run_time(DOOR_X - CART_X0), 3)
        start = T["LAUNCH"] + .6
    if k == "L6":                                        # "Happy Black Fri-": cut where the cart comes through the doors
        fr = [w for w in words("L6") if w["w"].lower().startswith("fri")][0]
        T["L6CUT"] = round(fr["t0"] + .22, 3)
        start = T["DOOR"] - T["L6CUT"]
        assert start > t + .2, (start, t)
    if k == "L7":                                        # inside: down the aisle
        T["AISLE"] = round(T["DOOR"] + .55, 3); start = T["AISLE"] + .15
        T["GRAB"] = round(T["AISLE"] + run_time(GRAB_X - AISLE_X0) * .0 + (GRAB_X - AISLE_X0) / RUN_V, 3)
        T["CRASH"] = round(T["AISLE"] + (CRASH_X - AISLE_X0) / RUN_V, 3)
    if k == "L8":
        start = T["CRASH"] + 1.35
    if k == "L12":                                       # she presses it again: the rocket, and off they go
        T["PRESS2"] = round(t + .45, 3); T["IGNITE2"] = round(T["PRESS2"] + .1, 3); T["GO2"] = round(T["IGNITE2"] + .45, 3)
        start = T["GO2"] + .15
    d = durs[k]
    v = {"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
         "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)}
    if k == "L6":
        v.update({"cut": T["L6CUT"], "dur": T["L6CUT"], "sub": "Happy Black Fri-", "asr_final": "Happy Black"})
        d = T["L6CUT"]
    VO.append(v)
    if k == "L4":
        two = [w for w in words("L4") if w["w"].lower().startswith("two")][0]
        T["PRESS"] = round(start + two["t0"] + .05, 3); T["IGNITE"] = round(T["PRESS"] + .1, 3)
    t = start + d
T["GONE"] = round(T["GO2"] + .9, 3)
ENDCARD = 2.5
DUR = round(t + .35 + ENDCARD, 2)                        # the card comes up as the cart is gone (the button is the relit rocket)
T["ASK"] = "DOORBUSTER OR ONLINE?"                       # owner 11/16: the two-choice question under the end card
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] - 0.08), 3)
    nxt = VO[i + 1]["t"] - 0.12 if i + 1 < len(VO) else DUR - ENDCARD
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.45, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + v["dur"] - 0.05, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 40 <= DUR <= 42, DUR
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
T.update({"CART_X0": CART_X0, "DOOR_X": DOOR_X, "RUN_V": RUN_V, "ACC": ACC, "AISLE_X0": AISLE_X0, "GRAB_X": GRAB_X, "CRASH_X": CRASH_X})
SHOTS = [
    ["CART_CU", 0.0, V["L2"]["t"]],                      # frame 1: Vera big, gripping the rocket cart; the line behind
    ["CLEO_CU", V["L2"]["t"], T["REV0"]],
    ["REVEAL", T["REV0"], T["REV1"]],                    # the line, all the way to the store
    ["CART_CU", T["REV1"], T["PRESS"] - .1],             # "Which is why we brought a rocket." "Cleo. On three. One... two..."
    ["CLEO_CU", T["PRESS"] - .1, T["LAUNCH"]],           # she presses it on "two"; the rocket lights
    ["TRACK", T["LAUNCH"], V["L6"]["t"] - .1],           # past the line ("Hey! No cutting!")
    ["DOORS", V["L6"]["t"] - .1, T["AISLE"]],            # "Happy Black Fri-": through the doors
    ["AISLE", T["AISLE"], T["CRASH"] + .9],              # "DOORBUSTER!", the last box, the crash
    ["TWO", T["CRASH"] + .9, V["L10"]["t"]],             # "Got it! The last one!" "I ordered one online."
    ["VERA_CU", V["L10"]["t"], V["L11"]["t"]],
    ["CLEO_CU2", V["L11"]["t"], T["PRESS2"] - .1],       # "You said 'rocket.'"
    ["END", T["PRESS2"] - .1, DUR],                      # she presses it again; off they go; the card over the empty spot
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
