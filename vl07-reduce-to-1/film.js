// Volt Labs, episode 7: "Reduce to 1%". Vera shrinks the rent notice to 1% on her SHRINK-O-MATIC ("Not if he can't read it");
// the landlord from episode 4 comes down the stairs with a magnifying glass, reads it, and copies his own notice at 400%.
// Script: channel/scripts/VL07_reduce_to_1.md. Set, cameras, window, fridge, rent circles: channel/brand/labkit.js; lip sync,
// subtitles, shots, end card: channel/brand/vmkit.js; characters: channel/brand/lab.js; walk bob: channel/brand/travel.js.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 190, CX7 = TL.CX, VX7 = TL.VX, CPX = TL.CPX, LX7 = TL.LX, LX_OFF = TL.LX_OFF, SPX = TL.SPX;
const VFACE7 = LCT - 222 * S / 100, CFACE7 = LCT - 200 * S / 100;
const LS = 150, LHEAD = LCT - 400;                                 // the landlord's rig scale and head centre (behind the bench)
const CPY = LCT - 170;                                              // the copier's top (the feed slot)
const TRAY = { x: CPX - 140, y: LCT - 44 };                         // where copies come out (left side, towards Vera)
const DIAL = { x: CPX + 92, y: LCT - 118 };
const SCREEN = { x: CPX - 18, y: LCT - 118 };
const FLYER_WALL = { x: 560, y: 470 };
const SPECK = .085;                                                  // the 1% copy, as a scale of the notice (a fingernail)
const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// ---------------------------------------------------------------- the rent notice (local size 180 x 230), at any scale
function drawNotice(g, x, y, sc, rot = 0, o = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
  const lw = Math.max(.6, 3 / sc);
  tShape(g, '#fbfaf2', gg => gg.rect(-90, -115, 180, 230), sc < .08 ? 0 : lw);
  if (sc < .08) {                                                   // a speck: a white card with a red smudge and a dark edge
    g.strokeStyle = TOON.ink; g.lineWidth = 1.4 / sc; g.strokeRect(-90, -115, 180, 230);
    g.fillStyle = '#c2233a'; g.fillRect(-50, -30, 100, 34); g.fillStyle = '#9a98a8'; g.fillRect(-60, 40, 120, 16);
    g.restore(); return;
  }
  tText(g, 'RENT DUE', 0, -80, 30, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, '$1,200', 0, -20, 50, '#c2233a', '"Bungee"', 'center', 400);
  tText(g, 'FRIDAY', 0, 34, 30, TOON.ink, '"Bungee"', 'center', 400);
  for (let i = 0; i < 3; i++) tLine(g, [-64, 62 + i * 11, 64 - (i % 2) * 30, 62 + i * 11], 2.2 / Math.max(1, sc));
  if (!o.noStamp) {
    g.save(); g.translate(28, 96); g.rotate(-.16); g.strokeStyle = '#c2233a'; g.lineWidth = 4; g.strokeRect(-54, -15, 108, 30);
    tText(g, 'FINAL NOTICE', 0, 1, 16, '#c2233a', '"Bungee"', 'center', 400); g.restore();
  }
  g.restore();
}

// ---------------------------------------------------------------- the SHRINK-O-MATIC (a new kind of invention: an office copier)
function pctAt(t) {                                                 // the screen: 1% until his hand turns the dial, then up to 400%
  const steps = ['1%', '25%', '100%', '200%', '400%'], k = Math.floor((t - TL.DIAL0 - .15) / .15);
  return t < TL.DIAL0 + .15 ? steps[0] : steps[Math.min(4, Math.max(0, k + 1))];
}
function dialAngle(t) { return lerp(-2.2, 1.9, smooth(TL.DIAL0 + .1, TL.DIAL0 + .75, t)); }
function busyAt(t) { return (t < .55 ? 1 : 0) || (t > TL.FEED + .05 && t < TL.BLAST + .35 ? 1 : 0); }
function drawCopier(g, t) {
  const x0 = CPX - 120, busy = busyAt(t), strain = t > TL.FEED + .1 && t < TL.BLAST ? (t - TL.FEED) / (TL.BLAST - TL.FEED) : 0;
  const sh = strain > 0 ? Math.sin(t * 95) * 4 * strain : 0;
  g.save(); g.translate(sh, 0);
  tShape(g, '#2f3a44', gg => gg.roundRect(x0, CPY, 240, 172, 14), 3.6);                    // body
  tShade(g, gg => gg.roundRect(x0, CPY, 240, 172, 14), '#26303a', gg => gg.rect(x0 + 170, CPY, 80, 180));
  tShape(g, '#7fd14a', gg => gg.roundRect(x0 + 8, CPY + 8, 224, 26, 8), 3);               // acid-green feeder lid
  tShape(g, '#11161c', gg => gg.roundRect(CPX - 100, CPY - 5, 200, 11, 5), 2.6);          // the feed slot
  if (busy) { g.save(); g.globalAlpha = .55 + .35 * Math.sin(t * 40); g.fillStyle = '#d8ffb0'; g.fillRect(CPX - 96, CPY - 2, 192, 5); g.restore(); }   // the scan light
  tShape(g, '#0e1a12', gg => gg.roundRect(SCREEN.x - 64, SCREEN.y - 30, 128, 60, 6), 3);  // the screen: big digits, read on a phone
  const pc = pctAt(t);
  tText(g, pc, SCREEN.x, SCREEN.y + 3, pc.length > 3 ? 34 : pc.length > 2 ? 40 : 48, '#7dff9a', '"Bungee"', 'center', 400);
  tText(g, 'SIZE', DIAL.x, DIAL.y + 40, 11, '#c9cfdb', '"Bungee"', 'center', 400);
  tEllipse(g, DIAL.x, DIAL.y, 25, 25, '#c9cfdb', 3);                                        // the dial
  const a = dialAngle(t); tLine(g, [DIAL.x, DIAL.y, DIAL.x + Math.cos(a - Math.PI / 2) * 19, DIAL.y + Math.sin(a - Math.PI / 2) * 19], 5);
  tText(g, 'SHRINK-O-MATIC', CPX + 4, CPY + 128, 17, '#7fd14a', '"Bungee"', 'center', 400);
  g.save(); g.shadowColor = '#7dff9a'; g.shadowBlur = busy ? 16 : 0;
  tEllipse(g, CPX + 96, CPY + 150, 7, 7, busy ? '#7dff9a' : '#3d6b3a', 2.4); g.restore();   // status light
  tShape(g, '#fbf7ff', gg => { gg.arc(CPX - 92, CPY + 150, 9, Math.PI, 0); gg.lineTo(CPX - 85, CPY + 157); gg.lineTo(CPX - 99, CPY + 157); gg.closePath(); }, 2);   // skull sticker
  g.fillStyle = TOON.ink; g.beginPath(); g.arc(CPX - 95, CPY + 150, 2, 0, 6.2832); g.arc(CPX - 89, CPY + 150, 2, 0, 6.2832); g.fill();
  tShape(g, '#c9cfdb', gg => { gg.moveTo(x0 + 2, LCT - 56); gg.lineTo(TRAY.x - 10, LCT - 46); gg.lineTo(TRAY.x - 10, LCT - 38); gg.lineTo(x0 + 2, LCT - 40); gg.closePath(); }, 2.6);   // the out tray
  g.restore();
}
// paper standing in the feed slot, sliding in (clipped at the slot); f 0 = all out, 1 = all in
function feedPaper(g, f, rot = 0) {
  if (f >= 1) return;
  g.save(); g.beginPath(); g.rect(CPX - 140, 0, 280, CPY - 1); g.clip();
  drawNotice(g, CPX, CPY - 115 + 230 * f, 1, rot);
  g.restore();
}

// ---------------------------------------------------------------- the speck (Vera's 1% copy): where it is
function speckAt(t) {
  if (t < .35) return null;
  if (t < .55) { const k = (t - .35) / .2; return [lerp(TRAY.x + 4, TRAY.x - 14, k), TRAY.y - 4 - Math.sin(k * Math.PI) * 26]; }   // pops out
  return null;                                                      // from .55 it is in the tray or in her hand (veraState)
}

// ---------------------------------------------------------------- Vera
function veraState(t) {
  const blink = t < .4 ? false : blinkAt(0, t), mouth = mouthFor('VERA', t);
  let expr = 'scheme', reachR = null, hold = null, drop = 0, turn = 0;
  const L3e = endOf('L3');
  if (t < .3) {                                                     // pushing the notice into the slot
    const f = clamp((t + .3) / .6), top = CPY - 230 * (1 - f) + 6;
    reachR = { x: (CPX - 70 - VX7) / S * 100, y: (top - LCT) / S * 100 };
  } else if (t < .85) {                                             // down to the tray for the speck
    const k = smooth(.3, .7, t); reachR = { x: lerp((CPX - 70 - VX7) / S * 100, (TRAY.x - 18 - VX7) / S * 100, k), y: lerp((CPY - 2 - LCT) / S * 100, (TRAY.y - 8 - LCT) / S * 100, k) };
    if (t > .72) hold = true;
  } else if (t < V.L3.t + .85) {                                    // holding it up by her face, between finger and thumb
    const k = smooth(.85, 1.5, t), w = Math.sin(t * 3) * 2;
    reachR = { x: lerp((TRAY.x - 18 - VX7) / S * 100, 70, k), y: lerp((TRAY.y - 8 - LCT) / S * 100, -178 + w, k) }; hold = true;
    if (t > V.L1.t) expr = 'laugh';
    if (t > V.L2.t) expr = 'cool';
    if (t > V.L3.t) expr = 'scheme';
  } else if (t < V.L3.t + 1.45) {                                   // and puts it down on the bench, for him
    const k = smooth(V.L3.t + .85, V.L3.t + 1.3, t); reachR = { x: lerp(70, (SPX - VX7) / S * 100, k), y: lerp(-178, -6, k) }; hold = t < V.L3.t + 1.3;
    expr = 'scheme';
  } else if (t >= V.L5.t - .1 && t < endOf('L5') + .3) {            // "Your notice is right there."
    const k = smooth(V.L5.t - .1, V.L5.t + .3, t) * (1 - smooth(endOf('L5'), endOf('L5') + .3, t));
    reachR = { x: lerp(40, (SPX - VX7) / S * 100 + 2, k), y: lerp(-60, -30, k) };
    expr = 'scheme';
  } else {
    expr = t < TL.DOOR + .3 ? 'scheme' : t < V.L5.t ? 'cool' : t < V.L7.t ? 'scheme' : 'fluster';
    turn = t > TL.DOOR + .2 && t < V.L4.t ? .5 : 0;                // she looks round at the stairs door
  }
  if (t > TL.BLAST + .1) { drop = smooth(TL.BLAST + .15, TL.BLAST + .6, t) * 380; expr = 'fluster'; }
  return { expr, blink, mouth, reachR, tube: false, hold, drop, turn };
}
// a 4-point glint (the tiny copy catching the light: it has to read on a phone)
function glint(g, x, y, r, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate(x, y);
  tShape(g, '#fffbe0', gg => { gg.moveTo(0, -r); gg.quadraticCurveTo(r * .18, -r * .18, r, 0); gg.quadraticCurveTo(r * .18, r * .18, 0, r); gg.quadraticCurveTo(-r * .18, r * .18, -r, 0); gg.quadraticCurveTo(-r * .18, -r * .18, 0, -r); gg.closePath(); }, 2.2);
  g.restore();
}
function speckGlints(g, x, y, t, k) {
  for (const [dx, dy, r, ph] of [[-16, -16, 9, 0], [17, -10, 7, 2.1], [6, 18, 6, 4.2]]) glint(g, x + dx, y + dy, r * (.75 + .25 * Math.sin(t * 7 + ph)), k);
}
// her hand holds the speck (world position of the hand)
function veraHand(r) { return [VX7 + r.x * S / 100, LCT + r.y * S / 100]; }

// ---------------------------------------------------------------- Cleo
function cleoState(t) {
  const look = t > TL.DOOR + .2 && t < TL.BLAST ? 1.2 : t < V.L3.t ? .8 : .6;
  return { expr: 'deadpan', mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look, remote: true };
}

// ---------------------------------------------------------------- the landlord (episode 4): comb-over, thick glasses, mustard cardigan
// drawn waist-up behind the bench at (x, y = head centre); o: mood 'smug' | 'flat', mouth, mag 0..1 (the magnifying glass from his
// chest up to his eye), lens: false hides it (it is drawn in the close-up instead), reachL {x, y} (local) for the arm by the copier,
// paper (he holds his own notice in that hand), eyeLook (-1 towards Vera)
function drawLandlord7(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  const skin = '#e9b996', skinS = '#d39c78', card = '#c99a3a', cardS = '#a87d26';
  // torso: the cardigan runs down behind the bench (never ends in the air)
  const torso = gg => { gg.moveTo(-70, 380); gg.lineTo(-74, 84); gg.bezierCurveTo(-74, 54, -50, 42, -22, 40); gg.lineTo(22, 40); gg.bezierCurveTo(50, 42, 74, 54, 74, 84); gg.lineTo(70, 380); gg.closePath(); };
  tShape(g, card, torso); tShade(g, torso, cardS, gg => gg.rect(34, 40, 60, 360));
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-18, 44); gg.lineTo(0, 78); gg.lineTo(18, 44); gg.closePath(); }, 2.4);
  tLine(g, [0, 78, 0, 300], 2.4);
  for (const by of [100, 140, 180, 220]) tEllipse(g, 8, by, 4, 4, '#6b4a1c', 1.8);
  // head
  const face = gg => gg.ellipse(0, -2, 50, 54, 0, 0, 6.2832);
  tShape(g, skin, face); tShade(g, face, skinS, gg => gg.ellipse(28, 8, 30, 56, 0, 0, 6.2832));
  g.save(); face(g); g.clip(); g.fillStyle = 'rgba(80,60,60,.18)'; g.fillRect(-50, 18, 100, 40); g.restore();
  for (const [x0, x1] of [[-40, 30], [-38, 34], [-36, 36]]) tCurve(g, x0, -30 + (x1 - 30) * .8, -4, -66 + (x1 - 30), x1, -38 + (x1 - 30) * .6, 2.6, '#6b5a4a');
  for (const sx of [-1, 1]) tShape(g, '#8a7a6a', gg => gg.ellipse(sx * 50, -2, 7, 14, 0, 0, 6.2832), 2.4);
  const lk = o.eyeLook != null ? o.eyeLook : -1;
  for (const sx of [-1, 1]) {
    tEllipse(g, sx * 20, -8, 15, 13, '#f4fbff', 3.2);
    g.fillStyle = TOON.ink; g.beginPath(); g.arc(sx * 20 + lk * 4, -8, 4.2, 0, 6.2832); g.fill();
    if (o.blink) { tShape(g, skin, gg => gg.ellipse(sx * 20, -8, 14, 12, 0, 0, 6.2832), 0); tLine(g, [sx * 20 - 11, -8, sx * 20 + 11, -8], 2.6); }
    tLine(g, [sx * 32, -27, sx * 8, -24], 5.2);                      // brows: level, sure of himself
  }
  tLine(g, [-5, -8, 5, -8], 3);
  tShape(g, '#e7a07f', gg => gg.ellipse(2, 10, 9, 7, 0, 0, 6.2832), 2.4);
  const m = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0;
  if (m) talkMouth(g, 0, 30, m, o.mouth.shape, .9);
  else if (o.mood === 'smug') tCurve(g, -15, 28, 0, 34, 15, 26, 3.2, TOON.ink); else tLine(g, [-14, 30, 14, 29], 3.2);
  // the screen-left arm: his own notice, the dial, the slot
  const r = o.reachL || { x: -84, y: 170 };                       // his notice low by his side (clear of the subtitles)
  tTube(g, [-62, 70, -88, 90, (-88 + r.x) / 2 - 4, (90 + r.y) / 2 + 4, r.x + 4, r.y - 4], 24, card, cardS);
  if (o.paper) drawNotice(g, r.x - 6, r.y + 34, .34, -.08, { noStamp: false });
  tHand(g, r.x, r.y, 11, skin, skinS, true);
  // the screen-right arm: the magnifying glass, from his chest (mag 0) up to his eye (mag 1)
  const mg = o.mag || 0, lc = lerp2([30, 120], [20, -8], mg), hand = [lc[0] + 18, lc[1] + 54];
  tTube(g, [62, 70, 92, 96, (92 + hand[0]) / 2 + 8, (96 + hand[1]) / 2, hand[0] + 4, hand[1] + 4], 24, card, cardS);
  if (o.lens !== false) {
    g.save(); g.translate(lc[0], lc[1]); g.rotate(.32);
    tShape(g, '#5b3d22', gg => gg.roundRect(-6, 30, 12, 48, 5), 3);                        // handle
    g.restore();
    g.save(); g.beginPath(); g.arc(lc[0], lc[1], 32, 0, 6.2832); g.clip();
    if (mg > .9) {                                                  // his eye, three times bigger behind the lens
      g.fillStyle = skin; g.fillRect(lc[0] - 40, lc[1] - 40, 80, 80);
      g.strokeStyle = TOON.ink; g.lineWidth = 7; g.beginPath(); g.ellipse(20, -8, 40, 35, 0, 0, 6.2832); g.stroke();     // the glasses rim, magnified
      tEllipse(g, 20, -8, 30, 25, '#f4fbff', 4);
      g.fillStyle = '#3d2a1a'; g.beginPath(); g.arc(20 + lk * 9, -8, 12, 0, 6.2832); g.fill();
      g.fillStyle = TOON.ink; g.beginPath(); g.arc(20 + lk * 9, -8, 6, 0, 6.2832); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(20 + lk * 9 + 4, -12, 3, 0, 6.2832); g.fill();
      tLine(g, [-6, -36, 40, -30], 6);                              // a magnified brow
    }
    g.fillStyle = 'rgba(200,232,255,.22)'; g.fillRect(lc[0] - 40, lc[1] - 40, 80, 80);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 5; g.beginPath(); g.arc(lc[0], lc[1], 22, 3.6, 4.5); g.stroke();
    g.restore();
    g.strokeStyle = TOON.ink; g.lineWidth = 9; g.beginPath(); g.arc(lc[0], lc[1], 32, 0, 6.2832); g.stroke();
    g.strokeStyle = '#3a3546'; g.lineWidth = 5; g.beginPath(); g.arc(lc[0], lc[1], 32, 0, 6.2832); g.stroke();
  }
  tHand(g, hand[0], hand[1], 11, skin, skinS);
  g.restore();
}
// where he is: walking in from the stairs, standing, walking out
function landAt(t) {
  if (t < TL.WALKIN) return null;
  if (t < TL.ARRIVE) { const k = (t - TL.WALKIN) / (TL.ARRIVE - TL.WALKIN); return { x: lerp(LX_OFF, LX7, k), moving: true, dist: (t - TL.WALKIN) * TL.WALK_V, dir: -1 }; }
  if (t < TL.WALKOUT) return { x: LX7, moving: false };
  const T1 = TL.WALKOUT + (LX_OFF - LX7) / TL.WALK_V; if (t > T1 + .1) return null;
  return { x: lerp(LX7, LX_OFF, (t - TL.WALKOUT) / (T1 - TL.WALKOUT)), moving: true, dist: (t - TL.WALKOUT) * TL.WALK_V, dir: 1 };
}
function landState(t) {
  const mouth = mouthFor('LANDLORD', t), blink = blinkAt(3, t);
  let mag = t < TL.MAG0 + .1 ? 1 : 0, reachL = null, paper = t < TL.FEED, mood = 'smug';
  if (t > endOf('L6') && t < V.L8.t) mood = 'smug';
  if (t > V.L8.t) mag = 0;
  if (t >= TL.DIAL0 && t < TL.FEED + .35) {                         // turns the dial, then feeds his notice in
    const toDial = smooth(TL.DIAL0, TL.DIAL0 + .15, t), toSlot = smooth(TL.DIAL0 + .78, TL.FEED, t);
    const d = [(DIAL.x - LX7) / LS * 100 + 6, (DIAL.y - LHEAD) / LS * 100 + 4], sl = [(CPX + 30 - LX7) / LS * 100, (CPY - 40 - LHEAD) / LS * 100];
    const k = smooth(TL.FEED, TL.FEED + .3, t);
    reachL = { x: lerp(lerp(-84, d[0], toDial), sl[0], toSlot), y: lerp(lerp(170, d[1], toDial), sl[1], toSlot) + k * 30 };
    paper = t < TL.DIAL0 + .78 ? true : false;
  }
  return { mouth, blink, mag, reachL, paper: paper && t < TL.DIAL0 + .78, mood, eyeLook: -1 };
}

// ---------------------------------------------------------------- the 400% copy: erupts out of the tray and lands over Vera
function drapeShape(peakX, peakY) {
  return gg => { gg.moveTo(TRAY.x + 6, LCT - 44); gg.quadraticCurveTo(peakX + 190, peakY - 30, peakX + 10, peakY);
    gg.quadraticCurveTo(peakX - 200, peakY + 10, 60, LCT - 4); gg.lineTo(70, LCT + 4); gg.lineTo(TRAY.x, LCT + 4); gg.closePath(); };
}
function drawGiantCopy(g, t) {
  if (t < TL.BLAST) return;
  const kE = smooth(TL.BLAST, TL.BLAST + .32, t), kD = smooth(TL.BLAST + .26, TL.BLAST + .62, t);
  const sink = smooth(TL.BLAST + .15, TL.BLAST + .6, t);
  if (kD < 1) {                                                     // flying out: the sheet grows and swings up and over her
    g.save(); g.globalAlpha = 1 - kD;
    g.translate(TRAY.x, LCT - 50); g.rotate(lerp(.2, -.9, kE));
    drawNotice(g, -lerp(40, 330, kE), -lerp(20, 260, kE), lerp(.4, 2.9, kE), Math.PI / 2 * .15);
    g.restore();
  }
  if (kD > 0) {                                                     // draped over her: a tent of paper with the giant numbers on it
    const [peakX, peakY] = drapePeak(t), sh = drapeShape(peakX, peakY);
    g.save(); g.globalAlpha = kD;
    tShape(g, '#fbfaf2', sh, 4);
    g.save(); sh(g); g.clip();
    g.translate(peakX - 10, peakY + 170); g.rotate(-.1);
    tText(g, 'RENT DUE', 0, -60, 96, TOON.ink, '"Bungee"', 'center', 400);
    tText(g, '$1,200', 6, 60, 140, '#c2233a', '"Bungee"', 'center', 400);
    g.restore();
    for (const [a, b, cc] of [[[peakX + 6, peakY + 10], [peakX + 60, LCT - 60], [peakX + 40, peakY + 120]], [[peakX - 10, peakY + 14], [200, LCT - 30], [peakX - 70, peakY + 140]]])
      tCurve(g, a[0], a[1], cc[0], cc[1], b[0], b[1], 2.4, 'rgba(60,50,80,.45)');       // folds
    g.restore();
  }
}
function drapePeak(t) { const sink = smooth(TL.BLAST + .15, TL.BLAST + .6, t); return [VX7 - 10, lerp(VFACE7 - 170, LCT - 300, sink)]; }
// the white flag: her arm comes up out of the paper with the tiny notice
function drawFlag(g, t) {
  if (t < TL.FLAG) return;
  const rise = smooth(TL.FLAG, TL.FLAG + .35, t), wave = Math.sin((t - TL.FLAG) * 9) * 16 * smooth(TL.FLAG + .3, TL.FLAG + .5, t);
  const [px, py] = drapePeak(t), base = [px - 30, py + 40], hand = [px - 40 + wave, py + 40 - 210 * rise];
  tTube(g, [base[0], base[1], base[0] - 4, (base[1] + hand[1]) / 2, hand[0], hand[1] + 10], 40, LAB.coat, LAB.coatS);
  drawNotice(g, hand[0] + 6, hand[1] - 26, SPECK * 1.5, Math.sin((t - TL.FLAG) * 9) * .3);
  tHand(g, hand[0], hand[1], 19, LAB2.vera.skin, LAB2.vera.skinS, true);
  tShape(g, '#fbfaf2', gg => { gg.moveTo(base[0] - 30, base[1] + 6); gg.quadraticCurveTo(base[0], base[1] - 22, base[0] + 30, base[1] + 4); gg.lineTo(base[0] + 22, base[1] + 18); gg.lineTo(base[0] - 24, base[1] + 18); gg.closePath(); }, 3);   // the torn paper round her sleeve
}

// ---------------------------------------------------------------- props on the wall and shelf
function flyer(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-.03);
  tShape(g, '#f4ecd6', gg => gg.rect(-150, -200, 300, 400), 4);
  tText(g, 'HELP WANTED', 0, -150, 40, TOON.ink, '"Bungee"', 'center', 400); tText(g, '(EVIL)', 0, -100, 46, '#c2233a', '"Bungee"', 'center', 400);
  g.save(); g.translate(10, 40); g.rotate(-.25); g.strokeStyle = '#c2233a'; g.lineWidth = 8; g.strokeRect(-120, -40, 240, 80); tText(g, 'HIRED', 0, 4, 64, '#c2233a', '"Bungee"', 'center', 400); g.restore();
  g.restore();
}
function oldGauntlet(g) {                                           // episode 4's Annihilator, retired to the shelf (no comment)
  g.save(); g.translate(150, 1120); g.rotate(-.08); g.scale(.55, .55);
  tShape(g, '#2c2a36', gg => gg.roundRect(-78, -30, 110, 60, 14), 3); tShape(g, '#3a3546', gg => gg.roundRect(-10, -44, 96, 26, 8), 3);
  tShape(g, '#c84050', gg => gg.ellipse(96, -31, 7, 16, 0, 0, 6.2832), 3);
  g.restore();
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
  COPIER_OPEN: [560, 1100, 2.2, 2.05],                                // subtitles land on the bench front, not on the copier
  VERA_CU: [VX7 + 10, VFACE7 + 40, 2.45, 2.6], CLEO_CU: [CX7 + 40, CFACE7 + 80, 2.3, 2.45],   // her subtitles sit above the copier's screen
  LAND_CU: [LX7 - 30, LHEAD + 40, 2.45, 2.6],
  WIDE: [540, 990, 1.0, 1.03],
  MAG_CU: [SPX + 6, LCT - 50, 4.2, 4.5],
  DIAL_CU: [CPX + 70, LCT - 170, 2.9, 3.1],
  PILE: [380, LCT - 230, 1.6, 1.7],
  BOARD_END: [LBOARD.x - 40, LBOARD.y - 5, 2.75, 2.85],
};

// the magnifying glass in its close-up: it comes down over the speck, and only inside it can you read the notice
function magLens(t) { const k = smooth(TL.MAG0, TL.MAG0 + .55, t); return [lerp(SPX + 170, SPX, k), lerp(LCT - 280, LCT - 16, k)]; }
function drawMagCU(g, t) {
  const [lx, ly] = magLens(t), R = 54, M = 5.6, sp = [SPX, LCT - 9];
  // his arm comes in from the right edge of the close-up, to the handle
  const hx = lx + 42, hy = ly + 50, card = '#c99a3a';
  tTube(g, [SPX + 260, LCT - 230, SPX + 190, LCT - 120, hx + 30, hy + 4, hx + 6, hy + 2], 36, card, '#a87d26');
  g.save(); g.translate(lx, ly); g.rotate(-.75); tShape(g, '#5b3d22', gg => gg.roundRect(-8, R - 2, 16, 52, 6), 3); g.restore();
  tHand(g, hx, hy, 16, '#e9b996', '#d39c78');
  g.save(); g.beginPath(); g.arc(lx, ly, R, 0, 6.2832); g.clip();
  g.fillStyle = '#1b4434'; g.fillRect(lx - R, ly - R, 2 * R, 2 * R);                            // the wall behind, magnified
  g.fillStyle = '#4a5266'; g.fillRect(lx - R, ly + (LCT - ly) * M, 2 * R, 2 * R);                  // the bench top, magnified
  drawNotice(g, lx + (sp[0] - lx) * M, ly + (sp[1] - ly) * M, SPECK * M * 1.0);
  g.fillStyle = 'rgba(200,232,255,.18)'; g.fillRect(lx - R, ly - R, 2 * R, 2 * R);
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.beginPath(); g.arc(lx, ly, R - 8, 3.6, 4.5); g.stroke();
  g.restore();
  g.strokeStyle = TOON.ink; g.lineWidth = 8; g.beginPath(); g.arc(lx, ly, R, 0, 6.2832); g.stroke();
  g.strokeStyle = '#3a3546'; g.lineWidth = 4; g.beginPath(); g.arc(lx, ly, R, 0, 6.2832); g.stroke();
}

// his arm in the dial close-up: in from the right edge, turns the dial, then feeds his notice into the slot
function drawDialArm(g, t) {
  const toSlot = smooth(TL.DIAL0 + .78, TL.FEED, t), k = smooth(TL.FEED, TL.FEED + .3, t);
  const dial = [DIAL.x + 8, DIAL.y + 2], slot = [CPX + 40, CPY - 34 + k * 40];
  const h = lerp2(lerp2([DIAL.x + 120, DIAL.y + 60], dial, smooth(TL.DIAL0, TL.DIAL0 + .15, t)), slot, toSlot);
  const sh = [CPX + 330, LCT - 330];
  tTube(g, [sh[0], sh[1], (sh[0] + h[0]) / 2 + 30, (sh[1] + h[1]) / 2 + 40, h[0] + 8, h[1] + 4], 36, '#c99a3a', '#a87d26');
  tHand(g, h[0], h[1], 16, '#e9b996', '#d39c78', true);
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  const blastShake = t > TL.BLAST && t < TL.BLAST + .3 ? Math.sin(t * 90) * 9 * (1 - (t - TL.BLAST) / .3) : 0;
  applyCam(c, CAM[n], sk, blastShake);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, t, 0);
  const closing = n === 'BOARD_END' && t > TL.BOARDT + .4 && t <= TL.BOARDT + 1.3 ? (t - TL.BOARDT - .4) / .9 : 0;
  drawRentCircles(c, n === 'BOARD_END' && t > TL.BOARDT + 1.3 ? 8 : 7, closing);
  if (n === 'BOARD_END') drawChalkArm(c, t, 7);
  flyer(c, FLYER_WALL.x, FLYER_WALL.y, .42);
  drawFridge(c, 0);
  const cast = n !== 'BOARD_END';
  const showC = cast && !['VERA_CU', 'LAND_CU', 'COPIER_OPEN', 'DIAL_CU', 'MAG_CU'].includes(n);
  const showV = cast && !['CLEO_CU', 'LAND_CU', 'DIAL_CU'].includes(n);
  const showL = cast && !['VERA_CU', 'CLEO_CU', 'DIAL_CU', 'MAG_CU'].includes(n);   // close-ups show their subject only
  // Cleo
  if (showC) drawCleo2(c, CX7, LCT, S, cleoState(t));
  // Vera (sinks behind the bench under the paper)
  const vs = veraState(t);
  if (showV && vs.drop < 360) {
    c.save(); c.beginPath(); c.rect(-200, -200, 1600, LCT + 200); c.clip();
    drawVera2(c, VX7, LCT + vs.drop, S, vs);
    if (vs.hold && vs.reachR) {
      const h = veraHand(vs.reachR); drawNotice(c, h[0] + 5, h[1] - 14 + vs.drop, SPECK, -.1);
      speckGlints(c, h[0] + 5, h[1] - 14, t, smooth(.85, 1.2, t) * (1 - smooth(V.L2.t - .2, V.L2.t, t)));
    }
    c.restore();
  }
  // the landlord
  const lp = landAt(t);
  if (showL && lp) {
    const st = landState(t);
    let dy = 0;
    if (lp.moving) { const bob = walkBob(lp.dist, 150, 11); dy = -6 * Math.tanh(-bob.dy / 6); }   // the waist never rises above the bench
    drawLandlord7(c, lp.x, LHEAD + dy, LS, st);
  }
  // the copier, the notices
  if (cast) {
    drawCopier(c, t);
    if (t < .3) {
      feedPaper(c, clamp((t + .3) / .6));
      if (showV && vs.reachR) { const h = veraHand(vs.reachR); tHand(c, h[0], h[1], 9.5 * S / 100, LAB2.vera.skin, LAB2.vera.skinS); }   // her fingers on top of the paper
    }
    if (t >= TL.FEED - .3 && t < TL.FEED + .4) feedPaper(c, smooth(TL.FEED - .05, TL.FEED + .3, t) * (t < TL.FEED - .05 ? 0 : 1) + (t < TL.FEED - .05 ? .02 : 0), .03);
    const sp = speckAt(t); if (sp) { drawNotice(c, sp[0], sp[1], SPECK, (t - .35) * 8); speckGlints(c, sp[0], sp[1], t, 1); }
    if (t >= .55 && t < .72) { drawNotice(c, TRAY.x - 14, TRAY.y - 4, SPECK, .2); speckGlints(c, TRAY.x - 14, TRAY.y - 4, t, 1); }   // in the tray, before she picks it up
    if (t >= V.L3.t + 1.3 && t < TL.BLAST + .3) drawNotice(c, SPX, LCT - 7, SPECK, .06);  // on the bench, for him
  }
  c.drawImage(LAB_STATIC.front, 0, LCT);
  if (cast) { drawGiantCopy(c, t); drawFlag(c, t); }
  if (n === 'MAG_CU') drawMagCU(c, t);
  if (n === 'DIAL_CU') drawDialArm(c, t);
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  endCard(OUT, t, 'vl');   // owner 11/9 + 11/13: the cast and NEW EPISODE EVERY DAY, 2.5 s (TL.ENDCARD)
}
window.render = render;

// ---------------------------------------------------------------- sound cues (tools/mix.py): every action on its frame, in its space
const walkSteps = (t0, x0, x1, kind) => footfalls(t0, x0, x1, 150, 1.9).map((x, i, a) => ({ type: kind, t: +x.toFixed(3), i, pan: Math.min(1, (x0 + (x1 - x0) * (i + 1) / a.length - 540) / 540) }));
window.EV = [
  { type: 'copy', t: .35 - .89 },                                  // the copier is already running on frame 1; its page-out lands on the speck
  { type: 'speck', t: .52 },                                       // the 1% copy lands in the tray
  { type: 'tap', t: V.L3.t + 1.3 },                                // she sets it down on the bench
  { type: 'door', t: TL.DOOR },                                    // the stairs door, off right
  ...[0, 1, 2].map(i => ({ type: 'stair', t: TL.DOOR + .5 + i * .42, i, gdb: -4 + i * 2 })),   // down the wooden stairs
  ...walkSteps(TL.WALKIN, LX_OFF, LX7, 'step'),
  ...[0, 1, 2, 3].map(i => ({ type: 'dial', t: TL.DIAL0 + .2 + i * .15, i })),               // the dial, 1% to 400%
  { type: 'feed', t: TL.FEED - .05, gdb: -2 },
  { type: 'strain', t: TL.FEED + .08, dur: TL.BLAST - TL.FEED + .25 },                          // the copier straining
  { type: 'blast', t: TL.BLAST },                                  // the 400% copy bursts out over her
  { type: 'fall', t: TL.BLAST + .3 },                              // she goes down behind the bench under it
  ...walkSteps(TL.WALKOUT, LX7, LX_OFF, 'step'),
  ...[0, 1, 2].map(i => ({ type: 'stair', t: TL.WALKOUT + (LX_OFF - LX7) / TL.WALK_V + .3 + i * .45, i: i + 3, gdb: -6 - i * 3 })),   // back up the stairs
  { type: 'flag', t: TL.FLAG },                                    // her arm comes out of the paper
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
