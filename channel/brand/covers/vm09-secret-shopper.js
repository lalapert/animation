// Void Mart 9 "Secret Shopper": THE SHOPPER WAS... Pip, huge, sobbing; behind her, small, Dennis with the review sign sprung up out
// of his cap on its pole: SECRET SHOPPER, one star of five, MILK: SOLD OUT; a tiny crowned jelly customer on the counter with a milk.
COVER['vm09-secret-shopper'] = g => {
  coverBurst(g, 700, 1000, ['#ffe0e6', '#8a3fd8', '#1e1044'], 16, .12);
  // Dennis, small, behind on the right, and his sign up on its pole
  const dx = 860, dy = 1640, ds = 100;
  g.save(); g.translate(dx, dy); g.scale(ds / 100, ds / 100);
  const top = -290 - 360;
  tShape(g, '#c1c6d8', gg => gg.rect(-6, top + 150, 12, -290 - top - 150), 2.6);
  for (let i = 0; i < 4; i++) tLine(g, [-11, -300 - i * 40, 11, -312 - i * 40], 2.6);
  g.restore();
  drawDennis(g, dx, dy, ds, { item: false });
  // the sign (the gag object), big enough to read
  g.save(); g.translate(dx, dy + (-290 - 360 + 40) * ds / 100); g.rotate(.05); g.scale(1.25, 1.25);
  tShape(g, '#fffdf4', gg => gg.roundRect(-118, -86, 236, 172, 16), 4);
  tShape(g, '#2b2244', gg => gg.roundRect(-118, -86, 236, 40, [16, 16, 0, 0]), 0);
  tText(g, 'SECRET SHOPPER', 0, -66, 22, '#fbf7ff', '"Bungee"', 'center', 400);
  for (let i = 0; i < 5; i++) drawStar(g, -84 + i * 42, -6, 18, i === 0 ? '#ffd23f' : '#e4def0', 2.4);
  tText(g, 'MILK:', 0, 38, 24, '#e23b4a', '"Bungee"', 'center', 400);
  tText(g, 'SOLD OUT', 0, 66, 26, '#e23b4a', '"Bungee"', 'center', 400);
  tShape(g, null, gg => gg.roundRect(-118, -86, 236, 172, 16), 4);
  g.restore();
  // Pip, huge, sobbing, hands up at her chest
  const s = 4.1, px = 330, base = 1990;
  drawPip2(g, px, base, s * 100, { expr: 'sad', hold: true });
  coverTears(g, [[px - 28 * s, base - 168 * s, -1], [px + 28 * s, base - 168 * s, 1]], s / 2.4);
  // a tiny crowned jelly customer on the counter, bottom right, hugging a milk
  g.save(); g.translate(930, 1880); g.scale(1.6, 1.6);
  const body = gg => { gg.moveTo(-40, 0); gg.bezierCurveTo(-46, -40, -30, -74, 0, -74); gg.bezierCurveTo(30, -74, 46, -40, 40, 0); gg.closePath(); };
  tShape(g, '#7ec8ff', body); tShade(g, body, '#5aa2e0', gg => gg.rect(18, -80, 40, 82)); tShape(g, null, body, 3.4);
  tEllipse(g, -12, -42, 5, 6, TOON.ink, 0); tEllipse(g, 12, -42, 5, 6, TOON.ink, 0); tEllipse(g, 12, -42, 10, 10, null, 2.6);
  tCurve(g, -8, -28, 0, -23, 8, -28, 2.6);
  tShape(g, '#ffd23f', gg => { gg.moveTo(-26, -70); gg.lineTo(-26, -90); gg.lineTo(-15, -80); gg.lineTo(-6, -96); gg.lineTo(0, -82); gg.lineTo(6, -96); gg.lineTo(15, -80); gg.lineTo(26, -90); gg.lineTo(26, -70); gg.closePath(); }, 2.6);
  g.restore();
  coverSparkles(g, [[140, 900, 20], [1000, 760, 16]]);
};
