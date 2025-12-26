import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Crown, Package, Loader2, AlertCircle, Building2, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getQuota, createCheckoutSession } from '../utils/api'
import useTranslation from '../hooks/useTranslation'

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: 'pour toujours',
    description: 'Pour découvrir FakeTect',
    icon: Package,
    color: 'from-gray-500 to-gray-600',
    features: [
      '3 analyses par jour',
      'Images uniquement (JPG, PNG, WebP)',
      'Historique 7 jours',
      'Support communautaire'
    ],
    cta: 'Commencer gratuitement',
    free: true
  },
  {
    id: 'starter-monthly',
    name: 'Starter',
    price: '12€',
    period: 'par mois',
    description: 'Pour les indépendants',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY,
    features: [
      '100 analyses par mois',
      'Images + Documents (PDF, Word)',
      'Analyse par URL',
      'Historique 30 jours',
      'Support email'
    ],
    cta: 'Choisir Starter'
  },
  {
    id: 'pro-monthly',
    name: 'Pro',
    price: '34€',
    period: 'par mois',
    description: 'Pour les professionnels',
    icon: Crown,
    color: 'from-primary-500 to-primary-600',
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
    features: [
      '500 analyses par mois',
      'Tous types de fichiers',
      'Analyse batch (20 fichiers)',
      'Rapports PDF détaillés',
      'Métadonnées EXIF',
      'Accès API',
      'Historique illimité',
      'Support prioritaire'
    ],
    cta: 'Choisir Pro',
    popular: true
  },
  {
    id: 'business-monthly',
    name: 'Business',
    price: '89€',
    period: 'par mois',
    description: 'Pour les entreprises',
    icon: Building2,
    color: 'from-purple-500 to-purple-600',
    priceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY,
    features: [
      '2000 analyses par mois',
      'Tous types de fichiers',
      'Analyse batch (50 fichiers)',
      'Certificats d\'authenticité',
      'API dédiée',
      'Rapports PDF personnalisés',
      'Multi-utilisateurs (5 comptes)',
      'Support prioritaire 24h'
    ],
    cta: 'Choisir Business'
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise',
    price: '249€',
    period: 'par mois',
    description: 'Solution sur mesure',
    icon: Building2,
    color: 'from-amber-500 to-amber-600',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY,
    features: [
      'Analyses illimitées',
      'Tous types de fichiers',
      'API avec SLA 99.9%',
      'Certificats juridiques',
      'Intégration personnalisée',
      'Multi-utilisateurs illimité',
      'Gestionnaire de compte dédié',
      'Support 24/7',
      'Formation équipe incluse',
      'Conformité RGPD garantie'
    ],
    cta: 'Contacter les ventes',
    badge: 'Premium'
  }
]

const PACKS = [
  {
    id: 'starter-yearly',
    name: 'Starter Annuel',
    price: '99€',
    period: 'par an',
    savings: 'Économisez 45€',
    analyses: '1200 analyses/an',
    priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER_YEARLY,
    description: 'Engagement annuel'
  },
  {
    id: 'pro-yearly',
    name: 'Pro Annuel',
    price: '290€',
    period: 'par an',
    savings: 'Économisez 118€',
    analyses: '6000 analyses/an',
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY,
    description: 'Meilleur rapport qualité/prix',
    popular: true
  },
  {
    id: 'business-yearly',
    name: 'Business Annuel',
    price: '790€',
    period: 'par an',
    savings: 'Économisez 278€',
    analyses: '24000 analyses/an',
    priceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_YEARLY,
    description: 'Engagement annuel'
  }
]

export default function PricingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, getAccessToken } = useAuth()
  const [quota, setQuota] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [processingPriceId, setProcessingPriceId] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadQuota()
    }
  }, [isAuthenticated])

  const loadQuota = async () => {
    try {
      const data = await getQuota()
      setQuota(data?.quota)
    } catch (err) {
      console.error('Error loading quota:', err)
    }
  }

  const handleSelectPlan = async (plan) => {
    if (plan.free) {
      if (!isAuthenticated) {
        navigate('/signup')
      }
      return
    }

    if (plan.enterprise) {
      window.location.href = 'mailto:contact@faketect.com?subject=Demande Entreprise - FakeTect&body=Bonjour,%0D%0A%0D%0AJe suis intéressé par l\'offre Entreprise.%0D%0A%0D%0ANom de l\'entreprise :%0D%0ATaille de l\'équipe :%0D%0ABesoins spécifiques :%0D%0A%0D%0ACordialement'
      return
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pricing', reason: 'upgrade' } })
      return
    }

    if (!plan.priceId) {
      setError('Configuration de paiement manquante')
      return
    }

    setProcessingPriceId(plan.priceId)
    setError(null)

    try {
      const token = getAccessToken()
      const origin = window.location.origin
      const session = await createCheckoutSession({
        priceId: plan.priceId,
        planName: plan.name,
        successUrl: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/pricing`,
        token
      })
      window.location.href = session.session_url || session.url
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.response?.data?.message || 'Erreur lors de la création de la session de paiement')
      setProcessingPriceId(null)
    }
  }

  return (
    <div className="py-12 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            {t('pricing.title', 'Choisissez votre plan')}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t('pricing.subtitle', 'Des analyses illimitées pour détecter les deepfakes et protéger votre contenu')}
          </p>
        </motion.div>

        {/* Current Quota */}
        {isAuthenticated && quota && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto mb-8 p-4 bg-dark-200/50 border border-dark-300 rounded-lg backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{t('pricing.currentQuota', 'Votre quota actuel')}</p>
                <p className="text-2xl font-bold text-white">
                  {quota.remaining} / {quota.limit || quota.total}
                </p>
                {quota.plan_type && (
                  <p className="text-xs text-primary-400 mt-1">{t('pricing.plan', 'Plan')} {quota.plan_type}</p>
                )}
              </div>
              {quota.renewal_date && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">{t('pricing.renewal', 'Renouvellement')}</p>
                  <p className="text-sm text-gray-300">
                    {new Date(quota.renewal_date).toLocaleDateString(t('common.locale', 'fr-FR'))}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon
            const isProcessing = processingPriceId === plan.priceId

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-dark-200/50 border backdrop-blur-sm rounded-2xl p-8 hover:scale-105 transition-all duration-300 ${
                  plan.popular ? 'border-primary-500 shadow-lg shadow-primary-500/20' : 'border-dark-300'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-primary-500 text-white text-xs font-bold rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {plan.popular && !plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">
                      Populaire
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Header */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-green-400 text-sm font-semibold mt-1">{plan.savings}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/30'
                      : plan.badge
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                      : plan.enterprise
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                      : 'bg-dark-300 hover:bg-dark-400 text-white'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      {plan.enterprise && <Mail className="w-4 h-4" />}
                      {plan.cta}
                    </>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* Annual Offers Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              Offres Annuelles
            </h2>
            <p className="text-gray-400">
              Économisez jusqu'à 30% avec nos offres annuelles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKS.map((pack, index) => {
              const isProcessing = processingPriceId === pack.priceId

              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`relative bg-dark-200/50 border backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-all duration-300 ${
                    pack.popular ? 'border-primary-500' : 'border-dark-300'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 right-4">
                      <span className="px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">
                        Populaire
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{pack.description}</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">{pack.price}</span>
                    </div>
                    <p className="text-primary-400 font-semibold">
                      {pack.analyses} analyses
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {(parseFloat(pack.price) / pack.analyses).toFixed(2)}€ / analyse
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(pack)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      pack.popular
                        ? 'bg-primary-500 hover:bg-primary-600 text-white'
                        : 'bg-dark-300 hover:bg-dark-400 text-white'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirection...
                      </>
                    ) : (
                      'Acheter'
                    )}
                  </button>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* FAQ/Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 max-w-3xl mx-auto text-center"
        >
          <div className="bg-dark-200/30 border border-dark-300 rounded-xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4">Questions fréquentes</h3>
            <div className="space-y-4 text-left">
              <div>
                <p className="font-semibold text-white mb-1">Les packs expirent-ils ?</p>
                <p className="text-gray-400 text-sm">
                  Non, les packs de crédits n'expirent jamais. Vous pouvez les utiliser quand vous voulez.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Puis-je annuler mon abonnement ?</p>
                <p className="text-gray-400 text-sm">
                  Oui, vous pouvez annuler à tout moment depuis votre compte. Vous garderez l'accès jusqu'à la fin de votre période de facturation.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Quels moyens de paiement acceptez-vous ?</p>
                <p className="text-gray-400 text-sm">
                  Nous acceptons toutes les cartes bancaires (Visa, Mastercard, Amex) via notre partenaire sécurisé Stripe.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
