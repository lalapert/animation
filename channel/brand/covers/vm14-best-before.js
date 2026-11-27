// Void Mart 14 "Best Before": GOOD TILL TONIGHT? Pip, huge, shocked, holding the milk at us with both hands; its date reads
// BEST BEFORE: HEAT DEATH OF THE UNIVERSE. Behind her the stars are going out (pop rings, a few already gone).
COVER['vm14-best-before'] = g => {
  coverBurst(g, 540, 1250, ['#c9d8ff', '#3b2a8a', '#0c0824'], 18, .06);
  // stars going out: lit ones, and the pop ring of one that just went
  const stars = [[150, 820, 22], [930, 860, 18], [200, 1180, 16], [880, 1150, 20], [90, 1500, 14], [1000, 1460, 15]];
  coverSparkles(g, stars, '#fff6c8');
  for (const [x, y, r] of [[760, 790, 34], [330, 900, 28]]) {
    g.strokeStyle = 'rgba(255,246,200,.75)'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,246,200,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r * 1.6, 0, Math.PI * 2); g.stroke();
  }
  // the carton (same drawing as the film), origin bottom centre
  const carton = (x, y, s) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    const body = gg => gg.rect(-37, -100, 74, 100);
    tShape(g, '#fbf7ff', body); tShade(g, body, '#d9d2ee', gg => gg.rect(20, -104, 24, 108)); tShape(g, null, body, 3.4);
    tShape(g, '#7ec8ff', gg => { gg.moveTo(-37, -100); gg.lineTo(-30, -124); gg.lineTo(30, -124); gg.lineTo(37, -100); gg.closePath(); }, 3.2);
    tShape(g, '#7ec8ff', gg => gg.rect(-30, -132, 60, 8), 2.8);
    tText(g, 'MILK', 0, -111, 13, '#ffffff', '"Bungee"', 'center', 400);
    tShape(g, '#2f6fd6', gg => gg.rect(-37, -98, 74, 20), 0.01);
    tText(g, 'VOID MART', 0, -87.5, 9.5, '#ffffff', '"Bungee"', 'center', 400);
    tShape(g, '#fff3c4', gg => gg.roundRect(-33, -74, 66, 70, 5), 2.4);
    tText(g, 'BEST BEFORE:', 0, -65, 8, '#e23b4a', '"Bungee"', 'center', 400);
    tText(g, 'HEAT DEATH', 0, -51, 9.2, TOON.ink, '"Bungee"', 'center', 400);
    tText(g, 'OF THE', 0, -38, 9.6, TOON.ink, '"Bungee"', 'center', 400);
    tText(g, 'UNIVERSE', 0, -25, 9.8, TOON.ink, '"Bungee"', 'center', 400);
    drawStar(g, -24, -12, 4.5, '#ffd23f', 1.6); drawStar(g, 24, -12, 4.5, '#ffd23f', 1.6);
    g.restore();
  };
  // Pip, huge, shocked; the film's hold pose: hands on the carton's blue band
  const s = 4.5, px = 540, base = 1935, hy = base - 104 * s, cs = 2.6;   // her body runs off the bottom
  drawPip2(g, px, base, s * 100, { expr: 'gasp', hold: true });
  carton(px, hy + 92 * cs, cs);
  for (const sx of [-1, 1]) tHand(g, px + sx * 14 * s, hy, 8.5 * s, TOON.pip.skin, TOON.pip.skinS);
};
