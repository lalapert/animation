// Volt Labs 8 "Invisible": WHO'S IN THE COAT? Vera's lab coat stands up with nobody in it: the goggles and a wild grin float
// where her face would be, one empty sleeve raises the empty INVISIBLE flask; Cleo small and unmoved.
COVER['vl08-invisible'] = g => {
  coverBurst(g, 560, 1000, ['#efffb0', '#3e9a5a', '#0e2a20'], 14, -.05);
  // Cleo, bottom right, deadpan
  drawCleo2(g, 950, 2040, 210, { expr: 'deadpan', armsDown: { l: 0, r: 0, bend: 0 } });
  const s = 3.3, x0 = 480, wy = 1600;
  g.save(); g.translate(x0, wy); g.scale(s, s);
  const LIN = '#b8b0cc', LINS = '#a59cbd';
  const back = gg => { gg.moveTo(-58, -146); gg.lineTo(58, -146); gg.lineTo(70, 116); gg.lineTo(-70, 116); gg.closePath(); };
  tShape(g, LIN, back, 3.4); tShade(g, back, LINS, gg => gg.rect(-80, -150, 160, 40));
  tShape(g, LINS, gg => gg.ellipse(0, -150, 22, 9, 0, 0, 6.2832), 3);
  const sleeve = (sh, el, cuff) => {
    tTube(g, [sh[0], sh[1], el[0], el[1], cuff[0], cuff[1]], 25, LAB.coat, LAB.coatS);
    g.save(); g.translate(cuff[0], cuff[1]); g.rotate(Math.atan2(cuff[1] - el[1], cuff[0] - el[0]) + Math.PI / 2);
    tShape(g, LINS, gg => gg.ellipse(0, 0, 12, 5, 0, 0, 6.2832), 3); g.restore();
  };
  sleeve([-62, -128], [-100, -150], [-112, -214]);                  // the left sleeve up, waving
  sleeve([62, -128], [96, -112], [74, -196]);                       // the right sleeve raises the flask
  const left = gg => { gg.moveTo(-26, -150); gg.bezierCurveTo(-46, -148, -68, -138, -70, -110); gg.lineTo(-72, 0); gg.lineTo(-78, 118); gg.quadraticCurveTo(-46, 124, -12, 116); gg.lineTo(-10, -30); gg.lineTo(-30, -112); gg.closePath(); };
  const right = gg => { gg.moveTo(26, -150); gg.bezierCurveTo(46, -148, 68, -138, 70, -110); gg.lineTo(72, 0); gg.lineTo(78, 118); gg.quadraticCurveTo(46, 124, 12, 116); gg.lineTo(10, -30); gg.lineTo(30, -112); gg.closePath(); };
  tShape(g, LAB.coat, left); tShape(g, LAB.coat, right); tShade(g, right, LAB.coatS, gg => gg.rect(40, -160, 40, 300));
  tShape(g, LAB.coat, gg => { gg.moveTo(-26, -150); gg.lineTo(-46, -128); gg.lineTo(-30, -112); gg.closePath(); }, 3.4);
  tShape(g, LAB.coatS, gg => { gg.moveTo(26, -150); gg.lineTo(46, -128); gg.lineTo(30, -112); gg.closePath(); }, 3.4);
  tShape(g, LAB.glow, gg => { gg.moveTo(-50, -100); gg.lineTo(-44, -88); gg.lineTo(-38, -100); gg.lineTo(-41, -100); gg.lineTo(-44, -94); gg.lineTo(-47, -100); gg.closePath(); }, 2.4);
  for (const sx of [-1, 1]) tShape(g, null, gg => gg.rect(sx * 44 - 16, 40, 32, 30), 2.4);
  // the empty flask in the right cuff
  g.save(); g.translate(72, -232); g.save(); g.shadowColor = '#b6ff3b'; g.shadowBlur = 24; tShape(g, 'rgba(200,255,150,.6)', gg => gg.arc(0, 18, 22, 0, 6.2832), 3.4); g.restore();
  tShape(g, 'rgba(220,255,200,.55)', gg => gg.rect(-7, -20, 14, 22), 3); tShape(g, '#8a5a2a', gg => gg.rect(-8, -28, 16, 8), 2.4);
  g.save(); g.translate(0, 20); g.rotate(-.08); tShape(g, '#fbf7ff', gg => gg.rect(-20, -7, 40, 14), 2); tText(g, 'INVISIBLE', 0, 0, 6.5, TOON.ink, '"Bungee"', 'center', 400); g.restore(); g.restore();
  // the goggles and a wild grin, floating where her face would be
  tLine(g, [-44, -228, -52, -236], 6); tLine(g, [44, -228, 52, -236], 6); tShape(g, '#4a2c1a', gg => gg.rect(-36, -225, 72, 7), 2.4);
  for (const sx of [-1, 1]) { tShape(g, 'rgba(190,255,120,.9)', gg => gg.ellipse(sx * 18, -222, 17, 14, 0, 0, 6.2832), 4.4); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(sx * 18 - 6, -227, 5, 3, -.4, 0, 6.2832); g.fill(); }
  const grin = gg => { gg.moveTo(-26, -192); gg.quadraticCurveTo(0, -184, 26, -192); gg.quadraticCurveTo(18, -164, 0, -162); gg.quadraticCurveTo(-18, -164, -26, -192); gg.closePath(); };
  tShape(g, '#5a1430', grin, 3); g.save(); grin(g); g.clip(); g.fillStyle = '#fbf7ff'; g.fillRect(-26, -194, 52, 9); g.fillStyle = '#e8728a'; g.beginPath(); g.ellipse(0, -164, 12, 6, 0, 0, 6.2832); g.fill(); g.restore();
  tShape(g, null, grin, 3);
  g.restore();
  coverSparkles(g, [[870, 830, 26], [180, 900, 20], [960, 1180, 16]], '#f4ffcf');
};
