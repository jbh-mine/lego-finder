// Use Google's documented metadata for this exact result, then the exact MOC
// image path exposed by Rebrickable's official sitemap. No page scraping or
// keyword image search is performed.
// https://developers.google.com/custom-search/docs/element#result-properties
const bindings = new WeakMap();

export function getMocResultUrl(result) {
  try {
    let url = new URL(result.url);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    // Live Search Element results use Google's tracking wrapper, even though
    // the documentation's example shows a direct result URL. Decode only the
    // known /url wrapper's q/url parameter, without following any redirects.
    if (['www.google.com', 'google.com'].includes(url.hostname) && url.pathname === '/url') {
      url = new URL(url.searchParams.get('url') || url.searchParams.get('q'));
    }
    const match = url.pathname.match(/^\/mocs\/(MOC-\d+)(?:\/|$)/i);
    return url.protocol === 'https:' && !url.username && !url.password && url.hostname === 'rebrickable.com' && match ? url.href : null;
  } catch (error) { return null; }
}

export function getMocResultNumber(result) {
  const url = getMocResultUrl(result);
  return url ? new URL(url).pathname.match(/^\/mocs\/(MOC-\d+)(?:\/|$)/i)[1].toUpperCase() : null;
}

function imageUrl(value, result) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), getMocResultUrl(result));
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    // Reject known site decoration, and any URL explicitly naming a different
    // MOC. Other CDN/BrickSafe photos are associated by the callback result.
    if (/\/static\/|\/media\/users\/|favicon|rebrickable[-_]?logo|rebrickbot/i.test(url.pathname)) return null;
    const explicitMoc = decodeURIComponent(url.pathname).match(/MOC[-_](\d+)/i);
    if (explicitMoc && Number(explicitMoc[1]) !== Number(getMocResultNumber(result).slice(4))) return null;
    return url.href;
  } catch (error) { return null; }
}

function objects(value) {
  const entries = Array.isArray(value) ? value : [value];
  return entries.filter(function(entry) { return entry && typeof entry === 'object' && !Array.isArray(entry); });
}

export function getOfficialMocImageUrl(result) {
  const number = getMocResultNumber(result);
  const id = number && Number(number.slice(4));
  // Rebrickable's public sitemap pairs MOC page IDs with these image:loc
  // URLs: https://rebrickable.com/sitemap-current-mocs.xml
  // Use only this result's exact ID. An unavailable photo stops at a clear
  // placeholder; no alternate IDs or guessed image variants are requested.
  return Number.isSafeInteger(id) && id > 0 ? 'https://cdn.rebrickable.com/media/mocs/moc-' + id + '.jpg' : null;
}

export function getMocResultImageCandidates(result, options = {}) {
  if (!getMocResultNumber(result)) return [];
  const candidates = [];
  const add = function(value) {
    const url = imageUrl(value, result);
    if (url && !candidates.includes(url) && candidates.length < 8) candidates.push(url);
  };
  const addImages = function(value) {
    objects(value).forEach(function(image) { add(image.src || image.url || image.contentUrl || image.contenturl); });
  };
  addImages(result.thumbnailImage);
  const snippets = objects(result.richSnippet);
  ['cseimage', 'csethumbnail', 'metatags'].forEach(function(type) {
    snippets.forEach(function(snippet) {
      Object.keys(snippet).forEach(function(key) {
        if (key.toLowerCase().replace(/[^a-z]/g, '') !== type) return;
        if (type !== 'metatags') { addImages(snippet[key]); return; }
        objects(snippet[key]).forEach(function(tags) {
          Object.keys(tags).forEach(function(tag) {
            if (['ogimage', 'ogimagesecureurl', 'twitterimage', 'twitterimagesrc'].includes(tag.toLowerCase().replace(/[^a-z]/g, ''))) add(tags[tag]);
          });
        });
      });
    });
  });
  const official = options.includeOfficial === false ? null : getOfficialMocImageUrl(result);
  if (official && !candidates.includes(official)) {
    if (candidates.length === 8) candidates.pop();
    candidates.push(official);
  }
  return candidates;
}

export function enhanceMocResultImage(element, result, labels = {}) {
  const number = getMocResultNumber(result);
  if (!number) return;
  const copy = {
    alt: (labels.alt || 'Photo of {moc}').replace('{moc}', number),
    missing: labels.missing || 'No photo was provided in the search result, and the official creation photo could not be loaded.',
    failed: labels.failed || 'The photo for this creation could not be loaded.',
  };
  const candidates = getMocResultImageCandidates(result);
  let hadPhotoMetadata = getMocResultImageCandidates(result, { includeOfficial: false }).length > 0;
  const key = JSON.stringify([result.url, candidates, copy]);
  const previous = bindings.get(element);
  if (previous && previous.key === key && previous.isCurrent()) return;
  if (previous) previous.cleanup();
  const doc = element.ownerDocument;
  const content = element.querySelector('.gs-webResult') || element;
  let media;
  let disposed = false;
  let image = element.querySelector('.gs-image-box img.gs-image, img.gs-image');
  const existing = image;
  const box = existing && existing.closest('.gs-image-box');
  const wasHidden = existing && existing.hidden;
  const boxWasHidden = box && box.hidden;
  const makeMedia = function() {
    if (media) return media;
    media = doc.createElement('div');
    media.className = 'moc-web-result-media';
    const title = content.querySelector('.gsc-thumbnail-inside');
    content.insertBefore(media, title && title.parentElement === content ? title : content.firstChild);
    return media;
  };
  const showUnavailable = function(reason) {
    if (disposed) return;
    if (image) image.hidden = true;
    if (box) box.hidden = true;
    const placeholder = makeMedia();
    placeholder.dataset.mocImageStatus = reason;
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', copy[reason]);
    placeholder.textContent = copy[reason];
  };
  let index = 0;
  let invalidExisting = false;
  if (existing) {
    const original = imageUrl(existing.currentSrc || existing.getAttribute('src'), result);
    if (original) hadPhotoMetadata = true;
    if (original && !candidates.includes(original)) candidates.unshift(original);
    else if (original) candidates.splice(0, 0, candidates.splice(candidates.indexOf(original), 1)[0]);
    else invalidExisting = true;
  }
  const onError = function() {
    if (disposed) return;
    index++;
    if (index >= candidates.length) { showUnavailable(hadPhotoMetadata ? 'failed' : 'missing'); return; }
    image.hidden = false;
    if (box) box.hidden = false;
    image.src = candidates[index];
  };
  const onLoad = function() {
    if (disposed) return;
    if (media) media.dataset.mocImageStatus = 'loaded';
  };
  if (!candidates.length) showUnavailable('missing');
  else {
    if (!image) {
      image = doc.createElement('img');
      image.className = 'moc-web-result-image';
      image.alt = copy.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      makeMedia().appendChild(image);
      media.dataset.mocImageStatus = 'loading';
    }
    image.addEventListener('error', onError);
    image.addEventListener('load', onLoad);
    if (!existing || invalidExisting) image.src = candidates[0];
    else if (image.complete && image.naturalWidth === 0) {
      // The image may have failed before Google's rendered callback arrived.
      Promise.resolve().then(function() { if (!disposed && image.complete && image.naturalWidth === 0) onError(); });
    }
  }
  bindings.set(element, { key, isCurrent: function() { return media ? element.contains(media) : !!image && element.contains(image); }, cleanup: function() {
    disposed = true;
    if (image) { image.removeEventListener('error', onError); image.removeEventListener('load', onLoad); }
    if (existing) existing.hidden = wasHidden;
    if (box) box.hidden = boxWasHidden;
    if (media) media.remove();
  } });
}
