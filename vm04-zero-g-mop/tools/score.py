"""Original score for Void Mart 4 "Zero-G Mop" (F major, 120 BPM): the show's jazzy bed, floating.
The MAGS jingle on each announcement; the bed with a floating vibraphone arpeggio while nothing weighs anything; the
music stops on "Wait."; a timpani and a cymbal when gravity comes back; a xylophone button on the incident counter.
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
# the MAGS jingle on every announcement
for k in ["L1", "L8", "L13", "L10"]:
    mg = V[k]["t"]
    for i, n in enumerate(["C5", "F5", "A5", "C6"]): N(mg - .05 + i * .11, "glockenspiel", n, 1, .28 if k != "L1" else .32, .1, .9)
# the bed, floating: walking bass, brushes, chords, and a vibraphone arpeggio drifting over it, until "Wait."
bed0, bed_end = V["L1"]["t"] + .5, V["L14"]["t"] - .1
walk(bed0, bed_end, ["F2", "A2", "C3", "D3", "Bb2", "D3", "F3", "D3", "C3", "E3", "G3", "Bb2", "F2", "A2", "C3", "A2"], .34)
brushes(bed0 + 2 * B, bed_end, .18)
for i, ch in enumerate([FM7, BB7, C7, FM7, DM7, GM7, C7, FM7, BB7, C7, FM7, DM7, GM7, C7, FM7]):
    tt = bed0 + BAR * i
    if tt < bed_end - .5: vchord(tt, ch, 3, .18)
t, i = bed0, 0
arp = ["C5", "E5", "G5", "Bb5", "G5", "E5"]
while t < bed_end - .3:
    N(t, "vibraphone", arp[i % 6], .5, .2, .3 - (i % 6) * .1, .6); t += B / 2; i += 1
# gravity comes back: timpani and a cymbal; then silence for "One."
dr = TL["DROP"]
perc(dr + .4, "timpani", "drum1", .8, 0, stem="fx"); perc(dr + .4, "drum_kit", "crash_right", .35, -.2)
N(dr + .4, "contrabass_pizz", "F1", 2, .6, 0, .8, stem="bass")
# button on the incident counter
en = TL["FLIP"] + .15
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
