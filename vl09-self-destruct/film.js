// Volt Labs, episode 8: "Invisible". Vera drinks an invisibility potion; only her lab coat (and her goggles) can be seen. It goes out
// into the street to frighten a man at the bus stop, who does not look up, calls it a nice coat and tips it a dollar; then the
// potion wears off and her face sends him running. Script: channel/scripts/VL08_invisible.md
// Lab set, cameras, rent circles: channel/brand/labkit.js; lip sync, subtitles, shots, end card: channel/brand/vmkit.js; Vera and
// Cleo: channel/brand/lab.js; walk bob: channel/brand/travel.js; the spec scan: channel/brand/inserts.js. The street set, the empty
// coat and the man at the bus stop are drawn here.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 190;
// the street (world = the frame in STREET_WIDE): the building front, the sidewalk, a long box hedge in front of the bus stop
const FLOOR = 1650, HEDGE_TOP = 1240, HEDGE_X0 = 430, WAIST = 1250, BLDG_Y = 1520, CURB = 1700;
const DOOR = { x: 145, y0: 1080, w: 170 };

// ---------------------------------------------------------------- the street set (built once)
const STREET = {};
function buildStreet() {
  const b = document.createElement('canvas'); b.width = W; b.height = H; const g = b.getContext('2d');
  g.fillStyle = '#7a3f34'; g.fillRect(0, 0, W, BLDG_Y);                                  // brick front of the lab's building
  const R = (() => { let a = 11; return () => { a = a * 16807 % 2147483647; return a / 2147483647; }; })();
  for (let r = 0, y = 0; y < BLDG_Y; r++, y += 44) for (let x = (r % 2) * -50; x < W; x += 100) {
    const v = R(); g.fillStyle = v < .33 ? '#8a4a3c' : v < .66 ? '#854638' : '#7f4335'; g.fillRect(x + 3, y + 3, 94, 38);
  }
  const vg = g.createLinearGradient(0, 0, 0, BLDG_Y); vg.addColorStop(0, 'rgba(0,0,0,.25)'); vg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = vg; g.fillRect(0, 0, W, BLDG_Y);
  for (const wy of [140, 560]) for (const wx of [400, 760]) {                            // upper-floor windows
    tShape(g, '#e8e0d0', gg => gg.rect(wx - 12, wy - 12, 224, 324), 4);
    tShape(g, '#33405e', gg => gg.rect(wx, wy, 200, 300), 3);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(wx + 18, wy + 16, 40, 260);
    tLine(g, [wx + 100, wy, wx + 100, wy + 300], 4); tShape(g, '#d9d0bf', gg => gg.rect(wx - 22, wy + 300, 244, 20), 3);
  }
  tShape(g, '#e8e0d0', gg => gg.rect(DOOR.x - DOOR.w / 2 - 18, DOOR.y0 - 30, DOOR.w + 36, BLDG_Y - DOOR.y0 + 30), 4);   // door frame
  tShape(g, '#c9c2b4', gg => gg.rect(DOOR.x - DOOR.w / 2 - 34, BLDG_Y - 24, DOOR.w + 68, 24), 3);                       // step
  g.save(); g.translate(DOOR.x + 110, DOOR.y0 + 60); tShape(g, '#efe7d5', gg => gg.roundRect(-34, -22, 68, 44, 6), 3);
  tText(g, 'B1', 0, -6, 16, TOON.ink, '"Bungee"', 'center', 400); tText(g, 'VOLT LABS', 0, 11, 10, '#3e9a5a', '"Bungee"', 'center', 400); g.restore();
  // the lab's basement window at the foot of the wall (its green light)
  tShape(g, '#2b2f3e', gg => gg.rect(262, 1408, 170, 104), 4);
  tShape(g, '#b9e88a', gg => gg.rect(274, 1420, 146, 80), 3); g.fillStyle = 'rgba(30,90,60,.35)'; g.fillRect(274, 1460, 146, 40);
  for (const bx of [310, 347, 384]) tLine(g, [bx, 1420, bx, 1500], 4);
  tShape(g, '#5b6476', gg => gg.rect(1030, 0, 24, BLDG_Y), 3);                                   // downspout
  // the sidewalk, the curb, the road
  g.fillStyle = '#b9b6ae'; g.fillRect(0, BLDG_Y, W, CURB - BLDG_Y);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, BLDG_Y, W, 10);
  g.strokeStyle = 'rgba(60,55,50,.35)'; g.lineWidth = 3; for (let x = 60; x < W; x += 210) { g.beginPath(); g.moveTo(x, BLDG_Y); g.lineTo(x - 40, CURB); g.stroke(); }
  tShape(g, '#d8d5cd', gg => gg.rect(-10, CURB, W + 20, 26), 3);
  g.fillStyle = '#3b3d45'; g.fillRect(0, CURB + 26, W, H - CURB - 26);
  g.fillStyle = '#d8c84a'; for (let x = 40; x < W; x += 260) g.fillRect(x, 1850, 140, 12);
  // the bus stop sign (behind the hedge)
  tShape(g, '#8a93ab', gg => gg.rect(992, 860, 16, BLDG_Y + 60 - 860), 3);
  tShape(g, '#2f6fb3', gg => gg.roundRect(950, 860, 100, 120, 12), 4);
  tText(g, 'BUS', 1000, 900, 26, '#fff', '"Bungee"', 'center', 400); tText(g, '42', 1000, 944, 34, '#ffd23f', '"Bungee"', 'center', 400);
  STREET.back = b;
  // the box hedge in front (drawn over the people behind it)
  const f = document.createElement('canvas'); f.width = W; f.height = H; const h = f.getContext('2d');
  const top = gg => { gg.moveTo(HEDGE_X0, CURB - 6); gg.lineTo(HEDGE_X0, HEDGE_TOP + 30); for (let x = HEDGE_X0; x <= W + 40; x += 46) gg.quadraticCurveTo(x + 23, HEDGE_TOP - 22 + (x % 3) * 6, x + 46, HEDGE_TOP + 4); gg.lineTo(W + 40, CURB - 6); gg.closePath(); };
  tShape(h, '#3f7d3c', top, 4); tShade(h, top, '#336a31', gg => gg.rect(HEDGE_X0, HEDGE_TOP + 150, W, 300));
  for (let i = 0; i < 40; i++) { const x = HEDGE_X0 + 20 + (i * 97) % (W - HEDGE_X0), y = HEDGE_TOP + 40 + (i * 53) % 260; tCurve(h, x - 12, y, x, y - 10, x + 12, y, 2.4, 'rgba(25,60,25,.6)'); }
  tShape(h, '#a9a49a', gg => gg.rect(HEDGE_X0 - 10, CURB - 120, W, 120), 4);                 // the concrete planter box
  h.fillStyle = 'rgba(0,0,0,.12)'; h.fillRect(HEDGE_X0 - 10, CURB - 120, W, 14);
  STREET.front = f;
}

// ---------------------------------------------------------------- the empty coat (allowed to float: it is the joke)
// (x, waist): the coat hangs as if a body were in it: collar round an empty neck, cuffs open and empty, a hem that sways.
// o: pose 'hang' | 'flask' | 'hips' | 'boo' | 'wave', swing (walk), sway (hem), talk (0..1, the collar twitches), goggles,
// bill (a dollar tucked in the breast pocket), floor (draw a shadow on the floor at this y)
const LINING = '#b8b0cc', LININGS = '#a59cbd';
function drawCoat(g, x, waist, s, o = {}) {
  if (o.floor) { g.save(); g.fillStyle = 'rgba(20,18,30,.28)'; g.beginPath(); g.ellipse(x, o.floor, 78 * s / 100, 14, 0, 0, 6.2832); g.fill(); g.restore(); }
  g.save(); g.translate(x, waist); g.scale(s / 100, s / 100);
  const sw = o.swing || 0, sy = o.sway || 0, tk = (o.talk || 0) * 3;
  // the inside of the coat (no body in it): the lining at the back
  const back = gg => { gg.moveTo(-58, -146); gg.lineTo(58, -146); gg.lineTo(70, 116 + sy * 4); gg.lineTo(-70, 116 - sy * 4); gg.closePath(); };
  tShape(g, LINING, back, 3.4); tShade(g, back, LININGS, gg => gg.rect(-80, -150, 160, 40));
  tShape(g, LININGS, gg => gg.ellipse(0, -150 - tk, 22, 9, 0, 0, 6.2832), 3);                    // the empty collar opening
  // sleeves (drawn after the front panels, so the empty arms always read)
  const arm = (side) => {
    const sh = [side * 62, -128], pose = o.pose || 'hang';
    let el, cuff;
    if (pose === 'flask' && side > 0) { el = [92, -112]; cuff = [66, -196]; }
    else if (pose === 'hips') { el = [side * 116, -66]; cuff = [side * 70, -30]; }        // akimbo: drawn over the panels
    else if (pose === 'boo') { el = [side * 98, -170]; cuff = [side * 96, -250]; }
    else if (pose === 'wave') { const w = Math.sin((o.t || 0) * 9 + (side > 0 ? 0 : 2)) * 26; el = [side * 100, -150]; cuff = [side * 110 + w, -222 + Math.abs(w) * .4]; }
    else { const a = sw * side * 22; el = [side * 86 + a * .3, -56]; cuff = [side * 90 + a, 26]; }
    tTube(g, [sh[0], sh[1], el[0], el[1], cuff[0], cuff[1]], 25, LAB.coat, LAB.coatS);
    const ang = Math.atan2(cuff[1] - el[1], cuff[0] - el[0]);
    g.save(); g.translate(cuff[0], cuff[1]); g.rotate(ang + Math.PI / 2);
    tShape(g, LININGS, gg => gg.ellipse(0, 0, 12, 5, 0, 0, 6.2832), 3);                          // the empty cuff
    g.restore();
    return cuff;
  };
  let cuffR = null;                                                                             // the sleeves go on last, over the panels' sides
  // the front panels, open, with the lapels; the hem sways
  const left = gg => { gg.moveTo(-26, -150 - tk); gg.bezierCurveTo(-46, -148, -68, -138, -70, -110); gg.lineTo(-72, 0); gg.lineTo(-78, 118 - sy * 5); gg.quadraticCurveTo(-46, 124 - sy * 6, -12, 116 - sy * 3); gg.lineTo(-10, -30); gg.lineTo(-30, -112); gg.closePath(); };
  const right = gg => { gg.moveTo(26, -150 - tk); gg.bezierCurveTo(46, -148, 68, -138, 70, -110); gg.lineTo(72, 0); gg.lineTo(78, 118 + sy * 5); gg.quadraticCurveTo(46, 124 + sy * 6, 12, 116 + sy * 3); gg.lineTo(10, -30); gg.lineTo(30, -112); gg.closePath(); };
  tShape(g, LAB.coat, left); tShape(g, LAB.coat, right); tShade(g, right, LAB.coatS, gg => gg.rect(40, -160, 40, 300));
  tShape(g, LAB.coat, gg => { gg.moveTo(-26, -150 - tk); gg.lineTo(-46, -128); gg.lineTo(-30, -112); gg.closePath(); }, 3.4);
  tShape(g, LAB.coatS, gg => { gg.moveTo(26, -150 - tk); gg.lineTo(46, -128); gg.lineTo(30, -112); gg.closePath(); }, 3.4);
  tShape(g, LAB.glow, gg => { gg.moveTo(-50, -100); gg.lineTo(-44, -88); gg.lineTo(-38, -100); gg.lineTo(-41, -100); gg.lineTo(-44, -94); gg.lineTo(-47, -100); gg.closePath(); }, 2.4);   // her lime V pin
  tLine(g, [44, -84, 44, -102], 4); tLine(g, [50, -84, 51, -100], 4);                          // pens in the breast pocket
  if (o.bill) { g.save(); g.translate(48, -100); g.rotate(-.2); tShape(g, '#9bc48a', gg => gg.rect(-14, -22, 28, 26), 2.4); tText(g, '1', 0, -9, 13, '#2d5a2a', '"Bungee"', 'center', 400); g.restore(); }
  for (const sx of [-1, 1]) tShape(g, null, gg => gg.rect(sx * 44 - 16, 40, 32, 30), 2.4);      // pockets
  arm(-1); cuffR = arm(1);
  if (o.flask && o.pose === 'flask') drawFlask(g, cuffR[0] - 2, cuffR[1] - 30, o.t || 0);
  // the goggles, floating where her eyes would be
  if (o.goggles !== false) {
    const gy = -222 - tk * .6;
    tLine(g, [-44, gy - 6, -52, gy - 14], 6); tLine(g, [44, gy - 6, 52, gy - 14], 6);
    tShape(g, '#4a2c1a', gg => gg.rect(-36, gy - 3, 72, 7), 2.4);
    for (const sx of [-1, 1]) { tShape(g, 'rgba(190,255,120,.85)', gg => gg.ellipse(sx * 18, gy, 17, 14, 0, 0, 6.2832), 4.4); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(sx * 18 - 6, gy - 5, 5, 3, -.4, 0, 6.2832); g.fill(); }
  }
  g.restore();
}
// the potion flask (empty, still glowing a little, a wisp of steam)
function drawFlask(g, x, y, t) {
  g.save(); g.translate(x, y);
  g.save(); g.shadowColor = '#b6ff3b'; g.shadowBlur = 24;
  tShape(g, 'rgba(200,255,150,.55)', gg => { gg.arc(0, 18, 22, 0, 6.2832); }, 3.4); g.restore();
  tShape(g, 'rgba(220,255,200,.5)', gg => gg.rect(-7, -20, 14, 22), 3);
  tShape(g, '#8a5a2a', gg => gg.rect(-8, -28, 16, 8), 2.4);
  g.save(); g.translate(0, 20); g.rotate(-.08); tShape(g, '#fbf7ff', gg => gg.rect(-20, -7, 40, 14), 2); tText(g, 'INVISIBLE', 0, 0, 6.5, TOON.ink, '"Bungee"', 'center', 400); g.restore();
  for (let i = 0; i < 2; i++) { const k = ((t * .8 + i * .5) % 1); g.strokeStyle = `rgba(230,255,220,${.6 * (1 - k)})`; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -30 - k * 40); g.quadraticCurveTo(10 * Math.sin(t * 3 + i), -40 - k * 50, -6, -54 - k * 60); g.stroke(); }
  g.restore();
}

// ---------------------------------------------------------------- the man at the bus stop (one-off): beanie, puffer jacket, scarf, phone
// waist-up behind the hedge; o: look 'phone' | 'glance' | 'scared', mouth, blink, tip 0..1 (his free hand to the coat's pocket,
// tx/ty: the pocket in his local units), run (arms up)
function drawMan(g, x, waist, s, o = {}) {
  g.save(); g.translate(x, waist); g.scale(s / 100, s / 100);
  const skin = '#e3b28c', skinS = '#c99572', jk = '#6f7d4f', jkS = '#56623c';
  const torso = gg => { gg.moveTo(-70, 30); gg.lineTo(-74, -110); gg.bezierCurveTo(-74, -142, -48, -152, -20, -156); gg.lineTo(20, -156); gg.bezierCurveTo(48, -152, 74, -142, 74, -110); gg.lineTo(70, 30); gg.closePath(); };
  tShape(g, jk, torso); tShade(g, torso, jkS, gg => gg.rect(36, -160, 50, 200));
  for (const qy of [-112, -72, -32]) tCurve(g, -72, qy, 0, qy + 8, 72, qy, 2.4, 'rgba(40,50,30,.55)');   // quilting
  tLine(g, [0, -150, 0, 30], 2.6);
  tShape(g, '#c23b3b', gg => gg.roundRect(-34, -170, 68, 24, 10), 3);                            // scarf
  tShape(g, '#c23b3b', gg => gg.roundRect(8, -156, 22, 60, 8), 3);
  // head
  const face = gg => gg.ellipse(0, -222, 46, 52, 0, 0, 6.2832);
  tShape(g, skin, face); tShade(g, face, skinS, gg => gg.ellipse(26, -212, 28, 56, 0, 0, 6.2832));
  g.save(); face(g); g.clip(); g.fillStyle = 'rgba(90,70,60,.22)'; g.fillRect(-46, -206, 92, 40); g.restore();   // stubble
  for (const sx of [-1, 1]) tShape(g, skin, gg => gg.ellipse(sx * 46, -220, 8, 12, 0, 0, 6.2832), 2.6);   // ears
  const scared = o.look === 'scared', gl = o.look === 'glance';
  for (const sx of [-1, 1]) {
    const ex = sx * 18, ey = -226;
    if (scared) { tEllipse(g, ex, ey, 12, 14, '#fbf7ff', 3); g.fillStyle = TOON.ink; g.beginPath(); g.arc(ex - 3, ey, 3.4, 0, 6.2832); g.fill(); tLine(g, [ex - sx * -4 - 10, ey - 24, ex + 10, ey - 30], 4); }
    else if (o.blink) tLine(g, [ex - 10, ey, ex + 10, ey], 3.4);
    else {
      tShape(g, '#fbf7ff', gg => gg.ellipse(ex, ey + 2, 10, 7, 0, 0, 6.2832), 2.8);
      g.fillStyle = TOON.ink; g.beginPath(); g.arc(ex + (gl ? -5 : 1), ey + (gl ? 2 : 5), 3.6, 0, 6.2832); g.fill();
      tLine(g, [ex - 11, ey - 3, ex + 11, ey - 3], 3.4);                                       // heavy lids: bored
      tLine(g, [ex - 12, ey - 16, ex + 12, ey - 15], 4);
    }
  }
  tShape(g, skinS, gg => gg.ellipse(2, -206, 7, 6, 0, 0, 6.2832), 2.2);                           // nose
  const m = o.mouth && o.mouth.a > .06 ? o.mouth.a : 0;
  if (m) talkMouth(g, 0, -184, scared ? Math.max(m, .8) : m, o.mouth.shape, .85);
  else if (scared) tEllipse(g, 0, -182, 10, 13, '#5a1430', 2.8); else tLine(g, [-12, -184, 12, -185], 3.2);
  // the beanie
  tShape(g, '#2d3a5c', gg => { gg.moveTo(-48, -236); gg.bezierCurveTo(-50, -300, 50, -300, 48, -236); gg.closePath(); }, 3.4);
  tShape(g, '#3b4a72', gg => gg.roundRect(-50, -246, 100, 18, 7), 3);
  tEllipse(g, 0, -294, 9, 8, '#c23b3b', 2.6);
  // arms: the right holds his phone up; the left hangs, or tucks a dollar into the coat's pocket, or both go up when he runs
  const skinHand = (hx, hy, open) => tHand(g, hx, hy, 10, skin, skinS, open);
  if (o.run) {
    for (const sx of [-1, 1]) { tTube(g, [sx * 62, -120, sx * 92, -160, sx * 84, -236], 24, jk, jkS); skinHand(sx * 82, -246, true); }
  } else {
    tTube(g, [62, -120, 84, -76, 52, -66, 34, -104], 24, jk, jkS);                                // phone arm, bent up
    g.save(); g.translate(30, -126); g.rotate(-.25); tShape(g, '#20222c', gg => gg.roundRect(-13, -24, 26, 46, 5), 2.6);
    g.fillStyle = 'rgba(150,210,255,.85)'; g.fillRect(-9, -19, 18, 34); g.restore();
    skinHand(32, -108);
    const k = o.tip || 0, hx = lerp(-48, o.tx || -100, k), hy = lerp(-44, o.ty || -110, k);
    tTube(g, [-62, -120, -84, -80, (-84 + hx) / 2, (-80 + hy) / 2 + 10, hx - 4, hy + 4], 24, jk, jkS);
    if (k > 0 && k < .98) { g.save(); g.translate(hx - 8, hy - 10); g.rotate(-.3); tShape(g, '#9bc48a', gg => gg.rect(-12, -16, 24, 22), 2.2); g.restore(); }   // the dollar
    skinHand(hx, hy, k > 0);
  }
  g.restore();
}

// ---------------------------------------------------------------- where everyone is
const STREET_SHOTS = new Set(['STREET_WIDE', 'COAT_CU', 'MAN_CU', 'TWO_SHOT', 'CLEO_ST']);
function coatStreet(t) {                                            // the coat on the street: stepping out of the door, walking, standing
  if (t < TL.OUT) return { x: TL.COAT_X0, moving: false, hidden: true };
  if (t < TL.ARRIVE) { const d = (t - TL.OUT) * TL.WALK_V; return { x: TL.COAT_X0 + d, moving: true, dist: d }; }
  return { x: TL.COAT_X, moving: false };
}
function manAt(t) {
  if (t < TL.RUN) return { x: TL.MAN_X, moving: false };
  const d = (t - TL.RUN) * 900; if (TL.MAN_X + d > 1400) return null;
  return { x: TL.MAN_X + d, moving: true, dist: d, run: true };
}
function cleoStreet(t) {
  if (t < TL.CWALK) return null;
  if (t < TL.CARRIVE) { const d = (t - TL.CWALK) * TL.WALK_V; return { x: TL.CLEO_X0 - d, moving: true, dist: d }; }
  return { x: TL.CLEO_X, moving: false };
}
// the potion wears off: sparkles, a flicker (hard on/off frames, never a dissolve), then she is there
function veraVisible(t) {
  if (t < TL.FIZZ + .3) return false;
  const k = t - (TL.VISIBLE - .25);
  if (k < 0) return false;
  if (k < .05) return true; if (k < .1) return false; if (k < .15) return true; if (k < .2) return false;
  return true;
}
function sparkles(g, x, y, t, t0, n = 9) {
  if (t < t0 || t > t0 + .9) return;
  const k = (t - t0) / .9;
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + t0, r = 60 + 220 * k * ((i % 3) / 3 + .5), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .9 - 60 * k;
    const sz = 16 * (1 - k) * (.6 + .4 * Math.sin(t * 20 + i));
    if (sz <= 0) continue;
    g.save(); g.translate(px, py);
    tShape(g, i % 2 ? '#e8ffc0' : '#fffbe0', gg => { gg.moveTo(0, -sz); gg.quadraticCurveTo(sz * .2, -sz * .2, sz, 0); gg.quadraticCurveTo(sz * .2, sz * .2, 0, sz); gg.quadraticCurveTo(-sz * .2, sz * .2, -sz, 0); gg.quadraticCurveTo(-sz * .2, -sz * .2, 0, -sz); gg.closePath(); }, 2);
    g.restore();
  }
}

// ---------------------------------------------------------------- the hologram scan of the empty coat (inserts.js)
function coatModel() {
  const lines = [], N = 16;
  const ring = (cx, y, rx, rz) => { for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; lines.push([cx + Math.cos(a0) * rx, y, Math.sin(a0) * rz, cx + Math.cos(a1) * rx, y, Math.sin(a1) * rz]); } };
  const ys = []; for (let y = -.85; y <= 1.25; y += .3) { ys.push(y); ring(0, y, .44 + .06 * (y + .85) / 2.1, .3); }
  for (let i = 0; i < N; i += 2) { const a = i / N * 6.2832; for (let j = 0; j < ys.length - 1; j++) { const r0 = .44 + .06 * (ys[j] + .85) / 2.1, r1 = .44 + .06 * (ys[j + 1] + .85) / 2.1; lines.push([Math.cos(a) * r0, ys[j], Math.sin(a) * .3, Math.cos(a) * r1, ys[j + 1], Math.sin(a) * .3]); } }
  for (const sx of [-1, 1]) for (let k = 0; k <= 5; k++) { const u = k / 5, cx = sx * (.5 + .14 * u), y = -.78 + 1.15 * u; ring(cx, y, .12, .12); if (k) lines.push([sx * (.5 + .14 * (u - .2)), y - .23, .12, cx, y, .12]); }
  ring(0, -.95, .2, .14);                                           // the collar: nothing above it
  for (const sx of [-1, 1]) { for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; lines.push([sx * .14 + Math.cos(a0) * .1, -1.5 + Math.sin(a0) * .08, .22, sx * .14 + Math.cos(a1) * .1, -1.5 + Math.sin(a1) * .08, .22]); } }   // the goggles
  return { lines, faces: [] };
}
const COAT3D = coatModel();
const HUDSPEC = { code: 'VOLT LABS // SPEC SCAN', title: 'DR. VERA VOLT', sub: 'AFTER ONE INVISIBILITY POTION', model: () => COAT3D, solidT: 99, lockT: .45, verdictT: 2.15, yaw0: 2.6, pitch: .35,
  parts: [{ label: 'VISIBILITY', value: '0%', p: [0, -.35, .3], side: 1 }, { label: 'COAT', value: '100%', p: [.42, .7, .3], side: -1 }, { label: 'HEAD', value: 'NOT FOUND', p: [0, -1.5, .22], side: 1 }],
  verdict: 'TOTALLY INVISIBLE' };

// ---------------------------------------------------------------- the lab: the coat at the bench, Cleo, the rent board
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
function labCoatState(t) {
  const talk = (mouthFor('VERA', t) || { a: 0 }).a;
  let pose = 'flask', x = VERA.x, moving = false, dist = 0;
  if (t > V.L3.t - .1) pose = 'hips';
  if (t > V.L3.t + 1.35) pose = 'hang';
  if (t > TL.EXIT) { dist = (t - TL.EXIT) * TL.EXIT_V; x = VERA.x + dist; moving = true; pose = 'hang'; }
  return { pose, x, moving, dist, talk };
}

// ---------------------------------------------------------------- cameras
const CAM = {
  LAB_OPEN: [VERA.x + 30, 990, 2.2, 2.05], LAB_COAT: [VERA.x + 20, 990, 2.1, 2.2], LAB_WIDE: [540, 1000, 1.18, 1.22],
  CLEO_CU: LABCAM.CLEO_CU, BOARD_END: [LBOARD.x - 40, LBOARD.y - 5, 2.75, 2.85],
  STREET_WIDE: [540, 960, 1.0, 1.03],
  COAT_CU: [TL.COAT_X + 10, 900, 2.2, 2.32], MAN_CU: [TL.MAN_X - 5, 880, 2.3, 2.42], TWO_SHOT: [735, 980, 1.62, 1.7], CLEO_ST: [TL.CLEO_X - 50, 900, 2.2, 2.3],
};

function drawStreet(t, n) {
  c.drawImage(STREET.back, 0, 0);
  // the front door: open while the coat steps out
  const open = t > TL.STREET && t < TL.OUT + .9 ? 1 : 0;
  tShape(c, open ? '#1a1520' : '#3e6b4a', gg => gg.rect(DOOR.x - DOOR.w / 2, DOOR.y0, DOOR.w, BLDG_Y - 24 - DOOR.y0), 3.4);
  if (!open) { tShape(c, '#57886a', gg => gg.rect(DOOR.x - DOOR.w / 2 + 18, DOOR.y0 + 30, DOOR.w - 36, 150), 2.6); tEllipse(c, DOOR.x + DOOR.w / 2 - 22, DOOR.y0 + 230, 7, 7, '#d8c84a', 2.4); }
  else tShape(c, '#57886a', gg => { gg.moveTo(DOOR.x - DOOR.w / 2, DOOR.y0); gg.lineTo(DOOR.x - DOOR.w / 2 - 40, DOOR.y0 + 30); gg.lineTo(DOOR.x - DOOR.w / 2 - 40, BLDG_Y - 50); gg.lineTo(DOOR.x - DOOR.w / 2, BLDG_Y - 24); gg.closePath(); }, 3);
  const showMan = n !== 'COAT_CU' && n !== 'CLEO_ST', showCoat = n !== 'MAN_CU' && n !== 'CLEO_ST', showCleo = n !== 'COAT_CU' && n !== 'MAN_CU';
  // the coat, or Vera when the potion has worn off
  const cs = coatStreet(t), talk = (mouthFor('VERA', t) || { a: 0 }).a;
  if (showCoat && !cs.hidden) {
    const vis = veraVisible(t), pose = t >= V.L8.t - .1 && t < V.L9.t ? 'wave' : t >= V.L4.t - .1 && t < V.L4.t + .9 ? 'boo' : 'hang';
    const bob = cs.moving ? walkBob(cs.dist, 150, 10) : { dy: 0, rot: 0, swing: 0 };
    const dy = cs.moving ? -6 * Math.tanh(-bob.dy / 6) : 0, sway = cs.moving ? Math.sin(cs.dist / 150 * Math.PI) : Math.sin(t * 1.3) * .3;
    const bill = t >= TL.TIP_END - .2;
    if (vis) {
      c.save(); c.beginPath(); c.rect(-200, -200, 1600, HEDGE_TOP + 300); c.clip();             // she is behind the hedge: the hedge hides her waist
      drawVera2(c, cs.x, WAIST, S, { expr: t < V.L11.t + .3 ? 'laugh' : 'fluster', goggles: true, mouth: mouthFor('VERA', t), blink: blinkAt(0, t), tube: false });
      if (bill) { c.save(); c.translate(cs.x + 48 * S / 100, WAIST - 104 * S / 100); c.rotate(-.2); tShape(c, '#9bc48a', gg => gg.rect(-14 * S / 100, -22 * S / 100, 28 * S / 100, 26 * S / 100), 2.4); c.restore(); }
      c.restore();
    } else {
      const inOpen = cs.x < HEDGE_X0 - 40;
      drawCoat(c, cs.x, WAIST + dy, S, { pose, swing: bob.swing, sway, talk, t, bill, floor: inOpen ? FLOOR : 0 });
    }
  }
  // the man (behind the hedge)
  const mp = manAt(t);
  if (showMan && mp) {
    const look = t >= V.L11.t - .25 ? 'scared' : (t > V.L7.t - .1 && t < V.L7.t + .9) || (t > V.L9.t - .1 && t < TL.TIP_END) ? 'glance' : 'phone';
    let dy = 0, rot = 0; if (mp.moving) { const bob = walkBob(mp.dist, 190, 18); dy = -6 * Math.tanh(-bob.dy / 6); rot = .1; }
    const tipK = smooth(TL.TIP, TL.TIP + .45, t) * (1 - smooth(TL.TIP_END - .25, TL.TIP_END, t));
    const pocket = [(TL.COAT_X + 48 * S / 100 - TL.MAN_X) / S * 100, (-100 * S / 100) / S * 100 - 4];
    c.save(); c.translate(mp.x, WAIST + dy); c.rotate(rot);
    drawMan(c, 0, 0, S, { look, mouth: mouthFor('MAN', t), blink: blinkAt(5, t), tip: tipK, tx: pocket[0], ty: pocket[1], run: mp.run || look === 'scared' && t > V.L11.t });
    c.restore();
  }
  // Cleo walks in from the right, behind the hedge
  const cl = cleoStreet(t);
  if (showCleo && cl) {
    let dy = 0; if (cl.moving) { const bob = walkBob(cl.dist, 150, 10); dy = -6 * Math.tanh(-bob.dy / 6); }
    drawCleo2(c, cl.x, WAIST + dy, S, { expr: 'deadpan', mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look: -1, remote: true });
  }
  c.drawImage(STREET.front, 0, 0);
  sparkles(c, TL.COAT_X, WAIST - 260, t, TL.FIZZ);
}

function drawLab(t, n) {
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindow(c, t, 0);
  drawRentCircles(c, n === 'BOARD_END' && t > TL.BOARDT + 1.3 ? 9 : 8, n === 'BOARD_END' && t > TL.BOARDT + .4 && t <= TL.BOARDT + 1.3 ? (t - TL.BOARDT - .4) / .9 : 0);
  if (n === 'BOARD_END') drawChalkArm(c, t, 8);
  drawFridge(c, 0);
  if (n !== 'BOARD_END') {
    if (n !== 'CLEO_CU') {
      const st = labCoatState(t);
      const bob = st.moving ? walkBob(st.dist, 150, 10) : { dy: 0, swing: 0 };
      const dy = st.moving ? -6 * Math.tanh(-bob.dy / 6) : 0;
      const hid = st.moving && Math.abs(st.x - CLEO.x) < 45;            // lenses wholly behind Cleo's hair: no lone strap ends either side
      drawCoat(c, st.x, LCT + dy, VERA.s, { pose: st.pose, swing: bob.swing, sway: st.moving ? Math.sin(st.dist / 150 * Math.PI) : Math.sin(t * 1.3) * .3, talk: st.talk, t, flask: true, goggles: !hid });
    }
    // Cleo after the coat: when it strides out past her it goes behind her (its goggles never sit on her face)
    if (n !== 'LAB_OPEN' && n !== 'LAB_COAT') drawCleo2(c, CLEO.x, LCT, CLEO.s, { expr: 'deadpan', mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look: t > TL.EXIT ? 1 : -1, remote: true });
  }
  c.drawImage(LAB_STATIC.front, 0, LCT);
}

function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  if (n === 'HUD') { hudScan(c, t - TL.HUD0, HUDSPEC); return; }
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  if (STREET_SHOTS.has(n)) drawStreet(t, n); else drawLab(t, n);
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  endCard(OUT, t, 'vl');   // owner 11/9 + 11/13: the cast and NEW EPISODE EVERY DAY, 2.5 s (TL.ENDCARD)
}
window.render = render;

// ---------------------------------------------------------------- sound cues (tools/mix.py): every action on its frame, in its space
const walk = (t0, x0, x1, kind, space, step = 150, sps = 1.9) => footfalls(t0, x0, x1, step, sps).map((x, i, a) => ({ type: kind, t: +x.toFixed(3), i, space, pan: Math.max(-1, Math.min(1, (x0 + (x1 - x0) * (i + 1) / a.length - 540) / 540)) }));
window.EV = [
  { type: 'fizz', t: 0 }, { type: 'fizz', t: 1.9, gdb: -4 },      // the empty flask still fizzing (frame 1)
  { type: 'cloth', t: V.L1.t + .9, gdb: -3 },                      // the empty sleeve waves the flask
  { type: 'scan', t: TL.HUD0 + .05, dur: 2.8 },                    // the hologram's read-out
  { type: 'cloth', t: V.L3.t - .1 },                               // sleeves to the hips: "Rude."
  { type: 'cloth', t: V.L3.t + 1.3, gdb: -3 },
  ...walk(TL.EXIT, VERA.x, VERA.x + 600, 'step', 'lab', 150, TL.EXIT_V / 150),   // invisible shoes on the lab floor
  { type: 'door', t: TL.STREET + .05 },                            // the building's front door
  ...walk(TL.OUT, TL.COAT_X0, TL.COAT_X, 'step', 'street'),        // invisible shoes on the sidewalk
  { type: 'cloth', t: V.L4.t - .1, gdb: 2 },                       // "Boo!": both sleeves up
  { type: 'cloth', t: V.L8.t - .1 },                               // "Fear me!": waving
  { type: 'cloth', t: V.L8.t + .45, gdb: -4 },
  { type: 'bill', t: TL.TIP + .35 },                               // the dollar tucked into the pocket
  { type: 'fizz_out', t: TL.FIZZ },                                // the potion wears off
  ...walk(TL.RUN, TL.MAN_X, TL.MAN_X + 560, 'run', 'street', 190, 900 / 190),   // he runs
  ...walk(TL.CWALK, TL.CLEO_X0, TL.CLEO_X, 'step', 'street'),     // Cleo walks in
  { type: 'chalk', t: TL.BOARDT + .4, dur: .9 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    await insFonts('../channel/brand/fonts/');
    buildLab(); buildStreet();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
