// Volt Labs episode kit: the basement lab set, cameras, props and pigeons, shared by every episode.
// Needs toon.js, lab.js and vmkit.js (lip sync, blinks, subtitles, shots, applyCam, composeFrame), plus window.TL and window.CHARS.
// World coordinates match vmkit: 1080 x 1920, the bench top at LCT, characters drawn waist-up behind it.
'use strict';
const LCT = 1290;                                         // lab bench top (world y)
const VERA = { x: 300, s: 190 }, CLEO = { x: 790, s: 190 };
const VERAFACE = LCT - 222 * VERA.s / 100, CLEOFACE = LCT - 200 * CLEO.s / 100;
const LBOARD = { x: 270, y: 470, w: 400, h: 290 };       // chalkboard, upper left
const LWIN = { x: 810, y: 320, w: 330, h: 190 };         // basement window, upper right (street level outside)
const LFRIDGE = { x: 0, y: 950, w: 150, h: LCT - 950 };  // mini fridge, far left behind the bench
const RAY = { bx: 548, by: 905, ang: -1.12, len: 330 };  // the Adoration Ray: pivot, barrel angle (up and to the right), barrel length
const LAB_STATIC = {};

// standard cameras: [centre x, centre y, zoom at shot start, zoom at shot end]
const LABCAM = {
  WIDE: [540, 1000, 1.18, 1.22],
  VERA_MED: [VERA.x + 40, VERAFACE + 150, 1.6, 1.66],
  VERA_CU: [VERA.x + 10, VERAFACE + 80, 2.3, 2.45],
  CLEO_CU: [CLEO.x - 10, CLEOFACE + 80, 2.3, 2.45],
  CLEO_MED: [CLEO.x - 40, CLEOFACE + 150, 1.6, 1.66],
  BOARD: [LBOARD.x, LBOARD.y + 10, 2.45, 2.6],
  WINDOW: [LWIN.x - 20, LWIN.y + 40, 2.6, 2.8],
  RAY_SHOT: [600, 820, 1.5, 1.58],
  BENCH_CU: [560, LCT - 70, 2.6, 2.75],
};

// ---------------------------------------------------------------- static set: wall, pipes, shelves, board frame, window frame
function buildLab() {
  const W0 = 1080, H0 = 1920;
  const b = document.createElement('canvas'); b.width = W0; b.height = H0;
  const g = b.getContext('2d');
  g.fillStyle = '#12302a'; g.fillRect(0, 0, W0, LCT);
  // brick wall
  const R = (() => { let a = 7; return () => { a = a * 16807 % 2147483647; return a / 2147483647; }; })();
  for (let r = 0, y = 0; y < LCT; r++, y += 48) {
    for (let x = (r % 2) * -60; x < W0; x += 120) {
      const v = R();
      g.fillStyle = v < .33 ? '#18402f' : v < .66 ? '#1a4433' : '#163b2c';
      g.fillRect(x + 3, y + 3, 114, 42);
    }
  }
  const vg = g.createRadialGradient(540, 760, 200, 540, 760, 1000); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
  g.fillStyle = vg; g.fillRect(0, 0, W0, LCT);
  // pipes along the ceiling and down the right wall
  const pipe = (x0, y0, x1, y1, w) => { tTube(g, [x0, y0, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1], w, '#58627a', '#3e465a'); };
  pipe(-20, 150, 1100, 150, 26); pipe(1012, 150, 1012, LCT, 22);
  for (const x of [250, 600, 900]) tShape(g, '#6c7790', gg => gg.roundRect(x - 12, 132, 24, 36, 4), 3);
  tShape(g, '#6c7790', gg => gg.roundRect(994, 520, 36, 24, 4), 3);
  // a bare bulb on a wire (the only light), warm glow
  tLine(g, [540, 150, 540, 214], 3);
  g.save(); const bg = g.createRadialGradient(540, 236, 10, 540, 236, 420); bg.addColorStop(0, 'rgba(255,236,170,.32)'); bg.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = bg; g.fillRect(0, 0, W0, LCT); g.restore();
  tShape(g, '#3b3f52', gg => gg.roundRect(530, 208, 20, 14, 3), 2.6);
  g.save(); g.shadowColor = '#fff2bf'; g.shadowBlur = 30; tShape(g, '#fff6d6', gg => gg.ellipse(540, 238, 15, 19, 0, 0, 6.2832), 3); g.restore();
  // shelf of glowing flasks on the right wall
  for (const sy of [700, 860]) {
    tShape(g, '#5b4636', gg => gg.rect(930, sy, 150, 14), 3);
    for (let i = 0; i < 3; i++) {
      const fx = 958 + i * 40, col = ['#b6ff3b', '#ff5fa2', '#7ef0ff'][(i + sy / 160) % 3 | 0];
      g.save(); g.shadowColor = col; g.shadowBlur = 14;
      tShape(g, 'rgba(230,255,240,.25)', gg => { gg.moveTo(fx - 6, sy - 46); gg.lineTo(fx + 6, sy - 46); gg.lineTo(fx + 6, sy - 30); gg.lineTo(fx + 16, sy - 2); gg.lineTo(fx - 16, sy - 2); gg.lineTo(fx - 6, sy - 30); gg.closePath(); }, 3);
      g.restore();
      tShape(g, col, gg => { gg.moveTo(fx - 11, sy - 16); gg.lineTo(fx + 11, sy - 16); gg.lineTo(fx + 15, sy - 4); gg.lineTo(fx - 15, sy - 4); gg.closePath(); }, 2.4);
    }
  }
  // chalkboard: frame and the plan (the rent circles are drawn per episode)
  const B = LBOARD;
  tShape(g, '#7a5532', gg => gg.roundRect(B.x - B.w / 2 - 16, B.y - B.h / 2 - 16, B.w + 32, B.h + 32, 8), 4);
  tShape(g, '#1f3a30', gg => gg.rect(B.x - B.w / 2, B.y - B.h / 2, B.w, B.h), 3);
  g.save(); g.globalAlpha = .12; g.fillStyle = '#fff'; for (let i = 0; i < 9; i++) g.fillRect(B.x - B.w / 2 + 20 + i * 41, B.y - B.h / 2 + 30 + (i % 3) * 70, 60, 3); g.restore();
  const ch = '#eef3ea';
  tText(g, 'THE PLAN', B.x, B.y - 100, 36, ch);
  tText(g, '1. BUILD DEATH RAY', B.x - 160, B.y - 34, 30, ch, null, 'left');
  tText(g, '2. RULE THE WORLD', B.x - 160, B.y + 22, 30, ch, null, 'left');
  tText(g, '3. PAY RENT', B.x - 160, B.y + 80, 30, ch, null, 'left');
  tShape(g, '#c9b28a', gg => gg.rect(B.x - B.w / 2 + 10, B.y + B.h / 2 - 2, B.w - 20, 12), 2.6);
  tShape(g, '#fbf7ff', gg => gg.roundRect(B.x + 110, B.y + B.h / 2 - 10, 34, 10, 4), 2);
  // window frame (the glass pane and the outside are drawn per frame: it opens)
  const Wn = LWIN;
  tShape(g, '#2b2f3e', gg => gg.rect(Wn.x - Wn.w / 2 - 16, Wn.y - Wn.h / 2 - 16, Wn.w + 32, Wn.h + 32), 4);
  tShape(g, '#c8c2b4', gg => gg.rect(Wn.x - Wn.w / 2 - 22, Wn.y + Wn.h / 2 + 10, Wn.w + 44, 18), 3.4);   // sill
  LAB_STATIC.lab = b;
  // bench front (everything below the bench top)
  const f = document.createElement('canvas'); f.width = W0; f.height = H0 - LCT + 40; const h = f.getContext('2d');
  tShape(h, '#4a5266', gg => gg.rect(-10, 0, W0 + 20, 30), 4);
  h.fillStyle = 'rgba(255,255,255,.18)'; h.fillRect(-10, 4, W0 + 20, 5);
  tShape(h, '#262b3a', gg => gg.rect(-10, 32, W0 + 20, H0), 4);
  for (const x of [60, 600]) { tShape(h, '#2f3547', gg => gg.roundRect(x, 70, 420, 170, 8), 3.4); tShape(h, '#8a93ab', gg => gg.roundRect(x + 170, 140, 80, 16, 8), 2.6); }
  h.save(); h.globalAlpha = .9; tShape(h, LAB.glow, gg => gg.roundRect(450, 300, 180, 40, 8), 3); h.restore();
  tText(h, 'VOLT LABS', 540, 321, 24, '#1a1030', '"Bungee"', 'center', 400);
  LAB_STATIC.front = f;
}

// ---------------------------------------------------------------- dynamic set pieces
// the street outside the basement window, and the glass pane (open: 0 shut .. 1 swung up)
function drawWindow(g, t, open = 0) {
  const Wn = LWIN, x0 = Wn.x - Wn.w / 2, y0 = Wn.y - Wn.h / 2;
  g.save(); g.beginPath(); g.rect(x0, y0, Wn.w, Wn.h); g.clip();
  const sky = g.createLinearGradient(0, y0, 0, y0 + Wn.h); sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#d8f1ff'); g.fillStyle = sky; g.fillRect(x0, y0, Wn.w, Wn.h);
  tShape(g, '#fbf7ff', gg => { gg.ellipse(x0 + 90 + ((t * 6) % 60), y0 + 46, 44, 16, 0, 0, 6.2832); }, 0);
  tShape(g, '#7bc96f', gg => gg.rect(x0 - 5, y0 + Wn.h - 64, Wn.w + 10, 30), 3);       // grass verge
  tShape(g, '#b9b3a6', gg => gg.rect(x0 - 5, y0 + Wn.h - 36, Wn.w + 10, 40), 3);       // sidewalk at eye level
  g.restore();
  // the pane: hinged at the top, swings up and in
  const k = clamp(open), ph = Wn.h * (1 - .85 * k);
  g.save(); g.globalAlpha = .92;
  tShape(g, 'rgba(200,235,255,.28)', gg => gg.rect(x0, y0, Wn.w, ph), 3.4);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 + 30, y0 + ph * .2); g.lineTo(x0 + 70, y0 + ph * .2 - 30 * (1 - k)); g.stroke();
  g.restore();
  tLine(g, [Wn.x, y0, Wn.x, y0 + ph], 4);
}
// rent circles around "3. PAY RENT": n complete circles, plus a new one being drawn (k 0..1)
function drawRentCircles(g, n, k = 0) {
  const cx = LBOARD.x - 70, cy = LBOARD.y + 80;
  g.save(); g.strokeStyle = '#ff8fb1'; g.lineCap = 'round';
  for (let i = 0; i < n + (k > 0 ? 1 : 0); i++) {
    const rx = 120 + i * 12, ry = 30 + i * 6, a0 = -2.6 + i * .5, frac = i < n ? 1 : k;
    g.lineWidth = 4.5; g.beginPath(); g.ellipse(cx, cy, rx, ry, -.03 * (i + 1), a0, a0 + frac * 6.6); g.stroke();
  }
  g.restore();
}
// the mini fridge; open 0..1 swings the door out (hinge on the left)
function drawFridge(g, open = 0) {
  const F = LFRIDGE, k = clamp(open);
  tShape(g, '#dfe6ee', gg => gg.roundRect(F.x - 10, F.y, F.w + 10, F.h, 10), 4);
  if (k > 0) {
    tShape(g, '#f7fbff', gg => gg.rect(F.x + 6, F.y + 14, F.w - 18, F.h - 26), 3);
    g.save(); g.shadowColor = '#fffbe0'; g.shadowBlur = 20; g.fillStyle = 'rgba(255,250,215,.5)'; g.fillRect(F.x + 8, F.y + 16, F.w - 22, F.h - 30); g.restore();
    tShape(g, '#c9d1dc', gg => gg.rect(F.x + 6, F.y + 170, F.w - 18, 8), 2.4);
    // a yellow MILK carton (the delivery driver's milk) and a jar of something green
    tShape(g, '#ffd23f', gg => { gg.moveTo(F.x + 30, F.y + 166); gg.lineTo(F.x + 30, F.y + 96); gg.lineTo(F.x + 50, F.y + 78); gg.lineTo(F.x + 70, F.y + 96); gg.lineTo(F.x + 70, F.y + 166); gg.closePath(); }, 3);
    tText(g, 'MILK', F.x + 50, F.y + 130, 15, TOON.ink, '"Bungee"', 'center', 400);
    tShape(g, LAB.glow, gg => gg.roundRect(F.x + 84, F.y + 120, 34, 46, 6), 3);
    tShape(g, '#ff5fa2', gg => gg.roundRect(F.x + 30, F.y + 214, 70, 40, 8), 3);
  }
  // door: foreshortens as it swings toward the camera
  const dw = (F.w - 4) * Math.cos(k * 1.35);
  tShape(g, '#eef3f8', gg => gg.roundRect(F.x - 10, F.y + 4, Math.max(6, dw + 10), F.h - 8, 8), 4);
  if (dw > 40) tShape(g, '#9aa3b8', gg => gg.roundRect(F.x + dw - 22, F.y + 60, 10, 90, 5), 2.6);
  if (k > .4) tShape(g, '#d6dde6', gg => gg.rect(F.x - 10 + dw, F.y + 4, 24 * Math.sin(k * 1.35), F.h - 8), 3);
}
// the Adoration Ray: a big heart-lensed cannon on a tripod. o.charge 0..1 (glow), o.recoil 0..1, o.dial (needle 0..1)
function drawRay(g, t, o = {}) {
  const { bx, by, ang, len } = RAY, ch = o.charge || 0, rc = o.recoil || 0;
  // tripod legs down to the floor behind the bench
  for (const dx of [-120, 0, 120]) tLine(g, [bx, by + 30, bx + dx, LCT + 10], 10);
  tShape(g, '#5f6a82', gg => gg.roundRect(bx - 46, by - 6, 92, 60, 10), 4);
  // dial on the base: ADORATION meter
  tShape(g, '#fbf7ff', gg => gg.arc(bx, by + 26, 22, Math.PI, 0), 3);
  const na = Math.PI + (o.dial ?? .2) * Math.PI;
  tLine(g, [bx, by + 26, bx + Math.cos(na) * 18, by + 26 + Math.sin(na) * 18], 3);
  g.save(); g.translate(bx, by); g.rotate(ang); g.translate(-rc * 26, 0);
  // barrel with copper coils
  tShape(g, '#8d97ad', gg => gg.roundRect(-40, -44, len * .78, 88, 22));
  tShade(g, gg => gg.roundRect(-40, -44, len * .78, 88, 22), '#6c7590', gg => gg.rect(-40, 14, len, 40));
  for (let i = 0; i < 5; i++) tShape(g, '#d9873a', gg => gg.roundRect(10 + i * 34, -50, 16, 100, 6), 3);
  tShape(g, '#5f6a82', gg => gg.roundRect(len * .7, -58, 60, 116, 14), 4);
  // the heart lens at the muzzle
  g.save(); g.translate(len * .78 + 54, 0); g.rotate(Math.PI / 2);
  g.shadowColor = '#ff5fa2'; g.shadowBlur = 20 + 60 * ch;
  heartPath(g, 0, 0, 52); g.fillStyle = `rgb(255,${95 + 80 * ch},${162 + 50 * ch})`; g.fill();
  g.shadowBlur = 0; heartPath(g, 0, 0, 52); g.lineWidth = TOON.LW * 1.1; g.strokeStyle = TOON.ink; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(-16, -16, 10, 6, -.6, 0, 6.2832); g.fill();
  g.restore();
  g.restore();
  // a hand-lettered label taped to the base
  g.save(); g.translate(bx, by - 20); g.rotate(-.06); tShape(g, '#fff6c8', gg => gg.rect(-62, -14, 124, 28), 2.6); tText(g, 'ADORATION RAY', 0, 1, 14, TOON.ink, '"Bungee"', 'center', 400); g.restore();
}
// muzzle position in world space (beam origin)
function rayMuzzle(rc = 0) { const d = RAY.len * .78 + 54 - rc * 26; return [RAY.bx + Math.cos(RAY.ang) * d, RAY.by + Math.sin(RAY.ang) * d]; }
function heartPath(g, x, y, r) {
  g.beginPath(); g.moveTo(x, y + r * .9);
  g.bezierCurveTo(x - r * 1.3, y + r * .1, x - r * .9, y - r * .95, x, y - r * .35);
  g.bezierCurveTo(x + r * .9, y - r * .95, x + r * 1.3, y + r * .1, x, y + r * .9); g.closePath();
}
function drawHeart(g, x, y, r, fill = '#ff5fa2', lw = 2.6) { heartPath(g, x, y, r); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = TOON.ink; g.stroke(); }
// a thick pink beam from the muzzle out of the window, k 0..1 (strength), with floating hearts
function drawBeam(g, t, k) {
  if (k <= 0) return;
  const [mx, my] = rayMuzzle(0), tx = LWIN.x + 60, ty = LWIN.y - 40;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (const [w, a] of [[110, .25], [60, .5], [24, .9]]) { g.strokeStyle = `rgba(255,${120 + (24 / w) * 120},${190},${a * k})`; g.lineWidth = w * (.6 + .4 * k); g.beginPath(); g.moveTo(mx, my); g.lineTo(tx, ty); g.stroke(); }
  g.restore();
  for (let i = 0; i < 6; i++) { const p = ((t * 2.2 + i / 6) % 1); drawHeart(g, lerp(mx, tx, p) + Math.sin(p * 9 + i) * 26, lerp(my, ty, p), 12 * k, '#ffd1e4', 2); }
}

// ---------------------------------------------------------------- pigeons
// o: dir (1 faces right), heart (heart eyes), flap (0..1 wing up), fly (wings out), bob, peck (0..1), hold ('fry' | 'cap'), back (seen from behind)
function drawPigeon(g, x, y, s, o = {}) {
  const d = o.dir || 1, bob = o.bob || 0, pk = o.peck || 0;
  g.save(); g.translate(x, y); g.scale(d * s / 100, s / 100);
  const body = '#a3abc0', bodyS = '#7f879e', neck = '#5fb39a', neck2 = '#8a6fcf';
  if (!o.fly) { tLine(g, [-6, -6, -8, 4], 4); tLine(g, [8, -6, 8, 4], 4); g.strokeStyle = '#ff8a3d'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, 4); g.lineTo(-2, 4); g.moveTo(2, 4); g.lineTo(14, 4); g.stroke(); }
  // tail
  tShape(g, '#5d6478', gg => { gg.moveTo(-26, -28); gg.lineTo(-58, -20); gg.lineTo(-56, -8); gg.lineTo(-22, -16); gg.closePath(); }, 3);
  // body
  const bp = gg => gg.ellipse(0, -28 + bob, 34, 24, -.12, 0, 6.2832);
  tShape(g, body, bp); tShade(g, bp, bodyS, gg => gg.ellipse(-6, -14 + bob, 34, 14, -.1, 0, 6.2832));
  // wing
  if (o.fly) {
    const up = o.flap || 0;
    const tx = -36 - 10 * (1 - up), ty = -112 * up + 6 * (1 - up), mx = (tx - 4) / 2, my = (ty - 36) / 2;
    tShape(g, '#c4cad8', gg => {
      gg.moveTo(-16, -38); gg.quadraticCurveTo(mx - 22, my - 8, tx, ty);                         // leading edge to the tip
      for (let i = 1; i <= 3; i++) { const f = i / 3.4, fx = lerp(tx, 8, f), fy = lerp(ty, -32, f); gg.lineTo(fx + 10, fy + 6); gg.lineTo(fx + 4, fy - 2); }   // feather tips
      gg.lineTo(8, -32); gg.closePath(); }, 3);
  } else tShape(g, '#c4cad8', gg => { gg.moveTo(-18, -40 + bob); gg.quadraticCurveTo(10, -46 + bob, 20, -26 + bob); gg.quadraticCurveTo(-4, -14 + bob, -28, -24 + bob); gg.closePath(); }, 3);
  tLine(g, [-12, -26 + bob, 4, -24 + bob], 2.2); tLine(g, [-16, -20 + bob, 0, -18 + bob], 2.2);
  // neck and head (pecking tilts the head forward and down)
  g.save(); g.translate(20, -44 + bob); g.rotate(pk * .7);
  tShape(g, neck, gg => gg.ellipse(0, 4, 14, 14, 0, 0, 6.2832), 3);
  g.fillStyle = neck2; g.beginPath(); g.ellipse(-2, 10, 10, 6, 0, 0, 6.2832); g.fill();
  if (o.back) { tShape(g, body, gg => gg.arc(2, -12, 15, 0, 6.2832)); g.restore(); g.restore(); return; }
  tShape(g, body, gg => gg.arc(4, -12, 15, 0, 6.2832));
  // beak
  tShape(g, '#f1e6d6', gg => gg.ellipse(14, -16, 5, 3.5, 0, 0, 6.2832), 2.2);
  tShape(g, '#3a3245', gg => { gg.moveTo(16, -14); gg.lineTo(28, -10); gg.lineTo(16, -8); gg.closePath(); }, 2.4);
  if (o.hold === 'fry') { g.save(); g.translate(30, -8); g.rotate(.5); tShape(g, '#ffd23f', gg => gg.roundRect(-3, -2, 30, 7, 2), 2.4); g.restore(); }
  if (o.hold === 'cap') { tShape(g, '#c9cfdb', gg => gg.ellipse(30, -6, 9, 4, 0, 0, 6.2832), 2.4); }
  // eye: orange ring, or a heart
  if (o.heart) drawHeart(g, 6, -15, 7, '#ff5fa2', 2);
  else { tEllipse(g, 6, -15, 5, 5, '#ff8a3d', 2.2); g.fillStyle = TOON.ink; g.beginPath(); g.arc(7, -15, 2.4, 0, 6.2832); g.fill(); }
  g.restore();
  g.restore();
}
// little hearts drifting up from an adoring pigeon
function heartsUp(g, t, x, y, seed, a = 1) {
  if (a <= 0) return;
  for (let i = 0; i < 2; i++) { const p = ((t * .7 + seed * .37 + i * .5) % 1); g.save(); g.globalAlpha = a * (1 - p); drawHeart(g, x + Math.sin(p * 7 + seed) * 10, y - p * 70, 7 + 3 * p, '#ff8fb8', 1.8); g.restore(); }
}
