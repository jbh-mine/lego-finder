# LEGO Finder

GitHub Pages에서 동작하는 레고 세트 검색 및 컬렉션 관리 웹앱입니다.

> **라이브 데모**: https://jbh-mine.github.io/lego-finder

---

## 주요 기능

- **제품번호/이름 검색** — Rebrickable API를 통한 실시간 레고 세트 검색
- **검색 결과 테마별 그룹화** — 검색 결과를 테마별로 분리하여 표시 (테마명 한국어 번역 지원)
- **부품 검색** — 부품 이름/번호로 검색, 카테고리 필터, 캫테고리별 그룹화, 색상 정보 확인
- **부품 카테고리 한국어 번역** — 한국어 선택 시 부품 카테고리명 자동 번역
- **무한 스크롤** — 검색/부품/둘러보기 모두 스크롤 시 데이터 자동 로드
- **한국어 자연어 검색** — "모듈러", "스타워즈", "경찰서" 등 한국어 키워드로 검색 가능 (100+ 키워드 매핑)
- **테마/연도 필터링** — 테마별, 연도별 브라우징 (테마명 한국어 번역 지원)
- **세트 상세 정보** — 부품 목록, 미니피규어, 색상 정보 확인
- **부품 상세 정보** — 사용 가능한 색상, 엘리먼트 ID, 포함된 세트 목록
- **내 컬렉션 관리** — localStorage 기반 컬렉션 및 위시리스트
- **한/영 전환** — 헤더 토글 버튼으로 언어 전환
- **모바일 반응형** — 햄버거 메뉴, 터치 영역 확대 등 모바일 최적화

---

## 기술 스택

- **React 19** + React Router (HashRouter)
- **Axios** + API 캐싱
- **Rebrickable API v3** — 세트 검색, 부품 검색, 미니피규어 데이터
- **MyMemory Translation API** — 제품명/테마명/카테고리명 한국어 번역 (localStorage 캐싱)
- **GitHub Pages** (gh-pages) 배포

---

## 프로젝트 구조

```
src/
├── App.js                  # 라우팅 설정
├── index.js                # 엔트리 포인트
├── components/
│   ├── Header.js           # 네비게이션 + 한/영 전환 토글
│   ├── SetCard.js          # 세트 카드
│   ├── Pagination.js       # 페이지네이션
│   └── Loading.js          # 로딩/에러/빈 상태 컴포넌트
├── contexts/
│   └── LanguageContext.js  # 언어 상태 관리 (Context API)
├── pages/
│   ├── SearchPage.js       # 세트 검색 (테마별 그룹화 + 무한스크롤 + 한국어 자연어)
│   ├── PartsSearchPage.js  # 부품 검색 (카테고리별 그룹화 + 무한스크롤 + 한국어 번역)
│   ├── PartDetailPage.js   # 부품 상세 (색상, 엘리먼트, 세트)
│   ├── BrowsePage.js       # 테마/연도 브라우징 (무한스크롤)
│   ├── SetDetailPage.js    # 세트 상세 (부품, 미니피규어)
│   └── CollectionPage.js   # 내 컬렉션/위시리스트
├── styles/
│   └── App.css             # 전체 스타일 (반응형 포함)
└── utils/
    ├── api.js              # Rebrickable API 래퍼 (세트 + 부품)
    ├── searchDict.js       # 한국어→영어 검색 키워드 사전
    ├── translate.js        # MyMemory 번역 API (제품명/테마명/카테고리명 번역)
    ├── i18n.js             # 한/영 UI 번역 리소스
    └── collection.js       # localStorage 컬렉션 관리
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

## 변경 이력 (Changelog)

### v0.1.0 — 2026-04-06

#### `NEW` feat: 부품 카테고리 한국어 번역 + 검색 결과 무한 스크롤 + 카테고리별 그룹화
- PartsSearchPage: 부품 카테고리명 한국어 자동 번역 (MyMemory API + localStorage 캐싱)
- PartsSearchPage: 검색 결과를 카테고리별로 그룹화하여 섹션으로 표시
- PartsSearchPage: 페이지네이션 → 무한 스크롤 (IntersectionObserver)
- SearchPage: 페이지네이션 → 무한 스크롤 (IntersectionObserver)
- SearchPage: 테마명 한국어 번역 지원 (MyMemory API)
- 두 검색 페이지 모두 둘러보기와 동일한 스크롤 패턴 적용

#### `NEW` feat: 검색 결과 테마별 그룹화 표시
- 검색 결과를 theme_id 기준으로 그룹화하여 테마별 섹션으로 표시
- 테마 이름 매핑을 위해 전체 테마 목록 로드 (Rebrickable API)
- useLanguage() 적용으로 i18n 지원
- createElement 패턴으로 한글 인코딩 안정화

#### `NEW` feat: 부품 검색 탭 추가 (PartsSearchPage + PartDetailPage)
- 부품 이름/번호로 검색 기능 추가 (`PartsSearchPage.js`)
- 부품 카테고리 필터 드롭다운 지원
- 부품 상세 페이지: 사용 가능한 색상, 엘리먼트 ID, 포함된 세트 목록 (`PartDetailPage.js`)
- 한국어 자연어 검색 지원 (부품 검색에도 searchDict 적용)
- Header 네비게이션에 '부품 검색' 탭 추가
- api.js에 `searchParts`, `getPartDetail`, `getPartColors`, `getPartCategories`, `getColors` 함수 추가

#### `9b9d28c` remove: 조립설명서 PDF 다운로드 버튼 및 관련 코드 제거
- SetCard.js: `useInstructions` 훅, 조립설명서 버튼 전체 제거
- SetDetailPage.js: 조립설명서 섹션(`ins-title`, `insSection`) 전체 제거

#### `e918056` feat: 한국어 자연어 검색 + LEGO Slingshot API 수정
- 한국어→영어 검색 키워드 사전 추가 (`searchDict.js`) — 100+ 키워드 매핑
- SearchPage에서 검색 시 자동으로 한국어를 영어로 변환하여 Rebrickable API에 전달

#### `dc5286a` feat: 테마명 번역 + 조립설명서 PDF 다운로드 (북릿 지원)
- BrowsePage 테마명 한국어 번역 지원 (MyMemory Translation API)

#### `d807d9b` feat: 제품명 한국어 번역 + 테마 섹션 + 무한 스크롤
- MyMemory Translation API 연동으로 제품명 한국어 자동 번역
- BrowsePage 테마별 섹션 구분 + 무한 스크롤

#### `77117ec` fix: 한글 인코딩 수정 + 조립설명서 링크 추가
- `t()` 함수를 통한 한글 인코딩 문제 해결

#### `10ba8f3` feat: 언어 선택 버튼 + 사용 가이드
- 헤더에 한/영 언어 선택 버튼 추가

#### `2f75805` fix: 한글 인코딩 수정 + 언어 토글 항상 표시

#### `dbca0a7` feat: 한/영 전환 시스템 + 모바일 반응형 강화
- LanguageContext + i18n 번역 시스템 + 모바일 반응형 CSS 강화

#### `c64f773` feat: LEGO Finder React 앱 초기 구현
- 제품번호/이름 검색, 테마/연도별 필터, 세트 상세, 컬렉션 & 위시리스트, GitHub Pages 배포

#### `bc8d77c` Initial commit
- 프로젝트 초기 설정

---

## 라이선스

MIT
