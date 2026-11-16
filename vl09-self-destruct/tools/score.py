"""Score for Volt Labs 8 "Invisible": the Volt Labs band (tools/band.py, the same band as VL4-7), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits).

Cue sheet (music under setups and the walks, silence under punchlines; the room tone, the street and the foley carry the rest):
  M1  0.00 -> the scan      the theme from frame 1 (the empty coat raises the potion: "I'm invisible!"), light staccato
                            arpeggios under the spec scan, resolved on D before "You look better."
  M2  "Now..." -> street    the theme again as the empty coat strides out of the lab and down the sidewalk on its own,
                            stopped as it arrives beside the man ("Boo!" and everything after it in the street's own air)
  M3  the potion wears off  a short pedal under the fizz, then
  hit her face is back      a bright little ta-da (the biggest visual gag: he finally screams)
  M4  he runs               a pizzicato scurry with him, out to the right
  M5  Cleo walks in         tiptoe, stopped before "Told you. You looked better."
  M6  the board             the theme's first bar as the ninth circle goes on, then the button. Two hits in the episode.
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

b.cue(0.0, TL["HUD1"] - .1, "theme", end="cadence", bars=["A1", "A2", "scan", "scanend"], until=V["L2"]["t"] - .1)
b.cue(V["L3"]["t"] + 1.45, TL["ARRIVE"] + .2, "theme", end="cut", level=.8, bars=["B1", "B2", "A1", "A2"])
b.cue(TL["FIZZ"], TL["VISIBLE"], "build", end="cut", rise=(TL["FIZZ"], TL["VISIBLE"]), level=.7)
b.hit(TL["VISIBLE"], "ta", level=.85)
b.cue(TL["RUN"] + .05, TL["RUN"] + 1.25, "scurry", end="fade", fade=.35, pan=(.2, .9), level=.8)
b.cue(TL["CWALK"], V["L13"]["t"] - .1, "tiptoe", end="cut", level=.65)
hit = TL["BOARDT"] + 1.3                                        # the ninth circle closes (film.js drawRentCircles)
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
