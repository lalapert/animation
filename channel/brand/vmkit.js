// Void Mart episode kit: the store set, cameras, lip sync, blinks, subtitles and glass, shared by every episode.
// Needs toon.js, plus window.TL (timeline) and window.CHARS (per-line character timings) from the episode's timeline.js.
'use strict';
const W = 1080, H = 1920;
const CT = 1290;                                  // counter top (world y)
const PIP = { x: 330, s: 190 }, RAE = { x: 740, s: 190 }, MAGS = { x: 540, y: 112, s: 170 };
const PIPFACE = CT - 176 * PIP.s / 100, RAEFACE = CT - 222 * RAE.s / 100, MAGSY = MAGS.y + 54 * MAGS.s / 100;
const BOARD = { x: 200, y: 372 };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const STATIC = {};

// standard cameras: [centre x, centre y, zoom at shot start, zoom at shot end] in world coordinates
const VMCAM = {
  WIDE: [540, 1000, 1.18, 1.22],
  PIP_CU: [PIP.x, PIPFACE + 95, 2.15, 2.28],
  RAE_MED: [RAE.x - 20, RAEFACE + 165, 1.55, 1.6],
  RAE_CU: [RAE.x, RAEFACE + 85, 2.35, 2.55],
  MAGS_CU: [MAGS.x, MAGSY + 30, 3.0, 3.15],
  BOARD: [BOARD.x, BOARD.y + 40, 2.9, 3.05],
};

// ---------------------------------------------------------------- lip sync and blinks
function mouthFor(who, t) {
  for (const v of TL.VO) {
    if (v.who !== who || t < v.t - .02 || t > v.t + v.dur + .05) continue;
    const lt = t - v.t, ch = CHARS[v.id];
    let a = 0, shape = 'e';
    for (const [ck, t0, t1] of ch) {
      if (t1 < lt - .05 || t0 > lt + .03) continue;
      const l = ck.toLowerCase();
      let o = 0, s = 'e';
      if ('ao'.includes(l)) { o = 1; s = l === 'o' ? 'o' : 'a'; }
      else if (l === 'u' || l === 'w') { o = .7; s = 'o'; }
      else if ('eiy'.includes(l)) { o = .65; s = 'e'; }
      else if ('mbp'.includes(l)) o = 0;
      else if ('fv'.includes(l)) o = .2;
      else if (/[a-z]/.test(l)) o = .35;
      if (o > a) { a = o; shape = s; }
    }
    return { a, shape };
  }
  return null;
}
const talkLevel = (who, t) => { const m = mouthFor(who, t); return m ? m.a : 0; };
function blinkAt(seed, t) { const p = 3.1 + seed * .7, f = ((t + seed * 1.37) % p) / p; return f < .04; }
const speaking = (who, t) => { const m = mouthFor(who, t); return !!(m && m.a > .06); };

// ---------------------------------------------------------------- the store, seen from outside the front window
function buildStore() {
  const b = document.createElement('canvas'); b.width = W; b.height = H;
  const g = b.getContext('2d');
  const wg = g.createLinearGradient(0, 0, 0, CT); wg.addColorStop(0, '#2a1858'); wg.addColorStop(1, '#3a2270'); g.fillStyle = wg; g.fillRect(0, 0, W, CT);
  g.fillStyle = '#1e1044'; g.fillRect(0, 0, W, 96);
  for (const x of [120, 760]) { g.save(); g.shadowColor = '#fff6d6'; g.shadowBlur = 40; tShape(g, '#fffbea', gg => gg.roundRect(x, 118, 200, 18, 9), 3); g.restore(); }
  const items = ['#ff7a1a', '#29d3c3', '#ffd23f', '#ff4fa3', '#b9a6ff', '#7ef0ff', '#8fd65a'];
  for (const [x0, x1] of [[0, 230], [850, W]]) {
    g.fillStyle = '#24124a'; g.fillRect(x0, 470, x1 - x0, CT - 470);
    for (let r = 0; r < 5; r++) {
      tShape(g, '#4a3192', gg => gg.rect(x0 + 6, 620 + r * 140, x1 - x0 - 12, 14), 3);
      for (let i = 0; (i + 1) * 48 < x1 - x0; i++) { const hh = 44 + ((i * 7 + r * 3 + x0) % 4) * 14; tShape(g, items[(i + r + (x0 ? 3 : 0)) % 7], gg => gg.roundRect(x0 + 14 + i * 48, 620 + r * 140 - hh, 38, hh, 5), 3); }
    }
  }
  tShape(g, '#fbf7ff', gg => gg.roundRect(BOARD.x - 150, BOARD.y - 52, 300, 104, 10), 4);
  tText(g, 'DAYS SINCE LAST INCIDENT', BOARD.x, BOARD.y - 24, 19, TOON.ink);
  tShape(g, '#c9a24a', gg => gg.rect(780, 250, 200, 220), 4); tShape(g, '#2b1858', gg => gg.rect(796, 266, 168, 160), 3);
  drawMags(g, 880, 300, 90);
  tShape(g, '#fbf7ff', gg => gg.rect(796, 432, 168, 26), 2.4); tText(g, 'EMPLOYEE OF THE MONTH', 880, 446, 13, TOON.ink);
  tShape(g, '#4a2c8a', gg => gg.rect(470, 560, 140, CT - 560), 4); tShape(g, '#fbf7ff', gg => gg.rect(490, 610, 100, 30), 2.4); tText(g, 'STAFF ONLY', 540, 626, 15, TOON.ink);
  STATIC.store = b;
  const f = document.createElement('canvas'); f.width = W; f.height = H - CT; const h = f.getContext('2d');
  tShape(h, TOON.orange, gg => gg.rect(-10, 0, W + 20, 40), 5);
  h.fillStyle = '#3a2470'; h.fillRect(-10, 42, W + 20, H);
  h.strokeStyle = 'rgba(0,0,0,.25)'; h.lineWidth = 4; for (let x = 60; x < W; x += 240) { h.beginPath(); h.moveTo(x, 60); h.lineTo(x, H); h.stroke(); }
  STATIC.front = f;
}
function drawRegister(g, candy = true) {
  tShape(g, '#5b5f78', gg => gg.roundRect(900, CT - 110, 150, 110, 10), 4);
  tShape(g, '#1a2a3a', gg => gg.roundRect(916, CT - 96, 118, 50, 6), 3);
  tText(g, '$0.00', 975, CT - 70, 26, '#7ef0ff', '"Bungee"', 'center', 400);
  if (candy) { tShape(g, '#ffd23f', gg => gg.roundRect(640, CT - 26, 80, 26, 5), 3); tText(g, 'CHOCO', 680, CT - 12, 13, TOON.ink); }
}
// the incident counter: shows `from` until flipT, then flips to `to`
function drawBoardNumber(g, t, from, to, flipT) {
  const k = flipT == null ? 0 : clamp((t - flipT) / .35);
  const x = BOARD.x, y = BOARD.y + 18, w = 64, h = 46;
  tShape(g, '#e23b4a', gg => gg.roundRect(x - w / 2, y - h / 2, w, h, 6), 3);
  const num = String(k < .5 ? from : to), sy = Math.abs(Math.cos(k * Math.PI));
  g.save(); g.translate(x, y); g.scale(1, Math.max(.05, sy)); tText(g, num, 0, 2, 38, '#fff', '"Bungee"', 'center', 400); g.restore();
  tLine(g, [x - w / 2 + 3, y, x + w / 2 - 3, y], 2);
}

// ---------------------------------------------------------------- space and glass
function drawSpace(g, t, zoom, cx, cy) {
  const gr = g.createRadialGradient(cx, cy, 10, cx, cy, 1300 * zoom); gr.addColorStop(0, '#ffcf8a'); gr.addColorStop(.05, '#ff6a3d'); gr.addColorStop(.16, '#c42f8a'); gr.addColorStop(.38, '#3d1a7a'); gr.addColorStop(1, '#0a0620');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.translate(cx, cy); g.rotate(t * .25);
  for (let i = 0; i < 5; i++) {
    g.rotate(Math.PI * 2 / 5); g.beginPath();
    for (let k = 0; k <= 60; k++) { const r = (60 + k * 16) * zoom, a = k * .09; const x = Math.cos(a) * r, y = Math.sin(a) * r * .55; k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = `rgba(255,${140 + i * 20},${120 + i * 15},.22)`; g.lineWidth = 26 * zoom; g.lineCap = 'round'; g.stroke();
  }
  g.restore();
  g.save(); g.translate(cx, cy); g.beginPath(); g.arc(0, 0, 70 * zoom, 0, 6.2832); g.fillStyle = '#05020c'; g.fill(); g.lineWidth = 8 * zoom; g.strokeStyle = '#ffd08a'; g.stroke(); g.restore();
  drawStars(g, W, H, 220, 4);
}
function glassStreaks(g, a) {
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'screen';
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.42, 'rgba(255,255,255,0)'); gr.addColorStop(.47, 'rgba(255,255,255,.12)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(.62, 'rgba(255,255,255,0)'); gr.addColorStop(.64, 'rgba(255,255,255,.08)'); gr.addColorStop(.66, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .45, H * .75); vg.addColorStop(0, 'rgba(120,60,200,0)'); vg.addColorStop(1, 'rgba(120,60,200,.18)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.restore();
}

// ---------------------------------------------------------------- subtitles (speaker colours from the timeline), shots, camera
function subtitle(g, t) {
  for (const v of TL.VO) {
    if (t < v.s0 || t > v.s1) continue;
    const ls = v.sub.split('\n'), y1 = 1470;
    const a = clamp((t - v.s0) / .08) * clamp((v.s1 - t) / .08);
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    // keep every line inside x 120..960: the Reels/Shorts button rail covers the right edge (11/8). Long lines shrink, never wrap.
    let size = 62; g.font = `600 ${size}px "Fredoka"`;
    while (size > 46 && ls.some(s => g.measureText(s).width > 840)) { size -= 4; g.font = `600 ${size}px "Fredoka"`; }
    const lh = Math.round(size * 1.23);
    ls.forEach((s, i) => { const y = y1 - (ls.length - 1 - i) * lh; g.lineWidth = 12; g.strokeStyle = '#120a2a'; g.strokeText(s, W / 2, y); g.fillStyle = v.col; g.fillText(s, W / 2, y); });
    g.restore();
  }
}
function shotAt(t) { for (const s of TL.SHOTS) if (t >= s[1] && t < s[2]) return s; return TL.SHOTS[TL.SHOTS.length - 1]; }
function applyCam(g, cam, sk, shake = 0) {
  const [cx, cy, z0, z1] = cam, z = lerp(z0, z1, ease(sk));
  g.setTransform(z, 0, 0, z, 540 - cx * z + shake, 960 - cy * z);
  return z;
}
// world → screen for the current camera (for screen-space props that follow world points)
function toScreen(cam, sk, x, y) { const [cx, cy, z0, z1] = cam, z = lerp(z0, z1, ease(sk)); return [540 + (x - cx) * z, 960 + (y - cy) * z, z]; }
const vmShotsFrom = n => TL.SHOTS.filter(s => s[0] === n).map(s => s[1]);

// ---------------------------------------------------------------- frame layout: picture on top, subtitle band below
// Default (owner's choice, 11/7): the full picture with subtitles burned in at the bottom, as in episode 1's first cut.
// Alternative 'band': the frame shows scene rows VIEW.off..VIEW.off+VIEW.h at the top and the subtitles in a dark band underneath.
const VIEW = { mode: 'full', off: 240, h: 1360, band: '#0d0720' };   // mode 'band' puts the subtitles in a band under the picture
function wrapLines(g, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    let cur = '';
    for (const w of para.split(' ')) { const tryS = cur ? cur + ' ' + w : w; if (g.measureText(tryS).width > maxW && cur) { out.push(cur); cur = w; } else cur = tryS; }
    if (cur) out.push(cur);
  }
  return out;
}
function bandSubtitle(g, t) {
  for (const v of TL.VO) {
    if (t < v.s0 || t > v.s1) continue;
    const text = v.sub.replace(/\n/g, ' ');
    let size = 58, ls;
    g.font = `600 ${size}px "Fredoka"`;
    const manual = v.sub.split('\n');
    if (manual.length <= 2 && manual.every(s => g.measureText(s).width <= 1000)) ls = manual;   // the script's own line breaks, when they fit
    else for (; size >= 44; size -= 4) { g.font = `600 ${size}px "Fredoka"`; ls = wrapLines(g, text, 1000); if (ls.length <= 2) break; }
    const a = clamp((t - v.s0) / .08) * clamp((v.s1 - t) / .08), lh = size * 1.22, cy = VIEW.h + 112;
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    ls.forEach((s, i) => { const y = cy + (i - (ls.length - 1) / 2) * lh; g.lineWidth = 10; g.strokeStyle = '#05020c'; g.strokeText(s, W / 2, y); g.fillStyle = v.col; g.fillText(s, W / 2, y); });
    g.restore();
  }
}
function composeFrame(out, scene, t) {
  out.setTransform(1, 0, 0, 1, 0, 0);
  if (VIEW.mode === 'full') { out.drawImage(scene, 0, 0); subtitle(out, t); return; }   // full picture, subtitles burned in at the bottom
  out.fillStyle = VIEW.band; out.fillRect(0, 0, W, H);
  out.drawImage(scene, 0, VIEW.off, W, VIEW.h, 0, 0, W, VIEW.h);
  out.fillStyle = 'rgba(255,255,255,.08)'; out.fillRect(0, VIEW.h, W, 3);
  bandSubtitle(out, t);
}

// ---------------------------------------------------------------- end card (owner, 11/9): the cast and "NEW EPISODE EVERY DAY"
// The last 1.25 s, at the top of the frame (inside the Shorts/Reels safe zone, clear of the subtitles at the bottom).
// show: 'vm' (Rae, Pip, MAGS) or 'vl' (Vera, Cleo; needs lab.js). The two shows alternate daily on the channel, so the small
// line names tomorrow's show. Call it last in render(): endCard(OUT, t, 'vm').
// owner 11/13: the card stays 2-3 s. Episodes set TL.ENDCARD (seconds, e.g. 2.5) and add the extra time as a held tail after the
// button (DUR + ENDCARD - 1.25), so the button still lands before the card; episodes without it keep the old 1.25 s.
function endCard(g, t, show) {
  const t0 = TL.DUR - (TL.ENDCARD || 1.25), a = clamp((t - t0) / .15); if (a <= 0) return;
  const pop = 1 + .08 * Math.sin(Math.PI * clamp((t - t0) / .3)), vl = show === 'vl';
  const acc = vl ? '#d8ff7a' : TOON.orangeL, x0 = 130, y0 = 230, w = 820, h = 360;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  g.translate(540, y0 + h / 2); g.scale(pop, pop); g.translate(-540, -(y0 + h / 2));
  tShape(g, 'rgba(18,10,42,.92)', gg => gg.roundRect(x0, y0, w, h, 30), 5);
  const cast = vl ? [['vera', 0], ['cleo', 1]] : [['pip', 0], ['rae', 1], ['mags', 2]];
  const n = cast.length, r = 72, gap = 190, cy = y0 + 104;
  cast.forEach(([who], i) => {
    const cx = 540 + (i - (n - 1) / 2) * gap;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.fillStyle = vl ? '#2c4a3a' : '#3a2470'; g.fill(); g.clip();
    const blink = false;
    if (who === 'pip') drawPip2(g, cx, cy + 176 * 1.25 + 34, 125, { expr: 'grin', arms: false, blink });
    else if (who === 'rae') drawRae2(g, cx + 4, cy + 222 * 1.15 + 30, 115, { expr: 'smirk', arms: false, look: 0, blink });
    else if (who === 'mags') drawMags(g, cx - 10, cy - 100, 175, { glow: 30 });
    else if (who === 'vera') drawVera2(g, cx, cy + 222 * 1.15 + 36, 115, { expr: 'scheme', arms: false, blink });
    else if (who === 'cleo') drawCleo2(g, cx, cy + 200 * 1.2 + 34, 120, { expr: 'deadpan', arms: false, blink });
    g.restore();
    g.lineWidth = 5; g.strokeStyle = TOON.ink; g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.stroke();
    g.lineWidth = 3; g.strokeStyle = acc; g.beginPath(); g.arc(cx, cy, r - 5, 0, 6.2832); g.stroke();
  });
  tText(g, 'NEW EPISODE EVERY DAY', 540, y0 + 232, 52, '#fbf7ff', '"Bungee"', 'center', 400);
  tText(g, 'TOMORROW: ' + (vl ? 'VOID MART' : 'VOLT LABS'), 540, y0 + 302, 36, acc, '"Bungee"', 'center', 400);
  g.restore();
}
