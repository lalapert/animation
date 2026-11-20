"""Stinger vs body, measured on a finished file with ffmpeg's ebur128 (per-100 ms momentary M and short-term S, LUFS).
  python3 tools/loudcheck.py <file> <stinger_t> [body_t0 body_t1] [--skip a:b ...]
Body = every 100 ms value from body_t0 to body_t1 except the stinger window (stinger -1.0 s .. +1.5 s) and any --skip ranges
(static bursts). Prints the body median (M and S), the stinger peak (max M in stinger .. +0.8 s, max S in stinger .. +3 s)
and the difference in dB (the series rule: 6-8 dB over the body).
"""
import re, subprocess, sys
import statistics as st


def frames(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True)
    out = []
    for ln in p.stderr.splitlines():
        m = re.search(r"t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+|-inf)\s+S:\s*(-?[\d.]+|-inf)", ln)
        if m:
            f = lambda s: -120.0 if s == "-inf" else float(s)
            out.append((float(m.group(1)), f(m.group(2)), f(m.group(3))))
    return out


def main(a):
    skips = []
    if "--skip" in a:
        i = a.index("--skip"); skips = [tuple(map(float, s.split(":"))) for s in a[i + 1:]]; a = a[:i]
    path, ts = a[0], float(a[1])
    F = frames(path)
    t_end = F[-1][0]
    b0, b1 = (float(a[2]), float(a[3])) if len(a) >= 4 else (1.0, t_end)
    # ebur128 stamps a value at the END of its window; M covers t-0.4..t, S covers t-3..t
    inbody = lambda t: b0 <= t <= b1 and not (ts - 1.0 <= t <= ts + 1.5) and not any(x <= t <= y for x, y in skips)
    bm = [m for t, m, s in F if inbody(t) and m > -70]
    bs = [s for t, m, s in F if inbody(t) and t >= b0 + 3 and s > -70]
    sm = max(m for t, m, s in F if ts <= t <= ts + .8)
    ss = max(s for t, m, s in F if ts <= t <= ts + 3.0)
    mm, ms = st.median(bm), st.median(bs)
    print(f"{path}")
    print(f"  body {b0:.1f}-{b1:.1f} s: median momentary {mm:6.1f} LUFS, median short-term {ms:6.1f} LUFS")
    print(f"  stinger at {ts:.2f} s: max momentary {sm:6.1f} LUFS, max short-term {ss:6.1f} LUFS")
    print(f"  stinger over body: momentary {sm - mm:+.1f} dB, short-term {ss - ms:+.1f} dB")
    loudest = max(F, key=lambda r: r[1])
    print(f"  loudest momentary in the file: {loudest[1]:.1f} LUFS at {loudest[0]:.1f} s")


if __name__ == "__main__":
    main(sys.argv[1:])
