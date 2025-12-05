const { getAllMarketData } = require("../src/services/aggregator");
const { handleError } = require("../src/utils/errorHandler");

module.exports = async (req, res) => {
    try {
        const { pair } = req.query;
        const result = await getAllMarketData();

        // Filter by pair if provided
        const filtered = pair
            ? result.data.filter(d => d.pair === pair)
            : result.data;

        res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered,
            exchangeStatus: result.status,
            timestamp: result.timestamp
        });
    } catch (error) {
        handleError(res, error);
    }
};
