"""Review stills -> review/
  swaps/   every expression swap, flicked at the SAME instant (same pose, only the bust changed): before | after | where
           they differ (red). The stable parts (hair outline, face outline, ears, clothes) must stay black in the third
           panel; the jitter number is the residual shift between the two renders over those stable parts (ECC, px on screen).
  arm/     large stills of the arm shot: rest, the point, the flick, and the joint crops (written by render.py armcheck)
  gemini_vs_ours_arm.png   Gemini's demo at 4.5 s next to ours
  python tools/stills.py
"""
import json, os, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render as R

HERE = R.HERE
RV = os.path.join(HERE, "review")
os.makedirs(os.path.join(RV, "swaps"), exist_ok=True); os.makedirs(os.path.join(RV, "arm"), exist_ok=True)
FONT = os.path.join(HERE, "assets", "fonts", "Fredoka_600SemiBold.ttf")
DEMO_FRAME = os.path.join(HERE, "assets", "reference", "gemini_demo_t4.5.png")   # one frame of the demo, kept for this comparison


def to8(x): return (np.clip(x, 0, 1) * 255 + .5).astype(np.uint8)


def label(img8, text, size=34, xy=(16, 12)):
    im = Image.fromarray(img8); d = ImageDraw.Draw(im)
    d.text(xy, text, font=ImageFont.truetype(FONT, size), fill=(255, 235, 120), stroke_width=4, stroke_fill=(10, 8, 20))
    return np.asarray(im)


def render_forced(t, who, expr):
    R.FORCE.clear(); R.FORCE[who] = expr
    fr, _ = R.render(t)
    R.FORCE.clear()
    return fr


def jitter(a, b, changed):
    """residual translation between two renders over the parts that did not change (ECC, sub-pixel)"""
    g1 = cv2.GaussianBlur(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), (0, 0), 1.0)
    g2 = cv2.GaussianBlur(cv2.cvtColor(b, cv2.COLOR_RGB2GRAY), (0, 0), 1.0)
    edges = cv2.dilate((cv2.Laplacian(g1, cv2.CV_32F) ** 2 > 1e-4).astype(np.uint8), np.ones((3, 3), np.uint8))
    mask = (edges > 0) & ~changed
    T = np.eye(2, 3, dtype=np.float32)
    _, T = cv2.findTransformECC(g1, g2, T, cv2.MOTION_TRANSLATION, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), mask.astype(np.uint8), 3)
    return float(np.hypot(T[0, 2], T[1, 2]))


SWAPS = [  # (name, time, who, before, after)
    ("sera_neutral_to_talk", 1.30, "sera", "neutral", "talk"),
    ("sera_neutral_to_blink", 1.30, "sera", "neutral", "neutral_blink"),
    ("sera_talk_to_talkblink", 1.30, "sera", "talk", "talk_blink"),
    ("sera_neutral_to_angry", 2.20, "sera", "neutral", "angry"),
    ("sera_arm_neutral_to_talk", 9.00, "sera", "neutral", "talk"),
    ("minsu_neutral_to_talk", 5.00, "minsu", "neutral", "talk"),
    ("minsu_neutral_to_blink", 5.00, "minsu", "neutral", "neutral_blink"),
    ("minsu_talk_to_talkblink", 5.00, "minsu", "talk", "talk_blink"),
    ("pigeon_neutral_to_open", 14.20, "pigeon", "neutral", "open"),
]


def swaps():
    rep = {}
    for name, t, who, e0, e1 in SWAPS:
        a = render_forced(t, who, e0); b = render_forced(t, who, e1)
        fb = R.face_box(t)
        cx, cy = (fb[0] + fb[2]) / 2, (fb[1] + fb[3]) / 2
        hw = max(fb[2] - fb[0], fb[3] - fb[1]) * 0.75
        x0, x1 = int(max(0, cx - hw)), int(min(R.W, cx + hw)); y0, y1 = int(max(0, cy - hw)), int(min(R.H, cy + hw))
        A8, B8 = to8(a[y0:y1, x0:x1]), to8(b[y0:y1, x0:x1])
        d = np.abs(A8.astype(np.int16) - B8.astype(np.int16)).max(2)
        changed = cv2.dilate((d > 40).astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
        j = jitter(A8, B8, changed)
        heat = np.zeros_like(A8); heat[..., 0] = np.clip(d * 3, 0, 255)
        row = np.hstack([label(A8, e0), label(B8, e1), label(heat, f"diff  (stable-part shift {j:.2f} px)", 26)])
        cv2.imwrite(os.path.join(RV, "swaps", name + ".png"), cv2.cvtColor(row, cv2.COLOR_RGB2BGR))
        rep[name] = {"t": t, "residual_shift_px_on_screen": round(j, 3), "crop": [x0, y0, x1, y1]}
        print(f"{name:26s} stable-part shift {j:.3f} px")
    json.dump(rep, open(os.path.join(HERE, "out", "swap_jitter.json"), "w"), indent=1)


def arm_stills():
    L3 = R.LINES["L3"]
    for nm, t in [("rest_before_point", L3["t"] - 0.05), ("point_peak", L3["t"] + 0.55), ("flick", L3["t"] + 2.25), ("settled", L3["t"] + 3.6)]:
        fr, _ = R.render(t)
        im = label(to8(fr), f"{nm}  t={t:.2f}s", 40)
        cv2.imwrite(os.path.join(RV, "arm", f"arm_{nm}.png"), cv2.cvtColor(im, cv2.COLOR_RGB2BGR))
        crop = to8(fr[760:1500, 0:820])
        cv2.imwrite(os.path.join(RV, "arm", f"arm_{nm}_crop.png"), cv2.cvtColor(crop, cv2.COLOR_RGB2BGR))


def gemini_vs_ours():
    g = cv2.cvtColor(cv2.imread(DEMO_FRAME), cv2.COLOR_BGR2RGB)
    gc = g[60:720, 300:1000]                                       # Sera and her pointing arm in the demo
    t = R.LINES["L3"]["t"] + 2.27
    fr, _ = R.render(t)
    oc = to8(fr[180:1275, 0:1080])                                  # ours: face, shoulder, arm and hand (above the subtitles)
    h = 900
    gc = cv2.resize(gc, (int(gc.shape[1] * h / gc.shape[0]), h), interpolation=cv2.INTER_LANCZOS4)
    oc = cv2.resize(oc, (int(oc.shape[1] * h / oc.shape[0]), h), interpolation=cv2.INTER_LANCZOS4)
    gap = np.full((h, 24, 3), 30, np.uint8)
    out = np.hstack([label(gc, "Gemini demo, 4.5 s: arm floats beside the shoulder", 30), gap,
                     label(oc, f"ours, {t:.2f} s: sleeve comes out of the cardigan shoulder", 30)])
    cv2.imwrite(os.path.join(RV, "gemini_vs_ours_arm.png"), cv2.cvtColor(out, cv2.COLOR_RGB2BGR))
    print("side by side ->", os.path.join(RV, "gemini_vs_ours_arm.png"))


if __name__ == "__main__":
    what = sys.argv[1:] or ["swaps", "arm", "gemini"]
    if "swaps" in what: swaps()
    if "arm" in what: arm_stills()
    if "gemini" in what: gemini_vs_ours()
