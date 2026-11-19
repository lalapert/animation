// Volt Labs 10 "The Reverse Oven": WHERE'S DINNER? Vera, big, grinning, fans out the cash her reverse oven turned Thanksgiving
// dinner back into; in the oven's blue-lit window, the receipt ($38.47); Cleo small behind the oven holds up the alarm clock.
COVER['vl10-the-reverse-oven'] = g => {
  coverBurst(g, 560, 1120, ['#e2f6ff', '#2a86d0', '#0a1830'], 14, -.04);
  const BENCH = 1840;
  const cash = (x, y, k, n) => {
    g.save(); g.translate(x, y); g.scale(k, k);
    for (let i = 0; i < n; i++) { g.save(); g.translate(-30 + i * 15, -6 - i * 2); g.rotate(-.55 + i * .22); tShape(g, i % 2 ? '#8fc47a' : '#7db86a', gg => gg.roundRect(-34, -16, 68, 32, 3), 2.6); g.strokeStyle = '#4f7a42'; g.lineWidth = 2; g.strokeRect(-28, -11, 56, 22); tText(g, '$', 0, 1, 18, '#3c6a32', '"Bungee"', 'center', 400); g.restore(); }
    g.restore();
  };
  // the oven (right), its window lit reverse-blue with the receipt inside
  const ox = 640, ow = 400, oy = 1560, oh = BENCH - oy;
  // Cleo, small, behind the oven (it hides her from the waist down), holding up the alarm clock
  drawCleo2(g, 905, oy + 8, 165, { expr: 'deadpan', remote: true, reachL: { x: -84, y: -132 } });
  g.save(); g.translate(905 - 84 * 1.65 + 4, oy + 8 - 132 * 1.65 + 34); g.scale(1.25, 1.25);
  for (const sx of [-1, 1]) { tLine(g, [sx * 14, -10, sx * 22, 0], 4); tShape(g, '#d6d9e2', gg => gg.arc(sx * 20, -64, 12, Math.PI, 0), 3); }
  tEllipse(g, 0, -38, 30, 30, '#e04a5a', 3.4); tEllipse(g, 0, -38, 22, 22, '#fbf7ff', 2.6); tLine(g, [0, -38, 9, -42], 3.4); tLine(g, [0, -38, 0, -54], 2);
  g.restore();
  tHand(g, 905 - 84 * 1.65, oy + 8 - 132 * 1.65, 8.5 * 1.65, LAB2.cleo.glove, LAB.glowS);
  tShape(g, '#efe6cf', gg => gg.roundRect(ox, oy, ow, oh, 18), 5);
  tShape(g, '#2f3a44', gg => gg.roundRect(ox + 12, oy + 10, ow - 24, 34, 8), 3.4);
  tText(g, 'REVERSE OVEN', ox + ow / 2, oy + 29, 25, LAB.glow, '"Bungee"', 'center', 400);
  const wx = ox + 130, wy = oy + 62, ww = ow - 148, wh = oh - 84;
  g.save(); g.beginPath(); g.roundRect(wx, wy, ww, wh, 10); g.clip();
  g.fillStyle = '#163a5a'; g.fillRect(wx, wy, ww, wh);
  const gr = g.createRadialGradient(wx + ww / 2, wy + wh / 2, 10, wx + ww / 2, wy + wh / 2, 180); gr.addColorStop(0, 'rgba(120,210,255,.7)'); gr.addColorStop(1, 'rgba(120,210,255,0)'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
  g.save(); g.translate(wx + ww / 2, wy + wh - 10); g.scale(1.25, 1.25);
  tShape(g, '#fbfaf2', gg => { gg.moveTo(-34, 0); gg.lineTo(-34, -118); gg.quadraticCurveTo(-34, -132, -20, -132); gg.lineTo(34, -132); gg.lineTo(34, -6); gg.quadraticCurveTo(46, -2, 40, 6); gg.quadraticCurveTo(10, 10, -34, 0); gg.closePath(); }, 3);
  for (let i = 0; i < 4; i++) tLine(g, [-24, -116 + i * 14, 8 - (i % 2) * 10, -116 + i * 14], 2);
  tText(g, 'TOTAL', -6, -46, 12, TOON.ink, '"Bungee"', 'center', 400); tText(g, '$38.47', 0, -26, 17, '#c2233a', '"Bungee"', 'center', 400);
  g.restore(); g.restore();
  g.lineWidth = 9; g.strokeStyle = '#2f3a44'; g.beginPath(); g.roundRect(wx - 4, wy - 4, ww + 8, wh + 8, 12); g.stroke();
  tShape(g, '#0e1a12', gg => gg.roundRect(ox + 20, oy + 66, 92, 40, 6), 3); tText(g, 'NOV 18', ox + 66, oy + 88, 19, '#9be6ff', '"Bungee"', 'center', 400);
  tShape(g, '#c9cfdb', gg => gg.arc(ox + 66, oy + 170, 36, 0, 6.2832), 4); tLine(g, [ox + 66, oy + 170, ox + 40, oy + 152], 7);
  // Vera, big, grinning, the cash fanned out in her hand (below her face)
  drawVera2(g, 400, BENCH, 380, { expr: 'scheme', tube: false, reachR: { x: 26, y: -100 } });
  cash(400 + 26 * 3.8 - 20, BENCH - 100 * 3.8 - 30, 3.2, 5);
  tHand(g, 400 + 26 * 3.8, BENCH - 100 * 3.8, 9.5 * 3.8, LAB2.vera.skin, LAB2.vera.skinS);
  // the bench
  tShape(g, '#4a5266', gg => gg.rect(-20, BENCH - 6, W + 40, 34), 5);
  tShape(g, '#2a2f3d', gg => gg.rect(-20, BENCH + 28, W + 40, H), 5);
  coverSparkles(g, [[150, 900, 26], [880, 860, 22], [990, 1200, 16]], '#e9fbff');
};
