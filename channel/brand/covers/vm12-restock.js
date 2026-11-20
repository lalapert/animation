// Void Mart 12 "Restock": WHO RESTOCKED IT? Pip, huge and amazed, behind the aisle shelf; behind her the fridges split down the
// middle: on the left stripped bare after Black Friday (SOLD OUT), on the right full and gleaming.
COVER['vm12-restock'] = g => {
  g.fillStyle = '#221a4f'; g.fillRect(0, 0, W, H);
  const sx = 540;                                            // the split
  for (let i = 0; i < 5; i++) {
    const x = -60 + i * 260, fullUp = x + 120 > sx;
    tShape(g, '#3a2f74', gg => gg.rect(x, 700, 240, 1000), 5);
    const gr = g.createLinearGradient(0, 720, 0, 1680); gr.addColorStop(0, fullUp ? '#d6f3ff' : '#9fc6e8'); gr.addColorStop(1, fullUp ? '#9fd4f8' : '#7aa6d0'); g.fillStyle = gr; g.fillRect(x + 14, 718, 212, 966);
    for (let sy = 880; sy < 1680; sy += 190) {
      tShape(g, '#e6e2f5', gg => gg.rect(x + 14, sy, 212, 9), 2.4);
      if (fullUp) for (let k = 0; k < 6; k++) { const bx = x + 24 + k * 34, col = ['#ff5f7e', '#ffd23f', '#5fe3cc', '#b9a6ff', '#ff9a3d', '#7ef0ff'][(i + k + sy / 190) % 6 | 0];
        tShape(g, col, gg => gg.roundRect(bx, sy - 76, 28, 76, 7), 2.6); tShape(g, '#fbf7ff', gg => gg.rect(bx, sy - 54, 28, 12), 1.6); }
    }
  }
  g.fillStyle = 'rgba(16,10,52,.35)'; g.fillRect(0, 700, sx, 1000);                 // the stripped half, darker
  g.strokeStyle = '#fff6c8'; g.lineWidth = 6; g.setLineDash([22, 14]); g.beginPath(); g.moveTo(sx, 700); g.lineTo(sx, 1700); g.stroke(); g.setLineDash([]);
  g.save(); g.translate(250, 960); g.rotate(-.06);
  tShape(g, '#fffdf2', gg => gg.rect(-110, -60, 220, 120), 4); tText(g, 'SOLD', 0, -18, 46, '#e23b4a', '"Bungee"', 'center', 400); tText(g, 'OUT', 0, 32, 46, '#e23b4a', '"Bungee"', 'center', 400);
  g.restore();
  coverSparkles(g, [[700, 820, 24], [960, 1060, 18], [820, 1340, 16], [1010, 760, 14]]);
  // Pip, huge, behind the shelf, amazed
  const s = 3.5, px = 540, base = 1760 + 60;
  drawPip2(g, px, base, s * 100, { expr: 'gasp', hold: true });
  // the shelf unit in front: empty on the left, full on the right
  const top = 1660;
  tShape(g, '#e8e3f4', gg => gg.rect(-10, top, W + 20, 44), 5);
  tShape(g, '#c9c3dc', gg => gg.rect(-10, top + 44, W + 20, 400), 5);
  for (let x = 30; x < W; x += 150) { tShape(g, '#ffd23f', gg => gg.rect(x, top + 210, 64, 18), 2); }
  tShape(g, '#fbf7ff', gg => gg.rect(-10, top + 204, W + 20, 8), 2);
  for (let x = sx + 10; x < W - 20; x += 72) { const col = ['#ff5f7e', '#ffd23f', '#5fe3cc', '#b9a6ff'][((x - sx) / 72 | 0) % 4];
    tShape(g, col, gg => gg.roundRect(x, top + 70, 64, 134, 9), 3); tShape(g, '#fbf7ff', gg => gg.rect(x + 8, top + 100, 48, 24), 2); }
  coverSparkles(g, [[880, 1720, 16], [640, 1780, 12]]);
};
