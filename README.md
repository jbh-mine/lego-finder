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

- **React 19** + React Router (HashRouter)
- **Axios** + API 캐싱
- **Rebrickable API v3** — 세트 검색, 부품 검색, 미니피규어 데이터
- **BrickLink CDN** — 제품 대체 이미지 (SN/ON)
- **MyMemory Translation API** — 제품명/테마명/카테고리명 한국어 번역 (localStorage 캐싱)
- **GitHub Pages** (gh-pages) 배포
- **GitHub Actions** — 주간 데이터 자동 수집 + 자동 배포 파이프라인

---

## 프로젝트 구조

```
src/
├── App.js                  # 라우팅 설정
├── index.js                # 엔트리 포인트
├── components/
│   ├── Header.js           # 네비게이션 + 한/영 전환 + 검색 초기화
│   ├── SetCard.js          # 세트 카드
│   ├── Pagination.js       # 페이지네이션
│   ├── TranslatedName.js   # map 루프 내 번역 훅 래퍼 컴포넌트
│   └── Loading.js          # 로딩/에러/빈 상태 컴포넌트
├── contexts/
│   └── LanguageContext.js  # 언어 상태 관리 (Context API)
├── data/
│   ├── prices.json         # 한국 레고 가격 데이터베이스 (자동 갱신)
│   ├── bdpImages.json      # BDP 갤러리 이미지 ID 사전 수집
│   └── legoImages.json     # 일반(비 BDP) 세트 갤러리 이미지 ID (자동 갱신)
├── pages/
│   ├── SearchPage.js       # 세트 검색 (테마별 그룹화 + 무한스크롤 + 한국어 자연어 + SET_NUM_MAP)
│   ├── PartsSearchPage.js  # 부품 검색 (카테고리별 그룹화 + 무한스크롤 + 한국어 번역)
│   ├── PartDetailPage.js   # 부품 상세 (색상, 엘리먼트, 세트)
│   ├── BrowsePage.js       # 테마/연도 브라우징 (무한스크롤)
│   ├── SetDetailPage.js    # 세트 상세 (이미지 갤러리 + 썸네일 스트립 + 부품 + 미니피규어 + 한국어 번역)
│   ├── FundingPage.js      # BDP 펀딩제품 (시리즈탭 + 연도필터 + 이름검색)
│   └── CollectionPage.js   # 내 컬렉션/위시리스트
├── styles/
│   ├── App.css             # 전체 스타일 (반응형 포함)
│   └── price.css           # 가격 표시 스타일
└── utils/
    ├── api.js              # Rebrickable API 래퍼 (세트 + 부품)
    ├── searchDict.js       # 한국어→영어 검색 키워드 사전 + SET_NUM_MAP (별명→제품번호)
    ├── translate.js        # 테마명 하드코딩 번역 + MyMemory API 폴백
    ├── price.js            # 가격 유틸리티 (KRW 포맷팅, 환율, 검색)
    ├── i18n.js             # 한/영 UI 번역 리소스
    └── collection.js       # localStorage 컬렉션 관리

scripts/
├── fetch-prices.js         # 빌드 타임 lego.com/ko-kr JSON-LD 가격 수집
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

생성된 `src/data/prices.json`은 빌드 타임에 자동으로 번들에 포함됩니다.

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

> 이 Changelog는 코드가 수정될 때마다 자동으로 업데이트됩니다.

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
