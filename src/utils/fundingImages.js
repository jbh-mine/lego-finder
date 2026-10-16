import fundingImages from '../data/fundingImages.json';

export function fundingImageUrl(path, publicUrl) {
  if (/^https?:\/\//i.test(path)) return path;
  var base = publicUrl == null ? (process.env.PUBLIC_URL || '') : publicUrl;
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

export function getFundingGallery(item, publicUrl) {
  var project = fundingImages.projects[item.id];
  // The ID and official project URL must both agree: never reuse another
  // project's cached photos if an announcement entry is replaced later.
  if (project && project.brickLinkUrl === item.brickLinkUrl) {
    return project.images.map(function(image) {
      return { src: fundingImageUrl(image.path, publicUrl), sourceUrl: image.sourceUrl };
    });
  }
  var legacy = item.galleryImages && item.galleryImages.length ? item.galleryImages : (item.imageUrl ? [item.imageUrl] : []);
  return legacy.map(function(url) { return { src: fundingImageUrl(url, publicUrl), sourceUrl: /^https:\/\//.test(url) ? url : null }; });
}

export function getFundingImagesUpdatedAt() {
  return fundingImages.meta.retrievedAt.slice(0, 10);
}
