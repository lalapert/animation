// Shot lint: warns when more than two cuts in a row use the same framing (vmkit.js lintShots: wide/med/cu/ecu and where).
//   node channel/tools/shotlint.cjs <episode dir> [...]        exit 1 if any episode has a warning
'use strict';
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const dir of process.argv.slice(2)) {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    await p.goto('file://' + path.join(path.resolve(dir), 'index.html'));
    await p.waitForFunction(() => window.READY === true || window.INIT_ERROR, null, { timeout: 120000 });
    const w = await p.evaluate(() => typeof lintShots === 'function' ? lintShots() : ['vmkit.js has no lintShots']);
    console.log(`${dir}: ${w.length ? w.length + ' warning(s)' : 'ok'}`); for (const x of w) console.log('  ' + x);
    bad += w.length; await p.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
