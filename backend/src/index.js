require('dotenv').config();

// Initialiser Sentry en premier (monitoring optionnel)
const { initSentry } = require('./config/sentry');
initSentry();

// Valider les variables d'environnement au démarrage
const { validateEnv } = require('./config/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger');
const { 
  globalLimiter, 
  apiSlowDown,
  ddosProtection,
  authLimiter,
  registerLimiter,
  adminLimiter,
  paymentLimiter,
  webhookLimiter,
  passwordResetLimiter
} = require('./middleware/rateLimiter');

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

// Protection DDoS première ligne (ultra-stricte)
app.use('/api/', ddosProtection);

// Slow-down progressif (ralentit avant de bloquer)
app.use('/api/', apiSlowDown);

// Rate limiting global (après static files pour ne pas limiter les images)
app.use('/api/', globalLimiter);

// Health check (avant les routes pour ne pas être rate-limité)
app.get('/api/health', async (req, res) => {
  try {
    // Test connexion DB
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/text-analysis', require('./routes/textAnalysis'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/newsletter', require('./routes/newsletter'));

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
const { initRedis, disconnect: disconnectRedis } = require('./services/cache');
const { startEmailAutomationCron } = require('./services/emailCron');
const { initEmail } = require('./services/email');
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
  
  // Initialiser Redis Cache (non-bloquant)
  try {
    initRedis();
  } catch (error) {
    console.error('⚠️ Redis initialization failed:', error.message);
  }
  
  // Initialiser Email (non-bloquant)
  try {
    initEmail();
  } catch (error) {
    console.error('⚠️ Email initialization failed:', error.message);
  }
  
  // Démarrer CRON email automation (non-bloquant)
  try {
    startEmailAutomationCron();
  } catch (error) {
    console.error('⚠️ Email automation cron failed:', error.message);
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing server gracefully...');
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, closing server gracefully...');
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});
