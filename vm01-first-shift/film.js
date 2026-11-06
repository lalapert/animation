// Void Mart, episode 1: "First Shift". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = 1080; SC.height = 1920;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));


function drawStoreExterior(g, x, y, k) {    // the tiny store on its rock
  g.save(); g.translate(x, y); g.scale(k, k);
  tShape(g, '#5a4a7a', gg => { gg.moveTo(-200, 40); gg.bezierCurveTo(-210, 120, -60, 170, 30, 150); gg.bezierCurveTo(150, 130, 220, 90, 200, 40); gg.closePath(); });
  tShape(g, '#e8e4f0', gg => gg.rect(-160, -110, 320, 150), 5);
  g.save(); g.shadowColor = '#ffd98a'; g.shadowBlur = 40; tShape(g, '#ffe8a8', gg => gg.rect(-140, -70, 200, 100), 4); g.restore();
  tShape(g, '#bfe9ff', gg => gg.rect(80, -70, 60, 110), 4);
  tShape(g, '#241640', gg => gg.rect(-150, -160, 300, 46), 4);
  drawLogo(g, 0, -137, 26, { glow: .6 });
  g.restore();
}

// ---------------------------------------------------------------- the monster at the door
function drawMonster(g, t) {
  const k = ease((t - TL.MONSTER - .25) / .9), x = lerp(W + 40, 760, k);
  if (k <= 0) return;
  g.save(); g.globalAlpha = .96;
  g.fillStyle = '#07030f';
  g.beginPath(); g.moveTo(x + 40, H); g.bezierCurveTo(x - 60, 1300, x - 40, 700, x + 120, 520);
  g.lineTo(x + 150, 430); g.lineTo(x + 190, 510); g.lineTo(x + 250, 400); g.lineTo(x + 290, 500); g.bezierCurveTo(x + 420, 560, W + 200, 700, W + 200, H); g.closePath(); g.fill();
  g.restore();
  const blink = ((t * 1.3) % 2.6) < .12;
  [[x + 150, 700, 26], [x + 240, 660, 30], [x + 320, 720, 24]].forEach(([ex, ey, r], i) => {
    if (blink && i === 1) return;
    g.save(); g.shadowColor = '#ffe14a'; g.shadowBlur = 30; g.fillStyle = '#ffe14a'; g.beginPath(); g.ellipse(ex, ey, r, r * .62, 0, 0, 6.2832); g.fill(); g.restore();
    g.fillStyle = '#07030f'; g.beginPath(); g.ellipse(ex - 6, ey, r * .25, r * .5, 0, 0, 6.2832); g.fill();
  });
}

// ---------------------------------------------------------------- a hand pressed on the glass (screen space)
function glassHand(g, x, y, k, alpha) {
  g.save(); g.globalAlpha = alpha;
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(x, y - 10 * k, 120 * k, 140 * k, 0, 0, 6.2832); g.fill();
  tHand(g, x, y, 22 * k, TOON.pip.skin, TOON.pip.skinS, true);
  g.restore();
}
function handPrint(g, x, y, k, alpha) {
  g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = 'screen';
  g.fillStyle = 'rgba(220,235,255,.35)';
  const r = 22 * k;
  g.beginPath(); g.ellipse(x, y, r * .95, r * .9, 0, 0, 6.2832); g.fill();
  [[-.9, -1.9], [-.3, -2.25], [.35, -2.15], [.95, -1.75]].forEach(([fx, fy]) => { g.beginPath(); g.ellipse(x + fx * r * .85, y + fy * r * .75, r * .26, r * .55, 0, 0, 6.2832); g.fill(); });
  g.beginPath(); g.ellipse(x - r * 1.5, y - r * .3, r * .22, r * .45, -.8, 0, 6.2832); g.fill();
  g.restore();
}
// ---------------------------------------------------------------- cameras
const CAM = {
  WIDE: [540, 1000, 1.18, 1.22],
  WIDE_FREEZE: [540, 1000, 1.2, 1.24],
  WIDE_MONSTER: [560, 1000, 1.2, 1.16],
  PIP_GLASS: [PIP.x + 20, PIPFACE + 95, 2.1, 2.2],
  PIP_PEEL: [PIP.x + 20, PIPFACE + 95, 2.2, 2.25],
  PIP_CU: [PIP.x, PIPFACE + 95, 2.15, 2.28],
  PIP_TINY: [PIP.x, PIPFACE + 90, 2.3, 2.5],
  RAE_MED: [RAE.x - 20, RAEFACE + 165, 1.55, 1.6],
  RAE_CU: [RAE.x, RAEFACE + 85, 2.35, 2.55],
  MAGS_CU: [MAGS.x, MAGSY + 30, 3.0, 3.15],
  BOARD: [BOARD.x, BOARD.y + 40, 2.9, 3.05],
};

// ---------------------------------------------------------------- characters for this frame
function pipState(t, shot) {
  const n = shot[0];
  let expr = 'grin', x = PIP.x, wave = false, wavePhase = null, sweat = false;
  if (n === 'WIDE') { const k = ease((t - TL.SHOTS[1][1]) / .35); x = lerp(-160, PIP.x, k) + Math.sin(clamp((t - TL.SHOTS[1][1] - .35) / .3) * Math.PI) * 14; wave = t > V.L1.t + .2; wavePhase = t * 11; }
  if (n === 'PIP_GLASS') expr = t < V.L3.t ? 'gasp' : 'grin';
  if (n === 'PIP_PEEL') expr = 'worried';
  if (n === 'WIDE_FREEZE') { expr = 'grin'; sweat = t > TL.FREEZE[0] + .3; }
  if (n === 'WIDE_MONSTER') expr = t > TL.MONSTER + .5 ? 'worried' : 'grin';
  if (n === 'RAE_MED') expr = 'worried';
  if (n === 'PIP_TINY') { expr = 'sheepish'; sweat = true; }
  const frozen = n === 'WIDE_FREEZE';
  const mouth = frozen ? null : mouthFor('PIP', t);
  const talking = mouth && mouth.a > .06;
  return { x, o: { expr, wave, wavePhase, sweat, mouth, blink: !frozen && blinkAt(0, t), arms: true }, bob: frozen ? 0 : Math.sin(t * 2.1) * 2 + (talking ? Math.sin(t * 15) * 2.5 : 0) };
}
function raeState(t, shot) {
  const n = shot[0];
  let look = 1.5, mug = null;
  if (n === 'WIDE_MONSTER') look = 3;
  if (n === 'RAE_MED' && t > V.L9.t) look = -3;
  if (n === 'WIDE_FREEZE') { const a = TL.FREEZE[0] + .5, b = TL.FREEZE[1] - .3; mug = t < a ? ease((t - a + .5) / .5) : t < b ? 1 : 1 - ease((t - b) / .3); }
  if (n === 'WIDE' || n === 'WIDE_MONSTER') mug = 0;
  const mouth = mouthFor('RAE', t);
  return { x: RAE.x, o: { expr: 'deadpan', look, mug, mouth, blink: blinkAt(1, t), scanner: true }, bob: Math.sin(t * 1.7 + 1) * 1.5 };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (n === 'VOID') {
    const z = lerp(.9, 1.25, ease(sk));
    drawSpace(c, t, z, 540, 820);
    const k = lerp(.55, 2.6, Math.pow(sk, 2.2));
    drawStoreExterior(c, 540, 1120 - (k - .55) * 60, k);
    const la = clamp(1 - (sk - .6) / .3);
    c.save(); c.globalAlpha = la; drawLogo(c, 540, 520, 74, { glow: .55 }); tText(c, 'EPISODE 1  ·  FIRST SHIFT', 540, 610, 34, '#f4eaff'); c.restore();
    return;
  }
  if (n === 'POV') {
    drawSpace(c, t, lerp(1.6, 1.9, sk), 540, 860);
    glassStreaks(c, .8);
    return;
  }
  const [cx, cy, z0, z1] = CAM[n], z = lerp(z0, z1, ease(sk));
  const shake = n === 'WIDE_MONSTER' && t > TL.MONSTER + .25 && t < TL.MONSTER + 1.0 ? Math.sin(t * 90) * 4 : 0;
  c.setTransform(z, 0, 0, z, 540 - cx * z + shake, 960 - cy * z);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 0, TL.FLIP);
  drawMags(c, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t), glow: V.L11 && t > V.L11.t ? 18 : 26 });
  const P = pipState(t, shot), R = raeState(t, shot);
  drawRae2(c, R.x, CT + R.bob, RAE.s, R.o);
  drawPip2(c, P.x, CT + P.bob, PIP.s, P.o);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c);
  if (n === 'RAE_MED' && t < V.L4.t && Math.sin(t * 9) > .6) { c.save(); c.globalAlpha = .7; tLine(c, [RAE.x + 44 * RAE.s / 100, CT - 38 * RAE.s / 100, 680, CT - 14], 3); c.restore(); }
  c.setTransform(1, 0, 0, 1, 0, 0);
  // screen-space layers
  if (n === 'PIP_GLASS') glassHand(c, 260, 1230, 3, 1);
  if (n === 'PIP_PEEL') {
    const k = ease((t - TL.PEEL[0]) / (TL.PEEL[1] - TL.PEEL[0]));
    handPrint(c, 260, 1230, 3, clamp((t - TL.PEEL[0] - .2) / .4));
    glassHand(c, 260 - k * 60, 1230 + k * 760, 3, 1);
  }
  if (n === 'PIP_CU' && t > V.L7.t) for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.3; drawStar(c, 540 + Math.cos(a) * 330, 700 + Math.sin(a * 1.3) * 200, 14 + 6 * Math.sin(a * 3), '#fff6b0', 2.4); }
  if (n.startsWith('WIDE') || n === 'RAE_MED' || n.startsWith('PIP')) glassStreaks(c, .9);
  if (n === 'WIDE_MONSTER' || (n === 'RAE_MED' && t > V.L9.t) || n === 'PIP_TINY' || (n === 'MAGS_CU' && t > V.L11.t) || n === 'BOARD') {
    const fl = n === 'WIDE_MONSTER' && t < TL.MONSTER + 1.1 ? (Math.sin(t * 47) > .3 ? .45 : .15) : .22;
    c.fillStyle = `rgba(10,4,24,${fl})`; c.fillRect(0, 0, W, H);
  }
  if (n === 'WIDE_MONSTER') drawMonster(c, t);
  if (n === 'RAE_MED' && t > V.L9.t) { c.save(); c.globalAlpha = .9; c.fillStyle = '#07030f'; c.fillRect(W - 120, 0, 120, H); c.restore(); }
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); }
window.render = render;

// ---------------------------------------------------------------- sound cues for the mix
const S = Object.fromEntries(TL.SHOTS.map(s => [s[0] + '@' + s[1], s[1]]));
const shotStarts = n => TL.SHOTS.filter(s => s[0] === n).map(s => s[1]);
window.EV = [
  { type: 'swoosh', t: 0.0 },
  { type: 'door', t: 1.55 },
  { type: 'whoosh', t: TL.SHOTS[1][1], pan: -.5 },
  { type: 'sparkle', t: shotStarts('POV')[0] + .1 },
  { type: 'glass', t: shotStarts('PIP_GLASS')[0] + .05 },
  { type: 'beep', t: V.L3.t + .25, pan: .3 }, { type: 'beep', t: V.L3.t + 1.6, pan: .3 },
  { type: 'squeak', t: TL.PEEL[0] },
  ...shotStarts('MAGS_CU').map(t => ({ type: 'blip', t: t + .02 })),
  { type: 'sip', t: TL.FREEZE[0] + .8, pan: .3 },
  { type: 'chime', t: TL.MONSTER },
  { type: 'flicker', t: TL.MONSTER + .05 },
  { type: 'rumble', t: TL.MONSTER + .25, pan: .6 },
  { type: 'flip', t: TL.FLIP },
  { type: 'bed', fx: 'store_hum', t: TL.SHOTS[1][1] - .2, t1: DUR + .5, g: -30 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
