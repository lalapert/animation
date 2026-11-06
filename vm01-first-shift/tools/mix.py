"""Mix: dialogue (per-line gain, light panning by speaker) + score + sound effects at the picture's cue events + ambience beds → out/mix.wav
Data-driven: mix.json maps each event type (from out/events.json) to an effect.
  foley: {type: {"fx": name | [names...], "g": dB, "align": bool, "dur": s, "fin": s, "fout": s}}
  beds:  {type: {"fx": name, "fin": s, "fout": s}}  for events carrying "t1" (end time) and "g" (dB)
Event fields used: t, t1, pan (−1..1), g (dB for beds; linear multiplier for foley), dur.
  .venv/bin/python tools/mix.py
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, fade, load, lowpass, highpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
EV = json.load(open(os.path.join(HERE, "out", "events.json")))["EV"]
CFG = json.load(open(os.path.join(HERE, "mix.json")))
DUR = TL["DUR"]
FX = os.path.join(HERE, "sfx", "out")
db = lambda d: 10 ** (d / 20)


def active(x, floor=.08):
    mm = np.abs(x).max(1) if x.ndim == 2 else np.abs(x)
    idx = np.nonzero(mm > floor * mm.max())[0]
    return (idx[0], idx[-1]) if len(idx) else (0, len(x))


_cache = {}


def fx(name):
    """an effect, levelled to −20 dBFS RMS over its active part"""
    if name not in _cache:
        x = load(os.path.join(FX, name + ".wav"))
        a, b = active(x, .05)
        _cache[name] = (x * (db(-20) / max(rms(x[a:b + 1]), 1e-6))).astype(np.float32)
    return _cache[name]


def place(b, name, t, gain_db, pan=0.0, dur=None, align=False, fin=.01, fout=.12):
    x = fx(name)
    if dur is not None:
        x = fade(x[:int((dur + fout) * SR)], fin, fout)
    if pan:
        x = x * np.array([np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414], np.float32)
    add(b, x, t - (active(x, .2)[0] / SR if align else 0), db(gain_db))


def bed(b, name, t0, t1, gain_db, fin=1.0, fout=1.5, xf=.6):
    x = fx(name)
    a, z = active(x, .05)
    x = x[a:z]
    n = int((t1 - t0) * SR)
    out = np.zeros((n, 2), np.float32)
    k, pos = int(xf * SR), 0
    while pos < n:
        s = x.copy(); s[:k] *= np.linspace(0, 1, k)[:, None]; s[-k:] *= np.linspace(1, 0, k)[:, None]
        mm = min(len(s), n - pos); out[pos:pos + mm] += s[:mm]; pos += len(x) - k
    add(b, fade(out, fin, fout), t0, db(gain_db))


# ---------------------------------------------------------------- ambience and foley
amb, fol = buf(DUR + 2), buf(DUR + 2)
rng = np.random.default_rng(5)
pink = lowpass(highpass(np.cumsum(rng.standard_normal((len(amb), 2)), 0).astype(np.float32), 40), 900)
amb += pink * (db(CFG.get("room_db", -56)) / rms(pink))                       # room tone
k = 0
for e in EV:
    ty = e["type"]
    if ty == "bed" and "t1" in e:                                                  # generic bed: the event names its effect
        bed(amb, e["fx"], e["t"], min(e["t1"], DUR + 1), e.get("g", -24), 1.2, 1.6)
    elif ty in CFG.get("beds", {}) and "t1" in e:
        c = CFG["beds"][ty]
        bed(amb, c["fx"], e["t"], min(e["t1"], DUR + 1), e.get("g", -24), c.get("fin", 1.0), c.get("fout", 1.5))
    elif ty in CFG.get("foley", {}):
        c = CFG["foley"][ty]
        names = c["fx"] if isinstance(c["fx"], list) else [c["fx"]]
        g = c.get("g", -14) + 20 * np.log10(max(e.get("g", 1), .05))
        dur = e.get("dur", c.get("dur"))
        place(fol, names[k % len(names)], e["t"], g, e.get("pan", 0) * .7, dur=(dur + c.get("tail", .2)) if dur else None,
              align=c.get("align", False), fin=c.get("fin", .02), fout=c.get("fout", .2))
        k += 1
fol = room(fol, size=.25, mix=.14, damp=.6, seed=7)
amb = room(amb, size=.3, mix=.1, damp=.7, seed=8)

# ---------------------------------------------------------------- narration (compress, limit, level)
vox = buf(DUR + 2)
speech = np.zeros(len(vox), np.float32)
for v in TL["VO"]:
    x = highpass(load(os.path.join(HERE, "voice", "out", v["id"] + ".mp3"))[:, 0], 90)
    w = int(.02 * SR)
    lvl = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same") + 1e-9))
    gr = np.convolve(np.where(lvl > -24, (lvl + 24) * (1 - 1 / 3), 0), np.ones(w) / w, "same")
    x = x * db(-gr)
    a, b = active(x[:, None].repeat(2, 1), .05)
    x *= db(-20) / rms(x[a:b])
    look, ab = int(.005 * SR), np.abs(x)
    peak = np.array([ab[max(0, i - look):i + look].max() for i in range(0, len(x), look)])
    g = np.convolve(np.repeat(np.minimum(1, db(-9) / np.maximum(peak, 1e-9)), look)[:len(x)], np.ones(look * 2) / (look * 2), "same")
    pan = {"PIP": -.18, "RAE": .18, "MAGS": 0.0}.get(v.get("who"), 0)
    add(vox, (x * np.minimum(g, 1)).astype(np.float32), v["t"], db(v.get("gain_db", 0)), pan)
    speech[int(v["t"] * SR):int((v["t"] + v["dur"]) * SR)] = 1
vox = room(vox, size=.18, mix=.07, damp=.6, seed=9)

# ---------------------------------------------------------------- music, ducked under the voice
mus = load(os.path.join(HERE, "out", "music.wav"))
mus = np.concatenate([mus, np.zeros((len(vox) - len(mus), 2), np.float32)]) if len(mus) < len(vox) else mus[:len(vox)]
kk = int(.3 * SR)
duck = np.convolve(speech, np.ones(kk) / kk, "same")
mus = mus * (1 - (1 - db(-4)) * duck)[:, None]
sp = speech > .5
mr = rms(mus[sp])
if mr > 1e-5:
    mus *= (rms(vox[sp]) / db(CFG.get("voice_over_music_db", 8))) / mr
mix = (vox + mus + fol + amb)[:int(DUR * SR)]
mix *= .89 / np.abs(mix).max()
sf.write(os.path.join(HERE, "out", "mix.wav"), mix, SR, subtype="PCM_24")
for name, x in [("voice", vox), ("music", mus), ("foley", fol), ("ambience", amb)]:
    print(f"{name:9s} rms {20 * np.log10(rms(x) + 1e-9):6.1f} dB (pre-normalise)")
print("mix.wav", round(len(mix) / SR, 2), "s")
