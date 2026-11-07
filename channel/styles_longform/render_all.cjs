// node render_all.cjs [style...]  → out/<scene>_<style>_<frame>.png
'use strict';
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const styles = process.argv.slice(2).length ? process.argv.slice(2) : ['A', 'B', 'C', 'D'];
  const scenes = (process.env.SCENES || 'store,lab').split(','), frames = (process.env.FRAMES || 'wide,tall').split(',');
  const b = await chromium.launch(); fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  for (const sc of scenes) for (const st of styles) for (const fr of frames) {
    const p = await b.newPage({ viewport: { width: 400, height: 400 } });
    p.on('pageerror', e => console.error('[pageerror]', e.message));
    p.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
    const t0 = Date.now();
    await p.goto('file://' + path.join(__dirname, 'sample.html') + `?style=${st}&scene=${sc}&frame=${fr}`);
    await p.waitForFunction(() => window.READY === true, null, { timeout: 180000 });
    const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
    const out = path.join(__dirname, 'out', `${sc}_${st}_${fr}.png`); fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64'));
    console.log('ok', out, ((Date.now() - t0) / 1000).toFixed(1) + 's'); await p.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
