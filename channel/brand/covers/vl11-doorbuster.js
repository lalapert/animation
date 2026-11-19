// Volt Labs 11 "Doorbuster": WHO NEEDS LINES? Vera, big, grinning wildly, gripping the rim of a red shopping cart with a rocket
// strapped behind her, flame blasting; Cleo beside her presses the red button; the Black Friday line behind them in the dawn.
COVER['vl11-doorbuster'] = g => {
  coverBurst(g, 600, 1100, ['#ffe9c8', '#e0603a', '#2a1030'], 14, .05);
  const RIMY = 1800;                                                   // hair under the pill (y > 725)
  // the line behind (small, faces only above a barrier)
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 120, y = 1250 + (i % 2) * 14, hat = ['#2d3a5c', '#c23b3b', '#2f6b4a', '#e0b23a', '#5a2d6b'][i % 5], sk = ['#e3b28c', '#c98d6a', '#f3cdb5', '#8d5a3c'][i % 4];
    tShape(g, ['#6f7d4f', '#3b5f9a', '#9a3b5f', '#c98d3a'][i % 4], gg => gg.roundRect(x - 46, y + 40, 92, 120, 30), 3);
    tEllipse(g, x, y, 34, 38, sk, 3);
    tShape(g, hat, gg => { gg.moveTo(x - 36, y - 10); gg.bezierCurveTo(x - 38, y - 60, x + 38, y - 60, x + 36, y - 10); gg.closePath(); }, 3);
    for (const sx of [-1, 1]) { g.fillStyle = TOON.ink; g.beginPath(); g.arc(x + sx * 12 - 6, y + 2, 4, 0, 6.2832); g.fill(); }
    tEllipse(g, x - 4, y + 22, 7, 8, '#5a1430', 2);                                   // they all gasp
  }
  tShape(g, '#2f3a66', gg => gg.rect(-20, 1390, W + 40, 120), 4);
  tText(g, 'LINE STARTS HERE', 540, 1450, 40, '#ffd23f', '"Bungee"', 'center', 400);
  // the rocket over Vera's shoulder, flame blasting left
  const ry = 1120;                                                     // beside her hair, its nose behind her
  const fl = gg => { gg.moveTo(80, ry - 40); gg.quadraticCurveTo(-120, ry - 70, -260, ry); gg.quadraticCurveTo(-120, ry + 70, 80, ry + 40); gg.closePath(); };
  tShape(g, '#ff7a1a', fl, 4);
  g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(80, ry - 26); g.quadraticCurveTo(-40, ry - 34, -140, ry); g.quadraticCurveTo(-40, ry + 34, 80, ry + 26); g.closePath(); g.fill();
  tShape(g, '#c9cfdb', gg => gg.roundRect(70, ry - 52, 300, 104, 50), 5);
  tShape(g, '#e04a3a', gg => { gg.moveTo(362, ry - 42); gg.quadraticCurveTo(440, ry, 362, ry + 42); gg.closePath(); }, 4);
  for (const s2 of [-1, 1]) tShape(g, '#e04a3a', gg => { gg.moveTo(90, ry + s2 * 50); gg.lineTo(40, ry + s2 * 110); gg.lineTo(140, ry + s2 * 50); gg.closePath(); }, 4);
  tShape(g, LAB.glow, gg => { gg.moveTo(150, ry - 24); gg.lineTo(166, ry + 14); gg.lineTo(182, ry - 24); gg.lineTo(174, ry - 24); gg.lineTo(166, ry - 4); gg.lineTo(158, ry - 24); gg.closePath(); }, 3);
  tText(g, 'VOLT LABS', 262, ry + 2, 26, '#2f3a44', '"Bungee"', 'center', 400);
  // Vera, big, gripping the rim; Cleo beside her, pressing
  drawVera2(g, 560, RIMY, 350, { expr: 'scheme', tube: false, reachR: { x: 20, y: -10 } });
  drawCleo2(g, 910, RIMY, 290, { expr: 'deadpan', press: 1 });
  // the basket (solid red plastic: it hides them from the waist down)
  const side = gg => { gg.moveTo(-20, RIMY - 10); gg.lineTo(W + 20, RIMY - 10); gg.lineTo(W + 20, H + 20); gg.lineTo(-20, H + 20); gg.closePath(); };
  tShape(g, '#d8342c', side, 6);
  for (let i = 0; i < 9; i++) tShape(g, '#a82219', gg => gg.roundRect(40 + i * 120, RIMY + 50, 54, 150, 20), 3);
  tShape(g, '#ef5a4f', gg => gg.roundRect(-20, RIMY - 26, W + 40, 34, 14), 5);
  tHand(g, 560 + 20 * 3.5, RIMY - 10 * 3.5, 9.5 * 3.5, LAB2.vera.skin, LAB2.vera.skinS);   // her hand on the rim, over it
  coverSparkles(g, [[980, 860, 24], [120, 900, 20]], '#fff6c8');
};
