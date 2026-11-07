// Full bodies for the toon cast (11/8, owner: "too much stand-up comedy, let them move").
// The upper-body rigs (drawVera2, drawCleo2 in lab.js; drawRae2, drawPip2 in toon.js) are drawn with their origin at the waist.
// These wrappers add hips, legs and shoes under them, and move the whole body: stand, walk, run, jump, trip.
//   drawFull('vera', g, x, groundY, s, { act: 'walk', phase, dir, ...upper-body options })
// Proportions (11/8, owner: 'mind the body proportions'): about 5.5–6 heads tall for the adults (Vera, Rae), a little less for Cleo and Pip;
// legs about 3.3 heads; arms hang to mid-thigh and swing against the legs.
// act: 'stand' | 'walk' | 'run' | 'jump' (o.air 0..1) | 'trip' (o.fall 0..1, face-down at 1) | 'sit'
// phase: the step cycle in radians (walk: about t * 9, run: t * 15). dir: 1 walks right, -1 left.
'use strict';
const BODY = {
  vera: { hip: 385, thigh: 192, shin: 186, hipW: 25, legW: 34, foot: 30, pants: '#231a33', pantsS: '#160f22', shoe: '#2c2a36', sole: '#15121c', skirt: { col: LAB.coat, colS: LAB.coatS, len: 205, w: 72 }, upper: (g, x, y, s, o) => drawVera2(g, x, y, s, o) },
  cleo: { hip: 340, thigh: 170, shin: 164, hipW: 22, legW: 30, foot: 27, pants: '#3a3550', pantsS: '#28243a', shoe: '#fbf7ff', sole: '#b6ff3b', skirt: { col: LAB2.cleo.apron, colS: LAB2.cleo.apronS, len: 128, w: 40, apron: true }, upper: (g, x, y, s, o) => drawCleo2(g, x, y, s, o) },
  rae: { hip: 385, thigh: 192, shin: 186, hipW: 27, legW: 36, foot: 31, pants: '#36456e', pantsS: '#28345a', shoe: '#3a3546', sole: '#e9e4f4', skirt: null, upper: (g, x, y, s, o) => drawRae2(g, x, y, s, o) },
  pip: { hip: 252, thigh: 126, shin: 122, hipW: 21, legW: 27, foot: 25, pants: '#2f3b6e', pantsS: '#222b55', shoe: '#ffd23f', sole: '#e0a91c', sock: '#fbf7ff', skirt: null, upper: (g, x, y, s, o) => drawPip2(g, x, y, s, o) },
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
    const run = act === 'run', L = B.thigh + B.shin, stride = L * (run ? .26 : .16), lift = L * (run ? .17 : .08);
    feet = [0, 1].map(i => { const p = ph + i * Math.PI; return [(i ? 1 : -1) * B.hipW * .8 + Math.sin(p) * stride * dir, -Math.max(0, Math.cos(p)) * lift]; });
    hipDy = -Math.abs(Math.sin(ph)) * (run ? 16 : 8) + (run ? 18 : 2);
    lean = run ? .1 * dir : .02 * dir;
  } else if (act === 'jump') {
    const a = o.air || 0;
    feet = [[-B.hipW * .9, -a * 120], [B.hipW * .9, -a * 120]];
    hipDy = -a * 200;
  } else if (act === 'sit') {
    feet = [[-B.hipW - 24, 0], [B.hipW + 24, 0]]; hipDy = B.hip * .45;
  } else {
    feet = [[-B.hipW, 0], [B.hipW, 0]];
  }
  return { hipDy, lean, feet };
}
function drawLowerBody(g, B, pose, o) {
  const hipY = -B.hip + pose.hipDy, dir = o.dir || 1;
  // trousers: a seat behind the leg tops, so there is no gap between them (only its lower curve shows, as the crotch)
  { const pw = B.hipW + B.legW * .5;
    tShape(g, B.pants, gg => { gg.moveTo(-pw, hipY - 14); gg.lineTo(pw, hipY - 14); gg.lineTo(pw, hipY + 20); gg.quadraticCurveTo(0, hipY + 52, -pw, hipY + 20); gg.closePath(); }, 3); }
  // legs: the far leg first
  [0, 1].forEach(i => {
    const hx = (i ? 1 : -1) * B.hipW, [fx, fy] = pose.feet[i];
    const bend = (o.act === 'sit' ? -1 : 1) * (dir > 0 ? -1 : 1) * (i ? 1 : -1) * 0 + (dir > 0 ? -1 : 1);
    const [kx, ky] = legIK(hx, hipY, fx, fy - 10, B.thigh, B.shin, bend);
    tTube(g, [hx, hipY, (hx + kx) / 2, (hipY + ky) / 2, kx, ky, (kx + fx) / 2, (ky + fy - 10) / 2, fx, fy - 10], B.legW, B.pants, B.pantsS);
    if (B.sock) tShape(g, B.sock, gg => gg.roundRect(fx - 11, fy - 36, 22, 22, 6), 2.4);
    // shoe: points the way she walks
    tShape(g, B.shoe, gg => gg.ellipse(fx + 12 * dir, fy - 8, B.foot, B.foot * .48, 0, 0, 6.2832), 3);
    tShape(g, B.sole, gg => gg.rect(fx + 12 * dir - B.foot, fy - 3, B.foot * 2, 6), 2);
  });
  // the lab coat (two panels with an open slit and a curved hem) or Cleo's apron (one front panel)
  if (B.skirt) {
    const S = B.skirt, sw = (pose.feet[1][0] - pose.feet[0][0]) * .1;
    if (S.apron) {
      const p = gg => { gg.moveTo(-S.w, hipY - 8); gg.lineTo(S.w, hipY - 8); gg.lineTo(S.w + 4 + sw, hipY + S.len - 6); gg.quadraticCurveTo(sw, hipY + S.len + 8, -S.w - 4 + sw, hipY + S.len - 6); gg.closePath(); };
      tShape(g, S.col, p); tShade(g, p, S.colS, gg => gg.rect(S.w * .4, hipY - 10, 40, S.len + 20));
    } else for (const side of [-1, 1]) {
      const sl = side * (10 + Math.abs(sw) * .4);                                   // the slit opens a little as she walks
      const p = gg => { gg.moveTo(side * 2, hipY - 10); gg.lineTo(side * (S.w - 2), hipY - 10); gg.quadraticCurveTo(side * (S.w + 10) + sw, hipY + S.len * .55, side * (S.w + 14) + sw * 1.3, hipY + S.len);
        gg.quadraticCurveTo(side * (S.w * .5) + sw, hipY + S.len + 10, sl + sw, hipY + S.len - 4); gg.lineTo(side * 2, hipY + S.len * .35); gg.closePath(); };
      tShape(g, S.col, p); if (side > 0) tShade(g, p, S.colS, gg => gg.rect(S.w * .45, hipY - 12, 70, S.len + 24));
      tLine(g, [side * (S.w * .55), hipY + S.len * .2, side * (S.w * .62), hipY + S.len * .34], 2.4);   // pocket
    }
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
  const swing = o.act === 'walk' ? 26 : o.act === 'run' ? 48 : 0, ph = o.phase || 0;
  const up = (o.armsDown === undefined && !o.cheer && !o.reachR && !o.reachL && !o.hold && !o.point && !o.clipboard) ? Object.assign({ armsDown: { l: Math.sin(ph) * swing * dir, r: -Math.sin(ph) * swing * dir, hold: o.carry } }, o) : o;
  B.upper(g, 0, (-B.hip + pose.hipDy) * k, s, up);
  g.restore();
}
