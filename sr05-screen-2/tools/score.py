"""Original score for STILL RECORDING tape 5 "Screen 2": the same drone, tightening each time the screen comes back.
The unresolved low drone of the series (E against F); a low piano cluster each time the multiplexer returns to Screen 2
and the figure on the screen is closer; a high tremolo from the third return; one slow, detuned celesta-like glockenspiel
figure, like a cinema chime, before "Enjoy the show."; everything cut at the static before the last frame. CC0 samples (VSCO 2 CE).
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
OUT = 33.45                                   # everything is gone at the static before the last frame
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


# the drone: in from the first frame after the static, E against F, very low (as tapes 1 and 4)
held(.7, OUT, "contrabass", "E1", .32, -.15)
held(1.9, OUT, "cellos", "F2", .22, .15, 3.8)
# each return to Screen 2 with the figure closer: a low piano cluster, louder each time
A = [s for s in TL["SEGS"] if s[0] == "A"]
for k, seg in enumerate(A[1:4]):
    for j, n in enumerate(["A0", "Bb0", "E1"]): N(seg[1] + .02 + j * .015, "upright", n, 2.8, .26 + .06 * k, -.1 + .1 * j, 2.2, stem="hits")
# a high tremolo from the third return; it rises a semitone when the screen shows the room
held(A[2][1], OUT, "violins_trem", "E6", .15, .3, 3.0, 1.2, "high")
held(A[3][1], OUT, "violins_trem", "F6", .17, -.3, 3.0, .6, "high")
# a cinema chime before "Enjoy the show.": three slow notes, the last one flat
for j, (n, dt) in enumerate([("E5", 0), ("C5", .55), ("G#4", 1.1)]):
    USED.add("glockenspiel")
    add(stems["high"], note("glockenspiel", m(n) - (.35 if j == 2 else 0), .9, .26, release=1.4), V["L3"]["t"] - 1.7 + dt, .9, .1)

GAIN = {"drone": 1.0, "hits": .8, "high": .45}
mus = np.zeros_like(stems["drone"])
for k, v in stems.items():
    print(f"stem {k:6s} rms {20 * np.log10(rms(v) + 1e-9):6.1f} dB  gain {GAIN[k]}")
    mus += v * GAIN[k]
mus = highpass(mus, 28)
mus = room(mus, size=.8, mix=.3, damp=.6, seed=4)
o = int(OUT * SR); k = int(.12 * SR)                # hard out when they turn
mus[o - k:o] *= np.linspace(1, 0, k)[:, None]; mus[o:] = 0
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per 2 s dB:", " ".join(f"{b * 2}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * 2 * SR):int((b + 1) * 2 * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / 2) + 1)))
