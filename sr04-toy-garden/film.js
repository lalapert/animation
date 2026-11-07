// STILL RECORDING, tape 4: "Toy Garden". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const RAW = mk(TK.TW, TK.TH), RG = RAW.getContext('2d'), WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6;
// the toy store is the second store on the right wall (x = 6, z 10..17.6); the camera hangs across the concourse
const NIGHT = z => z >= 7 && z <= 16;
const SCENE = TK.concourse({ length: 40, lightsOn: z => NIGHT(z) ? .5 : 0 });
const POOLS = []; for (let z = 3; z < 38; z += 4) if (NIGHT(z)) POOLS.push(z + .3);
const CAM = { x: -5.3, y: 3.0, z: 11.2, yaw: 1.32, pitch: -.2, fov: 60 };
const SHX = 5.99, SHZ0 = 10.0, SHZ1 = 17.6;                 // the toy store shutter plane and span
const START = { x: 5.75, z: 13.6 }, STOP = { x: 1.0, z: 12.7 };   // where it comes out, where it stops under the camera

function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
function pools(g, cam) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const z of POOLS) {
    const c = project(cam, [0, 0, z]), l = project(cam, [-3, 0, z]), r = project(cam, [3, 0, z]), n = project(cam, [0, 0, z - 3]), f = project(cam, [0, 0, z + 3]);
    if (!c || !l || !r || !n || !f) continue;
    const rx = Math.hypot(r[0] - l[0], r[1] - l[1]) / 2, ry = Math.max(2, Math.hypot(n[0] - f[0], n[1] - f[1]) / 2), a = .7;
    g.save(); g.translate(c[0], c[1]); g.rotate(Math.atan2(r[1] - l[1], r[0] - l[0])); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(150,146,130,${a})`); gr.addColorStop(.5, `rgba(90,88,78,${a * .5})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 6.2832); g.fill(); g.restore();
  }
  g.restore();
}
// the gap under the shutter (dark); at the end the shutter is a foot higher and the gap is full of little feet
function gapHeight(tq) { return tq >= TL.SHUTTER ? .42 : .2; }
function gapPoly(cam, h) { return [[SHX - .01, 0, SHZ0 + .3], [SHX - .01, 0, SHZ1 - .3], [SHX - .01, h, SHZ1 - .3], [SHX - .01, h, SHZ0 + .3]].map(p => project(cam, p)); }
function drawGap(g, cam, tq) {
  const P = gapPoly(cam, gapHeight(tq));
  if (P.some(p => !p)) return;
  g.save(); g.fillStyle = 'rgb(8,8,10)'; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
  if (tq >= TL.SHUTTER) {                                      // rows of small feet: robot blocks, doll shoes, paws, all facing out
    g.clip(); const R = TK.rng(41);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 26; i++) {
      const z = SHZ0 + .45 + i * .26 + (row % 2) * .12, x = SHX + .08 + row * .22, kind = Math.floor(R() * 3);
      const a = project(cam, [x, 0, z]); if (!a) continue;
      const s = cam.f / a[2] * .05, sh = row === 0 ? 'rgb(150,150,148)' : row === 1 ? 'rgb(110,110,108)' : 'rgb(80,80,78)';
      g.fillStyle = sh;
      if (kind === 0) { g.fillRect(a[0] - s * 1.6, a[1] - s * 1.3, s * 1.3, s * 1.3); g.fillRect(a[0] + s * .3, a[1] - s * 1.3, s * 1.3, s * 1.3); }
      else if (kind === 1) { g.beginPath(); g.ellipse(a[0] - s, a[1] - s * .4, s * .9, s * .5, 0, 0, 6.2832); g.ellipse(a[0] + s, a[1] - s * .4, s * .9, s * .5, 0, 0, 6.2832); g.fill(); }
      else { g.beginPath(); g.arc(a[0] - s, a[1] - s * .7, s * .9, 0, 6.2832); g.arc(a[0] + s, a[1] - s * .7, s * .9, 0, 6.2832); g.fill(); }
    }
  }
  g.restore();
}

// ---------------------------------------------------------------- the robot
function walkK(t) {                                            // progress along the path, 0..1, with the pauses taken out
  const [a, b] = TL.WALK; let paused = 0, total = 0;
  for (const [p0, p1] of TL.PAUSES) { total += p1 - p0; paused += clamp(t - p0, 0, p1 - p0); }
  return clamp((clamp(t, a, b) - a - paused) / (b - a - total));
}
function robotAt(t) {
  if (t < TL.EMERGE) return null;
  if (t < TL.WALK[0]) { const k = ease((t - TL.EMERGE) / 1.0); return { x: lerp(SHX + .3, START.x, k), z: START.z, crawl: 1 - k, walking: true }; }
  const k = walkK(t), x = lerp(START.x, STOP.x, k), z = lerp(START.z, STOP.z, k);
  const paused = TL.PAUSES.some(([p0, p1]) => t >= p0 && t < p1) || t >= TL.WALK[1];
  return { x, z, crawl: 0, walking: !paused };
}
function drawRobot(g, cam, t) {
  const r = robotAt(t); if (!r) return;
  const base = project(cam, [r.x, 0, r.z]); if (!base) return;
  const s = cam.f / base[2] * .6 / 100;                        // a big 60 cm tin robot; drawing units: 100 = full height
  const step = r.walking ? Math.sin(t * 9) : 0, lookUp = ease((t - TL.LOOKUP) / .6), look = TL.PAUSES.some(([p0, p1]) => t >= p0 + .2 && t < p1 - .3) || t >= TL.WALK[1] ? 1 : 0;
  g.save(); g.translate(base[0], base[1]); g.scale(s, s); g.rotate(step * .06);
  if (r.crawl > 0) { g.translate(0, 0); g.rotate(-1.1 * r.crawl); }
  const tin = 'rgb(176,178,182)', tinS = 'rgb(120,122,128)', dark = 'rgb(20,20,24)';
  // legs and feet (blocky)
  for (const sx of [-1, 1]) { g.fillStyle = tinS; g.fillRect(sx * 12 - 7, -22 + (sx * step > 0 ? -4 : 0), 14, 22); g.fillStyle = dark; g.fillRect(sx * 12 - 10, -6 + (sx * step > 0 ? -4 : 0), 20, 6); }
  // body, chest dial (the egg: it reads 9 for six frames)
  g.fillStyle = tin; g.fillRect(-26, -62, 52, 42); g.fillStyle = tinS; g.fillRect(14, -62, 12, 42);
  g.fillStyle = dark; g.beginPath(); g.arc(-4, -42, 9, 0, 6.2832); g.fill();
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
  g.fillStyle = 'rgb(220,220,215)'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(egg ? '9' : '', -4, -41);
  if (!egg) { g.strokeStyle = 'rgb(220,220,215)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-4, -42); g.lineTo(-4 + Math.cos(t * 2) * 6, -42 + Math.sin(t * 2) * 6); g.stroke(); }
  for (let i = 0; i < 4; i++) { g.fillStyle = dark; g.fillRect(-20 + i * 6, -28, 3, 3); }
  // arms swinging
  for (const sx of [-1, 1]) { g.save(); g.translate(sx * 30, -58); g.rotate(sx * .1 + (r.walking ? Math.sin(t * 9 + (sx > 0 ? 3.14 : 0)) * .45 : 0)); g.fillStyle = tinS; g.fillRect(-5, 0, 10, 28); g.fillStyle = dark; g.fillRect(-7, 26, 14, 8); g.restore(); }
  // the wind-up key on its back, turning (until it stops)
  const kt = t < TL.KEYSTOP ? t * 7 : TL.KEYSTOP * 7, kw = Math.abs(Math.cos(kt)) * 18 + 3;
  g.fillStyle = 'rgb(140,140,140)'; g.fillRect(24, -50, 10, 6); g.fillRect(34, -58, 6, 22); g.fillRect(34 + 3 - kw / 2, -62, kw, 7); g.fillRect(34 + 3 - kw / 2, -36, kw, 7);
  // head: tilts back to look up at the camera; antenna; two round eyes that light up
  g.save(); g.translate(0, -62); g.rotate(-.05); g.scale(1, 1 - .35 * lookUp);
  g.fillStyle = tin; g.fillRect(-22, -36, 44, 36); g.fillStyle = tinS; g.fillRect(12, -36, 10, 36);
  g.fillStyle = dark; g.fillRect(-1.5, -52, 3, 16); g.beginPath(); g.arc(0, -54, 4, 0, 6.2832); g.fill();
  const lit = clamp((t - TL.EYES) / .3), lx = look * 0;
  for (const sx of [-1, 1]) {
    g.fillStyle = lit > 0 ? `rgb(${30 + 225 * lit},${30 + 225 * lit},${30 + 210 * lit})` : dark;
    if (lit > 0) { g.shadowColor = 'rgba(255,255,240,.9)'; g.shadowBlur = 14 * lit; }
    g.beginPath(); g.arc(sx * 10 + lx, -20, 5.5, 0, 6.2832); g.fill(); g.shadowBlur = 0;
  }
  g.fillStyle = dark; g.fillRect(-10, -9, 20, 3);                // mouth grille
  g.restore();
  g.restore();
}

// ---------------------------------------------------------------- tape damage and overlays (as the other tapes)
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
    const cam = TK.render(RG, SCENE, CAM, { ambient: 1.2, fog: .035 });
    pools(RG, cam);
    drawGap(RG, cam, tq);
    drawRobot(RG, cam, tq);
    TK.grade(WG, RAW, tq, 'cctv');
    const gk = glitchAt(t);
    TK.vhs(WG, tq, gk >= 0 ? 2.5 : 1, 11);
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
  { type: 'scrape', t: TL.EMERGE },
  { type: 'bed', fx: 'tick_walk', t: TL.WALK[0], t1: TL.PAUSES[0][0], g: -24, fin: .05, fout: .05 },
  { type: 'bed', fx: 'tick_walk', t: TL.PAUSES[0][1], t1: TL.PAUSES[1][0], g: -24, fin: .05, fout: .05 },
  { type: 'bed', fx: 'tick_walk', t: TL.PAUSES[1][1], t1: TL.WALK[1], g: -24, fin: .05, fout: .05 },
  { type: 'whir', t: TL.KEYSTOP },
  { type: 'clank', t: TL.WALK[1] },
  { type: 'eyes', t: TL.EYES },
  { type: 'glitch', t: TL.GLITCH[0][0], dur: TL.GLITCH[0][1] },
  { type: 'shutter', t: TL.SHUTTER - .1 },
  { type: 'breath', t: TL.SHUTTER + .4 },
  { type: 'static', t: TL.END, dur: DUR - TL.END },
  { type: 'bed', fx: 'mall_hum', t: .5, t1: TL.END + .05, g: -31, fout: .04 },
  { type: 'bed', fx: 'tape_hiss', t: 0, t1: DUR + .5, g: -38 },
];

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
