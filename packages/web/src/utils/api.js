import axios from 'axios'
import { cachedFetch } from './cacheService'

import { API_BASE_URL } from '../config/api'

const API_URL = API_BASE_URL
const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 120000 })

function withTimeout(promise, timeoutMs, timeoutMessage) {
  const ms = Number(timeoutMs) || 0
  if (ms <= 0) return promise

  let timerId
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(timeoutMessage || `Timeout after ${ms}ms`))
    }, ms)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId) clearTimeout(timerId)
  })
}

function getCookie(name) {
  try {
    const cookieStr = document?.cookie || ''
    const parts = cookieStr.split(';').map(s => s.trim())
    for (const p of parts) {
      if (p.startsWith(`${name}=`)) return decodeURIComponent(p.slice(name.length + 1))
    }
  } catch {}
  return null
}

function setCookie(name, value, maxAgeSeconds = 31536000) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`
  } catch {}
}

async function sha256Hex(input) {
  const str = String(input)
  // Prefer WebCrypto.
  try {
    const data = new TextEncoder().encode(str)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Fallback: non-crypto hash (best-effort) if subtle isn't available.
    let h = 2166136261
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return `fnv1a-${(h >>> 0).toString(16).padStart(8, '0')}`
  }
}

function canvasSignature() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 220
    canvas.height = 60
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'noctx'

    ctx.textBaseline = 'top'
    ctx.font = "14px Arial"
    ctx.fillStyle = '#f60'
    ctx.fillRect(0, 0, 220, 60)
    ctx.fillStyle = '#069'
    ctx.fillText('FakeTect-fp', 2, 2)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('FakeTect-fp', 4, 4)

    return canvas.toDataURL()
  } catch {
    return 'nocanvas'
  }
}

// Fingerprint stable: deterministic hash of a few browser characteristics.
// Persisted in localStorage + cookie for faster retrieval.
export async function getFingerprint() {
  // If we are not in a browser (SSR/build), skip.
  if (typeof window === 'undefined') return null

  const LS_KEY = 'faketect:fingerprint'
  const COOKIE_KEY = 'faketect_fp'

  try {
    const existing = localStorage.getItem(LS_KEY)
    if (existing) return existing
  } catch {}

  const cookieVal = getCookie(COOKIE_KEY)
  if (cookieVal) {
    try { localStorage.setItem(LS_KEY, cookieVal) } catch {}
    return cookieVal
  }

  const tz = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { return '' }
  })()

  const raw = JSON.stringify({
    ua: navigator.userAgent,
    lang: navigator.language,
    platform: navigator.platform,
    screen: {
      w: window.screen?.width,
      h: window.screen?.height,
      dpr: window.devicePixelRatio,
      cd: window.screen?.colorDepth
    },
    tz,
    tzOffset: new Date().getTimezoneOffset(),
    canvas: canvasSignature()
  })

  const fp = await sha256Hex(raw)

  try { localStorage.setItem(LS_KEY, fp) } catch {}
  setCookie(COOKIE_KEY, fp)
  return fp
}

async function getFingerprintSafe(timeoutMs = 1200) {
  try {
    return await withTimeout(getFingerprint(), timeoutMs, 'Fingerprint timeout')
  } catch {
    return null
  }
}

// Inject x-fingerprint on ALL Axios requests.
api.interceptors.request.use(async (config) => {
  const fp = await getFingerprintSafe()
  if (fp) {
    config.headers = config.headers || {}
    config.headers['x-fingerprint'] = fp
  }
  return config
})

export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete api.defaults.headers.common['Authorization']
}

// Analyse simple
export async function analyzeImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  // Laisser Axios/navigateur définir automatiquement le Content-Type + boundary.
  const { data } = await withTimeout(
    api.post('/analyze/upload', formData),
    125000,
    'Analyse timeout'
  )
  return data
}

export async function analyzeUrl(url) {
  const { data } = await withTimeout(
    api.post('/analyze/url', { url }),
    125000,
    'Analyse timeout'
  )
  return data
}

// Batch
export async function analyzeBatchImages(files) {
  const formData = new FormData()
  files.forEach(f => formData.append('images', f))
  const { data } = await withTimeout(
    api.post('/batch/images', formData),
    180000,
    'Analyse timeout'
  )
  return data
}

export async function analyzeDocument(file) {
  const formData = new FormData()
  formData.append('document', file)
  const { data } = await withTimeout(
    api.post('/batch/document', formData),
    180000,
    'Analyse timeout'
  )
  return data
}

// Vidéo (auth requis côté API)
export async function analyzeVideo(file, onProgress = null) {
  const formData = new FormData()
  formData.append('video', file)
  
  // Config avec progression
  const config = {
    // Ne pas forcer Content-Type: le navigateur ajoute la boundary pour FormData.
    headers: {},
    timeout: 600000, // 10 minutes pour grosses vidéos
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress({ 
          loaded: progressEvent.loaded, 
          total: progressEvent.total, 
          percent: percentCompleted 
        })
      }
    }
  }
  
  const { data } = await api.post('/analyze/video', formData, config)
  return data
}

export async function getBatch(batchId) {
  const { data } = await api.get(`/batch/${batchId}`)
  return data
}

// Historique (avec cache)
export async function getHistory(limit = 50, offset = 0) {
  const url = `${API_URL}/api/history?limit=${limit}&offset=${offset}`
  const token = api.defaults.headers.common['Authorization']
  const fp = await getFingerprintSafe()
  
  try {
    const data = await cachedFetch(url, {
      headers: {
        ...(token ? { 'Authorization': token } : {}),
        ...(fp ? { 'x-fingerprint': fp } : {})
      }
    }, 2 * 60 * 1000) // Cache 2 minutes
    
    return data.data || []
  } catch (error) {
    console.error('Erreur getHistory:', error)
    throw error
  }
}

export async function getBatches() {
  const url = `${API_URL}/api/history/batches`
  const token = api.defaults.headers.common['Authorization']
  const fp = await getFingerprintSafe()
  
  try {
    const data = await cachedFetch(url, {
      headers: {
        ...(token ? { 'Authorization': token } : {}),
        ...(fp ? { 'x-fingerprint': fp } : {})
      }
    }, 2 * 60 * 1000)
    
    return data.data || []
  } catch (error) {
    console.error('Erreur getBatches:', error)
    throw error
  }
}

export async function getStats() {
  const url = `${API_URL}/api/history/stats`
  const token = api.defaults.headers.common['Authorization']
  const fp = await getFingerprintSafe()
  
  try {
    const data = await cachedFetch(url, {
      headers: {
        ...(token ? { 'Authorization': token } : {}),
        ...(fp ? { 'x-fingerprint': fp } : {})
      }
    }, 5 * 60 * 1000) // Cache 5 minutes (stats changent peu)
    
    return data.data
  } catch (error) {
    console.error('Erreur getStats:', error)
    throw error
  }
}

// Quota (guest or authenticated)
export async function getQuota() {
  try {
    const { data } = await withTimeout(
      api.get('/quota'),
      30000, // 30 secondes pour Render cold start
      'Quota timeout'
    )
    return data
  } catch (err) {
    console.warn('Quota failed, returning default:', err.message)
    // Fallback silencieux
    return { success: true, quota: { allowed: true, remaining: 10 }, authenticated: false }
  }
}

// Rapport
export async function generateReport(batchId) {
  const { data } = await api.post(`/report/generate/${batchId}`)
  return data
}

export function getReportDownloadUrl(filename) {
  return `${API_URL}/api/report/download/${filename}`
}

// Billing
export async function createCheckoutSession(paramsOrPriceId, tokenMaybe) {
  const params = typeof paramsOrPriceId === 'string'
    ? { priceId: paramsOrPriceId, token: tokenMaybe }
    : (paramsOrPriceId || {})

  const token = params.token || tokenMaybe
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  const { data } = await api.post('/billing/checkout/subscription', {
    price_id: params.priceId,
    plan_name: params.planName,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl
  }, config)

  return data
}

export async function getBillingPortalUrl(token) {
  const { data } = await api.post('/billing/portal', {}, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return data
}

export async function getUserSubscription(token) {
  const { data } = await api.get('/billing/subscriptions', {
    headers: { Authorization: `Bearer ${token}` }
  })
  return data
}

export async function getInvoices(token) {
  const { data } = await api.get('/billing/invoices', {
    headers: { Authorization: `Bearer ${token}` }
  })
  return data
}

// Cache invalidation utilities
export function invalidateHistoryCache() {
  // Invalider les caches localStorage de l'historique et des stats
  const cacheKeysToInvalidate = [
    'cache:history',
    'cache:batches',
    'cache:stats'
  ]
  
  cacheKeysToInvalidate.forEach(key => {
    try {
      localStorage.removeItem(key)
      console.log(`✅ Cache invalidé: ${key}`)
    } catch (e) {
      console.warn(`⚠️  Impossible d'invalider ${key}:`, e)
    }
  })
}

export default api
