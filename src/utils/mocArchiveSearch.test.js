import { getMocArchiveSearchUrl } from './mocArchiveSearch';

test.each(['263530', 'moc 263530', 'MOC-263530'])('archive lookup normalizes identifier %s', function(query) {
  var url = new URL(getMocArchiveSearchUrl(query));
  expect(url.origin).toBe('https://www.moctracker.com');
  expect(url.pathname).toBe('/mocs');
  expect(url.searchParams.get('search')).toBe('MOC-263530');
});

test('archive lookup safely encodes punctuation and does not invent pagination parameters', function() {
  var url = new URL(getMocArchiveSearchUrl('castle & dragon #2'));
  expect(url.searchParams.get('search')).toBe('castle & dragon #2');
  expect(Array.from(url.searchParams.keys())).toEqual(['search']);
  expect(getMocArchiveSearchUrl('')).toBe('https://www.moctracker.com/mocs');
});
