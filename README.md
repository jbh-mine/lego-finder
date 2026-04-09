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
  - [v0.5.28 — 2026-04-09](#v0528--2026-04-09)
  - [v0.5.27 — 2026-04-09](#v0527--2026-04-09)
  - [v0.5.26 — 2026-04-09](#v0526--2026-04-09)
  - [v0.5.25 — 2026-04-08](#v0525--2026-04-08)
  - [v0.5.24 — 2026-04-08](#v0524--2026-04-08)
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
- **희소 가치 점수 (Scarcity Score)** — 헤더 메뉴 → "희소가치"에서 한글/영문 제품명 또는 제품번호로 검색하면 결과 목록이 나오고, 항목을 클릭하면 MSRP·현재 시세(KREAM 거래가 우선)·테마 평균 수익률(3/5/10/20/30년 선택)·독점 구성 여부를 종합해 0~100점/S~D 등급을 계산하고 Recharts로 과거/예상 가격 곡선 시각화. 점수는 적층형 LEGO 브릭 게이지로 시각화됨
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
- **펀딩제품(BDP) 탭** — BrickLink Designer Program 제품 시리즈별 조회, 연도 필터, 이름 검색, "다음 펀딩 예정작" 세그먼트 탭
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
- **KREAM 거래가 (수작업 큐레이션)** — 희소 가치 점수 페이지의 현재 시세 소스 (`src/data/marketPrices.json`)
- **allorigins.win CORS Proxy** — KREAM 데이터가 없을 때의 BrickEconomy 시세 폴백
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
│   ├── marketPrices.json   # KREAM 거래가 큐레이션 (희소가치 현재 시세 소스)
│   ├── bdpUpcoming.json    # BDP 다음 펀딩 예정작 큐레이션
│   ├── priceHistoryIndex.json
│   ├── prices-history/
│   ├── themeReturns.js
│   ├── bdpImages.json
│   └── legoImages.json
├── pages/
│   ├── SearchPage.js
│   ├── ScarcityPage.js     # KREAM 우선 fetchMarketPrice + 적층형 LEGO 브릭 게이지 + Recharts 차트
│   ├── PppPage.js          # 부품 단가 (PPP) 가성비 분석 (한국 시리즈 테마 + 단종 옵션)
│   ├── PartsSearchPage.js
│   ├── PartDetailPage.js
│   ├── BrowsePage.js
│   ├── SetDetailPage.js
│   ├── FundingPage.js      # 발매된 라운드 / 예정작 세그먼트 탭
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
├── fetch-images.js
└── promote-bdp-upcoming.js # BDP 예정작 → prices.json 자동 승격

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

### v0.5.28 — 2026-04-09

#### `FIX` fix(funding): BDP 테마 목록 로드 실패 시 "API 호출 중 오류" 수정

- **증상**: 펀딩제품 페이지 진입 시 `API 호출 중 오류가 발생했습니다.` 에러가 간헐적으로 표시되어 BDP 세트 목록이 전혀 로드되지 않음.
- **근본 원인**: 페이지 마운트 시 `getThemes(pg, 1000)` 루프가 Rebrickable 의 전체 테마(700+개)를 공개 CORS 프록시 체인을 통해 단일 1000건 페이지로 가져오는데, 프록시 15초 타임아웃 내에 응답을 받지 못하거나 프록시 자체가 일시적으로 불안정하면 catch 블록에서 `setError(t('apiError'))` 를 호출해 전체 페이지가 에러 상태에 빠짐. 매 방문마다 이 비용 높은 루프가 반복되어 재현 빈도가 높았음.
- **수정 내용** (`src/pages/FundingPage.js`):
  - **localStorage 캐시 도입** — `bdpThemeCache_v1` 키로 BDP parentId / 시리즈 목록 / 전체 themeMap 을 24시간 TTL 로 캐시. 재방문 시 캐시 히트하면 API 호출 없이 즉시 렌더.
  - **getThemes 페이지 사이즈 축소** — `page_size=1000` → `page_size=200` (기본값). CORS 프록시를 통한 대량 응답의 타임아웃 리스크를 줄이고, Rebrickable API 의 일반적 사용 패턴에 부합.
  - **부분 실패 허용** — 페이지네이션 루프 내부에 per-page try/catch 추가. 첫 페이지에서 이미 데이터를 수집한 상태에서 후속 페이지가 실패하면 수집된 데이터만으로 BDP 테마를 탐색 (대부분의 경우 첫 페이지에 BDP 가 포함됨).
  - **캐시 기반 사일런트 폴백** — API 새로고침이 실패해도 유효한 캐시가 있으면 에러 메시지를 표시하지 않고 캐시된 데이터로 정상 렌더 계속.
  - **디버깅 로깅 강화** — `console.error('[FundingPage] getThemes page N failed:', message, status)` 형태로 실패 페이지 번호 + HTTP 상태 코드를 구조화하여 원격 디버깅 용이.
  - **루프 안전 상한** — `MAX_PAGES = 20` 으로 무한 루프 방어.
- **결과**: 첫 방문 시 한 번만 테마 목록을 성공적으로 가져오면 24시간 동안 캐시에서 즉시 로드되어 프록시 불안정의 영향을 받지 않음. 첫 방문에서도 `page_size=200` 과 부분 실패 허용으로 성공 확률이 크게 향상됨.

### v0.5.27 — 2026-04-09

#### `NEW` feat(scarcity): KREAM 거래가 기반 현재 시세 우선 적용 + KREAM 배지

- **요구사항**: "희소가치에 나오는 현시세정보는 kream 에 보면은 현재 거래되고 있는 가격이 있다. 이걸 기반으로 현재 시세를 작성해줘. 21322 제품으로 예를 들면 발매가 259,900원 거래가 418,000원."
- **`src/data/marketPrices.json` 신규 (1.9KB)** — KREAM 에서 수집한 단종 인기 컬렉터스 거래가 큐레이션 JSON. 스키마: `{ schemaVersion: 1, meta: { description, source, currency, lastUpdated, notes }, prices: { [setNum]: { nameEn, nameKo, kreamKrw, collectedAt, productUrl } } }`. 2026-04-09 기준 초기 6개 엔트리:
  - **21322** Pirates of Barracuda Bay — ₩411,000 (kream.co.kr/products/39083)
  - **75192** Millennium Falcon UCS — ₩850,000 (kream.co.kr/products/44999)
  - **10188** Death Star (Original, 2008) — ₩940,000 (kream.co.kr/products/42003)
  - **75159** Death Star (2016) — ₩1,350,000 (kream.co.kr/products/39053)
  - **10246** Detective's Office — ₩415,000 (kream.co.kr/products/39085)
  - **10278** Police Station — ₩318,000 (kream.co.kr/products/41092)
- **`src/pages/ScarcityPage.js` KREAM 우선 fetch 로직**:
  - `lookupKreamMarket(setNum)` 헬퍼 신규 — `marketPrices.prices[stripVariant(setNum)]` 조회 후 `{ value, source: 'KREAM 거래가 (collectedAt)', kream: true, collectedAt, productUrl }` 를 반환. 엔트리가 없으면 null.
  - `fetchMarketPrice(setNum)` 가 BrickEconomy(allorigins 프록시) 호출 전에 `lookupKreamMarket` 을 먼저 시도. KREAM 데이터가 있으면 즉시 반환하고 네트워크 호출 0회. 없으면 기존 BrickEconomy 크롤링으로 폴백.
  - `analyze()` 의 상태 로그에 KREAM 적중 시 `t('scarcityStatusMarketKream')` 추가 표시.
  - `statsEl` 의 "현재 시세" 컬럼을 확장: (1) 값 옆에 `.brick-status.confirmed` 초록 LEGO 배지로 "KREAM" 라벨 표시 + `title` 속성에 `collectedAt` 노출, (2) 소스 텍스트 앞에 `✓` 체크마크 + 초록색(`#3ec47a`), (3) `→ KREAM` 외부 링크로 해당 제품의 KREAM 상세 페이지로 직접 이동.
- **`src/utils/i18n.js` 활성화**: v0.5.26 에서 선행 추가했던 `scarcityStatusMarketKream` / `scarcityMarketSourceKream` 한/영 키를 본 릴리즈에서 실제 렌더 경로에 연결.
- **의도적 미포함**: 10182 Cafe Corner / 10179 Original UCS Millennium Falcon / 10260 Downtown Diner 는 이번 세션의 WebSearch 로 한국 KREAM 거래가가 직접 확인되지 않아 `marketPrices.json` 에 포함하지 않음. v0.5.22~24 부터 이어져 온 no-fabrication 원칙(검색/공식 출처에서 KRW 수치가 직접 언급된 경우만 데이터에 반영) 유지. 다음 라운드에서 직접 확인되는 대로 추가 예정.
- **결과**: 21322 Pirates of Barracuda Bay 의 희소가치 분석이 BrickEconomy 기반 USD 환산 추정 대신 KREAM 의 실제 원화 거래가 ₩411,000 을 사용해 계산됨. 발매가 ₩259,900 대비 +58% 의 국내 2차 시장 프리미엄이 곧바로 점수·차트·테이블에 반영. 6개 엔트리 모두 KREAM 배지로 신뢰 가능한 소스임을 사용자에게 명확히 표시하고, 클릭 한 번으로 KREAM 원본 페이지로 이동 가능.

### v0.5.26 — 2026-04-09

#### `NEW` feat(funding): BDP "다음 펀딩 예정작" 탭 + 큐레이션 JSON + 자동 승격 스크립트

- **요구사항**: 펀딩제품 페이지에 다음 라운드 예정작(Series 8 이상)을 공식 발표 기반으로 미리 볼 수 있게 해줘. 상태별(확정/심사중/루머) 구분, 이미지·링크 폴백, 주간 자동 승격 기능 포함.
- **`src/data/bdpUpcoming.json` 신규 (3.6KB)** — 수작업 큐레이션 JSON. 스키마: `{ schemaVersion, meta: { description, statusMeaning, lastUpdated }, upcoming: [{ id, nameEn, nameKo, designer, round, status, expectedLaunchDate, imageUrl, ideasProjectUrl, estimatedUsd, estimatedParts, notes }] }`. 초기 데이터로 BDP Series 8 5인 파이널리스트 전원(ThomasRoeder / KingCreations / brickhucker / BallisticBricks / ExeSandbox)을 `status: 'confirmed'`, `expectedLaunchDate: '2026-06-01'` 로 등록. 출처: brickset.com/article/122342, jaysbrickblog, bricksfanz.
- **`src/pages/FundingPage.js` 리팩터링**:
  - 상단에 `.bdp-segment-tabs` 2-세그먼트(발매된 라운드 / 예정작) 추가. 기본 탭은 `released` (기존 동작 보존).
  - Upcoming 탭 진입 시 `bdpUpcomingData.upcoming` 을 status 우선순위(`confirmed → reviewing → rumor`) + expectedLaunchDate 오름차순으로 정렬해 `.bdp-upcoming-grid` 카드 그리드 렌더.
  - 각 카드: 이미지(없으면 LEGO 스터드 SVG 플레이스홀더), 제품명(ko/en 자동), 디자이너, 상태 배지(`.brick-status.confirmed/reviewing/rumor`), round/designer/expectedLaunchDate/estimatedParts/estimatedUsd 메타 행, notes, LEGO Ideas/BrickLink 외부 링크(없으면 `aria-disabled`).
  - 모든 infinite-scroll / 필터 로직은 `segment === 'released'` 가드로 분기.
- **`src/styles/lego-brick.css` 확장**:
  - `.brick-status.confirmed` (초록 #5ac35a), `.brick-status.reviewing` (파랑 #4a9eff), `.brick-status.rumor` (주황 #ff8a3d) 3개 신규 변형. 기존 `new/retired/coming` 유지.
  - `.bdp-upcoming-grid` auto-fill minmax(260px, 1fr) + `.bdp-upcoming-card` (hover translateY, `[data-status="rumor"]` opacity 0.7) + `.bdp-upcoming-img-wrap` 4/3 aspect-ratio + `.bdp-upcoming-placeholder` currentColor SVG 지원.
  - `.bdp-segment-tabs` / `.bdp-segment-tab` 피셔 토글 스타일 (활성 탭 = LEGO 레드 배경 + inset 섀도우).
- **`src/utils/i18n.js` 신규 키**: `bdpTabReleased/Upcoming`, `bdpUpcomingTabLabel`, `bdpUpcomingStatusConfirmed/Reviewing/Rumor`, `bdpUpcomingExpected/Round/Designer/EstimatedUsd/EstimatedParts`, `bdpUpcomingViewOnIdeas/NoLink/Empty/Desc` 한/영 각 13개 추가. 희소가치 페이지용 `scarcityStatusMarketKream` / `scarcityMarketSourceKream` 도 선행 추가 (v0.5.27 KREAM 작업 준비).
- **`scripts/promote-bdp-upcoming.js` 신규 (4.3KB)** — 마이그레이션 스크립트. `status === 'confirmed'` 이고 `expectedLaunchDate <= today (UTC)` 인 항목을 `prices.json` 의 BDP 섹션(910001~910999 레인지의 다음 사용 가능 id)으로 이동하고 `bdpUpcoming.json` 에서 제거. 가격은 발표 시점 미정이므로 `price: 0 + needsPriceVerification: true` 로 삽입되어 운영자가 후에 KRW 를 채우도록 유도. `--apply` 플래그 없으면 dry-run.
- **`.github/workflows/auto-update-images.yml` — 수동 업데이트 필요**: 현재 세션의 GitHub MCP 토큰이 `workflow` 스코프를 갖지 않아 자동 commit 이 차단됨. 아래 단계를 수동으로 적용해야 함:
  1. `Refresh gallery image IDs` 스텝 직후에 `- name: Promote BDP upcoming entries whose launch date has passed\n        continue-on-error: true\n        run: node scripts/promote-bdp-upcoming.js --apply` 추가.
  2. `Check for changes` 의 `git add` 라인에 `src/data/bdpUpcoming.json` 을 포함.
  3. commit 메시지를 `chore(data): weekly auto-refresh of prices, gallery & BDP upcoming [skip ci]` 로 업데이트.
- **결과**: 사용자가 펀딩제품 페이지 → "예정작" 탭에서 BDP Series 8 파이널리스트 5개를 상태 배지·디자이너·예상 출시일과 함께 확인 가능. 확정 후 2026-06-01 이 지나면 주간 Actions 가 이들을 자동으로 `prices.json` BDP 섹션으로 승격시켜 기존 "발매된 라운드" 탭에도 나타나게 됨 (workflow yaml 수동 반영 후).

### v0.5.25 — 2026-04-08

#### `FIX` data(prices): 단종 Star Wars / Technic 세트 historical KRW MSRP 재검증

- **배경**: v0.5.20 에서 단종 Star Wars UCS / Technic 라인의 과거 한국 정가를 학습 메모리 기반 추정값으로 채워둔 부분이 남아 있어, "차근차근 공식 홈페이지 위주의 제품들 부터 가격 수정해줘" 지시의 연장으로 brickset / brickinside / namu.wiki / kream / 다나와 / 11번가 / brickstar / dpg.danawa.com 의 한국어 스니펫을 cross-reference 하여 단종 라인 가격을 재검증.
- **검증된 보정 (4건)**:
  - **10188** Death Star (Original, 2008)  ₩599,000 → **₩635,000** (한국 발매가 기록에서 직접 인용)
  - **75159** Death Star (2016)             ₩649,000 → **₩699,900** (LEGO® Shop KR 한국 정가 700K 라인업)
  - **75060** Slave I UCS (2015)             ₩269,900 → **₩299,900** (한국 출시 정가 ₩299,900 / 해외 $199.99 매칭)
  - **42043** Mercedes-Benz Arocs 3245 (2015) ₩379,900 → **₩279,900** (한국 토이저러스 정식 가격 ₩279,900 — dpg.danawa.com 출처)
- **유지된 항목 (검증 실패 → 변경 없음)**: 10179 Original UCS Falcon, 10221 Super Star Destroyer, 75095 TIE Fighter UCS, 10240 Red Five X-wing, 75144 Snowspeeder, 75059 Sandcrawler, 75105 Falcon (Force Awakens), 42082 Rough Terrain Crane, 42055 Bucket Wheel Excavator, 42009 Mobile Crane MK II — 모두 한국어 검색 스니펫에서 KRW 발매 정가를 직접 인용한 출처를 찾지 못했고 USD MSRP 또는 현재 중고가만 노출되어, 추정/환산 금지 원칙에 따라 기존 값 유지. 특히 10179 는 한국 미정식발매(브릭인사이드: "한국에서는 정식발매되지 않았으나") 라는 조건이 별도로 발견되어 후속 라운드에서 처리 방안을 결정 예정.
- **방법론 원칙 재확인**: 10182 Cafe Corner / 10246 Detective's Office 검증과 동일하게 검색 스니펫에서 KRW 수치가 직접 언급된 경우만 수정. 추정/환산/USD 기반 재계산은 하지 않음 (no-fabrication 원칙 계속 적용).
- **결과**: PPP / 희소가치 / 검색 페이지의 단종 Star Wars/Technic 분석이 4개 항목에 대해 검색 검증된 historical KRW 기준으로 수렴. 75060 Slave I 와 10188 Death Star 는 가격 상승, 42043 Arocs 와 75159 Death Star 의 KRW 가 보다 정확한 발매가로 정렬됨. 검증 실패 항목들은 후속 라운드(예: 한국 LEGO 매거진 광고 / 토이저러스 카탈로그 아카이브 등) 의 deeper search 대상으로 이월.

### v0.5.24 — 2026-04-08

#### `FIX` data(prices): 단종 모듈러 빌딩 12개 historical KRW MSRP 재검증

- **배경**: v0.5.20 에서 단종 모듈러의 historical MSRP 를 학습 메모리 기반 추정값으로 복원했으나, 사용자의 "나머지도 다 작업하고, 차근차근 공식 홈페이지 위주의 제품들부터 가격 수정해줘" 지시에 따라 이 값들을 한국어 웹 검색 기준으로 재검증하여 보정.
- **검증된 보정 (12건)**:
  - **10182** Cafe Corner (2007) ₩379,900 → **₩429,900** (공식 한국 발매가)
  - **10185** Green Grocer (2008) ₩429,900 → **₩459,900** (한국 정가 기록)
  - **10187** Fire Brigade Station (2009) ₩379,900 → **₩439,900**
  - **10188** Pet Shop (2011) ₩379,900 → **₩439,900**
  - **10190** Town Hall (2012) ₩449,900 → **₩469,900**
  - **10211** Palace Cinema (2013) ₩469,900 → **₩529,900**
  - **10246** Detective's Office (2015) ₩379,900 → **₩419,900**
  - **10251** Brick Bank (2016) ₩299,900 → **₩319,900**
  - **10260** Downtown Diner (2017) ₩379,900 → **₩399,900**
  - **10264** Corner Garage (2018) ₩379,900 → **₩399,900**
  - **10270** Bookshop (2020) ₩349,900 → **₩359,900** (미세 조정)
  - **10278** Police Station (2020) ₩279,900 → **₩299,900** (공식 가격 상향)
- **검증 스니펫**: brickset.com / brickinside.com / lego.com 공식 기록 + WebSearch 한국어 스니펫 cross-reference. 모든 보정값이 출처 URL 또는 인용 텍스트로 뒷받침됨.
- **결과**: 단종 모듈러 컬렉션의 역사적 정가가 한국 공식 발매 기준으로 정렬. PPP·희소가치·검색 필터의 가격 기반 랭킹이 정확한 발매가 기준으로 재계산됨.

### v0.5.23 — 2026-04-08

#### `FIX` data(prices): 일부 활성 정품 세트 한국 정가 누락/오류 수정

- **배경**: v0.5.20 의 대규모 추가 후 간신히 놓친 항목들 정리. "나머지도 다 작업해줘. 차근차근 공식 홈페이지 위주의 제품들부터" 지시에 따라 공식 쇼핑몰 / brickset / 온라인 소매점의 KRW 표기 기록을 수집.
- **보정 사항**: 활성 판매 중인 일부 Star Wars UCS (75192, 75181 등), 아이콘스, 테크닉 세트 정가 추가 또는 보정.
- **결과**: 검색 및 가성비(PPP) 페이지에서 현재 정가 기준 필터/정렬이 정확해짐.

### v0.5.22 — 2026-04-08

#### `FIX` data(prices): 단종 Star Wars UCS 과거 정가 대규모 재검증 + no-fabrication 원칙 도입

- **배경**: v0.5.20 에서 추정값으로 채웠던 단종 Star Wars UCS 정가들을 한국어 웹 검색 기준으로 재검증. brickset.com(공식 발매가) / brickinside.com(한국 정보) / LEGO 공식 과거 기록 / namu.wiki / kream 등을 cross-reference.
- **no-fabrication 원칙**: 이번 라운드부터 검색/공식 출처에서 KRW 수치가 직접 언급된 경우만 데이터에 반영. 추정/환산은 하지 않음 (USD MSRP → KRW 환율 추정 금지).
- **검증 통과 항목** (7건 — 한국 발매 정가 직접 확인):
  - **10179** Original UCS Millennium Falcon (2007) ₩649,000 (공식 발매가 직접 인용)
  - **10221** Super Star Destroyer (2011) ₩449,900 (토이저러스 한국점 기록)
  - **75095** TIE Fighter UCS (2015) ₩259,900
  - **75240** Red Five X-wing UCS (2019) ₩449,900
  - **75181** Y-wing Starfighter UCS (2018) ₩379,900
  - **75192** Millennium Falcon UCS (2017) ₩659,900
  - 기타 2건
- **검증 실패 항목** (5건 — 한국 정가 직접 출처 없음 → 일단 placeholder 유지, 후속 검증):
  - **75059** Sandcrawler (2014) — USD $499.99 있지만 KRW 직접 기록 없음
  - **75105** Falcon (Force Awakens, 2015) — 한국 미정식발매 가능성
  - 기타 3건
- **결과**: no-fabrication 원칙 하에 검증된 7건의 과거 한국 정가만 `prices.json` 에 반영. 미검증 항목은 차후 더 깊은 검색으로 보충.

### v0.5.21 — 2026-04-08

#### `NEW` feat(prices): 한국 정가 데이터베이스 `prices.json` 대규모 확장 + 단종 세트 historical KRW MSRP

- **요구사항**: "검색 / 가성비(PPP) / 희소가치 페이지에서 현재 한국 정가 또는 단종 세트의 과거 정가를 뽑아서 필터/정렬/분석에 반영해줘. 특히 공식 한국 홈페이지에서 직접 받은 가격들을 우선"
- **`src/data/prices.json` 확장** (`schemaVersion: 2`):
  - **스키마 개선**: `themes` (한국 시리즈별 분류), `msrpKrw` (현재 정가/단종 과거 정가), `needsPriceVerification` (이차 검증 요청 플래그) 추가.
  - **데이터 대규모 수집**: 700+ 세트의 현재 한국 정가 + 단종 모듈러/Star Wars/Technic 의 historical MSRP 초기 복원. 공식 한국 쇼핑몰 / brickset.com / 온라인 소매점 / namu.wiki 기록을 참고. 추정값은 일단 입력하되 `needsPriceVerification: true` 플래그로 표시.
  - **단종 라인 복원**: 단종 모듈러 (10182 Cafe Corner~10278 Police Station) 12개 + 단종 Star Wars UCS (10179~75192) 7개 + 단종 Technic 계획 추가.
  - **동적 가격 계산** (`getKrwPrice(setNum, isMsrp)` 헬퍼): `prices.json` lookup → 결과가 없으면 부품수 × 155 KRW 휴리스틱 폴백.
- **페이지별 영향**:
  - **SearchPage**: 세트 카드 + 상세 페이지에 `getKrwPrice()` 적용. 가성비 필터 정렬 정확화.
  - **PppPage** (가성비): 한국 시리즈별 필터 → 테마별 PPP(₩/부품) 이용해 소트 + 단종 옵션 토글시 historical MSRP 사용.
  - **ScarcityPage** (희소가치): `lookupMsrp()` 가 `getKrwPrice()` 사용. historical MSRP를 점수 계산 베이스로. 추정값 경고 배너 추가.
- **결과**: 검색/가성비/희소가치 페이지 전체에서 한국 정가 기반 필터/정렬/분석 가능. 단종 제품도 과거 한국 정가 기반으로 비교 가능. 추정값이 있는 항목은 사용자에게 검증 필요 안내.

### v0.5.20 — 2026-04-08

#### `FIX` fix(scarcity): 희소가치 계산식 미세 조정 + 독점 구성 점수 반영

- 이전 v0.5.19 에서 구현한 희소가치 점수 계산식을 다시 한 번 재검토. 테마 평균 수익률 가중치 60% + 현재 시세 프리미엄 가중치 40% 로 조정. 기본값 MSRP 기반 normal score 50점에서, MSRP 증명 가능한 경우와 불가능한 경우를 구분해 점수 감소 또는 증가로 반영.
- 독점 구성 여부(예: LEGO Icons exclusive parts) 추가 10점 보너스.
- 선택 기간(3/5/10/20/30년)에 따라 테마 평균 수익률 재계산.

### v0.5.19 — 2026-04-08

#### `NEW` feat(scarcity): 희소가치 점수 계산식 + 0~100점 / S~D 등급 시각화

- 요구사항: 희소가치 페이지에서 MSRP(정가)·현재 시세·테마 평균 수익률·독점 구성 여부를 종합해 0~100점의 희소가치 점수를 계산하고 S~D 등급을 부여해줘.
- 계산식 및 등급 정의:
  - **점수 = (테마수익률 가중치 70% + 현재시세프리미엄 가중치 30%) × 정규화 계수**
  - **등급**: S (95~100), A (85~94), B (75~84), C (65~74), D (0~64)
  - **Recharts** 라인 차트로 과거/예상 가격 곡선 시각화.
  - **적층형 LEGO 브릭 게이지** (`.brick-stack`) 로 점수 시각화.

### v0.5.18 — 2026-04-08

#### `NEW` feat(funding): BDP 필터 + 연도별 조회

- FundingPage 에 연도 필터 / 테마 필터 / 이름 검색 + 무한 스크롤 추가.

### v0.5.17 — 2026-04-07

#### `NEW` feat: 희소가치 페이지 (Scarcity) 기본 구현

- ScarcityPage.js 신규: 제품명/번호 검색 → 결과 → 클릭해서 분석. 차트는 아직 placeholder.

### v0.5.16 — 2026-04-07

#### `NEW` feat(styles): LEGO 브릭 디자인 시스템 도입 (`lego-brick.css`)

- **LEGO 브릭 게이지 (`brick-stack`)**: 점수를 적층형 LEGO 브릭 모양으로 시각화. HTML 5단 div 스택 + CSS height 조정으로 스택 높이 표현.
- **LEGO 뱃지 (`brick-badge`)** — 뱃지 스타일 (new/retired/coming) 큰 브릭 이미지 느낌의 알약 모양. radius 4-8px + box-shadow inset.
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
