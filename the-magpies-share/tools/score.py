"""Original score for "The Magpie's Share" (D major pentatonic, 72 BPM, 15 bars).
Harp, kalimba, flute, string pads and pizzicato, glockenspiel, hand chimes: CC0 samples (VSCO 2 CE, VCSL, FreePats).
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, note, m, lowpass, highpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
B, BAR, DUR, MG = TL["BEAT"], TL["BAR"], TL["DUR"], TL["MAGPIE"]
stems = {k: buf(DUR + 4) for k in ["harp", "kalimba", "flute", "strings", "pizz", "bells"]}
STEM = {"harp": "harp", "kalimba": "kalimba", "flute": "flute", "violas": "strings", "cellos": "strings",
        "violins_pizz": "pizz", "cellos_pizz": "pizz", "glockenspiel": "bells", "hand_chimes": "bells"}
USED = set()


def bt(bar, beat=1.0):
    return (bar - 1) * BAR + (beat - 1) * B


def N(t, inst, name, beats, vel=.5, pan=0.0, release=None, attack=0.0):
    USED.add(inst)
    add(stems[STEM[inst]], note(inst, m(name), beats * B, vel, release=release, attack=attack), t, 1.0, pan)


def harp_arp(bar, notes, vel=.36, step=.5, pan=-.25):
    for i, n in enumerate(notes):
        N(bt(bar, 1 + i * step), "harp", n, 2.0, vel * (1 if i % 4 == 0 else .85), pan + (i % 3) * .1, release=1.2)


def pad(bar, beats, voicing, vel=.34, attack=.8):
    for k, n in enumerate(voicing):
        N(bt(bar), "cellos" if m(n) < 57 else "violas", n, beats, vel, -.3 + .3 * k, release=1.4, attack=attack)


def fl(bar, beat, n, beats, vel=.42):
    N(bt(bar, beat), "flute", n, beats, vel, .25, release=.5, attack=.08)


# 1: the first persimmon swings in
N(.05, "harp", "A4", 3, .4, 0, 2.0); N(bt(1, 3), "harp", "D5", 3, .36, .1, 2.0); N(bt(1, 4), "kalimba", "F#4", 2, .4, -.2, 1.5)
# 2: the eaves are painted
harp_arp(2, ["D3", "A3", "D4", "F#4", "A4", "F#4", "D4", "A3"], .32)
# 3–4: one kalimba note for each persimmon hung
KAL = ["D4", "E4", "F#4", "A4", "B4", "A4", "F#4", "E4", "D4", "E4", "F#4"]
for k, t in enumerate(TL["HANG"][1:]):
    N(t, "kalimba", KAL[k], 1.5, .44, -.3 + .3 * (k % 3), release=1.2)
N(bt(3), "harp", "D3", 8, .3, -.3, 2.0); N(bt(4, 3), "harp", "A2", 6, .28, -.3, 2.0)
# 5–7: the windy weeks; the flute sings
harp_arp(5, ["D3", "A3", "F#4", "A3", "D4", "A3", "F#4", "A3"], .3)
harp_arp(6, ["B2", "F#3", "D4", "F#3", "B3", "F#3", "D4", "F#3"], .3)
harp_arp(7, ["G2", "D3", "B3", "D3", "G3", "D3", "B3", "D3"], .3)
pad(5, 4, ["D3", "A3"], .3); pad(6, 4, ["B2", "F#3"], .3); pad(7, 4, ["G3", "D4"], .3)
fl(5, 1, "F#5", 2); fl(5, 3, "E5", 1); fl(5, 4, "D5", 1)
fl(6, 1, "B4", 2); fl(6, 3, "A4", 2)
fl(7, 1, "D5", 1.5); fl(7, 2.5, "E5", .5); fl(7, 3, "F#5", 2, .38)
# 8: near silence before the turn: one held note, then only wind
pad(8, 2, ["A3"], .24, .3)
# 9: the magpie: pizzicato on each peck, a flute run as it flies off
N(MG["peck"][0], "violins_pizz", "A4", .5, .5, .4); N(MG["peck"][1], "violins_pizz", "B4", .5, .5, .4)
N(MG["grab"], "violins_pizz", "D5", .5, .55, .3); N(MG["off"] + .05, "cellos_pizz", "D3", 1, .5, .2); N(MG["off"] + .08, "violins_pizz", "F#5", .5, .5, .2)
for i, n in enumerate(["A5", "F#5", "E5", "D5", "B4", "A4"]):
    fl(9, 2.5 + i * .5 + (MG["off"] - bt(9, 2.5)) / B, n, .5, .38)
# 10–12: the tree and its share: the theme comes back warm
harp_arp(10, ["G2", "D3", "B3", "D4", "G3", "D4", "B3", "D3"], .32)
harp_arp(11, ["F#2", "D3", "A3", "D4", "F#3", "D4", "A3", "D3"], .32)
harp_arp(12, ["E2", "B2", "G3", "B3", "A2", "E3", "A3", "C#4"], .3)
pad(10, 4, ["G3", "B3", "D4"], .32); pad(11, 4, ["F#3", "A3", "D4"], .32); pad(12, 4, ["E3", "G3", "B3"], .3)
fl(11, 1, "A4", 1, .38); fl(11, 2, "B4", 1, .38); fl(11, 3, "D5", 1, .4); fl(11, 4, "E5", 1, .38); fl(12, 1, "D5", 3.5, .4)
for k, t in enumerate([bt(10, 1), bt(10, 3), bt(11, 1)]):
    N(t + .02, "kalimba", ["A4", "F#4", "D4"][k], 1.5, .32, -.4, release=1.0)
# 13–14: first snow: bells, the last flute phrase
pad(13, 8, ["D3", "A3", "F#4"], .28, 1.2)
harp_arp(13, ["D3", "A3", "D4", "A3"], .28, step=1)
harp_arp(14, ["G2", "D3", "B3", "D3"], .26, step=1)
for i, (b, n) in enumerate([(13, "D6"), (13.5, "A6"), (14, "F#6"), (14.5, "B6")]):
    N(bt(int(b), 1 + (b % 1) * 4), "glockenspiel", n, 2, .24, -.2 + .15 * i, release=2.0)
fl(13, 1, "F#5", 2, .36); fl(13, 3, "E5", 2, .34); fl(14, 1, "D5", 2.5, .34)
# the title: a harp roll into D, a chime, and let it ring
for i, n in enumerate(["D3", "A3", "D4", "F#4", "A4", "D5"]):
    N(TL["TITLE"][0] + i * .08, "harp", n, 4, .36, -.3 + i * .12, release=2.5)
N(TL["TITLE"][0] + .5, "hand_chimes", "D6", 3, .26, 0, release=3.0)


def active_rms(x):
    w = int(.1 * SR); n = len(x) // w
    e = np.sqrt((x[:n * w].reshape(n, w, 2) ** 2).mean((1, 2))); e = e[e > 1e-4]
    return float(np.sqrt((e ** 2).mean())) if len(e) else 0.0


GAIN = json.load(open(os.path.join(HERE, "tools", "score_gain.json"))) if os.path.exists(os.path.join(HERE, "tools", "score_gain.json")) else {}
mus = np.zeros_like(stems["harp"])
for k, v in stems.items():
    print(f"stem {k:8s} active rms {20 * np.log10(active_rms(v) + 1e-9):6.1f} dB  gain {GAIN.get(k, 1.0)}")
    mus += v * GAIN.get(k, 1.0)
mus = highpass(mus, 45)
mus = room(mus, size=.55, mix=.24, damp=.55)
end = int((DUR - .15) * SR); mus[end:] *= 0
f0 = int((DUR - 2.0) * SR); mus[f0:end] *= np.linspace(1, 0, end - f0)[:, None] ** 1.5
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
BARS = " ".join(f"{b + 1}:{20 * np.log10(np.sqrt(np.mean(mus[int(b * BAR * SR):int((b + 1) * BAR * SR)] ** 2)) + 1e-12):.0f}" for b in range(int(DUR / BAR) + 1))
print("music.wav", round(len(mus) / SR, 2), "s · per bar dB:", BARS)
