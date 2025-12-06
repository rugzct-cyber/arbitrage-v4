const { getAllMarketData } = require('./src/services/aggregator');

async function test() {
    console.log("Testing SPX500 normalization...");
    const result = await getAllMarketData();

    // Find all SPX variants
    const spxData = result.data.filter(d => d.pair.includes('SPX'));

    console.log("\n=== SPX PAIRS AFTER NORMALIZATION ===");
    const grouped = {};
    spxData.forEach(item => {
        if (!grouped[item.pair]) grouped[item.pair] = [];
        grouped[item.pair].push(item.exchange);
    });

    Object.keys(grouped).forEach(pair => {
        console.log(`${pair}: [${grouped[pair].join(', ')}]`);
    });
}

test();
