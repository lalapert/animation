"""Score for Void Mart 10 "Hot Dog Roller" (natural-sound rules, 11/13): the house trio (tools/band.py), F major.
  - frame 1: an easy two-feel under the order and "Coming right up!"; out before the tongs hit the welded hot dog, so the tug and
    the crack play dry
  - dry from the tongs to "Make it two!": "...Are they fresh?", "Those have been rolling since the Big Bang.", "...Are they good?",
    "They're consistent." (both punchlines in silence, room tone only)
  - "Make it two!": the trio comes back bright for the second hot dog; MAGS's glockenspiel jingle; a sales vamp under his line
  - "Thirteen billion years? They need a break!": a soft mock-sad vibes chord (motor on) that Pip switches off with the roller:
    tools/mix.py runs it down like a tape stopping at the switch (the score plays on to OFF + 0.9 s to feed the stop), then silence
  - silence through the slow time ("Rule one: never turn off the roller."), "Did time just... slow down?", "It does that.", the bite
    and "...Consistent."; the button (the only hit) after the last word, ringing into the held tail
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
b = Band(DUR, seed=10, bpm=120)

# 1. frame 1: the order; out before the tongs bite on the welded hot dog
s1, e1 = .05, TL["TONG0"] - .08
b.chord_hit(s1, "F69", 2.2, .3, roll=.03, release=.5)
b.set_motor(s1, s1 + 1.4, .14)
b.prev_bass = 41
b.two(.5, e1, ["F6", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(.5, e1, vel=.32, fade_in=.3, fade_out=.04)
b.comp(.5, e1, ["F6", "Gm7 C7"], vel=.26, density=.6)

# 2. "Make it two!": bright two-feel for the second hot dog, MAGS's jingle, his sales vamp
s2, e2 = V["L7"]["t"] - .08, V["L8"]["t"] - .55
b.last_voicing = None; b.prev_bass = 41
b.walk(s2, e2, ["F6", "Gm7 C7", "F6"], vel=.48, last="Fmaj7")
b.brushes(s2, e2, vel=.38, fade_in=.1, fade_out=.06)
b.comp(s2, e2, ["F6", "Gm7 C7", "F6"], vel=.28, density=.7)
b.jingle(V["L8"]["t"] - .5)
s3, e3 = V["L8"]["t"] + .05, end("L8") + .15
b.last_voicing = None; b.prev_bass = 41
b.two(s3, e3, ["Fmaj7", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(s3, e3, vel=.3, fade_in=.3, fade_out=.08)
b.comp(s3, e3, ["Fmaj7", "Gm7 C7"], vel=.28, density=.8)

# 3. "They need a break!": a mock-sad chord pair with the vibes' motor on, held into the switch (mix.py stops it like a tape)
s4 = V["L9"]["t"] - .1
b.last_voicing = None
b.chord_hit(s4, "Dm7", 3.2, .28, roll=.04, release=.5)
b.bass_note(s4, "D2", 3.0, .42, release=.4)
s5 = V["L9"]["t"] + 1.6
b.chord_hit(s5, "Bbmaj7", 4.4, .28, roll=.04, release=.6)
b.bass_note(s5, "Bb1", 4.2, .42, release=.5)
b.set_motor(s4, TL["OFF"] + 1.0, .26)
e5 = TL["OFF"] + .9                                   # the tape stop in mix.py reads at most ~0.35 s past OFF

# 4. the button, ringing into the tail
en = TL["BUTTON"]
b.button(en)

TACET = [[e1, s2], [e3, s4 - .02], [e5, en - .02]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    kk = int(.03 * SR) if (a, z) == (e1, s2) else int(.09 * SR)          # the tongs: the band stops at once
    env[i:j] = 0
    env[max(0, i - kk):i] = np.minimum(env[max(0, i - kk):i], np.linspace(1, 0, i - max(0, i - kk)))
    env[j:j + int(.03 * SR)] = np.minimum(env[j:j + int(.03 * SR)], np.linspace(0, 1, len(env[j:j + int(.03 * SR)])))
music *= env[:, None]
music[int((DUR - .05) * SR):] = 0
music = music[:int(DUR * SR)]
act = np.abs(music).max(1) > 1e-4
music *= 10 ** (-24 / 20) / np.sqrt(np.mean(music[act] ** 2))
sf.write(os.path.join(HERE, "out", "music.wav"), music.astype(np.float32), SR, subtype="FLOAT")
json.dump({"tacet": TACET, "hits": [["button", en]], "tape_stop": TL["OFF"], "instruments": sorted(b.used), "fills": b.log},
          open(os.path.join(HERE, "out", "score.json"), "w"), indent=1)
json.dump(sorted(b.used), open(os.path.join(HERE, "out", "instruments_used.json"), "w"))
print("instruments:", ", ".join(sorted(b.used)))
print("tacet:", ", ".join(f"{a:.2f}-{z:.2f}" for a, z in TACET))
print("per 1 s dB:", " ".join(f"{i}:{20 * np.log10(np.sqrt(np.mean(music[i * SR:(i + 1) * SR] ** 2)) + 1e-12):.0f}" for i in range(int(DUR) + 1)))
