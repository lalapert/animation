"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Tape 7 "Foto 1 Hour": Leon Marsh, December 2, 1999. The one-hour photo machine in a locked store is printing by itself:
photos of the store's CCTV camera, taken from right underneath it, then one of Leon from behind, taken a minute ago.
CAM 05 played back for the same minute: something stands behind him, looking up at the camera. Back on the camcorder a
flash charges behind him, goes off, and its light throws a second shadow next to his. He turns: nothing. The machine
drops one more print. Script: channel/scripts/SR07_foto_1_hour.md
"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
START = {"L1": 0.8, "L2": 5.55, "L3": 10.2, "L4": 14.5}
POS = {"L1": "top", "L2": "bottom", "L3": "top", "L4": "top"}        # S2 has the prints and his hand at the bottom
VO = []
for k in ["L1", "L2", "L3", "L4"]:
    VO.append({"id": k, "who": lines[k]["who"], "t": START[k], "dur": durs[k], "sub": lines[k].get("sub", lines[k]["text"]), "col": "#f2f2f2",
               "fx": "cam", "pos": POS[k], "gain_db": 0.0})

# ---------------------------------------------------------------- shots: machine / prints / dark are Leon's camcorder (colour,
# hand-held); cctv is CAM 05 played back by the archive (black and white, 6 frames a second)
SHOTS = [["machine", 0.0, 9.4], ["prints", 9.4, 19.0], ["cctv", 19.0, 26.4], ["dark", 26.4, 40.2]]
RECCUT = [9.4]               # he pauses and restarts the camcorder: STBY frames, a click
STEP_IN = [2.2, 2.75]        # S1: two steps toward the machine
FEED = [0.0, 1.2]            # S1 from frame 1: a print is already half out of the rollers and feeds out under the red lamp
DROPS = [1.45, 6.6]          # S1: a print slides out and lands in the tray (the time it lands)
TILT_TRAY = [6.0, 7.4]       # S1: he looks down at the tray
EGG = {"t": 3.6, "dur": 0.1, "what": "the lightbox over the machine reads FOTO 8 HOUR for six frames"}
FLIPS = [10.4, 11.3, 12.2, 13.5]   # S2: his thumb slides the top print off the stack (P1 -> P2 -> P3 -> P4 -> P5)
DROPS2 = [12.75]             # S2: the machine drops another print (off screen, behind the stack)
FOCUS_P5 = [13.6, 14.25]     # the autofocus hunts on the print of himself
SHUTTER = 18.1               # a shutter clicks behind him (no flash): the sound that should not be there
ROLL = [19.0, 19.35]         # tracking roll into the CAM 05 playback
PUSH = [19.0, 24.2]          # the playback slowly zooms in on the dark behind him (x1.0 -> x1.6)
FLICKER = 20.6               # the lightbox starts to flicker
SKIP = [21.8, 0.25]          # the tape skips (held frames, a tear)
SIGN_DIE = 24.2              # the lightbox dies
EYES = 24.5                  # in the dark behind him: two white points, looking up at the camera
CRASH = [25.2, 25.32]        # crash zoom onto them (x1.6 -> x2.6)
LOOK_UP = [27.0, 27.8]       # S4: he looks up at the dead lightbox, then back down
LOOK_DOWN = [27.8, 28.4]
WHINE = [28.6, 30.6]         # a flash charging behind him; the swell under it; both stop dead
TORCH_OFF = 30.5             # his flashlight (on the machine) flickers out: black
QUIET = 30.6                 # near silence
POP = 31.15                  # shutter + flash: for six frames the room is lit from behind him: his shadow and a second one
FLASH = [31.15, 31.57]       # two white frames, then the burnt frame with the two shadows holds (~0.4 s)
AFTER = [31.57, 31.95]        # the camcorder recovers: a burnt-in afterimage of the two shadows
WHIP = [31.95, 32.45]        # he spins round toward the entrance
SPUTTER = [31.95, 35.7]       # his flashlight, on the machine behind him, sputters: weak flickers light the floor and the shutter
CAM_UP = [33.1, 33.9]        # he tilts up at the corner: CAM 05 and its red light, from below, like the prints
MOTOR = 34.6                 # behind him the machine starts again
DROP_LAST = 35.2             # one more print lands in the tray
TURN_BACK = [35.0, 35.9]
TORCH_ON = 35.7              # the flashlight comes back on
PICKUP = [35.9, 36.7]        # his hand takes the new print from the tray and raises it to the lens
PRINT_FOCUS = [36.7, 37.25]  # the autofocus hunts, then lands on it: him mid-turn, and it, bent over his shoulder
WHINE2 = 38.6                # the flash starts charging again
END = 40.2
DUR = 41.2
STATIC = [[END, DUR]]          # no static before frame 1: the tape opens on the machine (the loop comes back to it)
GLITCH = [[SKIP[0], SKIP[1]], [26.32, .12], [END - .3, .3]]
STING = POP
assert 30 <= DUR <= 50
for i, v in enumerate(VO):
    v["s0"] = round(v["t"] - 0.05, 3)
    nxt = VO[i + 1]["t"] - 0.15 if i + 1 < len(VO) else 99
    cut = min([c for c in RECCUT + [s[2] for s in SHOTS] if c > v["t"]], default=99) - .06    # never across a cut
    v["s1"] = round(min(nxt, v["t"] + v["dur"] + 0.5, cut), 3)
    assert v["t"] + v["dur"] < nxt + .15, v["id"]
    assert v["t"] + v["dur"] - .05 < cut + .06, v["id"]
TL = {"DUR": DUR, "VO": VO, "SHOTS": SHOTS, "RECCUT": RECCUT, "FEED": FEED, "SPUTTER": SPUTTER, "STEP_IN": STEP_IN, "DROPS": DROPS, "TILT_TRAY": TILT_TRAY, "FLIPS": FLIPS,
      "DROPS2": DROPS2, "FOCUS_P5": FOCUS_P5, "SHUTTER": SHUTTER, "ROLL": ROLL, "PUSH": PUSH, "FLICKER": FLICKER, "SKIP": SKIP, "SIGN_DIE": SIGN_DIE,
      "EYES": EYES, "CRASH": CRASH, "LOOK_UP": LOOK_UP, "LOOK_DOWN": LOOK_DOWN, "WHINE": WHINE, "TORCH_OFF": TORCH_OFF, "QUIET": QUIET, "POP": POP,
      "FLASH": FLASH, "AFTER": AFTER, "WHIP": WHIP, "CAM_UP": CAM_UP, "MOTOR": MOTOR, "DROP_LAST": DROP_LAST, "TURN_BACK": TURN_BACK,
      "TORCH_ON": TORCH_ON, "PICKUP": PICKUP, "PRINT_FOCUS": PRINT_FOCUS, "WHINE2": WHINE2, "END": END, "STATIC": STATIC, "GLITCH": GLITCH,
      "STING": STING,
      "LABEL": "TAPE 0007", "SUB": "CAMCORDER / CAM 05  ·  FOTO 1 HOUR  ·  12/02/99",
      "RULE": "RULE 7: IF A FLASH GOES OFF\nBEHIND YOU, DO NOT TURN AROUND.",
      "STAMP0": [3, 12, 31], "DATE": "12-02-1999", "EGG": EGG}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\n")
print("DUR", DUR)
for v in VO: print(f'{v["id"]} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f} sub {v["s0"]:6.2f}-{v["s1"]:6.2f} {v["sub"]!r}')
