// Volt Labs 9 "Self-Destruct": WHY IS SHE SMILING? Cleo, who never smiles, big in the middle behind the bench with her rare
// smile (happy closed eyes, a small smile, a blush), her red button remote in both hands; on the bench beside her the identical
// new one with its sticky note "SELF-DESTRUCT"; Vera small at the right, flustered, clutching her coffee.
COVER['vl09-self-destruct'] = g => {
  coverBurst(g, 540, 1080, ['#ffe0e4', '#c8283a', '#2a0d14'], 14, .04);
  const BENCH = 1840;                                                 // her hair and cowlick stay under the pill (y < 725 is the headline's)
  // Vera, small, at the right, flustered (behind the bench, waist hidden)
  drawVera2(g, 935, BENCH, 170, { expr: 'fluster', tube: false, reachR: { x: 30, y: -86 } });
  g.save(); g.translate(935 + 6 * 1.7, BENCH - 92 * 1.7); g.scale(1.7, 1.7);
  tShape(g, null, gg => { gg.moveTo(14, -10); gg.bezierCurveTo(28, -10, 28, 10, 14, 10); }, 5);
  tShape(g, '#f4f1ea', gg => gg.roundRect(-15, -18, 30, 34, 5), 3); tShape(g, '#5a3a24', gg => gg.ellipse(0, -18, 13, 3.5, 0, 0, 6.2832), 2.2);
  tText(g, 'V', -1, 0, 15, '#7ccf3a', '"Bungee"', 'center', 400); g.restore();
  tHand(g, 935 + 30 * 1.7, BENCH - 86 * 1.7, 9.5 * 1.7, LAB2.vera.skin, LAB2.vera.skinS);
  tShape(g, '#9fe6ff', gg => { gg.moveTo(1045, 1370); gg.quadraticCurveTo(1055, 1392, 1049, 1402); gg.quadraticCurveTo(1039, 1408, 1035, 1396); gg.quadraticCurveTo(1034, 1384, 1045, 1370); gg.closePath(); }, 2.6);   // a bead of sweat (beside her face)
  // Cleo, big, smiling, her remote in both hands
  const CXc = 560, s = 3.9;
  drawCleo2(g, CXc, BENCH, s * 100, { expr: 'deadpan', blink: true });
  const K = LAB2.cleo;
  const face = gg => { gg.moveTo(0, -268); gg.bezierCurveTo(30, -268, 42, -250, 41, -228); gg.bezierCurveTo(40, -206, 26, -184, 0, -176); gg.bezierCurveTo(-26, -184, -40, -206, -41, -228); gg.bezierCurveTo(-42, -250, -30, -268, 0, -268); gg.closePath(); };
  const shadeP = gg => { gg.moveTo(28, -274); gg.bezierCurveTo(38, -238, 30, -200, 6, -170); gg.lineTo(60, -170); gg.lineTo(60, -274); gg.closePath(); };
  const repaint = (x0, y0, w, h) => {
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    g.beginPath(); face(g); g.fillStyle = K.skin; g.fill();
    g.beginPath(); face(g); g.clip(); g.beginPath(); shadeP(g); g.fillStyle = K.skinS; g.fill(); g.restore();
  };
  g.save(); g.translate(CXc, BENCH); g.scale(s, s); g.translate(0, 22);
  repaint(-31, -227.5, 62, 16); for (const sx of [-1, 1]) closedEye(g, sx * 17, -219, 11, true);
  repaint(-11, -196, 22, 13); tCurve(g, -9, -192, 0, -183, 9, -192, 2.8);
  g.fillStyle = 'rgba(255,120,150,.4)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 26, -202, 9, 5, 0, 0, 6.2832); g.fill(); }
  g.restore();
  // the bench, and the identical new remote on it with its sticky note
  tShape(g, '#4a5266', gg => gg.rect(-20, BENCH - 6, W + 40, 34), 5);
  tShape(g, '#2a2f3d', gg => gg.rect(-20, BENCH + 28, W + 40, H), 5);
  const rx = 235, rs = 3.0, ry = BENCH - 15 * rs;
  g.save(); g.translate(rx - 4 * rs, ry - 44 * rs); g.rotate(-.12); g.scale(rs, rs);
  tShape(g, '#ffe36b', gg => gg.rect(-29, -22, 58, 44), 2.6); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(-29, -22, 58, 8);
  tText(g, 'SELF-', 0, -6, 9.5, '#d0263a', '"Bungee"', 'center', 400); tText(g, 'DESTRUCT', 0, 8, 8.5, '#d0263a', '"Bungee"', 'center', 400);
  g.restore();
  g.save(); g.translate(rx, ry); g.scale(rs, rs);
  tShape(g, '#3a3350', gg => gg.roundRect(-20, -15, 40, 30, 7), 3.4);
  g.save(); g.shadowColor = '#ff3355'; g.shadowBlur = 14; tShape(g, '#ff3355', gg => gg.ellipse(0, -5, 11, 8, 0, 0, 6.2832), 3); g.restore();
  g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-3, -8, 4, 2, 0, 0, 6.2832); g.fill();
  g.restore();
  coverSparkles(g, [[CXc - 300, 900, 30], [CXc + 270, 820, 24], [CXc + 300, 1120, 20], [CXc - 290, 1230, 18]], '#fff6c8');
};
