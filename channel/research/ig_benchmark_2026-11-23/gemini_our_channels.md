# 클로드 학습용: 내 채널 2곳(Void Mart · Halloway Archive) 저조회수 원인 분석 및 개선 규칙

> **목적:** 본 문서는 Claude가 [Void Mart](https://www.youtube.com/watch?v=mR2ULOwAu_Y)와 [Halloway Archive](https://www.youtube.com/watch?v=IaCtTetosio)의 기존 에피소드가 왜 쇼츠 알고리즘에서 70~1,391회 구간에 정체되었는지 학습하고, 향후 대본·연출·편집 지시 시 동일한 실패 패턴을 반복하지 않도록 설계한 **오답 노트 및 교정 규칙서**입니다.

---

## 1. 채널별 현황 및 표본 데이터

### A. Void Mart (`@thevoidmart`) — 2D SF 편의점 코미디
| 에피소드 | 길이 | 조회수 | 좋아요 | 좋아요율 | 관찰된 주요 특징 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [Ep 1: First night at the last store in the universe](http://www.youtube.com/watch?v=mR2ULOwAu_Y) | 46초 | 1,160 | 18 | 1.55% | 첫 2초 로고 인트로, 느린 시트콤 호흡 |
| [Ep 4: The gravity went optional at work](http://www.youtube.com/watch?v=twpCDYzchjo) | 41초 | 1,391 | 22 | 1.58% | 4초간 정적 안내 방송, 마지막 예고 배너 |
| [Ep 5: Never tell a slug his milk is sold out](https://www.google.com/search?q=http://www.youtube.com/watch%3Fv%3DHCaNdbJ47W4) | 42초 | 1,383 | 19 | 1.37% | 40초대 중반 길이, 1,300회 구간 정체 |
| [Ep 6: Pip vs. a security camera](https://www.google.com/search?q=http://www.youtube.com/watch%3Fv%3DeGeLkBi_g-E) | 48초 | 1,195 | 7 | 0.59% | 표본 중 최장 길이(48초), 최저 좋아요율 |
| [Volt Labs Ep 8 (채널 내 타 시리즈)](http://www.youtube.com/watch?v=UUDzBayyduw) | 43초 | 1,112 | 14 | 1.26% | 채널 정체성 분산 유발 |

### B. Halloway Archive (`@hallowayarchive`) — 1999 쇼핑몰 아날로그 호러
| 에피소드 | 길이 | 조회수 | 좋아요 | 좋아요율 | 관찰된 주요 특징 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [TAPE 01: Closing Announcement](http://www.youtube.com/watch?v=IaCtTetosio) | 37초 | 71 | 1 | 1.41% | 첫 1초 VHS 노이즈, 원거리 정적 CCTV |
| [TAPE 04: Toy Garden](http://www.youtube.com/watch?v=HqOfAYv3AUc) | 35초 | 1,168 | 14 | 1.20% | 초반 움직이는 로봇 장난감 훅 존재 |
| [TAPE 06: First Night](http://www.youtube.com/watch?v=eI0qJFnk6Z4) | 42초 | 115 | 1 | 0.87% | 15초 이상 느린 이동 후 후반부 괴물 등장 |
| [TAPE 07: Foto 1 Hour](http://www.youtube.com/watch?v=Xe_aB3HFmaI) | 42초 | 920 | 6 | 0.65% | 인화 사진이라는 직관적 공포 소재로 상대적 선방 |

---

## 2. 왜 안 터졌는가? (5가지 구조적 실패 요인)

### 요인 1. 쇼츠 골든존(12~18초)을 2~3배 초과하는 러닝타임 (35~48초)
* 두 채널 모두 평균 **35~48초**로, 신규 채널이 시드 풀(1,000~1,500회 테스트)을 통과하기에 지나치게 깁니다.
* 초반 5초 이탈률이 조금만 높아져도 평균 시청 지속률(Retention)이 60% 아래로 떨어지며, 실제로 Void Mart의 5편이 모두 **1,100~1,390회 구간에서 일제히 멈춘 것**이 알고리즘 2차 확산 탈락의 전형적 신호입니다.

### 요인 2. 0~2초 '즉시 이탈 유발' 오프닝
* **Void Mart Ep 1:** `00:00~00:02` 구간에 `VOID MART EPISODE 1 · FIRST SHIFT` 로고 줌인 인트로가 들어갑니다. 쇼츠 피드에서 로고 인트로는 시청자가 "본편이 아니다"라고 인식하고 즉시 스와이프하는 가장 흔한 원인입니다.
* **Halloway Archive TAPE 01:** 첫 1초가 VHS 지지직거리는 노이즈(Static) 화면이고, 이후에도 어두운 복도 CCTV를 멀리서 오래 비춥니다. 반면 초반부터 움직이는 로봇 장난감([TAPE 04](http://www.youtube.com/watch?v=HqOfAYv3AUc))과 즉석 사진 인화([TAPE 07](http://www.youtube.com/watch?v=Xe_aB3HFmaI))를 보여준 영상은 71회 대비 **10배 이상(920~1,168회)** 조회수가 높았습니다.

### 요인 3. 일레븐랩스(TTS) 호흡이 남긴 '대사 간 공백(Dead Air)'
* Void Mart의 경우 성우 연기와 대사 센스는 좋으나, 문장과 문장 사이에 **0.8~1.5초의 정적(Pause)**이 그대로 남아 있습니다.
* `@Imssy99` 같은 바이럴 쇼츠는 대사 끝과 다음 대사 시작 간격이 0.05초 수준으로 겹치듯 이어지지만, Void Mart는 **느긋한 TV 시트콤 템포**로 흘러가 쇼츠 시청자의 도파민 리듬을 놓칩니다.

### 요인 4. 아웃트로 이탈 함정 & 세로 화면 비효율
* **아웃트로 이탈:** Void Mart는 본편 개그가 끝난 뒤에도 `DAYS SINCE LAST INCIDENT: 0` 카운터 전환이나 `NEW EPISODE EVERY DAY / TOMORROW: VOLT LABS` 예고 화면을 2~3초 붙입니다. 시청자는 개그가 끝났다고 느끼는 순간 바로 넘기기 때문에 **영상 끝까지 시청(100% 완주) 및 루프(재시청)**가 깨집니다.
* **세로 화면 낭비:** Halloway Archive는 상하단에 거대한 검은 여백을 두고 가운데 16:9 CCTV 화면만 작게 배치해 모바일 세로 화면에서의 시각적 압박감과 공포 몰입감을 스스로 줄였습니다.

### 요인 5. 채널 내 시리즈 혼재 및 훅의 온도 차이
* Void Mart 채널에 다른 세계관인 [Volt Labs Ep 8](http://www.youtube.com/watch?v=UUDzBayyduw)이 함께 올라와 초기 알고리즘 타겟팅이 분산되었습니다.
* 또한 "우주 끝 편의점", "이달의 직원 경쟁" 같은 설정은 세계관 애호가에겐 매력적이지만, 3초 만에 좋아요를 누르게 만드는 **원초적 감정 훅(연애·당황·분노·즉각적 공포)**이 약해 좋아요율이 0.6~1.5%대에 머물렀습니다.

---

## 3. 클로드(Claude) 적용용 교정 규칙 (`<anti_patterns>` & `<fix_rules>`)

클로드가 위 두 채널(또는 신규 쇼츠 채널)의 대본·콘티를 작성할 때 반드시 지켜야 하는 규칙입니다.

```xml
<anti_patterns>
1. 0~2초 타이틀 로고 인트로, VHS 노이즈 오프닝 절대 금지.
2. 30초 이상 늘어지는 쇼츠 대본 금지 (목표: 12~18초, 최대 20초 미만).
3. TTS 대사 간 0.3초 이상의 정적(Dead air) 허용 금지.
4. 본편 종료 후 '다음 화 예고' 배너 또는 여운용 아웃트로 컷 금지.
5. 한 채널에 세계관이 다른 2개 이상의 시리즈를 섞어 올리는 기획 금지.
</anti_patterns>

<fix_rules>
[Void Mart 리모델링 규칙]
- 0.0초: 로고 없이 바로 캐릭터 얼굴 클로즈업 + 황당한 사건/도발 대사로 시작한다.
- 대사 압축: 기존 45초 에피소드 대사를 절반으로 줄이고, 캐릭터 간 티키타카 간격을 0.1초 이내로 배치한다.
- 엔딩: `DAYS SINCE LAST INCIDENT: 0`가 뜨는 순간 또는 사고 직후 0.2초 만에 칼같이 영상을 끊는다.

[Halloway Archive 리모델링 규칙]
- 0.0초: 노이즈 없이 즉시 기괴한 시각적 훅(움직이는 마네킹, 방금 찍힌 내 뒷모습 사진 등)을 화면 꽉 차게(9:16 크롭/줌인) 노출한다.
- 포맷 이원화: 쇼츠는 'Rule 1개 = 15초 공포 펀치'로 극단적 압축하고, 40초 이상 서스펜스 빌드가 필요한 에피소드는 여러 TAPE를 묶어 3~5분짜리 유튜브 롱폼으로 전환한다.
</fix_rules>
```
