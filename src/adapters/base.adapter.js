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
    normalize: (exchange, pair, price, fundingRate, intervalHours = 8) => ({
        exchange,
        pair: pair.toUpperCase(),
        price: Number(price) || 0,
        fundingRate: Number(fundingRate) || 0,
        // APR = rate * (24 / interval) * 365 * 100
        apr: (Number(fundingRate) || 0) * (24 / intervalHours) * 365 * 100,
        timestamp: Date.now()
    })
};
