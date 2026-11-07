// Volt Labs, episode 5: "The Monologue". Vera rehearses her villain monologue, pacing behind the bench with a script written on a very long
// Void Mart receipt. Cleo times it on the microwave: 3:11:00. The audience (potted plants) did not make it. Script: channel/scripts/VL05_the_monologue.md
// Movement (owner, 11/8): waist-up travel behind the bench (travel.js), the bench hides her legs.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const M0 = TL.MONT0, M1 = TL.MONT1;
const MICRO = { x: 590, y: LCT };                                  // the microwave on the bench, left of Cleo
const PLANTS = [905, 952, 999, 1046];                              // the audience, on the bench at the right
const STEP = 150;
const FLYER_WALL = { x: 560, y: 470 };

// ---------------------------------------------------------------- Vera's pacing: ping-pong between two marks, slow while she speaks, fast in the montage
const PX0 = 170, PX1 = 520;
function paceDist(t) {
  if (t < TL.PACE0) return 0;
  const slow = 190, fast = 620, a = Math.min(t, M0) - TL.PACE0;
  let d = Math.max(0, a) * slow;
  if (t > M0) d += (Math.min(t, M1) - M0) * fast;
  return d;
}
function paceX(d) {                                                // start at 300 going right, bounce between PX0 and PX1
  const L = PX1 - PX0, p = (d + (300 - PX0)) % (2 * L);
  return p < L ? { x: PX0 + p, dir: 1 } : { x: PX1 - (p - L), dir: -1 };
}
function veraPos(t) {
  if (t < TL.PACE0 || t >= M1) return { x: VERA.x, dir: 1, moving: false, dist: 0 };
  const d = paceDist(t), P = paceX(d);
  return { x: P.x, dir: P.dir, moving: true, dist: d };
}

// ---------------------------------------------------------------- props
function flyer(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-.03);
  tShape(g, '#f4ecd6', gg => gg.rect(-150, -200, 300, 400), 4);
  tText(g, 'HELP WANTED', 0, -150, 40, TOON.ink, '"Bungee"', 'center', 400); tText(g, '(EVIL)', 0, -100, 46, '#c2233a', '"Bungee"', 'center', 400);
  g.save(); g.translate(10, 40); g.rotate(-.25); g.strokeStyle = '#c2233a'; g.lineWidth = 8; g.strokeRect(-120, -40, 240, 80); tText(g, 'HIRED', 0, 4, 64, '#c2233a', '"Bungee"', 'center', 400); g.restore();
  g.restore();
}
// the receipt: the top in her hand (header), a strip down behind the bench, along it, and spilling down the front at the left
function receiptTop(g, hx, hy, rot) {
  g.save(); g.translate(hx, hy); g.rotate(rot);
  tShape(g, '#fbfaf2', gg => gg.rect(-30, -78, 60, 80), 2.6);
  tText(g, 'VOID MART', 0, -66, 9, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, 'THANK YOU FOR', 0, -54, 6, TOON.ink); tText(g, 'SHOPPING AT THE', 0, -46, 6, TOON.ink); tText(g, 'END OF THE UNIVERSE', 0, -38, 6, TOON.ink);
  for (let i = 0; i < 4; i++) tLine(g, [-22, -26 + i * 7, 18 - (i % 2) * 10, -26 + i * 7], 1.2);
  g.restore();
}
function receiptStrip(g, hx, hy, dir) {                            // behind the bench front
  const by = LCT - 8;
  g.save(); g.lineCap = 'round';
  const path = gg => { gg.beginPath(); gg.moveTo(hx, hy); gg.quadraticCurveTo(hx - dir * 40, (hy + by) / 2, hx - dir * 90, by); gg.lineTo(70, by); };
  path(g); g.strokeStyle = TOON.ink; g.lineWidth = 30; g.stroke(); path(g); g.strokeStyle = '#fbfaf2'; g.lineWidth = 24; g.stroke();
  g.restore();
}
function receiptCascade(g, k) {                                   // in front of the bench: paper folding down to the floor and a pile
  if (k <= 0) return;
  const top = LCT - 8, bottom = lerp(LCT + 20, 1900, k);
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const path = gg => { gg.beginPath(); gg.moveTo(70, top); let y = top, i = 0; while (y < bottom) { const ny = Math.min(bottom, y + 70); gg.quadraticCurveTo(70 + (i % 2 ? -36 : 36), (y + ny) / 2, 70, ny); y = ny; i++; } };
  path(g); g.strokeStyle = TOON.ink; g.lineWidth = 30; g.stroke(); path(g); g.strokeStyle = '#fbfaf2'; g.lineWidth = 24; g.stroke();
  if (k > .9) for (let i = 0; i < 5; i++) { tShape(g, '#fbfaf2', gg => gg.ellipse(70 + (i - 2) * 26, 1890 - (i % 2) * 18, 44, 16, (i - 2) * .2, 0, 6.2832), 2.6); }
  g.restore();
}
// the microwave and its timer: 0:00 when Cleo presses it, real seconds, then three hours in the montage
function microTime(t) {
  const t0 = V.L2.t + .35; if (t < t0) return null;
  let s = Math.min(t, M0) - t0;
  if (t > M0) s += Math.pow(smooth(M0 + .1, M0 + 3.5, t), 1.6) * (3 * 3600 + 11 * 60 - s);
  s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
}
function drawMicrowave(g, t) {
  const { x, y } = MICRO, ding = t > TL.DING && t < TL.DING + .6;
  tShape(g, '#d9dce6', gg => gg.roundRect(x - 90, y - 118, 180, 118, 10), 3.4);
  tShape(g, ding ? '#fff2b0' : '#2a2f40', gg => gg.roundRect(x - 78, y - 106, 110, 90, 6), 3);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x - 70, y - 70, 30, 46);
  tShape(g, '#9aa0b8', gg => gg.roundRect(x + 38, y - 106, 44, 90, 6), 2.4);
  // the timer readout sits across the top of the door, big enough to read in the wide shots (Cleo's sleeve covers the panel's right edge)
  tShape(g, '#10202a', gg => gg.roundRect(x - 72, y - 100, 98, 26, 4), 2);
  const tm = microTime(t); if (tm) tText(g, tm, x - 23, y - 86.5, tm.length > 5 ? 16 : 19, '#7dff9a', '"Bungee"', 'center', 400);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) tShape(g, '#c7cbd8', gg => gg.roundRect(x + 44 + k * 18, y - 74 + r * 16, 14, 11, 3), 1.6);
}
// the plants: an audience, wilting one by one through the montage; the last flower drops after "Your plants died."
function plantWilt(i, t) {
  if (i < 3) return smooth(M0 + .8 + i * 1.1, M0 + 1.5 + i * 1.1, t);
  return smooth(V.L7.t - .4, V.L7.t + .4, t) * .7 + smooth(TL.DROP, TL.DROP + .3, t) * .3;
}
function drawPlant(g, x, w, t, i) {
  const y = LCT - 2, col = ['#ff5f7e', '#ffd23f', '#b9a6ff', '#ff9a3d'][i];
  tShape(g, '#c96a3d', gg => { gg.moveTo(x - 20, y - 46); gg.lineTo(x + 20, y - 46); gg.lineTo(x + 15, y); gg.lineTo(x - 15, y); gg.closePath(); }, 2.6);
  tShape(g, '#a85530', gg => gg.rect(x - 22, y - 52, 44, 10), 2.4);
  const bend = w * 1.25, stemCol = w > .5 ? '#8a8a4a' : '#3fae6a';
  const tipX = x + Math.sin(bend) * 70, tipY = y - 52 - Math.cos(bend) * 70;
  g.save(); g.lineCap = 'round'; g.strokeStyle = TOON.ink; g.lineWidth = 9; g.beginPath(); g.moveTo(x, y - 52); g.quadraticCurveTo(x, y - 90 + w * 20, tipX, tipY); g.stroke(); g.strokeStyle = stemCol; g.lineWidth = 5; g.stroke(); g.restore();
  for (const s of [-1, 1]) { g.save(); g.translate(x, y - 74 + w * 10); g.rotate(s * (.8 + w * .9)); tShape(g, w > .5 ? '#a7a95c' : '#5fc77a', gg => gg.ellipse(s * 14, 0, 14, 6, 0, 0, 6.2832), 2); g.restore(); }
  const dropped = i === 3 && t > TL.DROP;
  if (!dropped) { g.save(); g.translate(tipX, tipY); g.rotate(bend); for (let k = 0; k < 5; k++) { g.save(); g.rotate(k * 1.2566); tShape(g, w > .6 ? '#b88a6a' : col, gg => gg.ellipse(0, -10, 6, 10, 0, 0, 6.2832), 2); g.restore(); } tEllipse(g, 0, 0, 6, 6, '#ffd23f', 2); g.restore(); }
  else { const k = clamp((t - TL.DROP) / .35); g.save(); g.translate(lerp(tipX, x + 34, k), lerp(tipY, y - 4, k * k)); g.rotate(k * 2); for (let q = 0; q < 5; q++) { g.save(); g.rotate(q * 1.2566); tShape(g, '#b88a6a', gg => gg.ellipse(0, -9, 5, 9, 0, 0, 6.2832), 2); g.restore(); } g.restore(); }
}
function nightWindow(g, k) {
  if (k <= 0) return;
  const Wn = LWIN, x0 = Wn.x - Wn.w / 2, y0 = Wn.y - Wn.h / 2;
  g.save(); g.beginPath(); g.rect(x0, y0, Wn.w, Wn.h); g.clip();
  g.fillStyle = `rgba(16,18,58,${.88 * k})`; g.fillRect(x0, y0, Wn.w, Wn.h);
  if (k > .5) { g.globalAlpha = (k - .5) * 2; tShape(g, '#fff6c8', gg => gg.arc(x0 + 250, y0 + 54, 22, 0, 6.2832), 2.4); g.fillStyle = '#fff'; for (const [sx, sy] of [[40, 30], [120, 60], [190, 26], [300, 90], [80, 100]]) { g.beginPath(); g.arc(x0 + sx, y0 + sy, 2.4, 0, 6.2832); g.fill(); } }
  g.restore();
}
function popcornBag(g, x, y, t) {
  tShape(g, '#fbf7ff', gg => { gg.moveTo(x - 30, y - 60); gg.lineTo(x + 30, y - 60); gg.lineTo(x + 24, y + 10); gg.lineTo(x - 24, y + 10); gg.closePath(); }, 2.6);
  for (const dx of [-18, 0, 18]) tShape(g, '#e23b4a', gg => gg.rect(x + dx - 4, y - 58, 8, 66), 0);
  tShape(g, null, gg => { gg.moveTo(x - 30, y - 60); gg.lineTo(x + 30, y - 60); gg.lineTo(x + 24, y + 10); gg.lineTo(x - 24, y + 10); gg.closePath(); }, 2.6);
  for (let i = 0; i < 6; i++) tShape(g, '#fff6c8', gg => gg.arc(x - 22 + i * 9, y - 64 - (i % 2) * 8, 9, 0, 6.2832), 2);
}
function frizz(g, x, top, s, a) {                                 // Vera's hair after three hours
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.strokeStyle = TOON.ink; g.lineWidth = 4; g.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const ang = Math.PI * (1.05 + i / 13 * .9), r0 = 48 * s / 100, r1 = (64 + (i % 3) * 9) * s / 100; g.beginPath(); g.moveTo(x + Math.cos(ang) * r0, top + Math.sin(ang) * r0); g.lineTo(x + Math.cos(ang) * r1, top + Math.sin(ang) * r1); g.stroke(); }
  g.restore();
}
function drawChalkArm(g, t, i) {
  const t0 = TL.BOARDT + .4, k = clamp((t - t0) / .9);
  if (t < TL.BOARDT + .2 || t > TL.BOARDT + 1.8) return;
  const cx = LBOARD.x - 70, cy = LBOARD.y + 80, rx = 120 + i * 12, ry = 30 + i * 6, a = -2.6 + i * .5 + k * 6.6;
  const enter = ease((t - TL.BOARDT - .2) / .25) * (1 - ease((t - TL.BOARDT - 1.45) / .3));
  const hx = lerp(700, cx + Math.cos(a) * rx, enter), hy = lerp(LBOARD.y + 200, cy + Math.sin(a) * ry, enter);
  tTube(g, [760, LBOARD.y + 260, (760 + hx) / 2 + 40, (LBOARD.y + 260 + hy) / 2 + 30, hx + 18, hy + 14], 24, LAB2.cleo.tee, '#dcd4ee');
  tShape(g, '#fbf7ff', gg => { gg.save(); gg.translate(hx - 4, hy - 4); gg.rotate(-.6); gg.roundRect(-4, -12, 8, 22, 3); gg.restore(); }, 2.4);
  tHand(g, hx + 6, hy + 4, 10, LAB2.cleo.glove, LAB.glowS);
}

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, LABCAM, {
  OPEN: [500, 1080, 1.05, 1.1],
  CLEO_MICRO: [700, CLEOFACE + 150, 1.8, 1.9],
  MICRO_CU: [MICRO.x + 30, MICRO.y - 70, 3.8, 4.2],
  PLANTS_CU: [975, LCT - 70, 3.0, 3.2],
  BOARD_END: [LBOARD.x - 40, LBOARD.y - 5, 2.75, 2.85],
});
function paceCam(t, night) {                                      // follows her, waist-up
  const P = veraPos(t); return [540 + (P.x - 300) * .55, 1000, night ? 1.3 : 1.42, night ? 1.3 : 1.42];
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  const cam = n === 'PACE' || n === 'PACE_NIGHT' ? paceCam(t, n === 'PACE_NIGHT') : CAM[n];
  applyCam(c, cam, n === 'PACE' || n === 'PACE_NIGHT' ? 0 : sk, 0);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, t, 0); nightWindow(c, smooth(M0 + .4, M0 + 3.4, t));
  drawRentCircles(c, n === 'BOARD_END' && t > TL.BOARDT + 1.3 ? 6 : 5, n === 'BOARD_END' && t > TL.BOARDT + .4 && t <= TL.BOARDT + 1.3 ? (t - TL.BOARDT - .4) / .9 : 0);
  if (n === 'BOARD_END') drawChalkArm(c, t, 5);
  flyer(c, FLYER_WALL.x, FLYER_WALL.y, .42);
  drawFridge(c, 0);
  // Vera: standing, or pacing waist-up behind the bench
  const P = veraPos(t), tired = t >= M1 ? 1 : 0;
  let expr = 'scheme';
  if (t >= M1) expr = t < V.L6.t ? 'laugh' : t < V.L7.t ? 'cool' : t < V.L9.t ? 'cool' : 'scheme';
  if (t >= V.L7.t && t < V.L8.t) expr = 'fluster';
  const mouth = mouthFor('VERA', t), blink = blinkAt(0, t);
  let hand = null;
  if (P.moving) {
    const bob = walkBob(P.dist, STEP, 10), sx = P.x;
    c.save(); c.translate(sx, LCT + 6 + bob.dy); c.rotate(bob.rot);
    const reach = { x: 64 + bob.swing * 4, y: -152 + Math.abs(bob.swing) * 4 };          // she reads from the receipt as she walks
    drawVera2(c, 0, 0, VERA.s, { expr: t < M0 ? 'scheme' : 'laugh', turn: .7 * P.dir, mouth, blink, reachR: reach, tube: false });
    c.restore();
    const cs = Math.cos(bob.rot), sn = Math.sin(bob.rot), lx = reach.x * VERA.s / 100, ly = reach.y * VERA.s / 100;
    hand = [sx + lx * cs - ly * sn, LCT + 6 + bob.dy + lx * sn + ly * cs];
  } else {
    const reach = { x: 62, y: -150 };
    drawVera2(c, VERA.x, LCT, VERA.s, { expr, mouth, blink, reachR: reach, tube: false });
    hand = [VERA.x + reach.x * VERA.s / 100, LCT + reach.y * VERA.s / 100];
  }
  if (tired) frizz(c, VERA.x, LCT - 238 * VERA.s / 100, VERA.s, 1);
  if (hand) { receiptStrip(c, hand[0], hand[1] + 10, P.moving ? P.dir : 1); receiptTop(c, hand[0], hand[1] + 14, -.08); }
  // Cleo: presses the microwave; popcorn through the montage
  const press = t > V.L2.t - .2 && t < V.L2.t + .6, popcorn = t > M0 + 1.0;
  const C2 = { expr: 'deadpan', remote: !popcorn, mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look: P.moving ? (P.x - CLEO.x) / 260 : -1 };
  if (press) C2.reachL = { x: -66, y: -40 };
  drawMicrowave(c, t);
  drawCleo2(c, CLEO.x, LCT, CLEO.s, C2);
  if (popcorn) popcornBag(c, CLEO.x, LCT - 64, t);
  c.drawImage(LAB_STATIC.front, 0, LCT);
  PLANTS.forEach((x, i) => drawPlant(c, x, plantWilt(i, t), t, i));
  g2Sign(c);
  receiptCascade(c, smooth(.1, 1.4, t));
  // the torn-off piece
  if (t > TL.RIP && t < TL.RIP + 1.2 && hand) { const k = (t - TL.RIP) / 1.2; c.save(); c.translate(hand[0] + 30 + k * 60, hand[1] - 40 + k * k * 300); c.rotate(k * 6); tShape(c, '#fbfaf2', gg => gg.rect(-8, -6, 16, 12), 2); c.restore(); }
}
function g2Sign(g) { g.save(); g.translate(975, LCT + 46); g.rotate(.03); tShape(g, '#fbfaf2', gg => gg.rect(-70, -18, 140, 36), 2.4); tText(g, 'AUDIENCE', 0, 1, 18, TOON.ink, '"Bungee"', 'center', 400); g.restore(); }

// the hook card (experiment, owner's 4-episode trial): first 2.5 s, top of the frame
function hookCard(g, t) {
  const a = clamp((2.5 - t) / .25); if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  tShape(g, 'rgba(18,10,42,.88)', gg => gg.roundRect(110, 250, 860, 190, 26), 5);
  tText(g, 'SHE WROTE A', 540, 314, 64, '#fbf7ff', '"Bungee"', 'center', 400);
  tText(g, 'VILLAIN SPEECH', 540, 388, 64, '#d8ff7a', '"Bungee"', 'center', 400);
  g.restore();
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); hookCard(OUT, t); }
window.render = render;

// sound cues: footsteps on her pacing beat (slow, then fast in the montage)
const STEPS = (() => { const out = []; let next = STEP; for (let t = TL.PACE0; t < M1; t += 1 / 120) { if (paceDist(t) >= next) { out.push({ type: 'step', t: +t.toFixed(3) }); next += STEP; } } return out; })();
window.EV = [
  { type: 'bed', fx: 'lab_hum', t: 0, t1: DUR + .5, g: -31 },
  { type: 'unroll', t: .1 },
  { type: 'beep', t: V.L2.t + .3 },
  ...STEPS,
  { type: 'ffwd', t: M0 + .1, dur: 5.6 },
  { type: 'tick', t: M0 + 2.2, dur: 1.4 },
  { type: 'munch', t: M0 + 1.2 },
  { type: 'wilt', t: M0 + .8 }, { type: 'wilt', t: M0 + 1.9 }, { type: 'wilt', t: M0 + 3.0 },
  { type: 'whoosh', t: M1 - .05 },
  { type: 'munch', t: V.L6.t + .9 },
  { type: 'wilt', t: V.L7.t - .4 },
  { type: 'flop', t: TL.DROP + .3 },
  { type: 'rip', t: TL.RIP },
  { type: 'ding', t: TL.DING },
  { type: 'chalk', t: TL.BOARDT + .4, dur: .9 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildLab();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
