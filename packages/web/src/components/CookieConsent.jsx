import { useState, useEffect } from 'react';
import { analytics } from '../services/analytics';

const COOKIE_CONSENT_KEY = 'faketect_cookie_consent';
const COOKIE_CONSENT_DATE_KEY = 'faketect_cookie_consent_date';
const CONSENT_VALIDITY_MONTHS = 13;

/**
 * Bannière de consentement cookies conforme RGPD/ePrivacy
 * - Consentement granulaire par catégorie
 * - Durée de validité : 13 mois
 * - Respect du "no" par défaut (pas de cookies non-essentiels sans consentement)
 * - Intégration avec Analytics (GA4, Hotjar)
 */
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Toujours actif (nécessaires au fonctionnement)
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const consentDate = localStorage.getItem(COOKIE_CONSENT_DATE_KEY);

    if (!consent || !consentDate) {
      // Pas de consentement → afficher la bannière
      setShowBanner(true);
      return;
    }

    // Vérifier si le consentement a expiré (13 mois)
    const consentTimestamp = parseInt(consentDate, 10);
    const now = Date.now();
    const monthsElapsed = (now - consentTimestamp) / (1000 * 60 * 60 * 24 * 30);

    if (monthsElapsed > CONSENT_VALIDITY_MONTHS) {
      // Consentement expiré → redemander
      setShowBanner(true);
      return;
    }

    // Charger les préférences sauvegardées
    try {
      const savedPrefs = JSON.parse(consent);
      setPreferences(savedPrefs);
      applyConsent(savedPrefs);
    } catch (error) {
      console.error('Erreur chargement préférences cookies:', error);
      setShowBanner(true);
    }
  }, []);

  // Écouter les événements personnalisés depuis la page légale
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowBanner(true);
      setShowSettings(true);
    };
    const handleAccept = () => acceptAll();
    const handleReject = () => rejectAll();

    window.addEventListener('openCookieSettings', handleOpenSettings);
    window.addEventListener('acceptCookies', handleAccept);
    window.addEventListener('rejectCookies', handleReject);

    return () => {
      window.removeEventListener('openCookieSettings', handleOpenSettings);
      window.removeEventListener('acceptCookies', handleAccept);
      window.removeEventListener('rejectCookies', handleReject);
    };
  }, []);

  const saveConsent = (prefs) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    localStorage.setItem(COOKIE_CONSENT_DATE_KEY, Date.now().toString());
    applyConsent(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const applyConsent = (prefs) => {
    // Appliquer les préférences avec le service analytics
    if (prefs.analytics) {
      analytics.giveConsent();
    } else {
      analytics.revokeConsent();
    }

    // Marketing cookies (si utilisés à l'avenir)
    if (prefs.marketing && typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }

    // Enregistrer dans le dataLayer pour GTM (si utilisé)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cookie_consent_update',
      cookie_consent: prefs,
    });
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const rejectAll = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyEssential);
    saveConsent(onlyEssential);
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700 shadow-2xl">
      <div className="container-custom max-w-6xl mx-auto">
        {!showSettings ? (
          // Bannière simple
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-2">🍪 Gestion des cookies</h3>
              <p className="text-gray-300 text-sm">
                Nous utilisons des cookies pour améliorer votre expérience. Les cookies essentiels
                sont nécessaires au fonctionnement du site. Les autres nécessitent votre consentement.{' '}
                <a href="/legal/cookies" className="text-primary-400 hover:underline">
                  En savoir plus
                </a>
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
              >
                Personnaliser
              </button>
              <button
                onClick={rejectAll}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
              >
                Refuser
              </button>
              <button
                onClick={acceptAll}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition text-sm font-semibold"
              >
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          // Paramètres détaillés
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Préférences de cookies</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition"
                aria-label="Fermer les paramètres"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Cookies essentiels */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Cookies essentiels</h4>
                    <p className="text-gray-400 text-sm">
                      Nécessaires au fonctionnement du site (authentification, sécurité, préférences).
                      Ne peuvent pas être désactivés.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-primary-500 rounded-full flex items-center px-1">
                      <div className="w-4 h-4 bg-white rounded-full transform translate-x-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookies analytics */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Cookies analytiques</h4>
                    <p className="text-gray-400 text-sm">
                      Nous aident à comprendre comment vous utilisez le site (Google Analytics).
                      Données anonymisées.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
                        preferences.analytics ? 'bg-primary-500' : 'bg-gray-600'
                      }`}
                      aria-label="Basculer cookies analytiques"
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transform transition ${
                          preferences.analytics ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cookies marketing */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Cookies marketing</h4>
                    <p className="text-gray-400 text-sm">
                      Permettent de vous proposer des publicités personnalisées. Actuellement non utilisés.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
                        preferences.marketing ? 'bg-primary-500' : 'bg-gray-600'
                      }`}
                      aria-label="Basculer cookies marketing"
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transform transition ${
                          preferences.marketing ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={rejectAll}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Refuser tout
              </button>
              <button
                onClick={saveCustom}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition font-semibold"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
