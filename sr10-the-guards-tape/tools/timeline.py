"""Single source of truth for timing: writes timeline.js (for the page) and out/timeline.json (for score, mix, srt).
  .venv/bin/python tools/timeline.py
Tape 10 "The Guard's Tape": Leon Marsh, December 5, 1999, 3:05 A.M., in the security office. His camcorder is on the two
desk monitors. Left, the VCR plays his own camcorder tape of his 3:01 round of the service corridor: empty. Right, the
same minute on CAM 14: something tall right behind him, its head bent over his shoulder. On both screens he turns round:
his tape shows the empty corridor; CAM 14 shows it has stepped round to stay at his back. He pauses the VCR and switches
the right monitor to CAM 02, live, this office: it is standing behind his chair. He turns round with the camcorder: the
office is empty. He turns back: on CAM 02 it is bent over him, and its long arm comes up round his head to the camcorder.
Long black fingers close over the lens from above (the grab is the one loud sound). When they let go, CAM 02 shows him
alone, and the paused frame of his own 3:01 tape now has it in it, facing his lens.
Script: channel/scripts/SR10_the_guards_tape.md
"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
lines = {l["id"]: l for l in cfg["lines"]}
durs = json.load(open(os.path.join(HERE, "voice", "out", "durations.json")))
START = {"L1": 0.35, "L2": 5.15, "L3": 11.55, "L4": 19.75}
GAIN = {"L1": -.5, "L2": -1.5, "L3": -3.0, "L4": -2.0}                     # the whispers sit a little lower (still 8 dB over everything else)
VO = []
for k in ["L1", "L2", "L3", "L4"]:
    VO.append({"id": k, "who": lines[k]["who"], "t": START[k], "dur": durs[k], "sub": lines[k].get("sub", lines[k]["text"]), "col": "#f2f2f2",
               "fx": "cam", "pos": "top", "gain_db": GAIN.get(k, 0.0)})

# ---------------------------------------------------------------- one camcorder shot (colour, hand-held) in the office;
# the two monitors carry the 3:01 tapes (left: his camcorder tape on the VCR; right: CAM 14, then CAM 02 live)
END = 31.2
DUR = 32.2
SHOTS = [["office", 0.0, END]]
RECCUT = []
HOLD_B = [0.0, 2.4]          # frame 1: the camcorder is close on the right monitor (CAM 14, 03:01): him, and it right behind him
PULL = [2.4, 4.0]            # it pulls back to both monitors (his own tape on the left, the same minute)
WALK31 = [-3.0, 6.3]         # in the 3:01 tapes: he walks slowly back up the corridor toward CAM 14
TURN31 = [6.3, 6.8]          # he turns round: his tape whips to the empty corridor; on CAM 14 it steps round to stay at his back
PRESS = [8.45, 9.6]          # his right hand to the desk: PAUSE on the VCR, then the switcher
PAUSE = 8.95                 # the VCR holds the frame from his tape (the empty corridor, looking at the fire door)
LIVE = 9.35                  # the right monitor switches to CAM 02, live: this office. It stands behind his chair
PUSH_B = [9.8, 11.6]         # the camcorder pushes in on it
WHIP1 = [13.25, 13.95]       # he swings round in the chair with the camcorder
PAN = [14.2, 18.2]           # the office behind him: the door, the calendar, his jacket on the hook, the lockers, CAM 02 itself
EGG = {"t": 15.9, "dur": 0.1, "what": "the tear-off calendar by the door reads 1 instead of 5 for six frames"}
WHIP2 = [18.55, 19.25]       # he swings back to the monitors
REACH = [22.85, 24.15]       # CAM 02, held frames: it is bent over him; its long arm comes up round his head to the camcorder
QUIET = [23.75, 24.3]        # near silence (he holds his breath, the room tone drops out of the camcorder's AGC)
COVER = [24.1, 24.3]         # long black fingers slide down over the lens from the top edge
STING = 24.3                 # the grab: the hand closes on the camcorder (a thump and a rub right on the mic, the preamp overloads)
DARK = [24.3, 27.0]          # the hand over the lens: the monitors' light between the fingers
RELEASE = [27.0, 27.6]       # it lets go (up and away)
TO_A = [28.2, 29.8]          # the camcorder goes to the left monitor (the paused frame of his own tape)
REVEAL = 28.75               # the VCR's pause bar rolls through it: now it is in the frame, facing his lens
FOCUS = [29.2, 29.75]        # the autofocus finds it
STATIC = [[END, DUR]]        # no static before frame 1: the tape opens on the monitor (the loop comes back to it)
GLITCH = [[STING, .1], [END - .3, .3]]
STEPS31 = [round(-3.0 + .3 + i * .78, 3) for i in range(12)]   # his steps in the 3:01 tape (heard from the TV's speaker)
ASK = "TURN AROUND OR KEEP FILMING?"
ASK_T = round(DUR - 2.5, 3)  # owner 11/16: the last 2.5 s carry the two-choice question under the rule card
STEPS31 = [s for s in STEPS31 if 0 <= s < TURN31[0]]
assert 30 <= DUR <= 50
for i, v in enumerate(VO):
    v["s0"] = round(v["t"] - 0.05, 3)
    nxt = VO[i + 1]["t"] - 0.15 if i + 1 < len(VO) else 99
    cut = min([c for c in RECCUT + [s[2] for s in SHOTS] if c > v["t"]], default=99) - .06    # never across a cut
    v["s1"] = round(min(nxt, v["t"] + v["dur"] + 0.5, cut), 3)
    assert v["t"] + v["dur"] < nxt + .15, v["id"]
    assert v["t"] + v["dur"] - .05 < cut + .06, v["id"]
assert VO[3]["t"] + VO[3]["dur"] < QUIET[0] - .5
TL = {"DUR": DUR, "VO": VO, "SHOTS": SHOTS, "RECCUT": RECCUT, "HOLD_B": HOLD_B, "PULL": PULL, "WALK31": WALK31, "TURN31": TURN31,
      "PRESS": PRESS, "PAUSE": PAUSE, "LIVE": LIVE, "PUSH_B": PUSH_B, "WHIP1": WHIP1, "PAN": PAN, "EGG": EGG, "WHIP2": WHIP2,
      "REACH": REACH, "QUIET": QUIET, "COVER": COVER, "STING": STING, "DARK": DARK, "RELEASE": RELEASE, "TO_A": TO_A,
      "REVEAL": REVEAL, "FOCUS": FOCUS, "END": END, "STATIC": STATIC, "GLITCH": GLITCH, "STEPS31": STEPS31, "ASK": ASK, "ASK_T": ASK_T,
      "LABEL": "TAPE 0010", "SUB": "CAMCORDER / CAM 14  ·  SECURITY OFFICE  ·  12/05/99",
      "RULE": "RULE 10: IF THE MONITOR SHOWS IT BEHIND YOU,\nDO NOT TURN AROUND.",
      "STAMP14": [3, 1, 12], "STAMP02": [3, 5, 31], "DATE": "12-05-1999"}
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
json.dump(TL, open(os.path.join(HERE, "out", "timeline.json"), "w"), indent=1)
open(os.path.join(HERE, "timeline.js"), "w").write("// generated by tools/timeline.py: do not edit\nwindow.TL = " + json.dumps(TL) + ";\n")
print("DUR", DUR)
for v in VO: print(f'{v["id"]} {v["t"]:6.2f}-{v["t"] + v["dur"]:6.2f} sub {v["s0"]:6.2f}-{v["s1"]:6.2f} {v["sub"]!r}')
