// Volt Labs, episode 4: "Laser Pointer". The doomsday laser bought with the rent money is a cat toy. Script: channel/scripts/VL04_laser_pointer.md
// Deterministic: render(t) draws frame t; window.EV lists the sound cues. Set, cameras, pigeons, cats: channel/brand/labkit.js;
// lip sync, subtitles, shots: channel/brand/vmkit.js; characters: channel/brand/lab.js; the spec scan: channel/brand/inserts.js.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const SC = document.createElement('canvas'); SC.width = W; SC.height = H;
const c = SC.getContext('2d', { alpha: false });
const DUR = TL.DUR; window.DUR = DUR;
const V = Object.fromEntries(TL.VO.map(v => [v.id, v]));
const endOf = k => V[k].t + V[k].dur;
const PIV = { x: RAY.bx, y: RAY.by }, BLEN = 250;                 // the Annihilator's pivot (on the old ray tripod) and barrel length
const LEVER = { x: 446, y: LCT + 6 };                             // the big lever on the bench
const GRIP = { x: 476, y: 944 };                                  // where Vera grabs the cannon to swing it
const BEAKERS = [{ x: 880, c: '#7ef0ff' }, { x: 918, c: '#ff5fa2' }, { x: 952, c: '#b6ff3b' }];
const FLYER_WALL = { x: 560, y: 470 };                            // Cleo's old flyer, pinned up in episode 3
const smooth = (a, b, t) => ease(clamp((t - a) / (b - a)));
const arc = (p0, p1, h, k) => [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k) - Math.sin(k * Math.PI) * h];

// ---------------------------------------------------------------- the red dot: one path for the whole film (world coordinates)
const DOTP = {
  win: [712, 446], wall: [660, 560], shelf: [930, 1150], head: [300, 700],
};
function dotAt(t) {
  if (t < TL.PEW) return null;
  const shake = (a, f = 1) => [Math.sin(t * 31) * a * f, Math.cos(t * 23) * a * f];
  if (t < V.L5.t) return DOTP.win;
  if (t < TL.CATIN) { const [dx, dy] = shake(7); return [DOTP.win[0] + dx, DOTP.win[1] + dy]; }          // her hands shake: "warming up"
  if (t < TL.CATIN + 1.2) { const k = smooth(TL.CATIN + .1, TL.CATIN + 1.1, t); return [lerp(DOTP.win[0], DOTP.wall[0], k), lerp(DOTP.win[1], DOTP.wall[1], k)]; }
  if (t < TL.POUNCE + .35) { const w = Math.sin(t * 9) * 10; return [DOTP.wall[0] + w, DOTP.wall[1] + Math.cos(t * 7) * 6]; }
  if (t < TL.POUNCE + 1.1) { const k = smooth(TL.POUNCE + .35, TL.POUNCE + 1.0, t); return [lerp(DOTP.wall[0], DOTP.shelf[0], k), lerp(DOTP.wall[1], DOTP.shelf[1], k)]; }
  if (t < TL.POUNCE + 1.45) return DOTP.shelf;
  if (t < TL.POUNCE + 2.2) { const k = smooth(TL.POUNCE + 1.45, TL.POUNCE + 2.1, t); return [lerp(DOTP.shelf[0], DOTP.head[0], k), lerp(DOTP.shelf[1], DOTP.head[1], k) - Math.sin(k * Math.PI) * 220]; }
  if (t < TL.FLOOD) return [DOTP.head[0] + Math.sin(t * 3) * 4, DOTP.head[1]];
  if (t < TL.PILE) { const u = t - TL.FLOOD; return [640 + Math.sin(u * 4.1) * 260 + Math.sin(u * 9.3) * 60, 640 + Math.cos(u * 3.3) * 120]; }   // swung everywhere
  return null;                                                                                            // the pile and the board draw their own
}
const barrelAng = t => { const d = dotAt(t); if (!d) return t < TL.CHARGE ? -1.18 : -1.255; return Math.atan2(d[1] - PIV.y, d[0] - PIV.x); };

// ---------------------------------------------------------------- props
function drawAnnihilator(g, t, ang, o = {}) {
  const { x: bx, y: by } = PIV, ch = o.charge || 0, sheet = o.sheet ?? 0;
  for (const dx of [-120, 0, 120]) tLine(g, [bx, by + 30, bx + dx, LCT + 10], 10);
  tShape(g, '#3a3546', gg => gg.roundRect(bx - 52, by - 6, 104, 64, 10), 4);
  g.save(); g.translate(bx, by); g.rotate(ang);
  const bp = gg => gg.roundRect(-70, -52, BLEN + 30, 104, 26);
  tShape(g, '#2c2a36', bp); tShade(g, bp, '#1d1b25', gg => gg.rect(-70, 18, BLEN + 40, 40));
  for (let i = 0; i < 4; i++) { g.save(); g.shadowColor = '#ff3344'; g.shadowBlur = 8 + 40 * ch; tShape(g, `rgb(${150 + 100 * ch | 0},30,44)`, gg => gg.roundRect(-30 + i * 46, -58, 14, 116, 5), 3); g.restore(); }
  // skull sticker on the side
  g.save(); g.translate(BLEN * .55, 0); g.rotate(-ang * .0 + Math.PI / 2); tShape(g, '#fbf7ff', gg => { gg.arc(0, -2, 14, Math.PI, 0); gg.lineTo(10, 10); gg.lineTo(-10, 10); gg.closePath(); }, 2.2);
  g.fillStyle = TOON.ink; g.beginPath(); g.arc(-5, -2, 3.4, 0, 6.2832); g.arc(5, -2, 3.4, 0, 6.2832); g.fill(); g.restore();
  // muzzle: a flared cone and a red glass lens
  tShape(g, '#3a3546', gg => { gg.moveTo(BLEN - 20, -52); gg.lineTo(BLEN + 34, -70); gg.lineTo(BLEN + 34, 70); gg.lineTo(BLEN - 20, 52); gg.closePath(); });
  g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 16 + 70 * ch;
  tShape(g, `rgb(${200 + 55 * ch | 0},${40 + 60 * ch | 0},${60 + 40 * ch | 0})`, gg => gg.ellipse(BLEN + 38, 0, 16, 60, 0, 0, 6.2832), 3.4); g.restore();
  g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(BLEN + 34, -26, 4, 12, 0, 0, 6.2832); g.fill();
  // the grip at the back
  tShape(g, '#5f6a82', gg => gg.roundRect(-96, -16, 34, 32, 8), 3);
  g.restore();
  g.save(); g.translate(bx, by - 16); g.rotate(-.05); tShape(g, '#fff6c8', gg => gg.rect(-74, -14, 148, 28), 2.6); tText(g, 'THE ANNIHILATOR', 0, 1, 13, TOON.ink, '"Bungee"', 'center', 400); g.restore();
  // the sheet, yanked up and away at the start
  if (sheet < 1) {
    const k = ease(sheet), dy = -k * 900, rot = -k * .7;
    g.save(); g.translate(bx + k * 120, by - 120 + dy); g.rotate(rot);
    tShape(g, '#e9e4f4', gg => { gg.moveTo(-170, 260); gg.quadraticCurveTo(-200, 40, -90, -140); gg.quadraticCurveTo(0, -230, 110, -150); gg.quadraticCurveTo(220, 40, 180, 260); gg.quadraticCurveTo(120, 240, 60, 268); gg.quadraticCurveTo(0, 246, -60, 268); gg.quadraticCurveTo(-120, 244, -170, 260); gg.closePath(); });
    tShade(g, gg => { gg.moveTo(-170, 260); gg.quadraticCurveTo(-200, 40, -90, -140); gg.quadraticCurveTo(0, -230, 110, -150); gg.quadraticCurveTo(220, 40, 180, 260); gg.closePath(); }, '#cfc8e0', gg => gg.rect(60, -240, 200, 520));
    g.restore();
  }
}
function drawLever(g, k) {
  tShape(g, '#3a3546', gg => gg.roundRect(LEVER.x - 30, LEVER.y - 26, 60, 26, 6), 3.4);
  const a = lerp(-.55, .75, k), L = 96, ex = LEVER.x + Math.sin(a) * L, ey = LEVER.y - 18 - Math.cos(a) * L;
  tLine(g, [LEVER.x, LEVER.y - 18, ex, ey], 9);
  tEllipse(g, ex, ey, 16, 16, '#ff3355', 3);
  return [ex, ey];
}
function drawBeakers(g, t) {
  BEAKERS.forEach((b, i) => {
    const t0 = TL.POUNCE + 1.15 + i * .05, k = clamp((t - t0) / .7);
    const x = b.x + (k > 0 ? k * (120 + i * 60) : 0), y = LCT + 6 - (k > 0 ? Math.sin(k * Math.PI) * (120 + i * 30) - k * k * 300 : 0), rot = k * (3 + i * 2);
    if (k >= 1) return;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.save(); g.shadowColor = b.c; g.shadowBlur = 12; tShape(g, 'rgba(230,255,240,.3)', gg => { gg.moveTo(-8, -64); gg.lineTo(8, -64); gg.lineTo(8, -40); gg.lineTo(22, -2); gg.lineTo(-22, -2); gg.lineTo(-8, -40); gg.closePath(); }, 3); g.restore();
    tShape(g, b.c, gg => { gg.moveTo(-15, -22); gg.lineTo(15, -22); gg.lineTo(20, -5); gg.lineTo(-20, -5); gg.closePath(); }, 2.4);
    g.restore();
  });
  // glass bits after the crash
  const tc = TL.POUNCE + 1.2;
  if (t > tc && t < tc + 1.4) for (let i = 0; i < 10; i++) {
    const u = (t - tc), x = 900 + Math.cos(i * 1.7) * u * (160 + i * 18), y = LCT - 30 - Math.sin(i * 2.3 + 1) * 160 * u + 420 * u * u;
    if (y > LCT + 20) continue; g.save(); g.globalAlpha = 1 - u / 1.4; g.fillStyle = ['#7ef0ff', '#ff5fa2', '#b6ff3b', '#e6fff4'][i % 4]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 4); g.lineTo(x + 2, y + 10); g.closePath(); g.fill(); g.restore();
  }
}
function flyer(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-.03);
  tShape(g, '#f4ecd6', gg => gg.rect(-150, -200, 300, 400), 4);
  tText(g, 'HELP WANTED', 0, -150, 40, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, '(EVIL)', 0, -100, 46, '#c2233a', '"Bungee"', 'center', 400);
  tText(g, 'LAB ASSISTANT', 0, -42, 28, TOON.ink); tText(g, 'NO QUESTIONS', 0, -6, 28, TOON.ink);
  g.save(); g.translate(10, 40); g.rotate(-.25); g.strokeStyle = '#c2233a'; g.lineWidth = 8; g.strokeRect(-120, -40, 240, 80); tText(g, 'HIRED', 0, 4, 64, '#c2233a', '"Bungee"', 'center', 400); g.restore();
  g.restore();
}

// ---------------------------------------------------------------- the window: outside, cats at the glass, the pane
const WIN13 = (() => {                                            // 13 faces (the hidden number): 5 + 5 + 3
  const furs = ['ginger', 'black', 'tux', 'grey', 'calico', 'white'], out = [];
  for (let r = 0; r < 3; r++) for (let i = 0; i < (r < 2 ? 5 : 3); i++) out.push({ x: 680 + i * 65 + (r === 2 ? 65 : 0) + (r % 2) * 8, y: 262 + r * 58, fur: furs[(r * 5 + i * 2 + 1) % 6], ph: (r * 5 + i) * .37 });
  return out;
})();
function drawWindowCats(g, t) {
  const Wn = LWIN, x0 = Wn.x - Wn.w / 2, y0 = Wn.y - Wn.h / 2;
  const open = t >= TL.FLOOD - .1 ? 1 : (t > TL.CATIN && t < TL.CATIN + 1.2 ? Math.sin(clamp((t - TL.CATIN) / 1.2) * Math.PI) * .9 : 0);
  drawWindow(g, t, open);
  g.save(); g.beginPath(); g.rect(x0, y0, Wn.w, Wn.h); g.clip();
  if (t >= TL.WIN1 - .1 && t < TL.CATIN + .35) {                  // the first cat: face at the glass, pupils growing
    const k = smooth(TL.WIN1 + .2, TL.WIN1 + 1.2, t), up = smooth(TL.WIN1 - .1, TL.WIN1 + .25, t);
    drawCatPressed(g, 886, 346 + (1 - up) * 120, 58, { fur: 'ginger', pupil: .15 + .85 * k, squish: 1, look: .5 });
  }
  if (t >= TL.WIN2 - .1 && t < TL.FLOOD + .4) {
    WIN13.forEach((f, i) => { const up = smooth(TL.WIN2 - .1 + i * .04, TL.WIN2 + .2 + i * .04, t); drawCatPressed(g, f.x, f.y + (1 - up) * 140 + Math.sin(t * 3 + f.ph) * 2, 27, { fur: f.fur, pupil: 1, squish: .8 }); });
  }
  g.restore();
  if (t >= TL.WIN1 - .1 && t < TL.FLOOD) {                       // glass over them again (tint, glare)
    const ph = Wn.h * (1 - .85 * clamp(open));
    g.save(); g.globalAlpha = .55; tShape(g, 'rgba(200,235,255,.22)', gg => gg.rect(x0, y0, Wn.w, ph), 0); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 + 30, y0 + ph * .2); g.lineTo(x0 + 70, y0 + ph * .2 - 30); g.stroke();
    tLine(g, [Wn.x, y0, Wn.x, y0 + ph], 4);                       // the mullion, in front of them
  }
}

// ---------------------------------------------------------------- the first cat (ginger), through the whole film
const P_BENCH = [720, LCT + 12], P_UP = [668, 640], P_RIGHT = [905, LCT + 12], P_HEAD = [306, 748];
function gingerState(t) {
  const C = TL.CATIN, P = TL.POUNCE;
  if (t < C + .25) return null;
  if (t < C + 1.0) { const k = clamp((t - C - .25) / .75); const [x, y] = arc([800, 420], P_BENCH, 120, k); return { x, y, pose: 'run', dir: -1, rot: lerp(-.5, .5, k), phase: k, pupil: 1 }; }
  if (t < P) { const w = (t - C - 1.0) * 2.6; return { x: P_BENCH[0], y: P_BENCH[1], pose: 'crouch', dir: -1, wiggle: w, pupil: 1, look: -1 }; }
  if (t < P + .55) { const k = clamp((t - P) / .55); const [x, y] = arc(P_BENCH, P_UP, 60, k); return { x, y, pose: 'run', dir: -1, rot: lerp(.5, -.1, k), phase: k * 1.5, pupil: 1 }; }
  if (t < P + 1.15) { const k = clamp((t - P - .55) / .6); const [x, y] = arc(P_UP, P_RIGHT, 80, k); return { x, y, pose: 'run', dir: 1, rot: lerp(-.3, .6, k), phase: k * 2, pupil: 1 }; }
  if (t < P + 1.75) return { x: P_RIGHT[0], y: P_RIGHT[1], pose: 'crouch', dir: -1, wiggle: (t - P) * 3, pupil: 1, look: -1 };
  if (t < P + 2.55) { const k = clamp((t - P - 1.75) / .8); const [x, y] = arc(P_RIGHT, P_HEAD, 300, k); return { x, y, pose: 'run', dir: -1, rot: lerp(-.4, .3, k), phase: k * 2.5, pupil: 1 }; }
  return { x: P_HEAD[0], y: P_HEAD[1] + (t > TL.PILE ? 0 : 0), pose: t >= TL.PILE ? 'loaf' : 'sit', dir: 1, pupil: t >= TL.FLOOD ? 1 : .7, eyes: t >= TL.PILE ? 'closed' : 'open', tail: t * .6 };
}
// the flood: cats leap in from the window, land on the bench, then gather on Vera
const FLOOD = [
  { fur: 'black', d: [180, LCT + 12], t0: 0 }, { fur: 'tux', d: [1000, LCT + 12], t0: .18 }, { fur: 'grey', d: [470, LCT + 12], t0: .32 },
  { fur: 'calico', d: [640, LCT + 12], t0: .45 }, { fur: 'white', d: [840, 700], t0: .6 }, { fur: 'black', d: [90, LCT + 12], t0: .72 },
  { fur: 'ginger', d: [560, 760], t0: .86 }, { fur: 'grey', d: [960, 852], t0: 1.0 }, { fur: 'tux', d: [380, LCT + 12], t0: 1.14 }, { fur: 'calico', d: [700, 980], t0: 1.3 },
];
const PILE = [                                                     // where they end up: loaves on Vera's shoulders and chest, and in front of her
  { fur: 'black', x: 110, y: LCT + 12, s: 105, dir: 1 }, { fur: 'tux', x: 440, y: LCT + 12, s: 112, dir: -1 }, { fur: 'ginger', x: 575, y: LCT + 12, s: 98, dir: -1 },
  { fur: 'white', x: 225, y: 1255, s: 108, dir: 1 }, { fur: 'grey', x: 330, y: 1160, s: 122, dir: -1 },
  { fur: 'black', x: 200, y: 1010, s: 112, dir: 1 }, { fur: 'calico', x: 405, y: 1004, s: 108, dir: -1 },
];
function drawFloodCats(g, t) {
  const F0 = TL.FLOOD;
  FLOOD.forEach((f, i) => {
    const t0 = F0 + .15 + f.t0, k = clamp((t - t0) / .6);
    if (t < t0) return;
    const src = [700 + (i % 4) * 70, 410];
    if (k < 1) { const [x, y] = arc(src, f.d, 160 + (i % 3) * 60, k); drawCat(g, x, y, 92, { fur: f.fur, pose: 'run', dir: f.d[0] < src[0] ? -1 : 1, rot: lerp(-.4, .5, k), phase: k * 2 + i * .3, pupil: 1 }); return; }
    // after landing: chase the dot a little, in place
    const hop = Math.abs(Math.sin((t - t0) * 7 + i)) * 18;
    drawCat(g, f.d[0] + Math.sin((t - t0) * 3 + i) * 14, f.d[1] - hop, 92, { fur: f.fur, pose: i % 2 ? 'crouch' : 'sit', dir: i % 2 ? 1 : -1, pupil: 1, wiggle: t * 3 + i, tail: t + i * .2, look: -1 });
  });
}
function drawPile(g, t) {
  PILE.forEach((p, i) => drawCat(g, p.x, p.y + Math.sin(t * 2 + i) * 1.5, p.s, { fur: p.fur, pose: 'loaf', dir: p.dir, eyes: 'closed', tail: t * .3 + i * .2 }));
}

// ---------------------------------------------------------------- cameras for this episode
const CAM = Object.assign({}, LABCAM, {
  OPEN: [540, 990, 1.18, 1.2],
  CANNON: [470, 900, 1.42, 1.5],
  CHARGE: [540, 960, 1.22, 1.3],
  DOT_CU: [DOTP.win[0] + 10, DOTP.win[1] + 30, 3.4, 3.6],
  WINDOW_CAT: [LWIN.x + 10, LWIN.y + 60, 2.7, 2.95],
  WIDE_CAT: [600, 960, 1.18, 1.22],
  CAT_CU: [P_BENCH[0] - 20, P_BENCH[1] - 60, 3.4, 3.6],
  WIDE_CHASE: [580, 960, 1.16, 1.16],
  WINDOW_CATS: [LWIN.x, LWIN.y + 40, 2.75, 2.95],
  WIDE_FLOOD: [560, 960, 1.16, 1.2],
  PILE: [VERA.x + 70, VERAFACE + 210, 1.5, 1.6],
  BOARD_END: [LBOARD.x - 40, LBOARD.y - 5, 2.75, 2.85],
});

// ---------------------------------------------------------------- character states
function veraState(t, n) {
  let expr = 'cool', point = 0, cheer = false, reachR = null, blink = blinkAt(0, t);
  if (t < V.L1.t - .1) { const k = ease(clamp(t / .45)); reachR = { x: lerp(80, 100, k), y: lerp(-120, -200, k) }; expr = 'scheme'; }
  else if (t < TL.HUD1) { cheer = true; expr = 'scheme'; }
  else if (t < V.L3.t) expr = 'cool';
  else if (t < TL.PEW + .5) {
    expr = t < TL.LEVER ? 'scheme' : 'laugh';
    const k = smooth(TL.LEVER - .3, TL.LEVER, t), [ex, ey] = leverEnd(t);
    reachR = { x: lerp(70, (ex - VERA.x) / VERA.s * 100, k), y: lerp(-60, (ey - LCT) / VERA.s * 100, k) };
  } else if (t < TL.FLOOD) {
    expr = 'fluster';
    const sh = t < TL.CATIN ? Math.sin(t * 31) * 2 : 0;
    reachR = { x: (GRIP.x - VERA.x) / VERA.s * 100 + sh, y: (GRIP.y - LCT) / VERA.s * 100 + sh };
  } else if (t < TL.PILE) expr = 'fluster';
  else { expr = 'cool'; blink = 1; }
  return { expr, point, cheer, reachR, mouth: mouthFor('VERA', t), blink };
}
function leverEnd(t) { const k = smooth(TL.LEVER - .05, TL.LEVER + .15, t); const a = lerp(-.55, .75, k), L = 96; return [LEVER.x + Math.sin(a) * L, LEVER.y - 18 - Math.cos(a) * L]; }
function cleoState(t, n) {
  let expr = 'deadpan', look = 0;
  if (t >= TL.WIN2 && t < TL.PILE) look = -.6;
  if (t >= TL.PILE) expr = 'sleepy';
  return { expr, remote: true, mouth: mouthFor('CLEO', t), blink: blinkAt(1, t), look };
}

// ---------------------------------------------------------------- frame
function drawScene(t) {
  const shot = shotAt(t), n = shot[0], sk = (t - shot[1]) / Math.max(.01, shot[2] - shot[1]);
  if (n === 'HUD') { hudScan(c, t - TL.HUD0, HUDSPEC); return; }
  const chg = n === 'CHARGE' && t < TL.PEW ? clamp((t - TL.CHARGE) / (TL.PEW - TL.CHARGE)) : 0;
  const shake = chg > 0 ? Math.sin(t * 90) * 14 * chg * chg : (t > TL.FLOOD && t < TL.FLOOD + .4 ? Math.sin(t * 100) * 6 : 0);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#12302a'; c.fillRect(0, 0, W, H);
  applyCam(c, CAM[n], sk, shake);
  c.drawImage(LAB_STATIC.lab, 0, 0);
  drawWindowCats(c, t);
  if (t < TL.FLOOD + .3) {                                          // the pigeons on the sill, until the cats come
    drawPigeon(c, LWIN.x + 120, LWIN.y + LWIN.h / 2 + 8, 56, { dir: -1, bob: Math.sin(t * 5) * 1.2 });
    drawPigeon(c, LWIN.x - 130, LWIN.y + LWIN.h / 2 + 8, 52, { dir: 1, bob: Math.sin(t * 4 + 1) * 1.2 });
  } else if (t < TL.FLOOD + 1.6) {
    const u = t - TL.FLOOD - .3;
    drawPigeon(c, LWIN.x + 120 + u * 520, LWIN.y + 103 - u * 420, 56, { dir: 1, fly: true, flap: (Math.sin(u * 40) + 1) / 2 });
    drawPigeon(c, LWIN.x - 130 - u * 300, LWIN.y + 103 - u * 520, 52, { dir: -1, fly: true, flap: (Math.sin(u * 44 + 1) + 1) / 2 });
  }
  drawRentCircles(c, 4, n === 'BOARD_END' ? 0 : 0);
  if (n === 'BOARD_END') boardScratch(c, t);
  flyer(c, FLYER_WALL.x, FLYER_WALL.y, .42);
  drawFridge(c, 0);
  const sheet = clamp(t / .5);
  drawAnnihilator(c, t, barrelAng(t), { charge: chg > 0 ? chg : (t >= TL.PEW && t < TL.PEW + .2 ? 1 : 0), sheet });
  const bobV = Math.sin(t * 2.1) * 2, bobC = Math.sin(t * 1.7 + 1) * 1.5;
  drawVera2(c, VERA.x, LCT + bobV, VERA.s, veraState(t, n));
  drawCleo2(c, CLEO.x, LCT + bobC, CLEO.s, cleoState(t, n));
  if (t >= TL.PILE) heartsUp(c, t, VERA.x + 90, VERAFACE - 60, 1, smooth(TL.PILE + 1.0, TL.PILE + 1.6, t));
  c.drawImage(LAB_STATIC.front, 0, LCT);
  drawLever(c, smooth(TL.LEVER - .05, TL.LEVER + .15, t));
  drawBeakers(c, t);
  if (t >= TL.PILE) drawPile(c, t); else if (t >= TL.FLOOD) drawFloodCats(c, t);
  const gs = gingerState(t); if (gs && n !== 'BOARD_END') drawCat(c, gs.x, gs.y, gs.pose === 'loaf' ? 96 : 84, gs);
  const d = dotAt(t); if (d && n !== 'BOARD_END') drawLaserDot(c, d[0], d[1], n === 'DOT_CU' ? 6 : 7);
  if (chg > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(10,4,20,${.42 * chg})`; c.fillRect(0, 0, W, H); }
  if (t >= TL.PEW && t < TL.PEW + .12) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(255,40,60,.25)'; c.fillRect(0, 0, W, H); }
}
// the end: the dot runs one more circle around PAY RENT; the ginger cat chases it and scratches the fifth circle into the board
function boardScratch(g, t) {
  const i = 4, cx = LBOARD.x - 70, cy = LBOARD.y + 80, rx = 120 + i * 12, ry = 30 + i * 6, rot = -.03 * (i + 1), a0 = -2.6 + i * .5;
  const t0 = TL.BOARDT + .35, k = smooth(t0, t0 + 1.5, t), kc = clamp(k - .05);
  const pt = (a, r = 0) => { const ca = Math.cos(rot), sa = Math.sin(rot), ex = (rx + r) * Math.cos(a), ey = (ry + r * .3) * Math.sin(a); return [cx + ex * ca - ey * sa, cy + ex * sa + ey * ca]; };
  if (kc > 0) {                                                 // three claw lines
    g.save(); g.strokeStyle = '#f4f7f0'; g.lineCap = 'round';
    for (const r of [-7, 0, 7]) { g.lineWidth = 2.4; g.beginPath(); for (let j = 0; j <= 60; j++) { const a = a0 + kc * 6.6 * j / 60, [x, y] = pt(a, r); j ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    g.restore();
  }
  if (t < t0 + 1.6) {
    const ad = a0 + Math.min(1, k + .04) * 6.6, [dx, dy] = pt(ad); drawLaserDot(g, dx, dy, 6);
    if (k > 0) { const ac = a0 + kc * 6.6, [x, y] = pt(ac), [x2, y2] = pt(ac + .05), ang = Math.atan2(y2 - y, x2 - x);
      g.save(); g.translate(x, y); g.rotate(ang); drawCat(g, 0, 26, 56, { fur: 'ginger', pose: 'run', dir: 1, phase: t * 4, pupil: 1 }); g.restore(); }
  } else {
    const u = smooth(t0 + 1.6, t0 + 2.0, t);                      // the cat sits on the chalk ledge, done
    drawCat(g, lerp(cx + 40, LBOARD.x + 60, u), LBOARD.y + LBOARD.h / 2 + 2, 56, { fur: 'ginger', pose: 'sit', dir: -1, pupil: .2, tail: t * .5 });
  }
}

// the hologram spec scan of the Annihilator (inserts.js)
function annihilatorModel() {
  const lines = [], faces = [], N = 14, R = .42;
  const ring = (x, r, out) => { for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; out.push([x, Math.cos(a0) * r, Math.sin(a0) * r, x, Math.cos(a1) * r, Math.sin(a1) * r]); } };
  for (let x = -1.3; x <= 1.31; x += .325) ring(x, R, lines);
  for (let i = 0; i < N; i += 2) { const a = i / N * 6.2832; lines.push([-1.3, Math.cos(a) * R, Math.sin(a) * R, 1.3, Math.cos(a) * R, Math.sin(a) * R]); }
  for (const x of [-.6, -.3, 0, .3]) ring(x, .52, lines);
  ring(1.62, .62, lines);
  for (let i = 0; i < N; i += 2) { const a = i / N * 6.2832; lines.push([1.3, Math.cos(a) * R, Math.sin(a) * R, 1.62, Math.cos(a) * .62, Math.sin(a) * .62]); }
  ring(1.6, .3, lines);
  // tripod
  for (const [lx, lz] of [[-.9, .6], [.9, .6], [0, -.9]]) lines.push([0, .45, 0, lx, 1.55, lz]);
  lines.push([-.4, .42, -.3, .4, .42, -.3], [-.4, .42, .3, .4, .42, .3], [-.4, .42, -.3, -.4, .42, .3], [.4, .42, -.3, .4, .42, .3]);
  for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832; faces.push([[-1.3, Math.cos(a0) * R, Math.sin(a0) * R], [-1.3, Math.cos(a1) * R, Math.sin(a1) * R], [1.3, Math.cos(a1) * R, Math.sin(a1) * R], [1.3, Math.cos(a0) * R, Math.sin(a0) * R]]); }
  return { lines, faces };
}
const ANN = annihilatorModel();
const HUDSPEC = { code: 'VOLT LABS // SPEC SCAN', title: 'ANNIHILATOR', sub: 'ORBITAL DOOM LASER  /  MK-1', model: () => ANN, solidT: 2.1, lockT: .7, verdictT: 2.25, yaw0: 2.3, pitch: .5,
  parts: [{ label: 'OUTPUT', value: '1,000,000,000 W', p: [1.62, 0, 0], side: 1 }, { label: 'TARGET', value: 'PLANET EARTH', p: [-.3, -.52, 0], side: -1 }, { label: 'PAID WITH', value: 'RENT MONEY', p: [0, .45, 0], side: 1 }],
  verdict: 'READY TO RULE EARTH' };

// the hook card (experiment, owner's 4-episode trial): first 2.5 s, top of the frame, inside the safe zone
function hookCard(g, t) {
  const a = clamp((t + .01) / .12) * clamp((2.5 - t) / .25); if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  tShape(g, 'rgba(18,10,42,.88)', gg => gg.roundRect(110, 250, 860, 190, 26), 5);
  tText(g, 'SHE SPENT THE RENT', 540, 314, 64, '#fbf7ff', '"Bungee"', 'center', 400);
  tText(g, 'ON THIS', 540, 388, 64, '#d8ff7a', '"Bungee"', 'center', 400);
  g.restore();
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  drawScene(t);
  composeFrame(OUT, SC, t);
  hookCard(OUT, t);
}
window.render = render;

window.EV = [
  { type: 'bed', fx: 'lab_hum', t: 0, t1: DUR + .5, g: -31 },
  { type: 'sheet', t: .02 },
  { type: 'scan', t: TL.HUD0 + .05 },
  { type: 'lever', t: TL.LEVER },
  { type: 'charge', t: TL.CHARGE, dur: TL.PEW - TL.CHARGE + .02 },
  { type: 'pew', t: TL.PEW },
  { type: 'meow', t: TL.WIN1 + .7 },
  { type: 'whoosh', t: TL.CATIN + .25 },
  { type: 'thump', t: TL.CATIN + 1.0 },
  { type: 'whoosh', t: TL.POUNCE },
  { type: 'thump', t: TL.POUNCE + 1.15 },
  { type: 'crash', t: TL.POUNCE + 1.2 },
  { type: 'whoosh', t: TL.POUNCE + 1.75 },
  { type: 'thump', t: TL.POUNCE + 2.55 },
  { type: 'meows', t: TL.WIN2 + .05 },
  { type: 'chaos', t: TL.FLOOD + .05 },
  { type: 'flutter', t: TL.FLOOD + .3 },
  { type: 'purr', t: TL.PILE, dur: TL.BOARDT - TL.PILE + .3 },
  { type: 'scratch', t: TL.BOARDT + .35, dur: 1.5 },
];

(async () => {
  try {
    await toonFonts('../channel/brand/fonts/');
    await insFonts('../channel/brand/fonts/');
    buildLab();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
