// Volt Labs 5 "The Monologue": 3 HOURS 11 MINUTES. Vera, huge, mid-monologue, one fist up, the other hand holding up the
// receipt-paper speech that spills down the left side to the floor; the plants in front of her have died; Cleo, deadpan,
// bottom right, next to the microwave timer reading 3:11:00.
COVER['vl05-the-monologue'] = g => {
  coverBurst(g, 600, 1050, ['#efffb0', '#3e9a5a', '#0e2a20'], 16, .08);
  const s = 3.7, vx = 470, base = 2010;
  // the speech: a receipt strip from her raised left hand (viewer's left) down the left side in loose S-curves
  const hx = vx - 86 * s, hy = base - 262 * s;
  const strip = [[hx, hy - 30], [hx - 160, hy + 160], [hx + 70, hy + 330], [hx - 150, hy + 520], [hx + 40, hy + 700], [hx - 120, hy + 880], [hx + 90, hy + 1000]];
  const stripPath = (gg, off) => { gg.moveTo(strip[0][0] + off, strip[0][1]); for (let i = 1; i < strip.length - 1; i++) { const mx = (strip[i][0] + strip[i + 1][0]) / 2, my = (strip[i][1] + strip[i + 1][1]) / 2; gg.quadraticCurveTo(strip[i][0] + off, strip[i][1], mx + off, my); } gg.lineTo(strip[strip.length - 1][0] + off, strip[strip.length - 1][1]); };
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); stripPath(g, 0); g.lineWidth = 92; g.strokeStyle = TOON.ink; g.stroke();
  g.beginPath(); stripPath(g, 0); g.lineWidth = 84; g.strokeStyle = '#fbf7ff'; g.stroke();
  g.save(); g.setLineDash([26, 14]); for (const off of [-22, -6, 10, 24]) { g.beginPath(); stripPath(g, off); g.lineWidth = 3; g.strokeStyle = 'rgba(60,50,90,.45)'; g.stroke(); } g.restore();
  // dead plants in front, bottom left
  for (const [px, py, k] of [[120, 1760, 1], [300, 1830, 1.15]]) {
    g.save(); g.translate(px, py); g.scale(k, k);
    tShape(g, '#c96b3c', gg => { gg.moveTo(-50, -10); gg.lineTo(50, -10); gg.lineTo(38, 70); gg.lineTo(-38, 70); gg.closePath(); }, 4);
    tShape(g, '#a8552c', gg => gg.rect(-56, -24, 112, 18), 4);
    for (const [a, l] of [[-.5, 90], [.1, 110], [.6, 80]]) {
      const ex = Math.sin(a) * l * .6, ey = -24 - l * .55;
      tCurve(g, 0, -24, ex * .3, ey, ex + Math.sign(a || 1) * 40, ey + 34, 5, '#6b6a3a');
      tShape(g, '#8a7a45', gg => gg.ellipse(ex + Math.sign(a || 1) * 44, ey + 42, 14, 7, .9 * Math.sign(a || 1), 0, 6.2832), 3);
    }
    tShape(g, '#b7a0d8', gg => gg.ellipse(46, 62, 12, 6, .3, 0, 6.2832), 3);   // a fallen petal
    g.restore();
  }
  // Vera, huge, mid-speech: both arms up, mouth wide, manic pupils
  drawVera2(g, vx, base, s * 100, { expr: 'scheme', cheer: true, mouth: { a: 1, shape: 'a' } });
  // the top of the strip in her hand (drawn over the hand)
  g.save(); g.translate(hx, hy - 36); g.rotate(-.12);
  tShape(g, '#fbf7ff', gg => gg.rect(-46, -40, 92, 54), 4);
  for (let i = 0; i < 3; i++) tLine(g, [-34, -26 + i * 13, 28 - (i % 2) * 16, -26 + i * 13], 2.4);
  g.restore();
  // Cleo, bottom right, deadpan, and the microwave with the time
  drawCleo2(g, 900, 2010, 230, { expr: 'deadpan', armsDown: { l: 0, r: 0, bend: 0 } });
  g.save(); g.translate(860, 1800); g.scale(1.15, 1.15);
  tShape(g, '#dfe3ec', gg => gg.roundRect(-150, -96, 300, 192, 18), 5);
  tShape(g, '#1b2230', gg => gg.roundRect(-128, 22, 170, 54, 10), 4);
  tShape(g, '#0f1a14', gg => gg.roundRect(-118, -64, 226, 76, 10), 3.4);
  g.save(); g.shadowColor = '#7dff9a'; g.shadowBlur = 18; tText(g, '3:11:00', -5, -26, 50, '#9dffb0', '"Bungee"', 'center', 400); g.restore();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) tShape(g, '#b9bfcc', gg => gg.roundRect(64 + i * 24, 24 + j * 18, 18, 12, 3), 2);
  g.restore();
  coverSparkles(g, [[980, 820, 20], [80, 900, 16], [1000, 1180, 14]], '#f4ffcf');
};
