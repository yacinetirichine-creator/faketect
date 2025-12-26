const express = require('express');
const router = express.Router();
const billingService = require('../services/billing');
const invoicePDFService = require('../services/invoice-pdf');
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Routes de facturation et paiement
 */

/**
 * POST /api/billing/webhooks/stripe
 * Webhook Stripe (sans authentification)
 */
router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('⚠️  STRIPE_WEBHOOK_SECRET non configuré');
      return res.status(400).json({ error: 'Webhook non configuré' });
    }

    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      console.log(`📨 Webhook Stripe reçu: ${event.type}`);

      // Traiter l'événement
      const result = await billingService.handleStripeWebhook(event);

      res.json(result);
    } catch (error) {
      console.error('Erreur webhook Stripe:', error);
      res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
  }
);

// Middleware d'authentification pour toutes les autres routes
router.use(authenticate);

/**
 * GET /api/billing/profile
 * Récupérer ou créer le profil de facturation
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    if (!supabaseAdmin) {
      return res.json({
        profile: {
          user_id: userId,
          email: req.user.email,
          account_type: 'individual',
          simulated: true
        },
        simulated: true
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({
        error: 'Profil non trouvé',
        message: 'Veuillez compléter votre profil de facturation'
      });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/billing/profile
 * Créer ou mettre à jour le profil de facturation
 */
router.post('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    if (!supabaseAdmin) {
      return res.json({
        success: true,
        profile: {
          user_id: userId,
          email: req.user.email,
          ...(req.body || {}),
          simulated: true
        },
        message: 'Profil de facturation simulé (Supabase non configuré)',
        simulated: true
      });
    }
    const profileData = {
      ...req.body,
      email: req.user.email // Utiliser l'email authentifié
    };

    const profile = await billingService.getOrCreateUserProfile(userId, profileData);

    res.json({
      success: true,
      profile,
      message: 'Profil de facturation créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/billing/invoices
 * Liste des factures de l'utilisateur
 */
router.get('/invoices', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, year } = req.query;

    if (!supabaseAdmin) {
      return res.json({ invoices: [], simulated: true });
    }

    const filters = {};
    if (status) filters.status = status;
    if (year) filters.year = parseInt(year);

    const invoices = await billingService.getUserInvoices(userId, filters);

    res.json({ invoices });
  } catch (error) {
    console.error('Erreur récupération factures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/billing/invoices/:id
 * Détails d'une facture
 */
router.get('/invoices/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service indisponible', simulated: true });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Erreur récupération facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/billing/invoices/:id/pdf
 * Télécharger le PDF d'une facture
 */
router.get('/invoices/:id/pdf', async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Vérifier que la facture appartient à l'utilisateur
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service indisponible', simulated: true });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('id, user_id, invoice_number')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Générer ou récupérer le PDF
    const { filepath, filename } = await invoicePDFService.getInvoicePDF(invoiceId);

    // Envoyer le fichier
    res.download(filepath, filename);
  } catch (error) {
    console.error('Erreur téléchargement PDF:', error);
    res.status(500).json({ error: 'Erreur génération PDF' });
  }
});

/**
 * POST /api/billing/invoices/:id/regenerate-pdf
 * Régénérer le PDF d'une facture
 */
router.post('/invoices/:id/regenerate-pdf', async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Vérifier que la facture appartient à l'utilisateur
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service indisponible', simulated: true });
    }

    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    if (!invoice) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const result = await invoicePDFService.regenerateInvoicePDF(invoiceId);

    res.json({
      success: true,
      message: 'PDF régénéré avec succès',
      ...result
    });
  } catch (error) {
    console.error('Erreur régénération PDF:', error);
    res.status(500).json({ error: 'Erreur régénération PDF' });
  }
});

/**
 * POST /api/billing/checkout/quota-pack
 * Créer une session de paiement pour un pack de quotas
 */
router.post('/checkout/quota-pack', async (req, res) => {
  try {
    const userId = req.user.id;
    const { pack_id, analyses_count, price_cents, success_url, cancel_url } = req.body;

    if (!pack_id || !analyses_count || !price_cents) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const session = await billingService.createCheckoutSession(userId, {
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: price_cents,
          product_data: {
            name: `Pack de ${analyses_count} analyses`,
            description: `Crédit de ${analyses_count} analyses d'images avec Faketect`,
            metadata: {
              type: 'quota_pack',
              pack_id,
              analyses_count
            }
          }
        },
        quantity: 1
      }],
      success_url: success_url || `${process.env.WEB_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.WEB_URL}/pricing`,
      metadata: {
        type: 'quota_purchase',
        pack_id,
        analyses_count: analyses_count.toString()
      },
      description: `Achat de ${analyses_count} analyses`
    });

    res.json({
      success: true,
      session_id: session.id,
      session_url: session.url
    });
  } catch (error) {
    console.error('Erreur création session checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/billing/checkout/subscription
 * Créer une session de paiement pour un abonnement
 */
router.post('/checkout/subscription', async (req, res) => {
  try {
    const userId = req.user.id;
    const { price_id, plan_name, success_url, cancel_url } = req.body;

    if (!price_id || !plan_name) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const session = await billingService.createCheckoutSession(userId, {
      mode: 'subscription',
      line_items: [{
        price: price_id,
        quantity: 1
      }],
      success_url: success_url || `${process.env.WEB_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.WEB_URL}/pricing`,
      metadata: {
        type: 'subscription',
        plan_name
      },
      description: `Abonnement ${plan_name}`
    });

    res.json({
      success: true,
      session_id: session.id,
      session_url: session.url
    });
  } catch (error) {
    console.error('Erreur création session subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/billing/portal
 * Créer une session du portail client Stripe
 */
router.post('/portal', async (req, res) => {
  try {
    const userId = req.user.id;
    const { return_url } = req.body;

    const session = await billingService.createCustomerPortalSession(
      userId,
      return_url || process.env.WEB_URL
    );

    res.json({
      success: true,
      portal_url: session.url
    });
  } catch (error) {
    console.error('Erreur création portail client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/billing/subscriptions
 * Liste des abonnements actifs
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const userId = req.user.id;

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service indisponible' });
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ subscriptions });
  } catch (error) {
    console.error('Erreur récupération abonnements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/billing/subscription
 * Abonnement courant (dernier actif)
 */
router.get('/subscription', async (req, res) => {
  try {
    const userId = req.user.id;

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service indisponible' });
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    res.json({ subscription: Array.isArray(subscriptions) ? subscriptions[0] : null });
  } catch (error) {
    console.error('Erreur récupération abonnement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/billing/transactions
 * Historique des transactions
 */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service indisponible' });
    }

    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ transactions });
  } catch (error) {
    console.error('Erreur récupération transactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
