"""Score for Void Mart 9 "Secret Shopper" (natural-sound rules, 11/13): the house trio (tools/band.py), F major.
  - MAGS's glockenspiel jingle on the first frame; a bright announcement vamp under "A secret shopper visits tonight."
  - "Then every customer is royalty!": the trio swings into a stately walk with the ride for the royal service (the carpet,
    the crowns, the milks) and stops dead before "That was the last milk."
  - Dennis slides in: the same "usual" walk as in VM5, stopped dead by "We're out." (the callback in the music too)
  - the stalks, the sign out of his cap, "Secret shopper. One star.": dry
  - "But I gave everyone a crown!": a mock-sad vibes chord with the motor on
  - MAGS's jingle again; a smug little vamp that stops before "MAGS."; the button (the only hit), ringing into the tail
Every punchline sits in a TACET window (the band damped, room tone only). CC0 samples (VSCO 2 CE, VCSL, FreePats).
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
b = Band(DUR, seed=9, bpm=120)

# 1. the jingle on the first frame; the announcement vamp
b.jingle(.02)
s1, e1 = V["L1"]["t"] - .02, V["L2"]["t"] - .05
b.prev_bass = 41
b.two(s1, e1, ["Fmaj7", "Gm7 C7", "Fmaj7"], vel=.42, skip=.3)
b.brushes(s1, e1, vel=.32, fade_in=.3, fade_out=.06)
b.comp(s1, e1, ["Fmaj7", "Gm7 C7", "Fmaj7"], vel=.28, density=.7)

# 2. "every customer is royalty!": a stately swing for the royal service; out before "That was the last milk."
s2, e2 = V["L2"]["t"], V["L4"]["t"] - .12
b.last_voicing = None
b.walk(s2, e2, ["F6", "Bb7", "F6", "C7", "F6", "D7", "Gm7 C7"], vel=.5, last="F6")
b.brushes(s2, s2 + 3.3, vel=.38, fade_in=.15, fade_out=.1)
b.brushes(s2 + 3.3, e2, vel=.42, ride=True, fade_in=.2, fade_out=.06)
b.comp(s2, e2, ["F6", "Bb7", "F6", "C7", "F6", "D7", "Gm7 C7"], vel=.3, density=.7)
b.fill(TL["CROWN1"] + .05, V["L3"]["t"] - .12, "F6", vel=.34, direction=1)
b.fill(TL["CROWN2"] + .05, TL["MILK2"] + .4, "C7", vel=.34, direction=1)

# 3. Dennis: the usual, as in VM5, stopped dead by "We're out."
s3, e3 = TL["DEN0"] + .05, V["L6"]["t"] - .07
b.last_voicing = None; b.prev_bass = 41
b.walk(s3, e3, ["F6", "D7", "Gm7 C7"], vel=.5, last="Gm7")
b.brushes(s3, e3, vel=.42, fade_in=.2, fade_out=.06)
b.comp(s3, e3, ["F6", "D7", "Gm7 C7"], vel=.3, density=.7)

# 4. "But I gave everyone a crown!": a mock-sad chord
s4 = V["L8"]["t"] - .15
b.last_voicing = None
b.chord_hit(s4, "Dm7", 2.4, .3, roll=.04, release=.5)
b.chord_hit(s4 + 1.25, "Gm6", 2.2, .28, roll=.04, release=.6)
b.bass_note(s4, "D2", 2.2, .44, release=.4)
b.bass_note(s4 + 1.25, "G1", 2.2, .42, release=.5)
b.set_motor(s4, s4 + 2.6, .28)

# 5. MAGS's jingle; a smug vamp that stops before "MAGS."; the button
b.jingle(V["L9"]["t"] - .45)
s5, e5 = V["L9"]["t"] + .05, TL["MAGSWORD"] - .12
b.last_voicing = None; b.prev_bass = 41
b.two(s5, e5, ["Fmaj7", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(s5, e5, vel=.3, fade_in=.3, fade_out=.04)
b.comp(s5, e5, ["Fmaj7", "Gm7 C7"], vel=.28, density=.8)
en = TL["BUTTON"]
b.button(en)

TACET = [[e2, s3], [e3, s4 - .02], [s4 + 2.7, V["L9"]["t"] - .5], [e5, en - .02]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    kk = int(.09 * SR) if (a, z) not in ([e3, s4 - .02], [e5, en - .02]) else int(.03 * SR)   # "We're out." and "MAGS.": the band stops at once
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
