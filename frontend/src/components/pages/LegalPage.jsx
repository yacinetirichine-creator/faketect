import { FileText, Scale, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LegalPage = ({ type }) => {
  const { t } = useTranslation();

  const content = {
    terms: {
      titleKey: 'legal.terms.title',
      icon: FileText,
      color: 'blue',
      descriptionKey: 'legal.terms.sections.presentation.content',
      file: '/CGU.md'
    },
    sales: {
      titleKey: 'legal.terms.sections.pricing.title',
      icon: Scale,
      color: 'green',
      descriptionKey: 'legal.terms.sections.pricing.paidPlans',
      file: '/CGV.md'
    },
    legal: {
      titleKey: 'legal.mentions.title',
      icon: Shield,
      color: 'purple',
      descriptionKey: 'legal.mentions.sections.editor.content',
      file: '/MENTIONS_LEGALES.md'
    }
  };

  const current = content[type];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Icon className={`w-16 h-16 text-${current.color}-600 mx-auto mb-4`} />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t(current.titleKey)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t(current.descriptionKey)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {t('legal.lastUpdate')} : 28 décembre 2024
          </p>
        </div>

        {/* Informations société */}
        <section className="mb-8">
          <div className={`bg-${current.color}-50 dark:bg-${current.color}-900/20 border border-${current.color}-200 dark:border-${current.color}-800 rounded-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">{t('legal.company.name')}</h2>
            <div className="space-y-2 text-sm">
              <p><strong>{t('legal.company.form')}</strong></p>
              <p><strong>{t('legal.company.capital')}</strong></p>
              <p><strong>{t('legal.company.address')}</strong></p>
              <p><strong>SIREN :</strong> {t('legal.company.siren')}</p>
              <p><strong>{t('legal.company.rcs')}</strong></p>
              <p><strong>Email :</strong> <a href={`mailto:${t('legal.company.email')}`} className={`text-${current.color}-600 hover:underline`}>{t('legal.company.email')}</a></p>
            </div>
          </div>
        </section>

        {/* Contenu spécifique selon le type */}
        {type === 'terms' && (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('legal.terms.sections.presentation.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.terms.sections.presentation.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('legal.terms.sections.services.title')}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🖼️ {t('landing.features.image.title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.terms.sections.services.imageAnalysis')}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🎥 {t('landing.features.video.title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.terms.sections.services.videoAnalysis')}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">📝 {t('legal.terms.sections.services.certificates')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.terms.sections.services.history')}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('legal.terms.sections.usage.title')}</h2>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>{t('legal.terms.sections.usage.illegal')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>{t('legal.terms.sections.usage.harm')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>{t('legal.terms.sections.usage.reverse')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>{t('legal.terms.sections.usage.overload')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>{t('legal.terms.sections.usage.resell')}</span>
                  </li>
                </ul>
              </div>
            </section>
          </>
        )}

        {type === 'sales' && (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('legal.terms.sections.pricing.title')}</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{t('settings.plans.free')}</h3>
                    <span className="text-2xl font-bold text-green-600">{t('pricing.free')}</span>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>✓ {t('legal.terms.sections.pricing.freePlan')}</li>
                  </ul>
                </div>

                <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{t('settings.plans.pro')}</h3>
                    <span className="text-2xl font-bold text-blue-600">€9.99{t('pricing.perMonth')}</span>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>✓ {t('legal.terms.sections.pricing.paidPlans')}</li>
                  </ul>
                </div>

                <div className="border border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{t('settings.plans.business')}</h3>
                    <span className="text-2xl font-bold text-purple-600">€29.99{t('pricing.perMonth')}</span>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>✓ {t('legal.terms.sections.services.api')}</li>
                    <li>✓ {t('pricing.unlimited')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('legal.privacy.sections.security.title')}</h2>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <p className="mb-4">
                  <strong>🔒 {t('landing.footer.stripe')}</strong>
                </p>
                <ul className="space-y-2 text-sm">
                  {t('legal.privacy.sections.security.items', { returnObjects: true }).map((item, i) => (
                    <li key={i}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('legal.terms.sections.pricing.refund').split(':')[0]}</h2>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('legal.terms.sections.pricing.refund')}
                </p>
              </div>
            </section>
          </>
        )}

        {type === 'legal' && (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('legal.mentions.sections.hosting.title')}</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Vercel Inc.</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.mentions.sections.hosting.frontend')}<br />
                    <a href="https://vercel.com" className="text-blue-600 hover:underline">vercel.com</a>
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Render Services Inc.</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.mentions.sections.hosting.backend')}<br />
                    <a href="https://render.com" className="text-blue-600 hover:underline">render.com</a>
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Neon Inc.</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('legal.mentions.sections.hosting.database')}<br />
                    <a href="https://neon.tech" className="text-blue-600 hover:underline">neon.tech</a>
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('legal.privacy.sections.legalInfo.title')}</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <p className="mb-4">
                  <strong>{t('legal.privacy.sections.legalInfo.content')}</strong><br />
                  <strong>DPO :</strong> <a href={`mailto:${t('legal.company.dpo')}`} className="text-blue-600 hover:underline">{t('legal.company.dpo')}</a>
                </p>
                <p className="text-sm">
                  {t('legal.privacy.sections.rights.intro')} <a href="/legal/privacy" className="text-blue-600 hover:underline">{t('legal.privacy.title')}</a>.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">CNIL</h2>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Commission Nationale de l'Informatique et des Libertés</strong><br />
                  3 Place de Fontenoy, TSA 80715<br />
                  75334 PARIS CEDEX 07<br />
                  <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cnil.fr</a>
                </p>
              </div>
            </section>
          </>
        )}

        {/* Limitation de responsabilité (commune à tous) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">⚠️ {t('legal.terms.sections.liability.title')}</h2>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <p className="font-semibold mb-2">{t('legal.terms.sections.liability.accuracy')}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('legal.terms.sections.liability.damages')}
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('legal.terms.sections.contact.title')}</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <p className="mb-2">
              <strong>Email :</strong>{' '}
              <a href={`mailto:${t('legal.company.email')}`} className="text-blue-600 hover:underline">
                {t('legal.company.email')}
              </a>
            </p>
            <p>
              <strong>{t('legal.company.address')}</strong>
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>{t('landing.footer.gdpr')}</p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
