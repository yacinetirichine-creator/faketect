require('dotenv').config();

// Valider les variables d'environnement au démarrage
const { validateEnv } = require('./config/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Sécurité: Helmet (headers HTTP sécurisés)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permet le chargement des uploads
}));

// Logging des requêtes HTTP
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// CORS
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// Body parsing
app.use(express.json({ limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting global (après static files pour ne pas limiter les images)
app.use('/api/', globalLimiter);

// Health check (avant les routes pour ne pas être rate-limité)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/text-analysis', require('./routes/textAnalysis'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/stripe', require('./routes/stripe'));

// Error handling amélioré
app.use((err, req, res, next) => {
  logger.logError(err, req);
  
  // Ne pas exposer les détails des erreurs en production
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({ 
    error: err.message || 'Erreur serveur',
    ...(isDev && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3001;

// Initialiser les produits Stripe au démarrage
const { initializeStripeProducts } = require('./config/stripe-products');
const { initCleanupJobs } = require('./services/cleanup');
const prisma = require('./config/db');

app.listen(PORT, async () => {
  console.log(`🚀 FakeTect API: http://localhost:${PORT}`);
  logger.info('Server started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
  
  // Tester la connexion à la base de données (non-bloquant)
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
    logger.info('Database connected');
  } catch (error) {
    console.error('⚠️ Database connection warning:', error.message);
    logger.error('Database connection failed', { error: error.message });
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
