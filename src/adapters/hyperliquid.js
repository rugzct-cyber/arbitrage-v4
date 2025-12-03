const { httpPost } = require("../utils/fetcher");
const URL = "https://api.hyperliquid.xyz/info";
module.exports = {
    name: "hyperliquid",
    getGlobalData: async () => {
        const data = await httpPost(URL, { type: "metaAndAssetCtxs" });
        if (!data) return [];
        const universe = data[0].universe;
        const assetCtxs = data[1];
        return universe.map((asset, index) => {
            const ctx = assetCtxs[index];
            return {
                exchange: "hyperliquid",
                pair: `${asset.name}-PERP`,
                price: parseFloat(ctx.markPx),
                fundingRate: parseFloat(ctx.funding),
                apr: parseFloat(ctx.funding) * 24 * 365 * 100
            };
        });
    }
};
