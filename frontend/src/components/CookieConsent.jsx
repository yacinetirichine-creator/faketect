import { useState, useCallback, memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie, Settings, X, Check } from 'lucide-react';
import api from '../services/api';

// Générer un sessionId unique pour les visiteurs non-connectés
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('faketect_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('faketect_session_id', sessionId);
  }
  return sessionId;
};

const CookieConsent = memo(() => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    necessary: true,
    preferences: false,
    analytics: false,
    functional: false,
  });

  // Vérifier le consentement au chargement (serveur + localStorage fallback)
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const { data } = await api.get(`/consent/cookies?sessionId=${sessionId}`);

        if (data.hasConsent) {
          setPreferences({
            necessary: true,
            preferences: data.consent.preferences,
            analytics: data.consent.analytics,
            functional: data.consent.functional,
          });
          setShowBanner(false);

          // Mettre à jour Google Analytics selon le consentement serveur
          if (window.gtag) {
            window.gtag('consent', 'update', {
              analytics_storage: data.consent.analytics ? 'granted' : 'denied',
            });
          }
        } else {
          // Pas de consentement serveur, vérifier localStorage (migration)
          const localConsent = localStorage.getItem('cookie_consent');
          if (localConsent) {
            const parsed = JSON.parse(localConsent);
            // Migrer vers le serveur
            await saveConsentToServer(parsed);
            setShowBanner(false);
          } else {
            setShowBanner(true);
          }
        }
      } catch (error) {
        // En cas d'erreur réseau, utiliser localStorage comme fallback
        const localConsent = localStorage.getItem('cookie_consent');
        if (localConsent) {
          setShowBanner(false);
        } else {
          setShowBanner(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkConsent();
  }, []);

  // Sauvegarder le consentement sur le serveur
  const saveConsentToServer = async (consent) => {
    try {
      const sessionId = getOrCreateSessionId();
      await api.post('/consent/cookies', {
        ...consent,
        sessionId,
      });
      // Backup local pour offline
      localStorage.setItem('cookie_consent', JSON.stringify({
        ...consent,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      // Fallback localStorage si erreur serveur
      localStorage.setItem('cookie_consent', JSON.stringify({
        ...consent,
        timestamp: new Date().toISOString(),
      }));
    }
  };

  const handleAcceptAll = useCallback(async () => {
    const consent = {
      necessary: true,
      preferences: true,
      analytics: true,
      functional: true,
    };

    await saveConsentToServer(consent);
    setShowBanner(false);

    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  }, []);

  const handleRejectAll = useCallback(async () => {
    const consent = {
      necessary: true,
      preferences: false,
      analytics: false,
      functional: false,
    };

    await saveConsentToServer(consent);
    setShowBanner(false);
    setShowSettings(false);

    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  }, []);

  const handleSavePreferences = useCallback(async () => {
    await saveConsentToServer(preferences);
    setShowBanner(false);
    setShowSettings(false);

    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
      });
    }
  }, [preferences]);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  // Ne pas afficher pendant le chargement ou si consentement déjà donné
  if (isLoading || !showBanner) return null;

  return (
    <>
      {/* Banner principal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t-2 border-blue-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Icône et message */}
            <div className="flex items-start gap-4 flex-1">
              <Cookie className="w-12 h-12 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('cookies.banner.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('cookies.banner.description')}
                </p>
                <a
                  href="/legal/cookies"
                  className="text-sm text-blue-600 hover:underline inline-block mt-2"
                >
                  {t('cookies.banner.learnMore')}
                </a>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={openSettings}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('cookies.banner.customize')}
              </button>
              <button
                onClick={handleRejectAll}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cookies.banner.rejectAll')}
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Check className="w-4 h-4 mr-2" />
                {t('cookies.banner.acceptAll')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de paramètres détaillés */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('cookies.settings.title')}
              </h2>
              <button
                onClick={closeSettings}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="px-6 py-4 space-y-6">
              {/* Cookies strictement nécessaires */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {t('cookies.settings.necessary.title')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('cookies.settings.necessary.description')}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="bg-gray-200 dark:bg-gray-600 rounded-full px-3 py-1 text-xs font-semibold">
                      {t('cookies.settings.necessary.alwaysEnabled')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cookies : auth_token, session_id, csrf_token, consent_id
                </div>
              </div>

              {/* Cookies de préférences */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {t('cookies.settings.preferences.title')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('cookies.settings.preferences.description')}
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.preferences}
                        onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cookies : user_language, theme_preference, timezone
                </div>
              </div>

              {/* Cookies analytiques */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {t('cookies.settings.analytics.title')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('cookies.settings.analytics.description')}
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cookies : _ga, _gid, _gat (Google Analytics)
                </div>
              </div>

              {/* Cookies fonctionnels */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {t('cookies.settings.functional.title')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('cookies.settings.functional.description')}
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cookies : recent_analyses, dashboard_layout, notification_prefs
                </div>
              </div>

              {/* Informations complémentaires */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>{t('cookies.settings.validityInfo')}</strong>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {t('cookies.settings.modifyInfo')}
                </p>
              </div>
            </div>

            {/* Footer avec boutons */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={handleRejectAll}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cookies.banner.rejectAll')}
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('cookies.settings.savePreferences')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

CookieConsent.displayName = 'CookieConsent';

export default CookieConsent;
