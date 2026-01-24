import { useTranslation } from 'react-i18next';
import { Shield, Scale, Lock, Eye, Database, UserX, Mail, FileText, Check, UserCheck, CreditCard, AlertCircle, Copyright, ShieldAlert, Landmark } from 'lucide-react';

/**
 * Page Conditions Générales d'Utilisation (CGU)
 * Conformité RGPD et légale française - Multilingue
 */
export default function TermsOfService() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4">
            <Scale size={16} />
            {t('legal.documentLabel')}
          </div>
          <h1 className="text-4xl font-black text-white mb-4">
            {t('legal.terms.title')}
          </h1>
          <p className="text-white/60">
            {t('legal.lastUpdate')}: 28 {t('legal.terms.sections.presentation.content.dateMonth')} 2025
          </p>
        </div>

        {/* Content */}
        <div className="card space-y-8">
          {/* 1. Présentation */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              {t('legal.terms.sections.presentation.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                <strong className="text-white">FakeTect</strong> {t('legal.terms.sections.presentation.content.description')}
              </p>
              <p>
                <strong>{t('legal.terms.sections.presentation.content.editor')}:</strong> {t('legal.company.name')}<br />
                <strong>{t('legal.terms.sections.presentation.content.address')}:</strong> {t('legal.company.address')}<br />
                <strong>{t('legal.terms.sections.presentation.content.email')}:</strong> {t('legal.company.email')}<br />
                <strong>{t('legal.terms.sections.presentation.content.hosting')}:</strong> {t('legal.company.hosting')}
              </p>
            </div>
          </section>

          {/* 2. Acceptation */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Check size={24} className="text-green-400" />
              {t('legal.terms.sections.acceptance.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>{t('legal.terms.sections.acceptance.content.paragraph1')}</p>
              <p>
                {t('legal.terms.sections.acceptance.content.paragraph2')}{' '}
                <a href="/legal/privacy" className="text-primary hover:underline">
                  {t('legal.privacy.title')}
                </a>.
              </p>
            </div>
          </section>

          {/* 3. Services proposés */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={24} className="text-blue-400" />
              {t('legal.terms.sections.services.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>{t('legal.terms.sections.services.content.intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>{t('legal.terms.sections.services.content.imageAnalysis')}</strong></li>
                <li><strong>{t('legal.terms.sections.services.content.videoAnalysis')}</strong></li>
                <li><strong>{t('legal.terms.sections.services.content.certificates')}</strong></li>
                <li><strong>{t('legal.terms.sections.services.content.history')}</strong></li>
                <li><strong>{t('legal.terms.sections.services.content.api')}</strong></li>
              </ul>
            </div>
          </section>

          {/* 4. Inscription et compte */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <UserCheck size={24} className="text-purple-400" />
              {t('legal.terms.sections.account.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p><strong>{t('legal.terms.sections.account.content.eligibility')}</strong></p>
              <p><strong>{t('legal.terms.sections.account.content.accountInfo')}</strong></p>
              <p><strong>{t('legal.terms.sections.account.content.security')}</strong></p>
              <p><strong>{t('legal.terms.sections.account.content.deletion')}</strong></p>
            </div>
          </section>

          {/* 5. Plans et tarifs */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard size={24} className="text-yellow-400" />
              {t('legal.terms.sections.pricing.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p><strong>{t('legal.terms.sections.pricing.content.freePlan')}</strong></p>
              <p><strong>{t('legal.terms.sections.pricing.content.paidPlans')}</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t('legal.terms.sections.pricing.content.starter')}</li>
                <li>{t('legal.terms.sections.pricing.content.pro')}</li>
                <li>{t('legal.terms.sections.pricing.content.business')}</li>
                <li>{t('legal.terms.sections.pricing.content.enterprise')}</li>
              </ul>
              <p><strong>{t('legal.terms.sections.pricing.content.payment')}</strong></p>
              <p><strong>{t('legal.terms.sections.pricing.content.renewal')}</strong></p>
              <p><strong>{t('legal.terms.sections.pricing.content.refund')}</strong></p>
            </div>
          </section>

          {/* 6. Utilisation acceptable */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle size={24} className="text-red-400" />
              {t('legal.terms.sections.usage.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>{t('legal.terms.sections.usage.content.intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('legal.terms.sections.usage.content.prohibited1')}</li>
                <li>{t('legal.terms.sections.usage.content.prohibited2')}</li>
                <li>{t('legal.terms.sections.usage.content.prohibited3')}</li>
                <li>{t('legal.terms.sections.usage.content.prohibited4')}</li>
                <li>{t('legal.terms.sections.usage.content.prohibited5')}</li>
                <li>{t('legal.terms.sections.usage.content.prohibited6')}</li>
              </ul>
              <p className="text-yellow-400 font-semibold">
                ⚠️ {t('legal.terms.sections.usage.content.warning')}
              </p>
            </div>
          </section>

          {/* 7. Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Copyright size={24} className="text-cyan-400" />
              {t('legal.terms.sections.intellectual.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p><strong>{t('legal.terms.sections.intellectual.content.ourRights')}</strong></p>
              <p><strong>{t('legal.terms.sections.intellectual.content.yourContent')}</strong></p>
              <p><strong>{t('legal.terms.sections.intellectual.content.deletion')}</strong></p>
            </div>
          </section>

          {/* 8. Limitation de responsabilité */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={24} className="text-orange-400" />
              {t('legal.terms.sections.liability.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p><strong>{t('legal.terms.sections.liability.content.accuracy')}</strong></p>
              <p><strong>{t('legal.terms.sections.liability.content.availability')}</strong></p>
              <p><strong>{t('legal.terms.sections.liability.content.damages')}</strong></p>
              <p className="text-white font-semibold">
                {t('legal.terms.sections.liability.content.asIs')}
              </p>
            </div>
          </section>

          {/* 9. Résiliation */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <UserX size={24} className="text-red-400" />
              {t('legal.terms.sections.termination.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p><strong>{t('legal.terms.sections.termination.content.byYou')}</strong></p>
              <p><strong>{t('legal.terms.sections.termination.content.byUs')}</strong></p>
              <p><strong>{t('legal.terms.sections.termination.content.effect')}</strong></p>
            </div>
          </section>

          {/* 10. Loi applicable */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Landmark size={24} className="text-blue-400" />
              {t('legal.terms.sections.law.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>{t('legal.terms.sections.law.content.governing')}</p>
              <p>{t('legal.terms.sections.law.content.disputes')}</p>
              <p>
                {t('legal.terms.sections.law.content.gdpr')}{' '}
                <a href="/legal/privacy" className="text-primary hover:underline">
                  {t('legal.privacy.title')}
                </a>.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t border-white/10 pt-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail size={24} className="text-green-400" />
              {t('legal.terms.sections.contact.title')}
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>{t('legal.terms.sections.contact.content.intro')}</p>
              <ul className="space-y-1">
                <li><strong>Email:</strong> <a href="mailto:contact@faketect.com" className="text-primary hover:underline">contact@faketect.com</a></li>
                <li><strong>Support:</strong> {t('legal.terms.sections.contact.content.support')}</li>
                <li><strong>DPO (RGPD):</strong> dpo@faketect.com</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-8 flex justify-center gap-4 text-sm">
          <a href="/legal/privacy" className="text-primary hover:underline">
            {t('legal.privacy.title')}
          </a>
          <span className="text-white/20">•</span>
          <a href="/legal/cookies" className="text-primary hover:underline">
            {t('legal.cookiesPage.title')}
          </a>
          <span className="text-white/20">•</span>
          <a href="/" className="text-white/60 hover:text-white">
            {t('legal.terms.sections.contact.content.backHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
