#!/usr/bin/env node

/**
 * Script: Créer 7 nouveaux produits Stripe pour les plans mis à jour
 * 
 * Produits à créer:
 * 1. Starter Mensuel (12€)
 * 2. Pro Mensuel (34€)
 * 3. Business Mensuel (89€)
 * 4. Enterprise Mensuel (249€)
 * 5. Starter Annuel (99€)
 * 6. Pro Annuel (290€)
 * 7. Business Annuel (790€)
 */

require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  console.log('🚀 Création des 7 produits Stripe pour les nouveaux plans...\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Erreur: STRIPE_SECRET_KEY non définie');
    console.log('\nUtilisation:');
    console.log('  export STRIPE_SECRET_KEY=sk_live_...');
    console.log('  node scripts/create-new-pricing.js\n');
    process.exit(1);
  }

  const products = [
    // PLANS MENSUELS
    {
      name: 'FakeTect Starter - Mensuel',
      price: 1200, // 12€ en cents
      recurring: 'month',
      description: '100 analyses par mois. Pour les indépendants.',
      varName: 'STRIPE_PRICE_STARTER_MONTHLY'
    },
    {
      name: 'FakeTect Pro - Mensuel',
      price: 3400, // 34€
      recurring: 'month',
      description: '500 analyses par mois. Pour les professionnels.',
      varName: 'STRIPE_PRICE_PRO_MONTHLY'
    },
    {
      name: 'FakeTect Business - Mensuel',
      price: 8900, // 89€
      recurring: 'month',
      description: '2000 analyses par mois. Pour les entreprises.',
      varName: 'STRIPE_PRICE_BUSINESS_MONTHLY'
    },
    {
      name: 'FakeTect Enterprise - Mensuel',
      price: 24900, // 249€
      recurring: 'month',
      description: 'Analyses illimitées. Solution sur mesure.',
      varName: 'STRIPE_PRICE_ENTERPRISE_MONTHLY'
    },
    // OFFRES ANNUELLES
    {
      name: 'FakeTect Starter - Annuel',
      price: 9900, // 99€
      recurring: 'year',
      description: '1200 analyses par an. Engagement annuel.',
      varName: 'STRIPE_PRICE_STARTER_YEARLY'
    },
    {
      name: 'FakeTect Pro - Annuel',
      price: 29000, // 290€
      recurring: 'year',
      description: '6000 analyses par an. Meilleur rapport qualité/prix.',
      varName: 'STRIPE_PRICE_PRO_YEARLY'
    },
    {
      name: 'FakeTect Business - Annuel',
      price: 79000, // 790€
      recurring: 'year',
      description: '24000 analyses par an. Engagement annuel.',
      varName: 'STRIPE_PRICE_BUSINESS_YEARLY'
    }
  ];

  const createdPrices = {};

  try {
    for (const productData of products) {
      console.log(`📦 Création: ${productData.name}...`);

      // Créer le produit
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          plan_level: productData.name.includes('Starter') ? 'starter' 
                    : productData.name.includes('Pro') ? 'pro' 
                    : productData.name.includes('Business') ? 'business' 
                    : 'enterprise',
          billing_period: productData.recurring
        }
      });

      // Créer le prix
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: 'eur',
        recurring: {
          interval: productData.recurring
        },
        metadata: {
          plan_type: productData.varName
        }
      });

      createdPrices[productData.varName] = price.id;
      console.log(`   ✅ Produit: ${product.id}`);
      console.log(`   ✅ Price ID: ${price.id}\n`);
    }

    // Afficher le résumé
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TOUS LES PRODUITS ONT ÉTÉ CRÉÉS AVEC SUCCÈS !');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 À AJOUTER DANS VOS FICHIERS .env:\n');
    console.log('# Frontend (packages/web/.env)');
    for (const [varName, priceId] of Object.entries(createdPrices)) {
      if (varName.includes('VITE_')) {
        console.log(`VITE_${varName}=${priceId}`);
      } else if (!varName.includes('YEARLY')) {
        console.log(`VITE_${varName}=${priceId}`);
      }
    }

    console.log('\n# Backend (packages/api/.env)');
    for (const [varName, priceId] of Object.entries(createdPrices)) {
      console.log(`${varName}=${priceId}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 DÉTAILS DES PRODUITS:\n');

    const summaryData = [
      { name: 'Starter - Mensuel', price: '12€', analyses: '100/mois', priceId: createdPrices.STRIPE_PRICE_STARTER_MONTHLY },
      { name: 'Pro - Mensuel', price: '34€', analyses: '500/mois', priceId: createdPrices.STRIPE_PRICE_PRO_MONTHLY },
      { name: 'Business - Mensuel', price: '89€', analyses: '2000/mois', priceId: createdPrices.STRIPE_PRICE_BUSINESS_MONTHLY },
      { name: 'Enterprise - Mensuel', price: '249€', analyses: 'Illimité', priceId: createdPrices.STRIPE_PRICE_ENTERPRISE_MONTHLY },
      { name: 'Starter - Annuel', price: '99€', analyses: '1200/an', priceId: createdPrices.STRIPE_PRICE_STARTER_YEARLY },
      { name: 'Pro - Annuel', price: '290€', analyses: '6000/an', priceId: createdPrices.STRIPE_PRICE_PRO_YEARLY },
      { name: 'Business - Annuel', price: '790€', analyses: '24000/an', priceId: createdPrices.STRIPE_PRICE_BUSINESS_YEARLY }
    ];

    summaryData.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.name}`);
      console.log(`   Prix: ${item.price}`);
      console.log(`   Analyses: ${item.analyses}`);
      console.log(`   Price ID: ${item.priceId}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔗 VOIR VOS PRODUITS:');
    console.log('   https://dashboard.stripe.com/products\n');

    console.log('⚠️  PROCHAINES ÉTAPES:');
    console.log('   1. Copier les variables ci-dessus dans packages/web/.env');
    console.log('   2. Copier les variables ci-dessus dans packages/api/.env');
    console.log('   3. Redéployer (git push origin main)');
    console.log('   4. Tester la page /pricing\n');

    return createdPrices;

  } catch (error) {
    console.error('❌ Erreur lors de la création des produits:');
    console.error(error.message);
    process.exit(1);
  }
}

// Exécuter
createStripeProducts().then(() => {
  console.log('✅ Script terminé avec succès!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
