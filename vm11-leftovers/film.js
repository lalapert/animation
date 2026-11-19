// Void Mart, episode 11: "Leftovers". Thanksgiving night: lonely customers from across the universe queue at the store microwave
// with their leftovers; Pip turns the counter into a Friendsgiving; MAGS charges a microwave fee and sells gratitude; Dennis's
// uncovered cranberry sauce meets Rae's rule nine; Rae, who doesn't do holidays, has her own leftovers in the microwave.
// Script: channel/scripts/VM11_leftovers.md
// Set: the counter (vmkit.js). The clerks stand behind it; the three small customers sit on the counter top, whole (a one-wheel
// robot, a legless jelly, a floating puff); Dennis (a slug) comes up to the front of the counter.
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
const M0 = TL.M0, MONT = TL.MONT;

// ---------------------------------------------------------------- layout (world coordinates)
const MW = { x0: 640, x1: 860, top: CT - 140 };              // the store microwave on the counter, in front of Rae
const DOOR = { x0: 648, x1: 800, wy0: CT - 128, wy1: CT - 18 };   // its door (hinged on the left) and window
const PANEL = { x: 829, disp: CT - 118, start: CT - 40, release: CT - 74 };
const INSIDE = { x: 724, y: CT - 40 };                        // the middle of the turntable
const ROBOT = { x: 360, q: 940 }, BLOB = { x: 466, q: 1045 }, PUFF = { x: 575, q: 1150 };   // at Pip's table; .q = in the queue, right of the microwave
const atTable = t => t >= V.L3.t - .6;                       // they move to the table while we look at MAGS
const DEN = { x: 980, y: CT + 80, s: 110 };                   // Dennis, at the front of the counter
const BOWL_UP = { x: 890, y: CT - 22 };                       // Dennis's bowl, lifted onto the counter
const HOLD_RAE = { x: 724, y: CT - 186 };                     // Rae's own leftovers, held at her chest at the end
const GRAVY = { x: 430, y: CT - 2 }, GRAVY_OUT = { x: 612, y: CT - 246 };   // held out over the robot's head, next to Rae's leftovers

// ---------------------------------------------------------------- containers and food
function tub(g, x, y, w, h, lid, food, label) {               // a clear plastic food container, (x, y) = bottom centre
  if (food) { g.save(); g.beginPath(); g.roundRect(x - w / 2 + 3, y - h + 6, w - 6, h - 9, 6); g.clip(); food(g, x, y, w, h); g.restore(); }
  tShape(g, 'rgba(225,240,255,.28)', gg => gg.roundRect(x - w / 2, y - h + 4, w, h - 4, 7), 3);
  g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x - w / 2 + 6, y - h + 10, 4, h - 18);
  tShape(g, lid, gg => gg.roundRect(x - w / 2 - 4, y - h - 4, w + 8, 12, 5), 3);
  if (label) { tShape(g, '#f4e3b5', gg => gg.rect(x - 26, y - h - 3, 52, 10), 1.6); tText(g, label, x, y - h + 2, 10, TOON.ink, '"Bungee"', 'center', 400); }
}
const PEA = (g, x, y) => { tEllipse(g, x + 6, y - 16, 12, 12, '#7ed957', 3); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 2, y - 20, 3.4, 0, 6.2832); g.fill(); };
function peaTub(g, x, y, k = 1) { g.save(); g.translate(x, y); g.scale(k, k); tub(g, 0, 0, 132, 70, '#4aa3ff', (gg) => PEA(gg, 0, 0), null); g.restore(); }
const MASH = (g, x, y, w, h) => { g.fillStyle = '#f6e7b8'; g.fillRect(x - w / 2, y - h * .55, w, h); g.fillStyle = '#c98a4a'; g.beginPath(); g.ellipse(x + 8, y - h * .5, w * .25, 6, 0, 0, 6.2832); g.fill(); };
const STUFF = (g, x, y, w, h) => { g.fillStyle = '#b77a3f'; g.fillRect(x - w / 2, y - h * .5, w, h); g.fillStyle = '#7a4b22'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x - w / 2 + 8 + i * w / 6, y - h * .42 + (i % 2) * 6, 4, 0, 6.2832); g.fill(); } };
const PIE = (g, x, y, w, h) => { g.fillStyle = '#e48a2c'; g.fillRect(x - w / 2, y - h * .5, w, h); g.fillStyle = '#f2c27a'; g.fillRect(x - w / 2, y - h * .55, w, 6); };
const CRAN = (g, x, y, w, h) => { g.fillStyle = '#c4123a'; g.fillRect(x - w / 2, y - h * .6, w, h); };
function tower(g, x, y, k = 1, sway = 0) {                    // the MOM'S tower: five containers, the top one labelled
  g.save(); g.translate(x, y); g.rotate(sway); g.scale(k, k);
  const fills = [MASH, STUFF, PIE, CRAN, MASH], lids = ['#ff7a1a', '#29d3c3', '#ffd23f', '#ff4fa3', '#b9a6ff'];
  for (let i = 0; i < 5; i++) tub(g, (i % 2 ? 3 : -3), -i * 30, 76, 28, lids[i], fills[i], i === 4 ? "MOM'S" : null);
  g.restore();
}
function casserole(g, x, y, k = 1, glow = 1) {                // a casserole that glows green
  g.save(); g.translate(x, y); g.scale(k, k);
  if (glow > 0) { g.save(); g.globalAlpha = .55 * glow; const gr = g.createRadialGradient(0, -24, 4, 0, -24, 70); gr.addColorStop(0, 'rgba(160,255,120,.9)'); gr.addColorStop(1, 'rgba(160,255,120,0)'); g.fillStyle = gr; g.fillRect(-80, -100, 160, 120); g.restore(); }
  tShape(g, '#9be86b', gg => gg.ellipse(0, -18, 44, 10, 0, 0, 6.2832), 2.6);
  for (const [bx, by] of [[-18, -22], [10, -16], [24, -24]]) tEllipse(g, bx, by, 5, 4, '#d8ff9a', 2);
  tShape(g, '#f4f1ea', gg => { gg.moveTo(-50, -18); gg.lineTo(50, -18); gg.lineTo(42, 0); gg.lineTo(-42, 0); gg.closePath(); }, 3);
  tShape(g, '#f4f1ea', gg => gg.roundRect(-60, -20, 12, 8, 3), 2.4); tShape(g, '#f4f1ea', gg => gg.roundRect(48, -20, 12, 8, 3), 2.4);
  g.restore();
}
function cranBowl(g, x, y, k = 1, boil = 0) {                 // Dennis's cranberry sauce: a glass bowl, no lid
  g.save(); g.translate(x, y); g.scale(k, k);
  const dome = 6 + boil * 16;
  tShape(g, '#c4123a', gg => { gg.moveTo(-34, -26); gg.quadraticCurveTo(0, -26 - dome * 2, 34, -26); gg.closePath(); }, 2.6);
  if (boil > .2) for (const [bx, s] of [[-12, 1], [8, 1.4], [20, .8]]) tEllipse(g, bx, -28 - dome * .8 * s, 4 * s * boil, 4 * s * boil, '#e23b4a', 2);
  tShape(g, 'rgba(200,230,255,.45)', gg => { gg.moveTo(-40, -30); gg.quadraticCurveTo(-38, 0, 0, 0); gg.quadraticCurveTo(38, 0, 40, -30); gg.closePath(); }, 3);
  g.save(); g.beginPath(); g.moveTo(-36, -27); g.quadraticCurveTo(-34, -3, 0, -3); g.quadraticCurveTo(34, -3, 36, -27); g.closePath(); g.clip(); g.fillStyle = '#c4123a'; g.fillRect(-40, -30, 80, 30); g.restore();
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-30, -22, 4, 14);
  g.restore();
}
function raeTub(g, x, y, k = 1, labelFront = true) {          // Rae's own leftovers: turkey, stuffing, mash; tape on the lid: RAE
  g.save(); g.translate(x, y); g.scale(k, k);
  tub(g, 0, 0, 104, 54, '#2b2244', (gg, xx, yy, w, h) => { STUFF(gg, -22, yy, 40, h); MASH(gg, 24, yy, 44, h); gg.fillStyle = '#e9c08a'; gg.beginPath(); gg.ellipse(4, yy - 26, 18, 9, .2, 0, 6.2832); gg.fill(); }, null);
  if (labelFront) { tShape(g, '#f4e3b5', gg => gg.rect(-30, -50, 60, 18), 2); tText(g, 'RAE', 0, -41, 15, TOON.ink, '"Bungee"', 'center', 400); }
  g.restore();
}

// ---------------------------------------------------------------- the microwave
function microwaveState(t) {
  const s = { run: false, light: 0, green: 0, door: 0, item: null, time: '11:47', splat: t >= TL.SPLAT ? Math.min(1, (t - TL.SPLAT) / .08) : 0, ding: false };
  for (let i = 0; i < 3; i++) {                               // the montage: three cuts, each runs and dings
    const a = M0 + i * MONT, b = a + MONT;
    if (t >= a && t < b) { s.item = ['pea', 'tower', 'cass'][i]; s.run = t < b - .18; s.light = s.run ? 1 : .25; s.green = i === 2 ? (s.run ? 1 : .4) : 0; s.time = '0:0' + Math.max(0, Math.ceil((b - .18 - t) * 3)); s.phase = (t - a) * 4; }
  }
  if (t >= TL.OPEN1 - .05 && t < TL.SHUT) s.door = smooth(TL.OPEN1 - .05, TL.OPEN1 + .15, t) * (1 - smooth(TL.SHUT - .2, TL.SHUT, t));
  if (t >= TL.IN) s.item = 'cran';
  if (t >= TL.START && t < TL.SPLAT + .1) { s.run = true; s.light = 1; s.time = '0:' + String(Math.max(0, Math.ceil(TL.SPLAT + 1.8 - t))).padStart(2, '0'); s.phase = (t - TL.START) * 3; s.boil = smooth(TL.START + .6, TL.SPLAT, t); }
  if (t >= TL.SPLAT + .1) { s.item = 'cranSplat'; s.time = 'OOPS'; }
  if (t >= V.L8.t) { s.item = 'rae'; s.run = t < TL.DING; s.light = s.run ? 1 : .3; s.phase = (t - V.L8.t) * 3; s.time = s.run ? '0:' + String(Math.max(0, Math.ceil((TL.DING - t) * 2))).padStart(2, '0') : '0:00'; }
  if (t >= TL.DING) { s.ding = t < TL.DING + .4; s.door = smooth(TL.OPEN2, TL.OPEN2 + .25, t); }
  if (t >= TL.RAEOUT) s.item = s.item === 'rae' ? 'empty' : s.item;
  return s;
}
function drawItem(g, s, t) {
  const sw = Math.sin(s.phase || 0), x = INSIDE.x + sw * 10, y = INSIDE.y;
  if (s.item === 'pea') peaTub(g, x, y, .8);
  else if (s.item === 'tower') { g.save(); g.translate(x, y); g.rotate(sw * .05); g.scale(.95, .62); tower(g, 0, 0, 1); g.restore(); }
  else if (s.item === 'cass') casserole(g, x, y, .9, 1);
  else if (s.item === 'cran') cranBowl(g, x, y, .95, s.boil || 0);
  else if (s.item === 'cranSplat') { g.save(); g.translate(INSIDE.x, y); tShape(g, 'rgba(200,230,255,.45)', gg => { gg.moveTo(-38, -28); gg.quadraticCurveTo(-36, 0, 0, 0); gg.quadraticCurveTo(36, 0, 38, -28); gg.closePath(); }, 3); g.restore(); }
  else if (s.item === 'rae') raeTub(g, x, y, .9, false);
}
function drawMicrowave(g, t) {
  const s = microwaveState(t), shake = s.splat > 0 && t < TL.SPLAT + .25 ? Math.sin(t * 90) * 3 * (1 - (t - TL.SPLAT) / .25) : 0;
  g.save(); g.translate(shake, 0);
  tShape(g, '#e9ebf3', gg => gg.roundRect(MW.x0, MW.top, MW.x1 - MW.x0, CT - MW.top, 10), 4);
  tShade(g, gg => gg.roundRect(MW.x0, MW.top, MW.x1 - MW.x0, CT - MW.top, 10), '#c7cbdb', gg => gg.rect(MW.x0, CT - 20, MW.x1 - MW.x0, 20));
  // the cavity (seen through the glass, or open)
  const cx0 = DOOR.x0 + 8, cx1 = DOOR.x1 - 8;
  g.save(); g.beginPath(); g.rect(cx0, DOOR.wy0, cx1 - cx0, DOOR.wy1 - DOOR.wy0); g.clip();
  g.fillStyle = s.light > .5 ? (s.green ? '#9dff7a' : '#ffe9a8') : '#5d5a70'; g.fillRect(cx0, DOOR.wy0, cx1 - cx0, DOOR.wy1 - DOOR.wy0);
  if (s.light > .5) { const gr = g.createRadialGradient(INSIDE.x, DOOR.wy0 + 20, 6, INSIDE.x, DOOR.wy0 + 20, 120); gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(cx0, DOOR.wy0, cx1 - cx0, DOOR.wy1 - DOOR.wy0); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cx0, DOOR.wy1 - 24, cx1 - cx0, 24);
  tShape(g, 'rgba(255,255,255,.55)', gg => gg.ellipse(INSIDE.x, INSIDE.y + 2, 54, 9, 0, 0, 6.2832), 2.4);   // the turntable
  drawItem(g, s, t);
  if (s.splat > 0) {                                          // the splat: cranberry all over the inside
    g.fillStyle = '#c4123a';
    for (const [bx, by, r] of [[-50, -70, 16], [-20, -84, 22], [16, -64, 18], [44, -80, 14], [-38, -40, 12], [30, -36, 15], [0, -50, 20], [-56, -20, 10], [52, -52, 11]]) { g.beginPath(); g.ellipse(INSIDE.x + bx, INSIDE.y + by, r * s.splat, r * .85 * s.splat, 0, 0, 6.2832); g.fill(); }
    const drip = Math.min(1, Math.max(0, t - TL.SPLAT) / 2.5);
    for (const [bx, by, l] of [[-46, -60, 30], [-14, -70, 44], [24, -52, 26], [46, -70, 34]]) g.fillRect(INSIDE.x + bx - 3, INSIDE.y + by, 6, l * drip);
  }
  g.restore();
  // the door: closed (glass with a mesh), or swung open on its left hinge toward us
  const th = s.door * 1.9, ex = DOOR.x0 + (DOOR.x1 - DOOR.x0) * Math.cos(th), ey = 14 * Math.sin(th);
  if (s.door < .02) {
    g.save(); g.beginPath(); g.rect(cx0, DOOR.wy0, cx1 - cx0, DOOR.wy1 - DOOR.wy0); g.clip();
    g.fillStyle = 'rgba(20,14,40,.32)'; g.fillRect(cx0, DOOR.wy0, cx1 - cx0, DOOR.wy1 - DOOR.wy0);
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = DOOR.wy0; yy < DOOR.wy1; yy += 6) for (let xx = cx0 + (yy / 6 % 2) * 3; xx < cx1; xx += 6) g.fillRect(xx, yy, 2, 2);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(cx0 + 10, DOOR.wy0); g.lineTo(cx0 + 40, DOOR.wy0); g.lineTo(cx0 + 4, DOOR.wy1); g.lineTo(cx0, DOOR.wy1); g.closePath(); g.fill();
    g.restore();
    tShape(g, null, gg => gg.roundRect(DOOR.x0, MW.top + 6, DOOR.x1 - DOOR.x0, CT - MW.top - 14, 8), 3.4);
    tShape(g, '#c7cbdb', gg => gg.roundRect(DOOR.x1 - 12, MW.top + 30, 6, 70, 3), 2.2);   // the handle
  } else {
    tShape(g, '#3b3552', gg => gg.rect(DOOR.x0, MW.top + 6, DOOR.x1 - DOOR.x0, 4), 0);
    tShape(g, Math.cos(th) > 0 ? '#e9ebf3' : '#d4d7e4', gg => { gg.moveTo(DOOR.x0, MW.top + 6); gg.lineTo(ex, MW.top + 6 - ey); gg.lineTo(ex, CT - 8 + ey); gg.lineTo(DOOR.x0, CT - 8); gg.closePath(); }, 3.4);
  }
  // the panel: a display and the buttons
  tShape(g, '#1a2a3a', gg => gg.roundRect(PANEL.x - 20, PANEL.disp - 10, 40, 22, 4), 2.4);
  tText(g, s.time, PANEL.x, PANEL.disp + 1.5, s.time.length > 4 ? 11 : 13, s.time === 'OOPS' ? '#ff6b6b' : '#7ef0a0', '"Bungee"', 'center', 400);
  for (let i = 0; i < 9; i++) tShape(g, '#c7cbdb', gg => gg.roundRect(PANEL.x - 17 + (i % 3) * 13, PANEL.disp + 22 + Math.floor(i / 3) * 11, 9, 7, 2), 1.6);
  tShape(g, '#8fd65a', gg => gg.roundRect(PANEL.x - 17, PANEL.start - 8, 34, 14, 4), 2.2);
  tShape(g, '#c7cbdb', gg => gg.roundRect(PANEL.x - 17, PANEL.release - 6, 34, 10, 3), 2);
  if (s.green > 0 && s.run) { g.save(); g.globalAlpha = .5 * s.green; g.shadowColor = '#9dff7a'; g.shadowBlur = 30; g.strokeStyle = '#c8ff9a'; g.lineWidth = 6; g.strokeRect(cx0 - 4, DOOR.wy0 - 4, cx1 - cx0 + 8, DOOR.wy1 - DOOR.wy0 + 8); g.restore(); }
  g.restore();
}
// MAGS's price board, on his words
function priceBoard(g, t) {
  const tags = [[TL.FEE, 426, 'MICROWAVE', '$5'], [TL.GRAT, 656, 'GRATITUDE', '$3.99']];
  for (const [t0, x, a, b] of tags) {
    const k = clamp((t - t0) / .2); if (k <= 0 || t > endOf('L3') + .6) continue;
    g.save(); g.translate(x, 372); g.scale(.6 + .4 * k, .6 + .4 * k); g.globalAlpha = k;
    tShape(g, 'rgba(255,125,140,.2)', gg => gg.roundRect(-104, -58, 208, 116, 14), 3.4);
    g.strokeStyle = '#ff7d8c'; g.lineWidth = 2.4; g.strokeRect(-94, -48, 188, 96);
    tText(g, a, 0, -22, 22, '#ffd0d4', '"Bungee"', 'center', 400);
    tText(g, b, 0, 16, 40, '#ffffff', '"Bungee"', 'center', 400);
    if (b === '$3.99') { g.strokeStyle = '#ffffff'; g.lineWidth = 2.6; g.beginPath(); g.roundRect(64, -6, 22, 30, 4); g.stroke(); g.fillStyle = '#ff7d8c'; g.beginPath(); g.moveTo(75, 14); g.bezierCurveTo(66, 6, 70, 0, 75, 5); g.bezierCurveTo(80, 0, 84, 6, 75, 14); g.fill(); }
    g.restore();
  }
}
// Pip's Friendsgiving: the tablecloth on the counter front, a paper garland on the wall, the gravy boat
const CLOTHX = [0, MW.x0 - 2];
function drawCloth(g, t) {
  const k = smooth(TL.CLOTH + .4, TL.CLOTH + .6, t); if (k <= 0) return;
  const xa = lerp(PIP.x - 170, CLOTHX[0], k), xb = lerp(PIP.x + 170, CLOTHX[1], k), y0 = CT + 4, y1 = lerp(CT + 60, CT + 150, k);
  const edge = gg => { gg.moveTo(xa, y0); gg.lineTo(xb, y0); gg.lineTo(xb, y1); for (let x = xb; x > xa; x -= 30) gg.quadraticCurveTo(x - 15, y1 + 16, x - 30, y1); gg.closePath(); };
  tShape(g, '#fbf1dc', edge);
  g.save(); g.beginPath(); edge(g); g.clip();
  g.fillStyle = 'rgba(255,122,26,.5)'; for (let x = 0; x < W; x += 60) g.fillRect(x, y0, 22, y1 - y0 + 20);
  g.fillStyle = 'rgba(214,90,12,.35)'; for (let y = y0 + 20; y < y1 + 10; y += 50) g.fillRect(0, y, W, 16);
  g.restore(); tShape(g, null, edge, 3.4);
}
function drawGarland(g, t) {
  const k = smooth(TL.CLOTH + .3, TL.CLOTH + .55, t); if (k <= 0) return;
  const L = 'FRIENDSGIVING', x0 = 118, x1 = 458, y = 612 - (1 - k) * 60, n = L.length;
  g.save(); g.globalAlpha = Math.min(1, k * 1.5);
  g.strokeStyle = TOON.ink; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + 26, x1, y); g.stroke();
  const cols = ['#ff7a1a', '#ffd23f', '#e23b4a', '#8fd65a'];
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, x = lerp(x0, x1, u), yy = y + 26 * 4 * u * (1 - u) * .5 * 2;
    tShape(g, cols[i % 4], gg => { gg.moveTo(x - 12, yy); gg.lineTo(x + 12, yy); gg.lineTo(x, yy + 32); gg.closePath(); }, 2.2);
    tText(g, L[i], x, yy + 11, 13, TOON.ink, '"Bungee"', 'center', 400);
  }
  g.restore();
}
function gravyBoat(g, x, y) {
  tShape(g, '#fbf7ff', gg => { gg.moveTo(x - 30, y - 22); gg.quadraticCurveTo(x - 28, y, x, y); gg.quadraticCurveTo(x + 24, y, x + 40, y - 26); gg.lineTo(x + 18, y - 22); gg.closePath(); }, 3);
  tShape(g, '#8a5a2c', gg => gg.ellipse(x - 2, y - 21, 26, 4, 0, 0, 6.2832), 2);
  tCurve(g, x - 30, y - 20, x - 44, y - 14, x - 30, y - 6, 3);
}
function brightCapBox(g) {                                     // easter egg, never explained: a box on the shelf behind Rae
  const x = 864, y = 816;
  tShape(g, '#fbf7ff', gg => gg.roundRect(x, y, 84, 84, 6), 3.2);
  tShape(g, '#2f7bff', gg => gg.rect(x, y + 50, 84, 34), 0); tShape(g, null, gg => gg.roundRect(x, y, 84, 84, 6), 3.2);
  tText(g, 'FREE!', x + 42, y + 18, 20, '#e23b4a', '"Bungee"', 'center', 400);
  tText(g, 'BrightCap', x + 42, y + 38, 13, TOON.ink, '"Fredoka"', 'center', 600);
  tEllipse(g, x + 42, y + 67, 11, 11, '#ffd23f', 2.4);
}

// ---------------------------------------------------------------- the customers on the counter
function robot(g, t) {                                         // the lonely little robot: one wheel, a screen face
  const x = atTable(t) ? ROBOT.x : ROBOT.q, b = Math.sin(t * 2.3) * 1.5, talk = talkLevel('ROBOT', t), sad = t >= V.L1.t + 1.9 && t < TL.CLOTH + .5;
  const heart = t >= V.L9.t - .1 && t < V.L10.t + 1.2;
  g.save(); g.translate(x, CT);
  tEllipse(g, 0, -15, 15, 15, '#3b3552', 3.2); tEllipse(g, 0, -15, 5, 5, '#c7cbdb', 2);
  tShape(g, '#9aa0b8', gg => gg.roundRect(-34, -92 + b, 68, 66, 12), 3.4);
  tShape(g, '#c7cbdb', gg => gg.rect(-8, -106 + b, 16, 16), 2.6);
  tShape(g, '#c7cbdb', gg => gg.roundRect(-48, -182 + b, 96, 78, 14), 3.6);
  tShape(g, '#1a2a3a', gg => gg.roundRect(-38, -172 + b, 76, 58, 8), 2.6);
  tLine(g, [18, -182 + b, 26, -204 + b], 3); tEllipse(g, 27, -208 + b, 6, 6, heart ? '#ff6b9a' : '#ffd23f', 2.4);
  const ey = -150 + b, col = '#7ef0ff';
  if (heart) { g.fillStyle = '#ff6b9a'; g.beginPath(); g.moveTo(0, ey + 22); g.bezierCurveTo(-30, ey + 2, -18, ey - 22, 0, ey - 6); g.bezierCurveTo(18, ey - 22, 30, ey + 2, 0, ey + 22); g.fill(); }
  else {
    g.fillStyle = col;
    if (sad) { g.fillRect(-22, ey - 2, 14, 4); g.fillRect(8, ey - 2, 14, 4); g.fillRect(-26, ey - 10, 10, 3); g.fillRect(16, ey - 10, 10, 3); }
    else if (blinkAt(4, t)) { g.fillRect(-22, ey, 14, 3); g.fillRect(8, ey, 14, 3); }
    else { g.fillRect(-20, ey - 8, 10, 12); g.fillRect(10, ey - 8, 10, 12); }
    const mw = 18 + talk * 6, mh = 3 + talk * 10;
    if (sad && !talk) { g.fillRect(-10, ey + 18, 20, 3); g.fillRect(-14, ey + 21, 4, 3); g.fillRect(10, ey + 21, 4, 3); }
    else g.fillRect(-mw / 2, ey + 16, mw, mh);
  }
  // arms to the big container in front
  const ty = -58 + b;
  tTube(g, [-32, -80 + b, -54, -66 + b, -50, ty + 4], 12, '#9aa0b8'); tTube(g, [32, -80 + b, 54, -66 + b, 50, ty + 4], 12, '#9aa0b8');
  peaTub(g, 0, ty + 34, .78);
  tEllipse(g, -48, ty + 6, 9, 8, '#c7cbdb', 2.4); tEllipse(g, 48, ty + 6, 9, 8, '#c7cbdb', 2.4);
  g.restore();
}
function blob(g, t) {                                          // a purple jelly with the tower of containers mom packed
  const x = atTable(t) ? BLOB.x : BLOB.q, h0 = V.L8.t + .9, hop = t >= h0 && t < h0 + .65 ? hopPose((t - h0) / .65, 26) : { dy: 0, sy: 1, sx: 1 };   // a happy hop at "thankful"
  const sway = Math.sin(t * 3.1) * .04 + (hop.dy < 0 ? Math.sin(t * 12) * .05 : 0);
  g.save(); g.translate(x, CT + hop.dy); g.scale(hop.sx, hop.sy);
  const body = gg => { gg.moveTo(-46, 0); gg.bezierCurveTo(-52, -40, -34, -78, 0, -78); gg.bezierCurveTo(34, -78, 52, -40, 46, 0); gg.closePath(); };
  tShape(g, '#b06cf0', body); tShade(g, body, '#8a4ad0', gg => gg.rect(22, -90, 40, 92)); tShape(g, null, body, 3.6);
  const lookR = t >= V.L4.t ? 1 : 0;
  for (const sx of [-1, 1]) { tEllipse(g, sx * 14, -52, 9, 11, '#fff', 2.6); g.fillStyle = TOON.ink; g.beginPath(); g.arc(sx * 14 + lookR * 3, -50, 4.5, 0, 6.2832); g.fill(); }
  tCurve(g, -8, -32, 0, -26, 8, -32, 2.6);
  // stubby arms up around the tower
  tTube(g, [-40, -30, -52, -50, -36, -76], 12, '#b06cf0'); tTube(g, [40, -30, 52, -50, 36, -76], 12, '#b06cf0', '#8a4ad0');
  tower(g, 0, -70, .9, sway);
  tEllipse(g, -36, -78, 8, 7, '#b06cf0', 2.4); tEllipse(g, 36, -78, 8, 7, '#b06cf0', 2.4);
  g.restore();
}
function puff(g, t) {                                          // a floating puff with a glowing casserole
  const x = atTable(t) ? PUFF.x : PUFF.q, y = CT - 56 + Math.sin(t * 2.1) * 5;
  g.save(); g.translate(x, y);
  const body = gg => { gg.moveTo(-34, 18); gg.bezierCurveTo(-44, -30, -26, -64, 0, -64); gg.bezierCurveTo(26, -64, 44, -30, 34, 18); for (let i = 0; i < 4; i++) gg.quadraticCurveTo(34 - i * 17 - 8, 30, 34 - (i + 1) * 17, 18); gg.closePath(); };
  tShape(g, '#e8fff4', body); tShade(g, body, '#bfeedd', gg => gg.rect(16, -70, 30, 100)); tShape(g, null, body, 3.4);
  tEllipse(g, -11, -36, 5, 7, TOON.ink, 0); tEllipse(g, 11, -36, 5, 7, TOON.ink, 0);
  tEllipse(g, 0, -20, 5, 4, '#4a1a20', 2);
  tTube(g, [-30, -6, -40, 4, -34, 14], 10, '#e8fff4'); tTube(g, [30, -6, 40, 4, 34, 14], 10, '#e8fff4', '#bfeedd');
  casserole(g, 0, 26, .62, 1);
  tEllipse(g, -34, 14, 7, 6, '#e8fff4', 2.2); tEllipse(g, 34, 14, 7, 6, '#e8fff4', 2.2);
  g.restore();
}
// Dennis (as in VM5 and VM9): stalks, moustache, cap; his arms carry the bowl or hang
function drawDennis11(g, t, x, y, s, o = {}) {
  const D = { body: '#8fd65a', bodyS: '#62ad38', belly: '#c6f29c', spot: '#6db33f', stache: '#7a4e2c', stacheS: '#5a3720', cap: '#e23b4a', capS: '#b52634', panel: '#fbf7ff' };
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.fillStyle = 'rgba(170,240,120,.6)'; g.beginPath(); g.ellipse(0, 4, 130, 12, 0, 0, 6.2832); g.fill();
  const topY = -268, look = o.look ?? 0, eyes = [];
  for (const side of [-1, 1]) {
    const dr = o.droop || 0, a = side * dr * 2.25;
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
  const ma = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0;
  if (ma) tEllipse(g, 0, -176, 10 + ma * 6, 4 + ma * 12, '#3a1a20', 3.2);
  else if (o.droop > .3) tCurve(g, -16, -172, 0, -180, 16, -172, 3.8);
  else tCurve(g, -16, -180, 0, -170, 16, -180, 3.8);
  const st = gg => { gg.moveTo(0, -206); gg.bezierCurveTo(-14, -220, -40, -214, -52, -196); gg.bezierCurveTo(-40, -200, -28, -196, -18, -190); gg.bezierCurveTo(-10, -186, -4, -190, 0, -194); gg.bezierCurveTo(4, -190, 10, -186, 18, -190); gg.bezierCurveTo(28, -196, 40, -200, 52, -196); gg.bezierCurveTo(40, -214, 14, -220, 0, -206); gg.closePath(); };
  tShape(g, D.stache, st); tShade(g, st, D.stacheS, gg => gg.rect(-60, -200, 120, 14));
  // stubby arms: to the bowl (local point o.bowl) or at his sides
  if (o.bowl) {
    const bx = o.bowl.x, by = o.bowl.y;
    tTube(g, [-104, -60, (bx - 104) / 2 - 20, (by - 60) / 2 + 10, bx - 36, by - 6], 24, D.body);
    tTube(g, [104, -60, (bx + 104) / 2 + 20, (by - 60) / 2 + 10, bx + 36, by - 6], 24, D.body, D.bodyS);
    g.restore();
    const k = s / 100;
    cranBowl(g, x + bx * k, y + by * k, 1.05);
    tEllipse(g, x + (bx - 40) * k, y + (by - 8) * k, 13 * k, 11 * k, D.body, 3); tEllipse(g, x + (bx + 40) * k, y + (by - 8) * k, 13 * k, 11 * k, D.body, 3);
  } else {
    tTube(g, [-104, -60, -112, -30, -104, -12], 24, D.body);
    tTube(g, [104, -60, 112, -30, 104, -12], 24, D.body, D.bodyS);
    g.restore();
  }
  for (const [ex, ey, side, dr] of eyes) {
    const k = s / 100, X = x + ex * k, Y = y + ey * k;
    g.save(); g.translate(X, Y); g.scale(k, k);
    tEllipse(g, 0, 0, 17, 18, TOON.white, 3.6);
    const pdy = 6 + dr * 5;
    g.fillStyle = TOON.ink; g.beginPath(); g.arc(look * 5 - side * 2, pdy, 7.5, 0, 6.2832); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(look * 5 - side * 2 - 2.5, pdy - 3, 2.4, 0, 6.2832); g.fill();
    if (dr > .3) tLine(g, [-side * 14, -12, side * 12, -20], 3.6); else tCurve(g, -13, -13, 0, -22, 13, -13, 3.6);
    g.restore();
  }
}
function dennis(g, t) {
  if (t < TL.DEN_IN) return;
  const k = smooth(TL.DEN_IN, TL.DEN_IN + .7, t), out = smooth(TL.DEN_OUT, TL.DEN_OUT + 1.1, t);
  if (out >= 1) return;
  const x = lerp(1350, DEN.x, k) + out * 420, s = DEN.s / 100;
  const o = { mouth: mouthFor('DENNIS', t), look: t >= TL.TAKE ? -1.2 : -.6, droop: smooth(TL.SPLAT + .25, TL.SPLAT + .6, t) };
  if (t < TL.TAKE) {                                         // the bowl at his belly; lifted onto the counter at "The usual!"
    const up = smooth(TL.LIFT, TL.LIFT + .3, t);
    o.bowl = { x: lerp(0, (BOWL_UP.x - x) / s, up), y: lerp(-40, (BOWL_UP.y - DEN.y) / s, up) };
  }
  drawDennis11(g, t, x, DEN.y, DEN.s, o);
}

// ---------------------------------------------------------------- Pip
function pipArm(g, side, hx, hy, open, shade) {               // two bones of fixed length: the elbow drops outward when the hand comes close
  const P = TOON.pip, sx = side * 52, sy = -88, L1 = 54, L2 = 56, dx = hx - sx, dy = hy - sy, d = Math.max(1, Math.hypot(dx, dy));
  let ex, ey;
  if (d >= L1 + L2) { ex = sx + dx * L1 / d; ey = sy + dy * L1 / d; }
  else {
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), bx = sx + dx * a / d, by = sy + dy * a / d;
    const p1 = [bx - dy / d * h, by + dx / d * h], p2 = [bx + dy / d * h, by - dx / d * h];
    const score = q => q[1] + side * q[0] * .6;
    [ex, ey] = score(p1) > score(p2) ? p1 : p2;
  }
  const cx = 2 * ex - (sx + hx) / 2, cy = 2 * ey - (sy + hy) / 2;
  tTube(g, [sx, sy, cx, cy, hx, hy], 20, P.shirt, shade ? P.shirtS : null);
  tHand(g, hx, hy, 9, P.skin, P.skinS, open);
}
const pipBob = t => Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0);
function pipX(t) { return t < TL.PIPW0 ? TL.PIP_X0 : travel(t, TL.PIPW0, TL.PIP_X0, TL.PIP_X1, TL.PIP_STEP, TL.PIP_SPS).x; }   // after the ding she steps over toward Rae
const toPip = (p, bob, px) => ({ x: (p.x - px) / (PIP.s / 100), y: (p.y - CT - bob) / (PIP.s / 100) });
function pipState(t) {
  const st = { expr: 'grin', wave: false, mode: null };
  if (t >= V.L1.t + 1.9) st.expr = 'sad';
  if (t >= TL.CLOTH + .2) st.expr = 'grin';
  if (t >= V.L4.t) st.expr = 'gasp';
  if (t >= endOf('L4') + .3) st.expr = 'grin';
  if (t >= TL.SPLAT) st.expr = 'gasp';
  if (t >= V.L8.t) { st.expr = 'grin'; st.wave = t < endOf('L8') + .2; }
  if (t >= V.L11.t) { st.wave = t < endOf('L11') + .2; }
  if (t >= V.L12.t + .3) st.expr = 'worried';
  if (t >= TL.DING) st.expr = 'gasp';
  if (t >= V.L13.t + .2) st.expr = 'grin';
  if (t >= TL.CLOTH && t < TL.CLOTH + .75) st.mode = 'cloth';
  if (t >= TL.GRAVY - .45) st.mode = 'gravy';
  st.blink = blinkAt(3, t);
  return st;
}
function drawPipBack(g, t) {
  const st = pipState(t), bob = pipBob(t);
  const o = { expr: st.expr, mouth: mouthFor('PIP', t), blink: st.blink, wave: st.wave, wavePhase: t * 9 };
  if (st.mode) o.arms = false;
  const px = pipX(t), tr = travel(t, TL.PIPW0, TL.PIP_X0, TL.PIP_X1, TL.PIP_STEP, TL.PIP_SPS);
  if (tr.moving) return drawTraveller(g, (gg, x, y, s2, oo) => drawPip2(gg, x, y, s2, oo), tr.x, CT + 10, PIP.s, Object.assign({}, o, { wave: false }), walkBob(tr.dist, TL.PIP_STEP, 10), 1);
  drawPip2(g, px, CT + bob, PIP.s, o);
  if (st.mode === 'gravy') { g.save(); g.translate(px, CT + bob); g.scale(PIP.s / 100, PIP.s / 100); pipArm(g, -1, -18, -13, false, false); g.restore(); }
  if (st.mode === 'cloth') {                                  // both hands up with the folded cloth at her chest, then a flick out to the sides
    const u = (t - TL.CLOTH) / .75, up = smooth(0, .35, u), fl = smooth(.42, .6, u);
    const hx = lerp(lerp(26, 34, up), 92, fl), hy = lerp(lerp(-20, -108, up), -30, fl);
    g.save(); g.translate(PIP.x, CT + bob); g.scale(PIP.s / 100, PIP.s / 100);
    if (fl < .98) { const top = hy - 2, drop = 46 + fl * 30;
      tShape(g, '#fbf1dc', gg => { gg.moveTo(-hx, top); gg.lineTo(hx, top); gg.lineTo(hx + 4, top + drop); gg.quadraticCurveTo(0, top + drop + 10, -hx - 4, top + drop); gg.closePath(); }, 3);
      g.fillStyle = 'rgba(255,122,26,.5)'; for (let x = -hx + 8; x < hx - 6; x += 22) g.fillRect(x, top + 2, 8, drop); }
    for (const sd of [-1, 1]) { const ex = sd * lerp(74, 98, fl), ey = lerp(-62, -58, fl);
      tTube(g, [sd * 52, -88, ex, ey, sd * hx, hy], 20, TOON.pip.shirt, sd > 0 ? TOON.pip.shirtS : null); tHand(g, sd * hx, hy, 9, TOON.pip.skin, TOON.pip.skinS); }
    g.restore();
  }
}
function drawPipFront(g, t) {                                 // her right arm with the gravy boat, in front of the counter-top things
  const st = pipState(t); if (st.mode !== 'gravy') return;
  const bob = pipBob(t), s = PIP.s / 100;
  const k1 = 1, k2 = smooth(TL.GRAVY - .45, TL.GRAVY + .1, t);   // she brought the gravy over with her
  const px = pipX(t), rest = { x: px + 18 * s, y: CT - 13 * s };
  const p = lp({ x: rest.x + 20, y: rest.y - 40 }, GRAVY_OUT, k2), L = toPip(p, bob, px);
  g.save(); g.translate(px, CT + bob); g.scale(s, s); pipArm(g, 1, L.x, L.y, false, true); g.restore();
  if (k1 >= 1) { g.save(); g.translate(p.x + 30, p.y + 30); g.scale(1.5, 1.5); gravyBoat(g, 0, 0); g.restore(); tHand(g, p.x, p.y, 9 * s, TOON.pip.skin, TOON.pip.skinS); }   // she holds it by the handle
}

// ---------------------------------------------------------------- Rae: deadpan; her right arm does the microwave
const toRae = p => ({ x: (p.x - RAE.x) / (RAE.s / 100), y: (p.y - CT) / (RAE.s / 100) });
function raeArmR(g, hx, hy) {                                  // her right arm (screen right) to a local point, the same build as the rig's
  const R = TOON.rae, sx = 58, sy = -122, L1 = 60, L2 = 62, dx = hx - sx, dy = hy - sy, d = Math.max(1, Math.hypot(dx, dy));
  let ex, ey;
  if (d >= L1 + L2) { ex = sx + dx * L1 / d; ey = sy + dy * L1 / d; }
  else { const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), bx = sx + dx * a / d, by = sy + dy * a / d;
    const p1 = [bx - dy / d * h, by + dx / d * h], p2 = [bx + dy / d * h, by - dx / d * h]; [ex, ey] = (p1[1] + p1[0] * .6) > (p2[1] + p2[0] * .6) ? p1 : p2; }
  tTube(g, [sx, sy, 2 * ex - (sx + hx) / 2, 2 * ey - (sy + hy) / 2, hx, hy], 24, R.hood, R.hoodS);
  tHand(g, hx, hy, 9.5, R.skin, R.skinS);
}
function raeHand(t) {                                          // world target of her right hand, or null (at rest, the rig's own arm)
  const rest = { x: RAE.x + 22 * 1.9, y: CT - 19 * 1.9 }, inside = { x: INSIDE.x + 10, y: INSIDE.y - 18 }, startB = { x: PANEL.x, y: PANEL.start }, rel = { x: PANEL.x, y: PANEL.release };
  const bowl = { x: BOWL_UP.x, y: BOWL_UP.y - 10 };
  if (t >= TL.TAKE - .3 && t < TL.START + .45) {
    let p = lp(rest, bowl, smooth(TL.TAKE - .3, TL.TAKE, t));
    if (t >= TL.TAKE) p = lp(bowl, inside, smooth(TL.TAKE + .05, TL.IN, t));
    if (t >= TL.IN) p = lp(inside, { x: DOOR.x0 + 30, y: CT - 70 }, smooth(TL.IN, TL.SHUT - .1, t));
    if (t >= TL.SHUT - .1) p = lp({ x: DOOR.x0 + 30, y: CT - 70 }, startB, smooth(TL.SHUT - .1, TL.START - .02, t));
    if (t >= TL.START) p = lp(startB, rest, smooth(TL.START + .1, TL.START + .45, t));
    return { p, bowl: t >= TL.TAKE && t < TL.IN };
  }
  if (t >= TL.OPEN2 - .35) {
    let p = lp(rest, rel, smooth(TL.OPEN2 - .35, TL.OPEN2, t));
    if (t >= TL.OPEN2) p = lp(rel, inside, smooth(TL.OPEN2 + .1, TL.RAEOUT, t));
    if (t >= TL.RAEOUT) p = lp(inside, HOLD_RAE, smooth(TL.RAEOUT + .05, TL.RAEOUT + .5, t));
    return { p, tub: t >= TL.RAEOUT };
  }
  return null;
}
function raeState(t) {
  const o = { expr: 'deadpan', look: 1.5, blink: blinkAt(1, t), mouth: mouthFor('RAE', t) };
  if (t >= V.L5.t && t < M0) o.look = -1.6;                   // "Nothing is free." to Pip
  if (t >= TL.DEN_IN) o.look = 1.4;
  if (t >= TL.TAKE - .3) o.look = -.4;
  if (t >= V.L8.t) o.look = -1.4;
  if (t >= V.L12.t) o.look = -1.6;
  if (t >= TL.DING) o.look = -.2;
  if (t >= V.L13.t) o.look = -1.6;
  return o;
}
function drawRaeBack(g, t) {
  const o = raeState(t), h = raeHand(t);
  if (h) o.arms = false;
  drawRae2(g, RAE.x, CT + Math.sin(t * 1.7 + 1) * 1.5, RAE.s, o);
  if (h) {                                                     // her left arm stays on the counter (the rig's), with the scanner
    const R = TOON.rae;
    g.save(); g.translate(RAE.x, CT + Math.sin(t * 1.7 + 1) * 1.5); g.scale(RAE.s / 100, RAE.s / 100);
    tTube(g, [-58, -122, -76, -72, -72, -26, -44, -20, -12, -22], 24, R.hood); tHand(g, -8, -23, 9.5, R.skin, R.skinS);
    g.restore();
  }
}
function drawRaeFront(g, t) {
  const h = raeHand(t); if (!h) return;
  const y0 = CT + Math.sin(t * 1.7 + 1) * 1.5, L = toRae({ x: h.p.x, y: h.p.y - (y0 - CT) });
  g.save(); g.translate(RAE.x, y0); g.scale(RAE.s / 100, RAE.s / 100); raeArmR(g, L.x, L.y); g.restore();
  if (h.bowl) { cranBowl(g, h.p.x, h.p.y + 18, .95); tHand(g, h.p.x + 8, h.p.y + 8, 9.5 * 1.9, TOON.rae.skin, TOON.rae.skinS); }
  if (h.tub) { raeTub(g, h.p.x, h.p.y + 30, 1.1, true); tHand(g, h.p.x + 34, h.p.y + 22, 9.5 * 1.9, TOON.rae.skin, TOON.rae.skinS); }
}
function drawMagsHere(g, t) { drawMags(g, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) }); }

// ---------------------------------------------------------------- cameras
const CAM = Object.assign({}, VMCAM, {
  OPEN: [800, 1080, 2.0, 2.06],                                // frame 1: the robot's one pea first in the queue, the queue going on out of frame, Rae behind the microwave
  PIP_MED: [385, 1030, 1.72, 1.78],
  MAGS_MED: [MAGS.x, 268, 2.1, 2.2],                           // the clerks' hair stays out of the bottom
  RAE_CU: [830, 990, 2.35, 2.5],                               // the BrightCap box on the shelf at the right; the robot's screen above the subtitles
  MICRO_A: [790, 1217, 3.2, 3.32], MICRO_B: [790, 1217, 3.2, 3.32], MICRO_C: [790, 1217, 3.2, 3.32],   // the microwave window, three cuts (the robot's screen stays out)
  WIDE: [590, 1000, 1.18, 1.22],
  MICRO_RAE: [800, 1150, 2.2, 2.28],                           // Rae's face above, the microwave, Dennis's eyes at the right
  ROBOT_CU: [372, 1345, 3.2, 3.3],                             // the robot's screen; the frame top stays under Pip's chin
  RAE_MED: [760, 1010, 2.2, 2.26],                             // Rae with her leftovers, Pip's arm with the gravy from the left (her face just out)
  END_WIDE: [565, 862, 1.9, 1.92],                             // Pip (stepped over) and Rae; MAGS and his wall photo out of frame; faces under y 780 for the card
});

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  c.drawImage(STATIC.store, 0, 0);
  brightCapBox(c);
  drawBoardNumber(c, t, 1, 1, null);
  drawGarland(c, t);
  drawMagsHere(c, t);
  if (n === 'MAGS_MED') priceBoard(c, t);
  drawRaeBack(c, t);
  drawPipBack(c, t);
  c.drawImage(STATIC.front, 0, CT);
  drawCloth(c, t);
  drawRegister(c, false);
  drawMicrowave(c, t);
  puff(c, t);
  blob(c, t);
  robot(c, t);
  dennis(c, t);
  drawPipFront(c, t);
  drawRaeFront(c, t);
  glassStreaks(c, .9);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound: what we see, in the store's room)
const ms = [0, 1, 2].map(i => M0 + i * MONT);
window.EV = [
  { type: 'cloth', t: TL.CLOTH + .33, pan: -.25 },                                                 // the tablecloth flick
  { type: 'paper', t: TL.CLOTH + .32, pan: -.35 },                                                 // the paper garland drops
  ...ms.map(a => ({ type: 'hum', t: a, dur: MONT - .2, pan: .1 })),                                // three microwave runs (the montage)
  ...ms.map(a => ({ type: 'ding', t: a + MONT - .18, pan: .1 })),
  { type: 'rattle', t: ms[1] + .08, pan: .1 },                                                     // the tower scraping round
  { type: 'slide', t: TL.DEN_IN, pan: .5 },                                                        // Dennis slides in
  { type: 'open', t: TL.OPEN1, pan: .15 }, { type: 'bowl', t: TL.IN - .02, pan: .15 }, { type: 'shut', t: TL.SHUT, pan: .15 },
  { type: 'beep', t: TL.START, pan: .2 },
  { type: 'hum', t: TL.START + .05, dur: TL.SPLAT - TL.START - .05, pan: .15 },
  { type: 'splat', t: TL.SPLAT, pan: .15 },                                                        // the cranberry sauce
  { type: 'slide', t: TL.DEN_OUT, pan: .5, g: .6 },                                                // Dennis leaves, dripping
  { type: 'blorp', t: V.L8.t + .9 + .6, pan: -.15 },                                               // the jelly's happy hop lands
  { type: 'bed', fx: 'microwave_hum', t: V.L8.t, t1: TL.DING, g: -36, fin: .3, fout: .06 },        // Rae's leftovers in the microwave
  { type: 'ding', t: TL.DING, pan: .15 },
  { type: 'open', t: TL.OPEN2 + .05, pan: .15 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
