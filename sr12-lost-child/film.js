// STILL RECORDING, tape 12: "Lost Child". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white). Script: channel/scripts/SR12_lost_child.md
// The center court at 2:40 A.M. The mall's PA asks the parent of a lost child to come to the information desk. CAM 08 (black
// and white, 6 frames a second, played back by the archive) shows a small figure standing alone in front of the desk: a child
// mannequin (the Display) in a red winter coat and a knit hat, faceless, built in 3D like tape 11's mannequins. Leon's
// camcorder (colour, hand-held, his flashlight) finds nobody at the desk, the PA microphone's ON AIR light still lit. CAM 08:
// it stands right beside him. Scare type: HIDDEN BELOW, IT LOOKS UP (he leans over the counter: right under the lens it lifts
// its face to him, the PA microphone in its hands, and every speaker in the mall howls). Not movement only (tape 9), not a
// hand over the lens (tape 10), not the lights coming on (tape 11).
// Owner 11/20 (tape 8 test): the first 3 s fill the 9:16 frame, then the archive zooms out into the layout; TL.OPEN.on = false
// switches it off (the tape then opens in the usual layout, nothing else changes).
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


// ================================================================ THE CENTER COURT AND THE INFORMATION DESK
// The counter's front is the plane z 0 (x -1.6..1.6, 1.12 high, 0.7 deep, navy panels with INFORMATION in brass letters);
// behind it the staff side (z .7..1.8) and the back cabinet; the INFORMATION sign hangs over it; NOW SERVING on its post at
// the left end; the PA microphone in its clip on the counter, its ON AIR light lit. Round it: big terrazzo tiles, two
// planters, the court's Christmas tree, the far storefronts behind their shutters. CAM 08 hangs over the court, facing the desk
const CX0 = -1.6, CX1 = 1.6, CTOP = 1.12, CDEP = .7;
const DESKLIGHT = [0, 4.6, -.9], TREE = [4.4, 0, 3.6], NIGHTS = [[-5.5, 4.6, -3.5], [5.8, 4.6, -5]];
const CAM08 = lookAt([-1.3, 3.5, -7.4], [.05, .85, -.4], 34);
const MIC_BASE = [.62, CTOP, .32];
function buildCourt() {
  const S = new TK.Scene(), R = TK.rng(812);
  for (let i = -12; i < 12; i++) for (let j = -12; j < 14; j++) {
    const x = i * .8, z = j * .8, c = ((i + j) & 1 ? [150, 146, 138] : [136, 132, 124]).map(v => v * (.95 + R() * .08));
    S.quad([[x, 0, z], [x + .8, 0, z], [x + .8, 0, z + .8], [x, 0, z + .8]], c, { floor: true });
  }
  // the far storefronts behind their shutters (z 11), the court's dark upper level over them
  for (let i = 0; i < 6; i++) {
    const x0 = -9 + i * 3, name = TK.STORES[(i * 5 + 2) % TK.STORES.length];
    S.quad([[x0 + .15, 0, 11], [x0 + 2.85, 0, 11], [x0 + 2.85, 2.8, 11], [x0 + .15, 2.8, 11]], [104, 104, 102], { tex: 'shutter' });
    S.quad([[x0 + .4, 3.0, 10.99], [x0 + 2.6, 3.0, 10.99], [x0 + 2.6, 3.4, 10.99], [x0 + .4, 3.4, 10.99]], [40, 38, 40], { text: name, textCol: [190, 182, 168] });
    S.quad([[x0, 0, 11.01], [x0 + .15, 0, 11.01], [x0 + .15, 7, 11.01], [x0, 7, 11.01]], [70, 70, 70]);
  }
  S.quad([[-9, 2.8, 11.02], [9, 2.8, 11.02], [9, 7, 11.02], [-9, 7, 11.02]], [48, 48, 50]);
  for (const x of [-6.2, 6.2]) S.box(x - .35, 0, 4.3, x + .35, 7, 5.0, [120, 118, 112]);
  // two planters with their dark shrubs
  for (const [x, z] of [[-3.8, -1.8], [3.0, -2.6]]) {
    S.box(x - .6, 0, z - .6, x + .6, .55, z + .6, [118, 110, 98]);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, r = .32; S.box(x + Math.cos(a) * r - .2, .55, z + Math.sin(a) * r - .2, x + Math.cos(a) * r + .2, .95 + R() * .3, z + Math.sin(a) * r + .2, [34, 58, 38].map(v => v * (.85 + R() * .3))); }
  }
  // the desk: front panels, INFORMATION in brass letters, the top, the ends, the back of the front panel, the back cabinet
  for (let x = CX0; x < CX1 - 1e-6; x += .4) S.quad([[x, 0, 0], [x + .4, 0, 0], [x + .4, 1.05, 0], [x, 1.05, 0]], [52, 66, 92]);   // in strips (the painter sorts them)
  S.quad([[CX0, 0, -.004], [CX1, 0, -.004], [CX1, .1, -.004], [CX0, .1, -.004]], [28, 30, 36]);
  S.quad([[-1.15, .58, -.006], [1.15, .58, -.006], [1.15, .8, -.006], [-1.15, .8, -.006]], [52, 66, 92], { text: 'INFORMATION', textCol: [214, 178, 92] });
  for (let x = CX0 - .06; x < CX1 + .06 - 1e-6; x += .4) for (const [z0, z1] of [[-.07, .25], [.25, .5], [.5, CDEP]]) S.box(x, 1.05, z0, Math.min(CX1 + .06, x + .4), CTOP, z1, [200, 192, 174]);
  S.box(CX0 - .06, 0, 0, CX0, 1.05, CDEP, [46, 58, 82]); S.box(CX1, 0, 0, CX1 + .06, 1.05, CDEP, [46, 58, 82]);
  for (let x = CX0; x < CX1 - 1e-6; x += .4) S.quad([[x + .4, 0, .02], [x, 0, .02], [x, 1.05, .02], [x + .4, 1.05, .02]], [30, 34, 44]);
  for (let x = CX0 + .1; x < CX1 - .1 - 1e-6; x += .4) S.box(x, .7, .03, Math.min(CX1 - .1, x + .4), .74, CDEP - .05, [150, 144, 130]);   // the shelf under the top
  S.box(-1.5, 0, 1.6, 1.5, 1.0, 1.8, [150, 140, 122]);
  for (let i = 0; i < 6; i++) S.box(-1.4 + i * .48, .62, 1.58, -1.0 + i * .48, .96, 1.6, [[180, 60, 60], [60, 110, 160], [230, 220, 190], [80, 140, 90], [200, 170, 80], [150, 90, 140]][i]);
  // the hanging INFORMATION sign
  S.quad([[-1.05, 2.55, .35], [1.05, 2.55, .35], [1.05, 3.0, .35], [-1.05, 3.0, .35]], [30, 42, 66], { text: 'INFORMATION', textCol: [236, 232, 220] });
  for (const x of [-.95, .95]) S.box(x - .005, 3.0, .345, x + .005, 6, .355, [150, 150, 150]);
  // NOW SERVING on its post at the left end (its face is drawn after the light), the PA microphone's base
  S.box(-1.48, CTOP, .1, -1.44, 1.45, .14, [60, 60, 62]); S.box(-1.74, 1.45, .06, -1.18, 1.8, .16, [24, 24, 26]);
  S.box(MIC_BASE[0] - .11, CTOP, MIC_BASE[2] - .08, MIC_BASE[0] + .11, CTOP + .05, MIC_BASE[2] + .08, [36, 36, 38]);
  S.q.forEach(prep);
  return S;
}
const COURT = buildCourt();
// Lt: { amb, desk (the downlight over the desk), nights, tree }
function courtLight(Lt) {
  return q => {
    const c = q.c, n = q.n;
    let w = Lt.amb + pointLight(c, n, DESKLIGHT, Lt.desk, 3.0, true);
    for (const p of NIGHTS) w += pointLight(c, n, p, Lt.nights, 4.5, true);
    const tr = pointLight(c, n, [TREE[0], 1.6, TREE[2]], Lt.tree, 2.4);
    if (c[1] < CTOP - .05 && c[2] > .03 && c[2] < CDEP + 1.2 && Math.abs(c[0]) < CX1 + .1) w *= .45;   // under and behind the counter: in its shadow
    return [w + tr * 1.1, w + tr * .8, w * 1.05 + tr * .6];
  };
}
function figLight(p, Lt) {
  let w = Lt.amb + pointLight(p, [0, 0, -1], DESKLIGHT, Lt.desk, 3.0, true);
  for (const q of NIGHTS) w += pointLight(p, [0, 0, -1], q, Lt.nights, 4.5, true);
  if (p[2] > .03 && p[1] < CTOP + .2 && Math.abs(p[0]) < CX1) w *= .55;
  return clamp(w + pointLight(p, [1, 0, 0], [TREE[0], 1.6, TREE[2]], Lt.tree * .6, 2.4), .05, 1.2);
}
// the court's Christmas tree (a flat cutout drawn in its place: tiers of dark green, small lights, a star)
function drawTree(g, cam, t, k) {
  const b = project(cam, TREE), top = project(cam, [TREE[0], 3.4, TREE[2]]); if (!b || !top) return;
  const u = (b[1] - top[1]) / 3.4;
  g.save(); g.translate(b[0], b[1]); g.scale(u, u);
  g.fillStyle = rgb([70, 50, 36], k); g.fillRect(-.12, -.5, .24, .5);
  for (let i = 0; i < 4; i++) { const y0 = -.4 - i * .7, w = 1.2 - i * .25; poly(g, [[-w, y0], [w, y0], [0, y0 - 1.3]], rgb([24, 54, 34].map(v => v * (1 + i * .08)), k)); }
  g.restore();
  const R = TK.rng(77), cols = ['255,80,60', '255,210,90', '90,160,255', '120,255,150'];
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const yy = .5 + R() * 2.7, w = (1.25 - (yy - .5) / 2.7 * 1.1) * (R() * 2 - 1), p = project(cam, [TREE[0] + w, yy, TREE[2] - .3]); if (!p) continue;
    const on = .55 + .45 * Math.sin(t * 1.3 + i * 2.1), r = Math.max(1.5, cam.f * .05 / p[2]), c = cols[i % 4];
    const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); gr.addColorStop(0, `rgba(${c},${on})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r);
  }
  const s = project(cam, [TREE[0], 3.45, TREE[2] - .3]); if (s) { const r = cam.f * .16 / s[2]; const gr = g.createRadialGradient(s[0], s[1], 0, s[0], s[1], r); gr.addColorStop(0, 'rgba(255,240,180,.9)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr; g.fillRect(s[0] - r, s[1] - r, 2 * r, 2 * r); }
  g.restore();
}
// the desk's own lights and fittings drawn after the light: NOW SERVING (its number changes for six frames), the ON AIR
// light, the microphone in its clip (or its empty clip and the cord over the back of the counter)
function deskDetails(g, cam, t, k, micIn, cordTo) {
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
  onQuad(g, project(cam, [-1.71, 1.77, .058]), project(cam, [-1.21, 1.77, .058]), project(cam, [-1.71, 1.48, .058]), 500, 290, q => {
    q.fillStyle = 'rgb(10,10,12)'; q.fillRect(0, 0, 500, 290);
    q.font = '46px "Special Elite"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = rgb([210, 206, 196], Math.max(.5, k)); q.fillText('NOW SERVING', 250, 46);
    q.font = '190px "VT323"'; q.shadowColor = 'rgba(255,40,30,.9)'; q.shadowBlur = 22; q.fillStyle = 'rgb(255,58,44)'; q.fillText(egg ? '11' : '47', 250, 182);
  });
  const led = project(cam, [MIC_BASE[0] - .06, CTOP + .03, MIC_BASE[2] - .082]);
  if (led) { const r = Math.max(2, cam.f * .03 / led[2]); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(led[0], led[1], 0, led[0], led[1], r); gr.addColorStop(0, 'rgba(255,50,40,1)'); gr.addColorStop(1, 'rgba(255,40,30,0)'); g.fillStyle = gr; g.fillRect(led[0] - r, led[1] - r, 2 * r, 2 * r); g.restore();
    const tx = project(cam, [MIC_BASE[0] + .02, CTOP + .03, MIC_BASE[2] - .082]); if (tx && cam.f / tx[2] > 600) { g.save(); g.font = `${Math.round(cam.f * .018 / tx[2])}px "VT323"`; g.fillStyle = 'rgba(255,90,80,.95)'; g.textBaseline = 'middle'; g.fillText('ON AIR', tx[0], tx[1]); g.restore(); } }
  // the clip's short gooseneck; the microphone in it, or not
  const a = project(cam, [MIC_BASE[0] + .05, CTOP + .05, MIC_BASE[2]]), b = project(cam, [MIC_BASE[0] + .05, CTOP + .22, MIC_BASE[2] - .06]);
  if (a && b) {
    g.save(); g.lineCap = 'round'; g.strokeStyle = rgb([30, 30, 32], 1); g.lineWidth = Math.max(1.2, cam.f * .012 / a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(a[0], b[1], b[0], b[1]); g.stroke();
    if (micIn) { const c = project(cam, [MIC_BASE[0] + .05, CTOP + .3, MIC_BASE[2] - .12]); if (c) { g.lineWidth = Math.max(2, cam.f * .032 / c[2]); g.strokeStyle = rgb([20, 20, 22], 1); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.stroke(); ell(g, c[0], c[1], cam.f * .024 / c[2], cam.f * .024 / c[2], rgb([60, 60, 64], k)); } }
    g.restore();
  }
  if (!micIn && cordTo) {                                                                       // the cord over the back edge, down behind the counter
    const P = [[MIC_BASE[0], CTOP + .02, MIC_BASE[2]], [MIC_BASE[0] - .05, CTOP + .015, CDEP - .02], cordTo[1] > CTOP ? [MIC_BASE[0] - .07, CTOP + .01, CDEP] : [MIC_BASE[0] - .07, CTOP - .02, CDEP + .02], cordTo].map(p => project(cam, p));
    if (P.every(Boolean)) { g.save(); g.strokeStyle = 'rgb(16,16,18)'; g.lineWidth = clamp(cam.f * .004 / P[1][2], 1, 3.5); g.lineJoin = 'round'; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.lineTo(P[1][0], P[1][1]); g.quadraticCurveTo(P[2][0], P[2][1], P[3][0], P[3][1]); g.stroke(); g.restore(); }
  }
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
  handL: { sp: [[.22, .892, .016], [.224, .838, .024], [.227, .775, .03], [.225, .72, .03]], rw: [.023, .033, .031, .016], rh: [.012, .014, .012, .006], n: 6, cl: 'hand', ch: ['elL', 'shL'], hand: true },
  handR: { sp: [[-.22, .892, .016], [-.224, .838, .024], [-.227, .775, .03], [-.225, .72, .03]], rw: [.023, .033, .031, .016], rh: [.012, .014, .012, .006], n: 6, cl: 'hand', ch: ['elR', 'shR'], hand: true },
  thighL: { sp: [[.085, .86, 0], [.085, .68, .01], [.08, .5, .012]], rw: [.074, .062, .045], rh: [.08, .065, .048], n: 5, cl: 'leg' },
  thighR: { sp: [[-.085, .86, 0], [-.085, .68, .01], [-.08, .5, .012]], rw: [.074, .062, .045], rh: [.08, .065, .048], n: 5, cl: 'leg' },
  shinL: { sp: [[.08, .5, .012], [.075, .3, -.004], [.07, .1, -.012]], rw: [.045, .04, .025], rh: [.048, .045, .03], n: 5, cl: 'shin' },
  shinR: { sp: [[-.08, .5, .012], [-.075, .3, -.004], [-.07, .1, -.012]], rw: [.045, .04, .025], rh: [.048, .045, .03], n: 5, cl: 'shin' },
  footL: { sp: [[.07, .11, -.03], [.07, .055, .04], [.07, .018, .12]], rw: [.026, .032, .024], rh: [.03, .024, .012], n: 4, cl: 'shoe' },
  footR: { sp: [[-.07, .11, -.03], [-.07, .055, .04], [-.07, .018, .12]], rw: [.026, .032, .024], rh: [.03, .024, .012], n: 4, cl: 'shoe' },
  skirt: { sp: [[0, 1.1, 0], [0, .93, -.004], [0, .72, 0], [0, .53, .004]], rw: [.13, .182, .2, .206], rh: [.088, .118, .134, .142], n: 6, cl: 'skirt', bias: -.05, only: 'skirt' },
  hat: { sp: [[0, 1.655, -.008], [0, 1.715, -.008], [0, 1.77, -.012], [0, 1.805, -.014]], rw: [.081, .083, .066, .028], rh: [.099, .1, .081, .032], n: 6, cl: 'hat', ch: ['head'], bias: -.03, only: 'hat' },
  pompom: { sp: [[0, 1.8, -.014], [0, 1.83, -.014], [0, 1.86, -.014]], rw: [.02, .036, .02], rh: [.02, .036, .02], n: 4, cl: 'hat', ch: ['head'], bias: -.04, only: 'hat' },
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
    if (Q.headScale && ch.includes('head')) v = add3(MJ.head, mul3(sub3(v, MJ.head), Q.headScale));
    for (const j of ch) { const r = Q.joints[j]; if (r) v = add3(MJ[j], rot3(sub3(v, MJ[j]), r)); }
    if (Q.scale) v = mul3(v, Q.scale);
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

// ---------------------------------------------------------------- Leon on CAM 31 (from behind, the camcorder at his eye, the
// flashlight in his right hand)
const SHIRT = [140, 156, 182], TROUS = [34, 38, 52], CAP = [28, 32, 50], SKIN = [182, 140, 112];
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

// ---------------------------------------------------------------- the child (the Display): a child mannequin, the same jointed
// 3D body as tape 11's, scaled to child height with a bigger head, a red winter coat, a knit hat, mittens. Faceless.
const KID_S = .53, KID_H = 1.35;
const KID = { name: 'kid', skin: [236, 230, 218], top: [168, 28, 34], sleeve: [168, 28, 34], fore: [168, 28, 34], neck: 'skin', leg: [46, 42, 50], shin: [46, 42, 50], shoe: [40, 30, 26], coat: [168, 28, 34], hat: [226, 222, 212], hand: [224, 220, 210] };
const kidQ = (p, yaw, joints) => ({ p, yaw, lean: 0, joints, scale: KID_S, headScale: KID_H });
const LEON_X = .12, KID_BEHIND = [.12, -.22, .98];                                    // crouched behind the counter
const KID_FRONT = tz => kidQ([.34, 0, -1.15], PI + .06, { head: [.05, 0, tz], shL: [0, 0, .08], shR: [0, 0, -.08] });
const HOLD_MIC = { shL: [-1.55, 0, .28], elL: [-1.7, 0, -.45], shR: [-1.55, 0, -.28], elR: [-1.7, 0, .45] };
function kidAt(t, shot) {
  if (shot === 'cctv1') return KID_FRONT(t >= TL.TILT1 ? .45 : .22);
  if (shot === 'cctv2') {
    if (t < TL.GONE) return kidQ([LEON_X - .52, 0, -.4], PI + .25, { head: t >= TL.TILT2 ? [-.5, -.3, -.3] : [0, -.1, -.12], shR: [-.25, 0, -.3], elR: [-.4, 0, 0], shL: [0, 0, .06] });
    if (t < TL.BEHIND) return kidQ([CX0 - .3, 0, .3], PI / 2 + .3, { head: [0, -.4, .1], shL: [.15, 0, .06], shR: [-.15, 0, -.06] });
    return kidQ([-.6, -.3, 1.2], PI, { head: [.4, 0, 0] });
  }
  if (shot === 'cam2') return kidQ(t >= TL.STING ? add3(KID_BEHIND, [0, .1, -.06]) : KID_BEHIND, PI, Object.assign({ head: t >= TL.STING ? [-1.1, 0, .34] : [.55, 0, -.1] }, HOLD_MIC));   // it rises to him
  if (shot === 'cctv3') return t >= TL.RETURN ? KID_FRONT(.22) : kidQ([-.4, -.3, 1.2], PI, { head: [.4, 0, 0] });
  return kidQ(KID_BEHIND, PI, Object.assign({ head: [.55, 0, -.1] }, HOLD_MIC));               // cam1: behind the counter (unseen)
}
// the microphone in its hands (between the mittens, under its chin)
function micAt(Q) {
  const toW = toWorldFn(Q), hL = MPARTS.find(p => p.name === 'handL'), hR = MPARTS.find(p => p.name === 'handR');
  const a = toW(hL.secs[2].c, hL.ch), b = toW(hR.secs[2].c, hR.ch);
  return lerp3(a, b, .5);
}
function drawMic(g, cam, Q, k) {
  const m = micAt(Q), top = add3(m, [0, .09, -.03]), p = project(cam, m), q = project(cam, top); if (!p || !q) return;
  g.save(); g.lineCap = 'round'; g.strokeStyle = rgb([24, 24, 26], 1); g.lineWidth = Math.max(2, cam.f * .03 / p[2]); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
  ell(g, q[0], q[1], cam.f * .025 / q[2], cam.f * .025 / q[2], rgb([70, 70, 74], k)); g.restore();
}

// ---------------------------------------------------------------- Leon on CAM 08: at the desk (his back to the camera); later
// he backs away to the left and out of frame
function leonPos(t, shot) {
  if (shot === 'cctv3') { const k = ease(kOf(t, TL.BACKOUT)); return [lerp(LEON_X, -3.6, k), lerp(-.45, -2.7, k)]; }
  return [LEON_X, -.45];
}
// the court through any camera: lit, plus the flashlight pass; the tree, the child and Leon are sprites sorted with the
// scene (the counter hides what is behind it); the desk's lights and fittings after
function courtView(g, t, shot, camSpec, Lt, T, o = {}) {
  const kid = o.noKid ? null : kidAt(t, shot);
  const sprites = [{ x: TREE[0], y: 1.6, z: TREE[2], draw: (gg, cam) => drawTree(gg, cam, t, PASS === 'lit' ? clamp(Lt.amb + Lt.tree * .6 + .15) : 1) }];
  if (kid) sprites.push({ x: kid.p[0], y: kid.p[1] + .55, z: kid.p[2], draw: (gg, cam) => { const k = PASS === 'lit' ? figLight(add3(kid.p, [0, .7, 0]), Lt) : 1; drawMannequin(gg, cam, kid, KID, k); if (shot === 'cam2' || shot === 'cam1') drawMic(gg, cam, kid, k); } });
  if (o.leon) { const [x, z] = leonPos(t, shot); sprites.push({ x, y: .9, z, draw: (gg, cam) => leonBack(gg, cam, x, z, PASS === 'lit' ? clamp(figLight([x, 1.3, z], Lt) + .1) : 1, { step: o.leonStep || 0 }) }); }
  PASS = 'lit';
  const cam = TK.render(g, lit(COURT, courtLight(Lt)), camSpec, { ambient: 1, fog: .01, bg: [4, 4, 5], grid: false, sprites });
  if (T && (T.hand || (T.world && T.world.length))) {
    PASS = 'albedo';
    TK.render(ALG, COURT, camSpec, { ambient: 1, fog: .01, bg: [0, 0, 0], grid: false, sprites });
    torchMap(LG, cam, T);
    ALG.save(); ALG.globalCompositeOperation = 'multiply'; ALG.drawImage(LMAP, 0, 0); ALG.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(ALB, 0, 0); g.restore();
    PASS = 'lit';
  }
  const micIn = shot === 'cam1' || shot === 'cctv1' || (shot === 'cctv2' && t < TL.GONE);
  const cordTo = shot !== 'cam2' || !kid ? null : t >= TL.LEAN[0] + .45 ? micAt(kid) : [MIC_BASE[0] - .1, CTOP + .004, CDEP + .004];   // over the edge, out of sight until he leans over
  deskDetails(g, cam, t, clamp(Lt.amb + Lt.desk * .5), micIn, cordTo);   // (the cord only where nothing stands in front of it)
  // the downlight over the desk, the night lights
  for (const p of [DESKLIGHT, ...NIGHTS]) { const q = project(cam, p); if (q) { const r = cam.f * .45 / q[2]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); gr.addColorStop(0, 'rgba(240,242,232,.75)'); gr.addColorStop(1, 'rgba(240,242,232,0)'); g.fillStyle = gr; g.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r); g.restore(); } }
  return cam;
}

// ---------------------------------------------------------------- the camcorder
// the beam: where it lands (the counter's front or top, the floor, the back cabinet, the child)
function beamHit(o, d, figs = []) {
  let best = 1e9; const T = (v, ok = true) => { if (ok && v > 1e-4 && v < best) best = v; };
  if (d[1] < 0) T(-o[1] / d[1]);
  if (d[2] > 0 && o[2] < 0) { const v = -o[2] / d[2], q = add3(o, mul3(d, v)); T(v, q[1] < CTOP && q[0] > CX0 && q[0] < CX1); }
  if (d[1] < 0 && o[1] > CTOP) { const v = (CTOP - o[1]) / d[1], q = add3(o, mul3(d, v)); T(v, q[2] > -.07 && q[2] < CDEP && q[0] > CX0 && q[0] < CX1); }
  if (d[2] > 0) { const v = (1.6 - o[2]) / d[2], q = add3(o, mul3(d, v)); T(v, q[1] < 1.0 && Math.abs(q[0]) < 1.5); T((11 - o[2]) / d[2]); }
  for (const c of figs) { const v = dot3(sub3(c, o), d); if (v > 0) { const q = add3(o, mul3(d, v)); if (len3(sub3(q, c)) < .22) T(v - .1); } }
  return add3(o, mul3(d, best > 1e8 ? 8 : best));
}
function handBeam(cc, cs, yawOff, pitchOff, figs) {
  const yaw = cs.yaw + yawOff, pitch = cs.pitch + pitchOff, d = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const o = [cs.x + Math.cos(cs.yaw) * .22, cs.y - .38, cs.z - Math.sin(cs.yaw) * .22 + .2];
  const hit = beamHit(o, d, figs), p = project(cc, hit), dist = len3(sub3(hit, o));
  return { x: p ? p[0] : W / 2, y: p ? p[1] : H / 2, r: cc.f * .32, a: clamp(1.4 / (1 + Math.pow(dist / 3.4, 2)), .12, 1) };
}
// keys: [t, eye x, eye z, aim point, fov]
const CAM1_KEYS = [[6.4, -.4, -6.4, [0, 1.0, .2], 56], [10.4, LEON_X, -.55, [0, 1.0, .3], 54], [11.3, LEON_X, -.55, add3(MIC_BASE, [0, .12, -.05]), 40],
  [12.0, LEON_X, -.55, add3(MIC_BASE, [0, .12, -.05]), 40], [12.5, LEON_X, -.55, [-1.45, 1.6, .1], 42], [13.4, LEON_X, -.55, [-1.45, 1.6, .1], 42],
  [14.2, LEON_X, -.55, add3(MIC_BASE, [-.1, .1, -.05]), 46], [15.6, LEON_X, -.55, add3(MIC_BASE, [-.1, .1, -.05]), 44]];
function keyPose(K, t) {
  let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], k = ease(kOf(t, [a[0], b[0]]));
  const x = lerp(a[1], b[1], k), z = lerp(a[2], b[2], k), tg = lerp3(a[3], b[3], k), fov = lerp(a[4], b[4], k);
  return lookAt([x, 1.55, z], tg, fov);
}
function poseCam(t, shot) {
  if (shot === 'cam1') {
    const walking = inR(t, [TL.WALK[0] + .1, TL.WALK[1] - .1]), h = handheld(t, TL.WALK[0] + .25, 1 / .55, walking, .25), cs = keyPose(CAM1_KEYS, t), s = .5 + .5 * cs.fov / 56;
    if (t < TL.WALK[1]) { const k = ease(kOf(t, TL.WALK)); cs.z = lerp(-6.4, -.55, k); cs.x = lerp(-.4, LEON_X, k); }
    return { cam: { x: cs.x, y: 1.55 - h.y, z: cs.z, yaw: cs.yaw + h.yaw * s, pitch: cs.pitch + h.pitch * s, fov: cs.fov }, h, yawOff: .03, pitchOff: -.12 };
  }
  // cam2: at the counter on its back edge (the empty clip, the cord over the edge); he leans over; it looks up; he jerks back
  const nerve = t < TL.LEAN[0] ? .5 : t < TL.STING ? .18 : 1.2, h = handheld(t, 0, 0, false, nerve);
  const l = ease(kOf(t, TL.LEAN)), r = ease(kOf(t, TL.RECOIL));
  const eye = lerp3(lerp3([LEON_X, 1.55, -.45], [LEON_X - .02, 1.32, .62], l), [LEON_X - .1, 1.6, -.75], r);
  const tg = lerp3(lerp3([.35, 1.02, .62], add3(KID_BEHIND, [0, .86, .06]), l), [0, 1.9, 1.5], r);
  const cs = lookAt(eye, tg, lerp(50, 56, l));
  if (t >= TL.STING && t < TL.STING + .08) { cs.yaw += .02; cs.pitch += .04; }
  return { cam: { x: cs.x, y: cs.y - h.y * (1 - l), z: cs.z, yaw: cs.yaw + h.yaw, pitch: cs.pitch + h.pitch, fov: cs.fov }, h, yawOff: .03, pitchOff: lerp(-.1, -.02, l) };
}
function shotCam(g, fg, t, shot) {
  const P = poseCam(t, shot), cs = P.cam, cc = mkCam(cs), kid = kidAt(t, shot);
  const T = { hand: handBeam(cc, cs, P.yawOff, P.pitchOff, kid ? [add3(kid.p, [0, .7, 0])] : []), spill: .08 };
  if (shot === 'cam2') { const l = ease(kOf(t, TL.LEAN)); T.hand.a *= 1 - .2 * l; T.hand.r *= 1 - .35 * l; }
  const Lt = { amb: .1, desk: 1.0, nights: .5, tree: .5 };
  courtView(g, t, shot, cs, Lt, T);
  fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, W, H);
  if (!(shot === 'cam2' && t >= TL.RECOIL[0])) {
    const hx = 915 + P.h.yaw * -120, hy = 712 + P.h.y * 380, vp = project(cc, add3([cs.x, cs.y, cs.z], [Math.sin(cs.yaw + P.yawOff) * 6, Math.sin(cs.pitch + P.pitchOff) * 6, Math.cos(cs.yaw + P.yawOff) * 6])) || [540, 430];
    armTorch(fg, hx, hy, Math.atan2(vp[1] - hy, vp[0] - hx), .55);
  }
  let bgBlur = 6 * Math.exp(-(t - SH[shot][1]) / .2), noise = .14;
  if (shot === 'cam1' && t > 11.0 && t < 11.7) bgBlur += 2.2 * Math.sin(PI * kOf(t, [11.0, 11.7]));
  if (shot === 'cam2' && inR(t, TL.LEAN)) bgBlur += 2 * Math.sin(PI * kOf(t, TL.LEAN));
  if (shot === 'cam2' && t >= TL.RECOIL[0]) { bgBlur = 7 * Math.sin(PI * clamp(kOf(t, TL.RECOIL) * 1.2)); noise = .25; }
  return { roll: P.h.roll + (shot === 'cam2' && t >= TL.RECOIL[0] ? .3 * Math.sin(PI * kOf(t, TL.RECOIL)) : 0), bgBlur, fgBlur: 0, noise, bright: 1.1 };
}

// ---------------------------------------------------------------- CAM 08 playback (6 fps), by the archive
function stampAt(shot, tq) {
  const base = shot === 'cctv1' ? TL.STAMP1 : shot === 'cctv2' ? TL.STAMP2 : TL.STAMP3;
  const s = base[0] * 3600 + base[1] * 60 + base[2] + Math.floor(tq - SH[shot][1]);
  return `${TL.DATE}  ${p2(Math.floor(s / 3600) % 24)}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`;
}
let KID08 = null, PAIR08 = null;
function cctvZoom(shot, t) {
  if (shot === 'cctv1') return { z: 1.6, f: KID08, k: .6 };
  if (shot === 'cctv2') { const k = ease(kOf(t, TL.PUSH2)); return { z: lerp(1, 1.9, k), f: [lerp(W / 2, PAIR08[0], k), lerp(H / 2, PAIR08[1], k)], k: .6 * k }; }
  const k = ease(kOf(t, TL.PUSH3)); return { z: lerp(1, 1.6, k), f: [lerp(W / 2, KID08[0], k), lerp(H / 2, KID08[1], k)], k: .6 * k };
}
const zoomCentre = Z => { let tx = lerp(Z.f[0], W / 2, Z.k), ty = lerp(Z.f[1], H / 2, Z.k); tx = clamp(tx, W - (W - Z.f[0]) * Z.z, Z.f[0] * Z.z); ty = clamp(ty, H - (H - Z.f[1]) * Z.z, Z.f[1] * Z.z); return [tx, ty]; };
function shotCctv(shot, t, opening) {
  const tq = qf(t), Lt = { amb: .3, desk: 1.55, nights: .8, tree: .6 }, world = [];
  const leon = shot !== 'cctv1';
  if (shot === 'cctv2') world.push({ c: [LEON_X + .1, CTOP + .002, .35], ax: [.4, 0, 0], ay: [0, 0, .3], a: .8 });
  courtView(RG, tq, shot, CAM08, Lt, { world }, { leon, leonStep: shot === 'cctv3' && inR(tq, TL.BACKOUT) ? Math.sin(tq * 9) : 0 });
  const Z = cctvZoom(shot, t);
  zoomInto(WK, RAW, Z.z, Z.f, Z.k);
  TK.grade(WG, WORK, tq, 'cctv', { brightness: 1.45 });
  const gk = glitchAt(t); TK.vhs(WG, tq, gk ? 2.5 : 1, 5);
  if (gk) { tear(WG, t, Math.sin(gk[0] * PI)); TK.statics(WG, t, .4 * Math.sin(gk[0] * PI)); }
  const roll = shot === 'cctv2' ? [SH.cctv2[1], SH.cctv2[1] + .3] : shot === 'cctv3' ? [SH.cctv3[1], SH.cctv3[1] + .3] : null;
  if (roll && t < roll[1]) trackingRoll(WG, t, kOf(t, roll));
  if (opening) return;                                                                           // the opening draws its text full-frame
  TK.osd(WG, 'cctv', t, { cam: 'CAM 08', place: 'INFORMATION DESK', stamp: stampAt(shot, tq) });
  readout(WG, Z.z);
}

// ---------------------------------------------------------------- the full-screen opening (owner 11/20 test, as tape 8): the
// first 3 s fill the 9:16 frame (the tape picture scaled to the full 1920 height, the sides cropped on the child), then the
// archive deck zooms out (0.6 s, a head-switch band rolling through) into the usual layout. TL.OPEN.on = false: off
const OSC = 1920 / H, OSW = W / OSC;
let OPEN_CX = 540;
function frameOpts(t) {
  const ak = kOf(t, [TL.ASK_T, TL.ASK_T + .7]), n = Math.ceil(ak * TL.ASK.length);
  return { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: clamp((t - .8) / .6), ask: t >= TL.ASK_T ? TL.ASK.slice(0, n) : null, askFull: TL.ASK };
}
function osdCctvBox(g, t, X, Y, Wb, Hb, s, stamp, z) {
  g.save(); g.font = `${Math.round(46 * s)}px "VT323"`; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,235,.92)';
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2 * s; g.shadowOffsetY = 2 * s;
  g.textAlign = 'left'; g.fillText('CAM 08', X + 36 * s, Y + 28 * s); g.textAlign = 'right'; g.fillText('INFORMATION DESK', X + Wb - 36 * s, Y + 28 * s);
  g.textAlign = 'left'; g.fillText(stamp, X + 36 * s, Y + Hb - 78 * s);
  if (Math.floor(t * 1.5) % 2 === 0) { g.textAlign = 'right'; g.fillStyle = 'rgba(255,70,70,.95)'; g.fillText('● REC', X + Wb - 36 * s, Y + Hb - 78 * s); }
  if (s < 1.15) { g.globalAlpha = clamp((1.15 - s) / .1); g.font = '38px "VT323"'; g.textAlign = 'center'; g.fillStyle = 'rgba(235,240,235,.88)'; g.fillText(`PLAYBACK  x${z.toFixed(1)}`, X + Wb / 2, Y + 32 * s); }   // (during the zoom-out only)
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
  if (t >= O.full) {                                                                             // the deck's zoom: a head-switch band rolls through
    const a = Math.sin(PI * k), by = y0 + (H * sc) * (.15 + .8 * k);
    OUT.beginPath(); OUT.rect(x0, y0, W * sc, H * sc); OUT.clip();
    TK.statics(NZG, t * 1.37 + 7, 1); OUT.globalAlpha = .55 * a; OUT.drawImage(NZ, 0, 0, W, 40, 0, by - 26 * sc, 1080, 52 * sc);
    OUT.globalAlpha = .7 * a; OUT.fillStyle = 'rgb(235,235,230)'; OUT.fillRect(0, by + 28 * sc, 1080, 3);
  }
  OUT.restore();
  const shot = shotAt(t)[0], Z = cctvZoom(shot, t);
  osdCctvBox(OUT, t, 0, lerp(150, TK.WIN_Y, k), 1080, lerp(1560, H, k), lerp(1.4, 1, k), stampAt(shot, qf(t)), Z.z * sc);
  for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) capAt(OUT, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06), lerp(300, TK.WIN_Y + 117, k), lerp(1.3, 1, k));
}
function capTopML(g, text, a = 1) { capAt(g, text, a, 117, 1); }
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
  TK.osd(WG, 'camcorder', t, { time: shot === 'cam1' ? 'AM 2:40' : 'AM 2:41', date: 'DEC.07.1999', battery: 1 });
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const s = shotAt(t), inStatic = !s || TL.STATIC.some(([a, b]) => t >= a && t < b);
  const opening = !!(TL.OPEN && TL.OPEN.on && s && s[0] === 'cctv1' && t < TL.OPEN.end);
  if (inStatic) TK.statics(WG, t, 1);
  else if (s[0].startsWith('cctv')) shotCctv(s[0], t, opening);
  else camcorder(s[0], t);
  if (opening) return openingFrame(t);
  if (!inStatic) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) capTopML(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  TK.frame(OUT, WIN, frameOpts(t));
}
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound only)
// Everything is something in the center court, picked up by his camcorder mic or CAM 08's ceiling mic: the empty mall's air,
// the ventilation, the PA (its switch, its chime, its voice through every ceiling speaker, the hum of a live microphone, and
// at the end its feedback), his steps, breath and hands. space: close (at his mic), shop (the court where the camera is),
// hall (the mall's far reaches), tape / archive (after the recording chain)
function buildEvents() {
  const EV = [], cq = x => +(Math.ceil(x * FPS_CCTV - 1e-6) / FPS_CCTV).toFixed(3);
  EV.push(
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: 0, t1: SH.cctv1[2], g: -30, fin: .01, fout: .01 },
    { type: 'bed', fx: 'duct_hum', space: 'hall', t: 0, t1: SH.cctv1[2], g: -41, fin: .01, fout: .01 },
    { type: 'mic_click', t: 0.02 }, { type: 'chime', t: TL.CHIME + .12 },
    { type: 'bed', fx: 'pa_hum', space: 'hall', t: .05, t1: TL.QUIET[0], g: -40, fin: .05, fout: .2 },
    // S2: his camcorder: across the court to the desk; the live PA hums in every speaker
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cam1[1], t1: SH.cam1[2], g: -32, fin: .02, fout: .01 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: SH.cam1[1] + .3, t1: SH.cam1[2], g: -34, fin: .5, fout: .02 },
    ...TL.STEPS.map((t, i) => ({ type: 'step', t, g: .8, pan: i % 2 ? .1 : -.1 })),
    { type: 'rustle', t: 11.0, g: .35 }, { type: 'rustle', t: 12.1, g: .3 },
    // S3: CAM 08 again
    { type: 'vcr', t: SH.cctv2[1] },
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cctv2[1], t1: SH.cctv2[2], g: -30, fin: .01, fout: .01 },
    { type: 'bed', fx: 'duct_hum', space: 'hall', t: SH.cctv2[1], t1: SH.cctv2[2], g: -41, fin: .01, fout: .01 },
    // S4: at the counter; he leans over it; it looks up; every speaker in the mall howls
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cam2[1], t1: TL.QUIET[0], g: -32, fin: .02, fout: .25 },
    { type: 'bed', fx: 'near_breath', space: 'close', t: SH.cam2[1] + .1, t1: TL.QUIET[0], g: -31, fin: .3, fout: .2 },
    { type: 'rustle', t: TL.LEAN[0] + .05, g: .7 }, { type: 'handling', t: TL.LEAN[0] + .35, g: .5 },
    { type: 'feedback', t: TL.STING - .01 }, { type: 'thump', t: TL.STING + .02 }, { type: 'gasp', t: TL.STING + .08 },
    { type: 'scuff', t: TL.RECOIL[0] + .02, g: .9 }, { type: 'handling', t: TL.RECOIL[0] + .06, g: .9 },
    // S5: CAM 08: the feedback dies away in the speakers, his steps going away, the PA thanks someone; then the air
    { type: 'vcr', t: SH.cctv3[1] },
    { type: 'bed', fx: 'feedback_tail', space: 'hall', t: SH.cctv3[1], t1: SH.cctv3[1] + .9, g: -16, fin: .01, fout: .6 },
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cctv3[1], t1: TL.END, g: -30, fin: .01, fout: .02 },
    ...[0, 1, 2, 3].map(i => ({ type: 'step', t: cq(TL.BACKOUT[0] + .2 + i * .42), g: .7 - i * .12, pan: 0 })),
    { type: 'mic_click', t: TL.VO.find(v => v.id === 'P2').t - .35, g: .7 },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    const c08 = mkCam(CAM08);
    KID08 = project(c08, add3(KID_FRONT(.2).p, [0, .6, 0]));
    PAIR08 = project(c08, [LEON_X - .3, .95, -.42]);
    OPEN_CX = zoomCentre(cctvZoom('cctv1', 0))[0];
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
