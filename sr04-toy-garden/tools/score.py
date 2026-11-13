"""Tape 4 "Toy Garden" (owner 11/13: natural sound only). Two things, both in the scene:
1. The music box inside the tin robot: a little minor tune that plays only while it walks, stops dead when it stops, slows and
   sags in pitch as its spring runs down, is gone when the key stops, and comes back too fast and too high after the key has
   wound itself. Played through a tiny tin box (narrow band, a little rattle). CC0 glockenspiel samples (VSCO 2 CE).
2. A low drone grown from the store's own hum (an octave down, two copies a little detuned so they beat), rising from the
   second walk to the power failing, cut dead with everything else.
No score, no clusters, no hits.
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
from fractions import Fraction
import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, note, m, load, lowpass, highpass, bandpass, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
DUR = TL["DUR"]
N = int((DUR + 1) * SR)
FPS = 6
cq = lambda x: np.ceil(x * FPS - 1e-6) / FPS                                  # CAM 10 shows a change on its next frame
OUT = cq(TL["QUIET"])                                                         # the power dies: everything stops

# 1. the music box in the robot
box = buf(DUR + 4)
MB = ["E5", "G5", "B5", "A5", "G5", "E5", "F#5", "D#5", "E5", "B4", "E5", "G5", "F#5", "E5", "D#5", "E5"]
W1, W2, W3, KS = TL["WALK1"], TL["WALK2"], TL["WALK3"], TL["KEYSTOP"]
i = 0
for a, b, gap0, grow, sag0, sag1, vel, oct_ in [(W1[0] + .05, W1[1], .3, 1.0, 0, -.15, .3, 0), (W2[0] + .05, KS, .3, 1.07, -.15, -.9, .3, 0),
                                                (cq(W3[0]) + .05, W3[1], .13, 1.0, .35, .6, .26, 12)]:
    t, gap = a, gap0
    while t < b - .05:
        k = (t - a) / (b - a)
        rel = min(.8, b - t - .02)                                                   # it stops dead with the robot
        add(box, note("glockenspiel", m(MB[i % len(MB)]) + oct_ + sag0 + (sag1 - sag0) * k * k, min(.5, b - t), vel, release=max(.04, rel)), t, .9, 0)
        t += gap; gap *= grow; i += 1
mono = box.mean(1)
pk = np.abs(mono).max() + 1e-9
mono = bandpass(np.tanh(bandpass(mono, 900, 6500, 2) * 1.6 / pk) / 1.6 * pk, 800, 7000, 2)      # a tin box: thin, a little rattle
mono = mono[:N] if len(mono) >= N else np.concatenate([mono, np.zeros(N - len(mono), np.float32)])

# 2. the drone from the store's hum
x = load(os.path.join(HERE, "sfx", "out", "store_hum.wav")).mean(1)[int(1.2 * SR):]        # (without the clunk at its head)
x = lowpass(highpass(x, 60), 500, 4)


def slow(x, ratio):
    fr = Fraction(1 / ratio).limit_denominator(1000)
    y = signal.resample_poly(x, fr.numerator, fr.denominator).astype(np.float32)
    k = int(.5 * SR); out = np.zeros(N, np.float32); pos = 0
    while pos < N:
        s = y.copy(); s[:k] *= np.linspace(0, 1, k); s[-k:] *= np.linspace(1, 0, k)
        mm = min(len(s), N - pos); out[pos:pos + mm] += s[:mm]; pos += len(y) - k
    return out


d = lowpass(slow(x, .5) + .8 * slow(x, .5 * 1.009), 260, 4)
t = np.arange(N) / SR
env = np.clip((t - W2[0]) / (OUT - W2[0]), 0, 1) ** 1.6 * (1 + .25 * np.sin(2 * np.pi * .13 * t))
env[t >= OUT] = 0
k = int(.01 * SR); j = int(OUT * SR); env[j - k:j] *= np.linspace(1, 0, k)
d = d * env
d *= rms(mono[mono != 0]) * 10 ** (-6 / 20) / (rms(d[d != 0]) + 1e-9)        # the drone sits ~6 dB under the box
mus = mono + d
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), np.stack([mus, mus], 1)[:int(DUR * SR)], SR, subtype="FLOAT")
print("music box + drone rms per 4 s:", " ".join(f"{b * 4}:{20 * np.log10(rms(mus[b * 4 * SR:(b + 1) * 4 * SR]) + 1e-9):.0f}" for b in range(int(DUR / 4) + 1)))
