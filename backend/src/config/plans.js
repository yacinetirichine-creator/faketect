module.exports = {
  FREE: { name: 'Gratuit', monthlyPrice: 0, yearlyPrice: 0, perDay: 3, perMonth: 90, features: ['3 analyses/jour', 'Images', 'Historique 7j'] },
  STARTER: { name: 'Starter', monthlyPrice: 12, yearlyPrice: 99, perDay: null, perMonth: 100, features: ['100/mois', 'Images + Docs', 'URL', 'Historique 30j'] },
  PRO: { name: 'Pro', monthlyPrice: 34, yearlyPrice: 290, perDay: null, perMonth: 500, features: ['500/mois', 'Tous fichiers', 'Batch 20', 'API', 'Support'] },
  BUSINESS: { name: 'Business', monthlyPrice: 89, yearlyPrice: 790, perDay: null, perMonth: 2000, features: ['2000/mois', 'Batch 50', 'Certificats', 'API dédiée'] },
  ENTERPRISE: { name: 'Enterprise', monthlyPrice: 249, yearlyPrice: 2490, perDay: null, perMonth: -1, features: ['Illimité', 'SLA 99.9%', 'Support 24/7', 'Custom'] }
};
