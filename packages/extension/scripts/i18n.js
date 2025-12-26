/**
 * 🌐 Extension Chrome i18n Loader
 * Charge et applique traductions automatiquement
 */

// Importer système i18n universel
const { i18n, SUPPORTED_LANGUAGES } = window.FakeTectI18n;

/**
 * Initialise i18n pour l'extension
 */
async function initExtensionI18n() {
  // Détecter langue navigateur
  const browserLang = chrome.i18n.getUILanguage().split('-')[0];
  const savedLang = await getSavedLanguage();
  const locale = savedLang || browserLang || 'en';

  // Charger traductions de la langue active
  const translations = await loadLocaleFile(locale);
  
  await i18n.init({
    locale,
    translations: { [locale]: translations }
  });

  // Traduire automatiquement tous les éléments [data-i18n]
  translatePage();

  return i18n;
}

/**
 * Charge fichier de traduction
 */
async function loadLocaleFile(locale) {
  try {
    const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Locale ${locale} non trouvée, fallback EN`);
      const enUrl = chrome.runtime.getURL('_locales/en/messages.json');
      const enResponse = await fetch(enUrl);
      return await enResponse.json();
    }
    
    return await response.json();
  } catch (e) {
    console.error('Erreur chargement locale:', e);
    return {};
  }
}

/**
 * Récupère langue sauvegardée
 */
async function getSavedLanguage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['locale'], (result) => {
      resolve(result.locale);
    });
  });
}

/**
 * Traduit automatiquement la page
 */
function translatePage() {
  // Traduire éléments [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = i18n.t(key);
    
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translation;
    } else {
      el.textContent = translation;
    }
  });

  // Traduire titres [data-i18n-title]
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = i18n.t(key);
  });

  // Traduire aria-label [data-i18n-aria]
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', i18n.t(key));
  });
}

/**
 * Change langue et recharge
 */
async function changeLanguage(locale) {
  chrome.storage.local.set({ locale }, () => {
    window.location.reload();
  });
}

/**
 * Crée sélecteur de langue
 */
function createLanguageSelector(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.getLocale());

  const html = `
    <div class="language-selector">
      <label>${currentLang?.flag} ${currentLang?.nativeName}</label>
      <select id="language-select">
        ${SUPPORTED_LANGUAGES.map(lang => `
          <option value="${lang.code}" ${lang.code === currentLang?.code ? 'selected' : ''}>
            ${lang.flag} ${lang.nativeName}
          </option>
        `).join('')}
      </select>
    </div>
  `;

  container.innerHTML = html;

  // Event listener
  document.getElementById('language-select').addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });
}

// Auto-init au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtensionI18n);
} else {
  initExtensionI18n();
}

// Export pour usage externe
window.FakeTectExtensionI18n = {
  i18n,
  changeLanguage,
  translatePage,
  createLanguageSelector,
  SUPPORTED_LANGUAGES
};
