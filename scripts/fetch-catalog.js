#!/usr/bin/env node
/*
 * Build a same-origin catalog from Rebrickable's official daily CSV downloads.
 * No API key, CORS proxy, or external server is needed by the published app.
 * Run: node scripts/fetch-catalog.js [--cached]
 * --cached is useful for reproducible/offline regeneration after a download.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, '.catalog-cache');
const OUTPUT = path.join(ROOT, 'public', 'data', 'catalog');
const CDN = 'https://cdn.rebrickable.com/media/downloads/';
const PART_IMAGE_BASE = 'https://cdn.rebrickable.com/media/parts/';
const SHARDS = 128;
const FILES = ['sets', 'themes', 'parts', 'colors', 'part_categories',
  'inventories', 'inventory_parts', 'inventory_minifigs', 'minifigs', 'elements'];

function shardFor(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash * 31) + value.charCodeAt(i)) >>> 0;
  return String(hash % SHARDS).padStart(3, '0');
}

function download(name) {
  const url = CDN + name + '.csv.gz';
  const destination = path.join(CACHE, name + '.csv.gz');
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'lego-finder-catalog/1.0' } }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(name + ': HTTP ' + response.statusCode));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          // Validate before replacing a previously usable download.
          zlib.gunzipSync(buffer);
          fs.writeFileSync(destination, buffer);
          resolve({ url, lastModified: response.headers['last-modified'] || null });
        } catch (error) { reject(error); }
      });
    });
    request.setTimeout(120000, () => request.destroy(new Error(name + ': download timed out')));
    request.on('error', reject);
  });
}

// RFC 4180 parsing, including commas, doubled quotes, and embedded newlines.
// Yield rows so the large inventory never needs a second full array in memory.
function* csvRows(text) {
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(value => value !== '')) yield row;
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error('Unterminated quoted CSV field');
  if (field || row.length) { row.push(field); yield row; }
}

function* readRows(name, requiredFields) {
  const file = path.join(CACHE, name + '.csv.gz');
  const text = zlib.gunzipSync(fs.readFileSync(file)).toString('utf8');
  const iterator = csvRows(text);
  const header = iterator.next().value;
  if (!header || requiredFields.some(field => !header.includes(field))) {
    throw new Error(name + ': missing expected CSV columns');
  }
  const indexes = requiredFields.map(field => header.indexOf(field));
  for (const row of iterator) {
    if (row.length !== header.length) throw new Error(name + ': malformed CSV record');
    yield indexes.map(index => row[index]);
  }
}

function write(name, value) {
  const destination = path.join(OUTPUT, name + '.json');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(value));
}

function compactImage(url) {
  return url.startsWith(PART_IMAGE_BASE) ? url.slice(PART_IMAGE_BASE.length) : url;
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const sources = {};
  const previousManifestFile = path.join(OUTPUT, 'manifest.json');
  const previousSources = fs.existsSync(previousManifestFile)
    ? JSON.parse(fs.readFileSync(previousManifestFile, 'utf8')).sources || {} : {};
  for (let start = 0; start < FILES.length; start += 3) {
    await Promise.all(FILES.slice(start, start + 3).map(async name => {
      sources[name] = process.argv.includes('--cached')
        ? previousSources[name] || { url: CDN + name + '.csv.gz', lastModified: null }
        : await download(name);
      console.log('Read official source:', name);
    }));
  }

  const sets = Array.from(readRows('sets', ['set_num', 'name', 'year', 'theme_id', 'num_parts', 'img_url']),
    row => [row[0], row[1], +row[2], +row[3], +row[4], row[5]]);
  const themes = Array.from(readRows('themes', ['id', 'name', 'parent_id']),
    row => ({ id: +row[0], name: row[1], parent_id: row[2] ? +row[2] : null }));
  const parts = Array.from(readRows('parts', ['part_num', 'name', 'part_cat_id', 'part_material']),
    row => [row[0], row[1], +row[2], row[3], '']);
  const partIndex = new Map(parts.map(row => [row[0], row]));
  const colors = Array.from(readRows('colors', ['id', 'name', 'rgb', 'is_trans']),
    row => ({ id: +row[0], name: row[1], rgb: row[2], is_trans: row[3] === 'True' }));
  const categories = Array.from(readRows('part_categories', ['id', 'name']),
    row => ({ id: +row[0], name: row[1] }));
  const minifigs = Object.fromEntries(Array.from(readRows('minifigs', ['fig_num', 'name', 'num_parts', 'img_url']),
    row => [row[0], [row[1], +row[2], row[3]]]));

  // The API serves the newest inventory version. Older versions would inflate
  // both the parts list and available-color counts, so discard them explicitly.
  const latest = new Map();
  for (const [id, version, setNum] of readRows('inventories', ['id', 'version', 'set_num'])) {
    const current = latest.get(setNum);
    if (!current || +version > current.version) latest.set(setNum, { id: +id, version: +version });
  }
  const inventoriesById = new Map();
  const inventoryShards = Array.from({ length: SHARDS }, () => ({}));
  for (const [setNum, inventory] of latest) {
    const value = { id: inventory.id, version: inventory.version, parts: [], minifigs: [] };
    inventoryShards[+shardFor(setNum)][setNum] = value;
    inventoriesById.set(inventory.id, { setNum, value });
  }

  // Minifigure inventories are separate CSV records. Associate their parts
  // with containing sets when computing part-color availability and quantities.
  const minifigParents = new Map();
  for (const [inventoryId, figNum, quantity] of readRows('inventory_minifigs', ['inventory_id', 'fig_num', 'quantity'])) {
    const inventory = inventoriesById.get(+inventoryId);
    if (!inventory) continue;
    inventory.value.minifigs.push([figNum, +quantity]);
    if (!inventory.setNum.startsWith('fig-')) {
      if (!minifigParents.has(figNum)) minifigParents.set(figNum, []);
      minifigParents.get(figNum).push({ inventoryId: +inventoryId, quantity: +quantity });
    }
  }

  const partColors = new Map();
  let inventoryRows = 0;
  for (const [inventoryId, partNum, colorId, quantity, spare, image] of readRows('inventory_parts',
    ['inventory_id', 'part_num', 'color_id', 'quantity', 'is_spare', 'img_url'])) {
    const inventory = inventoriesById.get(+inventoryId);
    if (!inventory) continue;
    const compact = compactImage(image);
    inventory.value.parts.push([partNum, +colorId, +quantity, spare === 'True' ? 1 : 0, compact]);
    inventoryRows++;
    const part = partIndex.get(partNum);
    if (part && !part[4] && compact) part[4] = compact;
    let byColor = partColors.get(partNum);
    if (!byColor) { byColor = new Map(); partColors.set(partNum, byColor); }
    let entry = byColor.get(+colorId);
    if (!entry) {
      entry = { image: compact, inventories: new Set(), quantity: 0, elements: [] };
      byColor.set(+colorId, entry);
    }
    if (!entry.image && compact) entry.image = compact;
    if (inventory.setNum.startsWith('fig-')) {
      for (const parent of minifigParents.get(inventory.setNum) || []) {
        entry.inventories.add(parent.inventoryId);
        entry.quantity += +quantity * parent.quantity;
      }
    } else {
      entry.inventories.add(+inventoryId);
      entry.quantity += +quantity;
    }
  }
  for (const [elementId, partNum, colorId] of readRows('elements', ['element_id', 'part_num', 'color_id'])) {
    let byColor = partColors.get(partNum);
    if (!byColor) { byColor = new Map(); partColors.set(partNum, byColor); }
    let entry = byColor.get(+colorId);
    if (!entry) {
      entry = { image: '', inventories: new Set(), quantity: 0, elements: [] };
      byColor.set(+colorId, entry);
    }
    entry.elements.push(elementId);
  }

  const colorShards = Array.from({ length: SHARDS }, () => ({}));
  for (const [partNum, byColor] of partColors) {
    colorShards[+shardFor(partNum)][partNum] = Array.from(byColor, ([colorId, entry]) =>
      [colorId, entry.image, entry.inventories.size, entry.quantity, entry.elements]);
  }
  write('sets', sets);
  write('themes', themes);
  write('parts', parts);
  write('colors', colors);
  write('categories', categories);
  write('minifigs', minifigs);
  for (let index = 0; index < SHARDS; index++) {
    const suffix = String(index).padStart(3, '0');
    write('inventories/' + suffix, inventoryShards[index]);
    write('part-colors/' + suffix, colorShards[index]);
  }
  // Write last, so a failed conversion cannot publish a successful manifest.
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: 'Rebrickable official daily CSV downloads',
    sourceUrl: 'https://rebrickable.com/downloads/',
    shards: SHARDS,
    counts: { sets: sets.length, themes: themes.length, parts: parts.length, colors: colors.length,
      categories: categories.length, minifigs: Object.keys(minifigs).length,
      inventories: latest.size, inventoryRows },
    sources,
  };
  write('manifest', manifest);
  console.log('Catalog published:', JSON.stringify(manifest.counts));
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { csvRows, shardFor };
