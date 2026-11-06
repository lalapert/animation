"""Original score for "A Year on the Sill" (D major, 72 BPM, 4/4), from the cue map in TREATMENT.md section 9.
Instruments: upright piano (softened into a felt-like tone), nylon guitar, clarinet, string sections, harp,
glockenspiel, hand chimes: all CC0 samples (VSCO 2 CE, VCSL, FreePats).
  .venv/bin/python tools/score.py            → out/music.wav
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE, buf, add, note, m, lowpass, highpass, room, rms

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
EV = json.load(open(os.path.join(HERE, "out", "events.json")))["EV"]
B, BAR, DUR = TL["BEAT"], TL["BAR"], TL["DUR"]


def bt(bar, beat=1.0):
    return (bar - 1) * BAR + (beat - 1) * B


stems = {k: buf(DUR + 4) for k in ["piano", "guitar", "strings", "winds", "bells", "harp"]}
STEM = {"upright": "piano", "guitar_nylon": "guitar", "violas": "strings", "cellos": "strings", "violins": "strings",
        "clarinet": "winds", "glockenspiel": "bells", "hand_chimes": "bells", "harp": "harp"}
USED = set()


def N(t, inst, name, beats, vel=.5, pan=0.0, release=None, attack=0.0):
    USED.add(inst)
    x = note(inst, m(name) if isinstance(name, str) else name, beats * B, vel, release=release, attack=attack)
    add(stems[STEM[inst]], x, t, 1.0, pan)


def piano(bar, beat, name, beats, vel=.45, pan=-.15, release=.9):
    N(bt(bar, beat), "upright", name, beats, vel, pan, release)


def lh(bar, notes, vel=.32, pan=-.3):
    """left-hand quarter-note pattern for one bar"""
    for i, n in enumerate(notes):
        piano(bar, 1 + i, n, 1.0 if i < len(notes) - 1 else 1.6, vel * (1 if i == 0 else .85), pan, 1.0)


def guitar_bar(bar, notes, vel=.38, pan=.3, half=False):
    """eighth-note arpeggio for one bar (or a half bar from beat 1/3)"""
    for i, n in enumerate(notes):
        N(bt(bar, 1 + i * .5), "guitar_nylon", n, 1.5, vel * (1.0 if i % 4 == 0 else .82), pan + (i % 2) * .08, release=.8)


def pad(bar, beats, voicing, vel=.4, attack=.6):
    for k, n in enumerate(voicing):
        inst = "cellos" if m(n) < 57 else "violas" if m(n) < 72 else "violins"
        N(bt(bar), inst, n, beats, vel, -.35 + .35 * k, release=1.4, attack=attack)


# ---------------------------------------------------------------- 1–2 hook: one note as the pigment blooms
piano(1, 1, "A4", 3, .42, 0, 2.0)
piano(1, 1, "D3", 4, .26, -.3, 2.0)
piano(1, 3, "F#4", 2, .32, .1, 1.6)
piano(2, 1, "E4", 2, .36, 0, 1.6)
N(bt(2, 1), "upright", "A3", 4, .22, -.3, 2.0)
piano(2, 3, "D4", 3, .30, 0, 2.2)

# ---------------------------------------------------------------- 3–4 January: the motif
piano(3, 1, "F#4", 1.5, .48); piano(3, 2.5, "E4", .5, .38); piano(3, 3, "D4", 2, .44)
lh(3, ["D3", "A3", "D4", "A3"], .28)
piano(4, 1, "E4", 1.5, .46); piano(4, 2.5, "C#4", .5, .36); piano(4, 3, "A3", 2, .42)
lh(4, ["A2", "E3", "A3", "E3"], .28)

# ---------------------------------------------------------------- 5–6 March: waking, glockenspiel buds
piano(5, 1, "D4", 1, .42); piano(5, 2, "F#4", 1, .4); piano(5, 3, "B4", 2, .46)
lh(5, ["B2", "F#3", "B3", "F#3"])
piano(6, 1, "A4", 1.5, .44); piano(6, 2.5, "G4", .5, .36); piano(6, 3, "D4", 2, .42)
lh(6, ["G2", "D3", "G3", "D3"])
BUDN = {5: ["B5", "D6", "F#6", "B6", "A6", "F#6"], 6: ["G6", "B6", "D7", "B6", "G6", "D6"]}
for k, e in enumerate([e for e in EV if e["type"] == "bud"]):
    bar = 5 if e["t"] < bt(6) else 6
    N(e["t"], "glockenspiel", BUDN[bar][k % 6], 1.0, .22 + .06 * (k % 3), e.get("pan", 0) * .6, release=1.2)

# ---------------------------------------------------------------- 7–9 April: guitar enters, the burst
guitar_bar(7, ["D3", "A3", "D4", "F#4", "A4", "F#4", "D4", "A3"])
piano(7, 1, "F#4", 2, .4); piano(7, 3, "A4", 2, .42)
pad(7, 4, ["D3", "A3"], .3, 1.2)
# harp glissando landing on the burst downbeat
gl = ["D4", "E4", "F#4", "A4", "B4", "D5", "E5", "F#5", "A5"]
for i, n in enumerate(gl):
    N(TL["BURST"] - (len(gl) - i) * .055, "harp", n, 1.5, .34 + i * .025, -.4 + i * .1, release=1.6)
for n in ["D6", "F#6", "A6"]:
    N(TL["BURST"], "glockenspiel", n, 2, .32, .2, release=2.0)
N(TL["BURST"], "hand_chimes", "A5", 2, .4, -.2, release=2.5)
guitar_bar(8, ["A2", "E3", "A3", "C#4", "E4", "C#4", "A3", "E3"], .5)
piano(8, 1, "E5", 2, .52, 0); piano(8, 3, "C#5", 2, .46, 0)
pad(8, 4, ["E3", "A3", "C#4", "A4"], .56, .5)
guitar_bar(9, ["B2", "F#3", "B3", "D4", "G2", "D3", "G3", "B3"], .4)
piano(9, 1, "D5", 1, .42); piano(9, 2, "B4", 1, .38); piano(9, 3, "B4", 1, .4); piano(9, 4, "A4", 1, .36)
pad(9, 2, ["F#3", "B3", "D4"], .38, .4)
pad(9 + .5, 2, ["G3", "B3", "D4"], .36, .4)

# ---------------------------------------------------------------- 10–11 May: strings go, petals fall
guitar_bar(10, ["E3", "B3", "D4", "G4", "B4", "G4", "D4", "B3"], .34)
piano(10, 1, "G4", 2, .4); piano(10, 3, "F#4", 1, .36); piano(10, 4, "E4", 1, .34)
for i, n in enumerate(["A5", "F#5", "D5", "A4"]):
    N(TL["PETALS"][0] + .2 + i * .32, "harp", n, 1.5, .2, .35 - i * .1, release=1.4)
guitar_bar(11, ["A2", "E3", "A3", "D4", "A2", "E3", "A3", "C#4"], .32)
piano(11, 1, "E4", 2, .38); piano(11, 3, "D4", 1, .34); piano(11, 4, "C#4", 1.2, .32, release=1.4)
# bar 12: music out. Silence 1 (voice and room only) until the first fruit lands

# ---------------------------------------------------------------- 15.3 one piano note comes back
piano(15, 3, "F#4", 6, .34, 0, 3.0)
N(bt(15, 3), "upright", "D3", 6, .18, -.3, 3.0)

# ---------------------------------------------------------------- 16–18 July–August: rain, then warmth
pad(16, 4, ["G3", "D4", "B4"], .3, 1.6)
pad(17, 4, ["F#3", "A3", "D4"], .32, .8)
guitar_bar(17, ["D3", "A3", "D4", "F#4", "A4", "F#4", "D4", "A3"], .3)
pad(18, 2, ["E3", "G3", "B3"], .32, .5)
pad(18.5, 2, ["E3", "A3", "C#4"], .32, .5)
guitar_bar(18, ["E3", "B3", "E4", "G4", "A2", "E3", "A3", "C#4"], .3)
piano(16, 1, "B4", 2, .3, 0, 1.6); piano(16, 3, "A4", 2, .28)
piano(17, 1, "F#4", 4, .3, 0, 2.0)

# ---------------------------------------------------------------- 19–22 September–November: clarinet melody, glazes on downbeats
def clar(bar, beat, n, beats, vel=.42):
    N(bt(bar, beat), "clarinet", n, beats, vel, .2, release=.6, attack=.04)


def chord(bar, beat, notes, beats, vel=.3):
    for k, n in enumerate(notes):
        piano(bar, beat, n, beats, vel * (1.1 if k == 0 else .9), -.3 + .2 * k, 1.2)


clar(19, 1, "B4", 1); clar(19, 2, "A4", 1); clar(19, 3, "F#4", 2)
chord(19, 1, ["G2", "D3", "B3", "D4"], 2); chord(19, 3, ["G2", "B3", "D4"], 2)
clar(20, 1, "A4", 1.5); clar(20, 2.5, "D5", .5); clar(20, 3, "C#5", 2)
chord(20, 1, ["F#2", "D3", "A3", "D4"], 2); chord(20, 3, ["A2", "E3", "A3", "C#4"], 2)
clar(21, 1, "B4", 1); clar(21, 2, "A4", 1); clar(21, 3, "G4", 1); clar(21, 4, "E4", 1)
chord(21, 1, ["E2", "B2", "G3", "D4"], 2); chord(21, 3, ["E2", "B2", "G3", "B3"], 2)
clar(22, 1, "F#4", 3, .46); clar(22, 4, "E4", 1.2, .4)
chord(22, 1, ["A2", "E3", "A3", "D4"], 2, .28); chord(22, 3, ["A2", "E3", "G3", "C#4"], 2, .26)
for b in (19, 20, 21, 22):
    guitar_bar(b, {19: ["G3", "D4", "G4", "D4"], 20: ["F#3", "D4", "A4", "D4"], 21: ["E3", "B3", "G4", "B3"], 22: ["A3", "E4", "A4", "E4"]}[b] * 2, .24, .4)
pad(20, 4, ["D4", "F#4"], .22, 1.0)
pad(21, 4, ["E3", "B3"], .22, 1.0)

# ---------------------------------------------------------------- 23–25 the tea: near silence, then the motif resolved
piano(24, 1, "F#4", 1.5, .44, 0, 1.4); piano(24, 2.5, "E4", .5, .34); piano(24, 3, "D4", 2, .42, 0, 1.6)
lh(24, ["D3", "A3", "D4", "A3"], .28)
piano(25, 1, "E4", 1, .38); piano(25, 2, "F#4", 1, .38); piano(25, 3, "A4", 2, .42, 0, 1.8)
lh(25, ["G2", "D3", "G3", "B3"], .26)
N(TL["NEWBUD"], "glockenspiel", "A6", 2, .3, -.2, release=2.5)
N(TL["NEWBUD"] + .02, "hand_chimes", "D6", 2, .22, .2, release=2.5)

# ---------------------------------------------------------------- 26–27 the page turns; the title
for k, n in enumerate(["D3", "A3", "E4", "F#4", "A4"]):
    N(bt(26) + k * .03, "upright", n, 6, .34 if k else .3, -.3 + .15 * k, release=3.0)
pad(26, 6, ["D3", "A3", "F#4"], .26, 1.5)
for i, n in enumerate(["D4", "F#4", "A4", "D5", "E5", "F#5"]):
    N(TL["TITLE"][0] + i * .09, "harp", n, 3, .3, -.3 + i * .12, release=2.5)
N(TL["TITLE"][0] + .55, "hand_chimes", "D6", 3, .24, 0, release=3.0)

# ---------------------------------------------------------------- mixdown of the score
def active_rms(x):
    w = int(.1 * SR); n = len(x) // w
    e = np.sqrt((x[:n * w].reshape(n, w, 2) ** 2).mean((1, 2)))
    e = e[e > 1e-4]
    return float(np.sqrt((e ** 2).mean())) if len(e) else 0.0


for k, v in stems.items():
    print(f"stem {k:8s} active rms {20 * np.log10(active_rms(v) + 1e-9):6.1f} dB")
piano = lowpass(stems["piano"], 3800)            # felt-piano softness
# balance (measured active RMS → piano lead −30, clarinet −31, guitar −34, harp −34, strings −36, bells −36 dB)
mus = piano * 6.8 + stems["guitar"] * 2.0 + stems["strings"] * .62 + stems["winds"] * .6 + stems["bells"] * .84 + stems["harp"] * .35
mus = highpass(mus, 45)
mus = room(mus, size=.55, mix=.24, damp=.55)
end = int((DUR - .2) * SR)
mus[end:] *= 0
f0 = int((DUR - 2.4) * SR)
mus[f0:end] *= np.linspace(1, 0, end - f0)[:, None] ** 1.5
mus = mus[:int(DUR * SR)]
mus *= .5 / (np.abs(mus).max() + 1e-9)
sf.write(os.path.join(HERE, "out", "music.wav"), mus, SR, subtype="FLOAT")
json.dump(sorted(USED), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("music.wav", round(len(mus) / SR, 2), "s, rms", round(rms(mus), 4), "instruments:", sorted(USED))
