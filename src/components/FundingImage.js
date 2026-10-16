import React, { useEffect, useState } from 'react';

// A cached photo gets one attempt at its recorded official source, then a
// non-image placeholder. Never loop an error handler or substitute a different
// project's picture. This also applies to the gallery's thumbnails.
export default function FundingImage(props) {
  var state = useState(0);
  var failure = state[0]; var setFailure = state[1];
  var image = props.image;
  useEffect(function() { setFailure(0); }, [image.src, image.sourceUrl]);
  var hasFallback = image.sourceUrl && image.sourceUrl !== image.src;
  var shared = {
    className: props.className,
    onClick: props.onClick,
    role: props.onClick ? 'button' : undefined,
    tabIndex: props.onClick ? 0 : undefined,
    onKeyDown: props.onClick ? function(event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); props.onClick(); }
    } : undefined,
  };
  if (failure >= 2) return React.createElement('span', Object.assign({}, shared, {
    className: props.className + ' funding-image-unavailable',
    role: props.onClick ? 'button' : 'img',
    'aria-label': props.unavailableLabel,
  }), props.children || props.unavailableLabel);
  return React.createElement('img', Object.assign({}, shared, {
    src: failure === 1 ? image.sourceUrl : image.src,
    alt: props.alt,
    loading: 'lazy',
    onError: function() { setFailure(function(current) { return current === 0 && hasFallback ? 1 : 2; }); },
  }));
}
