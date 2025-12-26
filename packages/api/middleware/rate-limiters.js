/**
 * 🔒 Rate Limiter Configuration
 * Limites strictes par endpoint pour anti-abus
 */
const rateLimit = require('express-rate-limit');

// Limiter général (toutes les routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requêtes par 15 min
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ne pas limiter les health checks et quota (endpoints critiques)
    // Note: selon le mount Express, req.path peut être '/health'/'/quota'.
    const p = req.path;
    const o = req.originalUrl;
    return (
      p === '/api/health' || p === '/health' || o === '/api/health' ||
      p === '/api/quota' || p === '/quota' || o === '/api/quota'
    );
  },
  keyGenerator: (req) => {
    // Utiliser l'ID utilisateur si authentifié, sinon l'IP
    return req.user?.id || req.ip;
  }
});

// Limiter login (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 tentatives par 15 min
  message: 'Trop de tentatives de connexion échouées. Réessayez dans 15 minutes.',
  skipSuccessfulRequests: true, // Ne pas compter les réussites
  keyGenerator: (req) => {
    return req.body?.email || req.ip;
  }
});

// Limiter signup (anti spam)
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // Max 5 inscriptions par heure par IP
  message: 'Trop d\'inscriptions depuis cette IP. Réessayez demain.',
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.ip
});

// Limiter analyse (par utilisateur)
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 analyses par minute
  message: 'Trop d\'analyses. Ralentissez svp.',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Limiter batch (plus strict)
const batchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2, // Max 2 batch par 5 min
  message: 'Trop d\'analyses par lot. Attendez avant d\'envoyer une autre.',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Limiter vidéo (très strict, coûteux)
const videoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Max 3 vidéos par heure
  message: 'Limite vidéo atteinte (3/heure)',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Limiter upload fichiers
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Max 20 uploads par 15 min
  message: 'Trop d\'uploads. Ralentissez.',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Limiter API externe (calls à Sightengine, Illuminarty)
const externalAPILimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Max 15 calls par minute (pour respecter quotas API)
  message: 'Service temporairement limité',
  skipFailedRequests: true,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Limiter password reset (anti spam)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Max 3 resets par heure
  message: 'Trop de demandes de réinitialisation. Réessayez plus tard.',
  keyGenerator: (req) => {
    return req.body?.email || req.ip;
  }
});

// Limiter payment (anti fraud)
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 tentatives de paiement par minute
  message: 'Trop de tentatives de paiement',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Limiter admin actions (très strict)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // Max 30 actions par minute
  message: 'Limite admin dépassée',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

module.exports = {
  globalLimiter,
  loginLimiter,
  signupLimiter,
  analysisLimiter,
  batchLimiter,
  videoLimiter,
  uploadLimiter,
  externalAPILimiter,
  passwordResetLimiter,
  paymentLimiter,
  adminLimiter
};
