"""Score for Void Mart 8 "Lost & Found" (natural-sound pass rules, 11/13): the house trio (tools/band.py), F major.
  - frame 1, the sock planet: one soft vibes chord and a light, curious two-feel with brushes under "Someone lost a whole
    planet!"; out before "That's where the socks go."
  - the dig and the Tuesday: a curious little vamp (bass, vibes, a short answer as the page comes up); out before
    "That explains last week."
  - the commuter walks in: a tired Monday two-feel (bass, the brush swirl only, vibes with the motor on), minor colour,
    under "I've had three Mondays." and "We found it!"
  - the Tuesday slapped on his face: the trio brightens into a walk, then MAGS's glockenspiel jingle
  - MAGS's fee: a sales vamp that stops dead before "Wednesday" (the word lands dry)
  - the Wednesday torn off, "That's where Wednesdays go.", "It's Thursday?!": dry
  - he runs out: the bass runs with him and stops on the door chime; "Sir! Your briefcase!" dry
  - the briefcase floats up into orbit: a soft vibes chord with the motor; the button (the only hit): the xylophone and the
    trio's last chord, ringing into the held tail under the end card
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
W = lambda k: json.load(open(os.path.join(HERE, "voice", "out", k + ".json")))["words"]
b = Band(DUR, seed=8, bpm=120)

# 1. frame 1: the sock planet; out before "That's where the socks go."
s1, e1 = .04, V["L2"]["t"] - .12
b.chord_hit(s1, "F69", 2.6, .3, roll=.03, release=.5)
b.set_motor(s1, s1 + 1.6, .15)
b.prev_bass = 41
b.two(.55, e1, ["F6", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(.55, e1, vel=.32, fade_in=.3, fade_out=.06)

# 2. the dig and the Tuesday; out before "That explains last week."
s2, e2 = TL["DIG0"] - .05, V["L4"]["t"] - .12
b.last_voicing = None; b.prev_bass = 38
b.two(s2, e2, ["Gm7", "C7", "Fmaj7", "D7"], vel=.4, skip=.35)
b.brushes(s2, e2, vel=.3, slap=False, fade_in=.3, fade_out=.06)
b.fill(s2 + .1, TL["UP"] - .05, "Gm7", vel=.32, direction=-1)
b.chord_hit(TL["UP"] + .02, "Fmaj7", 2.4, .3, roll=.035, release=.5)
b.set_motor(TL["UP"], TL["UP"] + 2.0, .2)

# 3. the commuter walks in: a tired Monday two-feel, minor colour, until he takes his Tuesday
s3, e3 = TL["CU0"] + .1, TL["TAKE"] + .1
b.last_voicing = None; b.prev_bass = 38
b.two(s3, e3, ["Dm7", "Gm7", "Bbmaj7", "A7", "Dm7"], vel=.38, skip=.15)
b.brushes(s3, e3, vel=.24, slap=False, foot=True, fade_in=.5, fade_out=.08)
b.pad(s3 + .02, e3, ["Dm7", "Gm7", "Bbmaj7", "A7", "Dm7"], vel=.24, motor=.22)

# 4. the Tuesday on his face: the trio brightens into a walk; then MAGS's jingle
s4, e4 = TL["SLAP"] - .05, V["L7"]["t"] - .5
b.last_voicing = None; b.prev_bass = 41
b.walk(s4, e4, ["F6", "Gm7 C7"], vel=.5, last="F6")
b.brushes(s4, e4, vel=.4, fade_in=.1, fade_out=.06)
b.chord_hit(s4 + .02, "F69", 1.6, .34, roll=.02, release=.3)
b.jingle(V["L7"]["t"] - .45)

# 5. MAGS's fee: a sales vamp that stops dead before "Wednesday"
w7 = W("L7"); wed = V["L7"]["t"] + [x for x in w7 if x["w"].lower().startswith("wednesday")][0]["t0"]
s5, e5 = V["L7"]["t"] + .05, wed - .12
b.last_voicing = None; b.prev_bass = 41
b.two(s5, e5, ["Fmaj7", "Gm7 C7"], vel=.42, skip=.3)
b.brushes(s5, e5, vel=.32, fade_in=.4, fade_out=.04)
b.comp(s5, e5, ["Fmaj7", "Gm7 C7"], vel=.28, density=.8)

# 6. he runs out: the bass runs with him and stops on the door chime
s6, e6 = TL["RUN0"] - .02, TL["GONE"] + .08
k = 0
for nm in ["F2", "G2", "A2", "C3", "D3", "F3"]:
    tt = s6 + k * .14
    if tt < e6 - .05: b.bass_note(tt, nm, .25, .5, release=.06)
    k += 1

# 7. the briefcase floats up into orbit; the button (the only hit), ringing into the held tail
b.last_voicing = None
b.chord_hit(TL["RISE"] + .05, "Bbmaj7", 4, .26, roll=.04, release=.8)
b.set_motor(TL["RISE"], TL["ORBIT"] + 2.4, .24)
en = TL["BUTTON"]
b.button(en)

TACET = [[e1, s2], [e2, s3], [e3, s4 - .02], [e5, s6], [e6, TL["RISE"]]]
music, stems = b.render(json.load(open(os.path.join(HERE, "tools", "score_gain.json"))))
env = np.ones(len(music), np.float32)
for a, z in TACET:
    i, j = int(a * SR), int(z * SR)
    kk = int(.09 * SR) if (a, z) != (e5, s6) else int(.03 * SR)          # "Wednesday": the band stops at once
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
