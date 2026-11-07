"""Dialogue lines with ElevenLabs (one voice per character), plus character and word timings for lip sync and subtitles.

  python3 tools/voice_eleven.py            # all lines missing from voice/out/
  python3 tools/voice_eleven.py L4 L7      # (re)generate only these

lines.json: {"model_id", "cast": {WHO: {"voice_id", "settings", "pitch" (semitones, optional)}}, "lines": [{"id", "who", "text", "settings"?}]}
A cast "pitch" is applied with ffmpeg (asetrate + atempo, length kept), so timings stay valid; the raw take is kept as <id>_raw.mp3.
Writes voice/out/<id>.mp3, voice/out/<id>.json (chars + words with times) and voice/out/durations.json.
The API key is injected by the session's network proxy (header xi-api-key); set ELEVENLABS_API_KEY elsewhere.
"""
import base64, json, os, subprocess, sys, urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(HERE, "voice", "lines.json")))
OUT = os.path.join(HERE, "voice", "out")
os.makedirs(OUT, exist_ok=True)
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")


def post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "xi-api-key": KEY})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def words_from(chars, t0s, t1s):
    words, cur, s, e = [], "", None, None
    for c, a, b in zip(chars, t0s, t1s):
        if c.isspace():
            if cur: words.append({"w": cur, "t0": s, "t1": e})
            cur, s = "", None
            continue
        if s is None: s = a
        cur += c; e = b
    if cur: words.append({"w": cur, "t0": s, "t1": e})
    return words


def strip_tags(ch, a, b):
    """eleven_v4 audio tags ([excited], [sighs] ...) are direction, not speech: drop their characters from the timings"""
    out, depth = [], 0
    for c, x, y in zip(ch, a, b):
        if c == "[": depth += 1; continue
        if c == "]": depth = max(0, depth - 1); continue
        if depth: continue
        if c.isspace() and (not out or out[-1][0].isspace()): continue
        out.append((c, x, y))
    return [o[0] for o in out], [o[1] for o in out], [o[2] for o in out]


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True, check=True).stdout.strip())


def main():
    only = set(sys.argv[1:])
    lines = CFG["lines"]
    for i, ln in enumerate(lines):
        mp3 = os.path.join(OUT, ln["id"] + ".mp3")
        if (only and ln["id"] not in only) or (not only and os.path.exists(mp3)):
            continue
        who = CFG["cast"][ln["who"]]
        body = {"text": ln["text"], "model_id": CFG["model_id"], "voice_settings": ln.get("settings", who["settings"]),
                "previous_text": lines[i - 1]["text"] if i else None,
                "next_text": lines[i + 1]["text"] if i + 1 < len(lines) else None}
        d = post(f"https://api.elevenlabs.io/v1/text-to-speech/{who['voice_id']}/with-timestamps?output_format=mp3_44100_128", body)
        raw = os.path.join(OUT, ln["id"] + "_raw.mp3")
        open(raw, "wb").write(base64.b64decode(d["audio_base64"]))
        p = who.get("pitch", 0)
        if p:
            r = 2 ** (p / 12)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", f"asetrate=44100*{r:.5f},aresample=44100,atempo={1 / r:.5f}",
                            "-c:a", "libmp3lame", "-b:a", "192k", mp3], check=True)
        else:
            os.replace(raw, mp3)
        al = d.get("normalized_alignment") or d["alignment"]
        ch, a, b = strip_tags(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])
        json.dump({"id": ln["id"], "who": ln["who"], "text": ln["text"], "chars": [[c, round(x, 3), round(y, 3)] for c, x, y in zip(ch, a, b)],
                   "words": words_from(ch, a, b)}, open(os.path.join(OUT, ln["id"] + ".json"), "w"))
        print("ok", ln["id"], ln["who"], flush=True)
    durs = {ln["id"]: round(duration(os.path.join(OUT, ln["id"] + ".mp3")), 3) for ln in lines if os.path.exists(os.path.join(OUT, ln["id"] + ".mp3"))}
    json.dump(durs, open(os.path.join(OUT, "durations.json"), "w"), indent=1)
    print(json.dumps(durs))


if __name__ == "__main__":
    main()
