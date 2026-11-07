// Full bodies for the toon cast (11/8, owner: "too much stand-up comedy, let them move").
// The upper-body rigs (drawVera2, drawCleo2 in lab.js; drawRae2, drawPip2 in toon.js) are drawn with their origin at the waist.
// These wrappers add hips, legs and shoes under them, and move the whole body: stand, walk, run, jump, trip.
//   drawFull('vera', g, x, groundY, s, { act: 'walk', phase, dir, ...upper-body options })
// act: 'stand' | 'walk' | 'run' | 'jump' (o.air 0..1) | 'trip' (o.fall 0..1, face-down at 1) | 'sit'
// phase: the step cycle in radians (walk: about t * 9, run: t * 15). dir: 1 walks right, -1 left.
'use strict';
const BODY = {
  vera: { hip: 172, thigh: 84, shin: 82, hipW: 20, legW: 26, pants: '#231a33', pantsS: '#160f22', shoe: '#2c2a36', sole: '#15121c', skirt: { col: LAB.coat, colS: LAB.coatS, len: 92, w: 70 }, upper: (g, x, y, s, o) => drawVera2(g, x, y, s, o) },
  cleo: { hip: 160, thigh: 78, shin: 76, hipW: 18, legW: 24, pants: '#3a3550', pantsS: '#28243a', shoe: '#fbf7ff', sole: '#b6ff3b', skirt: { col: LAB2.cleo.apron, colS: LAB2.cleo.apronS, len: 64, w: 46 }, upper: (g, x, y, s, o) => drawCleo2(g, x, y, s, o) },
  rae: { hip: 172, thigh: 84, shin: 82, hipW: 22, legW: 28, pants: '#36456e', pantsS: '#28345a', shoe: '#3a3546', sole: '#e9e4f4', skirt: null, upper: (g, x, y, s, o) => drawRae2(g, x, y, s, o) },
  pip: { hip: 150, thigh: 72, shin: 72, hipW: 18, legW: 22, pants: '#2f3b6e', pantsS: '#222b55', shoe: '#ffd23f', sole: '#e0a91c', sock: '#fbf7ff', skirt: null, upper: (g, x, y, s, o) => drawPip2(g, x, y, s, o) },
};
// two-bone leg: hip -> knee -> foot, the knee bends toward `bend` (1 = to the right of the line hip->foot)
function legIK(hx, hy, fx, fy, a, b, bend) {
  const dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), a + b - .01), ang = Math.atan2(dy, dx);
  const k = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const ka = ang - bend * k;
  return [hx + Math.cos(ka) * a, hy + Math.sin(ka) * a];
}
// where the feet are (local units, ground = 0) and how the hips move, for each act
function bodyPose(B, o) {
  const act = o.act || 'stand', dir = o.dir || 1, ph = o.phase || 0;
  let hipDy = 0, lean = 0, feet;
  if (act === 'walk' || act === 'run') {
    const run = act === 'run', stride = run ? 46 : 30, lift = run ? 34 : 16;
    feet = [0, 1].map(i => { const p = ph + i * Math.PI; return [(i ? 1 : -1) * B.hipW * .8 + Math.sin(p) * stride * dir, -Math.max(0, Math.cos(p)) * lift]; });
    hipDy = -Math.abs(Math.sin(ph)) * (run ? 12 : 6) + (run ? 10 : 0);
    lean = run ? .1 * dir : .02 * dir;
  } else if (act === 'jump') {
    const a = o.air || 0;
    feet = [[-B.hipW * .9, -a * 70 + a * 30], [B.hipW * .9, -a * 70 + a * 30]];
    hipDy = -a * 140 + (1 - a) * 0;
  } else if (act === 'sit') {
    feet = [[-B.hipW - 24, 0], [B.hipW + 24, 0]]; hipDy = B.hip * .45;
  } else {
    feet = [[-B.hipW, 0], [B.hipW, 0]];
  }
  return { hipDy, lean, feet };
}
function drawLowerBody(g, B, pose, o) {
  const hipY = -B.hip + pose.hipDy, dir = o.dir || 1;
  // legs: the far leg first
  [0, 1].forEach(i => {
    const hx = (i ? 1 : -1) * B.hipW, [fx, fy] = pose.feet[i];
    const bend = (o.act === 'sit' ? -1 : 1) * (dir > 0 ? -1 : 1) * (i ? 1 : -1) * 0 + (dir > 0 ? -1 : 1);
    const [kx, ky] = legIK(hx, hipY, fx, fy - 10, B.thigh, B.shin, bend);
    tTube(g, [hx, hipY, (hx + kx) / 2, (hipY + ky) / 2, kx, ky, (kx + fx) / 2, (ky + fy - 10) / 2, fx, fy - 10], B.legW, B.pants, B.pantsS);
    if (B.sock) tShape(g, B.sock, gg => gg.rect(fx - 9, fy - 30, 18, 18), 2.4);
    // shoe: points the way she walks
    tShape(g, B.shoe, gg => gg.ellipse(fx + 10 * dir, fy - 6, 22, 11, 0, 0, 6.2832), 3);
    tShape(g, B.sole, gg => gg.rect(fx - 12 + 10 * dir, fy - 3, 44, 5), 2);
  });
  // coat or apron skirt over the hips, swinging a little with the legs
  if (B.skirt) {
    const S = B.skirt, sw = (pose.feet[1][0] - pose.feet[0][0]) * .12;
    for (const side of [-1, 1]) {
      const p = gg => { gg.moveTo(side * 4, hipY - 6); gg.lineTo(side * (S.w - 2), hipY - 6); gg.quadraticCurveTo(side * (S.w + 8) + sw, hipY + S.len * .6, side * (S.w + 6) + sw * 1.4, hipY + S.len); gg.lineTo(side * 4 + sw, hipY + S.len - 4); gg.closePath(); };
      tShape(g, S.col, p); if (side > 0) tShade(g, p, S.colS, gg => gg.rect(S.w * .5, hipY - 10, 60, S.len + 20));
    }
  } else {
    tShape(g, B.pants, gg => gg.roundRect(-B.hipW - 22, hipY - 12, (B.hipW + 22) * 2, 34, 12), 3);
  }
}
// the whole character. Trip: the body tips forward around the feet and lands face down.
function drawFull(who, g, x, ground, s, o = {}) {
  const B = BODY[who], k = s / 100, pose = bodyPose(B, o), dir = o.dir || 1;
  const fall = o.act === 'trip' ? Math.max(0, Math.min(1, o.fall || 0)) : 0;
  g.save(); g.translate(x, ground);
  if (fall > 0) { g.translate(dir * 90 * k * fall, 0); g.rotate(dir * fall * fall * 1.45); }
  g.rotate(pose.lean);
  g.save(); g.scale(k, k); drawLowerBody(g, B, pose, o); g.restore();
  B.upper(g, 0, (-B.hip + pose.hipDy) * k, s, o);
  g.restore();
}
