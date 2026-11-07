// STILL RECORDING, tape 3: "Pay Phone". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const RAW = mk(TK.TW, TK.TH), RG = RAW.getContext('2d'), WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6;
const CAM = { x: .85, y: 2.45, z: -.3, yaw: -.24, pitch: -.28, fov: 58 };

// ---------------------------------------------------------------- the restroom corridor: x -1.2..1.2, z 0..10
const PHONE = { x: -1.2, y: 1.15, z: 3.6 };
function buildScene(t) {
  const S = new TK.Scene(), H = 2.7, L = 10, hw = 1.2;
  const wall = [150, 146, 136], floor = [112, 108, 100];
  for (let z = 0; z < L; z += 1) {
    S.quad([[-hw, 0, z], [hw, 0, z], [hw, 0, z + 1], [-hw, 0, z + 1]], floor, { floor: true });
    S.quad([[-hw, H, z + 1], [hw, H, z + 1], [hw, H, z], [-hw, H, z]], [80, 78, 74]);
    S.quad([[-hw, 0, z + 1], [-hw, 0, z], [-hw, H, z], [-hw, H, z + 1]], wall);
    S.quad([[hw, 0, z], [hw, 0, z + 1], [hw, H, z + 1], [hw, H, z]], wall);
    S.quad([[-hw + .002, 0, z + 1], [-hw + .002, 0, z], [-hw + .002, .12, z], [-hw + .002, .12, z + 1]], [70, 66, 62]);   // skirting
    S.quad([[hw - .002, 0, z], [hw - .002, 0, z + 1], [hw - .002, .12, z + 1], [hw - .002, .12, z]], [70, 66, 62]);
  }
  S.quad([[-hw, 0, L], [hw, 0, L], [hw, H, L], [-hw, H, L]], [96, 92, 86]);
  S.quad([[-.35, 2.1, L - .02], [.35, 2.1, L - .02], [.35, 2.35, L - .02], [-.35, 2.35, L - .02]], [40, 140, 70], { emit: 1, text: 'EXIT', textCol: [190, 255, 200] });
  // restroom doors on the right wall, with signs (right wall reads toward -z)
  for (const [z0, name] of [[2.6, 'MEN'], [6.8, 'WOMEN']]) {
    S.quad([[hw - .01, 0, z0], [hw - .01, 0, z0 + .9], [hw - .01, 2.05, z0 + .9], [hw - .01, 2.05, z0]], [110, 104, 96]);
    S.quad([[hw - .015, 1.0, z0 + .12], [hw - .015, 1.0, z0 + .2], [hw - .015, 1.06, z0 + .2], [hw - .015, 1.06, z0 + .12]], [60, 60, 64]);   // push plate
    S.quad([[hw - .015, 1.55, z0 + .75], [hw - .015, 1.55, z0 + .15], [hw - .015, 1.78, z0 + .15], [hw - .015, 1.78, z0 + .75]], [210, 205, 190], { text: name, textCol: [30, 28, 26] });
  }
  // drinking fountain on the left wall
  S.box(-1.2, .78, 5.4, -.92, .92, 5.9, [170, 172, 176]);
  // the pay phone: a steel box on the left wall, a little hood over it
  const P = PHONE, egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
  S.box(-1.2, P.y - .05, P.z - .2, -1.1, P.y + .55, P.z + .2, [150, 154, 160]);
  S.box(-1.2, P.y + .55, P.z - .28, -.95, P.y + .62, P.z + .28, [120, 124, 130]);
  S.quad([[-1.097, P.y + .38, P.z + .15], [-1.097, P.y + .38, P.z - .02], [-1.097, P.y + .5, P.z - .02], [-1.097, P.y + .5, P.z + .15]], [40, 44, 48]);   // keypad
  S.quad([[-1.096, P.y + .18, P.z + .15], [-1.096, P.y + .18, P.z - .15], [-1.096, P.y + .26, P.z - .15], [-1.096, P.y + .26, P.z + .15]], [225, 220, 205], { text: egg ? '4 CENTS' : '25 CENTS', textCol: [30, 28, 26] });
  // fluorescent panels; the middle one flickers
  const flick = (Math.sin(t * 23) + Math.sin(t * 7.3)) > 1.2 ? .1 : .5;
  for (const [z, e] of [[2.0, .45], [5.2, flick], [8.4, .4]]) S.quad([[-.3, H - .02, z], [.3, H - .02, z], [.3, H - .02, z + 1.1], [-.3, H - .02, z + 1.1]], [150, 150, 140], { emit: e, light: true });
  return S;
}

// ---------------------------------------------------------------- the handset and its cord (drawn in screen space)
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
// where the handset is and how it is turned (a = in-plane angle, face = 0 side view .. 1 earpiece toward the camera)
function handsetAt(t) {
  const P = PHONE, hook = { x: P.x + .12, y: P.y + .3, z: P.z + .02, a: 1.57, face: 0 };
  if (t < TL.LIFT) return hook;
  let h = TL.HOLD[0];
  for (const H of TL.HOLD) if (t >= H[0]) h = H;
  if (h === TL.HOLD[0]) {
    const k = ease((t - TL.LIFT) / 1.4);
    return { x: lerp(hook.x, h[1], k), y: lerp(hook.y, h[2], k), z: lerp(hook.z, h[3], k), a: lerp(1.57, .35, k), face: 0 };
  }
  const face = ease((t - TL.TURN) / .9);
  const held = { x: h[1], y: h[2] + Math.sin(t * 1.3) * .01, z: h[3], a: lerp(.35, .1, face), face };
  if (t < TL.DROP) return held;
  const k = clamp((t - TL.DROP) / .35);                                   // falls to the floor, a small bounce
  const bounce = t > TL.DROP + .35 ? Math.max(0, Math.sin((t - TL.DROP - .35) * 16)) * .06 * Math.exp(-(t - TL.DROP - .35) * 5) : 0;
  return { x: held.x + .05 * k, y: lerp(held.y, .04, k * k) + bounce, z: held.z, a: lerp(held.a, 1.4, k), face: lerp(face, 0, k) };
}
function drawHandset(g, cam, t) {
  const h = handsetAt(t), c0 = project(cam, [h.x, h.y, h.z]);
  if (!c0) return;
  const px = cam.f * .21 / c0[2];                                         // the handset is ~21 cm long
  // the coiled cord: from the box down and out to the handset's mouthpiece end
  const base = project(cam, [PHONE.x + .1, PHONE.y + .02, PHONE.z]);
  const mx = c0[0] + Math.cos(h.a) * px * .5, my = c0[1] + Math.sin(h.a) * px * .5;
  if (base) {
    const sag = h.y < .2 ? 40 : 18;
    g.save(); g.strokeStyle = 'rgb(16,16,18)'; g.lineWidth = Math.max(1.5, px * .05); g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const k = i / 60, x = lerp(base[0], mx, k), y = lerp(base[1], my, k) + Math.sin(k * Math.PI) * sag, coil = Math.sin(k * 90) * Math.max(1.2, px * .04);
      i ? g.lineTo(x + coil, y + coil * .5) : g.moveTo(x, y);
    }
    g.stroke(); g.restore();
  }
  // the handset: earpiece, grip, mouthpiece; turned face-on the earpiece becomes a round disc of holes
  g.save(); g.translate(c0[0], c0[1]); g.rotate(h.a);
  const er = px * (.15 + .07 * h.face);
  const shape = gg => { gg.beginPath(); gg.roundRect(-px * .46, -px * .085, px * .92, px * .17, px * .085); gg.ellipse(-px * .46, 0, er * (.62 + .38 * h.face), er, 0, 0, 6.2832); gg.ellipse(px * .46, 0, px * .14 * .62, px * .14, 0, 0, 6.2832); };
  g.lineWidth = Math.max(2, px * .05); g.strokeStyle = 'rgb(150,152,156)'; shape(g); g.stroke();   // a dull chrome edge so it reads on the wall
  g.fillStyle = 'rgb(14,14,16)'; shape(g); g.fill();
  if (h.face > .3) { g.fillStyle = `rgba(150,150,150,${.6 * h.face})`; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832; g.beginPath(); g.arc(-px * .46 + Math.cos(a) * er * .45, Math.sin(a) * er * .45, Math.max(1, er * .09), 0, 6.2832); g.fill(); } }
  g.restore();
}

// ---------------------------------------------------------------- tape damage and overlays (as tapes 1 and 2)
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
    const cam = TK.render(RG, buildScene(tq), CAM, { ambient: 1.15, fog: .045 });
    drawHandset(RG, cam, tq);
    TK.grade(WG, RAW, tq, 'cctv');
    const gk = glitchAt(t);
    TK.vhs(WG, tq, gk >= 0 ? 2.5 : 1, 7);
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
  ...TL.RINGS.map(t0 => ({ type: 'ring', t: t0 })),
  { type: 'pickup', t: TL.LIFT },
  ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
  { type: 'breath', t: TL.BREATH }, { type: 'breath', t: TL.BREATH + 3.4 }, { type: 'breath', t: TL.HANGUP - .2 },
  { type: 'hangup', t: TL.HANGUP },
  { type: 'bed', fx: 'dial_tone', t: TL.HANGUP + .25, t1: TL.END + .05, g: -26, fin: .02, fout: .04 },
  { type: 'clatter', t: TL.DROP + .35 },
  { type: 'static', t: TL.END, dur: DUR - TL.END },
  { type: 'bed', fx: 'fluor_hum', t: .5, t1: TL.END + .05, g: -31, fout: .04 },
  { type: 'bed', fx: 'tape_hiss', t: 0, t1: DUR + .5, g: -38 },
];

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
