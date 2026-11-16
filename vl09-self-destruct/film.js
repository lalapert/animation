// Volt Labs, episode 9: "Self-Destruct". Vera installs a self-destruct button: a remote exactly like Cleo's red button remote,
// with a wall panel that counts down. Cleo, who never smiles, is delighted. Vera goes for coffee; Cleo shuffles the two remotes
// (the sticky note falls off), picks one up and presses it. 5 .. 0: it blows up only itself. "...Technically, it worked."
// Script: channel/scripts/VL09_self_destruct.md. Set, cameras, window, fridge, rent circles: channel/brand/labkit.js; lip sync,
// subtitles, shots, end card: channel/brand/vmkit.js; Vera and Cleo: channel/brand/lab.js; walk bob: channel/brand/travel.js.
// The remotes, the wall panel, Cleo's rare smile (drawn over her rig) and the pop are drawn here.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 190, VX = TL.VX, CX = TL.CX, K9 = S / 100;
const VFACE = LCT - 222 * K9, CFACE = LCT - 200 * K9, CHIN = LCT - 154 * K9;   // Cleo's chin (the face sits 22 lower in her rig)
const PANEL = { x: 625, y: 490, w: 240, h: 140 };                   // the self-destruct panel on the back wall, right of the board
const SPOT = [(TL.AX - CX) / K9, -20];                              // the two places on the bench, in Cleo's units (left, right)
const RY = -15;                                                     // a remote standing on the bench: its centre, Cleo's units
const SET0 = TL.SHUF0 + .45, SET1 = SET0 + .3, SW0 = SET1;          // she sets hers down, then five swaps
const SW1 = SW0 + TL.NSWAP * TL.SWAP;
const cw = (lx, ly) => [CX + lx * K9, LCT + ly * K9];               // Cleo's units -> world

// ---------------------------------------------------------------- the red button remote (exactly Cleo's: lab.js drawCleo2)
// centred on its box at (x, y) world, in Cleo's scale. o.press 0..1, o.charred (after it blew itself up: no button, soot)
function drawRemote(g, x, y, o = {}) {
  g.save(); g.translate(x, y); g.scale(K9, K9); if (o.rot) g.rotate(o.rot);
  if (o.charred) {
    tShape(g, '#2b2731', gg => gg.roundRect(-20, -15, 40, 30, 7), 3.4);
    g.fillStyle = '#17141b'; g.beginPath(); g.ellipse(-8, 6, 9, 5, .3, 0, 6.2832); g.ellipse(10, -8, 7, 4, -.4, 0, 6.2832); g.fill();
    tLine(g, [-12, -15, -7, -7, -11, 0], 2);                          // a crack
    tShape(g, '#121015', gg => gg.ellipse(0, -5, 9, 5, 0, 0, 6.2832), 2.4);   // the empty socket
  } else {
    tShape(g, '#3a3350', gg => gg.roundRect(-20, -15, 40, 30, 7), 3.4);
    const pr = o.press || 0, by = -5 + 3 * pr;
    g.save(); g.shadowColor = '#ff3355'; g.shadowBlur = 10 + 30 * pr; tShape(g, '#ff3355', gg => gg.ellipse(0, by, 11, 8 - 2 * pr, 0, 0, 6.2832), 3); g.restore();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-3, by - 3, 4, 2, 0, 0, 6.2832); g.fill();
  }
  g.restore();
}
// the yellow sticky note on the new one ("SELF-DESTRUCT"), standing up behind it; (x, y) = the note's centre, world
function drawNote(g, x, y, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(K9, K9);
  tShape(g, '#ffe36b', gg => gg.rect(-29, -22, 58, 44), 2.6);
  g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(-29, -22, 58, 8);
  tText(g, 'SELF-', 0, -6, 9.5, '#d0263a', '"Bungee"', 'center', 400);
  tText(g, 'DESTRUCT', 0, 8, 8.5, '#d0263a', '"Bungee"', 'center', 400);
  g.restore();
}
const NOTE_ON = [-4, -44, -.12];                                    // on the remote: offset from its centre (Cleo's units), tilt
function noteFall(t) {                                               // it comes off at the first swap and flutters down the bench front
  const k = t - SW0; if (k < 0) return null;
  const [x0, y0] = cw(SPOT[0] + NOTE_ON[0], RY + NOTE_ON[1]);
  return [x0 - 30 * k + 26 * Math.sin(k * 9), y0 + 70 * k + 420 * k * k, -.12 + .9 * Math.sin(k * 7) + k * .6];
}

// ---------------------------------------------------------------- where the two remotes are (Cleo's units), and her left hand
// P1 = the new one (self-destruct), P2 = Cleo's own. Five swaps: each .3 s of motion, then a short rest; one slides along the bench
// under her hand, the other hops over it. P1 ends on the right spot, and that is the one she picks up.
function swapState(t) {
  const n = TL.NSWAP, k = clamp(Math.floor((t - SW0) / TL.SWAP), 0, n), ph = t < SW0 ? 0 : k >= n ? 0 : smooth(0, .3, (t - SW0) - k * TL.SWAP);
  const done = Math.min(k, n);                                       // completed swaps
  let s1 = done % 2 ? 1 : 0;                                         // P1's spot after `done` swaps
  const moving = t >= SW0 && k < n;
  const from1 = s1, to1 = 1 - s1;
  const x1 = moving ? lerp(SPOT[from1], SPOT[to1], ph) : SPOT[s1];
  const x2 = moving ? lerp(SPOT[1 - from1], SPOT[from1], ph) : SPOT[1 - s1];
  const slide1 = k % 2 === 0;                                        // which one slides under the hand this swap (the other hops)
  const y1 = moving && !slide1 ? RY - Math.sin(Math.PI * ph) * 22 : RY, y2 = moving && slide1 ? RY - Math.sin(Math.PI * ph) * 22 : RY;
  const hx = moving ? (slide1 ? x1 : x2) + (((slide1 ? to1 : from1) === 1) ? -18 : 18) : null;
  return { x1, y1, x2, y2, moving, hand: moving ? { x: hx, y: RY + 6 } : null };
}
function cleoProps(t) {
  // returns {held: 'P2'|'P1'|null, carry: {x, y} remote centre in Cleo's units, carried id, bench: [{id, x, y}], reachL}
  const st = { held: null, carry: null, bench: [], reachL: null, charred: false };
  if (t < SET0) { st.held = 'P2'; st.bench.push({ id: 'P1', x: SPOT[0], y: RY, note: true }); return st; }
  if (t < SET1) {                                                    // her own remote, down to the right spot
    const k = smooth(SET0, SET1, t), x = lerp(0, SPOT[1], k), y = lerp(-43, RY, k);
    st.carry = { id: 'P2', x, y }; st.reachL = { x: x - 18, y: y + 6 };
    st.bench.push({ id: 'P1', x: SPOT[0], y: RY, note: true }); return st;
  }
  if (t < TL.PICK0 + .15) {                                          // the shell game, then her hand back to rest
    const s = swapState(t);
    st.bench.push({ id: 'P1', x: s.x1, y: s.y1, note: t < SW0 }, { id: 'P2', x: s.x2, y: s.y2 });
    if (s.hand) st.reachL = s.hand;
    else if (t < SW1 + .25) { const h0 = swapState(SW1 - 1e-3).hand, k = smooth(SW1, SW1 + .25, t); st.reachL = { x: lerp(h0.x, -20, k), y: lerp(h0.y, -40, k) }; }
    return st;
  }
  st.bench.push({ id: 'P2', x: SPOT[0], y: RY });
  if (t < TL.PICK1) {                                                // she picks up the one on the right (P1)
    const a = TL.PICK0 + .15, b = a + .25;
    if (t < b) { const k = smooth(a, b, t); st.reachL = { x: lerp(-20, SPOT[1] - 18, k), y: lerp(-40, RY + 6, k) }; st.bench.push({ id: 'P1', x: SPOT[1], y: RY }); }
    else { const k = smooth(b, TL.PICK1, t), x = lerp(SPOT[1], 0, k), y = lerp(RY, -43, k); st.carry = { id: 'P1', x, y }; st.reachL = { x: x - 18, y: y + 6 }; }
    return st;
  }
  if (t < TL.ZERO) { st.held = 'P1'; return st; }
  st.charred = true; return st;
}

// ---------------------------------------------------------------- the wall panel: SELF-DESTRUCT, a beacon, the display, ABORT: TODO
function panelText(t) {
  if (t < TL.ALARM) return ['READY', '#5c1c26', 24];
  if (t < TL.ZERO) return [String(TL.COUNT - Math.floor(t - TL.ALARM)), '#ff3b4e', 58];
  return ['COMPLETE', '#7dff9a', 22];
}
function drawPanel(g, t) {
  const { x, y, w, h } = PANEL, on = t >= TL.ALARM && t < TL.ZERO;
  // the beacon on top: off (dark red), on (bright, two turning beams)
  if (on) {
    const a = (t - TL.ALARM) * 7;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const off of [0, Math.PI]) {
      const d = Math.cos(a + off); if (d <= 0) continue;
      g.fillStyle = `rgba(255,40,60,${.22 * d})`; g.beginPath(); g.moveTo(x, y - h / 2 - 16);
      const dir = Math.sin(a + off) * 620; g.lineTo(x + dir - 120 * d, y + 420); g.lineTo(x + dir + 120 * d, y + 420); g.closePath(); g.fill();
    }
    g.restore();
  }
  tShape(g, '#3d4250', gg => gg.roundRect(x - 34, y - h / 2 - 12, 68, 16, 4), 3);
  g.save(); if (on) { g.shadowColor = '#ff2a3c'; g.shadowBlur = 40; }
  tShape(g, on ? '#ff3b4e' : '#7a2430', gg => { gg.moveTo(x - 24, y - h / 2 - 12); gg.bezierCurveTo(x - 24, y - h / 2 - 50, x + 24, y - h / 2 - 50, x + 24, y - h / 2 - 12); gg.closePath(); }, 3);
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - 9, y - h / 2 - 32, 5, 8, -.3, 0, 6.2832); g.fill();
  // the box
  tShape(g, '#2f3440', gg => gg.roundRect(x - w / 2, y - h / 2, w, h, 10), 3.6);
  tShade(g, gg => gg.roundRect(x - w / 2, y - h / 2, w, h, 10), '#272b35', gg => gg.rect(x + w / 2 - 50, y - h / 2, 60, h));
  tShape(g, '#c8283a', gg => gg.roundRect(x - w / 2 + 10, y - h / 2 + 9, w - 20, 30, 5), 2.6);
  tText(g, 'SELF-DESTRUCT', x, y - h / 2 + 25, 21, '#fff6e8', '"Bungee"', 'center', 400);
  // the display
  const dx = x - 36, dy = y + 22;
  tShape(g, '#0b0a0e', gg => gg.roundRect(dx - 70, dy - 36, 140, 72, 6), 3);
  const [s, col, size] = panelText(t);
  g.save(); if (t >= TL.ALARM) { g.shadowColor = col; g.shadowBlur = 16; }
  tText(g, s, dx, dy + 3, size, col, '"Bungee"', 'center', 400); g.restore();
  // ABORT: an empty dashed square (she never built it)
  const ax = x + 76, ay = y + 22;
  g.save(); g.setLineDash([7, 6]); g.strokeStyle = '#9aa3b5'; g.lineWidth = 3; g.strokeRect(ax - 30, ay - 30, 60, 60); g.restore();
  tText(g, 'ABORT', ax, ay - 8, 12, '#c9cfdb', '"Bungee"', 'center', 400);
  tText(g, 'TODO', ax, ay + 12, 12, '#ffd24a', '"Bungee"', 'center', 400);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) tEllipse(g, x + sx * (w / 2 - 10), y + sy * (h / 2 - 10), 4, 4, '#8d93a3', 2);   // screws
}

// ---------------------------------------------------------------- Cleo's rare smile, drawn over her rig (lab.js drawCleo2 has none):
// the rig draws her eyes closed (blink); the eye band and, when she is not talking, the mouth are painted back to skin (with the
// face's own shade) and redrawn: happy closed eyes, a small smile, a little blush. The shapes match the rig's face exactly.
function cleoFace(g) { g.moveTo(0, -268); g.bezierCurveTo(30, -268, 42, -250, 41, -228); g.bezierCurveTo(40, -206, 26, -184, 0, -176); g.bezierCurveTo(-26, -184, -40, -206, -41, -228); g.bezierCurveTo(-42, -250, -30, -268, 0, -268); g.closePath(); }
function cleoShadeP(g) { g.moveTo(28, -274); g.bezierCurveTo(38, -238, 30, -200, 6, -170); g.lineTo(60, -170); g.lineTo(60, -274); g.closePath(); }
function cleoRepaint(g, x0, y0, w, h) {
  const K = LAB2.cleo;
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.beginPath(); cleoFace(g); g.fillStyle = K.skin; g.fill();
  g.beginPath(); cleoFace(g); g.clip(); g.beginPath(); cleoShadeP(g); g.fillStyle = K.skinS; g.fill();
  g.restore();
}
function cleoJoy(g, o) {
  g.save(); g.translate(CX, LCT); g.scale(K9, K9); g.translate(0, 22);
  if (o.happyEyes) { cleoRepaint(g, -31, -227.5, 62, 16); for (const sx of [-1, 1]) closedEye(g, sx * 17, -219, 11, true); }
  if (o.smile && !o.talking) { cleoRepaint(g, -11, -196, 22, 13); tCurve(g, -8, -192, 0, -184, 8, -192, 2.8); }
  if (o.smile) { g.fillStyle = 'rgba(255,120,150,.33)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 26, -202, 9, 5, 0, 0, 6.2832); g.fill(); } }
  g.restore();
}
function sparkle(g, x, y, r) {
  if (r <= .5) return;
  tShape(g, '#fff8d6', gg => { gg.moveTo(x, y - r); gg.quadraticCurveTo(x + r * .16, y - r * .16, x + r, y); gg.quadraticCurveTo(x + r * .16, y + r * .16, x, y + r); gg.quadraticCurveTo(x - r * .16, y + r * .16, x - r, y); gg.quadraticCurveTo(x - r * .16, y - r * .16, x, y - r); gg.closePath(); }, 2.4);
}
function cleoSparkles(g, t, big) {
  const P = [[-128, -470, 0, 15], [122, -505, 2.1, 13], [138, -330, 4.2, 11]];
  if (big) P.push([-140, -360, 1.1, 12]);
  for (const [dx, dy, ph, r] of P) sparkle(g, CX + dx, LCT + dy, r * (big ? 1.25 : 1) * (.65 + .35 * Math.sin(t * 6 + ph)));
}

// ---------------------------------------------------------------- Cleo
function cleoState(t) {
  const talk = mouthFor('CLEO', t), talking = !!(talk && talk.a > .06), pr = cleoProps(t);
  const happy = t < TL.ZERO;
  const sly = t >= TL.SHUF0 && t < SET0 + .1;                        // she checks that Vera has gone (eyes open, sideways)
  const o = { expr: sly ? 'smug' : 'deadpan', mouth: talk, blink: happy && !sly ? true : blinkAt(1, t), look: sly ? -1.4 : undefined,
              remote: pr.held !== null, press: 0, reachL: pr.reachL };
  if (t >= TL.PRESS && t < TL.PRESS + .75) o.press = smooth(TL.PRESS - .02, TL.PRESS + .08, t) * (1 - smooth(TL.PRESS + .5, TL.PRESS + .7, t));
  if (t >= TL.ZERO && t < TL.ZERO + .55) { o.expr = 'surprised'; o.blink = false; }
  return { o, pr, joy: { happyEyes: happy && !sly, smile: happy, talking }, happy };
}
function drawCleoAll(g, t, show) {
  const s = cleoState(t);
  if (show) {
    drawCleo2(g, CX, LCT, S, s.o);
    cleoJoy(g, s.joy);
  }
  // remotes on the bench (and the sticky note behind the new one)
  for (const b of s.pr.bench) {
    const [x, y] = cw(b.x, b.y);
    if (b.note) { const [nx, ny] = cw(b.x + NOTE_ON[0], b.y + NOTE_ON[1]); drawNote(g, nx, ny, NOTE_ON[2]); }
    drawRemote(g, x, y);
  }
  if (!show) return s;
  if (s.pr.carry) { const [x, y] = cw(s.pr.carry.x, s.pr.carry.y); drawRemote(g, x, y); }
  if (s.pr.charred) {                                                // the burnt one in her hands, the button up on its spring
    const [x, y] = cw(0, -43); drawRemote(g, x, y, { charred: true });
    drawSpringCap(g, t);
  }
  g.save(); g.translate(CX, LCT); g.scale(K9, K9);                   // her hands over what they hold
  if (s.pr.reachL) tHand(g, s.pr.reachL.x, s.pr.reachL.y, 8.5, LAB2.cleo.glove, LAB.glowS);
  if (s.pr.charred) { tHand(g, -20, -40, 8.5, LAB2.cleo.glove, LAB.glowS); tHand(g, 20, -40, 8.5, LAB2.cleo.glove, LAB.glowS); }
  g.restore();
  if (s.happy && show) cleoSparkles(g, t, t >= V.L4.t - .1 && t < V.L5.t);
  return s;
}

// ---------------------------------------------------------------- zero: it blows up itself (a flash, puffs that grow and shrink
// away, never over her face, and the button up on a spring)
function drawSpringCap(g, t) {
  const u = t - TL.ZERO; if (u < 0) return;
  const L = 52 * (1 - Math.exp(-5 * u) * Math.cos(16 * u)), sw = Math.sin(u * 9) * 9 * Math.exp(-1.2 * u) + Math.sin(u * 3.1) * 2;
  g.save(); g.translate(CX, LCT); g.scale(K9, K9);
  const y0 = -48, y1 = y0 - L, n = 7;
  g.beginPath(); g.moveTo(0, y0);
  for (let i = 1; i <= n * 2; i++) { const k = i / (n * 2); g.lineTo((i % 2 ? -7 : 7) + sw * k, y0 + (y1 - y0) * k); }
  g.lineWidth = 2.6; g.strokeStyle = '#b8bdc9'; g.stroke();
  g.save(); g.shadowColor = '#ff3355'; g.shadowBlur = 8; tShape(g, '#e0384c', gg => gg.ellipse(sw, y1 - 4, 11, 8, sw * .02, 0, 6.2832), 3); g.restore();
  g.fillStyle = '#2b2025'; g.beginPath(); g.ellipse(sw + 4, y1 - 2, 5, 3, 0, 0, 6.2832); g.fill();   // a scorch on the cap
  g.restore();
}
function drawPop(g, t) {
  const u = t - TL.ZERO; if (u < 0 || u > 1.1) return;
  const [x, y] = cw(0, -43);
  if (u < .07) {                                                     // the flash: two frames
    tShape(g, '#fff3b0', gg => { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, r = i % 2 ? 26 : 62; gg[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r * .8); } gg.closePath(); }, 3);
  }
  const P = [[-62, -10, 40], [58, -18, 36], [-26, -58, 30], [30, -66, 26], [-8, 26, 34], [72, 24, 24], [-80, 30, 22]];
  for (const [dx, dy, r] of P) {
    const grow = smooth(0, .14, u), shrink = 1 - smooth(.3, 1.05, u + Math.abs(dx) * .0012);
    const rr = r * grow * shrink; if (rr < 1) continue;
    const ry = rr * K9 * .48, yy = Math.max(y + dy * K9 * .8 - u * 40, CHIN + 24 + ry);   // drifting up a little, never past her chin
    tEllipse(g, x + dx * K9 * .8 + Math.sign(dx) * u * 30, yy, rr * K9 * .55, ry, '#dcd6e4', 3);
  }
}

// ---------------------------------------------------------------- Vera
function veraX(t) {
  if (t < TL.WALK0) return { x: VX, moving: false, dist: 0 };
  if (t < TL.GONE) { const d = (t - TL.WALK0) * TL.WALK_V; return { x: VX - d, moving: true, dist: d }; }
  if (t < TL.RET0) return { x: TL.VX_OFF, moving: false, dist: 0, off: true };
  if (t < TL.ARR) { const d = (t - TL.RET0) * TL.WALK_V; return { x: TL.VX_OFF + d, moving: true, dist: d }; }
  return { x: VX, moving: false, dist: 0 };
}
function veraState(t) {
  const p = veraX(t), mouth = mouthFor('VERA', t);
  let expr = 'cool', reachR = null, open = false, mug = t >= TL.RET0, shake = 0;
  const over = { x: (TL.AX - VX) / K9 - 34, y: -100 };              // her palm presenting it, above and left of its sticky note
  if (t < endOf('L1') + .35) { expr = 'scheme'; reachR = { x: over.x, y: over.y + Math.sin(t * 2.2) * 2 }; open = true; }
  if (t >= V.L5.t && t < V.L5.t + 1.0) { reachR = { x: over.x + 6, y: over.y + 4 }; open = true; }
  if (mug) reachR = { x: 30, y: -86 };
  if (t >= TL.ARR + .15) expr = 'fluster';
  if (t >= V.L8.t && t < TL.ZERO) shake = Math.sin(t * 40) * (t >= TL.ALARM ? 5 : 2);
  if (t >= TL.ZERO + .55) expr = 'cool';
  return { x: p.x + (t >= TL.ALARM && t < TL.ZERO ? Math.sin((t - TL.ALARM) * 11) * 12 : 0), p, o: { expr, mouth, blink: blinkAt(0, t), tube: false, reachR }, open, mug, shake };
}
function drawMug(g, x, y, t, shake) {
  g.save(); g.translate(x + shake, y); g.scale(K9, K9);
  tShape(g, null, gg => { gg.moveTo(14, -10); gg.bezierCurveTo(28, -10, 28, 10, 14, 10); }, 5);
  tShape(g, '#f4f1ea', gg => gg.roundRect(-15, -18, 30, 34, 5), 3);
  tShade(g, gg => gg.roundRect(-15, -18, 30, 34, 5), '#d9d4ca', gg => gg.rect(6, -20, 12, 40));
  tShape(g, '#5a3a24', gg => gg.ellipse(0, -18, 13, 3.5, 0, 0, 6.2832), 2.2);
  tText(g, 'V', -1, 0, 15, '#7ccf3a', '"Bungee"', 'center', 400);
  for (let i = 0; i < 2; i++) { const k = ((t * .7 + i * .5) % 1); g.strokeStyle = `rgba(255,255,255,${.5 * (1 - k)})`; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-4 + i * 8, -22 - k * 10); g.quadraticCurveTo(2 + i * 8 + 4 * Math.sin(t * 3 + i), -28 - k * 14, -3 + i * 8, -34 - k * 16); g.stroke(); }
  g.restore();
}
function drawVeraAll(g, t) {
  const s = veraState(t);
  if (s.p.off) return;
  let dy = 0;
  if (s.p.moving) { const bob = walkBob(s.p.dist, 150, 10); dy = -6 * Math.tanh(-bob.dy / 6); }   // the waist never rises above the bench
  drawVera2(g, s.x, LCT + dy, S, s.o);
  if (s.o.reachR) {
    const hx = s.x + s.o.reachR.x * K9, hy = LCT + dy + s.o.reachR.y * K9;
    if (s.mug) { drawMug(g, s.x + 6 * K9, LCT + dy - 92 * K9, t, s.shake); tHand(g, hx + s.shake, hy, 9.5 * K9, LAB2.vera.skin, LAB2.vera.skinS); }
    else if (s.open) tHand(g, hx, hy, 9.5 * K9, LAB2.vera.skin, LAB2.vera.skinS, true);   // the palm, presenting it
  }
}

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

// ---------------------------------------------------------------- cameras: [centre x, centre y, zoom at shot start, zoom at shot end]
const CAM = {
  CLEO_OPEN: [735, LCT - 185, 1.78, 1.72],                           // frame 1: her smile, both remotes, Vera's arm from the left edge
  WIDE: [540, 990, 1.0, 1.03],
  TWO: [540, 960, 1.22, 1.28],
  CLEO_CU: [CX - 10, CFACE + 80, 2.3, 2.45], VERA_CU: [VX + 10, VFACE + 80, 2.3, 2.45],
  CLEO_MED: [CX - 70, CFACE + 160, 1.6, 1.66], VERA_MED: [VX + 40, VFACE + 150, 1.6, 1.66],
  PANEL_CU: [PANEL.x, PANEL.y - 10, 3.0, 3.25],
  BOARD_END: [LBOARD.x - 40, LBOARD.y - 5, 2.75, 2.85],
};

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  const jolt = t > TL.ZERO && t < TL.ZERO + .18 ? Math.sin(t * 120) * 6 * (1 - (t - TL.ZERO) / .18) : 0;
  applyCam(c, CAM[n], sk, jolt);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, t, 0);
  const closing = n === 'BOARD_END' && t > TL.BOARDT + .4 && t <= TL.BOARDT + 1.3 ? (t - TL.BOARDT - .4) / .9 : 0;
  drawRentCircles(c, n === 'BOARD_END' && t > TL.BOARDT + 1.3 ? 10 : 9, closing);
  if (n === 'BOARD_END') drawChalkArm(c, t, 9);
  drawPanel(c, t);
  drawFridge(c, 0);
  const cast = n !== 'BOARD_END' && n !== 'PANEL_CU';
  const showV = cast && !['CLEO_CU', 'CLEO_MED'].includes(n);         // close-ups show their subject only
  const showC = cast && !['VERA_CU', 'VERA_MED'].includes(n);
  if (cast) {
    if (showV) drawVeraAll(c, t);
    if (n !== 'VERA_CU') drawCleoAll(c, t, showC);
    if (showC) drawPop(c, t);
  }
  c.drawImage(LAB_STATIC.front, 0, LCT);
  if (cast) { const nf = noteFall(t); if (nf && nf[1] < LCT + 900) drawNote(c, nf[0], nf[1], nf[2]); }
  // the alarm: the room pulses red with the beacon (light, not a cross-fade)
  if (t >= TL.ALARM && t < TL.ZERO) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = `rgba(255,30,50,${.05 + .13 * (.5 + .5 * Math.sin((t - TL.ALARM) * 7))})`; c.fillRect(0, 0, W, H);
  }
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  endCard(OUT, t, 'vl');   // owner 11/9 + 11/13: the cast and NEW EPISODE EVERY DAY, 2.5 s (TL.ENDCARD)
}
window.render = render;

// ---------------------------------------------------------------- sound cues (tools/mix.py): every action on its frame, in its space
const walkSteps = (t0, x0, x1, kind) => footfalls(t0, x0, x1, 150, 1.9).map((x, i, a) => ({ type: kind, t: +x.toFixed(3), i, pan: Math.max(-1, Math.min(1, (x0 + (x1 - x0) * (i + 1) / a.length - 540) / 540)) }));
window.EV = [
  { type: 'cloth', t: V.L5.t - .05, gdb: -3 },                     // she points at it again: "Don't touch it."
  { type: 'cloth', t: TL.WALK0 - .05, gdb: -5 },
  ...walkSteps(TL.WALK0, VX, TL.VX_OFF, 'step'),                   // off for coffee
  { type: 'set', t: SET1 - .02 },                                  // Cleo puts her remote down on the bench
  ...Array.from({ length: TL.NSWAP }, (_, k) => ({ type: k % 2 ? 'scrape2' : 'scrape', t: +(SW0 + k * TL.SWAP + .03).toFixed(3), gdb: [0, -1, -2, 0, -1][k] })),   // the shell game
  { type: 'note', t: SW0 + .05 },                                  // the sticky note flutters off
  ...walkSteps(TL.RET0, TL.VX_OFF, VX, 'step'),                    // back with a mug
  { type: 'pick', t: TL.PICK0 + .42 },                             // she picks one up
  { type: 'click', t: TL.PRESS },                                  // and presses it
  { type: 'klaxon', t: TL.ALARM, dur: 3.0 },                       // the panel's beacon and alarm (its whoop repeats every
  { type: 'klaxon', t: TL.ALARM + 3.0, dur: TL.COUNT - 3.05 },     // .5 s: the second take starts on the same phase), dead on zero
  ...Array.from({ length: TL.COUNT }, (_, i) => ({ type: 'beep', t: +(TL.ALARM + i).toFixed(3), gdb: i === TL.COUNT - 1 ? 2 : 0 })),   // 5, 4, 3, 2, 1
  { type: 'cloth', t: V.L9.t - .05, gdb: -2 },                     // Vera in a panic
  { type: 'pop', t: TL.ZERO },                                     // zero: the remote blows up itself (a poof of smoke)
  { type: 'crackle', t: TL.ZERO + .02 },                           // its insides sputtering
  { type: 'boing', t: TL.ZERO + .04 },                             // its button up on a spring
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
