// Render the banner: node channel/render_banner.cjs → channel/out/banner_raw.png
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2560, height: 1440 } });
  p.on('pageerror', e => console.error('[pageerror]', e.message));
  await p.goto('file://' + path.join(__dirname, 'banner.html'));
  await p.waitForFunction(() => window.READY === true, null, { timeout: 90000 });
  const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  fs.writeFileSync(path.join(out, 'banner_raw.png'), Buffer.from(d.split(',')[1], 'base64'));
  await b.close(); console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
