import { getMocDetail, getMocSearchUrl, searchMocs } from './mocApi';

// Exercise the optional live scraper independently of the shipped review
// catalog, which deliberately works without network access.
jest.mock('../data/mocsStatic.json', function() { return { meta: {}, themes: [], views: {} }; });

beforeEach(function() {
  localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(function() {
  delete global.fetch;
});

test('failed MOC upstream requests report unavailable rather than zero matches', async function() {
  fetch.mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(searchMocs({ q: 'castle' })).rejects.toThrow('MOC_SOURCE_UNAVAILABLE');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(localStorage.getItem('lego_moc_cache_v3')).toBeNull();
});

test('unsupported successful HTML is not cached as an empty catalog', async function() {
  fetch.mockResolvedValue({ ok: true, text: async function() {
    return '<meta property="og:image" content="https://rebrickable.com/image.jpg">' + ' '.repeat(11000);
  } });
  await expect(searchMocs({ q: 'train' })).rejects.toThrow('MOC_SOURCE_UNAVAILABLE');
  expect(localStorage.getItem('lego_moc_cache_v3')).toBeNull();
});

test('a verified empty listing can return zero matches', async function() {
  fetch.mockResolvedValue({ ok: true, text: async function() {
    return '<meta property="og:image" content="https://rebrickable.com/image.jpg">Showing 0 of 0 unique MOCs' + ' '.repeat(11000);
  } });
  await expect(searchMocs({ q: 'no-such-moc' })).resolves.toMatchObject({ results: [], total: 0, hasMore: false });
});

test('the original-site search preserves filters and normalizes a MOC number', function() {
  var url = new URL(getMocSearchUrl({ q: 'moc 218010', theme: '155', sort: '-likes', page: 2 }));
  expect(url.searchParams.get('q')).toBe('MOC-218010');
  expect(url.searchParams.get('theme')).toBe('155');
  expect(url.searchParams.get('sort')).toBe('-likes');
  expect(url.searchParams.get('page')).toBe('2');
});

test('stale search data survives an upstream outage', async function() {
  var query = { q: 'MOC-218010' };
  var cached = { results: [{ mocNum: 'MOC-218010', name: '7-Eleven convenience store' }], total: 1 };
  localStorage.setItem('lego_moc_cache_v3', JSON.stringify({
    [getMocSearchUrl(query)]: { t: 1, data: cached }
  }));
  fetch.mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(searchMocs(query)).resolves.toEqual(cached);
});

test('invalid detail identifiers are rejected without requesting another site', async function() {
  await expect(getMocDetail('../sets/123')).resolves.toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

test('a stalled response body times out within the same five-second budget', async function() {
  jest.useFakeTimers();
  fetch.mockResolvedValue({ ok: true, text: function() { return new Promise(function() {}); } });
  var request = searchMocs({ q: 'stalled' });
  await Promise.resolve();
  jest.advanceTimersByTime(5000);
  await expect(request).rejects.toThrow('MOC_SOURCE_UNAVAILABLE');
  jest.useRealTimers();
});
