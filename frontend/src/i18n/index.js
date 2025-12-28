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

// Récupérer la langue du localStorage ou utiliser 'fr' par défaut
const savedLanguage = localStorage.getItem('i18nextLng') || 'fr';

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

export default i18n;
