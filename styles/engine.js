// Watercolour brush engine for "A Year on the Sill" (written for this film).
// Strokes = variable-width ribbon at partial opacity + dashed bristle tracks (dry-brush flying white).
// Washes = the same polygon in 3 jittered passes, so edges pool darker. Everything deterministic.
'use strict';

// ---------- RNG & maths ----------
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let RNG = mulberry(1);
function rnd(a = 0, b = 1) { return a + (b - a) * RNG(); }
function withSeed(s, fn) { const prev = RNG; RNG = mulberry(s); try { return fn(); } finally { RNG = prev; } }
function hash1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = u => { u = clamp(u); return u * u * (3 - 2 * u); };
const eio = u => { u = clamp(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const eo = u => { u = clamp(u); return 1 - Math.pow(1 - u, 3); };
const ei = u => { u = clamp(u); return u * u * u; };
function vnoise(x, s = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash1(i + s * 57.31), hash1(i + 1 + s * 57.31), u);
}
// keyframe track with per-segment easing: K = [[t, v], ...] (v number or array)
function track(K, ease = eio) {
  return t => {
    if (t <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) {
      if (t <= K[i][0]) {
        const [t0, v0] = K[i - 1], [t1, v1] = K[i], u = ease((t - t0) / (t1 - t0));
        return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], u)) : lerp(v0, v1, u);
      }
    }
    return K[K.length - 1][1];
  };
}

// ---------- colour ----------
function hex(c) { if (Array.isArray(c)) return c; c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
function rgba(c, a) { const [r, g, b] = hex(c); return `rgba(${r | 0},${g | 0},${b | 0},${clamp(a)})`; }
function mixc(a, b, u) { a = hex(a); b = hex(b); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
function shade(c, k) { return hex(c).map(v => clamp(v * k, 0, 255)); }

// ---------- centre lines ----------
function qcurve(x0, y0, x1, y1, bend = 0, n = 12) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const cx = (x0 + x1) / 2 - dy / L * bend, cy = (y0 + y1) / 2 + dx / L * bend, P = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    P.push([(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1]);
  }
  return P;
}
function polar(x, y, ang, len, bend = 0, n = 12) { return qcurve(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len, bend, n); }
function resample(pts, step) {
  const out = [pts[0].slice()];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    let d = Math.hypot(bx - ax, by - ay);
    while (acc + d >= step) {
      const u = (step - acc) / d;
      ax += (bx - ax) * u; ay += (by - ay) * u;
      out.push([ax, ay]);
      d = Math.hypot(bx - ax, by - ay); acc = 0;
    }
    acc += d;
  }
  const last = pts[pts.length - 1], pl = out[out.length - 1];
  if (Math.hypot(last[0] - pl[0], last[1] - pl[1]) > step * .3) out.push(last.slice()); else out[out.length - 1] = last.slice();
  if (out.length < 2) out.push([out[0][0] + .5, out[0][1]]);
  return out;
}

// ---------- strokes ----------
const PROF = {
  brush: u => u < .08 ? .55 + .45 * (u / .08) : 1 - .55 * Math.pow((u - .08) / .92, 1.4),
  leaf: u => .04 + .96 * Math.pow(Math.sin(Math.PI * clamp(u)), .8),
  even: u => .2 + .8 * Math.min(1, u / .08, (1 - u) / .08),
  tip: u => 1 - .82 * u,
  trunk: u => u < .07 ? 1.3 - .3 * (u / .07) : 1 - .55 * ((u - .07) / .93),
  dab: u => .1 + .9 * Math.pow(Math.sin(Math.PI * clamp(u)), .5),
};
function mk(pts, w, col, o = {}) {
  const P = resample(pts, Math.max(1.5, Math.min(6, w * .35)));
  const S = [0];
  for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = S[S.length - 1] || 1, prof = PROF[o.prof || 'brush'], rough = o.rough ?? .22, ns = rnd(0, 1000);
  const W = [], N = [];
  for (let i = 0; i < P.length; i++) {
    const u = S[i] / L;
    const r = 1 + rough * (2 * vnoise(S[i] / (w * 1.6 + 4), ns) - 1) * .8 + rough * (2 * vnoise(S[i] / (w * .45 + 2), ns + 3) - 1) * .35;
    W.push(Math.max(.3, w * prof(u) * r));
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    N.push([-dy / l, dx / l]);
  }
  const nb = o.nb ?? (w >= 6 ? clamp(Math.round(w / 3.2), 3, 9) : 0), br = [];
  for (let k = 0; k < nb; k++) {
    const off = nb === 1 ? 0 : lerp(-.42, .42, k / (nb - 1)) + rnd(-.05, .05);
    const end = rnd(.62, 1) * L, dash = [];
    let s = rnd(0, w * .3);
    while (s < end) { const run = rnd(18, 90); dash.push([s, Math.min(end, s + run)]); s += run + rnd(2, Math.max(3, w * .5)); }
    br.push({ off, bw: Math.max(.6, w * rnd(.06, .13)), al: rnd(.3, .85) * (o.bm ?? 1), dash });
  }
  const x0 = Math.min(...P.map(p => p[0])), y0 = Math.min(...P.map(p => p[1]));
  return { P, S, L, W, N, col: hex(col), a: o.a ?? .92, rib: o.rib ?? (nb ? .6 : .92), br, bcol: o.bcol ? hex(o.bcol) : null, x: P[0][0], y: P[0][1], bx: x0, by: y0 };
}
function idxAt(s, len) {
  let lo = 0, hi = s.S.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (s.S[m] <= len) lo = m; else hi = m - 1; }
  return lo;
}
// paint stroke s up to fraction p of its length (a moving brush tip)
function drawS(c, s, p = 1, col = null, am = 1) {
  if (p <= 0 || am <= 0) return;
  p = Math.min(1, p);
  const len = p * s.L, k = idxAt(s, len), P = s.P, W = s.W, N = s.N, C = col ? hex(col) : s.col;
  let tip = null;
  if (p < 1 && k < P.length - 1) {
    const u = (len - s.S[k]) / ((s.S[k + 1] - s.S[k]) || 1);
    tip = [lerp(P[k][0], P[k + 1][0], u), lerp(P[k][1], P[k + 1][1], u), lerp(W[k], W[k + 1], u) * .8, N[k]];
  }
  c.beginPath();
  for (let i = 0; i <= k; i++) { const x = P[i][0] + N[i][0] * W[i] / 2, y = P[i][1] + N[i][1] * W[i] / 2; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  if (tip) { c.lineTo(tip[0] + tip[3][0] * tip[2] / 2, tip[1] + tip[3][1] * tip[2] / 2); c.lineTo(tip[0] - tip[3][0] * tip[2] / 2, tip[1] - tip[3][1] * tip[2] / 2); }
  for (let i = k; i >= 0; i--) c.lineTo(P[i][0] - N[i][0] * W[i] / 2, P[i][1] - N[i][1] * W[i] / 2);
  c.closePath();
  c.fillStyle = rgba(C, s.a * s.rib * am);
  c.fill();
  if (tip && tip[2] > 1.2) { c.beginPath(); c.arc(tip[0], tip[1], tip[2] * .5, 0, 6.2832); c.fill(); }   // the brush tip
  if (s.br.length) {
    const BC = s.bcol || shade(C, .84);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const b of s.br) {
      c.lineWidth = b.bw; c.strokeStyle = rgba(BC, s.a * b.al * am); c.beginPath();
      for (const [d0, d1] of b.dash) {
        if (d0 >= len) break;
        const i0 = idxAt(s, d0), i1 = idxAt(s, Math.min(d1, len));
        for (let i = i0; i <= i1; i++) {
          const x = P[i][0] + N[i][0] * W[i] * b.off, y = P[i][1] + N[i][1] * W[i] * b.off;
          i === i0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
      }
      c.stroke();
    }
  }
}
// a darker edge running along one side of stroke s (the only "line" this style allows)
function edgeOf(s, side = 1, w = 2, col = '#2e2622', a = .45, u0 = .08, u1 = .92) {
  const pts = [];
  for (let i = 0; i < s.P.length; i++) {
    const u = s.S[i] / s.L;
    if (u < u0 || u > u1) continue;
    pts.push([s.P[i][0] + s.N[i][0] * s.W[i] * .46 * side, s.P[i][1] + s.N[i][1] * s.W[i] * .46 * side]);
  }
  if (pts.length < 2) return null;
  return mk(pts, w, col, { prof: 'even', nb: 0, a, rough: .45, rib: 1 });
}

// ---------- washes ----------
function mkWash(pts, col, a = .5, jit = 5, passes = 3, step = 14) {
  const dense = [];
  for (let i = 0; i < pts.length; i++) {
    const A = pts[i], B = pts[(i + 1) % pts.length], d = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(d / step));
    for (let j = 0; j < n; j++) dense.push([lerp(A[0], B[0], j / n), lerp(A[1], B[1], j / n)]);
  }
  const polys = [];
  for (let p = 0; p < passes; p++) {
    const ns = rnd(0, 999);
    polys.push(dense.map(([x, y], i) => [x + jit * (2 * vnoise(i * .33, ns) - 1) + rnd(-jit, jit) * .2, y + jit * (2 * vnoise(i * .33, ns + 7) - 1) + rnd(-jit, jit) * .2]));
  }
  return { polys, col: hex(col), a };
}
function pathPoly(c, P) { c.beginPath(); for (let i = 0; i < P.length; i++) i ? c.lineTo(P[i][0], P[i][1]) : c.moveTo(P[i][0], P[i][1]); c.closePath(); }
function drawWash(c, w, am = 1, col = null) {
  if (am <= 0) return;
  const C = col ? hex(col) : w.col, per = w.a / w.polys.length * 1.6;
  c.lineJoin = 'round';
  for (const P of w.polys) {
    pathPoly(c, P);
    c.fillStyle = rgba(C, per * am); c.fill();
    c.lineWidth = 2.4; c.strokeStyle = rgba(shade(C, .8), per * .6 * am); c.stroke();
  }
}
function ellipsePts(cx, cy, rx, ry, n = 28, rot = 0, wob = 0, seed = 0) {
  const P = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = 1 + wob * (2 * vnoise(i * .7, seed) - 1);
    const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    P.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return P;
}

// ---------- wavy brush-edge clip ----------
// dir: 'lr' left→right, 'rl', 'bu' bottom→up, 'td'; region (x0,y0)-(x1,y1); p = 0..1 revealed
function wipePath(c, x0, y0, x1, y1, p, dir = 'lr', seed = 1, wave = 22) {
  const n = 28;
  c.beginPath();
  if (dir === 'lr' || dir === 'rl') {
    const X = dir === 'lr' ? lerp(x0 - wave * 2, x1 + wave * 2, p) : lerp(x1 + wave * 2, x0 - wave * 2, p);
    const far = dir === 'lr' ? x0 - 60 : x1 + 60;
    c.moveTo(far, y0 - 60);
    for (let i = 0; i <= n; i++) { const y = lerp(y0 - 60, y1 + 60, i / n); c.lineTo(X + wave * (2 * vnoise(i * .8 + seed * 7.1, seed) - 1), y); }
    c.lineTo(far, y1 + 60);
  } else {
    const Y = dir === 'bu' ? lerp(y1 + wave * 2, y0 - wave * 2, p) : lerp(y0 - wave * 2, y1 + wave * 2, p);
    const far = dir === 'bu' ? y1 + 60 : y0 - 60;
    c.moveTo(x0 - 60, far);
    for (let i = 0; i <= n; i++) { const x = lerp(x0 - 60, x1 + 60, i / n); c.lineTo(x, Y + wave * (2 * vnoise(i * .8 + seed * 7.1, seed) - 1)); }
    c.lineTo(x1 + 60, far);
  }
  c.closePath();
}
// wavy circle of radius r around (cx, cy)
function blobPath(c, cx, cy, r, seed = 1, wob = .12, n = 40) {
  const fine = r > 200 ? 18 / r : 0;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, k = 1 + wob * (2 * vnoise(i * .55 * 40 / n + seed, seed) - 1) + fine * (2 * vnoise(i * 1.9 + seed * 3, seed + 1) - 1);
    const x = cx + Math.cos(a) * r * k, y = cy + Math.sin(a) * r * k;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}
