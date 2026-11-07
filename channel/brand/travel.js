// Moving without walking legs (11/8, owner's choice: 1 waist-up travel, 2 things in front that hide the legs, 6 hopping).
// 1. walkBob: a waist-up character that travels gets the rhythm of steps: the body is lowest at each footfall and highest between them,
//    a slight alternating tilt, arms swinging a little; footstep times for the sound. The legs are never drawn: the frame or something in
//    front of her cuts at the waist.
// 2. Occluders live in the sets (lab bench, store counter, the aisle shelf in sets.js, fences, parked cars): draw the character, then the occluder.
// 6. hopPose: two-feet hops for small, bouncy movement (Pip): crouch, push off, fly, land with a squash.
'use strict';
// step rhythm from distance travelled (world px). stepLen ~ 0.6 x the character's leg length on screen; amp ~ 2% of her height
function walkBob(dist, stepLen, amp) {
  const u = dist / stepLen, f = u - Math.floor(u), side = Math.floor(u) % 2 ? 1 : -1;
  return { dy: -amp * Math.sin(Math.PI * f), rot: side * .012 * Math.sin(Math.PI * f), swing: Math.cos(Math.PI * u) };
}
// a straight walk at a natural pace (about 1.9 steps a second): {x, dist, moving, dir, arrive}
function travel(t, t0, x0, x1, stepLen, stepsPerSec = 1.9) {
  const v = stepLen * stepsPerSec, d = Math.abs(x1 - x0), T = d / v, k = Math.max(0, Math.min(T, t - t0));
  // ease in over the first step and out over the last, so starting and stopping are not abrupt
  const e = T > 1 ? k : k;
  return { x: x0 + Math.sign(x1 - x0) * v * e, dist: v * e, moving: t > t0 && t < t0 + T, dir: Math.sign(x1 - x0) || 1, arrive: t0 + T };
}
// the times of footfalls of a travel() call, for the mix (one 'step' event each)
function footfalls(t0, x0, x1, stepLen, stepsPerSec = 1.9) {
  const n = Math.floor(Math.abs(x1 - x0) / stepLen), out = [];
  for (let i = 1; i <= n; i++) out.push(t0 + i / stepsPerSec);
  return out;
}
// one hop cycle, p in 0..1: crouch 0-.18, push and fly .18-.82, land .82-1. Returns the lift (px, up is negative), squash (y scale) and
// whether the feet are on the ground. h = hop height in px.
function hopPose(p, h) {
  p = ((p % 1) + 1) % 1;
  if (p < .18) { const k = Math.sin(Math.PI * p / .18 * .5); return { dy: 0, sy: 1 - .1 * k, sx: 1 + .06 * k, ground: true }; }
  if (p < .82) { const q = (p - .18) / .64; return { dy: -4 * h * q * (1 - q), sy: 1 + .06 * Math.sin(Math.PI * q), sx: 1 - .03 * Math.sin(Math.PI * q), ground: false }; }
  const k = Math.sin(Math.PI * (p - .82) / .18); return { dy: 0, sy: 1 - .08 * k, sx: 1 + .05 * k, ground: true };
}
// draw an upper-body rig travelling waist-up: draw(g, x, y, o) is the rig call; the rig's origin is the waist line
function drawTraveller(g, draw, x, waistY, s, o, bob, dir) {
  g.save(); g.translate(x, waistY + bob.dy); g.rotate(bob.rot);
  const arms = { l: bob.swing * 16 * dir, r: -bob.swing * 16 * dir, bend: .05 };
  draw(g, 0, 0, s, Object.assign({ turn: .7 * dir, armsDown: arms }, o));
  g.restore();
}
