module.exports = {
  FREE: { name: 'Gratuit', monthlyPrice: 0, yearlyPrice: 0, perDay: null, perMonth: null, totalLimit: 10, features: ['10 tests offerts', 'Images', 'Valide 30 jours'] },
  STANDARD: { name: 'Standard', monthlyPrice: 9.99, yearlyPrice: 99, perDay: 10, perMonth: 100, features: ['100/mois', 'Images + Docs', 'URL', 'Historique 30j'] },
  PROFESSIONAL: { name: 'Professional', monthlyPrice: 29.99, yearlyPrice: 299, perDay: 50, perMonth: 500, features: ['500/mois', 'Tous fichiers', 'Batch 20', 'API', 'Support'] },
  BUSINESS: { name: 'Business', monthlyPrice: 89, yearlyPrice: 890, perDay: 200, perMonth: 2000, features: ['2000/mois', 'Batch 50', 'Certificats', 'API dédiée'] },
  ENTERPRISE: { name: 'Enterprise', monthlyPrice: 249, yearlyPrice: 2490, perDay: 1000, perMonth: -1, features: ['Illimité', 'SLA 99.9%', 'Support 24/7', 'Custom'] }
};
