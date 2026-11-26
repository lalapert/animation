// STILL RECORDING, tape 14: "Rule 9". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white, TK.ghost 'broken'). Script: channel/scripts/SR14_rule_9.md
// The guard office, December 9, 1999. The night-shift rule sheet on the wall by the desk lamp (its fixed look, for later
// tapes): cream paper, two strips of yellowed tape at the top, typed HALLOWAY GALLERIA / SECURITY - NIGHT SHIFT RULES, eight
// typed rules, and under them in blue ballpoint, big, "9. KEEP WRITING." Leon's hand (fixed, for later tapes): block capitals,
// a little slanted, and his E written like a backwards 3. His night log (green-ruled pages, red margin, page No. 9) has the
// same hand. Scare type: HIS OWN HAND. His pen keeps going, faster, bigger, then rips down through both pages and his wrist
// stays bent too far; CAM 02 shows what his camcorder (his eyes) never sees: it bent over his chair, its hand on his.
// Not a lunge at the lens (6), not two shadows (7), not beside you or mirror lag (8), not movement only (9), not a hand over
// the lens (10), not lights on (11), not below (12), not the ceiling (13). The threat is his own body.
// Owner 11/20 (tape 8 test): the first 3 s fill the 9:16 frame, then the archive zooms out; TL.OPEN.on = false switches it off.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const W = TK.TW, H = TK.TH;
const RAW = mk(W, H), RG = RAW.getContext('2d'), FG = mk(W, H), FGG = FG.getContext('2d'), NZ = mk(W, H), NZG = NZ.getContext('2d');
const WORK = mk(W, H), WK = WORK.getContext('2d'), WIN = mk(W, H), WG = WIN.getContext('2d'), TMP = mk(W, H), TG = TMP.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, M = TK.motion, TAU = Math.PI * 2, PI = Math.PI;
const qf = t => Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;
const shotAt = t => TL.SHOTS.find(s => t >= s[1] && t < s[2]);
const SH = Object.fromEntries(TL.SHOTS.map(s => [s[0], s]));
const inR = (t, a) => t >= a[0] && t < a[1];
const kOf = (t, a) => clamp((t - a[0]) / (a[1] - a[0]));
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } };
const ell = (g, x, y, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.2832); g.fillStyle = fill; g.fill(); };
const rgb = (c, k = 1) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
const p2 = n => String(n).padStart(2, '0');
function onQuad(g, TLp, TRp, BLp, w, h, draw) {
  if (!TLp || !TRp || !BLp) return;
  g.save(); g.transform((TRp[0] - TLp[0]) / w, (TRp[1] - TLp[1]) / w, (BLp[0] - TLp[0]) / h, (BLp[1] - TLp[1]) / h, TLp[0], TLp[1]); draw(g); g.restore();
}
function mkCam(c) {
  const f = .5 * W / Math.tan(c.fov * PI / 360), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  return Object.assign({}, c, { f, W, H, toCam(p) { const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; } });
}
const lookAt = (from, to, fov) => { const d = sub3(to, from); return { x: from[0], y: from[1], z: from[2], yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), fov }; };
function prep(q) {
  const P = q.p, c = [0, 1, 2].map(i => (P[0][i] + P[1][i] + P[2][i] + P[3][i]) / 4);
  const u = [0, 1, 2].map(i => P[1][i] - P[0][i]), v = [0, 1, 2].map(i => P[3][i] - P[0][i]);
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n) || 1; n = n.map(x => x / l);
  q.c = c; q.n = n;
}
function litScene(S, fn) {
  const out = new TK.Scene(), m = (c, f) => [c[0] * f[0], c[1] * f[1], c[2] * f[2]];
  out.q = S.q.map(q => { if (q.emit) return q; const f = fn(q); return Object.assign({}, q, { col: m(q.col, f), textCol: q.textCol && m(q.textCol, f) }); });
  return out;
}
function handheld(t, nerve) {
  const n = k => Math.sin(t * 1.3 * k + k) * .6 + Math.sin(t * 2.9 * k + 2 * k) * .3 + Math.sin(t * 7.1 * k) * .1;
  const amp = .01 + .02 * nerve;
  return { y: n(1.1) * amp * .5, yaw: n(.9) * amp * .8, pitch: n(1.7) * amp * .5, roll: n(.7) * amp * .6 };
}
// a flat picture (canvas img) laid on a plane in the scene with true perspective: a grid of affine-mapped triangles.
// P(u, v) gives the world point of image pixel (u, v)
function drawOnPlane(g, cam, img, P, nx = 8, ny = 6) {
  const iw = img.width, ih = img.height, S = [];
  for (let j = 0; j <= ny; j++) { S.push([]); for (let i = 0; i <= nx; i++) S[j].push(project(cam, P(i / nx * iw, j / ny * ih))); }
  const tri = (s0, s1, s2, d0, d1, d2) => {
    if (!d0 || !d1 || !d2) return;
    const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]); if (Math.abs(den) < 1e-9) return;
    const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den, c = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
    const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den, d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
    const e = d0[0] - a * s0[0] - c * s0[1], f = d0[1] - b * s0[0] - d * s0[1];
    const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3, gr = p => { const dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * .7, p[1] + dy / l * .7]; };
    g.save(); g.beginPath(); [d0, d1, d2].map(gr).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
    g.transform(a, b, c, d, e, f); g.drawImage(img, 0, 0); g.restore();
  };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const u0 = i / nx * iw, u1 = (i + 1) / nx * iw, v0 = j / ny * ih, v1 = (j + 1) / ny * ih;
    tri([u0, v0], [u1, v0], [u0, v1], S[j][i], S[j][i + 1], S[j + 1][i]);
    tri([u1, v0], [u1, v1], [u0, v1], S[j][i + 1], S[j + 1][i + 1], S[j + 1][i]);
  }
}

// ================================================================ HIS HAND: block capitals in single strokes (no font: drawn)
// glyph: [width, curved (smoothed), strokes as flat x,y lists in a 1-high cell, baseline at y 1]. His E is a backwards 3.
const FONT = {
  A: [.9, 0, [[0, 1, .45, 0, .9, 1], [.2, .62, .72, .62]]],
  B: [.85, 1, [[0, 1, 0, 0], [0, 0, .55, 0, .8, .12, .8, .34, .55, .47, 0, .47], [.55, .47, .88, .6, .88, .88, .58, 1, 0, 1]]],
  C: [.85, 1, [[.85, .15, .62, 0, .28, 0, .04, .25, .04, .75, .28, 1, .62, 1, .87, .85]]],
  D: [.85, 1, [[0, 0, 0, 1], [0, 0, .45, 0, .82, .22, .88, .5, .82, .78, .45, 1, 0, 1]]],
  E: [.8, 1, [[.78, .1, .5, 0, .18, .05, .12, .28, .3, .44, .62, .48], [.62, .48, .22, .53, .06, .72, .16, .95, .5, 1, .84, .9]]],
  F: [.75, 0, [[.75, 0, 0, 0, 0, 1], [0, .47, .6, .47]]],
  G: [.9, 1, [[.86, .14, .62, 0, .28, 0, .04, .25, .04, .75, .28, 1, .62, 1, .88, .82, .88, .56, .5, .56]]],
  H: [.85, 0, [[0, 0, 0, 1], [.85, 0, .85, 1], [0, .5, .85, .5]]],
  I: [.25, 0, [[.12, 0, .12, 1]]],
  J: [.7, 1, [[.68, 0, .68, .72, .5, 1, .22, 1, .04, .8]]],
  K: [.8, 0, [[0, 0, 0, 1], [.78, 0, 0, .56], [.24, .38, .82, 1]]],
  L: [.7, 0, [[0, 0, 0, 1, .7, 1]]],
  M: [1.0, 0, [[0, 1, .04, 0, .5, .62, .96, 0, 1, 1]]],
  N: [.85, 0, [[0, 1, 0, 0, .85, 1, .85, 0]]],
  O: [.9, 1, [[.45, 0, .1, .14, 0, .5, .1, .86, .45, 1, .8, .86, .9, .5, .8, .14, .45, 0]]],
  P: [.8, 1, [[0, 1, 0, 0], [0, 0, .5, 0, .8, .13, .8, .37, .5, .5, 0, .5]]],
  Q: [.9, 1, [[.45, 0, .1, .14, 0, .5, .1, .86, .45, 1, .8, .86, .9, .5, .8, .14, .45, 0], [.55, .72, .95, 1.06]]],
  R: [.82, 1, [[0, 1, 0, 0], [0, 0, .5, 0, .8, .13, .8, .37, .5, .5, 0, .5], [.4, .5, .84, 1]]],
  S: [.8, 1, [[.8, .12, .55, 0, .22, 0, .04, .2, .18, .42, .62, .55, .84, .76, .66, 1, .3, 1, .02, .86]]],
  T: [.85, 0, [[0, 0, .85, 0], [.43, 0, .43, 1]]],
  U: [.85, 1, [[0, 0, 0, .7, .22, 1, .62, 1, .85, .7, .85, 0]]],
  V: [.85, 0, [[0, 0, .43, 1, .85, 0]]],
  W: [1.05, 0, [[0, 0, .26, 1, .52, .32, .78, 1, 1.05, 0]]],
  X: [.8, 0, [[0, 0, .8, 1], [.8, 0, 0, 1]]],
  Y: [.8, 0, [[0, 0, .4, .5, .8, 0], [.4, .5, .4, 1]]],
  Z: [.8, 0, [[0, 0, .8, 0, 0, 1, .82, 1]]],
  '0': [.7, 1, [[.35, 0, .06, .16, 0, .5, .06, .84, .35, 1, .64, .84, .7, .5, .64, .16, .35, 0]]],
  '1': [.4, 0, [[0, .2, .3, 0, .3, 1]]],
  '2': [.75, 1, [[.04, .24, .24, .02, .54, 0, .74, .2, .68, .45, 0, 1, .78, 1]]],
  '3': [.72, 1, [[.04, .1, .38, 0, .7, .12, .7, .36, .36, .48], [.36, .48, .74, .6, .74, .88, .4, 1, .02, .9]]],
  '4': [.8, 0, [[.62, 1, .62, 0, 0, .68, .82, .68]]],
  '5': [.72, 1, [[.72, 0, .12, 0, .06, .44, .44, .38, .72, .55, .72, .84, .44, 1, .04, .9]]],
  '6': [.72, 1, [[.68, .05, .36, 0, .08, .3, .04, .7, .26, 1, .6, 1, .76, .75, .62, .5, .32, .48, .06, .66]]],
  '7': [.72, 0, [[0, 0, .74, 0, .3, 1]]],
  '8': [.72, 1, [[.36, .48, .1, .35, .1, .12, .36, 0, .64, .12, .64, .35, .36, .48, .06, .62, .06, .88, .36, 1, .68, .88, .68, .62, .36, .48]]],
  '9': [.72, 1, [[.7, .26, .5, 0, .24, 0, .04, .2, .1, .44, .36, .52, .66, .4, .72, .16, .7, .55, .58, 1]]],
  '.': [.16, 0, [[.06, .9, .1, .97, .08, 1]]],
  ':': [.16, 0, [[.06, .3, .1, .36], [.06, .9, .1, .97]]],
  '-': [.5, 0, [[.04, .52, .46, .5]]],
  '?': [.7, 1, [[.04, .2, .3, 0, .62, 0, .74, .2, .64, .4, .36, .56, .36, .76], [.34, .94, .38, 1]]],
  "'": [.14, 0, [[.08, 0, .05, .25]]],
  ' ': [.45, 0, []],
};
function chaikin(pts, n) {
  for (let it = 0; it < n; it++) {
    const o = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
    o.push(pts[pts.length - 1]); pts = o;
  }
  return pts;
}
// lay out a line of his writing: x, y (baseline) in px, h = cap height, slant, seed. Returns the pen's path: ink strokes
// and the moves in the air between them, with lengths (the air counts half)
function layout(text, o) {
  const R = TK.rng(o.seed || 1), segs = []; let x = o.x, prev = null, L = 0;
  for (const ch of text) {
    const G = FONT[ch] || FONT[' '], sc = o.h * (1 + (R() - .5) * .1), by = o.y + (R() - .5) * .07 * o.h, rot = (R() - .5) * .07 + (o.rot || 0);
    for (const st of G[2]) {
      let pts = []; for (let i = 0; i < st.length; i += 2) pts.push([st[i], st[i + 1]]);
      if (G[1]) pts = chaikin(pts, 2);
      pts = pts.map(([u, v]) => { u += (R() - .5) * .035; v += (R() - .5) * .035; const px = u * sc - (v - 1) * sc * o.slant, py = (v - 1) * sc, c = Math.cos(rot), s = Math.sin(rot); return [x + px * c - py * s, by + px * s + py * c]; });
      if (prev) segs.push({ ink: false, pts: [prev, pts[0]] });
      segs.push({ ink: true, pts, w: .85 + R() * .3 }); prev = pts[pts.length - 1];
    }
    x += (G[0] + .2) * sc * (1 + (R() - .5) * .1);
  }
  for (const s of segs) { s.len = 0; for (let i = 1; i < s.pts.length; i++) s.len += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); s.len *= s.ink ? 1 : .5; L += s.len; }
  return { segs, L, x1: x, end: prev, start: segs.length ? segs[0].pts[0] : [o.x, o.y] };
}
// draw the first fraction p of a laid-out line; returns where the pen is and whether it is on the paper
function inkLine(g, lay, p, col, lw) {
  let left = clamp(p) * lay.L, pen = lay.start, down = false;
  g.save(); g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of lay.segs) {
    if (left <= 0) break;
    const k = s.len > 0 ? Math.min(1, left / s.len) : 1; left -= s.len;
    let acc = 0; const tot = s.len / (s.ink ? 1 : .5), lim = k * tot, out = [s.pts[0]];
    for (let i = 1; i < s.pts.length; i++) {
      const a = s.pts[i - 1], b = s.pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc + d >= lim) { const u = d > 0 ? (lim - acc) / d : 1; out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]); break; }
      acc += d; out.push(b);
    }
    pen = out[out.length - 1]; down = s.ink && k < 1;
    if (s.ink) { g.lineWidth = lw * s.w; g.beginPath(); out.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); }
    if (k >= 1) down = s.ink;
  }
  g.restore();
  return { pen, down: down && p < 1 };
}
const INK = 'rgba(26,40,150,.94)';

// ================================================================ THE RULE SHEET (0.22 x 0.36 m, 4000 px per metre)
const SHEET = mk(880, 1440), SW = .22, SHT = .36, SHEET_C = [.81, 1.56, 3.297];
const RULES = ['1. SIGN IN AT 10 PM. SIGN OUT AT 6 AM.', '2. ROUNDS ON THE HOUR. LOG EVERY ROUND.', '3. KEEP THE OFFICE DOOR LOCKED.',
  '4. DO NOT ANSWER THE PAGING PHONE.', '5. IF A MONITOR GOES BLANK, LOG IT.', '6. NO ONE ON THE CAROUSEL AFTER 9 PM.',
  '7. NO VISITORS. NO EXCEPTIONS.', '8. NEVER SWITCH OFF CAMERA 02.'];
function buildSheet() {
  const g = SHEET.getContext('2d'), w = 880, h = 1440;
  g.fillStyle = 'rgb(236,231,216)'; g.fillRect(0, 0, w, h);
  const R = TK.rng(91); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,100,70,${R() * .05})`; g.fillRect(R() * w, R() * h, 2 + R() * 6, 2 + R() * 6); }
  const vg = g.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,70,40,.18)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(214,196,130,.55)'; g.save(); g.translate(120, 18); g.rotate(-.12); g.fillRect(-80, -26, 170, 56); g.restore(); g.save(); g.translate(760, 18); g.rotate(.1); g.fillRect(-90, -26, 170, 56); g.restore();
  g.fillStyle = 'rgb(34,32,30)'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '50px "Special Elite"'; g.fillText('HALLOWAY GALLERIA', w / 2, 100);
  g.font = '36px "Special Elite"'; g.fillText('SECURITY - NIGHT SHIFT RULES', w / 2, 158);
  g.fillRect(70, 196, w - 140, 4);
  g.textAlign = 'left'; g.font = '29px "Special Elite"';
  RULES.forEach((s, i) => g.fillText(s, 44, 256 + i * 70));
  g.font = '22px "Special Elite"'; g.fillStyle = 'rgb(90,86,80)'; g.textAlign = 'right'; g.fillText('REV. 11/99   - MGMT', w - 44, h - 46);
  // the ninth, in his hand, big: written stroke by stroke over the first seconds (review 11/27), see sheetAt
  SHEETBASE.getContext('2d').drawImage(SHEET, 0, 0);
  sheetAt(99);
}
// "9. KEEP" / "WRITING." appear stroke by stroke over SHEET_W (no hand, no pen: the ink just comes); the pen-scratch cues follow
// the same ink segments (sheetInkTimes)
const SHEETBASE = mk(880, 1440), SHEET_W = [.2, 1.6], SHEET_GAP = .08;
const SHEET_LAYS = [layout('9. KEEP', { x: 52, y: 965, h: 112, slant: .12, seed: 9 }), layout('WRITING.', { x: 52, y: 1165, h: 112, slant: .12, seed: 19, rot: -.02 })];
const SHEET_T = (() => { const [a, b] = SHEET_W, L0 = SHEET_LAYS[0].L, L1 = SHEET_LAYS[1].L, m = a + (b - a - SHEET_GAP) * L0 / (L0 + L1); return [[a, m], [m + SHEET_GAP, b]]; })();
let sheetP0 = -1;
function sheetAt(t) {
  const ps = SHEET_T.map(w => kOf(t, w)), key = ps[0] + ps[1] * 2;
  if (key === sheetP0) return; sheetP0 = key;
  const g = SHEET.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(SHEETBASE, 0, 0);
  SHEET_LAYS.forEach((lay, i) => { if (ps[i] > 0) inkLine(g, lay, ps[i], INK, 8); });
}
function sheetInkTimes() {
  const out = [];
  SHEET_LAYS.forEach((lay, i) => { const [a, b] = SHEET_T[i]; let acc = 0; for (const s of lay.segs) { const t0 = a + (b - a) * acc / lay.L; acc += s.len; if (s.ink) out.push([t0, a + (b - a) * acc / lay.L]); } });
  return out;
}
const sheetP = (u, v) => [SHEET_C[0] - SW / 2 + u / 4000, SHEET_C[1] + SHT / 2 - v / 4000, SHEET_C[2]];

// ================================================================ HIS NIGHT LOG (open, 0.46 x 0.32 m on the desk, 3000 px/m)
const LOGC = mk(1380, 960), LOGG = LOGC.getContext('2d'), LOGBASE = mk(1380, 960);
const BOOK = { x: .55, z1: 2.68, y: .748 };
const logP = (u, v, lift = 0) => [BOOK.x + u / 3000, BOOK.y + lift, BOOK.z1 - v / 3000];
const ENTRIES = [['DEC 9 1999', 186, 34], ['12:40 ROUNDS. ALL QUIET.', 260, 26], ['1:25 MON 7 BLANK AGAIN.', 322, 26], ['1:58 EAST DOOR SHUT. OK.', 384, 26], ['2:05 WHO PUT UP RULE 9?', 446, 26]];
const WR = [{ x: 775, y: 186, h: 30, slant: .14 }, { x: 775, y: 262, h: 36, slant: .2 }, { x: 760, y: 352, h: 44, slant: .3 }, { x: 742, y: 470, h: 50, slant: .4 }, { x: 742, y: 612, h: 70, slant: .52 }];
let LAYS = null, RIPL = null;
function buildLog() {
  const g = LOGBASE.getContext('2d'), w = 1380, h = 960;
  for (const [x0, x1] of [[0, 690], [690, 1380]]) {
    g.fillStyle = 'rgb(234,230,214)'; g.fillRect(x0, 0, x1 - x0, h);
    g.strokeStyle = 'rgba(110,150,140,.55)'; g.lineWidth = 2; for (let y = 200; y < h - 20; y += 62) { g.beginPath(); g.moveTo(x0 + 10, y); g.lineTo(x1 - 10, y); g.stroke(); }
    g.strokeStyle = 'rgba(200,70,60,.6)'; g.beginPath(); g.moveTo(x0 + 70, 120); g.lineTo(x0 + 70, h - 10); g.stroke();
    g.fillStyle = 'rgb(70,90,84)'; g.font = '26px "Special Elite"'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('NIGHT LOG  -  GUARD OFFICE', x0 + 90, 70);
  }
  const gut = g.createLinearGradient(640, 0, 740, 0); gut.addColorStop(0, 'rgba(0,0,0,0)'); gut.addColorStop(.5, 'rgba(60,44,26,.35)'); gut.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gut; g.fillRect(640, 0, 100, h);
  const ed = g.createLinearGradient(0, h - 40, 0, h); ed.addColorStop(0, 'rgba(0,0,0,0)'); ed.addColorStop(1, 'rgba(60,44,26,.25)'); g.fillStyle = ed; g.fillRect(0, h - 40, w, 40);
  ENTRIES.forEach(([s, y, hh], i) => inkLine(g, layout(s, { x: 88, y: y + 8 - 0, h: hh, slant: .12, seed: 40 + i }), 1, INK, hh * .1));
  LAYS = TL.WRITES.map(([s], i) => layout(s, Object.assign({ seed: 70 + i }, WR[i])));
}
function pageNo(g, t) {
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
  g.fillStyle = 'rgb(150,48,40)'; g.font = '44px "Special Elite"'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('No. ' + (egg ? '14' : '9'), 1350, 70);
}
// the pen: where it is at t (page px), on the paper or not; the writing drawn into LOGC
const RIP_END = [560, 820];
function logAt(t) {
  const g = LOGG; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(LOGBASE, 0, 0); pageNo(g, t);
  let pen = [1000, 760], down = false, n = TL.WRITES.length;
  for (let i = 0; i < n; i++) {
    const [, t0, t1] = TL.WRITES[i]; if (t < t0) { if (i > 0 && t > TL.WRITES[i - 1][2]) { const a = LAYS[i - 1].end, b = LAYS[i].start, k = ease(kOf(t, [TL.WRITES[i - 1][2], t0])); pen = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; down = false; } else if (i === 0) { pen = [LAYS[0].start[0] + 40, LAYS[0].start[1] + 30]; down = false; } break; }
    const tq = i === n - 1 ? Math.min(t, TL.QUIET[0]) : t;
    const r = inkLine(g, LAYS[i], kOf(tq, [t0, t1]), INK, WR[i].h * (.085 + i * .008));
    pen = r.pen; down = r.down && t < TL.QUIET[0];
  }
  if (t >= TL.QUIET[0]) down = false;
  if (t >= TL.RIP[0]) {                                                                          // the rip: down across both pages
    const a = RIPL.a, k = Math.pow(kOf(t, TL.RIP), 1.6), b = [lerp(a[0], RIP_END[0], k), lerp(a[1], RIP_END[1], k)];
    const R = TK.rng(5), N = 30, dx = RIP_END[0] - a[0], dy = RIP_END[1] - a[1], dl = Math.hypot(dx, dy), nx = -dy / dl, ny = dx / dl, L = [], Rr = [], pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N * k, c = [lerp(a[0], RIP_END[0], u) + (R() - .5) * 6, lerp(a[1], RIP_END[1], u) + (R() - .5) * 6], w = (4 + 16 * Math.sin(PI * Math.min(1, i / N))) * (i / N <= k + 1e-6 ? 1 : 0);
      pts.push(c); L.push([c[0] + nx * w * (.7 + R() * .6), c[1] + ny * w * (.7 + R() * .6)]); Rr.push([c[0] - nx * w * (.7 + R() * .6), c[1] - ny * w * (.7 + R() * .6)]);
    }
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath();
    g.fillStyle = 'rgb(30,38,28)'; g.fill();
    g.strokeStyle = 'rgba(252,250,242,.95)'; g.lineWidth = 3.5; for (const E of [L, Rr]) { g.beginPath(); E.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
    g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); pts.slice(0, 9).forEach((p, i) => i ? g.lineTo(p[0] - 4, p[1] + 3) : g.moveTo(p[0] - 4, p[1] + 3)); g.stroke();
    g.restore();
    pen = b; down = true;
  }
  return { pen, down };
}

// ================================================================ THE SECURITY OFFICE (after tape 10, its desk laid out for this
// night). x -1.7..1.7, z 0..3.3, 2.6 high. The desk along the front wall, deeper (z 2.3..3.3); the monitors back on it; the
// rule sheet on the wall right of the shelf, the lamp beside the log; his chair at x .78; CAM 02 high in the back left corner
const OW = 1.7, OD = 3.3, OHT = 2.6, AXIS = [.78, 1.2, 2.0];
const SCR = { A: { c: [-.4, 1.06, 2.938], w: .4, h: .3 }, B: { c: [.2, 1.06, 2.938], w: .4, h: .3 },
  s1: { c: [-.4, 1.63, 2.988], w: .2, h: .15 }, s2: { c: [.15, 1.63, 2.988], w: .2, h: .15 } };
const CAM02 = lookAt([-1.5, 2.4, .16], [.62, .95, 1.95], 70);
const LAMP = [1.12, 1.1, 2.52];
const wallColO = (y, r) => (y < .12 ? [70, 66, 60] : [166, 162, 148]).map(c => c * (.95 + r * .08));
function office(S) {
  const R = TK.rng(31);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 11; j++) { const z = j * .3; S.quad([[-OW + i * .3, 0, z], [-OW + i * .3 + .3, 0, z], [-OW + i * .3 + .3, 0, z + .3], [-OW + i * .3, 0, z + .3]], (i + j) & 1 ? [92, 90, 84] : [104, 100, 92], { floor: true }); }
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const x = -OW + i * (2 * OW / 6), z = j * (OD / 6); S.quad([[x, OHT, z + OD / 6], [x + 2 * OW / 6, OHT, z + OD / 6], [x + 2 * OW / 6, OHT, z], [x, OHT, z]], (i + j) & 1 ? [140, 140, 134] : [148, 148, 142]); }
  for (let row = 0; row < 13; row++) {
    const y0 = row * .2, y1 = Math.min(OHT, y0 + .2), off = row % 2 ? .2 : 0;
    for (let x0 = -OW - off; x0 < OW - 1e-6; x0 += .4) { const a = Math.max(-OW, x0), b = Math.min(OW, x0 + .4); if (b - a < .01) continue; S.quad([[a, y0, OD], [b, y0, OD], [b, y1, OD], [a, y1, OD]], wallColO(y0 + .01, R())); }
    for (let x0 = -OW - off; x0 < OW - 1e-6; x0 += .4) {
      const a = Math.max(-OW, x0), b = Math.min(OW, x0 + .4); if (b - a < .01) continue;
      const spans = y0 >= 2.1 - 1e-6 ? [[a, b]] : [[a, Math.min(b, .55)], [Math.max(a, 1.45), b]];
      for (const [p, q] of spans) if (q - p > .01) S.quad([[q, y0, 0], [p, y0, 0], [p, y1, 0], [q, y1, 0]], wallColO(y0 + .01, R()));
    }
    for (const s of [-1, 1]) for (let z0 = -off; z0 < OD - 1e-6; z0 += .4) {
      const a = Math.max(0, z0), b = Math.min(OD, z0 + .4); if (b - a < .01) continue; const x = s * OW;
      S.quad(s < 0 ? [[x, y0, a], [x, y0, b], [x, y1, b], [x, y1, a]] : [[x, y0, b], [x, y0, a], [x, y1, a], [x, y1, b]], wallColO(y0 + .01, R()));
    }
  }
  S.quad([[1.45, 0, .012], [.55, 0, .012], [.55, 2.08, .012], [1.45, 2.08, .012]], [124, 108, 88]);
  S.quad([[1.18, 1.38, .016], [.82, 1.38, .016], [.82, 1.76, .016], [1.18, 1.76, .016]], [150, 156, 142], { emit: .28 });
  S.box(.5, 0, 0, .55, 2.13, .05, [96, 88, 76]); S.box(1.45, 0, 0, 1.5, 2.13, .05, [96, 88, 76]); S.box(.5, 2.08, 0, 1.5, 2.13, .05, [96, 88, 76]);
  S.box(-OW, 0, .3, -1.26, 1.86, .93, [92, 106, 114]);
  for (let i = 0; i < 2; i++) { const z0 = .32 + i * .313, z1 = z0 + .3; S.quad([[-1.258, .04, z0], [-1.258, .04, z1], [-1.258, 1.82, z1], [-1.258, 1.82, z0]], [98 + i * 3, 112 + i * 2, 120]); S.box(-1.26, 1.0, z1 - .06, -1.23, 1.12, z1 - .035, [60, 62, 64]); }
  S.box(1.66, 1.2, 1.1, OW, 1.8, 2.0, [146, 108, 72]);
  for (const [z, y, w2, h2] of [[1.2, 1.32, .2, .28], [1.48, 1.5, .22, .22], [1.76, 1.3, .17, .3]]) S.quad([[1.658, y, z + w2], [1.658, y, z], [1.658, y + h2, z], [1.658, y + h2, z + w2]], [220, 216, 200]);
  S.box(1.5, .3, .25, 1.66, .82, .41, [170, 28, 24]);
  S.box(-.16, 2.54, .9, .16, 2.6, 2.2, [168, 168, 164]);
  S.box(-1.62, 2.33, .08, -1.4, 2.45, .34, [58, 58, 60], { cam02: true }); S.box(-1.66, 2.45, .16, -1.6, OHT, .22, [90, 90, 90], { cam02: true });
  // the desk; the VCR under monitor A, the switcher under monitor B; the shelf with the two small monitors
  S.box(-1.3, .7, 2.3, 1.3, .745, OD, [96, 78, 58]);
  S.box(-1.3, 0, 3.2, 1.3, .7, 3.24, [70, 58, 44]); S.box(-1.3, 0, 2.3, -1.26, .7, OD, [80, 66, 50]); S.box(1.26, 0, 2.3, 1.3, .7, OD, [80, 66, 50]);
  S.box(-.66, .745, 2.9, -.14, .845, 3.26, [40, 40, 42]); S.box(-.06, .745, 2.9, .46, .845, 3.26, [54, 54, 58]);
  for (const [x, col] of [[-.4, [150, 144, 128]], [.2, [132, 132, 126]]]) { S.box(x - .25, .845, 2.94, x + .25, 1.29, 3.28, col); S.quad([[x - .215, .9, 2.9385], [x + .215, .9, 2.9385], [x + .215, 1.22, 2.9385], [x - .215, 1.22, 2.9385]], [18, 18, 20]); }
  S.box(-.7, 1.44, 2.95, .45, 1.47, OD, [110, 104, 96]);
  for (const x of [-.4, .15]) { S.box(x - .14, 1.47, 2.99, x + .14, 1.79, 3.29, [130, 126, 116]); S.quad([[x - .115, 1.55, 2.988], [x + .115, 1.55, 2.988], [x + .115, 1.71, 2.988], [x - .115, 1.71, 2.988]], [18, 18, 20]); }
  S.box(-1.0, .745, 2.36, -.92, .85, 2.44, [176, 60, 44]);                                     // mug
  S.box(-1.2, .745, 2.6, -.94, .82, 2.82, [44, 44, 46]);                                      // phone
  S.box(.1, .745, 2.42, .32, .78, 2.5, [24, 24, 26]);                                         // his flashlight
  S.box(.53, .745, 2.34, 1.03, .748, 2.7, [30, 52, 40]);                                     // the log's green cover under the pages
  S.box(1.08, .745, 2.46, 1.2, .77, 2.58, [40, 40, 40]); S.box(1.13, .77, 2.5, 1.15, 1.13, 2.52, [50, 50, 50]);   // the desk lamp
  S.box(1.03, 1.13, 2.42, 1.23, 1.22, 2.64, [52, 84, 60]);
}
const OFFICE = (() => { const S = new TK.Scene(); office(S); S.q.forEach(prep); return S; })();
const OFFICE02 = (() => { const S = new TK.Scene(); S.q = OFFICE.q.filter(q => !q.cam02); return S; })();
function lightsO(gain = 1) {
  return { amb: .07 * gain, src: [
    { p: [-.4, 1.06, 2.82], col: [.86, .92, 1.0], s: .9 * gain, r: 1.2, dir: -1 }, { p: [.2, 1.06, 2.82], col: [.84, .9, 1.0], s: .9 * gain, r: 1.2, dir: -1 },
    { p: [-.12, 1.63, 2.95], col: [.8, .88, 1.0], s: .3 * gain, r: 1.0, dir: -1 }, { p: [1.0, 1.57, .1], col: [1, .96, .86], s: .3 * gain, r: .8, dir: 1 },
    { p: LAMP, col: [1.0, .86, .64], s: 1.5 * gain, r: 1.2, dir: 0 }] };
}
function qLightO(q, Lo) {
  const c = q.c, n = q.n; let r = Lo.amb, g = Lo.amb, b = Lo.amb * 1.06;
  for (const L of Lo.src) {
    const v = [L.p[0] - c[0], L.p[1] - c[1], L.p[2] - c[2]], d = Math.hypot(...v) || 1, cs = Math.abs(dot3(n, v)) / d;
    const front = L.dir < 0 ? clamp((L.p[2] - c[2]) * 4 + .15) : L.dir > 0 ? clamp((c[2] - L.p[2]) * 4 + .15) : 1;
    const shade = L.p === LAMP && c[1] > LAMP[1] + .12 ? .55 : 1;                                   // the shade throws the lamp down
    const k = L.s * (.22 + .78 * cs) / (1 + Math.pow(d / L.r, 2)) * front * shade;
    r += k * L.col[0]; g += k * L.col[1]; b += k * L.col[2];
  }
  return [r, g, b];
}
let SIDE = null;
function buildSide() {
  SIDE = [];
  for (const [seed, cam, name, place] of [[2, { x: 3.6, y: 4.2, z: .4, yaw: -.1, pitch: -.36, fov: 80 }, 'CAM 13', 'LOADING DOCK'], [5, { x: -3.2, y: 4.0, z: 2, yaw: .25, pitch: -.4, fov: 70 }, 'CAM 15', 'EAST HALL']]) {
    const S = TK.concourse({ storeSeed: seed, lightsOn: z => ((z + seed * 4) % 12 === 3 ? .7 : 0) });
    TK.render(TG, S, cam, { ambient: 1.1, fog: .05 });
    const c = mk(W, H), cg = c.getContext('2d'); TK.grade(cg, TMP, seed, 'cctv');
    TK.osd(cg, 'cctv', 1, { cam: name, place, stamp: '12-09-1999  02:10:31' });
    SIDE.push(c);
  }
}
function crt(g, cam, S, img, o = {}) {
  const [cx, cy, cz] = S.c, hw = S.w / 2, hh = S.h / 2;
  const a = project(cam, [cx - hw, cy + hh, cz]), b = project(cam, [cx + hw, cy + hh, cz]), c = project(cam, [cx - hw, cy - hh, cz]);
  if (!a || !b || !c) return;
  const w = Math.hypot(b[0] - a[0], b[1] - a[1]);
  onQuad(g, a, b, c, W, H, q => {
    q.beginPath(); q.roundRect(0, 0, W, H, 80); q.clip();
    q.fillStyle = 'rgb(8,9,10)'; q.fillRect(0, 0, W, H);
    if (img) { q.globalAlpha = o.glow ?? 1; q.drawImage(img, 0, 0); q.globalAlpha = 1; }
    if (w > 260) { q.fillStyle = 'rgba(0,0,0,.24)'; for (let y = 0; y < H; y += 4.5) q.fillRect(0, y, W, 1.8); }
    const vg = q.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .68); vg.addColorStop(0, 'rgba(255,255,255,.05)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); q.fillStyle = vg; q.fillRect(0, 0, W, H);
  });
}
const SHEETLIT = mk(880, 1440), LOGLIT = mk(1380, 960);
function litCopy(dst, src, k, warm) {
  const g = dst.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `brightness(${k.toFixed(3)})`; g.drawImage(src, 0, 0); g.filter = 'none';
  if (warm) { g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(255,240,214)'; g.fillRect(0, 0, dst.width, dst.height); g.globalCompositeOperation = 'source-over'; }
}
function officeDetails(g, cam, t, Lo, mode) {
  // the rule sheet, the night log
  const ks = clamp(qLightO({ c: SHEET_C, n: [0, 0, -1] }, Lo)[1] * 1.15, .2, 1.08);
  litCopy(SHEETLIT, SHEET, ks, true); drawOnPlane(g, cam, SHEETLIT, sheetP, 4, 6);
  const kl = clamp(qLightO({ c: [.78, .75, 2.52], n: [0, 1, 0] }, Lo)[1] * 1.0, .2, 1.05);
  litCopy(LOGLIT, LOGC, kl, true); drawOnPlane(g, cam, LOGLIT, (u, v) => logP(u, v), mode === 'cam02' ? 4 : 10, mode === 'cam02' ? 3 : 8);
  // the lamp's bulb under its shade
  const lb = project(cam, [1.13, 1.11, 2.53]);
  if (lb) { const rr = cam.f * .05 / lb[2]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(lb[0], lb[1], 0, lb[0], lb[1], rr); gr.addColorStop(0, 'rgba(255,236,190,.85)'); gr.addColorStop(1, 'rgba(255,210,150,0)'); g.fillStyle = gr; g.fillRect(lb[0] - rr, lb[1] - rr, 2 * rr, 2 * rr); g.restore(); }
  // CAM 02's lens and its red light
  const lens = project(cam, [-1.5, 2.39, .345]);
  if (lens && mode !== 'cam02') {
    const rr = Math.max(2, cam.f * .03 / lens[2]);
    ell(g, lens[0], lens[1], rr, rr, 'rgb(8,8,10)');
    const led = project(cam, [-1.43, 2.355, .345]); if (led && Math.floor(t * 1.5) % 2 === 0) ell(g, led[0], led[1], rr * .4, rr * .4, 'rgb(255,60,40)');
  }
}
function renderOffice(g, camSpec, t, mode, Lo) {
  const cam = TK.render(g, litScene(mode === 'cam02' ? OFFICE02 : OFFICE, q => qLightO(q, Lo)), camSpec, { ambient: 1, fog: 0, bg: [6, 6, 7], grid: false });
  crt(g, cam, SCR.s1, SIDE[0], { glow: .55 }); crt(g, cam, SCR.s2, SIDE[1], { glow: .55 });
  crt(g, cam, SCR.A, SIDE[1], { glow: 1 }); crt(g, cam, SCR.B, SIDE[0], { glow: 1 });
  officeDetails(g, cam, t, Lo, mode);
  return cam;
}

// ================================================================ his right hand on the pen (first person): the sleeve from off
// the bottom right, the back of the hand, the thumb under the pen, the index finger on it. Drawn in metres about the pen tip
// (s = px per metre there). rho turns the hand about the tip while the forearm stays: at the end the wrist is bent too far
const SHIRT = [140, 156, 182], TROUS = [34, 38, 52], CAP = [28, 32, 50], SKIN = [182, 140, 112];
function capsule(g, a, b, w, fill, edge) {
  g.lineCap = 'round'; g.strokeStyle = edge; g.lineWidth = w + .0024; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  g.strokeStyle = fill; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
}
function penHand(g, tip, s, o) {
  const k = clamp(o.light ?? 1, .2, 1.1), sk = rgb(SKIN, k), skd = rgb(SKIN, k * .72), sl = rgb(SHIRT, k * .8), sld = rgb(SHIRT, k * .58);
  const rho = o.rho || 0, rot = o.rot || 0, cr = Math.cos(rho), sr = Math.sin(rho);
  const toS = ([x, y], hand = true) => { let X = x, Y = y; if (hand) { X = x * cr - y * sr; Y = x * sr + y * cr; } const c = Math.cos(rot), sn = Math.sin(rot); return [tip[0] + (X * c - Y * sn) * s, tip[1] + (X * sn + Y * c) * s]; };
  // forearm: from the wrist (moves with the hand) to the elbow (stays), and on out of the frame
  const wr = toS([.16, .035]), elb = toS([.62, .62], false), dir = [elb[0] - wr[0], elb[1] - wr[1]], dl = Math.hypot(dir[0], dir[1]) || 1, far = [elb[0] + dir[0] / dl * 2000, elb[1] + dir[1] / dl * 2000];
  g.save(); g.lineCap = 'round';
  g.strokeStyle = sld; g.lineWidth = .074 * s; g.beginPath(); g.moveTo(wr[0], wr[1]); g.lineTo(far[0], far[1]); g.stroke();
  g.strokeStyle = sl; g.lineWidth = .066 * s; g.beginPath(); g.moveTo(wr[0] + dir[0] / dl * .012 * s, wr[1] + dir[1] / dl * .012 * s); g.lineTo(far[0], far[1]); g.stroke();
  g.strokeStyle = rgb(SHIRT, k * .95); g.lineWidth = .01 * s; g.beginPath(); g.moveTo(wr[0] + dir[0] / dl * .03 * s - dir[1] / dl * .02 * s, wr[1] + dir[1] / dl * .03 * s + dir[0] / dl * .02 * s); g.lineTo(far[0], far[1]); g.stroke();
  g.restore();
  // the hand, in its own frame
  g.save(); g.translate(tip[0], tip[1]); g.rotate(rot); g.scale(s, s); g.rotate(rho);
  // under the hand: the curled middle and ring fingers (their roots hidden by the back of the hand)
  capsule(g, [.1, .045], [.058, .036], .019, skd, skd); capsule(g, [.058, .036], [.04, .014], .017, skd, skd);
  capsule(g, [.12, .055], [.085, .05], .018, skd, skd);
  const back = [[.06, -.07], [.1, -.084], [.15, -.056], [.18, -.005], [.172, .04], [.13, .062], [.085, .05], [.055, .012]];
  g.beginPath(); back.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = sk; g.fill(); g.lineWidth = .0024; g.strokeStyle = skd; g.stroke();
  const hl = g.createRadialGradient(.12, -.03, .005, .12, -.03, .07); hl.addColorStop(0, `rgba(255,236,214,${.18 * k})`); hl.addColorStop(1, 'rgba(255,236,214,0)'); g.fillStyle = hl; g.fill();
  g.strokeStyle = skd; g.lineWidth = .0018; g.lineCap = 'round';
  for (const [a, b] of [[[.078, -.068], [.092, -.056]], [[.1, -.076], [.114, -.06]], [[.124, -.066], [.136, -.05]]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  // the thumb: from the side of the hand, bent, its tip on the pen
  capsule(g, [.085, .03], [.05, .012], .021, sk, skd); capsule(g, [.05, .012], [.026, -.012], .018, sk, skd);
  ell(g, .029, -.012, .0055, .004, rgb([214, 180, 160], k), -.7);
  // the pen: a white barrel, the blue cap end, the tip
  const d = [.6, -.8];
  g.lineCap = 'butt'; g.strokeStyle = rgb([40, 40, 44], k); g.lineWidth = .0095; g.beginPath(); g.moveTo(d[0] * .012, d[1] * .012); g.lineTo(d[0] * .14, d[1] * .14); g.stroke();
  g.strokeStyle = rgb([228, 228, 222], k); g.lineWidth = .0078; g.beginPath(); g.moveTo(d[0] * .016, d[1] * .016); g.lineTo(d[0] * .12, d[1] * .12); g.stroke();
  g.strokeStyle = rgb([36, 56, 150], k); g.lineWidth = .0082; g.beginPath(); g.moveTo(d[0] * .12, d[1] * .12); g.lineTo(d[0] * .142, d[1] * .142); g.stroke();
  g.strokeStyle = rgb([70, 70, 74], k); g.lineWidth = .0034; g.beginPath(); g.moveTo(0, 0); g.lineTo(d[0] * .016, d[1] * .016); g.stroke();
  // the index finger over the pen: knuckle, bend, tip (two joints)
  capsule(g, [.088, -.07], [.052, -.064], .019, sk, skd); capsule(g, [.052, -.064], [.02, -.032], .017, sk, skd);
  ell(g, .025, -.035, .006, .0045, rgb([216, 184, 166], k), -.8);
  g.restore();
}

// ================================================================ Leon on CAM 02 (from behind, seated), it, its arm
function leonBackAt(g, fx, fy, u, k, o = {}) {
  const C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`;
  g.save(); g.translate(fx, fy); g.scale(u, u);
  let hand = [.27 + (o.dx || 0), -1.0 + (o.dy || 0)];
  if (o.hand) {                                                                                // writing in front of him: the forearm comes out past his left side
    hand = [(o.hand[0] - fx) / u, (o.hand[1] - fy) / u];
    g.lineCap = 'round'; g.strokeStyle = C(SHIRT, .8); g.lineWidth = .075; g.beginPath(); g.moveTo(.05, -1.2); g.lineTo(hand[0] + .04, hand[1] + .01); g.stroke();
    ell(g, hand[0], hand[1], .045, .032, C(SKIN, .9));
  }
  poly(g, [[-.25, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT));
  poly(g, [[-.25, -1.47], [-.02, -1.47], [-.02, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT, .9));
  g.strokeStyle = C(SHIRT, .7); g.lineWidth = .008; g.beginPath(); g.moveTo(0, -1.45); g.lineTo(0, -.97); g.moveTo(-.2, -1.38); g.quadraticCurveTo(0, -1.33, .2, -1.38); g.stroke();
  poly(g, [[-.22, -1.45], [-.29, -1.48], [-.46, -1.38], [-.43, -1.31], [-.29, -1.38]], C(SHIRT, .92));
  poly(g, [[-.46, -1.38], [-.42, -1.31], [-.19, -1.6], [-.15, -1.66], [-.2, -1.69]], C(SHIRT, .86));
  g.fillStyle = C([22, 22, 24]); g.fillRect(-.26, -1.76, .2, .13); g.fillStyle = C([40, 40, 44]); g.fillRect(-.08, -1.73, .06, .07);
  ell(g, -.2, -1.66, .035, .03, C(SKIN, .85));
  if (!o.hand) {
    const elbow = [.33, -1.16];
    g.lineCap = 'round'; g.strokeStyle = C(SHIRT, .88); g.lineWidth = .1;
    g.beginPath(); g.moveTo(.21, -1.42); g.lineTo(elbow[0], elbow[1]); g.stroke();
    g.lineWidth = .075; g.beginPath(); g.moveTo(elbow[0], elbow[1]); g.lineTo(hand[0], hand[1]); g.stroke();
    ell(g, hand[0], hand[1], .04, .036, C(SKIN, .8));
  }
  poly(g, [[-.05, -1.58], [.05, -1.58], [.058, -1.47], [-.058, -1.47]], C(SKIN, .7));
  ell(g, -.1, -1.655, .02, .034, C(SKIN, .85)); ell(g, .1, -1.655, .02, .034, C(SKIN, .85));
  ell(g, 0, -1.665, .1, .1, C([24, 20, 18]));
  poly(g, [[-.07, -1.59], [.07, -1.59], [.05, -1.565], [-.05, -1.565]], C([24, 20, 18]));
  g.beginPath(); g.moveTo(-.118, -1.69); g.bezierCurveTo(-.122, -1.86, .122, -1.86, .118, -1.69); g.closePath(); g.fillStyle = C(CAP); g.fill();
  g.fillStyle = C([70, 72, 80]); g.fillRect(-.055, -1.695, .11, .012);
  g.restore();
  return [fx + hand[0] * u, fy + hand[1] * u];
}
function broken(g, cam, x, z, o) {
  const feet = project(cam, [x, 0, z]); if (!feet) return null;
  if (!o.mirror) return TK.ghost(g, cam, 'broken', x, z, o);
  g.save(); g.translate(feet[0], 0); g.scale(-1, 1); g.translate(-feet[0], 0);
  const r = TK.ghost(g, cam, 'broken', x, z, o); g.restore(); return r;
}
// its arm, too long, from its shoulder over his to his writing hand; the fingers close over his
function reachArm(g, G, bend, target, r) {
  const lean = .04 + bend, uf = G.u, lx = .25 * Math.cos(lean) + .75 * Math.sin(lean), ly = .25 * Math.sin(lean) - .75 * Math.cos(lean) - 1.02;
  const sh = [G.feet[0] - lx * uf, G.feet[1] + ly * uf], hang = [sh[0] - .05 * uf, sh[1] + .7 * uf], hand = [lerp(hang[0], target[0], r), lerp(hang[1], target[1], r)];
  const el = [lerp(sh[0], hand[0], .5) + .1 * uf * r, lerp(sh[1], hand[1], .5) - .18 * uf * r];
  g.save(); g.filter = `blur(${Math.max(1, uf * .012).toFixed(1)}px)`; g.strokeStyle = 'rgb(5,5,6)'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = .075 * uf; g.beginPath(); g.moveTo(sh[0], sh[1]); g.lineTo(el[0], el[1]); g.stroke();
  g.lineWidth = .055 * uf; g.beginPath(); g.moveTo(el[0], el[1]); g.lineTo(hand[0], hand[1]); g.stroke();
  const dir = Math.atan2(hand[1] - el[1], hand[0] - el[0]);
  for (let i = 0; i < 4; i++) {
    const a = dir + (i - 1.5) * .3, L = (.17 + .04 * (i === 1 || i === 2)) * uf, c = .8 * r;
    g.lineWidth = .016 * uf; g.beginPath(); g.moveTo(hand[0], hand[1]);
    g.quadraticCurveTo(hand[0] + Math.cos(a) * L * .6, hand[1] + Math.sin(a) * L * .6, hand[0] + Math.cos(a + c) * L, hand[1] + Math.sin(a + c) * L); g.stroke();
  }
  g.restore();
}
const BR2 = [1.16, 2.16, .55];
// where his pen is on CAM 02: writing (cctv1); after the rip, slowly, at the bottom of the torn page (cctv2)
function penPos02(tq, shot) {
  if (shot === 'cctv1') return logAt(Math.min(tq, SH.cam1[2])).pen;
  const u = tq - SH.cctv2[1]; return [RIP_END[0] + 60 + 40 * Math.sin(u * 1.3), RIP_END[1] - 120 - 30 * Math.sin(u * 2.1)];
}
function cctv02(g, tq, shot) {
  const Lo = lightsO(1.8), cam = renderOffice(g, CAM02, tq, 'cam02', Lo);
  const feet = project(cam, [AXIS[0], -.55, AXIS[2]]), head = project(cam, [AXIS[0], 1.25, AXIS[2]]);
  const u = (feet[1] - head[1]) / 1.8;
  const bend2 = BR2[2] + .1 * ease(kOf(tq, [SH.cctv2[1] + .5, SH.cctv2[2] - 1])), tilt2 = .15 + .12 * ease(kOf(tq, [28.5, 30]));
  const gr = shot === 'cctv2' ? broken(g, cam, BR2[0], BR2[1], { light: .2, bend: bend2, tilt: tilt2, armR: .05, seed: 8, mirror: true }) : null;
  const pp = penPos02(tq, shot), hp = project(cam, logP(pp[0], pp[1], .02));
  g.save(); g.beginPath(); g.rect(0, 0, W, feet[1] - .92 * u); g.clip();
  const hand = leonBackAt(g, feet[0], feet[1], u, .78, { hand: [hp[0], hp[1]] });
  g.restore();
  const cb = [[-.2, .55], [.2, .55], [.18, .9], [-.18, .9]].map(([x, y]) => project(cam, [AXIS[0] + x, y, AXIS[2] - .2]));
  if (cb.every(Boolean)) poly(g, cb.map(p => [p[0], p[1]]), 'rgb(26,26,28)');
  const col = project(cam, [AXIS[0], .1, AXIS[2] - .05]), seat = project(cam, [AXIS[0], .46, AXIS[2] - .05]);
  if (col && seat) { g.strokeStyle = 'rgb(20,20,22)'; g.lineWidth = u * .05; g.beginPath(); g.moveTo(seat[0], seat[1]); g.lineTo(col[0], col[1]); g.stroke(); ell(g, col[0], col[1], u * .3, u * .06, 'rgb(18,18,20)'); }
  if (shot === 'cctv1') broken(g, cam, 1.4, 1.02, { light: .1, bend: .05, tilt: .18, armR: 0, seed: 8, mirror: true, alpha: .9 });
  else if (gr) reachArm(g, gr, bend2, hand, 1);
  return { cam, hand };
}

// ================================================================ HIS CAMCORDER
// cam1 keys: [t, eye, aim point, fov]
const K1 = [[0, [.81, 1.56, 2.74], [.81, 1.56, 3.3], 55], [3.6, [.81, 1.56, 2.73], [.81, 1.556, 3.3], 53.5], [7.0, [.86, 1.53, 2.46], [.78, 1.5, 3.3], 64],
  [7.3, [.86, 1.53, 2.46], [.78, 1.49, 3.3], 64], [8.4, [.8, 1.45, 2.2], [.8, .76, 2.56], 48], [9.6, [.8, 1.45, 2.22], [.86, .76, 2.6], 41], [10.3, [.8, 1.45, 2.22], [.87, .76, 2.6], 40.5],
  [10.95, [.82, 1.5, 2.36], [.81, 1.5, 3.3], 50], [12.2, [.82, 1.5, 2.37], [.81, 1.47, 3.3], 47], [13.1, [.8, 1.45, 2.2], [.82, .76, 2.55], 48], [13.4, [.8, 1.45, 2.2], [.82, .76, 2.55], 47.5]];
function keyAt(K, t) {
  let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], k = ease(kOf(t, [a[0], b[0]]));
  return { eye: lerp3(a[1], b[1], k), aim: lerp3(a[2], b[2], k), fov: lerp(a[3], b[3], k), fast: b[0] - a[0] < 1.3 && t > a[0] && t < b[0] ? Math.sin(PI * kOf(t, [a[0], b[0]])) : 0 };
}
function nerveAt(t) {
  if (t < 7) return .1;
  if (t < SH.cam1[2]) return .25;
  if (t < 19) return .3;
  if (t < TL.QUIET[0]) return .3 + .6 * kOf(t, [19, TL.QUIET[0]]);
  if (t < TL.STING) return .06;
  return 1.2;
}
function pen3(t) { const L = logAt(t); return { L, w: logP(L.pen[0], L.pen[1], L.down ? 0 : .007) }; }
function poseCam(t, shot) {
  let eye, aim, fov, fast = 0;
  if (shot === 'cam1') ({ eye, aim, fov, fast } = keyAt(K1, t));
  else {
    eye = [.8, 1.2, 2.02];
    const lagT = Math.min(t, TL.QUIET[0]) - .35, P = logAt(Math.max(SH.cam2[1], lagT)), pw = logP(P.pen[0], P.pen[1]);
    aim = lerp3([.9, .75, 2.55], pw, .55); aim[0] -= .03;
    fov = lerp(37, 31, ease(kOf(t, [16, 22.8])));
    if (t >= TL.RIP[0]) { const k = ease(kOf(t, [TL.RIP[0], TL.BEND[1]])); aim = lerp3(aim, [.76, .75, 2.43], k * .7); fov = lerp(fov, 33, k); }
  }
  const cs = lookAt(eye, aim, fov), h = handheld(t, nerveAt(t)), s = .5 + .5 * fov / 50;
  let yaw = cs.yaw + h.yaw * s, pitch = cs.pitch + h.pitch * s, roll = h.roll, y = cs.y - h.y * .3;
  if (shot === 'cam2' && t >= TL.STING) {
    const u = t - TL.STING; yaw += .05 * Math.sin(u * 31) * Math.exp(-u * 4); pitch -= u < .1 ? .06 * (1 - u / .1) : 0; roll += .06 * Math.sin(u * 23) * Math.exp(-u * 3);
    const r = ease(kOf(t, TL.RECOIL)); pitch += .55 * r; yaw -= .25 * r; roll -= .25 * Math.sin(PI * r); y += .1 * r;
  }
  return { cam: { x: cs.x, y, z: cs.z, yaw, pitch, fov }, roll, fast };
}
function gainNoise(g, t, a) { TK.statics(NZG, t * 1.37 + 3, 1); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .42; g.drawImage(NZ, 0, 0); g.restore(); }
function glitchAt(t) { for (let i = 0; i < TL.GLITCH.length; i++) { const [t0, d] = TL.GLITCH[i]; if (t >= t0 && t < t0 + d) return [(t - t0) / d, i]; } return null; }
function tear(g, t, amp) {
  const R = TK.rng(Math.floor(t * 60) + 9), n = 1 + Math.floor(amp * 4);
  for (let i = 0; i < n; i++) { const band = 24 + R() * 130, y = R() * (H - band), dx = (R() - .5) * 220 * amp; g.drawImage(g.canvas, 0, y, W, band, dx, y + (R() - .5) * 10 * amp, W, band); }
}
function trackingRoll(g, t, k) {
  const off = Math.floor((1 - ease(k)) * H * .9), snap = trackingRoll.c || (trackingRoll.c = mk(W, H)), sg = snap.getContext('2d');
  sg.drawImage(g.canvas, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.drawImage(snap, 0, off); g.drawImage(snap, 0, off - H);
  g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(0, off - 18, W, 36); TK.statics(g, t, .35 * (1 - k));
}
function camcorder(shot, t, opening) {
  const P = poseCam(t, shot), Lo = lightsO(1);
  logAt(t);
  const cam = renderOffice(RG, P.cam, t, 'pov', Lo);
  FGG.setTransform(1, 0, 0, 1, 0, 0); FGG.clearRect(0, 0, W, H);
  if (shot === 'cam2' && t < TL.RECOIL[1]) {
    const L = logAt(t), tipW = logP(L.pen[0], L.pen[1], L.down ? 0 : (t >= TL.QUIET[0] && t < TL.STING ? .012 : .006)), tp = project(cam, tipW);
    if (tp) {
      let rho = 0, rot = -.05 + .04 * Math.sin(t * 1.9);
      if (t >= TL.WRITES[1][1] && t < TL.QUIET[0]) rot += .05 * Math.sin(t * 17) * kOf(t, [19, TL.QUIET[0]]);       // it shakes as it speeds up
      if (t >= TL.RIP[0]) { rho = 1.5 * ease(kOf(t, TL.BEND)); rot += .03 * Math.sin(t * 41); }
      penHand(FGG, [tp[0], tp[1]], cam.f / tp[2] * .76, { light: clamp(qLightO({ c: tipW, n: [0, 1, 0] }, Lo)[1] * .95, .3, 1), rho, rot });
    }
  }
  let blur = .45 + (P.cam.fov < 32 ? .3 : 0) + 3.2 * P.fast;
  if (t >= TL.RIP[0] && t < TL.RIP[1] + .15) blur += 2.5;
  if (inR(t, TL.RECOIL)) blur += 7 * Math.sin(PI * kOf(t, TL.RECOIL));
  WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, W, H);
  WK.translate(540, 405); WK.rotate(P.roll || 0); WK.scale(1.05, 1.05); WK.translate(-540, -405);
  WK.filter = `blur(${blur.toFixed(2)}px)`; WK.drawImage(RAW, 0, 0);
  WK.filter = `blur(${(inR(t, TL.RECOIL) ? blur : t >= TL.RIP[0] && t < TL.RIP[1] + .1 ? 3 : 0).toFixed(2)}px)`; WK.drawImage(FG, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
  let br = 1.12 + .03 * Math.sin(t * 1.7);
  if (t >= TL.STING && t < TL.STING + .12) br *= 1.35;                                           // the auto-iris jumps at the hit
  TK.grade(WG, WORK, t, 'camcorder', { brightness: br });
  gainNoise(WG, t, t >= TL.STING ? .26 : shot === 'cam2' ? .1 + .08 * kOf(t, [19, TL.QUIET[0]]) : .08);
  const gk = glitchAt(t); TK.vhs(WG, t, gk ? 2.2 : .9, 6);
  if (t >= TL.STING && t < TL.STING + .2) { tear(WG, t, .6); }
  if (!opening) TK.osd(WG, 'camcorder', t, { time: shot === 'cam1' ? 'AM 2:10' : 'AM 2:11', date: 'DEC.09.1999', battery: 1 });
}

// ---------------------------------------------------------------- CAM 02 playback (6 fps), by the archive
function stampAt(shot, tq) {
  const base = shot === 'cctv1' ? TL.STAMP1 : TL.STAMP2;
  const s = base[0] * 3600 + base[1] * 60 + base[2] + Math.floor(tq - SH[shot][1]);
  return `${TL.DATE}  ${p2(Math.floor(s / 3600) % 24)}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`;
}
let HAND02 = [540, 405];
function cctvZoom(shot, t) {
  if (shot === 'cctv1') return { z: 1.12, f: HAND02, k: .5 };
  const k = ease(kOf(t, TL.PUSH2)); return { z: lerp(1, 1.55, k), f: [lerp(W / 2, HAND02[0] + 40, k), lerp(H / 2, HAND02[1] - 120, k)], k: .55 * k };
}
function zoomInto(dst, src, z, f, k) {
  let tx = lerp(f[0], W / 2, k), ty = lerp(f[1], H / 2, k);
  tx = clamp(tx, W - (W - f[0]) * z, f[0] * z); ty = clamp(ty, H - (H - f[1]) * z, f[1] * z);
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.fillStyle = '#000'; dst.fillRect(0, 0, W, H);
  dst.setTransform(z, 0, 0, z, tx - f[0] * z, ty - f[1] * z); dst.drawImage(src, 0, 0); dst.setTransform(1, 0, 0, 1, 0, 0);
}
function readout(g, z) {
  g.save(); g.font = '38px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,235,.88)';
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2; g.shadowOffsetY = 2; g.fillText(`PLAYBACK  x${z.toFixed(1)}`, W / 2, 32); g.restore();
}
function shotCctv(shot, t) {
  const tq = qf(t);
  logAt(shot === 'cctv1' ? Math.min(tq, SH.cam1[2]) : SH.cam2[2]);
  cctv02(RG, tq, shot);
  const Z = cctvZoom(shot, t);
  zoomInto(WK, RAW, Z.z, Z.f, Z.k);
  TK.grade(WG, WORK, tq, 'cctv', { brightness: 1.55 });
  const gk = glitchAt(t); TK.vhs(WG, tq, gk ? 2.5 : 1, 5);
  if (gk) { tear(WG, t, Math.sin(gk[0] * PI)); TK.statics(WG, t, .4 * Math.sin(gk[0] * PI)); }
  const t0 = SH[shot][1]; if (t < t0 + .3) trackingRoll(WG, t, kOf(t, [t0, t0 + .3]));
  TK.osd(WG, 'cctv', t, { cam: 'CAM 02', place: 'GUARD OFFICE', stamp: stampAt(shot, tq) });
  if (Z.z > 1.01) readout(WG, Z.z);
}

// ---------------------------------------------------------------- the full-screen opening (as tapes 12-13): the first 3 s fill the
// 9:16 frame (the tape picture scaled to the full 1920 height, the sides cropped), then the archive deck zooms out (0.6 s, a
// head-switch band rolling through) into the usual layout. Here the opening is his camcorder, so its own REC/time box is drawn
// at the 9:16 size
const OSC = 1920 / H, OSW = W / OSC, OPEN_CX = 540;
function frameOpts(t) {
  const ak = kOf(t, [TL.ASK_T, TL.ASK_T + .7]), n = Math.ceil(ak * TL.ASK.length);
  return { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: clamp((t - .8) / .6), ask: t >= TL.ASK_T ? TL.ASK.slice(0, n) : null, askFull: TL.ASK };
}
function osdCamBox(g, t, X, Y, Wb, Hb, s, time, date) {
  g.save(); g.font = `${Math.round(46 * s)}px "VT323"`; g.textBaseline = 'top'; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2 * s; g.shadowOffsetY = 2 * s;
  if (Math.floor(t * 1.6) % 2 === 0) { g.fillStyle = 'rgba(255,60,60,.95)'; g.beginPath(); g.arc(X + 52 * s, Y + 52 * s, 13 * s, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(235,240,235,.92)'; g.textAlign = 'left'; g.fillText('REC', X + 76 * s, Y + 30 * s);
  g.strokeStyle = 'rgba(235,240,235,.92)'; g.lineWidth = 3 * s; g.strokeRect(X + Wb - 120 * s, Y + 36 * s, 70 * s, 30 * s); g.fillRect(X + Wb - 50 * s, Y + 44 * s, 6 * s, 14 * s); g.fillRect(X + Wb - 114 * s, Y + 42 * s, 16 * s, 18 * s);
  g.textAlign = 'right'; g.fillText(time, X + Wb - 36 * s, Y + Hb - 128 * s); g.fillText(date, X + Wb - 36 * s, Y + Hb - 82 * s);
  g.restore();
}
function capAt(g, text, a, cy, s) {
  if (!text || a <= 0) return;
  g.save(); g.globalAlpha = a; g.font = `${Math.round(44 * s)}px "VT323"`; g.textAlign = 'center'; g.textBaseline = 'middle';
  text.split('\n').forEach((ln, i) => { const w = g.measureText(ln).width + 28 * s, y = cy + i * 50 * s; g.fillStyle = 'rgba(0,0,0,.82)'; g.fillRect(540 - w / 2, y - 25 * s, w, 48 * s); g.fillStyle = '#f2f2f2'; g.fillText(ln, 540, y); });
  g.restore();
}
function openingFrame(t) {
  const O = TL.OPEN, k = ease(kOf(t, [O.full, O.end]));
  if (t >= O.full) TK.frame(OUT, WIN, frameOpts(t));
  else { OUT.setTransform(1, 0, 0, 1, 0, 0); OUT.fillStyle = '#000'; OUT.fillRect(0, 0, 1080, 1920); }
  const sc = lerp(OSC, 1, k), x0 = lerp(-(OPEN_CX - OSW / 2) * OSC, 0, k), y0 = lerp(0, TK.WIN_Y, k);
  OUT.save(); OUT.imageSmoothingQuality = 'high'; OUT.drawImage(WIN, x0, y0, W * sc, H * sc);
  if (t >= O.full) {
    const a = Math.sin(PI * k), by = y0 + (H * sc) * (.15 + .8 * k);
    OUT.beginPath(); OUT.rect(x0, y0, W * sc, H * sc); OUT.clip();
    TK.statics(NZG, t * 1.37 + 7, 1); OUT.globalAlpha = .55 * a; OUT.drawImage(NZ, 0, 0, W, 40, 0, by - 26 * sc, 1080, 52 * sc);
    OUT.globalAlpha = .7 * a; OUT.fillStyle = 'rgb(235,235,230)'; OUT.fillRect(0, by + 28 * sc, 1080, 3);
  }
  OUT.restore();
  osdCamBox(OUT, t, 0, lerp(150, TK.WIN_Y, k), 1080, lerp(1560, H, k), lerp(1.4, 1, k), 'AM 2:10', 'DEC.09.1999');
  for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) capAt(OUT, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06), lerp(300, TK.WIN_Y + 117, k), lerp(1.3, 1, k));
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  sheetAt(t);
  const s = shotAt(t), inStatic = !s || TL.STATIC.some(([a, b]) => t >= a && t < b);
  const opening = !!(TL.OPEN && TL.OPEN.on && s && s[0] === 'cam1' && t < TL.OPEN.end);
  if (inStatic) TK.statics(WG, t, 1);
  else if (s[0].startsWith('cctv')) shotCctv(s[0], t);
  else camcorder(s[0], t, opening);
  if (opening) return openingFrame(t);
  if (!inStatic) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) capAt(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06), 117, 1);
  TK.frame(OUT, WIN, frameOpts(t));
}
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound only)
// Everything is in the office: the monitors' whine and the vent (office_hum), his breath, his camcorder in his hand, his chair,
// his pen on the log, the page tearing under it, the desk under his fist. Close by him, from when the pen speeds up, a slow
// calm breath that is not his (it is standing over him: CAM 02). CAM 02's own mic hears the room and the pen, far.
// space: close (at his mic), shop (the office), tape / archive (after the recording chain)
const PEN0_DB = -17;
function buildEvents() {
  const EV = [], Q = TL.QUIET[0];
  EV.push(
    { type: 'bed', fx: 'office_hum', space: 'shop', t: 0, t1: SH.cam1[2], g: -33, fin: .01, fout: .01 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: .2, t1: SH.cam1[2], g: -40, fin: 1.0, fout: .02 },
    // frame 1: the ninth rule writes itself on the sheet; a ballpoint scratching, close (review 11/27: audible on a phone by 1.5 s)
    ...sheetInkTimes().map(([t0, t1]) => ({ type: 'bed', fx: 'pen_fast', space: 'close', t: t0, t1: Math.max(t1, t0 + .05), g: PEN0_DB, fin: .008, fout: .012 })),
    { type: 'rustle', t: TL.TO_LOG[0] + .05, g: .35 }, { type: 'rustle', t: TL.TO_SHEET[0] + .03, g: .3 }, { type: 'rustle', t: TL.BACK_LOG[0] + .05, g: .3 },
    // CAM 02 at 2:11: the room, his pen, far
    { type: 'vcr', t: SH.cctv1[1] },
    { type: 'bed', fx: 'office_hum', space: 'shop', t: SH.cctv1[1], t1: SH.cctv1[2], g: -33, fin: .01, fout: .01 },
    { type: 'bed', fx: 'pen_write', space: 'shop', t: SH.cctv1[1] + .05, t1: SH.cctv1[2], g: -44, fin: .02, fout: .02 },
    // his camcorder again: he settles in the chair; writes; the pen does not stop
    { type: 'chair', t: SH.cam2[1] + .03, g: .8 }, { type: 'handling', t: SH.cam2[1] + .05, g: .35 },
    { type: 'bed', fx: 'office_hum', space: 'shop', t: SH.cam2[1], t1: Q, g: -33, fin: .01, fout: .2 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: SH.cam2[1] + .1, t1: Q, g: -38.5, fin: .4, fout: .05 },
    { type: 'bed', fx: 'near_breath', space: 'close', t: 19.0, t1: Q, g: -30, fin: 2.5, fout: .02, env: [[19, 1], [20.4, 1], [20.55, .55], [22.75, .55], [22.9, 1], [24, 1]] },   // review 11/27: up from -39 to read as distinct; dips 5 dB under L4
    ...TL.WRITES.map(([, t0, t1], i) => ({ type: 'bed', fx: i === 0 ? 'pen_write' : 'pen_fast', space: 'close', t: t0, t1: Math.min(t1, Q), g: i === 0 ? -33 : -34.5 + i * .4, fin: .01, fout: .01 })),
    // the rip, the hand on the desk, his gasp; he jerks back
    { type: 'rip', t: TL.STING }, { type: 'thump', t: TL.STING + .03, g: .55 }, { type: 'gasp', t: TL.STING + .07 },
    { type: 'bed', fx: 'office_hum', space: 'shop', t: TL.STING, t1: SH.cam2[2], g: -33, fin: .3, fout: .01 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: TL.STING + .5, t1: SH.cam2[2], g: -31, fin: .1, fout: .02 },
    { type: 'chair', t: TL.RECOIL[0] + .02, g: 1 }, { type: 'handling', t: TL.RECOIL[0] + .05, g: .9 },
    // CAM 02 at 2:12: it, over him; the pen, slow
    { type: 'vcr', t: SH.cctv2[1] },
    { type: 'bed', fx: 'office_hum', space: 'shop', t: SH.cctv2[1], t1: TL.END, g: -33, fin: .01, fout: .02 },
    { type: 'bed', fx: 'pen_write', space: 'shop', t: SH.cctv2[1] + .3, t1: TL.END - .3, g: -45, fin: .3, fout: .2 },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    buildSheet(); buildLog(); buildSide();
    const last = TL.WRITES.length - 1; logAt(TL.QUIET[0] - 1e-3);
    { const [, t0, t1] = TL.WRITES[last], g = mk(4, 4).getContext('2d'); RIPL = { a: inkLine(g, LAYS[last], kOf(TL.QUIET[0], [t0, t1]), INK, 1).pen }; }
    const c02 = mkCam(CAM02), feet = project(c02, [AXIS[0], -.55, AXIS[2]]), head = project(c02, [AXIS[0], 1.25, AXIS[2]]), u = (feet[1] - head[1]) / 1.8;
    const hp = project(c02, logP(RIP_END[0] + 60, RIP_END[1] - 120, .02)); HAND02 = [hp[0], hp[1]];
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
