// STILL RECORDING, tape 5: "Screen 2". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js. Script: channel/scripts/SR05_screen_2.md
// The cinema multiplexer switches between CAM 12 (inside Screen 2) and CAM 11 (the cinema lobby). The screen in Screen 2
// is on and shows a CCTV feed: first the lobby (with someone in it, closer each time), then Screen 2 itself.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const RAW = mk(TK.TW, TK.TH), RG = RAW.getContext('2d'), WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const FRAW = mk(TK.TW, TK.TH), FRG = FRAW.getContext('2d'), FEED = mk(TK.TW, TK.TH), FG = FEED.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6;
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }

// ---------------------------------------------------------------- Screen 2: stadium seating facing a screen at z = 15
const ROWS = 'ABCDEFGHI', ZROW = i => 12.3 - i * 1.1, HROW = i => i * .3;      // row A is at the front, on the floor
const SCR = { x0: -5, x1: 5, y0: 1.6, y1: 6.6, z: 14.98 };
const FEEDQ = { x0: -3.33, x1: 3.33 };                                        // a 4:3 picture in the middle of the 2:1 screen
const AISLE = [3.3, 4.9];
const ROW_D = 6, SEAT_D = { x: .85 };                                          // row G, right of centre (its head shows against the screen)
function buildAud(screenOn) {
  const S = new TK.Scene();
  const wall = [62, 58, 60], dark = [30, 28, 30], seat = [92, 46, 50], floorC = [48, 44, 44];
  S.quad([[-6, 0, 15], [6, 0, 15], [6, 7.6, 15], [-6, 7.6, 15]], [24, 22, 24]);                         // front wall
  S.quad([[-6, 0, 0], [-6, 0, 15], [-6, 7.6, 15], [-6, 7.6, 0]].map(p => p), wall.map(v => v * .8));     // left wall (seen from inside)
  S.quad([[6, 0, 15], [6, 0, 0], [6, 7.6, 0], [6, 7.6, 15]], wall.map(v => v * .7));                     // right wall
  S.quad([[-6, 7.6, 0], [6, 7.6, 0], [6, 7.6, 15], [-6, 7.6, 15]], dark);                                // ceiling
  S.quad([[-6, 0, 12.9], [6, 0, 12.9], [6, 0, 15], [-6, 0, 15]], floorC);                                // floor in front of row A
  for (let i = 0; i < ROWS.length; i++) {
    const z = ZROW(i), h = HROW(i), zf = z - .55, zb = z + .55;
    S.quad([[-6, h, zf], [6, h, zf], [6, h, zb], [-6, h, zb]], floorC);                                   // the step this row sits on
    if (i > 0) S.quad([[-6, h - .3, zb], [6, h - .3, zb], [6, h, zb], [-6, h, zb]], floorC.map(v => v * .7));   // riser below it (faces the screen)
    // seat backs (seen from behind): a block left of the aisle and a short one right of it
    for (let x = -5.7; x < 5.7 - .45; x += .56) if (x + .5 < AISLE[0] || x > AISLE[1]) S.box(x, h + .45, z + .05, x + .5, h + 1.0, z + .3, seat);   // one seat back each
    // aisle step light with the row letter
    S.quad([[AISLE[0] + .35, h + .02, zf + .02], [AISLE[1] - .35, h + .02, zf + .02], [AISLE[1] - .35, h + .14, zf + .02], [AISLE[0] + .35, h + .14, zf + .02]], [200, 190, 150], { emit: .55, text: ROWS[i], textCol: [40, 30, 20] });
  }
  // the screen: dim when the projector shows black bars; the feed is drawn on top
  S.quad([[SCR.x0, SCR.y0, SCR.z], [SCR.x1, SCR.y0, SCR.z], [SCR.x1, SCR.y1, SCR.z], [SCR.x0, SCR.y1, SCR.z]], screenOn === 'blank' ? [205, 205, 210] : screenOn ? [70, 70, 74] : [26, 26, 28], { emit: screenOn === 'blank' ? .7 : screenOn ? .35 : 0 });
  // exit sign by the front left door
  S.quad([[-5.98, 3.0, 13.2], [-5.98, 3.0, 12.2], [-5.98, 3.45, 12.2], [-5.98, 3.45, 13.2]], [40, 140, 70], { emit: 1, text: 'EXIT', textCol: [190, 255, 200] });
  S.quad([[-5.99, 0, 13.4], [-5.99, 0, 12.0], [-5.99, 2.6, 12.0], [-5.99, 2.6, 13.4]], [18, 18, 20]);
  return S;
}
const AUD_ON = buildAud(true), AUD_OFF = buildAud(false), AUD_BLANK = buildAud('blank');   // blank: projector light, no picture
const CAM12 = { x: 0, y: 4.4, z: -.6, yaw: 0, pitch: -.12, fov: 40 };

// ---------------------------------------------------------------- the cinema lobby
const DOOR2 = { z0: 9.6, z1: 11.0, h: 2.5 };
function buildLobby(sign2) {
  const S = new TK.Scene(), floorC = [70, 60, 66], wall = [104, 96, 90], ceil = [56, 52, 50];
  for (let z = 0; z < 16; z += 2) {
    S.quad([[-7, 0, z], [7, 0, z], [7, 0, z + 2], [-7, 0, z + 2]], floorC, { floor: true });
    S.quad([[-7, 4.2, z + 2], [7, 4.2, z + 2], [7, 4.2, z], [-7, 4.2, z]], ceil);
  }
  S.quad([[-7, 0, 16], [7, 0, 16], [7, 4.2, 16], [-7, 4.2, 16]], wall.map(v => v * .7));                 // back wall
  S.quad([[-7, 0, 0], [-7, 0, 16], [-7, 4.2, 16], [-7, 4.2, 0]], wall.map(v => v * .8));                 // left wall
  S.quad([[7, 0, 16], [7, 0, 0], [7, 4.2, 0], [7, 4.2, 16]], wall.map(v => v * .75));                    // right wall
  // concession stand with a lit menu board
  S.box(-3.2, 0, 13.6, 3.2, 1.1, 15.0, [120, 106, 92]);
  S.quad([[-3.2, .25, 13.59], [3.2, .25, 13.59], [3.2, 1.0, 13.59], [-3.2, 1.0, 13.59]], [200, 190, 160], { emit: .45 });
  S.quad([[-3.4, 2.3, 15.98], [3.4, 2.3, 15.98], [3.4, 3.4, 15.98], [-3.4, 3.4, 15.98]], [230, 220, 190], { emit: .8, text: 'CONCESSIONS', textCol: [40, 30, 20] });
  // posters on the left wall
  for (const z of [4.5, 8.5, 12.0]) {
    S.quad([[-6.98, .9, z + 1.1], [-6.98, .9, z], [-6.98, 2.7, z], [-6.98, 2.7, z + 1.1]], [140, 130, 120], { emit: .3 });
    S.quad([[-6.97, 2.35, z + 1.0], [-6.97, 2.35, z + .1], [-6.97, 2.6, z + .1], [-6.97, 2.6, z + 1.0]], [30, 26, 24], { text: 'NOW', textCol: [220, 210, 190] });
  }
  // doors to Screen 1 and Screen 2 on the right wall, a lit number over each
  for (const [z0, z1, num] of [[3.6, 5.0, '1'], [DOOR2.z0, DOOR2.z1, sign2]]) {
    S.quad([[6.98, 0, z0], [6.98, 0, z1], [6.98, DOOR2.h, z1], [6.98, DOOR2.h, z0]], [96, 70, 56], { door: num });
    S.quad([[6.97, 2.7, z0 + .35], [6.97, 2.7, z1 - .35], [6.97, 3.25, z1 - .35], [6.97, 3.25, z0 + .35]], [210, 200, 170], { emit: .9, text: num, textCol: [30, 24, 20] });
  }
  // ceiling lights, a few left on
  for (const [x, z] of [[-3, 3], [3, 7], [-3, 11], [0, 14.2]]) S.quad([[x - .7, 4.18, z], [x + .7, 4.18, z], [x + .7, 4.18, z + .6], [x - .7, 4.18, z + .6]], [150, 150, 140], { emit: .5, light: true });
  S.meta = { width: 14, length: 16 };
  return S;
}
const LOB = buildLobby('2'), LOB_EGG = buildLobby('6');
const CAM11 = { x: -5.6, y: 3.7, z: .5, yaw: .42, pitch: -.36, fov: 66 };
// the open door to Screen 2: a black gap that narrows as the door swings shut by itself
function doorGap(g, cam, t) {
  const k = clamp((t - TL.DOOR) / 1.6), w = (DOOR2.z1 - DOOR2.z0) * (1 - ease(k)); if (w < .02) return;
  const P = [[6.96, 0, DOOR2.z0], [6.96, 0, DOOR2.z0 + w], [6.96, DOOR2.h, DOOR2.z0 + w], [6.96, DOOR2.h, DOOR2.z0]].map(p => project(cam, p));
  if (P.some(p => !p)) return;
  g.fillStyle = 'rgb(6,6,8)'; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
}

// ---------------------------------------------------------------- it: a tall figure with no face
// standing: feet at (x, 0, z), 2.05 m tall. Drawn as one dark shape in screen space, scaled by the projected height.
function standing(g, cam, x, z, o = {}) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 2.05, z]); if (!feet || !head) return;
  const H = feet[1] - head[1], cx = (feet[0] + head[0]) / 2, W = H * .26;
  g.save(); g.translate(head[0], head[1]); g.rotate(Math.atan2(head[0] - feet[0], feet[1] - head[1]) * -1);
  g.fillStyle = 'rgb(6,6,8)'; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = H * .03;
  g.beginPath(); g.ellipse(0, H * .07, W * .3, H * .075, 0, 0, 6.2832); g.fill();                               // head
  g.beginPath(); g.moveTo(-W * .14, H * .13); g.lineTo(W * .14, H * .13); g.lineTo(W * .5, H * .2);               // neck, long shoulders
  g.lineTo(W * .46, H * .55); g.lineTo(W * .52, H * .62); g.lineTo(W * .36, H * .62);                              // the arms hang too low
  g.lineTo(W * .3, H * .58); g.lineTo(W * .24, H); g.lineTo(W * .04, H); g.lineTo(0, H * .6);
  g.lineTo(-W * .04, H); g.lineTo(-W * .24, H); g.lineTo(-W * .3, H * .58); g.lineTo(-W * .36, H * .62);
  g.lineTo(-W * .52, H * .62); g.lineTo(-W * .46, H * .55); g.lineTo(-W * .5, H * .2); g.closePath(); g.fill();
  g.restore();
}
// seated in row D: the head and shoulders over the seat back
function seated(g, cam) {
  const h = HROW(ROW_D), z = ZROW(ROW_D) + .5, top = project(cam, [SEAT_D.x, h + 1.62, z]), sh = project(cam, [SEAT_D.x, h + 1.0, z]); if (!top || !sh) return;
  const H = sh[1] - top[1];
  g.save(); g.fillStyle = 'rgb(5,5,7)'; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = H * .05;
  g.beginPath(); g.ellipse(top[0], top[1] + H * .3, H * .22, H * .3, 0, 0, 6.2832); g.fill();
  g.beginPath(); g.moveTo(top[0] - H * .1, top[1] + H * .55); g.lineTo(top[0] + H * .1, top[1] + H * .55); g.lineTo(sh[0] + H * .5, sh[1] - H * .05); g.lineTo(sh[0] + H * .55, sh[1] + H * .2); g.lineTo(sh[0] - H * .55, sh[1] + H * .2); g.lineTo(sh[0] - H * .5, sh[1] - H * .05); g.closePath(); g.fill();
  g.restore();
}
const STAGE_AT = { 1: { x: .6, z: 12.9 }, 2: { x: .2, z: 7.6 }, 3: { x: -3.0, z: 3.3 } };

// ---------------------------------------------------------------- the feed on the screen
function stamp(t) {
  const [h0, m0, s0] = TL.STAMP0, s = Math.floor(h0 * 3600 + m0 * 60 + s0 + t);
  const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60, p = n => String(n).padStart(2, '0');
  return `12-31-1999  ${p(hh)}:${p(mm)}:${p(ss)}`;
}
function makeFeed(tq, stage) {
  if (stage <= 3) {
    const cam = TK.render(FRG, LOB, CAM11, { ambient: 2.2, fog: .03 });
    standing(FRG, cam, STAGE_AT[stage].x, STAGE_AT[stage].z);
    TK.grade(FG, FRAW, tq, 'cctv');
    TK.osd(FG, 'cctv', tq, { cam: 'CAM 11', place: 'CINEMA LOBBY', stamp: stamp(tq) });
  } else {
    const cam = TK.render(FRG, AUD_BLANK, CAM12, { ambient: 2.4, fog: .03 });
    seated(FRG, cam);
    TK.grade(FG, FRAW, tq, 'cctv');
    TK.osd(FG, 'cctv', tq, { cam: 'CAM 12', place: 'SCREEN 2', stamp: stamp(tq) });
  }
}
// draw FEED onto the 4:3 middle of the screen quad (an affine map from three projected corners)
function drawFeed(g, cam) {
  const tl = project(cam, [FEEDQ.x0, SCR.y1, SCR.z - .01]), tr = project(cam, [FEEDQ.x1, SCR.y1, SCR.z - .01]), bl = project(cam, [FEEDQ.x0, SCR.y0, SCR.z - .01]);
  if (!tl || !tr || !bl) return;
  g.save(); g.setTransform((tr[0] - tl[0]) / TK.TW, (tr[1] - tl[1]) / TK.TW, (bl[0] - tl[0]) / TK.TH, (bl[1] - tl[1]) / TK.TH, tl[0], tl[1]);
  g.filter = 'brightness(1.25) contrast(1.1)'; g.drawImage(FEED, 0, 0); g.filter = 'none';
  g.restore();
  // the screen lights the front of the room a little
  const c = project(cam, [0, 1.0, 12]); if (!c) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(c[0], c[1], 10, c[0], c[1], 520); gr.addColorStop(0, 'rgba(70,70,70,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, TK.TW, TK.TH); g.restore();
}

// ---------------------------------------------------------------- tape damage (as the other tapes)
function glitchAt(t) { for (const [t0, d] of TL.GLITCH) if (t >= t0 && t < t0 + d) return (t - t0) / d; return -1; }
function tear(g, t, k) {
  const R = TK.rng(Math.floor(t * 60) + 5);
  const band = 30 + R() * 120, y = R() * (TK.TH - band), dx = (R() - .5) * 140 * Math.sin(k * Math.PI);
  g.drawImage(g.canvas, 0, y, TK.TW, band, dx, y, TK.TW, band);
  const y2 = R() * TK.TH; g.drawImage(g.canvas, 0, y2, TK.TW, 40, -dx * .6, y2 + (R() - .5) * 20, TK.TW, 40);
}
function segAt(t) { for (const s of TL.SEGS) if (t >= s[1] && t < s[2]) return s; return null; }

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const tq = Math.floor(t * FPS_CCTV) / FPS_CCTV;
  const seg = segAt(t), inStatic = !seg || TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) TK.statics(WG, t, 1);
  else {
    const [which, , , stage] = seg;
    let osd;
    if (which === 'A') {
      const cam = TK.render(RG, AUD_ON, CAM12, { ambient: 2.4, fog: .03 });
      if (stage <= 4) makeFeed(tq, stage); else { FG.fillStyle = '#000'; FG.fillRect(0, 0, TK.TW, TK.TH); TK.statics(FG, t, .8); }   // at the end the screen shows snow
      drawFeed(RG, cam);
      if (stage === 5) seated(RG, cam);
      osd = { cam: 'CAM 12', place: 'SCREEN 2', stamp: stamp(t) };
    } else {
      const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
      const cam = TK.render(RG, egg ? LOB_EGG : LOB, CAM11, { ambient: 2.2, fog: .03 });
      if (stage === 'open') doorGap(RG, cam, tq);
      osd = { cam: 'CAM 11', place: 'CINEMA LOBBY', stamp: stamp(t) };
    }
    TK.grade(WG, RAW, tq, 'cctv');
    const gk = glitchAt(t);
    TK.vhs(WG, tq, gk >= 0 ? 2.5 : 1, 5);
    if (gk >= 0) { tear(WG, t, gk); TK.statics(WG, t, .4 * Math.sin(gk * Math.PI)); }
    TK.osd(WG, 'cctv', t, osd);
    for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) TK.caption(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  }
  const ra = clamp((t - .8) / .6);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: ra });
}
window.render = render;

const A_SEGS = TL.SEGS.filter(s => s[0] === 'A' && s[3] <= 4), L_SEGS = TL.SEGS.filter(s => s[0] === 'L');
window.EV = [
  { type: 'static', t: 0.0, dur: .6 },
  ...A_SEGS.map(s => ({ type: 'bed', fx: 'projector', t: s[1], t1: s[2], g: -27, fin: .02, fout: .02 })),
  ...L_SEGS.map(s => ({ type: 'bed', fx: 'mall_hum', t: s[1], t1: s[2], g: -31, fin: .02, fout: .02 })),
  ...TL.SWITCHES.map(x => ({ type: 'switch', t: x - .02 })),
  { type: 'door', t: TL.DOOR },
  { type: 'seat', t: TL.SEAT },
  { type: 'glitch', t: 33.45, dur: .3 },
  { type: 'breath', t: TL.BREATH },
  { type: 'static', t: TL.END, dur: DUR - TL.END },
  { type: 'bed', fx: 'tape_hiss', t: 0, t1: DUR + .5, g: -38 },
];

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
