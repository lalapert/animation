"""Original score for Void Mart 6 "Employee of the Month" (F major, 120 BPM): the show's jazzy bed.
MAGS's glockenspiel jingle on the wall of frames and on every MAGS boast; the bed under Pip's announcement; a double-time
restock run with a xylophone note per can; a smug trombone after "That's management."; snare rolls into the vote count and
the photo finish; a tuba for "Me."; a warm bed and the xylophone button at the end. CC0 samples (VSCO 2 CE, VCSL, FreePats).
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
stems = {k: buf(DUR + 4) for k in ["bass", "keys", "drums", "brass", "strings", "fx", "winds"]}
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
T = TL
def roll(t0, t1, v0=.15, v1=.45):
    """a snare roll that swells: 20 hits a second"""
    t = t0
    while t < t1 - .02:
        k = (t - t0) / max(.01, t1 - t0); perc(t, "snare", "on", v0 + (v1 - v0) * k, .1 * ((int(t * 20) % 2) * 2 - 1)); t += .05
def jingle(t):
    """MAGS's glockenspiel jingle"""
    for i, n in enumerate(["C5", "F5", "A5", "C6"]): N(t - .05 + i * .11, "glockenspiel", n, 1, .32, .1, .9)
# the wall of frames: MAGS's jingle on the reveal; the bed under Pip's announcement, stopped by "It's a CAMERA!"
jingle(.25)
bed0, bed_end = .9, V["L3"]["t"] - .05
walk(bed0, bed_end, ["F2", "A2", "C3", "A2", "Bb2", "D3", "C3", "A2"], .36)
brushes(bed0, bed_end, .2)
for i, ch in enumerate([FM7, BB7, C7]):
    if bed0 + BAR * i < bed_end - .3: vchord(bed0 + BAR * i, ch, 3, .2)
perc(T["ME"] + .1, "drum_kit", "crash_right", .3, .3)
# "A camera that never takes a break": the jingle
jingle(V["L4"]["t"])
# the restock run: double-time bass and brushes, a xylophone note up the scale for every can
r0, r1 = T["MONT0"] + .1, V["L5"]["t"] - .15
t, i = r0, 0
while t < r1:
    N(t, "contrabass_pizz", ["F2", "C3", "F3", "C3", "Bb2", "F3", "C3", "A2"][i % 8], .45, .4, -.1, .15, stem="bass")
    perc(t, "drum_kit", "hi_hat_closed", .2 if i % 2 else .14, .25)
    t += B * .5; i += 1
n_cans = int((1480 - 420) // 132); sps = (1480 - 420) / 132 / (T["RUN1"] - T["RUN0"])
scale = ["F4", "G4", "A4", "Bb4", "C5", "D5", "E5", "F5", "G5", "A5"]
for k in range(n_cans): N(T["RUN0"] + (k + 1) / sps, "xylophone", scale[k], .5, .34, -.2 + .05 * k, .3)
# "Great work, MAGS!": the jingle, a bright vibes chord
jingle(V["L5"]["t"]); vchord(V["L5"]["t"] + .5, FM7, 3, .22)
# "That's management.": a smug little trombone after the line
N(end("L7") + .05, "trombone", "C3", .6, .36, 0, .2, stem="winds"); N(end("L7") + .05 + .6 * B, "trombone", "F2", 1.4, .38, 0, .6, stem="winds")
# "The votes are in!": a snare roll into a trumpet stab on the count
roll(V["L8"]["t"] + .2, T["SCORE"], .1, .42)
for k, n in enumerate(["F4", "A4", "C5"]): N(T["SCORE"] + .005 * k, "trumpet_stac", n, .8, .45, -.15 + .15 * k, .3, stem="brass")
perc(T["SCORE"], "drum_kit", "crash_left", .3, -.3)
# "Me.": one low tuba note
N(end("L10") + .05, "tuba", "F1", 1.6, .42, 0, .6, stem="bass")
# Rae walks back: the walking bass, quiet, on her steps
walk(T["RAEB0"] + .1, T["SLIP"], ["F2", "G2", "A2", "C3"], .26)
# the ballot drops: a xylophone run up and a warm vibes chord
for i, n in enumerate(["C5", "F5", "A5", "C6"]): N(T["SLIP"] + .05 + i * .06, "xylophone", n, .5, .38, -.2 + i * .13, .3)
vchord(T["SLIP"] + .3, BB7, 3, .26)
# "A tie! Photo finish!": a roll into the flash
roll(V["L12"]["t"] + .3, T["FLASH"], .12, .5)
perc(T["FLASH"], "crash", "", .38)
# the photo: glockenspiel sparkle; then the bed, happy, and the button
for i, n in enumerate(["F5", "A5", "C6", "F6"]): N(T["DROP"] + .35 + i * .08, "glockenspiel", n, 1, .3, -.2 + i * .13, .9)
e0 = T["PHOTO1"] + .1; en = DUR - 1.7
walk(e0, en - .1, ["F2", "C3", "F3", "C3", "Bb2", "F3", "C3", "A2"], .38)
brushes(e0, en - .1, .24)
for i in range(3):
    if e0 + i * BAR < en - .4: vchord(e0 + i * BAR, [FM7, BB7, C7][i], 3, .24)
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
