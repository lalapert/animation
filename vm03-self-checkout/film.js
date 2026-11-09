// Void Mart, episode 3: "Self-Checkout". Corporate sends a self-checkout kiosk. It is more deadpan than Rae.
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Shared set, cameras and subtitles: channel/brand/vmkit.js
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const KX = 545, KW = 124, KH = 262;                        // the kiosk stands on the counter between Pip and Rae
const TRAY = { x: 432, y: CT - 30, w: 92 };               // the bagging area, sticking out on Pip's side
const STRIP = { x: 655, y: CT - 12 };                     // (Rae's left hand rests right next to it)                     // the power strip on the counter, Rae's side

// ---------------------------------------------------------------- the kiosk ("Kevin")
// state: 'idle' | 'alert' | 'dead'; talk 0..1; k (dead: 0 = just unplugged .. 1 = black)
function drawKiosk(g, t, st, talk, k = 1) {
  const x0 = KX - KW / 2, y0 = CT - KH;
  // power cord to the strip
  if (st !== 'dead' && !(t > TL.PLUG)) { g.save(); g.strokeStyle = TOON.ink; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + KW - 10, CT - 20); g.quadraticCurveTo(STRIP.x - 40, CT + 4, STRIP.x - 16, STRIP.y);
  g.stroke(); g.strokeStyle = '#3a3448'; g.lineWidth = 3.5; g.stroke(); g.restore(); }
  // body
  tShape(g, '#e9e6f4', gg => gg.roundRect(x0, y0, KW, KH, 14));
  tShade(g, gg => gg.roundRect(x0, y0, KW, KH, 14), '#c6c1da', gg => gg.rect(x0 + KW * .72, y0 - 10, KW, KH + 20));
  tShape(g, '#7a8098', gg => gg.roundRect(x0 + 10, y0 + 150, KW - 20, 26, 6), 3);                          // scanner glass
  g.fillStyle = st === 'dead' ? '#5a2030' : '#ff4f6b'; g.fillRect(x0 + 18, y0 + 162, KW - 36, 3);
  tShape(g, '#7a8098', gg => gg.roundRect(x0 + 34, y0 + 196, KW - 68, 14, 5), 2.6);                          // receipt slot
  tText(g, 'SELF CHECKOUT', KX, y0 + 230, 13, TOON.ink, '"Bungee"', 'center', 400);
  // alarm lamp on top
  const lampOn = st === 'alert' && Math.floor(t * 4) % 2 === 0;
  g.save(); if (lampOn) { g.shadowColor = '#ff3355'; g.shadowBlur = 40; }
  tShape(g, lampOn ? '#ff3355' : '#7a3040', gg => { gg.moveTo(KX - 16, y0); gg.lineTo(KX - 12, y0 - 26); gg.quadraticCurveTo(KX, y0 - 36, KX + 12, y0 - 26); gg.lineTo(KX + 16, y0); gg.closePath(); }, 3.4);
  g.restore();
  // the gift bow corporate put on it
  if (st !== 'dead') for (const s of [-1, 1]) tShape(g, '#e23b4a', gg => { gg.moveTo(KX + s * 20, y0 + 6); gg.quadraticCurveTo(KX + s * 56, y0 - 22, KX + s * 46, y0 + 20); gg.closePath(); }, 3);
  // the screen and its face
  const sx = x0 + 12, sy = y0 + 18, sw = KW - 24, sh = 92;
  tShape(g, '#162434', gg => gg.roundRect(sx, sy, sw, sh, 8), 3.4);
  g.save(); g.beginPath(); g.roundRect(sx + 3, sy + 3, sw - 6, sh - 6, 6); g.clip();
  if (st === 'alert') {
    g.fillStyle = Math.floor(t * 4) % 2 ? '#c9283e' : '#8e1b2c'; g.fillRect(sx, sy, sw, sh);
    tText(g, '!', KX, sy + 38, 46, '#fff', '"Bungee"', 'center', 400); tText(g, 'HELP', KX, sy + 76, 16, '#fff', '"Bungee"', 'center', 400);
  } else if (st === 'dead') {
    const kk = clamp(k / .5);                                       // old-TV switch-off: the picture collapses to a line, then a dot
    g.fillStyle = '#05080c'; g.fillRect(sx, sy, sw, sh);
    if (kk < 1) { g.fillStyle = `rgba(200,245,255,${1 - kk})`; const lw = sw * (1 - kk * .9), lh = Math.max(2, sh * (1 - kk) * .15); g.fillRect(KX - lw / 2, sy + sh / 2 - lh / 2, lw, lh); }
  } else {
    g.fillStyle = '#1d3a4c'; g.fillRect(sx, sy, sw, sh);
    const ey = sy + 34, blink = Math.floor(t * 10) % 37 === 0;
    g.fillStyle = '#9fe6ff';
    for (const s of [-1, 1]) g.fillRect(KX + s * 22 - 7, ey - (blink ? 1 : 7), 14, blink ? 2 : 14);
    // mouth: a flat line; it only wobbles while it talks
    g.strokeStyle = '#9fe6ff'; g.lineWidth = 4; g.beginPath();
    for (let i = 0; i <= 20; i++) { const xx = KX - 24 + i * 2.4, yy = sy + 66 + Math.sin(i * 1.3 + t * 30) * 5 * talk; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
    g.stroke();
  }
  g.restore();
  // the bagging area: a little scale with a tray
  tShape(g, '#c6c1da', gg => gg.rect(TRAY.x + TRAY.w - 10, TRAY.y - 4, 30, 34), 3);
  tShape(g, '#e9e6f4', gg => gg.roundRect(TRAY.x - TRAY.w / 2, TRAY.y - 12, TRAY.w, 14, 4), 3.4);
  tText(g, 'BAGGING AREA', TRAY.x, TRAY.y + 14, 9, TOON.ink, '"Bungee"', 'center', 400);
}
function drawStrip(g, plugged) {
  tShape(g, '#fbf7ff', gg => gg.roundRect(STRIP.x - 26, STRIP.y - 9, 64, 20, 6), 3);
  for (const dx of [8, 24]) tShape(g, '#3a3448', gg => gg.rect(STRIP.x + dx - 3, STRIP.y - 3, 6, 8), 1.6);
  if (plugged) tShape(g, '#3a3448', gg => gg.roundRect(STRIP.x - 22, STRIP.y - 13, 20, 24, 4), 3);   // the plug, in
  tShape(g, '#e23b4a', gg => gg.roundRect(STRIP.x + 30, STRIP.y - 5, 6, 10, 2), 1.8);
}

// ---------------------------------------------------------------- the customer: a small jelly blob, one eye
function drawBlob(g, x, y, s, o = {}) {
  const sq = o.squash || 0, w = 44 * (1 + .25 * sq), h = 40 * (1 - .3 * sq);
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  tLine(g, [4, -h * 2 + 6, 12, -h * 2 - 18], 3); tEllipse(g, 13, -h * 2 - 20, 6, 6, '#ffd23f', 2.6);          // antenna
  const body = gg => { gg.moveTo(-w, 0); gg.bezierCurveTo(-w, -h * 2.2, w, -h * 2.2, w, 0); gg.closePath(); };
  tShape(g, 'rgba(95,227,204,.92)', body);
  tShade(g, body, 'rgba(42,165,146,.9)', gg => gg.ellipse(w * .5, -h * .2, w * .7, h * .9, 0, 0, 6.2832));
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-w * .45, -h * 1.25, 8, 13, -.5, 0, 6.2832); g.fill();
  // one big eye
  const ex = (o.look || 0) * 6, ey = -h * 1.05;
  if (o.blink) tCurve(g, -14, ey, 0, ey + 6, 14, ey, 3.6);
  else { tEllipse(g, 0, ey, 15, 16, TOON.white, 3.4); g.fillStyle = TOON.ink; g.beginPath(); g.arc(ex, ey + 2, 7, 0, 6.2832); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 3, ey - 2, 2.4, 0, 6.2832); g.fill(); }
  g.restore();
}
// where the blob is: in from the left, hops into the bagging area, scoots off, hops back on
function blobAt(t) {
  const P0 = [-120, CT - 260], ONT = [TRAY.x, TRAY.y - 12], OFFP = [TRAY.x - 120, CT - 4];
  const hop = (a, b, k, hgt) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * hgt];
  if (t < TL.DOOR) return null;
  if (t < TL.PLOP) { const k = ease((t - TL.DOOR) / (TL.PLOP - TL.DOOR)); return { p: hop(P0, ONT, k, 160), sq: 0 }; }
  const land = (t0) => Math.max(0, 1 - (t - t0) / .25) * (t > t0 ? 1 : 0);
  if (t < TL.OFF) return { p: ONT, sq: land(TL.PLOP), look: Math.sin((t - TL.PLOP) * 2.5) };
  if (t < TL.OFF + .45) { const k = ease((t - TL.OFF) / .45); return { p: hop(ONT, OFFP, k, 40), sq: 0, look: -1 }; }
  if (t < TL.ON) return { p: OFFP, sq: land(TL.OFF + .45), look: 1 };
  if (t < TL.ON + .45) { const k = ease((t - TL.ON) / .45); return { p: hop(OFFP, ONT, k, 60), sq: 0, look: 1 }; }
  return { p: ONT, sq: land(TL.ON + .45), look: t > V.L9.t ? Math.sin(t * 9) : .3 };
}

// Rae's left hand: from the counter to the plug, yanks it, holds it up while she talks (local units of drawRae2)
function raeReach(t) {
  const rest = [-8, -23], plug = [-51, -10], up = [-44, -72], show = [-30, -98];
  const t0 = TL.PLUG - .35;
  if (t < t0 || t > V.L10.t + V.L10.dur + .4) return null;
  if (t < TL.PLUG) { const k = ease((t - t0) / .35); return { x: lerp(rest[0], plug[0], k), y: lerp(rest[1], plug[1], k), plug: false }; }
  if (t < TL.PLUG + .2) { const k = ease((t - TL.PLUG) / .2); return { x: lerp(plug[0], up[0], k), y: lerp(plug[1], up[1], k), plug: true }; }
  if (t < V.L10.t) return { x: up[0], y: up[1], plug: true };
  const k = ease((t - V.L10.t) / .3); return { x: lerp(up[0], show[0], k), y: lerp(up[1], show[1], k), plug: true };
}
function drawHeldPlug(g, r, bob) {
  const hx = RAE.x + r.x * RAE.s / 100, hy = CT + bob + r.y * RAE.s / 100;
  g.save(); g.strokeStyle = TOON.ink; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - 6, hy + 18); g.quadraticCurveTo(hx - 40, CT - 10, KX + KW / 2 - 10, CT - 20); g.stroke(); g.strokeStyle = '#3a3448'; g.lineWidth = 3.5; g.stroke(); g.restore();
  tShape(g, '#3a3448', gg => gg.roundRect(hx - 12, hy - 4, 22, 26, 4), 3);
  for (const dx of [-5, 3]) tShape(g, '#c9cfdb', gg => gg.rect(hx + dx, hy - 16, 4, 12), 1.6);
}

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, VMCAM, {
  WIDE_KIOSK: [545, CT - 200, 1.7, 1.92],
  KIOSK_CU: [KX - 30, CT - 140, 2.55, 2.7],
  KIOSK_MED: [KX - 40, CT - 130, 1.95, 2.02],
  KIOSK_ALERT: [KX, CT - 150, 2.3, 2.9],
  SOCKET_CU: [STRIP.x + 20, CT - 60, 3.0, 3.15],
  WIDE_DOOR: [520, 1020, 1.2, 1.24],
  WIDE_END: [545, 1010, 1.24, 1.3],
});

function pipState(t, n) {
  let expr = 'grin', sweat = false;
  if (t < V.L1.t + 2.4) expr = 'gasp';
  if (t > V.L5.t && t < V.L8.t) expr = 'worried';
  if (n === 'PIP_CU' && t >= V.L8.t && t < V.L9.t) { expr = 'worried'; sweat = true; }
  if (t >= TL.STARE) expr = 'gasp';
  if (t >= V.L11.t) expr = 'sad';
  return { expr, sweat, mouth: mouthFor('PIP', t), blink: blinkAt(0, t), arms: true, wave: false, hold: false };
}
function raeState(t, n) {
  let mug = null, expr = 'deadpan', look = 1.5;
  if (t >= TL.STARE && t < TL.PLUG - .2) look = -2.5;                        // looks at the kiosk
  if (n === 'WIDE_END') { const a = DUR - 2.0; mug = ease((t - a) / .5) * (1 - ease((t - a - 1.2) / .4)); }
  if (n === 'RAE_CU' && t >= TL.STARE) { mug = ease((t - TL.STARE) / .35) * (1 - ease((t - TL.STARE - .6) / .25)); }
  return { expr, look, mug, mouth: mouthFor('RAE', t), blink: blinkAt(1, t), scanner: true };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 0, TL.FLIP);
  drawMags(c, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) });
  const bobP = Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0), bobR = Math.sin(t * 1.7 + 1) * 1.5;
  drawRae2(c, RAE.x, CT + bobR, RAE.s, raeState(t, n));
  drawPip2(c, PIP.x, CT + bobP, PIP.s, pipState(t, n));
  c.drawImage(STATIC.front, 0, CT);
  const rr = raeReach(t);
  const st = t >= TL.DARK ? 'dead' : t >= V.L9.t ? 'alert' : 'idle';
  drawKiosk(c, t, st, talkLevel('KIOSK', t), st === 'dead' ? (t - TL.DARK) / .6 : 1);
  drawStrip(c, t < TL.PLUG + .05);
  if (rr && rr.plug) drawHeldPlug(c, rr, bobR);
  const b = blobAt(t);
  if (b) drawBlob(c, b.p[0], b.p[1], 100, { squash: b.sq, look: b.look, blink: blinkAt(3, t) });
  // the hook: sparkles around the brand-new kiosk
  if (t < 3) for (let i = 0; i < 5; i++) { const a = i * 1.3 + t * 2, r = 120 + 20 * Math.sin(t * 3 + i); drawStar(c, KX + Math.cos(a) * r, CT - 160 + Math.sin(a) * r * .8, 8 + 4 * Math.sin(t * 6 + i), '#fff6c8', 2); }
  glassStreaks(c, .9);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

window.EV = [
  { type: 'sparkle', t: 0.1 },
  ...vmShotsFrom('MAGS_CU').map(t => ({ type: 'blip', t: t + .02 })),
  { type: 'blip', t: V.L1.t - .05 },
  { type: 'chime', t: TL.DOOR },
  { type: 'boing', t: TL.DOOR + .3 },
  { type: 'blorp', t: TL.PLOP },
  { type: 'beep', t: V.L5.t - .25, pan: .1 },
  { type: 'scoot', t: TL.OFF },
  { type: 'beep', t: V.L6.t - .25, pan: .1 },
  { type: 'blorp', t: TL.ON + .45 },
  { type: 'beep', t: V.L7.t - .25, pan: .1 },
  { type: 'alarm', t: V.L9.t - .05, dur: TL.PLUG - V.L9.t + .1 },
  { type: 'sip', t: TL.STARE + .3, pan: .3 },
  { type: 'unplug', t: TL.PLUG + .1 },
  { type: 'powerdown', t: TL.DARK },
  { type: 'flip', t: TL.FLIP },
  { type: 'sip', t: DUR - 1.4, pan: .3 },
  { type: 'bed', fx: 'store_hum', t: 0, t1: DUR + .5, g: -30 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
