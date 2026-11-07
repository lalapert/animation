// Void Mart toon kit: bold outlines, flat fills, one cel shade.
// Characters are drawn waist-up, standing behind the counter: (x, y) is the point on the counter top under the
// character's centre, s = face height in px (unit system below: face height = 100 units).
'use strict';

const TOON = {
  ink: '#1a1030',
  orange: '#ff7a1a', orangeS: '#d65a0c', orangeL: '#ffb066',
  white: '#fbf7ff',
  night: '#120a2a', night2: '#24124a', violet: '#3b1d6e', teal: '#29d3c3',
  rae: { skin: '#c98d6a', skinS: '#a5704f', hair: '#2b2244', hairS: '#1e1733', hairL: '#4a3e72', hood: '#7a7499', hoodS: '#5c577f' },
  pip: { skin: '#f3c9a6', skinS: '#dca383', hair: '#47d3bd', hairS: '#2aa592', hairL: '#9af2e2', shirt: '#b9a6ff', shirtS: '#917ce6', blush: 'rgba(255,120,150,.45)', clip: '#ffd23f' },
  mags: { shell: '#eef0f7', shellS: '#c1c6d8', band: '#20183a', eye: '#ff2a3a' },
  LW: 4.2,
};

// ---------- drawing helpers (unit space) ----------
function tShape(c, fill, path, lw) {
  c.beginPath(); path(c);
  if (fill) { c.fillStyle = fill; c.fill(); }
  c.lineWidth = lw || TOON.LW; c.strokeStyle = TOON.ink; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
}
function tShade(c, clipPath, color, shadePath) {
  c.save(); c.beginPath(); clipPath(c); c.clip();
  c.beginPath(); shadePath(c); c.fillStyle = color; c.fill(); c.restore();
}
function tLine(c, pts, lw) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.lineWidth = lw || TOON.LW; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}
function tCurve(c, x0, y0, cx, cy, x1, y1, lw, col) {
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1);
  c.lineWidth = lw || TOON.LW; c.strokeStyle = col || TOON.ink; c.lineCap = 'round'; c.stroke();
}
// outlined tube (limbs): ink stroke, then fill stroke on top
function tTube(c, pts, w, fill, shade) {
  const run = () => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 4) c.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  run(); c.lineWidth = w + TOON.LW * 2; c.strokeStyle = TOON.ink; c.stroke();
  run(); c.lineWidth = w; c.strokeStyle = fill; c.stroke();
  if (shade) { run(); c.lineWidth = w * .34; c.strokeStyle = shade; c.save(); c.translate(w * .2, w * .08); c.stroke(); c.restore(); }
}
function tEllipse(c, x, y, rx, ry, fill, lw, rot) {
  tShape(c, fill, g => g.ellipse(x, y, rx, ry, rot || 0, 0, 6.2832), lw);
}
function tEllipsePath(x, y, rx, ry, rot) { return g => g.ellipse(x, y, rx, ry, rot || 0, 0, 6.2832); }
function tHand(c, x, y, r, skin, skinS, open) {
  if (!open) { tEllipse(c, x, y, r * 1.15, r, skin); tShade(c, tEllipsePath(x, y, r * 1.15, r), skinS, g => g.ellipse(x + r * .5, y + r * .55, r, r * .6, 0, 0, 6.2832)); return; }
  // open waving hand: palm + four fingers + thumb
  const f = [[-.9, -1.9, -.2], [-.3, -2.25, -.05], [.35, -2.15, .1], [.95, -1.75, .28]];
  for (const [fx, fy, rot] of f) tTube(c, [x + fx * r * .55, y - r * .3, x + fx * r * .7, y + fy * r * .55, x + fx * r * .85, y + fy * r], r * .52, skin);
  tTube(c, [x - r * .9, y + r * .1, x - r * 1.5, y - r * .1, x - r * 1.75, y - r * .6], r * .5, skin);
  tEllipse(c, x, y, r * .95, r * .9, skin);
  tShade(c, tEllipsePath(x, y, r * .95, r * .9), skinS, g => g.ellipse(x + r * .5, y + r * .5, r * .8, r * .5, 0, 0, 6.2832));
}
function tText(c, s, x, y, size, color, font, align, weight) {
  c.font = `${weight || 600} ${size}px ${font || '"Fredoka"'}`; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(s, x, y);
}
function nameTag(c, x, y, w, h, label, sticker) {
  tShape(c, TOON.white, g => g.roundRect(x - w / 2, y - h / 2, w, h, 3), 2.6);
  tText(c, label, x, y + .8, h * .78, TOON.ink);
  if (sticker) drawStar(c, x + w / 2 - 2, y - h / 2 + 1, 6.5, TOON.pip.clip, 2);
}
function drawStar(c, x, y, r, fill, lw) {
  tShape(c, fill, g => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }, lw);
}

// ---------- Rae: night clerk, three years in, deadpan ----------
// o.expr: deadpan | smirk | annoyed | shocked | sigh ; o.look: pupil x offset ; o.scanner: false to hide it
function drawRae(c, x, y, s, o = {}) {
  const R = TOON.rae, expr = o.expr || 'deadpan';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // bun + back hair (behind everything)
  tEllipse(c, 48, -196, 19, 17, R.hair); tCurve(c, 38, -202, 50, -213, 62, -200, 2.6, R.hairL);
  tCurve(c, 58, -186, 68, -180, 70, -170, 3.2);
  const back = g => { g.moveTo(-44, -232); g.bezierCurveTo(-52, -288, 50, -296, 46, -236); g.bezierCurveTo(48, -210, 44, -192, 36, -186); g.lineTo(-36, -186); g.bezierCurveTo(-46, -196, -46, -214, -44, -232); g.closePath(); };
  tShape(c, R.hairS, back);
  // hood behind neck
  tShape(c, R.hood, g => { g.moveTo(-42, -150); g.bezierCurveTo(-46, -176, 46, -176, 42, -150); g.closePath(); });
  // torso (hoodie): tall and narrow
  const torso = g => { g.moveTo(-60, 2); g.lineTo(-64, -106); g.bezierCurveTo(-64, -138, -44, -150, -16, -158); g.lineTo(16, -158); g.bezierCurveTo(44, -150, 64, -138, 64, -106); g.lineTo(60, 2); g.closePath(); };
  tShape(c, R.hood, torso);
  tShade(c, torso, R.hoodS, g => g.rect(30, -170, 50, 180));
  const vl = g => { g.moveTo(-54, 2); g.lineTo(-57, -102); g.bezierCurveTo(-56, -132, -42, -142, -28, -148); g.lineTo(-12, -104); g.lineTo(-14, 2); g.closePath(); };
  const vr = g => { g.moveTo(54, 2); g.lineTo(57, -102); g.bezierCurveTo(56, -132, 42, -142, 28, -148); g.lineTo(12, -104); g.lineTo(14, 2); g.closePath(); };
  tShape(c, TOON.orange, vl); tShape(c, TOON.orange, vr);
  tShade(c, vr, TOON.orangeS, g => g.rect(38, -160, 30, 170));
  tLine(c, [-6, -150, -8, -114], 2.6); tLine(c, [6, -150, 8, -112], 2.6);
  tEllipse(c, -8, -112, 2.6, 4, TOON.white, 2); tEllipse(c, 8, -110, 2.6, 4, TOON.white, 2);
  nameTag(c, -35, -88, 27, 12, 'RAE');
  // neck, ears, face
  const neck = g => g.rect(-12, -184, 24, 30);
  tShape(c, R.skin, neck); tShade(c, neck, R.skinS, g => g.rect(-12, -184, 24, 12));
  tEllipse(c, -37, -222, 7, 11, R.skin); tEllipse(c, 37, -222, 7, 11, R.skin);
  const face = g => { g.moveTo(0, -273); g.bezierCurveTo(26, -273, 39, -258, 38, -232); g.bezierCurveTo(37, -206, 26, -182, 0, -177); g.bezierCurveTo(-26, -182, -37, -206, -38, -232); g.bezierCurveTo(-39, -258, -26, -273, 0, -273); g.closePath(); };
  tShape(c, R.skin, face);
  tShade(c, face, R.skinS, g => { g.moveTo(22, -280); g.bezierCurveTo(34, -240, 32, -200, 6, -170); g.lineTo(60, -170); g.lineTo(60, -280); g.closePath(); });
  // eyes
  const lid = { deadpan: 10.5, smirk: 9, annoyed: 12, shocked: 0, sigh: 0 }[expr] ?? 10.5;
  for (const sx of [-1, 1]) {
    const ex = sx * 16, ey = -226;
    if (expr === 'sigh') { tCurve(c, ex - 10, ey - 1, ex, ey + 5, ex + 10, ey - 1, 4.2); }
    else {
      const ry = expr === 'shocked' ? 11 : 8.5, sc = tEllipsePath(ex, ey, 11, ry);
      tShape(c, TOON.white, sc, 3);
      c.save(); c.beginPath(); sc(c); c.clip();
      c.fillStyle = TOON.ink; c.beginPath();
      if (expr === 'shocked') c.arc(ex, ey, 3.2, 0, 6.2832); else c.arc(ex + (o.look ?? 1.5), ey + 2.5, 4.6, 0, 6.2832);
      c.fill();
      if (lid) { c.fillStyle = R.skin; c.fillRect(ex - 14, ey - 12, 28, lid); }
      c.restore();
      if (lid) tLine(c, [ex - 12.5, ey - 12 + lid + .5, ex + 12.5, ey - 12 + lid - .5], 4.2);
    }
    if (expr !== 'shocked') tCurve(c, ex - 8, ey + 12, ex, ey + 15, ex + 8, ey + 12, 2, R.skinS);   // tired bags
    // brows
    const bi = ex - sx * 11, bo = ex + sx * 11;
    if (expr === 'annoyed') tLine(c, [bo, -247, bi, -238], 4.6);
    else if (expr === 'shocked') tCurve(c, bi, -250, ex, -257, bo, -250, 4.6);
    else if (expr === 'sigh') tLine(c, [bi, -246, bo, -240], 4.6);
    else if (expr === 'smirk' && sx > 0) tLine(c, [bi, -246, bo, -251], 4.6);
    else tLine(c, [bi, -242, bo, -242 + (sx > 0 ? -1 : 0)], 4.6);
  }
  // nose + mouth
  tCurve(c, 1, -214, 6, -206, 0, -203, 2.8);
  if (expr === 'smirk') tCurve(c, -10, -192, 2, -190, 12, -196, 3.6);
  else if (expr === 'annoyed') tCurve(c, -11, -190, 0, -196, 11, -190, 3.6);
  else if (expr === 'shocked') tEllipse(c, 0, -190, 5, 7, '#5a1430', 3.2);
  else if (expr === 'sigh') { tEllipse(c, -3, -191, 4, 3.4, '#5a1430', 3); tCurve(c, -16, -188, -24, -184, -22, -178, 2.6, 'rgba(255,255,255,.8)'); tCurve(c, -24, -192, -34, -188, -32, -180, 2.6, 'rgba(255,255,255,.8)'); }
  else tCurve(c, -11, -192, 0, -192.5, 11, -194, 3.6);
  // front hair: middle part, curtains, flyaways
  const curtL = g => { g.moveTo(2, -278); g.bezierCurveTo(-22, -276, -42, -262, -44, -232); g.bezierCurveTo(-44, -214, -42, -202, -40, -196); g.bezierCurveTo(-36, -222, -26, -246, 2, -262); g.closePath(); };
  const curtR = g => { g.moveTo(4, -278); g.bezierCurveTo(28, -278, 46, -262, 45, -232); g.bezierCurveTo(45, -216, 43, -204, 41, -198); g.bezierCurveTo(38, -226, 26, -248, 4, -262); g.closePath(); };
  tShape(c, R.hair, curtL); tShape(c, R.hair, curtR);
  tCurve(c, -8, -270, -28, -262, -34, -238, 2.6, R.hairL);
  tCurve(c, 2, -279, 6, -296, 16, -300, 3.4); tCurve(c, -4, -279, -12, -294, -6, -304, 3.4);
  // forearms resting on the counter
  if (o.arms !== false) {
    tTube(c, [-58, -122, -76, -72, -72, -26, -44, -20, -12, -22], 24, R.hood);
    tTube(c, [58, -122, 76, -72, 74, -24, 50, -16, 20, -18], 24, R.hood, R.hoodS);
    tHand(c, -8, -23, 9.5, R.skin, R.skinS);
    if (o.scanner !== false) {
      tShape(c, '#9aa0b8', g => g.roundRect(8, -40, 34, 14, 5), 3.4);
      tShape(c, '#ff3355', g => g.roundRect(34, -37, 7, 8, 2), 2.2);
      tShape(c, '#7a8098', g => { g.moveTo(14, -28); g.lineTo(24, -28); g.lineTo(21, -16); g.lineTo(13, -16); g.closePath(); }, 3.2);
    }
    tHand(c, 22, -19, 9.5, R.skin, R.skinS);
  }
  c.restore();
}

// ---------- Pip: new hire, first week, delighted by everything ----------
// o.expr: grin | gasp | worried | sheepish | sad ; o.wave: false for both forearms on the counter
function drawPip(c, x, y, s, o = {}) {
  const P = TOON.pip, expr = o.expr || 'grin';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  const back = g => { g.moveTo(-54, -150); g.bezierCurveTo(-66, -214, -44, -236, 0, -236); g.bezierCurveTo(44, -236, 66, -214, 54, -150); g.bezierCurveTo(46, -140, 30, -140, 24, -146); g.lineTo(-24, -146); g.bezierCurveTo(-30, -140, -46, -140, -54, -150); g.closePath(); };
  tShape(c, P.hairS, back);
  const torso = g => { g.moveTo(-50, 2); g.lineTo(-53, -76); g.bezierCurveTo(-53, -98, -38, -106, -20, -110); g.lineTo(20, -110); g.bezierCurveTo(38, -106, 53, -98, 53, -76); g.lineTo(50, 2); g.closePath(); };
  tShape(c, P.shirt, torso);
  tShade(c, torso, P.shirtS, g => g.rect(24, -120, 40, 130));
  // oversized vest: wider than she is
  const vl = g => { g.moveTo(-62, 2); g.lineTo(-66, -76); g.bezierCurveTo(-66, -100, -50, -110, -30, -114); g.lineTo(-9, -78); g.lineTo(-11, 2); g.closePath(); };
  const vr = g => { g.moveTo(62, 2); g.lineTo(66, -76); g.bezierCurveTo(66, -100, 50, -110, 30, -114); g.lineTo(9, -78); g.lineTo(11, 2); g.closePath(); };
  tShape(c, TOON.orange, vl); tShape(c, TOON.orange, vr);
  tShade(c, vr, TOON.orangeS, g => g.rect(44, -120, 30, 130));
  nameTag(c, -34, -62, 26, 12, 'PIP', true);
  drawStar(c, -44, -42, 5, '#7ef0ff', 2);
  tShape(c, P.shirt, g => { g.moveTo(-20, -112); g.quadraticCurveTo(0, -96, 20, -112); g.quadraticCurveTo(0, -104, -20, -112); g.closePath(); }, 3);
  const neck = g => g.rect(-10, -134, 20, 24);
  tShape(c, P.skin, neck); tShade(c, neck, P.skinS, g => g.rect(-10, -134, 20, 10));
  tEllipse(c, -44, -170, 7, 10, P.skin); tEllipse(c, 44, -170, 7, 10, P.skin);
  const face = g => g.ellipse(0, -174, 45, 44, 0, 0, 6.2832);
  tShape(c, P.skin, face);
  tShade(c, face, P.skinS, g => g.ellipse(30, -160, 26, 40, -.3, 0, 6.2832));
  c.fillStyle = expr === 'sheepish' ? 'rgba(255,100,135,.6)' : P.blush;
  c.beginPath(); c.ellipse(-26, -156, 10, 6, 0, 0, 6.2832); c.ellipse(27, -156, 10, 6, 0, 0, 6.2832); c.fill();
  // eyes
  for (const sx of [-1, 1]) {
    const ex = sx * 18, ey = -174;
    if (expr === 'sheepish') { tCurve(c, ex - 10, ey + 4, ex, ey - 8, ex + 10, ey + 4, 4.6); continue; }
    const big = expr === 'gasp' ? 1.12 : 1;
    tEllipse(c, ex, ey, 12.5 * big, 15.5 * big, TOON.white, 3);
    const pr = expr === 'worried' ? .78 : expr === 'gasp' ? .85 : 1;
    c.fillStyle = TOON.ink; c.beginPath(); c.ellipse(ex + 1, ey + 2, 8.6 * pr, 10.5 * pr, 0, 0, 6.2832); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 2.5, ey - 3, 3.4, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(ex + 3.6, ey + 5, 1.7, 0, 6.2832); c.fill();
    if (expr === 'sad') { c.fillStyle = 'rgba(126,220,255,.85)'; c.beginPath(); c.ellipse(ex, ey + 11, 11, 4.5, 0, 0, 6.2832); c.fill(); tShape(c, '#9fe6ff', g => { g.moveTo(ex + sx * 6, ey + 14); g.quadraticCurveTo(ex + sx * 12, ey + 26, ex + sx * 7, ey + 30); g.quadraticCurveTo(ex + sx * 1, ey + 26, ex + sx * 6, ey + 14); g.closePath(); }, 2.4); }
    tCurve(c, ex + sx * 9, ey - 13, ex + sx * 14, ey - 15, ex + sx * 16, ey - 19, 3);   // lash flick
  }
  tCurve(c, -2, -160, 0, -157, 3, -159, 2.6);   // nose
  // mouth
  if (expr === 'grin' || expr === 'sheepish') {
    const k = expr === 'sheepish' ? .62 : 1, my = expr === 'sheepish' ? -147 : -149;
    const m = g => { g.moveTo(-19 * k, my); g.quadraticCurveTo(0, my + 4 * k, 19 * k, my); g.quadraticCurveTo(16 * k, my + 23 * k, 0, my + 24 * k); g.quadraticCurveTo(-16 * k, my + 23 * k, -19 * k, my); g.closePath(); };
    tShape(c, '#5a1430', m, 3.6);
    c.save(); c.beginPath(); m(c); c.clip();
    c.fillStyle = '#fff'; c.fillRect(-20, my - 2, 40, 7 * k);
    c.fillStyle = '#ff7f97'; c.beginPath(); c.ellipse(2 * k, my + 24 * k, 11 * k, 7 * k, 0, 0, 6.2832); c.fill();
    c.restore(); tShape(c, null, m, 3.6);
  } else if (expr === 'gasp') {
    tEllipse(c, 0, -138, 11, 13, '#5a1430', 3.6);
    c.save(); c.beginPath(); c.ellipse(0, -138, 11, 13, 0, 0, 6.2832); c.clip(); c.fillStyle = '#ff7f97'; c.beginPath(); c.ellipse(0, -128, 8, 6, 0, 0, 6.2832); c.fill(); c.restore();
    tEllipse(c, 0, -138, 11, 13, null, 3.6);
  } else if (expr === 'worried') {
    c.beginPath(); c.moveTo(-12, -141); c.bezierCurveTo(-6, -147, -2, -135, 3, -141); c.bezierCurveTo(7, -146, 10, -140, 12, -142);
    c.lineWidth = 3.6; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.stroke();
  } else if (expr === 'sad') {
    tCurve(c, -11, -137, 0, -146, 11, -137, 3.8);
  }
  // front hair: blunt bangs + side locks curling in
  const bangs = g => { g.moveTo(-50, -168); g.bezierCurveTo(-56, -222, -30, -232, 0, -232); g.bezierCurveTo(30, -232, 56, -222, 50, -168); g.bezierCurveTo(46, -176, 44, -186, 42, -196); g.lineTo(32, -192); g.lineTo(22, -197); g.lineTo(10, -192); g.lineTo(-2, -197); g.lineTo(-14, -192); g.lineTo(-26, -197); g.lineTo(-38, -192); g.lineTo(-43, -196); g.bezierCurveTo(-45, -186, -47, -176, -50, -168); g.closePath(); };
  tShape(c, P.hair, bangs);
  tShape(c, P.hair, g => { g.moveTo(-50, -170); g.bezierCurveTo(-60, -150, -56, -132, -40, -136); g.bezierCurveTo(-48, -146, -46, -158, -44, -168); g.closePath(); });
  tShape(c, P.hair, g => { g.moveTo(50, -170); g.bezierCurveTo(60, -150, 56, -132, 40, -136); g.bezierCurveTo(48, -146, 46, -158, 44, -168); g.closePath(); });
  tCurve(c, -30, -224, -12, -230, 6, -228, 3.4, P.hairL);
  drawStar(c, 34, -214, 11, P.clip, 3.2);
  // brows sit on top of the bangs (toon convention)
  for (const sx of [-1, 1]) {
    const ex = sx * 18, ey = -174, bi = ex - sx * 9, bo = ex + sx * 9;
    if (expr === 'worried' || expr === 'sad') tLine(c, [bi, ey - 32, bo, ey - 25], 4.4);
    else if (expr === 'gasp') tCurve(c, bi, ey - 31, ex, ey - 38, bo, ey - 31, 4.4);
    else if (expr === 'sheepish') tCurve(c, bi, ey - 25, ex, ey - 28, bo, ey - 26, 4.4);
    else tCurve(c, bi, ey - 26, ex, ey - 31, bo, ey - 27, 4.4);
  }
  if (expr === 'worried' || expr === 'sheepish') tShape(c, '#9fe6ff', g => { g.moveTo(52, -206); g.quadraticCurveTo(60, -192, 56, -186); g.quadraticCurveTo(50, -182, 47, -190); g.quadraticCurveTo(46, -196, 52, -206); g.closePath(); }, 2.6);
  // arms
  if (o.arms !== false) {
    tTube(c, [-52, -88, -68, -50, -66, -16, -44, -10, -22, -12], 21, P.shirt);
    tHand(c, -18, -13, 8.5, P.skin, P.skinS);
    if (o.wave !== false) {
      tTube(c, [50, -92, 78, -98, 84, -126, 88, -146, 90, -164], 20, P.shirt, P.shirtS);
      tHand(c, 91, -176, 10, P.skin, P.skinS, true);
    } else {
      tTube(c, [52, -88, 68, -50, 66, -16, 44, -10, 22, -12], 21, P.shirt, P.shirtS);
      tHand(c, 18, -13, 8.5, P.skin, P.skinS);
    }
  }
  c.restore();
}

// ---------- MAGS: the store's AI manager, a ceiling dome camera ----------
// (x, y) = ceiling mount point, s = dome width in px
function drawMags(c, x, y, s, o = {}) {
  const M = TOON.mags;
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  tShape(c, M.shellS, g => g.roundRect(-30, -4, 60, 12, 3));
  tShape(c, M.shellS, g => g.rect(-8, 6, 16, 14));
  const dome = g => { g.moveTo(-50, 20); g.lineTo(50, 20); g.bezierCurveTo(50, 70, 28, 84, 0, 84); g.bezierCurveTo(-28, 84, -50, 70, -50, 20); g.closePath(); };
  tShape(c, M.shell, dome);
  tShade(c, dome, M.shellS, g => g.ellipse(26, 60, 30, 40, -.4, 0, 6.2832));
  const band = g => { g.moveTo(-46, 40); g.bezierCurveTo(-30, 50, 30, 50, 46, 40); g.bezierCurveTo(42, 56, 30, 66, 0, 67); g.bezierCurveTo(-30, 66, -42, 56, -46, 40); g.closePath(); };
  tShape(c, M.band, band, 3.4);
  const tk = o.talk || 0;
  c.save(); c.shadowColor = M.eye; c.shadowBlur = (o.glow || 26) + 34 * tk;
  c.fillStyle = M.eye; c.beginPath(); c.arc(6, 54, 7.5 * (1 + .35 * tk), 0, 6.2832); c.fill(); c.fill(); c.restore();
  if (tk > .05) { c.save(); c.globalAlpha = .5 * tk; c.strokeStyle = M.eye; c.lineWidth = 2.4; c.beginPath(); c.arc(6, 54, 14 + 6 * tk, 0, 6.2832); c.stroke(); c.restore(); }
  c.fillStyle = '#ffd0d4'; c.beginPath(); c.arc(4, 52, 2.4, 0, 6.2832); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3.4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-40, 26); c.quadraticCurveTo(-38, 33, -33, 37); c.stroke();
  c.restore();
}

// ---------- Dennis: the regular. A very large, very polite slug who drives a freight hauler ----------
// (x, y) = counter top under his centre, s = scale (100 = same unit size as the clerks)
function drawDennis(c, x, y, s, o = {}) {
  const D = { body: '#8fd65a', bodyS: '#62ad38', belly: '#c6f29c', spot: '#6db33f', stache: '#7a4e2c', stacheS: '#5a3720', cap: '#e23b4a', capS: '#b52634', panel: '#fbf7ff' };
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // eye stalks (behind the body top)
  const look = o.look ?? 0;
  for (const sx of [-1, 1]) {
    tTube(c, [sx * 34, -268, sx * 40, -300, sx * 52, -334], 15, D.body, sx > 0 ? D.bodyS : null);
  }
  // body
  const body = g => { g.moveTo(-118, 2); g.bezierCurveTo(-122, -90, -100, -190, -70, -246); g.bezierCurveTo(-50, -284, 50, -284, 70, -246); g.bezierCurveTo(100, -190, 122, -90, 118, 2); g.closePath(); };
  tShape(c, D.body, body);
  tShade(c, body, D.bodyS, g => { g.moveTo(60, -270); g.bezierCurveTo(100, -190, 112, -90, 100, 10); g.lineTo(140, 10); g.lineTo(140, -270); g.closePath(); });
  tShade(c, body, D.belly, g => g.ellipse(-4, -70, 70, 110, 0, 0, 6.2832));
  for (const [sx, sy, r] of [[-82, -150, 9], [-92, -110, 6], [76, -176, 7], [88, -128, 10], [-60, -222, 6], [54, -236, 5]]) {
    c.fillStyle = D.spot; c.beginPath(); c.ellipse(sx, sy, r * 1.2, r, .3, 0, 6.2832); c.fill();
  }
  // slime sheen
  tCurve(c, -96, -120, -92, -170, -68, -214, 4, 'rgba(255,255,255,.75)');
  tCurve(c, -100, -92, -100, -100, -99, -106, 4, 'rgba(255,255,255,.75)');
  tShape(c, null, body);
  // eyes on the stalks
  for (const sx of [-1, 1]) {
    const ex = sx * 54, ey = -344;
    tEllipse(c, ex, ey, 17, 18, TOON.white, 3.6);
    c.fillStyle = TOON.ink; c.beginPath(); c.arc(ex + look * 5 + sx * -2, ey + 6, 7.5, 0, 6.2832); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + look * 5 + sx * -2 - 2.5, ey + 3, 2.4, 0, 6.2832); c.fill();
    tCurve(c, ex - 13, ey - 13, ex, ey - 22, ex + 13, ey - 13, 3.6);
  }
  // trucker cap
  const crown = g => { g.moveTo(-46, -252); g.bezierCurveTo(-46, -300, 46, -300, 46, -252); g.closePath(); };
  tShape(c, D.cap, crown);
  tShade(c, crown, D.capS, g => g.rect(20, -300, 40, 60));
  tShape(c, D.panel, g => { g.moveTo(-24, -253); g.bezierCurveTo(-24, -290, 24, -290, 24, -253); g.closePath(); }, 3);
  tEllipse(c, 0, -269, 11, 11, TOON.orange, 3); tText(c, 'D', 0, -268, 15, TOON.white);  // monogram patch
  tShape(c, D.capS, g => { g.moveTo(-54, -252); g.quadraticCurveTo(0, -236, 54, -252); g.quadraticCurveTo(0, -246, -54, -252); g.closePath(); }, 3.6);
  // moustache + smile
  const st = g => { g.moveTo(0, -206); g.bezierCurveTo(-14, -220, -40, -214, -52, -196); g.bezierCurveTo(-40, -200, -28, -196, -18, -190); g.bezierCurveTo(-10, -186, -4, -190, 0, -194); g.bezierCurveTo(4, -190, 10, -186, 18, -190); g.bezierCurveTo(28, -196, 40, -200, 52, -196); g.bezierCurveTo(40, -214, 14, -220, 0, -206); g.closePath(); };
  tCurve(c, -16, -180, 0, -170, 16, -180, 3.8);
  tShape(c, D.stache, st);
  tShade(c, st, D.stacheS, g => g.rect(-60, -200, 120, 14));
  // stubby arms holding today's one item
  if (o.item !== false) {
    tTube(c, [-104, -60, -84, -30, -50, -18], 24, D.body);
    tTube(c, [104, -60, 84, -30, 50, -18], 24, D.body, D.bodyS);
    tShape(c, '#ffd23f', g => g.roundRect(-28, -62, 56, 56, 8));
    tShape(c, TOON.orange, g => g.rect(-28, -44, 56, 18), 3);
    tText(c, 'MILK', 0, -35, 13, TOON.ink);
    tEllipse(c, -46, -18, 13, 11, D.body); tEllipse(c, 46, -18, 13, 11, D.body);
  }
  // little slime puddle on the counter
  c.fillStyle = 'rgba(170,240,120,.55)'; c.beginPath(); c.ellipse(70, 2, 46, 7, 0, 0, 6.2832); c.fill();
  c.restore();
}

// ---------- shared anime-flat helpers (used by both shows) ----------
// bangs made of curved clumps: pts = [[x, y], ...] alternating valley, tip, valley, tip ... (left to right)
function clumps(g, pts) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const toTip = y1 > y0;
    const cx = toTip ? x1 - (x1 - x0) * .12 : x0 + (x1 - x0) * .12, cy = toTip ? y0 + (y1 - y0) * .3 : y1 + (y0 - y1) * .3;
    g.quadraticCurveTo(cx, cy, x1, y1);
  }
}
// anime eye: sx = -1 (viewer's left) / 1, w/h = half width/height, lid 0..1 covers the top, look = pupil shift
function animeEye(c, ex, ey, sx, o) {
  const w = o.w || 12, h = o.h || 12, lid = o.lid || 0, look = o.look || 0, tilt = o.tilt ?? .3;
  const ixx = ex - sx * w, oxx = ex + sx * w, iyy = ey - h * .1, oyy = ey - h * .1 - tilt * h * .3;   // inner / outer corners
  const up = o.round ? (g => { g.moveTo(ixx, iyy); g.bezierCurveTo(ixx + sx * 1, ey - h * 1.02, oxx - sx * 2, ey - h * 1.02, oxx, oyy); })
                    : (g => { g.moveTo(ixx, iyy); g.quadraticCurveTo(ex - sx * 1, ey - h * 1.35, oxx, oyy); });
  const shape = g => { up(g); g.quadraticCurveTo(ex, ey + h * .6, ixx, iyy); g.closePath(); };
  c.beginPath(); shape(c); c.fillStyle = '#ffffff'; c.fill();
  c.save(); c.beginPath(); shape(c); c.clip();
  const cx0 = ex + look, cy0 = ey - h * .3, rx = w * .56, ry = h * .82;
  const gr = c.createLinearGradient(0, cy0 - ry, 0, cy0 + ry); gr.addColorStop(0, o.irisD); gr.addColorStop(1, o.iris);
  c.fillStyle = gr; c.beginPath(); c.ellipse(cx0, cy0, rx, ry, 0, 0, 6.2832); c.fill();
  c.fillStyle = TOON.ink; c.beginPath(); c.ellipse(cx0, cy0 + ry * .05, rx * .4, ry * .46, 0, 0, 6.2832); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(cx0 - rx * .35, cy0 - ry * .4, rx * .32, ry * .22, -.5, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(cx0 + rx * .38, cy0 + ry * .45, rx * .14, 0, 6.2832); c.fill();
  if (lid > 0) {
    const ly = ey - h * 1.05 + lid * h * 1.25;
    c.fillStyle = o.skin; c.beginPath(); c.moveTo(ixx - sx * 4, ey - h * 1.8); c.lineTo(ixx - sx * 4, ly - 1); c.quadraticCurveTo(ex, ly - h * .14, oxx + sx * 4, ly + 2.5); c.lineTo(oxx + sx * 4, ey - h * 1.8); c.closePath(); c.fill();
    c.restore();
    c.beginPath(); c.moveTo(ixx, ly - 1); c.quadraticCurveTo(ex, ly - h * .14, oxx + sx * 2, ly + 3.5);
    c.lineWidth = 5; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.stroke();
  } else {
    c.restore();
    c.beginPath(); up(c); c.lineWidth = 5.4; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.stroke();
  }
  if (lid < .3 && o.flick !== false) tLine(c, [oxx, oyy, oxx + sx * 5, oyy - h * .45 - tilt * h * .1], 4.2);   // outer lash flick
  if (o.flick === false && lid < .3) tLine(c, [oxx, oyy, oxx + sx * 5, oyy - 1.5], 3.6);
  tCurve(c, ex + sx * w * .2, ey + h * .5, ex + sx * w * .7, ey + h * .38, ex + sx * w * .95, ey + h * .12, 2);
}


// ---------- logo: VOID MART with a black hole for the O ----------
// (x, y) = centre of the word, cap = cap height in px. Returns the drawn width.
function drawLogo(c, x, y, cap, o = {}) {
  const font = `${cap / .72}px "Bungee"`;
  c.save(); c.font = font; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const word = o.text || 'VOID MART', track = cap * .06;
  const glyphs = [...word], wO = cap * 1.02;
  const widths = glyphs.map((g, i) => (g === 'O' && i === 1) ? wO : c.measureText(g).width);
  const total = widths.reduce((a, b) => a + b, 0) + track * (glyphs.length - 1);
  let gx = x - total / 2; const base = y + cap / 2;
  const fillCore = (g, px) => {
    const gr = c.createLinearGradient(0, base - cap, 0, base);
    gr.addColorStop(0, '#ffe2ae'); gr.addColorStop(.45, TOON.orangeL); gr.addColorStop(1, TOON.orange);
    c.fillStyle = gr; c.fillText(g, px, base);
  };
  const pos = [];
  glyphs.forEach((g, i) => { pos.push(gx); gx += widths[i] + track; });
  // glow pass
  c.save(); c.shadowColor = 'rgba(255,122,26,.95)'; c.shadowBlur = cap * (o.glow ?? .45); c.fillStyle = TOON.orange;
  glyphs.forEach((g, i) => { if (!(g === 'O' && i === 1)) c.fillText(g, pos[i], base); }); c.restore();
  // ink outline + core
  glyphs.forEach((g, i) => {
    if (g === 'O' && i === 1) return;
    c.lineWidth = cap * .09; c.strokeStyle = TOON.ink; c.lineJoin = 'round'; c.strokeText(g, pos[i], base);
    fillCore(g, pos[i]);
  });
  // the O: a small black hole (only when the second letter is an O)
  if (glyphs[1] !== 'O') { c.restore(); return total; }
  const ox = pos[1] + wO / 2, oy = base - cap / 2, r = cap * .5;
  c.save(); c.translate(ox, oy);
  const disk = (front) => {
    c.save(); c.rotate(-.32); c.beginPath();
    if (front) c.ellipse(0, 0, r * 1.5, r * .34, 0, 0, Math.PI); else c.ellipse(0, 0, r * 1.5, r * .34, 0, Math.PI, Math.PI * 2);
    c.lineWidth = cap * .2; c.strokeStyle = TOON.ink; c.stroke();
    c.lineWidth = cap * .11; const gr = c.createLinearGradient(-r * 1.5, 0, r * 1.5, 0);
    gr.addColorStop(0, '#ff4fa3'); gr.addColorStop(.5, '#ffe2ae'); gr.addColorStop(1, TOON.orange); c.strokeStyle = gr; c.stroke(); c.restore();
  };
  disk(false);
  c.save(); c.shadowColor = 'rgba(255,122,26,.95)'; c.shadowBlur = cap * (o.glow ?? .45);
  c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fillStyle = TOON.orange; c.fill(); c.restore();
  c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.lineWidth = cap * .09; c.strokeStyle = TOON.ink; c.stroke();
  c.beginPath(); c.arc(0, 0, r * .9, 0, 6.2832); c.fillStyle = '#ffd08a'; c.fill();
  c.beginPath(); c.arc(0, 0, r * .62, 0, 6.2832); c.fillStyle = '#07030f'; c.fill();
  c.lineWidth = cap * .05; c.strokeStyle = TOON.ink; c.stroke();
  disk(true);
  c.restore();
  c.restore();
  return total;
}

function toonFonts(base = 'fonts/') {
  return Promise.all([
    new FontFace('Bungee', `url(${base}bungee-400.woff2)`).load(),
    new FontFace('Fredoka', `url(${base}fredoka-600.woff2)`, { weight: '600' }).load(),
  ]).then(fs => fs.forEach(f => document.fonts.add(f)));
}

// starfield helper (deterministic)
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function drawStars(c, w, h, n, seed, x0 = 0, y0 = 0) {
  const R = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + R() * w, y = y0 + R() * h, r = R() < .9 ? .8 + R() * 1.6 : 2.6 + R() * 2.4, a = .35 + R() * .65;
    c.fillStyle = `rgba(255,246,230,${a})`; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
    if (r > 3) { c.strokeStyle = `rgba(255,246,230,${a * .8})`; c.lineWidth = r * .45; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - r * 3, y); c.lineTo(x + r * 3, y); c.moveTo(x, y - r * 3); c.lineTo(x, y + r * 3); c.stroke(); }
  }
}


// ---------- animation helpers for the v2 rigs ----------
// talking mouth: a = 0..1 open, shape 'a' | 'o' | 'e'
function talkMouth(c, x, y, a, shape, k = 1) {
  const rx = (shape === 'o' ? 4.5 + 2 * a : shape === 'e' ? 7 + 3 * a : 6.5 + 3.5 * a) * k;
  const ry = (shape === 'o' ? 4 + 5 * a : shape === 'e' ? 1.8 + 4 * a : 2.5 + 7.5 * a) * k;
  const m = g => g.ellipse(x, y + ry * .35, rx, ry, 0, 0, 6.2832);
  tShape(c, '#4a1028', m, 3);
  c.save(); c.beginPath(); m(c); c.clip();
  if (shape !== 'o') { c.fillStyle = '#fff'; c.fillRect(x - rx, y + ry * .35 - ry, rx * 2, ry * .45); }
  c.fillStyle = '#ff7f97'; c.beginPath(); c.ellipse(x, y + ry * 1.25, rx * .7, ry * .55, 0, 0, 6.2832); c.fill();
  c.restore(); tShape(c, null, m, 3);
}
function closedEye(c, ex, ey, w, happy) {
  if (happy) tCurve(c, ex - w, ey + 2, ex, ey - 8, ex + w, ey + 2, 4.6);
  else tCurve(c, ex - w, ey - 3, ex, ey + 3, ex + w, ey - 3, 4.6);
}

// ======================= v2: Void Mart cast in the shared anime-flat look (same silhouettes, colours and outfits) =======================
function drawRae2(c, x, y, s, o = {}) {
  const R = TOON.rae, expr = o.expr || 'deadpan', IR = { iris: '#a27a4e', irisD: '#3e2716' };
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // low messy bun + back hair
  tEllipse(c, 50, -194, 19, 17, R.hair); tCurve(c, 40, -200, 52, -212, 64, -198, 2.6, R.hairL);
  tCurve(c, 60, -184, 70, -178, 72, -168, 3.2);
  tShape(c, R.hairS, g => { g.moveTo(-46, -182); g.quadraticCurveTo(-60, -232, -48, -262); g.quadraticCurveTo(-34, -298, 2, -298); g.quadraticCurveTo(38, -298, 50, -262); g.quadraticCurveTo(60, -232, 46, -182); g.lineTo(38, -192); g.lineTo(-38, -192); g.closePath(); });
  // hood, hoodie, vest (as v1)
  tShape(c, R.hood, g => { g.moveTo(-42, -150); g.bezierCurveTo(-46, -176, 46, -176, 42, -150); g.closePath(); });
  const torso = g => { g.moveTo(-60, 2); g.lineTo(-64, -106); g.bezierCurveTo(-64, -138, -44, -150, -16, -158); g.lineTo(16, -158); g.bezierCurveTo(44, -150, 64, -138, 64, -106); g.lineTo(60, 2); g.closePath(); };
  tShape(c, R.hood, torso); tShade(c, torso, R.hoodS, g => g.rect(30, -170, 50, 180));
  const vl = g => { g.moveTo(-54, 2); g.lineTo(-57, -102); g.bezierCurveTo(-56, -132, -42, -142, -28, -148); g.lineTo(-12, -104); g.lineTo(-14, 2); g.closePath(); };
  const vr = g => { g.moveTo(54, 2); g.lineTo(57, -102); g.bezierCurveTo(56, -132, 42, -142, 28, -148); g.lineTo(12, -104); g.lineTo(14, 2); g.closePath(); };
  tShape(c, TOON.orange, vl); tShape(c, TOON.orange, vr); tShade(c, vr, TOON.orangeS, g => g.rect(38, -160, 30, 170));
  tLine(c, [-6, -150, -8, -114], 2.6); tLine(c, [6, -150, 8, -112], 2.6);
  tEllipse(c, -8, -112, 2.6, 4, TOON.white, 2); tEllipse(c, 8, -110, 2.6, 4, TOON.white, 2);
  nameTag(c, -35, -88, 27, 12, 'RAE');
  const neck = g => g.rect(-11, -184, 22, 30);
  tShape(c, R.skin, neck); tShade(c, neck, R.skinS, g => g.rect(-11, -184, 22, 12));
  tEllipse(c, -38, -222, 6.5, 10.5, R.skin); tEllipse(c, 38, -222, 6.5, 10.5, R.skin);
  // face
  const face = g => { g.moveTo(0, -272); g.bezierCurveTo(27, -272, 39, -256, 39, -232); g.bezierCurveTo(39, -210, 27, -188, 0, -175); g.bezierCurveTo(-27, -188, -39, -210, -39, -232); g.bezierCurveTo(-39, -256, -27, -272, 0, -272); g.closePath(); };
  tShape(c, R.skin, face);
  tShade(c, face, R.skinS, g => { g.moveTo(24, -278); g.bezierCurveTo(35, -240, 30, -200, 4, -170); g.lineTo(60, -170); g.lineTo(60, -278); g.closePath(); });
  // eyes: heavy-lidded
  const lid = { deadpan: .52, smirk: .44, annoyed: .64, shocked: 0, sigh: 1 }[expr] ?? .52;
  for (const sx of [-1, 1]) {
    const ex = sx * 16, ey = -222;
    if (expr === 'sigh') tCurve(c, ex - 10, ey - 4, ex, ey + 1, ex + 10, ey - 4, 4.4);
    else if (o.blink) closedEye(c, ex, ey - 3, 11);
    else animeEye(c, ex, ey, sx, { ...IR, skin: R.skin, w: 12, h: 12.5, lid, look: o.look ?? 1.5 });
    if (expr === 'shocked') { c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey - 4, 5.5, 0, 6.2832); c.fill(); c.fillStyle = TOON.ink; c.beginPath(); c.arc(ex, ey - 4, 2.6, 0, 6.2832); c.fill(); }
    if (expr !== 'shocked') tCurve(c, ex - 8, ey + 11, ex, ey + 13, ex + 8, ey + 10, 1.8, R.skinS);   // tired bags
    const bi = ex - sx * 11, bo = ex + sx * 11;
    if (expr === 'annoyed') tLine(c, [bo, -244, bi, -236], 3.6);
    else if (expr === 'shocked') tCurve(c, bi, -246, ex, -252, bo, -246, 3.6);
    else if (expr === 'sigh') tLine(c, [bi, -243, bo, -238], 3.6);
    else if (expr === 'smirk' && sx > 0) tLine(c, [bi, -242, bo, -248], 3.6);
    else tLine(c, [bi, -240, bo, -240], 3.6);
  }
  tLine(c, [2, -206, 0, -201], 2.6);
  if (o.mug > .55) { /* mug covers the mouth */ }
  else if (o.mouth && o.mouth.a > .06) talkMouth(c, 0, -191, o.mouth.a, o.mouth.shape, .9);
  else if (expr === 'smirk') tCurve(c, -8, -189, 2, -188, 10, -193, 3);
  else if (expr === 'annoyed') tCurve(c, -8, -187, 0, -191, 8, -187, 3);
  else if (expr === 'shocked') tEllipse(c, 0, -188, 4, 5.5, '#4a1028', 2.8);
  else if (expr === 'sigh') { tEllipse(c, -2, -189, 3.4, 2.8, '#4a1028', 2.6); tCurve(c, -14, -186, -22, -182, -20, -176, 2.4, 'rgba(255,255,255,.8)'); }
  else tLine(c, [-8, -189, 8, -189.5], 3);
  // front hair: middle part, long curtains in clumps, two antenna strands
  for (const sx of [-1, 1]) tShape(c, R.hair, g => {
    g.moveTo(sx * 2, -292); g.quadraticCurveTo(sx * 32, -290, sx * 45, -254); g.quadraticCurveTo(sx * 49, -224, sx * 46, -194);
    g.lineTo(sx * 40, -210); g.lineTo(sx * 37, -196); g.quadraticCurveTo(sx * 34, -228, sx * 24, -246);
    g.lineTo(sx * 17, -236); g.quadraticCurveTo(sx * 10, -258, sx * 2, -266); g.closePath(); });
  tCurve(c, -10, -284, -30, -276, -38, -250, 2.6, R.hairL);
  tCurve(c, 2, -291, 6, -308, 16, -312, 3.2); tCurve(c, -4, -291, -12, -306, -6, -316, 3.2);
  // coffee mug: o.mug 0 = on the counter, 1 = at the mouth. Lifted, it is held by her right hand, and that arm goes up with it.
  const mk = o.mug != null ? Math.min(1, Math.max(0, o.mug)) : 0, me = mk * mk * (3 - 2 * mk), lifted = o.mug != null && mk > .05;
  const mx = 40 + (6 - 40) * me, my = -16 + (-176 + 16) * me;
  if (o.arms !== false) {
    // left arm: forearm on the counter, or reaching for o.reachL = {x, y} (local units)
    if (o.reachL) { const r = o.reachL; tTube(c, [-58, -122, -84, -78, (-84 + r.x) / 2 - 6, (-78 + r.y) / 2 + 10, r.x - 4, r.y + 2], 24, R.hood); tHand(c, r.x, r.y, 9.5, R.skin, R.skinS); }
    else { tTube(c, [-58, -122, -76, -72, -72, -26, -44, -20, -12, -22], 24, R.hood); tHand(c, -8, -23, 9.5, R.skin, R.skinS); }
    if (o.scanner !== false) {                     // the scanner lies on the counter while she drinks
      tShape(c, '#9aa0b8', g => g.roundRect(8, -40, 34, 14, 5), 3.4);
      tShape(c, '#ff3355', g => g.roundRect(34, -37, 7, 8, 2), 2.2);
      tShape(c, '#7a8098', g => { g.moveTo(14, -28); g.lineTo(24, -28); g.lineTo(21, -16); g.lineTo(13, -16); g.closePath(); }, 3.2);
    }
    if (lifted) { tTube(c, [58, -122, 80, -76 - 20 * me, (80 + mx) / 2 + 14, (-76 + my) / 2 + 8, mx + 4, my + 8], 24, R.hood, R.hoodS); }
    else { tTube(c, [58, -122, 76, -72, 74, -24, 50, -16, 20, -18], 24, R.hood, R.hoodS); tHand(c, 22, -19, 9.5, R.skin, R.skinS); }
  }
  if (o.mug != null) {
    tShape(c, '#fbf7ff', g => g.roundRect(mx - 15, my - 26, 30, 32, 5), 3.4);
    tShape(c, '#fbf7ff', g => g.arc(mx + 17, my - 10, 8, -1.3, 1.3), 3.4);
    tShape(c, TOON.orange, g => g.rect(mx - 15, my - 16, 30, 7), 2.2);
    if (lifted) tHand(c, mx - 4, my - 2, 9.5, R.skin, R.skinS);
    if (mk > .4) for (let i = 0; i < 2; i++) tCurve(c, mx - 6 + i * 10, my - 30, mx - 2 + i * 10, my - 42, mx - 7 + i * 10, my - 54, 2.4, 'rgba(255,255,255,.6)');
  }
  c.restore();
}

function drawPip2(c, x, y, s, o = {}) {
  const P = TOON.pip, expr = o.expr || 'grin', IR = { iris: '#ffb347', irisD: '#a0521a' };
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  tShape(c, P.hairS, g => { g.moveTo(-54, -148); g.quadraticCurveTo(-66, -214, -44, -234); g.quadraticCurveTo(-24, -246, 0, -246); g.quadraticCurveTo(24, -246, 44, -234); g.quadraticCurveTo(66, -214, 54, -148); g.lineTo(44, -156); g.lineTo(40, -142); g.lineTo(30, -152); g.lineTo(-30, -152); g.lineTo(-40, -142); g.lineTo(-44, -156); g.closePath(); });
  const torso = g => { g.moveTo(-50, 2); g.lineTo(-53, -76); g.bezierCurveTo(-53, -98, -38, -106, -20, -110); g.lineTo(20, -110); g.bezierCurveTo(38, -106, 53, -98, 53, -76); g.lineTo(50, 2); g.closePath(); };
  tShape(c, P.shirt, torso); tShade(c, torso, P.shirtS, g => g.rect(24, -120, 40, 130));
  const vl = g => { g.moveTo(-62, 2); g.lineTo(-66, -76); g.bezierCurveTo(-66, -100, -50, -110, -30, -114); g.lineTo(-9, -78); g.lineTo(-11, 2); g.closePath(); };
  const vr = g => { g.moveTo(62, 2); g.lineTo(66, -76); g.bezierCurveTo(66, -100, 50, -110, 30, -114); g.lineTo(9, -78); g.lineTo(11, 2); g.closePath(); };
  tShape(c, TOON.orange, vl); tShape(c, TOON.orange, vr); tShade(c, vr, TOON.orangeS, g => g.rect(44, -120, 30, 130));
  nameTag(c, -34, -62, 26, 12, 'PIP', true);
  drawStar(c, -44, -42, 5, '#7ef0ff', 2);
  tShape(c, P.shirt, g => { g.moveTo(-20, -112); g.quadraticCurveTo(0, -96, 20, -112); g.quadraticCurveTo(0, -104, -20, -112); g.closePath(); }, 3);
  const neck = g => g.rect(-10, -136, 20, 26);
  tShape(c, P.skin, neck); tShade(c, neck, P.skinS, g => g.rect(-10, -136, 20, 10));
  tEllipse(c, -44, -174, 6.5, 10, P.skin); tEllipse(c, 44, -174, 6.5, 10, P.skin);
  // face: round, small chin
  const face = g => { g.moveTo(0, -222); g.bezierCurveTo(30, -222, 45, -204, 45, -180); g.bezierCurveTo(45, -158, 30, -138, 0, -131); g.bezierCurveTo(-30, -138, -45, -158, -45, -180); g.bezierCurveTo(-45, -204, -30, -222, 0, -222); g.closePath(); };
  tShape(c, P.skin, face);
  tShade(c, face, P.skinS, g => { g.moveTo(30, -228); g.bezierCurveTo(42, -190, 34, -152, 8, -126); g.lineTo(70, -126); g.lineTo(70, -228); g.closePath(); });
  c.fillStyle = expr === 'sheepish' ? 'rgba(255,100,135,.55)' : 'rgba(255,120,150,.35)';
  c.beginPath(); c.ellipse(-27, -158, 10, 5.5, 0, 0, 6.2832); c.ellipse(27, -158, 10, 5.5, 0, 0, 6.2832); c.fill();
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) tLine(c, [sx * (21 + k * 5), -155, sx * (24 + k * 5), -161], 1.8);
  // eyes: big and sparkly
  for (const sx of [-1, 1]) {
    const ex = sx * 18, ey = -170;
    if (expr === 'sheepish') { tCurve(c, ex - 10, ey - 2, ex, ey - 12, ex + 10, ey - 2, 4.6); continue; }
    if (o.blink) { closedEye(c, ex, ey - 2, 11, expr === 'grin'); continue; }
    const big = expr === 'gasp' ? 1.12 : 1;
    animeEye(c, ex, ey + 2, sx, { ...IR, skin: P.skin, w: 12.5 * big, h: 19 * big, lid: expr === 'sad' ? .12 : 0, look: expr === 'worried' ? -sx * 1.5 : 0, tilt: -.1, round: true, flick: false });
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 3, ey - 2, 1.8, 0, 6.2832); c.fill();
    if (expr === 'sad') { c.fillStyle = 'rgba(126,220,255,.8)'; c.beginPath(); c.ellipse(ex, ey + 6, 11, 4, 0, 0, 6.2832); c.fill(); tShape(c, '#9fe6ff', g => { g.moveTo(ex + sx * 6, ey + 8); g.quadraticCurveTo(ex + sx * 12, ey + 20, ex + sx * 7, ey + 24); g.quadraticCurveTo(ex + sx * 1, ey + 20, ex + sx * 6, ey + 8); g.closePath(); }, 2.4); }
  }
  tLine(c, [1, -158, 0, -155], 2.4);
  // mouth
  const talking = o.mouth && o.mouth.a > .06;
  if (talking && expr !== 'grin' && expr !== 'sheepish') talkMouth(c, 0, -146, o.mouth.a, o.mouth.shape, 1);
  else if (expr === 'grin' || expr === 'sheepish') {
    const k = (expr === 'sheepish' ? .6 : 1) * (talking ? .55 + .6 * o.mouth.a : 1), my = -150;
    const m = g => { g.moveTo(-14 * k, my); g.quadraticCurveTo(0, my + 3 * k, 14 * k, my); g.quadraticCurveTo(11 * k, my + 16 * k, 0, my + 17 * k); g.quadraticCurveTo(-11 * k, my + 16 * k, -14 * k, my); g.closePath(); };
    tShape(c, '#5a1430', m, 3.2);
    c.save(); c.beginPath(); m(c); c.clip(); c.fillStyle = '#fff'; c.fillRect(-15, my - 2, 30, 5 * k); c.fillStyle = '#ff7f97'; c.beginPath(); c.ellipse(1, my + 17 * k, 8 * k, 5 * k, 0, 0, 6.2832); c.fill(); c.restore();
    tShape(c, null, m, 3.2);
  } else if (expr === 'gasp') {
    tEllipse(c, 0, -142, 8, 10, '#5a1430', 3.2);
    c.save(); c.beginPath(); c.ellipse(0, -142, 8, 10, 0, 0, 6.2832); c.clip(); c.fillStyle = '#ff7f97'; c.beginPath(); c.ellipse(0, -134, 6, 4.5, 0, 0, 6.2832); c.fill(); c.restore();
    tEllipse(c, 0, -142, 8, 10, null, 3.2);
  } else if (expr === 'worried') {
    c.beginPath(); c.moveTo(-9, -145); c.bezierCurveTo(-5, -150, -2, -141, 2, -145); c.bezierCurveTo(5, -149, 8, -144, 9, -146); c.lineWidth = 3.2; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.stroke();
  } else if (expr === 'sad') tCurve(c, -8, -141, 0, -148, 8, -141, 3.4);
  // front hair: blunt bangs in clumps, side locks curling in, star clip
  tShape(c, P.hair, g => { g.moveTo(50, -168); g.quadraticCurveTo(58, -238, 0, -240); g.quadraticCurveTo(-58, -238, -50, -168); clumps(g, [[-50, -168], [-45, -178], [-40, -198], [-32, -186], [-24, -202], [-14, -188], [-6, -204], [4, -188], [12, -204], [22, -188], [30, -202], [38, -186], [44, -198], [50, -168]]); g.closePath(); });
  for (const sx of [-1, 1]) tShape(c, P.hair, g => { g.moveTo(sx * 48, -186); g.quadraticCurveTo(sx * 60, -158, sx * 50, -138); g.quadraticCurveTo(sx * 44, -132, sx * 38, -138); g.quadraticCurveTo(sx * 46, -146, sx * 44, -158); g.quadraticCurveTo(sx * 42, -172, sx * 42, -184); g.closePath(); });
  tCurve(c, -30, -228, -10, -236, 10, -234, 3.2, P.hairL);
  drawStar(c, 34, -216, 11, P.clip, 3.2);
  // brows over the bangs (thin)
  for (const sx of [-1, 1]) {
    const ex = sx * 18, bi = ex - sx * 8, bo = ex + sx * 8, by = -200;
    if (expr === 'worried' || expr === 'sad') tLine(c, [bi, by - 4, bo, by + 1], 2.8);
    else if (expr === 'gasp') tCurve(c, bi, by - 2, ex, by - 8, bo, by - 2, 2.8);
    else tCurve(c, bi, by, ex, by - 5, bo, by, 2.8);
  }
  if (expr === 'worried' || expr === 'sheepish' || o.sweat) tShape(c, '#9fe6ff', g => { g.moveTo(54, -210); g.quadraticCurveTo(62, -196, 58, -190); g.quadraticCurveTo(52, -186, 49, -194); g.quadraticCurveTo(48, -200, 54, -210); g.closePath(); }, 2.6);
  if (o.arms !== false) {
    if (o.hold) tTube(c, [-52, -88, -60, -60, -40, -86, -30, -100, -16, -104], 20, P.shirt);
    else if (!o.reach) { tTube(c, [-52, -88, -68, -50, -66, -16, -44, -10, -22, -12], 21, P.shirt); tHand(c, -18, -13, 8.5, P.skin, P.skinS); }   // reach: the episode draws this arm toward the camera
    if (o.hold) { tTube(c, [52, -88, 60, -60, 40, -86, 30, -100, 16, -104], 20, P.shirt, P.shirtS); tHand(c, 14, -104, 8.5, P.skin, P.skinS); tHand(c, -14, -104, 8.5, P.skin, P.skinS); }
    else if (o.wave !== false) { const wv = o.wavePhase != null ? Math.sin(o.wavePhase) * 7 : 0; tTube(c, [50, -92, 78, -98, 84, -126, 88 + wv * .5, -146, 90 + wv, -164], 20, P.shirt, P.shirtS); tHand(c, 91 + wv * 1.2, -176, 10, P.skin, P.skinS, true); }
    else { tTube(c, [52, -88, 68, -50, 66, -16, 44, -10, 22, -12], 21, P.shirt, P.shirtS); tHand(c, 18, -13, 8.5, P.skin, P.skinS); }
  }
  c.restore();
}
