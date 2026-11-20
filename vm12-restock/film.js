// Void Mart, episode 12: "Restock". The morning after Black Friday: aisle 3 is stripped bare. Pip and Rae fall asleep on their feet;
// at 7:00 the shelves are full, every label faces front, the floor shines, and nobody restocked them. Pip: magic. Rae: Pip, in her
// sleep. MAGS: "You're welcome!" The stockroom door clicks shut by itself. Script: channel/scripts/VM12_restock.md
// Set: aisle 3 (channel/brand/sets.js measurements, built here twice: stripped and restocked). The shelf unit in front hides
// everyone below the waist; Pip's hop never lifts her waist over its top (as in VM6).
// The third-clerk clue (never shown or said): after the restock the stockroom door stands open a crack with a faint red glow in the
// gap, reflected in the polished floor; when the door clicks shut the glow is gone. In the stripped aisle the door is shut, no glow.
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
const full = t => t >= TL.REVEAL;                            // the aisle is restocked from the cut after the clock

// ---------------------------------------------------------------- layout (aisle world, 2160 wide)
const PIPX = 820, PIPW = AISLE.top + 230, RAEW = AISLE.top + 40, S = 190;   // waist lines: only Pip's head clears the shelf (VM6)
const HOP_MAX = PIPW - AISLE.top - 12;                       // her hem never rises above the shelf top
const DOOR = { x0: 1330, x1: 1470, y0: 470, y1: AISLE.floor };   // the stockroom door, at the end of the aisle
const MG = { x: 1700, y: 150, s: 150 };                      // MAGS, hanging from the ceiling past the door
const CLK = { x: 1400, y: 382, r: 50 };                      // the wall clock over the stockroom door
const PYR = { x: 1060 };                                     // the can pyramid on the shelf top (restocked)
const CAN = { w: 38, h: 54 };

// ---------------------------------------------------------------- the two aisles: stripped (night) and restocked (7:00)
const SETS = {};
function fridgeRow(g, x, i, fullUp) {
  tShape(g, '#3a2f74', gg => gg.rect(x, 300, 240, 880), 4);
  const glow = g.createLinearGradient(0, 320, 0, 1160); glow.addColorStop(0, '#bfe9ff'); glow.addColorStop(1, '#8fc4f0'); g.fillStyle = glow; g.fillRect(x + 14, 318, 212, 846);
  for (let sy = 470; sy < 1160; sy += 170) {
    tShape(g, '#e6e2f5', gg => gg.rect(x + 14, sy, 212, 8), 2);
    if (!fullUp) continue;
    for (let k = 0; k < 6; k++) { const bx = x + 26 + k * 34, col = ['#ff5f7e', '#ffd23f', '#5fe3cc', '#b9a6ff', '#ff9a3d', '#7ef0ff'][(i + sy / 170) % 6 | 0];
      if (((sy / 170) | 0) % 2) tShape(g, col, gg => gg.roundRect(bx, sy - 70, 26, 70, 8), 2.4); else { tShape(g, col, gg => gg.roundRect(bx, sy - 46, 26, 46, 5), 2.4); tShape(g, '#fbf7ff', gg => gg.rect(bx, sy - 32, 26, 10), 1.6); } }
  }
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 40, 360); g.lineTo(x + 90, 330); g.stroke();
  tShape(g, '#c9c3dc', gg => gg.roundRect(x + 200, 640, 10, 120, 5), 2);
}
function buildBack(fullUp) {
  const b = document.createElement('canvas'); b.width = AISLE.w; b.height = 2400; const g = b.getContext('2d');
  g.fillStyle = '#221a4f'; g.fillRect(0, 0, AISLE.w, 2400);
  for (let x = 60; x < AISLE.w; x += 420) { g.save(); g.shadowColor = '#e9e4ff'; g.shadowBlur = 30; tShape(g, '#f4f1ff', gg => gg.roundRect(x, 120, 300, 22, 10), 3); g.restore(); }
  for (let x = 40, i = 0; x < AISLE.w - 200; x += 260, i++) fridgeRow(g, x, i, fullUp);
  // the end of the aisle: a wall with the stockroom door
  tShape(g, '#2c2160', gg => gg.rect(1290, 300, 230, AISLE.floor - 300), 4);
  tShape(g, '#4a3192', gg => gg.rect(DOOR.x0 - 10, DOOR.y0 - 10, DOOR.x1 - DOOR.x0 + 20, DOOR.y1 - DOOR.y0 + 10), 3);
  // the floor
  tShape(g, '#3b2c78', gg => gg.rect(-10, AISLE.floor, AISLE.w + 20, 1300), 4);
  for (let x = 0; x < AISLE.w; x += 160) tLine(g, [x, AISLE.floor, x - 80, 2400], 2);
  if (fullUp) {                                              // polished: the fridge lights reflected in it
    for (let x = 40; x < AISLE.w - 200; x += 260) { const gr = g.createLinearGradient(0, AISLE.floor, 0, AISLE.floor + 220); gr.addColorStop(0, 'rgba(191,233,255,.32)'); gr.addColorStop(1, 'rgba(191,233,255,0)'); g.fillStyle = gr; g.fillRect(x + 20, AISLE.floor + 4, 200, 220); }
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 6; for (let x = 120; x < AISLE.w; x += 330) { g.beginPath(); g.moveTo(x, AISLE.floor + 40); g.lineTo(x + 90, AISLE.floor + 40); g.stroke(); }
  } else {                                                   // receipts, a lone sock of tissue paper, a SOLD OUT sign
    for (const [x, y, r] of [[640, 1214, .3], [930, 1250, -.4], [1180, 1226, .8], [1370, 1262, -.2], [1560, 1236, .5], [460, 1270, -.7], [1080, 1290, .2]]) {
      g.save(); g.translate(x, y); g.rotate(r); tShape(g, '#fbf7ff', gg => { gg.moveTo(-26, -8); gg.lineTo(22, -12); gg.lineTo(28, 6); gg.lineTo(-20, 12); gg.closePath(); }, 2.4);
      g.strokeStyle = 'rgba(26,16,48,.4)'; g.lineWidth = 2; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(-14, k * 5); g.lineTo(14, k * 5 - 2); g.stroke(); } g.restore();
    }
    g.save(); g.translate(930, 640); g.rotate(-.05);
    tShape(g, '#fffdf2', gg => gg.rect(-86, -46, 172, 92), 3); g.fillStyle = 'rgba(200,200,190,.6)'; g.fillRect(-30, -54, 60, 14);
    tText(g, 'SOLD', 0, -14, 34, '#e23b4a', '"Bungee"', 'center', 400); tText(g, 'OUT', 0, 24, 34, '#e23b4a', '"Bungee"', 'center', 400);
    g.restore();
  }
  // hanging aisle sign
  tLine(g, [700, 0, 700, 200], 3); tLine(g, [1100, 0, 1100, 200], 3);
  tShape(g, TOON.orange, gg => gg.roundRect(640, 190, 520, 90, 14), 4); tText(g, 'AISLE 3  SNACKS', 900, 236, 44, '#fff', '"Bungee"', 'center', 400);
  return b;
}
function buildFront(fullUp) {                                 // the shelf unit in front (drawn after the characters)
  const f = document.createElement('canvas'); f.width = AISLE.w; f.height = 2400 - AISLE.top + 60; const h = f.getContext('2d');
  const R = (() => { let a = 7; return () => { a = a * 16807 % 2147483647; return a / 2147483647; }; })();
  tShape(h, '#e8e3f4', gg => gg.rect(-10, 0, AISLE.w + 20, 40), 4);
  tShape(h, '#c9c3dc', gg => gg.rect(-10, 40, AISLE.w + 20, 2400), 4);
  for (let row = 0; row < 4; row++) {
    const y0 = 60 + row * 200;
    if (fullUp) {                                            // every row full, everything faced to the front, in tidy blocks
      const cols = ['#ff5f7e', '#ffd23f', '#5fe3cc', '#b9a6ff', '#ff9a3d'];
      for (let x = 14, k = 0; x < AISLE.w - 30; k++) {
        const kind = (k + row) % 3, col = cols[(Math.floor(x / 300) + row) % 5];
        if (kind === 0) { for (let j = 0; j < 3; j++) { tShape(h, col, gg => gg.roundRect(x + j * 66, y0 + 50, 60, 120, 8), 2.6); tShape(h, '#fbf7ff', gg => gg.rect(x + j * 66 + 8, y0 + 80, 44, 22), 1.6); } x += 204; }
        else if (kind === 1) { for (let j = 0; j < 5; j++) { tShape(h, col, gg => gg.roundRect(x + j * 30, y0 + 100, 28, 70, 5), 2.4); tShape(h, '#fbf7ff', gg => gg.rect(x + j * 30, y0 + 120, 28, 14), 1.4); } x += 156; }
        else { for (let j = 0; j < 2; j++) { tShape(h, col, gg => gg.rect(x + j * 96, y0 + 30, 90, 140), 2.6); tShape(h, '#fbf7ff', gg => gg.roundRect(x + j * 96 + 14, y0 + 60, 62, 40, 6), 1.6); } x += 198; }
      }
    } else if (R() < .25) {                                  // stripped: a crushed box here and there
      const x = 100 + (R() * (AISLE.w - 300)) | 0; tShape(h, '#b9a6ff', gg => { gg.moveTo(x, y0 + 170); gg.lineTo(x + 20, y0 + 130); gg.lineTo(x + 70, y0 + 140); gg.lineTo(x + 76, y0 + 170); gg.closePath(); }, 2.4);
    }
    tShape(h, '#fbf7ff', gg => gg.rect(-10, y0 + 170, AISLE.w + 20, 18), 3);
    for (let x = 30; x < AISLE.w; x += 150) { tShape(h, '#ffd23f', gg => gg.rect(x, y0 + 172, 56, 14), 1.6); tText(h, '$' + (1 + (Math.floor(x / 150) + row) % 9) + '.99', x + 28, y0 + 179, 10, TOON.ink, '"Bungee"', 'center', 400); }
  }
  return f;
}
function buildSets() { SETS.back0 = buildBack(false); SETS.back1 = buildBack(true); SETS.front0 = buildFront(false); SETS.front1 = buildFront(true); }

// ---------------------------------------------------------------- props
function drawClock(g, t) {                                   // 4:58, spinning to 7:00 while they sleep
  const { x, y, r } = CLK, k = smooth(TL.CLOCK0 + .15, TL.REVEAL - .2, t);
  const mins = 4 * 60 + 58 + k * 122 + Math.max(0, t - TL.REVEAL) / 60 + Math.min(t, TL.CLOCK0) / 60;
  tEllipse(g, x, y, r + 6, r + 6, '#5c577f', 4); tEllipse(g, x, y, r, r, '#fbf7ff', 3);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; tLine(g, [x + Math.cos(a) * 42, y + Math.sin(a) * 42, x + Math.cos(a) * 50, y + Math.sin(a) * 50], i % 3 ? 2.4 : 4); }
  const hand = (a, l, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); g.stroke(); };
  hand(mins / 720 * 6.2832, 26, 6, TOON.ink); hand((mins % 60) / 60 * 6.2832, 40, 4.4, TOON.ink);
  tEllipse(g, x, y, 4.5, 4.5, '#e23b4a', 0);
}
function canAt(g, x, y, rot = 0, col = '#ff5f7e', label = true) {   // a soda can standing on (x, y) = bottom centre
  g.save(); g.translate(x, y); g.rotate(rot);
  tShape(g, col, gg => gg.roundRect(-CAN.w / 2, -CAN.h, CAN.w, CAN.h, 6), 2.6);
  tShape(g, '#c9c3dc', gg => gg.roundRect(-CAN.w / 2 + 2, -CAN.h - 4, CAN.w - 4, 6, 3), 2);
  if (label) { tShape(g, '#fbf7ff', gg => gg.rect(-CAN.w / 2, -CAN.h + 16, CAN.w, 18), 1.6); tText(g, 'VOID', 0, -CAN.h + 25, 10, TOON.ink, '"Bungee"', 'center', 400); }
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-CAN.w / 2 + 5, -CAN.h + 6, 4, CAN.h - 12);
  g.restore();
}
function rollingCan(g, t) {                                  // the stripped aisle: one dented can rolls along the shelf top and drops off
  if (full(t) || t > TL.CANFALL + .4) return;
  const k = clamp((t - TL.CAN0) / (TL.CANFALL - TL.CAN0)), x = lerp(1110, 960, k), roll = (x - 1110) / (CAN.w / 2) * .5;
  let y = AISLE.top + 2, rot = Math.PI / 2;
  if (t > TL.CANFALL) { const f = (t - TL.CANFALL) / .4; y += f * f * 140; }
  g.save(); g.translate(x, y - CAN.w / 2); g.rotate(rot + roll); canAt(g, 0, CAN.h / 2, 0, '#7ef0ff', true); g.restore();
  if (t > TL.CANFALL) { /* falling in front of the shelf edge */ }
}
const PYRAMID = [[-60, 0], [0, 0], [60, 0], [-30, -1], [30, -1], [0, -2]];
function pyramid(g, t) {                                     // the restocked shelf top: a perfect pyramid of cans, labels front
  if (!full(t)) return;
  const lift = t >= TL.PICK + .25 && t < TL.PUT;
  PYRAMID.forEach(([dx, row], i) => { if (i === 5 && lift) return; canAt(g, PYR.x + dx, AISLE.top + 2 + row * (CAN.h + 2), 0, ['#ff5f7e', '#ffd23f', '#5fe3cc'][(i + 3) % 3]); });
}
function door(g, t) {                                        // the stockroom door (hinged on the right): shut in the stripped aisle; a crack open on its left edge after the restock (red glow), shut at the end
  const open = full(t) ? 1 - smooth(TL.DOOR0, TL.DOOR1, t) : 0;
  const gap = 14 * open, x0 = DOOR.x0 + gap;
  if (gap > .5) {                                            // the crack: dark inside, a faint red glow, and its reflection in the polished floor
    g.fillStyle = '#100a24'; g.fillRect(DOOR.x0 - 2, DOOR.y0, gap + 2, DOOR.y1 - DOOR.y0);
    g.save(); g.globalAlpha = .42 * open; const gr = g.createRadialGradient(DOOR.x0 + gap / 2, 900, 2, DOOR.x0 + gap / 2, 900, 70); gr.addColorStop(0, 'rgba(255,42,58,.9)'); gr.addColorStop(1, 'rgba(255,42,58,0)');
    g.fillStyle = gr; g.fillRect(DOOR.x0 - 70, 820, 140 + gap, 160); g.restore();
    g.save(); g.globalAlpha = .22 * open; g.fillStyle = '#ff2a3a'; g.beginPath(); g.ellipse(DOOR.x0 + gap / 2, DOOR.y1 + 46, 10, 40, 0, 0, 6.2832); g.fill(); g.restore();
  }
  tShape(g, '#5d4aa8', gg => gg.rect(x0, DOOR.y0, DOOR.x1 - x0, DOOR.y1 - DOOR.y0), 3.4);
  tShape(g, '#fbf7ff', gg => gg.rect(DOOR.x0 + 12, DOOR.y0 + 70, 116, 34), 2.4); tText(g, 'STOCKROOM', DOOR.x0 + 70, DOOR.y0 + 87, 16, TOON.ink, '"Bungee"', 'center', 400);
  tShape(g, '#c9c3dc', gg => gg.roundRect(x0 + 14, 810, 12, 44, 5), 2.4);
}
function sparkles(g, t) {                                    // the restock gleams (a visual gag, on the reveal)
  if (!full(t) || t > endOf('L4') + 1.5) return;
  const P = [[720, 560], [1000, 420], [660, 840], [1100, 640], [700, 1500], [1250, 1560], [980, 1620], [1380, 1500], [560, 1080]];   // on the fridges and the shelf, clear of faces
  P.forEach(([x, y], i) => { const ph = (t - TL.REVEAL) * 2.2 + i * .37, a = Math.max(0, Math.sin(ph * 3.1416)); if (a > .05) drawStar(g, x, y, 10 + 14 * a, '#fff6c8', 2.4); });
}

// ---------------------------------------------------------------- Pip: only her head clears the shelf; she hops, and gets up on her toes
function pipLift(t) {
  if (t >= TL.HOP && t < TL.HOP + .6) return hopPose((t - TL.HOP) / .6, Math.min(HOP_MAX, 200)).dy;
  if (t >= TL.TOES && t < endOf('L11') + .4) return -150 * smooth(TL.TOES, TL.TOES + .25, t) * (1 - smooth(endOf('L11') + .1, endOf('L11') + .4, t));
  return 0;
}
function drawPip(g, t) {
  const asleep = t >= TL.NAP + .2 && t < TL.WAKE + .15;
  let expr = 'sad';
  if (t >= V.L3.t) expr = 'sad';
  if (t >= TL.WAKE) expr = 'gasp';
  if (t >= endOf('L4')) expr = 'grin';
  if (t >= V.L6.t) expr = 'sheepish';
  if (t >= V.L7.t) expr = 'grin';
  if (t >= V.L8.t) expr = 'grin';
  if (t >= TL.LOOK) expr = 'gasp';
  if (t >= V.L12.t) expr = 'grin';
  const lift = pipLift(t), bob = Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2 : 0) + (asleep ? Math.sin(t * 1.4) * 4 + 8 : 0);
  const o = { expr, mouth: mouthFor('PIP', t), blink: asleep || blinkAt(3, t) || (t >= V.L3.t + .6 && t < TL.NAP + .2 && Math.sin(t * 6) > .3), wave: t >= TL.TOES && t < endOf('L11') + .3, wavePhase: t * 9,
    turn: t >= TL.LOOK ? smooth(TL.LOOK, TL.LOOK + .5, t) * .8 : 0, hold: t >= TL.HOP && t < TL.HOP + .7 };
  drawPip2(g, PIPX, PIPW + lift + bob, S, o);
  if (asleep) {                                              // z z z
    const k = ((t - TL.NAP) * .8) % 1;
    g.save(); g.globalAlpha = Math.sin(Math.PI * k);
    tText(g, 'z', PIPX + 70 + k * 30, PIPW - 300 - k * 60, 30 + k * 12, '#fbf7ff', '"Bungee"', 'center', 400); g.restore();
  }
}

// ---------------------------------------------------------------- Rae: deadpan; asleep on her feet; walks over and checks a can
const raeX = t => travel(t, TL.RAEW0, TL.RAE_X0, TL.RAE_X1, TL.RAE_STEP, TL.RAE_SPS).x;
function drawRae(g, t) {
  const asleep = t >= TL.NAP + .5 && t < TL.REVEAL + .6;
  const o = { expr: 'deadpan', look: -1.6, blink: asleep || blinkAt(1, t), mouth: mouthFor('RAE', t) };
  if (t >= TL.RAEW0) o.look = -1.2;
  if (t >= TL.PICK) { o.look = -2; o.expr = t >= TL.TURN ? 'annoyed' : 'deadpan'; }
  if (t >= V.L6.t) { o.look = -1.8; o.expr = 'deadpan'; }
  if (t >= V.L9.t - .3) o.look = 1.5;                      // up at MAGS
  if (t >= V.L11.t) o.look = -1.6;
  if (t >= TL.LOOK) { o.look = 1.8; o.turn = smooth(TL.LOOK + .1, TL.LOOK + .6, t) * .7; }
  const tr = travel(t, TL.RAEW0, TL.RAE_X0, TL.RAE_X1, TL.RAE_STEP, TL.RAE_SPS);
  if (tr.moving) return drawTraveller(g, (gg, x, y, s, oo) => drawRae2(gg, x, y, s, oo), tr.x, RAEW + 10, S, o, walkBob(tr.dist, TL.RAE_STEP, 10), -1);
  const x = tr.x, u = S / 100;
  if (t >= TL.PICK && t < TL.PUT + .35) {                  // her left hand to the top can, up to her chest, and back
    const top = { x: PYR.x, y: AISLE.top - 2 * (CAN.h + 2) - CAN.h / 2 + 4 }, chest = { x: x - 70, y: RAEW - 220 };
    let p = lp({ x: x - 8 * u, y: RAEW - 23 * u }, top, smooth(TL.PICK, TL.PICK + .25, t));
    if (t >= TL.PICK + .25) p = lp(top, chest, smooth(TL.PICK + .25, TL.PICK + .6, t));
    if (t >= TL.PUT - .1) p = lp(chest, top, smooth(TL.PUT - .1, TL.PUT + .2, t));
    if (t >= TL.PUT + .2) p = lp(top, { x: x - 8 * u, y: RAEW - 23 * u }, smooth(TL.PUT + .2, TL.PUT + .35, t));
    o.reachL = { x: (p.x - x) / u, y: (p.y - RAEW) / u };
    drawRae2(g, x, RAEW + Math.sin(t * 1.7 + 1) * 1.5, S, o);
    if (t >= TL.PICK + .25 && t < TL.PUT + .2) {            // the can in her hand; she turns it once: the label already faces front
      const spin = t >= TL.TURN && t < TL.TURN + .5 ? Math.sin(Math.PI * (t - TL.TURN) / .5) : 0;
      g.save(); g.translate(p.x, p.y + CAN.h / 2); g.scale(1 - .7 * spin, 1); canAt(g, 0, 0, 0, '#5fe3cc', spin < .5); g.restore();
      tHand(g, p.x + 4, p.y + 8, 9.5 * u, TOON.rae.skin, TOON.rae.skinS);
    }
    return;
  }
  drawRae2(g, x, RAEW + Math.sin(t * 1.7 + 1) * 1.5, S, o);
}
function drawMagsHere(g, t) { drawMags(g, MG.x, MG.y, MG.s, { talk: talkLevel('MAGS', t) }); }

// ---------------------------------------------------------------- cameras
const CAM = Object.assign({}, VMCAM, {
  OPEN: [1080, 1170, 1.3, 1.34],                               // frame 1: the stripped aisle (and the match for the reveal)
  OPEN2: [1080, 1170, 1.34, 1.38],
  RAE_CU: [1220, 1030, 2.5, 2.6],
  CLOCK: [CLK.x, 440, 3.0, 3.25],                              // the clock over the stockroom door (shut, no light)
  REVEAL: [1080, 1170, 1.3, 1.34],                             // the same frame, restocked
  TWO: [1000, 1240, 1.7, 1.74],
  CAN_CU: [1110, 1460, 3.0, 3.1],                              // the frame top stays under Rae's chin; Pip stays out at the left
  PIP_MED: [770, 1300, 2.0, 2.06],                             // Rae's hair stays out at the right
  MAGS_CU: [MG.x, 300, 2.6, 2.7],
  RAE_CU2: [1150, 1030, 2.5, 2.6],
  END_WIDE: [1080, 1095, 1.15, 1.18],                           // Pip, Rae, the stockroom door; MAGS out of frame; faces under y 780 for the card
});

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#221a4f'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  c.drawImage(full(t) ? SETS.back1 : SETS.back0, 0, 0);
  door(c, t);
  drawClock(c, t);
  drawMagsHere(c, t);
  drawRae(c, t);
  drawPip(c, t);
  pyramid(c, t);
  c.drawImage(full(t) ? SETS.front1 : SETS.front0, 0, AISLE.top);
  rollingCan(c, t);
  sparkles(c, t);
  glassStreaks(c, .6);
  if (!full(t)) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(16,10,52,.16)'; c.fillRect(0, 0, W, H); }   // 4:58 am: a little darker
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound: what we see, in the store's room)
window.EV = [
  { type: 'canroll', t: TL.CAN0, pan: -.05 },                                                      // the can rolls along the shelf
  { type: 'can', t: TL.CANFALL + .38, pan: -.05, g: .8 },                                          // and lands on the floor behind the shelf
  { type: 'snore', t: TL.NAP + .5, pan: -.3 },                                                     // Pip, asleep on her feet
  { type: 'tick', t: TL.CLOCK0 + .15, dur: TL.REVEAL - TL.CLOCK0 - .35, pan: -.2 },                // the clock racing to seven
  { type: 'snore', t: TL.CLOCK0 + .6, pan: -.3, g: .7 },
  { type: 'sparkle', t: TL.REVEAL + .15, pan: .1 },                                                // the restock gleams
  { type: 'hop', t: TL.HOP + .6 * .84, pan: -.3 },
  ...footfalls(TL.RAEW0, TL.RAE_X0, TL.RAE_X1, TL.RAE_STEP, TL.RAE_SPS).map(x => ({ type: 'step', t: x, pan: .1 })),
  { type: 'can', t: TL.PICK + .25, pan: 0 }, { type: 'can', t: TL.PUT + .18, pan: 0, g: .8 },     // the can off the pyramid and back
  { type: 'door', t: TL.DOOR0, pan: .45 },                                                         // the stockroom door: creak, click
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore(); buildAisle(); buildSets();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
