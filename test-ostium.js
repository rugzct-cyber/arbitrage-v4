const ostium = require('./src/adapters/ostium');

async function test() {
    console.log("Testing Ostium Adapter...");
    const data = await ostium.getGlobalData();

    if (data.length > 0) {
        console.log(`✅ Success! Fetched ${data.length} markets.`);
        console.log("Sample data:", data[0]);
    } else {
        console.log("❌ No data fetched.");
    }
}

test();
