"""Mix: voices + room tone + foley + the lo-fi bed -> out/mix.wav, and out/stems/{voice,music,foley,room}.wav (the same gains,
before the master limiter) for the voice-margin check.

Every effect is reused from the episode folders (sfx/sources.json lists the file, the cut and why):
  room tone  sr08-fire-door duct_hum (a basement-ish low ventilation hum), looped with long equal-power crossfades
  ice clink  vm07-tip-jar jar (a clear glass clink and a little rattle), raised 2 semitones, plus a sliver of real ice
             cubes from vl12-robo-cleo ice_dispense
  thunk      sr11-store-214 lights_on (the contactor clunk and the first of the spotlights' buzz)
  coo        vl01-day-one coo
  whoosh     vm01-first-shift whoosh;  slam: vm02-exact-change thud
Voices: high-passed, each line levelled to the same speech level (the shout 2 dB hotter), a small room around them.
Music: -15 dB under the voices' level, ducked a further 8 dB from 0.15 s before each line to 0.3 s after it.
Master: gain to about -14.5 LUFS (ffmpeg ebur128), then a 4x-oversampled look-ahead peak limiter at -2.2 dBFS so the
loudnorm pass in tools/mux.sh stays linear.
  python tools/mix.py
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "vm13-rewards-program", "tools"))       # read-only reuse of the house helpers
from audio import SR, lowpass, highpass, load                                    # noqa: E402
from band import small_room                                                      # noqa: E402

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
DUR = TL["DUR"]
N = int(round(DUR * SR))
db = lambda d: 10 ** (d / 20)
SRC = json.load(open(os.path.join(HERE, "sfx", "sources.json")))


def buf(): return np.zeros((N, 2), np.float32)


def put(b, x, t, g=1.0):
    if x.ndim == 1: x = np.stack([x, x], 1)
    i = int(round(t * SR))
    if i < 0: x = x[-i:]; i = 0
    j = min(N, i + len(x))
    if j > i: b[i:j] += x[:j - i] * g


def rms(x): return float(np.sqrt(np.mean(x ** 2)) + 1e-12)


def fade(x, a=.004, z=.05):
    x = x.copy(); na, nz = int(a * SR), int(z * SR)
    if na: x[:na] *= np.linspace(0, 1, na)[:, None] if x.ndim == 2 else np.linspace(0, 1, na)
    if nz: x[-nz:] *= np.linspace(1, 0, nz)[:, None] if x.ndim == 2 else np.linspace(1, 0, nz)
    return x


def pitch(x, semis):
    r = 2 ** (semis / 12)
    return signal.resample(x, int(len(x) / r), axis=0).astype(np.float32)


def sfx(key):
    s = SRC[key]
    x = load(os.path.join(ROOT, s["file"]))
    a, z = s.get("cut", [0, len(x) / SR])
    x = x[int(a * SR):int(z * SR)]
    if s.get("semitones"): x = pitch(x, s["semitones"])
    x = fade(x, .003, min(.08, len(x) / SR / 3))
    act = np.abs(x).max(1) > 0.05 * np.abs(x).max()
    return x * (db(-20) / rms(x[act]))                               # levelled to -20 dBFS RMS where it sounds


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def lufs(x):
    p = os.path.join(HERE, "out", ".meter.wav")
    sf.write(p, x, SR, subtype="FLOAT")
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", p, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    os.remove(p)
    s = e[e.rfind("Summary"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1))


def peak_limit(x, ceil_db=-2.2, look=.003, rel=.08):
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(1)
    pk = pk[:len(pk) // 4 * 4].reshape(-1, 4).max(1)
    pk = np.pad(pk, (0, max(0, len(x) - len(pk))))[:len(x)]
    need = np.minimum(1.0, db(ceil_db) / np.maximum(pk, 1e-9)).astype(np.float64)
    la = max(1, int(look * SR))
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * la + 1, mode="nearest")
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):                                          # instant attack (look-ahead covers it), smooth release
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    return (x * out[:, None]).astype(np.float32), float(out.min())


def main():
    voice, music, foley, room = buf(), buf(), buf(), buf()
    # voices
    act = np.zeros(N, bool)
    for v in TL["VO"]:
        x = decode(os.path.join(HERE, "voice", "out", v["id"] + ".mp3"))
        x = highpass(x[:, None], 90)[:, 0]
        a = np.abs(x) > 0.02 * np.abs(x).max()
        target = -19.0 + (2.0 if v["id"] == "L5" else 0.0)
        x = x * (db(target) / rms(x[a]))
        st = np.stack([x, x], 1)
        st = small_room(st, rt=.35, mix=.10, seed=4, bright=6000)
        put(voice, st, v["t"])
        act[int(v["t"] * SR):int((v["t"] + v["dur"]) * SR)] = True
    # room tone: looped with equal-power crossfades from changing offsets
    rt = sfx("room")
    rt = lowpass(rt, 2500)
    seg, xf = int(3.0 * SR), int(0.8 * SR)
    pos, k = 0, 0
    rng = np.random.default_rng(3)
    while pos < N:
        off = int(rng.uniform(0, len(rt) - seg - xf - 1))
        piece = rt[off:off + seg + xf].copy()
        w = np.sin(np.linspace(0, np.pi / 2, xf))[:, None]
        if k: piece[:xf] *= w
        piece[-xf:] *= w[::-1]
        put(room, piece, pos / SR, db(-30))
        pos += seg; k += 1
    # foley
    cues = {c["fx"]: c["t"] for c in TL["CUES"]}
    put(foley, sfx("ice_clink"), cues["ice_clink"], db(-6))
    put(foley, sfx("ice_rattle"), cues["ice_clink"] + 0.03, db(-14))
    put(foley, sfx("spotlight_thunk"), cues["spotlight_thunk"] - 0.04, db(-2))
    put(foley, sfx("pigeon_coo"), cues["pigeon_coo"], db(-9))
    put(foley, sfx("whoosh"), cues["whoosh"] - 0.18, db(-6))
    put(foley, sfx("slam"), cues["slam"] - 0.09, db(+1))
    foley = small_room(foley, rt=.4, mix=.15, seed=9, bright=7000)
    # music, ducked under the lines
    m = load(os.path.join(HERE, "out", "music.wav"))[:N]
    m = np.pad(m, ((0, N - len(m)), (0, 0)))
    duck = np.ones(N, np.float32)
    for v in TL["VO"]:
        i0, i1 = int((v["t"] - .15) * SR), int((v["t"] + v["dur"] + .3) * SR)
        duck[max(0, i0):i1] = db(-8)
    duck = signal.filtfilt(*signal.butter(1, 4 / (SR / 2)), duck).astype(np.float32)
    music[:] = m * db(-34 - (-24)) * duck[:, None]                   # music.wav is at -24 dBFS RMS: bed at -34, voices at -19
    stems = {"voice": voice, "music": music, "foley": foley, "room": room}
    mix = voice + music + foley + room
    L = lufs(mix)
    g = db(-14.5 - L)
    mix *= g
    for k in stems: stems[k] = stems[k] * g
    mix, gmin = peak_limit(mix, -2.2)
    mix[:int(.004 * SR)] *= np.linspace(0, 1, int(.004 * SR))[:, None]
    mix[-int(.01 * SR):] *= np.linspace(1, 0, int(.01 * SR))[:, None]
    os.makedirs(os.path.join(HERE, "out", "stems"), exist_ok=True)
    sf.write(os.path.join(HERE, "out", "mix.wav"), mix, SR, subtype="FLOAT")
    for k, x in stems.items(): sf.write(os.path.join(HERE, "out", "stems", k + ".wav"), x.astype(np.float32), SR, subtype="FLOAT")
    print(f"mix: pre-gain {L:.1f} LUFS, gain {20 * np.log10(g):+.1f} dB, limiter max reduction {-20 * np.log10(gmin):.1f} dB -> out/mix.wav")


if __name__ == "__main__":
    main()
