const express = require('express');
const { auth, checkLimit } = require('../middleware/auth');
const openai = require('../services/openai');
const prisma = require('../config/db');
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

    // Analyser avec OpenAI
    const result = await openai.analyzeText(text);

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

    // Incrémenter les compteurs
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        usedToday: { increment: 1 },
        usedMonth: { increment: 1 }
      }
    });

    // Générer un verdict
    const verdict = getVerdict(result.aiScore);

    res.json({
      success: true,
      analysis: {
        ...updated,
        verdict,
        indicators: result.indicators || [],
        provider: result.provider
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
