"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Void Mart 12 "Restock": the morning after Black Friday. Aisle 3 is stripped bare; Pip and Rae fall asleep on their feet; at 7:00
the shelves are full, every label faces front, the floor shines, and nobody restocked them. Pip: magic. Rae: Pip, in her sleep.
MAGS: "You're welcome!" The stockroom door clicks shut by itself. Script: channel/scripts/VM12_restock.md
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
SUBCOL = {"PIP": "#5fe3cc", "RAE": "#ffb066", "MAGS": "#ff7d8c"}
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
word = lambda k, w: [x for x in W(k) if x["w"].lower().strip(".,:!?").startswith(w)][0]
RAE_X0, RAE_X1, RAE_STEP, RAE_SPS = 1220, 1130, 45, 1.9       # Rae's walk along behind the shelf to the can pyramid
RAEWALK = (RAE_X0 - RAE_X1) / (RAE_STEP * RAE_SPS)
CLOCK, REVEAL = 2.0, 2.0                                      # the clock close-up (4:58 -> 7:00), the first look at the full aisle
# pause before each line (comic timing): L2 waits for the rolling can to fall; L4 for the nap, the clock and the reveal; L5 for
# Pip's hop and Rae's walk; L8 for MAGS's jingle; L12 for the stockroom door
GAP = {"L1": 0.35, "L2": 1.1, "L3": 0.35, "L4": 0.45 + CLOCK + REVEAL, "L5": 1.45, "L6": 0.35, "L7": 0.35, "L8": 1.1, "L9": 0.35,
       "L10": 0.4, "L11": 0.6, "L12": 2.6}
VO, t, T = [], 0.0, {}
for k in order:
    start = t + GAP[k]
    if k == "L4": T["NAP"] = round(t + 0.1, 3); T["CLOCK0"] = round(t + 0.45, 3); T["REVEAL"] = round(t + 0.45 + CLOCK, 3)
    if k == "L12": T["DOOR0"] = round(t + 0.7, 3); T["DOOR1"] = round(t + 1.65, 3)                # the door: creak, then the click
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
# the can rolls along the empty shelf and drops off the front
T["CAN0"] = round(V["L1"]["t"] + word("L1", "everything")["t0"], 3); T["CANFALL"] = round(V["L2"]["t"] - 0.35, 3)
# the chime at seven; Pip wakes, hops; Rae walks over to the can pyramid and turns a can
T["CHIME"] = round(T["REVEAL"] - 0.45, 3)
T["WAKE"] = round(V["L4"]["t"] - 0.2, 3); T["HOP"] = round(end("L4") - 0.55, 3)
T["RAEW0"] = round(end("L4") + 0.1, 3); T["RAEW1"] = round(T["RAEW0"] + RAEWALK, 3)
T["PICK"] = round(V["L5"]["t"] - 0.15, 3); T["TURN"] = round(V["L5"]["t"] + word("L5", "faces")["t0"] - 0.1, 3); T["PUT"] = round(end("L5") + 0.05, 3)
assert T["RAEW1"] < T["PICK"] - 0.05, (T["RAEW1"], T["PICK"])
# "Thank you, whoever you are!": Pip up on her toes, waving; the door; they turn to it
T["TOES"] = round(V["L11"]["t"] - 0.25, 3)
T["LOOK"] = round(T["DOOR1"] + 0.15, 3)
T["BUTTON"] = round(end("L12") + 0.45, 3)
assert T["BUTTON"] < DUR - ENDCARD, (T["BUTTON"], DUR - ENDCARD)
T["RAE_X0"], T["RAE_X1"], T["RAE_STEP"], T["RAE_SPS"] = RAE_X0, RAE_X1, RAE_STEP, RAE_SPS
T["ASK"] = "MAGIC OR PIP?"                      # owner 11/16: the two-choice question under the end card
SHOTS = [
    ["OPEN", 0.0, V["L2"]["t"]],                                                                    # the stripped aisle; the can
    ["RAE_CU", V["L2"]["t"], V["L3"]["t"]],                                                         # "We don't even have a sale."
    ["OPEN2", V["L3"]["t"], T["CLOCK0"]],                                                           # "Restock... after a nap." They nod off
    ["CLOCK", T["CLOCK0"], T["REVEAL"]],                                                            # 4:58 -> 7:00
    ["REVEAL", T["REVEAL"], end("L4") + 0.1],                                                       # the same frame, full
    ["TWO", end("L4") + 0.1, V["L5"]["t"] - 0.2],                                                   # Rae walks over
    ["CAN_CU", V["L5"]["t"] - 0.2, V["L6"]["t"]],                                                   # every label faces front
    ["TWO", V["L6"]["t"], V["L7"]["t"]],                                                            # "Did you restock in your sleep?"
    ["PIP_MED", V["L7"]["t"], V["L8"]["t"] - 0.6],                                                  # "No... it was magic!"
    ["MAGS_CU", V["L8"]["t"] - 0.6, V["L9"]["t"]],
    ["RAE_CU2", V["L9"]["t"], V["L10"]["t"]],
    ["MAGS_CU", V["L10"]["t"], V["L11"]["t"] - 0.3],
    ["END_WIDE", V["L11"]["t"] - 0.3, DUR],                                                         # "Thank you, whoever you are!", the door, the card
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
    print(f'{v["id"]:4} {v["who"]:6} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
