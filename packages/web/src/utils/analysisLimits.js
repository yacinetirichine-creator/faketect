/**
 * Système de limitation des analyses selon le plan d'abonnement
 */

// Limites par plan
export const PLAN_LIMITS = {
  free: {
    daily: 3,              // 3 analyses par jour
    monthly: null,         // Pas de limite mensuelle
    features: ['image'],   // Seulement images
    batch: false,          // Pas de batch
    video: false,          // Pas de vidéo
    documents: false,      // Pas de documents
    url: true,             // Analyse URL
  },
  starter: {
    daily: null,           // Pas de limite quotidienne
    monthly: 100,          // 100 analyses par mois
    features: ['image', 'document', 'url'], // Images, documents, URL
    batch: false,          // Pas de batch
    video: false,          // Pas de vidéo
    documents: true,       // Documents PDF, Word, etc.
    url: true,
  },
  pro: {
    daily: null,
    monthly: 500,          // 500 analyses par mois
    features: ['image', 'video', 'document', 'url', 'batch'],
    batch: true,           // Batch 20 fichiers
    batchLimit: 20,
    video: true,           // Vidéos
    documents: true,
    url: true,
  },
  business: {
    daily: null,
    monthly: 2000,         // 2000 analyses par mois
    features: ['image', 'video', 'document', 'url', 'batch'],
    batch: true,           // Batch 50 fichiers
    batchLimit: 50,
    video: true,
    documents: true,
    url: true,
  },
  enterprise: {
    daily: null,
    monthly: null,         // Illimité
    features: ['image', 'video', 'document', 'url', 'batch'],
    batch: true,           // Batch illimité
    batchLimit: 1000,
    video: true,
    documents: true,
    url: true,
  }
}

/**
 * Vérifier si une fonctionnalité est autorisée pour un plan
 */
export function canUseFeature(planType, feature) {
  const plan = PLAN_LIMITS[planType?.toLowerCase()] || PLAN_LIMITS.free
  
  switch (feature) {
    case 'video':
      return plan.video
    case 'batch':
      return plan.batch
    case 'document':
      return plan.documents
    case 'url':
      return plan.url
    default:
      return plan.features?.includes(feature)
  }
}

/**
 * Obtenir la limite mensuelle pour un plan
 */
export function getMonthlyLimit(planType) {
  const plan = PLAN_LIMITS[planType?.toLowerCase()] || PLAN_LIMITS.free
  return plan.monthly || 'Illimité'
}

/**
 * Obtenir la limite quotidienne pour un plan
 */
export function getDailyLimit(planType) {
  const plan = PLAN_LIMITS[planType?.toLowerCase()] || PLAN_LIMITS.free
  return plan.daily || null
}

/**
 * Obtenir la limite de batch pour un plan
 */
export function getBatchLimit(planType) {
  const plan = PLAN_LIMITS[planType?.toLowerCase()] || PLAN_LIMITS.free
  return plan.batchLimit || 1
}

/**
 * Vérifier si l'utilisateur a épuisé sa limite
 * @param {Object} quota - { remaining, total, plan_type }
 * @returns {boolean}
 */
export function isQuotaExhausted(quota) {
  if (!quota) return false
  return quota.remaining === 0
}

/**
 * Vérifier si l'utilisateur est proche de sa limite
 * @param {Object} quota - { remaining, total, plan_type }
 * @returns {boolean}
 */
export function isQuotaAlmostExhausted(quota) {
  if (!quota) return false
  const remainingPercentage = (quota.remaining / quota.total) * 100
  return remainingPercentage < 10 // Alerte si moins de 10%
}

/**
 * Obtenir le message d'erreur approprié
 */
export function getQuotaExceededMessage(planType, locale = 'fr') {
  const messages = {
    fr: {
      free: 'Quota gratuit épuisé (3 analyses/jour). Upgrade vers un plan payant.',
      starter: 'Quota Starter épuisé (100/mois). Upgrade vers Pro.',
      pro: 'Quota Pro épuisé (500/mois). Upgrade vers Business.',
      business: 'Quota Business épuisé (2000/mois). Contact pour Enterprise.',
      enterprise: 'Quota Enterprise atteint. Contactez le support.'
    },
    en: {
      free: 'Free quota exhausted (3 analyses/day). Upgrade to a paid plan.',
      starter: 'Starter quota exhausted (100/month). Upgrade to Pro.',
      pro: 'Pro quota exhausted (500/month). Upgrade to Business.',
      business: 'Business quota exhausted (2000/month). Contact for Enterprise.',
      enterprise: 'Enterprise quota reached. Contact support.'
    }
  }
  
  const msgs = messages[locale] || messages.fr
  return msgs[planType?.toLowerCase()] || msgs.free
}

/**
 * Vérifier les permissions de fichier selon le plan
 */
export function canUploadFile(planType, fileType) {
  const plan = PLAN_LIMITS[planType?.toLowerCase()] || PLAN_LIMITS.free
  
  if (fileType.startsWith('image/')) {
    return plan.features?.includes('image')
  }
  
  if (fileType.startsWith('video/')) {
    return plan.video
  }
  
  if (fileType === 'application/pdf' || 
      fileType.includes('word') || 
      fileType.includes('spreadsheet') ||
      fileType.includes('presentation')) {
    return plan.documents
  }
  
  return false
}

/**
 * Formater le statut de quota pour l'UI
 */
export function formatQuotaStatus(quota, planType) {
  if (!quota) return null
  
  const monthlyLimit = getMonthlyLimit(planType)
  const percentage = Math.round((quota.remaining / quota.total) * 100)
  
  return {
    remaining: quota.remaining,
    total: quota.total,
    percentage,
    monthlyLimit,
    status: percentage > 50 ? 'good' : percentage > 20 ? 'warning' : 'danger'
  }
}

export default {
  PLAN_LIMITS,
  canUseFeature,
  getMonthlyLimit,
  getDailyLimit,
  getBatchLimit,
  isQuotaExhausted,
  isQuotaAlmostExhausted,
  getQuotaExceededMessage,
  canUploadFile,
  formatQuotaStatus
}
