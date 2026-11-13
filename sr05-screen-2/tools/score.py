"""Tape 5 "Screen 2" (owner 11/13: music, if any, is a low drone grown out of the room tone): the projector's own hum, an
octave down, two copies a little detuned so they beat. It lives in Screen 2 only (it drops out on every cut to the lobby,
which stays near silent), a little stronger at each return, and is cut dead at the black frames before the real row G.
No score, no clusters, no chime.
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
from fractions import Fraction
import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, load, lowpass, highpass, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
DUR = TL["DUR"]
N = int((DUR + 1) * SR)
x = load(os.path.join(HERE, "sfx", "out", "projector.wav")).mean(1)
x = lowpass(highpass(x, 60), 500, 4)


def slow(x, ratio):
    fr = Fraction(1 / ratio).limit_denominator(1000)
    y = signal.resample_poly(x, fr.numerator, fr.denominator).astype(np.float32)
    k = int(.5 * SR); out = np.zeros(N, np.float32); pos = 0
    while pos < N:
        s = y.copy(); s[:k] *= np.linspace(0, 1, k); s[-k:] *= np.linspace(1, 0, k)
        m = min(len(s), N - pos); out[pos:pos + m] += s[:m]; pos += len(y) - k
    return out


d = lowpass(slow(x, .5) + .8 * slow(x, .5 * 1.009), 260, 4)
t = np.arange(N) / SR
quiet = TL["QUIET"]
env = np.zeros(N, np.float32)
for kind, a, b, n in TL["SEGS"]:
    if kind != "A" or a >= quiet: continue
    i0, i1 = int(a * SR), int(min(b, quiet) * SR)
    env[i0:i1] = .35 + .65 * (n - 1) / 3                                       # stronger at each return to Screen 2
env *= np.clip(t / quiet, 0, 1) ** .8 * (1 + .2 * np.sin(2 * np.pi * .13 * t))
k = int(.01 * SR)
env = np.convolve(env, np.ones(k) / k, "same")                                # 10 ms edges at the cuts
d = d * env
d *= .5 / (np.abs(d).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), np.stack([d, d], 1)[:int(DUR * SR)], SR, subtype="FLOAT")
print("drone rms per 4 s:", " ".join(f"{b * 4}:{20 * np.log10(rms(d[b * 4 * SR:(b + 1) * 4 * SR]) + 1e-9):.0f}" for b in range(int(DUR / 4) + 1)))
