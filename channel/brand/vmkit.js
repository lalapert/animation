// Void Mart episode kit: the store set, cameras, lip sync, blinks, subtitles and glass, shared by every episode.
// Needs toon.js, plus window.TL (timeline) and window.CHARS (per-line character timings) from the episode's timeline.js.
//
// ---------------------------------------------------------------- LOOK 2: how to use it (from Void Mart 14 and Volt Labs 14 on)
// Same characters, outfits and style; more life, staging and light. Opt-in: banked episodes (no TL.LOOK) render exactly as before.
//  1. Turn it on: in tools/timeline.py put "LOOK": 2 into TL (or add ?look=2 to the page URL for a test). Nothing else is needed
//     for the cast to act and be lit: drawPip2, drawRae2, drawMags, drawDennis (toon.js), drawVera2, drawCleo2 (lab.js) are wrapped.
//     The frame clock comes from shotAt(t); an episode that does not call shotAt(t) calls look2Frame(t) first in render(t).
//  2. Motion (automatic): breathing on everyone, an idle sway, the speaker leans toward the listener with a pop on the first word
//     and seeded accents, the head lags the torso (overlap), hair tips and Rae's hoodie strings lag the head, eye darts and
//     blinks on a seeded random clock (blinkAt(seed, t) switches to it), MAGS swings on his mount. Hands on props (hold, reachL/R,
//     mug, clipboard, point, press) keep the torso nearly still, and reach targets stay where the episode put them.
//     Big reactions are cues: TL.ACT = [[who, t, kind, amount = 1, hold = .8], ...] with kind pop (surprise: anticipation, stretch,
//     overshoot, settle), lean (in, toward the other), back (recoil), slump (sigh), shrug, nod, shake, turn (amount -1..1), tilt.
//     who = the TL.VO speaker id; another rig of the same function (Evil Vera) passes o.who: 'EVIL_VERA'. K2.act scales all motion
//     (0 = still). o.look2 = false draws one call exactly as Look 1.
//  3. Staging: SHOT2 builds cameras for CAM from the cast's face positions:
//       SHOT2.cu('RAE')               close-up, face 45% of the frame width   SHOT2.med('PIP')        medium
//       SHOT2.two('PIP', 'RAE')        two-shot                                 SHOT2.insert(x, y, w)    insert of a prop w wide
//       SHOT2.ots('PIP', 'RAE')        over Pip's blurred shoulder onto Rae (register: CAM.X = SHOT2.fx('X', SHOT2.ots(...)))
//       SHOT2.angle(cam, -1 | 1)       slight low / high angle (camera drops / rises, zoom +4%)
//       SHOT2.push(cam, .12)           push-in over the shot, for a punchline
//     options: {fill, eyeAt, dx, push, angle: 'low'|'high'}; SHOT2.extra.DENNIS = [x, eyeY, s, faceWidthUnits] adds a face.
//     SHOT2.fx(name, cam, {fg: (g, t) => ..., blur}) also draws a blurred foreground prop (screen space) on that shot.
//     lintShots() warns (console + window.SHOT_WARN) when more than two cuts in a row share a framing; run
//     node channel/tools/shotlint.cjs <episode dir> before rendering.
//  4. Light and depth (automatic, K2.LIGHT.vm / .vl): one cel tone on each figure's side away from the key light (key, shade,
//     band), one thin directional rim per figure from the set's light on its side (store: sign side pink, fridge side cyan; lab:
//     the window), only on edges facing that light and fading down the figure, an ambient tint and a top-to-bottom falloff on the cast,
//     soft contact shadows where the cast meets the counter/bench and under the register, a light vignette, and the back set
//     hazed a little (haze) so the cast has more contrast than the set. Tune per episode by editing K2.LIGHT.vm/.vl fields in film.js.
//     Before/after: node channel/tools/look2_sample.cjs <episode dir> t0 t1 <out prefix> [--inject staging.js] [--stills ...]
//  5. Safety (owner 11/22: no loose arms, no misplaced eyes, ever). Hard limits in K2LIM: the lean is a shear about the resting
//     hands' height (K2CAST.handY), so hands on the counter cannot slide; no sideways squash; lean <= .09, head tilt <= .14 rad,
//     squash/stretch <= 7%, head shift <= 3 units sideways and only as far up as the chin still covers the neck (in Look 2 the neck
//     rect also runs 10 units up behind the face), 3/4 turn from cues <= .6; hands on props the episode or counter holds (hold,
//     reach, mug, clipboard, point, press) freeze the torso; reach targets are corrected exactly and the torso leans less if the arm
//     would stretch over 4%; pupils (look + dart) are clamped to .42 of the eye width (l2Look in toon.js).
//     Before rendering a Look 2 episode run the machine check, which must exit 0:
//       node channel/tools/look2_audit.cjs <episode dir> [--act 1.5] [--step 2] [--inject cues.js] [--sheets]
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
// Look 2 state (see the how-to at the top). K2.on is false for every episode that does not set TL.LOOK = 2.
const K2 = {
  on: !!((window.TL && TL.LOOK === 2) || (typeof location !== 'undefined' && /[?&]look=2(&|$)/.test(location.search))),
  t: 0, ticked: false, busy: 0, contacts: [], layers: new Map(), shotFx: {}, angle: 0, set: null,
  act: 1,                                        // acting strength: 0 = still (Look 1 poses), 1 = default, up to ~1.5 for broad scenes
  audit: false, auditLog: [], auditRigs: [], auditEp: null,
  // per show: key light direction (toward the light), cel tone (shade, band units), falloff, ambient tint; rims = one directional
  // rim per figure, picked by which side of the set it stands on ([direction toward the light, colour, alpha]); rimW = rim width
  // in rig units, clamped to 2-4 screen px, drawn just inside the outline (ink units); contact shadow alpha; haze on the back set
  LIGHT: {
    vm: { key: [-.55, -.83], shade: '#c4b6ea', band: 8, fall: .13, amb: ['#5a2ca0', .045], ink: 4.2, rimW: .8,
      rims: { left: [[-.85, -.5], '#ff86c8', .34], right: [[.85, -.5], '#86f2ff', .4] },          // sign side pink, fridge side cyan
      vig: .34, contact: .42, haze: ['#2a1858', .2], pop: 'saturate(1.1) contrast(1.05)' },
    vl: { key: [-.55, -.83], shade: '#c3cbdb', band: 8, fall: .12, amb: ['#2c5a3a', .04], ink: 4.2, rimW: .8,
      rims: { left: [[.7, -.72], '#e4f2ff', .3], right: [[.7, -.72], '#e4f2ff', .3] },               // the window (upper right), daylight
      vig: .3, contact: .4, haze: ['#12302a', .18], pop: 'saturate(1.08) contrast(1.05)' },
  },
};
// Look 2: lower the back set's contrast a little (a haze of the set's own dark), so the cast reads in front of it
function k2Haze(canvas, h = null) { if (!K2.on || !canvas) return; const Lt = K2.LIGHT[K2.set || (typeof buildLab === 'function' ? 'vl' : 'vm')], [col, a] = h || Lt.haze, g = canvas.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, canvas.width, canvas.height); g.restore(); }
if (K2.on && typeof location !== 'undefined') {    // test switches: ?look=2&audit=1 (measure, see look2_audit.cjs), &act=1.5
  K2.audit = /[?&]audit=1(&|$)/.test(location.search);
  const ma = location.search.match(/[?&]act=([0-9.]+)/); if (ma) K2.act = +ma[1];
}
// Look 2 episodes that do not call shotAt(t) each frame call this first in render(t)
function look2Frame(t) { if (K2.on) k2Tick(t); }

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
function blinkAt(seed, t) { if (K2.on) return k2Blink(seed, t); const p = 3.1 + seed * .7, f = ((t + seed * 1.37) % p) / p; return f < .04; }
const speaking = (who, t) => { const m = mouthFor(who, t); return !!(m && m.a > .06); };

// ---------------------------------------------------------------- the store, seen from outside the front window
function buildStore() {
  K2.busy++;
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
  k2Haze(b);
  STATIC.store = b;
  const f = document.createElement('canvas'); f.width = W; f.height = H - CT; const h = f.getContext('2d');
  tShape(h, TOON.orange, gg => gg.rect(-10, 0, W + 20, 40), 5);
  h.fillStyle = '#3a2470'; h.fillRect(-10, 42, W + 20, H);
  h.strokeStyle = 'rgba(0,0,0,.25)'; h.lineWidth = 4; for (let x = 60; x < W; x += 240) { h.beginPath(); h.moveTo(x, 60); h.lineTo(x, H); h.stroke(); }
  STATIC.front = f;
  K2.busy--;
}
function drawRegister(g, candy = true) {
  if (K2.on) k2Contact(g, 975, CT, 92, 12, k2Light().contact * .8);
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
function shotAt(t) { if (K2.on) k2Tick(t); for (const s of TL.SHOTS) if (t >= s[1] && t < s[2]) return s; return TL.SHOTS[TL.SHOTS.length - 1]; }
function applyCam(g, cam, sk, shake = 0) {
  const [cx, cy, z0, z1] = cam, z = lerp(z0, z1, ease(sk));
  g.setTransform(z, 0, 0, z, 540 - cx * z + shake, 960 - cy * z);
  if (K2.on) { K2.angle = cam.angle || 0; k2HookCtx(g); }
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
  if (K2.on) k2Post(scene.getContext('2d'), t);
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
  K2.busy++;                                      // the card's portraits stay in Look 1
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
  K2.busy--;
  tText(g, 'NEW EPISODE EVERY DAY', 540, y0 + 232, 52, '#fbf7ff', '"Bungee"', 'center', 400);
  tText(g, 'TOMORROW: ' + (vl ? 'VOID MART' : 'VOLT LABS'), 540, y0 + 302, 36, acc, '"Bungee"', 'center', 400);
  // Owner 11/16 (comments): the episode's two-choice question under the card, e.g. TL.ASK = 'TEAM PIP OR TEAM MAGS?'.
  // Same words as the caption's first line and the first comment; it shrinks to fit 740 px.
  if (TL.ASK) {
    const ay = y0 + h + 22, ah = 112, s = String(TL.ASK).toUpperCase();
    tShape(g, acc, gg => gg.roundRect(x0 + 40, ay, w - 80, ah, ah / 2), 5);
    g.font = '400 46px "Bungee"'; const tw = g.measureText(s).width, size = Math.floor(46 * Math.min(1, 680 / tw));
    tText(g, s, 540, ay + ah / 2 - 4, size, TOON.ink, '"Bungee"', 'center', 400);
    // 11/19: a dark backing so the hint reads on bright sets too (VL11's store shelves)
    g.fillStyle = 'rgba(18,10,42,.88)'; g.beginPath(); g.roundRect(540 - 132, ay + ah + 14, 264, 40, 20); g.fill();
    tText(g, 'COMMENT BELOW', 540, ay + ah + 34, 26, '#fbf7ff', '"Bungee"', 'center', 400);
  }
  g.restore();
}

// ================================================================ LOOK 2 (opt-in, from Void Mart 14 and Volt Labs 14 on) ================
// See the how-to at the top of this file. Everything below is inert unless K2.on (TL.LOOK === 2, or ?look=2 in the page URL).
// who (TL.VO speaker id); pivot = neck pivot of the head group (local units); handY = resting-hand height (lean/squash pivot); box = drawing box (x0, y0, x1, y1; y1 covers armsDown
// hands); neck = [top y, half width] of the neck rect and chin = lowest face y (the head may rise only while the chin still overlaps
// the neck); face = the face outline (for the audit's neck-cover test); shoulders = arm roots (for episode-drawn arms)
const K2CAST = {
  drawPip2: { who: 'PIP', pivot: -128, handY: -13, box: [-125, -265, 125, 140], neck: [-136, 10], chin: -131, shoulders: [[-52, -88], [52, -88], [50, -92]],
    face: [0, -222, 30, -222, 45, -204, 45, -180, 45, -158, 30, -138, 0, -131, -30, -138, -45, -158, -45, -180, -45, -204, -30, -222, 0, -222] },
  drawRae2: { who: 'RAE', pivot: -178, handY: -21, box: [-125, -335, 125, 140], neck: [-184, 11], chin: -175, shoulders: [[-58, -122], [58, -122]],
    face: [0, -272, 27, -272, 39, -256, 39, -232, 39, -210, 27, -188, 0, -175, -27, -188, -39, -210, -39, -232, -39, -256, -27, -272, 0, -272] },
  drawVera2: { who: 'VERA', pivot: -176, handY: -10, box: [-130, -330, 135, 140], neck: [-182, 10], chin: -174, shoulders: [[-64, -120], [64, -120]],
    face: [0, -272, 28, -272, 40, -256, 40, -232, 40, -212, 28, -190, 0, -174, -28, -190, -40, -212, -40, -232, -40, -256, -28, -272, 0, -272] },
  drawCleo2: { who: 'CLEO', pivot: -150, handY: -40, box: [-125, -330, 125, 140], neck: [-168, 10], chin: -154, featDy: 22, shoulders: [[-53, -118], [53, -118]],
    face: [0, -246, 30, -246, 42, -228, 41, -206, 40, -184, 26, -162, 0, -154, -26, -162, -40, -184, -41, -206, -42, -228, -30, -246, 0, -246] },
  drawDennis: { who: 'DENNIS', pivot: -200, handY: -18, box: [-160, -385, 160, 30], shoulders: [[-104, -60], [104, -60]] },
  drawMags: { who: 'MAGS', hang: true, box: [-80, -30, 80, 110] },
};
// hard limits on the acting (radians / fractions / rig units): the rig can never be pushed past these, whatever K2.act or the cues say
// lean is a shear about pivotY (forearm height on the counter), so hands resting there cannot move; there is no sideways squash
const K2LIM = { lean: .09, tilt: .14, sy: .07, hx: 3, hyDown: 4, turn: .6, pivotY: -18, reachStretch: 1.04, neckUp: 10 };
const k2Hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const k2Rand = (seed, i) => mulberry32((seed ^ Math.imul(i + 1, 0x9E3779B1)) >>> 0)();
// a reaction beat: anticipation (down), the hit (up) with overshoot, a small rebound, settled by 1.2 s; 0 outside
function k2Pop(u) { if (u < -.1 || u > 1.2) return 0; if (u < 0) return -.45 * Math.sin(Math.PI * (u + .1) / .2); return Math.exp(-u * 5) * Math.sin(u * 13) - .45 * Math.exp(-u * 30); }
// a held move: 0 before, eases to 1 with ~17% overshoot
function k2Spring(u) { return u <= 0 ? 0 : 1 - Math.exp(-6 * u) * (Math.cos(11 * u) + .55 * Math.sin(11 * u)); }
const k2Hold = (u, hold) => k2Spring(u) - k2Spring(u - hold);
function k2Lines(who) {
  K2.lineCache = K2.lineCache || {};
  return K2.lineCache[who] || (K2.lineCache[who] = (window.TL && TL.VO || []).filter(v => v.who === who || v.who === 'BOTH').map((v, i) => ({ ...v, i })));
}
// the body at time t (deterministic, so the head and hair can sample it a few frames back for overlap)
function k2Body(C, t) {
  const S = C.seed, ph = (S % 997) / 997 * 6.283, A = K2.act;
  const br = Math.sin(t * 6.283 / 3.6 + ph);                                    // breathing: chest and shoulders rise on the inhale
  const B = { lean: .011 * Math.sin(t * 6.283 / 5.3 + ph * 1.7), sx: -.004 * br, sy: .009 * br, tilt: .028 * Math.sin(t * 6.283 / 4.4 + ph * 2.3), turn: 0, hy: -1.2 * br, hx: 0 };
  for (const v of k2Lines(C.who)) {                                             // talking: a lean toward the listener, a head angle per line,
    const u = t - v.t; if (u < -.4 || u > v.dur + 1.4) continue;                // a pop on the first word, accents on seeded beats, nods
    const r = k2Rand(S, v.i), env = k2Hold(u + .05, v.dur + .35);
    B.lean += C.face * (.042 + .035 * r) * env;
    B.tilt += (r - .5) * .13 * env;
    const p = k2Pop(u); B.sy += .042 * p; B.sx -= .022 * p; B.hy -= 4.2 * k2Pop(u - .05);
    for (let k = 1; k < 4; k++) { const tb = .55 + k * (.9 + .6 * k2Rand(S + k, v.i)); if (tb > v.dur - .15) break; const q = k2Pop(u - tb); B.sy += .022 * q; B.hy -= 3.5 * q; B.tilt += (k2Rand(S + 7 * k, v.i) - .5) * .06 * k2Hold(u - tb, .5); }
  }
  for (const a of (window.TL && TL.ACT) || []) {                               // cues: [who, t, kind, amount = 1, hold = .8]
    if (a[0] !== C.who) continue;
    const u = t - a[1], m = a[3] ?? 1, hold = a[4] ?? .8; if (u < -.2 || u > hold + 1.6) continue;
    const p = k2Pop(u) * m, h = k2Hold(u, hold) * m;
    if (a[2] === 'pop') { B.sy += .06 * p; B.sx -= .035 * p; B.hy -= 5 * k2Pop(u - .05) * m; }                 // surprise / gasp
    else if (a[2] === 'lean') { B.lean += C.face * .06 * h; B.hy += 2 * h; }                                     // lean in
    else if (a[2] === 'back') { B.lean -= C.face * .07 * h; B.sy += .02 * p; }                                  // recoil
    else if (a[2] === 'slump') { B.sy -= .035 * h; B.sx += .015 * h; B.tilt += .05 * h * C.face; B.hy += 4 * h; }   // sigh, deflate
    else if (a[2] === 'shrug') { B.sy += .04 * h; B.hy -= 6 * h; B.tilt -= .06 * h * C.face; }
    else if (a[2] === 'nod') { B.hy += 5 * Math.sin(Math.min(u, .9) / .9 * 12.566) * (u > 0 && u < .9) * m; }
    else if (a[2] === 'shake') { B.turn += .45 * Math.sin(Math.min(u, .9) / .9 * 12.566) * (u > 0 && u < .9) * m; }
    else if (a[2] === 'turn') B.turn += m * k2Spring(u) - (hold < 99 ? m * k2Spring(u - hold) : 0);
    else if (a[2] === 'tilt') B.tilt += .12 * h * C.face;
  }
  for (const k of ['lean', 'sx', 'sy', 'tilt', 'hy']) B[k] *= A;
  return B;
}
// eye darts and blinks on a randomised, seeded clock
function k2Dart(C, t) {
  let t0 = 0, i = 0, prev = 0, cur = 0;
  for (;;) { const d = .8 + 1.8 * k2Rand(C.seed + 11, i); if (t0 + d > t || i > 400) break; t0 += d; prev = cur; cur = [0, 1.4, -1.4, .7, -.7, 0][Math.floor(k2Rand(C.seed + 13, i) * 6)]; i++; }
  return lerp(prev, cur, ease((t - t0) / .06));
}
function k2Blink(seed, t) {
  const S = 977 + seed * 131;
  for (let i = 0, tb = .4 + 2.2 * k2Rand(S, 0); tb <= t && i < 400; i++, tb += 1.9 + 3.6 * k2Rand(S, i + 1)) {
    if (t < tb + .12) return true;
    if (k2Rand(S + 5, i) < .22 && t >= tb + .22 && t < tb + .33) return true;    // now and then a double blink
  }
  return false;
}
function k2Tick(t) {
  if (!K2.ticked || t !== K2.t) {
    K2.t = t; K2.ticked = true; K2.contacts.length = 0;
    if (K2.audit) { K2.auditRigs = []; if (K2.auditEp) K2.auditEp.stop(); K2.auditEp = k2RecordFrame(); }
  }
}
function k2RecordFrame() {                           // records tubes and hands drawn outside the rigs during the frame (audit only)
  const rec = { tube: [], hand: [] }, keep = { tTube: window.tTube, tHand: window.tHand };
  window.tTube = function (cc, ...a) { if (!K2.busy) rec.tube.push({ pts: a[0].slice(), w: a[1], m: cc.getTransform() }); return keep.tTube.call(this, cc, ...a); };
  window.tHand = function (cc, ...a) { if (!K2.busy) rec.hand.push({ x: a[0], y: a[1], r: a[2], m: cc.getTransform() }); return keep.tHand.call(this, cc, ...a); };
  rec.stop = () => { if (window.tTube !== keep.tTube) { window.tTube = keep.tTube; window.tHand = keep.tHand; } };
  return rec;
}
function k2Layer(canvas, i) {
  const key = i + ':' + canvas.width + 'x' + canvas.height;
  let L = K2.layers.get(key); if (!L) { L = document.createElement('canvas'); L.width = canvas.width; L.height = canvas.height; K2.layers.set(key, L); }
  return L;
}
function k2Light() { return K2.LIGHT[K2.set || (K2.set = typeof buildLab === 'function' ? 'vl' : 'vm')]; }
// one cel tone on the side away from the key light, one directional rim from the set's light on this figure's side, an ambient
// tint and a top-to-bottom falloff, all inside the character's own silhouette (screen space, rect rx, ry, rw, rh; u = screen px
// per rig unit; side = 'left' | 'right' of the set)
function k2Shade(L, rx, ry, rw, rh, u, side) {
  const Lt = k2Light(), lc = L.getContext('2d'), M = k2Layer(L, 1), mc = M.getContext('2d');
  const band = (dx, dy, col, alpha, op) => {
    mc.setTransform(1, 0, 0, 1, 0, 0); mc.globalAlpha = 1; mc.globalCompositeOperation = 'source-over'; mc.clearRect(rx, ry, rw, rh);
    mc.drawImage(L, rx, ry, rw, rh, rx, ry, rw, rh);
    mc.globalCompositeOperation = 'source-in'; mc.fillStyle = col; mc.fillRect(rx, ry, rw, rh);
    mc.globalCompositeOperation = 'destination-out'; mc.drawImage(L, rx, ry, rw, rh, rx + dx, ry + dy, rw, rh);
    lc.save(); lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalAlpha = alpha; lc.globalCompositeOperation = op; lc.drawImage(M, rx, ry, rw, rh, rx, ry, rw, rh); lc.restore();
  };
  lc.save(); lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-atop';
  const gr = lc.createLinearGradient(0, ry, 0, ry + rh); gr.addColorStop(0, 'rgba(255,240,220,0)'); gr.addColorStop(.45, 'rgba(30,12,60,0)'); gr.addColorStop(1, `rgba(30,12,60,${Lt.fall})`);
  lc.fillStyle = gr; lc.fillRect(rx, ry, rw, rh);
  lc.globalAlpha = Lt.amb[1]; lc.fillStyle = Lt.amb[0]; lc.fillRect(rx, ry, rw, rh);
  lc.restore();
  const d = Lt.band * u; band(Lt.key[0] * d, Lt.key[1] * d, Lt.shade, 1, 'multiply');                   // the cel tone
  // the rim: a thin line of the set's light just inside the outline, only on edges that face the light (depth d1..d2 measured
  // toward it), strongest at head and shoulder height and fading down the figure; nothing on the far side, no halo
  const [dir, col, alpha] = Lt.rims[side], n = Math.hypot(dir[0], dir[1]), Rx = dir[0] / n, Ry = dir[1] / n;
  const d1 = Lt.ink * u + .5, d2 = d1 + clamp(Lt.rimW * u, 2, 4);
  mc.setTransform(1, 0, 0, 1, 0, 0); mc.globalAlpha = 1; mc.globalCompositeOperation = 'source-over'; mc.clearRect(rx, ry, rw, rh);
  mc.drawImage(L, rx, ry, rw, rh, rx, ry, rw, rh);
  mc.globalCompositeOperation = 'source-in'; mc.fillStyle = col; mc.fillRect(rx, ry, rw, rh);
  mc.globalCompositeOperation = 'destination-out'; mc.drawImage(L, rx, ry, rw, rh, rx - Rx * d2, ry - Ry * d2, rw, rh);
  mc.globalCompositeOperation = 'destination-in'; mc.drawImage(L, rx, ry, rw, rh, rx - Rx * d1, ry - Ry * d1, rw, rh);
  const fo = mc.createLinearGradient(0, ry, 0, ry + rh); fo.addColorStop(0, 'rgba(0,0,0,.5)'); fo.addColorStop(.2, 'rgba(0,0,0,1)'); fo.addColorStop(.45, 'rgba(0,0,0,.65)'); fo.addColorStop(.8, 'rgba(0,0,0,0)');
  mc.fillStyle = fo; mc.fillRect(rx, ry, rw, rh);
  lc.save(); lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalAlpha = alpha; lc.globalCompositeOperation = 'screen'; lc.drawImage(M, rx, ry, rw, rh, rx, ry, rw, rh); lc.restore();
}
function k2Contact(g, x, y, w, h, a) {                     // a soft contact shadow (current transform), multiply
  g.save(); g.translate(x, y); g.scale(1, h / w);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, w); gr.addColorStop(0, `rgba(20,6,40,${a})`); gr.addColorStop(.6, `rgba(20,6,40,${a * .45})`); gr.addColorStop(1, 'rgba(20,6,40,0)');
  g.globalCompositeOperation = 'multiply'; g.fillStyle = gr; g.beginPath(); g.arc(0, 0, w, 0, 6.2832); g.fill(); g.restore();
}
// after the counter/bench front is drawn: the cast's contact shadows on its top lip
function k2HookCtx(c) {
  if (c.__k2) return; c.__k2 = true;
  const di = c.drawImage;
  c.drawImage = function (img, ...a) {
    di.call(this, img, ...a);
    const front = img === STATIC.front || (typeof LAB_STATIC !== 'undefined' && img === LAB_STATIC.front) || (typeof AISLE !== 'undefined' && img === AISLE.front);
    if (!front || a.length < 2) return;
    const top = a[1];
    for (const k of K2.contacts) if (k.c === this && Math.abs(k.y - top) < 40) k2Contact(this, k.x, top + 7, k.w, 15, k2Light().contact);
  };
}
function k2Character(C, orig, c, x, y, s, o) {
  const who = o.who || C.who, t = K2.t, u = s / 100, Lm = K2LIM;
  const st = { who, seed: k2Hash(who + ':' + (C.seedTag || '')), face: x < 540 ? 1 : -1 };
  // hands on something the episode or the counter holds still: the torso does not lean or squash at all (only the head acts);
  // a reach (reachL/R) may lean a little because its target is corrected below so the hand lands exactly where the episode put it
  const held = o.hold || o.reach || o.mug != null || o.clipboard || o.point || o.press, reach = o.reachL || o.reachR;
  const kb = held ? 0 : reach ? .35 : 1;
  const B = k2Body(st, t), B1 = k2Body(st, t - .07), B2 = k2Body(st, t - .15);
  let lean = clamp(B.lean * kb, -Lm.lean, Lm.lean), sy = clamp(B.sy * kb, -Lm.sy, Lm.sy), sx = 0;
  const py = C.handY ?? Lm.pivotY;                          // lean and squash pivot at the resting hands' height: they stay put
  const o2 = { ...o };
  if (!C.hang) {
    const piv = -C.pivot;                                                        // the head lags the torso, the hair lags the head
    const up = C.chin != null ? -(C.chin - C.neck[0] - 2) : -6;                   // how far the head may rise and still cover the neck
    o2.l2 = {
      tilt: clamp(B1.tilt + (B1.lean - B.lean) * 1.3 + lean * .5, -Lm.tilt, Lm.tilt),
      hx: clamp((B1.lean - B.lean) * piv * .9 + (B.turn || 0) * 2, -Lm.hx, Lm.hx), hy: clamp(B1.hy + (B1.sy - B.sy) * piv * .7, up, Lm.hyDown),
      hair: clamp(((B2.lean + B2.tilt) - (B.lean + B.tilt)) * 150 + 1.2 * Math.sin(t * 2.1 + st.seed % 7), -9, 9),
      hem: clamp((B2.lean - B.lean) * 110 + .8 * Math.sin(t * 1.7 + st.seed % 5), -5, 5),
      dart: k2Dart(st, t), neck: Lm.neckUp,
    };
    if (B.turn) o2.turn = clamp((o.turn || 0) + clamp(B.turn, -Lm.turn, Lm.turn), -1, 1);
    // reach IK: the hand stays on the episode's target; if leaning would stretch the arm past rest (shoulder further from the target
    // than in Look 1 by more than reachStretch), the torso leans less instead
    for (const [k, sh] of [['reachL', C.shoulders && C.shoulders[0]], ['reachR', C.shoulders && C.shoulders[1]]]) {
      if (!o[k] || !sh) continue;
      for (let i = 0; i < 6; i++) {
        const S2 = k2Warp(sh[0], sh[1], lean, sx, sy, py), d1 = Math.hypot(o[k].x - sh[0], o[k].y - sh[1]), d2 = Math.hypot(o[k].x - S2[0], o[k].y - S2[1]);
        if (d2 <= d1 * Lm.reachStretch) break; lean *= .5; sx *= .5; sy *= .5;
      }
    }
    const inv = r => { const q = k2Unwarp(r.x, r.y, lean, sx, sy, py); return { ...r, x: q[0], y: q[1] }; };
    if (o.reachL) o2.reachL = inv(o.reachL); if (o.reachR) o2.reachR = inv(o.reachR);
  }
  const m = c.getTransform(), z = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)), bx = C.box;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [px, py] of [[bx[0], bx[1]], [bx[2], bx[1]], [bx[0], bx[3]], [bx[2], bx[3]]]) { const X = m.a * (x + px * u) + m.c * (y + py * u) + m.e, Y = m.b * (x + px * u) + m.d * (y + py * u) + m.f; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
  const pad = 24 + (C.hang ? 70 * z * u : 0) + 18 * z * u, cw = c.canvas.width, ch = c.canvas.height;
  const rx = Math.max(0, Math.floor(x0 - pad)), ry = Math.max(0, Math.floor(y0 - pad)), rw = Math.min(cw, Math.ceil(x1 + pad)) - rx, rh = Math.min(ch, Math.ceil(y1 + pad)) - ry;
  if (rw <= 0 || rh <= 0) return;                                               // off screen
  const L = k2Layer(c.canvas, 0), lc = L.getContext('2d');
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over'; lc.filter = 'none'; lc.shadowBlur = 0; lc.shadowColor = 'rgba(0,0,0,0)';
  lc.clearRect(rx, ry, rw, rh);
  lc.save(); lc.beginPath(); lc.rect(rx, ry, rw, rh); lc.clip(); lc.setTransform(m);
  const swing = clamp((B1.lean * 1.6 + B.tilt * .4) * K2.act, -.12, .12);
  if (C.hang) { lc.translate(x, y); lc.rotate(swing); lc.translate(-x, -y); }          // MAGS swings on his mount
  else { lc.translate(x, y + py * u); lc.transform(1, 0, -lean, 1, 0, 0); lc.scale(1 + sx, 1 + sy); lc.translate(-x, -(y + py * u)); }
  if (K2.audit) k2AuditRig(C, orig, lc, m, x, y, s, o, o2, { lean, sx, sy, py, swing });
  else orig(lc, x, y, s, o2);
  lc.restore();
  k2Shade(L, rx, ry, rw, rh, z * u, x < 540 ? 'left' : 'right');
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); if (k2Light().pop) c.filter = k2Light().pop; c.drawImage(L, rx, ry, rw, rh, rx, ry, rw, rh); c.restore();
  if (!C.hang) K2.contacts.push({ c, x, y, w: 78 * u, z });
  k2HookCtx(c);
}
// the torso warp in rig-local units: lean and squash about (0, py)
function k2Warp(px, py0, lean, sx, sy, py) { const a = px * (1 + sx), b = (py0 - py) * (1 + sy); return [a - lean * b, py + b]; }
function k2Unwarp(qx, qy, lean, sx, sy, py) { const b = qy - py, a = qx + lean * b; return [a / (1 + sx), py + b / (1 + sy)]; }
const k2Shear = lean => new DOMMatrix([1, 0, -lean, 1, 0, 0]);     // x' = x - lean * y: positive lean moves the top to the right

// ---------------------------------------------------------------- Look 2 audit (?look=2&audit=1): measures, never draws differently
// Per frame and rig: arm roots vs the (leaned/squashed) torso's shoulder joints, arm length vs Look 1 (stretch), hands on props vs
// where Look 1 puts them, pupils inside their whites, eyes on the head group's transform, the neck still covered by the face, and
// arms/hands the episode draws itself for a rig (matched to its Look 1 shoulders/hands). channel/tools/look2_audit.cjs reads K2.auditLog.
const k2P = (M, x, y) => [M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f];
const k2D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function k2Record(ctx, fn) {                          // runs fn with the drawing helpers patched to record what is drawn on ctx
  const rec = { tube: [], hand: [], eye: [], head: [] }, keep = {};
  const patch = (n, f2) => { keep[n] = window[n]; window[n] = function (cc, ...a) { if (cc === ctx) f2(cc, a); return keep[n].call(this, cc, ...a); }; };
  patch('tTube', (cc, a) => rec.tube.push({ pts: a[0].slice(), w: a[1], m: cc.getTransform() }));
  patch('tHand', (cc, a) => rec.hand.push({ x: a[0], y: a[1], r: a[2], m: cc.getTransform() }));
  patch('animeEye', (cc, a) => rec.eye.push({ ex: a[0], ey: a[1], sx: a[2], o: a[3], m: cc.getTransform() }));
  keep.l2Head = window.l2Head;
  window.l2Head = function (cc, o, py) { const r = keep.l2Head.call(this, cc, o, py); if (r && cc === ctx) rec.head.push({ m: cc.getTransform() }); return r; };
  try { fn(); } finally { for (const n of Object.keys(keep)) window[n] = keep[n]; }
  return rec;
}
function k2TubeLen(M, p) {                            // screen length of a tTube centre line (quadratic segments, as tTube draws them)
  let L = 0, q = k2P(M, p[0], p[1]);
  for (let i = 2; i + 3 < p.length; i += 4) for (let k = 1; k <= 8; k++) { const s = k / 8, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; const r = k2P(M, a * p[i - 2] + b * p[i] + c * p[i + 2], a * p[i - 1] + b * p[i + 1] + c * p[i + 3]); L += k2D(q, r); q = r; }
  return L;
}
function k2EyeWhite(ex, ey, sx, o) {                 // the white of animeEye as a Path2D (eye-local units)
  const w = o.w || 12, h = o.h || 12, tilt = o.tilt ?? .3, ixx = ex - sx * w, oxx = ex + sx * w, iyy = ey - h * .1, oyy = ey - h * .1 - tilt * h * .3, P = new Path2D();
  P.moveTo(ixx, iyy);
  if (o.round) P.bezierCurveTo(ixx + sx * 1, ey - h * 1.02, oxx - sx * 2, ey - h * 1.02, oxx, oyy); else P.quadraticCurveTo(ex - sx * 1, ey - h * 1.35, oxx, oyy);
  P.quadraticCurveTo(ex, ey + h * .6, ixx, iyy); P.closePath(); return P;
}
function k2FacePath(f) { const P = new Path2D(); P.moveTo(f[0], f[1]); for (let i = 2; i < f.length; i += 6) P.bezierCurveTo(f[i], f[i + 1], f[i + 2], f[i + 3], f[i + 4], f[i + 5]); P.closePath(); return P; }
function k2Inside(M, path, X, Y) { const g = K2.auditG || (K2.auditG = document.createElement('canvas').getContext('2d')); g.setTransform(M); return g.isPointInPath(path, X, Y); }
function k2AuditRig(C, orig, lc, m, x, y, s, o, o2, P) {
  const u = s / 100, rig = Object.keys(K2CAST).find(k => K2CAST[k] === C), who = o.who || C.who;
  const r2 = k2Record(lc, () => orig(lc, x, y, s, o2));
  const g1 = K2.auditCtx || (K2.auditCtx = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 4; return cv.getContext('2d'); })());
  g1.setTransform(m); const r1 = k2Record(g1, () => orig(g1, x, y, s, o));        // the same call in Look 1 (rest pose), off screen
  const T1 = new DOMMatrix(m).translate(x, y).scale(u);
  const T2 = C.hang ? new DOMMatrix(m).translate(x, y).rotate(P.swing * 57.29578).translate(-x, -y).translate(x, y).scale(u)
    : new DOMMatrix(m).translate(x, y + P.py * u).multiply(k2Shear(P.lean)).scale(1 + P.sx, 1 + P.sy).translate(-x, -(y + P.py * u)).translate(x, y).scale(u);
  const hc = k2P(T2, 0, C.hang ? 50 : (C.chin ?? -200) - 45), zs = u * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
  const R = { t: +K2.t.toFixed(4), rig, who, scale: +zs.toFixed(2), headIn: hc[0] > 80 && hc[0] < 1000 && hc[1] > 120 && hc[1] < 1500 ? 1 : 0, armRoot: 0, stretch: 0, hand: 0, pupilOut: 0, eyeHead: 0, neckOpen: 0, joint: 0, n: { arms: 0, hands: 0, eyes: 0 } };
  // arms: tubes at least 15 units wide (sleeves); the root must sit on the torso's shoulder joint; the length must not grow
  r2.tube.forEach((tb, i) => {
    if (tb.w < 15 || C.hang) return; R.n.arms++;
    R.armRoot = Math.max(R.armRoot, k2D(k2P(tb.m, tb.pts[0], tb.pts[1]), k2P(T2, tb.pts[0], tb.pts[1])));
    const t1 = r1.tube[i]; if (t1) R.stretch = Math.max(R.stretch, k2TubeLen(tb.m, tb.pts) / Math.max(1e-6, k2TubeLen(t1.m, t1.pts)) - 1);
  });
  // hands on props: everything but free gestures (Pip's wave, Vera's point/cheer, hanging arms) and props the rig itself carries
  // (Vera's tube and clipboard, Cleo's remote, Rae's lifted mug) must stay where Look 1 puts them
  const bound = [], hands = [];
  r1.hand.forEach((h1, i) => {
    const local = [h1.x, h1.y];
    let b = !o.armsDown && !o.cheer;
    if (rig === 'drawPip2') b = b && !(h1.y < -150);                                                    // the wave hand is free
    if (rig === 'drawRae2') b = b && !(o.mug != null && i === r1.hand.length - 1 && o.mug > .05);         // the hand on the lifted mug
    if (rig === 'drawVera2' || rig === 'drawCleo2') { const rr = o.reachR || o.reachL; b = b && !!rr && Math.abs(rr.x - local[0]) < .01 && Math.abs(rr.y - local[1]) < .01; }
    const h2 = r2.hand[i]; if (!h2) return;
    const p1 = k2P(h1.m, h1.x, h1.y), p2 = k2P(h2.m, h2.x, h2.y);
    hands.push({ p1, p2, r: h2.r * Math.sqrt(Math.abs(h2.m.a * h2.m.d - h2.m.b * h2.m.c)) });
    if (b) { R.n.hands++; R.hand = Math.max(R.hand, k2D(p1, p2)); bound.push({ p1, p2, r: h2.r * Math.sqrt(Math.abs(h2.m.a * h2.m.d - h2.m.b * h2.m.c)) }); }
  });
  // eyes: the pupil (centre +- its half width + .6 unit) inside the white; the eye on the head group's transform (with the 3/4 turn)
  const H2 = r2.head.length ? r2.head[r2.head.length - 1].m : T2, turn = o2.turn || 0;
  for (const e of r2.eye) {
    R.n.eyes++;
    const w = e.o.w || 12, h = e.o.h || 12, look = e.o.look || 0, cx = e.ex + look, cy = e.ey - h * .3 + h * .82 * .05, pr = w * .224 + .6, wp = k2EyeWhite(e.ex, e.ey, e.sx, e.o);
    const pts = [[cx, cy], [cx - pr, cy], [cx + pr, cy], [cx, cy - pr * .8], [cx, cy + pr * .8]];
    const sc = Math.sqrt(Math.abs(e.m.a * e.m.d - e.m.b * e.m.c));
    for (const [px, py] of pts) { const S = k2P(e.m, px, py); if (!k2Inside(e.m, wp, S[0], S[1])) R.pupilOut = Math.max(R.pupilOut, 1); }
    if (!C.hang) { const E = new DOMMatrix(H2).translate(0, C.featDy || 0).translate(turn * 12, 0).scale(1 - Math.abs(turn) * .1, 1); R.eyeHead = Math.max(R.eyeHead, k2D(k2P(e.m, e.ex, e.ey), k2P(E, e.ex, e.ey))); }
    void sc;
  }
  // the neck: its top corners stay inside the face whenever they are in Look 1; how far the head moved off the neck at the joint
  if (C.face && C.neck) {
    const fp = k2FacePath(C.face), [nt, nh] = C.neck;
    for (const sxn of [-1, 1]) {
      const p1 = [sxn * (nh - 1.5), nt + 1.5], p2 = [p1[0], nt - (o2.l2 ? o2.l2.neck || 0 : 0) + 1.5], S1 = k2P(T1, p1[0], p1[1]), S2 = k2P(T2, p2[0], p2[1]);
      if (k2Inside(T1, fp, S1[0], S1[1]) && !k2Inside(H2, fp, S2[0], S2[1])) R.neckOpen = 1;
    }
    R.joint = k2D(k2P(H2, 0, nt), k2P(T2, 0, nt));
  }
  K2.auditRigs.push({ R, T1, T2, C, bound, hands, u: u * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) });
}
// arms and hands the episode draws itself (outside the rigs) for a rig, matched to that rig's Look 1 shoulders / hands: the episode
// draws them where Look 1 has the rig, so the gap that opens is how far that shoulder / hand moved in Look 2
function k2AuditEpisode(rec) {
  const out = { epArm: 0, epHand: 0, epN: 0 };
  for (const A of K2.auditRigs) {
    if (!A.C.shoulders || A.C.hang) continue;
    for (const tb of rec.tube) {
      if (tb.w * Math.sqrt(Math.abs(tb.m.a * tb.m.d - tb.m.b * tb.m.c)) < 12 * A.u) continue;
      const R0 = k2P(tb.m, tb.pts[0], tb.pts[1]);
      for (const sh of A.C.shoulders) { const S1 = k2P(A.T1, sh[0], sh[1]); if (k2D(R0, S1) < 4 * A.u) { out.epN++; out.epArm = Math.max(out.epArm, k2D(S1, k2P(A.T2, sh[0], sh[1]))); } }
    }
    for (const hd of rec.hand) {
      const H0 = k2P(hd.m, hd.x, hd.y);
      for (const b of A.hands) if (k2D(H0, b.p1) < Math.max(4, b.r * 1.5)) { out.epN++; out.epHand = Math.max(out.epHand, k2D(b.p1, b.p2)); }
    }
  }
  return out;
}
function k2Wrap(name, orig) {
  const C = K2CAST[name];
  return function (c, x, y, s, o = {}) {
    if (!K2.on || !K2.ticked || K2.busy || !c || !c.canvas || c.canvas.width < 500 || o.look2 === false) return orig(c, x, y, s, o);
    K2.busy++;
    try { k2Character(C, orig, c, x, y, s, o); } finally { K2.busy--; }
  };
}
// screen-space finishing for the current shot: foreground (over-the-shoulder, blurred props), then the vignette
function k2Post(g, t) {
  if (K2.audit && K2.auditEp) {
    K2.auditEp.stop(); const ep = k2AuditEpisode(K2.auditEp); K2.auditEp = null;
    K2.auditLog.push({ t: +t.toFixed(4), rigs: K2.auditRigs.map(a => a.R), ...ep });
  }
  const sh = typeof shotAt === 'function' && window.TL && TL.SHOTS ? shotAt(t) : null, fx = sh && K2.shotFx[sh[0]];
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (fx && fx.ots) otsShoulder(g, fx.ots.who, fx.ots.x, fx.ots.y, fx.ots.s, fx.ots.blur ?? 10);
  if (fx && fx.fg) fgBlur(g, gg => fx.fg(gg, t, sh), fx.blur ?? 8);
  const Lt = k2Light(), vg = g.createRadialGradient(W / 2, H * .46, H * .28, W / 2, H * .46, H * .78);
  vg.addColorStop(0, 'rgba(8,3,24,0)'); vg.addColorStop(1, `rgba(8,3,24,${Lt.vig})`);
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.restore();
}
// a blurred foreground: draw(g) in screen space, then blurred onto the frame
function fgBlur(g, draw, blur = 8) {
  const L = k2Layer(g.canvas, 2), lc = L.getContext('2d');
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over'; lc.filter = 'none'; lc.clearRect(0, 0, L.width, L.height);
  draw(lc);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `blur(${blur}px)`; g.drawImage(L, 0, 0); g.restore();
}
// over-the-shoulder: the back of a cast member's head and shoulder, big and soft, in a lower corner (screen space; x, y = head centre)
function otsShoulder(g, who, x, y, s, blur = 10) {
  const P = { PIP: [TOON.pip.hair, TOON.pip.hairS, TOON.orange, TOON.pip.shirt], RAE: [TOON.rae.hair, TOON.rae.hairS, TOON.orange, TOON.rae.hood],
    VERA: typeof LAB2 !== 'undefined' ? [LAB2.vera.hair, LAB2.vera.hairS, '#f4f6fb', LAB2.vera.top] : null, CLEO: typeof LAB2 !== 'undefined' ? [LAB2.cleo.hair, LAB2.cleo.hairS, LAB2.cleo.apron, LAB2.cleo.tee] : null }[who];
  if (!P) return;
  fgBlur(g, lc => {
    lc.save(); lc.translate(x, y); lc.scale(s / 100, s / 100);
    tShape(lc, P[3], gg => { gg.moveTo(-150, 260); gg.bezierCurveTo(-150, 120, -90, 70, 0, 66); gg.bezierCurveTo(90, 70, 150, 120, 150, 260); gg.closePath(); }, 5);   // shoulders
    tShape(lc, P[2], gg => { gg.moveTo(-132, 260); gg.bezierCurveTo(-128, 140, -86, 96, -36, 84); gg.lineTo(-30, 260); gg.closePath(); gg.moveTo(132, 260); gg.bezierCurveTo(128, 140, 86, 96, 36, 84); gg.lineTo(30, 260); gg.closePath(); }, 5);
    if (who === 'RAE') tEllipse(lc, 26, 36, 26, 22, P[0], 5);                                                   // her bun
    tShape(lc, P[0], gg => gg.ellipse(0, 0, 66, 76, 0, 0, 6.2832), 5);
    tShape(lc, P[1], gg => gg.ellipse(14, 10, 40, 54, -.3, 0, 6.2832), 0.01);
    if (who === 'PIP') drawStar(lc, -40, -40, 16, TOON.pip.clip, 4);
    lc.restore();
  }, blur);
}
// ---------------------------------------------------------------- staging: framings built from the cast's positions
const SHOT2 = {
  // where each face is (world): x, eye line y, rig scale; and the face width in rig units
  faces() {
    const vl = typeof buildLab === 'function';
    const F = vl ? { VERA: [VERA.x, LCT - 222 * VERA.s / 100, VERA.s, 80], CLEO: [CLEO.x, LCT - 198 * CLEO.s / 100, CLEO.s, 82] }
      : { PIP: [PIP.x, PIPFACE, PIP.s, 90], RAE: [RAE.x, RAEFACE, RAE.s, 78], MAGS: [MAGS.x, MAGSY, MAGS.s, 100] };
    return Object.assign(F, SHOT2.extra);
  },
  extra: {},                                    // episode-specific faces: SHOT2.extra.DENNIS = [x, eyeY, s, faceWidthUnits]
  f(who, o) { const F = SHOT2.faces()[who]; if (!F) throw new Error('SHOT2: no face for ' + who); return o && o.x != null ? [o.x, o.y ?? F[1], F[2], F[3]] : F; },
  // close-up: the face is `fill` (default 45%) of the frame width, eyes at frame y `eyeAt`; `push` = zoom gained over the shot
  cu(who, o = {}) { const [x, ey, s, fw] = SHOT2.f(who, o), z = (o.fill || .45) * W / (fw * s / 100); return SHOT2.mod([x + (o.dx || 0), ey + (960 - (o.eyeAt || 780)) / z, z, z * (1 + (o.push ?? .03))], o); },
  med(who, o = {}) { const [x, ey, s, fw] = SHOT2.f(who, o), z = (o.fill || .24) * W / (fw * s / 100); return SHOT2.mod([x + (o.dx || 0), ey + (960 - (o.eyeAt || 700)) / z, z, z * (1 + (o.push ?? .025))], o); },
  // two-shot of a and b (both faces in, eyes at `eyeAt`)
  two(a, b, o = {}) { const A = SHOT2.f(a), Bf = SHOT2.f(b), span = Math.abs(A[0] - Bf[0]) + 300, z = Math.min(2.2, W * (o.fill || .92) / span); return SHOT2.mod([(A[0] + Bf[0]) / 2 + (o.dx || 0), (A[1] + Bf[1]) / 2 + (960 - (o.eyeAt || 760)) / z, z, z * (1 + (o.push ?? .02))], o); },
  // over-the-shoulder: on `to`, past `over`'s blurred head and shoulder in the near lower corner. Register with SHOT2.fx(name, cam).
  ots(over, to, o = {}) {
    const T = SHOT2.f(to), Ov = SHOT2.f(over), side = Math.sign(Ov[0] - T[0]) || 1, z = (o.fill || .36) * W / (T[3] * T[2] / 100);
    const cam = SHOT2.mod([T[0] + side * (o.off ?? 70) / z * 2.2, T[1] + (960 - (o.eyeAt || 760)) / z, z, z * (1 + (o.push ?? .03))], o);
    cam.ots = { who: over, x: 540 + side * (o.shoulderX ?? 430), y: o.shoulderY ?? 1460, s: o.shoulderS ?? 330, blur: o.blur ?? 11 };
    return cam;
  },
  // insert: a prop at (x, y) of width w fills `fill` of the frame
  insert(x, y, w, o = {}) { const z = (o.fill || .7) * W / w; return SHOT2.mod([x, y, z, z * (1 + (o.push ?? .04))], o); },
  // a slight low (-1) or high (+1) angle: the camera drops/rises so the subject sits higher/lower in frame, the zoom tightens a little
  // (no parallax: per-frame set pieces are drawn in world space and must stay registered with the back set)
  angle(cam, a = -1) { const z = cam[2], out = [cam[0], cam[1] - a * 70 / z, z * 1.04, cam[3] * 1.04]; out.angle = a; if (cam.ots) out.ots = cam.ots; return out; },
  // push-in on a punchline: the zoom grows by k over the shot (eased)
  push(cam, k = .12) { const out = [cam[0], cam[1], cam[2], cam[2] * (1 + k)]; Object.assign(out, { ots: cam.ots, angle: cam.angle }); return out; },
  mod(cam, o) { let c2 = cam; if (o.angle) c2 = SHOT2.angle(c2, o.angle === 'low' ? -1 : o.angle === 'high' ? 1 : o.angle); return c2; },
  // register the screen-space extras (over-the-shoulder, a blurred foreground prop) for a shot name: SHOT2.fx('OTS_RAE', cam, {fg, blur})
  fx(name, cam, extra = {}) { K2.shotFx[name] = { ots: cam.ots, angle: cam.angle, ...extra }; return cam; },
};
// framing class of a camera: wide / med / cu / ecu, and who it is on (x in 160 px bins)
function framingOf(cam) { const z = cam[2], band = z < 1.35 ? 'wide' : z < 2.0 ? 'med' : z < 2.9 ? 'cu' : 'ecu'; return band + '@' + Math.round(cam[0] / 160); }
// warns when more than two cuts in a row use the same framing; returns the warnings (also on window.SHOT_WARN)
function lintShots(shots = TL.SHOTS, cams = (typeof CAM !== 'undefined' ? CAM : VMCAM)) {
  const out = []; let run = [];
  const flush = () => { if (run.length > 2) out.push(`${run.length} cuts in a row at the same framing (${framingOf(cams[run[0][0]])}): ` + run.map(s => `${s[0]} ${s[1].toFixed(1)}s`).join(', ')); };
  for (const s of shots) {
    const cam = cams[s[0]]; if (!cam) continue;
    if (run.length && framingOf(cams[run[run.length - 1][0]]) === framingOf(cam)) run.push(s); else { flush(); run = [s]; }
  }
  flush(); window.SHOT_WARN = out; for (const w of out) console.warn('[shot lint] ' + w);
  return out;
}
if (K2.on) {
  for (const name of Object.keys(K2CAST)) if (typeof window[name] === 'function') window[name] = k2Wrap(name, window[name]);
}
