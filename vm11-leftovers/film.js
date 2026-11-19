// Void Mart, episode 10: "Hot Dog Roller". The hot dogs have been rolling since the Big Bang. A one-eyed customer orders one,
// then two; Pip switches the roller off to give them a break and time slows down; only Rae moves at her usual speed, walks over
// and switches it back on; the customer bites. Script: channel/scripts/VM10_hot_dog_roller.md
// Set: the counter (vmkit.js). The counter hides the clerks below the waist; the customer stands in front of it and is only ever
// framed from the chest up (every frame checked in customer(): her waist never reaches the picture).
// Slow time: tau(t) is the world's clock while the roller is off; everything but Rae and the spoken lines runs on it
// (tools/mix.py slows the room and the roller's hum with the same curve).
// Deterministic: render(t) draws frame t; window.EV lists the sound cues.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const lp = (p, q, k) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) });
window.WAIST_ERR = [];

// ---------------------------------------------------------------- slow time (tools/mix.py uses the same curve)
function rate(t) {
  if (t < TL.OFF) return 1;
  if (t < TL.ON) return lerp(1, TL.SLOWR, smooth(TL.OFF, TL.OFF + TL.DECEL, t));
  return lerp(TL.SLOWR, 1, smooth(TL.ON, TL.ON + TL.ACCEL, t));
}
const TAU = (() => { const a = [0]; for (let i = 1; i <= Math.ceil(DUR * 1000) + 2; i++) a.push(a[i - 1] + rate((i - .5) / 1000) / 1000); return a; })();
const tau = t => { t = Math.max(0, t); const i = Math.min(TAU.length - 2, Math.floor(t * 1000)), f = t * 1000 - i; return TAU[i] + (TAU[i + 1] - TAU[i]) * f; };
const slowness = t => (1 - rate(t)) / (1 - TL.SLOWR);

// ---------------------------------------------------------------- layout (world coordinates)
const ROLL = { x: 470, w: 320, h: 72 };                      // the hot dog roller on the counter, in front of Pip's right side
const RX0 = ROLL.x - ROLL.w / 2, RX1 = ROLL.x + ROLL.w / 2;
const SW = { x: RX0 + 22, y: CT - 32 };                      // its ON/OFF switch, front left
const DOGS = [[-46, -94], [46, -94], [-92, -76], [0, -76], [92, -76]];   // back row, then front row (dx, dy from the counter top)
const TAKE1 = 3, TAKE2 = 4;                                  // the two Pip serves: front middle, front right
const CLOCK = { x: 360, y: 700, r: 54 };                     // a wall clock over Pip's head
const CU = { x: 930, hy: 946, waist: 1760, k: 1 };           // the customer: head centre, waist far below every frame
const OFFER = { x: 682, y: 1168 }, HOLD = { x: 792, y: 1176 }, READY = { x: 772, y: 1010 }, KNOCK = { x: 748, y: CT - 16 }, AFTER = { x: 792, y: 1238 };
const BUN = { w: 118 };

// ---------------------------------------------------------------- props
function hotDog(g, x, y, len, rot, roll) {                   // a fossil hot dog, lying left-right; roll turns its cracks round
  g.save(); g.translate(x, y); g.rotate(rot);
  const body = gg => gg.roundRect(-len / 2, -12, len, 24, 12);
  tShape(g, '#9a6444', body); tShade(g, body, '#744631', gg => gg.rect(-len / 2, 4, len, 12));
  g.save(); g.beginPath(); body(g); g.clip();
  g.fillStyle = '#b48a6a'; for (const [px, py, r] of [[-.3, -3, 4], [.1, 2, 3], [.35, -4, 3.5]]) { const cx = ((px * len + roll * 30) % len + len * 1.5) % len - len / 2; g.beginPath(); g.ellipse(cx, py, r * 1.6, r, 0, 0, 6.2832); g.fill(); }
  g.strokeStyle = '#3e2418'; g.lineWidth = 2;               // cracks, sliding round as it rolls
  for (let i = 0; i < 4; i++) { const cx = ((i * len / 4 + roll * 30) % len + len) % len - len / 2; g.beginPath(); g.moveTo(cx, -10); g.lineTo(cx + 4, -3); g.lineTo(cx, 3); g.lineTo(cx + 3, 9); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-len / 2 + 7, -7, len - 14, 3);
  g.restore();
  tShape(g, null, body, 2.8);
  g.restore();
}
function rollerSpin(t) {                                     // the rollers turn on the world's clock while it is on and coast when off
  const T0 = tau(t), toff = tau(TL.OFF), ton = tau(TL.ON);
  if (t < TL.OFF) return T0 * 1.6;
  if (t < TL.ON) return toff * 1.6 + (1 - Math.exp(-(T0 - toff) * 2.5)) * .64;
  return toff * 1.6 + (1 - Math.exp(-(ton - toff) * 2.5)) * .64 + (T0 - ton) * 1.6;
}
function drawRollerBack(g, t) {                              // the bed, the rollers and the hot dogs (under the clerks' hands)
  const spin = rollerSpin(t), top = CT - ROLL.h;
  tShape(g, '#3b3552', gg => { gg.moveTo(RX0 + 6, top); gg.lineTo(RX0 + 26, top - 34); gg.lineTo(RX1 - 26, top - 34); gg.lineTo(RX1 - 6, top); gg.closePath(); }, 3);
  for (let i = 0; i < 6; i++) {
    const k = i / 5, yy = top - 3 - k * 28, inset = 8 + k * 18;
    g.strokeStyle = '#d6d9e6'; g.lineWidth = 4 - k * 1.4; g.beginPath(); g.moveTo(RX0 + inset, yy); g.lineTo(RX1 - inset, yy); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.4; g.setLineDash([6, 10]); g.lineDashOffset = -spin * 40; g.beginPath(); g.moveTo(RX0 + inset, yy - 1); g.lineTo(RX1 - inset, yy - 1); g.stroke(); g.setLineDash([]);
  }
  const taken = i => (i === TAKE1 && t >= TL.CRACK) || (i === TAKE2 && t >= TL.TONG2);
  DOGS.forEach(([dx, dy], i) => { if (!taken(i)) hotDog(g, ROLL.x + dx, CT + dy, 80, (i % 2 ? .015 : -.01), spin + i * .9); });
}
function drawRollerFront(g, t) {                             // the chrome box with the sign and the switch
  const top = CT - ROLL.h;
  tShape(g, '#c9cddd', gg => gg.roundRect(RX0, top, ROLL.w, ROLL.h, 8), 3.4);
  tShade(g, gg => gg.roundRect(RX0, top, ROLL.w, ROLL.h, 8), '#a4a9bf', gg => gg.rect(RX0, top + 44, ROLL.w, 30));
  tShape(g, '#fbf7ff', gg => gg.roundRect(RX0 + 46, top + 6, ROLL.w - 56, ROLL.h - 12, 5), 2.4);
  tText(g, 'ROLLING SINCE', ROLL.x + 20, top + 22, 22, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, 'THE BIG BANG', ROLL.x + 20, top + 48, 27, '#e23b4a', '"Bungee"', 'center', 400);
  const on = !(t >= TL.OFF && t < TL.ON);
  tShape(g, '#2b2244', gg => gg.roundRect(SW.x - 14, SW.y - 20, 28, 40, 6), 2.6);
  tShape(g, on ? '#8fd65a' : '#e23b4a', gg => gg.roundRect(SW.x - 9, on ? SW.y - 16 : SW.y + 2, 18, 14, 3), 2.2);
  if (on) { g.save(); g.shadowColor = '#8fd65a'; g.shadowBlur = 10; g.fillStyle = '#c8ff9a'; g.beginPath(); g.arc(SW.x, SW.y - 9, 3, 0, 6.2832); g.fill(); g.restore(); }
}
function drawSteam(g, t) {                                   // steam off the hot dogs, rising on the world's clock
  const T0 = tau(t);
  for (let i = 0; i < 3; i++) {
    const p = (T0 * .42 + i / 3) % 1, sx = 430 + i * 62 + Math.sin(T0 * 1.3 + i) * 6, sy = CT - 104 - p * 130;
    g.save(); g.globalAlpha = .5 * Math.sin(Math.PI * p); g.strokeStyle = '#fbf7ff'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 12, sy - 12, sx - 12, sy - 26, sx, sy - 38); g.stroke(); g.restore();
  }
}
function drawClock(g, t) {                                   // the wall clock: its second hand ticks on the world's clock
  const T0 = tau(t) + 17, { x, y, r } = CLOCK;
  tEllipse(g, x, y, r + 6, r + 6, '#5c577f', 4); tEllipse(g, x, y, r, r, '#fbf7ff', 3);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; tLine(g, [x + Math.cos(a) * 40, y + Math.sin(a) * 40, x + Math.cos(a) * 47, y + Math.sin(a) * 47], i % 3 ? 2.4 : 4); }
  const hand = (a, l, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); g.stroke(); };
  hand(5.4 + T0 / 43200 * 6.2832, 24, 6, TOON.ink);
  hand(.9 + T0 / 3600 * 6.2832, 36, 4.4, TOON.ink);
  const s = Math.floor(T0) + ease(clamp((T0 % 1) / .14));    // one tick a world-second (a tick in progress stretches out in slow time)
  hand(s / 60 * 6.2832, 44, 2.6, '#e23b4a');
  tEllipse(g, x, y, 4.5, 4.5, '#e23b4a', 0);
}
function drawBun(g, x, y, n, bite) {                         // a bun with n fossil hot dogs; (x, y) = its centre; bite: a bite out of the right end
  g.save(); g.translate(x, y);
  if (bite) { g.beginPath(); g.rect(-200, -200, 400, 400); g.arc(BUN.w / 2 + 4, -10, 38, 0, 6.2832, true); g.clip('evenodd'); }
  tShape(g, '#e6a856', gg => gg.roundRect(-BUN.w / 2, -6, BUN.w, 26, 13), 3);
  for (let i = 0; i < n; i++) hotDog(g, i ? 4 : -2, -8 - i * 14, BUN.w + 16, i ? .05 : -.03, i * 1.3);
  tShape(g, '#f4c27a', gg => gg.roundRect(-BUN.w / 2 + 4, 6, BUN.w - 8, 12, 6), 2.2);
  g.restore();
  if (bite) { g.save(); g.translate(x, y); g.strokeStyle = TOON.ink; g.lineWidth = 3; for (let a = 2.1; a < 4.25; a += .3) { g.beginPath(); g.arc(BUN.w / 2 + 4 + Math.cos(a) * 38, -10 + Math.sin(a) * 38, 6, a - 1.3, a + 1.3); g.stroke(); } g.restore(); }
}
function tongs(g, x, y, grip) {                              // kitchen tongs, (x, y) = the tips, the handle to the left
  for (const sd of [-1, 1]) {
    const pts = [x, y + sd * (3 + 7 * (1 - grip)), x - 92, y + sd * 9];
    tLine(g, pts, 7); g.strokeStyle = '#dfe2ec'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(pts[0], pts[1]); g.lineTo(pts[2], pts[3]); g.stroke();
  }
}
function flavorBoard(g, t) {                                 // MAGS's sales board
  const t0 = V.L8.t + .9, k = clamp((t - t0) / .22); if (k <= 0 || t > endOf('L8') + .5) return;
  g.save(); g.translate(MAGS.x, 362); g.scale(.6 + .4 * k, .6 + .4 * k); g.globalAlpha = k;
  tShape(g, 'rgba(255,125,140,.2)', gg => gg.roundRect(-180, -62, 360, 124, 14), 3.4);
  g.strokeStyle = '#ff7d8c'; g.lineWidth = 2.4; g.strokeRect(-170, -52, 340, 104);
  tText(g, '13,800,000,000', 0, -18, 38, '#ffffff', '"Bungee"', 'center', 400);
  tText(g, 'YEARS OF FLAVOR', 0, 24, 28, '#ffd0d4', '"Bungee"', 'center', 400);
  g.restore();
}
function scannerAt(g, x) {                                   // Rae's scanner, left on the counter where she stood
  g.save(); g.translate(x, CT + 10); g.scale(RAE.s / 100, RAE.s / 100);
  tShape(g, '#9aa0b8', gg => gg.roundRect(8, -40, 34, 14, 5), 3.4); tShape(g, '#ff3355', gg => gg.roundRect(34, -37, 7, 8, 2), 2.2);
  tShape(g, '#7a8098', gg => { gg.moveTo(14, -28); gg.lineTo(24, -28); gg.lineTo(21, -16); gg.lineTo(13, -16); gg.closePath(); }, 3.2);
  g.restore();
}

// ---------------------------------------------------------------- the customer: tall, one big eye, a big mouth, a long puffy jacket
const SKIN = { c: '#ff9a5a', s: '#e0743a' };
function customer(g, t, o) {
  const { x, hy, waist, k } = CU, m = g.getTransform();
  const sy = m.d * waist + m.f, sx0 = m.a * (x - 140 * k) + m.e, sx1 = m.a * (x + 140 * k) + m.e;   // her waist is never in frame
  if (sy < H + 4 && sx1 > 0 && sx0 < W) window.WAIST_ERR.push(+t.toFixed(3));
  const T0 = tau(t), by = Math.sin(T0 * 1.6) * 2.5;
  g.save(); g.translate(x, hy + by); g.scale(k, k);
  const Lw = (waist - hy) / k + 40;
  tShape(g, SKIN.c, gg => gg.rect(-18, 70, 36, 36), 3);                           // neck
  const jacket = gg => { gg.moveTo(-50, 104); gg.quadraticCurveTo(-122, 110, -126, 190); gg.lineTo(-138, Lw); gg.lineTo(138, Lw); gg.lineTo(126, 190); gg.quadraticCurveTo(122, 110, 50, 104); gg.closePath(); };
  tShape(g, '#7a52d8', jacket); tShade(g, jacket, '#5f3eb3', gg => gg.rect(70, 90, 80, Lw));
  g.save(); g.beginPath(); jacket(g); g.clip(); g.strokeStyle = 'rgba(30,16,68,.45)'; g.lineWidth = 3.4;
  for (let yy = 200; yy < Lw; yy += 58) { g.beginPath(); g.moveTo(-150, yy); for (let xx = -150; xx < 150; xx += 50) g.quadraticCurveTo(xx + 25, yy + 12, xx + 50, yy); g.stroke(); }
  g.restore();
  tLine(g, [0, 120, 0, Lw], 3); tShape(g, '#ffd23f', gg => gg.roundRect(-6, 230, 12, 22, 4), 2);
  tShape(g, null, jacket, 4);
  tShape(g, '#5f3eb3', gg => gg.roundRect(-56, 90, 112, 34, 16), 3.4);            // the collar
  drawStar(g, -66, 214, 14, '#7ef0ff', 2.6);                                        // a patch
  // the head: big, round, orange, one eye, an antenna
  const r = 100, chew = o.chew || 0, aw = Math.sin(T0 * 3.1) * 4;
  tCurve(g, 10, -96, 20 + aw * .5, -122, 24 + aw, -140, 4.2); tEllipse(g, 25 + aw, -146, 9, 9, '#8fd65a', 3);
  const head = gg => gg.ellipse(0, 0, r + chew * 6, r, 0, 0, 6.2832);
  tShape(g, SKIN.c, head); tShade(g, head, SKIN.s, gg => gg.ellipse(52, 34, 66, 86, -.3, 0, 6.2832)); tShape(g, null, head, 4.2);
  for (const [fx, fy] of [[-56, 18], [-64, 30], [-48, 32], [56, 22], [64, 34]]) tEllipse(g, fx, fy, 3.5, 3.5, '#d65c2a', 0);
  // the eye
  const ey = -26;
  tEllipse(g, 0, ey, 40, 40, '#fff', 4);
  if (o.blink) tCurve(g, -34, ey, 0, ey + 8, 34, ey, 4.4);
  else {
    const lx = (o.look || 0) * 9, ly = (o.lookY || 0) * 8 + 3;
    g.fillStyle = '#3a1a20'; g.beginPath(); g.arc(lx, ey + ly, 17, 0, 6.2832); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(lx - 6, ey + ly - 7, 6, 0, 6.2832); g.fill();
    if (o.sparkle) { g.beginPath(); g.arc(lx + 7, ey + ly + 6, 3, 0, 6.2832); g.fill(); drawStar(g, 30, ey - 34, 7, '#fff6c8', 2); }
  }
  tCurve(g, -32, ey - 50, 0, ey - 60 - (o.brow || 0) * 8, 32, ey - 50, 4.2);
  // the mouth: talking, gaping (slowly, in the slow time), or chewing rock with full cheeks
  const my = 44, open = Math.max(o.mouth || 0, o.gape || 0);
  let lip = [24, my + 4];
  if (chew > 0) {
    tEllipse(g, -64, my - 4, 24 * chew, 20 * chew, SKIN.c, 3); tEllipse(g, 64, my - 4, 24 * chew, 20 * chew, SKIN.c, 3);
    const w2 = Math.sin(t * 8.5) * 5 + (o.mouth || 0) * 6;
    tCurve(g, -20, my, 0, my + 6 + w2, 20, my, 4);
  } else if (open > .06) {
    const mw = 22 + open * 36, mh = 5 + open * 40, cy2 = my + mh * .35;
    tEllipse(g, 0, cy2, mw, mh, '#4a1a20', 4);
    if (open > .3) { g.save(); g.beginPath(); g.ellipse(0, cy2, mw, mh, 0, 0, 6.2832); g.clip(); g.fillStyle = '#ff7f97'; g.beginPath(); g.ellipse(0, cy2 + mh * .75, mw * .6, mh * .45, 0, 0, 6.2832); g.fill();
      g.fillStyle = '#fffdf2'; for (const tx of [-18, 0, 18]) g.fillRect(tx - 6, cy2 - mh, 12, 10); g.restore(); tEllipse(g, 0, cy2, mw, mh, null, 4); }
    lip = [mw * .55, cy2 + mh * .8];
  } else tCurve(g, -24, my - 4, 0, my + 12, 24, my - 4, 4);
  if (o.slobber) { g.fillStyle = 'rgba(190,240,255,.95)'; g.beginPath(); g.ellipse(lip[0] + 2, lip[1] + 8, 4.5, 8, 0, 0, 6.2832); g.fill(); g.lineWidth = 2; g.strokeStyle = TOON.ink; g.stroke(); }
  if (o.drool) {                                                                    // a drop of drool: grows at the lip, then falls on the world's clock
    const { size, fall } = o.drool;
    if (fall < 900) { g.fillStyle = 'rgba(190,240,255,.95)'; g.beginPath(); g.ellipse(lip[0] + 2, lip[1] + 6 + fall, 6 * size, 9 * size, 0, 0, 6.2832); g.fill(); g.lineWidth = 2; g.strokeStyle = TOON.ink; g.stroke();
      if (fall < 2) { g.strokeStyle = 'rgba(190,240,255,.9)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(lip[0], lip[1] - 4); g.lineTo(lip[0] + 2, lip[1] + 2); g.stroke(); } }
  }
  // her left arm (screen right): hangs at her side, or comes up in front of her: two fingers for "Make it two!"
  if (o.two > 0) {
    const hx = lerp(136, 100, o.two), hyy = lerp(640, 130, o.two);
    tTube(g, [116, 176, lerp(150, 168, o.two), lerp(420, 270, o.two), hx, hyy], 36, '#7a52d8', '#5f3eb3');
    if (o.two > .6) { tTube(g, [hx - 6, hyy - 10, hx - 9, hyy - 30, hx - 12, hyy - 50], 10, SKIN.c); tTube(g, [hx + 6, hyy - 10, hx + 9, hyy - 30, hx + 13, hyy - 48], 10, SKIN.c); }
    tHand(g, hx, hyy, 16, SKIN.c, SKIN.s);
  } else { tTube(g, [116, 176, 150, 420, 136, 640], 36, '#7a52d8', '#5f3eb3'); tHand(g, 134, 654, 16, SKIN.c, SKIN.s); }
  // her right arm (screen left), with the bun, to a world point
  const tx = (o.hand.x - x) / k, ty = (o.hand.y - hy - by) / k, sx = -116, sy2 = 176;
  tTube(g, [sx, sy2, (sx + tx) / 2 - 30, Math.max(sy2, ty) + 44, tx, ty], 36, '#7a52d8');
  if (o.bun != null) drawBun(g, tx, ty - 18, o.bun, o.bite);
  tHand(g, tx + 10, ty, 16, SKIN.c, SKIN.s);
  g.restore();
}
function customerState(t) {
  const T0 = tau(t);
  const o = { mouth: talkLevel('CUST', t), blink: blinkAt(5, T0 + 1.1), look: -1, lookY: .4, bun: 0, hand: OFFER };
  o.sparkle = t < V.L2.t + .6 || (t >= V.L7.t - .2 && t < TL.TONG2 + 1);
  o.slobber = t < TL.CRACK;
  if (t >= TL.HAND - .1) o.bun = 1;
  if (t >= TL.TONG2 + .35) o.bun = 2;
  // the bun: held out for Pip; back to her chest; knocked twice on the counter (tock, tock); held out for the second one
  if (t >= TL.HAND) o.hand = lp(OFFER, HOLD, smooth(TL.HAND, TL.HAND + .45, t));
  if (t >= TL.TAP - .3 && t < TL.TAP + .7) {
    if (t < TL.TAP) { const q = clamp((t - TL.TAP + .3) / .3); o.hand = lp(HOLD, KNOCK, q * q); }
    else if (t < TL.TAP + .28) o.hand = { x: KNOCK.x, y: KNOCK.y - 44 * Math.sin(Math.PI * (t - TL.TAP) / .28) };
    else o.hand = lp(KNOCK, HOLD, smooth(TL.TAP + .28, TL.TAP + .7, t));
    o.look = -.6; o.lookY = 1;
  }
  if (t >= V.L7.t - .1) o.hand = lp(HOLD, OFFER, smooth(V.L7.t - .1, V.L7.t + .3, t));
  if (t >= TL.TONG2 + .45) o.hand = lp(OFFER, HOLD, smooth(TL.TONG2 + .45, TL.TONG2 + .85, t));
  o.two = t >= V.L7.t - .1 && t < TL.TONG2 + .2 ? smooth(V.L7.t - .1, V.L7.t + .2, t) * (1 - smooth(TL.TONG2 - .2, TL.TONG2 + .2, t)) : 0;
  if (t >= V.L4.t && t < V.L7.t - .2) { o.look = -1.5; o.lookY = -.4; o.brow = speaking('RAE', t) ? .8 : .3; }   // looking at Rae
  // the bite: the mouth opens and the bun comes up from "They need a break!", on the world's clock, so it crawls in the slow time;
  // the drop of drool hangs and falls slowly; time comes back; the bite lands at BITE
  const b0 = endOf('L9') - .3;
  if (t >= b0) {
    const dt = T0 - tau(b0);
    o.gape = ease(clamp(dt / 1.6)); o.hand = lp(HOLD, READY, ease(clamp(dt / 2.2))); o.look = -.8; o.lookY = .9; o.sparkle = true; o.brow = .6;
    const tD = tau(TL.DROOL);
    if (t < TL.BITE && T0 > tD - .25) o.drool = { size: clamp((T0 - tD + .25) / .25), fall: T0 > tD ? .5 * 1800 * (T0 - tD) ** 2 : 0 };
    if (t >= TL.BITE - .2 && t < TL.BITE) { const q = clamp((t - TL.BITE + .2) / .2); o.hand = lp(READY, { x: READY.x + 62, y: READY.y - 6 }, q * q); o.gape = 1 - .3 * q; }
  }
  if (t >= TL.BITE) {
    o.bite = true; o.gape = 0; o.drool = null; o.sparkle = false; o.look = 0; o.lookY = 0; o.brow = 0;
    o.chew = Math.min(1, (t - TL.BITE) / .1);
    o.hand = lp({ x: READY.x + 62, y: READY.y - 6 }, AFTER, smooth(TL.BITE + .05, TL.BITE + .5, t));
    o.mouth = talkLevel('CUST', t);
    o.blink = blinkAt(5, t + 1.1) || (t > V.L13.t - .3 && t < V.L13.t + .9);             // eyes shut, savouring: "...Consistent."
  }
  return o;
}

// ---------------------------------------------------------------- Pip
function pipArm(g, side, hx, hy, open, shade) {               // two bones of fixed length: the elbow drops outward when the hand comes close
  const P = TOON.pip, sx = side * 52, sy = -88, L1 = 54, L2 = 56, dx = hx - sx, dy = hy - sy, d = Math.max(1, Math.hypot(dx, dy));
  let ex, ey;
  if (d >= L1 + L2) { ex = sx + dx * L1 / d; ey = sy + dy * L1 / d; }
  else {
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), bx = sx + dx * a / d, by = sy + dy * a / d;
    const p1 = [bx - dy / d * h, by + dx / d * h], p2 = [bx + dy / d * h, by - dx / d * h];
    const score = q => q[1] + side * q[0] * .6;                  // lower and outward
    [ex, ey] = score(p1) > score(p2) ? p1 : p2;
  }
  const cx = 2 * ex - (sx + hx) / 2, cy = 2 * ey - (sy + hy) / 2;   // the curve passes through the elbow
  tTube(g, [sx, sy, cx, cy, hx, hy], 20, P.shirt, shade ? P.shirtS : null);
  tHand(g, hx, hy, 9, P.skin, P.skinS, open);
}
const pipBob = t => Math.sin(tau(t) * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0);
const REST_T = { x: 404, y: CT - 58 };                       // her right hand with the tongs, at rest by the roller
function pipState(t) {
  const st = { expr: 'grin', mode: null, hand: null, tongs: false, dog: false, grip: 1 };
  if (t >= TL.TONG0 && t < TL.CRACK + .15) st.expr = 'worried';
  if (t >= V.L4.t && t < V.L7.t) st.expr = 'gasp';
  if (t >= V.L9.t) st.expr = 'sad';
  if (t >= V.L11.t) st.expr = 'worried';
  // the first hot dog: tongs from "Coming right up!", the tug, the crack, into the customer's bun
  const d1 = { x: ROLL.x + DOGS[TAKE1][0], y: CT + DOGS[TAKE1][1] }, d2 = { x: ROLL.x + DOGS[TAKE2][0], y: CT + DOGS[TAKE2][1] };
  const into = { x: OFFER.x, y: OFFER.y - 22 };
  if (t >= V.L2.t && t < TL.HAND + .4) {
    st.mode = 'tongs'; st.tongs = true;
    let p = { x: REST_T.x + 86, y: REST_T.y }; st.grip = .6 + .4 * Math.abs(Math.sin(t * 9));
    if (t >= TL.TONG0 - .25) { p = lp(p, d1, smooth(TL.TONG0 - .25, TL.TONG0, t)); st.grip = 1; }
    if (t >= TL.TONG0 && t < TL.CRACK) p = { x: d1.x + Math.sin(t * 31) * 5, y: d1.y + Math.sin(t * 23) * 2.5 };
    if (t >= TL.CRACK) { p = lp(d1, { x: d1.x + 40, y: d1.y - 50 }, smooth(TL.CRACK, TL.CRACK + .18, t)); st.dog = true; }
    if (t >= TL.CRACK + .18) p = lp({ x: d1.x + 40, y: d1.y - 50 }, into, smooth(TL.CRACK + .18, TL.HAND - .1, t));
    if (t >= TL.HAND - .1) { p = lp(into, { x: REST_T.x + 86, y: REST_T.y }, smooth(TL.HAND - .05, TL.HAND + .4, t)); st.dog = false; st.grip = .5; }
    st.hand = { x: p.x - 86, y: p.y };
  }
  // the second: "Make it two!"
  if (t >= V.L7.t + .2 && t < TL.TONG2 + .75) {
    st.mode = 'tongs'; st.tongs = true; st.grip = 1;
    let p = lp({ x: REST_T.x + 86, y: REST_T.y }, d2, smooth(V.L7.t + .2, TL.TONG2 - .25, t));
    if (t >= TL.TONG2 - .25 && t < TL.TONG2) p = { x: d2.x + Math.sin(t * 31) * 4, y: d2.y };
    if (t >= TL.TONG2) { p = lp(d2, into, smooth(TL.TONG2, TL.TONG2 + .33, t)); st.dog = true; }
    if (t >= TL.TONG2 + .35) { p = lp(into, { x: REST_T.x + 86, y: REST_T.y }, smooth(TL.TONG2 + .38, TL.TONG2 + .75, t)); st.dog = false; st.grip = .5; }
    st.hand = { x: p.x - 86, y: p.y };
  }
  // the switch, off; then in the slow time her hand lifts off it, very slowly, and stays in the air until she has asked
  const sw = { x: (SW.x + 2 - PIP.x) / (PIP.s / 100), y: (SW.y - 4 - CT) / (PIP.s / 100) };
  if (t >= TL.OFF - .35 && t < TL.OFF) { st.mode = 'arm'; st.handL = lp({ x: 18, y: -13 }, sw, smooth(TL.OFF - .35, TL.OFF - .04, t)); }
  if (t >= TL.OFF && t < endOf('L11') + .3) {
    st.mode = 'arm';
    st.handL = lp(lp(sw, { x: 46, y: -84 }, ease(clamp((tau(t) - tau(TL.OFF)) / 1.0))), { x: 18, y: -13 }, smooth(endOf('L11') - .15, endOf('L11') + .25, t));
    st.open = true;
  }
  if (t >= TL.OFF && t < TL.ON + .3) {                        // one long slow blink on the world's clock
    const d = tau(t) - tau(TL.PIPBLINK); st.blink = d > 0 && d < .14;
  } else st.blink = blinkAt(3, tau(t));
  if (t >= V.L11.t + .2 && t < V.L11.t + .45) st.blink = true; // blinking hard: "Did time just..."
  return st;
}
function drawPipBack(g, t) {
  const st = pipState(t), bob = pipBob(t), o = { expr: st.expr, mouth: mouthFor('PIP', t), blink: st.blink, wave: false };
  if (st.mode) o.arms = false;
  drawPip2(g, PIP.x, CT + bob, PIP.s, o);
  if (st.mode) { g.save(); g.translate(PIP.x, CT + bob); g.scale(PIP.s / 100, PIP.s / 100); pipArm(g, -1, -18, -13, false, false); g.restore(); }
}
function drawPipFront(g, t) {                                // her right arm, in front of the roller
  const st = pipState(t); if (!st.mode) return;
  const bob = pipBob(t), s = PIP.s / 100;
  g.save(); g.translate(PIP.x, CT + bob); g.scale(s, s);
  if (st.mode === 'tongs') {
    const hx = (st.hand.x - PIP.x) / s, hy = (st.hand.y - CT - bob) / s;
    pipArm(g, 1, hx, hy, false, true); g.restore();
    if (st.dog) hotDog(g, st.hand.x + 86, st.hand.y + 1, 80, .04, 0);
    tongs(g, st.hand.x + 86, st.hand.y, st.grip);
    tHand(g, st.hand.x + 2, st.hand.y, 9 * s, TOON.pip.skin, TOON.pip.skinS);    // her fingers over the handle
    return;
  }
  pipArm(g, 1, st.handL.x, st.handL.y, !!st.open, true);
  g.restore();
}

// ---------------------------------------------------------------- Rae: real time, always her usual speed
const RAE_Y = CT + 10;
function raeLocalReach(t, x) {
  const u = RAE.s / 100, k = smooth(TL.REACH, TL.ON - .03, t), back = smooth(TL.ON + .12, TL.ON + .5, t);
  const sw = { x: (SW.x + 6 - x) / u, y: (SW.y - 6 - RAE_Y) / u };
  return { x: lerp(lerp(-8, sw.x, k), -8, back), y: lerp(lerp(-23, sw.y, k), -23, back) };
}
function raeState(t) {
  const o = { expr: 'deadpan', look: 1.5, blink: blinkAt(1, t), mouth: mouthFor('RAE', t), scanner: t < TL.RAEW0 };
  if (t >= TL.OFF) o.look = -1.2;
  if (t >= TL.RAEW0) o.look = -1.6;
  if (t >= TL.ON + .5) o.look = -1.2;
  if (t >= endOf('L12') + .2) o.look = 1.4;                  // then she watches the customer
  return o;
}
function drawRaeBack(g, t) {
  const o = raeState(t);
  if (t >= TL.RAEW0) scannerAt(g, TL.RAE_X0);
  const tr = travel(t, TL.RAEW0, TL.RAE_X0, TL.RAE_X1, TL.RAE_STEP, TL.RAE_SPS);
  if (tr.moving) return drawTraveller(g, (gg, x, y, s, oo) => drawRae2(gg, x, y, s, oo), tr.x, RAE_Y, RAE.s, Object.assign({}, o, { scanner: false }), walkBob(tr.dist, TL.RAE_STEP, 10), -1);
  const x = t < TL.RAEW0 ? TL.RAE_X0 : TL.RAE_X1;
  if (t >= TL.REACH && t < TL.ON + .5) o.reachL = raeLocalReach(t, x);
  drawRae2(g, x, RAE_Y + Math.sin(t * 1.7 + 1) * 1.5, RAE.s, o);
}
function drawRaeFront(g, t) {                                // her left arm, reaching over the roller to the switch
  if (!(t >= TL.REACH && t < TL.ON + .5)) return;
  const x = TL.RAE_X1, R = TOON.rae, r = raeLocalReach(t, x);
  g.save(); g.translate(x, RAE_Y + Math.sin(t * 1.7 + 1) * 1.5); g.scale(RAE.s / 100, RAE.s / 100);
  const mx = (-84 + r.x) / 2 - 6, my = (-78 + r.y) / 2 + 10;
  tTube(g, [-58, -122, -84, -78, mx, my, (mx + r.x) / 2, (my + r.y) / 2, r.x - 4, r.y + 2], 24, R.hood); tHand(g, r.x, r.y, 9.5, R.skin, R.skinS);
  g.restore();
}
function drawMagsHere(g, t) { drawMags(g, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) }); }

// ---------------------------------------------------------------- cameras
const CAM = Object.assign({}, VMCAM, {
  OPEN: [630, 990, 1.32, 1.35],                                // frame 1: the roller and its sign, the customer holding out a bun
  PIP_MED: [385, 1060, 1.72, 1.78],                            // Pip, the roller and its switch above the subtitles
  CUST_MED: [810, 1080, 2.0, 2.06],                           // the counter top above the subtitles: the knock is seen
  RAE_CU: [637, 930, 2.8, 2.9],                                // Pip's hair and the customer's head both stay out
  MAGS_MED: [MAGS.x, 268, 2.1, 2.2],                           // the clerks' hair stays out of the bottom
  SLOW_WIDE: [640, 975, 1.3, 1.34],                            // everyone; bottom of frame at 1713, her waist (1760) stays out
  END_WIDE: [770, 872, 1.85, 1.92],                            // Rae and the customer; MAGS (and his photo) above the frame; faces under y 780 for the card
});

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 1, null);
  drawClock(c, t);
  drawMagsHere(c, t);
  if (n === 'MAGS_MED') flavorBoard(c, t);
  drawRaeBack(c, t);
  drawPipBack(c, t);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, false);
  drawRollerBack(c, t);
  drawSteam(c, t);
  drawRollerFront(c, t);
  drawPipFront(c, t);
  drawRaeFront(c, t);
  customer(c, t, customerState(t));
  glassStreaks(c, .9);
  const sl = slowness(t);                                      // slow time: the store goes a little blue (a tint over the frame)
  if (sl > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(70,140,255,${.14 * sl})`; c.fillRect(0, 0, W, H); }
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound: what we see, in the store's room)
window.EV = [
  { type: 'bed', fx: 'roller_hum', t: 0, t1: DUR + .5, g: -33, warp: true, fin: .05 },            // the roller: motor hum and sizzle (slowed with time)
  { type: 'tug', t: TL.TONG0 - .02, pan: -.15, dur: TL.CRACK - TL.TONG0 },                           // tongs grinding on a welded hot dog
  { type: 'crack', t: TL.CRACK, pan: -.15 },                                                       // it cracks free
  { type: 'drop', t: TL.HAND - .1, pan: .2 },                                                      // into the bun: a stone in bread
  { type: 'knock', t: TL.TAP, pan: .3 }, { type: 'knock', t: TL.TAP + .28, pan: .3, g: .8 },       // tock, tock on the counter
  { type: 'tug', t: TL.TONG2 - .25, pan: .05, dur: .25 },                                          // the second one
  { type: 'crack', t: TL.TONG2, pan: .05, g: .8 },
  { type: 'drop', t: TL.TONG2 + .35, pan: .2, g: .8 },
  { type: 'holo', t: V.L8.t + .9 },                                                                // the flavor board
  { type: 'switch', t: TL.OFF, pan: -.2 },                                                         // off: time slows
  ...footfalls(TL.RAEW0, TL.RAE_X0, TL.RAE_X1, TL.RAE_STEP, TL.RAE_SPS).map(x => ({ type: 'step', t: x, pan: .1 })),   // Rae, at her usual speed
  { type: 'switch', t: TL.ON, pan: -.2 },                                                          // on: time comes back
  { type: 'crunch', t: TL.BITE, pan: .3 },                                                         // the bite
  { type: 'chew', t: TL.BITE + .35, pan: .3, dur: V.L13.t - TL.BITE - .5 },                        // chewing rock
  { type: 'chew', t: endOf('L13') + .1, pan: .3, dur: 2.2, g: .7 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
