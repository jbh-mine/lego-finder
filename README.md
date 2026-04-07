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
- **부품 단가 (PPP) 가성비 분석** — 헤더 메뉴 → "가성비"에서 KRW/부품 기준으로 베스트 세트 목록 확인. 테마 필터 + Top N 선택기 + BEST 배지 강조
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
│   ├── prices.json
│   ├── priceHistoryIndex.json
│   ├── prices-history/
│   ├── themeReturns.js
│   ├── bdpImages.json
│   └── legoImages.json
├── pages/
│   ├── SearchPage.js
│   ├── ScarcityPage.js     # 적층형 LEGO 브릭 게이지 + Recharts 차트 + 기간 선택
│   ├── PppPage.js          # 부품 단가 (PPP) 가성비 분석
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
│   ├── lego-brick.css      # LEGO 브릭 디자인 시스템 (brick-stack/brick-badge/brick-status)
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
