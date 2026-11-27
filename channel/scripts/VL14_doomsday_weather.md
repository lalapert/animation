# Volt Labs 14화 *Doomsday Weather* (12/4 금 10:00 KST = 미국 목요일 저녁, length_test: current, 목표 40~42초, 엔드 카드 2.5초 포함)

한 줄: Vera가 옥상에 종말의 날씨 기계를 세웠다. 목표는 80억 인구의 영원한 겨울. 옆에서 Cleo는 썰매를 들고 서 있다. 레버를 당기자 기계에서 나온 건 손바닥만 한 구름 하나. 구름은 옥상 너머로 떠내려가 건물 뒷마당 한 칸에만 눈을 뿌린다(옆집들은 해가 쨍쨍). "Not the yard! The PLANET!" "It's a start." 화가 난 Vera가 출력을 MAX로 올리자 뒷마당 눈더미가 옥상 높이까지 쌓인다. Cleo가 썰매를 눈더미에 내려놓는다. "Get in." "A villain does not go sledding." 바로 다음 컷: 썰매가 옥상에서 뒷마당까지 미끄러져 내려가고 Vera가 두 팔을 들고 "Wheeeee!" 눈 속에 허리까지 파묻혀서: "Again! Again! I mean... phase two." "Sure."

## 0. 지금까지 통한 것과 이 편에서 쓰는 법

- 인스타 3초 유지율이 가장 높은 편은 큰 얼굴이나 큰 개그 물건으로 시작한 편(6화 78.9%, 7화 81.4%). **첫 프레임은 개그 그림**: 옥상, 거대한 기계와 그 위 현수막 DOOMSDAY WEATHER MACHINE, 기계 화면 TARGET: 8 BILLION PEOPLE, 레버를 잡고 음흉하게 웃는 Vera, 그 옆에서 빨간 썰매를 세워 들고 무표정한 Cleo. 소리 없이도 "종말 기계 옆에 썰매 든 조수"가 읽힌다. 썰매는 끝까지 이야기의 중심이다(구름 → 눈 → 썰매 타기 → 눈더미 속 썰매).
- 길이: **length_test: current** (PRODUCTION §2.2, Volt Labs 14는 current, 15는 short). 40~45초, Volt Labs 42초 이하(엔드 카드 포함). timeline.py가 `40 <= DUR <= 42`를 확인한다.
- **Look 2** (작가님 11/22, 이 편부터): `TL.LOOK = 2`, `TL.ACT` 8개 이상, SHOT2 클로즈업(CLEO_CU, VERA_CU), 어깨 너머(OTS_CLEO: Cleo 어깨 너머로 Vera), 개그 물건 인서트(INSERT: 기계 화면과 출력 바늘), 가장 큰 펀치라인 줌인(VERA_PUSH: "A villain does not go sledding."에서 밀고 들어가다가 바로 썰매 컷), 같은 구도 연속 3번 금지(shotlint). 몸이 화면을 가로지르는 움직임 3번: 작은 구름이 기계에서 나와 화면을 가로질러 옥상 너머로 떠내려간다, Cleo가 썰매를 눕혀 눈더미 위로 밀어 놓는다, 썰매가 옥상에서 뒷마당까지 화면을 대각선으로 가로질러 내려간다.
- 댓글(작가님 11/16): 끝 화면 `TL.ASK` = `DOOM OR SNOW DAY?`, 캡션 첫 줄도 같은 두 선택지 + "Tell me.", 첫 댓글 "Doom or snow day?". 끝 화면 동안 얼굴과 썰매는 y 780 아래.
- 바깥 편(3편에 1편, LAB_SERIES §2: 옥상, 뒷마당). 11화가 바깥, 12·13화가 실험실. 칠판은 나오지 않는다 → PAY RENT 동그라미는 이 편에서 보이지 않는다(11화와 같은 처리. 14화가 끝날 때 15개가 되는 셈은 다음 실험실 편에서 이어 센다).
- 몸 규칙: 옥상에서는 둘 다 옥상 난간(벽돌 파라펫) 뒤, 허리 아래는 난간에 가려진다. 썰매 컷에서는 작게 잡히고 썰매 몸통이 허리 아래를 가린다. 뒷마당에서는 눈더미에 허리까지 파묻혀 있다. 다리는 한 번도 보이지 않는다.
- 동물: 없음(배경 옆집 마당의 분홍 플라밍고 튜브는 장난감).

## 1. 영미권 관객 점검

| 항목 | 점수 | 근거와 고칠 점 |
|---|---|---|
| 첫 2초 그림 훅 | 5 | 거대한 종말 기계(현수막 DOOMSDAY WEATHER MACHINE, 화면 TARGET: 8 BILLION PEOPLE) 옆에서 썰매를 든 무표정 조수. 소리 없이 읽히고 "왜 썰매?"가 바로 생긴다. 길이 current 40~42초 |
| 설정이 한 줄로 이해되는가 | 5 | "세상을 얼리려던 날씨 기계가 자기 집 뒷마당에만 눈을 뿌린다" |
| 공감 | 5 | 눈 오는 날 썰매, 동네에서 우리 집만 이상한 날씨. 미국·영국 아이들 누구나 아는 snow day |
| 웃음 밀도 | 5 | 1) 종말 기계 옆 썰매 든 Cleo(그림) 2) "I brought a sled." 3) 레버를 당기자 나온 손바닥만 한 구름(그림) 4) 내려다보니 우리 마당만 눈, 옆집은 수영장과 플라밍고(그림) 5) "It's a start." 6) MAX: 눈더미가 옥상 높이까지(그림) 7) "A villain does not go sledding." → 바로 썰매 타며 "Wheeeee!"(그림, 스매시 컷) 8) "Again! Again! I mean... phase two." 9) "Sure." |
| 애니메이션 (Look 2) | 5 | `TL.LOOK = 2`, `TL.ACT` 12개(리액션과 펀치라인 듣는 사람 모두), CU 3번·OTS 1번·인서트 1번·줌인 1번, shotlint 경고 0, 몸이 화면을 가로지르는 움직임 3번(구름, 썰매 눕히기, 썰매 하강) |
| 첫 장면 약속을 끝까지 지키는가 | 5 | 첫 프레임의 기계와 썰매가 끝까지 중심. 기계 → 구름 → 눈 → 썰매 → 눈더미 속 썰매. 말장난으로 갈아타지 않고 개그 절반 이상이 그림 |
| 영어가 자연스러운가 | 5 | 짧은 미국 말투: "I brought a sled.", "It's a start.", "Get in.", "Sure." |
| 아는 사람만 아는 문화 코드 | 5 | 없음. 종말 기계, 눈, 썰매는 어디서나 통한다. 상표, 작품 이름 없음 |
| 끝 버튼과 반복 재생 | 4 | 악당이 썰매에 신나서 "Again!"이라고 했다가 "phase two"로 둘러댄다. 다시 보면 첫 장면에서 이미 Cleo가 썰매를 들고 있었다(다 알고 있었다) |
| 댓글 거리 | 4 | "DOOM OR SNOW DAY?": 세계 정복 대 눈 오는 날. 따라 할 대사 "It's a start.", "Get in." |
| 반복 금지와 움직임 | 5 | 발명품: 날씨 기계(처음. 4~13화는 레이저 건틀릿, 독백, 위장 벽, 복사기, 투명 물약, 자폭 버튼, 오븐, 둠 커패시터, 조수 로봇, 거울). 결말: 실패가 즐거운 놀이로 바뀌고 악당이 즐긴다(13화 바꿔치기, 12화 협상, 11화 폭로와 다름). 바깥 편(옥상, 뒷마당). 움직임 3번 |

- 합계 53/55, 4점 미만 없음. 진행.
- 미국 중심(snow day, sledding), 영국도 통한다(sledging이지만 sled는 이해된다).
- 가장 큰 위험: 구름이 너무 작아 안 보이거나, 내려다보는 장면에서 "우리 마당만 눈"이 한눈에 안 읽히는 것. 대책: 구름은 회색에 굵은 외곽선, 화면을 가로지를 때 크게 잡고 Vera가 눈으로 따라간다. 내려다보는 장면은 마당 세 칸을 나란히: 왼쪽 초록 잔디와 어린이 풀장 + 분홍 플라밍고, 가운데 우리 마당만 하얗고 그 위에 작은 구름, 오른쪽 초록 잔디와 파라솔. 해가 나는 옆집과 대비.
- 썸네일 각도: 크게 잡은 Vera(음흉한 웃음)와 Cleo(무표정, 썰매)가 기계 앞에, 위에 작은 구름. 글자 "DOOM?"(짧게).
- 유튜브 제목 후보 (`hookscore.py`):
  | 공식 | 제목 | 점수 |
  |---|---|---|
  | 2 Negative Command | Never aim a doomsday weather machine at 8 billion people | 83.2 (채택: 숫자와 물건이 바로 보이고, 첫 화면 TARGET: 8 BILLION PEOPLE과 첫 대사 "For all eight billion people"에 그대로 나온다) |
  | 2 Negative Command | Never trust a doomsday weather machine to freeze 8 billion people | 81.8 |
  | 2 Negative Command | Never point a doomsday weather machine at your own back yard | 52.2 |
- 제목 규칙(작가님): 제목의 숫자와 단어(doomsday weather machine, 8 billion)는 첫 2초 화면 글자(현수막, 기계 화면)와 첫 대사에 있다.

## 2. 대본

| id | 누가 | 감정 지시 (오디오 태그) | 대사 (영어) | 행동 지시 (그림, 카메라, 소리) |
|---|---|---|---|---|
| — | | | | **0초. OPEN (WIDE, 옥상).** 맑은 하늘, 멀리 도시 지붕들과 물탱크. 가운데 거대한 기계(깔때기 굴뚝, 접시 안테나, 계기판), 위에 현수막 DOOMSDAY WEATHER MACHINE, 기계 화면 TARGET: 8 BILLION PEOPLE. 왼쪽 Vera(scheme)가 오른팔로 레버를 잡고, 오른쪽 Cleo(deadpan)가 왼팔로 빨간 썰매를 세워 잡고 있다. 둘 다 벽돌 난간 뒤. 옥상 바람 소리, 기계가 낮게 웅웅거린다 |
| L1 | VERA | `[grand, triumphant]` | Eternal winter. / For all eight billion people. | OPEN. Cleo 고개 갸웃(ACT tilt) |
| L2 | CLEO | `[deadpan]` | I brought a sled. | CLEO_CU. 썰매를 살짝 들어 보인다 |
| L3 | VERA | `[scoffing, then commanding]` | This is not a snow day, Cleo. / This is DOOM. | VERA_MED. "DOOM"에 레버를 끝까지 당긴다(ACT pop) |
| — | | | | INSERT. 기계 화면 TARGET: 8 BILLION PEOPLE, 출력 바늘이 올라가고, 기계가 덜덜 떨며 돌아가는 소리가 커진다. 깔때기에서 퐁, 작은 회색 구름 하나 |
| L4 | VERA | `[confused]` | Why is it so small? | WIDE. 구름이 기계 위에서 오른쪽으로 화면을 가로질러 떠가다가 난간 너머 아래로 내려간다. 둘이 고개를 돌려 따라본다(ACT turn) |
| — | | | | DOWN. 난간 너머로 내려다본 뒷마당 세 칸. 가운데 우리 마당만 하얗고 작은 구름이 눈을 뿌린다. 옆집은 해, 풀장, 플라밍고, 파라솔 |
| L5 | VERA | `[horrified]` | Not the yard! / The PLANET! | OTS_CLEO. Cleo 어깨 너머로 Vera(ACT shake) |
| L6 | CLEO | `[deadpan]` | It's a start. | CLEO_CU(ACT shrug). Vera는 이를 간다 |
| L7 | VERA | `[furious, shouting]` | Maximum doom! | VERA_MED. 레버를 다시 끝까지(ACT pop), 기계가 크게 울린다 |
| — | | | | WIDE. 기계가 덜컹거리고, 난간 앞으로 눈더미가 아래에서 솟아올라 옥상 높이까지 쌓인다(오른쪽이 높고 왼쪽으로 기우는 비탈). 눈가루가 날린다 |
| L8 | CLEO | `[deadpan]` | Get in. | WIDE. Cleo가 썰매를 눕혀 난간 위 눈더미로 밀어 놓는다 |
| L9 | VERA | `[haughty, offended]` | A villain does not / go sledding. | VERA_PUSH(클로즈업, 줌인. ACT back) |
| L10 | VERA | `[screaming with joy]` | Wheeeee! | **스매시 컷** SLOPE. 옆에서 본 건물 뒷벽과 옥상에서 뒷마당까지 이어진 큰 눈 비탈. 썰매가 왼쪽 위에서 오른쪽 아래로 화면을 가로질러 내려간다. Vera는 두 팔을 번쩍(cheer), 뒤에 Cleo 무표정. 눈보라가 튄다 |
| — | | | | YARD. 퍽, 둘이 뒷마당 눈더미에 허리까지 파묻힌다. 썰매가 둘 사이에 꽂혀 서 있다. 머리 위 작은 구름이 계속 눈을 뿌린다 |
| L11 | VERA | `[breathless, giddy]` | Again! Again! / I mean... phase two. | YARD_VERA(미디엄). "I mean"에서 표정을 cool로 바꾸며 헛기침(ACT pop → nod) |
| L12 | CLEO | `[deadpan]` | Sure. | END(투샷, 얼굴은 y 780 아래). Cleo가 썰매를 잡는다(ACT nod). 엔드 카드, DOOM OR SNOW DAY? |

- 목소리: Vera, Cleo. 새 스톡 목소리 없음. L10 "Wheeeee!"는 받아쓰기가 철자를 다르게 쓸 수 있다(올바른 소리면 `asr` 필드).

## 3. 숨긴 장치와 줄기

- 이스터에그: 기계 옆면 명판 "MODEL No. 14". 썰매 옆면에 Cleo의 손글씨 "CLEO". 뒷마당 눈 속에 1화 광선포가 옆으로 누운 채 반쯤 묻혀 있다(buildYard의 고물 더미). 설명하지 않는다.
- 줄기: 시즌 1막(매 화 세계 정복 발명품이 실패한다). 날씨 기계는 36화 *Test Fire*에서 다시 나온다(실패작 목록). PAY RENT 동그라미는 이 편에서 보이지 않는다(실험실 밖).

## 4. 게시 문구

```
Doomsday machine: world domination or a snow day? Tell me.
Volt Labs is an animated sitcom about a broke mad scientist and her deadpan assistant. Today her doomsday weather machine snows on one back yard.

Volt Labs, episode 14.

#animation #cartoon #comedy #madscientist
```

- 검색어 2개: animated sitcom, mad scientist
- 끝 화면 `TL.ASK`: DOOM OR SNOW DAY?
- 첫 댓글: Doom or snow day?
- 훅 카드: 없음
- 유튜브 제목: Never aim a doomsday weather machine at 8 billion people | Volt Labs Ep 14 #shorts

## 5. Sound and music

- 공간: 옥상은 vl08 street_day(-31 dB, 0초 → SLOPE0, 실험실 룸톤 끔), 썰매 컷부터 끝까지 새 winter_air(-32 dB). 효과는 "street" 공간(바깥, 건물 벽 짧은 반사).
- 폴리(22개, 화면에 보이는 동작마다): 기계 공회전 hum(0 → SLOPE0, 대사 아래 6 dB 덕), 썰매 들기 cloth + 내려놓기 sled_tap, 레버 2번(lever, vl04), 기계 감기 whir 2번(새로 생성), 구름 puff 2번(vl06), 구름이 떠가는 whoosh(vl03), Vera 팔 동작 cloth 5번, 눈더미 솟는 rumble, 썰매 눕히기 snow_crunch, 비탈 sled_slide, 착지 snow_poof 3번(Vera, Cleo, 썰매).
- 음악(Volt Labs 밴드, tools/score.py): M1 테마 0 → L2 앞 마침, M2 build L3 → PUFF에서 뚝 끊김(구름 하나는 정적 속에), hit uhoh(우리 마당만 하얘질 때), M3 build "Maximum doom!" → 눈더미 다 솟으면 끊김("Get in."과 "A villain..."은 정적), M4 scurry 썰매 하강, 착지에서 끊김, M5 tag + button(끝 화면). 히트 2개. 음악은 40.3초 중 18.8초.
- 결과: -13.9 LUFS, true peak -2.9 dBTP, LRA 6.2, 대사는 나머지보다 최소 +20.3 dB.
- ElevenLabs: 대사 12줄(earlier), 새 효과 7개(whir, rumble, sled_slide, snow_poof, snow_crunch, sled_tap, winter_air: 845자, 20.7초), 받아쓰기. 이 편 후 계정 사용량 94,460 / 151,976.

## 6. 제작하며 고친 것

- 첫 프레임에서 썰매가 Cleo 몸에 가려 빨간 판으로만 보임 → 기계 쪽으로 기울여 세워 곡선 머리와 몸통이 보이게.
- 뒷마당의 작은 구름이 미디엄 샷 화면 밖(위)에 있었음 → Vera 머리 위로 내려 YARD_VERA와 END에서 보이게, 눈송이도 구름 아래 기둥으로만.
- 최종 받아쓰기에서 L10이 "Whee"로 들림(대사 단독 테이크는 "Wee") → timeline의 `asr_final`(같은 소리, 다른 철자)로 기록. precheck --stt도 이 필드를 함께 받도록 고침.
- 표지: 처음엔 구름 눈송이가 Vera 얼굴 위에 떨어지고 썰매가 둘 사이에 가려 CLEO 글자가 안 보임 → 인물을 조금 작게, 사이를 벌려 썰매 전체와 CLEO가 보이게, 눈송이는 머리 위까지만 + 머리에 눈 모자.

## 7. 결과

- 40.3초(엔드 카드 2.5초 포함, length_test current), -13.9 LUFS, true peak -2.9 dBTP, LRA 6.2, 대사 마진 최소 +20.3 dB, ElevenLabs STT 12/12줄(L10 "Wheeeee!"는 asr_final "Whee!"로 대조), blackdetect 없음, check_english 통과, shotlint ok, look2_audit exit 0(1212프레임, 실패 0, 최악 구간 0.041), 음악 18.8/40.3초, 히트 2개.
- Look 2: ACT 16개, CLEO_CU x2, VERA_MED, INSERT(화면 TARGET: 8 BILLION PEOPLE과 출력 바늘), OTS_CLEO, VERA_PUSH("A villain does not go sledding."). 몸 가로지르기: 구름이 화면을 가로질러 난간 너머로, 클레오가 썰매를 눈더미에 눕힘, 썰매가 대각선으로 지붕에서 마당까지, 둘이 눈에 빠짐. 1프레임: 기계와 배너, 레버의 베라, 썰매를 든 클레오.
- 표지 `channel/thumbs/vl14-doomsday-weather.jpg` "DOOM OR / SNOW DAY?"(DOOM 강조), 게시 문구 `channel/ig/posts/vl14-doomsday-weather.txt`, postlint READY, 첫 댓글 "Doom or snow day?", 끝 화면 TL.ASK "DOOM OR SNOW DAY?". 유튜브 제목 "Never aim a doomsday weather machine at 8 billion people | Volt Labs Ep 14 #shorts"(훅 83.2, yt-package 98).
- Metricool 444768009(브랜드 7923229, 12/4 금 10:00 KST), precheck --stt PASS, static.metricool 사본 sha256이 커밋 파일과 일치(mp4 bb7883a2..., 표지 1fb27eef...).
- 사람 귀로 확인할 것: 험/윙 소리와 음악 균형, "Wheeeee!" 연기, 슬로프 샷의 작은 인물, OTS 어깨와 자막 거리, 40.3초 끝의 클릭(믹스 통계).
