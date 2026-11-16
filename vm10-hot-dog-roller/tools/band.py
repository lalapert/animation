"""The Void Mart house band: a relaxed late-night jazz trio playing in a small room.
Contrabass pizzicato (a walking line or a two-feel), brushes (swirl, slaps on 2 and 4, the hi-hat foot), vibraphone
(voice-led comping and short answers between the lines), MAGS's glockenspiel jingle and the xylophone button.
The same instruments in every episode; the cue sheet in tools/score.py decides what plays where.

Played like people: swung eighths, timing and velocity spread, chords voice-led from the last one, a walking line built
from the changes (it never repeats a bar), velocity layers chosen by how hard a note is played, a vibraphone motor only
where it is switched on, and a small room (early reflections and a short tail) around the whole band.

  from band import Band
  b = Band(dur, seed=5, bpm=120)
  b.walk(t0, t1, ["F6", "D7", "Gm7 C7"], vel=.5)       # one entry per bar, two chords in a bar split it
  b.brushes(t0, t1, vel=.4); b.comp(t0, t1, [...]); b.fill(t0, t1, "F6")
  music, stems = b.render()
"""
import numpy as np
from fractions import Fraction
from scipy import signal

import audio
from audio import SR, buf, add, note, lowpass, highpass, bandpass

PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
TONES = {"maj7": [0, 4, 7, 11], "6": [0, 4, 7, 9], "69": [0, 4, 7, 9], "m7": [0, 3, 7, 10], "m6": [0, 3, 7, 9], "7": [0, 4, 7, 10],
         "9": [0, 4, 7, 10], "13": [0, 4, 7, 10], "m7b5": [0, 3, 6, 10], "dim7": [0, 3, 6, 9], "7sus": [0, 5, 7, 10], "7b9": [0, 4, 7, 10],
         "": [0, 4, 7], "m": [0, 3, 7], "m9": [0, 3, 7, 10], "maj9": [0, 4, 7, 11]}
SCALE = {"maj7": [0, 2, 4, 5, 7, 9, 11], "6": [0, 2, 4, 5, 7, 9, 11], "69": [0, 2, 4, 5, 7, 9, 11], "maj9": [0, 2, 4, 5, 7, 9, 11], "": [0, 2, 4, 5, 7, 9, 11],
         "m7": [0, 2, 3, 5, 7, 9, 10], "m9": [0, 2, 3, 5, 7, 9, 10], "m6": [0, 2, 3, 5, 7, 9, 10], "m": [0, 2, 3, 5, 7, 9, 10],
         "7": [0, 2, 4, 5, 7, 9, 10], "9": [0, 2, 4, 5, 7, 9, 10], "13": [0, 2, 4, 5, 7, 9, 10], "7sus": [0, 2, 4, 5, 7, 9, 10],
         "7b9": [0, 1, 4, 5, 7, 8, 10], "m7b5": [0, 1, 3, 5, 6, 8, 10], "dim7": [0, 2, 3, 5, 6, 8, 9, 11]}
# rootless voicings, semitones over the root, two forms (A: 3-5-7-9, B: 7-9-3-5) so the hand can stay where it is
VOICE = {"maj7": ([4, 7, 11, 14], [11, 14, 16, 19]), "maj9": ([4, 7, 11, 14], [11, 14, 16, 19]), "6": ([4, 7, 9, 14], [9, 14, 16, 19]),
         "69": ([4, 9, 14, 19], [9, 14, 16, 19]), "m7": ([3, 7, 10, 14], [10, 14, 15, 19]), "m9": ([3, 7, 10, 14], [10, 14, 15, 19]),
         "m6": ([3, 7, 9, 14], [9, 14, 15, 19]), "7": ([4, 9, 10, 14], [10, 14, 16, 21]), "9": ([4, 7, 10, 14], [10, 14, 16, 19]),
         "13": ([4, 9, 10, 14], [10, 14, 16, 21]), "7sus": ([5, 7, 10, 14], [10, 14, 17, 19]), "7b9": ([4, 7, 10, 13], [10, 13, 16, 19]),
         "m7b5": ([3, 6, 10, 12], [10, 12, 15, 18]), "dim7": ([3, 6, 9, 12], [9, 12, 15, 18]), "": ([4, 7, 12, 16], [7, 12, 16, 19]),
         "m": ([3, 7, 12, 15], [7, 12, 15, 19])}


def chord(sym):
    """'Bbmaj7' -> (10, 'maj7')"""
    r = PC[sym[0]]; i = 1
    while i < len(sym) and sym[i] in "#b":
        r += 1 if sym[i] == "#" else -1; i += 1
    q = sym[i:]
    if q not in TONES: raise ValueError(sym)
    return r % 12, q


def _near(pc, ref, lo, hi):
    """the pitch with pitch class pc closest to ref inside lo..hi"""
    c = [p for p in range(lo, hi + 1) if p % 12 == pc]
    return min(c, key=lambda p: abs(p - ref))


class Band:
    def __init__(self, dur, seed=5, bpm=120.0, swing=.64):
        self.dur, self.B, self.sw = dur, 60.0 / bpm, swing
        self.rng = np.random.default_rng(seed)
        self.st = {k: buf(dur + 4) for k in ["bass", "brush", "kit", "vibes", "glock", "xylo"]}
        self.motor = np.zeros(int((dur + 4) * SR) + 1, np.float32)      # vibraphone motor depth over time
        self.used = set()
        self.last_voicing = None
        self.prev_bass = 38
        self.log = []

    # ------------------------------------------------------------------ helpers
    def h(self, t, sd=.007, push=0.0):
        """a player's timing: a few ms either side, `push` ahead of the beat"""
        return t - push + float(self.rng.normal(0, sd))

    def v(self, vel, spread=.07):
        return float(np.clip(vel * (1 + self.rng.normal(0, spread)), .05, 1))

    def n(self, stem, inst, midi, t, dur, vel, pan=0.0, release=None, attack=0.0, gain=1.0):
        self.used.add(inst)
        add(self.st[stem], note(inst, midi, dur, vel, release=release, attack=attack) * gain, t, 1.0, pan)

    def hit(self, stem, inst, var, t, vel, pan=0.0, gain=1.0, cut=None, lp=None):
        """an unpitched sample from the velocity layer nearest `vel` (0..1), round robin, levelled by the group median"""
        self.used.add(inst)
        Z = [z for z in audio.index()[inst]["zones"] if var in (z.get("var") or "")]
        vs = sorted({z["vel"] for z in Z if z["vel"] is not None})
        if vs:
            target = vs[0] + (vs[-1] - vs[0]) * vel
            best = min(vs, key=lambda x: abs(x - target))
            Z2 = [z for z in Z if z["vel"] == best]
        else:
            Z2 = Z
        z = Z2[int(self.rng.integers(len(Z2)))]
        med = float(np.median([q["rms"] for q in Z]))
        x, s = audio._sample(z["f"])
        x = x[z.get("on", 0):]
        if s != SR:
            fr = Fraction(SR, s).limit_denominator(1000)
            x = signal.resample_poly(x, fr.numerator, fr.denominator).astype(np.float32)
        if cut:
            x = x[:int(cut * SR)].copy(); k = min(len(x), int(.25 * SR)); x[-k:] *= np.linspace(1, 0, k) ** 2
        if lp: x = lowpass(x, lp)
        x = x * (.1 / max(med, 1e-4)) * (vel if not vs else 1.0) * gain
        add(self.st[stem], x.astype(np.float32), t, 1.0, pan)

    def beats(self, t0, t1):
        k, out = 0, []
        while t0 + k * self.B < t1 - .02:
            out.append((k, t0 + k * self.B)); k += 1
        return out

    def per_beat(self, t0, t1, bars):
        """bars: one string per bar ('F6' or 'Gm7 C7'); returns the chord on every beat of t0..t1 (the list repeats)"""
        seq = []
        for b in bars:
            p = b.split()
            seq += [p[0]] * 4 if len(p) == 1 else [p[0]] * 2 + [p[1]] * 2
        nb = len(self.beats(t0, t1))
        return [seq[i % len(seq)] for i in range(nb + 1)]

    # ------------------------------------------------------------------ contrabass
    def walk(self, t0, t1, bars, vel=.5, pan=-.08, last=None, stop=True):
        """a walking line, one note a beat, built from the changes; `last` = the chord after the section (for the approach)"""
        ch = self.per_beat(t0, t1, bars)
        if last: ch[-1] = last
        B, prev = self.B, self.prev_bass
        bt = self.beats(t0, t1)
        for i, (k, t) in enumerate(bt):
            r, q = chord(ch[i]); nr, nq = chord(ch[i + 1])
            change = i == 0 or ch[i] != ch[i - 1] or k % 4 == 0
            if change:
                pc = r if (i == 0 or ch[i] != ch[i - 1] or self.rng.random() < .7) else (r + TONES[q][1]) % 12
                p = _near(pc, prev if i else 40, 31, 50)
            elif ch[i + 1] != ch[i] or (k + 1) % 4 == 0:
                tgt = _near(nr, prev, 31, 50)
                opts = [(tgt + 1, .3), (tgt - 1, .3), (tgt + 2 if (nr + 2) % 12 in [(r + s) % 12 for s in SCALE[q]] else tgt - 2, .25), (_near((nr + 7) % 12, prev, 31, 50), .15)]
                cands = [(p, w) for p, w in opts if 31 <= p <= 50 and p != prev]
                p = cands[int(self.rng.choice(len(cands), p=np.array([w for _, w in cands]) / sum(w for _, w in cands)))][0]
            else:
                tgt = _near(nr, prev, 31, 50)
                pool = [p for p in range(prev - 5, prev + 6) if p != prev and 31 <= p <= 50 and (p - r) % 12 in SCALE[q]]
                w = np.array([(3.0 if (p - r) % 12 in TONES[q] else 1.0) * (1.6 if (p - prev) * (tgt - prev) > 0 else .8) / (1 + abs(p - prev) * .25) for p in pool])
                p = pool[int(self.rng.choice(len(pool), p=w / w.sum()))]
            acc = [1.0, .9, .95, .88][k % 4]
            last_note = stop and i == len(bt) - 1
            self.n("bass", "contrabass_pizz", p, self.h(t, .007, .004), B * (.6 if last_note else .92), self.v(vel * acc, .06), pan, release=.08 if last_note else .14)
            prev = p
        self.prev_bass = prev

    def two(self, t0, t1, bars, vel=.5, pan=-.08, skip=.25, stop=True):
        """two-feel: half notes on 1 and 3 (root, then the fifth or an approach), now and then a skip into beat 3"""
        ch = self.per_beat(t0, t1, bars)
        B, prev = self.B, self.prev_bass
        bt = self.beats(t0, t1)
        for i, (k, t) in enumerate(bt):
            if k % 2: continue
            r, q = chord(ch[i])
            nxt = ch[min(i + 2, len(ch) - 1)]
            nr, _ = chord(nxt)
            if k % 4 == 0:
                p = _near(r, prev, 31, 48)
            else:
                p = _near(nr, prev, 31, 48) + (1 if self.rng.random() < .5 else -1) if nxt != ch[i] else _near((r + 7) % 12, prev, 31, 48)
                if self.rng.random() < skip:                                       # a ghosted pickup on the swung "and" of 2
                    self.n("bass", "contrabass_pizz", p - 12 if p - 12 >= 28 else p, self.h(t - B * (1 - self.sw), .006), B * .3, self.v(vel * .55), pan, release=.06)
            end = stop and i + 2 >= len(bt)
            self.n("bass", "contrabass_pizz", p, self.h(t, .007, .003), B * (1.2 if end else 1.85), self.v(vel * (1 if k % 4 == 0 else .9)), pan, release=.1 if end else .18)
            prev = p
        self.prev_bass = prev

    def bass_note(self, t, name_or_midi, beats, vel=.55, pan=-.08, release=.3):
        p = audio.m(name_or_midi) if isinstance(name_or_midi, str) else name_or_midi
        self.n("bass", "contrabass_pizz", p, self.h(t, .004), beats * self.B, self.v(vel, .03), pan, release=release)
        self.prev_bass = p

    # ------------------------------------------------------------------ brushes and the kit
    def _noise(self, n, lo, hi):
        x = self.rng.standard_normal(n).astype(np.float32)
        return bandpass(x, lo, hi, 2)

    def brushes(self, t0, t1, vel=.4, swirl=True, slap=True, foot=True, ride=False, fade_in=.3, fade_out=.12):
        """swirl (one sweep a beat, louder in the middle), slaps on 2 and 4, the hi-hat foot on 2 and 4, a ride if asked"""
        B, n = self.B, int((t1 - t0) * SR)
        if n <= 0: return
        if swirl:
            x = self._noise(n, 1400, 7500)
            tt = np.arange(n) / SR
            ph = (tt / B) % 1.0
            amp = .45 + .55 * np.sin(np.pi * ph) ** 1.5
            wob = 1 + .15 * np.sin(2 * np.pi * tt / (2 * B) + self.rng.random() * 6)                    # the circle goes round every two beats
            env = np.ones(n, np.float32)
            a, z = int(fade_in * SR), int(fade_out * SR)
            env[:a] = np.linspace(0, 1, a) ** 2; env[n - z:] = np.linspace(1, 0, z) ** 2
            sw = x * amp * wob * env * .05 * vel
            add(self.st["brush"], np.stack([sw * .8, sw * 1.0], 1).astype(np.float32), t0)
        for k, t in self.beats(t0, t1):
            if slap and k % 2 == 1:
                self._slap(self.h(t, .006), self.v(vel * (1 if k % 4 == 3 else .9)))
                if self.rng.random() < .3:                                                                  # a ghost on the swung "and"
                    self._slap(self.h(t + B * self.sw, .006), self.v(vel * .4), pan=.12)
            if foot and k % 2 == 1:
                self.hit("kit", "hihat", "pedal", self.h(t, .005), .5, .3, gain=1.0 * vel)
            if ride:
                for off, a in ([(0, 1.0)] if k % 2 == 0 else [(0, .85), (self.sw * B, .6)]):
                    if t + off < t1 - .05:
                        self.hit("kit", "drum_kit", "ride_left", self.h(t + off, .005), .08, -.25, gain=.55 * vel * a, cut=1.4, lp=9000)

    def _slap(self, t, vel, pan=.08):
        """a brush slap on the snare: a short spread burst of bristles plus a little of the drum under it"""
        n = int(.22 * SR)
        x = self._noise(n, 900, 9000)
        tt = np.arange(n) / SR
        env = (1 - np.exp(-tt / .004)) * np.exp(-tt / .055)
        b = x * env * .34 * vel
        add(self.st["brush"], b.astype(np.float32), t, 1.0, pan)
        self.hit("brush", "drum_kit", "snare_1", t + .002, .02, pan, gain=.4 * vel, cut=.5, lp=4500)

    def roll(self, t0, t1, vel=.4, cresc=True):
        """a brush roll (the bristles bouncing), growing into t1"""
        n = int((t1 - t0) * SR)
        x = self._noise(n, 1200, 9000)
        tt = np.arange(n) / SR
        bounce = .6 + .4 * np.abs(np.sin(2 * np.pi * 11 * tt + 3 * np.sin(2 * np.pi * 1.3 * tt)))
        env = (np.linspace(.25, 1, n) ** 1.6 if cresc else np.ones(n)) * bounce
        env[:int(.05 * SR)] *= np.linspace(0, 1, int(.05 * SR))
        env[-int(.03 * SR):] *= np.linspace(1, 0, int(.03 * SR))
        add(self.st["brush"], (x * env * .25 * vel).astype(np.float32), t0, 1.0, .05)

    # ------------------------------------------------------------------ vibraphone
    def voicing(self, sym, lo=53, hi=76):
        r, q = chord(sym)
        best = None
        for form in VOICE[q]:
            for octv in range(3, 7):
                v = [12 * octv + r + s for s in form]
                if v[0] < lo or v[-1] > hi: continue
                cost = 0 if self.last_voicing is None else sum(abs(a - b) for a, b in zip(v, self.last_voicing))
                cost += abs(v[0] - 58) * .3                                                 # stay around the middle of the instrument
                if best is None or cost < best[0]: best = (cost, v)
        self.last_voicing = best[1]
        return best[1]

    def chord_hit(self, t, sym, beats, vel=.4, roll=.012, pan=.22, release=.35, top=1.1):
        v = self.voicing(sym)
        for j, p in enumerate(v):
            self.n("vibes", "vibraphone", p, self.h(t + j * roll * (.6 + .8 * self.rng.random()), .004), beats * self.B,
                   self.v(vel * (top if j == len(v) - 1 else 1), .05), pan - .12 + .08 * j, release=release)

    def comp(self, t0, t1, bars, vel=.38, density=.6, sustain=False):
        """comping: rhythms a vibes player would choose (Charleston, a long one, a push into the next bar, 2 and 4)"""
        B, sw = self.B, self.sw
        ch = self.per_beat(t0, t1, bars)
        pats = {"long": [(0, 3.4)], "charleston": [(0, 1.3), (1 + sw, 2.0)], "push": [(0, 1.0), (3 + sw, 1.6)],
                "and2": [(1 + sw, 2.2)], "two4": [(1, .8), (3, .8)], "rest": []}
        w = {"long": 1.2 + (2 if sustain else 0), "charleston": 2.0 * density, "push": 1.2 * density, "and2": 1.0 * density,
             "two4": .8 * density, "rest": .5}
        prev = None
        nbar = int(np.ceil((t1 - t0) / (4 * B)))
        for bi in range(nbar):
            keys = [k for k in pats if k != prev or k == "long"]
            pw = np.array([w[k] for k in keys]); k = keys[int(self.rng.choice(len(keys), p=pw / pw.sum()))]
            prev = k
            for off, ln in pats[k]:
                t = t0 + (bi * 4 + off) * B
                if t >= t1 - .1: continue
                beat_i = min(int(bi * 4 + off + .5), len(ch) - 1)                           # an anticipation takes the next chord
                ln = min(ln, (t1 - t) / B)
                self.chord_hit(self.h(t, .008), ch[beat_i], ln, vel, release=.4 if sustain else .22)

    def pad(self, t0, t1, bars, vel=.32, motor=.22):
        """sustained chords, one a bar (or two), the motor on: ballad colour"""
        B = self.B
        ch = self.per_beat(t0, t1, bars)
        bt = self.beats(t0, t1)
        for i, (k, t) in enumerate(bt):
            if i == 0 or ch[i] != ch[i - 1]:
                j = i + 1
                while j < len(bt) and ch[j] == ch[i]: j += 1
                ln = (bt[j][1] - t) / B if j < len(bt) else (t1 - t) / B
                self.chord_hit(self.h(t, .01), ch[i], ln, vel, roll=.03, release=.6)
        self.set_motor(t0, t1, motor)

    def set_motor(self, t0, t1, depth):
        a, b = int(t0 * SR), int(t1 * SR)
        k = int(.3 * SR)
        e = np.full(b - a, depth, np.float32)
        e[:k] *= np.linspace(0, 1, min(k, len(e)))[:len(e[:k])]
        self.motor[a:b] = np.maximum(self.motor[a:b], e)

    def fill(self, t0, t1, sym, vel=.36, direction=None, lo=62, hi=81):
        """a short answer between two lines: swung eighths and quarters from the chord's scale, ending long on a chord tone"""
        B, sw = self.B, self.sw
        r, q = chord(sym)
        scale = [p for p in range(lo, hi + 1) if (p - r) % 12 in SCALE[q]]
        tones = [p for p in scale if (p - r) % 12 in TONES[q]]
        span = t1 - t0
        if span < .6: return
        nn = int(np.clip(span / (B * .55), 3, 7))
        d = direction or (1 if self.rng.random() < .5 else -1)
        start = tones[int(self.rng.integers(len(tones) // 3, 2 * len(tones) // 3 + 1))]
        i = scale.index(start)
        seq = [start]
        for _ in range(nn - 2):
            step = d * (1 if self.rng.random() < .75 else 2)
            if self.rng.random() < .15: d = -d
            i = int(np.clip(i + step, 0, len(scale) - 1)); seq.append(scale[i])
        endt = min(tones, key=lambda p: abs(p - seq[-1]) + (0 if p != seq[-1] else 9))
        seq.append(endt)
        t, ts = t0, []
        for j in range(len(seq)):
            ts.append(t)
            t += B * (sw if j % 2 == 0 else (1 - sw)) * (2 if self.rng.random() < .2 else 1)
        if ts[-1] > t1 - .25:
            ts = list(np.linspace(t0, t1 - .35, len(seq)))
        for j, (p, tt) in enumerate(zip(seq, ts)):
            lastn = j == len(seq) - 1
            self.n("vibes", "vibraphone", p, self.h(tt, .008), B * (1.6 if lastn else .45), self.v(vel * (.85 + .3 * j / len(seq))), .3, release=.5 if lastn else .15)
        self.log.append(("fill", round(t0, 2), sym))

    # ------------------------------------------------------------------ MAGS and the button
    def jingle(self, t, vel=.32):
        """MAGS's signature: four glockenspiel notes, like a store chime (machine-even on purpose)"""
        for i, nm in enumerate(["C5", "F5", "A5", "C6"]):
            self.n("glock", "glockenspiel", audio.m(nm), t + i * .11, 1 * self.B, vel, .12, release=.9)

    def button(self, t, vel=.44, chord_sym="F69", bass="F2"):
        """the show's button: a xylophone run up, the trio lands one warm chord under it"""
        for i, nm in enumerate(["C5", "F5", "A5", "C6"]):
            self.n("xylo", "xylophone", audio.m(nm), t + i * .07, (.6 if i < 3 else 2) * self.B, vel, -.2 + i * .13, release=.3 if i < 3 else 1.2)
        self.last_voicing = None
        self.chord_hit(t + .28, chord_sym, 5, .34, roll=.02, release=1.4)
        self.bass_note(t + .28, bass, 4, .58, release=.8)
        self.set_motor(t + .28, t + 3.5, .18)

    # ------------------------------------------------------------------ the band in its room
    def render(self, gains=None):
        g = {"bass": 1.0, "brush": 1.0, "kit": 1.0, "vibes": 1.0, "glock": 1.0, "xylo": 1.0}
        g.update(gains or {})
        n = len(self.motor)
        tt = np.arange(n) / SR
        trem = 1 - self.motor * (.5 + .5 * np.sin(2 * np.pi * 4.6 * tt))
        self.st["vibes"] *= trem[:, None]
        mix = sum(self.st[k] * g[k] for k in self.st)
        mix = highpass(mix, 38)
        mix = small_room(mix, rt=.6, mix=.24, seed=21)
        return mix.astype(np.float32), self.st


def small_room(x, rt=.6, mix=.22, predelay=.008, seed=3, bright=7000):
    """a small room: a handful of early reflections (walls, floor, ceiling) and a short diffuse tail"""
    rng = np.random.default_rng(seed)
    n = int(rt * SR * 1.2)
    ir = np.zeros((n, 2), np.float32)
    for c in range(2):                                                           # early reflections, 4-28 ms
        for d, a in [(.0041, .55), (.0067, .45), (.0093, .38), (.0128, .3), (.0171, .24), (.0219, .2), (.0274, .15)]:
            i = int((d + rng.uniform(-.0012, .0012)) * SR)
            ir[i, c] += a * (1 if rng.random() < .7 else -1)
    env = np.exp(-6.9 * np.arange(n) / (rt * SR))
    tail = rng.standard_normal((n, 2)).astype(np.float32) * env[:, None] * .09
    tail[:int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))[:, None]
    ir += tail
    ir = lowpass(ir, bright)
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True)) + 1e-9
    pd = int(predelay * SR)
    wet = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    wet = np.concatenate([np.zeros((pd, 2), np.float32), wet[:len(x) - pd]])
    return (x * (1 - mix * .5) + wet * mix).astype(np.float32)
