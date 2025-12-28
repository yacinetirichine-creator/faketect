const express = require('express');
const prisma = require('../config/db');
const { auth } = require('../middleware/auth');
const PLANS = require('../config/plans');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../config/logger');

const router = express.Router();

router.get('/dashboard', auth, async (req, res) => {
  const user = req.user;
  const plan = PLANS[user.plan] || PLANS.FREE;
  
  const [recent, total, aiCount] = await Promise.all([
    prisma.analysis.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.analysis.count({ where: { userId: user.id } }),
    prisma.analysis.count({ where: { userId: user.id, isAi: true } })
  ]);
  
  res.json({
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan, language: user.language },
    plan: { ...plan, name: plan.name },
    limits: {
      daily: user.plan === 'FREE' ? plan.perDay : null,
      monthly: plan.perMonth,
      usedToday: user.usedToday,
      usedMonth: user.usedMonth,
      remainingToday: user.plan === 'FREE' ? Math.max(0, plan.perDay - user.usedToday) : null,
      remainingMonth: plan.perMonth > 0 ? Math.max(0, plan.perMonth - user.usedMonth) : 'unlimited'
    },
    stats: { total, aiDetected: aiCount, real: total - aiCount },
    recentAnalyses: recent
  });
});

/**
 * POST /api/user/change-plan
 * Changer de plan (upgrade/downgrade)
 */
router.post('/change-plan', auth, async (req, res) => {
  try {
    const { newPlan } = req.body;
    const user = req.user;

    // Vérifier que le plan existe
    if (!PLANS[newPlan]) {
      return res.status(400).json({ error: 'Plan invalide' });
    }

    // Si même plan, rien à faire
    if (user.plan === newPlan) {
      return res.status(400).json({ error: 'Vous êtes déjà sur ce plan' });
    }

    // Si passage à FREE, annuler l'abonnement Stripe
    if (newPlan === 'FREE' && user.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: 'FREE',
            stripeSubscriptionId: null,
            usedMonth: 0,
            usedToday: 0
          }
        });

        logger.info('User downgraded to FREE', { userId: user.id, oldPlan: user.plan });

        return res.json({
          success: true,
          message: 'Abonnement annulé, vous êtes maintenant sur le plan FREE',
          newPlan: 'FREE'
        });
      } catch (stripeError) {
        logger.error('Stripe cancellation error', stripeError);
        return res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'abonnement' });
      }
    }

    // Si upgrade/downgrade entre PRO et BUSINESS avec Stripe
    if (user.stripeSubscriptionId && (newPlan === 'PRO' || newPlan === 'BUSINESS')) {
      try {
        // Récupérer l'abonnement actuel
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        // Récupérer le nouveau price ID
        const products = require('../config/stripe-products');
        const newPriceId = products[newPlan]?.priceId;

        if (!newPriceId) {
          return res.status(400).json({ error: 'Configuration Stripe manquante pour ce plan' });
        }

        // Modifier l'abonnement
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          items: [{
            id: subscription.items.data[0].id,
            price: newPriceId
          }],
          proration_behavior: 'always_invoice' // Facturer la différence immédiatement
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { plan: newPlan }
        });

        logger.info('User changed plan via Stripe', { 
          userId: user.id, 
          oldPlan: user.plan, 
          newPlan 
        });

        return res.json({
          success: true,
          message: `Plan changé avec succès vers ${newPlan}`,
          newPlan
        });
      } catch (stripeError) {
        logger.error('Stripe plan change error', stripeError);
        return res.status(500).json({ error: 'Erreur lors du changement de plan' });
      }
    }

    // Si passage de FREE à PRO/BUSINESS, rediriger vers Stripe Checkout
    if (user.plan === 'FREE' && (newPlan === 'PRO' || newPlan === 'BUSINESS')) {
      return res.json({
        success: false,
        requiresPayment: true,
        message: 'Redirection vers le paiement nécessaire',
        redirectTo: '/pricing'
      });
    }

    res.status(400).json({ error: 'Changement de plan non supporté' });

  } catch (error) {
    logger.error('Change plan error', error);
    res.status(500).json({ error: 'Erreur lors du changement de plan' });
  }
});

/**
 * DELETE /api/user/account
 * Supprimer le compte utilisateur et toutes ses données
 */
router.delete('/account', auth, async (req, res) => {
  try {
    const user = req.user;
    const { confirmation } = req.body;

    // Vérifier la confirmation (sécurité)
    if (confirmation !== user.email) {
      return res.status(400).json({ 
        error: 'Confirmation incorrecte',
        message: 'Veuillez entrer votre email pour confirmer la suppression' 
      });
    }

    // Annuler l'abonnement Stripe si existe
    if (user.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        logger.info('Stripe subscription cancelled for account deletion', { userId: user.id });
      } catch (stripeError) {
        logger.error('Stripe cancellation error during account deletion', stripeError);
        // Continuer quand même la suppression du compte
      }
    }

    // Supprimer toutes les données utilisateur
    // Les analyses seront supprimées automatiquement (onDelete: Cascade dans Prisma)
    await prisma.user.delete({
      where: { id: user.id }
    });

    logger.info('User account deleted', { 
      userId: user.id, 
      email: user.email,
      plan: user.plan
    });

    res.json({
      success: true,
      message: 'Votre compte a été supprimé avec succès'
    });

  } catch (error) {
    logger.error('Account deletion error', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du compte',
      message: 'Une erreur est survenue. Contactez le support si le problème persiste.'
    });
  }
});

module.exports = router;
