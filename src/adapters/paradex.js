const { httpGet } = require("../utils/fetcher");
const base = require("./base.adapter");

// URL Public API Paradex (Summary for ALL markets)
const URL = "https://api.prod.paradex.trade/v1/markets/summary?market=ALL";

module.exports = {
    name: "paradex",
    getGlobalData: async () => {
        try {
            const response = await httpGet(URL);

            if (!response || !response.results) {
                console.error("[PARADEX] Invalid response:", response);
                return [];
            }

            // Filter for PERP only
            const validItems = response.results.filter(m => m.symbol && m.symbol.endsWith("-PERP"));

            console.log(`[PARADEX] Fetched ${validItems.length} PERP markets.`);

            return validItems.map(market => {
                // Normalize symbol: BTC-USD-PERP -> BTC
                const normalizedSymbol = market.symbol.split("-")[0];

                return base.normalize(
                    "paradex",
                    normalizedSymbol,
                    market.mark_price || 0,
                    market.funding_rate || 0 // Note: API uses 'funding_rate', not 'current_funding_rate'
                );
            });
        } catch (e) {
            console.error("[PARADEX] Error:", e.message);
            return [];
        }
    }
};
