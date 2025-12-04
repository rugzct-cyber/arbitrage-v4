const { httpGet } = require('../utils/fetcher');
const base = require('./base.adapter');

module.exports = {
    name: "hibachi",
    getGlobalData: async () => {
        try {
            const url = "https://data-api.hibachi.xyz/market/inventory";
            const response = await httpGet(url);

            // Response: { markets: [{ contract: {...}, info: {...} }] }
            let markets = [];
            if (response?.markets && Array.isArray(response.markets)) {
                markets = response.markets;
            }

            return markets
                .filter(m => m.contract?.status === 'LIVE' && m.info?.markPrice)
                .map(m => {
                    const pair = m.contract.underlyingSymbol; // "ETH", "BTC", etc.
                    const price = parseFloat(m.info.markPrice || 0);
                    const fundingRate = parseFloat(m.info.estimatedFundingRate || 0);

                    return base.normalize("hibachi", pair, price, fundingRate);
                });

        } catch (error) {
            console.error("Error fetching Hibachi data:", error.message);
            return [];
        }
    }
};
