const express = require('express');
const prisma = require('../config/db');
const { auth, admin } = require('../middleware/auth');
const PLANS = require('../config/plans');

const router = express.Router();
router.use(auth, admin);

router.get('/metrics', async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, newToday, byPlan, totalAnalyses, analysesToday] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.user.groupBy({ by: ['plan'], _count: true }),
    prisma.analysis.count(),
    prisma.analysis.count({ where: { createdAt: { gte: startOfDay } } })
  ]);

  let mrr = 0;
  const planBreakdown = {};
  byPlan.forEach(p => {
    planBreakdown[p.plan] = p._count;
    if (PLANS[p.plan]?.monthlyPrice > 0) mrr += PLANS[p.plan].monthlyPrice * p._count;
  });

  res.json({
    users: { total: totalUsers, newToday, byPlan: planBreakdown },
    analyses: { total: totalAnalyses, today: analysesToday },
    revenue: { mrr }
  });
});

router.get('/users', async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const where = search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: +limit, select: { id: true, email: true, name: true, role: true, plan: true, createdAt: true } }),
    prisma.user.count({ where })
  ]);
  res.json({ users, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
});

router.put('/users/:id', async (req, res) => {
  const { plan, role } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { ...(plan && { plan }), ...(role && { role }) } });
  res.json({ user });
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Impossible' });
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
