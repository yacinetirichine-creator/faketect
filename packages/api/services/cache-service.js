/**
 * 💾 Cache Service - Caching des analyses par MD5
 * Réduit 50% appels API pour images identiques
 */
const crypto = require('crypto');
const fs = require('fs');
const { supabaseAdmin } = require('../config/supabase');

class CacheService {
  constructor() {
    // In-memory cache pour fallback rapide (< 5min)
    this.memoryCache = new Map();
    this.cacheMaxAge = 5 * 60 * 1000; // 5 minutes
    
    // Cleanup toutes les heures
    this.startCleanup();
  }

  /**
   * Calculer hash MD5 d'un buffer
   */
  calculateHash(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Calculer hash MD5 d'un fichier
   */
  calculateFileHash(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      return this.calculateHash(buffer);
    } catch (err) {
      console.error('❌ Hash calculation failed:', err.message);
      return null;
    }
  }

  /**
   * Chercher result en cache
   */
  async get(hash) {
    if (!hash) return null;

    // 1. Vérifier cache mémoire (rapide)
    const memoryResult = this.memoryCache.get(hash);
    if (memoryResult && Date.now() - memoryResult.timestamp < this.cacheMaxAge) {
      console.log(`⚡ Cache HIT (memory): ${hash.substring(0, 8)}`);
      return memoryResult.data;
    }

    // 2. Vérifier Supabase (persistent)
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('analysis_cache')
          .select('result, created_at')
          .eq('image_hash', hash)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Cache query error:', error.message);
          return null;
        }

        if (data) {
          // Vérifier si pas trop vieux (7 jours max)
          const createdAt = new Date(data.created_at);
          const age = Date.now() - createdAt.getTime();
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

          if (age < maxAge) {
            console.log(`⚡ Cache HIT (Supabase): ${hash.substring(0, 8)}`);
            // Sauvegarder dans mémoire pour futur
            this.memoryCache.set(hash, { data: data.result, timestamp: Date.now() });
            return data.result;
          } else {
            // Cache trop vieux, supprimer
            await supabaseAdmin
              .from('analysis_cache')
              .delete()
              .eq('image_hash', hash);
          }
        }
      } catch (err) {
        console.warn('⚠️ Supabase cache error:', err.message);
      }
    }

    return null;
  }

  /**
   * Sauvegarder result en cache
   */
  async set(hash, result) {
    if (!hash || !result) return;

    try {
      // Sauvegarder en mémoire
      this.memoryCache.set(hash, { data: result, timestamp: Date.now() });

      // Sauvegarder en Supabase
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from('analysis_cache')
          .insert({
            image_hash: hash,
            result,
            created_at: new Date().toISOString()
          })
          .on('*', () => {});

        if (error && error.code !== '23505') { // 23505 = unique violation (OK)
          console.warn('⚠️ Cache save error:', error.message);
        } else {
          console.log(`💾 Cache SAVED: ${hash.substring(0, 8)}`);
        }
      }
    } catch (err) {
      console.warn('⚠️ Cache operation failed:', err.message);
    }
  }

  /**
   * Nettoyer cache mémoire
   */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [hash, entry] of this.memoryCache.entries()) {
        if (now - entry.timestamp > this.cacheMaxAge) {
          this.memoryCache.delete(hash);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Memory cache cleanup: ${cleaned} entries deleted`);
      }
    }, 60 * 60 * 1000); // Toutes les heures
  }

  /**
   * Stats du cache
   */
  getStats() {
    return {
      memory_entries: this.memoryCache.size,
      memory_size_kb: Math.round(
        [...this.memoryCache.entries()].reduce((sum, [k, v]) => 
          sum + k.length + JSON.stringify(v.data).length, 0) / 1024
      )
    };
  }

  /**
   * Vider tout le cache
   */
  async clear() {
    this.memoryCache.clear();
    
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('analysis_cache')
          .delete()
          .neq('image_hash', ''); // Delete all
        console.log('🗑️ Cache cleared');
      } catch (err) {
        console.error('Clear cache error:', err.message);
      }
    }
  }
}

module.exports = new CacheService();
