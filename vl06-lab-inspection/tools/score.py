"""Original score for Volt Labs 6 "Lab Inspection": two themes that fight over the wall.\nThe bakery is a little accordion waltz in F; the lab is the villain march. Each time a panel flips back to the lab the march\nbursts in for the dash and the waltz comes back when the panel is slammed shut. Woodblock ticks for the beeping croissant,\na tuba for the gulp, a glockenspiel sparkle for "Five stars.", silence for "Can we bake?", the bassoon button on the hiccup.\nCC0 samples (VSCO 2 CE, VCSL).\n  .venv/bin/python tools/score.py            → out/music.wav
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
def waltz(t0, t1, vel=.3):
    """the bakery: a little accordion waltz in F, oom-pah-pah on the pizzicato bass"""
    t, i = t0, 0
    mel = ["A4", "C5", "F5", "E5", "D5", "C5", "Bb4", "A4", "G4", "Bb4", "D5", "C5"]
    chords = [["F3", "A3", "C4"], ["C3", "E3", "Bb3"], ["F3", "A3", "C4"], ["Bb2", "D3", "F3"]]
    while t < t1 - .1:
        bar = i // 3; beat = i % 3
        if beat == 0: N(t, "contrabass_pizz", ["F2", "C2", "F2", "Bb1"][bar % 4], .8, vel * 1.3, -.1, .2, stem="bass")
        else:
            for k, n in enumerate(chords[bar % 4]): N(t + .004 * k, "accordion", n, .5, vel * .55, -.15 + .1 * k, .15, stem="keys")
        N(t, "accordion", mel[i % 12], .9, vel * .8, .15, .25, stem="keys")
        t += B; i += 1
WB = 60 / 168                                   # the waltz is quicker than the march
# the knock: silence, then the slam: a harp sweep up, and the bakery waltz
gliss(T["SLAM"] + .05, ["F4", "A4", "C5", "F5", "A5", "C6", "F6"], .045, .4)
B_saved = B
def run_waltz(t0, t1):
    global B
    B = WB; waltz(t0, t1); B = B_saved
run_waltz(T["SLAM"] + .45, T["FLIPR"] - .02)
# a panel flips back: the villain march for the dash, then the waltz again when it is slammed shut
sneak(T["FLIPR"], T["SLAMR"] + .1, .44, motif=False)
run_waltz(T["SLAMR"] + .2, T["PICK"] - .05)
# the croissant beeps: a tick-tock on the woodblock; the gulp: one low tuba note
for i in range(5): perc(T["BEEPS"] + i * .34, "woodblock", "", .3, .2)
N(T["GULP"], "tuba", "F1", 1.2, .5, 0, .5, stem="bass")
sneak(T["FLIPL"], T["SLAML"] + .1, .48, motif=False)
run_waltz(T["SLAML"] + .25, T["WALKOUT"] + 1.2)
# "Five stars.": the stamp gets a glockenspiel sparkle
for i, n in enumerate(["F5", "A5", "C6", "F6"]): N(T["STAMP"] + .02 + i * .07, "glockenspiel", n, 1, .32, -.2 + .13 * i, .9, stem="glock")
# "Cleo. Can we bake?" in silence. The hiccup: the bassoon button
bt = T["HIC"] + .15
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
endi = int((DUR - .05) * SR); mus[endi:] *= 0
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per 2 s dB:", " ".join(f"{b * 2}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * 2 * SR):int((b + 1) * 2 * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / 2) + 1)))
