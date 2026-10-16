import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { getSetDetail, getSetParts, getSetMinifigs } from '../utils/api';
import SetDetailPage from './SetDetailPage';

jest.mock('react-router-dom', function() { return {
  useParams: function() { return { setNum: '10278-1' }; },
  useNavigate: function() { return jest.fn(); },
}; });
jest.mock('../utils/api', function() { return {
  getSetDetail: jest.fn(), getSetParts: jest.fn(), getSetMinifigs: jest.fn(),
}; });
jest.mock('../contexts/LanguageContext', function() {
  var t = function(key) { return key; };
  return { useLanguage: function() { return { lang: 'en', t: t }; } };
});
jest.mock('../hooks/useTranslatedName', function() { return function() { return null; }; });
jest.mock('../hooks/useInstructions', function() { return function() {
  return { instructions: [], loading: false, legoProductNumber: '', fileSizes: {} };
}; });
jest.mock('../hooks/useLegoPrice', function() { return function() { return {}; }; });
jest.mock('../utils/instructions', function() { return {
  getLegoPageUrl: function() { return 'https://www.lego.com/product/10278'; },
}; });
jest.mock('../utils/price', function() { return {
  getLegoKrProductUrl: function() { return 'https://www.lego.com/ko-kr/product/10278'; },
}; });
jest.mock('../utils/collection', function() { return {
  isInCollection: function() { return false; }, isInWishlist: function() { return false; },
  addToCollection: jest.fn(), removeFromCollection: jest.fn(), addToWishlist: jest.fn(), removeFromWishlist: jest.fn(),
}; });
jest.mock('../utils/fetchSetImages', function() { return {
  getCachedSetImages: function() { return null; }, fetchSetImages: async function() { return []; },
}; });
jest.mock('../components/PriceHistoryChart', function() { return function() { return null; }; });

beforeEach(function() {
  jest.clearAllMocks();
  getSetDetail.mockResolvedValue({
    set_num: '10278-1', name: 'Police Station', num_parts: 2923, year: 2021, theme_id: 155,
    set_img_url: 'https://cdn.rebrickable.com/media/sets/10278-1/1000.jpg',
    set_url: 'https://rebrickable.com/sets/10278-1/',
  });
});

test('the main detail and actions render while optional inventories are still pending', async function() {
  getSetParts.mockImplementation(function() { return new Promise(function() {}); });
  getSetMinifigs.mockImplementation(function() { return new Promise(function() {}); });
  render(React.createElement(SetDetailPage));
  expect(await screen.findByRole('heading', { name: 'Police Station' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'addCollection' })).toBeEnabled();
  expect(screen.getByAltText('Police Station')).toBeTruthy();
  expect(screen.getByText('partsLoading')).toBeTruthy();
  expect(screen.queryByText('setLoading')).toBeNull();
});

test('inventory failures stay within their tabs and the parts tab can retry', async function() {
  getSetParts.mockRejectedValueOnce(new Error('Parts unavailable'));
  getSetMinifigs.mockRejectedValueOnce(new Error('Minifigures unavailable'));
  render(React.createElement(SetDetailPage));
  expect(await screen.findByText('apiErrorGeneric')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Police Station' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'addWishlist' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: /minifigures/ }));
  expect(await screen.findByText('apiErrorGeneric')).toBeTruthy();
  expect(screen.queryByText('noMinifigs')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /partsList/ }));
  getSetParts.mockResolvedValueOnce({ count: 1, results: [{
    id: 1, quantity: 4, part: { name: 'Brick 2 x 4', part_img_url: 'https://cdn.rebrickable.com/parts/3001.jpg' },
  }] });
  fireEvent.click(screen.getByRole('button', { name: 'retry' }));
  expect(await screen.findByText('Brick 2 x 4')).toBeTruthy();
  expect(screen.queryByText('apiErrorGeneric')).toBeNull();
  expect(getSetParts).toHaveBeenLastCalledWith('10278-1', 1, 50);
  expect(screen.getByRole('heading', { name: 'Police Station' })).toBeTruthy();
});
