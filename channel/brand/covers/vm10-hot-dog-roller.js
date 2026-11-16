// Void Mart 10 "Hot Dog Roller": DON'T TURN IT OFF. Pip, huge, wide-eyed and sweating, one finger on the roller's switch; in front,
// big, the hot dog roller with its fossil hot dogs and the sign ROLLING SINCE THE BIG BANG; behind her the wall clock, its second
// hand caught mid-tick; a cold blue burst (time is about to slow down).
COVER['vm10-hot-dog-roller'] = g => {
  coverBurst(g, 760, 1180, ['#e4f2ff', '#4a5fd8', '#170c3a'], 16, .1);
  // the wall clock, top right, its hands blurred mid-tick
  const cx = 840, cy = 950, r = 118;
  tEllipse(g, cx, cy, r + 14, r + 14, '#5c577f', 5); tEllipse(g, cx, cy, r, r, '#fbf7ff', 4);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; tLine(g, [cx + Math.cos(a) * 88, cy + Math.sin(a) * 88, cx + Math.cos(a) * 104, cy + Math.sin(a) * 104], i % 3 ? 4 : 7); }
  const hand = (a, l, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * l, cy - Math.cos(a) * l); g.stroke(); };
  hand(5.5, 52, 12, TOON.ink); hand(1.1, 80, 8, TOON.ink);
  for (let i = 0; i < 4; i++) { g.save(); g.globalAlpha = .18 + i * .2; hand(2.2 + i * .05, 96, 5, '#e23b4a'); g.restore(); }
  tEllipse(g, cx, cy, 9, 9, '#e23b4a', 0);
  // Pip, huge, behind the roller
  const s = 3.4, px = 280, base = 1652, u = s, ct = 1640;   // ct: the counter top (her waist is under it)
  drawPip2(g, px, base, s * 100, { expr: 'gasp', arms: false, sweat: true });
  g.save(); g.translate(px, base); g.scale(u, u);
  tTube(g, [-52, -88, -68, -50, -66, -16, -44, -10, -22, -12], 21, TOON.pip.shirt); tHand(g, -18, -13, 8.5, TOON.pip.skin, TOON.pip.skinS);
  g.restore();
  // the counter: Pip stands behind it
  tShape(g, TOON.orange, gg => gg.rect(-10, ct, W + 20, 40), 5);
  g.fillStyle = '#3a2470'; g.fillRect(-10, ct + 42, W + 20, H);
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 4; for (let x = 60; x < W; x += 240) { g.beginPath(); g.moveTo(x, ct + 60); g.lineTo(x, H); g.stroke(); }
  // the roller, big, on the counter
  const k = 1.75, x0 = 610, w = 320 * k, top = ct - 72 * k;
  const dog = (x, y, len, rot, ph) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k);
    const body = gg => gg.roundRect(-len / 2, -12, len, 24, 12);
    tShape(g, '#9a6444', body); tShade(g, body, '#744631', gg => gg.rect(-len / 2, 4, len, 12));
    g.save(); g.beginPath(); body(g); g.clip(); g.fillStyle = '#b48a6a';
    for (const [px2, py, rr] of [[-.3, -3, 4], [.1, 2, 3], [.35, -4, 3.5]]) { g.beginPath(); g.ellipse(px2 * len + ph, py, rr * 1.6, rr, 0, 0, 6.2832); g.fill(); }
    g.strokeStyle = '#3e2418'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { const qx = -len / 2 + 10 + i * len / 4 + ph; g.beginPath(); g.moveTo(qx, -10); g.lineTo(qx + 4, -3); g.lineTo(qx, 3); g.lineTo(qx + 3, 9); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-len / 2 + 7, -7, len - 14, 3); g.restore();
    tShape(g, null, body, 2.8); g.restore();
  };
  tShape(g, '#3b3552', gg => { gg.moveTo(x0 + 6 * k, top); gg.lineTo(x0 + 26 * k, top - 34 * k); gg.lineTo(x0 + w - 26 * k, top - 34 * k); gg.lineTo(x0 + w - 6 * k, top); gg.closePath(); }, 4);
  for (let i = 0; i < 6; i++) { const q = i / 5; g.strokeStyle = '#d6d9e6'; g.lineWidth = (4 - q * 1.4) * k; g.beginPath(); g.moveTo(x0 + (8 + q * 18) * k, top - (3 + q * 28) * k); g.lineTo(x0 + w - (8 + q * 18) * k, top - (3 + q * 28) * k); g.stroke(); }
  const mid = x0 + w / 2 - 50;
  [[-46, -26, 0], [46, -26, 9], [-92, -10, 5], [0, -10, 14], [92, -10, 3]].forEach(([dx, dy, ph]) => dog(mid + dx * k, top + dy * k, 80, dx % 3 ? .015 : -.01, ph));
  for (let i = 0; i < 3; i++) { g.save(); g.globalAlpha = .55; g.strokeStyle = '#fbf7ff'; g.lineWidth = 8; g.lineCap = 'round'; const sx = mid - 110 + i * 110, sy = top - 80 - i % 2 * 30; g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 22, sy - 22, sx - 22, sy - 46, sx, sy - 70); g.stroke(); g.restore(); }
  tShape(g, '#c9cddd', gg => gg.roundRect(x0, top, w, 72 * k, 12), 5);
  tShade(g, gg => gg.roundRect(x0, top, w, 72 * k, 12), '#a4a9bf', gg => gg.rect(x0, top + 50 * k, w, 30 * k));
  const sx0 = x0 + 46 * k, sx1 = 1062, scx = (sx0 + sx1) / 2;                       // the sign panel, inside the frame
  tShape(g, '#fbf7ff', gg => gg.roundRect(sx0, top + 8 * k, sx1 - sx0, 56 * k, 8), 3.6);
  tText(g, 'ROLLING SINCE', scx, top + 26 * k, 36, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, 'THE BIG BANG', scx, top + 52 * k, 43, '#e23b4a', '"Bungee"', 'center', 400);
  const sw = { x: x0 + 22 * k, y: top + 38 * k };
  tShape(g, '#2b2244', gg => gg.roundRect(sw.x - 22, sw.y - 32, 44, 64, 9), 3.6);
  tShape(g, '#8fd65a', gg => gg.roundRect(sw.x - 14, sw.y - 26, 28, 22, 5), 3);
  tText(g, 'ON', sw.x, sw.y + 16, 18, '#fbf7ff', '"Bungee"', 'center', 400);
  // her right arm over the roller, one finger on the switch
  g.save(); g.translate(px, base); g.scale(u, u);
  const hx = (sw.x - px) / u, hy = (sw.y - 54 - base) / u;
  tTube(g, [52, -88, 104, -62, hx, hy], 20, TOON.pip.shirt, TOON.pip.shirtS);
  tHand(g, hx, hy, 9, TOON.pip.skin, TOON.pip.skinS);
  tTube(g, [hx + 1, hy + 4, hx + 1, hy + 9, hx, hy + 13], 4.6, TOON.pip.skin);
  g.restore();
  coverSparkles(g, [[1000, 770, 18], [1010, 1180, 14], [560, 1000, 12]]);
};
