// Two sets for the style study, described once and drawn by any style in engine.js.
'use strict';

const CAMS = {
  store: { wide: { x: 230, y: 360, w: 1960, h: 1102.5 }, tall: { x: 840, y: 250, w: 760, h: 1351.1 } },
  lab: { wide: { x: 230, y: 380, w: 1960, h: 1102.5 }, tall: { x: 840, y: 250, w: 760, h: 1351.1 } },
};

// ---------------- Void Mart, 3 AM ----------------
function sceneStore(P) {
  const R = mulberry32(42);
  P.opts.fog = '#5a4a9a'; P.key = { x: 1220, y: 980, r: 820 };
  // lights (world space) for the light pass
  for (const x of [300, 900, 1500, 2100]) P.light(x, 360, 620, '#dcf6ff', .32);
  P.light(1680, 820, 950, '#9b7bff', .55);       // the void through the window
  P.light(300, 880, 700, '#5ff0da', .5);         // coolers
  P.light(1560, 560, 320, '#ff5fa8', .55);       // OPEN neon
  P.light(1230, 1230, 260, '#7dffcf', .45);      // register screen
  P.light(1220, 950, 700, '#fff4e6', .35);       // key light on the clerks
  P.ray([840, 360, 960, 360, 1180, 1300, 640, 1300], '#fff1d6', .32);
  P.ray([1440, 360, 1560, 360, 1780, 1300, 1240, 1300], '#fff1d6', .32);
  P.opts.lightK = .8; P.opts.rayK = .6;

  P.layer(1, () => {
    // ceiling and back wall
    P.rect(0, 0, 2400, 410, '#1c1140', { grad: false, line: false, ht: false, cast: false, brush: true, flat: true });
    for (let x = 0; x < 2400; x += 200) P.rect(x, 0, 4, 400, '#2a1a58', { line: false, grad: false, ht: false, cast: false, brush: false, flat: true });
    for (let y = 100; y < 400; y += 100) P.rect(0, y, 2400, 4, '#2a1a58', { line: false, grad: false, ht: false, cast: false, brush: false, flat: true });
    P.rect(0, 400, 2400, 940, '#3b2474', { line: false, top: .1, bot: .2, cast: false, flat: true });
    P.rect(0, 400, 2400, 22, '#ff7a1a', { line: false, cast: false });                        // orange brand trim
    for (const x of [300, 900, 1500, 2100]) { P.round(x - 210, 330, 420, 34, 10, '#3a3560', { cast: false }); P.round(x - 196, 340, 392, 18, 9, '#ecfbff', { glow: 1, line: false, ht: false, cast: false, raw: true, brush: false }); }
    // coolers (left)
    P.rect(30, 460, 560, 840, '#2a1c52', { lineC: true });
    for (let i = 0; i < 3; i++) {
      const x = 52 + i * 180;
      P.rect(x, 480, 166, 800, '#a9efe8', { glow: .32, glowCol: '#8ff3e6', line: true, raw: true, ht: false, cast: false, detail: .5, gloss: true });
      for (let sy = 620; sy < 1280; sy += 150) {
        P.rect(x + 6, sy, 154, 8, '#5fb7b6', { line: false, ht: false, cast: false, brush: false });
        let bx = x + 12; while (bx < x + 150) { const w = 16 + R() * 14, h = 50 + R() * 50, col = ['#ff5f7a', '#ffd23f', '#5fd1ff', '#9be36a', '#ff9f3a', '#c08bff'][Math.floor(R() * 6)]; P.round(bx, sy - h, w, h, 5, col, { lw: 1.6, ht: false, cast: false, detail: .4 }); P.rect(bx + 2, sy - h * .62, w - 4, h * .22, '#fff6e8', { line: false, ht: false, cast: false, brush: false }); bx += w + 4; }
      }
      P.round(x + 140, 820, 10, 120, 5, '#d8dcef', { ht: false });
    }
    P.text('COLD', 310, 446, 30, '#9ff7ea', { glow: true });
    // shelves behind Rae
    P.rect(600, 560, 600, 760, '#2a1a55', { lineC: true });
    for (const sy of [720, 880, 1040, 1200]) {
      let bx = 616; while (bx < 1180) {
        const w = 34 + R() * 48, h = 70 + R() * 66, col = ['#ff5f7a', '#ffd23f', '#4fc3ff', '#9be36a', '#ff9f3a', '#c08bff', '#ff86ac', '#fff1de'][Math.floor(R() * 8)];
        if (bx + w > 1188) break;
        if (R() < .3) { P.ell(bx + w / 2, sy - h * .42, w / 2, h * .42, col, { lw: 1.8, detail: .5 }); }
        else { P.round(bx, sy - h, w, h, 4, col, { lw: 1.8, shadeSide: 'r', detail: .5 }); P.rect(bx + 3, sy - h * .66, w - 6, h * .24, R() < .5 ? '#fff6e8' : '#1d1240', { line: false, cast: false, ht: false, brush: false }); }
        bx += w + 6;
      }
      P.rect(600, sy, 600, 20, '#ff7a1a', { lw: 2, cast: false });
      for (let tx = 640; tx < 1180; tx += 110) P.rect(tx, sy + 4, 34, 12, '#ffe066', { line: false, cast: false, ht: false, brush: false });
    }
    // incident board
    P.round(856, 430, 350, 112, 10, '#fbf7ff', {});
    P.text('DAYS SINCE LAST INCIDENT', 1031, 462, 21, '#2a1838', { font: '"Bungee"' });
    P.round(993, 482, 76, 52, 6, '#e8364a', {});
    P.text('0', 1031, 510, 40, '#ffffff', { font: '"Bungee"' });
    // window to the void (behind Pip)
    P.rect(1236, 452, 900, 760, '#1a1238', { lineC: true });
    P.shape(g => g.rect(1256, 472, 860, 720), '#0a0520', { bb: [1256, 472, 860, 720], top: .05, bot: 0, line: false, ht: false, cast: false, brush: true, detail: .25, flat: true, raw: true });
    voidView(P, 1256, 472, 860, 720);
    P.rect(1680, 472, 16, 720, '#1a1238', { line: true, cast: false, ht: false });
    P.rect(1256, 830, 860, 14, '#1a1238', { line: true, cast: false, ht: false });
    P.text('OPEN 24/7', 1470, 560, 50, '#ff6fb1', { glow: true, glowCol: '#ff3f94', font: '"Bungee"' });
    // right wall: staff door and employee of the month
    P.rect(2180, 560, 200, 760, '#2c1a60', { lineC: true });
    P.rect(2196, 600, 168, 720, '#4a2f8e', { shadeSide: 'l' });
    P.round(2210, 660, 140, 40, 6, '#fbf7ff', {});
    P.text('STAFF ONLY', 2280, 681, 20, '#2a1838', { font: '"Bungee"' });
    P.round(2340, 900, 14, 60, 6, '#d8dcef', { ht: false });
    P.round(2176, 420, 200, 126, 8, '#c99a3a', {});
    P.rect(2192, 432, 168, 88, '#fbf7ff', { ht: false });
    P.ell(2276, 474, 30, 28, '#eef0f7', { ht: false }); P.ell(2276, 474, 9, 9, '#ff2a3a', { glow: .9, ht: false });
    P.text('EMPLOYEE OF THE MONTH', 2276, 532, 13, '#2a1838', { font: '"Bungee"' });
  });

  P.layer(.7, () => {
    // floor with perspective tiles
    P.rect(0, 1300, 2400, 520, '#2a1b52', { line: false, top: .06, bot: .18, cast: false, ht: false, flat: true });
    for (let i = -8; i <= 8; i++) { const x0 = 1200 + i * 150, x1 = 1200 + i * 420; P.poly([x0 - 2, 1300, x0 + 2, 1300, x1 + 5, 1820, x1 - 5, 1820], '#352466', { line: false, cast: false, ht: false, brush: false, flat: true }); }
    for (const y of [1340, 1400, 1490, 1620]) P.rect(0, y, 2400, 4, '#352466', { line: false, cast: false, ht: false, brush: false, flat: true });
    P.glowShape(g => g.ellipse(320, 1360, 380, 40, 0, 0, 6.2832), '#4bd8c4', .25);
    // MAGS on the ceiling
    P.rect(1636, 380, 8, 60, '#3a3560', { line: true, cast: false, ht: false });
    P.ell(1640, 470, 62, 46, '#eef0f7', { shadeSide: 'b' });
    P.rect(1580, 462, 120, 14, '#20183a', { line: false, cast: false, ht: false });
    P.ell(1640, 488, 13, 13, '#ff2a3a', { glow: 1, ht: false, cast: false, line: false });
    // wet floor sign
    P.poly([520, 1600, 570, 1420, 620, 1600], '#ffd23f', { lw: 2.6 });
    P.text('!', 570, 1530, 52, '#2a1838', { font: '"Bungee"' });
    // chip rack at the right
    P.rect(1960, 1080, 210, 520, '#ff7a1a', { shadeSide: 'r' });
    for (const sy of [1100, 1230, 1360, 1490]) for (let k = 0; k < 3; k++) { const col = ['#ffd23f', '#ff5f7a', '#4fc3ff', '#9be36a'][(k + sy / 130) % 4 | 0]; P.poly([1976 + k * 64, sy + 110, 1980 + k * 64, sy + 10, 2028 + k * 64, sy + 4, 2032 + k * 64, sy + 112], col, { lw: 1.8, shadeSide: 'r' }); }
    P.round(1980, 1040, 170, 50, 8, '#fbf7ff', {});
    P.text('SPACE CHIPS', 2065, 1066, 20, '#2a1838', { font: '"Bungee"' });
  });

  P.layer(.35, () => {
    P.char(drawRae2, 1000, 1300, 150, { expr: 'deadpan', mug: .42, look: 2 }, { rim: '#c8f2ff', rim2: '#8ff7e6', shadow: '#47308f' });
    P.char(drawPip2, 1440, 1300, 150, { expr: 'grin', look: -2 }, { rim: '#d7c8ff', rim2: '#8ff7e6', shadow: '#47308f' });
  });

  P.layer(0, () => {
    // counter
    P.rect(640, 1290, 1250, 44, '#cfc8ec', { gloss: true });
    P.rect(660, 1334, 1210, 480, '#ff7a1a', { top: .05, bot: .25 });
    P.rect(660, 1344, 1210, 16, '#20183a', { line: false });
    P.text('VOID MART', 1285, 1412, 66, '#fbf7ff', { font: '"Bungee"' });
    P.shape(g => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 13 : 30; i ? g.lineTo(1050 + Math.cos(a) * rr, 1410 + Math.sin(a) * rr) : g.moveTo(1050 + Math.cos(a) * rr, 1410 + Math.sin(a) * rr); } g.closePath(); }, '#ffd23f', { bb: [1020, 1380, 60, 60] });
    // register
    P.round(1170, 1180, 170, 110, 10, '#5b5a7a', { shadeSide: 'r' });
    P.round(1186, 1194, 138, 56, 6, '#7dffcf', { glow: .8, ht: false, raw: true, brush: false });
    P.text('$0.00', 1255, 1223, 28, '#0c4a3a', { font: '"Bungee"' });
    P.rect(1200, 1262, 110, 14, '#3a3960', { line: false });
    // donut case
    P.round(700, 1180, 190, 110, 10, '#dff7ff', { glow: .12, gloss: true, raw: true });
    for (const [dx, dy] of [[740, 1250], [800, 1250], [860, 1250], [770, 1210], [830, 1210]]) { P.ell(dx, dy, 24, 15, '#ff86ac', { lw: 1.8 }); P.ell(dx, dy - 1, 8, 5, '#dff7ff', { line: false, ht: false, cast: false, brush: false }); }
    // gum rack + penny tray
    P.round(1780, 1150, 90, 140, 8, '#4fc3ff', { shadeSide: 'r' });
    for (let k = 0; k < 4; k++) P.rect(1790, 1162 + k * 32, 70, 22, ['#ff5f7a', '#ffd23f', '#9be36a', '#fff1de'][k], { lw: 1.6 });
    P.round(1560, 1268, 120, 24, 8, '#c99a3a', {});
    P.text('TAKE A PENNY', 1620, 1310, 15, '#20183a', { font: '"Bungee"' });
  });
}

function voidView(P, x, y, w, h) {
  const R = mulberry32(7), c = P.c;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  // nebula: big soft blobs
  for (const [nx, ny, rx, ry, col, a] of [[x + w * .3, y + h * .55, 420, 260, '#7a2a9a', .55], [x + w * .72, y + h * .35, 380, 240, '#1d6a9a', .5], [x + w * .55, y + h * .7, 300, 160, '#ff4fa3', .35], [x + w * .2, y + h * .2, 260, 160, '#2fd8c8', .25]]) {
    const g = c.createRadialGradient(nx, ny, 0, nx, ny, Math.max(rx, ry)); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    c.save(); c.translate(nx, ny); c.scale(1, ry / rx); c.translate(-nx, -ny); c.fillStyle = g; c.fillRect(nx - rx, ny - rx, rx * 2, rx * 2); c.restore();
    P.glowShape(gg => gg.ellipse(nx, ny, rx * .5, ry * .5, 0, 0, 6.2832), col, a * .25);
  }
  // galaxy
  c.save(); c.translate(x + w * .7, y + h * .62); c.rotate(-.35);
  for (let i = 0; i < 260; i++) { const t = R() * 6.28 * 2.2, r = 8 + t * 22 + R() * 14, a = t + (R() < .5 ? 0 : Math.PI); c.fillStyle = `rgba(255,${200 + R() * 55 | 0},${230 + R() * 25 | 0},${.25 + R() * .5})`; c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r * .38, .8 + R() * 2.2, 0, 6.28); c.fill(); }
  const gg = c.createRadialGradient(0, 0, 0, 0, 0, 60); gg.addColorStop(0, 'rgba(255,240,220,.95)'); gg.addColorStop(1, 'rgba(255,200,240,0)'); c.fillStyle = gg; c.beginPath(); c.ellipse(0, 0, 60, 26, 0, 0, 6.28); c.fill();
  c.restore();
  P.glowShape(g => g.ellipse(x + w * .7, y + h * .62, 40, 18, -.35, 0, 6.2832), '#ffe7f4', .9);
  // stars
  for (let i = 0; i < 420; i++) { const sx = x + R() * w, sy = y + R() * h, r = R() < .93 ? .7 + R() * 1.6 : 2.4 + R() * 2.6, a = .35 + R() * .65; c.fillStyle = `rgba(255,246,236,${a})`; c.beginPath(); c.arc(sx, sy, r, 0, 6.28); c.fill(); if (r > 2.4) P.glowShape(g => g.arc(sx, sy, r * 1.6, 0, 6.28), '#fff1e0', .9); }
  // a ringed planet, and the last road sign before the edge
  c.restore();
  P.stroke(g => g.ellipse(x + w * .16, y + h * .74, 118, 26, -.25, Math.PI, 6.2832), '#ffd9a8', 6);
  P.ell(x + w * .16, y + h * .74, 64, 64, '#ff9f5a', { top: .25, bot: .35, shadeSide: 'r' });
  P.stroke(g => g.ellipse(x + w * .16, y + h * .74, 118, 26, -.25, 0, Math.PI), '#ffd9a8', 6);
  P.rect(x + w * .27 - 4, y + h * .3, 8, 160, '#8e8ab0', { cast: false });
  P.round(x + w * .27 - 110, y + h * .22, 220, 92, 10, '#1f8a4c', {});
  P.text('LAST EXIT', x + w * .27, y + h * .22 + 34, 30, '#ffffff', { font: '"Bungee"' });
  P.text('END OF UNIVERSE  0.2 MI', x + w * .27, y + h * .22 + 68, 14, '#ffffff', { font: '"Bungee"' });
}

// ---------------- Volt Labs, a basement at sunrise ----------------
function sceneLab(P) {
  const R = mulberry32(9);
  P.opts.fog = '#6a5a4a'; P.key = { x: 1220, y: 1000, r: 820 };
  P.light(1640, 520, 900, '#ffe1a8', .6);         // basement window, morning
  P.light(820, 1200, 420, '#86ff6a', .5);         // bubbling flasks
  P.light(1870, 1120, 520, '#ffbf72', .45);       // desk lamp
  P.light(2050, 860, 520, '#8dff7a', .35);        // jars on the shelf
  P.ray([1490, 610, 1810, 610, 1610, 1760, 840, 1760], '#ffe4b0', .55);

  P.layer(1, () => {
    P.rect(0, 0, 2400, 420, '#24302e', { line: false, cast: false, ht: false, flat: true });
    P.rect(0, 400, 2400, 940, '#3f5a4a', { line: false, top: .06, bot: .22, cast: false, flat: true, detail: .6 });
    // bricks
    for (let y = 420, row = 0; y < 1430; y += 46, row++) for (let x = (row % 2) * -60; x < 2400; x += 120) P.rect(x + 3, y + 3, 114, 40, jit('#4a6a56', R, 4, .05, .05), { lw: 1.4, lineCol: '#2c3e34', cast: false, ht: false, detail: .25, grad: false, flat: true });
    // pipes on the ceiling
    for (const [py, pr, col] of [[330, 22, '#b98a52'], [384, 16, '#8e9aa6']]) { P.rect(0, py - pr, 2400, pr * 2, col, { gloss: true, shadeSide: 'b', cast: false }); for (let x = 140; x < 2400; x += 420) P.rect(x, py - pr - 6, 26, pr * 2 + 12, lit(col, -.15), { cast: false }); }
    P.ell(620, 352, 26, 26, '#d8433a', { cast: false }); P.rect(612, 300, 16, 40, '#8e9aa6', { cast: false });
    // chalkboard
    P.rect(850, 430, 560, 380, '#8a5a3a', {});
    P.rect(868, 448, 524, 344, '#20382c', { top: .02, bot: .1, detail: .7 });
    for (const [t, ty] of [['1. BUILD DEATH RAY', 520], ['2. RULE THE WORLD', 610], ['3. PAY RENT', 700]]) P.text(t, 896, ty, 40, '#eef6ea', { font: '"Fredoka"', weight: 600, align: 'left' });
    for (let i = 0; i < 5; i++) P.stroke(g => g.ellipse(1012, 700, 140 + i * 4, 36 + i * 2, -.03 + i * .01, 0, 6.2832), '#ff8fb8', 4);
    P.rect(880, 780, 120, 12, '#efe8dc', { cast: false });
    // basement window: grass and sidewalk at eye level, morning sky
    P.rect(1470, 430, 360, 200, '#6a4a32', {});
    P.shape(g => g.rect(1486, 446, 328, 168), '#ffe9be', { bb: [1486, 446, 328, 168], glow: .9, glowCol: '#fff0cf', line: false, ht: false, cast: false, raw: true, detail: .4, top: .1, bot: 0 });
    P.rect(1486, 560, 328, 54, '#b9c4b0', { line: false, cast: false, ht: false, glow: .3 });
    for (let i = 0; i < 46; i++) { const gx = 1490 + i * 7.2 + R() * 3, gh = 18 + R() * 26; P.poly([gx - 3, 562, gx + (R() - .5) * 8, 562 - gh, gx + 3, 562], jit('#5fb04a', R, 8, .1, .08), { line: false, cast: false, ht: false, brush: false, flat: true }); }
    P.rect(1646, 446, 10, 168, '#6a4a32', { cast: false, ht: false });
    // a pigeon on the sill
    P.ell(1750, 618, 34, 22, '#9aa0b4', { shadeSide: 'b' }); P.ell(1776, 596, 15, 14, '#8a90a8', {}); P.ell(1781, 593, 3.2, 3.2, '#ff8a2a', { line: false, cast: false, ht: false }); P.poly([1790, 598, 1802, 601, 1790, 604], '#f0b060', { lw: 1.2, cast: false, ht: false });
    // shelf of failed inventions (right)
    P.rect(1880, 660, 520, 660, '#5a3a2a', {});
    for (const sy of [820, 1020, 1220]) {
      P.rect(1820, sy, 540, 20, '#8a5a3a', { cast: false });
      let bx = 1840; while (bx < 2330) { const w = 50 + R() * 40, h = 70 + R() * 70; if (bx + w > 2350) break; const glow = R() < .5; P.round(bx, sy - h, w, h, 10, glow ? '#8dff7a' : jit('#a8b8c8', R, 20, .2, .1), { glow: glow ? .7 : 0, raw: glow, gloss: true, lw: 2, detail: .5 }); P.rect(bx + 6, sy - h - 12, w - 12, 14, '#6a4a32', { cast: false, ht: false }); bx += w + 14; }
    }
    P.round(1860, 680, 180, 110, 12, '#c0c6d6', { shadeSide: 'r' }); P.rect(1890, 650, 120, 34, '#2a2a3a', {}); P.text('TOASTER RAY', 1950, 752, 15, '#20182a', { font: '"Bungee"' });
    // mini fridge
    P.round(110, 930, 300, 390, 16, '#e9e6f2', { shadeSide: 'r', gloss: true });
    P.rect(110, 1050, 300, 8, '#b8b4c8', { cast: false, line: false });
    P.round(370, 960, 14, 70, 6, '#8e8ab0', {});
    P.round(160, 990, 90, 40, 6, '#ffd23f', {}); P.text('MILK', 205, 1011, 18, '#20182a', { font: '"Bungee"' });
  });

  P.layer(.7, () => {
    P.rect(0, 1310, 2400, 510, '#3a3a46', { line: false, top: .1, bot: .25, cast: false, ht: false, flat: true });
    for (let i = -8; i <= 8; i++) { const x0 = 1200 + i * 160, x1 = 1200 + i * 430; P.poly([x0 - 2, 1310, x0 + 2, 1310, x1 + 4, 1820, x1 - 4, 1820], '#33333e', { line: false, cast: false, ht: false, brush: false, flat: true }); }
  });

  P.layer(.35, () => {
    P.char(drawVera2, 980, 1310, 150, { expr: 'scheme' }, { rim: '#ffe7b8', rim2: '#a6ff8a', shadow: '#3d4a7a' });
    P.char(drawCleo2, 1460, 1310, 150, { expr: 'cool', look: -2 }, { rim: '#ffe7b8', rim2: '#a6ff8a', shadow: '#3d4a7a' });
  });

  P.layer(0, () => {
    P.rect(560, 1300, 1380, 46, '#9a6a44', { gloss: true });
    P.rect(580, 1346, 1340, 470, '#5a3a2a', { top: .04, bot: .25 });
    for (const dx of [640, 1060, 1480]) { P.round(dx, 1400, 380, 150, 8, '#6e4834', { shadeSide: 'b' }); P.round(dx + 160, 1462, 60, 18, 8, '#c9a46a', {}); }
    // flasks on a burner
    P.rect(700, 1250, 180, 50, '#3a3a46', {});
    for (const [fx, fr] of [[740, 46], [836, 34]]) { P.shape(g => { g.moveTo(fx - 10, 1110); g.lineTo(fx + 10, 1110); g.lineTo(fx + 10, 1160); g.lineTo(fx + fr, 1250); g.lineTo(fx - fr, 1250); g.lineTo(fx - 10, 1160); g.closePath(); }, '#e6f6ff', { bb: [fx - fr, 1110, fr * 2, 140], gloss: true, raw: true }); P.poly([fx - fr + 6, 1244, fx + fr - 6, 1244, fx + fr * .62, 1196, fx - fr * .62, 1196], '#7dff5a', { glow: .9, raw: true, line: false, cast: false }); }
    for (let i = 0; i < 9; i++) P.ell(730 + R() * 110, 1100 - R() * 140, 4 + R() * 7, 4 + R() * 7, '#b9ff9a', { glow: .6, line: true, lw: 1.4, cast: false, ht: false, brush: false, raw: true });
    // books, blueprint, lamp
    for (let k = 0; k < 4; k++) P.rect(1600 - k * 6, 1270 - k * 26, 180, 26, ['#c84a3a', '#3a6ac8', '#e0b040', '#5aa06a'][k], { lw: 1.8 });
    P.shape(g => { g.ellipse(1180, 1284, 150, 16, 0, 0, 6.2832); }, '#a8d0ff', { bb: [1030, 1268, 300, 32] });
    P.rect(1840, 1150, 12, 150, '#2a2a36', {}); P.poly([1790, 1120, 1900, 1120, 1872, 1060, 1818, 1060], '#2a6a5a', { glow: 0 }); P.ell(1846, 1124, 40, 8, '#fff0c8', { glow: 1, raw: true, line: false });
  });
}
