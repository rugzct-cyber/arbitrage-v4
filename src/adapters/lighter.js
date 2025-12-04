const base = require("./base.adapter");
module.exports = {
    name: "lighter", getGlobalData: async () => [
        base.normalize("lighter", "BTC", 96180, 0.00010),
        base.normalize("lighter", "ETH", 3548, 0.00013),
        base.normalize("lighter", "SOL", 189, 0.00008)
    ]
};
