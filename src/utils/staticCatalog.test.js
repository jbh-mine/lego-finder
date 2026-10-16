import fs from 'fs';
import path from 'path';
import { staticCatalogRequest, getCatalogMetadata, paginateCatalog } from './staticCatalog';
import { searchSets, getSetDetail, getSetParts, getSetMinifigs, searchParts, getPartColors, getColors } from './api';
import axios from 'axios';

jest.mock('axios');
jest.mock('../config/proxyConfig', () => ({ REBRICKABLE_PROXY: '' }));

const catalogDirectory = path.join(process.cwd(), 'public', 'data', 'catalog');

beforeEach(() => {
  global.fetch = jest.fn(async url => {
    const parsed = new URL(url, 'https://example.test');
    const filename = parsed.pathname.split('/data/catalog/')[1];
    if (!filename || !filename.endsWith('.json')) throw new Error('Malformed catalog URL: ' + url);
    const file = path.join(catalogDirectory, filename);
    if (!fs.existsSync(file)) return { ok: false, status: 404 };
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) };
  });
});

test('the published official snapshot includes complete catalogs and full-result queries', async () => {
  const metadata = await getCatalogMetadata();
  const sets = await searchSets('', 1, 100000);
  expect(metadata.counts.sets).toBeGreaterThan(28000);
  expect(metadata.counts.parts).toBeGreaterThan(64000);
  expect(metadata.counts.inventoryRows).toBeGreaterThan(1400000);
  expect(sets.results).toHaveLength(metadata.counts.sets);
  expect(sets.count).toBe(metadata.counts.sets);
  expect(sets.next).toBeNull();
  expect(axios.get).not.toHaveBeenCalled();
});

test('set search, detail, inventory pagination, and minifigures work without public proxies', async () => {
  const search = await searchSets('10278');
  expect(search.results.some(set => set.set_num === '10278-1')).toBe(true);
  const detail = await getSetDetail('10278-1');
  expect(detail.name).toBe('Police Station');
  expect(detail.num_parts).toBe(2923);
  const [first, second, minifigs] = await Promise.all([
    getSetParts('10278-1', 1, 50), getSetParts('10278-1', 2, 50), getSetMinifigs('10278-1'),
  ]);
  expect(first.count).toBeGreaterThan(500);
  expect(first.results).toHaveLength(50);
  expect(first.next).toBe(2);
  expect(second.previous).toBe(1);
  expect(second.results).not.toEqual(first.results);
  expect(first.results[0].part.part_img_url).toMatch(/^https:\/\/cdn.rebrickable.com\//);
  expect(first.results[0].color.name).toBeTruthy();
  expect(minifigs.results.reduce((total, fig) => total + fig.quantity, 0)).toBe(5);
  expect(minifigs.results.every(fig => fig.set_name && fig.set_img_url)).toBe(true);
});

test('parent themes include descendants while year and search filters remain conjunctive', async () => {
  const themes = await staticCatalogRequest('/themes/', { page_size: 1000 });
  const starWars = themes.results.find(theme => theme.name === 'Star Wars' && theme.parent_id === null);
  expect(starWars).toBeTruthy();
  const childThemeIds = new Set(themes.results.filter(theme => theme.parent_id === starWars.id).map(theme => theme.id));
  const sets = await staticCatalogRequest('/sets/', {
    theme_id: starWars.id, min_year: 2020, max_year: 2026, search: 'Star', page_size: 100000, ordering: '-num_parts',
  });
  expect(sets.count).toBeGreaterThan(20);
  expect(sets.results.some(set => childThemeIds.has(set.theme_id))).toBe(true);
  expect(sets.results.every(set => set.year >= 2020 && set.year <= 2026 && /star/i.test(set.name))).toBe(true);
  expect(sets.results[0].num_parts).toBeGreaterThanOrEqual(sets.results[1].num_parts);
});

test('part detail colors preserve images, exact RGB, element IDs, and category filters', async () => {
  const parts = await searchParts('3001', 1, 1000);
  const brick = parts.results.find(part => part.part_num === '3001');
  expect(brick.name).toMatch(/Brick 2 x 4/i);
  const filtered = await searchParts('brick', 1, 100000, brick.part_cat_id);
  expect(filtered.count).toBeGreaterThan(100);
  expect(filtered.results.every(part => part.part_cat_id === brick.part_cat_id)).toBe(true);
  const [available, allColors] = await Promise.all([getPartColors('3001'), getColors()]);
  expect(allColors.count).toBeGreaterThan(200);
  const black = available.results.find(color => color.color_id === 0);
  expect(black.color_name).toBe('Black');
  expect(black.color_rgb).toBe('05131D');
  expect(black.num_sets).toBeGreaterThan(100);
  expect(black.part_img_url).toMatch(/^https:\/\/cdn.rebrickable.com\//);
  expect(black.elements.length).toBeGreaterThan(0);
  // Police Station's printed minifigure torso appears in a separate figure
  // inventory, but its containing-set count must include the parent sets.
  const torso = await getPartColors('973c27h01pr4792');
  expect(torso.results.find(color => color.color_id === 15).num_sets).toBeGreaterThan(0);
});

test('unknown identifiers produce 404 instead of fabricated records', async () => {
  await expect(getSetDetail('invalid-set')).rejects.toMatchObject({ response: { status: 404 } });
  await expect(getPartColors('invalid-part')).rejects.toMatchObject({ response: { status: 404 } });
  const search = await searchSets('does-not-exist-xyz');
  expect(search).toMatchObject({ count: 0, results: [] });
  expect(paginateCatalog([1, 2, 3], 2, 2)).toEqual({ count: 3, previous: 1, next: null, results: [3] });
});

test('a failed catalog download surfaces its error and remains retryable', async () => {
  global.fetch.mockImplementationOnce(async () => ({ ok: false, status: 503 }));
  await expect(staticCatalogRequest('/part_categories/', { page_size: 1000 }))
    .rejects.toMatchObject({ response: { status: 503 } });
  const retry = await staticCatalogRequest('/part_categories/', { page_size: 1000 });
  expect(retry.count).toBeGreaterThan(70);
});
