// "The Last Leaf": one leaf left on an old oak; a girl checks on it every morning; it falls into her hands; a book keeps it.
// Page contract: window.DUR, window.render(t) (pure function of t), window.READY, window.EV.
'use strict';
const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false });
window.DUR = TL.DUR;
const GOLD = '#e0a03a', GOLD_D = '#b8742a';         // the accent: the leaf
const S = {};
const COAT = '#33506a', HAT = '#8a8f96', SKIN = '#ecc1a0', HAIR = '#4a3228';
const dayAt = t => { let d = 1; for (const [t0, n] of TL.DAYS) if (t >= t0) d = n; return d; };
const SKYD = { 1: '#d9cdb8', 2: '#a7b5c0', 3: '#d3dde4' };

// ---------------------------------------------------------------- build
function build() {
  withSeed(51, () => {
    S.sky = wash(rectPts(-20, -20, W + 20, 1420), '#d9cdb8', .5, 8, 26);
    const far = [[-20, 1420]];
    for (let x = -20; x <= W + 20; x += 36) far.push([x, 1270 - 50 * Math.abs(Math.sin(x / 90)) - 30 * vnoise(x * .02, 3)]);
    far.push([W + 20, 1420]);
    S.far = wash(far, '#a9a49a', .3, 5, 12);
    S.ground = wash(rectPts(-20, 1390, W + 20, 1940), '#b9a88e', .42, 8, 22);
    S.path = wash([[-20, 1468], [W + 20, 1452], [W + 20, 1580], [-20, 1600]], '#ddd0b8', .45, 6, 18);
    // the oak: bare, wide, a little bent
    S.tree = []; const tips = [];
    const br = (x, y, a, l, w, d) => {
      const P = polar(x, y, a, l, rnd(-.14, .14) * l, Math.max(8, Math.round(l / 14))), e = P[P.length - 1];
      S.tree.push({ s: mk(P, w, d < 2 ? '#5d4a3a' : '#6a5442', { prof: d ? 'tip' : 'trunk', nb: w > 6 ? 5 : 0, a: .9, rough: .2 }), d });
      if (w > 7) { const ed = edgeOf(S.tree[S.tree.length - 1].s, 1, Math.max(1.5, w * .12), INK, .4); if (ed) S.tree.push({ s: ed, d }); }
      if (d < 3) { const n = d === 0 ? 4 : 2; for (let k = 0; k < n; k++) { const i = Math.floor(rnd(d ? .4 : .55, .9) * (P.length - 1)); br(P[i][0], P[i][1], a + (k % 2 ? 1 : -1) * rnd(.45, .95), l * rnd(.55, .75), w * .52, d + 1); } }
      else tips.push(e);
      if (d < 3) br(e[0], e[1], a + rnd(-.3, .3), l * rnd(.4, .55), w * .6, d + 1);
    };
    br(380, 1450, -1.5, 470, 78, 0);
    // the last leaf: a tip high on the right
    let best = tips[0]; for (const p of tips) if (p[0] - p[1] * .8 > best[0] - best[1] * .8 && p[0] < 900 && p[1] > 260) best = p;
    S.leafAt = best;
    // fallen leaves around the roots and along the path
    S.fallen = [];
    for (let k = 0; k < 150; k++) { const x = rnd(40, 1040), y = rnd(1400, 1620) + (Math.abs(x - 380) < 160 ? -rnd(0, 20) : 0); S.fallen.push(mk(polar(x, y, rnd(0, 6.28), rnd(14, 22), rnd(-3, 3), 6), rnd(8, 12), ['#9a7448', '#7f5f3a', '#b08a52', '#8c6a42'][k % 4], { prof: 'leaf', nb: 2, a: .7, rough: .15 })); }
    // the book insert
    S.table = wash(rectPts(-20, -20, W + 20, H + 20), '#a88a6a', .5, 10, 30);
    S.pageL = wash([[110, 520], [532, 560], [532, 1460], [130, 1420]], '#efe6d6', .35, 3, 16);
    S.pageR = wash([[548, 560], [970, 520], [950, 1420], [548, 1460]], '#efe6d6', .35, 3, 16);
    S.gutter = wash([[510, 556], [570, 556], [570, 1462], [510, 1462]], '#b8a68e', .4, 3, 12);
    S.lines = []; for (let k = 0; k < 16; k++) { const y = 640 + k * 46; S.lines.push(mk(qcurve(170, y + k * 2, 480, y + k * 2 + 12, 1, 10), 2.4, '#8c7d66', { prof: 'even', nb: 0, a: .35, rough: .5, rib: 1 })); }
    S.titleRule = mk(qcurve(380, 1318, 700, 1314, -3, 24), 6, GOLD, { prof: 'brush', nb: 4, a: .85 });
  });
  const L = S.leafAt;
  setCamera(
    [[0, 1.8], [1.2, 1.8], [5.0, 1], [8.8, 1], [9.8, 1.15], [11.6, 1.15], [12.4, 1], [22.4, 1], [23.0, 1.45], [27.4, 1.6], [29.6, 1.6], [31.6, 2.3], [32.8, 2.3], [33.0, 1], [46, 1]],
    [[0, [L[0], L[1] + 60]], [1.2, [L[0], L[1] + 60]], [5.0, [540, 960]], [8.8, [540, 960]], [9.8, [600, 1180]], [11.6, [600, 1180]], [12.4, [540, 960]], [22.4, [540, 960]], [23.0, [L[0] - 60, L[1] + 200]], [27.4, [610, 1360]], [29.6, [610, 1360]], [31.6, [610, 1390]], [32.8, [610, 1390]], [33.0, [540, 960]], [46, [540, 960]]]);
}
const camAt0 = camAt;
camAt = t => { if (t >= TL.BOOK[1]) return { z: 1 + .04 * seg(t, TL.BOOK[1], TL.DUR), cx: 540, cy: 960 }; const m = camAt0(t), hw = W / 2 / m.z, hh = H / 2 / m.z; m.cx = clamp(m.cx, hw, W - hw); m.cy = clamp(m.cy, hh, H - hh); return m; };

// ---------------------------------------------------------------- wind and the leaf
function wind(t) {
  const g = ss(seg(t, TL.GUST[0], TL.GUST[0] + .6)) * (1 - ss(seg(t, TL.GUST[1] - .5, TL.GUST[1])));
  const r = ss(seg(t, TL.RAIN[0], TL.RAIN[0] + 1)) * (1 - ss(seg(t, TL.RAIN[1] - 1, TL.RAIN[1])));
  return { a: .004 + .028 * g + .012 * r * (1 - g), f: 1.2 + 2.2 * g };
}
function leafShape(c, x, y, s, rot) {
  // an oak leaf: lobed edge
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40, a = u * 6.283, lob = 1 + .18 * Math.cos(a * 4) * Math.sin(Math.PI * clamp(Math.abs(Math.sin(a / 2)) * 1.1));
    const px = Math.cos(a) * 15 * s * lob, py = Math.sin(a) * 30 * s * (.85 + .15 * Math.cos(a));
    const X = x + px * Math.cos(rot) - py * Math.sin(rot), Y = y + px * Math.sin(rot) + py * Math.cos(rot);
    i ? c.lineTo(X, Y) : c.moveTo(X, Y);
  }
  c.closePath();
}
function drawLeaf(c, x, y, s, rot, fade = 0) {
  const col = mixc(GOLD, '#c8a46a', fade);
  paperClip(c, () => leafShape(c, x, y, s * 1.02, rot), .95);
  for (let k = 0; k < 3; k++) { c.fillStyle = rgba(col, .32); leafShape(c, x, y, s * (1 - k * .04), rot); c.fill(); }
  c.fillStyle = rgba(GOLD_D, .3 * (1 - fade * .5)); c.save(); leafShape(c, x, y, s, rot); c.clip(); c.beginPath(); c.ellipse(x + Math.cos(rot) * 8 * s, y + Math.sin(rot) * 8 * s, 14 * s, 30 * s, rot, 0, 6.283); c.fill(); c.restore();
  c.strokeStyle = rgba(GOLD_D, .7); c.lineWidth = Math.max(1.2, 2 * s);
  const ax = -Math.sin(rot), ay = Math.cos(rot);
  c.beginPath(); c.moveTo(x - ax * 34 * s, y - ay * 34 * s); c.lineTo(x + ax * 28 * s, y + ay * 28 * s); c.stroke();   // midrib and stem
  c.lineWidth = Math.max(.8, s); for (let k = -2; k <= 2; k++) { if (!k) continue; const px = x + ax * k * 8 * s, py = y + ay * k * 8 * s; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(rot) * 10 * s * Math.sign(k), py + Math.sin(rot) * 10 * s * Math.sign(k)); c.stroke(); }
}
function leafPos(t) {
  const [lx, ly] = S.leafAt, w = wind(t);
  if (t < TL.FALL[0]) { const fl = Math.sin(t * 7 * w.f) * (w.a * 30); return { x: lx + 4, y: ly + 30, rot: .3 + fl, s: 1.15 }; }
  const u = seg(t, TL.FALL[0], TL.FALL[1]), e = eio(u);
  const tx = 606, ty = 1398;   // into her cupped hands
  return { x: lerp(lx + 4, tx, e) + Math.sin(u * 14) * 70 * (1 - u), y: lerp(ly + 30, ty, e), rot: .3 + Math.sin(u * 11) * 1.2 * (1 - u * .7), s: 1.15 };
}

// ---------------------------------------------------------------- the girl
function girlPose(t) {
  const w = seg(t, TL.WALK[0], TL.WALK[1]);
  let x = lerp(-90, 600, w), walk = w > 0 && w < 1 ? 1 : 0, face = w < 1 ? 1 : 0, look = 0, reach = 0, cup = 0;
  if (t > TL.WALK[1]) { look = ss(seg(t, TL.LOOK - .4, TL.LOOK + .4)); }
  if (t > TL.FALL[0]) { look = 1; reach = ss(seg(t, TL.CATCH - 1.4, TL.CATCH - .3)) * (1 - ss(seg(t, TL.CATCH + .3, TL.CATCH + 1.0))); cup = ss(seg(t, TL.CATCH, TL.CATCH + .8)); }
  const day = dayAt(t);
  return { x, y: 1530, walk, phase: (t - TL.WALK[0]) * 7, face, look: look * (1 - cup * .7), reach, cup, umbrella: day === 2 ? ss(seg(t, TL.RAIN[0], TL.RAIN[0] + .6)) : 0, breath: day === 3 };
}
function drawGirl(c, t, g) {
  const { x, y } = g, s = 1;
  const sway = g.walk ? Math.sin(g.phase) : 0;
  withSeed(800, () => {
    // umbrella (day 2)
    if (g.umbrella > 0) {
      c.strokeStyle = rgba(INK2, .8 * g.umbrella); c.lineWidth = 3; c.beginPath(); c.moveTo(x + 18, y - 150); c.lineTo(x + 6, y - 330); c.stroke();
      c.fillStyle = rgba('#5f84a8', .62 * g.umbrella); c.beginPath(); c.moveTo(x - 120, y - 300); c.quadraticCurveTo(x + 6, y - 420, x + 130, y - 300); c.quadraticCurveTo(x + 6, y - 322, x - 120, y - 300); c.fill();
    }
    // legs and boots
    for (const k of [-1, 1]) {
      const a = sway * .45 * k;
      const kx = x + k * 12, hx = kx + Math.sin(a) * 60, hy = y - Math.cos(a) * 60 + 60 - 60;
      drawS(c, mk(qcurve(kx, y - 64, hx, y - 6 + Math.abs(Math.sin(a)) * -4, 0, 6), 15, '#3a3f4a', { prof: 'even', nb: 2, a: .85 }));
      c.fillStyle = rgba('#6b4a32', .85); c.beginPath(); c.ellipse(hx + 8 * g.face, y - 4, 16, 9, 0, 0, 6.283); c.fill();
      void hy;
    }
    // coat (A-line), scarf, backpack
    c.fillStyle = rgba(COAT, .78); c.beginPath(); c.moveTo(x - 30, y - 196); c.quadraticCurveTo(x, y - 210, x + 30, y - 196); c.lineTo(x + 50, y - 64); c.quadraticCurveTo(x, y - 52, x - 50, y - 64); c.closePath(); c.fill();
    c.fillStyle = rgba(shade(COAT, .75), .4); c.beginPath(); c.moveTo(x + 6, y - 200); c.lineTo(x + 30, y - 196); c.lineTo(x + 50, y - 64); c.lineTo(x + 16, y - 58); c.closePath(); c.fill();
    if (g.face) { c.fillStyle = rgba('#7a5a3a', .75); c.fillRect(x - 46, y - 186, 22, 70); }   // backpack, seen from the side
    paperClip(c, () => { c.beginPath(); c.ellipse(x, y - 200, 32, 12, 0, 0, 6.283); }, .9);
    c.fillStyle = rgba('#d9cfc0', .55); c.beginPath(); c.ellipse(x, y - 200, 32, 12, 0, 0, 6.283); c.fill();
    // arms: walking swing, reaching up, or cupped at the chest
    const arm = (k) => {
      const sx = x + k * 26, sy = y - 186;
      let ex, ey;
      if (g.cup > 0) { ex = lerp(sx + k * 10, x + k * 8, g.cup); ey = lerp(sy + 70, y - 126, g.cup); }
      else if (g.reach > 0) { ex = sx + k * 14 + 10; ey = lerp(sy + 70, sy - 70, g.reach); }
      else { const a = (g.walk ? sway * k : 0) * .5; ex = sx + Math.sin(a) * 60 + k * 4; ey = sy + Math.cos(a) * 66; }
      drawS(c, mk(qcurve(sx, sy, ex, ey, 6 * k, 8), 14, COAT, { prof: 'even', nb: 2, a: .85 }));
      c.fillStyle = rgba(SKIN, .9); c.beginPath(); c.arc(ex, ey, 8, 0, 6.283); c.fill();
    };
    arm(-1); arm(1);
    // head: hair, face, beanie
    const lk = g.look, hx = x + (g.face ? 4 : 0), hy = y - 246 - lk * 4;
    c.fillStyle = rgba(HAIR, .85); c.beginPath(); c.ellipse(hx, hy + 6, 38, 36, 0, 0, 6.283); c.fill();
    paperClip(c, () => { c.beginPath(); c.ellipse(hx + (g.face ? 6 : 0), hy + 4 - lk * 6, 30, 32, 0, 0, 6.283); }, .95);
    c.fillStyle = rgba(SKIN, .8); c.beginPath(); c.ellipse(hx + (g.face ? 6 : 0), hy + 4 - lk * 6, 30, 32, 0, 0, 6.283); c.fill();
    c.fillStyle = rgba(INK, .85);
    if (g.face) { c.beginPath(); c.arc(hx + 18, hy - 2 - lk * 10, 3.2, 0, 6.283); c.fill(); }
    else { for (const ex of [-11, 11]) { c.beginPath(); c.arc(hx + ex, hy - lk * 14, 3.4, 0, 6.283); c.fill(); } }
    c.fillStyle = rgba('#e89a86', .5); c.beginPath(); c.ellipse(hx + (g.face ? 14 : -16), hy + 12 - lk * 8, 7, 4, 0, 0, 6.283); c.fill(); if (!g.face) { c.beginPath(); c.ellipse(hx + 16, hy + 12 - lk * 8, 7, 4, 0, 0, 6.283); c.fill(); }
    if (!g.face) { c.strokeStyle = rgba(INK, .7); c.lineWidth = 2.4; c.beginPath(); c.arc(hx, hy + 14 - lk * 10, 6 + g.cup * 2, .3, Math.PI - .3); c.stroke(); }
    c.fillStyle = rgba(HAT, .85); c.beginPath(); c.ellipse(hx, hy - 20 - lk * 6, 36, 22, 0, Math.PI, 2 * Math.PI); c.fill(); c.fillRect(hx - 36, hy - 22 - lk * 6, 72, 10);
    c.beginPath(); c.arc(hx, hy - 44 - lk * 6, 8, 0, 6.283); c.fill();
    if (g.breath) { c.save(); c.globalCompositeOperation = 'source-over'; const b = (t * .9) % 1; c.fillStyle = rgba(PAPERC, .5 * (1 - b)); c.beginPath(); c.arc(hx + 30 + b * 30, hy + 10 - b * 26 - lk * 10, 8 + b * 14, 0, 6.283); c.fill(); c.restore(); }
  });
}

// ---------------------------------------------------------------- the book
function drawBook(c, t) {
  const years = t > TL.YEARS[0] + .5;
  drawWash(c, S.table, 1);
  if (years) { c.fillStyle = rgba('#7a5a44', .3); c.fillRect(0, 0, W, H); }
  paperClip(c, () => { pathPoly(c, S.pageL.polys[0]); pathPoly(c, S.pageR.polys[0]); }, .96);
  drawWash(c, S.pageL, 1); drawWash(c, S.pageR, 1); drawWash(c, S.gutter, 1);
  S.lines.forEach(s => drawS(c, s, 1));
  for (let k = 0; k < 4; k++) { c.strokeStyle = rgba('#a8957c', .5); c.lineWidth = 2; c.beginPath(); c.moveTo(130 - k * 6, 1424 + k * 7); c.lineTo(530, 1464 + k * 7); c.lineTo(950 + k * 6, 1424 + k * 7); c.stroke(); }
  // the leaf: laid down by a small hand; years later, flatter and paler, with a note
  const pl = seg(t, TL.PLACE[0], TL.PLACE[1]);
  const lx = years ? 760 : lerp(820, 760, eio(pl)), ly = years ? 960 : lerp(1300, 960, eio(pl)), rot = years ? .5 : lerp(.1, .5, pl);
  if (pl > 0 || years) drawLeaf(c, lx, ly, 3.2, rot, years ? .45 : 0);
  if (!years && pl < 1) {
    const hp = 1 - ss(seg(t, TL.PLACE[1] - .3, TL.PLACE[1] + .2));
    withSeed(901, () => drawS(c, mk(qcurve(1100, 1500, lx + 60, ly + 120, -20, 12), 70, COAT, { prof: 'even', nb: 5, a: .85 * hp })));
    c.fillStyle = rgba(SKIN, .9 * hp); c.beginPath(); c.ellipse(lx + 40, ly + 100, 34, 24, -.5, 0, 6.283); c.fill();
  }
  if (years) {
    withSeed(902, () => drawS(c, mk(qcurve(1120, 1720, 980, 1340, 30, 12), 110, '#8a8f96', { prof: 'even', nb: 6, a: .8 })));
    c.fillStyle = rgba(SKIN, .9); c.beginPath(); c.ellipse(960, 1310, 62, 40, -.6, 0, 6.283); c.fill();
  }
}

// ---------------------------------------------------------------- frame
function render(t) {
  const c = ctx, cam = camAt(t);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  setCam(c, cam); drawPaper(c);
  c.globalCompositeOperation = 'multiply';
  if (t < TL.BOOK[1]) {
    // the park: sky by day, painted in as we pull back
    const d = dayAt(t), prevD = d > 1 ? d - 1 : 1, t0 = TL.DAYS[d - 1][0], ch = d > 1 ? seg(t, t0, t0 + 1.2) : 1;
    const full = t > 6;
    W_(c, t, S.sky, .6, 2.6, 'td', SKYD[ch < 1 ? prevD : d], 1, full);
    if (ch < 1) { c.save(); wipePath(c, -20, -20, W + 20, 1420, ss(ch), 'lr', d); c.clip(); c.globalCompositeOperation = 'source-over'; drawPaper(c); c.globalCompositeOperation = 'multiply'; drawWash(c, S.sky, 1, SKYD[d]); c.restore(); }
    W_(c, t, S.far, 1.6, 3.0, 'lr', null, 1, full);
    W_(c, t, S.ground, 2.0, 3.4, 'td', null, 1, full);
    W_(c, t, S.path, 2.6, 3.6, 'lr', null, 1, full);
    const w = wind(t);
    c.save(); c.translate(380, 1450); c.transform(1, 0, w.a * Math.sin(t * w.f), 1, 0, 0); c.translate(-380, -1450);
    S.tree.forEach(({ s, d: dd }) => { const st = [.2, .7, 1.4, 2.0][Math.min(3, dd)]; S_(c, t, s, st, st + .8, null, 1, full); });
    c.restore();
    S.fallen.forEach((s, i) => S_(c, t, s, 2.6 + i * .008, 3.0 + i * .008, null, 1, full));
    if (d === 3) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = rgba('#dfe8ee', .25 * ss(seg(t, TL.STILL, TL.STILL + 1))); c.fillRect(0, 0, W, H); setCam(c, cam); }
    const g = girlPose(t);
    if (g.x > -80) drawGirl(c, t, g);
    const lp = leafPos(t);
    drawLeaf(c, lp.x, lp.y, lp.s, lp.rot);
    if (t > TL.RAIN[0] && t < TL.RAIN[1]) {
      const a = ss(seg(t, TL.RAIN[0], TL.RAIN[0] + .6)) * (1 - ss(seg(t, TL.RAIN[1] - .6, TL.RAIN[1])));
      c.strokeStyle = rgba('#6f8698', .4 * a); c.lineWidth = 1.8;
      for (let i = 0; i < 110; i++) { const x = hash1(i * 7.7) * 1080, y = ((t * 950 + hash1(i * 1.9) * 2000) % 2000) - 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 44); c.stroke(); }
    }
    if (t > TL.GUST[0] && t < TL.GUST[1]) for (let i = 0; i < 8; i++) { const u = (t - TL.GUST[0]) / (TL.GUST[1] - TL.GUST[0]), x = -60 + ((u * 1.4 + hash1(i)) % 1) * 1200, y = 1380 - Math.sin(u * 9 + i) * 60 - i * 30; drawLeaf(c, x, y, .5, u * 12 + i, .6); }
  } else drawBook(c, t);
  mistCover(c, cam, t, TL.BOOK[0], TL.BOOK[1], 3);
  mistCover(c, cam, t, TL.YEARS[0], TL.YEARS[1], 5);
  // annotation layer
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
  if (t > 5.2 && t < TL.BOOK[0]) label(c, 'DAY ' + dayAt(t), 90, 1336, ss(seg(t, 5.2, 5.7)) * (1 - ss(seg(t, TL.BOOK[0] - .4, TL.BOOK[0]))));
  if (t > TL.YEARS[1] + .4) note(c, { z: 1, cx: 540, cy: 960 }, t, TL.YEARS[1] + .6, TL.TITLE[0] - .2, 'the last one, Nov 8', [700, 1060], [-460, 260], 50);
  subtitles(c, t);
  c.save(); titleCard(c, t, TL.TITLE[0], TL.TITLE[1], 'The Last Leaf', 1290, S.titleRule); c.restore();
}
window.render = render;

function buildEvents() {
  E(.5, 'brushbed', { dur: 3.0, pan: 0 });
  E(0, 'bed', { fx: 'wind_autumn', t1: TL.STILL + .5, g: -24 });
  E(1.0, 'bed', { fx: 'crows', t1: 6, g: -26 });
  E(TL.WALK[0], 'steps', { dur: TL.WALK[1] - TL.WALK[0] + .2, pan: -.3 });
  E(TL.GUST[0] - .2, 'gust', { pan: .2 });
  E(TL.DAYS[1][0], 'brush', { dur: 1.2, pan: -.4, g: .7 }); E(TL.DAYS[2][0], 'brush', { dur: 1.2, pan: .4, g: .7 });
  E(TL.RAIN[0] - .3, 'bed', { fx: 'rain', t1: TL.RAIN[1] + .8, g: -14 });
  E(TL.STILL, 'bed', { fx: 'snow', t1: TL.BOOK[0] + .6, g: -27 });
  E(TL.FALL[0], 'flutter', { dur: TL.FALL[1] - TL.FALL[0], pan: .3 });
  E(TL.CATCH, 'catch', {});
  E(TL.BOOK[0], 'mist', { dur: 1.2 });
  E(TL.PLACE[0], 'book', { pan: 0 });
  E(TL.YEARS[0], 'mist', { dur: 1.2 });
  E(TL.YEARS[1] + .6, 'pen', { dur: 1.0 });
  E(TL.TITLE[0], 'brush', { dur: .9, pan: 0, g: .6 });
  EV.sort((a, b) => a.t - b.t);
  window.EV = EV;
}
(async () => {
  try { await loadFonts(); PAPER = buildPaper(); build(); buildEvents(); window.READY = true; }
  catch (e) { console.error('init failed', e && e.stack || e); window.INIT_ERROR = String(e && e.stack || e); }
})();
