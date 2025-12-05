/**
 * Hyperliquid Adapter
 * Uses shared Hyperliquid base adapter
 */
const { createHyperliquidAdapter } = require("./common/hyperliquid-base");

module.exports = createHyperliquidAdapter({
    name: "hyperliquid"
    // No dex parameter = main Hyperliquid exchange
    // No transformPair = use asset name as-is
});
