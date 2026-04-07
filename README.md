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
- **한국어 자연어 검색** — "모듈러", "스타워즈", "경찰서", "용마성", "블랙펄", "탐정사무소" 등 한국어 키워드/별명으로 검색 가능 (500+ 키워드 매핑)
- **IP 프랜차이즈 우산 키워드 검색** — "마블", "어벤져스", "디씨", "스타워즈", "해리포터", "디즈니", "쥬라기월드" 등을 입력하면 Spider-Man / Iron Man / Hulk / Avengers 등 실제 세트명 키워드로 자동 분기 검색하여 결과 병합
- **세트 검색 다축 필터 + URL 공유** — 부품 수 / 출시 연도 / 가격(KRW) 범위, 단종 여부, 보유·위시리스트 상태로 검색 결과를 다중 필터링하고 URL 쿼리스트링과 동기화하여 공유 가능
- **희소 가치 점수 (Scarcity Score)** — 헤더 메뉴 → "희소가치"에서 제품 번호 입력 시 MSRP·현재 시세·테마 3년 평균 수익률·독점 구성 여부를 종합해 0~100점/S~D 등급을 계산하고 Recharts로 과거/예상 가격 곡선 시각화
- **일별 가격 스냅샷 + 변동 차트** — 매일 수집된 KRW 가격을 `priceHistoryIndex.json` 에 누적하고 제품 상세 페이지에서 SVG 라인 차트로 표시
- **한국어 별명 → 제품번호 직접 매핑** — "용마성"→6082, "블랙펄"→10365, "박쥐성"→6097, "탐정사무소"→10246 등 즉시 검색
- **모듈러 빌딩 전체 키워드** — 카페코너, 그린그로서, 소방대, 펫샵, 타운홀, 팰리스시네마, 탐정사무소, 브릭뱅크, 다운타운다이너, 서점, 재즈클럽, 자연사박물관 등
- **검색 결과 테마별 그룹화** — 검색 결과를 테마별로 분리하여 표시 (테마명 한국어 번역 지원)
- **테마명 한국어 정확 표시** — 반지의제왕, 해리포터, 캐슬 등 100+ 테마명 하드코딩 번역 (인코딩 깨짐 방지)
- **부품 검색** — 부품 이름/번호로 검색, 카테고리 필터, 카테고리별 그룹화, 색상 정보 확인
- **부품 카테고리 한국어 번역** — 한국어 선택 시 부품 카테고리명 자동 번역
- **신제품 탭** — 최신 레고 신제품 연도별 조회
- **펀딩제품(BDP) 탭** — BrickLink Designer Program 제품 시리즈별 조회, 연도 필터, 이름 검색
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
│   ├── Header.js           # 네비게이션 + 한/영 전환 + 검색 초기화 (희소가치 메뉴 포함)
│   ├── SetCard.js          # 세트 카드
│   ├── PriceHistoryChart.js # 일별 가격 추이 SVG 라인 차트
│   ├── Pagination.js       # 페이지네이션
│   ├── TranslatedName.js   # map 루프 내 번역 훅 래퍼 컴포넌트
│   └── Loading.js          # 로딩/에러/빈 상태 컴포넌트
├── contexts/
│   └── LanguageContext.js  # 언어 상태 관리 (Context API)
├── data/
│   ├── prices.json         # 한국 레고 가격 데이터베이스 (자동 갱신)
│   ├── priceHistoryIndex.json # 일별 가격 스냅샷 시계열 인덱스
│   ├── prices-history/     # 일별 가격 스냅샷 원본 (YYYY-MM-DD.json)
│   ├── themeReturns.js     # 테마별 3년 평균 수익률 상수 + 분류 헬퍼
│   ├── bdpImages.json      # BDP 갤러리 이미지 ID 사전 수집
│   └── legoImages.json     # 일반(비 BDP) 세트 갤러리 이미지 ID (자동 갱신)
├── pages/
│   ├── SearchPage.js       # 세트 검색 (테마별 그룹화 + 무한스크롤 + 한국어 자연어 + SET_NUM_MAP + IP 우산 키워드 분기 + 다축 필터 + URL 동기화)
│   ├── ScarcityPage.js     # 희소 가치 점수 분석 (Recharts 차트 + 게이지 바)
│   ├── PartsSearchPage.js  # 부품 검색 (카테고리별 그룹화 + 무한스크롤 + 한국어 번역)
│   ├── PartDetailPage.js   # 부품 상세 (색상, 엘리먼트, 세트)
│   ├── BrowsePage.js       # 테마/연도 브라우징 (무한스크롤)
│   ├── SetDetailPage.js    # 세트 상세 (이미지 갤러리 + 가격 추이 차트 + 부품 + 미니피규어 + 한국어 번역)
│   ├── FundingPage.js      # BDP 펀딩제품 (시리즈탭 + 연도필터 + 이름검색)
│   └── CollectionPage.js   # 내 컬렉션/위시리스트
├── styles/
│   ├── App.css             # 전체 스타일 (반응형 포함)
│   └── price.css           # 가격 표시 스타일
└── utils/
    ├── api.js              # Rebrickable API 래퍼 (세트 + 부품)
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
git clone https://github.com/jbh-mine/scrap_blog/lego-finder.git
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

### v0.5.4 — 2026-04-07

#### `FIX` ci: GitHub Actions npm cache lock file 누락 에러 수정 준비
- **에러**: `actions/setup-node@v4` 의 `cache: 'npm'` 옵션은 `package-lock.json` / `npm-shrinkwrap.json` / `yarn.lock` 중 하나가 저장소에 존재해야 작동하는데, 본 저장소에 lock 파일이 커밋되어 있지 않아 워크플로우가 "Dependencies lock file is not found" 에러로 실패.
- **해결안 ①(권장)**: 로컬에서 `npm install --package-lock-only --legacy-peer-deps` 로 `package-lock.json` 을 생성한 뒤 커밋. 본 세션에서 자동 생성한 파일을 `outputs/package-lock.json` (672 KB) 으로 첨부함 — 이 파일을 저장소 루트로 옮기고 `git add package-lock.json && git commit -m "chore: add package-lock.json for CI cache"` 후 push 하면 됨.
- **해결안 ②(대체)**: PAT 에 `workflow` 스코프를 부여한 뒤 `.github/workflows/auto-update-images.yml` 의 setup-node 단계에서 `cache: 'npm'` 라인을 제거하고 `npm ci` → `npm install --legacy-peer-deps --no-audit --no-fund` 로 변경. (현재 PAT 스코프 부족으로 본 세션에서는 직접 push 불가 — 사용자가 GitHub UI 또는 로컬 git 으로 직접 수정 필요.)
- **변경 가이드 (워크플로우 파일 직접 수정 시)**:
  ```yaml
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      # cache: 'npm'   <-- 이 줄 제거 또는 주석 처리

  - name: Install dependencies
    run: npm install --legacy-peer-deps --no-audit --no-fund
  ```

> ⚠️ **사용자 작업 필요**: 위 두 해결안 중 하나를 선택해 직접 commit/push 해야 워크플로우가 정상화됩니다.

### v0.5.3 — 2026-04-07

#### `NEW` feat: 세트 검색 다축 필터 + URL 쿼리스트링 동기화
- **요구사항**: 기존 세트 검색은 정렬만 가능했음. MOC 검색 수준의 풍부한 다축 필터링과 결과 공유 기능 필요.
- **추가된 필터 (모두 클라이언트 사이드, `useMemo` 로 `filteredResults` 파생)**:
  - `partsMin` / `partsMax` — 부품 수 범위 (예: 1000~5000)
  - `yearMin` / `yearMax` — 출시 연도 범위 (예: 2018~2024)
  - `priceMin` / `priceMax` — KRW 가격 범위 (`prices.json` 데이터 사용)
  - `retiredMode` — `all` / `only`(단종만) / `exclude`(현역만)
  - `ownedMode` — `all` / `owned`(보유) / `not_owned`(미보유) / `wished`(위시리스트)
- **URL 쿼리스트링 동기화** — `react-router-dom` `useSearchParams` 로 모든 필터 + `q`(검색어) + `sort` 상태를 URL 에 양방향 바인딩. URL 파라미터: `q, sort, pmin, pmax, ymin, ymax, prmin, prmax, rt, ow`. 페이지 로드 시 URL 에 `?q=...` 가 있으면 자동으로 검색 실행.
- **공유 버튼** — 필터 패널의 "결과 URL 복사" 버튼이 `navigator.clipboard.writeText(window.location.href)` 로 현재 검색·필터·정렬 상태가 인코딩된 URL 을 클립보드에 복사 (2초간 "복사됨!" 토스트).
- **필터 패널 UI** — 토글 버튼(활성 필터 카운트 뱃지 포함)으로 접고 펴는 collapsible 패널. 인라인 스타일 + `React.createElement` 로 구성하여 별도 CSS 파일 추가 없음. 각 범위 필드는 `최소`/`최대` 숫자 입력 + 라디오 그룹.
- **빈 결과 메시지** — 필터 결과가 0건일 때 "필터 조건에 맞는 결과가 없습니다." 별도 안내. 현재 보유 컬렉션 / 위시리스트는 `getCollection()` / `getWishlist()` 로 lazy 로드해 `Set` 으로 캐싱하여 조회 성능 보장.
- **`src/utils/i18n.js`** — `filterToggleLabel`, `filterPartsRange`, `filterYearRange`, `filterPriceRange`, `filterRetired*`, `filterOwned*`, `filterMin/Max`, `filterShareUrl`, `filterShareCopied`, `filterFilteredPrefix/Suffix`, `filterEmptyMsg` 등 ko/en 20+ 키 추가.
- **`src/pages/SearchPage.js`** — `DEFAULT_FILTERS` / `readFiltersFromParams` / `filtersAreDefault` 헬퍼, 필터 상태→URL 양방향 동기화, `filteredResults` useMemo, 필터 패널 렌더링, 공유 버튼, 빈 상태 메시지.

### v0.5.2 — 2026-04-07

#### `FIX` fix: IP 프랜차이즈 우산 키워드 검색 결과 0건 문제 해결
- **문제**: "마블", "아이언맨", "헐크", "어벤져스", "디씨", "스타워즈" 등 우산 키워드 입력 시 검색 결과가 비어있던 문제. 원인은 Rebrickable `/sets/?search=Marvel` API 가 세트 이름만 검색하고 테마 이름은 검색하지 않기 때문이며, 실제 세트 이름에 "Marvel" 이라는 단어가 거의 없음.
- **해결**: `src/utils/searchDict.js` 에 `IP_SEARCH_MAP` 추가. 우산 키워드를 실제 세트 이름에 등장하는 캐릭터/서브 제품 키워드 배열로 매핑 (예: 마블 → ["Spider-Man","Iron Man","Avengers","Hulk","Captain America","Thor","Black Panther","Doctor Strange","Spidey","Guardians","Ant-Man"]).
- `getIpSearchTerms(query)` 헬퍼 export — 한국어 raw 쿼리와 영어 번역 쿼리 모두 매칭.
- `src/pages/SearchPage.js` `doSearch` 에 IP 분기 추가: 우산 키워드 매칭 시 모든 fan-out 키워드로 `searchSets` 를 병렬 호출하고 set_num 기준 dedupe 후 병합. 매칭되는 테마가 있으면 `filterSets({themeId})` 도 함께 호출하여 우선순위로 추가.
- 커버 키워드: Marvel, Avengers, Iron Man, Hulk, Spider-Man, Captain America, Thor, Black Widow, Black Panther, Doctor Strange, Guardians, Ant-Man, DC, Superman, Wonder Woman, Aquaman, Flash, Joker, Batman, Star Wars, Mandalorian, Harry Potter, Disney, Frozen, Jurassic World, Indiana Jones, Super Mario, Minions, Lord of the Rings, Speed Champions 등 30+ 우산 키워드.

#### `DOCS` docs: README 변경 이력 자동 누적 정책 명시
- 앞으로 모든 변경사항은 push 시점에 README Changelog 섹션에 자동 기재됨을 명시.

### v0.5.1 — 2026-04-07

#### `NEW` feat: 희소 가치 점수 (Scarcity Score) 분석 페이지
- **새 라우트** `/scarcity` 추가 — 헤더 네비게이션에 "희소가치" 메뉴 신설.
- `src/data/themeReturns.js` — 13개 주요 테마(Star Wars 12.5%, Modular 18.3%, Castle 15.0%, Creator Expert 14.2%, Icons 11.8%, Harry Potter 9.5%, Technic 6.2%, Architecture 8.7%, Ideas 16.4%, Marvel 7.1%, Disney 10.3%, BDP 13.5%, Other 5.0%)의 3년 평균 수익률 상수와 세트 번호/이름 기반 휴리스틱 분류기(`classifyTheme`).
- `src/utils/scarcityScore.js` — 점수 알고리즘:
  - `returnPct = (market - msrp) / msrp * 100`
  - `themeDelta = returnPct - themeAvgPct`
  - `exclusivityBonus = 20` (오래된 세트 / 2000 부품 이상 / BDP 일 때)
  - `raw = 0.55*returnPct + 0.25*themeDelta + bonus`
  - 최종 점수 = `100 / (1 + exp(-0.06 * (raw - 25)))` (소프트 시그모이드 정규화) → 0~100점 → S(≥80)/A(≥65)/B(≥50)/C(≥35)/D 등급.
- `src/pages/ScarcityPage.js` — 제품 번호 입력 + "분석하기" 버튼 UI:
  - allorigins.win CORS 프록시로 BrickEconomy 시세 조회 시도, 실패 시 테마 평균 기반 시뮬레이션.
  - MSRP 폴백 체인: `prices.json` KRW → USD\*1400 → 부품 수 × ~155 KRW 추정.
  - 진행 상태 라이브 로그 표시 (스피너 + 단계별 메시지).
  - **Recharts** `LineChart` 두 개로 시각화: ① 과거 36개월 테마 평균 기반 가격 추이 (현재 시세 dot), ② 향후 12개월 예상 가격 곡선 (`ReferenceLine` 으로 현재가 강조).
  - 결과 카드: 게이지 바(빨강→주황→노랑→초록→골드 그라데이션)에 점수 마커, 등급 색상 강조, MSRP/현재 시세/수익률/테마 평균/독점 여부 통계.
  - 쿼리 파라미터 `?setNum=75192` 로 딥링크 자동 분석 지원.
- `src/utils/i18n.js` — ko/en 번역 35+ 키 추가 (scarcityNavLabel, scarcityScoreTitle 등).
- `src/App.js` — `/scarcity` 라우트 등록.
- `src/components/Header.js` — 헤더 네비게이션에 희소가치 링크 추가.
- `package.json` — `recharts ^2.12.7` 의존성 추가.

> ⚠️ **사용자 작업 필요**: 로컬에서 `npm install` 실행 후 `package-lock.json` 커밋 필요.

### v0.5.0 — 2026-04-07

#### `NEW` feat: 일별 가격 스냅샷 + 제품별 가격 변동 차트
- `src/data/priceHistoryIndex.json` — 모든 세트의 가격 시계열 인덱스 (`{generated, snapshotCount, series: {setNum: [{d, p}, ...]}}`). 연속 중복 가격은 앵커만 유지하도록 압축.
- `src/data/prices-history/2026-04-07.json` — 첫 번째 일별 스냅샷 (`{date, source, prices: {setNum: krwPrice}}`).
- `src/utils/priceHistory.js` — `getPriceHistory(setNum)` (변형 접미사 `-1` 자동 처리), `getPriceStats(history)` (min/max/first/latest/change/changePct), `getSnapshotCount()` 헬퍼.
- `src/components/PriceHistoryChart.js` — Pure SVG 라인 차트 (520x170 viewBox, area fill rgba(0,102,204,0.08), line stroke #0066cc). 데이터 2점 미만이면 `null` 반환.
- `src/pages/SetDetailPage.js` — `detail-actions` 와 `insSection` 사이에 `<PriceHistoryChart setNum={setNum}/>` 삽입.
- `src/data/prices.json` — 해리포터 12개 세트 추가 (76446, 76423, 76419, 71043, 76405, 76391, 76402, 76420, 76421, 76428, 76430, 76431).
- `scripts/fetch-prices.js` — `writeSnapshotAndIndex(data)` 함수 추가 (try/catch 비치명적), `--snapshot-only` 모드 추가, 시계열 압축 로직.
- 의도적으로 외부 라이브러리(recharts/chart.js)를 사용하지 않고 Pure SVG 로 구현하여 번들 크기 영향 0.

> ⚠️ **사용자 작업 필요**: `.github/workflows/auto-update-images.yml` 의 "Check for changes" 단계 `git add` 라인에 `src/data/priceHistoryIndex.json` 와 `src/data/prices-history/` 경로를 추가해야 매일 스냅샷이 누적됨 (PAT `workflow` 스코프 부족으로 자동 push 불가).

### v0.4.2 — 2026-04-07

#### `NEW` ci: 주간 자동 업데이트 GitHub Actions 워크플로우
- `.github/workflows/auto-update-images.yml` — 매주 일요일 03:00 UTC 에 자동 실행되는 워크플로우 추가
- `scripts/fetch-prices.js` 와 `scripts/fetch-images.js` 를 순차 실행하여 `prices.json`, `legoImages.json` 자동 갱신
- 변경사항 있으면 `main` 브랜치에 `[skip ci]` 커밋 자동 푸시
- 이어서 `npm run build` + `peaceiris/actions-gh-pages@v4` 로 `gh-pages` 자동 재배포
- 수동 트리거(`workflow_dispatch`)도 지원 — Actions 탭에서 "Run workflow" 클릭으로 즉시 실행 가능
- README 에 "자동 업데이트 (GitHub Actions)" 섹션 신설

### v0.4.1 — 2026-04-07

#### `NEW` feat: 일반(비 BDP) 제품 멀티 이미지 갤러리
- `scripts/fetch-images.js` — rebrickable.com 세트 페이지를 스크레이핑해 갤러리 이미지 ID를 수집하는 빌드 타임 스크립트 추가
- `src/data/legoImages.json` — 일반 제품의 Rebrickable 갤러리 이미지 ID 데이터베이스 (빌드 타임 수집)
- `SetDetailPage.js` — BDP → `legoImages` → 단일 이미지 순서로 폴백하여 일반 제품도 썸네일 스트립과 멀티 이미지 갤러리 표시
- `package.json` — `npm run fetch-images` 스크립트 추가 (`--from-prices`, `--refresh` 옵션 지원)
- Rebrickable에 등록된 기존 단일 이미지(`set_img_url`)가 수집된 ID와 겹치지 않으면 첫 번째 슬롯에 자동 삽입
- README에 "갤러리 이미지 수집" 섹션과 TOC 링크 추가

### v0.4.0 — 2026-04-07

#### `NEW` feat: 제품 상세 이미지 갤러리 확대 및 썸네일 스트립
- 메인 갤러리 이미지 크기 확대 (400px → 560px, aspect-ratio 4/3)
- 슬라이드 점(dots) 네비게이션을 Rebrickable 스타일 썸네일 스트립(74x60)으로 교체
- 썸네일은 Rebrickable CDN `230x180p` 변형 사용으로 로딩 최적화
- 활성 썸네일 파란색 테두리 강조 + hover 효과
- 모바일 반응형: 썸네일 64x52 축소, wrapper full-width
- 모든 제품 상세 페이지(검색/신제품/펀딩/컬렉션/둘러보기)에 일괄 적용 (공유 `SetDetailPage` 컴포넌트)

#### `NEW` feat: BDP 펀딩제품 갤러리 6장 이미지 + 한국어 부품/미니피규어 번역
- BDP 제품 상세에 Rebrickable 갤러리 이미지 전체 표시 (이전에는 1~2장만)
- `src/data/bdpImages.json` — BDP 63개 세트의 모든 갤러리 이미지 ID 사전 수집
- `src/components/TranslatedName.js` — map 루프 내에서 useTranslatedName 훅 사용을 위한 래퍼 컴포넌트
- 한국어 모드에서 제품명, 부품 이름, 미니피규어 이름 자동 번역 (모든 탭 공통)

#### `FIX` fix: Rebrickable 이미지 갤러리 정확도 개선
- BrickLink CDN 폴백 이미지 제거하여 Rebrickable과 정확히 일치시킴
- Gold Mine Expedition 등 BDP 제품 이미지 수/종류 Rebrickable 기준 정합성 확보

#### `NEW` feat: BDP 펀딩제품 가격 데이터 추가
- BDP 제품 USD 가격 데이터 추가 (KRW 환산 표시)

#### `DOCS` docs: README 목차 추가
- GitHub에서 섹션/변경 이력으로 바로 이동 가능한 목차 링크 추가

### v0.3.1 — 2026-04-06

#### `FIX` fix: 한국어 검색 로직 개선
- 누락된 한국어 단어 추가
- WORD_MAP이 SET_NUM_MAP prefix 매칭보다 먼저 실행되도록 순서 조정

### v0.3.0 — 2026-04-06

#### `NEW` feat: 한국 레고 가격 표시
- 세트 카드에 KRW 가격 표시 (소수점 제거, 한글 원화 기호)
- 세트 상세 페이지에 가격 메타 정보 추가
- 단종 제품은 "단종" 태그 표시
- `scripts/fetch-prices.js` — 빌드 타임에 lego.com/ko-kr에서 JSON-LD 가격 데이터 수집
- `src/data/prices.json` — 가격 데이터베이스 (커밋됨, 초기값 포함)
- `src/utils/price.js` — 가격 포맷팅, 환율 변환, 검색 URL 유틸리티
- `src/hooks/useLegoPrice.js` — React 훅으로 세트별 가격 조회

### v0.2.0 — 2026-04-06

#### `NEW` feat: 레고 모듈러 빌딩 전체 키워드 검색
- 모듈러 빌딩 21종 전체 한국어 키워드 매핑 (카페코너, 그린그로서, 소방대, 펫샵, 타운홀, 팰리스시네마, 탐정사무소, 브릭뱅크 등)
- SET_NUM_MAP으로 별명 검색 시 해당 제품번호 즉시 반환

#### `NEW` feat: 펀딩제품 페이지 필터 기능
- 연도별 셀렉트박스 필터 추가
- 제품명/번호 검색 입력 필드 추가
- 필터링 결과 카운트 표시 (전체 대비)

#### `FIX` fix: 테마명 한국어 인코딩 깨짐 수정
- translate.js에 100+ 테마명 하드코딩 번역 맵 추가 (THEME_NAME_MAP)
- "반지의제왕", "해리포터" 등이 깨진 문자로 표시되던 문제 해결
- MyMemory API 호출 전 하드코딩 맵 우선 체크

#### `NEW` feat: 한국어 별명 → 제품번호 직접 검색 (SET_NUM_MAP)
- 올드 캐슬 별명: 용마성(6082), 비룡성(6086), 박쥐성(6097), 유령성(6081), 사자성(6080) 등
- 해적: 블랙펄(10365), 잭스패로우, 캐리비안의해적
- 인기 세트: 타이타닉(10294), 콜로세움(10276), 에펠탑(10307) 등
- SearchPage에서 SET_NUM_MAP 매핑된 제품번호로 즉시 검색

### v0.1.1 — 2026-04-06

#### `NEW` feat: BDP 펀딩제품 탭
- BrickLink Designer Program 제품 자동 감지 및 시리즈 탭 표시
- 시리즈별/전체 보기 + 무한 스크롤

#### `NEW` feat: 이미지 갤러리 + 스와이프
- 제품 상세에 Rebrickable + BrickLink CDN 멀티 이미지 로드
- 터치 스와이프, 화살표 버튼, 도트 인디케이터, 카운터 뱃지
- 팝업에서도 스와이프/키보드 지원

#### `FIX` fix: 로고/검색 클릭 시 검색 상태 초기화
- sessionStorage 클리어 + resetSearch 이벤트로 SearchPage 상태 리셋

#### `FIX` fix: X 클리어 버튼 투명 배경 처리

### v0.1.0 — 2026-04-06

#### `NEW` feat: 부품 카테고리 한국어 번역 + 검색 결과 무한 스크롤 + 카테고리별 그룹화
- PartsSearchPage: 부품 카테고리명 한국어 자동 번역 (MyMemory API + localStorage 캐싱)
- PartsSearchPage: 검색 결과를 카테고리별로 그룹화하여 섹션으로 표시
- PartsSearchPage: 페이지네이션 → 무한 스크롤 (IntersectionObserver)
- SearchPage: 페이지네이션 → 무한 스크롤 (IntersectionObserver)
- SearchPage: 테마명 한국어 번역 지원 (MyMemory API)

#### `NEW` feat: 검색 결과 테마별 그룹화 표시
- 검색 결과를 theme_id 기준으로 그룹화하여 테마별 섹션으로 표시

#### `NEW` feat: 부품 검색 탭 추가 (PartsSearchPage + PartDetailPage)
- 부품 이름/번호로 검색 기능 추가
- 부품 카테고리 필터 드롭다운 지원
- 부품 상세 페이지: 사용 가능한 색상, 엘리먼트 ID, 포함된 세트 목록

#### `NEW` feat: 한국어 자연어 검색 + 100+ 키워드 매핑
- 한국어→영어 검색 키워드 사전 추가 (searchDict.js)

#### `NEW` feat: 테마명 번역 + 제품명 한국어 번역
- MyMemory Translation API 연동

#### `NEW` feat: LEGO Finder React 앱 초기 구현
- 제품번호/이름 검색, 테마/연도별 필터, 세트 상세, 컬렉션 & 위시리스트, GitHub Pages 배포

---

## 라이선스

MIT
