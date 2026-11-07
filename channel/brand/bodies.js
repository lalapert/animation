// Full bodies for the toon cast (11/8, owner: "too much stand-up comedy, let them move"; "mind the proportions"; "make the movement real").
// The upper-body rigs (drawVera2, drawCleo2 in lab.js; drawRae2, drawPip2 in toon.js) are drawn with their origin at the waist.
// These wrappers add hips, legs and shoes under them and move the whole body.
//   drawFull('vera', g, x, groundY, s, { act: 'walk', dist, dir, ...upper-body options })
// act: 'stand' | 'walk' | 'run' | 'jump' (o.air 0..1) | 'trip' (o.fall 0..1, face down at 1) | 'sit'
// Walking and running are driven by o.dist: how far the body has travelled (world px) since it set off. Feet in contact with the ground
// stay planted while the body passes over them, so x(t) and dist must come from the same motion (use walkTo below). o.phase still works
// for walking on the spot.
// Proportions: about 5.5–6 heads for the adults (Vera, Rae), a little less for Cleo, about 4.5 for Pip. Arms hang to mid-thigh.
// Gait: the stance leg is nearly straight and the hips ride over it like an inverted pendulum (lowest when the feet are apart at contact,
// highest when they pass); heel strike, roll, toe-off; the swinging foot clears the ground and reaches forward; arms swing against the legs;
// the face turns three-quarters toward where she walks (o.turn). Running: shorter contact, a moment with both feet off the ground, knees
// higher, arms bent and pumping, the body leaning in.
'use strict';
const BODY = {
  vera: { hip: 385, thigh: 192, shin: 186, hipW: 25, legW: 34, foot: 30, pants: '#231a33', pantsS: '#160f22', shoe: '#2c2a36', sole: '#15121c', skirt: { col: LAB.coat, colS: LAB.coatS, len: 205, w: 72 }, upper: (g, x, y, s, o) => drawVera2(g, x, y, s, o) },
  cleo: { hip: 340, thigh: 170, shin: 164, hipW: 22, legW: 30, foot: 27, pants: '#3a3550', pantsS: '#28243a', shoe: '#fbf7ff', sole: '#b6ff3b', skirt: { col: LAB2.cleo.apron, colS: LAB2.cleo.apronS, len: 128, w: 40, apron: true }, upper: (g, x, y, s, o) => drawCleo2(g, x, y, s, o) },
  rae: { hip: 385, thigh: 192, shin: 186, hipW: 27, legW: 36, foot: 31, pants: '#36456e', pantsS: '#28345a', shoe: '#3a3546', sole: '#e9e4f4', skirt: null, upper: (g, x, y, s, o) => drawRae2(g, x, y, s, o) },
  pip: { hip: 252, thigh: 126, shin: 122, hipW: 21, legW: 27, foot: 25, pants: '#2f3b6e', pantsS: '#222b55', shoe: '#ffd23f', sole: '#e0a91c', sock: '#fbf7ff', skirt: null, upper: (g, x, y, s, o) => drawPip2(g, x, y, s, o) },
};
const ANKLE = 12;                                                 // ankle height above the sole
const sstep = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// two-bone leg: hip -> knee -> ankle; the knee points the way she walks (dir)
function legIK(hx, hy, fx, fy, a, b, dir) {
  const dx = fx - hx, dy = fy - hy, d = Math.max(1, Math.min(Math.hypot(dx, dy), a + b - .5)), ang = Math.atan2(dy, dx);
  const k = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const ka = ang - dir * k;                                       // dir 1: the knee bends forward (to the right)
  return [hx + Math.cos(ka) * a, hy + Math.sin(ka) * a];
}
// gait parameters per act (fractions of leg length L)
const GAIT = {
  walk: { step: .62, duty: .58, lift: .07, knee: .985, lean: .03, arm: .34, bend: .1 },
  run: { step: 1.0, duty: .36, lift: .36, knee: .965, lean: .12, arm: .26, bend: .8 },
};
// where each foot is (relative to the hips, local units, ground = 0), its angle, and the hip height
function bodyPose(B, o) {
  const act = o.act || 'stand', dir = o.dir || 1, L = B.thigh + B.shin;
  if (act === 'walk' || act === 'run') {
    const P = GAIT[act], S = P.step * L, cyc = 2 * S;              // body travel per full cycle (two steps)
    const dist = o.dist != null ? o.dist / ((o.s || 100) / 100) : (o.phase || 0) / (2 * Math.PI) * cyc;
    const u0 = ((dist / cyc) % 1 + 1) % 1, reach = P.duty * cyc / 2;   // during contact the foot travels from +reach to -reach under the hips
    const feet = [0, 1].map(i => {
      const u = (u0 + i * .5) % 1;
      if (u < P.duty) {                                            // stance: planted, the body moves over it
        const v = u / P.duty, x = reach - v * 2 * reach;
        const ang = v < .15 ? (1 - v / .15) * .28 : v > .7 ? -((v - .7) / .3) * .5 : 0;   // heel strike (toe up) ... toe-off (heel up)
        return { x: x * dir, y: v > .7 ? -((v - .7) / .3) * 10 : 0, ang: ang * dir, stance: v };
      }
      const v = (u - P.duty) / (1 - P.duty), e = sstep(v);         // swing: from behind to in front, lifted
      const x = -reach + e * 2 * reach, lift = Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.12)), act === 'run' ? .7 : 1) * P.lift * L;   // running: the heel kicks up behind, then the knee drives forward
      return { x: x * dir, y: -lift - (1 - v) * 10, ang: (v < .4 ? -.45 * (1 - v / .4) : v > .8 ? .28 * (v - .8) / .2 : 0) * dir, stance: -1 };
    });
    // hips: as high as the stance leg allows (a nearly straight leg), so they dip at contact and rise as it passes under
    let hipH = B.hip;
    for (const f of feet) if (f.stance >= 0) hipH = Math.min(hipH, ANKLE + Math.sqrt(Math.max(0, (L * P.knee) ** 2 - f.x * f.x)) - f.y);
    if (!feet.some(f => f.stance >= 0)) {                           // running: both feet off the ground, the body sails
      const fl = ((u0 % .5) - P.duty) / (.5 - P.duty);
      hipH = ANKLE + L * P.knee * Math.cos(Math.asin(Math.min(.99, reach / (L * P.knee)))) + Math.sin(Math.PI * Math.max(0, Math.min(1, fl))) * L * .06;
    }
    if (act === 'run') hipH -= L * .025;                            // running: a little give in the knee through contact
    const swingArm = feet.map(f => f.x * P.arm);                    // left arm goes with the right leg and the other way round
    return { hipDy: B.hip - hipH, lean: P.lean * dir, feet: feet.map(f => [f.x, f.y]), angs: feet.map(f => f.ang), arms: { l: swingArm[1], r: swingArm[0], bend: P.bend } };
  }
  if (act === 'jump') { const a = o.air || 0; return { hipDy: -a * 200, lean: 0, feet: [[-B.hipW * .9, -a * 120 + a * 40], [B.hipW * .9, -a * 120 + a * 40]], angs: [-.3 * a, -.3 * a] }; }
  if (act === 'sit') return { hipDy: B.hip * .45, lean: 0, feet: [[-B.hipW - 24, 0], [B.hipW + 24, 0]], angs: [0, 0] };
  return { hipDy: 0, lean: 0, feet: [[-B.hipW, 0], [B.hipW, 0]], angs: [0, 0] };
}
function drawLowerBody(g, B, pose, o) {
  const hipY = -B.hip + pose.hipDy, dir = o.dir || 1, walking = o.act === 'walk' || o.act === 'run';
  // trousers: a seat behind the leg tops, so there is no gap between them
  { const pw = B.hipW + B.legW * .5;
    tShape(g, B.pants, gg => { gg.moveTo(-pw, hipY - 14); gg.lineTo(pw, hipY - 14); gg.lineTo(pw, hipY + 20); gg.quadraticCurveTo(0, hipY + 52, -pw, hipY + 20); gg.closePath(); }, 3); }
  // legs: walking sideways the hips line up (both legs come from near the middle); the far leg is drawn first and a little darker
  const order = walking ? (pose.feet[0][0] * dir < pose.feet[1][0] * dir ? [0, 1] : [1, 0]) : [0, 1];
  order.forEach((i, n) => {
    const hx = walking ? (i ? 1 : -1) * B.hipW * .35 : (i ? 1 : -1) * B.hipW, [fx, fy] = pose.feet[i], ang = pose.angs[i] || 0;
    const far = walking && n === 0, ax = fx, ay = fy - ANKLE;
    const [kx, ky] = legIK(hx, hipY, ax, ay, B.thigh, B.shin, o.act === 'sit' ? -dir : dir);
    tTube(g, [hx, hipY, (hx + kx) / 2, (hipY + ky) / 2, kx, ky, (kx + ax) / 2, (ky + ay) / 2, ax, ay], B.legW, far ? B.pantsS : B.pants, far ? null : B.pantsS);
    if (B.sock) tShape(g, B.sock, gg => gg.roundRect(ax - 11, ay - 22, 22, 22, 6), 2.4);
    // the shoe pivots at the heel (heel strike) or the toe (toe-off), points the way she walks
    g.save(); g.translate(ax, fy); g.rotate(-ang);
    tShape(g, B.shoe, gg => gg.ellipse(12 * dir, -8, B.foot, B.foot * .48, 0, 0, 6.2832), 3);
    tShape(g, B.sole, gg => gg.rect(12 * dir - B.foot, -3, B.foot * 2, 6), 2);
    g.restore();
  });
  // the lab coat (two panels with an open slit and a curved hem) or Cleo's apron (one front panel); it trails a little when she moves
  if (B.skirt) {
    const S = B.skirt, sw = walking ? -dir * (o.act === 'run' ? 22 : 9) : (pose.feet[1][0] - pose.feet[0][0]) * .1;
    if (S.apron) {
      const p = gg => { gg.moveTo(-S.w, hipY - 8); gg.lineTo(S.w, hipY - 8); gg.lineTo(S.w + 4 + sw, hipY + S.len - 6); gg.quadraticCurveTo(sw, hipY + S.len + 8, -S.w - 4 + sw, hipY + S.len - 6); gg.closePath(); };
      tShape(g, S.col, p); tShade(g, p, S.colS, gg => gg.rect(S.w * .4, hipY - 10, 40, S.len + 20));
    } else for (const side of [-1, 1]) {
      const sl = side * 10;
      const p = gg => { gg.moveTo(side * 2, hipY - 10); gg.lineTo(side * (S.w - 2), hipY - 10); gg.quadraticCurveTo(side * (S.w + 10) + sw, hipY + S.len * .55, side * (S.w + 14) + sw * 1.3, hipY + S.len);
        gg.quadraticCurveTo(side * (S.w * .5) + sw, hipY + S.len + 10, sl + sw, hipY + S.len - 4); gg.lineTo(side * 2, hipY + S.len * .35); gg.closePath(); };
      tShape(g, S.col, p); if (side > 0) tShade(g, p, S.colS, gg => gg.rect(S.w * .45, hipY - 12, 70, S.len + 24));
      tLine(g, [side * (S.w * .55), hipY + S.len * .2, side * (S.w * .62), hipY + S.len * .34], 2.4);
    }
  }
}
// the whole character. Trip: the body tips forward around the feet and lands face down.
function drawFull(who, g, x, ground, s, o = {}) {
  const B = BODY[who], k = s / 100, pose = bodyPose(B, Object.assign({ s }, o)), dir = o.dir || 1;
  const fall = o.act === 'trip' ? Math.max(0, Math.min(1, o.fall || 0)) : 0;
  const moving = o.act === 'walk' || o.act === 'run';
  g.save(); g.translate(x, ground);
  if (fall > 0) { g.translate(dir * 90 * k * fall, 0); g.rotate(dir * fall * fall * 1.45); }
  g.save(); g.rotate(pose.lean * .5); g.scale(k, k); drawLowerBody(g, B, pose, o); g.restore();
  // upper body: leans a little more than the legs, faces three-quarters toward where she goes, arms swing against the legs
  const free = !o.cheer && !o.reachR && !o.reachL && !o.hold && !o.point && !o.clipboard;
  const up = Object.assign({}, o);
  if (moving && up.turn == null) up.turn = .75 * dir;
  if (free && o.armsDown === undefined && (moving || o.act === 'stand' || !o.act)) {
    const A = pose.arms || { l: 0, r: 0, bend: 0 };
    up.armsDown = { l: A.l, r: A.r, bend: A.bend, hold: o.carry };
  }
  g.translate(0, (-B.hip + pose.hipDy) * k); g.rotate(pose.lean);
  B.upper(g, 0, 0, s, up);
  g.restore();
}
// walking from x0 to x1 starting at t0 at a natural speed: returns {x, dist, moving, dir, arrive}. About 1.9 steps a second walking, 2.8 running.
function walkTo(who, act, t, t0, x0, x1, s) {
  const B = BODY[who], L = (B.thigh + B.shin) * s / 100, P = GAIT[act], S = P.step * L, v = S * (act === 'run' ? 2.8 : 1.9);
  const d = Math.abs(x1 - x0), T = d / v, k = Math.max(0, Math.min(T, t - t0));
  return { x: x0 + Math.sign(x1 - x0) * v * k, dist: v * k, moving: t > t0 && t < t0 + T, dir: Math.sign(x1 - x0) || 1, arrive: t0 + T };
}
