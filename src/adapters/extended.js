const base = require("./base.adapter");
module.exports = {
    name: "extended", getGlobalData: async () => [
        base.normalize("extended", "BTC", 96250, 0.00011),
        base.normalize("extended", "ETH", 3545, 0.00009),
        base.normalize("extended", "SOL", 191, 0.00007)
    ]
};
