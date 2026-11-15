// Void Mart, episode 9: "Secret Shopper". MAGS announces a secret shopper tonight; Pip gives two tiny customers on the counter
// a red carpet, paper crowns and the last two milks; Dennis comes in for the usual, the milk is out, and he holds up a judge's
// paddle: SECRET SHOPPER, one star, MILK: SOLD OUT. MAGS keeps Employee of the Month. Script: channel/scripts/VM09_secret_shopper.md
// Set: the counter (vmkit.js). The counter hides the clerks below the waist; the tiny customers stand on the counter top (whole
// bodies: a legless jelly and a one-wheeled robot); Dennis is a slug. Deterministic: render(t) draws frame t; window.EV lists the sound cues.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const qb = (a, b, c2, k) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * b + k * k * c2;

// ---------------------------------------------------------------- layout (world coordinates)
const DEN = { x: 540, y: CT + 80, s: 130 };                  // Dennis, at the counter, facing the clerks (and us)
const SPOT = 585;                                            // where the tiny customers are served on the counter
const CRATE = { x: 452 };                                    // the MILK crate on the counter, by Pip
const PIPX1 = 382;                                           // Pip steps over to serve
const CARPET = { x0: 432, x1: 1000 };                        // the red carpet along the counter top
const BLOBEND = 905, BOTEND = 985;                           // where the two royal customers end up, drinking, at the far end

// ---------------------------------------------------------------- props
function drawCarton(g, x, y, s, label) {                     // a milk carton, (x, y) = bottom centre
  g.save(); g.translate(x, y); g.scale(s, s);
  tShape(g, '#fbf7ff', gg => gg.rect(-28, -62, 56, 62));
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-28, -62); gg.lineTo(0, -84); gg.lineTo(28, -62); gg.closePath(); }, 3);
  tShape(g, TOON.white, gg => gg.rect(-6, -92, 12, 10), 2.4);
  tShape(g, '#3a8fe0', gg => gg.rect(-28, -46, 56, 20), 2.6);
  tText(g, label || 'MILK', 0, -36, 12, '#fbf7ff');
  g.restore();
}
function drawCrate(g, t) {                                   // a wire crate; the cartons in it until they are given away
  const x = CRATE.x;
  tShape(g, '#c1c6d8', gg => gg.roundRect(x - 52, CT - 46, 104, 46, 6), 3.4);
  for (let i = 1; i < 4; i++) tLine(g, [x - 52 + i * 26, CT - 44, x - 52 + i * 26, CT - 2], 2);
  tShape(g, '#fbf7ff', gg => gg.rect(x - 30, CT - 34, 60, 18), 2.2); tText(g, 'MILK', x, CT - 25, 13, TOON.ink, '"Bungee"', 'center', 400);
}
function cartonsInCrate(g, t) {
  if (t < TL.MILK1 - .35) drawCarton(g, CRATE.x - 22, CT - 26, .9);
  if (t < TL.MILK2 - .35) drawCarton(g, CRATE.x + 22, CT - 26, .9);
}
function drawCarpet(g, t) {                                  // rolled out along the counter top; the roll travels to its end
  const k = smooth(TL.CARPET, TL.CARPET + .6, t); if (k <= 0) return;
  const x1 = lerp(CARPET.x0, CARPET.x1, k);
  tShape(g, '#c42f4a', gg => gg.rect(CARPET.x0, CT - 9, x1 - CARPET.x0, 11), 2.6);
  tLine(g, [CARPET.x0 + 4, CT - 4, x1 - 4, CT - 4], 1.6);
  g.strokeStyle = '#ffd23f'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(CARPET.x0 + 3, CT - 7); g.lineTo(x1 - 3, CT - 7); g.stroke();
  if (k < 1) { tEllipse(g, x1, CT - 18 * (1 - k) - 6, 18 * (1 - k) + 7, 18 * (1 - k) + 7, '#c42f4a', 3); tEllipse(g, x1, CT - 18 * (1 - k) - 6, 5, 5, '#8a1e33', 1.6); }
}
function drawCrown(g, x, y, s, rot = 0) {                    // a paper crown, (x, y) = bottom centre
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  tShape(g, '#ffd23f', gg => { gg.moveTo(-26, 0); gg.lineTo(-26, -20); gg.lineTo(-15, -10); gg.lineTo(-6, -26); gg.lineTo(0, -12); gg.lineTo(6, -26); gg.lineTo(15, -10); gg.lineTo(26, -20); gg.lineTo(26, 0); gg.closePath(); }, 2.6);
  tEllipse(g, 0, -7, 3.5, 3.5, '#ff5f7e', 1.6);
  g.restore();
}
// the tiny jelly customer: sky blue, a monocle; (x, y) = bottom centre on the counter
function drawBlob(g, t, x, y, o = {}) {
  const hop = o.hop || 0, sq = o.sq || 1;
  g.save(); g.translate(x, y); g.scale(1.3, 1.3); g.translate(-x, -y);
  g.save(); g.translate(x, y - hop); g.scale(1 / Math.sqrt(sq), sq);
  const body = gg => { gg.moveTo(-40, 0); gg.bezierCurveTo(-46, -40, -30, -74, 0, -74); gg.bezierCurveTo(30, -74, 46, -40, 40, 0); gg.closePath(); };
  tShape(g, '#7ec8ff', body); tShade(g, body, '#5aa2e0', gg => gg.rect(18, -80, 40, 82)); tShape(g, null, body, 3.4);
  tCurve(g, -26, -44, -26, -58, -14, -66, 3.4, 'rgba(255,255,255,.8)');
  // eyes and the monocle, a small smile; nub arms (part of the jelly) hug whatever it carries
  tEllipse(g, -12, -42, 5, 6, TOON.ink, 0); tEllipse(g, 12, -42, 5, 6, TOON.ink, 0);
  tEllipse(g, 12, -42, 10, 10, null, 2.6); tCurve(g, 21, -38, 26, -26, 22, -12, 1.6, '#ffd23f');
  tCurve(g, -8, -28, 0, -23, 8, -28, 2.6);
  if (o.carry) {
    tTube(g, [-38, -30, -46, -18, -34, -8], 12, '#7ec8ff'); tTube(g, [38, -30, 46, -18, 34, -8], 12, '#7ec8ff', '#5aa2e0');
  }
  g.restore();
  if (o.crown) drawCrown(g, x, y - hop - 72 * sq, .8, -.08);
  if (o.carry) drawCarton(g, x, y - hop - 4, .95);
  g.restore();
}
// the tiny robot: a box on one wheel, a screen face, two little claw arms; (x, y) = bottom centre on the counter
function drawBot(g, t, x, y, o = {}) {
  const wob = o.roll ? Math.sin(t * 28) * 1.5 : 0;
  g.save(); g.translate(x, y); g.scale(1.3, 1.3); g.translate(-x, -y);
  g.save(); g.translate(x, y);
  tEllipse(g, 0, -12, 12, 12, '#3a3546', 3); tEllipse(g, 0, -12, 4, 4, '#c1c6d8', 0);
  tShape(g, '#9aa0b8', gg => gg.rect(-4, -34, 8, 12), 2.4);
  g.save(); g.translate(0, wob);
  const box = gg => gg.roundRect(-30, -88, 60, 56, 8);
  tShape(g, '#c1c6d8', box); tShade(g, box, '#9aa0b8', gg => gg.rect(14, -92, 20, 64)); tShape(g, null, box, 3.4);
  tShape(g, '#20183a', gg => gg.roundRect(-22, -80, 44, 28, 5), 2.4);
  if (o.happy) { tCurve(g, -14, -64, -9, -71, -4, -64, 2.6, '#7ef0ff'); tCurve(g, 4, -64, 9, -71, 14, -64, 2.6, '#7ef0ff'); }
  else { tShape(g, '#7ef0ff', gg => gg.rect(-13, -70, 6, 6), 0); tShape(g, '#7ef0ff', gg => gg.rect(7, -70, 6, 6), 0); }
  tLine(g, [0, -88, 0, -104], 2.4); tEllipse(g, 0, -106, 4, 4, '#ff5f7e', 2);
  // claw arms: hanging, or both forward holding the carton
  const fwd = o.carry ? 1 : 0;
  for (const sd of [-1, 1]) {
    const hx = sd * lerp(38, 20, fwd), hy = lerp(-44, -50, fwd);
    tTube(g, [sd * 30, -64, sd * 40, -56, hx, hy], 7, '#9aa0b8');
    tLine(g, [hx, hy, hx + sd * 5, hy + 7], 2.4); tLine(g, [hx, hy, hx - sd * 3, hy + 8], 2.4);
  }
  g.restore();
  g.restore();
  if (o.crown) drawCrown(g, x - 6, y + wob - 88, .75, .1);
  if (o.carry) drawCarton(g, x, y + wob - 36, .8);
  g.restore();
}
// MAGS's announcement: a hologram under him, SECRET SHOPPER TONIGHT and five stars lighting one by one
function announce(g, t) {
  const k = 1 - smooth(endOf('L1') + .2, endOf('L1') + .45, t); if (k <= 0) return;     // on screen from the first frame (the hook)
  g.save(); g.translate(MAGS.x + 10, MAGS.y + 480); g.scale(1.05, 1.05); g.globalAlpha = k;
  g.save(); g.globalAlpha = .22 * k; g.fillStyle = '#ff2a3a'; g.beginPath(); g.moveTo(-6, -360); g.lineTo(-290, -120); g.lineTo(290, -120); g.closePath(); g.fill(); g.restore();   // the beam from his eye
  tShape(g, 'rgba(60,14,40,.78)', gg => gg.roundRect(-300, -120, 600, 240, 22), 4);
  g.strokeStyle = '#ff7d8c'; g.lineWidth = 3; g.strokeRect(-284, -104, 568, 208);
  tText(g, 'SECRET SHOPPER', 0, -52, 58, '#ffffff', '"Bungee"', 'center', 400);
  tText(g, 'TONIGHT', 0, 4, 46, '#ffd0d4', '"Bungee"', 'center', 400);
  for (let i = 0; i < 5; i++) { const on = ((t * 2.2 - i * .45) % 3.2 + 3.2) % 3.2 < .9; drawStar(g, -132 + i * 66, 66, 22, on ? '#ffd23f' : 'rgba(255,208,212,.35)', 2.4); }
  g.restore();
}
// the judge's paddle: SECRET SHOPPER, one star of five, MILK: SOLD OUT; (x, y) = centre of the board
function drawPaddle(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  tShape(g, '#fffdf4', gg => gg.roundRect(-118, -86, 236, 172, 16), 4);
  tShape(g, '#2b2244', gg => gg.roundRect(-118, -86, 236, 40, [16, 16, 0, 0]), 0);
  tText(g, 'SECRET SHOPPER', 0, -66, 22, '#fbf7ff', '"Bungee"', 'center', 400);
  for (let i = 0; i < 5; i++) drawStar(g, -84 + i * 42, -6, 18, i === 0 ? '#ffd23f' : '#e4def0', 2.4);
  tText(g, 'MILK:', 0, 38, 24, '#e23b4a', '"Bungee"', 'center', 400);
  tText(g, 'SOLD OUT', 0, 66, 26, '#e23b4a', '"Bungee"', 'center', 400);
  tShape(g, null, gg => gg.roundRect(-118, -86, 236, 172, 16), 4);
  g.restore();
}

// ---------------------------------------------------------------- Dennis (as in VM5): stalks, moustache, cap; o.squint, o.paddle 0..1
function drawDennis9(g, t, x, y, s, o = {}) {
  const D = { body: '#8fd65a', bodyS: '#62ad38', belly: '#c6f29c', spot: '#6db33f', stache: '#7a4e2c', stacheS: '#5a3720', cap: '#e23b4a', capS: '#b52634', panel: '#fbf7ff' };
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.fillStyle = 'rgba(170,240,120,.6)'; g.beginPath(); g.ellipse(0, 4, 130, 12, 0, 0, 6.2832); g.fill();
  const topY = -268, look = o.look ?? 0, eyes = [];
  for (const side of [-1, 1]) {
    const dr = (side < 0 ? o.droopL : o.droopR) || 0, a = side * dr * 2.25;
    const rot = (px, py) => [side * 34 + Math.cos(a) * px - Math.sin(a) * py, topY + Math.sin(a) * px + Math.cos(a) * py];
    const p1 = rot(side * 6, -32), p2 = rot(side * 18, -66), pe = rot(side * 20, -76);
    tTube(g, [side * 34, topY, p1[0], p1[1], p2[0], p2[1]], 15, D.body, side > 0 ? D.bodyS : null);
    eyes.push([pe[0], pe[1], side, dr]);
  }
  const body = gg => { gg.moveTo(-118, 2); gg.bezierCurveTo(-122, -90, -100, -190, -70, -246); gg.bezierCurveTo(-50, -284, 50, -284, 70, -246); gg.bezierCurveTo(100, -190, 122, -90, 118, 2); gg.closePath(); };
  tShape(g, D.body, body);
  tShade(g, body, D.bodyS, gg => { gg.moveTo(60, -270); gg.bezierCurveTo(100, -190, 112, -90, 100, 10); gg.lineTo(140, 10); gg.lineTo(140, -270); gg.closePath(); });
  tShade(g, body, D.belly, gg => gg.ellipse(-4, -70, 70, 110, 0, 0, 6.2832));
  for (const [px, py, r] of [[-82, -150, 9], [-92, -110, 6], [76, -176, 7], [88, -128, 10], [-60, -222, 6], [54, -236, 5]]) { g.fillStyle = D.spot; g.beginPath(); g.ellipse(px, py, r * 1.2, r, .3, 0, 6.2832); g.fill(); }
  tCurve(g, -96, -120, -92, -170, -68, -214, 4, 'rgba(255,255,255,.75)');
  tShape(g, null, body);
  const crown = gg => { gg.moveTo(-46, -252); gg.bezierCurveTo(-46, -300, 46, -300, 46, -252); gg.closePath(); };
  tShape(g, D.cap, crown); tShade(g, crown, D.capS, gg => gg.rect(20, -300, 40, 60));
  tShape(g, D.panel, gg => { gg.moveTo(-24, -253); gg.bezierCurveTo(-24, -290, 24, -290, 24, -253); gg.closePath(); }, 3);
  tEllipse(g, 0, -269, 11, 11, TOON.orange, 3); tText(g, 'D', 0, -268, 15, TOON.white);
  tShape(g, D.capS, gg => { gg.moveTo(-54, -252); gg.quadraticCurveTo(0, -236, 54, -252); gg.quadraticCurveTo(0, -246, -54, -252); gg.closePath(); }, 3.6);
  const ma = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0, sad = o.sad || 0;
  if (ma) tEllipse(g, 0, -176, 10 + ma * 6, 4 + ma * 12, '#3a1a20', 3.2);
  else if (sad > .5 || o.squint) tCurve(g, -16, -172, 0, -180, 16, -172, 3.8);
  else tCurve(g, -16, -180, 0, -170, 16, -180, 3.8);
  const st = gg => { gg.moveTo(0, -206); gg.bezierCurveTo(-14, -220, -40, -214, -52, -196); gg.bezierCurveTo(-40, -200, -28, -196, -18, -190); gg.bezierCurveTo(-10, -186, -4, -190, 0, -194); gg.bezierCurveTo(4, -190, 10, -186, 18, -190); gg.bezierCurveTo(28, -196, 40, -200, 52, -196); gg.bezierCurveTo(40, -214, 14, -220, 0, -206); gg.closePath(); };
  tShape(g, D.stache, st); tShade(g, st, D.stacheS, gg => gg.rect(-60, -200, 120, 14));
  // stubby arms at his sides
  tTube(g, [-104, -60, -112, -30, -104, -12], 24, D.body);
  tTube(g, [104, -60, 112, -30, 104, -12], 24, D.body, D.bodyS);
  g.restore();
  for (const [ex, ey, side, dr] of eyes) {
    const k = s / 100, X = x + ex * k, Y = y + ey * k;
    g.save(); g.translate(X, Y); g.scale(k, k);
    tEllipse(g, 0, 0, 17, 18, TOON.white, 3.6);
    const pdy = 6 + dr * 5;
    g.fillStyle = TOON.ink; g.beginPath(); g.arc(look * 5 - side * 2, pdy, 7.5, 0, 6.2832); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(look * 5 - side * 2 - 2.5, pdy - 3, 2.4, 0, 6.2832); g.fill();
    if (o.squint) { tShape(g, '#8fd65a', gg => gg.rect(-19, -20, 38, 16), 0); tLine(g, [-17, -4, 17, -4], 3.6); }   // narrowed: the lids come down
    if (sad > .5 || dr > .3 || o.squint) tLine(g, [-side * 14, -12 - (o.squint ? 4 : 0), side * 12, -20 - (o.squint ? 6 : 0)], 3.6);
    else tCurve(g, -13, -13, 0, -22, 13, -13, 3.6);
    g.restore();
  }
}
function dennisState(t) {
  if (t < TL.DEN0) return null;
  const k = smooth(TL.DEN0, TL.DEN1, t);
  return {
    x: lerp(1300, DEN.x, k), mouth: mouthFor('DENNIS', t), look: t >= V.L6.t ? 1.2 : 0,
    droopL: smooth(TL.DROOP1, TL.DROOP1 + .25, t) * (1 - smooth(TL.PADDLE - .3, TL.PADDLE, t)),
    droopR: smooth(TL.DROOP2, TL.DROOP2 + .25, t) * (1 - smooth(TL.PADDLE - .3, TL.PADDLE, t)),
    sad: t >= V.L6.t && t < TL.PADDLE - .3 ? 1 : 0, squint: t >= TL.PADDLE - .3,
    sign: TL.PADDLE <= t ? Math.min(1.08, smooth(TL.PADDLE, TL.PADDLE + .22, t) * 1.08) - .08 * smooth(TL.PADDLE + .22, TL.PADDLE + .4, t) : 0,
  };
}
function drawDennisAll(g, t) {
  const D = dennisState(t); if (!D) return;
  if (D.sign > 0) {                                          // the review sign springs up out of his cap on a pole (visual gag), above his head, between the clerks' faces
    const k = DEN.s / 100, capY = DEN.y - 290 * k, top = capY - 330 * D.sign;
    tShape(g, '#c1c6d8', gg => gg.rect(D.x - 5, top + 80, 10, capY - top - 80), 2.6);
    for (let i = 0; i < 4; i++) tLine(g, [D.x - 9, capY - 16 - i * (capY - top - 100) / 4, D.x + 9, capY - 26 - i * (capY - top - 100) / 4], 2.4);   // the spring
    const pop = 1 + .1 * Math.sin(Math.PI * clamp((t - TL.STAR) / .3));
    drawPaddle(g, D.x, top, .9 * (t >= TL.STAR ? pop : 1), false);
  }
  drawDennis9(g, t, D.x, DEN.y, DEN.s, D);
}

// ---------------------------------------------------------------- Pip
function pipBob(t) { return Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0); }
function pipArm(g, side, hx, hy, open, shade) {
  const P = TOON.pip, sx = side * 52, sy = -88, ex = (sx + hx) / 2 + side * 22, ey = (sy + hy) / 2 + 18;
  tTube(g, [sx, sy, ex, ey, (ex + hx) / 2, (ey + hy) / 2, hx, hy], 20, P.shirt, shade ? P.shirtS : null);
  tHand(g, hx, hy, 9, P.skin, P.skinS, open);
}
function pipState(t) {
  const st = { x: PIP.x, expr: 'gasp', bow: 0 };
  st.x = lerp(PIP.x, PIPX1, smooth(TL.BLOB0, TL.BLOB0 + .5, t));
  if (t >= V.L2.t && t < endOf('L2') + .3) st.mode = 'cheer';
  if (t >= TL.BLOB0) st.expr = 'grin';
  if (t >= TL.CARPET - .25 && t < TL.CARPET + .35) st.mode = 'throw';
  if (t >= TL.CROWN1 - .35 && t < TL.CROWN1 + .2) { st.mode = 'crown'; st.k = smooth(TL.CROWN1 - .35, TL.CROWN1, t); st.target = blobPos(t); }
  if (t >= TL.MILK1 - .45 && t < TL.MILK1 + .15) { st.mode = 'milk'; st.k = smooth(TL.MILK1 - .45, TL.MILK1, t); st.from = CRATE.x - 22; }
  if (t >= TL.BOW && t < TL.CROWN2 - .3) { st.bow = Math.sin(Math.PI * clamp((t - TL.BOW) / .45)); st.expr = 'grin'; }
  if (t >= TL.CROWN2 - .35 && t < TL.CROWN2 + .2) { st.mode = 'crown'; st.k = smooth(TL.CROWN2 - .35, TL.CROWN2, t); st.target = { x: SPOT, y: CT - 100 }; }
  if (t >= TL.MILK2 - .45 && t < TL.MILK2 + .15) { st.mode = 'milk'; st.k = smooth(TL.MILK2 - .45, TL.MILK2, t); st.from = CRATE.x + 22; }
  if (t >= V.L4.t) st.expr = 'grin';
  if (t >= V.L6.t) st.expr = 'worried';
  if (t >= TL.PADDLE + .2) st.expr = 'gasp';
  if (t >= V.L8.t - .1) st.expr = 'sad';
  return st;
}
function drawPip(g, t) {
  const st = pipState(t), bob = pipBob(t), s = PIP.s / 100;
  const o = { expr: st.expr, mouth: mouthFor('PIP', t), blink: blinkAt(3, t), wave: false };
  if (st.mode) o.arms = false;
  g.save(); g.translate(st.x, CT + bob); g.rotate(-.1 * st.bow); g.translate(0, 26 * st.bow);   // the bow: she dips toward the counter
  drawPip2(g, 0, 0, PIP.s, o);
  g.scale(s, s);
  if (st.mode === 'cheer') {                                 // two fists up
    const k = smooth(V.L2.t + .4, V.L2.t + .7, t);
    for (const sd of [-1, 1]) pipArm(g, sd, sd * lerp(30, 66, k), lerp(-40, -205, k), false, sd > 0);
  } else if (st.mode === 'throw') {                          // a two-handed bowling push along the counter
    const k = smooth(TL.CARPET - .25, TL.CARPET + .1, t);
    pipArm(g, -1, lerp(-20, 30, k), lerp(-20, -6, k), true, false); pipArm(g, 1, lerp(20, 80, k), lerp(-20, -4, k), true, true);
  } else if (st.mode === 'crown' || st.mode === 'milk') {
    pipArm(g, -1, -18, -13, false, false);
    const tx = st.mode === 'crown' ? (st.target.x - st.x) / s : (SPOT - 34 - st.x) / s, ty = st.mode === 'crown' ? (st.target.y - 10 - CT) / s : -30 / s;
    const fx = st.mode === 'crown' ? 30 : (st.from - st.x) / s, fy = st.mode === 'crown' ? -60 : -40 / s;
    pipArm(g, 1, lerp(fx, tx, st.k), lerp(fy, ty, st.k) - 30 * Math.sin(Math.PI * st.k), true, true);
  }
  g.restore();
  if (st.mode === 'crown') {                                 // the crown in her hand on its way
    const hx = st.x + lerp(30 * s, st.target.x - st.x, st.k), hy = CT + bob + lerp(-60 * s, st.target.y - 10 - CT, st.k) - 30 * s * Math.sin(Math.PI * st.k);
    if (st.k < .98) drawCrown(g, hx, hy - 4, .8);
  }
  if (st.mode === 'milk' && st.k < .98) {                    // the carton in her hand, from the crate to the customer
    const hx = lerp(st.from, SPOT - 34, st.k), hy = lerp(CT - 40, CT - 30, st.k) - 30 * s * Math.sin(Math.PI * st.k);
    drawCarton(g, hx, hy + 30, .9);
  }
  if (t >= V.L8.t && t < endOf('L8') + .6) pipTears(g, t, st.x, CT + bob);
}
function pipTears(g, t, x, y) {                               // two streams arcing outward from the eye corners, never across the face
  const s = PIP.s / 100;
  for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
    const p = (t * 1.8 + i / 6) % 1, ex = x + sd * 62 * s, ey = y - 182 * s;
    const tx = ex + sd * (10 + p * 120), ty = ey - Math.sin(p * Math.PI) * 40 + p * p * 140;
    g.fillStyle = 'rgba(140,220,255,.95)'; g.beginPath(); g.ellipse(tx, ty, 6, 8, 0, 0, 6.2832); g.fill(); g.lineWidth = 2; g.strokeStyle = TOON.ink; g.stroke();
  }
}

// ---------------------------------------------------------------- the tiny customers
function blobPos(t) {
  const k = clamp((t - TL.BLOB0) / (TL.BLOB1 - TL.BLOB0)), x = lerp(1020, SPOT, k);
  return { x, y: CT - 82 };
}
function drawBlobAll(g, t) {
  if (t < TL.BLOB0) return;
  let x = blobPos(t).x, hop = 0, sq = 1;
  const hopping = (t0, t1) => { if (t >= t0 && t < t1) { const p = ((t - t0) * 2.6) % 1; hop = Math.sin(Math.PI * p) * 26; sq = p < .12 || p > .88 ? .88 : 1.06; } };
  hopping(TL.BLOB0, TL.BLOB1);
  const carry = t >= TL.MILK1 + .1;
  if (t >= TL.BLOBOFF) { const k = smooth(TL.BLOBOFF, TL.BLOBOFF + 1.4, t); x = lerp(SPOT, BLOBEND, k); if (k < 1) { const p = ((t - TL.BLOBOFF) * 2.2) % 1; hop = Math.sin(Math.PI * p) * 10; g.save(); g.translate(x, CT - 6); g.rotate(Math.sin(t * 9) * .12); g.translate(-x, -(CT - 6)); drawBlob(g, t, x, CT - 6, { hop, carry, crown: true }); g.restore(); return; } }
  drawBlob(g, t, x, CT - 6, { hop, sq, carry, crown: t >= TL.CROWN1 });
}
function drawBotAll(g, t) {
  if (t < TL.BOT0) return;
  let x = lerp(1060, SPOT, smooth(TL.BOT0, TL.BOT1, t)), roll = t < TL.BOT1;
  if (t >= TL.BOTOFF) { const k = smooth(TL.BOTOFF, TL.BOTOFF + 1.1, t); x = lerp(SPOT, BOTEND, k); roll = k < 1; }
  drawBot(g, t, x, CT - 6, { roll, crown: t >= TL.CROWN2, carry: t >= TL.MILK2 + .1, happy: t >= TL.CROWN2 });
}
function drawGivenCarton(g, t) {                             // the carton set down by the customer, before it is picked up
  if (t >= TL.MILK1 && t < TL.MILK1 + .1) drawCarton(g, SPOT - 34, CT - 6, .9);
}

// ---------------------------------------------------------------- Rae
function drawRae(g, t) {
  const bob = Math.sin(t * 1.7 + 1) * 1.5;
  const o = { expr: 'deadpan', look: -1.5, mouth: mouthFor('RAE', t), blink: blinkAt(1, t), scanner: true, mug: 0 };
  if (t >= TL.SIP) o.mug = smooth(TL.SIP, TL.SIP + .35, t) * (1 - smooth(TL.SIP + 1.2, TL.SIP + 1.55, t));
  drawRae2(g, RAE.x, CT + bob, RAE.s, o);
}
// MAGS: the jingle swivel on his lines; the Employee of the Month frame on the wall sparkles on "MAGS."
function drawMagsHere(g, t) {
  drawMags(g, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) });
}
function frameSparkle(g, t) {
  const k = clamp((t - TL.MAGSWORD) / .35); if (k <= 0) return;
  const a = Math.sin(Math.PI * Math.min(1, k)) * (1 - smooth(TL.MAGSWORD + 1.4, TL.MAGSWORD + 2.2, t)) + (k >= 1 ? .5 * (1 - smooth(TL.MAGSWORD + .4, TL.MAGSWORD + 2.2, t)) : 0);
  if (a <= 0) return;
  g.save(); g.globalAlpha = Math.min(1, a);
  drawStar(g, 958, 236, 18 + 6 * a, '#fff6c8', 3); drawStar(g, 808, 410, 12 + 4 * a, '#fff6c8', 2.6); drawStar(g, 960, 420, 10, '#fff6c8', 2.4);
  g.restore();
}

// ---------------------------------------------------------------- cameras
const CAM = Object.assign({}, VMCAM, {
  OPEN: [470, 800, 1.15, 1.2],                                 // MAGS, his announcement, and Pip looking up at it (her face above the subtitles)
  PIP_MED: [380, 1030, 1.72, 1.8],
  COUNTER: [505, 1120, 1.95, 2.02],                            // the counter top close: Pip, the crate, the carpet, the tiny customers
  WIDE_D: [600, 1000, 1.18, 1.2],
  DENNIS_CU: [DEN.x, 905, 1.6, 1.66],                          // room for the sign over his head, clear of the subtitles
  PIP_CRY: [PIP.x + 60, 1010, 1.9, 1.98],
  MAGS_MED: [705, 300, 1.95, 2.0],                             // MAGS and the Employee of the Month frame on the wall
  END_WIDE: [580, 940, 1.2, 1.24],    
});

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 1, null);
  frameSparkle(c, t);
  drawMagsHere(c, t);
  if (n === 'OPEN') announce(c, t);
  drawRae(c, t);
  drawPip(c, t);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, true);
  drawCrate(c, t); cartonsInCrate(c, t);
  drawCarpet(c, t);
  drawGivenCarton(c, t);
  drawBlobAll(c, t);
  drawBotAll(c, t);
  drawDennisAll(c, t);
  glassStreaks(c, .9);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues (11/13 natural sound: what we see, in the store's room)
window.EV = [
  { type: 'holo', t: .05 },                                                                       // MAGS's announcement board
  { type: 'chime', t: TL.BLOB0 - .2, pan: .6 },                                                   // the door: a tiny customer
  ...[0, 1, 2].map(i => ({ type: 'squish', t: TL.BLOB0 + (i + .5) / 2.6, pan: .5 - i * .15 })),   // the jelly hopping in (visual gag)
  { type: 'carpet', t: TL.CARPET - .05, pan: -.1 },                                               // the carpet rolled out along the counter
  { type: 'paper', t: TL.CROWN1 - .05, pan: .1 },                                                 // the paper crown on
  { type: 'carton', t: TL.MILK1, pan: .05 },                                                      // the milk set down
  { type: 'chime', t: TL.BOT0 - .2, pan: .6 },                                                    // the door: the robot
  { type: 'motor', t: TL.BOT0, pan: .5 },                                                         // its wheel motor
  { type: 'paper', t: TL.CROWN2 - .05, pan: .1 },
  { type: 'carton', t: TL.MILK2, pan: .05 },                                                      // the last milk
  { type: 'motor', t: TL.BOTOFF, pan: .5, g: .7 },                                                // it rolls off
  { type: 'chime', t: TL.DEN0 - .2, pan: .6 },                                                    // the door: Dennis
  { type: 'slide', t: TL.DEN0, pan: .4 },                                                         // sliding in
  { type: 'droop', t: TL.DROOP1 }, { type: 'droop', t: TL.DROOP2 },                               // the stalks (visual gag)
  { type: 'sign', t: TL.PADDLE, pan: 0 },                                                         // the sign springs up out of his cap (visual gag)
  { type: 'sip', t: TL.SIP + .3, pan: .2 },                                                       // Rae's sip
  { type: 'chime', t: DUR - .9, pan: .6 },                                                        // the door again: back to the first frame
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
