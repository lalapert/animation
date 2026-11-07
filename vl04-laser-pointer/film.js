// Volt Labs, episode 4: "Laser Pointer". The doomsday laser bought with the rent money is a laser pointer. The landlord runs. Script: channel/scripts/VL04_laser_pointer.md
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Set, cameras, pigeons, cats: channel/brand/labkit.js;
// lip sync, subtitles, shots: channel/brand/vmkit.js; characters: channel/brand/lab.js; the spec scan: channel/brand/inserts.js.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const PIV = { x: RAY.bx, y: RAY.by }, BLEN = 250;                 // the Annihilator's pivot (on the old ray tripod) and barrel length
const LEVER = { x: 446, y: LCT + 6 };                             // the big lever on the bench
const GRIP = { x: 476, y: 944 };                                  // where Vera grabs the cannon to swing it
const FLYER_WALL = { x: 560, y: 470 };                            // Cleo's old flyer, pinned up in episode 3
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));

// ---------------------------------------------------------------- the red dot (world coordinates)
const WX0 = LWIN.x - LWIN.w / 2, WY0 = LWIN.y - LWIN.h / 2, WALK = WY0 + LWIN.h - 12;
const DOTP = { win: [712, 446], chest: [868, 392] };           // the landlord crouches in the right pane (the cloud drifts in the left one)
function dotAt(t) {
  if (t < TL.PEW) return null;
  if (t < V.L5.t) return DOTP.win;
  if (t < TL.KNOCK + .5) { const sh = [Math.sin(t * 31) * 7, Math.cos(t * 23) * 7]; return [DOTP.win[0] + sh[0], DOTP.win[1] + sh[1]]; }   // her hands shake
  if (t < TL.RUN) { const k = smooth(TL.KNOCK + .5, TL.KNOCK + .9, t), j = t < TL.HANDS ? 0 : Math.sin(t * 40) * 1.5;   // the startled swing lands it on his chest
    return [lerp(DOTP.win[0], DOTP.chest[0], k) + j, lerp(DOTP.win[1], DOTP.chest[1], k) - Math.sin(k * Math.PI) * 40]; }
  if (t < V.L8.t - .1) return [DOTP.chest[0] - smooth(TL.RUN, TL.RUN + .5, t) * 60, DOTP.chest[1] + 30];          // left on the empty glass
  return null;
}

// ---------------------------------------------------------------- props
function flyer(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-.03);
  tShape(g, '#f4ecd6', gg => gg.rect(-150, -200, 300, 400), 4);
  tText(g, 'HELP WANTED', 0, -150, 40, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, '(EVIL)', 0, -100, 46, '#c2233a', '"Bungee"', 'center', 400);
  tText(g, 'LAB ASSISTANT', 0, -42, 28, TOON.ink); tText(g, 'NO QUESTIONS', 0, -6, 28, TOON.ink);
  g.save(); g.translate(10, 40); g.rotate(-.25); g.strokeStyle = '#c2233a'; g.lineWidth = 8; g.strokeRect(-120, -40, 240, 80); tText(g, 'HIRED', 0, 4, 64, '#c2233a', '"Bungee"', 'center', 400); g.restore();
  g.restore();
}

// ---------------------------------------------------------------- the landlord: comb-over, thick glasses, cardigan, a big key ring
// o: mood 'angry' | 'scared', mouth, look (0 = at Vera, 1 = down at his chest), hands 0..1 (up), keys (shake phase)
function drawLandlord(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  const skin = '#e9b996', skinS = '#d39c78', card = '#c99a3a', cardS = '#a87d26';
  const hands = o.hands || 0;
  // shoulders: mustard cardigan over a white undershirt
  tShape(g, card, gg => gg.roundRect(-74, 44, 148, 90, 26)); tShade(g, gg => gg.roundRect(-74, 44, 148, 90, 26), cardS, gg => gg.rect(30, 40, 50, 100));
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-18, 44); gg.lineTo(0, 74); gg.lineTo(18, 44); gg.closePath(); }, 2.4);
  for (const by of [80, 104]) tEllipse(g, 8, by, 4, 4, '#6b4a1c', 1.8);
  // head: big, bald on top, three combed-over strands, bushy brows, stubble
  const face = gg => gg.ellipse(0, -2, 50, 54, 0, 0, 6.2832);
  tShape(g, skin, face); tShade(g, face, skinS, gg => gg.ellipse(28, 8, 30, 56, 0, 0, 6.2832));
  g.save(); face(g); g.clip(); g.fillStyle = 'rgba(80,60,60,.18)'; g.fillRect(-50, 18, 100, 40); g.restore();             // stubble
  for (const [x0, x1] of [[-40, 30], [-38, 34], [-36, 36]]) tCurve(g, x0, -30 + (x1 - 30) * .8, -4, -66 + (x1 - 30), x1, -38 + (x1 - 30) * .6, 2.6, '#6b5a4a');
  for (const sx of [-1, 1]) { tShape(g, '#8a7a6a', gg => gg.ellipse(sx * 50, -2, 7, 14, 0, 0, 6.2832), 2.4); }   // side tufts
  // glasses and eyes
  const scared = o.mood === 'scared', lk = o.look || 0;
  for (const sx of [-1, 1]) {
    tEllipse(g, sx * 20, -8, 15, 13, '#f4fbff', 3.2);
    const pr = scared ? 2.4 : 4.2; g.fillStyle = TOON.ink; g.beginPath(); g.arc(sx * 20 - sx * 2 * (1 - lk) - 3 * (1 - lk), -8 + lk * 7, pr, 0, 6.2832); g.fill();
    if (scared) tLine(g, [sx * 30, -30, sx * 10, -26 - 4], 4.2); else tLine(g, [sx * 32, -26, sx * 8, -18], 5.2);       // brows: up and worried, or down and cross
  }
  tLine(g, [-5, -8, 5, -8], 3);
  tShape(g, '#e7a07f', gg => gg.ellipse(2, 10, 9, 7, 0, 0, 6.2832), 2.4);                                         // nose
  const m = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0;
  if (m) talkMouth(g, 0, 30, m, o.mouth.shape, .9); else if (scared) tEllipse(g, 0, 30, 6, 8, '#5a1430', 2.6); else tLine(g, [-14, 30, 14, 28], 3.2);
  if (scared) tShape(g, '#9fe6ff', gg => { gg.moveTo(44, -30); gg.quadraticCurveTo(52, -16, 48, -10); gg.quadraticCurveTo(42, -6, 39, -14); gg.quadraticCurveTo(38, -20, 44, -30); gg.closePath(); }, 2.2);   // sweat
  // arms: the right shakes the key ring, or both go up
  const kx = 78, ky = 40 - hands * 110 + Math.sin((o.keys || 0) * 18) * 6 * (1 - hands);
  tTube(g, [62, 70, 84, 60, kx, ky], 24, card, cardS); tHand(g, kx, ky - 6, 11, skin, skinS);
  if (hands > 0) { tTube(g, [-62, 70, -84, 60, -78, 40 - hands * 110], 24, card); tHand(g, -78, 34 - hands * 110, 11, skin, skinS, true); }
  if (hands < .5) { g.save(); g.translate(kx + 8, ky + 12); g.rotate(Math.sin((o.keys || 0) * 18) * .3); tEllipse(g, 0, 10, 13, 13, null, 3); for (const a of [-.5, 0, .5]) { g.save(); g.rotate(a); tShape(g, '#c9cfdb', gg => gg.roundRect(-3, 18, 6, 22, 2), 2); g.restore(); } g.restore(); }
  else tHand(g, kx, ky - 6, 11, skin, skinS, true);
  g.restore();
}
// his legs on the pavement when he gets up and runs (only the legs show in a basement window)
function drawLegs(g, x, dir, phase) {
  const top = WY0 - 30, foot = WALK;
  for (const s of [-1, 1]) {
    const sw2 = Math.sin(phase + (s > 0 ? Math.PI : 0)) * 26, fx = x + s * 12 + sw2 * dir, fy = foot - Math.max(0, Math.cos(phase + (s > 0 ? Math.PI : 0))) * 14;
    tTube(g, [x + s * 10, top, (x + s * 10 + fx) / 2, (top + fy) / 2, fx, fy - 10], 20, '#6b6f7e', '#55596a');
    tShape(g, '#3a2a20', gg => gg.ellipse(fx + 12 * dir, fy - 4, 19, 8, 0, 0, 6.2832), 3);
  }
}
function drawKeysOnPavement(g) {                                   // the egg: an orange Void Mart key fob
  tEllipse(g, LWIN.x - 40, WALK - 6, 11, 11, null, 3);
  tShape(g, '#c9cfdb', gg => gg.roundRect(LWIN.x - 36, WALK - 10, 24, 6, 2), 2);
  tShape(g, TOON.orange, gg => gg.roundRect(LWIN.x - 68, WALK - 16, 26, 16, 4), 2.4); tText(g, 'VM', LWIN.x - 55, WALK - 8, 9, '#fff', '"Bungee"', 'center', 400);
}
function drawWindowLL(g, t) {
  drawWindow(g, t, 0);
  g.save(); g.beginPath(); g.rect(WX0, WY0, LWIN.w, LWIN.h); g.clip();
  if (t >= TL.KNOCK - .2 && t < TL.RUN + .1) {                    // crouched at the glass
    const up = smooth(TL.KNOCK - .2, TL.KNOCK + .1, t), scared = t >= TL.LOOK;
    drawLandlord(g, LWIN.x + 72, WY0 + 98 + (1 - up) * 180, 90, { mood: scared ? 'scared' : 'angry', mouth: mouthFor('LANDLORD', t), look: t >= TL.LOOK && t < V.L7.t ? 1 : 0, hands: smooth(TL.HANDS, TL.HANDS + .3, t), keys: t < TL.LOOK ? t : 0 });
  }
  if (t >= TL.RUN && t < TL.RUN + 1.8) { const k = smooth(TL.RUN + .25, TL.RUN + 1.5, t), up = smooth(TL.RUN, TL.RUN + .25, t); g.save(); g.translate(0, (1 - up) * 60); drawLegs(g, LWIN.x + 72 - k * 460, -1, k > 0 ? t * 15 : 0); g.restore(); }
  if (t >= TL.RUN + .2) drawKeysOnPavement(g);
  g.restore();
  if (t >= TL.KNOCK - .2 && t < TL.RUN + .1) {                     // glass over him again: tint, glare, mullion
    g.save(); g.globalAlpha = .5; tShape(g, 'rgba(200,235,255,.22)', gg => gg.rect(WX0, WY0, LWIN.w, LWIN.h), 0); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(WX0 + 30, WY0 + 38); g.lineTo(WX0 + 70, WY0 + 8); g.stroke();
    tLine(g, [LWIN.x, WY0, LWIN.x, WY0 + LWIN.h], 4);
  }
}
// Cleo's two-dollar pen laser
function drawPen(g, x, y) {
  g.save(); g.translate(x, y); g.rotate(Math.PI + .18);
  tShape(g, '#c9cfdb', gg => gg.roundRect(-6, -5, 46, 10, 4), 2.4); tShape(g, '#ff3355', gg => gg.rect(38, -5, 6, 10), 2);
  g.restore();
}
// Cleo's arm draws the next rent circle on the board (board close-up): the sleeve comes in from the right edge
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
  OPEN: [540, 990, 1.18, 1.2],
  CANNON: [470, 960, 1.42, 1.5],
  CHARGE: [540, 960, 1.22, 1.3],
  DOT_CU: [DOTP.win[0] + 10, DOTP.win[1] + 30, 3.4, 3.6],
  WINDOW_LL: [LWIN.x - 20, LWIN.y + 50, 2.75, 2.9],
  DOT_CHEST: [DOTP.chest[0] - 10, DOTP.chest[1] - 10, 4.4, 4.7],
  WINDOW_WIDE: [LWIN.x - 120, LWIN.y + 80, 2.1, 2.2],
  BOARD_END: [LBOARD.x - 40, LBOARD.y - 5, 2.75, 2.85],
});

// ---------------------------------------------------------------- the Annihilator, worn on the arm (11/8: no more tripod rays; every invention looks different)
const SHOULDER = () => [VERA.x + 64 * VERA.s / 100, LCT - 120 * VERA.s / 100];
const PED = { x: 548, y: LCT };                                   // the display stand it is unveiled on
function aimAt(t) {                                               // where her gauntlet arm points, or null while it is on the stand / in the pile
  if (t < V.L3.t - .2 || t >= V.L8.t - .1) return null;
  const [sx, sy] = SHOULDER(), d = dotAt(t) || DOTP.win, raise = smooth(V.L3.t - .2, V.L3.t + .4, t);
  let a = Math.atan2(d[1] - sy, d[0] - sx);
  a = lerp(1.2, a, raise);                                          // from hanging down to aiming
  const shake = (t > TL.CHARGE && t < TL.PEW) ? Math.sin(t * 70) * .05 * clamp((t - TL.CHARGE) / (TL.PEW - TL.CHARGE)) : (t > TL.PEW && t < TL.KNOCK ? Math.sin(t * 31) * .02 : 0);
  if (a < -1.6 && a > -3.0) a = -1.6;                              // never across her own face: straight up at most
  a += shake;
  return { a, hx: sx + Math.cos(a) * 150, hy: sy + Math.sin(a) * 150 };
}
function drawGauntlet(g, t, x, y, ang, ch) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const sleeve = gg => gg.roundRect(-78, -30, 110, 60, 14);
  tShape(g, '#2c2a36', sleeve); tShade(g, sleeve, '#1d1b25', gg => gg.rect(-80, 10, 120, 30));
  for (const xx of [-62, -40]) { g.save(); g.shadowColor = '#ff3344'; g.shadowBlur = 6 + 30 * ch; tShape(g, `rgb(${150 + 100 * ch | 0},30,44)`, gg => gg.roundRect(xx, -34, 10, 68, 4), 2.6); g.restore(); }
  tShape(g, '#3a3546', gg => gg.roundRect(-10, -44, 96, 26, 8), 3);                 // the barrel on top
  tShape(g, '#3a3546', gg => { gg.moveTo(80, -48); gg.lineTo(104, -54); gg.lineTo(104, -8); gg.lineTo(80, -14); gg.closePath(); }, 3);
  g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 12 + 60 * ch; tShape(g, `rgb(${200 + 55 * ch | 0},${40 + 60 * ch | 0},60)`, gg => gg.ellipse(108, -31, 7, 22, 0, 0, 6.2832), 3); g.restore();
  tShape(g, '#fbf7ff', gg => { gg.arc(-14, 2, 9, Math.PI, 0); gg.lineTo(-7, 9); gg.lineTo(-21, 9); gg.closePath(); }, 2);   // skull sticker
  g.fillStyle = TOON.ink; g.beginPath(); g.arc(-17, 2, 2.2, 0, 6.2832); g.arc(-11, 2, 2.2, 0, 6.2832); g.fill();
  g.restore();
}
function drawPedestal(g, t, sheet, onIt) {
  tShape(g, '#5b4636', gg => gg.roundRect(PED.x - 70, PED.y - 70, 140, 70, 8), 3.4);
  tShape(g, '#b3263c', gg => gg.roundRect(PED.x - 60, PED.y - 86, 120, 22, 10), 3);   // velvet cushion
  g.save(); g.translate(PED.x, PED.y - 76); g.rotate(-.04); tShape(g, '#fff6c8', gg => gg.rect(-74, 74, 148, 26), 2.4); tText(g, 'THE ANNIHILATOR', 0, 87, 13, TOON.ink, '"Bungee"', 'center', 400); g.restore();
  if (onIt) drawGauntlet(g, t, PED.x - 10, PED.y - 112, -.05, 0);
  if (sheet < 1) {
    const k = ease(sheet);
    g.save(); g.translate(PED.x + k * 120, PED.y - 140 - k * 900); g.rotate(-k * .7);
    const sp = gg => { gg.moveTo(-110, 70); gg.quadraticCurveTo(-120, -40, -40, -90); gg.quadraticCurveTo(0, -120, 50, -90); gg.quadraticCurveTo(130, -40, 120, 70); gg.quadraticCurveTo(60, 58, 0, 74); gg.quadraticCurveTo(-60, 58, -110, 70); gg.closePath(); };
    tShape(g, '#e9e4f4', sp); tShade(g, sp, '#cfc8e0', gg => gg.rect(40, -130, 120, 220));
    g.restore();
  }
}

// ---------------------------------------------------------------- character states
function veraState(t, n) {
  let expr = 'cool', point = 0, cheer = false, reachR = null, blink = blinkAt(0, t);
  if (t < V.L1.t - .1) { const k = ease(clamp(t / .45)); reachR = { x: lerp(80, 100, k), y: lerp(-120, -200, k) }; expr = 'scheme'; }
  else if (t < TL.HUD1) { cheer = true; expr = 'scheme'; }
  else if (t < V.L3.t - .2) expr = 'cool';
  else if (t < TL.PEW + .5) expr = t < TL.CHARGE ? 'scheme' : 'laugh';
  else if (t < V.L8.t - .1) expr = 'fluster';
  else if (t < TL.PEN) { cheer = true; expr = 'laugh'; }
  else { expr = 'fluster'; cheer = t >= V.L11.t - .15; }
  const A = aimAt(t);
  if (A) reachR = { x: (A.hx - VERA.x) / VERA.s * 100, y: (A.hy - LCT) / VERA.s * 100 };
  return { expr, point, cheer, reachR, mouth: mouthFor('VERA', t), blink };
}
function cleoState(t, n) {
  let reachL = null;
  if (t >= TL.PEN) { const k = smooth(TL.PEN, TL.PEN + .35, t); reachL = { x: lerp(-30, -96, k), y: lerp(-40, -150, k) }; }
  return { expr: 'deadpan', remote: true, reachL, mouth: mouthFor('CLEO', t), blink: blinkAt(1, t) };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  if (n === 'HUD') { hudScan(c, t - TL.HUD0, HUDSPEC); return; }
  const chg = n === 'CHARGE' && t < TL.PEW ? clamp((t - TL.CHARGE) / (TL.PEW - TL.CHARGE)) : 0;
  const jump = t > TL.KNOCK && t < TL.KNOCK + .6 ? Math.sin((t - TL.KNOCK) / .6 * Math.PI) * 60 : 0;          // Vera jumps at the knock
  const shake = chg > 0 ? Math.sin(t * 90) * 14 * chg * chg : 0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, shake);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindowLL(c, t);
  drawRentCircles(c, n === 'BOARD_END' && t > TL.BOARDT + 1.3 ? 5 : 4, n === 'BOARD_END' && t > TL.BOARDT + .4 && t <= TL.BOARDT + 1.3 ? (t - TL.BOARDT - .4) / .9 : 0);
  if (n === 'BOARD_END') drawChalkArm(c, t, 4);
  flyer(c, FLYER_WALL.x, FLYER_WALL.y, .42);
  drawFridge(c, 0);
  drawPedestal(c, t, clamp(t / .5), t < V.L3.t - .2);
  const bobV = Math.sin(t * 2.1) * 2 - jump, bobC = Math.sin(t * 1.7 + 1) * 1.5;
  drawVera2(c, VERA.x, LCT + bobV, VERA.s, veraState(t, n));
  const C2 = cleoState(t, n);
  drawCleo2(c, CLEO.x, LCT + bobC, CLEO.s, C2);
  if (C2.reachL) drawPen(c, CLEO.x + C2.reachL.x * CLEO.s / 100, LCT + bobC + C2.reachL.y * CLEO.s / 100);
  const A = aimAt(t);
  if (A) drawGauntlet(c, t, A.hx, A.hy + bobV + (A ? 0 : 0), A.a, chg > 0 ? chg : (t >= TL.PEW && t < TL.PEW + .2 ? 1 : 0));
  c.drawImage(LAB_STATIC.front, 0, LCT);
  const d = dotAt(t); if (d && n !== 'BOARD_END') drawLaserDot(c, d[0], d[1], n === 'DOT_CU' || n === 'DOT_CHEST' ? 6 : 7);
  if (t >= TL.PEN + .3 && n !== 'BOARD_END') drawLaserDot(c, VERA.x + 6, LCT + bobV - 150 * VERA.s / 100, 7);     // Cleo's dot on Vera's chest
  if (chg > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(10,4,20,${.42 * chg})`; c.fillRect(0, 0, W, H); }
  if (t >= TL.PEW && t < TL.PEW + .12) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(255,40,60,.25)'; c.fillRect(0, 0, W, H); }
}
// the hologram spec scan of the Annihilator (inserts.js)
function annihilatorModel() {
  const lines = [], faces = [], N = 14, R = .42;
  const ring2 = (x, r, oy, out) => { for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; out.push([x, r + Math.cos(a0) * oy * 2.2, Math.sin(a0) * r, x, r + Math.cos(a1) * oy * 2.2, Math.sin(a1) * r]); } };
  const ring = (x, r, out) => { for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; out.push([x, Math.cos(a0) * r, Math.sin(a0) * r, x, Math.cos(a1) * r, Math.sin(a1) * r]); } };
  for (let x = -1.3; x <= 1.31; x += .325) ring(x, R, lines);
  for (let i = 0; i < N; i += 2) { const a = i / N * 6.2832; lines.push([-1.3, Math.cos(a) * R, Math.sin(a) * R, 1.3, Math.cos(a) * R, Math.sin(a) * R]); }
  for (const x of [-.6, -.3, 0, .3]) ring(x, .52, lines);
  ring(1.62, .62, lines);
  for (let i = 0; i < N; i += 2) { const a = i / N * 6.2832; lines.push([1.3, Math.cos(a) * R, Math.sin(a) * R, 1.62, Math.cos(a) * .62, Math.sin(a) * .62]); }
  ring(1.6, .3, lines);
  // the sleeve it straps onto (under the barrel), with two straps
  for (let x = -1.3; x <= .21; x += .3) ring2(x, .62, .2, lines);
  for (let i = 0; i < N; i += 2) { const a = i / N * 6.2832; lines.push([-1.3, .62 + Math.cos(a) * .2 * 2.2, Math.sin(a) * .62, .2, .62 + Math.cos(a) * .2 * 2.2, Math.sin(a) * .62]); }
  for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; faces.push([[-1.3, Math.cos(a0) * R, Math.sin(a0) * R], [-1.3, Math.cos(a1) * R, Math.sin(a1) * R], [1.3, Math.cos(a1) * R, Math.sin(a1) * R], [1.3, Math.cos(a0) * R, Math.sin(a0) * R]]); }
  return { lines, faces };
}
const ANN = annihilatorModel();
const HUDSPEC = { code: 'VOLT LABS // SPEC SCAN', title: 'ANNIHILATOR', sub: 'WRIST-MOUNTED DOOM LASER  /  MK-1', model: () => ANN, solidT: 2.1, lockT: .7, verdictT: 2.25, yaw0: 2.3, pitch: .5,
  parts: [{ label: 'OUTPUT', value: '1,000,000,000 W', p: [1.62, 0, 0], side: 1 }, { label: 'TARGET', value: 'PLANET EARTH', p: [-.3, -.52, 0], side: -1 }, { label: 'PAID WITH', value: 'RENT MONEY', p: [-.6, 1.05, 0], side: 1 }],
  verdict: 'READY TO RULE EARTH' };

// the hook card (experiment, owner's 4-episode trial): first 2.5 s, top of the frame, inside the safe zone
function hookCard(g, t) {
  const a = clamp((t + .01) / .12) * clamp((2.5 - t) / .25); if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  tShape(g, 'rgba(18,10,42,.88)', gg => gg.roundRect(110, 250, 860, 190, 26), 5);
  tText(g, 'SHE SPENT THE RENT', 540, 314, 64, '#fbf7ff', '"Bungee"', 'center', 400);
  tText(g, 'ON THIS', 540, 388, 64, '#d8ff7a', '"Bungee"', 'center', 400);
  g.restore();
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  hookCard(OUT, t);
}
window.render = render;

window.EV = [
  { type: 'bed', fx: 'lab_hum', t: 0, t1: DUR + .5, g: -31 },
  { type: 'sheet', t: .02 },
  { type: 'scan', t: TL.HUD0 + .05 },
  { type: 'lever', t: V.L3.t + .3 },
  { type: 'charge', t: TL.CHARGE, dur: TL.PEW - TL.CHARGE + .02 },
  { type: 'pew', t: TL.PEW },
  { type: 'knock', t: TL.KNOCK },
  { type: 'whoosh', t: TL.KNOCK + .5 },
  { type: 'keys', t: V.L6.t + .2 },
  { type: 'gulp', t: TL.LOOK + .3 },
  { type: 'run', t: TL.RUN, dur: 1.4 },
  { type: 'keys', t: TL.RUN + .2 },
  { type: 'click', t: TL.PEN + .3 },
  { type: 'chalk', t: TL.BOARDT + .4, dur: .9 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    await insFonts('../channel/brand/fonts/');
    buildLab();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
