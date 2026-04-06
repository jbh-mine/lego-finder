# LEGO Finder

GitHub Pages에서 동작하는 레고 세트 검색 및 컬렉션 관리 웹앱입니다.

> **라이브 데모**: https://jbh-mine.github.io/lego-finder

---

## 주요 기능

- **제품번호/이름 검색** — Rebrickable API를 통한 실시간 레고 세트 검색
- **한국어 자연어 검색** — "모듈러", "스타워즈", "경찰서" 등 한국어 키워드로 검색 가능 (100+ 키워드 매핑)
- **테마/연도 필터링** — 테마별, 연도별 브라우징 (테마명 한국어 번역 지원)
- **세트 상세 정보** — 부품 목록, 미니피규어, 색상 정보 확인
- **조립설명서 PDF 다운로드** — LEGO Slingshot API 연동, 북릿 번호 표시 (1/2, 2/2)
- **내 컬렉션 관리** — localStorage 기반 컬렉션 및 위시리스트
- **한/영 전환** — 헤더 토글 버튼으로 언어 전환
- **모바일 반응형** — 햄버거 메뉴, 터치 영역 확대 등 모바일 최적화

---

## 기술 스택

- **React 19** + React Router (HashRouter)
- **Axios** + API 캐싱
- **Rebrickable API v3** — 세트 검색, 부품, 미니피규어 데이터
- **LEGO Slingshot API** — 조립설명서 PDF URL (Elasticsearch 기반)
- **MyMemory Translation API** — 제품명/테마명 한국어 번역 (localStorage 캐싱)
- **GitHub Pages** (gh-pages) 배포

---

## 프로젝트 구조

```
src/
├── App.js                  # 라우팅 설정
├── index.js                # 엔트리 포인트
├── components/
│   ├── Header.js           # 네비게이션 + 한/영 전환 토글
│   ├── SetCard.js          # 세트 카드 (조립설명서 버튼 포함)
│   ├── Pagination.js       # 페이지네이션
│   └── Loading.js          # 로딩/에러/빈 상태 컴포넌트
├── contexts/
│   └── LanguageContext.js  # 언어 상태 관리 (Context API)
├── hooks/
│   └── useInstructions.js  # 조립설명서 PDF 데이터 훅
├── pages/
│   ├── SearchPage.js       # 검색 페이지 (한국어 자연어 지원)
│   ├── BrowsePage.js       # 테마/연도 브라우징 (무한스크롤)
│   ├── SetDetailPage.js    # 세트 상세 (부품, 미니피규어, 설명서)
│   └── CollectionPage.js   # 내 컬렉션/위시리스트
├── styles/
│   └── App.css             # 전체 스타일 (반응형 포함)
└── utils/
    ├── api.js              # Rebrickable API 래퍼
    ├── instructions.js     # LEGO Slingshot API (조립설명서 PDF)
    ├── searchDict.js       # 한국어→영어 검색 키워드 사전
    ├── translate.js        # MyMemory 번역 API (제품명 번역)
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

#### `e918056` feat: 한국어 자연어 검색 + LEGO Slingshot API 수정
- 한국어→영어 검색 키워드 사전 추가 (`searchDict.js`) — 100+ 키워드 매핑
  - 구문 매핑: 스타워즈→Star Wars, 해리포터→Harry Potter, 밀레니엄팔콘→Millennium Falcon 등
  - 단어 매핑: 모듈러→Modular, 테크닉→Technic, 자동차→Car, 공룡→Dinosaur 등
  - 테마, 차량, 건물, 캐릭터, 자연, 기타 카테고리 전체 커버
- SearchPage에서 검색 시 자동으로 한국어를 영어로 변환하여 Rebrickable API에 전달
- `instructions.js` LEGO Slingshot API 수정: GET→POST, API 키 헤더 추가, Elasticsearch 쿼리 본문 형식 적용
- CORS 프록시 폴백 유지 (`corsproxy.io`)

#### `dc5286a` feat: 테마명 번역 + 조립설명서 PDF 다운로드 (북릿 지원)
- BrowsePage 테마명 한국어 번역 지원 (MyMemory Translation API)
- 조립설명서를 LEGO 페이지 링크에서 PDF 직접 다운로드 링크로 변경
- 북릿 번호 표시: "조립설명서 1/2", "조립설명서 2/2" 형식
- SetCard, SetDetailPage에 조립설명서 섹션 추가
- `useInstructions` 커스텀 훅 추가
- 조립설명서 관련 CSS 스타일 추가 (모바일 반응형 포함)

#### `d807d9b` feat: 제품명 한국어 번역 + 테마 섹션 + 무한 스크롤
- MyMemory Translation API 연동으로 제품명 한국어 자동 번역
- 번역 결과 localStorage 캐싱
- BrowsePage 테마별 섹션 구분
- 무한 스크롤 구현

#### `77117ec` fix: 한글 인코딩 수정 + 조립설명서 링크 추가
- `t()` 함수를 통한 한글 인코딩 문제 해결 (유니코드 이스케이프 방식)
- LEGO 공식 사이트 조립설명서 페이지 링크 추가

#### `10ba8f3` feat: 언어 선택 버튼 + 사용 가이드
- 헤더에 한/영 언어 선택 버튼 추가
- 다운로드 가능한 사용자 가이드 추가

#### `2f75805` fix: 한글 인코딩 수정 + 언어 토글 항상 표시
- 한글 깨짐 현상 수정
- 언어 전환 토글이 항상 보이도록 수정

#### `dbca0a7` feat: 한/영 전환 시스템 + 모바일 반응형 강화
- LanguageContext + i18n 번역 시스템 추가
- 헤더에 한/영 전환 토글 버튼 추가
- SetDetailPage, CollectionPage 유니코드 이스케이프 → 정상 한글 수정
- 모바일 반응형 CSS 강화 (햄버거 메뉴, 터치 영역 확대)
- 모든 컴포넌트에 `useLanguage()` 적용

#### `c64f773` feat: LEGO Finder React 앱 초기 구현
- 제품번호/이름 검색 (Rebrickable API)
- 테마/연도별 필터 브라우징
- 세트 상세 (부품, 미니피규어)
- 컬렉션 & 위시리스트 (localStorage)
- GitHub Pages 배포 설정
- API 캐싱 (Rate Limit 최적화)

#### `bc8d77c` Initial commit
- 프로젝트 초기 설정

---

## 라이선스

MIT
