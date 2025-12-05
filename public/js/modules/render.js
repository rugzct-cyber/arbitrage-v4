/**
 * Render Module
 * Handles table rendering, skeletons, and visibility
 */

import { EXCHANGES } from '../config.js';
import { state } from '../state.js';
import { getSortedData } from '../logic.js';
import { formatElastic } from '../utils.js';
import { rowDataCache } from './events.js';

/**
 * Color interpolation for metric gradient (Gold -> White)
 */
// GOLD_RGB: #3C82F6 -> (60, 130, 246) - Blue theme
const GOLD_RGB = [60, 130, 246];
// WHITE_RGB: #EDEDED -> (237, 237, 237)
const WHITE_RGB = [237, 237, 237];

function interpolateColor(rgb1, rgb2, factor) {
    const result = rgb1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(rgb1[i] + factor * (rgb2[i] - rgb1[i]));
    }
    return `rgb(${result.join(', ')})`;
}

function calculateMetricColor(row, index, totalLength) {
    const maxInterpolationIndex = 17; // Gradient up to line 18
    const maxIndexToUse = Math.min(totalLength - 1, maxInterpolationIndex);

    // Beyond 18th row: white, no shadow
    if (index > maxInterpolationIndex) {
        return { color: `rgb(${WHITE_RGB.join(', ')})`, shadow: '' };
    }

    // Factor: 0 (index 0 = blue) to 1 (index 17 = white)
    const factor = index / maxIndexToUse;
    const color = interpolateColor(GOLD_RGB, WHITE_RGB, factor);

    // Shadow fades with color
    const shadowOpacity = 0.25 * (1 - factor);
    const shadow = shadowOpacity > 0.01
        ? `0 0 10px rgba(60, 130, 246, ${shadowOpacity.toFixed(2)})`
        : '';

    return { color, shadow };
}

/**
 * Renders skeleton loading rows
 */
export function renderSkeleton() {
    const tbody = document.getElementById(state.activeTab === 'funding' ? 'funding-table-body' : 'price-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const tr = document.createElement('tr');
        tr.className = 'skeleton-row';
        tr.innerHTML = `
            <td><div class="skeleton" style="width: 60px;"></div></td>
            <td><div class="skeleton" style="width: 80px;"></div></td>
            <td><div class="skeleton" style="width: 100px;"></div></td>
            ${EXCHANGES.map(() => `<td><div class="skeleton" style="width: 50px;"></div></td>`).join('')}
        `;
        tbody.appendChild(tr);
    }
}

/**
 * SMART RENDER - Updates existing rows, creates new ones, removes stale ones
 */
export function renderCurrentView() {
    const isFunding = state.activeTab === 'funding';
    let data = getSortedData(isFunding ? state.fundingData : state.priceData);
    const tbody = document.getElementById(isFunding ? 'funding-table-body' : 'price-table-body');
    if (!tbody) return;

    // FILTER by search query
    if (state.searchQuery && state.searchQuery.trim() !== '') {
        const query = state.searchQuery.toLowerCase();
        data = data.filter(row => row.pair.toLowerCase().includes(query));
    }

    // FILTER: Active Exchanges & Admin Mode
    const activeExchanges = Object.keys(state.selectedExchanges).filter(ex => state.selectedExchanges[ex]);
    data = data.filter(row => {
        const validCount = activeExchanges.reduce((count, ex) => {
            const val = row.exchanges[ex];
            return (val !== undefined && val !== null) ? count + 1 : count;
        }, 0);
        // ADMIN MODE: Show all with at least 1 value
        if (state.adminMode) return validCount >= 1;
        // NORMAL MODE: Need at least 2 values for arbitrage
        return validCount >= 2;
    });

    // Update Header Styles
    const tableId = isFunding ? 'funding-table' : 'price-table';
    const thead = document.getElementById(tableId)?.querySelector('thead');
    if (thead) {
        if (isFunding) {
            const period = state.averagePeriod || '30D';
            thead.rows[0].cells[1].textContent = state.showAverage ? `AVG APR (${period})` : (state.fundingBasis === 'apy' ? 'APY' : 'APR');
        }
        Array.from(thead.rows[0].cells).forEach(cell => cell.style.color = '');
        if (state.sort.column === 'pair') thead.rows[0].cells[0].style.color = '#F0E68C';
        else if (state.sort.column === 'metric') thead.rows[0].cells[1].style.color = '#F0E68C';
        else {
            const idx = EXCHANGES.indexOf(state.sort.column);
            if (idx !== -1) thead.rows[0].cells[idx + 3].style.color = '#F0E68C';
        }
    }

    // Track valid IDs for cleanup
    const validIds = new Set();
    const colSpan = 3 + EXCHANGES.length;
    const prefix = isFunding ? 'funding' : 'price';

    // DocumentFragment for batch DOM insertion (reduces reflows)
    const fragment = document.createDocumentFragment();

    // STEP 2: Update/Create rows
    data.forEach((row, index) => {
        const rowId = `row-${prefix}-${row.pair}`;
        const chartId = `chart-${prefix}-${row.pair}`;
        validIds.add(rowId);
        validIds.add(chartId);

        // Cache row data for event delegation
        rowDataCache.set(rowId, { row, isFunding });

        // GRADIENT COLOR for metric
        const { color: metricColor, shadow: metricShadow } = calculateMetricColor(row, index, data.length);
        const metricStyle = `style="color: ${metricColor}; text-shadow: ${metricShadow};"`;

        const metricLabel = `${formatElastic(row.metric, isFunding ? 'apr' : 'price')}%`;
        const metricClass = (isFunding && row.metric < 0) ? 'text-short' : '';

        let tr = document.getElementById(rowId);

        if (tr) {
            // ROW EXISTS - Update only changed cells
            const cells = tr.cells;

            // Cell 0: Pair
            if (cells[0].textContent !== row.pair) cells[0].textContent = row.pair;

            // Cell 1: Metric
            if (cells[1].textContent !== metricLabel) {
                cells[1].textContent = metricLabel;
                cells[1].className = `col-metric ${metricClass} has-tooltip`;
            }
            // Apply gradient color
            cells[1].style.color = metricColor;
            cells[1].style.textShadow = metricShadow;

            // Cell 2: Strategy - update spans
            const longSpan = cells[2].querySelector('.strategy-line:first-child .strategy-val');
            const shortSpan = cells[2].querySelector('.strategy-line:last-child .strategy-val');
            if (longSpan) {
                const longVal = row.strategy?.long || '-';
                if (longSpan.textContent !== longVal) {
                    longSpan.textContent = longVal;
                    longSpan.dataset.exchange = row.strategy?.long || '';
                }
            }
            if (shortSpan) {
                const shortVal = row.strategy?.short || '-';
                if (shortSpan.textContent !== shortVal) {
                    shortSpan.textContent = shortVal;
                    shortSpan.dataset.exchange = row.strategy?.short || '';
                }
            }

            // Cells 3+: Exchange values
            EXCHANGES.forEach((ex, i) => {
                const cell = cells[3 + i];
                if (!cell) return;
                const val = row.exchanges[ex];
                const isValid = val !== undefined && val !== null;
                const isLong = row.strategy?.long === ex;
                const isShort = row.strategy?.short === ex;
                const newText = isValid ? (isFunding ? `${formatElastic(val, 'apr')}%` : `$${formatElastic(val, 'price')}`) : '-';
                const span = cell.querySelector('span');
                if (span) {
                    if (span.textContent !== newText) span.textContent = newText;
                    span.style.opacity = isValid ? '' : '0.2';
                    // Apply highlight classes
                    span.classList.remove('val-long', 'val-short');
                    if (isValid && isLong) span.classList.add('val-long');
                    if (isValid && isShort) span.classList.add('val-short');
                    span.className = span.className || (isValid ? 'exchange-val' : '');
                }
                cell.dataset.exchange = isValid ? ex : '';
                cell.style.cursor = isValid ? 'pointer' : '';
            });
        } else {
            // ROW DOESN'T EXIST - Create new
            tr = document.createElement('tr');
            tr.id = rowId;
            tr.dataset.pair = row.pair;
            tr.innerHTML = `
                <td class="col-pair has-tooltip">${row.pair}</td>
                <td class="col-metric ${metricClass} has-tooltip" ${metricStyle}>${metricLabel}</td>
                <td class="col-strategy">
                    <div class="strategy-cell">
                        <div class="strategy-line"><span class="strategy-label">LONG</span><span class="strategy-val" data-exchange="${row.strategy?.long || ''}">${row.strategy?.long || '-'}</span></div>
                        <div class="strategy-line"><span class="strategy-label">SHORT</span><span class="strategy-val" data-exchange="${row.strategy?.short || ''}">${row.strategy?.short || '-'}</span></div>
                    </div>
                </td>
                ${EXCHANGES.map(ex => {
                const val = row.exchanges[ex];
                const isValid = val !== undefined && val !== null;
                const isLong = row.strategy?.long === ex;
                const isShort = row.strategy?.short === ex;
                const highlightClass = isValid ? (isLong ? 'exchange-val val-long' : (isShort ? 'exchange-val val-short' : 'exchange-val')) : '';
                return `<td data-exchange="${isValid ? ex : ''}" style="cursor:${isValid ? 'pointer' : ''}"><span class="${highlightClass}" style="${isValid ? '' : 'opacity:0.2'}">${isValid ? (isFunding ? `${formatElastic(val, 'apr')}%` : `$${formatElastic(val, 'price')}`) : '-'}</span></td>`;
            }).join('')}
            `;
            tbody.appendChild(tr);

            // Create chart row
            const chartTr = document.createElement('tr');
            chartTr.className = 'chart-row';
            chartTr.id = chartId;
            chartTr.innerHTML = `<td colspan="${colSpan}"><div class="inline-chart-container"></div></td>`;
            tbody.appendChild(chartTr);
        }

        // Add to fragment for batch insertion
        const existingChartRow = document.getElementById(chartId);
        fragment.appendChild(tr);
        if (existingChartRow) fragment.appendChild(existingChartRow);
    });

    // BATCH INSERT: Single DOM operation for all rows
    tbody.appendChild(fragment);

    // STEP 3: CLEANUP - Remove stale rows (skeletons, old pairs)
    const allRows = Array.from(tbody.children);
    allRows.forEach(row => {
        // Remove skeletons
        if (row.classList.contains('skeleton-row')) {
            row.remove();
            return;
        }
        // Remove rows not in current data
        if (row.id && !validIds.has(row.id)) {
            row.remove();
        }
    });

    updateVisibility();
}

/**
 * Updates column visibility
 */
export function updateVisibility() {
    const tables = ['funding-table', 'price-table'];
    tables.forEach(tid => {
        const table = document.getElementById(tid);
        if (!table) return;
        EXCHANGES.forEach((ex, idx) => {
            const colIdx = idx + 3;
            const visible = state.selectedExchanges[ex];
            if (table.rows[0]?.cells[colIdx]) table.rows[0].cells[colIdx].style.display = visible ? '' : 'none';
            Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
                if (tr.cells[colIdx]) tr.cells[colIdx].style.display = visible ? '' : 'none';
                if (tr.classList.contains('chart-row')) {
                    const visibleCount = Object.values(state.selectedExchanges).filter(Boolean).length;
                    if (tr.cells[0]) tr.cells[0].colSpan = 3 + visibleCount;
                }
            });
        });
    });
}
