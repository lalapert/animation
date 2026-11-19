"""Score for Void Mart 11 "Leftovers" (natural-sound rules, 11/13): the house trio (tools/band.py), F major.
  - frame 1: one lonely vibraphone chord (motor on) under the robot's "Table for one." that stops before "Again."
  - Pip's tablecloth: the trio comes in bright, a festive two-feel under the garland; MAGS's glockenspiel jingle and a sales vamp
    under his prices and Pip's "Gratitude should be free!"; out before Rae's "Nothing is free." (dry)
  - the microwave montage and Dennis: a quick walk under the three dings (they are in the scene, on the beat of the cuts) and
    "Evening, Rae! The usual!"; out before "Rule nine: always cover it." (dry: the hum and the splat play alone)
  - "Okay! What's everyone thankful for?": a warm two-feel, the vibes' motor on for the robot's "...Company."; out before
    MAGS's "Paying customers!"
  - dry from there: "Rae? Join us!", "I don't do holidays.", the ding, "...Pass the gravy."; the button (the only hit) after the
    last word, ringing into the held tail
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
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
b = Band(DUR, seed=11, bpm=120)

# 1. frame 1: a lonely chord, out before "Again."
again = V["L1"]["t"] + [w for w in W("L1") if w["w"].lower().startswith("again")][0]["t0"]
s1, e1 = .05, again - .15
b.chord_hit(s1, "Dm9", 5.0, .26, roll=.05, release=.5)
b.bass_note(s1 + .02, "D2", 4.6, .38, release=.5)
b.set_motor(s1, e1 + .2, .22)

# 2. the tablecloth: festive two-feel; MAGS's jingle and vamp; out before "Nothing is free."
s2, e2 = TL["CLOTH"] + .3, end("L4") + .05
b.last_voicing = None; b.prev_bass = 41
b.chord_hit(s2, "F69", 1.4, .34, roll=.02, release=.3)
b.two(s2, V["L3"]["t"] - .55, ["F6", "Bb6"], vel=.46, skip=.35)
b.brushes(s2, V["L3"]["t"] - .55, vel=.36, fade_in=.05, fade_out=.06)
b.comp(s2 + .5, V["L3"]["t"] - .55, ["F6", "Bb6"], vel=.28, density=.7)
b.jingle(V["L3"]["t"] - .5)
s2b = V["L3"]["t"] + .05
b.last_voicing = None; b.prev_bass = 41
b.two(s2b, e2, ["Fmaj7", "Gm7 C7", "Fmaj7", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(s2b, e2, vel=.3, fade_in=.3, fade_out=.04)
b.comp(s2b, e2, ["Fmaj7", "Gm7 C7", "Fmaj7", "Gm7 C7"], vel=.28, density=.8)

# 3. the microwave montage and Dennis: a quick walk; out before "Rule nine: always cover it."
s3, e3 = TL["M0"] - .02, V["L7"]["t"] - .12
b.last_voicing = None; b.prev_bass = 41
b.walk(s3, e3, ["F6", "D7", "Gm7 C7", "F6", "D7", "Gm7 C7"], vel=.48, last="Gm7")
b.brushes(s3, e3, vel=.38, fade_in=.05, fade_out=.04)
b.comp(s3 + .2, e3, ["F6", "D7", "Gm7 C7", "F6", "D7", "Gm7 C7"], vel=.26, density=.6)

# 4. "thankful": a warm two-feel, the motor on for "...Company."; out before "Paying customers!"
s4, e4 = V["L8"]["t"] - .05, V["L10"]["t"] - .12
b.last_voicing = None; b.prev_bass = 41
b.two(s4, e4, ["Fmaj7", "Bbmaj7", "Am7", "Dm7"], vel=.4, skip=.2)
b.brushes(s4, e4, vel=.28, slap=False, fade_in=.3, fade_out=.04)
b.pad(s4 + .02, e4, ["Fmaj7", "Bbmaj7", "Am7", "Dm7"], vel=.26, motor=.2)

# 5. the button, ringing into the tail
en = TL["BUTTON"]
b.button(en)

TACET = [[e1, s2], [e2, s3], [e3, s4], [e4, en - .02]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    kk = int(.03 * SR) if (a, z) in ([e2, s3], [e3, s4]) else int(.09 * SR)          # "Nothing is free." and "Rule nine": the band stops at once
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
