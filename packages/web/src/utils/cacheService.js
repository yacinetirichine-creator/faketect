/**
 * Service de cache en mémoire pour optimiser les requêtes API
 * - Cache LRU (Least Recently Used)
 * - TTL (Time To Live) configurable
 * - Invalidation automatique
 */

class CacheService {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 5 minutes
    this.cache = new Map()
    this.timestamps = new Map()
    
    // Nettoyage périodique
    if (options.cleanupInterval !== false) {
      this.startCleanup(options.cleanupInterval || 60000) // 1 minute
    }
  }
  
  /**
   * Générer clé de cache
   * @param {string} endpoint - URL endpoint
   * @param {Object} params - Paramètres requête
   * @returns {string} - Clé unique
   */
  generateKey(endpoint, params = {}) {
    const paramsStr = JSON.stringify(params, Object.keys(params).sort())
    return `${endpoint}:${paramsStr}`
  }
  
  /**
   * Récupérer depuis cache
   * @param {string} key - Clé cache
   * @returns {any|null} - Données ou null si expiré
   */
  get(key) {
    if (!this.cache.has(key)) return null
    
    const timestamp = this.timestamps.get(key)
    const now = Date.now()
    
    // Vérifier expiration
    if (now - timestamp > this.defaultTTL) {
      this.delete(key)
      return null
    }
    
    // Mettre à jour timestamp (LRU)
    this.timestamps.set(key, now)
    return this.cache.get(key)
  }
  
  /**
   * Stocker dans cache
   * @param {string} key - Clé cache
   * @param {any} data - Données à cacher
   * @param {number} ttl - TTL custom (optionnel)
   */
  set(key, data, ttl = null) {
    // Vérifier taille max (LRU eviction)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldest()
      if (oldestKey) this.delete(oldestKey)
    }
    
    this.cache.set(key, data)
    this.timestamps.set(key, Date.now() - (ttl ? this.defaultTTL - ttl : 0))
  }
  
  /**
   * Supprimer du cache
   * @param {string} key - Clé à supprimer
   */
  delete(key) {
    this.cache.delete(key)
    this.timestamps.delete(key)
  }
  
  /**
   * Invalider cache par pattern
   * @param {string|RegExp} pattern - Pattern à matcher
   */
  invalidate(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key)
      }
    }
  }
  
  /**
   * Vider tout le cache
   */
  clear() {
    this.cache.clear()
    this.timestamps.clear()
  }
  
  /**
   * Trouver entrée la plus ancienne (LRU)
   * @returns {string|null} - Clé la plus ancienne
   */
  findOldest() {
    let oldestKey = null
    let oldestTime = Infinity
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp
        oldestKey = key
      }
    }
    
    return oldestKey
  }
  
  /**
   * Nettoyage automatique des entrées expirées
   */
  cleanup() {
    const now = Date.now()
    const expired = []
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.defaultTTL) {
        expired.push(key)
      }
    }
    
    expired.forEach(key => this.delete(key))
    
    if (expired.length > 0) {
      console.log(`🧹 Cache cleanup: ${expired.length} entrées expirées supprimées`)
    }
  }
  
  /**
   * Démarrer nettoyage périodique
   * @param {number} interval - Intervalle en ms
   */
  startCleanup(interval) {
    this.cleanupInterval = setInterval(() => this.cleanup(), interval)
  }
  
  /**
   * Arrêter nettoyage périodique
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
  
  /**
   * Statistiques cache
   * @returns {Object} - Stats
   */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: ((this.cache.size / this.maxSize) * 100).toFixed(1) + '%',
      oldestEntry: this.findOldest(),
      defaultTTL: this.defaultTTL
    }
  }
}

// Instance singleton
export const cacheService = new CacheService({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60000 // 1 minute
})

/**
 * Wrapper pour fetch avec cache automatique
 * @param {string} url - URL à fetch
 * @param {Object} options - Options fetch
 * @param {number} cacheTTL - TTL cache (0 = pas de cache)
 * @returns {Promise<any>} - Response data
 */
export async function cachedFetch(url, options = {}, cacheTTL = 5 * 60 * 1000) {
  // Pas de cache pour mutations
  if (options.method && options.method !== 'GET') {
    const response = await fetch(url, options)
    
    // Invalider cache après mutation
    const endpoint = new URL(url).pathname
    cacheService.invalidate(endpoint)
    
    return response.json()
  }
  
  // Générer clé cache
  const params = options.params || {}
  const cacheKey = cacheService.generateKey(url, params)
  
  // Vérifier cache
  const cached = cacheService.get(cacheKey)
  if (cached !== null) {
    console.log(`💾 Cache HIT: ${url}`)
    return cached
  }
  
  console.log(`🌐 Cache MISS: ${url}`)
  
  // Fetch données
  const response = await fetch(url, options)
  const data = await response.json()
  
  // Stocker dans cache
  if (cacheTTL > 0) {
    cacheService.set(cacheKey, data, cacheTTL)
  }
  
  return data
}

/**
 * Hook React pour cache service
 */
export function useCache() {
  return {
    get: (key) => cacheService.get(key),
    set: (key, data, ttl) => cacheService.set(key, data, ttl),
    invalidate: (pattern) => cacheService.invalidate(pattern),
    clear: () => cacheService.clear(),
    stats: () => cacheService.stats()
  }
}

export default cacheService
