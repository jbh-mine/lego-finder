import mocsStatic from '../data/mocsStatic.json';
import { getMocCatalogInfo, searchMocs, getMocDetail, getMocSearchUrl } from './mocApi';

beforeEach(function() {
  localStorage.clear();
  global.fetch = jest.fn().mockRejectedValue(new Error('Network disabled'));
});

afterEach(function() { delete global.fetch; });

test('the entire official review catalog pages and searches without public proxies', async function() {
  var saved = mocsStatic.views.newest.results;
  var info = getMocCatalogInfo();
  expect(info.scope).toBe('official-blog-reviews');
  expect(info.count).toBe(saved.length);
  expect(saved.length).toBeGreaterThan(30);
  expect(info.sourceUrl).toBe('https://rebrickable.com/blog/rss/');
  var seen = [];
  var page = 1;
  var data;
  do {
    data = await searchMocs({ sort: '-reviewed', page: page++ });
    expect(data.source).toBe('snapshot');
    expect(data.total).toBe(saved.length);
    expect(data.results.length).toBeLessThanOrEqual(30);
    seen = seen.concat(data.results);
  } while (data.hasMore);
  expect(new Set(seen.map(function(moc) { return moc.mocNum; })).size).toBe(saved.length);
  expect(seen.map(function(moc) { return moc.reviewedAt; })).toEqual(
    saved.map(function(moc) { return moc.reviewedAt; }).sort().reverse()
  );
  var first = saved[0];
  var numericQuery = await searchMocs({ q: first.mocNum.replace('MOC-', ''), sort: '-reviewed' });
  expect(numericQuery.results.map(function(moc) { return moc.mocNum; })).toEqual([first.mocNum]);
  var byName = await searchMocs({ q: first.name, sort: '-reviewed' });
  expect(byName.results.some(function(moc) { return moc.mocNum === first.mocNum; })).toBe(true);
  var byDesigner = await searchMocs({ q: first.designer, sort: '-reviewed' });
  expect(byDesigner.results.some(function(moc) { return moc.mocNum === first.mocNum; })).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
});

test('saved detail works for early and late pages and includes verified original and review links', async function() {
  var saved = mocsStatic.views.newest.results;
  for (var moc of [saved[0], saved[saved.length - 1]]) {
    var detail = await getMocDetail(moc.mocNum);
    expect(detail).toMatchObject({ name: moc.name, reviewedAt: moc.reviewedAt, reviewUrl: moc.reviewUrl, source: 'snapshot' });
    expect(detail.canonicalUrl).toBe('https://rebrickable.com' + moc.href);
    expect(detail.parts).toBeNull();
    expect(detail.year).toBeNull();
    expect(detail.likes).toBeNull();
    expect(detail.image).toBe(moc.img);
  }
  await expect(getMocDetail('MOC-999999999')).resolves.toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

test('unknown counts do not produce fabricated rankings or numeric filter matches', async function() {
  await expect(searchMocs({ sort: '-likes' })).rejects.toThrow('MOC_SORT_UNAVAILABLE');
  await expect(searchMocs({ sort: '-num_parts' })).rejects.toThrow('MOC_SORT_UNAVAILABLE');
  await expect(searchMocs({ maxParts: 100 })).resolves.toMatchObject({ total: 0, results: [] });
  await expect(searchMocs({ maxYear: 2026 })).resolves.toMatchObject({ total: 0, results: [] });
  expect(new URL(getMocSearchUrl({ q: 'castle', sort: '-reviewed' })).searchParams.has('sort')).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});

test('an old cached live response cannot hide the review scope or provenance', async function() {
  var moc = mocsStatic.views.newest.results[0];
  localStorage.setItem('lego_moc_detail_cache', JSON.stringify({
    [moc.mocNum]: { t: Date.now(), data: { name: 'Old incomplete cache' } }
  }));
  var detail = await getMocDetail(moc.mocNum);
  expect(detail.name).toBe(moc.name);
  expect(detail.reviewUrl).toBe(moc.reviewUrl);
  expect(detail.catalog.scope).toBe('official-blog-reviews');
  expect(fetch).not.toHaveBeenCalled();
});
