import { useState } from 'react';
import i18n, { SUPPORTED_LANGUAGES } from '@shared/i18n';

/**
 * 🌍 Sélecteur de langue
 * Support de 10 langues avec drapeaux et noms natifs
 */
export default function LanguageSelector({ variant = 'dropdown' }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.getLocale());

  const handleLanguageChange = (langCode) => {
    i18n.setLocale(langCode);
    setIsOpen(false);
    // Forcer re-render de l'app
    window.dispatchEvent(new Event('languagechange'));
    // Recharger la page pour appliquer partout
    window.location.reload();
  };

  if (variant === 'compact') {
    // Version compacte (navbar)
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition"
          aria-label="Change language"
        >
          <span className="text-xl">{currentLang?.flag}</span>
          <span className="hidden sm:inline text-sm text-gray-300">{currentLang?.code.toUpperCase()}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 py-2 max-h-96 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition ${
                    lang.code === currentLang?.code ? 'bg-primary-500/10 text-primary-400' : 'text-gray-300'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{lang.nativeName}</div>
                    <div className="text-xs text-gray-500">{lang.name}</div>
                  </div>
                  {lang.code === currentLang?.code && (
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Version dropdown complète (footer/settings)
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        🌍 Language / Langue / لغة / 语言
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-between hover:border-primary-500 transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentLang?.flag}</span>
            <div className="text-left">
              <div className="font-medium text-white">{currentLang?.nativeName}</div>
              <div className="text-xs text-gray-400">{currentLang?.name}</div>
            </div>
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 py-2 max-h-80 overflow-y-auto">
              <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-800 mb-2">
                Select your language / Sélectionnez votre langue
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition ${
                    lang.code === currentLang?.code ? 'bg-primary-500/10 text-primary-400' : 'text-gray-300'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{lang.nativeName}</div>
                    <div className="text-xs text-gray-500">{lang.name}</div>
                  </div>
                  {lang.code === currentLang?.code && (
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        10 languages supported • RTL support for Arabic
      </p>
    </div>
  );
}
