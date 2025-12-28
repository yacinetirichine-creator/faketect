module.exports = {
  FREE: { name: 'Gratuit', monthlyPrice: 0, yearlyPrice: 0, perDay: null, perMonth: null, totalLimit: 10, features: ['10 analyses offertes', 'Valable 30 jours', 'Images uniquement', 'Historique 7j'] },
  STARTER: { name: 'Starter', monthlyPrice: 12, yearlyPrice: 100, perDay: null, perMonth: 100, features: ['100/mois', 'Images + Docs', 'URL', 'Historique 30j'] },
  PRO: { name: 'Pro', monthlyPrice: 34, yearlyPrice: 285, perDay: null, perMonth: 500, features: ['500/mois', 'Tous fichiers', 'Batch 20', 'API', 'Historique 90j'] },
  BUSINESS: { name: 'Business', monthlyPrice: 89, yearlyPrice: 750, perDay: null, perMonth: 2000, features: ['2000/mois', 'Batch 50', 'Certificats', 'Historique illimité'] },
  ENTERPRISE: { name: 'Enterprise', monthlyPrice: 249, yearlyPrice: 2090, perDay: null, perMonth: -1, features: ['Illimité', 'SLA 99.9%', 'Support 24/7', 'White-label'] }
};
