import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import announcements from '../data/bdpUpcoming.json';
import images from '../data/fundingImages.json';
import { fundingImageUrl, getFundingGallery } from './fundingImages';

test('funding photos keep the GitHub Pages base and the recorded official fallback', function() {
  expect(fundingImageUrl('images/funding/photo.jpg', '/lego-finder/')).toBe('/lego-finder/images/funding/photo.jpg');
  expect(fundingImageUrl('/images/funding/photo.jpg', 'https://jbh-mine.github.io/lego-finder')).toBe('https://jbh-mine.github.io/lego-finder/images/funding/photo.jpg');
  var item = announcements.upcoming[0];
  var gallery = getFundingGallery(item, '/lego-finder');
  expect(gallery).toHaveLength(5);
  expect(gallery[0].src).toBe('/lego-finder/' + images.projects[item.id].images[0].path);
  expect(gallery[0].sourceUrl).toBe(images.projects[item.id].images[0].sourceUrl);
});

test('a reused announcement ID cannot display another official project gallery', function() {
  var item = Object.assign({}, announcements.upcoming[0], { brickLinkUrl: 'https://www.bricklink.com/v3/designer-program/another-project', galleryImages: ['https://example.test/correct.jpg'] });
  expect(getFundingGallery(item, '/lego-finder')).toEqual([{ src: 'https://example.test/correct.jpg', sourceUrl: 'https://example.test/correct.jpg' }]);
});

test('all five announcement projects have five distinct, intact official cached photos', function() {
  expect(Object.keys(images.projects)).toHaveLength(announcements.upcoming.length);
  expect(Number.isFinite(Date.parse(images.meta.retrievedAt))).toBe(true);
  announcements.upcoming.forEach(function(item) {
    var project = images.projects[item.id];
    expect(project.brickLinkUrl).toBe(item.brickLinkUrl);
    expect(project.nameEn).toBe(item.nameEn);
    expect(project.images).toHaveLength(5);
    expect(new Set(project.images.map(function(image) { return image.sourceUrl; })).size).toBe(5);
    project.images.forEach(function(image) {
      expect(new URL(image.sourceUrl).hostname).toBe('file.bricklink.info');
      expect(image.path).toMatch(/^images\/funding\/bdp-s8-\d+-\d+\.(?:jpg|png)$/);
      var bytes = fs.readFileSync(path.join(process.cwd(), 'public', image.path));
      expect(bytes.length).toBe(image.bytes);
      expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(image.sha256);
      expect(image.mimeType === 'image/png' ? bytes.subarray(0, 8).toString('hex') : bytes.subarray(0, 2).toString('hex')).toBe(image.mimeType === 'image/png' ? '89504e470d0a1a0a' : 'ffd8');
    });
  });
});
