"""Score for Volt Labs 12 "Robo-Cleo": the Volt Labs band (tools/band.py, the same band as VL4-11), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits).

Cue sheet (music under setups and the chase, silence under punchlines; the bell, the robot and the room carry the rest):
  M1  0.00 -> "Cheaper than free?"   the theme from frame 1 (Vera presents Robo-Cleo), resolved before Cleo's line
  M2  "Now press nothing..."          a tiptoe under the order, cut dead on the light switch ("Pressing." in the dark, in silence)
  M3  the lights come back            a pizzicato scurry with the robot's run up and down the bench (toaster, ice, back to
                                      Cleo), cut dead when Cleo speaks ("Do not press your off switch." "Pressing." in silence)
  hit Cleo's finger over the switch   uh-oh
  M4  the card                        the theme's tag after "Deal.", then the button under the end card
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
b = Band(DUR, bpm=TL["BPM"], seed=12)
B = b.B

b.cue(0.0, V["L2"]["t"] - .15, "theme", end="cadence", bars=["A1", "A2"], until=V["L2"]["t"] - .1, level=.7)   # under the whole of L1
b.cue(TL["DING1"] + .35, TL["SW1"] - .02, "tiptoe", end="cut", level=.6)
b.cue(TL["SW4"] + .05, V["L9"]["t"] - .05, "scurry", end="cut", level=.85, pan=(-.45, .5))
b.hit(TL["HOVER"] + .02, "uhoh", level=.8)
hit = TL["BOARDT"] + 1.4                                        # the card is up, the 13th loop is drawn
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
