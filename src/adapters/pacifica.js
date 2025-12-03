const base = require("./base.adapter");
module.exports = {
    name: "pacifica", getGlobalData: async () => [
        base.normalize("pacifica", "BTC-PERP", 96150, 0.00009),
        base.normalize("pacifica", "SOL-PERP", 192, -0.00005)
    ]
};
