// STILL RECORDING, tape 13: "Monitor 7". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white, TK.ghost 'broken'). Script: channel/scripts/SR13_monitor_7.md
// Monitor 7 shows a room that is not in the mall. The room's fixed identity (tape 58 shows it again): a small room in
// mint-green tiles with a black band at waist height, one bare bulb swinging on its cord, a wooden chair facing the far corner,
// a wall clock stopped at 11:59, a cream door with a small dark window. On CAM 07 (black and white, 6 frames a second, played
// back by the archive) something tall stands in that corner facing the wall, its head bent over. Leon's camcorder (colour,
// hand-held, his flashlight) takes the floor plan into service level B: B-05, B-06, B-08, B-09; no B-07, no camera 7; between
// B-06 and B-08 only block wall. Scare type: IT DROPS FROM THE CEILING (a ceiling tile bursts and it drops head first and hangs
// upside down in front of him). Not movement only (9), not a hand over the lens (10), not the lights coming on (11), not hidden below (12).
// Where the room is, the tape does not say.
// Owner 11/20 (tape 8 test): the first 3 s fill the 9:16 frame, then the archive zooms out; TL.OPEN.on = false switches it off.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const W = TK.TW, H = TK.TH;
const RAW = mk(W, H), RG = RAW.getContext('2d'), LMAP = mk(W, H), LG = LMAP.getContext('2d'), FG = mk(W, H), FGG = FG.getContext('2d');
const NZ = mk(W, H), NZG = NZ.getContext('2d'), WORK = mk(W, H), WK = WORK.getContext('2d'), WIN = mk(W, H), WG = WIN.getContext('2d');
const ALB = mk(W, H), ALG = ALB.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, M = TK.motion, TAU = Math.PI * 2, PI = Math.PI;
const qf = t => Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;
const shotAt = t => TL.SHOTS.find(s => t >= s[1] && t < s[2]);
const SH = Object.fromEntries(TL.SHOTS.map(s => [s[0], s]));
const inR = (t, a) => t >= a[0] && t < a[1];
const kOf = (t, a) => clamp((t - a[0]) / (a[1] - a[0]));
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len3 = a => Math.hypot(a[0], a[1], a[2]), nrm3 = a => mul3(a, 1 / (len3(a) || 1));
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } };
const ell = (g, x, y, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.2832); g.fillStyle = fill; g.fill(); };
const rgb = (c, k = 1) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
function onQuad(g, TLp, TRp, BLp, w, h, draw) {
  if (!TLp || !TRp || !BLp) return;
  g.save(); g.transform((TRp[0] - TLp[0]) / w, (TRp[1] - TLp[1]) / w, (BLp[0] - TLp[0]) / h, (BLp[1] - TLp[1]) / h, TLp[0], TLp[1]); draw(g); g.restore();
}
function mkCam(c) {
  const f = .5 * W / Math.tan(c.fov * PI / 360), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  return Object.assign({}, c, { f, W, H, toCam(p) { const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; } });
}
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const lookAt = (from, to, fov) => { const d = sub3(to, from); return { x: from[0], y: from[1], z: from[2], yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), fov }; };
let PASS = 'lit';                                   // sprites draw lit colours, or plain albedo for the flashlight pass
function prep(q) {
  const P = q.p, c = [0, 1, 2].map(i => (P[0][i] + P[1][i] + P[2][i] + P[3][i]) / 4);
  const u = sub3(P[1], P[0]), v = sub3(P[3], P[0]);
  q.c = c; q.n = nrm3([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
}
function lit(S, light) {
  const out = new TK.Scene(), m = (c, f) => [c[0] * f[0], c[1] * f[1], c[2] * f[2]];
  out.q = S.q.map(q => { if (!q.c) prep(q); if (q.emit) return q; const f = light(q); return Object.assign({}, q, { col: m(q.col, f), textCol: q.textCol && m(q.textCol, f) }); });
  return out;
}
const pointLight = (c, n, p, a, r, down = false) => {
  const v = sub3(p, c), d = len3(v) || 1, cs = Math.abs(dot3(n, v)) / d;
  return a * (.25 + .75 * cs) / (1 + Math.pow(d / r, 2)) * (down ? clamp((p[1] - c[1]) * 1.5 + .1) : 1);
};



// ================================================================ ROOM 7 (CAM 07): x -1.5..1.5, z 0..3, 2.6 high
const RW = 1.5, RD = 3.0, RH = 2.6, TILE = .15, BAND = [1.05, 1.2], TILE_TOP = 1.8;
const CAM07 = lookAt([1.32, 2.38, .18], [-.75, 1.05, 2.45], 60);
const FIG = [-1.12, 2.66], CHAIR = [-.86, 2.3], DOORX = [.25, 1.05];
const MINT = [146, 194, 170], GROUT = [84, 96, 90];
function buildRoom() {
  const S = new TK.Scene(), R = TK.rng(707);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) {
    const x = -RW + i * .3, z = j * .3;
    S.quad([[x, 0, z], [x + .3, 0, z], [x + .3, 0, z + .3], [x, 0, z + .3]], (i + j) & 1 ? [70, 72, 70] : [176, 176, 168], { floor: true });
  }
  // a wall: grout behind, tiles inset to 1.8 m (a black band at waist height), cream plaster above; P(u, y) maps along the wall
  const wall = (P, len, skip) => {
    for (let u0 = 0; u0 < len - 1e-6; u0 += .5) S.quad([P(u0, 0), P(Math.min(len, u0 + .5), 0), P(Math.min(len, u0 + .5), TILE_TOP), P(u0, TILE_TOP)], GROUT, { grout: true, floor: true });   // (drawn first, under the tiles)
    for (let u = 0; u < len - 1e-6; u += TILE) for (let y = 0; y < TILE_TOP - 1e-6; y += TILE) {
      if (skip && skip(u + TILE / 2, y + TILE / 2)) continue;
      const band = y >= BAND[0] - 1e-6 && y < BAND[1] - 1e-6, c = band ? [26, 30, 28] : MINT.map(v => v * (.94 + R() * .1)), e = .008;
      S.quad([P(u + e, y + e, .004), P(u + TILE - e, y + e, .004), P(u + TILE - e, y + TILE - e, .004), P(u + e, y + TILE - e, .004)], c, { tile: true });
    }
    for (let u0 = 0; u0 < len - 1e-6; u0 += .5) { if (skip && skip(u0 + .25, 2.0)) continue; S.quad([P(u0, TILE_TOP), P(Math.min(len, u0 + .5), TILE_TOP), P(Math.min(len, u0 + .5), RH), P(u0, RH)], [200, 194, 176]); }
  };
  const inDoor = (u, y) => u > DOORX[0] + RW - .02 && u < DOORX[1] + RW + .02 && y < 2.08;
  wall((u, y, d = 0) => [-RW + u, y, RD - d], 2 * RW, inDoor);                                   // back wall (z 3), the door in it
  wall((u, y, d = 0) => [-RW + d, y, RD - u], RD);                                                // left wall (x -1.5)
  wall((u, y, d = 0) => [RW - d, y, u], RD);                                                      // right wall (x 1.5)
  wall((u, y, d = 0) => [RW - u, y, d], 2 * RW);                                                  // front wall (z 0)
  for (let i = 0; i < 6; i++) S.quad([[-RW + i * .5, RH, RD], [-RW + i * .5 + .5, RH, RD], [-RW + i * .5 + .5, RH, 0], [-RW + i * .5, RH, 0]], [118, 116, 110]);
  // the door: its frame and its cream leaf (drawn per frame), the light switch
  S.box(DOORX[0] - .05, 0, RD - .03, DOORX[0], 2.12, RD, [170, 164, 146]); S.box(DOORX[1], 0, RD - .03, DOORX[1] + .05, 2.12, RD, [170, 164, 146]);
  S.box(DOORX[0] - .05, 2.07, RD - .03, DOORX[1] + .05, 2.12, RD, [170, 164, 146]);
  S.q.forEach(prep);
  return S;
}
const ROOM = buildRoom();
const BULB0 = [-.45, RH, 1.2];   // left of it on CAM 07, clear of its body and of the clock
function bulbAt(t) { const a = .2 * Math.sin(t * 2.05 + .4) + .04 * Math.sin(t * 5.1); return [BULB0[0] + Math.sin(a) * .55, RH - Math.cos(a) * .55, BULB0[2] + Math.sin(a * .7) * .08]; }
// the door leaf (angle in degrees, 0 shut, + into the room), the chair (yaw: 0 faces +z), both added per frame
function roomDynamic(S, t, door, chairYaw) {
  const n0 = S.q.length, th = door * PI / 180, hx = DOORX[1], hz = RD - .015, w = DOORX[1] - DOORX[0];
  const P = (a, y) => [hx - Math.cos(th) * a, y, hz - Math.sin(th) * a];
  S.quad([P(w, 0), P(0, 0), P(0, 2.06), P(w, 2.06)], [204, 196, 172]);
  S.quad([P(w - .25, 1.45), P(.25, 1.45), P(.25, 1.8), P(w - .25, 1.8)], [24, 26, 26]);         // its small dark window
  S.quad([P(.08, .98), P(.02, .98), P(.02, 1.04), P(.08, 1.04)], [150, 150, 140]);
  const c = Math.cos(chairYaw), s = Math.sin(chairYaw), L = (x, z) => [CHAIR[0] + x * c + z * s, CHAIR[1] - x * s + z * c];
  const box = (x0, y0, z0, x1, y1, z1, col) => { const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => L(x, z));
    S.quad(corners.map(([x, z]) => [x, y1, z]), col); for (let i = 0; i < 4; i++) { const a = corners[i], b = corners[(i + 1) % 4]; S.quad([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], col.map(v => v * .78)); } };
  const wood = [124, 86, 56];
  box(-.21, .43, -.21, .21, .47, .21, wood);
  for (const [x, z] of [[-.19, -.19], [.17, -.19], [-.19, .17], [.17, .17]]) box(x, 0, z, x + .03, .43, z + .03, wood.map(v => v * .85));
  for (const x of [-.19, .17]) box(x, .47, -.21, x + .03, .95, -.18, wood.map(v => v * .85));
  box(-.19, .7, -.21, .2, .9, -.19, wood);
  for (let i = n0; i < S.q.length; i++) prep(S.q[i]);
}
function roomLight(Lt, bulb) {
  return q => {
    const c = q.c, n = q.n;
    let w = Lt.amb + pointLight(c, n, bulb, Lt.bulb, 1.5);
    if (q.tile) w *= 1.08;
    return [w * 1.06, w * 1.0, w * .86];
  };
}
// the bulb on its cord, the clock (stopped at 11:59), drawn after the light
function roomDetails(g, cam, t, bulb, k) {
  const top = project(cam, BULB0), b = project(cam, bulb);
  if (top && b) {
    g.save(); g.strokeStyle = 'rgb(20,20,20)'; g.lineWidth = Math.max(1, cam.f * .006 / b[2]); g.beginPath(); g.moveTo(top[0], top[1]); g.lineTo(b[0], b[1]); g.stroke();
    const r = cam.f * .045 / b[2]; ell(g, b[0], b[1] + r * .3, r * .7, r, 'rgb(250,244,220)');
    g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(b[0], b[1], r * .2, b[0], b[1], r * 3.5); gr.addColorStop(0, 'rgba(255,240,200,.6)'); gr.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = gr; g.fillRect(b[0] - r * 3.5, b[1] - r * 3.5, r * 7, r * 7);
    g.restore();
  }
  onQuad(g, project(cam, [-.78, 2.28, RD - .006]), project(cam, [-.42, 2.28, RD - .006]), project(cam, [-.78, 1.92, RD - .006]), 360, 360, q => {
    const c = v => Math.min(255, v * k) | 0;
    q.beginPath(); q.arc(180, 180, 172, 0, TAU); q.fillStyle = `rgb(${c(30)},${c(30)},${c(30)})`; q.fill();
    q.beginPath(); q.arc(180, 180, 156, 0, TAU); q.fillStyle = `rgb(${c(232)},${c(228)},${c(214)})`; q.fill();
    q.strokeStyle = `rgb(${c(30)},${c(30)},${c(30)})`; q.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; q.lineWidth = 8; q.beginPath(); q.moveTo(180 + Math.sin(a) * 128, 180 - Math.cos(a) * 128); q.lineTo(180 + Math.sin(a) * 146, 180 - Math.cos(a) * 146); q.stroke(); }
    const hand = (a, l, w) => { q.lineWidth = w; q.beginPath(); q.moveTo(180, 180); q.lineTo(180 + Math.sin(a) * l, 180 - Math.cos(a) * l); q.stroke(); };
    hand((11 + 59 / 60) / 12 * TAU, 82, 14); hand(59 / 60 * TAU, 124, 9);
  });
}
// it: standing in the corner facing the wall (its eyes on the wall, so none show), its head bent over
const GH = mk(W, H), GHG = GH.getContext('2d');
function drawFigWall(g, cam, k) {
  GHG.setTransform(1, 0, 0, 1, 0, 0); GHG.clearRect(0, 0, W, H);
  const feet = project(cam, [FIG[0], 0, FIG[1]]); if (!feet) return;
  GHG.save(); GHG.translate(feet[0], 0); GHG.scale(-1, 1); GHG.translate(-feet[0], 0);
  TK.ghost(GHG, cam, 'broken', FIG[0], FIG[1], { light: .2, bend: .14, tilt: .15, armR: 0, seed: 8 });
  GHG.restore();
  GHG.save(); GHG.globalCompositeOperation = 'source-atop'; GHG.fillStyle = 'rgb(5,5,6)'; GHG.fillRect(0, 0, W, H); GHG.restore();
  g.drawImage(GH, 0, 0);
}
function roomState(t, shot) {
  if (shot === 'cctv2') return { fig: false, chairYaw: Math.atan2(CAM07.x - CHAIR[0], CAM07.z - CHAIR[1]), door: 0 };
  return { fig: true, chairYaw: Math.atan2(FIG[0] - CHAIR[0], FIG[1] - CHAIR[1]) + .1, door: shot === 'cctv3' ? 9 : 0 };
}
function roomView(g, t, shot, camSpec) {
  const st = roomState(t, shot), bulb = bulbAt(t), Lt = { amb: .12, bulb: 1.5 };
  const S = new TK.Scene(); S.q = ROOM.q.slice(); roomDynamic(S, t, st.door, st.chairYaw);
  const cam = TK.render(g, lit(S, roomLight(Lt, bulb)), camSpec, { ambient: 1, fog: .01, bg: [6, 6, 6], grid: false });
  if (st.fig) drawFigWall(g, cam, 1);
  roomDetails(g, cam, t, bulb, clamp(Lt.amb + Lt.bulb * .4));
  return cam;
}

// ================================================================ SERVICE LEVEL B (his camcorder): a corridor x -1.2..1.2, z -2..10,
// 2.6 high under a drop ceiling of 0.6 m tiles; block walls; on the left wall the doors B-05, B-06, then only wall where B-07
// would be, then B-08, B-09; two light fittings in the ceiling, one of them failing
const HW = 1.2, CH = 2.6, CLEN = 10;
const DOORS = [['B-05', .6], ['B-06', 2.2], ['B-08', 5.6], ['B-09', 7.2]], BLANK = [3.0, 5.2];
const TROFFERS = [1.4, 6.4], TILE_X = [-1.2, -.6], TILE_Z = [4.2, 4.8];
const wallColC = (y, r) => (y < 1.0 ? [92, 108, 98] : [178, 180, 168]).map(c => c * (.93 + r * .1));
function buildCorr() {
  const S = new TK.Scene(), R = TK.rng(13);
  for (let i = -4; i < 20; i++) for (let j = 0; j < 6; j++) {
    const z = i * .5, x = -HW + j * .4;
    S.quad([[x, 0, z], [x + .4, 0, z], [x + .4, 0, z + .5], [x, 0, z + .5]], [[128, 126, 120], [119, 117, 112], [124, 122, 116]][(i * 7 + j * 3 + 30) % 3], { floor: true });
  }
  const inDoor = z => DOORS.some(([, z0]) => z > z0 - .02 && z < z0 + .92);
  for (const s of [-1, 1]) {
    const x = s * HW;
    for (let row = 0; row < 13; row++) {
      const y0 = row * .2, y1 = Math.min(CH, y0 + .2), off = row % 2 ? .2 : 0;
      for (let z0 = -2 - off; z0 < CLEN - 1e-6; z0 += .4) {
        const a = Math.max(-2, z0), b = Math.min(CLEN, z0 + .4); if (b - a < .01) continue;
        if (s < 0 && y0 < 2.1 - 1e-6 && inDoor((a + b) / 2)) continue;
        S.quad(s < 0 ? [[x, y0, b], [x, y0, a], [x, y1, a], [x, y1, b]] : [[x, y0, a], [x, y0, b], [x, y1, b], [x, y1, a]], wallColC(y0 + .01, R()));
      }
    }
  }
  for (const [name, z0] of DOORS) {                                                               // steel doors, frames, their signs
    const x = -HW + .005;
    S.quad([[x, 0, z0 + .9], [x, 0, z0], [x, 2.1, z0], [x, 2.1, z0 + .9]], [104, 116, 128]);
    S.box(-HW, 0, z0 - .04, -HW + .05, 2.14, z0, [70, 76, 80]); S.box(-HW, 0, z0 + .9, -HW + .05, 2.14, z0 + .94, [70, 76, 80]); S.box(-HW, 2.1, z0 - .04, -HW + .05, 2.14, z0 + .94, [70, 76, 80]);
    S.box(-HW, .98, z0 + .72, -HW + .07, 1.06, z0 + .8, [170, 170, 166]);
    S.quad([[x + .003, 2.2, z0 + .7], [x + .003, 2.2, z0 + .2], [x + .003, 2.42, z0 + .2], [x + .003, 2.42, z0 + .7]], [226, 222, 206], { sign: name });
  }
  // the drop ceiling: 0.6 m tiles in a metal grid (the tile over the blank wall drawn on its own, it moves); two troffers
  for (let i = 0; i < 4; i++) for (let j = -4; j < 17; j++) {
    const x = -HW + i * .6, z = j * .6;
    const tr = TROFFERS.some(tz => Math.abs(z + .3 - tz) < .35) && i >= 1 && i <= 2;
    S.quad([[x + .01, CH, z + .59], [x + .59, CH, z + .59], [x + .59, CH, z + .01], [x + .01, CH, z + .01]], tr ? [200, 204, 206] : [168, 166, 158], tr ? { emit: .0, troffer: true } : {});
  }
  for (let i = 0; i <= 4; i++) S.quad([[-HW + i * .6 - .008, CH - .002, CLEN], [-HW + i * .6 + .008, CH - .002, CLEN], [-HW + i * .6 + .008, CH - .002, -2], [-HW + i * .6 - .008, CH - .002, -2]], [120, 120, 118]);
  // pipes and a cable tray along the right wall; the far end
  S.box(.95, 2.3, -2, 1.12, 2.38, CLEN, [110, 112, 112]); S.box(1.0, 2.12, -2, 1.1, 2.2, CLEN, [150, 120, 70]);
  S.quad([[-HW, 0, CLEN], [HW, 0, CLEN], [HW, CH, CLEN], [-HW, CH, CLEN]], [120, 124, 118]);
  S.quad([[HW, 0, -2], [-HW, 0, -2], [-HW, CH, -2], [HW, CH, -2]], [120, 124, 118]);
  S.q.forEach(prep);
  return S;
}
const CORR = buildCorr();
function troffer(t, i) { if (i === 0) return 1; const f = Math.floor(t * 12), R = TK.rng(f * 31 + 9)(); return R < .1 ? .15 : R < .2 ? .6 : 1; }
function corrLight(Lt, t) {
  return q => {
    const c = q.c, n = q.n; let w = Lt.amb;
    const ceil = c[1] > CH - .1;
    TROFFERS.forEach((tz, i) => { w += ceil ? .35 * Lt.trof * troffer(t, i) / (1 + Math.pow(Math.hypot(c[0] + .3, c[2] - tz) / 2.2, 2)) : pointLight(c, n, [-.3, CH - .05, tz], Lt.trof * troffer(t, i), 2.6, true); });
    return [w, w * 1.01, w * 1.04];
  };
}
function figLightC(p, Lt, t) { let w = Lt.amb; TROFFERS.forEach((tz, i) => { w += pointLight(p, [0, 1, 0], [-.3, CH - .05, tz], Lt.trof * troffer(t, i), 2.6, true); }); return clamp(w, .05, 1.2); }
// the ceiling tile over the blank wall (it lifts a little at the creak, bursts down at the sting), the troffers' faces, the door signs
function corrDetails(g, cam, t, k) {
  const egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
  for (const [name, z0] of DOORS) {
    const x = -HW + .01;
    onQuad(g, project(cam, [x, 2.42, z0 + .2]), project(cam, [x, 2.42, z0 + .7]), project(cam, [x, 2.2, z0 + .2]), 500, 220, q => {
      const c = v => Math.min(255, v * k) | 0;
      q.fillStyle = `rgb(${c(226)},${c(222)},${c(206)})`; q.fillRect(0, 0, 500, 220);
      q.fillStyle = `rgb(${c(24)},${c(26)},${c(40)})`; q.font = '150px "Special Elite"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(name === 'B-06' && egg ? 'B-12' : name, 250, 118);
    });
  }
  TROFFERS.forEach((tz, i) => { const a = troffer(t, i), p = project(cam, [-.3, CH - .01, tz]); if (p) { const r = cam.f * .5 / p[2]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); gr.addColorStop(0, `rgba(236,244,248,${.8 * a})`); gr.addColorStop(1, 'rgba(236,244,248,0)'); g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r); g.restore(); } });
  if (t < TL.STING) {
    if (t >= TL.CREAK) {                                                                           // it lifts: a dark gap along the near edge, dust
      const gap = .06 + .02 * Math.sin((t - TL.CREAK) * 9), x1 = TILE_X[1], strip = (xa, xb, col) => {
        const D = [[xa, CH - .001, TILE_Z[0] + .02], [xa, CH - .001, TILE_Z[1] - .02], [xb, CH - .001, TILE_Z[1] - .02], [xb, CH - .001, TILE_Z[0] + .02]].map(p => project(cam, p));
        if (D.every(Boolean)) poly(g, D.map(p => [p[0], p[1]]), col); };
      strip(x1 - gap, x1, 'rgb(6,6,6)'); strip(x1 - gap - .02, x1 - gap, rgb([196, 192, 182], k));   // the black gap, the tile's lit edge
      const R = TK.rng(77);
      for (let i = 0; i < 14; i++) { const ph = (t - TL.CREAK + R() * .6) % .6, p = project(cam, [x1 - .01, CH - ph * ph * 4, TILE_Z[0] + .05 + R() * .5]); if (p) { g.fillStyle = `rgba(210,206,196,${.5 * (1 - ph / .6)})`; g.fillRect(p[0], p[1], 3, 3); } }
    }
  } else {
    const P = [[TILE_X[0], CH, TILE_Z[1]], [TILE_X[1], CH, TILE_Z[1]], [TILE_X[1], CH, TILE_Z[0]], [TILE_X[0], CH, TILE_Z[0]]].map(p => project(cam, p));
    if (P.every(Boolean)) poly(g, P.map(p => [p[0], p[1]]), 'rgb(6,6,6)');                       // the hole
  }
}
function corrView(g, t, camSpec, Lt, T) {
  PASS = 'lit';
  const cam = TK.render(g, lit(CORR, corrLight(Lt, t)), camSpec, { ambient: 1, fog: .012, bg: [4, 4, 5], grid: false });
  if (T && T.hand) {
    PASS = 'albedo';
    TK.render(ALG, CORR, camSpec, { ambient: 1, fog: .012, bg: [0, 0, 0], grid: false });
    torchMap(LG, cam, T);
    ALG.save(); ALG.globalCompositeOperation = 'multiply'; ALG.drawImage(LMAP, 0, 0); ALG.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(ALB, 0, 0); g.restore();
    PASS = 'lit';
  }
  corrDetails(g, cam, t, clamp(Lt.amb + Lt.trof * .55 + (T && T.hand ? .25 : 0)));
  return cam;
}

// ---------------------------------------------------------------- Leon on CAM 31 (from behind, the camcorder at his eye, the
// flashlight in his right hand)
const SHIRT = [140, 156, 182], TROUS = [34, 38, 52], CAP = [28, 32, 50], SKIN = [182, 140, 112];
function leonBack(g, cam, x, z, k, o = {}) {
  const feet = project(cam, [x, 0, z]), head = project(cam, [x, 1.8, z]); if (!feet || !head) return null;
  const u = (feet[1] - head[1]) / 1.8, C = (c, m = 1) => `rgb(${c.map(v => Math.min(255, v * k * m) | 0).join(',')})`, st = o.step || 0;
  g.save(); g.translate(feet[0], feet[1]); g.scale(u, u);
  ell(g, 0, 0, .3, .06, 'rgba(0,0,0,.3)');
  poly(g, [[-.19, -.94], [-.02, -.94], [-.04 - st * .03, -.02], [-.17 - st * .03, -.02]], C(TROUS)); poly(g, [[.02, -.94], [.19, -.94], [.17 + st * .03, -.02], [.04 + st * .03, -.02]], C(TROUS, .9));
  poly(g, [[-.22, -.97], [.22, -.97], [.22, -.9], [-.22, -.9]], 'rgb(18,18,20)');
  poly(g, [[-.25, -1.47], [.25, -1.47], [.27, -1.3], [.23, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT));
  poly(g, [[-.25, -1.47], [-.02, -1.47], [-.02, -.96], [-.23, -.96], [-.27, -1.3]], C(SHIRT, .9));
  g.strokeStyle = C(SHIRT, .7); g.lineWidth = .008; g.beginPath(); g.moveTo(0, -1.45); g.lineTo(0, -.97); g.moveTo(-.2, -1.38); g.quadraticCurveTo(0, -1.33, .2, -1.38); g.stroke();
  poly(g, [[-.22, -1.45], [-.29, -1.48], [-.46, -1.38], [-.43, -1.31], [-.29, -1.38]], C(SHIRT, .92));
  poly(g, [[-.46, -1.38], [-.42, -1.31], [-.19, -1.6], [-.15, -1.66], [-.2, -1.69]], C(SHIRT, .86));
  g.fillStyle = C([22, 22, 24]); g.fillRect(-.26, -1.76, .2, .13); g.fillStyle = C([40, 40, 44]); g.fillRect(-.08, -1.73, .06, .07);
  ell(g, -.2, -1.66, .035, .03, C(SKIN, .85));
  g.lineCap = 'round'; g.strokeStyle = C(SHIRT, .88); g.lineWidth = .1; g.beginPath(); g.moveTo(.21, -1.42); g.lineTo(.36, -1.24); g.stroke();
  g.lineWidth = .075; g.beginPath(); g.moveTo(.36, -1.24); g.lineTo(.35, -1.12); g.stroke();
  ell(g, .35, -1.11, .04, .036, C(SKIN, .8)); ell(g, .355, -1.115, .028, .028, C([30, 30, 34]));
  poly(g, [[-.05, -1.58], [.05, -1.58], [.058, -1.47], [-.058, -1.47]], C(SKIN, .7));
  ell(g, -.1, -1.655, .02, .034, C(SKIN, .85)); ell(g, .1, -1.655, .02, .034, C(SKIN, .85));
  ell(g, 0, -1.665, .1, .1, C([24, 20, 18]));
  g.beginPath(); g.moveTo(-.118, -1.69); g.bezierCurveTo(-.122, -1.86, .122, -1.86, .118, -1.69); g.closePath(); g.fillStyle = C(CAP); g.fill();
  g.fillStyle = C([70, 72, 80]); g.fillRect(-.055, -1.695, .11, .012);
  g.restore();
  if (u > 60) { g.save(); g.font = `${Math.round(.068 * u)}px "Special Elite"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C([30, 34, 52]); g.fillText('SECURITY', feet[0], feet[1] - 1.33 * u); g.restore(); }
  return { feet, u };
}

// ---------------------------------------------------------------- flashlights: the scene's albedo times a beam map, added on top
function pool(g, cam, c, ax, ay, a, rgbS = '255,232,190') {
  const p0 = project(cam, c), pu = project(cam, add3(c, ax)), pv = project(cam, add3(c, ay));
  if (!p0 || !pu || !pv || a <= 0) return;
  g.save(); g.setTransform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgbS},${a})`); gr.addColorStop(.45, `rgba(${rgbS},${a * .5})`); gr.addColorStop(1, `rgba(${rgbS},0)`);
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}
function torchMap(g, cam, T) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  for (const w of T.world || []) pool(g, cam, w.c, w.ax, w.ay, w.a);
  if (T.hand) {
    const { x, y, r, a } = T.hand, gr = g.createRadialGradient(x, y, 4, x, y, r);
    gr.addColorStop(0, `rgba(255,236,200,${a})`); gr.addColorStop(.5, `rgba(255,232,196,${a * .55})`); gr.addColorStop(1, 'rgba(255,232,196,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (T.spill) { const sp = g.createRadialGradient(x, y, 10, x, y, 760); sp.addColorStop(0, `rgba(255,232,196,${T.spill})`); sp.addColorStop(1, 'rgba(255,232,196,0)'); g.fillStyle = sp; g.fillRect(0, 0, W, H); }
  }
  g.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------- the camcorder
function handheld(t, t0, rate, walking, nerve) {
  const ph = (t - t0) * rate, step = walking ? Math.abs(Math.sin(ph * PI)) : 0;
  const n = k => Math.sin(t * 1.3 * k + k) * .6 + Math.sin(t * 2.9 * k + 2 * k) * .3 + Math.sin(t * 7.1 * k) * .1;
  const amp = .012 + .02 * nerve;
  return { y: step * .03 + n(1.1) * amp * .5, yaw: n(.9) * amp * .8 + (walking ? Math.sin(ph * PI * .5) * .015 : 0), pitch: n(1.7) * amp * .5, roll: n(.7) * amp * .6 + (walking ? Math.sin(ph * PI) * .008 : 0) };
}
function armTorch(g, hx, hy, ang, light) {
  const k = .45 + .55 * light, sl = `rgb(${72 * k | 0},${84 * k | 0},${108 * k | 0})`, sl2 = `rgb(${88 * k | 0},${100 * k | 0},${126 * k | 0})`;
  const sh = [1260, 1060], el = [lerp(sh[0], hx, .55) + 70, lerp(sh[1], hy, .55) + 40];
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = sl; g.lineWidth = 150; g.beginPath(); g.moveTo(sh[0], sh[1]); g.lineTo(el[0], el[1]); g.stroke();
  g.lineWidth = 104; g.beginPath(); g.moveTo(el[0], el[1]); g.lineTo(hx + 30, hy + 30); g.stroke();
  g.strokeStyle = sl2; g.lineWidth = 16; g.beginPath(); g.moveTo(el[0] - 30, el[1] - 40); g.lineTo(hx + 4, hy + 2); g.stroke();
  g.restore();
  const a = Math.atan2(hy - el[1], hx - el[0]);
  g.save(); g.translate(hx, hy); g.rotate(a);
  g.fillStyle = `rgb(${62 * k | 0},${72 * k | 0},${94 * k | 0})`; g.fillRect(-58, -50, 20, 100);
  ell(g, 0, 0, 52, 40, `rgb(${176 * k | 0},${136 * k | 0},${110 * k | 0})`);
  g.restore();
  g.save(); g.translate(hx, hy); g.rotate(ang);
  g.fillStyle = 'rgb(18,18,20)'; g.fillRect(-40, -17, 150, 34); g.fillStyle = 'rgb(54,54,58)'; g.fillRect(100, -22, 28, 44);
  g.fillStyle = `rgb(${190 * k | 0},${150 * k | 0},${122 * k | 0})`; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-6 + i * 22, 18, 13, 10, 0, 0, 6.2832); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------- CAM 31 playback (6 fps), by the archive
function zoomInto(dst, src, z, f, k) {
  let tx = lerp(f[0], W / 2, k), ty = lerp(f[1], H / 2, k);
  tx = clamp(tx, W - (W - f[0]) * z, f[0] * z); ty = clamp(ty, H - (H - f[1]) * z, f[1] * z);
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.fillStyle = '#000'; dst.fillRect(0, 0, W, H);
  dst.setTransform(z, 0, 0, z, tx - f[0] * z, ty - f[1] * z); dst.drawImage(src, 0, 0); dst.setTransform(1, 0, 0, 1, 0, 0);
}
function readout(g, z) {
  g.save(); g.font = '38px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,235,.88)';
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2; g.shadowOffsetY = 2; g.fillText(`PLAYBACK  x${z.toFixed(1)}`, W / 2, 32); g.restore();
}
const p2 = n => String(n).padStart(2, '0');

// ---------------------------------------------------------------- tape damage, transitions, captions, composition
function glitchAt(t) { for (let i = 0; i < TL.GLITCH.length; i++) { const [t0, d] = TL.GLITCH[i]; if (t >= t0 && t < t0 + d) return [(t - t0) / d, i]; } return null; }
function tear(g, t, amp) {
  const R = TK.rng(Math.floor(t * 60) + 9), n = 1 + Math.floor(amp * 4);
  for (let i = 0; i < n; i++) { const band = 24 + R() * 130, y = R() * (H - band), dx = (R() - .5) * 220 * amp; g.drawImage(g.canvas, 0, y, W, band, dx, y + (R() - .5) * 10 * amp, W, band); }
}
function trackingRoll(g, t, k) {
  const off = Math.floor((1 - ease(k)) * H * .9), snap = trackingRoll.c || (trackingRoll.c = mk(W, H)), sg = snap.getContext('2d');
  sg.drawImage(g.canvas, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.drawImage(snap, 0, off); g.drawImage(snap, 0, off - H);
  g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(0, off - 18, W, 36); TK.statics(g, t, .35 * (1 - k));
}
function capTop(g, text, a = 1) {
  if (!text || a <= 0) return;
  g.save(); g.globalAlpha = a; g.font = '44px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  text.split('\n').forEach((s, i) => { const w = g.measureText(s).width + 28; g.fillStyle = 'rgba(0,0,0,.82)'; g.fillRect(W / 2 - w / 2, 92 + i * 50, w, 48); g.fillStyle = '#f2f2f2'; g.fillText(s, W / 2, 117 + i * 50); });
  g.restore();
}
function gainNoise(g, t, a) {
  TK.statics(NZG, t * 1.37 + 3, 1);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .42; g.drawImage(NZ, 0, 0); g.restore();
}

function keyPose(K, t) {
  let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], k = ease(kOf(t, [a[0], b[0]]));
  const x = lerp(a[1], b[1], k), z = lerp(a[2], b[2], k), tg = lerp3(a[3], b[3], k), fov = lerp(a[4], b[4], k);
  return lookAt([x, 1.55, z], tg, fov);
}

// ---------------------------------------------------------------- the camcorder in the corridor
function corrHit(o, d) {
  let best = 1e9; const T = v => { if (v > 1e-4 && v < best) best = v; };
  if (d[1] < 0) T(-o[1] / d[1]); if (d[1] > 0) T((CH - o[1]) / d[1]);
  if (d[0] < 0) T((-HW - o[0]) / d[0]); if (d[0] > 0) T((HW - o[0]) / d[0]);
  if (d[2] > 0) T((CLEN - o[2]) / d[2]); if (d[2] < 0) T((-2 - o[2]) / d[2]);
  return add3(o, mul3(d, best > 1e8 ? 6 : best));
}
function handBeam(cc, cs, yawOff, pitchOff) {
  const yaw = cs.yaw + yawOff, pitch = cs.pitch + pitchOff, d = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const o = [cs.x + Math.cos(cs.yaw) * .22, cs.y - .38, cs.z - Math.sin(cs.yaw) * .22 + .2];
  const hit = corrHit(o, d), p = project(cc, hit), dist = len3(sub3(hit, o));
  return { x: p ? p[0] : W / 2, y: p ? p[1] : H / 2, r: cc.f * .32, a: clamp(1.4 / (1 + Math.pow(dist / 3.4, 2)), .12, 1) };
}
// keys: [t, eye x, eye z, aim point, fov]
const CAM1_KEYS = [[5.6, .25, -1.2, [-.35, 1.35, 4.0], 58], [9.0, .2, 1.5, [-.4, 1.3, 5.0], 58], [9.4, .2, 1.5, [-.2, .2, 3.0], 56],
  [13.6, .2, 1.5, [-.2, .2, 3.0], 56], [14.2, .15, 1.6, [-1.2, 1.95, 2.65], 50], [14.9, .15, 1.6, [-1.2, 1.9, 2.65], 50], [16.0, 0, 2.6, [-1.2, 1.4, 4.2], 54]];
const CAM2_KEYS = [[21.4, 0, 3.4, [-1.2, 1.4, 4.4], 54], [22.2, -.25, 4.5, [-1.2, 1.35, 4.45], 54], [24.8, -.25, 4.5, [-1.2, 1.4, 4.45], 54],
  [25.4, .6, 4.0, [-.9, 2.35, 4.5], 56], [26.0, .6, 4.0, [-.9, 2.35, 4.5], 56], [26.16, .6, 4.0, [-.9, 2.05, 4.5], 56], [27.2, .6, 4.0, [-.9, 2.05, 4.5], 56]];
function poseCam(t, shot) {
  const K = shot === 'cam1' ? CAM1_KEYS : CAM2_KEYS, cs = keyPose(K, t);
  const walking = shot === 'cam1' ? inR(t, [TL.WALK[0] + .1, TL.WALK[1] - .1]) : inR(t, TL.STEP_IN);
  const nerve = shot === 'cam1' ? .2 : t < TL.QUIET[0] ? .45 : t < TL.STING ? .15 : 1.1;
  const h = handheld(t, shot === 'cam1' ? TL.WALK[0] + .25 : TL.STEP_IN[0], 1 / .55, walking, nerve), s = .5 + .5 * cs.fov / 58;
  let yaw = cs.yaw + h.yaw * s, pitch = cs.pitch + h.pitch * s, roll = h.roll;
  if (shot === 'cam2' && t >= TL.STING) {                                                          // the jolt; then he falls back
    const u = t - TL.STING; yaw += .04 * Math.sin(u * 31) * Math.exp(-u * 3); pitch -= u < .08 ? .05 : 0;
    const r = ease(kOf(t, TL.RECOIL)); pitch -= 1.4 * r; yaw += .4 * r; roll += .35 * Math.sin(PI * r);
  }
  return { cam: { x: cs.x, y: 1.55 - h.y, z: cs.z, yaw, pitch, fov: cs.fov }, h, roll };
}
// the floor plan, held up in his hand (the arm from the bottom right): service level B, the rooms along the corridor
// (B-05, B-06, then wall, B-08, B-09), the camera list (no 07), and his own red circle and "7?" on the wall
function drawPlan(g, t, k) {
  const a = ease(kOf(t, TL.PLAN_UP)) * (1 - ease(kOf(t, TL.PLAN_DOWN))); if (a <= 0) return;
  const cx = 520, cy = lerp(1150, 500, a), w = 900, h = 620, l = clamp(.55 + .45 * k);
  armTorch(g, cx + 330, cy + 250, -1.9, .6);
  g.save(); g.translate(cx, cy); g.rotate(-.035 + .01 * Math.sin(t * 1.3));
  const C = (c, m = 1) => rgb(c, l * m);
  g.fillStyle = C([230, 226, 210]); g.fillRect(-w / 2, -h / 2, w, h);
  g.strokeStyle = C([196, 190, 172]); g.lineWidth = 2; for (const x of [-w / 6, w / 6]) { g.beginPath(); g.moveTo(x, -h / 2); g.lineTo(x, h / 2); g.stroke(); }   // the folds
  g.fillStyle = C([40, 50, 90]); g.font = '34px "Special Elite"'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('HALLOWAY GALLERIA  -  SERVICE LEVEL B', -w / 2 + 30, -h / 2 + 40);
  const y0 = -150, rw = 150, x0 = -w / 2 + 50;
  g.strokeStyle = C([40, 50, 90]); g.lineWidth = 5; g.strokeRect(x0, y0 - 120, w - 100, 300);
  g.beginPath(); g.moveTo(x0, y0 + 60); g.lineTo(x0 + w - 100, y0 + 60); g.stroke();
  const rooms = [['B-05', 0], ['B-06', 1], [null, 2], ['B-08', 3], ['B-09', 4]];
  for (const [n, i] of rooms) {
    const x = x0 + 20 + i * rw;
    if (n) { g.lineWidth = 4; g.strokeRect(x, y0 - 120, rw, 180); g.font = '40px "Special Elite"'; g.textAlign = 'center'; g.fillStyle = C([40, 50, 90]); g.fillText(n, x + rw / 2, y0 - 40); }
    else { g.fillStyle = C([40, 50, 90]); g.fillRect(x, y0 + 30, rw, 30); g.save(); g.strokeStyle = C([40, 50, 90]); g.lineWidth = 2; for (let j = 0; j < 8; j++) { g.beginPath(); g.moveTo(x + j * 20, y0 - 120); g.lineTo(x + j * 20 + 20, y0 + 30); g.stroke(); } g.restore(); }
  }
  for (const [lab, i] of [['06', 1], ['08', 3]]) { const x = x0 + 20 + i * rw + rw / 2, y = y0 + 95; g.fillStyle = C([40, 50, 90]); g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 16, y + 12); g.lineTo(x - 16, y + 12); g.closePath(); g.fill(); g.font = '26px "VT323"'; g.fillText('CAM ' + lab, x, y + 32); }
  g.font = '30px "VT323"'; g.textAlign = 'left'; g.fillStyle = C([40, 50, 90]);
  g.fillText('CAMERAS:  01 02 03 04 05 06 08 09 10 11 12 13 14 15', -w / 2 + 40, h / 2 - 110);
  g.fillText('ROOMS B-01 - B-12  (SEE KEY)', -w / 2 + 40, h / 2 - 70);
  // his red pen: a circle round the wall where B-07 would be, "7?"
  const rx = x0 + 20 + 2 * rw + rw / 2, ry = y0 - 30;
  g.strokeStyle = C([196, 30, 30]); g.lineWidth = 6; g.beginPath(); g.ellipse(rx, ry, 92, 110, -.1, 0, TAU); g.stroke();
  g.fillStyle = C([196, 30, 30]); g.font = 'italic 64px "Special Elite"'; g.textAlign = 'center'; g.fillText('7?', rx + 6, ry - 6);
  // the flashlight on it
  const gr = g.createRadialGradient(-60, -40, 40, -60, -40, 620); gr.addColorStop(0, 'rgba(255,236,190,.16)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
  g.restore();
}
// it drops head first through the burst tile, upside down, and hangs in front of the lens; the tile and its debris
const DROP = mk(W, H), DRG = DROP.getContext('2d');
// It hangs from the hole by its legs (the rest of it is above the ceiling), head down, the broken neck turned on its side,
// the arms hanging past its head toward him. Drawn in metres in a frame from the crown (0) up toward the hole (-y), at the
// depth of its head, soft black like the others (tapekit softFill look), two white points for eyes, not level.
const HANG = { x: -.9, z: 4.5, top: CH + .45, end: CH - .78 };
function hangShape(q, sway) {
  q.moveTo(.1, -.13); q.save(); q.translate(.03, -.13); q.rotate(.5); q.ellipse(0, 0, .1, .135, 0, 0, TAU); q.restore();           // the head, turned on its side
  q.moveTo(-.03, -.24); q.lineTo(.04, -.24); q.lineTo(.035, -.42); q.lineTo(-.035, -.42); q.closePath();                         // the neck
  q.moveTo(-.25, -.43); q.bezierCurveTo(-.1, -.47, .1, -.48, .24, -.45); q.lineTo(.21, -.7); q.lineTo(.17, -1.5); q.lineTo(-.17, -1.5); q.lineTo(-.22, -.7); q.closePath();
  for (const s of [-1, 1]) {
    const longer = s < 0 ? .12 : 0, sw = sway * (s < 0 ? 1 : .7), sh = [s * .22, -.44], el = [s * .33 + sw * .2, -.04], wr = [s * .27 + sw * .5, .33 + longer];
    const seg = (a, b, w0, w1) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      q.moveTo(a[0] + nx * w0, a[1] + ny * w0); q.lineTo(b[0] + nx * w1, b[1] + ny * w1); q.lineTo(b[0] - nx * w1, b[1] - ny * w1); q.lineTo(a[0] - nx * w0, a[1] - ny * w0); q.closePath(); };
    seg(sh, el, .065, .05); seg(el, wr, .05, .033);
    for (let f = -2; f <= 2; f++) seg(wr, [wr[0] + f * .028 + sw * .1, wr[1] + .2 - Math.abs(f) * .03], .012, .005);              // long fingers
  }
}
function drawDrop(g, cam, t) {
  if (t < TL.STING) return;
  const u0 = t - TL.STING, d = clamp(u0 / .12), y = d < 1 ? lerp(HANG.top, HANG.end, d * d) : HANG.end + .07 * Math.sin((u0 - .12) * 19) * Math.exp(-(u0 - .12) * 6);
  const sway = .06 * Math.sin(u0 * 2.3) * Math.min(1, u0 * 2);
  const crown = project(cam, [HANG.x + sway * .3, y, HANG.z]), up = project(cam, [HANG.x, y + 1, HANG.z]);
  const near = [[TILE_X[1], CH, TILE_Z[0]], [TILE_X[1], CH, TILE_Z[1]]].map(p => project(cam, p));
  // the tile and its pieces falling past
  const hole = project(cam, [(TILE_X[0] + TILE_X[1]) / 2, CH, (TILE_Z[0] + TILE_Z[1]) / 2]);
  if (hole) {
    const R = TK.rng(41);
    for (let i = 0; i < 9; i++) {
      const x = hole[0] + (R() - .5) * 300 + (R() - .5) * 260 * u0, yy = hole[1] + 2200 * u0 * u0 * (1 + R()) + R() * 50, sz = 24 + R() * 60;
      g.save(); g.translate(x, yy); g.rotate(R() * 3 + u0 * (R() - .5) * 8); g.fillStyle = i < 3 ? 'rgb(132,130,122)' : 'rgb(96,94,88)'; g.fillRect(-sz / 2, -sz / 4, sz, sz / 2); g.restore();
    }
  }
  if (!crown || !up) return;
  const u = cam.f / crown[2], ang = -Math.atan2(up[0] - crown[0], crown[1] - up[1]);
  DRG.setTransform(1, 0, 0, 1, 0, 0); DRG.clearRect(0, 0, W, H);
  DRG.save();
  if (near.every(Boolean)) {                                                                       // nothing of it shows above the ceiling
    const [A, B] = near, dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ex = dx / L * 4000, ey = dy / L * 4000;
    let nx = -dy / L, ny = dx / L; if ((crown[0] - A[0]) * nx + (crown[1] - A[1]) * ny < 0) { nx = -nx; ny = -ny; }
    DRG.beginPath(); DRG.moveTo(A[0] - ex, A[1] - ey); DRG.lineTo(B[0] + ex, B[1] + ey); DRG.lineTo(B[0] + ex + nx * 4000, B[1] + ey + ny * 4000); DRG.lineTo(A[0] - ex + nx * 4000, A[1] - ey + ny * 4000); DRG.closePath(); DRG.clip();
  }
  DRG.translate(crown[0], crown[1]); DRG.rotate(ang); DRG.scale(u, u);
  DRG.fillStyle = 'rgb(5,5,6)';
  const px = new Proxy(DRG, { get(o, k) {                                                          // every part filled on its own
    if (k === 'moveTo') return (a, b) => { o.fill(); o.beginPath(); o.moveTo(a, b); };
    if (k === 'ellipse') return (...a) => { o.fill(); o.beginPath(); o.ellipse(...a); };
    const v = o[k]; return typeof v === 'function' ? v.bind(o) : v; } });
  DRG.beginPath(); hangShape(px, sway); DRG.fill();
  DRG.restore();
  g.save();
  g.filter = `blur(${Math.max(3, u * .07).toFixed(1)}px)`; g.globalAlpha = .5; g.drawImage(DROP, 0, 0);
  g.filter = `blur(${Math.max(1, u * .008).toFixed(1)}px)`; g.globalAlpha = 1; g.drawImage(DROP, 0, 0);
  g.filter = 'none';
  // the eyes, on the upside-down face
  g.translate(crown[0], crown[1]); g.rotate(ang); g.scale(u, u); g.translate(.03, -.13); g.rotate(.5);
  g.filter = `blur(${Math.max(.6, u * .003).toFixed(1)}px)`; g.fillStyle = 'rgba(255,255,255,.95)';
  g.beginPath(); g.ellipse(-.032, .03, .011, .009, 0, 0, TAU); g.ellipse(.03, .022, .009, .008, 0, 0, TAU); g.fill();
  g.filter = `blur(${Math.max(2, u * .02).toFixed(1)}px)`; g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(0, .028, .07, .022, 0, 0, TAU); g.fill();
  g.restore();
  if (u0 < .2) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(200,196,186,${.25 * (1 - u0 / .2)})`; g.fillRect(0, 0, W, H); g.restore(); }   // the dust burst
}
function shotCam(g, fg, t, shot) {
  const P = poseCam(t, shot), cs = P.cam, cc = mkCam(cs);
  const T = { hand: handBeam(cc, cs, .03, shot === 'cam2' && t > TL.LOOK_UP[0] ? -.25 : -.1), spill: .08 };
  const Lt = { amb: .07, trof: .95 };
  corrView(g, t, cs, Lt, T);
  if (shot === 'cam2') drawDrop(g, cc, t);
  fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, W, H);
  const light = clamp(.3 + Lt.trof * .3);
  if (shot === 'cam1') drawPlan(fg, t, light);
  const planUp = shot === 'cam1' && t > TL.PLAN_UP[0] && t < TL.PLAN_DOWN[1];
  if (!planUp && !(shot === 'cam2' && t >= TL.RECOIL[0])) {
    let hx = 915 + P.h.yaw * -120, hy = 712 + P.h.y * 380;
    const hk = shot === 'cam2' ? ease(kOf(t, [TL.HAND[0], TL.HAND[0] + .4])) * (1 - ease(kOf(t, [TL.HAND[1], TL.HAND[1] + .4]))) : 0;
    if (hk > 0) { hx = lerp(hx, 470, hk); hy = lerp(hy, 470, hk); }                                  // his hand on the blocks
    const vp = project(cc, add3([cs.x, cs.y, cs.z], [Math.sin(cs.yaw + .03) * 6, -.3, Math.cos(cs.yaw + .03) * 6])) || [540, 430];
    armTorch(fg, hx, hy, Math.atan2(vp[1] - hy, vp[0] - hx), light);
  }
  let bgBlur = 6 * Math.exp(-(t - SH[shot][1]) / .2), fgBlur = 0, noise = .14;
  if (planUp) bgBlur = Math.max(bgBlur, 3.5 * ease(kOf(t, TL.PLAN_UP)) * (1 - ease(kOf(t, TL.PLAN_DOWN))));
  if (shot === 'cam2' && t >= TL.RECOIL[0]) { bgBlur = 7 * Math.sin(PI * clamp(kOf(t, TL.RECOIL) * 1.2)); noise = .25; }
  return { roll: P.roll, bgBlur, fgBlur, noise, bright: 1.12 };
}

// ---------------------------------------------------------------- CAM 07 playback (6 fps), by the archive
function stampAt(shot, tq) {
  const base = shot === 'cctv1' ? TL.STAMP1 : shot === 'cctv2' ? TL.STAMP2 : TL.STAMP3;
  const s = base[0] * 3600 + base[1] * 60 + base[2] + Math.floor(tq - SH[shot][1]);
  return `${TL.DATE}  ${p2(Math.floor(s / 3600) % 24)}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`;
}
let FIG07 = null, CHAIR07 = null;
function cctvZoom(shot, t) {
  if (shot === 'cctv1') return { z: 1.35, f: FIG07, k: .6 };
  if (shot === 'cctv2') { const k = ease(kOf(t, TL.PUSH2)); return { z: lerp(1, 1.8, k), f: [lerp(W / 2, CHAIR07[0], k), lerp(H / 2, CHAIR07[1], k)], k: .6 * k }; }
  const k = ease(kOf(t, TL.PUSH3)); return { z: lerp(1, 1.35, k), f: [lerp(W / 2, FIG07[0], k), lerp(H / 2, FIG07[1], k)], k: .6 * k };
}
const zoomCentre = Z => { let tx = lerp(Z.f[0], W / 2, Z.k), ty = lerp(Z.f[1], H / 2, Z.k); tx = clamp(tx, W - (W - Z.f[0]) * Z.z, Z.f[0] * Z.z); ty = clamp(ty, H - (H - Z.f[1]) * Z.z, Z.f[1] * Z.z); return [tx, ty]; };
function shotCctv(shot, t, opening) {
  const tq = qf(t);
  roomView(RG, tq, shot, CAM07);
  const Z = cctvZoom(shot, t);
  zoomInto(WK, RAW, Z.z, Z.f, Z.k);
  TK.grade(WG, WORK, tq, 'cctv', { brightness: 1.5 });
  const gk = glitchAt(t); TK.vhs(WG, tq, gk ? 2.5 : 1, 5);
  if (gk) { tear(WG, t, Math.sin(gk[0] * PI)); TK.statics(WG, t, .4 * Math.sin(gk[0] * PI)); }
  const roll = shot === 'cctv2' ? [SH.cctv2[1], SH.cctv2[1] + .3] : shot === 'cctv3' ? [SH.cctv3[1], SH.cctv3[1] + .3] : null;
  if (roll && t < roll[1]) trackingRoll(WG, t, kOf(t, roll));
  if (opening) return;
  TK.osd(WG, 'cctv', t, { cam: 'CAM 07', place: '- - - - -', stamp: stampAt(shot, tq) });
  readout(WG, Z.z);
}

// ---------------------------------------------------------------- the full-screen opening (owner 11/20 test, as tape 8): the
// first 3 s fill the 9:16 frame (the tape picture scaled to the full 1920 height, the sides cropped on the child), then the
// archive deck zooms out (0.6 s, a head-switch band rolling through) into the usual layout. TL.OPEN.on = false: off
const OSC = 1920 / H, OSW = W / OSC;
let OPEN_CX = 540;
function frameOpts(t) {
  const ak = kOf(t, [TL.ASK_T, TL.ASK_T + .7]), n = Math.ceil(ak * TL.ASK.length);
  return { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: clamp((t - .8) / .6), ask: t >= TL.ASK_T ? TL.ASK.slice(0, n) : null, askFull: TL.ASK };
}
function osdCctvBox(g, t, X, Y, Wb, Hb, s, stamp, z) {
  g.save(); g.font = `${Math.round(46 * s)}px "VT323"`; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,235,.92)';
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2 * s; g.shadowOffsetY = 2 * s;
  g.textAlign = 'left'; g.fillText('CAM 07', X + 36 * s, Y + 28 * s); g.textAlign = 'right'; g.fillText('- - - - -', X + Wb - 36 * s, Y + 28 * s);
  g.textAlign = 'left'; g.fillText(stamp, X + 36 * s, Y + Hb - 78 * s);
  if (Math.floor(t * 1.5) % 2 === 0) { g.textAlign = 'right'; g.fillStyle = 'rgba(255,70,70,.95)'; g.fillText('● REC', X + Wb - 36 * s, Y + Hb - 78 * s); }
  if (s < 1.15) { g.globalAlpha = clamp((1.15 - s) / .1); g.font = '38px "VT323"'; g.textAlign = 'center'; g.fillStyle = 'rgba(235,240,235,.88)'; g.fillText(`PLAYBACK  x${z.toFixed(1)}`, X + Wb / 2, Y + 32 * s); }   // (during the zoom-out only)
  g.restore();
}
function capAt(g, text, a, cy, s) {
  if (!text || a <= 0) return;
  g.save(); g.globalAlpha = a; g.font = `${Math.round(44 * s)}px "VT323"`; g.textAlign = 'center'; g.textBaseline = 'middle';
  text.split('\n').forEach((ln, i) => { const w = g.measureText(ln).width + 28 * s, y = cy + i * 50 * s; g.fillStyle = 'rgba(0,0,0,.82)'; g.fillRect(540 - w / 2, y - 25 * s, w, 48 * s); g.fillStyle = '#f2f2f2'; g.fillText(ln, 540, y); });
  g.restore();
}
function openingFrame(t) {
  const O = TL.OPEN, k = ease(kOf(t, [O.full, O.end]));
  if (t >= O.full) TK.frame(OUT, WIN, frameOpts(t));
  else { OUT.setTransform(1, 0, 0, 1, 0, 0); OUT.fillStyle = '#000'; OUT.fillRect(0, 0, 1080, 1920); }
  const sc = lerp(OSC, 1, k), x0 = lerp(-(OPEN_CX - OSW / 2) * OSC, 0, k), y0 = lerp(0, TK.WIN_Y, k);
  OUT.save(); OUT.imageSmoothingQuality = 'high'; OUT.drawImage(WIN, x0, y0, W * sc, H * sc);
  if (t >= O.full) {                                                                             // the deck's zoom: a head-switch band rolls through
    const a = Math.sin(PI * k), by = y0 + (H * sc) * (.15 + .8 * k);
    OUT.beginPath(); OUT.rect(x0, y0, W * sc, H * sc); OUT.clip();
    TK.statics(NZG, t * 1.37 + 7, 1); OUT.globalAlpha = .55 * a; OUT.drawImage(NZ, 0, 0, W, 40, 0, by - 26 * sc, 1080, 52 * sc);
    OUT.globalAlpha = .7 * a; OUT.fillStyle = 'rgb(235,235,230)'; OUT.fillRect(0, by + 28 * sc, 1080, 3);
  }
  OUT.restore();
  const shot = shotAt(t)[0], Z = cctvZoom(shot, t);
  osdCctvBox(OUT, t, 0, lerp(150, TK.WIN_Y, k), 1080, lerp(1560, H, k), lerp(1.4, 1, k), stampAt(shot, qf(t)), Z.z * sc);
  for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) capAt(OUT, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06), lerp(300, TK.WIN_Y + 117, k), lerp(1.3, 1, k));
}
function capTopML(g, text, a = 1) { capAt(g, text, a, 117, 1); }
function camcorder(shot, t) {
  const r = shotCam(RG, FGG, t, shot);
  WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, W, H);
  WK.translate(540, 405); WK.rotate(r.roll || 0); WK.scale(1.05, 1.05); WK.translate(-540, -405);
  WK.filter = `blur(${(r.bgBlur || 0).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0);
  WK.filter = `blur(${(r.fgBlur || 0).toFixed(2)}px)`; WK.drawImage(FG, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
  TK.grade(WG, WORK, t, 'camcorder', { brightness: (r.bright || 1) * (.98 + .04 * Math.sin(t * 1.7) + .03 * Math.sin(t * 4.3)) });
  if (r.noise) gainNoise(WG, t, r.noise);
  const gk = glitchAt(t); TK.vhs(WG, t, gk ? 2.2 : .9, 6);
  if (gk) { tear(WG, t, Math.sin(gk[0] * PI)); TK.statics(WG, t, .35 * Math.sin(gk[0] * PI)); }
  TK.osd(WG, 'camcorder', t, { time: shot === 'cam1' ? 'AM 1:12' : 'AM 1:14', date: 'DEC.08.1999', battery: 1 });
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const s = shotAt(t), inStatic = !s || TL.STATIC.some(([a, b]) => t >= a && t < b);
  const opening = !!(TL.OPEN && TL.OPEN.on && s && s[0] === 'cctv1' && t < TL.OPEN.end);
  if (inStatic) TK.statics(WG, t, 1);
  else if (s[0].startsWith('cctv')) shotCctv(s[0], t, opening);
  else camcorder(s[0], t);
  if (opening) return openingFrame(t);
  if (!inStatic) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) capTopML(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  TK.frame(OUT, WIN, frameOpts(t));
}
window.render = render;


// ---------------------------------------------------------------- sound cues (natural sound only)
// CAM 07's own mic hears only the room: the bulb's hum and the creak of its cord at each swing (no mall, no ventilation: it
// is not in the mall). His camcorder hears service level B: the light fittings' buzz, the ventilation, his steps, breath,
// hands, the floor plan; the ceiling tile's creak, then its crash. space: close (at his mic), shop (where the camera is),
// hall (far), tape / archive (after the recording chain)
function buildEvents() {
  const EV = [], cq = x => +(Math.ceil(x * FPS_CCTV - 1e-6) / FPS_CCTV).toFixed(3);
  EV.push(
    { type: 'bed', fx: 'bulb_swing', space: 'shop', t: 0, t1: SH.cctv1[2], g: -27, fin: .01, fout: .01 },
    // S2: service level B
    { type: 'bed', fx: 'fluor_hum', space: 'shop', t: SH.cam1[1], t1: SH.cam1[2], g: -35, fin: .02, fout: .01 },
    { type: 'bed', fx: 'duct_hum', space: 'hall', t: SH.cam1[1], t1: SH.cam1[2], g: -40, fin: .02, fout: .01 },
    { type: 'bed', fx: 'breath_bed', space: 'close', t: SH.cam1[1] + .3, t1: SH.cam1[2], g: -34, fin: .5, fout: .02 },
    ...TL.STEPS.filter(x => x < SH.cam1[2]).map((t, i) => ({ type: 'step', t, g: .8, pan: i % 2 ? .1 : -.1 })),
    { type: 'paper', t: TL.PLAN_UP[0] }, { type: 'paper', t: TL.PLAN_DOWN[0], g: .7 },
    { type: 'rustle', t: TL.TO_WALL[0] + .05, g: .4 },
    // S3: CAM 07: the room again; its door opens a crack
    { type: 'vcr', t: SH.cctv2[1] },
    { type: 'bed', fx: 'bulb_swing', space: 'shop', t: SH.cctv2[1], t1: SH.cctv2[2], g: -27, fin: .01, fout: .01 },
    // S4: at the wall: his hand on the blocks; a ceiling tile creaks over him; near silence; it drops through
    { type: 'bed', fx: 'fluor_hum', space: 'shop', t: SH.cam2[1], t1: TL.QUIET[0], g: -35, fin: .02, fout: .25 },
    { type: 'bed', fx: 'near_breath', space: 'close', t: SH.cam2[1] + .1, t1: TL.QUIET[0], g: -31, fin: .3, fout: .2 },
    ...TL.STEPS.filter(x => x >= SH.cam2[1]).map((t, i) => ({ type: 'step', t, g: .8, pan: i % 2 ? .1 : -.1 })),
    { type: 'knock', t: TL.HAND[0] + .45, g: .5 }, { type: 'knock', t: TL.HAND[0] + .75, g: .45 },
    { type: 'creak', t: TL.CREAK, g: .7 }, { type: 'rustle', t: TL.LOOK_UP[0] + .05, g: .3 },
    { type: 'scuff', t: TL.LOOK_UP[0] + .08, g: .45, pan: .1 }, { type: 'scuff', t: TL.LOOK_UP[0] + .42, g: .4, pan: -.1 },   // he backs off from the wall
    { type: 'crash', t: TL.STING - .01 }, { type: 'crash', t: TL.STING + .05, g: 1, pan: .2 }, { type: 'thump', t: TL.STING + .1 }, { type: 'gasp', t: TL.STING + .06 },
    { type: 'scuff', t: TL.RECOIL[0] + .02, g: .9 }, { type: 'handling', t: TL.RECOIL[0] + .06, g: .9 },
    // S5: CAM 07: the room, as at the start
    { type: 'vcr', t: SH.cctv3[1] },
    { type: 'bed', fx: 'bulb_swing', space: 'shop', t: SH.cctv3[1], t1: TL.END, g: -27, fin: .01, fout: .02 },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    const c07 = mkCam(CAM07);
    FIG07 = project(c07, [FIG[0], 1.2, FIG[1]]);
    CHAIR07 = project(c07, [CHAIR[0], .7, CHAIR[1]]);
    OPEN_CX = zoomCentre(cctvZoom('cctv1', 0))[0];
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
