import React, { createContext, useState, useContext, useCallback } from 'react';
import translations from '../utils/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('lego_lang') || 'ko';
    } catch {
      return 'ko';
    }
  });

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'ko' ? 'en' : 'ko';
      try { localStorage.setItem('lego_lang', next); } catch {}
      return next;
    });
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['ko']?.[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
