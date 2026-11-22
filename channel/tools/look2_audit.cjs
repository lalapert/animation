// Look 2 machine check: renders an episode in Look 2 audit mode (?look=2&audit=1) and fails on loose arms or misplaced eyes.
//   node channel/tools/look2_audit.cjs <episode dir> [--act 1.5] [--step 2] [--inject cues.js] [--out dir] [--workers 4] [--sheets]
// Every --step-th frame (60 fps) is drawn; per frame and main rig (Pip, Rae, MAGS, Dennis, Vera, Cleo and their twins) vmkit.js
// measures, in screen px: arm root vs the torso's shoulder joint, arm length vs Look 1, hands on props vs Look 1, pupils inside the
// whites, eyes on the head group, the neck still covered by the face, and arms/hands the episode draws itself for a rig.
// FAIL (exit 1) on: arm root gap > 1.5 px, hand-target gap > 3 px, any pupil outside its white, eye off the head group > 0.5 px,
// arm stretch > 8%, an opened neck joint, episode-drawn arm root > 1.5 px or hand > 3 px off the rig. Writes <out>/audit_<ep>_act<a>.json,
// stills of the worst frames, and with --sheets a contact sheet every 0.25 s around the TL.ACT cues (<out>/sheet_<ep>_act<a>.jpg).
// The episode's files are only read; nothing in the episode folder is written.
'use strict';
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = k => { const i = argv.indexOf(k); if (i < 0) return false; argv.splice(i, 1); return true; };
const ACT = +opt('--act', 1), STEP = +opt('--step', 2), INJ = opt('--inject', null), WORKERS = +opt('--workers', 4), SHEETS = flag('--sheets');
const EP = path.resolve(argv[0] || ''), NAME = path.basename(EP), OUT = path.resolve(opt('--out', path.join(__dirname, '..', 'brand', 'out', 'look2_audit')));
if (!argv[0]) { console.error('usage: look2_audit.cjs <episode dir> [--act 1.5] [--step 2] [--inject f.js] [--out dir] [--workers 4] [--sheets]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const LIM = { armRoot: 1.5, hand: 3, pupilOut: 0, eyeHead: .5, stretch: .08, neckOpen: 0, epArm: 1.5, epHand: 3 };
const FPS = 60, tag = `${NAME}_act${ACT}`;

async function open(browser, audit) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('[pageerror]', e.message));
  await p.goto('file://' + path.join(EP, 'index.html') + `?look=2&act=${ACT}` + (audit ? '&audit=1' : ''));
  await p.waitForFunction(() => window.READY === true || window.INIT_ERROR, null, { timeout: 120000 });
  const err = await p.evaluate(() => window.INIT_ERROR || null); if (err) throw new Error(err);
  if (INJ) await p.addScriptTag({ content: fs.readFileSync(INJ, 'utf8') });
  return p;
}
const grab = (p, t, label) => p.evaluate(([t, label]) => {
  window.render(t); const cv = document.getElementById('c'), g = cv.getContext('2d');
  if (label) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = '600 40px sans-serif'; g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(0, 0, 1080, 64); g.fillStyle = '#fff'; g.fillText(label, 18, 46); g.restore(); }
  return cv.toDataURL('image/jpeg', .9);
}, [t, label]).then(d => Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'));

(async () => {
  const t0 = Date.now();
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const probe = await open(browser, true);
  const info = await probe.evaluate(() => ({ DUR: window.DUR || TL.DUR, on: K2.on, audit: K2.audit, act: K2.act, cues: (TL.ACT || []).length }));
  await probe.close();
  if (!info.on || !info.audit) throw new Error('Look 2 audit did not switch on: ' + JSON.stringify(info));
  const self = await (await open(browser, true)).evaluate(() => {          // self-test: the geometry checks can say no
    const I = new DOMMatrix(), wp = k2EyeWhite(0, 0, 1, { w: 12, h: 12 }), fp = k2FacePath(K2CAST.drawPip2.face);
    return { pupilIn: k2Inside(I, wp, 0, -3), pupilOut: !k2Inside(I, wp, 13, -3), neckIn: k2Inside(I, fp, 8.5, -134.5), neckOut: !k2Inside(I, fp, 11.5, -134.5) };
  });
  if (!Object.values(self).every(Boolean)) throw new Error('audit self-test failed: ' + JSON.stringify(self));
  const frames = []; for (let f = 0; f < Math.floor(info.DUR * FPS); f += STEP) frames.push(f / FPS);
  const chunks = Array.from({ length: WORKERS }, (_, i) => frames.slice(Math.floor(i * frames.length / WORKERS), Math.floor((i + 1) * frames.length / WORKERS)));
  const log = [];
  await Promise.all(chunks.map(async ch => {
    const p = await open(browser, true);
    for (let i = 0; i < ch.length; i += 40) log.push(...await p.evaluate(ts => { for (const t of ts) window.render(t); return K2.auditLog.splice(0); }, ch.slice(i, i + 40)));
    await p.close();
  }));
  log.sort((a, b) => a.t - b.t);
  // aggregate
  const worst = {}, fails = [], perRig = {};
  let rigFrames = 0;
  const note = (k, v, t, rig) => { if (!worst[k] || v > worst[k].v) worst[k] = { v: +v.toFixed(3), t, rig }; if (v > LIM[k]) fails.push({ k, v: +v.toFixed(3), t, rig }); };
  for (const fr of log) {
    for (const r of fr.rigs) {
      rigFrames++; perRig[r.rig + ':' + r.who] = (perRig[r.rig + ':' + r.who] || 0) + 1;
      for (const k of ['armRoot', 'hand', 'pupilOut', 'eyeHead', 'stretch', 'neckOpen']) note(k, r[k], fr.t, r.rig + ':' + r.who);
      for (const k of ['joint']) if (!worst[k] || r[k] > worst[k].v) worst[k] = { v: +r[k].toFixed(3), t: fr.t, rig: r.rig + ':' + r.who };
    }
    if (fr.epN) { note('epArm', fr.epArm, fr.t, 'episode'); note('epHand', fr.epHand, fr.t, 'episode'); }
  }
  const byKind = {}; for (const f of fails) byKind[f.k] = (byKind[f.k] || 0) + 1;
  const summary = { episode: NAME, act: ACT, step: STEP, frames: log.length, rigFrames, perRig, cues: info.cues, limits: LIM, worst, failures: fails.length, byKind, seconds: Math.round((Date.now() - t0) / 1000) };
  fs.writeFileSync(path.join(OUT, `audit_${tag}.json`), JSON.stringify({ summary, fails: fails.slice(0, 500) }, null, 1));
  console.log(`${NAME} act ${ACT}: ${log.length} frames, ${rigFrames} rig-frames, ${fails.length} failure(s) ${JSON.stringify(byKind)}`);
  for (const [k, w] of Object.entries(worst)) console.log(`  worst ${k.padEnd(8)} ${String(w.v).padStart(8)}  at ${w.t.toFixed(3)} s  ${w.rig}` + (LIM[k] != null && w.v > LIM[k] ? '   FAIL' : ''));
  // stills of the worst failing frames (or of the worst frames per metric when nothing fails)
  const pick = [...new Set((fails.length ? fails.sort((a, b) => b.v / (LIM[b.k] || 1) - a.v / (LIM[a.k] || 1)) : Object.values(worst)).map(f => f.t))].slice(0, 6);
  const p = await open(browser, false);
  for (const t of pick) fs.writeFileSync(path.join(OUT, `${tag}_worst_${t.toFixed(3)}.jpg`), await grab(p, t, `${NAME} act ${ACT}  t=${t.toFixed(3)}`));
  if (SHEETS) {                                     // every 0.25 s around the cues whose character is on screen, up to 8 cues
    const cues = await p.evaluate(() => (TL.ACT || []).map(a => [a[0], a[1], a[2]]));
    // a cue qualifies when its character's head is in frame and drawn large (>= 2.2 px per rig unit) at the cue and 0.5 s later
    const on = new Map(); for (const fr of log) for (const r of fr.rigs) if (r.headIn && r.scale >= 2.2) on.set(r.who + '@' + Math.round(fr.t * 4), true);
    const ok = c => on.get(c[0] + '@' + Math.round(c[1] * 4)) && on.get(c[0] + '@' + Math.round((c[1] + .5) * 4));
    const byWho = {}; for (const c of cues) if (ok(c)) (byWho[c[0]] = byWho[c[0]] || []).push(c);
    const use = [], seen = new Set();
    for (let round = 0; use.length < 8 && round < 20; round++) for (const w of Object.keys(byWho)) {           // round-robin over characters
      const c = byWho[w].find(c => !seen.has(c[0] + c[2])); if (c && use.length < 8) { seen.add(c[0] + c[2]); use.push(c); }
    }
    const tmp = fs.mkdtempSync(path.join(OUT, '.sheet_')); let n = 0;
    for (const c of use) for (let k = -1; k <= 5; k++) { const t = +(c[1] + k * .25).toFixed(3); fs.writeFileSync(path.join(tmp, String(n++).padStart(3, '0') + '.jpg'), await grab(p, t, `${c[0]} ${c[2]} ${k >= 0 ? '+' : ''}${(k * .25).toFixed(2)}s  t=${t.toFixed(2)}`)); }
    if (n) {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(tmp, '%03d.jpg'), '-vf', `scale=480:-1,tile=7x${Math.ceil(n / 7)}`, '-frames:v', '1', '-q:v', '3', path.join(OUT, `sheet_${tag}.jpg`)]);
      console.log('  sheet:', path.join(OUT, `sheet_${tag}.jpg`), `(${use.length} cues)`);
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  await p.close(); await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
