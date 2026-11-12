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
    const items = [], floors = [];
    for (const q of S.q) {
      const cpts = clipNear(q.p.map(p => cam.toCam(p)));
      if (cpts.length < 3) continue;
      const d = cpts.reduce((s, p) => s + Math.hypot(p[0], p[1], p[2]), 0) / cpts.length;
      (q.floor ? floors : items).push({ q, cpts, d });
    }
    // sprites (figures, TK.ghost) go into the painter's order by distance, so pillars, columns and partitions in front of
    // them cover them (owner 11/12: a mannequin showed through a pillar). o.sprites = [{ x, y, z, draw(g, cam) }].
    for (const sp of o.sprites || []) { const c = cam.toCam([sp.x, sp.y ?? .9, sp.z]); if (c[2] > .05) items.push({ sprite: sp, d: Math.hypot(...c) }); }
    floors.sort((a, b) => b.d - a.d); items.sort((a, b) => b.d - a.d);
    for (const it of floors.concat(items)) {
      if (it.sprite) { g.save(); it.sprite.draw(g, cam); g.restore(); continue; }
      const { q, cpts, d } = it;
      const sp = cpts.map(p => proj(cam, p));
      if (q.tex === 'glass' && o.glassAlpha != null) g.globalAlpha = o.glassAlpha;          // see into a shop window
      g.beginPath(); sp.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
      const em = q.emit || 0;
      let col = shadeCol(q.col, d, o);
      if (em > 0) col = q.col.map((v, i) => v * (1 - em) * .5 + (q.light ? 255 : v * 1.6) * em * Math.max(.45, Math.exp(-d * .012)));
      g.fillStyle = css(col); g.fill();
      if (em > .2) { g.save(); g.shadowColor = css(q.light ? [255, 250, 225] : q.col, .9); g.shadowBlur = 40 * em; g.fill(); g.restore(); }
      if (q.tex) texture(g, q, cpts, sp, cam, d, o);
      if (q.text) quadText(g, q, cam, d, o);
      g.globalAlpha = 1;
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
  // the CCTV look (owner 11/12): plain black and white ('mono') from tape 3 on; tapes 1-2 aired green and keep it (their index.html sets
  // window.TAPE_CCTV_LOOK = 'cctv'). ?look=cctv / ?look=mono overrides for tests. Camcorder footage stays colour.
  TK.cctvLook = (typeof location !== 'undefined' && (location.search.match(/[?&]look=(mono|cctv)/) || [])[1]) || ((typeof window !== 'undefined' && window.TAPE_CCTV_LOOK) || 'mono');
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

  // ---------------------------------------------------------------- the three of them (owner 11/12: A, B and E of the design sheet)
  // channel/HORROR_SERIES.md "세 존재". None of them ever shows a face. Drawn in metres, feet at (x, 0, z) in the scene, after TK.render.
  //   TK.ghost(g, cam, 'tall' | 'display' | 'dropout', x, z, { light, seed, tilt, alpha })
  //   cam = the object TK.render returns. light 0..1 (default from distance and fog like the walls), alpha for fades.
  const gpoly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); };
  const gell = (g, x, y, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.2832); g.fillStyle = fill; g.fill(); };
  const gmir = pts => pts.map(([x, y]) => [-x, y]);
  const grgb = (c, k = 1) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
  const GHOSTS = {
    // A, The Tall One: 2.05 m, all black, no face, arms hang too low. CCTV only, far away, closer at every cut
    tall: { h: 2.05, draw(g) {
      const H = 2.05, W = H * .26, Y = y => -H + y, c = 'rgb(6,6,8)';
      gell(g, 0, Y(H * .07), W * .3, H * .075, c);
      gpoly(g, [[-W * .14, H * .13], [W * .14, H * .13], [W * .5, H * .2], [W * .46, H * .55], [W * .52, H * .62], [W * .36, H * .62], [W * .3, H * .58], [W * .24, H], [W * .04, H],
        [0, H * .6], [-W * .04, H], [-W * .24, H], [-W * .3, H * .58], [-W * .36, H * .62], [-W * .52, H * .62], [-W * .46, H * .55], [-W * .5, H * .2]].map(([x, y]) => [x, Y(y)]), c);
    } },
    // B, The Display: a store mannequin in 1999 clothes, blank egg head, seams at the neck and wrists, head tilted.
    // It only moves when no camera looks: the camcorder always finds it where it was, the CCTV finds it somewhere else
    display: { h: 1.86, draw(g, o) {
      // poses (owner 11/12, "it has to be scary": slow, then sudden; wrong-looking movement): o.tilt head angle (snap it),
      // o.neck extra neck length in metres (stretches), o.armR / o.armL raise angle in radians (0 hanging, ~1.4 straight out,
      // reaching), o.lean body tilt. Hold poses for several CCTV frames and change them in one frame (TK.motion).
      const k = o.light, skin = [232, 226, 214], pants = [30, 30, 34], jacket = o.jacket || [40, 104, 116], neck = o.neck || 0;
      if (o.lean) g.rotate(o.lean);
      const arm = (s, a) => {
        g.save(); g.translate(s * .225, -1.44); g.rotate(-s * a); g.translate(-s * .225, 1.44);
        const P = s > 0 ? x => x : gmir;
        gpoly(g, P([[.19, -1.43], [.26, -1.46], [.30, -1.0], [.22, -.98]]), grgb(jacket, k * (s > 0 ? .78 : 1)));
        gell(g, s * .265, -.915, .04, .072, grgb(skin, k * .95), s * .08);
        g.fillStyle = grgb([60, 56, 52], k); g.fillRect(s * .265 - .035, -.985, .07, .008);
        g.restore();
      };
      for (const s of [1, -1]) {
        const P = s > 0 ? x => x : gmir;
        gpoly(g, P([[.02, -.92], [.17, -.92], [.15, -.06], [.04, -.06]]), grgb(pants, k));
        gell(g, s * .095, -.035, .065, .032, grgb(skin, k * .9));
        const a = s > 0 ? (o.armR || 0) : (o.armL || 0);
        if (a < .3) arm(s, a);                                                    // hanging arms go behind the jacket edge
      }
      gpoly(g, [[-.25, -1.47], [.25, -1.47], [.23, -1.38], [.18, -1.05], [.205, -.84], [-.205, -.84], [-.18, -1.05], [-.23, -1.38]], grgb(jacket, k));
      gpoly(g, [[.02, -1.47], [.25, -1.47], [.23, -1.38], [.18, -1.05], [.205, -.84], [.02, -.84]], grgb(jacket, k * .8));
      gpoly(g, [[-.075, -1.47], [.075, -1.47], [0, -1.24]], grgb(skin, k));
      for (const s of [1, -1]) { const a = s > 0 ? (o.armR || 0) : (o.armL || 0); if (a >= .3) arm(s, a); }   // raised arms in front
      g.fillStyle = grgb(skin, k); g.fillRect(-.04, -1.6 - neck, .08, .14 + neck);
      g.fillStyle = grgb([60, 56, 52], k); g.fillRect(-.04, -1.535, .08, .007);
      if (neck > .05) g.fillRect(-.04, -1.535 - neck * .5, .08, .007);                                       // a second seam: it is not a neck
      g.save(); g.translate(.005, -1.69 - neck); g.rotate(o.tilt ?? .22);
      gell(g, 0, 0, .095, .125, grgb(skin, k));
      g.save(); g.beginPath(); g.ellipse(0, 0, .095, .125, 0, 0, 6.2832); g.clip(); gell(g, .07, .02, .07, .14, grgb(skin, k * .78)); g.restore();
      gell(g, -.03, -.05, .022, .04, `rgba(255,255,255,${.55 * Math.min(1, k)})`, -.3);
      g.restore();
    } },
    // ---- monochrome monster looks for B (owner 11/12: "the mannequin is too geometric to be scary"), drawn in ink and
    // charcoal: ragged outlines that boil (re-jittered every frame, o.seed), hatching, no face. Black and white only.
    cracked: { h: 2.0, draw(g, o) { monster(g, 'cracked', o); } },
    hollow: { h: 2.15, draw(g, o) { monster(g, 'hollow', o); } },
    smear: { h: 1.9, draw(g, o) { monster(g, 'smear', o); } },
    // ---- soft silhouettes (owner 11/12, after showing a reference from a horror game: "shapes are not scary at all").
    // Our own designs, not a copy of any game's monster: a soft-edged pure black body that melts into the dark, one
    // impossible proportion, two tiny white points for eyes, nothing else. o.u = px per metre (set by TK.ghost).
    stoop: { h: 2.7, draw(g, o) { silhouette(g, 'stoop', o); } },
    hanger: { h: 2.6, draw(g, o) { silhouette(g, 'hanger', o); } },
    peek: { h: 2.6, draw(g, o) { silhouette(g, 'peek', o); } },
    // ---- v3 (owner 11/12: "too skinny", then "too robot-like": a little bigger than a person, black, grotesque): human anatomy
    // 2.15 m tall, soft black, and wrong in small ways
    crane: { h: 2.15, draw(g, o) { figure(g, 'crane', o); } },
    broken: { h: 2.1, draw(g, o) { figure(g, 'broken', o); } },
    reverse: { h: 2.15, draw(g, o) { figure(g, 'reverse', o); } },
    // E, The Dropout: only on tape. A person-shaped hole where the picture is damaged (rows from elsewhere, dropout lines).
    // Seen only in playback of a recording, never live; it moves when the tape skips
    dropout: { h: 1.78, screen: true },
  };
  // ---------------------------------------------------------------- the monochrome monster drawing (metres, feet at 0, up is -y)
  function inkPoly(g, pts, fill, R, amp, o = {}) {
    // subdivide, push each point out/in by noise (the "boil"), fill; optional ragged ink edge
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], n = 4;
      for (let k = 0; k < n; k++) { const u = k / n; out.push([a[0] + (b[0] - a[0]) * u + (R() - .5) * amp, a[1] + (b[1] - a[1]) * u + (R() - .5) * amp]); }
    }
    g.beginPath(); out.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill();
    if (o.edge) { g.lineWidth = o.edge; g.strokeStyle = o.edgeCol || 'rgb(8,8,8)'; g.lineJoin = 'round'; g.stroke(); }
    return out;
  }
  function hatch(g, clipPts, R, n, len, col, ang = .9, w = .006) {
    g.save(); g.beginPath(); clipPts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of clipPts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), l = len * (.5 + R()); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * l, y + Math.sin(ang) * l); g.stroke(); }
    g.restore();
  }
  function cracks(g, x, y, R, n, len, w) {
    g.strokeStyle = 'rgb(10,10,10)'; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      let px = x + (R() - .5) * .05, py = y + (R() - .5) * .05, a = R() * 6.28; g.lineWidth = w; g.beginPath(); g.moveTo(px, py);
      for (let k = 0; k < 5; k++) { a += (R() - .5) * 1.4; px += Math.cos(a) * len / 5; py += Math.sin(a) * len / 5; g.lineTo(px, py); }
      g.stroke();
    }
  }
  function monster(g, v, o) {
    const R = rng((o.seed || 1) * 131 + (v === 'cracked' ? 1 : v === 'hollow' ? 2 : 3)), boil = .012, k = Math.min(1.2, o.light ?? 1);
    const pale = `rgb(${226 * k | 0},${222 * k | 0},${214 * k | 0})`, mid = `rgb(${120 * k | 0},${118 * k | 0},${114 * k | 0})`, ink = 'rgb(8,8,8)';
    const arm = o.armR || 0, armL = o.armL || 0, neck = o.neck || 0, tilt = o.tilt ?? .25;
    const limb = (x0, y0, x1, y1, w0, w1, col) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      return inkPoly(g, [[x0 + nx * w0, y0 + ny * w0], [x1 + nx * w1, y1 + ny * w1], [x1 - nx * w1, y1 - ny * w1], [x0 - nx * w0, y0 - ny * w0]], col, R, boil, { edge: .012 }); };
    const armTo = (s, a, len) => { const sx = s * .21, sy = -1.42; return [sx, sy, sx + s * Math.sin(a) * len, sy + Math.cos(a) * len]; };   // a = 0 hangs down, raised outward
    if (v === 'cracked') {
      // a broken shop mannequin that stands too tall: the shell split, a black hollow where the face was, arms to the knees, long fingers
      limb(-.09, -.95, -.11, -.05, .055, .04, mid); limb(.09, -.95, .14, -.5, .055, .045, mid); limb(.14, -.5, .1, -.05, .045, .04, mid);   // one knee bends the wrong way
      const torso = inkPoly(g, [[-.26, -1.48], [.21, -1.44], [.19, -1.0], [.22, -.86], [-.23, -.86], [-.2, -1.05]], 'rgb(52,52,52)', R, boil, { edge: .014 });
      hatch(g, torso, R, 40, .08, 'rgba(0,0,0,.55)', 1.1);
      for (const [s, a] of [[1, arm], [-1, armL]]) {
        const [x0, y0, x1, y1] = armTo(s, a, 1.0); limb(x0, y0, x1, y1, .05, .035, mid);
        for (let f = -2; f <= 2; f++) { const fa = Math.atan2(y1 - y0, x1 - x0) + f * .12; limb(x1, y1, x1 + Math.cos(fa) * .17, y1 + Math.sin(fa) * .17, .009, .003, pale); }
      }
      limb(0, -1.47, 0, -1.62 - neck, .04, .035, pale);
      g.fillStyle = ink; for (let y = -1.5; y > -1.6 - neck; y -= .05) g.fillRect(-.04, y, .08, .006);
      g.save(); g.translate(0, -1.72 - neck); g.rotate(tilt);
      const head = inkPoly(g, [[0, -.14], [.085, -.1], [.1, 0], [.07, .1], [0, .135], [-.07, .1], [-.1, 0], [-.085, -.1]], pale, R, .006, { edge: .01 });
      hatch(g, head, R, 14, .05, 'rgba(0,0,0,.35)', .4, .004);
      inkPoly(g, [[-.06, -.02], [.0, -.07], [.07, -.03], [.06, .05], [.01, .09], [-.05, .06]], ink, R, .02);             // the hollow
      cracks(g, 0, -.03, R, 5, .14, .006);
      g.restore();
    } else if (v === 'hollow') {
      // too thin, too long, pale porcelain cracked all over, hunched, the head hanging sideways on a long neck, hands near the floor
      limb(-.07, -1.0, -.09, -.04, .04, .03, pale); limb(.07, -1.0, .1, -.04, .04, .03, pale);
      const torso = inkPoly(g, [[-.2, -1.6], [.18, -1.62], [.13, -1.25], [.1, -.98], [-.11, -.98], [-.15, -1.25]], pale, R, boil, { edge: .012 });
      cracks(g, 0, -1.3, R, 7, .22, .005); hatch(g, torso, R, 20, .1, 'rgba(0,0,0,.25)', 1.3, .004);
      for (const [s, a] of [[1, arm], [-1, armL]]) {
        const sx = s * .18, sy = -1.58, aa = .12 + a * .9, x1 = sx + s * Math.sin(aa) * .75, y1 = sy + Math.cos(aa) * .75;
        limb(sx, sy, x1, y1, .035, .03, pale); const x2 = x1 + s * .05, y2 = y1 + .62; limb(x1, y1, x2, y2, .03, .02, pale);   // elbows that bend outward
        for (let f = -2; f <= 2; f++) limb(x2, y2, x2 + f * .025, y2 + .16, .007, .002, pale);
      }
      g.save(); g.translate(.02, -1.62); g.rotate(.9 + tilt * .5);
      limb(0, 0, 0, -.32 - neck, .03, .028, pale); g.translate(0, -.42 - neck); g.rotate(.4);
      const head = inkPoly(g, [[0, -.13], [.08, -.09], [.095, 0], [.06, .1], [0, .12], [-.06, .1], [-.095, 0], [-.08, -.09]], pale, R, .006, { edge: .01 });
      cracks(g, 0, 0, R, 4, .12, .005); hatch(g, head, R, 10, .05, 'rgba(0,0,0,.3)', .4, .004);
      g.restore();
    } else {
      // the smear: a dark suited figure whose head is a vertical motion smear (it moved too fast for the tape), ragged photocopy edges
      limb(-.09, -.92, -.1, -.04, .06, .05, 'rgb(20,20,20)'); limb(.09, -.92, .1, -.04, .06, .05, 'rgb(20,20,20)');
      const torso = inkPoly(g, [[-.25, -1.46], [.25, -1.46], [.22, -.88], [-.22, -.88]], 'rgb(28,28,28)', R, boil * 2, { edge: .016 });
      hatch(g, torso, R, 30, .1, 'rgba(255,255,255,.12)', -1.2, .005);
      for (const [s, a] of [[1, arm], [-1, armL]]) { const [x0, y0, x1, y1] = armTo(s, a, .62); limb(x0, y0, x1, y1, .05, .04, 'rgb(24,24,24)'); limb(x1, y1, x1 + s * .01, y1 + .07, .03, .02, pale); }
      limb(0, -1.45, 0, -1.58 - neck, .04, .035, pale);
      g.save(); g.translate(0, -1.7 - neck); g.rotate(tilt * .3);
      for (let i = 0; i < 26; i++) { const yy = -.3 + R() * .6, w = .09 * (1 - Math.abs(yy) * 1.4) + R() * .03, a = .25 + R() * .55;
        g.fillStyle = `rgba(${R() < .5 ? '236,232,224' : '10,10,10'},${a})`; g.fillRect(-w + (R() - .5) * .03, yy, w * 2, .015 + R() * .03); }
      g.restore();
    }
  }
  // ---------------------------------------------------------------- soft silhouette drawing (metres, feet at 0, up is -y)
  // all parts are filled sharp into one offscreen mask (one union, no seams), then the mask is drawn blurred: a haze, then the body
  const SOFT = {};
  function softFill(g, o, path, haze = 1) {
    const u = o.u || 300, a = o.alpha ?? 1, parts = Array.isArray(path) ? path : [path], W = g.canvas.width, H = g.canvas.height;
    const key = W + 'x' + H, oc = SOFT[key] || (SOFT[key] = document.createElement('canvas')); oc.width = W; oc.height = H;
    const m = oc.getContext('2d'); m.setTransform(g.getTransform()); m.fillStyle = 'rgb(5,5,6)';
    // every sub-shape is filled on its own (no winding holes where parts overlap, no stray lines into an ellipse)
    const px = new Proxy(m, { get(t, k) {
      if (k === 'moveTo') return (x, y) => { t.fill(); t.beginPath(); t.moveTo(x, y); };
      if (k === 'ellipse' || k === 'arc') return (...a) => { t.fill(); t.beginPath(); t[k](...a); };
      const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }, set(t, k, v) { t[k] = v; return true; } });
    for (const p of parts) { m.beginPath(); p(px); m.fill(); }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.filter = `blur(${Math.max(3, u * .09).toFixed(1)}px)`; g.globalAlpha = .55 * haze * a * (g.globalAlpha ?? 1); g.drawImage(oc, 0, 0);
    g.filter = `blur(${Math.max(1, u * .012).toFixed(1)}px)`; g.globalAlpha = a; g.drawImage(oc, 0, 0);
    g.restore();
  }
  function eyes(g, o, x, y, gap, r) {
    const u = o.u || 300, a = o.alpha ?? 1;
    g.save(); g.filter = `blur(${Math.max(.6, u * .004).toFixed(1)}px)`; g.fillStyle = `rgba(255,255,255,${.95 * a})`;
    g.beginPath(); g.ellipse(x - gap, y, r, r * .8, 0, 0, 6.2832); g.ellipse(x + gap, y + r * .35, r * .8, r * .7, 0, 0, 6.2832); g.fill();   // not quite level
    g.filter = `blur(${Math.max(2, u * .02).toFixed(1)}px)`; g.fillStyle = `rgba(255,255,255,${.35 * a})`; g.beginPath(); g.ellipse(x, y, gap * 2.2, r * 2, 0, 0, 6.2832); g.fill();
    g.restore();
  }
  // a long limb as a tapering curved stroke-shape from p0 to p2 bending through p1
  function limbPath(g, p0, p1, p2, w0, w2) {
    const n = 14, L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], y = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1];
      const dx = 2 * (1 - u) * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]), dy = 2 * (1 - u) * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]), d = Math.hypot(dx, dy) || 1, w = w0 + (w2 - w0) * u;
      L.push([x - dy / d * w, y + dx / d * w]); R.push([x + dy / d * w, y - dx / d * w]);
    }
    g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (const p of R.reverse()) g.lineTo(p[0], p[1]); g.closePath();
  }
  function silhouette(g, kind, o) {
    const reach = o.armR || 0, tilt = o.tilt ?? 0;
    const ch = o.charge || 0;                                                     // 0 standing, 1 running at the camera
    if (kind === 'stoop') {
      // big and heavy (owner 11/12: "too skinny, no strength"): a back like a wall, shoulders as wide as the corridor, the small
      // head sunk low between them and pushed forward, arms thicker than legs with hands that hang at the knees; knees bent, ready
      const lean = .12 + ch * .45, P = [];
      // legs: thick, bent; in a stride when charging
      for (const s of [-1, 1]) { const st = ch * s * .35;
        P.push(gg => limbPath(gg, [s * .16, -1.15], [s * .24 + st * .5, -.62], [s * .17 + st, 0], .12, .075)); }
      P.push(gg => { gg.save(); gg.translate(0, -1.15); gg.rotate(lean);
        gg.moveTo(-.22, 0); gg.bezierCurveTo(-.3, -.35, -.62, -.62, -.6, -.95); gg.bezierCurveTo(-.58, -1.18, -.3, -1.3, 0, -1.28);   // back and left shoulder
        gg.bezierCurveTo(.3, -1.3, .58, -1.18, .6, -.95); gg.bezierCurveTo(.62, -.62, .3, -.35, .22, 0); gg.closePath(); gg.restore(); });
      P.push(gg => { gg.save(); gg.translate(0, -1.15); gg.rotate(lean); gg.ellipse(.04, -1.32, .13, .12, 0, 0, 6.2832); gg.restore(); });   // small head, sunk in
      for (const s of [-1, 1]) {
        const ra = s > 0 ? reach : 0, sw = ch * -s * .25;
        P.push(gg => { gg.save(); gg.translate(0, -1.15); gg.rotate(lean);
          const sx = s * .52, sy = -1.0, ex = s * (.66 + ra * .4) + sw * .3, ey = -.4 - ra * .45, hx = s * (.6 + ra * 1.0) + sw, hy = .25 - ra * 1.0 - ch * .2;
          limbPath(gg, [sx, sy], [ex, ey], [hx, hy], .14, .09);
          gg.moveTo(hx + .12, hy + .06); gg.ellipse(hx, hy + .06, .12, .14, 0, 0, 6.2832);                                                // big hands
          for (let f = -2; f <= 2; f++) { gg.moveTo(hx, hy); limbPath(gg, [hx + f * .04, hy + .12], [hx + f * .05, hy + .26], [hx + f * .06, hy + .38], .02, .006); }
          gg.restore(); });
      }
      softFill(g, o, P);
      g.save(); g.translate(0, -1.15); g.rotate(lean); eyes(g, o, .07, -1.33, .04, .014); g.restore();
    } else if (kind === 'hanger') {
      // a huge, heavy overcoat on a wide wooden-and-wire hanger: square shoulders wider than a doorway, the coat flaring to the
      // floor, thick sleeves with big hands; the hook where the head should be. Leans in; the coat swings when it runs
      const lean = .08 + ch * .4, P = [];
      P.push(gg => { gg.save(); gg.rotate(lean * .5); gg.translate(0, 0);
        gg.moveTo(-.62, -1.95); gg.lineTo(.62, -1.95); gg.bezierCurveTo(.66, -1.5, .7, -.9, .78 + ch * .2, -.22);
        gg.lineTo(.5, -.3); gg.lineTo(.3, -.16); gg.lineTo(.06, -.28); gg.lineTo(-.2, -.14); gg.lineTo(-.46, -.27); gg.lineTo(-.78 - ch * .1, -.2);
        gg.bezierCurveTo(-.7, -.9, -.66, -1.5, -.62, -1.95); gg.closePath(); gg.restore(); });
      P.push(gg => { gg.save(); gg.rotate(lean * .5); gg.moveTo(-.25, -1.95); gg.lineTo(0, -2.12); gg.lineTo(.25, -1.95); gg.closePath(); gg.restore(); });   // the high collar
      for (const s of [-1, 1]) {
        const ra = s > 0 ? reach : 0, sw = ch * -s * .3;
        P.push(gg => { gg.save(); gg.rotate(lean * .5);
          const sx = s * .6, sy = -1.9, ex = s * (.8 + ra * .4) + sw * .3, ey = -1.25 - ra * .3, hx = s * (.78 + ra * 1.0) + sw, hy = -.55 - ra * .8;
          limbPath(gg, [sx, sy], [ex, ey], [hx, hy], .16, .12);
          gg.moveTo(hx + .1, hy + .1); gg.ellipse(hx, hy + .1, .1, .13, 0, 0, 6.2832);
          for (let f = -2; f <= 2; f++) { gg.moveTo(hx, hy); limbPath(gg, [hx + f * .035, hy + .18], [hx + f * .045, hy + .3], [hx + f * .05, hy + .42], .018, .005); }
          gg.restore(); });
      }
      for (const s of [-1, 1]) P.push(gg => { gg.save(); gg.rotate(lean * .5); limbPath(gg, [s * .18, -.3], [s * .2 + ch * s * .2, -.15], [s * .19 + ch * s * .3, 0], .06, .05); gg.restore(); });
      softFill(g, o, P);
      const u = o.u || 300; g.save(); g.rotate(lean * .5); g.filter = `blur(${Math.max(.6, u * .004).toFixed(1)}px)`; g.strokeStyle = `rgba(8,8,9,${o.alpha ?? 1})`; g.lineWidth = .04; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -2.08); g.lineTo(0, -2.3); g.bezierCurveTo(0, -2.52, .2, -2.55, .21, -2.42); g.bezierCurveTo(.22, -2.32, .11, -2.29, .1, -2.35); g.stroke();
      g.restore();
      g.save(); g.rotate(lean * .5); eyes(g, o, 0, -1.98, .045, .014); g.restore();
    } else {
      // peek: leans out sideways from behind something at an angle a body cannot hold; only the upper body, the neck too long
      const lean = .95 + tilt * .2;
      const body = gg => {
        gg.save(); gg.translate(0, -1.2); gg.rotate(-lean);
        gg.moveTo(-.12, 0); gg.bezierCurveTo(-.16, -.4, -.17, -.8, -.12, -1.0); gg.bezierCurveTo(-.05, -1.08, .05, -1.08, .12, -1.0); gg.bezierCurveTo(.17, -.8, .16, -.4, .12, 0); gg.closePath();
        gg.moveTo(0, 0); limbPath(gg, [0, -1.0], [.03, -1.35], [.18, -1.55], .03, .028); gg.moveTo(0, 0); gg.ellipse(.24, -1.6, .085, .11, .9, 0, 6.2832);
        gg.moveTo(0, 0); limbPath(gg, [-.12, -.95], [-.4, -1.0], [-.55, -.8], .03, .014);
        for (let f = -1; f <= 1; f++) { gg.moveTo(0, 0); limbPath(gg, [-.55, -.8], [-.6, -.74 + f * .03], [-.62, -.62 + f * .04], .006, .002); }
        gg.restore();
      };
      softFill(g, o, body, .8);
      g.save(); g.translate(0, -1.2); g.rotate(-lean); eyes(g, o, .26, -1.6, .025, .01); g.restore();
    }
  }
  // ---------------------------------------------------------------- a human-shaped figure, a little too big and wrong (metres)
  // limb3: a curved limb p0 -> p1 -> p2 with three widths (start, middle, end): muscle, not a tube
  function limb3(g, p0, p1, p2, w0, wm, w2) {
    const n = 16, L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], y = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1];
      const dx = 2 * (1 - u) * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]), dy = 2 * (1 - u) * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]), d = Math.hypot(dx, dy) || 1;
      const w = u < .5 ? w0 + (wm - w0) * Math.sin(u * Math.PI) : wm + (w2 - wm) * (1 - Math.sin(u * Math.PI));
      L.push([x - dy / d * w, y + dx / d * w]); R.push([x + dy / d * w, y - dx / d * w]);
    }
    g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (const p of R.reverse()) g.lineTo(p[0], p[1]); g.closePath();
  }
  // a two-segment limb from a to joint to b; bend > 0 pushes the joint sideways (to make it bend the wrong way, flip the sign)
  function jointed(g, a, j, b, w, curve = .025) {
    const mid = (p, q, k) => { const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1; return [(p[0] + q[0]) / 2 - dy / d * k, (p[1] + q[1]) / 2 + dx / d * k]; };
    limb3(g, a, mid(a, j, curve), j, w[0], w[1], w[2]);                     // a slight muscle curve on each segment
    limb3(g, j, mid(j, b, -curve), b, w[2], w[3], w[4]); g.ellipse(j[0], j[1], w[2] * 1.05, w[2] * 1.05, 0, 0, 6.2832);
  }
  function figure(g, v, o) {
    const ch = o.charge || 0, reach = o.armR || 0, P = [];
    const lean = (v === 'crane' ? .1 : v === 'reverse' ? .06 : .04) + ch * .3, tiltX = o.tilt ?? 0;
    const shL = v === 'crane' ? -1.80 : v === 'broken' ? -1.74 : -1.80, shR = v === 'crane' ? -1.74 : -1.82;   // uneven shoulders
    // legs (knees forward, or backward for 'reverse'); a stride when it runs
    for (const s of [-1, 1]) {
      const st = ch * s * .32, kneeX = s * .13 + st * .5 + (v === 'reverse' ? -.12 : .05) * (1 + ch), hip = [s * .1, -1.02], foot = [s * .12 + st, -.03];
      P.push(gg => jointed(gg, hip, [kneeX, -.55], foot, [.085, .09, .055, .06, .035]));
      P.push(gg => { gg.ellipse(foot[0] + .05, -.025, .1, .03, 0, 0, 6.2832); });
    }
    // torso: chest, waist, hips; leaning, a little twisted
    P.push(gg => { gg.save(); gg.translate(0, -1.02); gg.rotate(lean);
      gg.moveTo(-.16, .02); gg.bezierCurveTo(-.17, -.1, -.11, -.22, -.12, -.34); gg.bezierCurveTo(-.17, -.5, -.23, -.64, -.22, shL + 1.02 + .06);
      gg.bezierCurveTo(-.2, shL + 1.02 - .02, -.09, shL + 1.02 - .04, -.05, shL + 1.02 - .1); gg.lineTo(.05, shR + 1.02 - .1);
      gg.bezierCurveTo(.09, shR + 1.02 - .04, .2, shR + 1.02 - .02, .22, shR + 1.02 + .06); gg.bezierCurveTo(.23, -.64, .17, -.5, .12, -.34);
      gg.bezierCurveTo(.11, -.22, .17, -.1, .16, .02); gg.closePath(); gg.restore(); });
    // neck and head
    const neckLen = v === 'crane' ? .26 : v === 'broken' ? .22 : .14, headAng = v === 'broken' ? 1.35 + tiltX : v === 'crane' ? .45 + tiltX : .15 + tiltX;
    const nb = [0, -1.02 - Math.cos(lean) * .8 + .02];
    const headAt = (gg, draw) => { gg.save(); gg.translate(0, -1.02); gg.rotate(lean); gg.translate(0, -.8);
      const nx = Math.sin(headAng) * neckLen * .9, ny = -Math.cos(headAng * .55) * neckLen; draw(gg, nx, ny); gg.restore(); };
    P.push(gg => headAt(gg, (q, nx, ny) => { limb3(q, [0, 0], [nx * .3, ny * .6], [nx, ny], .05, .045, .042); q.moveTo(0, 0);
      q.save(); q.translate(nx, ny); q.rotate(headAng); q.ellipse(0, -.1, .085, .13, 0, 0, 6.2832); q.restore(); }));
    // arms: long, thin wrists, long fingers; one longer for 'broken'; elbows backward for 'reverse'
    for (const s of [-1, 1]) {
      const ra = s > 0 ? reach : 0, sw = ch * -s * .35, longer = v === 'broken' && s < 0 ? .14 : 0;
      P.push(gg => { gg.save(); gg.translate(0, -1.02); gg.rotate(lean);
        const sy = (s < 0 ? shL : shR) + 1.02 + .05, a = [s * .25, sy];
        const elbow = [s * (.3 + ra * .35) + (v === 'reverse' ? -s * .0 + .08 : -.02) + sw * .3, sy + .42 - ra * .2];
        const hand = [s * (.29 + ra * .9) + sw, sy + .86 + longer - ra * .75 - ch * .1];
        jointed(gg, a, elbow, hand, [.065, .06, .045, .042, .028]);
        for (let f = -2; f <= 2; f++) { gg.moveTo(0, 0); limb3(gg, hand, [hand[0] + f * .02, hand[1] + .1], [hand[0] + f * .03, hand[1] + .2], .014, .011, .004); }
        gg.restore(); });
    }
    softFill(g, o, P, .9);
    headAt(g, (q, nx, ny) => { q.translate(nx, ny); q.rotate(headAng); eyes(q, o, 0, -.12, .03, .011); });
  }
  const HUMAN = [[-.05, -1.55], [.05, -1.55], [.21, -1.47], [.26, -1.38], [.28, -.88], [.22, -.86], [.2, -1.2], [.17, -.9], [.15, -.05], [.03, -.05], [0, -.82], [-.03, -.05], [-.15, -.05], [-.17, -.9], [-.2, -1.2], [-.22, -.86], [-.28, -.88], [-.26, -1.38], [-.21, -1.47]];
  function humanPath(g, fx, fy, u) {
    g.beginPath(); HUMAN.forEach(([x, y], i) => { const X = fx + x * u, Y = fy + y * u; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath();
    g.moveTo(fx + .095 * u, fy - 1.66 * u); g.ellipse(fx, fy - 1.66 * u, .095 * u, .12 * u, 0, 0, 6.2832);
  }
  function dropout(g, fx, fy, u, seed) {
    const R = rng(seed), snap = document.createElement('canvas'); snap.width = g.canvas.width; snap.height = g.canvas.height; snap.getContext('2d').drawImage(g.canvas, 0, 0);
    const top = fy - 1.8 * u, bot = fy, bh = Math.max(2, Math.round(u * .035));
    g.save(); humanPath(g, fx, fy, u); g.clip();
    for (let y = top; y < bot; y += bh) {
      const dx = (R() - .5) * u * 1.2, dy = (R() - .5) * u * .9;
      g.drawImage(snap, 0, y + dy, snap.width, bh, dx, y, snap.width, bh);
      const v = R(); if (v < .45) { g.fillStyle = `rgba(${v < .2 ? '235,235,235' : '10,10,12'},${.25 + R() * .4})`; g.fillRect(fx - .4 * u, y, .8 * u, bh); }
    }
    for (let i = 0; i < 18; i++) { const y = top + R() * (bot - top); g.fillStyle = `rgba(255,255,255,${.5 + R() * .45})`; g.fillRect(fx - .4 * u, y, .8 * u, Math.max(1, u * .006 + R() * u * .01)); }
    g.restore();
    g.save(); g.globalCompositeOperation = 'screen'; g.lineWidth = Math.max(1, u * .006);
    g.translate(-u * .025, 0); humanPath(g, fx, fy, u); g.strokeStyle = 'rgba(40,220,255,.22)'; g.stroke();
    g.translate(u * .05, 0); humanPath(g, fx, fy, u); g.strokeStyle = 'rgba(255,40,180,.2)'; g.stroke();
    g.restore();
  }
  // ---------------------------------------------------------------- how they move (owner 11/12: "it has to be scary")
  // The rule: still for a long time, then wrong. Slow creep, then one sudden move; stutter (held frames, then a jump);
  // a snap (a pose changes in a single frame); a lunge (accelerating at the lens). One big scare per tape at most.
  TK.motion = {
    creep: (t, t0, t1, a, b) => a + (b - a) * Math.pow(clamp((t - t0) / (t1 - t0)), 2.2),          // slow, slower at the start
    snap: (t, t0, a, b) => (t < t0 ? a : b),
    lunge: (t, t0, dur) => Math.pow(clamp((t - t0) / dur), 3),                                     // 0..1, accelerating
    // irregular held frames: the movement only advances on some frames (1-4 frame holds), like a broken recorder
    stutter: (t, fps = 6, seed = 1) => { const f = Math.floor(t * fps), R = rng(seed * 977 + Math.floor(f / 4)), hold = 1 + Math.floor(R() * 3); return Math.floor(f / hold) * hold / fps; },
  };
  TK.ghostKinds = GHOSTS;
  TK.ghost = function (g, cam, kind, x, z, o = {}) {
    const D = GHOSTS[kind], prj = p => { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; };
    const feet = prj([x, 0, z]), head = prj([x, D.h, z]); if (!feet || !head) return null;
    const u = (feet[1] - head[1]) / D.h, d = feet[2];
    const light = o.light ?? Math.min(1, (o.ambient ?? 1.1) * Math.exp(-d * (o.fog ?? .045)) * .9);
    g.save(); g.globalAlpha = o.alpha ?? 1;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(feet[0], feet[1], .32 * u, .06 * u, 0, 0, 6.2832); g.fill();
    if (D.screen) dropout(g, feet[0], feet[1], u, o.seed ?? 7);
    else { g.translate(feet[0], feet[1]); g.rotate(-Math.atan2(head[0] - feet[0], feet[1] - head[1])); g.scale(u, u); D.draw(g, Object.assign({ light, u }, o)); }
    g.restore();
    return { feet, head, u };
  };
  TK.ghost._draw = (g, kind, o) => GHOSTS[kind].draw(g, Object.assign({ light: 1 }, o));

  TK.fonts = function (base = 'fonts/') {
    return Promise.all([
      new FontFace('VT323', `url(${base}vt323-400.woff2)`).load(),
      new FontFace('Special Elite', `url(${base}specialelite-400.woff2)`).load(),
    ]).then(fs => fs.forEach(f => document.fonts.add(f)));
  };
})();
