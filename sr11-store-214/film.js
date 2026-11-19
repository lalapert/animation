// STILL RECORDING, tape 11: "Store 214". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white). Script: channel/scripts/SR11_store_214.md
// Upper level, store 214 (HALE & ROSE), closed behind its roll-down grille; four mannequins on the display riser. Leon's
// camcorder (colour, hand-held, his flashlight) is cut against CAM 31's tape played back by the archive (black and white,
// 6 frames a second). The Display (entity B): on the camcorder the mannequins never move; on CAM 31 the one in the red dress
// is somewhere else every time. The mannequins are built in 3D from tapered bodies swept along curved spines (like tape 9's
// horses), jointed at the neck, shoulders and elbows, with the seams at the neck and wrists. Scare type: THE LIGHTS COME ON
// AND IT IS RIGHT THERE (the display lights clunk on: it is at the grille in front of his lens and shakes the bars). Not
// right beside him (tape 8), not movement only (tape 9), not a hand over the lens (tape 10).
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const W = TK.TW, H = TK.TH;
const RAW = mk(W, H), RG = RAW.getContext('2d'), LMAP = mk(W, H), LG = LMAP.getContext('2d'), FG = mk(W, H), FGG = FG.getContext('2d');
const NZ = mk(W, H), NZG = NZ.getContext('2d'), WORK = mk(W, H), WK = WORK.getContext('2d'), WIN = mk(W, H), WG = WIN.getContext('2d');
const ALB = mk(W, H), ALG = ALB.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, M = TK.motion, TAU = Math.PI * 2, PI = Math.PI;
const qf = t => Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;
const shotAt = t => TL.SHOTS.find(s => t >= s[1] && t < s[2]);
const SH = Object.fromEntries(TL.SHOTS.map(s => [s[0], s]));
const inR = (t, a) => t >= a[0] && t < a[1];
const kOf = (t, a) => clamp((t - a[0]) / (a[1] - a[0]));
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len3 = a => Math.hypot(a[0], a[1], a[2]), nrm3 = a => mul3(a, 1 / (len3(a) || 1));
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } };
const ell = (g, x, y, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.2832); g.fillStyle = fill; g.fill(); };
const rgb = (c, k = 1) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
function onQuad(g, TLp, TRp, BLp, w, h, draw) {
  if (!TLp || !TRp || !BLp) return;
  g.save(); g.transform((TRp[0] - TLp[0]) / w, (TRp[1] - TLp[1]) / w, (BLp[0] - TLp[0]) / h, (BLp[1] - TLp[1]) / h, TLp[0], TLp[1]); draw(g); g.restore();
}
function mkCam(c) {
  const f = .5 * W / Math.tan(c.fov * PI / 360), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  return Object.assign({}, c, { f, W, H, toCam(p) { const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; } });
}
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const lookAt = (from, to, fov) => { const d = sub3(to, from); return { x: from[0], y: from[1], z: from[2], yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), fov }; };
let PASS = 'lit';                                   // sprites draw lit colours, or plain albedo for the flashlight pass
function prep(q) {
  const P = q.p, c = [0, 1, 2].map(i => (P[0][i] + P[1][i] + P[2][i] + P[3][i]) / 4);
  const u = sub3(P[1], P[0]), v = sub3(P[3], P[0]);
  q.c = c; q.n = nrm3([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
}
function lit(S, light) {
  const out = new TK.Scene(), m = (c, f) => [c[0] * f[0], c[1] * f[1], c[2] * f[2]];
  out.q = S.q.map(q => { if (!q.c) prep(q); if (q.emit) return q; const f = light(q); return Object.assign({}, q, { col: m(q.col, f), textCol: q.textCol && m(q.textCol, f) }); });
  return out;
}
const pointLight = (c, n, p, a, r, down = false) => {
  const v = sub3(p, c), d = len3(v) || 1, cs = Math.abs(dot3(n, v)) / d;
  return a * (.25 + .75 * cs) / (1 + Math.pow(d / r, 2)) * (down ? clamp((p[1] - c[1]) * 1.5 + .1) : 1);
};

// ================================================================ THE UPPER LEVEL AT STORE 214
// The storefront is the plane z 0 (the grille spans x -2.6..2.6, 2.9 high); the corridor is z < 0 (its rail over the atrium at
// z -6.2); the store is z 0..6 behind the grille: the display riser (z .55..2.0) with four mannequins on stands, the sale
// banner, two racks, the counter, the track of display spots (off, until they clunk on)
const GX = 2.6, GH = 2.9, RISER = [.55, 2.0, .28];
const STANDS = [[-1.5, 1.28], [-.5, 1.22], [.5, 1.3], [1.5, 1.24]];         // the four stands on the riser (x, z); the red dress is 2
const SPOTS = [-1.6, -.8, 0, .8, 1.6].map(x => [x, 2.92, 1.25]);
const NIGHT = [[-4.6, 3.45, -2.6], [.4, 3.45, -1.9], [5.0, 3.45, -2.8]];  // the corridor's night lights (every other one on)
const CAM31 = lookAt([-1.6, 3.35, -5.7], [.32, 1.2, .7], 46);
function buildStore() {
  const S = new TK.Scene(), R = TK.rng(214);
  // corridor floor: 0.6 m terrazzo tiles, a darker border along the storefronts
  for (let i = -12; i < 12; i++) for (let j = 0; j < 11; j++) {
    const x = i * .6, z = -j * .6 - .6, b = j === 0;
    const c = b ? [96, 92, 88] : ((i + j) & 1 ? [168, 164, 156] : [158, 154, 146]).map(v => v * (.96 + R() * .06));
    S.quad([[x, 0, z], [x + .6, 0, z], [x + .6, 0, z + .6], [x, 0, z + .6]], c, { floor: true });
  }
  // the corridor ceiling and its light fittings
  for (let i = -6; i < 6; i++) for (let j = 0; j < 4; j++) {
    const x = i * 1.2, z = -j * 1.6 - 1.6;
    S.quad([[x, 3.6, z + 1.6], [x + 1.2, 3.6, z + 1.6], [x + 1.2, 3.6, z], [x, 3.6, z]], (i + j) & 1 ? [112, 112, 108] : [120, 120, 116]);
  }
  for (const p of NIGHT) S.box(p[0] - .3, 3.5, p[2] - .3, p[0] + .3, 3.6, p[2] + .3, [190, 190, 184]);
  // the rail over the atrium: glass panels, the steel handrail; beyond it, nothing
  S.box(-7.2, 0, -6.25, 7.2, .08, -6.15, [84, 84, 84]);
  S.box(-7.2, 1.02, -6.26, 7.2, 1.08, -6.14, [150, 150, 152]);
  for (let x = -7; x <= 7; x += 1.4) S.box(x - .02, .08, -6.22, x + .02, 1.02, -6.18, [120, 120, 124]);
  // the storefronts: pilasters, the fascia over 214 with its sign, the neighbours behind solid shutters with their signs
  const front = (x0, x1, y0, y1, c, o) => S.quad([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], c, o);
  front(-7.2, -2.9, 0, 3.6, [60, 60, 62]); front(2.9, 7.2, 0, 3.6, [60, 60, 62]);
  front(-2.9, -2.6, 0, 3.6, [176, 170, 158]); front(2.6, 2.9, 0, 3.6, [176, 170, 158]);
  front(-2.6, 2.6, GH, 3.6, [34, 32, 34]);
  front(-1.5, 1.5, 3.08, 3.44, [34, 32, 34], { text: 'HALE & ROSE', textCol: [236, 220, 200] });
  front(2.62, 2.88, 2.3, 2.5, [210, 200, 170], { text: '214', textCol: [30, 30, 30] });
  for (const [x0, x1, name] of [[-7.0, -3.1, 'LOOMIS SHOES'], [3.1, 7.0, 'PAGE & PEN BOOKS']]) {
    S.quad([[x0, 0, -.02], [x1, 0, -.02], [x1, 2.9, -.02], [x0, 2.9, -.02]], [118, 118, 116], { tex: 'shutter' });
    S.quad([[x0 + .4, 3.05, -.02], [x1 - .4, 3.05, -.02], [x1 - .4, 3.45, -.02], [x0 + .4, 3.45, -.02]], [44, 42, 44], { text: name, textCol: [196, 190, 176] });
  }
  // the store: floor (pale wood), side walls, the back wall with the name again, a dark ceiling
  for (let i = 0; i < 13; i++) for (let j = 0; j < 10; j++) {
    const x = -GX + i * .4, z = j * .6;
    S.quad([[x, .001, z], [x + .4, .001, z], [x + .4, .001, z + .6], [x, .001, z + .6]], [156, 128, 98].map(v => v * (.92 + R() * .12)), { floor: true });
  }
  for (const s of [-1, 1]) for (let z = 0; z < 6; z += 1) S.quad(s < 0 ? [[-GX, 0, z + 1], [-GX, 0, z], [-GX, 3.0, z], [-GX, 3.0, z + 1]] : [[GX, 0, z], [GX, 0, z + 1], [GX, 3.0, z + 1], [GX, 3.0, z]], [196, 188, 176]);
  S.quad([[-GX, 0, 6], [GX, 0, 6], [GX, 3.0, 6], [-GX, 3.0, 6]], [176, 156, 150]);
  S.quad([[-1.2, 2.1, 5.99], [1.2, 2.1, 5.99], [1.2, 2.5, 5.99], [-1.2, 2.5, 5.99]], [176, 156, 150], { text: 'HALE & ROSE', textCol: [90, 60, 56] });
  for (let z = 0; z < 6; z += 1) S.quad([[-GX, 3.0, z + 1], [GX, 3.0, z + 1], [GX, 3.0, z], [-GX, 3.0, z]], [70, 68, 66]);
  // the riser: white laminate, top split into tiles (so it sorts under the stands), the front edge
  for (let i = 0; i < 14; i++) for (let j = 0; j < 5; j++) {
    const x = -2.1 + i * .3, z = RISER[0] + j * .29;
    S.quad([[x, RISER[2], z], [x + .3, RISER[2], z], [x + .3, RISER[2], z + .29], [x, RISER[2], z + .29]], [222, 220, 214], { floor: true });
  }
  S.quad([[-2.1, 0, RISER[0]], [2.1, 0, RISER[0]], [2.1, RISER[2], RISER[0]], [-2.1, RISER[2], RISER[0]]], [190, 188, 182]);
  // two racks of clothes, the counter, a display table with folded sweaters
  for (const [z, cols] of [[3.4, [[120, 40, 50], [60, 70, 110], [200, 190, 170], [40, 40, 44], [150, 120, 90]]], [4.5, [[90, 100, 80], [180, 60, 60], [220, 210, 200], [70, 60, 90]]]]) {
    S.box(-1.9, 1.5, z - .02, 1.9, 1.53, z + .02, [150, 150, 150]);
    for (const x of [-1.85, 1.85]) S.box(x - .02, 0, z - .02, x + .02, 1.5, z + .02, [150, 150, 150]);
    for (let i = 0; i < 24; i++) { const x = -1.75 + i * .145, c = cols[i % cols.length]; S.box(x, .55 + R() * .15, z - .22, x + .11, 1.45, z + .22, c.map(v => v * (.85 + R() * .2))); }
  }
  S.box(1.2, 0, 5.2, 2.5, 1.0, 5.8, [92, 70, 60]); S.box(1.2, 1.0, 5.2, 2.5, 1.04, 5.8, [200, 196, 190]);
  S.box(-2.4, 0, 2.6, -1.6, .75, 3.0, [186, 176, 160]);
  for (let i = 0; i < 3; i++) S.box(-2.3 + i * .22, .75, 2.65, -2.12 + i * .22, .87, 2.95, [[170, 50, 60], [70, 90, 130], [230, 220, 200]][i]);
  // the display spots on their track
  S.box(-2.0, 2.95, 1.22, 2.0, 2.99, 1.28, [40, 40, 40]);
  for (const p of SPOTS) S.box(p[0] - .05, 2.84, p[2] - .05, p[0] + .05, 2.95, p[2] + .05, [30, 30, 32]);
  S.q.forEach(prep);
  return S;
}
const STORE = buildStore();
// the sale banner hanging over the riser, and the sale card standing on the riser's front edge (its number changes for six frames)
function banner(S, t) {
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur, z = .45, n0 = S.q.length;
  S.quad([[-1.05, 2.25, z], [1.05, 2.25, z], [1.05, 2.62, z], [-1.05, 2.62, z]], [176, 32, 36], { text: 'HOLIDAY SALE', textCol: [244, 238, 228] });
  for (const x of [-.95, .95]) S.box(x - .005, 2.62, z - .005, x + .005, 3.0, z + .005, [180, 180, 180]);
  const zc = RISER[0] + .12;
  S.quad([[-.26, RISER[2] + .02, zc], [.26, RISER[2] + .02, zc], [.26, RISER[2] + .42, zc], [-.26, RISER[2] + .42, zc]], [236, 232, 222]);
  S.quad([[-.23, RISER[2] + .17, zc - .002], [.23, RISER[2] + .17, zc - .002], [.23, RISER[2] + .27, zc - .002], [-.23, RISER[2] + .27, zc - .002]], [236, 232, 222], { text: egg ? '10% OFF' : '50% OFF', textCol: [190, 30, 34] });
  S.quad([[-.2, RISER[2] + .3, zc - .002], [.2, RISER[2] + .3, zc - .002], [.2, RISER[2] + .37, zc - .002], [-.2, RISER[2] + .37, zc - .002]], [236, 232, 222], { text: 'TODAY', textCol: [40, 36, 36] });
  S.box(-.02, RISER[2], zc + .01, .02, RISER[2] + .4, zc + .14, [60, 60, 60]);
  for (let i = n0; i < S.q.length; i++) prep(S.q[i]);
}
// Lt: { amb, night (corridor lights), spots (display lights 0..1) }
function storeLight(Lt) {
  return q => {
    const c = q.c, n = q.n, inside = c[2] > .02;
    let w = Lt.amb * (inside ? .6 : 1);
    for (const p of NIGHT) w += pointLight(c, n, p, Lt.night * (inside ? .55 : 1), 3.2) * (inside ? clamp(1 - c[2] / 4) : 1);
    if (inside) w += pointLight(c, n, [0, 2.8, 2.2], Lt.inside ?? .45, 2.4, true);
    let s = 0; if (Lt.spots > 0) for (const p of SPOTS) s += pointLight(c, n, p, Lt.spots * .55, 1.6, true) * (inside || c[2] > -1.2 ? 1 : .3);
    if (q.text && c[1] > 3) w += .25;                                                          // the fascia signs catch a little light
    return [w + s * 1.05, w + s * .98, w * 1.04 + s * .86];
  };
}
function figLight(p, Lt) {
  let w = Lt.amb * (p[2] > 0 ? .6 : 1);
  for (const q of NIGHT) w += pointLight(p, [0, 0, -1], q, Lt.night * (p[2] > 0 ? .55 : 1), 3.2) * (p[2] > 0 ? clamp(1 - p[2] / 4) : 1);
  if (p[2] > 0) w += pointLight(p, [0, 0, -1], [0, 2.8, 2.2], Lt.inside ?? .45, 2.4, true);
  let s = 0; if (Lt.spots > 0) for (const q of SPOTS) s += pointLight(p, [0, 1, 0], q, Lt.spots * .55, 1.6, true);
  return clamp(w + s, .04, 1.25);
}

// ================================================================ THE MANNEQUINS (3D)
// mannequin-local: feet at the origin, facing +z, its left toward +x. Every part is a body swept along a curved spine
// (elliptical sections), drawn as one smooth outline (the union of the hulls of neighbouring sections), shaded top-lit; the
// seams at the neck and the wrists; the egg head with its plastic gloss. Joints: head, shoulders, elbows
const MJ = { head: [0, 1.5, 0], shL: [.175, 1.41, -.01], shR: [-.175, 1.41, -.01], elL: [.21, 1.14, -.02], elR: [-.21, 1.14, -.02] };
const MP = {
  torso: { sp: [[0, .84, 0], [0, .95, -.005], [0, 1.08, 0], [0, 1.2, .012], [0, 1.3, .012], [0, 1.39, -.008]], rw: [.13, .17, .123, .133, .148, .148], rh: [.088, .108, .082, .098, .108, .082], n: 10, cl: 'top' },
  shoulders: { sp: [[-.17, 1.4, -.01], [0, 1.42, -.01], [.17, 1.4, -.01]], rw: [.05, .044, .05], rh: [.058, .07, .058], n: 5, cl: 'top', ref: [0, 0, 1] },
  neck: { sp: [[0, 1.39, -.006], [0, 1.465, 0], [0, 1.535, .006]], rw: [.052, .043, .04], rh: [.05, .043, .041], n: 5, cl: 'neck', seam: .55 },
  head: { sp: [[0, 1.525, .022], [0, 1.57, .032], [0, 1.635, .028], [0, 1.705, .012], [0, 1.755, 0], [0, 1.783, -.006]], rw: [.032, .058, .074, .077, .06, .02], rh: [.04, .074, .094, .094, .07, .022], n: 11, cl: 'skin', ch: ['head'] },
  ballL: { sp: [[.172, 1.445, -.01], [.176, 1.405, -.01], [.18, 1.36, -.012]], rw: [.03, .052, .042], rh: [.03, .05, .042], n: 4, cl: 'sleeve', ch: ['shL'] },
  ballR: { sp: [[-.172, 1.445, -.01], [-.176, 1.405, -.01], [-.18, 1.36, -.012]], rw: [.03, .052, .042], rh: [.03, .05, .042], n: 4, cl: 'sleeve', ch: ['shR'] },
  upperL: { sp: [[.178, 1.4, -.01], [.198, 1.27, -.016], [.21, 1.14, -.02]], rw: [.047, .041, .035], rh: [.049, .043, .036], n: 5, cl: 'sleeve', ch: ['shL'] },
  upperR: { sp: [[-.178, 1.4, -.01], [-.198, 1.27, -.016], [-.21, 1.14, -.02]], rw: [.047, .041, .035], rh: [.049, .043, .036], n: 5, cl: 'sleeve', ch: ['shR'] },
  foreL: { sp: [[.21, 1.14, -.02], [.215, 1.01, 0], [.22, .895, .014]], rw: [.035, .03, .023], rh: [.034, .028, .021], n: 5, cl: 'fore', ch: ['elL', 'shL'], seam: 1 },
  foreR: { sp: [[-.21, 1.14, -.02], [-.215, 1.01, 0], [-.22, .895, .014]], rw: [.035, .03, .023], rh: [.034, .028, .021], n: 5, cl: 'fore', ch: ['elR', 'shR'], seam: 1 },
  handL: { sp: [[.22, .892, .016], [.224, .838, .024], [.227, .775, .03], [.225, .72, .03]], rw: [.023, .033, .031, .016], rh: [.012, .014, .012, .006], n: 6, cl: 'skin', ch: ['elL', 'shL'], hand: true },
  handR: { sp: [[-.22, .892, .016], [-.224, .838, .024], [-.227, .775, .03], [-.225, .72, .03]], rw: [.023, .033, .031, .016], rh: [.012, .014, .012, .006], n: 6, cl: 'skin', ch: ['elR', 'shR'], hand: true },
  thighL: { sp: [[.085, .86, 0], [.085, .68, .01], [.08, .5, .012]], rw: [.074, .062, .045], rh: [.08, .065, .048], n: 5, cl: 'leg' },
  thighR: { sp: [[-.085, .86, 0], [-.085, .68, .01], [-.08, .5, .012]], rw: [.074, .062, .045], rh: [.08, .065, .048], n: 5, cl: 'leg' },
  shinL: { sp: [[.08, .5, .012], [.075, .3, -.004], [.07, .1, -.012]], rw: [.045, .04, .025], rh: [.048, .045, .03], n: 5, cl: 'shin' },
  shinR: { sp: [[-.08, .5, .012], [-.075, .3, -.004], [-.07, .1, -.012]], rw: [.045, .04, .025], rh: [.048, .045, .03], n: 5, cl: 'shin' },
  footL: { sp: [[.07, .11, -.03], [.07, .055, .04], [.07, .018, .12]], rw: [.026, .032, .024], rh: [.03, .024, .012], n: 4, cl: 'shoe' },
  footR: { sp: [[-.07, .11, -.03], [-.07, .055, .04], [-.07, .018, .12]], rw: [.026, .032, .024], rh: [.03, .024, .012], n: 4, cl: 'shoe' },
  skirt: { sp: [[0, 1.1, 0], [0, .93, -.004], [0, .72, 0], [0, .53, .004]], rw: [.13, .182, .2, .206], rh: [.088, .118, .134, .142], n: 6, cl: 'skirt', bias: -.05, only: 'skirt' },
  coat: { sp: [[0, 1.08, 0], [0, .86, -.006], [0, .6, 0], [0, .4, .004]], rw: [.15, .2, .225, .24], rh: [.105, .135, .15, .162], n: 6, cl: 'coat', bias: -.06, only: 'coat' },
};
const OUTFITS = [
  { name: 'blazer', skin: [234, 228, 216], top: [214, 204, 180], sleeve: [214, 204, 180], fore: [214, 204, 180], neck: 'skin', leg: 'skin', shin: 'skin', shoe: [30, 28, 28], skirt: [34, 32, 36] },
  { name: 'turtle', skin: [234, 228, 216], top: [58, 60, 66], sleeve: [58, 60, 66], fore: [58, 60, 66], neck: [58, 60, 66], leg: [120, 118, 112], shin: [120, 118, 112], shoe: [44, 34, 28] },
  { name: 'red', skin: [236, 230, 218], top: [176, 26, 34], sleeve: 'skin', fore: 'skin', neck: 'skin', leg: 'skin', shin: 'skin', shoe: [120, 16, 22], skirt: [176, 26, 34] },
  { name: 'coat', skin: [234, 228, 216], top: [176, 138, 92], sleeve: [176, 138, 92], fore: [176, 138, 92], neck: [220, 212, 198], leg: [60, 56, 54], shin: 'skin', shoe: [50, 40, 34], coat: [176, 138, 92] },
];
const lerpArr = (R, u) => { const x = u * (R.length - 1), k = Math.min(R.length - 2, Math.floor(x)), f = x - k; return R[k] + (R[k + 1] - R[k]) * f; };
function crSample(P, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) * (P.length - 1), k = Math.min(P.length - 2, Math.floor(u)), f = u - k;
    const p0 = P[Math.max(0, k - 1)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(P.length - 1, k + 2)];
    out.push([0, 1, 2].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * f + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * f * f + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * f * f * f)));
  }
  return out;
}
const MPARTS = Object.entries(MP).map(([name, d]) => {
  const C = crSample(d.sp, d.n), secs = [], ref0 = d.ref || [0, 0, 1];
  for (let i = 0; i < C.length; i++) {
    const T = nrm3(sub3(C[Math.min(C.length - 1, i + 1)], C[Math.max(0, i - 1)])), ref = Math.abs(dot3(T, ref0)) > .9 ? [0, 1, 0] : ref0;
    const S = nrm3(cross3(ref, T)), U = cross3(T, S), u = i / (C.length - 1);
    secs.push({ c: C[i], S, U, rw: lerpArr(d.rw, u), rh: lerpArr(d.rh, u), u });
  }
  return Object.assign({ name, secs, ch: d.ch || [] }, d);
});
function hull(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const rotX = (p, a) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const rotZ = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
const rot3 = (v, r) => rotY(rotX(rotZ(v, r[2] || 0), r[0] || 0), r[1] || 0);
// a pose: { p: world feet, yaw, lean (forward, rad), joints: { head: [rx, ry, rz], shL, elL, ... } }
function toWorldFn(Q) {
  return (v, ch) => {
    for (const j of ch) { const r = Q.joints[j]; if (r) v = add3(MJ[j], rot3(sub3(v, MJ[j]), r)); }
    if (Q.lean) v = rotX(v, Q.lean);
    return add3(Q.p, rotY(v, Q.yaw));
  };
}
// the display poses on the riser (one per outfit), and the one at the grille
const POSES = [
  { joints: { head: [0, .12, -.05], shR: [.05, 0, -.38], elR: [-.25, 0, 1.75], shL: [0, 0, .06] } },             // a hand on the hip
  { joints: { head: [.06, -.2, 0], shL: [-.12, 0, .05], shR: [-.08, 0, -.05], elL: [-.3, 0, 0] } },
  { joints: { head: [0, 0, .2], shL: [0, 0, .12], shR: [0, 0, -.12], elL: [-.08, 0, 0], elR: [-.08, 0, 0] } },  // the red dress
  { joints: { head: [0, .15, 0], shL: [.05, 0, .03], shR: [.05, 0, -.03] } },
];
function drawMannequin(g, cam, Q, outfit, light, o = {}) {
  const toW = toWorldFn(Q), camPos = [cam.x, cam.y, cam.z], k = light;
  const P = p => { const q = cam.toCam(p); return q[2] > .06 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; };
  const colOf = cl => { let c = outfit[cl] || outfit.skin; if (c === 'skin') c = outfit.skin; return c; };
  const parts = [];
  for (const part of MPARTS) {
    if (part.only && !outfit[part.only]) continue;
    if (o.handsOnly && !part.hand) continue;
    const rings = []; let bad = false, dsum = 0;
    for (const s of part.secs) {
      const ring = [];
      for (let j = 0; j < 18; j++) {
        const a = j / 18 * TAU, v = add3(s.c, add3(mul3(s.S, s.rw * Math.cos(a)), mul3(s.U, s.rh * Math.sin(a))));
        const pp = P(toW(v, part.ch)); if (!pp) { bad = true; break; }
        ring.push(pp);
      }
      if (bad) break;
      rings.push(ring); dsum += len3(sub3(toW(s.c, part.ch), camPos));
    }
    if (bad) continue;
    const path = new Path2D();
    for (let i = 0; i + 1 < rings.length; i++) { const hl = hull(rings[i].concat(rings[i + 1])); hl.forEach(([x, y], j) => j ? path.lineTo(x, y) : path.moveTo(x, y)); path.closePath(); }
    if (rings.length === 1) { const hl = hull(rings[0]); hl.forEach(([x, y], j) => j ? path.lineTo(x, y) : path.moveTo(x, y)); path.closePath(); }
    parts.push({ part, path, rings, d: dsum / rings.length + (part.bias || 0) });
  }
  parts.sort((a, b) => b.d - a.d);
  for (const pt of parts) {
    const { part, path } = pt, col = colOf(part.cl), mid = part.secs[part.secs.length >> 1];
    const cw = P(toW(mid.c, part.ch)), up = P(toW(add3(mid.c, [0, Math.max(mid.rw, mid.rh) * 1.6, 0]), part.ch));
    let fill = rgb(col, k);
    const glossy = col === outfit.skin, mr = pt.rings[pt.rings.length >> 1];
    if (cw && up && mr) {
      // round: across the part (perpendicular to its spine on screen) dark at both edges, brightest a little toward the light
      // (up and to the left); the egg head gets a radial version
      let ax = up[0] - cw[0], ay = up[1] - cw[1]; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
      let nx = -ay, ny = ax; if (nx * -.5 + ny * -.85 < 0) { nx = -nx; ny = -ny; }
      let wpx = 0; for (const q of mr) wpx = Math.max(wpx, Math.abs((q[0] - cw[0]) * nx + (q[1] - cw[1]) * ny));
      wpx = Math.max(2, wpx * 1.05);
      if (part.name === 'head') {
        const hx = cw[0] + nx * wpx * .35 + ax * wpx * .3, hy = cw[1] + ny * wpx * .35 + ay * wpx * .3, gr = g.createRadialGradient(hx, hy, wpx * .1, cw[0], cw[1], wpx * 1.35);
        gr.addColorStop(0, rgb(col, k * 1.18)); gr.addColorStop(.55, rgb(col, k * .95)); gr.addColorStop(1, rgb(col, k * .48)); fill = gr;
      } else {
        const gr = g.createLinearGradient(cw[0] + nx * wpx, cw[1] + ny * wpx, cw[0] - nx * wpx, cw[1] - ny * wpx);
        gr.addColorStop(0, rgb(col, k * .62)); gr.addColorStop(.28, rgb(col, k * (glossy ? 1.16 : 1.06))); gr.addColorStop(.6, rgb(col, k * .86)); gr.addColorStop(1, rgb(col, k * .46));
        fill = gr;
      }
    }
    const pxm = cw ? cam.f / cw[2] : 100;
    g.save(); g.strokeStyle = `rgba(20,18,18,${.45 * Math.min(1, k + .3)})`; g.lineWidth = Math.max(.7, pxm * .006); g.lineJoin = 'round'; g.stroke(path);
    g.fillStyle = fill; g.fill(path);
    // the seam rings at the neck and the wrists (the half that faces the camera)
    if (part.seam != null) {
      const i = Math.round(part.seam * (part.secs.length - 1)), s = part.secs[i], ring = pt.rings[i];
      if (ring) {
        g.strokeStyle = `rgba(40,34,30,${.75})`; g.lineWidth = Math.max(.8, pxm * .004); g.beginPath(); let pen = false;
        for (let j = 0; j <= 18; j++) {
          const a = (j % 18) / 18 * TAU, nl = add3(mul3(s.S, Math.cos(a)), mul3(s.U, Math.sin(a))), pw = toW(add3(s.c, mul3(nl, s.rw)), part.ch);
          const nw = sub3(toW(add3(s.c, mul3(nl, s.rw + .05)), part.ch), pw), face = dot3(nw, sub3(camPos, pw)) > 0, q = ring[j % 18];
          if (face) { pen ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); pen = true; } else pen = false;
        }
        g.stroke();
      }
    }
    // the egg head: its gloss, the faint hollows where a face would be, the crack across the red one's
    if (part.name === 'head') {
      g.clip(path);
      const s = part.secs[5], fw = toW(add3(s.c, mul3(s.U, s.rh)), part.ch), facing = dot3(nrm3(sub3(fw, toW(s.c, part.ch))), nrm3(sub3(camPos, fw)));
      const top = P(toW([-.03, 1.71, .05], part.ch));
      if (top) { const r = pxm * .05; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(top[0], top[1], 0, top[0], top[1], r); gr.addColorStop(0, `rgba(255,252,240,${.45 * k})`); gr.addColorStop(1, 'rgba(255,252,240,0)'); g.fillStyle = gr; g.fillRect(top[0] - r, top[1] - r, 2 * r, 2 * r); g.restore(); }
      if (facing > .15) {
        const a = clamp((facing - .15) / .35);
        if (outfit.name === 'red') {
          const C = [[-.06, 1.74, .07], [-.035, 1.705, .092], [-.01, 1.69, .099], [.008, 1.655, .105], [.03, 1.63, .1], [.04, 1.6, .094], [.065, 1.575, .07]].map(p => P(toW(p, part.ch)));
          if (C.every(Boolean)) { g.strokeStyle = `rgba(40,30,26,${.8 * a})`; g.lineWidth = Math.max(.8, pxm * .0035); g.beginPath(); C.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); }
          const ch = P(toW([.045, 1.61, .1], part.ch)); if (ch) ell(g, ch[0], ch[1], pxm * .012, pxm * .008, `rgba(150,140,128,${.8 * a})`, .4);
        }
      }
    }
    g.restore();
  }
}
// its stand: a round glass base on the riser, the steel rod up into its calf (left standing, empty, when it is elsewhere)
function drawStand(g, cam, x, z, k, empty) {
  const y = RISER[2] + .004, c = project(cam, [x, y, z]); if (!c) return;
  const ex = project(cam, [x + .2, y, z]), ez = project(cam, [x, y, z + .2]); if (!ex || !ez) return;
  g.save(); g.beginPath();
  g.setTransform(ex[0] - c[0], ex[1] - c[1], ez[0] - c[0], ez[1] - c[1], c[0], c[1]); g.arc(0, 0, 1, 0, TAU); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = `rgba(${200 * k | 0},${214 * k | 0},${214 * k | 0},.5)`; g.fill(); g.strokeStyle = `rgba(${230 * k | 0},${240 * k | 0},${240 * k | 0},.7)`; g.lineWidth = 1.2; g.stroke();
  g.restore();
  const top = project(cam, [x + .072, y + (empty ? .42 : .3), z - .015]), bot = project(cam, [x + .072, y, z - .015]);
  if (top && bot) { g.strokeStyle = rgb([150, 154, 160], k * 1.1); g.lineWidth = Math.max(1, cam.f * .012 / bot[2]); g.lineCap = 'round'; g.beginPath(); g.moveTo(bot[0], bot[1]); g.lineTo(top[0], top[1]); g.stroke(); }
}

// where everything is: the red dress (index 2) on its stand, at the grille, or (frame 1) at the grille
function onStand(i) { const s = STANDS[i]; return { p: [s[0], RISER[2], s[1]], yaw: PI + (i - 1.5) * .08, lean: 0, joints: POSES[i].joints }; }
const AT_GRILLE = (x, tiltZ = .42, handUp = 1) => ({ p: [x, 0, .34], yaw: PI, lean: .09, joints: {
  head: [.18, 0, tiltZ], shL: [-1.0 * handUp, 0, .38], shR: [-1.0 * handUp, 0, -.38], elL: [-2.0 * handUp, 0, -.25], elR: [-2.0 * handUp, 0, .25] } });
// cctv1: frame 1 it is at the grille; one frame its head snaps over; then a time-lapse jump: back on its stand
// cctv2: at the grille, face to his face; its hand comes up to the bar by his; its head tilts toward him
// cam1, cam2: always on its stand; from STING (cam2) at the grille in front of his lens; cctv3: at the grille, its head follows him
function redAt(t, shot) {
  const L = LEON_X;
  if (shot === 'cctv1') { if (t >= TL.LAPSE) return onStand(2); return AT_GRILLE(.25, t >= TL.SNAP1 ? -.48 : .42); }
  if (shot === 'cctv2') {
    const Q = AT_GRILLE(L - .42, t >= TL.TILT ? -.62 : -.18, 1);
    if (t < TL.HAND) { Q.joints.shL = [-.05, 0, .08]; Q.joints.elL = [-.1, 0, 0]; }                // its left hand still down, then on the bar
    Q.joints.shR = [-.05, 0, -.08]; Q.joints.elR = [-.1, 0, 0];
    return Q;
  }
  if (shot === 'cam2' && t >= TL.STING) return AT_GRILLE(LEON_X - .06, .5, 1);
  if (shot === 'cctv3') {
    const Q = AT_GRILLE(LEON_X - .06, .5, 1), k = ease(kOf(M.stutter(t, FPS_CCTV, 3), TL.BACKOUT));
    Q.joints.head = [.18 - .1 * k, -.5 * k, .5 - .2 * k];
    return Q;
  }
  return onStand(2);
}
function mannequins(t, shot) {
  const list = [0, 1, 3].map(i => ({ i, Q: onStand(i) }));
  list.push({ i: 2, Q: redAt(t, shot) });
  return list;
}

// ---------------------------------------------------------------- the grille: a roll-down link grille (vertical rods every
// 9 cm, flat links every 25 cm), drawn over the store; the hands that grip it drawn over it again
function drawGrille(g, cam, k, o = {}) {
  const th = o.far ? .55 : 1;
  const y0 = 0, y1 = GH, z = 0;
  const P = p => project(cam, p);
  g.save(); g.lineCap = 'butt';
  for (let x = -GX; x <= GX + 1e-6; x += .09) {
    const a = P([x, y0, z]), b = P([x, y1, z]); if (!a || !b) continue;
    const w = Math.max(.7, cam.f * .009 * th / ((a[2] + b[2]) / 2));
    g.strokeStyle = rgb([150, 150, 154], k * th); g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.strokeStyle = rgb([210, 210, 214], k * th); g.lineWidth = w * .35; g.beginPath(); g.moveTo(a[0] - w * .2, a[1]); g.lineTo(b[0] - w * .2, b[1]); g.stroke();
  }
  for (let y = .12; y < y1; y += .25) {
    const a = P([-GX, y, z - .006]), b = P([GX, y, z - .006]); if (!a || !b) continue;
    const w = Math.max(1, cam.f * .022 * th / ((a[2] + b[2]) / 2));
    g.strokeStyle = rgb([126, 126, 130], k * th); g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  const a = P([-GX, .03, -.03]), b = P([GX, .03, -.03]);                                       // the bottom bar and its lock
  if (a && b) { g.strokeStyle = rgb([90, 90, 94], k); g.lineWidth = Math.max(2, cam.f * .05 / a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.restore();
}

// ---------------------------------------------------------------- Leon on CAM 31 (from behind, the camcorder at his eye, the
// flashlight in his right hand)
const SHIRT = [140, 156, 182], TROUS = [34, 38, 52], CAP = [28, 32, 50], SKIN = [182, 140, 112];
const LEON_X = .3;
function leonBack(g, cam, x, z, k, o = {}) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 1.8, z]); if (!feet || !head) return null;
  const u = (feet[1] - head[1]) / 1.8, C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`, st = o.step || 0;
  g.save(); g.translate(feet[0], feet[1]); g.scale(u, u);
  ell(g, 0, 0, .3, .06, 'rgba(0,0,0,.3)');
  poly(g, [[-.19, -.94], [-.02, -.94], [-.04 - st * .03, -.02], [-.17 - st * .03, -.02]], C(TROUS)); poly(g, [[.02, -.94], [.19, -.94], [.17 + st * .03, -.02], [.04 + st * .03, -.02]], C(TROUS, .9));
  poly(g, [[-.22, -.97], [.22, -.97], [.22, -.9], [-.22, -.9]], 'rgb(18,18,20)');
  poly(g, [[-.25, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT));
  poly(g, [[-.25, -1.47], [-.02, -1.47], [-.02, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT, .9));
  g.strokeStyle = C(SHIRT, .7); g.lineWidth = .008; g.beginPath(); g.moveTo(0, -1.45); g.lineTo(0, -.97); g.moveTo(-.2, -1.38); g.quadraticCurveTo(0, -1.33, .2, -1.38); g.stroke();
  poly(g, [[-.22, -1.45], [-.29, -1.48], [-.46, -1.38], [-.43, -1.31], [-.29, -1.38]], C(SHIRT, .92));
  poly(g, [[-.46, -1.38], [-.42, -1.31], [-.19, -1.6], [-.15, -1.66], [-.2, -1.69]], C(SHIRT, .86));
  g.fillStyle = C([22, 22, 24]); g.fillRect(-.26, -1.76, .2, .13); g.fillStyle = C([40, 40, 44]); g.fillRect(-.08, -1.73, .06, .07);
  ell(g, -.2, -1.66, .035, .03, C(SKIN, .85));
  g.lineCap = 'round'; g.strokeStyle = C(SHIRT, .88); g.lineWidth = .1; g.beginPath(); g.moveTo(.21, -1.42); g.lineTo(.36, -1.24); g.stroke();
  g.lineWidth = .075; g.beginPath(); g.moveTo(.36, -1.24); g.lineTo(.35, -1.12); g.stroke();
  ell(g, .35, -1.11, .04, .036, C(SKIN, .8)); ell(g, .355, -1.115, .028, .028, C([30, 30, 34]));
  poly(g, [[-.05, -1.58], [.05, -1.58], [.058, -1.47], [-.058, -1.47]], C(SKIN, .7));
  ell(g, -.1, -1.655, .02, .034, C(SKIN, .85)); ell(g, .1, -1.655, .02, .034, C(SKIN, .85));
  ell(g, 0, -1.665, .1, .1, C([24, 20, 18]));
  g.beginPath(); g.moveTo(-.118, -1.69); g.bezierCurveTo(-.122, -1.86, .122, -1.86, .118, -1.69); g.closePath(); g.fillStyle = C(CAP); g.fill();
  g.fillStyle = C([70, 72, 80]); g.fillRect(-.055, -1.695, .11, .012);
  g.restore();
  if (u > 60) { g.save(); g.font = `${Math.round(.068 * u)}px "Special Elite"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C([30, 34, 52]); g.fillText('SECURITY', feet[0], feet[1] - 1.33 * u); g.restore(); }
  return { feet, u };
}
function leonZ(t) { return lerp(-.42, -1.35, ease(kOf(t, TL.BACKOUT))); }

// ---------------------------------------------------------------- flashlights: the scene's albedo times a beam map, added on top
function pool(g, cam, c, ax, ay, a, rgbS = '255,232,190') {
  const p0 = project(cam, c), pu = project(cam, add3(c, ax)), pv = project(cam, add3(c, ay));
  if (!p0 || !pu || !pv || a <= 0) return;
  g.save(); g.setTransform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgbS},${a})`); gr.addColorStop(.45, `rgba(${rgbS},${a * .5})`); gr.addColorStop(1, `rgba(${rgbS},0)`);
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}
function torchMap(g, cam, T) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  for (const w of T.world || []) pool(g, cam, w.c, w.ax, w.ay, w.a);
  if (T.hand) {
    const { x, y, r, a } = T.hand, gr = g.createRadialGradient(x, y, 4, x, y, r);
    gr.addColorStop(0, `rgba(255,236,200,${a})`); gr.addColorStop(.5, `rgba(255,232,196,${a * .55})`); gr.addColorStop(1, 'rgba(255,232,196,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (T.spill) { const sp = g.createRadialGradient(x, y, 10, x, y, 760); sp.addColorStop(0, `rgba(255,232,196,${T.spill})`); sp.addColorStop(1, 'rgba(255,232,196,0)'); g.fillStyle = sp; g.fillRect(0, 0, W, H); }
  }
  g.globalCompositeOperation = 'source-over';
}
// the store through any camera: lit, plus the flashlight pass; the figures (sorted by distance) after the scene, then the
// grille over them, then the gripping hands over the grille
function storeView(g, t, shot, camSpec, Lt, T, o = {}) {
  const S = new TK.Scene(); S.q = STORE.q.slice(); banner(S, t);
  const ms = mannequins(t, shot);
  const after = (gg, cam) => {
    const camPos = [cam.x, cam.y, cam.z], kf = p => PASS === 'lit' ? figLight(p, Lt) : 1;
    for (let i = 0; i < 4; i++) { const m = ms.find(m => m.i === i), empty = len3(sub3(m.Q.p, [STANDS[i][0], RISER[2], STANDS[i][1]])) > .2; drawStand(gg, cam, STANDS[i][0], STANDS[i][1], PASS === 'lit' ? clamp(figLight([STANDS[i][0], .5, STANDS[i][1]], Lt) + .1) : 1, empty); }
    const figs = ms.map(m => ({ d: len3(sub3(add3(m.Q.p, [0, 1, 0]), camPos)), draw: () => drawMannequin(gg, cam, m.Q, OUTFITS[m.i], kf(add3(m.Q.p, [0, 1.3, 0]))) }));
    figs.sort((a, b) => b.d - a.d).forEach(f => f.draw());
    if (!o.noGrille) drawGrille(gg, cam, PASS === 'lit' ? clamp(figLight([0, 1.4, -.1], Lt) * 1.15 + .05) : 1, { far: true });
    const red = ms.find(m => m.i === 2);
    if (red.Q.p[2] < .5 && !o.noGrille) drawMannequin(gg, cam, red.Q, OUTFITS[2], kf(add3(red.Q.p, [0, 1.3, 0])), { handsOnly: true });
    // Leon is always on the corridor side of the grille
    if (o.leon) { const z = leonZ(t), x = LEON_X - 3.2 * ease(kOf(t, TL.BACKOUT)); leonBack(gg, cam, x, z, PASS === 'lit' ? clamp(figLight([x, 1.3, z], Lt) + .1) : 1, { step: o.leonStep || 0 }); }
  };
  PASS = 'lit';
  const cam = TK.render(g, lit(S, storeLight(Lt)), camSpec, { ambient: 1, fog: .012, bg: [4, 4, 5], grid: false });
  after(g, cam);
  if (T && (T.hand || (T.world && T.world.length))) {
    PASS = 'albedo';
    TK.render(ALG, S, camSpec, { ambient: 1, fog: .012, bg: [0, 0, 0], grid: false });
    after(ALG, cam);
    torchMap(LG, cam, T);
    ALG.save(); ALG.globalCompositeOperation = 'multiply'; ALG.drawImage(LMAP, 0, 0); ALG.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(ALB, 0, 0); g.restore();
    PASS = 'lit';
  }
  // the lights themselves: the corridor's night lights; the display spots when they are on
  for (const p of NIGHT) { const q = project(cam, [p[0], 3.49, p[2]]); if (q) { const r = cam.f * .5 / q[2]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); gr.addColorStop(0, `rgba(240,244,236,${.8 * Lt.night})`); gr.addColorStop(1, 'rgba(240,244,236,0)'); g.fillStyle = gr; g.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r); g.restore(); } }
  if (Lt.spots > 0) for (const p of SPOTS) { const q = project(cam, [p[0], 2.83, p[2]]); if (q) { const r = cam.f * .16 / q[2]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); gr.addColorStop(0, `rgba(255,248,226,${Lt.spots})`); gr.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = gr; g.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r); g.restore(); } }
  return cam;
}

// ---------------------------------------------------------------- the camcorder
function handheld(t, t0, rate, walking, nerve) {
  const ph = (t - t0) * rate, step = walking ? Math.abs(Math.sin(ph * PI)) : 0;
  const n = k => Math.sin(t * 1.3 * k + k) * .6 + Math.sin(t * 2.9 * k + 2 * k) * .3 + Math.sin(t * 7.1 * k) * .1;
  const amp = .012 + .02 * nerve;
  return { y: step * .03 + n(1.1) * amp * .5, yaw: n(.9) * amp * .8 + (walking ? Math.sin(ph * PI * .5) * .015 : 0), pitch: n(1.7) * amp * .5, roll: n(.7) * amp * .6 + (walking ? Math.sin(ph * PI) * .008 : 0) };
}
function armTorch(g, hx, hy, ang, light) {
  const k = .45 + .55 * light, sl = `rgb(${72 * k | 0},${84 * k | 0},${108 * k | 0})`, sl2 = `rgb(${88 * k | 0},${100 * k | 0},${126 * k | 0})`;
  const sh = [1260, 1060], el = [lerp(sh[0], hx, .55) + 70, lerp(sh[1], hy, .55) + 40];
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = sl; g.lineWidth = 150; g.beginPath(); g.moveTo(sh[0], sh[1]); g.lineTo(el[0], el[1]); g.stroke();
  g.lineWidth = 104; g.beginPath(); g.moveTo(el[0], el[1]); g.lineTo(hx + 30, hy + 30); g.stroke();
  g.strokeStyle = sl2; g.lineWidth = 16; g.beginPath(); g.moveTo(el[0] - 30, el[1] - 40); g.lineTo(hx + 4, hy + 2); g.stroke();
  g.restore();
  const a = Math.atan2(hy - el[1], hx - el[0]);
  g.save(); g.translate(hx, hy); g.rotate(a);
  g.fillStyle = `rgb(${62 * k | 0},${72 * k | 0},${94 * k | 0})`; g.fillRect(-58, -50, 20, 100);
  ell(g, 0, 0, 52, 40, `rgb(${176 * k | 0},${136 * k | 0},${110 * k | 0})`);
  g.restore();
  g.save(); g.translate(hx, hy); g.rotate(ang);
  g.fillStyle = 'rgb(18,18,20)'; g.fillRect(-40, -17, 150, 34); g.fillStyle = 'rgb(54,54,58)'; g.fillRect(100, -22, 28, 44);
  g.fillStyle = `rgb(${190 * k | 0},${150 * k | 0},${122 * k | 0})`; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-6 + i * 22, 18, 13, 10, 0, 0, 6.2832); g.fill(); }
  g.restore();
}
// the beam: where it lands inside the store (the riser, a figure, the back of the store) or on the grille
function beamHit(o, d, figs) {
  let best = 1e9; const T = v => { if (v > 1e-4 && v < best) best = v; };
  if (d[1] < 0) T(-o[1] / d[1]);
  if (d[2] > 0) { const v = (RISER[0] - o[2]) / d[2], y = o[1] + d[1] * v; if (y < RISER[2]) T(v); else { const v2 = (RISER[2] - o[1]) / d[1]; const z2 = o[2] + d[2] * v2; if (d[1] < 0 && z2 > RISER[0] && z2 < RISER[1]) T(v2); } T((6 - o[2]) / d[2]); }
  for (const c of figs) { const v = dot3(sub3(c, o), d); if (v > 0) { const q = add3(o, mul3(d, v)); if (len3(sub3(q, c)) < .32) T(v - .15); } }
  return add3(o, mul3(d, best > 1e8 ? 6 : best));
}
function handBeam(cc, cs, yawOff, pitchOff, figs) {
  const yaw = cs.yaw + yawOff, pitch = cs.pitch + pitchOff, d = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const o = [cs.x + Math.cos(cs.yaw) * .22, cs.y - .38, cs.z - Math.sin(cs.yaw) * .22 + .2];
  const hit = beamHit(o, d, figs), p = project(cc, hit), dist = len3(sub3(hit, o));
  return { x: p ? p[0] : W / 2, y: p ? p[1] : H / 2, r: cc.f * .32, a: clamp(1.4 / (1 + Math.pow(dist / 3.4, 2)), .1, 1) };
}
const HEADS = STANDS.map(s => [s[0], RISER[2] + 1.64, s[1]]);
// S2: he counts them with the flashlight from 1.7 m back, steps up to the grille, zooms on the red dress
function poseCam1(t) {
  const walking = inR(t, [TL.STEP_IN[0], TL.STEP_IN[1] - .1]), h = handheld(t, TL.STEP_IN[0], 2, walking, .2 + .3 * kOf(t, [10, 13]));
  const z = lerp(-1.75, -.2, ease(kOf(t, TL.STEP_IN))), x = lerp(.05, LEON_X - .05, ease(kOf(t, TL.STEP_IN)));
  const tgtWide = [0, 1.15, 1.3], tgtRed = add3(HEADS[2], [0, -.05, 0]), zk = ease(kOf(t, TL.ZOOM));
  const tg = lerp3(tgtWide, tgtRed, zk), cs = lookAt([x, 1.55, z], tg, lerp(62, 22, zk));
  const s = .5 + .5 * cs.fov / 62;
  return { cam: { x, y: 1.55 - h.y, z, yaw: cs.yaw + h.yaw * s, pitch: cs.pitch + h.pitch * s, fov: cs.fov }, h };
}
// the flashlight counts them: from the left one to the right one, a beat on each
function countYaw(cs, t) {
  const k = kOf(t, TL.COUNT), i = Math.min(3, Math.floor(k * 4)), f = k * 4 - i;
  const aim = j => Math.atan2(STANDS[j][0] - cs.x, STANDS[j][1] - cs.z) - cs.yaw;
  if (t < TL.COUNT[0]) return lerp(aim(0) - .2, aim(0), ease(kOf(t, [4.6, TL.COUNT[0]])));
  if (t >= TL.COUNT[1]) return lerp(aim(3), aim(2), ease(kOf(t, [TL.COUNT[1], TL.COUNT[1] + .8])));
  return lerp(aim(i), aim(Math.min(3, i + 1)), ease(clamp((f - .55) / .45)));
}
function shotCam(g, fg, t, shot) {
  let cs, h, yawOff, pitchOff = -.1;
  if (shot === 'cam1') { ({ cam: cs, h } = poseCam1(t)); yawOff = countYaw(cs, t) + .02 * Math.sin(t * 2.3); if (t > TL.ZOOM[0]) yawOff = lerp(yawOff, Math.atan2(STANDS[2][0] - cs.x, STANDS[2][1] - cs.z) - cs.yaw, ease(kOf(t, TL.ZOOM))); pitchOff = lerp(-.1, -.05, kOf(t, TL.ZOOM)); }
  else ({ cam: cs, h, yawOff, pitchOff } = poseCam2(t));
  const cc = mkCam(cs), spots = shot === 'cam2' && t >= TL.STING ? 1 : 0;
  const figs = mannequins(t, shot).map(m => add3(m.Q.p, [0, 1.1, 0]));
  const T = { hand: handBeam(cc, cs, yawOff, pitchOff, figs), spill: .08 };
  const Lt = { amb: .07, night: .75, spots };
  storeView(g, t, shot, cs, Lt, T, { noGrille: true });
  // the grille right in front of him (out of focus, in the foreground layer)
  fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, W, H);
  drawGrille(fg, cc, clamp(figLight([0, 1.4, -.1], Lt) * 1.2 + .25 + (T.hand ? .1 : 0)));
  const red = mannequins(t, shot).find(m => m.i === 2);
  if (red.Q.p[2] < .5) drawMannequin(fg, cc, red.Q, OUTFITS[2], figLight(add3(red.Q.p, [0, 1.3, 0]), Lt), { handsOnly: true });
  if (!(shot === 'cam2' && t >= TL.STUMBLE[0])) {
    const hx = 915 + h.yaw * -120, hy = 712 + h.y * 380, vp = project(cc, add3([cs.x, cs.y, cs.z], [Math.sin(cs.yaw + yawOff) * 6, -.3, Math.cos(cs.yaw + yawOff) * 6])) || [540, 430];
    armTorch(fg, hx, hy, Math.atan2(vp[1] - hy, vp[0] - hx), .5 + .4 * spots);
  }
  let bgBlur = 6 * Math.exp(-(t - SH[shot][1]) / .2), fgBlur = lerp(3.5, 11, kOf(t, shot === 'cam1' ? TL.STEP_IN : [0, 1])), noise = .14;
  if (shot === 'cam1' && t > TL.ZOOM[0] && t < TL.ZOOM[1] + .4) bgBlur += 2.4 * Math.abs(Math.sin(kOf(t, [TL.ZOOM[0], TL.ZOOM[1] + .4]) * PI * 2));
  if (shot === 'cam2' && t >= TL.STING) { fgBlur = 3; bgBlur = 2.2; noise = .08; }                       // the autofocus jumps to it
  if (shot === 'cam2' && t >= TL.STUMBLE[0]) { bgBlur = 6; fgBlur = 6; }
  return { roll: h.roll + (shot === 'cam2' && t >= TL.STUMBLE[0] ? .35 * ease(kOf(t, TL.STUMBLE)) : 0), bgBlur, fgBlur, noise, bright: spots ? 1.0 : 1.12 };
}
// S4: at the grille, on the red dress on its stand; it trembles; the creaks; at STING it is in front of the lens
function poseCam2(t) {
  const nerve = t < TL.QUIET[0] ? .55 : t < TL.STING ? .2 : 1.2, h = handheld(t, 0, 0, false, nerve);
  const tg = add3(HEADS[2], [0, -.12, 0]), cs = lookAt([LEON_X - .05, 1.55, -.55], tg, 50);
  let yaw = cs.yaw, pitch = cs.pitch, z = -.55;
  if (t >= TL.STING) { const k = ease(kOf(t, [TL.STING, TL.STING + .12])); pitch += .12 * k; yaw -= .02 * k; }
  if (t >= TL.STUMBLE[0]) { const k = ease(kOf(t, TL.STUMBLE)); pitch -= .9 * k; yaw += .3 * k; z -= .5 * k; }
  if (t >= TL.STING && t < TL.STING + .08) { yaw += .03; pitch += .02; }
  return { cam: { x: LEON_X - .05, y: 1.55 - h.y, z, yaw: yaw + h.yaw, pitch: pitch + h.pitch, fov: 50 }, h, yawOff: .04, pitchOff: -.12 };
}

// ---------------------------------------------------------------- CAM 31 playback (6 fps), by the archive
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
const p2 = n => String(n).padStart(2, '0');
function stampAt(shot, tq) {
  const base = shot === 'cctv1' ? TL.STAMP1 : shot === 'cctv2' ? TL.STAMP2 : TL.STAMP3;
  let s = base[0] * 3600 + base[1] * 60 + base[2] + Math.floor(tq - SH[shot][1]);
  if (shot === 'cctv1' && tq >= TL.LAPSE) s += 27;                                           // the time-lapse recorder skipped
  return `${TL.DATE}  ${p2(Math.floor(s / 3600) % 24)}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`;
}
let GRILLE31 = null, FACE31 = null;
function shotCctv(shot, t) {
  const tq = qf(t), spots = shot === 'cctv3' && tq < TL.DARK ? 1 : 0;
  const Lt = { amb: .3, night: 1.35, spots, inside: 1.25 };                                  // 11/16: the opening reads on a phone
  const leon = shot !== 'cctv1', world = [];
  if (leon && shot === 'cctv2') { const o = [LEON_X + .25, 1.1, -.3], tg = [STANDS[2][0] - .2, .9, STANDS[2][1]]; world.push({ c: tg, ax: [.45, 0, 0], ay: [0, .6, 0], a: .7 }, { c: [o[0] + .1, RISER[2], RISER[0] + .3], ax: [.4, 0, 0], ay: [0, 0, .5], a: .4 }); }
  storeView(RG, tq, shot, CAM31, Lt, { world }, { leon, leonStep: shot === 'cctv3' ? Math.sin(tq * 9) : 0 });
  let Z = { z: 1, f: [W / 2, H / 2], k: 0 };
  if (shot === 'cctv1') Z = { z: 2.0, f: GRILLE31, k: .6 };
  else if (shot === 'cctv2') { const k = ease(kOf(t, TL.PUSH2)); Z = { z: lerp(1, 2.3, k), f: [lerp(W / 2, FACE31[0], k), lerp(H / 2, FACE31[1], k)], k: .6 * k }; }
  else { const k = ease(kOf(t, TL.PUSH3)); Z = { z: lerp(1, 2.0, k), f: [lerp(W / 2, GRILLE31[0], k), lerp(H / 2, GRILLE31[1], k)], k: .6 * k }; }
  zoomInto(WK, RAW, Z.z, Z.f, Z.k);
  TK.grade(WG, WORK, tq, 'cctv', { brightness: spots ? 1.2 : 1.45 });
  const gk = glitchAt(t); TK.vhs(WG, tq, gk ? 2.5 : 1, 5);
  if (shot === 'cctv1' && t >= TL.LAPSE && t < TL.LAPSE + .17) { tear(WG, t, .8); TK.statics(WG, t, .25); }   // the time-lapse jump
  if (gk) { tear(WG, t, Math.sin(gk[0] * PI)); TK.statics(WG, t, .4 * Math.sin(gk[0] * PI)); }
  const roll = shot === 'cctv2' ? TL.ROLL2 : shot === 'cctv3' ? TL.ROLL3 : null;
  if (roll && t < roll[1]) trackingRoll(WG, t, kOf(t, roll));
  TK.osd(WG, 'cctv', t, { cam: 'CAM 31', place: 'UPPER LEVEL  214', stamp: stampAt(shot, tq) });
  readout(WG, Z.z);
}

// ---------------------------------------------------------------- tape damage, transitions, captions, composition
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
function capTop(g, text, a = 1) {
  if (!text || a <= 0) return;
  g.save(); g.globalAlpha = a; g.font = '44px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  text.split('\n').forEach((s, i) => { const w = g.measureText(s).width + 28; g.fillStyle = 'rgba(0,0,0,.82)'; g.fillRect(W / 2 - w / 2, 92 + i * 50, w, 48); g.fillStyle = '#f2f2f2'; g.fillText(s, W / 2, 117 + i * 50); });
  g.restore();
}
function gainNoise(g, t, a) {
  TK.statics(NZG, t * 1.37 + 3, 1);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .42; g.drawImage(NZ, 0, 0); g.restore();
}
function camcorder(shot, t) {
  const r = shotCam(RG, FGG, t, shot);
  WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, W, H);
  WK.translate(540, 405); WK.rotate(r.roll || 0); WK.scale(1.05, 1.05); WK.translate(-540, -405);
  WK.filter = `blur(${(r.bgBlur || 0).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0);
  WK.filter = `blur(${(r.fgBlur || 0).toFixed(2)}px)`; WK.drawImage(FG, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
  TK.grade(WG, WORK, t, 'camcorder', { brightness: (r.bright || 1) * (.98 + .04 * Math.sin(t * 1.7) + .03 * Math.sin(t * 4.3)) });
  if (r.noise) gainNoise(WG, t, r.noise);
  const gk = glitchAt(t); TK.vhs(WG, t, gk ? 2.2 : .9, 6);
  if (gk) { tear(WG, t, Math.sin(gk[0] * PI)); TK.statics(WG, t, .35 * Math.sin(gk[0] * PI)); }
  TK.osd(WG, 'camcorder', t, { time: shot === 'cam1' ? 'AM 2:20' : 'AM 2:21', date: 'DEC.06.1999', battery: 1 });
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const s = shotAt(t), inStatic = !s || TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) TK.statics(WG, t, 1);
  else if (s[0].startsWith('cctv')) shotCctv(s[0], t);
  else camcorder(s[0], t);
  if (!inStatic) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) capTop(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  const ak = kOf(t, [TL.ASK_T, TL.ASK_T + .7]), n = Math.ceil(ak * TL.ASK.length);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: clamp((t - .8) / .6), ask: t >= TL.ASK_T ? TL.ASK.slice(0, n) : null, askFull: TL.ASK });
}
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound only)
// Everything is something at the storefront, picked up by his camcorder mic or CAM 31's ceiling mic: the empty mall's air,
// the ventilation, his steps, breath and hands, the grille (creaking under a weight, then shaken), the display lights' relay.
// space: close (at his mic), shop (where the camera is: the corridor in front of 214), hall (the store behind the grille),
// tape / archive (after the recording chain)
function buildEvents() {
  const EV = [], cq = x => +(Math.ceil(x * FPS_CCTV - 1e-6) / FPS_CCTV).toFixed(3);
  EV.push(
    // S1: CAM 31's own mic: the mall's air, the ventilation; the time-lapse jump
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: 0, t1: SH.cctv1[2], g: -29, fin: .01, fout: .01 },
    { type: 'bed', fx: 'duct_hum', space: 'hall', t: 0, t1: SH.cctv1[2], g: -41, fin: .01, fout: .01 },
    { type: 'creak', t: cq(TL.SNAP1), g: .45 }, { type: 'glitch', t: TL.LAPSE, dur: .15 },
    // S2: his camcorder: the air, his breath, the flashlight's beat on each of them (his hand), two steps up to the grille
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cam1[1], t1: SH.cam1[2], g: -32, fin: .02, fout: .01 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: SH.cam1[1] + .3, t1: SH.cam1[2], g: -32, fin: .5, fout: .02 },
    { type: 'rustle', t: TL.COUNT[0] + .05, g: .4 },
    ...TL.STEPS.filter(x => x < SH.cam1[2]).map((t, i) => ({ type: 'step', t, g: .8, pan: i % 2 ? .1 : -.1 })),
    { type: 'rustle', t: TL.ZOOM[0] + .05, g: .3 },
    // S3: CAM 31 again
    { type: 'vcr', t: TL.ROLL2[0] },
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cctv2[1], t1: SH.cctv2[2], g: -29, fin: .01, fout: .01 },
    { type: 'bed', fx: 'duct_hum', space: 'hall', t: SH.cctv2[1], t1: SH.cctv2[2], g: -41, fin: .01, fout: .01 },
    { type: 'creak', t: cq(TL.HAND), g: .6 }, { type: 'creak', t: cq(TL.TILT), g: .4 },
    // S4: at the grille; it is on its stand on his tape, but the grille creaks under a weight right in front of him
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cam2[1], t1: TL.QUIET[0], g: -32, fin: .02, fout: .25 },
    { type: 'bed', fx: 'near_breath', space: 'close', t: SH.cam2[1] + .1, t1: TL.QUIET[0], g: -31, fin: .3, fout: .2 },
    ...TL.CREAKS.map((t, i) => ({ type: 'creak_close', t, g: [.55, .7, .8, .6][i] })),
    // the lights: the relay clunks, the spots buzz on; the grille is shaken right in front of the mic; his gasp; he stumbles
    { type: 'lights', t: TL.STING - .01 }, { type: 'rattle', t: TL.STING + .03 }, { type: 'hit', t: TL.STING + .05, g: .5 },
    { type: 'gasp', t: TL.STING + .1 }, { type: 'rattle2', t: TL.STING + .2, g: 1 }, { type: 'rattle2', t: TL.STING + .42, g: .6 },
    { type: 'scuff', t: TL.STUMBLE[0] + .05, g: .9 }, { type: 'handling', t: TL.STUMBLE[0] + .1, g: .9 },
    ...TL.STEPS.filter(x => x >= SH.cam2[1]).map((t, i) => ({ type: 'step', t, g: .9, pan: i % 2 ? .1 : -.1 })),
    // S5: CAM 31: his steps going away, the spots' buzz, the relay again; then only the air
    { type: 'vcr', t: TL.ROLL3[0] },
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cctv3[1], t1: TL.END, g: -29, fin: .01, fout: .02 },
    { type: 'bed', fx: 'spots_buzz', space: 'hall', t: SH.cctv3[1], t1: cq(TL.DARK), g: -38, fin: .01, fout: .005 },
    ...[0, 1, 2, 3].map(i => ({ type: 'step', t: cq(TL.BACKOUT[0] + .25 + i * .45), g: .7 - i * .1, pan: 0 })),
    { type: 'lights_off', t: cq(TL.DARK) },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    const c31 = mkCam(CAM31);
    GRILLE31 = project(c31, [.25, 1.3, .3]);
    FACE31 = project(c31, [LEON_X - .2, 1.55, 0]);
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
