// Void Mart, episode 1: "First Shift". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
'use strict';
const W = 1080, H = 1920, cv = document.getElementById('c'), c = cv.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const CT = 1290;                                  // counter top (world y)
const PIP = { x: 330, s: 190 }, RAE = { x: 740, s: 190 }, MAGS = { x: 540, y: 112, s: 170 };
const PIPFACE = CT - 176 * PIP.s / 100, RAEFACE = CT - 222 * RAE.s / 100, MAGSY = MAGS.y + 54 * MAGS.s / 100;
const BOARD = { x: 200, y: 372 };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const STATIC = {};

// ---------------------------------------------------------------- lip sync from character timings
function mouthFor(who, t) {
  for (const v of TL.VO) {
    if (v.who !== who || t < v.t - .02 || t > v.t + v.dur + .05) continue;
    const lt = t - v.t, ch = CHARS[v.id];
    let a = 0, shape = 'e';
    for (const [ck, t0, t1] of ch) {
      if (t1 < lt - .05 || t0 > lt + .03) continue;
      const l = ck.toLowerCase();
      let o = 0, s = 'e';
      if ('ao'.includes(l)) { o = 1; s = l === 'o' ? 'o' : 'a'; }
      else if (l === 'u' || l === 'w') { o = .7; s = 'o'; }
      else if ('eiy'.includes(l)) { o = .65; s = 'e'; }
      else if ('mbp'.includes(l)) o = 0;
      else if ('fv'.includes(l)) o = .2;
      else if (/[a-z]/.test(l)) o = .35;
      if (o > a) { a = o; shape = s; }
    }
    return { a, shape };
  }
  return null;
}
const talkLevel = (who, t) => { const m = mouthFor(who, t); return m ? m.a : 0; };
function blinkAt(seed, t) { const p = 3.1 + seed * .7, f = ((t + seed * 1.37) % p) / p; return f < .04; }

// ---------------------------------------------------------------- the store, seen from outside the front window
function buildStore() {
  const b = document.createElement('canvas'); b.width = W; b.height = H;
  const g = b.getContext('2d');
  // back wall + ceiling
  const wg = g.createLinearGradient(0, 0, 0, CT); wg.addColorStop(0, '#2a1858'); wg.addColorStop(1, '#3a2270'); g.fillStyle = wg; g.fillRect(0, 0, W, CT);
  g.fillStyle = '#1e1044'; g.fillRect(0, 0, W, 96);
  for (const x of [120, 760]) { g.save(); g.shadowColor = '#fff6d6'; g.shadowBlur = 40; tShape(g, '#fffbea', gg => gg.roundRect(x, 118, 200, 18, 9), 3); g.restore(); }
  // shelves left and right
  const items = ['#ff7a1a', '#29d3c3', '#ffd23f', '#ff4fa3', '#b9a6ff', '#7ef0ff', '#8fd65a'];
  for (const [x0, x1] of [[0, 230], [850, W]]) {
    g.fillStyle = '#24124a'; g.fillRect(x0, 470, x1 - x0, CT - 470);
    for (let r = 0; r < 5; r++) {
      tShape(g, '#4a3192', gg => gg.rect(x0 + 6, 620 + r * 140, x1 - x0 - 12, 14), 3);
      for (let i = 0; (i + 1) * 48 < x1 - x0; i++) { const hh = 44 + ((i * 7 + r * 3 + x0) % 4) * 14; tShape(g, items[(i + r + (x0 ? 3 : 0)) % 7], gg => gg.roundRect(x0 + 14 + i * 48, 620 + r * 140 - hh, 38, hh, 5), 3); }
    }
  }
  // incident board (left) and employee of the month (right)
  tShape(g, '#fbf7ff', gg => gg.roundRect(BOARD.x - 150, BOARD.y - 52, 300, 104, 10), 4);
  tText(g, 'DAYS SINCE LAST INCIDENT', BOARD.x, BOARD.y - 24, 19, TOON.ink);
  tShape(g, '#c9a24a', gg => gg.rect(780, 250, 200, 220), 4); tShape(g, '#2b1858', gg => gg.rect(796, 266, 168, 160), 3);
  drawMags(g, 880, 300, 90);
  tShape(g, '#fbf7ff', gg => gg.rect(796, 432, 168, 26), 2.4); tText(g, 'EMPLOYEE OF THE MONTH', 880, 446, 13, TOON.ink);
  // staff door between the shelves
  tShape(g, '#4a2c8a', gg => gg.rect(470, 560, 140, CT - 560), 4); tShape(g, '#fbf7ff', gg => gg.rect(490, 610, 100, 30), 2.4); tText(g, 'STAFF ONLY', 540, 626, 15, TOON.ink);
  STATIC.store = b;
  // counter front (drawn after the characters)
  const f = document.createElement('canvas'); f.width = W; f.height = H - CT; const h = f.getContext('2d');
  tShape(h, TOON.orange, gg => gg.rect(-10, 0, W + 20, 40), 5);
  h.fillStyle = '#3a2470'; h.fillRect(-10, 42, W + 20, H);
  h.strokeStyle = 'rgba(0,0,0,.25)'; h.lineWidth = 4; for (let x = 60; x < W; x += 240) { h.beginPath(); h.moveTo(x, 60); h.lineTo(x, H); h.stroke(); }
  STATIC.front = f;
}
function drawRegister(g) {
  tShape(g, '#5b5f78', gg => gg.roundRect(900, CT - 110, 150, 110, 10), 4);
  tShape(g, '#1a2a3a', gg => gg.roundRect(916, CT - 96, 118, 50, 6), 3);
  tText(g, '$0.00', 975, CT - 70, 26, '#7ef0ff', '"Bungee"', 'center', 400);
  tShape(g, '#ffd23f', gg => gg.roundRect(640, CT - 26, 80, 26, 5), 3); tText(g, 'CHOCO', 680, CT - 12, 13, TOON.ink);   // candy bar
}
function drawBoardNumber(g, t) {
  const k = clamp((t - TL.FLIP) / .35);
  const x = BOARD.x, y = BOARD.y + 18, w = 64, h = 46;
  tShape(g, '#e23b4a', gg => gg.roundRect(x - w / 2, y - h / 2, w, h, 6), 3);
  const num = k < .5 ? '1' : '0', sy = Math.abs(Math.cos(k * Math.PI));
  g.save(); g.translate(x, y); g.scale(1, Math.max(.05, sy)); tText(g, num, 0, 2, 38, '#fff', '"Bungee"', 'center', 400); g.restore();
  tLine(g, [x - w / 2 + 3, y, x + w / 2 - 3, y], 2);
}

// ---------------------------------------------------------------- space
function drawSpace(g, t, zoom, cx, cy) {
  const gr = g.createRadialGradient(cx, cy, 10, cx, cy, 1300 * zoom); gr.addColorStop(0, '#ffcf8a'); gr.addColorStop(.05, '#ff6a3d'); gr.addColorStop(.16, '#c42f8a'); gr.addColorStop(.38, '#3d1a7a'); gr.addColorStop(1, '#0a0620');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.translate(cx, cy); g.rotate(t * .25);
  for (let i = 0; i < 5; i++) {   // swirl arms
    g.rotate(Math.PI * 2 / 5); g.beginPath();
    for (let k = 0; k <= 60; k++) { const r = (60 + k * 16) * zoom, a = k * .09; const x = Math.cos(a) * r, y = Math.sin(a) * r * .55; k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = `rgba(255,${140 + i * 20},${120 + i * 15},.22)`; g.lineWidth = 26 * zoom; g.lineCap = 'round'; g.stroke();
  }
  g.restore();
  g.save(); g.translate(cx, cy); g.beginPath(); g.arc(0, 0, 70 * zoom, 0, 6.2832); g.fillStyle = '#05020c'; g.fill(); g.lineWidth = 8 * zoom; g.strokeStyle = '#ffd08a'; g.stroke(); g.restore();
  drawStars(g, W, H, 220, 4);
}
function drawStoreExterior(g, x, y, k) {    // the tiny store on its rock
  g.save(); g.translate(x, y); g.scale(k, k);
  tShape(g, '#5a4a7a', gg => { gg.moveTo(-200, 40); gg.bezierCurveTo(-210, 120, -60, 170, 30, 150); gg.bezierCurveTo(150, 130, 220, 90, 200, 40); gg.closePath(); });
  tShape(g, '#e8e4f0', gg => gg.rect(-160, -110, 320, 150), 5);
  g.save(); g.shadowColor = '#ffd98a'; g.shadowBlur = 40; tShape(g, '#ffe8a8', gg => gg.rect(-140, -70, 200, 100), 4); g.restore();
  tShape(g, '#bfe9ff', gg => gg.rect(80, -70, 60, 110), 4);
  tShape(g, '#241640', gg => gg.rect(-150, -160, 300, 46), 4);
  drawLogo(g, 0, -137, 26, { glow: .6 });
  g.restore();
}

// ---------------------------------------------------------------- the monster at the door
function drawMonster(g, t) {
  const k = ease((t - TL.MONSTER - .25) / .9), x = lerp(W + 40, 760, k);
  if (k <= 0) return;
  g.save(); g.globalAlpha = .96;
  g.fillStyle = '#07030f';
  g.beginPath(); g.moveTo(x + 40, H); g.bezierCurveTo(x - 60, 1300, x - 40, 700, x + 120, 520);
  g.lineTo(x + 150, 430); g.lineTo(x + 190, 510); g.lineTo(x + 250, 400); g.lineTo(x + 290, 500); g.bezierCurveTo(x + 420, 560, W + 200, 700, W + 200, H); g.closePath(); g.fill();
  g.restore();
  const blink = ((t * 1.3) % 2.6) < .12;
  [[x + 150, 700, 26], [x + 240, 660, 30], [x + 320, 720, 24]].forEach(([ex, ey, r], i) => {
    if (blink && i === 1) return;
    g.save(); g.shadowColor = '#ffe14a'; g.shadowBlur = 30; g.fillStyle = '#ffe14a'; g.beginPath(); g.ellipse(ex, ey, r, r * .62, 0, 0, 6.2832); g.fill(); g.restore();
    g.fillStyle = '#07030f'; g.beginPath(); g.ellipse(ex - 6, ey, r * .25, r * .5, 0, 0, 6.2832); g.fill();
  });
}

// ---------------------------------------------------------------- a hand pressed on the glass (screen space)
function glassHand(g, x, y, k, alpha) {
  g.save(); g.globalAlpha = alpha;
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(x, y - 10 * k, 120 * k, 140 * k, 0, 0, 6.2832); g.fill();
  tHand(g, x, y, 22 * k, TOON.pip.skin, TOON.pip.skinS, true);
  g.restore();
}
function handPrint(g, x, y, k, alpha) {
  g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = 'screen';
  g.fillStyle = 'rgba(220,235,255,.35)';
  const r = 22 * k;
  g.beginPath(); g.ellipse(x, y, r * .95, r * .9, 0, 0, 6.2832); g.fill();
  [[-.9, -1.9], [-.3, -2.25], [.35, -2.15], [.95, -1.75]].forEach(([fx, fy]) => { g.beginPath(); g.ellipse(x + fx * r * .85, y + fy * r * .75, r * .26, r * .55, 0, 0, 6.2832); g.fill(); });
  g.beginPath(); g.ellipse(x - r * 1.5, y - r * .3, r * .22, r * .45, -.8, 0, 6.2832); g.fill();
  g.restore();
}
function glassStreaks(g, a) {
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'screen';
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.42, 'rgba(255,255,255,0)'); gr.addColorStop(.47, 'rgba(255,255,255,.12)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(.62, 'rgba(255,255,255,0)'); gr.addColorStop(.64, 'rgba(255,255,255,.08)'); gr.addColorStop(.66, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .45, H * .75); vg.addColorStop(0, 'rgba(120,60,200,0)'); vg.addColorStop(1, 'rgba(120,60,200,.18)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.restore();
}

// ---------------------------------------------------------------- subtitles
function subtitle(t) {
  for (const v of TL.VO) {
    if (t < v.s0 || t > v.s1) continue;
    const ls = v.sub.split('\n'), lh = 76, y1 = 1470;
    const a = clamp((t - v.s0) / .08) * clamp((v.s1 - t) / .08);
    c.save(); c.globalAlpha = a; c.font = '600 62px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    ls.forEach((s, i) => { const y = y1 - (ls.length - 1 - i) * lh; c.lineWidth = 12; c.strokeStyle = '#120a2a'; c.strokeText(s, W / 2, y); c.fillStyle = v.col; c.fillText(s, W / 2, y); });
    c.restore();
  }
}

// ---------------------------------------------------------------- cameras
const CAM = {
  WIDE: [540, 1000, 1.18, 1.22],
  WIDE_FREEZE: [540, 1000, 1.2, 1.24],
  WIDE_MONSTER: [560, 1000, 1.2, 1.16],
  PIP_GLASS: [PIP.x + 20, PIPFACE + 95, 2.1, 2.2],
  PIP_PEEL: [PIP.x + 20, PIPFACE + 95, 2.2, 2.25],
  PIP_CU: [PIP.x, PIPFACE + 95, 2.15, 2.28],
  PIP_TINY: [PIP.x, PIPFACE + 90, 2.3, 2.5],
  RAE_MED: [RAE.x - 20, RAEFACE + 165, 1.55, 1.6],
  RAE_CU: [RAE.x, RAEFACE + 85, 2.35, 2.55],
  MAGS_CU: [MAGS.x, MAGSY + 30, 3.0, 3.15],
  BOARD: [BOARD.x, BOARD.y + 40, 2.9, 3.05],
};
function shotAt(t) { for (const s of TL.SHOTS) if (t >= s[1] && t < s[2]) return s; return TL.SHOTS[TL.SHOTS.length - 1]; }

// ---------------------------------------------------------------- characters for this frame
function pipState(t, shot) {
  const n = shot[0];
  let expr = 'grin', x = PIP.x, wave = false, wavePhase = null, sweat = false;
  if (n === 'WIDE') { const k = ease((t - TL.SHOTS[1][1]) / .35); x = lerp(-160, PIP.x, k) + Math.sin(clamp((t - TL.SHOTS[1][1] - .35) / .3) * Math.PI) * 14; wave = t > V.L1.t + .2; wavePhase = t * 11; }
  if (n === 'PIP_GLASS') expr = t < V.L3.t ? 'gasp' : 'grin';
  if (n === 'PIP_PEEL') expr = 'worried';
  if (n === 'WIDE_FREEZE') { expr = 'grin'; sweat = t > TL.FREEZE[0] + .3; }
  if (n === 'WIDE_MONSTER') expr = t > TL.MONSTER + .5 ? 'worried' : 'grin';
  if (n === 'RAE_MED') expr = 'worried';
  if (n === 'PIP_TINY') { expr = 'sheepish'; sweat = true; }
  const frozen = n === 'WIDE_FREEZE';
  const mouth = frozen ? null : mouthFor('PIP', t);
  const talking = mouth && mouth.a > .06;
  return { x, o: { expr, wave, wavePhase, sweat, mouth, blink: !frozen && blinkAt(0, t), arms: true }, bob: frozen ? 0 : Math.sin(t * 2.1) * 2 + (talking ? Math.sin(t * 15) * 2.5 : 0) };
}
function raeState(t, shot) {
  const n = shot[0];
  let look = 1.5, mug = null;
  if (n === 'WIDE_MONSTER') look = 3;
  if (n === 'RAE_MED' && t > V.L9.t) look = -3;
  if (n === 'WIDE_FREEZE') { const a = TL.FREEZE[0] + .5, b = TL.FREEZE[1] - .3; mug = t < a ? ease((t - a + .5) / .5) : t < b ? 1 : 1 - ease((t - b) / .3); }
  if (n === 'WIDE' || n === 'WIDE_MONSTER') mug = 0;
  const mouth = mouthFor('RAE', t);
  return { x: RAE.x, o: { expr: 'deadpan', look, mug, mouth, blink: blinkAt(1, t), scanner: true }, bob: Math.sin(t * 1.7 + 1) * 1.5 };
}

// ---------------------------------------------------------------- frame
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (n === 'VOID') {
    const z = lerp(.9, 1.25, ease(sk));
    drawSpace(c, t, z, 540, 820);
    const k = lerp(.55, 2.6, Math.pow(sk, 2.2));
    drawStoreExterior(c, 540, 1060 - (k - .55) * 60, k);
    const la = clamp(1 - (sk - .6) / .3);
    c.save(); c.globalAlpha = la; drawLogo(c, 540, 330, 74, { glow: .55 }); tText(c, 'EPISODE 1  ·  FIRST SHIFT', 540, 420, 34, '#f4eaff'); c.restore();
    subtitle(t); return;
  }
  if (n === 'POV') {
    drawSpace(c, t, lerp(1.6, 1.9, sk), 540, 860);
    glassStreaks(c, .8);
    subtitle(t); return;
  }
  const [cx, cy, z0, z1] = CAM[n], z = lerp(z0, z1, ease(sk));
  const shake = n === 'WIDE_MONSTER' && t > TL.MONSTER + .25 && t < TL.MONSTER + 1.0 ? Math.sin(t * 90) * 4 : 0;
  c.setTransform(z, 0, 0, z, 540 - cx * z + shake, 960 - cy * z);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t);
  drawMags(c, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t), glow: V.L11 && t > V.L11.t ? 18 : 26 });
  const P = pipState(t, shot), R = raeState(t, shot);
  drawRae2(c, R.x, CT + R.bob, RAE.s, R.o);
  drawPip2(c, P.x, CT + P.bob, PIP.s, P.o);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c);
  if (n === 'RAE_MED' && t < V.L4.t && Math.sin(t * 9) > .6) { c.save(); c.globalAlpha = .7; tLine(c, [RAE.x + 44 * RAE.s / 100, CT - 38 * RAE.s / 100, 680, CT - 14], 3); c.restore(); }
  c.setTransform(1, 0, 0, 1, 0, 0);
  // screen-space layers
  if (n === 'PIP_GLASS') glassHand(c, 260, 1230, 3, 1);
  if (n === 'PIP_PEEL') {
    const k = ease((t - TL.PEEL[0]) / (TL.PEEL[1] - TL.PEEL[0]));
    handPrint(c, 260, 1230, 3, clamp((t - TL.PEEL[0] - .2) / .4));
    glassHand(c, 260 - k * 60, 1230 + k * 760, 3, 1);
  }
  if (n === 'PIP_CU' && t > V.L7.t) for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.3; drawStar(c, 540 + Math.cos(a) * 330, 700 + Math.sin(a * 1.3) * 200, 14 + 6 * Math.sin(a * 3), '#fff6b0', 2.4); }
  if (n.startsWith('WIDE') || n === 'RAE_MED' || n.startsWith('PIP')) glassStreaks(c, .9);
  if (n === 'WIDE_MONSTER' || (n === 'RAE_MED' && t > V.L9.t) || n === 'PIP_TINY' || (n === 'MAGS_CU' && t > V.L11.t) || n === 'BOARD') {
    const fl = n === 'WIDE_MONSTER' && t < TL.MONSTER + 1.1 ? (Math.sin(t * 47) > .3 ? .45 : .15) : .22;
    c.fillStyle = `rgba(10,4,24,${fl})`; c.fillRect(0, 0, W, H);
  }
  if (n === 'WIDE_MONSTER') drawMonster(c, t);
  if (n === 'RAE_MED' && t > V.L9.t) { c.save(); c.globalAlpha = .9; c.fillStyle = '#07030f'; c.fillRect(W - 120, 0, 120, H); c.restore(); }
  subtitle(t);
}
window.render = render;

// ---------------------------------------------------------------- sound cues for the mix
const S = Object.fromEntries(TL.SHOTS.map(s => [s[0] + '@' + s[1], s[1]]));
const shotStarts = n => TL.SHOTS.filter(s => s[0] === n).map(s => s[1]);
window.EV = [
  { type: 'swoosh', t: 0.0 },
  { type: 'door', t: 1.55 },
  { type: 'whoosh', t: TL.SHOTS[1][1], pan: -.5 },
  { type: 'sparkle', t: shotStarts('POV')[0] + .1 },
  { type: 'glass', t: shotStarts('PIP_GLASS')[0] + .05 },
  { type: 'beep', t: V.L3.t + .25, pan: .3 }, { type: 'beep', t: V.L3.t + 1.6, pan: .3 },
  { type: 'squeak', t: TL.PEEL[0] },
  ...shotStarts('MAGS_CU').map(t => ({ type: 'blip', t: t + .02 })),
  { type: 'sip', t: TL.FREEZE[0] + .8, pan: .3 },
  { type: 'chime', t: TL.MONSTER },
  { type: 'flicker', t: TL.MONSTER + .05 },
  { type: 'rumble', t: TL.MONSTER + .25, pan: .6 },
  { type: 'flip', t: TL.FLIP },
  { type: 'bed', fx: 'store_hum', t: TL.SHOTS[1][1] - .2, t1: DUR + .5, g: -30 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
