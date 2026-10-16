import React from 'react';
import { render, screen } from '@testing-library/react';
import MocDetailPage from './MocDetailPage';
import { getMocDetail } from '../utils/mocApi';

jest.mock('../utils/mocApi', function() { return {
  getMocDetail: jest.fn()
}; });

beforeEach(function() { getMocDetail.mockResolvedValue(null); });
jest.mock('../contexts/LanguageContext', function() { return {
  useLanguage: function() { return { t: function(key) { return key; } }; }
}; });
jest.mock('react-router-dom', function() { return {
  useParams: function() { return { mocNum: 'MOC-218010' }; },
  useLocation: function() { return {}; },
  Link: function(props) { return require('react').createElement('a', { href: props.to }, props.children); }
}; });

test('an unavailable direct MOC detail stops loading and offers its original page', async function() {
  render(React.createElement(MocDetailPage));
  expect(await screen.findByText('mocDetailUnavailable')).toBeTruthy();
  expect(screen.queryByText('loading')).toBeNull();
  expect(screen.getByRole('link', { name: 'mocViewOnRebrickable' }).getAttribute('href'))
    .toBe('https://rebrickable.com/mocs/MOC-218010/');
});

test('a saved official introduction opens both the creation and its review without unknown numeric facts', async function() {
  getMocDetail.mockResolvedValue({
    mocNum: 'MOC-218010', name: 'Saved introduction', parts: null, year: null, likes: null,
    canonicalUrl: 'https://rebrickable.com/mocs/MOC-218010/',
    reviewUrl: 'https://rebrickable.com/blog/865/review-moc-206123-sleeplessnight-art-nouveau-market-street/',
    reviewedAt: '2025-11-21T00:00:00.000Z', source: 'snapshot', catalog: { scope: 'official-blog-reviews' },
  });
  render(React.createElement(MocDetailPage));
  expect(await screen.findByRole('heading', { name: 'Saved introduction' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'mocViewOnRebrickable' }).getAttribute('href'))
    .toBe('https://rebrickable.com/mocs/MOC-218010/');
  expect(screen.getByRole('link', { name: 'mocReadReview' }).getAttribute('href'))
    .toMatch(/^https:\/\/rebrickable.com\/blog\//);
  expect(screen.getByText('2025-11-21')).toBeTruthy();
  expect(screen.getByText('mocReviewSnapshotNotice')).toBeTruthy();
  expect(screen.queryByText('numParts:')).toBeNull();
  expect(screen.queryByText('releaseYear:')).toBeNull();
  expect(screen.queryByText('0')).toBeNull();
});
