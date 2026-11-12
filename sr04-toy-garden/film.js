// STILL RECORDING, tape 4: "Toy Garden". Deterministic: render(t) draws frame t; window.EV lists the sound cues.
// Engine: channel/brand/tapekit.js (CCTV in black and white). Script: channel/scripts/SR04_toy_garden.md
// v2 (owner 11/12, "not scary; direction, camera moves, transitions, sound"; reference sr06-first-night v3): dark, a store sign that
// flickers and dies, the archivist's playback zoom that follows it, held 6 fps frames, a head that turns round in one frame,
// a key that winds itself, silence, black, and then the robot at the lens.
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const RS = 2, RAW = mk(TK.TW * RS, TK.TH * RS), RG = RAW.getContext('2d'), WORK = mk(TK.TW, TK.TH), WK = WORK.getContext('2d'), WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, TAU = 6.2832;
const inR = (t, r) => t >= r[0] && t < r[1];

// ---------------------------------------------------------------- the concourse at night: the toy store is the second store on the right wall
// (x = 6, z 10..17.6). Every concourse light is off except one ceiling panel near the camera; the store's own sign is lit and failing.
const SCENE = TK.concourse({ length: 40, lightsOn: () => 0 });
const SIGN = SCENE.q.find(q => q.text === 'TOY GARDEN');
const CAM = { x: -5.3, y: 3.2, z: 11.6, yaw: 1.3, pitch: -.27, fov: 58 };
const SHX = 5.99, SHZ0 = 10.0, SHZ1 = 17.6;                        // the shutter plane and span
const POOL_SIGN = { x: 4.7, z: 13.9, r: 2.7 }, POOL_PANEL = { x: .6, z: 12.2, r: 3.0 };
// the path: lying behind the shutter (seen in the gap) -> out -> backwards to B -> facing us to C -> fast to D under the camera
const P = { lie: [6.3, 14.1], out: [5.5, 14.1], B: [3.9, 13.5], C: [1.75, 12.7], D: [-.05, 12.05] };

function makeCam(c, W = TK.TW, H = TK.TH) {                    // the kit's camera, for projecting before a render
  const f = .5 * W / Math.tan(c.fov * Math.PI / 360), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  return Object.assign({}, c, { f, W, H, toCam(p) { const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; } });
}
const CAM0 = makeCam(CAM);
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }

// ---------------------------------------------------------------- light: deterministic fluorescent dropouts (as tape 6)
function flick(t, rate, seed) { const f = Math.floor(t * FPS_CCTV), R = TK.rng(f * 31 + seed)(); return R < .22 * rate ? .04 : R < .34 * rate ? .45 : 1; }
function lights(tq) {
  if (tq >= TL.QUIET) return { sign: 0, panel: 0 };                                      // the power dies with the sound
  if (tq >= TL.FLICKER2) return { sign: flick(tq, 1.7, 7), panel: flick(tq, 1.3, 19) };
  if (inR(tq, TL.WALK3)) return { sign: flick(tq, 1.0, 7), panel: flick(tq, .8, 19) };
  return { sign: tq > 4 ? flick(tq, .12, 7) : 1, panel: 1 };
}
const fall = (x, z, p) => Math.max(0, 1 - ((x - p.x) ** 2 + (z - p.z) ** 2) / (p.r * p.r));
const lightAt = (x, z, L) => .26 * (L.sign + L.panel > .2 ? 1 : .3) + 1.0 * L.sign * fall(x, z, POOL_SIGN) + .85 * L.panel * fall(x, z, POOL_PANEL);
function pool(g, cam, p, a) {
  if (a <= .01) return;
  const c = project(cam, [p.x, 0, p.z]), l = project(cam, [p.x, 0, p.z - p.r]), r = project(cam, [p.x, 0, p.z + p.r]), n = project(cam, [p.x - p.r, 0, p.z]), f = project(cam, [p.x + p.r, 0, p.z]);
  if (!c || !l || !r || !n || !f) return;
  const rx = Math.hypot(r[0] - l[0], r[1] - l[1]) / 2, ry = Math.max(2, Math.hypot(n[0] - f[0], n[1] - f[1]) / 2);
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(c[0], c[1]); g.rotate(Math.atan2(r[1] - l[1], r[0] - l[0])); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(170,166,150,${a})`); gr.addColorStop(.45, `rgba(100,98,88,${a * .5})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}
function floorClip(g, cam) {                                                                   // pools stay on the floor (not up the shutter)
  const q = [[-6, 0, 6], [SHX, 0, 6], [SHX, 0, 24], [-6, 0, 24]].map(p => project(cam, p)); if (q.some(p => !p)) return;
  g.beginPath(); q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
}
// the sign washes the top of the shutter
function wash(g, cam, a) {
  if (a <= .01) return;
  const q = [[SHX - .01, 0, 10.2], [SHX - .01, 0, 17.4], [SHX - .01, 3.1, 17.4], [SHX - .01, 3.1, 10.2]].map(p => project(cam, p)); if (q.some(p => !p)) return;
  const top = [(q[2][0] + q[3][0]) / 2, (q[2][1] + q[3][1]) / 2], bot = [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2];
  const gr = g.createLinearGradient(top[0], top[1], bot[0], bot[1]); gr.addColorStop(0, `rgba(190,186,170,${.5 * a})`); gr.addColorStop(.6, `rgba(150,146,134,${.2 * a})`); gr.addColorStop(1, `rgba(120,118,110,${.1 * a})`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.beginPath(); q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); g.restore();
  g.save(); g.lineWidth = 1.5 * RS;                                                               // the shutter's ribs, catching it
  for (let k = 1; k < 26; k++) { const y = 3.1 * k / 26, A = project(cam, [SHX - .02, y, 10.2]), B = project(cam, [SHX - .02, y, 17.4]); if (!A || !B) continue; g.strokeStyle = `rgba(20,20,22,${(.25 + .35 * a * y / 3.1).toFixed(2)})`; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); }
  g.restore();
}
function setSign(s) {
  SIGN.emit = .55 * s;
  SIGN.col = s > .3 ? [214, 208, 188] : [46, 42, 38];
  SIGN.textCol = s > .3 ? [24, 22, 20] : [92, 88, 78];
}

// ---------------------------------------------------------------- how it moves
// held frames: the picture advances only on some CCTV frames (holds of h0..h1 frames), so it moves in jerks
function held(t, t0, seed, h0, h1) {
  const f0 = Math.round(t0 * FPS_CCTV), f = Math.floor(t * FPS_CCTV + 1e-6);
  if (f <= f0) return t0;
  const R = TK.rng(seed); let a = f0;
  for (;;) { const h = h0 + Math.floor(R() * (h1 - h0 + 1)); if (a + h > f) return a / FPS_CCTV; a += h; }
}
function holdStarts(t0, t1, seed, h0, h1) {                   // the frames where it jumps (for the step sounds)
  const out = [], R = TK.rng(seed); let a = Math.round(t0 * FPS_CCTV);
  while (a / FPS_CCTV < t1) { a += h0 + Math.floor(R() * (h1 - h0 + 1)); if (a / FPS_CCTV < t1) out.push(a / FPS_CCTV); }
  return out;
}
const W1 = TL.WALK1, W2 = TL.WALK2, W3 = TL.WALK3, KS = TL.KEYSTOP;
// walk 2 slows after the key stops (longer holds); walk 3 is fast and the tape skips
function walkTime(t, smooth) {
  if (smooth) return t;
  if (t < W1[1]) return held(t, W1[0], 11, 1, 2);
  if (t < W2[1]) return t < KS ? held(t, W2[0], 23, 1, 3) : held(t, KS, 29, 2, 4);
  return held(t, W3[0], 37, 1, 2);
}
const lp = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
function w3k(tr) { const k = (tr - W3[0]) / (W3[1] - W3[0] - .25); return clamp(tr >= TL.SKIP[0] ? k + .3 : k * .8); }   // the skip eats a stretch of the walk
function posAt(t, smooth) {
  const tr = walkTime(t, smooth);
  if (t < TL.EMERGE) return P.lie;
  if (t < TL.STANDUP) { const k = smooth ? (t - TL.EMERGE) / (TL.STANDUP - TL.EMERGE - .15) : (held(t, TL.EMERGE, 5, 1, 2) - TL.EMERGE) / (TL.STANDUP - TL.EMERGE - .15); return lp(P.lie, P.out, clamp(k)); }
  if (t < W1[0]) return P.out;
  if (t < W1[1]) return lp(P.out, P.B, clamp((tr - W1[0]) / (W1[1] - W1[0])));
  if (t < W2[0]) return P.B;
  if (t < W2[1]) return lp(P.B, P.C, clamp((tr - W2[0]) / (W2[1] - W2[0])));
  if (t < W3[0]) return P.C;
  if (t < W3[1]) return lp(P.C, P.D, w3k(tr));
  return P.D;
}
// the key on its back: turning while it walks, still after the key stops, a click at a time when it winds itself, racing in walk 3
function keyAngle(tq) {
  let a = 5 * clamp(tq - W1[0], 0, W1[1] - W1[0]) + 5 * clamp(tq - W2[0], 0, KS - W2[0]);
  if (tq >= TL.SELFWIND[0]) { const h = held(Math.min(tq, TL.SELFWIND[1]), TL.SELFWIND[0], 41, 1, 3); a += .55 * Math.round((h - TL.SELFWIND[0]) * FPS_CCTV); }
  return a + 15 * clamp(tq - W3[0], 0, W3[1] - W3[0]);
}
function robotState(tq) {
  const [x, z] = posAt(tq, false), L = lights(tq);
  const walking = inR(tq, W1) || inR(tq, W2) || inR(tq, W3), tr = walkTime(tq, false);
  const lying = tq < TL.STANDUP;
  let hp = 0;                                                                                    // head pitch: -1 dropped, 0 ahead, 1 up at the lens
  if (tq >= TL.STOP) hp = tq >= TL.LOOKUP ? 1 : -1;
  let tilt = .03;
  if (inR(tq, TL.TILT)) tilt = .52;                                                              // cocked in one frame
  if (inR(tq, W3)) tilt = (TK.rng(Math.floor(tq * 6) + 3)() - .5) * .3;                          // twitching
  if (tq >= TL.LOOKUP) tilt = -.12;
  const R = TK.rng(Math.floor(tq * 6) * 7 + 1)();
  return {
    x, z, lying, walking, step: Math.round(tr * FPS_CCTV), view: tq < TL.SNAP_BODY ? 'back' : 'front', face: tq >= TL.SNAP_HEAD,
    hp, tilt, key: keyAngle(tq), eyes: tq >= TL.EYES ? 1 : 0, crackLit: R < .3 ? .35 : 1,
    jerk: inR(tq, TL.SELFWIND) && Math.round(tq * 6) % 2 ? .05 : 0,
    k: clamp(lightAt(x, z, L) * (lying ? .8 : .92), .05, 1.1), egg: tq >= TL.EGG.t && tq < TL.EGG.t + TL.EGG.dur,
  };
}

// ---------------------------------------------------------------- the robot (a 60 cm tin wind-up robot; units: 100 = its height, feet at 0, up is -y)
function robotFig(g, st) {
  const k = st.k, G = v => { const c = Math.min(255, v * k) | 0; return `rgb(${c},${c},${c})`; };
  const ph = st.step % 4, liftL = st.walking && ph === 0, liftR = st.walking && ph === 2, back = st.view === 'back';
  g.rotate((liftL ? -.075 : liftR ? .075 : 0) + st.jerk);
  const rr = (x, y, w, h, r, c) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = c; g.fill(); };
  const dot = (x, y, r, c) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); };
  for (const s of [-1, 1]) {                                                                     // legs, block feet
    const up = (s < 0 ? liftL : liftR) ? 6 : 0;
    g.fillStyle = G(122); g.fillRect(s * 14 - 5, -27 - up, 10, 21);
    g.fillStyle = G(85); g.fillRect(s * 14 - 6, -19 - up, 12, 3);
    rr(s * 14 - 12, -8 - up, 24, 8, 2, G(72));
  }
  if (!back) keyWings(g, st.key, G, false);
  rr(-27, -67, 54, 43, 6, G(150));                                                              // torso
  g.fillStyle = G(98); g.fillRect(15, -65, 11, 39);
  g.fillStyle = G(78); g.fillRect(-27, -30, 54, 5);
  if (!back) {
    g.fillStyle = G(66); g.fillRect(-20, -61, 30, 25);                                          // chest panel
    dot(-6, -49, 8.5, G(30));
    const lum = 'rgb(205,205,195)';                                                             // luminous paint: it glows faintly in the dark
    if (st.egg) { g.fillStyle = lum; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('9', -6, -48); }
    else { g.strokeStyle = lum; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -49); g.lineTo(-6 + Math.cos(st.key * .3) * 6.5, -49 + Math.sin(st.key * .3) * 6.5); g.stroke(); g.fillStyle = lum; for (let i = 0; i < 4; i++) g.fillRect(-6 + Math.cos(i * 1.57) * 7 - .7, -49 + Math.sin(i * 1.57) * 7 - .7, 1.4, 1.4); }
    for (let i = 0; i < 3; i++) { g.fillStyle = G(i === 1 ? 30 : 95); g.fillRect(4, -58 + i * 7, 4, 4); }
    g.fillStyle = G(55); for (let i = 0; i < 4; i++) g.fillRect(-18 + i * 7, -33, 4, 2);
  } else {
    g.fillStyle = G(110); g.fillRect(-1, -66, 2, 36);                                          // the seam, a battery door, screws
    rr(-13, -55, 26, 18, 2, G(150)); dot(-9, -51, 1.4, G(40)); dot(9, -51, 1.4, G(40));
  }
  const RR = TK.rng(77);                                                                         // rust and dents, the same every frame
  for (let i = 0; i < 34; i++) { const e = RR(), x = e < .35 ? -26 + RR() * 5 : e < .6 ? 21 + RR() * 5 : -26 + RR() * 52, y = e < .6 ? -66 + RR() * 40 : -34 + RR() * 9, r = .6 + RR() * 1.8; g.fillStyle = `rgba(28,22,18,${(.35 + RR() * .45).toFixed(2)})`; g.beginPath(); g.ellipse(x, y, r, r * .7, RR() * 3, 0, TAU); g.fill(); }   // at the seams and the belt
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(-12, -40, 6, 4, .4, 0, TAU); g.fill();
  for (const s of [-1, 1]) {                                                                     // arms; its left one hangs from a popped pin
    const broken = s === (back ? -1 : 1), sw = st.walking ? (ph < 2 ? .4 : -.4) * s : 0;
    g.save(); g.translate(s * 30, broken ? -55 : -62);
    g.rotate(s * (broken ? .2 : .07) + (broken ? -sw * 1.5 : sw));
    g.fillStyle = G(125); g.fillRect(-4.5, 0, 9, broken ? 33 : 26);
    g.fillStyle = G(60); g.fillRect(-5.5, broken ? 31 : 24, 4, 7); g.fillRect(1.5, broken ? 31 : 24, 4, 7);    // a pincer
    g.restore();
  }
  if (back) keyWings(g, st.key, G, true);
  g.fillStyle = G(55); g.fillRect(-6, -72, 12, 6);                                            // neck
  head(g, st, G);
}
// the wind-up key: from behind, the whole bow turning; from the front only its ends, sticking out past the body
function keyWings(g, a, G, back) {
  g.save(); g.translate(0, -47); g.rotate(a);
  g.fillStyle = G(back ? 170 : 120);
  g.fillRect(-28, -3.5, 56, 7);
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 24, 0, 11, 8, 0, 0, TAU); g.fill(); }
  if (back) { g.fillStyle = G(70); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 24, 0, 5, 3.5, 0, 0, TAU); g.fill(); } g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fillStyle = G(120); g.fill(); }
  g.restore();
}
function head(g, st, G) {
  g.save(); g.translate(0, -71); g.rotate(st.tilt);
  const rr = (x, y, w, h, r, c) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = c; g.fill(); };
  const dot = (x, y, r, c) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); };
  if (st.hp < 0) {                                                                               // dropped forward: the top of its head at us
    g.translate(0, 7);
    rr(-20, -27, 40, 27, 7, G(165)); rr(-20, -5, 40, 6, 2, G(70));
    dot(-22.5, -12, 4.5, G(110)); dot(22.5, -12, 4.5, G(110));
    dot(2, -13, 4, G(120)); g.fillStyle = G(60); g.fillRect(1, -14, 2, 5);
    g.restore(); return;
  }
  const fh = st.hp > 0 ? 31 : 25, top = st.hp > 0 ? 0 : 6;
  if (top) rr(-20, -fh - top - 2, 40, top + 5, 4, G(172));                                     // the top of the head (we are above it)
  rr(-20, -fh, 40, fh, 6, G(st.face ? 145 : 135));
  g.fillStyle = G(92); g.fillRect(12, -fh, 8, fh);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(-8, -fh * .25, 5, 3, .3, 0, TAU); g.fill();
  dot(-22.5, -fh * .5, 4.5, G(108)); dot(22.5, -fh * .5, 4.5, G(108));                          // ear bolts
  g.fillStyle = G(88); g.fillRect(-1.5, -fh - top - 15, 3, 15); g.save(); g.translate(0, -fh - top - 15); g.rotate(.5); dot(0, -3, 3.5, G(135)); g.restore();   // bent antenna
  if (!st.face) {                                                                                // the back of its head: a seam, rivets, a vent
    g.fillStyle = G(105); g.fillRect(-1, -fh, 2, fh);
    for (const [x, y] of [[-15, -fh + 4], [15, -fh + 4], [-15, -4], [15, -4]]) dot(x, y, 1.5, G(70));
    g.fillStyle = G(60); for (let i = 0; i < 4; i++) g.fillRect(-8, -fh * .55 + i * 3, 16, 1.4);
    g.restore(); return;
  }
  const ey = -fh * .6;
  for (const s of [-1, 1]) {                                                                     // eyes: chrome bezels, dark glass until they light
    dot(s * 9, ey, 6.6, G(150));
    if (st.eyes) {
      const a = s < 0 ? st.crackLit : 1;
      g.save(); g.globalCompositeOperation = 'lighter';
      const gl = g.createRadialGradient(s * 9, ey, 0, s * 9, ey, 14); gl.addColorStop(0, `rgba(255,255,245,${.55 * a})`); gl.addColorStop(.35, `rgba(255,255,240,${.18 * a})`); gl.addColorStop(1, 'rgba(255,255,240,0)');
      g.fillStyle = gl; g.fillRect(s * 9 - 14, ey - 14, 28, 28); g.restore();
      g.save(); g.shadowColor = 'rgba(255,255,245,1)'; g.shadowBlur = 10 * a; dot(s * 9, ey, 5.5, `rgb(${255 * a | 0},${255 * a | 0},${245 * a | 0})`); g.restore();
    } else { dot(s * 9, ey, 5, G(22)); dot(s * 9 - 1.4, ey - 1.6, .9, G(110)); }
    if (s < 0) { g.strokeStyle = 'rgba(10,10,10,.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-13, ey - 4); g.lineTo(-9, ey); g.lineTo(-6, ey - 2); g.moveTo(-9, ey); g.lineTo(-8, ey + 5); g.stroke(); }   // the cracked lamp
  }
  rr(-10, -fh * .27, 20, 5, 1.5, G(48));                                                        // the mouth grille
  g.fillStyle = G(140); for (let i = 0; i < 4; i++) g.fillRect(-7 + i * 4.5, -fh * .27, 1.3, 5);
  g.fillStyle = 'rgba(30,24,20,.6)'; for (const [x, y, r] of [[-15, -fh + 5, 2.5], [8, -4, 2], [16, ey + 6, 1.8], [-9, ey + 8, 1.6], [9, ey + 8, 1.4]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(25,20,16,.55)'; g.lineWidth = 1.4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 9, ey + 7); g.lineTo(s * 9 + .5, ey + 15); g.stroke(); }   // rust runs from the eyes
  g.restore();
}
function gapPoly(cam, h) { return [[SHX - .01, 0, SHZ0 + .3], [SHX - .01, 0, SHZ1 - .3], [SHX - .01, h, SHZ1 - .3], [SHX - .01, h, SHZ0 + .3]].map(p => project(cam, p)); }
function drawRobot(g, cam, st) {
  const base = project(cam, [st.x, 0, st.z]); if (!base) return;
  const s = cam.f / base[2] * .6 / 100;
  g.save();
  if (st.lying && st.x > SHX - .05) { const P = gapPoly(cam, .2); g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip(); }   // still under the shutter: only the gap shows it
  g.fillStyle = `rgba(0,0,0,${.45})`; g.beginPath(); if (st.lying) g.ellipse(base[0] - 50 * s, base[1], 58 * s, 5 * s, 0, 0, TAU); else g.ellipse(base[0], base[1], 34 * s, 8 * s, 0, 0, TAU); g.fill();
  g.translate(base[0], base[1]); g.scale(s, s);
  if (st.lying) { g.translate(0, -11); g.scale(1, .42); g.rotate(-Math.PI / 2); }
  robotFig(g, st);
  g.restore();
}

// ---------------------------------------------------------------- the gap under the shutter. After it jolts: rows of little feet, little eyes
function gapHeight(tq) { return tq < TL.SHUTTER ? .2 : tq < TL.SHUTTER + .17 ? .6 : .5; }
function drawGap(g, cam, tq) {
  const P = gapPoly(cam, gapHeight(tq)); if (P.some(p => !p)) return;
  g.save(); g.fillStyle = 'rgb(6,6,8)'; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
  if (tq >= TL.SHUTTER) {
    g.clip(); const R = TK.rng(41), lit = tq < TL.QUIET ? 1 : .25, ER = TK.rng(Math.floor(tq * 6) * 5 + 2);
    for (let row = 0; row < 2; row++) for (let i = 0; i < 15; i++) {
      const z = SHZ0 + .55 + i * .44 + (row % 2) * .22 + (R() - .5) * .1, x = SHX + .12 + row * .3, kind = Math.floor(R() * 3), h = .14 + R() * .28;
      const a = project(cam, [x, 0, z]); if (!a) continue;
      const s = cam.f / a[2] * .06, sh = [130, 90][row] * lit | 0;
      g.fillStyle = `rgb(${sh},${sh},${sh - 2})`;                                                // feet (blocks, doll shoes, paws), all facing out
      if (kind === 0) { g.fillRect(a[0] - s * 1.6, a[1] - s * 1.3, s * 1.3, s * 1.3); g.fillRect(a[0] + s * .3, a[1] - s * 1.3, s * 1.3, s * 1.3); }
      else if (kind === 1) { g.beginPath(); g.ellipse(a[0] - s, a[1] - s * .4, s * .9, s * .5, 0, 0, TAU); g.ellipse(a[0] + s, a[1] - s * .4, s * .9, s * .5, 0, 0, TAU); g.fill(); }
      else { g.beginPath(); g.arc(a[0] - s, a[1] - s * .7, s * .9, 0, TAU); g.arc(a[0] + s, a[1] - s * .7, s * .9, 0, TAU); g.fill(); }
      const e = project(cam, [x, h, z]);                                                          // and their eyes, catching the light (some blink)
      if (e && R() < .8 && ER() > .12) { const es = Math.max(2, s * .75), ga = .55 + .45 * R(); g.fillStyle = `rgba(235,235,225,${ga})`; g.beginPath(); g.arc(e[0] - es * 1.8, e[1], es, 0, TAU); g.arc(e[0] + es * 1.8, e[1], es, 0, TAU); g.fill(); }
    }
  }
  g.restore();
}

// ---------------------------------------------------------------- the jump: its face at the lens, lit by its own eyes (screen space; graded with the rest)
function rust(g, R, x, y, r, n, a = .6) {
  for (let i = 0; i < n; i++) {
    const an = R() * TAU, d = Math.pow(R(), .7) * r, s = 2 + R() * r * .13;
    g.fillStyle = `rgba(${36 + R() * 30 | 0},${26 + R() * 18 | 0},22,${(a * (.25 + R() * .75)).toFixed(2)})`;
    g.beginPath(); g.ellipse(x + Math.cos(an) * d, y + Math.sin(an) * d, s, s * (.45 + R() * .6), R() * 3, 0, TAU); g.fill();
  }
}
function runs(g, R, x, y, len, w, n = 4) {                                                       // rust running down from a joint
  for (let k = 0; k < n; k++) {
    let px = x + (R() - .5) * w, py = y; const end = y + len * (.4 + R() * .6);
    g.strokeStyle = `rgba(40,30,24,${(.25 + R() * .4).toFixed(2)})`; g.lineWidth = 3 + R() * 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py);
    while (py < end) { py += 18; px += (R() - .5) * 6; g.lineTo(px, py); } g.stroke();
  }
}
function faceAtLens(g, tq) {
  const f = clamp(Math.round((tq - TL.JUMP) * FPS_CCTV), 0, 4), R = TK.rng(404), FR = TK.rng(Math.floor(tq * 6) * 13 + 5);
  const sc = [1, 1.3, 1.42, 1.46, 1.48][f], rot = [-.14, -.05, .08, .1, .1][f], ox = [0, -40, 24, 14, 14][f], oy = [0, 70, 40, 46, 46][f];
  const W = 430, H = 365, EX = 178, EY = -28, ER = 80;
  g.save(); g.fillStyle = 'rgb(2,2,3)'; g.fillRect(0, 0, TK.TW, TK.TH);
  g.translate(556 + ox, 470 + oy); g.rotate(rot); g.scale(sc, sc);
  for (const s of [-1, 1]) { g.fillStyle = 'rgb(46,46,44)'; g.beginPath(); g.roundRect(s > 0 ? W - 24 : -W - 66, -80, 90, 160, 30); g.fill(); g.fillStyle = 'rgb(84,82,78)'; g.beginPath(); g.roundRect(s > 0 ? W + 30 : -W - 56, -52, 24, 104, 10); g.fill(); }   // ear bolts
  const plate = () => { g.beginPath(); g.moveTo(-W, -H + 200); g.quadraticCurveTo(-W, -H, -W + 220, -H); g.lineTo(W - 220, -H); g.quadraticCurveTo(W, -H, W, -H + 200); g.lineTo(W, H - 80); g.quadraticCurveTo(W, H, W - 80, H); g.lineTo(-W + 80, H); g.quadraticCurveTo(-W, H, -W, H - 80); g.closePath(); };
  g.strokeStyle = 'rgb(52,52,50)'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, -H + 20); g.lineTo(60, -H - 80); g.lineTo(160, -H - 130); g.stroke();   // the bent antenna
  g.fillStyle = 'rgb(70,68,64)'; g.beginPath(); g.arc(166, -H - 134, 34, 0, TAU); g.fill();
  plate(); g.fillStyle = 'rgb(76,74,70)'; g.fill();                                                // dark old tin
  g.save(); plate(); g.clip();
  g.fillStyle = 'rgb(58,56,53)'; g.fillRect(-W, 120, 2 * W, H);                                   // the printed lower face, darker
  g.fillStyle = 'rgb(54,53,51)'; g.fillRect(-2, -H, 4, 2 * H);                                    // the seam
  for (const [dx, dy, rx, ry, a] of [[-320, -250, 110, 70, -.4], [290, 230, 90, 56, .3], [90, -330, 70, 44, .1], [-190, 300, 70, 44, -.2], [380, -150, 56, 80, .2], [40, 60, 60, 40, .6]]) {   // dents
    const gr = g.createRadialGradient(dx + rx * .3, dy + ry * .35, 4, dx, dy, rx); gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(dx, dy, rx, ry, a, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(220,220,212,.4)'; g.lineWidth = 5; g.beginPath(); g.ellipse(dx, dy, rx, ry, a, 3.4, 5.4); g.stroke();
  }
  for (let i = 0; i < 60; i++) {                                                                  // scratches
    const x = (R() - .5) * 2 * W, y = (R() - .5) * 2 * H, a = R() * 3, l = 20 + R() * 100;
    g.strokeStyle = `rgba(200,200,192,${(.1 + R() * .25).toFixed(2)})`; g.lineWidth = 1 + R() * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 30; i++) {                                                                  // paint flaking off
    const x = (R() - .5) * 2 * W, y = (R() - .5) * 2 * H, r = 6 + R() * 26; g.fillStyle = `rgba(150,150,144,${(.3 + R() * .4).toFixed(2)})`;
    g.beginPath(); for (let j = 0; j < 7; j++) { const an = j / 7 * TAU, q = r * (.45 + R() * .7); j ? g.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q) : g.moveTo(x + Math.cos(an) * q, y + Math.sin(an) * q); } g.closePath(); g.fill();
  }
  rust(g, R, -W + 80, -H + 120, 170, 160, .8); rust(g, R, W - 60, H - 80, 190, 170, .8); rust(g, R, -W + 50, H - 50, 150, 120, .8); rust(g, R, W - 80, -H + 140, 130, 100, .8);
  rust(g, R, 0, -H + 40, 120, 60, .7); rust(g, R, -40, 120, 90, 50, .6);
  g.save(); g.globalCompositeOperation = 'lighter';                                               // its eyes light the tin round them
  for (const s of [-1, 1]) { const a = s < 0 ? .26 : .38, gl = g.createRadialGradient(s * EX, EY + 30, 50, s * EX, EY + 40, 290); gl.addColorStop(0, `rgba(255,255,245,${a})`); gl.addColorStop(1, 'rgba(255,255,245,0)'); g.fillStyle = gl; g.fillRect(s * EX - 300, EY - 260, 600, 600); }
  g.restore();
  for (const s of [-1, 1]) { runs(g, R, s * EX + s * 10, EY + ER + 36, 280, 90, 6); rust(g, R, s * EX, EY + ER + 40, 80, 50, .85); }   // rust run down from the eyes
  const lg = g.createRadialGradient(0, EY + 40, 120, 0, EY + 60, 560); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.45, 'rgba(0,0,0,.45)'); lg.addColorStop(1, 'rgba(0,0,0,.97)');
  g.fillStyle = lg; g.fillRect(-W, -H, 2 * W, 2 * H);                                            // the rest falls into the dark
  g.restore();
  // the brow: a heavy ridge over the lamps that shades their tops (it looks down its nose at the lens)
  g.save(); g.beginPath(); g.moveTo(-W + 20, EY - ER - 40); g.lineTo(-60, EY - ER + 6); g.lineTo(60, EY - ER + 6); g.lineTo(W - 20, EY - ER - 52); g.lineTo(W - 20, EY - ER - 120); g.lineTo(-W + 20, EY - ER - 110); g.closePath();
  g.fillStyle = 'rgb(30,30,29)'; g.fill(); g.strokeStyle = 'rgba(190,190,182,.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-W + 20, EY - ER - 40); g.lineTo(-60, EY - ER + 6); g.lineTo(60, EY - ER + 6); g.lineTo(W - 20, EY - ER - 52); g.stroke();
  g.fillStyle = 'rgb(70,68,64)'; for (let i = 0; i < 8; i++) { const x = -W + 60 + i * 110, y = EY - ER - 84 + (i > 4 ? -4 : 0); g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
  g.restore();
  for (const s of [-1, 1]) {                                                                     // the eyes
    const ex = s * EX, ey = EY + (s < 0 ? 14 : 0), cracked = s < 0;                              // the cracked one sits lower: its socket is dented in
    const bz = g.createRadialGradient(ex - 30, ey - 40, 8, ex, ey, ER + 36); bz.addColorStop(0, 'rgb(200,200,196)'); bz.addColorStop(.55, 'rgb(70,70,68)'); bz.addColorStop(.8, 'rgb(150,150,146)'); bz.addColorStop(1, 'rgb(30,30,29)');
    g.fillStyle = bz; g.beginPath(); g.arc(ex, ey, ER + 34, 0, TAU); g.fill();
    rust(g, R, ex + s * 20, ey + ER + 6, 60, 40, .85);
    const lit = cracked ? (FR() < .4 ? .5 : .85) : 1;
    g.fillStyle = 'rgb(16,16,16)'; g.beginPath(); g.arc(ex, ey, ER, 0, TAU); g.fill();
    const gl = g.createRadialGradient(ex, ey + 6, 4, ex, ey, ER); gl.addColorStop(0, 'rgb(255,255,255)'); gl.addColorStop(.55, `rgba(255,255,250,${lit})`); gl.addColorStop(.9, `rgba(170,170,160,${lit * .8})`); gl.addColorStop(1, `rgba(60,60,56,${lit})`);
    g.fillStyle = gl; g.beginPath(); g.arc(ex, ey, ER, 0, TAU); g.fill();
    const sh = g.createLinearGradient(ex, ey - ER, ex, ey - ER * .2); sh.addColorStop(0, 'rgba(0,0,0,.85)'); sh.addColorStop(1, 'rgba(0,0,0,0)');   // the brow's shadow over the lamp
    g.fillStyle = sh; g.beginPath(); g.arc(ex, ey, ER, 0, TAU); g.fill();
    g.strokeStyle = `rgba(120,120,112,${.35 * lit})`; g.lineWidth = 3; for (const r of [.42, .7]) { g.beginPath(); g.arc(ex, ey + 4, ER * r, 0, TAU); g.stroke(); }   // the reflector rings behind the glass
    if (cracked) {                                                                                // a hole in the lamp glass, the bulb glowing inside, cracks from it
      const hole = [[-58, -40], [-20, -66], [4, -40], [-14, -20], [-40, -12], [-66, -22]].map(([x, y]) => [ex + x * .8, ey + y * .8]);
      g.fillStyle = 'rgb(10,10,10)'; g.beginPath(); hole.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
      g.save(); g.clip(); g.fillStyle = 'rgba(255,255,240,.8)'; g.beginPath(); g.ellipse(ex - 24, ey - 29, 12, 16, .3, 0, TAU); g.fill();
      g.strokeStyle = 'rgb(255,255,255)'; g.lineWidth = 3; g.beginPath(); for (let j = 0; j < 7; j++) g.lineTo(ex - 32 + j * 3, ey - 32 + (j % 2 ? 6 : -6)); g.stroke(); g.restore();
      g.save(); g.beginPath(); g.arc(ex, ey, ER + 2, 0, TAU); g.clip(); g.strokeStyle = 'rgba(6,6,6,.95)'; g.lineCap = 'round';
      for (const [x0, y0, a, l] of [[-16, -40, -.3, 110], [0, -32, .5, 100], [-27, -13, 1.6, 90], [-48, -26, 2.6, 50], [-6, -24, .95, 80], [-37, -45, -1.9, 40]]) {
        let px = ex + x0, py = ey + y0, an = a; g.lineWidth = 4.5; g.beginPath(); g.moveTo(px, py);
        for (let j = 0; j < 4; j++) { an += (R() - .5) * .6; px += Math.cos(an) * l / 4; py += Math.sin(an) * l / 4; g.lineTo(px, py); } g.stroke();
      }
      g.restore();
    }
  }
  g.save(); g.translate(0, 205); g.rotate(.05); g.scale(.85, .85);                                                    // the mouth: a speaker grille, one corner bent open
  g.beginPath(); g.roundRect(-205, -62, 410, 124, 24); g.fillStyle = 'rgb(34,33,32)'; g.fill();
  for (let i = 0; i < 7; i++) { g.fillStyle = 'rgb(3,3,3)'; g.fillRect(-176 + i * 52, -46, 28, 92 + (i < 2 ? 16 : 0)); }
  g.globalCompositeOperation = 'lighter'; const mg = g.createRadialGradient(0, 0, 10, 0, 0, 200); mg.addColorStop(0, 'rgba(255,255,240,.12)'); mg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = mg; g.fillRect(-205, -62, 410, 124); g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgb(2,2,2)'; g.beginPath(); g.moveTo(-205, 10); g.lineTo(-90, 62); g.lineTo(-205, 92); g.closePath(); g.fill();
  rust(g, R, -150, 50, 60, 40, .85); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';                                               // bloom: the lamps flare the tape
  for (const s of [-1, 1]) { const a = s < 0 ? .28 : .45, ey = EY + (s < 0 ? 14 : 0), bl = g.createRadialGradient(s * EX, ey, 20, s * EX, ey, 190); bl.addColorStop(0, `rgba(255,255,250,${a})`); bl.addColorStop(1, 'rgba(255,255,250,0)'); g.fillStyle = bl; g.fillRect(s * EX - 190, ey - 190, 380, 380); }
  g.restore();
  g.restore();
}

// ---------------------------------------------------------------- the archivist's playback: a slow zoom that follows it, a crash zoom on the eyes
function zoomAt(t) {
  if (t >= TL.JUMP) return 1.0;
  if (t >= TL.SHUTTER) return lerp(1.0, 1.14, ease((t - TL.SHUTTER - .2) / 1.3));
  if (t >= TL.CRASH[0]) return lerp(zBase(TL.CRASH[0]), 3.1, ease((t - TL.CRASH[0]) / (TL.CRASH[1] - TL.CRASH[0]))) + .15 * clamp((t - TL.CRASH[1]) / 3);
  return zBase(t);
}
function zBase(t) {                                                                              // x1.0 for the hook, a push in as it walks, then following it
  const [a, b] = TL.PUSH;                                                                         // in to x2.5 for the head turn, ease back as it comes, then creep in
  return 1 + 1.5 * ease((t - a) / (b - a)) - .5 * ease((t - 10.2) / 4.5) + .35 * clamp((t - 15) / (TL.STOP - 15));
}
function targetAt(t) {                                                                           // where it is on screen (smoothed over the last second)
  let sx = 0, sy = 0, n = 0;
  for (let k = 0; k < 10; k++) {
    const tt = Math.max(0, t - k * .1), [x, z] = posAt(tt, true), up = tt >= TL.STOP ? .5 : .36, p = project(CAM0, [x, up, z]);
    if (p) { sx += p[0]; sy += p[1]; n++; }
  }
  return [sx / n, sy / n];
}
function zoomInto(dst, src, z, tx, ty, sx = 0, sy = 0) {
  const W = TK.TW, H = TK.TH, cx = clamp(540, W - z * (W - tx), z * tx), cy = clamp(380, H - z * (H - ty), z * ty);
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.fillStyle = '#000'; dst.fillRect(0, 0, W, H);
  dst.imageSmoothingQuality = 'high';
  dst.setTransform(z / RS, 0, 0, z / RS, cx - z * tx + sx, cy - z * ty + sy); dst.drawImage(src, 0, 0); dst.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------------------------------------------------------------- tape damage, overlays
function stamp(t) {
  const [h0, m0, s0] = TL.STAMP0, s = Math.floor(h0 * 3600 + m0 * 60 + s0 + t + (t >= TL.SKIP[0] + .1 ? TL.SKIP_S : 0));
  const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60, p = n => String(n).padStart(2, '0');
  return `12-31-1999  ${p(hh)}:${p(mm)}:${p(ss)}`;
}
function glitchAt(t) { for (const [t0, d] of TL.GLITCH) if (t >= t0 && t < t0 + d) return (t - t0) / d; return -1; }
function tear(g, t, k, amt = 1) {
  const R = TK.rng(Math.floor(t * 60) + 9);
  for (let i = 0; i < 1 + amt; i++) {
    const band = 30 + R() * 120, y = R() * (TK.TH - band), dx = (R() - .5) * 160 * amt * Math.sin(k * Math.PI + .3);
    g.drawImage(g.canvas, 0, y, TK.TW, band, dx, y, TK.TW, band);
  }
  const y2 = R() * TK.TH; g.drawImage(g.canvas, 0, y2, TK.TW, 40, (R() - .5) * 120, y2 + (R() - .5) * 20, TK.TW, 40);
}
function trackingRoll(g, t, k) {
  const off = Math.floor((1 - ease(k)) * TK.TH * .9), snap = trackingRoll.c || (trackingRoll.c = mk(TK.TW, TK.TH)), sg = snap.getContext('2d');
  sg.drawImage(g.canvas, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, TK.TW, TK.TH);
  g.drawImage(snap, 0, off); g.drawImage(snap, 0, off - TK.TH);
  g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(0, off - 18, TK.TW, 36); TK.statics(g, t, .35 * (1 - k));
}
// the scene at one CCTV frame into RAW (cached: the picture only changes six times a second)
let lastTq = -1;
function drawRaw(tq) {
  if (tq === lastTq) return; lastTq = tq;
  if (tq >= TL.JUMP) { RG.save(); RG.scale(RS, RS); faceAtLens(RG, tq); RG.restore(); return; }
  const L = lights(tq), dark = tq >= TL.QUIET;
  setSign(L.sign);
  const cam = TK.render(RG, SCENE, CAM, { ambient: dark ? .1 : .5 + .22 * L.sign + .1 * L.panel, fog: .06 });
  RG.save(); floorClip(RG, cam); pool(RG, cam, POOL_SIGN, .55 * L.sign); pool(RG, cam, POOL_PANEL, .45 * L.panel); RG.restore(); wash(RG, cam, L.sign);
  drawGap(RG, cam, tq);
  drawRobot(RG, cam, robotState(tq));
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const tq = Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;
  if (TL.STATIC.some(([a, b]) => t >= a && t < b)) TK.statics(WG, t, 1);
  else {
    const black = inR(t, TL.BLACK);
    let z = 1;
    if (black) { WG.fillStyle = '#000'; WG.fillRect(0, 0, TK.TW, TK.TH); TK.vhs(WG, tq, .6, 11); }
    else {
      drawRaw(tq);
      z = zoomAt(t);
      const [tx, ty] = t >= TL.JUMP ? [540, 405] : targetAt(t);
      const jolt = tq >= TL.SHUTTER && tq < TL.SHUTTER + .34 ? (Math.round((tq - TL.SHUTTER) * 6) ? 5 : -9) : 0;   // the camera mount shakes when the shutter jumps
      const shake = t >= TL.JUMP ? [(TK.rng(Math.floor(t * 30))() - .5) * 26, (TK.rng(Math.floor(t * 30) + 9)() - .5) * 20] : [0, jolt];
      zoomInto(WK, RAW, z, tx, ty, shake[0], shake[1]);
      TK.grade(WG, WORK, tq, 'cctv');
      const gk = glitchAt(t);
      TK.vhs(WG, tq, gk >= 0 || t >= TL.JUMP ? 2.6 : 1, 11);
      if (gk >= 0) { tear(WG, t, gk, t >= TL.JUMP ? 2 : 1); TK.statics(WG, t, (t >= TL.JUMP ? .3 : .45) * Math.sin(gk * Math.PI)); }
      if (t < TL.ROLL[1]) trackingRoll(WG, t, (t - TL.ROLL[0]) / (TL.ROLL[1] - TL.ROLL[0]));
    }
    TK.osd(WG, 'cctv', t, { cam: TL.CAM, place: TL.PLACE, stamp: stamp(t) });
    WG.save(); WG.font = '40px "VT323"'; WG.fillStyle = 'rgba(235,240,235,.85)'; WG.textAlign = 'center'; WG.textBaseline = 'top';
    WG.shadowColor = 'rgba(0,0,0,.8)'; WG.shadowOffsetX = 2; WG.shadowOffsetY = 2;
    WG.fillText(`PLAYBACK  x${z.toFixed(1)}`, TK.TW / 2, 32); WG.restore();
    for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) TK.caption(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
  }
  const ra = clamp((t - .8) / .6);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: ra });
}
window.render = render;

// ---------------------------------------------------------------- sound cues
// a tin step on every held-frame jump (louder as it comes closer; dragged after the key stops), ticking that runs with the key
// (steady, slowing to nothing, racing), a grind on each snap, flicker clicks with the failing sign, the swell, silence, the sting
const dist = (x, z) => Math.hypot(x - CAM.x, z - CAM.z);
const stepEv = [];
for (const [a, b, seed, h0, h1] of [[W1[0], W1[1], 11, 1, 2], [W2[0], KS, 23, 1, 3], [KS, W2[1], 29, 2, 4], [W3[0], W3[1], 37, 1, 2]])
  for (const t of holdStarts(a, b, seed, h0, h1)) {
    const [x, z] = posAt(t, false), gl = clamp(9.5 / dist(x, z), .5, 1.6);
    stepEv.push({ type: t >= KS && t < W2[1] ? 'drag' : 'step', t: Math.round(t * 1000) / 1000, g: gl, pan: -.1 });
  }
const winds = holdStarts(TL.SELFWIND[0], TL.SELFWIND[1], 41, 1, 3);
window.EV = [
  { type: 'static', t: 0.0, dur: .6 },
  { type: 'roll', t: TL.ROLL[0] },
  { type: 'bed', fx: 'mall_hum', t: TL.ROLL[0], t1: TL.QUIET, g: -31, fin: .25, fout: .01 },
  { type: 'bed', fx: 'store_hum', t: TL.ROLL[0], t1: TL.QUIET, g: -36, fin: .25, fout: .01 },
  { type: 'scrape', t: TL.EMERGE },
  { type: 'clank', t: TL.STANDUP, g: .8 },
  { type: 'ticks', t: W1[0], t1: W1[1], r0: 7, r1: 7, g: -21 },
  { type: 'clank', t: W1[1], g: .6 },
  { type: 'snap', t: TL.SNAP_HEAD, g: 1.25 },
  { type: 'snap', t: TL.SNAP_BODY, g: .9 }, { type: 'clank', t: TL.SNAP_BODY + .02, g: .7 },
  { type: 'ticks', t: W2[0], t1: KS, r0: 7, r1: 1.6, g: -21 },
  { type: 'whir', t: KS - .35 },
  ...stepEv,
  { type: 'snap', t: TL.TILT[0], g: .8 },
  ...winds.map((t, i) => ({ type: 'ratchet', t, g: i % 3 ? .8 : 1 })),
  { type: 'wind', t: TL.SELFWIND[0] - .05, dur: TL.SELFWIND[1] - TL.SELFWIND[0] + .05 },
  { type: 'snap', t: TL.TILT[1], g: .6 },
  { type: 'bed', fx: 'tick_fast', t: W3[0], t1: W3[1], g: -27, fin: .02, fout: .005 },
  { type: 'bed', fx: 'flicker', t: W3[0], t1: W3[1], g: -33, fin: .05, fout: .02 },
  ...TL.GLITCH.map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
  { type: 'clank', t: TL.STOP, g: 1.1 },
  { type: 'snap', t: TL.LOOKUP, g: 1.3 },
  { type: 'eyes', t: TL.EYES },
  { type: 'bed', fx: 'flicker', t: TL.FLICKER2, t1: TL.QUIET, g: -27, fin: .05, fout: .005 },
  { type: 'swell', t: TL.SWELL[0], dur: TL.SWELL[1] - TL.SWELL[0] },
  { type: 'shutter', t: TL.SHUTTER },
  { type: 'toys', t: TL.SHUTTER + .05, dur: TL.QUIET - TL.SHUTTER - .05 },
  { type: 'ticks', t: TL.BLACK[0] + .17, t1: TL.BLACK[0] + .2, r0: 10, r1: 10, g: -30 },   // one tick in the dark, close
  { type: 'sting', t: TL.STING }, { type: 'sting2', t: TL.STING },
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
