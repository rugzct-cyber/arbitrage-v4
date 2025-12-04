const base = require("./base.adapter");
module.exports = {
    name: "variational", getGlobalData: async () => [
        base.normalize("variational", "BTC", 96220, 0.00007),
        base.normalize("variational", "ETH", 3555, 0.00011),
        base.normalize("variational", "SOL", 190, 0.00009)
    ]
};
