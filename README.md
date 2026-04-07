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
- **희소 가치 점수 (Scarcity Score)** — 헤더 메뉴 → "희소가치"에서 한글/영문 제품명 또는 제품번호로 검색하면 결과 목록이 나오고, 항목을 클릭하면 MSRP·현재 시세·테마 평균 수익률(3/5/10/20/30년 선택)·독점 구성 여부를 종합해 0~100점/S~D 등급을 계산하고 Recharts로 과거/예상 가격 곡선 시각화 (선택 기간에 따라 차트 X축이 동적으로 스케일링됨)
- **다크 모드** — 헤더 토글로 라이트/다크 테마 전환. CSS 변수 기반 토큰으로 모든 카드/입력/차트가 일관되게 전환되며 localStorage 에 사용자 선택 저장
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
- **이미지 갤러리 + 스와이프** — 제품 상세에서 Rebrickable 멀티 이미지(BDP + 일반 제품 모두), 터치 스와이프, 썸네일 스트립, 팝업 스와이프
- **무한 스크롤** — 검색/부품/둘러보기 모두 스크롤 시 데이터 자동 로드
- **테마/연도 필터링** — 테마별, 연도별 브라우징 (테마명 한국어 번역 지원)
- **세트 상세 정보** — 부품 목록, 미니피규어, 색상 정보 확인
- **부품 상세 정보** — 사용 가능한 색상, 엘리먼트 ID, 포함된 세트 목록
- **한국 레고 가격 표시** — 세트 카드와 상세 페이지에서 KRW 가격 표시
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
- **GitHub Pages** (gh-pages) 배포
- **GitHub Actions** — 주간 데이터 자동 수집 + 자동 배포 파이프라인

---

## 프로젝트 구조

```
src/
├── App.js                  # 라우팅 설정 (/scarcity 포함)
├── index.js                # 엔트리 포인트
├── components/
│   ├── Header.js           # 네비게이션 + 한/영 전환 + 다크모드 토글 + 검색 초기화 (희소가치 메뉴 포함)
│   ├── SetCard.js          # 세트 카드
│   ├── PriceHistoryChart.js # 일별 가격 추이 SVG 라인 차트
│   ├── Pagination.js       # 페이지네이션
│   ├── TranslatedName.js   # map 루프 내 번역 훅 래퍼 컴포넌트
│   └── Loading.js          # 로딩/에러/빈 상태 컴포넌트
├── contexts/
│   ├── LanguageContext.js  # 언어 상태 관리 (Context API)
│   └── ThemeContext.js     # 다크/라이트 테마 상태 관리 + localStorage 영속화
├── data/
│   ├── prices.json         # 한국 레고 가격 데이터베이스 (자동 갱신)
│   ├── priceHistoryIndex.json # 일별 가격 스냅샷 시계열 인덱스
│   ├── prices-history/     # 일별 가격 스냅샷 원본 (YYYY-MM-DD.json)
│   ├── themeReturns.js     # 테마별 다중 기간(3/5/10/20/30년) 평균 수익률 + 분류 헬퍼
│   ├── bdpImages.json      # BDP 갤러리 이미지 ID 사전 수집
│   └── legoImages.json     # 일반(비 BDP) 세트 갤러리 이미지 ID (자동 갱신)
├── pages/
│   ├── SearchPage.js       # 세트 검색 (테마별 그룹화 + 무한스크롤 + 한국어 자연어 + SET_NUM_MAP + IP 우산 키워드 분기 + 다축 필터 + URL 동기화)
│   ├── ScarcityPage.js     # 희소 가치 점수 분석 (이름/번호 검색 → 결과 목록 → 클릭 분석 + 3/5/10/20/30년 기간 선택 + 동적 차트 스케일링 + Recharts 차트 + 게이지 바)
│   ├── PartsSearchPage.js  # 부품 검색 (카테고리별 그룹화 + 무한스크롤 + 한국어 번역)
│   ├── PartDetailPage.js   # 부품 상세 (색상, 엘리먼트, 세트)
│   ├── BrowsePage.js       # 테마/연도 브라우징 (무한스크롤)
│   ├── SetDetailPage.js    # 세트 상세 (이미지 갤러리 + 가격 추이 차트 + 부품 + 미니피규어 + 한국어 번역)
│   ├── FundingPage.js      # BDP 펀딩제품 (시리즈탭 + 연도필터 + 이름검색)
│   ├── MocsPage.js         # MOC 검색 (정렬 탭 + 테마 필터 + 이름 검색 + 무한스크롤)
│   └── CollectionPage.js   # 내 컬렉션/위시리스트
├── styles/
│   ├── App.css             # 전체 스타일 (반응형 포함)
│   ├── theme-dark.css      # 다크 모드 CSS 변수 토큰 + [data-theme="dark"] 오버라이드
│   └── price.css           # 가격 표시 스타일
└── utils/
    ├── api.js              # Rebrickable API 래퍼 (세트 + 부품)
    ├── mocApi.js           # Rebrickable MOC HTML 스크레이퍼 (CORS 프록시 체인)
    ├── searchDict.js       # 한국어→영어 검색 키워드 사전 + SET_NUM_MAP + IP_SEARCH_MAP
    ├── scarcityScore.js    # 희소 가치 점수 계산 알고리즘 (수익률+테마델타+독점보너스 → sigmoid)
    ├── priceHistory.js     # priceHistoryIndex.json 조회/통계 헬퍼
    ├── translate.js        # 테마명 하드코딩 번역 + MyMemory API 폴백
    ├── price.js            # 가격 유틸리티 (KRW 포맷팅, 환율, 검색)
    ├── i18n.js             # 한/영 UI 번역 리소스
    └── collection.js       # localStorage 컬렉션 관리

scripts/
├── fetch-prices.js         # 빌드 타임 lego.com/ko-kr JSON-LD 가격 수집 + 일별 스냅샷 누적
└── fetch-images.js         # 빌드 타임 rebrickable.com 세트 페이지 갤러리 이미지 ID 수집

.github/workflows/
└── auto-update-images.yml  # 주간 자동 데이터 갱신 + 자동 배포 워크플로우
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

빌드 시간에 한국 레고 가격을 수동 갱신하려면:

```bash
# 특정 세트들의 가격 가져오기
npm run fetch-prices 10294 42151 75192

# 모든 등록된 세트 가격 새로고침
npm run fetch-prices --refresh
```

생성된 `src/data/prices.json`은 빌드 타임에 자동으로 번들에 포함됩니다. 동시에 그 날짜의 스냅샷이 `src/data/prices-history/YYYY-MM-DD.json` 으로 저장되고 `src/data/priceHistoryIndex.json` 에 시계열로 누적됩니다 (연속 중복 가격은 압축).

---

## 갤러리 이미지 수집

일반(비 BDP) 제품의 갤러리 이미지를 Rebrickable에서 미리 수집하여 제품 상세 페이지에서 멀티 이미지 갤러리로 표시할 수 있습니다.

```bash
# 특정 세트들의 갤러리 이미지 ID 가져오기
npm run fetch-images 10294-1 42151-1 75192-1

# 등록된 가격 목록(prices.json)의 모든 세트에 대해 한번에 수집
npm run fetch-images -- --from-prices

# 이미 legoImages.json에 있는 항목 새로고침
npm run fetch-images -- --refresh
```

생성된 `src/data/legoImages.json`은 빌드 타임에 번들에 포함되며, `SetDetailPage`는 다음 순서로 이미지를 로드합니다:

1. BDP 세트 → `bdpImages.json`
2. 일반 세트 → `legoImages.json` (여러 장이면 썸네일 스트립 표시)
3. 폴백 → Rebrickable `set_img_url` 단일 이미지

---

## 자동 업데이트 (GitHub Actions)

수동으로 스크립트를 실행하지 않아도 되도록 **주간 자동 업데이트 워크플로우**가 구성되어 있습니다.

**워크플로우 파일**: `.github/workflows/auto-update-images.yml`

**동작 방식**:

1. **매주 일요일 03:00 UTC (12:00 KST)** 에 자동 실행 (cron)
2. 필요 시 **수동 실행**도 가능 (Actions 탭 → "Auto-update LEGO images & prices" → "Run workflow")
3. `npm run fetch-prices -- --refresh` 로 `prices.json` 재수집 (lego.com/ko-kr)
4. `npm run fetch-images -- --from-prices` 로 `legoImages.json` 재수집 (rebrickable.com)
5. 변경사항이 있으면 `main` 에 `chore(data): weekly auto-refresh ...` 커밋 자동 푸시
6. `npm run build` 후 `peaceiris/actions-gh-pages` 로 `gh-pages` 브랜치에 자동 배포

**최초 설정 방법** (이 워크플로우 파일은 GitHub API에서 `workflow` 스코프가 필요하므로 직접 커밋이 필요합니다):

```bash
# 1. auto-update-images.yml 을 .github/workflows/ 아래에 배치
mkdir -p .github/workflows
cp /path/to/auto-update-images.yml .github/workflows/

# 2. 커밋 & 푸시
git add .github/workflows/auto-update-images.yml
git commit -m "ci: add weekly auto-update workflow"
git push origin main

# 3. GitHub 저장소 설정 확인
#    Settings → Actions → General → Workflow permissions
#    "Read and write permissions" 체크 (커밋/푸시를 허용)
#    Settings → Pages → Build and deployment → Source: "Deploy from a branch" (gh-pages)
```

**수동 실행 방법**: GitHub 저장소 → Actions 탭 → "Auto-update LEGO images & prices" → "Run workflow" 버튼

---

## 변경 이력 (Changelog)

> 이 Changelog는 코드가 수정될 때마다 자동으로 업데이트됩니다. 새로운 변경사항이 push 될 때마다 이 섹션 상단에 새 버전 항목이 추가됩니다.

### v0.5.13 — 2026-04-07

#### `FIX` fix(mocs): 첫 진입 시 4건만 노출되는 문제 수정 (기본 정렬을 newest 로 변경)
- **문제 보고**: 사용자가 헤더 → MOC 검색 탭에 처음 진입했을 때 결과 목록에 4개 MOC 만 표시되고, 그 이후로 무한스크롤도 동작하지 않는 문제. \"정상적으로 검색 기능이 되는지 확인해서 문제 해결해줘\".
- **원인 분석**: `MocsPage.js` 의 초기 정렬 상태가 빈 문자열(`''`) 이었고, 이 값은 `mocApi.searchMocs()` 에서 `https://rebrickable.com/mocs/?get_drill_downs=1` URL 로 fan-out 됨. 이 URL 은 Rebrickable 의 일반 페이지네이션 listing 이 아니라 \"Featured / Trending\" 랜딩 페이지로 리다이렉트되어 `set-tn` 카드를 4~5개만 보여주는 큐레이션 뷰임. 결과적으로 `parseMocCards()` 가 4건만 반환 → `setHasMore(data.results.length >= 30)` 도 false → 무한스크롤 정지.
- **`src/pages/MocsPage.js` 수정**:
  - **`DEFAULT_SORT = '-published'` 상수 신설** — 컴포넌트 최상단 주석으로 \"빈 sort 는 featured 페이지로 가버려 4건만 반환되므로 newest 로 강제\" 라고 의도 명시.
  - **초기 `sort` state 기본값** — `useState('')` → `useState(DEFAULT_SORT)` 로 변경. 첫 진입 시 \"최신순\" 탭이 자동으로 활성화되어 보임.
  - **`stateRef.current` 초기값** — `{ sort: '' }` → `{ sort: DEFAULT_SORT }`.
  - **초기 `useEffect`** — `doFetch({ page: 1 }, false)` → `doFetch({ sort: DEFAULT_SORT, page: 1 }, false)`. 첫 fetch 가 무조건 `https://rebrickable.com/mocs/?sort=-published&page=1&get_drill_downs=1` 을 호출하도록 보장.
  - **`SORT_OPTIONS` 배열 순서 재배치** — `newest` 를 첫 번째 위치로, `hottest` 를 두 번째로 이동. 사용자가 정렬 탭을 봤을 때도 첫 탭이 활성화되어 있는 시각적 피드백이 일관됨.
  - **`hasMore` 임계값 조정** — `data.results.length >= 30` → `data.results.length >= 25`. Rebrickable 페이지당 ~30 카드를 반환하지만 일부 listing 은 28~29 건을 반환하기도 하며, 4 건짜리 featured 페이지는 절대 여기에 도달하지 못해 잘못된 무한스크롤 트리거를 방지.
  - **주석 보강** — \"hasMore: rebrickable serves ~30 cards per listing page; if we got fewer than 25 we treat that as the last page\".
- **검증 시나리오**:
  1. 헤더 → \"MOC 검색\" 첫 진입 → 첫 화면에 ~30 개 카드 그리드 표시 (\"최신순\" 탭 활성화)
  2. 스크롤 끝까지 내리면 page=2 자동 호출되어 누적 60 개 표시
  3. \"인기순\" 탭 클릭 시에만 빈 sort 가 호출되며, 이때는 사용자가 명시적으로 선택한 결과이므로 4 건이 나와도 의도된 동작
  4. 검색어 입력 / 테마 필터 변경 시에는 항상 listing 페이지가 호출되므로 영향 없음
- **참고**: `mocsStatic.json` (사전 스크레이핑 정적 스냅샷) 의 4 개 뷰는 모두 `results: []` 로 비어있는 상태라 `getStaticView()` 가 `null` 을 반환하므로 사실상 모든 호출이 런타임 fetch 경로로 흐름. 추후 GitHub Actions 가 매일 `scripts/fetch-mocs.js` 를 실행해 `mocsStatic.json` 을 채우게 되면 캐시 히트율이 올라가고 첫 페인트도 더 빨라질 예정.

### v0.5.12 — 2026-04-07

#### `NEW` feat(scarcity): 희소가치 차트가 선택한 기간(3/5/10/20/30년) 기준으로 동적 스케일링 + 차트 하단 안내 문구 동적화
- **요구사항**: \"희소가치에 나오는 그래프도 선택한 년도별로 보여주고, 그래프 아래에 36개월이란 문구도 선택한 년도 기반으로 데이터와 문구를 보여주도록 수정해줘\".
- **`src/pages/ScarcityPage.js` 수정**:
  - **`recomputeForPeriod(raw, period)` 함수 재작성**:
    - 기존: 항상 `36` 개월의 과거 시뮬레이션 곡선을 생성 (매월 1 포인트 = 37 포인트).
    - 신규: 선택된 `period` 값을 기준으로 `var months = period * 12;` 로 총 개월 수를 계산하고, `var stepMonths = Math.max(1, Math.round(months / 36));` 로 다운샘플링 간격을 결정해 차트 포인트가 항상 ~36개 가량 유지되도록 설계 (긴 기간 선택 시 X축이 너무 빽빽해지지 않도록).
    - 5년 → step 2개월, 10년 → step 3개월, 20년 → step 7개월, 30년 → step 10개월 등.
    - 각 포인트의 X축 라벨도 동적 — `stepMonths >= 12` 이면 `'-Ny'` (연 단위), 그 외엔 기존처럼 `'-Mm'` (월 단위) 로 표시. 마지막 포인트는 항상 `'now'`.
    - 다운샘플링 후 마지막 포인트가 정확히 `now` 가 아닐 가능성을 대비해 `if (pastSeries[length-1].label !== 'now')` 가드로 강제 추가.
    - market 값(현재 시세)은 마지막 포인트에만 dot 으로 찍히도록 `i === months ? Math.round(raw.market.value) : null` 로 설정.
  - **`recomputeForPeriod()` 결과 객체 확장**: `period: period, periodMonths: months,` 두 필드 추가. UI 가 차트 안내 문구의 placeholder 치환에 사용함.
  - **차트 아래 안내 문구 동적 렌더링**:
    - 기존: 하드코딩된 \"36개월 간 ...\" 문구.
    - 신규: `t('scarcityChartPastNote').replace('{years}', result.period).replace('{months}', result.periodMonths)` 로 i18n placeholder 두 개를 런타임 치환. 끝에 기존처럼 `(n=N, Yy)` 샘플 정보 부착.
- **`src/utils/i18n.js` 수정**:
  - 한국어: `scarcityChartPastNote: '{years}년 ({months}개월) 간 테마 평균 수익률을 적용한 시뮬레이션 곡선입니다.'`
  - 영어: `scarcityChartPastNote: 'Simulated curve over {years} years ({months} months) using theme average return.'`
  - 두 placeholder (`{years}`, `{months}`) 가 런타임에 안전하게 치환되어 어떤 기간을 선택해도 자연스럽게 읽힘 (3년/36개월, 5년/60개월, 10년/120개월, 20년/240개월, 30년/360개월).
- **사용자 동작**: 희소가치 페이지에서 임의 세트 분석 후 기간 알약 (3년/5년/10년/20년/30년) 을 클릭하면 차트의 X축 범위와 데이터 포인트, 그리고 차트 하단 안내 문구의 \"X년 (Y개월)\" 부분이 모두 즉시 갱신됨. **네트워크 호출 0회** (캐시된 raw 입력으로 로컬에서 순수 재계산).
- **호환성**: 기존 \"36개월\" 만 지원하던 i18n 키를 placeholder 기반으로 전환했지만 모든 호출 지점이 동일 함수로 통일되어 있어 사이드 이펙트 없음. 다른 페이지 영향 0.

### v0.5.11 — 2026-04-07

#### `FIX` fix(scarcity): 다크 모드에서 희소가치 탭 텍스트/차트 가독성 개선
- **문제**: 다크 모드에서 희소가치 탭의 차트 영역 문구(축 눈금, 툴팁, 범례, 참조선 라벨)와 일부 배너의 텍스트 색이 어두워서 잘 안 보이는 문제. v0.5.10 에서 인라인 스타일을 CSS 변수로 전환했지만 Recharts SVG 요소는 CSS 변수를 읽지 않아 하드코딩된 옅은 회색 (`#888`) 과 흰색 기본 툴팁이 다크 배경 위에서 거의 보이지 않음.
- **`src/pages/ScarcityPage.js` 수정**:
  - **차트 토큰 헬퍼 변수 추가** — 컴포넌트 상단에 `chartGridStroke = 'rgba(128,128,128,0.3)'`, `chartAxisFill = '#9aa3b2'`, `chartTooltipContentStyle` (어두운 반투명 배경 + 옅은 보더 + 밝은 텍스트), `chartTooltipLabelStyle`, `chartTooltipItemStyle` 정의 → 두 차트 모두 동일한 토큰 사용으로 일관성 보장.
  - **CartesianGrid** — `stroke="#eee"` (라이트에서만 보임) → `stroke={chartGridStroke}` (rgba 중간값으로 라이트/다크 모두에서 자연스럽게 보임). 두 차트 모두.
  - **XAxis / YAxis** — `tick.fill="#888"` → `tick.fill={chartAxisFill}` (`#9aa3b2`), 추가로 `stroke={chartAxisFill}` 명시해 축선 자체의 가시성도 확보. 두 차트 모두.
  - **Tooltip** — `contentStyle / labelStyle / itemStyle / cursor` 명시. `contentStyle` 은 `rgba(20,22,28,0.92)` 어두운 반투명 배경 + `#f0f2f6` 텍스트로 라이트/다크 모두에서 가독성 보장. 두 차트 모두.
  - **Legend** — `wrapperStyle.color={chartAxisFill}` 로 범례 텍스트도 밝은 회색.
  - **ReferenceLine** (예상 차트) — `stroke="#888"` 와 `label.fill="#888"` → 모두 `chartAxisFill` 로 통일.
  - **테마 평균 라인 색상** — `#0066cc` (어두운 파랑) → `#4a9eff` (밝은 파랑) — 다크 배경에서 더 잘 보임. 예상 라인 `#0a8a4e` → `#3ec47a`.
  - **MSRP 통계 카드** — `result.msrp.official` 시 `#0a8a4e` → `#3ec47a`, 비공식 `#c97a00` → `#ffb84d`. 수익률 색상도 `#0a8a4e/#d33` → `#3ec47a/#ff6b6b` 로 다크에서 잘 읽히는 톤으로 조정.
  - **경고 배너 (`msrpWarnEl`, `extrapolatedEl`)** — 하드코딩 `background:'#fff8e1'`, `border:'#ffd88a'`, `color:'#7a5200'` → 모두 `var(--color-info-bg)`, `var(--color-info-border)`, `var(--color-info-text)` 로 전환. `theme-dark.css` 에 이미 정의된 `--color-info-*` (다크 배경: `#2a2418`, 텍스트: `#e0c895`) 토큰이 자동 적용되어 다크 모드에서도 자연스러운 골드 톤으로 표시.
  - **링크/버튼 색상** — `#0066cc` (검색 결과 화살표, 정가 확인 링크, 뒤로가기 버튼 보더, 상세 페이지 링크) → `#4a9eff` 로 통일. 다크 배경에서 충분한 명도 확보.
  - **에러 배너** — `background:'#fff6f6'`, `color:'#b00020'` → `rgba(220,80,80,0.12)` + `#ff8a8a` 로 전환해 라이트/다크 모두에서 가독성 확보.
- **검증**: 헤더에서 다크 모드 토글 → `/scarcity` 로 이동 → 임의 세트 분석 → 과거/예상 차트의 축 눈금, 격자선, 툴팁, 범례, 참조선 라벨이 모두 명확히 읽히고, MSRP/수익률 카드의 작은 보조 텍스트와 노란 경고 배너도 어둡지 않은 적절한 톤으로 표시됨을 확인.

### v0.5.10 — 2026-04-07

#### `NEW` feat(scarcity): 수익률 기간 선택기 (3/5/10/20/30년) + localStorage 영속화 + 로컬 재계산
- **요구사항**: 희소가치 기능에서 수익률 데이터를 3년/5년/10년/20년/30년 단위로 사용자가 선택하여 볼 수 있도록 기능 제공.
- **`src/data/themeReturns.js`** (이전 푸시):
  - 기존 단일 `themeAvgReturnPct` 상수 → `periods: { 3, 5, 10, 20, 30 }` 다중 기간 스키마로 확장. 각 기간은 `{ avgReturnPct, sample, since, extrapolated }` 구조.
  - `SUPPORTED_PERIODS = [3, 5, 10, 20, 30]` export.
  - `getThemeReturn(themeKey, years)` — 요청 기간이 해당 테마의 최대 사용 가능 기간보다 길면 가장 가까운 가능 기간으로 폴백하고 `extrapolated: true` 플래그 반환 (예: BDP 는 2023년부터 시작이라 30년 요청 시 자동으로 3년 데이터 + extrapolated=true).
- **`src/utils/i18n.js`**:
  - 신규 키 (ko/en 양쪽): `scarcityPeriodLabel` ("기간"/"Period"), `scarcityPeriod3y` ~ `scarcityPeriod30y` ("3년"/"3y" 등), `scarcityExtrapolatedNote` (extrapolated 경고 메시지).
  - 기존 `scarcityThemeAvg` 를 "테마 3년 평균" → "테마 평균" 으로 일반화. `scarcityPageDesc` 에서 "3-year" 표현 제거.
- **`src/pages/ScarcityPage.js`**:
  - **`PERIOD_STORAGE_KEY = 'lego_scarcity_period'`** — localStorage 키 정의.
  - **`getInitialPeriod()`** — 마운트 시 localStorage 에서 마지막 선택을 읽고, `SUPPORTED_PERIODS` 에 포함되어 있으면 사용, 아니면 3년 기본값.
  - **`recomputeForPeriod(raw, period)` 순수 함수** — 캐시된 raw 입력(setNum, name, year, numParts, imgUrl, themeKey, msrp, market, hasExclusiveMinifigs)으로부터 `themeInfo`, `score`, `pastSeries` (36개월), `projSeries` (12개월) 을 새로 계산. 네트워크 재호출 없이 로컬에서 즉시 갱신.
  - **`selectedPeriod` state (s9 hook)** — 컴포넌트 상태로 현재 선택 기간 보유.
  - **`analyze(setNumRaw, periodArg)` 시그니처 확장** — periodArg 우선, 없으면 selectedPeriod 사용. 분석 후 `result.raw` 에 raw 입력을 캐시.
  - **`onChangePeriod(newPeriod)` 핸들러** — SUPPORTED_PERIODS 검증 → state 업데이트 → localStorage 저장 → result 가 있으면 `recomputeForPeriod(result.raw, newPeriod)` 로 즉시 재계산. **네트워크 호출 0회**.
  - **기간 선택기 UI (pill 그룹)** — 검색 폼 아래에 5개 알약 버튼(3년/5년/10년/20년/30년) 가로 배치. 활성 기간은 파란색 배경 + 흰색 텍스트, 비활성은 흰색 배경 + 어두운 텍스트. `aria-pressed` 속성으로 접근성 보장.
  - **`extrapolatedEl` 배너** — `result.themeInfo.extrapolated === true` 인 경우 (BDP 30년 요청 등) 노란색 경고 배너 표시 — "선택한 기간이 테마의 실제 기간보다 길어 가장 가까운 사용 가능한 기간 데이터로 표시됩니다" 메시지.
  - **stats 라벨 갱신** — 테마 평균 표시에 `(Xy)` 접미사 추가하여 현재 선택된 기간을 명시 (예: "테마 평균 (5y): 12.5%").
  - **인라인 스타일 → CSS 변수 마이그레이션** — 다크 모드 v0.5.9 와 호환되도록 `color: 'var(--color-text, #222)'`, `background: 'var(--color-surface, #fff)'`, `border: '1px solid var(--color-border, #ccc)'` 등으로 전면 교체. 라이트 모드 폴백 색상은 fallback 으로 그대로 유지.
- **사용자 동작**: 분석 후 다른 기간 알약을 누르면 즉시 점수/수익률/차트가 변경되고 페이지 새로고침해도 마지막 선택이 유지됨.

### v0.5.9 — 2026-04-07

#### `NEW` feat: 다크 모드 (CSS 변수 기반 테마 토큰)
- **요구사항**: LEGO 사이트 특성상 컬러풀한 카드가 많아서 다크 모드와 잘 어울림. CSS 변수 기반으로 테마 토큰을 빼두면 큰 리팩토링 없이 추가 가능.
- **`src/styles/theme-dark.css` 신규 추가**:
  - **`:root` (라이트 기본값)** — `--color-bg`, `--color-surface`, `--color-surface-soft`, `--color-surface-elevated`, `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-overlay`, `--color-shadow`, `--color-accent-soft`, `--color-info-bg`, `--color-info-border`, `--color-info-text` 등 14개 의미 토큰 정의.
  - **`[data-theme="dark"]` 오버라이드** — 모든 토큰을 다크 팔레트로 재정의 (`#0f1115` 배경, `#1a1d23` 카드, `#e6e6e6` 본문, `#b0b6c0` 보조 텍스트, `#353a45` 보더 등). LEGO 디자인 토큰(`--lego-gray`, `--lego-border`, `--lego-dark`)도 다크 톤으로 오버라이드.
  - **컴포넌트별 셀렉터 오버라이드** — `[data-theme="dark"]` 접두사로 `.search-section`, `.set-card`, `.part-result-card`, `.set-detail`, `.collection-stats`, `.error-message`, 입력/셀렉트/필터, 페이지네이션, 탭, 이미지 surface, 인스트럭션 카드, 부품 색상 선택기, BDP 펀딩 알림, 신제품 출처 알림, 모바일 헤더 네비, 헤더 내 다크모드 토글 버튼 등 40+ 컴포넌트의 배경/텍스트/보더를 다크 톤으로 일괄 전환. 라이트 모드는 원본 `App.css` 그대로 유지되어 회귀 0.
- **`src/contexts/ThemeContext.js` 신규**:
  - React Context API + `useState` 로 `theme` 상태 관리 (`'light'` | `'dark'`).
  - 마운트 시 localStorage 에서 `lego_theme_preference` 읽어 초기값 설정. 키가 없으면 `prefers-color-scheme: dark` 미디어 쿼리로 OS 기본값 추론.
  - `useEffect` 로 `theme` 변경 시 `document.documentElement.setAttribute('data-theme', theme)` 와 localStorage 저장.
  - `useTheme()` 훅 export.
- **`src/components/Header.js`** — 헤더 네비 우측에 ☀/🌙 토글 버튼 추가. `useTheme()` 호출로 현재 테마와 setter 획득. 토글 클릭 시 `'light' ↔ 'dark'` 즉시 전환.
- **`src/utils/i18n.js`** — `themeToLight` ("라이트 모드로 전환"/"Switch to light mode"), `themeToDark` ("다크 모드로 전환"/"Switch to dark mode") 키 추가.
- **`src/index.js`** — `<ThemeProvider>` 로 `<App/>` 래핑. CSS import 순서: `App.css` → `theme-dark.css` 로 다크 오버라이드가 우선 적용되도록 보장.
- **결과**: 모든 페이지(검색/희소가치/부품/둘러보기/펀딩/컬렉션)가 즉시 다크 모드 지원. 카드 surface, 텍스트, 보더, 입력 폼, 페이지네이션, 탭이 일관되게 어두운 톤으로 전환되고 LEGO 의 상징인 빨강/노랑/파랑 액센트는 그대로 유지됨.

### v0.5.8 — 2026-04-07

#### `FIX` fix: 76419 (Hogwarts Castle and Grounds) 한국 정가 보정
- **문제**: 사용자가 희소가치 점수 분석에서 76419 (Hogwarts Castle and Grounds) 의 한국 정가가 ₩229,900 인데 화면에는 ₩412,300 (추정값) 으로 표시되어 잘못된 점수가 계산되는 문제 보고. 다른 제품들도 가격이 부정확할 가능성 지적.
- **원인**: `prices.json` 에 76419 항목이 누락되어 있어 `lookupMsrp()` 가 부품 수(2,660) × 155 KRW 휴리스틱 폴백으로 약 ₩412,300 을 추정.
- **`src/data/prices.json` 수정**:
  - 76419 항목 신규 추가: `{ "price": 229900, "name": "Hogwarts Castle and Grounds", "currency": "KRW", "source": "lego.com/ko-kr" }`. LEGO 공식 한국 사이트 정가 기준.
  - `meta.lastUpdated` 갱신.
- **검증**: 희소가치 페이지에서 76419 분석 시 MSRP 카드가 `✓ LEGO Korea 정가 (prices.json)` 초록색 라벨과 함께 ₩229,900 으로 표시되며, 노란 추정값 경고 배너는 사라짐. 점수/등급도 실제 정가 기준으로 재계산.
- **참고**: 같은 방식으로 추정값 경고가 뜨는 다른 세트는 `prices.json` 에 한 줄 추가만으로 즉시 수정 가능. 사용자가 다른 세트의 정가도 알려주면 일괄 추가 예정.

### v0.5.7 — 2026-04-07

#### `FIX` fix: "바라쿠다" 검색 시 21322 (Pirates of Barracuda Bay) 미검출 수정 (검색탭 + 희소가치탭)
- **문제**: 사용자가 검색탭이나 희소가치탭에서 "바라쿠다" 를 입력해도 21322 (Pirates of Barracuda Bay) 가 결과에 나오지 않음. 원인은 `searchDict.js` 의 `SET_NUM_MAP` / `WORD_MAP` / `PHRASE_MAP` / `IP_SEARCH_MAP` 어디에도 "바라쿠다" 키가 없어서 한국어 → 영어 변환이 일어나지 않고 raw `?search=바라쿠다` 가 그대로 Rebrickable 에 전달되어 0건이 반환되기 때문.
- **`src/utils/searchDict.js` 수정**: `SET_NUM_MAP` / `WORD_MAP` / `PHRASE_MAP` / `IP_SEARCH_MAP` 에 "바라쿠다", "바라쿠다 베이", "바라쿠다베이의 해적", "Barracuda Bay", "Pirates of Barracuda Bay" 등 다양한 변형을 추가하고 21322 로 직접 매핑.
- **검증**: 검색탭/희소가치탭에서 "바라쿠다" 입력 시 21322 가 결과 목록 최상단에 표시됨.

### v0.5.6 — 2026-04-07

#### `NEW` feat: 희소가치 페이지 한글/영문 제품명 검색 → 결과 목록 → 클릭 분석 워크플로우
- 입력값이 순수 숫자면 즉시 분석, 한글/영문이면 검색 결과 목록 노출 후 클릭 시 분석.
- `runNameSearch()` 에서 `translateSearchQuery` + `getIpSearchTerms` fan-out → 최대 5개 키워드 병렬 호출 → set_num dedupe + 출시연도 정렬.
- `?q=<keyword>` 쿼리 파라미터로 외부 딥링크 지원.

#### `FIX` fix: 희소가치 점수 분석의 MSRP 정확도 개선 (Arkham Asylum 등 추정값 → 정가)
- `lookupMsrp()` 가 SearchPage 와 동일한 `getKrwPrice()` 를 사용하도록 통합. MSRP 객체에 `official` / `estimated` 플래그 추가.
- 추정값일 때 노란색 경고 배너 + LEGO Korea 공식 사이트 링크 노출.

### v0.5.5 — 2026-04-07

#### `NEW` feat: 한국어 캐릭터/장소 별명 사전 대규모 확장 (아캄 → Arkham 등)
- `WORD_MAP` 에 DC/Marvel/Star Wars/Harry Potter/Disney/Pixar/LOTR/City/Castle/Botanical/Misc 카테고리 80+ 키워드 추가.
- `PHRASE_MAP` 에 다어절 표현 30+ 추가.
- `IP_SEARCH_MAP` 에 `'배트맨' / 'dc' / '엑스맨'` 등 우산 키워드 fan-out 강화.

### v0.5.4 — 2026-04-07

#### `FIX` ci: GitHub Actions npm cache lock file 누락 에러 수정 준비
- 워크플로우가 lock 파일 부재로 실패하는 문제. 해결안 ① package-lock.json 커밋 (outputs/ 에 자동 생성됨) 또는 ② setup-node 의 `cache: 'npm'` 제거.

### v0.5.3 — 2026-04-07

#### `NEW` feat: 세트 검색 다축 필터 + URL 쿼리스트링 동기화
- 부품 수 / 출시 연도 / KRW 가격 범위, 단종 / 보유 / 위시리스트 모드 다축 필터 + URL 양방향 바인딩.
- 공유 버튼 (clipboard 복사), 활성 필터 카운트 뱃지, 빈 결과 메시지.

### v0.5.2 — 2026-04-07

#### `FIX` fix: IP 프랜차이즈 우산 키워드 검색 결과 0건 문제 해결
- `IP_SEARCH_MAP` 추가 — 우산 키워드를 실제 세트 이름 키워드 배열로 매핑 후 fan-out 검색 + dedupe.

#### `DOCS` docs: README 변경 이력 자동 누적 정책 명시

### v0.5.1 — 2026-04-07

#### `NEW` feat: 희소 가치 점수 (Scarcity Score) 분석 페이지
- `/scarcity` 라우트 + 헤더 메뉴 + 13개 테마 평균 수익률 + 점수 알고리즘 + Recharts 차트 + 게이지 바.
- 쿼리 파라미터 `?setNum=` 딥링크 지원.

> ⚠️ **사용자 작업 필요**: 로컬에서 `npm install` 실행 후 `package-lock.json` 커밋 필요.

### v0.5.0 — 2026-04-07

#### `NEW` feat: 일별 가격 스냅샷 + 제품별 가격 변동 차트
- `priceHistoryIndex.json`, `prices-history/YYYY-MM-DD.json`, `priceHistory.js`, `PriceHistoryChart.js` (Pure SVG).
- 해리포터 12개 세트 가격 추가, `fetch-prices.js` 에 `--snapshot-only` 모드 + 시계열 압축.

> ⚠️ **사용자 작업 필요**: `auto-update-images.yml` 의 `git add` 라인에 `priceHistoryIndex.json` / `prices-history/` 추가 필요.

### v0.4.2 — 2026-04-07

#### `NEW` ci: 주간 자동 업데이트 GitHub Actions 워크플로우
- 매주 일요일 03:00 UTC cron + `workflow_dispatch` 수동 트리거 + gh-pages 자동 재배포.

### v0.4.1 — 2026-04-07

#### `NEW` feat: 일반(비 BDP) 제품 멀티 이미지 갤러리
- `fetch-images.js` + `legoImages.json` + `SetDetailPage.js` 폴백 체인.

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
