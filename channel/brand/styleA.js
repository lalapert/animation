// Style A, "anime series HD" (owner's choice 11/7: Volt Labs from episode 1, Void Mart from season 2).
// The same rigs and sets, finished like a modern TV anime frame:
//   - set outlines thinner and tinted by their fill (TOON.lineFn), characters keep one dark ink
//   - every character gets a form shadow on the side away from the key light and a rim light on the side toward it
//   - per frame: light pools (light map), bloom from the bright parts, soft diffusion, vignette, fine grain
// Use (load after toon.js, lab.js, vmkit.js and the set kit, before film.js):
//   init:   await toonFonts(...); STYLE_A.on(LAB_A); buildLab(); ...
//   render: drawScene(t); STYLE_A.frame(c, t); composeFrame(OUT, SC, t);
// Subtitles are drawn by composeFrame after the frame pass, so they stay crisp.
'use strict';
const STYLE_A = (() => {
  const pool = {};
  const get = (k, w, h) => { let x = pool[k]; if (!x || x.width !== w || x.height !== h) { x = pool[k] = document.createElement('canvas'); x.width = w; x.height = h; } return x; };
  const hx = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
  const darker = (h, k) => { const A = hx(h), B = [12, 6, 32]; return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  let cfg = null, grainTiles = null, vig = null;

  function lineFromFill(f) { return typeof f === 'string' && /^#[0-9a-f]{3,6}$/i.test(f) ? darker(f, cfg.lineK) : TOON.ink; }

  // pixels of silhouette L whose neighbour at (dx, dy) is outside it: the edge that faces (dx, dy)
  function edge(L, key, dx, dy, col) {
    const m = get(key, L.width, L.height), c = m.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'copy'; c.drawImage(L, 0, 0);
    c.globalCompositeOperation = 'destination-out'; c.drawImage(L, -dx, -dy);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, m.width, m.height);
    c.globalCompositeOperation = 'source-over'; return m;
  }
  function shadeChar(L, F, side) {
    const lc = L.getContext('2d'); lc.save(); lc.setTransform(1, 0, 0, 1, 0, 0);
    // form shadow: multiply inside the silhouette only (blend on a copy, paste back atop)
    const sh = edge(L, 'e1', -side * .13 * F, .05 * F, cfg.shadow), t = get('tmp', L.width, L.height), tc = t.getContext('2d');
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'copy'; tc.drawImage(L, 0, 0);
    tc.globalCompositeOperation = 'multiply'; tc.globalAlpha = cfg.shadowA; tc.filter = `blur(${Math.max(.5, .02 * F)}px)`; tc.drawImage(sh, 0, 0);
    tc.filter = 'none'; tc.globalAlpha = 1; tc.globalCompositeOperation = 'source-over';
    lc.globalCompositeOperation = 'source-atop'; lc.drawImage(t, 0, 0);
    // rim light toward the key
    const rim = edge(L, 'e2', side * .032 * F, -.016 * F, cfg.rim);
    lc.globalAlpha = cfg.rimA; lc.filter = `blur(${Math.max(.4, .006 * F)}px)`; lc.drawImage(rim, 0, 0);
    lc.restore();
  }
  function wrapChar(name) {
    const f = window[name]; if (typeof f !== 'function' || f.__styleA) return;
    const w = function (g, x, y, s, o) {
      const T = g.getTransform(), L = get('char', g.canvas.width, g.canvas.height), lc = L.getContext('2d');
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, L.width, L.height); lc.setTransform(T);
      const lf = TOON.lineFn; TOON.lineFn = null;
      try { f(lc, x, y, s, o); } finally { TOON.lineFn = lf; }
      const F = Math.abs(s) * Math.hypot(T.a, T.b), side = Math.sign((cfg.key ? cfg.key.x : x + 1) - x) || 1;
      if (F > 12) shadeChar(L, F, side);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(L, 0, 0); g.restore();
    };
    w.__styleA = true; window[name] = w;
  }

  function on(o) {
    cfg = Object.assign({
      ink: '#22142f', lw: 3.8, lineK: .55, shadow: '#3d4a7a', shadowA: .42, rim: '#ffe7b8', rimA: .85,
      ambient: '#bdb6dc', lights: [], key: null, bloom: .6, bloomThr: 232, diffusion: .035, vignette: .42, grain: .045,
      chars: ['drawVera2', 'drawCleo2', 'drawBright', 'drawRae2', 'drawPip2', 'drawMags'],
    }, o);
    TOON.ink = cfg.ink; TOON.LW = cfg.lw; TOON.lineFn = lineFromFill;
    for (const n of cfg.chars) wrapChar(n);
    grainTiles = [0, 1, 2, 3].map(i => { const g = document.createElement('canvas'); g.width = g.height = 256; const x = g.getContext('2d'), d = x.createImageData(256, 256); let a = 9 + i * 7919; for (let p = 0; p < d.data.length; p += 4) { a = a * 16807 % 2147483647; const v = a / 2147483647 * 255; d.data[p] = d.data[p + 1] = d.data[p + 2] = v; d.data[p + 3] = 255; } x.putImageData(d, 0, 0); return g; });
  }

  // the camera of the current shot, if the film has one (vmkit shotAt + the film's CAM table)
  function camNow(t) {
    if (typeof shotAt !== 'function' || typeof CAM === 'undefined') return null;
    const s = shotAt(t), cam = CAM[s[0]]; if (!cam) return null;
    return { cam, sk: (t - s[1]) / Math.max(.01, s[2] - s[1]) };
  }
  function frame(g, t, extraLights) {
    if (!cfg) return;
    const W = g.canvas.width, H = g.canvas.height;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    // 1. light map: ambient everywhere, pools where the lights are, multiplied over the frame
    const cn = camNow(t), lights = cfg.lights.concat(extraLights || []);
    if (cn && lights.length) {
      const L = get('lm', W, H), c = L.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'copy'; c.fillStyle = cfg.ambient; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'lighter';
      for (const l of lights) {
        const [x, y, z] = l.screen ? [l.x, l.y, 1] : toScreen(cn.cam, cn.sk, l.x, l.y), r = l.r * z;
        if (x < -r || x > W + r || y < -r || y > H + r) continue;
        const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(l.col, l.a)); gr.addColorStop(.55, rgba(l.col, l.a * .42)); gr.addColorStop(1, rgba(l.col, 0));
        c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2);
      }
      c.globalCompositeOperation = 'source-over';
      g.globalCompositeOperation = 'multiply'; g.drawImage(L, 0, 0);
    }
    // 2. bloom from the bright parts (a quarter-size bright pass), and a soft diffusion of the whole picture
    const q = get('q', W >> 2, H >> 2), qc = q.getContext('2d', { willReadFrequently: true });
    qc.setTransform(1, 0, 0, 1, 0, 0); qc.globalCompositeOperation = 'copy'; qc.filter = 'none'; qc.drawImage(g.canvas, 0, 0, q.width, q.height);
    const d2 = get('d2', q.width, q.height), dc = d2.getContext('2d'); dc.globalCompositeOperation = 'copy'; dc.filter = 'blur(4px)'; dc.drawImage(q, 0, 0); dc.filter = 'none';
    const id = qc.getImageData(0, 0, q.width, q.height), a = id.data, thr = cfg.bloomThr;
    for (let i = 0; i < a.length; i += 4) { const l = .3 * a[i] + .59 * a[i + 1] + .11 * a[i + 2], k = l <= thr ? 0 : (l - thr) / (255 - thr); a[i] *= k; a[i + 1] *= k; a[i + 2] *= k; }
    qc.putImageData(id, 0, 0);
    const b1 = get('b1', q.width, q.height), b1c = b1.getContext('2d');
    g.globalCompositeOperation = 'screen';
    for (const [r, k] of [[3, .9], [10, .75], [26, .55]]) { b1c.globalCompositeOperation = 'copy'; b1c.filter = `blur(${r}px)`; b1c.drawImage(q, 0, 0); b1c.filter = 'none'; g.globalAlpha = cfg.bloom * k; g.drawImage(b1, 0, 0, W, H); }
    g.globalAlpha = cfg.diffusion; g.drawImage(d2, 0, 0, W, H);
    // 3. vignette and grain
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (!vig || vig.width !== W || vig.height !== H) { vig = document.createElement('canvas'); vig.width = W; vig.height = H; const v = vig.getContext('2d'), R = Math.hypot(W, H) / 2, gr = v.createRadialGradient(W / 2, H / 2, R * .45, W / 2, H / 2, R); gr.addColorStop(0, 'rgba(11,6,24,0)'); gr.addColorStop(1, `rgba(11,6,24,${cfg.vignette})`); v.fillStyle = gr; v.fillRect(0, 0, W, H); }
    g.drawImage(vig, 0, 0);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = cfg.grain; g.fillStyle = g.createPattern(grainTiles[Math.floor(t * 15) % 4], 'repeat'); g.fillRect(0, 0, W, H);
    g.restore();
  }
  return { on, frame, get cfg() { return cfg; } };
})();
