"""Score for Volt Labs 14 "Doomsday Weather": the Volt Labs band (tools/band.py, the same band as VL4-13), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits).

Cue sheet (music under setups, silence under punchlines; the roof's street air and the machine's hum carry the rest):
  M1  0.00 -> "I brought a sled."          the theme from frame 1 (the machine, the banner), resolved before Cleo
  M2  "This is not a snow day..."          a build under the wind-up (the needle to MAX), cut dead on the puff: one tiny cloud
  hit the snow falls on our yard only     uh-oh
  M3  "Maximum doom!"                      the build again while the drift rises, cut dead before "Get in."
  M4  the smash cut down the slope         a scurry under "Wheeeee!", cut dead on the landing
  M5  the card                             the theme's tag after "Sure.", then the button under the end card
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
b = Band(DUR, bpm=TL["BPM"], seed=14)
B = b.B

b.cue(0.0, V["L2"]["t"] - .15, "theme", end="cadence", bars=["A1", "A2"], until=V["L2"]["t"] - .1, level=.7)
b.cue(V["L3"]["t"] - .05, TL["PUFF"] - .03, "build", end="cut", level=.6)
b.hit(TL["SNOW0"] + .1, "uhoh", level=.8)
b.cue(TL["LEVER2"] - .05, TL["RISE1"] + .1, "build", end="cut", level=.6)
b.cue(TL["SLOPE0"] - .02, TL["LAND"] - .02, "scurry", end="cut", level=.75)
hit = TL["BUTTON"] + .5                                         # the card is up
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
