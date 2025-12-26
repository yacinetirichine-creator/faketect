const { getUser, getProfile, checkQuota } = require('../config/supabase');
const guestQuota = require('../services/guest-quota');
const metricsService = require('../services/metrics');
const auditLogger = require('../services/audit-logger');

function getConfiguredAdmins() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return false;
  const configuredAdmins = getConfiguredAdmins();
  return configuredAdmins.length > 0 ? configuredAdmins.includes(e) : e === 'contact@faketect.com';
}

async function authMiddleware(req, res, next) {
  // Triple vérification pour éviter activation accidentelle en production
  const devBypassEnabled = 
    process.env.DEV_AUTH_BYPASS === 'true' && 
    process.env.NODE_ENV === 'development' && 
    !process.env.SUPABASE_URL;
  
  if (devBypassEnabled) {
    console.warn('⚠️  Mode DEV_AUTH_BYPASS actif - ne jamais utiliser en production!');
    req.user = { id: 'dev-user', email: 'dev@test.com' };
    req.profile = { plan: 'pro', analyses_limit: 500 };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    auditLogger.loginFailed('unknown', 'MISSING_TOKEN', req.ip);
    return res.status(401).json({ error: true, message: 'Token requis' });
  }

  try {
    const user = await getUser(authHeader.split(' ')[1]);
    if (!user) {
      auditLogger.loginFailed('unknown', 'INVALID_TOKEN', req.ip);
      return res.status(401).json({ error: true, message: 'Token invalide' });
    }
    
    req.user = user;
    req.profile = await getProfile(user.id);
    req.accessToken = authHeader.split(' ')[1];

    req.isAdmin = isAdminEmail(user.email);
    if (req.isAdmin) {
      // Admin/test account: accès illimité pour faciliter les tests.
      req.profile = {
        ...(req.profile || {}),
        plan: 'enterprise',
        analyses_limit: 1000000,
        role: 'admin'
      };
    }

    auditLogger.loginSuccess(user.id, user.email, req.ip);
    next();
  } catch (error) {
    auditLogger.loginFailed('unknown', 'AUTH_ERROR: ' + error.message, req.ip);
    res.status(401).json({ error: true, message: 'Erreur d\'authentification' });
  }
}

async function optionalAuthMiddleware(req, res, next) {
  // Always attach fingerprint (even without auth) for guest quota.
  const fpHeader = req.headers['x-fingerprint'];
  req.fingerprint = typeof fpHeader === 'string' && fpHeader.trim() ? fpHeader.trim() : null;

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    req.profile = null;
    return next();
  }

  try {
    const user = await getUser(authHeader.split(' ')[1]);
    if (user) {
      req.user = user;
      req.profile = await getProfile(user.id);
      req.accessToken = authHeader.split(' ')[1];

      req.isAdmin = isAdminEmail(user.email);
      if (req.isAdmin) {
        req.profile = {
          ...(req.profile || {}),
          plan: 'enterprise',
          analyses_limit: 1000000,
          role: 'admin'
        };
      }
    }
  } catch {}
  next();
}

async function quotaMiddleware(req, res, next) {
  // Admin = analyses illimitées
  if (req.user && req.isAdmin) {
    req.quota = { allowed: true, remaining: 999999, limit: 999999, admin: true };
    return next();
  }

  // ⛔ NOUVEAU: Bloquer les analyses anonymes - inscription obligatoire
  if (!req.user) {
    metricsService.recordQuotaExceeded();
    return res.status(401).json({
      error: true,
      code: 'AUTH_REQUIRED',
      message: 'Inscription gratuite requise pour analyser. Créez un compte Free pour obtenir 3 analyses/jour gratuites.',
      action: 'signup',
      benefits: [
        '3 analyses gratuites par jour',
        'Historique de vos analyses',
        'Rapports PDF téléchargeables',
        'Accès au support'
      ]
    });
  }

  try {
    const quota = await checkQuota(req.user.id);
    if (!quota.allowed) {
      metricsService.recordQuotaExceeded();
      return res.status(429).json({ 
        error: true, 
        code: 'QUOTA_EXCEEDED',
        message: 'Limite quotidienne atteinte. Passez à un plan supérieur pour plus d\'analyses.', 
        quota,
        action: 'upgrade'
      });
    }
    req.quota = quota;
    next();
  } catch (err) {
    console.error('❌ Quota check failed:', err?.message || err);
    return res.status(503).json({
      error: true,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service quota indisponible, réessayez plus tard.'
    });
  }
}

/**
 * Middleware pour forcer l'authentification (pas d'analyses anonymes)
 */
async function requireAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: true, 
      code: 'AUTH_REQUIRED',
      message: 'Inscription gratuite requise. Créez un compte Free pour commencer.',
      action: 'signup'
    });
  }

  try {
    const user = await getUser(authHeader.split(' ')[1]);
    if (!user) {
      return res.status(401).json({ error: true, message: 'Token invalide' });
    }
    
    req.user = user;
    req.profile = await getProfile(user.id);
    req.accessToken = authHeader.split(' ')[1];
    req.isAdmin = isAdminEmail(user.email);
    
    if (req.isAdmin) {
      req.profile = {
        ...(req.profile || {}),
        plan: 'enterprise',
        analyses_limit: 1000000,
        role: 'admin'
      };
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: true, message: 'Erreur d\'authentification' });
  }
}

// Exports
module.exports = {
  authMiddleware,
  authenticateUser: authMiddleware,
  authenticate: authMiddleware,
  optionalAuthMiddleware,
  optionalAuth: optionalAuthMiddleware,
  quotaMiddleware,
  checkQuota: quotaMiddleware,
  requireAuthMiddleware,
  requireAuth: requireAuthMiddleware,
  isAdminEmail
};
