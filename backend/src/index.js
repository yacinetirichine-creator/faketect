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
const compression = require('compression');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const {
  globalLimiter,
  apiSlowDown,
  ddosProtection,
  authLimiter: _authLimiter,
  registerLimiter: _registerLimiter,
  adminLimiter: _adminLimiter,
  paymentLimiter: _paymentLimiter,
  webhookLimiter: _webhookLimiter,
  passwordResetLimiter: _passwordResetLimiter,
} = require('./middleware/rateLimiter');
const { requestId } = require('./middleware/requestId');

const app = express();

// Request ID pour traçabilité
app.use(requestId);

// Sécurité: Helmet (headers HTTP sécurisés renforcés)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.openai.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Headers de sécurité additionnels
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Compression des réponses (gzip) - réduit la bande passante de 60-70%
app.use(compression({
  threshold: 1024, // Compresser seulement si > 1KB
  level: 6, // Niveau de compression (1-9, 6 = bon équilibre vitesse/taille)
}));

// Logging des requêtes HTTP
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) },
}));

// CORS
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// Body parsing
app.use(express.json({ limit: '50mb' }));

// Cookie parsing (RGPD: pour consentement cookies côté serveur)
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Protection DDoS première ligne (ultra-stricte)
app.use('/api/', ddosProtection);

// Slow-down progressif (ralentit avant de bloquer)
app.use('/api/', apiSlowDown);

// Rate limiting global (après static files pour ne pas limiter les images)
app.use('/api/', globalLimiter);

// Health check léger (sans requête DB à chaque appel)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
  });
});

// Health check complet avec DB (pour monitoring approfondi)
app.get('/api/health/full', async (req, res) => {
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    const cacheStats = await require('./services/cache').getStats();

    res.json({
      status: 'ok',
      database: { status: 'connected', latencyMs: dbLatency },
      cache: cacheStats,
      uptime: process.uptime(),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: { status: 'disconnected', error: error.message },
      timestamp: new Date().toISOString(),
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
app.use('/api/consent', require('./routes/consent')); // RGPD: Consentement cookies côté serveur

// Error handling amélioré
app.use((err, req, res, _next) => {
  logger.logError(err, req);

  // Ne pas exposer les détails des erreurs en production
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur',
    ...(isDev && { stack: err.stack }),
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

const server = app.listen(PORT, async () => {
  // Expose server globally for graceful shutdown
  global.server = server;
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
