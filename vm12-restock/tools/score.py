"""Score for Void Mart 12 "Restock" (natural-sound rules, 11/13): the house trio (tools/band.py), F major.
  - frame 1, the stripped aisle: a tired two-feel with soft brushes under "They took... everything."; out before the can drops
    off the shelf, so the clank and "We don't even have a sale." play dry
  - "Restock... after a nap.": a lullaby of slow vibraphone chords (motor on) under the nap and the clock racing to seven;
    MAGS's glockenspiel jingle is the store's seven o'clock chime
  - the restocked aisle: a bright chord and a happy walk under "The shelves! They're full!", Pip's hop and Rae's walk; out
    before "Every label... faces front."
  - dry: "Pip. Did you restock in your sleep?"; a twinkle of vibes under "No... it was magic!"; MAGS's jingle before "You're
    welcome!"; dry through "You don't have hands." and "...Details."
  - "Thank you, whoever you are!": one warm chord, then silence for the stockroom door (room tone only); after "...They're
    shy." the button (the only hit) lands on a darker chord, ringing into the held tail: the mystery is open
CC0 samples (VSCO 2 CE, VCSL, FreePats).
  .venv/bin/python tools/score.py            -> out/music.wav, out/score.json
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, HERE
from band import Band

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
DUR = TL["DUR"]
V = {v["id"]: v for v in TL["VO"]}
end = lambda k: V[k]["t"] + V[k]["dur"]
b = Band(DUR, seed=12, bpm=120)

# 1. the stripped aisle: tired two-feel, out before the can drops
s1, e1 = .05, TL["CANFALL"] - .12
b.prev_bass = 38
b.chord_hit(s1, "Dm9", 2.4, .26, roll=.04, release=.5)
b.two(.4, e1, ["Dm7", "G7"], vel=.36, skip=.1)
b.brushes(.4, e1, vel=.24, slap=False, fade_in=.4, fade_out=.04)
b.set_motor(s1, e1, .14)

# 2. the nap: lullaby chords through the clock; MAGS's jingle is the seven o'clock chime
s2, e2 = V["L3"]["t"] + .3, TL["REVEAL"] - .05
b.last_voicing = None
b.pad(s2, e2, ["Fmaj7", "Bbmaj7", "Fmaj7", "Bbmaj7"], vel=.24, motor=.22)
b.bass_note(s2, "F2", 4, .32, release=.6)
b.bass_note(s2 + 2.0, "Bb1", 4, .3, release=.6)
b.jingle(TL["CHIME"])

# 3. the restocked aisle: a bright hit and a happy walk; out before "Every label... faces front."
s3, e3 = TL["REVEAL"] + .02, V["L5"]["t"] - .12
b.last_voicing = None; b.prev_bass = 41
b.chord_hit(s3, "F69", 1.5, .36, roll=.02, release=.3)
b.walk(s3 + .5, e3, ["F6", "Gm7 C7", "F6", "D7", "Gm7 C7"], vel=.48, last="Gm7")
b.brushes(s3 + .5, e3, vel=.38, ride=True, fade_in=.05, fade_out=.04)
b.comp(s3 + .5, e3, ["F6", "Gm7 C7", "F6", "D7", "Gm7 C7"], vel=.26, density=.6)

# 4. "No... it was magic!": a twinkle of vibes; MAGS's jingle before "You're welcome!"
s4 = V["L7"]["t"] + .05
b.last_voicing = None
b.chord_hit(s4, "Fmaj9", 3.2, .24, roll=.09, release=.6)
b.set_motor(s4, s4 + 1.8, .24)
b.jingle(V["L8"]["t"] - .5)

# 5. "Thank you, whoever you are!": one warm chord; silence for the door; the button on a darker chord
s5 = V["L11"]["t"] + .05
b.last_voicing = None
b.chord_hit(s5, "Bbmaj7", 3.0, .24, roll=.04, release=.5)
b.bass_note(s5, "Bb1", 3.0, .32, release=.4)
e5 = TL["DOOR0"] - .25
en = TL["BUTTON"]
b.button(en, chord_sym="Dm9", bass="D2")

TACET = [[e1, s2], [e2, s3], [e3, s4], [s4 + 1.9, V["L8"]["t"] - .55], [V["L8"]["t"] + .3, s5], [e5, en - .02]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    kk = int(.03 * SR) if (a, z) in ([e1, s2], [e3, s4]) else int(.12 * SR)            # the can, "Every label": the band stops at once
    env[i:j] = 0
    env[max(0, i - kk):i] = np.minimum(env[max(0, i - kk):i], np.linspace(1, 0, i - max(0, i - kk)))
    env[j:j + int(.03 * SR)] = np.minimum(env[j:j + int(.03 * SR)], np.linspace(0, 1, len(env[j:j + int(.03 * SR)])))
music *= env[:, None]
music[int((DUR - .05) * SR):] = 0
music = music[:int(DUR * SR)]
act = np.abs(music).max(1) > 1e-4
music *= 10 ** (-24 / 20) / np.sqrt(np.mean(music[act] ** 2))
sf.write(os.path.join(HERE, "out", "music.wav"), music.astype(np.float32), SR, subtype="FLOAT")
json.dump({"tacet": TACET, "hits": [["button", en]], "instruments": sorted(b.used), "fills": b.log},
          open(os.path.join(HERE, "out", "score.json"), "w"), indent=1)
json.dump(sorted(b.used), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("instruments:", ", ".join(sorted(b.used)))
print("tacet:", ", ".join(f"{a:.2f}-{z:.2f}" for a, z in TACET))
print("per 1 s dB:", " ".join(f"{i}:{20 * np.log10(np.sqrt(np.mean(music[i * SR:(i + 1) * SR] ** 2)) + 1e-12):.0f}" for i in range(int(DUR) + 1)))
