const base = require("./base.adapter");
module.exports = {
    name: "aster", getGlobalData: async () => [
        base.normalize("aster", "BTC-PERP", 96300, 0.00015),
        base.normalize("aster", "ETH-PERP", 3560, 0.00014)
    ]
};
