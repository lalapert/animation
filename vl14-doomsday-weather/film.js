// Volt Labs, episode 14: "Doomsday Weather". On the roof, a doomsday weather machine aimed at eight billion people; Cleo brought a
// sled. The lever gives one tiny cloud; it drifts across and over the edge and snows on our back yard only (the neighbours keep
// their pool and their umbrella). "Maximum doom!": the drift rises to the roof. "Get in." "A villain does not go sledding." Smash
// cut: "Wheeeee!" down the drift. Waist-deep in the yard: "Again! Again! I mean... phase two." "Sure."
// Script: channel/scripts/VL14_doomsday_weather.md. Look 2 (TL.LOOK = 2, TL.ACT, SHOT2 cameras; vmkit.js how-to).
// Vera and Cleo: channel/brand/lab.js (unchanged); lip sync, subtitles, shots, end card: channel/brand/vmkit.js; the yard behind the
// building: channel/brand/labkit.js buildYard (snowed in here). The roof, the machine, the cloud, the drift, the sled and the view
// down are drawn here. On the roof and in the yard the parapet / the snow bank hides them from the waist down (runbook §2.2).
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const S = 190, K9 = S / 100, VX = VERA.x, CX = CLEO.x;
const loc = (x0, wx, wy) => ({ x: (wx - x0) / K9, y: (wy - LCT) / K9 });
const rnd = (s => () => (s = s * 16807 % 2147483647) / 2147483647);
const SNOW = '#f4f8ff', SNOWS = '#cfdcf0';

// Look 2 light for outdoors: the sun upper left, a warm rim, a sky-blue haze on the back sets
K2.LIGHT.vl = Object.assign({}, K2.LIGHT.vl, {
  rims: { left: [[-.7, -.72], '#fff0c4', .32], right: [[-.7, -.72], '#fff0c4', .32] },
  amb: ['#4f86c6', .04], vig: .22, haze: ['#bfe0ff', .12], shade: '#c6cfe2',
});

// ---------------------------------------------------------------- the roof (static): sky, the sun, the city, the banner
const ST = {};
function buildRoof() {
  const b = document.createElement('canvas'); b.width = W; b.height = H; const g = b.getContext('2d'), R = rnd(23);
  const sky = g.createLinearGradient(0, 0, 0, LCT); sky.addColorStop(0, '#86cbff'); sky.addColorStop(.65, '#cdeeff'); sky.addColorStop(1, '#ffe8c6');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sg = g.createRadialGradient(150, 250, 30, 150, 250, 220); sg.addColorStop(0, 'rgba(255,246,190,.9)'); sg.addColorStop(1, 'rgba(255,246,190,0)');
  g.fillStyle = sg; g.fillRect(0, 0, 500, 600); tEllipse(g, 150, 250, 62, 62, '#fff4b4', 3);
  for (let x = -30; x < W; x += 120 + R() * 70) {                                                   // the city behind the roof
    const h = 150 + R() * 260, w = 110 + R() * 70, y0 = LCT - h;
    tShape(g, ['#b9a9cc', '#ab9dc3', '#c6b8d6'][(R() * 3) | 0], gg => gg.rect(x, y0, w, h + 20), 3);
    for (let wy = y0 + 30; wy < LCT - 30; wy += 62) for (let wx = x + 18; wx < x + w - 26; wx += 40) tShape(g, R() < .25 ? '#fff2b0' : '#8f82aa', gg => gg.rect(wx, wy, 18, 26), 2);
  }
  // the water tower (far right) and a TV antenna (far left)
  for (const lx of [1000, 1060]) tLine(g, [lx, 1000, lx + (lx < 1030 ? -10 : 10), LCT], 6);
  tShape(g, '#9c6b4a', gg => gg.rect(985, 840, 95, 165), 4); for (let i = 0; i < 3; i++) tLine(g, [985, 880 + i * 40, 1080, 880 + i * 40], 2.4);
  tShape(g, '#7d5238', gg => { gg.moveTo(975, 842); gg.lineTo(1032, 800); gg.lineTo(1090, 842); gg.closePath(); }, 4);
  tLine(g, [56, 760, 56, LCT], 5); for (let i = 0; i < 3; i++) tLine(g, [22 + i * 6, 790 + i * 34, 90 - i * 6, 790 + i * 34], 3.4);
  // the banner on two poles, above their heads
  tLine(g, [118, 390, 118, LCT], 8); tLine(g, [962, 390, 962, LCT], 8);
  tShape(g, '#d8344a', gg => { gg.moveTo(132, 412); gg.lineTo(948, 412); gg.lineTo(940, 512); gg.quadraticCurveTo(540, 528, 140, 512); gg.closePath(); }, 4.4);
  tText(g, 'DOOMSDAY WEATHER MACHINE', 540, 466, 46, '#fff6e0', '"Bungee"', 'center', 400);
  for (const x of [118, 962]) tEllipse(g, x, 386, 10, 10, '#ffd23f', 3);
  if (typeof k2Haze === 'function') k2Haze(b);
  ST.roof = b;
  // the parapet: a brick wall up to their waists, a stone cap on top
  const f = document.createElement('canvas'); f.width = W; f.height = H - LCT + 40; const h = f.getContext('2d');
  h.fillStyle = '#a8604a'; h.fillRect(0, 0, W, f.height);
  for (let r = 0, y = 26; y < f.height; r++, y += 46) for (let x = (r % 2) * -55; x < W; x += 110) { h.fillStyle = R() < .5 ? '#b56c52' : '#9c5843'; h.fillRect(x + 3, y + 3, 104, 40); }
  tShape(h, '#cfc8b8', gg => gg.rect(-10, 0, W + 20, 28), 4); tLine(h, [0, 28, W, 28], 3);
  ST.front = f;
}

// ---------------------------------------------------------------- the machine: a tall riveted cabinet with a funnel on top, the
// screen (TARGET: 8 BILLION PEOPLE), the POWER gauge, the model plate (No. 14) and the lever on its left side
const MAC = { x: 450, w: 180, top: 720, piv: [482, 1140], arm: 65 };
const LV_UP = Math.atan2(-40, -51), LV_DN = Math.atan2(40, -51);
function leverK(t) {                                                   // 0 up, 1 down, 1.25 slammed past the stop
  if (t < TL.LEVER1 - .22) return 0;
  if (t < V.L7.t - .4) return smooth(TL.LEVER1 - .22, TL.LEVER1, t);
  if (t < TL.LEVER2 - .22) return 0;                                   // (it sprang back up off screen)
  return 1.25 * smooth(TL.LEVER2 - .22, TL.LEVER2, t);
}
function macShake(t) {
  let s = 0;
  if (t > TL.INS0 + .2 && t < TL.PUFF) s += 2.2 * Math.sin(t * 61);
  if (t > TL.LEVER2 && t < TL.RISE1 + .2) s += 6 * Math.sin(t * 53) * (1 - .6 * smooth(TL.LEVER2, TL.RISE1, t));
  return s;
}
function knobAt(t) { const a = lerp(LV_UP, LV_DN, leverK(t)), d = macShake(t); return [MAC.piv[0] + Math.cos(a) * MAC.arm + d, MAC.piv[1] + Math.sin(a) * MAC.arm]; }
function gaugeK(t) {
  if (t < TL.INS0 + .25) return .06;
  if (t < TL.PUFF) return lerp(.06, 1, smooth(TL.INS0 + .25, TL.INS0 + 1.3, t)) + .02 * Math.sin(t * 40);
  if (t < TL.LEVER2) return lerp(1, .12, smooth(TL.PUFF, TL.PUFF + .5, t));
  return lerp(.12, 1.16, smooth(TL.LEVER2 - .1, TL.LEVER2 + .25, t)) + .04 * Math.sin(t * 37);
}
function drawMachine(g, t) {
  const d = macShake(t), { x, w, top } = MAC, cx = x + w / 2 + d;
  g.save(); g.translate(d, 0);
  // the funnel and its mouth
  tShape(g, '#8a9bb8', gg => { gg.moveTo(x + 40, top + 4); gg.lineTo(x + w - 40, top + 4); gg.lineTo(x + w + 12, top - 128); gg.lineTo(x - 12, top - 128); gg.closePath(); });
  tShade(g, gg => { gg.moveTo(x + 40, top + 4); gg.lineTo(x + w - 40, top + 4); gg.lineTo(x + w + 12, top - 128); gg.lineTo(x - 12, top - 128); gg.closePath(); }, '#7083a3', gg => gg.rect(x + w / 2 + 30, top - 140, 120, 150));
  tEllipse(g, x + w / 2, top - 128, w / 2 + 12, 20, '#2a3248', 4);
  for (const sx of [-1, 1]) { tLine(g, [x + w / 2 + sx * 70, top - 30, x + w / 2 + sx * 112, top - 70], 4); tEllipse(g, x + w / 2 + sx * 116, top - 76, 9, 9, LAB.glow, 2.6); }
  // the cabinet
  const body = gg => gg.roundRect(x, top, w, LCT + 60 - top, 16);
  tShape(g, '#5d6f8f', body); tShade(g, body, '#4c5c7a', gg => gg.rect(x + w - 44, top - 10, 60, LCT + 80 - top));
  for (const ry of [top + 18, 1240]) for (let i = 0; i < 6; i++) tEllipse(g, x + 16 + i * (w - 32) / 5, ry, 3.6, 3.6, '#a9b5cc', 1.6);
  // the screen
  tShape(g, '#14302a', gg => gg.roundRect(x + 12, 770, w - 24, 112, 10), 4);
  const blink = Math.floor(t * 2.4) % 2 === 0;
  tText(g, 'TARGET:', x + w / 2, 794, 18, blink ? '#d8ff7a' : '#a6d45a', '"Bungee"', 'center', 400);
  tText(g, '8 BILLION', x + w / 2, 826, 25, '#d8ff7a', '"Bungee"', 'center', 400);
  tText(g, 'PEOPLE', x + w / 2, 858, 20, '#d8ff7a', '"Bungee"', 'center', 400);
  // the POWER gauge: LOW at the left, MAX (red) at the right
  const gx = x + w / 2, gy = 990, gr = 56;
  tShape(g, '#f4f1e6', gg => { gg.moveTo(gx - gr, gy); gg.arc(gx, gy, gr, Math.PI, 2 * Math.PI); gg.closePath(); }, 3.4);
  g.save(); g.strokeStyle = '#e0413a'; g.lineWidth = 10; g.beginPath(); g.arc(gx, gy, gr - 9, Math.PI * 1.8, Math.PI * 2); g.stroke(); g.restore();
  for (let i = 0; i <= 5; i++) { const a = Math.PI * (1 + i / 5); tLine(g, [gx + Math.cos(a) * (gr - 4), gy + Math.sin(a) * (gr - 4), gx + Math.cos(a) * (gr - 16), gy + Math.sin(a) * (gr - 16)], 2.4); }
  tText(g, 'POWER', gx, gy + 22, 15, '#f4f1e6', '"Bungee"', 'center', 400);
  tText(g, 'LOW', gx - gr + 8, gy - 12, 10, TOON.ink, '"Bungee"', 'center', 400); tText(g, 'MAX', gx + gr - 12, gy - 12, 10, '#e0413a', '"Bungee"', 'center', 400);
  const na = Math.PI * (1 + clamp(gaugeK(t), 0, 1.2));
  tLine(g, [gx, gy, gx + Math.cos(na) * (gr - 10), gy + Math.sin(na) * (gr - 10)], 5); tEllipse(g, gx, gy, 7, 7, '#e0413a', 2.6);
  // the model plate and a snowflake badge
  tShape(g, '#d6b25a', gg => gg.roundRect(x + 26, 1040, w - 52, 30, 5), 2.6);
  tText(g, 'MODEL No. 14', x + w / 2, 1056, 15, TOON.ink, '"Bungee"', 'center', 400);
  flake(g, x + w / 2 + 34, 1160, 24, '#e9f6ff', 4);
  // the lever: a slot plate, the rod, the red knob (her hand goes over the knob)
  tShape(g, '#3a4660', gg => gg.roundRect(MAC.piv[0] - 18, MAC.piv[1] - 56, 36, 112, 12), 3);
  g.restore();
  const [kx, ky] = knobAt(t);
  tLine(g, [MAC.piv[0] + d, MAC.piv[1], kx, ky], 9); tLine(g, [MAC.piv[0] + d, MAC.piv[1], kx, ky], 4, '#c9cfdb');
  tEllipse(g, MAC.piv[0] + d, MAC.piv[1], 9, 9, '#7a8090', 3);
  tEllipse(g, kx, ky, 15, 15, '#e0413a', 3.4);
  // the funnel's puffs: a little one when the cloud comes out, a big cough at "Maximum doom!"
  puffs(g, t, TL.PUFF, cx, top - 140, .7, 3);
  puffs(g, t, TL.LEVER2 + .05, cx, top - 150, 1.4, 6);
}
function flake(g, x, y, r, col, lw = 3) {
  g.save(); g.lineCap = 'round';
  for (const [w, cl] of [[lw + 3.4, TOON.ink], [lw, col]]) { g.lineWidth = w; g.strokeStyle = cl; g.beginPath();
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r; g.moveTo(x, y); g.lineTo(ex, ey);
      const mx = x + Math.cos(a) * r * .6, my = y + Math.sin(a) * r * .6; for (const s of [-1, 1]) { g.moveTo(mx, my); g.lineTo(mx + Math.cos(a + s * .8) * r * .3, my + Math.sin(a + s * .8) * r * .3); } }
    g.stroke(); }
  g.restore();
}
function puffs(g, t, t0, x, y, k, n) {                                // grey puffs rising and fading for 0.7 s
  const u = (t - t0) / .7; if (u < 0 || u > 1) return;
  g.save(); g.globalAlpha = 1 - u;
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * .5; drawCloud(g, x + Math.cos(a) * 60 * k * u, y + Math.sin(a) * 70 * k * u - 20 * u, (14 + 10 * u) * k, '#d9dee6'); }
  g.restore();
}

// ---------------------------------------------------------------- the cloud (one tiny cloud; it grows a little in the yard)
function drawCloud(g, x, y, r, col = '#c3cad6') {
  const P = [[-.95, .2, .5], [-.35, -.25, .72], [.4, -.15, .64], [.95, .22, .46], [0, .3, .55]];
  const path = () => { g.beginPath(); for (const [dx, dy, rr] of P) { g.moveTo(x + dx * r + rr * r, y + dy * r); g.arc(x + dx * r, y + dy * r, rr * r, 0, 6.2832); } };
  g.save(); path(); g.lineWidth = 8; g.strokeStyle = TOON.ink; g.lineJoin = 'round'; g.stroke(); g.fillStyle = col; g.fill();
  g.clip(); g.fillStyle = 'rgba(70,84,112,.22)'; g.fillRect(x - 2 * r, y + .25 * r, 4 * r, 2 * r);
  g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(x - .4 * r, y - .55 * r, .35 * r, .16 * r, -.3, 0, 6.2832); g.fill();
  g.restore();
}
function cloudOnRoof(t) {                                             // {x, y, r} or null
  if (t < TL.PUFF || t > TL.DRIFT1) return null;
  if (t < TL.DRIFT0) { const k = smooth(TL.PUFF, TL.PUFF + .45, t); return { x: 540 + 6 * Math.sin(t * 2.1), y: 590 - 40 * k + 5 * Math.sin(t * 2.9), r: 34 * (.3 + .7 * k) }; }
  const u = ease((t - TL.DRIFT0) / (TL.DRIFT1 - TL.DRIFT0)), P = [[540, 550], [820, 520], [990, 760], [1000, 1420]];
  const b = (i) => (1 - u) ** 3 * P[0][i] + 3 * (1 - u) ** 2 * u * P[1][i] + 3 * (1 - u) * u * u * P[2][i] + u ** 3 * P[3][i];
  return { x: b(0), y: b(1), r: 34 };
}
function flakes(g, t, x0, x1, y0, y1, n, seed, v = 110, r = 5, a = 1) {
  const R = rnd(seed); g.save(); g.globalAlpha = a;
  for (let i = 0; i < n; i++) {
    const bx = x0 + R() * (x1 - x0), ph = R(), sp = v * (.75 + .5 * R()), y = y0 + (((ph * (y1 - y0) + t * sp) % (y1 - y0)) + (y1 - y0)) % (y1 - y0);
    const x = bx + 14 * Math.sin(t * 1.4 + i * 1.7), rr = r * (.7 + .6 * R());
    g.fillStyle = 'rgba(40,50,80,.35)'; g.beginPath(); g.arc(x, y + 1.5, rr + 1.5, 0, 6.2832); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, rr, 0, 6.2832); g.fill();
  }
  g.restore();
}

// ---------------------------------------------------------------- the drift: it rises from the yard to the roof at "Maximum doom!"
const driftK = t => smooth(TL.RISE0, TL.RISE1, t);
function driftTop(x, t) { const k = driftK(t); return lerp(H + 120, 1250, k) + 10 * Math.sin(x * .021 + 1) + 7 * Math.sin(x * .053); }
function drawDrift(g, t) {
  const k = driftK(t); if (k <= 0) return;
  const path = gg => { gg.moveTo(-20, H + 200); for (let x = -20; x <= W + 20; x += 20) gg.lineTo(x, driftTop(x, t)); gg.lineTo(W + 20, H + 200); gg.closePath(); };
  tShape(g, SNOW, path, 4.4);
  g.save(); g.beginPath(); path(g); g.clip(); g.fillStyle = SNOWS; for (let i = 0; i < 9; i++) { const x = 60 + i * 120, y = driftTop(x, t) + 130 + (i % 3) * 120; g.beginPath(); g.ellipse(x, y, 70, 14, 0, 0, 6.2832); g.fill(); } g.restore();
  if (t < TL.RISE1 + .4) {                                            // puffs off the top while it rises
    g.save(); g.globalAlpha = .9 * (1 - smooth(TL.RISE1 - .1, TL.RISE1 + .4, t));
    for (let i = 0; i < 10; i++) { const x = 50 + i * 108, y = driftTop(x, t) - 18 - 22 * Math.abs(Math.sin(t * 6 + i)); drawCloud(g, x, y, 22 + 6 * Math.sin(i * 2.3), SNOW); }
    g.restore();
  }
}

// ---------------------------------------------------------------- the sled: a red plastic toboggan with CLEO on it. Local frame:
// the bottom end at (0, 0), the curl at (0, -340); width 84; rot 0 = standing up; rot -PI/2 = lying flat toward the left
function sledShape(g) {
  tShape(g, '#e23b3b', gg => { gg.moveTo(-42, 0); gg.lineTo(-42, -300); gg.quadraticCurveTo(-42, -344, 0, -346); gg.quadraticCurveTo(42, -344, 42, -300); gg.lineTo(42, 0); gg.closePath(); }, 4);
  tShade(g, gg => { gg.moveTo(-42, 0); gg.lineTo(-42, -300); gg.quadraticCurveTo(-42, -344, 0, -346); gg.quadraticCurveTo(42, -344, 42, -300); gg.lineTo(42, 0); gg.closePath(); }, '#b92a2f', gg => gg.rect(18, -350, 30, 360));
  tShape(g, '#ffd0c8', gg => gg.roundRect(-30, -326, 60, 16, 8), 2.4);   // the curl's edge
  g.save(); g.translate(0, -150); g.rotate(-Math.PI / 2); tText(g, 'CLEO', 0, 2, 34, '#fff6e0', '"Bungee"', 'center', 400); g.restore();
  for (const sx of [-1, 1]) tEllipse(g, sx * 30, -260, 4, 4, '#3a2a2a', 1.6);
  tCurve(g, -30, -260, 0, -214, 30, -260, 3, '#e9d9a8');                // the rope
}
function sledRoof(t) {                                                 // {x, y (bottom end), rot, sq, grip (along)}
  const lift = t > TL.LIFT && t < TL.LIFT + .75 ? 30 * Math.sin(Math.PI * clamp((t - TL.LIFT) / .75)) : 0;
  const k = smooth(TL.LAY0, TL.LAY1, t);
  return { x: lerp(668, 724, k), y: lerp(1300, 1240, k) - lift, rot: lerp(-.2, -Math.PI / 2, k), sq: lerp(1, .42, k), grip: lerp(150, 70, k) };   // leaning toward the machine, so it reads
}
function drawSledAt(g, p) { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(p.sq, 1); sledShape(g); g.restore(); }
function gripAt(p) { return [p.x + p.grip * Math.sin(p.rot), p.y - p.grip * Math.cos(p.rot)]; }   // a point on the sled's axis

// ---------------------------------------------------------------- who does what
function veraState(t) {
  const o = { expr: 'scheme', mouth: mouthFor('VERA', t), blink: blinkAt(0, t), tube: false };
  const lever = () => { const [kx, ky] = knobAt(t); o.reachR = loc(VX, kx, ky); };
  if (t < V.L2.t) lever();                                            // frame 1: her hand on the lever
  else if (t < V.L3.t) { o.expr = 'cool'; lever(); }                 // "I brought a sled."
  else if (t < TL.PUFF) { o.expr = 'scheme'; lever(); }              // "This is DOOM." (the lever)
  else if (t < TL.DRIFT0) { o.expr = t < V.L4.t ? 'scheme' : 'fluster'; lever(); }   // one tiny cloud
  else if (t < TL.DOWN0) { o.expr = 'fluster'; o.turn = .5 * smooth(TL.DRIFT0, TL.DRIFT0 + .6, t); }   // it drifts across and away
  else if (t < V.L6.t) { o.expr = 'fluster'; o.point = smooth(V.L5.t + .4, V.L5.t + .7, t); }   // "Not the yard! The PLANET!"
  else if (t < V.L7.t) o.expr = 'fluster';                            // "It's a start."
  else if (t < TL.RISE0) { o.expr = 'scheme'; lever(); }              // "Maximum doom!"
  else if (t < V.L9.t) { o.expr = 'scheme'; if (t < TL.RISE1) lever(); }
  else if (t < TL.SLOPE0) { o.expr = 'cool'; o.turn = -.45; }         // "A villain does not go sledding."
  else if (t < TL.LAND) { o.expr = 'laugh'; o.cheer = true; }         // "Wheeeee!"
  else if (t < TL.COOL) { o.expr = 'laugh'; o.cheer = t > TL.LAND + .45; }   // "Again! Again!"
  else { o.expr = 'cool'; o.turn = t < V.L12.t ? -.35 : 0; }          // "I mean... phase two."
  return o;
}
function cleoState(t) {
  const o = { expr: 'deadpan', mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), remote: false };
  if (t < TL.SLOPE0) { const [gx, gy] = gripAt(sledRoof(t)); o.reachL = loc(CX, gx, gy); }   // her hand on the sled the whole time on the roof
  if (t >= TL.PUFF && t < TL.DRIFT0) o.look = -1;                     // at the tiny cloud
  if (t >= TL.DRIFT0 && t < TL.DOWN0) o.turn = .4 * smooth(TL.DRIFT0 + .1, TL.DRIFT0 + .7, t);
  return o;
}
// the drift's line clips everyone on the roof (they stand in it from "Maximum doom!" on); the parapet hides the waists before
function clipAbove(g, t) {
  g.beginPath(); g.moveTo(-200, -400);
  for (let x = -200; x <= W + 200; x += 20) g.lineTo(x, Math.min(LCT, driftTop(clamp(x, -20, W + 20), t)));
  g.lineTo(W + 200, -400); g.closePath(); g.clip();
}
function drawRoof(t) {
  c.drawImage(ST.roof, 0, 0);
  drawMachine(c, t);
  const sp = sledRoof(t);
  if (t < TL.LAY0 + .3) drawSledAt(c, sp);                            // standing: behind her arm, its foot behind the parapet
  c.drawImage(ST.front, 0, LCT);
  drawDrift(c, t);
  if (t >= TL.LAY0 + .3) drawSledAt(c, sp);                           // lying on the drift
  c.save(); clipAbove(c, t);
  drawVera2(c, VX, LCT, S, veraState(t));
  drawCleo2(c, CX, LCT, S, cleoState(t));
  const cl = cloudOnRoof(t); if (cl) drawCloud(c, cl.x, cl.y, cl.r);
  c.restore();
}

// ---------------------------------------------------------------- the view down from the roof: three back yards, snow in ours only
function buildDown() {
  const b = document.createElement('canvas'); b.width = W; b.height = H; const g = b.getContext('2d'), R = rnd(41);
  g.fillStyle = '#79c46b'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { const x = R() * W, y = 250 + R() * 1700; tLine(g, [x, y, x - 3, y - 10], 2); }
  g.fillStyle = 'rgba(30,60,40,.25)'; g.fillRect(0, 200, W, 110);                // the building's shadow at its foot
  // left yard: a kiddie pool with a flamingo float, a lounge chair
  tEllipse(g, 170, 930, 118, 92, '#4fa6e8', 4.4); tEllipse(g, 170, 930, 100, 76, '#8fe0ff', 3);
  for (let i = 0; i < 3; i++) tCurve(g, 110 + i * 30, 900 + i * 22, 140 + i * 30, 890 + i * 22, 170 + i * 30, 900 + i * 22, 2.4, '#e8fbff');
  tEllipse(g, 200, 960, 34, 22, '#ff8fb8', 3.4); tEllipse(g, 200, 960, 14, 8, '#8fe0ff', 2); tTube(g, [226, 950, 238, 926, 232, 908], 9, '#ff8fb8'); tEllipse(g, 236, 902, 9, 7, '#ff8fb8', 2.6);
  tShape(g, '#fff6e0', gg => gg.roundRect(80, 1180, 120, 250, 14), 3.4); for (let i = 0; i < 5; i++) tShape(g, '#3fb6a8', gg => gg.rect(86, 1196 + i * 48, 108, 22), 0.01);
  // right yard: a beach umbrella (from above), a towel, a little grill
  tShape(g, '#f6c552', gg => gg.roundRect(820, 1180, 150, 260, 10), 3); for (let i = 0; i < 4; i++) tLine(g, [830, 1210 + i * 60, 960, 1210 + i * 60], 6, '#e07a3a');
  tEllipse(g, 980, 1560, 44, 44, '#4a4a55', 3.4); for (let i = -1; i <= 1; i++) tLine(g, [950, 1560 + i * 14, 1010, 1560 + i * 14], 2.4, '#9a9aa8');
  g.save(); g.translate(905, 960);
  for (let i = 0; i < 8; i++) tShape(g, i % 2 ? '#ffffff' : '#e8443c', gg => { gg.moveTo(0, 0); gg.arc(0, 0, 128, i * Math.PI / 4, (i + 1) * Math.PI / 4); gg.closePath(); }, 3);
  tEllipse(g, 0, 0, 9, 9, '#f6c552', 2.4); g.restore();
  // ours (the middle): the laundry line, the trash cans, the old ray
  tLine(g, [390, 640, 690, 640], 3); for (const x of [450, 600]) tShape(g, '#f4f1fb', gg => gg.rect(x - 34, 636, 68, 84), 3);
  for (const x of [430, 520]) { tEllipse(g, x, 1460, 40, 40, '#8a93ab', 3.4); tEllipse(g, x, 1460, 26, 26, '#6c7590', 2.4); }
  tShape(g, '#5f6a82', gg => gg.roundRect(560, 1120, 140, 56, 12), 3.4); tEllipse(g, 700, 1148, 26, 26, '#ff8fb8', 3);
  // the fences between the yards and at the back
  for (const fx of [350, 730]) { tShape(g, '#c98f5a', gg => gg.rect(fx - 9, 260, 18, 1660), 3); for (let y = 300; y < H; y += 120) tEllipse(g, fx, y, 13, 13, '#a9733f', 2.4); }
  tShape(g, '#c98f5a', gg => gg.rect(-10, 1700, W + 20, 18), 3);
  g.fillStyle = '#6aae5d'; g.fillRect(0, 1722, W, 200);
  // the parapet's top at the top of the frame (we lean over it)
  g.fillStyle = '#a8604a'; g.fillRect(0, 0, W, 190);
  for (let r = 0, y = 0; y < 150; r++, y += 46) for (let x = (r % 2) * -55; x < W; x += 110) { g.fillStyle = R() < .5 ? '#b56c52' : '#9c5843'; g.fillRect(x + 3, y + 3, 104, 40); }
  tShape(g, '#cfc8b8', gg => gg.rect(-10, 140, W + 20, 60), 4);
  if (typeof k2Haze === 'function') k2Haze(b, ['#bfe0ff', .08]);
  ST.down = b;
}
function drawDown(t) {
  c.drawImage(ST.down, 0, 0);
  const k = smooth(TL.SNOW0, TL.SNOW0 + 1.3, t);                    // our yard goes white
  if (k > 0) {
    c.save(); c.beginPath(); c.rect(359, 205, 362, 1495); c.clip(); c.globalAlpha = k;
    c.fillStyle = SNOW; c.fillRect(359, 205, 362, 1495);
    c.fillStyle = SNOWS; for (const [x, y, rx] of [[430, 1460, 46], [520, 1460, 46], [630, 1148, 80], [520, 680, 120], [480, 1000, 60], [620, 1320, 50]]) { c.beginPath(); c.ellipse(x, y + 10, rx, rx * .4, 0, 0, 6.2832); c.fill(); }
    c.restore();
  }
  flakes(c, t, 380, 700, 600, 1690, 46, 7, 140, 6, smooth(TL.SNOW0 - .3, TL.SNOW0, t));
  drawCloud(c, 540 + 8 * Math.sin(t * 1.7), 520 + 6 * Math.sin(t * 2.3), 74);
  c.drawImage(ST.down, 0, 0, W, 205, 0, 0, W, 205);                  // the parapet stays in front
}

// ---------------------------------------------------------------- the slope: the drift from the roof down to the yard, side on
const SL0 = 300, SLY = 520, SLG = .58, SLA = Math.atan(SLG);
const slopeY = x => x < SL0 ? SLY : SLY + (x - SL0) * SLG;
function buildSlope() {
  const b = document.createElement('canvas'); b.width = W; b.height = H; const g = b.getContext('2d'), R = rnd(57);
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#86cbff'); sky.addColorStop(1, '#ffe8c6'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let x = 380; x < W; x += 110 + R() * 60) { const h = 200 + R() * 220, w = 100 + R() * 60; tShape(g, ['#b9a9cc', '#c6b8d6'][(R() * 2) | 0], gg => gg.rect(x, 1180 - h, w, h + 600), 3); }
  // the building: its back wall and the roof's parapet, the machine on top
  g.save(); g.beginPath(); g.rect(0, SLY + 10, SL0, H); g.clip(); g.fillStyle = '#9a5a46'; g.fillRect(0, 0, SL0, H);
  for (let r = 0, y = SLY + 10; y < H; r++, y += 44) for (let x = (r % 2) * -50; x < SL0; x += 100) { g.fillStyle = R() < .5 ? '#a8634d' : '#8f533f'; g.fillRect(x + 3, y + 3, 94, 38); }
  g.restore(); tShape(g, null, gg => gg.rect(-10, SLY + 10, SL0 + 10, H), 4);
  tShape(g, '#5d6f8f', gg => gg.roundRect(110, 330, 90, 200, 10), 4); tShape(g, '#8a9bb8', gg => { gg.moveTo(128, 334); gg.lineTo(182, 334); gg.lineTo(214, 262); gg.lineTo(96, 262); gg.closePath(); }, 4);
  tShape(g, '#14302a', gg => gg.roundRect(122, 360, 66, 44, 6), 3);
  tShape(g, '#d8344a', gg => gg.rect(20, 210, 260, 40), 3.4); tText(g, 'DOOMSDAY WEATHER MACHINE', 150, 231, 15, '#fff6e0', '"Bungee"', 'center', 400);
  tLine(g, [20, 210, 20, 520], 5); tLine(g, [280, 210, 280, 520], 5);
  // the drift, from the parapet's top down to past the yard
  const dp = gg => { gg.moveTo(-10, SLY); for (let x = -10; x <= W + 20; x += 20) gg.lineTo(x, slopeY(x) + 4 * Math.sin(x * .05)); gg.lineTo(W + 20, H + 20); gg.lineTo(-10, H + 20); gg.closePath(); };
  tShape(g, SNOW, dp, 4.4);
  g.save(); g.beginPath(); dp(g); g.clip(); g.fillStyle = SNOWS; for (let i = 0; i < 14; i++) { const x = R() * W, y = slopeY(x) + 60 + R() * 900; g.beginPath(); g.ellipse(x, y, 60 + R() * 60, 12, -SLA, 0, 6.2832); g.fill(); } g.restore();
  for (const [x, dy] of [[760, 30], [900, 18], [1040, 26]]) { tShape(g, '#c98f5a', gg => { gg.moveTo(x - 22, slopeY(x) + 30); gg.lineTo(x - 22, slopeY(x) - dy); gg.lineTo(x, slopeY(x) - dy - 18); gg.lineTo(x + 22, slopeY(x) - dy); gg.lineTo(x + 22, slopeY(x) + 30); gg.closePath(); }, 3); tEllipse(g, x, slopeY(x) - dy - 16, 20, 8, SNOW, 2.4); }   // fence tops poke out
  if (typeof k2Haze === 'function') k2Haze(b, ['#bfe0ff', .08]);
  ST.slope = b;
}
function rideX(t) { const u = clamp((t - TL.SLOPE0) / (TL.LAND - TL.SLOPE0)); return lerp(170, 1190, Math.pow(u, 1.55)); }
function drawSlope(t) {
  c.drawImage(ST.slope, 0, 0);
  const x = rideX(t), y = slopeY(x), th = SLA * smooth(SL0 - 60, SL0 + 60, x);
  // the spray behind the sled
  for (let i = 0; i < 12; i++) { const dt = i * .04, xb = rideX(t - dt) - 150 * Math.cos(th), age = dt / .5; if (t - dt < TL.SLOPE0) break;
    c.save(); c.globalAlpha = .9 * (1 - age); drawCloud(c, xb - 30 * age, slopeY(xb) - 20 - 60 * age, 14 + 26 * age, SNOW); c.restore(); }
  c.save(); c.translate(x, y - 2); c.rotate(th);
  drawCleo2(c, -62, -34, 86, { expr: 'deadpan', mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), remote: false });
  drawVera2(c, 56, -34, 86, { expr: 'laugh', mouth: mouthFor('VERA', t), blink: false, cheer: true });
  // the sled, side on: a long red body with tall sides, the curl at the front
  tShape(c, '#e23b3b', gg => { gg.moveTo(-140, -64); gg.lineTo(130, -64); gg.quadraticCurveTo(178, -66, 178, -110); gg.quadraticCurveTo(206, -60, 168, -10); gg.quadraticCurveTo(150, 0, 120, 0); gg.lineTo(-140, 0); gg.closePath(); }, 4.4);
  tShade(c, gg => gg.rect(-140, -64, 330, 64), '#b92a2f', gg => gg.rect(-150, -24, 360, 30));
  tText(c, 'CLEO', -6, -32, 30, '#fff6e0', '"Bungee"', 'center', 400);
  tCurve(c, 150, -80, 120, -40, 90, -62, 3, '#e9d9a8');
  c.restore();
}

// ---------------------------------------------------------------- the yard: snowed in (only ours), the cloud still over it
function buildYardSnow() {
  const b = document.createElement('canvas'); b.width = W; b.height = H; const g = b.getContext('2d');
  g.fillStyle = '#86cbff'; g.fillRect(0, 0, W, H);
  g.drawImage(YARD.img, -1000, -300);
  for (let x = 0; x < YARD.w; x += 64) { const sx = x + 32 - 1000; if (sx < -40 || sx > W + 40) continue; tEllipse(g, sx, 806, 30, 11, SNOW, 2.6); }   // caps on the fence
  for (const y of [882, 1092]) tShape(g, SNOW, gg => gg.roundRect(-10, y, W + 20, 12, 6), 2.4);
  for (const x of [700, 800]) tShape(g, SNOW, gg => { gg.moveTo(x - 4, 1110); gg.quadraticCurveTo(x + 40, 1076, x + 84, 1110); gg.closePath(); }, 2.6);
  tEllipse(g, 500, 598, 16, 8, SNOW, 2.4); tShape(g, SNOW, gg => gg.roundRect(118, 652, 124, 14, 7), 2.4);
  const gp = gg => { gg.moveTo(-10, 1176); for (let x = -10; x <= W + 10; x += 30) gg.lineTo(x, 1170 + 9 * Math.sin(x * .03)); gg.lineTo(W + 10, H + 10); gg.lineTo(-10, H + 10); gg.closePath(); };
  tShape(g, SNOW, gp, 4);
  // the old ray, half buried in the snow at the right
  g.save(); g.translate(990, 1180); g.rotate(-.12); tShape(g, '#5f6a82', gg => gg.roundRect(-90, -30, 150, 56, 14), 3.4); tShape(g, '#d9873a', gg => gg.roundRect(-60, -38, 14, 70, 5), 2.4); tEllipse(g, 74, -2, 26, 26, '#ff8fb8', 3); g.restore();
  tShape(g, SNOW, gg => gg.ellipse(990, 1214, 140, 34, 0, 0, 6.2832), 3.4);
  if (typeof k2Haze === 'function') k2Haze(b, ['#bfe0ff', .1]);
  ST.yard = b;
}
const fallK = (t, t0, d = .3) => clamp((t - t0) / d);
function drawYardScene(t) {
  c.drawImage(ST.yard, 0, 0);
  flakes(c, t, 420, 680, 600, 1300, 34, 13, 120, 5.5);
  const kv = fallK(t, TL.LAND), kc = fallK(t, TL.LAND + .08), ks = fallK(t, TL.LAND + .3, .28);
  const dyV = -1200 * (1 - kv) ** 2, dyC = -1200 * (1 - kc) ** 2;
  // the sled, stuck upright between them (it lands after them, with a wobble)
  const wob = ks >= 1 ? .1 * Math.exp(-(t - TL.LAND - .58) * 5) * Math.sin((t - TL.LAND - .58) * 22) : 0;
  c.save(); c.translate(545, 1320 - 1300 * (1 - ks) ** 2); c.rotate(.08 + wob); sledShape(c); c.restore();
  drawVera2(c, VX, LCT + dyV, S, veraState(t));
  drawCleo2(c, CX, LCT + dyC, S, cleoState(t));
  // the snow bank in front of them
  const bank = gg => { gg.moveTo(-10, H + 10); for (let x = -10; x <= W + 10; x += 20) gg.lineTo(x, LCT - 12 + 9 * Math.sin(x * .027 + .6) + 5 * Math.sin(x * .071)); gg.lineTo(W + 10, H + 10); gg.closePath(); };
  tShape(c, SNOW, bank, 4.4);
  c.save(); c.beginPath(); bank(c); c.clip(); c.fillStyle = SNOWS; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(70 + i * 140, LCT + 120 + (i % 3) * 140, 80, 14, 0, 0, 6.2832); c.fill(); } c.restore();
  for (const [t0, x] of [[TL.LAND + .3, VX], [TL.LAND + .38, CX], [TL.LAND + .58, 545]]) {   // the snow flies up where they land
    const u = (t - t0) / .6; if (u < 0 || u > 1) continue;
    c.save(); c.globalAlpha = 1 - u;
    for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6; drawCloud(c, x + Math.cos(a) * 150 * u, LCT - 20 + Math.sin(a) * 120 * u, 26 + 20 * u, SNOW); }
    c.restore();
  }
  drawCloud(c, 545 + 10 * Math.sin(t * 1.5), 560 + 6 * Math.sin(t * 2.2), 92);   // the cloud, a little bigger now (in the medium, over her)
}

// ---------------------------------------------------------------- cameras (SHOT2, Look 2): [centre x, centre y, zoom at start, at end]
const cam = (x, y, z0, z1) => [clamp(x, 540 / z0, 1080 - 540 / z0), y, z0, z1];
const CAM = {
  OPEN: cam(540, 960, 1.02, 1.06),                                       // frame 1: the machine, its banner and screen; Cleo's sled
  CLEO_CU: SHOT2.cu('CLEO', { eyeAt: 760, push: .04 }),
  VERA_MED: SHOT2.med('VERA', { dx: 60, eyeAt: 660 }),
  INSERT: SHOT2.insert(540, 905, 230, { fill: .82, push: .05 }),          // the screen and the POWER needle
  WIDE: cam(540, 980, 1.02, 1.05),
  DOWN: [540, 960, 1.0, 1.05],                                           // the view down (drawn in screen space)
  OTS_CLEO: SHOT2.fx('OTS_CLEO', SHOT2.ots('CLEO', 'VERA', { fill: .36, eyeAt: 700, shoulderX: 430, shoulderY: 1400, shoulderS: 280 })),
  VERA_PUSH: SHOT2.push(SHOT2.cu('VERA', { eyeAt: 760 }), .14),          // the biggest punchline
  SLOPE: [540, 960, 1.0, 1.0],
  YARD_VERA: SHOT2.med('VERA', { dx: 40, eyeAt: 700 }),
  END: SHOT2.two('VERA', 'CLEO', { eyeAt: 1030 }),                        // faces under y 780 for the card
};

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#86cbff'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, 0);
  if (n === 'DOWN') return drawDown(t);
  if (n === 'SLOPE') return drawSlope(t);
  if (t >= TL.LAND) return drawYardScene(t);
  drawRoof(t);
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
window.EV = [
  { type: 'hum', t: 0, dur: TL.SLOPE0, pan: 0 },                                   // the machine idles on the roof
  { type: 'cloth', t: TL.LIFT - .05, gdb: -6, pan: panX(CX) },                      // she lifts the sled a little
  { type: 'sled_tap', t: TL.LIFT + .72, gdb: -4, pan: panX(665) },                   // and sets it down
  { type: 'cloth', t: TL.LEVER1 - .3, gdb: -4, pan: panX(VX) },
  { type: 'lever', t: TL.LEVER1, pan: panX(430) },                                  // "This is DOOM."
  { type: 'whir', t: TL.LEVER1 + .05, dur: TL.PUFF - TL.LEVER1 + .1, pan: 0 },       // the wind-up (the needle to MAX)
  { type: 'puff', t: TL.PUFF, gdb: -4, pan: 0 },                                     // one tiny cloud
  { type: 'breeze', t: TL.DRIFT0, pan: .4 },                                         // it drifts across and over the edge
  { type: 'cloth', t: V.L5.t + .4, gdb: -6, pan: panX(VX) },                         // she points: "The PLANET!"
  { type: 'cloth', t: V.L7.t + .05, gdb: -6, pan: panX(VX) },                        // the lever again
  { type: 'lever', t: TL.LEVER2, gdb: 3, pan: panX(430) },                           // "Maximum doom!"
  { type: 'whir', t: TL.LEVER2, dur: TL.RISE1 - TL.LEVER2 + .2, gdb: 4, pan: 0 },
  { type: 'puff', t: TL.LEVER2 + .05, gdb: 2, pan: 0 },
  { type: 'rumble', t: TL.RISE0, pan: 0 },                                           // the drift comes up to the roof
  { type: 'cloth', t: TL.LAY0, gdb: -4, pan: panX(CX) },
  { type: 'crunch', t: TL.LAY1 - .05, pan: panX(560) },                              // the sled down on the snow
  { type: 'slide', t: TL.SLOPE0, dur: TL.LAND - TL.SLOPE0, pan: 0 },                 // down the drift
  { type: 'poof', t: TL.LAND + .3, pan: panX(VX) },                                  // they land, waist-deep
  { type: 'poof', t: TL.LAND + .38, gdb: -2, pan: panX(CX) },
  { type: 'poof', t: TL.LAND + .58, gdb: -5, pan: 0 },                               // the sled sticks in between
  { type: 'cloth', t: TL.LAND + .45, gdb: -6, pan: panX(VX) },                       // arms up: "Again! Again!"
  { type: 'cloth', t: TL.COOL, gdb: -6, pan: panX(VX) },                             // arms down: "I mean..."
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    buildRoof(); buildDown(); buildSlope(); buildYard(); buildYardSnow();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
