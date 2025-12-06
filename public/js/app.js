/**
 * ARBITRADE FRONTEND - Entry Point
 * Modular ES6 Architecture
 */

import { loadState, applyInitialState } from './state.js';
import { initTabs, initSidebar, initSorting, initFundingToggles, initTableEvents, initSearch } from './ui.js';
import { refreshAllData, initAutoRefresh } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initTabs();
    initSidebar();
    initSorting();
    initFundingToggles();
    initTableEvents();
    initSearch();
    applyInitialState();

    // Initial data fetch
    refreshAllData();

    // Manual refresh button
    document.getElementById('btn-refresh').addEventListener('click', () => refreshAllData(true));

    // Start auto-refresh (10s interval, pauses when tab hidden)
    initAutoRefresh();

    // Sidebar toggle functionality
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const appLayout = document.getElementById('app-layout');
    if (toggleBtn && appLayout) {
        toggleBtn.addEventListener('click', () => {
            appLayout.classList.toggle('collapsed');
        });
    }
});
