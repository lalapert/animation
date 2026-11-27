// Volt Labs 14 "Doomsday Weather": DOOM OR SNOW DAY? Vera, big, scheming, with one tiny cloud snowing on her head only; Cleo, big and
// deadpan, holding up her red sled (CLEO on it) between them. Summer sky over the roof, the brick parapet hides them from the waist down.
// The cloud and the sled are copied from vl14-doomsday-weather/film.js (the rigs are unchanged).
(() => {
  function cloud(g, x, y, r) {
    const P = [[-.95, .2, .5], [-.35, -.25, .72], [.4, -.15, .64], [.95, .22, .46], [0, .3, .55]];
    const path = () => { g.beginPath(); for (const [dx, dy, rr] of P) { g.moveTo(x + dx * r + rr * r, y + dy * r); g.arc(x + dx * r, y + dy * r, rr * r, 0, 6.2832); } };
    g.save(); path(); g.lineWidth = 14; g.strokeStyle = TOON.ink; g.lineJoin = 'round'; g.stroke(); g.fillStyle = '#c3cad6'; g.fill();
    g.clip(); g.fillStyle = 'rgba(70,84,112,.22)'; g.fillRect(x - 2 * r, y + .25 * r, 4 * r, 2 * r);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(x - .4 * r, y - .55 * r, .35 * r, .16 * r, -.3, 0, 6.2832); g.fill(); g.restore();
  }
  function sled(g) {
    const body = gg => { gg.moveTo(-42, 0); gg.lineTo(-42, -300); gg.quadraticCurveTo(-42, -344, 0, -346); gg.quadraticCurveTo(42, -344, 42, -300); gg.lineTo(42, 0); gg.closePath(); };
    tShape(g, '#e23b3b', body, 3); tShade(g, body, '#b92a2f', gg => gg.rect(18, -350, 30, 360));
    tShape(g, '#ffd0c8', gg => gg.roundRect(-30, -326, 60, 16, 8), 2);
    g.save(); g.translate(0, -170); g.rotate(-Math.PI / 2); tText(g, 'CLEO', 0, 2, 36, '#fff6e0', '"Bungee"', 'center', 400); g.restore();
  }
  COVER['vl14-doomsday-weather'] = g => {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#4fa8f0'); sky.addColorStop(.6, '#a9dcff'); sky.addColorStop(1, '#ffe8c6');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    coverBurst(g, 540, 1180, ['#ffffff', '#d8f0ff', '#4fa8f0'], 14, .1);
    let a = 9; const R = () => (a = a * 16807 % 2147483647) / 2147483647;
    for (let x = -30; x < W; x += 130 + R() * 60) { const h = 160 + R() * 260, w = 120 + R() * 60; tShape(g, ['#b9a9cc', '#c6b8d6'][(R() * 2) | 0], gg => gg.rect(x, 1800 - h, w, h + 40), 4); }
    const BASE = 2010, Sz = 365;
    // the sled stands between them, its curl up between their heads
    g.save(); g.translate(548, 1830); g.rotate(-.03); g.scale(2.25, 2.25); sled(g); g.restore();
    drawVera2(g, 215, BASE, Sz, { expr: 'scheme', tube: false, armsDown: true, turn: .15 });
    drawCleo2(g, 885, BASE, Sz, { expr: 'deadpan', look: -1, remote: false, reachL: { x: (618 - 885) / (Sz / 100), y: (1120 - BASE) / (Sz / 100) } });
    // one tiny cloud, snowing on Vera only: flakes over her hair (never over her face) and a little snow cap on her head
    const hx = 215, ht = BASE - 2.86 * Sz;
    g.save(); g.beginPath(); g.rect(hx - 130, 830, 260, ht - 830 + 40); g.clip();
    for (let i = 0; i < 12; i++) { const x = hx - 110 + R() * 220, y = 850 + R() * (ht - 850 + 20), r = 7 + R() * 4; g.fillStyle = 'rgba(40,50,80,.35)'; g.beginPath(); g.arc(x, y + 2, r + 2, 0, 6.2832); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
    g.restore();
    tShape(g, '#f4f8ff', gg => { gg.moveTo(hx - 95, ht + 40); gg.quadraticCurveTo(hx - 80, ht - 6, hx - 30, ht + 2); gg.quadraticCurveTo(hx, ht - 22, hx + 40, ht); gg.quadraticCurveTo(hx + 90, ht - 2, hx + 100, ht + 42); gg.quadraticCurveTo(hx, ht + 24, hx - 95, ht + 40); gg.closePath(); }, 5);
    cloud(g, hx + 20, 790, 88);
    // the parapet with snow on it
    const P = 1800;
    tShape(g, '#a8604a', gg => gg.rect(-20, P, W + 40, H), 6);
    for (let r = 0, y = P + 40; y < H; r++, y += 46) for (let x = (r % 2) * -55; x < W; x += 110) { g.fillStyle = R() < .5 ? '#b56c52' : '#9c5843'; g.fillRect(x + 3, y + 3, 104, 40); }
    tShape(g, '#cfc8b8', gg => gg.rect(-20, P, W + 40, 34), 5);
    coverSparkles(g, [[980, 880, 22], [60, 1400, 18]], '#ffffff');
  };
})();
