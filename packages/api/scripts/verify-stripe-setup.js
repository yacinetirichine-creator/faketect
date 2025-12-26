#!/usr/bin/env node

/**
 * Script de vérification de la configuration Stripe
 * 
 * Ce script vérifie que :
 * - Toutes les variables d'environnement sont définies
 * - Les produits Stripe existent et sont actifs
 * - Les prix sont correctement configurés
 * - Le webhook est actif et reçoit les événements
 * 
 * Usage:
 *   node scripts/verify-stripe-setup.js
 */

const https = require('https');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function verifySetup() {
  log('\n🔍 Vérification de la configuration Stripe\n', colors.bright + colors.cyan);

  let errors = 0;
  let warnings = 0;

  // 1. Vérifier les variables d'environnement requises
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('📋 VARIABLES D\'ENVIRONNEMENT', colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  const requiredVars = {
    'STRIPE_SECRET_KEY': 'Clé secrète Stripe',
    'STRIPE_PUBLISHABLE_KEY': 'Clé publique Stripe',
    'STRIPE_WEBHOOK_SECRET': 'Secret de signature webhook',
    'STRIPE_PRICE_PRO_MONTHLY': 'Prix Pro Mensuel',
    'STRIPE_PRICE_PRO_YEARLY': 'Prix Pro Annuel',
    'STRIPE_PRICE_PACK_STARTER': 'Prix Pack Starter',
    'STRIPE_PRICE_PACK_STANDARD': 'Prix Pack Standard',
    'STRIPE_PRICE_PACK_PREMIUM': 'Prix Pack Premium'
  };

  for (const [varName, description] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    if (value) {
      const maskedValue = value.substring(0, 12) + '...' + value.substring(value.length - 4);
      log(`✅ ${varName.padEnd(30)} ${maskedValue}`, colors.green);
    } else {
      log(`❌ ${varName.padEnd(30)} MANQUANTE`, colors.red);
      errors++;
    }
  }

  if (errors > 0) {
    log(`\n⚠️  ${errors} variable(s) manquante(s). Vérifiez votre configuration Render.\n`, colors.red);
    return;
  }

  log('\n✅ Toutes les variables d\'environnement sont définies\n', colors.green);

  // 2. Vérifier la connexion à l'API
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('🌐 CONNEXION API', colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  try {
    log('Test de connexion à l\'API...', colors.yellow);
    const healthCheck = await makeRequest('https://faketect-api.onrender.com/api/health');
    
    if (healthCheck.status === 200) {
      log('✅ API accessible et fonctionnelle', colors.green);
      if (healthCheck.data && healthCheck.data.status === 'healthy') {
        log(`   Uptime: ${healthCheck.data.uptime || 'N/A'}`, colors.blue);
      }
    } else {
      log(`❌ API retourne le statut ${healthCheck.status}`, colors.red);
      errors++;
    }
  } catch (error) {
    log(`❌ Impossible de se connecter à l'API: ${error.message}`, colors.red);
    errors++;
  }

  log('');

  // 3. Vérifier Stripe avec le SDK
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('🔐 STRIPE - PRODUITS & PRIX', colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Vérifier les prix
    const prices = [
      { id: process.env.STRIPE_PRICE_PRO_MONTHLY, name: 'Pro Mensuel', expected: 2900 },
      { id: process.env.STRIPE_PRICE_PRO_YEARLY, name: 'Pro Annuel', expected: 29000 },
      { id: process.env.STRIPE_PRICE_PACK_STARTER, name: 'Pack Starter', expected: 990 },
      { id: process.env.STRIPE_PRICE_PACK_STANDARD, name: 'Pack Standard', expected: 3490 },
      { id: process.env.STRIPE_PRICE_PACK_PREMIUM, name: 'Pack Premium', expected: 7990 }
    ];

    for (const priceConfig of prices) {
      try {
        const price = await stripe.prices.retrieve(priceConfig.id);
        const product = await stripe.products.retrieve(price.product);

        if (price.active && product.active) {
          const amount = price.unit_amount / 100;
          const expectedAmount = priceConfig.expected / 100;
          log(`✅ ${priceConfig.name.padEnd(20)} ${amount}€ (${product.name})`, colors.green);
          
          if (price.unit_amount !== priceConfig.expected) {
            log(`   ⚠️  Prix attendu: ${expectedAmount}€`, colors.yellow);
            warnings++;
          }
        } else {
          log(`❌ ${priceConfig.name.padEnd(20)} Inactif`, colors.red);
          errors++;
        }
      } catch (error) {
        log(`❌ ${priceConfig.name.padEnd(20)} ${error.message}`, colors.red);
        errors++;
      }
    }
  } catch (error) {
    log(`❌ Erreur lors de la connexion à Stripe: ${error.message}`, colors.red);
    errors++;
  }

  log('');

  // 4. Vérifier le webhook
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('🔔 WEBHOOKS', colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const webhooks = await stripe.webhookEndpoints.list();
    const apiWebhook = webhooks.data.find(
      wh => wh.url === 'https://faketect-api.onrender.com/api/billing/webhooks/stripe'
    );

    if (apiWebhook) {
      log(`✅ Webhook configuré: ${apiWebhook.id}`, colors.green);
      log(`   URL: ${apiWebhook.url}`, colors.blue);
      log(`   Status: ${apiWebhook.status}`, colors.blue);
      log(`   Événements: ${apiWebhook.enabled_events.length}`, colors.blue);
      
      const requiredEvents = [
        'checkout.session.completed',
        'customer.subscription.created',
        'invoice.paid',
        'payment_intent.succeeded'
      ];

      const missingEvents = requiredEvents.filter(
        event => !apiWebhook.enabled_events.includes(event)
      );

      if (missingEvents.length > 0) {
        log(`   ⚠️  Événements manquants: ${missingEvents.join(', ')}`, colors.yellow);
        warnings++;
      }
    } else {
      log('❌ Aucun webhook configuré pour cette URL', colors.red);
      errors++;
    }
  } catch (error) {
    log(`❌ Erreur lors de la vérification des webhooks: ${error.message}`, colors.red);
    errors++;
  }

  log('');

  // 5. Résumé
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('📊 RÉSUMÉ', colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  if (errors === 0 && warnings === 0) {
    log('✅ Configuration Stripe parfaite ! Tout fonctionne correctement.', colors.green + colors.bright);
    log('\n🚀 Votre système de facturation est prêt à être utilisé !\n', colors.cyan);
  } else if (errors === 0) {
    log(`⚠️  Configuration fonctionnelle avec ${warnings} avertissement(s).`, colors.yellow);
    log('   Le système peut fonctionner mais vérifiez les points ci-dessus.\n', colors.yellow);
  } else {
    log(`❌ ${errors} erreur(s) critique(s) détectée(s).`, colors.red);
    log('   Corrigez ces erreurs avant de mettre en production.\n', colors.red);
  }

  // 6. Instructions de test
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('🧪 TESTER LA CONFIGURATION', colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  log('Pour tester votre configuration Stripe :', colors.bright);
  log('');
  log('1. Testez l\'endpoint de création de session:', colors.yellow);
  log('   curl -X POST https://faketect-api.onrender.com/api/billing/checkout/create-session \\', colors.cyan);
  log('     -H "Content-Type: application/json" \\', colors.cyan);
  log('     -H "Authorization: Bearer YOUR_TOKEN" \\', colors.cyan);
  log('     -d \'{"priceId": "' + process.env.STRIPE_PRICE_PRO_MONTHLY + '"}\'', colors.cyan);
  log('');
  log('2. Testez le webhook depuis le Dashboard Stripe:', colors.yellow);
  log('   - Allez sur https://dashboard.stripe.com/webhooks', colors.cyan);
  log('   - Cliquez sur votre webhook', colors.cyan);
  log('   - Testez avec "Send test webhook"', colors.cyan);
  log('');
  log('3. Effectuez un paiement test complet:', colors.yellow);
  log('   - Utilisez la carte test: 4242 4242 4242 4242', colors.cyan);
  log('   - Date: n\'importe quelle date future', colors.cyan);
  log('   - CVC: n\'importe quel 3 chiffres', colors.cyan);
  log('');
}

// Exécution
verifySetup().catch(error => {
  log('\n❌ Erreur inattendue:', colors.red);
  console.error(error);
  process.exit(1);
});
