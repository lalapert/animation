// node styles/render.cjs → styles/sample_<style>.png
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch();
  for (const s of (process.argv[2] || 'clear,flat,riso').split(',')) {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => console.error('[pageerror]', e.message));
    await p.goto('file://' + path.join(__dirname, 'sample.html') + '?s=' + s);
    await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
    const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
    fs.writeFileSync(path.join(__dirname, `sample_${s}.png`), Buffer.from(d.split(',')[1], 'base64')); await p.close();
  }
  await b.close(); console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
