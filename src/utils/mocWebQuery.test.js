import { buildMocWebQuery, getMocWebSearchUrl, isMocSearchEngineId, normalizeMocWebQuery } from './mocWebQuery';
import { translateSearchQuery } from './searchDict';

test('normalizes numeric MOC aliases and Korean searches', function() {
  expect(normalizeMocWebQuery(' 206123 ')).toBe('MOC-206123');
  expect(normalizeMocWebQuery('moc 206123')).toBe('MOC-206123');
  expect(normalizeMocWebQuery('moc_206123')).toBe('MOC-206123');
  expect(normalizeMocWebQuery('스타워즈')).toBe('Star Wars');
  expect(normalizeMocWebQuery('성')).toBe('Castle');
  expect(normalizeMocWebQuery('castle')).toBe('castle');
});

test('MOC keywords never inherit retail set-number aliases', function() {
  expect(normalizeMocWebQuery('타이타닉')).toBe('Titanic');
  expect(normalizeMocWebQuery('해적선')).toBe('Pirate Ship');
  expect(normalizeMocWebQuery('타이타닉 성')).toBe('Titanic Castle');
  expect(normalizeMocWebQuery('용마성')).not.toBe('MOC-6082');
  expect(translateSearchQuery('타이타닉')).toBe('10294');
  expect(translateSearchQuery('해적선')).toBe('10365');
});

test('keeps web queries and fallback links restricted to the MOC path', function() {
  const query = buildMocWebQuery('site:another.example castle');
  expect(query).toBe('site:rebrickable.com/mocs/MOC- castle');
  expect(buildMocWebQuery(query)).toBe(query);
  const url = new URL(getMocWebSearchUrl('206123'));
  expect(url.origin).toBe('https://www.google.com');
  expect(url.searchParams.get('q')).toBe('site:rebrickable.com/mocs/MOC- MOC-206123');
});

test('requires a real configured engine ID instead of a sample placeholder', function() {
  expect(isMocSearchEngineId('55592c50c117a426a')).toBe(true);
  expect(isMocSearchEngineId('')).toBe(false);
  expect(isMocSearchEngineId('YOUR_ENGINE_ID')).toBe(false);
  expect(isMocSearchEngineId('example_engine')).toBe(false);
  expect(isMocSearchEngineId('123456')).toBe(false);
  expect(isMocSearchEngineId('https://cse.google.com')).toBe(false);
});
