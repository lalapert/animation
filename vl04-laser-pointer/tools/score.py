"""Score for Volt Labs 4 "Laser Pointer": the Volt Labs band (tools/band.py), cued to the scene (owner 11/13: music that fits and
serves the scene, stops for punchlines, at most two or three hits). 11/7 version (harp, organ, timpani, glockenspiel, horn stabs,
tremolo strings on every action) replaced.

Cue sheet (music under setups, silence under punchlines; the room tone and foley carry the silences):
  M1  0.00 -> HUD end   the theme from frame 1 (the unveiling, "Behold"), then light staccato arpeggios under the spec scan,
                        a cadence on D before "That was the rent money." (silence for the line)
  M2  L3 -> PEW         "Earth... KNEEL!": a pizzicato pedal that grows through the charge and stops dead on the pew
                        (the dot, "Wow.", "It's... warming up." and the knock all land in silence)
  M3  after the knock   the landlord's grumpy stomp under "Rent! Today!", cut on the dot on his chest
  hit LOOK              uh-oh (a low unison semitone fall) on the dot: the biggest visual gag. Then the gulp in silence
  M4  RUN               a pizzicato run downward as he flees past the window (panned with him), fading under "It works!"
  M5  BOARD             the theme's first bar as the fifth circle goes on the board, then
  hit circle closed     the button (dun-DUN). The end card plays over its ring and the room tone.
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
b = Band(DUR, bpm=TL["BPM"], seed=4)
B = b.B

b.cue(0.0, TL["HUD1"] - .1, "theme", end="cadence", bars=["A1", "A2", "scan", "scanend"], until=V["L2"]["t"] - .15)
b.cue(V["L3"]["t"] - .06, TL["PEW"], "build", end="cut", rise=(TL["CHARGE"], TL["PEW"]))
b.cue(TL["KNOCK"] + .62, TL["LOOK"], "grump", end="cut", level=.85)
b.hit(TL["LOOK"], "uhoh", level=.9)
b.cue(TL["RUN"] + .22, V["L8"]["t"] + .45, "scurry", end="fade", fade=.4, pan=(.45, -.6), level=.85)
hit = TL["BOARDT"] + 1.3                                       # the fifth circle closes (film.js drawRentCircles)
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
