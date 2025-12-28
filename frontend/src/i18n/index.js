import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import it from './locales/it.json';

export const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
];

export const LANGUAGE_STORAGE_KEY = 'faketect-language';

export function normalizeLanguage(code) {
  if (!code) return 'fr';
  const normalized = String(code).trim().toLowerCase().replace('_', '-');
  return normalized.split('-')[0];
}

export function isSupportedLanguage(code) {
  const c = normalizeLanguage(code);
  return languages.some((l) => l.code === c);
}

export function getSavedLanguage() {
  const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem('i18nextLng');
  const lang = normalizeLanguage(raw || 'fr');
  return isSupportedLanguage(lang) ? lang : 'fr';
}

export function persistLanguage(code) {
  const lang = normalizeLanguage(code);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  localStorage.setItem('i18nextLng', lang);
  return lang;
}

const savedLanguage = getSavedLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: { 
      fr: { translation: fr }, 
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      pt: { translation: pt },
      it: { translation: it }
    },
    lng: savedLanguage,
    fallbackLng: 'fr',
    interpolation: { 
      escapeValue: false 
    },
    react: {
      useSuspense: false
    }
  });

// Ensure storage is in sync with the resolved language.
persistLanguage(savedLanguage);

export default i18n;
