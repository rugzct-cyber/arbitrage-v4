const { httpGet } = require("../utils/fetcher");
const base = require("./base.adapter");
const URL = "https://api.prod.paradex.trade/v1/markets";
module.exports = {
    name: "paradex",
    getGlobalData: async () => {
        const response = await httpGet(URL);
        if (!response || !response.results) return [];
        return response.results.map(market => {
            if (!market.symbol.endsWith("-PERP")) return null;
            return base.normalize("paradex", market.symbol, market.mark_price || 0, market.current_funding_rate || 0);
        }).filter(i => i !== null);
    }
};
