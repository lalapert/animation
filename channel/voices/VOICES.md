# 보이스 (2026-11-06)

## 고정 (작가님 선택, 2026-11-06)
모델은 모두 eleven_v4. 저장한 보이스는 eleven_v4에서 짧은 문장으로 시험해 받아쓰기까지 확인함.

| 인물 | 시리즈 | 보이스 (계정 이름 / ID) | 설정과 후처리 |
|---|---|---|---|
| Rae | Void Mart | Kar2 `oy557F0mOsPZZqdz8oK6` | stability 0.6, style 0.2, speed 0.9 (11/7부터, 감정 연기). **믹서에서 1.5반음 낮춤**(샘플 B 선택) |
| Pip | Void Mart | Win2 `BiP91t4ozM9IZajOdSu2` | stability 0.3, style 0.65, speed 1.05 (11/7부터, 감정 연기) |
| MAGS | Void Mart | VM MAGS `WkUURyKtbzB9IM50qGdP` | 디자인 후보 3 |
| Dennis | Void Mart | VM Dennis `4vRkwG6IFLYddvxhEKmU` | 디자인 후보 2 |
| Vera | Volt Labs | LAB Vera Volt `buRySvQEB2e8Dcglym6i` | 디자인 후보 1 |
| Cleo | Volt Labs | LAB Cleo `biUhGlVm4NoNe58piPit` | 디자인 후보 2 |
| Sterling Bright | Volt Labs | LAB Sterling Bright `g5QiE8eJceeEcuPGC2IM` | 디자인 후보 1 |
| Mall PA (관내 방송) | STILL RECORDING | HA Mall PA `ZPgDKQUoTzQKZTHhQYAM` | 디자인 후보 3(가장 느리고 차분함). 믹서에서 구형 스피커·넓은 홀 울림 처리 |

- 보이스 슬롯 8/10 사용. 남은 2개는 새 반복 인물용.
- 한 번만 나오는 손님은 ElevenLabs 기본 보이스를 쓰고, 같은 보이스를 연달아 쓰지 않는다.
- 디자인 설명과 시험 문장: `design.json`. 후보 기록: `previews/<이름>.json`, `previews/<이름>_choose_1-2-3.mp3`. 주고받기 샘플: `previews/duo_A.mp3`, `previews/duo_B.mp3`(채택).

## 크레딧
- 보이스 디자인 5명(후보 15개) 451, 주고받기 샘플 355, 저장·확인 약 70. 이번 달 사용 약 7,670 / 39,050 (12/5 초기화).

## 감정 연기 (작가님 결정, 11/7)

- 모든 대사 앞에 eleven_v4 오디오 태그를 넣는다. Pip, Vera, MAGS, 손님은 크게, Rae와 Cleo는 무표정을 지키는 선에서 작게.
- 설정: Pip 0.3/0.65, Vera 0.3/0.7, MAGS 0.45/0.5, 손님 0.4/0.5, Rae 0.6/0.2, Cleo 0.6/0.25 (stability/style).
- 태그 때문에 없는 말이 붙으면(예: "Oh,", "No!") 받아쓰기 검사가 잡는다. 한 번 다시 뽑고, 그래도 안 되면 그 줄은 태그를 빼고 설정만 푼다.
- 비교 샘플: `voices/emotion_test/before_after.mp3`. 1화(*First Shift*)는 예전 연기 그대로 두고 2화부터 새 연기.
