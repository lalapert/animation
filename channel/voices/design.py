#!/usr/bin/env python3
"""Voice Design previews: python3 design.py [names...]  -> previews/<name>_<n>.mp3, previews/<name>.json"""
import base64, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'previews')
spec = json.load(open(os.path.join(HERE, 'design.json')))
names = sys.argv[1:] or list(spec)
for n in names:
    body = json.dumps({'voice_description': spec[n]['desc'], 'text': spec[n]['text'], 'model_id': 'eleven_ttv_v3', 'guidance_scale': 4})
    r = subprocess.run(['curl', '-sS', '-X', 'POST', 'https://api.elevenlabs.io/v1/text-to-voice/design?output_format=mp3_44100_128',
                        '-H', 'xi-api-key: proxy-injected', '-H', 'Content-Type: application/json', '-d', body], capture_output=True, text=True)
    d = json.loads(r.stdout)
    if 'previews' not in d: print(n, 'ERROR', r.stdout[:400]); continue
    meta = []
    for i, p in enumerate(d['previews'], 1):
        f = os.path.join(OUT, f'{n}_{i}.mp3'); open(f, 'wb').write(base64.b64decode(p['audio_base_64']))
        meta.append({'n': i, 'generated_voice_id': p['generated_voice_id'], 'duration': p.get('duration_secs')})
    json.dump({'name': n, 'desc': spec[n]['desc'], 'text': spec[n]['text'], 'previews': meta}, open(os.path.join(OUT, f'{n}.json'), 'w'), indent=1)
    print(n, 'ok', [m['duration'] for m in meta])
