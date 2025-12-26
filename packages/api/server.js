const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const analyzeRoutes = require('./routes/analyze');
const batchRoutes = require('./routes/batch');
const historyRoutes = require('./routes/history');
const reportRoutes = require('./routes/report');
const billingRoutes = require('./routes/billing');
const adminRoutes = require('./routes/admin');
const certificateRoutes = require('./routes/certificate');
const userRoutes = require('./routes/user');
const { optionalAuthMiddleware } = require('./middleware/auth');
const {
  globalLimiter,
  analysisLimiter,
  batchLimiter,
  videoLimiter,
  uploadLimiter,
  paymentLimiter,
  adminLimiter
} = require('./middleware/rate-limiters');
const guestQuota = require('./services/guest-quota');
const { checkQuota, getVideoQuota } = require('./config/supabase');
const metricsService = require('./services/metrics');
const auditLogger = require('./services/audit-logger');

const app = express();
const PORT = process.env.PORT || 3001;

// 🏥 CRITICAL: Health check ULTRA-PRÉCOCE pour Render
// Doit être le PREMIER middleware, répond immédiatement sans passer par CORS/helmet/etc
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    console.log(`🏥 Health check: ${req.path}`);
    return res.status(200).send('OK');
  }
  next();
});

// Nettoyage périodique des fichiers temporaires (> 1h)
function cleanupOldFiles(directory, maxAge = 3600000) {
  try {
    if (!fs.existsSync(directory)) return;
    const files = fs.readdirSync(directory);
    const now = Date.now();
    let cleaned = 0;
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        // ✅ Utiliser rmSync pour fichiers ET répertoires (évite EISDIR)
        fs.rmSync(filePath, { recursive: true, force: true });
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Nettoyage uploads: ${cleaned} fichiers supprimés`);
    }
  } catch (err) {
    console.error('❌ Erreur nettoyage fichiers:', err.message);
  }
}

// Nettoyer toutes les heures
setInterval(() => {
  cleanupOldFiles(path.join(__dirname, 'uploads'));
  cleanupOldFiles(path.join(__dirname, 'reports'));
}, 3600000);

// Nettoyage au démarrage
setTimeout(() => {
  cleanupOldFiles(path.join(__dirname, 'uploads'));
  cleanupOldFiles(path.join(__dirname, 'reports'));
}, 5000);

// If deployed behind a proxy (Vercel/Render/Nginx), trust X-Forwarded-For.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// 🔒 Sécurité renforcée avec Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.faketect.com", "https://*.supabase.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' }, // Prévention clickjacking
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS - Configuration stricte pour entreprises
app.use(cors({
  origin: (origin, callback) => {
    // TEMPORAIRE : Accepter toutes les origines pour debug
    console.log(`✅ CORS: Accepté pour origine: ${origin || 'no-origin'}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token', 'x-fingerprint', 'X-Fingerprint'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24h cache preflight
}));

// 🔒 Headers de sécurité additionnels
app.use((req, res, next) => {
  // Permissions Policy (anciennement Feature Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy mais utile)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Référence sécurisée
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // En production, forcer HTTPS
  if (process.env.NODE_ENV === 'production') {
    // HSTS - Force HTTPS pendant 1 an
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
});

// [SECURITY] Rate limiting global
app.use('/api/', globalLimiter);

// [OK] Rate limiting spécifiques par endpoint
app.use('/api/analyze/upload', uploadLimiter, analysisLimiter);
app.use('/api/analyze/url', analysisLimiter);
app.use('/api/analyze/base64', analysisLimiter);
app.use('/api/analyze/video', videoLimiter, uploadLimiter);
app.use('/api/batch/images', batchLimiter);
app.use('/api/batch/document', batchLimiter);
app.use('/api/billing/checkout', paymentLimiter);
app.use('/api/admin/', adminLimiter);

app.use('/api/analyze/upload', uploadLimiter);
app.use('/api/analyze/video', uploadLimiter);
app.use('/api/batch/upload', uploadLimiter);

// Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/user', userRoutes);

// Quota info (guest or authenticated)
app.get('/api/quota', optionalAuthMiddleware, async (req, res) => {
  try {
    const devBypassEnabled = process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
    const devUser = devBypassEnabled && !process.env.SUPABASE_URL ? { id: 'dev-user', email: 'dev@test.com' } : null;
    const user = req.user || devUser;

    if (!user) {
      return res.json({ success: true, quota: await guestQuota.getQuota(req.ip, req.fingerprint), authenticated: false });
    }
    const [quota, videoQuota] = await Promise.all([
      checkQuota(user.id),
      getVideoQuota(user.id)
    ]);
    return res.json({ success: true, quota, video_quota: videoQuota, authenticated: true });
  } catch (err) {
    return res.status(500).json({ error: true, message: 'Erreur quota' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const stats = metricsService.getStats();
  
  res.json({
    status: 'ok',
    version: '2.0.1',
    timestamp: new Date().toISOString(),
    uptime: stats.uptimeFormatted,
    
    features: ['images', 'documents', 'batch', 'exif', 'reports', 'video_frames'],
    
    services: {
      supabase: !!process.env.SUPABASE_URL,
      sightengine: !!process.env.SIGHTENGINE_USER,
      illuminarty: !!process.env.ILLUMINARTY_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY
    },
    
    metrics: {
      totalAnalyses: stats.analyses.total,
      performance: {
        avgDuration: `${stats.performance.averageDuration}ms`,
        p95: `${stats.performance.p95Duration}ms`,
        p99: `${stats.performance.p99Duration}ms`
      },
      providers: {
        sightengine: stats.providers.sightengine.successRate,
        illuminarty: stats.providers.illuminarty.successRate
      },
      errorRate: stats.errors.rate
    },
    
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

// Métriques détaillées (endpoint privé)
app.get('/api/metrics', (req, res) => {
  // Vérifier token admin si nécessaire
  const adminToken = req.headers['x-admin-token'];
  if (process.env.ADMIN_METRICS_TOKEN && adminToken !== process.env.ADMIN_METRICS_TOKEN) {
    return res.status(403).json({ error: true, message: 'Accès refusé' });
  }
  
  res.json({
    success: true,
    metrics: metricsService.getStats()
  });
});

// Erreurs
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  
  // Déterminer le code d'erreur
  const errorCode = err.code || 
    (err.status === 401 ? 'UNAUTHORIZED' :
     err.status === 403 ? 'FORBIDDEN' :
     err.status === 404 ? 'NOT_FOUND' :
     err.status === 429 ? 'RATE_LIMIT' :
     err.status === 400 ? 'BAD_REQUEST' :
     'INTERNAL_ERROR');
  
  res.status(err.status || 500).json({
    error: true,
    code: errorCode,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {})
  });
});

// Démarrer le serveur uniquement si pas en mode test
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║              🔍 FakeTect - API v2.0.1                  ║
  ╠════════════════════════════════════════════════════════╣
  ║  http://0.0.0.0:${PORT}                                    ║
  ║                                                        ║
  ║  Endpoints:                                            ║
  ║  • POST /api/analyze/upload       Image unique         ║
  ║  • POST /api/analyze/url          Analyse URL          ║
  ║  • POST /api/analyze/base64       Extension/Mobile     ║
  ║  • POST /api/analyze/video        Vidéo (frames)       ║
  ║  • POST /api/batch/images         Multiple images      ║
  ║  • POST /api/batch/document       PDF/Word/PPT/Excel   ║
  ║  • GET  /api/history              Historique           ║
  ║  • POST /api/report/generate/:id  Rapport PDF          ║
  ║  • GET  /api/health               Health check         ║
  ║  • GET  /api/metrics              Métriques (admin)    ║
  ║                                                        ║
  ║  Services:                                             ║
  ║  • Supabase:    ${process.env.SUPABASE_URL ? '✅' : '❌ Non configuré'}                            ║
  ║  • Sightengine: ${process.env.SIGHTENGINE_USER ? '✅' : '❌ Non configuré'}                            ║
  ║  • Illuminarty: ${process.env.ILLUMINARTY_API_KEY ? '✅' : '❌ Non configuré'}                            ║
  ╚════════════════════════════════════════════════════════╝
  `);
  });
}

module.exports = app;
