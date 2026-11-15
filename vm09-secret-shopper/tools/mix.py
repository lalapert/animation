"""Mix (natural-sound pass, 11/13): dialogue + the band + foley in the store's acoustics + the store's room tone -> out/mix.wav
and out/stems/{voice,music,foley,room}.wav (the same gains as the mix, before the master limiter) for tools/check.py.

- Room tone: the store (fridge compressor, ventilation, a faint fluorescent buzz) under every frame. Built from a recorded
  hum with its clunks taken out (any 20 ms window more than 2.5 dB over the running median is pulled down), looped with long
  equal-power crossfades from changing offsets (no seam, no repeated clunk), plus a quiet synthesized tube buzz.
- Foley: mix.json "foley" maps each event type (out/events.json) to an effect or to takes cut from one recording ("takes"),
  round robin, each a little different in pitch and level, with a fade in and out. Everything goes through one small hard-
  floored room (early reflections and a short tail). Cartoon effects only where film.js puts them (visual gags).
- Music: out/music.wav (tools/score.py) at music_db under the voices, ridden down by duck_db from just before each line to just
  after it; score.py already left it silent for the punchlines.
- Voices: processed exactly as before (the approved takes are not touched).
- Master: true peaks held to plr_db over the loudness, so the loudnorm second pass in tools/mux.sh stays linear.
  .venv/bin/python tools/mix.py
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import maximum_filter1d, median_filter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, fade, load, lowpass, highpass, bandpass, room, rms
from band import small_room

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
EV = json.load(open(os.path.join(HERE, "out", "events.json")))["EV"]
CFG = json.load(open(os.path.join(HERE, "mix.json")))
DUR = TL["DUR"]
FX = os.path.join(HERE, "sfx", "out")
db = lambda d: 10 ** (d / 20)
rng = np.random.default_rng(7)


def active(x, floor=.08):
    mm = np.abs(x).max(1) if x.ndim == 2 else np.abs(x)
    idx = np.nonzero(mm > floor * mm.max())[0]
    return (idx[0], idx[-1]) if len(idx) else (0, len(x))


_cache = {}


def fx(name, cut=None):
    """an effect (or one take cut from it), levelled to -20 dBFS RMS over its active part, faded at both ends"""
    key = (name, tuple(cut) if cut else None)
    if key not in _cache:
        x = load(os.path.join(FX, name + ".wav"))
        if cut:
            x = x[int(cut[0] * SR):int(cut[1] * SR)].copy()
            x = fade(x, .004, min(.08, len(x) / SR / 3))
        a, b = active(x, .05)
        _cache[key] = (x * (db(-20) / max(rms(x[a:b + 1]), 1e-6))).astype(np.float32)
    return _cache[key]


def vary(x, cents=0.0):
    if not cents: return x
    r = 2 ** (cents / 1200)
    n = int(len(x) / r)
    return signal.resample(x, n, axis=0).astype(np.float32)


def place(b, x, t, gain_db, pan=0.0, align=False, dur=None, fin=.004, fout=.06):
    if dur is not None:
        x = x[:int((dur + fout) * SR)]
    x = fade(x, fin, min(fout, len(x) / SR / 2))
    if pan:
        x = x * np.array([np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414], np.float32)
    add(b, x, t - (active(x, .2)[0] / SR if align else 0), db(gain_db))


def declunk(x, win=.02, over=2.5):
    """pull any short window that jumps more than `over` dB above the running median back down to it"""
    m = x.mean(1)
    w = int(win * SR); n = len(m) // w
    e = np.sqrt((m[:n * w].reshape(n, w) ** 2).mean(1) + 1e-12)
    med = median_filter(e, size=51, mode="reflect")
    g = np.minimum(1.0, med * db(over) / e)
    g = np.convolve(np.repeat(g, w), np.ones(w) / w, "same")
    g = np.concatenate([g, np.full(len(m) - len(g), g[-1])])
    return (x * g[:, None]).astype(np.float32)


def loop_bed(name, n, xf=1.5, trim=.4, seed=1):
    """a long bed from a short recording: declunked, ends trimmed, segments from changing offsets joined by equal-power fades"""
    r = np.random.default_rng(seed)
    x = load(os.path.join(FX, name + ".wav"))
    x = declunk(x)[int(trim * SR):len(x) - int(trim * SR)]
    k = int(xf * SR)
    out = np.zeros((n + len(x), 2), np.float32)
    pos, first = 0, True
    while pos < n:
        a = int(r.integers(0, max(1, len(x) // 3)))
        s = x[a:].copy()
        L = len(s)
        if not first: s[:k] *= np.sin(np.linspace(0, np.pi / 2, k))[:, None]
        s[L - k:] *= np.cos(np.linspace(0, np.pi / 2, k))[:, None]
        out[pos:pos + L] += s
        pos += L - k; first = False
    return out[:n]


def tube_buzz(n, seed=2):
    """a fluorescent tube: 120 Hz and its harmonics, a slow flutter, band-limited (heard on a phone, never sharp)"""
    r = np.random.default_rng(seed)
    t = np.arange(n) / SR
    f = 120 * (1 + .0015 * np.sin(2 * np.pi * .07 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.tanh(2.2 * np.sin(ph)) - .15 * np.sin(2 * ph)
    x = bandpass(x.astype(np.float32), 240, 2600, 2)
    flutter = 1 + .12 * np.convolve(r.standard_normal(n), np.ones(int(.25 * SR)) / int(.25 * SR), "same") * 20
    x = x * np.clip(flutter, .6, 1.4)
    return np.stack([x * .9, x], 1).astype(np.float32)


def kweight(x):
    """BS.1770 K-weighting (high shelf + high pass) for loudness-style measurements"""
    b1, a1 = signal.iirfilter(2, 1500 / (SR / 2), btype="highpass", ftype="butter")
    hs = x + 0.585 * signal.lfilter(b1, a1, x, axis=0)          # ~ +4 dB shelf above 1.5 kHz
    b2, a2 = signal.butter(2, 38 / (SR / 2), "highpass")
    return signal.lfilter(b2, a2, hs, axis=0)


def lufs(x):
    k = kweight(x)
    w, h = int(.4 * SR), int(.1 * SR)
    p = np.array([np.mean(k[i:i + w] ** 2) * 2 for i in range(0, len(k) - w, h)])
    p = p[p > 10 ** ((-70 + .691) / 10)]
    if not len(p): return -70.0
    rel = 10 * np.log10(np.mean(p)) - .691 - 10
    p = p[10 * np.log10(p) - .691 > rel]
    return float(10 * np.log10(np.mean(p)) - .691)


# ---------------------------------------------------------------- 1. room tone (never off)
N = int((DUR + 2) * SR) + 1
RC = CFG["room"]
roomtone = loop_bed(RC["src"], N, seed=RC.get("seed", 1))
roomtone = highpass(roomtone, 35)
roomtone *= db(RC.get("db", -50)) / rms(roomtone)
roomtone += tube_buzz(N) * (db(RC.get("buzz_db", -64)) / rms(tube_buzz(int(2 * SR))))

# ---------------------------------------------------------------- 2. foley (events) in the store's room
fol, beds = buf(DUR + 2), buf(DUR + 2)
counters = {}
for e in EV:
    ty = e["type"]
    if ty == "bed" and "t1" in e:
        if e["fx"] in CFG.get("skip_beds", []): continue
        n = int((min(e["t1"], DUR + 1) - e["t"]) * SR)
        x = loop_bed(e["fx"], n, xf=e.get("xf", .6), trim=e.get("trim", .15), seed=len(counters) + 3)
        x = fade(x * (db(-20) / max(rms(x), 1e-6)), e.get("fin", .4), e.get("fout", .5))
        add(beds, x, e["t"], db(e.get("g", -24) + CFG.get("bed_offset_db", 0)))
        continue
    c = CFG["foley"].get(ty)
    if c is None:
        if ty not in CFG.get("mute", []): print("  (no foley for event type", ty, ")")
        continue
    k = counters.get(ty, 0); counters[ty] = k + 1
    if "takes" in c:
        src, cuts = c["takes"]
        cut = cuts[k % len(cuts)]
        x = fx(src, cut)
    else:
        names = c["fx"] if isinstance(c["fx"], list) else [c["fx"]]
        x = fx(names[k % len(names)])
    x = vary(x, float(rng.normal(0, c.get("cents", 0)))) if c.get("cents") else x
    g = c.get("g", -20) + 20 * np.log10(max(e.get("g", 1), .05)) + float(rng.normal(0, c.get("gvar", 0)))
    dur = e.get("dur", c.get("dur"))
    place(fol, x, e["t"] + c.get("offset", 0), g, e.get("pan", c.get("pan", 0)) * .8, align=c.get("align", False),
          dur=(dur + c.get("tail", .2)) if dur else None, fin=c.get("fin", .004), fout=c.get("fout", .08))
print("foley events:", ", ".join(f"{k} x{v}" for k, v in sorted(counters.items())))
RM = CFG.get("store_room", {"rt": .5, "mix": .2})
fol = small_room(fol, rt=RM["rt"], mix=RM["mix"], seed=11, bright=RM.get("bright", 8000))
beds = small_room(beds, rt=RM["rt"], mix=RM["mix"] * .7, seed=12, bright=RM.get("bright", 8000))

# ---------------------------------------------------------------- 3. voices (unchanged processing)
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
    if v.get("fx") == "speaker":
        pk = np.abs(x).max() + 1e-9
        x = bandpass(np.tanh(bandpass(x, 280, 5200, 3) * 1.6 / pk) / 1.6 * pk, 240, 6000, 2).astype(np.float32)
    pan = {"PIP": -.18, "RAE": .18, "MAGS": 0.0, "KIOSK": .05}.get(v.get("who"), 0)
    add(vox, (x * np.minimum(g, 1)).astype(np.float32), v["t"], db(v.get("gain_db", 0)), pan)
    speech[int(v["t"] * SR):int((v["t"] + v["dur"]) * SR)] = 1
vox = room(vox, size=.18, mix=.07, damp=.6, seed=9)
VR = rms(vox[speech > .5])

# ---------------------------------------------------------------- 4. music: level, then ridden under every line
mus = load(os.path.join(HERE, "out", "music.wav"))
mus = np.concatenate([mus, np.zeros((len(vox) - len(mus), 2), np.float32)]) if len(mus) < len(vox) else mus[:len(vox)]
act = np.abs(mus).max(1) > 1e-4
mus *= (VR * db(CFG.get("music_db", -14))) / max(rms(mus[act]), 1e-9) if act.any() else 1
pre, post = int(CFG.get("duck_pre", .15) * SR), int(CFG.get("duck_post", .25) * SR)
ride = np.zeros(len(vox), np.float32)
for v in TL["VO"]:
    a, b = int(v["t"] * SR) - pre, int((v["t"] + v["dur"]) * SR) + post
    ride[max(0, a):b] = 1
k = int(.12 * SR)
ride = np.convolve(ride, np.ones(k) / k, "same")
mus = mus * (1 - (1 - db(CFG.get("duck_db", -9))) * ride)[:, None]
fol = fol * (1 - (1 - db(CFG.get("foley_duck_db", -2))) * ride)[:, None]
beds = beds * (1 - (1 - db(CFG.get("bed_duck_db", -4))) * ride)[:, None]

# ---------------------------------------------------------------- 5. sum, hold the true peaks, write the mix and the stems
L = int(DUR * SR)
stems = {"voice": vox[:L], "music": mus[:L], "foley": (fol + beds)[:L], "room": roomtone[:L]}
mix = sum(stems.values())
I0 = lufs(mix)
PLR = CFG.get("plr_db", 11.0)
up = signal.resample_poly(mix, 4, 1, axis=0)
tp = np.abs(up).max(1)[:len(mix) * 4].reshape(-1, 4).max(1)
look = int(.002 * SR)
pk = maximum_filter1d(np.maximum(tp, np.abs(mix).max(1)), size=2 * look + 1)
gain = np.minimum(1.0, db(I0 + PLR) / np.maximum(pk, 1e-9))
gs = np.ones_like(gain)
cur, rel = 1.0, np.exp(-1 / (.06 * SR))
for i in range(len(gain)):                                     # instant attack (with the 2 ms look-ahead above), 60 ms release
    cur = gain[i] if gain[i] < cur else gain[i] + (cur - gain[i]) * rel
    gs[i] = cur
mix = mix * gs[:, None]
print(f"loudness {I0:.1f} LUFS before the limiter; peaks held to +{PLR} dB; max gain reduction {20 * np.log10(gs.min()):.1f} dB at {np.argmin(gs) / SR:.2f} s;"
      f" {np.mean(gs < db(-.5)) * 100:.2f}% of samples reduced by more than 0.5 dB")
mix[:int(.006 * SR)] *= np.linspace(0, 1, int(.006 * SR))[:, None]; mix[-int(.012 * SR):] *= np.linspace(1, 0, int(.012 * SR))[:, None]   # no click at the loop point
scale = .89 / np.abs(mix).max()
mix *= scale
os.makedirs(os.path.join(HERE, "out", "stems"), exist_ok=True)
sf.write(os.path.join(HERE, "out", "mix.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
for k2, x in stems.items():
    sf.write(os.path.join(HERE, "out", "stems", k2 + ".wav"), (x * scale).astype(np.float32), SR, subtype="FLOAT")
    print(f"{k2:6s} rms {20 * np.log10(rms(x * scale) + 1e-9):6.1f} dBFS")
print("mix.wav", round(len(mix) / SR, 2), "s")
