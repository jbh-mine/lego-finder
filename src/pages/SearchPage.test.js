import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'react-router-dom';
import { getThemes } from '../utils/api';
import { collectSetSearch } from '../utils/setSearch';
import SearchPage from './SearchPage';

jest.mock('react-router-dom', function() { return { useSearchParams: jest.fn() }; });
jest.mock('../utils/api', function() { return { getThemes: jest.fn() }; });
jest.mock('../utils/setSearch', function() { return { collectSetSearch: jest.fn() }; });
jest.mock('../utils/translate', function() { return {
  getCachedTranslation: jest.fn(), translateName: jest.fn()
}; });
jest.mock('../utils/price', function() { return { getKrwPrice: jest.fn() }; });
jest.mock('../utils/collection', function() { return {
  getCollection: function() { return []; }, getWishlist: function() { return []; }
}; });
jest.mock('../contexts/LanguageContext', function() {
  var t = function(key) { return key; };
  return { useLanguage: function() { return { lang: 'en', t: t }; } };
});
jest.mock('../components/SetCard', function() {
  return function(props) {
    return require('react').createElement('div', {
      'data-testid': 'set-card', 'data-set-number': props.set.set_num
    }, props.set.name);
  };
});

var mockParams;
var mockSetParams;
var mockIntersectionCallback;
var originalObserver = global.IntersectionObserver;
var originalScrollTo = window.scrollTo;
var results;

beforeEach(function() {
  jest.clearAllMocks();
  sessionStorage.clear();
  mockParams = new URLSearchParams();
  mockSetParams = jest.fn();
  useSearchParams.mockImplementation(function() { return [mockParams, mockSetParams]; });
  getThemes.mockResolvedValue({ results: [{ id: 1, name: 'Castle' }], next: null });
  global.IntersectionObserver = jest.fn(function(callback) {
    mockIntersectionCallback = callback;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
  });
  window.scrollTo = jest.fn();
  results = Array.from({ length: 81 }, function(_, index) {
    return {
      set_num: String(10000 + index) + '-1', name: 'Search fixture ' + index,
      year: 2020, theme_id: 1, num_parts: index + 1,
    };
  });
  // The largest match is beyond the first two rendered pages.
  results[80].num_parts = 5000;
  collectSetSearch.mockResolvedValue({ results: results, count: results.length, primaryTheme: 1 });
});

afterAll(function() {
  global.IntersectionObserver = originalObserver;
  window.scrollTo = originalScrollTo;
});

async function submitSearch(query) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: query } });
  fireEvent.submit(screen.getByRole('textbox').closest('form'));
  await screen.findAllByTestId('set-card');
}

test('sorts the entire query while rendering forty matches at a time', async function() {
  render(React.createElement(SearchPage));
  await submitSearch('castle');
  expect(screen.getAllByTestId('set-card')).toHaveLength(40);
  expect(screen.queryByText('Search fixture 80')).toBeNull();

  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'parts_desc' } });
  expect(screen.getAllByTestId('set-card')).toHaveLength(40);
  expect(screen.getAllByTestId('set-card')[0]).toHaveTextContent('Search fixture 80');
  act(function() { mockIntersectionCallback([{ isIntersecting: true }]); });
  await waitFor(function() { expect(screen.getAllByTestId('set-card')).toHaveLength(80); });
  expect(collectSetSearch).toHaveBeenCalledTimes(1);

  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'parts_asc' } });
  await waitFor(function() { expect(screen.getAllByTestId('set-card')).toHaveLength(40); });
  expect(screen.getAllByTestId('set-card')[0]).toHaveTextContent('Search fixture 0');
});

test('filters the complete query, persists filter URLs, and resets the rendered page', async function() {
  render(React.createElement(SearchPage));
  await submitSearch('castle');
  fireEvent.click(screen.getByRole('button', { name: /filterToggleLabel/ }));
  fireEvent.change(screen.getAllByPlaceholderText('filterMin')[0], { target: { value: '5000' } });
  expect(screen.getAllByTestId('set-card')).toHaveLength(1);
  expect(screen.getByTestId('set-card')).toHaveTextContent('Search fixture 80');
  await waitFor(function() {
    expect(mockSetParams).toHaveBeenLastCalledWith({ q: 'castle', pmin: '5000' }, { replace: true });
  });
  fireEvent.click(screen.getAllByRole('button', { name: /↺ reset/ })[0]);
  await waitFor(function() { expect(screen.getAllByTestId('set-card')).toHaveLength(40); });
  expect(mockSetParams).toHaveBeenLastCalledWith({ q: 'castle' }, { replace: true });
});

test('loads a shared URL with its query, sort, and filters', async function() {
  mockParams = new URLSearchParams('q=castle&sort=parts_desc&pmin=5000');
  render(React.createElement(SearchPage));
  expect(await screen.findByTestId('set-card')).toHaveTextContent('Search fixture 80');
  expect(screen.getByRole('textbox')).toHaveValue('castle');
  expect(screen.getByRole('combobox')).toHaveValue('parts_desc');
  expect(collectSetSearch).toHaveBeenCalledWith('castle', { 1: 'Castle' });
});

test('a changed URL query loads the corresponding results on the same page', async function() {
  mockParams = new URLSearchParams('q=castle');
  var view = render(React.createElement(SearchPage));
  await screen.findAllByTestId('set-card');
  collectSetSearch.mockResolvedValueOnce({
    results: [{ set_num: '60051-1', name: 'High-speed Passenger Train', num_parts: 610, year: 2014, theme_id: 1 }],
    count: 1, primaryTheme: null,
  });
  mockParams = new URLSearchParams('q=train&sort=parts_desc');
  view.rerender(React.createElement(SearchPage));
  expect(await screen.findByText('High-speed Passenger Train')).toBeTruthy();
  expect(screen.queryByText('Search fixture 0')).toBeNull();
  expect(screen.getByRole('textbox')).toHaveValue('train');
  expect(collectSetSearch).toHaveBeenLastCalledWith('train', { 1: 'Castle' });
});

test('history restores filters and sort for the same query without fetching it again', async function() {
  mockParams = new URLSearchParams('q=castle');
  var view = render(React.createElement(SearchPage));
  await screen.findAllByTestId('set-card');
  mockParams = new URLSearchParams('q=castle&sort=parts_desc&pmin=5000');
  view.rerender(React.createElement(SearchPage));
  await waitFor(function() { expect(screen.getAllByTestId('set-card')).toHaveLength(1); });
  expect(screen.getByTestId('set-card')).toHaveTextContent('Search fixture 80');
  expect(screen.getByRole('combobox')).toHaveValue('parts_desc');
  expect(collectSetSearch).toHaveBeenCalledTimes(1);
});

test('history back to the blank search URL clears the previous query', async function() {
  mockParams = new URLSearchParams('q=castle');
  var view = render(React.createElement(SearchPage));
  await screen.findAllByTestId('set-card');
  mockParams = new URLSearchParams();
  view.rerender(React.createElement(SearchPage));
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.queryAllByTestId('set-card')).toHaveLength(0);
  expect(screen.getByText('searchEmpty')).toBeTruthy();
});

test('reset clears saved results and filters', async function() {
  mockParams = new URLSearchParams('q=castle&pmin=5000');
  render(React.createElement(SearchPage));
  await screen.findByTestId('set-card');
  expect(sessionStorage.getItem('lego_search_state')).not.toBeNull();
  act(function() { window.dispatchEvent(new Event('resetSearch')); });
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.queryAllByTestId('set-card')).toHaveLength(0);
  expect(screen.getByText('searchEmpty')).toBeTruthy();
  expect(sessionStorage.getItem('lego_search_state')).toBeNull();
  expect(mockSetParams).toHaveBeenLastCalledWith({}, { replace: true });
});

test('reset cancels an in-flight search so a late response cannot restore it', async function() {
  var finishSearch;
  collectSetSearch.mockImplementationOnce(function() {
    return new Promise(function(resolve) { finishSearch = resolve; });
  });
  render(React.createElement(SearchPage));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'castle' } });
  fireEvent.submit(screen.getByRole('textbox').closest('form'));
  expect(screen.getByRole('button', { name: 'searching' })).toBeDisabled();
  act(function() { window.dispatchEvent(new Event('resetSearch')); });
  expect(screen.getByRole('button', { name: 'searchBtn' })).toBeEnabled();
  await act(async function() { finishSearch({ results: results, count: 81, primaryTheme: 1 }); });
  expect(screen.queryAllByTestId('set-card')).toHaveLength(0);
  expect(screen.getByText('searchEmpty')).toBeTruthy();
  expect(sessionStorage.getItem('lego_search_state')).toBeNull();
});
