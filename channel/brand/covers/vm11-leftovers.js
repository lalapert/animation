// Void Mart 11 "Leftovers": WHO DIDN'T COVER IT? Pip, huge, shocked, hands up at her chest, behind the counter; in front, big, the
// store microwave with cranberry sauce splattered all over the inside of the window and OOPS on the display; on the counter
// the little robot's huge container with one pea, and a tower of Tupperware; a warm autumn burst.
COVER['vm11-leftovers'] = g => {
  coverBurst(g, 760, 1150, ['#fff1d6', '#e0661c', '#3a1250'], 16, .08);
  const ct = 1640;
  // Pip, huge, behind the counter
  const s = 3.4, px = 300, base = ct + 12;
  drawPip2(g, px, base, s * 100, { expr: 'gasp', hold: true, sweat: true });
  // the counter
  tShape(g, TOON.orange, gg => gg.rect(-10, ct, W + 20, 40), 5);
  g.fillStyle = '#3a2470'; g.fillRect(-10, ct + 42, W + 20, H);
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 4; for (let x = 60; x < W; x += 240) { g.beginPath(); g.moveTo(x, ct + 60); g.lineTo(x, H); g.stroke(); }
  // a tower of Tupperware on the counter, left of the microwave
  const lids = ['#ff7a1a', '#29d3c3', '#ffd23f', '#ff4fa3'];
  for (let i = 0; i < 4; i++) {
    const y = ct - i * 52, x = 560 + (i % 2 ? 6 : -6);
    tShape(g, 'rgba(225,240,255,.35)', gg => gg.roundRect(x - 62, y - 46, 124, 46, 10), 4);
    g.fillStyle = ['#f6e7b8', '#b77a3f', '#e48a2c', '#c4123a'][i]; g.fillRect(x - 56, y - 30, 112, 24);
    tShape(g, lids[i], gg => gg.roundRect(x - 68, y - 56, 136, 16, 6), 4);
  }
  tShape(g, '#f4e3b5', gg => gg.rect(518, ct - 3 * 52 - 54, 84, 14), 2); tText(g, "MOM'S", 560, ct - 3 * 52 - 47, 13, TOON.ink, '"Bungee"', 'center', 400);
  // the microwave, big, splattered
  const k = 1.95, x0 = 650, w = 220 * k, h = 140 * k, top = ct - h;
  tShape(g, '#e9ebf3', gg => gg.roundRect(x0, top, w, h, 18), 6);
  tShade(g, gg => gg.roundRect(x0, top, w, h, 18), '#c7cbdb', gg => gg.rect(x0, ct - 36, w, 36));
  const wx0 = x0 + 22 * k, wx1 = x0 + 152 * k, wy0 = top + 14 * k, wy1 = ct - 20 * k;
  g.save(); g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.clip();
  g.fillStyle = '#ffe9a8'; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  tShape(g, 'rgba(200,230,255,.5)', gg => { gg.moveTo(wx0 + 70, wy1 - 70); gg.quadraticCurveTo(wx0 + 72, wy1 - 20, wx0 + 128, wy1 - 20); gg.quadraticCurveTo(wx0 + 184, wy1 - 20, wx0 + 186, wy1 - 70); gg.closePath(); }, 4);
  g.fillStyle = '#c4123a';
  for (const [bx, by, r] of [[.1, .2, 34], [.3, .12, 44], [.55, .3, 38], [.8, .16, 30], [.22, .55, 26], [.7, .6, 32], [.45, .48, 40], [.9, .45, 22], [.05, .7, 20]]) { g.beginPath(); g.ellipse(wx0 + bx * (wx1 - wx0), wy0 + by * (wy1 - wy0), r, r * .85, 0, 0, 6.2832); g.fill(); }
  for (const [bx, l] of [[.12, 70], [.34, 90], [.6, 60], [.82, 80]]) g.fillRect(wx0 + bx * (wx1 - wx0) - 6, wy0 + 30, 12, l);
  g.fillStyle = 'rgba(20,14,40,.2)'; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(wx0 + 20, wy0); g.lineTo(wx0 + 80, wy0); g.lineTo(wx0 + 10, wy1); g.lineTo(wx0, wy1); g.closePath(); g.fill();
  g.restore();
  tShape(g, null, gg => gg.roundRect(x0 + 10 * k, top + 6 * k, 152 * k, h - 14 * k, 14), 5);
  const pxp = x0 + 189 * k;
  tShape(g, '#1a2a3a', gg => gg.roundRect(pxp - 40, top + 22 * k - 18, 80, 40, 7), 4);
  tText(g, 'OOPS', pxp, top + 22 * k + 3, 26, '#ff6b6b', '"Bungee"', 'center', 400);
  for (let i = 0; i < 9; i++) tShape(g, '#c7cbdb', gg => gg.roundRect(pxp - 34 + (i % 3) * 25, top + 22 * k + 34 + Math.floor(i / 3) * 22, 18, 13, 4), 2.6);
  tShape(g, '#8fd65a', gg => gg.roundRect(pxp - 34, ct - 52, 68, 26, 7), 3.4);
  // a drip escaping the door
  tShape(g, '#c4123a', gg => { gg.moveTo(wx1 + 6, ct - 40); gg.quadraticCurveTo(wx1 + 16, ct - 12, wx1 + 8, ct); gg.quadraticCurveTo(wx1 - 2, ct - 12, wx1 + 6, ct - 40); gg.closePath(); }, 3);
  coverSparkles(g, [[1000, 780, 18], [96, 770, 14], [600, 1010, 12]]);
};
