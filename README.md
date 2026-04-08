# LEGO Finder

GitHub Pages에서 동작하는 레고 세트 검색 및 컬렉션 관리 웹앱입니다.

> **라이브 데모**: https://jbh-mine.github.io/lego-finder

---

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [배포](#배포)
- [가격 데이터 업데이트](#가격-데이터-업데이트)
- [갤러리 이미지 수집](#갤러리-이미지-수집)
- [자동 업데이트 (GitHub Actions)](#자동-업데이트-github-actions)
- [변경 이력 (Changelog)](#변경-이력-changelog)
  - [v0.5.23 — 2026-04-08](#v0523--2026-04-08)
  - [v0.5.22 — 2026-04-08](#v0522--2026-04-08)
  - [v0.5.21 — 2026-04-08](#v0521--2026-04-08)
  - [v0.5.20 — 2026-04-08](#v0520--2026-04-08)
  - [v0.5.19 — 2026-04-08](#v0519--2026-04-08)
  - [v0.5.18 — 2026-04-08](#v0518--2026-04-08)
  - [v0.5.17 — 2026-04-07](#v0517--2026-04-07)
  - [v0.5.16 — 2026-04-07](#v0516--2026-04-07)
  - [v0.5.15 — 2026-04-07](#v0515--2026-04-07)
  - [v0.5.14 — 2026-04-07](#v0514--2026-04-07)
  - [v0.5.13 — 2026-04-07](#v0513--2026-04-07)
  - [v0.5.12 — 2026-04-07](#v0512--2026-04-07)
  - [v0.5.11 — 2026-04-07](#v0511--2026-04-07)
  - [v0.5.10 — 2026-04-07](#v0510--2026-04-07)
  - [v0.5.9 — 2026-04-07](#v059--2026-04-07)
  - [v0.5.8 — 2026-04-07](#v058--2026-04-07)
  - [v0.5.7 — 2026-04-07](#v057--2026-04-07)
  - [v0.5.6 — 2026-04-07](#v056--2026-04-07)
  - [v0.5.5 — 2026-04-07](#v055--2026-04-07)
  - [v0.5.4 — 2026-04-07](#v054--2026-04-07)
  - [v0.5.3 — 2026-04-07](#v053--2026-04-07)
  - [v0.5.2 — 2026-04-07](#v052--2026-04-07)
  - [v0.5.1 — 2026-04-07](#v051--2026-04-07)
  - [v0.5.0 — 2026-04-07](#v050--2026-04-07)
  - [v0.4.2 — 2026-04-07](#v042--2026-04-07)
  - [v0.4.1 — 2026-04-07](#v041--2026-04-07)
  - [v0.4.0 — 2026-04-07](#v040--2026-04-07)
  - [v0.3.1 — 2026-04-06](#v031--2026-04-06)
  - [v0.3.0 — 2026-04-06](#v030--2026-04-06)
  - [v0.2.0 — 2026-04-06](#v020--2026-04-06)
  - [v0.1.1 — 2026-04-06](#v011--2026-04-06)
  - [v0.1.0 — 2026-04-06](#v010--2026-04-06)
- [라이선스](#라이선스)

---

## 주요 기능

- **제품번호/이름 검색** — Rebrickable API를 통한 실시간 레고 세트 검색
- **한국어 자연어 검색** — "모듈러", "스타워즈", "경찰서", "용마성", "블랙펄", "탐정사무소", "아캄", "고담", "헤르미온느", "보바펫", "바라쿠다" 등 한국어 키워드/별명/캐릭터명으로 검색 가능 (600+ 키워드 매핑)
- **IP 프랜차이즈 우산 키워드 검색** — "마블", "어벤져스", "디씨", "스타워즈", "해리포터", "디즈니", "쥬라기월드" 등을 입력하면 Spider-Man / Iron Man / Hulk / Avengers / Arkham 등 실제 세트명 키워드로 자동 분기 검색하여 결과 병합
- **세트 검색 다축 필터 + URL 공유** — 부품 수 / 출시 연도 / 가격(KRW) 범위, 단종 여부, 보유·위시리스트 상태로 검색 결과를 다중 필터링하고 URL 쿼리스트링과 동기화하여 공유 가능
- **희소 가치 점수 (Scarcity Score)** — 헤더 메뉴 → "희소가치"에서 한글/영문 제품명 또는 제품번호로 검색하면 결과 목록이 나오고, 항목을 클릭하면 MSRP·현재 시세·테마 평균 수익률(3/5/10/20/30년 선택)·독점 구성 여부를 종합해 0~100점/S~D 등급을 계산하고 Recharts로 과거/예상 가격 곡선 시각화. 점수는 적층형 LEGO 브릭 게이지로 시각화됨
- **부품 단가 (PPP) 가성비 분석** — 헤더 메뉴 → "가성비"에서 KRW/부품 기준으로 베스트 세트 목록 확인. 한국 공식 시리즈 분류(스타워즈/해리포터/아이콘스/테크닉/마블 등) 테마 필터 + Top N 선택기 + 단종 제품 옵션 토글(과거 정가 기준 PPP) + 단종/테마 배지 강조
- **다크 모드** — 헤더 토글로 라이트/다크 테마 전환. CSS 변수 기반 토큰으로 모든 카드/입력/차트가 일관되게 전환되며 localStorage 에 사용자 선택 저장
- **PWA (홈화면 추가 + 오프라인 캐시)** — 모바일 사파리/크롬에서 "홈 화면에 추가" 시 standalone 앱처럼 실행. 정적 에셋 cache-first + JSON 데이터 stale-while-revalidate + 앱 셸 network-first 의 3-tier 캐시 전략
- **일별 가격 스냅샷 + 변동 차트** — 매일 수집된 KRW 가격을 `priceHistoryIndex.json` 에 누적하고 제품 상세 페이지에서 SVG 라인 차트로 표시
- **한국어 별명 → 제품번호 직접 매핑** — "용마성"→6082, "블랙펄"→10365, "박쥐성"→6097, "탐정사무소"→10246, "바라쿠다"→21322 등 즉시 검색
- **모듈러 빌딩 전체 키워드** — 카페코너, 그린그로서, 소방대, 펫샵, 타운홀, 팰리스시네마, 탐정사무소, 브릭뱅크, 다운타운다이너, 서점, 재즈클럽, 자연사박물관 등
- **검색 결과 테마별 그룹화** — 검색 결과를 테마별로 분리하여 표시 (테마명 한국어 번역 지원)
- **테마명 한국어 정확 표시** — 반지의제왕, 해리포터, 캐슬 등 100+ 테마명 하드코딩 번역 (인코딩 깨짐 방지)
- **부품 검색** — 부품 이름/번호로 검색, 카테고리 필터, 카테고리별 그룹화, 색상 정보 확인
- **부품 카테고리 한국어 번역** — 한국어 선택 시 부품 카테고리명 자동 번역
- **신제품 탭** — 최신 레고 신제품 연도별 조회
- **펀딩제품(BDP) 탭** — BrickLink Designer Program 제품 시리즈별 조회, 연도 필터, 이름 검색
- **MOC 검색 탭** — Rebrickable MOC 작품 검색 (정렬: 최신/인기/좋아요/부품수)
- **이미지 갤러리 + 라이트박스** — 제품 상세에서 Rebrickable 멀티 이미지(BDP + 일반 제품 모두), 터치 스와이프, 썸네일 스트립, 클릭하여 확대 라이트박스(팝업 안에서도 썸네일 네비 + 페이드 인 애니메이션)
- **무한 스크롤** — 검색/부품/둘러보기 모두 스크롤 시 데이터 자동 로드
- **테마/연도 필터링** — 테마별, 연도별 브라우징 (테마명 한국어 번역 지원)
- **세트 상세 정보** — 부품 목록, 미니피규어, 색상 정보 확인
- **부품 상세 정보** — 사용 가능한 색상, 엘리먼트 ID, 포함된 세트 목록
- **한국 레고 가격 표시** — 세트 카드와 상세 페이지에서 KRW 가격 표시 (단종 제품은 과거 한국 정가 표시)
- **내 컬렉션 관리** — localStorage 기반 컬렉션 및 위시리스트
- **한/영 전환** — 헤더 토글 버튼으로 언어 전환
- **모바일 반응형** — 햄버거 메뉴, 터치 영역 확대 등 모바일 최적화
- **주간 자동 업데이트** — GitHub Actions로 매주 일요일 가격 & 갤러리 이미지 자동 수집 및 재배포

---

## 기술 스택

- **React 19** + React Router (HashRouter, useSearchParams)
- **Recharts** — 희소 가치 점수 페이지의 과거/예상 가격 곡선 시각화
- **Axios** + API 캐싱
- **Rebrickable API v3** — 세트 검색, 부품 검색, 미니피규어 데이터
- **BrickLink CDN** — 제품 대체 이미지 (SN/ON)
- **MyMemory Translation API** — 제품명/테마명/카테고리명 한국어 번역 (localStorage 캐싱)
- **allorigins.win CORS Proxy** — 희소 가치 점수 페이지의 시세 조회 (BrickEconomy)
- **PWA** — `manifest.json` + `sw.js` (3-tier 캐시 전략) + `serviceWorkerRegistration.js`
- **GitHub Pages** (gh-pages) 배포
- **GitHub Actions** — 주간 데이터 자동 수집 + 자동 배포 파이프라인

---

## 프로젝트 구조

```
src/
├── App.js                  # 라우팅 설정 (/scarcity, /ppp 포함)
├── index.js                # 엔트리 포인트 (PWA 서비스워커 등록)
├── serviceWorkerRegistration.js  # PWA 서비스워커 등록 헬퍼
├── components/
│   ├── Header.js           # 네비게이션 + 한/영 전환 + 다크모드 토글 (희소가치/PPP 메뉴)
│   ├── SetCard.js
│   ├── PriceHistoryChart.js
│   ├── Pagination.js
│   ├── TranslatedName.js
│   └── Loading.js
├── contexts/
│   ├── LanguageContext.js
│   └── ThemeContext.js
├── data/
│   ├── prices.json         # schemaVersion 2 — 한국 시리즈 themes 맵 + 단종 제품 과거 정가
│   ├── priceHistoryIndex.json
│   ├── prices-history/
│   ├── themeReturns.js
│   ├── bdpImages.json
│   └── legoImages.json
├── pages/
│   ├── SearchPage.js
│   ├── ScarcityPage.js     # 적층형 LEGO 브릭 게이지 + Recharts 차트 + 기간 선택
│   ├── PppPage.js          # 부품 단가 (PPP) 가성비 분석 (한국 시리즈 테마 + 단종 옵션)
│   ├── PartsSearchPage.js
│   ├── PartDetailPage.js
│   ├── BrowsePage.js
│   ├── SetDetailPage.js
│   ├── FundingPage.js
│   ├── MocsPage.js
│   └── CollectionPage.js
├── styles/
│   ├── App.css
│   ├── theme-dark.css
│   ├── lego-brick.css      # LEGO 브릭 디자인 시스템 (brick-stack/brick-badge/brick-status + set-card edge accent)
│   ├── filters.css         # 다축 필터 패널 + 라이트박스 폴리시
│   └── price.css
└── utils/
    ├── api.js
    ├── mocApi.js
    ├── searchDict.js
    ├── scarcityScore.js
    ├── priceHistory.js
    ├── translate.js
    ├── price.js
    ├── i18n.js
    └── collection.js

public/
├── index.html
├── manifest.json           # PWA 매니페스트 (theme_color, icons, scope)
└── sw.js                   # PWA 서비스워커 (3-tier 캐시 전략)

scripts/
├── fetch-prices.js
└── fetch-images.js

.github/workflows/
└── auto-update-images.yml
```

---

## 설치 및 실행

```bash
git clone https://github.com/jbh-mine/lego-finder.git
cd lego-finder
npm install
npm start
```

## 배포

```bash
npm run deploy
```

---

## 가격 데이터 업데이트

```bash
npm run fetch-prices 10294 42151 75192
npm run fetch-prices --refresh
```

## 갤러리 이미지 수집

```bash
npm run fetch-images 10294-1 42151-1 75192-1
npm run fetch-images -- --from-prices
npm run fetch-images -- --refresh
```

## 자동 업데이트 (GitHub Actions)

매주 일요일 03:00 UTC (12:00 KST) 자동 실행 + 수동 트리거. 자세한 내용은 `.github/workflows/auto-update-images.yml` 참조.

---

## 변경 이력 (Changelog)

> 이 Changelog는 코드가 수정될 때마다 자동으로 업데이트됩니다. 새로운 변경사항이 push 될 때마다 이 섹션 상단에 새 버전 항목이 추가됩니다.

### v0.5.23 — 2026-04-08

#### `NEW` data(prices) + ui: BDP 펀딩 제품 USD → 당시 환율 기준 KRW 변환 + UI 환율 배지

- **요구사항**: "BrickLink Designer Program (BDP) 펀딩 제품들도 USD 가격이 아니라 펀딩 당시 환율로 환산한 원화로 표시하고, 환율로 환산된 가격임을 사용자가 알 수 있게 표시해줘."
- **`src/data/prices.json` BDP 50개 엔트리 일괄 변환** — 910001 ~ 910063 의 모든 BDP 펀딩 세트에 출시 연도(`year`) + 원본 USD(`usd`) + 환산 KRW(`price`) + `priceFromUsd: true` 플래그를 부여. 환산은 IRS / x-rates / exchange-rates.org 의 연평균 USD/KRW 환율을 시리즈별 출시 연도에 매칭하여 적용:
  - 2021 라운드 1 (910001~910004): **1 USD = 1,145 KRW** → ₩229,000 / ₩206,100
  - 2022 라운드 2~3 (910008~910023): **1 USD = 1,292 KRW** → ₩258,400 / ₩167,900 / ₩103,300
  - 2023 라운드 4 (910027~910036): **1 USD = 1,305 KRW** → ₩261,000 / ₩130,500
  - 2024 라운드 5~6 (910037~910054): **1 USD = 1,364 KRW** → ₩272,800 / ₩136,400 / ₩109,100
  - 2025 라운드 7 (910055~910063): **1 USD = 1,421 KRW** → ₩284,200 / ₩142,100
- **`meta.bdpExchangeRates` 추가** — 사용된 연도별 환율을 메타에 명시해 분석 페이지에서 검증·디버깅 가능. `meta.notes` 도 새 BDP 변환 정책을 설명하도록 갱신.
- **`src/utils/price.js`** — `getKrwPrice` / `getKrwPriceAsync` 가 BDP 엔트리의 `priceFromUsd`, `usd`(원본), `year`(환산 적용 연도) 를 결과 객체에 그대로 forward.
- **`src/hooks/useLegoPrice.js`** — 훅 반환값에 `priceFromUsd`, `year` 노출.
- **`src/styles/price.css`** — `.price-fx-badge` 신규. 노란 배경(#fff3c4) + 진한 황토색 보더(#f0d97a) + 6px 라운드의 작은 알약 형태. 모바일에서는 폰트 사이즈 자동 축소.
- **`src/components/SetCard.js`** — `priceData.priceFromUsd` 가 true 일 때 환산 KRW 옆에 인라인으로 **`당시 환율 적용`** (한국어) / **`historical FX`** (영어) 배지 렌더. `title` 속성에 원본 USD + 환산 적용 연도를 표시 (예: `$199.99 USD (2024)`) 해 호버 시 환율 근거 확인 가능.
- **결과**: BDP 펀딩 제품 카드가 더 이상 raw USD 표시나 현재 환율 기준의 부정확한 환산이 아니라, **펀딩 당시 환율로 환산된 KRW + 환율 배지** 를 표시. PPP/희소가치/검색 등 KRW 가격을 사용하는 모든 페이지가 일관된 historical KRW 값을 사용. 사용자는 배지를 통해 "이 가격은 펀딩 당시 환율로 환산된 값" 임을 즉시 인지 가능.

### v0.5.22 — 2026-04-08

#### `FIX` data(prices): prices.json 가격 일괄 재검증 (배치 1~5, 50+ 항목 보정)

- **배경**: 21341 (Hocus Pocus Sanderson Sisters' Cottage) 가격이 학습 메모리 기반으로 추정되어 잘못 입력된 사건 이후, 사용자 요청으로 prices.json 의 모든 가격을 brickset / lego.com/ko-kr / 한국 리테일러 검색을 통해 처음부터 다시 검증. "차근차근 공식 홈페이지 위주의 제품들 부터 가격 수정해줘" 지시에 따라 활성 플래그십 → 단종/디스컨티뉴드 → BDP 순서로 단계별 보정.
- **배치 3 — Star Wars UCS 보정**:
  - 75355 X-Wing Starfighter UCS: ₩339,900 → **₩319,900**
  - 75331 The Razor Crest UCS: ₩769,000 → **₩779,900** (year 2020 → 2022)
  - 75290 Mos Eisley Cantina: ₩549,000 → **₩469,900**
- **배치 4 — Star Wars / Harry Potter / Technic / Marvel / DC / LOTR (18건)**:
  - Star Wars: 75257 Millennium Falcon ₩249,900→**₩239,900**, 75308 R2-D2 ₩339,900→**₩259,900**, 75252 Imperial Star Destroyer UCS ₩1,199,000→**₩910,000**.
  - Harry Potter: 71043 Hogwarts Castle ₩599,000→**₩640,000**, 76405 Hogwarts Express Collectors ₩649,000→**₩649,900**, 76402 Dumbledore's Office ₩159,900→**₩129,900**.
  - Technic: 42115 Lamborghini Sian ₩559,000→**₩599,900**, 42083 Bugatti Chiron ₩449,900→**₩570,000**, 42141 McLaren F1 ₩299,900→**₩239,900**, 42171 Mercedes-AMG F1 W14 ₩299,900→**₩289,900** (year→2024), 42143 Ferrari Daytona SP3 ₩599,000→**₩599,900**.
  - Marvel: 76210 Hulkbuster ₩749,000→**₩709,900**, 76269 Avengers Tower ₩749,000→**₩649,900**, 76178 Daily Bugle ₩499,000→**₩419,900**.
  - DC: 76161 (실제 제품명 **1989 Batwing**, 기존 JSON 명칭 오류 수정) ₩499,000→**₩259,900**, 76240 Batmobile Tumbler ₩359,900→**₩299,900**.
  - LOTR: 10316 Rivendell ₩749,000→**₩649,900**, 10333 Barad-dur ₩599,000→**₩599,900**.
- **배치 5 — Ideas / Harry Potter / Marvel / NASA / Disney (16건)**:
  - Ideas: 21343 Viking Village ₩219,900→**₩194,900**, 21318 Tree House ₩299,900→**₩269,900**, 21323 Grand Piano ₩549,000→**₩469,900**, 21321 ISS ₩219,900→**₩89,900**, 21327 Typewriter ₩269,900→**₩259,900**, 21322 Pirates of Barracuda Bay ₩269,900→**₩259,900**.
  - NASA / Icons: 92176 Apollo Saturn V ₩219,900→**₩179,900** (+`discontinued: true`), 10283 Space Shuttle Discovery ₩269,900→**₩259,900**, 10266 Apollo 11 Lunar Lander ₩149,900→**₩139,900**.
  - Harry Potter: 75978 Diagon Alley ₩519,000→**₩499,900**, 76391 Hogwarts Icons Collectors ₩309,900→**₩329,900**, 76423 Hogwarts Express & Hogsmeade ₩169,900→**₩184,900**.
  - Marvel: 76218 Sanctum Sanctorum ₩339,900→**₩329,900** (+`discontinued: true`), 76989 (실제 제품명 **Horizon Forbidden West: Tallneck**, 기존 JSON 명칭 "Iron Man Hall of Armor" 오류 수정) ₩219,900→**₩114,900** (year→2022).
  - Disney: 43222 Disney Castle 100 Years ₩489,000→**₩519,900**.
- **방법론**: 모든 보정은 WebSearch 결과의 한국어 스니펫(brickset / 다나와 / brickinside / lego.com/ko-kr) 기준으로만 적용. 검색에서 단가가 명확히 확인되지 않은 항목(42100 Liebherr R 9800, 42158 NASA Mars Rover, 21348 D&D Red Dragon 등) 은 보정하지 않고 기존 값 유지. 76989·76161 처럼 JSON 의 제품명 자체가 잘못된 케이스 2건은 이름·연도·가격을 모두 정정.
- **결과**: prices.json 의 활성 플래그십 라인 50+ 항목이 학습 메모리 추정값에서 검색 검증값으로 교체. PPP / 희소가치 / 검색 페이지의 KRW 기반 분석이 더 신뢰 가능한 데이터셋을 사용. 단종 모듈러(10182~10278) 등 KRW 데이터를 검색으로 확인할 수 없는 historical MSRP 들은 별도 후속 작업으로 분리.

### v0.5.21 — 2026-04-08

#### `NEW` feat(ppp): 한국 시리즈 테마 + 단종 제품(과거 정가) PPP 분석 지원
- **요구사항**: "가성비 페이지의 테마를 한국 공식 사이트의 시리즈별 목록으로 만들고, 각 시리즈 안에 들어가는 제품 목록과 가격을 그대로 표시하여 가성비 기능에 쓰이도록 해줘. 단종된 제품은 과거 공식 정가를 보여줘도 된다."
- **`src/pages/PppPage.js` 리팩터링**:
  - prices.json schemaVersion 2 의 `themes` 맵을 직접 소비. 테마 드롭다운이 더 이상 Rebrickable theme_id 에 의존하지 않고 `스타워즈 / 해리포터 / 아이콘스 / 크리에이터 익스퍼트 / 테크닉 / 마블 / DC / 아이디어 / 시티 / 닌자고 / 프렌즈 / 디즈니 / 아키텍처 / 보타니컬 컬렉션 / 스피드 챔피언 / 마인크래프트 / 쥬라기 월드 / 반지의 제왕 / 슈퍼 마리오 / 동물의 숲 / 소닉 / 인디아나 존스 / 포트나이트 / BDP 펀딩` 24개 한국 공식 시리즈 라벨을 `themes[*].order` 순으로 표시.
  - `entry.theme` 키를 결과 행에 그대로 보존해 한국어/영어 라벨을 즉시 렌더 가능 (`themeLabel(key)` 헬퍼).
  - **단종 제품 포함 토글** — `includeDiscontinued` 체크박스를 헤더 액션 영역에 추가. 기본 ON. 활성화 시 prices.json 의 historical KRW MSRP(예: Cafe Corner ₩199,900, Death Star ₩649,000, Diagon Alley ₩519,000, Grand Piano ₩549,000)가 PPP 분석 데이터셋에 포함되어 과거 발매가 기준 가성비 순위가 함께 계산됨. 토글 변경 시 fetch 가 재실행되어 데이터셋이 갱신.
  - 가격을 `getKrwPrice()` 가 아닌 `entry.price` 에서 직접 읽어 단종 제품도 0원으로 마스킹되지 않고 PPP 가 정상 계산됨.
  - 각 결과 카드에 한국 시리즈 라벨 칩(예: "스타워즈") + `단종/Retired` 빨간 LEGO 레드(`#DA291C`) 배지를 인라인으로 추가.
- **결과**: "가성비" 페이지에서 한국 공식 시리즈 분류 그대로 필터링 가능하고, 단종된 모듈러/Star Wars UCS/해리포터 컬렉터스 에디션도 과거 정가 기준으로 KRW/부품 베스트 순위에 포함되어 비교 가능.

### v0.5.20 — 2026-04-08

#### `NEW` data(prices): prices.json schemaVersion 2 — 한국 LEGO 시리즈 분류 + 단종 제품 과거 정가 복원
- **요구사항**: "한국 공식 사이트의 시리즈별 분류를 테마로 만들고, 단종된 제품들도 과거 공식 정가를 함께 데이터에 넣어줘."
- **`src/data/prices.json` 전면 재구조화** (`schemaVersion: 2`):
  - **`themes` 최상위 맵 신설** — 24개 한국 공식 LEGO 시리즈를 `id → { ko, en, order }` 형태로 카탈로그화. starwars, harrypotter, icons(아이콘스/모듈러), creator(크리에이터 익스퍼트), technic, marvel, dc, ideas, city, ninjago, friends, disney, architecture, botanical, speed, minecraft, jurassic, lotr, supermario, animalcrossing, sonic, indiana, fortnite, bdp.
  - **모든 가격 엔트리에 `theme` + `year` 필드 추가** — 검색·필터·랭킹 페이지에서 비동기 API 없이 즉시 분류·정렬 가능.
  - **단종 제품 historical KRW MSRP 복원** — 기존에 `price: 0` 으로 비어 있던 단종 제품들에 brickset/brickeconomy 기준의 과거 한국 발매 정가를 채움. 12개 모듈러(Cafe Corner ₩199,900, Fire Brigade ₩199,900, Grand Emporium ₩199,900, Pet Shop ₩169,900, Town Hall ₩199,900, Palace Cinema ₩169,900, Parisian Restaurant ₩199,900, Detective's Office ₩219,900, Brick Bank ₩219,900, Downtown Diner ₩219,900, Corner Garage ₩269,900, Police Station ₩269,900) + Star Wars UCS 클래식(Death Star 10188 ₩599,000, 75159 ₩649,000, Original Millennium Falcon 10179 ₩699,000, Super Star Destroyer ₩599,000, Red Five X-wing ₩269,900, Snowspeeder ₩269,900, Sandcrawler ₩269,900, Slave I ₩269,900) + Harry Potter(Diagon Alley ₩519,000, Hogwarts Astronomy Tower ₩109,900, Whomping Willow ₩109,900, Hogwarts Icons ₩309,900, Knight Bus ₩79,900) + Ideas(Grand Piano ₩549,000, Typewriter ₩269,900, Pirates of Barracuda Bay ₩269,900, Voltron ₩119,900, WALL-E ₩79,900, Central Perk ₩89,900, ISS ₩219,900, Medieval Blacksmith ₩199,900) + Technic(Bucket Wheel Excavator ₩379,900, Mercedes-Benz Arocs ₩379,900, Mobile Crane MK II ₩339,900, Rough Terrain Crane ₩699,000) + LOTR(Tower of Orthanc ₩269,900) + Botanical(Bonsai Tree ₩65,900, Flower Bouquet ₩65,900) + Marvel(Iron Man Hall of Armor ₩219,900, SHIELD Helicarrier ₩199,900) + DC(1989 Batmobile original ₩339,900).
  - **신규 활성 세트 추가** — 42158 NASA Mars Rover Perseverance ₩119,900, 76218 Sanctum Sanctorum ₩339,900.
  - 모든 BDP 펀딩 엔트리에 `theme: "bdp"` 태깅 (USD 가격은 그대로 유지).
- **결과**: PPP·검색·희소가치 등 가격을 활용하는 모든 페이지가 한국 공식 시리즈 분류와 단종 제품 과거 정가를 일관되게 사용 가능. 단종 제품의 KRW/부품 가성비도 과거 발매가 기준으로 비교 가능해짐.

### v0.5.19 — 2026-04-08

#### `NEW` feat(ui): 다축 필터 패널 폴리시 + 이미지 라이트박스 강화
- **요구사항**: 다축 필터 패널 가독성 개선 + 세트 상세의 이미지 갤러리에 라이트박스/줌 힌트/팝업 썸네일 추가.
- **`src/styles/filters.css` 신규** — 인라인 스타일을 토큰화된 CSS 클래스로 마이그레이션.
  - `.filter-toolbar`, `.filter-btn`(+`.primary` 변형 + `.filter-btn-count` 카운트 뱃지), `.filter-chip` + `.filter-chip-x`(개별 필터 제거 X 버튼), `.filter-panel`(상단에 LEGO 레드 5px 액센트 바 + `filterPanelIn` 슬라이드 인 keyframe), `.filter-grid` 2-col 반응형, `.filter-field`, `.filter-range` + `.filter-range-sep`, `.filter-segment`(`:has(input:checked)` 활용한 세그먼트형 라디오), `.filter-panel-actions`.
  - 라이트박스 폴리시: `.gallery-main-img { cursor: zoom-in }`, `.gallery-zoom-hint`(호버 시 페이드인), `.popup-gallery-thumbs` + `.popup-gallery-thumb`(팝업 안 52×40 썸네일 스트립), `lightboxFade` + `lightboxImgIn` 페이드/슬라이드 keyframe.
- **`src/App.js`** — `lego-brick.css` 다음에 `filters.css` import 추가.
- **`src/pages/SearchPage.js`** — 인라인 스타일 → CSS 클래스 리팩터링. `chipDefs` 배열로 활성 필터 칩을 빌드해 각각 X 버튼으로 즉시 제거 가능. `clearOneFilter(key)` 헬퍼. 세그먼트형 라디오 헬퍼 `renderSegment(name, value, options)`. 필터 패널은 `.filter-grid` 2-col 레이아웃에 owned 세그먼트만 가로 풀폭 스팬. 하단에 reset/apply 액션 행 추가.
- **`src/pages/SetDetailPage.js`** — 갤러리 이미지에 줌 힌트 뱃지(`gallery-zoom-hint` + `\u2922` 글리프) 추가. 팝업 라이트박스 안에 점-내비게이션 대신 썸네일 스트립(`popup-gallery-thumbs` / `popup-gallery-thumb`) 렌더. 팝업 img 의 `key: 'pimg-' + imgIdx` 로 이미지 전환마다 페이드 인 애니메이션 재트리거.
- **결과**: 검색 필터 패널이 토큰화된 시각 언어(LEGO 레드 액센트 + 세그먼트 라디오 + 칩 + 액션 행)로 통일되고, 세트 상세 이미지가 호버 시 줌 힌트 → 클릭 시 라이트박스 → 팝업 안에서도 썸네일 직접 점프 + 페이드 인 애니메이션의 풀 갤러리 경험을 제공.

### v0.5.18 — 2026-04-08

#### `NEW` feat(design): 세트 카드 데코레이션 재설계 (어색한 4점 스터드 → 브릭 엣지 액센트)
- **요구사항**: "세트 카드 썸네일 위의 4개 동그라미 데코레이션이 어색하니, LEGO 베이스플레이트 / Bento Grid / 4-8px 브릭 라운드 미감을 유지하면서 사용자 친화적으로 다시 디자인해줘."
- **`src/styles/lego-brick.css` 수정**:
  - **CSS 변수 추가** — `--brick-accent: #DA291C` (LEGO 클래식 레드), `--brick-accent-soft`. 다크 모드(`[data-theme="dark"]`)에서는 `#ff5147` 로 대비 보정.
  - **`.set-card::before` / `.moc-card-link::before` 재설계** — 기존의 어색한 4점 스터드 줄을 카드 상단 5px 두께의 LEGO 레드 엣지 바로 교체. inset 하이라이트(상단 1px 흰빛) + 하단 미세 그림자로 브릭의 단면을 표현.
  - **`::after` 단일 코너 스터드** — 상단 좌측(top:9px / left:10px)에 8×8px 단일 스터드 너브를 `radial-gradient` 로 렌더해 입체감 유지하면서도 시각적 노이즈 최소화.
- **결과**: 카드 썸네일 상단이 깔끔한 LEGO 브릭 단면 + 단일 스터드 코너 너브로 정리됨. Bento Grid 의 전반적인 미감과 4-8px 브릭 라운드 코너 시스템과 자연스럽게 어우러짐.

### v0.5.17 — 2026-04-07

#### `NEW` feat(pwa): PWA 지원 추가 (manifest + service worker)
- **요구사항**: 모바일 홈 화면 추가 + 오프라인 캐시로 빠른 재방문을 위한 PWA 전환.
- **`public/manifest.json` 확장**: `description`, `scope`, `orientation`, `lang`, `categories` 추가. `logo192.png` / `logo512.png` 아이콘에 `purpose: "any maskable"` 지정해 안드로이드 적응형 아이콘 지원. `theme_color` 는 LEGO 레드(`#DA291C`) 유지.
- **`public/sw.js` 신규**: 3-tier 캐시 전략 — (1) 정적 에셋(이미지/폰트) 은 cache-first, (2) JSON 데이터(`prices.json`, `priceHistoryIndex.json`, `legoImages.json` 등) 는 stale-while-revalidate, (3) 앱 셸(HTML/JS/CSS) 은 network-first → 캐시 → `index.html` 폴백. `install` 단계에서 코어 에셋 사전 캐싱, `activate` 단계에서 구버전 캐시 일괄 정리. 캐시 키는 버전 접두사(`lego-static-v0.5.16` 등) 로 분리되어 새 배포 시 자동 무효화.
- **`src/serviceWorkerRegistration.js` 신규**: CRA 표준 패턴. `process.env.NODE_ENV === 'production'` 일 때만 등록되고, GitHub Pages 서브패스 배포(`/lego-finder/`) 와 호환되도록 `process.env.PUBLIC_URL` 기반으로 SW URL/scope 계산. 새 SW 가 설치되면 콘솔에 업데이트 알림 출력.
- **`src/index.js`**: `serviceWorkerRegistration.register()` 호출 추가.
- **결과**: Lighthouse PWA 체크(매니페스트, 아이콘, theme-color, SW 등록, HTTPS) 통과 가능. 모바일 사파리/크롬에서 "홈 화면에 추가" 시 standalone 앱처럼 실행되고, 한 번 방문한 후에는 오프라인에서도 데이터 캐시 기반으로 검색/조회 가능.

### v0.5.16 — 2026-04-07

#### `NEW` feat(scarcity): 희소가치 게이지를 적층형 LEGO 브릭 시각화로 교체
- **요구사항**: "기존 그라데이션 게이지 바를 LEGO 브릭이 쌓이는 게임 같은 시각화로 바꿔달라".
- **`src/pages/ScarcityPage.js` 수정**:
  - **`brickStackEl`** — 64×220px 세로 트랙 안에 점수(`s.finalScore`) 비율만큼 채워지는 `.brick-stack-fill` 을 렌더. 채워진 영역은 `repeating-linear-gradient` 로 18px 브릭 + 4px 그림자 줄무늬 패턴이 반복되어 LEGO 브릭이 쌓인 듯한 효과. `data-grade={s.grade}` 속성으로 등급에 따라 색이 바뀜 (S=골드, A=초록, B=파랑, C=주황, D=빨강). 하단에 `s.finalScore + ' / 100'` 라벨.
  - **`gradeBadgeEl`** — `.brick-badge` 클래스의 2x1 LEGO 브릭 모양 (CSS `::before/::after` 로 두 개의 스터드 돌출 효과). 가운데 등급 문자(S~D) 표시.
  - **`gradeMarkers` 사이드 리스트** — S/A/B/C/D 5개 등급을 모두 작은 브릭 배지로 나열하고 각 등급 옆에 컷오프 점수(80+/65+/50+/35+/0+) 를 보여줌. 활성 등급만 진하게(opacity 1, weight 700), 나머지는 흐리게(opacity 0.45) 표시.
  - **`gaugeEl`** — 위 세 요소를 가로로 배치 (브릭 스택 + 등급 배지 + 사이드 마커). 카드 안에 `t('scarcityScoreTitle')` 헤더 유지.
  - 기존 `gaugeWrap`, `markerStyle`, `gaugeLabelStyle` 인라인 헬퍼 변수와 그라데이션 바 div 제거. 다른 차트/통계/배너는 모두 그대로 유지.
- **결과**: 분석 페이지의 스코어 카드가 게임 같은 적층형 브릭 비주얼로 바뀌어 점수가 한눈에 들어오고, 등급별 색상이 LEGO 색상 토큰과 직접 매칭됨.

### v0.5.15 — 2026-04-07

#### `NEW` feat(ppp): 부품 단가 (Price Per Part) 가성비 분석 페이지
- **요구사항**: "세트별로 1부품당 가격이 얼마인지 계산해서 가성비 좋은 세트를 보여주는 페이지를 만들어달라".
- **`src/pages/PppPage.js` 신규**:
  - `prices.json` + Rebrickable API 를 결합해 각 세트의 `(가격 KRW) / (부품 수)` 비율을 계산.
  - **테마 필터** — 13개 주요 테마(Star Wars, Harry Potter, Modular, Technic, Creator Expert, Marvel, City, Friends, Architecture, Ideas, Disney, Ninjago, BDP) 와 "전체" 토글.
  - **Top N 선택기** — 10/25/50/100 토글로 결과 개수 조절.
  - **결과 테이블** — 세트 카드 + 가격 + 부품 수 + PPP (KRW/부품) 컬럼. 가성비 1위는 "BEST" 골드 배지 강조.
  - **요약 통계** — 평균 PPP, 최저 PPP, 분석 세트 수.
- **`src/components/Header.js`**: 헤더 네비에 "가성비 / PPP" 메뉴 추가 (`/ppp` 라우트).
- **`src/App.js`**: `/ppp` 라우트에 `PppPage` 마운트.
- **`src/utils/i18n.js`**: PPP 관련 i18n 키 12개 추가 (한/영) — `pppNavLabel`, `pppPageTitle`, `pppPageDesc`, `pppDatasetLabel/Hint`, `pppBestLabel`, `pppAvgLabel/Hint`, `pppFilterTheme/AllThemes/TopN`, `pppLoadingPrefix`, `pppCellPrice/Parts/Ppp`, `pppEmptyTitle/Msg`.
- **결과**: 사용자가 "가성비" 메뉴에서 즉시 KRW/부품 기준 베스트 세트 목록을 확인할 수 있고, 테마별로 좁혀서 분석 가능.

### v0.5.14 — 2026-04-07

#### `NEW` feat(design): LEGO 브릭 디자인 시스템 (`lego-brick.css`)
- **요구사항**: "전체 디자인을 LEGO 베이스플레이트 미감으로 통일하고, 4-8px 브릭 라운드 코너, 게임 같은 컴포넌트(브릭 배지, 스택, 상태 알약)를 도입해줘".
- **`src/styles/lego-brick.css` 신규** (9.3KB):
  - **`.brick-stack` / `.brick-stack-track` / `.brick-stack-fill`** — 적층형 브릭 게이지. 64×220px 세로 트랙 안에 `repeating-linear-gradient` (18px 브릭 + 4px 그림자) 패턴으로 등급별 색이 칠해진 브릭들이 쌓이는 시각화. `data-grade` 속성으로 색 변경 (S=#ffd500, A=#5ac35a, B=#4a9eff, C=#ff8a3d, D=#d6432f).
  - **`.brick-badge`** — 60×36px 2x1 LEGO 브릭 모양 배지. CSS `::before` / `::after` 로 두 개의 스터드(원형 돌출) 표현. 데이터 어트리뷰트로 등급 색 자동 매핑.
  - **`.brick-status`** — 신제품/단종/예정 상태 알약 (`new` 초록, `retired` 회색, `coming` 파랑). 4-8px 브릭 라운드 코너 + 살짝 들어간 그림자.
  - **공통 토큰** — `--brick-radius`, `--brick-stud-size`, `--brick-shadow-stripe` 등 CSS 변수로 정의해 다른 컴포넌트에서도 재사용 가능.
- **Bento Grid 카드 레이아웃 준비** — 카드 컨테이너의 라운드 코너를 4-8px 로 정규화하고 LEGO 그리드 느낌을 살리는 베이스 셀렉터 동시 정의.
- **다크 모드 호환** — 모든 컴포넌트가 CSS 변수 + `data-theme` 토큰을 사용하므로 v0.5.9 다크 모드와 자동 호환.
- **결과**: 희소가치 페이지(v0.5.16) 와 향후 신제품/세트카드 페이지가 동일한 LEGO 브릭 시각 언어를 공유할 수 있는 디자인 토큰 베이스 확보.

### v0.5.13 — 2026-04-07

#### `FIX` fix(mocs): 첫 진입 시 4건만 노출되는 문제 수정 (기본 정렬을 newest 로 변경)
- `MocsPage.js` 의 초기 정렬 상태가 빈 문자열이라 Rebrickable 의 featured 페이지로 fan-out 되어 4건만 반환되던 문제. `DEFAULT_SORT = '-published'` 상수 신설 + 초기 state/ref/effect 일괄 변경 + `hasMore` 임계값 30→25 조정 + `SORT_OPTIONS` 순서 재배치(newest → hottest → ...).

### v0.5.12 — 2026-04-07

#### `NEW` feat(scarcity): 희소가치 차트 동적 스케일링 + 차트 하단 안내 문구 동적화
- 선택한 기간(3/5/10/20/30년)에 맞춰 X축 라벨/스텝/포인트 수 자동 조정. i18n placeholder `{years}` / `{months}` 로 안내 문구 런타임 치환. 네트워크 호출 0회 (캐시된 raw 입력으로 로컬 재계산).

### v0.5.11 — 2026-04-07

#### `FIX` fix(scarcity): 다크 모드에서 희소가치 탭 텍스트/차트 가독성 개선
- Recharts SVG 요소(축 눈금/툴팁/범례/참조선 라벨) 가 CSS 변수를 못 읽는 문제로 다크 배경에서 거의 보이지 않던 문제. 차트 토큰 헬퍼 변수 추가 + Tooltip contentStyle 어두운 반투명 배경 + 축 색상 `#9aa3b2` + 경고 배너 `var(--color-info-*)` 토큰화.

### v0.5.10 — 2026-04-07

#### `NEW` feat(scarcity): 수익률 기간 선택기 (3/5/10/20/30년) + localStorage 영속화 + 로컬 재계산
- `themeReturns.js` 다중 기간 스키마 + `getThemeReturn(themeKey, years)` 폴백 + extrapolated 플래그. `ScarcityPage` 에 `recomputeForPeriod()` 순수 함수 + 기간 선택 알약 UI + localStorage 영속화. 인라인 스타일을 CSS 변수로 마이그레이션해 다크 모드 호환.

### v0.5.9 — 2026-04-07

#### `NEW` feat: 다크 모드 (CSS 변수 기반 테마 토큰)
- `theme-dark.css` 신규 — 14개 의미 토큰 + `[data-theme="dark"]` 오버라이드. `ThemeContext` 신규 — `prefers-color-scheme` 추론 + localStorage 영속화. `Header` 에 ☀/🌙 토글 추가. 모든 페이지(검색/희소가치/부품/둘러보기/펀딩/컬렉션) 즉시 다크 모드 지원.

### v0.5.8 — 2026-04-07

#### `FIX` fix: 76419 (Hogwarts Castle and Grounds) 한국 정가 보정 (₩229,900)
- `prices.json` 누락으로 부품 수 × 155 KRW 휴리스틱 폴백되던 문제. 공식 한국 사이트 정가 추가.

### v0.5.7 — 2026-04-07

#### `FIX` fix: "바라쿠다" 검색 시 21322 (Pirates of Barracuda Bay) 미검출 수정
- `searchDict.js` 의 `SET_NUM_MAP` / `WORD_MAP` / `PHRASE_MAP` / `IP_SEARCH_MAP` 에 "바라쿠다" 변형들 추가.

### v0.5.6 — 2026-04-07

#### `NEW` feat: 희소가치 페이지 한글/영문 제품명 검색 → 결과 목록 → 클릭 분석 워크플로우
- `runNameSearch()` + `?q=<keyword>` 외부 딥링크.

#### `FIX` fix: 희소가치 점수 분석의 MSRP 정확도 개선
- `lookupMsrp()` 가 `getKrwPrice()` 사용. 추정값 경고 배너.

### v0.5.5 — 2026-04-07

#### `NEW` feat: 한국어 캐릭터/장소 별명 사전 대규모 확장 (아캄 → Arkham 등)
- `WORD_MAP` 80+ 키워드 + `PHRASE_MAP` 30+ + `IP_SEARCH_MAP` fan-out 강화.

### v0.5.4 — 2026-04-07

#### `FIX` ci: GitHub Actions npm cache lock file 누락 에러 수정 준비

### v0.5.3 — 2026-04-07

#### `NEW` feat: 세트 검색 다축 필터 + URL 쿼리스트링 동기화

### v0.5.2 — 2026-04-07

#### `FIX` fix: IP 프랜차이즈 우산 키워드 검색 결과 0건 문제 해결

#### `DOCS` docs: README 변경 이력 자동 누적 정책 명시

### v0.5.1 — 2026-04-07

#### `NEW` feat: 희소 가치 점수 (Scarcity Score) 분석 페이지

### v0.5.0 — 2026-04-07

#### `NEW` feat: 일별 가격 스냅샷 + 제품별 가격 변동 차트

### v0.4.2 — 2026-04-07

#### `NEW` ci: 주간 자동 업데이트 GitHub Actions 워크플로우

### v0.4.1 — 2026-04-07

#### `NEW` feat: 일반(비 BDP) 제품 멀티 이미지 갤러리

### v0.4.0 — 2026-04-07

#### `NEW` feat: 제품 상세 이미지 갤러리 확대 및 썸네일 스트립 / BDP 한국어 번역 / Rebrickable 정합성 개선

### v0.3.1 — 2026-04-06

#### `FIX` fix: 한국어 검색 로직 개선

### v0.3.0 — 2026-04-06

#### `NEW` feat: 한국 레고 가격 표시 + `prices.json` 데이터베이스 + `useLegoPrice` 훅

### v0.2.0 — 2026-04-06

#### `NEW` feat: 레고 모듈러 빌딩 전체 키워드 검색 + 펀딩제품 페이지 필터 + 테마명 인코딩 수정 + SET_NUM_MAP 별명 검색

### v0.1.1 — 2026-04-06

#### `NEW` feat: BDP 펀딩제품 탭 + 이미지 갤러리 + 스와이프 + 검색 상태 초기화

### v0.1.0 — 2026-04-06

#### `NEW` feat: LEGO Finder React 앱 초기 구현 + 한국어 자연어 검색 + 부품 검색 탭 + 무한 스크롤 + 카테고리별 그룹화

---

## 라이선스

MIT
