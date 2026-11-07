// Void Mart in the sci-fi sitcom toon look ("style 2": the owner's choice on 11/6; library style `scifi-toon` read as a
// reference only, this is our own code). Thick near-black outlines of constant screen width that boil (3 drawings cycling at
// 12 fps), flat fills, hard-edged shadow shapes inside the fill, big white eyes with tiny pupils, elastic mouths.
// Characters stand behind the counter like the toon.js rigs: (x, y) = counter-top point under the character, s = face height
// in px (face height = 100 units). Call SIT.begin(t) once per frame before drawing.
'use strict';
const SIT = { ink: '#1c1026', lw: 7, lwBg: 4.6, lwFine: 3.6, amp: 1.7, step: 7, fps: 12, frame: 0, n: 0, still: false };
SIT.begin = t => { SIT.frame = SIT.still ? 0 : Math.floor(t * SIT.fps) % 3; SIT.n = 0; };

// ---------- pen: builds polylines in local units ----------
class Pen {
  constructor() { this.s = []; this.c = null; this.x = 0; this.y = 0; }
  M(x, y) { this.c = [x, y]; this.s.push(this.c); this.x = x; this.y = y; return this; }
  L(x, y) { this.c.push(x, y); this.x = x; this.y = y; return this; }
  Q(cx, cy, x, y, n = 10) { const x0 = this.x, y0 = this.y; for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; this.c.push(u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y); } this.x = x; this.y = y; return this; }
  C(ax, ay, bx, by, x, y, n = 14) { const x0 = this.x, y0 = this.y; for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; this.c.push(u * u * u * x0 + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * x, u * u * u * y0 + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * y); } this.x = x; this.y = y; return this; }
  Z() { this.c.closed = true; return this; }
  E(x, y, rx, ry, rot = 0, n = 44) { const cs = Math.cos(rot), sn = Math.sin(rot); for (let i = 0; i < n; i++) { const a = i / n * 6.2832, px = Math.cos(a) * rx, py = Math.sin(a) * ry, X = x + px * cs - py * sn, Y = y + px * sn + py * cs; i ? this.L(X, Y) : this.M(X, Y); } return this.Z(); }
  R(x, y, w, h, r = 0) { r = Math.min(r, w / 2, h / 2); this.M(x + r, y).L(x + w - r, y).Q(x + w, y, x + w, y + r, 4).L(x + w, y + h - r).Q(x + w, y + h, x + w - r, y + h, 4).L(x + r, y + h).Q(x, y + h, x, y + h - r, 4).L(x, y + r).Q(x, y, x + r, y, 4); return this.Z(); }
  P(pts) { this.M(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) this.L(pts[i], pts[i + 1]); return this.Z(); }
}
const pen = () => new Pen();

// ---------- boil: to screen, resample every ~7 px, push along the normal with smooth noise ----------
function sitBoil(c, p, amp) {
  const T = c.getTransform(), seed = ++SIT.n * 7919 + SIT.frame * 104729, out = [];
  const h = k => { const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const ph1 = h(1) * 6.28, ph2 = h(2) * 6.28, f1 = .035 + h(3) * .02, f2 = .09 + h(4) * .05;
  for (const sub of p.s) {
    const n0 = sub.length / 2; if (n0 < 2) continue;
    const S = []; for (let i = 0; i < n0; i++) { const x = sub[i * 2], y = sub[i * 2 + 1]; S.push(T.a * x + T.c * y + T.e, T.b * x + T.d * y + T.f); }
    if (sub.closed) S.push(S[0], S[1]);
    // resample
    const R = [S[0], S[1]]; let acc = 0;
    for (let i = 2; i < S.length; i += 2) {
      let x0 = S[i - 2], y0 = S[i - 1]; const x1 = S[i], y1 = S[i + 1]; let d = Math.hypot(x1 - x0, y1 - y0);
      while (acc + d >= SIT.step) { const k = (SIT.step - acc) / d; x0 += (x1 - x0) * k; y0 += (y1 - y0) * k; R.push(x0, y0); d = Math.hypot(x1 - x0, y1 - y0); acc = 0; }
      acc += d;
    }
    if (!sub.closed && (R[R.length - 2] !== S[S.length - 2] || R[R.length - 1] !== S[S.length - 1])) R.push(S[S.length - 2], S[S.length - 1]);
    const m = R.length / 2, Q = new Array(R.length);
    for (let i = 0; i < m; i++) {
      const a = sub.closed ? (i - 1 + m) % m : Math.max(0, i - 1), b = sub.closed ? (i + 1) % m : Math.min(m - 1, i + 1);
      let nx = -(R[b * 2 + 1] - R[a * 2 + 1]), ny = R[b * 2] - R[a * 2]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const sArc = i * SIT.step, w = amp * (.62 * Math.sin(sArc * f1 + ph1) + .38 * Math.sin(sArc * f2 + ph2));
      const fade = sub.closed ? 1 : Math.min(1, i / 2, (m - 1 - i) / 2);      // open strokes keep their ends
      Q[i * 2] = R[i * 2] + nx * w * fade; Q[i * 2 + 1] = R[i * 2 + 1] + ny * w * fade;
    }
    Q.closed = sub.closed; out.push(Q);
  }
  return out;
}
function sitTrace(c, P) { c.beginPath(); for (const q of P) { c.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) c.lineTo(q[i], q[i + 1]); if (q.closed) c.closePath(); } }

// fill + optional hard shadow (another pen, clipped inside) + outline at constant screen width
function sitShape(c, p, fill, o = {}) {
  const P = sitBoil(c, p, o.amp ?? SIT.amp), Sh = o.shade ? sitBoil(c, o.shade, (o.amp ?? SIT.amp) * .6) : null;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  if (fill) { sitTrace(c, P); c.fillStyle = fill; c.fill(); }
  if (Sh) { c.save(); sitTrace(c, P); c.clip(); sitTrace(c, Sh); c.fillStyle = o.shadeCol; c.fill(); c.restore(); }
  if (o.line !== false) { sitTrace(c, P); c.lineWidth = o.lw || SIT.lw; c.strokeStyle = o.ink || SIT.ink; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  c.restore();
}
function sitLine(c, p, lw, col) { const P = sitBoil(c, p, SIT.amp * .8); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); sitTrace(c, P); c.lineWidth = lw || SIT.lw; c.strokeStyle = col || SIT.ink; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); c.restore(); }
// flat translucent ring glow (the style allows 1–2 flat rings, never a gradient)
function sitRing(c, x, y, rx, ry, col, a) { c.save(); c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832); c.fill(); c.globalAlpha = a * .7; c.beginPath(); c.ellipse(x, y, rx * 1.35, ry * 1.35, 0, 0, 6.2832); c.fill(); c.restore(); }
function sitText(c, s, x, y, size, col, o = {}) {
  c.save(); c.font = `${o.weight || 400} ${size}px ${o.font || '"Bungee"'}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); x = 0; y = 0; }
  if (o.stroke !== false) { c.lineWidth = o.stroke || size * .18; c.strokeStyle = SIT.ink; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y); c.restore();
}

// ---------- face parts ----------
// big white eye; lid 0..1 covers it from the top (heavy-lidded deadpan), look = pupil offset in units, bag = eye bag line
function sitEye(c, x, y, rx, ry, o = {}) {
  const skin = o.skin || '#f0c8a8', lid = o.lid || 0, k = c.getTransform().a;
  sitShape(c, pen().E(x, y, rx, ry), '#ffffff', { lw: SIT.lw * .8 });
  if (!o.closed) {
    const pr = Math.max(4.6, rx * k * .17) / k, px = x + (o.look || 0) * rx * .55, py = y + (o.lookY || 0) * ry * .5 + (lid > .3 ? ry * .18 : 0);
    c.save(); c.fillStyle = SIT.ink; c.beginPath(); c.arc(px, py, pr, 0, 6.2832); c.fill(); c.restore();
  }
  if (lid > 0 || o.closed) {
    const L = o.closed ? 1.02 : lid, yl = y - ry + 2 * ry * L;
    c.save(); c.beginPath(); c.ellipse(x, y, rx + .5, ry + .5, 0, 0, 6.2832); c.clip();
    sitShape(c, pen().M(x - rx - 4, y - ry - 6).L(x + rx + 4, y - ry - 6).L(x + rx + 4, yl + (o.lidTilt || 0) * rx).L(x - rx - 4, yl - (o.lidTilt || 0) * rx).Z(), skin, { line: false });
    c.restore();
    sitLine(c, pen().M(x - rx * .98, yl - (o.lidTilt || 0) * rx * .98).L(x + rx * .98, yl + (o.lidTilt || 0) * rx * .98), SIT.lw * .8);
  }
  if (o.bag) sitLine(c, pen().M(x - rx * .7, y + ry * 1.12).Q(x, y + ry * 1.38, x + rx * .7, y + ry * 1.12), SIT.lwFine);
}
// elastic mouth: open 0..1, w half width, curl -1 (frown) .. 1 (smile), skew -1..1
function sitMouth(c, x, y, o = {}) {
  const open = o.open || 0, w = o.w || 12, curl = o.curl || 0, sk = (o.skew || 0) * w * .5;
  if (open < .08) { sitLine(c, pen().M(x - w, y - curl * 4 + sk).Q(x, y + curl * 7, x + w, y - curl * 4 - sk), SIT.lw * .85); return; }
  const h = 4 + open * 22, top = y - curl * 3, bot = y + h;
  const p = pen().M(x - w, top + sk).Q(x, top - curl * 4 - 2, x + w, top - sk).Q(x + w * .9, bot - h * .2, x, bot).Q(x - w * .9, bot - h * .2, x - w, top + sk).Z();
  sitShape(c, p, '#4a1028', { lw: SIT.lw * .85 });
  // teeth and tongue inside (drawn in local units, clipped by the mouth outline above)
  c.save(); c.beginPath(); c.moveTo(x - w, top + sk); c.quadraticCurveTo(x, top - curl * 4 - 2, x + w, top - sk); c.quadraticCurveTo(x + w * .9, bot - h * .2, x, bot); c.quadraticCurveTo(x - w * .9, bot - h * .2, x - w, top + sk); c.closePath(); c.clip();
  c.fillStyle = '#fffaf2'; c.fillRect(x - w, top - 8, w * 2, 3 + h * .28 + 8);
  c.fillStyle = '#ff7f97'; c.beginPath(); c.ellipse(x + w * .15, bot - 1, w * .62, h * .38, 0, 0, 6.2832); c.fill(); c.restore();
  sitLine(c, pen().M(x - w, top + sk).Q(x, top - curl * 4 - 2, x + w, top - sk), SIT.lw * .85);
}
function sitBrow(c, x, y, w, ang, lw) { sitLine(c, pen().M(x - w, y + ang * w).Q(x, y - 2 - Math.abs(ang) * 2, x + w, y - ang * w), lw || SIT.lw * 1.05); }
// mitten hand with four fat fingers; dir 1 = fingers up
function sitHand(c, x, y, r, skin, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const p = pen().M(-r * .9, r * .5).Q(-r * 1.1, -r * .4, -r * .7, -r * .9).Q(-r * .45, -r * 1.35, -r * .2, -r * .95).Q(0, -r * 1.45, r * .25, -r * .95).Q(r * .55, -r * 1.3, r * .7, -r * .75).Q(r * 1.25, -r * .55, r * .95, r * .1).Q(r * .9, r * .8, 0, r * .85).Q(-r * .6, r * .9, -r * .9, r * .5).Z();
  sitShape(c, p, skin, { lw: SIT.lw * .8 });
  c.restore();
}
// noodle arm: a tube of constant width from shoulder to hand (one smooth bend)
function sitArm(c, pts, w, fill) {
  const p = pen().M(pts[0], pts[1]).Q(pts[2], pts[3], pts[4], pts[5], 16);
  const P = sitBoil(c, p, SIT.amp * .6), k = Math.hypot(c.getTransform().a, c.getTransform().b);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';
  sitTrace(c, P); c.lineWidth = w * k + SIT.lw * 2; c.strokeStyle = SIT.ink; c.stroke();
  sitTrace(c, P); c.lineWidth = w * k; c.strokeStyle = fill; c.stroke(); c.restore();
}
function sitTag(c, x, y, label, stickers) {
  sitShape(c, pen().R(x - 22, y - 9, 44, 18, 3), '#fbf7ff', { lw: SIT.lwFine });
  c.save(); c.font = '400 13px "Bungee"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = SIT.ink; c.fillText(label, x, y + 1); c.restore();
  if (stickers) for (const [dx, dy, col] of [[-26, -8, '#ffd23f'], [24, 9, '#7ef0ff'], [-20, 12, '#ff86ac']]) sitShape(c, pen().E(x + dx, y + dy, 5, 5), col, { lw: 2.6 });
}

// ---------- the cast ----------
const SITC = {
  rae: { skin: '#c98d6a', skinS: '#a5704f', hair: '#2b2244', hairS: '#1e1733', hood: '#7f78a3', hoodS: '#605a86' },
  pip: { skin: '#f3c9a6', skinS: '#dca383', hair: '#47d3bd', hairS: '#2aa592', shirt: '#b9a6ff', shirtS: '#917ce6', clip: '#ffd23f' },
  vest: '#ff7a1a', vestS: '#d65a0c',
};
// Rae: three years of nights. Blunt fringe, low bun, heavy lids, eye bags, the enormous mug.
// o.expr: deadpan | annoyed | shocked | smirk | sigh ; o.mouth {a, shape}; o.blink; o.look; o.mug 0..1 (at the mouth); o.arms false
function drawRaeS(c, x, y, s, o = {}) {
  const R = SITC.rae, ex = o.expr || 'deadpan';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  sitShape(c, pen().E(50, -168, 22, 20), R.hair, {});                                                      // the bun
  sitShape(c, pen().M(-50, -150).Q(-62, -215, -40, -250).Q(0, -280, 40, -250).Q(62, -215, 50, -150).Z(), R.hairS, {});   // back hair
  const torso = pen().M(-64, 4).L(-66, -86).Q(-64, -114, -30, -122).L(30, -122).Q(64, -114, 66, -86).L(64, 4).Z();
  sitShape(c, torso, R.hood, { shade: pen().R(30, -130, 50, 140), shadeCol: R.hoodS });
  sitShape(c, pen().M(-30, -122).Q(0, -100, 30, -122).Q(20, -134, 0, -136).Q(-20, -134, -30, -122).Z(), R.hood, { lw: SIT.lw * .8 });      // hood fold
  sitShape(c, pen().M(-70, 4).L(-72, -84).Q(-70, -110, -40, -118).L(-12, -80).L(-14, 4).Z(), SITC.vest, {});
  sitShape(c, pen().M(70, 4).L(72, -84).Q(70, -110, 40, -118).L(12, -80).L(14, 4).Z(), SITC.vest, { shade: pen().R(44, -130, 40, 140), shadeCol: SITC.vestS });
  sitLine(c, pen().M(-6, -118).L(-8, -86), SIT.lwFine); sitLine(c, pen().M(6, -118).L(8, -84), SIT.lwFine);     // hoodie strings
  sitTag(c, -34, -66, 'RAE');
  sitShape(c, pen().R(-12, -144, 24, 28, 6), R.skin, { lw: SIT.lw * .8, shade: pen().R(-14, -146, 30, 10), shadeCol: R.skinS });
  sitShape(c, pen().E(-44, -192, 8, 12), R.skin, { lw: SIT.lw * .8 }); sitShape(c, pen().E(44, -192, 8, 12), R.skin, { lw: SIT.lw * .8 });
  const head = pen().M(-42, -232).Q(-48, -170, -26, -146).Q(0, -132, 26, -146).Q(48, -170, 42, -232).Q(0, -252, -42, -232).Z();
  sitShape(c, head, R.skin, { shade: pen().M(18, -250).Q(40, -190, 14, -138).L(60, -138).L(60, -250).Z(), shadeCol: R.skinS });
  // eyes: big, touching, heavy-lidded
  const lid = o.blink ? 0 : ex === 'shocked' ? 0 : ex === 'annoyed' ? .55 : ex === 'sigh' ? .62 : .48;
  for (const sx of [-1, 1]) sitEye(c, sx * 16.5, -192, 16.5, 18, { skin: R.skin, lid, closed: o.blink || ex === 'sigh' && o.closedSigh, look: o.look ?? .35, bag: true, lidTilt: ex === 'annoyed' ? sx * -.18 : 0 });
  // fringe over the forehead, blunt and straight
  sitShape(c, pen().M(-46, -212).Q(-54, -258, -8, -262).Q(42, -264, 48, -220).L(44, -206).L(34, -214).L(26, -203).L(14, -213).L(2, -205).L(-8, -214).L(-20, -204).L(-30, -213).L(-40, -205).Z(), R.hair, {});
  sitLine(c, pen().M(-24, -252).Q(-6, -258, 14, -250), SIT.lwFine, '#4a3e72');
  sitShape(c, pen().M(-46, -216).Q(-54, -186, -44, -160).L(-38, -170).Q(-40, -196, -36, -212).Z(), R.hair, { lw: SIT.lw * .8 });
  sitShape(c, pen().M(46, -216).Q(54, -186, 44, -160).L(38, -170).Q(40, -196, 36, -212).Z(), R.hair, { lw: SIT.lw * .8 });
  // brows carry it
  const ba = ex === 'annoyed' ? .28 : ex === 'shocked' ? -.25 : ex === 'smirk' ? .1 : 0;
  sitBrow(c, -17, ex === 'shocked' ? -222 : -213, 11, -ba); sitBrow(c, 17, ex === 'shocked' ? -222 : ex === 'smirk' ? -217 : -213, 11, ba);
  sitLine(c, pen().M(1, -178).Q(6, -170, 0, -167), SIT.lwFine);                                              // nose
  const m = o.mouth;
  if (!(o.mug > .55)) {
    if (m && m.a > .05) sitMouth(c, 2, -157, { open: m.a, w: 9 + m.a * 3, curl: ex === 'smirk' ? .3 : -.1 });
    else sitMouth(c, 2, -156, { open: ex === 'shocked' ? .5 : 0, w: ex === 'shocked' ? 8 : 10, curl: ex === 'smirk' ? .45 : ex === 'annoyed' ? -.5 : -.15, skew: ex === 'smirk' ? .6 : 0 });
  }
  // arms and the mug
  if (o.arms !== false) {
    sitArm(c, [-60, -104, -84, -40, -48, -6], 22, R.hood); sitHand(c, -44, -8, 13, R.skin, .2);
    const mk = Math.max(0, Math.min(1, o.mug ?? 0)), hx = 54 - 34 * mk, hy = -10 - 140 * mk;
    sitArm(c, [60, -104, 92 - 10 * mk, -50 - 60 * mk, hx + 8, hy + 6], 22, R.hood);
    sitShape(c, pen().R(hx - 30, hy - 46, 52, 58, 8), '#fbf7ff', { shade: pen().R(hx + 8, hy - 50, 20, 70), shadeCol: '#d9d3ea' });   // the mug, far too big
    sitLine(c, pen().M(hx + 22, hy - 34).Q(hx + 42, hy - 18, hx + 22, hy - 2), SIT.lwFine * 1.4);
    sitText(c, 'NO.', hx - 4, hy - 17, 15, '#e8364a', { stroke: 3 });
    if (mk < .3) for (const dx of [-14, -2, 10]) sitLine(c, pen().M(hx + dx - 4, hy - 54).Q(hx + dx + 4, hy - 66, hx + dx - 2, hy - 78), 2.6, '#cfc8ec');
    sitHand(c, hx + 6, hy + 4, 13, R.skin, -.4);
  }
  c.restore();
}
// Pip: first week. Round teal bob, a spring cowlick, huge round eyes, a grin that won't quit, a vest three sizes too big.
// o.expr: grin | gasp | worried | sheepish | sad ; o.mouth; o.blink; o.look; o.wave (true = right hand up); o.arms false
function drawPipS(c, x, y, s, o = {}) {
  const P = SITC.pip, ex = o.expr || 'grin';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  sitShape(c, pen().M(-58, -112).Q(-70, -200, -38, -226).Q(0, -244, 38, -226).Q(70, -200, 58, -112).Q(30, -122, 0, -118).Q(-30, -122, -58, -112).Z(), P.hairS, {});
  const torso = pen().M(-56, 4).L(-58, -70).Q(-56, -96, -24, -102).L(24, -102).Q(56, -96, 58, -70).L(56, 4).Z();
  sitShape(c, torso, P.shirt, { shade: pen().R(28, -110, 40, 120), shadeCol: P.shirtS });
  // the vest: far too big, shoulders past her own
  sitShape(c, pen().M(-82, 4).L(-86, -70).Q(-84, -104, -44, -108).L(-12, -66).L(-14, 4).Z(), SITC.vest, {});
  sitShape(c, pen().M(82, 4).L(86, -70).Q(84, -104, 44, -108).L(12, -66).L(14, 4).Z(), SITC.vest, { shade: pen().R(52, -120, 40, 130), shadeCol: SITC.vestS });
  sitTag(c, -36, -50, 'PIP', true);
  sitShape(c, pen().R(-10, -124, 20, 26, 6), P.skin, { lw: SIT.lw * .8, shade: pen().R(-12, -126, 26, 9), shadeCol: P.skinS });
  const head = pen().M(-46, -196).Q(-52, -138, -22, -120).Q(0, -110, 22, -120).Q(52, -138, 46, -196).Q(0, -222, -46, -196).Z();
  sitShape(c, head, P.skin, { shade: pen().M(24, -214).Q(46, -160, 18, -114).L(60, -114).L(60, -214).Z(), shadeCol: P.skinS });
  for (const sx of [-1, 1]) { c.save(); c.globalAlpha = .55; c.fillStyle = '#ff8fb0'; c.beginPath(); c.ellipse(sx * 32, -142, 8, 4.5, 0, 0, 6.2832); c.fill(); c.restore(); }
  const big = ex === 'gasp' ? 1.12 : 1;
  for (const sx of [-1, 1]) sitEye(c, sx * 19, -164, 19 * big, 21 * big, { skin: P.skin, lid: ex === 'sheepish' ? .25 : ex === 'sad' ? .2 : 0, closed: o.blink, look: o.look ?? -.25, lookY: ex === 'worried' ? -.3 : 0, lidTilt: ex === 'sad' ? sx * .2 : 0 });
  // bob with a blunt fringe
  sitShape(c, pen().M(-50, -186).Q(-56, -228, -14, -234).Q(38, -238, 50, -192).L(46, -182).Q(28, -190, 12, -184).Q(-4, -190, -20, -184).Q(-36, -190, -50, -186).Z(), P.hair, {});
  sitShape(c, pen().M(-50, -188).Q(-62, -150, -50, -122).L(-40, -128).Q(-44, -160, -40, -184).Z(), P.hair, { lw: SIT.lw * .8 });
  sitShape(c, pen().M(50, -188).Q(62, -150, 50, -122).L(40, -128).Q(44, -160, 40, -184).Z(), P.hair, { lw: SIT.lw * .8 });
  // the cowlick: a perfect spring
  sitLine(c, pen().M(-4, -233).C(-12, -262, 16, -266, 10, -248).C(4, -234, -18, -246, -6, -262).C(2, -274, 18, -270, 14, -258), SIT.lw * .9);
  // the star clip
  const st = pen(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 6 : 13; i ? st.L(34 + Math.cos(a) * rr, -206 + Math.sin(a) * rr) : st.M(34 + Math.cos(a) * rr, -206 + Math.sin(a) * rr); } st.Z();
  sitShape(c, st, P.clip, { lw: SIT.lw * .75 });
  const ba = ex === 'worried' || ex === 'sad' ? -.35 : ex === 'gasp' ? -.15 : .05;
  sitBrow(c, -20, ex === 'gasp' ? -196 : -190, 10, ba); sitBrow(c, 20, ex === 'gasp' ? -196 : -190, 10, -ba);
  const m = o.mouth;
  if (m && m.a > .05) sitMouth(c, 0, -136, { open: Math.min(1, m.a * 1.15), w: 12 + m.a * 5, curl: ex === 'grin' ? .5 : .1 });
  else if (ex === 'grin') sitMouth(c, 0, -138, { open: .75, w: 21, curl: .9 });
  else if (ex === 'gasp') sitMouth(c, 0, -136, { open: 1, w: 13, curl: -.1 });
  else if (ex === 'sheepish') sitMouth(c, 0, -134, { open: 0, w: 11, curl: .3, skew: -.5 });
  else sitMouth(c, 0, -132, { open: 0, w: 10, curl: -.6 });
  if (o.arms !== false) {
    sitArm(c, [-56, -86, -86, -30, -46, -6], 20, P.shirt); sitHand(c, -42, -8, 12, P.skin, .2);
    if (o.wave) { const wv = Math.sin((o.wavePhase || 0)) * 8; sitArm(c, [56, -86, 96, -100, 92 + wv * .5, -170], 20, P.shirt); sitHand(c, 94 + wv, -184, 13, P.skin, .15 + wv * .02); }
    else { sitArm(c, [56, -86, 86, -30, 46, -6], 20, P.shirt); sitHand(c, 42, -8, 12, P.skin, -.2); }
  }
  c.restore();
}
// MAGS: the store's AI, a ceiling dome with one big eye. o.lid, o.look, o.glow (the red pupil rings)
function drawMagsS(c, x, y, s, o = {}) {
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  sitShape(c, pen().R(-6, -90, 12, 60), '#3a3560', {});
  sitShape(c, pen().M(-62, -30).Q(-62, 40, 0, 44).Q(62, 40, 62, -30).Z(), '#eef0f7', { shade: pen().M(20, -40).Q(64, 10, 30, 50).L(80, 50).L(80, -40).Z(), shadeCol: '#c1c6d8' });
  sitShape(c, pen().R(-66, -38, 132, 16, 4), '#20183a', {});
  sitEye(c, 0, 8, 22, 18, { skin: '#eef0f7', lid: o.lid ?? .1, look: o.look || 0 });
  c.save(); const px = (o.look || 0) * 12; sitRing(c, px, 8, 9, 9, '#ff2a3a', o.glow ?? .35); c.fillStyle = '#ff2a3a'; c.beginPath(); c.arc(px, 8 + (o.lid > .3 ? 3 : 0), 5, 0, 6.2832); c.fill(); c.restore();
  c.restore();
}
// Dennis: a regular. A slug, slightly damp, very polite. Leans on the counter; eye stalks; one milk carton.
function drawDennisS(c, x, y, s, o = {}) {
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  const body = pen().M(-70, 4).Q(-80, -70, -40, -120).Q(-10, -160, 24, -140).Q(60, -118, 66, -60).Q(70, -20, 70, 4).Z();
  sitShape(c, body, '#c9e06a', { shade: pen().M(20, -160).Q(80, -90, 50, 10).L(90, 10).L(90, -160).Z(), shadeCol: '#a3bd47' });
  for (const [hx, hy, rx, ry] of [[-30, -110, 12, 6], [-48, -70, 7, 4], [-12, -132, 6, 3]]) { c.save(); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(hx, hy, rx, ry, -.5, 0, 6.2832); c.fill(); c.restore(); }   // wet sheen
  for (const sx of [-1, 1]) { const ex2 = sx * 20 - 2, ey = -206 + sx * 6; sitLine(c, pen().M(sx * 10 - 2, -146).Q(sx * 18, -176, ex2, ey + 14), SIT.lw * 1.6, '#c9e06a'); sitLine(c, pen().M(sx * 10 - 2, -146).Q(sx * 18, -176, ex2, ey + 14), 2.4); sitEye(c, ex2, ey, 13, 14, { skin: '#c9e06a', lid: o.lid ?? .15, look: o.look ?? .3 }); }
  sitMouth(c, 2, -112, o.mouth && o.mouth.a > .05 ? { open: o.mouth.a * .8, w: 9 } : { open: 0, w: 9, curl: .35 });
  for (const dx of [-60, 40]) sitShape(c, pen().M(dx, 4).Q(dx + 6, 24, dx + 12, 4).Z(), '#c9e06a', { lw: SIT.lwFine });                     // drips on the counter
  if (o.milk !== false) { sitShape(c, pen().M(70, 0).L(70, -64).L(84, -84).L(110, -84).L(110, 0).Z(), '#fbf7ff', { shade: pen().R(96, -90, 20, 96), shadeCol: '#d9d3ea' }); sitText(c, 'MILK', 90, -40, 10, '#3a6ac8', { stroke: false }); }
  c.restore();
}

// ---------- captions in the cartoon's own style: heavy white text, thick black outline, a speaker pill ----------
function sitCaption(c, text, who, col, W, y) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = '600 54px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const tw = c.measureText(text).width, x = W / 2 + 40;
  c.lineWidth = 12; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(text, x, y); c.fillStyle = '#fff'; c.fillText(text, x, y);
  c.font = '400 24px "Bungee"'; const pw = c.measureText(who).width + 30, px = x - tw / 2 - pw - 18;
  c.restore();
  sitShape(c, pen().R(px, y - 22, pw, 44, 22), col, { lw: 5 });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = '400 24px "Bungee"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = SIT.ink; c.fillText(who, px + pw / 2, y + 1); c.restore();
}
