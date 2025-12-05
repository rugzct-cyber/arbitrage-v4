/**
 * AGGREGATOR SERVICE V4 (Serverless Optimized)
 * - No local cache (bad for serverless - resets each request)
 * - Enhanced error handling with status per exchange
 */

// Static imports (required for Vercel bundling)
const adapters = {
    hyperliquid: require('../adapters/hyperliquid'),
    paradex: require('../adapters/paradex'),
    vest: require('../adapters/vest'),
    extended: require('../adapters/extended'),
    lighter: require('../adapters/lighter'),
    hibachi: require('../adapters/hibachi'),
    aster: require('../adapters/aster'),
    pacifica: require('../adapters/pacifica'),
    xyz: require('../adapters/xyz')
};

// --- CONFIGURATION ---
const API_TIMEOUT = 10000; // 10 seconds (vital for slow APIs like Hyperliquid)

/**
 * Fetches market data from all exchanges
 * @returns {Object} { data: Array, status: Object }
 */
async function getAllMarketData() {
    const exchangeStatus = {};

    const promises = Object.entries(adapters).map(async ([name, adapter]) => {
        const startTime = Date.now();
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), API_TIMEOUT)
            );

            const data = await Promise.race([adapter.getGlobalData(), timeoutPromise]);
            const duration = Date.now() - startTime;

            exchangeStatus[name] = {
                success: true,
                count: data.length,
                duration
            };

            return data;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.warn(`[AGGREGATOR] ${name} failed: ${error.message} (${duration}ms)`);

            exchangeStatus[name] = {
                success: false,
                error: error.message,
                duration
            };

            return [];
        }
    });

    const results = await Promise.all(promises);
    const flatResults = results.flat();

    return {
        data: flatResults,
        status: exchangeStatus,
        timestamp: Date.now()
    };
}

module.exports = { getAllMarketData };
