const { httpGet } = require("../utils/fetcher");
const base = require("./base.adapter");

// Paradex API endpoints
const SUMMARY_URL = "https://api.prod.paradex.trade/v1/markets/summary?market=ALL";
const MARKETS_URL = "https://api.prod.paradex.trade/v1/markets";

module.exports = {
    name: "paradex",
    getGlobalData: async () => {
        try {
            // Fetch both endpoints in parallel
            const [summaryResponse, marketsResponse] = await Promise.all([
                httpGet(SUMMARY_URL),
                httpGet(MARKETS_URL)
            ]);

            if (!summaryResponse || !summaryResponse.results) {
                return [];
            }

            // Build a map of symbol -> funding_period_hours from markets endpoint
            const fundingPeriodMap = new Map();
            if (marketsResponse && marketsResponse.results) {
                marketsResponse.results.forEach(market => {
                    if (market.symbol && market.funding_period_hours) {
                        fundingPeriodMap.set(market.symbol, parseFloat(market.funding_period_hours) || 8);
                    }
                });
            }

            // Filter for PERP only
            const validItems = summaryResponse.results.filter(m => m.symbol && m.symbol.endsWith("-PERP"));

            return validItems.map(market => {
                // Normalize symbol: BTC-USD-PERP -> BTC
                const normalizedSymbol = market.symbol.split("-")[0];

                // Get funding_period_hours for this market (default to 8 if not found)
                const fundingPeriodHours = fundingPeriodMap.get(market.symbol) || 8;

                // Official Paradex formula to normalize to 8h rate:
                // funding_rate_8h = funding_rate * 8 / funding_period_hours
                const rawFundingRate = parseFloat(market.funding_rate) || 0;
                const fundingRate8h = rawFundingRate * 8 / fundingPeriodHours;

                return base.normalize(
                    "paradex",
                    normalizedSymbol,
                    parseFloat(market.mark_price) || 0,
                    fundingRate8h,
                    8 // Standard 8-hour period for APR calculation
                );
            });
        } catch (e) {
            console.error("[PARADEX] Error:", e.message);
            return [];
        }
    }
};
