// Extra sets for movement (11/8). Load after toon.js and vmkit.js.
// Void Mart aisle: a wall of glowing fridges behind, and in front a shelf unit whose top hides everyone from the waist down.
// World 2160 wide (the camera pans). AISLE.top: the shelf top (a character's waist goes a little below it).
'use strict';
const AISLE = { w: 2160, top: 1420, floor: 1180 };
function buildAisle() {
  const b = document.createElement('canvas'); b.width = AISLE.w; b.height = 2400; const g = b.getContext('2d');
  const R = (() => { let a = 5; return () => { a = a * 16807 % 2147483647; return a / 2147483647; }; })();
  // back wall and ceiling lights
  g.fillStyle = '#221a4f'; g.fillRect(0, 0, AISLE.w, 2400);
  for (let x = 60; x < AISLE.w; x += 420) { g.save(); g.shadowColor = '#e9e4ff'; g.shadowBlur = 30; tShape(g, '#f4f1ff', gg => gg.roundRect(x, 120, 300, 22, 10), 3); g.restore(); }
  // fridges: glass doors with lit shelves of bottles and cans
  for (let x = 40, i = 0; x < AISLE.w - 200; x += 260, i++) {
    tShape(g, '#3a2f74', gg => gg.rect(x, 300, 240, 880), 4);
    const glow = g.createLinearGradient(0, 320, 0, 1160); glow.addColorStop(0, '#bfe9ff'); glow.addColorStop(1, '#8fc4f0'); g.fillStyle = glow; g.fillRect(x + 14, 318, 212, 846);
    for (let sy = 470; sy < 1160; sy += 170) {
      tShape(g, '#e6e2f5', gg => gg.rect(x + 14, sy, 212, 8), 2);
      for (let k = 0; k < 6; k++) { const bx = x + 26 + k * 34, col = ['#ff5f7e', '#ffd23f', '#5fe3cc', '#b9a6ff', '#ff9a3d', '#7ef0ff'][(k + i + sy) % 6];
        if ((k + sy / 10 + i) % 3 === 0) tShape(g, col, gg => gg.roundRect(bx, sy - 70, 26, 70, 8), 2.4); else { tShape(g, col, gg => gg.roundRect(bx, sy - 46, 26, 46, 5), 2.4); tShape(g, '#fbf7ff', gg => gg.rect(bx, sy - 32, 26, 10), 1.6); } }
    }
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 40, 360); g.lineTo(x + 90, 330); g.stroke();
    tShape(g, '#c9c3dc', gg => gg.roundRect(x + 200, 640, 10, 120, 5), 2);
  }
  // floor
  tShape(g, '#3b2c78', gg => gg.rect(-10, AISLE.floor, AISLE.w + 20, 1300), 4);
  for (let x = 0; x < AISLE.w; x += 160) tLine(g, [x, AISLE.floor, x - 80, 2400], 2);
  // hanging aisle sign
  tLine(g, [700, 0, 700, 200], 3); tLine(g, [1100, 0, 1100, 200], 3);
  tShape(g, TOON.orange, gg => gg.roundRect(640, 190, 520, 90, 14), 4); tText(g, 'AISLE 3  SNACKS', 900, 236, 44, '#fff', '"Bungee"', 'center', 400);
  AISLE.back = b;
  // the shelf unit in front (drawn after the characters)
  const f = document.createElement('canvas'); f.width = AISLE.w; f.height = 2400 - AISLE.top + 60; const h = f.getContext('2d');
  tShape(h, '#e8e3f4', gg => gg.rect(-10, 0, AISLE.w + 20, 40), 4);                        // shelf top edge
  tShape(h, '#c9c3dc', gg => gg.rect(-10, 40, AISLE.w + 20, 2400), 4);
  for (let row = 0; row < 4; row++) {
    const y0 = 60 + row * 200;
    tShape(h, '#fbf7ff', gg => gg.rect(-10, y0 + 170, AISLE.w + 20, 18), 3);              // shelf lip with price tags
    for (let x = 30; x < AISLE.w; x += 150) { tShape(h, '#ffd23f', gg => gg.rect(x, y0 + 172, 56, 14), 1.6); tText(h, '$' + (1 + (Math.floor(x / 150) + row) % 9) + '.99', x + 28, y0 + 179, 10, TOON.ink, '"Bungee"', 'center', 400); }
    for (let x = 14; x < AISLE.w - 30;) {
      const kind = (R() * 4) | 0, col = ['#ff5f7e', '#ffd23f', '#5fe3cc', '#b9a6ff', '#ff9a3d'][(R() * 5) | 0];
      if (kind === 0) { tShape(h, col, gg => gg.roundRect(x, y0 + 50, 64, 120, 8), 2.6); tShape(h, '#fbf7ff', gg => gg.rect(x + 8, y0 + 80, 48, 22), 1.6); x += 72; }          // chip bag
      else if (kind === 1) { for (let k = 0; k < 3; k++) tShape(h, col, gg => gg.roundRect(x + k * 30, y0 + 100, 28, 70, 5), 2.4); x += 96; }                               // cans
      else if (kind === 2) { tShape(h, col, gg => gg.rect(x, y0 + 30, 90, 140), 2.6); tShape(h, '#fbf7ff', gg => gg.roundRect(x + 14, y0 + 60, 62, 40, 6), 1.6); x += 100; }   // cereal box
      else { tShape(h, col, gg => gg.roundRect(x, y0 + 90, 54, 80, 14), 2.6); x += 62; }                                                                                     // jar
    }
  }
  AISLE.front = f;
}
