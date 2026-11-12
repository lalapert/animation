// Void Mart 6 "Employee of the Month": SHE LOST TO A CAMERA. Pip, huge, sobbing, clutching her own VOTE PIP ballot; MAGS on
// the ceiling, smug and glowing, wearing the gold EMPLOYEE OF THE MONTH rosette; behind them a wall of framed MAGS photos.
COVER['vm06-employee-of-the-month'] = g => {
  coverBurst(g, 760, 980, ['#fff3c4', '#8a3fd8', '#1e1044'], 16, -.06);
  // the wall of frames: every one of them is MAGS
  for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) {
    const fx = 60 + i * 210 + (r % 2) * 40, fy = 760 + r * 250;
    if (fx > 1060) continue;
    g.save(); g.globalAlpha = .55;
    tShape(g, '#d9a63a', gg => gg.rect(fx, fy, 150, 190), 4);
    tShape(g, '#2b1858', gg => gg.rect(fx + 14, fy + 14, 122, 138), 3);
    drawMags(g, fx + 75, fy + 40, 90, {});
    tShape(g, '#fbf7ff', gg => gg.rect(fx + 14, fy + 156, 122, 22), 2);
    tText(g, 'MAGS', fx + 75, fy + 167, 14, TOON.ink, '"Bungee"', 'center', 400);
    g.restore();
  }
  // MAGS, top right, smug, eye blazing, with the gold rosette hanging from its mount
  g.save(); g.fillStyle = '#2a1858'; g.fillRect(760, 740, 200, 26); g.restore();
  drawMags(g, 860, 760, 330, { glow: 60, talk: .8 });
  g.save(); g.translate(1000, 1010);
  tCurve(g, -40, -150, -20, -80, 0, -40, 5, '#d9a63a');
  for (const sx of [-1, 1]) tShape(g, '#3a7bd8', gg => { gg.moveTo(sx * 6, 20); gg.lineTo(sx * 34, 120); gg.lineTo(sx * 18, 108); gg.lineTo(sx * 10, 128); gg.lineTo(-sx * 6 + sx * 4, 26); gg.closePath(); }, 3.4);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; tShape(g, '#ffd23f', gg => gg.ellipse(Math.cos(a) * 44, Math.sin(a) * 44, 16, 10, a, 0, 6.2832), 2.6); }
  tShape(g, '#ffe27a', gg => gg.arc(0, 0, 40, 0, 6.2832), 4);
  tText(g, '#1', 0, 2, 34, '#8a5a00', '"Bungee"', 'center', 400);
  g.restore();
  // Pip, huge, sobbing, holding up her ballot
  const s = 3.7, px = 430, base = 1960;
  drawPip2(g, px, base, s * 100, { expr: 'sad', hold: true });
  coverTears(g, [[px - 18 * s - 10 * s, base - 168 * s + 4 * s, -1], [px + 18 * s + 10 * s, base - 168 * s + 4 * s, 1]], s / 2.6);
  g.save(); g.translate(px, base - 104 * s + 34); g.rotate(-.07);
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-120, -64); gg.lineTo(118, -70); gg.lineTo(124, 66); gg.lineTo(-114, 70); gg.closePath(); }, 4.4);
  tText(g, 'VOTE', 0, -26, 40, '#e23b4a', '"Bungee"', 'center', 400);
  tText(g, 'PIP', 0, 30, 54, TOON.ink, '"Bungee"', 'center', 400);
  tShape(g, null, gg => gg.ellipse(0, 28, 82, 40, 0, 0, 6.2832), 4);
  g.restore();
  coverSparkles(g, [[120, 820, 20], [700, 1180, 14]]);
};
