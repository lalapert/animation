// STILL RECORDING, tape 1: "Closing Announcement". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const RAW = mk(TK.TW, TK.TH), RG = RAW.getContext('2d'), WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp;
// closed for the night: only every other ceiling panel stays on (night lighting), every 8 m
const NIGHT = z => (z - 3) % 8 === 0;
const SCENE = TK.concourse({ length: 40, lightsOn: z => NIGHT(z) ? .5 : 0 });
const POOLS = []; for (let z = 3; z < 38; z += 4) if (NIGHT(z)) POOLS.push(z + .3);
// the glass doors at the far end, faintly lit from the parking lot: whatever stands in front of them shows as a silhouette
SCENE.quad([[-3, 0, 39.85], [3, 0, 39.85], [3, 3, 39.85], [-3, 3, 39.85]], [150, 160, 170], { emit: 1 });
SCENE.quad([[-.05, 0, 39.8], [.05, 0, 39.8], [.05, 3, 39.8], [-.05, 3, 39.8]], [20, 20, 22]);
const CAM = { x: 3.4, y: 4.2, z: .4, yaw: -.075, pitch: -.21, fov: 80 };
const FPS_CCTV = 6;

function figureAt(t) { let j = TL.JUMPS[0]; for (const J of TL.JUMPS) if (t >= J[0]) j = J; return { z: j[1], x: j[2] }; }
// a black standing figure, feet on the floor at (x, z). No face, no features: a person-shaped hole in the picture.
// Slightly wrong proportions: a little too tall, arms too long, legs together, head tipped to one side.
function drawFigure(g, cam, x, z) {
  const P = (X, Y, Z) => { const q = cam.toCam([X, Y, Z]); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; };
  const feet = P(x, 0, z), head = P(x, 1.9, z);
  if (!feet || !head) return;
  const h = feet[1] - head[1], w = h * .22, cx = feet[0], top = head[1];
  const fog = Math.exp(-feet[2] * .02);
  g.save();
  g.fillStyle = `rgba(2,2,3,${.8 + .2 * fog})`;
  g.beginPath();
  g.ellipse(cx + w * .07, top + h * .055, w * .2, h * .055, .22, 0, 6.2832);          // head, tipped
  g.moveTo(cx - w * .06, top + h * .1); g.lineTo(cx + w * .08, top + h * .1); g.lineTo(cx + w * .1, top + h * .14);   // neck
  g.quadraticCurveTo(cx + w * .42, top + h * .15, cx + w * .44, top + h * .2);           // right shoulder
  g.lineTo(cx + w * .47, top + h * .66); g.lineTo(cx + w * .4, top + h * .68);           // right arm, down past the hip
  g.lineTo(cx + w * .3, top + h * .3); g.lineTo(cx + w * .22, top + h);                  // body and legs, together
  g.lineTo(cx - w * .2, top + h); g.lineTo(cx - w * .28, top + h * .3);
  g.lineTo(cx - w * .38, top + h * .68); g.lineTo(cx - w * .45, top + h * .66);          // left arm
  g.lineTo(cx - w * .42, top + h * .2); g.quadraticCurveTo(cx - w * .4, top + h * .15, cx - w * .08, top + h * .14);
  g.closePath(); g.fill();
  g.restore();
}
// the last jump: it stands right under the camera. All the lens sees is black, too close to focus,
// and in the last moments the black rises (in CCTV steps) until it covers the picture.
function lensShape(g, tq) {
  const W = TK.TW, H = TK.TH, k = clamp((tq - (TL.END - .7)) / .7), e = k * k;
  const tilt = -.04 - .22 * clamp((tq - TL.JUMPS[TL.JUMPS.length - 1][0]) / 1.4);       // it tips its head, one CCTV frame at a time
  g.save();
  g.filter = `blur(${6 + 12 * e}px)`;
  g.fillStyle = 'rgb(1,1,2)';
  g.translate(W * .55, H * (.95 - .55 * e)); g.scale(1 + 2.6 * e, 1 + 2.6 * e); g.rotate(tilt);
  g.beginPath(); g.ellipse(0, 10, 200, 240, 0, 0, 6.2832); g.fill();                      // the top of the head
  g.beginPath(); g.ellipse(-20, 235, 660, 230, 0, 0, 6.2832); g.fill();                   // shoulders on both sides
  g.restore();
}
// soft pools of light on the floor under the night lights (screen space, added on top of the scene)
function pools(g, cam) {
  const P = (X, Y, Z) => { const q = cam.toCam([X, Y, Z]); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; };
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const z of POOLS) {
    const c = P(0, 0, z), l = P(-3, 0, z), r = P(3, 0, z), n = P(0, 0, z - 3), f = P(0, 0, z + 3);
    if (!c || !l || !r || !n || !f) continue;
    const rx = (r[0] - l[0]) / 2, ry = Math.max(2, (n[1] - f[1]) / 2), a = .9 * Math.exp(-c[2] * .008);
    g.save(); g.translate(c[0], c[1]); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(150,146,130,${a})`); gr.addColorStop(.5, `rgba(90,88,78,${a * .55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 6.2832); g.fill(); g.restore();
  }
  g.restore();
}
function stamp(t) {
  const [h0, m0, s0] = TL.STAMP0, s = Math.floor(h0 * 3600 + m0 * 60 + s0 + t);
  const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60, p = n => String(n).padStart(2, '0');
  return `12-31-1999  ${p(hh)}:${p(mm)}:${p(ss)}`;
}
function glitchAt(t) { for (const [t0, d] of TL.GLITCH) if (t >= t0 && t < t0 + d) return (t - t0) / d; return -1; }
function tear(g, t, k) {         // horizontal tearing: shift bands of rows
  const R = TK.rng(Math.floor(t * 60) + 9);
  const band = 30 + R() * 120, y = R() * (TK.TH - band), dx = (R() - .5) * 140 * Math.sin(k * Math.PI);
  g.drawImage(g.canvas, 0, y, TK.TW, band, dx, y, TK.TW, band);
  const y2 = R() * TK.TH; g.drawImage(g.canvas, 0, y2, TK.TW, 40, -dx * .6, y2 + (R() - .5) * 20, TK.TW, 40);
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const tq = Math.floor(t * FPS_CCTV) / FPS_CCTV;               // CCTV records a few frames a second
  const inStatic = TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) {
    TK.statics(WG, t, 1);
  } else {
    const cam = TK.render(RG, SCENE, CAM, { ambient: 1.25, fog: .035 });
    pools(RG, cam);
    const F = figureAt(tq);
    if (F.z < 0) { } else if (F.z < 3.5) lensShape(RG, tq); else drawFigure(RG, cam, F.x, F.z);   // z < 0: it is gone
    TK.grade(WG, RAW, tq, 'cctv');
    const gk = glitchAt(t);
    TK.vhs(WG, tq, gk >= 0 ? 2.5 : 1, 3);
    if (gk >= 0) { tear(WG, t, gk); TK.statics(WG, t, .45 * Math.sin(gk * Math.PI)); }
    const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
    TK.osd(WG, 'cctv', t, { cam: egg ? 'CAM 13' : TL.CAM, place: TL.PLACE, stamp: stamp(t) });
    for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) TK.caption(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  }
  const ra = clamp((t - .8) / .6);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: ra });
}
window.render = render;

window.EV = [
  { type: 'static', t: 0.0, dur: .7 },
  { type: 'chime', t: TL.CHIME },
  ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
  { type: 'breath', t: TL.JUMPS[TL.JUMPS.length - 1][0] + .45 },                        // right under the lens, in the silence
  { type: 'static', t: TL.END, dur: DUR - TL.END },
  { type: 'bed', fx: 'mall_hum', t: .5, t1: TL.JUMPS[TL.JUMPS.length - 1][0], g: -30, fout: .04 },   // the hum cuts out when it reaches the camera
  { type: 'bed', fx: 'tape_hiss', t: 0, t1: DUR + .5, g: -38 },
];

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
