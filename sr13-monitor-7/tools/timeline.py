"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Tape 13 "Monitor 7": Leon Marsh, December 8, 1999, 1:12 A.M. Monitor 7 shows a room that is not in the mall: a small room in
mint-green tiles, a bare bulb swinging on its cord, a wooden chair facing the corner, a clock stopped at 11:59 (the room's
fixed identity, for tape 58). In the corner, facing the wall, something tall stands with its head bent over. Leon takes the
floor plan into the service level: rooms B-05, B-06, B-08, B-09; no B-07, no camera 7. Between B-06 and B-08 there is only
block wall. CAM 07 again: the corner is empty, the chair has turned to face the camera. At the wall: "It should be right
here." A ceiling tile above him creaks open; he backs off and looks up; the tile bursts and it drops head first through the
ceiling and hangs upside down in front of him, its long arms hanging past its head (the one loud sound). CAM 07: it stands
in its corner again, facing the wall, as at frame 1.
Where the room is, the tape does not say.
Script: channel/scripts/SR13_monitor_7.md
"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
START = {"L1": 5.9, "L2": 10.7, "L3": 22.4}
GAIN = {"L1": -2.0, "L2": -2.5, "L3": -3.0}
VO = []
for k in ["L1", "L2", "L3"]:
    VO.append({"id": k, "who": lines[k]["who"], "t": START[k], "dur": durs[k], "sub": lines[k].get("sub", lines[k]["text"]), "col": "#f2f2f2",
               "fx": "cam", "pos": "top", "gain_db": GAIN.get(k, 0.0)})

# ---------------------------------------------------------------- shots: cam1 / cam2 are Leon's camcorder (colour, hand-held);
# cctv1-3 are CAM 07 (the room), played back by the archive (6 frames a second)
END = 33.0
DUR = 34.0
SHOTS = [["cctv1", 0.0, 5.6], ["cam1", 5.6, 16.0], ["cctv2", 16.0, 21.4], ["cam2", 21.4, 28.0], ["cctv3", 28.0, END]]
RECCUT = []
OPEN = {"on": True, "full": 3.0, "end": 3.6}   # owner 11/20 test (tape 8): the first 3 s fill the 9:16 frame; "on": False switches it off
WALK = [5.8, 9.0]            # S2: he walks up the service corridor, the flashlight along the doors
PLAN_UP = [9.2, 9.8]         # he holds the floor plan up into the picture (no B-07, no camera 7)
PLAN_DOWN = [13.4, 13.9]
EGG = {"t": 14.5, "dur": 0.1, "what": "the door sign B-06 reads B-12 for six frames"}
TO_WALL = [14.9, 16.0]       # he turns to the wall between B-06 and B-08
PUSH2 = [16.4, 18.6]         # CAM 07 again: the playback zooms in on the chair (now facing the camera)
STEP_IN = [21.5, 22.2]       # S4: up to the wall; his hand on the blocks
HAND = [22.3, 24.3]
CREAK = 24.6                 # a ceiling tile over him creaks
LOOK_UP = [24.8, 25.4]       # the camcorder tilts up to it
QUIET = [25.45, 26.0]        # near silence
STING = 26.0                 # the tile bursts down: it drops head first through the ceiling in front of the lens
RECOIL = [26.6, 27.0]        # he falls back, the camcorder swinging down
PUSH3 = [29.0, 31.0]         # CAM 07: the playback zooms back to the frame-1 framing
STATIC = [[END, DUR]]        # no static before frame 1: the tape opens on CAM 07 (the loop comes back to it)
GLITCH = [[END - .3, .3]]
STEPS = [round(WALK[0] + .25 + i * .55, 3) for i in range(6)] + [21.6, 22.0]
ASK = "FIND THE ROOM OR FORGET IT?"
ASK_T = round(DUR - 2.5, 3)  # owner 11/16: the last 2.5 s carry the two-choice question under the rule card
assert 30 <= DUR <= 50
for i, v in enumerate(VO):
    v["s0"] = round(v["t"] - 0.05, 3)
    nxt = VO[i + 1]["t"] - 0.15 if i + 1 < len(VO) else 99
    cut = min([c for c in RECCUT + [s[2] for s in SHOTS] if c > v["t"]], default=99) - .06    # never across a cut
    v["s1"] = round(min(nxt, v["t"] + v["dur"] + 0.5, cut), 3)
    assert v["t"] + v["dur"] < nxt + .15, v["id"]
    assert v["t"] + v["dur"] - .05 < cut + .06, v["id"]
assert VO[2]["t"] + VO[2]["dur"] < CREAK
TL = {"DUR": DUR, "VO": VO, "SHOTS": SHOTS, "RECCUT": RECCUT, "OPEN": OPEN, "WALK": WALK, "PLAN_UP": PLAN_UP, "PLAN_DOWN": PLAN_DOWN,
      "EGG": EGG, "TO_WALL": TO_WALL, "PUSH2": PUSH2, "STEP_IN": STEP_IN, "HAND": HAND, "CREAK": CREAK, "LOOK_UP": LOOK_UP,
      "QUIET": QUIET, "STING": STING, "RECOIL": RECOIL, "PUSH3": PUSH3, "END": END, "STATIC": STATIC, "GLITCH": GLITCH, "STEPS": STEPS,
      "ASK": ASK, "ASK_T": ASK_T,
      "LABEL": "TAPE 0013", "SUB": "CAM 07 / CAMCORDER  ·  SERVICE LEVEL B  ·  12/08/99",
      "RULE": "RULE 13: IF MONITOR 7 SHOWS A ROOM,\nDO NOT GO LOOKING FOR IT.",
      "STAMP1": [1, 9, 40], "STAMP2": [1, 13, 22], "STAMP3": [1, 14, 5], "DATE": "12-08-1999"}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\n")
print("DUR", DUR)
for v in VO: print(f'{v["id"]} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f} sub {v["s0"]:6.2f}-{v["s1"]:6.2f} {v["sub"]!r}')
