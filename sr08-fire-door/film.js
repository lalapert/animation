// STILL RECORDING, tape 8: "Fire Door". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white, TK.ghost 'broken'). Script: channel/scripts/SR08_fire_door.md
// Leon's camcorder (colour, hand-held, his flashlight) is cut against CAM 14 (black and white, 6 frames a second) in the
// service corridor behind the stores. Its fire door opens inward, toward the camera. He pulls it open: beyond it is this
// same corridor, half a second late (its tube flickers late, its door opens late, and a man in a SECURITY shirt stands at
// its far door doing what Leon did half a second ago). At that man's shoulder: BROKEN. The geometry says it is at his own
// shoulder. Scare type: RIGHT BESIDE HIM (he turns and it is there, half lit, for eleven frames; the camcorder hits it).
// Not a jump at the lens (tape 6), not a flash (tape 7), not movement alone (tape 5).
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const W = TK.TW, H = TK.TH;
const RAW = mk(W, H), RG = RAW.getContext('2d'), LMAP = mk(W, H), LG = LMAP.getContext('2d'), FG = mk(W, H), FGG = FG.getContext('2d');
const NZ = mk(W, H), NZG = NZ.getContext('2d'), TMP = mk(W, H), TG = TMP.getContext('2d'), WORK = mk(W, H), WK = WORK.getContext('2d'), WIN = mk(W, H), WG = WIN.getContext('2d');
const FEED = mk(W, H), FDG = FEED.getContext('2d'), FEEDW = mk(W, H), FWG = FEEDW.getContext('2d'), GH = mk(W, H), GHG = GH.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, M = TK.motion, LAG = TL.LAG;
const qf = t => Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;
const shotAt = t => TL.SHOTS.find(s => t >= s[1] && t < s[2]);
const inR = (t, a) => t >= a[0] && t < a[1];
const kOf = (t, a) => clamp((t - a[0]) / (a[1] - a[0]));
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } };
const ell = (g, x, y, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.2832); g.fillStyle = fill; g.fill(); };
function onQuad(g, TLp, TRp, BLp, w, h, draw) {
  if (!TLp || !TRp || !BLp) return;
  g.save(); g.transform((TRp[0] - TLp[0]) / w, (TRp[1] - TLp[1]) / w, (BLp[0] - TLp[0]) / h, (BLp[1] - TLp[1]) / h, TLp[0], TLp[1]); draw(g); g.restore();
}

// ---------------------------------------------------------------- the service corridor: x -1.2..1.2, z 0..8, the fire door in
// the end wall at z 8 (opening x -.5..+.5, 2.1 high), hinged on the left. Copies k = 1, 2 lie beyond it at z + 8k: the same
// corridor, k half-seconds late. A copy's own back wall would sit exactly on the end wall in front of it, so there is none.
const HW = 1.2, LEN = 8, HT = 2.7, OX = .5, OH = 2.1, LW = .98, LH = 2.08, LT = .05, TUBE_Z = 4.4, NCOPY = 3;
const CAM14 = { x: .75, y: 2.5, z: .9, yaw: Math.atan2(-.75, 7.1), pitch: Math.atan2(1.05 - 2.5, 7.1) + .015, fov: 36 };
const SHIRT = [140, 156, 182], TROUS = [34, 38, 52], CAP = [28, 32, 50], SKIN = [182, 140, 112];

function corridor(S, k) {
  const zo = LEN * k, R = TK.rng(11 + k * 7), fine = k < 2, ez = LEN + zo;
  const fl = [[128, 126, 120], [119, 117, 112], [124, 122, 116]];
  for (let i = 0; i < 20; i++) for (let j = 0; j < 6; j++) {                                   // sealed concrete, 0.4 m slabs
    const z = i * .4, x = -HW + j * .4;
    if (i >= 17 && j >= 1 && j <= 4) continue;
    S.quad([[x, 0, z + zo], [x + .4, 0, z + zo], [x + .4, 0, z + .4 + zo], [x, 0, z + .4 + zo]], fl[(i * 7 + j * 3) % 3], { floor: true });
  }
  for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) {                                   // KEEP CLEAR hatch in front of the door
    const z = 6.8 + i * .2, x = -.8 + j * .2, y = (i + j) % 4 < 2;
    S.quad([[x, 0, z + zo], [x + .2, 0, z + zo], [x + .2, 0, z + .2 + zo], [x, 0, z + .2 + zo]], y ? [204, 168, 44] : [46, 44, 40], { floor: true });
  }
  // painted concrete block: dark green-grey to 1 m, pale above; 0.4 x 0.2 blocks, every block a slightly different shade
  const wallCol = (y, r) => (y < 1.0 ? [92, 108, 98] : [178, 180, 168]).map(c => c * (.93 + r * .1));
  for (const s of [-1, 1]) {
    const x = s * HW;
    if (fine) for (let row = 0; row < 14; row++) {
      const y0 = row * .2, y1 = Math.min(HT, y0 + .2), off = row % 2 ? .2 : 0;
      for (let z0 = -off; z0 < LEN - 1e-6; z0 += .4) {
        const a = Math.max(0, z0), b = Math.min(LEN, z0 + .4); if (b - a < .01) continue;
        const c = wallCol(y0 + .01, R());
        S.quad(s < 0 ? [[x, y0, b + zo], [x, y0, a + zo], [x, y1, a + zo], [x, y1, b + zo]] : [[x, y0, a + zo], [x, y0, b + zo], [x, y1, b + zo], [x, y1, a + zo]], c);
      }
    } else for (let z = 0; z < LEN; z++) for (const [y0, y1] of [[0, 1], [1, HT]]) {
      const c = wallCol(y0 + .01, .5);
      S.quad(s < 0 ? [[x, y0, z + 1 + zo], [x, y0, z + zo], [x, y1, z + zo], [x, y1, z + 1 + zo]] : [[x, y0, z + zo], [x, y0, z + 1 + zo], [x, y1, z + 1 + zo], [x, y1, z + zo]], c);
    }
  }
  for (let z = 0; z < LEN; z++) for (let i = 0; i < 3; i++) {                                 // the ceiling slab
    const x = -HW + i * .8;
    S.quad([[x, HT, z + 1 + zo], [x + .8, HT, z + 1 + zo], [x + .8, HT, z + zo], [x, HT, z + zo]], ((z + i) & 1) ? [96, 96, 94] : [104, 104, 100]);
  }
  // the end wall round the door opening, in blocks; the steel frame; the EXIT sign over it
  const endQ = (x0, x1, y0, y1, c) => S.quad([[x0, y0, ez], [x1, y0, ez], [x1, y1, ez], [x0, y1, ez]], c);
  for (let row = 0; row < 14; row++) {
    const y0 = row * .2, y1 = Math.min(HT, y0 + .2), off = row % 2 ? .17 : 0;
    const spans = y0 >= OH + .06 - 1e-6 ? [[-HW, HW]] : [[-HW, -OX - .06], [OX + .06, HW]];
    for (const [a0, a1] of spans) for (let x0 = a0 - off; x0 < a1 - 1e-6; x0 += fine ? .34 : 1.2) {
      const a = Math.max(a0, x0), b = Math.min(a1, x0 + (fine ? .34 : 1.2)); if (b - a < .01) continue;
      endQ(a, b, y0, y1, wallCol(y0 + .01, R()));
    }
  }
  const fc = [72, 82, 76];
  S.box(-OX - .06, 0, ez - .04, -OX, OH + .06, ez, fc); S.box(OX, 0, ez - .04, OX + .06, OH + .06, ez, fc); S.box(-OX, OH, ez - .04, OX, OH + .06, ez, fc);
  S.quad([[-OX, .004, ez - .06], [OX, .004, ez - .06], [OX, .004, ez + .02], [-OX, .004, ez + .02]], [150, 150, 146], { floor: true });   // threshold strip
  S.box(-.22, 2.24, ez - .1, .22, 2.44, ez, [196, 196, 190]);                                 // EXIT sign (its face is a light)
  if (k > 0) S.quad([[.7, 1.92, ez - .004], [1.06, 1.92, ez - .004], [1.06, 2.3, ez - .004], [.7, 2.3, ez - .004]], wallCol(2, .5), { text: '14', textCol: [24, 24, 26] });
  // the fire extinguisher, the electrical panel, the pipes, the cable tray, a mop bucket, boxes, two light fittings
  S.box(-HW, .55, 6.05 + zo, -HW + .17, 1.08, 6.22 + zo, [176, 30, 26]);
  S.box(-HW + .17, .62, 6.09 + zo, -HW + .19, 1.0, 6.11 + zo, [20, 20, 20]);
  S.quad([[-HW + .004, 1.3, 6.3 + zo], [-HW + .004, 1.3, 5.98 + zo], [-HW + .004, 1.58, 5.98 + zo], [-HW + .004, 1.58, 6.3 + zo]], [186, 34, 30]);
  S.box(-HW, 1.15, 2.7 + zo, -HW + .1, 1.85, 3.25 + zo, [118, 122, 120]);
  S.quad([[-HW + .104, 1.62, 3.1 + zo], [-HW + .104, 1.62, 2.85 + zo], [-HW + .104, 1.78, 2.85 + zo], [-HW + .104, 1.78, 3.1 + zo]], [210, 180, 40]);
  for (let z = 0; z < LEN; z++) {
    S.box(-1.08, 2.36, z + zo, -.96, 2.46, z + 1 + zo, [120, 122, 118]); S.box(-1.12, 2.2, z + zo, -1.0, 2.3, z + 1 + zo, [184, 182, 172]);
    if (z >= 2) S.box(.9, 2.44, z + zo, 1.16, 2.48, z + 1 + zo, [88, 90, 90]);
  }
  S.box(.72, 0, 2.3 + zo, 1.12, .36, 2.7 + zo, [196, 164, 40]);
  S.box(.9, .3, 2.48 + zo, .94, 1.45, 2.52 + zo, [150, 120, 80]);
  S.box(.62, 0, 3.0 + zo, 1.18, .52, 3.62 + zo, [156, 122, 84]);
  S.box(.7, .52, 3.08 + zo, 1.12, .86, 3.5 + zo, [146, 114, 78]);
  S.box(-.13, 2.6, TUBE_Z - .62 + zo, .13, 2.7, TUBE_Z + .62 + zo, [150, 150, 146]);
  S.box(-.13, 2.6, 1.0 + zo, .13, 2.7, 2.2 + zo, [140, 140, 136]);
  S.quad([[-.07, 2.598, 2.15 + zo], [.07, 2.598, 2.15 + zo], [.07, 2.598, 1.05 + zo], [-.07, 2.598, 1.05 + zo]], [70, 72, 74]);   // its dead tube
}
function prep(q, k) {
  const P = q.p, c = [0, 1, 2].map(i => (P[0][i] + P[1][i] + P[2][i] + P[3][i]) / 4);
  const u = [0, 1, 2].map(i => P[1][i] - P[0][i]), v = [0, 1, 2].map(i => P[3][i] - P[0][i]);
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n) || 1; n = n.map(x => x / l);
  q.k = k; q.c = c; q.n = n; q.ceil = Math.abs(n[1]) > .9 && c[1] > HT - .2;
}
function tagged(S, k, fn) { const n0 = S.q.length; fn(); for (let i = n0; i < S.q.length; i++) prep(S.q[i], k); }
const STATIC = (() => { const S = new TK.Scene(); for (let k = 0; k < NCOPY; k++) tagged(S, k, () => corridor(S, k)); return S; })();

// the door leaf of copy k at an angle (degrees, 0 shut, + toward the corridor), and the stencilled number over copy 0's door
function leafQuads(S, k, deg, eye) {
  const th = deg * Math.PI / 180, zo = LEN * k, hx = -OX, hz = LEN + zo;
  const dx = Math.cos(th), dz = -Math.sin(th), nx = Math.sin(th), nz = Math.cos(th);
  const P = (a, y, b) => [hx + dx * a + nx * b, y, hz + dz * a + nz * b];
  const face = (a0, a1, y0, y1, b, col, o) => S.quad([P(a0, y0, b), P(a1, y0, b), P(a1, y1, b), P(a0, y1, b)], col, o);
  const front = !eye || (eye[0] - hx) * -nx + (eye[2] - hz) * -nz > 0;                        // the camera is on the corridor side
  if (!front) { face(0, LW, 0, LH, 0, [92, 104, 98]); S.quad([P(LW, 0, -LT), P(LW, 0, 0), P(LW, LH, 0), P(LW, LH, -LT)], [64, 70, 66]); return; }
  face(0, LW, 0, LH, -LT, [112, 126, 118]);                                                  // the corridor face
  S.quad([P(LW, 0, -LT), P(LW, 0, 0), P(LW, LH, 0), P(LW, LH, -LT)], [64, 70, 66]);           // the free edge
  S.quad([P(0, LH, -LT), P(LW, LH, -LT), P(LW, LH, 0), P(0, LH, 0)], [80, 88, 84]);
  // the push bar (a fire door's: push to go out), its end boxes, the sign
  face(.1, .2, .9, 1.1, -LT - .07, [70, 72, 74]); face(.8, .9, .9, 1.1, -LT - .07, [70, 72, 74]);
  face(.12, .88, .95, 1.04, -LT - .065, [168, 168, 164]);
  S.quad([P(.12, 1.04, -LT - .065), P(.88, 1.04, -LT - .065), P(.88, 1.04, -LT), P(.12, 1.04, -LT)], [190, 190, 186]);
  face(.2, .78, 1.5, 1.66, -LT - .003, [228, 224, 212], { text: 'FIRE DOOR', textCol: [176, 32, 28] });
  face(.2, .78, 1.33, 1.49, -LT - .003, [228, 224, 212], { text: 'KEEP CLOSED', textCol: [176, 32, 28] });
}
function doorDeg(t) {
  if (t < TL.FEED_OPEN[0]) return 20;
  if (t < TL.FEED_OPEN[1]) return 20 + 20 * ease(kOf(M.stutter(t, FPS_CCTV, 3), TL.FEED_OPEN));
  if (t < TL.PULL[0]) return 40;
  if (t < TL.PULL[1]) return 40 + 56 * ease(kOf(t, TL.PULL));
  if (t < TL.SLAM - .25) return 96;
  if (t < TL.SLAM) return 96 * (1 - Math.pow((t - TL.SLAM + .25) / .25, 2));
  if (t < TL.REOPEN[0]) return 0;
  return 24 * ease(kOf(M.stutter(t, FPS_CCTV, 5), TL.REOPEN));
}
let LEAF_NOW = [0, 0, 0];
function scene(t, eye) {
  const S = new TK.Scene(); S.q = STATIC.q.slice();
  LEAF_NOW = [0, 1, 2].map(k => doorDeg(t - LAG * k));
  for (let k = 0; k < NCOPY; k++) tagged(S, k, () => leafQuads(S, k, LEAF_NOW[k], eye && [eye[0], eye[1], eye[2] - LEN * k]));
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur, ez = LEN - .004;
  tagged(S, 0, () => S.quad([[.7, 1.92, ez], [1.06, 1.92, ez], [1.06, 2.3, ez], [.7, 2.3, ez]], [178, 180, 168], { text: egg ? '5' : '14', textCol: [24, 24, 26] }));
  return S;
}
// ---------------------------------------------------------------- light, baked per quad: the tube and the EXIT sign of each copy
// (each lights only its own copy), plus an ambient level (the camcorder's is low; CAM 14's gain is higher). Lt = { amb, tube[k], exit }
function qLight(q, Lt) {
  const c = q.c, n = q.n, k = q.k;
  let w = Lt.amb, r = 0;
  const s = Lt.tube[k];
  if (s > 0) {
    const v = [-c[0], 2.56 - c[1], TUBE_Z + LEN * k - c[2]], d = Math.hypot(...v), cs = Math.abs(n[0] * v[0] + n[1] * v[1] + n[2] * v[2]) / d;
    w += s * 1.3 * (q.ceil ? .28 : .2 + .8 * cs) / (1 + Math.pow(d / 2.4, 2));
  }
  if (Lt.exit > 0) {
    const v = [-c[0], 2.3 - c[1], LEN * (k + 1) - .16 - c[2]], d = Math.hypot(...v), cs = Math.abs(n[0] * v[0] + n[1] * v[1] + n[2] * v[2]) / d;
    r += Lt.exit * .7 * (.3 + .7 * cs) / (1 + Math.pow(d / .75, 2));
  }
  return [w + r, w + r * .28, w * 1.04 + r * .24];
}
function lit(S, Lt) {
  const out = new TK.Scene(), m = (c, f) => [c[0] * f[0], c[1] * f[1], c[2] * f[2]];
  out.q = S.q.map(q => { const f = qLight(q, Lt); return Object.assign({}, q, { col: m(q.col, f), textCol: q.textCol && m(q.textCol, f) }); });
  return out;
}
// how lit a figure standing at p in copy k is (figures are drawn after the light, with this factor)
function figLight(p, k, Lt, extra = 0) {
  const s = Lt.tube[k], d = Math.hypot(p[0], p[1] - 2.56, p[2] - TUBE_Z - LEN * k), de = Math.hypot(p[0], p[1] - 2.3, p[2] - LEN * (k + 1));
  return clamp(Lt.amb + s * 1.3 * .55 / (1 + Math.pow(d / 2.4, 2)) + Lt.exit * .25 / (1 + Math.pow(de / 1.2, 2)) + extra, .05, 1.15);
}

// ---------------------------------------------------------------- Leon's body: where he is, where he looks, his right arm
// (the flashlight in that hand). The man beyond the door is body(t - LAG) in copy 1.
function body(t) {
  const w = kOf(t, TL.WALK), wk = w < .12 ? w * w / .24 : w > .88 ? .88 - (1 - w) * (1 - w) / .24 : w - .06;   // eases in and out of the walk
  let z = lerp(2.0, 5.75, wk / .88), x = lerp(0, .12, w), yaw = 0, pitch = -.04;
  pitch += .3 * Math.sin(Math.PI * kOf(t, [10.55, 11.55]));                                   // he looks up at the tube as he passes under it
  yaw += .08 * Math.sin(Math.PI * kOf(t, [12.2, 13.3]));
  const reach = ease(kOf(t, TL.REACH)) * (1 - ease(kOf(t, TL.ARM_DOWN))), pull = ease(kOf(t, TL.PULL));
  z += .45 * ease(kOf(t, [TL.REACH[0] - .1, TL.REACH[0] + .5])) - .35 * pull;
  yaw += .14 * ease(kOf(t, TL.REACH)) * (1 - pull) - .05 * Math.sin(Math.PI * pull);
  pitch -= .16 * reach;
  const sweep = -.4 * Math.sin(Math.PI * ease(kOf(t, TL.SWEEP)));
  z -= .7 * ease(kOf(t, TL.BACK));
  z = lerp(z, 2.2, kOf(t, TL.BACKOUT));                                                         // CAM 14: on down the corridor, backwards
  return { x, z, yaw, pitch, reach, pull, sweep, torchIn: t < TL.HIT, walking: (t > TL.WALK[0] + .1 && t < TL.WALK[1] - .1) || inR(t, TL.BACK) || inR(t, TL.BACKOUT) };
}
// the dropped flashlight on the floor: where it lies, which way its beam points (it spins, slows, stops)
function floorTorch(t) {
  const b = body(TL.HIT), p = [b.x + .25, 0, b.z + .45];
  const u = kOf(t, TL.SPIN), yaw = .4 - (2 * Math.PI + .9) * (1 - Math.pow(1 - u, 2.4));
  const a = t < TL.DROP + .05 ? 1 : 1 - .25 * Math.max(0, Math.sin(t * 3.1)) * (t < TL.SPIN[1] ? 1 : 0);
  return { p, yaw, a };
}
function handheld(t, t0, rate, walking, nerve) {
  const ph = (t - t0) * rate, step = walking ? Math.abs(Math.sin(ph * Math.PI)) : 0;
  const n = k => Math.sin(t * 1.3 * k + k) * .6 + Math.sin(t * 2.9 * k + 2 * k) * .3 + Math.sin(t * 7.1 * k) * .1;
  const amp = .012 + .02 * nerve;
  return { y: step * .03 + n(1.1) * amp * .5, yaw: n(.9) * amp * .8 + (walking ? Math.sin(ph * Math.PI * .5) * .015 : 0), pitch: n(1.7) * amp * .5, roll: n(.7) * amp * .6 + (walking ? Math.sin(ph * Math.PI) * .008 : 0) };
}
const EYE = 1.55;
// BROKEN, at his left shoulder and a little ahead (in copy 1 beside the man beyond the door, just beyond him)
const BROKEN_REL = [-.22, .3];
const hasBroken = t => t >= TL.PULL[0] + .3 && t < TL.HIT + .05;
function nerveAt(t) {
  if (t < TL.PULL[1]) return .25;
  if (t < TL.ZOOM[0]) return .45;
  if (t < TL.EYES) return .4;
  if (t < TL.DIE) return .9;
  if (t < TL.WHIP[0]) return .15;                                                              // he holds his breath, still
  return 1;
}
function poseCorr(t) {
  const b = body(t), nerve = nerveAt(t), h = handheld(t, TL.WALK[0] + .25, 1.7, b.walking, nerve);
  let yaw = b.yaw, pitch = b.pitch, fov = 58, roll = 0;
  // the zoom onto the man beyond the door (aimed between him and what stands at his shoulder)
  const zk = ease(kOf(t, TL.ZOOM)) * (1 - ease(kOf(t, TL.ZOOM_OUT)));
  if (zk > 0) {
    const tx = b.x + BROKEN_REL[0] * .45, tz = b.z + LEN - .06;
    yaw = lerp(yaw, Math.atan2(tx - b.x, tz - b.z), zk); pitch = lerp(pitch, Math.atan2(1.52 - EYE, tz - b.z), zk); fov = lerp(58, 22, zk);
  }
  if (t >= TL.ZOOM_OUT[1]) fov = lerp(58, 52, kOf(t, [TL.ZOOM_OUT[1], TL.WHIP[0]]));
  // the turn to his left, it, the hit, the camcorder swinging down, raised again to the doorway
  if (t >= TL.WHIP[0]) {
    const target = Math.atan2(BROKEN_REL[0], BROKEN_REL[1] + .02);                          // about -0.6 rad
    yaw = lerp(0, target, ease(kOf(t, TL.WHIP))); pitch = lerp(-.04, .16, ease(kOf(t, TL.WHIP))); fov = 52;
    if (t >= TL.HIT) {
      const k1 = ease(kOf(t, [TL.HIT + .03, TL.HIT + .5]));
      yaw = lerp(target + .12, .38, k1); pitch = lerp(.16, -1.0, k1); roll = lerp(.5, .18, k1) * (t < TL.HIT + .03 ? 0 : 1);
      if (t < TL.HIT + .05) { yaw += .1; pitch -= .05; roll += .1; }
      const k2 = ease(kOf(t, [25.2, 25.9]));
      yaw = lerp(yaw, -.08, k2); pitch = lerp(pitch, -.3, k2); roll = lerp(roll, 0, k2);
    }
  }
  const s = .5 + .5 * fov / 58;
  return { cam: { x: b.x, y: EYE - h.y, z: b.z, yaw: yaw + h.yaw * s, pitch: pitch + h.pitch * s, fov }, h, roll: h.roll + roll, b };
}

// ---------------------------------------------------------------- flashlights: the scene's albedo times a beam map, added on top
function pool(g, cam, c, ax, ay, a, rgb = '255,255,255') {
  const p0 = project(cam, c), pu = project(cam, add3(c, ax)), pv = project(cam, add3(c, ay));
  if (!p0 || !pu || !pv || a <= 0) return;
  g.save(); g.setTransform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.45, `rgba(${rgb},${a * .5})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}
// the door opening of copy j as a screen polygon (null if it is behind the camera)
function openPoly(cam, j) {
  const z = LEN * (j + 1), P = [[-OX, 0, z], [OX, 0, z], [OX, OH, z], [-OX, OH, z]].map(p => project(cam, p));
  return P.some(p => !p) ? null : P;
}
// clip to what can be seen of copy k: through the openings of copies 0 .. k-1
function leafPoly(cam, j) {
  const th = LEAF_NOW[j] * Math.PI / 180, hz = LEN * (j + 1), fx = -OX + Math.cos(th) * LW, fz = hz - Math.sin(th) * LW;
  const P = [[-OX, 0, hz], [fx, 0, fz], [fx, LH, fz], [-OX, LH, hz]].map(p => project(cam, p));
  return P.some(p => !p) ? null : P;
}
const pathOf = (g, P) => P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
function clipCopy(g, cam, k) {
  for (let j = 0; j < k; j++) {
    const P = openPoly(cam, j); if (!P) return false;
    g.beginPath(); pathOf(g, P); g.closePath(); g.clip();
    const Q = LEAF_NOW[j] > .5 ? leafPoly(cam, j) : null;
    if (Q) { g.beginPath(); pathOf(g, P); g.closePath(); pathOf(g, Q); g.closePath(); g.clip('evenodd'); }
  }
  return true;
}
function tubeA(t) {
  if (t >= TL.DIE) return t < TL.DIE + .05 ? 1.5 : 0;                                        // one bright pop, then dead
  const f = Math.floor(t * 12), R = TK.rng(f * 37 + 5)();
  const rate = t < 8.6 ? .05 : t < TL.EYES ? .09 : lerp(.12, .6, kOf(t, [TL.EYES, TL.DIE]));
  return R < .12 * rate ? .08 : R < .26 * rate ? .5 : 1;
}
function beamPools(g, cam, o, d, a, tint = '255,232,190') {
  const hit = castBeam(o, d, 9), dist = Math.hypot(hit[0] - o[0], hit[1] - o[1], hit[2] - o[2]);
  const r = .3 + dist * .2, k = a * 1.2 / (1 + Math.pow(dist / 3.2, 2));
  const n = Math.abs(hit[1]) < .01 ? [0, 1, 0] : Math.abs(Math.abs(hit[0]) - HW) < .01 ? [1, 0, 0] : [0, 0, 1];
  const ax = n[0] ? [0, 0, r] : [r, 0, 0], ay = n[1] ? [0, 0, r * 1.6] : [0, r, 0];
  pool(g, cam, hit, ax, ay, k, tint);
  const near = add3(o, mul3(d, 1.4)); near[1] = 0;
  pool(g, cam, near, [.5, 0, 0], [0, 0, .9], .25 * a, tint);
}
// the first surface a beam meets (copies beyond open doors included; a man standing in copy 1 or 2 stops it)
function castBeam(o, d, t) {
  let p = o.slice(), k = Math.floor(o[2] / LEN);
  for (let pass = 0; pass < 3; pass++) {
    let best = 1e9;
    const T = v => { if (v > 1e-4 && v < best) best = v; };
    if (d[1] < 0) T(-p[1] / d[1]); if (d[1] > 0) T((HT - p[1]) / d[1]);
    if (d[0] < 0) T((-HW - p[0]) / d[0]); if (d[0] > 0) T((HW - p[0]) / d[0]);
    for (const j of [1, 2]) {                                                                 // the men beyond
      const bj = body(t - LAG * j), zd = bj.z + LEN * j;
      if (t - LAG * j < 8.6 || d[2] <= 0) continue;
      const v = (zd - .12 - p[2]) / d[2], q = add3(p, mul3(d, v));
      if (v > 0 && Math.abs(q[0] - bj.x) < .23 && q[1] < 1.75 && q[1] > .1) T(v);
    }
    const tz = d[2] > 0 ? (LEN * (k + 1) - p[2]) / d[2] : 1e9;
    if (tz < best) {
      const q = add3(p, mul3(d, tz));
      if (Math.abs(q[0]) < OX && q[1] < OH && doorDeg(t - LAG * k) > 60 && k < NCOPY - 1) { p = q; p[2] += 1e-3; k++; continue; }
      best = tz;
    }
    return add3(p, mul3(d, best));
  }
  return p;
}
function floorPools(g, cam, ft) {
  const { p, yaw, a } = ft, d = [Math.sin(yaw), 0, Math.cos(yaw)];
  pool(g, cam, add3(p, mul3(d, .9)), mul3(d, 1.0), [d[2] * .5, 0, -d[0] * .5], .8 * a, '255,232,190');
  const o = [p[0], .08, p[2]], hit = castBeam(o, [d[0], .03, d[2]], 30), dist = Math.hypot(hit[0] - o[0], hit[2] - o[2]);
  const side = Math.abs(Math.abs(hit[0]) - HW) < .01;
  pool(g, cam, [hit[0], .6, hit[2]], side ? [0, 0, .6 + dist * .2] : [.6 + dist * .2, 0, 0], [0, .75 + dist * .1, 0], a * 1.5 / (1 + Math.pow(dist / 2.6, 2)), '255,232,190');
}
// T: hand ({x, y, r, a}: his flashlight in his hand, screen space), spill, beam ({o, d, a}: the flashlight of the man beyond, world),
// floor [{p, yaw, a, k}] (dropped flashlights)
function torchMap(g, cam, T) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < NCOPY; k++) {
    if (!((T.beam && k === 1) || (T.floor || []).some(f => f.k === k))) continue;
    g.save(); if (!clipCopy(g, cam, k)) { g.restore(); continue; }
    if (T.beam && k === 1) beamPools(g, cam, T.beam.o, T.beam.d, T.beam.a);
    for (const ft of T.floor || []) if (ft.k === k) floorPools(g, cam, ft);
    g.restore();
  }
  if (T.hand) {
    const { x, y, r, a } = T.hand, gr = g.createRadialGradient(x, y, 4, x, y, r);
    gr.addColorStop(0, `rgba(255,236,200,${a})`); gr.addColorStop(.5, `rgba(255,232,196,${a * .55})`); gr.addColorStop(1, 'rgba(255,232,196,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (T.spill) { const sp = g.createRadialGradient(x, y, 10, x, y, 760); sp.addColorStop(0, `rgba(255,232,196,${T.spill})`); sp.addColorStop(1, 'rgba(255,232,196,0)'); g.fillStyle = sp; g.fillRect(0, 0, W, H); }
  }
  g.globalCompositeOperation = 'source-over';
}
const ALB = mk(W, H), ALG = ALB.getContext('2d'), RIM = mk(W, H), RIMG = RIM.getContext('2d');
function mkCam(c) {
  const f = .5 * W / Math.tan(c.fov * Math.PI / 360), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  return Object.assign({}, c, { f, W, H, toCam(p) { const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; } });
}
// the corridor at time t: lit per quad, then the flashlights (albedo x beam map) added
function renderCorridor(g, t, camSpec, Lt, T) {
  const S = scene(t, [camSpec.x, camSpec.y, camSpec.z]);
  const cam = TK.render(g, lit(S, Lt), camSpec, { ambient: 1, fog: .02, bg: [4, 4, 5] });
  if (T && (T.hand || T.beam || (T.floor && T.floor.length))) {
    TK.render(ALG, S, camSpec, { ambient: 1, fog: .02, bg: [0, 0, 0] });
    torchMap(LG, cam, T);
    ALG.save(); ALG.globalCompositeOperation = 'multiply'; ALG.drawImage(LMAP, 0, 0); ALG.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(ALB, 0, 0); g.restore();
  }
  return cam;
}
// the lights themselves (after the light): the tubes, the EXIT signs, a flashlight's lens on the floor
function emitters(g, cam, L, floor = []) {
  for (let k = 0; k < NCOPY; k++) {
    g.save(); if (!clipCopy(g, cam, k)) { g.restore(); continue; }
    const zo = LEN * k, s = L.tube[k];
    const a = project(cam, [-.07, 2.597, TUBE_Z + .58 + zo]), b = project(cam, [.07, 2.597, TUBE_Z + .58 + zo]), c = project(cam, [-.07, 2.597, TUBE_Z - .58 + zo]);
    onQuad(g, a, b, c, 20, 200, q => {
      if (s > .02) { q.shadowColor = `rgba(225,240,255,${Math.min(1, s)})`; q.shadowBlur = 40 * Math.min(1, s); const v = Math.min(255, 150 + 105 * s) | 0; q.fillStyle = `rgb(${v},${Math.min(255, v + 4)},${Math.min(255, v + 10)})`; }
      else q.fillStyle = 'rgb(66,68,70)';
      q.fillRect(0, 0, 20, 200);
    });
    const ez = LEN + zo - .102, e = L.exit;
    const p = project(cam, [-.2, 2.42, ez]), r = project(cam, [.2, 2.42, ez]), u = project(cam, [-.2, 2.26, ez]);
    onQuad(g, p, r, u, 200, 80, q => {
      q.fillStyle = `rgb(${40 + 20 * e | 0},${16},${14})`; q.fillRect(0, 0, 200, 80);
      q.font = '64px "Special Elite"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.shadowColor = `rgba(255,60,40,${e})`; q.shadowBlur = 24 * e;
      q.fillStyle = `rgb(${120 + 135 * e | 0},${40 + 30 * e | 0},${36 + 20 * e | 0})`; q.fillText('EXIT', 100, 44);
    });
    for (const ft of floor) if (ft.k === k) {
      const d = [Math.sin(ft.yaw), 0, Math.cos(ft.yaw)], lp = project(cam, add3(ft.p, [d[0] * .12, .045, d[2] * .12]));
      if (lp) { const rr = Math.max(3, 70 / lp[2]); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(lp[0], lp[1], 1, lp[0], lp[1], rr); gr.addColorStop(0, `rgba(255,246,220,${ft.a})`); gr.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = gr; g.fillRect(lp[0] - rr, lp[1] - rr, 2 * rr, 2 * rr); g.restore(); }
    }
    g.restore();
  }
}
function lightsAt(t, amb) { return { amb, tube: [0, 1, 2].map(k => tubeA(t - LAG * k)), exit: 1 }; }

// ---------------------------------------------------------------- Leon from behind (the man beyond the door; CAM 14 in playback):
// the camcorder up at his left eye, the flashlight in his right hand; reach 0..1 lifts that arm to the door's edge
function leonBack(g, cam, x, z, k, o = {}) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 1.8, z]); if (!feet || !head) return null;
  const u = (feet[1] - head[1]) / 1.8, C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`;
  g.save(); g.translate(feet[0], feet[1]); g.scale(u, u);
  ell(g, 0, 0, .3, .06, 'rgba(0,0,0,.3)');
  const st = o.step || 0;
  poly(g, [[-.19, -.94], [-.02, -.94], [-.04 - st * .03, -.02], [-.17 - st * .03, -.02]], C(TROUS)); poly(g, [[.02, -.94], [.19, -.94], [.17 + st * .03, -.02], [.04 + st * .03, -.02]], C(TROUS, .9));
  poly(g, [[-.22, -.97], [.22, -.97], [.22, -.9], [-.22, -.9]], 'rgb(18,18,20)');
  poly(g, [[-.25, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT));
  poly(g, [[-.25, -1.47], [-.02, -1.47], [-.02, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT, .9));
  g.strokeStyle = C(SHIRT, .7); g.lineWidth = .008; g.beginPath(); g.moveTo(0, -1.45); g.lineTo(0, -.97); g.moveTo(-.2, -1.38); g.quadraticCurveTo(0, -1.33, .2, -1.38); g.stroke();
  // left arm: the elbow out, the forearm up to the camcorder at his left eye (or down, if o.camDown)
  if (!o.camDown) {
    poly(g, [[-.22, -1.45], [-.29, -1.48], [-.46, -1.38], [-.43, -1.31], [-.29, -1.38]], C(SHIRT, .92));
    poly(g, [[-.46, -1.38], [-.42, -1.31], [-.19, -1.6], [-.15, -1.66], [-.2, -1.69]], C(SHIRT, .86));
    g.fillStyle = C([22, 22, 24]); g.fillRect(-.26, -1.76, .2, .13); g.fillStyle = C([40, 40, 44]); g.fillRect(-.08, -1.73, .06, .07);
    ell(g, -.2, -1.66, .035, .03, C(SKIN, .85));
  } else {
    poly(g, [[-.25, -1.46], [-.32, -1.38], [-.31, -1.0], [-.25, -.98], [-.22, -1.3]], C(SHIRT, .9));
    ell(g, -.29, -.96, .035, .03, C(SKIN, .8)); g.fillStyle = C([22, 22, 24]); g.fillRect(-.36, -.94, .14, .1);
  }
  // right arm: the flashlight forward (from behind its tail end shows), or up to the door's edge
  const r = o.reach || 0, hand = [lerp(.3, .44, r), lerp(-1.04, -1.4, r)], elbow = [lerp(.33, .43, r), lerp(-1.18, -1.33, r)];
  g.lineCap = 'round'; g.strokeStyle = C(SHIRT, .88); g.lineWidth = .1;
  g.beginPath(); g.moveTo(.21, -1.42); g.lineTo(elbow[0], elbow[1]); g.stroke();
  g.lineWidth = .075; g.beginPath(); g.moveTo(elbow[0], elbow[1]); g.lineTo(hand[0], hand[1]); g.stroke();
  ell(g, hand[0], hand[1], .04, .036, C(SKIN, .8));
  if (o.torch !== false) ell(g, hand[0] + .005, hand[1] - .005, .028, .028, C([30, 30, 34]));
  poly(g, [[-.05, -1.58], [.05, -1.58], [.058, -1.47], [-.058, -1.47]], C(SKIN, .7));
  ell(g, -.1, -1.655, .02, .034, C(SKIN, .85)); ell(g, .1, -1.655, .02, .034, C(SKIN, .85));
  ell(g, 0, -1.665, .1, .1, C([24, 20, 18]));
  poly(g, [[-.07, -1.59], [.07, -1.59], [.05, -1.565], [-.05, -1.565]], C([24, 20, 18]));
  g.beginPath(); g.moveTo(-.118, -1.69); g.bezierCurveTo(-.122, -1.86, .122, -1.86, .118, -1.69); g.closePath(); g.fillStyle = C(CAP); g.fill();
  g.beginPath(); g.moveTo(-.05, -1.69); g.quadraticCurveTo(0, -1.75, .05, -1.69); g.closePath(); g.fillStyle = C([24, 20, 18]); g.fill();
  g.fillStyle = C([70, 72, 80]); g.fillRect(-.055, -1.695, .11, .012);
  g.restore();
  if (u > 60) {
    const p = [feet[0], feet[1] - 1.33 * u];
    g.save(); g.font = `${Math.round(.068 * u)}px "Special Elite"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C([30, 34, 52]); g.fillText('SECURITY', p[0], p[1]); g.restore();
  }
  return { feet, u };
}
// the man beyond the door: Leon half a second ago, in copy 1
function manBeyond(t, k = 1) {
  const tb = t - LAG * k; if (tb < 8.6) return null;
  const b = body(tb);
  return { x: b.x, z: b.z + LEN * k, b, tb };
}
// BROKEN in copy 1, at the shoulder of the man there (a little beyond him and to his right as we see him): drawn into GH;
// before the eyes open it is only a dark shape (its eyes blacked out)
function brokenSprite(cam, m, eyesA) {
  GHG.setTransform(1, 0, 0, 1, 0, 0); GHG.clearRect(0, 0, W, H);
  TK.ghost(GHG, cam, 'broken', m.x + BROKEN_REL[0], m.z + BROKEN_REL[1], { light: 1, bend: .06, tilt: .05, armR: 0, seed: 8 });
  if (eyesA < 1) { GHG.save(); GHG.globalCompositeOperation = 'source-atop'; GHG.globalAlpha = 1 - eyesA; GHG.fillStyle = 'rgb(5,5,6)'; GHG.fillRect(0, 0, W, H); GHG.restore(); }
}
// the men beyond the door (copies 2 and 1, through the openings), drawn after the light; BROKEN behind the man in copy 1
function figures(g, cam, t, Lt, o = {}) {
  for (const k of [2, 1]) {
    const m = manBeyond(t, k); if (!m) continue;
    if (o.until != null && m.tb >= o.until) continue;
    g.save(); if (!clipCopy(g, cam, k)) { g.restore(); continue; }
    if (k === 1 && o.broken && hasBroken(m.tb)) {
      brokenSprite(cam, m, clamp((t - TL.EYES) / .07));
      g.globalAlpha = lerp(.42, 1, ease(kOf(t, [TL.ZOOM[0] + .3, TL.ZOOM[1]]))); g.drawImage(GH, 0, 0); g.globalAlpha = 1;
    }
    const st = m.b.walking ? Math.sin((m.tb - TL.WALK[0] - .25) * 1.7 * Math.PI) : 0;
    leonBack(g, cam, m.x, m.z, figLight([m.x, 1.2, m.z], k, Lt, k === 1 ? o.lit1 || 0 : 0), { reach: m.b.reach, torch: m.b.torchIn, step: st });
    g.restore();
  }
}

// ---------------------------------------------------------------- CAM 14 (black and white, 6 fps): monitor 14 in the office,
// and the archive's playback after the scare
function stampAt(t) { const [h0, m0, s0] = t < 8.6 ? TL.STAMP0 : TL.STAMP1, s = h0 * 3600 + m0 * 60 + s0 + Math.floor(t < 8.6 ? t : t - 8.6), p = n => String(n).padStart(2, '0'); return `${TL.DATE}  ${p(Math.floor(s / 3600) % 24)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`; }
function gapEyes(g, cam, a) {
  // two white points in the dark gap of the door, one over the other (its head lies on its side)
  const p = project(cam, [.45, 1.72, 8.35]); if (!p || a <= 0) return;
  const s = cam.f / p[2] * .026;
  g.save(); g.filter = `blur(${Math.max(.6, s * .2).toFixed(1)}px)`; g.fillStyle = `rgba(255,255,255,${.95 * a})`;
  g.beginPath(); g.ellipse(p[0] - s * .5, p[1] - s * 1.6, s * .9, s * .75, 0, 0, 6.2832); g.ellipse(p[0] + s * .4, p[1] + s * 1.5, s * .8, s * .7, 0, 0, 6.2832); g.fill();
  g.filter = `blur(${Math.max(1.5, s).toFixed(1)}px)`; g.fillStyle = `rgba(255,255,255,${.3 * a})`; g.beginPath(); g.ellipse(p[0], p[1], s * 2, s * 3.6, 0, 0, 6.2832); g.fill();
  g.restore();
}
function cctvView(g, tq, o = {}) {
  const inPlay = tq >= TL.SHOTS[2][1], Lt = lightsAt(tq, inPlay ? .4 : .2), T = { floor: [] };
  if (tq >= TL.DROP) { T.floor.push(Object.assign({ k: 0 }, floorTorch(tq))); if (tq - LAG >= TL.DROP) { const f = floorTorch(tq - LAG); f.p = add3(f.p, [0, 0, LEN]); f.k = 1; T.floor.push(f); } }
  const cam = renderCorridor(g, tq, CAM14, Lt, T);
  emitters(g, cam, Lt, T.floor);
  if (inPlay) {
    figures(g, cam, tq, Lt, { until: TL.SLAM - LAG });
    const b = body(tq), st = b.walking ? Math.sin((tq - TL.BACKOUT[0]) * 1.7 * Math.PI) : 0;
    leonBack(g, cam, b.x, b.z, figLight([b.x, 1.2, b.z], 0, Lt, .08), { torch: false, step: st });
  }
  if (o.feed && inR(tq, TL.EYES0)) gapEyes(g, cam, 1 - kOf(tq, [TL.EYES0[1] - .35, TL.EYES0[1]]));
  if (inPlay && tq >= TL.EYES2) gapEyes(g, cam, tq < TL.EYES2 + 1 / FPS_CCTV ? .5 : 1);
  return cam;
}
let FEED_T = -1, DOOR_ON_FEED = null;
function feedAt(t) {
  const tq = qf(t);
  if (tq === FEED_T) return;
  FEED_T = tq;
  cctvView(FDG, tq, { feed: true });
  TK.grade(FWG, FEED, tq, 'cctv');
  TK.vhs(FWG, tq, .8, 4);
  TK.osd(FWG, 'cctv', tq, { cam: 'CAM 14', place: 'SERVICE CORRIDOR', stamp: stampAt(tq) });
}

// ---------------------------------------------------------------- S1: the office, monitor 14 (camcorder pointed at the screen)
const MON = { x: 168, y: 46, w: 744, h: 600, sx: 222, sy: 92, sw: 636, sh: 477 };
let SIDE_FEEDS = null;
function buildSideFeeds() {
  SIDE_FEEDS = [];
  for (const [seed, cam, name] of [[2, { x: 3.6, y: 4.2, z: .4, yaw: -.1, pitch: -.36, fov: 80 }, 'CAM 13  LOADING DOCK'], [5, { x: -3.2, y: 4.0, z: 2, yaw: .25, pitch: -.4, fov: 70 }, 'CAM 15  EAST HALL']]) {
    const S = TK.concourse({ storeSeed: seed, lightsOn: z => ((z + seed * 4) % 12 === 3 ? .7 : 0) });
    TK.render(TG, S, cam, { ambient: 1.1, fog: .05 });
    const c = mk(W, H); TK.grade(c.getContext('2d'), TMP, seed, 'cctv');
    const cg = c.getContext('2d'); TK.osd(cg, 'cctv', 1, { cam: name.slice(0, 6), place: name.slice(8), stamp: '12-03-1999  02:14:06' });
    SIDE_FEEDS.push(c);
  }
}
function monitor(g, x, y, w, h, img, label, glow, t, scan = true) {
  const sx = x + w * .072, sy = y + h * .077, sw = w * .855, sh = h * .795;
  g.fillStyle = 'rgb(150,144,128)'; g.beginPath(); g.roundRect(x, y, w, h, 22); g.fill();
  g.fillStyle = 'rgb(124,118,104)'; g.fillRect(x + 10, y + h - 38, w - 20, 28);
  g.fillStyle = 'rgb(10,10,10)'; g.beginPath(); g.roundRect(sx - 6, sy - 6, sw + 12, sh + 12, 30); g.fill();
  g.save(); g.beginPath(); g.roundRect(sx, sy, sw, sh, 26); g.clip();
  g.globalAlpha = glow; g.drawImage(img, sx, sy, sw, sh); g.globalAlpha = 1;
  if (scan) { g.fillStyle = 'rgba(0,0,0,.2)'; for (let yy = sy + ((t * 37) % 4); yy < sy + sh; yy += 3.5) g.fillRect(sx, yy, sw, 1.4); }
  const vg = g.createRadialGradient(sx + sw / 2, sy + sh / 2, sh * .3, sx + sw / 2, sy + sh / 2, sw * .66); vg.addColorStop(0, 'rgba(255,255,255,.04)'); vg.addColorStop(1, 'rgba(0,0,0,.28)');
  g.fillStyle = vg; g.fillRect(sx, sy, sw, sh);
  const hl = g.createLinearGradient(sx, sy, sx + sw * .5, sy + sh * .6); hl.addColorStop(0, 'rgba(255,255,255,.07)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(sx, sy, sw, sh);
  g.restore();
  // the label strip under the screen
  g.fillStyle = 'rgb(20,20,22)'; g.fillRect(x + w / 2 - 34, y + h - 34, 68, 22);
  g.font = '20px "VT323"'; g.fillStyle = 'rgb(230,230,224)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x + w / 2, y + h - 22);
  return [sx, sy, sw, sh];
}
function office(g, t) {
  feedAt(t);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = 'rgb(16,15,14)'; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgb(26,25,23)'; g.fillRect(-400, 20, W + 800, 680);
  const flick = .93 + .07 * Math.sin(t * 61) * Math.sin(t * 13);
  monitor(g, -560, 70, 680, 550, SIDE_FEEDS[0], '13', .8, t);
  monitor(g, 960, 70, 680, 550, SIDE_FEEDS[1], '15', .8, t);
  monitor(g, MON.x, MON.y, MON.w, MON.h, FEEDW, '14', flick, t);
  // the desk: the night log open, a pen, his flashlight (until he takes it)
  g.fillStyle = 'rgb(54,42,32)'; g.fillRect(-400, 690, W + 800, 300);
  g.fillStyle = 'rgb(70,56,42)'; g.fillRect(-400, 690, W + 800, 10);
  g.save(); g.translate(250, 770); g.rotate(-.05);
  g.fillStyle = 'rgb(200,196,182)'; g.fillRect(-150, -40, 300, 120); g.fillStyle = 'rgb(160,156,144)'; g.fillRect(-2, -40, 4, 120);
  g.fillStyle = 'rgba(60,70,110,.5)'; for (let i = 0; i < 6; i++) { g.fillRect(-135, -25 + i * 14, 110 - (i % 3) * 18, 2); g.fillRect(12, -25 + i * 14, 120 - (i % 2) * 30, 2); }
  g.fillStyle = 'rgb(30,30,60)'; g.fillRect(60, 50, 90, 6);
  g.restore();
  if (t < TL.GRAB + .3) { g.save(); g.translate(740, 760); g.rotate(.18); g.fillStyle = 'rgb(20,20,22)'; g.fillRect(-120, -18, 190, 36); g.fillStyle = 'rgb(56,56,60)'; g.fillRect(70, -24, 26, 48); g.fillStyle = 'rgb(210,200,170)'; g.fillRect(94, -18, 4, 36); g.restore(); }
  // the screens light the room: a cold glow, brightest on the desk under monitor 14
  g.save(); g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(540, 420, 80, 540, 420, 720); gl.addColorStop(0, `rgba(130,140,150,${.12 * flick})`); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(-400, -400, W + 800, H + 800);
  g.restore();
}
function shotOffice(g, t) {
  const k = ease(kOf(t, TL.PUSH_IN)), h = handheld(t, 0, 0, false, .15 + (t > 5.3 ? .25 : 0));
  // the push-in centres on the door as it shows on monitor 14
  const d = DOOR_ON_FEED, fx = MON.sx + d[0] / W * MON.sw, fy = MON.sy + d[1] / H * MON.sh;
  const Z = 1.14 + .46 * k, stand = ease(kOf(t, [TL.GRAB + .45, TL.GRAB + 1.3]));
  const cx = lerp(540, fx, k * .85), cy = lerp(405, fy, k * .85) + stand * 140;
  TG.setTransform(1, 0, 0, 1, 0, 0); office(TG, t);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.translate(540 - h.yaw * 900, 405 + h.pitch * 900 - h.y * 300); g.scale(Z, Z); g.translate(-cx, -cy); g.drawImage(TMP, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
  FGG.clearRect(0, 0, W, H);                                                                   // (he takes the flashlight off the desk below the frame, and stands)
  const blur = 2.2 * Math.exp(-t / .2) + (t > 3.0 && t < 3.8 ? 2.6 * Math.sin((t - 3.0) / .8 * Math.PI) : 0) + (stand > 0 && stand < 1 ? 3 * Math.sin(stand * Math.PI) : 0);
  return { roll: h.roll, bgBlur: blur, fgBlur: 1.5 };
}

// ---------------------------------------------------------------- his arm and the flashlight (camcorder, screen space)
// the sleeve from off the bottom right corner to the hand at (hx, hy); the flashlight in the hand points along ang
function armTorch(g, hx, hy, ang, light, holding = true) {
  const k = .45 + .55 * light, sl = `rgb(${72 * k | 0},${84 * k | 0},${108 * k | 0})`, sl2 = `rgb(${88 * k | 0},${100 * k | 0},${126 * k | 0})`;
  const sh = [1260, 1060], el = [lerp(sh[0], hx, .55) + 70, lerp(sh[1], hy, .55) + 40];
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = sl; g.lineWidth = 150; g.beginPath(); g.moveTo(sh[0], sh[1]); g.lineTo(el[0], el[1]); g.stroke();
  g.lineWidth = 104; g.beginPath(); g.moveTo(el[0], el[1]); g.lineTo(hx + 30, hy + 30); g.stroke();
  g.strokeStyle = sl2; g.lineWidth = 16; g.beginPath(); g.moveTo(el[0] - 30, el[1] - 40); g.lineTo(hx + 4, hy + 2); g.stroke();
  g.restore();
  const a = Math.atan2(hy - el[1], hx - el[0]);
  g.save(); g.translate(hx, hy); g.rotate(a);
  g.fillStyle = `rgb(${62 * k | 0},${72 * k | 0},${94 * k | 0})`; g.fillRect(-58, -50, 20, 100);                    // cuff
  ell(g, 0, 0, 52, 40, `rgb(${176 * k | 0},${136 * k | 0},${110 * k | 0})`);                                       // the back of the hand
  g.restore();
  if (holding) {
    g.save(); g.translate(hx, hy); g.rotate(ang);
    g.fillStyle = 'rgb(18,18,20)'; g.fillRect(-40, -17, 150, 34); g.fillStyle = 'rgb(54,54,58)'; g.fillRect(100, -22, 28, 44);
    g.fillStyle = `rgb(${190 * k | 0},${150 * k | 0},${122 * k | 0})`; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-6 + i * 22, 18, 13, 10, 0, 0, 6.2832); g.fill(); }   // fingers round it
    g.restore();
  }
}
// his fingers round the door's edge (the hand and the flashlight on the edge, at a screen point)
function armOnEdge(g, hx, hy, light, lean) {
  armTorch(g, hx + 26, hy + 30, -2.2 + lean, light, true);
  const k = .45 + .55 * light;
  g.save(); g.translate(hx, hy); g.rotate(-.2 + lean * .3);
  g.fillStyle = `rgb(${186 * k | 0},${146 * k | 0},${120 * k | 0})`;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-18, -30 + i * 19, 16, 9, -.3, 0, 6.2832); g.fill(); }        // four fingers hooked round the edge
  g.restore();
}

// ---------------------------------------------------------------- S2-S4: the corridor (camcorder)
function torchRay(cs, b, t) {
  const yaw = cs.yaw + b.sweep + .05, pitch = cs.pitch - .07;
  const d = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const o = [cs.x + Math.cos(cs.yaw) * .22, cs.y - .38, cs.z - Math.sin(cs.yaw) * .22 + .2];
  return { o, d };
}
function shotCorridor(g, fg, t) {
  const { cam: cs, h, roll, b } = poseCorr(t);
  fg.clearRect(0, 0, W, H);
  const whip = inR(t, TL.WHIP), scare = t >= TL.WHIP[0] && t < TL.SCARE[1], Lt = lightsAt(t, t < TL.DIE ? .06 : .085), T = { floor: [] };
  const m = manBeyond(t), cc = mkCam(cs);
  let lit1 = 0;
  // his flashlight: in his hand (a pool where its beam lands), falling, then on the floor
  if (b.torchIn) {
    const { o, d } = torchRay(cs, b, t), hit = castBeam(o, d, t), p = project(cc, hit), dist = Math.hypot(hit[0] - o[0], hit[1] - o[1], hit[2] - o[2]);
    T.hand = { x: p ? p[0] : W / 2, y: p ? p[1] : H / 2, r: cc.f * .3, a: clamp(1.3 / (1 + Math.pow(dist / 3.4, 2)), .1, 1) }; T.spill = .08;
    if (m && Math.abs(hit[2] - (m.z - .12)) < .08) lit1 = Math.min(.5, 2 * T.hand.a);
  } else if (t < TL.DROP) {
    const u = kOf(t, [TL.HIT, TL.DROP]); T.hand = { x: lerp(760, 260, u) + Math.sin(u * 9) * 160, y: lerp(260, 700, u), r: 330, a: .8 };
  } else T.floor.push(Object.assign({ k: 0 }, floorTorch(t)));
  if (m) {
    if (m.b.torchIn) { const { o, d } = torchRay(poseCorr(m.tb).cam, m.b, m.tb); T.beam = { o: add3(o, [0, 0, LEN]), d, a: 1 }; }
    else if (m.tb >= TL.DROP) { const f = floorTorch(m.tb); f.p = add3(f.p, [0, 0, LEN]); f.k = 1; T.floor.push(f); }
  }
  const cam = renderCorridor(g, t, cs, Lt, T);
  emitters(g, cam, Lt, T.floor);
  if (!scare) figures(g, cam, t, Lt, { broken: true, lit1 });
  // his arm: the flashlight at rest bottom right; at the door his hand goes to the edge and pulls
  const light = clamp(.25 + tubeA(t) * .5);
  if (b.torchIn && !scare) {
    let hx = 915 + h.yaw * -120, hy = 712 + h.y * 380;
    const vp = project(cam, add3([cs.x, cs.y, cs.z], [Math.sin(cs.yaw) * 6, -.3, Math.cos(cs.yaw) * 6])) || [540, 430];
    const ang = Math.atan2(vp[1] - hy, vp[0] - hx) + b.sweep * .8;
    if (b.reach > 0) {
      const th = doorDeg(t) * Math.PI / 180, ep = project(cam, [-OX + Math.cos(th) * LW, 1.3, LEN - Math.sin(th) * LW - LT]);
      if (ep) { const r = ease(b.reach); hx = lerp(hx, ep[0], r); hy = lerp(hy, ep[1], r); }
      if (b.reach > .6) armOnEdge(fg, hx, hy, light, -.4 * b.pull); else armTorch(fg, hx, hy, ang, light);
    } else armTorch(fg, hx, hy, ang, light);
  }
  // the scare: it is right beside him, half lit, for eleven frames
  if (t >= TL.WHIP[0] + .12 && t < TL.SCARE[1]) scareFigure(g, t);
  let bgBlur = 7 * Math.exp(-(t - TL.SHOTS[1][1]) / .22), fgBlur = 0, noise = .1 + (t >= TL.DIE ? .16 : 0), bright = 1;
  if (t > TL.ZOOM[0] && t < TL.ZOOM[1] + .5) bgBlur += 2.6 * Math.abs(Math.sin(kOf(t, [TL.ZOOM[0], TL.ZOOM[1] + .5]) * Math.PI * 2));   // the autofocus hunts as it zooms
  if (inR(t, TL.REACH) || inR(t, TL.PULL)) fgBlur = 1.2;
  if (t >= TL.HIT && t < TL.HIT + .5) bgBlur = 4 + 6 * (1 - kOf(t, [TL.HIT, TL.HIT + .5]));
  if (t >= TL.SPIN[0] && t < TL.BACK[1]) bgBlur = Math.max(bgBlur, 1.5 + 2 * Math.abs(Math.sin(t * 2.2)));
  return { roll, bgBlur, fgBlur, noise, bright, whip };
}
// BROKEN in screen space, right beside him: its body leaning in from the left, its head lying over on its side with the
// eyes near the middle; the exit sign's red catching one side of it
function scareFigure(g, t) {
  const k = ease(kOf(t, [TL.WHIP[0] + .12, TL.WHIP[1]])), hit = t >= TL.HIT, after = Math.max(0, t - TL.HIT - .02);
  const u = hit ? 760 : 680, ex = lerp(-300, 570, k) + (hit ? 25 : 0), ey = 278 - after * 3000 + (hit ? 15 : 0);
  const x = ex - .81 * u, y = ey + 1.72 * u;
  GHG.setTransform(1, 0, 0, 1, 0, 0); GHG.clearRect(0, 0, W, H);
  GHG.save(); GHG.translate(x, y); GHG.scale(u, u); TK.ghost._draw(GHG, 'broken', { u, bend: .55, tilt: -.25, armR: .1, seed: 8 }); GHG.restore();
  // the rim: the figure minus itself shifted, tinted by the exit sign
  RIMG.setTransform(1, 0, 0, 1, 0, 0); RIMG.globalCompositeOperation = 'source-over'; RIMG.clearRect(0, 0, W, H); RIMG.drawImage(GH, 0, 0);
  RIMG.globalCompositeOperation = 'destination-out'; RIMG.drawImage(GH, -16, 5);
  RIMG.globalCompositeOperation = 'source-atop'; RIMG.fillStyle = 'rgba(214,70,52,.85)'; RIMG.fillRect(0, 0, W, H);
  RIMG.save(); RIMG.globalCompositeOperation = 'destination-out'; const eg = RIMG.createRadialGradient(ex, ey, 10, ex, ey, 80); eg.addColorStop(0, 'rgba(0,0,0,1)'); eg.addColorStop(1, 'rgba(0,0,0,0)'); RIMG.fillStyle = eg; RIMG.fillRect(0, 0, W, H); RIMG.restore();
  g.drawImage(GH, 0, 0); g.drawImage(RIM, 0, 0);
}

// ---------------------------------------------------------------- S5: CAM 14 played back
let PLAY_DOOR = null;
function cctvZoom(t) {
  const k = ease(kOf(t, TL.PUSH));
  return { z: lerp(1, 2.1, k), f: [lerp(W / 2, PLAY_DOOR[0], k), lerp(H / 2, PLAY_DOOR[1], k)], k: .55 * k };
}
function zoomInto(dst, src, Z) {
  const { z, f, k } = Z;
  let tx = lerp(f[0], W / 2, k), ty = lerp(f[1], H / 2, k);
  tx = clamp(tx, W - (W - f[0]) * z, f[0] * z); ty = clamp(ty, H - (H - f[1]) * z, f[1] * z);
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.fillStyle = '#000'; dst.fillRect(0, 0, W, H);
  dst.setTransform(z, 0, 0, z, tx - f[0] * z, ty - f[1] * z); dst.drawImage(src, 0, 0); dst.setTransform(1, 0, 0, 1, 0, 0);
}
function readout(g, z) {
  g.save(); g.font = '38px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,235,.88)';
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2; g.shadowOffsetY = 2; g.fillText(`PLAYBACK  x${z.toFixed(1)}`, W / 2, 32); g.restore();
}
function shotCctv(t) {
  const tq = qf(t);
  cctvView(RG, tq);
  const Z = cctvZoom(t);
  zoomInto(WK, RAW, Z);
  TK.grade(WG, WORK, tq, 'cctv');
  const gk = glitchAt(t); TK.vhs(WG, tq, gk ? 2.5 : 1, 5);
  if (gk) { tear(WG, t, Math.sin(gk[0] * Math.PI)); TK.statics(WG, t, .4 * Math.sin(gk[0] * Math.PI)); }
  if (t < TL.ROLL[1]) trackingRoll(WG, t, kOf(t, TL.ROLL));
  TK.osd(WG, 'cctv', t, { cam: 'CAM 14', place: 'SERVICE CORRIDOR', stamp: stampAt(t) });
  readout(WG, Z.z);
}

// ---------------------------------------------------------------- tape damage, transitions, captions
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
  const lines = text.split('\n');
  lines.forEach((s, i) => { const w = g.measureText(s).width + 28; g.fillStyle = 'rgba(0,0,0,.82)'; g.fillRect(W / 2 - w / 2, 92 + i * 50, w, 48); g.fillStyle = '#f2f2f2'; g.fillText(s, W / 2, 117 + i * 50); });
  g.restore();
}
const recCut = t => TL.RECCUT.some(c => t >= c - .06 && t < c + .16);
function standby(g, t) {
  g.fillStyle = '#050506'; g.fillRect(0, 0, W, H);
  g.save(); g.font = '46px "VT323"'; g.fillStyle = 'rgba(235,240,235,.92)'; g.textBaseline = 'top'; g.fillText('STBY', 36, 30);
  g.textAlign = 'right'; g.fillText(camTime(t), W - 36, H - 128); g.fillText('DEC.03.1999', W - 36, H - 82); g.restore();
}
const camTime = t => t < TL.RECCUT[0] ? 'AM 2:14' : 'AM 2:16';
function gainNoise(g, t, a) {
  TK.statics(NZG, t * 1.37 + 3, 1);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .42; g.drawImage(NZ, 0, 0); g.restore();
}
function camcorder(s, t) {
  let r;
  if (s[0] === 'office') { r = shotOffice(RG, t); }
  else r = shotCorridor(RG, FGG, t);
  WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, W, H);
  WK.translate(540, 405); WK.rotate(r.roll || 0); WK.scale(1.05, 1.05); WK.translate(-540, -405);
  if (r.whip) {                                                                                // the spin: smeared sideways
    WK.filter = 'blur(3px)'; for (let i = 0; i < 6; i++) { WK.globalAlpha = 1 / (i + 1); WK.drawImage(RAW, i * 55, 0); } WK.globalAlpha = 1;
  } else { WK.filter = `blur(${(r.bgBlur || 0).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0); }
  WK.filter = `blur(${(r.fgBlur || 0).toFixed(2)}px)`; WK.drawImage(FG, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
  TK.grade(WG, WORK, t, 'camcorder', { brightness: (r.bright || 1) * (.97 + .05 * Math.sin(t * 1.7) + .03 * Math.sin(t * 4.3)) });
  if (r.noise) gainNoise(WG, t, r.noise);
  const gk = glitchAt(t); TK.vhs(WG, t, gk ? 2.2 : .9, 6);
  if (gk) { tear(WG, t, Math.sin(gk[0] * Math.PI)); TK.statics(WG, t, .35 * Math.sin(gk[0] * Math.PI)); }
  TK.osd(WG, 'camcorder', t, { time: camTime(t), date: 'DEC.03.1999', battery: 1 });
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const s = shotAt(t), inStatic = !s || TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) TK.statics(WG, t, 1);
  else if (recCut(t)) standby(WG, t);
  else if (s[0] === 'cctv') shotCctv(t);
  else camcorder(s, t);
  if (!inStatic && !recCut(t)) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) (v.pos === 'top' ? capTop : TK.caption)(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: clamp((t - .8) / .6) });
}
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound only)
// Everything is something in the scene, picked up by his camcorder mic (or CAM 14's ceiling mic during the playback):
// the office's monitors, the corridor's duct fan and its tube (buzz and ticks frame by frame), his steps and breath, the fire
// door, the flashlight. Beyond the door everything sounds again half a second late. space: close (at his mic), shop (the
// room the camera is in), hall (beyond the fire door: further, duller), tape / archive (after the recording chain).
function buildEvents() {
  const SH = Object.fromEntries(TL.SHOTS.map(s => [s[0], s])), EV = [];
  const cq = x => +(Math.ceil(x * FPS_CCTV - 1e-6) / FPS_CCTV).toFixed(3);
  // the tube's buzz follows its light, 12 times a second (the corridor shots), a tick on every drop-out and re-strike
  const env = [], envB = []; let prev = 1, prevB = 1;
  for (let f = Math.round(SH.corridor[1] * 12); f / 12 < TL.DIE + .1; f++) {
    const t = f / 12, a = tubeA(t), bA = tubeA(t - LAG);
    env.push([+t.toFixed(3), +(.15 + .85 * Math.min(1, a)).toFixed(3)]); envB.push([+t.toFixed(3), +(.15 + .85 * Math.min(1, bA)).toFixed(3)]);
    if (Math.abs(a - prev) > .4 && t < TL.DIE) EV.push({ type: 'tick', t: +t.toFixed(3), g: a < prev ? .8 : .5, pan: 0 });
    prev = a; prevB = bA;
  }
  const C0 = SH.corridor[1] + .16;
  EV.push(
    // S1: the office. The monitors' whine, the building's ventilation far off, his breath; he takes the flashlight and stands
    { type: 'bed', fx: 'crt_hum', space: 'shop', t: 0, t1: SH.office[2] - .06, g: -33, fin: .01, fout: .02, env: [[0, .8], [4, 1], [8.6, 1.25]] },
    { type: 'bed', fx: 'duct_hum', space: 'hall', t: 0, t1: SH.office[2] - .06, g: -40, fin: .01, fout: .02 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: .2, t1: SH.office[2] - .06, g: -31, fin: .5, fout: .02 },
    { type: 'handling', t: TL.GRAB + .05, g: .7 }, { type: 'knock', t: TL.GRAB + .22, g: .25 },
    { type: 'scuff', t: TL.GRAB + .7, g: .5 }, { type: 'step', t: TL.GRAB + 1.25, g: .6 }, { type: 'step', t: TL.GRAB + 1.6, g: .55 },
    ...TL.RECCUT.map(c => ({ type: 'camclick', t: c + .16 })),
    // S2-S4: the corridor. The duct fan and the tube, until the power goes
    { type: 'bed', fx: 'duct_hum', space: 'shop', t: C0, t1: TL.DIE + .12, g: -30, fin: .02, fout: .12 },
    { type: 'bed', fx: 'fluor_hum', space: 'shop', t: C0, t1: TL.DIE + .02, g: -35, fin: .02, fout: .01, env },
    { type: 'bed', fx: 'fluor_hum', space: 'hall', t: C0, t1: TL.DIE + LAG + .02, g: -41, fin: .02, fout: .01, env: envB },
    ...TL.STEPS.filter(x => x < TL.WALK[1]).map((x, i) => ({ type: 'step', t: x, g: .85, pan: i % 2 ? .1 : -.1 })),
    ...TL.STEPS.filter(x => x < TL.WALK[1]).map((x, i) => ({ type: 'echo_step', t: +(x + LAG).toFixed(3), g: .8, pan: i % 2 ? .1 : -.1 })),
    { type: 'bed', fx: 'breath_bed', space: 'close', t: C0 + .5, t1: TL.PULL[0], g: -31, fin: 1.0, fout: .3 },
    // at the door: his hand on the edge, the hinge groan; beyond, the same groan half a second late
    { type: 'handling', t: TL.REACH[1] - .05, g: .55 }, { type: 'step', t: TL.REACH[0] + .25, g: .6 },
    { type: 'door_open', t: TL.PULL[0] }, { type: 'door_open_far', t: TL.PULL[0] + LAG },
    { type: 'step', t: TL.PULL[0] + .6, g: .5 }, { type: 'echo_step', t: TL.PULL[0] + .6 + LAG, g: .6 },
    { type: 'breath', t: TL.PULL[1] + .05, g: .7 }, { type: 'echo_breath', t: TL.PULL[1] + .05 + LAG, g: .8 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: TL.ARM_DOWN[1] + 1.9, t1: TL.DIE - .15, g: -28, fin: 1.2, fout: .3 },
    { type: 'rustle', t: TL.SWEEP[0] + .05, g: .5 },
    // the power goes: the tube pops, the fan spins down; beyond the door, half a second later. Then nothing
    { type: 'tube_pop', t: TL.DIE }, { type: 'tube_pop_far', t: TL.DIE + LAG },
    // it: he turns; it is there; the camcorder hits it; the flashlight drops and rolls (and beyond, half a second late)
    { type: 'rustle', t: TL.WHIP[0] + .04, g: .35 },
    { type: 'gasp', t: TL.SCARE[0] + .02 }, { type: 'hit', t: TL.HIT }, { type: 'knock', t: TL.HIT + .03, g: 1 },
    { type: 'torch_drop', t: TL.DROP }, { type: 'torch_drop_far', t: TL.DROP + LAG },
    { type: 'bed', fx: 'near_breath', space: 'close', t: TL.DROP + .25, t1: SH.corridor[2] - .02, g: -21, fin: .25, fout: .05 },
    { type: 'scuff', t: TL.BACK[0] + .1, g: .7 }, { type: 'step', t: TL.BACK[0] + .55, g: .6 },
    // S5: CAM 14's own sound (its ceiling mic): no fan now, his steps going away, the door, slammed; then opening again
    { type: 'vcr', t: TL.ROLL[0] },
    ...[0, 1, 2, 3, 4, 5].map(i => ({ type: 'step', t: cq(TL.BACKOUT[0] + .2 + i * .6), g: .7 - i * .06, pan: 0 })),
    { type: 'bed', fx: 'near_breath', space: 'shop', t: SH.cctv[1] + .1, t1: TL.BACKOUT[1], g: -32, fin: .2, fout: 1.0 },
    { type: 'slam', t: cq(TL.SLAM) },
    { type: 'creak', t: cq(TL.REOPEN[0]) },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    buildSideFeeds();
    const c14 = TK.render(FDG, scene(0), CAM14, { ambient: 1, fog: .02 });
    DOOR_ON_FEED = project(c14, [0, 1.05, LEN]); PLAY_DOOR = project(c14, [.3, 1.6, LEN]);
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
