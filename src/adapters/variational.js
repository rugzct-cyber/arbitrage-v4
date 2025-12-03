const base = require("./base.adapter");
module.exports = {
    name: "variational", getGlobalData: async () => [
        base.normalize("variational", "BTC-PERP", 96220, 0.00007),
        base.normalize("variational", "ETH-PERP", 3555, 0.00011),
        base.normalize("variational", "SOL-PERP", 190, 0.00009)
    ]
};
