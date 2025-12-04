const base = require("./base.adapter");
module.exports = {
    name: "aster", getGlobalData: async () => [
        base.normalize("aster", "BTC", 96300, 0.00015),
        base.normalize("aster", "ETH", 3560, 0.00014)
    ]
};
