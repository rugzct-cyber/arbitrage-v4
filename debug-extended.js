const { httpGet } = require('./src/utils/fetcher');

async function debug() {
    const url = "https://api.starknet.extended.exchange/api/v1/info/markets";
    const response = await httpGet(url);

    if (response?.data && response.data.length > 0) {
        const item = response.data[0];
        console.log("First item full structure:");
        console.log(JSON.stringify(item, null, 2));
    }
}

debug();
