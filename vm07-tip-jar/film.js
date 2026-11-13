// Void Mart, episode 7: "Tip Jar". A comet is the first tip, a space trucker tips his own tooth, MAGS takes sixty percent with a
// claw from the ceiling and turns a tip screen on Pip. Script: channel/scripts/VM07_tip_jar.md
// Set: the counter (vmkit.js). The counter hides the clerks below the waist; the trucker's hover pod hides his (owner's movement
// choice 11/8: hops for Pip, waist-up travel for Rae, something in front of the legs).
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

// ---------------------------------------------------------------- layout (world coordinates)
const JAR = { x: 470, w: 86, h: 118 };                       // the tip jar on the counter, left of centre (Pip's side)
const JMOUTH = CT - JAR.h - 4;
const CU = { x: 680, rim: CT + 40, s: 125 };                 // the trucker: waist at the pod's rim, in front of the counter
const HATCH = { x: JAR.x, y: 96 };                           // the claw's hatch in the ceiling, straight over the jar
const MAGS_LOW = { x: 455, y: 690 };                         // where MAGS comes down to, beside Pip's face
const PANEL = { x: 300, y: 1196, w: 290, h: 172 };           // the tip screen (hologram) in front of Pip, under her chin
const BTN = [{ l: '20%', x: 222 }, { l: '25%', x: 300 }, { l: '30%', x: 378 }];
const RX = TL.RAE_X1;                                        // Rae's spot by the jar at the end

// ---------------------------------------------------------------- props
function drawJarBack(g, x, y, s = 1) {                       // (x, y) = bottom centre
  g.save(); g.translate(x, y); g.scale(s, s);
  tShape(g, 'rgba(190,230,255,.22)', gg => gg.roundRect(-JAR.w / 2, -JAR.h, JAR.w, JAR.h, 14), 0);
  g.restore();
}
function drawJarFront(g, x, y, s = 1, glow = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (glow > 0) { g.save(); g.globalAlpha = .35 * glow; g.shadowColor = '#ffd23f'; g.shadowBlur = 40; tShape(g, 'rgba(255,230,140,.25)', gg => gg.roundRect(-JAR.w / 2, -JAR.h, JAR.w, JAR.h, 14), 0); g.restore(); }
  tShape(g, null, gg => gg.roundRect(-JAR.w / 2, -JAR.h, JAR.w, JAR.h, 14), 4);
  tShape(g, '#c9e8f7', gg => gg.roundRect(-JAR.w / 2 - 5, -JAR.h - 10, JAR.w + 10, 14, 6), 3.4);   // the lip
  tCurve(g, -JAR.w / 2 + 10, -JAR.h + 18, -JAR.w / 2 + 7, -JAR.h / 2, -JAR.w / 2 + 11, -14, 4, 'rgba(255,255,255,.75)');
  tShape(g, '#fbf7ff', gg => gg.rect(-JAR.w / 2 + 3, -42, JAR.w - 6, 26), 2.6);
  tText(g, 'TIPS :)', 0, -28.5, 18, TOON.ink, '"Bungee"', 'center', 400);
  g.restore();
}
function drawTooth(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  tShape(g, '#fffdf2', gg => { gg.moveTo(-10, -12); gg.lineTo(10, -12); gg.lineTo(10, 4); gg.lineTo(6, 14); gg.lineTo(2, 6); gg.lineTo(-2, 6); gg.lineTo(-6, 14); gg.lineTo(-10, 4); gg.closePath(); }, 2.6);
  g.restore();
}
function drawCoin(g, x, y, s = 1) { tEllipse(g, x, y, 13 * s, 9 * s, '#ffd23f', 2.6); tEllipse(g, x, y, 7 * s, 4.5 * s, null, 1.6); }

// the comet: where it is at time t (world), and whether it is in the claw
function jarPos(t) {                                         // bottom centre of the jar (on the counter, or in Pip's arms)
  if (t >= TL.HUG && t < TL.SETDOWN + .15) {
    const up = smooth(TL.HUG, TL.HUG + .3, t), down = smooth(TL.SETDOWN, TL.SETDOWN + .15, t);
    const hx = PIP.x, hy = CT + pipBob(t) - 60 * PIP.s / 100;
    const k = up * (1 - down);
    return [lerp(JAR.x, hx, k), lerp(CT, hy, k)];
  }
  return [JAR.x, CT];
}
function cometPos(t) {
  if (t < TL.HIT) { const k = t / TL.HIT; return [lerp(60, BOARD.x + 30, k), lerp(240, BOARD.y + 10, k * k * .4 + k * .6)]; }   // 11/13: already in frame on the first frame, its tail trailing off the edge
  if (t < TL.LAND) { const k = (t - TL.HIT) / (TL.LAND - TL.HIT); return [qb(BOARD.x + 30, 420, JAR.x, k), qb(BOARD.y + 10, 150, CT - 60, k)]; }
  const cl = clawState(t);
  if (cl.comet) return [cl.x + Math.sin(t * 13) * 3, cl.y + 66];
  const [jx, jy] = jarPos(t), a = t * 8.5, settle = smooth(TL.LAND, TL.LAND + .35, t);
  return [jx + Math.cos(a) * 20 * settle, jy - 76 + Math.sin(a) * 14 * settle + (1 - settle) * -10];
}
function drawComet(g, t) {
  if (t >= TL.CLAWIN + .5) return;                           // it went up into the ceiling with the claw
  const cl = clawState(t), big = t < TL.LAND ? 1.8 : 1.05;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 9; i >= 1; i--) {                             // the tail: where the comet was a moment ago
    let px, py;
    if (cl.comet) { const [x, y] = cometPos(t); px = x + Math.sin(t * 9 + i * .7) * i * 3; py = y + i * 9; }
    else[px, py] = cometPos(t - i * (t < TL.LAND ? .035 : .028));
    const k = 1 - i / 10;
    g.fillStyle = `rgba(255,${150 + 80 * k | 0},${90 + 60 * k | 0},${.5 * k})`; g.beginPath(); g.arc(px, py, (6 + 10 * k) * big, 0, 6.2832); g.fill();
  }
  g.restore();
  const [x, y] = cometPos(t);
  g.save(); g.shadowColor = '#ffd23f'; g.shadowBlur = 30 * big; tEllipse(g, x, y, 15 * big, 15 * big, '#fff6c8', 3); g.restore();
  tEllipse(g, x - 4 * big, y - 4 * big, 4 * big, 4 * big, '#ffffff', 0);
}

// ---------------------------------------------------------------- the claw (an arcade claw on a cable from a ceiling hatch)
function clawState(t) {
  const top = HATCH.y - 40, low = JMOUTH - 52, stop = JMOUTH - 92, hang = 300;
  let y = top, open = 1, comet = false, limp = 0;
  if (t >= TL.CLAW0 && t < TL.CLAWIN + .5) {
    if (t < TL.CLAWGRAB) { y = lerp(top, low, ease((t - TL.CLAW0) / 1.0)); open = 1; }
    else if (t < TL.CLAWUP) { y = low; open = 1 - smooth(TL.CLAWGRAB, TL.CLAWGRAB + .15, t); comet = t >= TL.CLAWGRAB + .1; }
    else if (t < TL.CLAWTOP) { y = lerp(low, hang, ease((t - TL.CLAWUP) / (TL.CLAWTOP - TL.CLAWUP))); open = 0; comet = true; }
    else if (t < TL.CLAWIN) { y = hang + Math.sin((t - TL.CLAWTOP) * 4) * 6 * Math.exp(-(t - TL.CLAWTOP) * 1.5); open = 0; comet = true; }
    else { y = lerp(hang, top, ease((t - TL.CLAWIN) / .5)); open = 0; comet = true; }
  } else if (t >= TL.CLAW2) {
    if (t < TL.CLAWSTOP) { y = lerp(top, stop, ease((t - TL.CLAW2) / (TL.CLAWSTOP - TL.CLAW2))); open = 1; }
    else if (t < TL.CLAWBACK) {
      y = stop; open = 1;
      for (const tt of [TL.TAP1, TL.TAP2]) { const k = (t - tt) / .22; if (k > 0 && k < 1) y = stop - Math.sin(Math.PI * k) * 26; }
    } else { y = lerp(stop, top, ease((t - TL.CLAWBACK) / .9)); open = 1; limp = smooth(TL.CLAWBACK, TL.CLAWBACK + .25, t); }
  }
  return { x: HATCH.x, y, open, comet, limp, out: y > top + 2 };
}
function drawClaw(g, t) {
  const cl = clawState(t);
  // the hatch: a dark slot in the ceiling band that opens while the claw is out
  const hk = (t >= TL.CLAW0 - .2 && t < TL.CLAWIN + .7) || (t >= TL.CLAW2 - .2 && t < TL.CLAWBACK + 1.1) ? 1 : 0;
  if (hk) tShape(g, '#08040f', gg => gg.roundRect(HATCH.x - 40, HATCH.y - 16, 80, 16, 4), 3);
  if (!cl.out) return;
  tLine(g, [cl.x, HATCH.y - 10, cl.x, cl.y - 18], 5); g.strokeStyle = '#c1c6d8'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cl.x, HATCH.y - 10); g.lineTo(cl.x, cl.y - 18); g.stroke();
  g.save(); g.translate(cl.x, cl.y);
  for (const sx of [-1, 0, 1]) {                             // three prongs: open = splayed, closed = curled in; limp = hanging straight down
    const sp = (cl.open * .55 + .08) * (1 - cl.limp * .8), a = sx * sp;
    const bx = sx * 10, l1 = 34, l2 = 30;
    const ex = bx + Math.sin(a) * l1, ey = 12 + Math.cos(a) * l1;
    const tip = a - sx * (.9 - cl.open * .5) * (1 - cl.limp);
    const fx = ex + Math.sin(tip) * l2 * (sx ? 1 : .6), fy = ey + Math.cos(tip) * l2;
    tTube(g, [bx, 10, ex, ey, fx, fy], 12, '#c9cfe0', sx > 0 ? '#9aa0b8' : null);
  }
  tShape(g, '#9aa0b8', gg => gg.roundRect(-26, -22, 52, 38, 9), 3.6);
  tShape(g, '#e23b4a', gg => gg.arc(0, -3, 7, 0, 6.2832), 2.4);
  g.restore();
}

// ---------------------------------------------------------------- the trucker (one-off): a lumpy coral rock of a man in a hover pod
// (x, rim) = the pod's rim under his middle; local units, 100 = 1x. o: mouth 0..1, gap (tooth out), arm {x, y} (his right hand, our
// left, in local units) or null, tooth 'hand' | null, look -1..1, grin
function drawTrucker(g, t, x, rim, s, o = {}) {
  const C = { body: '#e08a5f', bodyS: '#b8643f', lump: '#c97650', vest: '#4f73b0', vestS: '#3b5a8f', cap: '#2f5fbf', capS: '#24489a', teeth: '#fffdf2' };
  g.save(); g.translate(x, rim); g.scale(s / 100, s / 100);
  const body = gg => { gg.moveTo(-108, 10); gg.bezierCurveTo(-126, -60, -124, -150, -112, -200); gg.bezierCurveTo(-100, -248, -60, -270, 0, -272); gg.bezierCurveTo(60, -270, 100, -248, 112, -200); gg.bezierCurveTo(124, -150, 126, -60, 108, 10); gg.closePath(); };
  tShape(g, C.body, body);
  tShade(g, body, C.bodyS, gg => { gg.moveTo(70, -262); gg.bezierCurveTo(118, -210, 124, -100, 104, 20); gg.lineTo(150, 20); gg.lineTo(150, -280); gg.closePath(); });
  for (const [px, py, r] of [[-86, -226, 10], [-96, -118, 8], [84, -150, 9], [-60, -250, 6], [96, -214, 7]]) { g.fillStyle = C.lump; g.beginPath(); g.ellipse(px, py, r * 1.3, r, .4, 0, 6.2832); g.fill(); }
  // the vest
  tShade(g, body, C.vest, gg => gg.rect(-140, -96, 280, 120));
  tShade(g, body, C.vestS, gg => gg.rect(78, -96, 80, 120));
  tLine(g, [-14, -96, -14, 14], 3); tLine(g, [14, -96, 14, 14], 3);
  tEllipse(g, -28, -60, 4, 4, '#ffd23f', 2); tEllipse(g, -28, -30, 4, 4, '#ffd23f', 2);
  tShape(g, null, body);
  // the cap: crown, white front panel with a star, the bill straight at us
  const crown = gg => { gg.moveTo(-64, -250); gg.bezierCurveTo(-66, -318, 66, -318, 64, -250); gg.closePath(); };
  tShape(g, C.cap, crown); tShade(g, crown, C.capS, gg => gg.rect(30, -330, 50, 90));
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-34, -252); gg.bezierCurveTo(-34, -300, 34, -300, 34, -252); gg.closePath(); }, 3);
  drawStar(g, 0, -272, 13, '#ffd23f', 2.2);
  tShape(g, C.capS, gg => { gg.moveTo(-74, -250); gg.quadraticCurveTo(0, -226, 74, -250); gg.quadraticCurveTo(0, -240, -74, -250); gg.closePath(); }, 3.6);
  // brow, small eyes
  tShape(g, C.bodyS, gg => { gg.moveTo(-58, -214); gg.quadraticCurveTo(0, -232, 58, -214); gg.quadraticCurveTo(0, -220, -58, -214); gg.closePath(); }, 3);
  const look = o.look || 0;
  for (const sx of [-1, 1]) {
    const ex = sx * 28, ey = -196;
    if (o.grin) { tCurve(g, ex - 10, ey + 2, ex, ey - 8, ex + 10, ey + 2, 4); continue; }
    tEllipse(g, ex, ey, 11, 11, TOON.white, 3);
    g.fillStyle = TOON.ink; g.beginPath(); g.arc(ex + look * 4, ey + 1, 5.5, 0, 6.2832); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + look * 4 - 2, ey - 2, 1.8, 0, 6.2832); g.fill();
  }
  tEllipse(g, -7, -172, 3, 2.4, C.bodyS, 0); tEllipse(g, 7, -172, 3, 2.4, C.bodyS, 0);
  // the underbite: the lower jaw sticks out, four square teeth stand up over the upper lip; it drops when he talks
  const m = o.mouth || 0, jd = 12 * m;
  if (jd > 1) tShape(g, '#4a1a20', gg => gg.roundRect(-50, -158, 100, 10 + jd, 6), 3);
  g.save(); g.translate(0, jd);
  const jaw = gg => { gg.moveTo(-62, -152); gg.bezierCurveTo(-66, -120, -40, -106, 0, -106); gg.bezierCurveTo(40, -106, 66, -120, 62, -152); gg.quadraticCurveTo(0, o.grin ? -138 : -146, -62, -152); gg.closePath(); };
  tShape(g, C.body, jaw); tShade(g, jaw, C.bodyS, gg => gg.rect(30, -160, 50, 60)); tShape(g, null, jaw);
  [-36, -12, 12, 36].forEach((tx, i) => { if (i === 1 && o.gap) return; tShape(g, C.teeth, gg => gg.rect(tx - 9, -176, 18, 24 + (o.grin ? 2 : 0)), 2.8); });
  g.restore();
  g.restore();
}
function truckerArms(g, x, rim, s, o) {
  const C = { body: '#e08a5f', bodyS: '#b8643f' };
  g.save(); g.translate(x, rim); g.scale(s / 100, s / 100);
  // his left (our right): resting on the pod rim
  tTube(g, [104, -150, 132, -110, 142, -40, 130, -6], 32, C.body, C.bodyS); tHand(g, 128, -4, 17, C.body, C.bodyS);
  // his right (our left): resting, or reaching to o.arm (local units)
  const a = o.arm || { x: -128, y: -4 };
  const ex = Math.min(-120, (-112 + a.x) / 2 - 30), ey = (-150 + a.y) / 2 + 26;
  tTube(g, [-104, -150, -126, -118, ex, ey, (ex + a.x) / 2, (ey + a.y) / 2, a.x, a.y], 32, C.body);
  tHand(g, a.x, a.y, 17, C.body, C.bodyS);
  if (o.tooth === 'hand') drawTooth(g, a.x + 4, a.y - 18, 1.3, -.3);
  g.restore();
}
function drawPod(g, t, x, rim, s) {
  g.save(); g.translate(x, rim); g.scale(s / 100, s / 100);
  g.save(); g.globalAlpha = .45 + .1 * Math.sin(t * 9); g.fillStyle = '#7ef0ff'; g.beginPath(); g.ellipse(0, 150, 130, 18, 0, 0, 6.2832); g.fill(); g.restore();
  const tub = gg => { gg.moveTo(-150, -8); gg.lineTo(150, -8); gg.bezierCurveTo(150, 90, 100, 130, 0, 130); gg.bezierCurveTo(-100, 130, -150, 90, -150, -8); gg.closePath(); };
  tShape(g, '#5a63c9', tub); tShade(g, tub, '#434aa3', gg => gg.rect(70, -20, 100, 160));
  tShade(g, tub, '#ffd23f', gg => gg.rect(-160, 28, 320, 14)); tShape(g, null, tub);
  tShape(g, '#7c86e8', gg => gg.roundRect(-158, -18, 316, 20, 10), 3.6);
  g.save(); g.shadowColor = '#fff3b0'; g.shadowBlur = 24; tEllipse(g, 0, 82, 16, 13, '#fff3b0', 3); g.restore();
  g.restore();
}
function truckerState(t) {
  const arrive = ease((t - TL.POD0) / (TL.POD1 - TL.POD0)), leave = smooth(TL.PODOUT, TL.PODOUT + 1.2, t);
  const x = lerp(1420, CU.x, arrive) + leave * 760, bob = Math.sin(t * 3) * 4;
  const jl = [(JAR.x - CU.x) / (CU.s / 100), (JMOUTH - 26 - CU.rim) / (CU.s / 100)];   // the jar mouth, in his units
  let arm = null, tooth = null, look = 0, gap = t >= TL.YANK, grin = false;
  if (t >= TL.GRAB - .45 && t < TL.DROP + .45) {
    const up = smooth(TL.GRAB - .45, TL.GRAB, t), tug = t >= TL.GRAB && t < TL.YANK ? Math.sin((t - TL.GRAB) * 60) * 3 : 0;
    const out = smooth(TL.YANK, TL.YANK + .12, t), toJar = smooth(TL.YANK + .2, TL.DROP - .05, t), back = smooth(TL.DROP + .1, TL.DROP + .45, t);
    let ax = lerp(-128, -12, up) + tug, ay = lerp(-4, -150, up);
    ax = lerp(ax, -70, out); ay = lerp(ay, -214, out);
    ax = lerp(ax, jl[0], toJar); ay = lerp(ay, jl[1], toJar);
    ax = lerp(ax, -128, back); ay = lerp(ay, -4, back);
    arm = { x: ax, y: ay }; tooth = t >= TL.YANK && t < TL.DROP ? 'hand' : null; look = -1;
  }
  if (t >= TL.POD1 && t < TL.GRAB - .45) grin = true;           // he sees the jar and grins
  if (t >= TL.DROP + .2 && t < TL.PODOUT) grin = true;
  return { x, rim: CU.rim + bob, arm, tooth, look, gap, grin, mouth: talkLevel('CUST', t), on: t >= TL.POD0 && x < 1500 };
}
function drawTruckerAll(g, t) {
  const S = truckerState(t); if (!S.on) return;
  drawTrucker(g, t, S.x, S.rim, CU.s, S);
  drawPod(g, t, S.x, S.rim, CU.s);
  truckerArms(g, S.x, S.rim, CU.s, S);
}
// the tooth's fall into the jar, and where it lies after
function toothInJar(g, t) {
  if (t < TL.DROP || t >= TL.CLAWIN + 100) return;
  const [jx, jy] = jarPos(t), k = clamp((t - TL.DROP) / .18);
  const sx = JAR.x - 8, sy = JMOUTH - 30;
  if (k < 1) drawTooth(g, lerp(sx, jx - 10, k), lerp(sy, jy - 14, k * k), 1.4, -.3 + k * 1.5);
  else drawTooth(g, jx - 10, jy - 14, 1.4, 1.2);
}
function coinInJar(g, t) {
  if (t < TL.COIN) return;
  const k = clamp((t - TL.COIN) / .16);
  drawCoin(g, lerp(JAR.x + 8, JAR.x + 12, k), lerp(JMOUTH - 20, CT - 10, k * k), 1.1);
}

// ---------------------------------------------------------------- MAGS on its ceiling pole (comes down to stare at Pip)
function magsPos(t) {
  const d = smooth(TL.MAGSDOWN, TL.MAGSDOWN + 1.2, t) * (1 - smooth(TL.END0, TL.END0 + .7, t));
  return [lerp(MAGS.x, MAGS_LOW.x, d), lerp(MAGS.y, MAGS_LOW.y, d), d];
}
function drawMagsPole(g, t) {
  const [mx, my, d] = magsPos(t);
  if (d > .01) { tLine(g, [MAGS.x, 80, mx, my + 2], 11); g.strokeStyle = '#c1c6d8'; g.lineWidth = 5.5; g.beginPath(); g.moveTo(MAGS.x, 80); g.lineTo(mx, my + 2); g.stroke(); }
  const lensK = t >= TL.LENS && t < TL.PRESS + .2 ? smooth(TL.LENS, TL.LENS + .5, t) : 0;
  drawMags(g, mx, my, MAGS.s, { talk: Math.max(talkLevel('MAGS', t), lensK * .9), glow: 26 + lensK * 60 });
  if (lensK > 0) {                                            // the lens tightening: rings closing in on the eye
    const ex = mx + 6 * MAGS.s / 100, ey = my + 54 * MAGS.s / 100;
    for (let i = 0; i < 3; i++) { const p = ((t - TL.LENS) * 1.6 + i / 3) % 1, r = lerp(70, 18, p);
      g.save(); g.globalAlpha = lensK * (1 - p) * .8; g.strokeStyle = '#ff7d8c'; g.lineWidth = 3; g.beginPath(); g.arc(ex, ey, r, 0, 6.2832); g.stroke(); g.restore(); }
  }
}
// hologram board under MAGS (L6): the tip split
function holo(g, x, y, w, h, k, draw) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(.6 + .4 * k, .6 + .4 * k); g.globalAlpha = k;
  tShape(g, 'rgba(255,125,140,.2)', gg => gg.roundRect(-w / 2, -h / 2, w, h, 18), 4);
  g.strokeStyle = '#ff7d8c'; g.lineWidth = 3; g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  draw(g); g.restore();
}
function splitBoard(g, t) {
  const a = V.L6.t + 1.1, b = V.L7.t + .2;
  if (t < a || t > b) return;
  holo(g, MAGS.x, MAGS.y + 280, 380, 170, clamp((t - a) / .2) * clamp((b - t) / .2), gg => {
    tText(gg, 'TIPS', 0, -44, 26, '#ffd0d4', '"Bungee"', 'center', 400);
    tText(gg, 'MAGS 60%', 0, 2, 44, '#fff', '"Bungee"', 'center', 400);
    tText(gg, 'PIP 40%', 0, 46, 30, '#7ef0ff', '"Bungee"', 'center', 400);
  });
}
// the tip screen in front of Pip: TIP MANAGEMENT? 20% 25% 30%, a tiny grey "no tip"; 30% is pressed, THANK YOU!
function tipScreen(g, t) {
  const a = TL.SCREEN, b = endOf('L10') + .2;
  if (t < a || t > b) return;
  const k = clamp((t - a) / .22) * clamp((b - t) / .25), pressed = t >= TL.PRESS;
  g.save(); g.translate(PANEL.x, PANEL.y); g.scale(.6 + .4 * k, .6 + .4 * k); g.globalAlpha = k;
  tShape(g, 'rgba(120,240,255,.18)', gg => gg.roundRect(-PANEL.w / 2, -PANEL.h / 2, PANEL.w, PANEL.h, 16), 4);
  g.strokeStyle = '#7ef0ff'; g.lineWidth = 2.4; g.strokeRect(-PANEL.w / 2 + 9, -PANEL.h / 2 + 9, PANEL.w - 18, PANEL.h - 18);
  if (!pressed) tText(g, 'TIP MANAGEMENT?', 0, -PANEL.h / 2 + 30, 25, '#ffffff', '"Bungee"', 'center', 400);
  else tText(g, 'THANK YOU!', 0, -PANEL.h / 2 + 30, 30, '#ffd23f', '"Bungee"', 'center', 400);
  for (const bt of BTN) {
    const hot = bt.l === '30%' && pressed, pop = hot ? 1 + .22 * Math.max(0, 1 - (t - TL.PRESS) / .25) : 1;
    g.save(); g.translate(bt.x - PANEL.x, 8); g.scale(pop, pop);
    tShape(g, hot ? '#ffd23f' : 'rgba(126,240,255,.35)', gg => gg.roundRect(-34, -26, 68, 52, 10), 3);
    tText(g, bt.l, 0, 1, 24, hot ? TOON.ink : '#ffffff', '"Bungee"', 'center', 400);
    g.restore();
  }
  tText(g, 'no tip', 0, PANEL.h / 2 - 24, 10, 'rgba(200,205,220,.55)', '"Fredoka"', 'center', 500);
  g.restore();
}

// ---------------------------------------------------------------- Pip: hops, the hug, the press
const HOPS = [{ t0: TL.LAND + .05, d: .42, h: 110 }, { t0: TL.LAND + .5, d: .42, h: 90 }, { t0: V.L1.t + 1.0, d: .55, h: 150 },
  { t0: TL.COIN + .15, d: .5, h: 150 }];
function hopAt(t) { for (const h of HOPS) if (t >= h.t0 && t < h.t0 + h.d) return { ...h, ...hopPose((t - h.t0) / h.d, h.h) }; return null; }
function pipBob(t) { return Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0); }
function pipState(t) {
  let expr = 'grin', arms = {}, sweat = false, turn = 0, pressArm = null;
  if (t < V.L1.t - .2) expr = 'gasp';
  if (t >= V.L1.t - .2 && t < endOf('L1') + .3) { expr = 'gasp'; arms = { hold: true }; }
  if (t >= TL.YANK && t < V.L5.t - .3) expr = 'gasp';
  if (t >= TL.HUG && t < TL.SETDOWN + .1) { expr = t < V.L6.t ? 'grin' : 'worried'; arms = { hold: true }; }
  if (t >= V.L6.t && t < V.L7.t) expr = 'worried';
  if (t >= V.L7.t && t < endOf('L8')) expr = 'gasp';
  if (t >= V.L9.t && t < TL.PRESS + .3) { expr = 'worried'; sweat = t >= TL.SCREEN; }
  if (t >= TL.SCREEN && t < TL.PRESS) turn = Math.sin((t - TL.SCREEN) * 7) > 0 ? .28 : -.12;   // eyes darting: the lens, the screen
  if (t >= TL.PRESS - .7 && t < TL.PRESS + .55) {
    const up = smooth(TL.PRESS - .7, TL.PRESS, t), back = smooth(TL.PRESS + .25, TL.PRESS + .55, t);
    pressArm = { k: up * (1 - back) };
    arms = { arms: false };
  }
  if (t >= TL.PRESS + .3 && t < TL.COIN) expr = 'sheepish';
  if (t >= TL.COIN && t < TL.CLAW2) expr = 'grin';
  if (t >= TL.CLAW2 && t < TL.COVER + .2) expr = 'gasp';
  if (t >= TL.COVER + .2) expr = 'grin';
  const hp = hopAt(t);
  if (hp && !arms.hold && !pressArm) arms = { armsDown: { l: hp.ground ? 0 : -26, r: hp.ground ? 0 : 26, bend: hp.ground ? 0 : .6 } };
  return { o: Object.assign({ expr, sweat, turn, mouth: mouthFor('PIP', t), blink: blinkAt(3, t), wave: false }, arms), hp, pressArm };
}
// with arms:false: her left arm resting, her right arm going for the 30% button (local units)
function pipPressArms(g, k) {
  const P = TOON.pip;
  tTube(g, [-52, -88, -68, -50, -66, -16, -44, -10, -22, -12], 21, P.shirt); tHand(g, -18, -13, 8.5, P.skin, P.skinS);
}
function pipPressHand(g, t, k, bob) {                        // world coordinates, drawn over the screen: her right arm, finger on 30%
  const P = TOON.pip, s = PIP.s / 100;
  const sh = [PIP.x + 50 * s, CT + bob - 90 * s], el = [PIP.x + 66 * s, CT + bob - 52 * s];
  const hx = lerp(PIP.x + 24 * s, BTN[2].x + 2, k), hy = lerp(CT + bob - 14 * s, PANEL.y + 14, k);
  tTube(g, [sh[0], sh[1], sh[0] + 14 * s, sh[1] + 18 * s, el[0], el[1], (el[0] + hx) / 2 + 4, (el[1] + hy) / 2 + 4, hx + 6, hy + 8], 20 * s, P.shirt, P.shirtS);
  tHand(g, hx, hy, 8.5 * s * (1 + .15 * k), P.skin, P.skinS);
}
function drawPipAll(g, t) {
  const P = pipState(t), bob = pipBob(t), hp = P.hp;
  g.save(); g.translate(PIP.x, CT + bob + (hp ? hp.dy : 0)); if (hp) g.scale(hp.sx, hp.sy);
  drawPip2(g, 0, 0, PIP.s, P.o);
  if (P.pressArm) { g.save(); g.scale(PIP.s / 100, PIP.s / 100); pipPressArms(g, P.pressArm.k); g.restore(); }
  g.restore();
  return P;
}

// ---------------------------------------------------------------- Rae: stands; at the end walks over (waist-up), a coin, the palm
function raeState(t) {
  const blink = blinkAt(1, t), mouth = mouthFor('RAE', t);
  let expr = 'deadpan', look = -1.5;
  if (t >= TL.SCREEN && t < V.L10.t) expr = 'annoyed';
  if (t >= V.L10.t && t < endOf('L10') + .3) expr = 'sigh';
  return { expr, look, blink, mouth };
}
function drawRaeAll(g, t) {
  const R = raeState(t), STEP = TL.RAE_STEP;
  if (t < TL.RAEW0) return drawRae2(g, RAE.x, CT + Math.sin(t * 1.7 + 1) * 1.5, RAE.s, Object.assign({ mug: 0 }, R));
  const tr = travel(t, TL.RAEW0, TL.RAE_X0, RX, STEP, TL.RAE_SPS);
  if (tr.moving) return drawTraveller(g, (gg, x, y, s, o) => drawRae2(gg, x, y, s, o), tr.x, CT, RAE.s, Object.assign({ scanner: false }, R), walkBob(tr.dist, STEP, 10), -1);
  const u = RAE.s / 100, jx = (JAR.x - RX) / u, jy = (JMOUTH - 8 - CT) / u;
  const up1 = smooth(TL.RAEW1 + .05, TL.COIN - .05, t), dn1 = smooth(TL.COIN + .15, TL.COIN + .4, t), up2 = smooth(TL.COVER - .3, TL.COVER, t);
  let rx = lerp(-30, jx + 4, up1), ry = lerp(30, jy - 10, up1);
  rx = lerp(rx, -30, dn1); ry = lerp(ry, 30, dn1);
  rx = lerp(rx, jx, up2); ry = lerp(ry, jy + 2, up2);
  drawRae2(g, RX, CT, RAE.s, Object.assign({ scanner: false, reachL: { x: rx, y: ry } }, R));
  if (t < TL.COIN) drawCoin(g, RX + rx * u, CT + ry * u - 10, 1.1);
}
function raePalm(g, t) {                                     // the palm flat over the jar mouth, drawn over the jar
  if (t < TL.COVER) return;
  const k = smooth(TL.COVER - .05, TL.COVER + .05, t);
  g.save(); g.globalAlpha = k;
  tShape(g, TOON.rae.skin, gg => gg.roundRect(JAR.x - 34, JMOUTH - 18, 68, 22, 10), 3.2);
  tLine(g, [JAR.x - 14, JMOUTH - 14, JAR.x - 14, JMOUTH - 2], 1.8); tLine(g, [JAR.x + 2, JMOUTH - 15, JAR.x + 2, JMOUTH - 2], 1.8);
  g.restore();
}

// ---------------------------------------------------------------- cameras
function setCam(g, cx, cy, z, shake = 0) { g.setTransform(z, 0, 0, z, 540 - cx * z + shake, 960 - cy * z); }
const CAM = Object.assign({}, VMCAM, {
  WIDE_OPEN: [540, 1000, 1.18, 1.22],
  WIDE_POD: [600, 1040, 1.2, 1.26],
  CUST_MED: [600, 1100, 1.55, 1.64],
  PIP_HUG: [PIP.x + 10, PIPFACE + 110, 1.95, 2.05],
  MAGS_MED: [MAGS.x, MAGSY + 150, 1.95, 2.05],
  MAGS_CLAW: [505, 290, 2.3, 2.45],
  WIDE_CLAW: [470, 800, 1.45, 1.45],
  RAE_TOOTH: [735, 1040, 2.3, 2.45],
  TWO_SHOT: [440, 900, 1.45, 1.55],
  TIP_CU: [360, 1010, 1.95, 2.08],
  WIDE_END: [500, 1050, 1.5, 1.6],
});

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t); let n = shot[0]; const sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  if (n === 'MAGS_CU') n = t < V.L7.t ? 'MAGS_MED' : 'MAGS_CLAW';   // L6 needs room under MAGS for the board; L8 for the claw
  if (n === 'RAE_CU' && t >= V.L4.t - .01 && t < V.L5.t) n = 'RAE_TOOTH';   // 11/13: the trucker's gap-toothed grin sits above the subtitle, not under it
  const shake = t > TL.SETDOWN && t < TL.SETDOWN + .2 ? Math.sin(t * 90) * 6 * (1 - (t - TL.SETDOWN) / .2) : 0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  if (n === 'WIDE_OPEN') { const k = smooth(.05, 1.6, t); setCam(c, lerp(360, 520, k), lerp(760, 1000, k), lerp(1.38, 1.2, k)); }
  else if (n === 'WIDE_CLAW') { const cl = clawState(t); setCam(c, 470, clamp(cl.y + 230, 640, 1010), 1.45, shake); }
  else applyCam(c, CAM[n], sk, shake);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 0, TL.HIT);
  drawRaeAll(c, t);
  const P = drawPipAll(c, t), bob = pipBob(t);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, true);
  // the jar and what is in it
  const [jx, jy] = jarPos(t), glow = t >= TL.LAND && t < TL.CLAWUP ? 1 : 0;
  drawJarBack(c, jx, jy);
  if (t >= TL.LAND) { toothInJar(c, t); coinInJar(c, t); }
  if (t >= TL.LAND && !clawState(t).comet) drawComet(c, t);
  drawJarFront(c, jx, jy, 1, glow);
  if (t >= TL.HUG && t < TL.SETDOWN + .1) { const s = PIP.s / 100; for (const sx of [-1, 1]) tHand(c, jx + sx * 40, jy - 46, 8.5 * s, TOON.pip.skin, TOON.pip.skinS); }
  if (t < TL.LAND) drawComet(c, t);
  raePalm(c, t);
  drawTruckerAll(c, t);
  drawClaw(c, t);
  if (clawState(t).comet) drawComet(c, t);
  drawMagsPole(c, t);
  splitBoard(c, t);
  tipScreen(c, t);
  if (P.pressArm) pipPressHand(c, t, P.pressArm.k, bob);
  glassStreaks(c, .9);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues
window.EV = [
  // 11/13 natural-sound pass: foley for what we see, in the store's room (tools/mix.py adds the room tone under everything)
  { type: 'whoosh', t: 0, pan: -.5 },                                                    // the comet flying in (visual gag)
  { type: 'comet', t: TL.HIT - .02, pan: -.4 },                                          // it pings off the incident board
  { type: 'flip', t: TL.HIT + .02, pan: -.4 },                                           // 1 -> 0
  { type: 'jar', t: TL.LAND, pan: -.1 },                                                 // into the glass jar
  { type: 'bed', fx: 'fizz', t: TL.LAND + .1, t1: TL.CLAWIN + .4, g: -33, fin: .3, fout: .4 },   // fizzing in the jar until the claw takes it
  ...HOPS.map(h => ({ type: 'hop', t: h.t0 + h.d * .84, pan: -.3 })),                  // Pip landing behind the counter
  { type: 'chime', t: TL.POD0 - .1, pan: .5 },                                           // the door: a customer
  { type: 'pod', t: TL.POD0, pan: .4 },                                                  // his hover pod gliding in
  { type: 'tooth', t: TL.YANK },                                                         // the tooth (visual gag)
  { type: 'jar', t: TL.DROP + .17 },                                                     // the tooth into the jar
  { type: 'pod_out', t: TL.PODOUT, pan: .5 },                                            // he glides off
  { type: 'holo', t: V.L6.t + 1.1 },                                                     // the 60/40 board
  { type: 'jar_down', t: TL.SETDOWN, pan: -.2 },                                         // Pip slams the jar down
  { type: 'hatch', t: TL.CLAW0 - .2 },                                                   // the ceiling hatch opens
  { type: 'claw', t: TL.CLAW0, dur: 1.0 },                                               // the claw lowers
  { type: 'clack', t: TL.CLAWGRAB + .1 },                                                // and closes on the comet
  { type: 'claw_up', t: TL.CLAWUP },                                                     // zips up and dangles
  { type: 'servo', t: TL.CLAWIN, g: .6 },                                                // back into the ceiling
  { type: 'servo', t: TL.MAGSDOWN },                                                     // MAGS comes down on his pole
  { type: 'holo', t: TL.SCREEN },                                                        // the tip screen
  { type: 'lens', t: TL.LENS },                                                          // the lens zooms in on Pip
  { type: 'approve', t: TL.PRESS },                                                      // 30%: THANK YOU!
  { type: 'servo', t: TL.END0 },                                                         // MAGS goes back up
  ...footfalls(TL.RAEW0, TL.RAE_X0, RX, TL.RAE_STEP, TL.RAE_SPS).map(x => ({ type: 'step', t: x, pan: .2 })),
  { type: 'coin', t: TL.COIN + .14 },                                                    // Rae's coin
  { type: 'hatch', t: TL.CLAW2 - .2 },
  { type: 'claw', t: TL.CLAW2, dur: TL.CLAWSTOP - TL.CLAW2 },                            // the claw again
  { type: 'palm', t: TL.COVER },                                                         // Rae's palm over the jar
  { type: 'tap', t: TL.TAP1 + .2 },                                                      // two taps on the back of her hand
  { type: 'claw_up', t: TL.CLAWBACK, g: .7 },                                            // and it goes up, limp
  { type: 'chime', t: DUR - .8, pan: .5 },                                               // the door again: back to the first frame
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
