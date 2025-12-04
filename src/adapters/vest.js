const base = require("./base.adapter");
module.exports = {
    name: "vest", getGlobalData: async () => [
        base.normalize("vest", "BTC", 96200, 0.00008),
        base.normalize("vest", "ETH", 3550, 0.00010),
        base.normalize("vest", "SOL", 190, 0.00012)
    ]
};
