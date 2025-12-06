// api/history.js

const { getHistoryForPair } = require("../src/services/historicalData");
const { handleError } = require("../src/utils/errorHandler");

module.exports = async (req, res) => {
    try {
        const { pair, type, period } = req.query;

        if (!pair || !type || !period) {
            return res.status(400).json({
                success: false,
                message: "Missing required query parameters: pair, type, period."
            });
        }

        // Await the asynchronous Supabase fetch/aggregation
        const result = await getHistoryForPair(pair, type, period);

        if (result.success) {
            res.status(200).json(result);
        } else {
            // Error from internal service (e.g., Supabase not available)
            res.status(500).json({ success: false, message: "Failed to fetch historical data from database." });
        }

    } catch (error) {
        handleError(res, error);
    }
};
