// Frame capture for the film page (headless Chromium via the pre-installed Playwright).
//   node tools/render.cjs stills <outdir> t1 t2 ...          → <outdir>/t_<t>.jpg
//   node tools/render.cjs events                              → out/events.json (window.EV)
//   node tools/render.cjs video [workers] [t0 t1]             → out/video.mp4 (60 fps, x264 crf 14)
//   node tools/render.cjs bench                               → ms per frame
'use strict';
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const HERE = path.resolve(__dirname, '..');
const FPS = 60;
const URL = 'file://' + path.join(HERE, 'index.html') + (process.env.TAPE_QUERY ? '?' + process.env.TAPE_QUERY : '');   // e.g. TAPE_QUERY=look=mono

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(URL);
  await page.waitForFunction(() => window.READY === true || window.INIT_ERROR, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.INIT_ERROR || null);
  if (err) throw new Error(err);
  return page;
}
const grab = (page, t) => page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/jpeg', .93); }, t)
  .then(d => Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'));

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  try {
    if (mode === 'stills') {
      const out = path.resolve(args[0]); fs.mkdirSync(out, { recursive: true });
      const page = await openPage(browser);
      for (const ts of args.slice(1)) { const t = +ts; fs.writeFileSync(path.join(out, `t_${t.toFixed(2).padStart(6, '0')}.jpg`), await grab(page, t)); }
      console.log('stills →', out);
    } else if (mode === 'events') {
      const page = await openPage(browser);
      const ev = await page.evaluate(() => ({ DUR: window.DUR, EV: window.EV }));
      fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
      fs.writeFileSync(path.join(HERE, 'out', 'events.json'), JSON.stringify(ev, null, 1));
      console.log('events:', ev.EV.length);
    } else if (mode === 'bench') {
      const page = await openPage(browser);
      for (const t of [2, 10, 24, 33, 45, 52, 65, 78, 87]) {
        const t0 = Date.now(); for (let i = 0; i < 6; i++) await grab(page, t + i / 60);
        const t1 = Date.now(); for (let i = 0; i < 6; i++) await page.evaluate(t => window.render(t), t + i / 60);
        console.log(`t=${t}: grab ${((t1 - t0) / 6).toFixed(0)} ms, render ${((Date.now() - t1) / 6).toFixed(0)} ms`);
      }
    } else if (mode === 'video') {
      const workers = +(args[0] || 3);
      const page0 = await openPage(browser);
      const DUR = await page0.evaluate(() => window.DUR); await page0.close();
      const t0 = args[1] ? +args[1] : 0, t1 = args[2] ? +args[2] : DUR;
      const f0 = Math.round(t0 * FPS), f1 = Math.round(t1 * FPS), N = f1 - f0;
      const outDir = path.join(HERE, 'out'); fs.mkdirSync(outDir, { recursive: true });
      const chunk = Math.ceil(N / workers), segs = [];
      const started = Date.now();
      await Promise.all([...Array(workers).keys()].map(async w => {
        const a = f0 + w * chunk, b = Math.min(f1, a + chunk);
        if (a >= b) return;
        const segPath = path.join(outDir, `seg_${w}.mp4`); segs[w] = segPath;
        const page = await openPage(browser);
        const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
          '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), segPath], { stdio: ['pipe', 'inherit', 'inherit'] });
        const done = new Promise((res, rej) => ff.on('close', code => code ? rej(new Error('ffmpeg ' + code)) : res()));
        for (let f = a; f < b; f++) {
          const buf = await grab(page, f / FPS);
          if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
          if (w === 0 && (f - a) % 300 === 0) console.log(`worker 0: ${f - a}/${b - a} frames, ${((Date.now() - started) / 1000).toFixed(0)} s`);
        }
        ff.stdin.end(); await done; await page.close();
      }));
      const list = path.join(outDir, 'segs.txt');
      fs.writeFileSync(list, segs.filter(Boolean).map(s => `file '${s}'`).join('\n'));
      const outFile = path.join(outDir, args[1] ? `video_${t0}_${t1}.mp4` : (process.env.TAPE_OUT || 'video.mp4'));
      await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', outFile], { stdio: 'inherit' })
        .on('close', c => c ? rej(new Error('concat ' + c)) : res()));
      segs.filter(Boolean).forEach(s => fs.unlinkSync(s));
      console.log(`video → ${outFile} (${N} frames, ${((Date.now() - started) / 1000).toFixed(0)} s)`);
    } else {
      console.log('usage: stills <dir> t… | events | bench | video [workers] [t0 t1]');
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
