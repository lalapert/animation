// Void Mart, episode 5: "Dennis". The regular's milk is sold out. Script: channel/scripts/VM05_dennis.md
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Shared set, cameras and subtitles: channel/brand/vmkit.js
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const DEN = { x: 540, y: CT + 80, s: 130 };                     // Dennis, at the counter, facing the clerks (and us)
const CARTON_SPOT = { x: 640, y: CT - 2 };                     // where Rae puts the hidden carton

// ---------------------------------------------------------------- Dennis, with drooping stalks, a melt and tears
// o: droopL, droopR 0..1, melt 0..1, mouth {a}, item 'DENNIS' | null, tears 0..1, look
function drawDennis5(g, t, x, y, s, o = {}) {
  const D = { body: '#8fd65a', bodyS: '#62ad38', belly: '#c6f29c', spot: '#6db33f', stache: '#7a4e2c', stacheS: '#5a3720', cap: '#e23b4a', capS: '#b52634', panel: '#fbf7ff' };
  const m = o.melt || 0, sx = 1 + .55 * m, sy = 1 - .84 * m;
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  // puddle under him (grows as he melts)
  g.fillStyle = 'rgba(170,240,120,.6)'; g.beginPath(); g.ellipse(0, 4, 130 + 120 * m, 12 + 10 * m, 0, 0, 6.2832); g.fill();
  // eye stalks and eyes: from the top of the (squashed) body, drooping outward
  const topY = -268 * sy, look = o.look ?? 0;
  const eyes = [];
  for (const side of [-1, 1]) {
    const dr = (side < 0 ? o.droopL : o.droopR) || 0, a = side * dr * 2.25;
    const rot = (px, py) => [side * 34 * sx + Math.cos(a) * px - Math.sin(a) * py, topY + Math.sin(a) * px + Math.cos(a) * py];
    const p1 = rot(side * 6, -32), p2 = rot(side * 18, -66), pe = rot(side * 20, -76);
    tTube(g, [side * 34 * sx, topY, p1[0], p1[1], p2[0], p2[1]], 15, D.body, side > 0 ? D.bodyS : null);
    eyes.push([pe[0], pe[1], side, dr]);
  }
  // body, cap, moustache: squashed by the melt
  g.save(); g.scale(sx, sy);
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
  // mouth: a smile, a frown when sad, open when talking
  const ma = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0, sad = o.sad || 0;
  if (ma) tEllipse(g, 0, -176, 10 + ma * 6, 4 + ma * 12, '#3a1a20', 3.2);
  else if (sad > .5) tCurve(g, -16, -172, 0, -184, 16, -172, 3.8);
  else tCurve(g, -16, -180, 0, -170, 16, -180, 3.8);
  const st = gg => { gg.moveTo(0, -206); gg.bezierCurveTo(-14, -220, -40, -214, -52, -196); gg.bezierCurveTo(-40, -200, -28, -196, -18, -190); gg.bezierCurveTo(-10, -186, -4, -190, 0, -194); gg.bezierCurveTo(4, -190, 10, -186, 18, -190); gg.bezierCurveTo(28, -196, 40, -200, 52, -196); gg.bezierCurveTo(40, -214, 14, -220, 0, -206); gg.closePath(); };
  tShape(g, D.stache, st); tShade(g, st, D.stacheS, gg => gg.rect(-60, -200, 120, 14));
  // stubby arms: empty at his sides, or hugging his carton
  if (o.item) {
    tTube(g, [-104, -60, -84, -30, -50, -18], 24, D.body); tTube(g, [104, -60, 84, -30, 50, -18], 24, D.body, D.bodyS);
    drawCarton(g, 0, -6, 1.15, o.item, true);
    tEllipse(g, -46, -18, 13, 11, D.body); tEllipse(g, 46, -18, 13, 11, D.body);
  } else if (m < .5) {
    tTube(g, [-104, -60, -112, -30, -104, -12], 24, D.body); tTube(g, [104, -60, 112, -30, 104, -12], 24, D.body, D.bodyS);
  }
  g.restore();
  // the eyes (unsquashed, so they stay readable on top of the puddle)
  for (const [ex, ey, side, dr] of eyes) {
    tEllipse(g, ex, ey, 17, 18, TOON.white, 3.6);
    const pdy = 6 + dr * 5;
    g.fillStyle = TOON.ink; g.beginPath(); g.arc(ex + look * 5 - side * 2, ey + pdy, 7.5, 0, 6.2832); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + look * 5 - side * 2 - 2.5, ey + pdy - 3, 2.4, 0, 6.2832); g.fill();
    if (sad > .5 || dr > .3) tLine(g, [ex - side * 14, ey - 12, ex + side * 12, ey - 20], 3.6);     // sad brow
    else tCurve(g, ex - 13, ey - 13, ex, ey - 22, ex + 13, ey - 13, 3.6);
    if (o.tears > 0) {                                                                             // joy: two little fountains
      for (let i = 0; i < 7; i++) { const p = ((t * 1.6 + i / 7) % 1), k = o.tears, tx = ex + side * (16 + p * 150 * k), ty = ey - 8 - Math.sin(p * Math.PI) * 90 * k + p * p * 160 * k;
        g.fillStyle = 'rgba(140,220,255,.9)'; g.beginPath(); g.ellipse(tx, ty, 6, 8, 0, 0, 6.2832); g.fill(); g.lineWidth = 2; g.strokeStyle = TOON.ink; g.stroke(); }
    }
  }
  g.restore();
}
// a milk carton: gable top, label band. s = scale (1 = 56 wide). label: OAT | ALMOND | MOON | DENNIS
function drawCarton(g, x, y, s, label, dennis) {
  const col = { OAT: '#e9d7b0', ALMOND: '#f2c9a0', MOON: '#c9c6e6', DENNIS: '#ffd23f' }[label] || '#fbf7ff';
  g.save(); g.translate(x, y); g.scale(s, s);
  tShape(g, col, gg => gg.rect(-28, -62, 56, 62));
  tShape(g, col, gg => { gg.moveTo(-28, -62); gg.lineTo(0, -84); gg.lineTo(28, -62); gg.closePath(); }, 3);
  tShape(g, TOON.white, gg => gg.rect(-6, -92, 12, 10), 2.4);
  tShape(g, label === 'DENNIS' ? TOON.orange : '#fbf7ff', gg => gg.rect(-28, -46, 56, 20), 2.6);
  tText(g, label === 'DENNIS' ? 'MILK' : label, 0, -36, label.length > 4 ? 10 : 12, TOON.ink);
  if (label === 'MOON') { tShape(g, '#fff6c8', gg => gg.arc(0, -12, 9, 0, 6.2832), 2.2); }
  if (dennis) { g.save(); g.translate(0, -12); g.rotate(-.12); tText(g, 'DENNIS', 0, 0, 12, '#c2233a', '"Bungee"', 'center', 400); g.restore(); }
  g.restore();
}
// the egg: a white lab coat and a platinum bob, seen from behind, pushing a cart of 400 batteries out of the store
function drawBatteryCart(g, t) {
  const k = clamp(t / 2.4); if (k >= 1) return;
  const x = lerp(560, -120, k), y = CT + 220;
  g.save(); g.translate(x, y); g.scale(1.25, 1.25);
  // cart and boxes
  tShape(g, '#9aa0b8', gg => gg.rect(-170, -150, 150, 110), 3.4);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 2; i++) tShape(g, '#ffd23f', gg => gg.rect(-162 + i * 70, -150 - (r + 1) * 46, 64, 44), 3);
  tText(g, 'BATTERIES', -95, -258, 13, TOON.ink, '"Bungee"', 'center', 400);
  tShape(g, '#e23b4a', gg => gg.roundRect(-140, -350, 92, 36, 8), 3); tText(g, 'x400', -94, -332, 20, '#fff', '"Bungee"', 'center', 400);
  for (const wx of [-150, -40]) tEllipse(g, wx, -30, 12, 12, '#3a3546', 3);
  // her: coat from behind, arms forward to the cart handle, platinum bob
  tTube(g, [-10, -230, -40, -190, -20, -150], 26, '#f4f1fb');
  const coat = gg => { gg.moveTo(-60, 0); gg.lineTo(-56, -220); gg.quadraticCurveTo(0, -262, 56, -220); gg.lineTo(60, 0); gg.closePath(); };
  tShape(g, '#f4f1fb', coat); tShade(g, coat, '#c9c3dc', gg => gg.rect(20, -270, 50, 280)); tLine(g, [0, -150, 0, 0], 3);
  tShape(g, '#f6eccb', gg => { gg.moveTo(-50, -232); gg.quadraticCurveTo(-58, -300, 0, -312); gg.quadraticCurveTo(58, -300, 50, -232); gg.lineTo(30, -240); gg.lineTo(0, -232); gg.lineTo(-30, -240); gg.closePath(); });
  tShape(g, '#b6ff3b', gg => gg.roundRect(-34, -296, 22, 7, 3), 2);
  g.restore();
}
// MAGS's offer: a hologram price tag
function priceTag(g, t) {
  const t0 = V.L7.t + 1.0, k = clamp((t - t0) / .25); if (k <= 0 || t > V.L8.t + .2) return;
  g.save(); g.translate(MAGS.x, MAGS.y + 270); g.scale(.6 + .4 * k, .6 + .4 * k); g.globalAlpha = k;
  tShape(g, 'rgba(255,125,140,.18)', gg => gg.roundRect(-150, -70, 300, 140, 18), 4);
  g.strokeStyle = '#ff7d8c'; g.lineWidth = 3; g.strokeRect(-138, -58, 276, 116);
  tText(g, 'MILK+', 0, -26, 40, '#ffd0d4', '"Bungee"', 'center', 400);
  tText(g, '$99.99/MO', 0, 26, 40, '#ffffff', '"Bungee"', 'center', 400);
  g.restore();
}
// the floor after the happy tears: a shiny green-blue puddle in front of the counter
function floorTears(g, t) {
  const k = smooth(V.L10.t + .3, TL.FLIP + .6, t); if (k <= 0) return;
  g.save(); g.globalAlpha = .75 * k;
  g.fillStyle = '#9fe6c8'; g.beginPath(); g.ellipse(540, CT + 380, 300 + 260 * k, 50 + 30 * k, 0, 0, 6.2832); g.fill();
  g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(430, CT + 366, 90 * k, 8, 0, 0, 6.2832); g.fill();
  g.restore();
}
function mopFromPip(g, t, bob) {                                 // Pip leans over with a mop; the mop head swishes in the puddle
  const hx = PIP.x + 6, hy = CT + bob - 104 * PIP.s / 100, sw = Math.sin(t * 6) * 40, fx = PIP.x + 120 + sw, fy = CT + 360;
  tLine(g, [hx, hy, fx, fy], 9); g.strokeStyle = '#c99a5b'; g.lineWidth = 5; g.beginPath(); g.moveTo(hx, hy); g.lineTo(fx, fy); g.stroke();
  for (let i = -4; i <= 4; i++) tCurve(g, fx, fy, fx + i * 9, fy + 20, fx + i * 13 + sw * .2, fy + 44, 6, '#e8e4f2');
}

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, VMCAM, {
  WIDE_OPEN: [540, 1000, 1.18, 1.22],
  DENNIS_CU: [DEN.x, DEN.y - 330, 1.85, 1.98],
  MAGS_MED: [MAGS.x, MAGSY + 150, 1.95, 2.05],
  PIP_HOLD: [PIP.x + 10, PIPFACE + 100, 2.1, 2.25],
  WIDE_MELT: [540, 1060, 1.24, 1.3],
  WIDE_SPRING: [540, 1010, 1.2, 1.26],
  WIDE_END: [545, 1030, 1.2, 1.26],
});

// ---------------------------------------------------------------- character states
function dennisState(t) {
  const melt = t < TL.MELT ? 0 : (t < TL.SPRING ? smooth(TL.MELT, TL.MELT + 1.0, t) : 1 - smooth(TL.SPRING, TL.SPRING + .35, t));
  const droop = Math.max(0, 1 - smooth(TL.SPRING, TL.SPRING + .3, t)) * (1 - melt);      // melting: the stalks stand up out of the puddle
  return {
    x: t < 1.1 ? lerp(1250, DEN.x, ease(t / 1.1)) : DEN.x, melt,
    droopL: smooth(TL.DROOP1, TL.DROOP1 + .25, t) * droop, droopR: smooth(TL.DROOP2, TL.DROOP2 + .25, t) * droop,
    sad: t >= V.L3.t && t < TL.SPRING ? 1 : 0, mouth: mouthFor('DENNIS', t), item: t >= TL.SPRING + .2 ? 'DENNIS' : null,
    tears: t >= V.L10.t - .1 ? smooth(V.L10.t - .1, V.L10.t + .4, t) * (1 - smooth(TL.FLIP + 2.2, TL.FLIP + 3, t)) : 0,
    look: t >= V.L2.t && t < TL.SPRING ? 1.2 : 0,
  };
}
function pipState(t, n) {
  let expr = 'grin', hold = false;
  if (t >= V.L2.t && t < V.L4.t) expr = 'gasp';
  if (n === 'PIP_HOLD') { hold = t >= TL.CARTONS[0] - .1; expr = 'grin'; }
  if (t >= TL.MELT && t < TL.SPRING) expr = 'worried';
  if (t >= TL.FLIP + .8) { expr = 'sheepish'; hold = true; }
  return { expr, hold, mouth: mouthFor('PIP', t), blink: blinkAt(0, t), arms: true, wave: t < V.L1.t + 1.2, wavePhase: t * 9 };
}
function raeState(t, n) {
  let reachL = null;
  if (t >= V.L9.t + .3 && t < TL.SPRING + .2) {
    const down = smooth(V.L9.t + .3, V.L9.t + .7, t), up = smooth(TL.HID, TL.HID + .3, t), back = smooth(TL.SPRING, TL.SPRING + .2, t);
    reachL = { x: lerp(-30, -52, up), y: lerp(lerp(-30, 30, down), -24, up) + back * 0 };
  }
  return { expr: 'deadpan', look: -1.5, mug: 0, reachL, mouth: mouthFor('RAE', t), blink: blinkAt(1, t), scanner: true };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  const shake = t > TL.SPRING && t < TL.SPRING + .3 ? Math.sin(t * 90) * 8 * (1 - (t - TL.SPRING) / .3) : 0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, shake);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 0, TL.FLIP);
  drawMags(c, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) });
  priceTag(c, t);
  const bobR = Math.sin(t * 1.7 + 1) * 1.5, bobP = Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0);
  const R = raeState(t, n);
  drawRae2(c, RAE.x, CT + bobR, RAE.s, R);
  const P = pipState(t, n);
  drawPip2(c, PIP.x, CT + bobP, PIP.s, P);
  if (n === 'PIP_HOLD' && P.hold) {                               // the cartons, one after another, held up high
    const i = TL.CARTONS.filter(x => t >= x - .1).length - 1, t0 = TL.CARTONS[i], pop = 1 + .25 * Math.max(0, 1 - (t - t0) / .2);
    drawCarton(c, PIP.x, CT + bobP - 104 * PIP.s / 100 + 88, 1.3 * pop, ['OAT', 'ALMOND', 'MOON'][i]);
  }
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, true);
  floorTears(c, t);
  if (R.reachL && t >= TL.HID) { const hx = RAE.x + R.reachL.x * RAE.s / 100, hy = CT + bobR + R.reachL.y * RAE.s / 100; drawCarton(c, hx, hy + 30, 1.2, 'DENNIS', true); }
  else if (t >= TL.HID && t < TL.SPRING + .2) drawCarton(c, CARTON_SPOT.x, CARTON_SPOT.y, 1.2, 'DENNIS', true);
  const D = dennisState(t);
  drawDennis5(c, t, D.x, DEN.y, DEN.s, D);
  if (t >= TL.FLIP + .8) mopFromPip(c, t, bobP);
  drawBatteryCart(c, t);
  glassStreaks(c, .9);
}
// the hook card (experiment, 4 episodes): first 2.5 s, top of the frame, inside the safe zone
function hookCard(g, t) {
  const a = clamp((2.5 - t) / .25); if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  tShape(g, 'rgba(18,10,42,.88)', gg => gg.roundRect(140, 250, 800, 190, 26), 5);
  tText(g, 'HIS MILK IS', 540, 314, 64, '#fbf7ff', '"Bungee"', 'center', 400);
  tText(g, 'SOLD OUT', 540, 388, 64, '#ffb066', '"Bungee"', 'center', 400);
  g.restore();
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); hookCard(OUT, t); endCard(OUT, t, 'vm'); }
window.render = render;

window.EV = [
  { type: 'bed', fx: 'store_hum', t: 0, t1: DUR + .5, g: -30 },
  { type: 'chime', t: .02 },
  { type: 'slide', t: .1 },
  { type: 'cart', t: .05 },
  { type: 'droop', t: TL.DROOP1 },
  { type: 'droop', t: TL.DROOP2 },
  ...TL.CARTONS.map(x => ({ type: 'carton', t: x - .05 })),
  ...vmShotsFrom('MAGS_MED').map(x => ({ type: 'blip', t: x + .02 })),
  { type: 'blip', t: V.L7.t + 1.0 },
  { type: 'melt', t: TL.MELT },
  { type: 'carton', t: TL.HID + .3 },
  { type: 'pop', t: TL.SPRING },
  { type: 'tears', t: V.L10.t, dur: 2.4 },
  { type: 'flip', t: TL.FLIP },
  { type: 'squeak', t: TL.FLIP + .9 },
  { type: 'chime', t: DUR - 1.2 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
