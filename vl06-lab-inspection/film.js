// Volt Labs, episode 6: "Lab Inspection". A city inspector knocks; a big red button flips the lab wall into a bakery, one
// panel at a time. Whenever she looks away, a panel flips back, and Vera or Cleo dashes behind the bench to slam its button.
// Script: channel/scripts/VL06_lab_inspection.md. Movement (owner, 11/8): waist-up travel and dashes behind the bench (travel.js).
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 190, IX = TL.IX, IX_OFF = TL.IX_OFF, VX0 = TL.VX0, CX0 = TL.CX0, BTN = TL.BTN, CROI = TL.CROI;
const BIG = { x: 340 };                                           // the big red button on the bench
const INSPFACE = LCT - 222 * S / 100;
const VFACE = LCT - 222 * S / 100;

// ---------------------------------------------------------------- the wall: three panels that flip between the lab and a bakery
const PAN = [[0, 480], [480, 760], [760, 1080]], PY0 = 172;
const FLIPS = [[0, TL.SLAM + .1, 'B'], [1, TL.SLAM + .25, 'B'], [2, TL.SLAM + .4, 'B'], [2, TL.FLIPR, 'L'], [2, TL.SLAMR + .05, 'B'], [0, TL.FLIPL, 'L'], [0, TL.SLAML + .05, 'B']];
const FLIP_T = .42;
function panelState(i, t) {                     // {from, to, k}: k 0..1 while turning, or 1 when settled on `to`
  let face = 'L', from = 'L', k = 1;
  for (const [j, t0, to] of FLIPS) { if (j !== i || t < t0) continue; from = face; face = to; k = clamp((t - t0) / FLIP_T); }
  return { from, to: face, k };
}
const BAK = {};
function buildBakery() {
  const b = document.createElement('canvas'); b.width = W; b.height = LCT; const g = b.getContext('2d');
  g.fillStyle = '#f9d3dc'; g.fillRect(0, 0, W, LCT);
  for (let x = 0; x < W; x += 60) { g.fillStyle = '#fbe5ea'; g.fillRect(x, 0, 28, LCT); }
  tShape(g, '#fff1dd', gg => gg.rect(-10, PY0, W + 20, 26), 3);                                 // crown moulding
  tShape(g, '#fff1dd', gg => gg.rect(-10, 1010, W + 20, LCT - 1010), 3);                       // wainscot
  for (let x = 20; x < W; x += 130) tShape(g, '#f7e2c6', gg => gg.roundRect(x, 1040, 110, 200, 8), 2.4);
  // panel 1: shelves of loaves and baguettes, a framed sign
  tShape(g, '#fff8ee', gg => gg.roundRect(120, 330, 240, 110, 10), 3); tText(g, 'FRESH', 240, 368, 34, '#b4573a', '"Bungee"', 'center', 400); tText(g, 'DAILY', 240, 410, 34, '#b4573a', '"Bungee"', 'center', 400);
  for (const sy of [640, 880]) {
    tShape(g, '#a8693f', gg => gg.rect(30, sy, 420, 16), 3);
    for (let i = 0; i < 4; i++) { const lx = 80 + i * 100; tShape(g, '#d9944e', gg => gg.ellipse(lx, sy - 30, 42, 28, 0, 0, 6.2832), 3); for (let k = -1; k <= 1; k++) tCurve(g, lx + k * 16 - 8, sy - 44, lx + k * 16, sy - 38, lx + k * 16 + 8, sy - 30, 2.6, '#8a4e22'); }
  }
  for (let i = 0; i < 3; i++) { g.save(); g.translate(150 + i * 110, 990); g.rotate(-.08); tShape(g, '#e0a65a', gg => gg.roundRect(-70, -16, 140, 32, 16), 3); g.restore(); }
  // panel 2: the sign and a three-tier cake
  tShape(g, '#fff8ee', gg => gg.ellipse(620, 360, 128, 92, 0, 0, 6.2832), 4);
  tText(g, "VOLT'S", 620, 330, 44, '#e2457a', '"Bungee"', 'center', 400); tText(g, 'BAKERY', 620, 388, 44, '#8a4e22', '"Bungee"', 'center', 400);
  tShape(g, '#fbf7ff', gg => gg.rect(560, 900, 120, 16), 3); tLine(g, [620, 916, 620, 990], 6); tShape(g, '#fbf7ff', gg => gg.ellipse(620, 994, 46, 10, 0, 0, 6.2832), 3);
  for (const [w, y0, h] of [[110, 800, 100], [80, 715, 85], [52, 645, 70]]) { tShape(g, '#fff8f2', gg => gg.roundRect(620 - w, y0, w * 2, h, 10), 3.4); tShape(g, '#ff8fb1', gg => { gg.moveTo(620 - w, y0 + 6); for (let x = -w; x <= w; x += 20) gg.quadraticCurveTo(620 + x + 10, y0 + 30, 620 + x + 20, y0 + 6); gg.lineTo(620 + w, y0); gg.lineTo(620 - w, y0); gg.closePath(); }, 2.4); }
  tEllipse(g, 620, 640, 12, 12, '#e23b4a', 3);
  // panel 3: the menu board (it covers the basement window) and a shelf of croissants
  tShape(g, '#7a5532', gg => gg.roundRect(800, 260, 250, 300, 10), 4); tShape(g, '#2a3a30', gg => gg.rect(816, 276, 218, 268), 3);
  tText(g, 'TODAY', 925, 316, 34, '#fff6e8', null, 'center');
  tText(g, 'SOURDOUGH $4', 925, 392, 24, '#fff6e8', null, 'center'); tText(g, 'CROISSANT $3', 925, 444, 24, '#fff6e8', null, 'center'); tText(g, 'CAKE $$$', 925, 496, 24, '#ff9ab8', null, 'center');
  tShape(g, '#a8693f', gg => gg.rect(790, 820, 280, 16), 3);
  for (let i = 0; i < 4; i++) croissant(g, 830 + i * 64, 798, 1);
  // seams between the panels
  for (const [a] of PAN.slice(1)) tLine(g, [a, PY0, a, LCT], 3);
  BAK.wall = b;
}
function croissant(g, x, y, s, beep = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  tShape(g, '#e3a352', gg => { gg.moveTo(-30, 6); gg.quadraticCurveTo(-26, -20, 0, -22); gg.quadraticCurveTo(26, -20, 30, 6); gg.quadraticCurveTo(14, -4, 0, -2); gg.quadraticCurveTo(-14, -4, -30, 6); gg.closePath(); }, 2.6);
  for (const k of [-12, 0, 12]) tCurve(g, k - 4, -16, k, -8, k + 4, -2, 2, '#a8692a');
  if (beep > 0) { g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 20; tEllipse(g, 0, -12, 4.5, 4.5, beep > .5 ? '#ff3a3a' : '#7a1a20', 1.6); g.restore(); }
  g.restore();
}
// the lab's own face (drawn every frame: the window and the props move), plus two things only this episode needs
const LABF = document.createElement('canvas'); LABF.width = W; LABF.height = LCT; const LG = LABF.getContext('2d');
function drawLabFace(t) {
  LG.setTransform(1, 0, 0, 1, 0, 0);
  LG.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(LG, t, 0); drawRentCircles(LG, 6); drawFridge(LG, 0);
  drawRay(LG, t, {});
  // a Tesla coil and a hazard sign on panel 3
  tShape(LG, '#5f6a82', gg => gg.roundRect(840, 1110, 120, 180, 10), 3.4);
  for (let i = 0; i < 6; i++) tShape(LG, '#c27a3c', gg => gg.roundRect(862, 1100 - i * 40, 76, 30, 8), 2.6);
  tShape(LG, '#c9cfdb', gg => gg.ellipse(900, 830, 56, 26, 0, 0, 6.2832), 3.4);
  const R = (() => { let a = Math.floor(t * 12) + 3; return () => { a = a * 16807 % 2147483647; return a / 2147483647; }; })();
  LG.save(); LG.strokeStyle = '#d8ff7a'; LG.lineWidth = 3; LG.shadowColor = '#d8ff7a'; LG.shadowBlur = 12;
  for (let k = 0; k < 3; k++) { LG.beginPath(); let x = 900, y = 806; LG.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (R() - .5) * 60; y -= 18 + R() * 14; LG.lineTo(x, y); } LG.stroke(); }
  LG.restore();
  tShape(LG, '#ffd23f', gg => { gg.moveTo(990, 980); gg.lineTo(1050, 1080); gg.lineTo(930, 1080); gg.closePath(); }, 3); tText(LG, '!', 990, 1048, 46, TOON.ink, '"Bungee"', 'center', 400);
}
function drawWall(g, t) {
  drawLabFace(t);
  g.drawImage(LABF, 0, 0);
  PAN.forEach(([x0, x1], i) => {
    const st = panelState(i, t), w = x1 - x0, cx = (x0 + x1) / 2;
    if (st.k >= 1 && st.to === 'L') return;                                     // settled on the lab: already drawn
    const face = st.k >= 1 ? st.to : (st.k < .5 ? st.from : st.to), sx = st.k >= 1 ? 1 : Math.abs(Math.cos(Math.PI * st.k));
    if (st.k < 1) { g.fillStyle = '#120c18'; g.fillRect(x0, PY0, w, LCT - PY0); }   // the gap behind a turning panel
    const src = face === 'B' ? BAK.wall : LABF;
    g.save(); g.translate(cx, 0); g.scale(Math.max(.02, sx), 1);
    g.drawImage(src, x0, PY0, w, LCT - PY0, -w / 2, PY0, w, LCT - PY0);
    if (st.k < 1) { g.fillStyle = `rgba(0,0,0,${.45 * (1 - sx)})`; g.fillRect(-w / 2, PY0, w, LCT - PY0); }
    g.restore();
    if (st.k < 1) tLine(g, [cx - w * sx / 2, PY0, cx - w * sx / 2, LCT], 3), tLine(g, [cx + w * sx / 2, PY0, cx + w * sx / 2, LCT], 3);
  });
}

// ---------------------------------------------------------------- the city inspector (one-off): grey bun, red cat-eye glasses, navy blazer, clipboard
// (x, y) = bench top under her; o: expr stern | sus | sniff | pleased, mouth, blink, turn, armsDown, reachL {x,y}, stamp 0..1, write 0..1, croissant
function drawInspector(g, x, y, s, o = {}) {
  const skin = '#e8b894', skinS = '#cf9a76', hair = '#b9b5c6', hairS = '#8f8aa0', nav = '#2f3a66', navS = '#222b4f', red = '#d8344a';
  const expr = o.expr || 'stern';
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  // torso: blazer over a white shirt, lanyard and badge
  const torso = gg => { gg.moveTo(-56, 2); gg.lineTo(-60, -120); gg.bezierCurveTo(-60, -146, -40, -156, -18, -160); gg.lineTo(18, -160); gg.bezierCurveTo(40, -156, 60, -146, 60, -120); gg.lineTo(56, 2); gg.closePath(); };
  tShape(g, nav, torso); tShade(g, torso, navS, gg => gg.rect(26, -170, 40, 180));
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-18, -160); gg.lineTo(0, -112); gg.lineTo(18, -160); gg.closePath(); }, 2.4);
  tShape(g, null, gg => { gg.moveTo(-18, -160); gg.lineTo(-30, -96); gg.lineTo(-12, -70); }, 2.6); tShape(g, null, gg => { gg.moveTo(18, -160); gg.lineTo(30, -96); gg.lineTo(12, -70); }, 2.6);   // lapels
  g.strokeStyle = red; g.lineWidth = 4; g.beginPath(); g.moveTo(-14, -158); g.lineTo(-4, -88); g.moveTo(14, -158); g.lineTo(4, -88); g.stroke();
  tShape(g, '#fbf7ff', gg => gg.roundRect(-22, -90, 44, 30, 4), 2.4); tText(g, 'CITY', 0, -80, 9, red, '"Bungee"', 'center', 400); tText(g, 'INSPECTOR', 0, -68, 7, TOON.ink, '"Bungee"', 'center', 400);
  // neck and head
  tShape(g, skin, gg => gg.rect(-11, -180, 22, 26), 2.6);
  g.save(); g.translate((o.turn || 0) * 10, 0);
  const face = gg => gg.ellipse(0, -222, 44, 50, 0, 0, 6.2832);
  tShape(g, skin, face); tShade(g, face, skinS, gg => gg.ellipse(40, -214, 14, 50, 0, 0, 6.2832)); tShape(g, null, face);
  for (const sx of [-1, 1]) tEllipse(g, sx * 44, -214, 6, 9, '#fbf7ff', 1.8);                                    // pearl earrings
  // hair: a tight cap and a bun on top
  const cap = gg => { gg.moveTo(-46, -214); gg.bezierCurveTo(-50, -270, 50, -270, 46, -214); gg.quadraticCurveTo(30, -246, 0, -250); gg.quadraticCurveTo(-30, -246, -46, -214); gg.closePath(); };
  tShape(g, hair, cap, 3);
  tShade(g, cap, hairS, gg => gg.rect(24, -280, 40, 70));                          // shade only inside the hair (11/9: it spilled onto the glasses)
  tShape(g, null, cap, 3);
  tShape(g, hair, gg => gg.ellipse(0, -282, 22, 18, 0, 0, 6.2832), 3); tCurve(g, -14, -290, 0, -296, 14, -288, 2, hairS);
  // glasses (red cat-eye) and eyes
  const sniff = expr === 'sniff', pleased = expr === 'pleased', sus = expr === 'sus', lk = o.look || 0;
  for (const sx of [-1, 1]) {
    const ex = sx * 18, ey = -222;
    if (o.blink || sniff || pleased) tCurve(g, ex - 9, ey + (pleased ? 2 : 0), ex, ey + (pleased ? -6 : 4), ex + 9, ey + (pleased ? 2 : 0), 3.4);
    else { tEllipse(g, ex, ey, 9, sus && sx < 0 ? 4 : 7, '#fbf7ff', 2.4); g.fillStyle = TOON.ink; g.beginPath(); g.arc(ex + lk * 3, ey + 1, 3.6, 0, 6.2832); g.fill(); }
    tShape(g, null, gg => { gg.moveTo(ex - 15, ey + 8); gg.quadraticCurveTo(ex - 16, ey - 10, ex - 4, ey - 11); gg.lineTo(ex + 12, ey - 12); gg.quadraticCurveTo(ex + 19 * 1, ey - 16, ex + 18, ey - 4); gg.quadraticCurveTo(ex + 16, ey + 10, ex, ey + 10); gg.closePath(); }, 0);
    g.save(); g.strokeStyle = red; g.lineWidth = 4.2; g.beginPath(); g.moveTo(ex - 15, ey + 4); g.quadraticCurveTo(ex - 17, ey - 12, ex - 2, ey - 12); g.lineTo(ex + 13, ey - 13); g.lineTo(ex + 20 * sx * sx, ey - 18); g.quadraticCurveTo(ex + 17, ey + 10, ex, ey + 10); g.quadraticCurveTo(ex - 13, ey + 10, ex - 15, ey + 4); g.stroke(); g.restore();
    // brows
    if (pleased) tCurve(g, ex - 10, ey - 22, ex, ey - 26, ex + 10, ey - 22, 3);
    else if (sus && sx > 0) tLine(g, [ex - 10, ey - 28, ex + 10, ey - 24], 3.4);
    else tLine(g, [ex - sx * 10, ey - 20, ex + sx * 9, ey - 25], 3.4);
  }
  tLine(g, [-3, -222, 3, -222], 3, red);
  // nose and mouth
  tCurve(g, 2, -212, -4, -202, 3, -199, 2.4, skinS);
  const m = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0;
  if (m) talkMouth(g, 0, -188, m, o.mouth.shape, .8);
  else if (pleased) tCurve(g, -11, -191, 0, -183, 11, -191, 3);
  else if (sniff) tEllipse(g, 0, -188, 4, 3.5, '#7a2a30', 2);
  else tLine(g, [-10, -188, 10, -189], 3);
  g.restore();
  // arms
  if (o.armsDown) { hangingArms(g, o, 54, -140, 118, 19, nav, navS, skin, skinS); g.restore(); return; }
  const board = (bx, by, rot) => { g.save(); g.translate(bx, by); g.rotate(rot); tShape(g, '#b98a4e', gg => gg.roundRect(-30, -40, 60, 80, 6), 3); tShape(g, '#fbf7ff', gg => gg.rect(-24, -30, 48, 64), 2); for (let i = 0; i < 5; i++) tLine(g, [-18, -20 + i * 11, 16 - (i % 2) * 8, -20 + i * 11], 1.4); tShape(g, '#7a8098', gg => gg.roundRect(-10, -46, 20, 9, 3), 2.2);
    if (o.approved) { g.save(); g.rotate(-.2); g.strokeStyle = '#2f9e5a'; g.lineWidth = 3; g.strokeRect(-22, 4, 44, 18); tText(g, 'OK', 0, 13, 12, '#2f9e5a', '"Bungee"', 'center', 400); g.restore(); }
    g.restore(); };
  if (o.reachL) {                                   // left arm reaches (croissant); the clipboard is tucked under the right arm
    const r = o.reachL; tTube(g, [-54, -140, -76, -96, (r.x - 76) / 2, (r.y - 96) / 2 + 6, r.x, r.y], 19, nav);
    tHand(g, r.x, r.y, 9, skin, skinS);
    if (o.croissant) croissant(g, r.x, r.y - 8, .7, o.croissant);
    board(44, -90, .25); tTube(g, [54, -140, 72, -98, 52, -70], 19, nav, navS); tHand(g, 50, -70, 9, skin, skinS);
  } else {
    board(-12, -96, -.12);                          // the clipboard on her left forearm
    tTube(g, [-54, -140, -72, -94, -40, -70, -20, -74], 19, nav); tHand(g, -22, -78, 9, skin, skinS);
    const st = o.stamp || 0, wr = o.write || 0;
    if (st > 0) {                                   // a rubber stamp: up, then down on the board
      const up = st < .6 ? st / .6 : 1 - (st - .6) / .4, hx = 10, hy = -80 - 90 * up;
      tTube(g, [54, -140, 80, -106, (hx + 80) / 2 + 10, (hy - 106) / 2, hx, hy], 19, nav, navS);
      tShape(g, '#7a3a2a', gg => gg.roundRect(hx - 9, hy - 34, 18, 24, 5), 2.4); tShape(g, '#3a3a44', gg => gg.roundRect(hx - 15, hy - 10, 30, 10, 3), 2.4);
      tHand(g, hx, hy - 20, 9, skin, skinS);
    } else {
      const wx = 8 + Math.sin(wr * 40) * 8 * (wr > 0 ? 1 : 0);
      tTube(g, [54, -140, 74, -98, 40, -92, wx, -96], 19, nav, navS); tHand(g, wx, -96, 9, skin, skinS);
      tLine(g, [wx - 2, -100, wx - 12, -86], 3, '#2a2a3a');
    }
  }
  g.restore();
}

// ---------------------------------------------------------------- positions over time
function runTo(t, t0, x0, x1) { return travel(t, t0, x0, x1, 190, 2.8); }
function walkTo(t, t0, x0, x1) { return travel(t, t0, x0, x1, 150, 1.9); }
function veraAt(t) {
  if (t < TL.VDASH1) return { x: VX0, moving: false };
  if (t < TL.VDASH2) { const r = runTo(t, TL.VDASH1, VX0, CROI - 60); return Object.assign(r, { run: true }); }
  if (t < TL.VRET) { const r = runTo(t, TL.VDASH2, CROI - 60, BTN.L - 55); return Object.assign(r, { run: true }); }
  return walkTo(t, TL.VRET, BTN.L - 55, VX0);
}
function cleoAt(t) {
  if (t < TL.CDASH) return { x: CX0, moving: false };
  if (t < TL.CRET) { const r = runTo(t, TL.CDASH, CX0, BTN.R + 45); return Object.assign(r, { run: true }); }
  return walkTo(t, TL.CRET, BTN.R + 45, 700);
}
function inspAt(t) {
  if (t < TL.WALKIN) return null;
  if (t < TL.WALKOUT) return walkTo(t, TL.WALKIN, IX_OFF, IX);
  const r = walkTo(t, TL.WALKOUT, IX, IX_OFF); return r.x >= IX_OFF - 1 ? null : r;
}
// where the croissant is: in the basket, in her hand, in Vera's hand, gone
function croissantAt(t) {
  if (t < TL.PICK) return { where: 'basket' };
  if (t < TL.SNATCH) return { where: 'insp' };
  if (t < TL.GULP) return { where: 'vera' };
  return { where: 'gone' };
}

// ---------------------------------------------------------------- characters
function drawMover(g, t, who, pos, o, opts = {}) {
  const draw = who === 'V' ? drawVera2 : who === 'C' ? drawCleo2 : drawInspector;
  if (pos.moving) {
    const step = pos.run ? 190 : 150, bob = walkBob(pos.dist, step, pos.run ? 20 : 11);
    g.save(); g.translate(pos.x, LCT + 4 + bob.dy); g.rotate(bob.rot * (pos.run ? 1.6 : 1));
    if (pos.run) g.rotate(.06 * pos.dir);                                           // leaning into the dash
    const arms = { l: bob.swing * (pos.run ? 30 : 16) * pos.dir, r: -bob.swing * (pos.run ? 30 : 16) * pos.dir, bend: pos.run ? .7 : .05 };
    draw(g, 0, 0, S, Object.assign({ turn: .7 * pos.dir, armsDown: arms, remote: false }, o));
    g.restore();
  } else draw(g, pos.x, LCT, S, o);
}
function veraState(t) {
  const mouth = mouthFor('VERA', t), blink = blinkAt(0, t);
  let expr = 'scheme', reachR = null, tube = false;
  if (t >= TL.SLAM - .05) expr = 'laugh';
  if (t >= V.L4.t - .1) expr = 'fluster';
  if (t >= V.L6.t - .05 && t < endOf('L6') + .3) expr = 'cool';
  if (t >= TL.VDASH1) expr = 'fluster';
  if (t >= V.L7.t && t < V.L9.t) expr = 'laugh';
  if (t >= V.L9.t) expr = 'fluster';
  // the big red button: hand on it, up, slam
  if (t < TL.SLAM + .4) {
    const up = smooth(TL.SLAM - .35, TL.SLAM - .12, t) * (1 - smooth(TL.SLAM - .1, TL.SLAM, t));
    reachR = { x: (BIG.x - VX0) / S * 100, y: -8 - 110 * up };
  }
  // snatching the croissant, then into the mouth
  if (t >= TL.SNATCH - .15 && t < TL.GULP + .3) {
    const I = inspHand(t), vx = CROI - 60;
    const k = smooth(TL.SNATCH + .05, TL.GULP, t);
    reachR = { x: lerp((I[0] - vx) / S * 100, 12, k), y: lerp((I[1] - LCT) / S * 100, -190, k) };
  }
  // slamming the left button
  if (t >= TL.SLAML - .3 && t < TL.SLAML + .5) {
    const up = smooth(TL.SLAML - .3, TL.SLAML - .1, t) * (1 - smooth(TL.SLAML - .08, TL.SLAML, t));
    reachR = { x: (BTN.L - (BTN.L - 55)) / S * 100, y: -8 - 100 * up };
  }
  return { expr, mouth, blink, reachR, tube };
}
function inspHand(t) {                       // where the inspector's left hand is while she holds the croissant (world)
  const I = inspAt(t) || { x: IX };
  const r = inspReach(t); return [I.x + r.x * S / 100, LCT + r.y * S / 100];
}
function inspReach(t) {
  const down = smooth(TL.PICK - .25, TL.PICK, t), up = smooth(TL.PICK + .05, TL.PICK + .4, t);
  const bx = (CROI - IX) / S * 100, by = -14;
  return { x: lerp(-40, bx, down) * (1 - up) + -70 * up, y: lerp(-80, by, down) * (1 - up) + -150 * up };
}
function inspState(t) {
  const mouth = mouthFor('INSPECTOR', t), blink = blinkAt(4, t);
  let expr = 'stern', turn = -.5, look = -1.5;
  if (t >= V.L3.t + 1) expr = 'sus';
  if (t >= TL.FLIPR - .4 && t < TL.SLAMR + .2) { turn = -.9; look = -2.5; }            // she looks at Vera's side while the right panel flips
  if (t >= V.L5.t) { expr = 'sniff'; turn = .2; look = 1; }
  if (t >= V.L5.t + 1.2) expr = 'sus';
  if (t >= TL.FLIPL - .3 && t < TL.SLAML + .3) { turn = .9; look = 2.5; expr = 'sus'; }   // she looks at Cleo's side while the left panel flips
  if (t >= V.L7.t) { expr = 'pleased'; turn = -.4; look = -1; }
  const o = { expr, mouth, blink, turn, look };
  if (t >= TL.PICK - .3 && t < TL.SNATCH) { o.reachL = inspReach(t); o.croissant = t >= TL.BEEPS ? (Math.floor((t - TL.BEEPS) * 6) % 2 ? .2 : 1) : .01; }
  if (t >= TL.SNATCH && t < TL.FLIPL - .3) o.write = t;
  if (t >= TL.STAMP - .45 && t < TL.STAMP + .35) o.stamp = clamp((t - TL.STAMP + .45) / .55);
  if (t >= TL.STAMP) o.approved = true;
  return o;
}
function cleoState(t) {
  return { expr: t >= TL.FLIPR && t < TL.SLAMR + .3 ? 'deadpan' : t >= V.L10.t ? 'deadpan' : 'deadpan', mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look: -1, remote: false,
    reachL: t >= TL.SLAMR - .3 && t < TL.SLAMR + .5 ? { x: (BTN.R - (BTN.R + 45)) / S * 100, y: -8 - 100 * smooth(TL.SLAMR - .3, TL.SLAMR - .1, t) * (1 - smooth(TL.SLAMR - .08, TL.SLAMR, t)) } : null };
}

// ---------------------------------------------------------------- bench props
function drawBench(g, t) {
  // the big red button
  const pressed = t >= TL.SLAM && t < TL.SLAM + .25 ? 1 : 0;
  tShape(g, '#3a3350', gg => gg.roundRect(BIG.x - 34, LCT - 26, 68, 26, 6), 3);
  g.save(); g.shadowColor = '#ff3355'; g.shadowBlur = 16; tShape(g, '#ff3355', gg => gg.ellipse(BIG.x, LCT - 30 + 6 * pressed, 26, 14 - 4 * pressed, 0, 0, 6.2832), 3); g.restore();
  // three small panel buttons
  for (const k of ['L', 'C', 'R']) {
    const x = BTN[k], hit = (k === 'R' && t >= TL.SLAMR && t < TL.SLAMR + .2) || (k === 'L' && t >= TL.SLAML && t < TL.SLAML + .2);
    tShape(g, '#3a3350', gg => gg.roundRect(x - 18, LCT - 14, 36, 14, 4), 2.4); tShape(g, '#ffd23f', gg => gg.ellipse(x, LCT - 16 + (hit ? 3 : 0), 11, 6, 0, 0, 6.2832), 2.4);
  }
  // baskets spring up after the flip
  const up = smooth(TL.SLAM + .5, TL.SLAM + .8, t); if (up <= 0) return;
  const pop = 1 + .15 * Math.sin(clamp((t - TL.SLAM - .5) / .5) * Math.PI);
  for (const [bx, kind] of [[430, 'loaf'], [CROI, 'croi']]) {
    g.save(); g.translate(bx, LCT); g.scale(pop, up * pop);
    tShape(g, '#c98a4a', gg => { gg.moveTo(-60, -40); gg.lineTo(60, -40); gg.lineTo(48, 0); gg.lineTo(-48, 0); gg.closePath(); }, 3);
    for (let i = -2; i <= 2; i++) tLine(g, [i * 22, -38, i * 18, -2], 1.6, '#8a5a2a');
    if (kind === 'loaf') { tShape(g, '#d9944e', gg => gg.ellipse(-16, -48, 30, 18, -.2, 0, 6.2832), 2.6); tShape(g, '#e0a65a', gg => gg.ellipse(18, -50, 30, 16, .2, 0, 6.2832), 2.6); }
    else { const cw = croissantAt(t).where; croissant(g, -26, -42, .8); croissant(g, 24, -42, .8); if (cw === 'basket') croissant(g, 0, -56, .8); }
    g.restore();
  }
}
// the end: beeps from Vera's stomach, a hiccup, a puff and a smoke ring (no soot on her face: it would read as a stain)
function hiccup(g, t) {
  if (t < TL.HIC) return;
  const k = clamp((t - TL.HIC) / 2.2), mx = VX0 + 2, my = LCT - 186 * S / 100;
  // a burst of black smoke at her mouth, then a lumpy smoke ring drifting up and to the right, fading
  const b = clamp((t - TL.HIC) / .5);
  if (b < 1) for (let i = 0; i < 7; i++) {
    const a = i / 7 * 6.2832, r = 22 + 46 * b;
    g.save(); g.globalAlpha = .8 * (1 - b); g.fillStyle = '#3a3640';
    g.beginPath(); g.arc(mx + 30 + Math.cos(a) * r * .5 + 90 * b, my + 6 + Math.sin(a) * r * .3 - 20 * b, 8 + 10 * b, 0, 6.2832); g.fill(); g.restore();
  }
  const kk = clamp((t - TL.HIC - .2) / 2.0); if (kk > 0) {
    const rx = 26 + 36 * kk, ry = 10 + 9 * kk, cx = mx + 130 + 40 * kk, cy = my - 10 - 300 * kk;   // beside her head, never across her face
    g.save(); g.globalAlpha = .75 * (1 - kk);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832; g.fillStyle = i % 2 ? '#3a3640' : '#4a4652'; g.beginPath(); g.arc(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 9 + 4 * Math.sin(i * 1.7) + 4 * kk, 0, 6.2832); g.fill(); }
    g.restore();
  }
}

// ---------------------------------------------------------------- cameras
const CAM = {
  WIDE_OPEN: [540, 990, 1.0, 1.04], WIDE: [540, 990, 1.0, 1.03],
  VERA_MED: [VX0 + 40, VFACE + 150, 1.6, 1.66], VERA_CU: [VX0 + 10, VFACE + 80, 2.3, 2.45], VERA_END: [VX0 + 10, VFACE + 20, 2.1, 1.9],
  INSP_CU: [IX - 10, INSPFACE + 80, 2.3, 2.45], INSP_MED: [IX - 30, INSPFACE + 150, 1.6, 1.66],
  CLEO_CU: [700, LCT - 200 * S / 100 + 80, 2.3, 2.45],
};

function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  const shake = (t > TL.SLAM && t < TL.SLAM + .3 ? Math.sin(t * 90) * 10 * (1 - (t - TL.SLAM) / .3) : 0) + (t > TL.HIC && t < TL.HIC + .2 ? Math.sin(t * 120) * 6 : 0);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, shake);
  drawWall(c, t);
  // Cleo, Vera, the inspector (the inspector in front when they cross)
  drawMover(c, t, 'C', cleoAt(t), cleoState(t));
  const vs = veraState(t); drawMover(c, t, 'V', veraAt(t), vs);
  const vp = veraAt(t);
  if (croissantAt(t).where === 'vera' && vs.reachR) croissant(c, vp.x + vs.reachR.x * S / 100, LCT + vs.reachR.y * S / 100 - 8, 1.2, Math.floor((t - TL.BEEPS) * 6) % 2 ? .2 : 1);
  const ip = inspAt(t); if (ip) drawMover(c, t, 'I', ip, inspState(t));
  c.drawImage(LAB_STATIC.front, 0, LCT);
  drawBench(c, t);
  hiccup(c, t);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vl'); }
window.render = render;

// ---------------------------------------------------------------- sound cues
const steps = (t0, x0, x1, step, sps) => footfalls(t0, x0, x1, step, sps).map(x => ({ type: 'step', t: +x.toFixed(3) }));
const runs = (t0, x0, x1) => footfalls(t0, x0, x1, 190, 2.8).map(x => ({ type: 'run', t: +x.toFixed(3) }));
window.EV = [
  { type: 'bed', fx: 'lab_hum', t: 0, t1: DUR + .5, g: -31 },
  { type: 'knock', t: .05 },
  { type: 'slam', t: TL.SLAM },
  ...FLIPS.map(([, t0]) => ({ type: 'panel', t: t0 })),
  { type: 'pop', t: TL.SLAM + .5 },
  ...steps(TL.WALKIN, IX_OFF, IX, 150, 1.9),
  ...runs(TL.CDASH, CX0, BTN.R + 45),
  { type: 'click', t: TL.SLAMR },
  ...[0, 1, 2, 3, 4].map(i => ({ type: 'beep', t: TL.BEEPS + i * .34 })),
  ...runs(TL.VDASH1, VX0, CROI - 60),
  { type: 'gulp', t: TL.GULP - .1 },
  ...runs(TL.VDASH2, CROI - 60, BTN.L - 55),
  { type: 'click', t: TL.SLAML },
  ...steps(TL.VRET, BTN.L - 55, VX0, 150, 1.9),
  { type: 'stamp', t: TL.STAMP },
  ...steps(TL.WALKOUT, IX, IX_OFF, 150, 1.9),
  ...steps(TL.CRET, BTN.R + 45, 700, 150, 1.9),
  { type: 'beep', t: TL.BEEP2 }, { type: 'beep', t: TL.BEEP2 + .45 }, { type: 'beep', t: TL.BEEP2 + .7 },
  { type: 'hic', t: TL.HIC - .05 },
  { type: 'puff', t: TL.HIC },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildLab(); buildBakery();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
