import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MocWebSearch from './MocWebSearch';
import { mocSearchRuntime } from '../utils/mocSearchElement';

jest.mock('../utils/mocSearchElement', function() { return {
  mocSearchRuntime: { load: jest.fn(), subscribe: jest.fn() }, styleMocSearchCards: jest.fn(),
}; });
jest.mock('../contexts/LanguageContext', function() {
  const t = function(key) { return key; };
  return { useLanguage: function() { return { lang: 'en', t }; } };
});

const ENGINE_ID = '55592c50c117a426a';
let callbacks;
let control;
let api;

beforeEach(function() {
  jest.clearAllMocks();
  control = { execute: jest.fn() };
  api = { render: jest.fn(), getElement: jest.fn(function() { return control; }) };
  mocSearchRuntime.subscribe.mockImplementation(function(name, handler) { callbacks = handler; return jest.fn(); });
  mocSearchRuntime.load.mockResolvedValue(api);
});

afterEach(function() { jest.useRealTimers(); });

test('missing configuration never loads a placeholder engine and offers an external search', function() {
  render(React.createElement(MocWebSearch, { searchEngineId: 'YOUR_ENGINE_ID', query: 'castle' }));
  expect(mocSearchRuntime.load).not.toHaveBeenCalled();
  expect(screen.getByText(/not configured yet/)).toBeTruthy();
  expect(new URL(screen.getByRole('link').href).searchParams.get('q')).toBe('site:rebrickable.com/mocs/MOC- castle');
});

test('editing synchronizes a parent without searching each keystroke and submit normalizes a MOC number', async function() {
  const onQueryChange = jest.fn();
  render(React.createElement(MocWebSearch, { searchEngineId: ENGINE_ID, onQueryChange }));
  await waitFor(function() { expect(api.render).toHaveBeenCalled(); });
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'moc 206123' } });
  expect(onQueryChange).toHaveBeenCalledWith('moc 206123');
  expect(control.execute).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole('searchbox').closest('form'));
  expect(control.execute).toHaveBeenCalledWith('site:rebrickable.com/mocs/MOC- MOC-206123');
  expect(api.render.mock.calls[0][0]).toMatchObject({ tag: 'searchresults-only', attributes: { as_sitesearch: 'rebrickable.com', linkTarget: '_blank', filter: '1', enableImageSearch: false } });
  act(function() {
    callbacks.ready('mocs', 'MOC-206123', [], [{ url: 'https://rebrickable.com/mocs/MOC-206123/' }]);
    callbacks.rendered('mocs', 'MOC-206123', [], []);
  });
  expect(screen.queryByText(/Searching MOCs/)).toBeNull();
});

test('script failure is visible, preserves the fallback query, and can be retried', async function() {
  mocSearchRuntime.load.mockRejectedValueOnce(new Error('Blocked by browser'));
  render(React.createElement(MocWebSearch, { searchEngineId: ENGINE_ID, query: '스타워즈' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load Google search');
  expect(new URL(screen.getByRole('link').href).searchParams.get('q')).toBe('site:rebrickable.com/mocs/MOC- Star Wars');
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(function() { expect(control.execute).toHaveBeenCalledWith('site:rebrickable.com/mocs/MOC- Star Wars'); });
});

test('a search with no callback reaches an error instead of loading forever', async function() {
  jest.useFakeTimers();
  render(React.createElement(MocWebSearch, { searchEngineId: ENGINE_ID, query: 'castle' }));
  await act(async function() { await Promise.resolve(); });
  expect(control.execute).toHaveBeenCalledTimes(1);
  act(function() { jest.advanceTimersByTime(15000); });
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to load Google search');
  expect(screen.getByRole('link')).toBeTruthy();
});

test('submitting a new query after a script failure retries initialization', async function() {
  mocSearchRuntime.load.mockRejectedValueOnce(new Error('Temporarily blocked'));
  render(React.createElement(MocWebSearch, { searchEngineId: ENGINE_ID, query: 'castle' }));
  await screen.findByRole('alert');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '해적선' } });
  fireEvent.submit(screen.getByRole('searchbox').closest('form'));
  await waitFor(function() { expect(control.execute).toHaveBeenCalledWith('site:rebrickable.com/mocs/MOC- Pirate Ship'); });
});

test('a verified empty result callback stops loading and leaves Google rendering in place', async function() {
  render(React.createElement(MocWebSearch, { searchEngineId: ENGINE_ID, query: 'castle' }));
  await waitFor(function() { expect(control.execute).toHaveBeenCalled(); });
  act(function() {
    callbacks.ready('mocs', 'castle', [], []);
    callbacks.rendered('mocs', 'castle', [], []);
  });
  expect(screen.getByText(/No matching MOC on this search page/)).toBeTruthy();
  expect(screen.queryByText(/Searching MOCs/)).toBeNull();
});

test('a timed-out search cannot finish a newer query with its late callbacks', async function() {
  jest.useFakeTimers();
  render(React.createElement(MocWebSearch, { searchEngineId: ENGINE_ID, query: 'castle' }));
  await act(async function() { await Promise.resolve(); });
  act(function() { jest.advanceTimersByTime(15000); });
  expect(screen.getByRole('alert')).toBeTruthy();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'train' } });
  fireEvent.submit(screen.getByRole('searchbox').closest('form'));
  expect(control.execute).toHaveBeenLastCalledWith('site:rebrickable.com/mocs/MOC- train');
  act(function() {
    expect(callbacks.ready('mocs', 'castle', [], [{ url: 'https://rebrickable.com/mocs/MOC-206123/' }])).toBe(true);
    callbacks.rendered('mocs', 'castle', [], []);
  });
  expect(screen.getByText('Searching MOCs indexed by Google.')).toBeTruthy();
  act(function() {
    expect(callbacks.ready('mocs', 'train', [], [])).toBe(false);
    callbacks.rendered('mocs', 'train', [], []);
  });
  expect(screen.getByText(/No matching MOC on this search page/)).toBeTruthy();
});
