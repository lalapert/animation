"""Original score for Void Mart 1 "First Shift" (F major, 120 BPM): a jazzy sitcom bed that gets out of the way of the jokes.
Cosmic vibes shimmer on the void; a bass-and-brushes bump as Pip arrives; silence under "We hire someone new.";
tiptoe pizzicato for the peel; a store jingle under MAGS; silence before "Please see previous answer.";
a muted-trumpet droop on the frozen grin; low brass and timpani for the thing at the door; a xylophone button on the flip.
Contrabass pizzicato, vibraphone, glockenspiel, xylophone, violins pizzicato, muted trumpet, tuba, timpani, drum kit, triangle:
CC0 samples (VSCO 2 CE, VCSL, FreePats).
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
stems = {k: buf(DUR + 4) for k in ["bass", "keys", "drums", "brass", "strings", "fx"]}
USED = set()


def N(t, inst, name, beats, vel=.5, pan=0.0, release=None, attack=0.0, stem="keys"):
    USED.add(inst)
    add(stems[stem], note(inst, m(name), beats * B, vel, release=release, attack=attack), t, 1.0, pan)


_rr = {}
def perc(t, inst, var, vel=.5, pan=0.0, stem="drums"):
    """unpitched hit: pick a zone whose variant contains `var`, round-robin, no transposition"""
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


def walk(t0, t1, notes, vel=.5):
    """walking bass, one note per beat"""
    t, i = t0, 0
    while t < t1 - .05:
        N(t, "contrabass_pizz", notes[i % len(notes)], .9, vel * (1 if i % 4 == 0 else .85), -.1, .25, stem="bass"); t += B; i += 1


def brushes(t0, t1, vel=.3):
    t, i = t0, 0
    while t < t1 - .05:
        perc(t, "drum_kit", "hi_hat_closed", vel * (1 if i % 2 else .7), .25)
        if i % 4 in (1, 3): perc(t, "drum_kit", "snare_rest", vel * .8, .1)
        t += B; i += 1


def vchord(t, names, beats, vel=.36, inst="vibraphone"):
    for k, n in enumerate(names):
        N(t + k * .012, inst, n, beats, vel, -.25 + .17 * k, 1.2)


FM7, BB7, C7, DM7, GM7 = ["F3", "A3", "C4", "E4"], ["Bb3", "D4", "F4", "A4"], ["C3", "E3", "G3", "Bb3"], ["D3", "F3", "A3", "C4"], ["G3", "Bb3", "D4", "F4"]
# 0–2: the void. A bowed shimmer, then a pickup into Pip's entrance
vchord(0.05, ["F4", "A4", "C5", "E5"], 3.6, .34, "vibraphone_bowed")
N(0.1, "glockenspiel", "C6", 2, .2, .3, 2.0)
for k, n in enumerate(["C2", "D2", "E2"]): N(1.25 + k * B / 2, "contrabass_pizz", n, .45, .55, -.1, .2, stem="bass")
# 2–15: the bump, then a light bed under the first exchange
t0 = V["L1"]["t"]
perc(t0, "drum_kit", "kick_drum_left", .55); perc(t0, "drum_kit", "crash_right", .32, .3)
vchord(t0, FM7, 2, .42); N(t0, "xylophone", "F5", .5, .4, .2, .3); N(t0 + B * .5, "xylophone", "A5", .5, .36, .2, .3); N(t0 + B, "xylophone", "C6", 1, .38, .2, .5)
bed_end = V["L5"]["t"] - .15
walk(t0, bed_end, ["F2", "A2", "C3", "D3", "Bb2", "D3", "F3", "D3", "C3", "E3", "G3", "Bb2", "F2", "A2", "C3", "A2"], .42)
brushes(t0 + 2 * B, bed_end, .22)
for i, ch in enumerate([BB7, C7, FM7, DM7, GM7, C7]):
    tt = t0 + BAR * (i + 1)
    if tt < bed_end - .5: vchord(tt, ch, 3, .26)
# 15.2–17.3: "We hire someone new." Nothing.
# the peel: tiptoe pizzicato, falling
p0, p1 = TL["PEEL"]
for i, n in enumerate(["E5", "D5", "C5", "B4", "Bb4", "A4"]):
    N(p0 + (p1 - p0) * i / 5, "violins_pizz", n, .4, .42, .2 - i * .06, .2, stem="strings")
# MAGS: a store jingle, bright and corporate
mg = V["L6"]["t"]
for i, n in enumerate(["C5", "F5", "A5", "C6"]): N(mg - .05 + i * .11, "glockenspiel", n, 1, .3, .1, .9)
walk(mg + .5, end("L7") - .1, ["F2", "C3", "F2", "C3", "Bb2", "F2", "C3", "G2"], .36)
brushes(mg + .5, end("L7") - .1, .18)
for i, ch in enumerate([FM7, BB7, FM7, C7]):
    tt = mg + .5 + BAR * i
    if tt < end("L7") - .3: vchord(tt, ch, 3, .22)
# … pause, then "Please see previous answer." in silence
# the frozen grin: a muted-trumpet droop
f0 = TL["FREEZE"][0] + .25
for i, (n, bt) in enumerate([("Bb4", 1), ("A4", 1), ("Ab4", 1), ("G4", 3)]):
    N(f0 + i * B * 1.1, "trumpet_mute", n, bt, .5, .15, .4 if i < 3 else .8, stem="brass")
# the thing at the door: low brass, timpani
mo = TL["MONSTER"] + .25
perc(mo - .15, "timpani", "drum1", .7, 0, stem="fx"); perc(mo + .35, "timpani", "drum1", .55, 0, stem="fx")
N(mo, "tuba", "F1", 5, .55, -.1, 1.0, .15, stem="brass"); N(mo + .02, "contrabass", "Gb1", 5, .5, .1, 1.0, .3, stem="strings")
N(mo + .4, "violins_trem", "B5", 4, .2, .3, .8, .8, stem="strings") if "violins_trem" in audio.index() else None
# "Psst. Pip." a sneaky little figure
w0 = V["L11"]["t"]
for i, n in enumerate(["C5", "Db5", "C5", "B4", "C5"]):
    N(w0 + .3 + i * B * .5, "violins_pizz", n, .3, .3, .25, .15, stem="strings")
# the flip: a xylophone button
fl = TL["FLIP"]
for i, n in enumerate(["C5", "F5", "A5", "C6"]): N(fl + .05 + i * .07, "xylophone", n, .6 if i < 3 else 2, .46, -.2 + i * .13, .3 if i < 3 else 1.2)
vchord(fl + .33, ["F3", "A3", "C4", "F4"], 4, .34)
perc(fl + .33, "triangle", "open", .32, .3, stem="fx")
N(fl + .33, "contrabass_pizz", "F2", 2, .55, -.1, .6, stem="bass")


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
mus = room(mus, size=.35, mix=.18, damp=.55)
endi = int((DUR - .05) * SR); mus[endi:] *= 0
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per 2 s dB:", " ".join(f"{b * 2}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * 2 * SR):int((b + 1) * 2 * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / 2) + 1)))
