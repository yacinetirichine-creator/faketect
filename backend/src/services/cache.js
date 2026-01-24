const Redis = require('ioredis');

/**
 * Service de cache Redis avec fallback gracieux
 * Si Redis n'est pas configuré ou indisponible, l'app continue de fonctionner
 */

let redis = null;
let cacheEnabled = false;

// Initialisation du client Redis (Upstash)
function initRedis() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('⚠️  Redis non configuré - cache désactivé (mode dégradé)');
    return;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError: (err) => {
        console.error('Redis reconnection error:', err.message);
        return false; // Don't reconnect on error
      },
    });

    redis.on('connect', () => {
      cacheEnabled = true;
      console.log('✅ Redis connecté - cache activé');
    });

    redis.on('error', (err) => {
      cacheEnabled = false;
      console.error('❌ Redis error:', err.message);
    });

    redis.on('close', () => {
      cacheEnabled = false;
      console.log('⚠️  Redis déconnecté - cache désactivé');
    });

  } catch (error) {
    console.error('❌ Erreur initialisation Redis:', error.message);
    redis = null;
    cacheEnabled = false;
  }
}

/**
 * Récupérer une valeur du cache
 * @param {string} key - Clé du cache
 * @returns {Promise<any|null>} - Valeur parsée ou null
 */
async function get(key) {
  if (!cacheEnabled || !redis) {return null;}

  try {
    const value = await redis.get(key);
    if (!value) {return null;}
    return JSON.parse(value);
  } catch (error) {
    console.error('Cache GET error:', error.message);
    return null; // Fallback silencieux
  }
}

/**
 * Stocker une valeur dans le cache avec TTL
 * @param {string} key - Clé du cache
 * @param {any} value - Valeur à stocker (sera JSON.stringify)
 * @param {number} ttl - Time to live en secondes (default: 24h)
 * @returns {Promise<boolean>} - true si succès, false sinon
 */
async function set(key, value, ttl = 86400) {
  if (!cacheEnabled || !redis) {return false;}

  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error('Cache SET error:', error.message);
    return false; // Fallback silencieux
  }
}

/**
 * Supprimer une clé du cache
 * @param {string} key - Clé à supprimer
 * @returns {Promise<boolean>}
 */
async function del(key) {
  if (!cacheEnabled || !redis) {return false;}

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Cache DEL error:', error.message);
    return false;
  }
}

/**
 * Invalider toutes les clés correspondant à un pattern
 * @param {string} pattern - Pattern Redis (ex: "analysis:*")
 * @returns {Promise<number>} - Nombre de clés supprimées
 */
async function invalidatePattern(pattern) {
  if (!cacheEnabled || !redis) {return 0;}

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {return 0;}

    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('Cache INVALIDATE error:', error.message);
    return 0;
  }
}

/**
 * Vérifier si le cache est actif
 * @returns {boolean}
 */
function isEnabled() {
  return cacheEnabled;
}

/**
 * Obtenir des statistiques du cache
 * @returns {Promise<object|null>}
 */
async function getStats() {
  if (!cacheEnabled || !redis) {
    return { enabled: false, status: 'disconnected' };
  }

  try {
    const info = await redis.info('stats');
    const lines = info.split('\r\n');
    const stats = {};

    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key] = value;
      }
    });

    return {
      enabled: true,
      status: 'connected',
      hits: stats.keyspace_hits || '0',
      misses: stats.keyspace_misses || '0',
    };
  } catch (error) {
    console.error('Cache STATS error:', error.message);
    return { enabled: false, status: 'error', error: error.message };
  }
}

/**
 * Fermer la connexion Redis proprement
 */
async function disconnect() {
  if (redis) {
    try {
      await redis.quit();
      console.log('✅ Redis déconnecté proprement');
    } catch (error) {
      console.error('Erreur déconnexion Redis:', error.message);
    }
  }
}

module.exports = {
  initRedis,
  get,
  set,
  del,
  invalidatePattern,
  isEnabled,
  getStats,
  disconnect,
};
