"""Original score for STILL RECORDING tape 6 "First Night": the series drone, a creeping tremolo, a cluster on each CAM 09 cut.
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
OUT = TL["END"] - .05                         # everything is gone at the static before the loop
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


# the drone from the first frame after the static, E against F, very low (the series' sound); quieter in the office
held(.6, OUT, "contrabass", "E1", .28, -.15)
held(8.6, OUT, "cellos", "F2", .2, .15, 3.8)
SH = {s[0]: s for s in TL["SHOTS"]}
# a high tremolo creeps in at the fitting rooms and rises a semitone when CAM 09 shows what is behind him
held(SH["fit"][1], SH["cctv1"][1] + .1, "violins_trem", "E6", .12, .3, 3.0, 1.6, "high")
held(SH["cctv1"][1], OUT, "violins_trem", "F6", .17, -.3, 3.0, .4, "high")
# a low piano cluster on each CAM 09 cut (the reveal, then again)
for k, t0 in enumerate([SH["cctv1"][1], SH["cctv2"][1]]):
    for j, n in enumerate(["A0", "Bb0", "E1"]): N(t0 + .02 + j * .015, "upright", n, 2.8, .3 + .08 * k, -.1 + .1 * j, 2.2, stem="hits")
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
