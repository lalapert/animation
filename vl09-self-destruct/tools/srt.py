"""Subtitles from the timeline (the same cues the page burns in) → a-year-on-the-sill.srt"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


out = []
for i, v in enumerate(TL["VO"], 1):
    out.append(f"{i}\n{ts(v['s0'])} --> {ts(v['s1'])}\n{v['sub']}\n")
open(os.path.join(HERE, os.path.basename(HERE) + ".srt"), "w").write("\n".join(out))
print(len(out), "cues")
