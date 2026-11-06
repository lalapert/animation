"""Original score for "The Last Leaf" (G major, 72 BPM, 14 bars). A falling three-note figure (B–A–G) is the leaf;
day 3 is near silence; the fall is a slow descending harp line; the book closes on G.
Upright piano, harp, flute, viola and cello sections, glockenspiel, nylon guitar: CC0 samples (VSCO 2 CE, VCSL, FreePats).
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, note, m, lowpass, highpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
B, BAR, DUR = TL["BEAT"], TL["BAR"], TL["DUR"]
stems = {k: buf(DUR + 4) for k in ["piano", "harp", "flute", "strings", "bells", "guitar"]}
STEM = {"upright": "piano", "harp": "harp", "flute": "flute", "violas": "strings", "cellos": "strings", "glockenspiel": "bells", "guitar_nylon": "guitar"}
USED = set()


def bt(bar, beat=1.0):
    return (bar - 1) * BAR + (beat - 1) * B


def N(t, inst, name, beats, vel=.5, pan=0.0, release=None, attack=0.0):
    USED.add(inst)
    add(stems[STEM[inst]], note(inst, m(name), beats * B, vel, release=release, attack=attack), t, 1.0, pan)


def pno(bar, beat, n, beats, vel=.44, pan=-.1, rel=1.2):
    N(bt(bar, beat), "upright", n, beats, vel, pan, rel)


def leaf(bar, vel=.46, octave=4):         # the leaf: B A G, falling
    for i, n in enumerate(["B", "A", "G"]):
        pno(bar, 1 + i, f"{n}{octave}", 1 if i < 2 else 2, vel * (1 - i * .06))


def gtr(bar, notes, vel=.28):
    for i, n in enumerate(notes):
        N(bt(bar, 1 + i * .5), "guitar_nylon", n, 1.5, vel * (1 if i % 4 == 0 else .82), .3 + (i % 2) * .08, release=.8)


def pad(bar, beats, voicing, vel=.28, attack=.9):
    for k, n in enumerate(voicing):
        N(bt(bar), "cellos" if m(n) < 57 else "violas", n, beats, vel, -.3 + .3 * k, release=1.4, attack=attack)


G = ["G2", "D3", "G3", "B3", "D4", "B3", "G3", "D3"]; EM = ["E2", "B2", "E3", "G3", "B3", "G3", "E3", "B2"]
C = ["C3", "G3", "C4", "E4", "G4", "E4", "C4", "G3"]; D = ["D3", "A3", "D4", "F#4", "A4", "F#4", "D4", "A3"]
# 1–2 the lone leaf; the tree is painted
leaf(1, .44, 5); pno(1, 1, "G3", 4, .24, -.3, 2.0)
pad(2, 4, ["G3", "D4"], .24, 1.4); pno(2, 1, "D5", 2, .36); pno(2, 3, "B4", 2, .34)
# 2½–4 day 1: she walks in; the wind
gtr(3, G); leaf(3, .42); gtr(4, EM); pno(4, 1, "E4", 2, .36); pno(4, 3, "G4", 2, .36)
N(TL["GUST"][0], "flute", "B4", 3, .36, .3, .6, .3); N(TL["GUST"][0] + 2.4, "flute", "A4", 2, .32, .3, .6, .2)
# 4–5½ day 2: rain
pad(4.6, 4, ["E3", "B3", "G4"], .26); gtr(5, C, .26); leaf(5, .38)
pad(5.6, 4, ["C3", "G3", "E4"], .26)
# 6 "it held on": one warm chord
for k, n in enumerate(["G3", "D4", "G4", "B4"]):
    N(TL["VO"][3]["t"] + k * .04, "harp", n, 3, .3, -.2 + k * .12, 1.6)
# 6¼–7 day 3: still and cold: almost nothing
N(bt(7), "violas", "D4", 4, .16, .1, 1.6, 1.6)
# the fall: a slow descending harp line, one note per beat, landing in her hands
fall = ["D6", "B5", "A5", "G5", "E5", "D5", "B4", "A4", "G4"]
f0, f1 = TL["FALL"]
for i, n in enumerate(fall):
    N(f0 + (f1 - f0) * i / (len(fall) - 1), "harp", n, 2, .32 + .02 * i, .4 - i * .09, 1.8)
N(TL["CATCH"], "glockenspiel", "G6", 2, .34, 0, 2.5)
pad(9, 8, ["G3", "D4", "B4"], .3, 1.0); leaf(9, .4); pno(10, 1, "C5", 2, .38); pno(10, 3, "B4", 2, .36)
# the book: guitar and piano, the leaf figure resolved
gtr(11, C, .26); leaf(11, .4); gtr(12, D, .26); pno(12, 1, "A4", 2, .36); pno(12, 3, "F#4", 2, .34)
pad(12, 4, ["D3", "A3", "F#4"], .26)
gtr(13, G, .26); leaf(13, .42); pad(13, 8, ["G3", "D4", "B4"], .28, 1.2)
for i, n in enumerate(["G3", "D4", "G4", "B4", "D5", "G5"]):
    N(TL["TITLE"][0] + i * .08, "harp", n, 4, .32, -.3 + i * .12, release=2.5)
N(TL["TITLE"][0] + .5, "glockenspiel", "D6", 3, .22, 0, release=3.0)


def active_rms(x):
    w = int(.1 * SR); n = len(x) // w
    e = np.sqrt((x[:n * w].reshape(n, w, 2) ** 2).mean((1, 2))); e = e[e > 1e-4]
    return float(np.sqrt((e ** 2).mean())) if len(e) else 0.0


GP = os.path.join(HERE, "tools", "score_gain.json")
GAIN = json.load(open(GP)) if os.path.exists(GP) else {}
mus = np.zeros_like(stems["piano"])
for k, v in stems.items():
    print(f"stem {k:8s} active rms {20 * np.log10(active_rms(v) + 1e-9):6.1f} dB  gain {GAIN.get(k, 1.0)}")
    mus += (lowpass(v, 3800) if k == "piano" else v) * GAIN.get(k, 1.0)
mus = highpass(mus, 45)
mus = room(mus, size=.55, mix=.24, damp=.55)
end = int((DUR - .15) * SR); mus[end:] *= 0
f0_ = int((DUR - 2.2) * SR); mus[f0_:end] *= np.linspace(1, 0, end - f0_)[:, None] ** 1.5
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per bar dB:", " ".join(f"{b + 1}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * BAR * SR):int((b + 1) * BAR * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / BAR) + 1)))
