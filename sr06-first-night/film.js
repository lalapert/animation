// STILL RECORDING, tape 6: "First Night". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white, TK.ghost). Script: channel/scripts/SR06_first_night.md
// Leon's camcorder (colour, handheld: step bob, sway, focus hunting, exposure pumping, his flashlight and hand in frame) is cut
// against CAM 09 (black and white, 6 frames a second). The camcorder never sees the mannequin; CAM 09 always does, behind him.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const RAW = mk(TK.TW, TK.TH), RG = RAW.getContext('2d'), WORK = mk(TK.TW, TK.TH), WK = WORK.getContext('2d'), WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6;
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const shotAt = t => TL.SHOTS.find(s => t >= s[1] && t < s[2]);

// ---------------------------------------------------------------- the Fashion 99 fitting rooms (as tape 2)
const CX = 1.5, HEM = .36, STALL_W = 1.2, z0 = k => 1.4 + (k - 1) * 1.3;
const S3 = { a: z0(3), b: z0(3) + STALL_W };
const CAM09 = { x: -1.42, y: 2.5, z: 3.0, yaw: 1.06, pitch: -.36, fov: 64 };
// o.stall / o.ceil: light levels 0..1 (flicker, lights out); o.flutter: curtain 3 sways (radians of phase, amplitude in m)
function buildFit(open, o = {}) {
  const stall = o.stall ?? 1, ceil = o.ceil ?? 1, fl = o.flutter || 0;
  const S = new TK.Scene(), H = 2.8;
  const floor = [104, 98, 92], wall = [140, 134, 124], part = [120, 114, 106];
  for (let z = 0; z < 9; z += 1) S.quad([[-1.5, 0, z], [CX, 0, z], [CX, 0, z + 1], [-1.5, 0, z + 1]], floor, { floor: true });
  for (let z = 0; z < 9; z += 1) S.quad([[-1.5, H, z + 1], [CX, H, z + 1], [CX, H, z], [-1.5, H, z]], [74, 70, 66]);
  S.quad([[-1.5, 0, 9], [3, 0, 9], [3, H, 9], [-1.5, H, 9]], wall);
  S.quad([[-.6, .1, 8.98], [.6, .1, 8.98], [.6, 2.1, 8.98], [-.6, 2.1, 8.98]], [150, 156, 162], { tex: 'glass' });
  S.quad([[-1.5, 0, 9], [-1.5, 0, 0], [-1.5, H, 0], [-1.5, H, 9]], wall);
  S.quad([[-1.5, 0, 0], [3, 0, 0], [3, H, 0], [-1.5, H, 0]].reverse(), wall.map(v => v * .85));          // the wall behind (seen when he turns)
  for (const [za, zb] of [[.6, 3.4], [4.4, 7.6]]) {
    S.box(-1.35, 1.55, za, -1.3, 1.6, zb, [60, 60, 64]);
    for (let z = za + .1, i = 0; z < zb - .1; z += .16, i++) {
      const c = [[70, 58, 62], [52, 60, 76], [96, 92, 84], [44, 44, 48]][i % 4];
      S.quad([[-1.32, .75 + (i % 3) * .08, z], [-1.32, .75 + (i % 3) * .08, z + .13], [-1.32, 1.55, z + .13], [-1.32, 1.55, z]], c);
    }
  }
  S.quad([[CX, 2.15, 9], [CX, 2.15, 0], [CX, H, 0], [CX, H, 9]], wall);
  for (let k = 1; k <= 4; k++) {
    const a = z0(k), b = a + STALL_W, lit = k === 3;
    S.quad([[CX, 0, a], [3, 0, a], [3, 0, b], [CX, 0, b]], lit ? [200, 196, 186] : [80, 76, 72], lit ? { emit: .55 * stall } : {});
    S.quad([[3, 0, b], [3, 0, a], [3, 2.15, a], [3, 2.15, b]], lit ? [190, 186, 176] : [96, 92, 86], lit ? { emit: .45 * stall } : {});
    S.quad([[3, .3, a + .25], [3, .3, b - .25], [3, 1.9, b - .25], [3, 1.9, a + .25]], lit ? [215, 222, 228] : [110, 116, 122]);
    for (const zz of [a - .05, b + .05]) S.quad([[CX, 0, zz], [3, 0, zz], [3, 2.15, zz], [CX, 2.15, zz]], part);
    // curtain 3: closed until he pulls it (open 0..1), then bunched at the far end like the others
    const ca = k === 3 ? lerp(a, b - .22, open) : b - .22, cb = b, cc = k === 3 ? [96, 64, 72] : [86, 58, 66], dx = k === 3 ? fl : 0;
    S.quad([[CX - .01 - dx, HEM, cb], [CX - .01 - dx * .6, HEM, ca], [CX - .01, 2.1, ca], [CX - .01, 2.1, cb]], cc);
    for (let zf = ca + .09, j = 0; zf < cb - .04; zf += .15, j++) { const w = dx * (1 + .5 * Math.sin(j * 1.7)); S.quad([[CX - .015 - w, HEM, zf + .045], [CX - .015 - w, HEM, zf], [CX - .015, 2.1, zf], [CX - .015, 2.1, zf + .045]], cc.map(v => v * .7)); }
    S.quad([[CX - .02, 2.18, a + .7], [CX - .02, 2.18, a + .5], [CX - .02, 2.36, a + .5], [CX - .02, 2.36, a + .7]], [210, 205, 190], { text: String(k), textCol: [30, 28, 26] });
  }
  S.quad([[CX - .02, 2.43, 6.0], [CX - .02, 2.43, 2.9], [CX - .02, 2.63, 2.9], [CX - .02, 2.63, 6.0]], [52, 46, 40], { text: 'FITTING ROOMS', textCol: [200, 190, 160] });
  S.quad([[-.4, H - .02, 4.2], [.4, H - .02, 4.2], [.4, H - .02, 4.8], [-.4, H - .02, 4.8]], [150, 150, 140], { emit: .35 * ceil, light: true });
  return S;
}
const FIT_CLOSED = buildFit(0), FIT_OPEN = buildFit(1);
// fluorescent flicker: 1 normally, dropping out on some frames after t0 (deterministic)
function flick(t, t0, rate = 1) { if (t < t0) return 1; const f = Math.floor(t * 12), R = TK.rng(f * 31 + 7)(); return R < .22 * rate ? .05 : R < .32 * rate ? .5 : 1; }
function spill(g, cam) {
  const P = [[CX, 0, S3.a], [CX, 0, S3.b], [CX - .95, 0, S3.b + .25], [CX - .95, 0, S3.a - .25]].map(p => project(cam, p));
  if (P.some(p => !p)) return;
  const m0 = [(P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2], m1 = [(P[2][0] + P[3][0]) / 2, (P[2][1] + P[3][1]) / 2];
  const gr = g.createLinearGradient(m0[0], m0[1], m1[0], m1[1]); gr.addColorStop(0, 'rgba(235,232,215,.75)'); gr.addColorStop(.35, 'rgba(200,196,180,.3)'); gr.addColorStop(1, 'rgba(200,196,180,0)');
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr;
  g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); g.restore();
}
// shoes under curtain 3 (monitor 9, as in tape 2): a footprint and its height, toes into the stall
function shoe(g, cam, x, z, facing, rot) {
  const L = .27, Wd = .1, hh = .1, pts = [];
  for (let i = 0; i <= 16; i++) {
    const a = i / 16 * Math.PI * 2, u = Math.cos(a), v = Math.sin(a), wv = (u > 0 ? 1 : .78) * Wd / 2 * v, lu = L / 2 * u;
    pts.push([x + facing * (lu * Math.cos(rot) - wv * Math.sin(rot)), z + lu * Math.sin(rot) + wv * Math.cos(rot)]);
  }
  const top = pts.map(([px, pz]) => project(cam, [px, hh, pz])), bot = pts.map(([px, pz]) => project(cam, [px, 0, pz]));
  if (top.some(p => !p) || bot.some(p => !p)) return;
  g.fillStyle = 'rgb(8,8,10)';
  g.beginPath(); bot.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); top.slice().reverse().forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.fill();
  const hx = x - facing * L * .36, a0 = project(cam, [hx, .08, z - .045]), a1 = project(cam, [hx, .08, z + .045]), b1 = project(cam, [hx, 1.0, z + .045]), b0 = project(cam, [hx, 1.0, z - .045]);
  if (a0 && a1 && b0 && b1) { g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.lineTo(b0[0], b0[1]); g.closePath(); g.fill(); }
}
function feetUnderCurtain(g, cam) {
  const gp = [[CX, 0, S3.a], [CX, 0, S3.b], [CX, HEM, S3.b], [CX, HEM, S3.a]].map(p => project(cam, p));
  g.save(); g.beginPath(); gp.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
  for (const s of [-1, 1]) shoe(g, cam, CX + .12, 4.62 + s * .075, 1, s * .05);
  g.restore();
}

// ---------------------------------------------------------------- Leon on CAM 09: a night guard seen small from above, no face
function guard(g, cam, x, z, facing, beamTo) {
  const H = 1.82, feet = project(cam, [x, 0, z]), head = project(cam, [x, H, z]); if (!feet || !head) return;
  const u = (feet[1] - head[1]) / H, navy = 'rgb(132,146,172)', dark = 'rgb(34,36,46)', skin = 'rgb(150,118,96)';   // a light uniform shirt: on CAM 09 he must not read as the black figure
  // the flashlight beam first (under him): a cone on the floor toward beamTo
  if (beamTo) {
    const h0 = project(cam, [x + .2 * facing, 1.05, z]), f1 = project(cam, [beamTo[0], 0, beamTo[1] - .45]), f2 = project(cam, [beamTo[0], 0, beamTo[1] + .45]);
    if (h0 && f1 && f2) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(h0[0], h0[1], (f1[0] + f2[0]) / 2, (f1[1] + f2[1]) / 2); gr.addColorStop(0, 'rgba(255,248,220,.55)'); gr.addColorStop(1, 'rgba(255,248,220,.12)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(h0[0], h0[1]); g.lineTo(f1[0], f1[1]); g.lineTo(f2[0], f2[1]); g.closePath(); g.fill();
      const pool = project(cam, beamTo.length ? [beamTo[0], 0, beamTo[1]] : [x, 0, z]);
      if (pool) { const r = g.createRadialGradient(pool[0], pool[1], 2, pool[0], pool[1], .7 * u); r.addColorStop(0, 'rgba(255,248,225,.5)'); r.addColorStop(1, 'rgba(255,248,225,0)'); g.fillStyle = r; g.fillRect(pool[0] - u, pool[1] - u, 2 * u, 2 * u); }
      g.restore();
    }
  }
  g.save(); g.translate(feet[0], feet[1]); g.scale(u, u);
  const P = (pts, c) => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.fillStyle = c; g.fill(); };
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 0, .34, .07, 0, 0, 6.2832); g.fill();
  P([[-.17, -.9], [-.03, -.9], [-.05, -.03], [-.16, -.03]], dark); P([[.03, -.9], [.17, -.9], [.16, -.03], [.05, -.03]], dark);   // trousers
  P([[-.24, -1.46], [.24, -1.46], [.22, -.86], [-.22, -.86]], navy);                                                           // jacket
  P([[-.24, -1.44], [-.31, -1.0], [-.25, -.98], [-.19, -1.38]], navy); P([[.24, -1.44], [.31, -1.0], [.25, -.98], [.19, -1.38]], navy);   // sleeves
  g.fillStyle = skin; g.beginPath(); g.ellipse(-.28 * facing, -.96, .04, .05, 0, 0, 6.2832); g.fill();                         // the free hand
  g.fillStyle = 'rgb(16,16,18)'; g.fillRect(.24 * facing - .03, -1.06, .06, .16);                                             // the flashlight
  g.fillStyle = 'rgb(120,94,78)'; g.fillRect(-.045, -1.58, .09, .13);                                                          // neck (shadowed)
  g.fillStyle = 'rgb(70,56,48)'; g.beginPath(); g.ellipse(0, -1.66, .095, .115, 0, 0, 6.2832); g.fill();                        // head in shadow: no face
  P([[-.11, -1.72], [.11, -1.72], [.1, -1.8], [-.1, -1.8]], 'rgb(20,22,34)'); P([[-.02 + .1 * facing, -1.72], [.16 * facing, -1.72], [.15 * facing, -1.69], [-.02 + .1 * facing, -1.69]], 'rgb(12,12,18)');   // cap, visor
  g.restore();
}

// ---------------------------------------------------------------- the guard office: a 3x3 wall of CRT monitors
const MW = 300, MH = 225, MG = 16, MX0 = 74, MY0 = 36;
const monXY = i => [MX0 + (i % 3) * (MW + MG), MY0 + Math.floor(i / 3) * (MH + MG)];
const FEEDS = [];
function buildFeeds() {
  const specs = [
    { seed: 0, cam: { x: 3.6, y: 4.2, z: .4, yaw: -.1, pitch: -.36, fov: 80 }, name: 'MAIN ENTR' },
    { seed: 3, cam: { x: -3.2, y: 4.0, z: 2, yaw: .25, pitch: -.4, fov: 70 }, name: 'CONCOURSE' },
    { seed: 6, cam: { x: 0, y: 4.3, z: 30, yaw: Math.PI, pitch: -.42, fov: 75 }, name: 'FOOD COURT' },
    { seed: 1, cam: { x: 4.5, y: 3.8, z: 10, yaw: -.6, pitch: -.38, fov: 70 }, name: 'EAST ESC' },
    { seed: 9, cam: { x: -4.5, y: 3.6, z: 14, yaw: .7, pitch: -.35, fov: 72 }, name: 'WEST WING' },
    { seed: 4, cam: { x: 0, y: 4.0, z: 6, yaw: .05, pitch: -.3, fov: 85 }, name: 'LEVEL 2' },
    { seed: 2, cam: { x: 3, y: 3.9, z: 20, yaw: -.3, pitch: -.45, fov: 68 }, name: 'PARKING B' },
    { seed: 7, cam: { x: -2, y: 4.1, z: 8, yaw: -.2, pitch: -.37, fov: 76 }, name: 'SERVICE' },
  ];
  const raw = mk(MW, MH), rg = raw.getContext('2d');
  specs.forEach((s, i) => {
    const S = TK.concourse({ storeSeed: s.seed, lightsOn: z => ((z + s.seed * 4) % 12 === 3 ? .8 : 0) });
    TK.render(rg, S, s.cam, { ambient: 1.25, fog: .04 });
    const f = mk(MW, MH); TK.grade(f.getContext('2d'), raw, 1 + i, 'cctv'); FEEDS.push({ c: f, name: `CAM 0${i + 1}  ${s.name}` });
  });
  const cam = TK.render(rg, FIT_CLOSED, CAM09, { ambient: 1.15, fog: .05 }); spill(rg, cam); feetUnderCurtain(rg, cam);
  const f9 = mk(MW, MH); TK.grade(f9.getContext('2d'), raw, 9, 'cctv'); FEEDS.push({ c: f9, name: 'CAM 09  FASHION 99' });
}
function office(g, t) {
  g.fillStyle = 'rgb(22,21,20)'; g.fillRect(0, 0, TK.TW, TK.TH);
  g.fillStyle = 'rgb(34,32,30)'; g.fillRect(MX0 - 30, MY0 - 20, 3 * MW + 2 * MG + 60, 3 * MH + 2 * MG + 40);        // the rack
  const R = TK.rng(Math.floor(t * 30) + 77), egg = t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur;
  for (let i = 0; i < 9; i++) {
    const [x, y] = monXY(i);
    g.fillStyle = 'rgb(176,168,150)'; g.beginPath(); g.roundRect(x, y, MW, MH, 14); g.fill();                        // beige bezel
    g.fillStyle = 'rgb(150,142,126)'; g.fillRect(x + 6, y + MH - 26, MW - 12, 20);
    g.save(); g.beginPath(); g.roundRect(x + 16, y + 12, MW - 32, MH - 44, 18); g.clip();
    const F = FEEDS[i]; g.globalAlpha = .92 + R() * .08; g.drawImage(F.c, x + 16, y + 12, MW - 32, MH - 44); g.globalAlpha = 1;
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = y + 12 + ((t * 40) % 4); yy < y + MH; yy += 4) g.fillRect(x + 16, yy, MW - 32, 1.5);
    const vg = g.createRadialGradient(x + MW / 2, y + MH / 2 - 10, 40, x + MW / 2, y + MH / 2 - 10, MW * .62); vg.addColorStop(0, 'rgba(255,255,255,.05)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = vg; g.fillRect(x, y, MW, MH);
    g.font = '15px "VT323"'; g.fillStyle = 'rgba(235,235,235,.85)'; g.textBaseline = 'top'; g.fillText(F.name, x + 24, y + 18);
    g.restore();
    g.font = '18px "VT323"'; g.fillStyle = 'rgb(40,36,30)'; g.textBaseline = 'middle'; g.fillText(i === 8 && egg ? '3' : String(i + 1), x + MW / 2 - 4, y + MH - 16);
  }
  // the screens light the room: a cold glow
  g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(540, 420, 100, 540, 420, 700); gl.addColorStop(0, 'rgba(120,135,150,.10)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, TK.TW, TK.TH); g.restore();
  // the predecessor's note taped to monitor 9's bezel
  const [x9, y9] = monXY(8);
  g.save(); g.translate(x9 + 30, y9 + MH - 6); g.rotate(-.05);
  g.fillStyle = 'rgb(236,226,170)'; g.fillRect(0, 0, 170, 54); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(60, -8, 50, 14);
  g.font = '15px "Special Elite"'; g.fillStyle = 'rgb(40,36,60)'; g.textBaseline = 'top'; g.fillText('IF YOU SEE SOMETHING,', 8, 8); g.fillText('TAPE IT.', 8, 28);
  g.restore();
  g.fillStyle = 'rgb(48,38,30)'; g.fillRect(0, 770, TK.TW, 40);                                                              // the desk edge
}

// ---------------------------------------------------------------- the camcorder: his hand with the flashlight, the beam
function flashlight(g, cx, cy, r, amt) {
  g.save();
  const dk = g.createRadialGradient(cx, cy, r * .45, cx, cy, r * 1.6); dk.addColorStop(0, 'rgba(0,0,0,0)'); dk.addColorStop(1, `rgba(0,0,0,${.92 * amt})`);
  g.fillStyle = dk; g.fillRect(0, 0, TK.TW, TK.TH);
  g.globalCompositeOperation = 'lighter';
  const lt = g.createRadialGradient(cx, cy, 10, cx, cy, r); lt.addColorStop(0, `rgba(255,236,196,${.34 * amt})`); lt.addColorStop(1, 'rgba(255,236,196,0)');
  g.fillStyle = lt; g.fillRect(0, 0, TK.TW, TK.TH);
  g.restore();
}
function handInFrame(g, bob, reach = 0, tremble = 0, t = 0) {
  const jx = tremble * (Math.sin(t * 41) * 5 + Math.sin(t * 67) * 3), jy = tremble * Math.sin(t * 53) * 4;
  g.save(); g.translate(-reach * 160 + jx, bob * .6 - reach * 120 + jy);
  g.fillStyle = 'rgb(30,34,52)'; g.beginPath(); g.moveTo(1080, 640); g.lineTo(930, 700); g.lineTo(900, 810); g.lineTo(1080, 810); g.closePath(); g.fill();
  g.fillStyle = 'rgb(176,136,110)'; g.beginPath(); g.ellipse(905, 690, 46, 34, -.5, 0, 6.2832); g.fill();
  g.fillStyle = 'rgb(18,18,20)'; g.save(); g.translate(880, 668); g.rotate(-.62); g.fillRect(-120, -16, 150, 32); g.fillStyle = 'rgb(60,60,64)'; g.fillRect(-128, -20, 14, 40); g.restore();
  g.restore();
}
// a hand-held camera: step bob plus an uneven nervous drift (no two seconds alike), more when he is scared (nerve 0..1)
function handheld(t, t0, rate, walking, nerve) {
  const ph = (t - t0) * rate, step = walking ? Math.abs(Math.sin(ph * Math.PI)) : 0;
  const n = k => Math.sin(t * 1.3 * k + k) * .6 + Math.sin(t * 2.9 * k + 2 * k) * .3 + Math.sin(t * 7.1 * k) * .1;
  const amp = .012 + .02 * nerve;
  return { y: step * .035 + n(1.1) * amp * .5, yaw: n(.9) * amp * .8 + (walking ? Math.sin(ph * Math.PI * .5) * .02 : 0), pitch: n(1.7) * amp * .5, roll: n(.7) * amp * .6 + (walking ? Math.sin(ph * Math.PI) * .01 : 0) };
}

// ---------------------------------------------------------------- each camcorder shot into RAW (returns the roll)
const WALK_S = TK.concourse({ storeSeed: 8, lightsOn: z => (z % 16 === 3 ? .45 : 0) });
WALK_S.box(-6.7, 0, 13.2, -6.2, .25, 14.2, [70, 66, 60]);                       // an empty mannequin stand in the Fashion 99 window
function shotWalk(g, t) {
  const s = TL.SHOTS[1], walking = t < TL.WALK_STOP, h = handheld(t, s[1], 1.8, walking, t > TL.EXTRA_STEP ? 1 : .2);
  const k = clamp((t - s[1]) / (TL.WALK_STOP - s[1]));
  // walk, stop at the window and pan across it (the focus lands on the empty stand), then spin round at the footstep
  let yaw = lerp(.05, -.55, ease((k - .4) / .6));
  if (t >= TL.WALK_STOP) yaw = lerp(-.55, -1.05, ease((t - TL.WALK_STOP) / 1.6));
  if (t >= TL.WHIP_BACK[0]) yaw = lerp(-1.05, 2.75, ease((t - TL.WHIP_BACK[0]) / (TL.WHIP_BACK[1] - TL.WHIP_BACK[0])));
  const cam = { x: -2.4, y: 1.6 - h.y, z: 1 + ease(k) * 7.2, yaw: yaw + h.yaw, pitch: -.04 + h.pitch, fov: 62 };
  TK.render(g, WALK_S, cam, { ambient: .62, fog: .075, glassAlpha: .45, sprites: [
    { x: -6.55, z: 12.2, draw: (gg, c) => TK.ghost(gg, c, 'display', -6.55, 12.2, { ambient: .55 }) },
    { x: -6.55, z: 15.6, draw: (gg, c) => TK.ghost(gg, c, 'display', -6.55, 15.6, { ambient: .55, tilt: -.1 }) }] });
  flashlight(g, 560 + Math.sin(t * 1.3) * 40, 470 - h.y * 400, 330, 1);
  handInFrame(g, h.y * 400, 0, t > TL.EXTRA_STEP ? .6 : 0, t);
  return h.roll + (t >= TL.WHIP_BACK[0] && t < TL.WHIP_BACK[1] ? Math.sin((t - TL.WHIP_BACK[0]) / .4 * Math.PI) * .06 : 0);
}
function shotFit(g, t) {
  const s = TL.SHOTS[2], walking = t < 20.0, nerve = clamp((t - 18.5) / 2), h = handheld(t, s[1], 1.6, walking, nerve);
  const kw = clamp((t - s[1]) / (20.0 - s[1])), kt = ease((t - 19.6) / .9);
  const look = lerp(-.05, -.5, kt) + .38 * ease((t - (TL.CURTAIN - .35)) / .5);   // he looks down at the gap under the curtain, then up as he pulls it
  const stepIn = ease((t - (TL.CURTAIN - .45)) / .4);                          // he stops a step back, then steps in to pull it
  const cam = { x: lerp(-.3, .02, ease(kw)) + .5 * stepIn, y: 1.6 - h.y, z: lerp(.2, 4.15, ease(kw)), yaw: lerp(.18, 1.42, kt) + h.yaw, pitch: look + h.pitch, fov: 62 };
  const open = ease((t - TL.CURTAIN) / .45);
  const fl = t >= TL.FLUTTER[0] && t < TL.FLUTTER[1] ? Math.sin((t - TL.FLUTTER[0]) / (TL.FLUTTER[1] - TL.FLUTTER[0]) * Math.PI) * .06 * Math.sin(t * 9) : 0;
  const c = TK.render(g, open > 0 || fl ? buildFit(open, { flutter: fl, stall: .8 }) : FIT_CLOSED, cam, { ambient: .66, fog: .075 });
  spill(g, c);
  // a shadow crosses the light under curtain 3, as if someone inside moved (before he opens it)
  if (t > TL.FLUTTER[0] + .3 && t < TL.FLUTTER[0] + .75) {
    const u = (t - TL.FLUTTER[0] - .3) / .45, P = [[CX + .02, 0, lerp(S3.a, S3.b, u) - .25], [CX + .02, 0, lerp(S3.a, S3.b, u) + .15], [CX - .7, 0, lerp(S3.a, S3.b, u) + .25], [CX - .7, 0, lerp(S3.a, S3.b, u) - .35]].map(p => project(c, p));
    if (P.every(Boolean)) { g.fillStyle = 'rgba(0,0,0,.65)'; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); }
  }
  if (open > .5) {
    const m = project(c, [3, 1.1, (S3.a + S3.b) / 2]);
    if (m) { g.save(); g.globalCompositeOperation = 'lighter'; const r = g.createRadialGradient(m[0], m[1], 4, m[0], m[1], 95); r.addColorStop(0, `rgba(255,250,230,${.3 * open})`); r.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = r; g.fillRect(0, 0, TK.TW, TK.TH); g.restore(); }
  }
  flashlight(g, 540 + Math.sin(t * 1.1) * 30, 470 - h.y * 400, 340, 1 - .4 * open);
  const reach = clamp((t - (TL.CURTAIN - .35)) / .3) * (1 - clamp((t - (TL.CURTAIN + .8)) / .4));
  handInFrame(g, h.y * 400, reach, nerve, t);
  return h.roll;
}
function turnYaw(t) {
  const [w0, w1] = TL.WHIP, [b0, b1] = TL.TURN_BACK;
  if (t < w1) return lerp(1.42, -1.55, ease((t - w0) / (w1 - w0)));
  if (t < b0) return lerp(-1.55, -2.3, ease((t - w1) / 2.2));
  return lerp(-2.3, -1.0, ease((t - b0) / (b1 - b0)));                           // slowly back toward the stall... cut before it gets there
}
function shotTurn(g, t) {
  const [w0, w1] = TL.WHIP, whip = t < w1, h = handheld(t, 0, 0, false, 1);
  const base = { x: .55, y: 1.58 - h.y, z: 4.15, pitch: -.1 + h.pitch, fov: 62 };
  if (whip) {
    const tmp = shotTurn.tmp || (shotTurn.tmp = mk(TK.TW, TK.TH)), tg = tmp.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, TK.TW, TK.TH);
    for (let i = 0; i < 5; i++) { TK.render(tg, FIT_OPEN, Object.assign({ yaw: turnYaw(t - i * .018) + h.yaw }, base), { ambient: .66, fog: .075 }); g.globalAlpha = 1 / (i + 1); g.drawImage(tmp, 0, 0); }
    g.globalAlpha = 1;
  } else TK.render(g, FIT_OPEN, Object.assign({ yaw: turnYaw(t) + h.yaw }, base), { ambient: .66, fog: .075 });
  flashlight(g, 540 + Math.sin(t * 1.7) * 50, 460, 340, 1);
  handInFrame(g, h.y * 300, 0, 1, t);
  return (whip ? Math.sin((t - w0) / (w1 - w0) * Math.PI) * .07 : 0) + h.roll;
}
// the jump: its blank egg face fills CAM 09, tilted, the neck seams under it, a shoulder at the edge (screen space; graded with the rest)
function faceAtLens(g, k) {
  const skin = [232, 226, 214], cx = 560, cy = 400, rx = 250, ry = 330, rot = -.18;
  g.save();
  g.fillStyle = 'rgb(40,104,116)'; g.beginPath(); g.moveTo(-40, 810); g.quadraticCurveTo(180, 640, 470, 700); g.lineTo(700, 700); g.quadraticCurveTo(980, 650, 1120, 810); g.closePath(); g.fill();   // shoulders
  g.fillStyle = 'rgb(214,208,196)'; g.fillRect(cx - 70, cy + 250, 140, 300);                                                        // neck
  g.fillStyle = 'rgb(60,56,52)'; for (const y of [cy + 330, cy + 420]) g.fillRect(cx - 70, y, 140, 6);                             // seams
  g.translate(cx, cy); g.rotate(rot);
  g.fillStyle = `rgb(${skin.join(',')})`; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 6.2832); g.fill();
  g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 6.2832); g.clip();
  g.fillStyle = 'rgb(176,170,160)'; g.beginPath(); g.ellipse(rx * .75, ry * .1, rx * .7, ry * 1.1, 0, 0, 6.2832); g.fill();          // the shaded side
  g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.ellipse(0, ry * .15, rx * .5, ry * .18, 0, 0, 6.2832); g.fill();               // where a face would be
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-rx * .35, -ry * .45, rx * .16, ry * .1, -.4, 0, 6.2832); g.fill();   // gloss
  g.restore();
}
// the jump: BROKEN right against the lens, its sideways head and shoulders filling CAM 09, the two white points (screen space)
function brokenAtLens(g, t) {
  const u = 1650;
  g.save(); g.translate(560 - .25 * u, 405 + 1.95 * u); g.scale(u, u);
  TK.ghost._draw(g, 'broken', { u, tilt: -.25, armR: .9, armL: .5, seed: Math.floor(t * 6) });
  g.restore();
}
function shotCctv(g, tq, second) {
  const M = TK.motion;
  if (!second) {                                                                 // he looks into stall 3; it stands in the corridor behind him
    const stall = flick(tq, TL.FLICKER1, .8), ceil = tq >= TL.LIGHT_OFF1[0] && tq < TL.LIGHT_OFF1[1] ? 0 : 1;
    const tr = M.stutter(tq, FPS_CCTV, 6);
    const reach = M.creep(tr, TL.REACH[0], TL.REACH[1], 0, 1.35), neck = M.creep(tr, TL.REACH[0] + .6, TL.REACH[1], 0, .14);
    const c = TK.render(g, buildFit(1, { stall, ceil }), CAM09, { ambient: ceil ? .85 : .35, fog: .07, sprites: [
      { x: 1.0, z: 4.6, draw: (gg, cm) => guard(gg, cm, 1.0, 4.6, 1, [2.4, 4.6]) },
      { x: .3, z: 5.05, draw: (gg, cm) => TK.ghost(gg, cm, 'broken', .3, 5.05, { tilt: M.snap(tq, TL.SNAP1, 0, .45), armR: reach * .9 }) }] });   // BROKEN (owner 11/12)
    spill(g, c);
    return;
  }
  // he has turned to the corridor; it stands in stall 3, behind him. The lights flicker, die, come back: its face at the lens
  const dark = tq >= TL.DARK[0] && tq < TL.DARK[1], stall = dark ? 0 : flick(tq, TL.FLICKER2, 1.4), ceil = dark ? 0 : stall;
  const sprites = [{ x: .95, z: 4.6, draw: (gg, cm) => guard(gg, cm, .95, 4.6, -1, [-.6, 4.4]) }];
  if (!dark && tq < TL.JUMP) sprites.push({ x: 2.15, z: 4.6, draw: (gg, cm) => TK.ghost(gg, cm, 'broken', 2.15, 4.6, { tilt: M.snap(tq, TL.SNAP2, 0, -.9) }) });
  const c = TK.render(g, buildFit(1, { stall, ceil }), CAM09, { ambient: dark ? .12 : .85 * (.5 + .5 * stall), fog: .07, sprites });
  if (!dark) spill(g, c);
  if (tq >= TL.JUMP) brokenAtLens(g, tq);
}
// ---------------------------------------------------------------- tape damage, overlays, the frame
function stamp(t) {
  const [h0, m0, s0] = TL.STAMP0, s = Math.floor(h0 * 3600 + m0 * 60 + s0 + t);
  const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60, p = n => String(n).padStart(2, '0');
  return `${TL.DATE}  ${p(hh)}:${p(mm)}:${p(ss)}`;
}
function glitchAt(t) { for (const [t0, d] of TL.GLITCH) if (t >= t0 && t < t0 + d) return (t - t0) / d; return -1; }
function tear(g, t, k) {
  const R = TK.rng(Math.floor(t * 60) + 6);
  const band = 30 + R() * 120, y = R() * (TK.TH - band), dx = (R() - .5) * 140 * Math.sin(k * Math.PI);
  g.drawImage(g.canvas, 0, y, TK.TW, band, dx, y, TK.TW, band);
  const y2 = R() * TK.TH; g.drawImage(g.canvas, 0, y2, TK.TW, 40, -dx * .6, y2 + (R() - .5) * 20, TK.TW, 40);
}
// camcorder: autofocus hunts at each new shot, through the zoom, on the empty stand, and when he spins
function focusBlur(t, s) {
  let b = 7 * Math.exp(-(t - s[1]) / .22);
  if (s[0] === 'office') { const k = (t - TL.ZOOM[0]) / (TL.ZOOM[1] - TL.ZOOM[0]); if (k > 0 && k < 1.15) b += 4.5 * Math.abs(Math.sin(k * Math.PI * 1.5)); }
  if (s[0] === 'walk' && t > TL.FOCUS_HUNT[0] && t < TL.FOCUS_HUNT[1]) b += 6 * Math.abs(Math.sin((t - TL.FOCUS_HUNT[0]) / (TL.FOCUS_HUNT[1] - TL.FOCUS_HUNT[0]) * Math.PI * 2));
  if (s[0] === 'walk' && t > TL.WHIP_BACK[0] && t < TL.WHIP_BACK[1] + .3) b += 4;
  if (s[0] === 'turn' && t < TL.WHIP[1] + .3) b += 3;
  return b;
}
// in the office the log line goes at the top so it never covers monitor 9 (same style as TK.caption)
function capTop(g, text, a = 1) {
  if (!text || a <= 0) return;
  g.save(); g.globalAlpha = a; g.font = '44px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(text).width + 28; g.fillStyle = 'rgba(0,0,0,.82)'; g.fillRect(TK.TW / 2 - w / 2, 92, w, 48); g.fillStyle = '#f2f2f2'; g.fillText(text, TK.TW / 2, 117);
  g.restore();
}
// he pauses and restarts the camcorder: a few black frames with STBY, then REC
const recCut = t => TL.RECCUT.some(c => t >= c - .06 && t < c + .16);
function standby(g, t) {
  g.fillStyle = '#050506'; g.fillRect(0, 0, TK.TW, TK.TH);
  g.save(); g.font = '46px "VT323"'; g.fillStyle = 'rgba(235,240,235,.92)'; g.textBaseline = 'top'; g.fillText('STBY', 36, 30);
  g.textAlign = 'right'; g.fillText('PM 11:58'.replace('PM 11:58', 'AM 1:42'), TK.TW - 36, TK.TH - 128); g.fillText('DEC.01.1999', TK.TW - 36, TK.TH - 82); g.restore();
}
// the tracking roll into the CAM 09 playback: the picture rolls up, a noise band at the seam
function trackingRoll(g, t, k) {
  const off = Math.floor((1 - ease(k)) * TK.TH * .9), snap = trackingRoll.c || (trackingRoll.c = mk(TK.TW, TK.TH)), sg = snap.getContext('2d');
  sg.drawImage(g.canvas, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, TK.TW, TK.TH);
  g.drawImage(snap, 0, off); g.drawImage(snap, 0, off - TK.TH);
  g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(0, off - 18, TK.TW, 36); TK.statics(g, t, .35 * (1 - k));
}
// the playback zooms in slowly (an archivist leaning in): scale RAW about a point into WORK
function zoomInto(dst, src, z, fx, fy) {
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.fillStyle = '#000'; dst.fillRect(0, 0, TK.TW, TK.TH);
  dst.setTransform(z, 0, 0, z, fx * (1 - z), fy * (1 - z)); dst.drawImage(src, 0, 0); dst.setTransform(1, 0, 0, 1, 0, 0);
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const s = shotAt(t), inStatic = !s || TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) TK.statics(WG, t, 1);
  else if (recCut(t)) standby(WG, t);
  else if (s[0].startsWith('cctv')) {
    const tq = Math.floor(t * FPS_CCTV) / FPS_CCTV, second = s[0] === 'cctv2';
    shotCctv(RG, tq, second);
    const z = second ? 1.18 : lerp(1.0, 1.5, ease((t - TL.PUSH[0]) / (TL.PUSH[1] - TL.PUSH[0])));
    zoomInto(WK, RAW, z, second ? 520 : 400, second ? 430 : 440);
    TK.grade(WG, WORK, tq, 'cctv');
    const gk = glitchAt(t); TK.vhs(WG, tq, gk >= 0 ? 2.5 : 1, 6);
    if (gk >= 0) { tear(WG, t, gk); TK.statics(WG, t, .45 * Math.sin(gk * Math.PI)); }
    if (t < TL.ROLL[1]) trackingRoll(WG, t, (t - TL.ROLL[0]) / (TL.ROLL[1] - TL.ROLL[0]));
    TK.osd(WG, 'cctv', t, { cam: 'CAM 09', place: 'FASHION 99', stamp: stamp(t) });
    WG.save(); WG.font = '40px "VT323"'; WG.fillStyle = 'rgba(235,240,235,.85)'; WG.textAlign = 'center'; WG.textBaseline = 'top';
    WG.fillText(`PLAYBACK  x${z.toFixed(1)}`, TK.TW / 2, TK.TH - 74); WG.restore();
  } else {
    let roll = 0;
    if (s[0] === 'office') {
      office(RG, t);
      const z = ease((t - TL.ZOOM[0]) / (TL.ZOOM[1] - TL.ZOOM[0])), [x9, y9] = monXY(8), cx = lerp(610, x9 + MW / 2, z), cy = lerp(480, y9 + MH / 2 - 8, z), sc = lerp(1.12, 2.7, z);
      const h = handheld(t, 0, 0, false, .2), hx = h.yaw * 600, hy = h.pitch * 600;
      WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, TK.TW, TK.TH);
      WK.setTransform(sc, 0, 0, sc, 540 - cx * sc + hx, 405 - cy * sc + hy); WK.filter = `blur(${focusBlur(t, s).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      roll = s[0] === 'walk' ? shotWalk(RG, t) : s[0] === 'fit' ? shotFit(RG, t) : shotTurn(RG, t);
      WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, TK.TW, TK.TH);
      WK.translate(540, 405); WK.rotate(roll); WK.scale(1.05, 1.05); WK.translate(-540, -405);
      WK.filter = `blur(${focusBlur(t, s).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
    }
    TK.grade(WG, WORK, t, 'camcorder', { brightness: .95 + .07 * Math.sin(t * 1.7) + .04 * Math.sin(t * 4.3) });
    const gk = glitchAt(t); TK.vhs(WG, t, gk >= 0 ? 2.2 : .9, 6);
    if (gk >= 0) { tear(WG, t, gk); TK.statics(WG, t, .35 * Math.sin(gk * Math.PI)); }
    TK.osd(WG, 'camcorder', t, { time: 'AM 1:42', date: 'DEC.01.1999', battery: 2 });
  }
  if (!inStatic && !recCut(t)) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) (s && s[0] === 'office' ? capTop : TK.caption)(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  const ra = clamp((t - .8) / .6);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: ra });
}
window.render = render;

// ---------------------------------------------------------------- sound cues (owner 11/13: natural sound only)
// Everything is something in the scene, picked up by Leon's camcorder mic or CAM 09's ceiling mic during the playback:
// the monitors' whine, the mall's ventilation, his steps (on the bob of the camera), the step that is not his, the curtain
// rings, the stall light's ticks and buzz (frame by frame, as drawn), its joints, the lights dying, then something hitting
// the camera. space: close (at his mic), shop (a small room: the office, the fitting rooms), hall (the concourse), tape,
// archive (the archive's deck).
function buildEvents() {
  const SH = Object.fromEntries(TL.SHOTS.map(s => [s[0], s])), EV = [], F = 1 / FPS_CCTV;
  const cq = x => +(Math.ceil(x * FPS_CCTV - 1e-6) / FPS_CCTV).toFixed(3);         // CAM 09 shows a change on its next frame
  // his footsteps land on the low point of each step bob (handheld(): walk 1.8 steps/s from the cut, fitting rooms 1.6)
  const bob = (t0, rate, until) => { const r = []; for (let k = 0; k < 30; k++) { const t = t0 + (k + .5) / rate; if (t < until) r.push(+t.toFixed(3)); } return r; };
  const walkSteps = bob(SH.walk[1], 1.8, TL.WALK_STOP), fitSteps = bob(SH.fit[1], 1.6, 20.0);
  // CAM 09: the stall light and the ceiling light as drawn on each CCTV frame; their buzz follows them, a tick at each change
  const lightAt = tq => {
    if (tq < SH.turn[1]) { const st = flick(tq, TL.FLICKER1, .8), ce = tq >= TL.LIGHT_OFF1[0] && tq < TL.LIGHT_OFF1[1] ? 0 : 1; return [st, ce]; }
    const dark = tq >= TL.DARK[0] && tq < TL.DARK[1], st = dark ? 0 : flick(tq, TL.FLICKER2, 1.4); return [st, dark ? 0 : st];
  };
  const env1 = [], env2 = [];
  for (const [a, b, env] of [[SH.cctv1[1], SH.cctv1[2], env1], [SH.cctv2[1], TL.JUMP + .4, env2]]) {
    let prev = null;
    for (let f = Math.round(a / F); f * F < b; f++) {
      const tq = f * F, [st, ce] = lightAt(tq), lvl = .25 + .45 * st + .3 * ce;
      env.push([+tq.toFixed(3), +lvl.toFixed(3)], [+(tq + F - .01).toFixed(3), +lvl.toFixed(3)]);
      if (prev !== null && Math.abs(lvl - prev) > .25 && !(tq >= TL.DARK[0] && tq <= TL.JUMP)) EV.push({ type: 'tick', t: +tq.toFixed(3), g: lvl < prev ? .8 : .55, pan: .2 });
      prev = lvl;
    }
  }
  // its arm comes up in held frames: a joint creak each time the pose jumps (CAM 09 hears it)
  const creaks = []; { let last = -1; for (let t = TL.REACH[0]; t < TL.REACH[1]; t += F) { const tr = TK.motion.stutter(t, FPS_CCTV, 6); if (tr !== last && t > TL.REACH[0] + .05) { creaks.push(Math.round(t * 1000) / 1000); last = tr; } } }
  EV.push(
    { type: 'static', t: 0, dur: TL.STATIC[0][1] },
    // the guard office: the monitors' whine and hum
    { type: 'bed', fx: 'crt_hum', space: 'shop', t: SH.office[1], t1: SH.office[2] - .06, g: -33, fin: .01, fout: .02 },
    ...TL.RECCUT.map(c => ({ type: 'camclick', t: c + .16 })),
    // the concourse: the mall's ventilation, his steps in the big hall, one step that is not his; he spins round
    { type: 'bed', fx: 'mall_hum', space: 'hall', t: SH.walk[1] + .16, t1: SH.walk[2] - .06, g: -35, fin: .01, fout: .02 },
    ...walkSteps.map((x, i) => ({ type: 'step_hall', t: x, g: .9, pan: i % 2 ? .12 : -.12 })),
    { type: 'step_far', t: TL.EXTRA_STEP, pan: .5 },
    { type: 'handling', t: TL.WHIP_BACK[0], g: .9 }, { type: 'rustle', t: TL.WHIP_BACK[0] + .05 }, { type: 'scuff', t: TL.WHIP_BACK[0] + .25, g: .7 },
    // the fitting rooms: the store's hum, his steps (small room), his breath, the curtain shivering, something shifting, his pull
    { type: 'bed', fx: 'store_hum_clean', space: 'shop', t: SH.fit[1] + .16, t1: SH.fit[2], g: -27.5, fin: .01, fout: .01 },
    ...fitSteps.map((x, i) => ({ type: 'step', t: x, g: .75, pan: i % 2 ? .1 : -.1 })),
    { type: 'bed', fx: 'breath_bed', space: 'close', t: 18.4, t1: 22.6, g: -27, fin: 1.2, fout: .3 },
    { type: 'rings', t: TL.FLUTTER[0] + .05, g: .7 },
    { type: 'shuffle', t: TL.FLUTTER[0] + .3, g: .8 },
    { type: 'curtain', t: TL.CURTAIN },
    // CAM 09 played back: its mic hears the store, the light's buzz and ticks, its joints
    { type: 'vcr', t: TL.ROLL[0] },
    { type: 'bed', fx: 'store_hum_clean', space: 'shop', t: SH.cctv1[1], t1: SH.cctv1[2], g: -24, fin: .01, fout: .01, env: env1 },
    { type: 'creak', t: cq(TL.SNAP1), g: 1.0 },
    ...creaks.map(x => ({ type: 'creak', t: x, g: .45 })),
    // back on the camcorder: he spins round; his breath; the store
    { type: 'handling', t: TL.WHIP[0], g: 1.0 }, { type: 'rustle', t: TL.WHIP[0] + .06 }, { type: 'scuff', t: TL.WHIP[0] + .28, g: .8 },
    { type: 'bed', fx: 'near_breath', space: 'close', t: SH.turn[1], t1: SH.turn[2], g: -25, fin: .1, fout: .05 },
    { type: 'bed', fx: 'store_hum_clean', space: 'shop', t: SH.turn[1], t1: SH.turn[2], g: -27.5, fin: .01, fout: .01 },
    { type: 'scuff', t: TL.TURN_BACK[0] + .3, g: .6 },
    // CAM 09 again: the light flickers, the head snaps, the lights die; silence; then something hits the camera
    { type: 'vcr', t: SH.cctv2[1] - .02 },
    { type: 'bed', fx: 'store_hum_clean', space: 'shop', t: SH.cctv2[1], t1: cq(TL.DARK[0]) + .01, g: -24, fin: .01, fout: .01, env: env2 },
    { type: 'creak', t: cq(TL.SNAP2), g: 1.1 },
    { type: 'tube_pop', t: cq(TL.DARK[0]) },
    { type: 'hit', t: cq(TL.JUMP) }, { type: 'knock', t: cq(TL.JUMP) + .03 }, { type: 'tick', t: cq(TL.JUMP) + .02, g: .7, pan: .2 },
    ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'static', t: TL.END, dur: DUR - TL.END },
  );
  return EV.sort((a, b) => a.t - b.t);
}
window.EV = buildEvents();

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    buildFeeds();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
