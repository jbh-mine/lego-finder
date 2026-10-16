import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MocsPage from './MocsPage';

jest.mock('../contexts/LanguageContext', function() { return {
  useLanguage: function() { return { t: function(key) { return key; } }; }
}; });
jest.mock('./MocReviewBrowser', function() { return function() {
  return require('react').createElement('div', null, 'saved-review-browser');
}; });
jest.mock('../components/MocWebSearch', function() { return function(props) {
  return require('react').createElement('input', {
    'aria-label': 'web-search-query', value: props.query,
    onChange: function(event) { props.onQueryChange(event.target.value); }
  });
}; });

test('web search is the default and the finite review catalog is a separate mode', function() {
  render(React.createElement(MocsPage));
  expect(screen.getByRole('textbox', { name: 'web-search-query' })).toBeTruthy();
  expect(screen.queryByText('saved-review-browser')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'mocReviewMode' }));
  expect(screen.getByText('saved-review-browser')).toBeTruthy();
  expect(screen.queryByRole('textbox')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'mocWebMode' }));
  expect(screen.getByRole('textbox')).toBeTruthy();
});

test('archive search follows the current query and survives switching modes', function() {
  render(React.createElement(MocsPage));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'millennium falcon' } });
  var link = screen.getByRole('link', { name: 'mocArchiveSearch' });
  expect(new URL(link.href).searchParams.get('search')).toBe('millennium falcon');
  expect(link.target).toBe('_blank');
  fireEvent.click(screen.getByRole('button', { name: 'mocReviewMode' }));
  fireEvent.click(screen.getByRole('button', { name: 'mocWebMode' }));
  expect(screen.getByRole('textbox').value).toBe('millennium falcon');
});
