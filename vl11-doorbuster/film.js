// Volt Labs, episode 11: "Doorbuster". One doom capacitor left in the whole city and a Black Friday line around the block; Vera
// has strapped a rocket to a shopping cart. Cleo lights it on "two". Past the line ("Hey! No cutting!"), through the opening doors
// ("Happy Black Fri-"), down the aisle, the last box grabbed, a crash into a box pyramid. "I ordered one online." "You said
// 'rocket.'" She lights it again. Script: channel/scripts/VL11_doorbuster.md. Vera and Cleo: channel/brand/lab.js; lip sync,
// subtitles, shots, end card: channel/brand/vmkit.js. The street, the store, the rocket cart and the shoppers are drawn here.
// Vera and Cleo ride inside the cart: its solid plastic sides hide them from the waist down (runbook §2.2, option 2).
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 150, K = S / 100;                                         // Vera and Cleo, in the cart
const RIM = 1330, WHEEL_Y = 1560, SIDEWALK = 1345, CURB = 1640;     // the basket's rim (their waists), the wheels' ground
const QW = 1262, QS = 120;                                          // the line: waists behind the barrier, their scale
const VOFF = -62, COFF = 74;                                        // Vera (back of the basket) and Cleo (front), from the cart's centre

// ---------------------------------------------------------------- where the cart is
function runDist(dt) { const v = TL.RUN_V, a = TL.ACC; if (dt <= 0) return 0; return dt < a ? v * dt * dt / (2 * a) : v * a / 2 + v * (dt - a); }
function cartAt(t) {                                                 // {set, x, shake, rot, moving}
  if (t < TL.AISLE) {
    const sh = t >= TL.IGNITE && t < TL.LAUNCH + .2 ? Math.sin(t * 70) * 4 : 0;
    return { set: 'street', x: TL.CART_X0 + runDist(t - TL.LAUNCH), shake: sh, rot: 0, moving: t > TL.LAUNCH };
  }
  if (t < TL.CRASH) return { set: 'store', x: TL.AISLE_X0 + (t - TL.AISLE) * TL.RUN_V, shake: Math.sin(t * 50) * 1.5, rot: 0, moving: true };
  const jolt = t < TL.CRASH + .3 ? Math.sin((t - TL.CRASH) * 60) * 6 * (1 - (t - TL.CRASH) / .3) : 0;
  const tilt = -.06 * smooth(TL.CRASH, TL.CRASH + .2, t);
  if (t < TL.GO2) return { set: 'store', x: TL.CRASH_X, shake: jolt + (t >= TL.IGNITE2 ? Math.sin(t * 70) * 4 : 0), rot: tilt, moving: false };
  return { set: 'store', x: TL.CRASH_X + runDist(t - TL.GO2), shake: 0, rot: tilt, moving: true };
}
const rocketOn = t => (t >= TL.IGNITE && t < TL.CRASH) || t >= TL.IGNITE2;

// ---------------------------------------------------------------- the rocket cart (local: x along the cart, the rim at y 0)
function drawCartBack(g, x, t, rot) {
  g.save(); g.translate(x, RIM); g.rotate(rot);
  // the rocket, strapped to a pole behind the handle, at shoulder height: silver body, fins, the V logo
  const RY = -96;                                                     // its axis (local y)
  tTube(g, [-214, -30, -214, RY + 40], 10, '#7a8090');                // the pole
  tShape(g, '#c9cfdb', gg => gg.roundRect(-338, RY - 30, 176, 60, 28), 4);
  tShade(g, gg => gg.roundRect(-338, RY - 30, 176, 60, 28), '#a9b0c0', gg => gg.rect(-348, RY + 6, 196, 30));
  tShape(g, '#e04a3a', gg => { gg.moveTo(-166, RY - 24); gg.quadraticCurveTo(-120, RY, -166, RY + 24); gg.closePath(); }, 3.4);   // nose cone
  for (const s2 of [-1, 1]) tShape(g, '#e04a3a', gg => { gg.moveTo(-326, RY + s2 * 28); gg.lineTo(-360, RY + s2 * 64); gg.lineTo(-300, RY + s2 * 28); gg.closePath(); }, 3);   // fins
  tShape(g, '#5d6474', gg => gg.rect(-356, RY - 16, 22, 32), 3);     // the nozzle
  tShape(g, LAB.glow, gg => { gg.moveTo(-290, RY - 12); gg.lineTo(-282, RY + 8); gg.lineTo(-274, RY - 12); gg.lineTo(-278, RY - 12); gg.lineTo(-282, RY - 2); gg.lineTo(-286, RY - 12); gg.closePath(); }, 2);
  tText(g, 'VOLT LABS', -230, RY, 14, '#2f3a44', '"Bungee"', 'center', 400);
  for (const sx of [-252, -196]) { g.strokeStyle = '#3a3f4c'; g.lineWidth = 7; g.beginPath(); g.moveTo(sx, RY - 32); g.lineTo(sx + 4, RY + 32); g.stroke(); }   // the straps
  // the handle bar and the back of the basket
  tTube(g, [-200, -34, -196, 10, -176, 40], 12, '#7a8090');
  tShape(g, '#7a8090', gg => gg.roundRect(-214, -48, 26, 18, 8), 3);
  tShape(g, '#9c2a22', gg => { gg.moveTo(-180, 0); gg.lineTo(180, 0); gg.lineTo(160, 160); gg.lineTo(-160, 160); gg.closePath(); }, 0.01);   // the inside, behind them
  g.restore();
}
function drawFlame(g, x, t, rot, big) {
  g.save(); g.translate(x, RIM); g.rotate(rot);
  const f = 1 + .25 * Math.sin(t * 47) + .15 * Math.sin(t * 83), L = (big ? 150 : 110) * f;
  const y0 = -96, n0 = -356;
  tShape(g, '#ff7a1a', gg => { gg.moveTo(n0, y0 - 18); gg.quadraticCurveTo(n0 - L * .5, y0 - 28, n0 - L, y0); gg.quadraticCurveTo(n0 - L * .5, y0 + 28, n0, y0 + 18); gg.closePath(); }, 3);
  g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(n0, y0 - 12); g.quadraticCurveTo(n0 - L * .35, y0 - 16, n0 - L * .62, y0); g.quadraticCurveTo(n0 - L * .35, y0 + 16, n0, y0 + 12); g.closePath(); g.fill();
  g.fillStyle = '#fffbe0'; g.beginPath(); g.ellipse(n0 - 6, y0, 10, 7, 0, 0, 6.2832); g.fill();
  g.restore();
}
function drawCartFront(g, x, t, rot) {
  g.save(); g.translate(x, RIM); g.rotate(rot);
  const side = gg => { gg.moveTo(-182, -2); gg.lineTo(182, -2); gg.lineTo(162, 162); gg.lineTo(-162, 162); gg.closePath(); };
  tShape(g, '#d8342c', side, 4.4);
  tShade(g, side, '#b8281f', gg => gg.rect(100, -10, 100, 180));
  for (let i = 0; i < 7; i++) tShape(g, '#a82219', gg => gg.roundRect(-136 + i * 40, 40, 20, 84, 8), 2.4);   // the moulded slots
  tShape(g, '#ef5a4f', gg => gg.roundRect(-188, -10, 376, 18, 8), 3.4);                                    // the rim
  tShape(g, '#5d6474', gg => gg.rect(-150, 166, 300, 12), 3);                                                // the chassis
  for (const wx of [-120, 120]) { tLine(g, [wx, 178, wx, 206], 5); tEllipse(g, wx, 214, 17, 17, '#2a2f3d', 3.4); tEllipse(g, wx, 214, 6, 6, '#7a8090', 2); }
  g.restore();
}
// smoke puffs left behind along the street or aisle (opaque, they shrink away)
function exhaust(g, t, cx) {
  if (!rocketOn(t)) return;
  for (let i = 0; i < 9; i++) {
    const age = ((t * 3 + i / 9) % 1), r = 26 * (1 - age);
    if (r < 2) continue;
    tEllipse(g, cx - 390 - age * 260 + Math.sin(i * 2.1) * 10, RIM - 96 - age * 30 + Math.sin(i * 3.7) * 14, r, r * .85, '#d6d1dd', 3);
  }
}
function speedLines(g, t, cx) {
  g.save(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const y = RIM - 220 + i * 70, x0 = cx - 420 - ((t * 900 + i * 130) % 300); g.lineWidth = 5; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 - 140, y); g.stroke(); }
  g.restore();
}

// ---------------------------------------------------------------- the riders
function veraState(t, ct) {
  const mouth = mouthFor('VERA', t);
  let expr = 'scheme', reachR = { x: 12, y: -15 }, box = false, open = false;                 // her hand on the rim, in front of her
  if (t >= V.L4.t - .1 && t < TL.PRESS) expr = 'cool';
  if (t >= TL.PRESS && t < TL.AISLE) expr = 'fluster';
  if (t >= TL.LAUNCH + .4 && t < TL.CRASH) expr = 'laugh';
  if (t >= TL.CRASH) expr = 'fluster';
  if (t >= V.L8.t - .2 && t < V.L9.t) expr = 'laugh';
  if (t >= TL.GRAB - .25 && t < TL.GRAB + .25) {                       // the last box, off its pedestal (the hand finds it as they pass)
    const bx = (TL.GRAB_X + 40 - (ct.x + VOFF)) / K, by = (1182 - RIM - 4) / K;
    const k = smooth(TL.GRAB - .25, TL.GRAB, t) * (1 - smooth(TL.GRAB + .05, TL.GRAB + .25, t));
    reachR = { x: lerp(12, clamp(bx, 20, 140), k), y: lerp(-15, by, k) }; open = t < TL.GRAB;
  }
  if (t >= TL.GRAB) {
    box = true;
    if (t >= TL.GRAB + .25) { const up = t >= V.L8.t - .3 && t < V.L9.t + .2 ? smooth(V.L8.t - .3, V.L8.t, t) * (1 - smooth(V.L9.t - .1, V.L9.t + .2, t)) : 0; reachR = { x: lerp(-6, -34, up), y: lerp(-62, -158, up) }; }
  }
  return { expr, mouth, blink: t > .6 && blinkAt(0, t), tube: false, reachR, box, open };
}
function drawBoxProp(g, x, y, k) {                                    // the DOOM CAPACITOR box
  g.save(); g.translate(x, y); g.scale(k, k);
  tShape(g, '#2f3a44', gg => gg.roundRect(-36, -30, 72, 60, 6), 3.4);
  tShape(g, LAB.glow, gg => gg.rect(-36, -14, 72, 18), 2.4);
  tText(g, 'DOOM', 0, -5, 13, '#1a1030', '"Bungee"', 'center', 400);
  tText(g, 'CAPACITOR', 0, 16, 9, '#e9ffd0', '"Bungee"', 'center', 400);
  g.restore();
}
function drawPhone(g, x, y) {
  g.save(); g.translate(x, y); g.rotate(-.12);
  tShape(g, '#20222c', gg => gg.roundRect(-30, -52, 60, 104, 10), 3);
  g.fillStyle = '#eaf6ff'; g.fillRect(-24, -44, 48, 86);
  tEllipse(g, 0, -18, 12, 12, '#3ccf6a', 2); tLine(g, [-6, -18, -2, -12, 7, -24], 3);
  tText(g, 'ORDER', 0, 6, 10, TOON.ink, '"Bungee"', 'center', 400); tText(g, 'PLACED', 0, 18, 10, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, 'TODAY', 0, 32, 8, '#3a7ad0', '"Bungee"', 'center', 400);
  g.restore();
}
function drawRiders(g, t, ct) {
  const cx = ct.x + ct.shake, bob = ct.moving ? Math.abs(Math.sin(t * 22)) * -4 : 0;
  g.save(); g.translate(cx, RIM + bob); g.rotate(ct.rot); g.translate(-cx, -(RIM + bob));
  const vs = veraState(t, ct);
  drawVera2(g, cx + VOFF, RIM + bob + 4, S, vs);
  const vHand = () => {                                                // her hand, and the box in it
    const hx = cx + VOFF + vs.reachR.x * K, hy = RIM + bob + 4 + vs.reachR.y * K;
    if (vs.box) { drawBoxProp(g, hx + (vs.reachR.x < 0 ? -62 : 10), hy + (vs.reachR.x < 0 ? -26 : 8), 1.0); tHand(g, hx, hy, 9.5 * K, LAB2.vera.skin, LAB2.vera.skinS); }
    else if (vs.open) tHand(g, hx, hy, 9.5 * K, LAB2.vera.skin, LAB2.vera.skinS, true);
  };
  vHand();
  const press = (t >= TL.PRESS - .05 && t < TL.PRESS + .5) ? smooth(TL.PRESS - .05, TL.PRESS + .05, t) * (1 - smooth(TL.PRESS + .3, TL.PRESS + .5, t))
    : (t >= TL.PRESS2 - .05 && t < TL.PRESS2 + .5) ? smooth(TL.PRESS2 - .05, TL.PRESS2 + .05, t) * (1 - smooth(TL.PRESS2 + .3, TL.PRESS2 + .5, t)) : 0;
  const phone = t >= V.L9.t - .3 && t < V.L10.t + .2;
  const pk = phone ? smooth(V.L9.t - .3, V.L9.t, t) * (1 - smooth(V.L10.t - .1, V.L10.t + .2, t)) : 0;
  const reachL = pk > 0 ? { x: lerp(-20, -16, pk), y: lerp(-40, -66, pk) } : null;          // the phone at her chest, under both faces
  drawCleo2(g, cx + COFF, RIM + bob + 4, S, { expr: 'deadpan', mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look: t < TL.REV0 + .2 && t > V.L2.t - .3 ? -1.4 : (t >= TL.CRASH && t < V.L9.t ? -1.2 : undefined), remote: true, press, reachL });
  if (reachL) { const hx = cx + COFF + reachL.x * K, hy = RIM + bob + 4 + reachL.y * K; drawPhone(g, hx + 4, hy - 20); tHand(g, hx, hy + 18, 8.5 * K, LAB2.cleo.glove, LAB.glowS); }
  // reaching out past Cleo for the box: the same arm the rig drew (lab.js reachR), again over Cleo where it crosses her
  const r = vs.reachR;
  if (r.x * K + VOFF > COFF - 95) {
    g.save(); g.beginPath(); g.rect(cx + COFF - 95, 0, 4000, 4000); g.clip(); g.translate(cx + VOFF, RIM + bob + 4); g.scale(K, K);
    const mx = (90 + r.x) / 2 + 6, my = (-80 + r.y) / 2;
    tTube(g, [64, -120, 90, -80, mx, my, (mx + r.x) / 2, (my + r.y) / 2, r.x + 4, r.y - 4], 23, LAB.coat, LAB.coatS);
    g.restore(); vHand();
  }
  g.restore();
}
function drawCart(g, t, ct, showRiders) {
  if (rocketOn(t)) exhaust(g, t, ct.x);
  drawCartBack(g, ct.x + ct.shake, t, ct.rot);
  if (showRiders) drawRiders(g, t, ct);
  drawCartFront(g, ct.x + ct.shake, t, ct.rot);
  if (rocketOn(t)) drawFlame(g, ct.x + ct.shake, t, ct.rot, ct.moving);
}

// ---------------------------------------------------------------- the people in line and the store clerk (one-offs, waist-up)
const PAL = [['#6f7d4f', '#56623c'], ['#3b5f9a', '#2d4a7a'], ['#9a3b5f', '#7a2d4a'], ['#c98d3a', '#a8702a'], ['#4f6f7d', '#3c5662'], ['#7d4f9a', '#623c7a']];
const SKINS = [['#e3b28c', '#c99572'], ['#c98d6a', '#a5704f'], ['#f3cdb5', '#dda88f'], ['#8d5a3c', '#6e4430']];
const HATS = ['#2d3a5c', '#c23b3b', '#2f6b4a', '#e0b23a', '#5a2d6b'];
function drawPerson(g, x, waist, s, o = {}) {
  const [jk, jkS] = PAL[o.p % PAL.length], [skin, skinS] = SKINS[o.p % SKINS.length];
  g.save(); g.translate(x, waist); g.scale(s / 100, s / 100);
  if (o.spin) g.scale(Math.cos(o.spin * Math.PI * 2) || .02, 1);
  const torso = gg => { gg.moveTo(-66, 30); gg.lineTo(-70, -108); gg.bezierCurveTo(-70, -140, -46, -150, -20, -154); gg.lineTo(20, -154); gg.bezierCurveTo(46, -150, 70, -140, 70, -108); gg.lineTo(66, 30); gg.closePath(); };
  tShape(g, o.vest ? '#d8342c' : jk, torso); tShade(g, torso, o.vest ? '#b8281f' : jkS, gg => gg.rect(34, -160, 50, 200));
  if (o.vest) { tShape(g, '#fbf7ff', gg => gg.roundRect(-38, -112, 44, 22, 4), 2.4); tText(g, 'MEGA', -16, -101, 10, '#d8342c', '"Bungee"', 'center', 400); }
  else for (const qy of [-104, -64, -24]) tCurve(g, -68, qy, 0, qy + 8, 68, qy, 2.2, 'rgba(30,30,40,.45)');
  // scarf (streams back when the cart goes by)
  if (!o.vest) {
    const wind = o.wind || 0, col = HATS[(o.p + 2) % HATS.length];
    tShape(g, col, gg => gg.roundRect(-32, -168, 64, 22, 9), 3);
    tShape(g, col, gg => { gg.moveTo(14, -160); gg.quadraticCurveTo(20 - wind * 80, -150 - wind * 10, 18 - wind * 150, -146 + wind * 6); gg.lineTo(34 - wind * 150, -130 + wind * 6); gg.quadraticCurveTo(36 - wind * 70, -134, 32, -146); gg.closePath(); }, 3);
  }
  const face = gg => gg.ellipse(0, -218, 44, 50, 0, 0, 6.2832);
  tShape(g, skin, face); tShade(g, face, skinS, gg => gg.ellipse(26, -208, 26, 54, 0, 0, 6.2832));
  for (const sx of [-1, 1]) {
    const ex = sx * 17 + (o.look || 0) * 4, ey = -222;
    if (o.blink) tLine(g, [ex - 9, ey, ex + 9, ey], 3.2);
    else { tShape(g, '#fbf7ff', gg => gg.ellipse(ex, ey, 9, o.mad ? 7 : 8, 0, 0, 6.2832), 2.6); g.fillStyle = TOON.ink; g.beginPath(); g.arc(ex + (o.look || 0) * 3, ey + 1, 3.4, 0, 6.2832); g.fill(); }
    tLine(g, o.mad ? [ex - sx * 11, ey - 18, ex + sx * 9, ey - 11] : [ex - 10, ey - 15, ex + 10, ey - 15], 3.6);
  }
  tShape(g, skinS, gg => gg.ellipse(1, -203, 6, 5, 0, 0, 6.2832), 2);
  const m = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0;
  if (m) talkMouth(g, 0, -184, Math.max(m, o.mad ? .6 : 0), o.mouth.shape, 1.0); else if (o.mad) tEllipse(g, 0, -182, 9, 7, '#5a1430', 2.6); else tLine(g, [-10, -184, 10, -184], 3);
  // hair / hats
  const hc = HATS[o.p % HATS.length];
  if (o.vest) { tShape(g, '#d8342c', gg => { gg.moveTo(-46, -238); gg.bezierCurveTo(-48, -284, 48, -284, 46, -238); gg.closePath(); }, 3.4); tShape(g, '#d8342c', gg => gg.roundRect(0, -244, 70, 12, 5), 3); }
  else if (o.p % 3 === 1) { tShape(g, '#4a2c1a', gg => { gg.moveTo(-50, -170); gg.quadraticCurveTo(-58, -270, 0, -276); gg.quadraticCurveTo(58, -270, 50, -170); gg.quadraticCurveTo(44, -230, 0, -244); gg.quadraticCurveTo(-44, -230, -50, -170); gg.closePath(); }, 3.4); tShape(g, hc, gg => { gg.moveTo(-48, -240); gg.bezierCurveTo(-50, -298, 50, -298, 48, -240); gg.closePath(); }, 3.4); }
  else { tShape(g, hc, gg => { gg.moveTo(-48, -234); gg.bezierCurveTo(-50, -296, 50, -296, 48, -234); gg.closePath(); }, 3.4); tShape(g, HATS[(o.p + 1) % HATS.length], gg => gg.roundRect(-50, -244, 100, 16, 7), 3); tEllipse(g, 0, -292, 9, 8, '#fbf7ff', 2.4); }
  // arms: in the pockets (the line), or the clerk's with the keys at the door
  if (o.keys != null) {
    const k = o.keys, hx = lerp(70, 112, k), hy = lerp(-60, -116, k);
    tTube(g, [62, -120, 92, -96, hx, hy], 24, '#d8342c', '#b8281f');
    tHand(g, hx + 4, hy - 4, 10, skin, skinS);
    tLine(g, [hx + 10, hy - 6, hx + 22, hy - 18], 3); tEllipse(g, hx + 26, hy - 22, 7, 7, null, 2.4);
    tTube(g, [-62, -120, -78, -70, -56, -10], 24, '#d8342c');
  } else if (o.point) {                                               // pointing after the cart (her arm out to the hand)
    tTube(g, [-62, -120, -78, -70, -56, -10], 24, jk);
    const k = o.point, hx = lerp(70, 150, k), hy = lerp(-60, -150, k);
    tTube(g, [62, -120, (62 + hx) / 2 + 10, (-120 + hy) / 2 + 20, hx, hy], 24, jk, jkS);
    tHand(g, hx + 6, hy - 4, 11, skin, skinS, true);
  } else for (const sx of [-1, 1]) tTube(g, [sx * 62, -120, sx * 76, -76, sx * 58, -14], 24, jk, sx > 0 ? jkS : null);   // hands in the pockets
  g.restore();
}
// the line: one person every ~96 px from the queue's end to the store; each blown back as the cart passes
const QUEUE = Array.from({ length: 27 }, (_, i) => ({ x: 560 + i * 96 + (i * 37) % 23, p: i, dy: (i * 53) % 18 })).filter(q => q.x < TL.DOOR_X - 250);
const SH = (() => { const x = TL.CART_X0 + runDist(V.L5.t + .55 - TL.LAUNCH); let best = QUEUE[0]; for (const q of QUEUE) if (Math.abs(q.x - x) < Math.abs(best.x - x)) best = q; return best; })();
function drawQueue(g, t, x0, x1) {
  const ct = cartAt(t);
  for (const q of [...QUEUE.filter(q => q !== SH), SH]) {
    if (q.x < x0 - 100 || q.x > x1 + 100) continue;
    const passed = ct.set === 'street' && t > TL.LAUNCH ? clamp((ct.x - q.x + 60) / 120) : 0;
    const since = passed > 0 ? Math.max(0, t - (TL.LAUNCH + Math.max(0, (q.x - TL.CART_X0 - 60)) / TL.RUN_V)) : 0;
    const wind = passed * Math.max(0, 1 - since / 1.6);
    const me = q === SH;
    drawPerson(g, q.x, QW + q.dy, QS, { p: q.p, wind, look: me && t > V.L5.t - .4 ? -1.5 : (passed > 0 && wind > .2 ? -1 : (q.p % 4 === 0 ? 1 : 0)),
      mouth: me ? mouthFor('SHOPPER', t) : null, mad: me && t > V.L5.t - .3, blink: !me && blinkAt(q.p % 5, t + q.p * .37),
      point: me ? smooth(V.L5.t - .2, V.L5.t + .15, t) * (1 - smooth(endOf('L5') + .4, endOf('L5') + .8, t)) : 0 });
  }
}

// ---------------------------------------------------------------- the street (built once): pre-dawn, the line, MEGA MART
const ST = {};
function buildStreet() {
  const Wd = 3800, b = document.createElement('canvas'); b.width = Wd; b.height = H; const g = b.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 900); sky.addColorStop(0, '#141a3a'); sky.addColorStop(.7, '#3a2f5c'); sky.addColorStop(1, '#a8587a');
  g.fillStyle = sky; g.fillRect(0, 0, Wd, 900);
  drawStars(g, Wd, 400, 120, 5);
  // the buildings along the street
  const R = (() => { let a = 7; return () => { a = a * 16807 % 2147483647; return a / 2147483647; }; })();
  for (let x = -40; x < 2780; x += 260 + Math.floor(R() * 120)) {
    const w = 240 + R() * 100, top = 380 + R() * 260, col = ['#3a3550', '#433b5e', '#36404f', '#4a3d4d'][Math.floor(R() * 4)];
    tShape(g, col, gg => gg.rect(x, top, w, SIDEWALK - top), 4);
    for (let wy = top + 40; wy < SIDEWALK - 260; wy += 120) for (let wx = x + 26; wx < x + w - 60; wx += 76) { const lit = R() < .25; tShape(g, lit ? '#ffd88a' : '#252238', gg => gg.rect(wx, wy, 44, 64), 2.6); }
  }
  // MEGA MART: a big glass front, the banner, the doors at DOOR_X
  const sx0 = TL.DOOR_X - 420, sx1 = TL.DOOR_X + 700;
  tShape(g, '#e9e4d8', gg => gg.rect(sx0, 300, sx1 - sx0, SIDEWALK - 300), 5);
  tShape(g, '#d8342c', gg => gg.rect(sx0, 330, sx1 - sx0, 150), 4);
  tText(g, 'MEGA MART', (sx0 + sx1) / 2, 410, 96, '#fbf7ff', '"Bungee"', 'center', 400);
  const win = gg => gg.rect(sx0 + 30, 560, sx1 - sx0 - 60, SIDEWALK - 590);
  g.save(); win(g); g.clip(); const wi = g.createLinearGradient(0, 560, 0, SIDEWALK); wi.addColorStop(0, '#fff4c8'); wi.addColorStop(1, '#ffe08a'); g.fillStyle = wi; g.fillRect(sx0, 560, sx1 - sx0, SIDEWALK);
  for (let x = sx0 + 60; x < sx1; x += 150) { tShape(g, '#c9c3dc', gg => gg.rect(x, 700, 110, SIDEWALK - 700), 3); for (let y = 740; y < SIDEWALK; y += 90) tShape(g, ['#ff7a1a', '#29d3c3', '#b9a6ff'][(x + y) % 3], gg => gg.rect(x + 12, y, 86, 50), 2.4); }
  g.restore(); tShape(g, null, win, 5);
  // the banner over the doors
  g.save(); g.translate(TL.DOOR_X, 520); g.rotate(-.02); tShape(g, '#ffd23f', gg => gg.roundRect(-330, -44, 660, 88, 10), 4);
  tText(g, 'BLACK FRIDAY DOORBUSTERS 6 AM', 0, 3, 34, '#1a1030', '"Bungee"', 'center', 400); g.restore();
  // the sidewalk, the curb, the road
  tShape(g, '#9a96a6', gg => gg.rect(-10, SIDEWALK, Wd + 20, CURB - SIDEWALK), 4);
  for (let x = 0; x < Wd; x += 220) tLine(g, [x, SIDEWALK, x - 40, CURB], 2.4);
  tShape(g, '#c9c5d2', gg => gg.rect(-10, CURB, Wd + 20, 26), 4);
  tShape(g, '#2c2b36', gg => gg.rect(-10, CURB + 26, Wd + 20, H), 4);
  for (let x = 40; x < Wd; x += 260) tShape(g, '#e0c84a', gg => gg.rect(x, 1800, 140, 14), 0.01);
  ST.back = b; ST.w = Wd;
  // the barrier in front of the line (fabric-covered panels: no legs show through)
  const f = document.createElement('canvas'); f.width = Wd; f.height = 160; const h = f.getContext('2d');
  for (let x = 480; x < TL.DOOR_X - 140; x += 240) {
    tShape(h, '#2f3a66', gg => gg.rect(x, 10, 236, 110), 4);
    tText(h, 'LINE STARTS HERE', x + 118, 66, 22, '#ffd23f', '"Bungee"', 'center', 400);
    for (const lx of [x + 10, x + 226]) tLine(h, [lx, 120, lx - 12, 150], 6);
  }
  ST.front = f;
}
// the doors (drawn per frame: they slide open), the clerk behind his deal bin
function drawDoors(g, t) {
  const op = smooth(TL.DOOR - .4, TL.DOOR - .08, t), dx = TL.DOOR_X, w = 190, top = 760;
  g.fillStyle = '#fff1b8'; g.fillRect(dx - w, top, 2 * w, SIDEWALK - top);                      // the bright store inside
  for (const sx of [-1, 1]) {
    const x0 = dx + sx * (w / 2) - w / 2 + sx * op * w * .95;
    g.save(); g.beginPath(); g.rect(dx - w - 2, top, 2 * w + 4, SIDEWALK - top); g.clip();
    tShape(g, 'rgba(200,235,255,.5)', gg => gg.rect(x0, top, w, SIDEWALK - top), 4);
    tShape(g, '#ffd23f', gg => gg.rect(x0 + 12, top + 330, w - 24, 190), 3);                   // the DOORBUSTERS decal (opaque)
    tText(g, 'DOOR', x0 + w / 2, top + 400, 30, '#d8342c', '"Bungee"', 'center', 400); tText(g, 'BUSTERS', x0 + w / 2, top + 448, 26, '#d8342c', '"Bungee"', 'center', 400);
    g.restore();
  }
  tShape(g, null, gg => gg.rect(dx - w, top, 2 * w, SIDEWALK - top), 5);
}
function clerk(g, t) {                                                    // beside the doors, behind a deal bin (hides him below the waist)
  const x = TL.DOOR_X + 300, waist = 1250;
  const spin = t > TL.DOOR && t < TL.DOOR + .9 ? (t - TL.DOOR) / .45 : 0;
  drawPerson(g, x, waist, 135, { p: 4, vest: true, keys: t < TL.DOOR - .1 ? smooth(V.L6.t - .6, V.L6.t - .3, t) : 0, mouth: mouthFor('EMPLOYEE', t), look: t < TL.DOOR ? -1.2 : 0, spin });
  tShape(g, '#d8342c', gg => gg.roundRect(x - 120, 1240, 240, 110, 8), 4);
  tShape(g, '#ffd23f', gg => gg.roundRect(x - 100, 1258, 200, 46, 6), 3);
  tText(g, 'DEALS', x, 1282, 28, '#d8342c', '"Bungee"', 'center', 400);
}

// ---------------------------------------------------------------- the store (built once): shelves, signs; the pedestal, the pyramid
const STO = {};
function buildStore() {
  const Wd = 2900, b = document.createElement('canvas'); b.width = Wd; b.height = H; const g = b.getContext('2d');
  g.fillStyle = '#f2ecdc'; g.fillRect(0, 0, Wd, H);
  for (let x = 40; x < Wd; x += 360) { g.save(); g.shadowColor = '#fffbe8'; g.shadowBlur = 24; tShape(g, '#fffdf0', gg => gg.roundRect(x, 160, 260, 20, 8), 3); g.restore(); }
  for (let x = -100; x < Wd; x += 560) {                                 // back shelving: boxes on shelves
    tShape(g, '#c9c3dc', gg => gg.rect(x, 520, 520, SIDEWALK - 520), 4);
    for (let y = 560; y < SIDEWALK - 60; y += 170) {
      tShape(g, '#fbf7ff', gg => gg.rect(x, y + 140, 520, 14), 2.6);
      for (let bx = x + 20; bx < x + 500; bx += 96) tShape(g, ['#3a6fd0', '#e04a3a', '#29d3c3', '#ffd23f', '#7d4f9a'][((bx + y) / 7 | 0) % 5], gg => gg.rect(bx, y + 40, 80, 100), 2.6);
    }
  }
  for (const [x, txt, col] of [[300, '50% OFF', '#d8342c'], [1100, 'DOORBUSTER!', '#ffd23f'], [1900, 'LIMIT 1', '#d8342c']]) {
    tLine(g, [x - 90, 0, x - 90, 300], 3); tLine(g, [x + 90, 0, x + 90, 300], 3);
    tShape(g, col, gg => gg.roundRect(x - 170, 300, 340, 110, 10), 4); tText(g, txt, x, 357, 44, col === '#ffd23f' ? '#d8342c' : '#fbf7ff', '"Bungee"', 'center', 400);
  }
  tShape(g, '#d9d2c0', gg => gg.rect(-10, SIDEWALK, Wd + 20, H), 4);
  for (let x = 0; x < Wd; x += 140) tLine(g, [x, SIDEWALK, x - 90, H], 2);
  STO.back = b; STO.w = Wd;
}
function drawPedestal(g, t) {                                          // LAST ONE! (the box is gone from GRAB)
  const x = TL.GRAB_X + 40;
  tShape(g, '#3a3f4c', gg => gg.roundRect(x - 70, 1212, 140, 133, 8), 4);
  tShape(g, '#d8342c', gg => gg.roundRect(x - 90, 1060, 180, 56, 8), 3.4); tText(g, 'LAST ONE!', x, 1089, 28, '#fbf7ff', '"Bungee"', 'center', 400);
  tLine(g, [x, 1116, x, 1150], 4);
  if (t < TL.GRAB) { g.save(); g.shadowColor = LAB.glow; g.shadowBlur = 24; drawBoxProp(g, x, 1182, 1.0); g.restore(); }
}
const PYR = (() => { const out = []; let i = 0; for (const [row, n] of [[0, 4], [1, 3], [2, 2], [3, 1]]) for (let k = 0; k < n; k++) out.push({ x: TL.CRASH_X + 230 + k * 92 + row * 46, y: SIDEWALK - 40 - row * 80, i: i++ }); return out; })();
function drawPyramid(g, t, front) {
  for (const b of PYR) {
    let x = b.x, y = b.y, r = 0;
    if (t >= TL.CRASH) {                                               // knocked flying, then lying where they land
      const u = Math.min(t - TL.CRASH, .9), vx = 120 + (b.i * 47) % 260, vy = -420 - (b.i * 61) % 300, sgn = b.i % 2 ? 1 : -1;
      x = b.x + vx * u + (b.i % 3 === 0 ? -260 * u : 0); y = Math.min(b.y + vy * u + 1500 * u * u, SIDEWALK + 60 + (b.i % 4) * 50); r = sgn * u * 5;
      if (t >= TL.GO2) x += Math.min(1, t - TL.GO2) * (b.i % 2 ? 320 : 120);
    }
    const isFront = t >= TL.CRASH && b.i % 3 !== 1;
    if (isFront !== front) continue;
    g.save(); g.translate(x, y); g.rotate(r);
    tShape(g, '#c99a5e', gg => gg.rect(-44, -38, 88, 76), 3.4); tShape(g, '#2f3a44', gg => gg.rect(-30, -24, 60, 34), 2.4); tText(g, 'TV', 0, -7, 16, '#9be6ff', '"Bungee"', 'center', 400);
    g.restore();
  }
}

// ---------------------------------------------------------------- cameras ([cx, cy, z0, z1]; some follow the cart)
function camFor(n, t) {
  const ct = cartAt(t);
  switch (n) {
    case 'CART_CU': return [TL.CART_X0 - 110, 1070, 2.25, 2.32];       // frame 1: her face big, the rocket over her shoulder
    case 'CLEO_CU': return [TL.CART_X0 + COFF + 10, 1100, 2.45, 2.55];
    case 'REVEAL': return [lerp(820, TL.DOOR_X - 40, ease(clamp((t - TL.REV0) / (TL.REV1 - TL.REV0)))), 1000, 1.12, 1.12];
    case 'TRACK': return [ct.x + 140, 1080, 1.35, 1.35];
    case 'SHOPPER_CU': return [SH.x - 10, QW + SH.dy - 205 * QS / 100 + 70, 2.4, 2.5];
    case 'DOORS': return [TL.DOOR_X + 40, 1060, 1.42, 1.48];
    case 'AISLE': return [clamp(ct.x + 120, 400, TL.CRASH_X + 90), 1080, 1.38, 1.38];
    case 'TWO': return [TL.CRASH_X + 10, 1110, 1.95, 2.05];
    case 'VERA_CU': return [TL.CRASH_X + VOFF + 10, 1060, 2.45, 2.55];
    case 'CLEO_CU2': return [TL.CRASH_X + COFF + 10, 1090, 2.45, 2.55];
    case 'END': return [TL.CRASH_X + 60, 1180, 1.6, 1.62];             // the card comes up over the empty spot; faces stay under y 780
  }
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  const cam = camFor(n, t), ct = cartAt(t);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#141a3a'; c.fillRect(0, 0, W, H);
  const z = applyCam(c, cam, sk, 0), vx0 = cam[0] - 540 / z, vx1 = cam[0] + 540 / z;
  if (ct.set === 'street' && n !== 'AISLE') {
    c.drawImage(ST.back, 0, 0);
    drawDoors(c, t);
    drawQueue(c, t, vx0, vx1);
    c.drawImage(ST.front, 0, QW - 30);
    if (n === 'DOORS' || n === 'TRACK' || n === 'REVEAL') clerk(c, t);
    if (n === 'SHOPPER_CU') { exhaust(c, t, ct.x); speedLines(c, t, ct.x); }   // in her close-up only its smoke and wind go by
    else {
      const enter = smooth(TL.DOOR - .35, TL.DOOR + .05, t), inside = t > TL.DOOR;
      c.save();
      if (inside) { c.beginPath(); c.rect(TL.DOOR_X - 190, 760, 380, SIDEWALK - 760); c.clip(); }
      if (enter > 0) { const sc = lerp(1, .5, enter) - (inside ? .3 * clamp((t - TL.DOOR) / .5) : 0), gx = inside ? TL.DOOR_X : ct.x; c.translate(gx, lerp(1574, SIDEWALK + 6, enter) - (inside ? 60 * clamp((t - TL.DOOR) / .5) : 0)); c.scale(sc, sc); c.translate(-gx, -1574); ct.x = gx; }
      drawCart(c, t, ct, true);
      c.restore();
      if (ct.moving && enter < .3) speedLines(c, t, ct.x);
    }
  } else {
    c.drawImage(STO.back, 0, 0);
    drawPedestal(c, t);
    drawPyramid(c, t, false);
    drawCart(c, t, ct, !(n === 'END' && t > TL.GONE));
    drawPyramid(c, t, true);
    if (ct.moving && t < TL.CRASH) speedLines(c, t, ct.x);
    if (t >= TL.CRASH && t < TL.CRASH + .6) {                            // the crash: a cardboard-dust burst (opaque, it shrinks)
      const u = (t - TL.CRASH) / .6;
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.2832, r = 40 * (1 - u) + 6; tEllipse(c, TL.CRASH_X + 200 + Math.cos(a) * 120 * u, RIM + 20 + Math.sin(a) * 80 * u, r, r * .8, '#e2d6bf', 3); }
    }
  }
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  endCard(OUT, t, 'vl');   // owner 11/9 + 11/13 + 11/16: the cast, NEW EPISODE EVERY DAY, 2.5 s (TL.ENDCARD), and TL.ASK under it
}
window.render = render;

// ---------------------------------------------------------------- sound cues (tools/mix.py): every action on its frame, in its space
window.EV = [
  { type: 'click', t: TL.PRESS },                                   // Cleo's remote: the ignition
  { type: 'ignite', t: TL.IGNITE },                                 // the rocket lights
  { type: 'machine', kind: 'rocket', t: TL.IGNITE + .2, t1: TL.CRASH + .05, g: -27, space: 'street' },   // and roars: the street, the doors, the aisle
  { type: 'rattle', t: TL.LAUNCH, dur: TL.DOOR - TL.LAUNCH + .3 },  // the cart's wheels on the sidewalk
  { type: 'keys', t: V.L6.t - .55 },                                // the clerk's keys at the doors
  { type: 'slide_door', t: TL.DOOR - .42 },
  { type: 'cloth', t: TL.DOOR + .05, gdb: -2 },                     // he spins
  { type: 'rattle_in', t: TL.AISLE, dur: TL.CRASH - TL.AISLE },     // the wheels on the store floor
  { type: 'grab', t: TL.GRAB },                                     // the last box off its pedestal
  { type: 'crash', t: TL.CRASH },                                   // into the box pyramid
  { type: 'click', t: TL.PRESS2 },
  { type: 'ignite', t: TL.IGNITE2 },
  { type: 'machine', kind: 'rocket', t: TL.IGNITE2 + .2, t1: TL.GONE + .7, g: -28, space: 'lab', pan: .5 },   // away to the right
  { type: 'crash', t: TL.GO2 + .12, gdb: -8 },                      // out through what is left of the boxes
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStreet(); buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
