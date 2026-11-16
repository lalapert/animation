// STILL RECORDING, tape 9: "Carousel". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white). Script: channel/scripts/SR09_carousel.md
// The power is off in the center court and the carousel is turning in the moonlight from the skylight, its band organ
// dragging. Leon's camcorder (colour, hand-held, his flashlight) is cut against CAM 21 (the court) and CAM 22 (the east
// hall), black and white, 6 frames a second. The horses are drawn as carved wooden bodies built from tapered capsules in 3D
// (so they turn and foreshorten like the real thing). Ending type: WRONG MOVEMENT ONLY (no jump): on CAM 22 the nearest
// horse turns its head to the lens in held frames, the last one a snap, its neck bending halfway up where a carousel horse
// has no joint; its pole scrapes the floor; the organ stops dead.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const W = TK.TW, H = TK.TH;
const RAW = mk(W, H), RG = RAW.getContext('2d'), LMAP = mk(W, H), LG = LMAP.getContext('2d'), FG = mk(W, H), FGG = FG.getContext('2d');
const NZ = mk(W, H), NZG = NZ.getContext('2d'), TMP = mk(W, H), TG = TMP.getContext('2d'), WORK = mk(W, H), WK = WORK.getContext('2d'), WIN = mk(W, H), WG = WIN.getContext('2d');
const ALB = mk(W, H), ALG = ALB.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, M = TK.motion, TAU = Math.PI * 2;
const qf = t => Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;
const shotAt = t => TL.SHOTS.find(s => t >= s[1] && t < s[2]);
const SH = Object.fromEntries(TL.SHOTS.map(s => [s[0], s]));
const inR = (t, a) => t >= a[0] && t < a[1];
const kOf = (t, a) => clamp((t - a[0]) / (a[1] - a[0]));
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len3 = a => Math.hypot(a[0], a[1], a[2]), nrm3 = a => mul3(a, 1 / (len3(a) || 1));
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } };
const ell = (g, x, y, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.2832); g.fillStyle = fill; g.fill(); };
const rgb = (c, k = 1) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
function onQuad(g, TLp, TRp, BLp, w, h, draw) {
  if (!TLp || !TRp || !BLp) return;
  g.save(); g.transform((TRp[0] - TLp[0]) / w, (TRp[1] - TLp[1]) / w, (BLp[0] - TLp[0]) / h, (BLp[1] - TLp[1]) / h, TLp[0], TLp[1]); draw(g); g.restore();
}
function mkCam(c) {
  const f = .5 * W / Math.tan(c.fov * Math.PI / 360), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  return Object.assign({}, c, { f, W, H, toCam(p) { const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; } });
}
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const lookAt = (from, to, fov) => { const d = sub3(to, from); return { x: from[0], y: from[1], z: from[2], yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), fov }; };
let PASS = 'lit';                                   // sprites draw lit colours, or plain albedo for the flashlight pass

// ---------------------------------------------------------------- per-quad light (baked): the quad's centroid and normal
function prep(q) {
  const P = q.p, c = [0, 1, 2].map(i => (P[0][i] + P[1][i] + P[2][i] + P[3][i]) / 4);
  const u = sub3(P[1], P[0]), v = sub3(P[3], P[0]);
  q.c = c; q.n = nrm3([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
}
function lit(S, light) {
  const out = new TK.Scene(), m = (c, f) => [c[0] * f[0], c[1] * f[1], c[2] * f[2]];
  out.q = S.q.map(q => { if (!q.c) prep(q); const f = light(q); return Object.assign({}, q, { col: m(q.col, f), textCol: q.textCol && m(q.textCol, f) }); });
  return out;
}
const pointLight = (q, p, a, r) => { const v = sub3(p, q.c), d = len3(v), cs = Math.abs(dot3(q.n, v)) / d; return a * (.25 + .75 * cs) / (1 + Math.pow(d / r, 2)); };

// ---------------------------------------------------------------- the center court and the carousel
const RP = 4.3, RO = 3.55, RI = 2.35, NO = 10, NI = 6, CAN0 = 3.3, CAN1 = 3.85, ROOF = 5.0, PLAT = .35, COL = .9, RING = 13, MOUTH = 1.98;
const GONE0 = [2, 5, 8];                                                     // outer poles already empty at frame 1
const MOON = nrm3([.45, 1, .3]);
const phiAt = t => TAU * t / TL.REV + .35;
const CAM21 = lookAt([6.0, 3.6, -6.1], [-.4, 1.05, .2], 50);
const LEON_COURT = [-.15, -8.1];
function buildCourt() {
  const S = new TK.Scene();
  const tA = [178, 170, 152], tB = [116, 106, 94];
  for (let i = -12; i < 12; i++) for (let j = -12; j < 12; j++) {
    const x = i * 1.2, z = j * 1.2, cx = x + .6, cz = z + .6, r = Math.hypot(cx, cz);
    if (r < RP - .35 || r > RING + .6) continue;
    const a = Math.atan2(cz, cx);
    if (r > RING - .9 && Math.abs(((a - MOUTH + Math.PI) % TAU + TAU) % TAU - Math.PI) < .2) continue;
    S.quad([[x, 0, z], [x + 1.2, 0, z], [x + 1.2, 0, z + 1.2], [x, 0, z + 1.2]], ((i + j) & 1) ? tA : tB, { floor: true });
  }
  // the ring of storefronts (shutters down), a sign band, the wall above; an opening into the east hall
  const N = 28;
  for (let i = 0; i < N; i++) {
    const a0 = i * TAU / N, a1 = a0 + TAU / N, am = (a0 + a1) / 2;
    const P = (a, y, r = RING) => [r * Math.cos(a), y, r * Math.sin(a)];
    if (Math.abs(((am - MOUTH + Math.PI) % TAU + TAU) % TAU - Math.PI) < .2) {
      S.quad([P(a1, 3.4), P(a0, 3.4), P(a0, 4.6), P(a1, 4.6)], [84, 78, 70]);
      continue;
    }
    const shut = i % 4 !== 1;
    S.quad([P(a1, 0), P(a0, 0), P(a0, 3.0), P(a1, 3.0)], shut ? [116, 116, 118] : [26, 28, 32], { tex: shut ? 'shutter' : 'glass' });
    S.quad([P(a1, 3.0), P(a0, 3.0), P(a0, 3.4), P(a1, 3.4)], [56, 48, 40]);
    S.quad([P(a1, 3.4), P(a0, 3.4), P(a0, 4.6), P(a1, 4.6)], [122, 114, 100]);
  }
  // the upper level: a balcony slab and railing round the court, on columns
  for (let i = 0; i < 24; i++) {
    const a0 = i * TAU / 24, a1 = a0 + TAU / 24, P = (a, y, r) => [r * Math.cos(a), y, r * Math.sin(a)];
    S.quad([P(a0, 4.6, 9.6), P(a1, 4.6, 9.6), P(a1, 4.6, RING), P(a0, 4.6, RING)], [92, 88, 80], { under: true });
    S.quad([P(a0, 4.6, 9.6), P(a1, 4.6, 9.6), P(a1, 5.0, 9.6), P(a0, 5.0, 9.6)], [150, 142, 124]);
    S.quad([P(a0, 5.0, 9.6), P(a1, 5.0, 9.6), P(a1, 5.9, 9.6), P(a0, 5.9, 9.6)], [70, 74, 72]);
  }
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + .2, x = 9.9 * Math.cos(a), z = 9.9 * Math.sin(a); S.box(x - .35, 0, z - .35, x + .35, 4.6, z + .35, [150, 144, 130]); }
  // the mouth of the east hall: its first metres (dark) and the EXIT sign over it
  const mx = Math.cos(MOUTH), mz = Math.sin(MOUTH), px = -mz, pz = mx, H0 = RING - .3;
  const HP = (s, d, y) => [mx * (H0 + d) + px * s, y, mz * (H0 + d) + pz * s];
  for (let d = 0; d < 9; d += 1.5) for (let s = -2.7; s < 2.7; s += 1.8) S.quad([HP(s, d, 0), HP(s + 1.8, d, 0), HP(s + 1.8, d + 1.5, 0), HP(s, d + 1.5, 0)], (((d / 1.5) + (s + 2.7) / 1.8) & 1) ? tA : tB, { floor: true });
  for (const s of [-2.7, 2.7]) for (let d = 0; d < 9; d += 1.5) S.quad([HP(s, d, 0), HP(s, d + 1.5, 0), HP(s, d + 1.5, 3.4), HP(s, d, 3.4)], [96, 96, 98], { tex: 'shutter' });
  S.quad([HP(-2.7, 9, 0), HP(2.7, 9, 0), HP(2.7, 9, 3.4), HP(-2.7, 9, 3.4)], [30, 30, 32]);
  S.quad([HP(-.5, -.02, 3.55), HP(.5, -.02, 3.55), HP(.5, -.02, 3.95), HP(-.5, -.02, 3.95)], [60, 20, 18], { exit: true });
  // the low fence round the ride, a gate at the front with its sign
  for (let i = 0; i < 26; i++) {
    const a0 = -Math.PI / 2 + .16 + i * (TAU - .32) / 26, a1 = a0 + (TAU - .32) / 26, P = (a, y) => [5.4 * Math.cos(a), y, 5.4 * Math.sin(a)];
    const p0 = P(a0, 0); S.box(p0[0] - .04, 0, p0[2] - .04, p0[0] + .04, .95, p0[2] + .04, [200, 170, 90]);
    S.quad([P(a0, .82), P(a1, .82), P(a1, .9), P(a0, .9)], [196, 166, 88]);
    S.quad([P(a0, .42), P(a1, .42), P(a1, .48), P(a0, .48)], [196, 166, 88]);
  }
  S.box(-1.51, 0, -5.62, -1.45, .62, -5.56, [60, 56, 50]);
  return S;
}
const COURT = buildCourt();
function gateSign(S, t) {
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur, z = -5.63;
  // two panels that tile the sign (no panel lies over another: the painter's sort could not tell them apart)
  S.quad([[-1.86, .89, z], [-1.1, .89, z], [-1.1, 1.14, z], [-1.86, 1.14, z]], [40, 70, 60], { text: 'RIDES DAILY', textCol: [236, 224, 180] });
  S.quad([[-1.86, .62, z], [-1.1, .62, z], [-1.1, .89, z], [-1.86, .89, z]], [40, 70, 60], { text: egg ? '2 AM TO 9 PM' : '10 AM TO 9 PM', textCol: [236, 224, 180] });
}
// the turning parts: platform, skirt, the mirrored centre column, the canopy (underside, rounding board, roof), empty poles
function carousel(S, t) {
  const phi = phiAt(t), N = 20, P = (r, a, y) => [r * Math.cos(a), y, r * Math.sin(a)];
  for (let i = 0; i < N; i++) {
    const a0 = phi + i * TAU / N, a1 = a0 + TAU / N;
    S.quad([P(COL, a0, PLAT), P(RP, a0, PLAT), P(RP, a1, PLAT), P(COL, a1, PLAT)], i & 1 ? [150, 108, 70] : [138, 98, 62], { floor: true, deck: true });
    S.quad([P(RP, a0, 0), P(RP, a1, 0), P(RP, a1, PLAT), P(RP, a0, PLAT)], i & 1 ? [150, 34, 36] : [190, 150, 70]);
    S.quad([P(COL, a1, CAN0), P(RP + .15, a1, CAN0), P(RP + .15, a0, CAN0), P(COL, a0, CAN0)], i & 1 ? [92, 66, 46] : [84, 60, 42], { under: true });
    S.quad([P(RP + .15, a0, CAN0), P(RP + .15, a1, CAN0), P(RP + .15, a1, CAN1), P(RP + .15, a0, CAN1)], i % 4 === 0 ? [190, 154, 72] : i & 1 ? [218, 204, 170] : [160, 40, 40]);
    S.quad([P(RP + .15, a0, CAN1), P(RP + .15, a1, CAN1), P(.35, a1, ROOF), P(.35, a0, ROOF)], i & 1 ? [200, 188, 160] : [150, 42, 40]);
  }
  for (let i = 0; i < 12; i++) {
    const a0 = phi + i * TAU / 12, a1 = a0 + TAU / 12;
    S.quad([P(COL, a0, PLAT), P(COL, a1, PLAT), P(COL, a1, CAN0), P(COL, a0, CAN0)], i & 1 ? [60, 66, 74] : [92, 100, 110], { mirror: true });
  }
  for (const i of goneOuter(t)) {
    const a = phi + i * TAU / NO, x = RO * Math.cos(a), z = RO * Math.sin(a);
    S.box(x - .028, PLAT, z - .028, x + .028, CAN0, z + .028, [196, 162, 84], { brass: true });
  }
}
let VANISH_I = 0;
const goneOuter = t => GONE0.concat(t >= TL.VANISH ? [VANISH_I] : []);
function courtLight(Lt) {
  return q => {
    if (q.brass) { const b = Lt.amb + Lt.moon * .5; return [b, b * .98, b * .92]; }          // polished brass catches the light like the horses' poles
    const r = Math.hypot(q.c[0], q.c[2]), fp = clamp(1 - (r - 6) / 6), under = q.under ? 0 : 1;
    let shade = 1; if (r < RP + .2 && q.c[1] < CAN0) shade = q.c[1] < PLAT + .05 ? (r > RP - .6 ? .8 : .35) : .5;
    const cs = Math.abs(dot3(q.n, MOON));
    let w = Lt.amb + Lt.moon * fp * under * shade * (.3 + .7 * cs) + (q.mirror ? .08 * Lt.moon : 0), red = 0;
    if (q.exit) red += 1.2;
    red += pointLight(q, [-5.9, 3.7, 11.2], Lt.exit * .45, 1.4);
    return [w * .9 + red, w * .98 + red * .3, w * 1.18 + red * .25];
  };
}
// the horses on the ride: outer ring (some gone), inner ring
const COLS = [[232, 226, 210], [236, 234, 228], [176, 174, 170], [150, 92, 56], [52, 48, 46], [228, 218, 196], [214, 180, 110], [238, 236, 230], [118, 76, 46], [226, 220, 204]];
const SADDLES = [[168, 30, 34], [40, 70, 150], [40, 110, 70], [190, 150, 60], [150, 40, 90]];
function rideHorses(t) {
  const phi = phiAt(t), out = [], gone = goneOuter(t);
  for (let i = 0; i < NO; i++) {
    if (gone.includes(i)) continue;
    const a = phi + i * TAU / NO, y = 1.25 + .22 * Math.sin(3 * phi + i * 1.7);
    out.push({ p: [RO * Math.cos(a), y, RO * Math.sin(a)], yaw: -a, col: COLS[i], saddle: SADDLES[i % 5], pole: [PLAT, CAN0], id: i });
  }
  return out;
}
// the horses already gone, standing in the mouth of the east hall (seen far off on CAM 21 and from the court)
function mouthHorses(t) {
  const mx = Math.cos(MOUTH), mz = Math.sin(MOUTH), px = -mz, pz = mx, out = [];
  [[.6, 3.5], [-1.2, 5.2], [1.4, 6.8]].concat(t >= TL.VANISH ? [[-.3, 2.2]] : []).forEach(([s, d], k) => {
    out.push({ p: [mx * (RING + d) + px * s, 1.2, mz * (RING + d) + pz * s], yaw: Math.atan2(-mx, -mz) + (k - 1) * .2, col: COLS[GONE0[k] ?? VANISH_I], saddle: SADDLES[k], pole: [0, 2.5], broken: true, id: 30 + k });
  });
  return out;
}

// ---------------------------------------------------------------- the east hall: x -4.5..4.5, z 0 (the court) .. 40
const HWH = 4.5, HLEN = 40, HHT = 4.2;
const CAM22 = lookAt([4.25, 3.85, .9], [-.9, .8, 7.6], 54);
const EMER = [-4.2, 3.05, 9.6];
function buildHall() {
  const S = new TK.Scene(), tA = [182, 174, 156], tB = [150, 142, 128];
  for (let z = 0; z < HLEN; z++) for (let i = 0; i < 9; i++) { const x = -HWH + i; S.quad([[x, 0, z], [x + 1, 0, z], [x + 1, 0, z + 1], [x, 0, z + 1]], ((i + z) & 1) ? tA : tB, { floor: true }); }
  for (let z = 0; z < HLEN; z += 2) for (let i = 0; i < 3; i++) { const x = -HWH + i * 3; S.quad([[x, HHT, z + 2], [x + 3, HHT, z + 2], [x + 3, HHT, z], [x, HHT, z]], (i & 1) ? [76, 72, 68] : [70, 66, 62]); }
  let k = 2;
  for (let z = 0; z < HLEN; z += 6) for (const side of [-1, 1]) {
    const x = side * HWH, z0 = z + .3, z1 = z + 5.7, name = TK.STORES[k++ % TK.STORES.length];
    const Q = (y0, y1, a0, a1) => side < 0 ? [[x, y0, a1], [x, y0, a0], [x, y1, a0], [x, y1, a1]] : [[x, y0, a0], [x, y0, a1], [x, y1, a1], [x, y1, a0]];
    for (let zz = z0; zz < z1 - .01; zz += 1.8) S.quad(Q(0, 3.0, zz, Math.min(z1, zz + 1.8)), [116, 116, 118], { tex: 'shutter' });
    const a0 = side < 0 ? z0 + .3 : z1 - .3, a1 = side < 0 ? z1 - .3 : z0 + .3;                     // left wall reads toward +z, right wall toward -z
    S.quad([[x, 3.05, a0], [x, 3.05, a1], [x, 3.6, a1], [x, 3.6, a0]], [52, 46, 40], { text: name, textCol: [200, 190, 160] });
    S.quad(Q(3.0, HHT, z0, z1), [124, 116, 102]);
    S.quad(Q(0, HHT, z1, z + 6.3), [104, 98, 86]);
    S.quad(Q(0, HHT, z, z0), [104, 98, 86]);
  }
  S.quad([[-HWH, 0, HLEN], [HWH, 0, HLEN], [HWH, HHT, HLEN], [-HWH, HHT, HLEN]], [40, 38, 36]);
  S.quad([[-.6, 3.3, HLEN - .05], [.6, 3.3, HLEN - .05], [.6, 3.75, HLEN - .05], [-.6, 3.75, HLEN - .05]], [60, 20, 18], { exit: true });
  S.box(-1.2, 0, 26, 1.2, .45, 26.6, [72, 56, 42]);                                              // a bench
  S.box(-.8, 0, 31, .8, .7, 32.6, [86, 70, 58]); S.box(-.6, .7, 31.2, .6, 1.4, 32.4, [46, 64, 46]);   // a planter
  // the emergency light on the left wall: a battery box with two lamp heads
  S.box(-HWH, 2.86, 9.3, -HWH + .14, 3.06, 9.9, [200, 196, 186]);
  S.box(-HWH + .14, 3.06, 9.36, -HWH + .3, 3.18, 9.5, [180, 176, 166]); S.box(-HWH + .14, 3.06, 9.7, -HWH + .3, 3.18, 9.84, [180, 176, 166]);
  return S;
}
const HALL = buildHall();
function emerA(t) {                                    // the battery emergency light: steady, then it stutters
  if (t < TL.FLICK) return 1;
  const f = Math.floor(t * 12), R = TK.rng(f * 41 + 9)();
  return R < .05 ? .15 : R < .11 ? .55 : 1;
}
function hallLight(Lt) {
  return q => {
    let w = Lt.amb + pointLight(q, EMER, Lt.emer, 4.2) + pointLight(q, [0, 3.2, -1.5], Lt.moon * .5, 3.2), red = 0;
    if (q.exit) red += 1.2;
    red += pointLight(q, [0, 3.5, HLEN - .3], Lt.exit * .5, 1.4);
    return [w * .96 + red, w * .98 + red * .3, w * 1.06 + red * .25];
  };
}
// the long scrapes their poles left on the tiles, from the court toward where they stand (drawn on the floor after the
// scene, before the figures: nothing stands on them but the horses, which are drawn after)
const SCRAPES = [[-.2, 1.2, .1, 13.0], [1.0, 1.5, 1.9, 15.5], [-1.0, 1.0, -2.1, 18.0], [.4, 1.8, .7, 21.0], [-.6, .8, -.3, 10.0]];
function scrapes(g, cam, a) {
  g.save(); g.lineCap = 'round';
  for (const [x0, z0, x1, z1] of SCRAPES) for (let k = 0; k < 3; k++) {
    const o = (k - 1) * .05, n = 14;
    g.beginPath(); let started = false;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = lerp(x0, x1, u) + o + Math.sin(u * 9 + k) * .03, z = lerp(z0, z1, u), p = project(cam, [x, .002, z]);
      if (!p) { started = false; continue; }
      if (!started) { g.moveTo(p[0], p[1]); started = true; } else g.lineTo(p[0], p[1]);
    }
    const p = project(cam, [x0, 0, (z0 + z1) / 2]), w = p ? clamp(cam.f * .012 / p[2], .5, 6) : 1;
    g.strokeStyle = `rgba(${k === 1 ? '30,28,26' : '210,206,196'},${a * (k === 1 ? .55 : .35)})`; g.lineWidth = w; g.stroke();
  }
  g.restore();
}
// where Leon and the four horses in the hall are, shot by shot (on the camcorder they never move; every CAM 22 cut they are
// closer and turned a little more toward the camera)
function leonHallZ(t) { return lerp(1.0, 5.0, ease(kOf(t, TL.WALK))) - .4 * ease(kOf(t, [TL.STEP_BACK, TL.STEP_BACK + .5])); }
const HALL_POSE = {
  hall: [[.1, 11.5, 0], [1.9, 14.2, .12], [-2.1, 16.8, -.15], [.7, 19.8, .05]],
  cctv2: [[-.05, 7.7, .32], [1.5, 10.1, .38], [-1.7, 12.3, .3], [.5, 14.9, .42]],
  hall2: [[-.12, 6.7, .45], [1.4, 9.0, .5], [-1.6, 11.2, .42], [.5, 13.6, .55]],
  cctv3: [[-.18, 6.05, .62], [1.3, 8.2, .66], [-1.5, 10.0, .6], [.45, 12.2, .7]],
};
const HALL_COLS = [[234, 228, 212], [176, 174, 170], [50, 46, 44], [150, 92, 56]];
function hallHorses(t) {
  const s = shotAt(t), key = s && HALL_POSE[s[0]] ? s[0] : 'hall';
  return HALL_POSE[key].map(([x, z, turn], k) => {
    const H = { p: [x, 1.2 + (k & 1) * .1, z], yaw: Math.PI - turn, col: HALL_COLS[k], saddle: SADDLES[(k + 1) % 5], pole: [0, 2.55], broken: true, id: 40 + k, neck: null, tilt: 0 };
    if (k === 0 && key === 'cctv3') {
      // the turn to the lens: held frames, then one frame snaps, the neck bending halfway up
      const tq = qf(t), steps = TL.TURN.filter(x => tq >= x - 1e-6).length;
      const psi = [0, .3, .55, .8][steps];
      H.neck = { yaw: psi, pitch: 0, roll: 0, kink: 0 };
      if (tq >= TL.SNAP - 1e-6) H.neck = Object.assign({ kink: 1 }, SNAP_NECK);
      if (tq >= TL.SCRAPE[0] - 1e-6) { const u = ease(kOf(tq, TL.SCRAPE)); H.p = add3(H.p, [.26 * u, 0, -.05 * u]); H.tilt = .13 * u; }
    }
    return H;
  });
}

// ---------------------------------------------------------------- a carved antique carousel horse, in 3D (horse-local: x right,
// y up, z forward, the saddle at the origin, where the pole goes through). Every part is a carved body of revolution swept
// along a curved spine (elliptical sections that swell and taper), drawn as one smooth outline per part; the paint is laid on
// in each part's own frame: the wild eye, the flared nostril, the open mouth with the bit and the flat carved teeth, the
// bridle, the breast collar, the carved blanket, the mane in deep waves, and the wear (chipped paint to the grey wood,
// hairline cracks, grime in the creases, a dull gloss). The head group (upper neck, head, ears, forelock) turns about the
// middle of the neck.
const KINK = [0, .31, .47];
const HP_ = {                                                                // key points of each carved part (local metres)
  body: { spine: [[0, -.04, -.6], [0, -.09, -.32], [0, -.12, .02], [0, -.1, .34]], rw: [.15, .2, .2, .17], rh: [.19, .23, .25, .23], ref: [0, 1, 0], col: 'body', n: 9 },
  neckLo: { spine: [[0, -.04, .28], [0, .14, .39], [0, .31, .47]], rw: [.13, .1, .085], rh: [.21, .17, .14], ref: [0, 0, 1], col: 'body', n: 6 },
  neckHi: { spine: [[0, .31, .47], [0, .47, .52], [0, .6, .53]], rw: [.085, .07, .062], rh: [.14, .115, .1], ref: [0, 0, 1], col: 'body', n: 6, grp: 1 },
  head: { spine: [[0, .593, .516], [0, .482, .615], [0, .42, .774], [0, .348, .926]], rw: [.06, .08, .058, .048], rh: [.066, .095, .068, .05], ref: [0, 1, 0], col: 'body', n: 13, grp: 1 },
  earL: { spine: [[-.035, .64, .55], [-.042, .69, .5], [-.046, .715, .46]], rw: [.022, .016, .004], rh: [.03, .02, .004], ref: [0, 1, 0], col: 'body', n: 4, grp: 1 },
  earR: { spine: [[.035, .64, .55], [.042, .69, .5], [.046, .715, .46]], rw: [.022, .016, .004], rh: [.03, .02, .004], ref: [0, 1, 0], col: 'body', n: 4, grp: 1 },
  crest: { spine: [[0, .02, .2], [0, .25, .3], [0, .45, .4], [0, .62, .5]], rw: [.05, .055, .05, .035], rh: [.06, .07, .06, .04], ref: [0, 0, 1], col: 'mane', n: 7, grp: 0, kinkSplit: true },
  tail: { spine: [[0, 0, -.6], [0, -.12, -.74], [0, -.3, -.82], [0, -.46, -.78]], rw: [.05, .055, .045, .02], rh: [.07, .075, .06, .02], ref: [1, 0, 0], col: 'mane', n: 7 },
  saddle: { spine: [[0, .14, -.24], [0, .165, -.04], [0, .19, .16]], rw: [.19, .2, .17], rh: [.05, .045, .055], ref: [0, 1, 0], col: 'saddle', n: 5 },
  // legs: one foreleg raised and bent, the other reaching down; both hind legs thrown back
  foreR: { spine: [[.1, -.24, .3], [.1, -.33, .5], [.1, -.33, .62], [.1, -.48, .58], [.1, -.56, .5]], rw: [.075, .055, .045, .034, .03], rh: [.085, .06, .048, .036, .032], ref: [0, 0, 1], col: 'body', n: 8 },
  foreL: { spine: [[-.1, -.24, .3], [-.1, -.42, .38], [-.1, -.6, .44], [-.1, -.74, .48]], rw: [.075, .05, .036, .032], rh: [.085, .055, .04, .034], ref: [0, 0, 1], col: 'body', n: 7 },
  hindR: { spine: [[.11, -.18, -.42], [.11, -.4, -.56], [.11, -.52, -.74], [.11, -.6, -.92]], rw: [.1, .065, .04, .032], rh: [.12, .07, .042, .034], ref: [0, 0, 1], col: 'body', n: 7 },
  hindL: { spine: [[-.11, -.18, -.42], [-.11, -.42, -.52], [-.11, -.56, -.68], [-.11, -.66, -.84]], rw: [.1, .065, .04, .032], rh: [.12, .07, .042, .034], ref: [0, 0, 1], col: 'body', n: 7 },
  hoofFR: { spine: [[.1, -.53, .52], [.1, -.6, .47]], rw: [.034, .038], rh: [.036, .04], ref: [0, 0, 1], col: 'hoof', n: 3 },
  hoofFL: { spine: [[-.1, -.71, .47], [-.1, -.8, .5]], rw: [.034, .038], rh: [.036, .04], ref: [0, 0, 1], col: 'hoof', n: 3 },
  hoofHR: { spine: [[.11, -.58, -.89], [.11, -.63, -.98]], rw: [.034, .037], rh: [.036, .04], ref: [0, 0, 1], col: 'hoof', n: 3 },
  hoofHL: { spine: [[-.11, -.64, -.81], [-.11, -.69, -.9]], rw: [.034, .037], rh: [.036, .04], ref: [0, 0, 1], col: 'hoof', n: 3 },
};
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function crSample(P, n) {                                                     // Catmull-Rom through the key points
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) * (P.length - 1), k = Math.min(P.length - 2, Math.floor(u)), f = u - k;
    const p0 = P[Math.max(0, k - 1)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(P.length - 1, k + 2)];
    out.push([0, 1, 2].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * f + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * f * f + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * f * f * f)));
  }
  return out;
}
const lerpArr = (R, u) => { const x = u * (R.length - 1), k = Math.min(R.length - 2, Math.floor(x)), f = x - k; return R[k] + (R[k + 1] - R[k]) * f; };
// each part's sections in local space (computed once): centre, frame (T along, S side, U up), radii
const HPARTS = Object.entries(HP_).map(([name, d]) => {
  const C = crSample(d.spine, d.n), secs = [];
  for (let i = 0; i < C.length; i++) {
    const T = nrm3(sub3(C[Math.min(C.length - 1, i + 1)], C[Math.max(0, i - 1)])), ref = Math.abs(dot3(T, d.ref)) > .9 ? (d.ref[1] ? [0, 0, 1] : [0, 1, 0]) : d.ref;
    const S = nrm3(cross3(ref, T)), U = cross3(T, S), u = i / (C.length - 1);
    secs.push({ c: C[i], T, S, U, rw: lerpArr(d.rw, u), rh: lerpArr(d.rh, u), u });
  }
  return Object.assign({ name, secs }, d);
});
const HPART = Object.fromEntries(HPARTS.map(p => [p.name, p]));
function hull(pts) {                                                          // convex hull (monotone chain)
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const rotX = (p, a) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const rotZ = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
function horseWorld(H) {
  const sc = H.small || 1, nk = H.neck;
  return p => {
    let q = p;
    if (nk && q.grp) {
      let v = sub3(q.v, KINK);
      v = nk.M ? [0, 1, 2].map(i => nk.M[i][0] * v[0] + nk.M[i][1] * v[1] + nk.M[i][2] * v[2]) : rotZ(rotX(rotY(v, nk.yaw), -nk.pitch), nk.roll);
      if (nk.kink) v = add3(v, [.035, -.03, .025]);                                          // the break shows: the upper neck sits off the lower
      q = { v: add3(KINK, v) };
    }
    let v = mul3(q.v, sc);
    if (H.tilt) v = rotZ(v, -H.tilt);
    return add3(H.p, rotY(v, H.yaw));
  };
}
function horseLight(H, Lt, where) {
  if (PASS !== 'lit') return 1;
  const p = H.p;
  if (where === 'court') {
    const r = Math.hypot(p[0], p[2]);
    return Lt.amb + Lt.moon * clamp(1 - (r - 6) / 6) * (r < RP + .2 ? .55 : 1) * .75;
  }
  const v = sub3(EMER, p), d = len3(v);
  return Lt.amb + Lt.emer * .75 / (1 + Math.pow(d / 4.2, 2)) + Lt.moon * .4 / (1 + Math.pow(p[2] / 3.5, 2));
}
// the painted wear and details per horse (fixed per horse: the chips do not move from frame to frame)
function wearOf(id) {
  const R = TK.rng(id * 97 + 13), chips = [], cracks = [];
  for (let i = 0; i < 9; i++) chips.push({ part: ['body', 'body', 'body', 'neckLo', 'neckHi', 'head', 'hindR', 'foreL', 'body'][i], side: R() < .5 ? -1 : 1, u: .15 + R() * .7, v: (R() - .5) * 1.1, r: .018 + R() * .03, seed: id * 31 + i });
  for (let i = 0; i < 6; i++) cracks.push({ part: ['body', 'neckLo', 'body', 'head', 'neckHi', 'body'][i], side: R() < .5 ? -1 : 1, u: .1 + R() * .7, v: (R() - .5) * .9, len: .06 + R() * .12, ang: (R() - .5) * 2.4, seed: id * 17 + i });
  return { chips, cracks };
}
const WEAR = {};
function drawHorse(g, cam, H, light) {
  const toW = horseWorld(H), k = light, sc = H.small || 1, camPos = [cam.x, cam.y, cam.z];
  const P = p => { const q = cam.toCam(p); return q[2] > .08 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; };
  const pxm = p => cam.f * sc / p[2];                                                          // pixels per metre at a point
  const COL = { body: H.col, mane: H.col[0] + H.col[1] > 300 ? [104, 78, 56] : [30, 25, 22], saddle: H.saddle, hoof: [44, 38, 34], gold: [214, 176, 80], wood: [146, 130, 108], leather: [74, 38, 28] };
  const C = (c, m = 1) => rgb(c, k * m);
  const wear = WEAR[H.id] || (WEAR[H.id] = wearOf(H.id));
  // the brass pole through the saddle (broken off at the top for the ones off the ride)
  const base = H.p, tilt = H.tilt || 0, lean = y => [base[0] + Math.sin(tilt) * Math.cos(H.yaw) * (y - base[1]), y, base[2] - Math.sin(tilt) * Math.sin(H.yaw) * (y - base[1])];
  const p0 = P(lean(H.pole[0])), p1 = P(lean(H.pole[1]));
  if (p0 && p1) {
    const r = Math.max(.7, cam.f * .028 / ((p0[2] + p1[2]) / 2)), dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * r, ny = dx / L * r;
    const gr = g.createLinearGradient(p0[0] - nx, p0[1] - ny, p0[0] + nx, p0[1] + ny);
    gr.addColorStop(0, C([120, 96, 50])); gr.addColorStop(.4, C([236, 204, 120])); gr.addColorStop(1, C([96, 76, 40]));
    poly(g, [[p0[0] - nx, p0[1] - ny], [p1[0] - nx, p1[1] - ny], [p1[0] + nx, p1[1] + ny], [p0[0] + nx, p0[1] + ny]], gr);
    if (H.broken) { g.fillStyle = C([90, 70, 40]); g.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, rr = r * (1 + (i % 2) * .7); g.lineTo(p1[0] + Math.cos(a) * rr, p1[1] + Math.sin(a) * rr * .6 - (i % 2) * r * 1.5); } g.closePath(); g.fill(); }
  }
  // carve every part: one smooth outline (the union of the hulls of neighbouring sections), shaded top-lit
  const parts = [];
  for (const part of HPARTS) {
    const grp = part.grp || 0, rings = [];
    let bad = false, dsum = 0;
    for (const s of part.secs) {
      const g1 = part.kinkSplit ? (s.c[1] > KINK[1] ? 1 : 0) : grp, ring = [];
      for (let j = 0; j < 16; j++) {
        const a = j / 16 * TAU, v = add3(s.c, add3(mul3(s.S, s.rw * Math.cos(a)), mul3(s.U, s.rh * Math.sin(a))));
        const pp = P(toW({ v, grp: g1 })); if (!pp) { bad = true; break; }
        ring.push(pp);
      }
      if (bad) break;
      rings.push(ring); dsum += ring[0][2];
    }
    if (bad) continue;
    const path = new Path2D();
    for (let i = 0; i + 1 < rings.length; i++) { const hl = hull(rings[i].concat(rings[i + 1])); hl.forEach(([x, y], j) => j ? path.lineTo(x, y) : path.moveTo(x, y)); path.closePath(); }
    const mid = part.secs[part.secs.length >> 1], g1 = part.kinkSplit ? 0 : grp;
    const cw = P(toW({ v: mid.c, grp: g1 })), up = P(toW({ v: add3(mid.c, [0, Math.max(mid.rh, mid.rw) * 1.4, 0]), grp: g1 }));
    parts.push({ part, path, rings, d: dsum / rings.length - (part.name === 'saddle' ? .06 : part.name === 'crest' ? -.01 : 0), cw, up });
  }
  parts.sort((a, b) => b.d - a.d);
  const sideFacing = (part, s, side, grp) => {
    const o = toW({ v: add3(s.c, mul3(s.S, side * s.rw)), grp }), n = sub3(toW({ v: add3(s.c, mul3(s.S, side * (s.rw + .1))), grp }), o);
    return dot3(nrm3(n), nrm3(sub3(camPos, o))) > -.05;
  };
  // a decal frame on one side of a part at section u: x along the part, y down its side; metres
  const frame = (part, u, side, grp, inset = .92) => {
    const i = Math.round(u * (part.secs.length - 1)), s = part.secs[i];
    const o = add3(s.c, mul3(s.S, side * s.rw * inset)), O = P(toW({ v: o, grp })), A = P(toW({ v: add3(o, mul3(s.T, .1)), grp })), B = P(toW({ v: add3(o, mul3(s.U, -.1)), grp }));
    if (!O || !A || !B) return null;
    return { s, O, A, B, set: q => q.transform((A[0] - O[0]) / .1, (A[1] - O[1]) / .1, (B[0] - O[0]) / .1, (B[1] - O[1]) / .1, O[0], O[1]) };
  };
  for (const pt of parts) {
    const { part, path, cw, up } = pt, col = COL[part.col], grp = part.grp || 0;
    let gr = null;
    if (cw && up) {
      const dx = up[0] - cw[0], dy = up[1] - cw[1];
      gr = g.createLinearGradient(cw[0] + dx, cw[1] + dy, cw[0] - dx, cw[1] - dy);
      gr.addColorStop(0, C(col, 1.12)); gr.addColorStop(.42, C(col, .96)); gr.addColorStop(.75, C(col, .72)); gr.addColorStop(1, C(col, .48));
    }
    // grime in the creases: a dark carved edge round the outline (stroked first, the fill covers its inner half and every
    // inner seam between the sections)
    const lw = Math.max(.8, pxm(cw || [0, 0, 5]) * .012);
    g.save(); g.strokeStyle = `rgba(30,22,16,${.5 * Math.min(1, k + .2)})`; g.lineWidth = lw * 1.3; g.lineJoin = 'round'; g.stroke(path);
    g.fillStyle = gr || C(col); g.fill(path);
    g.clip(path);
    // the paint on this part (only the side that faces the camera)
    for (const side of [-1, 1]) {
      if (!sideFacing(part, part.secs[part.secs.length >> 1], side, grp)) continue;
      paintPart(g, part, side, grp, frame, C, COL, wear, H);
    }
    g.restore();
    // the head in profile, carved and painted, on the side that faces the camera (it defines the head's outline)
    if (part.name === 'head') for (const side of [-1, 1]) {
      const s0 = part.secs[4], o = toW({ v: add3(s0.c, mul3(s0.S, side * s0.rw)), grp }), n = nrm3(sub3(toW({ v: add3(s0.c, mul3(s0.S, side * (s0.rw + .1))), grp }), o));
      const fac = dot3(n, nrm3(sub3(camPos, o))); if (fac < .2) continue;
      const f = frame(part, .333, side, grp, .95); if (!f) continue;
      g.save(); f.set(g); g.globalAlpha = clamp((fac - .2) / .2); headProfile(g, C, COL, wear, H); g.restore();
    }
    // the mane's carved waves stand off the crest (not clipped to the neck)
    if (part.name === 'neckLo' || part.name === 'neckHi') for (const side of [-1, 1]) if (sideFacing(part, part.secs[2], side, grp)) maneWaves(g, part, side, grp, frame, C, COL);
    if (part.name === 'neckHi' && H.neck && H.neck.kink) breakAt(g, toW, P, C, pxm);
  }
}
// the carved head in profile (decal metres: x along the head toward the muzzle, y down; the poll at x -.15, the muzzle at
// x .345): the classic wild carousel face. The eye wide with white all round the pupil, the nostril flared, the mouth open on
// the bit with the upper lip pulled back off flat carved teeth, the bridle with its studs, the wear
function headProfile(g, C, COL, wear, H) {
  const col = COL.body;
  const head = new Path2D();
  head.moveTo(-.15, -.085);
  head.bezierCurveTo(-.09, -.1, -.02, -.095, .05, -.085);                     // forehead
  head.bezierCurveTo(.13, -.075, .2, -.062, .25, -.058);                       // the long flat nasal line
  head.bezierCurveTo(.29, -.066, .325, -.05, .34, -.022);                      // the nostril's swell
  head.bezierCurveTo(.35, -.004, .348, .016, .338, .026);                      // the muzzle
  head.lineTo(.3, .034); head.lineTo(.2, .05);                                 // the upper lip, pulled back to the corner
  head.lineTo(.3, .074); head.bezierCurveTo(.318, .08, .322, .094, .305, .104); // the lower jaw's edge, the lower lip
  head.bezierCurveTo(.26, .118, .18, .124, .1, .132);                          // the chin and jaw line
  head.bezierCurveTo(.03, .158, -.07, .156, -.11, .112);                       // the round jowl
  head.bezierCurveTo(-.145, .07, -.17, .03, -.172, -.01);                      // the throat
  head.bezierCurveTo(-.172, -.045, -.165, -.07, -.15, -.085); head.closePath();
  const gr = g.createLinearGradient(0, -.1, .02, .16); gr.addColorStop(0, C(col, 1.12)); gr.addColorStop(.45, C(col, .97)); gr.addColorStop(1, C(col, .55));
  g.fillStyle = gr; g.fill(head);
  g.save(); g.clip(head);
  // the paint's age: shading toward the carved edges, grime speckle, a craquelure of fine cracks
  const sh = g.createRadialGradient(.05, .01, .04, .05, .01, .26); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(10,6,4,.45)'); g.fillStyle = sh; g.fillRect(-.2, -.2, .6, .4);
  { const NR = TK.rng(5); g.fillStyle = 'rgba(30,20,12,.28)'; for (let i = 0; i < 160; i++) { const x = -.17 + NR() * .52, y = -.1 + NR() * .26, r = .0012 + NR() * .0028; g.fillRect(x, y, r, r); }
    g.strokeStyle = 'rgba(30,20,14,.32)'; g.lineWidth = .0012; for (let i = 0; i < 9; i++) { let x = -.12 + NR() * .4, y = -.07 + NR() * .17; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (NR() - .3) * .03; y += (NR() - .5) * .025; g.lineTo(x, y); } g.stroke(); } }
  // the dull gloss on the cheek, the carved cheek and the jaw muscle, grime in the creases
  const gl = g.createRadialGradient(-.02, .04, .004, -.02, .04, .085); gl.addColorStop(0, 'rgba(255,255,255,.26)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(-.12, -.06, .2, .2);
  g.strokeStyle = 'rgba(24,16,12,.6)'; g.lineWidth = .006; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-.06, .0); g.bezierCurveTo(.0, .06, .07, .1, .14, .1); g.stroke();
  g.beginPath(); g.moveTo(-.12, .05); g.bezierCurveTo(-.08, .13, .02, .14, .06, .128); g.stroke();
  // chips: the paint gone to grey wood on the nose and the jowl
  const R = TK.rng((H.id || 1) * 7 + 3);
  for (const [cx, cy, r] of [[.17 + R() * .06, -.05, .016], [-.05 + R() * .05, .1, .02], [.08, -.07, .01]]) {
    g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = r * (.6 + R() * .7); g.lineTo(cx + Math.cos(a) * rr * 1.4, cy + Math.sin(a) * rr); } g.closePath();
    g.fillStyle = C(COL.wood); g.fill(); g.strokeStyle = 'rgba(16,12,8,.8)'; g.lineWidth = .003; g.stroke();
  }
  g.strokeStyle = 'rgba(14,10,8,.7)'; g.lineWidth = .0022; g.beginPath(); g.moveTo(.1, -.07); g.lineTo(.13, -.045); g.lineTo(.125, -.02); g.lineTo(.15, .0); g.stroke();   // a hairline crack
  g.restore();
  g.strokeStyle = 'rgba(34,24,16,.6)'; g.lineWidth = .004; g.lineJoin = 'round'; g.stroke(head);
  // the mouth: the dark gap, the flat carved teeth (upper ones bared under the drawn-back lip), the tongue
  g.fillStyle = 'rgb(22,6,6)'; g.beginPath(); g.moveTo(.2, .05); g.lineTo(.3, .034); g.lineTo(.338, .028); g.lineTo(.318, .08); g.lineTo(.3, .074); g.closePath(); g.fill();
  const TR = TK.rng(41); g.strokeStyle = 'rgba(40,26,16,.7)'; g.lineWidth = .0015;
  for (let i = 0; i < 5; i++) { const x = .222 + i * .022, y = .046 - i * .0035, h = .013 + TR() * .007, w = .017 + TR() * .004; g.fillStyle = C([206, 190, 142], .95 + TR() * .2); g.beginPath(); g.moveTo(x, y - .001); g.lineTo(x + w, y - .002); g.lineTo(x + w - .002, y + h); g.lineTo(x + .002, y + h - TR() * .004); g.closePath(); g.fill(); g.stroke(); }
  for (let i = 0; i < 3; i++) { const x = .245 + i * .022, y = .066 + i * .002, h = .009 + TR() * .004; g.fillStyle = C([190, 172, 126], .9); g.beginPath(); g.moveTo(x, y); g.lineTo(x + .018, y); g.lineTo(x + .017, y - h); g.lineTo(x + .002, y - h + .002); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = 'rgba(120,30,34,.8)'; g.beginPath(); g.ellipse(.25, .062, .03, .007, -.1, 0, TAU); g.fill();
  // the bit and the bridle: cheek strap from the bit up behind the eye, noseband, studs and a rosette
  g.strokeStyle = C([96, 56, 36]); g.lineWidth = .01;
  g.beginPath(); g.moveTo(.2, .05); g.bezierCurveTo(.12, .02, .0, -.03, -.12, -.075); g.stroke();
  g.beginPath(); g.moveTo(.255, -.058); g.bezierCurveTo(.25, .0, .24, .05, .225, .1); g.stroke();
  g.fillStyle = C(COL.gold); for (const [x, y] of [[.12, .01], [.04, -.02], [.24, .0]]) { g.beginPath(); g.arc(x, y, .006, 0, TAU); g.fill(); }
  g.strokeStyle = C(COL.gold); g.lineWidth = .008; g.beginPath(); g.arc(.2, .05, .022, 0, TAU); g.stroke();
  g.fillStyle = C([170, 36, 40], 1.1); g.beginPath(); g.arc(-.12, -.075, .02, 0, TAU); g.fill(); g.strokeStyle = C(COL.gold); g.lineWidth = .006; g.stroke();
  // the flared nostril: a deep dark comma, a pale carved rim, wrinkles behind it
  g.fillStyle = 'rgb(14,8,8)'; g.beginPath(); g.ellipse(.3, -.03, .024, .012, .45, 0, TAU); g.fill();
  g.strokeStyle = C([240, 228, 206], .9); g.lineWidth = .005; g.beginPath(); g.ellipse(.3, -.03, .029, .017, .45, Math.PI * 1.05, Math.PI * 2.25); g.stroke();
  g.strokeStyle = 'rgba(20,14,10,.65)'; g.lineWidth = .004; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(.22 + i * .016, -.045 - i * .004); g.quadraticCurveTo(.235 + i * .016, -.062, .25 + i * .016, -.046); g.stroke(); }
  // the eye: wide, white all round a small pupil, a painted red rim, the carved lid and a heavy brow
  const ex = -.065, ey = -.035;
  const almond = (q, sx, sy) => { q.beginPath(); q.moveTo(ex - sx, ey + sy * .15); q.bezierCurveTo(ex - sx * .45, ey - sy * 1.25, ex + sx * .55, ey - sy * 1.15, ex + sx, ey - sy * .1); q.bezierCurveTo(ex + sx * .5, ey + sy * 1.05, ex - sx * .5, ey + sy * 1.1, ex - sx, ey + sy * .15); q.closePath(); };
  g.fillStyle = 'rgba(16,10,8,.85)'; almond(g, .046, .03); g.fill();
  g.fillStyle = C([246, 242, 232], 1.3); almond(g, .036, .022); g.fill();
  g.strokeStyle = 'rgba(140,28,24,.9)'; g.lineWidth = .004; g.stroke();
  g.fillStyle = 'rgb(8,6,6)'; g.beginPath(); g.arc(ex + .011, ey + .002, .0062, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(60,40,30,.5)'; g.lineWidth = .0015; g.beginPath(); g.arc(ex + .011, ey + .002, .0105, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(ex + .008, ey - .002, .002, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(16,10,8,.9)'; g.lineWidth = .009; g.beginPath(); g.moveTo(ex - .05, ey - .006); g.quadraticCurveTo(ex - .005, ey - .058, ex + .05, ey - .02); g.stroke();
  // the ears laid back, the forelock tossed forward
  g.fillStyle = C(col, .95); g.strokeStyle = 'rgba(18,12,10,.85)'; g.lineWidth = .005;
  g.beginPath(); g.moveTo(-.11, -.088); g.quadraticCurveTo(-.2, -.15, -.26, -.16); g.quadraticCurveTo(-.21, -.1, -.155, -.065); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = C(COL.mane, 1.1);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-.13 + i * .02, -.09); g.bezierCurveTo(-.08 + i * .03, -.135 + i * .01, -.02 + i * .03, -.12 + i * .01, .01 + i * .025, -.085); g.bezierCurveTo(-.04 + i * .03, -.1, -.08 + i * .02, -.095, -.13 + i * .02, -.09); g.fill(); g.stroke(); }
}
// a painted, worn patch of decals on a part's side
function paintPart(g, part, side, grp, frame, C, COL, wear, H) {
  const n = part.name;
  if (n === 'head') {
    // (the head is carved and painted in headProfile(), laid over the head's side after it)
  } else if (n === 'body') {
    // the carved blanket under the saddle (scalloped, a gold border, a jewel) and the breast collar
    const f = frame(part, .55, side, grp, .95); if (!f) return;
    g.save(); f.set(g);
    g.fillStyle = C(H.saddle, .75); g.beginPath(); g.moveTo(-.26, -.24); g.lineTo(.2, -.26);
    for (let i = 0; i <= 6; i++) { const x = .2 - i * .077; g.quadraticCurveTo(x - .038, .08, x - .077, .02); }
    g.closePath(); g.fill();
    g.strokeStyle = C(COL.gold); g.lineWidth = .014; g.stroke();
    ell(g, -.04, -.06, .028, .028, C([60, 120, 160], 1.1)); g.strokeStyle = C(COL.gold); g.lineWidth = .008; g.beginPath(); g.arc(-.04, -.06, .03, 0, TAU); g.stroke();
    g.strokeStyle = C(COL.gold); g.lineWidth = .028; g.beginPath(); g.moveTo(.4, -.27); g.quadraticCurveTo(.5, -.05, .48, .14); g.stroke();
    g.strokeStyle = C([150, 30, 34]); g.lineWidth = .012; g.beginPath(); g.moveTo(.4, -.27); g.quadraticCurveTo(.5, -.05, .48, .14); g.stroke();
    ell(g, .47, -.06, .03, .03, C([170, 40, 40], 1.1));
    // a dull gloss on the hindquarter
    const gl = g.createRadialGradient(-.42, -.12, .01, -.42, -.12, .14); gl.addColorStop(0, 'rgba(255,255,255,.16)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(-.6, -.3, .4, .4);
    g.restore();
  } else if (n === 'saddle') {
    const f = frame(part, .5, side, grp, .9); if (!f) return;
    g.save(); f.set(g); g.strokeStyle = C(COL.gold); g.lineWidth = .012; g.beginPath(); g.moveTo(-.2, .02); g.quadraticCurveTo(0, .05, .18, .015); g.stroke(); g.restore();
  } else if (n === 'tail') {
    const f = frame(part, .5, side, grp, .8); if (!f) return;
    g.save(); f.set(g); g.strokeStyle = 'rgba(10,8,6,.6)'; g.lineWidth = .007;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-.18, -.04 + i * .025); g.bezierCurveTo(-.06, -.07 + i * .025, .06, .0 + i * .025, .2, -.03 + i * .025); g.stroke(); }
    g.restore();
  }
  // the wear: chipped paint showing the grey wood (with a dark broken edge), hairline cracks
  for (const ch of wear.chips) if (ch.part === n && ch.side === side) {
    const s = part.secs[Math.round(ch.u * (part.secs.length - 1))], f = frame(part, ch.u, side, grp, .96); if (!f) continue;
    g.save(); f.set(g); const R = TK.rng(ch.seed), y = ch.v * s.rh;
    g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = ch.r * (.55 + R() * .7); g.lineTo(Math.cos(a) * r * 1.4, y + Math.sin(a) * r); } g.closePath();
    g.fillStyle = C(COL.wood); g.fill(); g.strokeStyle = 'rgba(16,12,8,.75)'; g.lineWidth = .004; g.stroke();
    g.restore();
  }
  for (const cr of wear.cracks) if (cr.part === n && cr.side === side) {
    const s = part.secs[Math.round(cr.u * (part.secs.length - 1))], f = frame(part, cr.u, side, grp, .96); if (!f) continue;
    g.save(); f.set(g); const R = TK.rng(cr.seed); let x = 0, y = cr.v * s.rh;
    g.strokeStyle = 'rgba(14,10,8,.7)'; g.lineWidth = .0025; g.beginPath(); g.moveTo(x, y);
    for (let i = 0; i < 6; i++) { x += Math.cos(cr.ang) * cr.len / 6 + (R() - .5) * .01; y += Math.sin(cr.ang) * cr.len / 6 + (R() - .5) * .012; g.lineTo(x, y); }
    g.stroke(); g.restore();
  }
}
// the mane: carved locks in deep waves, rising off the crest and sweeping back and down
function maneWaves(g, part, side, grp, frame, C, COL) {
  const lo = part.name === 'neckLo', N = 4;
  for (let i = 0; i < N; i++) {
    const u = (i + .5) / N, s = part.secs[Math.round(u * (part.secs.length - 1))], f = frame(part, u, side, grp, .7); if (!f) continue;
    g.save(); f.set(g);
    // in this frame x runs up the neck, y toward the throat (U is the neck's front): the crest is at y = +rh (the back)
    const top = s.rh * .95, L = .11 + (lo ? .03 : 0);
    const gr = g.createLinearGradient(0, top - .06, 0, top + .03); gr.addColorStop(0, C(COL.mane, .7)); gr.addColorStop(.5, C(COL.mane, 1.25)); gr.addColorStop(1, C(COL.mane, .5));
    g.fillStyle = gr; g.beginPath(); g.moveTo(-L * .5, top + .015);
    g.bezierCurveTo(-L * .2, top + .05, L * .3, top + .045, L * .55, top - .005);
    g.bezierCurveTo(L * .2, top - .02, L * .05, top - .07, -L * .25, top - .085);
    g.bezierCurveTo(-L * .05, top - .045, -L * .3, top - .01, -L * .5, top + .015); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(8,6,4,.7)'; g.lineWidth = .005; g.stroke();
    g.strokeStyle = 'rgba(8,6,4,.45)'; g.lineWidth = .003; g.beginPath(); g.moveTo(-L * .35, top - .005); g.quadraticCurveTo(0, top - .04, L * .3, top - .015); g.stroke();
    g.restore();
  }
}
// the snap: the neck broken halfway up. Each broken end shows its section: pale splintered wood with long slivers standing
// out of it and a dark split heart; a thin dark gap where the two ends still meet
function breakAt(g, toW, P, C, pxm) {
  const s = HPART.neckLo.secs[HPART.neckLo.secs.length - 1];
  for (const grp of [0, 1]) {
    const R = TK.rng(77 + grp * 13), ring = [], heart = [], N = 22;
    // an uneven split: a few big torn teeth of different heights, not a regular star
    const teeth = [0, 3, 7, 12, 16, 19].map(j => ({ j, h: .15 + R() * .5 }));
    for (let j = 0; j < N; j++) {
      const a = j / N * TAU, t = teeth.find(q => Math.abs(q.j - j) < 1.5), jag = 1 + (t ? t.h * (1 - Math.abs(t.j - j) / 1.5) : -.05 + R() * .06);
      const v = add3(s.c, add3(mul3(s.S, s.rw * Math.cos(a) * jag), mul3(s.U, s.rh * Math.sin(a) * jag)));
      const sp = .18 + .3 * Math.abs(Math.sin(a * 1.5 + grp)) + R() * .1;                     // the split: long and crooked
      const w = add3(s.c, add3(mul3(s.S, s.rw * Math.cos(a) * sp * .5), mul3(s.U, s.rh * Math.sin(a) * sp)));
      const p = P(toW({ v, grp })), q = P(toW({ v: w, grp })); if (!p || !q) return;
      ring.push(p); heart.push(q);
    }
    g.save();
    g.fillStyle = C([158, 136, 100]); poly(g, ring); g.fill();
    g.strokeStyle = 'rgba(30,20,12,.8)'; g.lineWidth = Math.max(1, pxm(ring[0]) * .005); g.stroke();
    g.strokeStyle = 'rgba(70,50,30,.55)'; g.lineWidth = Math.max(.7, pxm(ring[0]) * .0025);    // torn grain
    for (let i = 0; i < 8; i++) { const a = ring[(i * 5) % N], b = heart[(i * 5 + 3) % N]; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo((a[0] + b[0]) / 2 + (R() - .5) * 4, (a[1] + b[1]) / 2 + (R() - .5) * 4); g.lineTo(b[0], b[1]); g.stroke(); }
    g.fillStyle = 'rgb(14,9,6)'; poly(g, heart); g.fill();                                     // the dark split in the wood
    // three long thin splinters bent out of the break
    g.fillStyle = C([200, 182, 140]); g.strokeStyle = 'rgba(30,20,12,.7)'; g.lineWidth = 1;
    for (const t of teeth.slice(0, 3)) {
      const b = ring[t.j], c = heart[t.j], dx = b[0] - c[0], dy = b[1] - c[1], w = Math.max(1.4, pxm(b) * .012), L = .55 + R() * .4, bend = (R() - .5) * .7;
      const tip = [b[0] + (dx * Math.cos(bend) - dy * Math.sin(bend)) * L, b[1] + (dx * Math.sin(bend) + dy * Math.cos(bend)) * L], nx = -dy, ny = dx, nl = Math.hypot(nx, ny) || 1;
      poly(g, [[b[0] + nx / nl * w, b[1] + ny / nl * w], tip, [b[0] - nx / nl * w, b[1] - ny / nl * w]]); g.fill(); g.stroke();
    }
    g.restore();
  }
}
const horseSprite = (H, Lt, where) => ({ x: H.p[0], y: H.p[1], z: H.p[2], draw: (g, cam) => drawHorse(g, cam, H, horseLight(H, Lt, where)) });

// ---------------------------------------------------------------- Leon (small, on CCTV): from behind, the camcorder up at his
// left eye, the flashlight in his right hand
const SHIRT = [140, 156, 182], TROUS = [34, 38, 52], CAP = [28, 32, 50], SKIN = [182, 140, 112];
function leonBack(g, cam, x, z, k) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 1.8, z]); if (!feet || !head) return null;
  const u = (feet[1] - head[1]) / 1.8, C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`;
  g.save(); g.translate(feet[0], feet[1]); g.scale(u, u);
  ell(g, 0, 0, .3, .06, 'rgba(0,0,0,.3)');
  poly(g, [[-.19, -.94], [-.02, -.94], [-.04, -.02], [-.17, -.02]], C(TROUS)); poly(g, [[.02, -.94], [.19, -.94], [.17, -.02], [.04, -.02]], C(TROUS, .9));
  poly(g, [[-.22, -.97], [.22, -.97], [.22, -.9], [-.22, -.9]], 'rgb(18,18,20)');
  poly(g, [[-.25, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT));
  poly(g, [[-.22, -1.45], [-.29, -1.48], [-.46, -1.38], [-.43, -1.31], [-.29, -1.38]], C(SHIRT, .92));
  poly(g, [[-.46, -1.38], [-.42, -1.31], [-.19, -1.6], [-.15, -1.66], [-.2, -1.69]], C(SHIRT, .86));
  g.fillStyle = C([22, 22, 24]); g.fillRect(-.26, -1.76, .2, .13);
  g.lineCap = 'round'; g.strokeStyle = C(SHIRT, .88); g.lineWidth = .1; g.beginPath(); g.moveTo(.21, -1.42); g.lineTo(.33, -1.18); g.stroke();
  g.lineWidth = .075; g.beginPath(); g.moveTo(.33, -1.18); g.lineTo(.3, -1.04); g.stroke();
  ell(g, .3, -1.04, .04, .036, C(SKIN, .8)); ell(g, .305, -1.045, .028, .028, C([30, 30, 34]));
  poly(g, [[-.05, -1.58], [.05, -1.58], [.058, -1.47], [-.058, -1.47]], C(SKIN, .7));
  ell(g, 0, -1.665, .1, .1, C([24, 20, 18]));
  g.beginPath(); g.moveTo(-.118, -1.69); g.bezierCurveTo(-.122, -1.86, .122, -1.86, .118, -1.69); g.closePath(); g.fillStyle = C(CAP); g.fill();
  g.restore();
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
// T: hand ({x, y, r, a} screen space, the flashlight in his hand on the camcorder), spill, world [{c, ax, ay, a}]
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
// draw one view twice (lit, and plain albedo for the flashlight), add the flashlight's light; after(g, cam) draws what sits
// on the scene (floor marks, figures) in both passes
function renderView(g, S, light, camSpec, T, sprites, after) {
  PASS = 'lit';
  const cam = TK.render(g, lit(S, light), camSpec, { ambient: 1, fog: .015, bg: [4, 4, 5], sprites, grid: false });
  if (after) after(g, cam);
  if (T && (T.hand || (T.world && T.world.length))) {
    PASS = 'albedo';
    TK.render(ALG, S, camSpec, { ambient: 1, fog: .015, bg: [0, 0, 0], sprites, grid: false });
    if (after) after(ALG, cam);
    torchMap(LG, cam, T);
    ALG.save(); ALG.globalCompositeOperation = 'multiply'; ALG.drawImage(LMAP, 0, 0); ALG.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(ALB, 0, 0); g.restore();
    PASS = 'lit';
  }
  return cam;
}
function exitFace(g, cam, a, b, c, e = 1) {
  onQuad(g, project(cam, a), project(cam, b), project(cam, c), 200, 80, q => {
    q.fillStyle = 'rgb(58,16,14)'; q.fillRect(0, 0, 200, 80);
    q.font = '64px "Special Elite"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.shadowColor = `rgba(255,60,40,${e})`; q.shadowBlur = 24 * e;
    q.fillStyle = `rgb(${120 + 135 * e | 0},${40 + 30 * e | 0},${36 + 20 * e | 0})`; q.fillText('EXIT', 100, 44);
  });
}
function moonShaft(g, cam, a) {
  // the skylight's light falling into the court: a pale column of air over the ride
  const top = project(cam, [.8, 9, .4]), bot = project(cam, [-.4, 0, -.2]); if (!top || !bot) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(top[0], top[1], bot[0], bot[1]); gr.addColorStop(0, `rgba(150,170,210,${.1 * a})`); gr.addColorStop(1, 'rgba(150,170,210,0)');
  g.fillStyle = gr; const w = cam.f * 7 / bot[2];
  g.beginPath(); g.moveTo(top[0] - w * .5, top[1]); g.lineTo(top[0] + w * .5, top[1]); g.lineTo(bot[0] + w * .6, bot[1]); g.lineTo(bot[0] - w * .6, bot[1]); g.closePath(); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- the two places, through any camera
function courtView(g, t, camSpec, Lt, T, o = {}) {
  const S = new TK.Scene(); S.q = COURT.q.slice(); carousel(S, t); gateSign(S, t);
  const sprites = rideHorses(t).concat(mouthHorses(t)).map(H => horseSprite(H, Lt, 'court'));
  if (o.leon) sprites.push({ x: LEON_COURT[0], y: .9, z: LEON_COURT[1], draw: (gg, cam) => leonBack(gg, cam, LEON_COURT[0], LEON_COURT[1], PASS === 'lit' ? clamp(Lt.amb + .25) : 1) });
  const cam = renderView(g, S, courtLight(Lt), camSpec, T, sprites);
  const mx = Math.cos(MOUTH), mz = Math.sin(MOUTH), px = -mz, pz = mx, H0 = RING - .3, HP = (s, y) => [mx * (H0 - .03) + px * s, y, mz * (H0 - .03) + pz * s];
  exitFace(g, cam, HP(.48, 3.93), HP(-.48, 3.93), HP(.48, 3.57), Lt.exit);
  moonShaft(g, cam, Lt.moon);
  return cam;
}
function hallView(g, t, camSpec, Lt, T, o = {}) {
  const horses = hallHorses(t);
  const cam = renderView(g, HALL, hallLight(Lt), camSpec, T, null, (gg, cm) => {
    scrapes(gg, cm, PASS === 'lit' ? clamp(Lt.amb * 2 + .25) : 1);
    const figs = horses.map(H => ({ d: len3(sub3(H.p, [cm.x, cm.y, cm.z])), draw: () => drawHorse(gg, cm, H, horseLight(H, Lt, 'hall')) }));
    if (o.leon) { const z = leonHallZ(t); figs.push({ d: len3(sub3([-.3, 1, z], [cm.x, cm.y, cm.z])), draw: () => leonBack(gg, cm, -.3, z, PASS === 'lit' ? clamp(Lt.amb + .35) : 1) }); }
    figs.sort((a, b) => b.d - a.d).forEach(f => f.draw());
  });
  // the emergency light's two lamp faces, the EXIT sign at the far end
  for (const zz of [9.43, 9.77]) {
    const p = project(cam, [-HWH + .31, 3.12, zz]);
    if (p && Lt.emer > .05) { const r = Math.max(4, 160 / p[2]); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(p[0], p[1], 1, p[0], p[1], r); gr.addColorStop(0, `rgba(255,250,230,${Lt.emer})`); gr.addColorStop(.3, `rgba(255,240,200,${.5 * Lt.emer})`); gr.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r); g.restore(); }
  }
  exitFace(g, cam, [-.58, 3.73, HLEN - .07], [.58, 3.73, HLEN - .07], [-.58, 3.32, HLEN - .07], Lt.exit);
  return { cam, horses };
}

// ---------------------------------------------------------------- the camcorder
function handheld(t, t0, rate, walking, nerve) {
  const ph = (t - t0) * rate, step = walking ? Math.abs(Math.sin(ph * Math.PI)) : 0;
  const n = k => Math.sin(t * 1.3 * k + k) * .6 + Math.sin(t * 2.9 * k + 2 * k) * .3 + Math.sin(t * 7.1 * k) * .1;
  const amp = .012 + .02 * nerve;
  return { y: step * .03 + n(1.1) * amp * .5, yaw: n(.9) * amp * .8 + (walking ? Math.sin(ph * Math.PI * .5) * .015 : 0), pitch: n(1.7) * amp * .5, roll: n(.7) * amp * .6 + (walking ? Math.sin(ph * Math.PI) * .008 : 0) };
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
// the flashlight's beam from the camera's pose: where it lands (a pool there, screen space), and how strong
function handBeam(cc, cs, yawOff, pitchOff, hitFn) {
  const yaw = cs.yaw + yawOff, pitch = cs.pitch + pitchOff, d = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const o = [cs.x + Math.cos(cs.yaw) * .22, cs.y - .38, cs.z - Math.sin(cs.yaw) * .22 + .2];
  const hit = hitFn(o, d), p = project(cc, hit), dist = len3(sub3(hit, o));
  return { x: p ? p[0] : W / 2, y: p ? p[1] : H / 2, r: cc.f * .3, a: clamp(1.35 / (1 + Math.pow(dist / 3.6, 2)), .08, 1) };
}
function boxHit(o, d, x0, x1, y1, z1, figs = []) {
  let best = 1e9; const T = v => { if (v > 1e-4 && v < best) best = v; };
  if (d[1] < 0) T(-o[1] / d[1]); if (d[1] > 0) T((y1 - o[1]) / d[1]);
  if (d[0] < 0) T((x0 - o[0]) / d[0]); if (d[0] > 0) T((x1 - o[0]) / d[0]);
  if (d[2] > 0) T((z1 - o[2]) / d[2]);
  for (const c of figs) { const v = dot3(sub3(c, o), d); if (v > 0) { const q = add3(o, mul3(d, v)); if (len3(sub3(q, c)) < .5) T(v - .3); } }
  return add3(o, mul3(d, best));
}
function courtHit(o, d) {
  // the ride: a cylinder of radius RO+.3 between the platform and the canopy; else the floor
  let best = 1e9;
  const a = d[0] * d[0] + d[2] * d[2], b = 2 * (o[0] * d[0] + o[2] * d[2]), c = o[0] * o[0] + o[2] * o[2] - Math.pow(RO + .35, 2), disc = b * b - 4 * a * c;
  if (disc > 0) { const v = (-b - Math.sqrt(disc)) / (2 * a), y = o[1] + d[1] * v; if (v > 0 && y > PLAT && y < CAN0) best = v; }
  if (d[1] < 0) best = Math.min(best, -o[1] / d[1]);
  return add3(o, mul3(d, best > 1e8 ? 12 : best));
}

// S1: the center court. He films the ride from outside the gate; his flashlight sweeps along the horses going past
function poseCourt(t) {
  const h = handheld(t, 0, 1.6, inR(t, [TL.STEPS1[0] - .2, TL.STEPS1[1] + .3]), .2 + .25 * kOf(t, [4, 8]));
  const z = -8.7 + .6 * ease(kOf(t, [TL.STEPS1[0] - .2, TL.STEPS1[1] + .3]));
  let yaw = -.02 + .04 * Math.sin(t * .5), pitch = .07, fov = 62;
  yaw -= .16 * ease(kOf(t, [5.5, 6.9])); pitch -= .22 * ease(kOf(t, [5.5, 6.9]));                // he looks down at the gate sign as he steps up
  return { cam: { x: -.15, y: 1.55 - h.y, z, yaw: yaw + h.yaw, pitch: pitch + h.pitch, fov }, h };
}
function shotCourt(g, fg, t) {
  const { cam: cs, h } = poseCourt(t), cc = mkCam(cs);
  const sw = kOf(t, TL.SWEEP), yawOff = (t < TL.SWEEP[0] ? -.32 : t > TL.SWEEP[1] ? .02 : lerp(-.32, .3, ease(sw))) + .03 * Math.sin(t * 2.1);
  const T = { hand: handBeam(cc, cs, yawOff, -.06, courtHit), spill: .07 };
  const Lt = { amb: .09, moon: 1.25, exit: 1 };                                             // 11/16: the opening reads on a phone (brighter moonlight)
  courtView(g, t, cs, Lt, T);
  fg.clearRect(0, 0, W, H);
  const hx = 915 + h.yaw * -120, hy = 712 + h.y * 380, vp = project(cc, add3([cs.x, cs.y, cs.z], [Math.sin(cs.yaw + yawOff) * 6, -.3, Math.cos(cs.yaw + yawOff) * 6])) || [540, 430];
  armTorch(fg, hx, hy, Math.atan2(vp[1] - hy, vp[0] - hx), .5);
  return { roll: h.roll, bgBlur: 2.2 * Math.exp(-t / .2), fgBlur: 0, noise: .12 };
}
// S3: the east hall. Into the dark, the flashlight on the scrapes; up the scrapes to a horse; three more; the zoom
function poseHall(t) {
  const walking = t > TL.WALK[0] + .1 && t < TL.WALK[1] - .1, nerve = t < TL.RISE[1] ? .3 : t < TL.ZOOM[0] ? .55 : .75;
  const h = handheld(t, TL.WALK[0] + .3, 1.6, walking, nerve), z = leonHallZ(t);
  let yaw = .02, pitch = lerp(-.62, -.03, ease(kOf(t, TL.RISE))), fov = 58;
  const f = kOf(t, TL.FIND);
  if (f > 0 && f < 1) yaw += f < .35 ? lerp(0, .24, ease(f / .35)) : f < .7 ? lerp(.24, -.24, ease((f - .35) / .35)) : lerp(-.24, .03, ease((f - .7) / .3));
  const H1 = HALL_POSE.hall[0], zk = ease(kOf(t, TL.ZOOM)) * (1 - ease(kOf(t, TL.ZOOM_OUT)));
  if (zk > 0) { const tg = [H1[0], 1.62, H1[1] + .4]; yaw = lerp(yaw, Math.atan2(tg[0] + .3, tg[2] - z), zk); pitch = lerp(pitch, Math.atan2(tg[1] - 1.55, tg[2] - z), zk); fov = lerp(58, 22, zk); }
  const s = .5 + .5 * fov / 58;
  return { cam: { x: -.3, y: 1.55 - h.y, z, yaw: yaw + h.yaw * s, pitch: pitch + h.pitch * s, fov }, h };
}
function poseHall2(t) {
  const h = handheld(t, 0, 0, false, 1.0), z = leonHallZ(t), H1 = HALL_POSE.hall2[0];
  const yaw = Math.atan2(H1[0] + .3, H1[1] + .2 - z) + .02, pitch = Math.atan2(1.5 - 1.55, H1[1] - z) - .02;
  return { cam: { x: -.3, y: 1.55 - h.y, z, yaw: yaw + h.yaw, pitch: pitch + h.pitch, fov: 58 }, h };
}
function shotHall(g, fg, t, second) {
  const { cam: cs, h } = second ? poseHall2(t) : poseHall(t), cc = mkCam(cs);
  const Lt = { amb: .04, moon: .7, emer: emerA(t) * .9, exit: 1 };
  const figs = hallHorses(t).map(H => add3(H.p, [0, .1, 0]));
  const yawOff = .04 + .03 * Math.sin(t * 1.9), pitchOff = second ? -.03 : -.07;
  const T = { hand: handBeam(cc, cs, yawOff, pitchOff, (o, d) => boxHit(o, d, -HWH, HWH, HHT, HLEN, figs)), spill: .08 };
  hallView(g, t, cs, Lt, T);
  fg.clearRect(0, 0, W, H);
  const hx = 915 + h.yaw * -120, hy = 712 + h.y * 380, vp = project(cc, add3([cs.x, cs.y, cs.z], [Math.sin(cs.yaw + yawOff) * 6, -.3, Math.cos(cs.yaw + yawOff) * 6])) || [540, 430];
  armTorch(fg, hx, hy, Math.atan2(vp[1] - hy, vp[0] - hx), .45);
  let bgBlur = 7 * Math.exp(-(t - (second ? SH.hall2[1] : SH.hall[1])) / .22), noise = .2;
  if (!second && t > TL.RISE[1] && t < TL.RISE[1] + .7) bgBlur += 3 * Math.sin(kOf(t, [TL.RISE[1], TL.RISE[1] + .7]) * Math.PI);   // focus hunts on it
  if (!second && t > TL.ZOOM[0] && t < TL.ZOOM[1] + .4) bgBlur += 2.5 * Math.abs(Math.sin(kOf(t, [TL.ZOOM[0], TL.ZOOM[1] + .4]) * Math.PI * 2));
  return { roll: h.roll, bgBlur, fgBlur: 0, noise };
}

// ---------------------------------------------------------------- CCTV playback (6 fps)
function zoomInto(dst, src, z, f, k) {
  let tx = lerp(f[0], W / 2, k), ty = lerp(f[1], H / 2, k);
  tx = clamp(tx, W - (W - f[0]) * z, f[0] * z); ty = clamp(ty, H - (H - f[1]) * z, f[1] * z);
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.fillStyle = '#000'; dst.fillRect(0, 0, W, H);
  dst.setTransform(z, 0, 0, z, tx - f[0] * z, ty - f[1] * z); dst.drawImage(src, 0, 0); dst.setTransform(1, 0, 0, 1, 0, 0);
}
function readout(g, z, mode = 'play') {
  g.save(); g.font = '38px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,235,.88)';
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2; g.shadowOffsetY = 2;
  g.fillText(mode === 'pause' ? `PAUSE  x${z.toFixed(1)}` : mode === 'step' ? `STEP +1  x${z.toFixed(1)}` : `PLAYBACK  x${z.toFixed(1)}`, W / 2, 32); g.restore();
}
function stampAt(t) {
  const [h0, m0, s0] = t < SH.cctv2[1] ? TL.STAMP0 : TL.STAMP1, s = h0 * 3600 + m0 * 60 + s0 + Math.floor(t < SH.cctv2[1] ? t : t - SH.cctv2[1]), p = n => String(n).padStart(2, '0');
  return `${TL.DATE}  ${p(Math.floor(s / 3600) % 24)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
}
const SNAP_TILT = -0.6;
let HEAD_W = [0, 1.6, 6], VANISH_P = null, H1_CAM22 = null, SNAP_NECK = { yaw: 1.6, pitch: .6, roll: .5 };
// CAM 21's tape time: paused on the frame before the horse goes, stepped one frame, then played on
function cctv1Time(t) {
  const f0 = qf(TL.VANISH), f1 = f0 + 1 / FPS_CCTV;
  if (t < TL.PAUSE[0]) return [qf(t), 'play'];
  if (t < TL.PAUSE[1]) return [f0, 'pause'];
  if (t < TL.PLAY) return [f1, 'step'];
  return [qf(f1 + (t - TL.PLAY)), 'play'];
}
function shotCctv(s, t) {
  let tq = qf(t), mode = 'play';
  if (s[0] === 'cctv1') [tq, mode] = cctv1Time(t);
  let Z = { z: 1, f: [W / 2, H / 2], k: 0 }, place = 'CENTER COURT', camName = 'CAM 21';
  if (s[0] === 'cctv1') {
    const L = { amb: .2, moon: .9, exit: 1 };
    const b = mkCam(CAM21), o = [LEON_COURT[0] + .2, 1.17, LEON_COURT[1] + .2], d = nrm3([.1, -.12, 1]), hit = courtHit(o, d);
    courtView(RG, tq, CAM21, L, { world: [{ c: hit, ax: [.9, 0, 0], ay: [0, .9, 0], a: .9 }, { c: add3(o, [0, -1.17, 2.0]), ax: [.6, 0, 0], ay: [0, 0, 1.4], a: .35 }] }, { leon: true });
    // the zoom follows the horse that goes (then its empty pole) round toward the camera
    const k = ease(kOf(t, TL.PUSH1)) * (t < TL.PLAY ? 1 : 1 - ease(kOf(t, [TL.PLAY + .2, TL.PLAY + 1.2])) * .5), a = phiAt(tq) + VANISH_I * TAU / NO;
    const fp = project(mkCam(CAM21), [RO * Math.cos(a), 1.25, RO * Math.sin(a)]) || VANISH_P;
    Z = { z: lerp(1, 1.75, k), f: [lerp(W / 2, fp[0], k), lerp(H / 2, fp[1], k)], k: Math.min(1, 1.6 * k) };
  } else {
    camName = 'CAM 22'; place = 'EAST HALL';
    const L = { amb: .2, moon: .7, emer: emerA(tq) * .95, exit: 1 }, z = leonHallZ(tq);
    const hs = hallHorses(tq), o = [-.05, 1.17, z + .2], tgt = add3(hs[0].p, [0, -.15, 0]), d = nrm3(sub3(tgt, o)), hit = add3(o, mul3(d, len3(sub3(tgt, o)) - .3));
    // the crash zoom at the end is rendered through a narrower lens aimed at the head (so the face stays sharp at x4)
    const c = s[0] === 'cctv3' ? ease(kOf(t, TL.CRASH)) : 0;
    let camSpec = CAM22;
    if (c > 0) {
      const zz = lerp(1.45, 4.2, c), fov = 2 * Math.atan(Math.tan(CAM22.fov * Math.PI / 360) / zz) * 360 / TAU, Rr = TK.rng(Math.floor(t * 60) + 5), sh = 2.2 * Math.exp(-(t - TL.CRASH[0]) * 6) / 100;
      camSpec = lookAt([CAM22.x, CAM22.y, CAM22.z], add3(lerp3([-.9, .8, 7.6], HEAD_W, c), [(Rr() - .5) * sh, (Rr() - .5) * sh, 0]), fov);
    }
    hallView(RG, tq, camSpec, L, { world: [{ c: hit, ax: [.75, 0, 0], ay: [0, .75, 0], a: c > 0 ? .3 : .55 }, { c: [o[0], 0, (o[2] + tgt[2]) / 2], ax: [.6, 0, 0], ay: [0, 0, .9], a: .3 }] }, { leon: true });
    if (c > 0) Z = { z: 1, f: [W / 2, H / 2], k: 0, shown: lerp(1.45, 4.2, c) };
    else if (s[0] === 'cctv2') { const k = ease(kOf(t, [SH.cctv2[1] + .4, SH.cctv2[2]])); Z = { z: lerp(1, 1.3, k), f: [lerp(W / 2, H1_CAM22[0], k), lerp(H / 2, H1_CAM22[1], k)], k: .4 * k }; }
    else {
      const k = ease(kOf(t, [SH.cctv3[1] + .2, TL.TURN[0]])), head = H1_CAM22;
      Z = { z: lerp(1, 1.45, k), f: [lerp(W / 2, head[0], k), lerp(H / 2, head[1], k)], k: .45 * k };
    }
  }
  zoomInto(WK, RAW, Z.z, Z.f, Z.k);
  TK.grade(WG, WORK, mode === 'play' ? tq : t, 'cctv');
  const gk = glitchAt(t); TK.vhs(WG, mode === 'play' ? tq : t, gk ? 2.5 : 1, 5);
  if (mode !== 'play') { const y = 560 + 40 * Math.sin(t * 2.3); WG.save(); WG.globalAlpha = .55; WG.drawImage(WG.canvas, 0, y, W, 26, 6, y, W, 26); TK.statics(WG, t, 0); WG.restore(); WG.fillStyle = 'rgba(255,255,255,.12)'; WG.fillRect(0, y, W, 3); }
  if (gk) { tear(WG, t, Math.sin(gk[0] * Math.PI)); TK.statics(WG, t, .4 * Math.sin(gk[0] * Math.PI)); }
  const roll = s[0] === 'cctv1' ? TL.ROLL1 : s[0] === 'cctv2' ? TL.ROLL2 : [s[1], s[1] + .3];
  if (t < roll[1]) trackingRoll(WG, t, kOf(t, roll));
  TK.osd(WG, 'cctv', mode === 'play' ? t : 0, { cam: camName, place, stamp: stampAt(s[0] === 'cctv1' ? tq : t) });
  readout(WG, Z.shown || Z.z, mode);
  if (mode !== 'play') {                                                                      // the archivist's frame marker
    WG.save(); WG.strokeStyle = 'rgba(240,240,236,.9)'; WG.lineWidth = 4; WG.shadowColor = 'rgba(0,0,0,.8)'; WG.shadowBlur = 4;
    const x0 = 330, y0 = 215, x1 = 750, y1 = 575, L = 46;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { WG.beginPath(); WG.moveTo(x + sx * L, y); WG.lineTo(x, y); WG.lineTo(x, y + sy * L); WG.stroke(); }
    WG.restore();
  }
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
  g.textAlign = 'right'; g.fillText(camTime(t), W - 36, H - 128); g.fillText('DEC.04.1999', W - 36, H - 82); g.restore();
}
const camTime = t => t < TL.RECCUT[0] ? 'AM 1:50' : 'AM 1:52';
function gainNoise(g, t, a) {
  TK.statics(NZG, t * 1.37 + 3, 1);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .42; g.drawImage(NZ, 0, 0); g.restore();
}
function camcorder(s, t) {
  const r = s[0] === 'court' ? shotCourt(RG, FGG, t) : shotHall(RG, FGG, t, s[0] === 'hall2');
  WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, W, H);
  WK.translate(540, 405); WK.rotate(r.roll || 0); WK.scale(1.05, 1.05); WK.translate(-540, -405);
  WK.filter = `blur(${(r.bgBlur || 0).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0);
  WK.filter = `blur(${(r.fgBlur || 0).toFixed(2)}px)`; WK.drawImage(FG, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
  TK.grade(WG, WORK, t, 'camcorder', { brightness: (s[0] === 'court' ? 1.12 : 1) * .99 + .05 * Math.sin(t * 1.7) + .03 * Math.sin(t * 4.3) });
  if (r.noise) gainNoise(WG, t, r.noise);
  const gk = glitchAt(t); TK.vhs(WG, t, gk ? 2.2 : .9, 6);
  if (gk) { tear(WG, t, Math.sin(gk[0] * Math.PI)); TK.statics(WG, t, .35 * Math.sin(gk[0] * Math.PI)); }
  TK.osd(WG, 'camcorder', t, { time: camTime(t), date: 'DEC.04.1999', battery: 1 });
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const s = shotAt(t), inStatic = !s || TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) TK.statics(WG, t, 1);
  else if (recCut(t)) standby(WG, t);
  else if (s[0].startsWith('cctv')) shotCctv(s, t);
  else camcorder(s, t);
  if (!inStatic && !recCut(t)) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) (v.pos === 'top' ? capTop : TK.caption)(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: clamp((t - .8) / .6) });
}
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound only)
// Everything is something in the scene, picked up by his camcorder mic or a CCTV ceiling mic: the carousel turning (its
// platform and cranks), its band organ playing with no power (slow, dragging, sagging), the court's quiet, his steps, breath
// and hands, the emergency light's relay, the horses (a wooden creak, a pole on the tiles). space: close (at his mic), shop
// (the place the camera is in), hall (far off: the organ heard from the hall), tape / archive (after the recording chain).
function buildEvents() {
  const EV = [], cq = x => +(Math.ceil(x * FPS_CCTV - 1e-6) / FPS_CCTV).toFixed(3);
  // the emergency light's relay clicks on its drop-outs (hall shots)
  const ticks = []; let prev = 1;
  for (let f = Math.round(TL.FLICK * 12); f / 12 < TL.END; f++) {
    const t = f / 12, s = shotAt(t); if (!s || !['hall', 'cctv2', 'hall2', 'cctv3'].includes(s[0])) { prev = 1; continue; }
    const tt = s[0].startsWith('cctv') ? cq(t) : t, a = emerA(s[0].startsWith('cctv') ? qf(t) : t);
    if (Math.abs(a - prev) > .4 && !ticks.some(x => Math.abs(x - tt) < .05)) ticks.push(+tt.toFixed(3));
    prev = a;
  }
  EV.push(
    // S1: the court. The ride (platform and cranks) and its organ, the court's quiet under them
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: 0, t1: SH.court[2], g: -41, fin: .01, fout: .02 },
    { type: 'bed', fx: 'carousel_mech', space: 'shop', t: 0, t1: SH.court[2], g: -38, fin: .01, fout: .02 },
    { type: 'bed', fx: 'organ_drag', space: 'shop', t: 0, t1: SH.court[2], g: -35, fin: .01, fout: .02 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: .3, t1: SH.court[2], g: -35, fin: .5, fout: .02 },
    ...TL.STEPS1.map((t, i) => ({ type: 'step', t, g: .7, pan: i ? .1 : -.1 })),
    // S2: CAM 21's own mic (the ride closer to it, more of the mechanism)
    { type: 'vcr', t: TL.ROLL1[0] },
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.cctv1[1], t1: SH.cctv1[2], g: -39, fin: .01, fout: .01 },
    { type: 'bed', fx: 'carousel_mech', space: 'shop', t: SH.cctv1[1], t1: SH.cctv1[2], g: -33, fin: .01, fout: .01 },
    { type: 'bed', fx: 'organ_drag', space: 'shop', t: SH.cctv1[1], t1: SH.cctv1[2], g: -33, fin: .01, fout: .01 },
    { type: 'vcr', t: TL.PAUSE[0], g: .7 }, { type: 'mute', t: TL.PAUSE[0] + .03, t1: TL.PLAY + .02 },
    { type: 'vcr', t: TL.STEP[0], g: .35 }, { type: 'vcr', t: TL.PLAY, g: .8 },
    ...TL.RECCUT.map(c => ({ type: 'camclick', t: c + .16 })),
    // S3-S6: the east hall. The organ far behind him in the court; the hall's quiet; the emergency light
    { type: 'bed', fx: 'hall_tone', space: 'shop', t: SH.hall[1] + .16, t1: TL.END, g: -39, fin: .02, fout: .02 },
    { type: 'bed', fx: 'organ_drag', space: 'hall', t: SH.hall[1] + .16, t1: SH.cctv3[1], g: -41, fin: .02, fout: .01 },
    { type: 'bed', fx: 'organ_slow', space: 'hall', t: SH.cctv3[1], t1: TL.DEAD, g: -39, fin: .01, fout: .006 },
    { type: 'bed', fx: 'mech_far', space: 'hall', t: SH.hall[1] + .16, t1: TL.DEAD, g: -46, fin: .02, fout: .006 },
    ...ticks.map(t => ({ type: 'tick', t, g: .5 })),
    ...TL.STEPS.map((t, i) => ({ type: 'step', t, g: .85, pan: i % 2 ? .1 : -.1 })),
    { type: 'bed', fx: 'breath_bed', space: 'close', t: TL.WALK[1], t1: SH.hall[2] - .05, g: -34, fin: .8, fout: .05 },
    { type: 'breath', t: TL.RISE[1] + .1, g: .8 },
    { type: 'rustle', t: TL.FIND[0] + .05, g: .5 },
    { type: 'scuff', t: TL.STEP_BACK + .05, g: .7 },
    { type: 'vcr', t: TL.ROLL2[0] },
    { type: 'creak', t: cq(SH.cctv2[1] + .9), g: .45 },
    { type: 'vcr', t: SH.hall2[1] },
    { type: 'bed', fx: 'near_breath', space: 'close', t: SH.hall2[1] + .05, t1: SH.hall2[2] - .02, g: -32, fin: .2, fout: .05 },
    { type: 'vcr', t: SH.cctv3[1] },
    { type: 'bed', fx: 'near_breath', space: 'shop', t: SH.cctv3[1] + .1, t1: TL.DEAD, g: -33, fin: .3, fout: .01 },
    // the end, on CAM 22: each held turn of the head a small wooden creak; the snap a crack; the pole across the tiles;
    // then the organ and the ride stop dead: nothing but the tape
    ...TL.TURN.map(t => ({ type: 'creak', t: cq(t), g: .7 })),
    { type: 'crack', t: cq(TL.SNAP) },
    { type: 'scrape', t: cq(TL.SCRAPE[0]) },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    // the horse that goes on CAM 21: the one nearest the camera at that moment
    // the horse that goes on CAM 21: a pale one near the middle of the picture at that moment (seen side-on against the
    // dark column, so the zoom can hold it still in the centre while the ride turns under it)
    const phi = phiAt(TL.VANISH), c21 = mkCam(CAM21);
    let best = 1e9; for (let i = 0; i < NO; i++) {
      if (GONE0.includes(i) || COLS[i][0] + COLS[i][1] + COLS[i][2] < 600) continue;
      const a = phi + i * TAU / NO, p = project(c21, [RO * Math.cos(a), 1.3, RO * Math.sin(a)]); if (!p) continue;
      const d = Math.hypot(p[0] - W / 2, p[1] - H * .45); if (d < best) { best = d; VANISH_I = i; }
    }
    const a = phi + VANISH_I * TAU / NO; VANISH_P = project(c21, [RO * Math.cos(a), 1.3, RO * Math.sin(a)]);
    { // at the snap the head looks straight up the lens: its yaw and lift, in the horse's own frame, from where CAM 22 hangs
      const H0 = hallHorses(TL.TURN[0] - .2)[0], kp = horseWorld(H0)({ v: KINK, grp: 0 }), d = sub3([CAM22.x, CAM22.y, CAM22.z], kp);
      const dl = rotY(d, -H0.yaw);
      // the snap: the head's painted side turned full on to the lens (its eye on the camera), the head hanging over sideways
      // with the muzzle down, further round than any neck turns. A rotation taking the head's own frame (side, along, up)
      // to (toward the lens, hanging, across)
      const c = nrm3(dl), f0 = nrm3(cross3([0, 1, 0], c));
      const rc = (v, a) => add3(add3(mul3(v, Math.cos(a)), mul3(cross3(c, v), Math.sin(a))), mul3(c, dot3(c, v) * (1 - Math.cos(a))));
      const f = rc(f0, SNAP_TILT), u = cross3(f, c), x0 = [1, 0, 0], d0 = nrm3([0, -.545, .838]), u0 = cross3(d0, x0);
      const M = [0, 1, 2].map(i => [0, 1, 2].map(j => c[i] * x0[j] + f[i] * d0[j] + u[i] * u0[j]));
      SNAP_NECK = { M };
    }
    const hs = hallHorses(TL.SCRAPE[1] + .01), toW = horseWorld(hs[0]);
    HEAD_W = toW({ v: [0, .47, .7], grp: 1 });
    H1_CAM22 = project(mkCam(CAM22), HEAD_W);
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
