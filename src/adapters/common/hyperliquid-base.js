/**
 * Hyperliquid Base Adapter
 * Shared logic for Hyperliquid API-based exchanges (Hyperliquid, XYZ, etc.)
 */
const { httpPost } = require("../../utils/fetcher");

const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";

/**
 * Creates a Hyperliquid-compatible adapter
 * @param {Object} config - Adapter configuration
 * @param {string} config.name - Exchange name
 * @param {string} config.dex - Optional dex parameter for HIP-3 deployers
 * @param {Function} config.transformPair - Optional function to transform pair name
 * @param {Function} config.filter - Optional additional filter function
 * @returns {Object} Adapter module
 */
function createHyperliquidAdapter(config) {
    const { name, dex = null, transformPair = (name) => name, filter = () => true } = config;

    return {
        name,
        getGlobalData: async () => {
            const payload = dex
                ? { type: "metaAndAssetCtxs", dex }
                : { type: "metaAndAssetCtxs" };

            const data = await httpPost(HYPERLIQUID_API, payload);
            if (!data) return [];

            const universe = data[0].universe;
            const assetCtxs = data[1];

            return universe
                .map((asset, index) => ({ asset, ctx: assetCtxs[index] }))
                .filter(item => !item.asset.isDelisted) // Exclude delisted tokens
                .filter(item => filter(item)) // Apply custom filter
                .map(item => {
                    const asset = item.asset;
                    const ctx = item.ctx;

                    return {
                        exchange: name,
                        pair: transformPair(asset.name),
                        price: parseFloat(ctx.markPx),
                        fundingRate: parseFloat(ctx.funding),
                        apr: parseFloat(ctx.funding) * 24 * 365 * 100
                    };
                });
        }
    };
}

module.exports = { createHyperliquidAdapter };
