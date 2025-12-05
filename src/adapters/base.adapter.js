module.exports = {
    name: "base",
    getGlobalData: async () => [],
    /**
     * Normalize market data with flexible interval
     * @param {string} exchange - Exchange name
     * @param {string} pair - Trading pair
     * @param {number} price - Mark price
     * @param {number} fundingRate - Funding rate (per interval)
     * @param {number} intervalHours - Funding interval in hours (default: 8)
     */
    normalize: (exchange, pair, price, fundingRate, intervalHours = 8) => {

        // --- COLLISION MAP FOR TICKER UNIQUENESS ---
        const COLLISION_MAP = {
            'vest': {
                'SPX': 'SPX-RWA',
                'F': 'F-RWA',
                'STRK': 'STRK-RWA',
                'ON': 'ON-RWA',
                'MET': 'MET-RWA',
                'ZETA': 'ZETA-RWA',
                'DASH': 'DASH-RWA',
                'OPEN': 'OPEN-RWA',
            },
            // Add other exchanges and collision pairs here if needed
        };
        // -------------------------------------------

        const pairUpper = pair.toUpperCase();
        let uniquePair = pairUpper;

        // Apply collision de-duplication logic
        if (COLLISION_MAP[exchange] && COLLISION_MAP[exchange][pairUpper]) {
            uniquePair = COLLISION_MAP[exchange][pairUpper];
        }

        return {
            exchange,
            pair: uniquePair,
            price: Number(price) || 0,
            fundingRate: Number(fundingRate) || 0,
            // APR = rate * (24 / interval) * 365 * 100
            apr: (Number(fundingRate) || 0) * (24 / intervalHours) * 365 * 100,
            timestamp: Date.now()
        };
    }
};
