// Shared page helpers for Paper Almanac episodes (1080×1920 watercolour journal pages).
// Needs engine.js first and window.TL (timeline.js). Episode code defines its scene in film.js.
'use strict';
const W = 1080, H = 1920;
const INK = '#2e2622', INK2 = '#6b5546', PAPERC = '#f2eadb';
let PAPER = null;

// ---------------------------------------------------------------- paper (2× resolution, drawn in world space)
function buildPaper(seed = 1) {
  const SC = 2, w = W * SC, h = H * SC;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  function octave(cw, ch, s) {
    const o = document.createElement('canvas'); o.width = cw; o.height = ch;
    const og = o.getContext('2d'), im = og.createImageData(cw, ch), R = mulberry(s);
    for (let i = 0; i < cw * ch; i++) { const v = R() * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    og.putImageData(im, 0, 0);
    const b = document.createElement('canvas'); b.width = w; b.height = h;
    const bg = b.getContext('2d'); bg.imageSmoothingQuality = 'high'; bg.drawImage(o, 0, 0, w, h);
    return bg.getImageData(0, 0, w, h).data;
  }
  const n1 = octave(10, 18, seed), n2 = octave(36, 64, seed + 1), n3 = octave(140, 250, seed + 2);
  const base = hex(PAPERC), im = g.createImageData(w, h), d = im.data, R = mulberry(seed + 3);
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
  withSeed(seed + 4, () => {
    for (let k = 0; k < 3400; k++) {
      const P = polar(rnd(0, w), rnd(0, h), rnd(0, 6.283), rnd(10, 48), rnd(-7, 7), 6);
      g.strokeStyle = RNG() < .5 ? `rgba(255,252,244,${rnd(.12, .3)})` : `rgba(150,130,105,${rnd(.05, .12)})`;
      g.lineWidth = rnd(.8, 1.8); g.beginPath(); P.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke();
    }
  });
  return c;
}
function drawPaper(c) { c.drawImage(PAPER, 0, 0, W, H); }
// unpainted paper inside a path (light, petals, highlights, snow): restores the sheet under the current transform
function paperClip(c, pathFn, a = 1) {
  c.save(); pathFn(); c.clip();
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
  const m = c.getTransform(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(PAPER, 0, 0, W, H); c.setTransform(m);
  c.restore();
}

// ---------------------------------------------------------------- washes and lines
function wash(pts, col, a, jit = 5, step = 14) {
  const w = mkWash(pts, col, a, jit, 3, step);
  const xs = w.polys.flat().map(p => p[0]), ys = w.polys.flat().map(p => p[1]);
  w.bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  w.seed = Math.floor(rnd(1, 99));
  return w;
}
function rectPts(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
function edgeLine(x0, y0, x1, y1, w, col, a, parts = 2) {
  const L = [];
  let u = 0;
  for (let k = 0; k < parts; k++) {
    const u1 = k === parts - 1 ? 1 : u + (1 - u) / (parts - k) * rnd(.85, 1.1), g = rnd(.004, .02);
    L.push(mk(qcurve(lerp(x0, x1, u), lerp(y0, y1, u), lerp(x0, x1, u1 - g), lerp(y0, y1, u1 - g), rnd(-1.5, 1.5), 10), w, col, { prof: 'even', nb: 0, a, rough: .35, rib: 1 }));
    u = u1;
  }
  return L;
}
// paint a wash in during [t0, t1] with a wavy brush-edge wipe (dir: lr, rl, bu, td); full = already painted
function W_(c, t, w, t0, t1, dir = 'lr', col = null, am = 1, full = false) {
  const p = full ? 1 : seg(t, t0, t1);
  if (p <= 0) return;
  if (p >= 1) { drawWash(c, w, am, col); return; }
  c.save(); wipePath(c, w.bb[0], w.bb[1], w.bb[2], w.bb[3], ss(p), dir, w.seed); c.clip(); drawWash(c, w, am, col); c.restore();
}
// paint a stroke in during [t0, t1]
function S_(c, t, s, t0, t1, col = null, am = 1, full = false) {
  if (!s) return;
  const p = full ? 1 : seg(t, t0, t1);
  if (p > 0) drawS(c, s, ss(p), col, am);
}

// ---------------------------------------------------------------- camera (one world → screen function)
let ZT = () => 1, CT = () => [W / 2, H / 2];
function setCamera(zKeys, cKeys) { ZT = track(zKeys); CT = track(cKeys); }
function camAt(t) { const z = ZT(t), c = CT(t); return { z, cx: c[0], cy: c[1] }; }
function setCam(c, m) { c.setTransform(m.z, 0, 0, m.z, W / 2 - m.cx * m.z, H / 2 - m.cy * m.z); }
function scr(m, x, y) { return [(x - m.cx) * m.z + W / 2, (y - m.cy) * m.z + H / 2]; }

// ---------------------------------------------------------------- annotation layer (screen space)
function halo(c, fn, blur = 12) { c.save(); c.shadowColor = PAPERC; c.shadowBlur = blur; fn(); fn(); c.restore(); }
function hand(c, txt, x, y, p, size = 50, a = 1, col = INK) {
  if (p <= 0 || a <= 0) return;
  c.save(); c.font = `500 ${size}px Caveat`;
  const w = c.measureText(txt).width;
  c.beginPath(); c.rect(x - 20, y - size * 1.2, 40 + w * p, size * 1.8); c.clip();
  halo(c, () => { c.fillStyle = rgba(col, .88 * a); c.fillText(txt, x, y); });
  c.restore();
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
  halo(c, () => { c.fillStyle = rgba(INK, .82 * a); c.fillText(txt, x, y); }, 14);
  c.restore();
}
// a small patch of unpainted paper behind a measured label, so it reads over anything
function labelPatch(c, txt, x, y, a, size = 26) {
  c.save(); c.font = `400 ${size}px "IBM Plex Mono"`; c.letterSpacing = '4px';
  const w = c.measureText(txt).width; c.restore();
  c.save(); c.globalAlpha = .82 * a; c.beginPath();
  const x0 = x - 16, x1 = x + w + 12, y0 = y - size * 1.15, y1 = y + size * .45, n = 14;
  for (let i = 0; i <= n; i++) c.lineTo(lerp(x0, x1, i / n), y0 + 3 * (2 * vnoise(i * .9, 3) - 1));
  for (let i = 0; i <= n; i++) c.lineTo(lerp(x1, x0, i / n), y1 + 3 * (2 * vnoise(i * .9, 5) - 1));
  c.closePath(); c.clip(); c.drawImage(PAPER, 0, 0, W, H); c.restore();
}
function label(c, txt, x, y, a, size = 26) { if (a <= 0) return; labelPatch(c, txt, x, y, a, size); mono(c, txt, x, y, a, size); }
// hand-written note with a pen leader to a world point (follows the camera)
function note(c, cam, t, t0, t1, txt, world, off, size = 52) {
  if (t < t0 || t > t1 + .5) return;
  const a = 1 - ss(seg(t, t1, t1 + .5)), [tx, ty] = scr(cam, world[0], world[1]);
  const lx = clamp(tx + off[0], 70, W - 360), ly = clamp(ty + off[1], 420, 1340);
  c.save(); c.font = `500 ${size}px Caveat`; const w = c.measureText(txt).width; c.restore();
  hand(c, txt, lx, ly, seg(t, t0, t0 + .7), size, a);
  const ax = off[0] < 0 ? lx + w + 10 : lx - 10, ay = ly - size * .3;
  const dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy) || 1, gap = 18;
  leader(c, ax, ay, tx - dx / d * gap, ty - dy / d * gap, seg(t, t0 + .45, t0 + 1.1), a);
}
// burned-in subtitles from TL.VO: on the paper, no box, above the Shorts UI
function subtitles(c, t, size = 46) {
  for (const v of TL.VO) {
    if (t < v.s0 || t > v.s1) continue;
    const a = ss(seg(t, v.s0, v.s0 + .25)) * (1 - ss(seg(t, v.s1 - .35, v.s1)));
    const L = v.sub.split('\n'), y0 = L.length > 1 ? 1430 : 1458;
    c.save(); c.font = `italic 500 ${size}px "Cormorant Garamond"`; c.textAlign = 'center';
    halo(c, () => { c.fillStyle = rgba(INK, .78 * a); L.forEach((s, i) => c.fillText(s, W / 2, y0 + i * 54)); }, 18);
    c.restore();
  }
}
// paper-coloured mist rising from the bottom: erases the world back to the sheet
function mistCover(c, cam, t, t0, t1, seed = 3) {
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
// a title wiped in left to right, with an accent brush rule under it
function titleCard(c, t, t0, t1, text, y, rule = null, size = 92) {
  const tp = seg(t, t0, t1);
  if (tp <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = `italic 500 ${size}px "Cormorant Garamond"`; c.textAlign = 'center';
  const w = c.measureText(text).width;
  c.beginPath(); c.rect(W / 2 - w / 2 - 30, y - size, (w + 60) * ss(tp), size * 1.6); c.clip();
  halo(c, () => { c.fillStyle = rgba(INK, .88); c.fillText(text, W / 2, y); }, 14);
  c.restore();
  if (rule) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply'; drawS(c, rule, ss(seg(t, t0 + .5, t1 + .6))); c.restore(); }
}
// sound cues for the mixer
const EV = [];
function E(t, type, o = {}) { EV.push({ t: +t.toFixed(4), type, ...o }); }
async function loadFonts() {
  await Promise.all(['500 46px Caveat', 'italic 500 46px "Cormorant Garamond"', '500 46px "Cormorant Garamond"', '400 24px "IBM Plex Mono"'].map(f => document.fonts.load(f)));
}
