"""The only "music" in tape 7 (owner 11/13: music, if any, is a low drone grown out of the room tone): the photo machine's
own motor hum, an octave down, two copies a little detuned so they beat, rising slowly from the prints of the camera to the
flash charging, and cut dead with everything else before the pop. No score, no hits.
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
x = load(os.path.join(HERE, "sfx", "out", "minilab.wav")).mean(1)
x = lowpass(highpass(x, 60), 500, 4)


def slow(x, ratio):
    """play x at `ratio` of its speed (pitch down), as a loop as long as the tape"""
    fr = Fraction(1 / ratio).limit_denominator(1000)
    y = signal.resample_poly(x, fr.numerator, fr.denominator).astype(np.float32)
    k = int(.5 * SR); out = np.zeros(N, np.float32); pos = 0
    while pos < N:
        s = y.copy(); s[:k] *= np.linspace(0, 1, k); s[-k:] *= np.linspace(1, 0, k)
        m = min(len(s), N - pos); out[pos:pos + m] += s[:m]; pos += len(y) - k
    return out


d = slow(x, .5) + .8 * slow(x, .5 * 1.009)                                    # an octave down, beating ~1 Hz
d = lowpass(d, 260, 4)
t = np.arange(N) / SR
start, quiet = TL["FLIPS"][0] - 1.0, TL["QUIET"]
env = np.clip((t - start) / (quiet - start), 0, 1) ** 1.6                     # grows from the first print to the charge
env *= 1 + .25 * np.sin(2 * np.pi * .13 * t)                                  # breathes slowly
env[t >= quiet] = 0                                                           # dead with everything else
k = int(.01 * SR); i = int(quiet * SR); env[i - k:i] *= np.linspace(1, 0, k)
d = d * env
d *= .5 / (np.abs(d).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), np.stack([d, d], 1)[:int(DUR * SR)], SR, subtype="FLOAT")
print("drone rms per 4 s:", " ".join(f"{b * 4}:{20 * np.log10(rms(d[b * 4 * SR:(b + 1) * 4 * SR]) + 1e-9):.0f}" for b in range(int(DUR / 4) + 1)))
