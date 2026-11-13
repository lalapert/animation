"""Score for Void Mart 7 "Tip Jar" (natural-sound pass, 11/13): the house trio (tools/band.py), F major.
  - the comet lands in the jar (its own sounds, dry); then a short happy walk under "Our first tip!"; out before
    "It's a comet."
  - the trucker glides in: a laid-back two-feel with brushes, his swagger; it stops dead on the tooth (the pop lands dry);
    "Keep the change." and "That's his tooth." dry
  - "It's still warm!": a soft vibes chord with the motor on (aww); MAGS's glockenspiel jingle right before him
  - "Tip policy update!": a smooth corporate vamp under the policy; out before "You don't even have hands!"
  - the claw: no music, only the machine; "I have a claw." dry
  - "would YOU like to leave a tip?": a sweet lounge vamp as MAGS comes down; then the tip screen: the bass alone on a
    soft pedal note, a vibes chord pulsing with the motor, getting closer... and everything stops dead on the press
  - "Pip." and "It was looking at me." dry
  - Rae walks over, the coin: the usual walk comes back softly; out when the claw comes down again; "No." dry
  - the button (the only hit): the xylophone as the claw goes back up, limp
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
b = Band(DUR, seed=7, bpm=120)

# 1. "Our first tip!": a short happy walk after the comet lands; out before "It's a comet."
s1, e1 = TL["LAND"] + .2, V["L2"]["t"] - .12
b.chord_hit(s1, "F6", 1.2, .3, roll=.02)
b.walk(s1, e1, ["F6", "D7"], vel=.5, last="Gm7")
b.brushes(s1, e1, vel=.4, fade_in=.2, fade_out=.06)
b.comp(s1 + 2.0, e1, ["D7"], vel=.3, density=.6)

# 2. the trucker glides in: his swagger, stopped dead by the tooth
s2, e2 = TL["POD0"] + .15, TL["YANK"] - .04
b.last_voicing = None; b.prev_bass = 36
b.two(s2, e2, ["Bb7", "F6"], vel=.48, skip=.4)
b.brushes(s2, e2, vel=.38, fade_in=.4, fade_out=.04)
b.comp(s2 + .5, e2, ["Bb7", "F6"], vel=.28, density=.6)

# 3. "It's still warm!": aww; then MAGS's jingle right before him
s3 = V["L5"]["t"] - .2
b.last_voicing = None
b.chord_hit(s3, "Bbmaj7", 2.4, .3, roll=.035, release=.5)
b.set_motor(s3, s3 + 1.6, .24)
mg = V["L6"]["t"]
b.jingle(mg - .45)

# 4. "Tip policy update! Management keeps sixty percent.": the corporate vamp
s4, e4 = mg + .05, end("L6") + .05
b.last_voicing = None; b.prev_bass = 41
b.two(s4, e4, ["Fmaj7", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(s4, e4, vel=.32, fade_in=.4, fade_out=.06)
b.comp(s4, e4, ["Fmaj7", "Gm7 C7"], vel=.28, density=.8)

# 5. "would YOU like to leave a tip?": the sweet vamp as MAGS comes down; then the screen, closer and closer; dead on the press
s5, e5 = V["L9"]["t"] - .1, TL["SCREEN"]
b.last_voicing = None; b.prev_bass = 41
b.pad(s5, e5, ["Fmaj7", "Ebmaj7", "Fmaj7"], vel=.28, motor=.2)
b.two(s5, e5, ["Fmaj7", "Ebmaj7", "Fmaj7"], vel=.38, skip=.15, stop=False)
b.brushes(s5, e5, vel=.26, slap=False, fade_in=.5, fade_out=.1)
s6, e6 = TL["SCREEN"], TL["PRESS"] - .02
k = 0
while s6 + k * b.B < e6 - .05:
    b.bass_note(s6 + k * b.B, "C2", .7, .34 + .02 * k, release=.08); k += 1
b.last_voicing = None
b.chord_hit(s6 + .02, "C7sus", (e6 - s6) / b.B, .26, roll=.04, release=.06)
b.set_motor(s6, e6, .35)

# 6. Rae walks over, the coin: the usual, softly; out when the claw comes down again
s7, e7 = TL["END0"] + .1, TL["CLAW2"] - .05
b.last_voicing = None; b.prev_bass = 41
b.walk(s7, e7, ["F6", "D7"], vel=.44, last="Gm7")
b.brushes(s7, e7, vel=.32, fade_in=.3, fade_out=.06)
b.comp(s7, e7, ["F6", "D7"], vel=.26, density=.6)

# 7. the button as the claw goes back up, limp (the only hit)
en = TL["CLAWBACK"] + .12
b.button(en)

TACET = [[e1, TL["POD0"]], [e2, s3 - .02], [e4, s5 - .02], [e6, s7 - .02], [e7, en - .02]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    kk = int(.09 * SR) if (a, z) != (e6, s7 - .02) else int(.02 * SR)        # the press: everything stops at once
    env[i:j] = 0
    env[max(0, i - kk):i] = np.minimum(env[max(0, i - kk):i], np.linspace(1, 0, i - max(0, i - kk)))
    env[j:j + int(.03 * SR)] = np.minimum(env[j:j + int(.03 * SR)], np.linspace(0, 1, len(env[j:j + int(.03 * SR)])))
music *= env[:, None]
music[int((DUR - .05) * SR):] = 0
music = music[:int(DUR * SR)]
act = np.abs(music).max(1) > 1e-4
music *= 10 ** (-24 / 20) / np.sqrt(np.mean(music[act] ** 2))
sf.write(os.path.join(HERE, "out", "music.wav"), music.astype(np.float32), SR, subtype="FLOAT")
json.dump({"tacet": TACET, "hits": [["button", en]], "instruments": sorted(b.used), "fills": b.log},
          open(os.path.join(HERE, "out", "score.json"), "w"), indent=1)
json.dump(sorted(b.used), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("instruments:", ", ".join(sorted(b.used)))
print("tacet:", ", ".join(f"{a:.2f}-{z:.2f}" for a, z in TACET))
print("per 1 s dB:", " ".join(f"{i}:{20 * np.log10(np.sqrt(np.mean(music[i * SR:(i + 1) * SR] ** 2)) + 1e-12):.0f}" for i in range(int(DUR) + 1)))
