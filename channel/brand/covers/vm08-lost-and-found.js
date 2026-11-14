// Void Mart 8 "Lost & Found": SO THAT'S WHERE. Pip, huge, gasping with delight, holds the sock planet over her head (odd socks
// orbiting it like a ring); the LOST & FOUND box on the counter in front of her; the calendar-headed commuter small behind,
// his face page on MONDAY, standing behind the box (it hides him below the chest).
COVER['vm08-lost-and-found'] = g => {
  coverBurst(g, 540, 1080, ['#fff3c4', '#8a3fd8', '#1e1044'], 18, .08);
  const sockPath = gg => { gg.moveTo(-9, -34); gg.lineTo(9, -34); gg.lineTo(9, -6); gg.quadraticCurveTo(9, 2, 18, 2); gg.lineTo(24, 2); gg.quadraticCurveTo(34, 2, 34, 11); gg.quadraticCurveTo(34, 20, 24, 20); gg.lineTo(-2, 20); gg.quadraticCurveTo(-9, 20, -9, 12); gg.closePath(); };
  const PAL = [['#ff5f7e', '#fbf7ff', 1], ['#5f9dff', '#fbf7ff', 0], ['#ffd23f', '#ff9a3d', 1], ['#8fd65a', '#2f7a3a', 0], ['#b9a6ff', '#fbf7ff', 1]];
  const sock = (x, y, s, rot, k) => {
    const [base, mark, stripe] = PAL[k % PAL.length];
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    tShape(g, base, sockPath, 0);
    g.save(); g.beginPath(); sockPath(g); g.clip(); g.fillStyle = mark;
    if (stripe) for (let yy = -30; yy < 22; yy += 10) g.fillRect(-12, yy, 50, 4);
    else for (const [dx, dy] of [[-2, -26], [3, -14], [-3, -3], [8, 12], [20, 10], [27, 15]]) { g.beginPath(); g.arc(dx, dy, 2.6, 0, 6.2832); g.fill(); }
    g.restore();
    tShape(g, '#fbf7ff', gg => gg.rect(-9, -38, 18, 6), 2.2);
    tShape(g, null, sockPath, 2.6);
    g.restore();
  };
  // the commuter, small, behind on the right: page-a-day calendar head on MONDAY, tired eyes
  g.save(); g.translate(845, 1560); g.scale(1, 1);                                     // standing behind the box: it hides him below the chest
  tShape(g, '#6b7088', gg => { gg.moveTo(-58, 240); gg.lineTo(-66, -60); gg.quadraticCurveTo(-66, -98, -30, -104); gg.lineTo(30, -104); gg.quadraticCurveTo(66, -98, 66, -60); gg.lineTo(58, 240); gg.closePath(); });
  tShape(g, '#fbf7ff', gg => { gg.moveTo(-24, -104); gg.lineTo(24, -104); gg.lineTo(0, -10); gg.closePath(); }, 2.6);
  tShape(g, '#e23b4a', gg => { gg.moveTo(-8, -96); gg.lineTo(8, -96); gg.lineTo(11, -20); gg.lineTo(0, -8); gg.lineTo(-11, -20); gg.closePath(); }, 2.4);
  tShape(g, '#c5cde6', gg => gg.rect(-12, -132, 24, 30), 3);
  tShape(g, '#fffdf4', gg => gg.roundRect(-75, -290, 150, 150, 6), 3.2);
  tShape(g, '#e23b4a', gg => gg.roundRect(-75, -290, 150, 30, [6, 6, 0, 0]), 3);
  tText(g, 'NOV', 0, -274, 18, '#fff', '"Bungee"', 'center', 400);
  tText(g, 'MONDAY', 0, -238, 30, TOON.ink, '"Bungee"', 'center', 400);
  for (const sx of [-1, 1]) { tEllipse(g, sx * 30, -192, 11, 11, '#fff', 3); g.fillStyle = TOON.ink; g.beginPath(); g.arc(sx * 30 - 3, -191, 5, 0, 6.2832); g.fill(); tShape(g, '#fffdf4', gg => gg.rect(sx * 30 - 13, -205, 26, 10), 0); tLine(g, [sx * 30 - 12, -195, sx * 30 + 12, -195], 3.2); }
  tLine(g, [-12, -164, 12, -164], 3.2);
  g.restore();
  // Pip, huge and centred, gasping, both arms up holding the sock planet over her head
  const s = 3.5, px = 470, base = 2010, P = TOON.pip;
  drawPip2(g, px, base, s * 100, { expr: 'gasp', arms: false, wave: false });
  const pr = 150, pcx = px, pcy = base - 300 * s + 40;
  g.save(); g.translate(px, base); g.scale(s, s);
  for (const sd of [-1, 1]) {
    const hx = sd * 44, hy = (pcy - base) / s + 40, sx = sd * 52, sy = -88, ex = (sx + hx) / 2 + sd * 22, ey = (sy + hy) / 2 + 18;
    tTube(g, [sx, sy, ex, ey, (ex + hx) / 2, (ey + hy) / 2, hx, hy], 20, P.shirt, sd > 0 ? P.shirtS : null);
    tHand(g, hx, hy, 9, P.skin, P.skinS, false);
  }
  g.restore();
  // the planet: back half of the ring, the ball of socks, the front half
  const ring = [[-2.2, 0], [-.8, 1], [.7, 2], [2.4, 3]];
  for (const [a, k] of ring) if (Math.sin(a) < 0) sock(pcx + Math.cos(a) * pr * 1.6, pcy + Math.sin(a) * pr * .36, 2.0, a * .6, k);
  g.save(); g.shadowColor = 'rgba(255,240,200,.7)'; g.shadowBlur = 50; tEllipse(g, pcx, pcy, pr, pr, '#efe3cf', 0); g.restore();
  g.save(); g.beginPath(); g.arc(pcx, pcy, pr, 0, 6.2832); g.clip();
  for (const [bx, by, k, rot] of [[-.45, -.5, 0, .5], [.35, -.55, 1, -.8], [-.6, .15, 2, 1.9], [.1, -.05, 3, .2], [.55, .25, 4, -1.6], [-.2, .55, 1, 2.6], [.4, .7, 0, -.3], [-.75, -.15, 3, -2.2]]) sock(pcx + bx * pr, pcy + by * pr, pr / 70, rot, k);
  g.fillStyle = 'rgba(40,20,80,.16)'; g.beginPath(); g.arc(pcx + pr * .35, pcy + pr * .3, pr * .95, 0, 6.2832); g.fill();
  g.restore();
  tEllipse(g, pcx, pcy, pr, pr, null, 5);
  tCurve(g, pcx - pr * .62, pcy - pr * .35, pcx - pr * .5, pcy - pr * .7, pcx - pr * .15, pcy - pr * .82, 6, 'rgba(255,255,255,.8)');
  for (const [a, k] of ring) if (Math.sin(a) >= 0) sock(pcx + Math.cos(a) * pr * 1.6, pcy + Math.sin(a) * pr * .36, 2.3, a * .6, k);
  // the LOST & FOUND box on the counter, bottom right, with odds and ends
  g.save(); g.translate(820, 1830);
  tShape(g, '#c59a5e', gg => { gg.moveTo(-170, -230); gg.lineTo(-210, -300); gg.lineTo(-100, -270); gg.lineTo(-100, -230); gg.closePath(); }, 4);
  tShape(g, '#c59a5e', gg => { gg.moveTo(170, -230); gg.lineTo(210, -300); gg.lineTo(100, -270); gg.lineTo(100, -230); gg.closePath(); }, 4);
  tShape(g, '#3a2470', gg => gg.roundRect(-160, -255, 320, 48, 10), 4);
  tCurve(g, -90, -220, -104, -330, -60, -340, 12, '#2f5fbf');
  tShape(g, '#ff9a3d', gg => { gg.moveTo(60, -220); gg.lineTo(54, -280); gg.quadraticCurveTo(60, -318, 90, -308); gg.quadraticCurveTo(116, -298, 110, -262); gg.lineTo(114, -220); gg.closePath(); }, 4);
  const front = gg => gg.rect(-170, -230, 340, 230);
  tShape(g, '#d9b47a', front); tShade(g, front, '#b88f55', gg => gg.rect(100, -230, 70, 230)); tShape(g, null, front, 5);
  tShape(g, 'rgba(255,253,244,.92)', gg => gg.rect(-140, -170, 280, 104), 3.4);
  tText(g, 'LOST &', 0, -140, 44, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, 'FOUND', 0, -96, 44, TOON.ink, '"Bungee"', 'center', 400);
  g.restore();
  coverSparkles(g, [[170, 980, 20], [930, 820, 16], [760, 1000, 14]]);
};
