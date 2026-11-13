"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Tape 8 "Fire Door": Leon Marsh, December 3, 1999. On monitor 14 the fire door at the end of the service corridor opens
inward, toward the camera; fire doors only open out. He goes with his camcorder and pulls it open: on the other side is
this same corridor, and in it, his own back with the flashlight, half a second late. Beside that back, at its shoulder,
something tall with its head bent over. If that is this corridor, it is right next to him. He turns: it is there for a
moment, half lit, and the camcorder hits it. CAM 14 played back: he backs away, the door slams, and opens inward again.
Script: channel/scripts/SR08_fire_door.md
"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
START = {"L1": 0.4, "L2": 5.3, "L3": 15.95, "L4": 20.75}
POS = {"L1": "top", "L2": "top", "L3": "top", "L4": "top"}        # the bottom of the picture has his hand and the floor
VO = []
for k in ["L1", "L2", "L3", "L4"]:
    VO.append({"id": k, "who": lines[k]["who"], "t": START[k], "dur": durs[k], "sub": lines[k].get("sub", lines[k]["text"]), "col": "#f2f2f2",
               "fx": "cam", "pos": POS[k], "gain_db": {"L3": -2.5, "L4": -1.5}.get(k, 0.0)})

# ---------------------------------------------------------------- shots: office / corridor are Leon's camcorder (colour,
# hand-held); cctv is CAM 14 played back by the archive (black and white, 6 frames a second)
SHOTS = [["office", 0.0, 8.6], ["corridor", 8.6, 27.0], ["cctv", 27.0, 35.5]]
RECCUT = [8.6]               # he pauses and restarts the camcorder: STBY frames, a click
LAG = 0.5                    # beyond the door everything happens half a second later
FEED_OPEN = [0.75, 4.6]      # S1: on monitor 14 the fire door swings open toward the camera in held frames (14 -> 40 degrees)
EYES0 = [0.0, 0.9]           # S1: in the dark gap of the door, two white points (gone once it opens wider)
PUSH_IN = [0.3, 8.2]         # S1: the camcorder pushes in on the monitor
GRAB = 6.9                   # S1: he takes the flashlight off the desk (hand into frame), stands
WALK = [8.85, 13.55]         # S2: down the corridor toward the door (steps on the bob); each step echoes from beyond, half a second late
EGG = {"t": 12.0, "dur": 0.1, "what": "the 14 stencilled over the fire door reads 5 for six frames"}
REACH = [13.8, 14.35]        # his hand (the flashlight in it) comes up to the door's edge
PULL = [14.35, 15.6]         # he pulls the door open toward himself (40 -> 96 degrees): beyond it, this corridor
ARM_DOWN = [15.6, 16.25]
SWEEP = [17.0, 17.9]         # he moves the flashlight left and back; the beam beyond does it half a second later
ZOOM = [18.3, 19.9]          # the camcorder zooms in on the man beyond the door (his back, SECURITY)
EYES = 20.05                 # at that man's left shoulder: two white points open, looking back at the lens
ZOOM_OUT = [22.3, 23.3]      # he lets the zoom go
DIE = 22.95                  # the tube over the corridor pops and dies, the duct fan with it (beyond: half a second later)
QUIET = [23.5, 23.98]        # near silence
WHIP = [23.72, 23.98]        # he spins to his left
SCARE = [23.98, 24.17]       # it is right there, half lit by the exit sign and his flashlight
HIT = 24.12                  # the camcorder hits it (a thump on the mic, the preamp overloads)
DROP = 24.34                 # the flashlight hits the floor and rolls (beyond: half a second later)
SPIN = [24.34, 25.7]         # the flashlight's beam turns on the floor and stops
BACK = [25.9, 27.0]          # he backs away from the door, the camcorder still on it
ROLL = [27.0, 27.35]         # tracking roll into the CAM 14 playback
BACKOUT = [27.35, 30.9]      # CAM 14: he backs down the corridor toward the camera and out of frame under it
SLAM = 31.55                 # the door swings shut by itself
PUSH = [32.0, 34.9]          # the playback slowly zooms in on the door (x1.0 -> x2.1)
REOPEN = [33.35, 35.5]       # it opens inward again, in held frames
EYES2 = 34.65                # in the gap: two white points
END = 35.5
DUR = 36.5
STATIC = [[END, DUR]]        # no static before frame 1: the tape opens on monitor 14 (the loop comes back to it)
GLITCH = [[26.88, .12], [END - .3, .3]]
STING = HIT
STEPS = [round(WALK[0] + .25 + i / 1.7, 3) for i in range(8)]
assert 30 <= DUR <= 50
for i, v in enumerate(VO):
    v["s0"] = round(v["t"] - 0.05, 3)
    nxt = VO[i + 1]["t"] - 0.15 if i + 1 < len(VO) else 99
    cut = min([c for c in RECCUT + [s[2] for s in SHOTS] if c > v["t"]], default=99) - .06    # never across a cut
    v["s1"] = round(min(nxt, v["t"] + v["dur"] + 0.5, cut), 3)
    assert v["t"] + v["dur"] < nxt + .15, v["id"]
    assert v["t"] + v["dur"] - .05 < cut + .06, v["id"]
assert VO[3]["t"] + VO[3]["dur"] < DIE
TL = {"DUR": DUR, "VO": VO, "SHOTS": SHOTS, "RECCUT": RECCUT, "LAG": LAG, "FEED_OPEN": FEED_OPEN, "EYES0": EYES0, "PUSH_IN": PUSH_IN,
      "GRAB": GRAB, "WALK": WALK, "EGG": EGG, "REACH": REACH, "PULL": PULL, "ARM_DOWN": ARM_DOWN, "SWEEP": SWEEP, "ZOOM": ZOOM,
      "EYES": EYES, "ZOOM_OUT": ZOOM_OUT, "DIE": DIE, "QUIET": QUIET, "WHIP": WHIP, "SCARE": SCARE, "HIT": HIT, "DROP": DROP,
      "SPIN": SPIN, "BACK": BACK, "ROLL": ROLL, "BACKOUT": BACKOUT, "SLAM": SLAM, "PUSH": PUSH, "REOPEN": REOPEN, "EYES2": EYES2,
      "END": END, "STATIC": STATIC, "GLITCH": GLITCH, "STING": STING, "STEPS": STEPS,
      "LABEL": "TAPE 0008", "SUB": "CAMCORDER / CAM 14  ·  SERVICE CORRIDOR  ·  12/03/99",
      "RULE": "RULE 8: IF A FIRE DOOR OPENS INWARD,\nDO NOT LOOK THROUGH IT.",
      "STAMP0": [2, 14, 6], "STAMP1": [2, 16, 4], "DATE": "12-03-1999"}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\n")
print("DUR", DUR)
for v in VO: print(f'{v["id"]} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f} sub {v["s0"]:6.2f}-{v["s1"]:6.2f} {v["sub"]!r}')
