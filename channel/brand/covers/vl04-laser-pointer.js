// Volt Labs 4 "Laser Pointer": SHE SPENT THE RENT ON THIS. Vera, scheming, raises the doomsday gauntlet; rent bills fly; Cleo is unmoved.
COVER['vl04-laser-pointer'] = g => {
  coverBurst(g, 640, 980, ['#efffb0', '#3e9a5a', '#0e2a20'], 14, -.05);
  // rent bills flying through the background
  for (const [x, y, r] of [[170, 860, -.4], [930, 1040, .35], [140, 1380, .2], [880, 1580, -.25]]) {
    g.save(); g.translate(x, y); g.rotate(r);
    tShape(g, '#fbf7ff', gg => gg.rect(-70, -48, 140, 96), 3); tShape(g, '#e23b4a', gg => gg.rect(-70, -48, 140, 22), 0); tShape(g, null, gg => gg.rect(-70, -48, 140, 96), 3);
    tText(g, 'RENT DUE', 0, -36, 15, '#fff', '"Bungee"', 'center', 400); tText(g, '$1,800', 0, 6, 26, TOON.ink, '"Bungee"', 'center', 400);
    g.restore();
  }
  // Cleo, bottom right, deadpan
  drawCleo2(g, 910, 1990, 225, { expr: 'deadpan', armsDown: { l: 0, r: 0, bend: 0 } });
  // Vera, huge, scheming; her right arm up with the gauntlet
  const s = 4.0, vx = 410, base = 2000;
  drawVera2(g, vx, base, s * 100, { expr: 'scheme', cheer: true });   // both fists up; the gauntlet on her right
  const hx = vx + 86 * s, hy = base - 262 * s;
  g.save(); g.translate(hx, hy); g.rotate(-1.15); g.translate(-30, 0); const k = s / 2.2;
  g.scale(k, k);
  tShape(g, '#5b5f78', gg => gg.roundRect(-40, -30, 190, 60, 18), 4); tShade(g, gg => gg.roundRect(-40, -30, 190, 60, 18), '#3e4256', gg => gg.rect(-40, 8, 190, 30));
  for (const rx of [10, 50, 90]) tShape(g, '#ff7a1a', gg => gg.rect(rx, -34, 14, 68), 3);
  tShape(g, '#2a2a36', gg => gg.roundRect(140, -22, 36, 44, 8), 3.4);
  g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 60; tEllipse(g, 178, 0, 16, 16, '#ff3355', 3); g.restore();
  tShape(g, '#fbf7ff', gg => gg.rect(-20, -14, 110, 28), 2.4); tText(g, 'ANNIHILATOR', 35, 0, 13, TOON.ink, '"Bungee"', 'center', 400);
  g.restore();
  coverSparkles(g, [[980, 820, 20], [90, 1080, 16]], '#f4ffcf');
};
