// Volt Labs, episode 10: "The Reverse Oven". Vera's Thanksgiving turkey is burnt. Her reverse oven runs time backwards on
// whatever is inside: the turkey un-burns (golden!), then keeps going: raw, the grocery bag, the receipt, the cash ($38.47).
// "It turned dinner back into money." Everything goes in for rent, until Cleo puts in the alarm clock: the whole episode rewinds
// to its first frame, which plays again (with one dollar in Cleo's apron pocket). Script: channel/scripts/VL10_the_reverse_oven.md
// Lab set, cameras, window, fridge: channel/brand/labkit.js; lip sync, subtitles, shots, end card: channel/brand/vmkit.js; Vera and
// Cleo: channel/brand/lab.js; walk bob: channel/brand/travel.js. The oven, the turkey and what it turns into, the alarm clock, the
// rewind and the PAY RENT spiral are drawn here.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 190, K9 = S / 100, VX = TL.VX, CX = TL.CX;
const VX_OVEN = 420;                                                // where Vera stands to work the oven (from "Then we un-cook it.")
const VFACE = LCT - 222 * K9, CFACE = LCT - 200 * K9;
const OV = { x0: 500, x1: 800, y0: LCT - 230, y1: LCT, px1: 588, wx0: 600, wx1: 788, wy0: LCT - 170, wy1: LCT - 32 };
const DIAL = { x: 544, y: LCT - 92, r: 30 }, DISP = { x: 544, y: LCT - 160 };
const INX = (OV.wx0 + OV.wx1) / 2, INY = LCT - 58;                  // inside the oven: the rack
const TRAY0 = { x: 400, y: LCT - 8 };                                // the turkey tray on the bench, in front of Vera (frame 1)
const CLOCK0 = { x: 832, y: LCT - 2 };                               // the alarm clock on the bench, at Cleo's left
const CHIN_V = LCT - 180 * K9;                                       // Vera's chin (smoke never rises past it near her face)

// ---------------------------------------------------------------- story time: the rewind runs the episode backwards to frame 1,
// then frame 1 plays again (the loop). Everything is drawn from the story time s; subtitles and the end card use the real time.
function storyTime(t) {
  if (t >= TL.REW0 && t < TL.REW1) { const u = (t - TL.REW0) / TL.REW_LEN; return { s: TL.REW0 * (1 - (.5 - .5 * Math.cos(Math.PI * u))), rew: true, loop: false }; }
  if (t >= TL.REW1 && t < TL.BOARDT) return { s: t - TL.REW1, rew: false, loop: true };
  return { s: t, rew: false, loop: false };
}

// ---------------------------------------------------------------- the turkey, and what it turns into
function drawTray(g, x, y, k = 1) {
  g.save(); g.translate(x, y); g.scale(k, k);
  tShape(g, '#5b6170', gg => { gg.moveTo(-74, -20); gg.lineTo(74, -20); gg.lineTo(64, 0); gg.lineTo(-64, 0); gg.closePath(); }, 3.4);
  tShape(g, '#7a8090', gg => gg.roundRect(-82, -26, 164, 9, 4), 3);
  g.restore();
}
// kind 'burnt' | 'golden' | 'raw'; (x, y) = the bottom of the bird; crumbled: the left drumstick has broken off into ash
function drawTurkey(g, x, y, k, kind, crumbled) {
  const C = { burnt: ['#2a201d', '#4a3a33', '#17110f'], golden: ['#d98b3a', '#f0b25e', '#a8602a'], raw: ['#f3c6b5', '#fbdcd0', '#d99c8a'] }[kind];
  g.save(); g.translate(x, y); g.scale(k, k);
  const leg = (sx) => {
    tTube(g, [sx * 34, -40, sx * 52, -66, sx * 58, -82], 22, C[0]);
    tShape(g, kind === 'burnt' ? '#3a2e2a' : '#fbf3e4', gg => gg.ellipse(sx * 61, -88, 9, 8, 0, 0, 6.2832), 2.6);   // the bone end
  };
  if (!crumbled) leg(-1); leg(1);
  const body = gg => gg.ellipse(0, -34, 66, 38, 0, 0, 6.2832);
  tShape(g, C[0], body, 3.6);
  tShade(g, body, C[2], gg => gg.ellipse(14, -10, 70, 22, 0, 0, 6.2832));
  g.fillStyle = C[1]; g.beginPath(); g.ellipse(-18, -52, 22, 9, -.25, 0, 6.2832); g.fill();   // the highlight
  if (kind === 'burnt') { g.save(); g.shadowColor = '#ff7a1a'; g.shadowBlur = 8; g.strokeStyle = '#ff8a2a'; g.lineWidth = 3; for (const [a, b, c2, d] of [[-34, -42, -14, -30], [6, -54, 28, -40], [18, -20, 42, -28], [-16, -18, -2, -12]]) { g.beginPath(); g.moveTo(a, b); g.lineTo((a + c2) / 2 + 4, (b + d) / 2 - 5); g.lineTo(c2, d); g.stroke(); } g.restore(); }
  if (kind === 'raw') { g.fillStyle = '#e7a998'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(-44 + (i * 37) % 90, -52 + (i * 23) % 36, 2.2, 0, 6.2832); g.fill(); } }
  if (crumbled) { g.fillStyle = '#2a201d'; for (const [dx, dy, r] of [[-60, -4, 6], [-48, -2, 4], [-70, -3, 4], [-56, -9, 3]]) { g.beginPath(); g.arc(dx, dy, r, 0, 6.2832); g.fill(); } tShape(g, '#3a2e2a', gg => gg.ellipse(-44, -46, 7, 6, 0, 0, 6.2832), 2.4); }
  g.restore();
}
function drawBag(g, x, y, k) {
  g.save(); g.translate(x, y); g.scale(k, k);
  for (const [dx, col] of [[-16, '#7fcf4a'], [-4, '#9ade5f'], [10, '#6fbf3a']]) tShape(g, col, gg => { gg.moveTo(dx, -96); gg.quadraticCurveTo(dx - 10, -126, dx + 2, -134); gg.quadraticCurveTo(dx + 12, -118, dx + 6, -96); gg.closePath(); }, 2.4);   // celery
  tShape(g, '#c99a5e', gg => { gg.moveTo(-44, 0); gg.lineTo(-40, -98); gg.lineTo(40, -98); gg.lineTo(44, 0); gg.closePath(); }, 3.4);
  tShade(g, gg => { gg.moveTo(-44, 0); gg.lineTo(-40, -98); gg.lineTo(40, -98); gg.lineTo(44, 0); gg.closePath(); }, '#b0844c', gg => gg.rect(20, -100, 30, 100));
  for (let i = 0; i < 6; i++) tLine(g, [-40 + i * 16, -98, -32 + i * 16, -90, -24 + i * 16, -98], 2);   // the folded rim
  tText(g, 'GROCERY', 0, -46, 12, '#6b4a26', '"Bungee"', 'center', 400);
  g.restore();
}
function drawReceipt(g, x, y, k) {
  g.save(); g.translate(x, y); g.scale(k, k);
  tShape(g, '#fbfaf2', gg => { gg.moveTo(-34, 0); gg.lineTo(-34, -118); gg.quadraticCurveTo(-34, -132, -20, -132); gg.lineTo(34, -132); gg.lineTo(34, -6); gg.quadraticCurveTo(46, -2, 40, 6); gg.quadraticCurveTo(10, 10, -34, 0); gg.closePath(); }, 3);
  for (let i = 0; i < 5; i++) tLine(g, [-24, -118 + i * 14, 8 - (i % 2) * 10, -118 + i * 14], 2);
  tText(g, 'TOTAL', -6, -40, 11, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, '$38.47', 0, -22, 15, '#c2233a', '"Bungee"', 'center', 400);
  g.restore();
}
function drawCash(g, x, y, k, n = 3) {
  g.save(); g.translate(x, y); g.scale(k, k);
  for (let i = 0; i < n; i++) {
    g.save(); g.translate(-18 + i * 18, -8 - i * 3); g.rotate(-.35 + i * .3);
    tShape(g, i % 2 ? '#8fc47a' : '#7db86a', gg => gg.roundRect(-34, -16, 68, 32, 3), 2.6);
    g.strokeStyle = '#4f7a42'; g.lineWidth = 2; g.strokeRect(-28, -11, 56, 22);
    tText(g, '$', 0, 1, 18, '#3c6a32', '"Bungee"', 'center', 400); g.restore();
  }
  for (const [cx2, cy2] of [[30, -2], [42, -6]]) tEllipse(g, cx2, cy2, 9, 4, '#e6c25a', 2);
  g.restore();
}
function drawGauntlet(g, x, y, k) {                                   // episode 4's laser gauntlet, now a shelf prop
  g.save(); g.translate(x, y); g.scale(k, k);
  tShape(g, '#c83a4a', gg => gg.roundRect(-44, -30, 70, 34, 10), 3.4);
  tShape(g, '#5d6474', gg => gg.roundRect(20, -24, 26, 22, 5), 3);
  g.save(); g.shadowColor = '#ff3355'; g.shadowBlur = 10; tEllipse(g, 48, -13, 7, 7, '#ff6677', 2.4); g.restore();
  tShape(g, '#3a3f4c', gg => gg.roundRect(-36, -38, 30, 10, 4), 2.4);
  g.restore();
}
function drawAlarmClock(g, x, y, k, tick = 0) {                     // a twin-bell wind-up alarm clock; (x, y) = its feet
  g.save(); g.translate(x, y); g.scale(k, k);
  for (const sx of [-1, 1]) { tLine(g, [sx * 14, -10, sx * 22, 0], 4); tShape(g, '#d6d9e2', gg => gg.arc(sx * 20, -64, 12, Math.PI, 0), 3); }
  tLine(g, [0, -72, 0, -66], 4);
  tEllipse(g, 0, -38, 30, 30, '#e04a5a', 3.4);
  tEllipse(g, 0, -38, 22, 22, '#fbf7ff', 2.6);
  const a = tick * Math.PI / 30;
  g.strokeStyle = TOON.ink; g.lineCap = 'round'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(0, -38); g.lineTo(9, -42); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.moveTo(0, -38); g.lineTo(Math.sin(a) * 17, -38 - Math.cos(a) * 17); g.stroke();
  g.restore();
}
function drawFork(g, x, y) {                                          // the meat fork in Vera's hand, tines down into the turkey
  tLine(g, [x, y, x + 10, y + 70], 5);
  for (const dx of [-5, 5]) tLine(g, [x + 10 + dx, y + 70, x + 12 + dx, y + 96], 3.2);
  tShape(g, '#6b4a2a', gg => gg.roundRect(x - 6, y - 26, 12, 30, 4), 2.6);
}
function smokePuffs(g, x, y, s, inward, k0 = 1) {                     // smoke wisps: opaque curls that rise, sway and shorten (no fading)
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    let k = ((s * .5 + i / 3) % 1); if (inward) k = 1 - k;             // reversed: they sink back down into the turkey
    const len = 120 * Math.sin(Math.PI * k) * k0, bx = x + 10 + i * 22, by = y - 30 - k * 120 * k0;
    if (len < 8) continue;
    const pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push([bx + Math.sin(u * 5 + s * 3 + i * 2) * 14 + u * 30, by - u * len]); }
    for (const [w, col] of [[11, TOON.ink], [6, '#c9c2d3']]) { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); }
  }
  g.restore();
}

// ---------------------------------------------------------------- the reverse oven
function inRange(s, a, b) { return s >= a && s < b; }
function doorAt(s) {                                                   // 0 shut .. 1 open (hinged at the bottom)
  const ev = [[TL.OPEN1, 1], [TL.SHUT1, 0], [TL.POP, 1], [TL.SHUT2, 0], [TL.POP2, 1], [TL.C_SHUT, 0]];
  let v = 0, last = -9, from = 0;
  for (const [t0, to] of ev) { if (s < t0) break; from = v; v = to; last = t0; }
  const dt = to => to ? .14 : .12;
  return lerp(from, v, clamp((s - last) / dt(v)));
}
function ovenMode(s) {                                                 // 'off' | 'rev'
  return inRange(s, TL.REV0, TL.POP) || inRange(s, TL.DIAL2, TL.POP2) || s >= TL.C_DIAL ? 'rev' : 'off';
}
function dialAngle(s) {                                                // turned to REVERSE at each DIAL, back to OFF at each POP
  const turns = [[TL.DIAL - .1, 1], [TL.POP, 0], [TL.DIAL2 - .1, 1], [TL.POP2, 0], [TL.C_DIAL - .1, 1]];
  let v = 0, last = -9, from = 0;
  for (const [t0, to] of turns) { if (s < t0) break; from = v; v = to; last = t0; }
  return lerp(-.2, -2.2, lerp(from, v, clamp((s - last) / .15)));
}
const PULSES = () => [TL.G1, TL.RAW, TL.BAG, TL.RECEIPT, TL.CASH, TL.CASH2];
function insideAt(s) {                                                 // what is on the rack
  if (s < TL.IN1) return null;
  if (s < TL.G1) return 'burnt';
  if (s < TL.RAW) return 'golden';
  if (s < TL.BAG) return 'raw';
  if (s < TL.RECEIPT) return 'bag';
  if (s < TL.CASH) return 'receipt';
  if (s < TL.POP + .25) return 'cash';
  if (s < TL.IN2) return null;
  if (s < TL.CASH2) return 'gauntlet';
  if (s < TL.POP2 + .2) return 'cash2';
  if (s < TL.C_IN) return null;
  return 'clock';
}
function dateAt(s) {                                                   // the display: the date running backwards while it reverses
  const days = ['NOV 25', 'NOV 24', 'NOV 23', 'NOV 22', 'NOV 21', 'NOV 20', 'NOV 19', 'NOV 18'];
  if (s < TL.REV0) return days[0];
  if (s < TL.POP) return days[Math.min(7, Math.floor((s - TL.REV0) * 1.1))];
  if (s < TL.DIAL2) return days[7];
  if (s < TL.POP2) return 'OCT 30';
  if (s < TL.C_DIAL) return 'OCT 30';
  return ['NOV 25', '9:41 PM', '7:02 PM', 'NOV 24'][Math.floor((s - TL.C_DIAL) * 6) % 4];
}
function drawInside(g, s) {
  const it = insideAt(s); if (!it) return;
  const k = .78;
  if (['burnt', 'golden', 'raw'].includes(it)) { drawTray(g, INX, INY + 6, k); drawTurkey(g, INX, INY - 12, k, it, it === 'burnt'); if (it === 'burnt' && s >= TL.REV0) smokePuffs(g, INX - 40, INY - 4, s, true, .7); }
  else if (it === 'bag') drawBag(g, INX, INY + 4, .9);
  else if (it === 'receipt') drawReceipt(g, INX, INY + 4, .95);
  else if (it === 'cash' || it === 'cash2') drawCash(g, INX, INY - 4, 1.05, it === 'cash' ? 3 : 5);
  else if (it === 'gauntlet') drawGauntlet(g, INX, INY - 2, 1.1);
  else if (it === 'clock') drawAlarmClock(g, INX, INY + 6, 1.0, s * 2);
}
function drawOven(g, s) {
  const { x0, x1, y0, y1, px1, wx0, wx1, wy0, wy1 } = OV, mode = ovenMode(s), dr = doorAt(s);
  // body
  tShape(g, '#efe6cf', gg => gg.roundRect(x0, y0, x1 - x0, y1 - y0, 14), 4);
  tShade(g, gg => gg.roundRect(x0, y0, x1 - x0, y1 - y0, 14), '#d9cdb0', gg => gg.rect(x1 - 40, y0, 50, y1 - y0));
  tShape(g, '#2f3a44', gg => gg.roundRect(x0 + 8, y0 + 6, x1 - x0 - 16, 24, 6), 3);
  tText(g, 'REVERSE OVEN', (x0 + x1) / 2, y0 + 19, 17, LAB.glow, '"Bungee"', 'center', 400);
  // control panel: the date display and the big dial (COOK right, REVERSE left)
  tShape(g, '#0e1a12', gg => gg.roundRect(DISP.x - 38, DISP.y - 15, 76, 30, 5), 2.6);
  const blue = mode === 'rev';
  g.save(); if (blue) { g.shadowColor = '#7ad7ff'; g.shadowBlur = 10; }
  tText(g, dateAt(s), DISP.x, DISP.y + 2, 15, blue ? '#9be6ff' : '#7dff9a', '"Bungee"', 'center', 400); g.restore();
  tShape(g, '#c9cfdb', gg => gg.arc(DIAL.x, DIAL.y, DIAL.r, 0, 6.2832), 3.4);
  const a = dialAngle(s); tLine(g, [DIAL.x, DIAL.y, DIAL.x + Math.cos(a) * (DIAL.r - 6), DIAL.y + Math.sin(a) * (DIAL.r - 6)], 6);
  for (const [dx, dir, col] of [[-26, -1, '#4fc3ff'], [-15, -1, '#4fc3ff']]) tShape(g, col, gg => { gg.moveTo(DIAL.x + dx + dir * 6, DIAL.y - DIAL.r - 12); gg.lineTo(DIAL.x + dx - dir * 6, DIAL.y - DIAL.r - 19); gg.lineTo(DIAL.x + dx - dir * 6, DIAL.y - DIAL.r - 5); gg.closePath(); }, 1.6);   // <<
  tShape(g, '#ff9a3a', gg => { gg.moveTo(DIAL.x + 26, DIAL.y - DIAL.r - 12); gg.lineTo(DIAL.x + 16, DIAL.y - DIAL.r - 19); gg.lineTo(DIAL.x + 16, DIAL.y - DIAL.r - 5); gg.closePath(); }, 1.6);       // >
  tText(g, 'REVERSE', DIAL.x, DIAL.y + DIAL.r + 16, 10, '#2f3a44', '"Bungee"', 'center', 400);
  // the cavity (seen through the glass, or with the door down)
  g.save(); g.beginPath(); g.roundRect(wx0, wy0, wx1 - wx0, wy1 - wy0, 8); g.clip();
  const lit = mode === 'rev' ? '#163a5a' : '#2a2124';
  g.fillStyle = lit; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  if (mode === 'rev') { const gr = g.createRadialGradient(INX, INY - 40, 10, INX, INY - 40, 120); gr.addColorStop(0, 'rgba(120,210,255,.55)'); gr.addColorStop(1, 'rgba(120,210,255,0)'); g.fillStyle = gr; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0); }
  tLine(g, [wx0, INY + 8, wx1, INY + 8], 3); for (let x = wx0 + 14; x < wx1; x += 22) tLine(g, [x, INY + 4, x, INY + 12], 2);   // the rack
  drawInside(g, s);
  // a stage change: the glass flashes the reverse blue for two frames (light, then the new thing is simply there)
  if (PULSES().some(p => s >= p - .02 && s < p + .035)) { g.fillStyle = 'rgba(190,240,255,.85)'; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0); }
  if (dr < .5) { g.fillStyle = mode === 'rev' ? 'rgba(150,220,255,.12)' : 'rgba(255,255,255,.08)'; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(wx0 + 20, wy0 + 40); g.lineTo(wx0 + 56, wy0 + 12); g.stroke(); }
  g.restore();
  // the door frame (shut) or the door lying open below the cavity (hinged at the bottom)
  if (dr < .5) { g.lineWidth = 8; g.strokeStyle = '#2f3a44'; g.beginPath(); g.roundRect(wx0 - 4, wy0 - 4, wx1 - wx0 + 8, wy1 - wy0 + 8, 10); g.stroke(); tShape(g, '#c9cfdb', gg => gg.roundRect(wx0 + 30, wy0 - 16, wx1 - wx0 - 60, 9, 4), 2.6); }
  else { tShape(g, '#2f3a44', gg => { gg.moveTo(wx0 - 6, wy1 + 4); gg.lineTo(wx1 + 6, wy1 + 4); gg.lineTo(wx1 + 16, wy1 + 22); gg.lineTo(wx0 - 16, wy1 + 22); gg.closePath(); }, 3); }
  tLine(g, [wx0 - 8, wy1 + 4, wx1 + 8, wy1 + 4], 4);
  for (const fx of [x0 + 20, x1 - 20]) tShape(g, '#3a3f4c', gg => gg.roundRect(fx - 12, y1 - 6, 24, 8, 3), 2);
}

// ---------------------------------------------------------------- Vera
function veraPos(s) {
  const run = (a, b, x0, x1) => { const k = clamp((s - a) / (b - a)); return { x: lerp(x0, x1, k), moving: s > a && s < b, dist: Math.abs(x1 - x0) * k }; };
  if (s < V.L3.t + .1) return { x: VX, moving: false, dist: 0 };
  if (s < V.L3.t + .45) return run(V.L3.t + .1, V.L3.t + .45, VX, VX_OVEN);
  if (s < TL.RUN0) return { x: VX_OVEN, moving: false, dist: 0 };
  if (s < TL.GRAB) return run(TL.RUN0, TL.GRAB, VX_OVEN, TL.VX_GRAB);
  if (s < TL.RUN1) return { x: TL.VX_GRAB, moving: false, dist: 0 };
  if (s < TL.BACK) return run(TL.RUN1, TL.BACK, TL.VX_GRAB, VX_OVEN);
  return { x: VX_OVEN, moving: false, dist: 0 };
}
const GAUNT0 = { x: 170, y: LCT - 4 };                                 // the gauntlet waits on the bench at the far left
const PILE = { x: 470, y: LCT - 4 };                                   // the cash goes on the bench by the oven
function veraState(s) {
  const p = veraPos(s), mouth = mouthFor('VERA', s), loc = (wx, wy) => ({ x: (wx - p.x) / K9, y: (wy - LCT) / K9 });
  let expr = 'fluster', reachR = null, hold = null, fork = false;
  if (s < V.L3.t) {                                                    // frame 1: the fork into the turkey
    const poke = s < .4 ? smooth(.05, .38, s) : 1 - .25 * smooth(.42, .8, s);
    reachR = loc(TRAY0.x + 6, LCT - 150 + 44 * poke); fork = true;
    expr = s < endOf('L1') + .25 ? 'fluster' : 'cool';
  } else if (s < TL.REV0) {                                            // "Then we un-cook it.": the tray slides into the oven, the dial
    expr = 'scheme';
    if (s >= TL.SLIDE0 - .15 && s < TL.IN1 + .1) { const tx = lerp(TRAY0.x, INX, smooth(TL.SLIDE0, TL.IN1, s)); reachR = loc(tx - 70, LCT - 30); }
    else if (s >= TL.DIAL - .3) reachR = loc(DIAL.x - 22, DIAL.y + 4);
  } else if (s < TL.POP) {
    expr = s >= V.L5.t - .2 ? 'fluster' : s >= V.L4.t - .1 ? 'laugh' : 'scheme';
  } else if (s < TL.RUN0) {                                             // takes the cash, holds it up; puts it on the bench
    expr = s < V.L7.t ? 'cool' : 'laugh';
    if (s < TL.POP + .45) { const k = smooth(TL.POP + .05, TL.POP + .25, s) * (1 - smooth(TL.POP + .3, TL.POP + .45, s)); reachR = loc(lerp(VX_OVEN + 40, INX - 10, k), lerp(LCT - 160, INY - 20, k)); hold = s > TL.POP + .25 ? 'cash' : null; }
    else if (s < V.L7.t + .5) { reachR = { x: 8, y: -104 }; hold = 'cash'; }
    else { const k = smooth(V.L7.t + .5, V.L7.t + .8, s); reachR = { x: lerp(8, (PILE.x - p.x) / K9, k), y: lerp(-104, -10, k) }; hold = k < .95 ? 'cash' : null; }
  } else if (s < TL.OPEN2) {                                            // the dash: grab the gauntlet, back to the oven
    expr = 'scheme';
    if (s >= TL.GRAB - .05 && s < TL.RUN1) reachR = loc(GAUNT0.x + 10, LCT - 22);
    if (s >= TL.GRAB + .1) { hold = 'gauntlet'; if (s >= TL.RUN1) reachR = { x: 30, y: -90 }; }
  } else if (s < TL.POP2) {
    expr = 'scheme';
    if (s < TL.IN2) { const k = smooth(TL.OPEN2, TL.IN2, s); reachR = { x: lerp(30, (INX - 40 - p.x) / K9, k), y: lerp(-90, (INY - 20 - LCT) / K9, k) }; hold = 'gauntlet'; }
    else if (s >= TL.DIAL2 - .3 && s < TL.DIAL2 + .2) reachR = loc(DIAL.x - 22, DIAL.y + 4);
  } else {                                                             // the big stack, held up: "Rent! Actual rent!"; then the clock
    expr = s < V.L10.t - .1 ? 'laugh' : 'fluster';
    const k = smooth(TL.POP2 + .05, TL.POP2 + .3, s) * (1 - smooth(TL.POP2 + .3, TL.POP2 + .55, s));
    if (s < TL.POP2 + .55) { reachR = loc(lerp(VX_OVEN + 40, INX - 10, k), lerp(LCT - 160, INY - 20, k)); hold = s > TL.POP2 + .3 ? 'stack' : null; }
    else { reachR = { x: -2, y: -112 + Math.sin(s * 9) * 3 }; hold = 'stack'; }
  }
  return { x: p.x, moving: p.moving, dist: p.dist, o: { expr, mouth, blink: s > .6 && blinkAt(0, s), tube: false, reachR }, hold, fork };   // eyes open on frame 1
}
function drawVeraAll(g, s) {
  const st = veraState(s);
  let dy = 0;
  if (st.moving) { const bob = walkBob(st.dist, 150, 10); dy = -6 * Math.tanh(-bob.dy / 6); }   // the waist never rises above the bench
  drawVera2(g, st.x, LCT + dy, S, st.o);
  if (st.o.reachR) {
    const hx = st.x + st.o.reachR.x * K9, hy = LCT + dy + st.o.reachR.y * K9;
    if (st.fork) drawFork(g, hx - 4, hy - 6);
    if (st.hold === 'cash') drawCash(g, hx - 6, hy - 10, 1.0, 3);                 // in front of her, left of the oven
    if (st.hold === 'stack') drawCash(g, hx - 10, hy - 14, 1.3, 5);
    if (st.hold === 'gauntlet') drawGauntlet(g, hx + 24, hy + 10, 1.0);
    tHand(g, hx, hy, 9.5 * K9, LAB2.vera.skin, LAB2.vera.skinS);         // her hand over what it holds
  }
}

// ---------------------------------------------------------------- Cleo
function cleoPos(s) {
  if (s < TL.C_LEAN) return { x: CX, moving: false, dist: 0 };
  const k = clamp((s - TL.C_LEAN) / .4); return { x: lerp(CX, TL.CX_DIAL, k), moving: k > 0 && k < 1, dist: (CX - TL.CX_DIAL) * k };
}
function clockAt(s) {                                                  // where the alarm clock is: bench | hand (with the hand) | oven
  if (s < TL.C_PICK) return { where: 'bench' };
  if (s < TL.C_IN) return { where: 'hand' };
  return { where: 'oven' };
}
function cleoState(s) {
  const p = cleoPos(s), loc = (wx, wy) => ({ x: (wx - p.x) / K9, y: (wy - LCT) / K9 });
  let reachL = null;
  const cl = clockAt(s);
  if (s >= TL.C_PICK - .3 && s < TL.C_PICK) reachL = loc(CLOCK0.x - 4, LCT - 30);
  else if (cl.where === 'hand') {
    if (s < TL.C_OPEN) { const k = smooth(TL.C_PICK, TL.C_PICK + .3, s); reachL = { x: lerp((CLOCK0.x - 4 - p.x) / K9, -82, k), y: lerp(-16, -128, k) }; }
    else { const k = smooth(TL.C_OPEN, TL.C_IN, s); reachL = { x: lerp(-82, (INX + 30 - p.x) / K9, k), y: lerp(-128, (INY - 30 - LCT) / K9, k) }; }
  } else if (s >= TL.C_DIAL - .35 && s < TL.C_DIAL + .4) reachL = loc(DIAL.x + 18, DIAL.y + 2);
  return { x: p.x, moving: p.moving, dist: p.dist, cl, o: { expr: 'deadpan', mouth: mouthFor('CLEO', s), blink: blinkAt(1, s), look: s >= TL.REV0 && s < TL.C_PICK ? -1.2 : undefined, remote: true, reachL } };
}
function drawCleoAll(g, s, loop) {
  const st = cleoState(s);
  let dy = 0;
  if (st.moving) { const bob = walkBob(st.dist, 150, 8); dy = -5 * Math.tanh(-bob.dy / 5); }
  drawCleo2(g, st.x, LCT + dy, S, st.o);
  if (loop) {                                                          // the loop: one dollar in her apron pocket (she kept it)
    g.save(); g.translate(st.x, LCT + dy); g.scale(K9, K9); g.translate(6, -80); g.rotate(-.35);
    tShape(g, '#8fc47a', gg => gg.roundRect(-16, -9, 32, 18, 2), 2.2); tText(g, '$', 0, 1, 11, '#3c6a32', '"Bungee"', 'center', 400); g.restore();
    g.save(); g.translate(st.x, LCT + dy); g.scale(K9, K9); tShape(g, LAB2.cleo.apronS, gg => gg.rect(-20, -72, 40, 22), 3); g.restore();   // the pocket's front over it
  }
  if (st.cl.where === 'hand' && st.o.reachL) {
    const hx = st.x + st.o.reachL.x * K9, hy = LCT + dy + st.o.reachL.y * K9;
    drawAlarmClock(g, hx + 4, hy + 30, 1.0, s * 2);
    tHand(g, hx, hy, 8.5 * K9, LAB2.cleo.glove, LAB.glowS);
  }
}

// ---------------------------------------------------------------- the PAY RENT spiral (owner 11/16): the circles as one spiral
// that grows outward, so "3. PAY RENT" stays readable inside it; loop i is the (i+1)th circle; k draws the next loop
function spiralPt(th) { const cx = LBOARD.x - 68, cy = LBOARD.y + 80, turns = th / 6.2832; return [cx + Math.cos(th - 2.4) * (114 + 10 * turns), cy + Math.sin(th - 2.4) * (27 + 6 * turns)]; }
function drawRentSpiral(g, n, k = 0) {
  const th1 = 6.2832 * (n + clamp(k));
  g.save(); g.strokeStyle = '#ff8fb1'; g.lineWidth = 4.5; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); for (let th = 0; th <= th1; th += .05) { const [x, y] = spiralPt(th); th ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.restore();
  return spiralPt(th1);
}
function drawChalkArm(g, t, hand) {
  if (t < TL.BOARDT + .15 || t > TL.BOARDT + 2.0) return;
  const enter = ease((t - TL.BOARDT - .15) / .25) * (1 - ease((t - TL.BOARDT - 1.6) / .3));
  const hx = lerp(700, hand[0], enter), hy = lerp(LBOARD.y + 200, hand[1], enter);
  tTube(g, [760, LBOARD.y + 260, (760 + hx) / 2 + 40, (LBOARD.y + 260 + hy) / 2 + 30, hx + 18, hy + 14], 24, LAB2.cleo.tee, '#dcd4ee');
  tShape(g, '#fbf7ff', gg => { gg.save(); gg.translate(hx - 4, hy - 4); gg.rotate(-.6); gg.roundRect(-4, -12, 8, 22, 3); gg.restore(); }, 2.4);
  tHand(g, hx + 6, hy + 4, 10, LAB2.cleo.glove, LAB.glowS);
}

// ---------------------------------------------------------------- cameras: [centre x, centre y, zoom at shot start, zoom at shot end]
const CAM = {
  VERA_OPEN: [440, 1092, 1.92, 1.98],                                 // frame 1: her face big, the burnt turkey, the oven's dial
  CLEO_CU: [CX - 20, CFACE + 80, 2.3, 2.42], VERA_CU: [VX_OVEN + 10, VFACE + 80, 2.3, 2.42],
  VERA_MED: [VX_OVEN + 60, VFACE + 160, 1.6, 1.66], CLEO_MED: [CX - 80, CFACE + 160, 1.6, 1.66],
  TWO: [620, 1010, 1.25, 1.3], WIDE: [540, 990, 1.0, 1.03],
  OVEN_CU: [650, LCT - 110, 3.15, 3.3],
  BOARD_END: [LBOARD.x - 30, LBOARD.y + 20, 2.55, 2.65],                    // the board's lines and the spiral sit under the end card (y > 800)
};

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const st = storyTime(t), s = st.s;
  let shot = shotAt(t);
  if (st.rew) shot = shotAt(s);                                        // the rewind shows the earlier shots, backwards
  const n = shot[0], sk = (st.rew ? s : t) - shot[1];
  const skk = sk / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], skk, 0);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, s, 0);
  if (n === 'BOARD_END') {
    const hand = drawRentSpiral(c, 10, t > TL.BOARDT + .3 ? (t - TL.BOARDT - .3) / .9 : 0);
    drawChalkArm(c, t, hand);
  } else drawRentSpiral(c, 10, 0);
  drawFridge(c, 0);
  const cast = n !== 'BOARD_END' && n !== 'OVEN_CU';
  const showV = cast && !['CLEO_CU', 'CLEO_MED'].includes(n), showC = cast && !['VERA_CU', 'VERA_MED', 'VERA_OPEN'].includes(n);
  if (showC) drawCleoAll(c, s, st.loop);
  if (showV) drawVeraAll(c, s);
  // the bench props
  if (s < TL.SLIDE0) { drawTray(c, TRAY0.x, TRAY0.y, 1.2); drawTurkey(c, TRAY0.x, TRAY0.y - 22, 1.2, 'burnt', s >= .4); }
  else if (s < TL.IN1) { const tx = lerp(TRAY0.x, INX, smooth(TL.SLIDE0, TL.IN1, s)); drawTray(c, tx, TRAY0.y - 30 * smooth(TL.SLIDE0, TL.SLIDE0 + .2, s), 1); drawTurkey(c, tx, TRAY0.y - 18 - 30 * smooth(TL.SLIDE0, TL.SLIDE0 + .2, s), 1, 'burnt', true); }
  if (s < TL.IN1) smokePuffs(c, s < TL.SLIDE0 ? TRAY0.x : lerp(TRAY0.x, INX, smooth(TL.SLIDE0, TL.IN1, s)), TRAY0.y - 50, s, false);
  if (s < TL.GRAB + .1) drawGauntlet(c, GAUNT0.x, GAUNT0.y, 1.0);
  if (s >= V.L7.t + .8) drawCash(c, PILE.x, PILE.y, 1.0, 3);
  if (clockAt(s).where === 'bench') drawAlarmClock(c, CLOCK0.x, CLOCK0.y, 1.0, s * 2);
  drawOven(c, s);
  // an arm reaching into the oven: the same tube the rig drew (lab.js reachR / reachL), drawn again over the oven only where it
  // crosses it, so the arm goes into the cavity in front of the oven's body
  if (showV) {
    const vs = veraState(s), r = vs.o.reachR;
    if (r && vs.x + r.x * K9 > OV.x0 - 10) {
      c.save(); c.beginPath(); c.rect(OV.x0 - 2, 0, W, H); c.clip(); c.translate(vs.x, LCT); c.scale(K9, K9);
      const mx = (90 + r.x) / 2 + 6, my = (-80 + r.y) / 2;
      tTube(c, [64, -120, 90, -80, mx, my, (mx + r.x) / 2, (my + r.y) / 2, r.x + 4, r.y - 4], 23, LAB.coat, LAB.coatS);
      c.restore();
      const hx = vs.x + r.x * K9, hy = LCT + r.y * K9;
      if (vs.hold === 'gauntlet') drawGauntlet(c, hx + 24, hy + 10, 1.0);
      tHand(c, hx, hy, 9.5 * K9, LAB2.vera.skin, LAB2.vera.skinS);
    }
  }
  if (showC) {
    const cs = cleoState(s), r = cs.o.reachL;
    if (r && cs.x + r.x * K9 < OV.x1 + 10) {
      c.save(); c.beginPath(); c.rect(0, 0, OV.x1 + 2, H); c.clip(); c.translate(cs.x, LCT); c.scale(K9, K9);
      const mx = (-76 + r.x) / 2 - 4, my = (-76 + r.y) / 2 + 6;
      tTube(c, [-53, -118, -76, -76, mx, my, (mx + r.x) / 2, (my + r.y) / 2, r.x - 2, r.y - 4], 18, LAB2.cleo.tee);
      c.restore();
      const hx = cs.x + r.x * K9, hy = LCT + r.y * K9;
      if (cs.cl.where === 'hand') drawAlarmClock(c, hx + 4, hy + 30, 1.0, s * 2);
      tHand(c, hx, hy, 8.5 * K9, LAB2.cleo.glove, LAB.glowS);
    }
  }
  c.drawImage(LAB_STATIC.front, 0, LCT);
  if (st.rew) {                                                        // rewinding: the room takes the oven's reverse blue
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(90,170,255,.16)'; c.fillRect(0, 0, W, H);
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
const walkSteps = (t0, x0, x1, kind, sps = 1.9, step = 150) => footfalls(t0, x0, x1, step, sps).map((x, i, a) => ({ type: kind, t: +x.toFixed(3), i, pan: Math.max(-1, Math.min(1, (x0 + (x1 - x0) * (i + 1) / a.length - 540) / 540)) }));
const OPENING = (off) => [                                           // frame 1 (and again after the rewind, from REW1)
  { type: 'crackle', t: off + 0, dur: 1.8, gdb: -2 },                // the burnt turkey still crackling
  { type: 'crumble', t: off + .4 },                                  // the drumstick breaks off
  { type: 'tick', t: off + .2, dur: off ? TL.BOARDT - TL.REW1 - .2 : V.L3.t },   // the alarm clock on the bench, ticking
];
window.EV = [
  ...OPENING(0),
  ...walkSteps(V.L3.t + .1, VX, VX_OVEN, 'step', 2.6, 60),
  { type: 'door_open', t: TL.OPEN1 }, { type: 'slide', t: TL.SLIDE0 + .05 }, { type: 'door_shut', t: TL.SHUT1 },
  { type: 'click', t: TL.DIAL },
  { type: 'oven_rev', t: TL.REV0, dur: TL.POP - TL.REV0 },          // the fan and the element, running backwards
  { type: 'unsizzle', t: TL.REV0 + .1 },                             // the crackle, backwards: the smoke going back in
  ...[TL.G1, TL.RAW, TL.BAG, TL.RECEIPT].map(p => ({ type: 'pulse', t: p })),
  { type: 'roll_up', t: TL.RECEIPT - .55 },                          // the receipt rolling itself back up (unroll, backwards)
  { type: 'cash', t: TL.CASH },
  { type: 'door_pop', t: TL.POP },
  { type: 'cash', t: TL.POP + .25, gdb: -6 },                        // she picks the bills up
  { type: 'cloth', t: V.L7.t + .5, gdb: -3 }, { type: 'cash', t: V.L7.t + .8, gdb: -8 },   // the bills on the bench
  ...walkSteps(TL.RUN0, VX_OVEN, TL.VX_GRAB, 'run', 2.8, 70),
  { type: 'thud', t: TL.GRAB + .05, gdb: -6 },                       // the gauntlet off the bench
  ...walkSteps(TL.RUN1, TL.VX_GRAB, VX_OVEN, 'run', 2.8, 70),
  { type: 'thud', t: TL.IN2 }, { type: 'door_shut', t: TL.SHUT2 }, { type: 'click', t: TL.DIAL2 },
  { type: 'oven_rev', t: TL.DIAL2 + .05, dur: TL.POP2 - TL.DIAL2 - .05 },
  { type: 'pulse', t: TL.CASH2 }, { type: 'cash', t: TL.CASH2 + .02 }, { type: 'door_pop', t: TL.POP2 },
  { type: 'cash', t: TL.POP2 + .3, gdb: -4 },
  { type: 'clock_up', t: TL.C_PICK + .05 },                          // Cleo lifts the ticking clock
  { type: 'tick', t: TL.C_PICK, dur: TL.REW0 - TL.C_PICK, gdb: 2 },
  { type: 'thud', t: TL.C_IN, gdb: -8 }, { type: 'door_shut', t: TL.C_SHUT },
  ...walkSteps(TL.C_LEAN, CX, TL.CX_DIAL, 'step', 2.6, 60),
  { type: 'click', t: TL.C_DIAL },
  { type: 'oven_rev', t: TL.C_DIAL + .05, dur: TL.REW1 - TL.C_DIAL - .05, gdb: 3 },
  ...OPENING(TL.REW1),
  { type: 'chalk', t: TL.BOARDT + .3, dur: .9 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildLab();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
