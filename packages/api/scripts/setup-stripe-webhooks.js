#!/usr/bin/env node

/**
 * Script de configuration automatique des webhooks Stripe
 * 
 * Ce script :
 * - Crée un endpoint webhook sur votre compte Stripe
 * - Configure tous les événements nécessaires pour la facturation
 * - Récupère le webhook signing secret
 * - Affiche toutes les informations nécessaires pour la configuration
 * 
 * Usage:
 *   node scripts/setup-stripe-webhooks.js <WEBHOOK_URL>
 * 
 * Exemple:
 *   node scripts/setup-stripe-webhooks.js https://faketect-api.onrender.com/api/billing/webhooks/stripe
 */

const stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function setupWebhooks() {
  // Récupérer l'URL depuis les arguments
  const webhookUrl = process.argv[2];
  
  if (!webhookUrl) {
    log('❌ Erreur: URL du webhook manquante', colors.red);
    log('\nUsage: node scripts/setup-stripe-webhooks.js <WEBHOOK_URL>', colors.yellow);
    log('Exemple: node scripts/setup-stripe-webhooks.js https://faketect-api.onrender.com/api/billing/webhooks/stripe', colors.yellow);
    process.exit(1);
  }

  // Valider l'URL
  try {
    new URL(webhookUrl);
  } catch (error) {
    log(`❌ URL invalide: ${webhookUrl}`, colors.red);
    process.exit(1);
  }

  // Récupérer la clé API Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeKey) {
    log('❌ Erreur: STRIPE_SECRET_KEY non définie dans les variables d\'environnement', colors.red);
    log('\nAjoutez votre clé Stripe:', colors.yellow);
    log('export STRIPE_SECRET_KEY=sk_live_...', colors.yellow);
    process.exit(1);
  }

  log('\n🔧 Configuration des webhooks Stripe\n', colors.bright);
  log(`📍 URL du webhook: ${webhookUrl}`, colors.blue);

  const stripeClient = stripe(stripeKey);

  try {
    // Événements à surveiller
    const eventsToSubscribe = [
      'checkout.session.completed',
      'checkout.session.expired',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed',
      'invoice.payment_action_required',
      'payment_intent.succeeded',
      'payment_intent.payment_failed'
    ];

    log('\n📋 Événements à surveiller:', colors.bright);
    eventsToSubscribe.forEach(event => {
      log(`   - ${event}`, colors.blue);
    });

    // Vérifier si un webhook existe déjà pour cette URL
    log('\n🔍 Vérification des webhooks existants...', colors.yellow);
    const existingWebhooks = await stripeClient.webhookEndpoints.list();
    const existingWebhook = existingWebhooks.data.find(wh => wh.url === webhookUrl);

    let webhook;

    if (existingWebhook) {
      log(`⚠️  Un webhook existe déjà pour cette URL (${existingWebhook.id})`, colors.yellow);
      log('Mise à jour du webhook existant...', colors.yellow);

      webhook = await stripeClient.webhookEndpoints.update(
        existingWebhook.id,
        {
          enabled_events: eventsToSubscribe,
          description: 'Faketect - Billing events'
        }
      );

      log('✅ Webhook mis à jour avec succès', colors.green);
    } else {
      log('Création d\'un nouveau webhook...', colors.yellow);

      webhook = await stripeClient.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: eventsToSubscribe,
        description: 'Faketect - Billing events',
        api_version: '2024-11-20.acacia'
      });

      log('✅ Webhook créé avec succès', colors.green);
    }

    // Récupérer le secret
    const webhookSecret = webhook.secret;

    // Sauvegarder la configuration
    const config = {
      webhook_id: webhook.id,
      webhook_url: webhook.url,
      webhook_secret: webhookSecret,
      enabled_events: webhook.enabled_events,
      created_at: new Date().toISOString(),
      status: webhook.status
    };

    const configPath = path.join(__dirname, '..', 'stripe-webhook-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Afficher le résumé
    log('\n✨ Configuration terminée avec succès!\n', colors.green + colors.bright);
    
    log('📊 Résumé de la configuration:', colors.bright);
    log(`   ID: ${webhook.id}`, colors.blue);
    log(`   URL: ${webhook.url}`, colors.blue);
    log(`   Status: ${webhook.status}`, colors.blue);
    log(`   Événements: ${webhook.enabled_events.length}`, colors.blue);

    log('\n🔐 Webhook Signing Secret:', colors.bright);
    log(`   ${webhookSecret}`, colors.yellow);

    log('\n📝 Variable d\'environnement à ajouter sur Render:', colors.bright);
    log(`   STRIPE_WEBHOOK_SECRET=${webhookSecret}`, colors.green);

    log('\n💾 Configuration sauvegardée:', colors.bright);
    log(`   ${configPath}`, colors.blue);

    log('\n🚀 Prochaines étapes:', colors.bright);
    log('   1. Ajoutez la variable STRIPE_WEBHOOK_SECRET sur Render', colors.yellow);
    log('   2. Ajoutez toutes les autres variables d\'environnement Stripe', colors.yellow);
    log('   3. Redémarrez l\'API sur Render', colors.yellow);
    log('   4. Testez le webhook avec un paiement test', colors.yellow);

    log('\n✅ Setup terminé!\n', colors.green + colors.bright);

    // Créer un fichier récapitulatif
    const summary = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    CONFIGURATION STRIPE - RÉCAPITULATIF                     ║
╚════════════════════════════════════════════════════════════════════════════╝

📅 Date: ${new Date().toLocaleString('fr-FR')}

🔗 WEBHOOK CONFIGURÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:     ${webhook.id}
URL:    ${webhook.url}
Status: ${webhook.status}

🔐 SECRETS À AJOUTER SUR RENDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRIPE_WEBHOOK_SECRET=${webhookSecret}

📋 ÉVÉNEMENTS SURVEILLÉS (${webhook.enabled_events.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${webhook.enabled_events.map(e => `• ${e}`).join('\n')}

✅ CONFIGURATION COMPLÈTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Toutes les variables d'environnement nécessaires ont été générées.
Référez-vous au fichier stripe-products-config.json pour les price IDs.

🔄 PROCHAINES ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Connectez-vous à Render Dashboard
2. Allez dans votre service faketect-api
3. Section "Environment" → "Add Environment Variable"
4. Ajoutez TOUTES les variables listées ci-dessous:

   STRIPE_SECRET_KEY=sk_live_51Sg8MAIaJ0g5yYYS...
   STRIPE_PUBLISHABLE_KEY=pk_live_51Sg8MAIaJ0g5yYYS...
   STRIPE_WEBHOOK_SECRET=${webhookSecret}
   STRIPE_PRICE_PRO_MONTHLY=price_1Sg8XQIaJ0g5yYYSamQOtFMN
   STRIPE_PRICE_PRO_YEARLY=price_1Sg8XRIaJ0g5yYYSd6vl56w1
   STRIPE_PRICE_PACK_STARTER=price_1Sg8XRIaJ0g5yYYSEyqrYk9K
   STRIPE_PRICE_PACK_STANDARD=price_1Sg8XSIaJ0g5yYYSwvy81Lfa
   STRIPE_PRICE_PACK_PREMIUM=price_1Sg8XTIaJ0g5yYYS32SNlb5T

5. Cliquez sur "Save Changes"
6. Render va redémarrer automatiquement votre API
7. Testez avec: curl https://faketect-api.onrender.com/api/health

🧪 TESTER LE WEBHOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Une fois déployé, vous pouvez tester dans le Dashboard Stripe:
1. Developers → Webhooks → ${webhook.id}
2. Cliquez sur "Send test webhook"
3. Choisissez un événement (ex: checkout.session.completed)
4. Vérifiez que votre API reçoit et traite l'événement

╔════════════════════════════════════════════════════════════════════════════╗
║                              ✅ SETUP RÉUSSI                                ║
╚════════════════════════════════════════════════════════════════════════════╝
`;

    const summaryPath = path.join(__dirname, '..', 'STRIPE-SETUP-SUMMARY.txt');
    fs.writeFileSync(summaryPath, summary);

    log(`📄 Résumé complet sauvegardé: ${summaryPath}\n`, colors.blue);

  } catch (error) {
    log('\n❌ Erreur lors de la configuration du webhook:', colors.red);
    log(error.message, colors.red);
    
    if (error.type === 'StripeAuthenticationError') {
      log('\n⚠️  Vérifiez que votre STRIPE_SECRET_KEY est correcte', colors.yellow);
    }
    
    process.exit(1);
  }
}

// Exécution
setupWebhooks().catch(error => {
  log('\n❌ Erreur inattendue:', colors.red);
  console.error(error);
  process.exit(1);
});
