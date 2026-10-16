import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FundingPage from './FundingPage';
import announcements from '../data/bdpUpcoming.json';
import { getFundingGallery } from '../utils/fundingImages';

jest.mock('../contexts/LanguageContext', function() { return {
  useLanguage: function() { return { lang: 'ko', t: function(key) { return key; } }; }
}; });
jest.mock('../utils/api', function() { return {
  getThemes: async function() { return { results: [{ id: 1, name: 'BrickLink Designer Program', parent_id: null }], next: null }; },
  filterSets: async function() { return { results: [], count: 0, next: null }; }
}; });
jest.mock('../utils/translate', function() { return { getCachedTranslation: function() { return null; }, translateName: async function(name) { return name; } }; });
jest.mock('../components/SetCard', function() { return function() { return null; }; });

beforeEach(function() {
  localStorage.clear();
  global.IntersectionObserver = class { observe() {} disconnect() {} };
});

test('all 25 official announcement thumbnails select the matching cached main photo', async function() {
  render(React.createElement(FundingPage));
  await screen.findByText('noFundingProducts');
  fireEvent.click(screen.getByRole('tab', { name: 'bdpTabUpcoming' }));
  announcements.upcoming.forEach(function(item) {
    var gallery = getFundingGallery(item);
    gallery.forEach(function(photo, index) {
      fireEvent.click(screen.getByRole('button', { name: item.nameKo + ' ' + (index + 1) }));
      expect(screen.getByAltText(item.nameKo).getAttribute('src')).toBe(photo.src);
    });
  });
  expect(screen.getAllByRole('link', { name: 'fundingImageSource' })).toHaveLength(5);
});
