import { fetchSetImages, getStaticImageIds, getSetGalleryImageUrl } from './fetchSetImages';
import legoImagesData from '../data/legoImages.json';
import bdpImagesData from '../data/bdpImages.json';
import galleryImageOverrides from '../data/setGalleryImageOverrides.json';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

test('the two verified photos resolve within the Pages base path and other galleries keep their URLs', function() {
  expect(getSetGalleryImageUrl('910008-1', '118648', '/lego-finder'))
    .toBe('/lego-finder/images/set-gallery/910008-1-118648.jpg');
  expect(getSetGalleryImageUrl('910027-1', '118672', '/lego-finder/'))
    .toBe('/lego-finder/images/set-gallery/910027-1-118672.jpg');
  expect(getSetGalleryImageUrl('910027-1', '118672', 'https://jbh-mine.github.io/lego-finder'))
    .toBe('https://jbh-mine.github.io/lego-finder/images/set-gallery/910027-1-118672.jpg');
  expect(getSetGalleryImageUrl('910008-1', '118648', ''))
    .toBe('/images/set-gallery/910008-1-118648.jpg');
  expect(getSetGalleryImageUrl('910002-1', '120712', '/lego-finder'))
    .toBe('https://cdn.rebrickable.com/media/thumbs/sets/910002-1/120712.jpg/1000x800p.jpg');
  expect(getSetGalleryImageUrl('910008-1', '118648', '/lego-finder').replace('/1000x800p.jpg', '/230x180p.jpg'))
    .toBe('/lego-finder/images/set-gallery/910008-1-118648.jpg');
});

test('cached gallery files match the recorded original JPEG bytes and source provenance', function() {
  expect(Object.keys(galleryImageOverrides.images)).toEqual(['910008-1/118648', '910027-1/118672']);
  Object.entries(galleryImageOverrides.images).forEach(function([key, image]) {
    var bytes = fs.readFileSync(path.join(process.cwd(), 'public', image.publicPath));
    expect(bytes.length).toBe(image.bytes);
    expect(bytes.slice(0, 3).toString('hex')).toBe('ffd8ff');
    expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(image.sha256);
    expect(image.sourceUrl).toBe('https://cdn.rebrickable.com/media/thumbs/sets/' + key + '.jpg/1000x800p.jpg');
    expect(image.contentType).toBe('image/jpeg');
  });
});
