"""Cut every character sheet into parts (assets/parts/<name>.png, RGBA at sheet resolution, edge colours decontaminated)
and write the fringe report (out/cutout.json) and 200% review crops on a dark background (review/cutout/).
  python tools/cutout.py
"""
import json, os, sys
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cutlib as C

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(HERE, "assets")
P = os.path.join(A, "parts")
RV = os.path.join(HERE, "review", "cutout")
os.makedirs(P, exist_ok=True); os.makedirs(RV, exist_ok=True)

# parts are named by where they sit on the sheet (components sorted top-to-bottom, left-to-right)
SHEETS = {
    "02_parts_sera_expressions_walk.jpg": {
        "bg": "white", "tol": 0.10, "busts": 4,
        "names": {(1, 0): "sera_neutral", (1, 1): "sera_talk", (1, 2): "sera_angry", (1, 3): "sera_blink",
                  (2, 0): "sera_walk1", (2, 1): "sera_walk2", (2, 2): "arm_point", (2, 3): "arm_phone"}},
    "04_parts_minsu_pigeon_expressions.jpg": {
        "bg": "white", "tol": 0.10, "busts": 3,
        "names": {(1, 0): "minsu_neutral", (1, 1): "minsu_talk", (1, 2): "minsu_blink",
                  (2, 0): "pigeon_neutral", (2, 1): "pigeon_open", (2, 2): "pigeon_walk"}},
    "03_char_minsu_pigeon_duo.jpg": {
        "bg": "model", "tol": 0.13, "busts": 0,
        "names": {(1, 0): "minsu_full", (1, 1): "pigeon_full"}},
    "01_char_sera_solo.jpg": {
        "bg": "model", "tol": 0.11, "busts": 0,
        "names": {(1, 0): "sera_full"}},
}


def rows_of(comps):
    """group components into rows by vertical overlap, then sort each row left to right"""
    comps = sorted(comps, key=lambda c: c["box"][1])
    rows = []
    for c in comps:
        for r in rows:
            if c["box"][1] < max(x["box"][3] for x in r) - 40:
                r.append(c); break
        else:
            rows.append([c])
    return [sorted(r, key=lambda c: c["box"][0]) for r in rows]


def process(fname, cfg):
    img = C.load(os.path.join(A, fname))
    h, w = img.shape[:2]
    if cfg["bg"] == "white":
        B = np.full_like(img, np.median(np.concatenate([img[:4].reshape(-1, 3), img[-4:].reshape(-1, 3)]), 0))
    else:
        border = np.zeros((h, w), bool); border[:6] = border[-6:] = True; border[:, :6] = border[:, -6:] = True
        B = C.poly_bg(img, border, deg=2)
    tol = cfg["tol"]
    # first pass, to find the parts (and the busts' bottoms)
    bg0 = C.flood_background(img, B, tol)
    comps, _ = C.components(~bg0, 1500)
    rows = rows_of(comps)
    barriers, cut_rows = [], {}
    if cfg["busts"]:
        for c in rows[0][:cfg["busts"]]:
            seg, yb = C.bust_barrier(img, c["box"], B, tol)
            barriers.append(seg); cut_rows[c["box"]] = yb
    bg = C.flood_background(img, B, tol, barriers)
    if cfg["bg"] == "model":                                  # refit the background on everything the fill found, fill again
        B = C.local_bg(img, bg, sigma=10)
        bg = C.flood_background(img, B, tol, barriers)
        B = C.local_bg(img, bg, sigma=6)
    else:
        B = C.local_bg(img, bg, sigma=6)
    # bust bottoms: everything below the barrier row inside the bust's box is background (the cut is straight)
    for box, yb in cut_rows.items():
        x0, y0, x1, y1 = box
        bg[yb + 1:y1 + 2, x0 - 2:x1 + 2] = True
    fg = ~bg
    # drop specks (JPEG noise, stray marks)
    comps, lab = C.components(fg, 400)
    keep = np.isin(lab, [c["label"] for c in comps])
    fg &= keep; bg = ~fg
    alpha, col = C.matte(img, bg, B)
    comps, lab = C.components(alpha > 0.02, 1500)
    rows = rows_of(comps)
    report = {}
    for ri, r in enumerate(rows, 1):
        for ci, c in enumerate(r):
            name = cfg["names"].get((ri, ci))
            if not name:
                print("  unnamed part", fname, ri, ci, c["box"]); continue
            x0, y0, x1, y1 = c["box"]
            m = 6
            X0, Y0, X1, Y1 = max(0, x0 - m), max(0, y0 - m), min(w, x1 + m), min(h, y1 + m)
            sel = (lab[Y0:Y1, X0:X1] == c["label"])
            sel = cv2.dilate(sel.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
            a = alpha[Y0:Y1, X0:X1] * sel
            rgba = np.concatenate([col[Y0:Y1, X0:X1], a[..., None]], -1)
            C.save_rgba(os.path.join(P, name + ".png"), rgba)
            # naive cut for comparison: the same mask, hard alpha, original colours
            naive = np.concatenate([img[Y0:Y1, X0:X1], (a > 0.02)[..., None].astype(np.float32)], -1)
            cut_y = cut_rows.get(c["box"])
            ex = slice(0, (cut_y - Y0 - 3) if cut_y else None)       # the bust's straight bottom cut is not an outline
            fb = C.fringe_stats(rgba[ex]); fn = C.fringe_stats(naive[ex])
            report[name] = {"sheet": fname, "box_on_sheet": [X0, Y0, X1, Y1], "size": [X1 - X0, Y1 - Y0],
                            "bust_cut_row": (cut_y - Y0) if cut_y else None,
                            "fringe_px": fb[0], "edge_px_tested": fb[1], "worst_excess": round(fb[2], 3),
                            "naive_fringe_px": fn[0], "naive_worst_excess": round(fn[2], 3)}
            print(f"  {name:15s} {X1-X0}x{Y1-Y0}  fringe {fb[0]}/{fb[1]} (worst {fb[2]:.2f})   naive cut {fn[0]}/{fn[1]} (worst {fn[2]:.2f})")
    return report


def review(names):
    """200% crops on a dark background, ours next to the naive (colour-key-style hard) cut"""
    for n in names:
        rgba = C.load_rgba(os.path.join(P, n + ".png"))
        h, w = rgba.shape[:2]
        up = cv2.resize(rgba, (w * 2, h * 2), interpolation=cv2.INTER_NEAREST)
        dark = np.full(up.shape[:2] + (3,), (0.11, 0.12, 0.16), np.float32)
        out = C.over(dark, up)
        cv2.imwrite(os.path.join(RV, n + "_200.png"), cv2.cvtColor((out * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))


def main():
    rep = {}
    for f, cfg in SHEETS.items():
        print(f)
        rep.update(process(f, cfg))
    json.dump(rep, open(os.path.join(HERE, "out", "cutout.json"), "w"), indent=1)
    review(list(rep))


if __name__ == "__main__":
    main()
