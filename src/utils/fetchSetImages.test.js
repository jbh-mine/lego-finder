import { fetchSetImages, getStaticImageIds } from './fetchSetImages';
import legoImagesData from '../data/legoImages.json';
import bdpImagesData from '../data/bdpImages.json';

test('a gallery from the saved catalog works without public proxy requests', async function() {
  localStorage.clear();
  global.fetch = jest.fn();
  var setNum = Object.keys(legoImagesData.sets).find(function(num) { return legoImagesData.sets[num].length > 0; });
  var imageIds = getStaticImageIds(setNum);
  await expect(fetchSetImages(setNum)).resolves.toEqual(imageIds);
  expect(fetch).not.toHaveBeenCalled();
  imageIds.pop();
  expect(getStaticImageIds(setNum)).toEqual(legoImagesData.sets[setNum]);
  delete global.fetch;
});

test('returning visitors discard broken v2 gallery IDs and preserve their collection and wishlist', async function() {
  localStorage.clear();
  var collection = JSON.stringify([{ set_num: '910008-1', name: 'Modular Construction Site' }]);
  var wishlist = JSON.stringify([{ set_num: '910027-1', name: 'Mountain View Observatory' }]);
  localStorage.setItem('lego_collection', collection);
  localStorage.setItem('lego_wishlist', wishlist);
  localStorage.setItem('lego_set_images_cache', JSON.stringify({ '910008-1': [] }));
  localStorage.setItem('lego_set_images_cache_v2', JSON.stringify({
    '910008-1': { ids: ['118648', '118649'], t: Date.now() },
    '910027-1': { ids: ['118671', '118672'], t: Date.now() },
  }));
  global.fetch = jest.fn();

  // Re-import after seeding storage to reproduce an existing visitor loading
  // the new application bundle and running its one-time cache migration.
  jest.resetModules();
  var gallery = require('./fetchSetImages');
  expect(localStorage.getItem('lego_set_images_cache')).toBeNull();
  expect(localStorage.getItem('lego_set_images_cache_v2')).toBeNull();
  expect(localStorage.getItem('lego_collection')).toBe(collection);
  expect(localStorage.getItem('lego_wishlist')).toBe(wishlist);

  for (var setNum of ['910008-1', '910027-1']) {
    var expected = setNum === '910008-1' ? ['118648'] : ['118672'];
    expect(legoImagesData.sets[setNum]).toEqual(expected);
    expect(bdpImagesData.sets[setNum]).toEqual(expected);
    expect(gallery.getCachedSetImages(setNum)).toEqual(expected);
    await expect(gallery.fetchSetImages(setNum)).resolves.toEqual(expected);
  }
  expect(fetch).not.toHaveBeenCalled();
  delete global.fetch;
});

test('the new image cache remains usable during legacy cache cleanup', function() {
  localStorage.clear();
  localStorage.setItem('lego_set_images_cache_v3', JSON.stringify({
    '910008-1': { ids: ['118648'], t: Date.now() },
  }));
  jest.resetModules();
  var gallery = require('./fetchSetImages');
  expect(gallery.getCachedSetImages('910008-1')).toEqual(['118648']);
  expect(localStorage.getItem('lego_set_images_cache_v3')).not.toBeNull();
});
