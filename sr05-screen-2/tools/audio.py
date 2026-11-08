"""Shared audio helpers for score.py and mix.py (48 kHz float32 stereo)."""
import functools, json, os
from fractions import Fraction
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIBROOT = os.environ.get("LEMO_INSTRUMENTS", os.path.expanduser("~/lemo-assets/x/core/audio/instruments"))


def buf(dur):
    return np.zeros((int(dur * SR) + 1, 2), np.float32)


def panlaw(pan):
    a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def add(b, x, t, gain=1.0, pan=0.0):
    """add mono or stereo x into stereo buffer b at time t"""
    i = int(round(t * SR))
    if i >= len(b):
        return
    if x.ndim == 1:
        l, r = panlaw(pan)
        x = np.stack([x * l, x * r], 1)
    if i < 0:
        x, i = x[-i:], 0
    n = min(len(x), len(b) - i)
    b[i:i + n] += x[:n] * gain


def fade(x, fin=0.01, fout=0.05):
    x = x.copy()
    a, z = int(fin * SR), int(fout * SR)
    if a: x[:a] *= np.linspace(0, 1, a)[:, None] if x.ndim == 2 else np.linspace(0, 1, a)
    if z: x[-z:] *= np.linspace(1, 0, z)[:, None] if x.ndim == 2 else np.linspace(1, 0, z)
    return x


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def lowpass(x, f, order=2):
    sos = signal.butter(order, f, "lowpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def highpass(x, f, order=2):
    sos = signal.butter(order, f, "highpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def room(x, size=.5, mix=.2, predelay=.018, damp=.5, seed=3):
    """convolution reverb from decorrelated, exponentially decaying filtered noise"""
    rt = .4 + 3.0 * size
    n = int(rt * SR)
    rng = np.random.default_rng(seed)
    env = np.exp(-6.9 * np.arange(n) / n)
    ir = np.stack([rng.standard_normal(n) * env, rng.standard_normal(n) * env], 1).astype(np.float32)
    ir = lowpass(ir, 9000 * (1 - damp) + 1500)
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True)) + 1e-9
    pd = int(predelay * SR)
    wet = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    wet = np.concatenate([np.zeros((pd, 2), np.float32), wet[:len(x) - pd]])
    return (x * (1 - mix) + wet * mix * 1.4).astype(np.float32)


def load(path, sr=SR):
    x, s = sf.read(path, dtype="float32", always_2d=True)
    if s != sr:
        fr = Fraction(sr, s).limit_denominator(1000)
        x = signal.resample_poly(x, fr.numerator, fr.denominator, axis=0).astype(np.float32)
    return x


def rms(x):
    return float(np.sqrt(np.mean(x.astype(np.float64) ** 2) + 1e-12))


# ------------------------------------------------------------------ sampler (CC0 sample packs)
@functools.lru_cache(None)
def index():
    return json.load(open(os.path.join(LIBROOT, "index.json")))


@functools.lru_cache(None)
def _sample(f):
    x, s = sf.read(os.path.join(LIBROOT, f), dtype="float32", always_2d=True)
    return x.mean(1), s


_rng = np.random.default_rng(11)


def note(inst, midi, dur, vel=.7, release=None, attack=0.0, rr=None):
    """one note, mono float32 at SR. midi may be fractional. Natural decay; damped after dur over `release`."""
    Z = index()[inst]["zones"]
    vels = sorted({z["vel"] for z in Z if z["vel"] is not None})
    vmax = max(vels) if vels else 1

    def pitch(z):
        return z["det"] if z.get("conf", 0) > .5 and abs(z["det"] - z["root"]) < .5 else z["root"]

    def cost(z):
        d = midi - pitch(z)
        vn = (z["vel"] / vmax) if z["vel"] is not None and len(vels) > 1 else vel
        return abs(d) + .3 * max(0, d) + 4 * abs(vn - vel)      # transposing up costs a little more
    best = min(cost(z) for z in Z)
    cands = [z for z in Z if cost(z) <= best + .25]
    z = cands[int(_rng.integers(len(cands)))] if rr is None else cands[rr % len(cands)]
    x, s = _sample(z["f"])
    x = x[z.get("on", 0):]
    ratio = 2 ** ((midi - pitch(z)) / 12)
    fr = Fraction(SR, s).limit_denominator(2000) / Fraction(ratio).limit_denominator(2000)
    fr = Fraction(fr).limit_denominator(1200)
    total = dur + (release if release is not None else .6) + .05
    need = int(total * s * ratio) + 64
    x = x[:need]
    y = signal.resample_poly(x, fr.numerator, fr.denominator).astype(np.float32)
    # level: normalise each instrument by its median zone RMS, then follow velocity
    med = float(np.median([q["rms"] for q in Z]))
    single = len(vels) <= 1
    y *= (.12 / max(med, 1e-4)) * (vel ** 1.6 if single else (.55 + .45 * vel))
    if single and vel < .7:
        y = lowpass(y, 2500 + 9000 * vel)
    rel = release if release is not None else .6
    n_on, n_rel = int(dur * SR), int(rel * SR)
    env = np.ones(len(y), np.float32)
    if n_on < len(y):
        k = min(n_rel, len(y) - n_on)
        env[n_on:n_on + k] = np.exp(-6.9 * np.arange(k) / max(k, 1))
        env[n_on + k:] = 0
    if attack > 0:
        a = min(len(y), int(attack * SR))
        env[:a] *= np.linspace(0, 1, a) ** 1.5
    y = y * env
    end = min(len(y), n_on + n_rel + 10)
    return y[:end]


NOTE_NAMES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def m(name):
    """'F#4' → 66"""
    n = NOTE_NAMES[name[0]]
    i = 1
    while i < len(name) and name[i] in "#b":
        n += 1 if name[i] == "#" else -1
        i += 1
    return n + 12 * (int(name[i:]) + 1)
