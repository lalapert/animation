// Void Mart, episode 14: "Best Before" (length_test: short). The milk on the counter is good till the heat death of the universe;
// MAGS says that is tonight (half off). From inside the store the stars go out one by one; Pip throws the carton to Rae; Rae
// catches it and pours it in her coffee: "Then it's still good till midnight." The lights go down, Pip drops under the counter,
// MAGS marks the milk ninety-nine percent off, Pip's eyes come up: "Rae? Are we dead?" "Milk's still good."
// Script: channel/scripts/VM14_best_before.md. First Look 2 episode (TL.LOOK = 2, TL.ACT, SHOT2 cameras).
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
const u = PIP.s / 100;                                        // Pip and Rae share a rig scale

// ---------------------------------------------------------------- the carton (origin: bottom centre, units of CS world px)
const CS = 1.25;
const CART = { x: 470, y: CT };                               // frame 1: on the counter between Pip and the register
const DOWN = { x: 548, y: CT };                               // where Rae sets it down (left of her mug)
function drawCarton(g, x, y, rot = 0, s = CS) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const body = gg => gg.rect(-37, -100, 74, 100);
  tShape(g, '#fbf7ff', body); tShade(g, body, '#d9d2ee', gg => gg.rect(20, -104, 24, 108)); tShape(g, null, body, 3.4);
  const gable = gg => { gg.moveTo(-37, -100); gg.lineTo(-30, -124); gg.lineTo(30, -124); gg.lineTo(37, -100); gg.closePath(); };
  tShape(g, '#7ec8ff', gable, 3.2);
  tShape(g, '#7ec8ff', gg => gg.rect(-30, -132, 60, 8), 2.8);                                   // the sealed top
  tText(g, 'MILK', 0, -111, 13, '#ffffff', '"Bungee"', 'center', 400);
  tShape(g, '#2f6fd6', gg => gg.rect(-37, -98, 74, 20), 0.01);                                 // blue band
  tText(g, 'VOID MART', 0, -87.5, 9.5, '#ffffff', '"Bungee"', 'center', 400);
  tShape(g, '#fff3c4', gg => gg.roundRect(-33, -74, 66, 70, 5), 2.4);                          // the date panel
  tText(g, 'BEST BEFORE:', 0, -65, 8, '#e23b4a', '"Bungee"', 'center', 400);
  tText(g, 'HEAT DEATH', 0, -51, 9.2, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, 'OF THE', 0, -38, 9.6, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, 'UNIVERSE', 0, -25, 9.8, TOON.ink, '"Bungee"', 'center', 400);
  drawStar(g, -24, -12, 4.5, '#ffd23f', 1.6); drawStar(g, 24, -12, 4.5, '#ffd23f', 1.6);
  g.restore();
}
// where the carton is: on the counter, in Pip's hands, in the air, in Rae's left hand, pouring, set down
const PIPHOLD = () => ({ x: PIP.x, y: CT - 104 * u + 108 });       // carton bottom when Pip holds it (hands on its upper half)
const RAEC = { x: 600, y: 1150 };                                // Rae's catch point (carton bottom)
const RAELOOK = { x: 636, y: 1110 };                             // held up beside her, label to camera
const POURAT = { x: 742, y: 1150 };                              // tipped over her mug
const GRAB = () => TL.INS_END + .12;
function cartonPose(t) {
  if (t < GRAB()) return { x: CART.x, y: CART.y, rot: 0, who: null };
  if (t < TL.TOSS) { const k = smooth(GRAB(), GRAB() + .22, t), h = PIPHOLD(); const p = lp(CART, { x: h.x, y: h.y + pipY(t) }, k); return { x: p.x, y: p.y - Math.sin(Math.PI * k) * 30, rot: 0, who: k >= 1 ? 'PIP' : null }; }
  if (t < TL.CATCH) {                                            // thrown: up, over, down into Rae's hand, one turn
    const k = (t - TL.TOSS) / (TL.CATCH - TL.TOSS), h = PIPHOLD();
    return { x: lerp(h.x, RAEC.x, k), y: lerp(h.y, RAEC.y, k) - Math.sin(Math.PI * k) * 520, rot: -Math.PI * 2 * ease(k), who: null };
  }
  if (t < TL.POUR) { const k = smooth(TL.CATCH + .1, TL.CATCH + .7, t); const p = lp(RAEC, RAELOOK, k); return { x: p.x, y: p.y + Math.sin(Math.PI * smooth(TL.CATCH, TL.CATCH + .25, t)) * 14, rot: 0, who: 'RAE' }; }
  if (t < TL.POUR1 + .25) {                                     // over to the mug, tipped, back up
    const a = smooth(TL.POUR, TL.POUR + .25, t), b = smooth(TL.POUR1 - .05, TL.POUR1 + .2, t);
    const p = lp(lp(RAELOOK, POURAT, a), POURAT, b);
    return { x: p.x, y: p.y, rot: 1.75 * a * (1 - b), who: 'RAE' };
  }
  const k = smooth(TL.POUR1 + .25, TL.POUR1 + .6, t);
  const p = lp(POURAT, DOWN, k); return { x: p.x, y: p.y, rot: 0, who: k >= 1 ? 'DOWN' : 'RAE' };
}
// the carton's local point (units) in the world
function cartonPt(P, lx, ly) { const ca = Math.cos(P.rot), sa = Math.sin(P.rot); return { x: P.x + (lx * ca - ly * sa) * CS, y: P.y + (lx * sa + ly * ca) * CS }; }
function pourStream(g, t) {
  if (t < TL.POUR + .22 || t > TL.POUR1) return;
  const P = cartonPose(t), sp = cartonPt(P, 30, -128), mug = { x: RAE.x + 40 * u, y: raeY(t) - 42 * u };
  g.save(); g.strokeStyle = '#fbf7ff'; g.lineCap = 'round'; g.lineWidth = 11; g.beginPath(); g.moveTo(sp.x, sp.y);
  g.quadraticCurveTo(sp.x + 26, sp.y + 10, mug.x, mug.y); g.stroke();
  g.strokeStyle = 'rgba(26,16,48,.5)'; g.lineWidth = 2.4; g.stroke(); g.restore();
  for (let i = 0; i < 3; i++) { const k = ((t * 3.1 + i * .33) % 1); tEllipse(g, mug.x + (i - 1) * 10, mug.y - 6 - k * 14, 4 * (1 - k) + 1, 3 * (1 - k) + 1, '#fbf7ff', 1.4); }
}

// ---------------------------------------------------------------- Pip: holds it, throws it, drops under the counter, peeks
function pipY(t) {                                               // how far below her place Pip is (world px)
  const drop = smooth(TL.DIVE, TL.DIVE + .38, t) * 560;
  return t < TL.PEEK ? drop : lerp(560, 309, smooth(TL.PEEK, TL.PEEK + .55, t));
}
const pipBob = t => Math.sin(t * 2.1) * 2 + (speaking('PIP', t) ? Math.sin(t * 15) * 2.5 : 0);
function pipExpr(t) {
  let e = 'grin';
  if (t >= V.L2.t + .4) e = 'gasp';
  if (t >= V.L3.t + .3) e = 'gasp';
  if (t >= TL.TOSS + .4) e = 'worried';
  if (t >= TL.DIVE) e = 'gasp';
  if (t >= TL.PEEK) e = 'worried';
  return e;
}
function drawPip(g, t) {
  const y = CT + pipBob(t) + pipY(t), P = cartonPose(t), hold = P.who === 'PIP' || (t >= GRAB() && t < TL.TOSS);
  const o = { expr: pipExpr(t), mouth: mouthFor('PIP', t), blink: blinkAt(3, t), hold, wave: t >= TL.TOSS - .1 && t < TL.TOSS + .55 };   // the throwing arm, then down
  if (t >= TL.PEEK) o.look = 1.8;                                // her eyes go to Rae
  drawPip2(g, PIP.x, y, PIP.s, o);
  return hold ? { x: PIP.x, y: y - 104 * u } : null;
}

// ---------------------------------------------------------------- Rae: left hand catches and pours, right hand drinks
const raeY = t => CT + Math.sin(t * 1.7 + 1) * 1.5;
function raeMug(t) {
  const sip = (a, hold) => smooth(a, a + .35, t) * (1 - smooth(a + .35 + hold, a + .75 + hold, t));
  return Math.max(sip(TL.SIP, .5), t >= TL.SIP2 ? smooth(TL.SIP2, TL.SIP2 + .35, t) : 0);
}
let RAEHAND = null;
function drawRae(g, t) {
  const y0 = raeY(t), o = { expr: 'deadpan', look: -1.2, blink: blinkAt(1, t), mouth: mouthFor('RAE', t), mug: raeMug(t), scanner: false };
  if (t >= V.L2.t && t < V.L3.t) o.look = -.4;
  if (t >= TL.CATCH && t < TL.POUR) o.look = -1.5;
  if (t >= TL.POUR && t < TL.DARK) o.look = 1;                   // the mug
  if (t >= TL.DARK) o.look = -.6;
  if (t >= V.L8.t) o.look = -1.4;                                // to Pip, behind the counter
  if (t >= TL.BUTTON) o.expr = 'smirk';
  RAEHAND = null;
  const P = cartonPose(t);
  let hand = null;
  if (t >= TL.TOSS && t < TL.CATCH) hand = lp({ x: RAE.x - 8 * u, y: y0 - 23 * u }, cartonPt(cartonPose(TL.CATCH), -37, -90), smooth(TL.TOSS, TL.CATCH - .05, t));
  else if (P.who === 'RAE') hand = cartonPt(P, -37, -90);
  else if (P.who === 'DOWN') { const lift = smooth(TL.POUR1 + .6, TL.POUR1 + .95, t); hand = lp(cartonPt(P, -37, -90), { x: RAE.x - 8 * u, y: y0 - 23 * u }, lift); if (lift >= 1) hand = null; }
  if (hand) { o.reachL = { x: (hand.x - RAE.x) / u, y: (hand.y - y0) / u }; RAEHAND = hand; }
  drawRae2(g, RAE.x, y0, RAE.s, o);
}
function drawMagsHere(g, t) {
  const glitch = t >= V.L6.t && t < endOf('L6') ? (Math.sin(t * 50) > .55 ? 4 : 0) : 0;
  drawMags(g, MAGS.x + glitch, MAGS.y, MAGS.s, { talk: talkLevel('MAGS', t) });
}

// ---------------------------------------------------------------- MAGS's sale holograms
function saleTag(g, t) {
  let txt = null, k = 0;
  if (t >= TL.SALE && t < TL.VOID) { txt = '50% OFF'; k = clamp((t - TL.SALE) / .22); }
  if (t >= V.L6.t + .9 && t < TL.PEEK + .6) { txt = '99% OFF'; k = clamp((t - V.L6.t - .9) / .22); }
  if (!txt) return;
  g.save(); g.translate(MAGS.x, 362); const sc = .6 + .4 * k; g.scale(sc, sc); g.globalAlpha = k;
  tShape(g, 'rgba(255,125,140,.22)', gg => gg.roundRect(-118, -44, 236, 88, 16), 3.2);
  g.strokeStyle = '#ff7d8c'; g.lineWidth = 2.4; g.strokeRect(-108, -34, 216, 68);
  tText(g, 'MILK', 0, -18, 13, '#ffd0d4', '"Bungee"', 'center', 400);
  tText(g, txt, 0, 12, 34, '#ffffff', '"Bungee"', 'center', 400);
  g.restore();
}

// ---------------------------------------------------------------- the stars from inside the store (reverse shot through the front glass)
const STARS = (() => {
  const r = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const o = []; for (let i = 0; i < 13; i++) o.push({ x: 130 + r(i, 1) * 820, y: 200 + r(i, 2) * 980, s: 28 + r(i, 3) * 26, col: ['#fff6c8', '#ffe08a', '#c9f4ff', '#ffd0f0'][i % 4], out: 0 });
  const order = [5, 1, 9, 3, 11, 0, 7, 12, 2, 8, 4, 10, 6];
  order.forEach((id, n) => { o[id].out = TL.STARS0 + n * .145; });
  return o;
})();
const DUST = (() => { const o = []; for (let i = 0; i < 90; i++) { const a = Math.sin(i * 12.9898) * 43758.5453, b = Math.sin(i * 78.233) * 12543.123; o.push({ x: (a - Math.floor(a)) * W, y: 120 + (b - Math.floor(b)) * 1260, out: TL.STARS0 + ((i * 37) % 90) / 90 * 1.9 }); } return o; })();
function drawVoid(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120a30'); gr.addColorStop(.6, '#1c1046'); gr.addColorStop(1, '#2a1858');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const fade = 1 - .7 * smooth(TL.STARS0, TL.STARS0 + 1.9, t);                                   // the far galaxies fade too
  g.save(); g.globalAlpha = .35 * fade; const ng = g.createRadialGradient(760, 520, 10, 760, 520, 420); ng.addColorStop(0, '#c42f8a'); ng.addColorStop(1, 'rgba(196,47,138,0)'); g.fillStyle = ng; g.fillRect(0, 0, W, H); g.restore();
  for (const d of DUST) if (t < d.out) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(d.x, d.y, 3, 3); }
  for (const s of STARS) {
    const tw = 1 + .12 * Math.sin(t * 7 + s.x);
    if (t < s.out) drawStar(g, s.x, s.y, s.s * tw, s.col, 3.4);
    else if (t < s.out + .22) {                                                                    // a pop: a ring, then nothing
      const k = (t - s.out) / .22; g.save(); g.globalAlpha = 1 - k; g.strokeStyle = s.col; g.lineWidth = 5 * (1 - k) + 1;
      g.beginPath(); g.arc(s.x, s.y, s.s * (.6 + 1.6 * k), 0, 6.2832); g.stroke(); g.restore();
    }
  }
  // the front glass from inside: the frame, the door bar, the store's sign backwards, the counter's edge at the bottom
  tShape(g, '#3a2a6a', gg => { gg.rect(0, 0, W, 70); gg.rect(0, 0, 60, H); gg.rect(W - 60, 0, 60, H); gg.rect(0, 1300, W, 40); }, 5);
  tShape(g, '#3a2a6a', gg => gg.rect(520, 70, 40, 1230), 5);
  g.save(); g.translate(300, 150); g.scale(-1, 1); g.globalAlpha = .28; tText(g, 'VOID MART', 0, 0, 56, '#ff86c8', '"Bungee"', 'center', 400); g.restore();
  g.save(); g.translate(810, 1210); g.scale(-1, 1); g.globalAlpha = .4; tShape(g, 'rgba(255,90,120,.3)', gg => gg.roundRect(-90, -34, 180, 68, 12), 3); tText(g, 'OPEN 24/7', 0, 2, 24, '#ff7d8c', '"Bungee"', 'center', 400); g.restore();
  tShape(g, '#5a3a8a', gg => gg.rect(0, 1340, W, H - 1340), 5);                                  // the store floor and counter top, near
  tShape(g, '#7a5ab0', gg => gg.rect(0, 1340, W, 26), 0.01);
  glassStreaks(g, .7);
}

// ---------------------------------------------------------------- the store's lights going down (never black)
function darkness(t) {
  if (t < TL.FLICK) return 0;
  if (t < TL.DARK) { const k = Math.floor((t - TL.FLICK) / .06); return [0, .5, .1, .55, 0, .6, .3, .58][k % 8]; }
  return .62;
}
function darken(g, t, cam, sk) {
  const d = darkness(t); if (!d) return;
  const [mx, my] = toScreen(cam, sk, MAGS.x, MAGSY);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(60,40,140,${1})`; g.globalAlpha = d; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const rg = g.createRadialGradient(mx, my, 20, mx, my, 520 * cam[2]);                           // MAGS's red glow
  rg.addColorStop(0, `rgba(255,70,90,${.34 * d})`); rg.addColorStop(1, 'rgba(255,70,90,0)'); g.fillStyle = rg; g.globalCompositeOperation = 'screen'; g.fillRect(0, 0, W, H);
  g.restore();
}

// ---------------------------------------------------------------- cameras (SHOT2, Look 2)
const CAM = Object.assign({}, VMCAM, {
  INSERT: SHOT2.insert(CART.x, CART.y - 26, 150, { fill: .8, push: .05 }),                        // frame 1: the carton and its date
  MAGS_CU: [540, 300, 2.6, 2.72],                                                                  // MAGS up top, his sale tag under him
  PIP_CU: SHOT2.cu('PIP', { eyeAt: 720, push: .05 }),
  VOID: [540, 960, 1, 1],                                                                          // drawn in screen space
  OTS_RAE: SHOT2.fx('OTS_RAE', SHOT2.push(SHOT2.ots('PIP', 'RAE', { fill: .4, eyeAt: 560, shoulderX: 470, shoulderY: 1300, shoulderS: 300 }), .14)),
  RAE_MED: SHOT2.med('RAE', { eyeAt: 640, dx: 10 }),
  PEEK: SHOT2.cu('PIP', { x: PIP.x, y: CT - 25, eyeAt: 900 }),                                    // Pip's eyes over the counter
  END: SHOT2.med('RAE', { eyeAt: 960, dx: -30 }),                                                 // faces under y 780 for the card
});

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (n === 'VOID') { drawVoid(c, t); return; }
  c.fillStyle = '#1e1044'; c.fillRect(0, 0, W, H);
  const cam = CAM[n];
  applyCam(c, cam, sk, 0);
  c.drawImage(STATIC.store, 0, 0);
  drawBoardNumber(c, t, 1, 1, null);
  drawMagsHere(c, t);
  saleTag(c, t);
  drawRae(c, t);
  const ph = drawPip(c, t);
  c.drawImage(STATIC.front, 0, CT);
  drawRegister(c, false);
  const P = cartonPose(t);
  pourStream(c, t);
  if (P.who !== 'PIP' || pipY(t) < 200) drawCarton(c, P.x, P.y, P.rot);
  if (ph) for (const sx of [-1, 1]) tHand(c, ph.x + sx * 14 * u, ph.y, 8.5 * u, TOON.pip.skin, TOON.pip.skinS);    // her hands over the carton
  if (RAEHAND && (P.who === 'RAE' || P.who === 'DOWN')) tHand(c, RAEHAND.x, RAEHAND.y, 9.5 * u, TOON.rae.skin, TOON.rae.skinS);
  glassStreaks(c, .9);
  darken(c, t, cam, sk);
}
function render(t) { t = clamp(t, 0, DUR - 1e-3); drawScene(t); composeFrame(OUT, SC, t); endCard(OUT, t, 'vm'); }
window.render = render;

// ---------------------------------------------------------------- sound cues (natural sound: what we see, in the store's room)
window.EV = [
  { type: 'pickup', t: GRAB(), pan: -.3 },                                                       // Pip picks it up
  { type: 'holo', t: TL.SALE },                                                                  // 50% OFF
  ...STARS.map(s => ({ type: 'star', t: s.out, pan: (s.x - 540) / 540 * .6 })),                  // the stars go out
  { type: 'throw', t: TL.TOSS + .05, pan: -.2 },
  { type: 'catch', t: TL.CATCH, pan: .1 },
  { type: 'pour', t: TL.POUR + .22, pan: .2 },
  { type: 'sip', t: TL.SIP + .3, pan: .2 },
  { type: 'down', t: TL.POUR1 + .6, pan: .1 },                                                   // the carton goes down on the counter
  { type: 'flicker', t: TL.FLICK, pan: 0 },
  { type: 'dark', t: TL.DARK - .05, pan: 0 },
  { type: 'drop', t: TL.DIVE, pan: -.3 },                                                        // Pip drops
  { type: 'duck', t: TL.DIVE + .38, pan: -.3 },                                                  // under the counter
  { type: 'holo', t: V.L6.t + .9, g: .8 },                                                       // 99% OFF
  { type: 'sip', t: TL.SIP2 + .3, pan: .2, g: .8 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildStore();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
