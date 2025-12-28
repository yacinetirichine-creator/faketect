const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Rate limiter global pour toutes les API
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par IP
  message: 'Trop de requêtes, veuillez réessayer dans 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl
    });
    res.status(429).json({ 
      error: 'Trop de requêtes, veuillez réessayer dans 15 minutes' 
    });
  }
});

// Rate limiter strict pour l'authentification (prévention brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  skipSuccessfulRequests: true, // Ne compte que les échecs
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email
    });
    res.status(429).json({ 
      error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes' 
    });
  }
});

// Rate limiter pour les analyses (prévention abus)
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 analyses par minute max
  message: 'Trop d\'analyses, veuillez ralentir',
  handler: (req, res) => {
    logger.warn('Analysis rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });
    res.status(429).json({ 
      error: 'Trop d\'analyses, veuillez ralentir' 
    });
  }
});

// Rate limiter pour les uploads (protection serveur)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads par minute
  message: 'Trop d\'uploads, veuillez patienter',
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });
    res.status(429).json({ 
      error: 'Trop d\'uploads, veuillez patienter' 
    });
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  analysisLimiter,
  uploadLimiter
};
