"""Score for Volt Labs 6 "Lab Inspection": the Volt Labs band (tools/band.py, the same band as VL4 and VL5), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits). The 11/7 score replaced.

Cue sheet (music under setups and the dashes, silence under punchlines; the room tone and the foley carry the silences):
  M1  0.00 -> L2          the theme from frame 1 (the wall already turning into a bakery, the knock, "City inspection!"),
                          resolved before "Welcome to Volt's Bakery!"
  M2  her first step      the inspector's stomp, its beat on her footsteps, under "We got a report of a mad scientist.",
                          stopped before "Here? We just make bread."
  M3  FLIPR -> SLAMR      a pizzicato scurry with Cleo's dash to the right button (panned with her), stopped on the slam
  M4  L5                  tiptoe under "Why does it smell like ozone?", stopped before "Sourdough."
  M5  BEEPS -> GULP       a pedal that grows while the croissant beeps and Vera dashes, stopped dead on the gulp
  M6  VDASH2 -> SLAML     the scurry again, right to left, stopped on the slam ("Clean. Quiet. Five stars." in silence)
  M7  L8                  tiptoe under "Two dozen croissants. Pickup at eight." as she leaves, stopped before Vera's whisper
  (L9, L10, the beeps in her stomach and the hiccup: no music)
  hit after the hiccup    the button (dun-DUN) as the smoke ring rises. One hit in the episode.
  .venv/bin/python tools/score.py            -> out/music.wav (active RMS -20 dBFS; the mix sets its level), out/music_cues.json
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE
from band import Band

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
V = {v["id"]: v for v in TL["VO"]}
DUR = TL["DUR"]
b = Band(DUR, bpm=TL["BPM"], seed=6)
B = b.B

b.cue(0.0, V["L2"]["t"] - .05, "theme", end="cadence", bars=["A1", "B2"], until=V["L2"]["t"] + .25)
step1 = TL["WALKIN"] + 1 / 1.9                                 # her first footfall (travel.js footfalls, 1.9 steps a second)
b.cue(step1, V["L4"]["t"] - .1, "grump", end="cut", level=.8, speed=B * 1.9)
b.cue(TL["FLIPR"] + .05, TL["SLAMR"] + .04, "scurry", end="cut", level=.8, pan=(-.1, .7))
b.cue(V["L5"]["t"] - .15, V["L6"]["t"] - .12, "tiptoe", end="cut", level=.65)
b.cue(TL["BEEPS"], TL["GULP"] - .1, "build", end="cut", rise=(TL["BEEPS"], TL["GULP"]), level=.85)
b.cue(TL["VDASH2"], TL["SLAML"] + .04, "scurry", end="cut", level=.8, pan=(.3, -.7))
b.cue(V["L8"]["t"] - .1, V["L9"]["t"] - .1, "tiptoe", end="cut", level=.65)
b.hit(TL["HIC"] + .5, "button")

GP = os.path.join(HERE, "tools", "score_gain.json")                 # the band's balance, dB per stem (band.py STEM_DB)
mus = b.render(json.load(open(GP)) if os.path.exists(GP) else None)
w = int(.1 * SR)
e = np.sqrt((mus[:len(mus) // w * w].reshape(-1, w, 2) ** 2).mean((1, 2)))
act = e[e > 1e-4]
mus *= 10 ** (-20 / 20) / np.sqrt((act ** 2).mean())             # active RMS -20 dBFS, like every effect; mix.json music_db sets the level
sf.write(os.path.join(HERE, "out", "music.wav"), mus.astype(np.float32), SR, subtype="FLOAT")
json.dump({"cues": b.cues, "hits": b.hits}, open(os.path.join(HERE, "out", "music_cues.json"), "w"), indent=1)
for c in b.cues:
    print(c)
print("music on (> -40 dBFS) in %.1f of %.1f s; hits: %d" % ((20 * np.log10(e + 1e-9) > -40 + 20 * np.log10(np.sqrt((act ** 2).mean()) / .1)).sum() * .1, DUR, b.hits))
