/**
 * ARBITRADE FRONTEND - Entry Point
 * Modular ES6 Architecture
 */

import { loadState, applyInitialState } from './state.js';
import { initTabs, initSidebar, initSorting, initFundingToggles, initTableEvents, initSearch } from './ui.js';
import { refreshAllData } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initTabs();
    initSidebar();
    initSorting();
    initFundingToggles();
    initTableEvents(); // Event delegation for table clicks
    initSearch(); // Real-time search filter
    applyInitialState();
    refreshAllData();
    document.getElementById('btn-refresh').addEventListener('click', refreshAllData);
});
