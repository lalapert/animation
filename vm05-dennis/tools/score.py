"""Score for Void Mart 5 "Dennis" (natural-sound pass, 11/13): the house trio (tools/band.py) playing the scene, F major.
  - the usual (0-4 s): a walking bass, brushes and vibes for the regular sliding in; the band stops dead on "We're out."
  - silence for "...Out?", the stalks drooping and Pip's milk parade (the foley carries it)
  - "Nine years.": a mock-sentimental ballad (vibes with the motor on, a two-feel bass); out before "Eleven."
  - MAGS: his glockenspiel jingle just before he speaks, then a bright little sales vamp under the pitch; out at the price
  - hit 1, the melt: bass and vibes fall chromatically with him
  - silence for "Relax. I hid one."; then the usual comes back, warmer, for the spring and the happy tears; out before
    "You leave a trail when you cry."
  - hit 2, the button: the xylophone on the incident counter, one warm chord, a short answer from the vibes under the mop
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
b = Band(DUR, seed=5, bpm=120)

# 1. the usual: Dennis slides in, "Evening, Rae! The usual!"; stops dead into "We're out."
t0, stop1 = .05, V["L2"]["t"] - .07
b.chord_hit(t0, "F6", 1.6, .3, roll=.02)
b.fill(.62, 1.32, "F6", vel=.34, direction=1)
b.walk(t0, stop1, ["F6", "D7"], vel=.5, last="Gm7")
b.brushes(t0, stop1, vel=.42, fade_in=.25, fade_out=.06)
b.comp(2.05, stop1, ["D7"], vel=.32, density=.7)

# 2. "Nine years. Same milk. Every night.": the ballad, out before "Eleven."
s2, e2 = V["L5"]["t"] - .25, V["L6"]["t"] - .3
b.last_voicing = None
b.pad(s2, e2, ["Dm7", "Bbmaj7", "Gm7 C7sus"], vel=.3, motor=.24)
b.prev_bass = 38
b.two(s2, e2, ["Dm7", "Bbmaj7", "Gm7 C7sus"], vel=.4, skip=.2)

# 3. MAGS: the jingle right before him, then the sales vamp under the pitch
mg = V["L7"]["t"]
b.jingle(mg - .5)
s3, e3 = mg + .05, end("L7") + .02
b.last_voicing = None
b.two(s3, e3, ["Fmaj7", "Gm7 C7", "Fmaj7", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(s3, e3, vel=.32, fade_in=.4, fade_out=.06)
b.comp(s3, e3, ["Fmaj7", "Gm7 C7", "Fmaj7", "Gm7 C7"], vel=.3, density=.8)

# 4. hit 1, the melt: everything falls with him (bass and vibes, chromatic, parallel)
mt = TL["MELT"]
for i, (bn, top) in enumerate(zip([41, 40, 39, 38, 37], [[69, 72, 77], [68, 71, 76], [67, 70, 75], [66, 69, 74], [65, 68, 73]])):
    tt, last = mt + i * .3, i == 4
    b.bass_note(tt, bn, 3 if last else .55, .5 if not last else .55, release=1.2 if last else .12)
    for j, p in enumerate(top):
        b.n("vibes", "vibraphone", p, tt + j * .012, (3 if last else .5) * b.B, .3 if not last else .33, .2 + .05 * j, release=1.0 if last else .15)
b.set_motor(mt + 1.2, mt + 2.6, .3)

# 5. the usual again, warmer: the spring, "Rae... you DO care!"; out before the punchline
s5, e5 = end("L9") + .05, V["L11"]["t"] - .15
b.last_voicing = None
b.prev_bass = 41
b.walk(s5, e5, ["F6", "D7", "Gm7 C7", "F6"], vel=.5, last="F6")
b.brushes(s5, e5, vel=.4, fade_in=.3, fade_out=.06)
b.comp(s5, e5, ["F6", "D7", "Gm7 C7", "F6"], vel=.32, density=.7)

# 6. hit 2, the button on the incident counter; a short answer from the vibes under the mop
en = TL["FLIP"] + .15
b.button(en)
b.fill(en + 1.9, en + 3.0, "F6", vel=.3, direction=-1)

# punchlines and the room after them: nothing from the band
TACET = [[stop1, s2], [e2, mg - .55], [e3, mt - .06], [mt + 2.6, s5], [e5, en - .02]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))     # the band's balance
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
music *= 10 ** (-24 / 20) / np.sqrt(np.mean(music[act] ** 2))           # active level -24 dBFS; mix.py sets it against the voices
sf.write(os.path.join(HERE, "out", "music.wav"), music.astype(np.float32), SR, subtype="FLOAT")
json.dump({"tacet": TACET, "hits": [["melt", mt], ["button", en]], "instruments": sorted(b.used), "fills": b.log},
          open(os.path.join(HERE, "out", "score.json"), "w"), indent=1)
json.dump(sorted(b.used), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("instruments:", ", ".join(sorted(b.used)))
print("tacet:", ", ".join(f"{a:.2f}-{z:.2f}" for a, z in TACET))
print("per 1 s dB:", " ".join(f"{i}:{20 * np.log10(np.sqrt(np.mean(music[i * SR:(i + 1) * SR] ** 2)) + 1e-12):.0f}" for i in range(int(DUR) + 1)))
for k, x in stems.items():
    a = np.abs(x).max(1) > 1e-5
    if a.any(): print(f"  stem {k:6s} active rms {20 * np.log10(np.sqrt(np.mean(x[a] ** 2))):6.1f} dB, peak {20 * np.log10(np.abs(x).max()):6.1f} dB")
