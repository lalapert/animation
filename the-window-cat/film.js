// "The Window Cat": a ginger cat at an old man's window, four seasons; one winter the window stays dark; the light comes back on.
// Page contract: window.DUR, window.render(t) (pure function of t), window.READY, window.EV.
'use strict';
const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false });
window.DUR = TL.DUR;
const GINGER = '#e08a43', GINGER_D = '#b8662c';   // the accent: the cat
const S = {};
const WIN = { x0: 250, x1: 830, y0: 420, y1: 1080, rail: 750 };
const CAT = { x: 680, y: 1082 };
const BOWL = { x: 566, y: 1080 };
const seasonAt = t => { let s = 'spring'; for (const [t0, n] of TL.SEASONS) if (t >= t0) s = n; return s; };
const IVY = { spring: '#8fb35a', summer: '#4f7a3a', autumn: '#c4552f', winter: null };

// ---------------------------------------------------------------- build
function build() {
  withSeed(41, () => {
    S.wall = wash(rectPts(60, 150, 1020, 1660), '#e7d6bd', .36, 14, 22);
    S.stones = [];
    for (let k = 0; k < 26; k++) { const x = rnd(90, 990), y = rnd(180, 1500); if (x > 200 && x < 880 && y > 360 && y < 1160) continue; S.stones.push(mk(qcurve(x, y, x + rnd(40, 90), y + rnd(-3, 3), rnd(-3, 3), 8), 2, '#a8957c', { prof: 'even', nb: 0, a: .3, rough: .45, rib: 1 })); }
    S.lintel = wash(rectPts(206, 362, 874, 404), '#c9b49a', .55, 3);
    S.frame = wash(rectPts(226, 398, 854, 1086), '#d9cfc2', .5, 3);
    S.frameE = [...edgeLine(226, 398, 854, 398, 2.2, INK2, .55, 3), ...edgeLine(226, 398, 226, 1086, 2.2, INK2, .55, 3), ...edgeLine(854, 398, 854, 1086, 2.2, INK2, .55, 3)];
    S.sill = wash([[196, 1080], [884, 1080], [896, 1118], [184, 1118]], '#cbb9a0', .6, 3);
    S.sillFront = wash(rectPts(184, 1118, 896, 1150), '#a8957c', .6, 2.5);
    S.sillE = [...edgeLine(184, 1118, 896, 1118, 2, INK2, .5, 3), ...edgeLine(184, 1150, 896, 1150, 2, INK, .45, 2)];
    S.sillShadow = wash([[190, 1150], [890, 1150], [860, 1200], [220, 1200]], '#a69e94', .25, 5);
    S.ground = wash(rectPts(60, 1500, 1020, 1660), '#b9b2a8', .3, 8, 20);
    // ivy on the left of the window: stems once, leaves per season
    S.stems = []; S.ivySpots = [];
    const vine = (x0, y0, x1, y1, b) => { const P = qcurve(x0, y0, x1, y1, b, 24); S.stems.push(mk(P, 4, '#6a5442', { prof: 'tip', nb: 0, a: .8 })); P.forEach((p, i) => { if (i % 2 === 0 && i > 2) S.ivySpots.push(p); }); };
    vine(150, 1640, 214, 880, 30); vine(200, 1080, 250, 400, -26); vine(180, 1300, 120, 760, 18); vine(214, 900, 330, 330, 14);
    S.ivy = S.ivySpots.map((p, i) => ({ p, a: rnd(0, 6.28), s: rnd(.8, 1.2), k: i }));
    S.leafStroke = S.ivy.map(l => mk(polar(l.p[0], l.p[1], l.a, 30 * l.s, 4, 8), 20 * l.s, '#8fb35a', { prof: 'leaf', nb: 3, a: .82, rough: .15, bm: .55 }));
    S.blossoms = S.ivy.filter((l, i) => i % 3 === 0).map(l => [l.p[0] + rnd(-14, 14), l.p[1] + rnd(-14, 14)]);
    // interior
    S.chair = wash([[300, 1080], [312, 820], [350, 760], [470, 752], [520, 800], [528, 1080]], '#6a4a3a', .55, 3);
    S.shelf = []; for (let k = 0; k < 4; k++) S.shelf.push(mk(qcurve(620, 520 + k * 70, 820, 520 + k * 70, 1, 10), 5, '#5a4636', { prof: 'even', nb: 0, a: .5, rib: 1 }));
    S.books = []; for (let k = 0; k < 18; k++) { const r = k % 3, x = 630 + (k / 3 | 0) * 32 + rnd(-4, 4); S.books.push(mk(qcurve(x, 516 + r * 70, x + rnd(-2, 2), 470 + r * 70, 0, 4), rnd(14, 22), ['#8a5a4a', '#5a6a7a', '#9a8a5a', '#6a7a5a'][k % 4], { prof: 'even', nb: 2, a: .55 })); }
    S.titleRule = mk(qcurve(380, 1318, 700, 1314, -3, 24), 6, GINGER, { prof: 'brush', nb: 4, a: .85 });
  });
  setCamera(
    [[0, 1.25], [1.8, 1.25], [4.2, 1], [17.6, 1], [18.6, 1.25], [21.8, 1.25], [23.0, 1], [25.5, 1], [32.5, 1.15], [34.2, 1], [44, 1]],
    [[0, [640, 980]], [1.8, [640, 980]], [4.2, [540, 960]], [17.6, [540, 960]], [18.6, [620, 960]], [21.8, [620, 960]], [23.0, [540, 960]], [25.5, [540, 960]], [32.5, [640, 1000]], [34.2, [540, 960]], [44, [540, 960]]]);
}
const camAt0 = camAt;
camAt = t => { const m = camAt0(t), hw = W / 2 / m.z, hh = H / 2 / m.z; m.cx = clamp(m.cx, hw, W - hw); m.cy = clamp(m.cy, hh, H - hh); return m; };

// ---------------------------------------------------------------- state over time
function sashLift(t) {
  const crack = (t0, t1) => ss(seg(t, t0, t0 + .6)) * (1 - ss(seg(t, t1, t1 + .6)));
  const full = ss(seg(t, TL.OPEN, TL.OPEN + 1.2));
  return Math.max(70 * Math.max(crack(TL.CRACK, 7.6), crack(17.4, 22.0), crack(TL.CRACK2, 39.6)), 300 * full);
}
function lampOn(t) { return t < TL.DARK - .4 ? 1 : (t < TL.LAMP ? 1 - ss(seg(t, TL.DARK - .4, TL.DARK + .6)) : ss(seg(t, TL.LAMP, TL.LAMP + .35))); }
function snowAmt(t) { return ss(seg(t, TL.DARK + .5, TL.LAMP)) * (1 - .3 * ss(seg(t, TL.LAMP, TL.ENTER[0]))); }

// ---------------------------------------------------------------- the cat
function catPose(t) {
  const j = seg(t, TL.JUMP[0], TL.JUMP[1]);
  let x = CAT.x, y = CAT.y, hx = -8, hy = -4, eyes = 'open', vis = 1, enter = 0, rot = 0;
  if (t < TL.JUMP[0]) vis = 0;
  else if (j < 1) { const u = eo(j); x = lerp(960, CAT.x, u); y = lerp(1420, CAT.y, u) - Math.sin(Math.PI * u) * 160; rot = (1 - u) * -.5; }
  const eat = seg(t, TL.EAT[0], TL.EAT[0] + .5) * (1 - seg(t, TL.EAT[1] - .4, TL.EAT[1]));
  hx += -54 * ss(eat); hy += 66 * ss(eat);
  const pet = ss(seg(t, TL.PET[0], TL.PET[0] + .6)) * (1 - ss(seg(t, TL.PET[1] - .4, TL.PET[1])));
  hx += -10 * pet; hy += -10 * pet; if (pet > .3) eyes = 'closed';
  const wintr = ss(seg(t, TL.DARK, TL.DARK + 1.5));
  hy += 10 * wintr * (1 - ss(seg(t, TL.LAMP, TL.LAMP + .5)));
  if (wintr > .5 && t < TL.LAMP) eyes = 'half';
  const look = ss(seg(t, TL.LAMP + .2, TL.LAMP + .8));
  hx += -16 * look; hy += -14 * look;
  const en = seg(t, TL.ENTER[0], TL.ENTER[1]);
  if (en > 0) { enter = en; x = lerp(CAT.x, 470, eio(en)); y = CAT.y - Math.sin(Math.PI * Math.min(1, en * 1.4)) * 40; }
  return { x, y, hx, hy, eyes, vis, enter, rot, eat, tail: Math.sin(t * 1.7) * .5 + (pet ? Math.sin(t * 4) * .3 : 0) };
}
function drawCat(c, t, m) {
  if (!m.vis) return;
  const { x, y } = m, hx = x - 44 + m.hx, hy = y - 150 + m.hy;
  c.save();
  if (m.rot) { c.translate(x, y); c.rotate(m.rot); c.translate(-x, -y); }
  // unpainted paper under the cat so the ginger stays ginger over the dark glass
  paperClip(c, () => { c.beginPath(); c.ellipse(x + 26, y - 44, 60, 46, 0, 0, 6.283); c.ellipse(x - 2, y - 82, 50, 74, -.18, 0, 6.283); c.ellipse(hx, hy, 46, 41, 0, 0, 6.283);
    c.moveTo(hx - 40, hy - 18); c.lineTo(hx - 30, hy - 66); c.lineTo(hx - 8, hy - 34); c.moveTo(hx + 40, hy - 18); c.lineTo(hx + 30, hy - 66); c.lineTo(hx + 8, hy - 34);
    c.rect(x - 46, y - 64, 40, 60); c.ellipse(x + 20, y - 2, 80, 12, 0, 0, 6.283); }, .92);
  withSeed(700, () => {
    // tail curling round the front paws
    const tw = m.tail * 30;
    drawS(c, mk([[x + 66, y - 24], [x + 90, y - 2 + tw * .3], [x + 50, y + 4], [x - 10, y + 2], [x - 52, y - 8 - tw * .2]], 20, GINGER, { prof: 'tip', nb: 4, a: .85, rough: .12 }));
    // haunch and body
    c.fillStyle = rgba(GINGER, .7); c.beginPath(); c.ellipse(x + 26, y - 44, 60, 46, 0, 0, 6.283); c.fill();
    c.beginPath(); c.ellipse(x - 2, y - 82, 50, 74, -.18, 0, 6.283); c.fill();
    c.fillStyle = rgba(GINGER_D, .45); c.beginPath(); c.ellipse(x + 44, y - 40, 40, 34, .2, 0, 6.283); c.fill();
    for (let k = 0; k < 5; k++) drawS(c, mk(qcurve(x + 4 + k * 12, y - 140 + k * 18, x + 30 + k * 10, y - 120 + k * 20, 6, 6), 7, GINGER_D, { prof: 'tip', nb: 0, a: .6 }));
    paperClip(c, () => { c.beginPath(); c.ellipse(x - 26, y - 80, 20, 40, -.15, 0, 6.283); }, .9);   // white chest
    // front legs and white paws
    for (const dx of [-36, -14]) drawS(c, mk(qcurve(x + dx, y - 64, x + dx - 3, y - 6, 2, 8), 17, GINGER, { prof: 'even', nb: 3, a: .85, rough: .1 }));
    paperClip(c, () => { c.beginPath(); c.ellipse(x - 40, y - 6, 12, 7, 0, 0, 6.283); c.ellipse(x - 18, y - 6, 12, 7, 0, 0, 6.283); }, .92);
    // head
    c.fillStyle = rgba(GINGER, .75); c.beginPath(); c.ellipse(hx, hy, 46, 41, 0, 0, 6.283); c.fill();
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(hx + s * 40, hy - 18); c.lineTo(hx + s * 30, hy - 66); c.lineTo(hx + s * 8, hy - 34); c.closePath(); c.fill(); }
    c.fillStyle = rgba('#d98a8a', .5); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(hx + s * 34, hy - 26); c.lineTo(hx + s * 29, hy - 54); c.lineTo(hx + s * 16, hy - 34); c.closePath(); c.fill(); }
    for (let k = 0; k < 3; k++) drawS(c, mk(qcurve(hx - 10 + k * 10, hy - 38, hx - 8 + k * 9, hy - 22, 1, 4), 5, GINGER_D, { prof: 'tip', nb: 0, a: .6 }));
    paperClip(c, () => { c.beginPath(); c.ellipse(hx - 4, hy + 20, 22, 14, 0, 0, 6.283); }, .85);   // white muzzle
    // face
    c.strokeStyle = rgba(INK, .85); c.lineWidth = 3; c.lineCap = 'round';
    for (const ex of [-20, 14]) {
      if (m.eyes === 'closed') { c.beginPath(); c.arc(hx + ex, hy - 2, 8, .2, Math.PI - .2); c.stroke(); }
      else {
        const h = m.eyes === 'half' ? 4 : 8;
        c.fillStyle = rgba('#9cb04a', .9); c.beginPath(); c.ellipse(hx + ex, hy - 2, 9, h, 0, 0, 6.283); c.fill();
        c.fillStyle = rgba(INK, .95); c.beginPath(); c.ellipse(hx + ex - 1, hy - 2, 2.4, h * .9, 0, 0, 6.283); c.fill();
        if (m.eyes === 'half') { c.beginPath(); c.moveTo(hx + ex - 10, hy - 4); c.lineTo(hx + ex + 10, hy - 4); c.stroke(); }
      }
    }
    c.fillStyle = rgba('#d98a8a', .9); c.beginPath(); c.moveTo(hx - 9, hy + 10); c.lineTo(hx + 1, hy + 10); c.lineTo(hx - 4, hy + 16); c.closePath(); c.fill();
    c.lineWidth = 2; c.beginPath(); c.moveTo(hx - 4, hy + 16); c.quadraticCurveTo(hx - 10, hy + 24, hx - 16, hy + 20); c.moveTo(hx - 4, hy + 16); c.quadraticCurveTo(hx + 2, hy + 24, hx + 8, hy + 20); c.stroke();
    c.strokeStyle = rgba(INK, .35); c.lineWidth = 1.3;
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(hx - 4 + s * 16, hy + 14 + k * 4); c.lineTo(hx - 4 + s * 62, hy + 8 + k * 9); c.stroke(); }
  });
  // snow settling on its head and back
  const sn = snowAmt(t);
  if (sn > 0) paperClip(c, () => { c.beginPath(); c.ellipse(hx, hy - 34, 26 * sn + 4, 7 * sn + 2, 0, 0, 6.283); c.ellipse(x + 10, y - 150, 30 * sn + 4, 8 * sn + 2, -.4, 0, 6.283); c.ellipse(x + 44, y - 86, 30 * sn + 4, 9 * sn + 2, .3, 0, 6.283); }, .95);
  c.restore();
}

// ---------------------------------------------------------------- hands from inside the window
function drawHand(c, t, from, to, sleeve, open = false) {
  withSeed(900, () => {
    drawS(c, mk(qcurve(from[0], from[1], to[0] + 18, to[1] + 4, -10, 12), 46, sleeve, { prof: 'even', nb: 5, a: .85, rough: .1 }));
    c.fillStyle = rgba('#e9b897', .85); c.beginPath(); c.ellipse(to[0], to[1], 26, 18, -.3, 0, 6.283); c.fill();
    if (open) for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(to[0] - 26, to[1] - 14 + k * 9, 12, 5, -.2, 0, 6.283); c.fill(); }
    else { c.beginPath(); c.ellipse(to[0] - 20, to[1] + 6, 14, 9, .3, 0, 6.283); c.fill(); }
    c.strokeStyle = rgba(INK2, .5); c.lineWidth = 2; c.beginPath(); c.ellipse(to[0], to[1], 26, 18, -.3, 0, 6.283); c.stroke();
  });
}
function drawBowl(c, x, y, a = 1) {
  if (a <= 0) return;
  paperClip(c, () => { c.beginPath(); c.moveTo(x - 40, y - 26); c.quadraticCurveTo(x, y + 6, x + 40, y - 26); c.closePath(); }, .9 * a);
  c.fillStyle = rgba('#5f84a8', .7 * a); c.beginPath(); c.ellipse(x, y - 26, 40, 8, 0, 0, 6.283); c.fill();
  c.fillStyle = rgba('#8a6a4a', .6 * a); c.beginPath(); c.ellipse(x, y - 27, 32, 5, 0, 0, 6.283); c.fill();
  c.strokeStyle = rgba(INK2, .6 * a); c.lineWidth = 2; c.beginPath(); c.moveTo(x - 40, y - 26); c.quadraticCurveTo(x, y + 6, x + 40, y - 26); c.stroke();
}

// ---------------------------------------------------------------- the room, the window
function drawInterior(c, t) {
  const L = lampOn(t), girl = t > TL.LAMP;
  c.save(); c.beginPath(); c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); c.clip();
  c.fillStyle = rgba(mixc('#3b4656', '#e9b877', L), .75); c.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  if (L > 0) { const g = c.createRadialGradient(720, 620, 20, 720, 620, 420); g.addColorStop(0, rgba('#fff2c8', .9 * L)); g.addColorStop(1, rgba('#e9b877', 0)); c.fillStyle = g; c.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); }
  S.shelf.forEach(s => drawS(c, s, 1, null, .6 + .4 * L)); S.books.forEach(s => drawS(c, s, 1, null, .5 + .5 * L));
  drawWash(c, S.chair, .7 + .3 * L);
  // the lamp
  c.fillStyle = rgba(mixc('#4a4a50', '#f4d79a', L), .85); c.beginPath(); c.moveTo(680, 560); c.lineTo(760, 560); c.lineTo(744, 610); c.lineTo(696, 610); c.closePath(); c.fill();
  c.strokeStyle = rgba(INK2, .7); c.lineWidth = 4; c.beginPath(); c.moveTo(720, 610); c.lineTo(720, 760); c.stroke();
  // who is there: the old man reading in his chair; later a young woman by the window
  if (t < TL.DARK) {
    c.fillStyle = rgba('#4a3a32', .72); c.beginPath(); c.arc(412, 708, 34, 0, 6.283); c.fill();
    c.beginPath(); c.ellipse(420, 830, 70, 90, 0, 0, 6.283); c.fill();
    paperClip(c, () => { c.beginPath(); c.ellipse(406, 688, 26, 12, 0, 0, 6.283); }, .55);   // white hair
    c.fillStyle = rgba('#efe6d2', .8); c.beginPath(); c.moveTo(440, 800); c.lineTo(500, 786); c.lineTo(506, 836); c.lineTo(446, 850); c.closePath(); c.fill();   // his book
  }
  if (girl) {
    const a = ss(seg(t, TL.LAMP, TL.LAMP + .6));
    // a young woman by the window: shoulders, a teal jumper, a short bob
    c.fillStyle = rgba('#3f7f86', .62 * a); c.beginPath(); c.moveTo(560, 1080); c.lineTo(566, 800); c.quadraticCurveTo(574, 744, 640, 736); c.quadraticCurveTo(706, 744, 714, 800); c.lineTo(720, 1080); c.closePath(); c.fill();
    c.fillStyle = rgba('#e3b08e', .7 * a); c.beginPath(); c.rect(628, 700, 24, 40); c.fill(); c.beginPath(); c.ellipse(640, 664, 34, 40, 0, 0, 6.283); c.fill();
    c.fillStyle = rgba('#2a2226', .85 * a); c.beginPath(); c.moveTo(602, 690); c.quadraticCurveTo(600, 616, 640, 614); c.quadraticCurveTo(682, 616, 680, 690); c.lineTo(668, 694); c.quadraticCurveTo(660, 650, 620, 650); c.lineTo(612, 694); c.closePath(); c.fill();
  }
  c.restore();
}
function drawWindow(c, t) {
  const lift = sashLift(t), L = lampOn(t);
  // lower sash slides up behind the upper one: the opening below it shows the room with no glass
  const glass = (y0, y1, a) => { c.fillStyle = rgba(mixc('#9fb4c4', '#c8d2da', L * .5), .22 * a); c.fillRect(WIN.x0 + 6, y0, WIN.x1 - WIN.x0 - 12, y1 - y0);
    paperClip(c, () => { c.beginPath(); for (let k = 0; k < 3; k++) { const x = WIN.x0 + 60 + k * 150; c.moveTo(x, y0 + 30); c.lineTo(x + 60, y0 + 30); c.lineTo(x + 10, y1 - 40); c.lineTo(x - 50, y1 - 40); c.closePath(); } }, .1 * a); };
  const ly0 = WIN.rail - lift, ly1 = WIN.y1 - lift;
  glass(ly0, ly1, 1);
  c.fillStyle = rgba('#d6ccbd', .7); c.fillRect(WIN.x0, ly1 - 22, WIN.x1 - WIN.x0, 22);        // bottom rail of the lower sash
  c.strokeStyle = rgba(INK2, .6); c.lineWidth = 2; c.strokeRect(WIN.x0 + 4, ly0, WIN.x1 - WIN.x0 - 8, ly1 - ly0);
  c.fillStyle = rgba('#d6ccbd', .75); c.fillRect(538, ly0, 12, ly1 - ly0 - 22);
  glass(WIN.y0, WIN.rail, 1);                                                                 // upper sash, in front
  c.fillStyle = rgba('#d6ccbd', .8); c.fillRect(WIN.x0, WIN.rail - 10, WIN.x1 - WIN.x0, 20); c.fillRect(538, WIN.y0, 12, WIN.rail - WIN.y0);
  c.strokeStyle = rgba(INK2, .55); c.strokeRect(WIN.x0 + 2, WIN.y0, WIN.x1 - WIN.x0 - 4, WIN.rail - WIN.y0);
}
function drawIvy(c, t, full) {
  S.stems.forEach((s, i) => S_(c, t, s, .2 + i * .12, .9 + i * .12, null, 1, full));
  const sea = seasonAt(t), col = IVY[sea];
  // a new season's leaves wipe up the wall
  const ch = TL.SEASONS.find(([t0]) => t >= t0 && t < t0 + 1.2);
  S.leafStroke.forEach((s, i) => {
    const pIn = full ? 1 : seg(t, .6 + i * .02, 1.0 + i * .02);
    if (pIn <= 0) return;
    let cc = col;
    if (ch && ch[0] > 0) { const prev = TL.SEASONS[TL.SEASONS.indexOf(ch) - 1][1], u = seg(t, ch[0] + (1660 - s.y) / 1400 * .8, ch[0] + (1660 - s.y) / 1400 * .8 + .4); cc = u < 1 ? IVY[prev] : col; if (!cc && u < 1) cc = IVY[prev]; }
    if (!cc) return;
    drawS(c, s, ss(pIn), cc);
  });
  if (sea === 'spring') S.blossoms.forEach(([x, y], i) => { const p = seg(t, 2 + i * .1, 2.4 + i * .1); if (p > 0) paperClip(c, () => { c.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566; c.moveTo(x, y); c.ellipse(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 6 * p, 4 * p, a, 0, 6.283); } }, .9); });
}
function particles(c, t) {
  const sea = seasonAt(t);
  c.save(); c.globalCompositeOperation = 'source-over';
  if (sea === 'spring') for (let i = 0; i < 14; i++) { const x = (hash1(i) * 1100 + t * 30 * (1 + hash1(i * 2))) % 1100, y = 200 + ((t * 60 + hash1(i * 3) * 1400) % 1300); c.fillStyle = rgba('#f4dce4', .8); c.beginPath(); c.ellipse(x, y, 5, 3, t + i, 0, 6.283); c.fill(); }
  if (sea === 'autumn') for (let i = 0; i < 10; i++) { const x = (hash1(i * 5) * 1080 + Math.sin(t + i) * 60), y = 150 + ((t - 18) * 120 + hash1(i * 7) * 1500) % 1500; c.globalCompositeOperation = 'multiply'; c.fillStyle = rgba(i % 2 ? '#c4552f' : '#d99a3a', .7); c.beginPath(); c.ellipse(x, y, 12, 6, t * 2 + i, 0, 6.283); c.fill(); }
  c.restore();
  if (t > TL.RAIN[0] && t < TL.RAIN[1] + .5) {
    const a = ss(seg(t, TL.RAIN[0], TL.RAIN[0] + .5)) * (1 - ss(seg(t, TL.RAIN[1] - .3, TL.RAIN[1] + .5)));
    c.strokeStyle = rgba('#6f8698', .35 * a); c.lineWidth = 1.6;
    for (let i = 0; i < 80; i++) { const x = hash1(i * 7.7) * 1080, y = ((t * 900 + hash1(i * 1.9) * 2000) % 2000) - 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y + 40); c.stroke(); }
  }
  if (sea === 'winter') {
    const a = ss(seg(t, TL.DARK, TL.DARK + 1.5));
    c.save(); c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 120; i++) { const sp = 50 + hash1(i * 2.7) * 70, x = hash1(i * 7.3) * W + Math.sin(t * .8 + i) * 18, y = ((t - TL.DARK) * sp + hash1(i * 5.1) * 1900) % 1900; c.fillStyle = rgba(PAPERC, .9 * a); c.beginPath(); c.arc(x, y, 2.4 + hash1(i * 3.9) * 3, 0, 6.283); c.fill(); }
    c.restore();
    const lay = snowAmt(t);
    paperClip(c, () => { c.beginPath(); c.rect(190, 1080 - 14 * lay, 700, 14 * lay + 1); c.rect(60, 1500 - 30 * lay, 960, 30 * lay + 2); c.rect(206, 362 - 12 * lay, 668, 12 * lay); }, .95);
  }
}

// ---------------------------------------------------------------- frame
function render(t) {
  const c = ctx, cam = camAt(t);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  setCam(c, cam); drawPaper(c);
  c.globalCompositeOperation = 'multiply';
  const P0 = TL.PAINT[0], full = t > TL.PAINT[1] + 1.5;
  W_(c, t, S.wall, P0, P0 + .8, 'td', null, 1, full);
  S.stones.forEach((s, i) => S_(c, t, s, P0 + .4 + i * .02, P0 + .8 + i * .02, null, 1, full));
  W_(c, t, S.ground, P0 + .5, P0 + 1.1, 'lr', null, 1, full);
  // the room shows through the glass
  if (t > P0 + .5 || full) { c.save(); if (!full) { wipePath(c, WIN.x0, WIN.y0, WIN.x1, WIN.y1, ss(seg(t, P0 + .5, P0 + 1.3)), 'lr', 4); c.clip(); } drawInterior(c, t); drawWindow(c, t); c.restore(); }
  W_(c, t, S.frame, P0 + .3, P0 + 1.0, 'lr', null, .55, full);
  S.frameE.forEach((s, i) => S_(c, t, s, P0 + .4 + i * .05, P0 + 1.0 + i * .05, null, 1, full));
  W_(c, t, S.lintel, P0 + .4, P0 + 1.0, 'lr', null, 1, full);
  W_(c, t, S.sillShadow, P0 + .9, P0 + 1.3, 'td', null, 1, full);
  W_(c, t, S.sill, P0 + .7, P0 + 1.3, 'lr', null, 1, full);
  W_(c, t, S.sillFront, P0 + .8, P0 + 1.4, 'lr', null, 1, full);
  S.sillE.forEach((s, i) => S_(c, t, s, P0 + .9 + i * .1, P0 + 1.4 + i * .1, null, 1, full));
  drawIvy(c, t, full);
  // the bowl: his, every day; gone in winter; hers at the end
  const bowl1 = ss(seg(t, TL.BOWL, TL.BOWL + .2)) * (1 - ss(seg(t, TL.DARK - .5, TL.DARK)));
  const bowl2 = ss(seg(t, TL.BOWL2, TL.BOWL2 + .2));
  drawBowl(c, BOWL.x, BOWL.y, Math.max(bowl1, bowl2));
  // hands
  const lift = sashLift(t), handY = WIN.y1 - lift + 30;
  const reach = (t0, t1) => ss(seg(t, t0, t0 + .5)) * (1 - ss(seg(t, t1 - .5, t1)));
  const r1 = reach(TL.CRACK + .5, TL.BOWL + .9);
  if (r1 > 0) drawHand(c, t, [480, handY - 20], [lerp(480, BOWL.x + 10, r1), lerp(handY, BOWL.y - 40, r1)], '#7a5a44');
  const r2 = reach(TL.PET[0], TL.PET[1]);
  if (r2 > 0) { const st = Math.sin((t - TL.PET[0]) * 5) * 16; drawHand(c, t, [600, handY - 20], [lerp(600, CAT.x - 30 + st, r2), lerp(handY, CAT.y - 196, r2)], '#7a5a44', true); }
  const r3 = reach(TL.CRACK2 + .5, TL.BOWL2 + .9);
  if (r3 > 0) drawHand(c, t, [480, handY - 20], [lerp(480, BOWL.x + 10, r3), lerp(handY, BOWL.y - 40, r3)], '#3f7f86');
  const r4 = reach(TL.OPEN + .8, TL.ENTER[0] + .6);
  if (r4 > 0) drawHand(c, t, [430, WIN.y1 - lift + 60], [lerp(430, 520, r4), lerp(WIN.y1 - 60, WIN.y1 - 90, r4)], '#3f7f86', true);
  // the cat (when it steps in, the part inside the window is hidden by the room)
  const m = catPose(t);
  if (m.enter > .55) { c.save(); c.beginPath(); c.rect(0, 0, W, H); c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0 + 2); c.clip('evenodd'); if (m.enter < 1) drawCat(c, t, m); c.restore(); }
  else drawCat(c, t, m);
  // inside now, on the inner sill, in the lamplight
  const inA = ss(seg(t, TL.ENTER[1] - .2, TL.ENTER[1] + .5));
  if (inA > 0) { c.save(); c.beginPath(); c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); c.clip(); c.globalAlpha = inA; c.translate(470, 1068); c.scale(.82, .82); c.translate(-470, -1068);
    drawCat(c, t, { x: 470, y: 1068, hx: 10, hy: -8, eyes: t > 44.6 ? 'closed' : 'open', vis: 1, enter: 0, rot: 0, tail: Math.sin(t * 1.2) * .4 }); c.restore(); }
  particles(c, t);
  // winter dusk: everything cooler; the lamp's warmth spills out onto the sill when it comes back
  const cool = ss(seg(t, TL.DARK, TL.DARK + 1.2));
  if (cool > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = rgba('#c3cbd6', .32 * cool); c.fillRect(0, 0, W, H); setCam(c, cam); }
  const warm = (t > TL.LAMP ? lampOn(t) : 0);
  if (warm > 0) { c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(560, 1040, 30, 560, 1040, 520); g.addColorStop(0, rgba('#ffd9a0', .45 * warm)); g.addColorStop(1, rgba('#ffd9a0', 0)); c.fillStyle = g; c.fillRect(0, 500, W, 1000); c.restore(); }
  // annotation layer
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
  label(c, '5:00 PM', 90, 1336, ss(seg(t, 1.6, 2.1)) * (1 - ss(seg(t, 42.2, 42.6))));
  subtitles(c, t);
  c.save(); titleCard(c, t, TL.TITLE[0], TL.TITLE[1], 'The Window Cat', 1290, S.titleRule); c.restore();
}
window.render = render;

function buildEvents() {
  E(0, 'brushbed', { dur: 1.8, pan: 0 });
  E(TL.JUMP[1] - .1, 'jump', { pan: .3 });
  E(2.6, 'meow', { pan: .3, g: .8 });
  E(TL.CRACK, 'sash_crack', { pan: -.2 }); E(TL.BOWL, 'bowl', { pan: 0 }); E(TL.EAT[0] + .2, 'eat', { pan: .1, dur: 2.2 });
  E(0, 'bed', { fx: 'birds', t1: TL.SEASONS[1][0] + .5, g: -24 });
  E(TL.RAIN[0] - .3, 'bed', { fx: 'rain', t1: TL.RAIN[1] + 1.4, g: -15 });
  E(TL.SEASONS[2][0], 'bed', { fx: 'leaves', t1: TL.DARK + .4, g: -22 });
  E(TL.SEASONS[2][0], 'bed', { fx: 'crickets', t1: TL.DARK + .3, g: -30 });
  TL.SEASONS.slice(1).forEach(([t]) => E(t, 'brush', { dur: 1.2, pan: -.6, g: .7 }));
  E(17.4, 'sash_crack', { pan: -.1, g: .8 }); E(TL.PET[0] + .4, 'purr', { dur: 3.0, pan: .2 });
  E(TL.DARK - .3, 'bed', { fx: 'wind', t1: TL.LAMP + 2, g: -20 });
  E(TL.DARK, 'bed', { fx: 'snow', t1: TL.DUR, g: -24 });
  E(30.4, 'meow', { pan: .3, g: .55 });
  E(TL.LAMP, 'lamp', {}); E(TL.CRACK2, 'sash_crack', { pan: -.1 }); E(TL.BOWL2, 'bowl', {});
  E(TL.OPEN, 'sash_open', { pan: -.1 }); E(TL.ENTER[0] + .2, 'meow', { pan: 0, g: .9 });
  E(TL.TITLE[0], 'brush', { dur: .9, pan: 0, g: .6 });
  EV.sort((a, b) => a.t - b.t);
  window.EV = EV;
}
(async () => {
  try { await loadFonts(); PAPER = buildPaper(); build(); buildEvents(); window.READY = true; }
  catch (e) { console.error('init failed', e && e.stack || e); window.INIT_ERROR = String(e && e.stack || e); }
})();
