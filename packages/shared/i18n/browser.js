/**
 * 🌍 Système i18n Universel FakeTect
 * Compatible : Web, Extension Chrome, Application
 * Format : UMD (Universal Module Definition)
 */

(function (root, factory) {
  // UMD wrapper pour compatibilité universelle
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.FakeTectI18n = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Traductions complètes (chargées dynamiquement)
   * Structure : { fr: {...}, en: {...}, ar: {...}, ... }
   */
  const translations = {};

  /**
   * Langues supportées avec métadonnées
   */
  const SUPPORTED_LANGUAGES = [
    { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'ar-ma', name: 'Moroccan Arabic', nativeName: 'الدارجة المغربية', flag: '🇲🇦', dir: 'rtl' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', dir: 'ltr' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  ];

  /**
   * Classe de gestion i18n universelle
   */
  class I18n {
    constructor(defaultLocale = 'en') {
      this.currentLocale = defaultLocale;
      this.fallbackLocale = 'en';
      this.listeners = [];
    }

    /**
     * Détecte la langue du navigateur
     */
    detectBrowserLanguage() {
      // Extension Chrome
      if (typeof chrome !== 'undefined' && chrome.i18n) {
        const lang = chrome.i18n.getUILanguage().split('-')[0];
        return SUPPORTED_LANGUAGES.some(l => l.code === lang) ? lang : 'en';
      }

      // Navigateur web
      if (typeof navigator !== 'undefined') {
        const lang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
        return SUPPORTED_LANGUAGES.some(l => l.code === lang) ? lang : 'en';
      }

      return 'en';
    }

    /**
     * Initialise le système i18n
     * @param {Object} options - { locale, translations }
     */
    async init(options = {}) {
      // Charger traductions si fournies
      if (options.translations) {
        Object.assign(translations, options.translations);
      }

      // Définir locale
      const savedLocale = this.getStoredLocale();
      this.currentLocale = options.locale || savedLocale || this.detectBrowserLanguage();

      // Appliquer direction texte
      this.applyDirection();

      return this.currentLocale;
    }

    /**
     * Récupère locale stockée
     */
    getStoredLocale() {
      try {
        // Extension Chrome
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return new Promise((resolve) => {
            chrome.storage.local.get(['locale'], (result) => {
              resolve(result.locale);
            });
          });
        }

        // Web - localStorage
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem('faketect_locale');
        }
      } catch (e) {
        console.warn('Cannot access storage:', e);
      }

      return null;
    }

    /**
     * Sauvegarde locale
     */
    saveLocale(locale) {
      try {
        // Extension Chrome
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ locale });
        }

        // Web - localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('faketect_locale', locale);
        }
      } catch (e) {
        console.warn('Cannot save locale:', e);
      }
    }

    /**
     * Change la langue active
     */
    setLocale(locale) {
      if (!SUPPORTED_LANGUAGES.some(lang => lang.code === locale)) {
        console.warn(`Locale ${locale} non supportée`);
        return;
      }

      this.currentLocale = locale;
      this.saveLocale(locale);
      this.applyDirection();
      this.notifyListeners();
    }

    /**
     * Récupère langue active
     */
    getLocale() {
      return this.currentLocale;
    }

    /**
     * Applique direction texte (RTL/LTR)
     */
    applyDirection() {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === this.currentLocale);
      
      if (typeof document !== 'undefined') {
        document.documentElement.dir = lang?.dir || 'ltr';
        document.documentElement.lang = this.currentLocale;
      }
    }

    /**
     * Traduction d'une clé
     * @param {string} key - Clé de traduction (ex: "common.welcome")
     * @param {Object} params - Paramètres de remplacement
     */
    t(key, params = {}) {
      const locale = this.currentLocale;
      const fallback = this.fallbackLocale;

      // Récupérer traduction
      let translation = this.getNestedValue(translations[locale], key) 
                     || this.getNestedValue(translations[fallback], key)
                     || key;

      // Remplacer paramètres {param}
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`{${param}}`, 'g');
        translation = translation.replace(regex, params[param]);
      });

      return translation;
    }

    /**
     * Récupère valeur dans objet imbriqué
     */
    getNestedValue(obj, path) {
      if (!obj) return null;
      return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Charge traductions depuis URLs
     * @param {Object} localeUrls - { fr: '/locales/fr.json', ... }
     */
    async loadTranslations(localeUrls) {
      const promises = Object.entries(localeUrls).map(async ([locale, url]) => {
        try {
          const response = await fetch(url);
          const data = await response.json();
          translations[locale] = data;
        } catch (e) {
          console.error(`Erreur chargement ${locale}:`, e);
        }
      });

      await Promise.all(promises);
      return translations;
    }

    /**
     * Formate date selon locale
     */
    formatDate(date, options = {}) {
      const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };

      try {
        return new Intl.DateTimeFormat(this.currentLocale, { ...defaultOptions, ...options }).format(date);
      } catch (e) {
        return date.toLocaleDateString();
      }
    }

    /**
     * Formate nombre selon locale
     */
    formatNumber(number, options = {}) {
      try {
        return new Intl.NumberFormat(this.currentLocale, options).format(number);
      } catch (e) {
        return number.toString();
      }
    }

    /**
     * Écoute changements de langue
     */
    onChange(callback) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }

    /**
     * Notifie listeners
     */
    notifyListeners() {
      this.listeners.forEach(callback => callback(this.currentLocale));
    }

    /**
     * Récupère toutes les langues supportées
     */
    getSupportedLanguages() {
      return SUPPORTED_LANGUAGES;
    }
  }

  // Instance singleton
  const i18n = new I18n();

  // Export
  return {
    i18n,
    SUPPORTED_LANGUAGES,
    I18n,
  };
}));
