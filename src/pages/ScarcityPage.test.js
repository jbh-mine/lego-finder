import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams } from 'react-router-dom';
import ScarcityPage from './ScarcityPage';
import { getSetDetail, searchSets } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { MARKET_SERVER_KEY } from '../utils/marketApi';

jest.mock('../utils/api', () => ({ getSetDetail: jest.fn(), searchSets: jest.fn() }));
jest.mock('react-router-dom', () => ({
  useSearchParams: jest.fn(),
  Link: ({ to, children }) => require('react').createElement('a', { href: to }, children),
}));
jest.mock('../contexts/LanguageContext', () => ({ useLanguage: jest.fn() }));
jest.mock('recharts', () => {
  const React = require('react');
  const Wrapper = ({ children }) => React.createElement('div', null, children);
  const Nothing = () => null;
  return { ResponsiveContainer: Wrapper, LineChart: Wrapper, ComposedChart: Wrapper,
    Line: Nothing, Area: Nothing, XAxis: Nothing, YAxis: Nothing, CartesianGrid: Nothing, Tooltip: Nothing, Legend: Nothing };
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(MARKET_SERVER_KEY, '');
  useLanguage.mockReturnValue({ lang: 'ko' });
  getSetDetail.mockImplementation(async setNum => ({ set_num: setNum, name: 'Product ' + setNum, year: 2022, num_parts: 4514 }));
  searchSets.mockResolvedValue({ count: 0, results: [] });
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-16T06:00:00Z'));
});
const originalFetch = global.fetch;
afterEach(() => { jest.restoreAllMocks(); global.fetch = originalFetch; });
function open(url = '/scarcity') {
  useSearchParams.mockReturnValue([new URL(url, 'https://example.test').searchParams, jest.fn()]);
  return render(<ScarcityPage />);
}

test('verified transaction median, latest trade, asking quote, formula and zero-growth scenario are distinct', async () => {
  open('/scarcity?setNum=10305');
  await screen.findByRole('heading', { name: 'Product 10305-1' });
  expect(screen.getAllByText('₩550,000').length).toBeGreaterThan(0);
  expect(screen.getAllByText('₩535,000').length).toBeGreaterThan(0);
  expect(screen.getByText('₩565,000')).toBeInTheDocument();
  expect(screen.getByText('+5.8%')).toBeInTheDocument();
  expect(screen.getByText('53 / 100')).toBeInTheDocument();
  expect(screen.getByText('자동 추정을 제공할 수 없습니다.')).toBeInTheDocument();
  expect(screen.getByText('날짜가 확인된 공개 거래 표본 4건 / 2일')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '출처에서 현재 값 확인' })).toHaveAttribute('href', 'https://kream.co.kr/products/72708');
  expect(screen.getByLabelText('가정 연성장률 (%)')).toHaveValue(0);
  expect(screen.queryByText(/테마 평균|Grade/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('가정 연성장률 (%)'), { target: { value: '10' } });
  expect(screen.getAllByText('₩732,050').length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText('예상 판매 수수료율 (%)'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('예상 보관·배송 등 고정비 (원)'), { target: { value: '10000' } });
  expect(screen.getByText('₩685,448')).toBeInTheDocument();
});

test('a product without verified transactions shows missing data instead of synthetic prices or a D grade', async () => {
  open('/scarcity?setNum=10182');
  await screen.findByRole('heading', { name: 'Product 10182-1' });
  expect(screen.getByText(/이 제품의 확인된 거래 관측값이 없습니다/)).toBeInTheDocument();
  expect(screen.queryByLabelText('가정 연성장률 (%)')).not.toBeInTheDocument();
  expect(screen.queryByText(/시뮬레이션|Grade/)).not.toBeInTheDocument();
});

test('old trades and USD conversion remain clearly labeled and cannot create a premium index', async () => {
  open('/scarcity?setNum=75159');
  await screen.findByRole('heading', { name: 'Product 75159-1' });
  expect(screen.getByText(/최신 공개 체결이 119일 전입니다/)).toBeInTheDocument();
  expect(screen.getByText('USD 환산 참고값')).toBeInTheDocument();
  expect(screen.getByText(/USD \$500/)).toBeInTheDocument();
  expect(screen.queryByText(/\d+ \/ 100/)).not.toBeInTheDocument();
  expect(screen.getAllByText('₩1,265,000').length).toBeGreaterThan(0);
});

test('all failed catalog requests show an error rather than a successful empty search', async () => {
  searchSets.mockRejectedValue(new Error('Network unavailable'));
  open();
  fireEvent.change(screen.getByRole('textbox', { name: /제품 번호 또는 제품명/ }), { target: { value: 'Castle' } });
  fireEvent.click(screen.getByRole('button', { name: '검색' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('제품 정보를 확인하지 못했습니다.');
  expect(screen.queryByText('검색 결과가 없습니다.')).not.toBeInTheDocument();
});

test('English UI explains the evidence, missing forecast and editable scenario', async () => {
  useLanguage.mockReturnValue({ lang: 'en' });
  open('/scarcity?setNum=10305');
  await screen.findByRole('heading', { name: 'Product 10305-1' });
  expect(screen.getByRole('heading', { name: 'Scarcity · Market Price Evidence' })).toBeInTheDocument();
  expect(screen.getByText('Median of 5 public trades')).toBeInTheDocument();
  expect(screen.getByText('An automatic estimate is unavailable.')).toBeInTheDocument();
  expect(screen.getByLabelText('Assumed annual growth (%)')).toHaveValue(0);
});

function liveFixture(setNum = '10182-1', overrides = {}) {
  return { schemaVersion: 1, status: 'fresh', query: { setNum, provider: 'bricklink', condition: 'N', country: 'GLOBAL', currency: 'KRW' },
    observedAt: '2026-10-16T05:40:00Z', expiresAt: '2026-10-16T06:40:00Z', retryAfterSeconds: 0,
    sourceUrl: 'https://www.bricklink.com/v2/catalog/catalogitem.page?S=' + setNum,
    current: { value: 200000, basis: 'recent-30d-median', sampleCount: 1, min: 200000, max: 200000, latestPrice: 200000, latestTradeAt: '2026-10-15T00:00:00Z', sixMonthAverage: 190000, sixMonthQuantityAverage: 191000, sixMonthLots: 10, sixMonthUnits: 20, lowestAskingPrice: 210000, askingLots: 3 },
    trades: [{ rowKey: 'a:0', price: 200000, date: '2026-10-15T00:00:00Z', datePrecision: 'timestamp', quantity: 1, sellerCountry: 'US' }],
    history: [{ date: '2026-10-16', observedAt: '2026-10-16T05:40:00Z', price: 200000, basis: 'recent-30d-median', sampleCount: 1, currency: 'KRW', condition: 'N', country: 'GLOBAL', source: 'BrickLink' }],
    quality: { historyKind: 'daily-market-observations' }, refresh: { state: 'ok', nextRefreshAt: '2026-10-16T05:50:00Z' }, ...overrides };
}
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data, headers: { get: () => null } });
test('a catalog product outside the seven snapshots queries the configured server and discloses observation progress', async () => {
  localStorage.setItem(MARKET_SERVER_KEY, 'https://market.example.com');
  global.fetch = jest.fn().mockResolvedValue(response(liveFixture()));
  open('/scarcity?setNum=10182');
  expect(await screen.findByText('최근 30일 공개 주문 행 1건의 중앙값')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('https://market.example.com/v1/market/10182-1?condition=N&country=GLOBAL&currency=KRW', expect.anything());
  expect(screen.getByText('일별 관측 1개 / 월별 중앙값 1개월 / 0일')).toBeInTheDocument();
  expect(screen.getByText('₩190,000')).toBeInTheDocument();
  expect(screen.getByText(/date_ordered는 주문 생성 시각/)).toBeInTheDocument();
  expect(screen.getByText(/BrickLink가 승인하거나 보증하지 않습니다/)).toBeInTheDocument();
  expect(screen.queryByText(/\d+ \/ 100/)).not.toBeInTheDocument();
  expect(screen.getByLabelText('가정 연성장률 (%)')).toHaveValue(0);
});
test('provider authentication failure offers a separately labeled snapshot, never an automatic scope fallback', async () => {
  localStorage.setItem(MARKET_SERVER_KEY, 'https://market.example.com');
  global.fetch = jest.fn().mockResolvedValue(response({ schemaVersion: 1, error: { code: 'PROVIDER_AUTH' }, retryAfterSeconds: 900 }, 503));
  open('/scarcity?setNum=10305');
  expect(await screen.findByRole('alert')).toHaveTextContent('등록된 서버 IP가 거부');
  expect(screen.queryByText('₩550,000')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '별도 KREAM 저장 예시 보기' }));
  expect(screen.getAllByText('₩550,000').length).toBeGreaterThan(0);
  expect(screen.getByText('저장된 KREAM 거래 예시')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('판매자 국가 범위'), { target: { value: 'KR' } });
  await waitFor(() => expect(global.fetch.mock.calls.some(([url]) => url.includes('country=KR'))).toBe(true));
  expect(screen.queryByText('₩550,000')).not.toBeInTheDocument();
});
test('no recent sales differs from an unknown set and retains separate guide values without a scenario', async () => {
  localStorage.setItem(MARKET_SERVER_KEY, 'https://market.example.com');
  global.fetch = jest.fn().mockResolvedValue(response(liveFixture('10182-1', { status: 'no-sales', current: { ...liveFixture().current, value: null, basis: null, sampleCount: 0 }, history: [] })));
  open('/scarcity?setNum=10182');
  expect(await screen.findByText(/최근 30일 공개 주문 표본이 없습니다/)).toBeInTheDocument();
  expect(screen.getByText('₩190,000')).toBeInTheDocument();
  expect(screen.queryByLabelText('가정 연성장률 (%)')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
test('stale success explains provider error and keeps automatic estimates blocked', async () => {
  localStorage.setItem(MARKET_SERVER_KEY, 'https://market.example.com');
  global.fetch = jest.fn().mockResolvedValue(response(liveFixture('10182-1', { status: 'stale', refresh: { state: 'failed', errorCode: 'PROVIDER_AUTH', nextRefreshAt: '2026-10-16T06:15:00Z' } })));
  open('/scarcity?setNum=10182');
  expect(await screen.findByText(/등록된 서버 IP가 거부/)).toBeInTheDocument();
  expect(screen.getByText(/유효기간이 지난 저장값입니다/)).toBeInTheDocument();
  expect(screen.getByText('자동 추정을 제공할 수 없습니다.')).toBeInTheDocument();
});
