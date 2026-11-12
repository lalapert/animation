// Full-body walking for the toon rigs (owner 11/12: "the official rubber-hose videos walk naturally"). Our own code, after the
// rubber-hose style text (Lemo-Opuscar STYLE.md, read only): legs are noodle tubes of constant width with ONE smooth bend and
// no knee joint, big round shoes, one step per beat with a body bob (lowest when the feet are apart, highest when they pass),
// the swing foot lifts on an arc, the stance foot stays planted (moves back exactly as fast as the body moves forward).
// Use: draw the legs first (they start at the waist line, local y 0), then the upper-body rig on top so the hem covers them.
// Optional (11/12, taller option): L.seat = a pelvis block between the hem and the leg tops (floor = seat + len), L.hipX = leg spacing.
'use strict';
const LEGS = {
  pip: { len: 118, w: 30, hip: 22, pants: '#3b2f63', pantsS: '#2c2350', shoe: '#fbf7ff', sole: '#ff7a1a', shoeW: 34 },
  rae: { len: 140, w: 32, hip: 24, pants: '#3a3546', pantsS: '#2a2634', shoe: '#2b2b33', sole: '#7a7499', shoeW: 36 },
};
// phase p (cycles; 1 = two steps); A = half stride (rig units); returns both feet and the body bob for the rig
function walkPose(p, kind, A = 28, lift = 30, bob = 9) {
  const L = LEGS[kind], feet = [];
  for (const [side, off] of [[-1, 0], [1, .5]]) {
    const q = ((p + off) % 1 + 1) % 1;
    let x, y;
    if (q < .5) { x = A - (q / .5) * 2 * A; y = L.len; }                                    // stance: planted, sliding back under the body
    else { const u = (q - .5) / .5, e = u * u * (3 - 2 * u); x = -A + 2 * A * e; y = L.len - lift * Math.sin(Math.PI * u); }
    feet.push({ side, x, y, swing: q >= .5, q });
  }
  const ph = ((p * 2) % 1 + 1) % 1;                                                         // one bob per step
  return { feet, dy: -bob * Math.sin(Math.PI * ph), swing: Math.cos(2 * Math.PI * p) };
}
// draw the two legs in rig-local units (call inside the rig's translate/scale), dir = +1 walking right, -1 left
function drawLegs(g, kind, pose, dir = 1) {
  const L = LEGS[kind], seat = L.seat || 0, hipX = L.hipX ?? L.hip * .55;
  const sorted = pose.feet.slice().sort((a, b) => (a.side === -dir ? -1 : 1));                  // the far leg first
  g.save(); g.translate(0, seat);                                                              // optional pelvis block (seat > 0): the legs start lower
  for (const f of sorted) {
    const far = f.side === -dir, hx = f.side * hipX, hy = 0, fx = f.x * dir, fy = f.y;
    const dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy), slack = Math.max(0, L.len - d);
    const nx = dy / d * dir, ny = -dx / d * dir, bend = slack * .9 + 5;                         // the one bend points the way she walks
    const cx = (hx + fx) / 2 + nx * bend, cy = (hy + fy) / 2 + ny * bend;
    const col = far ? L.pantsS : L.pants;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const path = () => { g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(cx, cy, fx, fy - 6); };
    path(); g.lineWidth = L.w + 2 * TOON.LW; g.strokeStyle = TOON.ink; g.stroke();
    path(); g.lineWidth = L.w; g.strokeStyle = col; g.stroke();
    // the shoe: a big rounded shoe, toe forward, tipping up a little on the swing
    const tilt = f.swing ? -.25 * Math.sin(Math.PI * (f.q - .5) / .5) * dir : 0;
    g.save(); g.translate(fx, fy); g.rotate(tilt);
    const sw = L.shoeW, shoe = gg => { gg.moveTo(-sw * .55 * dir, 2); gg.bezierCurveTo(-sw * .6 * dir, -16, sw * .2 * dir, -18, sw * .5 * dir, -10); gg.bezierCurveTo(sw * 1.05 * dir, -6, sw * 1.1 * dir, 6, sw * .8 * dir, 8); gg.lineTo(-sw * .55 * dir, 8); gg.closePath(); };
    tShape(g, far ? '#d9d4e6' : L.shoe, shoe);
    tShape(g, L.sole, gg => gg.rect(dir > 0 ? -sw * .55 : -sw * .8, 3, sw * 1.35, 6), 0); tShape(g, null, shoe);
    g.restore();
  }
  g.restore();
  if (seat > 0) {                                                                              // the hips: pants from the hem down to the leg tops
    const hw = L.hipW || hipX + L.w * .75;
    const hips = gg => { gg.moveTo(-hw, -12); gg.lineTo(hw, -12); gg.lineTo(hw + 2, seat + 4); gg.quadraticCurveTo(hw * .5, seat + L.w * .55, 0, seat + 6); gg.quadraticCurveTo(-hw * .5, seat + L.w * .55, -hw - 2, seat + 4); gg.closePath(); };
    tShape(g, L.pants, hips); tShade(g, hips, L.pantsS, gg => gg.rect(dir > 0 ? hw * .35 : -hw - 4, -14, hw * .7, seat + 30));
  }
}
