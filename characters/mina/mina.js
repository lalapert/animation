// Mina (27), the lead of "Open When You Get There": a watercolour character, drawn with engine.js strokes and washes.
// Needs engine.js + common.js (paperClip). Every part sits on unpainted paper first, so colours survive any background.
//   drawMina(c, x, y, h, { view, expr, armL, armR, hold, walk, t })
//     x, y: feet centre on the ground; h: height in px (head ≈ h/6)
//     view: 'front' | 'tq' (three-quarter, facing screen-left) | 'side' (profile, facing left) | 'back'
//     expr: 'calm' | 'smile' | 'sad' | 'surprised' | 'cry' | 'laugh'
//     hold: 'letter' (both hands at the chest holding the envelope) | null;  walk: phase in radians (null = standing)
'use strict';
const MINA = {
  skin: '#efc6a6', skinD: '#d9a27e', hair: '#231f24', hairHi: '#4b4552',
  cardigan: '#c98a2e', cardiganD: '#a66d1f', tee: '#f6f1e6', pants: '#2f3a55', pantsD: '#222b42',
  shoe: '#f2efe6', sole: '#c9a26a', pack: '#6f7a46', packD: '#566034', seal: '#c8442a', envelope: '#efe6d2', blush: '#ee9c8a',
};
function _blob(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
function _fill(c, col, a, pathFn) { c.fillStyle = rgba(col, a); pathFn(); c.fill(); }
function _paint(c, col, pathFn, a = .62, edge = true) {
  // a watercolour shape: paper underneath, two glazes, a pooled darker edge
  paperClip(c, pathFn, .94);
  _fill(c, col, a * .55, pathFn); _fill(c, col, a * .55, pathFn);
  if (edge) { c.strokeStyle = rgba(shade(col, .72), .55); c.lineWidth = 2; pathFn(); c.stroke(); }
}
function _shadow(c, col, pathFn, clipFn, a = .35) { c.save(); clipFn(); c.clip(); _fill(c, shade(col, .78), a, pathFn); c.restore(); }

// a watercolour wash over a point list, on paper, with pooled jittered edges (deterministic per shape)
function _wash(c, col, pts, a = .62, jit = 3) {
  const seed = Math.floor(pts.reduce((s, p) => s + p[0] * 3.1 + p[1] * 1.7, 0)) % 9973;
  paperClip(c, () => _blob(c, pts), .94);
  withSeed(seed, () => drawWash(c, mkWash(pts, col, a, jit, 3, 10), 1));
}
function _curve(pts, n = 6) {
  // smooth a closed polygon (Chaikin) so silhouettes read as cloth, not boxes
  let P = pts;
  for (let k = 0; k < 2; k++) { const Q = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; Q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } P = Q; }
  void n; return P;
}

function drawMina(c, x, y, h, o = {}) {
  const view = o.view || 'front', expr = o.expr || 'calm', u = h / 600, t = o.t || 0;
  const dir = view === 'tq' || view === 'side' ? -1 : 1;
  const turn = view === 'front' ? 0 : view === 'tq' ? .45 : view === 'side' ? 1 : 0;
  const back = view === 'back';
  const X = dx => x + dx * u, Y = dy => y - dy * u, XY = ([dx, dy]) => [X(dx), Y(dy)];
  const walk = o.walk, sw = walk == null ? 0 : Math.sin(walk);
  const squash = 1 - turn * .28;                           // the body narrows as she turns
  c.save();
  // --- wide-leg trousers and shoes
  for (const k of [-1, 1]) {
    const lx = 28 * k * (1 - turn * .75), st = sw * 46 * k * (turn > .5 ? 1 : .35);
    _wash(c, k === 1 ? MINA.pantsD : MINA.pants, _curve([[lx - 30, 300], [lx + 30, 300], [lx + 38 + st, 30], [lx - 34 + st, 30]].map(XY)), .7, 2.5);
    const sx = X(lx + st + 8 * dir * turn);
    _wash(c, MINA.shoe, _curve([[sx - 34 * u, Y(30)], [sx + 36 * u, Y(26)], [sx + 38 * u, Y(4)], [sx - 34 * u, Y(4)]]), .3, 1.5);
    c.strokeStyle = rgba(MINA.sole, .8); c.lineWidth = 3 * u; c.beginPath(); c.moveTo(sx - 34 * u, Y(5)); c.lineTo(sx + 38 * u, Y(5)); c.stroke();
  }
  // --- backpack behind her when she turns
  const px = back ? 0 : 40 * -dir * turn;
  const pack = _curve([[px - 62, 534], [px + 62, 534], [px + 70, 336], [px - 70, 336]].map(XY));
  if (!back && turn > 0) _wash(c, MINA.pack, pack, .7);
  // --- oversized cardigan: rounded shoulders, A-line, a hem that dips at the centre
  const sh = 74 * squash, hem = 106 * squash;
  const body = _curve([[-sh * .5, 556], [sh * .5, 556], [sh, 540], [sh + 12, 470], [hem, 300], [hem * .5, 286], [0, 280], [-hem * .5, 286], [-hem, 300], [-sh - 12, 470], [-sh, 540]].map(XY));
  _wash(c, MINA.cardigan, body, .74);
  c.save(); _blob(c, body); c.clip(); c.fillStyle = rgba(MINA.cardiganD, .28); c.beginPath(); c.ellipse(X(hem * .7), Y(400), 70 * u, 160 * u, 0, 0, 6.283); c.fill(); c.restore();
  withSeed(310, () => { for (let k = 0; k < 4; k++) drawS(c, mk(qcurve(X(-40 + k * 26), Y(470 - k * 12), X(-30 + k * 28), Y(320 - k * 6), 6 * u, 8), 3 * u, MINA.cardiganD, { prof: 'tip', nb: 0, a: .35 })); });   // folds
  if (!back) {
    const off = -dir * turn * 26;
    _wash(c, MINA.tee, _curve([[off - 26, 548], [off + 26, 548], [off + 24, 296], [off - 24, 296]].map(XY)), .25, 1.5);
    c.strokeStyle = rgba(MINA.cardiganD, .72); c.lineWidth = 7 * u; c.lineCap = 'round';
    c.beginPath(); c.moveTo(X(off - 30), Y(550)); c.quadraticCurveTo(X(off - 34), Y(420), X(off - 34), Y(290)); c.moveTo(X(off + 30), Y(550)); c.quadraticCurveTo(X(off + 34), Y(420), X(off + 34), Y(290)); c.stroke();
    for (const k of turn > .6 ? [1] : [-1, 1]) { c.strokeStyle = rgba(MINA.packD, .8); c.lineWidth = 11 * u; c.beginPath(); c.moveTo(X(k * 50 - dir * turn * 22), Y(552)); c.quadraticCurveTo(X(k * 58 - dir * turn * 22), Y(470), X(k * 60 - dir * turn * 22), Y(390)); c.stroke(); }
  } else {
    _wash(c, MINA.pack, pack, .72);
    c.save(); _blob(c, pack); c.clip(); c.fillStyle = rgba(MINA.packD, .35); c.fillRect(X(10), Y(540), 80 * u, 220 * u); c.restore();
    _wash(c, MINA.packD, _curve([[-38, 500], [38, 500], [40, 430], [-40, 430]].map(XY)), .45, 1.5);
  }
  // --- sleeves: narrow, bent at the elbow; hands at the hips or holding the letter at the chest
  const arm = k => {
    const sx = X(k * (sh + 4)), sy = Y(536);
    let ex, ey, mx, my;
    if (o.hold === 'letter') { ex = X(k * 24 - dir * turn * 30); ey = Y(420); mx = X(k * (sh + 16)); my = Y(440); }
    else { const a = walk == null ? 0 : -sw * k * .45; mx = X(k * (sh + 18)) + Math.sin(a) * 20 * u; my = Y(430); ex = mx + Math.sin(a) * 36 * u - k * 6 * u; ey = Y(320); }
    withSeed(300 + k, () => drawS(c, mk([[sx, sy], [mx, my], [ex, ey]], 34 * u, MINA.cardigan, { prof: 'even', nb: 4, a: .82, rough: .1 })));
    _wash(c, MINA.skin, Array.from({ length: 10 }, (_, i) => [ex + Math.cos(i / 10 * 6.283) * 13 * u, ey + 8 * u + Math.sin(i / 10 * 6.283) * 12 * u]), .7, 1);
  };
  if (turn > .6) arm(1); else { arm(-1); arm(1); }
  if (o.hold === 'letter' && !back) {
    const ex = X(-dir * turn * 30), ey = Y(430);
    _wash(c, MINA.envelope, [[ex - 70 * u, ey - 30 * u], [ex + 70 * u, ey - 40 * u], [ex + 74 * u, ey + 50 * u], [ex - 66 * u, ey + 58 * u]], .35, 1.5);
    c.strokeStyle = rgba('#8c7d66', .6); c.lineWidth = 2 * u; c.beginPath(); c.moveTo(ex - 70 * u, ey - 30 * u); c.lineTo(ex + 2 * u, ey + 16 * u); c.lineTo(ex + 70 * u, ey - 40 * u); c.stroke();
    _wash(c, MINA.seal, Array.from({ length: 12 }, (_, i) => [ex + 2 * u + Math.cos(i / 12 * 6.283) * 12 * u, ey + 16 * u + Math.sin(i / 12 * 6.283) * 12 * u]), .9, .8);
  }
  // --- neck and head
  const hx = X(-dir * turn * 10), hy = Y(628), hr = 60 * u;
  _wash(c, MINA.skin, [[hx - 16 * u, hy + 46 * u], [hx + 16 * u, hy + 46 * u], [hx + 15 * u, hy + 78 * u], [hx - 15 * u, hy + 78 * u]], .6, 1);
  drawMinaHead(c, hx, hy, hr, view, expr, t);
  c.restore();
}

function drawMinaHead(c, hx, hy, r, view = 'front', expr = 'calm', t = 0) {
  const turn = view === 'front' ? 0 : view === 'tq' ? .45 : view === 'side' ? 1 : 0, back = view === 'back';
  const u = r / 62, fx = -turn * 18 * u;                       // features shift toward the side she faces
  // back hair: a bob to the jaw
  const hairBack = () => _blob(c, [[hx - r * 1.08, hy], ...Array.from({ length: 13 }, (_, i) => { const a = Math.PI + i / 12 * Math.PI; return [hx + Math.cos(a) * r * 1.1, hy + Math.sin(a) * r * 1.12]; }), [hx + r * 1.08, hy], [hx + r * 1.02, hy + r * .86], [hx + r * .6, hy + r * .98], [hx - r * .6, hy + r * .98], [hx - r * 1.02, hy + r * .86]]);
  _paint(c, MINA.hair, hairBack, .82);
  if (back) {
    c.strokeStyle = rgba(MINA.hairHi, .7); c.lineWidth = 4 * u; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(hx + k * 14 * u, hy - r * .9); c.quadraticCurveTo(hx + k * 20 * u, hy, hx + k * 18 * u, hy + r * .9); c.stroke(); }
    return;
  }
  // face
  const face = () => { c.beginPath(); c.ellipse(hx + fx, hy + 6 * u, r * (.86 - turn * .12), r * .96, 0, 0, 6.283); };
  _paint(c, MINA.skin, face, .55);
  _shadow(c, MINA.skin, () => { c.beginPath(); c.ellipse(hx + fx + r * .5, hy + 14 * u, r * .6, r, 0, 0, 6.283); }, face, .3);
  if (turn > .8) {   // profile: a small nose and chin line on the left
    _paint(c, MINA.skin, () => _blob(c, [[hx + fx - r * .7, hy - 4 * u], [hx + fx - r * .92, hy + 14 * u], [hx + fx - r * .72, hy + 22 * u], [hx + fx - r * .7, hy + 40 * u], [hx + fx - r * .4, hy + r * .9], [hx + fx, hy + r * .5]]), .5, false);
  }
  // blush
  _fill(c, MINA.blush, .4, () => { c.beginPath(); c.ellipse(hx + fx - r * .42, hy + r * .32, r * .17, r * .1, 0, 0, 6.283); if (turn < .8) c.ellipse(hx + fx + r * .42 - turn * 14 * u, hy + r * .32, r * .15 * (1 - turn * .4), r * .09, 0, 0, 6.283); });
  // eyes, brows, nose, mouth by expression
  const ink = (a = .85) => { c.strokeStyle = rgba('#2a2226', a); c.fillStyle = rgba('#2a2226', a); c.lineCap = 'round'; };
  const eyes = turn > .8 ? [-.42] : [-.38, .34 - turn * .3];
  const ew = r * .13;
  ink();
  eyes.forEach((ex, i) => {
    const px = hx + fx + ex * r * (i && turn ? 1 - turn * .5 : 1), py = hy + r * .06;
    c.lineWidth = 3.4 * u;
    if (expr === 'laugh') { c.beginPath(); c.arc(px, py + 4 * u, ew, Math.PI + .3, -.3); c.stroke(); }
    else if (expr === 'calm') { c.beginPath(); c.arc(px, py - 4 * u, ew, .3, Math.PI - .3); c.stroke(); c.beginPath(); c.moveTo(px - ew, py - 2 * u); c.lineTo(px - ew - 5 * u, py - 6 * u); c.stroke(); }
    else {
      const big = expr === 'surprised' ? 1.35 : 1;
      c.beginPath(); c.ellipse(px, py, ew * .55 * big, ew * .8 * big, 0, 0, 6.283); c.fill();
      c.save(); c.globalCompositeOperation = 'source-over'; c.fillStyle = rgba('#fff8ee', .9); c.beginPath(); c.arc(px - ew * .2, py - ew * .3, ew * .2, 0, 6.283); c.fill(); c.restore();
      c.beginPath(); c.moveTo(px - ew * 1.1, py - ew * .9); c.quadraticCurveTo(px, py - ew * 1.3 * big, px + ew * 1.1, py - ew * .9); c.stroke();
    }
    // brows
    c.lineWidth = 3 * u; c.beginPath();
    const by = py - r * .3 - (expr === 'surprised' ? 6 * u : 0), inner = (i === 0 ? 1 : -1) * (turn > .8 ? 1 : 1);
    const lift = expr === 'sad' || expr === 'cry' ? 6 * u : 0;
    c.moveTo(px - ew * 1.1, by + (inner > 0 ? 0 : -lift)); c.quadraticCurveTo(px, by - 4 * u, px + ew * 1.1, by + (inner > 0 ? -lift : 0)); c.stroke();
  });
  // nose
  c.lineWidth = 2.6 * u; c.beginPath(); c.moveTo(hx + fx - turn * 30 * u, hy + r * .3); c.quadraticCurveTo(hx + fx - 4 * u - turn * 34 * u, hy + r * .4, hx + fx - turn * 26 * u, hy + r * .42); c.stroke();
  // mouth
  const mx = hx + fx - turn * 22 * u, my = hy + r * .62;
  c.lineWidth = 3 * u; c.beginPath();
  if (expr === 'smile' || expr === 'calm') c.arc(mx, my - 8 * u, 12 * u, .4, Math.PI - .4);
  else if (expr === 'laugh') { c.fillStyle = rgba('#b85a5a', .75); c.moveTo(mx - 16 * u, my - 4 * u); c.quadraticCurveTo(mx, my + 18 * u, mx + 16 * u, my - 4 * u); c.closePath(); c.fill(); c.stroke(); }
  else if (expr === 'surprised') { c.ellipse(mx, my, 7 * u, 9 * u, 0, 0, 6.283); }
  else c.arc(mx, my + 10 * u, 11 * u, Math.PI + .5, -.5);
  c.stroke();
  if (expr === 'cry') { _fill(c, '#9fc3dc', .7, () => { c.beginPath(); c.ellipse(hx + fx - r * .36, hy + r * .32 + (t * 40 % 30) * u, 5 * u, 8 * u, 0, 0, 6.283); }); }
  // fringe and side locks
  const fringe = () => _blob(c, [[hx - r * 1.02, hy - r * .1], ...Array.from({ length: 11 }, (_, i) => { const a = Math.PI + i / 10 * Math.PI; return [hx + Math.cos(a) * r * 1.04, hy - r * .06 + Math.sin(a) * r * 1.02]; }), [hx + r * 1.02, hy - r * .1], [hx + r * .5 + fx, hy - r * .5], [hx + fx, hy - r * .42], [hx - r * .5 + fx, hy - r * .48]]);
  _paint(c, MINA.hair, fringe, .85);
  if (turn < .8) _paint(c, MINA.hair, () => _blob(c, [[hx - r * 1.04, hy - r * .1], [hx - r * .84, hy - r * .1], [hx - r * .8, hy + r * .9], [hx - r * 1.0, hy + r * .9]]), .85, false);
  _paint(c, MINA.hair, () => _blob(c, [[hx + r * 1.04, hy - r * .1], [hx + r * (.84 - turn * .2), hy - r * .1], [hx + r * (.8 - turn * .2), hy + r * .9], [hx + r * 1.0, hy + r * .9]]), .85, false);
  c.strokeStyle = rgba(MINA.hairHi, .8); c.lineWidth = 5 * u; c.beginPath(); c.arc(hx + fx * .5, hy - r * .4, r * .6, Math.PI * 1.2, Math.PI * 1.6); c.stroke();
}
