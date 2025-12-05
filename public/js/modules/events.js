/**
 * Event Handling Module
 * Handles table event delegation and row interactions
 */

import { openExchange } from '../utils.js';
import { renderChart } from './charts.js';

// Store row data for event delegation
export const rowDataCache = new Map();

/**
 * Initialize Table Event Delegation - ONE listener per table
 */
export function initTableEvents() {
    ['funding-table-body', 'price-table-body'].forEach(tbodyId => {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        tbody.addEventListener('click', (e) => {
            const target = e.target;

            // Check: Strategy value click
            if (target.classList.contains('strategy-val')) {
                const exchange = target.dataset.exchange;
                if (exchange) {
                    e.stopPropagation();
                    openExchange(exchange);
                }
                return;
            }

            // Check: Exchange cell click (td with data-exchange)
            const td = target.closest('td[data-exchange]');
            if (td && td.dataset.exchange) {
                e.stopPropagation();
                openExchange(td.dataset.exchange);
                return;
            }

            // Check: Row click (for chart toggle)
            const tr = target.closest('tr[data-pair]');
            if (tr) {
                const rowId = tr.id;
                const cached = rowDataCache.get(rowId);
                if (cached) {
                    toggleDetails(cached.row, tr, cached.isFunding);
                }
            }
        });
    });
}

/**
 * Toggles chart row visibility
 */
export function toggleDetails(row, tr, isFunding) {
    const chartRow = document.getElementById(`chart-${isFunding ? 'funding' : 'price'}-${row.pair}`);
    if (!chartRow) return;
    const isActive = chartRow.classList.contains('active');

    document.querySelectorAll('.chart-row.active').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('tr.selected-row').forEach(el => el.classList.remove('selected-row'));

    if (!isActive) {
        chartRow.classList.add('active');
        tr.classList.add('selected-row');
        renderChart(row, chartRow.querySelector('.inline-chart-container'), isFunding, '30D');
    }
}
