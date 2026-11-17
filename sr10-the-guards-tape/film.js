// STILL RECORDING, tape 10: "The Guard's Tape". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white, TK.ghost 'broken'). Script: channel/scripts/SR10_the_guards_tape.md
// One camcorder shot in the security office. The camcorder is on the two desk monitors: left, the VCR plays Leon's own
// camcorder tape of his 3:01 round; right, the same minute on CAM 14: BROKEN right behind him. Then CAM 02, live: this office,
// it behind his chair. He turns round with the camcorder: nothing. He turns back: it is bent over him. Scare type: A HAND
// OVER THE LENS FROM BEHIND (long black fingers close over the camcorder; the monitors' light between them). Not a flash
// (tape 7), not right beside him (tape 8), not movement alone (tape 9), not a jump at the lens (tape 6).
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const W = TK.TW, H = TK.TH;
const RAW = mk(W, H), RG = RAW.getContext('2d'), FG = mk(W, H), FGG = FG.getContext('2d'), NZ = mk(W, H), NZG = NZ.getContext('2d');
const WORK = mk(W, H), WK = WORK.getContext('2d'), WIN = mk(W, H), WG = WIN.getContext('2d'), TMP = mk(W, H), TG = TMP.getContext('2d');
const LMAP = mk(W, H), LG = LMAP.getContext('2d'), ALB = mk(W, H), ALG = ALB.getContext('2d');
// the two monitors' pictures (each a full tape window): A = the VCR (his 3:01 camcorder tape), B = the CCTV monitor
const RAWA = mk(W, H), RAG = RAWA.getContext('2d'), FA = mk(W, H), FAG = FA.getContext('2d');
const RAWB = mk(W, H), RBG = RAWB.getContext('2d'), FB = mk(W, H), FBG = FB.getContext('2d');
const PAUSED = mk(W, H), PAUSED2 = mk(W, H), THUMB02 = mk(W, H);
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, M = TK.motion, PI = Math.PI;
const qf = t => Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;
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
function mkCam(c) {
  const f = .5 * W / Math.tan(c.fov * PI / 360), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  return Object.assign({}, c, { f, W, H, toCam(p) { const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; } });
}
function prep(q) {
  const P = q.p, c = [0, 1, 2].map(i => (P[0][i] + P[1][i] + P[2][i] + P[3][i]) / 4);
  const u = [0, 1, 2].map(i => P[1][i] - P[0][i]), v = [0, 1, 2].map(i => P[3][i] - P[0][i]);
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n) || 1; n = n.map(x => x / l);
  q.c = c; q.n = n;
}
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function litScene(S, fn) {
  const out = new TK.Scene(), m = (c, f) => [c[0] * f[0], c[1] * f[1], c[2] * f[2]];
  out.q = S.q.map(q => { if (q.emit) return q; const f = fn(q); return Object.assign({}, q, { col: m(q.col, f), textCol: q.textCol && m(q.textCol, f) }); });
  return out;
}
function handheld(t, t0, rate, walking, nerve) {
  const ph = (t - t0) * rate, step = walking ? Math.abs(Math.sin(ph * PI)) : 0;
  const n = k => Math.sin(t * 1.3 * k + k) * .6 + Math.sin(t * 2.9 * k + 2 * k) * .3 + Math.sin(t * 7.1 * k) * .1;
  const amp = .01 + .02 * nerve;
  return { y: step * .03 + n(1.1) * amp * .5, yaw: n(.9) * amp * .8 + (walking ? Math.sin(ph * PI * .5) * .015 : 0), pitch: n(1.7) * amp * .5, roll: n(.7) * amp * .6 + (walking ? Math.sin(ph * PI) * .008 : 0) };
}
const p2 = n => String(n).padStart(2, '0');
function stamp(base, secs) { const s = base[0] * 3600 + base[1] * 60 + base[2] + Math.floor(secs); return `${TL.DATE}  ${p2(Math.floor(s / 3600) % 24)}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`; }

// ================================================================ THE SERVICE CORRIDOR (tape 8), on the 3:01 tapes
// x -1.2..1.2, z 0..8: the fire door at z 8 (shut tonight), the double door to the office corridor at z 0, CAM 14 on the
// ceiling at z .9 looking down the corridor at the fire door
const HW = 1.2, LEN = 8, HT = 2.7, OX = .5, OH = 2.1, LW = .98, LH = 2.08, LT = .05, TUBE_Z = 4.4;
const CAM14 = { x: .9, y: 2.45, z: .5, yaw: Math.atan2(-.9, 6.5), pitch: Math.atan2(1.3 - 2.45, 6.56), fov: 46 }, TUBE2_Z = 7.0;
const SHIRT = [140, 156, 182], TROUS = [34, 38, 52], CAP = [28, 32, 50], SKIN = [182, 140, 112];
const wallColC = (y, r) => (y < 1.0 ? [92, 108, 98] : [178, 180, 168]).map(c => c * (.93 + r * .1));
function corridor(S) {
  const R = TK.rng(11), ez = LEN;
  const fl = [[128, 126, 120], [119, 117, 112], [124, 122, 116]];
  for (let i = 0; i < 20; i++) for (let j = 0; j < 6; j++) {
    const z = i * .4, x = -HW + j * .4;
    if (i >= 17 && j >= 1 && j <= 4) continue;
    S.quad([[x, 0, z], [x + .4, 0, z], [x + .4, 0, z + .4], [x, 0, z + .4]], fl[(i * 7 + j * 3) % 3], { floor: true });
  }
  for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) {
    const z = 6.8 + i * .2, x = -.8 + j * .2, y = (i + j) % 4 < 2;
    S.quad([[x, 0, z], [x + .2, 0, z], [x + .2, 0, z + .2], [x, 0, z + .2]], y ? [204, 168, 44] : [46, 44, 40], { floor: true });
  }
  for (const s of [-1, 1]) {
    const x = s * HW;
    for (let row = 0; row < 14; row++) {
      const y0 = row * .2, y1 = Math.min(HT, y0 + .2), off = row % 2 ? .2 : 0;
      for (let z0 = -off; z0 < LEN - 1e-6; z0 += .4) {
        const a = Math.max(0, z0), b = Math.min(LEN, z0 + .4); if (b - a < .01) continue;
        const c = wallColC(y0 + .01, R());
        S.quad(s < 0 ? [[x, y0, b], [x, y0, a], [x, y1, a], [x, y1, b]] : [[x, y0, a], [x, y0, b], [x, y1, b], [x, y1, a]], c);
      }
    }
  }
  for (let z = 0; z < LEN; z++) for (let i = 0; i < 3; i++) {
    const x = -HW + i * .8;
    S.quad([[x, HT, z + 1], [x + .8, HT, z + 1], [x + .8, HT, z], [x, HT, z]], ((z + i) & 1) ? [96, 96, 94] : [104, 104, 100]);
  }
  // the far end: block wall round the fire door, its frame, the EXIT sign, the stencilled 14
  const endQ = (x0, x1, y0, y1, c) => S.quad([[x0, y0, ez], [x1, y0, ez], [x1, y1, ez], [x0, y1, ez]], c);
  for (let row = 0; row < 14; row++) {
    const y0 = row * .2, y1 = Math.min(HT, y0 + .2), off = row % 2 ? .17 : 0;
    const spans = y0 >= OH + .06 - 1e-6 ? [[-HW, HW]] : [[-HW, -OX - .06], [OX + .06, HW]];
    for (const [a0, a1] of spans) for (let x0 = a0 - off; x0 < a1 - 1e-6; x0 += .34) {
      const a = Math.max(a0, x0), b = Math.min(a1, x0 + .34); if (b - a < .01) continue;
      endQ(a, b, y0, y1, wallColC(y0 + .01, R()));
    }
  }
  const fc = [72, 82, 76];
  S.box(-OX - .06, 0, ez - .04, -OX, OH + .06, ez, fc); S.box(OX, 0, ez - .04, OX + .06, OH + .06, ez, fc); S.box(-OX, OH, ez - .04, OX, OH + .06, ez, fc);
  S.box(-.22, 2.24, ez - .1, .22, 2.44, ez, [196, 196, 190]);
  S.quad([[.7, 1.92, ez - .004], [1.06, 1.92, ez - .004], [1.06, 2.3, ez - .004], [.7, 2.3, ez - .004]], [178, 180, 168], { text: '14', textCol: [24, 24, 26] });
  // the fire door, shut: its corridor face, the push bar, the signs
  const P = (a, y, b) => [-OX + a, y, ez + b];
  const face = (a0, a1, y0, y1, b, col, o) => S.quad([P(a0, y0, b), P(a1, y0, b), P(a1, y1, b), P(a0, y1, b)], col, o);
  face(0, LW, 0, LH, -LT, [112, 126, 118]);
  face(.1, .2, .9, 1.1, -LT - .07, [70, 72, 74]); face(.8, .9, .9, 1.1, -LT - .07, [70, 72, 74]);
  face(.12, .88, .95, 1.04, -LT - .065, [168, 168, 164]);
  face(.2, .78, 1.5, 1.66, -LT - .003, [228, 224, 212], { text: 'FIRE DOOR', textCol: [176, 32, 28] });
  face(.2, .78, 1.33, 1.49, -LT - .003, [228, 224, 212], { text: 'KEEP CLOSED', textCol: [176, 32, 28] });
  // the near end (z 0), seen from inside (x runs right to left as read): block wall round the double door to the office
  // corridor, the door's wired-glass windows (lit from beyond), the SECURITY sign
  const nearQ = (x0, x1, y0, y1, c, o) => S.quad([[x1, y0, 0], [x0, y0, 0], [x0, y1, 0], [x1, y1, 0]], c, o);
  for (let row = 0; row < 14; row++) {
    const y0 = row * .2, y1 = Math.min(HT, y0 + .2), off = row % 2 ? .17 : 0;
    const spans = y0 >= 2.2 - 1e-6 ? [[-HW, HW]] : [[-HW, -.8], [.8, HW]];
    for (const [a0, a1] of spans) for (let x0 = a0 - off; x0 < a1 - 1e-6; x0 += .34) {
      const a = Math.max(a0, x0), b = Math.min(a1, x0 + .34); if (b - a < .01) continue;
      nearQ(a, b, y0, y1, wallColC(y0 + .01, R()));
    }
  }
  S.box(-.8, 0, 0, -.76, 2.24, .04, fc); S.box(.76, 0, 0, .8, 2.24, .04, fc); S.box(-.8, 2.2, 0, .8, 2.24, .04, fc);
  for (const [a, b] of [[-.76, -.01], [.01, .76]]) {
    S.quad([[b, 0, .012], [a, 0, .012], [a, 2.2, .012], [b, 2.2, .012]], [118, 124, 120]);
    S.quad([[b - .2, 1.32, .016], [a + .2, 1.32, .016], [a + .2, 1.8, .016], [b - .2, 1.8, .016]], [150, 158, 146], { emit: .3 });
    S.quad([[b - .22, 1.0, .03], [a + .22, 1.0, .03], [a + .22, 1.08, .03], [b - .22, 1.08, .03]], [176, 176, 170]);
  }
  nearQ(-.45, .45, 2.3, 2.48, [228, 224, 212], { text: 'SECURITY', textCol: [30, 34, 70] });
  // CAM 14 on its bracket
  S.box(.8, 2.32, .26, 1.0, 2.46, .46, [70, 70, 72]); S.box(.88, 2.46, .34, .92, 2.7, .38, [96, 96, 96]);
  // the extinguisher, the electrical panel, the pipes, the cable tray, a mop bucket, boxes, two light fittings
  S.box(-HW, .55, 6.05, -HW + .17, 1.08, 6.22, [176, 30, 26]);
  S.quad([[-HW + .004, 1.3, 6.3], [-HW + .004, 1.3, 5.98], [-HW + .004, 1.58, 5.98], [-HW + .004, 1.58, 6.3]], [186, 34, 30]);
  S.box(-HW, 1.15, 2.7, -HW + .1, 1.85, 3.25, [118, 122, 120]);
  S.quad([[-HW + .104, 1.62, 3.1], [-HW + .104, 1.62, 2.85], [-HW + .104, 1.78, 2.85], [-HW + .104, 1.78, 3.1]], [210, 180, 40]);
  for (let z = 0; z < LEN; z++) {
    S.box(-1.08, 2.36, z, -.96, 2.46, z + 1, [120, 122, 118]); S.box(-1.12, 2.2, z, -1.0, 2.3, z + 1, [184, 182, 172]);
    if (z >= 2) S.box(.9, 2.44, z, 1.16, 2.48, z + 1, [88, 90, 90]);
  }
  S.box(.72, 0, 2.3, 1.12, .36, 2.7, [196, 164, 40]); S.box(.9, .3, 2.48, .94, 1.45, 2.52, [150, 120, 80]);
  S.box(.62, 0, 3.0, 1.18, .52, 3.62, [156, 122, 84]); S.box(.7, .52, 3.08, 1.12, .86, 3.5, [146, 114, 78]);
  S.box(-.13, 2.6, TUBE_Z - .62, .13, 2.7, TUBE_Z + .62, [150, 150, 146]);
  S.box(-.13, 2.6, 1.0, .13, 2.7, 2.2, [140, 140, 136]); S.box(-.13, 2.6, TUBE2_Z - .6, .13, 2.7, TUBE2_Z + .6, [150, 150, 146]);
  S.quad([[-.07, 2.598, 2.15], [.07, 2.598, 2.15], [.07, 2.598, 1.05], [-.07, 2.598, 1.05]], [70, 72, 74]);
}
const CORR = (() => { const S = new TK.Scene(); corridor(S); S.q.forEach(prep); S.q.forEach(q => { q.ceil = Math.abs(q.n[1]) > .9 && q.c[1] > HT - .2; }); return S; })();
function qLightC(q, Lt) {
  const c = q.c, n = q.n;
  let w = Lt.amb, r = 0;
  if (Lt.tube > 0) {
    const v = [-c[0], 2.56 - c[1], TUBE_Z - c[2]], d = Math.hypot(...v), cs = Math.abs(dot3(n, v)) / d;
    w += Lt.tube * 1.3 * (q.ceil ? .28 : .2 + .8 * cs) / (1 + Math.pow(d / 2.4, 2));
    const v2 = [-c[0], 2.56 - c[1], TUBE2_Z - c[2]], d2 = Math.hypot(...v2), cs2 = Math.abs(dot3(n, v2)) / d2;
    w += Lt.tube * 1.1 * (q.ceil ? .28 : .2 + .8 * cs2) / (1 + Math.pow(d2 / 2.2, 2));
  }
  const v = [-c[0], 2.3 - c[1], LEN - .16 - c[2]], d = Math.hypot(...v), cs = Math.abs(dot3(n, v)) / d;
  r += .7 * (.3 + .7 * cs) / (1 + Math.pow(d / .75, 2));
  return [w + r, w + r * .28, w * 1.04 + r * .24];
}
function figLightC(p, Lt, extra = 0) {
  const d = Math.hypot(p[0], p[1] - 2.56, p[2] - TUBE_Z), de = Math.hypot(p[0], p[1] - 2.3, p[2] - LEN), d2 = Math.hypot(p[0], p[1] - 2.56, p[2] - TUBE2_Z);
  return clamp(Lt.amb + Lt.tube * (1.3 * .55 / (1 + Math.pow(d / 2.4, 2)) + .5 / (1 + Math.pow(d2 / 2.2, 2))) + .25 / (1 + Math.pow(de / 1.2, 2)) + extra, .05, 1.15);
}
function tube31(t) { const R = TK.rng(Math.floor(t * 12) * 37 + 5)(); return R < .025 ? .45 : 1; }
function pool(g, cam, c, ax, ay, a, rgb = '255,232,190') {
  const p0 = project(cam, c), pu = project(cam, add3(c, ax)), pv = project(cam, add3(c, ay));
  if (!p0 || !pu || !pv || a <= 0) return;
  g.save(); g.setTransform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.45, `rgba(${rgb},${a * .5})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}
function castBeam(o, d) {
  let best = 1e9; const T = v => { if (v > 1e-4 && v < best) best = v; };
  if (d[1] < 0) T(-o[1] / d[1]); if (d[1] > 0) T((HT - o[1]) / d[1]);
  if (d[0] < 0) T((-HW - o[0]) / d[0]); if (d[0] > 0) T((HW - o[0]) / d[0]);
  if (d[2] < 0) T(-o[2] / d[2]); if (d[2] > 0) T((LEN - o[2]) / d[2]);
  return add3(o, mul3(d, best));
}
function beamPools(g, cam, o, d, a) {
  const hit = castBeam(o, d), dist = Math.hypot(hit[0] - o[0], hit[1] - o[1], hit[2] - o[2]);
  const r = .3 + dist * .2, k = a * 1.2 / (1 + Math.pow(dist / 3.2, 2));
  const n = Math.abs(hit[1]) < .01 ? [0, 1, 0] : Math.abs(Math.abs(hit[0]) - HW) < .01 ? [1, 0, 0] : [0, 0, 1];
  pool(g, cam, hit, n[0] ? [0, 0, r] : [r, 0, 0], n[1] ? [0, 0, r * 1.6] : [0, r, 0], k);
  const near = add3(o, mul3(d, 1.2)); near[1] = 0;
  pool(g, cam, near, [.45, 0, 0], [0, 0, .8], .22 * a);
}
// T: hand {x, y, r, a} (screen space), spill, beam {o, d, a} (world)
function torchMap(g, cam, T) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  if (T.beam) beamPools(g, cam, T.beam.o, T.beam.d, T.beam.a);
  if (T.hand) {
    const { x, y, r, a } = T.hand, gr = g.createRadialGradient(x, y, 4, x, y, r);
    gr.addColorStop(0, `rgba(255,236,200,${a})`); gr.addColorStop(.5, `rgba(255,232,196,${a * .55})`); gr.addColorStop(1, 'rgba(255,232,196,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (T.spill) { const sp = g.createRadialGradient(x, y, 10, x, y, 760); sp.addColorStop(0, `rgba(255,232,196,${T.spill})`); sp.addColorStop(1, 'rgba(255,232,196,0)'); g.fillStyle = sp; g.fillRect(0, 0, W, H); }
  }
  g.globalCompositeOperation = 'source-over';
}
function renderCorridor(g, camSpec, Lt, T) {
  const cam = TK.render(g, litScene(CORR, q => qLightC(q, Lt)), camSpec, { ambient: 1, fog: .02, bg: [4, 4, 5], grid: false });
  if (T && (T.hand || T.beam)) {
    TK.render(ALG, CORR, camSpec, { ambient: 1, fog: .02, bg: [0, 0, 0], grid: false });
    torchMap(LG, cam, T);
    ALG.save(); ALG.globalCompositeOperation = 'multiply'; ALG.drawImage(LMAP, 0, 0); ALG.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(ALB, 0, 0); g.restore();
  }
  return cam;
}
// the lights themselves: the tube, the EXIT sign, CAM 14's lens and its red light
function emittersC(g, cam, Lt) {
  const s = Lt.tube;
  for (const tz of [TUBE_Z, TUBE2_Z]) { const a = project(cam, [-.07, 2.597, tz + .56]), b = project(cam, [.07, 2.597, tz + .56]), c = project(cam, [-.07, 2.597, tz - .56]);
  onQuad(g, a, b, c, 20, 200, q => {
    q.shadowColor = `rgba(225,240,255,${Math.min(1, s)})`; q.shadowBlur = 40 * Math.min(1, s); const v = Math.min(255, 150 + 105 * s) | 0;
    q.fillStyle = `rgb(${v},${Math.min(255, v + 4)},${Math.min(255, v + 10)})`; q.fillRect(0, 0, 20, 200);
  }); }
  const ez = LEN - .102, p = project(cam, [-.2, 2.42, ez]), r = project(cam, [.2, 2.42, ez]), u = project(cam, [-.2, 2.26, ez]);
  onQuad(g, p, r, u, 200, 80, q => {
    q.fillStyle = 'rgb(60,16,14)'; q.fillRect(0, 0, 200, 80);
    q.font = '64px "Special Elite"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.shadowColor = 'rgba(255,60,40,1)'; q.shadowBlur = 24;
    q.fillStyle = 'rgb(255,70,56)'; q.fillText('EXIT', 100, 44);
  });
  const lens = project(cam, [.9, 2.39, .47]);
  if (lens && lens[2] > .6) {
    const rr = Math.max(2, cam.f * .035 / lens[2]);
    ell(g, lens[0], lens[1], rr, rr, 'rgb(8,8,10)'); ell(g, lens[0] - rr * .3, lens[1] - rr * .3, rr * .3, rr * .3, 'rgba(150,170,200,.6)');
    const led = project(cam, [.96, 2.35, .47]); if (led) { g.save(); g.globalCompositeOperation = 'lighter'; ell(g, led[0], led[1], rr * .5, rr * .5, 'rgba(255,40,30,.95)'); g.restore(); }
  }
}

// ---------------------------------------------------------------- Leon at 3:01: he walks slowly back up the corridor toward
// CAM 14 (facing -z), the camcorder at his left eye and the flashlight in his right hand; then he turns round to the fire door
const STEP_T = .78;
function leon31(t) {
  const w = kOf(t, TL.WALK31), z = lerp(6.65, 4.6, w * (1.12 - .12 * w) / 1.0), x = .04 + .05 * Math.sin(t * .7);
  const turn = ease(kOf(t, TL.TURN31)), yaw = PI + PI * turn;                                // facing -z, then +z (turning to his left)
  const walking = t > TL.WALK31[0] && t < TL.WALK31[1] - .15;
  return { x, z, yaw, turn, walking, ph: (t - TL.WALK31[0]) / STEP_T };
}
// where it is on CAM 14: right behind him (further from the camera, at his left shoulder) until he turns; once he has
// turned it is behind him again (between him and the camera). Its head lies over toward his
function fig31(tq) {
  const L = leon31(tq);
  if (tq < TL.TURN31[1] - 1e-6) return { x: L.x + .5, z: L.z + .42, near: false, L };
  return { x: L.x + .3, z: L.z - .44, near: true, L };
}

// Leon drawn flat, in metres, feet at (fx, fy), u pixels a metre; k = how lit he is. Back view (tape 8), front, side
function leonBackAt(g, fx, fy, u, k, o = {}) {
  const C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`;
  g.save(); g.translate(fx, fy); g.scale(u, u);
  if (!o.seated) ell(g, 0, 0, .3, .06, 'rgba(0,0,0,.3)');
  const st = o.step || 0;
  poly(g, [[-.19, -.94], [-.02, -.94], [-.04 - st * .03, -.02], [-.17 - st * .03, -.02]], C(TROUS)); poly(g, [[.02, -.94], [.19, -.94], [.17 + st * .03, -.02], [.04 + st * .03, -.02]], C(TROUS, .9));
  poly(g, [[-.22, -.97], [.22, -.97], [.22, -.9], [-.22, -.9]], 'rgb(18,18,20)');
  poly(g, [[-.25, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT));
  poly(g, [[-.25, -1.47], [-.02, -1.47], [-.02, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT, .9));
  g.strokeStyle = C(SHIRT, .7); g.lineWidth = .008; g.beginPath(); g.moveTo(0, -1.45); g.lineTo(0, -.97); g.moveTo(-.2, -1.38); g.quadraticCurveTo(0, -1.33, .2, -1.38); g.stroke();
  poly(g, [[-.22, -1.45], [-.29, -1.48], [-.46, -1.38], [-.43, -1.31], [-.29, -1.38]], C(SHIRT, .92));
  poly(g, [[-.46, -1.38], [-.42, -1.31], [-.19, -1.6], [-.15, -1.66], [-.2, -1.69]], C(SHIRT, .86));
  g.fillStyle = C([22, 22, 24]); g.fillRect(-.26, -1.76, .2, .13); g.fillStyle = C([40, 40, 44]); g.fillRect(-.08, -1.73, .06, .07);
  ell(g, -.2, -1.66, .035, .03, C(SKIN, .85));
  const hand = o.seated ? [.27, -1.0] : [.3, -1.04], elbow = o.seated ? [.31, -1.16] : [.33, -1.18];
  g.lineCap = 'round'; g.strokeStyle = C(SHIRT, .88); g.lineWidth = .1;
  g.beginPath(); g.moveTo(.21, -1.42); g.lineTo(elbow[0], elbow[1]); g.stroke();
  g.lineWidth = .075; g.beginPath(); g.moveTo(elbow[0], elbow[1]); g.lineTo(hand[0], hand[1]); g.stroke();
  ell(g, hand[0], hand[1], .04, .036, C(SKIN, .8));
  if (o.torch) ell(g, hand[0] + .005, hand[1] - .005, .028, .028, C([30, 30, 34]));
  poly(g, [[-.05, -1.58], [.05, -1.58], [.058, -1.47], [-.058, -1.47]], C(SKIN, .7));
  ell(g, -.1, -1.655, .02, .034, C(SKIN, .85)); ell(g, .1, -1.655, .02, .034, C(SKIN, .85));
  ell(g, 0, -1.665, .1, .1, C([24, 20, 18]));
  poly(g, [[-.07, -1.59], [.07, -1.59], [.05, -1.565], [-.05, -1.565]], C([24, 20, 18]));
  g.beginPath(); g.moveTo(-.118, -1.69); g.bezierCurveTo(-.122, -1.86, .122, -1.86, .118, -1.69); g.closePath(); g.fillStyle = C(CAP); g.fill();
  g.beginPath(); g.moveTo(-.05, -1.69); g.quadraticCurveTo(0, -1.75, .05, -1.69); g.closePath(); g.fillStyle = C([24, 20, 18]); g.fill();
  g.fillStyle = C([70, 72, 80]); g.fillRect(-.055, -1.695, .11, .012);
  g.restore();
  if (u > 60) {
    g.save(); g.font = `${Math.round(.068 * u)}px "Special Elite"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C([30, 34, 52]); g.fillText('SECURITY', fx, fy - 1.33 * u); g.restore();
  }
}
// from the front: the camcorder up at his left eye (our right) hides half his face; the flashlight in his right hand (our
// left) points down the corridor at the camera, its lens a bright point
function leonFrontAt(g, fx, fy, u, k, o = {}) {
  const C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`;
  const st = o.step || 0;
  g.save(); g.translate(fx, fy); g.scale(u, u);
  ell(g, 0, 0, .3, .06, 'rgba(0,0,0,.3)');
  poly(g, [[-.19, -.94], [-.02, -.94], [-.04, -.03 - st * .03], [-.17, -.03 - st * .03]], C(TROUS, .95)); poly(g, [[.02, -.94], [.19, -.94], [.17, -.03 + st * .03], [.04, -.03 + st * .03]], C(TROUS, .85));
  ell(g, -.11, -.025 - st * .03, .08, .035, 'rgb(14,14,16)'); ell(g, .11, -.025 + st * .03, .08, .035, 'rgb(14,14,16)');
  poly(g, [[-.22, -.97], [.22, -.97], [.22, -.9], [-.22, -.9]], 'rgb(18,18,20)');
  g.fillStyle = C([150, 140, 100]); g.fillRect(-.03, -.965, .06, .05);
  poly(g, [[-.25, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT, 1.05));
  poly(g, [[.02, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [.02, -.96]], C(SHIRT, .93));
  poly(g, [[-.035, -1.46], [.035, -1.46], [.05, -1.02], [0, -.98], [-.05, -1.02]], C([30, 32, 46]));           // the tie
  g.fillStyle = C(SHIRT, .8); g.fillRect(-.19, -1.36, .11, .085); g.fillRect(.08, -1.36, .11, .085);           // chest pockets
  ell(g, .14, -1.39, .03, .036, C([200, 186, 120], 1.1));                                                     // the badge
  poly(g, [[-.08, -1.5], [0, -1.44], [.08, -1.5], [.06, -1.47], [0, -1.41], [-.06, -1.47]], C(SHIRT, .75));    // collar
  // right arm (our left): down and forward, the flashlight in the hand pointing at us
  g.lineCap = 'round'; g.strokeStyle = C(SHIRT, .95); g.lineWidth = .1;
  g.beginPath(); g.moveTo(-.24, -1.42); g.lineTo(-.31, -1.17); g.stroke();
  g.lineWidth = .08; g.beginPath(); g.moveTo(-.31, -1.17); g.lineTo(-.25, -1.06); g.stroke();
  ell(g, -.25, -1.05, .045, .04, C(SKIN, .9));
  ell(g, -.24, -1.03, .042, .042, C([40, 40, 44]));
  // left arm (our right): the elbow out, the hand up under the camcorder
  g.strokeStyle = C(SHIRT, .9); g.lineWidth = .1; g.beginPath(); g.moveTo(.24, -1.43); g.lineTo(.42, -1.33); g.stroke();
  g.lineWidth = .08; g.beginPath(); g.moveTo(.42, -1.33); g.lineTo(.15, -1.58); g.stroke();
  ell(g, .14, -1.6, .045, .04, C(SKIN, .9));
  // neck, face, cap; the camcorder over his left eye
  poly(g, [[-.05, -1.58], [.05, -1.58], [.058, -1.47], [-.058, -1.47]], C(SKIN, .8));
  ell(g, 0, -1.665, .094, .112, C(SKIN, .95));
  ell(g, -.1, -1.66, .018, .03, C(SKIN, .85)); ell(g, .1, -1.66, .018, .03, C(SKIN, .85));
  ell(g, -.04, -1.675, .012, .008, C([30, 24, 22]));
  g.fillStyle = C([120, 84, 70]); g.fillRect(-.03, -1.6, .05, .008);
  g.beginPath(); g.moveTo(-.112, -1.7); g.bezierCurveTo(-.116, -1.86, .116, -1.86, .112, -1.7); g.closePath(); g.fillStyle = C(CAP); g.fill();
  poly(g, [[-.125, -1.71], [.125, -1.71], [.115, -1.685], [-.115, -1.685]], C(CAP, .7));
  g.fillStyle = C([200, 190, 140]); g.fillRect(-.02, -1.79, .04, .03);
  g.fillStyle = C([22, 22, 24]); g.fillRect(-.005, -1.73, .19, .13); g.fillStyle = C([36, 36, 40]); g.fillRect(.15, -1.71, .07, .09);
  ell(g, .06, -1.665, .042, .042, 'rgb(6,6,8)'); ell(g, .05, -1.675, .014, .014, C([120, 140, 170]));
  g.restore();
}
// half way round (one held CCTV frame): squeezed sideways
function leonSideAt(g, fx, fy, u, k, o = {}) { g.save(); g.translate(fx, 0); g.scale(.6, 1); g.translate(-fx, 0); leonFrontAt(g, fx, fy, u, k * .85, o); g.restore(); }
function leonOn(g, cam, x, z, view, k, o = {}) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 1.8, z]); if (!feet || !head) return null;
  const u = (feet[1] - head[1]) / 1.8;
  (view === 'front' ? leonFrontAt : view === 'side' ? leonSideAt : leonBackAt)(g, feet[0], feet[1], u, k, o);
  return { feet, u };
}
// BROKEN (TK.ghost 'broken'); mirror flips it about its own feet (its head lies over to the other side, the raised arm with it)
function broken(g, cam, x, z, o) {
  if (!o.mirror) return TK.ghost(g, cam, 'broken', x, z, o);
  const feet = project(cam, [x, 0, z]); if (!feet) return null;
  g.save(); g.translate(feet[0], 0); g.scale(-1, 1); g.translate(-feet[0], 0);
  const r = TK.ghost(g, cam, 'broken', x, z, o); g.restore(); return r;
}

// ---------------------------------------------------------------- the 3:01 tapes as the monitors show them
// CAM 14 at 3:01 (6 fps): him coming back up the corridor, it right behind him
function cctv14(g, tq) {
  const Lt = { amb: .42, tube: 1.25 * tube31(tq) }, L = leon31(tq), F = fig31(tq);
  const fwd = [Math.sin(L.yaw), 0, Math.cos(L.yaw)], side = [Math.cos(L.yaw), 0, -Math.sin(L.yaw)];
  const o = add3([L.x, 1.02, L.z], add3(mul3(side, .25), mul3(fwd, .2)));
  const cam = renderCorridor(g, CAM14, Lt, { beam: { o, d: [fwd[0] * .93, -.36, fwd[2] * .93], a: 1 } });
  emittersC(g, cam, Lt);
  const view = L.turn < .2 ? 'front' : L.turn < .75 ? 'side' : 'back';
  const st = L.walking ? Math.sin(L.ph * PI) : 0, kL = figLightC([L.x, 1.3, L.z], Lt, .06);
  const fo = { light: .2, bend: F.near ? .1 : .3, tilt: F.near ? .25 : .1, armR: F.near ? .15 : .62, seed: 8, mirror: !F.near };
  if (!F.near) broken(g, cam, F.x, F.z, fo);
  leonOn(g, cam, L.x, L.z, view, kL, { step: st, torch: true });
  if (F.near) broken(g, cam, F.x, F.z, fo);
  if (view === 'front') {                                                                       // his flashlight, pointing at us
    const lp = project(cam, add3([L.x, 1.03, L.z], add3(mul3(side, .24), mul3(fwd, .05))));
    if (lp) { const rr = cam.f * .2 / lp[2]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(lp[0], lp[1], 1, lp[0], lp[1], rr); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(.25, 'rgba(255,240,210,.5)'); gr.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = gr; g.fillRect(lp[0] - rr, lp[1] - rr, 2 * rr, 2 * rr); g.restore(); }
  }
  return cam;
}
// his camcorder tape of the same minute: walking toward CAM 14, the flashlight ahead; then the whip round to the fire door
function cam31(g, tau, o = {}) {
  const L = leon31(tau), h = handheld(tau, TL.WALK31[0], 1 / STEP_T, L.walking, .3);
  const yaw = L.yaw + h.yaw + (o.still ? 0 : 0), pitch = -.06 + h.pitch - .04 * (1 - L.turn);
  const cs = { x: L.x - .08, y: 1.55 - h.y, z: L.z, yaw, pitch, fov: 54 }, cc = mkCam(cs);
  const Lt = { amb: .07, tube: tube31(tau) };
  const td = [Math.sin(yaw + .04) * Math.cos(pitch - .08), Math.sin(pitch - .08), Math.cos(yaw + .04) * Math.cos(pitch - .08)];
  const to = [cs.x + Math.cos(yaw) * .22, cs.y - .38, cs.z - Math.sin(yaw) * .22 + Math.cos(yaw) * .15];
  const hit = castBeam(to, td), p = project(cc, hit), dist = Math.hypot(hit[0] - to[0], hit[1] - to[1], hit[2] - to[2]);
  const T = { hand: { x: p ? p[0] : W / 2, y: p ? p[1] : H / 2, r: cc.f * .3, a: clamp(1.3 / (1 + Math.pow(dist / 3.4, 2)), .1, 1) }, spill: .08 };
  const cam = renderCorridor(g, cs, Lt, T);
  emittersC(g, cam, Lt);
  if (o.figure) {                                                                               // (later) it, facing his lens
    broken(g, cam, L.x + .1, L.z + 2.5, { light: .2, bend: .08, tilt: .1, armR: .1, seed: 8, mirror: true });
  }
  const light = clamp(.3 + Lt.tube * .4), hx = 915 + h.yaw * -120, hy = 712 + h.y * 380;
  const vp = project(cam, add3([cs.x, cs.y, cs.z], [Math.sin(yaw) * 6, -.3, Math.cos(yaw) * 6])) || [540, 430];
  armTorch(g, hx, hy, Math.atan2(vp[1] - hy, vp[0] - hx), light);
  return { roll: h.roll, whip: inR(tau, TL.TURN31) ? Math.sin(PI * kOf(tau, TL.TURN31)) : 0 };
}
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
  g.fillStyle = `rgb(${62 * k | 0},${72 * k | 0},${94 * k | 0})`; g.fillRect(-58, -50, 20, 100);
  ell(g, 0, 0, 52, 40, `rgb(${176 * k | 0},${136 * k | 0},${110 * k | 0})`);
  g.restore();
  if (holding) {
    g.save(); g.translate(hx, hy); g.rotate(ang);
    g.fillStyle = 'rgb(18,18,20)'; g.fillRect(-40, -17, 150, 34); g.fillStyle = 'rgb(54,54,58)'; g.fillRect(100, -22, 28, 44);
    g.fillStyle = `rgb(${190 * k | 0},${150 * k | 0},${122 * k | 0})`; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-6 + i * 22, 18, 13, 10, 0, 0, 6.2832); g.fill(); }
    g.restore();
  }
}
// the VCR's own on-screen text (top right, over the picture)
function vcrText(g, s, a = 1) {
  g.save(); g.font = '50px "VT323"'; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillStyle = `rgba(120,255,140,${.92 * a})`;
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2; g.shadowOffsetY = 2; g.fillText(s, W - 40, 96); g.restore();
}
function camOsd31(g, t) { TK.osd(g, 'camcorder', t, { time: 'AM 3:01', date: 'DEC.05.1999', battery: 1 }); }
// the feed images, cached by the frame each one changes on
let FA_T = null, FB_T = null;
function gradeCam(dst, src, t, r) {
  TMPG_clear();
  TG.save(); TG.translate(540, 405); TG.rotate(r.roll || 0); TG.scale(1.05, 1.05); TG.translate(-540, -405);
  if (r.whip > .05) { TG.filter = `blur(${(2 + 4 * r.whip).toFixed(1)}px)`; for (let i = 0; i < 6; i++) { TG.globalAlpha = 1 / (i + 1); TG.drawImage(src, -i * 70 * r.whip, 0); } TG.globalAlpha = 1; }
  else TG.drawImage(src, 0, 0);
  TG.filter = 'none'; TG.restore();
  TK.grade(dst, TMP, t, 'camcorder', { brightness: 1.08 });
}
function TMPG_clear() { TG.setTransform(1, 0, 0, 1, 0, 0); TG.fillStyle = '#000'; TG.fillRect(0, 0, W, H); }
function feedA(t) {
  if (t >= TL.PAUSE) return;                                                                    // the paused frames are made once
  const tau = Math.floor(t * 30) / 30; if (tau === FA_T) return; FA_T = tau;
  const r = cam31(RAG, tau);
  gradeCam(FAG, RAWA, tau, r); TK.vhs(FAG, tau, .9, 6); camOsd31(FAG, tau); vcrText(FAG, 'PLAY ▶');
}
function makePaused() {
  for (const [cv2, fig] of [[PAUSED, false], [PAUSED2, true]]) {
    const r = cam31(RAG, TL.PAUSE, { figure: fig }), g = cv2.getContext('2d');
    gradeCam(g, RAWA, TL.PAUSE, r); TK.vhs(g, TL.PAUSE, .9, 6); camOsd31(g, TL.PAUSE);
  }
}
// the paused frame, as the VCR shows it: a noise bar, a shiver, PAUSE; after REVEAL the bar has rolled through and the frame has it in it
function pausedInto(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const R = TK.rng(Math.floor(t * 30) + 3), dy = (R() - .5) * 3;
  const barY = t < TL.REVEAL - .4 ? 560 + 40 * Math.sin(t * 1.3) : lerp(-60, H + 60, kOf(t, [TL.REVEAL - .4, TL.REVEAL + .4]));
  g.drawImage(PAUSED, 0, dy);
  if (t >= TL.REVEAL - .4) { g.save(); g.beginPath(); g.rect(0, 0, W, t >= TL.REVEAL + .4 ? H : barY); g.clip(); g.drawImage(PAUSED2, 0, dy); g.restore(); }
  if (t < TL.REVEAL + .4 || true) {
    const by = t >= TL.REVEAL + .4 ? 600 + 30 * Math.sin(t * 1.1) : barY;
    g.save(); g.beginPath(); g.rect(0, by - 26, W, 52); g.clip(); TK.statics(g, t, .75); g.drawImage(PAUSED, (R() - .5) * 40, dy + 8, W, H); g.globalAlpha = .6; TK.statics(g, t + .3, 1); g.restore();
  }
  vcrText(g, '▌▌ PAUSE');
}

// ================================================================ THE SECURITY OFFICE
// x -1.7..1.7, z 0..3.3, 2.6 high. The desk along the front wall (z 3.3) with the two monitors (A, the TV on the VCR; B, the
// CCTV monitor on the switcher), two small monitors above. His chair at z 1.75. The door, the calendar and his jacket on
// the back wall (z 0); the lockers on the left wall; CAM 02 high in the back left corner
const OW = 1.7, OD = 3.3, OHT = 2.6, AXIS = [0, 1.2, 1.75];
const SCR = { A: { c: [-.33, 1.06, 2.818], w: .4, h: .3 }, B: { c: [.33, 1.06, 2.818], w: .4, h: .3 },
  s1: { c: [-.3, 1.63, 2.96], w: .2, h: .15 }, s2: { c: [.3, 1.63, 2.96], w: .2, h: .15 } };
const CAM02 = (() => { const p = [-1.5, 2.4, .16], tg = [.18, .98, 1.85], dx = tg[0] - p[0], dy = tg[1] - p[1], dz = tg[2] - p[2];
  return { x: p[0], y: p[1], z: p[2], yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), fov: 70 }; })();
const VCR_BTN = [-.2, .79, 2.766], SW_BTN = [.24, .79, 2.766];
const wallColO = (y, r) => (y < .12 ? [70, 66, 60] : [166, 162, 148]).map(c => c * (.95 + r * .08));
function office(S) {
  const R = TK.rng(31);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 11; j++) {                                // linoleum tiles
    const x = -OW + i * .3 * (OW * 2 / 3.6) / (OW * 2 / 3.6), z = j * .3;
    S.quad([[-OW + i * .3, 0, z], [-OW + i * .3 + .3, 0, z], [-OW + i * .3 + .3, 0, z + .3], [-OW + i * .3, 0, z + .3]], (i + j) & 1 ? [92, 90, 84] : [104, 100, 92], { floor: true });
  }
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {                                  // ceiling tiles
    const x = -OW + i * (2 * OW / 6), z = j * (OD / 6);
    S.quad([[x, OHT, z + OD / 6], [x + 2 * OW / 6, OHT, z + OD / 6], [x + 2 * OW / 6, OHT, z], [x, OHT, z]], (i + j) & 1 ? [140, 140, 134] : [148, 148, 142]);
  }
  // painted block walls, rows of 0.2 m
  for (let row = 0; row < 13; row++) {
    const y0 = row * .2, y1 = Math.min(OHT, y0 + .2), off = row % 2 ? .2 : 0;
    for (let x0 = -OW - off; x0 < OW - 1e-6; x0 += .4) {                                       // front wall (z OD), x to the right
      const a = Math.max(-OW, x0), b = Math.min(OW, x0 + .4); if (b - a < .01) continue;
      S.quad([[a, y0, OD], [b, y0, OD], [b, y1, OD], [a, y1, OD]], wallColO(y0 + .01, R()));
    }
    for (let x0 = -OW - off; x0 < OW - 1e-6; x0 += .4) {                                       // back wall (z 0), round the door
      const a = Math.max(-OW, x0), b = Math.min(OW, x0 + .4); if (b - a < .01) continue;
      const spans = y0 >= 2.1 - 1e-6 ? [[a, b]] : [[a, Math.min(b, .55)], [Math.max(a, 1.45), b]];
      for (const [p, q] of spans) if (q - p > .01) S.quad([[q, y0, 0], [p, y0, 0], [p, y1, 0], [q, y1, 0]], wallColO(y0 + .01, R()));
    }
    for (const s of [-1, 1]) for (let z0 = -off; z0 < OD - 1e-6; z0 += .4) {
      const a = Math.max(0, z0), b = Math.min(OD, z0 + .4); if (b - a < .01) continue; const x = s * OW;
      S.quad(s < 0 ? [[x, y0, a], [x, y0, b], [x, y1, b], [x, y1, a]] : [[x, y0, b], [x, y0, a], [x, y1, a], [x, y1, b]], wallColO(y0 + .01, R()));
    }
  }
  // the door (inside face), its frame, its wired-glass window (the corridor's light beyond), a notice, the handle
  S.quad([[1.45, 0, .012], [.55, 0, .012], [.55, 2.08, .012], [1.45, 2.08, .012]], [124, 108, 88]);
  S.quad([[1.18, 1.38, .016], [.82, 1.38, .016], [.82, 1.76, .016], [1.18, 1.76, .016]], [150, 156, 142], { emit: .28 });
  S.quad([[1.2, .98, .016], [.86, .98, .016], [.86, 1.26, .016], [1.2, 1.26, .016]], [214, 210, 196]);
  S.box(.6, .98, .012, .66, 1.04, .07, [180, 176, 160]);
  S.box(.5, 0, 0, .55, 2.13, .05, [96, 88, 76]); S.box(1.45, 0, 0, 1.5, 2.13, .05, [96, 88, 76]); S.box(.5, 2.08, 0, 1.5, 2.13, .05, [96, 88, 76]);
  S.box(1.56, 1.1, 0, 1.64, 1.22, .02, [210, 206, 194]);                                       // the light switch
  // lockers on the left wall (three, steel), the name tape on one
  S.box(-OW, 0, .3, -1.26, 1.86, .93, [92, 106, 114]);
  for (let i = 0; i < 2; i++) {
    const z0 = .32 + i * .313, z1 = z0 + .3;
    S.quad([[-1.258, .04, z0], [-1.258, .04, z1], [-1.258, 1.82, z1], [-1.258, 1.82, z0]], [98 + i * 3, 112 + i * 2, 120]);
    for (let k = 0; k < 4; k++) S.quad([[-1.256, 1.52 + k * .05, z0 + .08], [-1.256, 1.52 + k * .05, z1 - .08], [-1.256, 1.54 + k * .05, z1 - .08], [-1.256, 1.54 + k * .05, z0 + .08]], [40, 46, 50]);
    S.box(-1.26, 1.0, z1 - .06, -1.23, 1.12, z1 - .035, [60, 62, 64]);
  }
  S.quad([[-1.255, 1.36, .66], [-1.255, 1.36, .89], [-1.255, 1.42, .89], [-1.255, 1.42, .66]], [226, 222, 206], { text: 'MARSH', textCol: [30, 30, 40] });
  // the right wall: a corkboard with papers, the extinguisher by the door
  S.box(1.66, 1.2, 1.1, OW, 1.8, 2.0, [146, 108, 72]);
  for (const [z, y, w2, h2] of [[1.2, 1.32, .2, .28], [1.48, 1.5, .22, .22], [1.76, 1.3, .17, .3]]) S.quad([[1.658, y, z + w2], [1.658, y, z], [1.658, y + h2, z], [1.658, y + h2, z + w2]], [220, 216, 200]);
  S.box(1.5, .3, .25, 1.66, .82, .41, [170, 28, 24]);
  // the ceiling fitting (off tonight)
  S.box(-.16, 2.54, .9, .16, 2.6, 2.2, [168, 168, 164]); S.quad([[-.13, 2.538, 2.15], [.13, 2.538, 2.15], [.13, 2.538, .95], [-.13, 2.538, .95]], [118, 120, 122]);
  // CAM 02 in the back left corner, on its bracket
  S.box(-1.62, 2.33, .08, -1.4, 2.45, .34, [58, 58, 60], { cam02: true }); S.box(-1.66, 2.45, .16, -1.6, OHT, .22, [90, 90, 90], { cam02: true });
  // the desk, the monitors, the VCR, the switcher, the small monitors on their shelf; the night log, a mug, the phone
  S.box(-1.3, .7, 2.6, 1.3, .745, OD, [96, 78, 58]);
  S.box(-1.3, 0, 3.2, 1.3, .7, 3.24, [70, 58, 44]); S.box(-1.3, 0, 2.6, -1.26, .7, OD, [80, 66, 50]); S.box(1.26, 0, 2.6, 1.3, .7, OD, [80, 66, 50]);
  S.box(-.56, .745, 2.77, -.1, .845, 3.15, [40, 40, 42]);                                    // VCR
  S.box(.1, .745, 2.77, .56, .845, 3.15, [54, 54, 58]);                                      // switcher
  for (const [x, col] of [[-.33, [150, 144, 128]], [.33, [132, 132, 126]]]) {
    S.box(x - .25, .845, 2.82, x + .25, 1.29, 3.25, col);
    S.quad([[x - .215, .9, 2.8185], [x + .215, .9, 2.8185], [x + .215, 1.22, 2.8185], [x - .215, 1.22, 2.8185]], [18, 18, 20]);
  }
  S.box(-.7, 1.44, 2.9, .7, 1.47, OD, [110, 104, 96]);                                       // shelf
  for (const x of [-.3, .3]) { S.box(x - .14, 1.47, 2.96, x + .14, 1.79, 3.26, [130, 126, 116]); S.quad([[x - .115, 1.55, 2.958], [x + .115, 1.55, 2.958], [x + .115, 1.71, 2.958], [x - .115, 1.71, 2.958]], [18, 18, 20]); }
  S.quad([[-.98, .747, 2.66], [-.62, .747, 2.66], [-.62, .747, 2.92], [-.98, .747, 2.92]], [204, 200, 186], { floor: true });   // the night log, open
  S.box(.72, .745, 2.66, .8, .85, 2.74, [176, 60, 44]);                                      // mug
  S.box(.86, .745, 2.7, 1.12, .82, 2.92, [44, 44, 46]);                                      // phone
  S.box(-1.2, .745, 2.7, -1.0, .78, 2.98, [24, 24, 26]);                                     // his flashlight
  S.box(1.12, .745, 2.86, 1.24, .77, 2.98, [40, 40, 40]); S.box(1.17, .77, 2.9, 1.19, 1.24, 2.92, [50, 50, 50]);   // the desk lamp
  S.box(1.16, 1.2, 2.5, 1.32, 1.28, 2.7, [52, 84, 60]);
}
const OFFICE = (() => { const S = new TK.Scene(); office(S); S.q.forEach(prep); return S; })();
const OFFICE02 = (() => { const S = new TK.Scene(); S.q = OFFICE.q.filter(q => !q.cam02); return S; })();   // CAM 02 does not see its own housing
// light, baked per quad: the screens (cold, thrown toward the room), the small monitors, the door's window, a little ambient
function lightsO(gain = 1) {
  return { amb: .07 * gain, src: [
    { p: [-.33, 1.06, 2.7], col: [.86, .92, 1.0], s: .95 * gain, r: 1.25, dir: -1 }, { p: [.33, 1.06, 2.7], col: [.84, .9, 1.0], s: .95 * gain, r: 1.25, dir: -1 },
    { p: [0, 1.63, 2.9], col: [.8, .88, 1.0], s: .3 * gain, r: 1.0, dir: -1 }, { p: [1.0, 1.57, .1], col: [1, .96, .86], s: .3 * gain, r: .8, dir: 1 },
    { p: [1.3, 1.25, 2.45], col: [1.0, .86, .62], s: 1.3 * gain, r: 1.2, dir: 0 }] };
}
function qLightO(q, Lo) {
  const c = q.c, n = q.n; let r = Lo.amb, g = Lo.amb, b = Lo.amb * 1.06;
  for (const L of Lo.src) {
    const v = [L.p[0] - c[0], L.p[1] - c[1], L.p[2] - c[2]], d = Math.hypot(...v) || 1, cs = Math.abs(dot3(n, v)) / d;
    const front = L.dir < 0 ? clamp((L.p[2] - c[2]) * 4 + .15) : L.dir > 0 ? clamp((c[2] - L.p[2]) * 4 + .15) : 1;
    const k = L.s * (.22 + .78 * cs) / (1 + Math.pow(d / L.r, 2)) * front;
    r += k * L.col[0]; g += k * L.col[1]; b += k * L.col[2];
  }
  return [r, g, b];
}
function figLightO(p, Lo) { return clamp(qLightO({ c: p, n: [0, 0, 1] }, Lo)[1], .05, 1); }
let SIDE = null;
function buildSide() {
  SIDE = [];
  for (const [seed, cam, name] of [[2, { x: 3.6, y: 4.2, z: .4, yaw: -.1, pitch: -.36, fov: 80 }, 'CAM 13  LOADING DOCK'], [5, { x: -3.2, y: 4.0, z: 2, yaw: .25, pitch: -.4, fov: 70 }, 'CAM 15  EAST HALL']]) {
    const S = TK.concourse({ storeSeed: seed, lightsOn: z => ((z + seed * 4) % 12 === 3 ? .7 : 0) });
    TK.render(TG, S, cam, { ambient: 1.1, fog: .05 });
    const c = mk(W, H), cg = c.getContext('2d'); TK.grade(cg, TMP, seed, 'cctv');
    TK.osd(cg, 'cctv', 1, { cam: name.slice(0, 6), place: name.slice(8), stamp: '12-05-1999  03:05:31' });
    SIDE.push(c);
  }
}
// a CRT screen at its place in the scene, showing img (a tape window); glow = brightness of the tube
function crt(g, cam, S, img, o = {}) {
  const [cx, cy, cz] = S.c, hw = S.w / 2, hh = S.h / 2;
  const a = project(cam, [cx - hw, cy + hh, cz]), b = project(cam, [cx + hw, cy + hh, cz]), c = project(cam, [cx - hw, cy - hh, cz]);
  if (!a || !b || !c) return;
  const w = Math.hypot(b[0] - a[0], b[1] - a[1]), mid = project(cam, S.c);
  if (o.bloom) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(mid[0], mid[1], w * .2, mid[0], mid[1], w * 1.05); gr.addColorStop(0, `rgba(170,190,215,${o.bloom})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(mid[0] - w * 1.1, mid[1] - w * 1.1, w * 2.2, w * 2.2); g.restore();
  }
  onQuad(g, a, b, c, W, H, q => {
    q.beginPath(); q.roundRect(0, 0, W, H, 80); q.clip();
    q.fillStyle = 'rgb(8,9,10)'; q.fillRect(0, 0, W, H);
    if (img) { q.globalAlpha = o.glow ?? 1; if (o.filter) q.filter = o.filter; q.drawImage(img, 0, 0); q.filter = 'none'; q.globalAlpha = 1; }
    if (w > 260) { q.fillStyle = 'rgba(0,0,0,.24)'; for (let y = 0; y < H; y += 4.5) q.fillRect(0, y, W, 1.8); }
    const vg = q.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .68); vg.addColorStop(0, 'rgba(255,255,255,.05)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
    q.fillStyle = vg; q.fillRect(0, 0, W, H);
    const hl = q.createLinearGradient(0, 0, W * .55, H * .7); hl.addColorStop(0, 'rgba(255,255,255,.09)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = hl; q.fillRect(0, 0, W, H);
  });
}
// small things drawn after the light: the VCR's display, the switcher's buttons, CAM 02's lens and red light, the calendar,
// his jacket on the hook, the window glow
function officeDetails(g, cam, t, Lo, mode) {
  const quad2 = (x0, y0, x1, y1, z, w, h, draw) => onQuad(g, project(cam, [x0, y1, z]), project(cam, [x1, y1, z]), project(cam, [x0, y0, z]), w, h, draw);
  const vfd = t < TL.PAUSE ? 'PLAY' : 'PAUSE';
  quad2(-.52, .77, -.32, .82, 2.7695, 400, 100, q => { q.fillStyle = 'rgb(10,16,14)'; q.fillRect(0, 0, 400, 100); q.font = '70px "VT323"'; q.textBaseline = 'middle'; q.shadowColor = 'rgba(90,255,190,.9)'; q.shadowBlur = 14; q.fillStyle = 'rgb(140,255,210)'; q.fillText(vfd, 16, 52); q.textAlign = 'right'; q.fillText('0:04:' + p2(12 + Math.floor(Math.min(t, TL.PAUSE))), 390, 52); });
  quad2(-.3, .775, -.12, .8, 2.7695, 360, 50, q => { for (let i = 0; i < 6; i++) { q.fillStyle = i === 2 && t >= TL.PAUSE ? 'rgb(150,150,146)' : 'rgb(110,110,108)'; q.fillRect(i * 60 + 6, 6, 48, 38); } });
  quad2(.13, .775, .53, .805, 2.7695, 800, 60, q => { for (let i = 0; i < 8; i++) { const on = (t < TL.LIVE ? 6 : 1) === i; q.fillStyle = on ? 'rgb(255,80,60)' : 'rgb(120,120,116)'; if (on) { q.shadowColor = 'rgba(255,60,40,.9)'; q.shadowBlur = 12; } q.fillRect(i * 100 + 10, 8, 80, 44); q.shadowBlur = 0; q.fillStyle = 'rgb(20,20,20)'; q.font = '34px "VT323"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(['01', '02', '05', '09', '12', '13', '14', '15'][i], i * 100 + 50, 30); } });
  // labels under the screens
  quad2(-.4, .855, -.26, .885, 2.818, 280, 60, q => { q.fillStyle = 'rgb(24,24,26)'; q.fillRect(0, 0, 280, 60); q.fillStyle = 'rgb(226,226,220)'; q.font = '44px "VT323"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('VCR 1', 140, 32); });
  quad2(.26, .855, .4, .885, 2.818, 280, 60, q => { q.fillStyle = 'rgb(24,24,26)'; q.fillRect(0, 0, 280, 60); q.fillStyle = 'rgb(226,226,220)'; q.font = '44px "VT323"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('MON 2', 140, 32); });
  const kb = figLightO([.5, 1.4, .02], Lo);
  // the tear-off calendar by the door: DECEMBER, 5, SUNDAY (for six frames: 1)
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
  quad2(.42, 1.26, .12, 1.66, .006, 300, 400, q => {                                      // (back wall: x runs right to left as seen)
    const k = clamp(kb * 1.25, .08, 1), c = v => Math.min(255, v * k) | 0;
    q.fillStyle = `rgb(${c(226)},${c(222)},${c(210)})`; q.fillRect(0, 0, 300, 400);
    q.fillStyle = `rgb(${c(176)},${c(36)},${c(30)})`; q.fillRect(0, 0, 300, 72);
    q.fillStyle = `rgb(${c(240)},${c(236)},${c(226)})`; q.font = '46px "Special Elite"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('DECEMBER', 150, 38);
    q.fillStyle = `rgb(${c(30)},${c(28)},${c(28)})`; q.font = '230px "Special Elite"'; q.fillText(egg ? '1' : '5', 150, 210);
    q.fillStyle = `rgb(${c(176)},${c(36)},${c(30)})`; q.font = '40px "Special Elite"'; q.fillText('SUNDAY', 150, 352);
    q.fillStyle = `rgb(${c(150)},${c(146)},${c(136)})`; q.fillRect(0, 392, 300, 8);
  });
  // his jacket on the hook (a dark navy shape hanging flat on the wall)
  quad2(-.12, .92, -.62, 1.7, .02, 500, 780, q => {
    const k = clamp(kb * 1.1, .06, 1), c = v => Math.min(255, v * k) | 0;
    q.fillStyle = `rgb(${c(70)},${c(70)},${c(66)})`; q.fillRect(236, 0, 28, 30);
    q.beginPath(); q.moveTo(250, 24); q.bezierCurveTo(170, 40, 110, 60, 96, 130); q.lineTo(40, 560); q.lineTo(110, 572); q.lineTo(140, 300);
    q.lineTo(150, 760); q.lineTo(350, 760); q.lineTo(360, 300); q.lineTo(390, 572); q.lineTo(460, 560); q.lineTo(404, 130); q.bezierCurveTo(390, 60, 330, 40, 250, 24); q.closePath();
    q.fillStyle = `rgb(${c(36)},${c(42)},${c(62)})`; q.fill();
    q.strokeStyle = `rgb(${c(24)},${c(28)},${c(44)})`; q.lineWidth = 8; q.beginPath(); q.moveTo(250, 40); q.lineTo(250, 760); q.stroke();
    q.fillStyle = `rgb(${c(170)},${c(150)},${c(90)})`; q.fillRect(300, 230, 46, 30);
  });
  // the lamp's bulb under its shade
  const lb = project(cam, [1.24, 1.19, 2.6]);
  if (lb) { const rr = cam.f * .06 / lb[2]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(lb[0], lb[1], 0, lb[0], lb[1], rr); gr.addColorStop(0, 'rgba(255,236,190,.9)'); gr.addColorStop(1, 'rgba(255,210,150,0)'); g.fillStyle = gr; g.fillRect(lb[0] - rr, lb[1] - rr, 2 * rr, 2 * rr); g.restore(); }
  // CAM 02's lens and its red light
  const lens = project(cam, [-1.5, 2.39, .345]);
  if (lens && mode !== 'cam02') {
    const rr = Math.max(2, cam.f * .03 / lens[2]);
    ell(g, lens[0], lens[1], rr, rr, 'rgb(8,8,10)'); ell(g, lens[0] - rr * .3, lens[1] - rr * .35, rr * .32, rr * .3, 'rgba(160,180,210,.55)');
    const led = project(cam, [-1.43, 2.355, .345]); if (led && Math.floor(t * 1.5) % 2 === 0) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(led[0], led[1], 0, led[0], led[1], rr * 1.4); gr.addColorStop(0, 'rgba(255,60,40,1)'); gr.addColorStop(1, 'rgba(255,40,30,0)'); g.fillStyle = gr; g.fillRect(led[0] - rr * 1.5, led[1] - rr * 1.5, rr * 3, rr * 3); g.restore(); }
  }
}
function renderOffice(g, camSpec, t, mode, Lo) {
  const cam = TK.render(g, litScene(mode === 'cam02' ? OFFICE02 : OFFICE, q => qLightO(q, Lo)), camSpec, { ambient: 1, fog: 0, bg: [6, 6, 7], grid: false });
  const big = mode === 'cam02' ? .55 : 1;
  crt(g, cam, SCR.s1, SIDE[0], { glow: .55 }); crt(g, cam, SCR.s2, SIDE[1], { glow: .55 });
  crt(g, cam, SCR.A, mode === 'cam02' ? (t >= TL.REVEAL ? PAUSED2 : PAUSED) : FA, { glow: 1, bloom: .07 * big });
  crt(g, cam, SCR.B, mode === 'cam02' ? THUMB02 : FB, { glow: 1, bloom: .07 * big, filter: 'contrast(1.05)' });
  officeDetails(g, cam, t, Lo, mode);
  return cam;
}

// ---------------------------------------------------------------- CAM 02 (6 fps, live): this office from the corner.
// Leon in his chair from behind, the chair's back over him, and it
function state02(tq) {
  if (tq >= TL.RELEASE[0]) return null;                                                         // when it lets go: gone
  if (tq < TL.WHIP2[1]) return { x: .5, z: 1.27, bend: -.05, tilt: .15, armR: 0, mirror: true };    // standing behind his chair
  const r = ease(kOf(M.stutter(tq, FPS_CCTV, 4), TL.REACH));
  return { x: .44, z: 1.5, bend: .26 + .06 * r, tilt: .15, armR: .05, mirror: true, reach: r };     // bent over him, then reaching
}
function cctv02(g, tq) {
  const Lo = lightsO(1.8), cam = renderOffice(g, CAM02, tq, 'cam02', Lo);
  // Leon (from behind, seated): drawn as if standing .55 m lower, the legs hidden by his body and the chair
  const feet = project(cam, [0, -.55, AXIS[2]]), head = project(cam, [0, 1.25, AXIS[2]]);
  const u = (feet[1] - head[1]) / 1.8, kL = .78;
  g.save(); g.beginPath(); g.rect(0, 0, W, feet[1] - .92 * u); g.clip();
  leonBackAt(g, feet[0], feet[1], u, kL, { seated: true });
  g.restore();
  // the chair: back, seat edge, the column and base
  const cb = [[-.2, .55], [.2, .55], [.18, .9], [-.18, .9]].map(([x, y]) => project(cam, [x, y, AXIS[2] - .2]));
  if (cb.every(Boolean)) { poly(g, cb.map(p => [p[0], p[1]]), 'rgb(26,26,28)'); poly(g, cb.slice(0, 2).map(p => [p[0], p[1]]).concat([[cb[1][0], cb[1][1] - 6], [cb[0][0], cb[0][1] - 6]]), 'rgb(44,44,48)'); }
  const col = project(cam, [0, .1, AXIS[2] - .05]), seat = project(cam, [0, .46, AXIS[2] - .05]);
  if (col && seat) { g.strokeStyle = 'rgb(20,20,22)'; g.lineWidth = u * .05; g.beginPath(); g.moveTo(seat[0], seat[1]); g.lineTo(col[0], col[1]); g.stroke(); ell(g, col[0], col[1], u * .3, u * .06, 'rgb(18,18,20)'); }
  const F = state02(tq);
  const gr = F && broken(g, cam, F.x, F.z, { light: .2, bend: F.bend, tilt: F.tilt, armR: F.armR, seed: 8, mirror: F.mirror });
  if (gr && F.reach > 0) reachArm(g, gr, F.bend, feet, u, F.reach);
  return cam;
}
// its other arm, too long, comes up from its shoulder over his head to the camcorder at his eye; the fingers close on it
function reachArm(g, G, bend, feet, u, r) {
  // its shoulder on his side (the figure is drawn mirrored): (.25, -.75) in its leaning frame, about the hip (0, -1.02)
  const lean = .04 + bend, uf = G.u, lx = .25 * Math.cos(lean) + .75 * Math.sin(lean), ly = .25 * Math.sin(lean) - .75 * Math.cos(lean) - 1.02;
  const sh = [G.feet[0] - lx * uf, G.feet[1] + ly * uf], cc = [feet[0] - .17 * u, feet[1] - 1.69 * u];
  const hang = [sh[0] - .05 * uf, sh[1] + .7 * uf], hand = [lerp(hang[0], cc[0], r), lerp(hang[1], cc[1], r)];
  const el = [lerp(sh[0], hand[0], .5) - .28 * uf * r, lerp(sh[1], hand[1], .5) - .12 * uf * r];
  g.save(); g.filter = `blur(${Math.max(1, uf * .012).toFixed(1)}px)`; g.strokeStyle = 'rgb(5,5,6)'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = .075 * uf; g.beginPath(); g.moveTo(sh[0], sh[1]); g.lineTo(el[0], el[1]); g.stroke();
  g.lineWidth = .055 * uf; g.beginPath(); g.moveTo(el[0], el[1]); g.lineTo(hand[0], hand[1]); g.stroke();
  const dir = Math.atan2(hand[1] - el[1], hand[0] - el[0]);
  for (let i = 0; i < 4; i++) {                                                                  // long fingers, curling round the camcorder
    const a = dir + (i - 1.5) * .26, L = (.2 + .04 * (i === 1 || i === 2)) * uf, c = .9 * r;
    g.lineWidth = .016 * uf; g.beginPath(); g.moveTo(hand[0], hand[1]);
    g.quadraticCurveTo(hand[0] + Math.cos(a) * L * .6, hand[1] + Math.sin(a) * L * .6, hand[0] + Math.cos(a + c) * L, hand[1] + Math.sin(a + c) * L); g.stroke();
  }
  g.restore();
}
function feedB(t) {
  const tq = qf(t); if (tq === FB_T) return; FB_T = tq;
  if (t < TL.LIVE) {
    cctv14(RBG, tq); TK.grade(FBG, RAWB, tq, 'cctv', { brightness: 1.2 }); TK.vhs(FBG, tq, .8, 4);
    TK.osd(FBG, 'cctv', tq, { cam: 'CAM 14', place: 'SERVICE CORRIDOR', stamp: stamp(TL.STAMP14, tq) }); vcrText(FBG, 'PLAY ▶');
  } else {
    cctv02(RBG, tq); TK.grade(FBG, RAWB, tq, 'cctv', { brightness: 1.55 }); TK.vhs(FBG, tq, .7, 5);
    TK.osd(FBG, 'cctv', tq, { cam: 'CAM 02', place: 'GUARD OFFICE', stamp: stamp(TL.STAMP02, tq - TL.LIVE) });
    if (t < TL.LIVE + .3) { FBG.save(); FBG.globalAlpha = 1 - kOf(t, [TL.LIVE, TL.LIVE + .3]); TK.statics(FBG, t, 1); FBG.restore(); }
  }
}

// ================================================================ HIS CAMCORDER (the whole tape): where it points
const MA = [-.33, 1.06, 2.82], MB = [.33, 1.06, 2.82], MAB = [0, 1.07, 2.82];
function aim(p) { const dx = p[0] - AXIS[0], dy = p[1] - AXIS[1], dz = p[2] - AXIS[2]; return [Math.atan2(dx, dz), Math.atan2(dy, Math.hypot(dx, dz))]; }
const unwrap = (a, ref) => { while (a - ref > PI) a -= 2 * PI; while (a - ref < -PI) a += 2 * PI; return a; };
// keys: [t, target point (or [yaw, pitch]), fov]; yaw is unwrapped along the list (the turns go the long way round on purpose)
const KEYS = (() => {
  const raw = [
    [0, MB, 23.5], [2.4, MB, 22], [4.0, MAB, 50], [6.2, MAB, 48.5], [7.1, [.1, 1.06, 2.82], 45], [8.45, [.04, 1.0, 2.82], 46],
    [8.95, [-.13, .9, 2.82], 47], [9.3, [.08, .92, 2.82], 47], [9.8, [.22, 1.02, 2.82], 44], [11.6, MB, 30], [13.25, MB, 29],
    [13.95, 'door'], [14.6, [1.0, 1.42, 0], 50], [15.45, [.3, 1.46, 0], 46], [16.35, [.27, 1.45, 0], 45], [17.05, [-.37, 1.3, 0], 48],
    [17.85, [-1.5, 2.36, .24], 46], [18.55, [-1.5, 2.36, .24], 44], [19.25, 'MB2'], [22.8, MB, 31], [24.3, MB, 30],
    [27.0, MB, 30], [27.35, [.05, .8, 2.82], 47], [27.7, MAB, 46], [28.2, MAB, 46], [29.8, MA, 25], [31.2, MA, 23.5]];
  const out = []; let prev = 0;
  for (const [t, p, fov] of raw) {
    let yaw, pitch, f = fov;
    if (p === 'door') { [yaw, pitch] = aim([1.05, 1.35, 0]); f = 52; }
    else if (p === 'MB2') { [yaw, pitch] = aim(MB); f = 34; }
    else [yaw, pitch] = aim(p);
    yaw = unwrap(yaw, prev);
    if (t === 13.95 && yaw < prev) yaw += 2 * PI;                                              // round to his right
    if (t === 19.25 && yaw < prev) yaw += 2 * PI;                                              // and on round, back to the desk
    out.push([t, yaw, pitch, f]); prev = yaw;
  }
  return out;
})();
function nerveAt(t) {
  if (t < TL.LIVE) return .12;
  if (t < TL.WHIP1[0]) return .35;
  if (t < TL.WHIP2[1]) return .45;
  if (t < TL.REACH[0]) return .55;
  if (t < TL.STING) return .25;                                                                 // still, holding his breath
  if (t < TL.RELEASE[1]) return 1.3;
  return .8;
}
function pose(t) {
  let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1], whip = (b[0] === TL.WHIP1[1] || b[0] === TL.WHIP2[1]);
  let k = kOf(t, [a[0], b[0]]); k = whip ? (k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k)) : ease(k);
  let yaw = lerp(a[1], b[1], k), pitch = lerp(a[2], b[2], k), fov = lerp(a[3], b[3], k);
  const nerve = nerveAt(t), h = handheld(t, 0, 0, false, nerve);
  let roll = h.roll;
  if (t >= TL.STING && t < TL.RELEASE[1]) {                                                     // the hand on the camcorder: it is held, shaken
    const u = t - TL.STING, R = Math.sin(u * 23) * .5 + Math.sin(u * 37 + 1) * .3;
    yaw += .03 * R * Math.exp(-u * .6) + (u < .12 ? .06 * (1 - u / .12) : 0); pitch += .025 * Math.sin(u * 29 + 2) - (u < .1 ? .05 : 0); roll += .05 * Math.sin(u * 17) + (u < .15 ? .08 : 0);
  }
  if (inR(t, TL.RELEASE)) { const u = kOf(t, TL.RELEASE); pitch -= .12 * Math.sin(PI * u); roll -= .1 * Math.sin(PI * u); }
  const s = .5 + .5 * fov / 50;
  const eye = add3(AXIS, [Math.sin(yaw) * .12, 0, Math.cos(yaw) * .12]);
  return { cam: { x: eye[0], y: eye[1] - h.y * .3, z: eye[2], yaw: yaw + h.yaw * s, pitch: pitch + h.pitch * s, fov }, roll, whip: whip ? Math.sin(PI * kOf(t, [a[0], b[0]])) : 0, yawRate: (b[1] - a[1]) / (b[0] - a[0]) };
}

// ---------------------------------------------------------------- his hand on the desk (PRESS): the sleeve from off the
// bottom right, the index finger on the VCR's PAUSE, then on the switcher's 02
function armPress(g, cam, t, light) {
  const u = kOf(t, TL.PRESS), vb = project(cam, VCR_BTN), sb = project(cam, SW_BTN); if (!vb || !sb) return;
  const rest = [1180, 980], tap = (x, t0) => Math.max(0, 1 - Math.abs(t - t0) / .09) * 10;
  let p;
  if (t < TL.PAUSE) p = [lerp(rest[0], vb[0], ease(kOf(t, [TL.PRESS[0], TL.PAUSE - .05]))), lerp(rest[1], vb[1], ease(kOf(t, [TL.PRESS[0], TL.PAUSE - .05])))];
  else if (t < TL.LIVE) p = [lerp(vb[0], sb[0], ease(kOf(t, [TL.PAUSE + .08, TL.LIVE - .04]))), lerp(vb[1], sb[1], ease(kOf(t, [TL.PAUSE + .08, TL.LIVE - .04])))];
  else p = [lerp(sb[0], rest[0], ease(kOf(t, [TL.LIVE + .06, TL.PRESS[1]]))), lerp(sb[1], rest[1], ease(kOf(t, [TL.LIVE + .06, TL.PRESS[1]])))];
  p[1] += tap(0, TL.PAUSE) + tap(0, TL.LIVE);
  if (u <= 0 || u >= 1) return;
  const k = .4 + .6 * light, hx = p[0] + 40, hy = p[1] + 60;
  armTorch(g, hx, hy, 0, light, false);
  g.save(); g.translate(hx, hy); g.rotate(Math.atan2(p[1] - hy, p[0] - hx));
  g.fillStyle = `rgb(${186 * k | 0},${146 * k | 0},${120 * k | 0})`;
  g.beginPath(); g.ellipse(52, -6, 50, 12, 0, 0, 6.2832); g.fill();                             // the index finger, out
  g.beginPath(); g.ellipse(26, 16, 30, 17, .15, 0, 6.2832); g.fill();                             // the other three, curled under
  g.beginPath(); g.ellipse(18, -30, 26, 11, -.5, 0, 6.2832); g.fill();                            // the thumb
  g.fillStyle = `rgba(0,0,0,.18)`; g.fillRect(4, 4, 46, 3);
  g.restore();
}
// ---------------------------------------------------------------- its hand over the lens (screen space, right at the lens:
// far out of focus). It comes down from the top edge (the wrist and forearm run on up out of frame), the fingers spread
// over the picture with the monitors' light between them; they close tighter; then it lets go, up and away
function lensHand(g, t) {
  let y0;
  if (t < TL.COVER[0]) return;
  if (t < TL.STING) y0 = lerp(-1050, -40, 1 - Math.pow(1 - kOf(t, TL.COVER), 2.2));
  else if (t < TL.RELEASE[0]) y0 = -40 + 18 * Math.sin((t - TL.STING) * 2.1);
  else y0 = lerp(-40, -1250, Math.pow(kOf(t, TL.RELEASE), 1.6));
  const grip = t < TL.STING ? 0 : ease(kOf(t, [TL.STING, TL.STING + 1.8])), spread = lerp(1, .45, grip);
  const sx = Math.sin(t * 13) * 6 + (t >= TL.STING && t < TL.STING + .1 ? 22 : 0), x0 = 470 + sx, rot = -.06 + .03 * Math.sin(t * 3);
  g.save(); g.translate(x0, y0); g.rotate(rot);
  g.filter = 'blur(16px)'; g.fillStyle = 'rgb(4,4,5)';
  // forearm and wrist from above the frame, the palm
  g.beginPath(); g.moveTo(-170, -900); g.lineTo(170, -900); g.lineTo(240, 120); g.bezierCurveTo(260, 300, 200, 420, 120, 470); g.lineTo(-180, 470); g.bezierCurveTo(-280, 380, -300, 220, -250, 100); g.closePath(); g.fill();
  // four long fingers, too long, spread; the thumb out to the side
  const F = [[-210, -.2], [-80, -.06], [55, .07], [180, .2]];
  for (let i = 0; i < 4; i++) {
    const [fx, a0] = F[i], a = a0 * spread, len = 620 + (i === 1 || i === 2 ? 90 : 0), x = fx * lerp(1, .78, grip);
    g.save(); g.translate(x, 400); g.rotate(-a);
    g.beginPath(); g.moveTo(-52, 0); g.bezierCurveTo(-56, len * .5, -34, len * .9, -10, len); g.quadraticCurveTo(4, len + 26, 18, len - 4); g.bezierCurveTo(40, len * .85, 52, len * .45, 52, 0); g.closePath(); g.fill();
    g.restore();
  }
  g.save(); g.translate(250, 260); g.rotate(-.9 * spread); g.beginPath(); g.moveTo(-40, 0); g.bezierCurveTo(-40, 160, -10, 300, 20, 340); g.lineTo(60, 320); g.bezierCurveTo(60, 200, 50, 80, 40, 0); g.closePath(); g.fill(); g.restore();
  g.restore(); g.filter = 'none';
}

// ---------------------------------------------------------------- the camcorder picture
function glitchAt(t) { for (let i = 0; i < TL.GLITCH.length; i++) { const [t0, d] = TL.GLITCH[i]; if (t >= t0 && t < t0 + d) return [(t - t0) / d, i]; } return null; }
function tear(g, t, amp) {
  const R = TK.rng(Math.floor(t * 60) + 9), n = 1 + Math.floor(amp * 4);
  for (let i = 0; i < n; i++) { const band = 24 + R() * 130, y = R() * (H - band), dx = (R() - .5) * 220 * amp; g.drawImage(g.canvas, 0, y, W, band, dx, y + (R() - .5) * 10 * amp, W, band); }
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
function camcorder(t) {
  feedA(t); feedB(t);
  const P = pose(t), behind = Math.cos(P.cam.yaw) < -.2;
  const Lo = lightsO(behind ? 1.25 : 1);
  if (t >= TL.PAUSE) pausedInto(FAG, t);
  const cam = renderOffice(RG, P.cam, t, 'pov', Lo);
  FGG.setTransform(1, 0, 0, 1, 0, 0); FGG.clearRect(0, 0, W, H);
  if (inR(t, TL.PRESS)) armPress(FGG, cam, t, .45);
  lensHand(FGG, t);
  // focus: a little soft when zoomed in; it hunts at the cuts of attention; under the hand it gives up
  let blur = .5 + (P.cam.fov < 30 ? .4 : 0);
  if (P.whip > 0) blur += 2 * P.whip;
  if (t > 2.4 && t < 4.2) blur += 1.8 * Math.sin(PI * kOf(t, [2.4, 4.2]));
  if (t > TL.PUSH_B[0] && t < TL.PUSH_B[1] + .3) blur += 1.4 * Math.abs(Math.sin(PI * 2 * kOf(t, [TL.PUSH_B[0], TL.PUSH_B[1] + .3])));
  if (t >= TL.COVER[0] && t < TL.RELEASE[1] + .6) blur = 7 + 3 * Math.sin(t * 5);
  if (t >= TL.RELEASE[1] + .6 && t < TL.FOCUS[1]) blur = Math.max(blur, lerp(4.5, .6, ease(kOf(t, [TL.TO_A[0], TL.FOCUS[1]]))) + 2.4 * Math.sin(PI * kOf(t, TL.FOCUS)));
  WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, W, H);
  WK.translate(540, 405); WK.rotate(P.roll || 0); WK.scale(1.05, 1.05); WK.translate(-540, -405);
  if (P.whip > .1) { WK.filter = `blur(${(2 + 3 * P.whip).toFixed(1)}px)`; const dx = -Math.sign(P.yawRate) * 70 * P.whip; for (let i = 0; i < 7; i++) { WK.globalAlpha = 1 / (i + 1); WK.drawImage(RAW, i * dx, 0); } WK.globalAlpha = 1; }
  else { WK.filter = `blur(${blur.toFixed(2)}px)`; WK.drawImage(RAW, 0, 0); }
  WK.filter = 'none'; WK.drawImage(FG, 0, 0); WK.setTransform(1, 0, 0, 1, 0, 0);
  // exposure: the camcorder's auto-iris opens up in the dark room behind him and under the hand
  let br = 1.0 + .04 * Math.sin(t * 1.7);
  if (behind) br *= 1.35;
  if (t >= TL.STING && t < TL.RELEASE[1]) br *= lerp(1.6, 2.2, kOf(t, [TL.STING, TL.STING + 1.2]));
  if (inR(t, [TL.RELEASE[1], TL.RELEASE[1] + .6])) br *= lerp(1.6, 1, kOf(t, [TL.RELEASE[1], TL.RELEASE[1] + .6]));
  TK.grade(WG, WORK, t, 'camcorder', { brightness: br });
  gainNoise(WG, t, behind ? .2 : t >= TL.STING && t < TL.RELEASE[1] ? .3 : .08);
  const gk = glitchAt(t); TK.vhs(WG, t, gk ? 2.2 : .9, 6);
  if (gk) { tear(WG, t, Math.sin(gk[0] * PI)); TK.statics(WG, t, .3 * Math.sin(gk[0] * PI)); }
  TK.osd(WG, 'camcorder', t, { time: 'AM 3:05', date: 'DEC.05.1999', battery: 1 });
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const inStatic = TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) TK.statics(WG, t, 1);
  else camcorder(t);
  if (!inStatic) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) capTop(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  const ak = kOf(t, [TL.ASK_T, TL.ASK_T + .7]), n = Math.ceil(ak * TL.ASK.length);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: clamp((t - .8) / .6), ask: t >= TL.ASK_T ? TL.ASK.slice(0, n) : null, askFull: TL.ASK });
}
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound only)
// Everything is something in the room, picked up by his camcorder mic: the monitors' whine, the building's air, his breath,
// his chair, the VCR's buttons and transport, the switcher; the TV's small speaker playing his 3:01 tape (his steps, the
// corridor's tube, the whip of his turn) until he pauses it. Then the hand on the camcorder, right on the mic.
// space: close (at his mic), shop (the office), hall (beyond the door), tv (the TV's speaker, on the desk), tape (after).
function buildEvents() {
  const EV = [];
  EV.push(
    { type: 'bed', fx: 'crt_hum', space: 'shop', t: 0, t1: TL.QUIET[0], g: -33.5, fin: .01, fout: .45, env: [[0, .9], [9.3, 1.0], [9.36, 1.15], [24, 1.1]] },
    { type: 'bed', fx: 'crt_hum', space: 'shop', t: TL.RELEASE[0] + .2, t1: TL.END, g: -34, fin: .6, fout: .05 },
    { type: 'bed', fx: 'duct_hum', space: 'hall', t: 0, t1: TL.QUIET[0], g: -42, fin: .01, fout: .3 },
    { type: 'bed', fx: 'duct_hum', space: 'hall', t: TL.RELEASE[0], t1: TL.END, g: -42, fin: 1, fout: .05 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: .2, t1: TL.WHIP1[0], g: -34, fin: .5, fout: .3 },
    // the TV's speaker: his 3:01 tape (the corridor's tube buzz, his steps, his breath, the whip of his turn), cut by PAUSE
    { type: 'bed', fx: 'fluor_tv', space: 'shop', t: 0, t1: TL.PAUSE, g: -36, fin: .01, fout: .01 },
    ...TL.STEPS31.map((x, i) => ({ type: 'step_tv', t: x, g: .9, pan: 0 })),
    { type: 'whip_tv', t: TL.TURN31[0] + .05 }, { type: 'breath_tv', t: TL.TURN31[1] + .3 },
    { type: 'button', t: TL.PAUSE - .02 }, { type: 'vcr_pause', t: TL.PAUSE + .03 },
    { type: 'button', t: TL.LIVE - .02, g: .8 }, { type: 'switch', t: TL.LIVE },
    { type: 'rustle', t: TL.PRESS[0] + .05, g: .4 }, { type: 'rustle', t: TL.PRESS[1] - .2, g: .35 },
    // he turns round in the chair (its swivel creaks), looks, turns back
    { type: 'creak', t: TL.WHIP1[0] + .05 }, { type: 'rustle', t: TL.WHIP1[0] + .1, g: .55 },
    { type: 'bed', fx: 'near_breath', space: 'close', t: TL.WHIP1[1], t1: TL.WHIP2[0], g: -29, fin: .6, fout: .3 },
    { type: 'creak', t: TL.WHIP2[0] + .05, g: .8 }, { type: 'rustle', t: TL.WHIP2[0] + .1, g: .5 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: TL.WHIP2[1] + .2, t1: TL.QUIET[0], g: -32, fin: .8, fout: .2 },
    // the grab: right on the mic (a thump, the preamp overloads), the fingers rubbing on the mic, his breath under the hand
    { type: 'grab', t: TL.STING }, { type: 'hit', t: TL.STING + .005 }, { type: 'gasp', t: TL.STING + .07, g: 1 },
    { type: 'grab_rub', t: TL.STING + .08, g: 7 }, { type: 'hit', t: TL.STING + .21, g: .8 }, { type: 'grab_rub', t: TL.STING + .55 }, { type: 'grab_rub', t: TL.STING + 1.5, g: .6 },
    { type: 'bed', fx: 'breath_muff', space: 'close', t: TL.STING + .45, t1: TL.RELEASE[0], g: -24, fin: .3, fout: .2 },
    { type: 'handling', t: TL.RELEASE[0] + .05, g: .8 }, { type: 'gasp', t: TL.RELEASE[0] + .25, g: .35 },
    { type: 'bed', fx: 'near_breath', space: 'close', t: TL.RELEASE[1], t1: TL.END, g: -28, fin: .3, fout: .05 },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    buildSide();
    makePaused();
    FB_T = null; cctv02(RBG, TL.RELEASE[0] + .1); TK.grade(THUMB02.getContext('2d'), RAWB, 0, 'cctv', { brightness: 1.55 }); TK.osd(THUMB02.getContext('2d'), 'cctv', 0, { cam: 'CAM 02', place: 'GUARD OFFICE', stamp: stamp(TL.STAMP02, 0) });
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
