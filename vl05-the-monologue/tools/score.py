"""Score for Volt Labs 5 "The Monologue": the Volt Labs band (tools/band.py, the same band as VL4 and VL6), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits). The 11/7 score replaced.

Cue sheet (music under setups, silence under punchlines; the room tone, the microwave and the foley carry the silences):
  M1  0.00 -> before L2   the theme from frame 1 (the receipt pours off the bench, "Every great villain needs a monologue."),
                          resolved on D before "Timer's on."
  M2  PACE -> MONT0       tiptoe (pizzicato bass and pom chords) under "People of Earth!" as she starts pacing
  M3  MONT0 -> MONT1      the theme at one and a half times the tempo through the time-lapse (night falls, the plants go, the
                          timer races), stopped dead on the cut to her hoarse "...and THAT is why" (silence lands it)
  (L4-L7, the flower drop: no music; the microwave hums on until the ding)
  M4  L8 -> before L9     tiptoe under "Fine. Short version." and the tear, stopped before "Kneel."
  M5  BOARD               the theme's first bar as the sixth circle goes on, then
  hit circle closed       the button (dun-DUN). One hit in the episode.
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
b = Band(DUR, bpm=TL["BPM"], seed=5)
B = b.B

b.cue(0.0, V["L2"]["t"] - .35, "theme", end="cadence", bars=["A1", "A2", "B2"], until=V["L2"]["t"] - .1)
b.cue(TL["PACE0"] + .1, TL["MONT0"], "tiptoe", end="cut", level=.65)
b.cue(TL["MONT0"], TL["MONT1"], "theme", end="cut", speed=1.5, level=.95, bars=["A1", "A2", "B1", "B2", "A1"])
b.cue(V["L8"]["t"] - .05, V["L9"]["t"] - .08, "tiptoe", end="cut", level=.7)
hit = TL["BOARDT"] + 1.3                                       # the sixth circle closes (film.js drawRentCircles)
b.cue(TL["BOARDT"] + .05, hit - .5 * B, "tag", end="cadence", level=.9)
b.hit(hit, "button")

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
