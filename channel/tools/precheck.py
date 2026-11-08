#!/usr/bin/env python3
"""Pre-upload check (owner, 11/9): the day before a post goes out, check that the scheduled post is the planned episode,
that the file Metricool will publish is our final cut, that the subtitles match the lines, that the text and titles are
right, and make a contact sheet of the file Metricool holds so a person (Claude) looks at it before it airs.

  1. getScheduledPosts for the brand, save the post object (one element of "data") as JSON
  2. python3 channel/tools/precheck.py <folder> <post.json> <brand> [--stt]
     → PASS/WARN/FAIL lines, and channel/../<scratch>/<folder>_precheck.png (contact sheet of the downloaded media)
  --stt: also transcribe the downloaded media with ElevenLabs speech-to-text and compare with the lines (a few credits)

Exit 1 if anything FAILs. Fix before it airs (re-render, swap the media with updateScheduledPost), or set the post to
draft and tell the owner (never delete). Standard library + ffmpeg/ffprobe.
"""
import datetime as dt, hashlib, json, os, re, subprocess, sys, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCR = os.environ.get("PRECHECK_OUT") or tempfile.gettempdir()
PLAN = {"vm": ("channel/SEASON1.md", "Void Mart"), "vl": ("channel/LAB_SERIES.md", "Volt Labs"), "sr": ("channel/HORROR_SERIES.md", "STILL RECORDING")}
BRAND = {"vm": "7923229", "vl": "7923229", "sr": "7927149"}
NETS = {"vm": {"instagram", "youtube", "tiktok"}, "vl": {"instagram", "youtube", "tiktok"}, "sr": {"youtube", "tiktok"}}
HANGUL = re.compile("[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힯ힰ-퟿]")
out, bad = [], 0


def say(level, msg):
    global bad
    out.append(f"  {level:4s}  {msg}"); bad += level == "FAIL"


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()


def dur(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip() or 0)


def srt_cues(path):
    txt = open(path, encoding="utf-8").read().strip()
    cues = []
    for block in re.split(r"\n\s*\n", txt):
        ls = block.strip().split("\n")
        if len(ls) >= 3: cues.append("\n".join(ls[2:]).strip())
    return cues


def main():
    folder, post_path, brand = sys.argv[1], sys.argv[2], sys.argv[3]
    stt = "--stt" in sys.argv
    post = json.load(open(post_path)); post = post.get("data", post) if isinstance(post, dict) else post
    if isinstance(post, list): post = post[0]
    m = re.match(r"(vm|vl|sr)(\d+)-", folder); s, ep = m.group(1), int(m.group(2))
    fdir = os.path.join(ROOT, folder)
    when = post["publicationDate"]["dateTime"]; day = dt.date.fromisoformat(when[:10])
    print(f"{folder}  ({PLAN[s][1]} {ep}, post {post.get('id')}, {when} {post['publicationDate'].get('timezone')})")

    # 1. the planned episode on this date, the right brand and networks
    plan = open(os.path.join(ROOT, PLAN[s][0]), encoding="utf-8").read()
    row = next((l for l in plan.split("\n") if re.match(rf"\|\s*{ep}\s*\|\s*\d+/\d+", l)), None)
    if not row: say("FAIL", f"no row {ep} in {PLAN[s][0]}")
    else:
        md = re.search(r"\|\s*(\d+)/(\d+)", row); pd = dt.date(day.year, int(md.group(1)), int(md.group(2)))
        say("PASS" if pd == day else "FAIL", f"plan date {pd} vs post date {day}  ({row.split('|')[3].strip()})")
    say("PASS" if brand == BRAND[s] else "FAIL", f"brand {brand} (expected {BRAND[s]})")
    nets = {p["network"] for p in post.get("providers", [])}
    say("PASS" if nets == NETS[s] else "FAIL", f"networks {sorted(nets)} (expected {sorted(NETS[s])})")
    if post.get("draft"): say("FAIL", "the post is a draft: it will not go out")
    if not post.get("autoPublish", True): say("WARN", "autoPublish is off: it waits for a phone tap")

    # 2. the text: caption file, episode number, title, TikTok title, no Korean
    text = post.get("text", "")
    capf = next((p for p in [os.path.join(ROOT, "channel", "ig", "posts", folder + ".txt"), os.path.join(ROOT, "channel", "tiktok", folder + ".txt")] if os.path.exists(p)), None)
    if capf: say("PASS" if open(capf, encoding="utf-8").read().strip() == text.strip() else "FAIL", f"post text = {os.path.relpath(capf, ROOT)}")
    else: say("WARN", "no caption file in the repository to compare with")
    if s in ("vm", "vl"):
        say("PASS" if re.search(rf"{PLAN[s][1]}, episode {ep}\.", text) else "FAIL", f'caption says "{PLAN[s][1]}, episode {ep}."')
        yt = post.get("youtubeData", {}).get("title", "")
        say("PASS" if yt.endswith(f"| {PLAN[s][1]} Ep {ep} #shorts") and len(yt) <= 100 else "FAIL", f"YouTube title: {yt}")
    else:
        yt = post.get("youtubeData", {}).get("title", "")
        say("PASS" if yt.startswith(f"TAPE {ep:02d}:") and yt.endswith("| STILL RECORDING #shorts") else "FAIL", f"YouTube title: {yt}")
        say("PASS" if "A work of fiction." in text else "FAIL", "description ends with the fiction note")
    tt = post.get("tiktokData", {}).get("title")
    if "tiktok" in nets: say("PASS" if tt and tt.replace("#shorts", "").split() == text.replace("#shorts", "").split() else "FAIL", "TikTok title = the post text")
    for name, t in [("text", text), ("YouTube title", yt), ("TikTok title", tt or "")]:
        if HANGUL.search(t): say("FAIL", f"Korean in the {name}")
    if s in ("vm", "vl") and post.get("instagramData", {}).get("type") != "REEL": say("FAIL", "Instagram type is not REEL")
    if not post.get("videoThumbnailUrl"): say("WARN", "no cover image")

    # 3. the media Metricool will publish is our final cut
    local = os.path.join(fdir, folder + ".mp4")
    url = (post.get("media") or [None])[0]
    dl = os.path.join(SCR, folder + "_metricool.mp4")
    try:
        urllib.request.urlretrieve(url, dl)
        same = sha(dl) == sha(local)
        if same: say("PASS", "Metricool's video is byte-for-byte our final file")
        else:
            d1, d2 = dur(dl), dur(local)
            say("PASS" if abs(d1 - d2) < .1 else "FAIL", f"Metricool's video differs from the repository file (durations {d1:.2f} / {d2:.2f} s): check it is the latest cut")
    except Exception as e:
        say("FAIL", f"could not download the media: {e}"); dl = local

    # 4. subtitles = the lines (the srt is what YouTube can show; the burned-in ones come from the same timeline)
    srt = os.path.join(fdir, folder + ".srt"); lines = json.load(open(os.path.join(fdir, "voice", "lines.json")))["lines"]
    if os.path.exists(srt):
        cues = srt_cues(srt); subs = [l.get("sub") or l.get("plain") or l["text"] for l in lines]
        norm = lambda x: re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", x)).strip().lower()
        ok = [norm(a) for a in cues] == [norm(b) for b in subs]
        say("PASS" if ok else "FAIL", f"subtitles: {len(cues)} cues match the {len(subs)} script lines" if ok else f"subtitles differ from the lines: {[(a, b) for a, b in zip(cues, subs) if norm(a) != norm(b)][:3]}")
        for c in cues:
            if HANGUL.search(c): say("FAIL", f"Korean in a subtitle: {c}")
    else: say("WARN", "no .srt file")

    # 5. the spoken lines in the file Metricool holds (optional, a few credits)
    if stt:
        audio = os.path.join(SCR, folder + "_precheck.mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", dl, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", audio], check=True)
        r = subprocess.run([sys.executable, os.path.join(fdir, "tools", "asr_eleven.py"), audio, "x"], capture_output=True, text=True).stdout
        heard = r.split("|", 1)[-1].strip()
        clean = lambda x: re.sub(r"[^a-z' ]+", " ", re.sub(r"\[[^\]]*\]", " ", x.lower().replace("-", " "))).split()
        hw = " ".join(clean(heard)); miss = [l["id"] for l in lines if " ".join(clean(l.get("asr", l.get("plain") or l["text"])))[:24] not in hw]
        say("PASS" if not miss else "FAIL", f"every line is heard in the published file" if not miss else f"not heard (check by ear): {miss}")
        print("    heard:", heard[:400])

    # 6. a contact sheet of the downloaded file, to look at before it airs
    d = dur(dl); sheet = os.path.join(SCR, folder + "_precheck.png")
    ts = [round(d * k / 13, 2) for k in range(1, 13)]
    tmp = tempfile.mkdtemp()
    for i, t in enumerate(ts):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", dl, "-frames:v", "1", "-vf", f"scale=270:480,drawtext=text={t:.1f}:x=6:y=6:fontsize=22:fontcolor=white:box=1:boxcolor=black", os.path.join(tmp, f"{i:02d}.png")], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(tmp, "%02d.png"), "-vf", "tile=6x2", "-frames:v", "1", sheet], check=True)
    say("INFO", f"contact sheet to look at: {sheet}")
    print("\n".join(out)); print("RESULT:", "FAIL" if bad else "PASS")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
