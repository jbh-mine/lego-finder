import React, { createContext, useState, useContext, useCallback } from 'react';
import translations from '../utils/i18n';

var LanguageContext = createContext();

function LanguageProvider(props) {
  var initialLang = 'ko';
  try { initialLang = localStorage.getItem('lego_lang') || 'ko'; } catch(e) {}

  var langState = useState(initialLang);
  var lang = langState[0];
  var setLangState = langState[1];

  var setLang = useCallback(function(newLang) {
    setLangState(newLang);
    try { localStorage.setItem('lego_lang', newLang); } catch(e) {}
  }, []);

  var t = useCallback(function(key) {
    return (translations[lang] && translations[lang][key]) || (translations['ko'] && translations['ko'][key]) || key;
  }, [lang]);

  return React.createElement(
    LanguageContext.Provider,
    { value: { lang: lang, setLang: setLang, t: t } },
    props.children
  );
}

function useLanguage() {
  var context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { LanguageProvider, useLanguage };
