"""Original score for STILL RECORDING tape 1 "Closing Announcement": no melody, only pressure.
A low contrabass/cello drone a semitone apart (E and F) that never resolves; a dull low piano cluster each time
the figure jumps closer; from the third jump a high violin tremolo creeps in. Everything drops out under
"We can see you." and stays out: the last seconds are tape hiss, a breath and static. CC0 samples (VSCO 2 CE).
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, note, m, lowpass, highpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
DUR = TL["DUR"]
V = {v["id"]: v for v in TL["VO"]}
OUT = V["L6"]["t"] - .25                      # everything is gone before the last line
stems = {k: buf(DUR + 4) for k in ["drone", "hits", "high"]}
USED = set()


def N(t, inst, name, dur, vel=.4, pan=0.0, release=1.5, attack=0.0, stem="drone"):
    if t >= OUT: return
    USED.add(inst)
    dur = min(dur, OUT - t)
    add(stems[stem], note(inst, m(name), dur, vel, release=min(release, OUT - t - dur + .6), attack=attack), t, 1.0, pan)


def held(t0, t1, inst, name, vel, pan, seg=3.4, attack=1.6, stem="drone"):
    """a long note from overlapping bowed samples"""
    t = t0
    while t < t1 - .5:
        N(t, inst, name, min(seg, t1 - t), vel, pan, 1.8, attack, stem); t += seg - 1.2


# the drone: in from the first frame after the static, E against F, very low
held(.7, OUT, "contrabass", "E1", .32, -.15)
held(1.9, OUT, "cellos", "F2", .22, .15, 3.8)
# each jump: a dull low piano cluster, a little louder each time
for i, (t, z, x) in enumerate(TL["JUMPS"][1:-1]):
    v = .22 + .05 * i
    for k, n in enumerate(["A0", "Bb0", "E1"]): N(t + k * .015, "upright", n, 2.6, v, -.1 + .1 * k, 2.0, stem="hits")
# from the third jump, a high tremolo creeps in, rising a semitone at each jump after
J = [j[0] for j in TL["JUMPS"]]
for t0, t1, n in [(J[2], J[3], "E6"), (J[3], J[4], "F6"), (J[4], J[5], "F#6"), (J[5], OUT, "G6")]:
    held(t0, t1 + .3, "violins_trem", n, .18, .3, 3.0, 1.0, "high")
# a second, higher drone line joins at the fifth jump
held(J[4], OUT, "cellos", "Bb2", .2, -.2, 3.6)

GAIN = {"drone": 1.0, "hits": .8, "high": .45}
mus = np.zeros_like(stems["drone"])
for k, v in stems.items():
    print(f"stem {k:6s} rms {20 * np.log10(rms(v) + 1e-9):6.1f} dB  gain {GAIN[k]}")
    mus += v * GAIN[k]
mus = highpass(mus, 28)
mus = room(mus, size=.8, mix=.3, damp=.6, seed=4)
o = int(OUT * SR); k = int(.25 * SR)                # hard out before "We can see you."
mus[o - k:o] *= np.linspace(1, 0, k)[:, None]; mus[o:] = 0
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per 2 s dB:", " ".join(f"{b * 2}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * 2 * SR):int((b + 1) * 2 * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / 2) + 1)))
