"""Original score for Void Mart 2 "Exact Change" (F major, 120 BPM): the show's jazzy bed, out of the way of the jokes.
A xylophone run and crash when the star hits; silence under "Your hair is on fire."; the MAGS jingle;
a falling trombone and timpani for the moon; a floating vibraphone arpeggio while things orbit; silence under "Expired.";
a xylophone button at the end. CC0 samples (VSCO 2 CE, VCSL, FreePats).
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
# 0: the star hits the counter: a bright xylophone run and a crash, then the bed comes in under the first exchange
st = TL["STAR"]
for i, n in enumerate(["F5", "A5", "C6", "F6"]): N(st - .12 + i * .04, "xylophone", n, .4, .42, .2, .3)
perc(st, "drum_kit", "crash_right", .3, .3); perc(st, "drum_kit", "kick_drum_left", .5)
bed_end = V["L5"]["t"] - .1
walk(V["L1"]["t"], bed_end, ["F2", "A2", "C3", "D3", "Bb2", "D3", "F3", "D3", "C3", "E3", "G3", "Bb2", "F2", "A2", "C3", "A2"], .4)
brushes(V["L1"]["t"] + 2 * B, bed_end, .22)
for i, ch in enumerate([FM7, BB7, C7, FM7, DM7]):
    tt = V["L1"]["t"] + BAR * i
    if tt < bed_end - .5: vchord(tt, ch, 3, .24)
# "Your hair is on fire." in silence; "Only a little!" gets a tiny pizzicato shrug
for i, n in enumerate(["G5", "E5"]): N(V["L6"]["t"] + .2 + i * .18, "violins_pizz", n, .3, .4, .2, .15, stem="strings")
# MAGS: the store jingle again (the show's sound for MAGS)
mg = V["L7"]["t"]
for i, n in enumerate(["C5", "F5", "A5", "C6"]): N(mg - .05 + i * .11, "glockenspiel", n, 1, .3, .1, .9)
walk(mg + .5, V["L8"]["t"] + 1.6, ["F2", "C3", "F2", "C3", "Bb2", "F2", "C3", "G2"], .34)
for i, ch in enumerate([FM7, BB7]): vchord(mg + .5 + BAR * i, ch, 3, .2)
# the moon: a falling trombone line, timpani on the impact, then a floating vibraphone arpeggio while things orbit
mo = TL["MOON"]
for i, n in enumerate(["F4", "Db4", "Bb3", "F3"]): N(mo - .6 + i * .12, "trombone", n, .5, .45, 0, .2, stem="brass")
perc(mo + .15, "timpani", "drum1", .8, 0, stem="fx"); perc(mo + .15, "drum_kit", "crash_right", .35, -.2)
N(mo + .15, "contrabass_pizz", "F1", 2, .6, 0, .8, stem="bass")
t = mo + 1.2
arp = ["C5", "E5", "G5", "Bb5", "G5", "E5"]
i = 0
while t < V["L11"]["t"] - .3:
    N(t, "vibraphone", arp[i % 6], .5, .24, .3 - (i % 6) * .1, .6); t += B / 2; i += 1
# "Expired." lands in silence; a sneaky pizzicato under "You didn't even look at it."
for i, n in enumerate(["C5", "Db5", "C5", "B4"]): N(V["L12"]["t"] + .1 + i * B * .5, "violins_pizz", n, .3, .28, .25, .15, stem="strings")
# button on "Everything here is expired." and the sip
en = V["L13"]["t"] + V["L13"]["dur"] + .2
for i, n in enumerate(["C5", "F5", "A5", "C6"]): N(en + i * .07, "xylophone", n, .6 if i < 3 else 2, .44, -.2 + i * .13, .3 if i < 3 else 1.2)
vchord(en + .28, ["F3", "A3", "C4", "F4"], 4, .32)
N(en + .28, "contrabass_pizz", "F2", 2, .55, -.1, .6, stem="bass")
perc(en + .28, "triangle", "open", .3, .3, stem="fx")


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
