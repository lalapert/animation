// Look 2 staging for the before/after sample of Volt Labs 13 (20.6-25.6 s), injected by channel/tools/look2_sample.cjs.
// The same wide shot from a slight low angle with a slow push-in, plus acting cues for Vera's order and Cleo's refusal.
CAM.WIDE = SHOT2.push(SHOT2.angle(CAM.WIDE, -1), .07);
TL.ACT = [
  ['VERA', V.L7.t, 'lean', 1, 2.4],                // "Cleo, you look." - she leans toward Cleo
  ['VERA', V.L7.t + 1.7, 'tilt', 1, 1.2],          // "Show me real evil."
  ['CLEO', V.L7.t + 2.3, 'back', .8, 1.1],         // Cleo leans away
  ['CLEO', V.L8.t - .05, 'shake', .7],             // "No."
];
