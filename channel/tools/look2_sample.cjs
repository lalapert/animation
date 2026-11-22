// Look 1 vs Look 2 side by side for one beat of an episode (the episode's files are only read, never changed).
//   node channel/tools/look2_sample.cjs <episode dir> <t0> <t1> <out prefix> [--inject staging.js] [--stills t,t,...] [--fps 30]
// Renders the beat twice from the episode's own index.html: as banked (Look 1) and with ?look=2 (Look 2; the optional --inject
// script runs in the page after load, e.g. to re-stage shots with SHOT2 or add TL.ACT cues). Writes <prefix>.mp4 (Look 1 left,
// Look 2 right, 1080x960, the episode's own sound for the beat) and, with --stills, <prefix>_L1_<t>.jpg / <prefix>_L2_<t>.jpg.
'use strict';
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

const argv = process.argv.slice(2);
const opt = k => { const i = argv.indexOf(k); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const inject = opt('--inject'), stills = (opt('--stills') || '').split(',').filter(Boolean).map(Number), FPS = +(opt('--fps') || 30);
const [dir, t0s, t1s, prefix] = argv;
if (!prefix) { console.error('usage: look2_sample.cjs <episode dir> <t0> <t1> <out prefix> [--inject f.js] [--stills t,..] [--fps 30]'); process.exit(2); }
const EP = path.resolve(dir), t0 = +t0s, t1 = +t1s, OUT = path.resolve(prefix);
fs.mkdirSync(path.dirname(OUT), { recursive: true });

async function open(browser, look) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error(`[L${look} pageerror]`, e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error(`[L${look} ${m.type()}]`, m.text()); });
  await page.goto('file://' + path.join(EP, 'index.html') + (look === 2 ? '?look=2' : ''));
  await page.waitForFunction(() => window.READY === true || window.INIT_ERROR, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.INIT_ERROR || null); if (err) throw new Error(err);
  if (look === 2 && inject) await page.addScriptTag({ content: fs.readFileSync(inject, 'utf8') });
  return page;
}
const grab = (page, t) => page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/jpeg', .92); }, t)
  .then(d => Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'));

async function clip(page, file) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-vf', 'scale=540:960:flags=lanczos',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((t1 - t0) * FPS);
  for (let i = 0; i < n; i++) { const buf = await grab(page, t0 + i / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise((r, j) => ff.on('close', c => c ? j(new Error('ffmpeg ' + c)) : r()));
}

(async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  try {
    for (const look of [1, 2]) {
      const page = await open(browser, look);
      for (const t of stills) fs.writeFileSync(`${OUT}_L${look}_${t.toFixed(2)}.jpg`, await grab(page, t));
      await clip(page, `${OUT}_L${look}.tmp.mp4`);
      if (look === 2) { const w = await page.evaluate(() => (typeof lintShots === 'function' ? lintShots() : [])); if (w.length) console.log('shot lint:', w.join(' | ')); }
      await page.close();
    }
  } finally { await browser.close(); }
  const mp4 = fs.readdirSync(EP).find(f => f.endsWith('.mp4'));
  const audio = mp4 ? ['-ss', String(t0), '-t', String(t1 - t0), '-i', path.join(EP, mp4)] : [];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}_L1.tmp.mp4`, '-i', `${OUT}_L2.tmp.mp4`, ...audio,
    '-filter_complex', "[0:v]drawtext=text='LOOK 1':x=18:y=18:fontsize=30:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8[a];" +
    "[1:v]drawtext=text='LOOK 2':x=18:y=18:fontsize=30:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8[b];[a][b]hstack=2[v]",
    '-map', '[v]', ...(mp4 ? ['-map', '2:a', '-c:a', 'aac', '-b:a', '128k', '-shortest'] : []), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-movflags', '+faststart', `${OUT}.mp4`]);
  for (const look of [1, 2]) fs.unlinkSync(`${OUT}_L${look}.tmp.mp4`);
  console.log('→', `${OUT}.mp4`, Math.round(fs.statSync(`${OUT}.mp4`).size / 1024) + ' KB');
})().catch(e => { console.error(e); process.exit(1); });
