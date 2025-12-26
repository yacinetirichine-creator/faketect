/**
 * 🌍 Système d'internationalisation FakeTect
 * Support de 10 langues majeures
 */

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import arMA from './locales/ar-ma.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import it from './locales/it.json';

const locales = {
  fr,
  en,
  ar,
  'ar-ma': arMA,
  es,
  zh,
  de,
  pt,
  it,
};

/**
 * Langues supportées avec métadonnées
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ar-ma', name: 'Moroccan Arabic', nativeName: 'الدارجة المغربية', flag: '🇲🇦', dir: 'rtl' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
];

/**
 * Classe de gestion i18n
 */
class I18n {
  constructor(defaultLocale = 'en') {
    this.locale = defaultLocale;
    this.fallbackLocale = 'en';
  }

  /**
   * Détecter la langue du navigateur
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0];
    
    // Cas spécial : dialecte marocain
    if (browserLang === 'ar-MA' || browserLang === 'ar-ma') {
      return 'ar-ma';
    }
    
    // Vérifier si la langue est supportée
    if (locales[langCode]) {
      return langCode;
    }
    
    return this.fallbackLocale;
  }

  /**
   * Définir la langue active
   */
  setLocale(locale) {
    if (!locales[locale]) {
      console.warn(`Locale "${locale}" not supported, falling back to "${this.fallbackLocale}"`);
      this.locale = this.fallbackLocale;
    } else {
      this.locale = locale;
    }
    
    // Sauvegarder préférence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('faketect_locale', this.locale);
    }
    
    // Mettre à jour direction texte (RTL/LTR)
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === this.locale);
    if (lang && typeof document !== 'undefined') {
      document.documentElement.dir = lang.dir;
      document.documentElement.lang = this.locale;
    }
  }

  /**
   * Obtenir la langue active
   */
  getLocale() {
    return this.locale;
  }

  /**
   * Charger la préférence utilisateur
   */
  loadUserPreference() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('faketect_locale');
      if (saved && locales[saved]) {
        return saved;
      }
    }
    return this.detectBrowserLanguage();
  }

  /**
   * Traduire une clé
   * @param {string} key - Clé de traduction (ex: 'common.welcome')
   * @param {object} params - Paramètres de remplacement
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let translation = locales[this.locale];
    
    // Navigation dans l'arbre de traductions
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = undefined;
        break;
      }
    }
    
    // Fallback sur langue par défaut
    if (translation === undefined) {
      let fallback = locales[this.fallbackLocale];
      for (const k of keys) {
        if (fallback && typeof fallback === 'object') {
          fallback = fallback[k];
        } else {
          fallback = undefined;
          break;
        }
      }
      translation = fallback || key;
    }
    
    // Remplacement des paramètres
    if (typeof translation === 'string') {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }
    
    return translation || key;
  }

  /**
   * Obtenir toutes les traductions pour une section
   */
  getSection(section) {
    return locales[this.locale]?.[section] || {};
  }

  /**
   * Pluralisation
   */
  plural(key, count, params = {}) {
    const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
    return this.t(pluralKey, { ...params, count });
  }

  /**
   * Formatage de date
   */
  formatDate(date, style = 'long') {
    const options = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    };

    return new Intl.DateTimeFormat(this.locale, options[style]).format(date);
  }

  /**
   * Formatage de nombre
   */
  formatNumber(number, style = 'decimal', currency = 'EUR') {
    const options = {
      decimal: { style: 'decimal' },
      percent: { style: 'percent' },
      currency: { style: 'currency', currency },
    };

    return new Intl.NumberFormat(this.locale, options[style]).format(number);
  }
}

// Instance singleton
const i18n = new I18n();

// Auto-détection au chargement
if (typeof window !== 'undefined') {
  i18n.setLocale(i18n.loadUserPreference());
}

export default i18n;
