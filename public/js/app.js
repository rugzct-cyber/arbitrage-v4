/**
 * ARBITRADE FRONTEND - Entry Point
 * Modular ES6 Architecture
 */

import { loadState, applyInitialState } from './state.js';
import { initTabs, initSidebar, initSorting, initFundingToggles } from './ui.js';
import { refreshAllData } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initTabs();
    initSidebar();
    initSorting();
    initFundingToggles();
    applyInitialState();
    refreshAllData();
    document.getElementById('btn-refresh').addEventListener('click', refreshAllData);
});
