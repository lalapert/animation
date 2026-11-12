// STILL RECORDING, tape 5: "Screen 2". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js. Script: channel/scripts/SR05_screen_2.md
// The cinema multiplexer switches between CAM 12 (inside Screen 2) and CAM 11 (the cinema lobby). The screen in Screen 2
// is on and shows a CCTV feed: first the lobby (with someone in it, closer each time), then Screen 2 itself. Then row G.
// v2 (owner 11/12 "not scary"; reference tape 6 v3): dark rooms lit by a flickering projector and a few lobby lights, the
// archivist's playback zoom (into the screen a little further at every return, a crash zoom onto row G), the figure on the
// screen still and then one held-frame jerk forward with its arms longer each time, and a grotesque ending with no jump at the
// lens: the head in row G turns round in held 6 fps steps, then snaps the rest of the way to face the camera; the projector dies.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const SS = 2;                                                                    // RAW is drawn at 2x so the playback zoom stays sharp
const RAW = mk(TK.TW * SS, TK.TH * SS), RG = RAW.getContext('2d'), WORK = mk(TK.TW, TK.TH), WK = WORK.getContext('2d');
const WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const FRAW = mk(TK.TW, TK.TH), FRG = FRAW.getContext('2d'), FEED = mk(TK.TW, TK.TH), FG = FEED.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, W2 = TK.TW / 2, H2 = TK.TH / 2;
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
function hull(P) {                                                               // convex hull (monotone chain) of [x, y] points
  const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// a light that flickers: 1 normally, dropping out on some CCTV frames (deterministic)
function flick(tq, seed, rate) { const R = TK.rng(Math.round(tq * FPS_CCTV) * 31 + seed)(); return R < .2 * rate ? .3 : R < .33 * rate ? .62 : 1; }

// ---------------------------------------------------------------- Screen 2: stadium seating facing a screen at z = 15
const ROWS = 'ABCDEFGHI', ZROW = i => 12.3 - i * 1.1, HROW = i => i * .3;      // row A is at the front, on the floor
const SCR = { x0: -5.4, x1: 5.4, y0: 1.0, y1: 6.4, z: 14.98 };
const FEEDQ = { x0: -3.6, x1: 3.6 };                                        // a 4:3 picture in the middle of the 2:1 screen
const AISLE = [3.3, 4.9];
const SEAT_G = { x: .71, z: ZROW(6) + .5, h: HROW(6), back: ZROW(6) + .3 };    // row G, right of centre: its head shows against the screen
const PORT = [.3, 5.6, -.95];                                                   // the projection booth port in the back wall
const CAM12 = { x: -1.4, y: 4.3, z: -.7, yaw: .065, pitch: -.1, fov: 46 };
function buildAud() {
  const S = new TK.Scene();
  const wall = [40, 37, 39], dark = [14, 13, 14], seat = [52, 30, 34], floorC = [30, 28, 28];
  S.quad([[-6, 0, 15], [6, 0, 15], [6, 7.6, 15], [-6, 7.6, 15]], [16, 15, 16]);                          // front wall
  for (let z = 0; z < 15; z += 1.5) {                                                                       // side walls in acoustic panels
    const k = (z / 1.5) % 2 ? .82 : 1;
    S.quad([[-6, 0, z], [-6, 0, z + 1.5], [-6, 7.6, z + 1.5], [-6, 7.6, z]], wall.map(v => v * .8 * k));
    S.quad([[6, 0, z + 1.5], [6, 0, z], [6, 7.6, z], [6, 7.6, z + 1.5]], wall.map(v => v * .7 * k));
  }
  S.quad([[-6, 7.6, 0], [6, 7.6, 0], [6, 7.6, 15], [-6, 7.6, 15]], dark);                                // ceiling
  S.quad([[-6, 0, 12.9], [6, 0, 12.9], [6, 0, 15], [-6, 0, 15]], floorC);                                // floor in front of row A
  for (let i = 0; i < ROWS.length; i++) {
    const z = ZROW(i), h = HROW(i), zf = z - .55, zb = z + .55;
    S.quad([[-6, h, zf], [6, h, zf], [6, h, zb], [-6, h, zb]], floorC);                                   // the step this row sits on
    if (i > 0) S.quad([[-6, h - .3, zb], [6, h - .3, zb], [6, h, zb], [-6, h, zb]], floorC.map(v => v * .7));
    for (let x = -5.7; x < 5.7 - .45; x += .56) if (x + .5 < AISLE[0] || x > AISLE[1]) S.box(x, h + .45, z + .05, x + .5, h + 1.0, z + .3, seat);
    S.quad([[AISLE[0] + .35, h + .02, zf + .02], [AISLE[1] - .35, h + .02, zf + .02], [AISLE[1] - .35, h + .14, zf + .02], [AISLE[0] + .35, h + .14, zf + .02]], [200, 190, 150], { emit: .5, text: ROWS[i], textCol: [40, 30, 20] });
  }
  S.quad([[SCR.x0, SCR.y0, SCR.z], [SCR.x1, SCR.y0, SCR.z], [SCR.x1, SCR.y1, SCR.z], [SCR.x0, SCR.y1, SCR.z]], [20, 20, 22]);   // the screen (lit by screenLight)
  S.quad([[-5.98, 3.0, 12.2], [-5.98, 3.0, 13.2], [-5.98, 3.45, 13.2], [-5.98, 3.45, 12.2]], [40, 140, 70], { emit: .8, text: 'EXIT', textCol: [190, 255, 200] });   // left wall: toward +z
  S.quad([[-5.99, 0, 13.4], [-5.99, 0, 12.0], [-5.99, 2.6, 12.0], [-5.99, 2.6, 13.4]], [10, 10, 12]);
  return S;
}
const AUD = buildAud();

// ---------------------------------------------------------------- the cinema lobby: dark, a few ceiling lights left on
const DOOR2 = { z0: 9.6, z1: 11.0, h: 2.5 };
const LIGHTS = [[.4, 12.0], [1.0, 7.6], [-2.6, 4.2], [4.0, 2.0]];
function buildLobby(sign2) {
  const S = new TK.Scene(), floorC = [84, 78, 80], wall = [88, 82, 78], ceil = [40, 38, 36];
  for (let z = 0; z < 16; z += 2) {
    S.quad([[-7, 0, z], [7, 0, z], [7, 0, z + 2], [-7, 0, z + 2]], floorC, { floor: true });
    S.quad([[-7, 4.2, z + 2], [7, 4.2, z + 2], [7, 4.2, z], [-7, 4.2, z]], ceil);
  }
  S.quad([[-7, 0, 16], [7, 0, 16], [7, 4.2, 16], [-7, 4.2, 16]], wall.map(v => v * .7));
  S.quad([[-7, 0, 0], [-7, 0, 16], [-7, 4.2, 16], [-7, 4.2, 0]], wall.map(v => v * .8));
  S.quad([[7, 0, 16], [7, 0, 0], [7, 4.2, 0], [7, 4.2, 16]], wall.map(v => v * .75));
  S.box(-3.2, 0, 13.6, 3.2, 1.1, 15.0, [96, 86, 76]);                                                     // concession stand, its lit menu
  S.quad([[-3.2, .25, 13.59], [3.2, .25, 13.59], [3.2, 1.0, 13.59], [-3.2, 1.0, 13.59]], [200, 190, 160], { emit: .4 });
  S.quad([[-3.4, 2.3, 15.98], [3.4, 2.3, 15.98], [3.4, 3.4, 15.98], [-3.4, 3.4, 15.98]], [230, 220, 190], { emit: .75, text: 'CONCESSIONS', textCol: [40, 30, 20] });
  for (const z of [4.5, 8.5, 12.0]) {
    S.quad([[-6.98, .9, z + 1.1], [-6.98, .9, z], [-6.98, 2.7, z], [-6.98, 2.7, z + 1.1]], [120, 112, 104], { emit: .22 });
    S.quad([[-6.97, 2.35, z + .1], [-6.97, 2.35, z + 1.0], [-6.97, 2.6, z + 1.0], [-6.97, 2.6, z + .1]], [30, 26, 24], { text: 'NOW', textCol: [220, 210, 190] });   // left wall: toward +z
  }
  for (const [z0, z1, num] of [[3.6, 5.0, '1'], [DOOR2.z0, DOOR2.z1, sign2]]) {
    S.quad([[6.98, 0, z0], [6.98, 0, z1], [6.98, DOOR2.h, z1], [6.98, DOOR2.h, z0]], [80, 58, 48], { door: num });
    S.quad([[6.97, 2.7, z1 - .35], [6.97, 2.7, z0 + .35], [6.97, 3.25, z0 + .35], [6.97, 3.25, z1 - .35]], [210, 200, 170], { emit: .85, text: num, textCol: [30, 24, 20] });   // right wall: reads toward -z
  }
  S.lights = LIGHTS.map(([x, z]) => { const q = { p: [[x - .7, 4.18, z], [x + .7, 4.18, z], [x + .7, 4.18, z + .6], [x - .7, 4.18, z + .6]], col: [150, 150, 140], emit: .5, light: true }; S.q.push(q); return q; });
  S.meta = { width: 14, length: 16 };
  return S;
}
const LOB = buildLobby('2'), LOB_EGG = buildLobby('6');
const CAM11 = { x: -5.6, y: 3.7, z: .5, yaw: .42, pitch: -.36, fov: 66 };
// which lobby lights are on at time t (the same lobby on the screen and on CAM 11): one flickers all along; the one it
// stood under near the camera flickers while it is there; both lights on its way are out once the Screen 2 door is open
function lobbyLights(tq) {
  return [1, tq < 26 ? 1 : 0, tq >= 26 ? 0 : tq >= 19.5 ? flick(tq, 41, .9) : 1, flick(tq, 43, .7)];
}
// pools of light on the floor under the lights that are on (drawn as a far sprite so everything else covers them)
function pools(g, cam, lv) {
  g.save(); g.globalCompositeOperation = 'lighter';
  LIGHTS.forEach(([x, z], i) => {
    if (lv[i] <= 0) return;
    const c = project(cam, [x, 0, z + .3]), px = project(cam, [x + 2.4, 0, z + .3]), pz = project(cam, [x, 0, z + 2.7]); if (!c || !px || !pz) return;
    const rx = Math.hypot(px[0] - c[0], px[1] - c[1]), rz = Math.max(4, Math.hypot(pz[0] - c[0], pz[1] - c[1]));
    g.save(); g.translate(c[0], c[1]); g.scale(1, rz / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(235,228,205,${.26 * lv[i]})`); gr.addColorStop(.55, `rgba(235,228,205,${.1 * lv[i]})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore();
  });
  g.restore();
}
// the open door to Screen 2: a black gap that narrows as the door swings shut by itself
function doorGap(g, cam, t) {
  const k = clamp((t - TL.DOOR) / 1.6), w = (DOOR2.z1 - DOOR2.z0) * (1 - ease(k)); if (w < .02) return;
  const P = [[6.96, 0, DOOR2.z0], [6.96, 0, DOOR2.z0 + w], [6.96, DOOR2.h, DOOR2.z0 + w], [6.96, DOOR2.h, DOOR2.z0]].map(p => project(cam, p));
  if (P.some(p => !p)) return;
  g.fillStyle = 'rgb(4,4,6)'; poly(g, P); g.fill();
}
function lobby(g, tq, egg, figs, door) {
  const lv = lobbyLights(tq), S = egg ? LOB_EGG : LOB;
  S.lights.forEach((q, i) => { q.emit = .5 * lv[i]; });
  const sprites = [{ x: 0, y: 0, z: 60, draw: (gg, c) => pools(gg, c, lv) }];
  for (const f of figs || []) sprites.push({ x: f.x, y: 1, z: f.z, draw: (gg, c) => broken(gg, c, f) });
  const cam = TK.render(g, S, CAM11, { ambient: 1.6, fog: .05, sprites });
  if (door) doorGap(g, cam, tq);
  return cam;
}

// ---------------------------------------------------------------- it, standing (on the screen): BROKEN (owner 11/12, the series figure)
// TK.ghost 'broken': soft black, a little bigger than a person, head hanging sideways, one arm longer, two small uneven white eye
// points. On the screen it stands perfectly still, then one frame later it is somewhere else, closer, the pose changed: the head
// hangs further each time, a hand starts to come up toward the camera, and on the last jerk it leans in mid-stride.
// (a smear of faint copies on that one frame)
const STAGE = {
  1: [{ x: .6, z: 12.9, tilt: 0 }, { x: .35, z: 11.4, tilt: .18 }],
  2: [{ x: 1.0, z: 7.9, tilt: -.25 }, { x: .1, z: 6.2, tilt: .3, armR: .15 }],
  3: [{ x: -2.3, z: 4.7, tilt: -.45, armR: .2 }, { x: -3.15, z: 3.35, tilt: .5, armR: .5, charge: .14 }],
};
function figureAt(stage, tq) {
  const [a, b] = STAGE[stage], tj = TL.JERKS[stage - 1], f = Math.round((tq - tj) * FPS_CCTV);
  if (f < 0) return [a];
  if (f > 0) return [b];
  const out = [], L = (k, u) => lerp(a[k] || 0, b[k] || 0, u);                                               // the jerk frame: a smear from a to b
  for (let k = 1; k <= 4; k++) { const u = k / 5; out.push({ x: L('x', u), z: L('z', u), tilt: L('tilt', u), armR: L('armR', u), charge: L('charge', u), alpha: .22 }); }
  out.push(b);
  return out;
}
const broken = (g, cam, f) => TK.ghost(g, cam, 'broken', f.x, f.z, { tilt: f.tilt || 0, armR: f.armR || 0, charge: f.charge || 0, alpha: f.alpha ?? 1, seed: 5 });

// ---------------------------------------------------------------- it, seated in row G (seen from behind): the head turns round
// A 3D head (a skull and a long jaw, no features), turned by phi (0 faces the screen, PI faces the camera) and tilted by roll;
// the shoulders do not move. Past where a neck could go, the neck wrings (it narrows, stretches, folds catch the light); when the
// front comes round to the lens, BROKEN's two small uneven white eye points are there (nothing else: no face).
const HEADC = [SEAT_G.x, 3.53, SEAT_G.z + .05];
const SNAP_PHI = Math.atan2(CAM12.x - HEADC[0], CAM12.z - HEADC[2]) + 2 * Math.PI;      // straight at the lens: about 196 degrees
function seatedOne(g, cam, phi, roll, lampL) {
  const twist = clamp((phi - 1.35) / 1.95), stretch = .035 * twist, cr = Math.cos(roll), sr = Math.sin(roll), cp = Math.cos(phi), sp = Math.sin(phi);
  const HC = [HEADC[0], HEADC[1] + stretch, HEADC[2]];
  const toW = ([x, y, z]) => { const x1 = x * cr - y * sr, y1 = x * sr + y * cr; return [HC[0] + x1 * cp + z * sp, HC[1] + y1, HC[2] - x1 * sp + z * cp]; };
  const P = p => project(cam, p);
  const ell = (c, r) => { const out = []; for (let j = 0; j <= 8; j++) for (let i = 0; i < 16; i++) { const th = j / 8 * Math.PI, ph = i / 16 * 6.2832; const q = P(toW([c[0] + r[0] * Math.sin(th) * Math.cos(ph), c[1] + r[1] * Math.cos(th), c[2] + r[2] * Math.sin(th) * Math.sin(ph)])); if (q) out.push(q); } return hull(out); };
  const ellP = (c, r) => { const out = []; for (let j = 0; j <= 8; j++) for (let i = 0; i < 16; i++) { const th = j / 8 * Math.PI, ph = i / 16 * 6.2832; const q = P(toW([c[0] + r[0] * Math.sin(th) * Math.cos(ph), c[1] + r[1] * Math.cos(th), c[2] + r[2] * Math.sin(th) * Math.sin(ph)])); if (q) out.push(q); } return out; };
  const skull = hull(ellP([0, .035, -.03], [.078, .108, .1]).concat(ellP([0, -.07, .06], [.05, .1, .088])));   // one smooth head, longer than it is wide: a long jaw, no features
  const ring = (c, r, rot) => { const out = []; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, p = [Math.cos(a) * r, 0, Math.sin(a) * r]; const w = rot ? toW([c[0] + p[0], c[1], c[2] + p[2]]) : [c[0] + p[0], c[1], c[2] + p[2]]; const q = P(w); if (q) out.push(q); } return out; };
  const neckBot = SEAT_G.h + 1.47, neck = hull(ring([0, -.08, -.02], .056 * (1 - .36 * twist), true).concat(ring([HEADC[0], neckBot, HEADC[2]], .072 * (1 - .26 * twist), false)));
  // shoulders: from the top of the seat back in front of it (occluding line) up to bony, hunched shoulder points
  const sx = HEADC[0], sz = HEADC[2], sb = SEAT_G.h + 1.0;
  const half = [[-.3, sb + .02], [-.315, sb + .18], [-.31, sb + .3], [-.29, sb + .37], [-.24, sb + .405], [-.17, sb + .425], [-.11, sb + .46], [-.08, sb + .5], [-.066, sb + .55]];
  const top = half.concat(half.slice().reverse().map(([x, y]) => [-x, y])).map(([x, y]) => P([sx + x, y, sz]));
  const bot = [[.32, sb], [-.32, sb]].map(([x, y]) => P([sx + x, y, SEAT_G.back]));
  if ([...top, ...bot].some(p => !p) || skull.length < 3) return;
  const shoulders = top.concat(bot);
  g.save(); g.lineJoin = 'round';
  // clip to above the seat back it sits behind, then a soft halo of screen light round the silhouette
  const [b0, b1] = bot, dx = b0[0] - b1[0], dy = b0[1] - b1[1], ext = 4000;
  g.beginPath(); g.moveTo(b1[0] - dx * ext / Math.abs(dx || 1), b1[1] - dy * ext / Math.abs(dx || 1)); g.lineTo(b0[0] + dx * ext / Math.abs(dx || 1), b0[1] + dy * ext / Math.abs(dx || 1)); g.lineTo(b0[0] + ext, -ext); g.lineTo(b1[0] - ext, -ext); g.closePath(); g.clip();
  g.shadowColor = `rgba(240,240,240,${.55 * lampL})`; g.shadowBlur = 7 * SS;
  g.fillStyle = 'rgb(5,5,7)';
  for (const s of [shoulders, neck, skull]) { poly(g, s); g.fill(); }
  g.shadowColor = 'rgba(0,0,0,0)';
  for (const s of [shoulders, neck, skull]) { poly(g, s); g.fill(); }
  // folds round the wrung neck: a helix on the half that faces the camera
  if (twist > .02) {
    const az = Math.atan2(cam.x - HEADC[0], cam.z - HEADC[2]);
    g.save(); poly(g, neck); g.clip();
    g.lineWidth = 1.1 * SS; g.strokeStyle = `rgba(125,125,125,${.4 * twist * (.4 + .6 * lampL)})`;
    for (let k = 0; k < 2; k++) {
      const y0 = neckBot + .05 + k * .055 + stretch * k / 2, rr = .064 * (1 - .31 * twist);
      g.beginPath();
      for (let i = 0; i <= 12; i++) { const a = az - 1.35 + 2.7 * i / 12, q = P([HEADC[0] + Math.sin(a) * rr, y0 + (i / 12 - .5) * .09 * twist, HEADC[2] + Math.cos(a) * rr]); if (q) i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
      g.stroke();
    }
    g.restore();
  }
  // the eye points, only once the front has come round to the lens (they glow on their own: they stay when the projector dies)
  const fc = toW([0, -.02, .13]), fn = toW([0, -.02, 1.13]), n = [fn[0] - fc[0], fn[1] - fc[1], fn[2] - fc[2]];
  const v = [cam.x - fc[0], cam.y - fc[1], cam.z - fc[2]], facing = (n[0] * v[0] + n[1] * v[1] + n[2] * v[2]) / (Math.hypot(...v) * Math.hypot(...n));
  if (facing > .35) {
    const ea = clamp((facing - .35) / .4), eL = P(toW([-.033, -.012, .118])), eR = P(toW([.031, -.002, .114])), ref = P(toW([.067, -.012, .118]));
    if (eL && eR && ref) {
      const r = Math.hypot(ref[0] - eL[0], ref[1] - eL[1]) * .011 / .1;                                    // 1.1 cm in pixels
      g.save(); g.shadowColor = 'rgba(0,0,0,0)';
      g.filter = `blur(${Math.max(.6 * SS, r * .35).toFixed(2)}px)`; g.fillStyle = `rgba(255,255,255,${.95 * ea})`;
      g.beginPath(); g.ellipse(eL[0], eL[1], r, r * .8, roll, 0, 6.2832); g.ellipse(eR[0], eR[1], r * .8, r * .7, roll, 0, 6.2832); g.fill();   // not quite level
      g.filter = `blur(${Math.max(2 * SS, r * 1.6).toFixed(2)}px)`; g.fillStyle = `rgba(255,255,255,${.3 * ea})`;
      g.beginPath(); g.ellipse((eL[0] + eR[0]) / 2, (eL[1] + eR[1]) / 2, r * 6, r * 2.6, roll, 0, 6.2832); g.fill();
      g.restore();
    }
  }
  g.restore();
}
// the head's angle at CCTV time tq: held steps, a hold, then the rest of the way in one frame
function headPose(tq) {
  if (tq >= TL.SNAP - 1e-3) return [SNAP_PHI, -.34];
  let a = 0; for (const [t, d] of TL.HEAD) if (tq >= t - 1e-3) a = d;
  return [a * Math.PI / 180, 0];
}

// ---------------------------------------------------------------- the projector: its light on the screen, the beam, the spill
// lamp level per CCTV frame: dropouts more often at every return; at the end it dies
function lamp(tq, stage) {
  if (stage === 5) {
    if (tq >= TL.PROJ_DIE) { const k = tq - TL.PROJ_DIE; return .13 + .87 * Math.exp(-k / .28) * (Math.round(tq * FPS_CCTV) % 2 ? .55 : 1); }
    return tq >= TL.HEAD[0][0] && tq < TL.SNAP ? flick(tq, 57, .35) : 1;
  }
  const j = TL.JERKS[stage - 1];
  if (j != null && Math.abs(tq - j) < .01) return .45;                                                        // it moves: the lamp dips
  return flick(tq, 17 + stage, [0, .18, .3, .45, .7][stage] + (stage === 4 && tq > 31.7 ? 1.6 : 0));
}
function screenLight(g, cam, L, stage) {
  const c = [[SCR.x0, SCR.y0], [SCR.x1, SCR.y0], [SCR.x1, SCR.y1], [SCR.x0, SCR.y1]].map(([x, y]) => project(cam, [x, y, SCR.z - .01]));
  if (c.some(p => !p)) return;
  g.save();
  if (stage === 5) {                                                                                         // blank light, a hot spot in the middle
    poly(g, c); g.fillStyle = `rgb(${18 + 200 * L | 0},${18 + 200 * L | 0},${20 + 200 * L | 0})`; g.fill();
    const m = project(cam, [0, 4.1, SCR.z - .01]), r = Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]) * .55;
    g.save(); poly(g, c); g.clip(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(m[0], m[1], 0, m[0], m[1], r); gr.addColorStop(0, `rgba(255,255,255,${.25 * L})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
  } else {
    poly(g, c); g.fillStyle = `rgb(${20 + 18 * L | 0},${20 + 18 * L | 0},${22 + 18 * L | 0})`; g.fill();   // the projector's black level outside the picture
    const tl = project(cam, [FEEDQ.x0, SCR.y1, SCR.z - .02]), tr = project(cam, [FEEDQ.x1, SCR.y1, SCR.z - .02]), bl = project(cam, [FEEDQ.x0, SCR.y0, SCR.z - .02]);
    g.setTransform((tr[0] - tl[0]) / TK.TW, (tr[1] - tl[1]) / TK.TW, (bl[0] - tl[0]) / TK.TH, (bl[1] - tl[1]) / TK.TH, tl[0], tl[1]);
    g.filter = `brightness(${(1.85 * L).toFixed(3)}) contrast(.88)`; g.drawImage(FEED, 0, 0); g.filter = 'none';
  }
  g.restore();
}
// the projector beam from the booth behind the camera, faint, with dust in it
function beam(g, cam, L, tq, bright) {
  const corners = [[SCR.x0, SCR.y0], [SCR.x1, SCR.y0], [SCR.x1, SCR.y1], [SCR.x0, SCR.y1]].map(([x, y]) => [x, y, SCR.z]);
  const pc = cam.toCam(PORT), pts = [], near = [];
  for (const C of corners) {
    const cc = cam.toCam(C), zc = .9, k = pc[2] >= zc ? 0 : (zc - pc[2]) / (cc[2] - pc[2]), q = pc.map((v, i) => v + (cc[i] - v) * k);
    const a = [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2]], b = [cam.W / 2 + cam.f * cc[0] / cc[2], cam.H / 2 - cam.f * cc[1] / cc[2]];
    pts.push(a, b); near.push(a);
  }
  const H = hull(pts), m0 = near.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]), sc = project(cam, [0, 4.1, SCR.z]);
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(m0[0], m0[1], sc[0], sc[1]); gr.addColorStop(0, `rgba(230,230,225,${.05 * L * bright})`); gr.addColorStop(1, `rgba(230,230,225,${.085 * L * bright})`);
  poly(g, H); g.fillStyle = gr; g.fill();
  g.clip(); const R = TK.rng(Math.round(tq * FPS_CCTV) * 7 + 3);
  g.fillStyle = `rgba(255,255,255,${.35 * L * bright})`;
  for (let i = 0; i < 60; i++) { const u = R(), a = near[i % 4], b = [cam.W / 2, cam.H / 2]; const x = lerp(lerp(a[0], sc[0], u), R() * cam.W, .5), y = lerp(lerp(a[1], sc[1], u), R() * cam.H, .5); g.fillRect(x, y, 1.6 * SS, 1.6 * SS); }
  g.restore();
}
// the screen lights the front of the room
function spill(g, cam, L, bright) {
  const c = project(cam, [0, .4, 12.6]); if (!c) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  const r = cam.W * .5, gr = g.createRadialGradient(c[0], c[1], 10, c[0], c[1], r); gr.addColorStop(0, `rgba(80,80,82,${.5 * L * bright})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, cam.W, cam.H); g.restore();
}

// ---------------------------------------------------------------- the feed on the screen
function stamp(t) {
  const [h0, m0, s0] = TL.STAMP0, s = Math.floor(h0 * 3600 + m0 * 60 + s0 + t);
  const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60, p = n => String(n).padStart(2, '0');
  return `12-31-1999  ${p(hh)}:${p(mm)}:${p(ss)}`;
}
function makeFeed(tq, stage) {
  if (stage <= 3) {
    lobby(FRG, tq, false, figureAt(stage, tq), false);
    TK.grade(FG, FRAW, tq, 'cctv');
    TK.osd(FG, 'cctv', tq, { cam: 'CAM 11  CINEMA LOBBY', place: ' ', stamp: stamp(tq) });   // all on the left: no clash with this camera's OSD when zoomed
  } else {                                                                                                     // Screen 2 itself, someone in row G
    const cam = TK.render(FRG, AUD, CAM12, { ambient: 1.5, fog: .05, sprites: [{ x: 0, y: 4.1, z: 14.9, draw: (gg, c) => screenLight(gg, c, 1, 5) }] });
    spill(FRG, cam, 1, 1);
    seatedOne(FRG, cam, 0, 0, 1);
    TK.grade(FG, FRAW, tq, 'cctv');
    TK.osd(FG, 'cctv', tq, { cam: 'CAM 12  SCREEN 2', place: ' ', stamp: stamp(tq) });
  }
}

// ---------------------------------------------------------------- one CCTV frame into RAW (cached: CCTV runs at 6 fps)
let rawKey = '';
const segAt = t => TL.SEGS.find(s => t >= s[1] && t < s[2]) || null;
function drawRaw(seg, tq, egg) {
  const key = `${seg[1]}|${tq}|${egg}`; if (key === rawKey) return; rawKey = key;
  const [which, , , stage] = seg;
  if (which === 'L') { lobby(RG, tq, egg, null, stage === 'open'); return; }
  const L = lamp(tq, stage), bright = stage === 5 ? 1 : .45;
  if (stage <= 4) makeFeed(tq, stage);
  const cam = TK.render(RG, AUD, CAM12, { ambient: 1.15 + .35 * L * bright, fog: .05, sprites: [{ x: 0, y: 4.1, z: 14.9, draw: (gg, c) => screenLight(gg, c, L, stage) }] });
  spill(RG, cam, L, bright);
  beam(RG, cam, L, tq, bright);
  if (stage === 5) { const [phi, roll] = headPose(tq); seatedOne(RG, cam, phi, roll, L); }
}
// the playback zoom: show RAW scaled by s with window point (cx, cy) at the centre of the window (clamped: never a border)
function zoomTo(dst, s, cx, cy, blur = 0) {
  cx = clamp(cx, W2 / s, TK.TW - W2 / s); cy = clamp(cy, H2 / s, TK.TH - H2 / s);
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.fillStyle = '#000'; dst.fillRect(0, 0, TK.TW, TK.TH);
  const k = s / SS; dst.imageSmoothingQuality = 'high';
  if (blur > .05) dst.filter = `blur(${blur.toFixed(2)}px)`;
  dst.setTransform(k, 0, 0, k, W2 - cx * s, H2 - cy * s); dst.drawImage(RAW, 0, 0); dst.setTransform(1, 0, 0, 1, 0, 0); dst.filter = 'none';
}
const camOf = which => Object.assign({}, which === 'L' ? CAM11 : CAM12);
let FOCUS = null;                                                                                              // window-space targets, worked out once
function focusPoints() {
  const g = mk(TK.TW, TK.TH).getContext('2d');
  const c12 = TK.render(g, new TK.Scene(), CAM12), c11 = TK.render(g, new TK.Scene(), CAM11);
  const p = (c, w) => project(c, w).slice(0, 2);
  return { screen: p(c12, [0, 4.0, SCR.z]), screenLow: p(c12, [0, 2.9, SCR.z]), rowG: p(c12, [SEAT_G.x, 3.7, SEAT_G.z + 2]), head: p(c12, [HEADC[0], HEADC[1] - .14, HEADC[2]]),
    l1: p(c11, [.6, 1.2, 12.9]), l2: p(c11, [1.0, 1.0, 7.9]), open: p(c11, [6.5, 1.6, 10.3]) };
}
function zoomFor(seg, si, t) {
  const F = FOCUS || (FOCUS = focusPoints()), [z0, z1] = TL.ZOOM[si], k = Math.pow(clamp((t - seg[1]) / (seg[2] - seg[1])), 1.15);
  const fixed = (f, s) => [f[0] + (W2 - f[0]) / s, f[1] + (H2 - f[1]) / s];                                     // zoom about a point that stays put
  if (seg[3] === 5) {                                                                                          // wide, then the crash zoom onto the head, then creep
    const [c0, c1] = TL.CRASH, kc = ease((t - c0) / (c1 - c0)), s = t < c0 ? 1 : t < c1 ? lerp(1, 2.8, kc) : 2.8 + .35 * clamp((t - c1) / (TL.END - c1));
    const c = [lerp(W2, F.head[0], kc), lerp(H2, F.head[1], kc)];
    return { s, c, blur: t >= c0 && t < c1 + .05 ? 3.5 : 0 };
  }
  const f = seg[0] === 'L' ? F[seg[3]] : seg[3] === 4 ? F.rowG : seg[3] === 1 ? F.screen : F.screenLow, s = lerp(z0, z1, k);
  return { s, c: fixed(f, s), blur: 0 };
}

// ---------------------------------------------------------------- tape damage, transitions
function glitchAt(t) { for (const [t0, d] of TL.GLITCH) if (t >= t0 && t < t0 + d) return (t - t0) / d; return -1; }
function tear(g, t, k) {
  const R = TK.rng(Math.floor(t * 60) + 5);
  const band = 30 + R() * 120, y = R() * (TK.TH - band), dx = (R() - .5) * 140 * Math.sin(k * Math.PI);
  g.drawImage(g.canvas, 0, y, TK.TW, band, dx, y, TK.TW, band);
  const y2 = R() * TK.TH; g.drawImage(g.canvas, 0, y2, TK.TW, 40, -dx * .6, y2 + (R() - .5) * 20, TK.TW, 40);
}
// the tracking roll as the multiplexer comes back to Screen 2 and the screen shows the room: the picture rolls up
function trackingRoll(g, t, k) {
  const off = Math.floor((1 - ease(k)) * TK.TH * .9), snap = trackingRoll.c || (trackingRoll.c = mk(TK.TW, TK.TH)), sg = snap.getContext('2d');
  sg.drawImage(g.canvas, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, TK.TW, TK.TH);
  g.drawImage(snap, 0, off); g.drawImage(snap, 0, off - TK.TH);
  g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(0, off - 18, TK.TW, 36); TK.statics(g, t, .35 * (1 - k));
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const tq = Math.floor(t * FPS_CCTV) / FPS_CCTV;
  const si = TL.SEGS.findIndex(s => t >= s[1] && t < s[2]), seg = si >= 0 ? TL.SEGS[si] : null;
  const inStatic = TL.STATIC.some(([a, b]) => t >= a && t < b), black = t >= TL.BLACK[0] && t < TL.BLACK[1];
  if (inStatic || (!seg && !black)) TK.statics(WG, t, 1);
  else if (black) { WG.fillStyle = '#000'; WG.fillRect(0, 0, TK.TW, TK.TH); TK.vhs(WG, t, .5, 5); }
  else {
    const [which, , , stage] = seg, egg = which === 'L' && t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
    drawRaw(seg, tq, egg);
    const z = zoomFor(seg, si, t);
    zoomTo(WK, z.s, z.c[0], z.c[1], z.blur);
    TK.grade(WG, WORK, tq, 'cctv', { brightness: which === 'L' ? 1.2 : 1.22, contrast: 1.3 });
    const gk = glitchAt(t);
    TK.vhs(WG, tq, gk >= 0 ? 2.5 : 1, 5);
    if (gk >= 0) { tear(WG, t, gk); TK.statics(WG, t, .4 * Math.sin(gk * Math.PI)); }
    if (t >= TL.ROLL[0] && t < TL.ROLL[1]) trackingRoll(WG, t, (t - TL.ROLL[0]) / (TL.ROLL[1] - TL.ROLL[0]));
    TK.osd(WG, 'cctv', t, which === 'A' ? { cam: 'CAM 12', place: 'SCREEN 2', stamp: stamp(t) } : { cam: 'CAM 11', place: 'CINEMA LOBBY', stamp: stamp(t) });
    WG.save(); WG.font = '40px "VT323"'; WG.fillStyle = 'rgba(235,240,235,.85)'; WG.textAlign = 'left'; WG.textBaseline = 'top';
    WG.shadowColor = 'rgba(0,0,0,.8)'; WG.shadowOffsetX = 2; WG.shadowOffsetY = 2;
    WG.fillText(`PLAYBACK  x${z.s.toFixed(1)}`, 548, TK.TH - 74); WG.restore();
    for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) TK.caption(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  }
  const ra = clamp((t - .8) / .6);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: ra });
}
window.render = render;

// ---------------------------------------------------------------- sound cues
// the projector hum on every Screen 2 shot, wavering, dipping where the lamp drops out (an envelope in dB); a tick on each dropout
const A_SEGS = TL.SEGS.filter(s => s[0] === 'A'), L_SEGS = TL.SEGS.filter(s => s[0] === 'L');
const projEv = [], ticks = [];
for (const s of A_SEGS) {
  const t1 = s[3] === 5 ? TL.PROJ_DIE + .05 : s[2], env = [];
  for (let k = Math.ceil(s[1] * FPS_CCTV); k / FPS_CCTV < t1; k++) {
    const tq = k / FPS_CCTV, L = lamp(tq, s[3]), wob = 1.6 * Math.sin(tq * 2.3) + 1.1 * Math.sin(tq * 5.9 + 1);
    env.push([Math.round(tq * 1000) / 1000, Math.round((wob + (L < .2 ? -9 : L < .6 ? -4 : 0)) * 10) / 10]);
    if (L < .6 && k / FPS_CCTV > s[1] + .1) ticks.push({ type: 'lamp_tick', t: Math.round(tq * 1000) / 1000, g: L < .2 ? 1 : .55 });
  }
  projEv.push({ type: 'bed', fx: 'projector', t: s[1], t1, g: s[3] === 5 ? -29 : -26 + (s[3] - 1) * .8, fin: .02, fout: s[3] === 5 ? .04 : .02, env });
}
window.EV = [
  { type: 'static', t: 0.0, dur: .6 },
  ...projEv, ...ticks,
  ...TL.SWITCHES.map(x => ({ type: 'switch', t: x - .02 })),
  ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d, g: t0 > 32 ? 1.4 : .8 })),
  ...TL.JERKS.map((x, i) => ({ type: 'lurch', t: x, g: .7 + .25 * i })),
  { type: 'door', t: TL.DOOR },
  { type: 'roll', t: TL.ROLL[0] }, { type: 'switch', t: TL.ROLL[0] - .02 },
  { type: 'seat', t: TL.SEAT },
  { type: 'vcr_clunk', t: TL.CRASH[0] - .02 },
  { type: 'bed', fx: 'dread', t: TL.BLACK[1], t1: TL.SNAP, g: -30, fin: 2.5, fout: .01 },
  ...TL.HEAD.map(([x], i) => ({ type: 'bone_creak', t: x, g: .55 + .05 * i, pan: .12 })),
  { type: 'swell', t: TL.SNAP - 2.0, dur: 2.0 },
  { type: 'bone_crack', t: TL.SNAP, pan: .12 },
  { type: 'projector_down', t: TL.PROJ_DIE },
  { type: 'breath', t: TL.BREATH },
  { type: 'static', t: TL.END, dur: DUR - TL.END },
  { type: 'mute', t: TL.BLACK[0], t1: TL.BLACK[1] },                                     // the black frames: dead silence
  { type: 'bed', fx: 'tape_hiss', t: 0, t1: TL.BLACK[0], g: -38, fin: .3, fout: .01 },
  { type: 'bed', fx: 'tape_hiss', t: TL.BLACK[1], t1: DUR + .5, g: -40, fin: .05, fout: .3 },
];

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    render(0.7);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
