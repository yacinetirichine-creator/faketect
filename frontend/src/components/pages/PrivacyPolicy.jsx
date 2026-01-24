import { useTranslation } from 'react-i18next';
import { Shield, Lock, Database, UserCheck, Mail, FileText, ExternalLink } from 'lucide-react';

/**
 * Page Politique de Confidentialité
 * Conformité RGPD - Multilingue
 */
const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('legal.privacy.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('legal.lastUpdate')}: 28 {t('legal.terms.sections.presentation.content.dateMonth')} 2025
          </p>
        </div>

        {/* Informations légales */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            {t('legal.privacy.sections.legalInfo.title')}
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <p className="font-semibold mb-2">{t('legal.company.name')}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('legal.company.form')} {t('legal.company.capital')}<br />
              {t('legal.privacy.sections.legalInfo.content.headquarters')}: {t('legal.company.address')}<br />
              {t('legal.company.siren')}<br />
              {t('legal.company.rcs')}
            </p>
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <strong>Email:</strong> <a href="mailto:contact@faketect.com" className="text-blue-600 hover:underline">contact@faketect.com</a><br />
                <strong>DPO:</strong> <a href="mailto:dpo@faketect.com" className="text-blue-600 hover:underline">dpo@faketect.com</a>
              </p>
            </div>
          </div>
        </section>

        {/* Données collectées */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Database className="w-6 h-6 mr-2" />
            {t('legal.privacy.sections.dataCollected.title')}
          </h2>
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{t('legal.privacy.sections.dataCollected.content.identification.title')}</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>{t('legal.privacy.sections.dataCollected.content.identification.name')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.identification.email')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.identification.password')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.identification.language')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.identification.subscription')}</li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{t('legal.privacy.sections.dataCollected.content.payment.title')}</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>{t('legal.privacy.sections.dataCollected.content.payment.billing')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.payment.history')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.payment.stripeId')}</li>
              </ul>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                ⚠️ {t('legal.privacy.sections.dataCollected.content.payment.stripeNote')}
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{t('legal.privacy.sections.dataCollected.content.usage.title')}</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>{t('legal.privacy.sections.dataCollected.content.usage.files')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.usage.results')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.usage.history')}</li>
                <li>{t('legal.privacy.sections.dataCollected.content.usage.certificates')}</li>
              </ul>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                📅 {t('legal.privacy.sections.dataCollected.content.usage.retention')}
              </p>
            </div>
          </div>
        </section>

        {/* Vos droits RGPD */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserCheck className="w-6 h-6 mr-2" />
            {t('legal.privacy.sections.rights.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ {t('legal.privacy.sections.rights.content.access.title')}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('legal.privacy.sections.rights.content.access.description')}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ {t('legal.privacy.sections.rights.content.rectification.title')}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('legal.privacy.sections.rights.content.rectification.description')}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ {t('legal.privacy.sections.rights.content.erasure.title')}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('legal.privacy.sections.rights.content.erasure.description')}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ {t('legal.privacy.sections.rights.content.portability.title')}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('legal.privacy.sections.rights.content.portability.description')}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ {t('legal.privacy.sections.rights.content.opposition.title')}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('legal.privacy.sections.rights.content.opposition.description')}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ {t('legal.privacy.sections.rights.content.limitation.title')}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('legal.privacy.sections.rights.content.limitation.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Sécurité */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Lock className="w-6 h-6 mr-2" />
            {t('legal.privacy.sections.security.title')}
          </h2>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">🔒</span>
                <span><strong>{t('legal.privacy.sections.security.content.https')}</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">🔐</span>
                <span><strong>{t('legal.privacy.sections.security.content.bcrypt')}</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">🛡️</span>
                <span><strong>{t('legal.privacy.sections.security.content.waf')}</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">💾</span>
                <span><strong>{t('legal.privacy.sections.security.content.backups')}</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">🔍</span>
                <span><strong>{t('legal.privacy.sections.security.content.audits')}</strong></span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Mail className="w-6 h-6 mr-2" />
            {t('legal.privacy.sections.contact.title')}
          </h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.privacy.sections.contact.content.intro')}
            </p>
            <div className="space-y-2">
              <p>
                <strong>Email DPO:</strong>{' '}
                <a href="mailto:dpo@faketect.com" className="text-blue-600 hover:underline">
                  dpo@faketect.com
                </a>
              </p>
              <p>
                <strong>Email contact:</strong>{' '}
                <a href="mailto:contact@faketect.com" className="text-blue-600 hover:underline">
                  contact@faketect.com
                </a>
              </p>
              <p>
                <strong>{t('legal.privacy.sections.contact.content.mail')}:</strong> {t('legal.company.name')} - DPO, {t('legal.company.address')}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{t('legal.privacy.sections.contact.content.responseTime')}:</strong> {t('legal.privacy.sections.contact.content.responseDelay')}
              </p>
            </div>
          </div>
        </section>

        {/* Réclamation CNIL */}
        <section className="mb-8">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">{t('legal.privacy.sections.cnil.title')}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('legal.privacy.sections.cnil.content.description')}
            </p>
            <p className="text-sm">
              <strong>CNIL</strong><br />
              {t('legal.privacy.sections.cnil.content.address')}<br />
              {t('legal.privacy.sections.cnil.content.phone')}<br />
              {t('legal.privacy.sections.cnil.content.website')}:{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                www.cnil.fr <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>{t('legal.privacy.footer')}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
