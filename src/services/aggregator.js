/**
 * AGGREGATOR SERVICE V4 (Optimized for Vercel)
 */
// 1. IMPORTS MANUELS (Obligatoire pour que Vercel trouve les fichiers)
const adapters = {
    hyperliquid: require('../adapters/hyperliquid'),
    paradex: require('../adapters/paradex'),
    vest: require('../adapters/vest'),
    extended: require('../adapters/extended'),
    lighter: require('../adapters/lighter'),
    hibachi: require('../adapters/hibachi'),
    aster: require('../adapters/aster'),
    pacifica: require('../adapters/pacifica'),
    // variational: require('../adapters/variational')
};

// --- CONFIGURATION ---
const CACHE_DURATION = 15 * 1000; // 15 secondes de cache
const API_TIMEOUT = 10000; // 10 secondes (Vital pour Hyperliquid)

// --- ÉTAT DU CACHE ---
let cache = { data: [], lastFetch: 0 };

async function getAllMarketData() {
    const now = Date.now();

    // 1. Cache Hit
    if (cache.data.length > 0 && (now - cache.lastFetch < CACHE_DURATION)) {
        return cache.data;
    }
    // 2. Cache Miss - Refresh
    console.log(`[AGGREGATOR] Refreshing data from ${Object.keys(adapters).length} exchanges...`);
    const promises = Object.values(adapters).map(async (adapter) => {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), API_TIMEOUT)
            );

            return await Promise.race([adapter.getGlobalData(), timeoutPromise]);
        } catch (error) {
            console.warn(`[WARNING] Failed to fetch ${adapter.name}: ${error.message}`);
            return [];
        }
    });

    const results = await Promise.all(promises);
    const flatResults = results.flat();
    // Mise à jour du cache uniquement si succès
    if (flatResults.length > 0) {
        cache.data = flatResults;
        cache.lastFetch = now;
    }
    return cache.data;
}

module.exports = { getAllMarketData };
