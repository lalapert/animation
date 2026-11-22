// Stress cues for the Look 2 audit (channel/tools/look2_audit.cjs --inject): every main character gets pop, back, shrug, shake,
// turn, tilt, lean, slump and nod in turn, one every 2.1 s, staggered per character, across the whole episode.
(() => {
  const kinds = ['pop', 'back', 'shrug', 'shake', 'turn', 'tilt', 'lean', 'slump', 'nod'];
  const whos = ['PIP', 'RAE', 'MAGS', 'DENNIS', 'VERA', 'CLEO', 'EVIL_VERA', 'EVIL_CLEO'];
  const D = TL.DUR || window.DUR; TL.ACT = (TL.ACT || []).slice();
  whos.forEach((w, wi) => { for (let t = .8 + wi * .37, k = wi; t < D - 3; t += 2.1, k++) TL.ACT.push([w, +t.toFixed(2), kinds[k % kinds.length], k % 3 === 2 ? -1 : 1, .9]); });
})();
