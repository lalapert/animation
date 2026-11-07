"""Generate the film's real-sounding effects with ElevenLabs Sound Effects; writes sfx/out/<name>.mp3 and a 48 kHz wav.
  python3 tools/sfx_eleven.py [names…]     # missing ones only, or the names given
The API key is injected by the session's network proxy (header xi-api-key); set ELEVENLABS_API_KEY elsewhere.
"""
import json, os, subprocess, sys, urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(HERE, "sfx", "prompts.json")))
OUT = os.path.join(HERE, "sfx", "out")
os.makedirs(OUT, exist_ok=True)
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
only = set(sys.argv[1:])
for name, (dur, text) in P.items():
    mp3, wav = os.path.join(OUT, name + ".mp3"), os.path.join(OUT, name + ".wav")
    if only and name not in only:
        continue
    if not only and os.path.exists(wav):
        continue
    body = json.dumps({"text": text, "duration_seconds": dur, "prompt_influence": 0.55}).encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", data=body, method="POST",
                                 headers={"Content-Type": "application/json", "xi-api-key": KEY})
    with urllib.request.urlopen(req, timeout=180) as r:
        open(mp3, "wb").write(r.read())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ar", "48000", "-ac", "2", wav], check=True)
    print("ok", name, flush=True)
