// Volt Labs, episode 12: "Robo-Cleo". Vera builds a robot to replace Cleo: a boxy robot in Cleo's colours with a deadpan LED face.
// It rings the desk bell eight times a second; told to "press nothing until I say so" it says "Pressing." and switches the lights
// off, then runs up and down the bench pressing the toaster and the fridge's ice dispenser. Cleo: "Robo-Cleo. Do not press your
// off switch." "Pressing." It powers down and falls over. "It's me. But faster." "Double pay." "Double zero is still zero." Her
// finger over the robot's switch: "Triple! Triple zero!" "Deal." Script: channel/scripts/VL12_robo_cleo.md
// Lab set, cameras, window, fridge: channel/brand/labkit.js; lip sync, subtitles, shots, end card: channel/brand/vmkit.js; Vera and
// Cleo: channel/brand/lab.js (unchanged). Robo-Cleo, the bell, the wall switch, the toaster, the ice, the dark and the PAY RENT
// spiral are drawn here.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const spOf = k => V[k].t + CHARS[k][0][1];                          // where a line's speech starts
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 190, K9 = S / 100, VX = TL.VX, CX = TL.CX;
const VFACE = LCT - 222 * K9, CFACE = LCT - 200 * K9;

// ---------------------------------------------------------------- props on the bench and the wall
const BELL = { x: 664, y: LCT };                                     // the desk bell, in front of the robot's right hand
const SW = { x: 694, y: 1084 };                                      // the wall light switch behind the bench
const TOAST = { x: 292, y: LCT };                                    // the toaster, in front of Vera (lever on its left side)
const TLEV = { x: TOAST.x - 60, y: LCT - 46 };
const DISP = { x: 82, y: 1086 };                                     // the ice dispenser on the mini fridge's door
const ICE_OUT = { x: 82, y: 1124 }, ICE_FLOOR = LCT - 6;

function drawBell(g, press = 0) {
  const { x, y } = BELL;
  tShape(g, '#3a3f4c', gg => gg.ellipse(x, y - 7, 36, 9, 0, 0, 6.2832), 3.4);
  const dome = gg => { gg.moveTo(x - 30, y - 11); gg.quadraticCurveTo(x - 30, y - 48, x, y - 48); gg.quadraticCurveTo(x + 30, y - 48, x + 30, y - 11); gg.closePath(); };
  tShape(g, '#d6d9e2', dome, 3.4); tShade(g, dome, '#a9afbf', gg => gg.rect(x + 10, y - 50, 24, 42));
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(x - 13, y - 34, 6, 3, -.5, 0, 6.2832); g.fill();
  const py = y - 58 + 7 * press;
  tLine(g, [x, y - 47, x, py + 4], 4);
  tShape(g, '#c9cfdb', gg => gg.ellipse(x, py, 8, 5, 0, 0, 6.2832), 3);
}
function drawSwitch(g, on) {
  tShape(g, '#efe6cf', gg => gg.roundRect(SW.x - 17, SW.y - 27, 34, 54, 6), 3.4);
  for (const dy of [-19, 19]) { g.fillStyle = '#9c9484'; g.beginPath(); g.arc(SW.x, SW.y + dy, 2.4, 0, 6.2832); g.fill(); }
  tShape(g, '#c9c0aa', gg => gg.roundRect(SW.x - 7, SW.y - 11, 14, 22, 3), 2.4);
  tShape(g, '#fbf7ff', gg => gg.roundRect(SW.x - 5, on ? SW.y - 14 : SW.y - 1, 10, 15, 3), 2.6);
}
function drawToaster(g, lever = 0) {
  const { x, y } = TOAST;
  tLine(g, [TLEV.x + 6, y - 64, TLEV.x + 6, y - 22], 3);                                    // the lever's slot
  const body = gg => gg.roundRect(x - 54, y - 76, 108, 76, 20);
  tShape(g, '#c9cfdb', body, 4); tShade(g, body, '#9aa3b8', gg => gg.rect(x + 22, y - 80, 40, 84));
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.roundRect(x - 40, y - 64, 10, 40, 5); g.fill();
  tShape(g, '#3a3f4c', gg => gg.roundRect(x - 14, y - 26, 28, 9, 4), 2.4);                 // the browning dial
  tShape(g, '#26213a', gg => gg.roundRect(TLEV.x - 8, TLEV.y - 8 + 26 * lever, 20, 12, 4), 3);   // the lever's knob (pushed down)
}
function drawToastSlices(g, t) {                                     // behind the toaster's body: up out of the slots, back down
  const { x, y } = TOAST;
  for (const [i, sx] of [[0, -21], [1, 21]]) {
    let h = 6, rot = 0;
    for (const p of [TL.TOAST1, TL.BOTH]) {
      const u = (t - p - .04 - i * .03) / .62;
      if (u >= 0 && u <= 1) { h = 6 + 130 * 4 * u * (1 - u); rot = (i ? .55 : -.45) * Math.sin(Math.PI * u); }
    }
    g.save(); g.translate(x + sx, y - 72 - h); g.rotate(rot);
    tShape(g, '#e7b86d', gg => gg.roundRect(-16, -20, 32, 38, 9), 6);
    g.strokeStyle = '#a8692e'; g.lineWidth = 4; g.beginPath(); g.roundRect(-16, -20, 32, 38, 9); g.stroke();
    g.restore();
  }
}
function drawDispenser(g, press = 0) {
  tShape(g, '#2f3547', gg => gg.roundRect(DISP.x - 38, DISP.y - 50, 76, 92, 10), 3.4);
  tText(g, 'ICE', DISP.x, DISP.y - 36, 15, '#9be6ff', '"Bungee"', 'center', 400);
  tShape(g, '#8a93ab', gg => gg.roundRect(DISP.x - 18, DISP.y - 20 + 6 * press, 36, 32, 6), 3);
  tShape(g, '#5d6474', gg => gg.roundRect(DISP.x - 9, DISP.y + 24, 18, 12, 3), 2.6);
}
// the ice: cubes thrown out of the dispenser while its paddle is held, bouncing and sliding on the bench top (seeded, simulated)
const ICE = [];
(() => {
  let a = 11; const R = () => (a = a * 16807 % 2147483647) / 2147483647;
  for (const [t0, t1] of [[TL.ICE1 + .06, TL.ICE1 + .95], [TL.BOTH + .06, TL.BOTH + .75]])
    for (let s = t0; s < t1; s += .045) ICE.push({ s, x: ICE_OUT.x + (R() - .5) * 10, vx: 40 + R() * 260, vy: -30 + R() * 80, r: R() * 6.28, w: (R() - .5) * 14 });
})();
function icePos(q, t) {
  let x = q.x, y = ICE_OUT.y, vx = q.vx, vy = q.vy, rot = q.r;
  const dt = 1 / 240;
  for (let u = q.s; u < t; u += dt) {
    vy += 2600 * dt; x += vx * dt; y += vy * dt;
    if (y > ICE_FLOOR) { y = ICE_FLOOR; vy = Math.abs(vy) > 90 ? -vy * .32 : 0; vx *= .62; }
    if (vy === 0 && y >= ICE_FLOOR) vx *= Math.pow(.02, dt);
    if (x > 330) { x = 330; vx = -vx * .3; }                        // the toaster stops them
    rot += q.w * dt * (vy === 0 ? .15 : 1);
  }
  return [x, y, rot];
}
function drawIce(g, t) {
  for (const q of ICE) {
    if (t < q.s) continue;
    const [x, y, rot] = icePos(q, t);
    g.save(); g.translate(x, y - 7); g.rotate(rot);
    tShape(g, '#bfe6ff', gg => gg.roundRect(-10, -10, 20, 20, 5), 3);
    g.fillStyle = '#ffffff'; g.fillRect(-5, -6, 6, 4);
    g.restore();
  }
}

// ---------------------------------------------------------------- Robo-Cleo: a boxy robot in Cleo's colours (lavender head with her
// blunt bangs and bent cowlick as an antenna, white body, black apron panel, lime claw hands, her test-tube clip), a deadpan LED face.
// Drawn here only (the shared rigs are unchanged). (x, y) = between its feet on the bench top; local units, scale RK.
const RK = .95, RLW = 8;
const RC = { head: '#cdbdf2', headS: '#9c86d6', headL: '#f1ebff', body: '#fbf7ff', bodyS: '#dcd4ee', apron: '#26213a', apronS: '#17132a',
  metal: '#5d6474', metalS: '#3a3f4c', joint: '#8a93ab', glove: '#b6ff3b', gloveS: '#6fcf1f', screen: '#151127', led: '#8ffcf0', ledG: '#2fe0d0' };
const SHX = 56, SHY = -160, A1 = 50, A2 = 50, STRIDE = 75;
const CHEST = { x: 0, y: -121 };                                    // the OFF switch on its chest (local)
function armJoint(sx, P) {                                           // elbow for a shoulder at (sx*SHX, SHY) and a hand at P (local)
  const Sx = sx * SHX, Sy = SHY, dx = P.x - Sx, dy = P.y - Sy, d = Math.hypot(dx, dy) || 1;
  if (d >= A1 + A2 - 1) return { x: Sx + dx * A1 / (A1 + A2), y: Sy + dy * A1 / (A1 + A2) };   // a robot arm: it telescopes
  const a = Math.atan2(dy, dx), b = Math.acos(clamp((d * d + A1 * A1 - A2 * A2) / (2 * d * A1), -1, 1));
  const e1 = { x: Sx + A1 * Math.cos(a + b), y: Sy + A1 * Math.sin(a + b) }, e2 = { x: Sx + A1 * Math.cos(a - b), y: Sy + A1 * Math.sin(a - b) };
  return (sx * e1.x + .3 * e1.y > sx * e2.x + .3 * e2.y) ? e1 : e2; // the elbow out and down
}
function drawClaw(g, W, u, open = .4) {                              // a two-finger lime pincer at the wrist W, pointing along u
  const n = { x: -u.y, y: u.x };
  for (const s of [-1, 1]) {
    const b = { x: W.x + u.x * 6 + n.x * s * 5, y: W.y + u.y * 6 + n.y * s * 5 };
    const m = { x: W.x + u.x * 16 + n.x * s * (9 + 6 * open), y: W.y + u.y * 16 + n.y * s * (9 + 6 * open) };
    const e = { x: W.x + u.x * 26 + n.x * s * (4 + 5 * open), y: W.y + u.y * 26 + n.y * s * (4 + 5 * open) };
    tTube(g, [b.x, b.y, m.x, m.y, e.x, e.y], 8, RC.glove);
  }
  tShape(g, RC.glove, gg => gg.arc(W.x, W.y, 11, 0, 6.2832), RLW * .7);
  tShade(g, gg => gg.arc(W.x, W.y, 11, 0, 6.2832), RC.gloveS, gg => gg.arc(W.x + 5, W.y + 5, 9, 0, 6.2832));
}
function drawArm(g, sx, P, open) {
  const E = armJoint(sx, P), Sx = sx * SHX;
  tTube(g, [Sx, SHY, (Sx + E.x) / 2, (SHY + E.y) / 2, E.x, E.y], 19, RC.body, RC.bodyS);
  tTube(g, [E.x, E.y, (E.x + P.x) / 2, (E.y + P.y) / 2, P.x, P.y], 17, RC.body, RC.bodyS);
  tShape(g, RC.joint, gg => gg.arc(E.x, E.y, 8, 0, 6.2832), RLW * .6);
  tShape(g, RC.joint, gg => gg.arc(Sx, SHY, 11, 0, 6.2832), RLW * .6);
  const d = Math.hypot(P.x - E.x, P.y - E.y) || 1;
  drawClaw(g, P, { x: (P.x - E.x) / d, y: (P.y - E.y) / d }, open);
}
// LED cells: the face is drawn on a 4-unit grid of glowing squares (eyes 6x2, mouth 4x1); f = {mode, ex, ey, a, k, lit}
function ledFace(g, f, glow) {
  const cell = 4, sq = 3.3;
  const put = (cx, cy, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) g.fillRect(cx - w * cell / 2 + i * cell, cy - h * cell / 2 + j * cell, sq, sq); };
  g.save(); g.fillStyle = RC.led; g.shadowColor = RC.ledG; g.shadowBlur = glow ? 16 : 8;
  const ex = (f.ex || 0) * cell, ey = (f.ey || 0) * cell;
  if (f.mode === 'shrink') {                                          // the old-screen switch-off: lines, a line, a dot
    const k = f.k;
    if (k < .45) { const h = k < .2 ? 2 : 1; put(-20 + ex, -236 + ey, 6, h); put(20 + ex, -236 + ey, 6, h); if (k < .2) put(0, -214, 4, 1); }
    else if (k < .8) { const w = Math.max(1, Math.round(20 * (1 - (k - .45) / .35))); put(0, -228, w, 1); }
    else { g.globalAlpha = 1 - (k - .8) / .2; put(0, -228, 1, 1); }
  } else {
    const blink = f.mode === 'blink';
    put(-20 + ex, -236 + ey, 6, blink ? 1 : 2); put(20 + ex, -236 + ey, 6, blink ? 1 : 2);
    const a = f.a || 0; put(0, -214, a > .1 ? 3 : 4, 1 + (a > .45 ? 2 : a > .1 ? 1 : 0));
  }
  g.restore();
}
function headPath(gg) { gg.roundRect(-60, -302, 120, 112, 24); }
function screenPath(gg) { gg.roundRect(-46, -272, 92, 72, 13); }
// o: {face, armL, armR (local points or null), openL, openR, run (0..1), ph (stride phase), lean, roll (head), lit, glow}
function drawRobo(g, x, y, o = {}) {
  g.save(); g.translate(x, y); g.scale(RK, RK);
  if (o.rot) { g.translate(o.pivot || 0, 0); g.rotate(o.rot); g.translate(-(o.pivot || 0), 0); }
  const run = o.run || 0, ph = o.ph || 0, lit = o.lit !== false;
  const liftL = 22 * run * Math.max(0, Math.sin(ph)), liftR = 22 * run * Math.max(0, -Math.sin(ph));
  const bob = -7 * run * Math.abs(Math.sin(ph));
  // legs and feet (pistons; the knees bend out as a foot lifts)
  for (const [sx, lift] of [[-1, liftL], [1, liftR]]) {
    const hx = sx * 22, hy = -72 + bob, ax = sx * 27, ay = -16 - lift, kx = sx * (27 + 10 * lift / 22), ky = (hy + ay) / 2;
    tTube(g, [hx, hy, kx, ky, ax, ay], 21, RC.metal, RC.metalS);
    tShape(g, RC.joint, gg => gg.arc((hx + 2 * kx + ax) / 4, (hy + 2 * ky + ay) / 4, 8, 0, 6.2832), RLW * .6);
    tShape(g, RC.metalS, gg => gg.roundRect(ax - 22, ay - 4, 44, 18, 6), RLW * .8);
    tShape(g, RC.glove, gg => gg.roundRect(ax - 22 + (sx > 0 ? 30 : 0), ay + 2, 14, 7, 3), 2);
  }
  g.translate(0, bob); g.rotate(o.lean || 0);
  tShape(g, RC.metalS, gg => gg.roundRect(-36, -84, 72, 18, 6), RLW * .8);   // pelvis
  // the body: white, with Cleo's black apron, her pocket and the OFF switch
  const body = gg => gg.roundRect(-52, -182, 104, 112, 16);
  tShape(g, RC.body, body, RLW); tShade(g, body, RC.bodyS, gg => gg.rect(26, -186, 30, 120));
  const apron = gg => { gg.moveTo(-38, -74); gg.lineTo(-38, -122); gg.lineTo(-28, -128); gg.lineTo(-28, -152); gg.lineTo(28, -152); gg.lineTo(28, -128); gg.lineTo(38, -122); gg.lineTo(38, -74); gg.closePath(); };
  tShape(g, RC.apron, apron, RLW * .6); tShade(g, apron, RC.apronS, gg => gg.rect(22, -156, 20, 84));
  tLine(g, [-28, -152, -22, -180], 4); tLine(g, [28, -152, 22, -180], 4);
  tShape(g, RC.apronS, gg => gg.rect(-18, -104, 36, 20), 3);
  tText(g, 'C-2', 0, -93, 11, '#7f7aa0', '"Bungee"', 'center', 400);
  g.save(); if (lit) { g.shadowColor = '#ff3355'; g.shadowBlur = 12; }
  tShape(g, '#d6d9e2', gg => gg.arc(CHEST.x, CHEST.y, 15, 0, 6.2832), 3.4);
  tShape(g, lit ? '#ff3355' : '#b0384c', gg => gg.arc(CHEST.x, CHEST.y, 10, 0, 6.2832), 2.6); g.restore();
  tText(g, 'OFF', 0, -143, 11, '#fbf7ff', '"Bungee"', 'center', 400);
  g.save(); if (lit) { g.shadowColor = RC.glove; g.shadowBlur = 10; } tShape(g, lit ? RC.glove : '#4a5a2a', gg => gg.arc(40, -168, 4.5, 0, 6.2832), 2); g.restore();
  // neck and head (the head rolls a little when it looks)
  tShape(g, RC.metal, gg => gg.rect(-12, -196, 24, 18), RLW * .6);
  g.save(); g.translate(0, -190); g.rotate(o.roll || 0); g.translate(0, 190);
  tShape(g, RC.joint, gg => gg.arc(-61, -246, 9, 0, 6.2832), RLW * .6); tShape(g, RC.joint, gg => gg.arc(61, -246, 9, 0, 6.2832), RLW * .6);
  tTube(g, [-2, -300, 2, -330, 22, -330], 8, RC.head);                // the antenna: her cowlick, bent
  g.save(); if (lit) { g.shadowColor = RC.glove; g.shadowBlur = 12; } tShape(g, lit ? RC.glove : '#4a5a2a', gg => gg.arc(26, -330, 6.5, 0, 6.2832), 3); g.restore();
  tShape(g, RC.head, headPath, RLW); tShade(g, headPath, RC.headS, gg => gg.rect(34, -306, 30, 120));
  tCurve(g, -34, -290, -12, -297, 14, -293, 4, RC.headL);
  // the screen, with her blunt bangs cut over its top edge
  tShape(g, RC.screen, screenPath, RLW * .7);
  g.save(); g.beginPath(); screenPath(g); g.clip();
  if (o.screen ?? lit) { const gr = g.createRadialGradient(0, -228, 4, 0, -228, 60); gr.addColorStop(0, 'rgba(47,224,208,.22)'); gr.addColorStop(1, 'rgba(47,224,208,0)'); g.fillStyle = gr; g.fillRect(-50, -276, 100, 80); }
  const bangs = gg => { gg.moveTo(-52, -280); gg.lineTo(52, -280); const pts = [[48, -257], [40, -251], [32, -257], [24, -250], [14, -256], [6, -250], [-4, -256], [-14, -250], [-24, -256], [-32, -250], [-40, -256], [-48, -251]]; for (const [px, py] of pts) gg.lineTo(px, py); gg.closePath(); };
  g.fillStyle = RC.head; g.beginPath(); bangs(g); g.fill();
  g.lineWidth = 4; g.strokeStyle = TOON.ink; g.lineJoin = 'round'; g.beginPath(); [[48, -257], [40, -251], [32, -257], [24, -250], [14, -256], [6, -250], [-4, -256], [-14, -250], [-24, -256], [-32, -250], [-40, -256], [-48, -251]].forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke();
  if ((o.screen ?? lit) && o.face) ledFace(g, o.face, o.glow);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(22, -246); g.lineTo(38, -262); g.lineTo(42, -252); g.lineTo(28, -238); g.closePath(); g.fill();   // the glass
  g.restore();
  g.lineWidth = RLW * .7; g.strokeStyle = TOON.ink; g.beginPath(); screenPath(g); g.stroke();
  g.save(); g.translate(52, -262); g.rotate(.5);                      // her test-tube clip
  tShape(g, '#fbf7ff', gg => gg.roundRect(-6, -16, 12, 32, 6), 3); tShade(g, gg => gg.roundRect(-6, -16, 12, 32, 6), LAB.glow, gg => gg.rect(-7, 0, 14, 18)); tShape(g, null, gg => gg.roundRect(-6, -16, 12, 32, 6), 3);
  g.restore();
  g.restore();
  // the arms, attached at the shoulders (rest: hanging a little forward)
  const swing = 12 * run * Math.sin(ph);
  drawArm(g, -1, o.armL || { x: -72, y: -96 + swing }, o.openL ?? .3);
  drawArm(g, 1, o.armR || { x: 72, y: -96 - swing }, o.openR ?? .3);
  g.restore();
}
function drawRoboLED(g, x, y, o) {                                  // the lit face again, over the dark (it is the only light left)
  g.save(); g.translate(x, y); g.scale(RK, RK); g.translate(0, -7 * (o.run || 0) * Math.abs(Math.sin(o.ph || 0))); g.rotate(o.lean || 0);
  g.translate(0, -190); g.rotate(o.roll || 0); g.translate(0, 190);
  const gr = g.createRadialGradient(0, -230, 10, 0, -230, 150); gr.addColorStop(0, 'rgba(47,224,208,.22)'); gr.addColorStop(1, 'rgba(47,224,208,0)');
  g.fillStyle = gr; g.fillRect(-160, -380, 320, 300);
  g.save(); g.beginPath(); screenPath(g); g.clip(); g.fillStyle = RC.screen; g.fillRect(-50, -276, 100, 80); ledFace(g, o.face, true); g.restore();
  g.save(); g.shadowColor = RC.glove; g.shadowBlur = 14; g.fillStyle = RC.glove; g.beginPath(); g.arc(26, -330, 5, 0, 6.2832); g.fill(); g.restore();
  g.restore();
}

// ---------------------------------------------------------------- the robot's day, from the timeline
const runs = [[TL.RUN1, TL.ARR1, TL.RX0, TL.RX_L], [TL.RUN2, TL.ARR2, TL.RX_L, TL.RX_C]];
function roboX(t) {
  let x = TL.RX0;
  for (const [a, b, x0, x1] of runs) { if (t >= b) x = x1; else if (t > a) return { x: lerp(x0, x1, (t - a) / (b - a)), run: 1, dir: Math.sign(x1 - x0), dist: Math.abs(x1 - x0) * (t - a) / (b - a) }; }
  return { x, run: 0, dir: 0, dist: 0 };
}
const Lc = (wx, wy, x) => ({ x: (wx - x) / RK, y: (wy - LCT - 2) / RK });   // a world point in the robot's local units
const blipOn = t => t >= TL.BLIP && t < TL.BLIP + .14;
const lit = t => t < TL.OFF + .02 || blipOn(t);                        // its LEDs (chest, power, antenna)
const lightsOn = t => !((t >= TL.SW1 && t < TL.SW2) || (t >= TL.SW3 && t < TL.SW4));
const DINGS = Array.from({ length: TL.NDING }, (_, i) => TL.DING0 + i * TL.DING_DT);
const SWS = [TL.SW1, TL.SW2, TL.SW3, TL.SW4];
function roboState(t) {
  const p = roboX(t), x = p.x;
  const o = { run: p.run, ph: Math.PI * p.dist / STRIDE, lean: .1 * p.dir, lit: lit(t), screen: t < TL.OFF + .6 || blipOn(t), armL: null, armR: null };
  // the face: where it looks, its mouth, its blinks
  let ex = 0, ey = 0, roll = 0;
  if (t >= V.L2.t + .1 && t < V.L3.t) { ex = 2; roll = .06; }       // at Cleo, its original
  if (t >= TL.TURN1 && t < TL.SW4 + .1) { ex = 2; ey = -1; roll = .08; }   // at the wall switch
  if (p.run) ex = 2 * p.dir;
  if (t >= TL.ARR1 && t < TL.RUN2) ex = -2;                          // at the toaster and the fridge
  if (t >= V.L9.t + .3 && t < TL.LOOKDN) { ex = 2; ey = -1; roll = .1; }   // up at Cleo
  if (t >= TL.LOOKDN && t < TL.OFF + .2) { ex = 0; ey = 2; roll = 0; }      // down at its own switch
  o.roll = roll;
  const m = mouthFor('ROBO', t);
  let mode = blinkAt(2, t) && !(t > TL.LOOKDN - .3 && t < TL.OFF + .2) ? 'blink' : 'on';
  if (t >= TL.OFF + .02) mode = 'shrink';
  o.face = { mode, ex, ey, a: m ? m.a : 0, k: clamp((t - TL.OFF - .02) / .55) };
  if (t >= TL.BLIP && t < TL.BLIP + .14) o.face = { mode: 'on', ex: 2, ey: -1, a: 0 };   // the blink of life under Cleo's finger
  // the arms
  if (t >= DINGS[0] - .25 && t < DINGS[DINGS.length - 1] + .25) {    // the bell, eight times a second (the claw's tips on its knob)
    const u = (t - DINGS[0]) / TL.DING_DT, d1 = DINGS[DINGS.length - 1];
    const down = t < DINGS[0] ? smooth(DINGS[0] - .25, DINGS[0], t) : t > d1 ? 1 - smooth(d1, d1 + .1, t) : .5 + .5 * Math.cos(2 * Math.PI * u);
    const k = t < DINGS[0] ? smooth(DINGS[0] - .25, DINGS[0] - .08, t) : 1 - smooth(d1 + .06, d1 + .25, t);
    const P = Lc(BELL.x + 4, LCT - 82 - 46 * (1 - down), x);         // wrist above the knob: down = the tips on it
    o.armR = { x: lerp(72, P.x, k), y: lerp(-96, P.y, k) }; o.openR = .1;
  }
  const reach = (t0, t1, wx, wy, side, open = .1, pre = .14, post = .16) => {
    if (t < t0 - pre || t > t1 + post) return;
    const k = t < t0 ? smooth(t0 - pre, t0, t) : t > t1 ? 1 - smooth(t1, t1 + post, t) : 1;
    const rest = side > 0 ? { x: 72, y: -96 } : { x: -72, y: -96 }, tip = Lc(wx, wy, x);
    const sh = { x: side * SHX, y: SHY }, dd = Math.hypot(tip.x - sh.x, tip.y - sh.y) || 1;
    const P = { x: tip.x - (tip.x - sh.x) / dd * 24, y: tip.y - (tip.y - sh.y) / dd * 24 };   // the wrist, so the claw's tips touch it
    const q = { x: lerp(rest.x, P.x, k), y: lerp(rest.y, P.y, k) };
    if (side > 0) { o.armR = q; o.openR = open; } else { o.armL = q; o.openL = open; }
  };
  reach(TL.SW1, TL.SW1 + .05, SW.x, SW.y, 1);                // the light switch: off; on, off, on
  reach(TL.SW2, TL.SW4 + .04, SW.x, SW.y, 1, .1, .14, .14);
  reach(TL.TOAST1, TL.TOAST1 + .06, TLEV.x + 2, TLEV.y - 4, 1);       // the toaster's lever
  reach(TL.ICE1, TL.ICE1 + .95, DISP.x + 4, DISP.y - 2, -1);         // the ice paddle, held while it pours
  reach(TL.BOTH, TL.BOTH + .06, TLEV.x + 2, TLEV.y - 4, 1);           // "Pressing things.": both at once
  reach(TL.BOTH, TL.BOTH + .75, DISP.x + 4, DISP.y - 2, -1);
  if (t >= TL.OFF - .22 && t < TL.OFF + .3) {                         // its own OFF switch, with its right claw
    const k = t < TL.OFF ? smooth(TL.OFF - .22, TL.OFF, t) : 1 - smooth(TL.OFF + .1, TL.OFF + .3, t);
    o.armR = { x: lerp(72, CHEST.x + 21, k), y: lerp(-96, CHEST.y - 11, k) }; o.openR = .05;
  }
  if (t >= TL.OFF + .3) {                                             // power gone: the arms hang, the head drops
    const k = smooth(TL.OFF + .3, TL.FALL, t);
    o.armL = { x: -66, y: -96 + 18 * k }; o.armR = { x: 66, y: -96 + 18 * k }; o.roll = .12 * k;
    if (t >= TL.FALL) { const f = smooth(TL.FALL + .1, TL.LAND + .1, t); o.armL = { x: lerp(-66, -50, f), y: lerp(-78, -40, f) }; o.armR = { x: lerp(66, 70, f), y: lerp(-78, -60, f) }; }   // lying on its right side: the top arm along its side, toward its feet
  }
  // the fall: over to its right, onto the bench in front of Cleo (pivot at the outside of its right side)
  if (t >= TL.FALL) {
    const u = clamp((t - TL.FALL) / (TL.LAND - TL.FALL)), land = t - TL.LAND;
    let r = 1.5708 * u * u;
    if (land > 0) r = 1.5708 - .07 * Math.exp(-land * 9) * Math.sin(land * 30);   // one small bounce
    o.rot = r; o.pivot = 66;
  } else if (t >= TL.OFF + .4) { o.rot = .05 * smooth(TL.OFF + .4, TL.FALL, t); o.pivot = 66; }   // starts to tip
  return { x, o };
}
// the OFF switch's place in the world (when it lies on the bench), for Cleo's finger
function chestWorld(st) {
  const { x, o } = st, piv = o.pivot || 0, r = o.rot || 0;
  const lx = CHEST.x - piv, ly = CHEST.y;
  return { x: x + (piv + lx * Math.cos(r) - ly * Math.sin(r)) * RK, y: LCT + (lx * Math.sin(r) + ly * Math.cos(r)) * RK };
}

// ---------------------------------------------------------------- Vera and Cleo (the rigs as they are)
function veraState(t) {
  const loc = (wx, wy) => ({ x: (wx - VX) / K9, y: (wy - LCT) / K9 });
  const o = { expr: 'scheme', mouth: mouthFor('VERA', t), blink: t > .6 && blinkAt(0, t), tube: false };
  let present = null;
  if (t < V.L2.t) { o.reachR = loc(462, 1150); present = true; }    // frame 1: "Meet Robo-Cleo." her open hand toward it
  else if (t < V.L3.t) { o.expr = 'cool'; }
  else if (t < DINGS[0] - .1) { o.expr = 'scheme'; o.reachR = loc(470, 1166); present = true; }   // "Robo-Cleo. Press."
  else if (t < V.L4.t - .1) o.expr = 'laugh';                        // eight a second!
  else if (t < TL.SW1) { o.expr = 'cool'; o.point = smooth(V.L4.t - .1, V.L4.t + .2, t) * .75; }   // "Now press nothing..."
  else if (t < V.L6.t) o.expr = 'fluster';
  else if (t < endOf('L6')) { o.expr = 'fluster'; o.cheer = true; }   // "Stop! Stop pressing things!"
  else if (t < V.L8.t) o.expr = 'fluster';
  else if (t < endOf('L8')) { o.expr = 'fluster'; o.point = smooth(V.L8.t, V.L8.t + .25, t); }   // "Cleo, do something!"
  else if (t < TL.LAND + .2) o.expr = 'fluster';
  else if (t < V.L11.t + .3) { o.expr = 'fluster'; o.mouth = { a: .55, shape: 'o' }; }   // frozen, mouth open
  else if (t < V.L13.t) o.expr = 'cool';
  else if (t < TL.HOVER0 + .2) { o.expr = 'scheme'; o.tube = true; }  // "Double zero is still zero."
  else if (t < V.L14.t + .1) o.expr = 'fluster';
  else if (t < endOf('L14')) { o.expr = 'fluster'; o.cheer = true; }  // "Triple! Triple zero!"
  else o.expr = 'fluster';
  return { o, present };
}
function drawVeraAll(g, t) {
  const st = veraState(t);
  drawVera2(g, VX, LCT, S, st.o);
  if (st.present) { const r = st.o.reachR; tHand(g, VX + r.x * K9, LCT + r.y * K9 - 4, 9.5 * K9, LAB2.vera.skin, LAB2.vera.skinS, true); }
}
function cleoState(t) {
  const o = { expr: 'deadpan', mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), remote: true };
  if (t >= V.L2.t + .2 && t < TL.LOOKDN) o.look = -1.2;               // at the robot, on her left
  let reach = null;
  if (t >= TL.HOVER0 && t < TL.UNHOVER + .35) {                       // her finger over the fallen robot's switch
    const st = roboState(t), cw = chestWorld(st);
    const k = t < TL.HOVER ? smooth(TL.HOVER0, TL.HOVER, t) : 1 - smooth(TL.UNHOVER, TL.UNHOVER + .35, t);
    const P = { x: (cw.x + 4 - CX) / K9, y: (cw.y - 22 - LCT) / K9 }, rest = { x: -20, y: -40 };
    reach = { x: lerp(rest.x, P.x, k), y: lerp(rest.y, P.y, k) }; o.reachL = reach;
    o.expr = t < V.L15.t ? 'smug' : 'deadpan'; o.look = t < V.L15.t ? -1.2 : 0;
  }
  return { o, reach };
}

// ---------------------------------------------------------------- the PAY RENT spiral (owner 11/16): the circles as one spiral
// that grows outward, so "3. PAY RENT" stays readable inside it; loop i is the (i+1)th circle; k draws the next loop (as in VL10)
function spiralPt(th) { const cx = LBOARD.x - 68, cy = LBOARD.y + 80, turns = th / 6.2832; return [cx + Math.cos(th - 2.4) * (114 + 10 * turns), cy + Math.sin(th - 2.4) * (27 + 6 * turns)]; }
function drawRentSpiral(g, n, k = 0) {
  const th1 = 6.2832 * (n + clamp(k));
  g.save(); g.strokeStyle = '#ff8fb1'; g.lineWidth = 4.5; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); for (let th = 0; th <= th1; th += .05) { const [x, y] = spiralPt(th); th ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.restore();
  return spiralPt(th1);
}
function drawChalkArm(g, t, hand) {                                  // Cleo's arm from below the frame, the chalk at the spiral's end;
  if (t < TL.BOARDT + .15 || t > TL.BOARDT + 2.0) return;            // her shoulder (off frame) moves along under the hand as she draws
  const enter = ease((t - TL.BOARDT - .15) / .25) * (1 - ease((t - TL.BOARDT - 1.6) / .3));
  const hx = lerp(hand[0] + 90, hand[0], enter), hy = lerp(980, hand[1], enter);
  const rx = hx + 110, ry = 980, ex = (hx + rx) / 2 + 34, ey = (hy + ry) / 2 + 10;   // root below the frame's bottom edge (y 905)
  tTube(g, [rx, ry, (rx + ex) / 2 + 6, (ry + ey) / 2, ex, ey, (ex + hx) / 2 + 8, (ey + hy) / 2 + 6, hx + 14, hy + 12], 24, LAB2.cleo.tee, '#dcd4ee');
  tShape(g, '#fbf7ff', gg => { gg.save(); gg.translate(hx - 4, hy - 4); gg.rotate(-.6); gg.roundRect(-4, -12, 8, 22, 3); gg.restore(); }, 2.4);
  tHand(g, hx + 6, hy + 4, 10, LAB2.cleo.glove, LAB.glowS);
}
function wallLeftOfSet(g) {                                           // the brick wall continued left of the set (x < 0), for the board shot
  let a = 7; const R = () => (a = a * 16807 % 2147483647) / 2147483647;
  g.fillStyle = '#12302a'; g.fillRect(-200, 0, 200, LCT);
  for (let r = 0, y = 0; y < LCT; r++, y += 48) for (let x = -240 + (r % 2) * 60; x < 0; x += 120) { const v = R(); g.fillStyle = v < .33 ? '#18402f' : v < .66 ? '#1a4433' : '#163b2c'; g.fillRect(x + 3, y + 3, 114, 42); }
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-200, 0, 200, LCT);
}

// ---------------------------------------------------------------- cameras: [centre x, centre y, zoom at shot start, zoom at shot end];
// the centre is kept inside the set (x 0..1080) for the shot's widest zoom
const cam = (x, y, z0, z1) => [clamp(x, 540 / z0, 1080 - 540 / z0), y, z0, z1];
const CAM = {
  VERA_OPEN: cam(452, 1060, 1.9, 1.96),                              // frame 1: her face big, the robot beside her on the bench
  PAIR: cam(742, 1060, 1.6, 1.66),                                   // Cleo and Robo-Cleo, two deadpan faces
  MID: cam(492, 1050, 1.46, 1.52),                                   // Vera, the robot, the bell, the wall switch
  WIDE: cam(540, 1010, 1.04, 1.08),
  CLEO_MED: cam(760, 1080, 1.6, 1.66),
  ROBO: cam(760, 1120, 2.05, 2.15),                                  // the robot in front of Cleo: it looks down, OFF, it falls
  VERA_CU: cam(VX + 10, VFACE + 80, 2.3, 2.42), VERA_MED: cam(VX + 60, VFACE + 160, 1.6, 1.66),
  CLEO_CU: cam(CX - 20, CFACE - 10, 2.6, 2.68),                     // close and high: the robot lying on the bench stays under the subtitles
  THREAT: cam(780, 1110, 1.75, 1.8),                                 // Cleo's finger over the switch of the robot lying in front of her
  BOARD_END: [200, 452, 2.15, 2.2],                                  // the whole 13th loop in frame; the board's lines and the spiral under the card (y > 800)
};

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  if (n === 'BOARD_END') wallLeftOfSet(c);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, t, 0);
  if (n === 'BOARD_END') {
    const hand = drawRentSpiral(c, 12, t > TL.BOARDT + .3 ? (t - TL.BOARDT - .3) / .9 : 0);
    drawChalkArm(c, t, hand);
  } else drawRentSpiral(c, 12, 0);
  drawSwitch(c, !lightsOn(t) ? false : true);
  drawFridge(c, 0);
  const iceHeld = (t >= TL.ICE1 - .02 && t < TL.ICE1 + .95) || (t >= TL.BOTH - .02 && t < TL.BOTH + .75);
  drawDispenser(c, iceHeld ? 1 : 0);
  const cast = n !== 'BOARD_END';
  if (cast) {
    const cs = cleoState(t);
    drawCleo2(c, CX, LCT, S, cs.o);
    drawVeraAll(c, t);
    // the bench: the toast (behind the toaster's front), the toaster, the bell, the ice, the robot
    drawToastSlices(c, t);
    const lev = Math.max(...[TL.TOAST1, TL.BOTH].map(p => t >= p - .02 && t < p + .25 ? 1 - smooth(p + .1, p + .25, t) : 0));
    drawToaster(c, lev);
    const dn = DINGS.some(d => t >= d - .015 && t < d + .045) ? 1 : 0;
    drawBell(c, dn);
    if (t >= DINGS[0] - .05 && t < DINGS[DINGS.length - 1] + .08) {   // speed lines: the claw is a blur over the bell
      c.save(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4; c.lineCap = 'round';
      for (const [dx, y0, y1] of [[-34, -128, -84], [36, -132, -90], [46, -112, -80]]) { c.beginPath(); c.moveTo(BELL.x + dx, LCT + y0); c.lineTo(BELL.x + dx + (dx > 0 ? 3 : -3), LCT + y1); c.stroke(); }
      c.restore();
    }
    drawIce(c, t);
    const rs = roboState(t);
    drawRobo(c, rs.x, LCT + 2, rs.o);
    if (cs.reach) {                                                   // her arm over the robot (the rig's own tube, again, on top of it)
      const r = cs.reach;
      c.save(); c.translate(CX, LCT); c.scale(K9, K9);
      const mx = (-76 + r.x) / 2 - 4, my = (-76 + r.y) / 2 + 6;
      c.beginPath(); c.rect(-200, -95, 400, 200); c.clip();             // only where it crosses the robot (below her chest)
      tTube(c, [-53, -118, -76, -76, mx, my, (mx + r.x) / 2, (my + r.y) / 2, r.x - 2, r.y - 4], 18, LAB2.cleo.tee);
      c.restore();
      tHand(c, CX + r.x * K9, LCT + r.y * K9, 8.5 * K9, LAB2.cleo.glove, LAB.glowS);
      tTube(c, [CX + r.x * K9 - 6, LCT + r.y * K9 + 8, CX + r.x * K9 - 8, LCT + r.y * K9 + 20, CX + r.x * K9 - 6, LCT + r.y * K9 + 30], 9, LAB2.cleo.glove);   // the pointing finger
    }
    c.drawImage(LAB_STATIC.front, 0, LCT);
    if (!lightsOn(t)) {                                               // the lights are off: the window, the flasks and its face are left
      c.save(); c.fillStyle = 'rgba(6,10,26,.8)';
      const Wn = LWIN; c.beginPath(); c.rect(-200, -200, 1480, 2400); c.rect(Wn.x + Wn.w / 2, Wn.y - Wn.h / 2, -Wn.w, Wn.h); c.fill('evenodd'); c.restore();
      drawRoboLED(c, rs.x, LCT + 2, rs.o);
    }
  } else c.drawImage(LAB_STATIC.front, 0, LCT);
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  endCard(OUT, t, 'vl');   // owner 11/9 + 11/13 + 11/16: the cast, NEW EPISODE EVERY DAY, 2.5 s (TL.ENDCARD), and TL.ASK under it
}
window.render = render;

// ---------------------------------------------------------------- sound cues (tools/mix.py): every action on its frame, in its space
const robSteps = (a, b, x0, x1) => {                                 // a metal foot lands every STRIDE px of the run (as the legs draw it)
  const out = [], d = Math.abs(x1 - x0), n = Math.floor(d / STRIDE);
  for (let i = 1; i <= n; i++) { const u = i * STRIDE / d, x = lerp(x0, x1, u); out.push({ type: 'rstep', t: +(a + (b - a) * u).toFixed(3), i, pan: Math.max(-1, Math.min(1, (x - 540) / 540)) }); }
  out.push({ type: 'rstep', t: +(b + .03).toFixed(3), i: n + 1, pan: Math.max(-1, Math.min(1, (x1 - 540) / 540)) });
  return out;
};
const panX = x => Math.max(-1, Math.min(1, (x - 540) / 540));
window.EV = [
  { type: 'servo', t: V.L2.t + .06, gdb: -4, pan: panX(TL.RX0) },             // its head turns to Cleo
  { type: 'servo', t: DINGS[0] - .28, gdb: -2, pan: panX(TL.RX0) },           // the arm up over the bell
  ...DINGS.map((d, i) => ({ type: 'ding', t: +d.toFixed(3), i, pan: panX(BELL.x), ...(i < DINGS.length - 1 ? { dur: TL.DING_DT - .01 } : {}) })),   // each strike cuts the last ring short
  { type: 'servo', t: TL.TURN1, pan: panX(TL.RX0) },                          // its head turns to the wall switch
  ...SWS.map((s, i) => ({ type: 'switch', t: +s.toFixed(3), i, pan: panX(SW.x) })),
  { type: 'servo', t: TL.SW4 + .06, gdb: -3, pan: panX(TL.RX0) },
  ...robSteps(TL.RUN1, TL.ARR1, TL.RX0, TL.RX_L),
  { type: 'clank', t: TL.ARR1 + .04, gdb: -6, pan: panX(TL.RX_L) },
  { type: 'servo', t: TL.TOAST1 - .14, gdb: -3, pan: panX(TL.RX_L) },
  { type: 'toast', t: TL.TOAST1, pan: panX(TOAST.x) },
  { type: 'press', t: TL.ICE1, pan: panX(DISP.x) }, { type: 'ice', t: TL.ICE1 + .05, dur: .95, pan: panX(DISP.x + 60) },
  { type: 'cloth', t: V.L6.t + .05, gdb: -2 },                                // Vera's arms up: "Stop!"
  { type: 'servo', t: TL.BOTH - .16, gdb: -2, pan: panX(TL.RX_L) },
  { type: 'toast', t: TL.BOTH, pan: panX(TOAST.x) },
  { type: 'press', t: TL.BOTH, pan: panX(DISP.x) }, { type: 'ice', t: TL.BOTH + .05, dur: .75, pan: panX(DISP.x + 60) },
  ...robSteps(TL.RUN2, TL.ARR2, TL.RX_L, TL.RX_C),
  { type: 'clank', t: TL.ARR2 + .04, gdb: -4, pan: panX(TL.RX_C) },
  { type: 'servo', t: V.L9.t + .3, gdb: -4, pan: panX(TL.RX_C) },             // it looks up at Cleo
  { type: 'servo', t: TL.LOOKDN, gdb: -3, pan: panX(TL.RX_C) },               // and down at its own switch
  { type: 'servo', t: TL.OFF - .24, gdb: -4, pan: panX(TL.RX_C) },
  { type: 'press', t: TL.OFF, gdb: 2, pan: panX(TL.RX_C) },                   // OFF
  { type: 'powerdown', t: TL.OFF + .03, pan: panX(TL.RX_C) },
  { type: 'thud', t: TL.LAND, pan: panX(TL.RX_C + 120) }, { type: 'clank', t: TL.LAND + .1, gdb: -8, pan: panX(TL.RX_C + 160) },
  { type: 'cloth', t: TL.HOVER0 + .02, gdb: -6, pan: panX(CX) },              // Cleo's arm out over it
  { type: 'blip', t: TL.BLIP, pan: panX(TL.RX_C + 120) },                     // its eyes, on for a blink
  { type: 'cloth', t: V.L14.t + .08, gdb: -2 },                               // Vera's arms up: "Triple!"
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
