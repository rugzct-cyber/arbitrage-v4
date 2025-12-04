/**
 * Application State Management
 */

import { EXCHANGES } from './config.js';

export const state = {
    fundingData: [],
    priceData: [],
    rawFundingData: [],
    selectedExchanges: EXCHANGES.reduce((acc, ex) => ({ ...acc, [ex]: true }), {}),
    activeTab: 'funding',
    sort: { column: 'metric', direction: 'desc' },
    fundingBasis: 'apy',
    showAverage: false,
    chartInstance: null
};

export function loadState() {
    const saved = localStorage.getItem('arbitrade_prefs');
    if (saved) {
        try {
            const prefs = JSON.parse(saved);
            state.selectedExchanges = prefs.selectedExchanges || state.selectedExchanges;
            state.activeTab = prefs.activeTab || state.activeTab;
            state.fundingBasis = prefs.fundingBasis || state.fundingBasis;
            if (prefs.showAverage !== undefined) state.showAverage = prefs.showAverage;
            if (prefs.sort) state.sort = prefs.sort;
        } catch (e) {
            console.error("Error loading saved state:", e);
        }
    }
}

export function saveState() {
    const prefs = {
        selectedExchanges: state.selectedExchanges,
        activeTab: state.activeTab,
        fundingBasis: state.fundingBasis,
        showAverage: state.showAverage,
        sort: state.sort
    };
    localStorage.setItem('arbitrade_prefs', JSON.stringify(prefs));
}

export function applyInitialState() {
    // Restore active tab
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });
    document.getElementById('funding-view').style.display = state.activeTab === 'funding' ? 'block' : 'none';
    document.getElementById('price-view').style.display = state.activeTab === 'price' ? 'block' : 'none';

    // Restore funding toggle
    // Restore funding toggle
    document.querySelectorAll('.toggle-btn[data-basis]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.basis === state.fundingBasis);
    });
    const avgBtn = document.getElementById('btn-toggle-avg');
    if (avgBtn) avgBtn.classList.toggle('active', state.showAverage);
}
