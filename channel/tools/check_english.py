#!/usr/bin/env python3
"""Fail if anything that will be published contains Korean.

  python3 channel/tools/check_english.py <files...> [--text "post body"] [--stt final_audio.wav]

Files: any text file that ends up on screen or in a post (film.js, timeline.json, .srt, post.json ...).
--text: a string to check (title, description, hashtags).
--stt: an audio file; ElevenLabs speech-to-text must detect English ("eng").
Exit 0 = clean, 1 = Korean found or speech not English.
"""
import json, re, subprocess, sys

HANGUL = re.compile('[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힯ힰ-퟿]')

def scan(name, text):
    bad = 0
    for n, line in enumerate(text.splitlines(), 1):
        if HANGUL.search(line):
            print(f'KOREAN  {name}:{n}: {line.strip()[:120]}'); bad += 1
    return bad

def stt_lang(path):
    out = subprocess.run(['curl', '-sS', '-X', 'POST', 'https://api.elevenlabs.io/v1/speech-to-text',
                          '-H', 'xi-api-key: proxy-injected', '-F', 'model_id=scribe_v1', '-F', f'file=@{path}'],
                         capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    return d.get('language_code'), d.get('language_probability'), d.get('text', '')

def main(argv):
    bad, i = 0, 0
    while i < len(argv):
        a = argv[i]
        if a == '--text':
            bad += scan('--text', argv[i + 1]); i += 2; continue
        if a == '--stt':
            lang, p, txt = stt_lang(argv[i + 1])
            print(f'speech  {argv[i + 1]}: {lang} ({p})')
            if lang != 'eng': print('NOT ENGLISH'); bad += 1
            bad += scan('speech', txt); i += 2; continue
        with open(a, encoding='utf-8', errors='ignore') as f:
            bad += scan(a, f.read())
        i += 1
    print('ok: no Korean' if not bad else f'FAIL: {bad} problem(s)')
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
