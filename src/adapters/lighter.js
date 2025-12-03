const base = require("./base.adapter");
module.exports = {
    name: "lighter", getGlobalData: async () => [
        base.normalize("lighter", "BTC-PERP", 96180, 0.00010),
        base.normalize("lighter", "ETH-PERP", 3548, 0.00013),
        base.normalize("lighter", "SOL-PERP", 189, 0.00008)
    ]
};
