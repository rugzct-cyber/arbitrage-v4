function normalizeFunding(exchange, rawItem) {
    return {
        exchange,
        token: rawItem.token || rawItem.symbol || null,
        fundingRate: Number(rawItem.fundingRate),
        timestamp: rawItem.timestamp ? Number(rawItem.timestamp) : Date.now()
    };
}
function normalizePrice(exchange, rawItem) {
    return {
        exchange,
        token: rawItem.token || rawItem.symbol || null,
        price: Number(rawItem.price),
        timestamp: rawItem.timestamp ? Number(rawItem.timestamp) : Date.now()
    };
}
module.exports = { normalizeFunding, normalizePrice };
