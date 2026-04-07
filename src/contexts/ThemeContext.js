import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

var ThemeContext = createContext();

function getSystemTheme() {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
  } catch (e) {}
  return 'light';
}

function getInitialTheme() {
  try {
    var stored = localStorage.getItem('lego_theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) {}
  return getSystemTheme();
}

function applyThemeAttribute(theme) {
  try {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      // Inform browser UA for native form controls
      document.documentElement.style.colorScheme = theme;
    }
  } catch (e) {}
}

function ThemeProvider(props) {
  var themeState = useState(getInitialTheme);
  var theme = themeState[0];
  var setThemeState = themeState[1];

  // Apply attribute on every theme change.
  useEffect(function () {
    applyThemeAttribute(theme);
  }, [theme]);

  // Listen to system theme changes only if the user hasn't picked an explicit value.
  useEffect(function () {
    var hasExplicit = false;
    try { hasExplicit = !!localStorage.getItem('lego_theme'); } catch (e) {}
    if (hasExplicit) return undefined;

    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var listener = function (e) { setThemeState(e.matches ? 'dark' : 'light'); };
      if (mq.addEventListener) mq.addEventListener('change', listener);
      else if (mq.addListener) mq.addListener(listener);
      return function () {
        if (mq.removeEventListener) mq.removeEventListener('change', listener);
        else if (mq.removeListener) mq.removeListener(listener);
      };
    } catch (e) { return undefined; }
  }, []);

  var setTheme = useCallback(function (newTheme) {
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    setThemeState(newTheme);
    try { localStorage.setItem('lego_theme', newTheme); } catch (e) {}
  }, []);

  var toggleTheme = useCallback(function () {
    setThemeState(function (prev) {
      var next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('lego_theme', next); } catch (e) {}
      return next;
    });
  }, []);

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme: theme, setTheme: setTheme, toggleTheme: toggleTheme } },
    props.children
  );
}

function useTheme() {
  var ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

export { ThemeProvider, useTheme };
