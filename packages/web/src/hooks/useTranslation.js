import { useState, useEffect } from 'react';
import i18n from '@shared/i18n';

/**
 * Hook React pour i18n avec re-render automatique
 */
export default function useTranslation() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate(n => n + 1);
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  return {
    t: (key, params) => i18n.t(key, params),
    locale: i18n.getLocale(),
    setLocale: (locale) => {
      i18n.setLocale(locale);
      window.dispatchEvent(new Event('languagechange'));
    }
  };
}
