const { httpPost } = require('./src/utils/fetcher');

const URL = "https://subgraph.satsuma-prod.com/391a61815d32/ostium/ost-prod/api";
const QUERY = `{ pairs(first: 10) { from to lastTradePrice lastFundingRate } }`;

async function showRawData() {
    console.log("=== DONNÉES BRUTES OSTIUM (10 paires) ===\n");
    const response = await httpPost(URL, { query: QUERY });

    if (response && response.data && response.data.pairs) {
        response.data.pairs.forEach((p, i) => {
            console.log(`[${i + 1}] ${p.from}-${p.to}`);
            console.log(`    Prix brut:    ${p.lastTradePrice}`);
            console.log(`    Prix converti: $${(parseFloat(p.lastTradePrice) / 1e18).toFixed(2)}`);
            console.log(`    Funding brut: ${p.lastFundingRate}`);
            console.log(`    Funding /1e9: ${(parseFloat(p.lastFundingRate) / 1e9).toFixed(9)}`);
            console.log('');
        });
    } else {
        console.error("Erreur:", JSON.stringify(response, null, 2));
    }
}

showRawData();
