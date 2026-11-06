// "The Magpie's Share": twelve persimmons drying under the eaves; a magpie takes one; the first snow.
// Page contract: window.DUR, window.render(t) (pure function of t), window.READY, window.EV.
'use strict';
const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false });
window.DUR = TL.DUR;
const PERSIMMON = '#e9813a';                    // the accent: the fruit
const S = {};
const MG = TL.MAGPIE;
const eaveY = x => 400 - 95 * Math.pow((x - 540) / 560, 4);
const STR_X = [480, 640, 800], STR_TOP = 530, ROW_Y = [660, 820, 980, 1140];
// sky by time: autumn blue → late autumn → snow grey, in bands
const SKY_K = [[0, '#c9d6dc'], [13.3, '#c9d6dc'], [17.5, '#cfd2c8'], [22, '#d3cbbd'], [40, '#d3cbbd'], [42, '#bfc6cc']];
function skyCol(t) {
  let c = hex(SKY_K[0][1]);
  for (let i = 1; i < SKY_K.length; i++) c = mixc(c, SKY_K[i][1], ss(seg(t, SKY_K[i - 1][0], SKY_K[i][0])) * (SKY_K[i][1] !== SKY_K[i - 1][1] ? 1 : 0));
  return c;
}
const DRY_COL = ['#e9813a', '#d9702f', '#b8582a', '#8f4a2c', '#74402a'];
function dryAt(t) { return ss(seg(t, TL.DRY[0], TL.DRY[1])); }
function fruitCol(d) { const i = Math.min(3, Math.floor(d * 4)), u = d * 4 - i; return mixc(DRY_COL[i], DRY_COL[i + 1], u); }

// ---------------------------------------------------------------- build
function build() {
  withSeed(31, () => {
    // roof: tiles above a curved eave line that lifts at both ends
    const roof = [[-40, -40], [W + 40, -40]];
    for (let x = W + 40; x >= -40; x -= 20) roof.push([x, eaveY(x)]);
    S.roof = wash(roof, '#4f5a64', .62, 4, 18);
    S.ridges = [];
    for (let x = -10; x < W + 20; x += 46) S.ridges.push(mk(qcurve(x, 0, x + 2, eaveY(x) - 14, 1, 10), 9, '#3a434b', { prof: 'even', nb: 3, a: .32, rough: .3 }));
    S.tileEnds = [];
    for (let x = 0; x <= W; x += 46) S.tileEnds.push({ x, w: wash(ellipsePts(x, eaveY(x) - 4, 17, 15, 18, 0, .06, x), '#5b6670', .7, 1.2, 6) });
    const raft = [];
    for (let x = -40; x <= W + 40; x += 20) raft.push([x, eaveY(x) + 4]);
    for (let x = W + 40; x >= -40; x -= 20) raft.push([x, eaveY(x) + 46]);
    S.rafters = wash(raft, '#8a6a4a', .55, 2, 14);
    S.raftEnds = [];
    for (let x = 23; x <= W; x += 46) S.raftEnds.push({ x, w: wash(ellipsePts(x, eaveY(x) + 25, 10, 10, 14, 0, .05, x + 3), '#cdb07a', .75, .8, 5) });
    const sh = [];
    for (let x = -40; x <= W + 40; x += 20) sh.push([x, eaveY(x) + 44]);
    for (let x = W + 40; x >= -40; x -= 20) sh.push([x, eaveY(x) + 96]);
    S.eaveShadow = wash(sh, '#9c9a96', .26, 5, 16);
    S.beam = wash(rectPts(-20, 500, W + 20, 532), '#7a5a3c', .6, 2);
    S.beamE = [...edgeLine(-20, 500, W + 20, 500, 2, INK2, .5, 3), ...edgeLine(-20, 532, W + 20, 532, 2, INK, .45, 3)];
    // courtyard: sky, far ridge, stone wall, ground
    S.sky = wash(rectPts(-20, 300, W + 20, 1330), '#c9d6dc', .5, 6, 24);
    const ridge = [[-20, 1330]];
    for (let x = -20; x <= W + 20; x += 40) ridge.push([x, 1170 + 40 * Math.sin(x / 210) + 22 * Math.sin(x / 77 + 1)]);
    ridge.push([W + 20, 1330]);
    S.ridge = wash(ridge, '#9aa7b0', .36, 4, 14);
    S.wall = wash([[-20, 1250], [W + 20, 1262], [W + 20, 1340], [-20, 1336]], '#b8ab98', .45, 4, 14);
    S.stones = [];
    for (let k = 0; k < 16; k++) S.stones.push(mk(qcurve(k * 70 + rnd(0, 20), 1290 + rnd(-24, 24), k * 70 + rnd(40, 60), 1292 + rnd(-24, 24), rnd(-6, 6), 8), rnd(2, 3), INK2, { prof: 'even', nb: 0, a: .35, rough: .4, rib: 1 }));
    S.ground = wash([[-20, 1336], [W + 20, 1340], [W + 20, 1640], [-20, 1640]], '#d9cdb5', .34, 10, 22);
    // the persimmon tree beyond the wall, bare, three fruits left on it
    S.tree = [];
    const br = (x, y, a, l, w, d) => {
      const P = polar(x, y, a, l, rnd(-.15, .15) * l, 10), e = P[P.length - 1];
      S.tree.push(mk(P, w, d ? '#6a5442' : '#5d4a3a', { prof: d ? 'tip' : 'trunk', nb: w > 6 ? 4 : 0, a: .9, rough: .2 }));
      if (d < 2) for (let k = 0; k < 2; k++) { const i = Math.floor(rnd(.5, .85) * (P.length - 1)); br(P[i][0], P[i][1], a + (k ? 1 : -1) * rnd(.35, .7), l * rnd(.45, .6), w * .6, d + 1); }
      else tips.push(e);
      return e;
    };
    const tips = [];
    br(205, 1330, -1.5, 540, 24, 0);
    // three fruits left on real branch tips (inside the page): the highest, the leftmost, the rightmost
    const T = tips.filter(([x, y]) => x > 50 && x < 400 && y > 560);
    T.sort((a, b) => a[0] - b[0]);
    const le = T[0], ri = T[T.length - 1], hi = T.slice(1, -1).reduce((a, b) => b[1] < a[1] ? b : a, T[Math.floor(T.length / 2)]);
    S.treeFruit = [le, ri, hi].map(([x, y]) => [x, y + 20]);
    S.perch = [ri[0] - 30, ri[1] + 44];
    // wind bell at the left corner of the eave
    S.bell = { x: 74, y: eaveY(74) + 34 };
    // strings and the twelve persimmons
    S.strings = STR_X.map(x => mk(qcurve(x, STR_TOP, x + 2, 1190, 3, 30), 2, INK2, { prof: 'even', nb: 0, a: .75, rough: .3, rib: 1 }));
    S.fruit = [];
    STR_X.forEach((x, si) => ROW_Y.forEach((y, ri) => S.fruit.push({ si, ri, x0: x + (ri % 2 ? 7 : -7), y0: y, seed: si * 10 + ri, rot: rnd(-.12, .12) })));
    // order of hanging: the hook one first (middle string, top), then the rest
    const first = S.fruit.findIndex(f => f.si === 1 && f.ri === 0);
    const order = [first, ...S.fruit.map((f, i) => i).filter(i => i !== first)];
    order.forEach((fi, k) => S.fruit[fi].hang = TL.HANG[k]);
    S.stolen = S.fruit.findIndex(f => f.si === 2 && f.ri === 3);
    S.P0 = [S.fruit[first].x0, S.fruit[first].y0];
    S.titleRule = mk(qcurve(380, 1318, 700, 1314, -3, 24), 6, PERSIMMON, { prof: 'brush', nb: 4, a: .85 });
  });
  setCamera(
    [[0, 1.7], [2.6, 1.7], [6.2, 1], [13.3, 1], [23.3, 1.25], [24.4, 1.4], [27, 1.5], [29.6, 1.5], [32.6, 1.12], [40, 1.12], [44, 1]],
    [[0, S.P0], [2.6, S.P0], [6.2, [540, 960]], [13.3, [540, 960]], [23.3, [640, 880]], [24.4, [760, 780]], [27, [740, 1000]], [29.6, [700, 1000]], [32.6, [400, 960]], [40, [420, 960]], [44, [540, 960]]]);
}
// keep the camera on the sheet
const camAt0 = camAt;
camAt = t => { const m = camAt0(t), hw = W / 2 / m.z, hh = H / 2 / m.z; m.cx = clamp(m.cx, hw, W - hw); m.cy = clamp(m.cy, hh, H - hh); return m; };

// ---------------------------------------------------------------- wind
function windAmp(t) { return .006 + .03 * ss(seg(t, TL.WIND[0], TL.WIND[0] + 1.5)) * (1 - ss(seg(t, TL.WIND[1] - 1.5, TL.WIND[1]))) + .004 * ss(seg(t, 40, 42)); }
function swayAt(t, si) { return windAmp(t) * (Math.sin(1.1 * t + si * 1.7) + .4 * Math.sin(2.6 * t + si)); }
// a point hanging on string si at distance d below the top, after sway
function onString(t, si, d) { const a = swayAt(t, si); return [STR_X[si] + Math.sin(a) * d, STR_TOP + Math.cos(a) * d]; }

// ---------------------------------------------------------------- the persimmon
function persPath(c, x, y, r, rot, seed) {
  const n = 36;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = i / n * 6.283, sq = 1 + .07 * Math.cos(4 * a), k = sq * (1 + .04 * (2 * vnoise(i * .5 + seed, seed) - 1));
    const px = Math.cos(a) * r * .95 * k, py = Math.sin(a) * r * .88 * k;
    const X = x + px * Math.cos(rot) - py * Math.sin(rot), Y = y + px * Math.sin(rot) + py * Math.cos(rot);
    i ? c.lineTo(X, Y) : c.moveTo(X, Y);
  }
  c.closePath();
}
function drawPersimmon(c, x, y, r, d, bloom, rot, seed, am = 1, peeled = true) {
  const col = peeled ? fruitCol(d) : hex('#e2683a');
  paperClip(c, () => persPath(c, x, y, r * 1.01, rot, seed), .95 * am);
  for (let k = 0; k < 3; k++) { c.fillStyle = rgba(col, .32 * am); persPath(c, x, y, r * (1 - k * .03), rot, seed + k); c.fill(); }
  c.strokeStyle = rgba(shade(col, .7), .5 * am); c.lineWidth = Math.max(1, r * .05); persPath(c, x, y, r, rot, seed); c.stroke();
  c.save(); persPath(c, x, y, r, rot, seed); c.clip();
  c.fillStyle = rgba(shade(col, .72), .35 * am); c.beginPath(); c.ellipse(x + r * .4, y + r * .35, r * .7, r * .8, .4, 0, 6.283); c.fill();
  if (peeled && d > .35) {   // wrinkles as it dries
    c.strokeStyle = rgba(shade(col, .6), .35 * am * seg(d, .35, .8)); c.lineWidth = Math.max(.8, r * .04);
    for (let k = 0; k < 4; k++) { const a0 = hash1(seed * 7 + k) * 6.28; c.beginPath(); c.arc(x + Math.cos(a0) * r * .3, y + Math.sin(a0) * r * .3, r * (.4 + .15 * k), a0, a0 + .8); c.stroke(); }
  }
  c.restore();
  if (bloom > 0) {           // the white sugar: unpainted paper coming through
    paperClip(c, () => { c.beginPath(); for (let k = 0; k < 26; k++) { const a = hash1(seed * 13 + k) * 6.28, q = Math.sqrt(hash1(seed * 3 + k)) * r * .85, rr = r * (.05 + .07 * hash1(seed + k * 5)); c.moveTo(x + Math.cos(a) * q + rr, y + Math.sin(a) * q); c.arc(x + Math.cos(a) * q, y + Math.sin(a) * q, rr, 0, 6.283); } }, .7 * bloom * am);
    c.fillStyle = rgba('#f4efe6', .18 * bloom * am); persPath(c, x, y, r, rot, seed); c.globalCompositeOperation = 'source-over'; c.fill(); c.globalCompositeOperation = 'multiply';
  } else {
    paperClip(c, () => { c.beginPath(); c.ellipse(x - r * .32, y - r * .3, r * .2, r * .13, -.6, 0, 6.283); }, .75 * am * (1 - d));
  }
  // calyx and the knot
  c.fillStyle = rgba('#4a3a26', .75 * am);
  for (let k = 0; k < 4; k++) { const a = -1.57 + (k - 1.5) * .55; c.beginPath(); c.ellipse(x + Math.cos(a) * r * .55, y - r * .78 + Math.sin(a + 1.57) * r * .12, r * .26, r * .1, a + 1.57, 0, 6.283); c.fill(); }
  c.strokeStyle = rgba(INK2, .8 * am); c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - r * .82); c.lineTo(x, y - r * 1.08); c.stroke();
}

// ---------------------------------------------------------------- the magpie
function magpiePos(t) {
  const P = (a, b, cc, u) => [lerp(lerp(a[0], cc[0], u), lerp(cc[0], b[0], u), u), lerp(lerp(a[1], cc[1], u), lerp(cc[1], b[1], u), u)];
  if (t < MG.in) return null;
  if (t < MG.land) { const u = eio(seg(t, MG.in, MG.land)); return { p: P([1220, 560], [880, 500], [1000, 360], u), fly: true, dir: -1 }; }
  if (t < MG.hop1) return { p: [880, 500], fly: false, dir: -1, call: seg(t, MG.call - .1, MG.call + .5) };
  const hop = (t0, x0, x1) => { const u = seg(t, t0, t0 + .3); return [lerp(x0, x1, eio(u)), 500 - Math.sin(Math.PI * u) * 16]; };
  if (t < MG.hop2) return { p: hop(MG.hop1, 880, 835), fly: false, dir: -1 };
  if (t < MG.down) return { p: hop(MG.hop2, 835, 800), fly: false, dir: -1 };
  if (t < MG.hover) { const u = eio(seg(t, MG.down, MG.hover)); return { p: P([800, 500], [842, 1112], [900, 760], u), fly: true, dir: -1 }; }
  if (t < MG.off) {
    let pk = 0;
    for (const q of MG.peck) pk = Math.max(pk, Math.sin(Math.PI * seg(t, q, q + .25)));
    return { p: [842 + Math.sin(t * 5) * 3, 1112 + Math.sin(t * 7) * 4], fly: true, hover: true, dir: -1, peck: pk, carry: t >= MG.grab };
  }
  if (t < MG.tree) { const u = eio(seg(t, MG.off, MG.tree)); return { p: P([842, 1112], S.perch, [600, 560], u), fly: true, dir: -1, carry: true }; }
  return { p: S.perch, fly: false, dir: 1, carry: true, bob: Math.sin((t - MG.tree) * 2.1) };
}
function drawMagpie(c, t, m) {
  const s = 1.0, [x, y] = m.p, dir = m.dir;
  const X = (dx) => x + dx * dir * s, Y = (dy) => y + dy * s;
  withSeed(500, () => {
    const body = m.fly ? -.08 : -.35, tail = m.fly ? 0 : (m.bob || 0) * 4 + Math.sin(t * 3) * 2;
    // tail
    drawS(c, mk(qcurve(X(-26), Y(-18), X(-100), Y(m.fly ? -16 : -46) + tail, 4 * dir, 12), 11 * s, '#1f2833', { prof: 'tip', nb: 3, a: .9, rough: .12 }));
    drawS(c, mk(qcurve(X(-30), Y(-20), X(-92), Y(m.fly ? -18 : -44) + tail, 3 * dir, 10), 4 * s, '#3c5a6e', { prof: 'tip', nb: 0, a: .45, rough: .2 }));
    // body
    c.fillStyle = rgba('#20262c', .85); c.beginPath(); c.ellipse(X(2), Y(-22), 34 * s, 19 * s, body * dir, 0, 6.283); c.fill();
    paperClip(c, () => { c.beginPath(); c.ellipse(X(6), Y(-14), 21 * s, 10 * s, body * dir, 0, 6.283); }, .92);   // white belly
    // head and beak
    const pk = m.peck || 0, hx = X(30 + pk * 10), hy = Y(-38 + (m.fly ? 10 : 0) + pk * 8 - (m.call || 0) * 4);
    c.fillStyle = rgba('#1a1f24', .9); c.beginPath(); c.arc(hx, hy, 14 * s, 0, 6.283); c.fill();
    c.strokeStyle = rgba('#1a1f24', .95); c.lineWidth = 5 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx + 10 * dir * s, hy + 2 * s); c.lineTo(hx + 24 * dir * s, hy + 4 * s + pk * 3); c.stroke();
    c.save(); c.globalCompositeOperation = 'source-over'; c.fillStyle = rgba(PAPERC, .8); c.beginPath(); c.arc(hx + 5 * dir * s, hy - 3 * s, 2.2 * s, 0, 6.283); c.fill(); c.restore();
    if (m.carry) drawPersimmon(c, hx + 30 * dir * s, hy + 12 * s, 16, dryAt(MG.grab), 0, .2, 77);
    if (m.fly) {
      // two wings, beating (or hovering fast)
      const f = Math.sin(t * (m.hover ? 30 : 22)), a = -.25 + f * .95;
      for (const k of [0, 1]) {
        const ang = (k ? a : a + .25) * -1, len = (k ? 72 : 60) * s;
        const tipX = X(-2) - Math.sin(ang) * 18 * dir * s - (k ? 30 : 22) * dir * s, tipY = Y(-26) - Math.cos(ang) * len;
        drawS(c, mk(qcurve(X(-2), Y(-26), tipX, tipY, 10 * dir, 10), 28 * s, k ? '#232b33' : '#2e3a46', { prof: 'leaf', nb: 4, a: .88, rough: .12 }));
        if (k) paperClip(c, () => { c.beginPath(); c.ellipse(lerp(X(-2), tipX, .62), lerp(Y(-26), tipY, .62), 8 * s, 5 * s, ang, 0, 6.283); }, .85);
      }
    } else {
      drawS(c, mk(qcurve(X(18), Y(-30), X(-34), Y(-16), -4 * dir, 10), 16 * s, '#2a3743', { prof: 'leaf', nb: 3, a: .85, rough: .12 }));
      paperClip(c, () => { c.beginPath(); c.ellipse(X(4), Y(-28), 9 * s, 5 * s, -.3 * dir, 0, 6.283); }, .85);   // white shoulder patch
      c.strokeStyle = rgba(INK, .8); c.lineWidth = 2.2 * s;
      for (const dx of [-3, 6]) { c.beginPath(); c.moveTo(X(dx), Y(-6)); c.lineTo(X(dx + 2), Y(2)); c.stroke(); }
    }
  });
}

// ---------------------------------------------------------------- snow
function drawSnow(c, t) {
  const a = ss(seg(t, TL.SNOW[0], TL.SNOW[0] + 1.5));
  if (a <= 0) return;
  c.save(); c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 110; i++) {
    const t0 = TL.SNOW[0] + hash1(i * 1.3) * 3, sp = 60 + hash1(i * 2.7) * 70;
    if (t < t0) continue;
    const x = hash1(i * 7.3) * W + Math.sin(t * .8 + i) * 18, y = 280 + ((t - t0) * sp + hash1(i * 5.1) * 1400) % 1400;
    c.fillStyle = rgba(PAPERC, .9 * a); c.beginPath(); c.arc(x, y, 2.4 + hash1(i * 3.9) * 3.2, 0, 6.283); c.fill();
  }
  c.restore();
  // a thin line of snow settling on the beam and the eave tiles
  const lay = seg(t, 41.5, 47);
  if (lay > 0) {
    paperClip(c, () => { c.beginPath(); for (let x = -20; x < W * lay + 20; x += 8) { const h = 4 + 3 * vnoise(x * .05, 2); c.rect(x, 496 - h, 8, h + 1); } }, .95);
    paperClip(c, () => { c.beginPath(); for (let x = 0; x <= W; x += 46) { if (x > W * lay) break; c.ellipse(x, eaveY(x) - 19, 15, 4.5, 0, 0, 6.283); } }, .9);
  }
}

// ---------------------------------------------------------------- frame
function render(t) {
  const c = ctx, cam = camAt(t);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  setCam(c, cam); drawPaper(c);
  c.globalCompositeOperation = 'multiply';
  const P0 = TL.PAINT[0], d = dryAt(t), bloom = ss(seg(t, TL.BLOOM[0], TL.BLOOM[1]));
  // courtyard
  W_(c, t, S.sky, P0, P0 + 1.2, 'td', skyCol(t));
  W_(c, t, S.ridge, P0 + .8, P0 + 1.6, 'lr');
  W_(c, t, S.wall, P0 + 1.4, P0 + 2.2, 'lr');
  S.stones.forEach((s, i) => S_(c, t, s, P0 + 1.8 + i * .04, P0 + 2.3 + i * .04));
  W_(c, t, S.ground, P0 + 1.6, P0 + 2.4, 'td');
  S.tree.forEach((s, i) => S_(c, t, s, P0 + 1.8 + i * .03, P0 + 2.4 + i * .03));
  S.treeFruit.forEach(([x, y], i) => { const p = seg(t, P0 + 2.6 + i * .15, P0 + 3.0 + i * .15); if (p > 0) drawPersimmon(c, x, y, 22 * eo(p), 0, 0, .1 * i, 40 + i, 1, false); });
  // eaves
  W_(c, t, S.roof, P0, P0 + 1.4, 'lr');
  S.ridges.forEach((s, i) => S_(c, t, s, P0 + .4 + i * .03, P0 + .9 + i * .03));
  W_(c, t, S.eaveShadow, P0 + 1.0, P0 + 1.6, 'lr');
  W_(c, t, S.rafters, P0 + .8, P0 + 1.6, 'lr');
  S.raftEnds.forEach((r, i) => W_(c, t, r.w, P0 + 1.2 + i * .03, P0 + 1.5 + i * .03, 'td'));
  S.tileEnds.forEach((r, i) => W_(c, t, r.w, P0 + .9 + i * .03, P0 + 1.2 + i * .03, 'td'));
  W_(c, t, S.beam, P0 + 1.6, P0 + 2.3, 'lr');
  S.beamE.forEach((s, i) => S_(c, t, s, P0 + 1.8 + i * .1, P0 + 2.4 + i * .1));
  // wind bell
  const bp = seg(t, P0 + 2.4, P0 + 2.9);
  if (bp > 0) {
    const ba = swayAt(t, 3) * 1.6 + (TL.BELL.some(b => t > b && t < b + 1.2) ? Math.sin(t * 9) * .08 : 0);
    c.save(); c.translate(S.bell.x, S.bell.y - 30); c.rotate(ba);
    c.strokeStyle = rgba(INK2, .8 * bp); c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.stroke();
    c.fillStyle = rgba('#8a7a4a', .7 * bp); c.beginPath(); c.moveTo(-14, 56); c.quadraticCurveTo(-12, 30, 0, 28); c.quadraticCurveTo(12, 30, 14, 56); c.closePath(); c.fill();
    c.strokeStyle = rgba(INK, .5 * bp); c.stroke();
    c.fillStyle = rgba('#5d6a5a', .7 * bp); c.beginPath(); c.moveTo(0, 62); c.lineTo(-9, 84); c.lineTo(0, 78); c.lineTo(9, 84); c.closePath(); c.fill();   // the fish
    c.restore();
  }
  // strings (they sway with the wind)
  S.strings.forEach((s, si) => {
    const p = seg(t, si === 1 ? 0 : P0 + 2.2 + si * .1, si === 1 ? .6 : P0 + 2.9 + si * .1);
    if (p <= 0) return;
    c.save(); c.translate(STR_X[si], STR_TOP); c.rotate(-swayAt(t, si)); c.translate(-STR_X[si], -STR_TOP);
    drawS(c, s, ss(p)); c.restore();
  });
  // the twelve
  S.fruit.forEach((f, i) => {
    if (t < f.hang) return;
    if (i === S.stolen && t >= MG.grab) return;
    const g = eo(seg(t, f.hang, f.hang + .35)), dIn = f.ri === 0 && f.si === 1 ? 1 - eo(seg(t, 0, .9)) : 0;
    const [x, y] = onString(t, f.si, f.y0 - STR_TOP - dIn * 220);
    const swing = f.ri === 0 && f.si === 1 ? Math.sin(t * 5) * 14 * Math.exp(-t * 1.2) : Math.sin((t - f.hang) * 9) * 5 * Math.exp(-(t - f.hang) * 4);
    const r = 36 * (1 - .18 * d) * (.4 + .6 * g);
    drawPersimmon(c, x + (f.x0 - STR_X[f.si]) + swing, y, r, d, bloom, f.rot + swayAt(t, f.si), f.seed, Math.min(1, g * 1.5));
  });
  if (t >= MG.grab) {   // the empty knot where it hung
    const [x, y] = onString(t, 2, ROW_Y[3] - STR_TOP);
    c.strokeStyle = rgba(INK2, .7); c.lineWidth = 2; c.beginPath(); c.ellipse(x + 7, y - 34, 5, 3, 0, 0, 6.283); c.stroke();
  }
  const m = magpiePos(t);
  if (m) drawMagpie(c, t, m);
  drawSnow(c, t);
  // annotation layer
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
  note(c, cam, t, 5.4, 9.2, 'gotgam', [S.P0[0] - 30, S.P0[1] - 10], [-330, -90]);
  note(c, cam, t, 40.4, 44.6, 'kkachi-bap', [S.treeFruit[2][0] - 18, S.treeFruit[2][1]], [-150, -110]);
  const dayA = ss(seg(t, 10.8, 11.3)) * (1 - ss(seg(t, 45.2, 45.7)));
  label(c, 'DAY ' + Math.round(track(TL.DAYS, ss)(t)), 90, 1336, dayA);
  subtitles(c, t);
  c.save(); c.globalCompositeOperation = 'source-over'; titleCard(c, t, TL.TITLE[0], TL.TITLE[1], "The Magpie's Share", 1290, S.titleRule); c.restore();
}
window.render = render;

function buildEvents() {
  E(.05, 'hang', { pan: .2, g: 1.2 });
  E(TL.PAINT[0], 'brushbed', { dur: 3.2, pan: 0 });
  [[TL.PAINT[0], 1.2, -.3], [TL.PAINT[0] + 1.0, .8, .4], [TL.PAINT[0] + 1.8, .9, -.6], [TL.PAINT[0] + 2.3, .7, .2]].forEach(([t, d, pan]) => E(t, 'brush', { dur: d, pan, g: .9 }));
  TL.HANG.slice(1).forEach((t, k) => E(t, 'hang', { pan: (STR_X[k % 3] - 540) / 540, g: .7 }));
  E(5.4, 'pen', { dur: .7 });
  E(0, 'wind', { t1: TL.WIND[0], g: -26 }); E(TL.WIND[0] - .5, 'wind', { t1: TL.WIND[1] + .5, g: -17 }); E(TL.WIND[1], 'wind', { t1: TL.SNOW[0] + 1, g: -24 });
  TL.BELL.forEach(t => E(t, 'bell', { pan: -.8 }));
  E(MG.in + .2, 'wings_land', { pan: .6 }); E(MG.call, 'call', { pan: .4 });
  E(MG.down, 'wings_off', { pan: .5, g: .6 });
  MG.peck.forEach(t => E(t, 'peck', { pan: .5 }));
  E(MG.off, 'wings_off', { pan: .2 });
  E(TL.SNOW[0] - .5, 'snow', { t1: TL.DUR });
  E(40.4, 'pen', { dur: .8 });
  E(TL.TITLE[0], 'brush', { dur: .9, pan: 0, g: .6 });
  EV.sort((a, b) => a.t - b.t);
  window.EV = EV;
}
(async () => {
  try {
    await loadFonts();
    PAPER = buildPaper();
    build();
    buildEvents();
    window.READY = true;
  } catch (e) { console.error('init failed', e && e.stack || e); window.INIT_ERROR = String(e && e.stack || e); }
})();
