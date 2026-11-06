"""Original score for "The Window Cat" (F major, 72 BPM, 14 bars). The cat has a four-note piano motif;
winter takes it to D minor and nearly to silence; the lamp brings it back.
Upright piano, nylon guitar, clarinet, viola and cello sections, glockenspiel, harp: CC0 samples (VSCO 2 CE, VCSL, FreePats).
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, note, m, lowpass, highpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
B, BAR, DUR = TL["BEAT"], TL["BAR"], TL["DUR"]
stems = {k: buf(DUR + 4) for k in ["piano", "guitar", "strings", "winds", "bells", "harp"]}
STEM = {"upright": "piano", "guitar_nylon": "guitar", "violas": "strings", "cellos": "strings", "clarinet": "winds", "glockenspiel": "bells", "harp": "harp"}
USED = set()


def bt(bar, beat=1.0):
    return (bar - 1) * BAR + (beat - 1) * B


def N(t, inst, name, beats, vel=.5, pan=0.0, release=None, attack=0.0):
    USED.add(inst)
    add(stems[STEM[inst]], note(inst, m(name), beats * B, vel, release=release, attack=attack), t, 1.0, pan)


def pno(bar, beat, n, beats, vel=.44, pan=-.1, rel=1.0):
    N(bt(bar, beat), "upright", n, beats, vel, pan, rel)


def lh(bar, notes, vel=.28):
    for i, n in enumerate(notes):
        pno(bar, 1 + i, n, 1.0 if i < 3 else 1.6, vel * (1 if i == 0 else .85), -.3, 1.0)


def gtr(bar, notes, vel=.32, pan=.3):
    for i, n in enumerate(notes):
        N(bt(bar, 1 + i * .5), "guitar_nylon", n, 1.5, vel * (1 if i % 4 == 0 else .82), pan + (i % 2) * .08, release=.8)


def pad(bar, beats, voicing, vel=.3, attack=.8):
    for k, n in enumerate(voicing):
        N(bt(bar), "cellos" if m(n) < 57 else "violas", n, beats, vel, -.3 + .3 * k, release=1.4, attack=attack)


def motif(bar, vel=.46):            # the cat: C5 A4 F4 G4
    pno(bar, 1, "C5", 1, vel); pno(bar, 2, "A4", 1, vel * .9); pno(bar, 3, "F4", 1, vel * .9); pno(bar, 4, "G4", 1.6, vel * .95)


F = ["F3", "C4", "F4", "A4", "C5", "A4", "F4", "C4"]; DM = ["D3", "A3", "D4", "F4", "A4", "F4", "D4", "A3"]
BB = ["A#2", "F3", "A#3", "D4", "F4", "D4", "A#3", "F3"]; C7 = ["C3", "G3", "C4", "E4", "G4", "E4", "A#3", "G3"]
# 1–2 the cat arrives; 3 the bowl
motif(1); lh(1, ["F2", "C3", "F3", "C3"])
pno(2, 1, "A4", 1.5, .42); pno(2, 2.5, "G4", .5, .36); pno(2, 3, "F4", 2, .4); lh(2, ["A#1", "F2", "A#2", "F2"])
gtr(2, F, .26); gtr(3, C7, .3); pno(3, 1, "E4", 2, .38); pno(3, 3, "G4", 2, .38)
# 4 spring
motif(4, .42); gtr(4, F, .3)
for i, n in enumerate(["C6", "F6", "A6"]):
    N(bt(4, 1 + i * 1.5), "glockenspiel", n, 1.5, .22, .3 - i * .2, release=1.6)
# 5–6½ summer rain
pad(5, 4, ["F3", "C4", "A4"], .3); gtr(5, DM, .26); pno(5, 1, "A4", 4, .3, 0, 1.6)
pad(6, 2, ["A#2", "F3", "D4"], .28); gtr(6, BB, .26)
# 6½–8 autumn: the clarinet, his hand on the cat
N(bt(6, 3), "clarinet", "C5", 1, .42, .2, .6, .04)
for b, n, d in [(7, "A4", 1.5), (7.375, "G4", .5), (7.5, "F4", 1), (7.75, "A4", 1), (8, "G4", 2)]:
    bar_ = int(b); beat_ = 1 + (b - bar_) * 4
    N(bt(bar_, beat_), "clarinet", n, d, .44, .2, .6, .04)
pad(7, 4, ["A#2", "F3", "D4"], .3); gtr(7, BB, .28); pno(7, 1, "D4", 2, .32); pno(7, 3, "F4", 2, .32)
# 8 winter: the motif in D minor, then almost nothing
pno(8, 2, "A4", 1, .38); pno(8, 3, "F4", 1, .34); pno(8, 4, "D4", 2.5, .34); lh(8, ["D2", "A2", "D3", "A2"], .22)
N(bt(9, 1), "cellos", "D3", 4, .2, -.2, 1.6, 1.2)
# 10½ the lamp comes on
N(TL["LAMP"], "glockenspiel", "A6", 2, .32, .1, release=2.5); N(TL["LAMP"] + .02, "harp", "F4", 2, .3, -.2, 2.0)
motif(11, .4); pad(11, 4, ["F3", "C4", "A4"], .26, 1.2); gtr(11, F, .24)
pno(12, 1, "A4", 1.5, .42); pno(12, 2.5, "G4", .5, .36); pno(12, 3, "C5", 2, .44); lh(12, ["A#1", "F2", "D3", "F3"])
pad(12, 4, ["A#2", "F3", "D4"], .3); gtr(12, BB, .28)
N(bt(12, 1), "clarinet", "D5", 2, .42, .2, .6, .06); N(bt(12, 3), "clarinet", "C5", 2, .4, .2, .6, .06)
# 13–14 inside, the title: the motif resolves, a harp roll into F
motif(13, .44); pad(13, 8, ["F3", "C4", "A4"], .3, 1.0); gtr(13, F, .26)
for i, n in enumerate(["F3", "C4", "F4", "A4", "C5", "F5"]):
    N(TL["TITLE"][0] + i * .08, "harp", n, 4, .32, -.3 + i * .12, release=2.5)
N(TL["TITLE"][0] + .5, "glockenspiel", "F6", 3, .22, 0, release=3.0)


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
f0 = int((DUR - 2.2) * SR); mus[f0:end] *= np.linspace(1, 0, end - f0)[:, None] ** 1.5
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("per bar dB:", " ".join(f"{b + 1}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * BAR * SR):int((b + 1) * BAR * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / BAR) + 1)))
