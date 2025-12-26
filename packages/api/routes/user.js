const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

// Middleware: toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/user/dashboard
 * Récupère les stats du dashboard client
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer le profil et stats
    const [profileResult, analysesResult, invoicesResult] = await Promise.all([
      supabase.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      supabase.client
        .from('analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.client
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    // Calculer les stats
    const profile = profileResult.data || {};
    const analyses = analysesResult.data || [];
    const invoices = invoicesResult.data || [];
    const totalAnalyses = analysesResult.count || 0;

    // Quota du jour
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyUsage } = await supabase.client
      .from('daily_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const usedToday = dailyUsage?.count || 0;
    const limit = profile.analyses_limit || 3;

    // Stats détaillées
    const aiDetected = analyses.filter(a => a.is_ai_generated).length;
    const avgScore = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + (a.combined_score || 0), 0) / analyses.length 
      : 0;

    res.json({
      success: true,
      data: {
        profile: {
          email: req.user.email,
          plan: profile.plan || 'free',
          fullName: profile.full_name,
          createdAt: profile.created_at
        },
        quota: {
          used: usedToday,
          limit: limit,
          remaining: Math.max(0, limit - usedToday),
          resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
        },
        stats: {
          totalAnalyses,
          aiDetected,
          avgScore: Math.round(avgScore * 100),
          thisMonth: analyses.filter(a => {
            const d = new Date(a.created_at);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length
        },
        recentAnalyses: analyses.slice(0, 5).map(a => ({
          id: a.id,
          filename: a.filename,
          score: a.combined_score,
          isAI: a.is_ai_generated,
          confidence: a.confidence_level,
          createdAt: a.created_at,
          sourceType: a.source_type
        })),
        invoices: invoices.map(i => ({
          id: i.id,
          number: i.invoice_number,
          amount: i.total_cents / 100,
          status: i.status,
          date: i.invoice_date,
          pdfUrl: i.pdf_url
        }))
      }
    });
  } catch (error) {
    console.error('Erreur dashboard client:', error);
    res.status(500).json({ error: true, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/user/analyses
 * Liste complète des analyses avec pagination
 */
router.get('/analyses', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const filter = req.query.filter; // 'ai', 'authentic', 'all'

    let query = supabase.client
      .from('analyses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Appliquer les filtres
    if (filter === 'ai') {
      query = query.eq('is_ai_generated', true);
    } else if (filter === 'authentic') {
      query = query.eq('is_ai_generated', false);
    }

    const { data: analyses, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: {
        analyses: analyses.map(a => ({
          id: a.id,
          filename: a.filename,
          score: a.combined_score,
          isAI: a.is_ai_generated,
          confidence: a.confidence_level,
          createdAt: a.created_at,
          sourceType: a.source_type,
          exif: a.exif_data,
          engines: {
            sightengine: a.sightengine_score,
            illuminarty: a.illuminarty_score
          }
        })),
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur liste analyses:', error);
    res.status(500).json({ error: true, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/user/analyses/:id
 * Détails d'une analyse spécifique
 */
router.get('/analyses/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;

    const { data: analysis, error } = await supabase.client
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (error || !analysis) {
      return res.status(404).json({ error: true, message: 'Analyse non trouvée' });
    }

    res.json({
      success: true,
      data: {
        id: analysis.id,
        filename: analysis.filename,
        fileSize: analysis.file_size,
        mimeType: analysis.mime_type,
        score: analysis.combined_score,
        isAI: analysis.is_ai_generated,
        confidence: analysis.confidence_level,
        createdAt: analysis.created_at,
        sourceType: analysis.source_type,
        source: analysis.source,
        exif: analysis.exif_data,
        exifCamera: analysis.exif_camera,
        exifSoftware: analysis.exif_software,
        exifDate: analysis.exif_date,
        hasAIMarkers: analysis.exif_has_ai_markers,
        engines: {
          sightengine: {
            score: analysis.sightengine_score,
            raw: analysis.sightengine_raw
          },
          illuminarty: {
            score: analysis.illuminarty_score,
            model: analysis.illuminarty_model,
            raw: analysis.illuminarty_raw
          }
        },
        duration: analysis.analysis_duration_ms
      }
    });
  } catch (error) {
    console.error('Erreur détails analyse:', error);
    res.status(500).json({ error: true, message: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/user/analyses/:id
 * Supprimer une analyse
 */
router.delete('/analyses/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const analysisId = req.params.id;

    const { error } = await supabase.client
      .from('analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Analyse supprimée' });
  } catch (error) {
    console.error('Erreur suppression analyse:', error);
    res.status(500).json({ error: true, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/user/invoices
 * Liste des factures
 */
router.get('/invoices', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: invoices, error } = await supabase.client
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        invoices: invoices.map(i => ({
          id: i.id,
          number: i.invoice_number,
          date: i.invoice_date,
          dueDate: i.due_date,
          status: i.status,
          subtotal: i.subtotal_cents / 100,
          tax: i.tax_cents / 100,
          total: i.total_cents / 100,
          pdfUrl: i.pdf_url,
          items: i.invoice_items?.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price_cents / 100,
            total: item.total_cents / 100
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Erreur liste factures:', error);
    res.status(500).json({ error: true, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/user/stats
 * Statistiques détaillées pour graphiques
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    // Récupérer les analyses des X derniers jours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: analyses, error } = await supabase.client
      .from('analyses')
      .select('created_at, is_ai_generated, combined_score, confidence_level')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Grouper par jour
    const dailyStats = {};
    analyses.forEach(a => {
      const day = a.created_at.split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { count: 0, aiCount: 0, totalScore: 0 };
      }
      dailyStats[day].count++;
      if (a.is_ai_generated) dailyStats[day].aiCount++;
      dailyStats[day].totalScore += a.combined_score || 0;
    });

    // Remplir les jours manquants
    const timeline = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().split('T')[0];
      const stats = dailyStats[day] || { count: 0, aiCount: 0, totalScore: 0 };
      timeline.push({
        date: day,
        count: stats.count,
        aiCount: stats.aiCount,
        avgScore: stats.count > 0 ? Math.round((stats.totalScore / stats.count) * 100) : 0
      });
    }

    // Stats par niveau de confiance
    const byConfidence = {
      high: analyses.filter(a => a.confidence_level === 'high').length,
      medium: analyses.filter(a => a.confidence_level === 'medium').length,
      low: analyses.filter(a => a.confidence_level === 'low').length
    };

    res.json({
      success: true,
      data: {
        timeline,
        summary: {
          total: analyses.length,
          aiDetected: analyses.filter(a => a.is_ai_generated).length,
          avgScore: analyses.length > 0 
            ? Math.round(analyses.reduce((s, a) => s + (a.combined_score || 0), 0) / analyses.length * 100)
            : 0
        },
        byConfidence
      }
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ error: true, message: 'Erreur serveur' });
  }
});

/**
 * PUT /api/user/profile
 * Mettre à jour le profil
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, avatarUrl } = req.body;

    const updates = {};
    if (fullName) updates.full_name = fullName;
    if (avatarUrl) updates.avatar_url = avatarUrl;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.client
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Profil mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: true, message: 'Erreur serveur' });
  }
});

module.exports = router;
