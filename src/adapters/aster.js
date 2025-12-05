const { httpGet } = require('../utils/fetcher');
const base = require('./base.adapter');

// Cache for active symbols from exchangeInfo
let ACTIVE_SYMBOLS = new Set();
let statusLoaded = false;

async function loadActiveSymbols() {
    if (statusLoaded) return;

    try {
        const url = "https://fapi.asterdex.com/fapi/v3/exchangeInfo";
        const response = await httpGet(url);

        if (response && Array.isArray(response.symbols)) {
            response.symbols.forEach(s => {
                // Status "TRADING" indicates active market
                if (s.status === 'TRADING') {
                    ACTIVE_SYMBOLS.add(s.symbol);
                }
            });
            statusLoaded = true;
        }
    } catch (error) {
        console.error("[ASTER] Error loading exchange info:", error.message);
    }
}

module.exports = {
    name: "aster",
    getGlobalData: async () => {
        try {
            // Load active symbols on first call
            await loadActiveSymbols();

            const url = "https://fapi.asterdex.com/fapi/v3/premiumIndex";
            const response = await httpGet(url);

            // Response is an array of market data
            let markets = [];
            if (Array.isArray(response)) {
                markets = response;
            }

            return markets
                .filter(m => m.symbol && ACTIVE_SYMBOLS.has(m.symbol)) // Filter only TRADING status
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
