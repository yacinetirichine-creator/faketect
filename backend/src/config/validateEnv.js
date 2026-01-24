const logger = require('./logger');

// Variables d'environnement requises
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
];

// Variables d'environnement optionnelles mais recommandées
const OPTIONAL_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
  'SIGHTENGINE_API_USER',
  'SIGHTENGINE_API_SECRET',
  'ILLUMINARTY_API_KEY',
  'PORT',
  'NODE_ENV',
];

function validateEnv() {
  const missing = [];
  const warnings = [];

  // Vérifier les variables requises
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Vérifier les variables optionnelles
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // Si des variables requises manquent, arrêter l'application
  if (missing.length > 0) {
    console.error('\n❌ ERREUR: Variables d\'environnement manquantes:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nVeuillez configurer ces variables dans votre fichier .env\n');
    process.exit(1);
  }

  // Logger les warnings pour les variables optionnelles
  if (warnings.length > 0) {
    console.warn('\n⚠️  Variables d\'environnement optionnelles manquantes:');
    warnings.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('\nCertaines fonctionnalités pourraient être limitées.\n');
  }

  // Vérifier la sécurité du JWT_SECRET
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET devrait contenir au moins 32 caractères pour plus de sécurité\n');
  }

  // Vérifier l'environnement
  const env = process.env.NODE_ENV || 'development';
  console.log(`✅ Variables d'environnement validées (${env})\n`);

  // Logger la configuration (sans les secrets)
  if (logger) {
    logger.info('Environment validated', {
      environment: env,
      hasStripe: !!process.env.STRIPE_SECRET_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSightengine: !!process.env.SIGHTENGINE_API_USER,
      hasIllumarty: !!process.env.ILLUMINARTY_API_KEY,
    });
  }
}

module.exports = { validateEnv };
