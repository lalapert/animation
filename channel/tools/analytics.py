#!/usr/bin/env python3
"""Daily and weekly performance check (owner, 11/8): snapshots of every published post, per platform, kept in
channel/analytics/snapshots.csv so growth between days can be read; a report that flags the posts that did not take off.

The numbers come from the Metricool connector (getAnalyticsDataByMetrics), one call per brand and platform, with the
fields below in this exact order. Save each call's JSON ({"rows": [...]}) to a file and add it:

  python3 channel/tools/analytics.py add yt 7923229 yt_vm.json      # YouTube, Void Mart channel (Void Mart + Volt Labs)
  python3 channel/tools/analytics.py add yt 7927149 yt_sr.json      # YouTube, horror channel
  python3 channel/tools/analytics.py add ig 7923229 ig_vm.json      # Instagram reels
  python3 channel/tools/analytics.py add tt 7923229 tt_vm.json      # TikTok, Void Mart
  python3 channel/tools/analytics.py add tt 7927149 tt_sr.json      # TikTok, Halloway Archive
  python3 channel/tools/analytics.py report                         # the daily lines (Korean)
  python3 channel/tools/analytics.py weekly 2026-11-16              # writes channel/analytics/2026-W47.md (tables; the analysis is written by hand)

Fields (from = 2026-11-01, to = now, Asia/Seoul):
  yt: YTVP02 YTVP17 YTVP06 YTVP08 YTVP09 YTVP11 YTVP12          published, title, views, avg view s, likes, comments, shares
  ig: IGRE02 IGRE03 IGRE23 IGRE11 IGRE10 IGRE07 IGRE21 IGRE12 IGRE24 IGRE28
                                                               published, caption, views, reach, likes, comments, shares, saves, avg watch s, 3 s view rate %
  tt: TKPO02 TKPO05 TKPO07 TKPO11 TKPO08 TKPO09 TKPO10 TKPO15 TKPO13
                                                               published, caption, views, reach, likes, comments, shares, avg watch s, full watch %
Standard library only.
"""
import csv, datetime as dt, json, os, re, statistics, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIR = os.path.join(ROOT, "channel", "analytics")
CSV = os.path.join(DIR, "snapshots.csv")
COLS = ["snap", "platform", "brand", "series", "ep", "published", "title", "views", "reach", "view3s", "avgwatch", "fullwatch", "likes", "comments", "shares", "saves"]
KST = dt.timezone(dt.timedelta(hours=9))
NAME = {"vm": "Void Mart", "vl": "Volt Labs", "sr": "공포"}
PLAT = {"yt": "유튜브", "ig": "인스타", "tt": "틱톡"}


def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None


def which(text):
    """series and episode number from a title or caption"""
    t = text or ""
    for pat, s in [(r"Void Mart(?:,| \|)? [Ee]p(?:isode)?\.? ?(\d+)", "vm"), (r"Volt Labs(?:,| \|)? [Ee]p(?:isode)?\.? ?(\d+)", "vl"), (r"[Tt][Aa][Pp][Ee] 0*(\d+)", "sr")]:
        m = re.search(pat, t)
        if m: return s, int(m.group(1))
    return None, None


def add(platform, brand, path):
    rows = json.load(open(path)).get("rows", [])
    snap = dt.datetime.now(KST).strftime("%Y-%m-%d %H:%M")
    out = []
    for r in rows:
        if platform == "yt":
            pub, title, views, avgw, likes, com, sh = (r + [None] * 7)[:7]; reach = view3 = full = saves = None
        elif platform == "ig":
            pub, title, views, reach, likes, com, sh, saves, avgw, view3 = (r + [None] * 10)[:10]; full = None
        else:
            pub, title, views, reach, likes, com, sh, avgw, full = (r + [None] * 9)[:9]; view3 = saves = None
        s, ep = which(title)
        if not s: continue                                   # not one of ours (old uploads on the horror channel)
        out.append({"snap": snap, "platform": platform, "brand": brand, "series": s, "ep": ep, "published": pub, "title": (title or "").split("\n")[0][:90],
                    "views": num(views), "reach": num(reach), "view3s": num(view3), "avgwatch": num(avgw), "fullwatch": num(full),
                    "likes": num(likes), "comments": num(com), "shares": num(sh), "saves": num(saves)})
    os.makedirs(DIR, exist_ok=True)
    new = not os.path.exists(CSV)
    with open(CSV, "a", newline="") as f:
        w = csv.DictWriter(f, COLS)
        if new: w.writeheader()
        for o in out: w.writerow(o)
    print(f"{platform} {brand}: {len(out)} of {len(rows)} rows are ours → {CSV}")


def load():
    if not os.path.exists(CSV): return []
    return list(csv.DictReader(open(CSV)))


def latest(rows):
    """the newest snapshot of each post, and the one before it"""
    by = {}
    for r in rows: by.setdefault((r["platform"], r["series"], int(r["ep"])), []).append(r)
    res = {}
    for k, v in by.items():
        v.sort(key=lambda r: r["snap"])
        res[k] = (v[-1], v[-2] if len(v) > 1 else None)
    return res


def f0(x): return "-" if x in (None, "") else f"{float(x):,.0f}"
def f1(x): return "-" if x in (None, "") else f"{float(x):.1f}"


def report():
    L = latest(load())
    if not L: print("데이터 없음"); return
    lines = []
    for (p, s, ep), (cur, prev) in sorted(L.items(), key=lambda kv: (kv[0][1], kv[0][2], kv[0][0])):
        v = num(cur["views"]); dv = (v - num(prev["views"])) if prev and v is not None and num(prev["views"]) is not None else None
        peers = [num(c["views"]) for (pp, ss, _), (c, _) in L.items() if pp == p and ss == s and num(c["views"]) is not None]
        med = statistics.median(peers) if len(peers) >= 3 else None
        flag = " ← 안 터짐(같은 시리즈 중앙값의 절반 미만)" if med and v is not None and v < .5 * med else ""
        eng = sum(num(cur[k]) or 0 for k in ("likes", "comments", "shares", "saves"))
        extra = f", 3초+ {f1(cur['view3s'])}%" if cur["view3s"] else ""
        extra += f", 끝까지 {f1(cur['fullwatch'])}%" if cur["fullwatch"] else ""
        if v is None: lines.append(f"- {NAME[s]} {ep}화 {PLAT[p]}: 숫자 아직 안 들어옴"); continue
        lines.append(f"- {NAME[s]} {ep}화 {PLAT[p]}: 조회 {f0(v)}" + (f" (+{f0(dv)})" if dv is not None else "") +
                     f", 평균 시청 {f1(cur['avgwatch'])}초{extra}, 반응 {f0(eng)} (좋아요 {f0(cur['likes'])} · 댓글 {f0(cur['comments'])} · 공유 {f0(cur['shares'])} · 저장 {f0(cur['saves'])}){flag}")
    print("\n".join(lines))


def weekly(day):
    d = dt.date.fromisoformat(day); y, w, _ = d.isocalendar()
    L = latest(load())
    path = os.path.join(DIR, f"{y}-W{w:02d}.md")
    out = [f"# 주간 성적 {y}-W{w:02d} ({day} 기준)", "", "| 시리즈 | 편 | 플랫폼 | 조회 | 도달 | 3초+ % | 평균 시청(초) | 끝까지 % | 좋아요 | 댓글 | 공유 | 저장 |", "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for (p, s, ep), (cur, _) in sorted(L.items(), key=lambda kv: (kv[0][1], kv[0][2], kv[0][0])):
        out.append(f"| {NAME[s]} | {ep} | {PLAT[p]} | {f0(cur['views'])} | {f0(cur['reach'])} | {f1(cur['view3s'])} | {f1(cur['avgwatch'])} | {f1(cur['fullwatch'])} | {f0(cur['likes'])} | {f0(cur['comments'])} | {f0(cur['shares'])} | {f0(cur['saves'])} |")
    out += ["", "## 잘된 편과 안 된 편", "", "(손으로 쓴다: 시리즈·플랫폼별 중앙값 대비, 첫 2초·제목·길이·게시 시각·캡션 질문·훅 카드 유무로 원인 가설)", "", "## 다음 주에 바꿀 것", "", "(1~2개, 대본 점검표에 반영)", ""]
    open(path, "w").write("\n".join(out))
    print(path)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "add": add(a[1], a[2], a[3])
    elif a and a[0] == "report": report()
    elif a and a[0] == "weekly": weekly(a[1])
    else: print(__doc__)
