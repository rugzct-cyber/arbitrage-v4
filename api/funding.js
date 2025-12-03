const { getAllMarketData } = require("../src/services/aggregator");
const { compareFunding } = require("../src/services/comparator");
const { handleError } = require("../src/utils/errorHandler");

module.exports = async (req, res) => {
    try {
        const { pair } = req.query;
        const allData = await getAllMarketData();

        // Si ?pair=BTC-PERP est fourni, on filtre. Sinon on renvoie tout.
        const filtered = pair ? allData.filter(d => d.pair === pair) : allData;

        // Pour le tableau principal, on veut souvent grouper par Paire
        // Ici on renvoie les données brutes pour que le Frontend puisse les traiter
        res.status(200).json({ success: true, count: filtered.length, data: filtered });
    } catch (error) { handleError(res, error); }
};
