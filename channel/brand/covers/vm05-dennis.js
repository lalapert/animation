// Void Mart 5 "Dennis": HIS MILK IS GONE. Pip, panicking, pushes a weird stand-in milk at us; Rae, deadpan, has one real carton
// tucked under her arm (the twist); Dennis small and drooping behind them.
COVER['vm05-dennis'] = g => {
  coverBurst(g, 540, 1150, ['#fff3c4', '#8a3fd8', '#1e1044'], 16, .1);
  const carton = (x, y, k, label, col, a = 0) => {
    g.save(); g.translate(x, y); g.rotate(a); g.scale(k, k);
    tShape(g, '#fbf7ff', gg => { gg.moveTo(-34, -40); gg.lineTo(0, -66); gg.lineTo(34, -40); gg.lineTo(34, 60); gg.lineTo(-34, 60); gg.closePath(); }, 3.2);
    tShape(g, col, gg => gg.rect(-34, -6, 68, 40), 2.6); tText(g, label, 0, 15, 15, '#fbf7ff');
    g.restore();
  };
  // Dennis, small, behind, stalks drooping
  drawDennis(g, 540, 1260, 120, {});
  // Rae, right, deadpan, the last real milk under her arm
  drawRae2(g, 860, 1990, 225, { expr: 'deadpan', look: -1.2, scanner: false });
  carton(990, 1730, 1.4, 'MILK', '#3a8fe0', .14);
  // Pip, big, left, worried, holding out a stand-in carton with both hands
  const s = 3.7, px = 330, base = 1900;
  drawPip2(g, px, base, s * 100, { expr: 'worried', hold: true });
  carton(px, base - 104 * s + 40, 1.7, 'MOON MILK?', '#9b7bff', -.08);
  coverSparkles(g, [[150, 900, 22], [960, 840, 18], [700, 1010, 14]]);
};
