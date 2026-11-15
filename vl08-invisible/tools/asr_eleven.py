"""Transcribe every narration line with ElevenLabs speech-to-text and compare it with the script.
Exits 1 if any line differs (after lower-casing, dropping punctuation and spelling numbers out).
  python3 tools/asr_eleven.py [file.mp3 'expected text']   # or one file
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety"}


def words(n):
    """numbers as people say them: 12 twelve, 45 forty five, 1200 twelve hundred, 400 four hundred"""
    n = int(n)
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 10000 and n % 100 == 0: return words(n // 100) + " hundred"
    if n < 1000: return ONES[n // 100] + " hundred " + words(n % 100)
    return str(n)


def numbers(s):
    s = re.sub(r"(?<=\d),(?=\d{3})", "", s)                                 # 1,200 -> 1200
    s = s.replace("%", " percent")
    s = re.sub(r"(\d+):(\d\d)", lambda m: words(m.group(1)) + ("" if m.group(2) == "00" else " " + words(m.group(2))), s)
    return re.sub(r"\d+", lambda m: words(m.group(0)), s)


def norm(s):
    s = re.sub(r"\[[^\]]*\]", " ", s)          # audio tags and sound events are not words
    s = s.lower().replace("-", " ")
    s = numbers(s)
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
