"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Void Mart 11 "Leftovers": Thanksgiving night. Lonely customers queue at the store microwave with their leftovers; Pip turns the
counter into a Friendsgiving; MAGS charges a microwave fee and sells gratitude; Rae's rule ("always cover it") and Dennis's
cranberry sauce; Rae, who doesn't do holidays, has her own leftovers in the microwave. Script: channel/scripts/VM11_leftovers.md
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
SUBCOL = {"PIP": "#5fe3cc", "RAE": "#ffb066", "MAGS": "#ff7d8c", "ROBOT": "#c9e6ff", "DENNIS": "#b6f08a"}
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
word = lambda k, w: [x for x in W(k) if x["w"].lower().strip(".,:!?").startswith(w)][0]
MONT = 0.9                                       # one microwave-window cut of the montage (three of them)
# pause before each line (comic timing): L3 waits for the tablecloth and MAGS's jingle; L6 for the microwave montage and Dennis
# sliding in; L8 for the hum and the splat; L13 for the ding and Rae's own leftovers
GAP = {"L1": 0.3, "L2": 0.3, "L3": 1.05, "L4": 0.3, "L5": 0.3, "L6": 3 * MONT + 0.35 + 0.6, "L7": 0.3, "L8": 1.95, "L9": 0.4,
       "L10": 0.3, "L11": 0.3, "L12": 0.3, "L13": 1.7}
VO, t, T = [], 0.0, {}
for k in order:
    start = t + GAP[k]
    if k == "L6": T["M0"] = round(t + 0.35, 3); T["DEN_IN"] = round(T["M0"] + 3 * MONT, 3)          # the montage, then Dennis slides in
    if k == "L13": T["DING"] = round(t + 0.45, 3)                                                    # the microwave: Rae's leftovers
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
# Pip's tablecloth, right after "Nobody eats alone on Thanksgiving!"
T["CLOTH"] = round(end("L2") - 0.5, 3)                                                       # (she lifts it on "...Thanksgiving!")
# MAGS's hologram prices, on his words
T["FEE"] = round(V["L3"]["t"] + word("L3", "microwave")["t0"], 3); T["GRAT"] = round(V["L3"]["t"] + word("L3", "gratitude")["t0"], 3)
# Dennis's bowl: he lifts it onto the counter at "The usual!"; Rae takes it, puts it in, shuts the door, presses start as she says the rule
T["LIFT"] = round(V["L6"]["t"] + word("L6", "usual")["t0"] - 0.1, 3)
T["TAKE"] = round(end("L6") - 0.25, 3)
T["OPEN1"] = round(T["TAKE"] + 0.3, 3); T["IN"] = round(T["TAKE"] + 0.6, 3); T["SHUT"] = round(T["TAKE"] + 0.85, 3)
T["START"] = round(V["L7"]["t"] + word("L7", "nine")["t0"], 3)
T["SPLAT"] = round(end("L7") + 1.2, 3)                                                                # a beat of hum, then the cranberry sauce
T["DEN_OUT"] = round(V["L8"]["t"] + 0.2, 3)                                                           # Dennis slides off, dripping
# the ding: Rae opens the door and takes out her own leftovers; Pip holds out the gravy
T["OPEN2"] = round(T["DING"] + 0.35, 3); T["RAEOUT"] = round(T["DING"] + 0.8, 3)
T["PIPW0"] = round(T["DING"] + 0.05, 3)                                                              # Pip steps over toward Rae (off frame)
T["PIP_X0"], T["PIP_X1"], T["PIP_STEP"], T["PIP_SPS"] = 330, 400, 70, 1.9
T["GRAVY"] = round(V["L13"]["t"] + 0.3, 3)
T["BUTTON"] = round(end("L13") + 0.45, 3)
assert T["BUTTON"] < DUR - ENDCARD, (T["BUTTON"], DUR - ENDCARD)
assert T["START"] > T["SHUT"], (T["START"], T["SHUT"])
T["MONT"] = MONT
T["ASK"] = "LEFTOVERS: HOT OR COLD?"             # owner 11/16: the two-choice question under the end card
M0 = T["M0"]
SHOTS = [
    ["OPEN", 0.0, V["L2"]["t"]],
    ["PIP_MED", V["L2"]["t"], V["L3"]["t"] - 0.6],
    ["MAGS_MED", V["L3"]["t"] - 0.6, end("L3") + 0.15],
    ["PIP_MED", end("L3") + 0.15, V["L5"]["t"]],
    ["RAE_CU", V["L5"]["t"], M0],
    ["MICRO_A", M0, M0 + MONT],                                                                        # the robot's one pea
    ["MICRO_B", M0 + MONT, M0 + 2 * MONT],                                                             # the MOM'S tower
    ["MICRO_C", M0 + 2 * MONT, M0 + 3 * MONT],                                                         # the glowing casserole
    ["WIDE", M0 + 3 * MONT, V["L7"]["t"] - 0.05],                                                      # Dennis; Rae puts his bowl in
    ["MICRO_RAE", V["L7"]["t"] - 0.05, V["L8"]["t"]],                                                  # "Rule nine", the hum, the splat
    ["WIDE", V["L8"]["t"], V["L9"]["t"]],
    ["ROBOT_CU", V["L9"]["t"], V["L10"]["t"] - 0.1],
    ["MAGS_CU", V["L10"]["t"] - 0.1, V["L11"]["t"]],
    ["PIP_MED", V["L11"]["t"], V["L12"]["t"]],
    ["RAE_CU", V["L12"]["t"], T["DING"] - 0.1],
    ["MICRO_RAE", T["DING"] - 0.1, V["L13"]["t"] - 0.15],                                              # the ding, her own leftovers
    ["RAE_MED", V["L13"]["t"] - 0.15, T["BUTTON"]],                                                    # "...Pass the gravy."
    ["END_WIDE", T["BUTTON"], DUR],                                                                    # everyone; the end card
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
