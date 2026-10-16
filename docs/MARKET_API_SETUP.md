# 제품별 자동 시세 서버 준비 및 연결

GitHub Pages 화면은 API 키를 안전하게 보관하거나 공용 데이터베이스를 실행할 수 없다. 이 저장소에는 **Node.js 24 + SQLite 서버**, Docker 배포 설정, 자동 갱신과 프런트엔드 연결 기능이 포함되어 있다. 공개 사이트의 서버 주소를 설정하고 운영자 인증을 연결해야 실제 자동 수집이 시작된다. 서버가 연결되지 않았을 때 보이는 KREAM 7종은 날짜 있는 참고 스냅샷이며 실시간 데이터가 아니다.

## 1. 준비할 것

| 준비물 | 방법 |
| --- | --- |
| BrickLink API 사용 자격 | [공식 API 등록](https://www.bricklink.com/v2/api/register_consumer.page)에 로그인하여 등록 가능 여부를 확인한다. 현행 약관은 등록 판매자를 대상으로 하므로 구매 계정만으로 발급을 보장하지 않는다. |
| 인증 값 4개 | Consumer Key, Consumer Secret, Token Value, Token Secret을 발급한다. 아래 서버 비밀 파일에만 저장한다. |
| 고정 공인 IP 서버 | Node.js 24 또는 Docker를 실행하고 데이터를 영속 보관할 Linux VPS 등을 준비한다. 서버의 **실제 외부 요청 IP**를 BrickLink에 등록한다. GitHub Pages 주소나 방문자 IP가 아니다. NAT 환경이면 outbound IP를 확인한다. |
| HTTPS 주소 | 소유한 도메인/서브도메인의 A 레코드를 서버로 연결한다. 아래 Caddy가 TLS 인증서를 발급한다. 방화벽에서 TCP 80/443만 공개한다. IPv6 AAAA 레코드가 있다면 도달성과 등록 outbound IP도 확인한다. |
| 데이터 디스크 | SQLite와 백업을 보관한다. Docker `market-data` 볼륨은 재시작/재배포 후에도 유지한다. |

기본 API 한도는 하루 5,000회다. 서버는 최대 4,500회를 사용하고, 하나의 갱신은 sold/stock 두 요청을 사용한다. 500개의 활성 조회 조건을 6시간마다 갱신하면 약 4,000회/일이 필요하다. 오류 재시도도 한도를 사용한다. 모든 검색 제품을 지원하지만 전체 카탈로그 수만 개를 동시에 갱신하는 무제한 수집기는 아니다. [공식 등록·IP 안내](https://www.bricklink.com/v3/api.page), [데이터의 정확한 범위](MARKET_DATA_SOURCES.md)

## 2. Docker로 서버 실행

다음은 소유한 Linux 서버에서 실행한다. 예제 도메인과 이메일을 실제 값으로 수정한다. 키를 GitHub, 브라우저, 채팅, 명령행 인수에 넣지 않는다.

```sh
git clone https://github.com/jbh-mine/lego-finder.git
cd lego-finder/deploy/market-api
cp .env.example .env
mkdir -m 700 secrets
umask 077
touch secrets/consumer_key secrets/consumer_secret secrets/token_value secrets/token_secret
# 편집기로 각 파일에 해당 인증 값 하나만 저장한다.
# 예: nano secrets/consumer_key
openssl rand -hex 32 > secrets/admin_token
# 제공 이미지는 UID 1000인 node 사용자로 실행한다. 비밀 파일만 읽을 수 있게 맞춘다.
sudo chown 1000:1000 secrets/*
sudo chmod 400 secrets/*
# .env의 API_DOMAIN, TLS_EMAIL을 수정한다.
docker compose up -d --build
docker compose ps
```

관리 토큰도 서버 비밀 파일에만 보관한다. Compose는 필요한 컨테이너에 `/run/secrets/` 파일로 비밀을 전달하며 공개 `.env`에는 도메인·이메일만 둔다. 파일 기반 Compose secret은 호스트 권한의 영향을 받으므로 API 컨테이너의 UID 1000이 읽을 수 있어야 한다. 위 명령은 일반 Linux Docker용이며 rootless/user namespace 환경에서는 매핑된 UID에 맞춘다. 인증 값은 직접 환경 변수로도 설정할 수 있지만 `_FILE` 방식을 권장한다. 두 값이 모두 있으면 직접 환경 변수가 우선한다. 비밀 파일과 DB는 `.gitignore`에 포함되어 있다.

```sh
curl --fail https://YOUR_API_DOMAIN/health
curl --fail 'https://YOUR_API_DOMAIN/v1/market/21322-1?condition=N&country=GLOBAL'
```

`/health`의 `configured:true`는 네 인증 값이 존재한다는 뜻이다. 실제 인증 성공 여부는 두 번째 요청으로 확인한다. `PROVIDER_AUTH`라면 키 네 값과 등록된 외부 요청 IP, 서버 시계를 확인한다. 실제 API가 해당 제품·범위를 제공해야 가격이 반환된다. 인증 실패를 거래 없음으로 표시하지 않는다.

직접 실행하려면 `server/market-api/.env.example`의 환경 변수를 서버 프로세스에 설정하고 Node.js 24에서 `node --env-file=.env server.mjs`를 실행한다. SQLite는 Node 내장 모듈을 사용하므로 별도 DB 설치와 npm 라이브러리가 필요 없다. 외부로 직접 노출할 때에는 `TRUST_PROXY=0`을 유지하고 HTTPS reverse proxy를 별도로 구성한다. 제공 Compose는 API 포트를 내부에만 노출하고 Caddy 뒤에서 실행한다.

## 3. 공개 사이트에 연결

1. [희소가치·시세 화면](https://jbh-mine.github.io/lego-finder/#/scarcity)의 시세 서버 설정에 `https://YOUR_API_DOMAIN`을 입력하고 연결한다. 주소는 해당 브라우저에 저장된다. API 키 입력란은 없다.
2. 모든 방문자에게 기본 연결하려면 GitHub 저장소 → **Settings → Secrets and variables → Actions → Variables**에서 `MARKET_API_URL` 변수를 위 HTTPS 주소로 만든다. 비밀 키를 이 변수에 넣으면 안 된다.
3. [Test and deploy LEGO Finder](https://github.com/jbh-mine/lego-finder/actions/workflows/deploy.yml)를 Run workflow로 실행한다. 빌드가 `REACT_APP_MARKET_API_URL`로 공개 주소를 넣는다.
4. 7종 밖의 제품, 예를 들어 `10294-1`도 검색해 실제 공급원·조회 시각·New/Used·판매자 지역·표본 수가 표시되는지 확인한다. 해당 범위에 최근 판매가 없으면 `최근 30일 판매 자료 없음`이 정상 결과다.

다른 사이트에서 접속할 경우 `ALLOW_ORIGINS`에 정확한 origin을 쉼표로 추가한다. 경로(`/lego-finder`)는 넣지 않는다. CORS는 브라우저 접근 제한이며 서버 API 전체를 비공개 인증으로 바꾸는 기능은 아니다. 사용자 API에는 IP별 속도 제한과 전체 공급원 한도가 적용된다.

## 4. 갱신과 이력의 동작

- 제품 조회 시 해당 **제품 번호 + N/U + GLOBAL/KR + KRW** 조합을 추적한다. 7종 고정 목록은 없다. BrickLink와 카탈로그 식별자가 다른 제품은 결과 없음으로 안내하며 다른 제품으로 대체하지 않는다.
- 가격 캐시는 6시간이다. 화면은 만료·재방문 때 재조회한다. 서버는 15분마다 만료된 활성 조합을 순차 갱신한다. 최근 7일 조회된 최대 500개 조합을 유지하며 한도 초과 시 가장 오래 사용하지 않은 조합부터 교체한다.
- 사용자가 직접 새로고침해도 같은 조합의 실제 공급원 요청에는 최소 10분 간격을 둔다. 동시 요청을 합치고 공급원 호출 사이에 최소 1초를 둔다.
- 장애 시 24시간 이내의 마지막 정상 응답에 이전 조회 시각과 실패 상태를 붙여 표시한다. 24시간을 넘으면 현재 시세로 사용하지 않는다. 오류·한도 소진·거래 없음은 서로 다르다.
- 공급원 주문 행은 최대 24시간만 보관한다. 별도의 자체 **일별 가격 관측 통계**는 UTC 날짜당 한 점, 기본 730일 보관한다. 같은 날 재조회는 그 점을 갱신하며 새 거래나 새 학습 표본으로 늘리지 않는다.
- 추정에는 같은 조회 조건의 일별 관측 통계를 월별 중앙값으로 묶어 사용한다. 처음 서버를 연결한 날부터 이력이 쌓인다. 6개 월 구간·180일 등 조건을 충족하기 전에는 자동 전망 숫자를 만들지 않는다. [공식과 제한](MARKET_FORECAST_METHOD.md)

이는 공급원 익명 주문 행 전체를 영구 복제하는 거래 원장이 아니다. 환율·세트 하위 상태·배송비와 수수료의 한계가 있으므로 화면의 자료 해석 설명을 함께 확인한다. 원본 삭제 24시간과 파생 통계 730일은 서비스가 정한 보수적인 정책이다.

## 5. 운영·백업·업데이트

```sh
# 코드 업데이트와 재배포 (볼륨 유지)
git pull --ff-only
docker compose up -d --build
docker compose logs --tail 100 api

# 일관된 SQLite 백업: API를 잠깐 멈추고 DB/WAL/SHM을 함께 복사한다.
mkdir -p backups
docker compose stop api
docker compose cp api:/data/. ./backups/
docker compose start api
```

백업은 이 서버와 분리된 비공개 저장소에도 보관한다. 복구할 때 API를 멈추고 백업의 DB/WAL/SHM 파일을 동일 `/data` 위치에 복사한 뒤 재시작한다. 볼륨을 지우는 `docker compose down -v`는 이력을 삭제하므로 사용하지 않는다. 이전 커밋으로 돌아갈 때도 먼저 DB를 백업하고 코드 버전과 스키마 호환성을 확인한다. API 키를 교체한 뒤에는 컨테이너를 재시작한다.

진단에 공개 가격 응답과 안전한 오류 코드만 사용한다. 비밀 파일, Authorization 헤더, 서명 문자열을 로그나 이슈에 붙이지 않는다. 공개 서비스 운영 전 [공급원 약관과 출처 고지 요건](MARKET_DATA_SOURCES.md)을 확인한다. KREAM의 비공개 API나 자동 스크래핑으로 대체하지 않는다.

## 검증 범위

저장소 테스트는 OAuth 서명, 실제 공식 응답 형식의 테스트 자료, SQLite 영속 저장·하루 중복 방지·한도, HTTP/CORS/오류 처리와 화면 연동을 검사한다. 테스트 자료는 운영 시세로 제공하지 않는다. 운영자 인증과 서버가 없는 상태에서는 인증된 실시간 가격 조회와 실제 서버 배포 성공을 검증할 수 없다.
