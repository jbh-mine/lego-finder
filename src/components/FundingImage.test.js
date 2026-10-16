import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FundingImage from './FundingImage';

var photo = { src: '/lego-finder/images/funding/project.jpg', sourceUrl: 'https://file.bricklink.info/official-project.jpg' };

test('a failed local project photo tries its official source once and stops on failure', function() {
  render(React.createElement(FundingImage, { image: photo, alt: 'Project photo', className: 'main-photo', unavailableLabel: 'Project image unavailable' }));
  var img = screen.getByAltText('Project photo');
  expect(img.getAttribute('src')).toBe(photo.src);
  fireEvent.error(img);
  expect(img.getAttribute('src')).toBe(photo.sourceUrl);
  fireEvent.error(img);
  expect(screen.queryByAltText('Project photo')).toBeNull();
  expect(screen.getByRole('img', { name: 'Project image unavailable' })).toBeTruthy();
});

test('failed thumbnail photos stop retrying and remain selectable with keyboard or click', function() {
  var onClick = jest.fn();
  render(React.createElement(FundingImage, { image: photo, alt: 'Project 2', className: 'thumbnail', unavailableLabel: 'Project 2 unavailable', onClick: onClick }));
  var img = screen.getByRole('button', { name: 'Project 2' });
  fireEvent.error(img); fireEvent.error(img);
  var placeholder = screen.getByRole('button', { name: 'Project 2 unavailable' });
  fireEvent.click(placeholder);
  fireEvent.keyDown(placeholder, { key: 'Enter' });
  expect(onClick).toHaveBeenCalledTimes(2);
  expect(placeholder.tagName).toBe('SPAN');
});

test('a remote-only photo does not retry the same failed URL and a new photo resets failure', function() {
  var view = render(React.createElement(FundingImage, { image: { src: photo.sourceUrl, sourceUrl: photo.sourceUrl }, alt: 'Old photo', unavailableLabel: 'Unavailable' }));
  fireEvent.error(screen.getByAltText('Old photo'));
  expect(screen.queryByAltText('Old photo')).toBeNull();
  view.rerender(React.createElement(FundingImage, { image: photo, alt: 'New photo', unavailableLabel: 'Unavailable' }));
  expect(screen.getByAltText('New photo').getAttribute('src')).toBe(photo.src);
});
