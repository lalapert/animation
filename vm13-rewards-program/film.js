// Void Mart, episode 13: "Rewards Program". MAGS launches Void Rewards. The card reader on the counter turns on us, the customer:
// "Do you have a Void Rewards account?" "No thanks." "Great! Just enter your phone number." The receipt never stops; ten thousand
// points buy one receipt; points expire when the customer ceases to exist; Rae is at -4,120 because she says "no thanks" a lot;
// MAGS wins Employee of the Month on sign-ups; Rae turns the reader on MAGS. Script: channel/scripts/VM13_rewards_program.md
// Set: the counter (vmkit.js). The customer is us (a point-of-view arm in the opening) and, in the wide shot, a tall alien seen from
// behind in front of the counter, waist far below every frame (checked each frame in customer()).
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
window.WAIST_ERR = [];

// ---------------------------------------------------------------- layout (world coordinates)
const TERM = { x: 600, w: 160, h: 130, top: CT - 178 };      // the card reader on its stand, its screen facing the customer (us)
const SCR = { w: 132, h: 96 };                               // its screen (local 0..132 x 0..96)
const CU = { x: 860, hy: 960, waist: 1800, k: 1 };           // the customer, from behind
const PIPHOLD = { x: PIP.x, y: CT - 198 };                   // where Pip holds the receipt (her hands at her chest)
const HEAP = { x: 505 };                                     // the receipt piling up on the counter
const LIFTED = { x: 575, y: 700 };                           // the reader held up toward MAGS (up and left of Rae's face, clear of it)
const HELD = { x: 640, y: 1100 };                            // the reader at Rae's chest at the end
const CUST_ARM = '#3f8fd6', CUST_ARMS = '#2c6fb0', CUST_SKIN = '#9be86b', CUST_SKINS = '#6fbf45';

// ---------------------------------------------------------------- the card reader and its screens
function readerPose(t) {                                     // where the reader is: on its stand, lifted to MAGS, or at Rae's chest
  const base = { x: TERM.x, y: TERM.top + TERM.h / 2, rot: 0 };
  if (t < TL.LIFT) return base;
  const up = smooth(TL.LIFT, TL.LIFT + .45, t), down = smooth(TL.MINUS + .15, TL.MINUS + .6, t);
  const p = lp(lp(base, LIFTED, up), HELD, down);
  return { x: p.x, y: p.y, rot: lerp(lerp(0, -.2, up), -.08, down) };
}
function screenState(t) {
  if (t < TL.KEYPAD) return 'ask';
  if (t < TL.TYPED) return 'keypad';
  if (t < TL.LEAVE + .6) return 'welcome';
  if (t < TL.LIFT + .3) return 'idle';
  if (t < TL.MINUS) return 'ask';
  return 'minus';
}
const KEYS = (() => { const o = []; for (let r = 0; r < 4; r++) for (let cc = 0; cc < 3; cc++) o.push({ x: 34 + cc * 32, y: 44 + r * 13 }); return o; })();   // key centres (screen local)
const NUMBER = [5, 5, 5, 0, 1, 9, 2, 8, 4, 7];              // the digits keyed in (key index: 1-9, then 0 is key 10)
const keyIdx = d => d === 0 ? 10 : d - 1;
function drawScreen(g, t, st) {                              // screen local coordinates 0..SCR.w x 0..SCR.h
  const w = SCR.w, h = SCR.h;
  const bg = st === 'minus' ? '#3a0f1c' : '#10203a';
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const btn = (x, y, bw, bh, label, col, size = 10) => { tShape(g, col, gg => gg.roundRect(x, y, bw, bh, 5), 1.6); tText(g, label, x + bw / 2, y + bh / 2 + .5, size, '#10203a', '"Bungee"', 'center', 400); };
  if (st === 'ask' || st === 'idle') {
    const pulse = 1 + .04 * Math.sin(t * 6);
    if (st === 'ask') { tText(g, 'DO YOU HAVE A', w / 2, 12, 9, '#ffffff', '"Bungee"', 'center', 400); tText(g, 'VOID REWARDS', w / 2, 25, 12, '#ffd23f', '"Bungee"', 'center', 400); tText(g, 'ACCOUNT?', w / 2, 38, 9, '#ffffff', '"Bungee"', 'center', 400); }
    else { tText(g, 'JOIN', w / 2, 14, 11, '#ffffff', '"Bungee"', 'center', 400); tText(g, 'VOID REWARDS!', w / 2, 30, 12, '#ffd23f', '"Bungee"', 'center', 400); }
    g.save(); g.translate(36, 62); g.scale(pulse, pulse); btn(-28, -12, 56, 24, 'YES', '#8fd65a', 11); g.restore();
    g.save(); g.translate(96, 62); g.scale(pulse, pulse); btn(-30, -12, 60, 24, 'YES, LATER', '#8fd65a', 7); g.restore();
    tText(g, 'no thanks', 112, 88, 5, 'rgba(255,255,255,.38)', '"Fredoka"', 'center', 600);
    const pressed = st === 'ask' && t >= TL.NOTAP && t < TL.NOTAP + .15;
    if (pressed) { g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(100, 84, 24, 8); }
  } else if (st === 'keypad') {
    tText(g, 'GREAT!', w / 2, 9, 9, '#8fd65a', '"Bungee"', 'center', 400);
    tShape(g, '#fbf7ff', gg => gg.roundRect(10, 18, w - 20, 16, 3), 1.4);
    const n = clamp(Math.floor((t - TL.TYPE0) / ((TL.TYPED - TL.TYPE0) / NUMBER.length)) + (t >= TL.TYPE0 ? 1 : 0), 0, NUMBER.length);
    tText(g, n ? NUMBER.slice(0, n).join('') : 'PHONE #', w / 2, 26.5, 9, n ? '#10203a' : '#8a8aa0', '"Bungee"', 'center', 400);
    const lab = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    const cur = n > 0 && t < TL.TYPED ? keyIdx(NUMBER[n - 1]) : -1;
    KEYS.forEach((k, i) => { tShape(g, i === cur ? '#ffd23f' : '#c7cbdb', gg => gg.roundRect(k.x - 13, k.y - 5.5, 26, 11, 3), 1.2); tText(g, lab[i], k.x, k.y + .5, 7, '#10203a', '"Bungee"', 'center', 400); });
  } else if (st === 'welcome') {
    tText(g, 'WELCOME,', w / 2, 20, 12, '#ffffff', '"Bungee"', 'center', 400);
    tText(g, 'MEMBER!', w / 2, 36, 14, '#ffd23f', '"Bungee"', 'center', 400);
    tText(g, '+0.002 POINTS', w / 2, 62, 11, '#8fd65a', '"Bungee"', 'center', 400);
    for (let i = 0; i < 14; i++) { const k = ((t - TL.TYPED) * .9 + i * .071) % 1; g.fillStyle = ['#ffd23f', '#ff7d8c', '#8fd65a', '#7ef0ff'][i % 4]; g.fillRect((i * 37) % w, k * h, 3, 5); }
  } else if (st === 'minus') {
    tText(g, 'MAGS:', w / 2, 26, 16, '#ffffff', '"Bungee"', 'center', 400);
    tText(g, '-10 PTS', w / 2, 58, 22, '#ff5f7e', '"Bungee"', 'center', 400);
    tText(g, '(said "no thanks")', w / 2, 82, 6, 'rgba(255,255,255,.7)', '"Fredoka"', 'center', 600);
  }
}
function drawReader(g, t) {
  const P = readerPose(t), st = screenState(t);
  if (t < TL.LIFT + .2) {                                    // the stand and its coiled cord
    tShape(g, '#5b5f78', gg => gg.roundRect(TERM.x - 22, TERM.top + TERM.h - 6, 44, CT - TERM.top - TERM.h + 6, 4), 3);
    tShape(g, '#5b5f78', gg => gg.roundRect(TERM.x - 46, CT - 10, 92, 10, 4), 3);
  } else {
    tShape(g, '#5b5f78', gg => gg.roundRect(TERM.x - 46, CT - 10, 92, 10, 4), 3);
    g.strokeStyle = TOON.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(TERM.x, CT - 10);
    for (let i = 1; i <= 14; i++) { const k = i / 14, x = lerp(TERM.x, P.x, k), y = lerp(CT - 10, P.y + TERM.h / 2, k) + Math.sin(i * 1.8) * 8; g.lineTo(x, y); } g.stroke();
  }
  g.save(); g.translate(P.x, P.y); g.rotate(P.rot);
  tShape(g, '#2b2f45', gg => gg.roundRect(-TERM.w / 2, -TERM.h / 2, TERM.w, TERM.h, 14), 3.6);
  tShape(g, '#3d4260', gg => gg.roundRect(-TERM.w / 2 + 50, -TERM.h / 2 - 8, 60, 10, 4), 2.4);   // the printer slot
  g.save(); g.translate(-SCR.w / 2, -TERM.h / 2 + 12); g.beginPath(); g.roundRect(0, 0, SCR.w, SCR.h, 6); g.clip();
  drawScreen(g, t, st); g.restore();
  tShape(g, null, gg => gg.roundRect(-SCR.w / 2, -TERM.h / 2 + 12, SCR.w, SCR.h, 6), 2.6);
  tEllipse(g, 0, TERM.h / 2 - 11, 5, 5, '#ff2a3a', 1.6);   // MAGS's little red eye on the reader
  g.restore();
}
const screenToWorld = (sx, sy) => ({ x: TERM.x - SCR.w / 2 + sx, y: TERM.top + 12 + sy });   // reader on its stand

// ---------------------------------------------------------------- the receipt: it prints from the slot and never stops
function receiptLen(t) { return t < TL.PRINT ? 0 : (t - TL.PRINT) * 150; }
function receiptPaper(g, x, y, w, h, lines) {
  tShape(g, '#fffdf6', gg => gg.rect(x, y, w, h), 2.4);
  g.strokeStyle = 'rgba(26,16,48,.25)'; g.lineWidth = 2; for (let yy = y + 12; yy < y + h - 6; yy += 10) { g.beginPath(); g.moveTo(x + 8, yy); g.lineTo(x + w - 8 - ((yy * 7) % 23), yy); g.stroke(); }
  if (lines) lines(g);
}
function drawReceipt(g, t) {
  const L = receiptLen(t); if (L <= 0) return;
  const slot = { x: TERM.x + 10, y: TERM.top - 6 }, wpx = 46;
  if (t >= TL.LIFT) return drawHeap(g, t, L);              // once the reader is lifted the strip is torn off: only the heap is left
  if (t < TL.GRAB) {                                         // a strip up out of the slot, over the front of the reader, down the counter
    const up = Math.min(L, 40);
    tShape(g, '#fffdf6', gg => gg.rect(slot.x - wpx / 2, slot.y - up, wpx, up + 4), 2.2);
    if (L > 40) { const down = Math.min(L - 40, 900); tShape(g, '#fffdf6', gg => { gg.moveTo(slot.x - wpx / 2, slot.y - 40); gg.quadraticCurveTo(slot.x - wpx / 2 + 70, slot.y - 60, slot.x - wpx / 2 + 74, slot.y + 10); gg.lineTo(slot.x - wpx / 2 + 74, slot.y + down); gg.lineTo(slot.x + wpx / 2 + 74, slot.y + down); gg.lineTo(slot.x + wpx / 2 + 74, slot.y + 10); gg.quadraticCurveTo(slot.x + wpx / 2 + 60, slot.y - 40, slot.x + wpx / 2, slot.y - 40); gg.closePath(); }, 2.2); }
    return;
  }
  drawHeap(g, t, L);
}
function drawHeap(g, t, L) {                                 // the heap on the counter between Pip and the reader, growing
  const r = Math.min(110, 30 + L / 40);
  for (let i = 0; i < 7; i++) {
    const a = i * .9, cx = HEAP.x + Math.cos(a) * r * .5, cy = CT - 18 - Math.abs(Math.sin(a)) * r * .35;
    g.save(); g.translate(cx, cy); g.rotate(a); tShape(g, '#fffdf6', gg => gg.ellipse(0, 0, r * .45, r * .2, 0, 0, 6.2832), 2.2); g.restore();
  }
}
function drawHeldReceipt(g, t, hands) {                      // after the grab: a strip from the heap up to Pip's hands, and the end she reads
  if (t < TL.GRAB || t >= TL.LIFT) return;
  const k = smooth(TL.GRAB, TL.GRAB + .35, t), hx = hands.x, hy = hands.y;
  tShape(g, '#fffdf6', gg => { gg.moveTo(HEAP.x - 18, CT - 30); gg.quadraticCurveTo(hx + 60, hy + 40, hx + 30, hy - 4); gg.lineTo(hx + 10, hy - 4); gg.quadraticCurveTo(hx + 40, hy + 50, HEAP.x - 50, CT - 30); gg.closePath(); }, 2.2);
  const ph = 150 * k;
  receiptPaper(g, hx - 56, hy - 4, 112, ph, gg => {
    if (ph < 120) return;
    tText(gg, 'VOID REWARDS', hx, hy + 14, 11, TOON.ink, '"Bungee"', 'center', 400);
    tText(gg, 'POINTS: 0.002', hx, hy + 34, 10, TOON.ink, '"Bungee"', 'center', 400);
    gg.fillStyle = '#fffdf6'; gg.fillRect(hx - 52, hy + 92, 104, 52);
    tText(gg, '*POINTS EXPIRE WHEN', hx, hy + 102, 8, '#e23b4a', '"Bungee"', 'center', 400);
    tText(gg, 'THE CUSTOMER CEASES', hx, hy + 116, 8, '#e23b4a', '"Bungee"', 'center', 400);
    tText(gg, 'TO EXIST.', hx, hy + 130, 8, '#e23b4a', '"Bungee"', 'center', 400);
  });
}

// ---------------------------------------------------------------- holograms: the leaderboard, the sign-ups by the Employee of the Month frame
function leaderboard(g, t) {
  const k = clamp((t - TL.BOARD) / .25); if (k <= 0 || t > endOf('L8') + .4) return;
  const rows = [['1. V. VOLT', '9,999'], ['2. DENNIS', '4,000'], ['3. PIP', '12'], ['...', ''], ['999. RAE', '-4,120']];
  g.save(); g.translate(MAGS.x, 372); g.scale(.9 * (.6 + .4 * k), .9 * (.6 + .4 * k)); g.globalAlpha = k;   // 382..698 x 271..473
  tShape(g, 'rgba(255,125,140,.18)', gg => gg.roundRect(-175, -112, 350, 224, 16), 3.4);
  g.strokeStyle = '#ff7d8c'; g.lineWidth = 2.4; g.strokeRect(-164, -101, 328, 202);
  tText(g, 'VOID REWARDS: TOP MEMBERS', 0, -80, 16, '#ffd0d4', '"Bungee"', 'center', 400);
  rows.forEach(([a, b], i) => { const y = -44 + i * 34, red = i === 4; tText(g, a, -146, y, 21, red ? '#ff5f7e' : '#ffffff', '"Bungee"', 'left', 400); tText(g, b, 146, y, 21, red ? '#ff5f7e' : '#ffffff', '"Bungee"', 'right', 400); });
  g.restore();
}
function signups(g, t) {
  const k = clamp((t - TL.SIGNUPS) / .25); if (k <= 0 || t > V.L11.t) return;
  g.save(); g.translate(735, 350); g.scale(.9 * (.6 + .4 * k), .9 * (.6 + .4 * k)); g.globalAlpha = k;   // 668..802: over the frame's left edge, clear of the photo
  tShape(g, 'rgba(255,125,140,.2)', gg => gg.roundRect(-74, -58, 148, 116, 12), 3);
  tText(g, 'SIGN-UPS', 0, -36, 14, '#ffd0d4', '"Bungee"', 'center', 400);
  tText(g, 'MAGS  4,812', 0, -6, 15, '#ffffff', '"Bungee"', 'center', 400);
  tText(g, 'PIP  1', 0, 22, 15, '#ffffff', '"Bungee"', 'center', 400);
  g.restore();
  const glow = Math.sin(Math.PI * clamp((t - TL.SIGNUPS - .8) / 1.2));   // the frame on the wall lights up: MAGS, again
  if (glow > 0) { g.save(); g.globalAlpha = .5 * glow; g.strokeStyle = '#ffd23f'; g.lineWidth = 10; g.shadowColor = '#ffd23f'; g.shadowBlur = 30; g.strokeRect(776, 246, 208, 228); g.restore();
    drawStar(g, 972, 252, 14 * glow + 4, '#fff6c8', 2.4); }
}

// ---------------------------------------------------------------- the customer: a tall alien in a puffy coat, seen from behind; and our own arm
function customer(g, t) {
  const leave = smooth(TL.LEAVE, TL.LEAVE + 1.3, t); if (leave >= 1) return;
  const x = CU.x + leave * 460, hy = CU.hy + Math.sin(t * 2) * 2, { waist, k } = CU, m = g.getTransform();
  const sy = m.d * waist + m.f, sx0 = m.a * (x - 140) + m.e, sx1 = m.a * (x + 140) + m.e;
  if (sy < H + 4 && sx1 > 0 && sx0 < W) window.WAIST_ERR.push(+t.toFixed(3));
  g.save(); g.translate(x, hy); g.scale(k, k);
  const Lw = (waist - hy) + 40;
  const coat = gg => { gg.moveTo(-50, 96); gg.quadraticCurveTo(-124, 104, -128, 190); gg.lineTo(-138, Lw); gg.lineTo(138, Lw); gg.lineTo(128, 190); gg.quadraticCurveTo(124, 104, 50, 96); gg.closePath(); };
  tShape(g, CUST_ARM, coat); tShade(g, coat, CUST_ARMS, gg => gg.rect(60, 80, 90, Lw));
  g.save(); g.beginPath(); coat(g); g.clip(); g.strokeStyle = 'rgba(16,30,70,.4)'; g.lineWidth = 3.4; for (let yy = 200; yy < Lw; yy += 58) { g.beginPath(); g.moveTo(-150, yy); g.quadraticCurveTo(0, yy + 12, 150, yy); g.stroke(); } g.restore();
  tShape(g, null, coat, 4);
  tTube(g, [-120, 170, -150, 380, -140, 600], 36, CUST_ARM, CUST_ARMS); tTube(g, [120, 170, 150, 380, 140, 600], 36, CUST_ARM, CUST_ARMS);
  tShape(g, CUST_SKIN, gg => gg.rect(-20, 70, 40, 34), 3);                       // the back of the neck
  const head = gg => gg.ellipse(0, 0, 92, 86, 0, 0, 6.2832);
  tShape(g, CUST_SKIN, head); tShade(g, head, CUST_SKINS, gg => gg.ellipse(40, 20, 60, 80, -.3, 0, 6.2832)); tShape(g, null, head, 4);
  tShape(g, '#ff7a1a', gg => { gg.moveTo(-90, -14); gg.quadraticCurveTo(0, -128, 90, -14); gg.closePath(); }, 4);   // a knit hat, from behind
  tEllipse(g, 0, -86, 16, 14, '#ffd23f', 3);
  for (const sx of [-1, 1]) { tCurve(g, sx * 40, -60, sx * 70, -120, sx * 60, -150, 4.2); tEllipse(g, sx * 60, -154, 8, 8, CUST_SKIN, 3); }
  g.restore();
}
function povArm(g, t) {                                      // the customer's arm from the bottom right of the frame, finger on the screen
  if (t >= TL.LEAVE - .4) return;                            // only in the opening close-up (the customer is us)
  const base = { x: 860, y: 1560 };
  let tgt = { x: 700, y: 1330 };                             // resting below the reader
  const press = (a, p) => { const d = t - a; return d >= 0 && d < .16 ? Math.sin(Math.PI * d / .16) * 6 : 0; };
  if (t >= V.L1.t + .3 && t < TL.KEYPAD) { const nt = screenToWorld(112, 88); tgt = lp(tgt, { x: nt.x + 4, y: nt.y + 4 }, smooth(V.L2.t - .2, TL.NOTAP - .02, t)); tgt.y += press(TL.NOTAP, 0); }
  if (t >= TL.KEYPAD && t < TL.TYPED + .3) {
    const step = (TL.TYPED - TL.TYPE0) / NUMBER.length, i = clamp(Math.floor((t - TL.TYPE0) / step), 0, NUMBER.length - 1), kk = KEYS[keyIdx(NUMBER[i])];
    const p = screenToWorld(kk.x, kk.y); tgt = t < TL.TYPE0 ? lp({ x: 700, y: 1260 }, { x: p.x + 4, y: p.y + 4 }, smooth(TL.KEYPAD + .5, TL.TYPE0, t)) : { x: p.x + 4, y: p.y + 4 + press(TL.TYPE0 + i * step, 0) };
  }
  if (t >= TL.TYPED + .3) tgt = lp(tgt, { x: 760, y: 1500 }, smooth(TL.TYPED + .3, TL.TYPED + .7, t));
  const el = { x: (base.x + tgt.x) / 2 + 40, y: (base.y + tgt.y) / 2 + 30 };
  tTube(g, [base.x, base.y, el.x, el.y, tgt.x + 18, tgt.y + 16], 40, CUST_ARM, CUST_ARMS);
  tHand(g, tgt.x + 14, tgt.y + 14, 14, CUST_SKIN, CUST_SKINS);
  tTube(g, [tgt.x + 8, tgt.y + 6, tgt.x + 3, tgt.y + 2, tgt.x, tgt.y], 7, CUST_SKIN);   // the pointing finger
}

// ---------------------------------------------------------------- Pip
const pipBob = t => Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0);
function pipState(t) {
  let expr = 'grin';
  if (t >= V.L6.t + 1.6) expr = 'worried';
  if (t >= V.L7.t) expr = 'worried';
  if (t >= TL.BOARD) expr = 'grin';
  if (t >= V.L8.t) expr = 'gasp';
  if (t >= V.L10.t + 1.4) expr = 'sad';
  if (t >= V.L11.t) expr = 'gasp';
  return { expr, hold: t >= TL.GRAB && t < TL.LIFT };
}
function drawPip(g, t) {
  const st = pipState(t), bob = pipBob(t);
  drawPip2(g, PIP.x, CT + bob, PIP.s, { expr: st.expr, mouth: mouthFor('PIP', t), blink: blinkAt(3, t), wave: false, hold: st.hold });
  return { x: PIP.x, y: CT + bob - 104 * PIP.s / 100 };    // where her hands are when she holds
}

// ---------------------------------------------------------------- Rae: her left arm lifts the reader to MAGS, then holds it at her chest
function drawRae(g, t) {
  const o = { expr: 'deadpan', look: -1.2, blink: blinkAt(1, t), mouth: mouthFor('RAE', t) };
  if (t >= V.L9.t) o.look = -1.6;
  if (t >= V.L10.t) o.look = -2;
  if (t >= TL.LIFT) { o.look = -2.4; o.expr = 'smirk'; }
  if (t >= TL.MINUS) { o.look = 0; o.expr = 'deadpan'; }
  const u = RAE.s / 100, y0 = CT + Math.sin(t * 1.7 + 1) * 1.5;
  if (t >= TL.LIFT - .3) {                                   // her left hand goes to the reader, lifts it, brings it down to her chest
    const P = readerPose(t), grab = { x: TERM.x + 30, y: TERM.top + TERM.h / 2 + 20 };
    const hand = t < TL.LIFT ? lp({ x: RAE.x - 8 * u, y: y0 - 23 * u }, grab, smooth(TL.LIFT - .3, TL.LIFT, t)) : { x: P.x + 40, y: P.y + 30 };
    o.reachL = { x: (hand.x - RAE.x) / u, y: (hand.y - y0) / u };
  }
  drawRae2(g, RAE.x, y0, RAE.s, o);
}
function raeHandOverReader(g, t) {                           // her fingers over the reader's edge (the reader is drawn after her)
  if (t < TL.LIFT) return;
  const P = readerPose(t), u = RAE.s / 100;
  tHand(g, P.x + 40, P.y + 30, 9.5 * u, TOON.rae.skin, TOON.rae.skinS);
}
function drawMagsHere(g, t) {
  const glitch = t >= V.L12.t && t < TL.MINUS + .6 ? (Math.sin(t * 60) > .3 ? 4 : 0) : 0;
  drawMags(g, MAGS.x + glitch, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) });
}

// ---------------------------------------------------------------- cameras
const CAM = Object.assign({}, VMCAM, {
  OPEN: [600, 1215, 4.0, 4.15],                                // frame 1: the card reader, facing us; our arm comes in (Rae's chin stays out)
  WIDE: [560, 960, 1.22, 1.26],                                // bottom of frame at 1747: the customer's waist (1800) stays out
  MAGS_MED: [560, 236, 2.6, 2.7],                             // the incident sign (to x 345), the frame (from 776), the door sign (from y 611) and Rae's hair stay out
  RCPT_CU: [322, 1120, 2.9, 3.0],                              // Pip and the fine print at her chest; the reader (from x 520) stays out
  BOARD: [545, 337, 2.85, 2.9],                                // MAGS and the leaderboard; bottom of frame 674 (Rae's hair out), the board above the subtitles
  EOM_CU: [833, 342, 2.8, 2.86],                               // the Employee of the Month frame and the sign-ups; left edge 640 (MAGS out), bottom 685 (Rae's hair out)
  RAE_LIFT: [735, 860, 2.0, 2.06],                             // left edge 465: Pip's shoulder (to 456) stays out
  END: [735, 855, 2.1, 2.15],                                  // Rae with the reader: MAGS -10; MAGS and Pip out of frame; faces under y 780 for the card
});

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 1, null);
  drawMagsHere(c, t);
  if (n === 'BOARD' || n === 'MAGS_MED') leaderboard(c, t);
  signups(c, t);
  drawRae(c, t);
  const hands = drawPip(c, t);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, false);
  drawReceipt(c, t);
  drawReader(c, t);
  raeHandOverReader(c, t);
  drawHeldReceipt(c, t, hands);
  if (t >= TL.GRAB && t < TL.LIFT) { const u = PIP.s / 100; tHand(c, hands.x + 14 * u, hands.y, 8.5 * u, TOON.pip.skin, TOON.pip.skinS); tHand(c, hands.x - 14 * u, hands.y, 8.5 * u, TOON.pip.skin, TOON.pip.skinS); }
  customer(c, t);
  povArm(c, t);
  glassStreaks(c, .9);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound: what we see, in the store's room)
const keyTimes = NUMBER.map((d, i) => TL.TYPE0 + i * (TL.TYPED - TL.TYPE0) / NUMBER.length);
window.EV = [
  { type: 'tap', t: TL.NOTAP, pan: .2 },                                                           // "no thanks" (it does nothing)
  ...keyTimes.map(x => ({ type: 'key', t: x, pan: .2 })),                                          // the phone number
  { type: 'welcome', t: TL.TYPED, pan: .1 },
  { type: 'bed', fx: 'receipt_printer', t: TL.PRINT, t1: TL.LIFT + .1, g: -35, fin: .05, fout: .08 },   // the receipt, printing and printing
  { type: 'step', t: TL.LEAVE + .45, pan: .5 }, { type: 'step', t: TL.LEAVE + .98, pan: .6, g: .8 },   // the customer goes
  { type: 'paper', t: TL.GRAB, pan: -.3 },                                                         // Pip pulls up the receipt
  { type: 'holo', t: TL.BOARD },                                                                   // the leaderboard
  { type: 'holo', t: TL.SIGNUPS, g: .8 },                                                          // the sign-ups by the frame
  { type: 'pickup', t: TL.LIFT + .02, pan: .1 }, { type: 'rip', t: TL.LIFT + .05, pan: .05 },      // Rae lifts the reader; the receipt tears off
  { type: 'error', t: TL.MINUS, pan: .1 },                                                         // MAGS: -10
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
