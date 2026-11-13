"""Found-footage mix for STILL RECORDING (tape 7 on; owner 11/13: natural sound only) → out/mix.wav
1. The scene. Every event in out/events.json is a sound in the scene, placed in its space: close (at his camcorder mic: breath,
   hands, the flash right behind him), shop (the small store's room: the machine, the lightbox, steps), hall (the concourse
   beyond the half-open shutter: big reverb, muffled). Leon's lines go into the camcorder mic. The beds duck under his lines.
   The drone (out/music.wav, grown from the machine's own hum) sits in the shop.
2. The recording. Each shot goes through the device that recorded it (mix.json "devices"): the camcorder (mono, band-limited,
   mic hiss, an AGC that breathes: quiet stretches bring the hiss up, a loud sound overloads the preamp, the AGC slams down and
   pumps the hiss back up) or CAM 05's ceiling mic (narrow band, more hiss, a fast leveller). Short crossfades at every cut.
3. The tape. Blank-tape static, tracking glitches, the archive deck's transport clunk and the deck's hiss (so no cut ever drops
   to digital silence) are added after the recording.
4. True peaks held to "plr_db" over the loudness, so tools/mux.sh's two-pass loudnorm stays linear.
  .venv/bin/python tools/mix.py
mix.json: room_db, voice_db, duck_db, music_db, devices {shot: cam|cctv}, cam {...}, cctv {...}, plr_db,
          derived {name: {from, lp, hp}}, foley {type: {fx, g, space, align, fin, fout, ramp, trim, dur}}
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import maximum_filter1d

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, fade, load, lowpass, highpass, bandpass, room, rms, lufs

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
EV = json.load(open(os.path.join(HERE, "out", "events.json")))["EV"]
CFG = json.load(open(os.path.join(HERE, "mix.json")))
DUR = TL["DUR"]
N = int(DUR * SR)
FX = os.path.join(HERE, "sfx", "out")
db = lambda d: 10 ** (d / 20)
rng = np.random.default_rng(5)


def active(x, floor=.08):
    mm = np.abs(x).max(1) if x.ndim == 2 else np.abs(x)
    idx = np.nonzero(mm > floor * mm.max())[0]
    return (idx[0], idx[-1]) if len(idx) else (0, len(x))


_cache = {}


def fx(name):
    """an effect, levelled to -20 dBFS RMS over its active part; 'derived' effects are filtered copies of another"""
    if name not in _cache:
        d = CFG.get("derived", {}).get(name)
        if d:
            x = fx(d["from"]).copy()
            if "skip" in d: x = x[int(d["skip"] * SR):]                       # leave out a clunk at the head of the recording
            if "lp" in d: x = lowpass(x, d["lp"], 2)
            if "hp" in d: x = highpass(x, d["hp"], 2)
        else:
            x = load(os.path.join(FX, name + ".wav"))
        a, b = active(x, .05)
        _cache[name] = (x * (db(-20) / max(rms(x[a:b + 1]), 1e-6))).astype(np.float32)
    return _cache[name]


def place(b, name, t, gain_db, pan=0.0, dur=None, align=False, fin=.01, fout=.12, ramp=0.0, trim=None):
    x = fx(name)
    on = active(x, .2)[0] if align else 0
    if trim is not None:                                                      # keep the hit, lose the effect's own room
        x = fade(x[:on + int(trim * SR)], fin, fout)
    if dur is not None:
        x = fade(x[:on + int(dur * SR)], fin, fout)
    elif trim is None:
        x = fade(x, fin, min(fout, len(x) / SR / 2))
    if ramp:                                                                  # a gain ramp across the effect (dB at its end)
        x = (x * (10 ** (ramp * np.linspace(0, 1, len(x)) / 20))[:, None]).astype(np.float32)
    if pan:
        x = x * np.array([np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414], np.float32)
    add(b, x, t - on / SR, db(gain_db))


def bed(b, name, t0, t1, gain_db, fin=1.0, fout=1.5, xf=.6, env=None):
    """a loop (crossfaded at every seam) from t0 to t1; env = [[t, gain], ...] in absolute time"""
    x = fx(name)
    a, z = active(x, .05)
    x = x[a:z]
    n = int((t1 - t0) * SR)
    out = np.zeros((n, 2), np.float32)
    k, pos, first = int(xf * SR), 0, True
    up, down = np.linspace(0, 1, k)[:, None], np.linspace(1, 0, k)[:, None]
    while pos < n:                                                            # crossfades only at the loop seams
        s = x.copy()
        if not first: s[:k] *= up
        s[-k:] *= down
        mm = min(len(s), n - pos); out[pos:pos + mm] += s[:mm]; pos += len(x) - k; first = False
    if env:
        et, ea = np.array(env, float).T
        out *= np.interp(t0 + np.arange(n) / SR, et, ea).astype(np.float32)[:, None]
    add(b, fade(out, fin, fout), t0, db(gain_db))


# ---------------------------------------------------------------- 1. the scene
L = int((DUR + 2) * SR)
ST = {k: np.zeros((L, 2), np.float32) for k in ["close", "shop", "hall", "tape", "archive"]}
pink = lowpass(highpass(np.cumsum(rng.standard_normal((L, 2)), 0).astype(np.float32), 40), 900)
ST["shop"] += pink * (db(CFG.get("room_db", -60)) / rms(pink))                # the store's air
for e in EV:
    ty = e["type"]
    if ty == "bed" and "t1" in e:
        bed(ST[e.get("space", "shop")], e["fx"], e["t"], min(e["t1"], DUR + 1), e.get("g", -24) + (CFG.get("beds_db", 0) if e.get("space", "shop") in ("shop", "hall") else CFG.get("close_db", 0)), e.get("fin", .5), e.get("fout", .5), env=e.get("env"))
    elif ty in CFG["foley"]:
        c = CFG["foley"][ty]
        g = c.get("g", -14) + 20 * np.log10(max(e.get("g", 1), .05))
        place(ST[e.get("space", c.get("space", "shop"))], c["fx"], e["t"], g, e.get("pan", 0) * .7, dur=e.get("dur", c.get("dur")),
              align=c.get("align", False), fin=c.get("fin", .01), fout=c.get("fout", .12), ramp=e.get("ramp", c.get("ramp", 0)), trim=c.get("trim"))
    else:
        print("no sound for event type", ty)
shop = room(ST["shop"], size=.22, mix=.26, predelay=.006, damp=.55, seed=7)           # a small store: short, close walls
hall = lowpass(room(ST["hall"], size=.95, mix=.6, predelay=.05, damp=.65, seed=21), 2600)   # the concourse, through the shutter
close = room(ST["close"], size=.12, mix=.06, predelay=.002, damp=.6, seed=9)
mus = np.zeros_like(shop)
mp = os.path.join(HERE, "out", "music.wav")
if os.path.exists(mp):
    m = load(mp); n = min(len(m), L); mus[:n] = room(m[:n], size=.22, mix=.26, predelay=.006, damp=.55, seed=7) * db(CFG.get("music_db", -30))

# Leon into the camcorder mic: compressed, levelled, the mic's band
vox = np.zeros((L, 2), np.float32)
speech = np.zeros(L, np.float32)
for v in TL["VO"]:
    x = highpass(load(os.path.join(HERE, "voice", "out", v["id"] + ".mp3"))[:, 0], 90)
    w = int(.02 * SR)
    lvl = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same") + 1e-9))
    gr = np.convolve(np.where(lvl > -24, (lvl + 24) * (1 - 1 / 3), 0), np.ones(w) / w, "same")
    x = x * db(-gr)
    a, b = active(x[:, None].repeat(2, 1), .05)
    x *= db(-20) / rms(x[a:b])
    w4 = int(.4 * SR)                                                         # level each line by its loudest 400 ms, so no
    m4 = np.sqrt(np.convolve(x ** 2, np.ones(w4) / w4, "same").max())         # single word sticks out over the rest
    x *= db(CFG.get("voice_peak_db", -16)) / m4
    y = bandpass(x, 140, 6500, 2).astype(np.float32)
    y2 = np.stack([y, y], 1)
    if v.get("fx") == "camhall": y2 = room(y2, size=.9, mix=.38, predelay=.02, damp=.55, seed=17)   # calling out into the empty mall
    add(vox, y2, v["t"], db(CFG.get("voice_db", 0)))
    speech[int((v["t"] - CFG.get("duck_preroll", 0)) * SR):int((v["t"] + v["dur"]) * SR)] = 1     # the beds are down before he speaks
# the beds duck under his lines (attack 60 ms, release 350 ms)
hop = SR // 1000
sp = speech[::hop]
envd = np.zeros_like(sp); cur = 0.0
aa, ar = np.exp(-1 / 60), np.exp(-1 / 350)
for i, s in enumerate(sp):
    cur = s + (cur - s) * (aa if s > cur else ar); envd[i] = cur
envd = np.interp(np.arange(L), np.arange(len(envd)) * hop, envd).astype(np.float32)
duck = (1 - (1 - db(-CFG.get("duck_db", 9))) * envd)[:, None]
beds = (shop + hall + mus) * duck
scene = vox + close + beds
# a voice check: his lines against everything else, inside each line
for v in TL["VO"]:
    i0, i1 = int(v["t"] * SR), int((v["t"] + v["dur"]) * SR)
    print(f"{v['id']}: voice {20 * np.log10(rms(vox[i0:i1]) + 1e-9):6.1f} dB, everything else {20 * np.log10(rms((close + beds)[i0:i1]) + 1e-9):6.1f} dB, "
          f"voice over the rest {20 * np.log10(rms(vox[i0:i1]) / (rms((close + beds)[i0:i1]) + 1e-9)):+.1f} dB")


# ---------------------------------------------------------------- 2. the recording devices
def agc(x, target, boost, cut, att, rel, win=.04):
    """gain riding at 1 kHz control rate: level (RMS over win) → wanted gain toward target, clamped; attack when the gain
    falls, release when it rises"""
    w = int(win * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same")[::hop] + 1e-12)
    want = np.clip(target - 20 * np.log10(e), -cut, boost)
    g = np.empty_like(want); cur = 0.0
    ka, kr = np.exp(-1 / (att * 1000)), np.exp(-1 / (rel * 1000))
    for i, wv in enumerate(want):
        cur = wv + (cur - wv) * (ka if wv < cur else kr); g[i] = cur
    return x * db(np.interp(np.arange(len(x)), np.arange(len(g)) * hop, g)).astype(np.float32), g


def clip(x, ceil, knee=.8):
    """the preamp running out of headroom: linear to knee*ceil, then a fast soft limit at ceil"""
    a, k = np.abs(x), knee * ceil
    y = np.where(a < k, a, k + (ceil - k) * np.tanh((a - k) / (ceil - k)))
    return (np.sign(x) * y).astype(np.float32)


def noise(n, lp_hz, level_db):
    z = lowpass(rng.standard_normal(n).astype(np.float32), lp_hz, 2)
    return z * (db(level_db) / rms(z))


def device(x, c):
    if c.get("clip_first"):                                                   # the capsule and preamp overload first, the narrow
        y = x + noise(len(x), c.get("noise_lp", 7000), c["noise_db"])         # band of the recorder comes after (a hit on the
        y, g = agc(y, c["target"], c["boost"], c["cut"], c["att"], c["rel"])  # housing distorts into the band)
        y = clip(y * db(c.get("pre", 0)), db(c["ceil"]))
        return bandpass(y, c["lo"], c["hi"], c.get("order", 2)), g
    y = bandpass(x, c["lo"], c["hi"], c.get("order", 2))
    y = y + noise(len(y), c.get("noise_lp", 7000), c["noise_db"])            # mic and preamp hiss, before the AGC: it pumps
    y, g = agc(y, c["target"], c["boost"], c["cut"], c["att"], c["rel"])
    y = clip(y * db(c.get("pre", 0)), db(c["ceil"]))
    return y, g


mono = scene.mean(1)
cam, gcam = device(mono, CFG["cam"])
cctv, _ = device(mono, CFG["cctv"])
dev = np.zeros(L, np.int8)                                                    # 0 nothing (static), 1 camcorder, 2 CAM 05
for name, a, b in TL["SHOTS"]:
    dev[int(a * SR):int(b * SR)] = {"cam": 1, "cctv": 2}[CFG["devices"][name]]
for c in TL.get("RECCUT", []):                                                # record-pause: the camcorder stops recording
    dev[int((c - .06) * SR):int((c + .16) * SR)] = 0
for a, b in TL["STATIC"]:
    dev[int(a * SR):int(b * SR)] = 0
k = int(.008 * SR)                                                            # 8 ms crossfades at every cut
box = np.ones(k) / k
wc = np.convolve((dev == 1).astype(np.float32), box, "same")
wv = np.convolve((dev == 2).astype(np.float32), box, "same")
rec = cam * wc + cctv * wv
print(f"camcorder AGC: gain {gcam.min():+.1f} .. {gcam.max():+.1f} dB")
sf.write(os.path.join(HERE, "out", "debug_stems.wav"), np.stack([vox.mean(1), close.mean(1), shop.mean(1), hall.mean(1), mus.mean(1)], 1)[:N], SR, subtype="FLOAT")
sf.write(os.path.join(HERE, "out", "debug_rec.wav"), np.stack([rec, mono], 1)[:N], SR, subtype="FLOAT")   # recording | scene (diagnostics)
sf.write(os.path.join(HERE, "out", "debug_gain.wav"), np.interp(np.arange(N), np.arange(len(gcam)) * hop, gcam).astype(np.float32), SR, subtype="FLOAT")

# ---------------------------------------------------------------- 3. the tape and the archive deck
hiss = fx("tape_hiss").mean(1)
deck = np.zeros(L, np.float32)
reps = int(np.ceil(L / len(hiss))) + 1
deck += np.tile(hiss, reps)[:L] * db(CFG.get("deck_hiss_db", -42))
out = rec + deck + ST["tape"].mean(1) + ST["archive"].mean(1)
mix = np.stack([out, out], 1)[:N]

# ---------------------------------------------------------------- 4. true peaks held to PLR dB over the loudness (linear loudnorm)
PLR = CFG.get("plr_db")
if PLR is not None:
    look = int(.002 * SR)
    up = signal.resample_poly(mix, 4, 1, axis=0)
    tp = np.abs(up).max(1)[:len(mix) * 4].reshape(-1, 4).max(1)
    pk = maximum_filter1d(np.maximum(tp, np.abs(mix).max(1)), size=2 * look + 1)
    src, I0 = mix, lufs(mix)
    for it in range(4):                                                       # the ceiling follows the loudness after limiting
        gain = np.minimum(1.0, db(I0 + PLR) / np.maximum(pk, 1e-9))
        rel, cur, g2 = np.exp(-1 / (.08 * SR)), 1.0, np.empty_like(gain)
        for i in range(len(gain)):
            cur = gain[i] if gain[i] < cur else gain[i] + (cur - gain[i]) * rel
            g2[i] = cur
        mix = src * g2[:, None]
        I1 = lufs(mix)
        if abs(I1 - I0) < .05: break
        I0 = I1
    print(f"loudness {I1:.1f} LUFS; true peaks held to +{PLR} dB over it; max gain reduction {20 * np.log10(g2.min()):.1f} dB at {np.argmin(g2) / SR:.2f} s")
mix *= .89 / np.abs(mix).max()
sf.write(os.path.join(HERE, "out", "mix.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
print("mix.wav", round(len(mix) / SR, 2), "s")
