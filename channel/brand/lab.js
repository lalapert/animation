// Lab series concept: the scientist (two options) and the assistant robot. Uses the helpers in toon.js.
// Same staging as Void Mart: (x, y) = top of the lab bench under the character's centre, s = face height in px.
'use strict';

const LAB = {
  glow: '#b6ff3b', glowS: '#6fcf1f',
  coat: '#f4f1fb', coatS: '#c9c3dc',
  vera: { skin: '#f6d2bd', skinS: '#e0ab93', hair: '#ece6ff', hairS: '#b9addb', neck: '#231a33' },
  gran: { skin: '#f1c7b5', skinS: '#d9a593', hair: '#f4f1f8', hairS: '#c8c2d8', cardi: '#b38ad9', cardiS: '#8f63b8', frame: '#7a3cff' },
  cleo: { skin: '#f8d6c4', skinS: '#e6b19b', hair: '#c4603a', hairS: '#94401f', hairL: '#e98a5c', blouse: '#ffc8da', blouseS: '#f29bb8', lips: '#de4f6c', iris: '#3fae6a' },
  crumb: { chrome: '#cfd6e4', chromeS: '#9aa3b8', chromeL: '#ffffff', screen: '#10202a', eye: '#7ef0ff', glove: '#ffd23f', gloveS: '#e0a91c', toast: '#e8b46a', crust: '#a8692e' },
};

// bumpy cloud with a single outer outline (hair poofs, smoke)
function tCloud(c, bumps, fill, lw) {
  c.save(); c.lineWidth = (lw || TOON.LW) * 2; c.strokeStyle = TOON.ink; c.fillStyle = fill;
  for (const [x, y, r] of bumps) { c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.stroke(); }
  for (const [x, y, r] of bumps) { c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); }
  c.restore();
}
function glowFlask(c, x, y, k) {
  const fl = g => { g.moveTo(x - 6 * k, y - 34 * k); g.lineTo(x - 6 * k, y - 16 * k); g.lineTo(x - 20 * k, y + 6 * k); g.quadraticCurveTo(x - 22 * k, y + 12 * k, x - 14 * k, y + 12 * k); g.lineTo(x + 14 * k, y + 12 * k); g.quadraticCurveTo(x + 22 * k, y + 12 * k, x + 20 * k, y + 6 * k); g.lineTo(x + 6 * k, y - 16 * k); g.lineTo(x + 6 * k, y - 34 * k); g.closePath(); };
  c.save(); c.shadowColor = LAB.glow; c.shadowBlur = 26 * k; tShape(c, 'rgba(220,255,240,.55)', fl); c.restore();
  tShade(c, fl, LAB.glow, g => g.rect(x - 30 * k, y - 6 * k, 60 * k, 30 * k));
  c.fillStyle = '#efffd0'; for (const [bx, by, br] of [[-6, 2, 3], [5, -2, 2.2], [1, -10, 1.8]]) { c.beginPath(); c.arc(x + bx * k, y + by * k, br * k, 0, 6.2832); c.fill(); }
  tShape(c, null, fl);
  tShape(c, '#f4f1fb', g => g.roundRect(x - 8 * k, y - 38 * k, 16 * k, 6 * k, 2 * k), 3);
}

// ---------- Option A: Dr. Vera Volt, 29. Genius, sleepless, plans to rule the world from a rented basement ----------
function drawVera(c, x, y, s, o = {}) {
  const V = LAB.vera, expr = o.expr || 'scheme';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // hair cloud behind
  const B = []; for (let i = 0; i < 15; i++) { const a = Math.PI * (.86 + i / 14 * 1.28); B.push([Math.cos(a) * 70, -246 + Math.sin(a) * 62, 27 + (i % 3) * 4]); }
  B.push([0, -252, 60]);
  tCloud(c, B, V.hair);
  for (const [cx0, cy0, a0] of [[-62, -232, 0], [58, -250, 1], [-40, -296, 2], [44, -298, 3], [70, -214, 4]]) tCurve(c, cx0 - 8, cy0 + 4, cx0, cy0 - 8 + (a0 % 2) * 3, cx0 + 9, cy0 + 2, 3, V.hairS);
  // pencil stuck in the hair
  tShape(c, '#ffd23f', g => { g.save(); g.translate(64, -300); g.rotate(.6); g.rect(-5, -30, 10, 46); g.restore(); }, 3);
  tShape(c, '#ff8fb1', g => { g.save(); g.translate(64, -300); g.rotate(.6); g.rect(-5, -38, 10, 9); g.restore(); }, 3);
  // coat torso
  const torso = g => { g.moveTo(-66, 2); g.lineTo(-70, -108); g.bezierCurveTo(-70, -140, -46, -150, -18, -158); g.lineTo(18, -158); g.bezierCurveTo(46, -150, 70, -140, 70, -108); g.lineTo(66, 2); g.closePath(); };
  tShape(c, LAB.coat, torso);
  tShade(c, torso, LAB.coatS, g => g.rect(34, -170, 50, 180));
  // turtleneck in the V
  tShape(c, V.neck, g => { g.moveTo(-20, -156); g.lineTo(20, -156); g.lineTo(4, -90); g.lineTo(-4, -90); g.closePath(); });
  // lapels
  tShape(c, LAB.coat, g => { g.moveTo(-22, -158); g.lineTo(-4, -90); g.lineTo(-30, -112); g.lineTo(-40, -150); g.closePath(); }, 3.4);
  tShape(c, LAB.coatS, g => { g.moveTo(22, -158); g.lineTo(4, -90); g.lineTo(30, -112); g.lineTo(40, -150); g.closePath(); }, 3.4);
  // scorch marks + pocket with pens
  c.fillStyle = 'rgba(60,40,70,.35)'; for (const [sx, sy, r] of [[-48, -40, 12], [-40, -30, 8], [50, -60, 10]]) { c.beginPath(); c.arc(sx, sy, r, 0, 6.2832); c.fill(); }
  tShape(c, LAB.coat, g => g.rect(-56, -94, 28, 22), 3);
  tLine(c, [-50, -94, -50, -108], 4); tLine(c, [-42, -94, -40, -110], 4);
  c.strokeStyle = '#ff4fa3'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-50, -96); c.lineTo(-50, -106); c.stroke();
  c.strokeStyle = '#29d3c3'; c.beginPath(); c.moveTo(-41.5, -96); c.lineTo(-40.2, -108); c.stroke();
  // neck roll + neck
  const neck = g => g.rect(-11, -184, 22, 26);
  tShape(c, V.skin, neck); tShade(c, neck, V.skinS, g => g.rect(-11, -184, 22, 10));
  tShape(c, V.neck, g => g.roundRect(-22, -166, 44, 14, 6), 3.4);
  tEllipse(c, -36, -224, 7, 11, V.skin); tEllipse(c, 36, -224, 7, 11, V.skin);
  // face: narrow, pointed chin
  const face = g => { g.moveTo(0, -270); g.bezierCurveTo(26, -270, 38, -254, 37, -230); g.bezierCurveTo(36, -206, 20, -184, 0, -174); g.bezierCurveTo(-20, -184, -36, -206, -37, -230); g.bezierCurveTo(-38, -254, -26, -270, 0, -270); g.closePath(); };
  tShape(c, V.skin, face);
  tShade(c, face, V.skinS, g => { g.moveTo(20, -276); g.bezierCurveTo(32, -240, 30, -200, 2, -168); g.lineTo(60, -168); g.lineTo(60, -276); g.closePath(); });
  // eyes: manic, one twitching
  for (const sx of [-1, 1]) {
    const ex = sx * 16, ey = -228, r = sx < 0 ? 12 : 10.5;
    if (expr === 'laugh') { tCurve(c, ex - 10, ey + 3, ex, ey - 7, ex + 10, ey + 3, 4.6); tLine(c, [ex - sx * 11, ey - 14, ex + sx * 12, ey - 23], 5); continue; }
    tEllipse(c, ex, ey, r, expr === 'shock' ? r * 1.2 : r, TOON.white, 3);
    c.fillStyle = TOON.ink; c.beginPath(); c.arc(ex + sx * -1, ey + 1, expr === 'shock' ? 2.6 : 3.8, 0, 6.2832); c.fill();
    tCurve(c, ex - 8, ey + 14, ex, ey + 17, ex + 8, ey + 14, 2, V.skinS);
    if (expr === 'blush') tLine(c, [ex - sx * 10, ey - 18, ex + sx * 10, ey - 14], 4.6);
    else tLine(c, [ex - sx * 11, ey - 14, ex + sx * 12, ey - 23], 5);          // evil brows, up and out
  }
  if (expr === 'scheme') { tLine(c, [27, -238, 31, -242], 2.4); tLine(c, [28, -232, 33, -233], 2.4); }  // twitch marks
  tCurve(c, 0, -216, 5, -208, -1, -205, 2.8);
  if (expr === 'blush') {
    c.fillStyle = 'rgba(255,90,120,.55)'; c.beginPath(); c.ellipse(-24, -206, 10, 6, 0, 0, 6.2832); c.ellipse(24, -206, 10, 6, 0, 0, 6.2832); c.fill();
    c.beginPath(); c.moveTo(-10, -194); c.bezierCurveTo(-5, -199, -2, -189, 2, -194); c.bezierCurveTo(6, -198, 9, -192, 11, -194); c.lineWidth = 3.4; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.stroke();
  } else if (expr === 'shock') {
    tEllipse(c, 0, -194, 8, 10, '#4a1028', 3.6);
  } else if (expr === 'laugh') {
    const m = g => { g.moveTo(-26, -206); g.quadraticCurveTo(0, -200, 27, -208); g.quadraticCurveTo(18, -172, 0, -172); g.quadraticCurveTo(-18, -172, -26, -206); g.closePath(); };
    tShape(c, '#4a1028', m, 3.6);
    c.save(); c.beginPath(); m(c); c.clip(); c.fillStyle = '#fff'; c.fillRect(-27, -211, 56, 9); c.fillStyle = '#ff7f97'; c.beginPath(); c.ellipse(0, -174, 14, 8, 0, 0, 6.2832); c.fill(); c.restore();
    tShape(c, null, m, 3.6);
    for (const sx of [-1, 1]) { tLine(c, [sx * 46, -232, sx * 56, -238], 3); tLine(c, [sx * 46, -220, sx * 58, -220], 3); }
  } else {
    const m = g => { g.moveTo(-25, -203); g.quadraticCurveTo(0, -196, 26, -206); g.quadraticCurveTo(14, -182, -2, -182); g.quadraticCurveTo(-18, -184, -25, -203); g.closePath(); };
    tShape(c, '#4a1028', m, 3.6);
    c.save(); c.beginPath(); m(c); c.clip(); c.fillStyle = '#fff'; c.fillRect(-26, -208, 54, 9);
    c.strokeStyle = TOON.ink; c.lineWidth = 1.6; for (let i = -18; i <= 20; i += 7) { c.beginPath(); c.moveTo(i, -206); c.lineTo(i, -197); c.stroke(); }
    c.restore(); tShape(c, null, m, 3.6);
  }
  // front hair swoop
  tCloud(c, [[-26, -270, 16], [-8, -276, 15], [12, -276, 15], [30, -268, 15]], V.hair, 4.2);
  // goggles on the forehead
  tShape(c, '#4a2c1a', g => g.rect(-44, -268, 88, 9), 3);
  for (const sx of [-1, 1]) { tEllipse(c, sx * 16, -264, 13, 12, '#c9963a', 3.6); tEllipse(c, sx * 16, -264, 8.5, 8, 'rgba(182,255,59,.85)', 3); tCurve(c, sx * 16 - 4, -267, sx * 16 - 2, -269, sx * 16 + 1, -269, 2, '#fff'); }
  // arms: left forearm on the bench, right hand raising a glowing flask
  tTube(c, [-62, -124, -80, -72, -76, -24, -48, -18, -14, -20], 24, LAB.coat);
  tHand(c, -10, -21, 9.5, V.skin, V.skinS);
  if (o.flask !== false) {
    tTube(c, [62, -124, 90, -96, 88, -70, 86, -110, 80, -134], 24, LAB.coat, LAB.coatS);
    glowFlask(c, 80, -168, 1.25);
    tHand(c, 80, -140, 9.5, V.skin, V.skinS);
  }
  c.restore();
}

// ---------- Option B: Dr. Mildred Malice, 82. Tiny, sweet-looking, absolutely serious about world domination ----------
function drawGranny(c, x, y, s, o = {}) {
  const G = LAB.gran, expr = o.expr || 'scheme';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // towering bun with a knitting needle through it
  tLine(c, [-46, -338, 40, -282], 4.6); tEllipse(c, -48, -340, 6, 6, '#ff4fa3', 3);
  tEllipse(c, 0, -314, 24, 20, G.hair); tEllipse(c, 0, -286, 36, 28, G.hair);
  tCurve(c, -16, -300, 0, -308, 16, -300, 2.6, G.hairS); tCurve(c, -24, -278, 0, -290, 24, -278, 2.6, G.hairS);
  tLine(c, [-20, -300, 26, -268], 4.6);
  // cardigan torso with a lab coat open over it
  const torso = g => { g.moveTo(-56, 2); g.lineTo(-58, -86); g.bezierCurveTo(-58, -112, -40, -120, -16, -126); g.lineTo(16, -126); g.bezierCurveTo(40, -120, 58, -112, 58, -86); g.lineTo(56, 2); g.closePath(); };
  tShape(c, G.cardi, torso);
  tShade(c, torso, G.cardiS, g => g.rect(26, -140, 40, 150));
  for (let i = 0; i < 4; i++) tEllipse(c, 0, -96 + i * 24, 3.4, 3.4, '#f4f1f8', 2.2);   // buttons
  tShape(c, LAB.coat, g => { g.moveTo(-64, 2); g.lineTo(-68, -88); g.bezierCurveTo(-66, -114, -50, -122, -34, -126); g.lineTo(-26, -60); g.lineTo(-30, 2); g.closePath(); });
  tShape(c, LAB.coat, g => { g.moveTo(64, 2); g.lineTo(68, -88); g.bezierCurveTo(66, -114, 50, -122, 34, -126); g.lineTo(26, -60); g.lineTo(30, 2); g.closePath(); });
  tShade(c, g => { g.moveTo(64, 2); g.lineTo(68, -88); g.bezierCurveTo(66, -114, 50, -122, 34, -126); g.lineTo(26, -60); g.lineTo(30, 2); g.closePath(); }, LAB.coatS, g => g.rect(50, -130, 30, 140));
  // skull brooch
  tEllipse(c, -16, -92, 7, 6.5, TOON.white, 2.4); c.fillStyle = TOON.ink; c.beginPath(); c.arc(-18.5, -92, 1.6, 0, 6.2832); c.arc(-13.5, -92, 1.6, 0, 6.2832); c.fill();
  // neck + pearls
  const neck = g => g.rect(-11, -150, 22, 26);
  tShape(c, G.skin, neck); tShade(c, neck, G.skinS, g => g.rect(-11, -150, 22, 10));
  for (let i = -5; i <= 5; i++) tEllipse(c, i * 5.4, -126 + Math.abs(i) * -1.4 + 4, 3, 3, '#fffaf0', 1.8);
  // face: soft and round
  const face = g => g.ellipse(0, -204, 42, 50, 0, 0, 6.2832);
  tEllipse(c, -41, -206, 7, 10, G.skin); tEllipse(c, 41, -206, 7, 10, G.skin);
  tShape(c, G.skin, face);
  tShade(c, face, G.skinS, g => g.ellipse(28, -192, 22, 46, -.25, 0, 6.2832));
  c.fillStyle = 'rgba(255,110,140,.45)'; c.beginPath(); c.ellipse(-24, -184, 10, 7, 0, 0, 6.2832); c.ellipse(24, -184, 10, 7, 0, 0, 6.2832); c.fill();
  // wrinkles
  tCurve(c, -14, -246, 0, -249, 14, -246, 2.2, G.skinS); tCurve(c, -9, -240, 0, -242, 9, -240, 2.2, G.skinS);
  tCurve(c, -22, -176, -18, -170, -12, -168, 2.2, G.skinS); tCurve(c, 22, -176, 18, -170, 12, -168, 2.2, G.skinS);
  // hair swept back at the temples
  tShape(c, G.hair, g => { g.moveTo(-42, -214); g.bezierCurveTo(-48, -262, -10, -262, 0, -252); g.bezierCurveTo(10, -262, 48, -262, 42, -214); g.bezierCurveTo(36, -234, 16, -244, 0, -242); g.bezierCurveTo(-16, -244, -36, -234, -42, -214); g.closePath(); });
  // magnifying glasses: huge eyes behind thick lenses
  for (const sx of [-1, 1]) {
    const ex = sx * 20, ey = -210;
    tShape(c, 'rgba(230,245,255,.9)', g => g.ellipse(ex, ey, 18, 16, 0, 0, 6.2832), 5.6);
    tShape(c, G.frame, g => { g.moveTo(ex + sx * 12, ey - 13); g.quadraticCurveTo(ex + sx * 24, ey - 20, ex + sx * 27, ey - 12); g.quadraticCurveTo(ex + sx * 22, ey - 9, ex + sx * 17, ey - 6); g.closePath(); }, 3);
    if (expr === 'blush') tCurve(c, ex - 9, ey + 2, ex, ey - 7, ex + 9, ey + 2, 4.4);
    else {
      tEllipse(c, ex, ey, 11, 12, TOON.white, 2.6);
      c.fillStyle = TOON.ink; c.beginPath(); c.arc(ex + sx * -1.5, ey + 1.5, 6.5, 0, 6.2832); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 2, ey - 2, 2.2, 0, 6.2832); c.fill();
      c.fillStyle = G.skin; c.fillRect(ex - 12, ey - 13, 24, expr === 'scheme' ? 6 : 2); tLine(c, [ex - 11, ey - 13 + (expr === 'scheme' ? 6 : 2), ex + 11, ey - 13 + (expr === 'scheme' ? 6 : 2)], 3.6);
    }
    tLine(c, [ex - 12, ey - 10, ex - 6, ey - 16], 2.6); // lens glare
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(ex - 12, ey - 10); c.lineTo(ex - 6, ey - 16); c.stroke();
  }
  tShape(c, G.frame, g => g.rect(-4, -214, 8, 4), 2.4);
  c.save(); c.lineWidth = 2.6; c.strokeStyle = G.frame; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 20, -210, 18, 16, 0, 0, 6.2832); c.stroke(); } c.restore();
  // brows above the frames
  for (const sx of [-1, 1]) { const ex = sx * 20; if (expr === 'blush') tCurve(c, ex - 9, -240, ex, -244, ex + 9, -240, 3.6); else tLine(c, [ex - sx * 10, -234, ex + sx * 10, -242], 4); }
  // nose + mouth (gold tooth)
  tCurve(c, -2, -192, 3, -186, -1, -184, 2.8);
  if (expr === 'blush') {
    c.beginPath(); c.moveTo(-9, -172); c.bezierCurveTo(-4, -176, -2, -168, 2, -172); c.bezierCurveTo(6, -176, 8, -170, 10, -172); c.lineWidth = 3.4; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.stroke();
    c.fillStyle = 'rgba(255,80,110,.6)'; c.beginPath(); c.ellipse(-24, -184, 11, 7, 0, 0, 6.2832); c.ellipse(24, -184, 11, 7, 0, 0, 6.2832); c.fill();
  } else {
    const m = g => { g.moveTo(-16, -176); g.quadraticCurveTo(2, -170, 18, -180); g.quadraticCurveTo(10, -162, -2, -163); g.quadraticCurveTo(-12, -164, -16, -176); g.closePath(); };
    tShape(c, '#4a1028', m, 3.4);
    c.save(); c.beginPath(); m(c); c.clip(); c.fillStyle = '#fff'; c.fillRect(-16, -180, 34, 7); c.fillStyle = '#ffd23f'; c.fillRect(4, -180, 6, 7); c.restore();
    tShape(c, null, m, 3.4);
  }
  // hands holding a teacup of something glowing
  if (o.cup !== false) {
    tTube(c, [-54, -96, -70, -50, -60, -30, -40, -26, -24, -34], 20, G.cardi);
    tTube(c, [54, -96, 70, -50, 60, -30, 40, -26, 24, -34], 20, G.cardi, G.cardiS);
    tShape(c, '#fbf7ff', g => g.ellipse(0, -18, 40, 8, 0, 0, 6.2832), 3.4);
    const cup = g => { g.moveTo(-24, -50); g.lineTo(24, -50); g.bezierCurveTo(24, -26, 14, -18, 0, -18); g.bezierCurveTo(-14, -18, -24, -26, -24, -50); g.closePath(); };
    tShape(c, '#fbf7ff', cup); tShade(c, cup, '#d9d2ea', g => g.rect(10, -52, 20, 40));
    tShape(c, '#ff4fa3', g => g.rect(-24, -42, 48, 5), 2);
    tShape(c, '#fbf7ff', g => g.arc(28, -38, 8, -1.2, 1.4), 3.4);
    c.save(); c.shadowColor = LAB.glow; c.shadowBlur = 18; tShape(c, LAB.glow, g => g.ellipse(0, -50, 23, 5, 0, 0, 6.2832), 3); c.restore();
    for (const sx of [-8, 6]) tCurve(c, sx, -58, sx + 8, -70, sx, -82, 3, 'rgba(182,255,59,.8)');
    tHand(c, -22, -34, 8, G.skin, G.skinS); tHand(c, 22, -34, 8, G.skin, G.skinS);
    tTube(c, [30, -38, 38, -46, 40, -56], 5, G.skin);   // pinky out
  }
  c.restore();
}

// ---------- the assistant: CRUMB, a henchbot built from a toaster and a bin. Labelled EVIL. Is not. ----------
// o.expr: calm | happy | pop (startled: toast pops up) | worried
function drawCrumb(c, x, y, s, o = {}) {
  const K = LAB.crumb, expr = o.expr || 'calm';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // toast popping up (behind the head)
  if (expr === 'pop') for (const sx of [-1, 1]) {
    const tx = sx * 20;
    tShape(c, K.toast, g => { g.moveTo(tx - 14, -196); g.lineTo(tx - 14, -238); g.bezierCurveTo(tx - 20, -256, tx + 20, -256, tx + 14, -238); g.lineTo(tx + 14, -196); g.closePath(); });
    tShade(c, g => { g.moveTo(tx - 14, -196); g.lineTo(tx - 14, -238); g.bezierCurveTo(tx - 20, -256, tx + 20, -256, tx + 14, -238); g.lineTo(tx + 14, -196); g.closePath(); }, '#f6d79a', g => g.roundRect(tx - 9, -244, 18, 48, 6));
    tShape(c, null, g => { g.moveTo(tx - 14, -196); g.lineTo(tx - 14, -238); g.bezierCurveTo(tx - 20, -256, tx + 20, -256, tx + 14, -238); g.lineTo(tx + 14, -196); g.closePath(); });
    tLine(c, [tx - 24 * sx * -1, -262, tx - 30 * sx * -1, -272], 3);
  }
  // body: a chrome pedal bin
  const body = g => { g.moveTo(-44, 2); g.lineTo(-46, -100); g.quadraticCurveTo(-46, -110, -36, -110); g.lineTo(36, -110); g.quadraticCurveTo(46, -110, 46, -100); g.lineTo(44, 2); g.closePath(); };
  tShape(c, K.chrome, body);
  tShade(c, body, K.chromeS, g => g.rect(20, -120, 40, 130));
  c.save(); c.beginPath(); body(c); c.clip(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(-32, -104, 8, 104); c.restore();
  tShape(c, K.chrome, g => g.roundRect(-50, -118, 100, 14, 5));
  tCurve(c, 16, -50, 22, -42, 18, -34, 2.6, K.chromeS);   // dent
  // EVIL label (masking tape)
  c.save(); c.translate(-2, -70); c.rotate(-.08);
  tShape(c, '#fff6dc', g => g.rect(-30, -13, 60, 26), 2.8);
  tText(c, 'EVIL', 0, 1, 22, '#e23b4a', '"Bungee"', 'center', 400);
  c.restore();
  // spring neck
  c.beginPath(); for (let i = 0; i <= 8; i++) { const yy = -118 - i * 2.6; i ? c.lineTo(i % 2 ? 9 : -9, yy) : c.moveTo(-9, yy); }
  c.lineWidth = 4.2; c.strokeStyle = TOON.ink; c.stroke();
  // toaster head
  const head = g => g.roundRect(-52, -200, 104, 64, 18);
  tShape(c, K.chrome, head);
  tShade(c, head, K.chromeS, g => g.rect(26, -206, 40, 80));
  c.save(); c.beginPath(); head(c); c.clip(); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(-42, -194, 7, 52); c.restore();
  tShape(c, '#20183a', g => { g.roundRect(-34, -200, 28, 6, 3); g.roundRect(6, -200, 28, 6, 3); }, 2.6);
  tShape(c, K.chromeS, g => g.rect(52, -176, 10, 8), 3); tEllipse(c, 66, -172, 6, 6, '#20183a', 3);   // lever
  // face screen
  tShape(c, K.screen, g => g.roundRect(-34, -186, 68, 40, 10), 3.6);
  c.save(); c.shadowColor = K.eye; c.shadowBlur = 10; c.fillStyle = K.eye; c.strokeStyle = K.eye; c.lineCap = 'round';
  if (expr === 'happy') { c.lineWidth = 4.4; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 14 - 7, -164); c.quadraticCurveTo(sx * 14, -174, sx * 14 + 7, -164); c.stroke(); } }
  else if (expr === 'pop') { for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 14, -168, 7.5, 0, 6.2832); c.fill(); } }
  else if (expr === 'worried') { for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(sx * 14 - 4, -172, 8, 12, 4); c.fill(); } c.lineWidth = 3; c.beginPath(); c.moveTo(-19, -177); c.lineTo(-9, -180); c.moveTo(19, -177); c.lineTo(9, -180); c.stroke(); }
  else { for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(sx * 14 - 4, -174, 8, 14, 4); c.fill(); } }
  c.lineWidth = 3; c.beginPath();
  if (expr === 'pop') c.arc(0, -155, 3.5, 0, 6.2832);
  else if (expr === 'worried') { c.moveTo(-7, -153); c.lineTo(-2, -156); c.lineTo(2, -153); c.lineTo(7, -156); }
  else { c.moveTo(-7, -156); c.quadraticCurveTo(0, -150, 7, -156); }
  c.stroke(); c.restore();
  if (expr === 'worried') tShape(c, '#9fe6ff', g => { g.moveTo(58, -206); g.quadraticCurveTo(66, -192, 62, -186); g.quadraticCurveTo(56, -182, 53, -190); g.quadraticCurveTo(52, -196, 58, -206); g.closePath(); }, 2.6);
  // vacuum-hose arms with kitchen gloves
  const hose = (pts) => {
    tTube(c, pts, 15, '#8d96ad');
    c.save(); c.strokeStyle = '#6b7389'; c.lineWidth = 2.2;
    for (let t = .08; t < .95; t += .12) {
      const qx = (1 - t) * (1 - t) * pts[0] + 2 * (1 - t) * t * pts[2] + t * t * pts[4], qy = (1 - t) * (1 - t) * pts[1] + 2 * (1 - t) * t * pts[3] + t * t * pts[5];
      c.beginPath(); c.arc(qx, qy, 6.5, 0, 6.2832); c.stroke();
    }
    c.restore();
  };
  if (o.wave) { hose([44, -86, 82, -110, 84, -160]); tHand(c, 86, -172, 10, K.glove, K.gloveS, true); }
  else { hose([44, -86, 70, -50, 40, -18]); tHand(c, 34, -16, 10, K.glove, K.gloveS); }
  hose([-44, -86, -70, -50, -40, -18]); tHand(c, -34, -16, 10, K.glove, K.gloveS);
  c.restore();
}

// ---------- Cleo, 24: the lab assistant. Calm, kind, unbothered by explosions; quietly turns evil plans into nice ones ----------
// o.expr: smile | wink | oh | worried
function drawCleo(c, x, y, s, o = {}) {
  const K = LAB.cleo, expr = o.expr || 'smile';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // long wavy hair, back mass
  const back = g => { g.moveTo(-40, -252); g.bezierCurveTo(-72, -246, -64, -200, -72, -168); g.bezierCurveTo(-80, -136, -64, -118, -78, -96); g.quadraticCurveTo(-66, -82, -56, -92); g.quadraticCurveTo(-46, -80, -34, -92); g.lineTo(34, -92); g.quadraticCurveTo(46, -80, 56, -92); g.quadraticCurveTo(66, -82, 78, -96); g.bezierCurveTo(64, -118, 80, -136, 72, -168); g.bezierCurveTo(64, -200, 72, -246, 40, -252); g.bezierCurveTo(20, -284, -20, -284, -40, -252); g.closePath(); };
  tShape(c, K.hair, back);
  for (const sx of [-1, 1]) { tCurve(c, sx * 60, -200, sx * 70, -160, sx * 62, -120, 2.6, K.hairS); tCurve(c, sx * 66, -150, sx * 74, -126, sx * 68, -104, 2.6, K.hairS); }
  // torso: blouse under a fitted lab coat
  const torso = g => { g.moveTo(-54, 2); g.lineTo(-56, -98); g.bezierCurveTo(-56, -126, -36, -138, -14, -144); g.lineTo(14, -144); g.bezierCurveTo(36, -138, 56, -126, 56, -98); g.lineTo(54, 2); g.closePath(); };
  tShape(c, K.blouse, torso);
  tShade(c, torso, K.blouseS, g => g.rect(24, -150, 40, 160));
  const cl = g => { g.moveTo(-60, 2); g.lineTo(-62, -100); g.bezierCurveTo(-60, -128, -44, -138, -24, -144); g.lineTo(-18, -110); g.lineTo(-22, 2); g.closePath(); };
  const cr = g => { g.moveTo(60, 2); g.lineTo(62, -100); g.bezierCurveTo(60, -128, 44, -138, 24, -144); g.lineTo(18, -110); g.lineTo(22, 2); g.closePath(); };
  tShape(c, LAB.coat, cl); tShape(c, LAB.coat, cr); tShade(c, cr, LAB.coatS, g => g.rect(42, -150, 30, 160));
  // collar bow
  tShape(c, K.blouseS, g => { g.moveTo(0, -132); g.lineTo(-14, -140); g.lineTo(-14, -124); g.closePath(); g.moveTo(0, -132); g.lineTo(14, -140); g.lineTo(14, -124); g.closePath(); }, 3);
  tEllipse(c, 0, -132, 4, 4, K.blouseS, 2.6);
  // name tag
  // neck
  const neck = g => g.rect(-10, -176, 20, 34);
  tShape(c, K.skin, neck); tShade(c, neck, K.skinS, g => g.rect(-10, -176, 20, 12));
  // ears + earrings
  tEllipse(c, -37, -220, 6.5, 10, K.skin); tEllipse(c, 37, -220, 6.5, 10, K.skin);
  for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 38, -204, 5, 0, 6.2832); c.lineWidth = 4.6; c.strokeStyle = TOON.ink; c.stroke(); c.lineWidth = 2.4; c.strokeStyle = '#ffcf4a'; c.stroke(); }
  // face: soft oval
  const face = g => { g.moveTo(0, -270); g.bezierCurveTo(26, -270, 38, -252, 37, -228); g.bezierCurveTo(36, -202, 22, -178, 0, -174); g.bezierCurveTo(-22, -178, -36, -202, -37, -228); g.bezierCurveTo(-38, -252, -26, -270, 0, -270); g.closePath(); };
  tShape(c, K.skin, face);
  tShade(c, face, K.skinS, g => { g.moveTo(24, -276); g.bezierCurveTo(34, -240, 30, -200, 4, -170); g.lineTo(60, -170); g.lineTo(60, -276); g.closePath(); });
  c.fillStyle = 'rgba(255,120,150,.4)'; c.beginPath(); c.ellipse(-22, -206, 9, 5.5, 0, 0, 6.2832); c.ellipse(22, -206, 9, 5.5, 0, 0, 6.2832); c.fill();
  // eyes: almond, green irises, lashes
  for (const sx of [-1, 1]) {
    const ex = sx * 17, ey = -226;
    if (expr === 'wink' && sx > 0) { tCurve(c, ex - 9, ey + 1, ex, ey - 6, ex + 9, ey + 1, 4.4); tCurve(c, ex + sx * 8, ey - 2, ex + sx * 12, ey - 5, ex + sx * 14, ey - 9, 3); }
    else {
      const up = expr === 'oh' ? 27 : 23, sc = g => { g.moveTo(ex - 10.5, ey + 1); g.quadraticCurveTo(ex, ey - up, ex + 10.5, ey + 1); g.quadraticCurveTo(ex, ey + 12, ex - 10.5, ey + 1); g.closePath(); };
      c.beginPath(); sc(c); c.fillStyle = TOON.white; c.fill();
      c.save(); c.beginPath(); sc(c); c.clip();
      c.fillStyle = K.iris; c.beginPath(); c.arc(ex + .5, ey - 2.5, 7.6, 0, 6.2832); c.fill();
      c.fillStyle = '#1f6b3e'; c.beginPath(); c.arc(ex + .5, ey - 2.5, 7.6, Math.PI * 1.1, Math.PI * 1.9); c.lineTo(ex + .5, ey - 2.5); c.fill();
      c.fillStyle = TOON.ink; c.beginPath(); c.arc(ex + .5, ey - 2.5, 3.8, 0, 6.2832); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 2.5, ey - 5.5, 2.5, 0, 6.2832); c.fill(); c.beginPath(); c.arc(ex + 3.4, ey + 1, 1.3, 0, 6.2832); c.fill();
      c.restore();
      c.beginPath(); c.moveTo(ex - 11.5, ey + 1.5); c.quadraticCurveTo(ex, ey - up - 1, ex + 11.5, ey); c.lineWidth = 4.8; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.stroke();
      tCurve(c, ex - 7, ey + 6, ex, ey + 8, ex + 7, ey + 5, 1.8);
      for (let k = 0; k < 2; k++) tCurve(c, ex + sx * (9 + k * 1.5), ey - 3 - k * 4, ex + sx * (13 + k * 1.5), ey - 5 - k * 4, ex + sx * (15 + k * 1.5), ey - 9 - k * 4, 2.6);
    }
    // brows: thin arches
    if (expr === 'worried') tLine(c, [ex - sx * 9, -251, ex + sx * 9, -246], 3);
    else tCurve(c, ex - 10, -247 - (expr === 'oh' ? 4 : 0), ex, -253 - (expr === 'oh' ? 4 : 0), ex + 10, -248 - (expr === 'oh' ? 4 : 0), 3);
  }
  c.fillStyle = TOON.ink; c.beginPath(); c.arc(-24, -210, 1.6, 0, 6.2832); c.fill();   // beauty mark
  tCurve(c, 0, -214, 3, -207, -1, -205, 2.4);
  // lips
  if (expr === 'oh') { tEllipse(c, 0, -192, 5, 6.5, K.lips, 3); }
  else if (expr === 'worried') { tCurve(c, -8, -190, 0, -194, 8, -190, 3.4, K.lips); tCurve(c, -8, -190, 0, -194, 8, -190, 1.6); }
  else {
    tShape(c, K.lips, g => { g.moveTo(-12, -197); g.quadraticCurveTo(0, -191, 12, -197); g.quadraticCurveTo(0, -183, -12, -197); g.closePath(); }, 2.6);
    tCurve(c, -11, -196.5, 0, -191.5, 11, -196.5, 1.8);
  }
  // front hair: side-swept bangs + locks over the shoulders
  tShape(c, K.hair, g => { g.moveTo(-40, -228); g.bezierCurveTo(-46, -270, -10, -286, 22, -274); g.bezierCurveTo(40, -266, 44, -246, 40, -226); g.bezierCurveTo(34, -246, 20, -254, 4, -254); g.bezierCurveTo(-14, -250, -28, -238, -40, -228); g.closePath(); });
  tShape(c, K.hair, g => { g.moveTo(-38, -232); g.bezierCurveTo(-54, -200, -36, -176, -50, -148); g.bezierCurveTo(-62, -124, -44, -108, -58, -86); g.bezierCurveTo(-40, -94, -34, -112, -40, -132); g.bezierCurveTo(-46, -152, -28, -170, -34, -196); g.bezierCurveTo(-36, -210, -30, -220, -30, -228); g.closePath(); });
  tShape(c, K.hair, g => { g.moveTo(38, -232); g.bezierCurveTo(54, -200, 36, -176, 50, -148); g.bezierCurveTo(62, -124, 44, -108, 58, -86); g.bezierCurveTo(40, -94, 34, -112, 40, -132); g.bezierCurveTo(46, -152, 28, -170, 34, -196); g.bezierCurveTo(36, -210, 30, -220, 30, -228); g.closePath(); });
  tCurve(c, -24, -264, -4, -272, 18, -268, 3, K.hairL); tCurve(c, -44, -170, -46, -150, -50, -130, 2.6, K.hairL);
  // small lime bow on the side
  tShape(c, LAB.glow, g => { g.ellipse(30, -262, 9, 6, -.6, 0, 6.2832); }, 3); tShape(c, LAB.glow, g => { g.ellipse(46, -252, 9, 6, -.6, 0, 6.2832); }, 3);
  tEllipse(c, 38, -257, 4.5, 4.5, LAB.glowS, 2.8);
  // arms: clipboard on the left, fire extinguisher on the right (always ready)
  if (o.arms !== false) {
    tShape(c, '#c9963a', g => g.roundRect(-58, -92, 46, 60, 4), 3.4);
    tShape(c, TOON.white, g => g.rect(-53, -82, 36, 46), 2.4);
    tShape(c, '#7a8098', g => g.roundRect(-44, -96, 18, 8, 3), 2.6);
    c.strokeStyle = '#9aa0b8'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-49, -74 + i * 9); c.lineTo(-24, -74 + i * 9); c.stroke(); }
    tTube(c, [-52, -112, -66, -70, -52, -50, -40, -44, -30, -56], 18, LAB.coat);
    tHand(c, -28, -58, 8, K.skin, K.skinS);
    tTube(c, [52, -112, 66, -70, 66, -40], 18, LAB.coat, LAB.coatS);
    tShape(c, '#e23b4a', g => g.roundRect(56, -64, 26, 62, 9), 3.6);
    tShape(c, '#20183a', g => g.rect(62, -76, 14, 12), 3); tLine(c, [76, -72, 90, -66, 92, -50], 4);
    tShape(c, TOON.white, g => g.rect(58, -40, 22, 12), 2.4);
    tHand(c, 66, -40, 8.5, K.skin, K.skinS);
  }
  c.restore();
}

// ======================= v2: anime-flat look (owner's reference "feel": cool blonde scientist, deadpan bob-haired assistant) =======================
// Identifying details are deliberately our own: hair cut and colour, eye colour, outfit, accessories.
const LAB2 = {
  vera: { skin: '#fbe0cf', skinS: '#efbfa8', hair: '#f6eccb', hairS: '#d8c58c', hairL: '#fffbea', top: '#2a1f3a', iris: '#8a4fd8', irisD: '#4a2390', lips: '#b3506b' },
  cleo: { skin: '#fde5d6', skinS: '#f0c2ab', hair: '#cdbdf2', hairS: '#9c86d6', hairL: '#f1ebff', tee: '#fbf7ff', apron: '#26213a', apronS: '#17132a', iris: '#2fc0bb', irisD: '#137a78', glove: '#b6ff3b' },
};

// (animeEye and clumps live in toon.js)
// ---------- Dr. Vera Volt (v2): looks cool and composed. Is not. ----------
// o.expr: cool | scheme | fluster | laugh
function drawVera2(c, x, y, s, o = {}) {
  const V = LAB2.vera, expr = o.expr || 'cool';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // back hair: sleek long bob, jagged ends at the shoulders
  const back = g => { g.moveTo(-52, -154); g.quadraticCurveTo(-62, -200, -54, -238); g.quadraticCurveTo(-46, -290, 0, -292); g.quadraticCurveTo(46, -290, 54, -238); g.quadraticCurveTo(62, -200, 54, -152); g.lineTo(44, -164); g.lineTo(38, -148); g.lineTo(30, -168); g.lineTo(-30, -168); g.lineTo(-38, -150); g.lineTo(-44, -166); g.closePath(); };
  tShape(c, V.hairS, back);
  // lab coat + dark high-neck top
  const torso = g => { g.moveTo(-64, 2); g.lineTo(-68, -104); g.bezierCurveTo(-68, -136, -46, -146, -18, -152); g.lineTo(18, -152); g.bezierCurveTo(46, -146, 68, -136, 68, -104); g.lineTo(64, 2); g.closePath(); };
  tShape(c, V.top, torso);
  const cl = g => { g.moveTo(-66, 2); g.lineTo(-70, -104); g.bezierCurveTo(-70, -134, -50, -146, -28, -150); g.lineTo(-30, -126); g.lineTo(-14, -86); g.lineTo(-20, 2); g.closePath(); };
  const cr = g => { g.moveTo(66, 2); g.lineTo(70, -104); g.bezierCurveTo(70, -134, 50, -146, 28, -150); g.lineTo(30, -126); g.lineTo(14, -86); g.lineTo(20, 2); g.closePath(); };
  tShape(c, LAB.coat, cl); tShape(c, LAB.coat, cr); tShade(c, cr, LAB.coatS, g => g.rect(40, -160, 40, 170));
  // wide lapels
  tShape(c, LAB.coat, g => { g.moveTo(-28, -150); g.lineTo(-44, -132); g.lineTo(-30, -126); g.closePath(); }, 3.4);
  tShape(c, LAB.coatS, g => { g.moveTo(28, -150); g.lineTo(44, -132); g.lineTo(30, -126); g.closePath(); }, 3.4);
  // lime "V" pin + pens
  tShape(c, LAB.glow, g => { g.moveTo(-50, -112); g.lineTo(-44, -100); g.lineTo(-38, -112); g.lineTo(-41, -112); g.lineTo(-44, -106); g.lineTo(-47, -112); g.closePath(); }, 2.4);
  tLine(c, [44, -96, 44, -114], 4); tLine(c, [50, -96, 51, -112], 4);
  // neck + high collar
  const neck = g => g.rect(-10, -182, 20, 32);
  tShape(c, V.skin, neck); tShade(c, neck, V.skinS, g => g.rect(-10, -182, 20, 12));
  tShape(c, V.top, g => g.roundRect(-16, -164, 32, 16, 4), 3.4);
  // ear (left, hair tucked) + lightning-bolt earring
  tEllipse(c, -40, -218, 6.5, 10, V.skin);
  tShape(c, LAB.glow, g => { g.moveTo(-42, -207); g.lineTo(-46, -196); g.lineTo(-41, -197); g.lineTo(-44, -186); g.lineTo(-37, -199); g.lineTo(-41, -198); g.closePath(); }, 2.2);
  // face
  const face = g => { g.moveTo(0, -272); g.bezierCurveTo(28, -272, 40, -256, 40, -232); g.bezierCurveTo(40, -212, 28, -190, 0, -174); g.bezierCurveTo(-28, -190, -40, -212, -40, -232); g.bezierCurveTo(-40, -256, -28, -272, 0, -272); g.closePath(); };
  tShape(c, V.skin, face);
  tShade(c, face, V.skinS, g => { g.moveTo(26, -278); g.bezierCurveTo(36, -240, 30, -200, 4, -168); g.lineTo(60, -168); g.lineTo(60, -278); g.closePath(); });
  c.save(); c.translate((o.turn || 0) * 12, 0); c.scale(1 - Math.abs(o.turn || 0) * .1, 1);   // 3/4 turn (bodies.js): the features slide toward where she faces
  // eyes
  const E = { skin: V.skin, iris: V.iris, irisD: V.irisD, w: 12.5, h: 12 };
  for (const sx of [-1, 1]) {
    const ex = sx * 17, ey = -222;
    if (expr === 'laugh') { tCurve(c, ex - 10, ey - 2, ex, ey - 11, ex + 10, ey - 2, 5); continue; }
    if (o.blink) { closedEye(c, ex, ey - 2, 11, false); continue; }
    if (expr === 'scheme') { animeEye(c, ex, ey, sx, { ...E, h: 13, w: 12 }); c.fillStyle = '#fff'; continue; }
    animeEye(c, ex, ey, sx, { ...E, lid: expr === 'cool' ? .26 : 0, look: expr === 'fluster' ? -2 : 1 });
  }
  if (expr === 'scheme' && !o.blink) for (const sx of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * 17, -226, 5.5, 0, 6.2832); c.fill(); c.fillStyle = TOON.ink; c.beginPath(); c.arc(sx * 17, -226, 2.6, 0, 6.2832); c.fill(); }  // tiny manic pupils
  // brows: thin, sharp
  for (const sx of [-1, 1]) {
    const ex = sx * 17;
    if (expr === 'scheme' || expr === 'laugh') tLine(c, [ex - sx * 10, -238, ex + sx * 11, -248], 3.6);
    else if (expr === 'fluster') tLine(c, [ex - sx * 10, -246, ex + sx * 10, -241], 3.4);
    else tCurve(c, ex - 11, -243, ex - sx * 2, -248, ex + 11, -244, 3.2);
  }
  // nose
  tLine(c, [3, -206, 0, -201], 2.6);
  // mouth (o.mouth = {a, shape} from the lip sync replaces the expression's mouth while she talks)
  const vTalk = o.mouth && o.mouth.a > .06 && expr !== 'laugh';
  if (expr === 'fluster') {
    c.fillStyle = 'rgba(255,80,110,.5)'; c.beginPath(); c.ellipse(-24, -204, 11, 6, 0, 0, 6.2832); c.ellipse(24, -204, 11, 6, 0, 0, 6.2832); c.fill();
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) tLine(c, [sx * (18 + k * 5), -200, sx * (22 + k * 5), -207], 2);
    tShape(c, '#9fe6ff', g => { g.moveTo(46, -246); g.quadraticCurveTo(54, -232, 50, -226); g.quadraticCurveTo(44, -222, 41, -230); g.quadraticCurveTo(40, -236, 46, -246); g.closePath(); }, 2.6);
  }
  if (vTalk) talkMouth(c, 1, -190, o.mouth.a, o.mouth.shape, .85);
  else if (expr === 'cool') { tCurve(c, -8, -189, 2, -188, 10, -192, 3); tCurve(c, -4, -185, 0, -183, 5, -185, 1.8, V.lips); }
  else if (expr === 'fluster') {
    c.beginPath(); c.moveTo(-10, -188); c.bezierCurveTo(-5, -193, -2, -184, 2, -188); c.bezierCurveTo(6, -192, 9, -186, 11, -188); c.lineWidth = 3.2; c.strokeStyle = TOON.ink; c.lineCap = 'round'; c.stroke();
  } else {
    const big = expr === 'laugh';
    const m = g => { g.moveTo(-16, -194); g.quadraticCurveTo(0, -189, 17, -196); g.quadraticCurveTo(10, big ? -170 : -178, 0, big ? -170 : -178); g.quadraticCurveTo(-10, big ? -172 : -180, -16, -194); g.closePath(); };
    tShape(c, '#4a1028', m, 3.2);
    c.save(); c.beginPath(); m(c); c.clip(); c.fillStyle = '#fff'; c.fillRect(-18, -199, 36, 7); c.fillStyle = '#ff7f97'; c.beginPath(); c.ellipse(0, big ? -172 : -179, 9, 5, 0, 0, 6.2832); c.fill(); c.restore();
    tShape(c, null, m, 3.2);
    if (big) for (const sx of [-1, 1]) { tLine(c, [sx * 48, -232, sx * 58, -238], 3); tLine(c, [sx * 48, -220, sx * 60, -220], 3); }
  }
  c.restore();
  // front hair: side part, swept bangs, one long lock on the right
  tShape(c, V.hair, g => { g.moveTo(44, -272); g.quadraticCurveTo(30, -294, -10, -292); g.quadraticCurveTo(-42, -286, -48, -250); clumps(g, [[-48, -250], [-44, -226], [-36, -250], [-27, -232], [-18, -254], [-2, -234], [6, -256], [26, -222], [30, -246], [46, -206]]); g.quadraticCurveTo(54, -244, 44, -272); g.closePath(); });
  tShape(c, V.hair, g => { g.moveTo(42, -250); g.quadraticCurveTo(54, -212, 46, -170); g.lineTo(40, -184); g.lineTo(36, -172); g.quadraticCurveTo(34, -210, 34, -238); g.closePath(); });
  tCurve(c, -30, -276, -10, -284, 14, -280, 3.4, V.hairL); tCurve(c, 38, -260, 44, -240, 44, -220, 2.6, V.hairL);
  // lime bar hairpin on the left
  tShape(c, LAB.glow, g => { g.save(); g.translate(-38, -258); g.rotate(-.5); g.roundRect(-12, -3, 24, 6, 3); g.restore(); }, 2.6);
  // o.goggles: lab goggles pulled down over the eyes
  if (o.goggles) {
    tLine(c, [-44, -228, -52, -236], 6); tLine(c, [44, -228, 52, -236], 6);
    for (const sx of [-1, 1]) { tShape(c, 'rgba(190,255,120,.55)', g => g.ellipse(sx * 18, -222, 17, 14, 0, 0, 6.2832), 4.4); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(sx * 18 - 6, -227, 5, 3, -.4, 0, 6.2832); c.fill(); }
    tLine(c, [-2, -222, 2, -222], 5);
  }
  // arms: one hand in the coat pocket; the other holds a glowing test tube (default), points (o.point: 0..1), rests (o.tube false),
  // holds a clipboard (o.clipboard), reaches to a local point (o.reachR = {x, y}); o.cheer raises both arms
  if (o.cheer) {
    for (const sx of [-1, 1]) { tTube(c, [sx * 64, -120, sx * 96, -150, sx * 92, -200, sx * 90, -228, sx * 86, -250], 23, LAB.coat, sx > 0 ? LAB.coatS : null); tHand(c, sx * 86, -262, 10, V.skin, V.skinS, true); }
    c.restore(); return;
  }
  if (o.armsDown) { hangingArms(c, o, 64, -120, 116, 24, LAB.coat, LAB.coatS, V.skin, V.skinS); c.restore(); return; }
  tTube(c, [-64, -120, -80, -70, -74, -10], 24, LAB.coat);
  if (o.clipboard) {
    tTube(c, [64, -120, 84, -76, 60, -70, 40, -72, 26, -84], 23, LAB.coat, LAB.coatS);
    c.save(); c.translate(10, -98); c.rotate(-.12); tShape(c, '#c9a24a', g => g.roundRect(-34, -44, 68, 88, 6), 3); tShape(c, '#fbf7ff', g => g.rect(-28, -34, 56, 72), 2);
    for (let i = 0; i < 5; i++) tLine(c, [-22, -24 + i * 12, 18 - (i % 2) * 10, -24 + i * 12], 1.6); tShape(c, '#7a8098', g => g.roundRect(-12, -50, 24, 10, 3), 2.4); c.restore();
    tHand(c, 26, -84, 9.5, V.skin, V.skinS);
  } else if (o.reachR) {
    const r = o.reachR, mx = (90 + r.x) / 2 + 6, my = (-80 + r.y) / 2; tTube(c, [64, -120, 90, -80, mx, my, (mx + r.x) / 2, (my + r.y) / 2, r.x + 4, r.y - 4], 23, LAB.coat, LAB.coatS);   // 11/8: the arm now reaches the hand (it stopped at the elbow) tHand(c, r.x, r.y, 9.5, V.skin, V.skinS);
  } else if (o.point) {
    const k = o.point, ex2 = 64 + 46 * k, ey2 = -120 - 70 * k, hx = 70 + 92 * k, hy = -96 - 150 * k;
    tTube(c, [64, -120, 64 + 30 * k + 10 * (1 - k), -112 - 30 * k, ex2, ey2, (ex2 + hx) / 2, (ey2 + hy) / 2, hx, hy], 23, LAB.coat, LAB.coatS);
    tHand(c, hx + 4, hy - 6, 9.5, V.skin, V.skinS, true);
  } else if (o.tube === false) {
    tTube(c, [64, -120, 80, -70, 74, -10], 24, LAB.coat, LAB.coatS);           // arm down at her side
  } else {
    tTube(c, [64, -120, 90, -90, 84, -62, 80, -100, 70, -126], 23, LAB.coat, LAB.coatS);
    c.save(); c.translate(66, -164); c.rotate(.18);
    c.shadowColor = LAB.glow; c.shadowBlur = 20; tShape(c, 'rgba(220,255,240,.6)', g => g.roundRect(-7, -34, 14, 50, 7), 3.4); c.restore();
    c.save(); c.translate(66, -164); c.rotate(.18); tShade(c, g => g.roundRect(-7, -34, 14, 50, 7), LAB.glow, g => g.rect(-10, -8, 20, 30)); tShape(c, null, g => g.roundRect(-7, -34, 14, 50, 7), 3.4); c.restore();
    tHand(c, 70, -134, 9, V.skin, V.skinS);
  }
  c.restore();
}

// ---------- Cleo (v2): deadpan, sleepy, presses the big red button to see what happens ----------
// o.expr: deadpan | sleepy | surprised | smug
function drawCleo2(c, x, y, s, o = {}) {
  const K = LAB2.cleo, expr = o.expr || 'deadpan';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  c.save(); c.translate(0, 22);
  const back = g => { g.moveTo(-50, -176); g.quadraticCurveTo(-60, -220, -50, -250); g.quadraticCurveTo(-40, -286, 0, -288); g.quadraticCurveTo(40, -286, 50, -250); g.quadraticCurveTo(60, -220, 50, -176); g.lineTo(42, -186); g.lineTo(38, -172); g.lineTo(30, -188); g.lineTo(-30, -188); g.lineTo(-38, -172); g.lineTo(-42, -186); g.closePath(); };
  tShape(c, K.hairS, back);
  c.restore();
  // tee + dark lab apron
  const torso = g => { g.moveTo(-54, 2); g.lineTo(-57, -100); g.bezierCurveTo(-57, -128, -38, -140, -16, -146); g.lineTo(16, -146); g.bezierCurveTo(38, -140, 57, -128, 57, -100); g.lineTo(54, 2); g.closePath(); };
  tShape(c, K.tee, torso); tShade(c, torso, '#dcd4ee', g => g.rect(28, -150, 30, 160));
  const apron = g => { g.moveTo(-40, 2); g.lineTo(-40, -70); g.lineTo(-28, -76); g.lineTo(-28, -104); g.lineTo(28, -104); g.lineTo(28, -76); g.lineTo(40, -70); g.lineTo(40, 2); g.closePath(); };
  tShape(c, K.apron, apron); tShade(c, apron, K.apronS, g => g.rect(20, -110, 30, 120));
  tLine(c, [-28, -104, -22, -144], 3.4); tLine(c, [28, -104, 22, -144], 3.4);
  tShape(c, K.apronS, g => g.rect(-20, -72, 40, 22), 3);
  tLine(c, [-12, -72, -10, -90], 4); tShape(c, '#e23b4a', g => g.rect(-14, -96, 7, 10), 2.4);   // screwdriver
  tLine(c, [8, -72, 10, -86], 3.4);
  // neck
  const neck = g => g.rect(-10, -168, 20, 26);
  tShape(c, K.skin, neck); tShade(c, neck, K.skinS, g => g.rect(-10, -168, 20, 10));
  tCurve(c, -16, -146, 0, -138, 16, -146, 3.4);
  c.save(); c.translate(0, 22);
  // face: rounder, younger
  const face = g => { g.moveTo(0, -268); g.bezierCurveTo(30, -268, 42, -250, 41, -228); g.bezierCurveTo(40, -206, 26, -184, 0, -176); g.bezierCurveTo(-26, -184, -40, -206, -41, -228); g.bezierCurveTo(-42, -250, -30, -268, 0, -268); g.closePath(); };
  tShape(c, K.skin, face);
  tShade(c, face, K.skinS, g => { g.moveTo(28, -274); g.bezierCurveTo(38, -238, 30, -200, 6, -170); g.lineTo(60, -170); g.lineTo(60, -274); g.closePath(); });
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) tLine(c, [sx * (20 + k * 5), -204, sx * (23 + k * 5), -210], 1.8, );
  c.save(); c.translate((o.turn || 0) * 12, 0); c.scale(1 - Math.abs(o.turn || 0) * .1, 1);   // 3/4 turn (bodies.js): the features slide toward where she faces
  // eyes: half-lidded
  const lid = { deadpan: .42, sleepy: .7, surprised: 0, smug: .5 }[expr] ?? .42;
  for (const sx of [-1, 1]) { if (o.blink) closedEye(c, sx * 17, -222, 11, false); else animeEye(c, sx * 17, -220, sx, { skin: K.skin, iris: K.iris, irisD: K.irisD, w: 12.5, h: 14, lid, look: o.look ?? (expr === 'smug' ? 2 * sx * -1 : 0) }); }
  // nose + mouth
  tLine(c, [2, -204, 0, -200], 2.4);
  if (o.mouth && o.mouth.a > .06) talkMouth(c, 0, -190, o.mouth.a * .75, o.mouth.shape, .75);   // she never opens her mouth much
  else if (expr === 'surprised') tEllipse(c, 0, -189, 3.6, 4.6, '#4a1028', 2.8);
  else if (expr === 'smug') tCurve(c, -5, -189, 2, -188, 7, -192, 2.8);
  else tLine(c, [-5, -189, 5, -189], 2.8);
  c.restore();
  // front hair: choppy blunt bangs, jaw-length side locks, one cowlick
  tShape(c, K.hair, g => { g.moveTo(47, -236); g.quadraticCurveTo(52, -284, 0, -286); g.quadraticCurveTo(-52, -284, -47, -236); clumps(g, [[-47, -236], [-42, -226], [-34, -250], [-26, -230], [-16, -252], [-6, -232], [2, -254], [12, -230], [20, -252], [30, -232], [38, -250], [47, -228]]); g.closePath(); });
  for (const sx of [-1, 1]) tShape(c, K.hair, g => { g.moveTo(sx * 42, -248); g.quadraticCurveTo(sx * 54, -214, sx * 48, -178); g.lineTo(sx * 42, -190); g.lineTo(sx * 39, -176); g.quadraticCurveTo(sx * 35, -206, sx * 35, -236); g.closePath(); });
  tShape(c, K.hair, g => { g.moveTo(-2, -285); g.quadraticCurveTo(4, -312, 22, -306); g.quadraticCurveTo(8, -302, 5, -285); g.closePath(); });
  tCurve(c, -28, -272, -8, -280, 14, -276, 3.2, K.hairL);
  // test-tube hair clip on the right
  c.save(); c.translate(38, -240); c.rotate(.5);
  tShape(c, '#fbf7ff', g => g.roundRect(-5, -14, 10, 28, 5), 2.6); tShade(c, g => g.roundRect(-5, -14, 10, 28, 5), LAB.glow, g => g.rect(-6, 0, 12, 16)); tShape(c, null, g => g.roundRect(-5, -14, 10, 28, 5), 2.6);
  c.restore();
  c.restore();
  // arms: lime gloves, a remote with a big red button
  if (o.armsDown) { hangingArms(c, o, 53, -118, 102, 19, K.tee, '#dcd4ee', K.glove, LAB.glowS); c.restore(); return; }
  if (o.reachL) { const r = o.reachL, mx = (-76 + r.x) / 2 - 4, my = (-76 + r.y) / 2 + 6; tTube(c, [-53, -118, -76, -76, mx, my, (mx + r.x) / 2, (my + r.y) / 2, r.x - 2, r.y - 4], 18, K.tee); }
  else tTube(c, [-53, -118, -70, -70, -50, -36, -36, -32, -22, -40], 18, K.tee);
  tTube(c, [53, -118, 70, -70, 50, -36, 36, -32, 22, -40], 18, K.tee, '#dcd4ee');
  if (o.remote !== false) {
    tShape(c, '#3a3350', g => g.roundRect(-20, -58, 40, 30, 7), 3.4);
    const pr = o.press || 0, by = -48 + 3 * pr;                                         // o.press 0..1: the button goes down
    c.save(); c.shadowColor = '#ff3355'; c.shadowBlur = 10 + 30 * pr; tShape(c, '#ff3355', g => g.ellipse(0, by, 11, 8 - 2 * pr, 0, 0, 6.2832), 3); c.restore();
    c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(-3, by - 3, 4, 2, 0, 0, 6.2832); c.fill();
  }
  tHand(c, o.reachL ? o.reachL.x : -20, o.reachL ? o.reachL.y : -40, 8.5, K.glove, LAB.glowS); tHand(c, 20, -40, 8.5, K.glove, LAB.glowS);
  if (o.press) tShape(c, K.glove, g => g.roundRect(4, -58 + 3 * o.press, 14, 9, 4), 3);   // right thumb on the button
  c.restore();
}

// ---------- Sterling Bright: the world's favourite billionaire. Gives everyone a free smart cap. Is actually taking over the world ----------
// o.expr: public (eyes-closed smile) | wink | true (eyes open, cold) | crack (smile breaking) ; (x, y) = podium top
const BRIGHT = { skin: '#f3cdb5', skinS: '#dda88f', hair: '#1f2440', hairS: '#141830', hairL: '#5d6aa8', suit: '#f7f8fc', suitS: '#cfd5e6', shirt: '#8fd3ff', gold: '#ffc83d', goldS: '#d89a12', iris: '#ffcf3d', irisD: '#b77400', sky: '#4fb8ff' };
function drawSun(c, x, y, r, fill, lw) {
  c.save(); c.translate(x, y);
  for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * Math.PI / 4); tShape(c, fill, g => { g.moveTo(-r * .22, -r * .78); g.lineTo(0, -r * 1.25); g.lineTo(r * .22, -r * .78); g.closePath(); }, lw); c.restore(); }
  tEllipse(c, 0, 0, r * .72, r * .72, fill, lw);
  c.restore();
}
function drawBrightCap(c, x, y, k, rot) {
  c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(k, k);
  tShape(c, BRIGHT.suit, g => { g.moveTo(-34, 0); g.bezierCurveTo(-34, -40, 34, -40, 34, 0); g.closePath(); });
  tShade(c, g => { g.moveTo(-34, 0); g.bezierCurveTo(-34, -40, 34, -40, 34, 0); g.closePath(); }, BRIGHT.suitS, g => g.rect(14, -40, 30, 40));
  tShape(c, BRIGHT.sky, g => { g.moveTo(-36, 0); g.quadraticCurveTo(0, 8, 50, 2); g.quadraticCurveTo(10, -6, -36, 0); g.closePath(); }, 3.4);
  c.save(); c.shadowColor = BRIGHT.gold; c.shadowBlur = 14; drawSun(c, 0, -16, 10, BRIGHT.gold, 2.4); c.restore();
  c.restore();
}
function drawBright(c, x, y, s, o = {}) {
  const B = BRIGHT, expr = o.expr || 'public';
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  // back hair
  tShape(c, B.hairS, g => { g.moveTo(-44, -214); g.quadraticCurveTo(-58, -268, -20, -296); g.quadraticCurveTo(30, -310, 52, -270); g.quadraticCurveTo(58, -240, 46, -206); g.lineTo(38, -220); g.lineTo(-36, -220); g.closePath(); });
  // tall frame: white suit, sky-blue open-collar shirt
  const torso = g => { g.moveTo(-70, 2); g.lineTo(-76, -110); g.bezierCurveTo(-76, -146, -50, -156, -18, -164); g.lineTo(18, -164); g.bezierCurveTo(50, -156, 76, -146, 76, -110); g.lineTo(70, 2); g.closePath(); };
  tShape(c, B.suit, torso); tShade(c, torso, B.suitS, g => g.rect(42, -170, 50, 180));
  tShape(c, B.shirt, g => { g.moveTo(-22, -164); g.lineTo(22, -164); g.lineTo(8, -96); g.lineTo(-8, -96); g.closePath(); });
  tShape(c, B.suit, g => { g.moveTo(-24, -164); g.lineTo(-8, -96); g.lineTo(-32, -118); g.lineTo(-48, -154); g.closePath(); }, 3.4);
  tShape(c, B.suitS, g => { g.moveTo(24, -164); g.lineTo(8, -96); g.lineTo(32, -118); g.lineTo(48, -154); g.closePath(); }, 3.4);
  tShape(c, B.shirt, g => { g.moveTo(-20, -166); g.lineTo(-5, -140); g.lineTo(-15, -132); g.lineTo(-28, -154); g.closePath(); }, 3);
  tShape(c, B.shirt, g => { g.moveTo(20, -166); g.lineTo(5, -140); g.lineTo(15, -132); g.lineTo(28, -154); g.closePath(); }, 3);
  drawSun(c, -46, -118, 7, B.gold, 2.2);
  const neck = g => g.rect(-11, -192, 22, 32);
  tShape(c, B.skin, neck); tShade(c, neck, B.skinS, g => g.rect(-11, -192, 22, 12));
  tEllipse(c, -38, -226, 6.5, 10.5, B.skin); tEllipse(c, 38, -226, 6.5, 10.5, B.skin);
  // face: long, defined jaw
  const face = g => { g.moveTo(0, -276); g.bezierCurveTo(27, -276, 38, -260, 38, -236); g.bezierCurveTo(38, -214, 32, -198, 18, -184); g.quadraticCurveTo(8, -176, 0, -175); g.quadraticCurveTo(-8, -176, -18, -184); g.bezierCurveTo(-32, -198, -38, -214, -38, -236); g.bezierCurveTo(-38, -260, -27, -276, 0, -276); g.closePath(); };
  tShape(c, B.skin, face);
  tShade(c, face, B.skinS, g => { g.moveTo(24, -282); g.bezierCurveTo(36, -242, 30, -202, 6, -172); g.lineTo(60, -172); g.lineTo(60, -282); g.closePath(); });
  // eyes
  for (const sx of [-1, 1]) {
    const ex = sx * 16, ey = -226;
    const closed = expr === 'public' || expr === 'crack' || (expr === 'wink' && sx > 0);
    if (closed) { tCurve(c, ex - 10, ey + 1, ex, ey - 7, ex + 10, ey + 1, 3.8); tLine(c, [ex + sx * 10, ey + 1, ex + sx * 13, ey - 2], 3); }
    else animeEye(c, ex, ey, sx, { skin: B.skin, iris: B.iris, irisD: B.irisD, w: 11.5, h: 10.5, lid: expr === 'true' ? .38 : .1 });
    if (expr === 'true') tLine(c, [ex - sx * 11, -236, ex + sx * 12, -244], 3.8);
    else if (expr === 'crack') tLine(c, [ex - sx * 11, -244, ex + sx * 12, -240], 3.6);
    else tCurve(c, ex - 11, -241, ex, -247, ex + 12, -242, 3.4);
  }
  if (expr === 'crack') { tLine(c, [32, -258, 36, -266], 2.6); tLine(c, [38, -254, 44, -258], 2.6); tShape(c, '#9fe6ff', g => { g.moveTo(-44, -250); g.quadraticCurveTo(-36, -236, -40, -230); g.quadraticCurveTo(-46, -226, -49, -234); g.quadraticCurveTo(-50, -240, -44, -250); g.closePath(); }, 2.4); }
  tLine(c, [3, -210, 0, -204], 2.6);
  // smile: thin, confident, a strip of perfect teeth
  if (expr === 'true') tLine(c, [-9, -191, 9, -191], 3);
  else {
    const m = g => { g.moveTo(-15, -195); g.quadraticCurveTo(0, -190, 15, -196); g.quadraticCurveTo(8, -184, 0, -184); g.quadraticCurveTo(-8, -184, -15, -195); g.closePath(); };
    tShape(c, '#fff', m, 2.8);
    if (expr === 'crack') { c.strokeStyle = TOON.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -193); c.lineTo(-1, -188); c.lineTo(-5, -185); c.stroke(); }
    if (expr !== 'crack') drawStar(c, 21, -200, 5.5, '#fffbe0', 1.8);
  }
  // swept-back hair with one loose strand
  tShape(c, B.hair, g => { g.moveTo(-40, -234); g.quadraticCurveTo(-48, -282, -6, -298); g.quadraticCurveTo(40, -306, 50, -262); g.lineTo(44, -240); g.quadraticCurveTo(40, -256, 30, -262); clumps(g, [[30, -262], [20, -254], [10, -268], [-4, -258], [-14, -270], [-30, -250], [-40, -234]]); g.closePath(); });
  tShape(c, B.hair, g => { g.moveTo(-6, -266); g.quadraticCurveTo(-14, -250, -10, -232); g.quadraticCurveTo(-4, -246, 2, -262); g.closePath(); }, 3.4);
  tCurve(c, -28, -278, -4, -294, 28, -288, 3.4, B.hairL); tCurve(c, -20, -268, 4, -282, 26, -276, 2.4, B.hairL);
  if (o.arms !== false) {
    tTube(c, [-72, -128, -98, -100, -102, -144, -104, -170, -102, -188], 22, B.suit);
    tHand(c, -102, -200, 10.5, B.skin, B.skinS, true);
    tTube(c, [72, -128, 94, -88, 90, -50, 86, -42, 68, -46], 22, B.suit, B.suitS);
    drawBrightCap(c, 64, -56, 1.05, -.12);
    tHand(c, 66, -46, 9.5, B.skin, B.skinS);
  }
  c.restore();
}
// a BrightSide staff member: identical smile, identical cap
function drawBrightsider(c, x, y, s) {
  const B = BRIGHT;
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  const torso = g => { g.moveTo(-58, 2); g.lineTo(-60, -96); g.bezierCurveTo(-60, -124, -40, -134, -14, -140); g.lineTo(14, -140); g.bezierCurveTo(40, -134, 60, -124, 60, -96); g.lineTo(58, 2); g.closePath(); };
  tShape(c, B.sky, torso); tShade(c, torso, '#2f94dc', g => g.rect(30, -150, 40, 160));
  drawSun(c, -28, -96, 9, B.gold, 2.2);
  const neck = g => g.rect(-11, -176, 22, 40); tShape(c, B.skin, neck);
  const face = g => g.ellipse(0, -222, 38, 46, 0, 0, 6.2832);
  tShape(c, B.skin, face); tShade(c, face, B.skinS, g => g.ellipse(26, -212, 20, 44, -.2, 0, 6.2832));
  for (const sx of [-1, 1]) tCurve(c, sx * 16 - 10, -226, sx * 16, -235, sx * 16 + 10, -226, 4.6);
  tShape(c, '#fff', g => { g.moveTo(-18, -198); g.quadraticCurveTo(0, -193, 18, -199); g.quadraticCurveTo(10, -182, 0, -182); g.quadraticCurveTo(-10, -182, -18, -198); g.closePath(); }, 3.2);
  drawBrightCap(c, 0, -254, 1.25, 0);
  c.restore();
}
