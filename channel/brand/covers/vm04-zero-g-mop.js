// Void Mart 4 "Zero-G Mop": GRAVITY IS NOW OPTIONAL. Pip floats upside down, grinning, mop in both hands; Rae stays put
// (magnetic boots), deadpan, with blue slush and stock floating past her (never over her face).
COVER['vm04-zero-g-mop'] = g => {
  coverBurst(g, 470, 1180, ['#9ff3ff', '#5b2ab8', '#1a0e40'], 16, .25);
  const blob = (x, y, r) => { tShape(g, '#5fb8ff', gg => gg.ellipse(x, y, r, r * .86, .3, 0, 6.2832), 3.4); tEllipse(g, x - r * .3, y - r * .32, r * .26, r * .18, 'rgba(255,255,255,.75)', 0); };
  const choco = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); tShape(g, '#ffd23f', gg => gg.roundRect(-46, -16, 92, 32, 6), 3); tText(g, 'CHOCO', 0, 1, 16, TOON.ink); g.restore(); };
  const tag = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); tShape(g, '#ff5f7e', gg => gg.roundRect(-34, -18, 68, 36, 6), 3); tText(g, '50%', 0, 1, 18, '#fbf7ff'); g.restore(); };
  // floating stock around the edges (clear of the faces)
  choco(150, 820, -.5); choco(930, 760, .6); tag(990, 1060, -.3); tag(110, 1640, .4); choco(620, 1780, .2);
  for (const [x, y, r] of [[120, 1180, 30], [700, 820, 22], [985, 1290, 26], [560, 1660, 18], [250, 1500, 16]]) blob(x, y, r);
  // Rae, bottom right, rooted to the floor, not impressed
  drawRae2(g, 905, 1985, 228, { expr: 'deadpan', look: -1.6, scanner: false });
  // Pip, big, upside down, grinning, with the mop (both hands on it; every hand has its arm)
  const s = 3.3; g.save(); g.translate(430, 770); g.rotate(Math.PI - .12);
  drawPip2(g, 0, 0, s * 100, { expr: 'grin', hold: true });
  g.scale(s, s); g.translate(0, -104); g.rotate(1.05);
  tShape(g, '#c9a24a', gg => gg.roundRect(-5, -190, 10, 200, 5), 3);
  tShape(g, '#e9e6f4', gg => { gg.moveTo(-34, -176); gg.lineTo(34, -176); gg.lineTo(28, -220); gg.lineTo(-28, -220); gg.closePath(); }, 3);
  for (let i = -3; i <= 3; i++) tLine(g, [i * 9, -216, i * 10, -236 - (i % 2) * 6], 3);
  g.restore();
  coverSparkles(g, [[860, 900, 20], [300, 1720, 16], [990, 1460, 14]]);
};
