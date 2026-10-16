import { fetchSetImages, getStaticImageIds } from './fetchSetImages';
import legoImagesData from '../data/legoImages.json';

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
