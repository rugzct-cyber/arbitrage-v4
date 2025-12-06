const { httpGet } = require('./src/utils/fetcher');

async function debug() {
    const data = await httpGet("https://metadata-backend.ostium.io/PricePublish/latest-prices");
    console.log("Raw item 0:", JSON.stringify(data[0], null, 2));
}

debug();
