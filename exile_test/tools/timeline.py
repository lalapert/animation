"""Timeline: line starts, shots, effects cues, mouth states (from the voice amplitude) and blinks -> out/timeline.json
  python tools/timeline.py

Rules from the brief: gaps between lines at most 0.3 s (overlap allowed), cut 0.2 s after the last line, no cards.
Mouth: driven by the voice amplitude, per syllable: the mouth opens at each Hangul syllable's onset (ElevenLabs character
timings) and stays open for 60% of it, but only where the take's RMS envelope (20 ms window) is over 18% of its 95th
percentile (a quiet syllable does not open it); any open or closed run shorter than 2 frames is absorbed into its neighbour
(minimum hold 2 frames, no flicker).
Blinks: a seeded random clock per character, every 2 to 5 s, 3 frames closed.
"""
import json, os, subprocess
import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
CFG = json.load(open(os.path.join(HERE, "voice", "lines.json")))
VO = os.path.join(HERE, "voice", "out")


def decode(path, sr=48000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def envelope(x, sr=48000):
    hop = sr // FPS
    n = int(np.ceil(len(x) / hop))
    w = int(0.02 * sr)
    out = []
    for i in range(n):
        c = int((i + 0.5) * hop)
        seg = x[max(0, c - w):c + w]
        out.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
    e = np.array(out)
    return e / max(np.percentile(e, 95), 1e-6)


def hold(states, min_run=2):
    s = list(states)
    changed = True
    while changed:
        changed = False
        i = 0
        while i < len(s):
            j = i
            while j < len(s) and s[j] == s[i]: j += 1
            if j - i < min_run and (i > 0 or j < len(s)):
                v = s[i - 1] if i > 0 else s[j]
                for k in range(i, j): s[k] = v
                changed = True
            i = j
    return s


def main():
    durs = json.load(open(os.path.join(VO, "durations.json")))
    L = {l["id"]: dict(l) for l in CFG["lines"]}
    gaps = {"L1": 0.30, "L2": 0.18, "L3": 0.15, "L4": 0.25, "L5": -0.05}   # before each line (L1: lead-in from the first frame)
    t = 0.0
    order = ["L1", "L2", "L3", "L4", "L5"]
    for k in order:
        t += gaps[k]
        L[k]["t"] = round(t, 3); L[k]["dur"] = durs[k]
        t += durs[k]
    END = round(t + 0.2, 3)
    ch = {k: json.load(open(os.path.join(VO, k + ".json")))["chars"] for k in order}
    # L4: the key cut carries "거짓말 마세요." (voice over), the pigeon's bust takes "어제 ..." (cut in the pause)
    c4 = ch["L4"]
    dot = next(c for c in c4 if c[0] == ".")
    nxt = next(c for c in c4 if c[0] == "어")
    cut_pigeon = round(L["L4"]["t"] + (dot[2] + nxt[1]) / 2, 3)
    key_in = round(L["L3"]["t"] + L["L3"]["dur"] + 0.06, 3)
    shots = [
        {"id": "S1", "kind": "sera", "t0": 0.0, "t1": round(L["L2"]["t"] - 0.08, 3), "bust": "neutral", "line": "L1"},
        {"id": "S2", "kind": "minsu", "t0": round(L["L2"]["t"] - 0.08, 3), "t1": round(L["L3"]["t"] - 0.08, 3), "line": "L2"},
        {"id": "S3", "kind": "sera_arm", "t0": round(L["L3"]["t"] - 0.08, 3), "t1": key_in, "bust": "neutral", "line": "L3"},
        {"id": "S4a", "kind": "keycut", "t0": key_in, "t1": cut_pigeon, "line": "L4"},
        {"id": "S4b", "kind": "pigeon", "t0": cut_pigeon, "t1": L["L5"]["t"], "line": "L4"},
        {"id": "S5", "kind": "sera_rage", "t0": L["L5"]["t"], "t1": END, "bust": "angry", "line": "L5"},
    ]
    # mouth states per line, on the film's frame grid
    mouth = {}
    for k in order:
        e = envelope(decode(os.path.join(VO, k + ".mp3")))
        syl = [c for c in ch[k] if "\uac00" <= c[0] <= "\ud7a3"]
        raw = []
        for f in range(len(e)):
            tau = f / FPS
            on = any(c[1] <= tau < c[1] + max(0.07, 0.6 * (c[2] - c[1])) for c in syl)
            raw.append(1 if (on and e[f] > 0.18) else 0)
        st = hold(raw, 2)
        f0 = int(round(L[k]["t"] * FPS))
        mouth[k] = {"f0": f0, "open": st, "env": [round(float(v), 3) for v in e]}
    # blinks: seeded random clock, 2-5 s apart, 3 frames each
    blinks = {}
    for who, seed in [("SERA", 11), ("MINSU", 23)]:
        rng = np.random.default_rng(seed)
        bt, tb = [], rng.uniform(0.6, 1.8)
        while tb < END:
            bt.append(round(tb, 3)); tb += rng.uniform(2.0, 5.0)
        blinks[who] = bt
    cues = [
        {"t": round(L["L2"]["t"] - 0.08 + 0.42, 3), "fx": "ice_clink", "note": "Minsu's cup arrives at the top of the lift"},
        {"t": key_in, "fx": "spotlight_thunk", "note": "the evidence key cut lights up"},
        {"t": round(cut_pigeon + 0.04, 3), "fx": "pigeon_coo", "note": "cut to Pigeon Park"},
        {"t": round(L["L5"]["t"] - 0.14, 3), "fx": "whoosh", "note": "into the rage zoom"},
        {"t": L["L5"]["t"], "fx": "slam", "note": "white flash, snap zoom"},
    ]
    subs = []
    for i, k in enumerate(order):
        s0 = L[k]["t"] - 0.06
        s1 = L[k]["t"] + L[k]["dur"] + 0.12
        if i + 1 < len(order): s1 = min(s1, L[order[i + 1]]["t"] - 0.10)   # gone before the next shot's cut
        subs.append({"id": k, "who": L[k]["who"], "s0": round(s0, 3), "s1": round(s1, 3), "ko": L[k]["text"], "en": L[k]["en"],
                     "col": CFG["cast"][L[k]["who"]]["col"]})
    gaps_out = {order[i + 1]: round(L[order[i + 1]]["t"] - (L[order[i]]["t"] + L[order[i]]["dur"]), 3) for i in range(len(order) - 1)}
    tl = {"FPS": FPS, "DUR": END, "VO": [{"id": k, "who": L[k]["who"], "t": L[k]["t"], "dur": L[k]["dur"], "sub": L[k]["text"]} for k in order],
          "SHOTS": shots, "MOUTH": mouth, "BLINKS": blinks, "CUES": cues, "SUBS": subs, "GAPS": gaps_out, "CUT_PIGEON": cut_pigeon, "KEY_IN": key_in}
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    json.dump(tl, open(os.path.join(HERE, "out", "timeline.json"), "w"), ensure_ascii=False, indent=1)
    print("DUR", END, "gaps", gaps_out)
    for s in shots: print(" ", s["id"], s["kind"], s["t0"], "->", s["t1"])


if __name__ == "__main__":
    main()
