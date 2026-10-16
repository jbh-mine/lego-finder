import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import MocsPage from './MocsPage';
import { searchMocs, getMocCatalogInfo } from '../utils/mocApi';

jest.mock('../utils/mocApi', function() { return {
  searchMocs: jest.fn(),
  getMocCatalogInfo: jest.fn(),
  getMocSearchUrl: function() { return 'https://rebrickable.com/mocs/'; }
}; });

beforeEach(function() {
  searchMocs.mockReset();
  getMocCatalogInfo.mockReturnValue({});
});
jest.mock('../contexts/LanguageContext', function() { return {
  useLanguage: function() { return { t: function(key) { return key; } }; }
}; });
jest.mock('react-router-dom', function() { return {
  Link: function(props) { return require('react').createElement('a', { href: props.to }, props.children); }
}; });

test('a slower previous search cannot replace the latest query results', async function() {
  var finishInitial;
  var finishSearch;
  searchMocs.mockImplementationOnce(function() { return new Promise(function(resolve) { finishInitial = resolve; }); });
  searchMocs.mockImplementationOnce(function() { return new Promise(function(resolve) { finishSearch = resolve; }); });
  render(React.createElement(MocsPage));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'castle' } });
  fireEvent.click(screen.getByRole('button', { name: 'searchBtn' }));
  await act(async function() {
    finishSearch({ results: [{ mocNum: 'MOC-118869', name: 'Medieval Castle Keep' }], total: 1, hasMore: false });
  });
  expect(screen.getByText('Medieval Castle Keep')).toBeTruthy();
  await act(async function() {
    finishInitial({ results: [{ mocNum: 'MOC-167364', name: 'Mini Cooper S R56' }], total: 1, hasMore: false });
  });
  expect(screen.queryByText('Mini Cooper S R56')).toBeNull();
  expect(screen.getByText('Medieval Castle Keep')).toBeTruthy();
});

test('official blog browsing labels review dates and hides unsupported rankings and unknown facts', async function() {
  getMocCatalogInfo.mockReturnValue({ scope: 'official-blog-reviews', sourceUrl: 'https://rebrickable.com/blog/rss/' });
  searchMocs.mockResolvedValue({
    results: [{ mocNum: 'MOC-206123', name: 'Art Nouveau Market Street', designer: 'SleeplessNight',
      reviewedAt: '2025-11-21T00:00:00.000Z', parts: null, year: null, likes: null }],
    total: 1, source: 'snapshot', hasMore: false,
  });
  render(React.createElement(MocsPage));
  expect(await screen.findByText('Art Nouveau Market Street')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'mocSort_reviewed' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'mocSort_hottest' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'mocSort_mostLiked' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'mocSort_mostParts' })).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.getByText('mocReviewedAt: 2025-11-21')).toBeTruthy();
  expect(screen.getByText('mocReviewSnapshotNotice')).toBeTruthy();
  expect(screen.queryByText(/numParts/)).toBeNull();
  expect(screen.queryByText('0')).toBeNull();
  expect(screen.getByRole('link', { name: 'mocSearchOriginal' })).toBeTruthy();
  expect(searchMocs).toHaveBeenCalledWith({ sort: '-reviewed', page: 1 });
});

test('loading more blog introductions appends the next saved page', async function() {
  getMocCatalogInfo.mockReturnValue({ scope: 'official-blog-reviews', sourceUrl: 'https://rebrickable.com/blog/rss/' });
  searchMocs.mockResolvedValueOnce({
    results: [{ mocNum: 'MOC-206123', name: 'Art Nouveau Market Street' }], total: 2, source: 'snapshot', hasMore: true,
  }).mockResolvedValueOnce({
    results: [{ mocNum: 'MOC-213404', name: 'MD003' }], total: 2, source: 'snapshot', hasMore: false,
  });
  render(React.createElement(MocsPage));
  await screen.findByText('Art Nouveau Market Street');
  fireEvent.click(screen.getByRole('button', { name: 'mocLoadMore' }));
  expect(await screen.findByText('MD003')).toBeTruthy();
  expect(screen.getByText('Art Nouveau Market Street')).toBeTruthy();
  expect(searchMocs).toHaveBeenLastCalledWith({ q: '', theme: '', sort: '-reviewed', page: 2 });
  expect(screen.queryByRole('button', { name: 'mocLoadMore' })).toBeNull();
});
