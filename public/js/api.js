/**
 * API Data Fetching
 */

import { API_URL } from './config.js';
import { state } from './state.js';
import { processData } from './logic.js';
import { renderSkeleton, renderCurrentView, updateLastUpdate } from './ui.js';

export async function refreshAllData() {
    const btn = document.getElementById('btn-refresh');
    btn.textContent = "...";
    btn.disabled = true;

    renderSkeleton();

    try {
        const [fundingRes, priceRes] = await Promise.all([
            fetch(`${API_URL}/funding`),
            fetch(`${API_URL}/price`)
        ]);

        const fundingJson = await fundingRes.json();
        const priceJson = await priceRes.json();

        state.rawFundingData = fundingJson.data || [];
        state.fundingData = processData(state.rawFundingData, 'apr');
        state.priceData = processData(priceJson.data || [], 'price');

        renderCurrentView();
        updateLastUpdate();
    } catch (e) {
        console.error("Failed to fetch data:", e);
    } finally {
        btn.textContent = "REFRESH";
        btn.disabled = false;
    }
}
