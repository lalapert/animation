"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Volt Labs 13 "The Evil Mirror": whoever looks in, their evil twin steps out. Evil Vera is her opposite (polite, early, she paid
the rent), so Vera sends her back (she takes the rent money back). Evil Cleo is exactly Cleo (but for the goatee): "No." "We
know." "One of you, back in the mirror." The two Cleos cross; the real one goes in; the goatee stays. "Finally. Normal." "Normal."
Script: channel/scripts/VL13_the_evil_mirror.md. Gaps are measured from the end of one line's speech to the start of the next
one's (the takes' own lead and tail silences are read from the word timings in voice/out/<id>.json).
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
LEAD = {k: WORDS[k][0]["t0"] for k in order}
SPEND = {k: WORDS[k][-1]["t1"] for k in order}
TWIN = "#f2b8ff"                                                   # the twins' subtitles: the mirror's violet
SUBCOL = {"VERA": "#d8ff7a", "CLEO": "#c9b8ff", "BOTH": "#c9b8ff", "EVIL_VERA": TWIN, "EVIL_CLEO": TWIN}
VX, CX, MX = 320, 900, 560                                         # Vera, Cleo, the mirror (behind the bench, against the wall)
CX_LOOK = 760                                                      # Cleo beside the mirror, looking in; her twin steps out at MX
WALK_V = 300.0                                                     # a walk behind the bench, px per second
GAP = {"L1": .3, "L2": .3, "L3": .3, "L4": None, "L5": .25, "L6": .25, "L7": None, "L8": None, "L9": .3, "L10": .25,
       "L11": .3, "L12": None, "L13": .4}
VO, T = [], {}
send = 0.0
for k in order:
    sp0 = send + (GAP[k] if GAP[k] is not None else 0)
    if k == "L4":                                                  # the glass ripples, flashes, and Evil Vera steps out
        T["RIP1"] = round(send + .12, 3); T["OUT1"] = round(T["RIP1"] + .5, 3); sp0 = T["OUT1"] + .55
    if k == "L7":                                                  # she walks back into the glass (and off, inside it)
        T["IN1"] = round(send + .1, 3); T["AWAY1"] = round(T["IN1"] + .2, 3); sp0 = T["IN1"] + .4
    if k == "L8":                                                  # Cleo looks in; her twin steps out; they blink together
        T["RIP2"] = round(max(send + .1, T["CW1"] + .2), 3); T["OUT2"] = round(T["RIP2"] + .5, 3)
        T["SYNC"] = round(T["OUT2"] + .75, 3); sp0 = T["SYNC"] + .45
    if k == "L12":                                                 # the Cleos cross; the real one goes in; the goatee stays
        T["SWAP0"] = round(send + .15, 3); T["SWAP1"] = round(T["SWAP0"] + (CX_LOOK - MX) / WALK_V, 3)
        T["IN2"] = round(T["SWAP1"] + .2, 3); T["AWAY2"] = round(T["IN2"] + .2, 3)
        T["EC0"] = round(T["SWAP1"] + .15, 3); T["EC1"] = round(T["EC0"] + (CX - CX_LOOK) / WALK_V, 3)
        sp0 = max(T["IN2"] + .55, T["EC1"] + .1)
    start = sp0 - min(LEAD[k], .3)
    d = durs[k]
    VO.append({"id": k, "who": lines[k]["who"], "t": round(start, 3), "dur": d, "sub": lines[k].get("sub", TAGS.sub("", lines[k]["text"]).strip()),
               "col": SUBCOL[lines[k]["who"]], "gain_db": lines[k].get("gain_db", 0)})
    if k == "L3":
        T["LOOKV"] = round(start + LEAD[k] + 1.2, 3)                # she turns to the glass on "Twice the evil!"
    if k == "L7":                                                  # Cleo walks over to the mirror on "Show me real evil."
        T["CW0"] = round(start + LEAD[k] + 1.3, 3); T["CW1"] = round(T["CW0"] + (CX - CX_LOOK) / WALK_V, 3)
    if k == "L13":
        T["STROKE"] = round(start + LEAD[k] - .1, 3)                # her fingers to her goatee
    send = start + SPEND[k]
T["BOARDT"] = round(send + .55, 3)                                 # the board, inside the end card (owner 11/16: no extra time)
ENDCARD = 2.5
DUR = round(T["BOARDT"] + ENDCARD, 2)
T["ASK"] = "VERA OR EVIL VERA?"                                    # owner 11/16: the two-choice question under the end card
for i, v in enumerate(VO):
    v["s0"] = round(max(0.0, v["t"] + LEAD[v["id"]] - 0.1), 3)
    nxt = VO[i + 1]["t"] + LEAD[VO[i + 1]["id"]] - 0.14 if i + 1 < len(VO) else T["BOARDT"]
    v["s1"] = round(min(nxt, max(v["t"] + v["dur"] + 0.4, v["s0"] + 1.0)), 3)
    assert v["s1"] >= v["t"] + SPEND[v["id"]] - 0.02, v["id"]
for a, b in zip(VO, VO[1:]):
    assert a["s1"] < b["s0"], (a["id"], b["id"])
assert 40 <= DUR <= 42, DUR                                        # brief: 40-42 s with the card
V = {v["id"]: v for v in VO}
T.update({"VX": VX, "CX": CX, "MX": MX, "CX_LOOK": CX_LOOK, "WALK_V": WALK_V})
SHOTS = [
    ["OPEN", 0.0, V["L2"]["t"]],                                   # frame 1: Vera big, her goateed reflection in the mirror
    ["CLEO_CU", V["L2"]["t"], V["L3"]["t"]],
    ["MIRROR", V["L3"]["t"], V["L5"]["t"]],                        # she looks in; Evil Vera steps out: "I paid the rent. Early."
    ["VERA_CU", V["L5"]["t"], V["L6"]["t"]],                       # "You did WHAT?"
    ["MIRROR", V["L6"]["t"], T["IN1"] + .9],                       # "I'll take the rent money back." and in she goes
    ["WIDE", T["IN1"] + .9, V["L8"]["t"]],                         # "Cleo, you look." She walks over, looks in; her twin steps out
    ["CLEOS", V["L8"]["t"], V["L9"]["t"]],                         # "No."
    ["VERA_CU", V["L9"]["t"], V["L10"]["t"]],                      # "That's exactly what Cleo would say!"
    ["CLEOS", V["L10"]["t"], V["L11"]["t"]],                       # "We know."
    ["WIDE", V["L11"]["t"], V["L12"]["t"]],                        # "One of you, back in the mirror." The swap
    ["VERA_CU", V["L12"]["t"], V["L13"]["t"] - .1],                # "Finally. Normal."
    ["CLEO_CU", V["L13"]["t"] - .1, T["BOARDT"]],                  # "Normal." (the goatee)
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
    print(f'{v["id"]:4} {v["who"]:9} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f}  sub {v["s0"]:6.2f}-{v["s1"]:6.2f}  {v["sub"]!r}')
for s in SHOTS: print(f'  {s[0]:12s} {s[1]:6.2f}-{s[2]:6.2f}')
