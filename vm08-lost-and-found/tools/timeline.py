"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Void Mart 8 "Lost & Found": a sock planet and somebody's Tuesday in the lost-and-found box; a calendar-headed commuter claims
his Tuesday, MAGS charges a Wednesday for storage, he runs off on Thursday and leaves his briefcase, which becomes a moon.
Script: channel/scripts/VM08_lost_and_found.md
"""
import json, math, os, re
TAGS = re.compile(r"\[[^\]]*\]\s*")              # eleven_v4 audio tags: direction, never shown

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BPM = 120.0
BEAT = 60.0 / BPM
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
order = [l["id"] for l in cfg["lines"]]
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
SUBCOL = {"PIP": "#5fe3cc", "RAE": "#ffb066", "MAGS": "#ff7d8c", "CUST": "#ffd08a"}
CU_X0, CU_X1, CU_STEP, CU_SPS = 1330, 900, 140, 1.8          # the commuter walks in from the right foreground
WALKIN = (CU_X0 - CU_X1) / (CU_STEP * CU_SPS)
# pause before each line (comic timing): L3 waits for the dig in the box; L5 for the commuter walking in and putting his
# briefcase down; L7 for the handover, the page flip and MAGS's jingle; L8 for the Wednesday torn off and dropped in the box;
# L9 for the flip to Thursday; L10 for him running out; L11 for Rae dropping the briefcase in and the briefcase coming out a moon
GAP = {"L1": 0.15, "L2": 0.35, "L3": 1.9, "L4": 0.35, "L5": round(0.3 + WALKIN + 0.75, 3), "L6": 0.35, "L7": 2.8, "L8": 1.85,
       "L9": 0.9, "L10": 0.85, "L11": 2.45}
VO, t, T = [], 0.0, {}
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
for k in order:
    start = t + GAP[k]
    if k == "L5": T["CU0"] = round(t + 0.3, 3)                                                  # the door; the commuter walks in
    if k == "L7": T["GIVE"] = round(t + 0.45, 3); T["TAKE"] = round(t + 0.85, 3)                   # once "We found it!" is read, Pip holds it out; he takes it
    if k == "L8": T["TEAR0"] = round(t + 0.15, 3)                                               # he pulls a page out from under his head
    if k == "L9": T["THU"] = round(t + 0.35, 3)                                                 # his face flips to Thursday
    if k == "L11": T["RAE0"] = round(t + 0.15, 3)                                               # Rae reaches for the briefcase
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    t = start + d
END_BEAT = 2.3
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
# the opening: Pip holds the planet overhead; after "socks go." she floats it over the box and digs; the Tuesday comes up
T["PARK"] = round(end("L2") + 0.05, 3)                       # the planet moves from her hands to its spot over the box (0.5 s)
T["DIG0"] = round(T["PARK"] + 0.5, 3)                         # then she digs in the box
T["UP"] = round(V["L3"]["t"] - 0.35, 3)                       # the page comes out of the box
# the commuter: walk in, the briefcase onto the counter, stop
T["CU1"] = round(T["CU0"] + WALKIN, 3)
T["CASE"] = round(T["CU1"] + 0.1, 3)                          # his right hand puts the briefcase down (0.45 s)
# the handover: Pip holds the page out on "We found it!"; he takes it, slaps it on his face; the face flips to TUESDAY
T["SLAP"] = round(T["TAKE"] + 0.55, 3)
T["MAGSTURN"] = round(V["L7"]["t"] - 0.45, 3)                 # MAGS turns to him with the jingle
# the fee: a page pulled out from under the stack, held up (WEDNESDAY), tossed in the box
T["SHOW"] = round(T["TEAR0"] + 0.55, 3); T["TOSS"] = round(T["SHOW"] + 0.65, 3); T["INBOX"] = round(T["TOSS"] + 0.4, 3)
# Thursday: he runs off right; the door
T["RUN0"] = round(end("L9") - 0.15, 3); T["GONE"] = round(T["RUN0"] + 0.75, 3)
# the end: Rae takes the briefcase, drops it in the box; it floats up and orbits the planet; Rae sips; the button
T["LIFT"] = round(T["RAE0"] + 0.45, 3); T["DROP"] = round(T["LIFT"] + 0.75, 3); T["RISE"] = round(T["DROP"] + 0.5, 3)
T["ORBIT"] = round(T["RISE"] + 0.6, 3)
T["SIP"] = round(end("L11") + 0.15, 3)
T["BUTTON"] = round(end("L11") + 0.35, 3)
assert T["CASE"] + 0.45 < V["L5"]["t"], (T["CASE"], V["L5"]["t"])
assert T["INBOX"] < V["L8"]["t"] + 0.2, (T["INBOX"], V["L8"]["t"])
assert T["ORBIT"] <= V["L11"]["t"] + 0.2, (T["ORBIT"], V["L11"]["t"])
assert T["BUTTON"] < DUR - ENDCARD, (T["BUTTON"], DUR - ENDCARD)
T["CU_X0"], T["CU_X1"], T["CU_STEP"], T["CU_SPS"] = CU_X0, CU_X1, CU_STEP, CU_SPS
SHOTS = [
    ["PIP_MED", 0.0, V["L2"]["t"]],
    ["RAE_CU", V["L2"]["t"], T["PARK"]],
    ["PIP_MED", T["PARK"], V["L4"]["t"]],
    ["RAE_CU", V["L4"]["t"], T["CU0"]],
    ["HIGH_WIDE", T["CU0"], V["L5"]["t"]],
    ["CUST_MED", V["L5"]["t"], V["L6"]["t"]],
    ["PIP_MED", V["L6"]["t"], T["GIVE"] - 0.1],
    ["TWO_SHOT", T["GIVE"] - 0.1, V["L7"]["t"] - 0.5],
    ["MAGS_MED", V["L7"]["t"] - 0.5, end("L7") + 0.1],
    ["TWO_SHOT", end("L7") + 0.1, end("L8") + 0.15],
    ["CUST_MED", end("L8") + 0.15, T["GONE"]],
    ["PIP_MED", T["GONE"], end("L10") + 0.1],
    ["END_WIDE", end("L10") + 0.1, DUR],
]
SHOTS = [[n, round(a, 3), round(b, 3)] for n, a, b in SHOTS]
for a, b in zip(SHOTS, SHOTS[1:]):
    assert abs(a[2] - b[1]) < 1e-6 and a[2] > a[1], (a, b)
TL = {"BPM": BPM, "BEAT": BEAT, "BAR": 4 * BEAT, "DUR": DUR, "ENDCARD": ENDCARD, "VO": VO, "SHOTS": SHOTS, **T}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
CH = {k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["chars"] for k in V}
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\nwindow.CHARS = " + json.dumps(CH) + ";\n")
print("DUR", DUR, {k: v for k, v in T.items() if not k.startswith("CU_")})
for v in VO:
    print(f'{v["id"]:4} {v["who"]:5} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
