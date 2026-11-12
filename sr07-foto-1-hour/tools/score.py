"""Original score for STILL RECORDING tape 7 "Foto 1 Hour": the series drone (E against F, very low), a high tremolo that creeps in
when he finds the print of himself, a low piano cluster on the CAM 05 cut and a heavier one on the crash zoom, a string swell
under the flash charging that stops dead, nothing at all after the flash, then one soft low cluster when the last print comes
into focus and a thin drone to the static. CC0 samples (VSCO 2 CE).
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, note, m, highpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
DUR = TL["DUR"]
SH = {s[0]: s for s in TL["SHOTS"]}
QUIET, POP, FOCUS, END = TL["QUIET"], TL["POP"], TL["PRINT_FOCUS"][1], TL["END"]
stems = {k: buf(DUR + 4) for k in ["drone", "hits", "high", "swell"]}
USED = set()
WINDOWS = [(0.6, QUIET), (FOCUS - .05, END)]          # music only plays inside these; hard cuts at their ends


def window_end(t):
    for a, b in WINDOWS:
        if a - 1e-6 <= t < b: return b
    return None


def N(t, inst, name, dur, vel=.4, pan=0.0, release=1.5, attack=0.0, stem="drone"):
    end = window_end(t)
    if end is None: return
    USED.add(inst)
    dur = min(dur, end - t)
    add(stems[stem], note(inst, m(name), dur, vel, release=min(release, max(.05, end - t - dur + .4)), attack=attack), t, 1.0, pan)


def held(t0, t1, inst, name, vel, pan, seg=3.4, attack=1.6, stem="drone"):
    """a long note from overlapping bowed samples"""
    t = t0
    while t < t1 - .5:
        N(t, inst, name, min(seg, t1 - t), vel, pan, 1.8, attack, stem); t += seg - 1.2


# the drone: from the first frame after the static, quiet at the machine, fuller from the prints on
held(.6, SH["prints"][1], "contrabass", "E1", .22, -.15)
held(SH["prints"][1] - .4, QUIET, "contrabass", "E1", .3, -.15)
held(SH["prints"][1], QUIET, "cellos", "F2", .2, .15, 3.8)
# a high tremolo creeps in when the print of himself turns up, a semitone higher on CAM 05
held(TL["FLIPS"][3] + .3, SH["cctv"][1] + .1, "violins_trem", "E6", .1, .3, 3.0, 1.8, "high")
held(SH["cctv"][1], QUIET, "violins_trem", "F6", .14, -.3, 3.0, .5, "high")
# a low piano cluster on the CAM 05 cut, and a heavier one on the crash zoom onto the two points
for t0, v in [(SH["cctv"][1] + .02, .28), (TL["CRASH"][0], .42)]:
    for j, n in enumerate(["A0", "Bb0", "E1"]): N(t0 + j * .015, "upright", n, 2.6, v, -.1 + .1 * j, 2.0, stem="hits")
# the swell under the flash charging: cellos and violas rising, cut dead with the charge
w0, w1 = TL["WHINE"]
for inst, name, pan in [("cellos", "F3", -.2), ("violas", "B3", .2), ("violins_trem", "F5", 0)]:
    N(w0 - .2, inst, name, w1 - w0 + .2, .5, pan, .05, attack=w1 - w0, stem="swell")
# after the flash: nothing. When the last print comes into focus: one soft low cluster and a thin drone to the static
for j, n in enumerate(["A0", "Bb0", "E1"]): N(FOCUS + j * .02, "upright", n, 3.0, .24, -.1 + .1 * j, 2.0, stem="hits")
held(FOCUS, END, "contrabass", "E1", .24, -.1, 3.4, .8)
held(FOCUS + .4, END, "violins_trem", "F6", .1, .2, 3.0, 1.2, "high")
GAIN = {"drone": 1.0, "hits": .85, "high": .25, "swell": .9}
mus = np.zeros_like(stems["drone"])
for k, v in stems.items():
    print(f"stem {k:6s} rms {20 * np.log10(rms(v) + 1e-9):6.1f} dB  gain {GAIN[k]}")
    mus += v * GAIN[k]
mus = highpass(mus, 28)
mus = room(mus, size=.8, mix=.3, damp=.6, seed=4)
for a, b in WINDOWS:                                    # the reverb tails are cut too: hard outs
    i = int(b * SR); k = int(.012 * SR)
    mus[i - k:i] *= np.linspace(1, 0, k)[:, None]
    nxt = [w[0] for w in WINDOWS if w[0] > b]
    mus[i:int(nxt[0] * SR) if nxt else len(mus)] = 0
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per 2 s dB:", " ".join(f"{b * 2}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * 2 * SR):int((b + 1) * 2 * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / 2) + 1)))
