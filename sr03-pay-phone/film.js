// STILL RECORDING, tape 3: "Pay Phone" (v2, owner 11/12 "it has to be scary"). Deterministic: render(t) draws frame t;
// window.EV lists the sound cues. Engine: channel/brand/tapekit.js. Script: channel/scripts/SR03_pay_phone.md
// CAM 04 (black and white, 6 frames a second) played back by the archivist: a slow digital zoom toward the phone, then onto
// the handset; a crash zoom on the last ring. One fluorescent tube over the pay phone: it flickers more as the call goes on
// and dies once. The handset moves only in held, jerky frames. Scare type: SOUND (one ring, very loud, after a dead silence).
'use strict';
const cv = document.getElementById('c'), OUT = cv.getContext('2d', { alpha: false });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const RAW = mk(TK.TW, TK.TH), RG = RAW.getContext('2d'), LMAP = mk(TK.TW, TK.TH), LG = LMAP.getContext('2d');
const WORK = mk(TK.TW, TK.TH), WK = WORK.getContext('2d'), WIN = mk(TK.TW, TK.TH), WG = WIN.getContext('2d');
const DUR = TL.DUR; window.DUR = DUR;
const clamp = TK.clamp, lerp = (a, b, k) => a + (b - a) * k, ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const FPS_CCTV = 6, M = TK.motion;
const CAM = { x: .85, y: 2.45, z: -.3, yaw: -.24, pitch: -.28, fov: 58 }, CAMP = [CAM.x, CAM.y, CAM.z];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len3 = a => Math.hypot(a[0], a[1], a[2]), nrm3 = a => mul3(a, 1 / (len3(a) || 1));
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const ortho = (v, n) => nrm3(sub3(v, mul3(n, dot3(v, n))));
function project(cam, p) { const q = cam.toCam(p); return q[2] > .05 ? [cam.W / 2 + cam.f * q[0] / q[2], cam.H / 2 - cam.f * q[1] / q[2], q[2]] : null; }
const qf = t => Math.floor(t * FPS_CCTV + 1e-6) / FPS_CCTV;             // the CCTV frame a time falls in

// ---------------------------------------------------------------- the restroom corridor: x -1.2..1.2, z 0..10, in the dark
const H = 2.7, LEN = 10, HW = 1.2;
const PHONE = { x: -1.2, y: 1.15, z: 3.6 };          // the steel box: x -1.2..-1.1, y 1.1..1.7, z 3.4..3.8
const HOOK = [-1.072, 1.44, 3.455];                  // the handset's centre on the hook (left edge of the box, earpiece up)
const CORD0 = [-1.095, 1.115, 3.47];                 // where the armoured cord leaves the box
const TUBE_A = [0, H - .02, 3.55], TUBE_C = [0, H - .02, 7.85];
function buildScene(L) {
  const S = new TK.Scene();
  const wall = [150, 146, 136], floor = [112, 108, 100], ceil = [92, 90, 86], skirt = [70, 66, 62];
  for (let z = 0; z < LEN; z += 1) {
    S.quad([[-HW, 0, z], [HW, 0, z], [HW, 0, z + 1], [-HW, 0, z + 1]], floor, { floor: true });
    S.quad([[-HW, H, z + 1], [HW, H, z + 1], [HW, H, z], [-HW, H, z]], ceil);
    S.quad([[-HW, 0, z + 1], [-HW, 0, z], [-HW, H, z], [-HW, H, z + 1]], wall);
    S.quad([[HW, 0, z], [HW, 0, z + 1], [HW, H, z + 1], [HW, H, z]], wall);
    S.quad([[-HW + .002, 0, z + 1], [-HW + .002, 0, z], [-HW + .002, .12, z], [-HW + .002, .12, z + 1]], skirt);
    S.quad([[HW - .002, 0, z], [HW - .002, 0, z + 1], [HW - .002, .12, z + 1], [HW - .002, .12, z]], skirt);
  }
  for (let x = -HW + .4; x < HW - .1; x += .4) S.line([x, .003, 0], [x, .003, LEN], [44, 42, 38], 1.2);           // floor tiles
  for (let z = .4; z < LEN; z += .4) S.line([-HW, .003, z], [HW, .003, z], [44, 42, 38], 1.2);
  for (let z = 1.2; z < LEN; z += 1.2) S.line([-HW, H - .005, z], [HW, H - .005, z], [40, 38, 36], 1);              // ceiling grid
  S.quad([[-HW, 0, LEN], [HW, 0, LEN], [HW, H, LEN], [-HW, H, LEN]], [96, 92, 86]);
  S.quad([[-.35, 2.1, LEN - .02], [.35, 2.1, LEN - .02], [.35, 2.35, LEN - .02], [-.35, 2.35, LEN - .02]], [40, 140, 70], { emit: 1, text: 'EXIT', textCol: [190, 255, 200] });
  // restroom doors on the right wall, with signs (right wall reads toward -z)
  for (const [z0, name] of [[2.6, 'MEN'], [6.8, 'WOMEN']]) {
    S.quad([[HW - .01, 0, z0], [HW - .01, 0, z0 + .9], [HW - .01, 2.05, z0 + .9], [HW - .01, 2.05, z0]], [110, 104, 96]);
    S.quad([[HW - .015, 1.0, z0 + .12], [HW - .015, 1.0, z0 + .2], [HW - .015, 1.06, z0 + .2], [HW - .015, 1.06, z0 + .12]], [60, 60, 64]);   // push plate
    S.quad([[HW - .015, 1.55, z0 + .75], [HW - .015, 1.55, z0 + .15], [HW - .015, 1.78, z0 + .15], [HW - .015, 1.78, z0 + .75]], [210, 205, 190], { text: name, textCol: [30, 28, 26] });
  }
  S.box(-1.2, .78, 5.4, -.92, .92, 5.9, [170, 172, 176]);                                                        // drinking fountain
  // the pay phone: a steel box on the left wall, a hood, a TELEPHONE sign above it
  const P = PHONE, X = -1.097;
  S.box(-1.2, P.y - .05, P.z - .2, -1.1, P.y + .55, P.z + .2, [150, 154, 160]);
  S.box(-1.2, P.y + .55, P.z - .28, -.95, P.y + .62, P.z + .28, [120, 124, 130]);
  S.quad([[-1.199, 1.9, P.z - .3], [-1.199, 1.9, P.z + .3], [-1.199, 2.06, P.z + .3], [-1.199, 2.06, P.z - .3]], [215, 212, 200], { text: 'PHONE', textCol: [24, 24, 26] });
  S.quad([[X, P.y + .36, P.z + .16], [X, P.y + .36, P.z - .02], [X, P.y + .5, P.z - .02], [X, P.y + .5, P.z + .16]], [40, 44, 48]);   // keypad
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const y = P.y + .375 + r * .032, z = P.z + .005 + c * .05;
    S.quad([[X - .001, y, z + .03], [X - .001, y, z], [X - .001, y + .02, z], [X - .001, y + .02, z + .03]], [150, 150, 146]);
  }
  S.quad([[X, P.y + .52, P.z + .16], [X, P.y + .52, P.z + .1], [X, P.y + .535, P.z + .1], [X, P.y + .535, P.z + .16]], [20, 20, 22]);     // coin slot
  S.quad([[X, P.y + .17, P.z - .14], [X, P.y + .17, P.z + .16], [X, P.y + .27, P.z + .16], [X, P.y + .27, P.z - .14]], [225, 220, 205], { text: L.egg ? '4 CENTS' : '25 CENTS', textCol: [30, 28, 26] });
  S.quad([[X, P.y + .02, P.z + .14], [X, P.y + .02, P.z + .04], [X, P.y + .1, P.z + .04], [X, P.y + .1, P.z + .14]], [24, 24, 26]);       // coin return
  S.box(-1.1, HOOK[1] + .1, HOOK[2] - .03, -1.07, HOOK[1] + .13, HOOK[2] + .03, [120, 124, 130]);                  // the hook
  // the fluorescent tubes: A over the phone (it flickers, it dies), C far down the corridor (dead, the odd blink)
  for (const [z, e] of [[TUBE_A[2], L.a], [TUBE_C[2], L.c]]) S.quad([[-.24, H - .02, z - .55], [.24, H - .02, z - .55], [.24, H - .02, z + .55], [-.24, H - .02, z + .55]], [120, 120, 114], { emit: Math.min(1, e), light: true });
  return S;
}
// the light: the scene renders flat, then a light map multiplies it (soft pools under the tubes, the EXIT glow, dark elsewhere)
function pool(g, cam, c, ax, ay, a) {
  const p0 = project(cam, c), pu = project(cam, add3(c, ax)), pv = project(cam, add3(c, ay));
  if (!p0 || !pu || !pv || a <= 0) return;
  g.save(); g.setTransform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(.45, `rgba(255,255,255,${a * .5})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}
function lightMap(cam, L) {
  const g = LG, base = Math.round(255 * (.2 + .24 * Math.min(1, L.a)));
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, TK.TW, TK.TH);
  g.globalCompositeOperation = 'lighter';
  const a = L.a, A = TUBE_A[2];
  pool(g, cam, [-.2, 0, A], [2.0, 0, 0], [0, 0, 2.4], .95 * a);              // floor under it
  pool(g, cam, [-HW, 1.35, A], [0, 0, 2.0], [0, 1.6, 0], .85 * a);          // the phone wall
  pool(g, cam, [HW, 1.35, A], [0, 0, 2.0], [0, 1.6, 0], .8 * a);           // the MEN door wall
  pool(g, cam, [0, H, A], [1.3, 0, 0], [0, 0, 1.5], .9 * a);                // ceiling round the tube
  const c = L.c, C = TUBE_C[2];
  pool(g, cam, [0, 0, C], [1.6, 0, 0], [0, 0, 1.8], .8 * c); pool(g, cam, [-HW, 1.3, C], [0, 0, 1.6], [0, 1.4, 0], .7 * c);
  pool(g, cam, [HW, 1.3, C], [0, 0, 1.6], [0, 1.4, 0], .7 * c); pool(g, cam, [0, H, C], [1.2, 0, 0], [0, 0, 1.4], .8 * c);
  pool(g, cam, [0, 2.22, LEN - .02], [.75, 0, 0], [0, .55, 0], .95);        // the EXIT sign and its glow
  pool(g, cam, [0, 0, LEN - .6], [1.1, 0, 0], [0, 0, 1.2], .25);
  g.globalCompositeOperation = 'source-over';
}
// how lit a point is (for the handset and its cord, drawn after the light map)
const litAt = (p, L) => clamp(.14 + .2 * Math.min(1, L.a) + Math.min(1.3, L.a) / (1 + Math.pow(len3(sub3(p, TUBE_A)) / 1.45, 2)) * .95, 0, 1.2);

// ---------------------------------------------------------------- the tube over the phone: light level per CCTV frame
function tubeA(tq) {
  const f = Math.round(tq * FPS_CCTV);
  if (tq >= TL.RING) return tq < TL.RING + 2 / FPS_CCTV ? 1.6 : 1;                // the flash on the last ring
  if (tq >= TL.QUIET) return .85;                                                  // steady: nothing moves now
  if (tq >= TL.DROP - .01 && tq < TL.DROP + .5) return 1;
  if (tq >= TL.DARK[0] && tq < TL.DARK[1]) return 0;                               // dead
  if (tq >= TL.DARK[1] && tq < TL.DARK[1] + .67) return [1, .05, .75, .05][Math.round((tq - TL.DARK[1]) * FPS_CCTV)] ?? 1;   // re-strike
  let rate = tq < TL.LIFT ? .1 : tq < 18 ? .28 : tq < TL.DARK[0] ? lerp(.4, 1.0, (tq - 18) / 6.2) : tq < TL.HANGUP ? lerp(.7, 1.45, (tq - TL.DARK[1]) / (TL.HANGUP - TL.DARK[1])) : 1;
  for (const r of TL.RINGS) if (tq >= r && tq < r + .5) rate = Math.max(rate, 1.5);  // the bell pulls on it
  if (tq < TL.ROLL[1] + .4) rate = 0;                                              // the first frames read clean (the hook)
  const R = TK.rng(f * 31 + 7)();
  return R < .2 * rate ? .06 : R < .33 * rate ? .5 : 1;
}
function tubeC(tq) {
  if (tq >= TL.DARK[0] && tq < TL.DARK[1] || tq >= TL.QUIET) return 0;
  const R = TK.rng(Math.round(tq * FPS_CCTV) * 13 + 3)(); return R < .035 ? .65 : 0;
}
const levels = (tq, t) => ({ a: tubeA(tq), c: tubeC(tq), egg: t >= TL.EGG.t && t < TL.EGG.t + TL.EGG.dur });

// ---------------------------------------------------------------- the handset: where it is, how it is turned
// pose: p = centre, u = axis (earpiece -> mouthpiece), n = the side the cups face
const mkO = (u, n) => { n = nrm3(n); return { u: ortho(u, n), n }; };
const O_HOOK = { u: [0, -1, 0], n: [-1, 0, 0] };
const O_EAR1 = mkO([-.4, -.88, .2], [0, 0, 1]);           // at the ear of someone facing the phone (we see its back)
const O_EAR2 = mkO([.35, -.9, -.15], [1, 0, .12]);        // at the right ear of someone facing the camera (edge on)
const HP = TL.HOLD.map(h => [h[1], h[2], h[3]]);
const O_FACE = (() => { const n = nrm3(sub3(CAMP, HP[2])); return { n, u: ortho([.12, -1, 0], n) }; })();   // earpiece at the lens
const oLerp = (a, b, k) => { const n = nrm3(lerp3(a.n, b.n, k)); return { n, u: ortho(lerp3(a.u, b.u, k), n) }; };
const bob = t => [0, .011 * Math.sin(t * 2 * Math.PI / 3.4), 0];                       // it rises and falls like a breath
const CL = .9;                                                                           // the cord's slack length
// the swing under the phone after it is let go (frozen at QUIET: it stops dead, tilted)
const swingAt = t => { const s = Math.max(0, t - TL.DROP - 1 / FPS_CCTV); return .95 * Math.exp(-s * .8) * Math.cos(s * 3.5 + .9); };
function handsetAt(tq) {
  const R = TK.rng(Math.round(tq * FPS_CCTV) * 7 + 1);
  const rattle = (TL.RINGS.some(r => tq >= r && tq < r + .95) || tq >= TL.RING) ? [0, (R() - .5) * .012, (R() - .5) * .008] : [0, 0, 0];
  if (tq < TL.LIFT || tq >= TL.RING) return Object.assign({ p: add3(HOOK, rattle), state: 'hook' }, O_HOOK);
  if (tq < TL.LIFT_END) {                                 // the hook switch clicks: it jerks up, holds, then rises in held steps
    const jerk = [0, .035, 0], ts = M.stutter(tq, FPS_CCTV, 3), k = M.creep(ts, TL.LIFT + .55, TL.LIFT_END, 0, 1);
    return Object.assign({ p: lerp3(add3(HOOK, jerk), HP[0], k), state: 'lift' }, oLerp(O_HOOK, O_EAR1, k));
  }
  if (tq < TL.HOLD[1][0]) {
    const k = M.creep(M.stutter(tq, FPS_CCTV, 5), TL.DRIFT1[0], TL.DRIFT1[1], 0, 1);
    return Object.assign({ p: add3(lerp3(HP[0], add3(HP[0], [.1, .02, -.14]), k), bob(M.stutter(tq, FPS_CCTV, 4))), state: 'held' }, O_EAR1);
  }
  if (tq < TL.HOLD[2][0]) {
    const k = M.creep(M.stutter(tq, FPS_CCTV, 6), TL.DRIFT2[0], TL.DRIFT2[1], 0, 1);
    return Object.assign({ p: add3(lerp3(HP[1], add3(HP[1], [.14, .03, -.3]), k), bob(M.stutter(tq, FPS_CCTV, 7))), state: 'held' }, O_EAR2);
  }
  if (tq < TL.DROP) {                                     // right under the camera; then the earpiece turns to face the lens
    const k = M.creep(M.stutter(tq, FPS_CCTV, 9), TL.TURN[0], TL.TURN[1], 0, 1);
    return Object.assign({ p: add3(HP[2], bob(M.stutter(tq, FPS_CCTV, 8))), state: 'held' }, oLerp(O_EAR2, O_FACE, k));
  }
  // let go: one frame in the air, whipping back across the corridor, then it hangs and swings on its cord under the phone
  const s = Math.min(tq, TL.QUIET), sw = swingAt(s), spin = (s - TL.DROP) * 1.7;
  const mouth = add3(CORD0, [.04, -Math.cos(sw) * CL * .58, Math.sin(sw) * CL * .58]), up = nrm3(sub3(CORD0, mouth));
  const hang = { p: add3(mouth, mul3(up, -.095)), u: up, n: ortho([Math.cos(spin), 0, Math.sin(spin)], up), state: 'hang' };
  if (tq < TL.DROP + 1 / FPS_CCTV) { const p = lerp3(HP[2], hang.p, .55); p[1] += .2; return Object.assign({}, hang, { p, n: ortho([.3, .9, -.3], hang.u), state: 'fly' }); }
  return hang;
}

// ---------------------------------------------------------------- drawing the handset, its cord, the shadow under it
const grey = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
function drawCord(g, cam, A, B, lit) {
  const d = len3(sub3(B, A)), sag = d < CL ? Math.sqrt(CL * CL - d * d) * .55 : 0, N = 48, pts = [];
  for (let i = 0; i <= N; i++) { const k = i / N, q = lerp3(A, B, k); q[1] -= sag * 4 * k * (1 - k); const p = project(cam, q); if (p) pts.push(p); }
  if (pts.length < 2) return;
  const w = Math.max(1.6, .012 * cam.f / pts[pts.length >> 1][2]);
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  const path = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
  path(); g.strokeStyle = grey(10); g.lineWidth = w; g.stroke();
  path(); g.strokeStyle = grey(40 + 120 * lit, .9); g.lineWidth = Math.max(1, w * .45);       // the armour rings catch the light
  const gap = 1.5 + 3.5 * Math.min(2.5, d / CL); g.setLineDash([1.4, gap]); g.stroke();
  g.restore();
}
function cup(g, cam, c, n, r, holes, lit) {
  const p = project(cam, c), p2 = project(cam, add3(c, mul3(n, .05))); if (!p || !p2) return;
  const vd = nrm3(sub3(CAMP, c)), cv = dot3(n, vd), Rr = r * cam.f / p[2], ang = Math.atan2(p2[1] - p[1], p2[0] - p[0]), mi = Rr * Math.max(.22, Math.abs(cv));
  const back = project(cam, sub3(c, mul3(n, .022))), front = project(cam, add3(c, mul3(n, .006)));
  for (let i = 0; i <= 5; i++) { const q = lerp3(back, front, i / 5); g.fillStyle = grey(20 + 34 * lit + i * 4 * lit); g.beginPath(); g.ellipse(q[0], q[1], mi, Rr, ang, 0, 6.2832); g.fill(); }
  g.strokeStyle = grey(50 + 130 * lit, .8); g.lineWidth = Math.max(1, Rr * .07); g.beginPath(); g.ellipse(front[0], front[1], mi, Rr, ang, Math.PI * 1.05, Math.PI * 1.95); g.stroke();   // a rim highlight
  if (cv > .05) {                                         // the face: a chrome cap with holes, turned toward us
    const fa = clamp((cv - .05) / .3);
    g.fillStyle = grey(70 + 120 * lit, fa); g.beginPath(); g.ellipse(front[0], front[1], mi * .8, Rr * .8, ang, 0, 6.2832); g.fill();
    if (holes) {
      const a1 = ortho([0, 1, 0], n), a2 = cross3(n, a1), fc = add3(c, mul3(n, .007));
      g.fillStyle = grey(0, fa);
      for (let i = 0; i < 9; i++) {
        const th = i / 8 * 6.2832, rr = i === 8 ? 0 : r * .48, q = project(cam, add3(fc, add3(mul3(a1, Math.cos(th) * rr), mul3(a2, Math.sin(th) * rr))));
        if (q) { g.beginPath(); g.arc(q[0], q[1], Math.max(1, r * .12 * cam.f / q[2]) * (.4 + .6 * cv), 0, 6.2832); g.fill(); }
      }
    }
  }
}
function drawHandset(g, cam, h, lit, alpha = 1) {
  const HL = .19, eC = sub3(h.p, mul3(h.u, HL / 2)), mC = add3(h.p, mul3(h.u, HL / 2));
  const b0 = project(cam, sub3(eC, mul3(h.n, .02))), b1 = project(cam, sub3(mC, mul3(h.n, .02))); if (!b0 || !b1) return;
  const w = .044 * cam.f / ((b0[2] + b1[2]) / 2);
  g.save(); g.globalAlpha = alpha; g.lineCap = 'round';
  const vd = nrm3(sub3(CAMP, h.p)), earFirst = dot3(sub3(eC, mC), vd) < 0;          // draw the far cup first
  const cups = [[mC, .033, false], [eC, .037, true]]; if (earFirst) cups.reverse();
  cup(g, cam, cups[0][0], h.n, cups[0][1], cups[0][2], lit);
  g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.strokeStyle = grey(18 + 34 * lit); g.lineWidth = w; g.stroke();
  const nx = -(b1[1] - b0[1]), ny = b1[0] - b0[0], nl = Math.hypot(nx, ny) || 1, sx = nx / nl * w * .3, sy = ny / nl * w * .3, up = sy > 0 ? -1 : 1;
  g.beginPath(); g.moveTo(lerp(b0[0], b1[0], .18) + up * sx, lerp(b0[1], b1[1], .18) + up * sy); g.lineTo(lerp(b0[0], b1[0], .82) + up * sx, lerp(b0[1], b1[1], .82) + up * sy);
  g.strokeStyle = grey(50 + 140 * lit, .75); g.lineWidth = Math.max(1, w * .14); g.stroke();                    // the light along the top of the grip
  cup(g, cam, cups[1][0], h.n, cups[1][1], cups[1][2], lit);
  g.restore();
}
// nobody holds it, but under the light something stands there: a soft shadow on the floor where feet would be
function holderShadow(g, cam, h, L) {
  if (h.state !== 'held' || L.a < .4) return;
  const f = [h.p[0] + .18, 0, h.p[2] + .1], away = nrm3(sub3([f[0], 0, f[2]], [TUBE_A[0], 0, TUBE_A[2]]));
  const p0 = project(cam, f), pu = project(cam, add3(f, mul3(away, .55))), pv = project(cam, add3(f, mul3(cross3(away, [0, 1, 0]), .22)));
  if (!p0 || !pu || !pv) return;
  g.save(); g.setTransform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(0,0,0,${.42 * Math.min(1, L.a)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}
function phoneShot(g, tq, t) {
  const L = levels(tq, t), cam = TK.render(g, buildScene(L), CAM, { ambient: 1.0, fog: .085 });
  lightMap(cam, L);
  g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(LMAP, 0, 0); g.restore();
  const h = handsetAt(tq);
  holderShadow(g, cam, h, L);
  const mouth = add3(h.p, mul3(h.u, .105)), lit = litAt(h.p, L);
  drawCord(g, cam, CORD0, mouth, litAt(lerp3(CORD0, mouth, .5), L));
  if (h.state === 'fly') { for (let i = 3; i >= 1; i--) drawHandset(g, cam, Object.assign({}, h, { p: lerp3(h.p, HP[2], i * .14) }), lit, .22); }
  drawHandset(g, cam, h, lit);
  return { cam, h, L };
}

// ---------------------------------------------------------------- the archivist's playback: zoom, readout
// where the zoom looks (RAW pixels) and how far, as keyframes [t, zoom, focus, centring]: slowly in on the ringing phone; it pulls
// back when the handset jumps; after the dark the handset is half out of the bottom of the frame and the zoom tilts down to it,
// then pushes in on the earpiece as it turns to the lens; it follows the handset back to the phone; frozen in the silence;
// a crash zoom on the phone with the last ring
const PH_C = [-1.12, 1.42, 3.6];
let CAM0 = null, ZK = null;
function zoomKeys() {
  const P = q => { const p = project(CAM0, q); return [p[0], p[1]]; };
  const F = { ph: P(PH_C), e2: P(add3(HP[1], [0, 0, 0])), e3: P(add3(HP[2], [0, -.02, 0])), ear: P(add3(HP[2], [0, .07, 0])), low: P([-1.1, 1.0, 3.6]) };
  F.mid = [(F.ph[0] + F.e2[0]) / 2, (F.ph[1] + F.e2[1]) / 2];
  const T = TL;
  return [[T.PUSH[0], 1.0, 'ph', 0], [11.0, 1.55, 'ph', .35], [T.HOLD[1][0], 1.62, 'ph', .35], [T.HOLD[1][0] + 1.4, 1.3, 'mid', .3],
    [T.HOLD[2][0], 1.36, 'e2', .3], [T.HOLD[2][0] + .55, 1.36, 'e2', .3], [T.HOLD[2][0] + 2.2, 1.32, 'e3', .4], [T.TURN[0], 1.4, 'e3', .45],
    [T.TURN[1] + .3, 2.05, 'ear', .55], [T.DROP, 2.1, 'ear', .55], [T.DROP + .7, 1.3, 'low', .4], [T.QUIET, 1.31, 'low', .4]]
    .map(([t, z, f, k]) => [t, z, F[f], k]);
}
function zoomAt(t) {
  ZK = ZK || zoomKeys();
  const tz = Math.min(t, TL.QUIET);
  let i = 0; while (i < ZK.length - 2 && tz >= ZK[i + 1][0]) i++;
  const A = ZK[i], B = ZK[i + 1], a = ease((tz - A[0]) / (B[0] - A[0]));
  let z = lerp(A[1], B[1], a), f = [lerp(A[2][0], B[2][0], a), lerp(A[2][1], B[2][1], a)], k = lerp(A[3], B[3], a);
  if (t >= TL.RING) { const c = ease((t - TL.RING) / .1), R = TK.rng(Math.floor(t * 60) + 5), ph = ZK[0][2]; z = lerp(z, 3.1, c); f = [lerp(f[0], ph[0], c), lerp(f[1], ph[1], c)]; k = lerp(k, .62, c);
    const sh = 16 * Math.exp(-(t - TL.RING) * 5); f = [f[0] + (R() - .5) * sh, f[1] + (R() - .5) * sh]; }
  return { z, f, k };
}
// scale RAW about the focus point into WORK; k (0..1) brings the focus point toward the centre; never shows past the edge
function zoomInto(dst, src, Z) {
  const { z, f, k } = Z, W = TK.TW, Hh = TK.TH;
  let tx = lerp(f[0], W / 2, k), ty = lerp(f[1], Hh / 2, k);
  tx = clamp(tx, W - (W - f[0]) * z, f[0] * z); ty = clamp(ty, Hh - (Hh - f[1]) * z, f[1] * z);
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.fillStyle = '#000'; dst.fillRect(0, 0, W, Hh);
  dst.setTransform(z, 0, 0, z, tx - f[0] * z, ty - f[1] * z); dst.drawImage(src, 0, 0); dst.setTransform(1, 0, 0, 1, 0, 0);
}
function readout(g, z, t) {
  g.save(); g.font = '38px "VT323"'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = 'rgba(235,240,235,.88)';
  g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetX = 2; g.shadowOffsetY = 2;
  g.fillText(`PLAYBACK  x${z.toFixed(1)}`, TK.TW / 2, 32); g.restore();
}

// ---------------------------------------------------------------- tape damage and overlays
function stamp(t) {
  const [h0, m0, s0] = TL.STAMP0, s = Math.floor(h0 * 3600 + m0 * 60 + s0 + t);
  const hh = Math.floor(s / 3600) % 24, mm = Math.floor(s / 60) % 60, ss = s % 60, p = n => String(n).padStart(2, '0');
  return `12-31-1999  ${p(hh)}:${p(mm)}:${p(ss)}`;
}
function glitchAt(t) { for (let i = 0; i < TL.GLITCH.length; i++) { const [t0, d] = TL.GLITCH[i]; if (t >= t0 && t < t0 + d) return [(t - t0) / d, i]; } return null; }
function tear(g, t, amp) {
  const R = TK.rng(Math.floor(t * 60) + 9), n = 1 + Math.floor(amp * 4);
  for (let i = 0; i < n; i++) {
    const band = 24 + R() * 130, y = R() * (TK.TH - band), dx = (R() - .5) * 220 * amp;
    g.drawImage(g.canvas, 0, y, TK.TW, band, dx, y + (R() - .5) * 10 * amp, TK.TW, band);
  }
}
function trackingRoll(g, t, k) {
  const off = Math.floor((1 - ease(k)) * TK.TH * .9), snap = trackingRoll.c || (trackingRoll.c = mk(TK.TW, TK.TH)), sg = snap.getContext('2d');
  sg.drawImage(g.canvas, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, TK.TW, TK.TH);
  g.drawImage(snap, 0, off); g.drawImage(snap, 0, off - TK.TH);
  g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(0, off - 18, TK.TW, 36); TK.statics(g, t, .35 * (1 - k));
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-3);
  const tq = qf(t), inStatic = TL.STATIC.some(([a, b]) => t >= a && t < b), black = t >= TL.BLACK[0] && t < TL.BLACK[1];
  if (inStatic) TK.statics(WG, t, 1);
  else {
    const Z = zoomAt(t);
    if (black) { WG.fillStyle = '#000'; WG.fillRect(0, 0, TK.TW, TK.TH); TK.vhs(WG, t, .6, 7); }
    else {
      phoneShot(RG, tq, t);
      zoomInto(WK, RAW, Z);
      const flash = t >= TL.RING && t < TL.RING + 2 / FPS_CCTV;
      TK.grade(WG, WORK, tq, 'cctv', flash ? { brightness: 1.5, contrast: 1.6 } : {});
      const gl = glitchAt(t), last = gl && gl[1] === TL.GLITCH.length - 1, amp = gl ? (last ? .3 + .7 * gl[0] : Math.sin(gl[0] * Math.PI)) : 0;
      TK.vhs(WG, tq, gl ? 2.6 : 1, 7);
      if (gl) { tear(WG, t, amp); TK.statics(WG, t, last ? .15 + .6 * gl[0] * gl[0] : .45 * amp); }
      if (t < TL.ROLL[1]) trackingRoll(WG, t, (t - TL.ROLL[0]) / (TL.ROLL[1] - TL.ROLL[0]));
      // the camera's own stamp; on the last ring it reads the minute the tape started again
      TK.osd(WG, 'cctv', t, { cam: TL.CAM, place: TL.PLACE, stamp: stamp(t >= TL.RING ? TL.ROLL[0] + (t - TL.RING) : t) });
      for (const v of TL.VO) if (t >= v.s0 && t <= v.s1) TK.caption(WG, v.sub, clamp((t - v.s0) / .06) * clamp((v.s1 - t) / .06));
    }
    readout(WG, Z.z, t);
  }
  const ra = clamp((t - .8) / .6);
  TK.frame(OUT, WIN, { label: TL.LABEL, sub: TL.SUB, rule: TL.RULE, ruleAlpha: ra });
}
window.render = render;

// ---------------------------------------------------------------- sound cues
function buildEvents() {
  const EV = [], F = 1 / FPS_CCTV;
  // the tube: a tick each time it drops out or strikes back (frame by frame, as drawn)
  let prev = 1;
  for (let f = Math.ceil(TL.ROLL[0] * FPS_CCTV); f < TL.RING * FPS_CCTV; f++) {
    const tq = f * F, a = tubeA(tq);
    if (tq >= TL.DARK[0] && tq < TL.DARK[1]) { prev = a; continue; }
    if (prev >= .9 && a <= .5) EV.push({ type: 'tick', t: +tq.toFixed(3), g: a < .1 ? .9 : .55, pan: -.15 });
    else if (prev <= .1 && a >= .5) EV.push({ type: 'tick', t: +tq.toFixed(3), g: .45, pan: -.15 });
    prev = a;
  }
  // the cord creaks each time the handset moves a held step (lift, drifts, the turn)
  let last = null;
  for (let f = Math.ceil(TL.LIFT * FPS_CCTV); f < TL.DROP * FPS_CCTV; f++) {
    const tq = f * F, h = handsetAt(tq), key = h.p.map(v => v.toFixed(3)).join() + h.n.map(v => v.toFixed(2)).join();
    const moving = tq < TL.LIFT_END || (tq >= TL.DRIFT1[0] && tq < TL.DRIFT1[1]) || (tq >= TL.DRIFT2[0] && tq < TL.DRIFT2[1]) || (tq >= TL.TURN[0] && tq < TL.TURN[1]);
    if (last !== null && key !== last && moving) { const dt = EV.filter(e => e.type === 'creak').slice(-1)[0]; if (!dt || tq - dt.t > .3) EV.push({ type: 'creak', t: +tq.toFixed(3), g: tq < TL.LIFT_END ? .8 : tq >= TL.TURN[0] ? 1 : .6, pan: tq > TL.HOLD[2][0] ? .1 : -.3 }); }
    last = key;
  }
  const VOend = TL.VO.map(v => v.t + v.dur);
  EV.push(
    { type: 'static', t: 0.0, dur: TL.STATIC[0][1] },
    { type: 'roll', t: TL.ROLL[0] },
    { type: 'bed', fx: 'tape_hiss', t: 0, t1: TL.QUIET, g: -39, fin: .1, fout: .02 },
    { type: 'bed', fx: 'fluor_hum', t: TL.ROLL[0], t1: TL.DARK[0], g: -31, fin: .05, fout: .02 },        // the tube's buzz dies with it
    { type: 'bed', fx: 'fluor_hum', t: TL.DARK[1], t1: TL.QUIET, g: -29, fin: .03, fout: .015 },
    ...TL.RINGS.map(r => ({ type: 'ring', t: r })),
    { type: 'pickup', t: TL.LIFT },
    { type: 'bed', fx: 'line_hiss', t: TL.LIFT + .12, t1: TL.HANGUP, g: -37, fin: .3, fout: .01 },       // an open line
    { type: 'line_breath', t: TL.LINE_BREATH },
    ...TL.GLITCH.slice(0, 1).map(([t0, d]) => ({ type: 'glitch', t: t0, dur: d })),
    { type: 'creak', t: TL.HOLD[1][0], g: 1.1, pan: 0 },
    { type: 'pop', t: TL.DARK[0] },
    { type: 'restrike', t: TL.DARK[1], dur: .6 },
    { type: 'creak', t: TL.HOLD[2][0] + .02, g: 1.2, pan: .15 },
    // breathing right at the camera's microphone, from the moment it is under the camera until it lets go (lower under her line)
    { type: 'bed', fx: 'near_breath', t: TL.BREATH, t1: TL.VO[2].t - .1, g: -25, fin: .9, fout: .35 },
    { type: 'bed', fx: 'near_breath', t: TL.VO[2].t - .35, t1: VOend[2] + .35, g: -33, fin: .3, fout: .3 },
    { type: 'bed', fx: 'near_breath', t: VOend[2] + .1, t1: TL.DROP, g: -23, fin: .4, fout: .02 },
    { type: 'swell', t: TL.SWELL, dur: TL.HANGUP - TL.SWELL },
    { type: 'hangup', t: TL.HANGUP },
    { type: 'bed', fx: 'dial_tone', t: TL.HANGUP + .18, t1: TL.DROP, g: -30, fin: .01, fout: .02 },
    { type: 'bed', fx: 'dial_tone', t: TL.DROP, t1: TL.QUIET, g: -36, fin: .01, fout: .008 },           // the line, from the floor; cut dead
    { type: 'creak', t: TL.DROP, g: 1.4, pan: -.2 },
    { type: 'clatter', t: TL.DROP + F, pan: -.35 },
    // ...silence...
    { type: 'impact', t: TL.RING },
    { type: 'scare', t: TL.RING },
    { type: 'glitch', t: TL.GLITCH[1][0], dur: TL.GLITCH[1][1] },
    { type: 'static', t: TL.END, dur: DUR - TL.END },
    { type: 'bed', fx: 'tape_hiss', t: TL.RING, t1: DUR + .5, g: -38, fin: .01 },
  );
  return EV.sort((a, b) => a.t - b.t);
}

(async () => {
  try {
    await TK.fonts('../channel/brand/fonts/');
    CAM0 = TK.render(RG, buildScene({ a: 1, c: 0 }), CAM, { ambient: 1, fog: .085 });
    window.EV = buildEvents();
    render(0);
    window.READY = true;
  } catch (e) { window.INIT_ERROR = String(e && e.stack || e); }
})();
