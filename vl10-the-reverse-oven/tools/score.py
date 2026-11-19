"""Score for Volt Labs 10 "The Reverse Oven": the Volt Labs band (tools/band.py, the same band as VL4-9), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits).

Cue sheet (music under setups and the movement, silence under punchlines; the room tone, the oven and the foley carry the rest):
  M1  0.00 -> "Extra crispy."   the theme from frame 1 (the burnt turkey, "Thanksgiving is ruined."), resolved before Cleo's line
  M2  the oven reverses         a pedal that climbs while the turkey un-burns, goes raw, a bag, a receipt; cut dead on the cash
  M3  the dash                  a pizzicato scurry, out to the gauntlet and back
  hit the clock's dial          uh-oh (a low unison semitone fall); the rewind is the episode's own sound backwards (mix.py)
  M1' frame 1 again             the same theme bars as the opening, so the loop is the same picture and the same music
  M4  the board                 the theme's first bar under the end card as the eleventh loop closes, then the button
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
b.cue(TL["REV0"] + .05, TL["CASH"], "build", end="cut", rise=(TL["REV0"], TL["CASH"]), level=.65)
b.cue(TL["RUN0"] - .05, TL["BACK"] + .35, "scurry", end="fade", fade=.25, pan=(.3, -.5), level=.75)
b.hit(TL["C_DIAL"] + .05, "uhoh", level=.8)
b.cue(TL["REW1"], TL["REW1"] + V["L2"]["t"] - .15, "theme", end="cadence", bars=["A1", "A2"], until=TL["REW1"] + V["L2"]["t"] - .1)
hit = TL["BOARDT"] + 1.2                                        # the eleventh loop closes (film.js drawRentSpiral)
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
