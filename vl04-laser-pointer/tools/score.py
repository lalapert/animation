"""Original score for Volt Labs 4 "Laser Pointer" (D minor, 132 BPM): a doomsday reveal that ends in a cat toy.
Harp up the sheet; an organ chord and timpani on "Behold"; a glockenspiel data run under the spec scan with a horn stab on the verdict;
the villain march under the rent money; tremolo strings climbing with the charge, cut dead by the dot; tip-toe pizzicato for the cat at
the window: brass hits for the landlord, a tremolo heartbeat for the dot on his chest, a xylophone run as he flees; the two-note bassoon button on the fifth circle. CC0 samples (VSCO 2 CE, VCSL).
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
import numpy as np
import soundfile as sf
from fractions import Fraction
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio
from audio import SR, HERE, buf, add, note, m, lowpass, highpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
B, BAR, DUR = TL["BEAT"], TL["BAR"], TL["DUR"]
V = {v["id"]: v for v in TL["VO"]}
end = lambda k: V[k]["t"] + V[k]["dur"]
stems = {k: buf(DUR + 4) for k in ["bass", "winds", "keys", "strings", "glock", "perc"]}
USED = set()


def N(t, inst, name, beats, vel=.5, pan=0.0, release=None, attack=0.0, stem="winds"):
    USED.add(inst)
    add(stems[stem], note(inst, m(name), beats * B, vel, release=release, attack=attack), t, 1.0, pan)


_rr = {}
def perc(t, inst, var, vel=.5, pan=0.0, stem="perc"):
    USED.add(inst)
    Z = [z for z in audio.index()[inst]["zones"] if var in (z.get("var") or "")]
    k = _rr.get((inst, var), 0); _rr[(inst, var)] = k + 1
    z = Z[k % len(Z)]
    x, s = audio._sample(z["f"])
    x = x[z.get("on", 0):]
    if s != SR:
        fr = Fraction(SR, s).limit_denominator(1000)
        x = signal.resample_poly(x, fr.numerator, fr.denominator).astype(np.float32)
    x = x * (.12 / max(z.get("rms", .05), 1e-4)) * vel
    add(stems[stem], x[:int(2.5 * SR)], t, 1.0, pan)


def sneak(t0, t1, vel=.42, motif=True):
    """the villain march: pizzicato bass on every beat, the bassoon motif every second bar"""
    t, i = t0, 0
    line = ["D2", "A1", "D2", "A1", "Bb1", "F2", "A1", "E2"]
    while t < t1 - .05:
        N(t, "contrabass_pizz", line[i % 8], .9, vel * (1 if i % 2 == 0 else .8), -.1, .2, stem="bass")
        if motif and i % 8 == 0 and t + 4 * B < t1:
            for k, (n, d) in enumerate([("D3", .5), ("F3", .5), ("A3", .5), ("G#3", 1.5)]):
                N(t + B * [0, .5, 1, 1.5][k], "bassoon_stac", n, d, vel * .9, .15, .15)
        if motif and i % 8 == 4 and t + 4 * B < t1:
            for k, n in enumerate(["A3", "G3", "F3", "E3"]): N(t + k * .5 * B, "clarinet_stac", n, .45, vel * .6, -.2, .12)
        t += B; i += 1


def gliss(t, names, dt=.035, vel=.42, inst="harp", stem="glock"):
    for k, n in enumerate(names): N(t + k * dt, inst, n, 2, vel, -.3 + .6 * k / len(names), 1.2, stem=stem)


T = TL
# the sheet: harp up; "Behold": organ chord and timpani
gliss(0.02, ["D4", "F4", "A4", "D5", "F5", "A5", "D6"], .05, .38)
for k, n in enumerate(["D3", "F3", "A3", "D4"]): N(V["L1"]["t"] + .05 + .005 * k, "organ", n, 4, .55, -.2 + .13 * k, 1.2, stem="keys")
perc(V["L1"]["t"] + .05, "timpani", "drum1", .55)
# the spec scan: a glockenspiel data run, a horn stab on the verdict
h0 = T["HUD0"]
for i in range(22): N(h0 + .2 + i * .13, "glockenspiel", ["D6", "A5", "F6", "E6", "A6", "D6", "C6", "A5"][i % 8], .25, .18 + .006 * i, .3 * ((i % 2) * 2 - 1), .2, stem="glock")
for k, n in enumerate(["D3", "A3", "D4", "F4"]): N(h0 + 2.3 + .004 * k, "horn_stac", n, 1.2, .5, -.1 + .07 * k, .5, stem="winds")
# the rent money: the villain march, quiet
sneak(T["HUD1"] - .1, T["CHARGE"] - .1, .3)
# the charge: tremolo violins climbing, timpani roll; everything stops on the dot
t, k = T["CHARGE"], 0
while t < T["PEW"] - .05:
    N(t, "violins_trem", ["A4", "C5", "D#5", "F#5", "A5", "C6"][min(k, 5)], .5, .3 + .07 * k, .25, .05, .03, stem="strings")
    perc(t, "timpani", "drum1", .18 + .06 * k); perc(t + .14, "timpani", "drum1", .16 + .06 * k)
    t += .3; k += 1
# the landlord at the window: two low brass hits
for k, (n, dt) in enumerate([("D2", 0), ("D2", .45)]):
    N(T["KNOCK"] + .05 + dt, "tuba_stac", n, .5, .5, 0, .2, stem="bass"); N(T["KNOCK"] + .05 + dt, "horn_stac", "D3", .5, .38, .1, .2, stem="winds")
# the dot on his chest: tremolo strings and a timpani heartbeat
t = T["LOOK"]
while t < T["RUN"] - .1:
    perc(t, "timpani", "drum1", .22); t += .55
for k, n in enumerate(["D4", "Eb4"]): N(T["LOOK"] + .02, "violins_trem", n, 6, .22, -.1 + .2 * k, .3, stem="strings")
# he runs: a xylophone run down and away
for i, n in enumerate(["D6", "C#6", "A5", "G5", "F5", "E5", "D5", "C#5", "A4", "G4", "F4", "D4"]): N(T["RUN"] + .25 + i * .07, "xylophone", n, .25, .34, .3 - i * .05, .1, stem="glock")
# "It works!": a triumphant organ chord
for k, n in enumerate(["D3", "F#3", "A3", "D4"]): N(V["L8"]["t"] + .05 + .005 * k, "organ", n, 3, .5, -.2 + .13 * k, 1.0, stem="keys")
perc(V["L8"]["t"] + .05, "timpani", "drum1", .5)
# Cleo's pen laser: the tremolo comes back, small
for k, n in enumerate(["D4", "Eb4"]): N(T["PEN"] + .3, "violins_trem", n, 3, .16, -.1 + .2 * k, .3, stem="strings")
# the fifth circle: the bassoon button
bt = T["BOARDT"] + 1.5
N(bt, "bassoon", "A2", .9, .55, 0, .2)
N(bt + 1.0 * B, "bassoon", "D2", 2.2, .6, 0, .8)
N(bt + 1.0 * B, "contrabass_pizz", "D2", 2, .55, -.1, .6, stem="bass")
perc(bt + 1.0 * B, "timpani", "drum1", .35)


def active_rms(x):
    w = int(.1 * SR); n = len(x) // w
    e = np.sqrt((x[:n * w].reshape(n, w, 2) ** 2).mean((1, 2))); e = e[e > 1e-4]
    return float(np.sqrt((e ** 2).mean())) if len(e) else 0.0


GP = os.path.join(HERE, "tools", "score_gain.json")
GAIN = json.load(open(GP)) if os.path.exists(GP) else {}
mus = np.zeros_like(stems["bass"])
for k, v in stems.items():
    print(f"stem {k:8s} active rms {20 * np.log10(active_rms(v) + 1e-9):6.1f} dB  gain {GAIN.get(k, 1.0)}")
    mus += v * GAIN.get(k, 1.0)
mus = highpass(mus, 38)
mus = room(mus, size=.3, mix=.16, damp=.55)
# the dot: dead silence until the landlord knocks
a, b = int((TL["PEW"] - .02) * SR), int((TL["KNOCK"] + .02) * SR)
mus[a:b] = 0
endi = int((DUR - .05) * SR); mus[endi:] *= 0
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per 2 s dB:", " ".join(f"{b * 2}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * 2 * SR):int((b + 1) * 2 * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / 2) + 1)))
