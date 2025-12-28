const express = require('express');
const crypto = require('crypto');
const { auth, checkLimit } = require('../middleware/auth');
const openai = require('../services/openai');
const prisma = require('../config/db');
const cache = require('../services/cache');
const { v4: uuid } = require('uuid');

const router = express.Router();

/**
 * POST /api/text-analysis/analyze
 * Analyse un texte pour détecter s'il est généré par IA
 */
router.post('/analyze', auth, checkLimit, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ 
        error: 'Le texte doit contenir au moins 50 caractères' 
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({ 
        error: 'Le texte ne peut pas dépasser 5000 caractères' 
      });
    }

    // Calculer le hash du texte pour le cache
    const textHash = crypto.createHash('sha256').update(text.trim()).digest('hex');
    const cacheKey = `text:${textHash}`;
    
    // Vérifier si le résultat est en cache
    let result = await cache.get(cacheKey);
    let fromCache = false;
    
    if (result) {
      console.log(`✅ Cache HIT pour texte (${textHash.substring(0, 12)}...)`);
      fromCache = true;
    } else {
      console.log(`⚠️  Cache MISS pour texte (${textHash.substring(0, 12)}...)`);
      
      // Analyser avec OpenAI
      result = await openai.analyzeText(text);
      
      // Stocker le résultat en cache (TTL: 30 jours pour le texte)
      const ttl = 30 * 24 * 60 * 60; // 30 jours
      await cache.set(cacheKey, result, ttl);
    }

    // Créer l'analyse en BDD
    const analysis = await prisma.analysis.create({
      data: {
        id: uuid(),
        userId: req.user.id,
        type: 'TEXT',
        fileName: `text_${Date.now()}.txt`,
        fileUrl: null // Pas de fichier pour le texte
      }
    });

    // Mettre à jour avec les résultats
    const updated = await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        aiScore: result.aiScore,
        isAi: result.isAi,
        confidence: result.confidence,
        details: {
          ...result,
          textLength: text.length,
          textPreview: text.substring(0, 200)
        }
      }
    });

    // Incrémenter les compteurs selon le plan
    if (req.user.plan === 'FREE') {
      // Plan FREE : incrémenter uniquement usedTotal
      await prisma.user.update({
        where: { id: req.user.id },
        data: { usedTotal: { increment: 1 } }
      });
    } else {
      // Plans payants : incrémenter usedToday et usedMonth comme avant
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          usedToday: { increment: 1 },
          usedMonth: { increment: 1 }
        }
      });
    }

    // Générer un verdict
    const verdict = getVerdict(result.aiScore);

    res.json({
      success: true,
      analysis: {
        ...updated,
        verdict,
        indicators: result.indicators || [],
        provider: result.provider,
        fromCache // Indiquer si le résultat vient du cache
      }
    });
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse du texte',
      details: error.message 
    });
  }
});

/**
 * GET /api/text-analysis/explain/:id
 * Obtenir une explication détaillée d'une analyse
 */
router.get('/explain/:id', auth, async (req, res) => {
  try {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analyse non trouvée' });
    }

    const explanation = await openai.explainAnalysis(analysis);

    res.json({
      success: true,
      explanation
    });
  } catch (error) {
    console.error('Explanation error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération de l\'explication' 
    });
  }
});

function getVerdict(score) {
  if (score >= 90) return { key: 'ai_generated', color: 'red' };
  if (score >= 70) return { key: 'likely_ai', color: 'orange' };
  if (score >= 50) return { key: 'possibly_ai', color: 'yellow' };
  if (score >= 30) return { key: 'possibly_real', color: 'lime' };
  return { key: 'likely_real', color: 'green' };
}

module.exports = router;
