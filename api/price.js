const { getAllMarketData } = require("../src/services/aggregator");
const { comparePrices } = require("../src/services/comparator");
const { handleError } = require("../src/utils/errorHandler");

module.exports = async (req, res) => {
    try {
        const { pair } = req.query;
        const allData = await getAllMarketData();
        const filtered = pair ? allData.filter(d => d.pair === pair) : allData;

        res.status(200).json({ success: true, count: filtered.length, data: filtered });
    } catch (error) { handleError(res, error); }
};
