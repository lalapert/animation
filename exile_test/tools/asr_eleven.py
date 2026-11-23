"""Transcribe every line with ElevenLabs speech-to-text (Korean) and compare it with the script.
Adapted from vm13-rewards-program/tools/asr_eleven.py for Korean: spaces and punctuation are dropped, digits are read as
Sino-Korean numbers (500 -> 오백), then the two strings are compared character by character.
Exits 1 if any line is below 0.9 similarity. Writes voice/out/asr.json.
  python3 tools/asr_eleven.py            # every line in voice/lines.json
  python3 tools/asr_eleven.py file.mp3 '기대하는 문장'
"""
import json, os, re, subprocess, sys
from difflib import SequenceMatcher

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
DIG = "영일이삼사오육칠팔구"


def sino(n):
    n = int(n)
    if n == 0: return "영"
    out = ""
    for unit, name in [(1000, "천"), (100, "백"), (10, "십"), (1, "")]:
        q, n = divmod(n, unit)
        if q: out += ("" if (q == 1 and name) else DIG[q]) + name
    return out


def norm(s):
    s = re.sub(r"\[[^\]]*\]", " ", s)
    s = re.sub(r"\d+", lambda m: sino(m.group(0)), s)
    return re.sub(r"[^가-힣a-z]", "", s.lower())


def transcribe(path, lang="ko", model="scribe_v1"):
    out = subprocess.run(["curl", "-sS", "-m", "180", "https://api.elevenlabs.io/v1/speech-to-text",
                          "-H", f"xi-api-key: {KEY}", "--form-string", f"model_id={model}", "--form-string", f"language_code={lang}",
                          "-F", f"file=@{path}"], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def main():
    if len(sys.argv) == 3:
        items = [(sys.argv[1], sys.argv[2], os.path.basename(sys.argv[1]))]
    else:
        cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
        items = [(os.path.join(HERE, "voice", "out", l["id"] + ".mp3"), l["text"], l["id"]) for l in cfg["lines"]]
    bad, rep = 0, []
    for path, text, name in items:
        d = transcribe(path)
        heard = d.get("text", "")
        r = SequenceMatcher(None, norm(text), norm(heard)).ratio()
        ok = r >= .9
        bad += not ok
        rep.append({"id": name, "expected": text, "heard": heard, "similarity": round(r, 3), "lang": d.get("language_code"), "ok": ok})
        print(("OK  " if ok else "BAD ") + f"{name} {r:.3f} | {heard}")
    if len(sys.argv) != 3:
        json.dump(rep, open(os.path.join(HERE, "voice", "out", "asr.json"), "w"), ensure_ascii=False, indent=1)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
