"""Score for Volt Labs 11 "Doorbuster": the Volt Labs band (tools/band.py, the same band as VL4-10), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits).

Cue sheet (music under setups and the chase, silence under punchlines; the street, the line, the rocket and the store carry the rest):
  M1  0.00 -> "It's Black Friday."   the theme from frame 1 (the rocket cart at the end of the line), resolved before Cleo's line
  M2  "Cleo. On three..."            a climbing pedal under the countdown, cut dead when she presses it on "two"
  M3  the run                        the theme, faster, from the moment the cart moves: past the line, through the doors, down the
                                     aisle; cut dead on the crash ("Got it!", "I ordered one online.", "You said 'rocket.'" in the
                                     store's own air)
  hit she presses it again          uh-oh
  M4  the card                       the theme's first bar as the cart is gone, then the button under the end card
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
end = lambda k: V[k]["t"] + V[k]["dur"]
DUR = TL["DUR"]
b = Band(DUR, bpm=TL["BPM"], seed=8)
B = b.B

b.cue(0.0, V["L2"]["t"] - .15, "theme", end="cadence", bars=["A1", "A2"], until=V["L2"]["t"] - .1)
b.cue(V["L4"]["t"] - .1, TL["PRESS"] - .02, "build", end="cut", rise=(V["L4"]["t"], TL["PRESS"] + .6), level=.6)
b.cue(TL["LAUNCH"] + .05, TL["CRASH"] - .02, "theme", end="cut", level=.85, bars=["B1", "B2", "A1", "A2", "B1", "B2"], speed=1.3)
b.hit(TL["PRESS2"] + .06, "uhoh", level=.8)
hit = TL["GONE"] + .95                                          # the cart is gone; the card is up
b.cue(hit - 1.92, hit - .5 * B, "tag", end="cadence", level=.85)
b.hit(hit, "button")

GP = os.path.join(HERE, "tools", "score_gain.json")             # the band's balance, dB per stem (band.py STEM_DB)
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
