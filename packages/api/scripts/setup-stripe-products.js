require('dotenv').config();

// Récupérer la clé Stripe depuis les variables d'environnement
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error('❌ Erreur: STRIPE_SECRET_KEY non définie');
  console.log('\nUtilisation:');
  console.log('export STRIPE_SECRET_KEY=sk_live_...');
  console.log('node scripts/setup-stripe-products.js');
  process.exit(1);
}

const stripe = require('stripe')(stripeKey);

async function setupStripeProducts() {
  console.log('🚀 Création des produits Stripe en PRODUCTION...\n');

  try {
    // 1. ABONNEMENT PRO - MENSUEL
    console.log('1️⃣ Création: Faketect Pro - Mensuel...');
    const proMonthlyProduct = await stripe.products.create({
      name: 'Faketect Pro - Mensuel',
      description: '100 analyses par mois + toutes les fonctionnalités premium',
      metadata: {
        analyses_quota: '100',
        plan_level: 'pro',
        billing_period: 'monthly'
      }
    });

    const proMonthlyPrice = await stripe.prices.create({
      product: proMonthlyProduct.id,
      unit_amount: 2900, // 29€
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      metadata: {
        analyses_quota: '100'
      }
    });

    console.log(`   ✅ Produit créé: ${proMonthlyProduct.id}`);
    console.log(`   ✅ Prix créé: ${proMonthlyPrice.id}\n`);

    // 2. ABONNEMENT PRO - ANNUEL
    console.log('2️⃣ Création: Faketect Pro - Annuel...');
    const proYearlyProduct = await stripe.products.create({
      name: 'Faketect Pro - Annuel',
      description: '100 analyses par mois + toutes les fonctionnalités premium (2 mois offerts)',
      metadata: {
        analyses_quota: '1200',
        plan_level: 'pro',
        billing_period: 'yearly',
        discount: '17%'
      }
    });

    const proYearlyPrice = await stripe.prices.create({
      product: proYearlyProduct.id,
      unit_amount: 29000, // 290€
      currency: 'eur',
      recurring: {
        interval: 'year'
      },
      metadata: {
        analyses_quota: '1200'
      }
    });

    console.log(`   ✅ Produit créé: ${proYearlyProduct.id}`);
    console.log(`   ✅ Prix créé: ${proYearlyPrice.id}\n`);

    // 3. PACK STARTER - 50 analyses
    console.log('3️⃣ Création: Pack Starter - 50 analyses...');
    const starterPackProduct = await stripe.products.create({
      name: 'Pack Starter - 50 analyses',
      description: '50 analyses (valable 3 mois)',
      metadata: {
        analyses_count: '50',
        validity_months: '3',
        pack_type: 'starter'
      }
    });

    const starterPackPrice = await stripe.prices.create({
      product: starterPackProduct.id,
      unit_amount: 990, // 9,90€
      currency: 'eur',
      metadata: {
        analyses_count: '50'
      }
    });

    console.log(`   ✅ Produit créé: ${starterPackProduct.id}`);
    console.log(`   ✅ Prix créé: ${starterPackPrice.id}\n`);

    // 4. PACK STANDARD - 200 analyses
    console.log('4️⃣ Création: Pack Standard - 200 analyses...');
    const standardPackProduct = await stripe.products.create({
      name: 'Pack Standard - 200 analyses',
      description: '200 analyses (valable 6 mois)',
      metadata: {
        analyses_count: '200',
        validity_months: '6',
        pack_type: 'standard'
      }
    });

    const standardPackPrice = await stripe.prices.create({
      product: standardPackProduct.id,
      unit_amount: 3490, // 34,90€
      currency: 'eur',
      metadata: {
        analyses_count: '200'
      }
    });

    console.log(`   ✅ Produit créé: ${standardPackProduct.id}`);
    console.log(`   ✅ Prix créé: ${standardPackPrice.id}\n`);

    // 5. PACK PREMIUM - 500 analyses
    console.log('5️⃣ Création: Pack Premium - 500 analyses...');
    const premiumPackProduct = await stripe.products.create({
      name: 'Pack Premium - 500 analyses',
      description: '500 analyses (valable 12 mois)',
      metadata: {
        analyses_count: '500',
        validity_months: '12',
        pack_type: 'premium'
      }
    });

    const premiumPackPrice = await stripe.prices.create({
      product: premiumPackProduct.id,
      unit_amount: 7990, // 79,90€
      currency: 'eur',
      metadata: {
        analyses_count: '500'
      }
    });

    console.log(`   ✅ Produit créé: ${premiumPackProduct.id}`);
    console.log(`   ✅ Prix créé: ${premiumPackPrice.id}\n`);

    // RÉSUMÉ
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 TOUS LES PRODUITS ONT ÉTÉ CRÉÉS AVEC SUCCÈS !');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 IDs À AJOUTER DANS VOS VARIABLES D\'ENVIRONNEMENT:\n');
    
    console.log('# Render (Backend - packages/api/.env)');
    console.log('STRIPE_SECRET_KEY=<your_stripe_secret_key>');
    console.log('STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>');
    console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthlyPrice.id}`);
    console.log(`STRIPE_PRICE_PRO_YEARLY=${proYearlyPrice.id}`);
    console.log(`STRIPE_PRICE_PACK_STARTER=${starterPackPrice.id}`);
    console.log(`STRIPE_PRICE_PACK_STANDARD=${standardPackPrice.id}`);
    console.log(`STRIPE_PRICE_PACK_PREMIUM=${premiumPackPrice.id}\n`);

    console.log('# Frontend (Vercel/web - packages/web/.env)');
    console.log('VITE_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 DÉTAILS DES PRODUITS:\n');

    console.log('1. Pro Mensuel');
    console.log(`   Product ID: ${proMonthlyProduct.id}`);
    console.log(`   Price ID: ${proMonthlyPrice.id}`);
    console.log(`   Prix: 29,00€/mois\n`);

    console.log('2. Pro Annuel');
    console.log(`   Product ID: ${proYearlyProduct.id}`);
    console.log(`   Price ID: ${proYearlyPrice.id}`);
    console.log(`   Prix: 290,00€/an\n`);

    console.log('3. Pack Starter');
    console.log(`   Product ID: ${starterPackProduct.id}`);
    console.log(`   Price ID: ${starterPackPrice.id}`);
    console.log(`   Prix: 9,90€ (50 analyses)\n`);

    console.log('4. Pack Standard');
    console.log(`   Product ID: ${standardPackProduct.id}`);
    console.log(`   Price ID: ${standardPackPrice.id}`);
    console.log(`   Prix: 34,90€ (200 analyses)\n`);

    console.log('5. Pack Premium');
    console.log(`   Product ID: ${premiumPackProduct.id}`);
    console.log(`   Price ID: ${premiumPackPrice.id}`);
    console.log(`   Prix: 79,90€ (500 analyses)\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔗 VOIR VOS PRODUITS:');
    console.log('   https://dashboard.stripe.com/products\n');

    console.log('⚠️  PROCHAINES ÉTAPES:');
    console.log('   1. Copier les variables ci-dessus dans Render');
    console.log('   2. Configurer les webhooks Stripe');
    console.log('   3. Appliquer le schéma SQL dans Supabase');
    console.log('   4. Redémarrer vos services');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Sauvegarder dans un fichier
    const config = {
      created_at: new Date().toISOString(),
      mode: 'LIVE',
      products: {
        pro_monthly: {
          product_id: proMonthlyProduct.id,
          price_id: proMonthlyPrice.id,
          amount: '29.00€/mois'
        },
        pro_yearly: {
          product_id: proYearlyProduct.id,
          price_id: proYearlyPrice.id,
          amount: '290.00€/an'
        },
        pack_starter: {
          product_id: starterPackProduct.id,
          price_id: starterPackPrice.id,
          amount: '9.90€'
        },
        pack_standard: {
          product_id: standardPackProduct.id,
          price_id: standardPackPrice.id,
          amount: '34.90€'
        },
        pack_premium: {
          product_id: premiumPackProduct.id,
          price_id: premiumPackPrice.id,
          amount: '79.90€'
        }
      }
    };

    require('fs').writeFileSync(
      'stripe-products-config.json',
      JSON.stringify(config, null, 2)
    );

    console.log('✅ Configuration sauvegardée dans: stripe-products-config.json\n');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('   Vérifiez votre clé API Stripe');
    }
    process.exit(1);
  }
}

setupStripeProducts();
