// Render the three profile variants: node channel/render_profile.cjs → channel/out/profile_<v>_1600.png
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  for (const v of ['A', 'B', 'C']) {
    const p = await b.newPage({ viewport: { width: 1600, height: 1600 } });
    p.on('pageerror', e => console.error('[pageerror]', e.message));
    await p.goto('file://' + path.join(__dirname, 'profile.html') + '?v=' + v);
    await p.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
    const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
    fs.writeFileSync(path.join(out, `profile_${v}_1600.png`), Buffer.from(d.split(',')[1], 'base64'));
    await p.close();
  }
  await b.close();
  console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
