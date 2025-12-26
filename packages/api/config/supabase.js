const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase non configuré - Mode simulation');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) : null;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Some legacy services expect `supabase.client`.
// Provide a safe alias that fails only when used (not at import time).
const unavailableClient = {
  from() {
    throw new Error('Supabase admin non configuré (SUPABASE_SERVICE_KEY manquante)');
  },
  rpc() {
    throw new Error('Supabase admin non configuré (SUPABASE_SERVICE_KEY manquante)');
  }
};

const client = supabaseAdmin || unavailableClient;

// Fallback quota store (dev / when Supabase admin isn't configured)
// Keyed by `${userId}:${YYYY-MM-DD}`
const inMemoryVideoQuota = new Map();

function todayKey(userId) {
  const d = new Date();
  const yyyy = String(d.getFullYear()).padStart(4, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${userId}:${yyyy}-${mm}-${dd}`;
}

// Nettoyer les anciennes entrées quotidiennes pour éviter fuite mémoire
setInterval(() => {
  const today = todayKey('').split(':')[1]; // YYYY-MM-DD
  let cleaned = 0;
  for (const [key, _] of inMemoryVideoQuota.entries()) {
    const keyDate = key.split(':')[1];
    if (keyDate !== today) {
      inMemoryVideoQuota.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Nettoyage quota vidéo: ${cleaned} entrées supprimées`);
  }
}, 3600000); // Toutes les heures

function getEnvInt(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  const value = Number.parseInt(raw, 10);
  const v = Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, v));
}

// Retry logic avec backoff exponentiel pour résilience
async function retryWithBackoff(fn, retries = 3, baseDelay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`⚠️  Tentative ${i + 1}/${retries} échouée, retry dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function getUser(accessToken) {
  if (!supabase) return null;
  try {
    return await retryWithBackoff(async () => {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (error) throw error;
      return user;
    });
  } catch (err) {
    console.error('❌ Erreur getUser:', err.message);
    return null;
  }
}

async function getProfile(userId) {
  if (!supabaseAdmin) return null;
  try {
    return await retryWithBackoff(async () => {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    });
  } catch (err) {
    console.error('❌ Erreur getProfile:', err.message);
    return null;
  }
}

async function checkQuota(userId) {
  if (!supabaseAdmin) return { allowed: true, remaining: 999 };
  try {
    return await retryWithBackoff(async () => {
      const { data, error } = await supabaseAdmin.from('user_stats').select('*').eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found, OK
      if (!data) return { allowed: true, remaining: 10 };
      return { allowed: data.remaining_today > 0, remaining: data.remaining_today, limit: data.analyses_limit };
    });
  } catch (err) {
    console.error('❌ Erreur checkQuota:', err.message);
    return { allowed: false, remaining: 0, error: true };
  }
}

async function getVideoQuota(userId) {
  // Hard cap (blocking): never allow more than 15 videos/day/user.
  const limit = getEnvInt('VIDEO_DAILY_LIMIT', 15, { min: 1, max: 15 });
  if (!userId) return { allowed: false, remaining: 0, limit, used: limit };

  if (!supabaseAdmin) {
    const key = todayKey(userId);
    const used = Number(inMemoryVideoQuota.get(key) || 0);
    return { allowed: used < limit, remaining: Math.max(limit - used, 0), limit, used };
  }

  const { data, error } = await supabaseAdmin.rpc('get_video_quota', { p_user_id: userId, p_limit: limit });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: !!row?.allowed,
    remaining: Number(row?.remaining ?? 0),
    limit: Number(row?.limit ?? limit),
    used: Number(row?.used ?? 0)
  };
}

async function consumeVideoQuota(userId) {
  // Hard cap (blocking): never allow more than 15 videos/day/user.
  const limit = getEnvInt('VIDEO_DAILY_LIMIT', 15, { min: 1, max: 15 });
  if (!userId) return { allowed: false, remaining: 0, limit, used: limit };

  if (!supabaseAdmin) {
    const key = todayKey(userId);
    const used = Number(inMemoryVideoQuota.get(key) || 0);
    if (used >= limit) return { allowed: false, remaining: 0, limit, used };
    const nextUsed = used + 1;
    inMemoryVideoQuota.set(key, nextUsed);
    return { allowed: true, remaining: Math.max(limit - nextUsed, 0), limit, used: nextUsed };
  }

  const { data, error } = await supabaseAdmin.rpc('consume_video_quota', { p_user_id: userId, p_limit: limit });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: !!row?.allowed,
    remaining: Number(row?.remaining ?? 0),
    limit: Number(row?.limit ?? limit),
    used: Number(row?.used ?? 0)
  };
}

async function saveAnalysis(analysis) {
  if (!supabaseAdmin) return { success: true, simulated: true };
  const { data, error } = await supabaseAdmin.from('analyses').insert(analysis).select().single();
  return error ? { success: false, error: error.message } : { success: true, data };
}

async function saveBatch(batch) {
  if (!supabaseAdmin) return { success: true, simulated: true, id: require('uuid').v4() };
  const { data, error } = await supabaseAdmin.from('analysis_batches').insert(batch).select().single();
  return error ? { success: false, error: error.message } : { success: true, data };
}

async function updateBatch(batchId, updates) {
  if (!supabaseAdmin) return { success: true };
  const { error } = await supabaseAdmin.from('analysis_batches').update(updates).eq('id', batchId);
  return { success: !error };
}

async function getHistory(userId, limit = 50, offset = 0) {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from('analyses').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  return data || [];
}

async function getAnalysis(userId, analysisId) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .single();
  return data || null;
}

async function getBatches(userId, limit = 20) {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from('analysis_batches').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  return data || [];
}

async function getBatchWithAnalyses(batchId, userId) {
  if (!supabaseAdmin) return null;
  const { data: batch } = await supabaseAdmin.from('analysis_batches').select('*')
    .eq('id', batchId).eq('user_id', userId).single();
  if (!batch) return null;
  const { data: analyses } = await supabaseAdmin.from('analyses').select('*')
    .eq('batch_id', batchId).order('created_at', { ascending: true });
  return { ...batch, analyses: analyses || [] };
}

async function getStats(userId) {
  if (!supabaseAdmin) return { total_analyses: 0, ai_detected_count: 0, average_score: 0, remaining_today: 10 };
  const { data } = await supabaseAdmin.from('user_stats').select('*').eq('user_id', userId).single();
  return data;
}

async function saveReport(report) {
  if (!supabaseAdmin) return { success: true, simulated: true };
  const { data, error } = await supabaseAdmin.from('reports').insert(report).select().single();
  return error ? { success: false } : { success: true, data };
}

async function saveCertificate(certificate) {
  if (!supabaseAdmin) return { success: true, simulated: true, data: certificate };
  const { data, error } = await supabaseAdmin.from('certificates').insert(certificate).select().single();
  return error ? { success: false, error: error.message } : { success: true, data };
}

async function getCertificate(certificateId) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin.from('certificates').select('*').eq('id', certificateId).single();
  return data || null;
}

module.exports = {
  supabase, supabaseAdmin, client, getUser, getProfile, checkQuota,
  saveAnalysis, saveBatch, updateBatch, getHistory, getBatches, getBatchWithAnalyses, getStats, saveReport,
  saveCertificate, getCertificate,
  getAnalysis,
  getVideoQuota,
  consumeVideoQuota
};
