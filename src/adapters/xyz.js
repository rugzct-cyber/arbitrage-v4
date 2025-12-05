// src/adapters/xyz.js
const { httpPost } = require("../utils/fetcher");
const URL = "https://api.hyperliquid.xyz/info";

module.exports = {
    name: "xyz",
    getGlobalData: async () => {
        // Use dex parameter to get XYZ perp deployer data
        const data = await httpPost(URL, { type: "metaAndAssetCtxs", dex: "xyz" });
        if (!data) return [];

        const universe = data[0].universe;
        const assetCtxs = data[1];

        return universe
            .map((asset, index) => ({ asset, ctx: assetCtxs[index] }))
            // Filter: exclude delisted assets
            .filter(item => !item.asset.isDelisted)
            .map(item => {
                const asset = item.asset;
                const ctx = item.ctx;

                // Remove xyz: prefix for clean pair name
                const pair = asset.name.replace('xyz:', '');

                return {
                    exchange: "xyz",
                    pair: pair,
                    price: parseFloat(ctx.markPx),
                    fundingRate: parseFloat(ctx.funding),
                    apr: parseFloat(ctx.funding) * 24 * 365 * 100
                };
            });
    }
};
