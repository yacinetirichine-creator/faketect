const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

const supabase = supabaseAdmin;

// Middleware: Vérifier que l'utilisateur est admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    // Vérifier si l'email est autorisé.
    // Optionnel: définir ADMIN_EMAILS="a@b.com,c@d.com" pour whitelister explicitement.
    const configuredAdmins = String(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const email = String(user.email || '').toLowerCase();
    // Admins: allowlist explicite, sinon fallback strict sur le compte officiel.
    // (Évite tout mélange entre users et admin via heuristiques.)
    const isAdmin = configuredAdmins.length > 0
      ? configuredAdmins.includes(email)
      : email === 'contact@faketect.com';
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
    }

    next()
  } catch (error) {
    console.error('Erreur vérification admin:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/admin/stats - Statistiques globales AMÉLIORÉES
router.get('/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ users: 0, analyses: 0, recentAnalyses: 0, revenue: 0, accuracy: 0, simulated: true });
    }

    // Total utilisateurs (table profiles)
    const { count: totalUsers, error: usersCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (usersCountError) throw usersCountError;

    // Total analyses
    const { count: totalAnalyses, error: analysesCountError } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
    if (analysesCountError) throw analysesCountError;

    // Analyses des 7 derniers jours
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentAnalyses, error: recentAnalysesError } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
    if (recentAnalysesError) throw recentAnalysesError;

    // Analyses aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayAnalyses } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // ✅ NOUVEAU: Revenus détaillés
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let revenueByPlan = { free: 0, starter: 0, pro: 0, business: 0, enterprise: 0 };
    
    try {
      // Revenus totaux
      const { data: allPayments } = await supabase
        .from('billing_transactions')
        .select('amount, created_at, metadata')
        .eq('status', 'succeeded')
      
      if (allPayments) {
        totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Revenus ce mois
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        monthlyRevenue = allPayments
          .filter(p => new Date(p.created_at) >= monthStart)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      }
    } catch {}

    // ✅ NOUVEAU: Compter utilisateurs par plan
    let usersByPlan = { free: 0, starter: 0, pro: 0, business: 0, enterprise: 0 };
    try {
      const { data: plans } = await supabase
        .from('profiles')
        .select('plan')
      
      if (plans) {
        plans.forEach(p => {
          const plan = p.plan || 'free';
          if (usersByPlan[plan] !== undefined) {
            usersByPlan[plan]++;
          }
        });
      }
    } catch {}

    // Score moyen basé sur combined_score (0..1) si dispo.
    const { data: analyses, error: avgScoreError } = await supabase
      .from('analyses')
      .select('combined_score')
      .not('combined_score', 'is', null)
      .limit(1000)
    if (avgScoreError) {
      console.warn('⚠️  Impossible de calculer accuracy (combined_score):', avgScoreError.message);
    }

    let averageAccuracy = 92.4 // Valeur par défaut
    try {
      if (Array.isArray(analyses) && analyses.length > 0) {
        const scores = analyses
          .map(a => Number(a.combined_score))
          .filter(s => Number.isFinite(s));
        if (scores.length > 0) {
          const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
          averageAccuracy = avg * 100;
        }
      }
    } catch {}

    // ✅ NOUVEAU: Problèmes signalés par l'agent IA
    let aiIssuesCount = 0;
    let openIssuesCount = 0;
    try {
      const { count: issues } = await supabase
        .from('support_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
      
      openIssuesCount = issues || 0;
      
      const { count: allIssues } = await supabase
        .from('support_conversations')
        .select('*', { count: 'exact', head: true })
      
      aiIssuesCount = allIssues || 0;
    } catch {}

    res.json({
      users: totalUsers || 0,
      analyses: totalAnalyses || 0,
      recentAnalyses: recentAnalyses || 0,
      todayAnalyses: todayAnalyses || 0,
      revenue: totalRevenue,
      monthlyRevenue: monthlyRevenue,
      revenueFormatted: `${(totalRevenue / 100).toFixed(2)}€`,
      monthlyRevenueFormatted: `${(monthlyRevenue / 100).toFixed(2)}€`,
      accuracy: Math.round(averageAccuracy * 10) / 10,
      usersByPlan,
      aiIssues: {
        total: aiIssuesCount,
        open: openIssuesCount
      }
    })
  } catch (error) {
    console.error('Erreur récupération stats:', error)
    res.status(500).json({ error: 'Erreur récupération statistiques' })
  }
})

// GET /api/admin/users - Liste des utilisateurs
router.get('/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query

    if (!supabase) {
      const pageNum = Math.max(parseInt(page) || 1, 1);
      const perPage = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
      return res.json({ users: [], total: 0, page: pageNum, limit: perPage, simulated: true });
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

    // 1) Récupérer les users depuis Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page: pageNum,
      perPage
    });
    if (authError) throw authError;

    let authUsers = authData?.users || [];

    // 2) Filtrage (best-effort) côté API
    if (search) {
      const q = String(search).toLowerCase();
      authUsers = authUsers.filter(u => String(u.email || '').toLowerCase().includes(q));
    }

    if (status === 'banned') {
      authUsers = authUsers.filter(u => u.banned_until && new Date(u.banned_until).getTime() > Date.now());
    } else if (status === 'active') {
      authUsers = authUsers.filter(u => !u.banned_until || new Date(u.banned_until).getTime() <= Date.now());
    }

    const userIds = authUsers.map(u => u.id).filter(Boolean);

    // 3) Enrichir avec la table profiles (plan, analyses_count, etc.)
    const profilesById = new Map();
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, plan, analyses_count, created_at, email')
        .in('id', userIds);
      if (!profilesError && Array.isArray(profiles)) {
        for (const p of profiles) profilesById.set(p.id, p);
      }
    }

    const usersWithStats = authUsers.map(u => {
      const p = profilesById.get(u.id);
      const banned = u.banned_until && new Date(u.banned_until).getTime() > Date.now();
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at || p?.created_at || null,
        last_sign_in_at: u.last_sign_in_at || null,
        user_metadata: u.user_metadata || {},
        banned_at: banned ? u.banned_until : null,
        analyses: Number(p?.analyses_count || 0),
        plan: p?.plan || 'free',
        status: banned ? 'banned' : 'active'
      };
    });

    // Total (approx): on utilise la table profiles comme vérité.
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    res.json({
      users: usersWithStats,
      total: totalUsers || usersWithStats.length,
      page: pageNum,
      limit: perPage
    })
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error)
    res.status(500).json({ error: 'Erreur récupération utilisateurs' })
  }
})

// PUT /api/admin/users/:userId/ban - Bannir/débannir un utilisateur
router.put('/users/:userId/ban', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { banned } = req.body

    if (!supabase) {
      return res.json({ success: true, user: { id: userId }, message: banned ? 'Utilisateur banni' : 'Utilisateur débanni', simulated: true });
    }

    // Supabase Auth: ban_duration
    // - Pour bannir: durée très longue
    // - Pour débannir: "none"
    const banDuration = banned ? '876000h' : 'none';
    const { data, error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: banDuration });
    if (error) throw error;

    res.json({
      success: true,
      user: data?.user || null,
      message: banned ? 'Utilisateur banni' : 'Utilisateur débanni'
    });
  } catch (error) {
    console.error('Erreur ban utilisateur:', error)
    res.status(500).json({ error: 'Erreur modification utilisateur' })
  }
})

// DELETE /api/admin/analyses/:analysisId - Supprimer une analyse
router.delete('/analyses/:analysisId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { analysisId } = req.params

    if (!supabase) {
      return res.json({ success: true, message: 'Analyse supprimée', simulated: true })
    }

    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', analysisId)

    if (error) throw error

    res.json({ success: true, message: 'Analyse supprimée' })
  } catch (error) {
    console.error('Erreur suppression analyse:', error)
    res.status(500).json({ error: 'Erreur suppression analyse' })
  }
})

// GET /api/admin/analyses - Liste des analyses récentes
router.get('/analyses', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId } = req.query

    if (!supabase) {
      return res.json({ analyses: [], total: 0, page: parseInt(page), limit: parseInt(limit), simulated: true })
    }
    
    let query = supabase
      .from('analyses')
      .select('id, user_id, source_type, filename, combined_score, is_ai_generated, created_at, file_url', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query.range(offset, offset + parseInt(limit) - 1)

    const { data: analyses, count, error } = await query

    if (error) throw error

    res.json({
      analyses,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (error) {
    console.error('Erreur récupération analyses:', error)
    res.status(500).json({ error: 'Erreur récupération analyses' })
  }
})

// GET /api/admin/activity - Activité récente
router.get('/activity', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query

    if (!supabase) {
      return res.json({ activity: [], simulated: true })
    }

    // Récupérer les dernières analyses
    const { data: recentAnalyses } = await supabase
      .from('analyses')
      .select('id, user_id, source_type, created_at')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    // Récupérer les derniers utilisateurs inscrits
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Récupérer les dernières transactions
    let recentTransactions = [];
    try {
      const { data } = await supabase
        .from('billing_transactions')
        .select('id, user_id, amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      recentTransactions = data || [];
    } catch {}

    // Combiner et formater l'activité
    const activity = [
      ...(recentAnalyses || []).map(a => ({
        id: a.id,
        type: 'analysis',
        description: `Analyse ${a.source_type || 'image'} effectuée`,
        userId: a.user_id,
        timestamp: a.created_at
      })),
      ...(recentUsers || []).map(u => ({
        id: u.id,
        type: 'user',
        description: `Nouvel utilisateur: ${u.email}`,
        userId: u.id,
        timestamp: u.created_at
      })),
      ...(recentTransactions || []).map(t => ({
        id: t.id,
        type: 'transaction',
        description: `Paiement ${t.status}: ${(t.amount / 100).toFixed(2)}€`,
        userId: t.user_id,
        timestamp: t.created_at
      }))
    ]

    // Trier par timestamp décroissant
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json({
      activity: activity.slice(0, parseInt(limit))
    })
  } catch (error) {
    console.error('Erreur récupération activité:', error)
    res.status(500).json({ error: 'Erreur récupération activité' })
  }
})

// GET /api/admin/support/conversations - Liste des conversations du chat IA
router.get('/support/conversations', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    if (!supabase) {
      return res.json({ conversations: [], total: 0, page: parseInt(page), pages: 0, simulated: true })
    }

    let query = supabase
      .from('support_conversations')
      .select('*', { count: 'exact' })
      .order('last_message_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`user_email.ilike.%${search}%,session_id.ilike.%${search}%`)
    }

    const { data: conversations, count, error } = await query

    if (error) throw error

    // Formater les conversations pour l'affichage
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      userId: conv.user_id,
      userEmail: conv.user_email,
      sessionId: conv.session_id,
      messageCount: conv.messages?.length || 0,
      lastMessage: conv.messages?.[conv.messages.length - 1]?.content?.substring(0, 100) || '',
      status: conv.status,
      priority: conv.priority,
      lastMessageAt: conv.last_message_at,
      createdAt: conv.created_at
    }))

    res.json({
      conversations: formattedConversations,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit))
    })
  } catch (error) {
    console.error('Erreur récupération conversations:', error)
    res.status(500).json({ error: 'Erreur récupération conversations' })
  }
})

// GET /api/admin/support/conversations/:id - Détails d'une conversation
router.get('/support/conversations/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    if (!supabase) {
      return res.status(404).json({ error: 'Conversation non trouvée', simulated: true })
    }

    const { data: conversation, error } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' })
    }

    res.json({ conversation })
  } catch (error) {
    console.error('Erreur récupération conversation:', error)
    res.status(500).json({ error: 'Erreur récupération conversation' })
  }
})

// PUT /api/admin/support/conversations/:id - Mettre à jour une conversation (statut, priorité, notes)
router.put('/support/conversations/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status, priority, adminNotes } = req.body

    if (!supabase) {
      return res.json({ conversation: { id, status, priority, admin_notes: adminNotes }, simulated: true })
    }

    const updates = {}
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (adminNotes !== undefined) updates.admin_notes = adminNotes

    const { data, error } = await supabase
      .from('support_conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ conversation: data })
  } catch (error) {
    console.error('Erreur mise à jour conversation:', error)
    res.status(500).json({ error: 'Erreur mise à jour conversation' })
  }
})

// POST /api/admin/support/conversations/:id/reply - Répondre à une conversation
router.post('/support/conversations/:id/reply', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message requis' })
    }

    if (!supabase) {
      return res.json({ conversation: { id, messages: [{ role: 'admin', content: message, timestamp: new Date().toISOString(), adminEmail: req.user.email }] }, simulated: true })
    }

    // Récupérer la conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Ajouter le message admin
    const newMessage = {
      role: 'admin',
      content: message,
      timestamp: new Date().toISOString(),
      adminEmail: req.user.email
    }

    const updatedMessages = [...(conversation.messages || []), newMessage]

    // Mettre à jour la conversation
    const { data: updated, error: updateError } = await supabase
      .from('support_conversations')
      .update({
        messages: updatedMessages,
        last_message_at: new Date().toISOString(),
        status: 'pending' // Marquer comme en attente de réponse utilisateur
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({ conversation: updated })
  } catch (error) {
    console.error('Erreur réponse conversation:', error)
    res.status(500).json({ error: 'Erreur réponse conversation' })
  }
})

// GET /api/admin/support/stats - Statistiques support
router.get('/support/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ open_count: 0, pending_count: 0, resolved_count: 0, today_count: 0, week_count: 0, avg_response_time_hours: 0, simulated: true })
    }

    const { data: stats, error } = await supabase
      .from('support_stats')
      .select('*')
      .single()

    if (error) throw error

    res.json(stats || {
      open_count: 0,
      pending_count: 0,
      resolved_count: 0,
      today_count: 0,
      week_count: 0,
      avg_response_time_hours: 0
    })
  } catch (error) {
    console.error('Erreur récupération stats support:', error)
    res.status(500).json({ error: 'Erreur récupération stats support' })
  }
})

module.exports = router;
