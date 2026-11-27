"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Void Mart 14 "Best Before" (length_test: short, 25-30 s with the end card): the milk is good till the heat death of the
universe, which MAGS says is tonight. The stars go out one by one; Pip throws the carton and hides under the counter; Rae catches
it, pours it in her coffee: "Then it's still good till midnight." ... "Milk's still good." Script: channel/scripts/VM14_best_before.md
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
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
word = lambda k, w: [x for x in W(k) if x["w"].lower().strip(".,:!?").startswith(w)][0]
# pause before each line (comic timing): L4 waits for the first stars to go out; L5 for the toss and the catch; L6 for the pour,
# the sip and the lights; L7 for Pip coming up behind the counter
GAP = {"L1": 0.25, "L2": 0.3, "L3": 0.2, "L4": 0.55, "L5": 1.0, "L6": 2.2, "L7": 0.75, "L8": 0.4}
VO, t, T = [], 0.0, {}
for k in order:
    start = t + GAP[k]
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
assert 25 <= DUR <= 30, DUR                     # length_test: short (review 11/26): 25-30 s with the end card
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
T["GRAB"] = round(V["L1"]["t"] + word("L1", "this")["t0"] - 0.15, 3)                          # Pip picks up the carton (in the wide)
T["INS_END"] = round(V["L1"]["t"] + word("L1", "rae")["t1"] + 0.05, 3)                         # frame 1: the carton, until "Rae!"
T["SALE"] = round(V["L2"]["t"] + word("L2", "half")["t0"], 3)                                   # "50% OFF" by MAGS
T["VOID"] = round(end("L3") + 0.05, 3)                                                           # the stars, from inside the store
T["STARS0"] = round(T["VOID"] + 0.25, 3)                                                         # the first star goes out
T["TOSS"] = round(end("L4") + 0.1, 3)                                                            # Pip throws the carton
T["CATCH"] = round(T["TOSS"] + 0.62, 3)                                                          # Rae's left hand
T["POUR"] = round(end("L5") + 0.1, 3)                                                            # into her mug
T["POUR1"] = round(T["POUR"] + 0.95, 3)
T["SIP"] = round(T["POUR1"] + 0.2, 3)
T["FLICK"] = round(T["SIP"] + 0.5, 3)                                                            # the store's lights flicker
T["DARK"] = round(T["FLICK"] + 0.45, 3)                                                          # and go down (never black)
T["DIVE"] = round(T["DARK"] + 0.1, 3)                                                            # Pip drops under the counter
T["PEEK"] = round(V["L7"]["t"] - 0.6, 3)                                                         # her eyes come up over the counter
T["SIP2"] = round(end("L8") + 0.25, 3)                                                           # one more sip; the carton goes down
T["BUTTON"] = round(end("L8") + 0.45, 3)
assert T["BUTTON"] < DUR - ENDCARD, (T["BUTTON"], DUR - ENDCARD)
T["ASK"] = "DRINK IT OR RUN?"                   # owner 11/16: the two-choice question under the end card
T["LOOK"] = 2                                   # First Look 2 episode (vmkit.js how-to)
w = lambda k, x: V[k]["t"] + word(k, x)["t0"]
ACT = [["RAE", w("L1", "universe"), "tilt", .8, .9],          # Rae, listening
       ["PIP", w("L2", "tonight"), "pop", 1, .7],            # "That's tonight!"
       ["RAE", w("L2", "half") + .1, "shrug", .7, .6],       # half off, sure
       ["MAGS", V["L2"]["t"] + .05, "lean", .8, 1.2],        # MAGS sells
       ["PIP", V["L3"]["t"] + .4, "pop", 1.2, .8],           # "Tonight?!"
       ["PIP", T["TOSS"] - .15, "back", 1, .5],              # the throw
       ["RAE", T["CATCH"], "turn", -.5, .9],                 # Rae looks at the carton in her hand
       ["RAE", w("L5", "midnight"), "nod", .7, .6],          # "till midnight."
       ["MAGS", V["L6"]["t"] + .05, "pop", .8, .8],          # 99% off
       ["RAE", w("L6", "percent"), "shrug", .5, .6],         # Rae, in the dark, drinking
       ["PIP", V["L7"]["t"] + .2, "turn", .5, 1.2],          # Pip's eyes go to Rae
       ["RAE", w("L8", "good") , "nod", .6, .7]]             # "Milk's still good."
T["ACT"] = [[a, round(b, 3), c, d, e] for a, b, c, d, e in ACT]
SHOTS = [
    ["INSERT", 0.0, T["INS_END"]],                                                                    # frame 1: the carton and its date
    ["WIDE", T["INS_END"], V["L2"]["t"] - 0.15],                                                     # Pip picks it up
    ["MAGS_CU", V["L2"]["t"] - 0.15, V["L3"]["t"] + 0.2],                                            # "That's tonight! Half off!"
    ["PIP_CU", V["L3"]["t"] + 0.2, T["VOID"]],                                                       # "Tonight?!"
    ["VOID", T["VOID"], end("L4") - 0.15],                                                           # the stars go out
    ["WIDE", end("L4") - 0.15, T["CATCH"] + 0.3],                                                    # the toss, the catch
    ["OTS_RAE", T["CATCH"] + 0.3, T["POUR"]],                                                        # "...till midnight." push-in
    ["RAE_MED", T["POUR"], T["DARK"] - 0.1],                                                         # the pour, the sip, the lights
    ["WIDE", T["DARK"] - 0.1, T["PEEK"]],                                                            # dark; Pip dives; 99% off
    ["PEEK", T["PEEK"], V["L8"]["t"] - 0.2],                                                         # "Rae? Are we dead?"
    ["END", V["L8"]["t"] - 0.2, DUR],                                                                # "Milk's still good." The card
]
SHOTS = [[n, round(a, 3), round(b, 3)] for n, a, b in SHOTS]
for a, b in zip(SHOTS, SHOTS[1:]):
    assert abs(a[2] - b[1]) < 1e-6 and a[2] > a[1], (a, b)
TL = {"BPM": BPM, "BEAT": BEAT, "BAR": 4 * BEAT, "DUR": DUR, "ENDCARD": ENDCARD, "VO": VO, "SHOTS": SHOTS, **T}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
CH = {k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["chars"] for k in V}
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\nwindow.CHARS = " + json.dumps(CH) + ";\n")
print("DUR", DUR, T)
for v in VO:
    print(f'{v["id"]:4} {v["who"]:6} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
