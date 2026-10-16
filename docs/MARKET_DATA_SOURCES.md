# 시세 데이터 출처와 해석 기준

검증일: 2026-10-16. 이 문서는 공식 문서로 확인한 공급원 범위와 LEGO Finder의 운영 정책을 구분한다. 인증된 가격 응답은 운영자 자격증명과 등록 IP를 연결한 뒤 별도로 검증해야 한다. 키가 없는 상태를 실제 시세나 거래 0건으로 표시하지 않는다.

## BrickLink Store API

### 등록과 인증

- [API 등록](https://www.bricklink.com/v2/api/register_consumer.page)은 로그인이 필요하다. [현행 API 약관](https://www.bricklink.com/v3/terms_of_use_api.page)은 등록 판매자의 API 등록을 명시하므로 구매 회원만으로 발급 가능하다고 보장하지 않는다.
- 운영자 소유의 consumer key, consumer secret, access token, token secret 네 값이 필요하다. 서버의 **실제 고정 outbound 공인 IP**를 등록하며 IP마다 토큰과 시크릿이 발급된다. GitHub Pages의 IP나 방문자 IP를 등록하는 구조가 아니다.
- 액세스 토큰에는 만료일이 없으며 유출된 시크릿은 재발급한다. 자격증명은 서버에만 보관한다. 브라우저 번들, 저장소, 로그, 공개 응답에 넣지 않는다. [공식 시작 안내](https://www.bricklink.com/v3/api.page)
- 서명은 OAuth 1.0 방식의 HMAC-SHA1이다. RFC3986 인코딩, 요청마다 다른 nonce, 초 단위 timestamp와 일반 쿼리 매개변수를 포함한 서명이 필요하다. [공식 인증 안내](https://www.bricklink.com/v3/api.page?page=auth)
- 기본 한도는 일 5,000회다. 검색된 제품을 요청 시 조회하고 캐시하며 전체 카탈로그를 매번 순회하지 않는다. 상향 한도 문의처는 약관 §4.3의 `apisupport@bricklink.com`이다.

### 요청과 응답

```text
GET https://api.bricklink.com/api/store/v1/items/SET/{brickLinkItemNo}/price
    ?guide_type=sold|stock
    &new_or_used=N|U
    &currency_code=KRW
    [&country_code=KR]
```

`brickLinkItemNo`는 `21322-1`처럼 BrickLink의 정확한 카탈로그 식별자다. 변형 접미사를 무조건 제거하거나 임의로 추가하지 않고 응답의 `item.no`와 `item.type`을 확인한다. GLOBAL 조회는 `country_code`와 `region`을 모두 생략한다. [공식 메서드 문서](https://static.bricklink.com/alpha/default/api_wiki.html)

| 범위 | 주요 필드와 의미 |
| --- | --- |
| 응답 봉투 | `meta.code`, `meta.message`, `meta.description`, `data` |
| 공통 | `item.no`, `item.type`, `new_or_used`, `currency_code` |
| 요약 가격 | `min_price`, `max_price`, `avg_price`, `qty_avg_price`: 고정소수점 문자열. 마지막 값은 수량 가중 평균 |
| 수량 | sold의 `unit_quantity`는 판매 횟수, `total_quantity`는 판매 수량. stock에서는 재고 목록 수와 재고 수량 |
| sold 행 | `quantity`, `unit_price`, `seller_country_code`, `buyer_country_code`, `date_ordered` |
| stock 행 | `quantity`, `unit_price`, `shipping_available` |

`shipping_available`은 API 계정 프로필의 국가로 배송하는지 나타낸다. 문서의 타입 표기와 예시가 다르므로 예시의 boolean과 실제 응답을 확인한다. 과거 오타 필드 `qunatity` 대신 `quantity`를 우선한다. [공식 리소스 규격](https://www.bricklink.com/v3/api.page?page=resource-representations-catalog)

HTTP 상태만으로 성공을 판정하지 않는다. 2026-10-16 무인증 GET 검증에서는 **HTTP 200 안에 `meta.code: 401`, `BAD_OAUTH_REQUEST`**가 반환되었다. `meta.code`의 2xx 여부와 정상 `data` 구조까지 검사한다. 주요 오류는 400 매개변수/요청 오류, 401 OAuth 오류, 403 권한 없음, 404 제품 없음, 500 공급자 오류다. 인증 실패를 거래 없음으로 바꾸지 않는다. [공식 오류 규격](https://www.bricklink.com/v3/api.page?page=error-handling)

### 가격과 이력의 한계

- `sold`는 최근 6개월 판매 자료, `stock`은 현재 판매 중인 호가다. 호가와 판매 통계를 혼합하지 않는다. 행의 완전성, 누락 여부, 최대 행 수, 정렬과 페이지네이션은 문서가 보장하지 않으므로 **전체 거래 이력**이라고 표현하지 않는다.
- `date_ordered`는 ISO 8601 형식의 **주문 생성 시각**이다. 결제·배송·거래 완료 시각이 아니며 가격 행에는 그 상태를 입증하는 필드가 없다.
- 가격 행에는 고유 거래/주문 ID가 없다. 동일 행이 여러 번 보여도 다른 주문일 수 있다. 스냅샷 내 fingerprint와 ordinal은 익명 행을 표시하는 내부 식별 방식이며 공급자의 거래 ID가 아니다. 여러 조회의 겹치는 행을 새로운 거래로 누적하지 않는다.
- `N`은 플랫폼의 New 분류다. 세트에는 sealed/complete/incomplete 하위 상태가 따로 있고 Price Guide는 이를 제공하지 않는다. 따라서 `N`을 검증된 미개봉 완제품이라고 표시하지 않는다. [공식 상태 기준](https://www.bricklink.com/help.asp?helpID=102&viewType=shop)
- `country_code=KR`은 **판매자 상점의 위치** 필터다. 한국 구매자 거래나 한국 공식 판매가 필터가 아니다. KRW 요청도 해외 거래를 국내 거래로 바꾸지 않는다.
- KRW 값은 요청 통화로 표시한 가격이며 실제 원화 결제액을 뜻하지 않는다. 공식 통화 도움말은 stock에는 최신 환율, sold에는 주문의 최종 batch 시점 환율을 적용한다고 구분한다. API 행에는 원통화·환율·최종 batch 날짜가 없으므로 모든 과거 sold 값을 현재 환율로 재평가한 값이라고도 단정하지 않는다. `date_ordered`와 최종 batch 시점도 같다고 가정하지 않는다. [공식 통화 설명](https://www.bricklink.com/help.asp?helpID=436&q=prices)
- 메서드 문서는 VAT 제외 가격을 안내한다. 배송비·수수료·관세를 포함한 총비용 필드는 없다. 가격 비교와 사용자 비용 가정을 구분한다.

### 약관과 서비스 운영 정책

[API 약관](https://www.bricklink.com/v3/terms_of_use_api.page) §1.3.3은 서비스 제공에 필요한 합리적인 기간의 캐시/저장만 허용한다. §1.3.4는 웹사이트보다 제품 정보·이미지가 6시간, 기타 콘텐츠가 24시간 넘게 오래된 상태로 표시되는 것을 제한한다. **24시간 뒤 원본을 반드시 삭제하라는 명문 규정은 아니다.** §2.7의 필수 출처·비보증 고지와 연락처·이용약관·개인정보 정책 요건도 확인한다.

LEGO Finder는 이를 바탕으로 다음의 별도 보수적 운영 정책을 둔다.

- 가격 안내 자료를 제품 설명·이미지와 구분해 운영하며, 조회 TTL은 6시간, 원본 보관·노출 상한은 24시간으로 둔다. 6시간 이후 갱신에 실패하면 원래 조회 시각과 `stale` 상태를 붙인 참고 스냅샷만 표시하고 현재 시세·자동 전망으로 사용하지 않는다. 약관이 가격 자료를 6시간/24시간 중 어느 범주로 분류하는지 명시했다는 뜻은 아니며, 운영자는 더 짧은 노출 기간을 적용할 수 있다.
- 최근 6개월 주문 행은 조회 스냅샷의 익명 행으로 표시하고 영구 독립 거래 원장을 만들지 않는다.
- 장기 그래프는 **조회 시점의 최근 30일 가격 중앙값과 표본 수**를 서비스가 계산해 같은 조회 조건별 UTC 하루 한 점으로 저장한다. 기본 보관은 730일이며 설정 가능하다. 이것은 일별 관측 통계이며 그날 새로 발생한 거래 수나 독립 거래 이력이 아니다.
- 전망은 이 자체 일별 관측 통계를 월별 중앙값으로 집계하고 6개 월 구간·180일 등 모형 조건을 검사한 뒤 로그 선형 회귀의 참고 범위로 표시한다. 원본 주문일별 KRW 값을 확정 원화 결제 이력으로 가정해 직접 예측하지 않는다. 조건·통화·판매자 지역이 다른 시계열을 합치지 않는다.

약관에서 자체 파생 통계·예측을 전면 금지하는 문구는 확인되지 않았다. 반대로 파생 통계라는 이유만으로 저장·재배포 조건에서 자동 면제된다고 가정하지 않는다. 원본의 장기 축적·독립 데이터베이스 배포·재판매나 운영 범위를 변경할 때에는 공급자 조건을 다시 확인한다. 위 24시간 원본 삭제와 730일 자체 통계 보관은 **서비스의 정책**이며 공급자가 직접 지정한 숫자가 아니다.

## BrickEconomy 보조 공급원

[공식 API](https://www.brickeconomy.com/api-reference)는 `GET /api/v1/set/{setNo}?currency=KRW`를 제공한다. [개인 API 프로필](https://www.brickeconomy.com/my-api)의 `x-apikey`와 `Accept`, `User-Agent` 헤더가 필요하다. 키를 서버에만 보관한다. 표준 한도는 일 100회이며 UTC 자정에 초기화되고 일반 요청은 분당 30회 이내를 권고한다. 동일 제품·통화 응답은 24시간 캐시되어도 요청 한도는 차감된다.

| 필드 | 사용할 수 있는 의미 |
| --- | --- |
| `current_value_new`, `current_value_used` | 제공자의 현재 평가값. 소매 판매 중인 제품의 new 값은 시장가 또는 출시가일 수 있음 |
| `price_events_new` | 단종 제품의 최근 11개월 가격 이벤트/평가값. 개별 판매 체결 행이 아님 |
| `forecast_value_new_2_years`, `forecast_value_new_5_years` | 단종된 미개봉 신품에 대한 제공자의 2년·5년 추정치. 보장 수익이나 실측값이 아님 |

필드는 제품별로 누락될 수 있다. 3년 전망을 임의 생성하지 않으며, 반환 `currency`를 검증한다. 미지원 통화는 오류 없이 USD로 반환될 수 있다. 평가값·가격 이벤트를 BrickLink 주문 행이나 실제 체결 표본으로 혼합하지 않는다.

키 발급은 공개 재배포 허가의 대체가 아니다. API 사용 한도와 Premium 라이선스, [사이트 이용약관](https://www.brickeconomy.com/legal-terms-of-service)의 재게시 범위를 확인한 연결만 사용한다. 공개 API 문서만으로 모든 제품의 평가·이력·예측 제공이나 별도 공개 서비스의 재배포 권한을 보장하지 않는다.
