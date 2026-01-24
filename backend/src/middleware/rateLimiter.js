const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../config/logger');

/**
 * Rate Limiting & Anti-Spam Protection
 * Protection multi-niveaux contre abus, DDoS et spam
 */

// Rate limiter global pour toutes les API
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requêtes max par IP (augmenté pour usage normal)
  message: 'Trop de requêtes, veuillez réessayer dans 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health', // Skip health checks
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
    });
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de requêtes, veuillez réessayer dans 15 minutes',
      retryAfter: '15 minutes',
    });
  },
});

// Rate limiter strict pour l'authentification (prévention brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives max (augmenté pour UX)
  skipSuccessfulRequests: true, // Ne compte que les échecs
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown',
    });
    res.status(429).json({
      error: 'AUTH_RATE_LIMIT',
      message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
    });
  },
});

// Protection pour création de comptes (anti-spam signups)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // 5 inscriptions max par IP/heure
  message: 'Trop d\'inscriptions, veuillez réessayer dans 1 heure',
  handler: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown',
    });
    res.status(429).json({
      error: 'REGISTER_RATE_LIMIT',
      message: 'Trop d\'inscriptions depuis cette adresse IP. Réessayez dans 1 heure.',
    });
  },
});

// Rate limiter pour les analyses (prévention abus)
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 analyses par minute max
  message: 'Trop d\'analyses, veuillez ralentir',
  handler: (req, res) => {
    logger.warn('Analysis rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
    });
    res.status(429).json({
      error: 'ANALYSIS_RATE_LIMIT',
      message: 'Trop d\'analyses, réessayez dans 1 minute',
    });
  },
});

// Rate limiter pour les uploads (protection serveur)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads par minute
  message: 'Trop d\'uploads, veuillez patienter',
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
    });
    res.status(429).json({
      error: 'UPLOAD_RATE_LIMIT',
      message: 'Trop de fichiers uploadés, réessayez dans 1 minute',
    });
  },
});

// Protection routes admin (accès restreint)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requêtes admin max
  message: 'Trop de requêtes admin',
  handler: (req, res) => {
    logger.warn('Admin rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.originalUrl,
    });
    res.status(429).json({
      error: 'ADMIN_RATE_LIMIT',
      message: 'Trop de requêtes admin. Réessayez dans 15 minutes.',
    });
  },
});

// Protection paiements Stripe (anti-fraude)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 tentatives de paiement max
  message: 'Trop de tentatives de paiement',
  handler: (req, res) => {
    logger.warn('Payment rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
    });
    res.status(429).json({
      error: 'PAYMENT_RATE_LIMIT',
      message: 'Trop de tentatives de paiement. Contactez le support si besoin.',
    });
  },
});

// Protection webhooks Stripe (flood protection)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhooks/min (Stripe peut envoyer en rafale)
  message: 'Trop de webhooks reçus',
  handler: (req, res) => {
    logger.warn('Webhook rate limit exceeded', {
      ip: req.ip,
      type: req.headers['stripe-signature'] ? 'stripe' : 'unknown',
    });
    res.status(429).json({
      error: 'WEBHOOK_RATE_LIMIT',
      message: 'Trop de webhooks reçus',
    });
  },
});

// Protection reset password (anti-spam)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 reset password max/heure
  message: 'Trop de demandes de réinitialisation',
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown',
    });
    res.status(429).json({
      error: 'PASSWORD_RESET_RATE_LIMIT',
      message: 'Trop de demandes de réinitialisation. Réessayez dans 1 heure.',
    });
  },
});

// Protection DDoS ultra-stricte (dernier rempart)
const ddosProtection = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requêtes/min global (bloque DDoS)
  message: 'Activité suspecte détectée',
  handler: (req, res) => {
    logger.error('Possible DDoS attack detected', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'],
    });
    res.status(429).json({
      error: 'DDOS_PROTECTION',
      message: 'Activité suspecte détectée. Accès temporairement bloqué.',
    });
  },
});

// Slow-down middleware (ralentit progressivement avant hard limit)
const apiSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Ralentir après 50 requêtes
  delayMs: (hits) => hits * 100, // +100ms par requête supplémentaire
  maxDelayMs: 5000, // Max 5s de délai
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  registerLimiter,
  analysisLimiter,
  uploadLimiter,
  adminLimiter,
  paymentLimiter,
  webhookLimiter,
  passwordResetLimiter,
  ddosProtection,
  apiSlowDown,
};
