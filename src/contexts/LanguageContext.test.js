import React from 'react';
import { render, screen } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';

function Year() {
  const { t } = useLanguage();
  return <span data-testid="year">2026{t('yearSuffix')}</span>;
}

test('English year labels preserve the intentionally empty suffix', () => {
  localStorage.setItem('lego_lang', 'en');
  render(<LanguageProvider><Year /></LanguageProvider>);
  expect(screen.getByTestId('year')).toHaveTextContent(/^2026$/);
  localStorage.removeItem('lego_lang');
});
