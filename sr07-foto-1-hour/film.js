// STILL RECORDING, tape 7: "Foto 1 Hour". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white, TK.ghost 'broken'). Script: channel/scripts/SR07_foto_1_hour.md
// Leon's camcorder (colour, hand-held, his flashlight) is cut against CAM 05 (black and white, 6 frames a second) in the
// Foto 1 Hour store. The photo machine prints pictures nobody took: CAM 05 seen from right underneath, then Leon from behind.
// The light comes from three practicals only: the FOTO 1 HOUR lightbox (it flickers and dies), his flashlight, the machine's
// red lamp. Scare type: FLASH (a flash charges behind him, silence, the pop; for six frames its light throws a second shadow
// beside his; nothing is there when he turns; the last print shows it bent over his shoulder). Not a jump at the lens.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const W = TK.TW, H = TK.TH;
const RAW = mk(W, H), RG = RAW.getContext('2d'), LMAP = mk(W, H), LG = LMAP.getContext('2d'), FG = mk(W, H), FGG = FG.getContext('2d');
const NZ = mk(W, H), NZG = NZ.getContext('2d'), TMP = mk(W, H), TG = TMP.getContext('2d'), WORK = mk(W, H), WK = WORK.getContext('2d'), WIN = mk(W, H), WG = WIN.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, M = TK.motion;
const qf = t => Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;
const shotAt = t => TL.SHOTS.find(s => t >= s[1] && t < s[2]);
const inR = (t, a) => t >= a[0] && t < a[1];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const nrm3 = a => mul3(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } };
const ell = (g, x, y, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.2832); g.fillStyle = fill; g.fill(); };
// draw into a projected planar quad: local (0..w, 0..h), (0,0) = top-left; an affine fit through three corners
function onQuad(g, TLp, TRp, BLp, w, h, draw) {
  if (!TLp || !TRp || !BLp) return;
  g.save(); g.transform((TRp[0] - TLp[0]) / w, (TRp[1] - TLp[1]) / w, (BLp[0] - TLp[0]) / h, (BLp[1] - TLp[1]) / h, TLp[0], TLp[1]); draw(g); g.restore();
}

// ---------------------------------------------------------------- the Foto 1 Hour store: x -3..3, z 0 (the shutter) .. 7 (back wall)
const HW = 3, DEP = 7, HT = 3.0;
const LEON = { x: -.85, z: 5.0 };                                 // where he stands at the machine
const TRAY = { x0: -1.08, x1: -.72, zb: 5.9, yb: .995, zf: 5.58, yf: .925 };  // the slanted output tray under the slot
const SIGN = { x0: -1.85, x1: .65, y0: 1.86, y1: 2.44, z: 6.84 };
const LAMP = [-.5, 1.6, 5.94];
const LED = { x0: -1.98, x1: -1.36, y0: 1.18, y1: 1.36, z: 5.884 };
const CCTV_C = [-2.72, 2.66, .46], CCTV_DIR = nrm3([1.95, -1.7, 4.7]);
const CAM05 = { x: CCTV_C[0] + CCTV_DIR[0] * .17, y: CCTV_C[1] + CCTV_DIR[1] * .17, z: CCTV_C[2] + CCTV_DIR[2] * .17,
  yaw: Math.atan2(CCTV_DIR[0], CCTV_DIR[2]), pitch: Math.asin(CCTV_DIR[1]), fov: 56 };
const IT = { x: -1.34, z: 4.36 };                                 // where it stands behind him on CAM 05 (only its eyes show)
const SHIRT = [140, 156, 182], TROUS = [34, 38, 52], CAP = [28, 32, 50], HAIR = [46, 34, 26], SKIN = [182, 140, 112];

function obox(S, c, w, hs, col) {
  const u = nrm3(cross3([0, 1, 0], w)), v = cross3(w, u);
  const P = (a, b, d) => [0, 1, 2].map(i => c[i] + u[i] * a * hs[0] + v[i] * b * hs[1] + w[i] * d * hs[2]);
  const k = s => col.map(x => x * s);
  S.quad([P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], k(.92));
  S.quad([P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)], k(.8));
  S.quad([P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1)], k(1));
  S.quad([P(-1, -1, 1), P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1)], k(.72));
  S.quad([P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1)], k(.78));
  S.quad([P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1)], k(.78));
  return { u, v, w, front: P(0, 0, 1), lens: P(0, -.15, 1.06), led: P(.6, -.7, 1.06) };
}
let CCTV_BOX = null;
function buildShop() {
  const S = new TK.Scene();
  const fA = [146, 142, 134], fB = [126, 122, 116], wall = [176, 170, 158], cA = [158, 156, 150], cB = [150, 148, 142];
  for (let z = 0; z < DEP; z += .5) for (let x = -HW; x < HW; x += .5) {
    const c = ((Math.round(x * 2) + Math.round(z * 2)) & 1) ? fA : fB;
    S.quad([[x, 0, z], [x + .5, 0, z], [x + .5, 0, z + .5], [x, 0, z + .5]], c, { floor: true });
  }
  for (let z = 0; z < DEP; z += .6) for (let x = -HW; x < HW; x += .6) {
    const z1 = Math.min(DEP, z + .6), x1 = Math.min(HW, x + .6), c = ((Math.round(x / .6) + Math.round(z / .6)) & 1) ? cA : cB;
    S.quad([[x, HT, z1], [x1, HT, z1], [x1, HT, z], [x, HT, z]], c);
    if (x < .1 && z < 3) {                                                                  // the T-bar grid near CAM 05 (seen in the prints)
      S.quad([[x, HT - .012, z1], [x + .025, HT - .012, z1], [x + .025, HT - .012, z], [x, HT - .012, z]], [96, 96, 98]);
      S.quad([[x, HT - .012, z + .025], [x1, HT - .012, z + .025], [x1, HT - .012, z], [x, HT - .012, z]], [96, 96, 98]);
    }
  }
  for (let z = 0; z < DEP; z += 1) {
    S.quad([[-HW, 0, z + 1], [-HW, 0, z], [-HW, HT, z], [-HW, HT, z + 1]], wall);
    S.quad([[HW, 0, z], [HW, 0, z + 1], [HW, HT, z + 1], [HW, HT, z]], wall);
  }
  for (let x = -HW; x < HW; x += 1) S.quad([[x, 0, DEP], [x + 1, 0, DEP], [x + 1, HT, DEP], [x, HT, DEP]], [168, 160, 146]);
  // the front: wall pieces, the header, the half-raised shutter, the dark concourse under it
  S.quad([[-HW, 0, 0], [-2.4, 0, 0], [-2.4, HT, 0], [-HW, HT, 0]].reverse(), wall);
  S.quad([[2.4, 0, 0], [HW, 0, 0], [HW, HT, 0], [2.4, HT, 0]].reverse(), wall);
  S.quad([[-2.4, 2.6, 0], [2.4, 2.6, 0], [2.4, HT, 0], [-2.4, HT, 0]].reverse(), wall);
  S.quad([[2.4, 1.15, .02], [-2.4, 1.15, .02], [-2.4, 2.6, .02], [2.4, 2.6, .02]], [116, 116, 120], { tex: 'shutter' });
  for (let z = -3; z < 0; z += 1) S.quad([[-6, 0, z], [6, 0, z], [6, 0, z + 1], [-6, 0, z + 1]], [74, 72, 68], { floor: true });
  S.quad([[6, 0, -3], [-6, 0, -3], [-6, 2.5, -3], [6, 2.5, -3]], [64, 66, 70]);
  // the minilab: a printer cabinet (output slot, tray, LED panel, red lamp) and a lower processor with a work surface
  const beige = [206, 198, 180], beige2 = [190, 182, 166];
  S.box(-2.2, 0, 5.9, -.4, 1.55, DEP, beige);
  S.box(-.4, 0, 6.0, 1.6, .95, DEP, beige2);
  S.quad([[-.38, .952, 6.02], [1.58, .952, 6.02], [1.58, .952, 6.98], [-.38, .952, 6.98]], [86, 88, 92]);
  const fz = 5.896, fq = (x0, y0, x1, y1, c, o) => S.quad([[x0, y0, fz], [x1, y0, fz], [x1, y1, fz], [x0, y1, fz]], c, o);
  fq(-2.1, .08, -.5, .86, [184, 176, 160]);
  for (let y = .2; y < .62; y += .07) fq(-2.0, y, -1.45, y + .025, [70, 68, 64]);           // vents
  fq(LED.x0, LED.y0, LED.x1, LED.y1, [24, 28, 26]);
  for (let i = 0; i < 4; i++) fq(LED.x0 + .02 + i * .15, 1.07, LED.x0 + .12 + i * .15, 1.13, [120, 118, 112]);   // keys
  fq(-1.06, .995, -.74, 1.05, [14, 14, 16]);                                                  // the output slot
  fq(-.42, .1, -.41, 1.5, [120, 114, 102]);
  const pz = 5.996;
  S.quad([[-.3, .1, pz], [1.5, .1, pz], [1.5, .82, pz], [-.3, .82, pz]], [172, 164, 150]);
  S.quad([[.55, .1, pz - .001], [.565, .1, pz - .001], [.565, .82, pz - .001], [.55, .82, pz - .001]], [90, 86, 80]);
  const T = TRAY;
  S.quad([[T.x0, T.yf, T.zf], [T.x1, T.yf, T.zf], [T.x1, T.yb, T.zb], [T.x0, T.yb, T.zb]], [48, 50, 56]);
  S.quad([[T.x0, T.yf, T.zf], [T.x1, T.yf, T.zf], [T.x1, T.yf + .05, T.zf], [T.x0, T.yf + .05, T.zf]], [60, 62, 70]);
  for (const x of [T.x0, T.x1]) S.quad([[x, T.yf, T.zf], [x, T.yb, T.zb], [x, T.yb + .05, T.zb], [x, T.yf + .05, T.zf]], [56, 58, 64]);
  S.box(-.57, 1.55, 5.95, -.43, 1.6, 6.06, [80, 34, 30]);                                     // the red lamp's housing
  S.box(.22, .955, 6.0, .42, 1.015, 6.1, [26, 26, 28]);                                       // his flashlight, on the work surface
  S.box(.7, .955, 6.3, 1.3, 1.1, 6.8, [120, 70, 50]);                                         // an envelope rack
  for (let i = 0; i < 5; i++) S.quad([[.72 + i * .11, 1.1, 6.32], [.8 + i * .11, 1.1, 6.32], [.8 + i * .11, 1.2, 6.32], [.72 + i * .11, 1.2, 6.32]], [[220, 200, 120], [200, 210, 220], [220, 190, 110], [210, 200, 190], [230, 205, 130]][i]);
  // the lightbox over the machine (its face is drawn as a light, after the light map)
  S.box(SIGN.x0 - .05, SIGN.y0 - .05, SIGN.z, SIGN.x1 + .05, SIGN.y1 + .05, DEP - .005, [62, 58, 54]);
  // posters on the back wall, a price board on the left wall
  const bz = DEP - .01;
  S.quad([[.95, 1.2, bz], [1.75, 1.2, bz], [1.75, 2.3, bz], [.95, 2.3, bz]], [214, 206, 190]);
  S.quad([[1.02, 1.6, bz - .001], [1.68, 1.6, bz - .001], [1.68, 2.2, bz - .001], [1.02, 2.2, bz - .001]], [110, 146, 172]);
  S.quad([[1.02, 1.6, bz - .002], [1.68, 1.6, bz - .002], [1.68, 1.78, bz - .002], [1.02, 1.78, bz - .002]], [86, 122, 70]);
  S.quad([[1.0, 1.28, bz - .002], [1.7, 1.28, bz - .002], [1.7, 1.48, bz - .002], [1.0, 1.48, bz - .002]], [190, 44, 40], { text: 'DOUBLE PRINTS', textCol: [250, 240, 220] });
  S.quad([[-HW + .01, 2.0, 4.4], [-HW + .01, 2.0, 2.0], [-HW + .01, 2.45, 2.0], [-HW + .01, 2.45, 4.4]], [40, 40, 44], { text: 'DEVELOPING 1 HOUR', textCol: [230, 220, 190] });
  // a film rack on the left wall, a counter on the right
  S.box(-HW, .3, 2.0, -2.72, 1.9, 4.2, [96, 90, 82]);
  const films = [[220, 180, 40], [60, 140, 70], [190, 50, 40], [50, 80, 160]];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) {
    const y = .42 + r * .38, z = 2.08 + i * .23;
    S.quad([[-2.715, y, z + .18], [-2.715, y, z], [-2.715, y + .22, z], [-2.715, y + .22, z + .18]], films[(r + i * 3) % 4]);
  }
  S.box(1.0, 0, 3.0, 2.95, 1.0, 3.6, [112, 88, 66]);
  S.quad([[1.0, 1.003, 3.0], [2.95, 1.003, 3.0], [2.95, 1.003, 3.6], [1.0, 1.003, 3.6]], [130, 150, 150]);
  S.box(2.1, 1.0, 3.1, 2.6, 1.22, 3.5, [44, 44, 48]);                                         // the register
  // ceiling panels (off), CAM 05 on its bracket in the front left corner
  for (const [x, z] of [[-1.2, 1.8], [1.2, 1.8], [-1.2, 4.2], [1.2, 4.2]]) S.quad([[x - .6, HT - .01, z + .6], [x + .6, HT - .01, z + .6], [x + .6, HT - .01, z - .6], [x - .6, HT - .01, z - .6]], [186, 186, 180]);
  S.box(-HW, 2.74, .4, -2.8, 2.8, .52, [104, 104, 108]);
  S.box(-2.85, 2.76, .4, -2.78, HT, .52, [104, 104, 108]);
  CCTV_BOX = obox(S, CCTV_C, CCTV_DIR, [.055, .05, .15], [200, 200, 194]);
  return S;
}
const SHOP = buildShop();

// ---------------------------------------------------------------- light: the scene renders flat, then a light map multiplies it
function pool(g, cam, c, ax, ay, a, rgb = '255,255,255') {
  const p0 = project(cam, c), pu = project(cam, add3(c, ax)), pv = project(cam, add3(c, ay));
  if (!p0 || !pu || !pv || a <= 0) return;
  g.save(); g.setTransform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.45, `rgba(${rgb},${a * .5})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}
// L: base (0..1), sign, torch, lamp, gap (the concourse under the shutter), hand ({ x, y, r, a } his flashlight, screen space)
function lightMap(g, cam, L) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
  const b = Math.round(255 * L.base); g.fillStyle = `rgb(${b},${b},${Math.min(255, Math.round(b * 1.08))})`; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  const s = L.sign || 0, cx = (SIGN.x0 + SIGN.x1) / 2, cy = (SIGN.y0 + SIGN.y1) / 2;
  if (s > 0) {
    const wc = '255,238,212';
    pool(g, cam, [cx, cy, DEP - .02], [2.6, 0, 0], [0, 1.3, 0], .95 * s, wc);
    pool(g, cam, [-1.3, 1.556, 6.45], [1.3, 0, 0], [0, 0, .6], .7 * s, wc);
    pool(g, cam, [.4, .956, 6.5], [1.4, 0, 0], [0, 0, .55], .45 * s, wc);
    pool(g, cam, [cx, 1.0, 5.89], [1.7, 0, 0], [0, .7, 0], .32 * s, wc);
    pool(g, cam, [cx, 0, 5.0], [2.4, 0, 0], [0, 0, 1.6], .32 * s, wc);
    pool(g, cam, [cx, HT, 6.2], [2.2, 0, 0], [0, 0, 1.3], .45 * s, wc);
    pool(g, cam, [-2.99, 1.4, 5.5], [0, 0, 1.6], [0, 1.2, 0], .18 * s, wc);
  }
  const tc = L.torch || 0;
  if (tc > 0) {
    const wc = '255,234,196';
    pool(g, cam, [-.9, .95, 5.68], [.6, 0, 0], [0, .045, .32], 1.05 * tc, wc);
    pool(g, cam, [-.95, 1.12, 5.89], [.75, 0, 0], [0, .42, 0], .9 * tc, wc);
    pool(g, cam, [-.95, 0, 5.1], [.8, 0, 0], [0, 0, .7], .3 * tc, wc);
    pool(g, cam, [-.05, .957, 6.08], [.45, 0, 0], [0, 0, .22], .55 * tc, wc);
  }
  const lp = L.lamp || 0;
  if (lp > 0) { pool(g, cam, [LAMP[0], LAMP[1] - .05, 5.89], [.32, 0, 0], [0, .28, 0], .45 * lp, '255,70,60'); pool(g, cam, [LAMP[0], 1.553, 6.1], [.4, 0, 0], [0, 0, .25], .4 * lp, '255,70,60'); }
  const gp = L.gap || 0;
  if (gp > 0) {
    const gc = '170,184,205';
    pool(g, cam, [0, 0, .7], [2.8, 0, 0], [0, 0, 1.5], .55 * gp, gc);
    pool(g, cam, [0, .55, -.05], [2.6, 0, 0], [0, .62, 0], .5 * gp, gc);
    pool(g, cam, [0, 0, -1.4], [4, 0, 0], [0, 0, 1.6], .5 * gp, gc);
    pool(g, cam, [0, 1.25, .02], [2.4, 0, 0], [0, .2, 0], .35 * gp, gc);
    pool(g, cam, [-2.72, 2.62, .5], [.32, 0, 0], [0, .3, 0], .55 * gp, gc);
    pool(g, cam, [-2.4, HT, .9], [1.0, 0, 0], [0, 0, .9], .35 * gp, gc);
    pool(g, cam, [-2.99, 2.2, .7], [0, 0, .8], [0, .8, 0], .3 * gp, gc);
  }
  if (L.hand) {
    const { x, y, r, a } = L.hand, gr = g.createRadialGradient(x, y, 4, x, y, r);
    gr.addColorStop(0, `rgba(255,236,200,${a})`); gr.addColorStop(.5, `rgba(255,232,196,${a * .55})`); gr.addColorStop(1, 'rgba(255,232,196,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  g.globalCompositeOperation = 'source-over';
}
function lightUp(g, cam, L) { lightMap(LG, cam, L); g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(LMAP, 0, 0); g.restore(); }
// how bright a point is (for the figures, drawn after the light map)
function litAt(p, L) {
  const d = (q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  return clamp(L.base + (L.sign || 0) * .5 / (1 + Math.pow(d([-.6, 2.15, 6.8]) / 2.2, 2)) + (L.torch || 0) * .25 / (1 + Math.pow(d([-.9, 1, 5.7]) / 1.1, 2)), 0, 1.2);
}

// the practical lights: the lightbox face (lit, flickering or dead), the red lamp, the LED panel, CAM 05's red LED
function signA(t) {
  if (t >= TL.SIGN_DIE) return t < TL.SIGN_DIE + .17 ? .3 : 0;          // one weak strike, then dead
  if (t >= TL.EGG.t - .4 && t < TL.EGG.t + .4) return 1;
  if (t < 1.0) return 1;
  const f = Math.floor(t * 12), R = TK.rng(f * 29 + 11)();
  const rate = t < TL.FLICKER ? .07 : lerp(.35, 1.3, clamp((t - TL.FLICKER) / (TL.SIGN_DIE - TL.FLICKER)));
  return R < .16 * rate ? .06 : R < .3 * rate ? .55 : 1;
}
function emitters(g, cam, L, t, o = {}) {
  const s = L.sign || 0, z = SIGN.z - .006;
  const TLp = project(cam, [SIGN.x0, SIGN.y1, z]), TRp = project(cam, [SIGN.x1, SIGN.y1, z]), BLp = project(cam, [SIGN.x0, SIGN.y0, z]);
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
  onQuad(g, TLp, TRp, BLp, 250, 58, q => {
    if (o.flashLit) {                                                                    // a dead lightbox in a flash: white acrylic
      q.fillStyle = `rgb(${232 * o.flashLit | 0},${228 * o.flashLit | 0},${216 * o.flashLit | 0})`; q.fillRect(0, 0, 250, 58); q.fillStyle = `rgb(${196 * o.flashLit | 0},${40 * o.flashLit | 0},${36 * o.flashLit | 0})`;
    } else if (s > .02) {
      q.save(); q.shadowColor = `rgba(255,240,210,${.9 * s})`; q.shadowBlur = 30 * s;
      q.fillStyle = `rgba(${255 * (.35 + .65 * s) | 0},${246 * (.35 + .65 * s) | 0},${226 * (.33 + .67 * s) | 0},1)`; q.fillRect(0, 0, 250, 58); q.restore();
      q.fillStyle = `rgb(${200 * (.4 + .6 * s) | 0},${28 + 10 * s | 0},${30 | 0})`;
    } else {
      q.fillStyle = 'rgb(44,42,40)'; q.fillRect(0, 0, 250, 58);
      if (o.after) { for (const x of [6, 244]) { const a = o.after * (.6 + .4 * Math.sin(t * 23 + x)); const gr = q.createRadialGradient(x, 29, 1, x, 29, 26); gr.addColorStop(0, `rgba(255,140,60,${a})`); gr.addColorStop(1, 'rgba(255,120,40,0)'); q.fillStyle = gr; q.fillRect(x - 26, 0, 52, 58); } }
      q.fillStyle = 'rgb(76,26,24)';
    }
    q.font = '44px "Special Elite"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(egg ? 'FOTO 8 HOUR' : 'FOTO 1 HOUR', 125, 31);
  });
  const lp = L.lamp || 0;
  if (lp > 0) {
    const p = project(cam, LAMP);
    if (p) { const r = Math.max(4, 70 / p[2] * (o.lampScale || 1)); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(p[0], p[1], 1, p[0], p[1], r); gr.addColorStop(0, `rgba(255,120,100,${.95 * lp})`); gr.addColorStop(.25, `rgba(255,40,30,${.6 * lp})`); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r); g.restore(); }
  }
  if (L.led) {
    const a = project(cam, [LED.x0, LED.y1, LED.z - .002]), b = project(cam, [LED.x1, LED.y1, LED.z - .002]), c = project(cam, [LED.x0, LED.y0, LED.z - .002]);
    onQuad(g, a, b, c, 200, 58, q => { q.font = '40px "VT323"'; q.fillStyle = `rgba(255,170,60,${.85 * L.led})`; q.textBaseline = 'middle'; q.shadowColor = 'rgba(255,150,40,.8)'; q.shadowBlur = 10;
      q.fillText('PRINTING' + '.'.repeat(1 + Math.floor(t * 2) % 3), 12, 31); });
  }
  if (o.gapGlow) {
    const a = project(cam, [2.4, 1.15, -.02]), b = project(cam, [-2.4, 1.15, -.02]), c = project(cam, [2.4, 0, -.02]);
    onQuad(g, a, b, c, 100, 100, q => {                                                    // brightest low in the middle, darker at the sides
      const gr = q.createRadialGradient(50, 100, 4, 50, 100, 70); gr.addColorStop(0, `rgba(190,205,225,${.6 * o.gapGlow})`); gr.addColorStop(.6, `rgba(170,185,210,${.26 * o.gapGlow})`); gr.addColorStop(1, 'rgba(150,165,190,0)');
      q.globalCompositeOperation = 'lighter'; q.fillStyle = gr; q.fillRect(0, 0, 100, 100); });
  }
  if (o.cctvLed) {
    const p = project(cam, CCTV_BOX.led);
    if (p) { const r = Math.max(3, 90 / p[2]); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(p[0], p[1], .5, p[0], p[1], r); gr.addColorStop(0, `rgba(255,140,120,${o.cctvLed})`); gr.addColorStop(.3, `rgba(255,30,20,${.7 * o.cctvLed})`); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r); g.restore(); }
  }
}
// CAM 05's lens: dark glass with a highlight (a sprite just in front of the housing)
function lensSprite(g, cam, k = 1) {
  const c = project(cam, CCTV_BOX.lens), e = project(cam, add3(CCTV_BOX.lens, mul3(CCTV_BOX.u, .036))), f = project(cam, add3(CCTV_BOX.lens, mul3(CCTV_BOX.v, .036)));
  if (!c || !e || !f) return;
  g.save(); g.setTransform(e[0] - c[0], e[1] - c[1], f[0] - c[0], f[1] - c[1], c[0], c[1]);
  ell(g, 0, 0, 1.25, 1.25, `rgb(${40 * k | 0},${40 * k | 0},${42 * k | 0})`);
  const gr = g.createRadialGradient(-.2, -.2, .05, 0, 0, 1); gr.addColorStop(0, `rgba(${70 * k | 0},${78 * k | 0},${92 * k | 0},1)`); gr.addColorStop(.7, 'rgba(8,8,12,1)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 6.2832); g.fill();
  ell(g, -.35, -.38, .22, .12, `rgba(255,255,255,${.55 * Math.min(1, k)})`, -.6);
  g.restore();
}

// ---------------------------------------------------------------- Leon: small on CAM 05 (from behind, no face), large in two prints
function guardBack(g, cam, x, z, k) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 1.82, z]); if (!feet || !head) return;
  const u = (feet[1] - head[1]) / 1.82, C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`;
  g.save(); g.translate(feet[0], feet[1]); g.scale(u, u);
  ell(g, 0, 0, .34, .07, 'rgba(0,0,0,.35)');
  poly(g, [[-.17, -.9], [-.03, -.9], [-.05, -.03], [-.16, -.03]], C(TROUS)); poly(g, [[.03, -.9], [.17, -.9], [.16, -.03], [.05, -.03]], C(TROUS));
  poly(g, [[-.24, -1.46], [.24, -1.46], [.22, -.86], [-.22, -.86]], C(SHIRT));
  poly(g, [[-.24, -1.44], [-.31, -1.02], [-.24, -.98], [-.19, -1.36]], C(SHIRT, .85));
  poly(g, [[.24, -1.44], [.33, -1.2], [.22, -1.12], [.19, -1.36]], C(SHIRT, .85));                // his right arm bent up (the print)
  g.fillStyle = C(SKIN, .7); g.fillRect(-.045, -1.58, .09, .12);
  ell(g, 0, -1.66, .095, .115, C(HAIR));
  poly(g, [[-.11, -1.72], [.11, -1.72], [.1, -1.81], [-.1, -1.81]], C(CAP));
  g.restore();
}
// from behind, close (the print he finds): light uniform shirt with SECURITY on the back, the camcorder up at his right eye
function leonBack(g, cam, x, z, k) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 1.8, z]); if (!feet || !head) return null;
  const u = (feet[1] - head[1]) / 1.8, C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`;
  g.save(); g.translate(feet[0], feet[1]); g.scale(u, u);
  poly(g, [[-.19, -.94], [-.02, -.94], [-.04, -.02], [-.17, -.02]], C(TROUS)); poly(g, [[.02, -.94], [.19, -.94], [.17, -.02], [.04, -.02]], C(TROUS, .9));
  poly(g, [[-.22, -.97], [.22, -.97], [.22, -.9], [-.22, -.9]], 'rgb(18,18,20)');
  poly(g, [[-.25, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT));
  poly(g, [[.02, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [.02, -.96]], C(SHIRT, .9));
  g.strokeStyle = C(SHIRT, .7); g.lineWidth = .008; g.beginPath(); g.moveTo(0, -1.45); g.lineTo(0, -.97); g.moveTo(-.2, -1.38); g.quadraticCurveTo(0, -1.33, .2, -1.38); g.stroke();
  poly(g, [[-.25, -1.46], [-.32, -1.38], [-.33, -1.06], [-.26, -1.03], [-.22, -1.3]], C(SHIRT, .9));            // left arm, the forearm forward to the prints
  ell(g, -.3, -1.02, .035, .03, C(SKIN, .8));
  poly(g, [[.22, -1.45], [.29, -1.48], [.46, -1.38], [.43, -1.31], [.29, -1.38]], C(SHIRT, .92));            // right arm: the elbow out
  poly(g, [[.46, -1.38], [.42, -1.31], [.19, -1.6], [.15, -1.66], [.2, -1.69]], C(SHIRT, .86));             // forearm up to the camcorder
  g.fillStyle = C([22, 22, 24]); g.fillRect(.06, -1.76, .2, .13); g.fillStyle = C([40, 40, 44]); g.fillRect(.02, -1.73, .06, .07);   // camcorder, eyecup
  ell(g, .2, -1.66, .035, .03, C(SKIN, .85));                                                                // his hand on it
  poly(g, [[-.05, -1.58], [.05, -1.58], [.058, -1.47], [-.058, -1.47]], C(SKIN, .7));                          // the back of the neck
  ell(g, -.1, -1.655, .02, .034, C(SKIN, .85)); ell(g, .1, -1.655, .02, .034, C(SKIN, .85));                    // ears
  ell(g, 0, -1.665, .1, .1, C([24, 20, 18]));                                                                    // short dark hair, the back of the head
  poly(g, [[-.07, -1.59], [.07, -1.59], [.05, -1.565], [-.05, -1.565]], C([24, 20, 18]));
  g.beginPath(); g.moveTo(-.118, -1.69); g.bezierCurveTo(-.122, -1.86, .122, -1.86, .118, -1.69); g.closePath(); g.fillStyle = C(CAP); g.fill();
  g.beginPath(); g.moveTo(-.05, -1.69); g.quadraticCurveTo(0, -1.75, .05, -1.69); g.closePath(); g.fillStyle = C([24, 20, 18]); g.fill();   // the strap opening
  g.fillStyle = C([70, 72, 80]); g.fillRect(-.055, -1.695, .11, .012);                                           // the strap
  g.restore();
  // SECURITY across his back (pixel space so the font renders)
  const p = [feet[0], feet[1] - 1.33 * u];
  g.save(); g.font = `${Math.round(.068 * u)}px "Special Elite"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C([30, 34, 52]); g.fillText('SECURITY', p[0], p[1]); g.restore();
  return { feet, u };
}
// mid-turn, seen from the front corner: his body turning to his right, the camcorder up over his face, his free arm swinging
function leonTurn(g, cam, x, z, k) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 1.8, z]); if (!feet || !head) return null;
  const u = (feet[1] - head[1]) / 1.8, C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`;
  g.save(); g.translate(feet[0], feet[1]); g.scale(u, u);
  poly(g, [[-.17, -.94], [-.01, -.94], [-.05, -.02], [-.18, -.02]], C(TROUS)); poly(g, [[.02, -.94], [.17, -.94], [.2, -.02], [.07, -.02]], C(TROUS, .85));
  poly(g, [[-.2, -.97], [.2, -.97], [.2, -.9], [-.2, -.9]], 'rgb(18,18,20)');
  poly(g, [[-.2, -1.46], [.22, -1.47], [.24, -1.3], [.2, -.95], [-.2, -.95], [-.23, -1.3]], C(SHIRT));
  poly(g, [[-.2, -1.46], [-.04, -1.46], [-.06, -.95], [-.2, -.95], [-.23, -1.3]], C(SHIRT, .82));            // the side turned away
  poly(g, [[.02, -1.45], [.05, -1.45], [.045, -1.0], [.02, -1.0]], C(SHIRT, .75));                             // shirt placket
  poly(g, [[.12, -1.4], [.19, -1.4], [.19, -1.33], [.12, -1.33]], C([200, 170, 60]));                          // the badge
  poly(g, [[-.2, -1.44], [-.3, -1.3], [-.36, -1.02], [-.29, -1.0], [-.24, -1.24], [-.17, -1.3]], C(SHIRT, .8)); // free arm, swinging back
  ell(g, -.33, -.99, .04, .035, C(SKIN, .8));
  poly(g, [[.2, -1.45], [.36, -1.32], [.32, -1.26], [.17, -1.36]], C(SHIRT, .95));                             // camera arm: elbow
  poly(g, [[.36, -1.32], [.31, -1.27], [.12, -1.58], [.17, -1.62]], C(SHIRT, .9));
  g.fillStyle = C(SKIN, .8); g.fillRect(-.045, -1.59, .09, .1);
  ell(g, -.02, -1.66, .095, .112, C(SKIN, .82));                                                                // head (no face shown:
  ell(g, -.075, -1.66, .05, .1, C(HAIR));                                                                       //  hair, cap, the camcorder)
  g.beginPath(); g.moveTo(-.115, -1.7); g.bezierCurveTo(-.11, -1.83, .1, -1.83, .1, -1.7); g.closePath(); g.fillStyle = C(CAP); g.fill();
  poly(g, [[.04, -1.71], [.2, -1.69], [.2, -1.665], [.04, -1.68]], C(CAP, .7));                                 // visor
  g.fillStyle = C([22, 22, 24]); g.fillRect(-.03, -1.72, .22, .14);                                             // the camcorder over his face
  ell(g, .19, -1.65, .045, .05, 'rgb(10,10,12)'); ell(g, .185, -1.66, .02, .022, `rgb(${70 * k | 0},${80 * k | 0},${96 * k | 0})`);
  ell(g, .15, -1.705, .009, .009, 'rgb(255,40,30)');                                                            // its red tally light
  ell(g, .12, -1.6, .04, .03, C(SKIN, .85));
  g.restore();
  return { feet, u };
}

// ---------------------------------------------------------------- the prints (600x400, flash photos, orange time imprint)
const PW = 600, PH = 400;
function photoGrade(c, stamp, o = {}) {
  const g = c.getContext('2d'), tmp = mk(PW, PH), tg = tmp.getContext('2d');
  tg.drawImage(c, 0, 0);
  g.save(); g.clearRect(0, 0, PW, PH); g.filter = `contrast(${o.contrast || 1.2}) saturate(1.15) brightness(${o.bright || 1.06}) blur(.5px)`; g.drawImage(tmp, 0, 0); g.filter = 'none';
  g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(255,238,214)'; g.fillRect(0, 0, PW, PH); g.globalCompositeOperation = 'source-over';
  const vg = g.createRadialGradient(PW / 2, PH / 2, PH * .3, PW / 2, PH / 2, PW * .62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, PW, PH);
  const R = TK.rng(o.seed || 3); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${.04 + R() * .05})`; g.fillRect(R() * PW, R() * PH, 1.4, 1.4); }
  g.font = '34px "VT323"'; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(255,120,30,.9)'; g.shadowBlur = 8; g.fillStyle = 'rgb(255,150,60)';
  g.fillText(stamp, PW - 26, PH - 20);
  g.restore();
  return c;
}
function photo(spec) {
  spec = Object.assign({ amb: 2.0, fog: .42 }, spec);
  const c = mk(PW, PH), g = c.getContext('2d');
  const sprites = (spec.sprites || []).slice();
  if (spec.signLit) sprites.push({ x: (SIGN.x0 + SIGN.x1) / 2, y: (SIGN.y0 + SIGN.y1) / 2, z: SIGN.z - .05, draw: (gg, cm) => emitters(gg, cm, { sign: 0 }, 0, { flashLit: spec.signLit }) });
  const cam = TK.render(g, SHOP, spec.cam, { ambient: spec.amb ?? 1.5, fog: spec.fog ?? .45, bg: [8, 8, 10], sprites });
  if (spec.after) spec.after(g, cam);
  return photoGrade(c, spec.stamp, spec);
}
const lookAt = (from, to, fov) => { const d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]; return { x: from[0], y: from[1], z: from[2], yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), fov }; };
const P = {};
function buildPrints() {
  const tgt = CCTV_C, lens = (g, cam) => lensSprite(g, cam, 1.4);
  const camSprite = { x: CCTV_BOX.lens[0], y: CCTV_BOX.lens[1], z: CCTV_BOX.lens[2], draw: lens };
  P[1] = photo({ cam: lookAt([-1.55, .95, 1.75], add3(tgt, [.1, -.05, .1]), 56), stamp: '3:08', sprites: [camSprite], seed: 1 });
  P[2] = photo({ cam: lookAt([-2.1, 1.0, 1.1], add3(tgt, [.04, -.02, .05]), 52), stamp: '3:09', sprites: [camSprite], seed: 2 });
  P[3] = photo({ cam: lookAt([-2.46, 1.05, .78], tgt, 50), stamp: '3:10', sprites: [camSprite], seed: 3 });
  P[4] = photo({ cam: lookAt([-2.52, 2.12, .7], add3(CCTV_BOX.lens, [0, -.01, 0]), 50), stamp: '3:11', sprites: [camSprite], seed: 4, fog: .6,
    after: (g, cam) => {                                                                                         // in the lens glass: two white points
      const c = project(cam, CCTV_BOX.lens); if (!c) return;
      for (const [dx, dy, r] of [[-7, -2, 2.6], [5, 2, 2.2]]) { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(c[0] + dx, c[1] + dy, r, 0, 6.2832); g.fill(); }
    } });
  // him from behind, a minute ago (taken from above his head height)
  const cam5 = lookAt([-1.02, 1.95, 3.72], [-.8, 1.25, 5.4], 54);
  P[5] = photo({ cam: cam5, stamp: '3:12', seed: 5, fog: .32, amb: 1.4, sprites: [
    { x: LEON.x, z: LEON.z, y: 1.2, draw: (g, cam) => {
      // his shadow on the machine, thrown forward by the flash
      const f = project(cam, [LEON.x + .05, 1.1, 5.89]); if (f) { g.save(); g.filter = 'blur(10px)'; ell(g, f[0] + 10, f[1] - 30, 120, 170, 'rgba(0,0,0,.55)'); g.restore(); }
      leonBack(g, cam, LEON.x, LEON.z, 1.15); } }] });
  // the last one: him mid-turn, from the corner under CAM 05, and it, bent over his shoulder
  const cam6 = lookAt([-2.15, .78, 2.0], [-.95, 1.5, 5.0], 38);
  P[6] = photo({ cam: cam6, stamp: '3:13', seed: 6, fog: .15, amb: 1.25, signLit: .8, sprites: [
    { x: -.56, z: 5.5, y: 1.2, draw: (g, cam) => itInPrint(g, cam, -.56, 5.5) },
    { x: LEON.x, z: LEON.z, y: 1.2, draw: (g, cam) => smeared(g, gg => leonTurn(gg, cam, LEON.x, LEON.z, 1.2), 7) }] });
}
// a figure drawn with a sideways motion smear (he is turning)
function smeared(g, draw, px) {
  const c = smeared.c || (smeared.c = mk(PW, PH)), cg = c.getContext('2d');
  cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, PW, PH); cg.setTransform(g.getTransform()); draw(cg); cg.setTransform(1, 0, 0, 1, 0, 0);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = -3; i <= 3; i++) { g.globalAlpha = i === 0 ? 1 : .22; g.drawImage(c, i * px / 3, 0); }
  g.restore();
}
// BROKEN in the last print: pitch black (the flash does not light it), leaning in over his shoulder, the two white points
function itInPrint(g, cam, x, z) {
  const f = project(cam, [x, 0, z]), h = project(cam, [x, 2.1, z]); if (!f || !h) return;
  const u = (f[1] - h[1]) / 2.1;
  g.save(); g.translate(f[0], f[1]); g.scale(u, u);
  TK.ghost._draw(g, 'broken', { u, bend: -.86, tilt: .8, armR: .1, seed: 9 });
  g.restore();
}

// ---------------------------------------------------------------- the camcorder: hand-held drift, his hand, the held prints
// a hand-held camera: step bob plus an uneven nervous drift (no two seconds alike), more when he is scared (nerve 0..1)
function handheld(t, t0, rate, walking, nerve) {
  const ph = (t - t0) * rate, step = walking ? Math.abs(Math.sin(ph * Math.PI)) : 0;
  const n = k => Math.sin(t * 1.3 * k + k) * .6 + Math.sin(t * 2.9 * k + 2 * k) * .3 + Math.sin(t * 7.1 * k) * .1;
  const amp = .012 + .02 * nerve;
  return { y: step * .03 + n(1.1) * amp * .5, yaw: n(.9) * amp * .8 + (walking ? Math.sin(ph * Math.PI * .5) * .015 : 0), pitch: n(1.7) * amp * .5, roll: n(.7) * amp * .6 + (walking ? Math.sin(ph * Math.PI) * .008 : 0) };
}
// his hand with the flashlight, the sleeve into frame from the bottom right (as tape 6)
function handTorch(g, bob, tremble = 0, t = 0) {
  const jx = tremble * (Math.sin(t * 41) * 5 + Math.sin(t * 67) * 3), jy = tremble * Math.sin(t * 53) * 4;
  g.save(); g.translate(jx, bob * .6 + jy);
  g.fillStyle = 'rgb(72,82,104)'; g.beginPath(); g.moveTo(1080, 640); g.lineTo(930, 700); g.lineTo(900, 810); g.lineTo(1080, 810); g.closePath(); g.fill();
  g.fillStyle = 'rgb(90,102,128)'; g.beginPath(); g.moveTo(940, 696); g.lineTo(930, 700); g.lineTo(906, 790); g.lineTo(918, 792); g.closePath(); g.fill();
  g.fillStyle = 'rgb(176,136,110)'; g.beginPath(); g.ellipse(905, 690, 46, 34, -.5, 0, 6.2832); g.fill();
  g.fillStyle = 'rgb(18,18,20)'; g.save(); g.translate(880, 668); g.rotate(-.62); g.fillRect(-120, -16, 150, 32); g.fillStyle = 'rgb(60,60,64)'; g.fillRect(-128, -20, 14, 40); g.restore();
  g.restore();
}
// a print held up to the lens by its bottom edge: his palm and wrist behind it, the thumb in front, the forearm and sleeve down
// to the bottom edge of the frame. light: 0..1 (the flashlight on the machine, from the right)
function heldPrint(g, img, cx, cy, w, rot, light = 1, o = {}) {
  const h = w / 1.5;
  if (o.hand !== false) handBack(g, cx, cy, w, h, rot, light);
  printOnly(g, img, cx, cy, w, rot, light, o.stack || 0);
  if (o.hand !== false) thumb(g, cx, cy, w, h, rot, light);
}
function printOnly(g, img, cx, cy, w, rot, light, stack = 0) {
  const h = w / 1.5;
  g.save(); g.translate(cx, cy); g.rotate(rot);
  for (let i = stack; i >= 1; i--) { const k = .5 + .45 * light - i * .08; g.fillStyle = `rgb(${215 * k | 0},${210 * k | 0},${200 * k | 0})`; g.fillRect(-w / 2 + i * 3, -h / 2 + i * 4, w, h); }
  g.drawImage(img, -w / 2, -h / 2, w, h);
  const lg = g.createLinearGradient(-w / 2, 0, w / 2, 0);
  lg.addColorStop(0, `rgba(0,0,0,${.6 - .32 * light})`); lg.addColorStop(.6, `rgba(0,0,0,${.32 - .28 * light})`); lg.addColorStop(1, `rgba(0,0,0,${Math.max(0, .18 - .3 * light)})`);
  g.fillStyle = lg; g.fillRect(-w / 2, -h / 2, w, h);
  g.globalCompositeOperation = 'lighter'; const sh = g.createLinearGradient(-w * .1, -h / 2, w * .25, h / 2);
  sh.addColorStop(0, 'rgba(255,250,240,0)'); sh.addColorStop(.5, `rgba(255,250,240,${.06 * light})`); sh.addColorStop(1, 'rgba(255,250,240,0)'); g.fillStyle = sh; g.fillRect(-w / 2, -h / 2, w, h);
  g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(255,255,255,${.12 * light})`; g.lineWidth = 2; g.strokeRect(-w / 2, -h / 2, w, h);
  g.restore();
}
const skinC = (k, m = 1) => `rgb(${176 * k * m | 0},${136 * k * m | 0},${110 * k * m | 0})`;
// the hand's frame: at the print's bottom edge, 28% of the width right of centre; px = local x (along the print), py = down
function handFrame(cx, cy, w, h, rot) {
  const c = Math.cos(rot), s = Math.sin(rot), bx = .28 * w, by = h / 2, sc = clamp(w / 620, .35, 1.4);
  return (x, y) => { const X = bx + x * sc, Y = by + y * sc; return [cx + X * c - Y * s, cy + X * s + Y * c]; };
}
function handBack(g, cx, cy, w, h, rot, light) {
  const L = handFrame(cx, cy, w, h, rot), k = .5 + .5 * light, sc = clamp(w / 620, .35, 1.4);
  const sl = `rgb(${110 * k | 0},${124 * k | 0},${150 * k | 0})`, cuff = `rgb(${92 * k | 0},${104 * k | 0},${128 * k | 0})`;
  const far = L(170, 900);
  poly(g, [L(-26, 112), L(58, 104), [far[0] + 140 * sc, far[1]], [far[0] - 120 * sc, far[1]]], sl);                   // sleeve and forearm
  poly(g, [L(-30, 104), L(60, 96), L(66, 124), L(-28, 132)], cuff);                                                      // cuff
  poly(g, [L(-30, 34), L(44, 30), L(52, 104), L(-24, 108)], skinC(k, .92));                                              // wrist
  g.save(); const pc = L(6, 22); g.translate(pc[0], pc[1]); g.rotate(rot); g.scale(sc, sc);
  ell(g, 0, 0, 56, 44, skinC(k)); ell(g, 18, 6, 34, 30, skinC(k, .9));                                                  // palm (its top behind the print)
  g.restore();
}
function thumb(g, cx, cy, w, h, rot, light) {
  const L = handFrame(cx, cy, w, h, rot), k = .5 + .5 * light, sc = clamp(w / 620, .35, 1.4);
  const a = L(-30, 14), b = L(-52, -66), m = L(-34, -26);
  g.save(); g.lineCap = 'round'; g.strokeStyle = skinC(k, .95); g.lineWidth = 34 * sc;
  g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(m[0], m[1], b[0], b[1]); g.stroke();
  g.strokeStyle = skinC(k, .78); g.lineWidth = 7 * sc; const a2 = L(-16, 10), m2 = L(-20, -26), b2 = L(-38, -66);
  g.beginPath(); g.moveTo(a2[0], a2[1]); g.quadraticCurveTo(m2[0], m2[1], b2[0], b2[1]); g.stroke();                    // shade along one side
  const n = L(-52, -70); g.translate(n[0], n[1]); g.rotate(rot - .25); g.scale(sc, sc);
  ell(g, 0, 0, 11, 13, `rgb(${206 * k | 0},${172 * k | 0},${152 * k | 0})`);                                           // thumbnail
  g.restore();
}
// the camera notices: focus hunting, exposure, camcorder gain noise in the dark
const recCut = t => TL.RECCUT.some(c => t >= c - .06 && t < c + .16);
function standby(g, t) {
  g.fillStyle = '#050506'; g.fillRect(0, 0, W, H);
  g.save(); g.font = '46px "VT323"'; g.fillStyle = 'rgba(235,240,235,.92)'; g.textBaseline = 'top'; g.fillText('STBY', 36, 30);
  g.textAlign = 'right'; g.fillText('AM 3:12', W - 36, H - 128); g.fillText('DEC.02.1999', W - 36, H - 82); g.restore();
}
function stampSec(t) { const [h0, m0, s0] = TL.STAMP0; return Math.floor(h0 * 3600 + m0 * 60 + s0 + t); }
function stamp(t) { const s = stampSec(t), p = n => String(n).padStart(2, '0'); return `${TL.DATE}  ${p(Math.floor(s / 3600) % 24)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`; }
const camTime = t => { const s = stampSec(t); return `AM ${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`; };

// ---------------------------------------------------------------- S1: the machine printing in the dark (camcorder)
function poseMachine(t) {
  const s = TL.SHOTS[0], k1 = ease((t - 1.6) / 2.4), k2 = ease((t - 4.1) / 1.9), k3 = ease((t - TL.TILT_TRAY[0]) / (TL.TILT_TRAY[1] - TL.TILT_TRAY[0]));
  const walking = (t > 1.7 && t < 3.6) || (t > TL.TILT_TRAY[0] + .2 && t < TL.TILT_TRAY[1]), h = handheld(t, s[1], 1.7, walking, .25);
  let z = lerp(5.0, 4.0, k1), pitch = lerp(-.68, .1, k1), yaw = lerp(-.03, -.14, k1), fov = lerp(36, 62, k1), x = lerp(-.9, -.7, k1);
  yaw += .42 * k2; pitch -= .06 * k2;
  z = lerp(z, 4.75, k3); yaw = lerp(yaw, -.04, k3); pitch = lerp(pitch, -.62, k3); fov = lerp(fov, 42, k3); x = lerp(x, -.9, k3);
  return { cam: { x, y: 1.6 - h.y, z, yaw: yaw + h.yaw, pitch: pitch + h.pitch, fov }, h, walking };
}
// the prints in the tray: the stack (the top one is the last print of the tape), then the ones that slide out and land
function trayPrint(g, cam, img, k, slide = 1, jitter = 0) {
  const T = TRAY, along = (a, x) => { const zz = lerp(T.zb, T.zf + .01, a), yy = lerp(T.yb, T.yf, a) + .004 + k * .0025; return [x, yy, zz]; };
  const a0 = lerp(-.42, .2, slide), a1 = a0 + .42, x0 = -1.005 + jitter, x1 = x0 + .21;
  const TLp = project(cam, along(a0, x0)), TRp = project(cam, along(a0, x1)), BLp = project(cam, along(a1, x0));
  if (a0 < 0) {                                                                                                  // still half in the slot
    const top = project(cam, along(0, x0)), top2 = project(cam, along(0, x1)), bl = project(cam, along(a1, x0)), br = project(cam, along(a1, x1));
    if (!top || !top2 || !bl || !br) return;
    g.save(); poly(g, [top, top2, br, bl]); g.clip(); onQuad(g, TLp, TRp, BLp, PW, PH, q => q.drawImage(img, 0, 0)); g.restore(); return;
  }
  onQuad(g, TLp, TRp, BLp, PW, PH, q => { q.drawImage(img, 0, 0); q.strokeStyle = 'rgba(0,0,0,.35)'; q.lineWidth = 4; q.strokeRect(0, 0, PW, PH); });
}
function shotMachine(g, t) {
  const { cam: cs, h, walking } = poseMachine(t);
  const sign = signA(t);
  const cam = TK.render(g, SHOP, cs, { ambient: 1.0, fog: .02 });
  const fx = 560 + Math.sin(t * 1.3) * 40, fy = 450 - h.y * 400;
  lightUp(g, cam, { base: .1, sign, lamp: 1, hand: { x: fx, y: fy, r: 360, a: .95 } });
  emitters(g, cam, { sign, lamp: 1, led: 1 }, t);
  // the stack in the tray: the top print is the last print of the tape; two more land on it
  trayPrint(g, cam, P[3], 0, 1, .01); trayPrint(g, cam, P[6], 1, 1, -.005);
  const d0 = TL.DROPS[0], d1 = TL.DROPS[1];
  if (t > d0 - .65) trayPrint(g, cam, P[1], 2, ease((t - (d0 - .65)) / .65), .015);
  if (t > d1 - .65) trayPrint(g, cam, P[2], 3, ease((t - (d1 - .65)) / .65), -.01);
  handTorch(g, h.y * 400, 0, t);
  const blur = 7 * Math.exp(-(t - .5) / .25) + (t > 1.7 && t < 2.6 ? 3.5 * Math.sin((t - 1.7) / .9 * Math.PI) : 0) + (t > TL.TILT_TRAY[1] - .3 && t < TL.TILT_TRAY[1] + .4 ? 2.5 * Math.sin((t - TL.TILT_TRAY[1] + .3) / .7 * Math.PI) : 0);
  return { roll: h.roll, bgBlur: blur };
}

// ---------------------------------------------------------------- S2: the prints in his hand (camcorder)
function shotPrints(g, fg, t) {
  const s = TL.SHOTS[1], nerve = clamp((t - TL.FLIPS[3]) / 1.5) * .8 + (t > TL.SHUTTER ? .5 : 0), h = handheld(t, s[1], 0, false, nerve);
  const cam = TK.render(g, SHOP, { x: -.88, y: 1.5 - h.y, z: 4.72, yaw: -.06 + h.yaw, pitch: -.62 + h.pitch, fov: 58 }, { ambient: 1.0, fog: .02 });
  lightUp(g, cam, { base: .08, sign: signA(t) * .8, torch: 1, lamp: 1 });
  emitters(g, cam, { sign: signA(t) * .8, lamp: 1 }, t);
  // the stack: P1 .. P5, flipped one by one; the top slides off to the left
  const n = TL.FLIPS.filter(f => t >= f + .4).length, flipping = TL.FLIPS.findIndex(f => t >= f && t < f + .4);
  const jolt = t >= TL.SHUTTER && t < TL.SHUTTER + .3 ? Math.sin((t - TL.SHUTTER) / .3 * Math.PI * 3) * 9 * (1 - (t - TL.SHUTTER) / .3) : 0;
  const tr = nerve * (Math.sin(t * 37) * 2.5 + Math.sin(t * 61) * 1.5);
  const near = ease((t - (TL.FLIPS[3] + .5)) / 1.4) * 70;                                // he brings the print of himself closer
  const cx = 505 + h.yaw * -300 + tr + jolt, cy = 372 + h.pitch * 300 + tr * .6 + jolt * .4 - near * .25, w = 620 + near, rot = -.05 + tr * .002;
  const top = 1 + n, stackN = Math.max(0, 4 - n);
  fg.clearRect(0, 0, W, H);
  handBack(fg, cx, cy, w, w / 1.5, rot, 1);
  if (flipping >= 0) {
    printOnly(fg, P[top + 1], cx, cy, w, rot, 1, Math.max(0, stackN - 1));
    const u = ease((t - TL.FLIPS[flipping]) / .4);
    printOnly(fg, P[top], cx - u * 760, cy + u * 140, w, rot - u * .35, 1);
  } else printOnly(fg, P[top], cx, cy, w, rot, 1, stackN);
  thumb(fg, cx, cy, w, w / 1.5, rot, 1);
  let fgBlur = 7 * Math.exp(-(t - s[1]) / .22);
  if (t > TL.FOCUS_P5[0] && t < TL.FOCUS_P5[1]) fgBlur += 5 * Math.abs(Math.sin((t - TL.FOCUS_P5[0]) / (TL.FOCUS_P5[1] - TL.FOCUS_P5[0]) * Math.PI * 1.5));
  if (t >= TL.SHUTTER && t < TL.SHUTTER + .35) fgBlur += 2.5;
  return { roll: h.roll, bgBlur: 9, fgBlur };
}

// ---------------------------------------------------------------- S3: CAM 05 played back (black and white, 6 fps)
let C05 = null, EYES_P = null, BEHIND_P = null;
function eyes(g, p, a = 1) {
  g.save(); g.filter = 'blur(1px)'; g.fillStyle = `rgba(255,255,255,${a})`;
  g.beginPath(); g.ellipse(p[0] - 6, p[1], 3.2, 2.7, 0, 0, 6.2832); g.ellipse(p[0] + 6, p[1] + 3.4, 2.7, 2.4, 0, 0, 6.2832); g.fill();
  g.filter = 'blur(5px)'; g.fillStyle = `rgba(255,255,255,${.35 * a})`; g.beginPath(); g.ellipse(p[0], p[1] + 1.5, 16, 8, 0, 0, 6.2832); g.fill();
  g.restore();
}
function cctvZoom(t) {
  const P0 = [W / 2, H / 2];
  if (t < TL.CRASH[0]) { const k = ease((t - TL.PUSH[0]) / (TL.PUSH[1] - TL.PUSH[0])); return { z: lerp(1, 1.6, k), f: [lerp(P0[0], BEHIND_P[0], k), lerp(P0[1], BEHIND_P[1], k)], k: .5 * k }; }
  const c = ease((t - TL.CRASH[0]) / (TL.CRASH[1] - TL.CRASH[0])), R = TK.rng(Math.floor(t * 60) + 5), sh = 14 * Math.exp(-(t - TL.CRASH[0]) * 6);
  return { z: lerp(1.6, 2.6, c), f: [lerp(BEHIND_P[0], EYES_P[0], c) + (R() - .5) * sh, lerp(BEHIND_P[1], EYES_P[1], c) + (R() - .5) * sh], k: lerp(.5, .85, c) };
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
  const skip = t >= TL.SKIP[0] && t < TL.SKIP[0] + TL.SKIP[1] + .5;
  const tq = skip ? M.stutter(t, FPS_CCTV, 7) : qf(t);
  const sign = signA(tq), L = { base: .14, sign, torch: 1, lamp: 1 };
  const cam = TK.render(RG, SHOP, CAM05, { ambient: 1.0, fog: .02 });
  lightUp(RG, cam, L);
  emitters(RG, cam, { sign, lamp: 1, led: .8 }, tq);
  guardBack(RG, cam, LEON.x, LEON.z, .55 + .35 * sign);
  if (tq >= TL.EYES) eyes(RG, EYES_P, tq < TL.EYES + 1 / FPS_CCTV ? .55 : 1);
  const Z = cctvZoom(t);
  zoomInto(WK, RAW, Z);
  TK.grade(WG, WORK, tq, 'cctv');
  const gk = glitchAt(t); TK.vhs(WG, tq, gk ? 2.5 : 1, 5);
  if (gk) { tear(WG, t, Math.sin(gk[0] * Math.PI)); TK.statics(WG, t, .4 * Math.sin(gk[0] * Math.PI)); }
  if (t < TL.ROLL[1]) trackingRoll(WG, t, (t - TL.ROLL[0]) / (TL.ROLL[1] - TL.ROLL[0]));
  TK.osd(WG, 'cctv', t, { cam: 'CAM 05', place: 'FOTO 1 HOUR', stamp: stamp(t) });
  readout(WG, Z.z);
}

// ---------------------------------------------------------------- S4: in the dark (camcorder): the flash, the turn, the last print
function torchA(t) {
  if (t >= TL.TORCH_OFF && t < TL.TORCH_ON) return t < TL.TORCH_OFF + .1 ? [0, 1, 0, .4, 0, 0][Math.floor((t - TL.TORCH_OFF) * 60)] ?? 0 : 0;
  if (t >= TL.TORCH_ON && t < TL.TORCH_ON + .25) return [1, 0, 0, .6, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1][Math.floor((t - TL.TORCH_ON) * 60)] ?? 1;
  return 1;
}
function poseDark(t) {
  const whine = inR(t, [TL.WHINE[0], TL.POP]);
  const nerve = t < TL.WHINE[0] ? .55 : whine ? lerp(.7, .08, clamp((t - TL.WHINE[0]) / .8)) : t < TL.WHIP[1] ? .2 : 1;
  const h = handheld(t, 0, 0, false, nerve);
  let yaw = 0, pitch = -.2, fov = 58;
  pitch += .5 * ease((t - TL.LOOK_UP[0]) / (TL.LOOK_UP[1] - TL.LOOK_UP[0])) - .35 * ease((t - TL.LOOK_DOWN[0]) / (TL.LOOK_DOWN[1] - TL.LOOK_DOWN[0]));
  yaw += .07 * ease((t - TL.WHINE[0]) / 2.0);                                              // he almost turns, and does not
  if (t >= TL.WHIP[0]) yaw = lerp(.07, 3.32, ease((t - TL.WHIP[0]) / (TL.WHIP[1] - TL.WHIP[0])));
  if (t >= TL.WHIP[1]) { yaw = lerp(3.32, 3.14, ease((t - TL.WHIP[1]) / .7)); pitch = lerp(pitch, -.1, ease((t - TL.WHIP[1]) / .7)); }
  if (t >= TL.CAM_UP[0]) { const k = ease((t - TL.CAM_UP[0]) / (TL.CAM_UP[1] - TL.CAM_UP[0])); yaw = lerp(yaw, 3.57, k); pitch = lerp(pitch, .27, k); fov = lerp(58, 24, k); }
  if (t >= TL.TURN_BACK[0]) { const k = ease((t - TL.TURN_BACK[0]) / (TL.TURN_BACK[1] - TL.TURN_BACK[0])); yaw = lerp(3.57, -.04, k); pitch = lerp(.27, -.5, k); fov = lerp(24, 50, k); }
  return { cam: { x: -.86, y: 1.56 - h.y, z: 4.72, yaw: yaw + h.yaw, pitch: pitch + h.pitch, fov }, h };
}
function darkLight(t) { return { base: .045, sign: 0, torch: torchA(t), lamp: 1, gap: 1.7 }; }
function darkScene(g, cs, t, o = {}) {
  const cam = TK.render(g, SHOP, cs, { ambient: 1.0, fog: .02, sprites: o.sprites });
  const L = darkLight(t);
  lightUp(g, cam, L);
  emitters(g, cam, { sign: 0, lamp: 1, led: .6 }, t, { after: .5, cctvLed: 1, gapGlow: 1 });
  return cam;
}
let FLASHIMG = null;
function buildFlash() {
  const c = mk(W, H), g = c.getContext('2d'), { cam: cs } = poseDark(TL.POP);
  const cam = TK.render(g, SHOP, cs, { ambient: 1.25, fog: .05, bg: [40, 40, 44] });
  emitters(g, cam, { sign: 0, lamp: 0 }, TL.POP, { flashLit: 1 });
  // the flash: hot in the middle, falling off at the corners
  g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(560, 380, 50, 560, 380, 760); gr.addColorStop(0, 'rgba(210,220,255,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  // the two shadows the flash throws up the wall, across the dead lightbox: his (cap, shoulders, the raised arm and the camcorder)
  // and, left of it and taller, its: the head lying over sideways, uneven shoulders, one arm hanging long, the other reaching
  // across, its hand resting on his shoulder
  const sc = mk(W, H), sg = sc.getContext('2d');
  sg.fillStyle = '#000';
  sg.beginPath(); sg.moveTo(450, 900); sg.bezierCurveTo(452, 700, 470, 572, 560, 548); sg.lineTo(626, 530); sg.lineTo(628, 452);   // his left side and shoulder, neck
  sg.bezierCurveTo(578, 430, 568, 300, 600, 276); sg.bezierCurveTo(616, 238, 700, 228, 728, 270); sg.bezierCurveTo(752, 306, 748, 400, 712, 450);   // head and cap
  sg.lineTo(716, 520); sg.bezierCurveTo(770, 530, 812, 536, 830, 548); sg.bezierCurveTo(880, 580, 900, 700, 900, 900); sg.closePath(); sg.fill();
  sg.fillRect(728, 330, 96, 70);                                                                                                // the camcorder at his eye
  sg.beginPath(); sg.moveTo(790, 386); sg.lineTo(824, 392); sg.lineTo(914, 462); sg.lineTo(906, 498); sg.bezierCurveTo(870, 524, 846, 540, 830, 552); sg.lineTo(790, 530); sg.closePath(); sg.fill();   // his raised arm
  g.save(); g.filter = 'blur(2px)'; g.drawImage(sc, 0, 0); g.restore();                                                     // his: crisp
  // its shadow, on its own layer so its edges can be soft like the figure (BROKEN's blurred edges): heavier and taller than
  // his, the shoulders uneven, the waist too narrow, the skull lying over on its side toward his head, one arm hanging past
  // where its knee would be, the other bending up the wrong way at the elbow and coming down onto his shoulder
  const ic = mk(W, H), ig = ic.getContext('2d'); ig.fillStyle = '#000';
  const fillE = (x, y, rx, ry, r) => { ig.beginPath(); ig.ellipse(x, y, rx, ry, r, 0, 6.2832); ig.fill(); };
  ig.beginPath(); ig.moveTo(170, 380); ig.bezierCurveTo(205, 334, 290, 322, 330, 316); ig.lineTo(380, 308); ig.bezierCurveTo(420, 300, 452, 302, 464, 324);
  ig.bezierCurveTo(478, 382, 440, 470, 410, 560); ig.bezierCurveTo(394, 640, 410, 760, 420, 900); ig.lineTo(185, 900);
  ig.bezierCurveTo(205, 760, 216, 640, 206, 560); ig.bezierCurveTo(196, 480, 158, 432, 170, 380); ig.closePath(); ig.fill();
  ig.beginPath(); ig.moveTo(334, 318); ig.bezierCurveTo(336, 280, 352, 248, 380, 226); ig.lineTo(410, 240); ig.bezierCurveTo(388, 262, 378, 290, 380, 314); ig.closePath(); ig.fill();   // neck
  fillE(398, 236, 50, 40, .2); fillE(462, 232, 78, 58, .45);                                                                  // jaw and skull, on its side
  ig.beginPath(); ig.moveTo(178, 372); ig.bezierCurveTo(132, 480, 116, 620, 108, 780); ig.lineTo(140, 784); ig.bezierCurveTo(150, 640, 176, 500, 226, 400); ig.closePath(); ig.fill();   // the long arm
  for (let f = 0; f < 4; f++) { ig.beginPath(); ig.moveTo(108 + f * 8, 772); ig.quadraticCurveTo(100 + f * 10, 812, 104 + f * 13, 856); ig.lineTo(115 + f * 13, 856); ig.quadraticCurveTo(110 + f * 10, 812, 119 + f * 8, 772); ig.fill(); }
  ig.beginPath(); ig.moveTo(440, 318); ig.lineTo(512, 300); ig.lineTo(530, 330); ig.lineTo(462, 356); ig.closePath(); ig.fill();                      // upper arm, up
  ig.beginPath(); ig.moveTo(506, 304); ig.lineTo(536, 326); ig.bezierCurveTo(566, 380, 590, 430, 598, 470); ig.lineTo(570, 478); ig.bezierCurveTo(560, 430, 530, 372, 506, 304); ig.closePath(); ig.fill();   // forearm, down
  fillE(590, 484, 34, 24, .6);
  for (let f = 0; f < 4; f++) { ig.beginPath(); ig.moveTo(578 + f * 10, 492); ig.quadraticCurveTo(596 + f * 12, 518, 604 + f * 13, 566); ig.lineTo(616 + f * 13, 564); ig.quadraticCurveTo(608 + f * 12, 516, 592 + f * 10, 488); ig.fill(); }
  g.save(); g.filter = 'blur(16px)'; g.globalAlpha = .55; g.drawImage(ic, 0, 0); g.filter = 'blur(5px)'; g.globalAlpha = 1; g.drawImage(ic, 0, 0); g.restore();

  FLASHIMG = c;
}
function shotDark(g, fg, t) {
  fg.clearRect(0, 0, W, H);
  const { cam: cs, h } = poseDark(t);
  let bgBlur = 7 * Math.exp(-(t - TL.SHOTS[3][1]) / .22), fgBlur = 0, bright = 1, noise = .1;
  if (inR(t, TL.FLASH)) {
    if (!FLASHIMG) buildFlash();
    if (t < TL.FLASH[0] + 2 / 60) { g.fillStyle = 'rgb(250,252,255)'; g.fillRect(0, 0, W, H); return { roll: 0, bgBlur: 0, fgBlur: 0, bright: 1.5, noise: 0 }; }
    g.drawImage(FLASHIMG, 0, 0); return { roll: h.roll, bgBlur: .6, fgBlur: 0, bright: 1.35, noise: 0 };
  }
  if (t >= TL.WHIP[0] && t < TL.WHIP[1]) {                                                   // the spin: smeared
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const { cam } = poseDark(t - i * .016); darkScene(TG, cam, t); g.globalAlpha = 1 / (i + 1); g.drawImage(TMP, 0, 0); }
    g.globalAlpha = 1;
    return { roll: h.roll + Math.sin((t - TL.WHIP[0]) / (TL.WHIP[1] - TL.WHIP[0]) * Math.PI) * .07, bgBlur: 3, fgBlur: 0, bright: 1.1, noise: .2 };
  }
  const cam = darkScene(g, cs, t);
  // the prints in the tray, lit by the flashlight once it is back
  if (t < TL.WHIP[0] || t >= TL.TURN_BACK[0]) { trayPrint(g, cam, P[2], 0, 1, -.01); if (t >= TL.DROP_LAST) { if (t < TL.PICKUP[0] + .2) trayPrint(g, cam, P[6], 1, ease((t - (TL.DROP_LAST - .65)) / .65), .01); } }
  if (inR(t, TL.AFTER)) {                                                                     // the camcorder recovers: a burnt-in ghost of the flash
    if (!FLASHIMG) buildFlash();
    const k = (t - TL.AFTER[0]) / (TL.AFTER[1] - TL.AFTER[0]);
    TG.setTransform(1, 0, 0, 1, 0, 0); TG.globalCompositeOperation = 'source-over'; TG.drawImage(FLASHIMG, 0, 0);
    TG.globalCompositeOperation = 'multiply'; TG.fillStyle = 'rgb(150,90,210)'; TG.fillRect(0, 0, W, H); TG.globalCompositeOperation = 'source-over';
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55 * Math.pow(1 - k, 1.6); g.drawImage(TMP, 0, 0); g.restore();
    bgBlur = 2 + 3 * k; noise = .25;
  }
  if (t >= TL.WHIP[1] && t < TL.TURN_BACK[0]) {                                              // facing the door: autofocus hunts in the dark
    bgBlur = 2.2 + 3.2 * Math.abs(Math.sin((t - TL.WHIP[1]) * 2.6)) * (t > TL.CAM_UP[1] + .3 ? .35 : 1); noise = .26;
  }
  if (t >= TL.TURN_BACK[0] && t < TL.TORCH_ON + .3) noise = .2;
  // his hand takes the new print from the tray and raises it to the lens
  if (t >= TL.PICKUP[0]) {
    const k = ease((t - TL.PICKUP[0]) / (TL.PICKUP[1] - TL.PICKUP[0]));
    const T = TRAY, a = project(cam, [-.95, lerp(T.yb, T.yf, .5), lerp(T.zb, T.zf, .5)]) || [520, 520];
    const nerve = t > TL.WHINE2 ? .9 : .5, tr = nerve * (Math.sin(t * 37) * 2.2 + Math.sin(t * 61) * 1.4);
    const pk = ease((t - TL.PRINT_FOCUS[1]) / (TL.END - TL.PRINT_FOCUS[1])) * .9, w = lerp(150, lerp(790, 1000, pk), k);
    const cx = lerp(a[0], lerp(520, 545 + .105 * w, pk), k) + tr - h.yaw * 260, cy = lerp(a[1], lerp(392, 380 + .06 * w, pk), k) + tr * .6 + h.pitch * 260, rot = lerp(-.25, -.03, k);
    heldPrint(fg, P[6], cx, cy, w, rot, torchA(t));
    fgBlur = t < TL.PRINT_FOCUS[0] ? 2 : t < TL.PRINT_FOCUS[1] ? 5.5 * Math.abs(Math.sin((t - TL.PRINT_FOCUS[0]) / (TL.PRINT_FOCUS[1] - TL.PRINT_FOCUS[0]) * Math.PI * 1.5)) : 0;
    bgBlur = Math.max(bgBlur, 7 * k);
  } else if (t >= TL.TURN_BACK[1]) {
    const reach = ease((t - TL.TURN_BACK[1]) / (TL.PICKUP[0] - TL.TURN_BACK[1]));
    if (reach > 0) { const x = lerp(1250, 600, reach), y = lerp(1000, 560, reach); handBack(fg, x, y, 260, 173, -.25, torchA(t)); thumb(fg, x, y, 260, 173, -.25, torchA(t)); }   // the hand reaching in
  }
  return { roll: h.roll, bgBlur, fgBlur, bright, noise };
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

// camcorder gain-up in the dark: bright speckle added over the picture (keeps the blacks, unlike a static veil)
function gainNoise(g, t, a) {
  TK.statics(NZG, t * 1.37 + 3, 1);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .42; g.drawImage(NZ, 0, 0); g.restore();
}
function camcorder(s, t) {
  let r;
  if (s[0] === 'machine') { r = shotMachine(RG, t); FGG.clearRect(0, 0, W, H); r.fgBlur = 0; }
  else if (s[0] === 'prints') r = shotPrints(RG, FGG, t);
  else r = shotDark(RG, FGG, t);
  WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, W, H);
  WK.translate(540, 405); WK.rotate(r.roll || 0); WK.scale(1.05, 1.05); WK.translate(-540, -405);
  WK.filter = `blur(${(r.bgBlur || 0).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0);
  WK.filter = `blur(${(r.fgBlur || 0).toFixed(2)}px)`; WK.drawImage(FG, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
  TK.grade(WG, WORK, t, 'camcorder', { brightness: (r.bright || 1) * (.95 + .07 * Math.sin(t * 1.7) + .04 * Math.sin(t * 4.3)) });
  if (r.noise) gainNoise(WG, t, r.noise);
  const gk = glitchAt(t); TK.vhs(WG, t, gk ? 2.2 : .9, 6);
  if (gk) { tear(WG, t, Math.sin(gk[0] * Math.PI)); TK.statics(WG, t, .35 * Math.sin(gk[0] * Math.PI)); }
  TK.osd(WG, 'camcorder', t, { time: camTime(t), date: 'DEC.02.1999', battery: 1 });
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
window.debugPrints = () => { OUT.fillStyle = '#333'; OUT.fillRect(0, 0, 1080, 1920); [1, 2, 3, 4, 5, 6].forEach((k, i) => OUT.drawImage(P[k], (i % 2) * 540, Math.floor(i / 2) * 380 + 40, 530, 353)); };

// ---------------------------------------------------------------- sound cues
function buildEvents() {
  const SH = Object.fromEntries(TL.SHOTS.map(s => [s[0], s])), EV = [];
  // the lightbox: a tick whenever it drops out or strikes back (on its own 12 Hz grid), while it still works
  let prev = 1;
  for (let f = Math.ceil(.5 * 12); f / 12 < TL.SIGN_DIE; f++) { const a = signA(f / 12); if (Math.abs(a - prev) > .4) EV.push({ type: 'tick', t: +(f / 12).toFixed(3), g: a < prev ? .7 : .45, pan: -.1 }); prev = a; }
  const VOend = TL.VO.map(v => v.t + v.dur);
  EV.push(
    { type: 'static', t: 0, dur: TL.STATIC[0][1] },
    { type: 'bed', fx: 'tape_hiss', t: 0, t1: DUR + .5, g: -39 },
    // S1: the machine running, the lightbox's buzz, the mall beyond the shutter
    { type: 'bed', fx: 'minilab', t: .5, t1: SH.machine[2] - .06, g: -23, fin: .05, fout: .02 },
    { type: 'bed', fx: 'fluor_hum', t: .5, t1: SH.machine[2] - .06, g: -31, fin: .05, fout: .02 },
    { type: 'bed', fx: 'mall_hum', t: .5, t1: SH.prints[2], g: -37, fin: .05, fout: .02 },
    ...TL.DROPS.map(d => ({ type: 'drop', t: d, g: 1 })),
    { type: 'step', t: 1.95, g: .45, pan: -.1 }, { type: 'step', t: 2.6, g: .4, pan: .1 }, { type: 'step', t: 6.4, g: .4, pan: -.1 }, { type: 'step', t: 7.0, g: .35, pan: .1 },
    ...TL.RECCUT.map(c => ({ type: 'camclick', t: c - .06 })),
    // S2: the prints; the machine idles; a shutter behind him
    { type: 'bed', fx: 'minilab', t: SH.prints[1] + .16, t1: SH.prints[2], g: -28, fin: .05, fout: .02 },
    { type: 'bed', fx: 'fluor_hum', t: SH.prints[1] + .16, t1: SH.prints[2], g: -33, fin: .05, fout: .02 },
    ...TL.FLIPS.map((f, i) => ({ type: 'flip', t: f + .05, g: i === 3 ? .8 : 1, pan: -.15 })),
    ...TL.DROPS2.map(d => ({ type: 'drop', t: d, g: .55, pan: -.2 })),
    { type: 'bed', fx: 'breath_bed', t: TL.FLIPS[3] + .6, t1: TL.SHUTTER - .05, g: -29, fin: 1.0, fout: .05 },
    { type: 'shutter', t: TL.SHUTTER, pan: .35 },
    { type: 'breath_in', t: TL.SHUTTER + .12 },
    // S3: CAM 05 (the playback has its own faint sound: the room)
    { type: 'roll', t: TL.ROLL[0] },
    { type: 'bed', fx: 'minilab', t: SH.cctv[1], t1: TL.SIGN_DIE, g: -33, fin: .02, fout: .02 },
    { type: 'bed', fx: 'fluor_hum', t: SH.cctv[1], t1: TL.SIGN_DIE, g: -30, fin: .02, fout: .02 },
    { type: 'bed', fx: 'flicker', t: TL.FLICKER + .4, t1: TL.SIGN_DIE, g: -31, fin: .3, fout: .02 },
    { type: 'lights_off', t: TL.SIGN_DIE },
    { type: 'impact', t: TL.CRASH[0], g: .5 },
    { type: 'switch', t: SH.dark[1] - .04 },
    // S4: dark. His breathing; the charge; the swell; silence; the flash
    { type: 'bed', fx: 'breath_bed', t: SH.dark[1], t1: TL.WHINE[0] + .15, g: -25, fin: .1, fout: .25 },
    { type: 'bed', fx: 'mall_hum', t: SH.dark[1], t1: TL.WHINE[0] + .6, g: -42, fin: .05, fout: .5 },
    { type: 'charge', t: TL.WHINE[0], dur: TL.WHINE[1] - TL.WHINE[0] },
    { type: 'swell', t: TL.WHINE[1] - 1.9, dur: 1.9 },
    { type: 'torch_off', t: TL.TORCH_OFF, g: .7 },
    { type: 'pop', t: TL.POP }, { type: 'sting', t: TL.POP },
    { type: 'handling', t: TL.WHIP[0] }, { type: 'whoosh', t: TL.WHIP[0] }, { type: 'step', t: TL.WHIP[0] + .2, g: .6, pan: .2 },
    { type: 'bed', fx: 'near_breath', t: TL.WHIP[1], t1: TL.MOTOR + 1.5, g: -24, fin: .3, fout: .6 },
    { type: 'bed', fx: 'mall_hum', t: TL.WHIP[1], t1: TL.TURN_BACK[0], g: -41, fin: .4, fout: .4 },
    { type: 'zoom', t: TL.CAM_UP[0] },
    { type: 'bed', fx: 'minilab', t: TL.MOTOR, t1: TL.DROP_LAST + .4, g: -28, fin: .15, fout: .3 },
    { type: 'drop', t: TL.DROP_LAST, g: .9, pan: 0 },
    { type: 'torch_on', t: TL.TORCH_ON, g: .6 },
    { type: 'handling', t: TL.PICKUP[0] + .1, g: .6 },
    { type: 'bed', fx: 'breath_bed', t: TL.PICKUP[1], t1: TL.WHINE2 + .1, g: -30, fin: .3, fout: .1 },
    { type: 'charge', t: TL.WHINE2, dur: TL.END - TL.WHINE2, g: .55 },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    C05 = TK.render(RG, SHOP, CAM05, { ambient: 1, fog: .02 });
    EYES_P = project(C05, [IT.x, 1.97, IT.z]); BEHIND_P = project(C05, [-1.1, 1.45, 4.6]);
    buildPrints();
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
