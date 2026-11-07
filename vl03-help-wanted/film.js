// Volt Labs, episode 3: "Help Wanted (Evil)". One year ago: Cleo's job interview. Script: channel/scripts/VL03_help_wanted.md
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Set, cameras, pigeons: channel/brand/labkit.js;
// lip sync, subtitles, shots: channel/brand/vmkit.js; characters: channel/brand/lab.js.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const BOOM = TL.BOOM, NOW = TL.NOW;
const past = t => t < NOW;
const REMOTE = { x: 688, y: LCT + 8 };                          // the red-button remote, on the bench, one year ago
const EXT = { x: 448, y: LCT + 14 };                            // the fire extinguisher she slams down
const FLYER_WALL = { x: 560, y: 470 };                          // the old flyer, pinned up next to the board (today)

// ---------------------------------------------------------------- the flyer
function flyer(g, x, y, s, torn, hired) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-.03);
  tShape(g, '#f4ecd6', gg => gg.rect(-150, -200, 300, 400), 4);
  tText(g, 'HELP WANTED', 0, -150, 40, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, '(EVIL)', 0, -100, 46, '#c2233a', '"Bungee"', 'center', 400);
  tText(g, 'LAB ASSISTANT', 0, -42, 28, TOON.ink);
  tText(g, 'NO QUESTIONS', 0, -6, 28, TOON.ink);
  // a skull doodle
  g.save(); g.translate(0, 56); tShape(g, '#fbf7ff', gg => { gg.arc(0, 0, 30, Math.PI, 0); gg.lineTo(22, 22); gg.lineTo(-22, 22); gg.closePath(); }, 3);
  g.fillStyle = TOON.ink; g.beginPath(); g.arc(-11, -2, 7, 0, 6.2832); g.arc(11, -2, 7, 0, 6.2832); g.fill(); for (const dx of [-8, 0, 8]) tLine(g, [dx, 14, dx, 22], 2.4); g.restore();
  // tear-off tabs
  for (let i = 0; i < 6; i++) {
    if (i === 3 && torn) continue;
    g.save(); g.translate(-125 + i * 50, 160); tShape(g, '#f4ecd6', gg => gg.rect(-20, -40, 40, 80), 2.4); g.rotate(-Math.PI / 2); tText(g, 'VOLT LABS', 0, 0, 12, TOON.ink, '"Bungee"', 'center', 400); g.restore();
  }
  if (hired > 0) {
    g.save(); g.translate(10, 10); g.rotate(-.25); g.scale(1 + (1 - hired) * .6, 1 + (1 - hired) * .6); g.globalAlpha = Math.min(1, hired * 1.5);
    g.strokeStyle = '#c2233a'; g.lineWidth = 8; g.strokeRect(-120, -40, 240, 80); tText(g, 'HIRED', 0, 4, 64, '#c2233a', '"Bungee"', 'center', 400); g.restore();
  }
  g.restore();
}
// the opening close-up: the flyer on the lab door; Cleo's gloved hand comes in from the right and tears off a tab
function drawFlyerShot(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#5b3b26'; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 40; x < W; x += 180) g.fillRect(x, 0, 10, H);   // door planks
  tShape(g, '#3b2616', gg => gg.rect(60, 120, W - 120, H - 240), 6);
  g.fillStyle = '#6b4a30'; g.fillRect(80, 140, W - 160, H - 280);
  flyer(g, 540, 820, 2.1, t > .9, 0);
  tShape(g, '#c9c9d4', gg => gg.rect(500, 380, 80, 22), 3);                                    // tape
  const k = ease(t / .8), out = ease((t - .9) / .6), hx = lerp(1180, 660, k) + out * 520, hy = lerp(1500, 1180, k) + out * 120;
  tTube(g, [1240, 1700, 1000, 1400, hx + 40, hy + 30], 70, LAB2.cleo.tee, '#dcd4ee');
  if (t > .9) { g.save(); g.translate(hx - 10, hy - 40); g.rotate(-.3); tShape(g, '#f4ecd6', gg => gg.rect(-40, -80, 80, 160), 3); g.restore(); }
  tHand(g, hx, hy, 30, LAB2.cleo.glove, LAB.glowS);
}

// ---------------------------------------------------------------- props
function drawRemote(g, x, y, pressed) {
  tShape(g, '#3a3350', gg => gg.roundRect(x - 26, y - 20, 52, 34, 8), 3.4);
  g.save(); g.shadowColor = '#ff3355'; g.shadowBlur = 12 + (pressed ? 30 : 0); tShape(g, '#ff3355', gg => gg.ellipse(x, y - 8 + (pressed ? 3 : 0), 14, 10 - (pressed ? 3 : 0), 0, 0, 6.2832), 3); g.restore();
}
function drawExtinguisher(g, x, y, k) {
  if (k <= 0) return;
  const yy = y - (1 - ease(k)) * 260;
  tShape(g, '#d62b3a', gg => gg.roundRect(x - 30, yy - 150, 60, 150, 22));
  tShade(g, gg => gg.roundRect(x - 30, yy - 150, 60, 150, 22), '#a81f2c', gg => gg.rect(x + 8, yy - 160, 40, 170));
  tShape(g, '#3a3350', gg => gg.roundRect(x - 14, yy - 186, 28, 40, 6), 3);
  tTube(g, [x + 12, yy - 178, x + 48, yy - 168, x + 44, yy - 120], 9, '#3a3350');
  tShape(g, '#fbf7ff', gg => gg.rect(x - 22, yy - 110, 44, 40), 2.4);
}
function bin(g) {                                                  // the egg: an orange Void Mart bag in the bin
  tShape(g, '#7a8098', gg => { gg.moveTo(940, LCT - 70); gg.lineTo(1010, LCT - 70); gg.lineTo(1000, LCT + 4); gg.lineTo(950, LCT + 4); gg.closePath(); });
  tShape(g, TOON.orange, gg => { gg.moveTo(950, LCT - 70); gg.quadraticCurveTo(960, LCT - 104, 975, LCT - 92); gg.quadraticCurveTo(990, LCT - 110, 1000, LCT - 70); gg.closePath(); }, 3);
  tText(g, 'VM', 975, LCT - 82, 11, '#fff', '"Bungee"', 'center', 400);
}
// soot and smoke after the explosion
function smoke(g, t) {
  const k = (t - BOOM);
  if (k < 0 || k > 3) return;
  g.save();
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, r = 60 + 220 * Math.min(1, k * 1.6), x = 560 + Math.cos(a) * r * 1.4, y = 900 + Math.sin(a) * r * .8 - k * 60;
    g.globalAlpha = Math.max(0, .75 - k * .25); g.fillStyle = i % 2 ? '#3a3a40' : '#55555c';
    g.beginPath(); g.arc(x, y, 90 + 60 * Math.min(1, k), 0, 6.2832); g.fill();
  }
  g.restore();
}
function sootFace(g, x, faceY, s, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a * .7; g.fillStyle = '#2a2430';
  g.beginPath(); g.ellipse(x - 26 * s / 100, faceY + 26 * s / 100, 16 * s / 100, 9 * s / 100, .3, 0, 6.2832); g.ellipse(x + 30 * s / 100, faceY + 6 * s / 100, 12 * s / 100, 7 * s / 100, -.2, 0, 6.2832); g.ellipse(x + 4 * s / 100, faceY - 40 * s / 100, 20 * s / 100, 8 * s / 100, 0, 0, 6.2832); g.fill();
  g.restore();
}
function frizz(g, x, top, s, a) {                                 // Vera's hair after the blast
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.strokeStyle = TOON.ink; g.lineWidth = 4; g.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const ang = Math.PI * (1.05 + i / 13 * .9), r0 = 60 * s / 100, r1 = (88 + (i % 3) * 14) * s / 100; g.beginPath(); g.moveTo(x + Math.cos(ang) * r0, top + Math.sin(ang) * r0); g.lineTo(x + Math.cos(ang) * r1, top + Math.sin(ang) * r1); g.stroke(); }
  g.restore();
}

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, LABCAM, {
  WIDE_INT: [540, 960, 1.28, 1.34],
  WIDE_WARN: [560, 1000, 1.3, 1.24],
  VERA_CHEER: [VERA.x + 10, VERAFACE + 10, 1.9, 2.05],
  VERA_MED: [VERA.x + 90, VERAFACE + 160, 1.55, 1.6],
  WIDE_NOW: [540, 960, 1.2, 1.26],
  BOARD_NOW: [LBOARD.x + 130, LBOARD.y + 10, 1.95, 2.05],
});

// ---------------------------------------------------------------- character states
function veraState(t, n) {
  let expr = 'cool', clipboard = false, point = 0, tube = false, cheer = false, reachR = null;
  if (past(t)) {
    clipboard = true;
    if (t >= V.L3.t) expr = 'scheme';
    if (t >= V.L5.t && t < V.L6.t) expr = 'cool';
    if (t >= V.L8.t - .1 && t < BOOM) { clipboard = false; point = ease((t - V.L8.t) / .4); expr = 'scheme'; }
    if (t >= BOOM) { clipboard = false; expr = 'fluster'; }
    if (t >= V.L11.t && t < V.L12.t) { expr = 'laugh'; cheer = true; }
    if (t >= V.L12.t) expr = 'scheme';
    if (t >= V.L13.t) { const k = ease((t - V.L13.t) / .3); reachR = { x: lerp(70, 84, k), y: lerp(-110, -40, k) }; expr = 'scheme'; }
  } else { expr = t >= V.L14.t - .3 ? 'fluster' : 'cool'; tube = true; }
  return { expr, clipboard, point, tube: tube && !point, cheer, reachR, mouth: mouthFor('VERA', t), blink: blinkAt(0, t) };
}
function cleoState(t, n) {
  let expr = 'deadpan', remote = !past(t), reachL = null, press = 0;
  if (past(t) && t >= TL.PRESS - .2 && t < BOOM + .5) { const k = ease((t - TL.PRESS + .2) / .25); reachL = { x: lerp(-20, (REMOTE.x - CLEO.x) / CLEO.s * 100, k), y: lerp(-40, 2, k) }; }
  if (!past(t) && t >= TL.POP - .2 && t < TL.POP + .4) press = 1;
  if (t >= V.L12.t && t < V.L13.t) expr = 'sleepy';
  return { expr, remote, reachL, press, mouth: mouthFor('CLEO', t), blink: blinkAt(1, t) };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  if (n === 'FLYER') { drawFlyerShot(c, t); return; }
  const shake = t > BOOM && t < BOOM + .6 ? Math.sin(t * 95) * 16 * (1 - (t - BOOM) / .6) : (t > TL.POP && t < TL.POP + .25 ? Math.sin(t * 120) * 5 : 0);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, shake);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, t, past(t) ? 0 : 1);
  drawRentCircles(c, past(t) ? 1 : (t > TL.BOARDT + 1.3 ? 4 : 3), !past(t) && t > TL.BOARDT + .4 && t <= TL.BOARDT + 1.3 ? (t - TL.BOARDT - .4) / .9 : 0);
  if (!past(t)) { flyer(c, FLYER_WALL.x, FLYER_WALL.y, .42, true, clamp((t - TL.BOARDT - .1) / .15)); drawRay(c, t, { charge: .25 }); drawPigeon(c, 590, 760, 58, { dir: -1, bob: Math.sin(t * 4) }); }
  if (n === 'BOARD_NOW') drawChalkArm(c, t, 3);
  drawFridge(c, 0);
  const bobV = Math.sin(t * 2.1) * 2, bobC = Math.sin(t * 1.7 + 1) * 1.5;
  const V2 = veraState(t, n), C2 = cleoState(t, n);
  drawVera2(c, VERA.x, LCT + bobV, VERA.s, V2);
  drawCleo2(c, CLEO.x, LCT + bobC, CLEO.s, C2);
  const sootV = past(t) && t > BOOM + .1 ? 1 : (!past(t) && t > TL.POP + .1 ? .5 : 0), sootC = past(t) && t > BOOM + .1 ? 1 : 0;
  sootFace(c, VERA.x, VERAFACE, VERA.s, sootV); sootFace(c, CLEO.x, CLEOFACE, CLEO.s, sootC);
  frizz(c, VERA.x, LCT + bobV - 250 * VERA.s / 100, VERA.s, past(t) && t > BOOM + .1 ? 1 : 0);
  if (!past(t)) drawPigeon(c, LWIN.x + 120, LWIN.y + LWIN.h / 2 + 8, 56, { dir: -1, bob: Math.sin(t * 5) * 1.2 });
  c.drawImage(LAB_STATIC.front, 0, LCT);
  bin(c);
  if (past(t)) drawRemote(c, REMOTE.x, REMOTE.y, t >= BOOM - .05);
  drawExtinguisher(c, EXT.x, EXT.y, past(t) ? clamp((t - V.L13.t - .05) / .25) : 1);
  smoke(c, t);
  if (!past(t) && t > TL.POP && t < TL.POP + 1.6) { c.save(); c.globalAlpha = 1 - (t - TL.POP) / 1.6; c.fillStyle = '#55555c'; c.beginPath(); c.arc(CLEO.x - 20, LCT - 60 - (t - TL.POP) * 120, 30 + (t - TL.POP) * 40, 0, 6.2832); c.fill(); c.restore(); }
  if (past(t) && t > BOOM - .02 && t < BOOM + .5) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(255,236,190,${.9 * (1 - (t - BOOM) / .5)})`; c.fillRect(0, 0, W, H); }
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
// the time captions, top left (inside the Shorts safe area)
function timeCaption(g, t) {
  const show = (a, b, text) => { if (t < a || t > b) return; const k = clamp((t - a) / .2) * clamp((b - t) / .2);
    g.save(); g.globalAlpha = k; g.setTransform(1, 0, 0, 1, 0, 0); tShape(g, 'rgba(18,10,42,.85)', gg => gg.roundRect(60, 230, 420, 96, 18), 4); tText(g, text, 270, 280, 44, '#d8ff7a', '"Bungee"', 'center', 400); g.restore(); };
  show(.2, V.L4.t, 'ONE YEAR AGO');
  show(NOW, NOW + 2.6, 'TODAY');
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  timeCaption(OUT, t);
}
window.render = render;

window.EV = [
  { type: 'bed', fx: 'lab_hum', t: 0, t1: DUR + .5, g: -31 },
  { type: 'tear', t: .95 },
  { type: 'whoosh', t: V.L1.t - .15 },
  { type: 'scribble', t: V.L5.t + .1 },
  { type: 'click', t: BOOM - .05 },
  { type: 'boom', t: BOOM },
  { type: 'rattle', t: BOOM + .1 },
  { type: 'cough', t: BOOM + 1.0 },
  { type: 'thud', t: V.L13.t + .3 },
  { type: 'whoosh', t: NOW - .1 },
  { type: 'click', t: TL.POP - .05 },
  { type: 'pop', t: TL.POP },
  { type: 'coo', t: TL.POP + .4 },
  { type: 'stamp', t: TL.BOARDT + .1 },
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
