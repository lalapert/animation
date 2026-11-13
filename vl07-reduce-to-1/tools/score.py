"""Score for Volt Labs 7 "Reduce to 1%": the Volt Labs band (tools/band.py, the same band as VL4-6), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits).

Cue sheet (music under setups, silence under punchlines; the room tone and the foley carry the silences):
  M1  0.00 -> L1        the theme from frame 1 (the notice goes in, the 1% copy comes out, "Rent notice. Reduced to one
                        percent."), resolved on D before "It still says twelve hundred."
  M2  the stairs        the landlord's stomp, its beat on his steps down the wooden stairs and in, stopped as he arrives
                        ("Miss Volt. It's next month." in silence)
  M3  L5 -> L6          a pedal that grows while the magnifying glass comes down over the 1% copy, stopped dead as the
                        notice becomes readable ("Twelve hundred. Friday." in silence)
  M4  the dial          a pedal that grows with the dial clicks and the straining copier, cut dead on the 400% copy
  hit after the burst   uh-oh (a low unison semitone fall) as Vera goes down under the paper: the biggest visual gag
  M5  the white flag    the theme's first bar as her arm comes up with the tiny notice and the eighth circle goes on, then
  hit circle closed     the button. Two hits in the episode. The end card plays over its ring and the room tone.
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
b = Band(DUR, bpm=TL["BPM"], seed=7)
B = b.B

b.cue(0.0, 3.2, "theme", end="cadence", bars=["A1", "B2"], until=V["L2"]["t"] - .1)
stair0 = TL["DOOR"] + .5                                        # his first step on the stairs (film.js EV), .42 s apart
b.cue(stair0, TL["ARRIVE"] - .02, "grump", end="cut", level=.8, speed=B / .42)
b.cue(V["L5"]["t"] - .1, V["L6"]["t"] - .05, "build", end="cut", rise=(TL["MAG0"], V["L6"]["t"]), level=.7)
b.cue(TL["DIAL0"], TL["BLAST"], "build", end="cut", rise=(TL["DIAL0"] + .3, TL["BLAST"]), level=.85)
b.hit(TL["BLAST"] + .35, "uhoh", level=.9)
hit = TL["BOARDT"] + 1.3                                        # the eighth circle closes (film.js drawRentCircles)
b.cue(hit - 2 * 4 * B / 2 - .1, hit - .5 * B, "tag", end="cadence", level=.85)
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
