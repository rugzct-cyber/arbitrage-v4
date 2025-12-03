const base = require("./base.adapter");
module.exports = {
    name: "hibachi", getGlobalData: async () => [
        base.normalize("hibachi", "BTC-PERP", 96100, 0.00005),
        base.normalize("hibachi", "SOL-PERP", 188, 0.00006)
    ]
};
