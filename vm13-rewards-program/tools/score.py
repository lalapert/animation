"""Score for Void Mart 13 "Rewards Program" (natural-sound rules, 11/13): the house trio (tools/band.py), F major.
  - frame 1: MAGS's glockenspiel jingle (it is his program) and a bright sales vamp under "Do you have a Void Rewards account?";
    out before "No thanks." The refusal, "Great! Just enter your phone number." and the key beeps play dry
  - WELCOME, MEMBER!: one bright chord on the screen (a sting on a visual gag), then a bouncy two-feel under the endless receipt,
    the customer leaving and "Ooh, points!"; out before "Ten thousand points: one free receipt."
  - the fine print: a slow vibes chord (motor on) under "Points expire when the customer... ceases to exist?"; out before
    "Standard terms."
  - the leaderboard: a short walk under the board and "Rae! You're at minus four thousand!"; out before "I say 'no thanks' a lot."
  - MAGS's jingle and a grand little vamp under "Most sign-ups wins Employee of the Month!"; out before Rae turns the reader on him
  - dry: "Do you have a Void Rewards account, MAGS?", "...No thanks."; the button (the only hit) on the -10, into the tail
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
b = Band(DUR, seed=13, bpm=120)

# 1. the jingle and the sales vamp; out before "No thanks."
b.jingle(.03)
s1, e1 = .5, V["L2"]["t"] - .1
b.prev_bass = 41
b.two(s1, e1, ["Fmaj7", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(s1, e1, vel=.3, fade_in=.2, fade_out=.04)
b.comp(s1, e1, ["Fmaj7", "Gm7 C7"], vel=.28, density=.8)

# 2. WELCOME, MEMBER!: a bright chord, then a bouncy two-feel under the receipt; out before "one free receipt"
s2, e2 = TL["TYPED"] + .02, V["L5"]["t"] - .12
b.last_voicing = None; b.prev_bass = 41
b.chord_hit(s2, "F69", 1.4, .36, roll=.02, release=.3)
b.two(s2 + .5, e2, ["F6", "Bb6", "F6", "C7"], vel=.44, skip=.35)
b.brushes(s2 + .5, e2, vel=.34, fade_in=.1, fade_out=.04)
b.comp(s2 + .6, e2, ["F6", "Bb6", "F6", "C7"], vel=.26, density=.7)

# 3. the fine print: one slow chord, the motor on; out before "Standard terms."
s3, e3 = V["L6"]["t"] + .1, V["L7"]["t"] - .12
b.last_voicing = None
b.chord_hit(s3, "Dm9", 6.0, .24, roll=.06, release=.5)
b.bass_note(s3, "D2", 5.8, .34, release=.5)
b.set_motor(s3, e3, .24)

# 4. the leaderboard: a short walk; out before "I say 'no thanks' a lot."
s4, e4 = TL["BOARD"] - .02, V["L9"]["t"] - .12
b.last_voicing = None; b.prev_bass = 41
b.walk(s4, e4, ["F6", "Gm7 C7", "F6", "D7"], vel=.46, last="Gm7")
b.brushes(s4, e4, vel=.34, fade_in=.05, fade_out=.04)
b.comp(s4 + .2, e4, ["F6", "Gm7 C7", "F6", "D7"], vel=.26, density=.6)

# 5. MAGS's jingle and a grand vamp for Employee of the Month; out before Rae turns the reader on him
b.jingle(V["L10"]["t"] - .5)
s5, e5 = V["L10"]["t"] + .05, V["L11"]["t"] - .35
b.last_voicing = None; b.prev_bass = 41
b.chord_hit(s5, "Fmaj9", 2.0, .32, roll=.02, release=.4)
b.two(s5 + .5, e5, ["Fmaj7", "Bbmaj7"], vel=.42, skip=.2)
b.brushes(s5 + .5, e5, vel=.32, ride=True, fade_in=.1, fade_out=.04)

# 6. the button on MAGS's -10, into the tail
en = TL["BUTTON"]
b.button(en)

TACET = [[e1, s2], [e2, s3], [e3, s4], [e4, V["L10"]["t"] - .55], [e5, en - .02]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    kk = int(.03 * SR) if (a, z) in ([e1, s2], [e2, s3], [e3, s4], [e4, V["L10"]["t"] - .55]) else int(.09 * SR)   # punchlines: the band stops at once
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
