import { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function NewsletterSubscribe() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
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

      // Reset success message après 5s
      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Newsletter error:', err);
      setError(err.response?.data?.error || t('newsletter.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const translations = {
    fr: {
      title: 'Newsletter',
      subtitle: 'Recevez les dernières nouveautés et cas d\'usage',
      placeholder: 'Votre email',
      button: 'S\'abonner',
      success: '✓ Inscription réussie !',
      error: 'Erreur lors de l\'inscription',
      benefits: [
        '✨ Nouveautés produit',
        '📰 Cas d\'usage exclusifs',
        '📊 Statistiques mensuelles'
      ]
    },
    en: {
      title: 'Newsletter',
      subtitle: 'Get the latest updates and use cases',
      placeholder: 'Your email',
      button: 'Subscribe',
      success: '✓ Successfully subscribed!',
      error: 'Subscription error',
      benefits: [
        '✨ Product updates',
        '📰 Exclusive use cases',
        '📊 Monthly statistics'
      ]
    },
    es: {
      title: 'Newsletter',
      subtitle: 'Recibe las últimas novedades y casos de uso',
      placeholder: 'Tu email',
      button: 'Suscribirse',
      success: '✓ ¡Suscripción exitosa!',
      error: 'Error de suscripción',
      benefits: [
        '✨ Novedades del producto',
        '📰 Casos de uso exclusivos',
        '📊 Estadísticas mensuales'
      ]
    },
    de: {
      title: 'Newsletter',
      subtitle: 'Erhalten Sie die neuesten Updates und Anwendungsfälle',
      placeholder: 'Ihre E-Mail',
      button: 'Abonnieren',
      success: '✓ Erfolgreich abonniert!',
      error: 'Abonnementfehler',
      benefits: [
        '✨ Produktaktualisierungen',
        '📰 Exklusive Anwendungsfälle',
        '📊 Monatliche Statistiken'
      ]
    },
    pt: {
      title: 'Newsletter',
      subtitle: 'Receba as últimas atualizações e casos de uso',
      placeholder: 'Seu email',
      button: 'Inscrever-se',
      success: '✓ Inscrição bem-sucedida!',
      error: 'Erro de inscrição',
      benefits: [
        '✨ Atualizações de produtos',
        '📰 Casos de uso exclusivos',
        '📊 Estatísticas mensais'
      ]
    },
    it: {
      title: 'Newsletter',
      subtitle: 'Ricevi gli ultimi aggiornamenti e casi d\'uso',
      placeholder: 'La tua email',
      button: 'Iscriviti',
      success: '✓ Iscrizione riuscita!',
      error: 'Errore di iscrizione',
      benefits: [
        '✨ Aggiornamenti del prodotto',
        '📰 Casi d\'uso esclusivi',
        '📊 Statistiche mensili'
      ]
    }
  };

  const lang = i18n.language || 'fr';
  const txt = translations[lang] || translations.fr;

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Mail className="text-primary" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-white mb-1">{txt.title}</h3>
          <p className="text-sm text-gray-400">{txt.subtitle}</p>
        </div>
      </div>

      <ul className="space-y-1.5 mb-4">
        {txt.benefits.map((benefit, i) => (
          <li key={i} className="text-xs text-gray-300">{benefit}</li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={txt.placeholder}
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
            {txt.success}
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
              txt.button
            )}
          </button>
        )}
      </form>
    </div>
  );
}
