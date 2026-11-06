#!/usr/bin/env python3
"""Rae (Kar2) / Pip (Win2) exchange from Ep 1 on eleven_v4 -> previews/duo_A.mp3 (as is), duo_B.mp3 (Rae 1.5 semitones lower)"""
import base64, json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'previews'); TMP = '/tmp/claude-0/-home-user-animation/145544ce-a0e8-5f77-adfe-aa7687db033f/scratchpad/duo'
os.makedirs(TMP, exist_ok=True)
CAST = {'PIP': ('BiP91t4ozM9IZajOdSu2', {'stability': 0.35, 'similarity_boost': 0.8, 'style': 0.45, 'speed': 1.05}),
        'RAE': ('oy557F0mOsPZZqdz8oK6', {'stability': 0.85, 'similarity_boost': 0.8, 'style': 0.0, 'speed': 0.9})}
LINES = [('PIP', "Hi! I'm Pip! It's my first night! Is that... the edge of the universe?!"),
         ('RAE', "Yep. Don't lean on the glass."),
         ('PIP', "Why? What happens if I lean on the glass?"),
         ('RAE', "We hire someone new.")]
files = []
for i, (who, text) in enumerate(LINES):
    vid, vs = CAST[who]
    body = json.dumps({'text': text, 'model_id': 'eleven_v4', 'voice_settings': vs})
    out = os.path.join(TMP, f'{i}_{who}.mp3')
    subprocess.run(['curl', '-sS', '-X', 'POST', f'https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128',
                    '-H', 'xi-api-key: proxy-injected', '-H', 'Content-Type: application/json', '-d', body, '-o', out], check=True)
    if os.path.getsize(out) < 2000: print(open(out, errors='ignore').read()); raise SystemExit(1)
    files.append((who, out))
for variant in ('A', 'B'):
    lst = os.path.join(TMP, f'list_{variant}.txt'); parts = []
    for i, (who, f) in enumerate(files):
        w = os.path.join(TMP, f'{variant}_{i}.wav')
        af = 'aresample=44100'
        if variant == 'B' and who == 'RAE': af = 'asetrate=44100*0.917,aresample=44100,atempo=1.0905'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', af, '-ac', '1', '-ar', '44100', w], check=True)
        parts.append(w)
    gap = os.path.join(TMP, 'gap.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '0.35', gap], check=True)
    with open(lst, 'w') as fh:
        for p in parts: fh.write(f"file '{p}'\nfile '{gap}'\n")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c:a', 'libmp3lame', '-b:a', '128k', os.path.join(OUT, f'duo_{variant}.mp3')], check=True)
    print('duo', variant, 'ok')
