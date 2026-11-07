// Long-form style study. One scene description, four renderers (styles).
// A scene draws in world units (2400 x 1800) through a Painter. The Painter maps a camera rect onto the output
// canvas, keeps depth layers, and hands every shape / light / character to the chosen style.
'use strict';

// ---------- colour utils ----------
function hx(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function toHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mixc(a, b, t) { const A = hx(a), B = hx(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function rgba(h, a) { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; }
function rgb2hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b); let h = 0, s = 0; const l = (M + m) / 2; if (M !== m) { const d = M - m; s = l > .5 ? d / (2 - M - m) : d / (M + m); h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h * 360, s, l]; }
function hsl2hex(h, s, l) { h = ((h % 360) + 360) % 360 / 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return toHex(f(0) * 255, f(8) * 255, f(4) * 255); }
function jit(h, R, dh, ds, dl) { const [H, S, L] = rgb2hsl(hx(h)); return hsl2hex(H + (R() - .5) * 2 * dh, S + (R() - .5) * 2 * ds, L + (R() - .5) * 2 * dl); }
function lit(h, k) { return k >= 0 ? mixc(h, '#ffffff', k) : mixc(h, '#0c0620', -k); }       // lighter / darker (dark = deep violet, never grey)
function pastel(h, k = .28) { const [H, S, L] = rgb2hsl(hx(h)); return hsl2hex(H, S * .78, L + (1 - L) * k); }
function nearest(h, pal) { const A = hx(h); let best = pal[0], bd = 1e9; for (const p of pal) { const B = hx(p), d = 2 * (A[0] - B[0]) ** 2 + 4 * (A[1] - B[1]) ** 2 + 3 * (A[2] - B[2]) ** 2; if (d < bd) { bd = d; best = p; } } return best; }

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function noiseCanvas(w, h, seed, mono = true) {
  const c = mkCanvas(w, h), x = c.getContext('2d'), d = x.createImageData(w, h), R = mulberry32(seed);
  for (let i = 0; i < d.data.length; i += 4) { const v = R() * 255; d.data[i] = v; d.data[i + 1] = mono ? v : R() * 255; d.data[i + 2] = mono ? v : R() * 255; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return c;
}
// paper fibres: soft blotches + short strands, grey on white (multiply it)
function paperCanvas(w, h, seed) {
  const c = mkCanvas(w, h), x = c.getContext('2d'), R = mulberry32(seed);
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const r = 20 + R() * 90; const g = x.createRadialGradient(R() * w, R() * h, 0, R() * w, R() * h, r); g.addColorStop(0, `rgba(120,100,80,${.05 + R() * .06})`); g.addColorStop(1, 'rgba(120,100,80,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  x.lineCap = 'round';
  for (let i = 0; i < 2600; i++) { const px = R() * w, py = R() * h, a = R() * 6.28, l = 3 + R() * 14; x.strokeStyle = `rgba(90,70,50,${.08 + R() * .14})`; x.lineWidth = .5 + R() * 1.1; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .6) * l * .5, py + Math.sin(a + .6) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  const n = noiseCanvas(w, h, seed + 7); x.globalAlpha = .06; x.globalCompositeOperation = 'multiply'; x.drawImage(n, 0, 0);
  return c;
}
function dotsCanvas(step, r, col) { const c = mkCanvas(step, step), x = c.getContext('2d'); x.fillStyle = col; x.beginPath(); x.arc(step / 2, step / 2, r, 0, 6.2832); x.fill(); return c; }

// ---------- character post passes (screen space) ----------
// edge of the silhouette that faces (dx, dy): S minus S shifted by -(dx, dy)
function edgeMask(L, dx, dy) {
  const m = mkCanvas(L.width, L.height), c = m.getContext('2d');
  c.drawImage(L, 0, 0); c.globalCompositeOperation = 'destination-out'; c.drawImage(L, -dx, -dy);
  return m;
}
function tint(m, col) { const c = m.getContext('2d'); c.save(); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, m.width, m.height); c.restore(); return m; }
function overlayOn(L, m, op, alpha, blur) {
  const c = L.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.globalAlpha = alpha;
  if (blur) c.filter = `blur(${blur}px)`;
  if (op === 'multiply' || op === 'screen') {           // blend inside the silhouette only: blend on a copy, then paste back atop
    const t = mkCanvas(L.width, L.height), tc = t.getContext('2d'); tc.drawImage(L, 0, 0); tc.globalCompositeOperation = op; tc.globalAlpha = alpha; if (blur) tc.filter = `blur(${blur}px)`; tc.drawImage(m, 0, 0);
    c.globalAlpha = 1; c.filter = 'none'; c.drawImage(t, 0, 0);
  } else c.drawImage(m, 0, 0);
  c.restore();
}
function dilate(L, r, col) {
  const m = mkCanvas(L.width, L.height), c = m.getContext('2d');
  for (const rr of [r, r * .66, r * .33]) for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832; c.drawImage(L, Math.cos(a) * rr, Math.sin(a) * rr); }
  tint(m, col); c.drawImage(L, 0, 0); return m;
}

// ---------- the Painter ----------
class Painter {
  constructor(canvas, style, cam, opts = {}) {
    this.out = canvas; this.W = canvas.width; this.H = canvas.height; this.S = style; this.cam = cam;
    this.k = this.W / cam.w; this.lights = []; this.rays = []; this.seed = 1;
    this.main = canvas.getContext('2d'); this.glowC = mkCanvas(this.W, this.H); this.glow = this.glowC.getContext('2d');
    this.applyCam(this.glow); this.opts = opts;
    this.R = mulberry32(opts.seed || 11);
  }
  applyCam(c) { c.setTransform(this.k, 0, 0, this.k, -this.cam.x * this.k, -this.cam.y * this.k); }
  sx(x) { return (x - this.cam.x) * this.k; } sy(y) { return (y - this.cam.y) * this.k; }
  // depth layer: z 0 = foreground .. 1 = far wall
  layer(z, fn) {
    const L = mkCanvas(this.W, this.H), c = L.getContext('2d'); this.applyCam(c);
    const prev = this.c, prevZ = this.z; this.c = c; this.z = z; this.L = L;
    fn(); this.S.postLayer && this.S.postLayer(this, L, z);
    this.S.composite ? this.S.composite(this, L, z) : this.main.drawImage(L, 0, 0);
    this.c = prev; this.z = prevZ;
  }
  shape(path, col, o = {}) { this.seed++; this.S.shape(this, this.c, path, col, o); }
  rect(x, y, w, h, col, o = {}) { this.shape(g => g.rect(x, y, w, h), col, { bb: [x, y, w, h], ...o }); }
  round(x, y, w, h, r, col, o = {}) { this.shape(g => g.roundRect(x, y, w, h, r), col, { bb: [x, y, w, h], ...o }); }
  ell(x, y, rx, ry, col, o = {}) { this.shape(g => g.ellipse(x, y, rx, ry, o.rot || 0, 0, 6.2832), col, { bb: [x - rx, y - ry, rx * 2, ry * 2], ...o }); }
  poly(pts, col, o = {}) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    this.shape(g => { g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); }, col, { bb: [x0, y0, x1 - x0, y1 - y0], ...o });
  }
  stroke(path, col, lw, o = {}) { const c = this.c; c.save(); c.beginPath(); path(c); c.lineWidth = lw; c.lineCap = 'round'; c.strokeStyle = this.S.strokeCol ? this.S.strokeCol(col) : col; c.stroke(); c.restore(); }
  // light that the style turns into bloom / light pass. a: 0..1
  light(x, y, r, col, a = 1, o = {}) { this.lights.push({ x, y, r, col, a, ...o }); }
  glowShape(path, col, a) { const g = this.glow; g.save(); g.globalAlpha = a; g.fillStyle = col; g.beginPath(); path(g); g.fill(); g.restore(); }
  ray(pts, col, a) { this.rays.push({ pts, col, a }); }
  text(s, x, y, size, col, o = {}) { this.S.text ? this.S.text(this, this.c, s, x, y, size, col, o) : plainText(this.c, s, x, y, size, col, o); }
  // characters from toon.js / lab.js, drawn in their own screen-space canvas so the style can light them
  char(fn, x, y, s, opts = {}, o = {}) {
    const L = mkCanvas(this.W, this.H), c = L.getContext('2d'); this.applyCam(c);
    const ink = TOON.ink, lw = TOON.LW; TOON.ink = this.S.ink || ink; TOON.LW = this.S.lw || lw;
    fn(c, x, y, s, opts); TOON.ink = ink; TOON.LW = lw;
    const P = this.S.charPost ? this.S.charPost(this, L, o) : L;
    const m = this.c; m.save(); m.setTransform(1, 0, 0, 1, 0, 0);
    if (this.S.charShadow) this.S.charShadow(this, m);
    m.drawImage(P, 0, 0); m.restore();
  }
  finish() { this.S.finish(this); }
}
function plainText(c, s, x, y, size, col, o = {}) {
  c.save(); c.font = `${o.weight || ''} ${size}px ${o.font || '"Bungee"'}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); x = 0; y = 0; }
  if (o.stroke) { c.lineWidth = o.stroke; c.strokeStyle = o.strokeCol || '#000'; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y); c.restore();
}

// ---------- shared finishing passes ----------
function bloom(P, sizes, alpha) {
  const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'screen';
  for (const [b, a] of sizes) { m.globalAlpha = a * alpha; m.filter = `blur(${b * P.W / 2560}px)`; m.drawImage(P.glowC, 0, 0); }
  m.restore();
}
function lightPass(P, op, scale = 1) {
  const m = P.main; m.save(); P.applyCam(m); m.globalCompositeOperation = op;
  for (const L of P.lights) { const g = m.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r); g.addColorStop(0, rgba(L.col, L.a * scale)); g.addColorStop(1, rgba(L.col, 0)); m.fillStyle = g; m.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2); }
  m.restore();
}
function diffusion(P, blur, alpha) { const t = mkCanvas(P.W, P.H), c = t.getContext('2d'); c.filter = `blur(${blur * P.W / 2560}px)`; c.drawImage(P.out, 0, 0); const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'screen'; m.globalAlpha = alpha; m.drawImage(t, 0, 0); m.restore(); }
function vignette(P, a, col = '#0b0618') { const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); const r = Math.hypot(P.W, P.H) / 2; const g = m.createRadialGradient(P.W / 2, P.H / 2, r * .45, P.W / 2, P.H / 2, r); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, a)); m.fillStyle = g; m.fillRect(0, 0, P.W, P.H); m.restore(); }
function grain(P, a, op = 'overlay', seed = 5) { const n = noiseCanvas(512, 512, seed); const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = op; m.globalAlpha = a; m.fillStyle = m.createPattern(n, 'repeat'); m.fillRect(0, 0, P.W, P.H); m.restore(); }
function wash(P, col, a, op) { const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = op; m.globalAlpha = a; m.fillStyle = col; m.fillRect(0, 0, P.W, P.H); m.restore(); }
function vgrad(P, top, bot, a, op) { const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = op; m.globalAlpha = a; const g = m.createLinearGradient(0, 0, 0, P.H); g.addColorStop(0, top); g.addColorStop(1, bot); m.fillStyle = g; m.fillRect(0, 0, P.W, P.H); m.restore(); }
function raysPass(P, op, scale = 1) {
  const m = P.main; m.save(); P.applyCam(m); m.globalCompositeOperation = op;
  for (const r of P.rays) {
    const p = r.pts, g = m.createLinearGradient((p[0] + p[2]) / 2, (p[1] + p[3]) / 2, (p[4] + p[6]) / 2, (p[5] + p[7]) / 2);
    g.addColorStop(0, rgba(r.col, r.a * scale)); g.addColorStop(.7, rgba(r.col, r.a * scale * .35)); g.addColorStop(1, rgba(r.col, 0));
    m.fillStyle = g; m.filter = `blur(${10 * P.k}px)`; m.beginPath(); m.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) m.lineTo(p[i], p[i + 1]); m.closePath(); m.fill();
  }
  m.restore();
}

// dark ambient everywhere, light pools where the lights are, multiplied over the picture
function lightMap(P, ambient, scale = 1) {
  const L = mkCanvas(P.W, P.H), c = L.getContext('2d'); c.fillStyle = ambient; c.fillRect(0, 0, P.W, P.H);
  P.applyCam(c); c.globalCompositeOperation = 'lighter';
  for (const l of P.lights) { const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); g.addColorStop(0, rgba(l.col, Math.min(1, l.a * scale))); g.addColorStop(.55, rgba(l.col, Math.min(1, l.a * scale) * .45)); g.addColorStop(1, rgba(l.col, 0)); c.fillStyle = g; c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
  const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'multiply'; m.drawImage(L, 0, 0); m.restore();
}
function posterize(L, pal) {
  const c = L.getContext('2d'), d = c.getImageData(0, 0, L.width, L.height), a = d.data, cache = new Map(), P = pal.map(hx);
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] < 8) continue; const key = (a[i] >> 3) << 10 | (a[i + 1] >> 3) << 5 | (a[i + 2] >> 3);
    let q = cache.get(key); if (!q) { let bd = 1e9; for (const p of P) { const dd = 2 * (a[i] - p[0]) ** 2 + 4 * (a[i + 1] - p[1]) ** 2 + 3 * (a[i + 2] - p[2]) ** 2; if (dd < bd) { bd = dd; q = p; } } cache.set(key, q); }
    a[i] = q[0]; a[i + 1] = q[1]; a[i + 2] = q[2];
  }
  c.putImageData(d, 0, 0); return L;
}

// ================= the four styles =================
const STYLES = {};

// A: TV anime, HD. Thin coloured lines, flat cel + soft gradient, compositing light (bloom, diffusion, rim light), depth blur.
STYLES.A = {
  key: 'A', name: 'Anime series HD', ink: '#2a1838', lw: 3.2,
  shape(P, c, path, col, o) {
    c.beginPath(); path(c);
    let f = col; const bb = o.bb;
    if (bb && o.grad !== false) { const g = c.createLinearGradient(bb[0], bb[1], bb[0], bb[1] + bb[3]); g.addColorStop(0, lit(col, o.top ?? .07)); g.addColorStop(1, lit(col, -(o.bot ?? .12))); f = g; }
    c.fillStyle = f; c.fill();
    if (o.shadeSide && bb) { c.save(); c.clip(); c.fillStyle = rgba(lit(col, -.35), .55); const [x, y, w, h] = bb; if (o.shadeSide === 'r') c.fillRect(x + w * .72, y, w, h); else if (o.shadeSide === 'b') c.fillRect(x, y + h * .78, w, h); else c.fillRect(x - 1, y, w * .26, h); c.restore(); c.beginPath(); path(c); }
    if (o.gloss && bb) { c.save(); c.clip(); const [x, y, w, h] = bb; c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.moveTo(x + w * .12, y); c.lineTo(x + w * .3, y); c.lineTo(x + w * .12, y + h); c.lineTo(x - w * .06, y + h); c.fill(); c.restore(); c.beginPath(); path(c); }
    if (o.glow) P.glowShape(path, o.glowCol || col, o.glow);
    if (o.line !== false) { c.lineJoin = 'round'; c.lineWidth = (o.lw || 2.4) / P.k; c.strokeStyle = o.lineCol || lit(col, -.55); c.stroke(); }
  },
  text(P, c, s, x, y, size, col, o) { plainText(c, s, x, y, size, col, o); if (o.glow) { P.glow.save(); plainText(P.glow, s, x, y, size, o.glowCol || col, o); P.glow.restore(); } },
  postLayer(P, L, z) { if (z >= .55) { const c = L.getContext('2d'), t = mkCanvas(L.width, L.height), tc = t.getContext('2d'); tc.filter = `blur(${(z - .45) * 3.2 * P.W / 2560}px)`; tc.drawImage(L, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, L.width, L.height); c.drawImage(t, 0, 0); } },
  charPost(P, L, o) {
    const s = P.W / 2560;
    overlayOn(L, tint(edgeMask(L, -26 * s, 10 * s), o.shadow || '#4b3a8f'), 'multiply', .42, 4 * s);     // form shadow on the side away from the key light
    overlayOn(L, tint(edgeMask(L, 6 * s, -3 * s), o.rim || '#bfefff'), 'source-atop', .85, 1.2 * s);     // rim light from the window side
    if (o.rim2) overlayOn(L, tint(edgeMask(L, -5 * s, -2 * s), o.rim2), 'source-atop', .55, 1.2 * s);
    return L;
  },
  finish(P) {
    lightMap(P, '#8f86c4', .75); lightPass(P, 'screen', .22);
    bloom(P, [[10, .9], [36, .8], [90, .6]], 1);
    diffusion(P, 14, .09);
    vignette(P, .5); grain(P, .05);
  },
};

// B: painted film. Gouache-like brushed backgrounds, no hard outlines on the set, warm/cool light, god rays, fog, grain.
STYLES.B = {
  key: 'B', name: 'Painted film', ink: '#4a2a26', lw: 2.6,
  shape(P, c, path, col, o) {
    const R = mulberry32(P.seed * 7919), bb = o.bb;
    c.save(); c.beginPath(); path(c); c.fillStyle = col; c.fill();
    if (o.glow) P.glowShape(path, o.glowCol || col, o.glow);
    if (bb && o.brush !== false) {
      c.clip(); const [x, y, w, h] = bb, area = w * h * P.k * P.k;
      const n = Math.min(3200, Math.max(14, area / 300 * (o.detail ?? 1)));
      const dir = o.dir ?? -.5; c.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const px = x + R() * w, py = y + R() * h, L = (22 + R() * 70) / P.k * (o.len ?? 1), a = dir + (R() - .5) * .7;
        const ty = (py - y) / Math.max(1, h);                                    // lighter toward the top, as if lit from above
        c.strokeStyle = jit(lit(col, .08 - ty * .2), R, 9, .09, .1); c.globalAlpha = .22 + R() * .4; c.lineWidth = (8 + R() * 20) / P.k;
        c.beginPath(); c.moveTo(px - Math.cos(a) * L / 2, py - Math.sin(a) * L / 2); c.quadraticCurveTo(px + (R() - .5) * L * .3, py + (R() - .5) * L * .3, px + Math.cos(a) * L / 2, py + Math.sin(a) * L / 2); c.stroke();
      }
      c.globalAlpha = 1;
    }
    c.restore();
    if (o.line !== false && o.edge !== false) { c.beginPath(); path(c); c.lineWidth = 3 / P.k; c.strokeStyle = rgba(lit(col, -.45), .28); c.stroke(); }
  },
  text(P, c, s, x, y, size, col, o) { c.save(); c.globalAlpha = .9; plainText(c, s, x, y, size, col, o); c.restore(); if (o.glow) plainText(P.glow, s, x, y, size, o.glowCol || col, o); },
  postLayer(P, L, z) {
    const c = L.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (z >= .55) { const t = mkCanvas(L.width, L.height), tc = t.getContext('2d'); tc.filter = `blur(${(z - .3) * 2.4 * P.W / 2560}px)`; tc.drawImage(L, 0, 0); c.clearRect(0, 0, L.width, L.height); c.drawImage(t, 0, 0); }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = rgba(P.opts.fog || '#6a5a8a', z * .08); c.fillRect(0, 0, L.width, L.height); c.restore();
  },
  charPost(P, L, o) {
    const s = P.W / 2560;
    overlayOn(L, tint(edgeMask(L, -30 * s, 14 * s), o.shadow || '#4a3a7a'), 'multiply', .4, 7 * s);
    overlayOn(L, tint(edgeMask(L, 7 * s, -4 * s), o.rim || '#ffe2b0'), 'source-atop', .8, 2 * s);
    const t = mkCanvas(L.width, L.height), tc = t.getContext('2d'); tc.fillStyle = tc.createPattern(P.paper || (P.paper = paperCanvas(512, 512, 3)), 'repeat'); tc.fillRect(0, 0, t.width, t.height);
    overlayOn(L, t, 'multiply', .3, 0);
    return L;
  },
  finish(P) {
    if (P.key) P.light(P.key.x, P.key.y, P.key.r, '#ffc98e', .75);
    lightMap(P, '#3e3768', 1.15 * (P.opts.lightK ?? 1)); lightPass(P, 'screen', .08);
    raysPass(P, 'screen', P.opts.rayK ?? 1);
    bloom(P, [[12, .85], [40, .6], [110, .32]], 1);
    diffusion(P, 20, .07);
    { const t = mkCanvas(P.W, P.H); t.getContext('2d').drawImage(P.out, 0, 0); const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'overlay'; m.globalAlpha = .3; m.drawImage(t, 0, 0); m.restore(); }   // contrast
    vgrad(P, '#ffcf8a', '#2b3a7a', .22, 'soft-light');
    const pc = P.paper || (P.paper = paperCanvas(512, 512, 3)); const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'multiply'; m.globalAlpha = .32; m.fillStyle = m.createPattern(pc, 'repeat'); m.fillRect(0, 0, P.W, P.H); m.restore();
    vignette(P, .6, '#120a10'); grain(P, .07);
  },
};

// C: flat graphic. Limited palette, no outlines on the set, hard drop shadows, halftone, print grain.
STYLES.C = {
  key: 'C', name: 'Flat graphic', ink: '#191a3c', lw: 2.4,
  pal: ['#141238', '#2a2766', '#5446a8', '#ff6a2a', '#ffc46a', '#fff0d8', '#2fc7b2', '#ff7fa8', '#efb894', '#b97a56', '#1f6e5a', '#c4b2f0', '#b6ff3b', '#f4e7a8'],
  shape(P, c, path, col, o) {
    const f = nearest(col, this.pal), bb = o.bb;
    if (o.cast !== false && P.z < .9 && bb && bb[2] * bb[3] * P.k * P.k > 900) { c.save(); c.translate(16 / P.k * (o.castK ?? 1), 18 / P.k * (o.castK ?? 1)); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(20,18,56,.5)'; c.beginPath(); path(c); c.fill(); c.restore(); }
    c.beginPath(); path(c); c.fillStyle = f; c.fill();
    if (o.glow) P.glowShape(path, f, o.glow * .6);
    if (bb && o.ht !== false && bb[2] * bb[3] * P.k * P.k > 2500) {                      // halftone shade toward the bottom right
      c.save(); c.clip(); const [x, y, w, h] = bb, st = 13 / P.k; c.fillStyle = rgba(nearest(lit(f, -.45), this.pal), .55);
      for (let yy = y; yy < y + h; yy += st) for (let xx = x + ((Math.round((yy - y) / st) % 2) * st / 2); xx < x + w; xx += st) {
        const t = ((xx - x) / w * .55 + (yy - y) / h * .45); const r = Math.max(0, (t - .55) / .45) * st * .55; if (r > .3 / P.k) { c.beginPath(); c.arc(xx, yy, r, 0, 6.2832); c.fill(); }
      }
      c.restore();
    }
    if (o.lineC) { c.beginPath(); path(c); c.lineWidth = 2.2 / P.k; c.strokeStyle = '#121433'; c.stroke(); }
  },
  text(P, c, s, x, y, size, col, o) { plainText(c, s, x, y, size, nearest(col, this.pal), o); },
  strokeCol(col) { return nearest(col, this.pal); },
  charPost(P, L, o) {
    const s = P.W / 2560, sh = tint(edgeMask(L, -22 * s, 10 * s), '#2a2470');
    const d = mkCanvas(L.width, L.height), dc = d.getContext('2d'); dc.fillStyle = dc.createPattern(dotsCanvas(Math.max(4, Math.round(9 * s)), Math.max(1.4, 2.6 * s), '#000'), 'repeat'); dc.fillRect(0, 0, d.width, d.height);
    dc.globalCompositeOperation = 'destination-in'; dc.drawImage(sh, 0, 0); tint(d, '#2a2470');
    overlayOn(L, d, 'multiply', .55, 0);
    return posterize(L, this.pal);
  },
  charShadow(P, m) { const s = P.W / 2560; m.shadowColor = 'rgba(20,18,56,.45)'; m.shadowBlur = 0; m.shadowOffsetX = 16 * s; m.shadowOffsetY = 18 * s; },
  finish(P) {
    bloom(P, [[3, .6], [16, .45]], .8);
    wash(P, '#fff4e4', .1, 'soft-light');
    grain(P, .16, 'multiply', 9);
    const m = P.main; const t = mkCanvas(P.W, P.H); t.getContext('2d').drawImage(P.out, 0, 0);
    m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'multiply'; m.globalAlpha = .1; m.drawImage(t, 3 * P.W / 2560, 2 * P.W / 2560); m.restore();   // slight misregistration
  },
};

// D: paper diorama. Cut paper with fibres, every piece lifted with a soft shadow, characters as stickers with a white border,
// warm lamp light, tilt-shift.
STYLES.D = {
  key: 'D', name: 'Paper diorama', ink: '#2d2036', lw: 3.4,
  shape(P, c, path, col, o) {
    const f = o.raw ? col : pastel(col, o.pastel ?? .1), bb = o.bb;
    c.save(); const s = P.W / 2560, lift = o.lift ?? 1;
    if (!o.flat) { c.shadowColor = 'rgba(40,22,12,.38)'; c.shadowBlur = 9 * s * lift; c.shadowOffsetX = 2.5 * s * lift; c.shadowOffsetY = 4 * s * lift; }
    c.beginPath(); path(c); c.fillStyle = f; c.fill(); c.restore();
    if (o.glow) P.glowShape(path, col, o.glow);
    c.save(); c.beginPath(); path(c); c.clip(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = o.glow ? .35 : .9;
    c.fillStyle = c.createPattern(P.paper || (P.paper = paperCanvas(512, 512, 21)), 'repeat'); const pm = new DOMMatrix(); pm.a = pm.d = 1 / P.k; c.fillStyle.setTransform && c.fillStyle.setTransform(pm.translate(0, 0));
    if (bb) c.fillRect(bb[0] - 4, bb[1] - 4, bb[2] + 8, bb[3] + 8); else c.fillRect(-1e4, -1e4, 2e4, 2e4);
    c.restore();
    c.save(); c.beginPath(); path(c); c.lineWidth = 1.6 / P.k; c.strokeStyle = 'rgba(255,250,240,.45)'; c.stroke(); c.restore();     // cut edge catches the light
  },
  text(P, c, s, x, y, size, col, o) { c.save(); c.shadowColor = 'rgba(40,22,12,.35)'; c.shadowBlur = 4 * P.W / 2560; c.shadowOffsetY = 2 * P.W / 2560; plainText(c, s, x, y, size, pastel(col, .1), o); c.restore(); if (o.glow) plainText(P.glow, s, x, y, size, col, o); },
  strokeCol(col) { return pastel(col, .1); },
  composite(P, L, z) { const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); const s = P.W / 2560; m.shadowColor = 'rgba(30,14,6,.6)'; m.shadowBlur = 36 * s; m.shadowOffsetX = 10 * s; m.shadowOffsetY = 18 * s; m.drawImage(L, 0, 0); m.restore(); },
  charPost(P, L, o) {
    const s = P.W / 2560;
    overlayOn(L, tint(edgeMask(L, -24 * s, 10 * s), '#5b3f6e'), 'multiply', .28, 5 * s);
    const t = mkCanvas(L.width, L.height), tc = t.getContext('2d'); tc.fillStyle = tc.createPattern(P.paper || (P.paper = paperCanvas(512, 512, 21)), 'repeat'); tc.fillRect(0, 0, t.width, t.height);
    overlayOn(L, t, 'multiply', .8, 0);
    return dilate(L, 9 * s, '#fffaf0');
  },
  charShadow(P, m) { const s = P.W / 2560; m.shadowColor = 'rgba(30,14,6,.5)'; m.shadowBlur = 22 * s; m.shadowOffsetX = 7 * s; m.shadowOffsetY = 12 * s; },
  finish(P) {
    if (P.key) P.light(P.key.x, P.key.y, P.key.r, '#ffe0b0', .45);
    lightMap(P, '#9a8494', .75);
    bloom(P, [[12, .6], [44, .45]], .8);
    vgrad(P, '#ffd9a0', '#3a2a5a', .2, 'soft-light');
    // tilt-shift: blur the top and bottom bands
    const b = mkCanvas(P.W, P.H), bc = b.getContext('2d'); bc.filter = `blur(${5 * P.W / 2560}px)`; bc.drawImage(P.out, 0, 0); bc.filter = 'none';
    bc.globalCompositeOperation = 'destination-in'; const g = bc.createLinearGradient(0, 0, 0, P.H); const band = P.opts.tilt || [.22, .78];
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(band[0], 'rgba(0,0,0,0)'); g.addColorStop(band[1], 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); bc.fillStyle = g; bc.fillRect(0, 0, P.W, P.H);
    const m = P.main; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.drawImage(b, 0, 0); m.restore();
    vignette(P, .45, '#1a0e08'); grain(P, .05);
  },
};
