const { httpPost } = require('../utils/fetcher');
const base = require('./base.adapter');

const SUBGRAPH_URL = "https://subgraph.satsuma-prod.com/391a61815d32/ostium/ost-prod/api";
const QUERY = `
{
  pairs(first: 1000) {
    from
    to
    lastTradePrice
    lastFundingRate
  }
}
`;

module.exports = {
    name: "ostium",
    getGlobalData: async () => {
        try {
            const response = await httpPost(SUBGRAPH_URL, { query: QUERY });

            if (!response || !response.data || !response.data.pairs) {
                console.error("[Ostium] Invalid subgraph response");
                return [];
            }

            return response.data.pairs.map(pair => {
                // Strip -USD suffix to match other exchanges format (BTC-USD -> BTC)
                let symbol = `${pair.from}-${pair.to}`;
                symbol = symbol.replace(/-USD$/i, '');
                const price = parseFloat(pair.lastTradePrice) / 1e18;

                // Funding Rate parsing (Precision 9) - returns raw value
                // Note: To get hourly/daily %, logic from SDK would be needed:
                // rate * (10/3) * 3600 * 100
                const fundingRate = parseFloat(pair.lastFundingRate) / 1e9;

                return base.normalize("ostium", symbol, price, fundingRate);
            });

        } catch (error) {
            console.error("[Ostium] Error fetching data:", error.message);
            return [];
        }
    }
};
