// Insert cuts borrowed (as a grammar only, our own code) from two library styles the owner picked on 11/7:
//   hudScan  - 8 "Hologram HUD": an object scanned into a glowing wireframe, target boxes lock on its parts,
//              numbers roll from garbage glyphs into the real value, one flash into a solid hologram.
//   dossier  - 7 "Halftone Dossier": a retro printed case file, cream paper, halftone dots, a heavy headline with a
//              misregistered shadow, exhibits, and rubber stamps that slam.
// Both draw a full 1080 x 1920 frame at time t (seconds from the start of the insert). English only on screen.
'use strict';
const INS = { cyan: '#5ff6ff', cyanD: '#1d6f8a', navy: '#050b16', paper: '#f3ead6', ink: '#1c2a6b', red: '#d8323f', pink: '#ff5f8a' };
function insFonts(base) {
  return Promise.all([new FontFace('VT323', `url(${base}vt323-400.woff2)`).load(), new FontFace('SpecialElite', `url(${base}specialelite-400.woff2)`).load()])
    .then(fs => fs.forEach(f => document.fonts.add(f)));
}
const insClamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const insEase = x => { x = insClamp(x); return x * x * (3 - 2 * x); };
const insBack = x => { x = insClamp(x); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
// a value that rolls from garbage glyphs into the real text between t0 and t1
function insRoll(text, t, t0, t1, seed) {
  if (t >= t1) return text; if (t < t0) return '';
  const k = (t - t0) / (t1 - t0), G = '#%&@$?!<>/\\=+*0123456789ABCDEFX', n = Math.floor(text.length * k);
  let s = text.slice(0, n); const R = mulberry32(seed + Math.floor(t * 30));
  for (let i = n; i < text.length; i++) s += text[i] === ' ' ? ' ' : G[Math.floor(R() * G.length)];
  return s;
}
function insText(g, s, x, y, size, col, font, align = 'left', glow = 0) {
  g.save(); g.font = `${size}px ${font}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = col;
  if (glow) { g.shadowColor = col; g.shadowBlur = glow; } g.fillText(s, x, y); g.restore();
}

// ---------------- 8: hologram spec scan ----------------
// spec = { title, sub, model(t) -> {lines:[[x,y,z, x,y,z]...], faces:[[pts...]]}, parts:[{label, value, p:[x,y,z], side}], verdict }
function insProject(p, yaw, pitch, cx, cy, sc) {
  let [x, y, z] = p; const cy1 = Math.cos(yaw), sy1 = Math.sin(yaw); [x, z] = [x * cy1 + z * sy1, -x * sy1 + z * cy1];
  const cp = Math.cos(pitch), sp = Math.sin(pitch); [y, z] = [y * cp - z * sp, y * sp + z * cp];
  const f = 4.2 / (4.2 + z); return [cx + x * sc * f, cy + y * sc * f, z];
}
function hudScan(g, t, spec) {
  const W = 1080, H = 1920, cx = 540, cy = 900, sc = 250, tl = spec.lockT || 99, yaw = -0.6 + Math.min(t, tl) * .55 + Math.max(0, t - tl) * .06, pitch = .38;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = INS.navy; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(540, 860, 100, 540, 900, 1100); vg.addColorStop(0, 'rgba(20,70,110,.55)'); vg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // holo pad: rings on the floor plane under the object
  g.strokeStyle = INS.cyanD; g.lineWidth = 2;
  for (let i = 1; i <= 5; i++) { g.globalAlpha = .55 - i * .07; g.beginPath(); g.ellipse(cx, cy + 300, 90 * i, 26 * i, 0, 0, 6.2832); g.stroke(); }
  g.globalAlpha = .35; for (let a = 0; a < 6.28; a += .5236) { g.beginPath(); g.moveTo(cx, cy + 300); g.lineTo(cx + Math.cos(a + t * .3) * 450, cy + 300 + Math.sin(a + t * .3) * 130); g.stroke(); }
  g.globalAlpha = 1;
  // header, corner brackets
  const head = insClamp(t / .4);
  g.globalAlpha = head;
  insText(g, spec.code || 'VOLT LABS // SPEC SCAN', 70, 150, 40, INS.cyan, '"VT323"');
  insText(g, 'SCAN READY', W - 70, 150, 40, INS.cyan, '"VT323"', 'right');
  g.strokeStyle = INS.cyan; g.lineWidth = 3;
  for (const [x, y, dx, dy] of [[50, 100, 1, 1], [W - 50, 100, -1, 1], [50, H - 120, 1, -1], [W - 50, H - 120, -1, -1]]) { g.beginPath(); g.moveTo(x, y + dy * 60); g.lineTo(x, y); g.lineTo(x + dx * 60, y); g.stroke(); }
  insText(g, spec.title, 70, 280, 92, '#e8fdff', '"Bungee"', 'left', 18);
  insText(g, spec.sub, 72, 350, 40, INS.cyan, '"VT323"');
  g.fillStyle = INS.cyan; g.fillRect(70, 378, 520, 3);
  g.globalAlpha = 1;
  // the model: the sweep reveals it top to bottom, back lines dimmer
  const M = spec.model(t), sweep = 380 + insEase((t - .5) / 1.1) * 900;
  g.save(); g.beginPath(); g.rect(0, 0, W, sweep); g.clip();
  const solid = t > spec.solidT && t < spec.solidT + .45 ? Math.sin((t - spec.solidT) / .45 * Math.PI) : 0;
  if (solid > 0) for (const f of M.faces) { g.beginPath(); f.forEach((p, i) => { const [x, y] = insProject(p, yaw, pitch, cx, cy, sc); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fillStyle = `rgba(95,246,255,${.32 * solid})`; g.fill(); }
  g.lineCap = 'round'; g.globalCompositeOperation = 'lighter';
  for (const L of M.lines) {
    const a = insProject(L.slice(0, 3), yaw, pitch, cx, cy, sc), b = insProject(L.slice(3, 6), yaw, pitch, cx, cy, sc), z = (a[2] + b[2]) / 2;
    g.strokeStyle = `rgba(95,246,255,${z > 0 ? .28 : .9})`; g.lineWidth = z > 0 ? 1.6 : 2.6; g.shadowColor = INS.cyan; g.shadowBlur = z > 0 ? 0 : 10;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  g.restore();
  if (t > .5 && t < 1.7) { g.fillStyle = 'rgba(95,246,255,.22)'; g.fillRect(0, sweep - 6, W, 12); g.fillStyle = 'rgba(95,246,255,.8)'; g.fillRect(0, sweep - 1, W, 2); }
  // target boxes lock onto the parts, leaders pull out, values roll in
  spec.parts.forEach((P, i) => {
    const t0 = spec.lockT + i * .55; if (t < t0) return;
    const k = insEase((t - t0) / .3), [px, py] = insProject(P.p, yaw, pitch, cx, cy, sc), r = 34 + (1 - k) * 90;
    g.strokeStyle = INS.cyan; g.lineWidth = 3; g.shadowColor = INS.cyan; g.shadowBlur = 8;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(px + sx * r, py + sy * r * .6); g.lineTo(px + sx * r, py + sy * r); g.lineTo(px + sx * r * .6, py + sy * r); g.stroke(); }
    insText(g, String(i + 1).padStart(2, '0'), px, py, 30, '#ffffff', '"VT323"', 'center');
    const lk = insEase((t - t0 - .25) / .3); if (lk <= 0) return;
    const right = P.side > 0, ly = 560 + i * 200, edge = right ? 1010 : 70, inner = right ? 700 : 380;
    const ex = px + (inner - px) * lk, ey = py + (ly - py) * lk;
    g.lineWidth = 2; g.beginPath(); g.moveTo(px + (right ? r : -r), py); g.lineTo(ex, ey); g.lineTo(ex + (right ? 30 : -30) * lk, ey); g.stroke(); g.shadowBlur = 0;
    if (lk >= 1) {
      const al = right ? 'right' : 'left';
      g.fillStyle = 'rgba(5,11,22,.72)'; g.fillRect(right ? inner + 30 : 50, ly - 56, right ? edge - inner - 10 : inner - 80, 104);
      insText(g, `${String(i + 1).padStart(2, '0')}  ${P.label}`, edge, ly - 26, 32, INS.cyan, '"VT323"', al);
      insText(g, insRoll(P.value, t, t0 + .6, t0 + 1.1, 77 + i), edge, ly + 16, 46, '#ffffff', '"VT323"', al, 10);
    }
  });
  // verdict
  if (t > spec.verdictT) {
    const k = insEase((t - spec.verdictT) / .25);
    g.globalAlpha = k; g.strokeStyle = INS.cyan; g.lineWidth = 3; g.strokeRect(70, 1440, W - 140, 170); g.fillStyle = 'rgba(95,246,255,.08)'; g.fillRect(70, 1440, W - 140, 170);
    insText(g, 'VERDICT', 100, 1482, 36, INS.cyan, '"VT323"');
    insText(g, insRoll(spec.verdict, t, spec.verdictT + .1, spec.verdictT + .8, 999), 100, 1550, 66, '#ffffff', '"VT323"', 'left', 12);
    g.globalAlpha = 1;
  }
  // scanlines and a little flicker
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
  if (spec.outT && t > spec.outT) { const k = insClamp((t - spec.outT) / .35); insText(g, 'PRINTING CASE FILE...', 540, 1700, 46, INS.cyan, '"VT323"', 'center', 10); g.fillStyle = `rgba(243,234,214,${k})`; g.fillRect(0, H * (1 - k), W, H * k); }
  g.restore();
}
// the free smart hat, as wireframe lines: a dome, a visor, and the sun badge
function capModel() {
  const lines = [], faces = [], N = 20, Rr = 1;
  const dome = (a, b) => [Math.cos(a) * Math.cos(b) * Rr, -Math.sin(b) * Rr * .8, Math.sin(a) * Math.cos(b) * Rr];
  for (let j = 0; j <= 4; j++) { const b = j / 5 * 1.45; for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; lines.push([...dome(a0, b), ...dome(a1, b)]); } }
  for (let i = 0; i < N; i += 2) { const a = i / N * 6.2832; for (let j = 0; j < 5; j++) lines.push([...dome(a, j / 5 * 1.45), ...dome(a, (j + 1) / 5 * 1.45)]); }
  // visor: a flat half-annulus in front (+z)
  const vis = (a, r) => [Math.cos(a) * r, .02, Math.sin(a) * r * 1.0];
  for (let i = 0; i < 12; i++) { const a0 = .25 + i / 12 * (Math.PI - .5), a1 = .25 + (i + 1) / 12 * (Math.PI - .5); lines.push([...vis(a0, 1), ...vis(a1, 1)], [...vis(a0, 1.75), ...vis(a1, 1.75)]); if (i % 3 === 0) lines.push([...vis(a0, 1), ...vis(a0, 1.75)]); }
  lines.push([...vis(Math.PI - .25, 1), ...vis(Math.PI - .25, 1.75)]);
  // sun badge on the front of the dome
  const sunC = [0, -.42, 1.0]; for (let i = 0; i < 12; i++) { const a0 = i / 12 * 6.28, a1 = (i + 1) / 12 * 6.28; lines.push([sunC[0] + Math.cos(a0) * .2, sunC[1] + Math.sin(a0) * .2, sunC[2] - .02, sunC[0] + Math.cos(a1) * .2, sunC[1] + Math.sin(a1) * .2, sunC[2] - .02]); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; lines.push([Math.cos(a) * .26, -.42 + Math.sin(a) * .26, .97, Math.cos(a) * .36, -.42 + Math.sin(a) * .36, .93]); }
  // a small receiver on top (what it really is)
  lines.push([0, -.8, 0, 0, -1.15, 0], [-.08, -1.15, 0, .08, -1.15, 0]);
  for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; faces.push([dome(a0, 0), dome(a1, 0), dome(a1, 1.45), dome(a0, 1.45)]); }
  return { lines, faces };
}

// ---------------- 7: halftone case file ----------------
function insPaper(g, W, H, seed) {
  g.fillStyle = INS.paper; g.fillRect(0, 0, W, H);
  const R = mulberry32(seed); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(120,90,60,${.03 + R() * .05})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
}
function insDots(g, x, y, w, h, col, maxR, step, fn) {      // halftone field: fn(u, v) -> 0..1 dot size
  g.fillStyle = col;
  for (let yy = 0, row = 0; yy < h; yy += step, row++) for (let xx = (row % 2) * step / 2; xx < w; xx += step) { const r = fn(xx / w, yy / h) * maxR; if (r > .4) { g.beginPath(); g.arc(x + xx, y + yy, r, 0, 6.2832); g.fill(); } }
}
// a printed photo: draw() into a box, then overprint halftone dots by darkness and a misregistered pink plate
function insPrinted(g, x, y, w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const cc = c.getContext('2d');
  cc.fillStyle = '#e9dfc8'; cc.fillRect(0, 0, w, h); draw(cc, w, h);
  const d = cc.getImageData(0, 0, w, h).data, lum = (px, py) => { const i = (Math.min(h - 1, py | 0) * w + Math.min(w - 1, px | 0)) * 4; return (.3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]) / 255; };
  const o = document.createElement('canvas'); o.width = w; o.height = h; const oc = o.getContext('2d');
  oc.globalAlpha = .82; oc.drawImage(c, 0, 0); oc.globalAlpha = 1;
  oc.globalCompositeOperation = 'multiply'; insDots(oc, 0, 0, w, h, 'rgba(28,42,107,.75)', 4.2, 9, (u, v) => Math.pow(1 - lum(u * w, v * h), 1.2));
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .28; g.drawImage(c, x + 6, y + 5); g.restore();     // misregistered plate
  g.drawImage(o, x, y);
  g.strokeStyle = INS.ink; g.lineWidth = 4; g.strokeRect(x, y, w, h);
}
// a rubber stamp that slams: scale from big, small rotation, ink gaps
function insStamp(g, t, t0, text, x, y, size, col, rot, seed) {
  if (t < t0) return 0;
  const k = insBack((t - t0) / .18), s = 1 + (1 - insClamp((t - t0) / .12)) * .9;
  const m = document.createElement('canvas'); m.width = m.height = Math.ceil(size * 14); const mc = m.getContext('2d'), cx = m.width / 2, cy = m.height / 2;
  mc.font = `${size}px "Bungee"`; const tw = mc.measureText(text).width;
  mc.strokeStyle = col; mc.lineWidth = size * .09; mc.strokeRect(cx - tw / 2 - size * .3, cy - size * .75, tw + size * .6, size * 1.5);
  mc.fillStyle = col; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText(text, cx, cy + size * .05);
  mc.globalCompositeOperation = 'destination-out'; const R = mulberry32(seed);      // worn ink: little gaps in the stamp only
  for (let i = 0; i < 90; i++) { mc.globalAlpha = .5 + R() * .5; mc.beginPath(); mc.arc(cx + (R() - .5) * (tw + size), cy + (R() - .5) * size * 1.4, 1 + R() * 3.5, 0, 6.2832); mc.fill(); }
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha = insClamp((t - t0) / .06) * .92; g.drawImage(m, -cx, -cy); g.restore();
  return k;
}
function dossier(g, t, spec) {
  const W = 1080, H = 1920;
  // stamps shake the paper a little when they land
  let shake = 0; for (const s of spec.stamps) if (t > s.t && t < s.t + .14) shake = (1 - (t - s.t) / .14) * 7;
  g.save(); g.setTransform(1, 0, 0, 1, Math.sin(t * 90) * shake, Math.cos(t * 70) * shake * .6);
  const slide = 1 - insEase(t / .35); g.translate(0, slide * H);
  insPaper(g, W, H, 3);
  // header strip
  g.fillStyle = INS.ink; g.fillRect(60, 110, 360, 54); insText(g, spec.code, 80, 138, 34, INS.paper, '"SpecialElite"');
  g.strokeStyle = INS.red; g.lineWidth = 4; g.strokeRect(W - 300, 110, 240, 54); insText(g, spec.date, W - 180, 138, 34, INS.red, '"SpecialElite"', 'center');
  // headline with a misregistered shadow
  const hk = insEase((t - .3) / .3);
  g.globalAlpha = hk; insText(g, spec.title, 66, 262, 90, INS.pink, '"Bungee"'); insText(g, spec.title, 58, 254, 90, INS.ink, '"Bungee"'); g.globalAlpha = 1;
  insText(g, spec.sub, 62, 342, 38, INS.ink, '"SpecialElite"');
  // mugshot: height chart, halftone burst behind, the printed photo
  const px = 90, py = 420, pw = 900, ph = 760;
  g.strokeStyle = 'rgba(28,42,107,.35)'; g.lineWidth = 2;
  for (let i = 0; i <= 6; i++) { const yy = py + i * ph / 6; g.beginPath(); g.moveTo(px - 30, yy); g.lineTo(px + pw + 30, yy); g.stroke(); insText(g, String(84 - i * 12), px - 50, yy, 26, 'rgba(28,42,107,.55)', '"SpecialElite"', 'center'); }
  insDots(g, px, py, pw, ph, 'rgba(47,91,214,.55)', 7, 18, (u, v) => insClamp(1 - Math.hypot(u - .5, (v - .45) * 1.2) * 1.9));
  const pk = insEase((t - .5) / .3);
  if (pk > 0) { g.save(); g.globalAlpha = pk; insPrinted(g, px + 150, py + 40, 600, 680, spec.photo); g.restore(); }
  insText(g, spec.photoLabel, px + 450, py + ph - 10, 30, INS.ink, '"SpecialElite"', 'center');
  // fields, typed in
  spec.fields.forEach((f, i) => {
    const t0 = 1.0 + i * .35; if (t < t0) return; const n = Math.floor(insClamp((t - t0) / .3) * f[1].length);
    insText(g, f[0], 70, 1260 + i * 74, 32, 'rgba(28,42,107,.7)', '"SpecialElite"'); insText(g, f[1].slice(0, n), 360, 1260 + i * 74, 40, INS.ink, '"SpecialElite"');
  });
  // exhibit A: the scanned hat, printed small
  if (spec.exhibit && t > spec.exhibitT) { const k = insEase((t - spec.exhibitT) / .25); g.save(); g.translate(790, 1520); g.rotate(.06 - (1 - k) * .3); g.globalAlpha = k;
    g.fillStyle = '#fbf6ea'; g.shadowColor = 'rgba(60,40,20,.35)'; g.shadowBlur = 14; g.fillRect(-170, -150, 340, 300); g.shadowBlur = 0;
    insPrinted(g, -150, -130, 300, 220, spec.exhibit); insText(g, 'EXHIBIT A', 0, 122, 28, INS.ink, '"SpecialElite"', 'center'); g.restore(); }
  // stamps
  for (const s of spec.stamps) insStamp(g, t, s.t, s.text, s.x, s.y, s.size, s.col, s.rot, s.seed || 5);
  g.restore();
}
