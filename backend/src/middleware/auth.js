const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const PLANS = require('../config/plans');
const cache = require('../services/cache');

// TTL du cache utilisateur (1 heure - optimisé pour réduire les appels DB)
// Le cache est invalidé manuellement lors des modifications de profil/plan
const USER_CACHE_TTL = 3600;

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token requis' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const cacheKey = `user:${decoded.userId}`;

    // Essayer le cache d'abord (réduit les requêtes DB de ~50%)
    let user = await cache.get(cacheKey);

    if (!user) {
      // Cache miss: chercher en DB et mettre en cache
      user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) {
        await cache.set(cacheKey, user, USER_CACHE_TTL);
      }
    }

    if (!user) return res.status(401).json({ error: 'Non trouvé' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Invalider le cache utilisateur (à appeler après modification du profil/plan)
const invalidateUserCache = async (userId) => {
  await cache.del(`user:${userId}`);
};

const admin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin requis' });
  next();
};

const checkLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const plan = PLANS[user.plan] || PLANS.FREE;
    const now = new Date();
    const lastReset = new Date(user.lastReset);
    const isNewDay = now.toDateString() !== lastReset.toDateString();
    const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    
    // Plan FREE : limite totale de 10 tests (pas de reset)
    if (user.plan === 'FREE') {
      if (user.usedTotal >= 10) {
        return res.status(429).json({ error: 'Limite de 10 tests gratuits atteinte. Passez à un plan payant pour continuer.' });
      }
      // Pas de reset pour FREE, on continue
    } else {
      // Plans payants : reset quotidien/mensuel comme avant
      if (isNewDay || isNewMonth) {
        await prisma.user.update({
          where: { id: user.id },
          data: { usedToday: 0, ...(isNewMonth && { usedMonth: 0 }), lastReset: now }
        });
        user.usedToday = 0;
        if (isNewMonth) user.usedMonth = 0;
      }
      
      // Vérifier limite quotidienne pour tous les plans (sauf Enterprise illimité)
      if (plan.perDay && user.usedToday >= plan.perDay) {
        return res.status(429).json({ error: 'Limite quotidienne atteinte' });
      }
      // Vérifier limite mensuelle
      if (plan.perMonth > 0 && user.usedMonth >= plan.perMonth) {
        return res.status(429).json({ error: 'Limite mensuelle atteinte' });
      }
    }
    
    next();
  } catch (e) { next(e); }
};

module.exports = { auth, admin, checkLimit, invalidateUserCache };
