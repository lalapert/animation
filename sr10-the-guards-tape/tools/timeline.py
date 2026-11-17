"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Tape 9 "Carousel": Leon Marsh, December 4, 1999. The power is off in the center court and the carousel is turning in the
moonlight, its band organ dragging. Three poles have no horse. CAM 21 played back: on one turn, one more horse is gone
between two frames. In the east hall his camcorder finds them: carousel horses on their broken poles, standing in the
dark, facing him. On the camcorder they never move. On every CAM 22 cut they are closer and turned a little more toward
the camera. At the end, on CAM 22, the nearest one turns its head to the lens in held frames; its neck bends where a
carousel horse has no joint, its pole scrapes the floor; the organ stops dead. No jump: the ending is the movement.
Script: channel/scripts/SR09_carousel.md
"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
START = {"L1": 0.5, "L2": 5.05, "L3": 18.2, "L4": 28.3}
GAIN = {"L3": -2.0, "L4": -1.5}                     # the whispers sit a little lower (still 8 dB over everything else)
VO = []
for k in ["L1", "L2", "L3", "L4"]:
    VO.append({"id": k, "who": lines[k]["who"], "t": START[k], "dur": durs[k], "sub": lines[k].get("sub", lines[k]["text"]), "col": "#f2f2f2",
               "fx": "cam", "pos": "top", "gain_db": GAIN.get(k, 0.0)})

# ---------------------------------------------------------------- shots: court / hall / hall2 are Leon's camcorder (colour,
# hand-held); cctv1 is CAM 21 (center court), cctv2 / cctv3 are CAM 22 (east hall), played back by the archive (6 fps)
SHOTS = [["court", 0.0, 8.4], ["cctv1", 8.4, 13.8], ["hall", 13.8, 24.2], ["cctv2", 24.2, 28.0], ["hall2", 28.0, 31.6], ["cctv3", 31.6, 37.6]]
RECCUT = [13.8]              # he pauses and restarts the camcorder on the way into the hall: STBY frames, a click
REV = 5.2                    # one turn of the carousel, seconds (it drags)
SWEEP = [1.4, 4.2]           # S1: his flashlight sweeps along the horses going past
EGG = {"t": 6.6, "dur": 0.1, "what": "the sign at the carousel gate reads RIDE 2c instead of RIDE 50c for six frames"}
ROLL1 = [8.4, 8.75]          # tracking roll into the CAM 21 playback
PUSH1 = [8.75, 10.95]        # the playback zooms in on one horse going round and holds it in the middle (x1.0 -> x1.75)
VANISH = 10.95               # between two CAM 21 frames (10.833 and 11.0) that horse is gone
PAUSE = [10.95, 11.7]        # the archivist pauses on the frame before: the horse on its pole, in the middle (the deck goes quiet)
STEP = [11.7, 12.45]         # steps one frame on: the same pole, empty
PLAY = 12.45                 # and plays on (the tape runs 1.5 s behind from here)
WALK = [14.0, 16.6]          # S3: into the east hall, the flashlight on the floor: long scrape marks on the tiles
RISE = [16.6, 17.7]          # the flashlight follows the scrapes up: a carousel horse, on its pole, facing him
FIND = [19.4, 21.0]          # the flashlight finds three more behind it
ZOOM = [21.2, 22.5]          # the camcorder zooms on the nearest one's face
ZOOM_OUT = [22.9, 23.6]
STEP_BACK = 23.65            # he steps back
ROLL2 = [24.2, 24.55]        # tracking roll into CAM 22
FLICK = 12.6                 # the emergency light in the hall starts to flicker (it stutters on every CAM 22 cut)
TURN = [33.2, 33.533, 33.867]  # CAM 22, held frames: the nearest horse turns its head toward the lens
SNAP = 34.2                  # one frame: the head has turned past the lens and lies on its side, the neck cracked halfway up
SCRAPE = [34.2, 34.85]       # it leans on its pole; the pole scrapes the floor toward the camera
DEAD = 34.9                  # the organ stops dead, the drone with it
CRASH = [35.4, 35.55]        # a crash zoom onto its face (silent)
END = 37.6
DUR = 38.6
STATIC = [[END, DUR]]        # no static before frame 1: the tape opens on the carousel turning (the loop comes back to it)
GLITCH = [[13.62, .12], [END - .3, .3]]
STEPS = [round(WALK[0] + .3 + i / 1.6, 3) for i in range(4)]
STEPS1 = [6.0, 6.55]         # S1: he steps closer to the gate
assert 30 <= DUR <= 50
for i, v in enumerate(VO):
    v["s0"] = round(v["t"] - 0.05, 3)
    nxt = VO[i + 1]["t"] - 0.15 if i + 1 < len(VO) else 99
    cut = min([c for c in RECCUT + [s[2] for s in SHOTS] if c > v["t"]], default=99) - .06    # never across a cut
    v["s1"] = round(min(nxt, v["t"] + v["dur"] + 0.5, cut), 3)
    assert v["t"] + v["dur"] < nxt + .15, v["id"]
    assert v["t"] + v["dur"] - .05 < cut + .06, v["id"]
TL = {"DUR": DUR, "VO": VO, "SHOTS": SHOTS, "RECCUT": RECCUT, "REV": REV, "SWEEP": SWEEP, "EGG": EGG, "ROLL1": ROLL1, "PUSH1": PUSH1,
      "VANISH": VANISH, "PAUSE": PAUSE, "STEP": STEP, "PLAY": PLAY, "WALK": WALK, "RISE": RISE, "FIND": FIND, "ZOOM": ZOOM, "ZOOM_OUT": ZOOM_OUT, "STEP_BACK": STEP_BACK, "ROLL2": ROLL2,
      "FLICK": FLICK, "TURN": TURN, "SNAP": SNAP, "SCRAPE": SCRAPE, "DEAD": DEAD, "CRASH": CRASH, "END": END, "STATIC": STATIC,
      "GLITCH": GLITCH, "STEPS": STEPS, "STEPS1": STEPS1,
      "LABEL": "TAPE 0009", "SUB": "CAMCORDER / CAM 21-22  ·  CENTER COURT  ·  12/04/99",
      "RULE": "RULE 9: IF THE CAROUSEL TURNS AT NIGHT,\nDO NOT FOLLOW THE HORSES.",
      "STAMP0": [1, 50, 8], "STAMP1": [1, 52, 40], "DATE": "12-04-1999"}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\n")
print("DUR", DUR)
for v in VO: print(f'{v["id"]} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f} sub {v["s0"]:6.2f}-{v["s1"]:6.2f} {v["sub"]!r}')
