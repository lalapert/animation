"""Dialogue lines with ElevenLabs eleven_v3 (Korean), plus character timings for lip sync and subtitles.
Adapted from vm13-rewards-program/tools/voice_eleven.py (one voice per character, timings from /with-timestamps).

  python3 tools/voice_eleven.py            # all lines missing from voice/out/
  python3 tools/voice_eleven.py L4         # (re)generate only these

voice/lines.json: {"model_id", "cast": {WHO: {"voice_id", "settings"}}, "lines": [{"id", "who", "text" (script, subtitles),
"tts" (what is sent: numbers spelled out in Hangul so the reading is certain), "en"}]}
Writes voice/out/<id>.mp3, voice/out/<id>.json (chars with times), voice/out/durations.json and voice/out/usage.json
(characters billed, from the response header). The API key is injected by the session's network proxy (header xi-api-key).
"""
import base64, json, os, subprocess, sys, urllib.request, urllib.error

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(HERE, "voice", "lines.json")))
OUT = os.path.join(HERE, "voice", "out")
os.makedirs(OUT, exist_ok=True)
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")


def post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "xi-api-key": KEY})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.load(r), dict(r.headers)
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:600])
        raise


def strip_tags(ch, a, b):
    """audio tags ([shouting] ...) are direction, not speech: drop their characters from the timings"""
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
    usage_path = os.path.join(OUT, "usage.json")
    usage = json.load(open(usage_path)) if os.path.exists(usage_path) else {"requests": []}
    for ln in CFG["lines"]:
        mp3 = os.path.join(OUT, ln["id"] + ".mp3")
        if (only and ln["id"] not in only) or (not only and os.path.exists(mp3)):
            continue
        who = CFG["cast"][ln["who"]]
        text = ln.get("tts", ln["text"])
        body = {"text": text, "model_id": CFG["model_id"], "voice_settings": ln.get("settings", who["settings"])}
        d, hdr = post(f"https://api.elevenlabs.io/v1/text-to-speech/{who['voice_id']}/with-timestamps?output_format=mp3_44100_128", body)
        open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
        billed = hdr.get("x-character-count") or hdr.get("X-Character-Count")
        usage["requests"].append({"id": ln["id"], "chars_sent": len(text), "billed_header": billed})
        al = d.get("normalized_alignment") or d["alignment"]
        ch, a, b = strip_tags(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])
        json.dump({"id": ln["id"], "who": ln["who"], "text": ln["text"], "tts": text,
                   "chars": [[c, round(x, 3), round(y, 3)] for c, x, y in zip(ch, a, b)]}, open(os.path.join(OUT, ln["id"] + ".json"), "w"), ensure_ascii=False)
        print("ok", ln["id"], ln["who"], "chars", len(text), "billed", billed, flush=True)
    usage["total_chars_sent"] = sum(r["chars_sent"] for r in usage["requests"])
    json.dump(usage, open(usage_path, "w"), indent=1)
    durs = {ln["id"]: round(duration(os.path.join(OUT, ln["id"] + ".mp3")), 3) for ln in CFG["lines"] if os.path.exists(os.path.join(OUT, ln["id"] + ".mp3"))}
    json.dump(durs, open(os.path.join(OUT, "durations.json"), "w"), indent=1)
    print(json.dumps(durs), "| chars sent so far:", usage["total_chars_sent"])


if __name__ == "__main__":
    main()
