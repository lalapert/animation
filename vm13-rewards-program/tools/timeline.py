"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Void Mart 13 "Rewards Program": MAGS's Void Rewards. The card reader asks us (the customer) "Do you have a Void Rewards
account?"; "No thanks."; "Great! Just enter your phone number." Endless receipt, points worth one receipt, points that expire
when the customer ceases to exist, Rae at -4,120 ("I say 'no thanks' a lot."), MAGS wins Employee of the Month on sign-ups;
Rae turns the reader on MAGS: "...No thanks." Script: channel/scripts/VM13_rewards_program.md
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
TYPE = 1.25                                                   # the customer keying in a phone number
# pause before each line (comic timing): L4 waits for the number, the welcome and the receipt; L8 for the leaderboard; L10 for
# MAGS's jingle; L12 for the reader turned on MAGS
GAP = {"L1": 0.3, "L2": 0.35, "L3": 0.3, "L4": 0.1 + TYPE + 1.2, "L5": 0.35, "L6": 0.4, "L7": 0.35, "L8": 1.1, "L9": 0.5,
       "L10": 0.95, "L11": 0.45, "L12": 0.6}
VO, t, T = [], 0.0, {}
for k in order:
    start = t + GAP[k]
    if k == "L4": T["TYPE0"] = round(t + 0.1, 3); T["TYPED"] = round(t + 0.1 + TYPE, 3)
    if k == "L8": T["BOARD"] = round(t + 0.3, 3)                                                    # the leaderboard
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
# the customer taps the tiny "no thanks"; the reader switches to the keypad on "Great!"; the welcome; the receipt starts
T["NOTAP"] = round(V["L2"]["t"] + word("L2", "thanks")["t0"], 3)
T["KEYPAD"] = round(V["L3"]["t"] + word("L3", "great")["t0"], 3)
T["PRINT"] = round(T["TYPED"] + 0.2, 3)
T["LEAVE"] = round(V["L4"]["t"] + 0.05, 3)                                                       # the customer sighs and goes
T["GRAB"] = round(V["L4"]["t"] + word("L4", "what")["t0"] - 0.2, 3)                             # Pip pulls up the end of the receipt
T["SIGNUPS"] = round(V["L10"]["t"] + word("L10", "sign")["t0"], 3)
T["LIFT"] = round(V["L11"]["t"] - 0.25, 3)                                                       # Rae lifts the reader to MAGS
T["MINUS"] = round(end("L12") + 0.05, 3)                                                         # MAGS: -10
T["BUTTON"] = round(end("L12") + 0.45, 3)
assert T["BUTTON"] < DUR - ENDCARD, (T["BUTTON"], DUR - ENDCARD)
T["ASK"] = "JOIN OR NO THANKS?"                 # owner 11/16: the two-choice question under the end card
SHOTS = [
    ["OPEN", 0.0, T["LEAVE"] - 0.4],                                                                       # the card reader, facing us
    ["WIDE", T["LEAVE"] - 0.4, V["L5"]["t"]],                                                              # the customer goes; Pip grabs the receipt
    ["MAGS_MED", V["L5"]["t"], V["L6"]["t"]],
    ["RCPT_CU", V["L6"]["t"], V["L7"]["t"]],                                                         # the fine print
    ["MAGS_CU", V["L7"]["t"], T["BOARD"]],
    ["BOARD", T["BOARD"], end("L8") + 0.15],                                                         # the leaderboard: RAE -4,120
    ["RAE_CU", end("L8") + 0.15, V["L10"]["t"] - 0.5],
    ["EOM_CU", V["L10"]["t"] - 0.5, V["L11"]["t"] - 0.3],                                            # Employee of the Month, again
    ["RAE_LIFT", V["L11"]["t"] - 0.3, V["L12"]["t"]],
    ["MAGS_CU", V["L12"]["t"], T["MINUS"] - 0.05],
    ["END", T["MINUS"] - 0.05, DUR],                                                                 # Rae with the reader: MAGS -10; the card
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
