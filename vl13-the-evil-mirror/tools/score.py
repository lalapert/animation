"""Score for Volt Labs 13 "The Evil Mirror": the Volt Labs band (tools/band.py, the same band as VL4-12), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits).

Cue sheet (music under setups, silence under punchlines; the mirror's singing glass carries the rest):
  M1  0.00 -> "Why would you want that?"   the theme from frame 1 (Vera and her goateed reflection), resolved before Cleo
  M2  "Twice the genius..."                a tiptoe while she looks in, cut dead on the flash as Evil Vera steps out
                                           ("I paid the rent. Early." "You did WHAT?" in the lab's air and the glass)
  M3  Cleo walks over and looks in        the tiptoe again, cut dead on the flash ("No." "We know." in silence)
  hit the real Cleo goes into the mirror  uh-oh (the goatee stays)
  M4  the card                             the theme's tag after "Normal.", then the button under the end card
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
b = Band(DUR, bpm=TL["BPM"], seed=13)
B = b.B

b.cue(0.0, V["L2"]["t"] - .15, "theme", end="cadence", bars=["A1", "A2"], until=V["L2"]["t"] - .1, level=.7)
b.cue(V["L3"]["t"] - .05, TL["OUT1"] - .02, "tiptoe", end="cut", level=.6)
b.cue(TL["CW0"] - .1, TL["OUT2"] - .02, "tiptoe", end="cut", level=.6)
b.hit(TL["IN2"] + .05, "uhoh", level=.8)
hit = TL["BOARDT"] + 1.4                                        # the card is up, the 14th loop is drawn
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
