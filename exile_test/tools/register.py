"""Register every expression variant to its neutral bust so swapping them does not move the face.

For each variant: a first alignment by phase correlation, then the regions that really differ (mouth, eyes, brows, beak)
are found from the difference image and left out, and an affine ECC fit on everything else (hair outline, face outline,
ears, clothes) refines the alignment to a fraction of a pixel. The variant is resampled into the neutral's frame.
Jitter is measured before and after on the stable region: phase-correlation shift (px at sheet scale, and at the frame
scale the shot uses) and the mean absolute luminance difference.
  python tools/register.py            -> assets/parts/reg/*.png, out/register.json, review/register/*.png
"""
import json, os, sys
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cutlib as C

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(HERE, "assets", "parts")
REG = os.path.join(P, "reg")
RV = os.path.join(HERE, "review", "register")
os.makedirs(REG, exist_ok=True); os.makedirs(RV, exist_ok=True)
GROUPS = {"sera": ["sera_neutral", "sera_talk", "sera_angry", "sera_blink"],
          "minsu": ["minsu_neutral", "minsu_talk", "minsu_blink"],
          "pigeon": ["pigeon_neutral", "pigeon_open"]}
FRAME_SCALE = {"sera": 3.4, "minsu": 2.9, "pigeon": 3.2}    # roughly the on-screen scale of each bust (for the report)


def pad_to(x, h, w):
    out = np.zeros((h, w, 4), np.float32)
    out[:x.shape[0], :x.shape[1]] = x[:h, :w]
    return out


def gray(rgba):
    return cv2.GaussianBlur((C.lum(rgba[..., :3]) * rgba[..., 3] + (1 - rgba[..., 3])).astype(np.float32), (0, 0), 0.8)


def warp(rgba, M, w, h):
    a = rgba[..., 3:4]
    pm = np.concatenate([rgba[..., :3] * a, a], -1)
    o = cv2.warpAffine(pm, M, (w, h), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    o = np.clip(o, 0, 1)
    A = o[..., 3:4]
    return np.concatenate([np.where(A > 1e-4, o[..., :3] / np.maximum(A, 1e-4), 0), A], -1).astype(np.float32)


def stable_mask(ref, var_aligned):
    """where ref and the (roughly aligned) variant agree; the parts that change are dilated generously and removed"""
    d = np.abs(gray(ref) - gray(var_aligned))
    change = cv2.dilate((d > 0.25).astype(np.uint8), np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(change)
    big = np.zeros_like(change)
    for i in range(1, n):
        if st[i, 4] > 25: big[lab == i] = 1                    # ignore single-pixel line disagreements (that is the jitter itself)
    big = cv2.dilate(big, np.ones((15, 15), np.uint8))
    sup = (ref[..., 3] > 0.5) | (var_aligned[..., 3] > 0.5)
    sup = cv2.dilate(sup.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    return (sup & (big == 0)), big > 0


def measure(ref, var, mask):
    """residual translation between ref and var on the stable region: a translation-only ECC fit from zero (sub-pixel),
    plus the mean absolute luminance difference there"""
    g1, g2 = gray(ref), gray(var)
    T = np.array([[1, 0, 0], [0, 1, 0]], np.float32)
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
    _, T = cv2.findTransformECC(g1, g2, T, cv2.MOTION_TRANSLATION, crit, mask.astype(np.uint8), 3)
    sx, sy = float(T[0, 2]), float(T[1, 2])
    mad = float(np.abs(g1 - g2)[mask].mean())
    return float(np.hypot(sx, sy)), (sx, sy), mad


def main():
    rep = {}
    for grp, names in GROUPS.items():
        ref0 = C.load_rgba(os.path.join(P, names[0] + ".png"))
        H = max(C.load_rgba(os.path.join(P, n + ".png")).shape[0] for n in names) + 4
        W = max(C.load_rgba(os.path.join(P, n + ".png")).shape[1] for n in names) + 4
        ref = pad_to(ref0, H, W)
        C.save_rgba(os.path.join(REG, names[0] + ".png"), ref)
        for n in names[1:]:
            var = pad_to(C.load_rgba(os.path.join(P, n + ".png")), H, W)
            g1, g2 = gray(ref), gray(var)
            win = cv2.createHanningWindow((W, H), cv2.CV_32F)
            (sx, sy), _ = cv2.phaseCorrelate(g1, g2, win)
            M = np.array([[1, 0, sx], [0, 1, sy]], np.float32)      # maps ref coords -> variant coords
            stable, change = stable_mask(ref, warp(var, M, W, H))
            before = measure(ref, var, stable)
            for it in range(2):
                crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7)
                _, M = cv2.findTransformECC(g1, g2, M.copy(), cv2.MOTION_AFFINE, crit, stable.astype(np.uint8), 5)
                stable, change = stable_mask(ref, warp(var, M, W, H))
            out = warp(var, M, W, H)
            after = measure(ref, out, stable)
            C.save_rgba(os.path.join(REG, n + ".png"), out)
            k = FRAME_SCALE[grp]
            sc = float(np.sqrt(abs(np.linalg.det(M[:, :2]))))
            rep[n] = {"ref": names[0], "affine_ref_to_variant": np.round(M, 4).tolist(), "scale": round(sc, 4),
                      "stable_px": int(stable.sum()),
                      "before": {"shift_px_sheet": round(before[0], 3), "shift_px_frame": round(before[0] * k, 2), "mad": round(before[2], 4)},
                      "after": {"shift_px_sheet": round(after[0], 3), "shift_px_frame": round(after[0] * k, 2), "mad": round(after[2], 4)}}
            print(f"{n:14s} shift {before[0]:.2f} -> {after[0]:.3f} px (sheet), {before[0]*k:.1f} -> {after[0]*k:.2f} px on screen; "
                  f"stable-region diff {before[2]:.4f} -> {after[2]:.4f}; scale {sc:.4f}")
            # review: ref | variant | |diff| on the stable region before and after (red = disagreement)
            def diffimg(v):
                d = np.abs(gray(ref) - gray(v)); im = np.stack([np.clip(d * 3, 0, 1), np.zeros_like(d), np.zeros_like(d)], -1)
                im = np.where(stable[..., None], im, im * 0.25 + 0.15)
                return im
            dark = np.full((H, W, 3), (0.12, 0.13, 0.17), np.float32)
            row = np.hstack([C.over(dark, ref), C.over(dark, out), diffimg(var), diffimg(out)])
            row = cv2.resize(row, (row.shape[1] * 2, row.shape[0] * 2), interpolation=cv2.INTER_NEAREST)
            cv2.imwrite(os.path.join(RV, n + "_vs_" + names[0] + ".png"), cv2.cvtColor((np.clip(row, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
    json.dump(rep, open(os.path.join(HERE, "out", "register.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
