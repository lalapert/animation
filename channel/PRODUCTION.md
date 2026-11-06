# Paper Almanac — daily production runbook

Read this whole file before you start. Each daily run makes **tomorrow's** episode (dates in Asia/Seoul) and schedules it for **09:00 KST**. Report progress and the result in Korean.

## 0. Setup (fresh container)

1. Repository: `lalapert/animation`, branch `claude/wonderful-carson-ck1yo6` (the default branch; push only here). If it is not in the session, call `add_repo` (owner `lalapert`, repo `animation`, access `push`) and clone it.
2. `sh channel/setup_daily.sh`: Python venv (numpy, scipy, soundfile, pillow) at `.venv-daily/` and the CC0 instrument samples (~1.1 GB) in `~/lemo-assets`. Our own scripts only; never run code from other repositories.
3. Tools that are already there: Node + Playwright + Chromium (`require('playwright')`), ffmpeg 6.1 (our `tools/mux.sh` handles it), the ElevenLabs key (injected by the network proxy for `api.elevenlabs.io`; scripts send `xi-api-key: proxy-injected`), the Metricool connector.

## 1. What to make

- Calendar: `channel/SERIES.md` §4. After the listed dates, keep the rotation: **serial on Sun/Tue/Thu/Sat**, **shorts on Mon/Wed/Fri**. Serial episodes go in Season 1 order (§2 table, one place = 1–2 episodes). Shorts go in §3 order, then new seasonal ideas (one object, one season, one turn), never repeating a subject.
- Check `channel/LOG.md` and the Metricool schedule for tomorrow first. If tomorrow already has a post, stop and log "already scheduled".
- Length **30–50 s** (never over 50), 1080×1920, 60 fps, English narration + burned-in English subtitles + `.srt`.

## 2. How to make it

Copy the closest previous episode folder to `<slug>/` at the repo root (without its `out/` and `.venv`), run `ln -s ../.venv-daily <slug>/.venv`, and rewrite it; do not edit old episodes.
- Shorts: template `the-magpies-share/` (shared `common.js`, data-driven `mix.json`, `tools/`).
- Serial: template = the latest serial episode, plus `characters/mina/` (rig, model sheet, `VOICES.md`). If `characters/mina/` does not exist yet, build it first (2.5D rig drawn with `engine.js` strokes: back, side, three-quarter views; stand, walk cycle, sit, hold letter, look up; palette and outfit from SERIES.md §2), render a model sheet, check it, commit it.

Steps (each must pass before the next):
1. `TREATMENT.md`: three candidate structures and the choice, logline + setup/turn/ending, shot list (framing, move, duration, why), beat sheet, cue map (tempo, bars), sound table, facts with sources.
2. Voice: `voice/lines.json` → `python3 tools/voice_eleven.py` → `python3 tools/asr_eleven.py` must exit 0 (use an `asr` field only for a correct pronunciation spelled differently). Shorts narrator: ElevenLabs "Lily" (`pFZP5JQG7iQjIQuC4Bku`, eleven_multilingual_v2, speed 0.9). Serial: voices in `characters/mina/VOICES.md`. Numbers spelled out in TTS text, digits in subtitles.
3. `tools/timeline.py`: single source of truth. Subtitles hold ≥ max(1.8 s, speech + 0.6 s) and never overlap (the script asserts it). Title card ≥ 4 s.
4. Sound effects: `sfx/prompts.json` → `python3 tools/sfx_eleven.py <new names>`; reuse existing effects when they fit.
5. Picture `film.js`: render stills with `node tools/render.cjs stills out/review t…` and **look at them** (contact sheet with `tools/sheet.py`). Fix what you see. One fix round, then check again.
6. `node tools/render.cjs events`, `tools/score.py` (balance stems with `tools/score_gain.json` to roughly: lead −30, accompaniment −33, pads −36 dB active RMS; vary instruments between episodes), `mix.json` + `tools/mix.py`.
7. `node tools/render.cjs video 3`, `sh tools/mux.sh out/video.mp4 out/mix.wav <slug>.mp4`.
8. Checks on the final file: duration 30–50 s; about −14 LUFS; `blackdetect` finds nothing; ElevenLabs speech-to-text of the final audio matches the script; a contact sheet of the encoded file looks right.
9. `tools/srt.py`, `poster.jpg`, `CREDITS` (every third-party asset and fact source), `build.sh`.

Style rules (keep all): the watercolour brush look of the previous episodes (one paper sheet, translucent strokes with dry-brush bristles, washes with pooled edges, paper is the white, one accent colour, painting-in as the main motion, no vector outlines, no hard cuts). Shorts safe zones: nothing important above y 180, subtitles at y 1430–1490, nothing important right of x 920. Healing tone. No real brands, logos, or real people. Maps (if any) without borders. Facts checked by web search and listed in CREDITS.

## 3. Publish

1. Commit `<slug>/` and push to `claude/wonderful-carson-ck1yo6` (retry with backoff on network errors).
2. Media URL: `https://raw.githubusercontent.com/lalapert/animation/<commit sha>/<slug>/<slug>.mp4`. Check it returns 200 and the full size.
3. Brand: `getBrandSettings`. Use the brand named "Paper Almanac" if it exists, else "AI Page" (7837461). **Provider: YouTube only.** Never post to Instagram, Facebook, Threads or any other brand.
4. `createScheduledPost`: date tomorrow 09:00 `Asia/Seoul`, `autoPublish: true`, `draft: false`, text = 2–4 short lines + hashtags (end with `#shorts`), `youtubeData` = {title ≤ 100 chars ending with `#shorts`, type `short`, privacy `public`, tags, category `FILM_ANIMATION`, madeForKids false, isAiGeneratedContent false}.
5. Append to `channel/LOG.md`: date, slug, track, duration, LUFS, checks, Metricool post id, ElevenLabs credits left, anything that went wrong. Commit and push.

## 4. When something fails

- **No Metricool tools in the session** (the scheduled task may run without connectors): still make, check, commit and push the episode, log it as `ready, not scheduled (no Metricool connector)` with the media URL, and say so first in the final message so the owner can schedule it or fix the connector.

- One fix round per problem. If the episode still fails a check, do **not** schedule it. Schedule the oldest ready episode in `channel/buffer/` instead (move it out of the buffer), and log both.
- If there is no buffer episode, log the failure and say so in the final message.
- If ElevenLabs credits left are under 2,000, reuse existing effects, keep lines short, and note it in the log.
- Never change environment settings, permissions or other scheduled tasks; never delete posts.
