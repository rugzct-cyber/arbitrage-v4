const { httpGet } = require('../utils/fetcher');
const base = require('./base.adapter');

module.exports = {
    name: "aster",
    getGlobalData: async () => {
        try {
            const url = "https://fapi.asterdex.com/fapi/v3/premiumIndex";
            const response = await httpGet(url);

            // Response is an array of market data
            let markets = [];
            if (Array.isArray(response)) {
                markets = response;
            }

            return markets
                .filter(m => m.symbol && m.markPrice)
                .map(m => {
                    // Remove USDT/USD suffix for pair name
                    let pair = m.symbol;
                    if (pair.endsWith('USDT')) pair = pair.replace('USDT', '');
                    else if (pair.endsWith('USD')) pair = pair.replace('USD', '');

                    const price = parseFloat(m.markPrice || 0);
                    const fundingRate = parseFloat(m.lastFundingRate || 0);

                    return base.normalize("aster", pair, price, fundingRate);
                });

        } catch (error) {
            console.error("Error fetching Aster data:", error.message);
            return [];
        }
    }
};
