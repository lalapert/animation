"""Original score for Volt Labs 1 "Day One" (D minor, 132 BPM): the lab's own sound, a sneaky villain march.
Pizzicato bass and a staccato bassoon motif while Vera schemes; an organ stab on "Behold"; tremolo strings climbing
through the count, cut dead by the shot. Silence until the first pigeon falls in love, then the love theme in D major
(harp glissando, glockenspiel, pizzicato), a cheesy violin swell under "Stop looking at me like that", back to minor
for the rent, and a two-note bassoon button on the bottle cap. CC0 samples (VSCO 2 CE, VCSL).
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


# 0: the march starts with the first frame (the hook), under Vera's plan
sneak(0.0, V["L4"]["t"] - .05, .44)
# "Behold": organ stab + timpani, then the march again, softer
for k, n in enumerate(["D3", "F3", "A3", "D4"]): N(V["L4"]["t"] + .005 * k, "organ", n, 2.5, .55, -.2 + .13 * k, 1.0, stem="keys")
perc(V["L4"]["t"], "timpani", "drum1", .6)
sneak(V["L4"]["t"] + 2.5 * B, V["L6"]["t"], .32, motif=True)
# the count: tremolo violins climbing a semitone every half second, a timpani roll getting faster; nothing after the shot
FIRE = TL["FIRE"]
t, k = V["L6"]["t"], 0
while t < FIRE - .1:
    N(t, "violins_trem", ["A4", "Bb4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5"][min(k, 9)], 1.2, .3 + .04 * k, .25, .08, .05, stem="strings")
    t += .5; k += 1
tt, gap = V["L6"]["t"] + 1.0, .32
while tt < FIRE - .05:
    perc(tt, "timpani", "drum2", .25 + .3 * (tt - V["L6"]["t"]) / (FIRE - V["L6"]["t"])); tt += gap; gap = max(.07, gap * .86)
# the first pigeon falls in love: harp glissando up, the love theme on glockenspiel (D major)
love = TL["LAND"] + .75
gliss(love, ["D4", "F#4", "A4", "D5", "F#5", "A5", "D6"])
for k, (n, d) in enumerate([("F#5", 1), ("A5", 1), ("D6", 2)]): N(love + .35 + [0, 1, 2][k] * B, "glockenspiel", n, d, .4, .2, .8, stem="glock")
# the flood: two bouncy bars in D major, then a light pizzicato bed under "It's working" .. "Pigeons are creatures"
FL = TL["FLOOD"]
for i in range(8):
    tb = FL + i * B
    N(tb, "contrabass_pizz", ["D2", "A2", "F#2", "A2"][i % 4], .8, .5, -.1, .2, stem="bass")
    N(tb + .5 * B, "violins_pizz", ["D5", "F#5", "A5", "F#5"][i % 4], .4, .38, .2, .15, stem="strings")
    if i % 2 == 0: N(tb, "glockenspiel", ["A5", "D6", "F#6", "D6"][i // 2], 1, .34, .3, .6, stem="glock")
t, i = FL + 8 * B, 0
while t < V["L12"]["t"] - .1:
    N(t, "contrabass_pizz", ["D2", "A1", "G2", "A1"][i % 4], .8, .34, -.1, .2, stem="bass")
    if i % 2 == 1: N(t, "violins_pizz", ["F#4", "A4", "G4", "E4"][(i // 2) % 4], .4, .26, .2, .12, stem="strings")
    t += B; i += 1
# "Stop. Stop looking at me like that...": a cheesy violin swell; "Okay, one more minute." gets a harp sigh
s0 = V["L12"]["t"] + .1
for n in ["D4", "F#4", "A4", "D5"]: N(s0, "violins", n, 5.5, .32, .1, 1.0, 1.2, stem="strings")
okay = V["L12"]["t"] + 3.68
gliss(okay, ["A5", "F#5", "D5", "A4", "F#4", "D4"], .05, .36)
# the rent: back to the minor march under the board and "My army will handle it."; a small organ stab on "army"
sneak(TL["BOARDT"], TL["CAPT"] - .1, .34)
for k, n in enumerate(["D3", "F3", "A3"]): N(V["L14"]["t"] + .5, "organ", n, 1.5, .4, -.15 + .15 * k, .6, stem="keys")
# the cap lands in silence; after "That's a bottle cap." the bassoon button: two notes down, a soft timpani
bt = end("L15") + .25
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
# hard cut at the shot: nothing until the first pigeon
a, b = int((FIRE - .02) * SR), int((love - .05) * SR)
mus[a:b] = 0
endi = int((DUR - .05) * SR); mus[endi:] *= 0
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per 2 s dB:", " ".join(f"{b * 2}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * 2 * SR):int((b + 1) * 2 * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / 2) + 1)))
