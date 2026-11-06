"""Mix: narration + score + sound effects (ElevenLabs, placed at the picture's cue events) + ambience → out/mix.wav
  .venv/bin/python tools/mix.py
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, fade, load, lowpass, highpass, bandpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
EV = json.load(open(os.path.join(HERE, "out", "events.json")))["EV"]
DUR = TL["DUR"]
FX = os.path.join(HERE, "sfx", "out")
db = lambda d: 10 ** (d / 20)


def active(x, floor=.08):
    """the part of a sound above floor × peak (for level matching and onset)"""
    m = np.abs(x).max(1) if x.ndim == 2 else np.abs(x)
    idx = np.nonzero(m > floor * m.max())[0]
    return (idx[0], idx[-1]) if len(idx) else (0, len(x))


_cache = {}


def fx(name):
    """an effect, levelled to −20 dBFS RMS over its active part"""
    if name not in _cache:
        x = load(os.path.join(FX, name + ".wav"))
        a, b = active(x, .05)
        x = x * (db(-20) / max(rms(x[a:b + 1]), 1e-6))
        _cache[name] = x.astype(np.float32)
    return _cache[name]


def onset(x):
    return active(x, .2)[0] / SR


def place(b, name, t, gain_db, pan=0.0, dur=None, align=False, fin=.01, fout=.12):
    x = fx(name)
    if dur is not None:
        x = fade(x[:int((dur + fout) * SR)], fin, fout)
    if pan:
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        x = x * np.array([l, r], np.float32)
    add(b, x, t - (onset(x) if align else 0), db(gain_db))


def bed(b, name, t0, t1, gain_db, fin=1.0, fout=1.5, xf=.6):
    """tile an ambience across [t0, t1] with crossfades and gentle fades"""
    x = fx(name)
    a, z = active(x, .05)
    x = x[a:z]
    n, out = int((t1 - t0) * SR), np.zeros((int((t1 - t0) * SR), 2), np.float32)
    k, pos, X = int(xf * SR), 0, len(x)
    while pos < n:
        seg = x.copy()
        seg[:k] *= np.linspace(0, 1, k)[:, None]
        seg[-k:] *= np.linspace(1, 0, k)[:, None]
        m = min(len(seg), n - pos)
        out[pos:pos + m] += seg[:m]
        pos += X - k
    out = fade(out, fin, fout)
    add(b, out, t0, db(gain_db))


# ---------------------------------------------------------------- ambience
amb = buf(DUR + 2)
rng = np.random.default_rng(5)
pink = np.cumsum(rng.standard_normal((len(amb), 2)), 0).astype(np.float32)
pink = highpass(pink, 40)
pink = lowpass(pink, 900)
pink *= db(-56) / rms(pink)
amb += pink                                                         # room tone, everywhere
bed(amb, "wind", 0.0, 6.6, -24, .8, 1.2)
bed(amb, "wind", 6.7, 13.8, -19, 1.0, 1.6)
bed(amb, "birds", 13.9, 30.5, -21, 1.6, 2.4)
bed(amb, "rain", TL["RAIN"][0] - .3, TL["RAIN"][1] + 1.6, -12, .9, 2.0)       # runs past July into August (L-cut)
bed(amb, "cicadas", 55.4, 60.4, -27, 1.4, 1.6)
bed(amb, "crickets", 61.0, 72.8, -25, 2.0, 1.2)
bed(amb, "wind", 70.0, 73.4, -23, 1.0, 1.0)
bed(amb, "crickets", 74.4, TL["PAGE"] + .6, -31, 1.6, 1.0)

# ---------------------------------------------------------------- foley from the picture's events
fol = buf(DUR + 2)
bk = 0
for e in EV:
    t, ty, pan = e["t"], e["type"], e.get("pan", 0) * .7
    if ty == "bloom":
        place(fol, "bloom", t, -10, 0, align=True)
    elif ty == "brushbed":
        place(fol, "brush_long", t, -15 + 20 * np.log10(max(e.get("g", 1), .1)), pan, dur=e["dur"], fin=.15, fout=.5)
    elif ty == "brush":
        place(fol, ["brush1", "brush2", "brush3"][bk % 3], t, -14 + 20 * np.log10(max(e.get("g", 1), .1)), pan, dur=e["dur"] + .2, fin=.03, fout=.25)
        bk += 1
    elif ty == "glaze":
        place(fol, "brush3", t - .05, -12, .25, dur=e["dur"] + .3, fin=.03, fout=.3)
    elif ty == "burst":
        place(fol, "brush3", t - .08, -9, -.1, dur=1.3, fin=.02, fout=.4)
        place(fol, "brush1", t + .1, -13, .3, dur=1.0)
    elif ty == "pen":
        place(fol, "pen", t, -15, -.2, dur=e["dur"] + .2, fin=.02, fout=.15)
    elif ty == "mist":
        place(fol, "mist", t, -14, 0, dur=e["dur"] + .4, fin=.2, fout=.5)
    elif ty == "petals":
        place(fol, "petals", t, -17, .2, dur=e["dur"], fin=.2, fout=.6)
    elif ty == "drop":
        name = "drop_soil" if e.get("soil") else ("drop_wood1" if int(t * 10) % 2 else "drop_wood2")
        g = -6 if e.get("soil") else (-9 if t < TL["DROPS"][0] + .1 else -12)      # the first one, after the silence, a little forward
        place(fol, name, t, g, pan, dur=.9, align=True, fin=.002, fout=.2)
    elif ty == "kettle":
        place(fol, "kettle", t, -13, -.35, dur=e["dur"] + .4, fin=.4, fout=.6)
    elif ty == "pour":
        place(fol, "pour", t, -11, -.35, dur=e["dur"] + .2, fin=.05, fout=.3)
    elif ty == "clink":
        place(fol, "clink", t, -9, -.35, dur=.9, align=True, fin=.002, fout=.2)
    elif ty == "page":
        place(fol, "page", t, -8, 0, dur=1.5, fin=.01, fout=.3)

fol = room(fol, size=.25, mix=.14, damp=.6, seed=7)
amb = room(amb, size=.3, mix=.1, damp=.7, seed=8)

# ---------------------------------------------------------------- narration
vox = buf(DUR + 2)
speech = np.zeros(len(vox), np.float32)
for v in TL["VO"]:
    x = load(os.path.join(HERE, "voice", "out", v["id"] + ".mp3"))[:, 0]
    x = highpass(x, 90)
    # gentle RMS compressor (−24 dB, 3:1), then a look-ahead peak limiter at RMS + 11 dB
    w = int(.02 * SR)
    env = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same") + 1e-9)
    lvl = 20 * np.log10(env)
    gr = np.where(lvl > -24, (lvl + 24) * (1 - 1 / 3), 0)
    gr = np.convolve(gr, np.ones(w) / w, "same")
    x = x * db(-gr)
    a, b = active(x[:, None].repeat(2, 1), .05)
    x *= db(-20) / rms(x[a:b])
    ceil = db(-20 + 11)
    look = int(.005 * SR)
    ab = np.abs(x)
    peak = np.array([ab[max(0, i - look):i + look].max() for i in range(0, len(x), look)])
    g = np.minimum(1, ceil / np.maximum(peak, 1e-9))
    g = np.repeat(g, look)[:len(x)]
    g = np.convolve(g, np.ones(look * 2) / (look * 2), "same")
    x = (x * np.minimum(g, 1)).astype(np.float32)
    add(vox, x, v["t"], 1.0, 0)
    i0, i1 = int(v["t"] * SR), int((v["t"] + v["dur"]) * SR)
    speech[i0:i1] = 1
vox = room(vox, size=.18, mix=.07, damp=.6, seed=9)

# ---------------------------------------------------------------- music, ducked under the voice
mus = load(os.path.join(HERE, "out", "music.wav"))
mus = np.concatenate([mus, np.zeros((len(vox) - len(mus), 2), np.float32)]) if len(mus) < len(vox) else mus[:len(vox)]
k = int(.3 * SR)
duck = np.convolve(speech, np.ones(k) / k, "same")
mus = mus * (1 - (1 - db(-4)) * duck)[:, None]

# levels: voice ≈ music + 8 dB during speech
sp = speech > .5
vr, mr = rms(vox[sp]), rms(mus[sp]) if rms(mus[sp]) > 1e-5 else rms(mus)
mus *= (vr / db(8)) / max(mr, 1e-6) if mr > 1e-5 else 1
mix = vox + mus + fol + amb
mix = mix[:int(DUR * SR)]
mix *= .89 / np.abs(mix).max()
sf.write(os.path.join(HERE, "out", "mix.wav"), mix, SR, subtype="PCM_24")
for name, x in [("voice", vox), ("music", mus), ("foley", fol), ("ambience", amb)]:
    print(f"{name:9s} rms {20 * np.log10(rms(x) + 1e-9):6.1f} dB (pre-normalise)")
print("mix.wav", round(len(mix) / SR, 2), "s")
