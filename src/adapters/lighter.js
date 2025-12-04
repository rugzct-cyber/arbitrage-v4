const { httpGet } = require('../utils/fetcher');
const base = require('./base.adapter');

const BASE_URL = "https://mainnet.zklighter.elliot.ai/api/v1";

module.exports = {
    name: "lighter",
    getGlobalData: async () => {
        try {
            // Fetch both endpoints in parallel
            const [detailsRes, fundingRes] = await Promise.all([
                httpGet(`${BASE_URL}/orderBookDetails`),
                httpGet(`${BASE_URL}/funding-rates`)
            ]);

            const markets = detailsRes?.order_book_details || [];
            const fundingRates = fundingRes?.funding_rates || [];

            // Create a map of funding rates by market_id (only for "lighter" exchange)
            const fundingMap = {};
            fundingRates
                .filter(f => f.exchange === 'lighter')
                .forEach(f => {
                    fundingMap[f.market_id] = f.rate;
                });

            return markets
                .filter(m => m.status === 'active' && m.market_type === 'perp')
                .map(m => {
                    const pair = m.symbol;
                    const price = parseFloat(m.last_trade_price || 0);
                    const fundingRate = fundingMap[m.market_id] || 0;

                    return base.normalize("lighter", pair, price, fundingRate);
                });

        } catch (error) {
            console.error("Error fetching Lighter data:", error.message);
            return [];
        }
    }
};
