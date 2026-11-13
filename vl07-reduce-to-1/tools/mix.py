"""Volt Labs mix (shared by Volt Labs 4-6; owner 11/13: natural sound, music that serves the scene) -> out/mix.wav
1. Room tone: the basement lab's own air, generated for the whole film (no loop, so no seam can repeat at the cuts): ventilation
   noise shaped like a small concrete room plus the lab's 60 Hz mains hum and its harmonics. Shots listed in mix.json "shots"
   add their own air (the street through the window glass), crossfaded at the cuts. The tone runs under every shot.
2. Foley: every event in out/events.json (film.js EV) is a sound on the frame of its action, in its space:
     lab   the small hard room (brick, concrete): short bright reverb
     out   outside, heard through the window glass (or the door): low-passed, a little street slap, quieter
     close at the characters (clothes, hands, a pen): nearly dry
     dry   inserts and the cartoon effects (only on a visual gag)
   Footsteps and rustles are single grains cut from one recording of several (mix.json "grains"), pitch- and level-varied, so
   no two are the same. Every effect gets a fade in and out.
3. Voices: the approved chain (3:1 above -24 dB, -20 dBFS active RMS, peaks at -9 dB), a touch of the lab; lines with
   "space": "out" in mix.json "voices" are heard through the glass.
4. Music (out/music.wav, the band, active RMS -20 dBFS) at music_db, ducked by duck_db under every line (from 150 ms before,
   attack 60 ms, release 350 ms).
5. Checks printed (and asserted): every line's voice against everything else, K-weighted, over the part of the line where the
   voice is sounding, >= min_margin_db; the worst 400 ms window too; clicks; digital silence. True peaks held to plr_db over the
   integrated loudness so tools/mux.sh's second loudnorm pass is linear.
  .venv/bin/python tools/mix.py
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import maximum_filter1d, uniform_filter1d

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, fade, load, lowpass, highpass, bandpass, room, rms, lufs

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
EV = json.load(open(os.path.join(HERE, "out", "events.json")))["EV"]
CFG = json.load(open(os.path.join(HERE, "mix.json")))
DUR = TL["DUR"]
N = int(round(DUR * SR))
L = N + 2 * SR
FX = os.path.join(HERE, "sfx", "out")
db = lambda d: 10 ** (d / 20)
rng = np.random.default_rng(int(CFG.get("seed", 5)))


def active(x, floor=.08):
    mm = np.abs(x).max(1) if x.ndim == 2 else np.abs(x)
    idx = np.nonzero(mm > floor * mm.max())[0]
    return (idx[0], idx[-1]) if len(idx) else (0, len(x))


_cache = {}


def fx(name):
    """an effect levelled to -20 dBFS RMS over its active part (wav, or the tracked mp3); mix.json "derived" makes filtered or
    trimmed copies: {"from", "skip", "len", "lp", "hp"}"""
    if name not in _cache:
        d = CFG.get("derived", {}).get(name)
        if d:
            x = fx(d["from"]).copy()
            if "skip" in d: x = x[int(d["skip"] * SR):]
            if "len" in d: x = fade(x[:int(d["len"] * SR)], .005, min(.08, d["len"] / 3))
            if "lp" in d: x = lowpass(x, d["lp"], 2)
            if "hp" in d: x = highpass(x, d["hp"], 2)
        else:
            p = os.path.join(FX, name + ".wav")
            x = load(p if os.path.exists(p) else os.path.join(FX, name + ".mp3"))
            if x.shape[1] == 1: x = np.repeat(x, 2, 1)
        a, b = active(x, .05)
        _cache[name] = (x * (db(-20) / max(rms(x[a:b + 1]), 1e-6))).astype(np.float32)
    return _cache[name]


_grains = {}


def grains(name):
    """single sounds cut from a recording of several (steps, rustles): onsets of the 5 ms envelope, transients closer than
    `merge` s are one sound (heel and toe), each cut from 4 ms before its onset to the next one (or `len` s), faded"""
    if name not in _grains:
        c = CFG.get("grains", {}).get(name, {})
        x = fx(c.get("from", name))
        mono = np.abs(x).max(1)
        w = int(.005 * SR)
        env = maximum_filter1d(mono, w)[::w]
        thr = env.max() * c.get("thr", .25)
        ons = []
        for i in range(1, len(env)):
            if env[i] > thr and env[i - 1] <= thr and (not ons or (i - ons[-1]) * w > c.get("merge", .14) * SR):
                ons.append(i)
        ons = [o * w for o in ons]
        G = []
        for k, o in enumerate(ons):
            a = max(0, o - int(.004 * SR))
            b = min(len(x), ons[k + 1] - int(.01 * SR) if k + 1 < len(ons) else len(x), a + int(c.get("len", .32) * SR))
            g = fade(x[a:b].copy(), .002, min(.06, (b - a) / SR / 3))
            G.append(g * (db(-20) / max(rms(g), 1e-6)))
        assert G, name
        _grains[name] = G
        print(f"grains {name}: {len(G)} from {name}")
    return _grains[name]


def repitch(x, semis):
    if abs(semis) < 1e-3:
        return x
    r = 2 ** (semis / 12)
    n = int(len(x) / r)
    return np.stack([np.interp(np.arange(n) * r, np.arange(len(x)), x[:, c]) for c in range(2)], 1).astype(np.float32)


def place(b, x, t, gain_db, pan=0.0, align=False):
    on = active(x, .2)[0] if align else 0
    if pan:
        x = x * np.array([np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414], np.float32)
    add(b, x, t - on / SR, db(gain_db))


# ---------------------------------------------------------------- 1. the room tone (generated, no loop)
def lab_tone(n, seed=21):
    r = np.random.default_rng(seed)
    f = np.fft.rfftfreq(n, 1 / SR)
    fs = np.maximum(f, 1.0)
    shape = 1 / np.sqrt(fs)                                                # pink: air moving through the ducts
    shape *= 1 / (1 + (fs / 1800) ** 2)                                    # soft above 1.8 kHz
    shape *= 1 / (1 + (55 / fs) ** 4)                                      # nothing under 55 Hz
    for f0, q, g in [(92, 5, 2.2), (138, 6, 1.7), (205, 7, 1.5), (310, 8, 1.25)]:   # a small concrete room's modes
        shape *= 1 + (g - 1) * np.exp(-((f - f0) / (f0 / q)) ** 2)
    ch = [np.fft.irfft(shape * (r.standard_normal(len(f)) + 1j * r.standard_normal(len(f))), n) for _ in range(2)]
    x = np.stack([ch[0] * .8 + ch[1] * .2, ch[1] * .8 + ch[0] * .2], 1)
    x *= (1 + .08 * np.sin(2 * np.pi * .07 * np.arange(n) / SR + 1))[:, None]   # the air breathes a little
    x = (x / rms(x)).astype(np.float32)
    t = np.arange(n) / SR
    am = 1 + .12 * np.sin(2 * np.pi * .23 * t)
    hum = sum(a * np.sin(2 * np.pi * 60 * k * t + r.uniform(0, 6.28)) for k, a in [(1, 1.0), (2, .8), (3, .5), (4, .3), (5, .18), (6, .1)])
    hum = (hum * am).astype(np.float32)
    hum /= rms(hum)
    return x, np.stack([hum, hum * .96], 1)


tone_air, tone_hum = lab_tone(L)
TONE = tone_air * db(CFG.get("tone_db", -50)) + tone_hum * db(CFG.get("hum_db", -62))
TONE = room(TONE, size=.04, mix=.2, predelay=.005, damp=.3, seed=8)

# ---------------------------------------------------------------- 2. foley, by space
def machine(kind, dur, seed=3):
    """a running appliance, generated for exactly as long as it runs (no loop): 'microwave' = the magnetron's 120 Hz transformer
    buzz with its harmonics, the turntable's slow wobble and the cooling fan; a 40 ms start, a 0.5 s spin-down"""
    r = np.random.default_rng(seed)
    n = int(dur * SR); t = np.arange(n) / SR
    if kind != "microwave":
        raise ValueError(kind)
    buzz = sum(a * np.sin(2 * np.pi * 120 * k * t + r.uniform(0, 6.28)) for k, a in [(1, 1), (2, .6), (3, .45), (4, .3), (5, .2), (6, .12), (8, .08)])
    buzz = buzz * (1 + .12 * np.sin(2 * np.pi * .5 * t))
    fan = bandpass(r.standard_normal(n).astype(np.float32), 250, 2500, 2)
    x = buzz / rms(buzz) * .6 + fan / rms(fan) * .4
    env = np.minimum(1, t / .04) * np.clip((dur - t) / .5, 0, 1) ** 1.5
    y = (x * env).astype(np.float32)
    return np.stack([y, y * .95], 1) * db(-20) / max(rms(y[:int(min(n, SR))]), 1e-9)


SP = {k: np.zeros((L, 2), np.float32) for k in ["lab", "out", "close", "dry"]}
for e in EV:
    ty = e["type"]
    if ty == "machine":                                                    # {type: 'machine', kind, t, t1, g (dB)}
        add(SP[e.get("space", "lab")], machine(e["kind"], e["t1"] - e["t"]), e["t"], db(e.get("g", -34)), e.get("pan", 0))
        continue
    c = CFG["foley"].get(ty)
    if c is None:
        print("NO SOUND for event type", ty); continue
    space = e.get("space", c.get("space", "lab"))
    g = c.get("g", -14) + e.get("gdb", 0) + 20 * np.log10(max(e.get("g", 1), .05))
    if "grain" in c:
        G = grains(c["grain"])
        idx = e.get("i", int(rng.integers(len(G))))
        x = repitch(G[idx % len(G)], float(rng.normal(0, c.get("vary", .6))))
        g += float(rng.normal(0, 1.2))
    else:
        x = fx(c["fx"])
        if "skip" in c: x = x[int(c["skip"] * SR):]
    dur = e.get("dur", c.get("dur"))
    fin, fout = c.get("fin", .005), c.get("fout", .08)
    if dur is not None:
        on = active(x, .2)[0] if c.get("align") else 0
        x = x[:on + int((dur + fout) * SR)]
    x = fade(x, fin, min(fout, len(x) / SR / 2))
    if c.get("lp"): x = lowpass(x, c["lp"])
    place(SP[space], x, e["t"] + c.get("dt", 0), g, e.get("pan", c.get("pan", 0)) * .8, align=c.get("align", False))

# the shots' own air (the street through the glass), crossfaded 120 ms at the cuts
for name, spec in CFG.get("shots", {}).items():
    for s in TL["SHOTS"]:
        if s[0] != name:
            continue
        for bedname, gdb in spec.items():
            bc = CFG["beds"][bedname]
            x = fx(bc["fx"])[int(bc.get("skip", 0) * SR):]
            n = int((s[2] - s[1] + .24) * SR)
            off = int(rng.integers(0, max(1, len(x) - n)))
            seg = x[off:off + n]
            if len(seg) < n:
                raise SystemExit(f"bed {bedname} too short for shot {name}")
            if bc.get("lp"): seg = lowpass(seg, bc["lp"])
            add(SP[bc.get("space", "out")], fade(seg, .12, .12), s[1] - .12, db(gdb))

lab = room(SP["lab"], size=.04, mix=.24, predelay=.005, damp=.3, seed=7)            # the basement: short, bright, close walls
out = lowpass(SP["out"], 2800, 2)                                                    # through the glass
out = room(out, size=.12, mix=.16, predelay=.028, damp=.6, seed=11) * db(-2)        # the street's slap off the house front
close = room(SP["close"], size=.03, mix=.1, predelay=.003, damp=.4, seed=13)
FOL = lab + out + close + SP["dry"]

# ---------------------------------------------------------------- 3. voices (the approved chain)
vox = np.zeros((L, 2), np.float32)
speech = np.zeros(L, np.float32)
VC = CFG.get("voices", {})
for v in TL["VO"]:
    x = highpass(load(os.path.join(HERE, "voice", "out", v["id"] + ".mp3"))[:, 0], 90)
    if v.get("cut"):
        n = int(v["cut"] * SR); x = x[:n].copy(); f = int(.04 * SR); x[-f:] *= np.linspace(1, 0, f)
    w = int(.02 * SR)
    lvl = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same") + 1e-9))
    gr = np.convolve(np.where(lvl > -24, (lvl + 24) * (1 - 1 / 3), 0), np.ones(w) / w, "same")
    x = x * db(-gr)
    a, b = active(x[:, None].repeat(2, 1), .05)
    x *= db(-20) / rms(x[a:b])
    look, ab = int(.005 * SR), np.abs(x)
    peak = np.array([ab[max(0, i - look):i + look].max() for i in range(0, len(x), look)])
    g = np.convolve(np.repeat(np.minimum(1, db(-9) / np.maximum(peak, 1e-9)), look)[:len(x)], np.ones(look * 2) / (look * 2), "same")
    x = (x * np.minimum(g, 1)).astype(np.float32)
    vc = VC.get(v["id"], {})
    pan = CFG.get("pan", {}).get(v["who"], 0)
    y = np.zeros((len(x), 2), np.float32); add(y, x, 0, 1.0, pan)
    if vc.get("space") == "out":                                                    # through the window glass: a little duller
        y = room(lowpass(y, vc.get("lp", 5200), 2), size=.1, mix=.1, predelay=.025, damp=.6, seed=17)
    elif vc.get("lp"):                                                              # muffled (under a sheet of paper)
        y = lowpass(y, vc["lp"], 2)
    add(vox, y, v["t"], db(CFG.get("voice_db", 0) + v.get("gain_db", 0) + vc.get("gdb", 0)))
    speech[int((v["t"] - .15) * SR):int((v["t"] + v["dur"]) * SR)] = 1
vox = room(vox, size=.04, mix=.06, predelay=.005, damp=.35, seed=9)

# ---------------------------------------------------------------- 4. music, ducked under the lines
hop = SR // 1000
sp = speech[::hop]
envd = np.zeros_like(sp); cur = 0.0
ka, kr = np.exp(-1 / 60), np.exp(-1 / 350)
for i, s in enumerate(sp):
    cur = s + (cur - s) * (ka if s > cur else kr); envd[i] = cur
envd = np.interp(np.arange(L), np.arange(len(envd)) * hop, envd).astype(np.float32)
MUS = np.zeros((L, 2), np.float32)
mp = os.path.join(HERE, "out", "music.wav")
if os.path.exists(mp):
    m = load(mp); n = min(len(m), L); MUS[:n] = m[:n] * db(CFG.get("music_db", -9))
MUS *= (1 - (1 - db(-CFG.get("duck_db", 10))) * envd)[:, None]

# ---------------------------------------------------------------- 5. checks: the voices over everything else
REST = TONE + FOL + MUS


def kw(x):
    y = signal.lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, .73248077421585], x)
    return signal.lfilter([1.0, -2.0, 1.0], [1.0, -1.99004745483398, .99007225036621], y)


kv, kr_ = kw(vox.mean(1).astype(np.float64)), kw(REST.mean(1).astype(np.float64))
w5 = int(.05 * SR)
worst_line = 99
print("line  who        voice-over-rest  worst 400 ms")
for v in TL["VO"]:
    i0, i1 = int(v["t"] * SR), int((v["t"] + v["dur"]) * SR)
    pv = (kv[i0:i1][:(i1 - i0) // w5 * w5].reshape(-1, w5) ** 2).mean(1)
    pr = (kr_[i0:i1][:(i1 - i0) // w5 * w5].reshape(-1, w5) ** 2).mean(1)
    on = pv > pv.max() * db(-20) ** 2                                               # where the voice is sounding
    mg = 10 * np.log10(pv[on].sum() / max(pr[on].sum(), 1e-20))
    k = 8                                                                           # 400 ms windows (8 x 50 ms), hop 50 ms
    ws = [10 * np.log10(pv[j:j + k][on[j:j + k]].sum() / max(pr[j:j + k][on[j:j + k]].sum(), 1e-20))
          for j in range(0, max(1, len(pv) - k + 1)) if on[j:j + k].mean() >= .5]
    wst = min(ws) if ws else mg
    worst_line = min(worst_line, mg)
    print(f"{v['id']:5s} {v['who']:9s} {mg:+6.1f} dB        {wst:+6.1f} dB   {v['sub']!r}")
print(f"lowest line margin {worst_line:+.1f} dB (rule: >= {CFG.get('min_margin_db', 8)})")
assert worst_line >= CFG.get("min_margin_db", 8), "a line is not clear enough over the music and effects"

mix = (vox + REST)[:N]

# true peaks held to plr_db over the loudness (linear loudnorm in mux.sh)
PLR = CFG.get("plr_db", 11.5)
up = signal.resample_poly(mix, 4, 1, axis=0)
tp = np.abs(up).max(1)[:len(mix) * 4].reshape(-1, 4).max(1)
look = int(.002 * SR)
pk = maximum_filter1d(np.maximum(tp, np.abs(mix).max(1)), size=2 * look + 1)
src, I0 = mix, lufs(mix)
for it in range(4):
    gain = np.minimum(1.0, db(I0 + PLR) / np.maximum(pk, 1e-9))
    rel, curg, g2 = np.exp(-1 / (.08 * SR)), 1.0, np.empty_like(gain)
    for i in range(len(gain)):
        curg = gain[i] if gain[i] < curg else gain[i] + (curg - gain[i]) * rel
        g2[i] = curg
    g2 = np.minimum(g2, uniform_filter1d(g2, look, mode="nearest"))
    mix = src * g2[:, None]
    I1 = lufs(mix)
    if abs(I1 - I0) < .05: break
    I0 = I1
gr = 20 * np.log10(g2)
print(f"loudness {I1:.1f} LUFS; true peaks held to +{PLR} dB over it; max gain reduction {gr.min():.1f} dB at {np.argmin(g2) / SR:.2f} s; "
      f"limited more than 2 dB for {(gr < -2).sum() / SR:.2f} s")
mix = (mix * (.89 / np.abs(mix).max())).astype(np.float32)

# listen-check by numbers: clicks (a sample jump far above the local level) and digital silence
mo = mix.mean(1)
d = np.abs(np.diff(mo))
loc = np.sqrt(uniform_filter1d(mo ** 2, int(.01 * SR))) + 1e-6
idx = np.nonzero((d / loc[1:] > 6) & (d > 1e-3))[0]
clicks = []
for i in idx:
    if not clicks or i / SR - clicks[-1] > .02: clicks.append(i / SR)
q = 20 * np.log10(np.array([np.sqrt(np.mean(mo[i:i + w5] ** 2)) for i in range(0, len(mo) - w5, w5)]) + 1e-12)
print(f"clicks: {len(clicks)} {[round(c, 3) for c in clicks[:10]]}; quietest 50 ms {q.min():.1f} dBFS at {np.argmin(q) * .05:.2f} s; digital silence windows: {int((q < -90).sum())}")
sf.write(os.path.join(HERE, "out", "mix.wav"), mix, SR, subtype="PCM_24")
sc = .89 / np.abs((vox + REST)[:N]).max()
sf.write(os.path.join(HERE, "out", "stems.wav"), np.stack([vox.mean(1), MUS.mean(1), FOL.mean(1), TONE.mean(1)], 1)[:N] * sc, SR, subtype="FLOAT")
for name, x in [("voice", vox), ("music", MUS), ("foley", FOL), ("room tone", TONE)]:
    print(f"{name:9s} rms {20 * np.log10(rms(x[:N]) + 1e-9):6.1f} dB (pre-normalise)")
print("mix.wav", round(len(mix) / SR, 3), "s")
