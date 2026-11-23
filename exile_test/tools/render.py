"""Render the rigging test: 1080x1920, 30 fps -> out/video.mp4 (no audio), plus the per-frame arm check (out/arm_check.json).
  python tools/render.py video [workers]        # every frame (frame ranges in parallel, then concatenated)
  python tools/render.py stills <dir> t1 t2 ... # chosen frames as PNG
  python tools/render.py armcheck               # only the arm shot's frames, the check and the joint crops

Each character is a stack of layers in its own sheet-pixel ("1x") frame, stored at 4x. Per frame a smooth displacement field
on the 1x grid moves it: breathing (the torso stretches up from the frame bottom, so the chest and shoulders rise), the head
as one rigid piece (hair, face and ears together, so the eyes never leave the face) turning and nodding about the neck, the
hair tips following the head 0.15 s late, and a lean into each of the character's lines. A sway and the lean scale go into the
layer-to-screen transform, with the shot's camera. Every layer of a character is resampled once, straight from its 4x source.
The pointing arm is the sheet's arm, mirrored, drawn between the torso and the bust, its cap under the bust's shoulder and its
pivot riding on the deformed shoulder.
"""
import json, math, os, subprocess, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cutlib as C

cv2.setNumThreads(1)
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920
TL = json.load(open(os.path.join(HERE, "out", "timeline.json")))
FPS = TL["FPS"]; DUR = TL["DUR"]
RIGJ = json.load(open(os.path.join(HERE, "assets", "rig", "rig.json")))
K = RIGJ["K"]
RIG = os.path.join(HERE, "assets", "rig")
A_DIR = os.path.join(HERE, "assets")
LINES = {v["id"]: v for v in TL["VO"]}
SHOTS = TL["SHOTS"]
LISTENER_SIDE = {"SERA": -1, "MINSU": 1, "PARK": -1}
FORCE = {}                 # review hooks: FORCE["sera"|"minsu"|"pigeon"] = expression name (the flick stills)


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def spring(u): return 0.0 if u <= 0 else 1 - math.exp(-6 * u) * (math.cos(11 * u) + 0.55 * math.sin(11 * u))


# ------------------------------------------------------------------------------------------------------------- layers
class Layer:
    """premultiplied RGBA, sampled in 1x coordinates; `kw` pixels per 1x unit"""
    def __init__(self, rgba, kw):
        a = rgba[..., 3:4]
        self.pm = np.ascontiguousarray(np.concatenate([rgba[..., :3] * a, a], -1).astype(np.float32))
        self.kw = kw

    @staticmethod
    def load(name, kw_target=None):
        rgba = C.load_rgba(os.path.join(RIG, name + ".png"))
        kw = K
        if kw_target and kw_target < K * 0.9:                   # pre-shrink for strongly downscaled shots (no aliasing)
            w0 = rgba.shape[1]
            rgba = cv2.resize(rgba, (int(w0 * kw_target / K), int(rgba.shape[0] * kw_target / K)), interpolation=cv2.INTER_AREA)
            kw = K * rgba.shape[1] / w0
        return Layer(rgba, kw)

    def sample(self, px, py):
        mx = (px + 0.5) * self.kw - 0.5
        my = (py + 0.5) * self.kw - 0.5
        return cv2.remap(self.pm, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))


_cache = {}
def layer(name, kw_target=None):
    key = (name, round(kw_target or 0, 2))
    if key not in _cache: _cache[key] = Layer.load(name, kw_target)
    return _cache[key]


def maps(name):
    key = ("maps", name)
    if key not in _cache: _cache[key] = dict(np.load(os.path.join(RIG, name + "_maps.npz")))
    return _cache[key]


def affine(s=1.0, rot=0.0, tx=0.0, ty=0.0, about=(0.0, 0.0)):
    """3x3: scale and rotate about a point, then translate"""
    c, si = math.cos(rot), math.sin(rot)
    ax, ay = about
    M = np.array([[s * c, -s * si, 0], [s * si, s * c, 0], [0, 0, 1]], np.float64)
    T1 = np.array([[1, 0, -ax], [0, 1, -ay], [0, 0, 1]]); T2 = np.array([[1, 0, ax + tx], [0, 1, ay + ty], [0, 0, 1]])
    return T2 @ M @ T1


def tr(tx, ty): return np.array([[1, 0, tx], [0, 1, ty], [0, 0, 1]], np.float64)


# --------------------------------------------------------------------------------------------------- voice-driven state
def mouth_open(line_id, t):
    m = TL["MOUTH"][line_id]
    f = int(round(t * FPS)) - m["f0"]
    return 0 <= f < len(m["open"]) and m["open"][f] == 1


def env(line_id, t):
    m = TL["MOUTH"][line_id]
    f = t * FPS - m["f0"]
    if f < 0 or f >= len(m["env"]) - 1: return 0.0
    i = int(f); u = f - i
    return m["env"][i] * (1 - u) + m["env"][i + 1] * u


def env_smooth(line_id, t, w=0.12):
    return float(np.mean([env(line_id, t + d) for d in np.linspace(-w, w, 7)]))


def blinking(who, t):
    return any(b <= t < b + 3 / FPS for b in TL["BLINKS"].get(who, []))


def lean_amount(who, t):
    """a lean into each of the character's lines: spring in at the start, ease out after the end"""
    a = 0.0
    for v in TL["VO"]:
        if v["who"] != who: continue
        u0 = t - v["t"] + 0.12
        u1 = t - (v["t"] + v["dur"])
        a = max(a, spring(u0 / 0.9) * (1 - ease(u1 / 0.5)) if u0 > 0 else 0.0)
    return a


_onsets = {}
def onsets(line_id):
    if line_id not in _onsets:
        m = TL["MOUTH"][line_id]
        _onsets[line_id] = [(m["f0"] + i) / FPS for i in range(1, len(m["open"])) if m["open"][i] and not m["open"][i - 1]]
    return _onsets[line_id]


def accent(line_id, t, tau=0.12):
    if not line_id: return 0.0
    return min(1.2, sum(math.exp(-(t - o) / tau) for o in onsets(line_id) if 0 <= t - o < 0.6))


def head_params(who, line, t, style):
    """head rotation (rad) and translation (1x px), nod accents from the voice"""
    ph = {"SERA": 0.3, "MINSU": 1.7, "PARK": 0.9}[who]
    talk = env_smooth(line, t) if line else 0.0
    ln = lean_amount(who, t)
    side = LISTENER_SIDE[who]
    rot = math.radians(style["head_rot"] * (0.6 * math.sin(2 * math.pi * t / 3.1 + ph) + 0.4 * math.sin(2 * math.pi * t / 1.3 + 2 * ph) * clamp(talk)))
    rot += math.radians(style["lean_tilt"]) * ln * side
    hx = style["head_x"] * math.sin(2 * math.pi * t / 3.7 + ph) + 0.6 * ln * side
    hy = -style["head_nod"] * clamp(talk - 0.35) + 0.8 * ln + style.get("jolt", 0.0) * accent(line, t) * (2.2 if line == "L5" else 1.0)
    return rot, hx, hy


# ------------------------------------------------------------------------------------------------------- character
STYLE = {
    "SERA":  {"jolt": 0.7, "breath": 0.95, "breath_T": 3.4, "sway": 0.35, "head_rot": 0.9, "lean_tilt": 1.2, "head_x": 0.5, "head_nod": 1.6, "lean_s": 0.014, "tips": 1.0},
    "MINSU": {"jolt": 0.25, "breath": 0.9, "breath_T": 3.9, "sway": 0.18, "head_rot": 0.35, "lean_tilt": 0.5, "head_x": 0.25, "head_nod": 0.6, "lean_s": 0.007, "tips": 0.6},
    "PARK":  {"breath": 1.0, "breath_T": 2.6, "sway": 0.3, "head_rot": 1.2, "lean_tilt": 1.5, "head_x": 0.6, "head_nod": 0.0, "lean_s": 0.012, "tips": 0.0},
}


def disp_field(shape, t, who, line, geo, mp, extra=None):
    """forward displacement (dx, dy) on the 1x grid"""
    h, w = shape
    st = STYLE[who]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ph = {"SERA": 0.0, "MINSU": 1.1, "PARK": 2.3}[who]
    b = st["breath"] * (0.5 - 0.5 * math.cos(2 * math.pi * t / st["breath_T"] + ph))
    ramp = np.clip((geo["y_bottom"] - yy) / (geo["y_bottom"] - geo["y_shoulder"]), 0, 1)
    chest = np.exp(-((yy - geo["y_chest"]) / (geo["chest_h"])) ** 2)
    dx = (xx - geo["xc"]) * 0.006 * (b / max(st["breath"], 1e-6)) * chest
    dy = -b * ramp
    def head_d(tt):
        rot, hx, hy = head_params(who, line, tt, st)
        px, py = geo["neck"]
        c, s = math.cos(rot), math.sin(rot)
        X = c * (xx - px) - s * (yy - py) + px + hx
        Y = s * (xx - px) + c * (yy - py) + py + hy
        return X - xx, Y - yy
    hdx, hdy = head_d(t)
    wh = mp["w_head"]
    dx += wh * hdx; dy += wh * hdy
    if st["tips"] and "w_tips" in mp:
        ldx, ldy = head_d(t - 0.15)
        l2x, l2y = head_d(t - 0.28)
        k = st["tips"]
        wt = mp["w_tips"]
        dx += wt * k * (0.7 * (ldx - hdx) + 0.3 * (l2x - hdx))
        dy += wt * k * (0.7 * (ldy - hdy) + 0.3 * (l2y - hdy))
    if extra is not None:
        dx += extra[0]; dy += extra[1]
    return dx.astype(np.float32), dy.astype(np.float32)


def draw_character(frame, layers, A, D, geo, record=None, arm=None, rest_inv=None):
    """layers: list of (name, Layer) back to front; A: 3x3 layer-1x -> screen; D: (dx, dy) on the 1x grid.
    arm: (index to insert before, Layer, M_arm 3x3 sprite-1x -> layer-1x). record: dict to receive screen alphas."""
    hh, ww = D[0].shape
    corners = np.array([[0, 0, 1], [ww, 0, 1], [0, hh, 1], [ww, hh, 1]], np.float64).T
    sc = A @ corners
    if arm is not None:
        aw, ah = arm[1].pm.shape[1] / arm[1].kw, arm[1].pm.shape[0] / arm[1].kw
        ac = (A @ arm[2]) @ np.array([[0, 0, 1], [aw, 0, 1], [0, ah, 1], [aw, ah, 1]], np.float64).T
        sc = np.concatenate([sc, ac], 1)
    x0 = int(max(0, math.floor(sc[0].min() - 40))); x1 = int(min(W, math.ceil(sc[0].max() + 40)))
    y0 = int(max(0, math.floor(sc[1].min() - 40))); y1 = int(min(H, math.ceil(sc[1].max() + 40)))
    if x1 <= x0 or y1 <= y0: return None
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    Ai = np.linalg.inv(A)
    qx = (Ai[0, 0] * gx + Ai[0, 1] * gy + Ai[0, 2]).astype(np.float32)
    qy = (Ai[1, 0] * gx + Ai[1, 1] * gy + Ai[1, 2]).astype(np.float32)
    dxm = lambda X, Y: cv2.remap(D[0], X, Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    dym = lambda X, Y: cv2.remap(D[1], X, Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    px = qx - dxm(qx, qy); py = qy - dym(qx, qy)
    for _ in range(3):                                           # fixed-point inverse of the forward displacement
        px, py = qx - dxm(px, py), qy - dym(px, py)
    if rest_inv is not None:                                     # a warp defined directly as an inverse in the rest frame
        px, py = rest_inv(px, py)
        px, py = px.astype(np.float32), py.astype(np.float32)
    region = frame[y0:y1, x0:x1]
    stack = list(layers)
    if arm is not None:
        idx, alayer, Marm = arm
        Mi = np.linalg.inv(A @ Marm)
        ax_ = (Mi[0, 0] * gx + Mi[0, 1] * gy + Mi[0, 2]).astype(np.float32)
        ay_ = (Mi[1, 0] * gx + Mi[1, 1] * gy + Mi[1, 2]).astype(np.float32)
        stack.insert(idx, ("arm", alayer, (ax_, ay_)))
    for item in stack:
        if len(item) == 3:
            name, L, (sx, sy) = item
            s = L.sample(sx, sy)
        else:
            name, L = item
            s = L.sample(px, py)
        a = s[..., 3:4]
        region[:] = region * (1 - a) + s[..., :3]
        if record is not None:
            record[name] = (s[..., 3].copy(), (x0, y0))
    if record is not None:
        record["_grid"] = (px, py, (x0, y0), (ax_, ay_) if arm is not None else None)
    return (x0, y0, x1, y1)


# ------------------------------------------------------------------------------------------------------------- shots
def bg_slice(fname, x0, blur=2.6, dark=0.82, sharpen=False):
    img = C.load(os.path.join(A_DIR, fname))
    h = img.shape[0]; w = int(round(h * 9 / 16))
    sl = img[:, x0:x0 + w]
    up = cv2.resize(sl, (W, H), interpolation=cv2.INTER_LANCZOS4)
    if blur: up = cv2.GaussianBlur(up, (0, 0), blur)
    if sharpen:
        b = cv2.GaussianBlur(up, (0, 0), 1.6); up = np.clip(up + 0.45 * (up - b), 0, 1)
    return np.clip(up * dark, 0, 1).astype(np.float32)


BG = {}
def background(shot):
    k = shot["id"]
    if k not in BG:
        if shot["kind"] in ("sera", "sera_rage"): BG[k] = bg_slice("07_bg_studio_apartment_night.jpg", 600)
        elif shot["kind"] == "sera_arm": BG[k] = bg_slice("07_bg_studio_apartment_night.jpg", 470)
        elif shot["kind"] == "minsu": BG[k] = bg_slice("07_bg_studio_apartment_night.jpg", 120)
        elif shot["kind"] == "pigeon": BG[k] = bg_slice("07_bg_studio_apartment_night.jpg", 944)
        elif shot["kind"] == "keycut": BG[k] = bg_slice("08_ep01_scene_pigeon_chicken_evidence.jpg", 520, blur=0, dark=1.0, sharpen=True)
    return BG[k]


def shake_xy(t, amp, seed):
    if amp <= 0: return 0.0, 0.0
    f = [7.3, 11.1, 17.7]
    x = sum(math.sin(2 * math.pi * fr * t + seed * (i + 1)) / (i + 1) for i, fr in enumerate(f))
    y = sum(math.cos(2 * math.pi * fr * 1.13 * t + seed * 2.1 * (i + 1)) / (i + 1) for i, fr in enumerate(f))
    return amp * x / 1.8, amp * y / 1.8


def camera(shot, t):
    """zoom, centre, shake for this frame"""
    u = (t - shot["t0"]) / max(1e-6, shot["t1"] - shot["t0"])
    k = shot["kind"]
    if k == "sera": z, c, sh = 1.0 + 0.065 * ease(u), (540, 760), (0, 0)
    elif k == "minsu": z, c, sh = 1.0 + 0.04 * ease(u), (540, 600), (0, 0)
    elif k == "sera_arm": z, c, sh = 1.0 + 0.03 * ease(u), (300, 640), (0, 0)      # pushes in toward the hand side
    elif k == "keycut":
        z, c = 1.0 + 0.12 * ease(u), (560, 420)          # pushes in toward the face, its top stays in the 3:4 band
        sh = shake_xy(t, 3.5, 1.7)
    elif k == "pigeon": z, c, sh = 1.0 + 0.05 * ease(u), (470, 1060), (0, 0)
    elif k == "sera_rage":
        d = t - shot["t0"]
        x = clamp(d / 0.14)
        back = 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2            # ease-out-back
        z = 1.0 + 0.30 * back + 0.04 * ease((d - 0.2) / 3.0)
        c = (540, 770)
        amp = 24 * math.exp(-d / 0.32) + 9 * math.exp(-max(0, d - 2.2) / 0.25) * (d > 2.2)
        sh = shake_xy(t, amp, 3.3)
    return z, c, sh


def cam_matrix(z, c, sh):
    return tr(sh[0], sh[1]) @ affine(z, 0, 0, 0, c)


# ------------------------------------------------------------------------------------------------------------- Sera
SG = RIGJ["sera"]
SERA_GEO = {"xc": SG["xc"], "neck": SG["neck_pivot"], "y_shoulder": SG["y_w"], "y_bottom": SG["canvas_1x"][1], "y_chest": SG["y_w"] + 45, "chest_h": 50}


def sera_layout(kind):
    if kind == "sera_arm":
        return {"s": 3.1, "x": 815, "y0": 200}   # a little wider: room for the pointing hand (fingertip stays >= 30 px in)
    return {"s": 3.6, "x": 540, "y0": 300}


def arm_angle(t, shot):
    """arm rotation about the shoulder (rad, screen clockwise positive): resting pose lowered a little, a springy swing up
    into the point at the line's start, a small flick on the second phrase, a slow breath of motion"""
    L3 = LINES["L3"]
    base = math.radians(-11.7)                                    # the sprite's upper arm leans 15.7 deg out: 4 deg out
    u = spring((t - L3["t"] - 0.15) / 0.8)
    pose = math.radians(-4.0) * (1 - u) + math.radians(6.0) * u   # before the point: upper arm vertical; on it: hand up
    flick = math.radians(3.0) * (spring((t - L3["t"] - 2.05) / 0.5) - spring((t - L3["t"] - 2.45) / 0.6))
    idle = math.radians(0.8) * math.sin(2 * math.pi * t / 2.3)
    return base + pose + flick + idle


def sera_frame(frame, shot, t, z, c, sh, record=None):
    kind = shot["kind"]
    lay = sera_layout(kind)
    line = shot["line"]
    st = STYLE["SERA"]
    mp = maps("sera")
    cw, chh = SG["canvas_1x"]
    # mouth / eyes state
    if kind == "sera_rage":
        expr = "angry"
    else:
        talking = LINES[line]["who"] == "SERA" and mouth_open(line, t)
        expr = "talk" if talking else "neutral"
        if blinking("SERA", t): expr += "_blink"
    expr = FORCE.get("sera", expr)
    extra = None
    # the pack has one angry bust and its mouth is open: line 5 is a held shout, the syllables land as head jolts instead
    D = disp_field((chh, cw), t, "SERA", line if LINES[line]["who"] == "SERA" else None, SERA_GEO, mp, None)
    # layer -> screen
    s = lay["s"]
    ln = lean_amount("SERA", t)
    sway = math.radians(st["sway"] * math.sin(2 * math.pi * t / 5.3) + 0.12 * math.sin(2 * math.pi * t / 2.1 + 1))
    anchor = (SG["xc"], SG["y_cut"] + 60)
    Lm = affine(1 + st["lean_s"] * ln, sway, 0, 0, anchor)
    P = tr(lay["x"] - SG["xc"] * s, lay["y0"]) @ affine(s)
    A = cam_matrix(z, c, sh) @ P @ Lm
    zs = s * z
    kw = min(K, zs * 1.15)
    layers = [("ext", layer("sera_ext_arm" if kind == "sera_arm" else "sera_ext", kw)), ("bust", layer("sera_" + expr, kw))]
    arm = None
    if kind == "sera_arm":
        aj = SG["arm"]
        sh_pt = np.array(aj["shoulder_1x"], np.float32)
        ix, iy = int(round(sh_pt[0])), int(round(sh_pt[1]))
        shoulder = (sh_pt[0] + D[0][iy, ix], sh_pt[1] + D[1][iy, ix])  # the pivot rides on the breathing shoulder
        th = arm_angle(t, shot)
        Marm = tr(shoulder[0], shoulder[1]) @ affine(1.0, th) @ tr(-aj["pivot_1x"][0], -aj["pivot_1x"][1])
        arm = (1, layer("arm_point_L", kw), Marm)
    box = draw_character(frame, layers, A, D, SERA_GEO, record, arm, extra)
    return A, D, box


# ------------------------------------------------------------------------------------------------------------ Minsu
MG = RIGJ["minsu"]
MINSU_EYE_Y = 560          # high enough that the lifted cup clears the subtitles; the sheet's bottom edge fades into the dark
MINSU_GEO = {"xc": 321, "neck": MG["neck_pivot"], "y_shoulder": 400, "y_bottom": MG["canvas_1x"][1], "y_chest": 470, "chest_h": 70}
_inpainted = {}


def minsu_layers(kw):
    """the cup group (forearm, hand, cup) comes off the body as its own layer; the body under it is inpainted"""
    if "body" not in _inpainted:
        body = C.load_rgba(os.path.join(RIG, "minsu_body.png"))
        w_cup = maps("minsu")["w_cup"]
        hh, ww = body.shape[:2]
        m = cv2.resize(w_cup, (ww, hh), interpolation=cv2.INTER_LINEAR)
        hard = (m > 0.02).astype(np.uint8)
        rgb8 = (np.clip(body[..., :3], 0, 1) * 255).astype(np.uint8)
        small = cv2.resize(rgb8, (ww // 4, hh // 4), interpolation=cv2.INTER_AREA)
        hs = cv2.resize(hard, (ww // 4, hh // 4), interpolation=cv2.INTER_NEAREST)
        hs = cv2.dilate(hs, np.ones((3, 3), np.uint8))
        inp = cv2.inpaint(small, hs, 6, cv2.INPAINT_TELEA)
        inp = cv2.resize(inp, (ww, hh), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
        under = body.copy()
        under[..., :3] = np.where(hard[..., None] > 0, inp * 0.95, body[..., :3])
        grp = body.copy(); grp[..., 3] = body[..., 3] * np.clip(m, 0, 1)
        fade = np.clip((hh - 1 - np.arange(hh)) / (70.0 * K), 0, 1)[:, None]   # the duo sheet cuts him at the hips
        under[..., 3] *= fade
        _inpainted["body"] = under; _inpainted["grp"] = grp
    key = ("minsu_parts", round(kw, 2))
    if key not in _cache:
        def mk(rgba):
            f = kw / K
            if f < 0.9: rgba = cv2.resize(rgba, (int(rgba.shape[1] * f), int(rgba.shape[0] * f)), interpolation=cv2.INTER_AREA)
            else: f = 1.0
            return Layer(rgba, K * f)
        _cache[key] = (mk(_inpainted["body"]), mk(_inpainted["grp"]))
    return _cache[key]


def cup_angle(t, shot):
    """the lift: about the elbow, up 13 degrees in his pause after '오백에' (the ice clinks at the top), a little settle, held"""
    u = t - (LINES["L2"]["t"] + 1.08)
    return -math.radians(13.0) * (ease(u / 0.42) - 0.08 * math.sin(math.pi * clamp((u - 0.42) / 0.3))) - math.radians(0.6) * math.sin(2 * math.pi * t / 2.9)


def minsu_frame(frame, shot, t, z, c, sh, record=None):
    st = STYLE["MINSU"]; mp = maps("minsu")
    cw, chh = MG["canvas_1x"]
    talking = mouth_open("L2", t)
    expr = "talk" if talking else "neutral"
    if blinking("MINSU", t): expr += "_blink"
    expr = FORCE.get("minsu", expr)
    D = disp_field((chh, cw), t, "MINSU", "L2", MINSU_GEO, mp)
    s = 1.5
    ln = lean_amount("MINSU", t)
    sway = math.radians(st["sway"] * math.sin(2 * math.pi * t / 6.1 + 0.4))
    anchor = (321, 900)
    Lm = affine(1 + st["lean_s"] * ln, sway, 0, 0, anchor)
    P = tr(540 - 321 * s, MINSU_EYE_Y - 171 * s) @ affine(s)
    A = cam_matrix(z, c, sh) @ P @ Lm
    kw = min(K, s * z * 1.15)
    body, grp = minsu_layers(kw)
    el = MG["elbow"]
    ex, ey = el[0] + D[0][el[1], el[0]], el[1] + D[1][el[1], el[0]]
    Mcup = tr(ex, ey) @ affine(1.0, cup_angle(t, shot)) @ tr(-el[0], -el[1])
    layers = [("body", body), ("bust", layer("minsu_" + expr, kw))]
    box = draw_character(frame, layers, A, D, MINSU_GEO, record, (2, grp, Mcup))
    return A, D, box


# ----------------------------------------------------------------------------------------------------------- pigeon
PG = RIGJ["pigeon"]
PIGEON_GEO = {"xc": 125, "neck": PG["neck_pivot"], "y_shoulder": PG["collar_y"], "y_bottom": PG["canvas_1x"][1] + 40, "y_chest": 220, "chest_h": 70}


def pigeon_frame(frame, shot, t, z, c, sh, record=None):
    mp = maps("pigeon")
    cw, chh = PG["canvas_1x"]
    o = mouth_open("L4", t)
    # the bob: a quick forward-down thrust of the head on each beak opening, settling back
    onsets = []
    m = TL["MOUTH"]["L4"]
    for i in range(1, len(m["open"])):
        if m["open"][i] and not m["open"][i - 1]: onsets.append((m["f0"] + i) / FPS)
    bob = sum(math.exp(-max(0.0, t - o_t) / 0.11) * (t >= o_t) for o_t in onsets if t - o_t < 0.6)
    bob = min(bob, 1.2)
    yy, xx = np.mgrid[0:chh, 0:cw].astype(np.float32)
    wh = mp["w_head"]
    extra = (wh * (-1.6 * bob), wh * (1.4 * bob))
    D = disp_field((chh, cw), t, "PARK", "L4", PIGEON_GEO, mp, extra)
    s = 3.2
    ln = lean_amount("PARK", t)
    sway = math.radians(0.3 * math.sin(2 * math.pi * t / 4.4 + 1.2))
    anchor = (125, chh)
    puff = 1 + 0.012 * ln
    Lm = affine(puff, sway, 0, 0, anchor)
    P = tr(540 - 125 * s, 1720 - chh * s) @ affine(s)
    A = cam_matrix(z, c, sh) @ P @ Lm
    kw = min(K, s * z * 1.15)
    pexpr = FORCE.get("pigeon", "open" if o else "neutral")
    box = draw_character(frame, [("bust", layer("pigeon_" + pexpr, kw))], A, D, PIGEON_GEO, record)
    # foreground: the coffee table from the evidence key cut (bones, the delivery receipt), out of focus, in front of him
    fg = table_fg()
    M = cam_matrix(1 + (z - 1) * 1.25, c, (sh[0] * 1.3, sh[1] * 1.3))[:2]
    f = cv2.warpAffine(fg, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    frame[:] = frame * (1 - f[..., 3:4]) + f[..., :3] * f[..., 3:4]
    return A, D, box


_fg = {}
def table_fg():
    if "t" not in _fg:
        img = C.load(os.path.join(A_DIR, "08_ep01_scene_pigeon_chicken_evidence.jpg"))
        strip = img[596:768, 380:860]                               # the table top's front half and its edge
        up = cv2.resize(strip, (W, int(round(strip.shape[0] * W / strip.shape[1]))), interpolation=cv2.INTER_LANCZOS4)
        up = np.clip(cv2.GaussianBlur(up, (0, 0), 5.0) * 1.1, 0, 1)
        out = np.zeros((H, W, 4), np.float32)
        y0 = H - up.shape[0] + 20
        out[y0:, :, :3] = up[:H - y0]
        ramp = np.clip((np.arange(H) - y0) / 36.0, 0, 1)[:, None]
        out[..., 3] = ramp * (np.arange(H)[:, None] >= y0)
        _fg["t"] = out
    return _fg["t"]


# -------------------------------------------------------------------------------------------------------- subtitles
FONT_KO = os.path.join(A_DIR, "fonts", "NotoSansKR_800ExtraBold.ttf")
FONT_EN = os.path.join(A_DIR, "fonts", "Fredoka_600SemiBold.ttf")
SUB_BOTTOM = 1525          # bottom of the subtitle block (vmkit: last line centred at 1470; Shorts bottom UI starts ~1540)
SUB_X0, SUB_X1 = 120, 960  # inside the Shorts safe zone (the button rail covers x > 960)
_subs = {}


def wrap(draw, text, font, maxw):
    words, lines, cur = text.split(" "), [], ""
    for wd in words:
        tryl = (cur + " " + wd).strip()
        if draw.textlength(tryl, font=font) > maxw and cur:
            lines.append(cur); cur = wd
        else:
            cur = tryl
    if cur: lines.append(cur)
    return lines


def balanced(draw, text, font, maxw):
    """two lines of similar length rather than one long and one short"""
    ls = wrap(draw, text, font, maxw)
    if len(ls) == 2:
        words = text.split(" ")
        best = None
        for i in range(1, len(words)):
            a, b = " ".join(words[:i]), " ".join(words[i:])
            wa, wb = draw.textlength(a, font=font), draw.textlength(b, font=font)
            if max(wa, wb) <= maxw and (best is None or max(wa, wb) < best[0]): best = (max(wa, wb), [a, b])
        if best: ls = best[1]
    return ls


def sub_image(sub):
    if sub["id"] in _subs: return _subs[sub["id"]]
    col = tuple(int(sub["col"][i:i + 2], 16) for i in (1, 3, 5))
    col_en = tuple(int(c * 0.55 + 255 * 0.45) for c in col)
    img = Image.new("RGBA", (W, 520), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fk, fe = ImageFont.truetype(FONT_KO, 56), ImageFont.truetype(FONT_EN, 42)
    maxw = SUB_X1 - SUB_X0
    ko = balanced(d, sub["ko"], fk, maxw)
    en = balanced(d, sub["en"], fe, maxw)
    rows = [(l, fk, col, 70, 9) for l in ko] + [(l, fe, col_en, 54, 8) for l in en]
    total = sum(r[3] for r in rows) + 8
    y = 520 - total
    for i, (txt, f, cl, lh, sw) in enumerate(rows):
        if i == len(ko): y += 8
        d.text((W / 2, y + lh / 2), txt, font=f, fill=cl + (255,), anchor="mm", stroke_width=sw, stroke_fill=(18, 10, 42, 255))
        y += lh
    arr = np.asarray(img).astype(np.float32) / 255
    bb = np.nonzero(arr[..., 3].any(1))[0]
    bx = np.nonzero(arr[..., 3].any(0))[0]
    top = SUB_BOTTOM - 520
    _subs[sub["id"]] = (arr, top, (int(bx.min()), int(top + bb.min()), int(bx.max()), int(top + bb.max())))
    return _subs[sub["id"]]


def subtitle_box(t):
    for sub in TL["SUBS"]:
        if sub["s0"] <= t <= sub["s1"]:
            return sub_image(sub)[2]
    return None


def draw_subs(frame, t):
    for sub in TL["SUBS"]:
        if not (sub["s0"] <= t <= sub["s1"]): continue
        a = clamp((t - sub["s0"]) / 0.08) * clamp((sub["s1"] - t) / 0.08)
        arr, top, _ = sub_image(sub)
        y0, y1 = max(0, top), min(H, top + arr.shape[0])
        part = arr[y0 - top:y1 - top]
        al = part[..., 3:4] * a
        frame[y0:y1] = frame[y0:y1] * (1 - al) + part[..., :3] * al


# ------------------------------------------------------------------------------------------------------------ frame
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
VIGN = (1 - 0.30 * np.clip(((XX - W / 2) / (W * 0.62)) ** 2 + ((YY - H * 0.45) / (H * 0.62)) ** 2, 0, 1))[..., None]
LOWER = (1 - 0.42 * np.clip((YY - 1230) / 690, 0, 1) ** 1.4)[..., None]


def shot_at(t):
    for s in SHOTS:
        if s["t0"] <= t < s["t1"]: return s
    return SHOTS[-1]


def render(t, record=None):
    shot = shot_at(t)
    z, c, sh = camera(shot, t)
    frame = np.zeros((H, W, 3), np.float32)
    bg = background(shot)
    zb = 1 + (z - 1) * (0.55 if shot["kind"] != "keycut" else 1.0)
    Mb = cam_matrix(zb, c, (sh[0] * 0.7, sh[1] * 0.7))[:2]
    frame[:] = cv2.warpAffine(bg, Mb, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    info = {"shot": shot["id"]}
    if shot["kind"] in ("sera", "sera_arm", "sera_rage"):
        A, D, box = sera_frame(frame, shot, t, z, c, sh, record)
        info["A"] = A
    elif shot["kind"] == "minsu":
        A, D, box = minsu_frame(frame, shot, t, z, c, sh, record); info["A"] = A
    elif shot["kind"] == "pigeon":
        A, D, box = pigeon_frame(frame, shot, t, z, c, sh, record); info["A"] = A
    if shot["kind"] == "keycut":                                 # the spotlight thunks on
        d = t - shot["t0"]
        lvl = 0.16 if d < 2 / FPS else (1.0 + 0.22 * math.exp(-(d - 2 / FPS) / 0.07))
        frame *= lvl
    frame *= VIGN
    frame *= LOWER
    if shot["kind"] == "sera_rage":                              # blue rage grade, then the white flash on the cut
        d = t - shot["t0"]
        g = clamp(d / 0.12)
        pulse = 0.5 + 0.5 * math.sin(2 * math.pi * d / 0.9)
        blue = frame * np.array([0.70, 0.86, 1.10], np.float32) + np.array([0.0, 0.015, 0.06], np.float32)
        rim = np.clip(((XX - W / 2) / (W * 0.55)) ** 2 + ((YY - 800) / (H * 0.5)) ** 2, 0, 1)[..., None]
        blue = blue * (1 - 0.35 * rim) + np.array([0.05, 0.12, 0.35], np.float32) * rim * (0.30 + 0.12 * pulse)
        frame = frame * (1 - g) + blue * g
        fl = max(0.0, 1 - d / 0.2) ** 1.6
        frame = frame * (1 - fl) + fl
    np.clip(frame, 0, 1, out=frame)
    draw_subs(frame, t)
    return frame, info


# --------------------------------------------------------------------------------------------------------- the arm check
def arm_check_frame(t):
    """machine check of the attached arm on one frame (screen space):
    root:   the arm's shoulder end, i.e. every arm pixel above the bust's widest row (the top of the sleeve, its round cap)
            must lie on the bust's opaque pixels (>= 99.5% under bust alpha > 0.5): the sleeve starts inside the cardigan's
            shoulder and comes out under it, never in mid-air and never above the shoulder line. Also reported: the share
            of the cap (within 0.55 upper-arm widths of the pivot) under the bust.
    clear:  no arm pixel (alpha > 0.1, drawn or hidden) inside the head region (hair, face, ears: the bust above the neck plus
            every hair pixel) grown by 6 px on screen
    gap:    around the joint, the union of torso, arm and bust has no enclosed transparent pixel (no seam, no gap)
    width:  the arm's upper-arm width over the bust's side-panel width (same sheet scale)"""
    rec = {}
    frame, info = render(t, rec)
    px, py, (x0, y0), agrid = rec["_grid"]
    bust_a = rec["bust"][0]; arm_a = rec["arm"][0]; ext_a = rec["ext"][0]
    aj = SG["arm"]
    # root mask in sprite coords -> screen via the arm's sampling grid
    ax_, ay_ = agrid
    dpiv = np.hypot(ax_ - aj["pivot_1x"][0], ay_ - aj["pivot_1x"][1])
    root = (py < SG["y_w"] + 2) & (arm_a > 0.5)
    frac = (root & (bust_a > 0.5)).sum() / max(1, root.sum())
    near = (dpiv <= 0.55 * aj["upper_w"]) & (arm_a > 0.5)
    frac_near = (near & (bust_a > 0.5)).sum() / max(1, near.sum())
    # head region: the face/hair mask sampled through the same deformation
    fh = maps("sera")["face_hair"].astype(np.float32)
    fhs = cv2.remap(fh, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.5
    fhs = cv2.dilate(fhs.astype(np.uint8), np.ones((13, 13), np.uint8)) > 0
    clash = int(((arm_a > 0.1) & fhs).sum())
    # min distance from the arm (alpha > 0.1) to the head region
    dist_head = ndi.distance_transform_edt(~(cv2.dilate(fhs.astype(np.uint8), np.ones((1, 1), np.uint8)) > 0))
    dmin = float(dist_head[arm_a > 0.1].min()) if (arm_a > 0.1).any() else 999.0
    # gap: enclosed holes in the union around the joint
    ys, xs = np.nonzero(near)
    cx, cy = int(xs.mean()), int(ys.mean())
    R = 170
    wy0, wy1, wx0, wx1 = max(0, cy - R), min(bust_a.shape[0], cy + R), max(0, cx - R), min(bust_a.shape[1], cx + R)
    uni = ((bust_a + arm_a + ext_a) > 0.5)[wy0:wy1, wx0:wx1]
    holes = ndi.binary_fill_holes(uni) & ~uni
    nholes = int(holes.sum())
    axs = np.nonzero((arm_a > 0.5).any(0))[0]
    tip_x = int(axs.min() + x0) if len(axs) else -1
    ok = frac >= 0.995 and root.sum() > 50 and clash == 0 and nholes == 0
    return frame, {"t": round(t, 3), "root_px": int(root.sum()), "root_on_bust": round(float(frac), 4),
                   "shoulder_end_on_bust": round(float(frac_near), 3), "head_clash_px": clash,
                   "arm_to_head_px": round(dmin + 6, 1), "joint_holes_px": nholes, "fingertip_x": tip_x, "ok": bool(ok),
                   "joint_screen": [cx + x0, cy + y0]}


def run_armcheck():
    shot = next(s for s in SHOTS if s["kind"] == "sera_arm")
    f0, f1 = int(math.ceil(shot["t0"] * FPS)), int(math.ceil(shot["t1"] * FPS))
    res = []
    crops_at = {f0: "start", (f0 + f1) // 2: "middle", f1 - 1: "end"}
    rv = os.path.join(HERE, "review", "arm"); os.makedirs(rv, exist_ok=True)
    for f in range(f0, f1):
        frame, r = arm_check_frame(f / FPS)
        res.append(r)
        if f in crops_at:
            cx, cy = r["joint_screen"]
            x0, y0 = max(0, cx - 260), max(0, cy - 300)
            crop = frame[y0:y0 + 600, x0:x0 + 520]
            big = cv2.resize(crop, (crop.shape[1] * 2, crop.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
            cv2.imwrite(os.path.join(rv, f"joint_{crops_at[f]}_t{f / FPS:05.2f}.png"), cv2.cvtColor((np.clip(big, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
            cv2.imwrite(os.path.join(rv, f"frame_{crops_at[f]}_t{f / FPS:05.2f}.jpg"), cv2.cvtColor((frame * 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 93])
    summary = {"frames": len(res), "all_ok": all(r["ok"] for r in res),
               "root_on_bust_min": min(r["root_on_bust"] for r in res), "shoulder_end_on_bust_min": min(r["shoulder_end_on_bust"] for r in res),
               "head_clash_px_max": max(r["head_clash_px"] for r in res),
               "arm_to_head_px_min": min(r["arm_to_head_px"] for r in res), "joint_holes_px_max": max(r["joint_holes_px"] for r in res),
               "fingertip_x_min": min(r["fingertip_x"] for r in res),
               "upper_arm_w": SG["arm"]["upper_w"], "bust_side_panel_w": SG["panel_w"],
               "width_ratio": round(SG["arm"]["upper_w"] / SG["panel_w"], 3)}
    json.dump({"summary": summary, "frames": res}, open(os.path.join(HERE, "out", "arm_check.json"), "w"), indent=1)
    print(json.dumps(summary))
    return summary


# ------------------------------------------------------------------------------------------- faces vs subtitles, framing
FACE_1X = {"sera": (40, 60, 180, 210), "minsu": (255, 95, 390, 290), "pigeon": (20, 0, 180, 140)}
KEY_FACE = (610, 110, 790, 320)                                   # the pigeon's face in the 08 key cut (image pixels)


def face_box(t):
    """the face's box on screen this frame (None when no face is on screen)"""
    shot = shot_at(t)
    z, c, sh = camera(shot, t)
    k = shot["kind"]
    if k == "keycut":
        x0 = 520; f = H / 768.0
        bx = [(KEY_FACE[0] - x0) * f, KEY_FACE[1] * f, (KEY_FACE[2] - x0) * f, KEY_FACE[3] * f]
        A = cam_matrix(z, c, sh)
    else:
        rec = {}
        fr = np.zeros((H, W, 3), np.float32)
        if k.startswith("sera"): A, _, _ = sera_frame(fr, shot, t, z, c, sh); bx = FACE_1X["sera"]
        elif k == "minsu": A, _, _ = minsu_frame(fr, shot, t, z, c, sh); bx = FACE_1X["minsu"]
        else: A, _, _ = pigeon_frame(fr, shot, t, z, c, sh); bx = FACE_1X["pigeon"]
    P = A @ np.array([[bx[0], bx[2], bx[0], bx[2]], [bx[1], bx[1], bx[3], bx[3]], [1, 1, 1, 1]], np.float64)
    return [float(P[0].min()), float(P[1].min()), float(P[0].max()), float(P[1].max())]


def run_facecheck(step=2):
    res, worst, out_band = [], 0.0, 0
    N = int(round(DUR * FPS))
    for f in range(0, N, step):
        t = f / FPS
        fb = face_box(t)
        sb = subtitle_box(t)
        ov = 0.0
        if fb and sb:
            ix = max(0, min(fb[2], sb[2]) - max(fb[0], sb[0])); iy = max(0, min(fb[3], sb[3]) - max(fb[1], sb[1]))
            ov = ix * iy
        inband = fb[1] >= 240 and fb[3] <= 1680
        out_band += not inband
        worst = max(worst, ov)
        res.append({"t": round(t, 3), "shot": shot_at(t)["id"], "face": [round(v) for v in fb], "sub": list(sb) if sb else None,
                    "overlap_px2": round(ov), "face_in_3x4_band": inband,
                    "gap_face_to_sub_px": round(sb[1] - fb[3]) if sb else None})
    gaps = [r["gap_face_to_sub_px"] for r in res if r["gap_face_to_sub_px"] is not None]
    summary = {"frames_checked": len(res), "max_overlap_px2": worst, "faces_out_of_band": out_band,
               "min_gap_face_bottom_to_subtitle_top_px": min(gaps) if gaps else None}
    json.dump({"summary": summary, "frames": res}, open(os.path.join(HERE, "out", "face_sub_check.json"), "w"), indent=1)
    print(json.dumps(summary))


# -------------------------------------------------------------------------------------------------------------- main
def to8(frame): return (np.clip(frame, 0, 1) * 255 + 0.5).astype(np.uint8)


def render_range(f0, f1, path):
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", "-r", str(FPS), path], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        fr, _ = render(f / FPS)
        ff.stdin.write(to8(fr).tobytes())
    ff.stdin.close(); ff.wait()


def main():
    mode = sys.argv[1]
    if mode == "stills":
        out = sys.argv[2]; os.makedirs(out, exist_ok=True)
        for ts in sys.argv[3:]:
            t = float(ts)
            fr, info = render(t)
            cv2.imwrite(os.path.join(out, f"t_{t:06.2f}.png"), cv2.cvtColor(to8(fr), cv2.COLOR_RGB2BGR))
        print("stills ->", out)
    elif mode == "armcheck":
        run_armcheck()
    elif mode == "facecheck":
        run_facecheck()
    elif mode == "video":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 4
        N = int(round(DUR * FPS))
        outd = os.path.join(HERE, "out")
        chunk = math.ceil(N / n)
        procs = []
        for w in range(n):
            a, b = w * chunk, min(N, (w + 1) * chunk)
            if a >= b: continue
            procs.append(subprocess.Popen([sys.executable, __file__, "segment", str(a), str(b), os.path.join(outd, f"seg_{w}.mp4")]))
        for p in procs:
            if p.wait(): raise SystemExit("segment failed")
        lst = os.path.join(outd, "segs.txt")
        open(lst, "w").write("\n".join(f"file '{os.path.join(outd, f'seg_{w}.mp4')}'" for w in range(len(procs))))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", os.path.join(outd, "video.mp4")], check=True)
        for w in range(len(procs)): os.remove(os.path.join(outd, f"seg_{w}.mp4"))
        os.remove(lst)
        print("video ->", os.path.join(outd, "video.mp4"), N, "frames")
    elif mode == "segment":
        render_range(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])


if __name__ == "__main__":
    main()
