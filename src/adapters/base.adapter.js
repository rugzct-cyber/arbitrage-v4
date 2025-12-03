module.exports = {
    name: "base",
    getGlobalData: async () => [],
    normalize: (exchange, pair, price, fundingRate) => ({
        exchange,
        pair: pair.toUpperCase(),
        price: Number(price) || 0,
        fundingRate: Number(fundingRate) || 0,
        apr: (Number(fundingRate) || 0) * 3 * 365 * 100,
        timestamp: Date.now()
    })
};
