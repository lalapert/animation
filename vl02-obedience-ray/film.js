// Volt Labs, episode 2: "The Obedience Ray". Everyone will do exactly what Vera says. The street becomes unbearably polite.
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Set, cameras, pigeons: channel/brand/labkit.js;
// lip sync, subtitles, shots: channel/brand/vmkit.js; characters: channel/brand/lab.js.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const FIRE = TL.FIRE;
const WX0 = LWIN.x - LWIN.w / 2, WY0 = LWIN.y - LWIN.h / 2, WALK = WY0 + LWIN.h - 12;   // inside of the window; the pavement line

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, LABCAM, {
  WIDE_IN: [545, 905, 1.42, 1.58],
  VERA_COUNT: [VERA.x + 10, VERAFACE + 75, 2.45, 2.7],
  WIDE_FIRE: [540, 980, 1.26, 1.2],
  WIDE_DUCK: [540, 1000, 1.2, 1.25],
  WINDOW: [LWIN.x, LWIN.y + 20, 2.7, 2.85],
});

// ---------------------------------------------------------------- the street outside the basement window: legs, and one face
// a pair of legs seen from pavement level: hips above the window, feet on the pavement. dir: which way the toes point
function drawLegs(g, x, dir, phase, style, kneel = 0) {
  const top = WY0 - 30, foot = WALK, sw = style === 'man' ? 18 : 13;
  const col = style === 'man' ? '#6b6f7e' : '#3a3550', colS = style === 'man' ? '#55596a' : '#2a2640', shoe = style === 'man' ? '#6b3f25' : '#d23a4a';
  for (const s of [-1, 1]) {
    const sw2 = Math.sin(phase + (s > 0 ? Math.PI : 0)) * 16, fx = x + s * 12 + sw2 * dir, fy = foot - Math.max(0, Math.cos(phase + (s > 0 ? Math.PI : 0))) * 8;
    if (kneel > 0 && s < 0) {                                       // the left knee goes down to the pavement
      const kx = x - 8 + 40 * dir * kneel, ky = lerp(top + 90, foot - 8, kneel);
      tTube(g, [x + s * 10, top + kneel * 60, kx - 10 * dir, ky - 30, kx, ky], sw, col, colS);
      tTube(g, [kx, ky, kx - 30 * dir, foot - 6, kx - 50 * dir, foot - 4], sw, col, colS);
      continue;
    }
    tTube(g, [x + s * 10, top + kneel * 60, (x + s * 10 + fx) / 2, (top + fy) / 2, fx, fy - 10], sw, col, colS);
    if (style === 'woman') tShape(g, '#e7c0a6', gg => gg.rect(fx - 5, fy - 34, 10, 22), 2.4);   // ankle
    tShape(g, shoe, gg => gg.ellipse(fx + 10 * dir, fy - 4, 18, 8, 0, 0, 6.2832), 3);
  }
  if (style === 'woman') tShape(g, '#3a7bd5', gg => { gg.moveTo(x - 36, top - 10); gg.lineTo(x + 36, top - 10); gg.lineTo(x + 30, top + 46); gg.lineTo(x - 30, top + 46); gg.closePath(); }, 3);   // a coat hem
}
// the kneeling gentleman: bowler hat, round face, moustache; happy closed eyes, talks when he talks
function drawGent(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  tShape(g, '#3d4256', gg => gg.roundRect(-60, 40, 120, 80, 20));                                          // coat shoulders
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-14, 40); gg.lineTo(0, 64); gg.lineTo(14, 40); gg.closePath(); }, 2.6);
  const face = gg => gg.ellipse(0, 0, 44, 48, 0, 0, 6.2832);
  tShape(g, '#f2c9a8', face); tShade(g, face, '#ddae8c', gg => gg.ellipse(24, 6, 30, 50, 0, 0, 6.2832));
  g.fillStyle = 'rgba(255,110,130,.45)'; g.beginPath(); g.ellipse(-26, 12, 10, 6, 0, 0, 6.2832); g.ellipse(26, 12, 10, 6, 0, 0, 6.2832); g.fill();
  for (const sx of [-1, 1]) tCurve(g, sx * 18 - 9, -6, sx * 18, -14, sx * 18 + 9, -6, 3.6);                // happy eyes
  const m = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0;
  if (m) talkMouth(g, 0, 22, m, o.mouth.shape, .8); else tCurve(g, -10, 22, 0, 30, 10, 22, 3);
  tShape(g, '#8a5a3a', gg => { gg.moveTo(-26, 14); gg.quadraticCurveTo(-12, 6, 0, 13); gg.quadraticCurveTo(12, 6, 26, 14); gg.quadraticCurveTo(12, 20, 0, 16); gg.quadraticCurveTo(-12, 20, -26, 14); gg.closePath(); }, 2.6);   // moustache
  tShape(g, '#2a2a33', gg => gg.ellipse(0, -40, 62, 12, 0, 0, 6.2832));                                       // bowler brim
  tShape(g, '#2a2a33', gg => { gg.moveTo(-38, -42); gg.bezierCurveTo(-38, -100, 38, -100, 38, -42); gg.closePath(); });
  tShape(g, '#7a2d3a', gg => gg.rect(-38, -54, 76, 10), 2.4);
  if (o.tea) { tTube(g, [50, 62, 66, 96, 54, 92], 22, '#3d4256'); tShape(g, '#fbf7ff', gg => gg.roundRect(36, 52, 34, 30, 6), 3); tShape(g, '#fbf7ff', gg => gg.arc(72, 66, 8, -1.3, 1.3), 3); tHand(g, 52, 86, 10, '#f2c9a8', '#ddae8c'); }   // the sleeve comes up from his shoulder
  g.restore();
}
function drawStreet(g, t) {
  g.save(); g.beginPath(); g.rect(WX0, WY0, LWIN.w, LWIN.h); g.clip();
  const bump = TL.BUMP, walkIn = clamp((t - (bump - 1.6)) / 1.6);
  // the man from the right, the woman from the left; they stop nose to nose; "after you" sidesteps in sync
  let side = 0;
  for (const [t0] of [[V.L6.t + .9], [V.L7.t + .9], [V.L7.t + 2.0]]) side += t > t0 ? ease((t - t0) / .35) * (side % 2 === 0 ? 1 : -1) : 0;
  const sx = side * 46;
  const manX = lerp(LWIN.x + 260, LWIN.x + 52, walkIn) + sx, womX = lerp(LWIN.x - 260, LWIN.x - 52, walkIn) + sx;
  const walking = t > bump - 1.6 && t < bump, ph = t * 9;
  const kneel = ease((t - TL.KNEEL) / .5);
  const womanGone = clamp((t - (TL.KNEEL - .1)) / 1.2);              // she walks off, still saying sorry to no one
  if (t > bump - 1.6) {
    drawLegs(g, womX - womanGone * 300, womanGone > 0 ? -1 : 1, walking || womanGone > 0 ? ph : 0, 'woman');
    if (kneel <= 0) drawLegs(g, manX, -1, walking ? ph + 1 : 0, 'man');
  }
  if (kneel > 0) drawGent(g, LWIN.x + 30, lerp(WY0 - 120, WY0 + 92, kneel), 92, { mouth: mouthFor('MAN', t), tea: t > V.L9.t + 2.2 });
  g.restore();
}

// Cleo's arm draws the next rent circle on the board (board close-up): the sleeve comes in from the right edge
function drawChalkArm(g, t, i) {
  const t0 = TL.BOARDT + .2, k = clamp((t - t0) / .9);
  if (t < TL.BOARDT || t > TL.BOARDT + 1.6) return;
  const cx = LBOARD.x - 70, cy = LBOARD.y + 80, rx = 120 + i * 12, ry = 30 + i * 6, a = -2.6 + i * .5 + k * 6.6;
  const enter = ease((t - TL.BOARDT) / .25) * (1 - ease((t - TL.BOARDT - 1.25) / .3));
  const hx = lerp(560, cx + Math.cos(a) * rx, enter), hy = lerp(LBOARD.y + 160, cy + Math.sin(a) * ry, enter);
  tTube(g, [640, LBOARD.y + 230, (640 + hx) / 2 + 40, (LBOARD.y + 230 + hy) / 2 + 30, hx + 18, hy + 14], 24, LAB2.cleo.tee, '#dcd4ee');
  tShape(g, '#fbf7ff', gg => { gg.save(); gg.translate(hx - 4, hy - 4); gg.rotate(-.6); gg.roundRect(-4, -12, 8, 22, 3); gg.restore(); }, 2.4);
  tHand(g, hx + 6, hy + 4, 10, LAB2.cleo.glove, LAB.glowS);
}
function steam(g, t, x, y, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a;
  for (let i = 0; i < 4; i++) { const p = ((t * 1.4 + i / 4) % 1); g.fillStyle = 'rgba(240,240,250,.85)'; g.beginPath(); g.arc(x + (i - 1.5) * 34 + Math.sin(p * 6 + i) * 10, y - p * 160, 16 + p * 26, 0, 6.2832); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------- character states per shot
function veraState(t, n) {
  let expr = 'scheme', point = 0, tube = true, goggles = false;
  if (n === 'RAY_SHOT') { point = ease((t - V.L3.t - .15) / .5); tube = false; }
  if (n === 'VERA_COUNT') { goggles = t > V.L4.t + .3; tube = false; }
  if (n === 'WIDE_FIRE') { goggles = true; tube = false; }
  if (t >= V.L5.t) tube = false;
  if (t >= V.L8.t) expr = 'scheme';
  if (t >= V.L11.t - .2) expr = 'fluster';
  return { expr, point, tube, goggles, mouth: mouthFor('VERA', t), blink: !goggles && blinkAt(0, t) };
}
function cleoState(t, n) {
  let expr = 'deadpan', look = 0;
  if (t > V.L14.t - .3) expr = 'smug';
  if (t > TL.KNOCK && t < V.L14.t) look = -2.5;
  return { expr, mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  const shake = t > FIRE && t < FIRE + .5 ? Math.sin(t * 95) * 10 * (1 - (t - FIRE) / .5) : 0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, shake);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, t, 1);                                              // still open since yesterday
  drawStreet(c, t);
  drawPigeon(c, LWIN.x + 120, LWIN.y + LWIN.h / 2 + 8, 56, { dir: -1, bob: Math.sin(t * 5) * 1.2 });   // one stayed on the sill
  drawRentCircles(c, t > TL.BOARDT + 1.1 ? 3 : 2, t > TL.BOARDT + .2 && t <= TL.BOARDT + 1.1 ? (t - TL.BOARDT - .2) / .9 : 0);
  if (n === 'BOARD') drawChalkArm(c, t, 2);
  const charge = t < V.L4.t ? .25 + .15 * Math.sin(t * 3) : t < FIRE ? .3 + .7 * clamp((t - V.L4.t) / (FIRE - V.L4.t)) : Math.max(.2, 1 - (t - FIRE) / .8);
  drawRay(c, t, { charge, recoil: t > FIRE && t < FIRE + .4 ? Math.sin((t - FIRE) / .4 * Math.PI) : 0, dial: t < FIRE ? .3 : 1, lens: 'crown', label: 'OBEDIENCE RAY' });
  drawPigeon(c, 590, 760, 58, { dir: -1, bob: Math.sin(t * 4) * 1.2, peck: Math.sin(t * 1.7) > .95 ? .6 : 0 });   // another on the barrel
  drawFridge(c, 0);
  const duck = ease((t - TL.DUCK) / .45);
  const bobV = Math.sin(t * 2.1) * 2, bobC = Math.sin(t * 1.7 + 1) * 1.5;
  drawVera2(c, VERA.x, LCT + bobV + duck * 380, VERA.s, veraState(t, n));
  drawCleo2(c, CLEO.x, LCT + bobC, CLEO.s, cleoState(t, n));
  drawPigeon(c, CLEO.x + 8, LCT - 262 * CLEO.s / 100 + bobC, 62, { dir: 1, bob: Math.sin(t * 5 + 1) });   // and one on Cleo's head
  drawBeam(c, t, t > FIRE && t < FIRE + 1.0 ? 1 - ease((t - FIRE - .6) / .4) : 0, 'crown');
  c.drawImage(LAB_STATIC.front, 0, LCT);
  steam(c, t, VERA.x, LCT - 10, duck * (1 - ease((t - TL.DUCK - 3) / .6)));
  tShape(c, 'rgba(220,255,240,.35)', gg => gg.roundRect(560, LCT - 50, 44, 58, 6), 3); tShape(c, LAB.glow, gg => gg.rect(562, LCT - 22, 40, 28), 0);
  if (t > FIRE && t < FIRE + .45) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(230,215,255,${.8 * (1 - (t - FIRE) / .45)})`; c.fillRect(0, 0, W, H); }
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
  { type: 'bed', fx: 'lab_hum', t: 0, t1: DUR + .5, g: -31 },
  { type: 'bed', fx: 'street', t: 0, t1: DUR + .5, g: -34 },
  { type: 'hum', t: 0.0, dur: 3.2 },
  { type: 'coo', t: V.L2.t + 1.4 },
  { type: 'charge', t: V.L4.t, dur: FIRE - V.L4.t },
  { type: 'zap', t: FIRE },
  { type: 'rattle', t: FIRE + .05 },
  { type: 'steps', t: TL.BUMP - 1.6, dur: 1.6 },
  { type: 'shuffle', t: V.L6.t + .9 }, { type: 'shuffle', t: V.L7.t + .9 }, { type: 'shuffle', t: V.L7.t + 2.0 },
  { type: 'kneel', t: TL.KNEEL },
  { type: 'teacup', t: V.L9.t + 2.2 },
  { type: 'steam', t: TL.DUCK + .2 },
  { type: 'knock', t: TL.KNOCK },
  { type: 'chalk', t: TL.BOARDT + .2, dur: .9 },
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
