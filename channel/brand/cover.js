// Drawn covers (owner, 11/10: "new drawings, not frames from the video"). The cast rigs (toon.js, lab.js) posed for a cover:
// faces big, emotions pushed past what the episode shows, the gag object in front, a loud background. The headline and the
// series pill are added afterwards by channel/brand/thumb.html, so keep y 180..720 for them and the faces in y 760..1660.
// Each episode's scene lives in channel/brand/covers/<folder>.js and registers COVER['<folder>'] = g => { ... }.
'use strict';
const COVER = {};
// a radial burst: alternating rays from (cx, cy) over a radial gradient
function coverBurst(g, cx, cy, cols, rays = 14, spin = 0) {
  const gr = g.createRadialGradient(cx, cy, 20, cx, cy, 1500); gr.addColorStop(0, cols[0]); gr.addColorStop(.45, cols[1]); gr.addColorStop(1, cols[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.translate(cx, cy); g.rotate(spin); g.fillStyle = 'rgba(255,255,255,.09)';
  for (let i = 0; i < rays; i++) { const a = i / rays * Math.PI * 2; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 2200, a, a + Math.PI / rays); g.closePath(); g.fill(); }
  g.restore();
}
// anime crying: from the outer lower corner of each eye (world point, side -1 / 1) a stream arcs out past the face and falls in drops.
// u = the rig's scale in px per rig unit
function coverTears(g, eyes, u) {
  for (const [x, y, side] of eyes) {
    const p1 = [x + side * 46 * u, y - 12 * u], p2 = [x + side * 68 * u, y + 58 * u];
    const path = () => { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); };
    g.lineCap = 'round'; path(); g.lineWidth = 13 * u; g.strokeStyle = TOON.ink; g.stroke();
    path(); g.lineWidth = 9.5 * u; g.strokeStyle = '#8fdcff'; g.stroke();
    path(); g.lineWidth = 3 * u; g.strokeStyle = 'rgba(255,255,255,.8)'; g.stroke();
    for (let i = 1; i <= 3; i++) tShape(g, '#8fdcff', gg => gg.ellipse(p2[0] + side * i * 6 * u, p2[1] + i * 22 * u, (6 - i) * u, (7.5 - i) * u, 0, 0, 6.2832), 2.6 * u / 2);
  }
}
function coverSparkles(g, pts, col = '#fff6c8') { for (const [x, y, r] of pts) drawStar(g, x, y, r, col, 3); }
function coverShadow(g, draw, dx = 14, dy = 18) { g.save(); g.translate(dx, dy); g.globalAlpha = .28; g.filter = 'brightness(0)'; draw(); g.restore(); }
