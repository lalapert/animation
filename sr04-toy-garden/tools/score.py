"""Original score for STILL RECORDING tape 4 "Toy Garden": a music box that runs down, over the same drone.
The unresolved low drone of the series (E against F); a little music-box tune on the glockenspiel while the robot walks,
slowing and sagging in pitch as its spring runs down, gone when the key stops; a low piano cluster when the key stops
and when its eyes light; a high tremolo under "Wind me up."; everything cut when the shutter jumps. CC0 samples (VSCO 2 CE).
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
OUT = TL["SHUTTER"] - .1                      # everything is gone when the shutter jumps
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


# the drone: in from the first frame after the static, E against F, very low (as tape 1)
held(.7, OUT, "contrabass", "E1", .32, -.15)
held(1.9, OUT, "cellos", "F2", .22, .15, 3.8)
# the music box: an original little minor tune, slowing down and sagging in pitch until the key stops
MB = ["E5", "G5", "B5", "A5", "G5", "E5", "F#5", "D#5", "E5", "B4", "E5", "G5", "F#5", "E5", "D#5", "E5"]
t, i, gap = TL["WALK"][0] - .4, 0, .34
while t < TL["KEYSTOP"]:
    sag = -.6 * ((t - TL["WALK"][0]) / (TL["KEYSTOP"] - TL["WALK"][0])) ** 2
    USED.add("glockenspiel")
    add(stems["high"], note("glockenspiel", m(MB[i % len(MB)]) + sag, .5, .32, release=.8), t, .9, .25)
    t += gap; gap *= 1.035; i += 1
# a low piano cluster when the key stops, and again when the eyes light
for tt in [TL["KEYSTOP"], TL["EYES"]]:
    for k, n in enumerate(["A0", "Bb0", "E1"]): N(tt + k * .015, "upright", n, 2.6, .34, -.1 + .1 * k, 2.0, stem="hits")
# a high tremolo creeps in from "Nobody winds me anymore."
held(V["L2"]["t"], OUT, "violins_trem", "E6", .17, .3, 3.0, 1.0, "high")
held(TL["EYES"], OUT, "violins_trem", "F6", .18, -.3, 3.0, .6, "high")

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
