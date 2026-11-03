# 쿠지 Supabase와 PC 가격 수집기

2026-11-03, 사용자가 선택한 기존 `kuji-monorepo` 프로젝트에 레고용 저장소와 API를 배포했다. 새 호스팅 가입·카드 등록·유료 플랜 변경은 하지 않는다. 공개 화면은 GitHub Pages를 유지한다.

## 실제 구성

- 프로젝트: `lkiyqjjihattcoykgpnn`, 독립 비공개 `lego_market` 스키마의 settings/scopes/jobs/observations/quota. 모든 새 테이블에 RLS가 있으며 공개 계정 정책은 없다. 기존 쿠지 테이블·함수·Auth·권한은 변경하지 않는다.
- Edge API: `https://lkiyqjjihattcoykgpnn.supabase.co/functions/v1/lego-market-api`. 가격 조회는 공개이며, 수집기 쓰기는 별도 토큰으로 인증한다. 서비스 키는 서버 내부에만 있고 브라우저나 PC 수집기에 전달하지 않는다.
- DB 예약: `lego-market-refresh-v1`, 15분마다 레고 대기열과 보관 기간을 관리한다. 이 작업은 BrickLink를 직접 호출하지 않는다.
- PC 예약: `LEGOFinder-SupabaseCollector`, 현재 사용자의 로그인 중 매분 1회 및 로그인 시 실행한다. 중복 실행 방지·3분 실행 제한·숨김 창을 사용한다. PC가 꺼지거나 로그아웃하면 새 가격 수집은 멈추고 Supabase 이력은 유지된다.

Supabase의 외부 요청 IP는 고정되지 않는다. 따라서 API에 등록한 IP의 PC에서만 BrickLink에 접속하고, 결과를 Supabase에 보낸다. [공식 Edge IP 설명](https://supabase.com/kb/troubleshooting/why-supabase-edge-functions-cannot-provide-static-egress-ips-for-whitelisting)

## 현재 상태와 키 연결

DB·API·PC 연결을 검증했으나 **BrickLink 키 네 값은 아직 비어 있어 실제 가격 0건**이다. `health.collector.online=true`는 PC 통신 성공을 뜻하며 실제 판매 자료 확보와 다르다. `configured=false`를 수집 성공으로 표시하지 않는다.

`server/market-api/.env`에는 전용 수집기 토큰·API 주소와 현재 외부 IPv4 힌트가 준비되어 있다. `BRICKLINK_REGISTERED_IP_HINT`의 IP를 BrickLink에 등록하고, 다음 네 항목을 채운다. 키·비밀번호를 채팅, 저장소, 작업 인수에 넣지 않는다.

```text
BRICKLINK_CONSUMER_KEY=
BRICKLINK_CONSUMER_SECRET=
BRICKLINK_TOKEN_VALUE=
BRICKLINK_TOKEN_SECRET=
```

이 파일과 수집 로그는 Git에서 제외된다. 예약 작업은 다음 실행 때 파일을 다시 읽는다. 실제 성공 여부는 제품 API의 조회 시각·최근 판매 중앙값과 Supabase 일별 관측 저장까지 확인해야 한다. IP가 바뀌면 등록 값을 갱신해야 한다.

## 자료 처리

제품 번호·New/Used·판매자 지역별로 조회하며 고정 7종 목록은 없다. 최근 7일 사용된 최대 50개 조합을 추적하고 6시간 만료 후 갱신한다. 공급원 요청은 일 1,200회 예산과 최소 1초 간격을 따른다. 작업 임대와 UTC 일별 예산은 DB에서 원자적으로 처리한다.

익명 주문 행은 영구 거래 원장으로 누적하지 않는다. 활성 캐시는 최대 24시간, 자체 일별 중앙값 통계는 최대 730일이다. 동일 UTC 날짜·조회 조건은 한 점으로 갱신한다. 월별 추세 모형은 [기존 공식과 최소 자료 조건](MARKET_FORECAST_METHOD.md)을 그대로 따른다. 자료가 없거나 오래됐으면 임의 가격을 만들지 않는다.

## 다시 설치·중단

Node.js 24가 필요하다. PC 예약 작업은 아래 스크립트로 검토하고 등록할 수 있다. 비밀 값은 명령행으로 전달하지 않는다.

```powershell
./scripts/install-market-collector-task.ps1 -DryRun
./scripts/install-market-collector-task.ps1 -StartNow
```

등록 시 같은 이름의 작업이 다른 저장소·사용자·실행 경로에 속하면 덮어쓰지 않는다. 로그는 `.collector-logs/latest.stdout.log`, `latest.stderr.log` 두 파일만 유지한다. 작업을 중단하려면 본인 작업 `LEGOFinder-SupabaseCollector`를 비활성화한다. 쿠지나 레고 DB를 삭제하지 않는다.

공개 사이트의 기본 API 주소는 GitHub 저장소 변수 `MARKET_API_URL`이다. 이전에 직접 연결 해제한 브라우저에서는 **기본 시세 API 연결**을 누른다. 쿠지 연결 설정과 쿠지 배포 변수는 그대로 둔다.

## 검증과 한계

운영 DB에서 21개 트랜잭션 검증을 실행하고 모두 롤백했다. 테스트 가격이 남지 않았고, 기존 쿠지 함수 정의·테이블 RLS·권한·계정별 읽기 정책이 동일함을 비교했다. 실제 HTTP에서는 상태 조회 200, 무인증 쓰기 401, 잘못된 Origin 403, 키 없는 제품 조회 NOT_CONFIGURED를 확인했다. PC의 실제 인증 heartbeat도 저장됐다.

로컬 테스트는 SQL 22개, Edge 17개, 수집기 14개와 기존 서버·화면 회귀 검증을 포함한다. 모의 가격 자료는 운영 데이터로 게시하지 않는다. 운영 후 보안 자문 조회 한 번이 시간 초과되어 전체 자문 결과를 재확인하지 못했으나 새 테이블 RLS·함수 호출 권한은 실제 DB 검증으로 확인했다. 기존 쿠지의 계정별 스키마 가시성·인증 RPC와 비밀번호 보호 설정 자문은 이번 변경에서 수정하지 않았다. [스키마 가시성](https://supabase.com/docs/guides/database/database-linter?lint=0027_pg_graphql_authenticated_table_exposed), [인증 RPC](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [비밀번호 보호](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

원본 SQL은 `supabase/schema.sql`, 예약 설정은 `supabase/cron.sql`이다. 이미 적용된 운영 프로젝트에 초기화 SQL을 반복 적용하지 않는다. 별도 로컬 DB에서 검증할 때만 `supabase/tests/bootstrap.sql`을 사용한다.
