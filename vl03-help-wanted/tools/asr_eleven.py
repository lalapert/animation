"""Transcribe every narration line with ElevenLabs speech-to-text and compare it with the script.
Exits 1 if any line differs (after lower-casing, dropping punctuation and spelling numbers out).
  python3 tools/asr_eleven.py [file.mp3 'expected text']   # or one file
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
NUM = {"23": "twenty three", "9": "nine", "1": "one", "13": "thirteen"}


def norm(s):
    s = re.sub(r"\[[^\]]*\]", " ", s)          # audio tags and sound events are not words
    s = s.lower().replace("-", " ")
    s = re.sub(r"\d+", lambda m: NUM.get(m.group(0), m.group(0)), s)
    return re.sub(r"[^a-z' ]+", " ", s).split()


def transcribe(path, model="scribe_v1"):
    out = subprocess.run(["curl", "-sS", "-m", "120", "https://api.elevenlabs.io/v1/speech-to-text",
                          "-H", f"xi-api-key: {KEY}", "-F", f"model_id={model}", "-F", "language_code=en",
                          "-F", f"file=@{path}"], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def main():
    if len(sys.argv) == 3:
        items = [(sys.argv[1], sys.argv[2], os.path.basename(sys.argv[1]))]
    else:
        cfg = json.load(open(os.path.join(HERE, "voice", "lines.json")))
        items = [(os.path.join(HERE, "voice", "out", l["id"] + ".mp3"), l.get("asr", l["text"]), l["id"]) for l in cfg["lines"]]   # "asr": what a correct read transcribes as
    bad = 0
    for path, text, name in items:
        d = transcribe(path)
        heard = d.get("text", "")
        ok = norm(heard) == norm(text)
        bad += not ok
        print(("OK  " if ok else "BAD ") + name + " | " + heard)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
