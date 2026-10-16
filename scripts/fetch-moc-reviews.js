#!/usr/bin/env node
/*
 * Publish the MOCs explicitly identified in Rebrickable's official blog RSS.
 * This is a finite collection of reviewed designs, not the site's MOC index.
 * Only factual titles, IDs, dates, designer names, image URLs, and links are
 * retained. Unknown design dates, piece counts, and likes remain null.
 * Run: node scripts/fetch-moc-reviews.js [--cached]
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const FEED_URL = 'https://rebrickable.com/blog/rss/';
const ROOT = path.resolve(__dirname, '..');
const CACHE_FILE = path.join(ROOT, '.catalog-cache', 'rebrickable-blog.xml');
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'mocsStatic.json');

function decodeXml(value) {
  return String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function tag(xml, name) {
  const match = xml.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>'));
  return match ? decodeXml(match[1]).trim() : '';
}

function parseReviews(xml) {
  if (!/<rss\b/.test(xml) || !/<\/rss>\s*$/.test(xml)) throw new Error('Invalid official RSS response');
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  const seen = new Set();
  const results = [];
  for (const item of items) {
    const title = tag(item, 'title');
    const reviewUrl = tag(item, 'link');
    const identifier = (title + ' ' + reviewUrl).match(/\bMOC-(\d+)\b/i);
    if (!identifier) continue;
    const mocNum = 'MOC-' + identifier[1];
    if (seen.has(mocNum)) continue;
    const article = new URL(reviewUrl);
    if (article.origin !== 'https://rebrickable.com' || !article.pathname.startsWith('/blog/')) continue;
    const reviewed = new Date(tag(item, 'pubDate'));
    if (!Number.isFinite(reviewed.getTime())) throw new Error('Missing review publication date for ' + mocNum);
    const description = tag(item, 'description');
    const imageMatch = description.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
    const image = imageMatch ? new URL(imageMatch[1], FEED_URL) : null;
    const byDesigner = title.match(/\s+by\s+([^\n]+)$/i);
    const possessiveDesigner = title.match(/^(?:MOC[- ]?)?Review\s*[:–-]?\s*([\w.-]+)['’]s?\s+/i);
    const designer = byDesigner ? byDesigner[1].trim() : possessiveDesigner ? possessiveDesigner[1] : '';
    let name = title.replace(/^\uFEFF/, '').replace(/^(?:(?:Quick|Mini|Double)[ -])?(?:MOC[ -]?)?Review\s*[:–-]?\s*/i, '')
      .replace(/\bMOC-\d+\b\s*[:–-]?\s*/ig, '').trim();
    if (byDesigner) name = name.replace(/\s+by\s+[^\n]+$/i, '').trim();
    if (possessiveDesigner) name = name.replace(/^[\w.-]+['’]s?\s+/, '').trim();
    seen.add(mocNum);
    results.push({
      mocNum, name: name || title, img: image && image.protocol === 'https:' ? image.href : '',
      href: '/mocs/' + mocNum + '/', reviewUrl, reviewedAt: reviewed.toISOString(),
      designer, designerSlug: '', description: '', variant: null,
      parts: null, year: null, likes: null, theme: '',
    });
  }
  results.sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt));
  if (!results.length) throw new Error('Official RSS contains no explicitly identified MOC reviews');
  const updated = new Date(tag(xml, 'lastBuildDate'));
  if (!Number.isFinite(updated.getTime())) throw new Error('Missing official RSS build date');
  return { results, sourceLastUpdated: updated.toISOString(), feedItemCount: items.length };
}

function downloadFeed() {
  return new Promise((resolve, reject) => {
    const request = https.get(FEED_URL, { headers: { 'User-Agent': 'lego-finder-catalog/1.0', Accept: 'application/rss+xml, application/xml' } }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error('Official blog RSS returned HTTP ' + response.statusCode));
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('error', reject);
      response.on('end', () => resolve(body));
    });
    request.setTimeout(30000, () => request.destroy(new Error('Official blog RSS timed out')));
    request.on('error', reject);
  });
}

async function main({ cached = process.argv.includes('--cached') } = {}) {
  const xml = cached ? fs.readFileSync(CACHE_FILE, 'utf8') : await downloadFeed();
  const parsed = parseReviews(xml);
  const snapshot = {
    meta: {
      lastUpdated: new Date().toISOString(), scope: 'official-blog-reviews',
      source: 'Rebrickable official blog RSS', sourceUrl: FEED_URL,
      sourceLastUpdated: parsed.sourceLastUpdated, count: parsed.results.length,
      feedItemCount: parsed.feedItemCount,
      note: 'Only MOCs explicitly identified in official blog articles. Ordered by review publication date; not MOC release date. Piece counts, likes, design years and themes are unavailable in this feed.',
    },
    themes: [],
    views: { newest: { results: parsed.results, total: parsed.results.length } },
  };
  // Parse and validate before replacing a previously usable snapshot.
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  if (!cached) fs.writeFileSync(CACHE_FILE, xml);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2) + '\n');
  console.log('Saved official blog MOC reviews:', parsed.results.length,
    '(feed updated ' + parsed.sourceLastUpdated + ')');
  return snapshot;
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { main, parseReviews };
