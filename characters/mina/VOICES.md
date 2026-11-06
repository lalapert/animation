# Open When You Get There — voices (ElevenLabs, eleven_multilingual_v2)

| 역할 | 보이스 | voice_id | 설정 | 이유 |
|---|---|---|---|---|
| 미나 (1인칭 내레이션) | Sarah, Mature, Reassuring | `EXAVITQu4vr4xnSDxMaL` | stability 0.6, style 0.15, speed 0.92 | 젊지만 차분하다. 단편 내레이터 Lily와 구분된다 |
| 테오 (편지 낭독) | Will, Relaxed Optimist | `bIHbv24MWmeRgasZH58o` | stability 0.55, style 0.2, speed 0.95 | 장난스럽고 다정한 편지 톤 |

- 편지 낭독은 살짝 먼 소리로 믹스한다(하이패스 200 Hz, 작은 리버브 0.25).
- 첫 화에서 두 목소리를 확정한 뒤 바꾸지 않는다.

# 미나 그리기

- `mina.js`의 `drawMina(c, x, y, h, { view, expr, hold, walk, t })`와 `drawMinaHead(c, x, y, r, view, expr, t)`를 쓴다.
- view: `front`, `tq`(왼쪽을 보는 3/4), `side`, `back`. expr: `calm`, `smile`, `sad`, `surprised`, `cry`, `laugh`.
- 모델 시트: `model_sheet.jpg`(sheet.html로 다시 렌더).
- 모든 부위는 종이를 먼저 깔고 칠한다. 어두운 배경에서도 색이 유지된다.
- 강조색은 봉투의 주홍 밀랍 봉인 하나다.
