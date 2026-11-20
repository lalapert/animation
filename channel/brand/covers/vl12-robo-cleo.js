// Volt Labs 12 "Robo-Cleo": REPLACED BY THIS? Cleo, big, deadpan, side-eyeing the robot built to replace her: Robo-Cleo, a boxy
// robot in her colours with a deadpan LED face, side-eyeing her back. Both behind the lab bench.
// The robot's drawing is copied from vl12-robo-cleo/film.js (drawn per episode; the shared rigs are unchanged).
(() => {
  const RK = 2.75, RLW = 8;
  const RC = { head: '#cdbdf2', headS: '#9c86d6', headL: '#f1ebff', body: '#fbf7ff', bodyS: '#dcd4ee', apron: '#26213a', apronS: '#17132a',
    metal: '#5d6474', metalS: '#3a3f4c', joint: '#8a93ab', glove: '#b6ff3b', gloveS: '#6fcf1f', screen: '#151127', led: '#8ffcf0', ledG: '#2fe0d0' };
  const SHX = 56, SHY = -160, A1 = 50, A2 = 50, STRIDE = 75;
  const CHEST = { x: 0, y: -121 };                                    // the OFF switch on its chest (local)
  function armJoint(sx, P) {                                           // elbow for a shoulder at (sx*SHX, SHY) and a hand at P (local)
    const Sx = sx * SHX, Sy = SHY, dx = P.x - Sx, dy = P.y - Sy, d = Math.hypot(dx, dy) || 1;
    if (d >= A1 + A2 - 1) return { x: Sx + dx * A1 / (A1 + A2), y: Sy + dy * A1 / (A1 + A2) };   // a robot arm: it telescopes
    const a = Math.atan2(dy, dx), b = Math.acos(clamp((d * d + A1 * A1 - A2 * A2) / (2 * d * A1), -1, 1));
    const e1 = { x: Sx + A1 * Math.cos(a + b), y: Sy + A1 * Math.sin(a + b) }, e2 = { x: Sx + A1 * Math.cos(a - b), y: Sy + A1 * Math.sin(a - b) };
    return (sx * e1.x + .3 * e1.y > sx * e2.x + .3 * e2.y) ? e1 : e2; // the elbow out and down
  }
  function drawClaw(g, W, u, open = .4) {                              // a two-finger lime pincer at the wrist W, pointing along u
    const n = { x: -u.y, y: u.x };
    for (const s of [-1, 1]) {
      const b = { x: W.x + u.x * 6 + n.x * s * 5, y: W.y + u.y * 6 + n.y * s * 5 };
      const m = { x: W.x + u.x * 16 + n.x * s * (9 + 6 * open), y: W.y + u.y * 16 + n.y * s * (9 + 6 * open) };
      const e = { x: W.x + u.x * 26 + n.x * s * (4 + 5 * open), y: W.y + u.y * 26 + n.y * s * (4 + 5 * open) };
      tTube(g, [b.x, b.y, m.x, m.y, e.x, e.y], 8, RC.glove);
    }
    tShape(g, RC.glove, gg => gg.arc(W.x, W.y, 11, 0, 6.2832), RLW * .7);
    tShade(g, gg => gg.arc(W.x, W.y, 11, 0, 6.2832), RC.gloveS, gg => gg.arc(W.x + 5, W.y + 5, 9, 0, 6.2832));
  }
  function drawArm(g, sx, P, open) {
    const E = armJoint(sx, P), Sx = sx * SHX;
    tTube(g, [Sx, SHY, (Sx + E.x) / 2, (SHY + E.y) / 2, E.x, E.y], 19, RC.body, RC.bodyS);
    tTube(g, [E.x, E.y, (E.x + P.x) / 2, (E.y + P.y) / 2, P.x, P.y], 17, RC.body, RC.bodyS);
    tShape(g, RC.joint, gg => gg.arc(E.x, E.y, 8, 0, 6.2832), RLW * .6);
    tShape(g, RC.joint, gg => gg.arc(Sx, SHY, 11, 0, 6.2832), RLW * .6);
    const d = Math.hypot(P.x - E.x, P.y - E.y) || 1;
    drawClaw(g, P, { x: (P.x - E.x) / d, y: (P.y - E.y) / d }, open);
  }
  // LED cells: the face is drawn on a 4-unit grid of glowing squares (eyes 6x2, mouth 4x1); f = {mode, ex, ey, a, k, lit}
  function ledFace(g, f, glow) {
    const cell = 4, sq = 3.3;
    const put = (cx, cy, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) g.fillRect(cx - w * cell / 2 + i * cell, cy - h * cell / 2 + j * cell, sq, sq); };
    g.save(); g.fillStyle = RC.led; g.shadowColor = RC.ledG; g.shadowBlur = glow ? 16 : 8;
    const ex = (f.ex || 0) * cell, ey = (f.ey || 0) * cell;
    if (f.mode === 'shrink') {                                          // the old-screen switch-off: lines, a line, a dot
      const k = f.k;
      if (k < .45) { const h = k < .2 ? 2 : 1; put(-20 + ex, -236 + ey, 6, h); put(20 + ex, -236 + ey, 6, h); if (k < .2) put(0, -214, 4, 1); }
      else if (k < .8) { const w = Math.max(1, Math.round(20 * (1 - (k - .45) / .35))); put(0, -228, w, 1); }
      else { g.globalAlpha = 1 - (k - .8) / .2; put(0, -228, 1, 1); }
    } else {
      const blink = f.mode === 'blink';
      put(-20 + ex, -236 + ey, 6, blink ? 1 : 2); put(20 + ex, -236 + ey, 6, blink ? 1 : 2);
      const a = f.a || 0; put(0, -214, a > .1 ? 3 : 4, 1 + (a > .45 ? 2 : a > .1 ? 1 : 0));
    }
    g.restore();
  }
  function headPath(gg) { gg.roundRect(-60, -302, 120, 112, 24); }
  function screenPath(gg) { gg.roundRect(-46, -272, 92, 72, 13); }
  // o: {face, armL, armR (local points or null), openL, openR, run (0..1), ph (stride phase), lean, roll (head), lit, glow}
  function drawRobo(g, x, y, o = {}) {
    g.save(); g.translate(x, y); g.scale(RK, RK);
    if (o.rot) { g.translate(o.pivot || 0, 0); g.rotate(o.rot); g.translate(-(o.pivot || 0), 0); }
    const run = o.run || 0, ph = o.ph || 0, lit = o.lit !== false;
    const liftL = 22 * run * Math.max(0, Math.sin(ph)), liftR = 22 * run * Math.max(0, -Math.sin(ph));
    const bob = -7 * run * Math.abs(Math.sin(ph));
    // legs and feet (pistons; the knees bend out as a foot lifts)
    for (const [sx, lift] of [[-1, liftL], [1, liftR]]) {
      const hx = sx * 22, hy = -72 + bob, ax = sx * 27, ay = -16 - lift, kx = sx * (27 + 10 * lift / 22), ky = (hy + ay) / 2;
      tTube(g, [hx, hy, kx, ky, ax, ay], 21, RC.metal, RC.metalS);
      tShape(g, RC.joint, gg => gg.arc((hx + 2 * kx + ax) / 4, (hy + 2 * ky + ay) / 4, 8, 0, 6.2832), RLW * .6);
      tShape(g, RC.metalS, gg => gg.roundRect(ax - 22, ay - 4, 44, 18, 6), RLW * .8);
      tShape(g, RC.glove, gg => gg.roundRect(ax - 22 + (sx > 0 ? 30 : 0), ay + 2, 14, 7, 3), 2);
    }
    g.translate(0, bob); g.rotate(o.lean || 0);
    tShape(g, RC.metalS, gg => gg.roundRect(-36, -84, 72, 18, 6), RLW * .8);   // pelvis
    // the body: white, with Cleo's black apron, her pocket and the OFF switch
    const body = gg => gg.roundRect(-52, -182, 104, 112, 16);
    tShape(g, RC.body, body, RLW); tShade(g, body, RC.bodyS, gg => gg.rect(26, -186, 30, 120));
    const apron = gg => { gg.moveTo(-38, -74); gg.lineTo(-38, -122); gg.lineTo(-28, -128); gg.lineTo(-28, -152); gg.lineTo(28, -152); gg.lineTo(28, -128); gg.lineTo(38, -122); gg.lineTo(38, -74); gg.closePath(); };
    tShape(g, RC.apron, apron, RLW * .6); tShade(g, apron, RC.apronS, gg => gg.rect(22, -156, 20, 84));
    tLine(g, [-28, -152, -22, -180], 4); tLine(g, [28, -152, 22, -180], 4);
    tShape(g, RC.apronS, gg => gg.rect(-18, -104, 36, 20), 3);
    tText(g, 'C-2', 0, -93, 11, '#7f7aa0', '"Bungee"', 'center', 400);
    g.save(); if (lit) { g.shadowColor = '#ff3355'; g.shadowBlur = 12; }
    tShape(g, '#d6d9e2', gg => gg.arc(CHEST.x, CHEST.y, 15, 0, 6.2832), 3.4);
    tShape(g, lit ? '#ff3355' : '#b0384c', gg => gg.arc(CHEST.x, CHEST.y, 10, 0, 6.2832), 2.6); g.restore();
    tText(g, 'OFF', 0, -143, 11, '#fbf7ff', '"Bungee"', 'center', 400);
    g.save(); if (lit) { g.shadowColor = RC.glove; g.shadowBlur = 10; } tShape(g, lit ? RC.glove : '#4a5a2a', gg => gg.arc(40, -168, 4.5, 0, 6.2832), 2); g.restore();
    // neck and head (the head rolls a little when it looks)
    tShape(g, RC.metal, gg => gg.rect(-12, -196, 24, 18), RLW * .6);
    g.save(); g.translate(0, -190); g.rotate(o.roll || 0); g.translate(0, 190);
    tShape(g, RC.joint, gg => gg.arc(-61, -246, 9, 0, 6.2832), RLW * .6); tShape(g, RC.joint, gg => gg.arc(61, -246, 9, 0, 6.2832), RLW * .6);
    tTube(g, [-2, -300, 2, -330, 22, -330], 8, RC.head);                // the antenna: her cowlick, bent
    g.save(); if (lit) { g.shadowColor = RC.glove; g.shadowBlur = 12; } tShape(g, lit ? RC.glove : '#4a5a2a', gg => gg.arc(26, -330, 6.5, 0, 6.2832), 3); g.restore();
    tShape(g, RC.head, headPath, RLW); tShade(g, headPath, RC.headS, gg => gg.rect(34, -306, 30, 120));
    tCurve(g, -34, -290, -12, -297, 14, -293, 4, RC.headL);
    // the screen, with her blunt bangs cut over its top edge
    tShape(g, RC.screen, screenPath, RLW * .7);
    g.save(); g.beginPath(); screenPath(g); g.clip();
    if (o.screen ?? lit) { const gr = g.createRadialGradient(0, -228, 4, 0, -228, 60); gr.addColorStop(0, 'rgba(47,224,208,.22)'); gr.addColorStop(1, 'rgba(47,224,208,0)'); g.fillStyle = gr; g.fillRect(-50, -276, 100, 80); }
    const bangs = gg => { gg.moveTo(-52, -280); gg.lineTo(52, -280); const pts = [[48, -257], [40, -251], [32, -257], [24, -250], [14, -256], [6, -250], [-4, -256], [-14, -250], [-24, -256], [-32, -250], [-40, -256], [-48, -251]]; for (const [px, py] of pts) gg.lineTo(px, py); gg.closePath(); };
    g.fillStyle = RC.head; g.beginPath(); bangs(g); g.fill();
    g.lineWidth = 4; g.strokeStyle = TOON.ink; g.lineJoin = 'round'; g.beginPath(); [[48, -257], [40, -251], [32, -257], [24, -250], [14, -256], [6, -250], [-4, -256], [-14, -250], [-24, -256], [-32, -250], [-40, -256], [-48, -251]].forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke();
    if ((o.screen ?? lit) && o.face) ledFace(g, o.face, o.glow);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(22, -246); g.lineTo(38, -262); g.lineTo(42, -252); g.lineTo(28, -238); g.closePath(); g.fill();   // the glass
    g.restore();
    g.lineWidth = RLW * .7; g.strokeStyle = TOON.ink; g.beginPath(); screenPath(g); g.stroke();
    g.save(); g.translate(52, -262); g.rotate(.5);                      // her test-tube clip
    tShape(g, '#fbf7ff', gg => gg.roundRect(-6, -16, 12, 32, 6), 3); tShade(g, gg => gg.roundRect(-6, -16, 12, 32, 6), LAB.glow, gg => gg.rect(-7, 0, 14, 18)); tShape(g, null, gg => gg.roundRect(-6, -16, 12, 32, 6), 3);
    g.restore();
    g.restore();
    // the arms, attached at the shoulders (rest: hanging a little forward)
    const swing = 12 * run * Math.sin(ph);
    drawArm(g, -1, o.armL || { x: -72, y: -96 + swing }, o.openL ?? .3);
    drawArm(g, 1, o.armR || { x: 72, y: -96 - swing }, o.openR ?? .3);
    g.restore();
  }

  COVER['vl12-robo-cleo'] = g => {
    // the lab wall, a soft burst behind the two faces
    g.fillStyle = '#12302a'; g.fillRect(0, 0, W, H);
    let a = 7; const R = () => (a = a * 16807 % 2147483647) / 2147483647;
    for (let r = 0, y = 0; y < H; r++, y += 72) for (let x = (r % 2) * -90; x < W; x += 180) { const v = R(); g.fillStyle = v < .33 ? '#18402f' : v < .66 ? '#1a4433' : '#163b2c'; g.fillRect(x + 4, y + 4, 172, 64); }
    coverBurst(g, 540, 1180, ['#e9e2ff', '#2fe0d0', '#1a3a33'], 14, .08);
    const BENCH = 1760;
    // Cleo, big, deadpan, her eyes on the robot (left)
    drawCleo2(g, 790, 1960, 420, { expr: 'deadpan', look: -1.6 });
    // Robo-Cleo, whole, on the bench, its LED eyes on her (right)
    drawRobo(g, 290, BENCH + 4, { face: { mode: 'on', ex: 2, ey: 0, a: 0 }, roll: -.04, glow: true });
    // the bench (it hides Cleo from the waist down)
    tShape(g, '#4a5266', gg => gg.rect(-20, BENCH, W + 40, 44), 6);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-20, BENCH + 6, W + 40, 7);
    tShape(g, '#262b3a', gg => gg.rect(-20, BENCH + 46, W + 40, H), 6);
    coverSparkles(g, [[1000, 880, 22], [86, 960, 18]], '#e9fffb');
  };
})();
