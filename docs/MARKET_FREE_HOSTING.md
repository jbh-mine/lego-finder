# 카드 등록 없는 무료 시세 서버

확인일: 2026-11-03. **실제 호스팅 계정과 BrickLink 키가 연결되기 전에는 수집이 시작되지 않는다.**

개인·비영리 용도의 alwaysdata Free에 Node.js 24 웹사이트와 SQLite를 올리고, 무료 예약 작업에서 갱신 요청을 보낸다. 화면은 GitHub Pages를 유지한다. Free는 1GB 디스크·256MB RAM·계정의 HTTPS 주소를 제공하므로 별도 VM·Docker·DB·도메인 구매는 필요 없다. [공식 요금](https://www.alwaysdata.com/en/offers/), [Node 지원](https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/)

공식 홈페이지는 카드 없는 가입을 안내하지만 일부 가입에는 카드 검증이 요구될 수 있다. **Free만 선택하고 카드·결제·유료 전환을 요구하면 중단한다.** 무료 계정은 120일마다 관리자 로그인이 필요하다. [가입 안내](https://www.alwaysdata.com/en/), [제한 모드](https://help.alwaysdata.com/en/docs/admin-billing/profile/restricted-mode/), [활동 조건](https://help.alwaysdata.com/en/docs/admin-billing/profile/alerts-notifications/)

## 소유자 준비와 배포

1. [Free 가입](https://www.alwaysdata.com/en/register/?p=2012)의 이메일 확인·약관 동의를 완료하고 계정명을 확인한다. 비밀번호·키는 채팅에 보내지 않는다.
2. Advanced → Servers status에서 **HTTP 서버의 외부 요청 IPv4**를 확인한다. 웹 앱 내부 바인딩 IP나 SSH 서버 IP와 구분한다. [공식 출발 IP 설명](https://help.alwaysdata.com/en/docs/web-hosting/dedicated-ip-addresses/)
3. BrickLink API 등록 화면에서 해당 IPv4를 등록하고 인증 값 4개를 발급한다. 배포에 필요한 SSH 접속은 공개키를 등록해 허용할 수 있다. 비밀키는 배포 컴퓨터에만 둔다.
4. 아래 묶음을 `/home/ACCOUNT/market-api/`에 풀고 `alwaysdata.env.example`을 `.env`로 복사한다. 인증 값과 긴 임의의 ADMIN_TOKEN을 채우고 파일 권한을 `600`으로 설정한다. 이 폴더를 정적 사이트의 문서 루트로 노출하지 않는다.

```sh
node scripts/package-market-api.cjs /absolute/path/lego-market-api-free.tar.gz
```

묶음에는 허용된 서버 소스만 포함된다. 실제 `.env`, 비밀 파일, DB, 테스트 자료와 `node_modules`는 제외한다.

Environment → Node.js를 **24**로 선택하고 Web → Sites에 **Node.js 유형**을 만든다. 기본 무료 HTTPS 주소를 사용하고 다음 시작 명령을 설정한다. 명령에 `--env-file`을 미리 붙이지 않는다.

```sh
MARKET_HOSTING_PRESET=alwaysdata-free node /home/ACCOUNT/market-api/hosting-entry.mjs
```

런처는 플랫폼 IP/HOST·PORT를 우선하고 DB 상대 경로를 서버 폴더 기준으로 고정한다. 무료 preset 기본값은 활성 조회 조건 50개·공급원 대기열 8개·갱신 배치 4개·일 호출 예산 1,200회다. 제품 번호의 고정 목록은 없고 오래 사용하지 않은 조건부터 추적 대상에서 교체한다. `.env`의 명시 값이 preset보다 우선하므로 무료 전용 예제를 사용한다.

## 예약 수집

무료 웹 프로세스는 유휴 중단·재시작될 수 있으므로 내부 타이머만으로 상시 수집을 보장하지 않는다. Scheduled tasks에서 15분마다 다음 명령으로 **실제 갱신 요청**을 보낸다. SSH cron이 BrickLink를 직접 호출하면 출발 IP가 달라질 수 있다. [프로세스 수명](https://help.alwaysdata.com/en/docs/web-hosting/sites/misc/), [유료 Services](https://help.alwaysdata.com/en/docs/web-hosting/services/), [예약 작업](https://help.alwaysdata.com/en/docs/web-hosting/tasks/)

```sh
curl --config /home/ACCOUNT/market-api/refresh.curl.conf
```

`refresh.curl.conf`는 아래 형식으로 만들고 권한을 `600`으로 한다. 토큰을 명령행이나 저장소에 넣지 않고 리다이렉트도 허용하지 않는다.

```text
url = "https://ACCOUNT.alwaysdata.net/v1/admin/refresh"
request = "POST"
header = "Authorization: Bearer YOUR_PRIVATE_ADMIN_TOKEN"
header = "Content-Type: application/json"
data = "{}"
fail
silent
show-error
max-time = 30
```

## 실제 시작 검증

`/health`의 configured는 인증 값 존재 여부다. `/v1/market/10294-1?condition=N&country=GLOBAL`의 실제 인증 성공·조회 시각·일별 이력 한 점 저장까지 확인한다. 관리자 응답의 scheduled는 접수 수이므로 완료로 오인하지 않고, 다음 예약 이후 재조회해 갱신을 확인한다. 정상 조회에 최근 판매가 없으면 no-sales는 정상 결과다.

GitHub 저장소 변수 `MARKET_API_URL`에 HTTPS 주소를 넣고 deploy.yml을 실행한다. 배포 후 7종 밖의 제품, 상태·판매자 지역 분리, 다음 예약 실행을 확인한다. 호스팅 서버 이전 시 등록 IP를 갱신한다. [API 출처와 자료 해석](MARKET_DATA_SOURCES.md), [기존 운영 안내](MARKET_API_SETUP.md)
