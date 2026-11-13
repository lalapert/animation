"""Listen-check by numbers on a mix: clicks (a sample-to-sample jump far above the signal's local level), digital silence
(any 50 ms with nothing), and the quietest 50 ms. Ignores the stinger window and the static (given as --skip a:b).
  python3 tools/listencheck.py out/mix.wav [--skip a:b ...]
"""
import sys
import numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d

a = sys.argv[1:]; skips = []
if "--skip" in a: i = a.index("--skip"); skips = [tuple(map(float, s.split(":"))) for s in a[i + 1:]]; a = a[:i]
x, sr = sf.read(a[0]); m = x.mean(1) if x.ndim == 2 else x
d = np.abs(np.diff(m))
loc = np.sqrt(uniform_filter1d(m ** 2, int(.01 * sr))) + 1e-6                 # 10 ms local RMS
ratio = d / loc[1:]
t = np.arange(len(d)) / sr
ok = np.ones(len(d), bool)
for s0, s1 in skips: ok &= ~((t >= s0) & (t < s1))
idx = np.nonzero((ratio > 6) & ok & (d > 1e-3))[0]
groups = []
for i in idx:
    if not groups or i / sr - groups[-1][1] > .02: groups.append([i / sr, i / sr, ratio[i]])
    else: groups[-1][1] = i / sr; groups[-1][2] = max(groups[-1][2], ratio[i])
print(f"clicks (jump > 6x the local level): {len(groups)}", " ".join(f"{g[0]:.3f}s(x{g[2]:.0f})" for g in groups[:12]))
w = int(.05 * sr); r = np.array([np.sqrt(np.mean(m[i:i + w] ** 2)) for i in range(0, len(m) - w, w)])
q = 20 * np.log10(r + 1e-12)
print(f"quietest 50 ms: {q.min():.1f} dBFS at {np.argmin(q) * .05:.2f} s; digital silence (< -90 dBFS): {int((q < -90).sum())} windows")
