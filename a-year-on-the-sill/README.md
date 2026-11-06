# A Year on the Sill

창가의 작은 레몬나무가 꽃 스물세 송이로 시작해 레몬 하나를 얻기까지의 1년. 수채화 붓(Watercolor Brush) 스타일, YouTube Shorts 세로 영상.

- 영상: `a-year-on-the-sill.mp4` (1080×1920, 60fps, 90초, −14 LUFS)
- 자막: `a-year-on-the-sill.srt` (영상에는 번인되어 있음)
- 포스터: `poster.jpg`
- 기획: `TREATMENT.md` (구조 후보, 샷 리스트, 큐 맵, 사운드 표, 제작 메모, 데모 비교)
- 출처와 라이선스: `CREDITS`

## 다시 만들기

```sh
sh build.sh
```

Node 20+와 Playwright(Chromium), ffmpeg, Python 3.11+(또는 uv)가 필요합니다. 내레이션과 효과음은 이미 생성해 둔 파일(`voice/out/`, `sfx/out/`)을 씁니다. 처음 실행할 때 CC0 악기 샘플 약 1.1GB를 내려받습니다.

## 구성

| 파일 | 역할 |
|---|---|
| `index.html`, `engine.js`, `film.js` | 그림 전체. 수채 붓 엔진(리본 획 + 드라이브러시 털 자국, 3겹 워시), 장면, 카메라, 메모, 자막. `render(t)`는 시간에 대한 순수 함수 |
| `tools/timeline.py` | 템포, 마디, 대사 위치, 모든 큐의 단일 기준 → `timeline.js` |
| `tools/render.cjs` | 헤드리스 Chromium 프레임 캡처(스틸, 이벤트, 영상) |
| `tools/score.py`, `tools/audio.py` | 샘플 악기로 연주한 오리지널 스코어 |
| `tools/mix.py` | 내레이션 + 스코어 + 효과음 + 앰비언스, 덕킹과 리버브 |
| `tools/mux.sh` | 2패스 라우드니스 정규화 후 최종 인코딩 |
| `tools/voice_eleven.py`, `tools/asr_eleven.py`, `tools/sfx_eleven.py` | ElevenLabs 내레이션 생성, 받아쓰기 검수, 효과음 생성 |

대사를 고치려면 `voice/lines.json`을 수정하고 `tools/voice_eleven.py <ID>`로 해당 라인만 다시 만든 뒤 `sh build.sh`를 실행하세요.
