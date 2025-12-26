const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');

const DEFAULT_LIMIT = 3;

function getLimit() {
  const envLimit = Number.parseInt(process.env.GUEST_DAILY_LIMIT || '', 10);
  return Number.isFinite(envLimit) && envLimit > 0 ? envLimit : DEFAULT_LIMIT;
}

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Fallback in-memory daily quota store (per IP). Resets on restart.
const store = new Map();

// Nettoyer les anciennes entrées toutes les heures pour éviter fuite mémoire
setInterval(() => {
  const today = getTodayKey();
  let cleaned = 0;
  for (const [key, _] of store.entries()) {
    if (!key.startsWith(today)) {
      store.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Nettoyage quota invités: ${cleaned} entrées supprimées`);
  }
}, 3600000); // Toutes les heures

function getMemoryKey(ip) {
  const safeIp = ip || 'unknown';
  const ipHash = crypto.createHash('sha256').update(String(safeIp)).digest('hex');
  return `${getTodayKey()}|ip:${ipHash}`;
}

function normalizeFingerprint(fingerprint) {
  if (fingerprint == null) return null;
  const v = String(fingerprint).trim();
  if (!v) return null;
  // Avoid unbounded inputs from clients.
  if (v.length > 512) return v.slice(0, 512);
  return v;
}

function getMemoryKeyWithFingerprint(ip, fingerprint) {
  const fp = normalizeFingerprint(fingerprint);
  if (fp) {
    const fpHash = crypto.createHash('sha256').update(fp).digest('hex');
    return `${getTodayKey()}|fp:${fpHash}`;
  }
  return getMemoryKey(ip);
}

function getQuotaMemory(ip, fingerprint) {
  const limit = getLimit();
  const key = getMemoryKeyWithFingerprint(ip, fingerprint);
  const existing = store.get(key);
  const remaining = typeof existing === 'number' ? existing : limit;
  return { allowed: remaining > 0, remaining, limit, used: limit - remaining };
}

function consumeMemory(ip, fingerprint) {
  const limit = getLimit();
  const key = getMemoryKeyWithFingerprint(ip, fingerprint);
  const existing = store.get(key);
  const current = typeof existing === 'number' ? existing : limit;
  const next = Math.max(0, current - 1);
  store.set(key, next);
  const used = limit - next;
  return { allowed: current > 0, remaining: next, limit, used };
}

async function getQuota(ip, fingerprint) {
  const limit = getLimit();
  const fp = normalizeFingerprint(fingerprint);

  // Persisted quota via Supabase RPC (service role)
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc('get_guest_quota', {
      p_ip: ip || 'unknown',
      p_fingerprint: fp,
      p_limit: limit
    });

    if (!error && Array.isArray(data) && data[0]) {
      return {
        allowed: !!data[0].allowed,
        remaining: Number(data[0].remaining ?? 0),
        limit: Number(data[0].limit ?? limit),
        used: Number(data[0].used ?? 0),
        persistent: true
      };
    }
  }

  return { ...getQuotaMemory(ip, fp), persistent: false };
}

async function consume(ip, fingerprint) {
  const limit = getLimit();
  const fp = normalizeFingerprint(fingerprint);

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc('consume_guest_quota', {
      p_ip: ip || 'unknown',
      p_fingerprint: fp,
      p_limit: limit
    });

    if (!error && Array.isArray(data) && data[0]) {
      return {
        allowed: !!data[0].allowed,
        remaining: Number(data[0].remaining ?? 0),
        limit: Number(data[0].limit ?? limit),
        used: Number(data[0].used ?? 0),
        persistent: true
      };
    }
  }

  return { ...consumeMemory(ip, fp), persistent: false };
}

module.exports = { getQuota, consume };
