import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSearchParams } from 'react-router-dom';
import ScarcityPage from './ScarcityPage';
import { getSetDetail, searchSets } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

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
  useLanguage.mockReturnValue({ lang: 'ko' });
  getSetDetail.mockImplementation(async setNum => ({ set_num: setNum, name: 'Product ' + setNum, year: 2022, num_parts: 4514 }));
  searchSets.mockResolvedValue({ count: 0, results: [] });
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-16T06:00:00Z'));
});
afterEach(() => { jest.restoreAllMocks(); });
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
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Castle' } });
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
