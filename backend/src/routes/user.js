const express = require('express');
const prisma = require('../config/db');
const { auth } = require('../middleware/auth');
const PLANS = require('../config/plans');

const router = express.Router();

router.get('/dashboard', auth, async (req, res) => {
  const user = req.user;
  const plan = PLANS[user.plan] || PLANS.FREE;
  
  const [recent, total, aiCount] = await Promise.all([
    prisma.analysis.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.analysis.count({ where: { userId: user.id } }),
    prisma.analysis.count({ where: { userId: user.id, isAi: true } })
  ]);
  
  res.json({
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan, language: user.language },
    plan: { ...plan, name: plan.name },
    limits: {
      daily: user.plan === 'FREE' ? plan.perDay : null,
      monthly: plan.perMonth,
      usedToday: user.usedToday,
      usedMonth: user.usedMonth,
      remainingToday: user.plan === 'FREE' ? Math.max(0, plan.perDay - user.usedToday) : null,
      remainingMonth: plan.perMonth > 0 ? Math.max(0, plan.perMonth - user.usedMonth) : 'unlimited'
    },
    stats: { total, aiDetected: aiCount, real: total - aiCount },
    recentAnalyses: recent
  });
});

module.exports = router;
