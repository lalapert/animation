"""Original score for Volt Labs 2 "The Obedience Ray" (D minor, 132 BPM): the lab's villain march, then manners.
The march under the plan; an organ stab on "The Obedience Ray"; a short tremolo climb through the countdown, cut dead by
the shot. Then the street answers with a dainty harpsichord minuet (D major, 3/4) under all the "after you"s and the
tea; a cheesy violin swell when the kindness gets to Vera; silence for the knock; a two-note bassoon button and the chalk.
CC0 samples (VSCO 2 CE, VCSL).
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


# 0: the march starts with the first frame, under Vera's plan
sneak(0.0, V["L3"]["t"] - .05, .44)
for k, n in enumerate(["D3", "F3", "A3", "D4"]): N(V["L3"]["t"] + .005 * k, "organ", n, 2.5, .55, -.2 + .13 * k, 1.0, stem="keys")
perc(V["L3"]["t"], "timpani", "drum1", .6)
sneak(V["L3"]["t"] + 2.5 * B, V["L4"]["t"], .3)
# the countdown: tremolo violins climbing, a timpani roll; nothing after the shot
FIRE = TL["FIRE"]
t, k = V["L4"]["t"], 0
while t < FIRE - .1:
    N(t, "violins_trem", ["A4", "C5", "D#5", "F#5", "A5", "C6"][min(k, 5)], .9, .32 + .05 * k, .25, .08, .05, stem="strings")
    t += .45; k += 1
tt, gap = V["L4"]["t"] + .2, .3
while tt < FIRE - .05:
    perc(tt, "timpani", "drum2", .3 + .3 * (tt - V["L4"]["t"]) / (FIRE - V["L4"]["t"])); tt += gap; gap = max(.07, gap * .82)
# the street: a dainty harpsichord minuet in D major (3/4) under the manners, until Vera can't take it
m0, m1 = TL["BUMP"] - .2, V["L11"]["t"] - .1
MEL = ["F#5", "G5", "A5", "D5", "E5", "F#5", "G5", "A5", "B5", "A5", "G5", "F#5", "E5", "F#5", "G5", "F#5", "E5", "D5"]
BAS = ["D3", "A2", "G2", "A2", "D3", "A2"]
bt, i = m0, 0
while bt < m1 - .2:
    N(bt, "harpsichord", MEL[i % len(MEL)], .9, .34, .2, .25)
    if i % 3 == 0: N(bt, "harpsichord", BAS[(i // 3) % len(BAS)], 2.7, .3, -.2, .4)
    bt += B; i += 1
# "Stop being nice to me!" .. "You're doing a wonderful job, love.": a cheesy violin swell and a harp sigh
s0 = V["L11"]["t"]
for n in ["D4", "F#4", "A4", "D5"]: N(s0, "violins", n, 7.5, .3, .1, 1.0, 1.2, stem="strings")
gliss(V["L12"]["t"] + 1.0, ["A5", "F#5", "D5", "A4", "F#4", "D4"], .05, .36)
# the knock and the landlord in silence; "Leave it on." gets the bassoon button, then the chalk
bt = V["L14"]["t"] + V["L14"]["dur"] + .2
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
# hard cut at the shot: nothing until the two passers-by
a, b = int((FIRE - .02) * SR), int((TL["BUMP"] - .25) * SR)
mus[a:b] = 0
endi = int((DUR - .05) * SR); mus[endi:] *= 0
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per 2 s dB:", " ".join(f"{b * 2}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * 2 * SR):int((b + 1) * 2 * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / 2) + 1)))
