// Void Mart 13 "Rewards Program": MINUS 4,120 POINTS? MAGS, huge, eye blazing, over a card reader that faces the viewer:
// DO YOU HAVE A VOID REWARDS ACCOUNT? [YES] [YES, LATER] and a tiny "no thanks"; a receipt pouring out of it; at the right, Rae,
// deadpan, holding up her own receipt: -4,120.
COVER['vm13-rewards-program'] = g => {
  coverBurst(g, 540, 1000, ['#ffd6dc', '#c42f6a', '#1e1044'], 18, .05);
  // MAGS, huge, hanging from the top of the picture area
  tLine(g, [540, 720, 540, 800], 10);
  drawMags(g, 520, 788, 400, { talk: .7, glow: 60 });
  // the receipt pouring out of the reader's slot and down off the bottom
  tShape(g, '#fffdf6', gg => { gg.moveTo(500, 1250); gg.quadraticCurveTo(470, 1150, 330, 1205); gg.quadraticCurveTo(160, 1300, 210, 1500); gg.lineTo(140, 1920); gg.lineTo(240, 1920); gg.lineTo(300, 1500); gg.quadraticCurveTo(255, 1345, 370, 1265); gg.quadraticCurveTo(460, 1212, 600, 1250); gg.closePath(); }, 4);
  g.strokeStyle = 'rgba(26,16,48,.25)'; g.lineWidth = 3; for (let y = 1540; y < 1920; y += 22) { const f = (y - 1500) / 420; g.beginPath(); g.moveTo(222 - 70 * f, y); g.lineTo(286 - 60 * f, y); g.stroke(); }
  // the card reader, facing us
  const x = 560, y = 1420, w = 430, h = 330;
  tShape(g, '#5b5f78', gg => gg.roundRect(x - 50, y + h / 2 - 10, 100, 220, 10), 5);
  tShape(g, '#2b2f45', gg => gg.roundRect(x - w / 2, y - h / 2, w, h, 30), 6);
  tShape(g, '#3d4260', gg => gg.roundRect(x - 90, y - h / 2 - 20, 180, 24, 8), 4);
  const sx = x - 180, sy = y - 140, sw = 360, sh = 250;
  tShape(g, '#10203a', gg => gg.roundRect(sx, sy, sw, sh, 16), 5);
  tText(g, 'DO YOU HAVE A', x, sy + 36, 26, '#ffffff', '"Bungee"', 'center', 400);
  tText(g, 'VOID REWARDS', x, sy + 72, 36, '#ffd23f', '"Bungee"', 'center', 400);
  tText(g, 'ACCOUNT?', x, sy + 108, 26, '#ffffff', '"Bungee"', 'center', 400);
  tShape(g, '#8fd65a', gg => gg.roundRect(sx + 20, sy + 140, 150, 64, 12), 4); tText(g, 'YES', sx + 95, sy + 173, 32, '#10203a', '"Bungee"', 'center', 400);
  tShape(g, '#8fd65a', gg => gg.roundRect(sx + 186, sy + 140, 154, 64, 12), 4); tText(g, 'YES, LATER', sx + 263, sy + 173, 20, '#10203a', '"Bungee"', 'center', 400);
  tText(g, 'no thanks', sx + 300, sy + 230, 12, 'rgba(255,255,255,.4)', '"Fredoka"', 'center', 600);
  tEllipse(g, x, y + h / 2 - 26, 11, 11, '#ff2a3a', 3);
  // Rae, smaller, at the right, deadpan, holding up her receipt: -4,120
  const rx = 935, rbase = 1935, rs = 2.3;              // her body runs off the bottom (no cut-off torso)
  drawRae2(g, rx, rbase, rs * 100, { expr: 'deadpan', look: -1.5, arms: false });
  g.save(); g.translate(rx, rbase); g.scale(rs, rs);
  tTube(g, [58, -122, 76, -72, 74, -24, 50, -16, 20, -18], 24, TOON.rae.hood, TOON.rae.hoodS); tHand(g, 22, -19, 9.5, TOON.rae.skin, TOON.rae.skinS);
  tTube(g, [-58, -122, -84, -78, -86, -60, -80, -52, -62, -50], 24, TOON.rae.hood);
  g.restore();
  const px = rx - 62 * rs, py = rbase - 50 * rs;             // her receipt, held up at her chest (below her chin)
  g.save(); g.translate(px, py); g.rotate(-.06);
  tShape(g, '#fffdf6', gg => gg.rect(-58, -146, 150, 156), 4);   // wide enough to cover her name tag (no sliver of it)
  tText(g, 'RAE', 17, -118, 20, TOON.ink, '"Bungee"', 'center', 400);
  tText(g, '-4,120', 17, -74, 34, '#e23b4a', '"Bungee"', 'center', 400);
  tText(g, 'POINTS', 17, -38, 18, TOON.ink, '"Bungee"', 'center', 400);
  g.restore();
  tHand(g, px, py + 8, 9.5 * rs, TOON.rae.skin, TOON.rae.skinS);
  coverSparkles(g, [[160, 820, 18], [980, 900, 14], [820, 1180, 12]]);
};
