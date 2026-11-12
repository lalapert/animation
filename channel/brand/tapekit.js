// STILL RECORDING tape kit: a small 2.5D renderer for the Halloway Galleria, CCTV and camcorder looks, VHS damage,
// and the vertical "archive viewer" layout (tape label, 4:3 tape window, the rule underneath).
// Deterministic: everything is a function of time t and fixed seeds.
'use strict';
const TK = {};
(function () {
  const TW = 1080, TH = 810;                 // tape window (4:3)
  TK.TW = TW; TK.TH = TH;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  TK.clamp = clamp;
  function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  TK.rng = rng;

  // ---------------------------------------------------------------- camera + projection
  // cam = { x, y, z, yaw (rad, 0 = +z), pitch (rad, + = up), fov (deg) }
  function makeCam(c, W = TW, H = TH) {
    const f = .5 * W / Math.tan(c.fov * Math.PI / 360), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    return Object.assign({}, c, { f, W, H, toCam(p) {
      const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z;
      const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy;          // yaw
      const y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;          // pitch
      return [x1, y2, z2];
    } });
  }
  const NEAR = .08;
  function clipNear(pts) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR;
      if (ia) out.push(a);
      if (ia !== ib) { const k = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, NEAR]); }
    }
    return out;
  }
  const proj = (cam, q) => [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2]];

  // ---------------------------------------------------------------- scene: a list of quads (and lines)
  // quad: { p: [[x,y,z] x4], col: [r,g,b], emit: 0..1, tex: null | 'tiles' | 'shutter' | 'glass', text, textCol }
  function Scene() { this.q = []; this.lines = []; }
  Scene.prototype.quad = function (p, col, o = {}) { this.q.push(Object.assign({ p, col }, o)); return this; };
  Scene.prototype.box = function (x0, y0, z0, x1, y1, z1, col, o = {}) {
    const s = (k) => col.map(v => v * k);
    this.quad([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], s(1.0), o);             // top
    this.quad([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], s(.8), o);              // front (z0)
    this.quad([[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], s(.8), o);              // back (z1)
    this.quad([[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], s(.65), o);             // left
    this.quad([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], s(.65), o);             // right
    return this;
  };
  Scene.prototype.line = function (a, b, col, w) { this.lines.push({ a, b, col, w }); return this; };
  TK.Scene = Scene;

  // the Halloway Galleria main concourse: z grows away from the entrance
  TK.STORES = ['LOOMIS SHOES', 'PAGE & PEN BOOKS', 'STARLIGHT ARCADE', 'TOY GARDEN', 'FOTO 1 HOUR', 'CORNER CANDY', 'MILLER JEWELERS', 'SOUND WAVE MUSIC', 'HALLOWAY CINEMA', 'BLUE RIBBON PRETZELS', 'FASHION 99', 'GREEN LEAF FLORIST'];
  TK.concourse = function (o = {}) {
    const S = new Scene(), Wd = o.width || 12, Hh = o.height || 4.6, L = o.length || 64, hw = Wd / 2;
    const floor = [92, 86, 76], wall = [120, 112, 98], ceil = [70, 66, 62];
    for (let z = 0; z < L; z += 2) {          // floor and ceiling in 2 m strips so the fog shades them by distance
      S.quad([[-hw, 0, z], [hw, 0, z], [hw, 0, z + 2], [-hw, 0, z + 2]], floor, { floor: true });
      S.quad([[-hw, Hh, z + 2], [hw, Hh, z + 2], [hw, Hh, z], [-hw, Hh, z]], ceil);
    }
    S.quad([[-hw, 0, L], [hw, 0, L], [hw, Hh, L], [-hw, Hh, L]], [40, 38, 36]);                  // far wall (lost in the dark)
    // storefronts both sides, 8 m each
    let k = o.storeSeed || 0;
    for (let z = 2; z < L - 6; z += 8) for (const side of [-1, 1]) {
      const x = side * hw, z0 = z, z1 = z + 7.6, name = TK.STORES[k++ % TK.STORES.length];
      const pts = side < 0 ? [[x, 0, z1], [x, 0, z0], [x, 3.1, z0], [x, 3.1, z1]] : [[x, 0, z0], [x, 0, z1], [x, 3.1, z1], [x, 3.1, z0]];
      const shutter = (k * 7 + 3) % 5 !== 0;
      S.quad(pts, shutter ? [110, 110, 112] : [24, 26, 30], { tex: shutter ? 'shutter' : 'glass', store: name });
      // reading order as seen from the concourse: left wall reads toward +z, right wall toward -z
      const sp = side < 0 ? [[x, 3.2, z0 + .4], [x, 3.2, z1 - .4], [x, 3.9, z1 - .4], [x, 3.9, z0 + .4]] : [[x, 3.2, z1 - .4], [x, 3.2, z0 + .4], [x, 3.9, z0 + .4], [x, 3.9, z1 - .4]];
      S.quad(sp, [52, 46, 40], { text: name, textCol: [200, 190, 160] });
      const wp = side < 0 ? [[x, 3.1, z1], [x, 3.1, z0], [x, Hh, z0], [x, Hh, z1]] : [[x, 3.1, z0], [x, 3.1, z1], [x, Hh, z1], [x, Hh, z0]];
      S.quad(wp, wall);
      const pp = side < 0 ? [[x, 0, z1 + .4], [x, 0, z1], [x, Hh, z1], [x, Hh, z1 + .4]] : [[x, 0, z1], [x, 0, z1 + .4], [x, Hh, z1 + .4], [x, Hh, z1]];
      S.quad(pp, wall.map(v => v * .8));                                                       // pilaster between stores
    }
    // columns, planters, benches
    for (let z = 10; z < L - 8; z += 16) {
      for (const side of [-1, 1]) S.box(side * 3.4 - .35, 0, z - .35, side * 3.4 + .35, Hh, z + .35, [128, 122, 110]);
      S.box(-1.3, 0, z + 5, 1.3, .45, z + 5.6, [70, 54, 40]);                                     // bench
      S.box(-.9, 0, z + 9, .9, .7, z + 10.8, [86, 70, 58]); S.box(-.7, .7, z + 9.2, .7, 1.4, z + 10.6, [44, 62, 44]);   // planter
    }
    // ceiling light panels down the middle
    for (let z = 3; z < L - 2; z += 4) {
      const on = o.lightsOn ? o.lightsOn(z) : 0;
      S.quad([[-.9, Hh - .02, z], [.9, Hh - .02, z], [.9, Hh - .02, z + .6], [-.9, Hh - .02, z + .6]], [150, 150, 140], { emit: on, light: true });
    }
    // exit sign over the far end
    S.quad([[-.8, 3.6, L - .1], [.8, 3.6, L - .1], [.8, 4.1, L - .1], [-.8, 4.1, L - .1]], [40, 140, 70], { emit: 1, text: 'EXIT', textCol: [190, 255, 200] });
    S.meta = { width: Wd, height: Hh, length: L };
    return S;
  };

  // ---------------------------------------------------------------- render a scene into the 4:3 window
  function shadeCol(col, d, o) {
    const fog = Math.exp(-d * (o.fog ?? .055)), lit = (o.ambient ?? .55) * fog;
    return col.map(v => v * lit);
  }
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  TK.render = function (g, S, camSpec, o = {}) {
    const cam = makeCam(camSpec, g.canvas.width, g.canvas.height);
    g.save();
    g.fillStyle = css(o.bg || [10, 10, 12]); g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    const items = [];
    for (const q of S.q) {
      const cpts = clipNear(q.p.map(p => cam.toCam(p)));
      if (cpts.length < 3) continue;
      const d = cpts.reduce((s, p) => s + Math.hypot(p[0], p[1], p[2]), 0) / cpts.length;
      items.push({ q, cpts, d });
    }
    items.sort((a, b) => b.d - a.d);
    for (const { q, cpts, d } of items) {
      const sp = cpts.map(p => proj(cam, p));
      g.beginPath(); sp.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
      const em = q.emit || 0;
      let col = shadeCol(q.col, d, o);
      if (em > 0) col = q.col.map((v, i) => v * (1 - em) * .5 + (q.light ? 255 : v * 1.6) * em * Math.max(.45, Math.exp(-d * .012)));
      g.fillStyle = css(col); g.fill();
      if (em > .2) { g.save(); g.shadowColor = css(q.light ? [255, 250, 225] : q.col, .9); g.shadowBlur = 40 * em; g.fill(); g.restore(); }
      if (q.tex) texture(g, q, cpts, sp, cam, d, o);
      if (q.text) quadText(g, q, cam, d, o);
    }
    // floor tile grid
    if (o.grid !== false && S.meta) {
      const { width: Wd, length: L } = S.meta, hw = Wd / 2;
      g.lineWidth = 1.2;
      for (let z = 0; z <= L; z += 1.2) seg(g, cam, [-hw, .002, z], [hw, .002, z], d0 => css([30, 28, 24], .5 * Math.exp(-d0 * .05)));
      for (let x = -hw; x <= hw; x += 1.2) seg(g, cam, [x, .002, 0], [x, .002, L], d0 => css([30, 28, 24], .5 * Math.exp(-d0 * .05)));
    }
    for (const l of S.lines) seg(g, cam, l.a, l.b, d0 => css(l.col, Math.exp(-d0 * .04)), l.w);
    g.restore();
    return cam;
  };
  function seg(g, cam, a, b, colf, w) {
    let p = cam.toCam(a), q = cam.toCam(b);
    if (p[2] < NEAR && q[2] < NEAR) return;
    if (p[2] < NEAR) { const k = (NEAR - p[2]) / (q[2] - p[2]); p = p.map((v, i) => v + (q[i] - v) * k); }
    if (q[2] < NEAR) { const k = (NEAR - q[2]) / (p[2] - q[2]); q = q.map((v, i) => v + (p[i] - v) * k); }
    const A = proj(cam, p), B = proj(cam, q), d = (Math.hypot(...p) + Math.hypot(...q)) / 2;
    g.strokeStyle = colf(d); if (w) g.lineWidth = w; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
  }
  function texture(g, q, cpts, sp, cam, d, o) {
    g.save(); g.beginPath(); sp.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
    const P = q.p;
    if (q.tex === 'shutter') {           // horizontal ribs
      for (let k = 1; k < 24; k++) { const t = k / 24; seg(g, cam, lerp3(P[0], P[3], t), lerp3(P[1], P[2], t), d0 => css([40, 40, 44], .55 * Math.exp(-d0 * .05)), 1.5); }
      seg(g, cam, lerp3(P[0], P[1], .5), lerp3(P[3], P[2], .5), d0 => css([50, 50, 54], .3 * Math.exp(-d0 * .05)), 1);
    } else if (q.tex === 'glass') {      // dark shop through glass, a mannequin or two, reflections
      for (let k = 1; k < 4; k++) seg(g, cam, lerp3(P[0], P[1], k / 4), lerp3(P[3], P[2], k / 4), d0 => css([70, 74, 80], .6 * Math.exp(-d0 * .05)), 2);
      const top = lerp3(P[3], P[2], .2), bot = lerp3(P[0], P[1], .2);
      seg(g, cam, bot, top, d0 => css([200, 210, 220], .08), 18);
    } else if (q.tex === 'ceiling') {
      const W2 = (P[1][0] - P[0][0]) / 2;
      for (let z = 0; z < 64; z += 1.2) seg(g, cam, [-W2, P[0][1] - .01, z], [W2, P[0][1] - .01, z], d0 => css([30, 28, 26], .35 * Math.exp(-d0 * .06)), 1);
    }
    g.restore();
  }
  const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  // text on a quad, one letter at a time so each letter gets its own local perspective (no mirroring at grazing angles)
  function quadText(g, q, cam, d, o) {
    const P = q.p, n = q.text.length;                 // P: 0 bottom-left, 1 bottom-right, 2 top-right, 3 top-left (as read)
    const tc = q.emit ? q.textCol : shadeCol(q.textCol, d, o);
    g.save(); g.fillStyle = css(tc); g.font = '64px "Special Elite"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const pad = .06, span = 1 - 2 * pad;
    for (let i = 0; i < n; i++) {
      const ch = q.text[i]; if (ch === ' ') continue;
      const u0 = pad + span * i / n, u1 = pad + span * (i + 1) / n;
      const bl = lerp3(P[0], P[1], u0), br = lerp3(P[0], P[1], u1), tl = lerp3(P[3], P[2], u0);
      const cb = cam.toCam(bl), cr = cam.toCam(br), ct = cam.toCam(tl);
      if (cb[2] < NEAR || cr[2] < NEAR || ct[2] < NEAR) continue;
      const sb = proj(cam, cb), sr = proj(cam, cr), st = proj(cam, ct);
      const ux = [sr[0] - sb[0], sr[1] - sb[1]], uy = [st[0] - sb[0], st[1] - sb[1]];
      if (Math.hypot(...ux) < 2) continue;    // too thin to read
      g.setTransform(ux[0] / 64, ux[1] / 64, -uy[0] / 64, -uy[1] / 64, sb[0] + uy[0], sb[1] + uy[1]);
      g.fillText(ch, 32, 32);
    }
    g.restore();
  }

  // ---------------------------------------------------------------- looks: CCTV and camcorder, VHS damage
  let NOISE;
  function noiseTile() {
    if (NOISE) return NOISE;
    NOISE = []; const R = rng(77);
    for (let k = 0; k < 6; k++) {
      const c = document.createElement('canvas'); c.width = 270; c.height = 203; const g = c.getContext('2d'), im = g.createImageData(270, 203);
      for (let i = 0; i < 270 * 203; i++) { const v = R() * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
      g.putImageData(im, 0, 0); NOISE.push(c);
    }
    return NOISE;
  }
  // grade the raw window (canvas `src`) into `dst` (both TW x TH)
  // the CCTV look for the whole tape: 'cctv' (green, tapes 1-2) or 'mono' (plain black and white). ?look=mono or window.TAPE_CCTV_LOOK
  TK.cctvLook = (typeof location !== 'undefined' && /[?&]look=mono/.test(location.search)) ? 'mono' : ((typeof window !== 'undefined' && window.TAPE_CCTV_LOOK) || 'cctv');
  TK.grade = function (dst, src, t, look, o = {}) {
    if (look === 'cctv') look = TK.cctvLook;
    const g = dst, TW = g.canvas.width, TH = g.canvas.height; g.save();
    if (look === 'cctv') {
      g.filter = `grayscale(1) contrast(${o.contrast || 1.35}) brightness(${o.brightness || 1.25})`;
      g.drawImage(src, 0, 0); g.filter = 'none';
      g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(170,215,180)'; g.fillRect(0, 0, TW, TH);
      g.globalCompositeOperation = 'source-over';
    } else if (look === 'mono') {                                   // 11/12 option: plain black and white (no green), harder blacks
      g.filter = `grayscale(1) contrast(${o.contrast || 1.45}) brightness(${(o.brightness || 1.25) * .82})`;
      g.drawImage(src, 0, 0); g.filter = 'none';
    } else {
      g.filter = `saturate(.75) contrast(1.12) brightness(${o.brightness || 1.05}) sepia(.18)`;
      g.drawImage(src, 0, 0); g.filter = 'none';
    }
    // vignette
    const vg = g.createRadialGradient(TW / 2, TH / 2, TH * .35, TW / 2, TH / 2, TH * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)');
    g.fillStyle = vg; g.fillRect(0, 0, TW, TH);
    // grain
    const N = noiseTile(), fr = Math.floor(t * 30);
    g.globalAlpha = look === 'cctv' || look === 'mono' ? .2 : .12; g.globalCompositeOperation = 'overlay';
    g.drawImage(N[fr % N.length], -(fr * 37 % 60), -(fr * 53 % 40), TW + 80, TH + 60);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // scanlines
    g.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < TH; y += 3) g.fillRect(0, y, TW, 1);
    g.restore();
  };
  // VHS: chroma bleed, tracking band, head-switching noise at the bottom, the odd dropout
  TK.vhs = function (g, t, amt = 1, seed = 1) {
    const R = rng(seed * 1000 + Math.floor(t * 30));
    g.save();
    g.globalCompositeOperation = 'screen'; g.globalAlpha = .22 * amt;
    g.drawImage(g.canvas, 3, 0, TW, TH, 0, 0, TW, TH);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    const by = (t * 90 * (1 + seed % 3)) % (TH + 200) - 100;            // slow tracking band
    const bg = g.createLinearGradient(0, by - 30, 0, by + 30); bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(.5, `rgba(255,255,255,${.07 * amt})`); bg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = bg; g.fillRect(0, by - 30, TW, 60);
    g.fillStyle = `rgba(230,230,230,${.35 * amt})`;                       // head-switching noise
    for (let y = TH - 14; y < TH; y += 2) g.fillRect(R() * 60, y, TW * (.3 + R() * .7), 1);
    if (R() < .25 * amt) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(R() * TW, R() * TH, 20 + R() * 120, 1.5); }
    g.restore();
  };
  // full static (between tapes, at the cut)
  TK.statics = function (g, t, a = 1) {
    const N = noiseTile(), fr = Math.floor(t * 60);
    g.save(); g.globalAlpha = a; g.drawImage(N[fr % N.length], 0, 0, TW, TH);
    g.fillStyle = `rgba(0,0,0,${.25})`; for (let y = 0; y < TH; y += 4) g.fillRect(0, y, TW, 2);
    g.restore();
  };
  // OSD text
  TK.osd = function (g, look, t, o = {}) {
    g.save(); g.font = '46px "VT323"'; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,235,.92)';
    g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 0; g.shadowOffsetX = 2; g.shadowOffsetY = 2;
    if (look === 'cctv') {
      g.textAlign = 'left'; g.fillText(o.cam || 'CAM 01', 36, 28);
      g.textAlign = 'right'; g.fillText(o.place || 'MAIN ENTRANCE', TW - 36, 28);
      g.textAlign = 'left'; g.fillText(o.stamp || '12-31-1999  23:58:00', 36, TH - 78);
      if (Math.floor(t * 1.5) % 2 === 0) { g.textAlign = 'right'; g.fillStyle = 'rgba(255,70,70,.95)'; g.fillText('● REC', TW - 36, TH - 78); }
    } else {
      if (Math.floor(t * 1.6) % 2 === 0) { g.fillStyle = 'rgba(255,60,60,.95)'; g.beginPath(); g.arc(52, 52, 13, 0, 6.2832); g.fill(); }
      g.fillStyle = 'rgba(235,240,235,.92)'; g.textAlign = 'left'; g.fillText('REC', 76, 30);
      g.strokeStyle = 'rgba(235,240,235,.92)'; g.lineWidth = 3; g.strokeRect(TW - 120, 36, 70, 30); g.fillRect(TW - 50, 44, 6, 14);
      const bars = o.battery ?? 2; for (let i = 0; i < bars; i++) g.fillRect(TW - 114 + i * 22, 42, 16, 18);
      g.textAlign = 'right'; g.fillText(o.time || 'PM 11:58', TW - 36, TH - 128); g.fillText(o.date || 'DEC.31.1999', TW - 36, TH - 82);
    }
    g.restore();
  };
  // closed captions inside the tape window (for the PA and the guard)
  TK.caption = function (g, text, a = 1) {
    if (!text || a <= 0) return;
    g.save(); g.globalAlpha = a; g.font = '44px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = text.split('\n'), lh = 50, y0 = TH - 150 - (lines.length - 1) * lh;
    lines.forEach((s, i) => { const w = g.measureText(s).width + 28; g.fillStyle = 'rgba(0,0,0,.82)'; g.fillRect(TW / 2 - w / 2, y0 + i * lh - 24, w, 48); g.fillStyle = '#f2f2f2'; g.fillText(s, TW / 2, y0 + i * lh + 1); });
    g.restore();
  };

  // ---------------------------------------------------------------- the vertical archive-viewer frame (1080x1920)
  TK.WIN_Y = 520;
  TK.frame = function (out, win, o = {}) {
    out.save(); out.setTransform(1, 0, 0, 1, 0, 0);
    out.fillStyle = '#060607'; out.fillRect(0, 0, 1080, 1920);
    // tape label
    const ly = 300;
    out.save(); out.translate(540, ly); out.rotate(-.012);
    out.fillStyle = '#e9e4d6'; out.fillRect(-430, -92, 860, 184);
    out.fillStyle = 'rgba(0,0,0,.08)'; for (let y = -80; y < 92; y += 34) out.fillRect(-410, y, 820, 2);
    out.fillStyle = '#c23b2e'; out.fillRect(-430, -92, 860, 10);
    out.font = '28px "Special Elite"'; out.fillStyle = '#2a2622'; out.textAlign = 'left'; out.textBaseline = 'middle';
    out.fillText('HALLOWAY GALLERIA  —  SECURITY ARCHIVE', -400, -50);
    out.font = '54px "Special Elite"'; out.fillText(o.label || 'TAPE 0001', -400, 10);
    out.font = '28px "Special Elite"'; out.fillText(o.sub || '', -400, 62);
    out.restore();
    // window + bezel
    out.fillStyle = '#000'; out.fillRect(0, TK.WIN_Y - 6, 1080, TH + 12);
    out.drawImage(win, 0, TK.WIN_Y);
    // the rule underneath
    if (o.rule) {
      out.font = '40px "Special Elite"'; out.textAlign = 'center'; out.textBaseline = 'middle';
      const lines = o.rule.split('\n');
      lines.forEach((s, i) => { out.fillStyle = 'rgba(233,228,214,' + (o.ruleAlpha ?? 1) + ')'; out.fillText(s, 540, TK.WIN_Y + TH + 92 + i * 54); });
    }
    out.restore();
  };

  TK.fonts = function (base = 'fonts/') {
    return Promise.all([
      new FontFace('VT323', `url(${base}vt323-400.woff2)`).load(),
      new FontFace('Special Elite', `url(${base}specialelite-400.woff2)`).load(),
    ]).then(fs => fs.forEach(f => document.fonts.add(f)));
  };
})();
