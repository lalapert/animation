"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Tape 12 "Lost Child": Leon Marsh, December 7, 1999, 2:40 A.M., the center court. The mall's PA chimes and asks the parent
of a lost child to come to the information desk. CAM 08 played back: a small figure (a child mannequin in a red coat and a
knit hat, the Display) stands alone in front of the desk, facing the camera. Leon goes with his camcorder: nobody at the
desk, the PA microphone's ON AIR light still lit. CAM 08 again: it stands right beside him at the desk, its head tilting up
toward him; one frame later it is gone behind the counter. His camcorder: "Is somebody back there?" He leans over the
counter: below the lens, behind the counter, it looks up at him, the PA microphone in its hands, and the whole mall's
speakers howl with feedback (the one loud sound). CAM 08: he backs away; the PA says "Thank you."; it stands in front of the
desk, as at frame 1.
Script: channel/scripts/SR12_lost_child.md
"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
START = {"P1": 1.0, "L1": 6.75, "L2": 11.8, "L3": 21.9, "P2": 30.3}
GAIN = {"L1": -1.5, "L2": -1.5, "L3": -3.0}
FX = {"P1": "pa", "P2": "pa"}
VO = []
for k in ["P1", "L1", "L2", "L3", "P2"]:
    VO.append({"id": k, "who": lines[k]["who"], "t": START[k], "dur": durs[k], "sub": lines[k].get("sub", lines[k]["text"]), "col": "#f2f2f2",
               "fx": FX.get(k, "cam"), "pos": "top", "gain_db": GAIN.get(k, 0.0)})

# ---------------------------------------------------------------- shots: cam1 / cam2 are Leon's camcorder (colour, hand-held);
# cctv1-3 are CAM 08 (over the center court, on the information desk), played back by the archive (6 frames a second)
END = 33.2
DUR = 34.2
SHOTS = [["cctv1", 0.0, 6.4], ["cam1", 6.4, 15.6], ["cctv2", 15.6, 21.6], ["cam2", 21.6, 27.2], ["cctv3", 27.2, END]]
RECCUT = []
OPEN = {"on": True, "full": 3.0, "end": 3.6}   # owner 11/20 test (tape 8): the first 3 s fill the 9:16 frame; "on": False switches it off
CHIME = 0.1                  # the PA's chime, then the announcement (P1) through the ceiling speakers
TILT1 = 4.833                # CAM 08, held frame: its head tilts
WALK = [6.6, 10.4]           # S2: he walks across the court to the desk
EGG = {"t": 12.6, "dur": 0.1, "what": "the desk's NOW SERVING display reads 11 instead of 47 for six frames"}
PUSH2 = [16.0, 18.2]         # the playback zooms in on him and it (x1.0 -> x2.2)
TILT2 = 18.667               # held frame: its head tilts up toward him
GONE = 19.833                # held frame: it is not beside him; at the end of the counter
BEHIND = 20.5                # held frame: only the top of its hat shows over the counter, behind it
LEAN = [24.7, 25.6]          # S4: he leans over the counter with the camcorder, the flashlight down behind it
QUIET = [25.55, 26.1]        # near silence (the top of its knit hat, right below the lens)
STING = 26.1                 # its face snaps up to the lens, the PA microphone in its hands; the speakers howl
RECOIL = [26.6, 27.0]        # he jerks back
BACKOUT = [27.5, 29.2]       # CAM 08: he backs away from the desk and out of frame
PUSH3 = [28.9, 30.9]         # the playback zooms back to the frame-1 framing
RETURN = 31.167              # held frame: it stands in front of the desk again, facing the camera
STATIC = [[END, DUR]]        # no static before frame 1: the tape opens on CAM 08 (the loop comes back to it)
GLITCH = [[END - .3, .3]]
STEPS = [round(WALK[0] + .25 + i * .55, 3) for i in range(7)]
ASK = "GO TO THE DESK OR STAY AWAY?"
ASK_T = round(DUR - 2.5, 3)  # owner 11/16: the last 2.5 s carry the two-choice question under the rule card
assert 30 <= DUR <= 50
for i, v in enumerate(VO):
    v["s0"] = round(v["t"] - 0.05, 3)
    nxt = VO[i + 1]["t"] - 0.15 if i + 1 < len(VO) else 99
    cut = min([c for c in RECCUT + [s[2] for s in SHOTS] if c > v["t"]], default=99) - .06    # never across a cut
    v["s1"] = round(min(nxt, v["t"] + v["dur"] + 0.5, cut), 3)
    assert v["t"] + v["dur"] < nxt + .15, v["id"]
    assert v["t"] + v["dur"] - .05 < cut + .06, v["id"]
assert VO[3]["t"] + VO[3]["dur"] < LEAN[0]
TL = {"DUR": DUR, "VO": VO, "SHOTS": SHOTS, "RECCUT": RECCUT, "OPEN": OPEN, "CHIME": CHIME, "TILT1": TILT1, "WALK": WALK, "EGG": EGG,
      "PUSH2": PUSH2, "TILT2": TILT2, "GONE": GONE, "BEHIND": BEHIND, "LEAN": LEAN, "QUIET": QUIET, "STING": STING, "RECOIL": RECOIL,
      "BACKOUT": BACKOUT, "PUSH3": PUSH3, "RETURN": RETURN, "END": END, "STATIC": STATIC, "GLITCH": GLITCH, "STEPS": STEPS,
      "ASK": ASK, "ASK_T": ASK_T,
      "LABEL": "TAPE 0012", "SUB": "CAM 08 / CAMCORDER  ·  INFORMATION DESK  ·  12/07/99",
      "RULE": "RULE 12: IF THE PA CALLS FOR A LOST CHILD,\nDO NOT GO TO THE DESK.",
      "STAMP1": [2, 38, 52], "STAMP2": [2, 41, 9], "STAMP3": [2, 41, 47], "DATE": "12-07-1999"}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\n")
print("DUR", DUR)
for v in VO: print(f'{v["id"]} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f} sub {v["s0"]:6.2f}-{v["s1"]:6.2f} {v["sub"]!r}')
