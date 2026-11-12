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
function buildFit(open) {
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
    S.quad([[CX, 0, a], [3, 0, a], [3, 0, b], [CX, 0, b]], lit ? [200, 196, 186] : [80, 76, 72], lit ? { emit: .55 } : {});
    S.quad([[3, 0, b], [3, 0, a], [3, 2.15, a], [3, 2.15, b]], lit ? [190, 186, 176] : [96, 92, 86], lit ? { emit: .45 } : {});
    S.quad([[3, .3, a + .25], [3, .3, b - .25], [3, 1.9, b - .25], [3, 1.9, a + .25]], lit ? [215, 222, 228] : [110, 116, 122]);
    for (const zz of [a - .05, b + .05]) S.quad([[CX, 0, zz], [3, 0, zz], [3, 2.15, zz], [CX, 2.15, zz]], part);
    // curtain 3: closed until he pulls it (open 0..1), then bunched at the far end like the others
    const ca = k === 3 ? lerp(a, b - .22, open) : b - .22, cb = b, cc = k === 3 ? [96, 64, 72] : [86, 58, 66];
    S.quad([[CX - .01, HEM, cb], [CX - .01, HEM, ca], [CX - .01, 2.1, ca], [CX - .01, 2.1, cb]], cc);
    for (let zf = ca + .09; zf < cb - .04; zf += .15) S.quad([[CX - .015, HEM, zf + .045], [CX - .015, HEM, zf], [CX - .015, 2.1, zf], [CX - .015, 2.1, zf + .045]], cc.map(v => v * .7));
    S.quad([[CX - .02, 2.18, a + .7], [CX - .02, 2.18, a + .5], [CX - .02, 2.36, a + .5], [CX - .02, 2.36, a + .7]], [210, 205, 190], { text: String(k), textCol: [30, 28, 26] });
  }
  S.quad([[CX - .02, 2.43, 6.0], [CX - .02, 2.43, 2.9], [CX - .02, 2.63, 2.9], [CX - .02, 2.63, 6.0]], [52, 46, 40], { text: 'FITTING ROOMS', textCol: [200, 190, 160] });
  S.quad([[-.4, H - .02, 4.2], [.4, H - .02, 4.2], [.4, H - .02, 4.8], [-.4, H - .02, 4.8]], [150, 150, 140], { emit: .35, light: true });
  return S;
}
const FIT_CLOSED = buildFit(0), FIT_OPEN = buildFit(1);
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
  const dk = g.createRadialGradient(cx, cy, r * .55, cx, cy, r * 1.8); dk.addColorStop(0, 'rgba(0,0,0,0)'); dk.addColorStop(1, `rgba(0,0,0,${.78 * amt})`);
  g.fillStyle = dk; g.fillRect(0, 0, TK.TW, TK.TH);
  g.globalCompositeOperation = 'lighter';
  const lt = g.createRadialGradient(cx, cy, 10, cx, cy, r); lt.addColorStop(0, `rgba(255,240,205,${.32 * amt})`); lt.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = lt; g.fillRect(0, 0, TK.TW, TK.TH);
  g.restore();
}
function handInFrame(g, bob, reach = 0) {
  g.save(); g.translate(-reach * 160, bob * .6 - reach * 120);
  g.fillStyle = 'rgb(30,34,52)'; g.beginPath(); g.moveTo(1080, 640); g.lineTo(930, 700); g.lineTo(900, 810); g.lineTo(1080, 810); g.closePath(); g.fill();   // sleeve
  g.fillStyle = 'rgb(176,136,110)'; g.beginPath(); g.ellipse(905, 690, 46, 34, -.5, 0, 6.2832); g.fill();                                               // hand
  g.fillStyle = 'rgb(18,18,20)'; g.save(); g.translate(880, 668); g.rotate(-.62); g.fillRect(-120, -16, 150, 32); g.fillStyle = 'rgb(60,60,64)'; g.fillRect(-128, -20, 14, 40); g.restore();   // flashlight
  g.restore();
}
// step rhythm for the handheld walk
function stepBob(t, t0, rate = 1.8) { const ph = (t - t0) * rate; return { y: Math.abs(Math.sin(ph * Math.PI)) * .035, roll: Math.sin(ph * Math.PI) * .012, sway: Math.sin(ph * Math.PI * .5) * .02 }; }

// ---------------------------------------------------------------- each shot into RAW
const WALK_S = TK.concourse({ storeSeed: 8, lightsOn: z => (z % 16 === 3 ? .6 : 0) });
WALK_S.box(-6.7, 0, 13.2, -6.2, .25, 14.2, [70, 66, 60]);                       // an empty mannequin stand in the Fashion 99 window
function shotWalk(g, t) {
  const s = TL.SHOTS[1], k = (t - s[1]) / (s[2] - s[1]), b = stepBob(t, s[1]);
  const cam = { x: -2.4 + b.sway * 2, y: 1.6 - b.y, z: 1 + k * 8.2, yaw: lerp(.05, -.62, ease((k - .35) / .55)) + b.sway, pitch: -.04 - b.y * .5, fov: 64 };
  const c = TK.render(g, WALK_S, cam, { ambient: .9, fog: .06 });
  TK.ghost(g, c, 'display', -6.55, 12.2, { ambient: .9 }); TK.ghost(g, c, 'display', -6.55, 15.6, { ambient: .9, tilt: -.1 });
  flashlight(g, 560 + Math.sin(t * 1.3) * 30, 470 - b.y * 400, 300, 1);
  handInFrame(g, b.y * 400);
  return b.roll;
}
function shotFit(g, t) {
  const s = TL.SHOTS[2], b = stepBob(t, s[1], 1.65), walking = t < 19.4;
  const kw = clamp((t - s[1]) / (19.4 - s[1])), kt = ease((t - 19.0) / .8);
  const cam = { x: lerp(-.3, .55, ease(kw)), y: 1.6 - (walking ? b.y : 0), z: lerp(.2, 4.15, ease(kw)), yaw: lerp(.18, 1.42, kt) + (walking ? b.sway : 0), pitch: lerp(-.05, -.12, kt), fov: 62 };
  const open = ease((t - TL.CURTAIN) / .55);
  const c = TK.render(g, open > 0 ? buildFit(open) : FIT_CLOSED, cam, { ambient: .95, fog: .06 });
  spill(g, c);
  if (open > .5) {                                                               // his flashlight in the mirror: a white bloom, nothing else
    const m = project(c, [3, 1.1, (S3.a + S3.b) / 2]);
    if (m) { g.save(); g.globalCompositeOperation = 'lighter'; const r = g.createRadialGradient(m[0], m[1], 4, m[0], m[1], 105); r.addColorStop(0, `rgba(255,250,230,${.38 * open})`); r.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = r; g.fillRect(0, 0, TK.TW, TK.TH); g.restore(); }
  }
  flashlight(g, 540 + Math.sin(t * 1.1) * 25, 470 - (walking ? b.y * 400 : 0), 320, 1 - .55 * open);
  const reach = clamp((t - (TL.CURTAIN - .35)) / .3) * (1 - clamp((t - (TL.CURTAIN + .8)) / .4));
  handInFrame(g, walking ? b.y * 400 : 0, reach);
  return walking ? b.roll : 0;
}
function turnYaw(t) {
  const [w0, w1] = TL.WHIP;
  if (t < w1) return lerp(1.42, -1.55, ease((t - w0) / (w1 - w0)));
  return lerp(-1.55, -2.35, ease((t - w1) / 3.2)) + Math.sin(t * 2.1) * .03;
}
function shotTurn(g, t) {
  const [w0, w1] = TL.WHIP, whip = t < w1;
  const base = { x: .55, y: 1.58, z: 4.15, pitch: -.1, fov: 62 };
  if (whip) {                                                                    // motion blur: average a few sub-frames
    const tmp = shotTurn.tmp || (shotTurn.tmp = mk(TK.TW, TK.TH)), tg = tmp.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, TK.TW, TK.TH);
    for (let i = 0; i < 4; i++) { TK.render(tg, FIT_OPEN, Object.assign({ yaw: turnYaw(t - i * .02) }, base), { ambient: .95, fog: .06 }); g.globalAlpha = 1 / (i + 1); g.drawImage(tmp, 0, 0); }
    g.globalAlpha = 1;
  } else TK.render(g, FIT_OPEN, Object.assign({ yaw: turnYaw(t) }, base), { ambient: .95, fog: .06 });
  flashlight(g, 540 + Math.sin(t * 1.7) * 40, 460, 330, 1);
  handInFrame(g, 0);
  return whip ? Math.sin((t - w0) / (w1 - w0) * Math.PI) * .05 : 0;
}
function shotCctv(g, tq, second) {
  const c = TK.render(g, FIT_OPEN, CAM09, { ambient: 1.15, fog: .05 });
  spill(g, c);
  if (!second) {                                                                 // he looks into stall 3; it stands in the corridor behind him
    TK.ghost(g, c, 'display', .3, 5.05, { ambient: 1.1 });
    guard(g, c, 1.0, 4.6, 1, [2.4, 4.6]);
  } else {                                                                       // he has turned to the corridor; it stands in stall 3, behind him
    guard(g, c, .95, 4.6, -1, [-.6, 4.4]);
    TK.ghost(g, c, 'display', 2.15, 4.6, { ambient: 1.4, tilt: .3 });
  }
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
// camcorder: autofocus hunts at each new shot and through the zoom; exposure breathes
function focusBlur(t, s) {
  let b = 7 * Math.exp(-(t - s[1]) / .22);
  if (s[0] === 'office') { const k = (t - TL.ZOOM[0]) / (TL.ZOOM[1] - TL.ZOOM[0]); if (k > 0 && k < 1.15) b += 4.5 * Math.abs(Math.sin(k * Math.PI * 1.5)); }
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
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const s = shotAt(t), inStatic = !s || TL.STATIC.some(([a, b]) => t >= a && t < b);
  if (inStatic) TK.statics(WG, t, 1);
  else if (s[0].startsWith('cctv')) {
    const tq = Math.floor(t * FPS_CCTV) / FPS_CCTV;
    shotCctv(RG, tq, s[0] === 'cctv2');
    TK.grade(WG, RAW, tq, 'cctv');
    const gk = glitchAt(t); TK.vhs(WG, tq, gk >= 0 ? 2.5 : 1, 6);
    if (gk >= 0) { tear(WG, t, gk); TK.statics(WG, t, .45 * Math.sin(gk * Math.PI)); }
    TK.osd(WG, 'cctv', t, { cam: 'CAM 09', place: 'FASHION 99', stamp: stamp(t) });
  } else {
    let roll = 0;
    if (s[0] === 'office') {
      office(RG, t);
      const z = ease((t - TL.ZOOM[0]) / (TL.ZOOM[1] - TL.ZOOM[0])), [x9, y9] = monXY(8), cx = lerp(610, x9 + MW / 2, z), cy = lerp(480, y9 + MH / 2 - 8, z), sc = lerp(1.12, 2.7, z);   // tilted toward 9 from the start
      const hx = Math.sin(t * 1.3) * 8 + Math.sin(t * 3.1) * 3, hy = Math.cos(t * 1.1) * 6;
      WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, TK.TW, TK.TH);
      WK.setTransform(sc, 0, 0, sc, 540 - cx * sc + hx, 405 - cy * sc + hy); WK.filter = `blur(${focusBlur(t, s).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      roll = s[0] === 'walk' ? shotWalk(RG, t) : s[0] === 'fit' ? shotFit(RG, t) : shotTurn(RG, t);
      WK.setTransform(1, 0, 0, 1, 0, 0); WK.fillStyle = '#000'; WK.fillRect(0, 0, TK.TW, TK.TH);
      WK.translate(540, 405); WK.rotate(roll); WK.scale(1.04, 1.04); WK.translate(-540, -405);
      WK.filter = `blur(${focusBlur(t, s).toFixed(2)}px)`; WK.drawImage(RAW, 0, 0); WK.filter = 'none'; WK.setTransform(1, 0, 0, 1, 0, 0);
    }
    TK.grade(WG, WORK, t, 'camcorder', { brightness: 1.05 + .06 * Math.sin(t * 1.7) + .04 * Math.sin(t * 4.3) });
    const gk = glitchAt(t); TK.vhs(WG, t, gk >= 0 ? 2.2 : .8, 6);
    if (gk >= 0) { tear(WG, t, gk); TK.statics(WG, t, .35 * Math.sin(gk * Math.PI)); }
    TK.osd(WG, 'camcorder', t, { time: 'AM 1:42', date: 'DEC.01.1999', battery: 2 });
  }
  if (!inStatic) for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) (s && s[0] === 'office' ? capTop : TK.caption)(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  const ra = clamp((t - .8) / .6);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: ra });
}
window.render = render;

const SH = Object.fromEntries(TL.SHOTS.map(s => [s[0], s]));
window.EV = [
  { type: 'static', t: 0.0, dur: .5 },
  { type: 'bed', fx: 'crt_hum', t: SH.office[1], t1: SH.office[2], g: -30, fin: .05, fout: .05 },
  { type: 'zoom', t: TL.ZOOM[0] },
  { type: 'bed', fx: 'mall_hum', t: SH.walk[1], t1: SH.walk[2], g: -30, fin: .05, fout: .05 },
  { type: 'bed', fx: 'store_hum', t: SH.fit[1], t1: SH.fit[2], g: -31, fin: .05, fout: .05 },
  { type: 'bed', fx: 'store_hum', t: SH.cctv1[1], t1: SH.cctv1[2], g: -35, fin: .02, fout: .02 },
  { type: 'bed', fx: 'store_hum', t: SH.turn[1], t1: SH.turn[2], g: -31, fin: .02, fout: .02 },
  { type: 'bed', fx: 'store_hum', t: SH.cctv2[1], t1: SH.cctv2[2], g: -35, fin: .02, fout: .02 },
  ...TL.STEPS.map((x, i) => ({ type: 'step', t: x, pan: i % 2 ? .15 : -.15, g: x < 15.6 ? 1 : .7 })),
  { type: 'curtain', t: TL.CURTAIN },
  { type: 'switch', t: SH.cctv1[1] - .02 }, { type: 'switch', t: SH.turn[1] - .02 }, { type: 'switch', t: SH.cctv2[1] - .02 },
  ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
  { type: 'whoosh', t: TL.WHIP[0] },
  { type: 'breath', t: TL.BREATH },
  { type: 'static', t: TL.END, dur: DUR - TL.END },
  { type: 'bed', fx: 'tape_hiss', t: 0, t1: DUR + .5, g: -38 },
];

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    buildFeeds();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
