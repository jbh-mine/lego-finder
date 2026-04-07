import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCachedTranslation, translateName } from '../utils/translate';

export default function useTranslatedName(name) {
  var langCtx = useLanguage();
  var lang = langCtx.lang;
  // Compute initial state synchronously to avoid English flash
  var initial = (lang === 'ko' && name) ? getCachedTranslation(name) : null;
  var s = useState(initial);
  var translated = s[0];
  var setTranslated = s[1];

  useEffect(function() {
    if (lang !== 'ko' || !name) {
      setTranslated(null);
      return;
    }
    var cached = getCachedTranslation(name);
    if (cached) {
      setTranslated(cached);
      return;
    }
    var cancelled = false;
    translateName(name).then(function(result) {
      if (!cancelled && result !== name) setTranslated(result);
    });
    return function() { cancelled = true; };
  }, [name, lang]);

  return translated;
}
