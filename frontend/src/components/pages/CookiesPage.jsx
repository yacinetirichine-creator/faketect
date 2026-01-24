import { useTranslation } from 'react-i18next';
import { Cookie, Shield, Check, X } from 'lucide-react';

/**
 * Page Politique de Gestion des Cookies
 * Conformité CNIL, RGPD et Directive ePrivacy - Multilingue
 */
const CookiesPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Cookie className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('legal.cookiesPage.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('legal.lastUpdate')}: 28 {t('legal.terms.sections.presentation.content.dateMonth')} 2025
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-3">{t('legal.cookiesPage.intro.title')}</h2>
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.cookiesPage.intro.description')}
            </p>
          </div>
        </section>

        {/* Types de cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('legal.cookiesPage.typesTitle')}</h2>

          <div className="space-y-4">
            {/* Cookies strictement nécessaires */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">{t('legal.cookiesPage.types.necessary.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {t('legal.cookiesPage.types.necessary.description')}
                    </p>
                  </div>
                </div>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  {t('legal.cookiesPage.types.necessary.alwaysActive')}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-semibold">Cookie</th>
                      <th className="text-left py-2 font-semibold">{t('legal.cookiesPage.tableHeaders.purpose')}</th>
                      <th className="text-left py-2 font-semibold">{t('legal.cookiesPage.tableHeaders.duration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-2 font-mono text-xs">auth_token</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.necessary.cookies.authToken')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.session')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">refresh_token</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.necessary.cookies.refreshToken')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.7days')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">csrf_token</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.necessary.cookies.csrfToken')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.session')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">cookie_consent</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.necessary.cookies.cookieConsent')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.13months')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookies de préférences */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">{t('legal.cookiesPage.types.preferences.title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('legal.cookiesPage.types.preferences.description')}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-semibold">Cookie</th>
                      <th className="text-left py-2 font-semibold">{t('legal.cookiesPage.tableHeaders.purpose')}</th>
                      <th className="text-left py-2 font-semibold">{t('legal.cookiesPage.tableHeaders.duration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-2 font-mono text-xs">user_language</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.preferences.cookies.language')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.12months')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">theme_preference</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.preferences.cookies.theme')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.12months')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookies analytiques */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">{t('legal.cookiesPage.types.analytics.title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('legal.cookiesPage.types.analytics.description')}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-semibold">Cookie</th>
                      <th className="text-left py-2 font-semibold">{t('legal.cookiesPage.tableHeaders.purpose')}</th>
                      <th className="text-left py-2 font-semibold">{t('legal.cookiesPage.tableHeaders.duration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-2 font-mono text-xs">_ga</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.analytics.cookies.ga')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.2years')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">_gid</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.analytics.cookies.gid')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.24h')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">_gat</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.analytics.cookies.gat')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.1min')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookies Stripe */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">{t('legal.cookiesPage.types.payment.title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('legal.cookiesPage.types.payment.description')}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-semibold">Cookie</th>
                      <th className="text-left py-2 font-semibold">{t('legal.cookiesPage.tableHeaders.purpose')}</th>
                      <th className="text-left py-2 font-semibold">{t('legal.cookiesPage.tableHeaders.duration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-2 font-mono text-xs">__stripe_sid</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.payment.cookies.stripeSid')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.30min')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">__stripe_mid</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.types.payment.cookies.stripeMid')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{t('legal.cookiesPage.durations.12months')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Gestion des cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('legal.cookiesPage.management.title')}</h2>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">{t('legal.cookiesPage.management.banner.title')}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.cookiesPage.management.banner.description')}
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem('cookie_consent');
                  window.location.reload();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Cookie className="w-5 h-5" />
                {t('legal.cookiesPage.management.banner.button')}
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">{t('legal.cookiesPage.management.browser.title')}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.cookiesPage.management.browser.description')}
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>Chrome:</strong> {t('legal.cookiesPage.management.browser.chrome')}</li>
                <li><strong>Firefox:</strong> {t('legal.cookiesPage.management.browser.firefox')}</li>
                <li><strong>Safari:</strong> {t('legal.cookiesPage.management.browser.safari')}</li>
                <li><strong>Edge:</strong> {t('legal.cookiesPage.management.browser.edge')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Conséquences du refus */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('legal.cookiesPage.consequences.title')}</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <X className="w-5 h-5 text-red-600" />
                {t('legal.cookiesPage.consequences.necessary.title')}
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>❌ {t('legal.cookiesPage.consequences.necessary.noLogin')}</li>
                <li>❌ {t('legal.cookiesPage.consequences.necessary.noAccess')}</li>
                <li>❌ {t('legal.cookiesPage.consequences.necessary.noCsrf')}</li>
              </ul>
            </div>

            <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Cookie className="w-5 h-5 text-amber-600" />
                {t('legal.cookiesPage.consequences.optional.title')}
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>⚠️ {t('legal.cookiesPage.consequences.optional.lostPreferences')}</li>
                <li>⚠️ {t('legal.cookiesPage.consequences.optional.languageReset')}</li>
                <li>✅ {t('legal.cookiesPage.consequences.optional.noImpact')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Conformité */}
        <section className="mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Check className="w-6 h-6 text-green-600" />
              {t('legal.cookiesPage.compliance.title')}
            </h2>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>✅ {t('legal.cookiesPage.compliance.items.consent')}</p>
              <p>✅ {t('legal.cookiesPage.compliance.items.information')}</p>
              <p>✅ {t('legal.cookiesPage.compliance.items.withdrawal')}</p>
              <p>✅ {t('legal.cookiesPage.compliance.items.duration')}</p>
              <p>✅ {t('legal.cookiesPage.compliance.items.dnt')}</p>
              <p>✅ {t('legal.cookiesPage.compliance.items.noCookieWall')}</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('legal.cookiesPage.contact.title')}</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <p className="mb-2">
              {t('legal.cookiesPage.contact.intro')}
            </p>
            <p className="text-sm">
              <strong>Email:</strong>{' '}
              <a href="mailto:contact@faketect.com" className="text-blue-600 hover:underline">
                contact@faketect.com
              </a>
            </p>
            <p className="text-sm mt-2">
              <strong>DPO:</strong>{' '}
              <a href="mailto:dpo@faketect.com" className="text-blue-600 hover:underline">
                dpo@faketect.com
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>{t('legal.cookiesPage.footer')}</p>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage;
