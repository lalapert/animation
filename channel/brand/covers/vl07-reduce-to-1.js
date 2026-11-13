// Volt Labs 7 "Reduce to 1%": SHE SHRANK THE RENT. Vera, scheming, pinches up the 1% rent notice by her face; the copier's big
// green "1%" behind her and the full-size notice ($1,200) falling away; Cleo small and unmoved.
COVER['vl07-reduce-to-1'] = g => {
  coverBurst(g, 600, 1000, ['#efffb0', '#3e9a5a', '#0e2a20'], 14, -.05);
  const notice = (x, y, s, r) => {                                   // the rent notice (as in the episode)
    g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s);
    tShape(g, '#fbfaf2', gg => gg.rect(-90, -115, 180, 230), 3 / s);
    if (s > .2) {
      tText(g, 'RENT DUE', 0, -80, 30, TOON.ink, '"Bungee"', 'center', 400); tText(g, '$1,200', 0, -20, 50, '#c2233a', '"Bungee"', 'center', 400);
      tText(g, 'FRIDAY', 0, 34, 30, TOON.ink, '"Bungee"', 'center', 400);
      g.save(); g.translate(28, 96); g.rotate(-.16); g.strokeStyle = '#c2233a'; g.lineWidth = 4; g.strokeRect(-54, -15, 108, 30); tText(g, 'FINAL NOTICE', 0, 1, 16, '#c2233a', '"Bungee"', 'center', 400); g.restore();
    } else { g.fillStyle = '#c2233a'; g.fillRect(-50, -30, 100, 34); g.fillStyle = '#9a98a8'; g.fillRect(-60, 40, 120, 16); }
    g.restore();
  };
  // the copier's screen, big, up by her raised hand: 1%
  g.save(); g.translate(880, 900); g.rotate(.06);
  tShape(g, '#2f3a44', gg => gg.roundRect(-170, -110, 340, 220, 26), 6);
  tShape(g, '#0e1a12', gg => gg.roundRect(-140, -80, 280, 160, 18), 5);
  tText(g, '1%', 0, 6, 130, '#7dff9a', '"Bungee"', 'center', 400);
  g.restore();
  // the full-size notice, falling away behind her (what it was)
  notice(150, 1500, 1.25, -.28);
  // Cleo, bottom right, deadpan
  drawCleo2(g, 950, 2040, 210, { expr: 'deadpan', armsDown: { l: 0, r: 0, bend: 0 } });
  // Vera, huge, scheming; her right hand pinches up the 1% copy by her face
  const s = 4.0, vx = 410, base = 2010, r = { x: 74, y: -176 };
  drawVera2(g, vx, base, s * 100, { expr: 'scheme', reachR: r, tube: false });
  const hx = vx + r.x * s, hy = base + r.y * s;
  notice(hx + 14, hy - 52, .3, -.12);
  tHand(g, hx, hy, 9.5 * s, LAB2.vera.skin, LAB2.vera.skinS);      // her fingers in front of the tiny notice
  coverSparkles(g, [[hx + 70, hy - 120, 26], [hx - 60, hy - 110, 18], [980, 820, 20]], '#f4ffcf');
};
