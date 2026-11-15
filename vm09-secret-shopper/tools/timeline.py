"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Void Mart 9 "Secret Shopper": MAGS announces a secret shopper; Pip gives two tiny customers on the counter the royal treatment and
the last two milks; Dennis comes in for the usual, the milk is out, and he is the secret shopper: one star. MAGS keeps the month.
Script: channel/scripts/VM09_secret_shopper.md
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
SUBCOL = {"PIP": "#5fe3cc", "RAE": "#ffb066", "MAGS": "#ff7d8c", "DENNIS": "#b6f27a"}
# pause before each line (comic timing): L1 after MAGS's jingle; L3 waits for the blob, the carpet and the crown; L4 for the robot,
# the bow and the last milk; L5 for Dennis sliding in; L7 for the stalks drooping and the paddle; L9 for MAGS's jingle
GAP = {"L1": 0.5, "L2": 0.35, "L3": 2.8, "L4": 3.3, "L5": 1.7, "L6": 0.35, "L7": 1.7, "L8": 0.45, "L9": 1.05}
VO, t, T = [], 0.0, {}
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
for k in order:
    start = t + GAP[k]
    if k == "L3": T["BLOB0"] = round(t + 0.25, 3)                                               # the blob hops in on the counter
    if k == "L4": T["BOT0"] = round(t + 0.35, 3)                                                # the robot rolls in
    if k == "L5": T["DEN0"] = round(t + 0.3, 3)                                                 # Dennis slides in
    if k == "L7": T["DROOP1"] = round(t + 0.2, 3); T["DROOP2"] = round(t + 0.55, 3); T["PADDLE"] = round(t + 1.05, 3)
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    t = start + d
END_BEAT = 2.5
ENDCARD = 2.5                                   # owner 11/13: the end card holds 2.5 s; the extra 1.25 s is a held tail after the button
DUR = round(t + END_BEAT + (ENDCARD - 1.25), 2)
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] - 0.08), 3)
    nxt = VO[i + 1]["t"] - 0.12 if i + 1 < len(VO) else DUR - 0.3
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.45, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + v["dur"] - 0.05, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 40 <= DUR <= 60, DUR
V = {v["id"]: v for v in VO}
end = lambda k: V[k]["t"] + V[k]["dur"]
# the blob: hops in (1.1 s), the carpet rolls out to it (0.6 s), the crown; the milk on "Complimentary milk"; it waddles off
T["BLOB1"] = round(T["BLOB0"] + 1.1, 3); T["CARPET"] = round(T["BLOB1"] + 0.1, 3); T["CROWN1"] = round(T["CARPET"] + 0.75, 3)
T["MILK1"] = round(V["L3"]["t"] + 0.35, 3); T["BLOBOFF"] = round(end("L3") + 0.1, 3)
# the robot: rolls in on the carpet (1.0 s), the bow, the crown, the last milk; it rolls off with it
T["BOT1"] = round(T["BOT0"] + 1.0, 3); T["BOW"] = round(T["BOT1"] + 0.1, 3); T["CROWN2"] = round(T["BOW"] + 0.7, 3)
T["MILK2"] = round(T["CROWN2"] + 0.6, 3); T["BOTOFF"] = round(T["MILK2"] + 0.45, 3)
assert T["MILK2"] + 0.3 < V["L4"]["t"], (T["MILK2"], V["L4"]["t"])
# Dennis: in from the right (0.9 s); the paddle comes up before "Secret shopper"
T["DEN1"] = round(T["DEN0"] + 0.9, 3)
w7 = W("L7"); T["STAR"] = round(V["L7"]["t"] + [x for x in w7 if x["w"].lower().startswith("one")][0]["t0"], 3)
# the end: MAGS's jingle, "Employee of the Month: MAGS." (the frame on the wall sparkles on MAGS), Rae's sip, the button
w9 = W("L9"); T["MAGSWORD"] = round(V["L9"]["t"] + [x for x in w9 if x["w"].lower().startswith("mags")][0]["t0"], 3)
T["SIP"] = round(end("L9") + 0.2, 3); T["BUTTON"] = round(end("L9") + 0.4, 3)
assert T["BUTTON"] < DUR - ENDCARD, (T["BUTTON"], DUR - ENDCARD)
SHOTS = [
    ["OPEN", 0.0, V["L2"]["t"]],
    ["PIP_MED", V["L2"]["t"], T["BLOB0"]],
    ["COUNTER", T["BLOB0"], V["L4"]["t"]],
    ["RAE_CU", V["L4"]["t"], T["DEN0"]],
    ["WIDE_D", T["DEN0"], V["L5"]["t"]],
    ["DENNIS_CU", V["L5"]["t"], V["L6"]["t"]],
    ["RAE_CU", V["L6"]["t"], end("L6") + 0.15],
    ["DENNIS_CU", end("L6") + 0.15, V["L8"]["t"]],
    ["PIP_CRY", V["L8"]["t"], V["L9"]["t"] - 0.55],
    ["MAGS_MED", V["L9"]["t"] - 0.55, V["L9"]["t"] + 1.6],
    ["END_WIDE", V["L9"]["t"] + 1.6, DUR],
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
