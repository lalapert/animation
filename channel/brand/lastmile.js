// Last Mile (Void Mart delivery) cast, drawn in the Void Mart anime-flat look (toon.js must be loaded first).
// Same unit system as drawRae2 / drawPip2: (x, y) is the point under the character's centre at the bottom of a waist-up
// frame (the counter line), s = face height in px (face height = 100 units).
'use strict';

const LASTMILE = {
  max: {
    skin: '#f8d8c6', skinS: '#e4ae97',
    hair: '#f5d062', hairS: '#d6a53c', hairL: '#fff3b0',
    jacket: TOON.orange, jacketS: TOON.orangeS,
    yoke: '#2c1f56', yokeS: '#1e1540',
    cap: '#2c1f56', capS: '#1e1540',
    glove: '#2a2238', gloveS: '#1b1626',
    strip: '#e7ebf4',
    iris: '#6fa8d6', irisD: '#1d3657',
    tie: TOON.orange,
  },
  box: { kraft: '#d6a66b', kraftS: '#b6854c', kraftL: '#e8c28c' },
};

// tapered shape along a cubic spine P = [x0,y0, x1,y1, x2,y2, x3,y3]; wf(t) = full width at t (0 = root, 1 = tip)
function lmTaper(c, P, wf, fill, lw, n = 30) {
  const pt = t => { const u = 1 - t; return [u*u*u*P[0] + 3*u*u*t*P[2] + 3*u*t*t*P[4] + t*t*t*P[6], u*u*u*P[1] + 3*u*u*t*P[3] + 3*u*t*t*P[5] + t*t*t*P[7]]; };
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = pt(Math.max(0, t - .01)), b = pt(Math.min(1, t + .01)), p = pt(t);
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = wf(t) / 2; L.push([p[0] - dy * w, p[1] + dx * w]); R.push([p[0] + dy * w, p[1] - dx * w]);
  }
  tShape(c, fill, g => { g.moveTo(L[0][0], L[0][1]); for (const q of L.slice(1)) g.lineTo(q[0], q[1]); for (const q of R.reverse()) g.lineTo(q[0], q[1]); g.closePath(); }, lw);
  return pt;
}
const lmRot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// fingerless glove: fingers peek out over the knuckles
function lmHand(c, x, y, r, M, flip = 1) {
  // a fist seen from the front: the glove is the back of the hand, the curled fingers show as a row of bare tips along the bottom
  tHand(c, x, y, r, M.glove, M.gloveS);
  for (let k = 0; k < 4; k++) tShape(c, M.skin, g => g.roundRect(x + flip * r * .08 + (k - 2) * r * .46, y + r * .12, r * .44, r * .62, r * .2), 1.8);
}
function lmGrip(c, x, y, r, M, dir) {
  tEllipse(c, x, y, r * .8, r * 1.15, M.glove, TOON.LW, 0);
  tShade(c, tEllipsePath(x, y, r * .8, r * 1.15), M.gloveS, g => g.ellipse(x - dir * r * .4, y + r * .4, r * .6, r * .9, 0, 0, 6.2832));
  for (let k = 0; k < 4; k++) tShape(c, M.skin, g => g.roundRect(x + dir * r * .45, y - r * 1 + k * r * .52, r * .95, r * .46, r * .22), 1.8);
}
// tiny Void black hole badge (the O of the logo)
function lmBadge(c, x, y, r) {
  tShape(c, TOON.orange, g => g.arc(x, y, r, 0, 6.2832), Math.max(1.6, r * .22));
  c.fillStyle = '#ffd08a'; c.beginPath(); c.arc(x, y, r * .78, 0, 6.2832); c.fill();
  c.fillStyle = '#07030f'; c.beginPath(); c.arc(x, y, r * .5, 0, 6.2832); c.fill();
  c.save(); c.translate(x, y); c.rotate(-.32); c.beginPath(); c.ellipse(0, 0, r * 1.45, r * .32, 0, 0, Math.PI);
  c.lineWidth = r * .3; c.strokeStyle = '#ff4fa3'; c.stroke(); c.restore();
}
// a Void Mart parcel (kraft, orange tape, shipping label), centred on (x, y), w x h
function lmParcel(c, x, y, w, h, o = {}) {
  const B = LASTMILE.box, box = g => g.roundRect(x - w / 2, y - h / 2, w, h, 4);
  tShape(c, B.kraft, box);
  tShade(c, box, B.kraftS, g => g.rect(x + w * .28, y - h / 2 - 2, w, h + 4));
  tShade(c, box, B.kraftL, g => g.rect(x - w / 2, y - h / 2, w, h * .1));
  tShape(c, TOON.orange, g => g.rect(x - w * .09, y - h / 2, w * .18, h), 2.6);
  lmBadge(c, x, y - h * .16, w * .06);
  if (o.label !== false) {
    const lx = x - w * .42, ly = y + h * .02, lw = w * .26, lh = h * .3;
    tShape(c, TOON.white, g => g.rect(lx, ly, lw, lh), 2.4);
    c.fillStyle = TOON.ink; for (let i = 0; i < 9; i++) c.fillRect(lx + lw * (.1 + i * .09), ly + lh * .45, i % 3 ? 1.2 : 2.2, lh * .4);
    c.fillRect(lx + lw * .1, ly + lh * .16, lw * .6, 2);
  }
  if (o.fragile) { tText(c, 'FRAGILE', x + w * .27, y + h * .32, h * .12, '#c0262f', '"Fredoka"'); }
}
// the wrist timer (a slim band with a screen); value is a string, late = red
function lmWrist(c, x, y, rot, value, late, k = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  tShape(c, '#2a2238', g => g.roundRect(-9, -11, 18, 22, 4), 2.6);
  tShape(c, late ? '#3a0710' : '#0d1a2a', g => g.roundRect(-13, -7, 26, 14, 3), 2.4);
  tText(c, value, 0, .5, 8.5, late ? '#ff3b4a' : '#7ef0ff', '"Bungee"');
  c.restore();
}

// handheld scanner (as the store's), centred on (x, y)
function lmScanner(c, x, y, k = 1) {
  c.save(); c.translate(x, y); c.scale(k, k);
  tShape(c, '#9aa0b8', g => g.roundRect(-17, -7, 34, 14, 5), 3.4);
  tShape(c, '#ff3355', g => g.roundRect(9, -4, 7, 8, 2), 2.2);
  tShape(c, '#7a8098', g => { g.moveTo(-11, 5); g.lineTo(-1, 5); g.lineTo(-4, 17); g.lineTo(-12, 17); g.closePath(); }, 3.2);
  c.restore();
}

function drawMax(c, x, y, s, o = {}) {
  const M = LASTMILE.max, expr = o.expr || 'cold', hat = o.hat || 'cap', turn = o.turn || 0;
  const tilt = o.tilt ?? (expr === 'listen' ? .07 : 0);
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  if (o.lean) c.rotate(o.lean);
  const head = fn => { c.save(); c.translate(0, -160); c.rotate(tilt); c.translate(0, 160); fn(); c.restore(); };

  // ---- ponytail (behind everything) ----
  const pony = o.pony ?? (turn > .2 ? -.75 : turn < -.2 ? .75 : .5), bend = o.ponyBend || 0;
  head(() => {
    const side = pony >= 0 ? 1 : -1;
    let pt;
    if (hat === 'cap' && Math.abs(pony) > 1.1) {
      // streaming behind her at speed (a loose S)
      const b0 = [side * 16, -274], wav = Math.sin((o.wave || 0)) * 16;
      const P = [[0, 0], [side * 40, -34 + wav], [side * 80, 34 - wav], [side * 124, 2 + wav * .5]].flatMap(([px, py]) => [b0[0] + px, b0[1] + py]);
      pt = lmTaper(c, P, t => t < .35 ? 26 + t / .35 * 16 : 42 * (1 - (t - .35) / .65) + 1, M.hair);
      const q = pt(.62);                                  // split ends
      lmTaper(c, [q[0], q[1] - 4, q[0] + side * 14, q[1] - 12, q[0] + side * 30, q[1] - 22 + wav * .4, q[0] + side * 44, q[1] - 20], t => 12 * (1 - t) + 1, M.hair, 3.2);
      lmTaper(c, [q[0], q[1] + 6, q[0] + side * 12, q[1] + 14, q[0] + side * 26, q[1] + 22 - wav * .4, q[0] + side * 36, q[1] + 26], t => 11 * (1 - t) + 1, M.hair, 3.2);
    } else if (hat === 'cap') {
      // out through the back of the cap, hanging behind the head, swinging to a side
      const sw = (pony - side * .5) * -side, b0 = [side * 20, -266];
      const sp = [[0, 0], [side * 22, 6], [side * (38 + bend * 20), 50], [side * (30 + bend * 40), 120]].map(([px, py]) => lmRot(px, py, sw * side));
      pt = lmTaper(c, sp.flatMap(([px, py]) => [b0[0] + px, b0[1] + py]), t => t < .45 ? 20 + t / .45 * 20 : 40 * (1 - (t - .45) / .55) + 1, M.hair);
    } else {
      // high ponytail from the crown, arching over and down a side
      const sw = (pony - side * .5) * -side, b0 = [side * 2, -298];
      const sp = [[0, 0], [side * 20, -22], [side * 56, -18], [side * (64 + bend * 30), 76]].map(([px, py]) => lmRot(px, py, sw * side * .6));
      pt = lmTaper(c, sp.flatMap(([px, py]) => [b0[0] + px, b0[1] + py]), t => t < .18 ? 12 + t / .18 * 6 : t < .55 ? 18 + (t - .18) / .37 * 16 : 34 * (1 - (t - .55) / .45) + 1, M.hair);
    }
    for (const k of [.32, .56]) { const a = pt(k), b = pt(Math.min(1, k + .3)); tCurve(c, a[0], a[1], (a[0] + b[0]) / 2 + side * 4, (a[1] + b[1]) / 2 + 2, b[0], b[1], 2.2, M.hairS); }
    { const a = pt(.14), b = pt(.42); tCurve(c, a[0] + side * 3, a[1] - 2, (a[0] + b[0]) / 2 + side * 6, (a[1] + b[1]) / 2 - 3, b[0] + side * 3, b[1], 2.6, M.hairL); }
    // back of the head (hair pulled back tight)
    tShape(c, M.hairS, g => { g.moveTo(-41, -204); g.quadraticCurveTo(-50, -252, -38, -278); g.quadraticCurveTo(-20, -300, 0, -300); g.quadraticCurveTo(20, -300, 38, -278); g.quadraticCurveTo(50, -252, 41, -204); g.lineTo(34, -216); g.lineTo(-34, -216); g.closePath(); });
  });

  const pose = o.pose || (o.arms === false ? 'none' : 'box');
  if (pose === 'run' && !o.armsDown) { tTube(c, [-56, -124, -78, -110, -86, -88, -86, -72, -72, -58], 22, M.jacketS); lmHand(c, -70, -56, 9.5, M, -1); }
  // ---- body: courier jacket ----
  const torso = g => { g.moveTo(-58, 2); g.lineTo(-62, -104); g.bezierCurveTo(-62, -136, -44, -148, -16, -156); g.lineTo(16, -156); g.bezierCurveTo(44, -148, 62, -136, 62, -104); g.lineTo(58, 2); g.closePath(); };
  tShape(c, M.jacket, torso);
  tShade(c, torso, M.jacketS, g => g.rect(32, -170, 50, 180));
  tShade(c, torso, M.yoke, g => { g.moveTo(-90, -200); g.lineTo(90, -200); g.lineTo(90, -120); g.quadraticCurveTo(0, -108, -90, -120); g.closePath(); });
  tShade(c, torso, M.yokeS, g => { g.moveTo(34, -200); g.lineTo(90, -200); g.lineTo(90, -120); g.quadraticCurveTo(60, -116, 34, -114); g.closePath(); });
  c.save(); c.beginPath(); torso(c); c.clip(); tCurve(c, -90, -120, 0, -108, 90, -120, 3); c.restore();
  // reflective strip
  tShade(c, torso, M.strip, g => g.rect(-80, -52, 160, 10));
  c.save(); c.beginPath(); torso(c); c.clip(); tLine(c, [-80, -52, 80, -52], 2.4); tLine(c, [-80, -42, 80, -42], 2.4); c.restore();
  tShape(c, null, torso);
  // zip, chest badge, name tag
  tLine(c, [0, -150, 0, 2], 2.6);
  tShape(c, '#c9cfdd', g => g.roundRect(-3.5, -132, 7, 12, 2), 2);
  lmBadge(c, 34, -94, 9);
  nameTag(c, -34, -94, 28, 12, 'MAX');
  // neck + stand-up collar
  const neck = g => g.rect(-10, -186, 20, 34);
  tShape(c, M.skin, neck); tShade(c, neck, M.skinS, g => g.rect(-10, -186, 20, 12));
  tShape(c, M.yoke, g => { g.moveTo(-22, -150); g.lineTo(-19, -177); g.quadraticCurveTo(-11, -170, -4, -163); g.lineTo(-4, -147); g.quadraticCurveTo(-13, -146, -22, -150); g.closePath(); }, 3.2);
  tShape(c, M.yoke, g => { g.moveTo(22, -150); g.lineTo(19, -177); g.quadraticCurveTo(11, -170, 4, -163); g.lineTo(4, -147); g.quadraticCurveTo(13, -146, 22, -150); g.closePath(); }, 3.2);

  // ---- head ----
  head(() => {
    tEllipse(c, -38, -222, 6.5, 10.5, M.skin); tEllipse(c, 38, -222, 6.5, 10.5, M.skin);
    const face = g => { g.moveTo(0, -272); g.bezierCurveTo(27, -272, 38, -256, 38, -233); g.bezierCurveTo(38, -212, 25, -190, 0, -176); g.bezierCurveTo(-25, -190, -38, -212, -38, -233); g.bezierCurveTo(-38, -256, -27, -272, 0, -272); g.closePath(); };
    tShape(c, M.skin, face);
    tShade(c, face, M.skinS, g => { g.moveTo(24, -278); g.bezierCurveTo(35, -240, 29, -200, 4, -171); g.lineTo(60, -171); g.lineTo(60, -278); g.closePath(); });
    if (expr === 'smile' || o.blush) { c.fillStyle = 'rgba(255,120,140,.28)'; c.beginPath(); c.ellipse(-24, -204, 9, 4.5, 0, 0, 6.2832); c.ellipse(24, -204, 9, 4.5, 0, 0, 6.2832); c.fill(); }
    c.save(); c.translate(turn * 12, 0); c.scale(1 - Math.abs(turn) * .1, 1);
    const E = { cold: [.2, 0], glance: [.38, 3.5], listen: [.04, 0], smile: [.18, 0], late: [0, 0], annoyed: [.46, -1.5] }[expr] || [.2, 0];
    for (const sx of [-1, 1]) {
      const ex = sx * 16, ey = -222;
      if (o.blink) closedEye(c, ex, ey - 2, 11);
      else animeEye(c, ex, ey, sx, { iris: M.iris, irisD: M.irisD, skin: M.skin, w: 13, h: expr === 'late' ? 13 : expr === 'listen' ? 11 : 9.8, lid: E[0], look: o.look ?? (E[1] + turn * 3), tilt: .9 });
      if (expr === 'late' && !o.blink) { c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey - 4, 5.6, 0, 6.2832); c.fill(); c.fillStyle = TOON.ink; c.beginPath(); c.arc(ex, ey - 4, 2.4, 0, 6.2832); c.fill(); }
    }
    tLine(c, [2, -207, 0, -200], 2.6);
    if (o.mouth && o.mouth.a > .06) talkMouth(c, 0, -190, o.mouth.a, o.mouth.shape, .85);
    else if (expr === 'smile') { tCurve(c, -9, -191, 0, -185, 9, -191, 3); }
    else if (expr === 'listen') { tLine(c, [-6, -189, 6, -189], 2.8); tCurve(c, -3, -184, 0, -183.4, 3, -184, 1.6, M.skinS); }
    else if (expr === 'late') tEllipse(c, 0, -187, 3.6, 5, '#4a1028', 2.6);
    else if (expr === 'annoyed') tCurve(c, -8, -187, 2, -190, 8, -188, 3);
    else { tLine(c, [-7, -189, 7, -189], 3); tCurve(c, -3, -184, 0, -183.4, 3, -184, 1.6, M.skinS); }
    c.restore();

    // earpiece (her left ear = viewer's right)
    tShape(c, '#2a2238', g => g.roundRect(33, -233, 12, 19, 5), 2.6);
    c.fillStyle = TOON.orange; c.beginPath(); c.arc(39, -227, 2, 0, 6.2832); c.fill();
    tCurve(c, 38, -215, 37, -201, 26, -196, 2.4, '#2a2238');

    // front hair: swept bangs, one face-framing lock (viewer's left); the right side is tucked behind the ear
    const top = -262;
    if (hat !== 'cap') {
      tShape(c, M.hair, g => { g.moveTo(-44, -236); g.quadraticCurveTo(-50, -290, 0, -300); g.quadraticCurveTo(50, -290, 44, -236); g.lineTo(-44, -236); g.closePath(); });
      for (const [x0, y0, x1, y1] of [[-30, -262, -6, -294], [-14, -266, 0, -296], [16, -266, 6, -296], [32, -260, 10, -293]]) tCurve(c, x0, y0, (x0 + x1) / 2 + (x0 < 0 ? -4 : 4), (y0 + y1) / 2, x1, y1, 2.2, M.hairS);
      tCurve(c, -26, -280, -10, -292, 10, -291, 3, M.hairL);
      if (hat === 'none') tShape(c, M.tie, g => g.ellipse(4, -294, 8, 5, -.3, 0, 6.2832), 2.6);
    }
    tShape(c, M.hair, g => {
      g.moveTo(-45, top); g.lineTo(44, top); g.quadraticCurveTo(46, -242, 40, -234);
      g.quadraticCurveTo(35, -242, 27, -246); g.quadraticCurveTo(20, -238, 8, -233);
      g.quadraticCurveTo(2, -242, -8, -247); g.quadraticCurveTo(-20, -240, -35, -234);
      g.quadraticCurveTo(-41, -240, -45, top); g.closePath(); });
    tShape(c, M.hair, g => { g.moveTo(-36, -250); g.quadraticCurveTo(-47, -226, -44, -196); g.quadraticCurveTo(-40, -202, -38, -210); g.quadraticCurveTo(-38, -230, -32, -246); g.closePath(); });
    tCurve(c, -20, top + 4, -4, top + 2, 12, top + 4, 2.4, M.hairL);
    // brows over the bangs (as Pip): straight and set low at the inner end = the cold look
    c.save(); c.translate(turn * 12, 0); c.scale(1 - Math.abs(turn) * .1, 1);
    for (const sx of [-1, 1]) {
      const ex = sx * 16, bi = ex - sx * 10, bo = ex + sx * 13;
      if (expr === 'annoyed') tLine(c, [bi, -232, bo, -243], 3.6);
      else if (expr === 'late') tCurve(c, bi, -243, ex, -250, bo, -244, 3.2);
      else if (expr === 'listen') tCurve(c, bi, -241, ex, -244, bo, -240, 3.2);
      else if (expr === 'smile') tCurve(c, bi, -239, ex, -242, bo, -239, 3.2);
      else tLine(c, [bi, -235, bo, -240], 3.4);
    }
    c.restore();

    // headwear
    const bx = turn * 9;
    if (hat === 'cap') {
      const crown = g => { g.moveTo(-47, -258); g.bezierCurveTo(-50, -298, -24, -310, 0, -310); g.bezierCurveTo(24, -310, 50, -298, 47, -258); g.closePath(); };
      tShape(c, M.cap, crown);
      tShade(c, crown, M.capS, g => g.rect(24 + bx, -320, 40, 80));
      tCurve(c, bx, -309, bx + 3, -288, bx, -264, 2.2, M.capS); tCurve(c, -30 + bx, -300, -24 + bx, -282, -26 + bx, -264, 2, M.capS); tCurve(c, 30 + bx, -300, 24 + bx, -282, 26 + bx, -264, 2, M.capS);
      tEllipse(c, bx, -309, 4, 2.6, M.capS, 2.2);
      lmBadge(c, bx, -284, 10);
      tShape(c, M.cap, g => { g.moveTo(-52 + bx, -262); g.quadraticCurveTo(bx, -272, 52 + bx, -262); g.quadraticCurveTo(57 + bx, -254, 48 + bx, -250); g.quadraticCurveTo(bx, -241, -48 + bx, -250); g.quadraticCurveTo(-57 + bx, -254, -52 + bx, -262); g.closePath(); });
      tCurve(c, -44 + bx, -254, bx, -247, 44 + bx, -254, 2.2, M.capS);
    } else if (hat === 'visor') {
      tShape(c, M.cap, g => { g.moveTo(-46, -262); g.quadraticCurveTo(0, -276, 46, -262); g.lineTo(46, -252); g.quadraticCurveTo(0, -264, -46, -252); g.closePath(); });
      tShape(c, M.cap, g => { g.moveTo(-50 + bx, -256); g.quadraticCurveTo(bx, -266, 50 + bx, -256); g.quadraticCurveTo(55 + bx, -248, 46 + bx, -244); g.quadraticCurveTo(bx, -234, -46 + bx, -244); g.quadraticCurveTo(-55 + bx, -248, -50 + bx, -256); g.closePath(); });
      lmBadge(c, bx, -265, 6);
    }
  });

  // ---- arms ----
  if (o.armsDown) { hangingArms(c, o, 58, -124, o.handY || 112, 23, M.jacket, M.jacketS, M.glove, M.gloveS); c.restore(); return; }
  if (pose === 'box') {
    for (const sx of [-1, 1]) tTube(c, [sx * 58, -124, sx * 80, -96, sx * 76, -66, sx * 74, -56, sx * 62, -54], 23, M.jacket, sx > 0 ? M.jacketS : null);
    lmParcel(c, 0, -64, 112, 84, o.parcel || {});
    lmGrip(c, -58, -60, 10, M, 1); lmGrip(c, 58, -60, 10, M, -1);
    lmWrist(c, 66, -76, 1.2, o.timer || '0:47', o.late);
  } else if (pose === 'run') {
    tTube(c, [58, -124, 72, -102, 78, -80, 82, -94, 66, -110], 23, M.jacket, M.jacketS);
    lmHand(c, 63, -114, 10, M, -1);
  } else if (pose === 'watch') {
    tTube(c, [-58, -124, -78, -80, -72, -36, -66, -14, -60, 6], 23, M.jacket);
    tTube(c, [58, -124, 82, -88, 66, -66, 40, -76, 14, -92], 23, M.jacket, M.jacketS);
    lmWrist(c, 30, -86, -.45, o.timer || '0:47', o.late, 1.25);
    lmHand(c, 8, -96, 10.5, M, -1);
  }
  c.restore();
}
