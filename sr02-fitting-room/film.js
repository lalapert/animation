// STILL RECORDING, tape 2: "Fitting Room 3". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const RAW = mk(TK.TW, TK.TH), RG = RAW.getContext('2d'), WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp;
const FPS_CCTV = 6;
const CAM = { x: -1.42, y: 2.5, z: 3.0, yaw: 1.06, pitch: -.36, fov: 64 };

// ---------------------------------------------------------------- the fitting-room corner of Fashion 99
// corridor x -1.5..1.5, z 0..9; four stalls on the right (x 1.5..3.0), stall k spans z0(k)..z0(k)+1.2; curtains hang at x = 1.5
const CX = 1.5, HEM = .36, STALL_W = 1.2, z0 = k => 1.4 + (k - 1) * 1.3;
const S3 = { a: z0(3), b: z0(3) + STALL_W };
function buildScene(t) {
  const S = new TK.Scene(), H = 2.8;
  const floor = [104, 98, 92], wall = [140, 134, 124], part = [120, 114, 106];
  for (let z = 0; z < 9; z += 1) S.quad([[-1.5, 0, z], [CX, 0, z], [CX, 0, z + 1], [-1.5, 0, z + 1]], floor, { floor: true });
  for (let z = 0; z < 9; z += 1) S.quad([[-1.5, H, z + 1], [CX, H, z + 1], [CX, H, z], [-1.5, H, z]], [74, 70, 66]);
  S.quad([[-1.5, 0, 9], [3, 0, 9], [3, H, 9], [-1.5, H, 9]], wall);                                        // end wall
  S.quad([[-.6, .1, 8.98], [.6, .1, 8.98], [.6, 2.1, 8.98], [-.6, 2.1, 8.98]], [150, 156, 162], { tex: 'glass' });   // long mirror
  S.quad([[-1.5, 0, 9], [-1.5, 0, 0], [-1.5, H, 0], [-1.5, H, 9]], wall);                                  // left wall
  // clothing racks along the left wall: a rail and a row of hanging garments
  for (const [za, zb] of [[.6, 3.4], [4.4, 7.6]]) {
    S.box(-1.35, 1.55, za, -1.3, 1.6, zb, [60, 60, 64]);
    for (let z = za + .1, i = 0; z < zb - .1; z += .16, i++) {
      const c = [[70, 58, 62], [52, 60, 76], [96, 92, 84], [44, 44, 48]][i % 4];
      S.quad([[-1.32, .75 + (i % 3) * .08, z], [-1.32, .75 + (i % 3) * .08, z + .13], [-1.32, 1.55, z + .13], [-1.32, 1.55, z]], c);
    }
  }
  // the stalls: partitions, back walls, curtains, numbers
  S.quad([[CX, 2.15, 9], [CX, 2.15, 0], [CX, H, 0], [CX, H, 9]], wall);                                   // wall above the stall openings
  for (let k = 1; k <= 4; k++) {
    const a = z0(k), b = a + STALL_W, lit = k === 3;
    S.quad([[CX, 0, a], [3, 0, a], [3, 0, b], [CX, 0, b]], lit ? [200, 196, 186] : [80, 76, 72], lit ? { emit: .55 } : {});   // stall floor
    S.quad([[3, 0, b], [3, 0, a], [3, 2.15, a], [3, 2.15, b]], lit ? [190, 186, 176] : [96, 92, 86], lit ? { emit: .45 } : {}); // back wall
    S.quad([[3, .3, a + .25], [3, .3, b - .25], [3, 1.9, b - .25], [3, 1.9, a + .25]], lit ? [215, 222, 228] : [110, 116, 122]);   // mirror
    for (const zz of [a - .05, b + .05]) S.quad([[CX, 0, zz], [3, 0, zz], [3, 2.15, zz], [CX, 2.15, zz]], part);
    // curtain: closed on 3; the others pushed to one side, open
    const slide = k === 3 ? clamp((t - TL.SLIDE) / .5) * .07 : 0;
    const ca = k === 3 ? a + slide : b - .22, cb = b;
    const cc = k === 3 ? [96, 64, 72] : [86, 58, 66];
    S.quad([[CX - .01, HEM, cb], [CX - .01, HEM, ca], [CX - .01, 2.1, ca], [CX - .01, 2.1, cb]], cc);
    for (let zf = ca + .09; zf < cb - .04; zf += .15) S.quad([[CX - .015, HEM, zf + .045], [CX - .015, HEM, zf], [CX - .015, 2.1, zf], [CX - .015, 2.1, zf + .045]], cc.map(v => v * .7));
    if (k === 3 && slide > 0) S.quad([[CX - .005, HEM, a + slide], [CX - .005, HEM, a], [CX - .005, 2.1, a], [CX - .005, 2.1, a + slide]], [6, 6, 8]);   // a dark slit
    // number plate (the egg: 3 reads 7 for six frames)
    const egg = k === 3 && t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
    S.quad([[CX - .02, 2.18, a + .7], [CX - .02, 2.18, a + .5], [CX - .02, 2.36, a + .5], [CX - .02, 2.36, a + .7]], [210, 205, 190], { text: egg ? '7' : String(k), textCol: [30, 28, 26] });
  }
  S.quad([[CX - .02, 2.43, 6.0], [CX - .02, 2.43, 2.9], [CX - .02, 2.63, 2.9], [CX - .02, 2.63, 6.0]], [52, 46, 40], { text: 'FITTING ROOMS', textCol: [200, 190, 160] });
  // one dim ceiling light over the corridor
  S.quad([[-.4, H - .02, 4.2], [.4, H - .02, 4.2], [.4, H - .02, 4.8], [-.4, H - .02, 4.8]], [150, 150, 140], { emit: .35, light: true });
  return S;
}

// ---------------------------------------------------------------- the feet
// pair i: [z centre in stall 3, depth past the curtain line, small turn]; heels to the camera until TURN, then toes
const PAIRS = [[4.62, .1, .05], [4.25, .16, -.1], [5.0, .14, .12], [4.44, .3, 0], [4.85, .32, -.08], [4.05, .28, .1]];
function pairsAt(tq) { let n = 1; for (const [t0, k] of TL.STEPS) if (tq >= t0) n = k; return n; }
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2]] : null; }
// a shoe as a footprint on the floor plus its height; facing: +1 toes into the stall (heels to camera), -1 toes toward the camera
function shoe(g, cam, x, z, facing, rot) {
  const L = .27, Wd = .1, hh = .1, pts = [];
  for (let i = 0; i <= 16; i++) {                                   // outline: wider rounded toe, narrow heel
    const a = i / 16 * Math.PI * 2, u = Math.cos(a), v = Math.sin(a);
    const wv = (u > 0 ? 1 : .78) * Wd / 2 * v, lu = L / 2 * u;
    const dx = facing * (lu * Math.cos(rot) - wv * Math.sin(rot)), dz = lu * Math.sin(rot) + wv * Math.cos(rot);
    pts.push([x + dx, z + dz]);
  }
  const top = pts.map(([px, pz]) => project(cam, [px, hh, pz])), bot = pts.map(([px, pz]) => project(cam, [px, 0, pz]));
  if (top.some(p => !p) || bot.some(p => !p)) return;
  g.fillStyle = 'rgb(8,8,10)';
  g.beginPath(); bot.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); top.slice().reverse().forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.fill();
  g.beginPath(); top.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
  // the ankle rises from the heel end
  const hx = x - facing * L * .36, a0 = project(cam, [hx, .08, z - .045]), a1 = project(cam, [hx, .08, z + .045]), b1 = project(cam, [hx, 1.0, z + .045]), b0 = project(cam, [hx, 1.0, z - .045]);
  if (a0 && a1 && b0 && b1) { g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.lineTo(b0[0], b0[1]); g.closePath(); g.fill(); }
}
// the light from stall 3 spilling out under the curtain onto the corridor floor
function spill(g, cam) {
  const P = [[CX, 0, S3.a], [CX, 0, S3.b], [CX - .95, 0, S3.b + .25], [CX - .95, 0, S3.a - .25]].map(p => project(cam, p));
  if (P.some(p => !p)) return;
  const m0 = [(P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2], m1 = [(P[2][0] + P[3][0]) / 2, (P[2][1] + P[3][1]) / 2];
  const gr = g.createLinearGradient(m0[0], m0[1], m1[0], m1[1]); gr.addColorStop(0, 'rgba(235,232,215,.75)'); gr.addColorStop(.35, 'rgba(200,196,180,.3)'); gr.addColorStop(1, 'rgba(200,196,180,0)');
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr;
  g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); g.restore();
}
function drawFeet(g, cam, tq) {
  const n = pairsAt(tq), turned = tq >= TL.TURN;
  // only the gap under curtain 3 shows the inside of the stall
  const gp = [[CX, 0, S3.a], [CX, 0, S3.b], [CX, HEM, S3.b], [CX, HEM, S3.a]].map(p => project(cam, p));
  const order = PAIRS.slice(0, n).map((p, i) => [p, i]).sort((u, v) => v[0][1] - u[0][1]);   // far ones first
  for (const [[z, d, r], i] of order) {
    const facing = turned ? -1 : 1, xc = CX + d + (turned ? -.06 : 0);
    // inside part: clipped to the gap
    g.save(); g.beginPath(); gp.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
    for (const s of [-1, 1]) shoe(g, cam, xc, z + s * .075, facing, r + s * .05);
    g.restore();
    // turned around, the toes of the nearest pairs poke out under the hem, into the light
    if (turned && d < .2) {
      g.save(); const cl = [[CX, 0, S3.a - .4], [CX, 0, S3.b + .4], [CX - 1, 0, S3.b + .4], [CX - 1, 0, S3.a - .4]].map(p => project(cam, p));
      g.beginPath(); cl.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
      for (const s of [-1, 1]) shoe(g, cam, xc, z + s * .075, facing, r + s * .05);
      g.restore();
    }
  }
}

// ---------------------------------------------------------------- tape damage and overlays (as tape 1)
function stamp(t) {
  const [h0, m0, s0] = TL.STAMP0, s = Math.floor(h0 * 3600 + m0 * 60 + s0 + t);
  const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60, p = n => String(n).padStart(2, '0');
  return `12-31-1999  ${p(hh)}:${p(mm)}:${p(ss)}`;
}
function glitchAt(t) { for (const [t0, d] of TL.GLITCH) if (t >= t0 && t < t0 + d) return (t - t0) / d; return -1; }
function tear(g, t, k) {
  const R = TK.rng(Math.floor(t * 60) + 9);
  const band = 30 + R() * 120, y = R() * (TK.TH - band), dx = (R() - .5) * 140 * Math.sin(k * Math.PI);
  g.drawImage(g.canvas, 0, y, TK.TW, band, dx, y, TK.TW, band);
  const y2 = R() * TK.TH; g.drawImage(g.canvas, 0, y2, TK.TW, 40, -dx * .6, y2 + (R() - .5) * 20, TK.TW, 40);
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const tq = Math.floor(t * FPS_CCTV) / FPS_CCTV;
  const inStatic = TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) {
    TK.statics(WG, t, 1);
  } else {
    const cam = TK.render(RG, buildScene(tq), CAM, { ambient: 1.15, fog: .05 });
    spill(RG, cam);
    drawFeet(RG, cam, tq);
    TK.grade(WG, RAW, tq, 'cctv');
    const gk = glitchAt(t);
    TK.vhs(WG, tq, gk >= 0 ? 2.5 : 1, 5);
    if (gk >= 0) { tear(WG, t, gk); TK.statics(WG, t, .45 * Math.sin(gk * Math.PI)); }
    TK.osd(WG, 'cctv', t, { cam: TL.CAM, place: TL.PLACE, stamp: stamp(t) });
    for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) TK.caption(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  }
  const ra = clamp((t - .8) / .6);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: ra });
}
window.render = render;

window.EV = [
  { type: 'static', t: 0.0, dur: .6 },
  { type: 'chime', t: TL.CHIME },
  ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
  ...TL.STEPS.slice(1).map(([t0]) => ({ type: 'shuffle', t: t0 + .05, g: .5 })),
  { type: 'shuffle', t: TL.TURN, g: 1 },
  ...TL.KNOCKS.map(t0 => ({ type: 'knock', t: t0 })),
  { type: 'rings', t: TL.SLIDE },
  { type: 'static', t: TL.END, dur: DUR - TL.END },
  { type: 'bed', fx: 'store_hum', t: .5, t1: TL.TURN, g: -30, fout: .04 },     // the hum cuts out when they turn
  { type: 'bed', fx: 'tape_hiss', t: 0, t1: DUR + .5, g: -38 },
];

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
