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

// ---------------------------------------------------------------- a carousel horse in 3D: tapered capsules (horse-local: x right,
// y up, z forward, the saddle at the origin); the head group turns about the middle of the neck
const HSEG = [];
(function () {
  const S = (n, a, b, ra, rb, part, grp = 0) => HSEG.push({ n, a, b, ra, rb, part, grp });
  S('tail', [0, -.02, -.58], [0, -.36, -.86], .065, .025, 'mane');
  for (const s of [-1, 1]) {
    S('h1', [s * .11, -.22, -.42], [s * .11, -.48, -.68], .075, .05, 'body'); S('h2', [s * .11, -.48, -.68], [s * .11, -.58, -.92], .045, .035, 'body'); S('h3', [s * .11, -.58, -.92], [s * .11, -.6, -1.0], .036, .036, 'hoof');
  }
  S('torso', [0, -.13, -.48], [0, -.1, .38], .21, .23, 'body');
  S('saddle', [0, .08, -.16], [0, .08, .12], .13, .13, 'saddle');
  S('cloth', [0, -.04, -.2], [0, -.04, .16], .2, .2, 'saddle');
  for (const s of [-1, 1]) {
    S('f1', [s * .11, -.2, .4], [s * .11, -.36, .64], .065, .05, 'body'); S('f2', [s * .11, -.36, .64], [s * .11, -.58, .52], .045, .035, 'body'); S('f3', [s * .11, -.58, .52], [s * .11, -.62, .46], .036, .036, 'hoof');
  }
  S('neck1', [0, -.02, .38], [0, .2, .6], .16, .13, 'body');
  S('mane1', [.04, .1, .33], [.04, .31, .53], .07, .06, 'mane');
  S('neck2', [0, .2, .6], [0, .4, .72], .13, .11, 'body', 1);
  S('mane2', [.04, .31, .53], [.04, .5, .66], .06, .05, 'mane', 1);
  S('head', [0, .46, .72], [0, .24, 1.0], .1, .072, 'body', 1);
  S('cheek', [0, .4, .76], [0, .35, .83], .095, .088, 'body', 1);
  S('forelock', [0, .53, .73], [0, .48, .81], .032, .02, 'mane', 1);
  for (const s of [-1, 1]) S('ear', [s * .045, .53, .69], [s * .05, .61, .67], .022, .008, 'body', 1);
})();
const KINK = [0, .2, .6];
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const rotX = (p, a) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const rotZ = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
function horseWorld(H) {
  const sc = H.small || 1, nk = H.neck;
  return p => {
    let q = p;
    if (nk && q.grp) {
      let v = sub3(q.v, KINK);
      v = rotZ(rotX(rotY(v, nk.yaw), -nk.pitch), nk.roll);
      if (nk.kink) v = add3(v, [.05, -.07, 0]);                                                // the break shows: the upper neck sits off the lower
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
function capsule(g, A, B, ra, rb, col) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1e-3, ang = Math.atan2(dy, dx);
  let nx = -dy / L, ny = dx / L; if (ny > 0) { nx = -nx; ny = -ny; }                            // n points up the screen (the lit side)
  const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, r = Math.max(ra, rb);
  const gr = g.createLinearGradient(mx + nx * r, my + ny * r, mx - nx * r, my - ny * r);
  gr.addColorStop(0, rgb(col, .62)); gr.addColorStop(.3, rgb(col, 1.04)); gr.addColorStop(.65, rgb(col, .86)); gr.addColorStop(1, rgb(col, .42));
  g.beginPath(); g.arc(A[0], A[1], ra, ang + Math.PI / 2, ang + 3 * Math.PI / 2); g.arc(B[0], B[1], rb, ang - Math.PI / 2, ang + Math.PI / 2); g.closePath();
  g.fillStyle = gr; g.fill();
}
function drawHorse(g, cam, H, light) {
  const toW = horseWorld(H), segs = [];
  const P = p => { const q = cam.toCam(p); return q[2] > .08 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; };
  const k = light, sc = H.small || 1;
  const COL = { body: H.col, mane: H.col[0] > 120 ? [92, 70, 52] : [26, 22, 20], saddle: H.saddle, trim: [206, 168, 74], hoof: [46, 40, 36] };
  // the brass pole through the saddle (broken off at the top for the ones off the ride)
  const base = H.p, tilt = H.tilt || 0, lean = y => [base[0] + Math.sin(tilt) * Math.cos(H.yaw) * (y - base[1]), y, base[2] - Math.sin(tilt) * Math.sin(H.yaw) * (y - base[1])];
  const p0 = P(lean(H.pole[0])), p1 = P(lean(H.pole[1]));
  if (p0 && p1) { const r = Math.max(.6, cam.f * .028 / ((p0[2] + p1[2]) / 2)); capsule(g, p0, p1, r, r, [196, 162, 84].map(c => c * k)); if (H.broken) { g.fillStyle = rgb([120, 96, 50], k); g.beginPath(); g.arc(p1[0], p1[1], r * 1.2, 0, TAU); g.fill(); } }
  for (const s of HSEG) {
    const a = P(toW({ v: s.a, grp: s.grp })), b = P(toW({ v: s.b, grp: s.grp }));
    if (!a || !b) continue;
    segs.push({ a, b, ra: cam.f * s.ra * sc / a[2], rb: cam.f * s.rb * sc / b[2], col: COL[s.part].map(c => c * k), d: (a[2] + b[2]) / 2 + (s.part === 'saddle' ? -.08 : s.part === 'trim' ? -.03 : 0) });
  }
  segs.sort((x, y) => y.d - x.d);
  for (const s of segs) capsule(g, s.a, s.b, s.ra, s.rb, s.col);
  // the painted eye (on the side facing the camera), a nostril, the open mouth
  const camPos = [cam.x, cam.y, cam.z];
  for (const sd of [-1, 1]) {
    const e = toW({ v: [sd * .085, .43, .81], grp: 1 }), e2 = toW({ v: [sd * .2, .43, .81], grp: 1 }), nrm = sub3(e2, e);
    if (dot3(nrm3(nrm), nrm3(sub3(camPos, e))) < -.2) continue;
    const p = P(e); if (!p) continue;
    const r = cam.f * .024 * sc / p[2];
    ell(g, p[0], p[1], r * 1.25, r, rgb([236, 232, 220], Math.min(1.15, k * 1.1)));
    ell(g, p[0], p[1], r * .72, r * .74, 'rgb(14,12,12)');
    if (k > .35) ell(g, p[0] - r * .25, p[1] - r * .3, r * .22, r * .18, `rgba(255,255,255,${Math.min(.9, k)})`);
    const n1 = P(toW({ v: [sd * .04, .26, .99], grp: 1 })); if (n1) ell(g, n1[0], n1[1], r * .45, r * .35, 'rgb(20,16,14)');
  }
  for (const sd of [-1, 1]) {
    const r0 = P(toW({ v: [sd * .09, .45, .74], grp: 1 }));
    if (r0 && dot3(nrm3(sub3(toW({ v: [sd * .3, .45, .74], grp: 1 }), toW({ v: [sd * .09, .45, .74], grp: 1 }))), nrm3(sub3(camPos, toW({ v: [sd * .09, .45, .74], grp: 1 })))) > 0) ell(g, r0[0], r0[1], cam.f * .022 * sc / r0[2], cam.f * .022 * sc / r0[2], rgb([206, 168, 74], k));
  }
  if (H.neck && H.neck.kink) {                                                             // the crack where the neck broke
    const c0 = P(toW({ v: [-.15, .2, .6], grp: 0 })), c1 = P(toW({ v: [.15, .2, .6], grp: 0 }));
    if (c0 && c1) { g.strokeStyle = 'rgba(10,8,8,.9)'; g.lineWidth = Math.max(1.2, cam.f * .012 / c0[2]); g.beginPath();
      for (let i = 0; i <= 6; i++) { const u = i / 6, j = (i % 2 ? 1 : -1) * cam.f * .02 / c0[2]; g.lineTo(lerp(c0[0], c1[0], u), lerp(c0[1], c1[1], u) + j); } g.stroke(); }
  }
  const m0 = P(toW({ v: [0, .21, .97], grp: 1 })), m1 = P(toW({ v: [0, .27, .84], grp: 1 }));
  if (m0 && m1) { g.strokeStyle = 'rgba(16,12,10,.9)'; g.lineWidth = Math.max(1.2, cam.f * .03 * sc / m0[2]); g.lineCap = 'round'; g.beginPath(); g.moveTo(m0[0], m0[1]); g.lineTo(m1[0], m1[1]); g.stroke(); }   // the carved open mouth
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
  const Lt = { amb: .05, moon: .85, exit: 1 };
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
let VANISH_P = null, H1_CAM22 = null, SNAP_NECK = { yaw: 1.6, pitch: .6, roll: .5 };
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
    hallView(RG, tq, CAM22, L, { world: [{ c: hit, ax: [.75, 0, 0], ay: [0, .75, 0], a: .55 }, { c: [o[0], 0, (o[2] + tgt[2]) / 2], ax: [.6, 0, 0], ay: [0, 0, .9], a: .3 }] }, { leon: true });
    if (s[0] === 'cctv2') { const k = ease(kOf(t, [SH.cctv2[1] + .4, SH.cctv2[2]])); Z = { z: lerp(1, 1.3, k), f: [lerp(W / 2, H1_CAM22[0], k), lerp(H / 2, H1_CAM22[1], k)], k: .4 * k }; }
    else {
      const k = ease(kOf(t, [SH.cctv3[1] + .2, TL.TURN[0]])), c = ease(kOf(t, TL.CRASH)), R = TK.rng(Math.floor(t * 60) + 5), sh = t > TL.CRASH[0] ? 12 * Math.exp(-(t - TL.CRASH[0]) * 6) : 0;
      const head = H1_CAM22;
      Z = { z: lerp(lerp(1, 1.45, k), 2.4, c), f: [lerp(W / 2, head[0], Math.max(k, c)) + (R() - .5) * sh, lerp(H / 2, head[1] - 40 * c, Math.max(k, c)) + (R() - .5) * sh], k: lerp(.45 * k, .85, c) };
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
  readout(WG, Z.z, mode);
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
  TK.grade(WG, WORK, t, 'camcorder', { brightness: .99 + .05 * Math.sin(t * 1.7) + .03 * Math.sin(t * 4.3) });
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
      // past the lens: the head turned further than any neck turns, lying over on its side, one painted eye on the camera
      SNAP_NECK = { yaw: Math.atan2(dl[0], dl[2]) + 1.1, pitch: .3, roll: .95 };
    }
    const hs = hallHorses(TL.SCRAPE[1] + .01), toW = horseWorld(hs[0]);
    H1_CAM22 = project(mkCam(CAM22), toW({ v: [0, .4, .8], grp: 1 }));
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
