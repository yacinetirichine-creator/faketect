require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  STANDARD: { name: 'Standard', monthlyPrice: 9.99, yearlyPrice: 99, credits: 100 },
  PROFESSIONAL: { name: 'Professional', monthlyPrice: 29.99, yearlyPrice: 299, credits: 500 },
  BUSINESS: { name: 'Business', monthlyPrice: 89, yearlyPrice: 890, credits: 2000 },
  ENTERPRISE: { name: 'Enterprise', monthlyPrice: 249, yearlyPrice: 2490, credits: -1 }
};

async function setupStripeProducts() {
  console.log('🚀 Configuration de Stripe...\n');

  for (const [key, plan] of Object.entries(PLANS)) {
    console.log(`📦 Création du produit: ${plan.name}`);

    // Créer le produit
    const product = await stripe.products.create({
      name: `FakeTect ${plan.name}`,
      description: `${plan.credits > 0 ? plan.credits : 'Unlimited'} analyses/mois`,
      metadata: { plan_id: key }
    });

    // Créer le prix mensuel
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPrice * 100, // en centimes
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { plan_id: key, billing: 'monthly' }
    });

    // Créer le prix annuel
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.yearlyPrice * 100,
      currency: 'eur',
      recurring: { interval: 'year' },
      metadata: { plan_id: key, billing: 'yearly' }
    });

    console.log(`✅ ${plan.name}:`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Monthly Price ID: ${monthlyPrice.id}`);
    console.log(`   Yearly Price ID: ${yearlyPrice.id}\n`);

    // Sauvegarder dans un fichier pour référence
    const fs = require('fs');
    const data = {
      [key]: {
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id
      }
    };

    const filePath = './stripe-products.json';
    let existing = {};
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    fs.writeFileSync(filePath, JSON.stringify({ ...existing, ...data }, null, 2));
  }

  console.log('\n✅ Configuration Stripe terminée !');
  console.log('📄 Les IDs ont été sauvegardés dans: backend/stripe-products.json\n');
}

setupStripeProducts().catch(console.error);
