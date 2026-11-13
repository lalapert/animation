"""Checks on the finished episode (runbook 2.5 + the 11/13 natural-sound pass). Exit 1 if any fails.
  .venv/bin/python tools/check.py [--no-stt] [--margin-only]
1. voices over everything else during every line: K-weighted level of the voice stem against music + foley + room tone
   (out/stems/, written by mix.py with the mix's own gains), over the whole line and over its worst 400 ms; needs >= 8 dB
2. the encoded file: duration (same as the picture), integrated loudness (-14 +-0.5 LUFS), true peak (<= -1 dBTP),
   the loudnorm second pass linear (out/mux.log)
3. blackdetect finds nothing
4. ElevenLabs speech-to-text of the encoded file's audio contains every line (in order; "asr" spellings accepted)
5. check_english.py on what is published
6. a contact sheet of the encoded file (every second plus the first 2.5 s): out/review/final_sheet.jpg (look at it)
"""
import json, os, re, subprocess, sys
from difflib import SequenceMatcher
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(HERE)
MP4 = os.path.join(HERE, NAME + ".mp4")
SR = 48000
TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
LINES = {l["id"]: l for l in json.load(open(os.path.join(HERE, "voice", "lines.json")))["lines"]}
fails = []


def say(ok, msg):
    print(("PASS  " if ok else "FAIL  ") + msg)
    if not ok: fails.append(msg)


def kw(x):
    b1, a1 = signal.butter(2, 1500 / (SR / 2), "highpass")
    y = x + 0.585 * signal.lfilter(b1, a1, x, axis=0)
    b2, a2 = signal.butter(2, 38 / (SR / 2), "highpass")
    return signal.lfilter(b2, a2, y, axis=0)


def margins():
    st = {k: sf.read(os.path.join(HERE, "out", "stems", k + ".wav"), always_2d=True)[0] for k in ["voice", "music", "foley", "room"]}
    v = kw(st["voice"]); o = kw(st["music"] + st["foley"] + st["room"])
    p = lambda x: float(np.mean(x ** 2) + 1e-14)
    worst = (99, None)
    print("  line  who     whole   worst400ms   music  foley  room (dB under the voice, whole line)")
    for L in TL["VO"]:
        a, b = int(L["t"] * SR), int((L["t"] + L["dur"]) * SR)
        whole = 10 * np.log10(p(v[a:b]) / p(o[a:b]))
        w, h = int(.4 * SR), int(.1 * SR)
        wins = []
        for i in range(a, max(a + 1, b - w), h):
            pv = p(v[i:i + w])
            if 10 * np.log10(pv) > 10 * np.log10(p(v[a:b])) - 8:          # only where the voice is actually sounding
                wins.append(10 * np.log10(pv / p(o[i:i + w])))
        wmin = min(wins) if wins else whole
        parts = [10 * np.log10(p(v[a:b]) / p(kw(st[k][a:b]))) for k in ["music", "foley", "room"]]
        print(f"  {L['id']:4s}  {L['who']:6s} {whole:6.1f}   {wmin:6.1f}      " + "  ".join(f"{x:5.1f}" for x in parts))
        worst = min(worst, (min(whole, wmin), L["id"]))
    say(worst[0] >= 8, f"voice over everything else: worst {worst[0]:.1f} dB ({worst[1]}), needs >= 8")
    return worst


def media():
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", MP4], capture_output=True, text=True).stdout)
    pic = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(HERE, "out", "video.mp4")], capture_output=True, text=True).stdout)
    say(abs(d - pic) < .1, f"duration {d:.3f} s (picture {pic:.3f} s)")
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    s = e[e.rfind("Summary"):]
    I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)); tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))
    lra = float(re.search(r"LRA:\s+(-?[\d.]+) LU", s).group(1))
    say(abs(I + 14) <= .5, f"loudness {I:.1f} LUFS (LRA {lra:.1f} LU)")
    say(tp <= -1.0, f"true peak {tp:.1f} dBTP")
    log = open(os.path.join(HERE, "out", "mux.log")).read() if os.path.exists(os.path.join(HERE, "out", "mux.log")) else ""
    mode = re.search(r"normalization_type (\w+)", log)
    say(bool(mode) and mode.group(1) == "linear", f"loudnorm second pass: {mode.group(1) if mode else 'unknown'}")
    b = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-vf", "blackdetect=d=0.05:pix_th=0.10", "-an", "-f", "null", "-"], capture_output=True, text=True).stderr
    blk = re.findall(r"black_start:\s*([\d.]+)", b)
    say(not blk, "blackdetect: " + ("nothing" if not blk else "black at " + ", ".join(blk)))
    return d, I, tp, mode.group(1) if mode else "?"


NUM = {"99.99": "ninety nine ninety nine", "60": "sixty", "30": "thirty", "20": "twenty", "25": "twenty five", "1": "one", "0": "zero", "11": "eleven", "9": "nine"}


def words(s):
    s = re.sub(r"\[[^\]]*\]", " ", s).lower()
    s = re.sub(r"\$?(\d+(?:\.\d+)?)%?", lambda m: " " + NUM.get(m.group(1), m.group(1)) + " ", s)
    s = s.replace("-", " ").replace("%", " percent")
    return [{"rae": "ray", "rey": "ray", "rai": "ray"}.get(w, w) for w in re.sub(r"[^a-z' ]+", " ", s).split()]   # Rae is heard as Ray/Rey


def stt():
    mp3 = os.path.join(HERE, "out", "final_check.mp3")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", MP4, "-vn", "-ac", "1", "-b:a", "96k", mp3], check=True)
    out = subprocess.run(["curl", "-sS", "-m", "180", "https://api.elevenlabs.io/v1/speech-to-text", "-H", "xi-api-key: proxy-injected",
                          "-F", "model_id=scribe_v1", "-F", "language_code=en", "-F", f"file=@{mp3}"], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    heard = d.get("text", "")
    open(os.path.join(HERE, "out", "final_stt.txt"), "w").write(heard + "\n")
    print("  heard:", heard)
    H = words(heard)
    pos, ok_all = 0, True
    for L in TL["VO"]:
        best = 0.0
        for src in [LINES[L["id"]].get("plain", L["sub"]), LINES[L["id"]].get("asr", "")]:
            W = words(src)
            if not W: continue
            for i in range(max(0, pos - 3), len(H)):
                r = SequenceMatcher(None, W, H[i:i + len(W)]).ratio()
                if r > best: best, at = r, i
        ok = best >= .8
        ok_all &= ok
        if ok: pos = at + 1
        print(f"  {'ok ' if ok else 'BAD'} {L['id']:4s} {best:.2f}  {L['sub']!r}")
    say(ok_all, f"speech-to-text heard every line ({d.get('language_code')})")
    return ok_all


def english():
    files = [os.path.join(HERE, f) for f in ["film.js", "timeline.js", "voice/lines.json", NAME + ".srt", "CREDITS"] if os.path.exists(os.path.join(HERE, f))]
    r = subprocess.run([sys.executable, os.path.join(HERE, "..", "channel", "tools", "check_english.py")] + files, capture_output=True, text=True)
    say(r.returncode == 0, "check_english: " + r.stdout.strip().splitlines()[-1])


def sheet(d):
    rv = os.path.join(HERE, "out", "review", "final")
    os.makedirs(rv, exist_ok=True)
    for f in os.listdir(rv):
        if f.startswith("t_"): os.remove(os.path.join(rv, f))
    ts = sorted(set([0.0, .5, 1.0, 1.5, 2.0, 2.4] + [float(t) for t in np.arange(3, d - .05, 1.0)] + [round(d - .1, 2)]))
    for t in ts:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", MP4, "-frames:v", "1", "-q:v", "3", os.path.join(rv, f"t_{t:06.2f}.jpg")], check=True)
    subprocess.run([sys.executable, os.path.join(HERE, "tools", "sheet.py"), os.path.join(HERE, "out", "review", "final_sheet.jpg")] +
                   sorted(os.path.join(rv, f) for f in os.listdir(rv) if f.startswith("t_")) + ["--cols", "7", "--w", "260"], check=True)


if __name__ == "__main__":
    a = sys.argv[1:]
    worst = margins()
    if "--margin-only" in a: sys.exit(1 if fails else 0)
    d, I, tp, mode = media()
    if "--no-stt" not in a: stt()
    english()
    sheet(d)
    print(json.dumps({"duration": round(d, 3), "lufs": I, "true_peak": tp, "mode": mode, "voice_margin_db": round(worst[0], 1), "worst_line": worst[1]}))
    print("ALL PASS" if not fails else f"{len(fails)} FAIL(S)")
    sys.exit(1 if fails else 0)
