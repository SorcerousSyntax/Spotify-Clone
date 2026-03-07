import NodeCache from 'node-cache';

// Default TTL: 5 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Express middleware for caching API responses
 * @param {number} ttlSeconds - Time to live in seconds
 */
export function cacheMiddleware(ttlSeconds = 300) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const key = `__cache__${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200 && data) {
        cache.set(key, data, ttlSeconds);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Manually set a cache entry
 */
export function setCache(key, value, ttl) {
  cache.set(key, value, ttl);
}

/**
 * Manually get a cache entry
 */
export function getCache(key) {
  return cache.get(key);
}

/**
 * Clear all cache entries
 */
export function clearCache() {
  cache.flushAll();
}

export default cache;
