"""Score for Void Mart 14 "Best Before" (natural-sound rules, 11/13): the house trio (tools/band.py), F major. Short cut (25-30 s).
  - frame 1: a light two-feel under "Rae! This milk is good till the end of the universe!", MAGS's glockenspiel jingle into his
    sale ("That's tonight! Milk is half off!"); out before "Tonight?!" (dry)
  - the stars going out: one slow vibes chord, motor on, under the window and "The stars are going out!"; out before the throw.
    The throw, the catch and "Then it's still good till midnight." play dry, then the pour, the sip and the lights (natural sound)
  - in the dark: a slow, sad little chord under "Milk is now ninety-nine percent off!" and "Rae? Are we dead?"; out before
    "Milk's still good." (dry); the button (the only hit) after it, into the tail
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
b = Band(DUR, seed=14, bpm=120)

# 1. a light two-feel under Pip's discovery, MAGS's jingle into the sale; out before "Tonight?!"
s1, e1 = .2, V["L3"]["t"] - .1
b.prev_bass = 41
b.two(s1, V["L2"]["t"] - .3, ["Fmaj7", "Gm7 C7"], vel=.4, skip=.3)
b.brushes(s1, e1, vel=.28, fade_in=.3, fade_out=.04)
b.comp(s1 + .2, e1, ["Fmaj7", "Gm7 C7", "F6"], vel=.26, density=.7)
b.jingle(V["L2"]["t"] - .45)
b.two(V["L2"]["t"] - .3, e1, ["F6", "C7"], vel=.42, skip=.3)

# 2. the stars going out: one slow chord, the motor on; out before the throw
s2, e2 = TL["VOID"] + .02, TL["TOSS"] - .08
b.last_voicing = None
b.chord_hit(s2, "Dm9", 5.0, .26, roll=.08, release=.5)
b.bass_note(s2, "D2", 4.6, .34, release=.5)
b.set_motor(s2, e2, .28)

# 3. in the dark: a slow, sad chord under the sale and "Are we dead?"; out before "Milk's still good."
s3, e3 = V["L6"]["t"] + .1, V["L8"]["t"] - .12
b.last_voicing = None
b.chord_hit(s3, "Bbmaj7", 6.0, .22, roll=.06, release=.5)
b.bass_note(s3, "Bb1", 5.6, .3, release=.5)
b.chord_hit(s3 + 3.0, "Gm9", 6.0, .2, roll=.06, release=.5)
b.set_motor(s3, e3, .22)

# 4. the button after "Milk's still good.", into the tail
en = TL["BUTTON"]
b.button(en)

TACET = [[e1, s2], [e2, s3], [e3, en - .02]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    kk = int(.03 * SR)                                                         # punchlines: the band stops at once
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
