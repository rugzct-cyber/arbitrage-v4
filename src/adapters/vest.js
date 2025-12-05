const base = require('./base.adapter');

module.exports = {
    name: "vest",
    getGlobalData: async () => {
        try {
            // Vest API requires custom header
            const response = await fetch("https://server-prod.hz.vestmarkets.com/v2/ticker/latest", {
                headers: {
                    'xrestservermm': 'restserver0',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Response: { tickers: [{ symbol, markPrice, oneHrFundingRate, status }] }
            let tickers = [];
            if (data?.tickers && Array.isArray(data.tickers)) {
                tickers = data.tickers;
            }

            return tickers
                .filter(t => t.status === 'TRADING' && t.markPrice)
                .map(t => {
                    // Remove "-USD-PERP" or "-PERP" suffix
                    let pair = t.symbol;
                    if (pair.endsWith('-USD-PERP')) pair = pair.replace('-USD-PERP', '');
                    else if (pair.endsWith('-PERP')) pair = pair.replace('-PERP', '');

                    const price = parseFloat(t.markPrice || 0);
                    const fundingRate = parseFloat(t.oneHrFundingRate || 0);

                    return base.normalize("vest", pair, price, fundingRate, 1); // 1-hour funding
                });

        } catch (error) {
            console.error("Error fetching Vest data:", error.message);
            return [];
        }
    }
};
