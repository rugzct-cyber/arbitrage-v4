const { httpGet } = require('../utils/fetcher');
const base = require('./base.adapter');

module.exports = {
    name: "pacifica",
    getGlobalData: async () => {
        try {
            const url = "https://app.pacifica.fi/api/v1/info/prices";
            const response = await httpGet(url);

            // Response: { success: true, data: [...] }
            let markets = [];
            if (response?.success && Array.isArray(response.data)) {
                markets = response.data;
            }

            return markets
                .filter(m => m.symbol && m.mark)
                .map(m => {
                    const pair = m.symbol; // "BTC", "ETH", etc.
                    const price = parseFloat(m.mark || 0);
                    const fundingRate = parseFloat(m.funding || 0);

                    return base.normalize("pacifica", pair, price, fundingRate);
                });

        } catch (error) {
            console.error("Error fetching Pacifica data:", error.message);
            return [];
        }
    }
};
