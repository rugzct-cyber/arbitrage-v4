const { httpGet } = require('./src/utils/fetcher');

async function probe() {
    const urls = [
        "https://api.starknet.extended.exchange/api/v1/info/markets",
        "https://api.starknet.extended.exchange/api/v1/markets",
        "https://api.extended.exchange/v1/markets"
    ];

    for (const url of urls) {
        console.log(`\n--- Probing: ${url} ---`);
        try {
            const response = await httpGet(url);
            console.log("✅ Success!");
            console.log("Type:", typeof response);
            console.log("Keys:", Object.keys(response || {}));

            // Try to find the data array
            let items = [];
            if (Array.isArray(response)) items = response;
            else if (response?.data && Array.isArray(response.data)) items = response.data;
            else if (response?.result && Array.isArray(response.result)) items = response.result;

            if (items.length > 0) {
                console.log(`Found ${items.length} items`);
                console.log("First item keys:", Object.keys(items[0]));
                console.log("First item:", JSON.stringify(items[0], null, 2));
            }
        } catch (error) {
            console.log("❌ Failed:", error.message);
        }
    }
}

probe();
