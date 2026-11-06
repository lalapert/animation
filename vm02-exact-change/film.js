// Void Mart, episode 2: "Exact Change". A tiny prospector tries to pay with a star, then a moon.
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Shared set, cameras and subtitles: channel/brand/vmkit.js
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const CUST = { x: 460, y: CT - 105, s: 165 };          // the prospector floats in front of the counter, facing the clerks
const STARPOS = { x: 610, y: CT - 16 }, MOONPOS = { x: 650, y: CT - 64, r: 66 };

// ---------------------------------------------------------------- the prospector: a tiny old alien in a bubble helmet
function drawProspector(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  // jetpack + flame
  tShape(g, '#7a8098', gg => gg.roundRect(-58, -18, 26, 46, 8), 3.4);
  const fl = 14 + Math.sin((o.t || 0) * 40) * 5;
  tShape(g, '#ffb347', gg => { gg.moveTo(-54, 28); gg.quadraticCurveTo(-45, 28 + fl * 1.6, -36, 28); gg.closePath(); }, 2.4);
  // arm toward the clerks (right): tongs, coupon, or empty
  const ax = o.reach ? 74 : 54, ay = o.reach ? -14 : 4;
  tTube(g, [28, 4, 44, 0, ax, ay], 12, '#6d5bd0');
  tHand(g, ax + 4, ay, 7, '#8f7bff', '#6d5bd0');
  if (o.hold === 'coupon') { g.save(); g.translate(ax + 18, ay - 14); g.rotate(-.15); tShape(g, '#fff6dc', gg => gg.rect(-16, -10, 32, 20), 2.4); tText(g, '10%', 0, 1, 11, '#e23b4a', '"Bungee"', 'center', 400); g.restore(); }
  // body: a round bean
  const body = gg => gg.ellipse(0, 0, 42, 38, 0, 0, 6.2832);
  tShape(g, '#8f7bff', body); tShade(g, body, '#6d5bd0', gg => gg.ellipse(22, 14, 30, 30, 0, 0, 6.2832));
  // one big eye with a bushy brow, a long white beard
  const ey = -10;
  if (o.blink) tCurve(g, 2, ey, 14, ey + 5, 26, ey, 4);
  else { tEllipse(g, 14, ey, 13, 14, TOON.white, 3.4); g.fillStyle = TOON.ink; g.beginPath(); g.arc(19, ey + 1, 6, 0, 6.2832); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(17, ey - 2, 2.2, 0, 6.2832); g.fill(); }
  tShape(g, '#f4f1f8', gg => { gg.moveTo(-2, ey - 18); gg.quadraticCurveTo(14, ey - 30, 32, ey - 18); gg.quadraticCurveTo(14, ey - 22, -2, ey - 18); gg.closePath(); }, 3);
  const m = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0;
  tShape(g, '#f4f1f8', gg => { gg.moveTo(-4, 10); gg.quadraticCurveTo(14, 4 - m * 4, 34, 10); gg.quadraticCurveTo(38, 34, 22, 52); gg.quadraticCurveTo(16, 40, 10, 50); gg.quadraticCurveTo(0, 36, -4, 10); gg.closePath(); });
  if (m) { tEllipse(g, 16, 12 + m * 3, 6 + m * 2, 2 + m * 5, '#4a1028', 2.6); }
  for (const k of [0, 1]) tCurve(g, 6 + k * 10, 22, 8 + k * 10, 32, 6 + k * 10, 42, 2, '#c8c2d8');
  // bubble helmet
  g.save(); g.globalAlpha = .9;
  tShape(g, 'rgba(190,230,255,.18)', gg => gg.arc(0, -4, 54, 0, 6.2832), 4);
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 4; g.beginPath(); g.arc(0, -4, 44, Math.PI * 1.1, Math.PI * 1.35); g.stroke();
  g.restore();
  tShape(g, '#7a8098', gg => gg.roundRect(-30, 44, 60, 10, 4), 3);
  g.restore();
}
// a small star: hot core, rays, flicker
function drawStarlet(g, x, y, r, t) {
  g.save(); g.translate(x, y);
  g.shadowColor = '#ffd23f'; g.shadowBlur = r * 2.2;
  for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4 + t * 1.5); g.fillStyle = 'rgba(255,214,90,.85)'; g.beginPath(); g.moveTo(-r * .18, 0); g.lineTo(0, -r * (1.6 + .3 * Math.sin(t * 9 + i))); g.lineTo(r * .18, 0); g.closePath(); g.fill(); g.restore(); }
  g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fill();
  g.restore();
}
function drawMoon(g, x, y, r) {
  tShape(g, '#c9c6d6', gg => gg.arc(x, y, r, 0, 6.2832), 4.2);
  tShade(g, gg => gg.arc(x, y, r, 0, 6.2832), '#a19db3', gg => gg.arc(x + r * .45, y + r * .35, r * .95, 0, 6.2832));
  for (const [dx, dy, rr] of [[-.35, -.3, .2], [.2, -.45, .12], [.3, .15, .18], [-.2, .35, .14]]) tShape(g, '#a8a4bb', gg => gg.arc(x + dx * r, y + dy * r, rr * r, 0, 6.2832), 2.6);
}
function orbitItem(g, kind, x, y, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  if (kind === 'choco') { tShape(g, '#ffd23f', gg => gg.roundRect(-40, -13, 80, 26, 5), 3); tText(g, 'CHOCO', 0, 1, 13, TOON.ink); }
  else if (kind === 'can') { tShape(g, '#29d3c3', gg => gg.roundRect(-14, -24, 28, 48, 6), 3); tShape(g, '#fbf7ff', gg => gg.rect(-14, -6, 28, 10), 2); }
  else { tShape(g, '#ff9fb8', gg => gg.arc(0, 0, 20, 0, 6.2832), 3); g.fillStyle = '#3a2470'; g.beginPath(); g.arc(0, 0, 7, 0, 6.2832); g.fill(); }
  g.restore();
}
const ORBIT = [['choco', 230, 300, 2.4, 0], ['can', 170, 70, 1.8, 2.1], ['donut', 210, 110, 2.1, 4.0]];
function drawOrbits(g, t, front) {
  const k = clamp((t - TL.MOON - .5) / .6);
  if (k <= 0) return;
  for (const [kind, rx, ry, per, ph] of ORBIT) {
    const a = (t - TL.MOON) * Math.PI * 2 / per + ph, z = Math.sin(a);
    if ((z > 0) !== front) continue;
    const x = MOONPOS.x + Math.cos(a) * rx * k, y = MOONPOS.y - Math.sin(a) * ry * k * .5 - (kind === 'choco' ? 120 * k * (1 + Math.sin(a)) * .5 : 0);
    orbitItem(g, kind, x, y, a * .6);
  }
}
function cracks(g) {
  g.save(); g.strokeStyle = TOON.ink; g.lineWidth = 4; g.lineCap = 'round';
  for (const [dx, dy] of [[-120, 30], [-60, 70], [40, 80], [110, 26], [150, 55]]) { g.beginPath(); g.moveTo(MOONPOS.x, CT + 4); g.lineTo(MOONPOS.x + dx * .5, CT + dy * .5); g.lineTo(MOONPOS.x + dx, CT + dy); g.stroke(); }
  g.restore();
}
function scorch(g, a) { g.save(); g.globalAlpha = a; g.fillStyle = '#2a1018'; g.beginPath(); g.ellipse(STARPOS.x, CT + 6, 46, 9, 0, 0, 6.2832); g.fill(); g.restore(); }
function hairFire(g, t, x, y, k) {
  if (k <= 0) return;
  for (let i = 0; i < 3; i++) {
    const fx = x + (i - 1) * 22, h = (34 + 10 * Math.sin(t * 18 + i * 2)) * k;
    tShape(g, i === 1 ? '#ff7a1a' : '#ffb347', gg => { gg.moveTo(fx - 12, y); gg.quadraticCurveTo(fx - 10, y - h * .6, fx, y - h); gg.quadraticCurveTo(fx + 10, y - h * .6, fx + 12, y); gg.closePath(); }, 3);
  }
}
function smoke(g, t, x, y, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a * .6;
  for (let i = 0; i < 3; i++) { const p = ((t * .8 + i / 3) % 1); g.fillStyle = 'rgba(200,190,220,.7)'; g.beginPath(); g.arc(x + Math.sin(p * 6 + i) * 10, y - p * 90, 10 + p * 18, 0, 6.2832); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, VMCAM, {
  COUNTER: [545, CT - 95, 2.25, 2.4],
  CUST_CU: [CUST.x + 40, CUST.y - 10, 2.3, 2.45],
  PIP_HOLD: [PIP.x + 10, PIPFACE + 100, 2.1, 2.25],
  PIP_FIRE: [PIP.x + 10, PIPFACE + 60, 2.2, 2.35],
  WIDE_MOON: [560, 1000, 1.2, 1.16],
  RAE_ORBIT: [RAE.x - 40, RAEFACE + 120, 2.0, 2.1],
  RAE_MED_END: [RAE.x - 30, RAEFACE + 165, 1.5, 1.6],
});

function pipState(t, n) {
  let expr = 'grin', hold = false, sweat = false;
  if (n === 'PIP_HOLD') { hold = t > TL.PICKUP + .25; expr = t < V.L4.t ? 'gasp' : 'grin'; }
  if (n === 'PIP_FIRE') { expr = 'grin'; sweat = true; }
  if (n === 'WIDE_MOON') expr = t < V.L8a.t ? 'gasp' : 'grin';
  if (n === 'COUNTER' || n === 'RAE_MED') expr = 'gasp';
  const mouth = mouthFor('PIP', t);
  return { expr, hold, sweat, mouth, blink: blinkAt(0, t), arms: true, wave: false };
}
function raeState(t, n) {
  let look = 1.5, mug = null;
  if (n === 'RAE_MED_END') { const a = endOf('L13') + .3; mug = ease((t - a) / .5) * (1 - ease((t - a - 1.3) / .4)); }
  if (n === 'RAE_ORBIT') look = -2 + Math.sin((t - TL.MOON) * Math.PI * 2 / 2.4) * 3;
  return { expr: 'deadpan', look, mug, mouth: mouthFor('RAE', t), blink: blinkAt(1, t), scanner: true };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  const moonK = clamp((t - TL.MOON) / .18), landed = t >= TL.MOON + .18;
  const shake = t > TL.MOON + .1 && t < TL.MOON + .7 ? Math.sin(t * 95) * 10 * (1 - (t - TL.MOON) / .7) : (t > TL.STAR && t < TL.STAR + .25 ? Math.sin(t * 120) * 4 : 0);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);        // clear: the camera can see above the set
  applyCam(c, CAM[n], sk, shake);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 0, TL.MOON + .2);
  drawMags(c, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) });
  const bobP = Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0), bobR = Math.sin(t * 1.7 + 1) * 1.5;
  drawRae2(c, RAE.x, CT + bobR, RAE.s, raeState(t, n));
  const P = pipState(t, n);
  drawPip2(c, PIP.x, CT + bobP, PIP.s, P);
  // the star in Pip's hands, and her hair catching fire
  const headY = CT + bobP - 246 * PIP.s / 100;
  if (P.hold) drawStarlet(c, PIP.x, CT + bobP - 112 * PIP.s / 100, 16, t);
  const fk = t > TL.FIRE[0] && t < TL.FIRE[1] ? ease((t - TL.FIRE[0]) / .5) * (1 - ease((t - TL.FIRE[1] + .4) / .4)) : 0;
  hairFire(c, t, PIP.x - 10, headY + 22, fk);
  smoke(c, t, PIP.x - 10, headY + 10, t > TL.PICKUP + .8 && t < TL.FIRE[1] + 1 ? 1 : 0);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, !landed);
  scorch(c, clamp((t - TL.STAR) / .6));
  if (t >= TL.STAR && !(t > TL.PICKUP + .25 && t < TL.FIRE[1] + .3) && t < TL.MOON) drawStarlet(c, STARPOS.x, STARPOS.y - Math.max(0, 1 - (t - TL.STAR) / .12) * 300, 17, t);
  if (landed) cracks(c);
  drawOrbits(c, t, false);
  if (t >= TL.MOON) drawMoon(c, MOONPOS.x, lerp(MOONPOS.y - 700, MOONPOS.y, moonK * moonK), MOONPOS.r);
  drawOrbits(c, t, true);
  // the customer, in front of the counter
  const cm = mouthFor('CUST', t);
  drawProspector(c, CUST.x, CUST.y + Math.sin(t * 2.6) * 6, CUST.s, { t, mouth: cm, blink: blinkAt(2, t), reach: t < V.L2.t || (t > V.L10.t - .3 && t < endOf('L12')), hold: t > V.L10.t - .3 && t < endOf('L12') ? 'coupon' : null });
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (t >= TL.STAR && t < TL.STAR + .35) { c.save(); c.globalAlpha = .6 * (1 - (t - TL.STAR) / .35); c.fillStyle = '#fff6c8'; c.fillRect(0, 0, W, H); c.restore(); }
  if (t >= TL.MOON + .1 && t < TL.MOON + .5) { c.save(); c.globalAlpha = .35 * (1 - (t - TL.MOON - .1) / .4); c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.restore(); }
  glassStreaks(c, .9);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); }
window.render = render;

window.EV = [
  { type: 'whoosh', t: TL.STAR - .12 },
  { type: 'sizzle', t: TL.STAR },
  { type: 'beep', t: V.L2.t + .2, pan: .3 },
  { type: 'sparkle', t: TL.PICKUP + .2 },
  { type: 'ignite', t: TL.FIRE[0] },
  { type: 'pat', t: V.L6.t + .05 },
  ...vmShotsFrom('MAGS_CU').map(t => ({ type: 'blip', t: t + .02 })),
  { type: 'fall', t: TL.MOON - .25 },
  { type: 'thud', t: TL.MOON + .15 },
  { type: 'flip', t: TL.MOON + .25 },
  { type: 'bed', fx: 'orbit', t: TL.MOON + .5, t1: DUR + .5, g: -27 },
  { type: 'sip', t: endOf('L13') + .7, pan: .3 },
  { type: 'bed', fx: 'store_hum', t: 0, t1: DUR + .5, g: -30 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
