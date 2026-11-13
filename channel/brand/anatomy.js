// Full-body v3 (owner 11/12: "study human proportions, make it fit the bodies we already show in the videos").
// Proportions below the chin come from anthropometry: Drillis & Contini (1966), segment heights as a fraction of stature
// (the table in Winter, Biomechanics and Motor Control of Human Movement): chin .870, shoulder .818, elbow .630, wrist .485,
// hip joint .530, fingertip .377, knee .285, ankle .039, foot length .152, hip width .191; crotch about .47.
// The heads stay exactly as drawn in the episodes (stylised, big). Only the body below the chin follows the table ("Hb" is the
// stature a body of these proportions would have), and Hb and the floor are solved from the rig's own chin and hands, so
// the shoulders, elbows and fingertips we already show land on their landmarks:
//   Pip: chin -131, fingertips +106 -> Hb 481, floor +287 (local y, 0 = vest hem). 1.55 m, 4.6 heads.
//   Rae: chin -175, 1.13 x Pip's height (1.75 m) -> Hb 551, floor +304. 4.9 heads. Her hanging hands come up to mid-thigh (handY 84).
// The two vest hems sit 287 and 304 above the floor: in the counter shots (both hems on the counter top) the floors differ by
// 17 units (32 px at s 190), so the full bodies continue the counter shots without changing them.
// Use: drawBodyLegs() inside the rig's translate/scale (local y 0 = vest hem), then the upper-body rig translated by pose.drop.
// The waist-up ways of moving (travel.js: walkBob, occluders, hops) stay in use; this is for the shots that show the whole body.
'use strict';
const DC = { chin: .870, shoulder: .818, elbow: .630, wrist: .485, hip: .530, crotch: .470, finger: .377, knee: .285, ankle: .039, foot: .152, hipW: .191 };
function makeBody(o) {
  const y = f => o.F - f * o.Hb;
  const B = Object.assign({ hipY: y(DC.hip), crotchY: y(DC.crotch), kneeY: y(DC.knee), ankleY: y(DC.ankle), fingerY: y(DC.finger), elbowY: y(DC.elbow),
    shoulderY: y(DC.shoulder), chinY: y(DC.chin), ankleH: DC.ankle * o.Hb, footL: DC.foot * o.Hb * 1.08, hipHalf: DC.hipW * o.Hb / 2 }, o);
  B.hipX = B.hipHalf - B.wThigh / 2;
  B.T = B.kneeY - B.hipY; B.S = B.ankleY - B.kneeY;
  B.heads = (B.F - B.top) / (B.chinRig - B.top);
  return B;
}
const BODY = {
  pip: makeBody({ Hb: 481, F: 287, top: -246, chinRig: -131, metres: 1.55, wThigh: 48, wKnee: 32, wHem: 30, handY: 96,
    pants: '#3b2f63', pantsS: '#2c2350', shoe: '#fbf7ff', shoeS: '#d9d4e6', sole: '#ff7a1a' }),
  rae: makeBody({ Hb: 551, F: 304, top: -298, chinRig: -175, metres: 1.75, wThigh: 51, wKnee: 34, wHem: 38, handY: 84,
    pants: '#3a3546', pantsS: '#2a2634', shoe: '#2b2b33', shoeS: '#1f1f26', sole: '#7a7499' }),
};
// a walk: one step per half cycle, the stance foot planted, the hips lowest when the feet are apart (bob ~2.5% of stature),
// stride and lift from the leg length. Returns feet (x along the walk, y lift <= 0), drop (hips and body, + = down), arm swing.
function walkPose3(kind, p, o = {}) {
  const B = BODY[kind], L = B.T + B.S, A = o.A ?? .30 * L, lift = o.lift ?? .12 * L, bob = o.bob ?? .056 * L;
  const feet = [];
  for (const [side, off] of [[-1, 0], [1, .5]]) {
    const q = ((p + off) % 1 + 1) % 1;
    let x, y = 0, u = 0;
    if (q < .5) x = A - (q / .5) * 2 * A;
    else { u = (q - .5) / .5; const e = u * u * (3 - 2 * u); x = -A + 2 * A * e; y = -lift * Math.sin(Math.PI * u); }
    feet.push({ side, x, y, swing: q >= .5, q, u });
  }
  const ph = ((p * 2) % 1 + 1) % 1;
  return { feet, drop: L * .005 + bob * (1 - Math.sin(Math.PI * ph)), swing: Math.cos(2 * Math.PI * p), A };
}
function standPose3() { return { feet: [{ side: -1, x: 0, y: 0 }, { side: 1, x: 0, y: 0 }], drop: 0, swing: 0, stand: true }; }

// two-bone IK, the knee on the side the body faces (dir)
function ik2(hx, hy, ax, ay, T, S, dir) {
  let dx = ax - hx, dy = ay - hy, d = Math.hypot(dx, dy); const m = (T + S) * .9995;
  if (d > m) { ax = hx + dx / d * m; ay = hy + dy / d * m; dx = ax - hx; dy = ay - hy; d = m; }
  const a = Math.acos(Math.max(-1, Math.min(1, (T * T + d * d - S * S) / (2 * T * d)))), th = Math.atan2(dy, dx);
  const k1 = [hx + T * Math.cos(th - a), hy + T * Math.sin(th - a)], k2 = [hx + T * Math.cos(th + a), hy + T * Math.sin(th + a)];
  return { knee: (k1[0] * dir >= k2[0] * dir) ? k1 : k2, ankle: [ax, ay] };
}
function segPath(g, p0, p1, w0, w1) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  g.moveTo(p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2); g.lineTo(p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2);
  g.lineTo(p1[0] - nx * w1 / 2, p1[1] - ny * w1 / 2); g.lineTo(p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2); g.closePath();
}
// a leg as separate shapes (thigh, knee, shin, hip ball): each is stroked, then all are filled, so they join without inner lines
function legParts(B, L) {
  const [hx, hy] = L.hip, [kx, ky] = L.knee, [ax, ay] = L.ankle;
  return [gg => gg.arc(hx, hy, B.wThigh / 2, 0, 6.2832), gg => segPath(gg, L.hip, L.knee, B.wThigh, B.wKnee),
    gg => gg.arc(kx, ky, B.wKnee / 2, 0, 6.2832), gg => segPath(gg, L.knee, [ax, ay + 6], B.wKnee, B.wHem)];
}
function pelvisPath(g, B, drop) {
  const hh = B.hipHalf, top = -12 + drop, hy = B.hipY + drop, cy = B.crotchY + drop;
  g.moveTo(-hh + 3, top); g.lineTo(hh - 3, top); g.quadraticCurveTo(hh + 2, hy - 6, hh, hy + 10);
  g.quadraticCurveTo(hh * .5, cy + 6, 0, cy); g.quadraticCurveTo(-hh * .5, cy + 6, -hh, hy + 10);
  g.quadraticCurveTo(-hh - 2, hy - 6, -hh + 3, top); g.closePath();
}
// the outline trick: stroke every part (twice the line width), then fill every part, so overlapping parts join without inner lines
function inkFill(g, parts, col) {
  g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = 2 * TOON.LW; g.strokeStyle = TOON.ink;
  for (const p of parts) { g.beginPath(); p(g); g.stroke(); }
  g.fillStyle = col; for (const p of parts) { g.beginPath(); p(g); g.fill(); }
}
function shoeSide(g, x, y, F, dir, tilt, col, sole) {
  g.save(); g.translate(x, y); g.rotate(tilt); g.scale(dir, 1);
  const p = gg => { gg.moveTo(-.24 * F, 0); gg.lineTo(.6 * F, 0); gg.quadraticCurveTo(.86 * F, 0, .86 * F, -.13 * F); gg.quadraticCurveTo(.84 * F, -.27 * F, .55 * F, -.28 * F);
    gg.lineTo(.12 * F, -.38 * F); gg.quadraticCurveTo(-.22 * F, -.42 * F, -.27 * F, -.2 * F); gg.quadraticCurveTo(-.3 * F, -.04 * F, -.24 * F, 0); gg.closePath(); };
  tShape(g, col, p);
  g.save(); g.beginPath(); p(g); g.clip(); g.fillStyle = sole; g.fillRect(-.35 * F, -.08 * F, 1.3 * F, .09 * F); g.restore();
  tShape(g, null, p);
  g.restore();
}
function shoeFront(g, x, y, F, col, sole) {
  const p = gg => { gg.moveTo(x - .27 * F, y); gg.lineTo(x + .27 * F, y); gg.quadraticCurveTo(x + .36 * F, y - .3 * F, x, y - .31 * F); gg.quadraticCurveTo(x - .36 * F, y - .3 * F, x - .27 * F, y); gg.closePath(); };
  tShape(g, col, p);
  g.save(); g.beginPath(); p(g); g.clip(); g.fillStyle = sole; g.fillRect(x - .4 * F, y - .08 * F, .8 * F, .09 * F); g.restore();
  tShape(g, null, p);
}
// legs + hips, in rig-local units (0 = vest hem). dir: +1 facing/walking right, -1 left. o.view: 'walk' (3/4, default) or 'front'
function drawBodyLegs(g, kind, pose, dir = 1, o = {}) {
  const B = BODY[kind], front = o.view === 'front', hy = B.hipY + pose.drop;
  const legs = pose.feet.map(f => {
    const hx = f.side * B.hipX * (front ? 1 : .55);
    const ax = front ? f.side * (B.hipX + 3) : f.x * dir + hx * .8, ay = B.ankleY + f.y;
    const k = ik2(hx, hy, ax, ay, B.T, B.S, front ? 0 : dir);
    if (front) k.knee = [(hx + ax) / 2, (hy + ay) / 2];
    return { f, hip: [hx, hy], knee: k.knee, ankle: k.ankle, far: !front && f.side === -dir };
  });
  const shoe = L => {
    const fy = L.ankle[1] + B.ankleH;
    if (front) shoeFront(g, L.ankle[0], fy, B.footL, B.shoe, B.sole);
    else shoeSide(g, L.ankle[0], fy, B.footL, dir, L.f.tilt != null ? L.f.tilt * dir : L.f.swing ? -.25 * Math.sin(Math.PI * L.f.u) * dir : 0, L.far ? B.shoeS : B.shoe, B.sole);   // f.tilt (11/13): a pointed foot for floats and hops
  };
  if (front) {
    inkFill(g, [gg => pelvisPath(gg, B, pose.drop), ...legs.flatMap(L => legParts(B, L))], B.pants);
    legs.forEach(shoe);                                                                         // seen from the front the toes come out over the hem
    return;
  }
  const far = legs.find(L => L.far), near = legs.find(L => !L.far);
  shoe(far); inkFill(g, legParts(B, far), B.pantsS);
  shoe(near); inkFill(g, [gg => pelvisPath(gg, B, pose.drop), ...legParts(B, near)], B.pants);
}

// ---------- whole bodies for the shots that show them (owner 11/13: approved, "natural, not stiff"; usually the body stays hidden) ----------
// Presets in the v3 proportions. Feet are offsets from the standing ankle (x along the facing, y up < 0); tilt points the foot.
const POSE3 = {
  stand: () => standPose3(),
  float: (k = 1) => ({ feet: [{ side: -1, x: -24 * k, y: -40 * k, tilt: .55 }, { side: 1, x: 46 * k, y: -150 * k, tilt: .8 }], drop: 0, swing: 0 }),   // one knee up, toes pointed
  hop: (k = 1) => ({ feet: [{ side: -1, x: -36 * k, y: -215 * k, tilt: 1 }, { side: 1, x: -10 * k, y: -185 * k, tilt: .8 }], drop: 0, swing: 0 }),   // knees tucked
};
// legs (above) + the upper-body rig (toon.js), the vest hem at (x, waist), s = the rig scale; o.rot turns the whole body about its
// middle (o.rot = Math.PI for upside down), o.arms = hangingArms swing {l, r, bend}, o.rig = extra rig options (expr, blink, mouth...).
// Natural, not stiff: knees bent unless the body stands, feet pointed in the air, arms away from the body when floating, a little
// asymmetry; when it moves, ease into and out of the pose over 4-8 frames (anticipation before a hop, a settle after landing).
function drawWhole(g, kind, x, waist, s, pose, dir = 1, o = {}) {
  const B = BODY[kind], k = s / 100;
  g.save();
  if (o.rot) { const my = waist + (B.F * .2) * k; g.translate(x, my); g.rotate(o.rot); g.translate(-x, -my); }
  g.save(); g.translate(x, waist); g.scale(k, k); drawBodyLegs(g, kind, pose, dir, o); g.restore();
  g.save(); g.translate(x, waist + pose.drop * k);
  const ro = Object.assign({ turn: o.view === 'front' ? 0 : .7 * dir, armsDown: o.arms || { l: 0, r: 0 }, handY: B.handY }, o.rig || {});
  if (kind === 'pip') drawPip2(g, 0, 0, s, Object.assign({ expr: 'grin' }, ro));
  else drawRae2(g, 0, 0, s, Object.assign({ expr: 'deadpan', scanner: false }, ro));
  g.restore(); g.restore();
}
