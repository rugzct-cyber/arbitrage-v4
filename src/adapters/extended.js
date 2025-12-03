const base = require("./base.adapter");
module.exports = {
    name: "extended", getGlobalData: async () => [
        base.normalize("extended", "BTC-PERP", 96250, 0.00011),
        base.normalize("extended", "ETH-PERP", 3545, 0.00009),
        base.normalize("extended", "SOL-PERP", 191, 0.00007)
    ]
};
