/**
 * XYZ Adapter (HIP-3 Perp Deployer)
 * Uses shared Hyperliquid base adapter with dex parameter
 */
const { createHyperliquidAdapter } = require("./common/hyperliquid-base");

module.exports = createHyperliquidAdapter({
    name: "xyz",
    dex: "xyz", // HIP-3 perp deployer
    transformPair: (name) => name.replace('xyz:', '') // Remove xyz: prefix
});
