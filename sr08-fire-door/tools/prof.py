"""momentary loudness profile of a file every 0.5 s, the stinger window, and each line's max (quick mix tuning)
  .venv/bin/python tools/prof.py out/mix.wav"""
import subprocess, re, sys, json, statistics as st
TL = json.load(open("out/timeline.json"))
p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", sys.argv[1], "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
M = [(float(m.group(1)), float(m.group(2))) for ln in p.stderr.splitlines() for m in [re.search(r"t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+)", ln)] if m]
print(" ".join(f"{t:.1f}:{v:.0f}" for t, v in M if round(t * 10) % 5 == 0))
ts = TL["STING"]
body = [v for t, v in M if t <= TL["END"] and not (ts - 1 <= t <= ts + 1.5)]
smax = max((v, t) for t, v in M if ts - .1 <= t <= ts + .8)
print(f"body median {st.median(body):.1f}; stinger max {smax[0]:.1f} at {smax[1]:.1f} -> +{smax[0] - st.median(body):.1f} dB")
print("voice max M:", " ".join(f"{v['id']}:{max(x for t, x in M if v['t'] <= t <= v['t'] + v['dur'] + .3):.1f}" for v in TL["VO"]))
print("max outside stinger window:", max((v, t) for t, v in M if not (ts - .1 <= t <= ts + .8)))
