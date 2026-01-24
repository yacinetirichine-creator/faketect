const express = require('express');
const prisma = require('../config/db');
const { auth } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

/**
 * POST /api/consent/cookies
 * Stocke le consentement cookies côté serveur (RGPD compliant)
 * Accepte les utilisateurs connectés et non-connectés (via sessionId)
 */
router.post('/cookies', async (req, res) => {
  try {
    const { preferences = false, analytics = false, functional = false, sessionId } = req.body;

    // Récupérer les infos de preuve de consentement
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Vérifier si l'utilisateur est connecté
    let userId = null;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {
        // Token invalide, on continue sans userId
      }
    }

    const consentData = {
      necessary: true, // Toujours true pour RGPD
      preferences,
      analytics,
      functional,
      ipAddress,
      userAgent: userAgent.substring(0, 500), // Limiter la taille
    };

    let consent;

    if (userId) {
      // Utilisateur connecté: upsert par userId
      consent = await prisma.cookieConsent.upsert({
        where: { userId },
        update: { ...consentData, updatedAt: new Date() },
        create: { userId, ...consentData },
      });
    } else if (sessionId) {
      // Visiteur non-connecté: upsert par sessionId
      const existing = await prisma.cookieConsent.findFirst({
        where: { sessionId, userId: null },
      });

      if (existing) {
        consent = await prisma.cookieConsent.update({
          where: { id: existing.id },
          data: { ...consentData, updatedAt: new Date() },
        });
      } else {
        consent = await prisma.cookieConsent.create({
          data: { sessionId, ...consentData },
        });
      }
    } else {
      // Pas d'identifiant, créer un nouveau consentement
      consent = await prisma.cookieConsent.create({
        data: consentData,
      });
    }

    logger.info('Cookie consent saved', {
      userId: userId || 'anonymous',
      sessionId,
      analytics,
      preferences,
      functional,
    });

    // Définir un cookie HTTP-only avec l'ID du consentement
    res.cookie('consent_id', consent.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 an
    });

    res.json({
      success: true,
      consentId: consent.id,
      consent: {
        necessary: consent.necessary,
        preferences: consent.preferences,
        analytics: consent.analytics,
        functional: consent.functional,
      },
    });

  } catch (error) {
    logger.error('Cookie consent error', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde du consentement' });
  }
});

/**
 * GET /api/consent/cookies
 * Récupère le consentement cookies existant
 */
router.get('/cookies', async (req, res) => {
  try {
    const consentId = req.cookies?.consent_id;
    const sessionId = req.query.sessionId;

    // Vérifier si l'utilisateur est connecté
    let userId = null;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {
        // Token invalide
      }
    }

    let consent = null;

    // Priorité: userId > consentId (cookie) > sessionId
    if (userId) {
      consent = await prisma.cookieConsent.findUnique({ where: { userId } });
    } else if (consentId) {
      consent = await prisma.cookieConsent.findUnique({ where: { id: consentId } });
    } else if (sessionId) {
      consent = await prisma.cookieConsent.findFirst({
        where: { sessionId, userId: null },
      });
    }

    if (!consent) {
      return res.json({ hasConsent: false });
    }

    res.json({
      hasConsent: true,
      consent: {
        necessary: consent.necessary,
        preferences: consent.preferences,
        analytics: consent.analytics,
        functional: consent.functional,
        updatedAt: consent.updatedAt,
      },
    });

  } catch (error) {
    logger.error('Get cookie consent error', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du consentement' });
  }
});

/**
 * DELETE /api/consent/cookies
 * Révoquer le consentement (RGPD Art. 7.3)
 */
router.delete('/cookies', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.cookieConsent.deleteMany({
      where: { userId },
    });

    // Supprimer le cookie
    res.clearCookie('consent_id');

    logger.info('Cookie consent revoked', { userId });

    res.json({ success: true, message: 'Consentement révoqué' });

  } catch (error) {
    logger.error('Revoke consent error', error);
    res.status(500).json({ error: 'Erreur lors de la révocation' });
  }
});

module.exports = router;
