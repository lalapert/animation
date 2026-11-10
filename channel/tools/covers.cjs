// Drawn covers: node channel/tools/covers.cjs [--out <dir>] <folder> ...
// Draws channel/brand/covers/<folder>.js (channel/brand/covers.html), then adds the headline and the series pill from
// channel/thumbs/specs.json with channel/brand/thumb.html (the frame is used as it is: no zoom). Output: <dir>/<folder>.jpg (default channel/thumbs).
'use strict';
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..'), SPECS = JSON.parse(fs.readFileSync(path.join(ROOT, 'channel/thumbs/specs.json'), 'utf8'));
(async () => {
  let args = process.argv.slice(2), out = path.join(ROOT, 'channel/thumbs');
  if (args[0] === '--out') { out = path.resolve(args[1]); args = args.slice(2); }
  const b = await chromium.launch();
  const tp = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await tp.goto('file://' + path.join(ROOT, 'channel/brand/thumb.html')); await tp.waitForFunction(() => window.READY === true);
  for (const folder of args) {
    const spec = Object.assign({}, SPECS.find(s => s.folder === folder), { focus: [540, 960], zoom: 1, place: [540, 960] });
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.error('[' + folder + ']', e.message));
    await p.goto('file://' + path.join(ROOT, 'channel/brand/covers.html') + '?ep=' + folder);
    await p.waitForFunction(() => window.READY === true || window.INIT_ERROR, null, { timeout: 60000 });
    const err = await p.evaluate(() => window.INIT_ERROR); if (err) { console.error(folder, err); await p.close(); continue; }
    const frame = await p.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .95)); await p.close();
    await tp.evaluate(([sp, f]) => window.compose(sp, f), [spec, frame]);
    const d = await tp.evaluate(() => window.OUT), file = path.join(out, folder + '.jpg');
    fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64')); console.log('ok', file, Math.round(fs.statSync(file).size / 1024) + ' KB');
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
