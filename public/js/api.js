/**
 * API Data Fetching
 */

import { API_URL } from './config.js';
import { state } from './state.js';
import { processData } from './logic.js';
import { renderSkeleton, renderCurrentView, updateLastUpdate } from './ui.js';

// Mock data generator
function generateMockData(type) {
    const pairs = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'XRP-USDT', 'ADA-USDT', 'DOGE-USDT', 'DOT-USDT', 'AVAX-USDT'];
    const exchanges = ['paradex', 'vest', 'extended', 'hyperliquid', 'lighter', 'hibachi', 'aster', 'pacifica', 'variational'];
    const data = [];

    pairs.forEach(pair => {
        // Randomize number of exchanges per pair (3 to 6)
        const numExchanges = 3 + Math.floor(Math.random() * 4);
        const selectedExchanges = exchanges.sort(() => 0.5 - Math.random()).slice(0, numExchanges);

        const basePrice = type === 'price' ?
            (pair.startsWith('BTC') ? 95000 :
                pair.startsWith('ETH') ? 3600 :
                    pair.startsWith('SOL') ? 240 : 100) : 0;

        selectedExchanges.forEach(exchange => {
            if (type === 'apr') {
                data.push({
                    pair,
                    exchange,
                    apr: (Math.random() * 20) - 5 // -5% to +15%
                });
            } else {
                data.push({
                    pair,
                    exchange,
                    price: basePrice * (1 + (Math.random() * 0.02 - 0.01)) // +/- 1% spread
                });
            }
        });
    });
    return { data };
}

export async function refreshAllData() {
    const btn = document.getElementById('btn-refresh');
    if (btn) {
        btn.textContent = "...";
        btn.disabled = true;
    }

    renderSkeleton();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        // Use mock data instead of failing API calls
        const fundingJson = generateMockData('apr');
        const priceJson = generateMockData('price');

        state.rawFundingData = fundingJson.data || [];
        state.fundingData = processData(state.rawFundingData, 'apr');
        state.priceData = processData(priceJson.data || [], 'price');

        renderCurrentView();
        updateLastUpdate();
    } catch (e) {
        console.error("Failed to fetch data:", e);
    } finally {
        if (btn) {
            btn.textContent = "REFRESH";
            btn.disabled = false;
        }
    }
}
