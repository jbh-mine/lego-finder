import { createMocSearchRuntime, styleMocSearchCards } from './mocSearchElement';

const ENGINE_ID = '55592c50c117a426a';

beforeEach(function() {
  document.querySelectorAll('script[data-lego-moc-search]').forEach(function(script) { script.remove(); });
  delete window.__gcse;
  delete window.google;
});

afterEach(function() { jest.useRealTimers(); });

test('loads one official script and dispatches documented callbacks while preserving Google rendering', async function() {
  const runtime = createMocSearchRuntime({ window, document });
  const starting = jest.fn(function(name, query) { return query + ' MOC'; });
  const ready = jest.fn();
  const rendered = jest.fn();
  const unsubscribe = runtime.subscribe('mocs', { starting, ready, rendered });
  const first = runtime.load(ENGINE_ID);
  const second = runtime.load(ENGINE_ID);
  expect(first).toBe(second);
  const script = document.querySelector('script[data-lego-moc-search]');
  expect(script.src).toBe('https://cse.google.com/cse.js?cx=' + ENGINE_ID);
  expect(document.querySelectorAll('script[data-lego-moc-search]')).toHaveLength(1);
  const api = { render: jest.fn(), getElement: jest.fn() };
  window.google = { search: { cse: { element: api } } };
  window.__gcse.initializationCallback();
  await expect(first).resolves.toBe(api);
  expect(window.__gcse.searchCallbacks.web.starting('mocs', 'castle')).toBe('castle MOC');
  expect(window.__gcse.searchCallbacks.web.ready('mocs', 'castle', [], [], document.createElement('div'))).toBe(false);
  window.__gcse.searchCallbacks.web.rendered('mocs', 'castle', [], []);
  expect(ready).toHaveBeenCalledTimes(1);
  expect(rendered).toHaveBeenCalledTimes(1);
  ready.mockReturnValueOnce(true);
  expect(window.__gcse.searchCallbacks.web.ready('mocs', 'stale query', [], [], document.createElement('div'))).toBe(true);
  unsubscribe();
  window.__gcse.searchCallbacks.web.rendered('mocs', 'castle', [], []);
  expect(rendered).toHaveBeenCalledTimes(1);
});

test('a blocked script remains retryable and does not leave an indefinite pending load', async function() {
  const runtime = createMocSearchRuntime({ window, document });
  const request = runtime.load(ENGINE_ID);
  document.querySelector('script[data-lego-moc-search]').dispatchEvent(new Event('error'));
  await expect(request).rejects.toThrow('MOC_SEARCH_SCRIPT_FAILED');
  expect(document.querySelector('script[data-lego-moc-search]')).toBeNull();
  const retry = runtime.load(ENGINE_ID);
  window.google = { search: { cse: { element: { render: jest.fn(), getElement: jest.fn() } } } };
  window.__gcse.initializationCallback();
  await expect(retry).resolves.toBe(window.google.search.cse.element);
});

test('a script that never initializes reaches the load deadline', async function() {
  jest.useFakeTimers();
  const runtime = createMocSearchRuntime({ window, document, timeoutMs: 15000 });
  const request = runtime.load(ENGINE_ID);
  const assertion = expect(request).rejects.toThrow('MOC_SEARCH_LOAD_TIMEOUT');
  jest.advanceTimersByTime(15000);
  await assertion;
  expect(document.querySelector('script[data-lego-moc-search]')).toBeNull();
});

test('card styling uses official callback nodes and keeps unrelated branding and promotions intact', function() {
  const root = document.createElement('div');
  const attribution = document.createElement('p');
  attribution.textContent = 'Google attribution';
  const promotion = document.createElement('div');
  promotion.textContent = 'Promotion';
  const result = document.createElement('div');
  const title = document.createElement('a');
  title.href = 'https://rebrickable.com/mocs/MOC-206123/';
  title.textContent = 'Art Nouveau Market Street';
  result.appendChild(title);
  root.append(attribution, promotion, result);
  styleMocSearchCards([result], [{ url: title.href }]);
  expect(result).toHaveClass('moc-web-result-card');
  expect(root).toHaveClass('moc-web-result-grid');
  expect(result.querySelector('.moc-web-result-number')).toHaveTextContent('MOC-206123');
  expect(root.contains(attribution)).toBe(true);
  expect(root.contains(promotion)).toBe(true);
  expect(promotion).not.toHaveClass('moc-web-result-card');
  expect(title.href).toBe('https://rebrickable.com/mocs/MOC-206123/');
});
