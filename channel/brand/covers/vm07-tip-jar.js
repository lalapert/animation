// Void Mart 7 "Tip Jar": THE TIP SCREEN IS WATCHING. MAGS has come down on its pole right into Pip's face, eye blazing; Pip,
// huge, sweating, holds the tip screen with 30% lit; the tip jar with its comet and a tooth glows on the counter.
COVER['vm07-tip-jar'] = g => {
  coverBurst(g, 780, 900, ['#ffd0d4', '#8a3fd8', '#1e1044'], 18, .05);
  // the pole from the ceiling and MAGS, close and huge, top right
  tShape(g, '#c1c6d8', gg => gg.rect(840, 640, 40, 170), 4);
  drawMags(g, 860, 800, 380, { glow: 90, talk: 1 });
  // a red scan cone from the eye onto Pip
  g.save(); g.globalAlpha = .18; g.fillStyle = '#ff2a3a'; g.beginPath(); g.moveTo(880, 1005); g.lineTo(150, 1500); g.lineTo(560, 1700); g.closePath(); g.fill(); g.restore();
  // the tip jar on the counter, bottom left, with the comet inside
  g.save(); g.translate(150, 1660);
  tShape(g, 'rgba(220,240,255,.55)', gg => gg.roundRect(-80, -150, 160, 190, 26), 4.4);
  g.save(); g.shadowColor = '#7ef0ff'; g.shadowBlur = 40; tEllipse(g, 0, -40, 34, 30, '#bff6ff', 3); g.restore();
  tCurve(g, 26, -56, 70, -100, 90, -140, 8, '#7ef0ff');
  tShape(g, '#fbf7ff', gg => gg.roundRect(-20, 0, 26, 30, 8), 3);
  tShape(g, '#fbf7ff', gg => gg.roundRect(-60, -190, 120, 44, 8), 3.4); tText(g, 'TIPS', 0, -168, 28, TOON.ink, '"Bungee"', 'center', 400);
  g.restore();
  // Pip, huge, worried and sweating, holding the tip screen
  const s = 3.6, px = 520, base = 1990;
  drawPip2(g, px, base, s * 100, { expr: 'worried', hold: true, sweat: true });
  g.save(); g.translate(px, base - 104 * s + 30); g.rotate(.04);
  tShape(g, '#2a2440', gg => gg.roundRect(-170, -110, 340, 200, 22), 5);
  tShape(g, '#0e0b1c', gg => gg.roundRect(-150, -92, 300, 164, 14), 3);
  tText(g, 'ADD A TIP?', 0, -66, 24, '#d9ccff', '"Bungee"', 'center', 400);
  [['15%', -100, false], ['20%', 0, false], ['30%', 100, true]].forEach(([t, x, hot]) => {
    if (hot) { g.save(); g.shadowColor = '#ffd23f'; g.shadowBlur = 30; }
    tShape(g, hot ? '#ffd23f' : '#4a3e72', gg => gg.roundRect(x - 44, -36, 88, 70, 12), 3.4);
    if (hot) g.restore();
    tText(g, t, x, 0, 30, hot ? TOON.ink : '#b9a6ff', '"Bungee"', 'center', 400);
  });
  tText(g, 'no tip', 0, 54, 15, '#5c577f', '"Fredoka"', 'center', 600);
  g.restore();
  coverSparkles(g, [[120, 860, 20], [1000, 1300, 14]]);
};
