"""Score for Volt Labs 9 "Self-Destruct": the Volt Labs band (tools/band.py, the same band as VL4-8), cued to the scene
(owner 11/13: music that fits and serves the scene, stops for punchlines, at most two or three hits).

Cue sheet (music under setups and the walks, silence under punchlines; the room tone and the foley carry the rest):
  M1  0.00 -> "Are you smiling?"   the theme from frame 1 (Cleo smiling at two red buttons), resolved on D before "No."
  M2  she goes for coffee          tiptoe (no brushes) under the walk out and Cleo's shell game, cut the moment Vera is back
                                   and stops ("Which one is the self-destruct?" and "One of them." in the room's own air)
  hit Cleo presses it              uh-oh (a low unison semitone fall)
  M3  the countdown                a pedal that climbs with the wall display, 5 to 0, cut dead on zero: the remote's own small
                                   bang and "...Technically, it worked." in silence
  M4  the board                    the theme's first bar as the tenth circle goes on, then the button. Two hits in the episode.
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

b.cue(0.0, end("L3") + .05, "theme", end="cadence", bars=["A1", "A2", "B1", "B2"], until=V["L4"]["t"] - .1)
b.cue(TL["WALK0"] - .2, TL["ARR"] + .05, "tiptoe", end="cut", level=.7, bars=["A1", "A2", "B1", "B2"])
b.hit(TL["PRESS"] + .08, "uhoh", level=.8)
b.cue(TL["ALARM"] + .1, TL["ZERO"] - .02, "build", end="cut", rise=(TL["ALARM"] + .1, TL["ZERO"]), level=.7)
hit = TL["BOARDT"] + 1.3                                        # the tenth circle closes (film.js drawRentCircles)
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
