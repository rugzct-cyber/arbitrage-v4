const { httpPost } = require('./src/utils/fetcher');

const URL = "https://subgraph.satsuma-prod.com/391a61815d32/ostium/ost-prod/api";
const QUERY = `
{
  pairs(first: 5) {
    from
    to
    lastTradePrice
    lastFundingRate
  }
}
`;

async function debug() {
    console.log("Fetching from Subgraph...");
    const data = await httpPost(URL, { query: QUERY });
    if (data && data.data && data.data.pairs) {
        data.data.pairs.forEach(p => {
            console.log(`Pair: ${p.from}-${p.to}, Price: ${p.lastTradePrice}, Funding: ${p.lastFundingRate}`);
        });
    } else {
        console.error("Failed to fetch or invalid structure", JSON.stringify(data, null, 2));
    }
}

debug();
