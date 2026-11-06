'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('[pageerror]', e.message));
  await p.goto('file://' + path.join(__dirname, 'sheet.html')); await p.waitForFunction(() => window.READY === true, null, { timeout: 90000 });
  const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .93));
  fs.writeFileSync(path.join(__dirname, 'model_sheet.jpg'), Buffer.from(d.split(',')[1], 'base64')); await b.close(); console.log('ok'); })().catch(e => { console.error(e); process.exit(1); });
