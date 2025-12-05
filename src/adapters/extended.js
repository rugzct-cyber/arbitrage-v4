const { httpGet } = require('../utils/fetcher');
const base = require('./base.adapter');

module.exports = {
    name: "extended",
    getGlobalData: async () => {
        try {
            const url = "https://api.starknet.extended.exchange/api/v1/info/markets";
            const response = await httpGet(url);

            // Response structure: { status: "OK", data: [...] }
            let markets = [];
            if (response?.data && Array.isArray(response.data)) {
                markets = response.data;
            } else if (Array.isArray(response)) {
                markets = response;
            }

            return markets
                .filter(m => m.name && m.status === 'ACTIVE')
                .map(m => {
                    // Use assetName (e.g., "ENA", "BTC") as the pair name
                    const pair = m.assetName || m.name.replace('-USD', '');

                    // marketStats (not marketData) contains price info
                    const stats = m.marketStats || {};
                    const price = parseFloat(stats.markPrice || stats.lastPrice || 0);
                    const fundingRate = parseFloat(stats.fundingRate || 0);

                    return base.normalize("extended", pair, price, fundingRate, 1); // 1-hour funding
                });

        } catch (error) {
            console.error("Error fetching Extended data:", error.message);
            return [];
        }
    }
};
