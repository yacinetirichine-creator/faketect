const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getHistory, getBatches, getStats } = require('../config/supabase');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/history - Historique des analyses
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    
    const history = await getHistory(req.user.id, limit, offset);
    
    res.json({
      success: true,
      data: history.map(item => ({
        id: item.id,
        filename: item.filename,
        source_type: item.source_type,
        document_name: item.document_name,
        combined_score: item.combined_score,
        confidence_level: item.confidence_level,
        is_ai_generated: item.is_ai_generated,
        exif_has_ai_markers: item.exif_has_ai_markers,
        engines: {
          sightengine: item.sightengine_score,
          illuminarty: item.illuminarty_score
        },
        detected_model: item.illuminarty_model,
        source: item.source,
        batch_id: item.batch_id,
        created_at: item.created_at
      })),
      pagination: { limit, offset, count: history.length }
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

/**
 * GET /api/history/batches - Liste des lots
 */
router.get('/batches', async (req, res) => {
  try {
    const batches = await getBatches(req.user.id);
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

/**
 * GET /api/history/stats - Statistiques
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStats(req.user.id);
    
    res.json({
      success: true,
      data: {
        total_analyses: stats?.total_analyses || 0,
        ai_detected: stats?.ai_detected_count || 0,
        average_score: stats?.average_score ? Math.round(stats.average_score * 100) : 0,
        remaining_today: stats?.remaining_today || 0,
        daily_limit: stats?.analyses_limit || 10,
        plan: req.profile?.plan || 'free'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

module.exports = router;
