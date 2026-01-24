import { useState, useEffect, useCallback } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function NewsletterSubscribe() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Cleanup timer pour éviter memory leak
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      await api.post('/newsletter/subscribe', {
        email,
        language: i18n.language || 'fr',
        interests: ['product_updates', 'case_studies', 'statistics'],
        source: 'website'
      });

      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Newsletter error:', err);
      setError(err.response?.data?.error || t('newsletter.error'));
    } finally {
      setIsLoading(false);
    }
  }, [email, isLoading, i18n.language, t]);

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Mail className="text-primary" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-white mb-1">{t('newsletter.title')}</h3>
          <p className="text-sm text-gray-400">{t('newsletter.subtitle')}</p>
        </div>
      </div>

      <ul className="space-y-1.5 mb-4">
        <li className="text-xs text-gray-300">{t('newsletter.benefits.updates')}</li>
        <li className="text-xs text-gray-300">{t('newsletter.benefits.cases')}</li>
        <li className="text-xs text-gray-300">{t('newsletter.benefits.stats')}</li>
      </ul>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder')}
            disabled={isLoading || success}
            className="w-full px-4 py-2.5 bg-surface/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 text-sm"
            required
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {success ? (
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <Check size={16} />
            {t('newsletter.success')}
          </div>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {t('common.loading')}
              </>
            ) : (
              t('newsletter.button')
            )}
          </button>
        )}
      </form>
    </div>
  );
}
