import cacheManager from 'cache-manager';
import redis from 'cache-manager-redis';

const availableCacheSystem = { redis, memory: 'memory' },
    cacheTTl = (process.env.CACHE !== 'false') ? 10000000 : 1;

export const cache = cacheManager.caching({ store: availableCacheSystem[process.env.CACHE_STORE] || 'memory', host: 'localhost', port: 6379, max: 1000000, ttl: cacheTTl /*seconds*/ });


export function invalidateCache(name, multiple) {
    let cachedObj;
    cache.keys((err, keys) => {
        if (!multiple) {
            cachedObj = keys.find((n) => n === name);
            cache.del(cachedObj)
        } else {
            cachedObj = keys.filter((n) => n.indexOf(name) !== -1);
            cachedObj.map((obj, i) => {
                cache.del(obj)
            });
        }
    });
}

export function resetCache() {
    cache.reset();
}
