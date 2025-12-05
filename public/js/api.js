/**
 * API Data Fetching
 * Auto-refresh enabled for near real-time updates
 */

import { API_URL } from './config.js';
import { state } from './state.js';
import { processData } from './logic.js';
import { renderSkeleton, renderCurrentView, updateLastUpdate } from './ui.js';

// Auto-refresh interval (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000;
let refreshInterval = null;
let isRefreshing = false;

/**
 * Fetches fresh data from API
 * @param {boolean} showSkeleton - Whether to show loading skeleton
 */
export async function refreshAllData(showSkeleton = true) {
    // Prevent concurrent refreshes
    if (isRefreshing) return;
    isRefreshing = true;

    const btn = document.getElementById('btn-refresh');
    if (btn) {
        btn.textContent = "...";
        btn.disabled = true;
    }

    if (showSkeleton) {
        renderSkeleton();
    }

    try {
        const [fundingRes, priceRes] = await Promise.all([
            fetch(`${API_URL}/funding`),
            fetch(`${API_URL}/price`)
        ]);

        const fundingJson = await fundingRes.json();
        const priceJson = await priceRes.json();

        // Store exchange status for UI feedback
        state.exchangeStatus = fundingJson.exchangeStatus || {};

        state.rawFundingData = fundingJson.data || [];
        state.fundingData = processData(state.rawFundingData, 'apr');
        state.priceData = processData(priceJson.data || [], 'price');

        renderCurrentView();
        updateLastUpdate();
    } catch (e) {
        console.error("[API] Failed to fetch data:", e);
    } finally {
        isRefreshing = false;
        if (btn) {
            btn.textContent = "REFRESH";
            btn.disabled = false;
        }
    }
}

/**
 * Starts auto-refresh polling
 */
export function startAutoRefresh() {
    if (refreshInterval) return; // Already running

    refreshInterval = setInterval(() => {
        // Silent refresh (no skeleton) for better UX
        refreshAllData(false);
    }, AUTO_REFRESH_INTERVAL);

    console.log(`[API] Auto-refresh started (${AUTO_REFRESH_INTERVAL / 1000}s interval)`);
}

/**
 * Stops auto-refresh polling
 */
export function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log("[API] Auto-refresh stopped");
    }
}

/**
 * Initialize auto-refresh on page visibility changes
 * Pause when tab is hidden, resume when visible
 */
export function initAutoRefresh() {
    startAutoRefresh();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            // Immediate refresh when returning to tab
            refreshAllData(false);
            startAutoRefresh();
        }
    });
}
