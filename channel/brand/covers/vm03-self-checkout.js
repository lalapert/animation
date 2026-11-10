// Void Mart 3 "Self-Checkout": GOODBYE, KEVIN. Pip sobs over the self-checkout she named; Rae sips her coffee.
COVER['vm03-self-checkout'] = g => {
  coverBurst(g, 470, 1080, ['#ffb3de', '#8a3fd8', '#1e1044'], 16, .1);
  // Kevin, the self-checkout: tall white kiosk, red ear tabs, alarm light, a sad face on the screen (behind Pip, right)
  g.save(); g.translate(800, 1560); g.rotate(.07); const k = 1.9;
  g.scale(k, k);
  tShape(g, '#e23b4a', gg => gg.roundRect(-14, -330, 28, 26, 6), 3);                       // alarm light
  g.save(); g.shadowColor = '#ff3355'; g.shadowBlur = 30; tEllipse(g, 0, -322, 8, 8, '#ff6b7d', 0); g.restore();
  for (const sx of [-1, 1]) tShape(g, '#e23b4a', gg => { gg.moveTo(sx * 70, -300); gg.lineTo(sx * 92, -334); gg.lineTo(sx * 46, -304); gg.closePath(); }, 3);
  tShape(g, '#eef0f7', gg => gg.roundRect(-90, -306, 180, 330, 14), 4); tShade(g, gg => gg.roundRect(-90, -306, 180, 330, 14), '#c1c6d8', gg => gg.rect(50, -320, 60, 360));
  tShape(g, '#1a2a3a', gg => gg.roundRect(-66, -282, 132, 104, 10), 3.4);
  for (const sx of [-1, 1]) { tShape(g, '#7ef0ff', gg => gg.rect(sx * 30 - 9, -252, 18, 14), 0); tLine(g, [sx * 18, -262, sx * 44, -272 + 6], 3); }   // eyes, sad brows
  g.strokeStyle = '#7ef0ff'; g.lineWidth = 4; g.beginPath(); g.moveTo(-26, -204); g.quadraticCurveTo(0, -222, 26, -204); g.stroke();   // frown
  tShape(g, '#5b5f78', gg => gg.roundRect(-60, -160, 120, 18, 6), 2.6); tShape(g, '#c94a5a', gg => gg.rect(-50, -122, 100, 6), 0);
  tShape(g, '#fbf7ff', gg => gg.rect(-74, -40, 148, 26), 2.4); tText(g, 'SELF-CHECKOUT', 0, -27, 15, TOON.ink);
  g.restore();
  // Rae, bottom right, not impressed (no mug: its steam crosses her face)
  drawRae2(g, 968, 1985, 222, { expr: 'deadpan', look: -1.8, scanner: false });
  // Pip, huge, sobbing, hands clasped under her chin
  const s = 4.3, px = 400, base = 1830;
  drawPip2(g, px, base, s * 100, { expr: 'sad', hold: true, wave: false });
  coverTears(g, [[px - 28 * s, base - 156 * s, -1], [px + 28 * s, base - 156 * s, 1]], s);
  coverSparkles(g, [[150, 900, 22], [960, 820, 18], [120, 1300, 14]]);
};
