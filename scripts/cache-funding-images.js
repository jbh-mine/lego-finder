#!/usr/bin/env node
// Cache photos observed on the public official BrickLink project galleries.
// Usage: node scripts/cache-funding-images.js <official-gallery-source.json>
// Refresh the recorded URLs: node scripts/cache-funding-images.js --refresh
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'src/data/fundingImages.json');
const source = process.argv[2] === '--refresh'
  ? JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))
  : JSON.parse(fs.readFileSync(path.resolve(process.argv[2] || '.catalog-cache/bdp-current-galleries.json'), 'utf8'));

function download(url) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== 'file.bricklink.info') {
    throw new Error('Only recorded official BrickLink image URLs are supported');
  }
  return new Promise((resolve, reject) => {
    const req = https.get(target, { headers: { Accept: 'image/*' } }, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error('HTTP ' + response.statusCode + ': ' + url)); return; }
      const mimeType = String(response.headers['content-type'] || '').split(';')[0];
      if (!['image/png', 'image/jpeg'].includes(mimeType)) { response.resume(); reject(new Error('Unexpected image type: ' + mimeType)); return; }
      const chunks = []; let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 12 * 1024 * 1024) { response.destroy(new Error('Image exceeds 12 MB')); return; }
        chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        const bytes = Buffer.concat(chunks);
        // The official CDN sometimes labels JPEG bytes as image/png. Keep
        // the actual format and extension rather than trusting that header.
        const actualType = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ? 'image/png' : bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg' : null;
        if (!actualType) { reject(new Error('Image signature mismatch: ' + url)); return; }
        resolve({ bytes, mimeType: actualType });
      });
    });
    req.setTimeout(30000, () => req.destroy(new Error('Image download timed out')));
    req.on('error', reject);
  });
}

async function main() {
  const result = { schemaVersion: 1, meta: { retrievedAt: new Date().toISOString(), source: 'Official BrickLink Designer Program project galleries', note: 'Images refreshed separately from the dated announcement text. Original project URLs and image URLs are retained for attribution.' }, projects: {} };
  const pendingFiles = [];
  fs.mkdirSync(path.join(ROOT, 'public/images/funding'), { recursive: true });
  for (const [id, project] of Object.entries(source.projects)) {
    if (!/^bdp-s\d+-\d+$/.test(id) || !project.brickLinkUrl.startsWith('https://www.bricklink.com/v3/designer-program/')) throw new Error('Invalid official project mapping');
    const photos = [];
    for (const [index, entry] of project.images.entries()) {
      const sourceUrl = typeof entry === 'string' ? entry : entry.sourceUrl;
      const image = await download(sourceUrl);
      const file = 'images/funding/' + id + '-' + String(index + 1).padStart(2, '0') + (image.mimeType === 'image/png' ? '.png' : '.jpg');
      pendingFiles.push({ file, bytes: image.bytes });
      photos.push({ path: file, sourceUrl, mimeType: image.mimeType, bytes: image.bytes.length, sha256: crypto.createHash('sha256').update(image.bytes).digest('hex') });
      console.log(id + ' photo ' + (index + 1) + ': ' + image.bytes.length + ' bytes');
    }
    result.projects[id] = { brickLinkUrl: project.brickLinkUrl, nameEn: project.nameEn, images: photos };
  }
  // A future expired source must not replace part of the working snapshot.
  // Publish files only after every recorded download has been validated.
  for (const pending of pendingFiles) fs.writeFileSync(path.join(ROOT, 'public', pending.file), pending.bytes);
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + '\n');
  console.log('Cached ' + Object.keys(result.projects).length + ' official project galleries.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
