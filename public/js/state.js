/**
 * Application State Management
 */

import { EXCHANGES } from './config.js';

export const state = {
    fundingData: [],
    priceData: [],
    rawFundingData: [],
    rawPriceData: [],
    selectedExchanges: EXCHANGES.reduce((acc, ex) => ({ ...acc, [ex]: true }), {}),
    activeTab: 'funding',
    sort: { column: 'metric', direction: 'desc' },
    fundingBasis: 'apy',
    showAverage: false,
    averagePeriod: '30D',
    chartInstance: null,
    // Admin mode: ?admin=true in URL shows all pairs (min 1 value instead of 2)
    adminMode: new URLSearchParams(window.location.search).has('admin'),
    searchQuery: ''
};

export function loadState() {
    const saved = localStorage.getItem('arbitrade_prefs');
    if (saved) {
        try {
            const prefs = JSON.parse(saved);
            // Merge saved selectedExchanges with current EXCHANGES list
            // New exchanges default to true, existing ones keep their saved state
            if (prefs.selectedExchanges) {
                EXCHANGES.forEach(ex => {
                    if (prefs.selectedExchanges[ex] !== undefined) {
                        state.selectedExchanges[ex] = prefs.selectedExchanges[ex];
                    }
                    // New exchanges stay true (default from initial state)
                });
            }
            state.activeTab = prefs.activeTab || state.activeTab;
            state.fundingBasis = prefs.fundingBasis || state.fundingBasis;
            if (prefs.showAverage !== undefined) state.showAverage = prefs.showAverage;
            if (prefs.averagePeriod) state.averagePeriod = prefs.averagePeriod;
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
        averagePeriod: state.averagePeriod,
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
    document.querySelectorAll('.toggle-btn[data-basis]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.basis === state.fundingBasis);
    });
    const avgBtn = document.getElementById('btn-toggle-avg');
    const avgSelector = document.getElementById('avg-period-selector');

    if (avgBtn) avgBtn.classList.toggle('active', state.showAverage);
    if (avgSelector) {
        avgSelector.style.display = state.showAverage ? 'flex' : 'none';
        avgSelector.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === state.averagePeriod);
        });
    }

    // Disable basis buttons if average is shown
    if (state.showAverage) {
        document.querySelectorAll('.toggle-btn[data-basis]').forEach(btn => btn.classList.add('disabled'));
    }
}
