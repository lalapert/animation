// Volt Labs, episode 1: "Day One". The Adoration Ray: every creature on Earth will adore Dr. Vera Volt. Cleo fires it early.
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Set, cameras, pigeons: channel/brand/labkit.js;
// lip sync, subtitles, shots: channel/brand/vmkit.js; characters: channel/brand/lab.js.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const FIRE = TL.FIRE, FLOOD = TL.FLOOD;

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, LABCAM, {
  WIDE_IN: [540, 960, 1.1, 1.24],
  VERA_SCHEME: [VERA.x + 10, VERAFACE + 70, 2.4, 2.6],
  VERA_COUNT: [VERA.x + 10, VERAFACE + 75, 2.45, 2.75],
  CLEO_PRESS: [CLEO.x, LCT - 120, 2.9, 3.1],
  WIDE_FIRE: [540, 980, 1.26, 1.2],
  WIDE_FLOOD: [540, 980, 1.2, 1.16],
  VERA_MED_P: [VERA.x + 70, VERAFACE + 140, 1.62, 1.7],
  VERA_CU_P: [VERA.x + 10, VERAFACE + 40, 2.15, 2.35],
  WIDE_ARMY: [540, 990, 1.16, 1.2],
  CLEO_END: [CLEO.x - 10, CLEOFACE + 80, 2.3, 2.42],
});

// ---------------------------------------------------------------- the flock: where each pigeon ends up, and when it leaves the window
// [x, y, scale, delay after FLOOD] ; y is where its feet are. Faces Vera unless noted.
const HEADTOP = LCT - 292 * VERA.s / 100;
const PERCH = [
  [VERA.x + 4, HEADTOP + 8, 70, .55],                                        // on her head
  [VERA.x - 92, LCT - 284, 64, .7], [VERA.x + 96, LCT - 284, 64, .85],       // shoulders
  [150, LCT + 14, 82, .3], [235, LCT + 16, 86, .95], [380, LCT + 14, 84, .45], [455, LCT + 16, 80, 1.15],   // bench in front of her
  [60, LFRIDGE.y + 4, 66, .6], [590, 760, 58, 1.0],                          // fridge, the ray barrel
  [160, LBOARD.y - LBOARD.h / 2 - 14, 58, .8], [300, LBOARD.y - LBOARD.h / 2 - 14, 58, 1.3],                // the board frame
  [700, LWIN.y + LWIN.h / 2 + 8, 56, 1.4], [930, LWIN.y + LWIN.h / 2 + 8, 56, 1.55],                       // the window sill
  [470, 138, 52, 1.25], [180, 138, 52, 1.6],                                 // the ceiling pipe
  [665, LCT + 16, 80, 1.05, 'away'],                                         // next to Cleo, with its back to her
  [VERA.x - 150, LCT - 150, 60, 1.1], [VERA.x + 150, LCT - 160, 60, 1.2],    // clinging to her coat
  [105, LCT + 18, 78, 1.35], [305, LCT + 20, 90, 1.45], [520, LCT + 18, 76, 1.5],   // more on the bench
  [960, 700 - 14, 54, 1.7], [1030, 860 - 14, 54, 1.75],                      // the flask shelf
  [430, LBOARD.y - LBOARD.h / 2 - 14, 58, 1.65], [820, LWIN.y + LWIN.h / 2 + 8, 56, 1.8],
  [100, LFRIDGE.y + 4, 62, 1.9], [540, 236 - 28, 46, 1.95],                  // fridge, the light bulb
];
// the flood: a torrent pouring through the window and straight at the camera
const STREAM = Array.from({ length: 34 }, (_, i) => { const r = Math.sin(i * 12.9898) * 43758.5453; const f = r - Math.floor(r), f2 = (Math.sin(i * 78.233) * 43758.5453) % 1; return [FLOOD + i * .055, -260 + f * 1600, 500 + Math.abs(f2) * 1300, .55 + .25 * f]; });
function drawStream(g, t) {
  for (let i = 0; i < STREAM.length; i++) {
    const [t0, tx, ty, d] = STREAM[i], k = (t - t0) / d;
    if (k < 0 || k > 1) continue;
    const e = k * k, x = lerp(WINPT[0], tx, e), y = lerp(WINPT[1], ty, e), s = lerp(40, 330, e);
    drawPigeon(g, x, y, s, { fly: true, flap: .5 + .5 * Math.sin(t * 36 + i * 1.3), dir: tx < WINPT[0] ? -1 : 1, heart: true });
  }
}
const FLYERS = [[0, 1.9, 300], [1, 2.4, 260], [2, 2.9, 330]];               // a few keep circling: [seed, period, radius]
const WINPT = [LWIN.x - 40, LWIN.y + 20];
function pigeonState(i, t) {
  const [px, py, s, dl, mode] = PERCH[i], t0 = FLOOD + dl, k = clamp((t - t0) / .55);
  if (t < t0) return null;
  const dir = mode === 'away' ? -1 : (VERA.x > px ? 1 : -1);
  if (k < 1) {                                                                // flying in on an arc from the window
    const e = ease(k), x = lerp(WINPT[0], px, e), y = lerp(WINPT[1], py, e) - Math.sin(e * Math.PI) * 140;
    return { x, y, s: lerp(s * .8, s, e), o: { fly: true, flap: .5 + .5 * Math.sin(t * 38 + i), dir: px < WINPT[0] ? -1 : 1, heart: true } };
  }
  const lt = t - t0 - .55, bob = Math.sin(lt * 5 + i) * 1.5, peck = (Math.sin(lt * 2.3 + i * 1.7) > .93) ? .6 : 0;
  return { x: px, y: py, s, o: { dir, heart: true, bob, peck } };
}
function drawFlock(g, t, filter) {
  if (t < FLOOD) return;
  for (let i = 0; i < PERCH.length; i++) {
    const st = pigeonState(i, t); if (!st) continue;
    const onBench = PERCH[i][1] >= LCT;
    if (filter === 'bench' ? !onBench : onBench) continue;
    drawPigeon(g, st.x, st.y, st.s, st.o);
    if (!st.o.fly && i % 3 === 0) heartsUp(g, t, st.x + 10 * st.o.dir, st.y - st.s * .7, i, clamp((t - FLOOD - 2) / .5));
  }
  if (filter === 'bench') return;
  for (const [sd, per, r] of FLYERS) {                                        // circling overhead
    const a = (t - FLOOD) * Math.PI * 2 / per + sd * 2.1, k = clamp((t - FLOOD - .4 - sd * .3) / .6);
    if (k <= 0) continue;
    const x = lerp(WINPT[0], 560 + Math.cos(a) * r, k), y = lerp(WINPT[1], 470 + Math.sin(a) * 90, k);
    drawPigeon(g, x, y, 56, { fly: true, flap: .5 + .5 * Math.sin(t * 34 + sd), dir: Math.sin(a) > 0 ? -1 : 1, heart: true });
  }
}
// the first pigeon: lands on the sill, looks in, falls in love
function drawFirstPigeon(g, t) {
  if (t < TL.LAND - .5 || t > FLOOD + 2.5) return;
  const k = clamp((t - (TL.LAND - .5)) / .5), x = lerp(LWIN.x + 220, LWIN.x + 30, ease(k)), y = lerp(LWIN.y - 160, LWIN.y + LWIN.h / 2 + 8, ease(k));
  const landed = k >= 1, heart = t > TL.LAND + .7;
  drawPigeon(g, x, y, 62, landed ? { dir: -1, heart, bob: Math.sin(t * 6) * 1.2, peck: t > TL.LAND + .35 && t < TL.LAND + .55 ? .5 : 0 } : { fly: true, flap: .5 + .5 * Math.sin(t * 40), dir: -1 });
  if (heart) heartsUp(g, t, x - 14, y - 50, 3, clamp((t - TL.LAND - .7) / .3));
}
// the fry: a pigeon on the bench walks up to her with an offering
function drawFryPigeon(g, t) {
  if (t < TL.FRY || t > TL.BOARDT) return;
  const k = ease((t - TL.FRY) / .9), x = lerp(540, 430, k), hop = Math.abs(Math.sin(k * Math.PI * 3)) * 10 * (k < 1 ? 1 : 0);
  drawPigeon(g, x, LCT + 24 - hop, 104, { dir: -1, heart: true, hold: 'fry', bob: 0, peck: -.25 });
}
// the rent payment
function drawCap(g, t) {
  const t0 = TL.CAPT;
  if (t < t0 - .6) return;
  const fx = lerp(820, 600, clamp((t - t0 + .6) / .6)), flying = t < t0 + .15;
  if (t < t0 + .9) drawPigeon(g, flying ? fx : lerp(600, 470, clamp((t - t0 - .15) / .6)), flying ? LCT - 230 : lerp(LCT - 230, LCT - 330, clamp((t - t0 - .15) / .6)), 70,
    { fly: true, flap: .5 + .5 * Math.sin(t * 40), dir: -1, heart: true, hold: t < t0 ? 'cap' : null });
  if (t >= t0) {
    const fall = clamp((t - t0) / .3), y = lerp(LCT - 216, LCT + 12, fall * fall), bounce = t > t0 + .3 ? Math.max(0, Math.sin((t - t0 - .3) * 18)) * 8 * Math.exp(-(t - t0 - .3) * 6) : 0;
    g.save(); g.translate(600, y - bounce); g.scale(1.6, 1.6); tShape(g, '#c9cfdb', gg => gg.ellipse(0, 0, 20, 7, 0, 0, 6.2832), 3); tShape(g, '#e23b4a', gg => gg.ellipse(0, -3, 14, 4, 0, 0, 6.2832), 2.4);
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; tLine(g, [Math.cos(a) * 18, Math.sin(a) * 6, Math.cos(a) * 22, Math.sin(a) * 7.5], 2); }
    g.restore();
  }
}
// Cleo's arm draws the new rent circle (board close-up): the sleeve comes in from the right edge, the hand follows the chalk
function drawChalkArm(g, t) {
  const t0 = TL.BOARDT + .2, k = clamp((t - t0) / .9);
  if (t < TL.BOARDT || t > TL.BOARDT + 1.6) return;
  const i = 1, cx = LBOARD.x - 70, cy = LBOARD.y + 80, rx = 120 + i * 12, ry = 30 + i * 6, a = -2.6 + i * .5 + k * 6.6;
  const enter = ease((t - TL.BOARDT) / .25) * (1 - ease((t - TL.BOARDT - 1.25) / .3));
  const hx = lerp(560, cx + Math.cos(a) * rx, enter), hy = lerp(LBOARD.y + 160, cy + Math.sin(a) * ry, enter);
  tTube(g, [640, LBOARD.y + 230, (640 + hx) / 2 + 40, (LBOARD.y + 230 + hy) / 2 + 30, hx + 18, hy + 14], 24, LAB2.cleo.tee, '#dcd4ee');
  tShape(g, '#fbf7ff', gg => { gg.save(); gg.translate(hx - 4, hy - 4); gg.rotate(-.6); gg.roundRect(-4, -12, 8, 22, 3); gg.restore(); }, 2.4);
  tHand(g, hx + 6, hy + 4, 10, LAB2.cleo.glove, LAB.glowS);
}

// ---------------------------------------------------------------- character states per shot
function veraState(t, n) {
  let expr = 'scheme', point = 0, tube = true, goggles = false;
  if (n === 'VERA_CU' && t < V.L4.t) expr = 'cool';
  if (n === 'RAY_SHOT') { point = ease((t - V.L4.t - .15) / .5); tube = false; }
  if (n === 'VERA_SCHEME') { tube = false; }
  if (n === 'VERA_COUNT' || n === 'CLEO_PRESS') { goggles = t > V.L6.t + 2.4; tube = false; }
  if (n === 'WIDE_FIRE') { goggles = true; expr = 'fluster'; tube = false; }
  if (n === 'VERA_CU' && t >= V.L7.t) { expr = 'fluster'; tube = false; }
  if (n === 'CLEO_CU' && t > FIRE) tube = false;
  if (t >= TL.WIN) { tube = false; expr = 'fluster'; }
  if (t >= V.L9.t) expr = 'cool';
  if (t >= V.L11.t) expr = 'scheme';
  if (t >= TL.FRY + .5) expr = 'fluster';
  if (t >= V.L14.t) expr = 'scheme';
  return { expr, point, tube, goggles, mouth: mouthFor('VERA', t), blink: !goggles && blinkAt(0, t) };
}
function cleoState(t, n) {
  let expr = 'deadpan', press = 0;
  if (n === 'CLEO_PRESS' || (t > TL.PRESS && t < FIRE + .5)) press = clamp((t - TL.PRESS) / .08) * (1 - clamp((t - FIRE - .3) / .1));
  if (t > V.L8.t && t < endOf('L8') + .3) expr = 'smug';
  if (n === 'CLEO_END') expr = 'sleepy';
  return { expr, press, mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look: t >= TL.FLOOD && t < V.L13.t ? -2.5 : 0 };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  const shake = t > FIRE && t < FIRE + .6 ? Math.sin(t * 95) * 14 * (1 - (t - FIRE) / .6) : 0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, shake);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, t, t > FIRE + .05 ? ease((t - FIRE - .05) / .15) : 0);
  drawRentCircles(c, t > TL.BOARDT + 1.1 ? 2 : 1, t > TL.BOARDT + .2 && t <= TL.BOARDT + 1.1 ? (t - TL.BOARDT - .2) / .9 : 0);
  if (n === 'BOARD') drawChalkArm(c, t);
  const charge = t < V.L6.t ? .25 + .15 * Math.sin(t * 3) : t < FIRE ? .3 + .7 * clamp((t - V.L6.t) / (FIRE - V.L6.t)) : Math.max(.2, 1 - (t - FIRE) / .8);
  const dial = t < V.L4.t + 6 ? .2 : t < FIRE ? .2 + .8 * clamp((t - V.L4.t - 6) / 1.2) : 1;
  drawRay(c, t, { charge, recoil: t > FIRE && t < FIRE + .4 ? Math.sin((t - FIRE) / .4 * Math.PI) : 0, dial });
  drawFridge(c, t > FIRE + .1 && t < FIRE + 1.25 ? ease((t - FIRE - .1) / .2) * (1 - ease((t - FIRE - 1.0) / .2)) : 0);
  const bobV = Math.sin(t * 2.1) * 2, bobC = Math.sin(t * 1.7 + 1) * 1.5;
  drawVera2(c, VERA.x, LCT + bobV, VERA.s, veraState(t, n));
  drawCleo2(c, CLEO.x, LCT + bobC, CLEO.s, cleoState(t, n));
  drawFirstPigeon(c, t);
  drawFlock(c, t, 'air');
  drawBeam(c, t, t > FIRE && t < FIRE + 1.0 ? 1 - ease((t - FIRE - .6) / .4) : 0);
  c.drawImage(LAB_STATIC.front, 0, LCT);
  // bench-top props: a beaker, a notebook, the flock on the bench, the fry and the cap
  tShape(c, 'rgba(220,255,240,.35)', gg => gg.roundRect(560, LCT - 50, 44, 58, 6), 3); tShape(c, LAB.glow, gg => gg.rect(562, LCT - 22, 40, 28), 0);
  c.save(); c.translate(905, LCT + 14); c.rotate(-.05); tShape(c, '#e8e2d2', gg => gg.rect(-60, -10, 120, 18), 3); c.restore();
  drawFlock(c, t, 'bench');
  drawFryPigeon(c, t);
  drawCap(c, t);
  drawStream(c, t);
  // the shot: a pink-white flash
  if (t > FIRE && t < FIRE + .5) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(255,220,235,${.85 * (1 - (t - FIRE) / .5)})`; c.fillRect(0, 0, W, H); }
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  STYLE_A.frame(c, t);
  composeFrame(OUT, SC, t);
}
window.render = render;

// ---------------------------------------------------------------- sound cues (mix.json maps types to effects)
window.EV = [
  { type: 'bed', fx: 'lab_hum', t: 0, t1: DUR + .5, g: -30 },
  { type: 'hum', t: 0.0, dur: 3.2 },                                           // the ray idling under the first line
  { type: 'charge', t: V.L6.t + 2.4, dur: FIRE - V.L6.t - 2.4 },
  { type: 'click', t: TL.PRESS },
  { type: 'zap', t: FIRE },
  { type: 'rattle', t: FIRE + .05 },
  { type: 'window', t: FIRE + .06 },
  { type: 'fridge_open', t: FIRE + .1 },
  { type: 'fridge_shut', t: FIRE + 1.12 },
  { type: 'flap', t: TL.LAND - .5 },
  { type: 'coo', t: TL.LAND + .3 },
  { type: 'coo_love', t: TL.LAND + .75 },
  { type: 'flock', t: FLOOD, dur: 2.6 },
  { type: 'bed', fx: 'coo_bed', t: FLOOD + 1.2, t1: DUR + .5, g: -31 },
  { type: 'step', t: TL.FRY + .2 }, { type: 'step', t: TL.FRY + .5 }, { type: 'step', t: TL.FRY + .8 },
  { type: 'chalk', t: TL.BOARDT + .2, dur: .9 },
  { type: 'flap', t: TL.CAPT - .6 },
  { type: 'clink', t: TL.CAPT + .3 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    STYLE_A.on(LAB_A);
    buildLab();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
