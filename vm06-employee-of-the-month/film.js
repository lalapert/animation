// Void Mart, episode 6: "Employee of the Month". Script: channel/scripts/VM06_employee_of_the_month.md
// Set: aisle 3 (channel/brand/sets.js). The shelf in front hides everyone below the waist (owner's movement choice 11/8:
// waist-up travel for Rae, two-feet hops for Pip, the shelf as the cover). The end wall carries 36 frames of MAGS.
// Deterministic: render(t) draws frame t; window.EV lists the sound cues.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));

// ---------------------------------------------------------------- layout (world coordinates of the aisle, 2160 wide)
const PIPW = AISLE.top + 230, RAEW = AISLE.top + 40, S = 190;    // waist lines: Pip is short, so standing only her head clears the shelf
const PX = 1480, RX1 = 1840, RX2 = 1760;                        // Pip's spot at the wall; Rae's first and second spot
const MG = { x: 1686, y: 230, s: 150 };                          // MAGS, hanging from the ceiling in front of the wall
const FR = { x0: 1262, y0: 480, dx: 124, dy: 116, w: 112, h: 104 };
const BOX = { x: 1640, w: 100, h: 76 };                          // the ballot box on the shelf top
const RUN = { x0: 420, x1: PX, step: 132 };
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const frameXY = i => i < 36 ? [FR.x0 + (i % 6) * FR.dx, FR.y0 + Math.floor(i / 6) * FR.dy] : [FR.x0 + 6 * FR.dx, FR.y0];   // the 37th starts a new column

// ---------------------------------------------------------------- the end wall (painted once over the fridges at the right end)
function paintWall() {
  const g = AISLE.back.getContext('2d');
  tShape(g, '#2c2160', gg => gg.rect(1236, 150, 960, AISLE.floor - 150), 4);
  for (let y = 190; y < AISLE.floor; y += 64) { g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 2; g.beginPath(); g.moveTo(1236, y); g.lineTo(2160, y); g.stroke(); }
  tShape(g, '#4a3192', gg => gg.rect(1226, 150, 18, AISLE.floor - 150), 3);
  tShape(g, TOON.orange, gg => gg.roundRect(FR.x0, 382, 6 * FR.dx - 12, 70, 12), 4);
  tText(g, 'EMPLOYEE OF THE MONTH', FR.x0 + (6 * FR.dx - 12) / 2, 418, 40, '#fff', '"Bungee"', 'center', 400);
}
// one framed photo: gold frame, a photo of MAGS (or the photo finish), the month on a strip
function drawEOM(g, i, x, y, photo = 'mags', rot = 0, nail = true) {
  const cx = x + FR.w / 2;
  if (nail) { tLine(g, [cx, y - 14, x + 18, y + 2], 1.8); tLine(g, [cx, y - 14, x + FR.w - 18, y + 2], 1.8); tEllipse(g, cx, y - 14, 4, 4, '#c9c3dc', 2); }
  g.save(); g.translate(cx, y + FR.h / 2); g.rotate(rot); g.translate(-cx, -(y + FR.h / 2));
  tShape(g, '#c9a24a', gg => gg.rect(x, y, FR.w, FR.h), 3.4);
  tShape(g, '#2b1858', gg => gg.rect(x + 8, y + 8, FR.w - 16, 64), 2.4);
  g.save(); g.beginPath(); g.rect(x + 8, y + 8, FR.w - 16, 64); g.clip();
  if (photo === 'finish') {
    const gr = g.createRadialGradient(cx, y + 40, 4, cx, y + 40, 60); gr.addColorStop(0, '#5a3fb0'); gr.addColorStop(1, '#2b1858'); g.fillStyle = gr; g.fillRect(x + 8, y + 8, FR.w - 16, 64);
    drawMags(g, x + 34, y + 10, 32);
    for (const [a, b, c2, d] of [[x + 50, y + 62, x + 40, y + 54], [x + 52, y + 50, x + 42, y + 44], [x + 56, y + 40, x + 48, y + 32]]) tLine(g, [a, b, c2, d], 1.6);   // motion lines: she flew in
    g.save(); g.translate(x + 78, y + 50); g.rotate(-.35); g.translate(0, 63); drawPip2(g, 0, 0, 36, { expr: 'grin', arms: false }); g.restore();   // the photobomb: Pip's face mid-air
  } else drawMags(g, cx, y + 16, 38);
  g.restore();
  tShape(g, '#fbf7ff', gg => gg.rect(x + 8, y + 78, FR.w - 16, 18), 2);
  tText(g, MONTHS[(i + 10) % 12], cx, y + 87.5, 10.5, TOON.ink, '"Bungee"', 'center', 400);
  g.restore();
}
function drawWallFrames(g, t) {
  for (let i = 0; i < 36; i++) { const [x, y] = frameXY(i); drawEOM(g, i, x, y); }
  const [x, y] = frameXY(36), cx = x + FR.w / 2;
  if (t < TL.DROP) { tEllipse(g, cx, y - 14, 4, 4, '#c9c3dc', 2); return; }   // the empty nail for next month
  const k = clamp((t - TL.DROP) / .3), fall = k < 1 ? -260 * (1 - k * k) : 0, wob = t > TL.DROP + .3 ? Math.sin((t - TL.DROP - .3) * 14) * .12 * Math.exp(-(t - TL.DROP - .3) * 3) : 0;
  drawEOM(g, 36, x, y + fall, 'finish', .07 + wob, k >= 1);
}
// MAGS on a pole from the ceiling
function drawMagsHere(g, t, glow = 0) {
  tLine(g, [MG.x, -200, MG.x, MG.y + 2], 10); g.strokeStyle = '#c1c6d8'; g.lineWidth = 5; g.beginPath(); g.moveTo(MG.x, -200); g.lineTo(MG.x, MG.y); g.stroke();
  drawMags(g, MG.x, MG.y, MG.s, { talk: Math.max(talkLevel('MAGS', t), glow), glow: 26 + glow * 120 });
}
// hologram boards under MAGS: "+1 MAGS" (L5) and the vote count (L8 to the flash)
function holo(g, x, y, w, h, k, draw) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(.6 + .4 * k, .6 + .4 * k); g.globalAlpha = k;
  tShape(g, 'rgba(255,125,140,.2)', gg => gg.roundRect(-w / 2, -h / 2, w, h, 18), 4);
  g.strokeStyle = '#ff7d8c'; g.lineWidth = 3; g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  draw(g); g.restore();
}
function holograms(g, t) {
  const a1 = V.L5.t + 1.35;
  if (t > a1 && t < endOf('L5') + .4) holo(g, MG.x, MG.y + 270, 300, 110, clamp((t - a1) / .2) * clamp((endOf('L5') + .4 - t) / .2), gg => tText(gg, '+1 MAGS', 0, 4, 48, '#fff', '"Bungee"', 'center', 400));
  const b0 = V.L8.t + .15;
  if (t > b0 && t < TL.FLASH) {
    const m = t >= TL.SCORE ? 1 : 0, p = t >= TL.SLIP ? 1 : 0, pop = t >= TL.SLIP && t < TL.SLIP + .25 ? 1 + .25 * (1 - (t - TL.SLIP) / .25) : 1;
    holo(g, MG.x, MG.y + 290, 420, 140, clamp((t - b0) / .2), gg => {
      tText(gg, 'VOTES', 0, -34, 24, '#ffd0d4', '"Bungee"', 'center', 400);
      tText(gg, 'MAGS ' + m, -92, 18, 44, '#fff', '"Bungee"', 'center', 400);
      tText(gg, '·', 0, 18, 44, '#ffd0d4', '"Bungee"', 'center', 400);
      gg.save(); gg.translate(92, 18); gg.scale(pop, pop); tText(gg, 'PIP ' + p, 0, 0, 44, p ? '#7ef0ff' : '#fff', '"Bungee"', 'center', 400); gg.restore();
    });
  }
}
// the ballot box on the shelf top, and the restocked cans
function drawBox(g) {
  const x = BOX.x - BOX.w / 2, y = AISLE.top - BOX.h;
  tShape(g, '#d9b47a', gg => gg.rect(x, y, BOX.w, BOX.h), 3.4);
  tShape(g, '#b88f55', gg => gg.rect(x + 66, y, 34, BOX.h), 0);
  tShape(g, null, gg => gg.rect(x, y, BOX.w, BOX.h), 3.4);
  tShape(g, '#3a2470', gg => gg.roundRect(BOX.x - 26, y - 4, 52, 9, 4), 2.4);
  tShape(g, '#fbf7ff', gg => gg.rect(x + 14, y + 26, 72, 26), 2.2);
  tText(g, 'VOTE', BOX.x, y + 39.5, 20, '#e23b4a', '"Bungee"', 'center', 400);
}
const CAN_COLS = ['#ff5f7e', '#ffd23f', '#5fe3cc', '#ff9a3d', '#b9a6ff', '#7ef0ff', '#8fd65a', '#ff5f7e', '#ffd23f'];
function drawCan(g, x, y, s, col) {          // (x, y) = bottom centre
  g.save(); g.translate(x, y); g.scale(s, s);
  tShape(g, col, gg => gg.roundRect(-15, -44, 30, 44, 5), 2.6);
  tShape(g, '#fbf7ff', gg => gg.rect(-15, -30, 30, 12), 1.8);
  tShape(g, '#c9c3dc', gg => gg.roundRect(-13, -48, 26, 6, 3), 1.8);
  g.restore();
}
// Pip's restock run: one hop per can, a can lands on the shelf top at each landing
const RUN_SPS = (RUN.x1 - RUN.x0) / RUN.step / (TL.RUN1 - TL.RUN0);
const CANS = [...Array(Math.floor((RUN.x1 - RUN.x0) / RUN.step))].map((_, i) => ({ x: RUN.x0 + (i + 1) * RUN.step - 40, t: TL.RUN0 + (i + 1) / RUN_SPS }));
function drawCans(g, t) { CANS.forEach((cn, i) => { if (t >= cn.t) { const k = clamp((t - cn.t) / .12); drawCan(g, cn.x, AISLE.top + 2, 1.15 * (1 + .2 * (1 - k)), CAN_COLS[i]); } }); }

// ---------------------------------------------------------------- Pip: hops and poses
// hops in the opening: small pops before her line; the big one on "ME!"; the jump into the photo; joy hops at the end
const HOPS = [];
for (let k = 0; k < 4; k++) HOPS.push({ t0: .45 + k * .44, d: .44, h: 120 });
HOPS.push({ t0: TL.ME - .18, d: .78, h: 270, cheer: true });
HOPS.push({ t0: V.L6.t - .1, d: .55, h: 150, can: true });
HOPS.push({ t0: TL.JUMP, d: .9, h: 330, cheer: true });
for (let k = 0; k < 3; k++) HOPS.push({ t0: V.L13.t - .2 + k * .5, d: .5, h: k === 0 ? 210 : 140, cheer: k === 0 });
function hopAt(t) { for (const h of HOPS) if (t >= h.t0 && t < h.t0 + h.d) return { ...h, ...hopPose((t - h.t0) / h.d, h.h) }; return null; }
// arms straight up with fists (in Pip's local units, after drawPip2's own transform)
function cheerArms(g, k) {
  const P = TOON.pip;
  for (const sx of [-1, 1]) {
    const hx = sx * lerp(70, 64, k), hy = lerp(-120, -214, k);
    tTube(g, [sx * 52, -88, sx * 74, -108, sx * 80, (-108 + hy) / 2 - 6, hx, hy + 10], 20, P.shirt, sx > 0 ? P.shirtS : null);
    tHand(g, hx, hy, 9.5, P.skin, P.skinS);
  }
}
function drawPipAt(g, t, x, y, o, hp, extra) {
  g.save(); g.translate(x, y + (hp ? hp.dy : 0)); if (hp) g.scale(hp.sx, hp.sy);
  drawPip2(g, 0, 0, S, o);
  if (extra) { g.save(); g.scale(S / 100, S / 100); extra(g); g.restore(); }
  g.restore();
}
function pipState(t, n) {
  let expr = 'grin', lift = 0, arms = { armsDown: { l: 0, r: 0, bend: 0 } }, extra = null;
  const hp = hopAt(t);
  if (t >= V.L3.t - .15 && t < endOf('L3') + .2) { expr = 'gasp'; lift = 130 * smooth(V.L3.t - .15, V.L3.t + .1, t) * (1 - smooth(endOf('L3'), endOf('L3') + .2, t)); arms = { wave: true, wavePhase: 0 }; }
  if (t >= endOf('L4') - .2 && t < TL.MONT0) expr = 'worried';
  if (t >= V.L6.t - .2 && t < V.L7.t) { expr = 'gasp'; arms = { hold: true }; extra = gg => drawCan(gg, 0, -86, .85, CAN_COLS[2]); }
  if (t >= V.L7.t && t < V.L9.t) expr = 'worried';
  if (t >= V.L9.t && t < TL.SLIP) { expr = 'sad'; lift = -24 * smooth(V.L9.t, V.L9.t + .4, t); }
  if (t >= TL.SLIP) expr = 'gasp';
  if (t >= V.L12.t + .4) expr = 'grin';
  if (hp && hp.cheer) { const k = Math.sin(Math.PI * clamp((t - hp.t0) / hp.d)); arms = { arms: false }; extra = gg => cheerArms(gg, clamp(k * 1.6)); }
  else if (hp && !arms.hold && !arms.wave) arms = { armsDown: { l: hp.ground ? 0 : -26, r: hp.ground ? 0 : 26, bend: hp.ground ? 0 : .6 } };
  return { o: Object.assign({ expr, mouth: mouthFor('PIP', t), blink: blinkAt(3, t) }, arms), lift, hp, extra };
}
function drawPipWall(g, t, n) {
  const P = pipState(t, n);
  drawPipAt(g, t, PX, PIPW - P.lift, P.o, P.hp, P.extra);
}
function drawPipRun(g, t) {
  const tr = travel(t, TL.RUN0, RUN.x0, RUN.x1, RUN.step, RUN_SPS), hp = tr.moving ? hopPose(tr.dist / RUN.step, 135) : null;
  const o = { expr: 'grin', turn: .7, mouth: null, blink: blinkAt(3, t), hold: true };
  drawPipAt(g, t, tr.x, PIPW, o, hp, gg => { if (!hp || !hp.ground) drawCan(gg, 0, -86, .85, CAN_COLS[Math.min(CANS.length - 1, Math.floor(tr.dist / RUN.step))]); });
  return tr.x;
}

// ---------------------------------------------------------------- Rae: walks in (waist-up), stands, walks back to the ballot box
function drawRae(g, t) {
  const blink = blinkAt(1, t), mouth = mouthFor('RAE', t), STEP = 160;
  if (t < V.L4.t) {                                   // first visit: in from the right, then stands at RX1 looking at Pip
    const tr = travel(t, TL.RAEIN0, 2250, RX1, STEP, 1.9);
    if (tr.moving) return drawTraveller(g, (gg, x, y, s, o) => drawRae2(gg, x, y, s, o), tr.x, RAEW, S, { expr: 'deadpan', scanner: false, blink, mouth }, walkBob(tr.dist, STEP, 12), -1);
    if (t < TL.RAEIN0) return;
    return drawRae2(g, RX1, RAEW, S, { expr: 'deadpan', scanner: false, look: -2.2, blink, mouth });
  }
  if (t < TL.RAEB0) return;                           // off to the till while Pip restocks
  const tr = travel(t, TL.RAEB0, 2250, RX2, STEP, 1.9);
  if (tr.moving) return drawTraveller(g, (gg, x, y, s, o) => drawRae2(gg, x, y, s, o), tr.x, RAEW, S, { expr: 'deadpan', scanner: false, blink, mouth }, walkBob(tr.dist, STEP, 12), -1);
  // at the box: the left arm comes up with the folded ballot and drops it in the slot
  const up = smooth(TL.ARRIVE + .02, TL.ARRIVE + .35, t), down = smooth(TL.SLIP + .25, TL.SLIP + .6, t);
  const tx = (BOX.x - RX2) / (S / 100), ty = (AISLE.top - BOX.h - 10 - RAEW) / (S / 100);
  const reachL = { x: lerp(-40, tx, up), y: lerp(lerp(30, ty, up), 30, down) };
  const look = t > TL.SLIP + .3 ? -2.2 : -1;
  drawRae2(g, RX2, RAEW, S, { expr: 'deadpan', scanner: false, look, blink, mouth, reachL });
  if (t < TL.SLIP) {                                  // the ballot in her hand, then into the slot
    const hx = RX2 + reachL.x * S / 100, hy = RAEW + reachL.y * S / 100, dropK = clamp((t - (TL.SLIP - .12)) / .12);
    g.save(); g.translate(hx + 4, hy - 16 + dropK * 22); g.rotate(-.1); tShape(g, '#fbf7ff', gg => gg.rect(-12, -16, 24, 30), 2.2); tLine(g, [-12, -1, 12, -1], 1.4); g.restore();
  }
}

// ---------------------------------------------------------------- cameras
const CAM = {
  PIP_CU: [PX, PIPW - 334 + 60, 2.0, 2.1],
  MAGS_CU: [MG.x, MG.y + 75, 2.6, 2.75],
  MAGS_MED: [MG.x, MG.y + 240, 1.5, 1.58],
  WIDE_VOTE: [1560, 1050, .9, .93],                            // wide shots sit low enough that Pip's face clears the subtitles
  RAE_MED: [RX2 - 30, RAEW - 290, 1.55, 1.62],
  WIDE_FLASH: [1570, 1040, .92, .99],
  PHOTO: [frameXY(36)[0] + FR.w / 2 - 20, frameXY(36)[1] + FR.h / 2, 4.3, 4.5],
  END_WALL: [1560, 1050, .96, .9],
};
function setCam(g, cx, cy, z, shake = 0) { g.setTransform(z, 0, 0, z, 540 - cx * z + shake, 960 - cy * z); }

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#221a4f'; c.fillRect(0, 0, W, H);
  let runX = null;
  if (n === 'OPEN') {                                   // from one frame (October) back to the whole wall
    const [fx, fy] = frameXY(35), k = smooth(.1, 1.45, t), z = 1 / lerp(1 / 5.5, 1 / .9, k) * (1 + .03 * smooth(1.45, V.L3.t, t));
    setCam(c, lerp(fx + FR.w / 2, 1560, k), lerp(fy + FR.h / 2, 1050, k), z);
  } else if (n === 'MONTAGE') {
    const tr = travel(t, TL.RUN0, RUN.x0, RUN.x1, RUN.step, RUN_SPS);
    setCam(c, clamp(tr.x + 140, 432 + 10, AISLE.w - 432), 1230, 1.25);
  } else applyCam(c, CAM[n], sk);
  c.drawImage(AISLE.back, 0, 0);
  drawWallFrames(c, t);
  const flashGlow = clamp(1 - Math.abs(t - TL.FLASH) / .18);
  drawMagsHere(c, t, flashGlow);
  if (n !== 'MAGS_CU') holograms(c, t);                // in the close-up the vote board would sit under the subtitle ("Me.")
  drawRae(c, t);
  if (n === 'MONTAGE') runX = drawPipRun(c, t); else if (t < TL.MONT0 || t >= V.L5.t - .1) drawPipWall(c, t, n);
  c.drawImage(AISLE.front, 0, AISLE.top);
  drawCans(c, t);
  drawBox(c);
}
// the hook card (experiment, 4/4): first 2.5 s, top of the frame, inside the safe zone
function hookCard(g, t) {
  const a = clamp((2.5 - t) / .25); if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  tShape(g, 'rgba(18,10,42,.88)', gg => gg.roundRect(140, 250, 800, 190, 26), 5);
  tText(g, 'THE CAMERA WINS', 540, 314, 62, '#fbf7ff', '"Bungee"', 'center', 400);
  tText(g, 'EVERY MONTH', 540, 388, 62, '#ff7d8c', '"Bungee"', 'center', 400);
  g.restore();
}
function flash(g, t) {
  const k = t < TL.FLASH ? 0 : clamp(1 - (t - TL.FLASH - .08) / .45); if (k <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = k; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore();
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); flash(OUT, t); hookCard(OUT, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues
const hopLandings = () => {
  const out = HOPS.map(h => h.t0 + h.d * .84);
  const n = CANS.length; for (let i = 1; i <= n; i++) out.push(TL.RUN0 + i / RUN_SPS - .02);
  return out;
};
window.EV = [
  { type: 'bed', fx: 'store_hum', t: 0, t1: DUR + .5, g: -30 },
  { type: 'whoosh', t: .08 },
  ...hopLandings().map(x => ({ type: 'hop', t: x })),
  ...footfalls(TL.RAEIN0, 2250, RX1, 160, 1.9).map(x => ({ type: 'step', t: x })),
  ...footfalls(TL.RAEB0, 2250, RX2, 160, 1.9).map(x => ({ type: 'step', t: x })),
  ...CANS.map(cn => ({ type: 'can', t: cn.t })),
  ...vmShotsFrom('MAGS_CU').map(x => ({ type: 'blip', t: x + .02 })),
  { type: 'holo', t: V.L5.t + 1.35 },
  { type: 'holo', t: V.L8.t + .15 },
  { type: 'blip', t: TL.SCORE },
  { type: 'ballot', t: TL.SLIP - .1 },
  { type: 'blip', t: TL.SLIP + .02 },
  { type: 'shutter', t: TL.FLASH - .05 },
  { type: 'frame', t: TL.DROP + .3 },
  { type: 'sparkle', t: TL.DROP + .5 },
  { type: 'chime', t: DUR - 1.2 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildAisle(); paintWall();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
