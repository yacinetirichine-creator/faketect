const express = require('express');
const prisma = require('../config/db');
const { auth, admin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const logger = require('../config/logger');
const nodemailer = require('nodemailer');

const router = express.Router();

// Configuration email (utilise les mêmes credentials que le service existant)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * POST /api/newsletter/subscribe
 * Inscription newsletter (PUBLIC)
 */
router.post('/subscribe', authLimiter, async (req, res) => {
  try {
    const { email, name, language = 'fr', interests = ['product_updates'], source = 'website' } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Vérifier si déjà inscrit
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      // Si déjà inscrit mais désabonné, réactiver
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: {
            isActive: true,
            interests,
            confirmedAt: new Date(),
            unsubscribedAt: null,
          },
        });
        return res.json({ message: 'Réinscription réussie', wasReactivated: true });
      }
      return res.status(400).json({ error: 'Email déjà inscrit' });
    }

    // Créer nouvel abonné
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        language,
        interests,
        source,
        confirmedAt: new Date(), // Auto-confirmé (optionnel: ajouter double opt-in plus tard)
      },
    });

    // Envoyer email de bienvenue
    try {
      const welcomeMessages = {
        fr: {
          subject: '🎉 Bienvenue dans la newsletter FakeTect',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Bienvenue ${name || 'cher abonné'} !</h2>
              <p>Merci de vous être inscrit à notre newsletter.</p>
              <p>Vous recevrez désormais :</p>
              <ul>
                ${interests.includes('product_updates') ? '<li>✨ Les nouveautés produit</li>' : ''}
                ${interests.includes('case_studies') ? '<li>📰 Les cas d\'usage (journalistes, recruteurs...)</li>' : ''}
                ${interests.includes('statistics') ? '<li>📊 Les statistiques de détections (anonymisées)</li>' : ''}
              </ul>
              <p>À très bientôt !<br>L'équipe FakeTect</p>
              <hr>
              <p style="font-size: 11px; color: #666;">
                <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe?email=${email}">Se désabonner</a>
              </p>
            </div>
          `,
        },
        en: {
          subject: '🎉 Welcome to FakeTect Newsletter',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome ${name || 'dear subscriber'}!</h2>
              <p>Thank you for subscribing to our newsletter.</p>
              <p>You will now receive:</p>
              <ul>
                ${interests.includes('product_updates') ? '<li>✨ Product updates</li>' : ''}
                ${interests.includes('case_studies') ? '<li>📰 Use cases (journalists, recruiters...)</li>' : ''}
                ${interests.includes('statistics') ? '<li>📊 Detection statistics (anonymized)</li>' : ''}
              </ul>
              <p>See you soon!<br>The FakeTect Team</p>
              <hr>
              <p style="font-size: 11px; color: #666;">
                <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe?email=${email}">Unsubscribe</a>
              </p>
            </div>
          `,
        },
      };

      const msg = welcomeMessages[language] || welcomeMessages.fr;

      await transporter.sendMail({
        from: `"FakeTect" <${process.env.SMTP_USER}>`,
        to: email,
        subject: msg.subject,
        html: msg.html,
      });
    } catch (emailError) {
      logger.error('Newsletter welcome email error:', emailError);
      // Continue même si email échoue
    }

    logger.info('Newsletter subscription', { email, source, language });

    res.json({
      message: 'Inscription réussie',
      subscriber: {
        email: subscriber.email,
        language: subscriber.language,
        interests: subscriber.interests,
      },
    });

  } catch (error) {
    logger.error('Newsletter subscribe error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

/**
 * POST /api/newsletter/unsubscribe
 * Désabonnement newsletter (PUBLIC)
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Email non trouvé' });
    }

    await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    logger.info('Newsletter unsubscription', { email });

    res.json({ message: 'Désabonnement réussi' });

  } catch (error) {
    logger.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ error: 'Erreur lors du désabonnement' });
  }
});

/**
 * GET /api/newsletter/subscribers (Admin)
 * Liste des abonnés
 */
router.get('/subscribers', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 50, active = 'all' } = req.query;

    const where = active === 'active' ? { isActive: true } : active === 'inactive' ? { isActive: false } : {};

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.newsletterSubscriber.count({ where });

    // Statistiques
    const stats = {
      total: await prisma.newsletterSubscriber.count(),
      active: await prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      inactive: await prisma.newsletterSubscriber.count({ where: { isActive: false } }),
      bySource: await prisma.newsletterSubscriber.groupBy({
        by: ['source'],
        _count: true,
      }),
      byLanguage: await prisma.newsletterSubscriber.groupBy({
        by: ['language'],
        _count: true,
      }),
    };

    res.json({
      subscribers,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    logger.error('Get newsletter subscribers error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

/**
 * POST /api/newsletter/campaigns (Admin)
 * Créer et envoyer une campagne
 */
router.post('/campaigns', auth, admin, async (req, res) => {
  try {
    const { subject, content, language = 'fr', type, scheduledAt } = req.body;

    if (!subject || !content || !type) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Créer la campagne
    const campaign = await prisma.newsletterCampaign.create({
      data: {
        subject,
        content,
        language,
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    // Si pas de date programmée, envoyer immédiatement
    if (!scheduledAt) {
      // Récupérer les abonnés actifs pour cette langue
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: {
          isActive: true,
          language,
        },
      });

      let sentCount = 0;

      // Envoyer en batch (éviter rate limit)
      for (const subscriber of subscribers) {
        try {
          await transporter.sendMail({
            from: `"FakeTect" <${process.env.SMTP_USER}>`,
            to: subscriber.email,
            subject,
            html: content + `<hr><p style="font-size: 11px; color: #666;"><a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe?email=${subscriber.email}">Se désabonner</a></p>`,
          });
          sentCount++;

          // Pause toutes les 10 emails pour éviter rate limit
          if (sentCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (emailError) {
          logger.error('Campaign email error:', { email: subscriber.email, error: emailError.message });
        }
      }

      // Mettre à jour la campagne
      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: {
          sentTo: sentCount,
          sentAt: new Date(),
        },
      });

      logger.info('Newsletter campaign sent', { campaignId: campaign.id, sentTo: sentCount });

      return res.json({
        message: 'Campagne envoyée',
        campaign: { ...campaign, sentTo: sentCount },
      });
    }

    res.json({
      message: 'Campagne programmée',
      campaign,
    });

  } catch (error) {
    logger.error('Create campaign error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la campagne' });
  }
});

/**
 * GET /api/newsletter/campaigns (Admin)
 * Liste des campagnes
 */
router.get('/campaigns', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const campaigns = await prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.newsletterCampaign.count();

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    logger.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

module.exports = router;
