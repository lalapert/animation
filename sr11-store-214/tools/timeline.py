"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Tape 11 "Store 214": Leon Marsh, December 6, 1999, 2:20 A.M., upper level. Store 214 (HALE & ROSE) is closed behind its
roll-down grille, four mannequins on the display riser. On CAM 31 one of them, the one in the red dress, is not on its stand:
it is at the grille with its hands on the bars; one time-lapse frame later it is back on its stand. On his camcorder all four
are always where they were. CAM 31 again: Leon at the grille, and on the other side of the bars, face to his face, it; its
hand comes up to the bar beside his. His camcorder: it is on its stand. But the grille creaks in front of him, as if
something were leaning on it. The display lights clunk on: it is right there at the grille, in front of his lens, and it
shakes the bars (the one loud sound). CAM 31: he backs away; the lights go off; it stands at the grille, as at frame 1.
Script: channel/scripts/SR11_store_214.md
"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
START = {"L1": 4.95, "L2": 9.75, "L3": 21.0, "L4": 24.5}
GAIN = {"L1": -1.5, "L2": -1.5, "L3": -3.0, "L4": -4.5}                     # the whispers sit a little lower (still 8 dB over everything else)
VO = []
for k in ["L1", "L2", "L3", "L4"]:
    VO.append({"id": k, "who": lines[k]["who"], "t": START[k], "dur": durs[k], "sub": lines[k].get("sub", lines[k]["text"]), "col": "#f2f2f2",
               "fx": "cam", "pos": "top", "gain_db": GAIN.get(k, 0.0)})

# ---------------------------------------------------------------- shots: cam1 / cam2 are Leon's camcorder (colour, hand-held);
# cctv1-3 are CAM 31 (upper level, across from the store), played back by the archive (black and white, 6 frames a second)
END = 33.6
DUR = 34.6
SHOTS = [["cctv1", 0.0, 4.6], ["cam1", 4.6, 14.4], ["cctv2", 14.4, 20.8], ["cam2", 20.8, 28.2], ["cctv3", 28.2, END]]
RECCUT = []
SNAP1 = 1.667                # CAM 31, frame 1 on: it is at the grille, hands on the bars; one held frame later its head snaps over
LAPSE = 3.0                  # a time-lapse jump (the stamp skips 27 s): it is back on its stand, as if it never left
COUNT = [5.4, 9.2]           # S2: his flashlight counts the four, one by one
EGG = {"t": 7.1, "dur": 0.1, "what": "the sale card on the riser reads 10% OFF instead of 50% OFF for six frames"}
STEP_IN = [9.9, 11.0]        # he steps up to the grille
ZOOM = [11.2, 12.7]          # the camcorder zooms on the one in the red dress: still, on its stand
ROLL2 = [14.4, 14.7]         # tracking roll into the CAM 31 playback
PUSH2 = [14.9, 17.2]         # the playback zooms in on him and the bars (x1.0 -> x2.3): it is at the grille, face to his face
HAND = 17.833                # held frame: its hand is on the bar beside his hand
TILT = 19.0                  # held frame: its head tilts toward him
CREAKS = [22.1, 23.75, 25.3, 26.2]   # S4: the grille creaks in front of him (his camcorder shows it on its stand)
QUIET = [26.7, 27.25]        # near silence
STING = 27.25                # the display lights clunk on: it is right in front of the lens at the grille, and shakes the bars
STUMBLE = [27.75, 28.15]     # he stumbles back, the camcorder swinging down
ROLL3 = [28.2, 28.5]
BACKOUT = [28.5, 30.4]       # CAM 31: he backs away from the grille, out of frame; its head follows him in held frames
DARK = 31.3                  # the display lights go off again
PUSH3 = [29.2, 31.2]         # the playback zooms back to the frame-1 framing (x1.0 -> x1.55)
STATIC = [[END, DUR]]        # no static before frame 1: the tape opens on CAM 31 (the loop comes back to it)
GLITCH = [[END - .3, .3]]
STEPS = [9.95, 10.45, 27.85, 28.05]
ASK = "STEP BACK OR LOOK CLOSER?"
ASK_T = round(DUR - 2.5, 3)  # owner 11/16: the last 2.5 s carry the two-choice question under the rule card
assert 30 <= DUR <= 50
for i, v in enumerate(VO):
    v["s0"] = round(v["t"] - 0.05, 3)
    nxt = VO[i + 1]["t"] - 0.15 if i + 1 < len(VO) else 99
    cut = min([c for c in RECCUT + [s[2] for s in SHOTS] if c > v["t"]], default=99) - .06    # never across a cut
    v["s1"] = round(min(nxt, v["t"] + v["dur"] + 0.5, cut), 3)
    assert v["t"] + v["dur"] < nxt + .15, v["id"]
    assert v["t"] + v["dur"] - .05 < cut + .06, v["id"]
assert VO[3]["t"] + VO[3]["dur"] < QUIET[0]
TL = {"DUR": DUR, "VO": VO, "SHOTS": SHOTS, "RECCUT": RECCUT, "SNAP1": SNAP1, "LAPSE": LAPSE, "COUNT": COUNT, "EGG": EGG,
      "STEP_IN": STEP_IN, "ZOOM": ZOOM, "ROLL2": ROLL2, "PUSH2": PUSH2, "HAND": HAND, "TILT": TILT, "CREAKS": CREAKS, "QUIET": QUIET,
      "STING": STING, "STUMBLE": STUMBLE, "ROLL3": ROLL3, "BACKOUT": BACKOUT, "DARK": DARK, "PUSH3": PUSH3, "END": END,
      "STATIC": STATIC, "GLITCH": GLITCH, "STEPS": STEPS, "ASK": ASK, "ASK_T": ASK_T,
      "LABEL": "TAPE 0011", "SUB": "CAM 31 / CAMCORDER  ·  STORE 214  ·  12/06/99",
      "RULE": "RULE 11: IF A MANNEQUIN HAS MOVED,\nDO NOT STAND AT THE SHUTTER.",
      "STAMP1": [2, 19, 31], "STAMP2": [2, 21, 6], "STAMP3": [2, 21, 44], "DATE": "12-06-1999"}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\n")
print("DUR", DUR)
for v in VO: print(f'{v["id"]} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f} sub {v["s0"]:6.2f}-{v["s1"]:6.2f} {v["sub"]!r}')
