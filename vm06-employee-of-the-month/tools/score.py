"""Score for Void Mart 6 "Employee of the Month" (natural-sound pass, 11/13): the house trio (tools/band.py), F major.
  - the wall of the camera's photos and Pip fired up: a bright walk with a vibes pickup over the reveal; out before
    "It's always MAGS."
  - MAGS's glockenspiel jingle right before his first line; the exchange itself plays dry
  - the restock run: the band's moment (walking bass, brushes and a soft ride, a vibes line); MAGS cuts it off with his
    announcement
  - "The votes are in!": a brush roll that stops dead on the count; "Who voted?!", "Me." dry
  - Rae walks back to the ballot box: the bass alone, one note a step
  - "A tie! Photo finish!": a brush roll into the flash
  - hit 1, the photo: one warm chord and a soft vibes answer under the frame landing
  - "I'm in it!": the happy walk under the joy hops; hit 2, the xylophone button
Every punchline sits in a TACET window (the band damped, room tone only). CC0 samples (VSCO 2 CE, VCSL, FreePats).
  .venv/bin/python tools/score.py            -> out/music.wav, out/score.json
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE
from band import Band

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
DUR = TL["DUR"]
V = {v["id"]: v for v in TL["VO"]}
end = lambda k: V[k]["t"] + V[k]["dur"]
b = Band(DUR, seed=6, bpm=120)

# 1. the wall and Pip fired up; out before "It's always MAGS."
t0, e1 = .05, V["L2"]["t"] - .12
b.chord_hit(t0, "F6", 1.4, .3, roll=.02)
b.fill(.45, 1.4, "F6", vel=.34, direction=1)
b.walk(t0, e1, ["F6", "Bb7", "F6"], vel=.5, last="Gm7")
b.brushes(t0, e1, vel=.42, fade_in=.25, fade_out=.06)
b.comp(2.05, e1, ["Bb7", "F6"], vel=.32, density=.7)

# 2. MAGS's jingle right before his first line
b.jingle(V["L4"]["t"] - .42)

# 3. the restock run: the band's moment; MAGS cuts it off
s3, e3 = end("L4") + .07, V["L5"]["t"] - .06
b.last_voicing = None; b.prev_bass = 41
b.walk(s3, e3, ["F6", "D7", "Gm7 C7", "F6"], vel=.55, last="Gm7")
b.brushes(s3, e3, vel=.46, ride=True, fade_in=.15, fade_out=.05)
b.comp(s3, s3 + 2.0, ["F6"], vel=.3, density=.5)
b.fill(s3 + 1.0, s3 + 2.3, "D7", vel=.38, direction=1)
b.fill(s3 + 2.45, e3 - .1, "C7", vel=.4, direction=-1)

# 4. "The votes are in!": a brush roll that stops dead on the count
b.roll(V["L8"]["t"] + .05, TL["SCORE"] - .02, vel=.5)

# 5. Rae walks back to the box: the bass alone, one note on each step
steps = [TL["RAEB0"] + i / 1.9 for i in range(0, 4)]
for i, (tt, nm) in enumerate(zip(steps, ["F2", "G2", "Ab2", "A2"])):
    b.bass_note(tt, nm, .8, .46 if i else .5, release=.12)
b.bass_note(TL["SLIP"] - .02, "Bb2", .5, .5, release=.12)

# 6. "A tie! Photo finish!": a roll into the flash; hit 1 on the photo
b.roll(V["L12"]["t"] + .1, TL["FLASH"] - .03, vel=.55)
ph = TL["FLASH"] + .12
b.last_voicing = None
b.chord_hit(ph, "F69", 4, .36, roll=.025, release=1.2)
b.bass_note(ph, "F2", 3, .55, release=.9)
b.set_motor(ph, ph + 2.4, .22)
b.fill(TL["DROP"] + .55, V["L13"]["t"] - .15, "F6", vel=.32, direction=1)

# 7. "I'm in it!": the happy walk under the joy hops; hit 2, the button
s7, e7 = V["L13"]["t"] - .05, end("L13") + .45
b.last_voicing = None; b.prev_bass = 41
b.walk(s7, e7, ["F6", "Gm7 C7"], vel=.5, last="F6")
b.brushes(s7, e7, vel=.4, fade_in=.2, fade_out=.06)
b.comp(s7, e7, ["F6", "Gm7 C7"], vel=.3, density=.7)
en = e7 + .05
b.button(en)

TACET = [[e1, V["L4"]["t"] - .47], [e3, V["L8"]["t"]], [TL["SCORE"], TL["RAEB0"] - .05], [TL["SLIP"] + .32, V["L12"]["t"] + .08]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    k = int(.09 * SR)
    env[i:j] = 0
    env[max(0, i - k):i] = np.minimum(env[max(0, i - k):i], np.linspace(1, 0, i - max(0, i - k)))
    env[j:j + int(.03 * SR)] = np.minimum(env[j:j + int(.03 * SR)], np.linspace(0, 1, len(env[j:j + int(.03 * SR)])))
music *= env[:, None]
music[int((DUR - .05) * SR):] = 0
music = music[:int(DUR * SR)]
act = np.abs(music).max(1) > 1e-4
music *= 10 ** (-24 / 20) / np.sqrt(np.mean(music[act] ** 2))
sf.write(os.path.join(HERE, "out", "music.wav"), music.astype(np.float32), SR, subtype="FLOAT")
json.dump({"tacet": TACET, "hits": [["photo", ph], ["button", en]], "instruments": sorted(b.used), "fills": b.log},
          open(os.path.join(HERE, "out", "score.json"), "w"), indent=1)
json.dump(sorted(b.used), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("instruments:", ", ".join(sorted(b.used)))
print("tacet:", ", ".join(f"{a:.2f}-{z:.2f}" for a, z in TACET))
print("per 1 s dB:", " ".join(f"{i}:{20 * np.log10(np.sqrt(np.mean(music[i * SR:(i + 1) * SR] ** 2)) + 1e-12):.0f}" for i in range(int(DUR) + 1)))
