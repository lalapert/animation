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
// style A (styleA.js) for the lab: the bare bulb is the key light; the window and the flask shelf add small pools
const LAB_A = {
  key: { x: 540, y: 236 },
  lights: [
    { x: 540, y: 300, r: 980, col: '#ffe6b0', a: .55 },   // the bare bulb
    { x: 975, y: 415, r: 420, col: '#dfe9ff', a: .3 },    // basement window
    { x: 1000, y: 780, r: 300, col: '#c8ff7a', a: .3 },   // glowing flasks on the shelf
    { x: 540, y: 1250, r: 700, col: '#ffd9a0', a: .22 },  // bounce off the bench
    { x: 540, y: 930, r: 900, col: '#fff1dc', a: .26 },   // key on the two of them (keeps faces and the white coats bright)
  ],
  ambient: '#ada5cc', rim: '#ffe7b8', shadow: '#33406e',
};

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
  const { bx, by, ang, len } = RAY, ch = o.charge || 0, rc = o.recoil || 0, lens = o.lens || 'heart', label = o.label || 'ADORATION RAY';
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
  // the lens at the muzzle: a heart (Adoration Ray) or a crown (Obedience Ray)
  g.save(); g.translate(len * .78 + 54, 0); g.rotate(Math.PI / 2);
  const lp = lens === 'crown' ? (gg => { gg.beginPath(); gg.moveTo(-46, 34); gg.lineTo(-52, -30); gg.lineTo(-22, 0); gg.lineTo(0, -44); gg.lineTo(22, 0); gg.lineTo(52, -30); gg.lineTo(46, 34); gg.closePath(); }) : (gg => heartPath(gg, 0, 0, 52));
  const lc = lens === 'crown' ? [164 + 60 * ch, 107 + 80 * ch, 255] : [255, 95 + 80 * ch, 162 + 50 * ch];
  g.shadowColor = lens === 'crown' ? '#a46bff' : '#ff5fa2'; g.shadowBlur = 20 + 60 * ch;
  lp(g); g.fillStyle = `rgb(${lc[0] | 0},${lc[1] | 0},${lc[2] | 0})`; g.fill();
  g.shadowBlur = 0; lp(g); g.lineWidth = TOON.LW * 1.1; g.strokeStyle = TOON.ink; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(-16, -16, 10, 6, -.6, 0, 6.2832); g.fill();
  g.restore();
  g.restore();
  // a hand-lettered label taped to the base
  g.save(); g.translate(bx, by - 20); g.rotate(-.06); tShape(g, '#fff6c8', gg => gg.rect(-62, -14, 124, 28), 2.6); tText(g, label, 0, 1, 14, TOON.ink, '"Bungee"', 'center', 400); g.restore();
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
function drawBeam(g, t, k, kind = 'heart') {
  if (k <= 0) return;
  const [mx, my] = rayMuzzle(0), tx = LWIN.x + 60, ty = LWIN.y - 40, crown = kind === 'crown';
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (const [w, a] of [[110, .25], [60, .5], [24, .9]]) { g.strokeStyle = crown ? `rgba(${170 + (24 / w) * 60},${120 + (24 / w) * 100},255,${a * k})` : `rgba(255,${120 + (24 / w) * 120},${190},${a * k})`; g.lineWidth = w * (.6 + .4 * k); g.beginPath(); g.moveTo(mx, my); g.lineTo(tx, ty); g.stroke(); }
  g.restore();
  for (let i = 0; i < 6; i++) { const p = ((t * 2.2 + i / 6) % 1), x = lerp(mx, tx, p) + Math.sin(p * 9 + i) * 26, y = lerp(my, ty, p);
    if (crown) drawStar(g, x, y, 11 * k, '#e6d6ff', 2); else drawHeart(g, x, y, 12 * k, '#ffd1e4', 2); }
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

// ---------------------------------------------------------------- cats (Volt Labs 4 "Laser Pointer"; reused later)
// drawCat(g, x, y, s, o): origin at the feet on the ground, faces right (o.dir -1 faces left). s = size (100 = about a pigeon and a half).
// o.fur: key of CAT_FUR. o.pose: 'sit' | 'crouch' | 'run' | 'loaf'. o.pupil 0..1 (1 = hunting, round and huge), o.wiggle (crouch: rear sway),
// o.phase (run: leg cycle), o.rot (run: body tilt, for leaps), o.tail (tail swish phase), o.eyes 'open' | 'closed', o.look -1..1 (eyes up/down)
const CAT_FUR = {
  ginger: { a: '#f4a35b', s: '#d77f37', c: '#fff1df', stripe: '#c96a28' },
  black: { a: '#3d374b', s: '#2a2535', c: '#5d5670' },
  tux: { a: '#34303f', s: '#24212d', c: '#fbf7ff' },
  grey: { a: '#a9afc0', s: '#868da2', c: '#e6e9f1', stripe: '#8a90a4' },
  calico: { a: '#fbf7ff', s: '#ddd6ea', c: '#fbf7ff', patch: ['#f4a35b', '#3d374b'] },
  white: { a: '#fbf7ff', s: '#d9d3e6', c: '#ffffff' },
};
function catEyes(g, ex, ey, r, o, sep) {
  const p = o.pupil || 0, look = o.look || 0;
  for (const dx of [0, sep]) {
    if (o.eyes === 'closed') { tCurve(g, ex + dx - r, ey, ex + dx, ey + r * .8, ex + dx + r, ey, 3); continue; }
    tEllipse(g, ex + dx, ey, r, r * 1.08, '#cfe86a', 2.6);
    g.fillStyle = TOON.ink; g.beginPath(); g.ellipse(ex + dx + r * .1, ey + look * r * .25, r * (.22 + .6 * p), r * (.8 + .1 * p), 0, 0, 6.2832); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + dx - r * .3, ey - r * .4, r * (.18 + .1 * p), 0, 6.2832); g.fill();
  }
}
function catHead(g, hx, hy, r, F, o) {
  // ears
  for (const [ex, rot] of [[-r * .55, -.25], [r * .6, .3]]) {
    g.save(); g.translate(hx + ex, hy - r * .55); g.rotate(rot);
    tShape(g, F.a, gg => { gg.moveTo(-r * .38, r * .2); gg.lineTo(0, -r * .62); gg.lineTo(r * .38, r * .2); gg.closePath(); }, 3);
    g.fillStyle = '#f7a8bf'; g.beginPath(); g.moveTo(-r * .2, r * .1); g.lineTo(0, -r * .38); g.lineTo(r * .2, r * .1); g.closePath(); g.fill();
    g.restore();
  }
  const hp = gg => gg.ellipse(hx, hy, r * 1.12, r * .95, 0, 0, 6.2832);
  tShape(g, F.a, hp, 3.2);
  if (F.patch) { tShade(g, hp, F.patch[0], gg => gg.ellipse(hx - r * .7, hy - r * .5, r * .7, r * .6, .3, 0, 6.2832)); tShade(g, hp, F.patch[1], gg => gg.ellipse(hx + r * .8, hy - r * .6, r * .5, r * .45, 0, 0, 6.2832)); }
  if (F.stripe) { g.save(); hp(g); g.clip(); g.strokeStyle = F.stripe; g.lineWidth = r * .12; g.lineCap = 'round'; for (const dx of [-.3, 0, .3]) { g.beginPath(); g.moveTo(hx + dx * r, hy - r); g.lineTo(hx + dx * r * .8, hy - r * .55); g.stroke(); } g.restore(); }
  tShade(g, hp, F.c, gg => gg.ellipse(hx + r * .15, hy + r * .5, r * .75, r * .42, 0, 0, 6.2832));
  catEyes(g, hx - r * .42, hy - r * .08, r * .28, o, r * .78);
  // nose, mouth, whiskers
  g.fillStyle = '#f07f9c'; g.beginPath(); g.moveTo(hx - r * .1 + r * .08, hy + r * .22); g.lineTo(hx + r * .2 + r * .08, hy + r * .22); g.lineTo(hx + r * .13, hy + r * .36); g.closePath(); g.fill();
  tCurve(g, hx + r * .13, hy + r * .36, hx, hy + r * .52, hx - r * .12, hy + r * .42, 2.2); tCurve(g, hx + r * .13, hy + r * .36, hx + r * .26, hy + r * .52, hx + r * .38, hy + r * .42, 2.2);
  g.strokeStyle = 'rgba(42,36,52,.55)'; g.lineWidth = 1.6;
  for (const s of [-1, 1]) for (const dy of [-.04, .1]) { g.beginPath(); g.moveTo(hx + r * .13 + s * r * .55, hy + r * (.3 + dy)); g.lineTo(hx + r * .13 + s * r * 1.35, hy + r * (.22 + dy * 2)); g.stroke(); }
}
function drawCat(g, x, y, s, o = {}) {
  const F = CAT_FUR[o.fur || 'ginger'], d = o.dir || 1, pose = o.pose || 'sit', sw = Math.sin((o.tail || 0) * 6.2832);
  g.save(); g.translate(x, y); g.scale(d * s / 100, s / 100);
  const leg = (x0, y0, x1, y1, w = 11) => tTube(g, [x0, y0, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1], w, F.a);
  const paw = (px, py) => tEllipse(g, px, py, 8, 5.5, F.c === '#ffffff' ? F.c : (F.patch ? F.a : F.c), 2.4);
  if (pose === 'sit') {
    tTube(g, [-22, -6, -52 + sw * 6, -2, -44 + sw * 10, -30], 10, F.a);                            // tail
    const bp = gg => gg.ellipse(-4, -36, 30, 36, -.08, 0, 6.2832);
    tShape(g, F.a, bp, 3.2); tShade(g, bp, F.s, gg => gg.ellipse(-24, -26, 18, 34, 0, 0, 6.2832));
    tShade(g, bp, F.c, gg => gg.ellipse(14, -36, 13, 22, 0, 0, 6.2832));
    leg(6, -26, 8, -4); leg(20, -28, 22, -4); paw(10, -2); paw(24, -2);
    catHead(g, 14, -82, 28, F, o);
  } else if (pose === 'crouch') {
    const wg = Math.sin((o.wiggle || 0) * 6.2832) * 5;
    tTube(g, [-44, -26, -64, -28 + sw * 4, -80, -34 + sw * 10], 10, F.a);
    leg(-30, -18, -38 + wg * .3, -2, 13); paw(-36 + wg * .3, -1);
    g.save(); g.translate(-30, -10); g.rotate(-.1 + wg * .01); g.translate(30, 10);
    const bp = gg => gg.ellipse(-6, -24 + wg * .4, 44, 19, -.12, 0, 6.2832);
    tShape(g, F.a, bp, 3.2); tShade(g, bp, F.s, gg => gg.ellipse(-10, -10, 44, 9, -.1, 0, 6.2832));
    if (F.stripe) { g.save(); bp(g); g.clip(); g.strokeStyle = F.stripe; g.lineWidth = 5; for (const dx of [-28, -14, 0]) { g.beginPath(); g.moveTo(dx, -44); g.lineTo(dx + 4, -30); g.stroke(); } g.restore(); }
    g.restore();
    leg(26, -14, 42, -2); leg(18, -14, 32, -2); paw(44, -1); paw(34, -1);
    catHead(g, 44, -26, 25, F, o);
  } else if (pose === 'run') {
    const ph = (o.phase || 0) * 6.2832, a = Math.sin(ph), b = Math.cos(ph);
    g.rotate(o.rot || 0);
    tTube(g, [-42, -36, -62, -44 - a * 6, -80, -56 + sw * 8], 10, F.a);
    leg(-30, -26, -52 - a * 16, -8 + b * 4); leg(-22, -26, -40 + a * 16, -6 - b * 4);
    const bp = gg => gg.ellipse(-4, -34, 46, 18, 0, 0, 6.2832);
    tShape(g, F.a, bp, 3.2); tShade(g, bp, F.s, gg => gg.ellipse(-8, -20, 46, 9, 0, 0, 6.2832));
    if (F.stripe) { g.save(); bp(g); g.clip(); g.strokeStyle = F.stripe; g.lineWidth = 5; for (const dx of [-26, -12, 2]) { g.beginPath(); g.moveTo(dx, -52); g.lineTo(dx + 4, -38); g.stroke(); } g.restore(); }
    leg(28, -28, 52 + a * 14, -14 - b * 6); leg(20, -28, 42 - a * 14, -10 + b * 6);
    catHead(g, 46, -44, 24, F, o);
  } else {                                                                                         // loaf
    tTube(g, [-30, -8, -40, -2, -16 + sw * 4, 0], 9, F.a);
    const bp = gg => gg.ellipse(0, -22, 40, 22, 0, 0, 6.2832);
    tShape(g, F.a, bp, 3.2); tShade(g, bp, F.s, gg => gg.ellipse(-6, -8, 40, 10, 0, 0, 6.2832));
    if (F.patch) tShade(g, bp, F.patch[0], gg => gg.ellipse(-16, -30, 18, 12, 0, 0, 6.2832));
    catHead(g, 26, -40, 22, F, o);
  }
  g.restore();
}
// a cat face pressed against glass, seen from the front (window shots). r = head radius. o.pupil, o.squish 0..1, o.fur
function drawCatPressed(g, x, y, r, o = {}) {
  const F = CAT_FUR[o.fur || 'ginger'], q = o.squish ?? 1;
  g.save(); g.translate(x, y);
  for (const s of [-1, 1]) { g.save(); g.translate(s * r * .62, -r * .7); g.rotate(s * .32); tShape(g, F.a, gg => { gg.moveTo(-r * .32, r * .2); gg.lineTo(0, -r * .55); gg.lineTo(r * .32, r * .2); gg.closePath(); }, 3); g.fillStyle = '#f7a8bf'; g.beginPath(); g.moveTo(-r * .16, r * .1); g.lineTo(0, -r * .32); g.lineTo(r * .16, r * .1); g.closePath(); g.fill(); g.restore(); }
  const hp = gg => gg.ellipse(0, 0, r * (1.05 + .12 * q), r * (.95 - .05 * q), 0, 0, 6.2832);
  tShape(g, F.a, hp, 3.4);
  if (F.patch) { tShade(g, hp, F.patch[0], gg => gg.ellipse(-r * .6, -r * .5, r * .6, r * .5, .3, 0, 6.2832)); tShade(g, hp, F.patch[1], gg => gg.ellipse(r * .7, -r * .55, r * .45, r * .4, 0, 0, 6.2832)); }
  if (F.stripe) { g.save(); hp(g); g.clip(); g.strokeStyle = F.stripe; g.lineWidth = r * .1; g.lineCap = 'round'; for (const dx of [-.28, 0, .28]) { g.beginPath(); g.moveTo(dx * r, -r); g.lineTo(dx * r * .8, -r * .55); g.stroke(); } g.restore(); }
  // the squashed muzzle: a flat pale patch where it touches the glass
  tShade(g, hp, F.c, gg => gg.ellipse(0, r * .42, r * (.55 + .15 * q), r * (.34 + .06 * q), 0, 0, 6.2832));
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(0, r * .38, r * .5 * q, r * .26 * q, 0, 0, 6.2832); g.fill();
  catEyes(g, -r * .38, -r * .12, r * .3, o, r * .76);
  g.fillStyle = '#f07f9c'; g.beginPath(); g.ellipse(0, r * .26, r * (.12 + .06 * q), r * (.08 + .02 * q), 0, 0, 6.2832); g.fill();
  tCurve(g, 0, r * .33, -r * .12, r * .48, -r * .24, r * .4, 2.2); tCurve(g, 0, r * .33, r * .12, r * .48, r * .24, r * .4, 2.2);
  // paws on the glass in front of the face, pink toe beans, forearms coming up from below
  for (const s of [-1, 1]) {
    tTube(g, [s * r * .95, r * 1.7, s * r * 1.0, r * 1.1, s * r * .98, r * .5], r * .4, F.a);
    tEllipse(g, s * r * .98, r * .42, r * .3, r * .26, F.c, 2.4);
    g.fillStyle = '#f7a8bf'; g.beginPath(); g.ellipse(s * r * .98, r * .48, r * .12, r * .09, 0, 0, 6.2832); g.fill();
    for (const k of [-1, 0, 1]) { g.beginPath(); g.arc(s * r * .98 + k * r * .11, r * .29, r * .045, 0, 6.2832); g.fill(); }
  }
  g.restore();
}
// the red dot of a laser pointer, with a glow (world coordinates)
function drawLaserDot(g, x, y, r = 7, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 4); gr.addColorStop(0, 'rgba(255,60,60,.9)'); gr.addColorStop(.3, 'rgba(255,30,40,.45)'); gr.addColorStop(1, 'rgba(255,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 4, 0, 6.2832); g.fill();
  g.globalCompositeOperation = 'source-over'; g.fillStyle = '#ff2a3a'; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  g.fillStyle = '#ffd6d6'; g.beginPath(); g.arc(x - r * .25, y - r * .25, r * .4, 0, 6.2832); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- the backyard behind the lab building (11/8: outdoor episodes)
// World 2160 wide (the camera can pan), ground line YARD.ground. The building's back wall is on the left with the basement window and the back door.
const YARD = { w: 2160, ground: 1660, door: { x: 420, y: 1380 }, hose: { x: 1080 } };
function buildYard() {
  const b = document.createElement('canvas'); b.width = YARD.w; b.height = 2400; const g = b.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 1300); sky.addColorStop(0, '#7ec8f5'); sky.addColorStop(1, '#ffe2b8'); g.fillStyle = sky; g.fillRect(0, 0, YARD.w, 1920);
  // far rooftops
  const R = (() => { let a = 11; return () => { a = a * 16807 % 2147483647; return a / 2147483647; }; })();
  for (let x = -40; x < YARD.w; x += 150 + R() * 90) { const h = 260 + R() * 260, w = 140 + R() * 80; tShape(g, ['#b7a7c9', '#a99bc0', '#c3b4d3'][(R() * 3) | 0], gg => gg.rect(x, 1180 - h, w, h + 40), 3); for (let wy = 1180 - h + 40; wy < 1140; wy += 70) for (let wx = x + 22; wx < x + w - 30; wx += 46) tShape(g, R() < .3 ? '#fff2b0' : '#8d80a8', gg => gg.rect(wx, wy, 22, 30), 2); }
  // the wooden fence
  for (let x = 0; x < YARD.w; x += 64) tShape(g, '#c98f5a', gg => { gg.moveTo(x + 4, 1500); gg.lineTo(x + 4, 1130); gg.lineTo(x + 32, 1104); gg.lineTo(x + 60, 1130); gg.lineTo(x + 60, 1500); gg.closePath(); }, 3);
  tShape(g, '#a9733f', gg => gg.rect(0, 1190, YARD.w, 22), 3); tShape(g, '#a9733f', gg => gg.rect(0, 1400, YARD.w, 22), 3);
  // ground: grass with a dirt path
  tShape(g, '#79c46b', gg => gg.rect(-10, 1480, YARD.w + 20, 940), 4);
  tShape(g, '#c9a477', gg => { gg.moveTo(-10, 1620); gg.bezierCurveTo(600, 1590, 1400, 1700, YARD.w + 10, 1630); gg.lineTo(YARD.w + 10, 1730); gg.bezierCurveTo(1400, 1790, 600, 1700, -10, 1720); gg.closePath(); }, 3);
  for (let i = 0; i < 160; i++) { const x = R() * YARD.w, y = 1490 + R() * 420; if (y > 1600 && y < 1740) continue; tLine(g, [x, y, x - 4, y - 12], 2.4); }
  // the lab building's back wall, left: bricks, the basement window at ground level, the back door with steps
  const bw = 560;
  g.save(); g.beginPath(); g.rect(0, 0, bw, 1500); g.clip();
  g.fillStyle = '#9a5a46'; g.fillRect(0, 0, bw, 1500);
  for (let r = 0, y = 0; y < 1500; r++, y += 44) for (let x = (r % 2) * -50; x < bw; x += 100) { g.fillStyle = R() < .5 ? '#a8634d' : '#8f533f'; g.fillRect(x + 3, y + 3, 94, 38); }
  g.restore();
  tShape(g, null, gg => gg.rect(0, 0, bw, 1500), 4);
  tShape(g, '#2b2f3e', gg => gg.rect(150, 1410, 230, 80), 3.4); tShape(g, '#bfe7ff', gg => gg.rect(160, 1418, 210, 64), 2.4);   // basement window
  tShape(g, '#5b4636', gg => gg.rect(330, 1100, 180, 300), 4); tEllipse(g, 488, 1260, 9, 9, '#ffd23f', 2.6);                     // back door
  tShape(g, '#fff6c8', gg => gg.rect(358, 1150, 124, 40), 2.6); tText(g, 'VOLT LABS', 420, 1171, 20, TOON.ink, '"Bungee"', 'center', 400);
  for (let i = 0; i < 3; i++) tShape(g, '#8a8f9e', gg => gg.rect(310 - i * 10, 1400 + i * 30, 220 + i * 20, 30), 3);
  // laundry line with two lab coats; trash cans; a junk pile with the first ray lying in it
  tLine(g, [700, 900, 700, 1500], 8); tLine(g, [1500, 900, 1500, 1500], 8); tCurve(g, 700, 920, 1100, 990, 1500, 920, 3);
  for (const cx of [900, 1180]) { tShape(g, '#f4f1fb', gg => { gg.moveTo(cx - 60, 960); gg.lineTo(cx + 60, 962); gg.lineTo(cx + 70, 1130); gg.lineTo(cx - 70, 1128); gg.closePath(); }, 3); tLine(g, [cx, 960, cx, 1128], 2.4); tShape(g, '#b6ff3b', gg => gg.rect(cx - 26, 952, 10, 16), 2); }
  for (const x of [1700, 1800]) { tShape(g, '#8a93ab', gg => gg.roundRect(x, 1420, 80, 110, 8), 3.4); tShape(g, '#6c7590', gg => gg.roundRect(x - 6, 1408, 92, 18, 6), 3); }
  tShape(g, '#5f6a82', gg => gg.roundRect(1930, 1450, 180, 70, 14), 3.4); tShape(g, '#d9873a', gg => gg.roundRect(1960, 1440, 16, 90, 5), 2.4); tShape(g, '#ff8fb8', gg => gg.arc(2108, 1484, 30, 0, 6.2832), 3);   // the old ray, on its side
  YARD.img = b;
}
// the garden hose across the path (a trip hazard); k > 0 snaps it taut when someone trips
function drawHose(g, t, k = 0) {
  const x = YARD.hose.x, y = YARD.ground - 6;
  g.save(); g.lineCap = 'round';
  g.strokeStyle = TOON.ink; g.lineWidth = 18; g.beginPath(); g.moveTo(x - 300, y + 30); g.bezierCurveTo(x - 120, y - 10 - k * 20, x + 80, y + 20, x + 260, y - 4); g.stroke();
  g.strokeStyle = '#3fae6a'; g.lineWidth = 11; g.stroke();
  g.restore();
  tShape(g, '#3fae6a', gg => gg.ellipse(x - 340, y + 40, 60, 22, 0, 0, 6.2832), 3); tShape(g, '#2f8a52', gg => gg.ellipse(x - 340, y + 40, 32, 11, 0, 0, 6.2832), 2.4);
}
