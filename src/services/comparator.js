/**
 * Comparator Service
 * Analyzes prices, funding rates, and arbitrage opportunities across exchanges
 */

/**
 * Compare prices across exchanges
 */
function comparePrices(pricesArray) {
    // Filter successful responses
    const successful = pricesArray.filter(item => item.success && item.data);

    if (successful.length === 0) {
        return null;
    }

    // Find best buy (lowest price) and best sell (highest price)
    let bestBuy = successful[0];
    let bestSell = successful[0];

    for (const item of successful) {
        if (item.data.price < bestBuy.data.price) {
            bestBuy = item;
        }
        if (item.data.price > bestSell.data.price) {
            bestSell = item;
        }
    }

    // Calculate spread
    const spreadAbs = bestSell.data.price - bestBuy.data.price;
    const spreadPct = (spreadAbs / bestBuy.data.price) * 100;

    // Sort by price ascending
    const sorted = successful
        .map(item => ({
            exchange: item.exchange,
            price: item.data.price,
            token: item.data.token,
            timestamp: item.data.timestamp
        }))
        .sort((a, b) => a.price - b.price);

    return {
        bestBuy: {
            exchange: bestBuy.exchange,
            price: bestBuy.data.price
        },
        bestSell: {
            exchange: bestSell.exchange,
            price: bestSell.data.price
        },
        spreadAbs,
        spreadPct,
        opportunities: [
            {
                buyOn: bestBuy.exchange,
                sellOn: bestSell.exchange,
                profitPct: spreadPct
            }
        ],
        sorted
    };
}

/**
 * Compare funding rates across exchanges
 */
function compareFunding(fundingArray) {
    // Filter successful responses
    const successful = fundingArray.filter(item => item.success && item.data);

    if (successful.length === 0) {
        return null;
    }

    // Find highest and lowest funding rates
    let highest = successful[0];
    let lowest = successful[0];

    for (const item of successful) {
        if (item.data.fundingRate > highest.data.fundingRate) {
            highest = item;
        }
        if (item.data.fundingRate < lowest.data.fundingRate) {
            lowest = item;
        }
    }

    // Calculate funding net and APR
    const fundingNet = highest.data.fundingRate - lowest.data.fundingRate;
    const apr = fundingNet * 3 * 365; // 3 times per day (every 8h), 365 days

    // Sort by funding rate descending (highest to lowest)
    const sorted = successful
        .map(item => ({
            exchange: item.exchange,
            fundingRate: item.data.fundingRate,
            token: item.data.token,
            timestamp: item.data.timestamp
        }))
        .sort((a, b) => b.fundingRate - a.fundingRate);

    return {
        highest: {
            exchange: highest.exchange,
            fundingRate: highest.data.fundingRate
        },
        lowest: {
            exchange: lowest.exchange,
            fundingRate: lowest.data.fundingRate
        },
        fundingNet,
        apr,
        sorted
    };
}

/**
 * Calculate arbitrage opportunities
 */
function calculateArbitrage(pricesArray) {
    // Filter successful responses
    const successful = pricesArray.filter(item => item.success && item.data);

    if (successful.length === 0) {
        return [];
    }

    // Find best buy and best sell
    let bestBuy = successful[0];
    let bestSell = successful[0];

    for (const item of successful) {
        if (item.data.price < bestBuy.data.price) {
            bestBuy = item;
        }
        if (item.data.price > bestSell.data.price) {
            bestSell = item;
        }
    }

    // Calculate spread
    const spreadAbs = bestSell.data.price - bestBuy.data.price;
    const spreadPct = (spreadAbs / bestBuy.data.price) * 100;

    // Return opportunities sorted by profit
    return [
        {
            buyOn: bestBuy.exchange,
            sellOn: bestSell.exchange,
            spreadPct
        }
    ];
}

module.exports = {
    comparePrices,
    compareFunding,
    calculateArbitrage
};
