// node render.cjs <page.html> <width> <height> <out.png> [query]
'use strict';
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [page, w, h, out, q] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => { console.error('[pageerror]', e.message); process.exitCode = 1; });
  p.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await p.goto('file://' + path.join(__dirname, page) + (q ? '?' + q : ''));
  await p.waitForFunction(() => window.READY === true, null, { timeout: 90000 });
  const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64'));
  await b.close(); console.log('ok', out);
})().catch(e => { console.error(e); process.exit(1); });
