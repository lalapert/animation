// Void Mart, episode 8: "Lost & Found". The lost-and-found box holds what the universe lost: a planet made of socks and somebody's
// Tuesday. A commuter whose head is a page-a-day calendar comes for his Tuesday; MAGS charges a Wednesday for storage; his face
// jumps to Thursday and he runs, leaving his briefcase, which becomes the sock planet's moon. Script: channel/scripts/VM08_lost_and_found.md
// Set: the counter (vmkit.js). The counter hides the clerks below the waist. The commuter stands in front of the counter and is
// only ever framed from the chest up: every shot that shows him keeps the bottom of the frame above his waist (owner 11/13:
// no torso ending in the air; checked every frame in commuter()).
// Deterministic: render(t) draws frame t; window.EV lists the sound cues.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const qb = (a, b, c2, k) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * b + k * k * c2;   // quadratic bezier, one axis
window.WAIST_ERR = [];

// ---------------------------------------------------------------- layout (world coordinates)
const BOX = { x: 545, w: 214, h: 138 };                      // the lost-and-found box on the counter, between Pip and Rae
const BTOP = CT - BOX.h;
const PLANET = { x: 560, y: 730, r: 78 };                    // where the sock planet floats once Pip lets go: over the box, above their heads
const PIPX1 = 372;                                           // Pip steps over to the box to dig
const CU = { x: TL.CU_X1, waist: CT + 190, s: 115 };         // the commuter: tall and lanky, waist below every frame he is in
const CASE = { x: 655, w: 124, h: 84 };                      // where he puts his briefcase down on the counter
const SKIN = { c: '#c5cde6', s: '#9aa4c9' };

// ---------------------------------------------------------------- props
function sockPath(g) { g.moveTo(-9, -34); g.lineTo(9, -34); g.lineTo(9, -6); g.quadraticCurveTo(9, 2, 18, 2); g.lineTo(24, 2); g.quadraticCurveTo(34, 2, 34, 11); g.quadraticCurveTo(34, 20, 24, 20); g.lineTo(-2, 20); g.quadraticCurveTo(-9, 20, -9, 12); g.closePath(); }
const SOCKS = [['#ff5f7e', '#fbf7ff', 'stripe'], ['#5f9dff', '#fbf7ff', 'dots'], ['#ffd23f', '#ff9a3d', 'stripe'], ['#8fd65a', '#2f7a3a', 'dots'], ['#b9a6ff', '#fbf7ff', 'stripe']];
function drawSock(g, x, y, s, rot, k) {                        // one sock, ankle up, toe to the right
  const [base, mark, pat] = SOCKS[k % SOCKS.length];
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  tShape(g, base, sockPath, 0);
  g.save(); g.beginPath(); sockPath(g); g.clip(); g.fillStyle = mark;
  if (pat === 'stripe') for (let yy = -30; yy < 22; yy += 10) g.fillRect(-12, yy, 50, 4);
  else for (const [dx, dy] of [[-2, -26], [3, -14], [-3, -3], [8, 12], [20, 10], [27, 15]]) { g.beginPath(); g.arc(dx, dy, 2.6, 0, 6.2832); g.fill(); }
  g.restore();
  tShape(g, '#fbf7ff', gg => gg.rect(-9, -38, 18, 6), 2.2);                    // the cuff
  tShape(g, null, sockPath, 2.6);
  g.restore();
}
// the sock planet: a ball of balled-up socks, three odd socks orbiting it like a ring; (optional) the briefcase moon
function drawPlanet(g, t, x, y, r, moon = 0) {
  const orb = [0, 1, 2].map(i => ({ a: t * 2.1 + i * 2.094, k: i + 2 }));
  const ring = (front) => {
    for (const o of orb) {
      const sn = Math.sin(o.a); if ((sn > 0) !== front) continue;
      const px = x + Math.cos(o.a) * r * 1.62, py = y + sn * r * .36 - Math.cos(o.a) * r * .12;
      drawSock(g, px, py, r / 72 * (front ? 1.05 : .9), o.a * .6, o.k);
    }
    if (moon > 0) {                                           // the briefcase goes round on a wider, slower orbit
      const a = t * 1.25 + 1.2, sn = Math.sin(a);
      if ((sn > 0) === front) { const px = x + Math.cos(a) * r * 2.05 * moon, py = y + sn * r * .45 * moon - Math.cos(a) * r * .18; drawBriefcase(g, px, py + 26, .62 + .1 * sn, Math.cos(a) * .25); }
    }
  };
  ring(false);
  g.save(); g.shadowColor = 'rgba(255,240,200,.55)'; g.shadowBlur = 26; tEllipse(g, x, y, r, r, '#efe3cf', 0); g.restore();
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.clip();
  const bumps = [[-.45, -.5, 0, .5], [.35, -.55, 1, -.8], [-.6, .15, 2, 1.9], [.1, -.05, 3, .2], [.55, .25, 4, -1.6], [-.2, .55, 1, 2.6], [.4, .7, 0, -.3], [-.75, -.15, 3, -2.2]];
  for (const [bx, by, k, rot] of bumps) drawSock(g, x + bx * r, y + by * r, r / 70, rot, k);
  g.fillStyle = 'rgba(40,20,80,.16)'; g.beginPath(); g.arc(x + r * .35, y + r * .3, r * .95, 0, 6.2832); g.fill();   // one shade
  g.restore();
  tEllipse(g, x, y, r, r, null, 4);
  tCurve(g, x - r * .62, y - r * .35, x - r * .5, y - r * .7, x - r * .15, y - r * .82, 4, 'rgba(255,255,255,.8)');
  ring(true);
}
// one page of a page-a-day calendar: red binding with the month, the weekday big; (cx, top) = top centre
function drawDay(g, cx, top, w, h, day, o = {}) {
  g.save();
  if (o.glow) { g.shadowColor = 'rgba(255,236,150,.95)'; g.shadowBlur = 30 * o.glow; }
  tShape(g, '#fffdf4', gg => gg.roundRect(cx - w / 2, top, w, h, 6), 0);
  g.restore();
  tShape(g, '#e23b4a', gg => gg.roundRect(cx - w / 2, top, w, h * .2, [6, 6, 0, 0]), 0);
  tText(g, 'NOV', cx, top + h * .105, h * .12, '#fff', '"Bungee"', 'center', 400);
  const fit = Math.min(h * .2, w * .9 / (day.length * .64));
  tText(g, day, cx, top + h * (o.face ? .33 : .52), fit, TOON.ink, '"Bungee"', 'center', 400);
  tShape(g, null, gg => gg.roundRect(cx - w / 2, top, w, h, 6), 3.2);
}
function drawBriefcase(g, x, y, s = 1, rot = 0) {             // (x, y) = bottom centre
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  tShape(g, null, gg => { gg.moveTo(-20, -CASE.h); gg.lineTo(-20, -CASE.h - 18); gg.quadraticCurveTo(-20, -CASE.h - 24, -12, -CASE.h - 24); gg.lineTo(12, -CASE.h - 24); gg.quadraticCurveTo(20, -CASE.h - 24, 20, -CASE.h - 18); gg.lineTo(20, -CASE.h); }, 7);
  const body = gg => gg.roundRect(-CASE.w / 2, -CASE.h, CASE.w, CASE.h, 10);
  tShape(g, '#7a4e2c', body); tShade(g, body, '#5a3720', gg => gg.rect(30, -CASE.h, 40, CASE.h)); tShape(g, null, body, 3.6);
  tLine(g, [-CASE.w / 2 + 4, -CASE.h + 22, CASE.w / 2 - 4, -CASE.h + 22], 2.4);
  for (const sx of [-1, 1]) tShape(g, '#ffd23f', gg => gg.roundRect(sx * 32 - 7, -CASE.h + 16, 14, 12, 3), 2);
  g.restore();
}
function drawBoxBack(g) {
  const x = BOX.x, w = BOX.w;
  tShape(g, '#c59a5e', gg => { gg.moveTo(x - w / 2, BTOP); gg.lineTo(x - w / 2 - 26, BTOP - 46); gg.lineTo(x - w / 2 + 40, BTOP - 30); gg.lineTo(x - w / 2 + 40, BTOP); gg.closePath(); }, 3);   // back flaps
  tShape(g, '#c59a5e', gg => { gg.moveTo(x + w / 2, BTOP); gg.lineTo(x + w / 2 + 26, BTOP - 46); gg.lineTo(x + w / 2 - 40, BTOP - 30); gg.lineTo(x + w / 2 - 40, BTOP); gg.closePath(); }, 3);
  tShape(g, '#3a2470', gg => gg.roundRect(x - w / 2 + 6, BTOP - 16, w - 12, 30, 6), 3);                   // the dark inside
  // odds and ends sticking out: an umbrella handle, a single mitten, a key on a ring
  tCurve(g, x - 62, BTOP + 6, x - 70, BTOP - 54, x - 46, BTOP - 58, 7, '#2f5fbf'); tCurve(g, x - 62, BTOP + 6, x - 70, BTOP - 54, x - 46, BTOP - 58, 3, '#5f9dff');
  tShape(g, '#ff9a3d', gg => { gg.moveTo(x + 40, BTOP + 6); gg.lineTo(x + 36, BTOP - 30); gg.quadraticCurveTo(x + 40, BTOP - 52, x + 58, BTOP - 46); gg.quadraticCurveTo(x + 74, BTOP - 40, x + 70, BTOP - 18); gg.lineTo(x + 72, BTOP + 6); gg.closePath(); }, 3);
  tEllipse(g, x + 6, BTOP - 12, 9, 9, null, 3);
}
function drawBoxFront(g) {
  const x = BOX.x, w = BOX.w;
  const front = gg => gg.rect(x - w / 2, BTOP, w, BOX.h);
  tShape(g, '#d9b47a', front); tShade(g, front, '#b88f55', gg => gg.rect(x + w / 2 - 44, BTOP, 44, BOX.h)); tShape(g, null, front, 3.6);
  tShape(g, '#e8c992', gg => { gg.moveTo(x - w / 2, BTOP); gg.lineTo(x - w / 2 - 18, BTOP + 30); gg.lineTo(x - w / 2 + 50, BTOP + 22); gg.lineTo(x - w / 2 + 44, BTOP); gg.closePath(); }, 3);   // front flaps, folded down
  tShape(g, '#e8c992', gg => { gg.moveTo(x + w / 2, BTOP); gg.lineTo(x + w / 2 + 18, BTOP + 30); gg.lineTo(x + w / 2 - 50, BTOP + 22); gg.lineTo(x + w / 2 - 44, BTOP); gg.closePath(); }, 3);
  tShape(g, 'rgba(255,253,244,.9)', gg => gg.rect(x - 92, BTOP + 38, 184, 62), 2.4);                     // a strip of tape with the marker label
  tText(g, 'LOST &', x, BTOP + 56, 28, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, 'FOUND', x, BTOP + 84, 28, TOON.ink, '"Bungee"', 'center', 400);
}

// ---------------------------------------------------------------- the commuter (head: a page-a-day calendar)
// (x, waist) = waist centre; s = scale (100 = local units). o: day, prev, flip 0..1, eyes 'tired'|'happy'|'shock', mouth, blink,
// arm {x, y} world target of his right hand (screen left) or null, hold: a page in that hand ('WEDNESDAY'), run: arm swing
function commuter(g, t, x, waist, s, o) {
  const k = s / 100, m = g.getTransform();
  const sy = m.d * waist + m.f, sx0 = m.a * (x - 90 * s / 100) + m.e, sx1 = m.a * (x + 90 * s / 100) + m.e;   // where his waist lands on screen: never in frame
  if (sy < H + 4 && sx1 > 0 && sx0 < W) window.WAIST_ERR.push(+t.toFixed(3));
  g.save(); g.translate(x, waist); g.rotate(o.rot || 0); g.scale(k, k);
  // left arm (screen right): hangs, or swings when he runs
  const sw = o.run ? Math.sin(o.run) * 40 : 0;
  tTube(g, [62, -388, 82, -300 + sw * .2, 78 + sw * .5, -200, 70 + sw, -110, 66 + sw, 30], 26, '#5b6078', '#454a60');   // ends below the waist, out of frame
  // the jacket: long and narrow; shirt, tie, lapels
  const jacket = gg => { gg.moveTo(-58, 10); gg.lineTo(-66, -360); gg.quadraticCurveTo(-66, -398, -30, -404); gg.lineTo(30, -404); gg.quadraticCurveTo(66, -398, 66, -360); gg.lineTo(58, 10); gg.closePath(); };
  tShape(g, '#6b7088', jacket); tShade(g, jacket, '#565a70', gg => gg.rect(34, -420, 50, 440));
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-24, -404); gg.lineTo(24, -404); gg.lineTo(0, -300); gg.closePath(); }, 2.6);
  tShape(g, '#e23b4a', gg => { gg.moveTo(-8, -396); gg.lineTo(8, -396); gg.lineTo(5, -380); gg.lineTo(11, -306); gg.lineTo(0, -292); gg.lineTo(-11, -306); gg.lineTo(-5, -380); gg.closePath(); }, 2.4);
  tShape(g, '#7d8299', gg => { gg.moveTo(-30, -404); gg.lineTo(-40, -340); gg.lineTo(-12, -330); gg.lineTo(-2, -300); gg.lineTo(-24, -404); gg.closePath(); }, 2.6);
  tShape(g, '#7d8299', gg => { gg.moveTo(30, -404); gg.lineTo(40, -340); gg.lineTo(12, -330); gg.lineTo(2, -300); gg.lineTo(24, -404); gg.closePath(); }, 2.6);
  tShape(g, null, jacket, 4);
  tEllipse(g, -2, -250, 4, 4, '#2b2244', 0); tEllipse(g, -2, -200, 4, 4, '#2b2244', 0);
  // neck and the calendar head
  tShape(g, SKIN.c, gg => gg.rect(-12, -432, 24, 32), 3);
  const hw = 150, hh = 150, top = -440 - hh;
  tShape(g, '#d9d4c8', gg => gg.roundRect(-hw / 2 - 4, -444, hw + 8, 14, 4), 3);                      // the stack of pages under the face
  for (let i = 0; i < 3; i++) tLine(g, [-hw / 2 + 2, -440 + i * 3.4, hw / 2 - 2, -440 + i * 3.4], 1.2);
  const face = (day, sc) => {                                                    // the top page, squashed by a flip (sc 0..1 from the binding down)
    g.save(); g.translate(0, top); g.scale(1, Math.max(.02, sc)); g.translate(0, -top);
    drawDay(g, 0, top, hw, hh, day, { face: true });
    if (sc > .35) {
      const ey = top + hh * .66, my = top + hh * .86, e = o.eyes || 'tired';
      for (const sx of [-1, 1]) {
        const ex = sx * 30;
        if (e === 'happy') tCurve(g, ex - 13, ey + 4, ex, ey - 9, ex + 13, ey + 4, 4.4);
        else if (o.blink && e !== 'shock') tLine(g, [ex - 12, ey, ex + 12, ey], 4);
        else {
          const r = e === 'shock' ? 14 : 11;
          tEllipse(g, ex, ey, r, r, '#fff', 3.4);
          g.fillStyle = TOON.ink; g.beginPath(); g.arc(ex - 3, ey + 1, e === 'shock' ? 4 : 5.5, 0, 6.2832); g.fill();
          if (e === 'tired') { tShape(g, '#fffdf4', gg => gg.rect(ex - 13, ey - 13, 26, 10), 0); tLine(g, [ex - 12, ey - 3, ex + 12, ey - 3], 3.4); tCurve(g, ex - 10, ey + 15, ex, ey + 19, ex + 10, ey + 15, 2.6, '#9aa4c9'); }
        }
      }
      const ma = o.mouth || 0;
      if (ma > .06) tEllipse(g, 0, my, 9 + ma * 7, 3 + ma * 9, '#3a1a20', 3);
      else if (e === 'happy') tCurve(g, -16, my - 4, 0, my + 8, 16, my - 4, 3.6);
      else if (e === 'shock') tEllipse(g, 0, my, 8, 9, '#3a1a20', 3);
      else tLine(g, [-12, my, 12, my], 3.4);
    }
    g.restore();
  };
  const f = o.flip ?? 1;
  if (f >= 1 || !o.prev) face(o.day, 1);
  else {
    if (f < .5) { face(o.day, 1); face(o.prev, 1 - 2 * f); }                     // the old page lifts away from the binding...
    else {
      face(o.day, 1);
      g.save(); g.translate(0, top); g.scale(1, -(2 * f - 1) * .55); tShape(g, '#e9e3d6', gg => gg.roundRect(-hw / 2, 0, hw, hh, 6), 3); g.restore();   // ...and its back flips over the top
    }
  }
  g.restore();
  // the right arm (screen left), to a target in the world, with the hand; and what it holds
  const shX = x - 60 * k, shY = waist - 388 * k;
  const tg = o.arm || { x: x - 74 * k, y: waist + 30 * k };     // at rest the hand hangs out of frame
  const ex = (shX + tg.x) / 2 - 30 * k, ey = (shY + tg.y) / 2 + 26 * k;
  g.save(); g.translate(0, 0);
  tTube(g, [shX, shY, ex, ey, (ex + tg.x) / 2, (ey + tg.y) / 2, tg.x, tg.y], 26 * k, '#6b7088', '#565a70');
  tHand(g, tg.x, tg.y, 12 * k, SKIN.c, SKIN.s);
  g.restore();
  if (o.hold) drawDay(g, tg.x - 6, tg.y - 6 - 136 * k, 132 * k, 132 * k, o.hold, { glow: .3 });
  if (o.carry) drawBriefcase(g, tg.x, tg.y + (CASE.h + 18) * .9, .9);
}
function commuterState(t) {
  if (t < TL.CU0 || t > TL.GONE + .2) return null;
  const o = { day: 'MONDAY', eyes: 'tired', mouth: talkLevel('CUST', t), blink: blinkAt(4, t), arm: null, x: CU.x, dy: 0, rot: 0 };
  // walk in (waist up), then stand; run out at the end
  let tr = travel(t, TL.CU0, TL.CU_X0, TL.CU_X1, TL.CU_STEP, TL.CU_SPS);
  o.x = tr.x;
  if (tr.moving) { const b = walkBob(tr.dist, TL.CU_STEP, 10); o.dy = b.dy; o.rot = b.rot; }
  if (t >= TL.RUN0) {
    const tr2 = travel(t, TL.RUN0, TL.CU_X1, 1700, 190, 3.4);
    o.x = tr2.x; const b = walkBob(tr2.dist, 190, 14); o.dy = b.dy; o.rot = b.rot - .06; o.run = tr2.dist / 190 * Math.PI;
  }
  // the briefcase: carried up out of frame, set on the counter
  if (t < TL.CASE + .45) {
    const k2 = smooth(TL.CASE, TL.CASE + .45, t), hx = lerp(o.x - 40, CASE.x + 2, k2), hy = lerp(CU.waist + 40, CT - CASE.h - 24, k2 * k2 * (3 - 2 * k2));
    if (t >= TL.CU1 - .3) { o.arm = { x: hx, y: hy }; o.carry = true; }
  }
  // the handover: his hand to Pip's page, the page to his face; the face flips Monday -> Tuesday
  if (t >= TL.TAKE - .35 && t < TL.SLAP + .3) {
    const reach = smooth(TL.TAKE - .35, TL.TAKE, t), lift = smooth(TL.TAKE + .05, TL.SLAP, t), back = smooth(TL.SLAP, TL.SLAP + .3, t);
    const P = pageHandoff(t);
    o.arm = { x: lerp(lerp(o.x - 74, P.x + 34, reach), o.x - 40, lift), y: lerp(lerp(CU.waist + 30, P.y + 30, reach), CU.waist - 470 * CU.s / 100, lift) };
    if (back > 0) o.arm = { x: lerp(o.arm.x, o.x - 74, back), y: lerp(o.arm.y, CU.waist + 30, back) };
    if (t >= TL.TAKE && t < TL.SLAP) o.hold = 'TUESDAY';
  }
  if (t >= TL.SLAP) { o.day = 'TUESDAY'; o.prev = 'MONDAY'; o.flip = smooth(TL.SLAP, TL.SLAP + .22, t); o.eyes = 'happy'; }
  if (t >= V.L7.t + .2 && t < TL.TEAR0) o.eyes = 'tired';
  // the fee: a page pulled out from under the stack (WEDNESDAY), shown, tossed into the box
  if (t >= TL.TEAR0 && t < TL.TOSS + .3) {
    const hx0 = o.x - 50, hy0 = CU.waist - 436 * CU.s / 100;
    const pull = smooth(TL.TEAR0, TL.TEAR0 + .3, t), show = smooth(TL.TEAR0 + .3, TL.SHOW, t), toss = smooth(TL.TOSS - .1, TL.TOSS + .15, t);
    o.arm = { x: lerp(lerp(o.x - 74, hx0, pull), o.x - 40, show), y: lerp(lerp(CU.waist + 30, hy0, pull), CU.waist - 300, show) };   // shown in front of his chest, clear of Rae's face
    if (toss > 0) o.arm = { x: lerp(o.arm.x, o.x - 230, toss), y: lerp(o.arm.y, CU.waist - 420, toss) };
    if (t >= TL.TEAR0 + .2 && t < TL.TOSS) o.hold = 'WEDNESDAY';
    if (t > TL.TOSS + .15) o.arm = { x: lerp(o.x - 230, o.x - 74, smooth(TL.TOSS + .15, TL.TOSS + .3, t)), y: lerp(CU.waist - 420, CU.waist + 30, smooth(TL.TOSS + .15, TL.TOSS + .3, t)) };
    o.eyes = 'tired';
  }
  if (t >= TL.THU) { o.day = 'THURSDAY'; o.prev = 'TUESDAY'; o.flip = smooth(TL.THU, TL.THU + .22, t); o.eyes = 'shock'; }
  return o;
}
function drawCommuter(g, t) {
  const o = commuterState(t); if (!o) return;
  commuter(g, t, o.x, CU.waist + o.dy, CU.s, o);
}
// the Wednesday page in the air, from his hand into the box
function flyingPage(g, t) {
  if (t < TL.TOSS || t > TL.INBOX) return;
  const k = clamp((t - TL.TOSS) / (TL.INBOX - TL.TOSS)), x0 = CU.x - 236, y0 = CU.waist - 540;
  const x = qb(x0, (x0 + BOX.x) / 2, BOX.x + 10, k), y = qb(y0, y0 - 120, BTOP + 30, k);
  g.save(); g.translate(x, y); g.rotate(-.6 * k); drawDay(g, 0, -60, 100 - 30 * k, 100 - 30 * k, 'WEDNESDAY'); g.restore();
}
// the Tuesday page Pip holds out (world centre of the page)
function pageHandoff(t) {
  const P = pipState(t);
  return { x: PIPX1 + 99 + (P.giveK || 0) * 130, y: CT - 160 - (P.giveK || 0) * 100 };   // held up over the box, clear of its flaps and of Rae's chin
}

// ---------------------------------------------------------------- Pip
function pipBob(t) { return Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0); }
function pipState(t) {
  const st = { x: PIP.x, expr: 'grin', mode: 'rest', look: 0 };
  if (t < TL.PARK + .55) { st.mode = 'overhead'; st.expr = t < endOf('L1') + .2 ? 'gasp' : 'grin'; }
  st.x = lerp(PIP.x, PIPX1, smooth(TL.DIG0 - .2, TL.DIG0 + .3, t));
  if (t >= TL.DIG0 && t < TL.UP) st.mode = 'dig';
  if (t >= TL.UP && t < TL.TAKE) { st.mode = 'page'; st.expr = t < V.L4.t ? 'gasp' : 'grin'; }
  if (t >= TL.GIVE && t < TL.TAKE) { st.mode = 'give'; st.giveK = smooth(TL.GIVE, TL.GIVE + .35, t); st.expr = 'grin'; }
  if (t >= TL.TAKE && t < V.L7.t) st.expr = 'grin';
  if (t >= V.L7.t && t < TL.GONE) st.expr = t >= TL.TEAR0 ? 'worried' : 'gasp';
  if (t >= TL.GONE && t < endOf('L10') + .3) { st.mode = 'call'; st.expr = 'gasp'; }
  if (t >= TL.ORBIT - .3) { st.mode = 'cheeks'; st.expr = t < endOf('L11') + .2 ? 'gasp' : 'grin'; }
  return st;
}
// arms in Pip's local units (after drawPip2's own transform): shoulders at (+-52, -88)
function pipArm(g, side, hx, hy, open, shade) {
  const P = TOON.pip, sx = side * 52, sy = -88, ex = (sx + hx) / 2 + side * 22, ey = (sy + hy) / 2 + 18;
  tTube(g, [sx, sy, ex, ey, (ex + hx) / 2, (ey + hy) / 2, hx, hy], 20, P.shirt, shade ? P.shirtS : null);
  tHand(g, hx, hy, 9, P.skin, P.skinS, open);
}
function drawPip(g, t) {
  const st = pipState(t), bob = pipBob(t), s = PIP.s / 100;
  const o = { expr: st.expr, mouth: mouthFor('PIP', t), blink: blinkAt(3, t), wave: false };
  const custom = ['overhead', 'dig', 'give', 'call'].includes(st.mode);
  if (custom) o.arms = false;
  if (st.mode === 'page' || st.mode === 'cheeks') o.hold = true;
  drawPip2(g, st.x, CT + bob, PIP.s, o);
  g.save(); g.translate(st.x, CT + bob); g.scale(s, s);
  if (st.mode === 'overhead') {
    const park = smooth(TL.PARK, TL.PARK + .5, t);
    // both arms up, the planet on her hands; while parking it, the hands go with it, then drop
    const px = lerp(0, (PLANET.x - st.x) / s, park), py = lerp(-300, (PLANET.y - CT) / s, park);
    for (const sd of [-1, 1]) pipArm(g, sd, px + sd * 40, py + 40, false, sd > 0);
  } else if (st.mode === 'dig') {
    const wig = Math.sin(t * 16) * 6, bx = (BOX.x - st.x) / s, by = (BTOP + 34 - CT) / s;
    pipArm(g, -1, bx - 30 + wig, by, false, false); pipArm(g, 1, bx + 26 - wig, by + 4, false, true);
  } else if (st.mode === 'give' || st.mode === 'call') {
    pipArm(g, -1, -18, -13, false, false);                     // the reaching arm is drawn over the box (drawPipHeld)
  }
  g.restore();
}
function drawPipHeld(g, t) {                                  // what she holds, drawn over the box
  const st = pipState(t), bob = pipBob(t), s = PIP.s / 100;
  if (st.mode === 'overhead') {
    const park = smooth(TL.PARK, TL.PARK + .5, t);
    drawPlanet(g, t, lerp(st.x, PLANET.x, park), lerp(CT - 300 * s, PLANET.y, park), PLANET.r * lerp(1.12, 1, park));
  }
  if (st.mode === 'page') {
    const up = smooth(TL.UP, TL.UP + .25, t);
    drawDay(g, st.x, CT + bob + (-120 + 30 * (1 - up)) * s, 86 * s * (.7 + .3 * up), 86 * s * (.7 + .3 * up), 'TUESDAY', { glow: .8 });   // at her chest, under her chin
  }
  if (st.mode === 'give') {                                    // the page held out over the box, her hand on its left edge
    const P = pageHandoff(t);
    drawDay(g, P.x, P.y - 65, 130, 130, 'TUESDAY', { glow: .8 });
    g.save(); g.translate(st.x, CT + bob); g.scale(s, s); pipArm(g, 1, (P.x - 56 - st.x) / s, (P.y + 52 - CT) / s, false, true); g.restore();   // her hand on the bottom-left corner, under the word
  }
  if (st.mode === 'call') {                                    // "Sir! Your briefcase!": an arm out after him
    const k = smooth(TL.GONE - .05, TL.GONE + .2, t);
    g.save(); g.translate(st.x, CT + bob); g.scale(s, s); pipArm(g, 1, lerp(30, 150, k), lerp(-40, -150, k), true, true); g.restore();
  }
}

// ---------------------------------------------------------------- Rae: deadpan; at the end the briefcase into the box, then a sip
function drawRae(g, t) {
  const u = RAE.s / 100, bob = Math.sin(t * 1.7 + 1) * 1.5;
  const o = { expr: 'deadpan', look: -1.5, mouth: mouthFor('RAE', t), blink: blinkAt(1, t), scanner: true, mug: 0 };
  if (t >= TL.RAE0 && t < TL.RISE + .2) {
    const g1 = smooth(TL.RAE0, TL.LIFT, t), g2 = smooth(TL.LIFT, TL.DROP, t), g3 = smooth(TL.DROP + .05, TL.DROP + .35, t);
    const cx = (CASE.x - RAE.x) / u, cy = (CT - CASE.h - 24 - CT) / u, bx = (BOX.x + 20 - RAE.x) / u, by = (BTOP - 40 - CT) / u;
    let x = lerp(-30, cx, g1), y = lerp(30, cy, g1);
    x = lerp(x, bx, g2); y = lerp(y, by - 30 * Math.sin(Math.PI * g2), g2);
    x = lerp(x, -30, g3); y = lerp(y, 30, g3);
    o.reachL = { x, y }; o.look = -2.2;
  }
  if (t >= TL.SIP) { const k = smooth(TL.SIP, TL.SIP + .35, t) * (1 - smooth(TL.SIP + 1.2, TL.SIP + 1.55, t)); o.mug = k; }
  drawRae2(g, RAE.x, CT + bob, RAE.s, o);
  return o;
}
function briefcaseNow(t, R) {                                  // where the briefcase is: on the counter, in Rae's hand, in the box, a moon
  if (t < TL.CASE + .45) return null;                          // still in his hand (drawn by the commuter)
  if (t < TL.LIFT) return { x: CASE.x, y: CT };
  if (t < TL.DROP + .05) { const u = RAE.s / 100; return { x: RAE.x + R.reachL.x * u, y: CT + R.reachL.y * u + CASE.h + 24 }; }
  if (t < TL.RISE) { const k = clamp((t - TL.DROP - .05) / .25); return { x: BOX.x + 20, y: lerp(BTOP + 10, BTOP + 110, k * k), inBox: true }; }
  return null;                                                 // the moon (drawn with the planet)
}

// ---------------------------------------------------------------- MAGS: turns to the commuter; the fee board
function drawMagsHere(g, t) {
  const mk = clamp((t - TL.MAGSTURN) / .4) - 1, sw = .12 * (1 - (1 + 2.2 * mk * mk * mk + 1.2 * mk * mk));
  g.save(); g.translate(MAGS.x, MAGS.y); g.rotate(-sw); g.translate(-MAGS.x, -MAGS.y);
  drawMags(g, MAGS.x, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) });
  g.restore();
}
function feeBoard(g, t) {
  const t0 = V.L7.t + 1.3, k = clamp((t - t0) / .22); if (k <= 0 || t > endOf('L7') + .35) return;
  g.save(); g.translate(MAGS.x, MAGS.y + 280); g.scale(.6 + .4 * k, .6 + .4 * k); g.globalAlpha = k;
  tShape(g, 'rgba(255,125,140,.18)', gg => gg.roundRect(-190, -76, 380, 152, 18), 4);
  g.strokeStyle = '#ff7d8c'; g.lineWidth = 3; g.strokeRect(-178, -64, 356, 128);
  tText(g, 'STORAGE FEE', 0, -26, 36, '#ffd0d4', '"Bungee"', 'center', 400);
  tText(g, '1 WEDNESDAY', 0, 28, 44, '#ffffff', '"Bungee"', 'center', 400);
  g.restore();
}

// ---------------------------------------------------------------- cameras
const CAM = Object.assign({}, VMCAM, {
  PIP_MED: [380, 1030, 1.72, 1.8],
  HIGH_WIDE: [620, 705, 1.3, 1.34],                            // bottom of frame at 1443: his waist (1480) stays out
  CUST_MED: [CU.x - 20, 930, 1.9, 1.98],
  TWO_SHOT: [620, 740, 1.35, 1.4],
  MAGS_MED: [MAGS.x, 268, 2.1, 2.2],                          // the clerks' hair stays out of the bottom
  RAE_CU: [775, RAEFACE + 85, 2.35, 2.55],                     // a little right of the kit's: the parked planet stays clear of her face
  END_WIDE: [540, 930, 1.22, 1.26],                           // the planet and its moon stay under the end card
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
  if (n === 'MAGS_MED') feeBoard(c, t);
  const R = drawRae(c, t);
  drawPip(c, t);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, true);
  // the box, with what goes into it
  drawBoxBack(c);
  const bc = briefcaseNow(t, R);
  if (bc && bc.inBox) drawBriefcase(c, bc.x, bc.y, .9);
  drawBoxFront(c);
  if (t >= TL.PARK + .5) {
    const moon = t < TL.RISE ? 0 : smooth(TL.RISE, TL.ORBIT, t);
    if (t >= TL.RISE && t < TL.ORBIT) {                        // the briefcase floats up out of the box into its orbit
      const k = smooth(TL.RISE, TL.ORBIT, t), a = 1.25 * TL.ORBIT + 1.2;
      const ox = PLANET.x + Math.cos(a) * PLANET.r * 2.05, oy = PLANET.y + Math.sin(a) * PLANET.r * .45 - Math.cos(a) * PLANET.r * .18 + 30;
      drawPlanet(c, t, PLANET.x, PLANET.y, PLANET.r, 0);
      drawBriefcase(c, lerp(BOX.x + 20, ox, k), lerp(BTOP + 40, oy, k), lerp(.9, .62, k), Math.sin(k * 6) * .2);
    } else drawPlanet(c, t, PLANET.x, PLANET.y, PLANET.r, moon >= 1 ? 1 : 0);
  }
  if (bc && !bc.inBox) drawBriefcase(c, bc.x, bc.y, .9);
  drawPipHeld(c, t);
  flyingPage(c, t);
  drawCommuter(c, t);
  glassStreaks(c, .9);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues (11/13 natural sound: what we see, in the store's room)
window.EV = [
  ...[0, .5, 1.0, 1.55, 2.05, 2.6].map((d, i) => ({ type: 'swish', t: .2 + d, pan: -.3 })),       // the odd socks going round the planet (visual gag)
  { type: 'cloth', t: TL.PARK, pan: -.1 },                                                        // the planet let go over the box
  { type: 'rummage', t: TL.DIG0, pan: -.05 },                                                     // Pip digging in the box
  { type: 'page', t: TL.UP, pan: -.2 },                                                           // the Tuesday comes out
  { type: 'chime', t: TL.CU0 - .2, pan: .6 },                                                     // the door: a customer
  ...footfalls(TL.CU0, TL.CU_X0, TL.CU_X1, TL.CU_STEP, TL.CU_SPS).map(x => ({ type: 'step', t: x, pan: .5 })),
  { type: 'case', t: TL.CASE + .45, pan: .25 },                                                   // his briefcase on the counter
  { type: 'page', t: TL.TAKE, pan: .1 },                                                          // he takes the page
  { type: 'flip', t: TL.SLAP, pan: .35 },                                                         // ...slaps it on: Monday -> Tuesday
  { type: 'servo', t: TL.MAGSTURN },                                                              // MAGS turns to him
  { type: 'holo', t: V.L7.t + 1.3 },                                                              // the fee board
  { type: 'tear', t: TL.TEAR0 + .12, pan: .3 },                                                   // a page pulled from under his head
  { type: 'page', t: TL.TOSS, pan: .1 },                                                          // tossed...
  { type: 'drop', t: TL.INBOX, pan: -.05 },                                                       // ...into the box
  { type: 'flip', t: TL.THU, pan: .35 },                                                          // Tuesday -> Thursday
  ...footfalls(TL.RUN0, TL.CU_X1, 1700, 190, 3.4).map(x => ({ type: 'run', t: x, pan: .6 })),
  { type: 'chime', t: TL.GONE + .1, pan: .7 },                                                    // the door: gone
  { type: 'case_drop', t: TL.DROP + .25, pan: -.05 },                                             // into the box
  { type: 'float', t: TL.RISE - .05 },                                                            // it floats up: a moon (visual gag)
  { type: 'sip', t: TL.SIP + .3, pan: .2 },                                                       // Rae's sip
  { type: 'chime', t: DUR - .9, pan: .6 },                                                        // the door again: back to the first frame
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
