"""Build the rigs from the registered parts (assets/parts/reg) -> assets/rig/ (4x layers, weight maps, rig.json).

SERA  The busts are medallions: the cardigan's outer edge curves in under the shoulders. A torso continues the bust down to
      the frame bottom (layer "ext", drawn behind the bust): the sleeves hang straight from the widest point of the shoulders,
      the front bands and the shirt continue from the bust's last rows, and the knit and rib textures are the bust's own
      (mirror-tiled samples), with an outline on the outer edges. The bust's lower edge is feathered into it.
      "ext_arm" is the same torso without the left sleeve: in the arm shot the pointing arm takes that sleeve's place.
      The pointing arm is the sheet's own arm, mirrored to her right side (screen left), at the SAME sheet scale as the bust
      (its upper arm is 43 px wide, the bust's side panel at the widest row is 43 px wide), pivot at the centre of its cap.
MINSU The pack's busts have no cup and no hand. The duo sheet (03) has Minsu holding the iced americano; its head is replaced
      by the registered busts (same head size: eye distance 78 vs 80 px, eye-to-chin 111 vs 111 px), the bust's hood ring sits
      on the duo sheet's hood and is feathered into the hoodie, and its slate tint is matched to the hoodie's grey.
PIGEON neutral and beak-open busts as they are.
Everything is upscaled 4x (premultiplied Lanczos + light unsharp) so the shots downsample.
  python tools/build_rig.py
"""
import json, os, sys
import cv2
import numpy as np
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cutlib as C

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REG = os.path.join(HERE, "assets", "parts", "reg")
PARTS = os.path.join(HERE, "assets", "parts")
RIG = os.path.join(HERE, "assets", "rig")
RV = os.path.join(HERE, "review", "rig")
os.makedirs(RIG, exist_ok=True); os.makedirs(RV, exist_ok=True)
K = 4                      # rig layers are stored at 4x the sheet resolution
INK = np.array([0.06, 0.06, 0.07], np.float32)


def blur(x, s):
    return cv2.GaussianBlur(x.astype(np.float32), (0, 0), s)


def mirror_tile(patch, h, w, ox=0, oy=0):
    """fill h x w by mirror-tiling the patch (seamless: every tile edge meets its own mirror image)"""
    p = np.concatenate([patch, patch[:, ::-1]], 1)
    p = np.concatenate([p, p[::-1]], 0)
    ry, rx = int(np.ceil((h + oy) / p.shape[0])) + 1, int(np.ceil((w + ox) / p.shape[1])) + 1
    big = np.tile(p, (ry, rx, 1))
    return big[oy:oy + h, ox:ox + w]


def stroke(mask_h, pts, width, img_a, color, alpha=1.0):
    """draw an anti-aliased polyline into an RGBA float image (at 1x, supersampled 8x)"""
    S = 8
    h, w = mask_h
    m = np.zeros((h * S, w * S), np.uint8)
    p = (np.array(pts) * S).astype(np.int32)
    cv2.polylines(m, [p], False, 255, max(1, int(round(width * S))), cv2.LINE_AA)
    a = cv2.resize(m.astype(np.float32) / 255, (w, h), interpolation=cv2.INTER_AREA) * alpha
    img_a[..., :3] = img_a[..., :3] * (1 - a[..., None]) + color * a[..., None]
    img_a[..., 3] = np.maximum(img_a[..., 3], a)


# ------------------------------------------------------------------------------------------------------------------ SERA
def sera():
    N = C.load_rgba(os.path.join(REG, "sera_neutral.png"))
    H0, W = N.shape[:2]
    EXT = 330
    H = H0 + EXT
    a = N[..., 3] > 0.5
    L = C.lum(N[..., :3])
    rows = np.nonzero(a.any(1))[0]
    y_cut = int(rows.max())                                     # the bust's straight bottom row
    width = [(np.nonzero(a[y])[0].max() - np.nonzero(a[y])[0].min(), y) for y in range(150, y_cut)]
    y_w = max(width)[1]
    xl = int(np.nonzero(a[y_w])[0].min()); xr = int(np.nonzero(a[y_w])[0].max())
    xc = (xl + xr) / 2
    # the shirt at the bottom rows: the light run in the middle
    def shirt_run(y):
        r = (L[y] > 0.8) & a[y]
        xs = np.nonzero(r[int(xc) - 40:int(xc) + 40])[0] + int(xc) - 40
        return int(xs.min()), int(xs.max())
    sl, sr = shirt_run(y_cut - 4)
    BW = 19                                                     # band width at the bottom (measured: 64..83 and 141..159)
    SLEEVE = 41                                                 # sleeve width; the side panel at the widest row is 43 px
    print(f"sera: canvas {W}x{H} (bust {H0}), widest row y={y_w} x {xl}..{xr}, bottom cut y={y_cut}, shirt {sl}..{sr}")

    # textures from the bust itself
    kx, ky = None, None                                         # a clean knit patch: fully opaque, no light pixels
    for y in range(y_w, y_w + 24):
        for x in range(xl + 1, xl + 40):
            if N[y:y + 16, x:x + 24, 3].min() > 0.99 and L[y:y + 16, x:x + 24].max() < 0.45:
                kx, ky = x, y; break
        if kx is not None: break
    knit = N[ky:ky + 16, kx:kx + 24, :3]
    # rib bands: horizontal ribs at the bust's rib pitch (6.5 px), in the bust's band colours
    bandpx = N[y_cut - 26:y_cut - 4, sl - BW:sl - 2, :3].reshape(-1, 3)
    bl = C.lum(bandpx)
    rib_light = np.median(bandpx[bl > np.percentile(bl, 60)], 0)
    rib_dark = np.median(bandpx[bl < np.percentile(bl, 12)], 0)
    shirt_col = np.median(N[y_cut - 12:y_cut - 2, sl + 4:sr - 4, :3].reshape(-1, 3), 0)

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    y0 = y_w - 6                                                # the torso starts under the bust's widest row
    taper = 0.045
    xL = xl + 0.4 + taper * np.clip(yy - y_w, 0, None)
    xR = xr - 0.4 - taper * np.clip(yy - y_w, 0, None)
    inside = (yy >= y0) & (xx >= xL) & (xx <= xR)
    ext = np.zeros((H, W, 4), np.float32)
    tex = mirror_tile(knit, H, W, 5, 3)
    ext[..., :3] = tex
    # front bands (rib) and shirt, straight down from the bust's last rows
    bL0, bL1, bR0, bR1 = sl - BW - 1, sl - 1, sr + 1, sr + BW + 1
    ph = (yy[:, :BW] % 6.5) / 6.5
    line = np.exp(-((ph - 0.5) / 0.11) ** 2)[..., None]
    rib = rib_light * (1 - line) + rib_dark * line
    ext[:, bL0:bL1, :3] = rib
    ext[:, bR0:bR1, :3] = rib[:, :bR1 - bR0]
    shade = 1 - 0.05 * np.exp(-np.minimum(np.abs(xx - sl), np.abs(xx - sr)) / 5)
    shirt = (xx >= sl - 1) & (xx <= sr + 1)
    ext[..., :3] = np.where(shirt[..., None], shirt_col * shade[..., None], ext[..., :3])
    ext[..., 3] = inside.astype(np.float32)
    # soft anti-aliased outer edge
    ext[..., 3] *= np.clip(np.minimum(xx - xL, xR - xx) + 0.5, 0, 1)
    # outlines: outer edges, band/shirt, arm creases (from the armpit down, fading in)
    yl = np.arange(y0, H)
    stroke((H, W), np.stack([xl + 0.9 + taper * np.clip(yl - y_w, 0, None), yl], 1), 1.6, ext, INK)
    stroke((H, W), np.stack([xr - 0.9 - taper * np.clip(yl - y_w, 0, None), yl], 1), 1.6, ext, INK)
    for x in (sl - 0.5, sr + 0.5):
        stroke((H, W), [[x, y_cut - 20], [x, H]], 1.1, ext, INK, 0.9)
    yc0 = y_w + 18
    ycr = np.arange(yc0, H)
    for side in (-1, 1):
        x0 = (xl + SLEEVE) if side < 0 else (xr - SLEEVE)
        pts = np.stack([x0 + side * -taper * (ycr - y_w), ycr], 1)
        stroke((H, W), pts, 1.0, ext, INK, 0.75)
    ext[..., 3] *= inside
    bust_sil = np.zeros((H, W), np.float32); bust_sil[:H0] = cv2.dilate((N[..., 3] > 0.5).astype(np.uint8), np.ones((3, 3), np.uint8))
    ext[..., 3] *= np.where(yy < y_w + 3, bust_sil, 1.0)
    # the arm shot's torso: the left sleeve removed, its crease becomes the torso's outer edge (a full outline)
    ext_arm = ext.copy()
    UNDER = 12                                                   # torso kept under the arm's inner edge
    x_crease = xl + SLEEVE - UNDER - taper * (yy - y_w)
    cut = (xx < x_crease - 0.5) & (yy > y_w + 2)
    ext_arm[..., 3] *= np.clip(xx - x_crease + 1.0, 0, 1) * (yy > y_w + 2) + (yy <= y_w + 2)
    pts = np.stack([xl + SLEEVE - UNDER - taper * (ycr - y_w) + 0.6, ycr], 1)
    stroke((H, W), pts, 1.7, ext_arm, INK)

    # busts on the extended canvas, lower edge feathered into the torso
    def on_canvas(img):
        out = np.zeros((H, W, 4), np.float32); out[:H0] = img
        al = out[..., 3]
        inner = ndi.distance_transform_edt(al > 0.5)
        lower = (yy > y_w + 1)
        al2 = np.where(lower, al * np.clip((inner - 0.5) / 3.0, 0, 1), al)
        out[..., 3] = al2
        return out
    busts = {n: on_canvas(C.load_rgba(os.path.join(REG, f"sera_{n}.png"))) for n in ["neutral", "talk", "angry", "blink"]}

    # eye region for blinks (where blink differs from neutral, upper face only) and mouth region (angry jaw squash)
    def diff_region(n1, n2, ymin, ymax, grow):
        d = np.abs(C.lum(busts[n1][..., :3]) * busts[n1][..., 3] - C.lum(busts[n2][..., :3]) * busts[n2][..., 3])
        m = (d > 0.2) & (yy > ymin) & (yy < ymax)
        lab, n = ndi.label(m)
        sizes = ndi.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 15])
        m = cv2.dilate(m.astype(np.uint8), np.ones((grow, grow), np.uint8)).astype(np.float32)
        return blur(m, grow / 4)
    # face geometry from the bust: eyes are the reddest dark blobs, the mouth the reddest light-red region
    eyes = diff_region("neutral", "blink", 95, 140, 9) * ((xx > 40) & (xx < 185))
    mouth_a = diff_region("neutral", "angry", 150, 215, 7)
    ys, xs = np.nonzero(eyes > 0.5)
    eye_box = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    ys, xs = np.nonzero(mouth_a > 0.5)
    mouth_box = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    # the angry bust's open mouth (dark interior and red lips inside the mouth box): rows and columns
    An = busts["angry"]; La = C.lum(An[..., :3]); red = An[..., 0] - An[..., 1]
    box = (yy > 148) & (yy < 186) & (xx > 85) & (xx < 140)
    inner = box & (La < 0.25) & (yy < 178)                      # the jaw line starts a few px under the lower lip
    lips = box & (red > 0.2)
    rows_dark = np.nonzero(inner.sum(1) > 10)[0]                 # rows of the open mouth's dark interior
    m_top, last_dark = int(rows_dark.min()), int(rows_dark.max())
    ly = np.nonzero(lips.sum(1) > 4)[0]
    m_lip0 = int(ly[ly > last_dark].min()); m_lip1 = int(ly[ly > last_dark].max())
    ix = np.nonzero(inner[m_top:last_dark + 1].sum(0) > 3)[0]
    mx0, mx1 = int(ix.min()), int(ix.max())
    fy = np.interp(yy[:, 0], [m_top, m_lip0, m_lip1, m_lip1 + 4], [0, 1, 1, 0])
    fx = np.interp(xx[0], [mx0 - 6, mx0 + 4, mx1 - 4, mx1 + 6], [0, 1, 1, 0])
    lift = (fy[:, None] * fx[None, :]).astype(np.float32)
    print("  angry mouth: interior from y", m_top, "lower lip", m_lip0, "-", m_lip1, "x", mx0, "-", mx1)
    angry_mouth = {"top": m_top, "lip0": m_lip0, "lip1": m_lip1, "x0": mx0, "x1": mx1}
    print("  eye region", eye_box, "angry mouth region", mouth_box)
    # blink composites: the blink bust's eyes over each mouth state
    comp = {}
    for n in ["neutral", "talk", "angry"]:
        comp[n] = busts[n]
        if n != "angry":                                         # no angry blink: her rage shot holds her eyes open
            e = eyes[..., None]
            b = busts["blink"]
            pm = busts[n][..., :3] * busts[n][..., 3:] * (1 - e) + b[..., :3] * b[..., 3:] * e
            al = busts[n][..., 3:] * (1 - e) + b[..., 3:] * e
            comp[n + "_blink"] = np.concatenate([pm / np.maximum(al, 1e-4), al], -1)

    # head / hair-tip / chest weight maps (1x) for the mesh
    head = (a & (yy[:H0] < 207)).astype(np.uint8)
    dark = (L < 0.25) & a & (yy[:H0] < 206)                      # above the cardigan's neckline only
    lab, n = ndi.label(dark)
    top_labels = np.unique(lab[:150][lab[:150] > 0])
    hair = np.isin(lab, top_labels)                              # dark pixels connected to the hair mass
    headm = np.zeros((H, W), np.float32)
    headm[:H0] = ((head > 0) | hair).astype(np.float32)
    w_head = np.clip(blur(headm, 4.0) * 1.15, 0, 1)
    w_head[:150] = np.maximum(w_head[:150], headm[:150])
    tips = np.zeros((H, W), np.float32)
    tips[:H0] = hair & (yy[:H0] > 120) & (np.abs(xx[:H0] - xc) > 52)
    w_tips = blur(tips, 3.0) * np.clip((yy - 120) / 80, 0, 1)
    # head/face region for the arm check: hair + face + ears (the bust above the neck), its own mask
    face_hair = np.zeros((H, W), bool); face_hair[:H0] = (a & (yy[:H0] < 200)) | hair
    shoulder_line = []
    for x in range(W):
        col = np.nonzero(busts["neutral"][:, x, 3] > 0.5)[0]
        col = col[col > 205]
        shoulder_line.append(int(col.min()) if len(col) else -1)

    # the pointing arm: mirrored to her right side (screen left), pivot at its cap centre
    arm = C.load_rgba(os.path.join(PARTS, "arm_point.png"))
    aa = arm[..., 3] > 0.5
    ys_, xs_ = np.nonzero(aa)
    top = ys_.min()
    ua = aa[:, :70]                                              # the upper arm is the left 70 px of the sprite
    upper_w = float(np.mean([np.ptp(np.nonzero(r)[0]) + 1 for r in ua[top + 16:top + 64] if r.any()]))
    cx_cap = float(np.mean([np.nonzero(r)[0].mean() for r in ua[top + 14:top + 26] if r.any()]))
    pivot = (cx_cap, top + upper_w / 2)                          # centre of the round cap
    armL = arm[:, ::-1].copy()
    pivotL = (arm.shape[1] - 1 - pivot[0], pivot[1])
    # side panel width at the widest row: from the outer edge to the band's outer edge (band = BW px left of the skin)
    skin = np.nonzero((L[y_w + 2, :int(xc)] > 0.8) & a[y_w + 2, :int(xc)])[0]
    panel_w = int(skin.min() - BW - xl)
    print(f"  arm: upper arm {upper_w:.1f} px wide, bust side panel {panel_w} px -> scale 1.0 (same sheet); pivot {pivotL}")

    # upscale and save
    def up(x): return C.upscale_rgba(x, K)
    C.save_rgba(os.path.join(RIG, "sera_ext.png"), up(ext))
    C.save_rgba(os.path.join(RIG, "sera_ext_arm.png"), up(ext_arm))
    for n, im in comp.items():
        C.save_rgba(os.path.join(RIG, f"sera_{n}.png"), up(im))
    C.save_rgba(os.path.join(RIG, "arm_point_L.png"), up(armL))
    np.savez_compressed(os.path.join(RIG, "sera_maps.npz"), w_head=w_head, w_tips=w_tips, mouth=lift, eyes=eyes,
                        face_hair=face_hair, bust_alpha=busts["neutral"][..., 3])
    return {"canvas_1x": [W, H], "bust_h": H0, "y_w": y_w, "xl": xl, "xr": xr, "xc": xc, "y_cut": y_cut, "shirt": [sl, sr],
            "sleeve_w": SLEEVE, "panel_w": panel_w, "taper": taper, "neck_pivot": [xc, 205], "eye_box": eye_box, "mouth_box": mouth_box, "mouth_open_h": m_lip0 - m_top, "angry_mouth": angry_mouth,
            "arm": {"size_1x": [armL.shape[1], armL.shape[0]], "pivot_1x": list(pivotL), "upper_w": upper_w,
                    "shoulder_1x": [xl + upper_w / 2 + 0.5, y_w + 16]},     # searched: the highest pivot whose cap stays
                                                                         # under the bust above the widest row at every angle
            "shoulder_line": shoulder_line}




# ----------------------------------------------------------------------------------------------------------------- MINSU
# landmarks (eye centres, mouth, chin) picked on grids of the two drawings (review/rig/minsu_landmarks.png shows them)
M04 = np.float32([[92, 159], [172, 159], [135, 228], [132, 270]])     # registered bust frame (04)
M03 = np.float32([[282, 170], [360, 172], [320, 240], [320, 282]])    # duo sheet figure (03, minsu_full.png)
CUP_GROUP = np.int32([[300, 455], [340, 455], [372, 560], [372, 742], [300, 752], [235, 742], [160, 752], [70, 805], [36, 792],
                      [34, 640], [100, 635], [160, 640], [205, 615], [250, 600], [252, 552]])
ELBOW = (52, 716)


def minsu():
    body = C.load_rgba(os.path.join(PARTS, "minsu_full.png"))
    H, W = body.shape[:2]
    S, inl = cv2.estimateAffinePartial2D(M04, M03, method=cv2.LMEDS)
    sc = float(np.hypot(S[0, 0], S[1, 0]))
    res = np.abs((M04 @ S[:, :2].T + S[:, 2]) - M03).max()
    print(f"minsu: bust -> duo figure similarity, scale {sc:.4f}, rotation {np.degrees(np.arctan2(S[1,0],S[0,0])):.2f} deg, max landmark error {res:.1f} px")
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    def place(img):
        a = img[..., 3:4]
        pm = np.concatenate([img[..., :3] * a, a], -1)
        o = np.clip(cv2.warpAffine(pm, S, (W, H), flags=cv2.INTER_LANCZOS4, borderValue=0), 0, 1)
        A = o[..., 3:4]
        return np.concatenate([np.where(A > 1e-4, o[..., :3] / np.maximum(A, 1e-4), 0), A], -1)
    busts = {n: place(C.load_rgba(os.path.join(REG, f"minsu_{n}.png"))) for n in ["neutral", "talk", "blink"]}
    # the bust's hood: slate -> the duo sheet's hoodie grey (same luminance), only below the chin
    hood_ref = body[430:470, 300:340, :3].reshape(-1, 3)
    hood_ref = np.median(hood_ref[C.lum(hood_ref) < 0.35], 0)
    chin_y = M03[3, 1]
    for n, b in busts.items():
        Lb = C.lum(b[..., :3])
        hood = (yy > chin_y - 4) & (Lb < 0.45) & (b[..., 3] > 0.01)
        ratio = hood_ref / max(C.lum(hood_ref[None])[0], 1e-3)
        grey = np.clip(Lb[..., None] * ratio, 0, 1)
        k = blur(hood.astype(np.float32), 1.0)[..., None]
        b[..., :3] = b[..., :3] * (1 - k) + grey * k
        # feather the bust's lower outline (the hood ring's outer edge) into the hoodie
        inner = ndi.distance_transform_edt(b[..., 3] > 0.5)
        low = blur(((yy > chin_y + 8)).astype(np.float32), 2)
        b[..., 3] = b[..., 3] * (1 - low) + b[..., 3] * np.clip((inner - 1) / 7.0, 0, 1) * low
    # the duo figure's own head goes: everything above its hood line, and anything of it the bust would not cover there
    bodyc = body.copy()
    head_zone = (yy < 236)
    bodyc[..., 3] *= ~head_zone
    # blink composite (blink eyes over the talking mouth)
    d = np.abs(C.lum(busts["neutral"][..., :3]) - C.lum(busts["blink"][..., :3])) * busts["neutral"][..., 3]
    em = ((d > 0.2) & (yy > 140) & (yy < 200) & (xx > 250) & (xx < 395)).astype(np.uint8)
    em = blur(cv2.dilate(em, np.ones((9, 9), np.uint8)), 2.5)
    for n in ["neutral", "talk"]:
        b = busts[n]; bl = busts["blink"]; e = em[..., None]
        pm = b[..., :3] * b[..., 3:] * (1 - e) + bl[..., :3] * bl[..., 3:] * e
        al = b[..., 3:] * (1 - e) + bl[..., 3:] * e
        busts[n + "_blink"] = np.concatenate([pm / np.maximum(al, 1e-4), al], -1)
    del busts["blink"]
    # weight maps: head (the bust's head and neck, rigid), cup group (forearm, hand, cup; rotates about the elbow)
    headm = (busts["neutral"][..., 3] > 0.5) & (yy < chin_y + 18)
    w_head = np.clip(blur(headm.astype(np.float32), 4) * 1.15, 0, 1)
    w_head[yy < chin_y - 10] = np.maximum(w_head[yy < chin_y - 10], headm[yy < chin_y - 10])
    hairm = (busts["neutral"][..., 3] > 0.5) & (C.lum(busts["neutral"][..., :3]) < 0.3) & (yy > 95) & (yy < 165) & (np.abs(xx - 321) > 72)
    w_tips = blur(hairm.astype(np.float32), 2.5)
    cup = np.zeros((H, W), np.uint8)
    cv2.fillPoly(cup, [CUP_GROUP], 1)
    w_cup = np.clip(blur(cup.astype(np.float32), 5) * 1.3, 0, 1)
    # review: landmarks and the composite
    dark = np.full((H, W, 3), (0.3, 0.35, 0.42), np.float32)
    comp = C.over(C.over(dark, bodyc), busts["talk"])
    lm = (comp * 255).astype(np.uint8).copy()
    for p in M03: cv2.circle(lm, (int(p[0]), int(p[1])), 3, (255, 60, 60), -1)
    cv2.polylines(lm, [CUP_GROUP], True, (60, 255, 60), 1)
    cv2.circle(lm, ELBOW, 4, (60, 60, 255), -1)
    cv2.imwrite(os.path.join(RV, "minsu_landmarks.png"), cv2.cvtColor(lm, cv2.COLOR_RGB2BGR))
    def up(x): return C.upscale_rgba(x, K)
    C.save_rgba(os.path.join(RIG, "minsu_body.png"), up(bodyc))
    for n, b in busts.items():
        C.save_rgba(os.path.join(RIG, f"minsu_{n}.png"), up(b))
    np.savez_compressed(os.path.join(RIG, "minsu_maps.npz"), w_head=w_head, w_tips=w_tips, w_cup=w_cup)
    return {"canvas_1x": [W, H], "similarity_04_to_03": S.tolist(), "scale": sc, "landmark_err": float(res),
            "eyes": M03[:2].tolist(), "chin": M03[3].tolist(), "neck_pivot": [321, 300], "elbow": list(ELBOW),
            "shoulders_x": [30, 600]}


# ---------------------------------------------------------------------------------------------------------------- PIGEON
def pigeon():
    out = {}
    for n in ["neutral", "open"]:
        im = C.load_rgba(os.path.join(REG, f"pigeon_{n}.png"))
        C.save_rgba(os.path.join(RIG, f"pigeon_{n}.png"), C.upscale_rgba(im, K))
        out[n] = im
    im = out["neutral"]; H, W = im.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = im[..., 3] > 0.5
    # head: above the collar (the white collar's top is the first wide white run below the head)
    Lm = C.lum(im[..., :3])
    collar_y = int(min(y for y in range(60, H) if ((Lm[y] > 0.9) & a[y]).sum() > 40))
    headm = a & (yy < collar_y + 4)
    w_head = np.clip(blur(headm.astype(np.float32), 4) * 1.2, 0, 1)
    print(f"pigeon: {W}x{H}, collar at y={collar_y}")
    np.savez_compressed(os.path.join(RIG, "pigeon_maps.npz"), w_head=w_head)
    return {"canvas_1x": [W, H], "collar_y": collar_y, "neck_pivot": [W * 0.45, collar_y + 6]}


if __name__ == "__main__":
    rig = {"K": K}
    rig["sera"] = sera()
    rig["minsu"] = minsu()
    rig["pigeon"] = pigeon()
    json.dump(rig, open(os.path.join(RIG, "rig.json"), "w"), indent=1)
