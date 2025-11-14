const NodeCache = require('node-cache');

// Cache configuration with TTLs
const cacheConfig = {
  stdTTL: 60, // Default TTL in seconds
  checkperiod: 120, // Check for expired keys every 120 seconds
  useClones: false // Better performance
};

const cache = new NodeCache(cacheConfig);

// TTL constants (in seconds)
const TTL = {
  REALTIME: parseInt(process.env.CACHE_TTL_REALTIME) || 60,  // Increased from 30 to 60 seconds to avoid rate limits
  HOURLY: parseInt(process.env.CACHE_TTL_HOURLY) || 300,     // Increased from 180 to 300 seconds (5 min)
  DAILY: parseInt(process.env.CACHE_TTL_DAILY) || 900        // Increased from 600 to 900 seconds (15 min)
};

/**
 * Get cache key for market data
 * @param {string} symbol - Symbol (e.g., 'BTC', 'AAPL')
 * @param {string} type - Type ('crypto' or 'stock')
 * @param {string} timeframe - Timeframe ('1m', '1h', '1d')
 * @returns {string} Cache key
 */
function getCacheKey(symbol, type, timeframe) {
  return `market:${type}:${symbol}:${timeframe}`;
}

/**
 * Get TTL based on timeframe
 * @param {string} timeframe - Timeframe ('1m', '1h', '1d')
 * @returns {number} TTL in seconds
 */
function getTTL(timeframe) {
  if (timeframe === '1m' || timeframe === 'realtime') {
    return TTL.REALTIME;
  } else if (timeframe === '1h') {
    return TTL.HOURLY;
  } else {
    return TTL.DAILY;
  }
}

/**
 * Get cached data or fetch if not cached
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttl - TTL in seconds
 * @returns {Promise<any>} Cached or fetched data
 */
async function getOrSet(key, fetchFn, ttl) {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
}

/**
 * Invalidate cache for a specific key
 * @param {string} key - Cache key
 */
function invalidate(key) {
  cache.del(key);
}

/**
 * Clear all cache
 */
function clear() {
  cache.flushAll();
}

module.exports = {
  getCacheKey,
  getTTL,
  getOrSet,
  invalidate,
  clear,
  TTL
};

