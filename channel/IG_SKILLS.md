# 인스타 스킬 13종을 우리 공정에 쓰는 법 (11/8)

출처: 작가님이 준 노션 글 → github.com/Jakeschincariol/instagram-agent-skill (MIT, 커밋 d03c56b).
설치: `.claude/skills/ig-*` 13개 폴더(프로젝트 안이라 예약 작업 세션에도 같이 간다).
검토: 파이썬 도구 7개 모두 표준 라이브러리만 쓴다. 외부 통신 없음. 파일은 지정한 경로에만 쓴다. 고친 곳 없음.

## 결론

| 스킬 | 판정 | 어디에 |
|---|---|---|
| ig-caption (`caption.py`) | **매 편 사용** | 게시 문구(인스타 캡션 = 유튜브 설명). 판정이 READY여야 예약한다 |
| ig-human (`humanize.py`) | **매 편 사용** | 게시 문구, 제목, 채널 설명. 기계 흔적(em dash, 보이지 않는 문자, 상투어) 제거 |
| ig-reel (`hooks.json`, `hookscore.py`) | **매 편 사용, 참고용** | 유튜브 제목 후보 3개를 서로 다른 훅 공식으로 쓰고 점수를 매긴다. 첫 프레임 훅 카드(실험, 아래) |
| ig-profile (`rubric.json`) | 한 번 | 인스타 프로필 점검. 고정 게시물 3개는 작가님 손이 필요 |
| ig-audit | 12/7부터 2주마다 | 게시 30개쯤 모이면. Metricool 분석 수치로 |
| ig-viral (`swipe.py`) | 보류 | 남의 릴스를 직접 봐야 한다(로그인 금지, 브라우저 필요). vidIQ 크레딧을 쓰는 방법도 있지만 작가님 확인 전에는 안 쓴다 |
| ig-plan | 안 씀 | 일정이 이미 고정(격일 교대, 공포 3일) |
| ig-story, ig-carousel, ig-dm, ig-repurpose | 안 씀 | 스토리·캐러셀·DM 판매·롱폼이 없다(롱폼 보류) |
| ig-comment, ig-reply | 필요할 때 | 작가님이 댓글을 붙여 주면 답글 초안. 우리가 직접 달 도구는 없다 |

## 먼저 볼 약점

1. **훅 점수(`hookscore.py`)는 코미디를 잘 못 잰다.** 정보형 크리에이터 훅 74개로 만든 도구이고, 같은 계정 안에서 잘된 것과 안 된 것을 가르는 힘은 동전 던지기 수준이라고 도구 스스로 적어 두었다(AUC 0.56). "Unexpected item in bagging area"는 30점이지만 영미권 사람이면 다 아는 셀프 계산대 문구라 그대로 둔다. 그래서 **점수는 관문이 아니라 참고**다. 웃음이 살아 있는 후보 중 점수가 높은 것을 고른다.
2. **AI 문체 탐지(`detect.py`)는 짧은 글을 못 잰다.** 50단어 안팎인 캡션은 "판단 불가"가 섞여 FLAGGED가 나온다. 캡션에는 `humanize.py`(흔적 제거)만 강제하고, `detect.py`는 채널 설명처럼 긴 글에만 쓴다.
3. **대사와 자막에는 돌리지 않는다.** "do NOT press the—"의 em dash는 말이 끊기는 연기라서 지우면 안 된다.
4. **안전 영역 수치는 추정이다.** 메타 공식 수치가 아니라 제3자 가이드들의 범위(위 약 210px, 아래 290~500px, 오른쪽 60~120px)다. 우리 자막은 y 1470(아래에서 450px)이라 대부분의 기준 안에 든다. 다만 긴 줄이 오른쪽 버튼 줄에 걸릴 수 있어서, **폭이 840px를 넘으면 글자를 줄이도록 `vmkit.js`를 고쳤다**(새로 렌더하는 편부터).
5. **해시태그 상한 5개**(인스타 2025-12-18 시행, 검색으로 확인). 휴머나이저는 5개도 '해시태그 벽'으로 잡는다. 그래서 **4개**로 줄였다.
6. 감사(audit)의 핵심 지표인 '3초 유지율'을 Metricool이 주는지는 아직 모른다. 줄 것으로 보이는 것: 조회, 도달, 공유, 저장, 평균 시청 시간(추정, 12/7에 확인).

## 기존 예약분 첫 측정과 조치 (11/8 새벽)

- 캡션 3개를 검사했더니 **셋 다 FIX**: 검색어 0개, 시청자에게 묻는 말 0개, 해시태그가 "더 보기" 앞에 보인다.
- 제목 7개 훅 점수 **30~44(전부 WEAK)**. 약점은 전부 '구체성'(숫자, 이름, 물건 없음).
- 조치: 예약된 6편(VL1~3, VM2~4)의 캡션을 새 형식으로 바꿨다(6편 모두 READY). 제목은 웃음이 그대로면서 점수가 오른 4편만 바꿨다.

| 편 | 전 제목 (점수) | 새 제목 (점수) |
|---|---|---|
| VL1 | She built a ray to make the world adore her (30) | She built a ray so 8 billion people would adore her (47) |
| VM2 | He tried to pay with a star (30) | A customer tried to pay with a star. Rae said no (52) |
| VL2 | Her obedience ray made everyone too polite (30) | She made 8 billion people obey her. Politely (51) |
| VL3 | Her job interview went great (the lab exploded) (30) | Never tell your new hire not to press the red button (56) |
| VM3, VM4 | 그대로 | 셀프 계산대 문구와 "gravity went optional"이 더 웃기다고 판단 |

## 새 규칙 (PRODUCTION.md, scripts/TEMPLATE.md에 반영)

### 게시 문구: 영상이 훅이고, 캡션은 질문과 검색어

```
<시청자가 자기 경험으로 답할 수 있는 질문 하나, 이 편의 웃음과 연결>
<시리즈 한 줄 소개, 검색어 2개 포함> <이 편 한 줄>

<Void Mart|Volt Labs>, episode N.

#animation #cartoon #comedy #retail        (Volt Labs는 #madscientist)
```

- 질문이 유일한 요청이다(팔로우 부탁, 태그 부탁 금지).
- 검색어: Void Mart는 `animated sitcom` + (`convenience store` / `night shift` / 그 편 소재), Volt Labs는 `animated sitcom` + `mad scientist`. 실제 검색량은 확인 안 함(추정). 12/7 감사 때 검색 유입으로 다시 본다.
- 이모지, 링크, 한국어 없음. 검사: `channel/tools/postlint.sh channel/ig/posts/<폴더>.txt "<검색어1>,<검색어2>" "<제목>"` → VERDICT READY, 휴머나이저 변경 0.
- 공포 채널은 따로 쓴다(캡션 형식은 §2.6 그대로, 같은 검사만 돌린다). 공포 문구의 질문 예: "How many did you count?"

### 제목: 후보 3개, 서로 다른 훅 공식

- `hooks.json`의 26개 중 코미디에 맞는 것: #21 Mid-Sentence Start, #24 The Reveal, #26 The Superlative, #3 Nobody Tells You(서비스직 진실), #2 Negative Command("Never tell your new hire..."), #25 Someone Else's Result, #23 The Statistic(극 중 숫자). 
- 숫자나 이름, 물건 하나를 넣는다(8 billion, Rae, a star). 점수는 참고.
- 사실을 지어내지 않는다는 원칙은 우리 채널에 대한 주장(조회수, 수상 등)에만 해당한다. 극 중 숫자는 농담이다.

### 첫 프레임 훅 카드 (실험, 4편)

- VL4, VM5, VL5, VM6에 첫 2.5초 동안 화면 위쪽(y 250~400)에 6단어 이하 영어 카드. 소리 없이 넘기는 사람에게 상황을 먼저 알려 준다.
- 약점: 그림 위를 가린다. 시트콤의 몰입을 깰 수 있다. 그래서 4편만 하고, 12/7 감사 때 카드 없는 편들(VM2~4, VL1~3)과 평균 시청 시간·조회를 비교해 계속할지 정한다. 작가님이 보고 싫으면 바로 뺀다.

### 기록

- `channel/ig/log.md`: 편마다 날짜, 훅 공식 id, 제목, 캡션 첫 줄, 훅 카드 유무. 감사 때 이걸로 묶어 본다.
- `channel/ig/voice.md`: 우리 채널 말투(스킬들이 읽는다). 새 컨테이너에서는 PRODUCTION.md §0대로 `~/.claude/instagram/`에 복사한다.

### 프로필 (ig-profile 기준)

- 이름 칸 `Void Mart | animated sitcoms`: 검색어가 들어가 있어 만점 기준에 맞는다. 소개 137자도 기준에 맞는다.
- **작가님이 직접 할 일: 고정 게시물 3개.** 1화 둘(VM1, VL1)과 첫 주에 가장 잘된 편 하나. 도구로는 고정할 수 없다. 11/14쯤 결과를 보고 말씀드린다.
- 하이라이트: 스토리를 안 하니 지금은 없음.

## 참고한 자료

- [Instagram limits number of hashtags to five per post (Social Samosa)](https://www.socialsamosa.com/news-2/instagram-hashtags-five-per-post-10923075), [Business Today, 2025-12-19](https://www.businesstoday.in/technology/news/story/no-more-hashtag-stuffing-instagram-limits-hashtag-usage-to-just-5-per-reel-and-post-507444-2025-12-19)
- 안전 영역(제3자 추정): [Hopper HQ](https://www.hopperhq.com/blog/instagram-reel-size/), [TryMyPost](https://www.trymypost.com/blog/instagram-reels-safe-zones-text-placement-2026), [wildandfreetools](https://wildandfreetools.com/blog/vertical-video-safe-zones-guide-2026/)
