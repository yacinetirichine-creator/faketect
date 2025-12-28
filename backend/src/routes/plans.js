const express = require('express');
const PLANS = require('../config/plans');
const router = express.Router();

router.get('/', (req, res) => {
  const plans = Object.entries(PLANS).map(([id, p]) => ({
    id,
    name: p.name,
    monthlyPrice: p.monthlyPrice,
    yearlyPrice: p.yearlyPrice,
    perMonth: p.perMonth,
    perDay: p.perDay,
    features: p.features,
    yearlyDiscount: p.monthlyPrice > 0 ? Math.round((1 - p.yearlyPrice / (p.monthlyPrice * 12)) * 100) : 0
  }));
  res.json({ plans });
});

module.exports = router;
