// Volt Labs 13 "The Evil Mirror": WHICH ONE IS EVIL? Cleo, big and deadpan, beside her evil twin, who is exactly the same (mirrored,
// with a villain's moustache and goatee, in the mirror's violet glow), stepped out of the tall black mirror behind her. Behind the bench.
// The twin's goatee is copied from vl13-the-evil-mirror/film.js (the rigs are unchanged).
(() => {
  function goatee(g, chin, lip, w) {                                    // a villain's Van Dyke: a curled moustache over the lip and a short
    const p = gg => { gg.moveTo(-9, chin - 3); gg.quadraticCurveTo(-7, chin + 8, 0, chin + 17); gg.quadraticCurveTo(7, chin + 8, 9, chin - 3); gg.quadraticCurveTo(0, chin + 1, -9, chin - 3); gg.closePath(); };
    tShape(g, '#1e1530', p, 2.4);                                         // pointed goatee under the chin (on the skin of the neck)
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(sx * 2, lip); g.quadraticCurveTo(sx * w * .55, lip - 3, sx * w, lip + 1); g.quadraticCurveTo(sx * (w + 5), lip - 6, sx * (w + 1), lip - 9);
      g.lineCap = 'round'; g.lineWidth = 5.4; g.strokeStyle = TOON.ink; g.stroke(); g.lineWidth = 2.6; g.strokeStyle = '#3a2a55'; g.stroke();
    }
  }

  COVER['vl13-the-evil-mirror'] = g => {
    g.fillStyle = '#12302a'; g.fillRect(0, 0, W, H);
    let a = 7; const R = () => (a = a * 16807 % 2147483647) / 2147483647;
    for (let r = 0, y = 0; y < H; r++, y += 72) for (let x = (r % 2) * -90; x < W; x += 180) { const v = R(); g.fillStyle = v < .33 ? '#18402f' : v < .66 ? '#1a4433' : '#163b2c'; g.fillRect(x + 4, y + 4, 172, 64); }
    coverBurst(g, 540, 1180, ['#f1e6ff', '#c77dff', '#1a1a33'], 14, .08);
    // the mirror behind the twin
    const mx = 300, my = 1310;
    tShape(g, '#1f1830', gg => gg.ellipse(mx, my, 300, 560, 0, 0, 6.2832), 7);
    g.save(); g.lineWidth = 12; g.strokeStyle = '#e0b040'; g.beginPath(); g.ellipse(mx, my, 262, 520, 0, 0, 6.2832); g.stroke(); g.restore();
    g.save(); g.beginPath(); g.ellipse(mx, my, 250, 508, 0, 0, 6.2832); g.clip();
    const gr = g.createLinearGradient(mx - 250, my - 500, mx + 250, my + 500); gr.addColorStop(0, '#dcd8f4'); gr.addColorStop(1, '#7a70b8'); g.fillStyle = gr; g.fillRect(mx - 260, my - 520, 520, 1040);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineCap = 'round'; g.lineWidth = 16; g.beginPath(); g.moveTo(mx - 160, my - 300); g.lineTo(mx - 90, my - 420); g.stroke();
    g.restore();
    const BASE = 2010, Sz = 430;
    // Evil Cleo (left), mirrored, goatee, the violet glow
    const tc = document.createElement('canvas'); tc.width = W; tc.height = H; const t2 = tc.getContext('2d');
    t2.save(); t2.translate(300, BASE); t2.scale(-1, 1); drawCleo2(t2, 0, 0, Sz, { expr: 'deadpan', look: -1.4 }); t2.scale(Sz / 100, Sz / 100); goatee(t2, -154, -174, 10); t2.restore();
    g.save(); g.shadowColor = '#c77dff'; g.shadowBlur = 40; g.drawImage(tc, 0, 0); g.restore();
    // Cleo (right), looking at her
    drawCleo2(g, 790, BASE, Sz, { expr: 'deadpan', look: -1.4 });
    // the bench (it hides them from the waist down)
    const BENCH = 1800;
    tShape(g, '#4a5266', gg => gg.rect(-20, BENCH, W + 40, 44), 6);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-20, BENCH + 6, W + 40, 7);
    tShape(g, '#262b3a', gg => gg.rect(-20, BENCH + 46, W + 40, H), 6);
    coverSparkles(g, [[560, 880, 22], [60, 1500, 18]], '#f6e8ff');
  };
})();
