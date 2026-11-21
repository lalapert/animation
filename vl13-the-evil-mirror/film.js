// Volt Labs, episode 13: "The Evil Mirror". Whoever looks into Vera's new mirror, their evil twin steps out of it. Evil Vera is
// her opposite (polite, early, she paid the rent); Vera sends her back, and she takes the rent money with her. Evil Cleo is exactly
// Cleo (but for the goatee): "No." "We know." "One of you, back in the mirror." The two Cleos cross, the real one goes in, the
// goatee stays: "Finally. Normal." "Normal." Script: channel/scripts/VL13_the_evil_mirror.md
// Lab set, cameras, window, fridge: channel/brand/labkit.js; lip sync, subtitles, shots, end card: channel/brand/vmkit.js; Vera and
// Cleo: channel/brand/lab.js (unchanged; a twin is the same rig drawn mirrored, with a goatee and a violet mirror glow);
// walk bob: channel/brand/travel.js. The mirror, its ripples, the receipt and the PAY RENT spiral are drawn here.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const TW = document.createElement('canvas'); TW.width = W; TW.height = H;   // a twin is drawn here first, then laid in with its glow
const tw = TW.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const spOf = k => V[k].t + CHARS[k][0][1];
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 190, K9 = S / 100, VX = TL.VX, CX = TL.CX, MX = TL.MX, CXL = TL.CX_LOOK;
const VFACE = LCT - 222 * K9, CFACE = LCT - 200 * K9;
const VIOLET = '#c77dff';

// ---------------------------------------------------------------- the mirror: a tall oval in a black frame with a gold rim, two
// small horns and a violet gem, standing behind the bench against the wall (its foot is hidden by the bench)
const MIR = { x: MX, y: 1004, rx: 142, ry: 314, gx: 118, gy: 290 };
const glassPath = gg => gg.ellipse(MIR.x, MIR.y, MIR.gx, MIR.gy, 0, 0, 6.2832);
const RIPS = () => [TL.RIP1, TL.IN1 - .15, TL.RIP2, TL.IN2 - .15];
const FLASHES = () => [TL.OUT1, TL.IN1, TL.OUT2, TL.IN2];
function mirrorActive(t) { return RIPS().some(r => t >= r - .1 && t < r + 1.0); }
function drawMirrorBack(g, t) {                                      // the frame and the empty glass
  const { x, y, rx, ry, gx, gy } = MIR;
  for (const s of [-1, 1]) tShape(g, '#6a2448', gg => { gg.moveTo(x + s * 30, y - ry + 18); gg.quadraticCurveTo(x + s * 62, y - ry - 40, x + s * 44, y - ry - 62); gg.quadraticCurveTo(x + s * 46, y - ry - 26, x + s * 14, y - ry + 8); gg.closePath(); }, 4);   // horns
  tShape(g, '#1f1830', gg => gg.ellipse(x, y, rx, ry, 0, 0, 6.2832), 5);
  g.save(); g.lineWidth = 7; g.strokeStyle = '#e0b040'; g.beginPath(); g.ellipse(x, y, gx + 9, gy + 9, 0, 0, 6.2832); g.stroke(); g.restore();
  for (let i = 0; i < 10; i++) { const a = -1.5708 + i * .628, px = x + Math.cos(a) * (rx - 11), py = y + Math.sin(a) * (ry - 11); g.fillStyle = '#e0b040'; g.beginPath(); g.arc(px, py, 4.5, 0, 6.2832); g.fill(); }
  g.save(); g.beginPath(); glassPath(g); g.clip();
  const gr = g.createLinearGradient(x - gx, y - gy, x + gx, y + gy); gr.addColorStop(0, '#dcd8f4'); gr.addColorStop(.5, '#a79fd6'); gr.addColorStop(1, '#6f66a8');
  g.fillStyle = gr; g.fillRect(x - gx, y - gy, 2 * gx, 2 * gy);
  // the room in the glass, dimly: the wall's bricks and a bench edge (their board has no circles: they pay the rent there)
  g.globalAlpha = .18; g.fillStyle = '#2b4a5c'; for (let r = 0; r < 14; r++) for (let k = -1; k < 3; k++) g.fillRect(x - gx + k * 90 + (r % 2) * 45, y - gy + r * 44, 84, 38);
  g.globalAlpha = 1; g.restore();
}
function drawMirrorFront(g, t) {                                     // over whatever is in the glass: the tint, the streaks, ripples
  const { x, y, gx, gy } = MIR;
  g.save(); g.beginPath(); glassPath(g); g.clip();
  g.fillStyle = 'rgba(176,160,255,.16)'; g.fillRect(x - gx, y - gy, 2 * gx, 2 * gy);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineCap = 'round';
  for (const [dx, dy, len, w] of [[-70, -170, 80, 9], [-52, -140, 46, 5], [56, 120, 60, 7]]) { g.lineWidth = w; g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + len * .6, y + dy - len); g.stroke(); }
  for (const r of RIPS()) {                                           // the glass ripples like water: rings out from the middle
    const u = (t - r) / .9; if (u < 0 || u > 1) continue;
    for (let i = 0; i < 4; i++) { const k = u * 1.25 - i * .17; if (k <= 0 || k > 1) continue;
      g.lineWidth = 6 * (1 - k) + 1.5; g.strokeStyle = `rgba(245,235,255,${(.85 * (1 - k)).toFixed(3)})`;
      g.beginPath(); g.ellipse(x, y - 40, gx * 1.3 * k, gy * 1.1 * k, 0, 0, 6.2832); g.stroke(); }
  }
  for (const f of FLASHES()) if (t >= f - .035 && t < f + .035) { g.fillStyle = '#f6f0ff'; g.fillRect(x - gx, y - gy, 2 * gx, 2 * gy); }   // two frames of light
  g.restore();
  g.save(); if (mirrorActive(t)) { g.shadowColor = VIOLET; g.shadowBlur = 26; }
  tShape(g, mirrorActive(t) ? '#e7c2ff' : '#9a5fd0', gg => { gg.moveTo(x, MIR.y - MIR.ry - 22); gg.lineTo(x + 16, MIR.y - MIR.ry - 4); gg.lineTo(x, MIR.y - MIR.ry + 14); gg.lineTo(x - 16, MIR.y - MIR.ry - 4); gg.closePath(); }, 3.4);
  g.restore();
}

// ---------------------------------------------------------------- a twin: the same rig, mirrored, with a black goatee and a violet
// glow around the whole figure; "inside" it is the reflection, smaller, drawn only in the glass under its tint
function goatee(g, chin, lip, w) {                                    // a villain's Van Dyke: a curled moustache over the lip and a short
  const p = gg => { gg.moveTo(-9, chin - 3); gg.quadraticCurveTo(-7, chin + 8, 0, chin + 17); gg.quadraticCurveTo(7, chin + 8, 9, chin - 3); gg.quadraticCurveTo(0, chin + 1, -9, chin - 3); gg.closePath(); };
  tShape(g, '#1e1530', p, 2.4);                                         // pointed goatee under the chin (on the skin of the neck)
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(sx * 2, lip); g.quadraticCurveTo(sx * w * .55, lip - 3, sx * w, lip + 1); g.quadraticCurveTo(sx * (w + 5), lip - 6, sx * (w + 1), lip - 9);
    g.lineCap = 'round'; g.lineWidth = 5.4; g.strokeStyle = TOON.ink; g.stroke(); g.lineWidth = 2.6; g.strokeStyle = '#3a2a55'; g.stroke();
  }
}
function drawTwinRig(g, kind, x, y, s, o, extra) {
  g.save(); g.translate(x, y); g.scale(-1, 1);                       // mirrored: her parting, earring and clip on the other side
  if (kind === 'vera') drawVera2(g, 0, 0, s, o); else drawCleo2(g, 0, 0, s, o);
  g.scale(s / 100, s / 100); if (kind === 'vera') goatee(g, -174, -197, 12); else goatee(g, -154, -174, 10);
  g.restore();
  if (extra) extra(g);
}
// mode 'out': in the room, with its glow; 'in': the reflection in the glass (k = 0.86 scale, behind the tint)
function drawTwin(kind, x, o, mode, k = 1, dy = 0, extra) {
  const m = c.getTransform();
  tw.setTransform(1, 0, 0, 1, 0, 0); tw.clearRect(0, 0, W, H); tw.setTransform(m);
  drawTwinRig(tw, kind, x, LCT + dy, S * k, o, extra);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  if (mode === 'in') { c.setTransform(m); c.beginPath(); glassPath(c); c.clip(); c.setTransform(1, 0, 0, 1, 0, 0); }
  else { c.shadowColor = VIOLET; c.shadowBlur = 24; }
  c.drawImage(TW, 0, 0);
  c.restore();
}
function receiptIn(x, k, dy, r) {                                    // the receipt in Evil Vera's (mirrored) hand, then the hand over it
  return g => { const hx = x - r.x * K9 * k, hy = LCT + dy + r.y * K9 * k; g.save(); g.translate(hx, hy); g.scale(k, k); drawReceipt(g, -6, -34); g.restore(); tHand(g, hx, hy, 9.5 * K9 * k, LAB2.vera.skin, LAB2.vera.skinS); };
}
function drawReceipt(g, x, y) {                                       // RENT, PAID: in Evil Vera's hand
  g.save(); g.translate(x, y); g.rotate(-.08);
  tShape(g, '#fbfaf2', gg => gg.roundRect(-34, -46, 68, 92, 5), 3.4);
  tText(g, 'RENT', 0, -28, 15, TOON.ink, '"Bungee"', 'center', 400);
  for (let i = 0; i < 3; i++) tLine(g, [-22, -10 + i * 10, 22 - (i % 2) * 12, -10 + i * 10], 2);
  g.save(); g.rotate(-.25); g.strokeStyle = '#d8344a'; g.lineWidth = 3.4; g.strokeRect(-30, 14, 60, 22); tText(g, 'PAID', 0, 26, 17, '#d8344a', '"Bungee"', 'center', 400); g.restore();
  g.restore();
}

// ---------------------------------------------------------------- who is where (waist-up walks behind the bench, footfalls bob)
function walkPos(t, segs, x0) {                                      // segs: [t0, t1, xa, xb]
  let x = x0, moving = false, dist = 0;
  for (const [a, b, xa, xb] of segs) { if (t >= b) x = xb; else if (t > a) { const k = (t - a) / (b - a); return { x: lerp(xa, xb, k), moving: true, dist: Math.abs(xb - xa) * k }; } }
  return { x, moving, dist };
}
const STEP = 75;                                                      // a short step behind the bench (px)
const bobOf = p => p.moving ? -5 * Math.tanh(-walkBob(p.dist, STEP, 8).dy / 5) : 0;
const cleoWalks = () => [[TL.CW0, TL.CW1, CX, CXL], [TL.SWAP0, TL.SWAP1, CXL, MX]];
const ecleoWalks = () => [[TL.SWAP0, TL.SWAP1, MX, CXL], [TL.EC0, TL.EC1, CXL, CX]];
function veraState(t) {
  const loc = (wx, wy) => ({ x: (wx - VX) / K9, y: (wy - LCT) / K9 });
  const o = { expr: 'scheme', mouth: mouthFor('VERA', t), blink: t > .6 && blinkAt(0, t), tube: false };
  if (t < V.L2.t) o.reachR = loc(MIR.x - MIR.rx + 8, 1010);           // frame 1: her hand on the mirror's frame
  else if (t < V.L3.t) o.expr = 'cool';
  else if (t < TL.OUT1) { o.expr = 'scheme'; o.reachR = loc(MIR.x - MIR.rx + 8, 1010); o.turn = .45 * smooth(TL.LOOKV - .2, TL.LOOKV + .15, t); }   // she looks in
  else if (t < V.L5.t) o.expr = 'fluster';
  else if (t < endOf('L5')) { o.expr = 'fluster'; if (t > V.L5.t + .8) o.reachR = loc(462, 1150); }   // "Back in the mirror!" (a hand toward it, chest-high)
  else if (t < V.L7.t) o.expr = 'cool';
  else if (t < endOf('L7')) { o.expr = 'scheme'; o.tube = true; }   // "Cleo, you look."
  else if (t < V.L9.t) o.expr = 'scheme';
  else if (t < V.L11.t) o.expr = 'fluster';                           // "That's exactly what Cleo would say!"
  else if (t < V.L12.t) { o.expr = 'cool'; if (t > V.L11.t + .1 && t < endOf('L11') + .1) o.reachR = loc(462, 1150); }   // "One of you, back in the mirror."
  else o.expr = t < endOf('L12') ? 'laugh' : 'cool';                 // "Finally. Normal."
  return o;
}
function cleoState(t) {
  const p = walkPos(t, cleoWalks(), CX), both = mouthFor('BOTH', t);
  const o = { expr: 'deadpan', mouth: both || mouthFor('CLEO', t), blink: blinkAt(1, t) || (t >= TL.SYNC && t < TL.SYNC + .13), remote: true };
  if (t >= TL.CW1 - .1 && t < TL.OUT2 + .3) o.turn = -.45;             // looking into the mirror (on her left)
  if (t >= TL.OUT2 + .3 && t < TL.SWAP0) o.look = -1;                  // at her twin
  return { p, o };
}
function ecleoState(t) {
  const p = walkPos(t, ecleoWalks(), MX), both = mouthFor('BOTH', t);
  const o = { expr: 'deadpan', mouth: both || mouthFor('EVIL_CLEO', t), blink: blinkAt(1, t) || (t >= TL.SYNC && t < TL.SYNC + .13), remote: true };
  if (t >= TL.OUT2 + .3 && t < TL.SWAP0) o.look = -1;                  // mirrored: she looks at Cleo
  if (t >= TL.STROKE) { const k = smooth(TL.STROKE, TL.STROKE + .3, t); o.reachL = { x: lerp(-20, -4, k), y: lerp(-40, -122, k) }; }   // fingers to the goatee's tip
  return { p, o };
}
function eveState(t) {                                                // Evil Vera: polite, smiling; the receipt from "I paid the rent."
  const o = { expr: 'cool', mouth: mouthFor('EVIL_VERA', t), blink: blinkAt(3, t), tube: false };
  let rec = null;
  if (t >= V.L4.t + .3 && t < TL.IN1 + .05) {
    const k = smooth(V.L4.t + .3, V.L4.t + .6, t);
    o.reachR = { x: lerp(64, 36, k), y: lerp(-10, -118, k) }; rec = true;
  }
  if (t >= V.L6.t && t < V.L6.t + .5) o.expr = 'laugh';                // "Of course!"
  return { o, rec };
}
// ---------------------------------------------------------------- the PAY RENT spiral (owner 11/16; as in VL10 and VL12)
function spiralPt(th) { const cx = LBOARD.x - 68, cy = LBOARD.y + 80, turns = th / 6.2832; return [cx + Math.cos(th - 2.4) * (114 + 10 * turns), cy + Math.sin(th - 2.4) * (27 + 6 * turns)]; }
function drawRentSpiral(g, n, k = 0) {
  const th1 = 6.2832 * (n + clamp(k));
  g.save(); g.strokeStyle = '#ff8fb1'; g.lineWidth = 4.5; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); for (let th = 0; th <= th1; th += .05) { const [x, y] = spiralPt(th); th ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.restore();
  return spiralPt(th1);
}
function drawChalkArm(g, t, hand) {                                  // an arm from below the frame, the chalk at the spiral's end
  if (t < TL.BOARDT + .15 || t > TL.BOARDT + 2.0) return;
  const enter = ease((t - TL.BOARDT - .15) / .25) * (1 - ease((t - TL.BOARDT - 1.6) / .3));
  const hx = lerp(hand[0] + 90, hand[0], enter), hy = lerp(980, hand[1], enter);
  const rx = hx + 110, ry = 980, ex = (hx + rx) / 2 + 34, ey = (hy + ry) / 2 + 10;
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

// ---------------------------------------------------------------- cameras: [centre x, centre y, zoom at shot start, zoom at shot end]
const cam = (x, y, z0, z1) => [clamp(x, 540 / z0, 1080 - 540 / z0), y, z0, z1];
const CAM = {
  OPEN: cam(450, 1010, 1.75, 1.82),                                  // frame 1: her face big, the mirror and her goateed reflection
  CLEO_CU: cam(CX - 20, CFACE + 80, 2.3, 2.4),
  MIRROR: cam(450, 1030, 1.5, 1.55),                                 // Vera and the mirror (and whoever steps out of it)
  VERA_CU: cam(VX + 10, VFACE + 80, 2.3, 2.42),
  WIDE: cam(540, 1010, 1.04, 1.08),
  CLEOS: cam(660, 1020, 1.6, 1.66),                                  // the two Cleos side by side
  BOARD_END: [200, 452, 2.15, 2.2],                                  // the whole 14th loop in frame; the board's lines under the card (y > 800)
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
    const hand = drawRentSpiral(c, 13, t > TL.BOARDT + .3 ? (t - TL.BOARDT - .3) / .9 : 0);
    drawChalkArm(c, t, hand);
    c.drawImage(LAB_STATIC.front, 0, LCT);
    return;
  }
  drawRentSpiral(c, 13, 0);
  drawFridge(c, 0);
  // the mirror and what is in its glass
  drawMirrorBack(c, t);
  const eve = eveState(t);
  if (t < TL.OUT1) drawTwin('vera', MX, eve.o, 'in', .86, 8);                                  // her reflection: the goatee, the smile
  if (t >= TL.IN1 && t < TL.AWAY1 + .9) {                                                       // back in, and away to the right, inside
    const p = { moving: t > TL.AWAY1, dist: Math.max(0, t - TL.AWAY1) * 240 };
    const ex = MX + Math.max(0, t - TL.AWAY1) * 240, ey = 8 + bobOf(p), ro = { ...eve.o, mouth: null, reachR: { x: 36, y: -118 } };
    drawTwin('vera', ex, ro, 'in', .86, ey, receiptIn(ex, .86, ey, ro.reachR));   // she takes the receipt with her
  }
  if (t >= TL.CW1 && t < TL.OUT2) drawTwin('cleo', MX, ecleoState(t).o, 'in', .86, 8);        // Evil Cleo, in the glass, while Cleo looks
  if (t >= TL.IN2 && t < TL.AWAY2 + .9) {                                                       // the real Cleo, in, and away to the left
    const p = { moving: t > TL.AWAY2, dist: Math.max(0, t - TL.AWAY2) * 240 };
    c.save(); c.beginPath(); glassPath(c); c.clip();
    drawCleo2(c, MX - Math.max(0, t - TL.AWAY2) * 240, LCT + 8 + bobOf(p), S * .86, { expr: 'deadpan', blink: blinkAt(1, t), remote: true });
    c.restore();
  }
  drawMirrorFront(c, t);
  // the people, behind the bench
  drawVera2(c, VX, LCT, S, veraState(t));
  if (t >= TL.OUT1 && t < TL.IN1) {                                   // Evil Vera, out in the room in front of the mirror
    const k = t < TL.OUT1 + .3 ? lerp(.9, 1, smooth(TL.OUT1, TL.OUT1 + .3, t)) : t > TL.IN1 - .2 ? lerp(1, .94, smooth(TL.IN1 - .2, TL.IN1, t)) : 1;
    const bow = t >= V.L6.t && t < V.L6.t + .6 ? 12 * Math.sin(Math.PI * (t - V.L6.t) / .6) : 0;
    drawTwin('vera', MX, eve.o, 'out', k, (1 - k) * -60 + bow, eve.rec ? receiptIn(MX, k, (1 - k) * -60 + bow, eve.o.reachR) : null);
  }
  const cs = cleoState(t), es = ecleoState(t);
  const ecOut = t >= TL.OUT2;
  if (ecOut) {                                                        // Evil Cleo (behind the real one when they cross)
    const k = t < TL.OUT2 + .3 ? lerp(.9, 1, smooth(TL.OUT2, TL.OUT2 + .3, t)) : 1;
    drawTwin('cleo', es.p.x, es.o, 'out', k, (1 - k) * -60 + bobOf(es.p));
  }
  if (!(t >= TL.IN2)) {                                               // the real Cleo (until she goes into the mirror)
    const k = t > TL.IN2 - .2 ? lerp(1, .94, smooth(TL.IN2 - .2, TL.IN2, t)) : 1;
    c.save(); c.translate(cs.p.x, LCT); c.scale(k, k); c.translate(-cs.p.x, -LCT);
    drawCleo2(c, cs.p.x, LCT + bobOf(cs.p), S, cs.o);
    c.restore();
  }
  c.drawImage(LAB_STATIC.front, 0, LCT);
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  endCard(OUT, t, 'vl');   // owner 11/9 + 11/13 + 11/16: the cast, NEW EPISODE EVERY DAY, 2.5 s (TL.ENDCARD), and TL.ASK under it
}
window.render = render;

// ---------------------------------------------------------------- sound cues (tools/mix.py): every action on its frame, in its space
const panX = x => Math.max(-1, Math.min(1, (x - 540) / 540));
const walkSteps = (t0, x0, x1, kind = 'step', g = 0) => {           // a footfall every STEP px, and one as she arrives
  const ts = footfalls(t0, x0, x1, STEP, TL.WALK_V / STEP), t1 = t0 + Math.abs(x1 - x0) / TL.WALK_V;
  if (!ts.length || t1 - ts[ts.length - 1] > .12) ts.push(t1);
  return ts.map((x, i, a) => ({ type: kind, t: +x.toFixed(3), i, gdb: g, pan: panX(x0 + (x1 - x0) * (i + 1) / a.length) }));
};
window.EV = [
  { type: 'glass_hum', t: 0, dur: TL.OUT1 + 1.0, gdb: -8 },                   // the mirror's glass sings, low, while her reflection is in it
  { type: 'cloth', t: TL.LOOKV - .2, gdb: -6, pan: panX(VX) },
  { type: 'glass_hum', t: TL.RIP1 - .3, dur: 1.2, gdb: 2 },                   // it swells as the glass ripples
  { type: 'ring', t: TL.OUT1, pan: panX(MX) },                                // the flash: the glass rings as she steps through
  { type: 'step', t: TL.OUT1 + .2, gdb: -4, pan: panX(MX) },
  { type: 'page', t: V.L4.t + .35, pan: panX(MX - 60) },                      // the receipt held up
  { type: 'cloth', t: V.L5.t + .8, gdb: -4, pan: panX(VX) },
  { type: 'cloth', t: V.L6.t + .05, gdb: -8, pan: panX(MX) },                 // her little bow
  { type: 'step', t: TL.IN1 - .2, gdb: -4, pan: panX(MX) },
  { type: 'glass_hum', t: TL.IN1 - .5, dur: 1.4, gdb: 0 },
  { type: 'ring', t: TL.IN1, gdb: -2, pan: panX(MX) },
  ...walkSteps(TL.CW0, CX, CXL),
  { type: 'glass_hum', t: TL.CW1 - .1, dur: TL.OUT2 - TL.CW1 + 1.0, gdb: -2 },
  { type: 'ring', t: TL.OUT2, pan: panX(MX) },
  { type: 'step', t: TL.OUT2 + .2, gdb: -4, pan: panX(MX) },
  ...walkSteps(TL.SWAP0, CXL, MX), ...walkSteps(TL.SWAP0 + .07, MX, CXL, 'step', -3),   // the two of them cross
  { type: 'glass_hum', t: TL.IN2 - .5, dur: 1.4, gdb: 0 },
  { type: 'ring', t: TL.IN2, gdb: -2, pan: panX(MX) },
  ...walkSteps(TL.EC0, CXL, CX),
  { type: 'cloth', t: TL.STROKE, gdb: -10, pan: panX(CX) },
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
