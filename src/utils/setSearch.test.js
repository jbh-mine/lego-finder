import { collectSetSearch } from './setSearch';

test('collects all matching pages before filtering and removes duplicate franchise hits', async () => {
  const old = { set_num: '10001-1', year: 2000 };
  const current = { set_num: '10002-1', year: 2026 };
  const api = {
    searchSets: jest.fn().mockResolvedValue({ results: [current, old] }),
    filterSets: jest.fn().mockResolvedValue({ results: [old] }),
  };
  const result = await collectSetSearch('Star Wars', { 158: 'Star Wars' }, api);
  expect(result.results).toEqual([current, old]);
  expect(result.count).toBe(2);
  expect(api.searchSets).toHaveBeenCalledWith('Star Wars', 1, 100000);
  expect(api.filterSets).toHaveBeenCalledWith({ themeId: '158', page: 1, pageSize: 100000 });
});

test('numeric aliases search the exact product without broad theme expansion', async () => {
  const api = { searchSets: jest.fn().mockResolvedValue({ results: [] }), filterSets: jest.fn() };
  await collectSetSearch('용마성', { 1: 'Castle' }, api);
  expect(api.searchSets).toHaveBeenCalledWith('6082', 1, 100000);
  expect(api.filterSets).not.toHaveBeenCalled();
});

test('data failure is reported instead of being presented as zero matches', async () => {
  const api = { searchSets: jest.fn().mockRejectedValue(new Error('Offline')), filterSets: jest.fn() };
  await expect(collectSetSearch('test', {}, api)).rejects.toThrow('Offline');
});
