// Same-origin, versioned snapshots generated from Rebrickable's official CSVs.
// Keep API-shaped responses so every page can use the same data source.
const BASE = (process.env.PUBLIC_URL || '').replace(/\/$/, '') + '/data/catalog/';
const PART_IMAGE_BASE = 'https://cdn.rebrickable.com/media/parts/';
const requests = new Map();

async function readJson(name, version) {
  const key = name + (version ? '?v=' + encodeURIComponent(version) : '');
  if (!requests.has(key)) {
    const promise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(BASE + name + '.json' + (version ? '?v=' + encodeURIComponent(version) : ''), {
          signal: controller.signal,
          cache: name === 'manifest' ? 'no-cache' : 'default',
        });
        if (!response.ok) {
          const error = new Error('Catalog request failed: ' + name + ' (HTTP ' + response.status + ')');
          error.response = { status: response.status };
          throw error;
        }
        return await response.json();
      } finally { clearTimeout(timer); }
    })().catch(error => { requests.delete(key); throw error; });
    requests.set(key, promise);
  }
  return requests.get(key);
}

export async function getCatalogMetadata() {
  const manifest = await readJson('manifest');
  if (manifest.schemaVersion !== 1) throw new Error('Unsupported catalog version');
  return manifest;
}

async function load(name) {
  const manifest = await getCatalogMetadata();
  return readJson(name, manifest.generatedAt);
}

export function catalogShard(value, count = 128) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash * 31) + value.charCodeAt(i)) >>> 0;
  return String(hash % count).padStart(3, '0');
}

function partImage(image) {
  return !image ? null : (/^https?:\/\//.test(image) ? image : PART_IMAGE_BASE + image);
}

function setObject(row) {
  return { set_num: row[0], name: row[1], year: row[2], theme_id: row[3], num_parts: row[4],
    set_img_url: row[5], set_url: 'https://rebrickable.com/sets/' + encodeURIComponent(row[0]) + '/' };
}

function partObject(row) {
  return { part_num: row[0], name: row[1], part_cat_id: row[2], part_material: row[3],
    part_img_url: partImage(row[4]), part_url: 'https://rebrickable.com/parts/' + encodeURIComponent(row[0]) + '/' };
}

function notFound(label) {
  const error = new Error(label + ' was not found in the official catalog');
  error.response = { status: 404 };
  return error;
}

export function paginateCatalog(values, page = 1, pageSize = 20) {
  const size = Math.max(1, Math.floor(Number(pageSize) || 20));
  const current = Math.max(1, Math.floor(Number(page) || 1));
  const start = (current - 1) * size;
  return { count: values.length, next: start + size < values.length ? current + 1 : null,
    previous: current > 1 ? current - 1 : null, results: values.slice(start, start + size) };
}

function sortObjects(values, ordering, fallback) {
  const fields = (ordering || fallback).split(',');
  return values.sort((left, right) => {
    for (const field of fields) {
      const descending = field[0] === '-';
      const key = descending ? field.slice(1) : field;
      const a = left[key], b = right[key];
      const difference = typeof a === 'number' && typeof b === 'number'
        ? a - b : String(a || '').localeCompare(String(b || ''), 'en', { numeric: true });
      if (difference) return descending ? -difference : difference;
    }
    return String(left.set_num || left.part_num || left.id).localeCompare(String(right.set_num || right.part_num || right.id), 'en', { numeric: true });
  });
}

function matchesSearch(query, ...values) {
  const words = String(query || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text = values.join(' ').toLocaleLowerCase();
  return words.every(word => text.includes(word));
}

async function themeFamily(id) {
  const themes = await load('themes');
  const ids = new Set([Number(id)]);
  let changed = true;
  while (changed) {
    changed = false;
    themes.forEach(theme => {
      if (theme.parent_id !== null && ids.has(theme.parent_id) && !ids.has(theme.id)) {
        ids.add(theme.id); changed = true;
      }
    });
  }
  return ids;
}

async function inventoryFor(setNum) {
  const manifest = await getCatalogMetadata();
  const shard = await load('inventories/' + catalogShard(setNum, manifest.shards));
  if (shard[setNum]) return shard[setNum];
  // A documented set can legitimately have no published inventory yet.
  const sets = await load('sets');
  if (!sets.some(row => row[0] === setNum)) throw notFound(setNum);
  return { parts: [], minifigs: [] };
}

export async function staticCatalogRequest(path, params = {}) {
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (segments[0] === 'themes') {
    const themes = await load('themes');
    return paginateCatalog(sortObjects(themes.slice(), params.ordering, 'name'), params.page, params.page_size);
  }
  if (segments[0] === 'part_categories' || segments[0] === 'colors') {
    const rows = await load(segments[0] === 'colors' ? 'colors' : 'categories');
    return paginateCatalog(sortObjects(rows.slice(), params.ordering, 'name'), params.page, params.page_size);
  }
  if (segments[0] === 'sets' && segments.length === 1) {
    const rows = await load('sets');
    const themes = params.theme_id ? await themeFamily(params.theme_id) : null;
    const values = rows.filter(row => matchesSearch(params.search, row[0], row[1]) &&
      (!themes || themes.has(row[3])) && (!params.min_year || row[2] >= Number(params.min_year)) &&
      (!params.max_year || row[2] <= Number(params.max_year))).map(setObject);
    return paginateCatalog(sortObjects(values, params.ordering, '-year'), params.page, params.page_size);
  }
  if (segments[0] === 'sets' && segments.length === 2) {
    const rows = await load('sets');
    const row = rows.find(value => value[0] === segments[1]);
    if (!row) throw notFound(segments[1]);
    return setObject(row);
  }
  if (segments[0] === 'sets' && segments[2] === 'parts') {
    const [inventory, parts, colors] = await Promise.all([inventoryFor(segments[1]), load('parts'), load('colors')]);
    const partIndex = new Map(parts.map(row => [row[0], row]));
    const colorIndex = new Map(colors.map(row => [row.id, row]));
    const page = paginateCatalog(inventory.parts, params.page, params.page_size);
    page.results = page.results.map((row, index) => ({ id: segments[1] + '-' + params.page + '-' + index,
      part: { ...partObject(partIndex.get(row[0]) || [row[0], row[0], null, null, row[4]]), part_img_url: partImage(row[4]) },
      color: colorIndex.get(row[1]) || { id: row[1], name: 'Unknown', rgb: '999999', is_trans: false },
      quantity: row[2], is_spare: Boolean(row[3]) }));
    return page;
  }
  if (segments[0] === 'sets' && segments[2] === 'minifigs') {
    const [inventory, minifigs] = await Promise.all([inventoryFor(segments[1]), load('minifigs')]);
    const values = inventory.minifigs.map(row => {
      const fig = minifigs[row[0]] || [row[0], 0, null];
      return { set_num: row[0], set_name: fig[0], quantity: row[1], num_parts: fig[1], set_img_url: fig[2] };
    });
    return paginateCatalog(values, params.page, params.page_size || 1000);
  }
  if (segments[0] === 'parts' && segments.length === 1) {
    const rows = await load('parts');
    const values = rows.filter(row => matchesSearch(params.search, row[0], row[1]) &&
      (!params.part_cat_id || row[2] === Number(params.part_cat_id))).map(partObject);
    return paginateCatalog(sortObjects(values, params.ordering, 'name'), params.page, params.page_size);
  }
  if (segments[0] === 'parts' && segments.length === 2) {
    const rows = await load('parts');
    const row = rows.find(value => value[0] === segments[1]);
    if (!row) throw notFound(segments[1]);
    return partObject(row);
  }
  if (segments[0] === 'parts' && segments[2] === 'colors') {
    const manifest = await getCatalogMetadata();
    const [shard, colors] = await Promise.all([
      load('part-colors/' + catalogShard(segments[1], manifest.shards)), load('colors'),
    ]);
    if (!shard[segments[1]]) {
      const parts = await load('parts');
      if (!parts.some(row => row[0] === segments[1])) throw notFound(segments[1]);
    }
    const colorIndex = new Map(colors.map(row => [row.id, row]));
    const values = (shard[segments[1]] || []).map(row => {
      const color = colorIndex.get(row[0]) || { name: 'Unknown', rgb: '999999', is_trans: false };
      return { color_id: row[0], color_name: color.name, color_rgb: color.rgb, color_is_trans: color.is_trans,
        part_img_url: partImage(row[1]), num_sets: row[2], num_set_parts: row[3], elements: row[4] };
    });
    return paginateCatalog(values, params.page, params.page_size || 1000);
  }
  throw new Error('Unsupported catalog endpoint: ' + path);
}
