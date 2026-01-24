const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  STARTER: { name: 'Starter', monthlyPrice: 12, yearlyPrice: 100, credits: 100 },
  PRO: { name: 'Pro', monthlyPrice: 34, yearlyPrice: 285, credits: 500 },
  BUSINESS: { name: 'Business', monthlyPrice: 89, yearlyPrice: 750, credits: 2000 },
  ENTERPRISE: { name: 'Enterprise', monthlyPrice: 249, yearlyPrice: 2090, credits: -1 }
};

let stripeProducts = null;

async function initializeStripeProducts() {
  const filePath = path.join(__dirname, '../../stripe-products.json');
  
  // Si le fichier existe déjà, le charger
  if (fs.existsSync(filePath)) {
    console.log('✅ Stripe products already configured');
    stripeProducts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return stripeProducts;
  }

  console.log('🚀 Initializing Stripe products...');
  const products = {};

  for (const [key, plan] of Object.entries(PLANS)) {
    try {
      console.log(`📦 Creating product: ${plan.name}`);

      // Créer le produit
      const product = await stripe.products.create({
        name: `FakeTect ${plan.name}`,
        description: `${plan.credits > 0 ? plan.credits : 'Unlimited'} analyses/mois`,
        metadata: { plan_id: key }
      });

      // Créer le prix mensuel
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice * 100,
        currency: 'eur',
        recurring: { interval: 'month' },
        tax_behavior: 'exclusive', // Prix HT, TVA calculée automatiquement
        metadata: { plan_id: key, billing: 'monthly' }
      });

      // Créer le prix annuel
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPrice * 100,
        currency: 'eur',
        recurring: { interval: 'year' },
        tax_behavior: 'exclusive', // Prix HT, TVA calculée automatiquement
        metadata: { plan_id: key, billing: 'yearly' }
      });

      products[key] = {
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id
      };

      console.log(`✅ ${plan.name} created`);
    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
      throw error;
    }
  }

  // Sauvegarder le fichier
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
  console.log('✅ Stripe products initialized and saved\n');
  
  stripeProducts = products;
  return products;
}

function getStripeProducts() {
  if (!stripeProducts) {
    const filePath = path.join(__dirname, '../../stripe-products.json');
    if (fs.existsSync(filePath)) {
      stripeProducts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      throw new Error('Stripe products not initialized. Call initializeStripeProducts() first.');
    }
  }
  return stripeProducts;
}

module.exports = { initializeStripeProducts, getStripeProducts };
