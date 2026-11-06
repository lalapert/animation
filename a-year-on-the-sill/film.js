// "A Year on the Sill": a lemon tree on a windowsill, one painted journal page, one year.
// Page contract: window.DUR, window.render(t) (pure function of t), window.READY, window.EV (sound cues).
'use strict';
const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false });
const W = 1080, H = 1920;
window.DUR = TL.DUR;
const INK = '#2e2622', INK2 = '#6b5546', PAPERC = '#f2eadb', LEMON = '#e9c23f';
const GL = { x0: 200, x1: 880, y0: 360, y1: 1150 };   // window glass
const BEAT = TL.BEAT;
const LR = 38;                                        // the ripe lemon's radius
let PAPER = null;
const S = {};
const EV = [];

// palette as data: the light outside, one quantised wash per month (0 = night)
const SKY = { 1: '#b9c4cc', 3: '#c9d6dc', 4: '#d8e2c0', 5: '#dfe6c4', 6: '#d4dfc8', 7: '#8fa6b8', 8: '#ead9a8', 9: '#e3d3a4', 10: '#d9b37a', 11: '#c4bcae', 12: '#b9c4cc', 0: '#55657e' };
const CROWN = { 1: null, 3: ['#b9c49a', .3], 4: ['#a9c47a', .45], 5: ['#7f9a5c', .55], 6: ['#7f9a5c', .55], 7: ['#6f8a5f', .55], 8: ['#8a9a58', .55], 9: ['#9aa05a', .5], 10: ['#c9904a', .55], 11: ['#b9a07a', .35], 12: null, 0: null };
const MONTH = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LEAF = ['#4e6e3c', '#58783f', '#5f7f45', '#6f8f4a', '#46633a', '#3f5a33'];
const FLUSH0 = '#a9c46a', FLUSH1 = '#6a8a46';

// ---------------------------------------------------------------- paper
function buildPaper() {
  const SC = 2, w = W * SC, h = H * SC;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  function octave(cw, ch, seed) {
    const s = document.createElement('canvas'); s.width = cw; s.height = ch;
    const sg = s.getContext('2d'), im = sg.createImageData(cw, ch);
    withSeed(seed, () => { for (let i = 0; i < cw * ch; i++) { const v = rnd(0, 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } });
    sg.putImageData(im, 0, 0);
    const b = document.createElement('canvas'); b.width = w; b.height = h;
    const bg = b.getContext('2d'); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high';
    bg.drawImage(s, 0, 0, w, h);
    return bg.getImageData(0, 0, w, h).data;
  }
  const n1 = octave(10, 18, 1), n2 = octave(36, 64, 2), n3 = octave(140, 250, 3);
  const base = hex(PAPERC), im = g.createImageData(w, h), d = im.data, R = mulberry(4);
  for (let y = 0; y < h; y++) {
    const vy = y / h - .5;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, vx = x / w - .5;
      const k = 1 + .035 * (n1[i] / 127.5 - 1) + .02 * (n2[i] / 127.5 - 1) + .012 * (n3[i] / 127.5 - 1) + .022 * (R() - .5);
      const vig = 1 - .055 * Math.pow((vx * vx * 1.7 + vy * vy) * 2.2, 1.4);
      d[i] = base[0] * k * vig; d[i + 1] = base[1] * k * vig; d[i + 2] = base[2] * k * vig; d[i + 3] = 255;
    }
  }
  g.putImageData(im, 0, 0);
  withSeed(5, () => {
    for (let k = 0; k < 3400; k++) {
      const x = rnd(0, w), y = rnd(0, h), P = polar(x, y, rnd(0, 6.283), rnd(10, 48), rnd(-7, 7), 6);
      g.strokeStyle = RNG() < .5 ? `rgba(255,252,244,${rnd(.12, .3)})` : `rgba(150,130,105,${rnd(.05, .12)})`;
      g.lineWidth = rnd(.8, 1.8); g.beginPath();
      P.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke();
    }
  });
  return c;
}
function drawPaper(c) { c.drawImage(PAPER, 0, 0, W, H); }

// ---------------------------------------------------------------- scene build
function wash(pts, col, a, jit = 5, step = 14) {
  const w = mkWash(pts, col, a, jit, 3, step);
  const xs = w.polys.flat().map(p => p[0]), ys = w.polys.flat().map(p => p[1]);
  w.bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  w.seed = Math.floor(rnd(1, 99));
  return w;
}
function rectPts(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
// a hand-drawn edge: a line broken into a few strokes
function edgeLine(x0, y0, x1, y1, w, col, a, parts = 2) {
  const L = [];
  let u = 0;
  for (let k = 0; k < parts; k++) {
    const u1 = k === parts - 1 ? 1 : u + (1 - u) / (parts - k) * rnd(.85, 1.1), g = rnd(.004, .02);
    const ax = lerp(x0, x1, u), ay = lerp(y0, y1, u), bx = lerp(x0, x1, u1 - g), by = lerp(y0, y1, u1 - g);
    L.push(mk(qcurve(ax, ay, bx, by, rnd(-1.5, 1.5), 10), w, col, { prof: 'even', nb: 0, a, rough: .35, rib: 1 }));
    u = u1;
  }
  return L;
}

function buildRoom() {
  withSeed(21, () => {
    S.wall = wash(rectPts(86, 322, 994, 1560), '#e6d9c3', .3, 13, 22);
    S.sky = wash(rectPts(GL.x0 - 6, GL.y0 - 6, GL.x1 + 6, GL.y1 + 4), '#b9c4cc', .55, 4);
    // rooftops outside: two rows
    const roofRow = (yb, ymin, ymax, col, a, seed) => withSeed(seed, () => {
      const P = [[GL.x0 - 6, GL.y1 + 4]];
      let x = GL.x0 - 6;
      while (x < GL.x1 + 6) {
        const wdt = rnd(70, 150), top = rnd(ymin, ymax), type = RNG();
        const X1 = GL.x1 + 6, cx = v => Math.min(v, X1);
        P.push([cx(x), top]);
        if (type < .45 && x + wdt / 2 < X1) P.push([x + wdt / 2, top - rnd(18, 40)]);
        else if (type < .6 && x + wdt * .78 < X1) { P.push([x + wdt * .7, top]); P.push([x + wdt * .7, top - 34]); P.push([x + wdt * .78, top - 34]); P.push([x + wdt * .78, top]); }
        P.push([cx(x + wdt), top]);
        x += wdt;
      }
      P.push([GL.x1 + 6, GL.y1 + 4]);
      return wash(P, col, a, 3, 10);
    });
    S.roofFar = roofRow(GL.y1, 1000, 1035, '#a9b6be', .24, 31);
    S.roofNear = roofRow(GL.y1, 1060, 1100, '#8e9aa4', .32, 32);
    S.litWin = withSeed(33, () => [0, 1, 2, 3, 4, 5].map(i => wash(rectPts(250 + i * 108 + rnd(-10, 10), 1110 + rnd(-6, 6), 266 + i * 108 + rnd(-10, 10), 1126 + rnd(-6, 6)), '#d9a85a', .7, 1.5, 6)));
    // distant tree, left
    S.crown = [wash(ellipsePts(268, 1000, 70, 62, 26, 0, .18, 4), '#7f9a5c', .5, 6), wash(ellipsePts(330, 968, 74, 66, 26, 0, .18, 5), '#7f9a5c', .5, 6), wash(ellipsePts(300, 925, 58, 50, 24, 0, .2, 6), '#7f9a5c', .45, 6)];
    S.crownShade = wash(ellipsePts(306, 1030, 88, 34, 24, 0, .2, 7), '#4f6a45', .3, 6);
    S.farTrunk = mk(qcurve(292, 1150, 289, 1010, 3, 12), 7, INK2, { prof: 'tip', nb: 0, a: .45 });
    S.bare = [];
    for (let k = 0; k < 8; k++) S.bare.push(mk(polar(289, 1060 - k * 6, -Math.PI / 2 + rnd(-1.1, 1.1), rnd(60, 105), rnd(-14, 14), 10), rnd(2, 3.4), INK2, { prof: 'tip', nb: 0, a: .4 }));
    // window frame
    S.frameW = [
      wash(rectPts(172, 332, 908, 362), '#d6ccbd', .5, 3),
      wash(rectPts(172, 332, 202, 1150), '#d6ccbd', .5, 3),
      wash(rectPts(878, 332, 908, 1150), '#d6ccbd', .5, 3),
    ];
    S.frameShadow = wash([[200, 360], [880, 360], [872, 378], [208, 378]], '#8f9aa3', .22, 3);
    S.rail = wash(rectPts(200, 884, 880, 900), '#d0c5b4', .55, 2.5);
    S.frameE = [
      ...edgeLine(172, 332, 908, 332, 2.2, INK2, .55, 3), ...edgeLine(172, 332, 172, 1150, 2.2, INK2, .55, 3),
      ...edgeLine(908, 332, 908, 1150, 2.2, INK2, .55, 3), ...edgeLine(202, 362, 878, 362, 1.8, INK2, .45, 2),
      ...edgeLine(202, 362, 202, 1150, 1.8, INK2, .45, 3), ...edgeLine(878, 362, 878, 1150, 1.8, INK2, .45, 3),
      ...edgeLine(202, 884, 878, 884, 1.6, INK2, .4, 2), ...edgeLine(202, 900, 878, 900, 1.6, INK2, .4, 2),
    ];
    // sill
    S.sillTop = wash([[140, 1150], [940, 1150], [952, 1182], [128, 1182]], '#cdb093', .55, 3);
    S.sillFront = wash(rectPts(128, 1182, 952, 1202), '#a9835f', .62, 2.5);
    S.sillShadow = wash([[136, 1202], [944, 1202], [918, 1256], [162, 1256]], '#aaa29a', .26, 6);
    S.sillE = [...edgeLine(128, 1182, 952, 1182, 2, INK2, .5, 3), ...edgeLine(128, 1202, 952, 1202, 2, INK2, .45, 2)];
    S.grain = [];
    for (let k = 0; k < 6; k++) { const y = 1157 + k * 4.2, x0 = rnd(150, 300), x1 = rnd(720, 920); S.grain.push(mk(qcurve(x0, y, x1, y + rnd(-1, 1), rnd(-1, 1), 16), 1.6, '#9c7b5c', { prof: 'even', nb: 0, a: .28, rough: .5, rib: 1 })); }
    // pot
    S.potBody = wash([[442, 1024], [638, 1024], [614, 1149], [466, 1149]], '#c07850', .62, 2.5);
    S.potShade = wash([[580, 1026], [638, 1026], [614, 1148], [574, 1148]], '#9a5a3a', .34, 2.5);
    S.potRim = wash([[434, 998], [646, 998], [644, 1026], [436, 1026]], '#c98458', .6, 2);
    S.potRimShadow = wash([[442, 1025], [638, 1025], [636, 1036], [444, 1036]], '#8a4f33', .3, 1.5);
    S.soil = wash(ellipsePts(540, 1003, 98, 8, 26, 0, .05, 2), '#4a3a2c', .72, 1.5);
    S.potE = [...edgeLine(434, 998, 646, 998, 2, INK2, .55, 2), ...edgeLine(436, 1026, 466, 1149, 2.2, INK2, .55, 2), ...edgeLine(644, 1026, 614, 1149, 2.4, INK, .5, 2),
      ...edgeLine(466, 1149, 614, 1149, 2, INK2, .45, 1), ...edgeLine(436, 1026, 644, 1026, 1.6, INK2, .45, 2)];
    S.potTex = [];
    for (let k = 0; k < 5; k++) { const y = 1045 + k * 21; S.potTex.push(mk(qcurve(452 + k * 2.5, y, 600 - k * 2, y + rnd(-2, 2), rnd(-2, 2), 12), 7, '#b06a44', { prof: 'brush', nb: 3, a: .26 })); }
    // tea cup (night)
    S.saucer = wash(ellipsePts(330, 1166, 74, 12, 28, 0, .03, 3), '#c3cbd1', .42, 1.5);
    S.cup = wash([[288, 1092], [372, 1092], [366, 1140], [352, 1160], [308, 1160], [294, 1140]], '#d9dddd', .28, 1.5);
    S.cupShade = wash([[340, 1094], [372, 1092], [366, 1140], [352, 1160], [334, 1160]], '#9fb4c4', .36, 1.5);
    S.tea = wash(ellipsePts(330, 1094, 41, 7.5, 24, 0, .02, 5), '#c98a3c', .66, 1);
    S.slice = wash(ellipsePts(342, 1093, 16, 4.6, 20, 0, .02, 6), LEMON, .8, .6);
    S.cupE = [...edgeLine(288, 1092, 294, 1140, 1.8, INK2, .55, 1), mk(qcurve(294, 1140, 352, 1160, -8, 14), 1.8, INK2, { prof: 'even', nb: 0, a: .5, rib: 1 }),
      mk(qcurve(352, 1160, 372, 1092, -10, 14), 2, INK, { prof: 'even', nb: 0, a: .5, rib: 1 }),
      mk(qcurve(371, 1104, 372, 1136, -22, 14), 4.5, INK2, { prof: 'even', nb: 0, a: .55, rib: 1 }),
      mk(qcurve(288, 1091, 372, 1091, -4, 16), 1.6, INK2, { prof: 'even', nb: 0, a: .45, rib: 1 })];
  });
}

// the tree: trunk → branches → twigs → leaves, built once
function buildTree() {
  withSeed(11, () => {
    const T = { wood: [], edge: [], leaves: [], ribs: [], flush: [], spots: [] };
    const trunk = mk(qcurve(538, 1004, 546, 744, 7, 24), 17, '#6e5a45', { prof: 'trunk', nb: 5, a: .9 });
    T.wood.push({ s: trunk, d: 0 });
    T.edge.push({ s: edgeOf(trunk, 1, 2.6, INK, .5), d: 0 });
    function branch(x, y, ang, len, w, depth) {
      const pts = polar(x, y, ang, len, rnd(-.13, .13) * len, Math.max(8, Math.round(len / 10)));
      const s = mk(pts, w, depth === 0 ? '#6e5a45' : depth === 1 ? '#76644c' : '#717650', { prof: 'tip', nb: w >= 6 ? 4 : 0, a: .9, rough: .18 });
      T.wood.push({ s, d: depth + 1 });
      if (w > 4) { const e = edgeOf(s, 1, 1.5, INK, .38); if (e) T.edge.push({ s: e, d: depth + 1 }); }
      const end = pts[pts.length - 1];
      if (depth < 2) {
        for (let k = 0; k < 2; k++) {
          const i = Math.floor(rnd(.42, .78) * (pts.length - 1));
          branch(pts[i][0], pts[i][1], ang + (k ? 1 : -1) * rnd(.42, .78), len * rnd(.42, .58), w * .6, depth + 1);
        }
        branch(end[0], end[1], ang + rnd(-.22, .22), len * rnd(.38, .5), w * .62, depth + 1);
      }
      if (depth >= 1) {
        const step = depth === 1 ? 22 : 15;
        let side = RNG() < .5 ? 1 : -1;
        for (let u = .28; u <= 1.0001; u += step / len) {
          const i = Math.min(pts.length - 1, Math.floor(u * (pts.length - 1))), [px, py] = pts[i];
          const la = ang + side * rnd(.55, 1.05);
          const droop = .25 * Math.cos(la);                     // leaves tip slightly downward
          const l = rnd(36, 50) * (depth === 2 ? .92 : 1), lw = rnd(15, 20);
          const lp = polar(px, py, la + droop * (Math.sin(la) < 0 ? 1 : .5) * side * .4, l, side * rnd(1.5, 4.5), 10);
          T.leaves.push(mk(lp, lw, mixc(LEAF[Math.floor(rnd(0, LEAF.length))], RNG() < .5 ? '#86a35a' : '#34502e', rnd(0, .3)), { prof: 'leaf', nb: 3, a: .8, rough: .16, rib: .7, bm: .55 }));
          if (RNG() < .45) T.ribs.push(mk(lp.slice(1, 8), 1.1, '#34492a', { prof: 'even', nb: 0, a: .32, rough: .3, rib: 1 }));
          side = -side;
        }
        T.spots.push({ x: end[0], y: end[1], ang, depth });
      }
    }
    [[-128, 178, 750], [-103, 214, 742], [-76, 206, 744], [-47, 182, 764]].forEach(([a, l, y]) => branch(544, y, a * Math.PI / 180, l, 8.5, 0));
    // the spring flush: new light-green leaves at the tips
    T.spots.forEach((sp, i) => {
      if (sp.depth !== 2 || i % 3 === 2) return;
      for (let k = 0; k < 2; k++) {
        const la = sp.ang + (k ? 1 : -1) * rnd(.25, .6);
        T.flush.push(mk(polar(sp.x, sp.y, la, rnd(24, 34), rnd(-3, 3), 8), rnd(11, 15), FLUSH0, { prof: 'leaf', nb: 3, a: .8, rough: .16, rib: .72, bm: .55 }));
      }
    });
    // leaves paint in roughly bottom-up, inner-out
    T.leaves.forEach(s => s.k = -s.y * .7 + Math.abs(s.x - 545) * .3 + rnd(0, 60));
    const order = T.leaves.map((s, i) => [s.k, i]).sort((a, b) => a[0] - b[0]);
    order.forEach(([, i], r) => T.leaves[i].rank = r / T.leaves.length);
    S.T = T;
  });
  // flower spots: 23, spread out; 9 of them set fruit; one is kept
  const T = S.T, cand = T.spots.filter(s => s.y < 820).map(s => ({ ...s }));
  cand.sort((a, b) => hash1(a.x * 3.1 + a.y) - hash1(b.x * 3.1 + b.y));
  const fl = [];
  for (const c of cand) if (fl.length < 23 && fl.every(f => Math.hypot(f.x - c.x, f.y - c.y) > 30)) fl.push(c);
  while (fl.length < 23) { const c = cand[fl.length % cand.length]; fl.push({ x: c.x + 14, y: c.y + 10, ang: c.ang }); }
  // the kept one: lower right, hanging into open sky
  let kept = 0, best = -1e9;
  fl.forEach((f, i) => { const sc = (f.x - 545) * .6 + (f.y - 600) * 1.0 - (f.x > 800 ? 500 : 0); if (sc > best) { best = sc; kept = i; } });
  const byDist = fl.map((f, i) => [Math.hypot(f.x - fl[kept].x, f.y - fl[kept].y), i]).sort((a, b) => a[0] - b[0]);
  const fruit = byDist.slice(0, 9).map(x => x[1]);      // a cluster around the kept one, so the push-in frames them
  S.flowers = fl.map((f, i) => withSeed(100 + i, () => ({ ...f, rot: rnd(0, 6.28), sz: rnd(.85, 1.15), budT: TL.BUDS[0] + i * BEAT / 4, open: TL.BURST + i * .035 })));
  S.fruit = fruit.map((fi, k) => ({ fi, kept: fi === kept, k }));
  S.keptIdx = kept;
  S.K = [fl[kept].x, fl[kept].y];
  // the eight that drop, in order of landing
  const drops = S.fruit.filter(f => !f.kept);
  drops.forEach((f, k) => {
    const fl0 = S.flowers[f.fi], land = TL.DROPS[k];
    const onSoil = fl0.x > 452 && fl0.x < 628;
    f.landY = onSoil ? 996 : 1162;
    f.fall = Math.sqrt(2 * (f.landY - fl0.y) / 2600);
    f.t0 = land - f.fall; f.land = land;
    f.dx = withSeed(200 + k, () => rnd(-26, 26));
  });
  // new bud for the end: a high tip on the left
  let nb = 0, nbest = 1e9;
  T.spots.forEach((s, i) => { const sc = s.y + Math.abs(s.x - 430) * .8; if (s.depth === 2 && sc < nbest && s.y > 430) { nbest = sc; nb = i; } });
  S.newBud = T.spots[nb];
}

// ---------------------------------------------------------------- camera
let ZT, CT;
function buildCamera() {
  const K = S.K, KL = lemonCenter(LR), FC = S.fruit.map(f => S.flowers[f.fi]).reduce((a, f) => [a[0] + f.x / 9, a[1] + f.y / 9], [0, 0]);
  S.FC = FC;
  ZT = track([[0, 7], [.9, 7], [5.6, 1], [19.3, 1], [20.5, 2.4], [23.2, 2.4], [29.6, 2.45], [31.2, 3.0], [45.6, 3.1], [49.2, 1.35], [51.2, 1], [60, 1], [69.8, 1.6], [72.3, 1]]);
  CT = track([[0, KL], [.9, KL], [5.6, [540, 960]], [19.3, [540, 960]], [20.5, [540, 1080]], [23.2, [540, 585]], [29.6, [548, 580]], [31.2, [670, 610]], [45.6, [672, 618]], [49.2, [540, 820]], [51.2, [540, 960]], [60, [540, 960]], [69.8, KL], [72.3, [540, 960]]]);
}
function camAt(t) { const z = ZT(t), c = CT(t); return { z, cx: c[0], cy: c[1] }; }
function setCam(c, m) { c.setTransform(m.z, 0, 0, m.z, W / 2 - m.cx * m.z, H / 2 - m.cy * m.z); }
function scr(m, x, y) { return [(x - m.cx) * m.z + W / 2, (y - m.cy) * m.z + H / 2]; }

// ---------------------------------------------------------------- state helpers
function monthAt(t) {
  if (t < TL.JAN) return { cur: 12, prev: null, p: 1, t0: -9 };
  let k = 0;
  for (let i = 0; i < TL.MONTHS.length; i++) if (t >= TL.MONTHS[i][0]) k = i;
  const [t0, cur] = TL.MONTHS[k];
  return { cur, prev: k ? TL.MONTHS[k - 1][1] : null, p: seg(t, t0, t0 + 1.1), t0 };
}
function keptR(t) {
  const G = TL.GROW;
  if (t < G[0][0]) return 9;
  return track(G.map(([a, r]) => [a, r]), ss)(t);
}
function keptCol(t) {
  const cols = ['#6f8f3c', '#93a03e', '#bdb440', '#dcc040', LEMON];
  let c = hex(cols[0]);
  TL.GLAZE.forEach((g, i) => { c = mixc(c, cols[i + 1], ss(seg(t, g, g + .9))); });
  return c;
}
function lemonCenter(r, at = S.K) { return [at[0] + 2, at[1] + 5 + r * 1.02]; }

// ---------------------------------------------------------------- painting with reveal
// M: {mode: 'hook'|'year'|'night', t, R, K}
function W_(c, M, w, t0, t1, dir, col = null, am = 1) {
  if (M.mode === 'hook') {
    if (M.R <= 0) return;
    if (M.R > 2600) { drawWash(c, w, am, col); return; }
    c.save(); blobPath(c, M.K[0], M.K[1], M.R, 3, .07, 160); c.clip(); drawWash(c, w, am * .45, col); c.restore();
    c.save(); blobPath(c, M.K[0], M.K[1], M.R * .9, 4, .08, 160); c.clip(); drawWash(c, w, am * .55, col); c.restore(); return;
  }
  const p = M.mode === 'night' ? 1 : seg(M.t, t0, t1);
  if (p <= 0) return;
  if (p >= 1) { drawWash(c, w, am, col); return; }
  c.save(); wipePath(c, w.bb[0], w.bb[1], w.bb[2], w.bb[3], ss(p), dir, w.seed); c.clip(); drawWash(c, w, am, col); c.restore();
}
function S_(c, M, s, t0, t1, col = null, am = 1) {
  if (!s) return;
  let p;
  if (M.mode === 'hook') { const d = Math.hypot(s.x - M.K[0], s.y - M.K[1]); p = clamp((M.R - d) / 70); }
  else if (M.mode === 'night') p = 1;
  else p = seg(M.t, t0, t1);
  if (p > 0) drawS(c, s, ss(p), col, am);
}

// ---------------------------------------------------------------- the room
function drawOutside(c, M, month, night) {
  W_(c, M, S.sky, 8.2, 9.3, 'lr', SKY[night ? 0 : month]);
  W_(c, M, S.roofFar, 8.8, 9.5, 'lr', night ? '#66737f' : null);
  W_(c, M, S.roofNear, 8.9, 9.6, 'lr', night ? '#505c68' : null);
  if (night) S.litWin.forEach(w => drawWash(c, w, 1));
  const cr = CROWN[night ? 0 : month];
  if (cr) { S.crown.forEach((w, i) => W_(c, M, w, 9.2 + i * .1, 9.8 + i * .1, 'bu', cr[0], cr[1] / .5)); W_(c, M, S.crownShade, 9.5, 9.9, 'bu', shade(cr[0], .7), cr[1] / .5); }
  S_(c, M, S.farTrunk, 9.1, 9.6);
  if (!cr || month === 3) S.bare.forEach((s, i) => S_(c, M, s, 9.2 + i * .06, 9.7 + i * .06, null, month === 3 ? .6 : 1));
}
function drawRoom(c, M) {
  const t = M.t, night = M.mode === 'night';
  const mo = M.mode === 'hook' ? { cur: 12, prev: null, p: 1 } : monthAt(t);
  W_(c, M, S.wall, 7.6, 8.5, 'td');
  // the light outside; on a month change the new wash wipes across the glass
  if (mo.prev != null && mo.p < 1 && !night) {
    drawOutside(c, M, mo.prev, false);
    c.save();
    c.beginPath(); c.rect(GL.x0 - 8, GL.y0 - 8, GL.x1 - GL.x0 + 16, GL.y1 - GL.y0 + 12); c.clip();
    wipePath(c, GL.x0, GL.y0, GL.x1, GL.y1, ss(mo.p), 'lr', mo.cur); c.clip();
    c.globalCompositeOperation = 'source-over'; drawPaper(c); c.globalCompositeOperation = 'multiply';
    drawWash(c, S.wall, 1);
    drawOutside(c, M, mo.cur, false);
    c.restore();
  } else drawOutside(c, M, mo.cur, night);
  if (!night && t > TL.RAIN[0] - .2 && t < TL.RAIN[1] + 1.2) drawRain(c, t);
  // frame
  S.frameW.forEach((w, i) => W_(c, M, w, 7.8 + i * .12, 8.7 + i * .12, i ? 'td' : 'lr'));
  W_(c, M, S.frameShadow, 8.6, 9.0, 'lr');
  W_(c, M, S.rail, 9.0, 9.5, 'lr');
  S.frameE.forEach((s, i) => S_(c, M, s, 7.8 + i * .07, 8.5 + i * .07));
  // sill
  W_(c, M, S.sillShadow, 9.8, 10.3, 'td');
  W_(c, M, S.sillTop, 9.3, 10.0, 'lr');
  W_(c, M, S.sillFront, 9.4, 10.1, 'lr');
  S.sillE.forEach((s, i) => S_(c, M, s, 9.5 + i * .1, 10.1 + i * .1));
  S.grain.forEach((s, i) => S_(c, M, s, 9.6 + i * .08, 10.2 + i * .08));
  // pot
  W_(c, M, S.potBody, 10.0, 10.9, 'bu');
  W_(c, M, S.potShade, 10.4, 10.9, 'bu');
  S.potTex.forEach((s, i) => S_(c, M, s, 10.3 + i * .08, 10.8 + i * .08));
  W_(c, M, S.potRim, 10.5, 11.0, 'lr');
  W_(c, M, S.potRimShadow, 10.7, 11.0, 'lr');
  W_(c, M, S.soil, 10.9, 11.3, 'lr');
  S.potE.forEach((s, i) => S_(c, M, s, 10.6 + i * .08, 11.1 + i * .08));
  if (night) drawCup(c, t);
  drawTree(c, M);
  drawBlossomFruit(c, M);
}

function drawTree(c, M) {
  const T = S.T, t = M.t;
  T.wood.forEach(({ s, d }) => { const t0 = [11.0, 11.3, 11.6, 11.9][d]; S_(c, M, s, t0, t0 + .6); });
  T.edge.forEach(({ s, d }) => { const t0 = [11.15, 11.45, 11.75, 12.05][d]; S_(c, M, s, t0, t0 + .5); });
  T.leaves.forEach(s => { const t0 = 12.1 + s.rank * 1.2; S_(c, M, s, t0, t0 + .35); });
  T.ribs.forEach((s, i) => { const t0 = 12.4 + (i / T.ribs.length) * 1.1; S_(c, M, s, t0, t0 + .3); });
  // the spring flush: painted in March–April, darkens into mature leaves by late summer
  const fc = mixc(FLUSH0, FLUSH1, ss(seg(t, 30, 62)));
  T.flush.forEach((s, i) => {
    if (M.mode === 'hook' || M.mode === 'night') { S_(c, M, s, 0, 0, mixc(FLUSH1, LEAF[2], .5)); return; }
    const t0 = 13.8 + i / T.flush.length * 9.5;
    const p = seg(t, t0, t0 + .5);
    if (p > 0) drawS(c, s, ss(p), fc);
  });
}

// ---------------------------------------------------------------- blossom, fruitlets, the lemon
function paperClip(c, pathFn, a = 1) {
  c.save(); pathFn(); c.clip();
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
  const m = c.getTransform(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(PAPER, 0, 0, W, H); c.setTransform(m);
  c.restore();
}
function drawBud(c, f, p) {
  if (p <= 0) return;
  const r = 4.2 * f.sz * eo(p), a = f.ang;
  const bx = f.x + Math.cos(a) * r, by = f.y + Math.sin(a) * r;
  paperClip(c, () => { c.beginPath(); c.ellipse(bx, by, r * 1.25, r * .85, a, 0, 6.283); }, .95);
  c.fillStyle = rgba('#b48ab4', .42 * p); c.beginPath(); c.ellipse(bx + Math.cos(a) * r * .55, by + Math.sin(a) * r * .55, r * .6, r * .5, a, 0, 6.283); c.fill();
  c.fillStyle = rgba('#6f8f4a', .7 * p); c.beginPath(); c.ellipse(f.x, f.y, r * .55, r * .45, a, 0, 6.283); c.fill();
  c.strokeStyle = rgba(INK2, .4 * p); c.lineWidth = .9; c.beginPath(); c.ellipse(bx, by, r * 1.25, r * .85, a, 0, 6.283); c.stroke();
}
function petalPath(c, f, k, sc, dy = 0, dx = 0, spin = 0) {
  const a = f.rot + k * 1.2566 + spin, L = 13 * f.sz * sc, wd = 8.5 * f.sz * sc;
  const cx = f.x + dx + Math.cos(a) * L * .55, cy = f.y + dy + Math.sin(a) * L * .55;
  c.beginPath(); c.ellipse(cx, cy, L * .55, wd * .5, a, 0, 6.283);
}
function drawFlower(c, f, p, fall = 0) {
  if (p <= 0) return;
  const sc = .35 + .65 * eo(p), am = 1 - ss(seg(fall, .55, 1));
  if (am <= 0) return;
  for (let k = 0; k < 5; k++) {
    const dy = fall * (40 + k * 14) * f.sz, dx = fall * Math.sin(k * 2.1 + f.rot) * 16, spin = fall * (k % 2 ? .8 : -.8);
    paperClip(c, () => petalPath(c, f, k, sc, dy, dx, spin), .96 * am);
    petalPath(c, f, k, sc, dy, dx, spin);
    c.fillStyle = rgba('#e7d9e3', .3 * am); c.fill();
    c.strokeStyle = rgba('#8c6f86', .38 * am); c.lineWidth = 1; c.stroke();
  }
  if (fall < .2) {
    const ca = 1 - fall * 5;
    c.fillStyle = rgba('#c9c46a', .85 * ca); c.beginPath(); c.arc(f.x, f.y, 3.2 * sc, 0, 6.283); c.fill();
    c.fillStyle = rgba('#c9a23a', .7 * ca);
    for (let k = 0; k < 6; k++) { const a = f.rot + k; c.beginPath(); c.arc(f.x + Math.cos(a) * 5 * sc, f.y + Math.sin(a) * 5 * sc, 1.1, 0, 6.283); c.fill(); }
  }
}
function drawFruitlet(c, x, y, r, col = '#9fb24a', am = 1) {
  if (r <= .3 || am <= 0) return;
  c.fillStyle = rgba(col, .62 * am); blobPath(c, x, y, r, x * .1, .06, 18); c.fill();
  c.fillStyle = rgba(shade(col, .78), .4 * am); c.beginPath(); c.arc(x + r * .25, y + r * .25, r * .7, -.6, 2.2); c.fill();
  c.strokeStyle = rgba(INK, .4 * am); c.lineWidth = Math.max(.8, r * .14); c.beginPath(); c.arc(x, y, r, -.4, 2.4); c.stroke();
  paperClip(c, () => { c.beginPath(); c.ellipse(x - r * .32, y - r * .3, r * .26, r * .18, -.6, 0, 6.283); }, .75 * am);
  c.fillStyle = rgba('#4a5a2a', .6 * am);
  for (let k = 0; k < 4; k++) { const a = -1.57 + (k - 1.5) * .5; c.beginPath(); c.ellipse(x + Math.cos(a) * r * .85, y + Math.sin(a) * r * .85, r * .28, r * .12, a, 0, 6.283); c.fill(); }
}
// the lemon: a wash with a pooled edge, a shadow glaze, unpainted highlight, a tiny nipple, a stem
function lemonPath(c, x, y, r, wob = .03, seed = 7) {
  const n = 40, rot = .14;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    let rx = r * .8, ry = r;
    const tipB = Math.exp(-Math.pow((a - Math.PI / 2) / .22, 2)) * .2, tipT = Math.exp(-Math.pow((a - 3 * Math.PI / 2) / .3, 2)) * .08;
    const k = (1 + tipB + tipT) * (1 + wob * (2 * vnoise(i * .6 + seed, seed) - 1));
    const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
    const X = x + px * Math.cos(rot) - py * Math.sin(rot), Y = y + px * Math.sin(rot) + py * Math.cos(rot);
    i ? c.lineTo(X, Y) : c.moveTo(X, Y);
  }
  c.closePath();
}
function drawLemon(c, at, r, col, o = {}) {
  const [x, y] = lemonCenter(r, at), am = o.am ?? 1, bloom = o.bloom ?? 1, wob = o.wob ?? .03;
  // stem
  c.strokeStyle = rgba(INK2, .75 * am * ss(seg(bloom, .6, 1))); c.lineWidth = Math.max(1.4, r * .08); c.lineCap = 'round';
  c.beginPath(); c.moveTo(at[0], at[1]); c.quadraticCurveTo(at[0] + 3, at[1] + 4, x + 1, y - r * .95); c.stroke();
  const rr = r * (o.grow ?? 1);
  paperClip(c, () => lemonPath(c, x, y, rr * 1.01, wob, 7), .94 * am);          // the lemon sits on unpainted paper, not over the sky wash
  for (let k = 0; k < 3; k++) { c.fillStyle = rgba(col, .3 * am); lemonPath(c, x, y, rr * (1 - k * .03), wob + k * .01, 7 + k * 3); c.fill(); }
  c.strokeStyle = rgba(shade(col, .72), .45 * am); c.lineWidth = Math.max(1, rr * .05); lemonPath(c, x, y, rr, wob, 7); c.stroke();
  const sh = am * ss(seg(bloom, .5, 1));
  if (sh > 0) {
    c.save(); lemonPath(c, x, y, rr, wob, 7); c.clip();
    c.fillStyle = rgba(shade(mixc(col, '#c08a3a', .35), .8), .42 * sh); c.beginPath(); c.ellipse(x + rr * .42, y + rr * .3, rr * .72, rr * .95, .3, 0, 6.283); c.fill();
    c.fillStyle = rgba(shade(col, .7), .18 * sh);
    withSeed(9, () => { for (let k = 0; k < 26; k++) { const a = rnd(0, 6.28), d = rnd(.2, .85) * rr; c.beginPath(); c.arc(x + Math.cos(a) * d * .8, y + Math.sin(a) * d, rnd(.6, 1.4) * rr / 30, 0, 6.283); c.fill(); } });
    c.restore();
    paperClip(c, () => { c.beginPath(); c.ellipse(x - rr * .3, y - rr * .38, rr * .2, rr * .13, -.7, 0, 6.283); }, .8 * sh);
    c.strokeStyle = rgba(INK, .4 * sh); c.lineWidth = Math.max(1, rr * .06); c.beginPath(); c.arc(x, y + 1, rr * .92, -.3, 1.9); c.stroke();
  }
}
function drawBlossomFruit(c, M) {
  const t = M.t;
  if (M.mode === 'hook') { drawLemon(c, S.K, LR, LEMON, { bloom: seg(t, .05, 1.5), grow: .25 + .75 * eo(seg(t, .05, 1.0)), wob: .03 + .2 * (1 - eo(seg(t, .05, 1.3))) }); return; }
  if (M.mode === 'night') {
    const p = seg(t, TL.NEWBUD, TL.NEWBUD + .8);
    if (p > 0) drawBud(c, { ...S.newBud, sz: 1.6 }, p);
    return;
  }
  const fruitSet = new Set(S.fruit.map(f => f.fi));
  S.flowers.forEach((f, i) => {
    const pb = seg(t, f.budT, f.budT + .35), po = seg(t, f.open, f.open + .5);
    if (po < .3) drawBud(c, f, pb * (1 - po / .3));
    if (t < TL.PETALS[0] + 3) drawFlower(c, f, po, seg(t, TL.PETALS[0] + i * .08, TL.PETALS[0] + i * .08 + 1.0));
  });
  S.fruit.forEach(fr => {
    const f = S.flowers[fr.fi], t0 = TL.FRUITLETS[0] + fr.k * .2, g = eo(seg(t, t0, t0 + .7));
    if (g <= 0) return;
    if (fr.kept) {
      const r = keptR(t);
      if (r < 10) drawFruitlet(c, f.x, f.y + 3, r * g);
      else drawLemon(c, [f.x, f.y], r, keptCol(t));
      return;
    }
    if (t < fr.t0) {
      const wob = t > fr.t0 - .3 ? Math.sin((t - fr.t0) * 60) * 1.2 * seg(t, fr.t0 - .3, fr.t0) : 0;
      drawFruitlet(c, f.x + wob, f.y + 3, 9 * g);
    } else if (t < fr.land) {
      const u = t - fr.t0, y = f.y + 3 + .5 * 2600 * u * u, x = f.x + fr.dx * (u / fr.fall);
      drawFruitlet(c, x, Math.min(y, fr.landY - 8), 9);
    } else {
      // landed: a little bounce, then it washes back into the paper
      const u = t - fr.land, bounce = Math.max(0, Math.sin(u * 9) * 9 * Math.exp(-u * 7));
      const x = f.x + fr.dx + Math.min(u, .4) * 14 * Math.sign(fr.dx || 1), y = fr.landY - 8 - bounce;
      const er = seg(t, fr.land + .5, fr.land + 1.5);
      if (er < 1) {
        drawFruitlet(c, x, y, 9, '#9fb24a', 1 - er * .3);
        if (er > 0) paperClip(c, () => blobPath(c, x, y, 3 + 12 * eo(er), fr.k + 2, .25, 16), .92);
      }
    }
  });
}

// ---------------------------------------------------------------- rain (July) and steam (the tea)
function drawRain(c, t) {
  const amp = ss(seg(t, TL.RAIN[0], TL.RAIN[0] + .8)) * (1 - ss(seg(t, TL.RAIN[1] - .6, TL.RAIN[1] + .9)));
  if (amp <= 0) return;
  c.save(); c.beginPath(); c.rect(GL.x0, GL.y0, GL.x1 - GL.x0, GL.y1 - GL.y0); c.clip();
  c.fillStyle = rgba('#6f8698', .16 * amp); c.fillRect(GL.x0, GL.y0, GL.x1 - GL.x0, GL.y1 - GL.y0);
  c.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const sp = 1.4 + hash1(i * 3.3) * 1.6, x = GL.x0 + hash1(i * 7.7) * (GL.x1 - GL.x0), ph = hash1(i * 1.9);
    const y = GL.y0 - 80 + ((t * (GL.y1 - GL.y0 + 160) / sp + ph * 900) % (GL.y1 - GL.y0 + 160));
    const l = 26 + hash1(i * 5.1) * 44;
    c.strokeStyle = rgba('#5f7486', (.22 + .25 * hash1(i * 2.2)) * amp); c.lineWidth = 1.2 + hash1(i) * 1.4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - l * .12, y + l); c.stroke();
  }
  for (let i = 0; i < 46; i++) {
    const appear = TL.RAIN[0] + hash1(i * 4.4) * 3.5;
    if (t < appear) continue;
    const x = GL.x0 + 10 + hash1(i * 9.1) * (GL.x1 - GL.x0 - 20), y = GL.y0 + 10 + hash1(i * 6.3) * (GL.y1 - GL.y0 - 20), r = 2 + hash1(i * 8.8) * 3.2;
    const a = amp * ss(seg(t, appear, appear + .3));
    c.fillStyle = rgba('#5f7486', .32 * a); c.beginPath(); c.ellipse(x, y, r * .8, r, 0, 0, 6.283); c.fill();
    c.globalCompositeOperation = 'source-over'; c.fillStyle = rgba(PAPERC, .55 * a); c.beginPath(); c.arc(x - r * .25, y - r * .3, r * .3, 0, 6.283); c.fill();
    c.globalCompositeOperation = 'multiply';
  }
  c.restore();
}
function drawCup(c, t) {
  const p = seg(t, TL.CUP, TL.CUP + .9);
  if (p <= 0) return;
  c.save(); wipePath(c, 240, 1080, 420, 1180, ss(p), 'lr', 5); c.clip();
  paperClip(c, () => { pathPoly(c, S.cup.polys[0]); }, .92);
  [S.saucer, S.cup, S.cupShade, S.tea, S.slice].forEach(w => drawWash(c, w, 1));
  c.restore();
  S.cupE.forEach((s, i) => { const q = seg(t, TL.CUP + .2 + i * .1, TL.CUP + .6 + i * .1); if (q > 0) drawS(c, s, ss(q)); });
  // the slice: segment lines left unpainted
  if (p > .6) { c.save(); c.globalCompositeOperation = "source-over"; c.strokeStyle = rgba(PAPERC, .75); c.lineWidth = 1.1; c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * 1.047; c.moveTo(342, 1093); c.lineTo(342 + Math.cos(a) * 13, 1093 + Math.sin(a) * 3.8); } c.stroke(); c.restore(); }
  // steam: light, drawn as unpainted paper over the dark glass
  const sa = ss(seg(t, TL.CUP + .7, TL.CUP + 2.2)) * (1 - ss(seg(t, TL.PAGE, TL.PAGE + .6)));
  if (sa > 0) {
    c.save(); c.globalCompositeOperation = 'source-over'; c.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      for (let j = 0; j <= 30; j++) {
        const u = j / 30, y = 1088 - u * 190, x = 326 + k * 9 + Math.sin(u * 7 + t * 1.3 + k * 2) * (5 + u * 20) + Math.sin(t * .7 + k) * 6 * u;
        j ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.strokeStyle = rgba(PAPERC, .22 * sa * (1 - k * .2)); c.lineWidth = 7 - k * 1.5; c.stroke();
    }
    c.restore();
  }
}

// ---------------------------------------------------------------- annotation layer (screen space)
function halo(c, fn, blur = 12) { c.save(); c.shadowColor = PAPERC; c.shadowBlur = blur; fn(); fn(); c.restore(); }
function hand(c, txt, x, y, p, size = 46, a = 1, col = INK) {
  if (p <= 0 || a <= 0) return;
  c.save(); c.font = `500 ${size}px Caveat`; c.textBaseline = 'alphabetic';
  const w = c.measureText(txt).width;
  c.beginPath(); c.rect(x - 20, y - size * 1.2, 40 + w * p, size * 1.8); c.clip();
  halo(c, () => { c.fillStyle = rgba(col, .88 * a); c.fillText(txt, x, y); });
  c.restore();
  return w;
}
function leader(c, x0, y0, x1, y1, p, a = 1) {
  if (p <= 0) return;
  const P = qcurve(x0, y0, x1, y1, Math.hypot(x1 - x0, y1 - y0) * .12, 24), n = Math.max(1, Math.round(p * 24));
  c.save(); c.strokeStyle = rgba(INK2, .8 * a); c.lineWidth = 1.8; c.lineCap = 'round';
  c.beginPath(); for (let i = 0; i <= n; i++) i ? c.lineTo(P[i][0], P[i][1]) : c.moveTo(P[i][0], P[i][1]); c.stroke();
  if (p >= 1) { c.fillStyle = rgba(INK2, .8 * a); c.beginPath(); c.arc(x1, y1, 2.6, 0, 6.283); c.fill(); }
  c.restore();
}
function mono(c, txt, x, y, a, size = 26, align = 'left') {
  if (a <= 0) return;
  c.save(); c.font = `400 ${size}px "IBM Plex Mono"`; c.letterSpacing = '4px'; c.textAlign = align;
  halo(c, () => { c.fillStyle = rgba(INK, .82 * a); c.fillText(txt, x, y); }, 14); halo(c, () => { c.fillStyle = rgba(INK, .5 * a); c.fillText(txt, x, y); }, 6);
  c.restore();
}
// a note: hand-written label with a pen leader to a world point
function note(c, cam, t, t0, t1, txt, world, off, size = 46) {
  if (t < t0 || t > t1 + .5) return;
  const a = 1 - ss(seg(t, t1, t1 + .5)), [tx, ty] = scr(cam, world[0], world[1]);
  const lx = clamp(tx + off[0], 70, W - 360), ly = clamp(ty + off[1], 420, 1340);
  c.save(); c.font = `500 ${size}px Caveat`; const w = c.measureText(txt).width; c.restore();
  const pw = seg(t, t0, t0 + .7);
  hand(c, txt, lx, ly, pw, size, a);
  const ax = off[0] < 0 ? lx + w + 10 : lx - 10, ay = ly - size * .3;
  const dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy) || 1, gap = 18;
  leader(c, ax, ay, tx - dx / d * gap, ty - dy / d * gap, seg(t, t0 + .45, t0 + 1.1), a);
}
function monthHeader(c, t) {
  if (t < TL.JAN || t > TL.PAGE + .4) return;
  const mo = monthAt(t), a0 = 1 - ss(seg(t, TL.PAGE, TL.PAGE + .4));
  const draw = (m, p, a) => {
    if (p <= 0 || a <= 0) return;
    c.save(); c.beginPath(); c.rect(70, 150, 40 + 520 * p, 160); c.clip();
    mono(c, String(m).padStart(2, '0') + ' / 12', 90, 205, a);
    c.font = 'italic 500 66px "Cormorant Garamond"';
    halo(c, () => { c.fillStyle = rgba(INK, .86 * a); c.fillText(MONTH[m], 86, 274); }, 12);
    c.restore();
  };
  if (mo.prev != null && mo.p < 1) draw(mo.prev, 1, (1 - ss(seg(mo.p, 0, .45))) * a0);
  draw(mo.cur, ss(seg(t, mo.t0 + .3, mo.t0 + 1.0)) || (mo.prev == null ? ss(seg(t, TL.JAN + .3, TL.JAN + 1.0)) : 0), a0);
}
function subtitles(c, t) {
  for (const v of TL.VO) {
    if (t < v.s0 || t > v.s1) continue;
    const a = ss(seg(t, v.s0, v.s0 + .25)) * (1 - ss(seg(t, v.s1 - .35, v.s1)));
    const L = v.sub.split('\n'), y0 = L.length > 1 ? 1430 : 1458;
    c.save(); c.font = 'italic 500 46px "Cormorant Garamond"'; c.textAlign = 'center';
    halo(c, () => { c.fillStyle = rgba(INK, .78 * a); L.forEach((s, i) => c.fillText(s, W / 2, y0 + i * 54)); }, 18);
    c.restore();
  }
}
// a small patch of unpainted paper behind a measured label, so it reads over anything
function labelPatch(c, txt, x, y, a) {
  c.save(); c.font = '400 26px "IBM Plex Mono"'; c.letterSpacing = '4px';
  const w = c.measureText(txt).width; c.restore();
  c.save(); c.globalAlpha = .82 * a;
  c.beginPath(); const x0 = x - 16, x1 = x + w + 12, y0 = y - 30, y1 = y + 12, n = 14;
  for (let i = 0; i <= n; i++) c.lineTo(lerp(x0, x1, i / n), y0 + 3 * (2 * vnoise(i * .9, 3) - 1));
  for (let i = 0; i <= n; i++) c.lineTo(lerp(x1, x0, i / n), y1 + 3 * (2 * vnoise(i * .9, 5) - 1));
  c.closePath(); c.clip(); c.drawImage(PAPER, 0, 0, W, H); c.restore();
}
function counters(c, t) {
  const X = 90, Y = 1336;
  const lab = (cc, txt, x, y, a) => { labelPatch(cc, txt, x, y, a); mono(cc, txt, x, y, a); };
  const fade = (t0, t1) => ss(seg(t, t0, t0 + .4)) * (1 - ss(seg(t, t1, t1 + .4)));
  // buds counting up on the 16th-note grid
  let a = fade(TL.BUDS[0], 20.4);
  if (a > 0) { const n = S.flowers.filter(f => t >= f.budT).length; lab(c, 'BUDS  ' + String(n).padStart(2, ' '), X, Y, a); }
  a = fade(TL.BURST + .2, 29.6);
  if (a > 0) lab(c, 'FLOWERS  23', X, Y, a);
  a = fade(TL.FRUITLETS[0] + .8, 49.6);
  if (a > 0) { const n = 9 - TL.DROPS.filter(d => t >= d).length; lab(c, 'FRUITLETS  ' + n, X, Y, a); }
  a = fade(55.4, 59.6);
  if (a > 0) lab(c, 'Ø ' + Math.round(lerp(18, 41, ss(seg(t, 55.4, 59.4)))) + ' mm', X, Y, a);
  a = fade(61.2, 69.6);
  if (a > 0) lab(c, 'NIGHTS < 13 °C', X, Y, a);
}

// ---------------------------------------------------------------- mist, page turn, title
function mistCover(c, cam, t, t0, t1, seed) {
  const p = seg(t, t0, t1);
  if (p <= 0 || t > t1) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const lay = (pp, a, s) => {
    if (pp <= 0) return;
    c.save(); wipePath(c, 0, 0, W, H, pp, 'bu', s, 46); c.clip();
    setCam(c, cam); c.globalAlpha = a; c.globalCompositeOperation = 'source-over'; drawPaper(c);
    c.restore();
  };
  lay(eio(seg(p, 0, .85)), .55, seed);
  lay(eio(seg(p, .12, 1)), 1, seed + 1);
  c.restore();
}
function pageTurn(c, t) {
  const p = eio(seg(t, TL.PAGE, TL.PAGE + 1.05));
  if (p <= 0) return;
  const y = H * (1 - p) * 1.04, rot = (1 - p) * -.05;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.translate(W / 2, y + H / 2); c.rotate(rot); c.translate(-W / 2, -H / 2);
  if (p < 1) { c.shadowColor = 'rgba(60,45,30,.32)'; c.shadowBlur = 40; c.shadowOffsetY = -10; }
  c.globalCompositeOperation = 'source-over'; c.fillStyle = PAPERC; c.fillRect(-40, 0, W + 80, H + 200);
  c.shadowColor = 'transparent'; c.drawImage(PAPER, -40, 0, W + 80, H + 80);
  c.restore();
}
function endPage(c, t) {
  if (t < TL.PAGE + .8) return;
  // a new entry begins: "January", and the brush lifts mid-word
  const wp = seg(t, 84.4, 85.5);
  if (wp > 0) {
    c.save(); c.font = 'italic 500 66px "Cormorant Garamond"';
    const full = c.measureText('January').width, part = c.measureText('Janu').width;
    mono(c, '01 / 12', 90, 205, ss(seg(t, 84.0, 84.5)));
    c.beginPath(); c.rect(70, 215, 20 + part * wp + 6, 100); c.clip();
    halo(c, () => { c.fillStyle = rgba(INK, .86); c.fillText('January', 86, 274); }, 12);
    c.restore();
    void full;
  }
  // a stem begun and left: the brush lifted mid-stroke
  const tp = seg(t, TL.TITLE[0], TL.TITLE[1]);
  if (tp > 0) {
    c.save(); c.font = 'italic 500 96px "Cormorant Garamond"'; c.textAlign = 'center';
    const w = c.measureText('A Year on the Sill').width;
    c.beginPath(); c.rect(W / 2 - w / 2 - 30, 820, (w + 60) * ss(tp), 200); c.clip();
    halo(c, () => { c.fillStyle = rgba(INK, .88); c.fillText('A Year on the Sill', W / 2, 960); }, 14);
    c.restore();
    c.save(); c.globalCompositeOperation = 'multiply';
    drawS(c, S.titleRule, ss(seg(t, TL.TITLE[0] + .5, TL.TITLE[1] + .6)));
    c.restore();
  }
}

// ---------------------------------------------------------------- frame
function render(t) {
  const c = ctx, cam = camAt(t);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  setCam(c, cam); drawPaper(c);
  c.globalCompositeOperation = 'multiply';
  if (t < TL.HOOK_MIST[1]) {
    const vis = Math.hypot(W / 2, H / 2) / cam.z;
    const R = vis * .78 * ss(seg(t, .9, 1.7)) + Math.max(0, t - 4.2) * 650;
    drawRoom(c, { mode: 'hook', t, R, K: lemonCenter(LR) });
  } else if (t < TL.TEA_MIST[1]) drawRoom(c, { mode: 'year', t });
  else if (t >= TL.NIGHT[0] && t < TL.PAGE + 1.2) {
    const p = seg(t, TL.NIGHT[0], TL.NIGHT[1]);
    c.save(); if (p < 1) { wipePath(c, 0, 0, W, H, ss(p), 'lr', 9, 40); c.clip(); }
    drawRoom(c, { mode: 'night', t });
    // lamp light from the room: everything warm and low
    c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createRadialGradient(300, 1200, 60, 300, 1200, 1300);
    g.addColorStop(0, 'rgba(246,222,176,.5)'); g.addColorStop(.6, 'rgba(232,212,180,.36)'); g.addColorStop(1, 'rgba(206,190,170,.4)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
  }
  c.globalCompositeOperation = 'source-over';
  mistCover(c, cam, t, TL.HOOK_MIST[0], TL.HOOK_MIST[1], 3);
  mistCover(c, cam, t, TL.TEA_MIST[0], TL.TEA_MIST[1], 5);
  // annotation layer
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
  monthHeader(c, t);
  const KL = lemonCenter(LR), fK = S.flowers[S.keptIdx];
  note(c, cam, t, 3.3, 6.3, 'one lemon', [KL[0], KL[1] + 42], [-70, 92], 54);
  note(c, cam, t, 9.9, 13.4, 'resting', [470, 560], [-250, -110], 52);
  note(c, cam, t, 48.7, 53.4, 'kept: 1', [fK.x, fK.y + 3 + keptR(t)], [-70, 96], 54);
  note(c, cam, t, 70.6, 72.5, 'ripe', [KL[0], KL[1] + 42], [-40, 92], 54);
  if (t > TL.NIGHT[0]) note(c, cam, t, TL.NEWBUD + .5, TL.PAGE - .1, 'a new bud', [S.newBud.x, S.newBud.y], [-235, -60], 52);
  counters(c, t);
  subtitles(c, t);
  pageTurn(c, t);
  endPage(c, t);
}
window.render = render;

// ---------------------------------------------------------------- sound cues for the mixer
function buildEvents() {
  const E = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
  E(.05, 'bloom', { dur: 1.4 });
  E(1.0, 'brushbed', { dur: 4.6, pan: 0 });
  E(TL.HOOK_MIST[0], 'mist', { dur: TL.HOOK_MIST[1] - TL.HOOK_MIST[0] });
  [[7.6, .9, 0], [7.8, 1.2, -.5], [8.2, 1.1, .3], [8.85, .7, .1], [9.1, .7, -.6], [9.3, .8, 0], [10.0, .9, .1], [10.5, .6, .2], [10.9, .4, 0], [11.0, .6, 0], [11.3, .6, -.3], [11.6, .7, .3], [11.9, .7, 0]]
    .forEach(([t, d, pan]) => E(t, 'brush', { dur: d, pan, g: 1 }));
  E(12.1, 'brushbed', { dur: 1.6, pan: 0, g: .8 });
  E(9.9, 'pen', { dur: .7 }); E(3.3, 'pen', { dur: .7 });
  TL.MONTHS.slice(1).forEach(([t]) => E(t, 'brush', { dur: 1.1, pan: -.2, g: .7 }));
  S.flowers.forEach(f => E(f.budT, 'bud', { pan: (f.x - 540) / 540 }));
  E(13.8, 'brushbed', { dur: 9.5, pan: .1, g: .35 });
  E(TL.BURST, 'burst', { dur: .9 });
  E(TL.PETALS[0], 'petals', { dur: 2.6 });
  S.fruit.filter(f => !f.kept).forEach(f => E(f.land, 'drop', { pan: (S.flowers[f.fi].x - 540) / 540, soil: f.landY < 1100 }));
  E(48.7, 'pen', { dur: .7 });
  E(TL.RAIN[0], 'rain', { dur: TL.RAIN[1] - TL.RAIN[0] + 1.5 });
  TL.GLAZE.forEach(g => E(g, 'glaze', { dur: .9 }));
  E(70.6, 'pen', { dur: .6 });
  E(TL.TEA_MIST[0], 'mist', { dur: TL.TEA_MIST[1] - TL.TEA_MIST[0] });
  E(72.9, 'kettle', { dur: 2.2 });
  E(TL.NIGHT[0], 'brush', { dur: 1.2, pan: -.3, g: .9 });
  E(TL.CUP - .1, 'pour', { dur: .9 });
  E(TL.CUP + .9, 'clink', {});
  E(TL.NEWBUD, 'newbud', {});
  E(TL.NEWBUD + .5, 'pen', { dur: .7 });
  E(TL.PAGE, 'page', { dur: 1.05 });
  E(84.4, 'pen', { dur: 1.0 });
  EV.sort((a, b) => a.t - b.t);
  window.EV = EV;
}

(async () => {
  try {
    await Promise.all(['500 46px Caveat', 'italic 500 46px "Cormorant Garamond"', '500 46px "Cormorant Garamond"', '400 24px "IBM Plex Mono"'].map(f => document.fonts.load(f)));
    PAPER = buildPaper();
    buildRoom();
    buildTree();
    buildCamera();
    S.titleRule = withSeed(78, () => mk(qcurve(370, 1004, 710, 1000, -3, 24), 5, LEMON, { prof: 'brush', nb: 4, a: .85 }));
    buildEvents();
    window.TEXTS = null;
    window.READY = true;
  } catch (e) { console.error('init failed', e && e.stack || e); window.INIT_ERROR = String(e && e.stack || e); }
})();
