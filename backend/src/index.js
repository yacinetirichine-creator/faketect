require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/text-analysis', require('./routes/textAnalysis'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/stripe', require('./routes/stripe'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3001;

// Initialiser les produits Stripe au démarrage
const { initializeStripeProducts } = require('./config/stripe-products');
const { initCleanupJobs } = require('./services/cleanup');
const prisma = require('./config/db');

app.listen(PORT, async () => {
  console.log(`🚀 FakeTect API: http://localhost:${PORT}`);
  
  // Tester la connexion à la base de données (non-bloquant)
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('⚠️ Database connection warning:', error.message);
    console.log('⚠️ App will continue but database features will not work');
  }
  
  // Initialiser Stripe si la clé est présente
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      await initializeStripeProducts();
    } catch (error) {
      console.error('⚠️ Stripe initialization failed:', error.message);
    }
  } else {
    console.log('⚠️ STRIPE_SECRET_KEY not found - Stripe features disabled');
  }
  
  // Initialiser les tâches de nettoyage automatique (90 jours)
  initCleanupJobs();
});
