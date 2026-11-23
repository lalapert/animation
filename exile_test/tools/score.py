"""A little low lo-fi bed with the house band (vm13-rewards-program/tools/band.py, CC0 samples), made lo-fi afterwards:
slow (76 bpm), vibraphone pads with the motor on and soft comping, a pizzicato two-feel, very soft brushes; then a
telephone-ish band limit, gentle tape saturation, a slow wow and a quiet vinyl crackle.
It plays from the first frame and stops dead on Sera's rage (the white flash), sitcom style.
  python tools/score.py   -> out/music.wav (48 kHz stereo float)
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(HERE, "..", "vm13-rewards-program", "tools"))   # the house band, used read-only
from audio import SR, lowpass, highpass                                          # noqa: E402
from band import Band                                                            # noqa: E402

TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
DUR = TL["DUR"]
STOP = next(s for s in TL["SHOTS"] if s["kind"] == "sera_rage")["t0"]

b = Band(STOP + 1.0, seed=77, bpm=76, swing=.6)
prog = ["Dm9", "G7", "Cmaj7", "Am7"]
b.pad(0.0, STOP, prog * 2, vel=.24, motor=.18)
b.comp(0.5, STOP, prog * 2, vel=.17, density=.45)
b.two(0.0, STOP, prog * 2, vel=.34, skip=.35, stop=False)
b.brushes(0.6, STOP, vel=.16, fade_in=.6, fade_out=.02)
music, _ = b.render({"brush": 0.8, "vibes": 1.0, "bass": 1.0})
music = music[:int(DUR * SR) + 1]
music = np.pad(music, ((0, max(0, int(DUR * SR) + 1 - len(music))), (0, 0)))

# lo-fi: band limit, tape saturation, wow (a slow +-7 cent pitch drift by a varying read position), vinyl crackle
music = highpass(lowpass(music, 3600, 4), 110)
music = np.tanh(music * 2.2) / 2.2
n = len(music)
t = np.arange(n) / SR
drift = 0.0004 * np.sin(2 * np.pi * 0.55 * t) / (2 * np.pi * 0.55)              # integral of a +-0.04% speed change
pos = np.clip((t + drift) * SR, 0, n - 1)
music = np.stack([np.interp(pos, np.arange(n), music[:, c]) for c in range(2)], 1).astype(np.float32)
rng = np.random.default_rng(5)
crackle = np.zeros(n, np.float32)
idx = rng.choice(n, int(DUR * 22), replace=False)
crackle[idx] = rng.normal(0, 1, len(idx)) * rng.uniform(.2, 1, len(idx))
crackle = signal.lfilter([1, -0.6], [1], highpass(crackle[:, None], 1500)[:, 0])
hiss = highpass(lowpass(rng.normal(0, 1, (n, 1)).astype(np.float32), 6000), 2000)[:, 0]
act = np.abs(music).max(1) > 1e-5
music *= 10 ** (-24 / 20) / np.sqrt(np.mean(music[act] ** 2))
music += (crackle * 0.012 + hiss * 0.0012)[:, None]
# stop dead on the rage cut (12 ms fade), nothing after
i = int(STOP * SR)
music[i:i + int(.012 * SR)] *= np.linspace(1, 0, int(.012 * SR))[:, None]
music[i + int(.012 * SR):] = 0
fi = int(0.25 * SR)
music[:fi] *= np.linspace(0, 1, fi)[:, None]
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
sf.write(os.path.join(HERE, "out", "music.wav"), music.astype(np.float32), SR, subtype="FLOAT")
print("music", round(len(music) / SR, 2), "s, stops at", STOP, "| instruments:", ", ".join(sorted(b.used)))
