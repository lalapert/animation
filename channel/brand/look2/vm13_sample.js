// Look 2 staging for the before/after sample of Void Mart 13 (24.2-29.2 s), injected by channel/tools/look2_sample.cjs.
// The same beat, re-staged with the kit's helpers: Rae's punchline over Pip's (blurred) shoulder with a push-in, plus acting cues.
CAM.RAE_CU = SHOT2.fx('RAE_CU', SHOT2.push(SHOT2.ots('PIP', 'RAE', { fill: .4, shoulderX: 470, shoulderY: 1250, shoulderS: 300 }), .1));
TL.ACT = [
  ['PIP', V.L8.t, 'pop', 1],                       // "Rae! You're at minus four thousand!"
  ['RAE', V.L9.t - .3, 'slump', .6, 1.2],          // she deflates a little before admitting it
  ['RAE', V.L9.t + 1.35, 'shrug', .9, .45],        // "...a lot."
];
