// Volt Labs 6 "Lab Inspection": HER FAKE BAKERY GOT FIVE STARS. The wall is caught mid-flip: pink bakery on the left, the
// lab on the right. Vera, huge, flustered, holds up the beeping detonator croissant with a forced smile; five gold stars over
// her head; Cleo, bottom right, deadpan, thumb on the big red button.
COVER['vl06-lab-inspection'] = g => {
  // the wall: bakery (left) and lab (right), split on a slant where it is flipping
  const seam = (y) => 600 + (y - 700) * .18;
  g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(seam(0), 0); g.lineTo(seam(H), H); g.lineTo(0, H); g.closePath(); g.clip();
  const pk = g.createLinearGradient(0, 0, 0, H); pk.addColorStop(0, '#ffd6e4'); pk.addColorStop(1, '#f59ab8'); g.fillStyle = pk; g.fillRect(0, 0, W, H);
  for (let x = -40; x < 700; x += 70) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, 0, 32, H); }
  // awning and shelves of bread
  for (let i = 0; i < 9; i++) tShape(g, i % 2 ? '#fbf7ff' : '#e2456f', gg => { gg.moveTo(i * 80 - 20, 740); gg.lineTo(i * 80 + 60, 740); gg.lineTo(i * 80 + 60, 800); gg.quadraticCurveTo(i * 80 + 20, 830, i * 80 - 20, 800); gg.closePath(); }, 3.4);
  for (const sy of [1080, 1330]) {
    tShape(g, '#c98b5a', gg => gg.rect(-10, sy, 640, 22), 4);
    for (let i = 0; i < 5; i++) { const bx = 40 + i * 120; g.save(); g.translate(bx, sy - 30); tShape(g, '#e8a95c', gg => gg.ellipse(0, 0, 44, 26, 0, 0, 6.2832), 3.6); for (let k = -1; k <= 1; k++) tCurve(g, k * 18 - 6, -20, k * 18, 0, k * 18 - 6, 20, 2.4, '#b87434'); g.restore(); }
  }
  g.restore();
  g.save(); g.beginPath(); g.moveTo(seam(0), 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(seam(H), H); g.closePath(); g.clip();
  const lb = g.createLinearGradient(0, 0, 0, H); lb.addColorStop(0, '#16302a'); lb.addColorStop(1, '#0b1a16'); g.fillStyle = lb; g.fillRect(0, 0, W, H);
  for (const [px, w] of [[720, 26], [860, 18], [990, 30]]) tShape(g, '#3e5a52', gg => gg.rect(px, 0, w, H), 3);
  for (const [bx, by, col] of [[760, 1000, '#b7ff6a'], [900, 1120, '#7ef0ff'], [1010, 960, '#ff7aa8']]) {
    g.save(); g.shadowColor = col; g.shadowBlur = 30; tShape(g, col, gg => { gg.moveTo(bx - 18, by - 60); gg.lineTo(bx + 18, by - 60); gg.lineTo(bx + 18, by - 20); gg.lineTo(bx + 40, by + 30); gg.lineTo(bx - 40, by + 30); gg.lineTo(bx - 18, by - 20); gg.closePath(); }, 3.6); g.restore();
  }
  g.restore();
  g.save(); g.lineWidth = 16; g.strokeStyle = TOON.ink; g.beginPath(); g.moveTo(seam(0), 0); g.lineTo(seam(H), H); g.stroke(); g.lineWidth = 8; g.strokeStyle = '#d9a63a'; g.stroke(); g.restore();
  // five gold stars over her head
  for (let i = 0; i < 5; i++) { const a = Math.PI * (1.18 + i * .16); drawStar(g, 470 + Math.cos(a) * 330, 1020 + Math.sin(a) * 230, 44, '#ffd23f', 5); }
  // Cleo, bottom right, deadpan, thumb on the button
  drawCleo2(g, 900, 2010, 225, { expr: 'deadpan', press: 1 });
  // Vera, huge, flustered, holding the croissant up by her face
  const s = 3.7, vx = 430, base = 2010;
  drawVera2(g, vx, base, s * 100, { expr: 'fluster', reachR: { x: 78, y: -150 } });
  const cx = vx + 82 * s, cy = base - 160 * s;
  g.save(); g.translate(cx, cy); g.rotate(-.25); g.scale(2.2, 2.2);
  // a croissant: five segments on a curve, the middle one biggest, the horns curling down
  for (const i of [-2, 2, -1, 1, 0]) {
    const x = i * 24, y = Math.abs(i) * Math.abs(i) * 6, r = [15, 21, 27][2 - Math.abs(i)];
    tShape(g, Math.abs(i) === 2 ? '#d9934a' : '#e8a95c', gg => gg.ellipse(x, y, r * .95, r, i * .35, 0, 6.2832), 3.2);
    tCurve(g, x - r * .3, y - r * .7, x + r * .1, y, x - r * .2, y + r * .7, 2, '#b87434');
  }
  tCurve(g, 10, -24, 34, -50, 52, -44, 2.4, '#e23b4a'); tCurve(g, 2, -26, 14, -54, 2, -62, 2.4, '#2a7bd8');
  g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 24; tEllipse(g, 0, -6, 7, 7, '#ff3355', 2.4); g.restore();
  g.restore();
  tText(g, 'BEEP', cx + 120, cy - 120, 40, '#ff3355', '"Bungee"', 'center', 400);
  coverSparkles(g, [[1000, 820, 18], [90, 1500, 16]]);
};
