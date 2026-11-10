// Covers for Shorts / Reels (1080 x 1920 JPG, under 2 MB, key content inside the middle 3:4 band).
//   node channel/tools/thumbs.cjs [folder ...]   (no folder: every entry in channel/thumbs/specs.json)
// Each spec: { folder, t, series: vm|vl|sr, lines:[...], hl:[words], ep | tape, focus/zoom/place (toons) or focusX (tapes) }
// The frame is drawn from the episode page itself (toons: the scene canvas, so no subtitles). Output: channel/thumbs/<folder>.jpg
'use strict';
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..'), SPECS = JSON.parse(fs.readFileSync(path.join(ROOT, 'channel/thumbs/specs.json'), 'utf8'));
(async () => {
  const want = process.argv.slice(2), b = await chromium.launch();
  const tp = await b.newPage({ viewport: { width: 1080, height: 1920 } }); tp.on('pageerror', e => console.error('[thumb]', e.message));
  await tp.goto('file://' + path.join(ROOT, 'channel/brand/thumb.html')); await tp.waitForFunction(() => window.READY === true);
  for (const s of SPECS.filter(s => !want.length || want.includes(s.folder))) {
    if (s.drawn) { console.log('skip (drawn cover, use covers.cjs):', s.folder); continue; }
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.error('[' + s.folder + ']', e.message));
    await p.goto('file://' + path.join(ROOT, s.folder, 'index.html'));
    await p.waitForFunction(() => window.READY === true || window.INIT_ERROR, null, { timeout: 120000 });
    const frame = await p.evaluate(t => { window.render(t); try { if (typeof SC !== 'undefined') return SC.toDataURL('image/jpeg', .95); } catch (e) {} return document.getElementById('c').toDataURL('image/jpeg', .95); }, s.t);
    await p.close();
    await tp.evaluate(([spec, f]) => window.compose(spec, f), [s, frame]);
    const d = await tp.evaluate(() => window.OUT), out = path.join(ROOT, 'channel/thumbs', s.folder + '.jpg');
    fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); console.log('ok', out, Math.round(fs.statSync(out).size / 1024) + ' KB');
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
