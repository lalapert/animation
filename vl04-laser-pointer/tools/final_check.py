"""Checks on the final encoded file (runbook 2.5; owner 11/13 quality bar). Exit 1 if any check fails.
  python3 tools/final_check.py <folder>.mp4 [--no-stt | --reuse-stt]
1. duration = the timeline's DUR (+-0.1 s)
2. loudness about -14 LUFS (+-0.5) and true peak <= -1.0 dBTP (ffmpeg ebur128 on the file)
3. blackdetect finds nothing
4. ElevenLabs speech-to-text of the final audio contains every line, in its own time window (the words in order)
5. a contact sheet of the encoded file: every 1 s from 0.25 s, plus the hook frames (0, 0.5, 1.0, 1.5, 2.0, 2.4 s) ->
   out/final_sheet.jpg and out/final_hook.jpg (look at them)
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = os.path.join(HERE, ".venv", "bin", "python")
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty"}


def words(n):
    n = int(n)
    if n < 20: return ONES[n]
    if n < 60: return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    return str(n)


def norm(s):
    s = re.sub(r"\[[^\]]*\]|\([^)]*\)", " ", s).lower().replace("-", " ")
    s = re.sub(r"(\d+):(\d\d)", lambda m: words(m.group(1)) + " " + (words(m.group(2)) if m.group(2) != "00" else ""), s)
    s = re.sub(r"\d+", lambda m: words(m.group(0)), s)
    SAME = {"ms": "miss", "mr": "mister", "okay": "ok"}                   # the same word, spelled the STT's way
    return [SAME.get(w, w) for w in re.sub(r"[^a-z' ]+", " ", s).split()]


def main(a):
    f = a[0]
    TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
    lines = {l["id"]: l for l in json.load(open(os.path.join(HERE, "voice", "lines.json")))["lines"]}
    bad = 0
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
    ok = abs(d - TL["DUR"]) <= .1
    bad += not ok
    print(f"{'OK ' if ok else 'BAD'} duration {d:.3f} s (timeline {TL['DUR']})")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    summ = r[r.rfind("Summary:"):]
    I = float(re.search(r"I:\s*(-?[\d.]+) LUFS", summ).group(1))
    TP = float(re.search(r"Peak:\s*(-?[\d.]+) dBFS", summ).group(1))
    LRA = float(re.search(r"LRA:\s*(-?[\d.]+) LU", summ).group(1))
    ok = abs(I + 14) <= .5 and TP <= -1.0
    bad += not ok
    print(f"{'OK ' if ok else 'BAD'} loudness {I:.1f} LUFS, true peak {TP:.1f} dBTP, LRA {LRA:.1f} LU")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", f, "-vf", "blackdetect=d=0.05:pix_th=0.10", "-an", "-f", "null", "-"], capture_output=True, text=True).stderr
    bl = re.findall(r"black_start:\S+ black_end:\S+", r)
    bad += bool(bl)
    print(f"{'BAD' if bl else 'OK '} blackdetect: {bl or 'nothing'}")
    if "--no-stt" not in a:
        sp = os.path.join(HERE, "out", "final_stt.json")
        if "--reuse-stt" in a and os.path.getmtime(sp) > os.path.getmtime(f):    # the same file, already transcribed
            js = json.load(open(sp))
        else:
            mp3 = os.path.join(HERE, "out", "final_audio.mp3")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f, "-vn", "-ac", "1", "-b:a", "96k", mp3], check=True)
            out = subprocess.run(["curl", "-sS", "-m", "180", "https://api.elevenlabs.io/v1/speech-to-text", "-H", f"xi-api-key: {KEY}",
                                  "-F", "model_id=scribe_v1", "-F", "language_code=en", "-F", "tag_audio_events=false",
                                  "-F", f"file=@{mp3}"], capture_output=True, text=True, check=True).stdout
            js = json.loads(out)
            json.dump(js, open(sp, "w"), indent=1)
        W = [(w["start"], w["end"], norm(w["text"])) for w in js.get("words", []) if w.get("type", "word") == "word"]
        print("STT:", js.get("text", "")[:400])
        heard = 0
        for v in TL["VO"]:
            want = norm(lines[v["id"]].get("asr", lines[v["id"]]["plain"]))
            got = [t for s, e, ws in W if v["t"] - .6 <= s <= v["t"] + v["dur"] + .6 for t in ws]
            i = 0
            for t in got:                                          # the line's words, in order, inside its window
                if i < len(want) and t == want[i]: i += 1
            ok = i == len(want)
            heard += ok; bad += not ok
            print(f"{'OK ' if ok else 'BAD'} {v['id']:4s} want {' '.join(want)!r} heard {' '.join(got)!r}")
        print(f"lines heard: {heard}/{len(TL['VO'])}")
    # contact sheets of the encoded file
    rv = os.path.join(HERE, "out", "final_frames")
    subprocess.run(["rm", "-rf", rv]); os.makedirs(rv)
    ts = [round(.25 + k, 2) for k in range(int(d))]
    hook = [0.0, .5, 1.0, 1.5, 2.0, 2.4]
    for t in ts + hook:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", f, "-frames:v", "1", "-q:v", "3",
                        os.path.join(rv, f"{'h' if t in hook and t not in ts else 't'}_{t:06.2f}.jpg")], check=True)
    sh = os.path.join(HERE, "tools", "sheet.py")
    import glob
    subprocess.run([PY, sh, os.path.join(HERE, "out", "final_sheet.jpg")] + sorted(glob.glob(os.path.join(rv, "t_*.jpg"))) + ["--cols", "8", "--w", "270"], check=True)
    subprocess.run([PY, sh, os.path.join(HERE, "out", "final_hook.jpg")] + sorted(glob.glob(os.path.join(rv, "h_*.jpg"))) + ["--cols", "6", "--w", "360"], check=True)
    print("ALL CHECKS PASS" if not bad else f"{bad} CHECK(S) FAILED")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
