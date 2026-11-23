"""Cut-out helpers: background by flood fill from the sheet edges, parts by connected components, edge alpha by unmixing
the outline ink from the local background colour, edge colour decontamination and a ~1 px choke.

Why not a colour key: the eyes, skin and shirts are as white as the sheet. A flood fill from the sheet border only takes the
white that is connected to the outside, so a white that is enclosed by an outline stays opaque. The only open whites are the
shirt fronts at the bottom of the busts (the bust is cut there): a barrier closes that opening before the fill.
"""
import cv2
import numpy as np
from scipy import ndimage as ndi


def load(path):
    return cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0


def lum(x):
    return x[..., 0] * .299 + x[..., 1] * .587 + x[..., 2] * .114


def poly_bg(img, mask, deg=3):
    """smooth background model: per-channel 2D polynomial fitted to the pixels in mask"""
    h, w = mask.shape
    ys, xs = np.nonzero(mask)
    sel = np.random.default_rng(0).choice(len(xs), min(len(xs), 40000), replace=False)
    xs, ys = xs[sel], ys[sel]
    def terms(x, y):
        x = x / w * 2 - 1; y = y / h * 2 - 1
        return np.stack([x ** i * y ** j for i in range(deg + 1) for j in range(deg + 1 - i)], -1)
    A = terms(xs.astype(np.float32), ys.astype(np.float32))
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    T = terms(xx.ravel(), yy.ravel())
    out = np.zeros_like(img)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, img[ys, xs, c], rcond=None)
        out[..., c] = (T @ coef).reshape(h, w)
    return out


def local_bg(img, bgmask, sigma=6):
    """local background colour everywhere: normalised convolution of the background pixels (fills the figure area too)"""
    m = bgmask.astype(np.float32)
    num = np.stack([cv2.GaussianBlur(img[..., c] * m, (0, 0), sigma) for c in range(3)], -1)
    den = cv2.GaussianBlur(m, (0, 0), sigma)[..., None]
    out = num / np.maximum(den, 1e-6)
    # where there is no background nearby, fall back to a much wider estimate
    num2 = np.stack([cv2.GaussianBlur(img[..., c] * m, (0, 0), sigma * 8) for c in range(3)], -1)
    den2 = cv2.GaussianBlur(m, (0, 0), sigma * 8)[..., None]
    wide = num2 / np.maximum(den2, 1e-6)
    k = np.clip(den / 0.05, 0, 1)
    return out * k + wide * (1 - k)


def flood_background(img, B, tol, barriers=()):
    """pixels connected to the sheet border through pixels within tol of the background model B.
    barriers: list of (x0, y0, x1, y1) line segments drawn as walls before the fill."""
    close = np.abs(img - B).max(2) < tol
    wall = np.zeros(close.shape, np.uint8)
    for (x0, y0, x1, y1) in barriers:
        cv2.line(wall, (int(x0), int(y0)), (int(x1), int(y1)), 1, 2)
    close &= wall == 0
    lab, n = ndi.label(close)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    return np.isin(lab, border)


def bust_barrier(img, box, B, tol, rows=3):
    """the bottom of a bust is a straight cut through the shirt: close it with a wall between the outermost non-background
    pixels a little above the lowest row of the part"""
    x0, y0, x1, y1 = box
    fg = np.abs(img[y0:y1, x0:x1] - B[y0:y1, x0:x1]).max(2) >= tol
    ys = np.nonzero(fg.any(1))[0]
    yb = ys.max() - rows
    xs = np.nonzero(fg[yb])[0]
    return (x0 + xs.min(), y0 + yb, x0 + xs.max(), y0 + yb), y0 + yb


def matte(img, bgmask, B, band_px=2.0, choke=0.6):
    """alpha and decontaminated colour along the silhouette.
    - band: foreground pixels within band_px of the background
    - F (the ink): per-channel minimum of the foreground in a 5x5 window (the outline is the darkest thing at an edge)
    - alpha = projection of (C - B) onto (F - B); colour = F in the band (no background colour left in an edge pixel)
    - choke: the soft edge is pulled in by about choke px (alpha remapped), so no light rim survives the upscale"""
    fg = ~bgmask
    dist_out = ndi.distance_transform_edt(fg)               # distance of a foreground pixel to the background
    band = fg & (dist_out <= band_px)
    big = np.where(fg[..., None], img, 1.0).astype(np.float32)
    F = np.stack([cv2.erode(big[..., c], np.ones((5, 5), np.uint8)) for c in range(3)], -1)
    d = F - B
    den = (d * d).sum(-1)
    a = ((img - B) * d).sum(-1) / np.maximum(den, 1e-6)
    a = np.clip(a, 0, 1)
    weak = den < 0.04                                       # the ink is not darker than the background: a light edge
    a = np.where(weak, 1.0, a)
    alpha = np.where(band, a, fg.astype(np.float32))
    col = np.where(band[..., None] & ~weak[..., None], F, img)
    # choke: in the band remove `choke` px worth of coverage, renormalised so the interior stays 1
    ramp = np.clip(dist_out - choke, 0, 1)
    alpha = np.where(band, np.minimum(alpha, ramp), alpha)
    alpha = np.clip(alpha, 0, 1)
    return alpha.astype(np.float32), col.astype(np.float32)


def components(fg, min_area=1500):
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg.astype(np.uint8), connectivity=8)
    out = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a >= min_area:
            out.append({"label": i, "box": (int(x), int(y), int(x + w), int(y + h)), "area": int(a)})
    return out, lab


def upscale_rgba(rgba, k):
    """premultiplied Lanczos upscale, then a light unsharp on colour and a slight alpha contrast (keeps the line art crisp)"""
    h, w = rgba.shape[:2]
    a = rgba[..., 3:4]
    pm = np.concatenate([rgba[..., :3] * a, a], -1)
    up = cv2.resize(pm, (int(round(w * k)), int(round(h * k))), interpolation=cv2.INTER_LANCZOS4)
    up = np.clip(up, 0, 1)
    A = up[..., 3:4]
    rgb = np.where(A > 1e-4, up[..., :3] / np.maximum(A, 1e-4), 0)
    blur = cv2.GaussianBlur(rgb, (0, 0), k * 0.45)
    rgb = np.clip(rgb + 0.35 * (rgb - blur), 0, 1)
    A = np.clip((A - 0.5) * 1.25 + 0.5, 0, 1)
    return np.concatenate([rgb, A], -1).astype(np.float32)


def save_rgba(path, rgba):
    x = (np.clip(rgba, 0, 1) * 255 + .5).astype(np.uint8)
    cv2.imwrite(path, cv2.cvtColor(x, cv2.COLOR_RGBA2BGRA))


def load_rgba(path):
    x = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    return cv2.cvtColor(x, cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255.0


def over(dst_rgb, rgba):
    a = rgba[..., 3:4]
    return dst_rgb * (1 - a) + rgba[..., :3] * a


def fringe_stats(rgba, ink_lum=0.35):
    """white/grey fringe measure on the silhouette: composite on black and look at the outer edge ring (pixels with
    alpha > 0.02 within 1.5 px of transparency). Where the local ink is dark (5x5 min luminance under ink_lum), an edge
    pixel counts as fringe if its composited luminance is more than 0.12 above the ink's. Returns (count, ring size, worst)."""
    a = rgba[..., 3]
    vis = a > 0.02
    dist = ndi.distance_transform_edt(vis)
    ring = vis & (dist <= 1.5)
    comp = rgba[..., :3] * a[..., None]
    L = lum(comp)
    Lsolid = np.where(a > 0.9, lum(rgba[..., :3]), 1.0)
    ink = cv2.erode(Lsolid.astype(np.float32), np.ones((5, 5), np.uint8))
    test = ring & (ink < ink_lum)
    excess = np.where(test, L - ink, 0)
    bad = test & (excess > 0.12)
    return int(bad.sum()), int(test.sum()), float(excess.max() if test.any() else 0)
