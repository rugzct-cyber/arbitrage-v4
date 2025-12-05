const { httpPost } = require("../utils/fetcher");
const URL = "https://api.hyperliquid.xyz/info";
module.exports = {
    name: "hyperliquid",
    getGlobalData: async () => {
        const data = await httpPost(URL, { type: "metaAndAssetCtxs" });
        if (!data) return [];
        const universe = data[0].universe;
        const assetCtxs = data[1];

        // Filter out delisted assets using isDelisted field
        return universe
            .map((asset, index) => ({ asset, ctx: assetCtxs[index] }))
            .filter(item => !item.asset.isDelisted) // Exclude delisted tokens
            .map(item => {
                const asset = item.asset;
                const ctx = item.ctx;

                return {
                    exchange: "hyperliquid",
                    pair: asset.name,
                    price: parseFloat(ctx.markPx),
                    fundingRate: parseFloat(ctx.funding),
                    apr: parseFloat(ctx.funding) * 24 * 365 * 100
                };
            });
    }
};
