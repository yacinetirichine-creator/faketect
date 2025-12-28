const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const PLANS = require('../config/plans');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token requis' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'Non trouvé' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token invalide' });
  }
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
    next();
  } catch (e) { next(e); }
};

module.exports = { auth, admin, checkLimit };
