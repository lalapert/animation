"""The Volt Labs band: one small, warm, mischievous band that is the show's sound (owner 11/13: fitting, natural music).
Shared by Volt Labs 4-6 (the same file in each episode's tools/; score.py holds only the episode's cue sheet).

The band (CC0 samples, VSCO 2 CE / VCSL): contrabass pizzicato (bass, a two-feel), viola and cello pizzicato (the soft off-beat
"pom" chords), clarinet in its low register (the tune), bassoon staccato (counter-line, the grumpy stomp), brushes (snare taps
through a felt filter plus a swirl of filtered noise) and a shaker. D minor, swung 8ths, every note humanised (timing sd 7 ms,
velocity +-7 %), the whole band in a small room.

The music follows the scene. A cue starts its own bar grid on a scene beat (a cut, an action), plays one texture and ends
either on a cadence (the last note rings out) or dead (a 25 ms fade right before a punchline: silence lands the joke).
Hits are band unisons (no orchestra stabs, no timpani, no cymbal swells); an episode gets two or three at most.

  from band import Band
  b = Band(dur, bpm=132)
  b.cue(0.0, 6.9, "theme", end="cadence", bars=["A1", "A2", "scan", "scanend"])
  b.cue(9.45, 13.198, "build", end="cut", rise=(11.6, 13.2))          # speed=1.5 runs a cue faster (a montage)
  b.hit(21.82, "uhoh")
  mus = b.render()                      # stereo float32, DUR long; b.cues lists what played (for the record)

Textures: theme (the tune, bars A1 A2 B1 B2 cycle, or a list), scan (clarinet staccato arpeggios, light), tiptoe (bass and
pom chords only, sneaky), build (a pedal of 8ths that grows into a crescendo between rise=(a, b)), grump (a heavy staccato
stomp in octaves), scurry (a fast pizzicato run downward, panned along a move), tag (the tune's first bar, then the button).
Hits: uhoh (a semitone fall, low unison), button (dominant to tonic, "dun-DUN"), ta (a bright little "ta-da" for a reveal).
"""
import os, sys
import numpy as np
from fractions import Fraction
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio
from audio import SR, note, m, lowpass, highpass, bandpass, room

# the band on a small stage: pan, and the stem each instrument plays into
PAN = {"bass": -.05, "pom": .3, "lead": -.25, "low": .2, "perc": -.1, "shk": .35}
STEM_DB = {"bass": -1.0, "pom": -5.0, "lead": 0.0, "low": -3.0, "perc": -9.0, "shk": -17.0}

# chord tones for the pizzicato "pom" (violas / cellos) and the bass roots
CH = {"Dm": ["D3", "F3", "A3"], "Gm": ["D3", "G3", "Bb3"], "A7": ["C#3", "E3", "G3"], "F": ["C3", "F3", "A3"],
      "Bb": ["D3", "F3", "Bb3"], "E7": ["D3", "E3", "G#3"]}
ROOT = {"Dm": ("D2", "A1"), "Gm": ("G1", "D2"), "A7": ("A1", "E2"), "F": ("F1", "C2"), "Bb": ("Bb1", "F2"), "E7": ("E2", "B1")}

# the theme, four bars, in beats inside the bar: (beat, note, length in beats, accent)
TUNE = {
    "A1": [(0, "A3", .45, .8), (.5, "D4", .45, .9), (1, "E4", .45, .8), (1.5, "F4", .45, .85), (2, "G#4", .45, .9), (2.5, "A4", .95, 1.0)],
    "A2": [(0, "Bb4", .45, .9), (.5, "A4", .45, .8), (1, "G4", .45, .8), (1.5, "E4", .45, .8), (2, "F4", .45, .85), (2.5, "E4", .45, .8), (3, "D4", .8, .95)],
    "B1": [(0, "C5", .45, .9), (.5, "A4", .45, .8), (1, "F4", .45, .8), (1.5, "A4", .45, .85), (2, "G#4", .45, .9), (2.5, "A4", .95, 1.0)],
    "B2": [(0, "Bb4", .45, .9), (.5, "G4", .45, .8), (1, "E4", .45, .8), (1.5, "C#4", .45, .85), (2, "D4", 1.4, .95)],
}
# harmony per bar: (beat, chord)
HARM = {"A1": [(0, "Dm")], "A2": [(0, "Gm"), (2, "A7"), (3, "Dm")], "B1": [(0, "F"), (2, "A7")], "B2": [(0, "Gm"), (1, "A7"), (2, "Dm")],
        "scan": [(0, "Dm"), (2, "Bb")], "scanend": [(0, "Gm"), (2, "A7"), (3, "Dm")]}
ORDER = ["A1", "A2", "B1", "B2"]


class Band:
    def __init__(self, dur, bpm=132.0, swing=.58, seed=1, transpose=0):
        self.dur, self.B, self.swing, self.tr = dur, 60.0 / bpm, swing, transpose
        self.n = int((dur + 4) * SR)
        self.rng = np.random.default_rng(seed)
        self.parts = []          # (buffer, envelope spec)
        self.cues = []
        self.hits = 0
        self._lim = 1e9          # nothing starts after this (the current cue's end)

    # ------------------------------------------------------------ low level
    def _buf(self):
        return {k: np.zeros((self.n, 2), np.float32) for k in PAN}

    def _t(self, t0, beat, swing=True):
        """beat (in beats from the cue's start) -> seconds, with swung 8ths and a human push/pull"""
        whole, frac = divmod(beat, 1.0)
        if swing and abs(frac - .5) < 1e-6:
            frac = self.swing
        jitter = float(np.clip(self.rng.normal(0, .007), -.016, .016))
        return t0 + (whole + frac) * self.B + jitter

    def _note(self, S, stem, inst, name, t, beats, vel, pan=None, release=None, attack=0.0, lp=None):
        if t > self._lim:
            return
        midi = m(name) + self.tr
        vel = float(np.clip(vel * (1 + self.rng.normal(0, .07)), .05, 1.0))
        y = note(inst, midi, beats * self.B, vel, release=release, attack=attack)
        if lp:
            y = lowpass(y, lp)
        p = PAN[stem] if pan is None else pan
        audio.add(S[stem], y, t, 1.0, p + float(self.rng.normal(0, .04)))

    def _perc(self, S, inst, var, t, vel, stem="perc", lp=None, pan=None):
        if t > self._lim:
            return
        Z = [z for z in audio.index()[inst]["zones"] if var == (z.get("var") or "")]
        z = Z[int(self.rng.integers(len(Z)))]
        x, s = audio._sample(z["f"])
        x = x[z.get("on", 0):int(z.get("on", 0) + 1.2 * s)]
        if s != SR:
            fr = Fraction(SR, s).limit_denominator(1000)
            x = signal.resample_poly(x, fr.numerator, fr.denominator).astype(np.float32)
        x = x * (.12 / max(z.get("rms", .05), 1e-4)) * vel * (1 + self.rng.normal(0, .08))
        if lp:
            x = lowpass(x, lp)
        f = int(.03 * SR); x[-f:] *= np.linspace(1, 0, f)
        audio.add(S[stem], x.astype(np.float32), t, 1.0, PAN[stem] if pan is None else pan)

    def _swirl(self, S, t, beats, vel):
        """a brush swirl on the head: filtered noise that swells and falls once per half bar"""
        if t > self._lim:
            return
        n = int(min(beats * self.B, self._lim + .3 - t) * SR)
        z = self.rng.standard_normal(n).astype(np.float32)
        z = bandpass(z, 1800, 7500, 2)
        ph = np.linspace(0, 1, n)
        env = (np.sin(np.pi * ph) ** 1.5) * (.6 + .4 * np.sin(2 * np.pi * ph * 2 + 1)) ** 2
        y = z * env.astype(np.float32) * .05 * vel
        audio.add(S["perc"], y, t, 1.0, PAN["perc"] - .1)

    # ------------------------------------------------------------ textures
    def _rhythm(self, S, t0, beat0, chords, lvl, brushes=True, shaker=True, pom=True, bass=True, walk=True):
        """bass two-feel, pom chords on 2 and 4, brushes and shaker, for one bar starting at beat0"""
        for (b, ch), nxt in zip(chords, chords[1:] + [(4, None)]):
            span = nxt[0] - b
            r, f = ROOT[ch]
            if bass:
                self._note(S, "bass", "contrabass_pizz", r, self._t(t0, beat0 + b), 1.6, .62 * lvl, release=.25)
                if span >= 2 and walk:
                    self._note(S, "bass", "contrabass_pizz", f, self._t(t0, beat0 + b + 2), 1.4, .5 * lvl, release=.25)
            for pb in (1, 3):
                if pom and b <= pb < b + span:
                    tt = self._t(t0, beat0 + pb)
                    for k, nm in enumerate(CH[ch]):
                        self._note(S, "pom", "violas_pizz" if k else "cellos_pizz", nm, tt + .006 * k, .5, .42 * lvl, release=.15)
        for i in range(8):
            bt = beat0 + i * .5
            if shaker:
                self._perc(S, "shaker", "down" if i % 2 == 0 else "up", self._t(t0, bt), (.55 if i % 2 == 0 else .4) * lvl, stem="shk")
            if brushes and i in (2, 6):
                self._perc(S, "snare2", "taps", self._t(t0, bt), .55 * lvl, lp=3800)
            if brushes and i in (3, 7) and self.rng.random() < .5:
                self._perc(S, "snare2", "taps", self._t(t0, bt), .22 * lvl, lp=3000)
        if brushes:
            self._swirl(S, self._t(t0, beat0), 2, lvl); self._swirl(S, self._t(t0, beat0 + 2), 2, lvl)

    def _tune(self, S, t0, beat0, bar, lvl, inst="clarinet"):
        for b, nm, ln, acc in TUNE[bar]:
            self._note(S, "lead", inst, nm, self._t(t0, beat0 + b), ln, .62 * acc * lvl, release=.18, attack=.012)

    def cue(self, t0, t1, kind, end="cadence", level=1.0, bars=None, rise=None, pan=(0.6, -0.6), fade=.4, until=None, speed=1.0):
        B0 = self.B
        self.B = B0 / speed                                    # a cue can run faster (a time-lapse montage) on its own grid
        try:
            self._cue(t0, t1, kind, end, level, bars, rise, pan, fade, until)
        finally:
            self.B = B0
        self.cues[-1]["speed"] = speed

    def _cue(self, t0, t1, kind, end, level, bars, rise, pan, fade, until):
        S = self._buf()
        nb = int(np.ceil((t1 - t0) / (4 * self.B) + 1e-6))
        last = t1 - (0.0 if end == "cut" else .05)          # cadence: nothing starts after t1
        self._lim = last
        bars = bars or [ORDER[i % 4] for i in range(nb)]

        def ok(beat):
            return t0 + beat * self.B < last

        if kind in ("theme", "scan", "tiptoe"):
            for i in range(nb):
                bar = bars[i % len(bars)]
                if not ok(i * 4):
                    break
                hm = HARM.get(bar, HARM["A1"])
                self._rhythm(S, t0, i * 4, hm, level, brushes=kind != "tiptoe", shaker=True)
                if kind == "theme" and bar in TUNE:
                    self._tune(S, t0, i * 4, bar, level)
                if kind == "scan" or bar in ("scan", "scanend"):
                    arp = {"Dm": ["D4", "F4", "A4", "F4"], "Bb": ["D4", "F4", "Bb4", "F4"], "Gm": ["D4", "G4", "Bb4", "G4"], "A7": ["C#4", "E4", "G4", "E4"]}
                    for b in range(8):
                        ch = [c for bb, c in hm if bb <= b * .5][-1]
                        if bar == "scanend" and b >= 6:
                            break
                        self._note(S, "lead", "clarinet_stac", arp[ch][b % 4], self._t(t0, i * 4 + b * .5), .4, .4 * level, release=.1)
                    if bar == "scanend":
                        self._note(S, "lead", "clarinet", "D4", self._t(t0, i * 4 + 3), 1.0, .5 * level, release=.4, attack=.01)
                # drop what would start after the cue's end
        elif kind == "build":
            a, b = rise or (t0 + (t1 - t0) / 2, t1)
            k, beat = 0, 0.0
            clim = ["A3", "Bb3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4"]
            while ok(beat):
                t = self._t(t0, beat, swing=False)
                g = float(np.clip((t - a) / max(b - a, 1e-3), 0, 1))
                v = (.35 + .55 * g) * level
                self._note(S, "bass", "contrabass_pizz", "D2", t, .45, v, release=.12)
                if int(beat * 2) % 2 == 0 or g > .3:
                    self._note(S, "low", "bassoon_stac", "D3" if int(beat) % 2 == 0 else "A2", t, .4, v * .8, release=.1)
                if g > .5:
                    self._perc(S, "snare2", "taps", t, .35 * g * level, lp=4500)
                    self._perc(S, "snare2", "taps", t + self.B / 4, .25 * g * level, lp=4500)
                if g > 0 and abs(beat - round(beat)) < 1e-6:
                    self._note(S, "lead", "clarinet", clim[min(k, len(clim) - 1)], t, 1.05, (.3 + .5 * g) * level, release=.08, attack=.03)
                    k += 1
                beat += .5 if g < .6 else .25
        elif kind == "grump":
            stomp = ["D2", "D2", "Bb1", "A1"]
            for i in range(nb * 4):
                if not ok(i):
                    break
                t = self._t(t0, i, swing=False)
                nm = stomp[i % 4]
                self._note(S, "bass", "contrabass_pizz", nm, t, .5, .7 * level, release=.12)
                self._note(S, "low", "bassoon_stac", nm[:-1] + str(int(nm[-1]) + 1), t, .45, .62 * level, release=.1)
                if i % 4 == 3 and ok(i + .5):
                    self._note(S, "lead", "clarinet_stac", "G#3", self._t(t0, i + .5), .3, .4 * level, release=.08)
            if ok(0):
                self._swirl(S, t0, 4, .5 * level)
        elif kind == "scurry":
            run = ["D6", "C6", "A5", "G5", "F5", "E5", "D5", "C#5", "A4", "G4", "F4", "E4", "D4", "C#4", "A3", "G3"]
            n_ = int((t1 - t0) / (self.B / 4))
            for i in range(min(n_, len(run) * 2)):
                t = t0 + i * self.B / 4 + float(np.clip(self.rng.normal(0, .004), -.01, .01))
                if t >= last:
                    break
                k = i / max(n_ - 1, 1)
                p = pan[0] + (pan[1] - pan[0]) * k
                nm = run[min(i, len(run) - 1)]
                inst = "violins_pizz" if m(nm) >= 55 else "cellos_pizz"
                self._note(S, "pom", inst, nm, t, .3, (.62 - .35 * k) * level, pan=p, release=.1)
                if i % 2 == 0:
                    self._perc(S, "shaker", "down" if i % 4 == 0 else "up", t, (.5 - .3 * k) * level, stem="shk", pan=p)
                if i % 4 == 0:
                    self._note(S, "bass", "contrabass_pizz", ["D3", "A2", "F2", "D2", "A1", "D2"][min(i // 4, 5)], t, .4, .5 * level * (1 - .4 * k), release=.1)
        elif kind == "tag":
            self._rhythm(S, t0, 0, HARM["A1"], level)
            self._tune(S, t0, 0, "A1", level)
        else:
            raise ValueError(kind)
        self._lim = 1e9
        self.parts.append((S, t0, t1, end, fade, until))
        self.cues.append({"t0": round(t0, 3), "t1": round(t1, 3), "kind": kind, "end": end, "level": level})

    def hit(self, t, kind="button", level=1.0, until=None):
        """a band unison accent: uhoh (Eb-D fall), button (A-D, the 'dun-DUN' on the downbeat t), ta (a bright up-flourish)"""
        self.hits += 1
        assert self.hits <= 3, "at most three music hits an episode"
        S = self._buf()
        if kind == "uhoh":
            for k, (nm, dt) in enumerate([("Eb", 0.0), ("D", .26)]):
                self._note(S, "bass", "contrabass_pizz", nm + "2", t + dt, .5, .75 * level, release=.2)
                self._note(S, "low", "bassoon_stac", nm + "3", t + dt, .45, .7 * level, release=.15)
                self._note(S, "lead", "clarinet_stac", nm + "4", t + dt, .4, .45 * level, release=.12)
        elif kind == "button":
            pre = t - .5 * self.B
            for nm2, nm3, nm4, tt, v in [("A1", "A2", "A3", pre, .55), ("D2", "D3", "D4", t, .8)]:
                self._note(S, "bass", "contrabass_pizz", nm2, tt, 1.0 if tt == t else .4, v * level, release=.6 if tt == t else .1)
                self._note(S, "low", "bassoon_stac", nm3, tt, .45, v * .9 * level, release=.2)
                self._note(S, "lead", "clarinet_stac", nm4, tt, .4, v * .7 * level, release=.15)
            for k, nm in enumerate(CH["Dm"]):
                self._note(S, "pom", "violas_pizz" if k else "cellos_pizz", nm, t + .008 * k, .6, .5 * level, release=.4)
            self._perc(S, "snare2", "taps", t, .5 * level, lp=4000)
        elif kind == "ta":
            for k, nm in enumerate(["D4", "F4", "A4", "D5"]):
                self._note(S, "lead", "clarinet_stac", nm, t + k * .07, .3 if k < 3 else .8, (.45 + .1 * k) * level, release=.2)
            self._note(S, "bass", "contrabass_pizz", "D2", t + .21, .8, .7 * level, release=.4)
            for k, nm in enumerate(CH["Dm"]):
                self._note(S, "pom", "violas_pizz" if k else "cellos_pizz", nm, t + .21 + .008 * k, .6, .45 * level, release=.3)
        else:
            raise ValueError(kind)
        self.parts.append((S, t - .3, t + 3, "cadence", 0, until))
        self.cues.append({"t0": round(t, 3), "kind": "hit:" + kind, "level": level})

    # ------------------------------------------------------------ the room
    def render(self, stem_db=None):
        """each cue through the room on its own, then its ending: 'cut' stops dead (25 ms) at t1, room and all, so the punchline
        after it starts in silence; 'fade' fades over the last `fade` s; 'cadence' rings out, but is silent by `until` if given"""
        sd = dict(STEM_DB, **(stem_db or {}))
        out = np.zeros((self.n, 2), np.float32)
        for S, t0, t1, end, fade, until in self.parts:
            x = sum(S[k] * 10 ** (sd[k] / 20) for k in S)
            a = max(0, int((t0 - .05) * SR))                   # nothing before the cue (jitter / pickups)
            x[:a] = 0
            x = highpass(x, 45)
            x = room(x, size=.12, mix=.22, predelay=.012, damp=.45, seed=5)   # a small room: the band is in the lab with them
            stop = {"cut": (t1, .025), "fade": (t1, fade)}.get(end, (until, .3) if until else None)
            if stop:
                i, f = int(stop[0] * SR), int(stop[1] * SR)
                x[max(0, i - f):i] *= np.linspace(1, 0, min(f, i))[:, None]; x[i:] = 0
            out += x
        n = int(self.dur * SR)
        out = out[:n]
        f = int(.02 * SR); out[-f:] *= np.linspace(1, 0, f)[:, None]
        return out
