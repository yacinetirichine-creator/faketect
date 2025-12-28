const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');
const { paymentLimiter, webhookLimiter } = require('../middleware/rateLimiter');
const { getStripeProducts } = require('../config/stripe-products');

// ⚠️ IMPORTANT: Le webhook DOIT être géré avec express.raw() AVANT express.json()
// C'est géré dans index.js avec une route spéciale

// Webhook Stripe (gestion des événements de paiement)
router.post('/webhook', webhookLimiter, express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = parseInt(session.metadata.userId);
      const planId = session.metadata.planId;

      // Mettre à jour le plan de l'utilisateur
      await prisma.user.update({
        where: { id: userId },
        data: { 
          plan: planId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription
        }
      });

      console.log(`✅ Plan ${planId} activé pour user ${userId}`);
      break;

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      
      // Trouver l'utilisateur par stripeSubscriptionId
      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id }
      });

      if (user) {
        if (event.type === 'customer.subscription.deleted') {
          // Rétrograder vers FREE
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'FREE', stripeSubscriptionId: null }
          });
          console.log(`❌ Abonnement annulé pour user ${user.id}`);
        }
      }
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      const failedUser = await prisma.user.findFirst({
        where: { stripeCustomerId: invoice.customer }
      });
      if (failedUser) {
        console.log(`⚠️ Échec de paiement pour user ${failedUser.id} - Email: ${failedUser.email}`);
        // TODO: Envoyer email de notification à l'utilisateur
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Créer une session de checkout
router.post('/create-checkout', auth, paymentLimiter, async (req, res) => {
  try {
    const { planId, billing, locale } = req.body; // planId: 'STANDARD', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE' | billing: 'monthly' ou 'yearly' | locale: 'fr', 'en', etc.
    
    const STRIPE_PRICES = getStripeProducts();
    
    if (!STRIPE_PRICES[planId]) {
      return res.status(400).json({ error: 'Plan invalide' });
    }

    const priceId = billing === 'yearly' 
      ? STRIPE_PRICES[planId].yearlyPriceId 
      : STRIPE_PRICES[planId].monthlyPriceId;

    // Mapping des locales i18n vers Stripe
    const stripeLocales = {
      'fr': 'fr',
      'en': 'en',
      'es': 'es',
      'de': 'de',
      'pt': 'pt-BR',
      'it': 'it',
      'ja': 'ja',
      'zh': 'zh'
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      locale: stripeLocales[locale] || 'auto', // Détection automatique ou langue choisie
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      customer_email: req.user.email,
      client_reference_id: req.user.id.toString(),
      metadata: {
        userId: req.user.id.toString(),
        planId: planId,
        billing: billing,
        vat_number: 'FR09938848546' // N° TVA intracommunautaire JARVIS
      },
      allow_promotion_codes: true, // Permet l'utilisation de codes promo
      billing_address_collection: 'required', // Obligatoire pour la TVA
      tax_id_collection: { enabled: true }, // Collecte du numéro de TVA client (B2B)
      automatic_tax: { enabled: true } // Calcul automatique de la TVA selon le pays
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erreur checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer le portail client Stripe
router.post('/customer-portal', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Aucun abonnement actif' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard/settings`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
