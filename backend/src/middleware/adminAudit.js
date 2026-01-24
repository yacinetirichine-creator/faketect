const prisma = require('../config/db');
const logger = require('../config/logger');

/**
 * Middleware d'audit pour les actions admin (RGPD Art. 5 - Responsabilité)
 * Enregistre automatiquement toutes les actions effectuées par les admins
 */

// Mapping des routes vers les actions
const routeActionMap = {
  'GET /api/admin/users': { action: 'VIEW_USERS', targetType: 'USER' },
  'GET /api/admin/analyses': { action: 'VIEW_ANALYSES', targetType: 'ANALYSIS' },
  'PUT /api/admin/users/:id': { action: 'UPDATE_USER', targetType: 'USER' },
  'DELETE /api/admin/users/:id': { action: 'DELETE_USER', targetType: 'USER' },
  'POST /api/admin/cleanup': { action: 'RUN_CLEANUP', targetType: 'SYSTEM' },
  'POST /api/admin/cache/clear': { action: 'CLEAR_CACHE', targetType: 'SYSTEM' },
  'GET /api/admin/metrics': { action: 'VIEW_METRICS', targetType: 'SYSTEM' },
  'GET /api/admin/cache/stats': { action: 'VIEW_CACHE_STATS', targetType: 'SYSTEM' }
};

/**
 * Détermine l'action basée sur la route et la méthode
 */
function getActionFromRoute(method, path) {
  // Normaliser le chemin (remplacer les UUIDs par :id)
  const normalizedPath = path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id');
  const routeKey = `${method} ${normalizedPath}`;
  return routeActionMap[routeKey] || { action: 'UNKNOWN_ACTION', targetType: 'UNKNOWN' };
}

/**
 * Extrait l'ID cible depuis l'URL si présent
 */
function extractTargetId(path) {
  const uuidMatch = path.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuidMatch ? uuidMatch[0] : null;
}

/**
 * Middleware d'audit admin
 * À utiliser sur les routes admin après auth et admin middleware
 */
const adminAudit = async (req, res, next) => {
  // Sauvegarder la fonction send originale
  const originalSend = res.send;

  // Intercepter la réponse pour logger après succès
  res.send = function (body) {
    // Restaurer la fonction originale
    res.send = originalSend;

    // Logger seulement si la réponse est un succès (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const { action, targetType } = getActionFromRoute(req.method, req.originalUrl || req.url);
      const targetId = extractTargetId(req.originalUrl || req.url);

      // Construire les détails de l'action
      let details = {};

      if (req.method === 'PUT' || req.method === 'POST') {
        // Pour les modifications, logger les changements (sans données sensibles)
        const safeBody = { ...req.body };
        delete safeBody.password;
        delete safeBody.token;
        details.changes = safeBody;
      }

      if (req.query && Object.keys(req.query).length > 0) {
        details.query = req.query;
      }

      // Créer le log d'audit de manière asynchrone (non bloquant)
      prisma.adminAuditLog.create({
        data: {
          adminId: req.user.id,
          action,
          targetType,
          targetId,
          details: Object.keys(details).length > 0 ? JSON.stringify(details) : null,
          ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown',
          userAgent: (req.headers['user-agent'] || 'unknown').substring(0, 500)
        }
      }).then(() => {
        logger.info('Admin audit log created', {
          adminId: req.user.id,
          action,
          targetType,
          targetId
        });
      }).catch(err => {
        logger.error('Failed to create admin audit log', err);
      });
    }

    // Envoyer la réponse
    return res.send(body);
  };

  next();
};

/**
 * Fonction utilitaire pour créer manuellement un log d'audit
 * À utiliser pour des actions complexes ou personnalisées
 */
const logAdminAction = async (adminId, action, targetType, targetId = null, details = null, req = null) => {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req?.headers?.['x-forwarded-for']?.split(',')[0] || req?.ip || 'unknown',
        userAgent: (req?.headers?.['user-agent'] || 'unknown').substring(0, 500)
      }
    });
    logger.info('Admin audit log created manually', { adminId, action, targetType, targetId });
  } catch (error) {
    logger.error('Failed to create manual admin audit log', error);
  }
};

module.exports = { adminAudit, logAdminAction };
