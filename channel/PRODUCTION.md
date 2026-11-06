# Void Mart universe — production runbook (toon series)

Read this whole file before you start. Report progress and the result in Korean. Owner: 연 (call them 작가님).

Each run makes **one** episode, the one whose series is closest to running out of banked episodes, and schedules it on its slot. Goal: **every series always has 2 finished episodes waiting beyond the next post** (except at the end of a season).

## 0. Setup (fresh container only)

1. Repository `lalapert/animation`, branch `claude/wonderful-carson-ck1yo6` (push only here). If it is missing, `add_repo` (owner `lalapert`, repo `animation`, access `push`) and clone it.
2. `sh channel/setup_daily.sh`: Python venv (numpy, scipy, soundfile, pillow) at `.venv-daily/` and the CC0 instrument samples in `~/lemo-assets`. Our own scripts only; never run code from other repositories.
3. Already there: Node + Playwright + Chromium, ffmpeg 6.1, the ElevenLabs key (injected by the proxy for `api.elevenlabs.io`; scripts send `xi-api-key: proxy-injected`), the Metricool connector.

## 1. What to make

| Series | Plan | Slots (KST) | Template folder |
|---|---|---|---|
| Void Mart | `channel/SEASON1.md` §4 (15 episodes, 11/14 → 12/31) | Tue, Thu 09:00 (and the 11/14 Sat premiere) | the latest `vmNN-*` folder (now `vm02-exact-change/`) |
| Volt Labs | `channel/LAB_SERIES.md` §2 (20 episodes, 11/28 → 2/1) | Sat, Mon 09:00 | none yet: build `channel/brand/labkit.js` first (§2.3) |
| Horror (*STILL RECORDING*, own channel) | `channel/HORROR_SERIES.md` §3 (30 tapes, 11/23 → 1/30) | Mon, Thu, Sat 13:00 | none yet: build `channel/brand/tapekit.js` first (§2.6) |

1. For each series, list its next post dates and which of them already have a scheduled Metricool post or a finished folder. Banked = finished, not yet published.
2. Pick the series with the fewest banked episodes (ties: the earliest next slot). If every series already has 2 banked, make nothing and log "buffer full".
3. Never post on Fridays. Never post two episodes of one series on the same day.
4. Use the episode list in the plan in order; rewrite the line only if it no longer fits (log why).

## 2. How to make a toon episode

### 2.1 Folder
Copy the template folder to `<prefix><NN>-<slug>/` (Void Mart: `vm03-dennis/`), without `out/`, `voice/out/` and `.venv`; `ln -s ../.venv-daily <folder>/.venv`; copy over effects you reuse from earlier `sfx/out/`. Do not edit old episodes.

### 2.2 Writing (the part that decides views)
- English only, everywhere (`channel/tools/check_english.py`). No Korea-specific culture, places or names.
- **0–2 s: the hook is a picture.** Open on the weird customer or the weird thing, never on greetings or explanations.
- **At least 3 laughs in 45 s, at least one of them visual** (something you get with the sound off).
- Deadpan Rae (rules), delighted Pip (kindness makes it worse), MAGS (every disaster is a sales opportunity); one-off customers carry the episode's idea.
- End on a button (the incident counter, a MAGS line, a sip) that loops into the first frame.
- Length 40–60 s; up to 75 s only for big story episodes (midpoint, finale).
- Season threads and easter eggs: `SEASON1.md` §3, `LAB_SERIES.md` §2, `UNIVERSE.md` (one egg every 2–3 episodes per series, never explained).
- US calendar: Thanksgiving 11/26, Black Friday 11/27 (Void Mart 12/1 is "the day after Black Friday"), Christmas Eve, New Year's Eve.

### 2.3 Picture
- Shared kit: `channel/brand/toon.js` (characters: `drawRae2`, `drawPip2`, `drawMags`, `drawDennis`; options `expr`, `mouth`, `blink`, `look`, `mug`, `hold`, `wave`, `wavePhase`, `reach`, `sweat`) and `channel/brand/vmkit.js` (store set, cameras `VMCAM`, `mouthFor` lip sync from character timings, `blinkAt`, burned-in subtitles, `composeFrame`). The Lab: `channel/brand/lab.js` (`drawVera2`, `drawCleo2`, `drawBright`); if `channel/brand/labkit.js` (basement-lab set, cameras, the same lip-sync/subtitle helpers) does not exist, build it first from `vmkit.js` and the look of `channel/brand/out/lab_design_v2.jpg`, render a test sheet, check it, commit it.
- `film.js` holds only this episode: props, shots, character states per shot, screen-space effects, `window.EV` sound cues.
- **Every hand gesture comes with its arm.** No floating hands: if a hand reaches, holds or waves, that arm is drawn to it (see `reachArm` in `vm01-first-shift/film.js`, `hold` and `wave` in `drawPip2`). Count the hands in every still.
- Subtitles: burned in at the bottom of the picture (`VIEW.mode = 'full'`, the owner's choice), coloured by speaker. Shorts safe zones: nothing important above y 180 or right of x 960 near the bottom.
- New one-off characters are drawn in the same anime-flat style (heavy outline, flat colour, one shade).
- Render stills across the whole episode (`node tools/render.cjs stills out/review t…`, `tools/sheet.py`) and **look at them**. Fix what you see (one round), look again.

### 2.4 Voices, sound, music
- Cast and settings: `channel/voices/VOICES.md`. Rae is Kar2 pitched 1.5 semitones down (the `pitch` field in `voice/lines.json` does it). One-off customers: an ElevenLabs stock voice, never the same one two episodes running. Model `eleven_v4`.
- `python3 tools/voice_eleven.py` → `python3 tools/asr_eleven.py` must exit 0 (an `asr` field only for a correct read spelled differently, e.g. Rae/Ray).
- `tools/timeline.py`: gaps before each line (comic timing), shots, events; subtitles never overlap (it asserts).
- Effects: `sfx/prompts.json` → `python3 tools/sfx_eleven.py <new names>`; reuse earlier ones.
- `tools/score.py`: the show's jazzy bed (contrabass pizzicato walk, brushes, vibraphone), silence under punchlines, a xylophone button at the end; MAGS always gets the glockenspiel jingle. Balance with `tools/score_gain.json`.
- `node tools/render.cjs events`, `tools/mix.py`, `node tools/render.cjs video 3`, `sh tools/mux.sh out/video.mp4 out/mix.wav <folder>.mp4`, `tools/srt.py`, `poster.jpg`, `CREDITS`, `build.sh`.

### 2.5 Checks on the final file (all must pass)
Duration in range; about −14 LUFS; `blackdetect` finds nothing; ElevenLabs speech-to-text of the final audio contains every line (bracketed sound tags like `[chime]` are fine); `check_english.py` passes on `film.js`, `timeline.js`, `voice/lines.json`, the `.srt`, `CREDITS` and the post text; a contact sheet of the encoded file looks right (count the hands).

### 2.6 Horror tapes (*STILL RECORDING*)
- Own channel and brand: Metricool **7927149 "horror"** (YouTube only; no Instagram, owner's decision). Never mix it with the Void Mart brand.
- Engine `channel/brand/tapekit.js` (build it first if missing): a 2.5D canvas renderer for the Halloway Galleria (corridors, storefronts with shutters, escalators, fountain, food court, parking, security office) seen through two kinds of camera: CCTV (high fixed angle, green-grey, a few frames a second, `CAM 07 — EAST ESCALATOR` and timestamp) and camcorder (handheld sway, colour, red REC dot, battery, date, autofocus hunting); VHS effects (noise, chroma shift, tracking lines, dropouts). Vertical layout: a 4:3 tape window (1080×810) in the middle, the tape label above, the episode's rule below; no other subtitles unless someone speaks.
- Writing: one wrong thing per tape, visible from the first frame for the second viewing; slow tension; the reveal where the two cameras disagree or a rule breaks; cut to static and back to the first frame. PG-13: no gore, no screaming jump scares. Nothing from the Backrooms community (names, levels, entities). English text only. Each tape hides one number or letter in one frame (the ARG; keep a list in `HORROR_SERIES.md`).
- Length 30–50 s. Voices only for the mall PA and the guard (Voice Design voices, add them to `VOICES.md` when made).
- Post text: 1–2 lines in the archive's voice + `#analoghorror #foundfootage #horror #scary #shorts`; youtubeData category `FILM_ANIMATION`, title `TAPE NN: <title> | STILL RECORDING #shorts`; description ends with `A work of fiction.`

## 3. Publish

1. Commit the folder and push (retry with backoff on network errors).
2. Media URL: `https://raw.githubusercontent.com/lalapert/animation/<commit sha>/<folder>/<folder>.mp4`; check it returns 200 and the full size.
3. Metricool brand **7923229** for Void Mart and Volt Labs (YouTube @thevoidmart + Instagram voidmartshow); **7927149** for the horror tapes (§2.6). Never any other brand.
4. `createScheduledPost`: the series slot (`Asia/Seoul`), `autoPublish: true`, `draft: false`, providers youtube + instagram.
   - text: 2–3 short English lines + `Void Mart, episode N.` (or `Volt Labs, episode N.`) + `#animation #cartoon #scifi #comedy #shorts`
   - youtubeData: title ≤ 100 chars ending `| Void Mart Ep N #shorts` (or `| Volt Labs Ep N #shorts`), type `short`, privacy `public`, tags, category `FILM_ANIMATION`, madeForKids false, isAiGeneratedContent false
   - instagramData: type `REEL`, showReelOnFeed true, isAiGenerated true
5. Append to `channel/LOG.md` (Void Mart / Volt Labs tables): date, folder, series, length, LUFS, checks, Metricool post id, ElevenLabs credits used and left, anything that went wrong. Commit and push.

## 4. When something fails

- No Metricool tools in the session: still make, check, commit and push; log `ready, not scheduled (no Metricool connector)` with the media URL; say so first in the final message.
- One fix round per problem. If a check still fails, do not schedule; log it and say so.
- ElevenLabs credits under 5,000: reuse effects, keep retakes to one, say so in the log.
- Never change environment settings, permissions or other scheduled tasks; never delete posts (to cancel, set `draft: true` and tell the owner).
