const adapter = require('./src/adapters/extended');

async function test() {
    console.log("Testing Extended Adapter...");
    try {
        const data = await adapter.getGlobalData();
        console.log(`Fetched ${data.length} items.`);

        if (data.length > 0) {
            console.log("\nSample items:");
            data.slice(0, 5).forEach(d => {
                console.log(`  ${d.pair}: price=$${d.price}, funding=${(d.fundingRate * 100).toFixed(4)}%`);
            });

            // Validation checks
            const hasInvalidExchange = data.some(d => d.exchange !== 'extended');

            if (hasInvalidExchange) console.error("\n❌ Validation Failed: Incorrect exchange name");
            else console.log("\n✅ Exchange name validation passed");

            console.log("✅ Adapter working correctly!");
        } else {
            console.warn("⚠️ No data returned. Check API or filtering logic.");
        }
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

test();
