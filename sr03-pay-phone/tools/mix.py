"""Mix: dialogue (per-line gain, light panning by speaker) + score + sound effects at the picture's cue events + ambience beds → out/mix.wav
Data-driven: mix.json maps each event type (from out/events.json) to an effect.
  foley: {type: {"fx": name | [names...], "g": dB, "align": bool, "dur": s, "fin": s, "fout": s, "bus": "hall" | "phone", "drive": k}}
         bus "hall": the empty tiled corridor (long echo); bus "phone": through a handset earpiece; drive: saturation (a CCTV mic overloading);
         bus "hot": the scare, with the hall echo, driven into a 4x-oversampled soft clipper at the peak ceiling after the limiter
         ("hot_db" in mix.json: how hard), so the one loud moment is dense and as loud as the true-peak ceiling allows
  beds:  {type: {"fx": name, "fin": s, "fout": s}}  for events carrying "t1" (end time) and "g" (dB)
Event fields used: t, t1, pan (−1..1), g (dB for beds; linear multiplier for foley), dur.
  .venv/bin/python tools/mix.py
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, fade, load, lowpass, highpass, bandpass, room, rms

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


def place(b, name, t, gain_db, pan=0.0, dur=None, align=False, fin=.01, fout=.12, drive=0):
    x = fx(name)
    if drive:
        pk = np.abs(x).max() + 1e-9
        x = (np.tanh(x / pk * drive) / np.tanh(drive) * pk).astype(np.float32)
        x *= rms(fx(name)) / rms(x)
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


def lufs(x):
    """integrated loudness (ITU-R BS.1770: K-weighting, 400 ms blocks, absolute and relative gates)"""
    y = signal.lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    y = signal.lfilter([1, -2, 1], [1, -1.99004745483398, 0.99007225036621], y, axis=0)
    n, hop = int(.4 * SR), int(.1 * SR)
    z = np.array([np.mean(y[i:i + n] ** 2, 0).sum() for i in range(0, len(y) - n, hop)])
    L = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[L > -70]
    rel = -0.691 + 10 * np.log10(z.mean() + 1e-12) - 10
    z = z[-0.691 + 10 * np.log10(z + 1e-12) > rel]
    return -0.691 + 10 * np.log10(z.mean() + 1e-12)


def limit(x, ceil, look=.004, release=.06):
    """a look-ahead peak limiter: no sample over `ceil` (linear); short clicks and tape glitches stop driving the normalisation"""
    from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
    a, r = int(look * SR), int(release * SR)
    up = signal.resample_poly(x, 4, 1, axis=0)                                  # true peaks (4x oversampled), as loudnorm measures them
    tp = np.abs(up).max(1)[:len(x) * 4].reshape(-1, 4).max(1) if len(up) >= len(x) * 4 else np.abs(x).max(1)
    env = maximum_filter1d(tp, 2 * a + 1)
    g = np.minimum(1, ceil / np.maximum(env, 1e-9))
    g = uniform_filter1d(minimum_filter1d(g, 2 * a + r), a)
    return (x * np.minimum(g, 1)[:, None]).astype(np.float32)


def pa(x):
    """a ceiling PA speaker: narrow band, a little cone distortion"""
    y = bandpass(x, 320, 3800, 3)
    pk = np.abs(y).max() + 1e-9
    y = np.tanh(y * 1.5 / pk) / 1.5 * pk
    return bandpass(y, 260, 4600, 2).astype(np.float32)


def hall(x):
    """the empty mall: speakers down the concourse answer each other, long tail"""
    y = room(x, size=.9, mix=.32, predelay=.03, damp=.55, seed=21)
    for d, g, f in [(.13, -12, 3000), (.27, -18, 2000)]:
        e = lowpass(np.roll(x, int(d * SR), 0), f); e[:int(d * SR)] = 0
        y += e[:, ::-1] * 10 ** (g / 20)
    return y.astype(np.float32)


# ---------------------------------------------------------------- ambience and foley
amb, fol, pab = buf(DUR + 2), buf(DUR + 2), buf(DUR + 2)
hallb, phoneb, hotb = buf(DUR + 2), buf(DUR + 2), buf(DUR + 2)
BUS = {"hall": hallb, "phone": phoneb, "hot": hotb}
rng = np.random.default_rng(5)
pink = lowpass(highpass(np.cumsum(rng.standard_normal((len(amb), 2)), 0).astype(np.float32), 40), 900)
tone = pink * (db(CFG.get("room_db", -56)) / rms(pink))                       # room tone (it stays through the silence)
k = 0
for e in EV:
    ty = e["type"]
    if ty == "bed" and "t1" in e:                                                  # generic bed: the event names its effect
        bed(amb, e["fx"], e["t"], min(e["t1"], DUR + 1), e.get("g", -24), e.get("fin", 1.2), e.get("fout", 1.6))
    elif ty in CFG.get("beds", {}) and "t1" in e:
        c = CFG["beds"][ty]
        bed(amb, c["fx"], e["t"], min(e["t1"], DUR + 1), e.get("g", -24), c.get("fin", 1.0), c.get("fout", 1.5))
    elif ty in CFG.get("foley", {}):
        c = CFG["foley"][ty]
        names = c["fx"] if isinstance(c["fx"], list) else [c["fx"]]
        g = c.get("g", -14) + 20 * np.log10(max(e.get("g", 1), .05))
        dur = e.get("dur", c.get("dur"))
        place(pab if c.get("pa") else BUS.get(c.get("bus"), fol), names[k % len(names)], e["t"], g, e.get("pan", 0) * .7, dur=(dur + c.get("tail", .2)) if dur else None,
              align=c.get("align", False), fin=c.get("fin", .02), fout=c.get("fout", .2), drive=c.get("drive", 0))
        k += 1
fol = room(fol, size=.25, mix=.14, damp=.6, seed=7)
if np.abs(hallb).max() > 0:                                                   # the tiled corridor: a long, cold echo
    fol += hall(room(hallb, size=.95, mix=.45, predelay=.035, damp=.45, seed=23))
if np.abs(phoneb).max() > 0:                                                  # through the earpiece, across the corridor
    fol += np.stack([pa(bandpass(phoneb.mean(1), 420, 3000, 3))] * 2, 1) * .9
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
    x = (x * np.minimum(g, 1)).astype(np.float32)
    if v.get("fx") == "phone":                                                  # a voice in a handset earpiece, heard from across the corridor
        add(vox, (pa(bandpass(x, 420, 3000, 3)) * .9).astype(np.float32), v["t"], db(v.get("gain_db", 0) - 3), pan)
    elif CFG.get("vo_pa") or v.get("fx") == "pa":
        add(pab, x, v["t"], db(v.get("gain_db", 0)) * 1.4, pan)
    else:
        add(vox, x, v["t"], db(v.get("gain_db", 0)), pan)
    speech[int(v["t"] * SR):int((v["t"] + v["dur"]) * SR)] = 1
vox = room(vox, size=.18, mix=.07, damp=.6, seed=9)
if np.abs(pab).max() > 0:
    vox = vox + hall(pa(pab))

# ---------------------------------------------------------------- music, ducked under the voice
mus = load(os.path.join(HERE, "out", "music.wav"))
mus = np.concatenate([mus, np.zeros((len(vox) - len(mus), 2), np.float32)]) if len(mus) < len(vox) else mus[:len(vox)]
kk = int(.3 * SR)
duck = signal.fftconvolve(speech, np.ones(kk) / kk, "same")   # (direct np.convolve with 14k taps took minutes)
mus = mus * (1 - (1 - db(-4)) * duck)[:, None]
sp = speech > .5
mr = rms(mus[sp])
if mr > 1e-5:
    mus *= (rms(vox[sp]) / db(CFG.get("voice_over_music_db", 8))) / mr
# the silence before the last ring (TL QUIET..RING): everything but the room tone is cut dead, reverb tails included
gate = np.ones(len(vox), np.float32)
if "QUIET" in TL and "RING" in TL:
    a, b, f = int(TL["QUIET"] * SR), int((TL["RING"] - .003) * SR), int(.012 * SR)
    gate[a - f:a] = np.linspace(1, 0, f); gate[a:b] = 0
mix = ((vox + mus + fol + amb) * gate[:, None] + tone[:len(vox)])[:int(DUR * SR)]
if os.environ.get("MIX_STEMS"):                                               # MIX_STEMS=1: write each bus for inspection
    os.makedirs(os.path.join(HERE, "out", "stems"), exist_ok=True)
    for name, x in [("voice", vox), ("music", mus), ("foley", fol), ("ambience", amb)]: sf.write(os.path.join(HERE, "out", "stems", name + ".wav"), (x * gate[:, None])[:int(DUR * SR)], SR, subtype="FLOAT")
L0 = lufs(mix)
mix = limit(mix, db(L0 + CFG.get("crest_db", 11)))                                # loudnorm then stays linear at -14 LUFS / -1.5 dBTP
if np.abs(hotb).max() > 0:
    c = db(L0 + CFG.get("crest_db", 11) - .6)
    hot = hall(room(hotb, size=.95, mix=.45, predelay=.035, damp=.45, seed=23))[:len(mix)] * db(CFG.get("hot_db", 0))
    mix = mix + hot * gate[:len(mix), None]
    a0 = max(0, int((TL.get("RING", 0) - .05) * SR))                             # the whole scare window (ring, tear, static) through the clipper
    up = signal.resample_poly(mix[a0:], 4, 1, axis=0)
    mix[a0:] = signal.resample_poly(c * np.tanh(up / c), 1, 4, axis=0)[:len(mix) - a0]
print(f"programme {L0:.1f} LUFS, peaks limited to {L0 + CFG.get('crest_db', 11):.1f} dBFS")
mix *= .89 / np.abs(mix).max()
sf.write(os.path.join(HERE, "out", "mix.wav"), mix, SR, subtype="PCM_24")
for name, x in [("voice", vox), ("music", mus), ("foley", fol), ("ambience", amb)]:
    print(f"{name:9s} rms {20 * np.log10(rms(x) + 1e-9):6.1f} dB (pre-normalise)")
print("mix.wav", round(len(mix) / SR, 2), "s")
