/**
 * Controls Module
 * Handles sidebar, tabs, toggles, sorting, and search
 */

import { EXCHANGES } from '../config.js';
import { state, saveState } from '../state.js';
import { processData } from '../logic.js';
import { renderCurrentView, updateVisibility } from './render.js';

/**
 * Initializes sidebar exchange toggles
 */
export function initSidebar() {
    const container = document.getElementById('exchanges-list');
    if (!container) return;
    container.innerHTML = '';
    EXCHANGES.forEach(ex => {
        const btn = document.createElement('div');
        const isActive = state.selectedExchanges[ex];
        btn.className = `exchange-toggle ${isActive ? 'active' : ''}`;
        btn.innerHTML = `<img src="assets/logos/${ex}.png" onerror="this.style.display='none'"> <span>${ex.toUpperCase()}</span>`;
        btn.onclick = () => {
            state.selectedExchanges[ex] = !state.selectedExchanges[ex];
            btn.classList.toggle('active');
            saveState();

            // Force recalculation of strategy with new visible exchanges
            if (state.rawFundingData.length > 0) {
                state.fundingData = processData(state.rawFundingData, 'apr');
            }

            renderCurrentView();
        };
        container.appendChild(btn);
    });
}

/**
 * Initializes tab switching
 */
export function initTabs() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeTab = btn.dataset.tab;
            document.getElementById('funding-view').style.display = state.activeTab === 'funding' ? 'block' : 'none';
            document.getElementById('price-view').style.display = state.activeTab === 'price' ? 'block' : 'none';
            saveState();
            renderCurrentView();
        };
    });
}

/**
 * Initializes funding toggles
 */
export function initFundingToggles() {
    document.querySelectorAll('.toggle-btn[data-basis]').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.toggle-btn[data-basis]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.fundingBasis = btn.dataset.basis;
            saveState();
            if (state.rawFundingData.length > 0) {
                state.fundingData = processData(state.rawFundingData, 'apr');
                renderCurrentView();
            }
        };
    });

    const avgBtn = document.getElementById('btn-toggle-avg');
    const avgSelector = document.getElementById('avg-period-selector');
    const basisBtns = document.querySelectorAll('.toggle-btn[data-basis]');

    if (avgBtn) {
        avgBtn.onclick = () => {
            state.showAverage = !state.showAverage;
            avgBtn.classList.toggle('active', state.showAverage);

            if (avgSelector) avgSelector.style.display = state.showAverage ? 'flex' : 'none';
            basisBtns.forEach(btn => btn.classList.toggle('disabled', state.showAverage));

            saveState();
            if (state.rawFundingData.length > 0) {
                state.fundingData = processData(state.rawFundingData, 'apr');
                renderCurrentView();
            }
        };
    }

    if (avgSelector) {
        avgSelector.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.onclick = () => {
                avgSelector.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.averagePeriod = btn.dataset.period;
                saveState();
                if (state.rawFundingData.length > 0) {
                    state.fundingData = processData(state.rawFundingData, 'apr');
                    renderCurrentView();
                }
            };
        });
    }
}

/**
 * Initializes sorting
 */
export function initSorting() {
    const tables = ['funding-table', 'price-table'];
    tables.forEach(tid => {
        const table = document.getElementById(tid);
        if (!table) return;
        const thead = table.querySelector('thead');
        if (!thead) return;

        thead.rows[0].cells[0].onclick = () => handleSort('pair');
        thead.rows[0].cells[0].style.cursor = 'pointer';
        thead.rows[0].cells[1].onclick = () => handleSort('metric');
        thead.rows[0].cells[1].style.cursor = 'pointer';

        EXCHANGES.forEach((ex, i) => {
            const cell = thead.rows[0].cells[i + 3];
            if (cell) {
                cell.onclick = () => handleSort(ex);
                cell.style.cursor = 'pointer';
            }
        });
    });
}

/**
 * Handles column sorting
 */
export function handleSort(column) {
    if (state.sort.column === column) {
        state.sort.direction = state.sort.direction === 'desc' ? 'asc' : 'desc';
    } else {
        state.sort.column = column;
        state.sort.direction = 'desc';
    }
    saveState();
    renderCurrentView();
}

/**
 * Updates last update timestamp
 */
export function updateLastUpdate() {
    const el = document.getElementById('last-update');
    if (el) el.textContent = `UPDATED: ${new Date().toLocaleTimeString()}`;
}

/**
 * Initialize search input listener
 */
export function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderCurrentView();
    });
}
