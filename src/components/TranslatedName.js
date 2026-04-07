import React from 'react';
import useTranslatedName from '../hooks/useTranslatedName';

// Wraps useTranslatedName hook for in-loop usage (can't call hooks inside map)
function TranslatedName(props) {
  var name = props.name;
  var translated = useTranslatedName(name);
  return translated || name || '';
}

export default TranslatedName;
