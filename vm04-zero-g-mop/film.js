// Void Mart, episode 4: "Zero-G Mop". The gravity goes optional. Rae's boots are magnetic. Pip's are on backwards.
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Shared set, cameras and subtitles: channel/brand/vmkit.js
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const DROP = TL.DROP;
const fallK = t => clamp((t - DROP) / .45);                   // gravity is back: everything falls
const fallY = (t, y0, yEnd) => t < DROP ? y0 : lerp(y0, yEnd, Math.pow(fallK(t), 2));

// ---------------------------------------------------------------- floating stock: candy bars, cans, donuts drifting
const ITEMS = Array.from({ length: 14 }, (_, i) => { const r = k => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1; const a = Math.abs;
  return { kind: ['choco', 'can', 'donut'][i % 3], x: 60 + a(r(1)) * 960, y: 260 + a(r(2)) * 760, ph: a(r(3)) * 6.28, sp: .25 + a(r(4)) * .35, rot: a(r(5)) * 6.28 }; });
function stockItem(g, kind, x, y, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  if (kind === 'choco') { tShape(g, '#ffd23f', gg => gg.roundRect(-40, -13, 80, 26, 5), 3); tText(g, 'CHOCO', 0, 1, 13, TOON.ink); }
  else if (kind === 'can') { tShape(g, '#29d3c3', gg => gg.roundRect(-14, -24, 28, 48, 6), 3); tShape(g, '#fbf7ff', gg => gg.rect(-14, -6, 28, 10), 2); }
  else { tShape(g, '#ff9fb8', gg => gg.arc(0, 0, 20, 0, 6.2832), 3); g.fillStyle = '#3a2470'; g.beginPath(); g.arc(0, 0, 7, 0, 6.2832); g.fill(); }
  g.restore();
}
function drawStock(g, t) {
  for (const it of ITEMS) {
    const x = it.x + Math.sin(t * it.sp + it.ph) * 40, y0 = it.y + Math.cos(t * it.sp * .8 + it.ph) * 30;
    const y = fallY(t, y0, CT + 60), rot = it.rot + t * it.sp * .6 * (t < DROP ? 1 : 0);
    if (y < CT + 40) stockItem(g, it.kind, x, y, rot);
    if (t > TL.SPLIT + .6 && t < DROP && it.kind === 'choco') { g.save(); g.translate(x + 30, y - 26); g.rotate(.2); tShape(g, '#e23b4a', gg => gg.rect(-22, -9, 44, 18), 2); tText(g, '50%', 0, 1, 11, '#fff', '"Bungee"', 'center', 400); g.restore(); }
  }
}
// the big blue slush blob, then the little ones it splits into (they drift toward Rae, then fall on her)
function blob(g, x, y, r, t, seed) {
  g.save(); g.translate(x, y);
  g.beginPath();
  for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.2832, rr = r * (1 + .09 * Math.sin(a * 3 + t * 4 + seed) + .05 * Math.sin(a * 5 - t * 3)); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = '#5ab8ff'; g.fill(); g.lineWidth = TOON.LW; g.strokeStyle = TOON.ink; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-r * .35, -r * .35, r * .22, r * .14, -.6, 0, 6.2832); g.fill();
  g.restore();
}
const BIG = { x: 560, y: 760 };
const SMALL = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.2832; return { dx: Math.cos(a), dy: Math.sin(a), onRae: i % 3 !== 0, k: i }; });
// where the little blobs end up on Rae (world coordinates, around her head and vest)
const RAE_SPOTS = [[-40, -250], [10, -268], [44, -236], [-22, -210], [30, -180], [-50, -150], [8, -120], [52, -100]].map(([x, y]) => [RAE.x + x * RAE.s / 100, CT + y * RAE.s / 100]);
function drawSlush(g, t) {
  if (t < TL.SPLIT) { blob(g, BIG.x + Math.sin(t * .7) * 40, BIG.y + Math.cos(t * .5) * 30, 70, t, 1); return; }
  let j = 0;
  for (const b of SMALL) {
    const e = ease((t - TL.SPLIT) / 1.6), drift = (t - TL.SPLIT) * 18;
    let x = BIG.x + b.dx * (60 + 200 * e) + drift * (b.onRae ? 1 : .2), y = BIG.y + b.dy * (40 + 140 * e);
    if (b.onRae) { const [tx, ty] = RAE_SPOTS[j++ % RAE_SPOTS.length]; const w = ease((t - TL.SPLIT - 1.6) / 6); x = lerp(x, tx + Math.sin(t + b.k) * 30, w * .8); y = lerp(y, ty - 140 + Math.cos(t + b.k) * 20, w * .8);
      if (t >= DROP) { const k = fallK(t); x = lerp(x, tx, k); y = lerp(y, ty, k); } }
    else if (t >= DROP) y = fallY(t, y, CT + 80);
    if (t >= DROP + .45 && b.onRae) continue;                      // landed: drawn as splats on Rae instead
    if (y < CT + 40) blob(g, x, y, 20 + (b.k % 3) * 6, t, b.k);
  }
}
function raeSplats(g, t, bob) {
  if (t < DROP + .42) return;
  const k = ease((t - DROP - .42) / .12);
  for (let i = 0; i < RAE_SPOTS.length; i++) {
    const [x, y] = RAE_SPOTS[i], r = (22 + (i % 3) * 7) * k, yy = y + bob;
    g.save(); g.fillStyle = '#5ab8ff'; g.strokeStyle = TOON.ink; g.lineWidth = 3;
    g.beginPath(); g.ellipse(x, yy, r * 1.3, r * .8, (i % 4) * .4, 0, 6.2832); g.fill(); g.stroke();
    const drip = clamp((t - DROP - .5 - i * .08) / 1.2) * 40;     // drips running down
    if (drip > 2) { g.beginPath(); g.roundRect(x - 5, yy, 10, drip, 5); g.fill(); g.stroke(); }
    g.restore();
  }
}
// Rae's coffee, floating out of the mug as a sphere, with a straw
function coffeeSphere(g, t, bob) {
  if (t >= DROP + .2) return;
  const x = RAE.x - 6 * RAE.s / 100 + Math.sin(t * 1.3) * 6, y = CT + bob - 196 * RAE.s / 100 + Math.cos(t * 1.1) * 5;
  g.save(); tShape(g, '#7a4a2a', gg => gg.arc(x + 46, y + 10, 26, 0, 6.2832), 3); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(x + 38, y + 2, 7, 4, -.6, 0, 6.2832); g.fill();
  tLine(g, [x + 4, y + 6, x + 30, y + 8], 4); g.restore();
}

// ---------------------------------------------------------------- Pip: shoots up, comes back down upside down with a mop
function pipUpside(g, t) {
  if (t < TL.DESCEND || t >= DROP + .5) return;
  const k = ease((t - TL.DESCEND) / 1.0), y = t < DROP ? lerp(-600, -110, k) + Math.sin(t * 1.6) * 10 : lerp(-110, 1500, Math.pow(clamp((t - DROP) / .5), 2));
  const x = 380 + Math.sin(t * .9) * 20, swing = (t > TL.SPLIT - .5 && t < TL.SPLIT + .3) ? Math.sin((t - TL.SPLIT + .5) / .8 * Math.PI) * .9 : Math.sin(t * 2) * .15;
  g.save(); g.translate(x, y); g.rotate(Math.PI + Math.sin(t * .7) * .08);
  drawPip2(g, 0, 0, PIP.s, { expr: t > V.L9.t - .2 && t < V.L9.t + 1.6 ? 'worried' : 'grin', hold: true, mouth: mouthFor('PIP', t), blink: blinkAt(0, t) });
  // the mop, in front of her: held in both hands at her chest; its head swings
  g.save(); g.translate(0, -104); g.rotate(1.15 + swing);                     // the stick sticks out past her head, to the side
  tShape(g, '#c9a24a', gg => gg.roundRect(-5, -190, 10, 200, 5), 3);
  tShape(g, '#e9e6f4', gg => { gg.moveTo(-34, -176); gg.lineTo(34, -176); gg.lineTo(28, -220); gg.lineTo(-28, -220); gg.closePath(); }, 3);
  for (let i = -3; i <= 3; i++) tLine(g, [i * 9, -216, i * 10, -236 - (i % 2) * 6], 3);
  g.restore();
  g.restore();
}
function pipState(t, n) {
  const launched = t >= TL.LAUNCH, rise = launched ? Math.pow(clamp((t - TL.LAUNCH) / .3), 2) * 1600 : 0;
  let expr = 'grin';
  if (t > V.L4.t - .1 && t < TL.LAUNCH) expr = 'gasp';
  if (t >= DROP + 1.2) expr = 'sheepish';
  const back = t >= DROP + 1.2;                                   // after the drop she pops back up behind the counter
  return { show: !launched || back, dy: back ? 0 : -rise, o: { expr, mouth: mouthFor('PIP', t), blink: blinkAt(0, t), wave: !back && t < TL.LAUNCH, wavePhase: t * 9, hold: false } };
}
function raeState(t, n) {
  return { expr: 'deadpan', look: 1.5, mug: 0, mouth: mouthFor('RAE', t), blink: blinkAt(1, t), scanner: true };
}

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, VMCAM, {
  WIDE_FLOAT: [540, 900, 1.12, 1.24],
  WIDE_TOP: [470, 640, 1.42, 1.5],
  WIDE_DROP: [560, 980, 1.2, 1.24],
  WIDE_END: [545, 1010, 1.24, 1.3],
});

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  const shake = t > DROP + .4 && t < DROP + .8 ? Math.sin(t * 90) * 10 * (1 - (t - DROP - .4) / .4) : 0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, shake);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 0, TL.FLIP);
  drawMags(c, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) });
  const bobR = Math.sin(t * 1.7 + 1) * 1.5;
  drawRae2(c, RAE.x, CT + bobR, RAE.s, raeState(t, n));
  const P = pipState(t, n);
  if (P.show) drawPip2(c, PIP.x, CT + Math.sin(t * 2.1) * 2 + P.dy, PIP.s, P.o);
  else if (t < TL.LAUNCH + .3) drawPip2(c, PIP.x, CT + P.dy, PIP.s, P.o);
  coffeeSphere(c, t, bobR);
  raeSplats(c, t, bobR);
  drawStock(c, t);
  drawSlush(c, t);
  pipUpside(c, t);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, true);
  // Pip shooting up: speed lines
  if (t > TL.LAUNCH && t < TL.LAUNCH + .35) { c.save(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 6; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(PIP.x + i * 40, 300); c.lineTo(PIP.x + i * 40, 900); c.stroke(); } c.restore(); }
  glassStreaks(c, .9);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

window.EV = [
  { type: 'float', t: 0.0 },
  ...vmShotsFrom('MAGS_CU').map(t => ({ type: 'blip', t: t + .02 })),
  { type: 'blip', t: V.L1.t - .05 },
  { type: 'sip', t: V.L3.t + V.L3.dur + .1, pan: .3 },
  { type: 'launch', t: TL.LAUNCH },
  { type: 'descend', t: TL.DESCEND },
  { type: 'swish', t: TL.SPLIT - .2 },
  { type: 'splat', t: TL.SPLIT },
  { type: 'gravity', t: DROP },
  { type: 'splat', t: DROP + .42, pan: .3 },
  { type: 'crash', t: DROP + .55, pan: -.4 },
  { type: 'drip', t: DROP + .9, pan: .3 },
  { type: 'flip', t: TL.FLIP },
  { type: 'bed', fx: 'store_hum', t: 0, t1: DUR + .5, g: -30 },
  { type: 'bed', fx: 'zero_g', t: 0, t1: DROP, g: -31, fout: .05 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
