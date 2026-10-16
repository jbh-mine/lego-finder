import { enhanceMocResultImage, getMocResultImageCandidates, getOfficialMocImageUrl, getMocResultUrl } from './mocSearchImages';

const resultUrl = 'https://rebrickable.com/mocs/MOC-271961/designer/titanic/';
const photo = 'https://cdn.rebrickable.com/media/mocs/moc-271961.jpg';
const thumbnail = 'https://encrypted-tbn0.gstatic.com/images?q=official-thumbnail';
// Shape captured from the live Search Element callback for a card that had
// no default Google preview: the result URL is a Google tracking wrapper.
const liveTitanic = {
  url: 'https://www.google.com/url?client=internal-element-cse&cx=55592c50c117a426a&q=https%3A%2F%2Frebrickable.com%2Fmocs%2FMOC-271961%2FKonor_142%2Frms-titanic-1900%2F&sa=U',
  richSnippet: { metatags: {
    ogImage: 'https://cdn.rebrickable.com/media/thumbs/mocs/moc-271961.jpg/1000x800.jpg',
    twitterImageSrc: 'https://cdn.rebrickable.com/media/thumbs/mocs/moc-271961.jpg/1000x800.jpg',
    ogUrl: '/mocs/MOC-271961/Konor_142/rms-titanic-1900/', ogTitle: 'RMS Titanic 1:900',
  } },
};

function card() {
  const element = document.createElement('div');
  element.innerHTML = '<div class="gs-webResult gs-result"><div class="gsc-thumbnail-inside"><a class="gs-title">Titanic</a></div><div class="gs-snippet">Original Google snippet</div></div>';
  return element;
}

test('the actual Google callback wrapper and metatags recover the missing Titanic photo', function() {
  expect(getMocResultUrl(liveTitanic)).toBe('https://rebrickable.com/mocs/MOC-271961/Konor_142/rms-titanic-1900/');
  expect(getMocResultImageCandidates(liveTitanic)).toEqual([liveTitanic.richSnippet.metatags.ogImage, photo]);
  const element = card();
  const title = element.querySelector('.gs-title');
  title.href = liveTitanic.url;
  enhanceMocResultImage(element, liveTitanic);
  expect(element.querySelector('.moc-web-result-image').src).toBe(liveTitanic.richSnippet.metatags.ogImage);
  expect(title.href).toBe(liveTitanic.url);
});

test('only known HTTPS Google result wrappers targeting an exact Rebrickable MOC are unwrapped', function() {
  expect(getMocResultUrl({ url: 'https://www.google.com/url?' + new URLSearchParams({ url: resultUrl }) })).toBe(resultUrl);
  expect(getMocResultUrl({ url: 'https://attacker.test/url?' + new URLSearchParams({ q: resultUrl }) })).toBeNull();
  expect(getMocResultUrl({ url: 'https://www.google.com/url?' + new URLSearchParams({ q: 'https://example.test/mocs/MOC-271961/' }) })).toBeNull();
  expect(getMocResultUrl({ url: 'https://www.google.com/search?' + new URLSearchParams({ q: resultUrl }) })).toBeNull();
  expect(getMocResultUrl({ url: 'https://www.google.com/url?' + new URLSearchParams({ q: 'javascript:alert(1)' }) })).toBeNull();
});

test('uses image metadata from this result with object/array and camel/snake variants', function() {
  const result = { url: resultUrl, thumbnailImage: { url: thumbnail }, richSnippet: {
    cseImage: [{ src: photo }], cse_thumbnail: { src: thumbnail }, metatags: [{ 'og:image': photo, twitterImage: 'https://bricksafe.com/files/designer/titanic.jpg' }],
  } };
  expect(getMocResultImageCandidates(result)).toEqual([thumbnail, photo, 'https://bricksafe.com/files/designer/titanic.jpg']);
  expect(getMocResultImageCandidates({ url: resultUrl, richSnippet: [{ cse_image: { src: photo } }, { metatags: { ogImage: photo } }] })).toEqual([photo]);
});

test('rejects unsafe URLs, site decoration, and a different explicitly named MOC', function() {
  const result = { url: resultUrl, richSnippet: { cseImage: [
    { src: 'javascript:alert(1)' }, { src: 'data:image/png;base64,other' }, { src: 'https://user:password@example.test/image.jpg' },
    { src: 'https://cdn.rebrickable.com/media/mocs/moc-46281.jpg' }, { src: 'https://rebrickable.com/static/img/rebrickable-logo.png' },
    { src: photo },
  ] } };
  expect(getMocResultImageCandidates(result)).toEqual([photo]);
  expect(getMocResultImageCandidates({ url: 'https://example.test/mocs/MOC-271961/', thumbnailImage: { url: photo } })).toEqual([]);
});

test('fills a card without a Google thumbnail using its structured photo and preserves its content', function() {
  const element = card();
  const title = element.querySelector('.gs-title');
  const snippet = element.querySelector('.gs-snippet');
  enhanceMocResultImage(element, { url: resultUrl, richSnippet: { cseImage: { src: photo } } });
  const image = element.querySelector('.moc-web-result-image');
  expect(image.src).toBe(photo);
  expect(image.alt).toBe('Photo of MOC-271961');
  expect(image.referrerPolicy).toBe('no-referrer');
  expect(image.parentElement.nextElementSibling).toBe(title.parentElement);
  expect(element.contains(title)).toBe(true);
  expect(element.contains(snippet)).toBe(true);
});

test('keeps an existing Google thumbnail and only uses same-result fallback after errors', function() {
  const element = card();
  const box = document.createElement('div');
  box.className = 'gs-image-box';
  const image = document.createElement('img');
  image.className = 'gs-image'; image.src = thumbnail;
  box.appendChild(image); element.querySelector('.gs-webResult').prepend(box);
  enhanceMocResultImage(element, { url: resultUrl, richSnippet: { cseImage: { src: photo } } });
  expect(element.querySelector('img')).toBe(image);
  expect(image.src).toBe(thumbnail);
  expect(element.querySelector('.moc-web-result-media')).toBeNull();
  image.dispatchEvent(new Event('error'));
  expect(image.src).toBe(photo);
  image.dispatchEvent(new Event('error'));
  expect(box.hidden).toBe(true);
  expect(element.querySelector('[data-moc-image-status="failed"]')).toHaveTextContent('could not be loaded');
  image.dispatchEvent(new Event('error'));
  expect(image.src).toBe(photo);
});

test('reports missing metadata honestly and all failed candidates stop without a fake image', function() {
  const element = card();
  const result = { url: resultUrl };
  enhanceMocResultImage(element, result, { missing: 'Google이 이 작품의 사진을 제공하지 않았습니다.' });
  expect(element.querySelector('img').src).toBe(photo);
  element.querySelector('img').dispatchEvent(new Event('error'));
  expect(element.querySelector('[data-moc-image-status="missing"]')).toHaveTextContent('Google이 이 작품의 사진을 제공하지 않았습니다.');
  expect(element.querySelector('img')).toBeNull();
  enhanceMocResultImage(element, { url: resultUrl, thumbnailImage: { url: thumbnail }, richSnippet: { cseImage: { src: photo } } });
  const image = element.querySelector('img');
  image.dispatchEvent(new Event('error'));
  expect(image.src).toBe(photo);
  image.dispatchEvent(new Event('error'));
  expect(element.querySelector('img')).toBeNull();
  expect(element.querySelector('[data-moc-image-status="failed"]')).toBeTruthy();
});

test('the exact MOC official sitemap image is the final fallback after supplied metadata', function() {
  expect(getOfficialMocImageUrl({ url: resultUrl })).toBe(photo);
  expect(getOfficialMocImageUrl({ url: 'https://rebrickable.com/mocs/MOC-0581/' })).toBe('https://cdn.rebrickable.com/media/mocs/moc-581.jpg');
  expect(getOfficialMocImageUrl({ url: 'https://example.test/mocs/MOC-271961/' })).toBeNull();
  expect(getOfficialMocImageUrl({ url: 'https://rebrickable.com/mocs/MOC-0/' })).toBeNull();
  expect(getMocResultImageCandidates({ url: resultUrl, richSnippet: { cseImage: { src: 'https://bricksafe.com/files/designer/titanic.jpg' } } })).toEqual(['https://bricksafe.com/files/designer/titanic.jpg', photo]);
  expect(getMocResultImageCandidates({ url: resultUrl })).toEqual([photo]);
  expect(getMocResultImageCandidates({ url: resultUrl, richSnippet: [null, { cseImage: [null, {}] }] })).toEqual([photo]);
});

test('reused Google result nodes are enhanced again after their inner markup is replaced', function() {
  const element = card();
  const result = { url: resultUrl };
  enhanceMocResultImage(element, result);
  const first = element.querySelector('img');
  element.querySelector('.moc-web-result-media').remove();
  enhanceMocResultImage(element, result);
  expect(element.querySelector('img')).not.toBe(first);
  expect(element.querySelector('img').src).toBe(photo);
  expect(element.querySelectorAll('.moc-web-result-media')).toHaveLength(1);
});

test('repeated rendering is idempotent and an earlier Google image failure is recovered', async function() {
  const element = card();
  const image = document.createElement('img');
  image.className = 'gs-image'; image.src = thumbnail;
  Object.defineProperty(image, 'complete', { value: true });
  Object.defineProperty(image, 'naturalWidth', { value: 0 });
  element.querySelector('.gs-webResult').prepend(image);
  const result = { url: resultUrl, thumbnailImage: { url: thumbnail }, richSnippet: { cseImage: [{ src: photo }] } };
  enhanceMocResultImage(element, result);
  enhanceMocResultImage(element, result);
  await Promise.resolve();
  expect(image.src).toBe(photo);
  expect(element.querySelectorAll('img')).toHaveLength(1);
  image.dispatchEvent(new Event('error'));
  expect(element.querySelectorAll('.moc-web-result-media')).toHaveLength(1);
});
