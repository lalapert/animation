"""Generate one narration file per line with ElevenLabs, plus word timings.

  python3 tools/voice_eleven.py            # all lines missing from voice/out/
  python3 tools/voice_eleven.py L4 L7      # (re)generate only these

The API key is injected by the session's network proxy (header xi-api-key);
set ELEVENLABS_API_KEY yourself when running elsewhere.
Writes voice/out/<id>.mp3, voice/out/<id>.json (character alignment -> words) and voice/out/durations.json.
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


def words_from_alignment(al):
    chars, t0s, t1s = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, s = [], "", None
    for c, a, b in zip(chars, t0s, t1s):
        if c.isspace():
            if cur:
                words.append({"w": cur, "t0": s, "t1": e})
            cur, s = "", None
            continue
        if s is None:
            s = a
        cur += c
        e = b
    if cur:
        words.append({"w": cur, "t0": s, "t1": e})
    return words


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def main():
    only = set(sys.argv[1:])
    lines = CFG["lines"]
    for i, ln in enumerate(lines):
        mp3 = os.path.join(OUT, ln["id"] + ".mp3")
        if only and ln["id"] not in only:
            continue
        if not only and os.path.exists(mp3):
            continue
        body = {
            "text": ln["text"],
            "model_id": CFG["model_id"],
            "voice_settings": CFG["voice_settings"],
            "previous_text": lines[i - 1]["text"] if i else None,
            "next_text": lines[i + 1]["text"] if i + 1 < len(lines) else None,
        }
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{CFG['voice_id']}/with-timestamps?output_format=mp3_44100_128"
        d = post(url, body)
        open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
        al = d.get("normalized_alignment") or d["alignment"]
        json.dump({"id": ln["id"], "text": ln["text"], "words": words_from_alignment(al)},
                  open(os.path.join(OUT, ln["id"] + ".json"), "w"), indent=1)
        print("ok", ln["id"])
    durs = {ln["id"]: round(duration(os.path.join(OUT, ln["id"] + ".mp3")), 3)
            for ln in lines if os.path.exists(os.path.join(OUT, ln["id"] + ".mp3"))}
    json.dump(durs, open(os.path.join(OUT, "durations.json"), "w"), indent=1)
    print(json.dumps(durs))


if __name__ == "__main__":
    main()
