const { getAllMarketData } = require('./src/services/aggregator');

async function test() {
    console.log("Detailed SPX investigation...");
    const result = await getAllMarketData();

    // Find all SPX variants
    const spxData = result.data.filter(d => d.pair.includes('SPX'));

    console.log("\n=== ALL SPX ENTRIES (RAW) ===");
    spxData.forEach(item => {
        console.log(`Exchange: ${item.exchange.padEnd(15)} | Pair: ${item.pair.padEnd(15)} | Price: $${item.price.toFixed(2)}`);
    });

    // Check for hyperliquid specifically
    console.log("\n=== HYPERLIQUID ENTRIES ===");
    const hlData = result.data.filter(d => d.exchange === 'hyperliquid');
    hlData.forEach(item => {
        console.log(`Pair: ${item.pair}`);
    });
}

test();
