/**
 * UI Rendering and DOM Manipulation - PERFORMANCE OPTIMIZED
 * Features: Event Delegation, Smart DOM Diffing, Skeleton Cleanup
 */

import { EXCHANGES } from './config.js';
import { state, saveState } from './state.js';
import { getSortedData, generateHistory, calculateStats, processData } from './logic.js';
import { openExchange, formatElastic } from './utils.js';

// Store row data for event delegation
const rowDataCache = new Map();

/**
 * Renders skeleton loading rows
 */
export function renderSkeleton() {
    const tbody = document.getElementById(state.activeTab === 'funding' ? 'funding-table-body' : 'price-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const tr = document.createElement('tr');
        tr.className = 'skeleton-row'; // Mark as skeleton for cleanup
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

    // STEP 2: Update/Create rows
    data.forEach((row, index) => {
        const rowId = `row-${prefix}-${row.pair}`;
        const chartId = `chart-${prefix}-${row.pair}`;
        validIds.add(rowId);
        validIds.add(chartId);

        // Cache row data for event delegation
        rowDataCache.set(rowId, { row, isFunding });

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
                <td class="col-metric ${metricClass} has-tooltip">${metricLabel}</td>
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

        // FORCE REORDER: Always append to ensure correct sort order
        const existingChartRow = document.getElementById(chartId);
        tbody.appendChild(tr);
        if (existingChartRow) tbody.appendChild(existingChartRow);
    });

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

/**
 * Renders Chart.js graph
 */
export function renderChart(row, container, isFunding, period) {
    const type = isFunding ? 'apr' : 'price';
    const history = generateHistory(row.metric, type, period);
    const stats = calculateStats(history);

    const lblAvg = isFunding ? `AVG APR (${period})` : 'AVG SPREAD';
    const lblMax = isFunding ? 'MAX APR' : 'MAX SPREAD';
    const lblMin = isFunding ? 'MIN APR' : 'MIN SPREAD';

    container.innerHTML = `
    <div class="inline-header">
        <div class="inline-title">${row.pair} <span style="font-size:12px; color:#666; margin-left:10px">${isFunding ? 'FUNDING HISTORY' : 'SPREAD EVOLUTION'}</span></div>
        <div class="time-filters">
            <button class="time-btn" data-period="24H">24H</button>
            <button class="time-btn" data-period="7D">7D</button>
            <button class="time-btn" data-period="30D">30D</button>
            <button class="time-btn" data-period="ALL">ALL</button>
            <button class="inline-close">CLOSE</button>
        </div>
    </div>
    <div class="inline-stats">
        <div class="stat-card"><div class="stat-label">CURRENT</div><div class="stat-value gold">${formatElastic(row.metric, type)}%</div></div>
        <div class="stat-card"><div class="stat-label">${lblAvg}</div><div class="stat-value">${formatElastic(stats.avg, type)}%</div></div>
        <div class="stat-card"><div class="stat-label">${lblMax}</div><div class="stat-value cyan">${formatElastic(stats.max, type)}%</div></div>
        <div class="stat-card"><div class="stat-label">${lblMin}</div><div class="stat-value">${formatElastic(stats.min, type)}%</div></div>
    </div>
    <div class="chart-wrapper"><canvas></canvas></div>
    `;

    container.querySelector('.inline-close').onclick = () => {
        container.closest('.chart-row').classList.remove('active');
        document.querySelectorAll('tr.selected-row').forEach(el => el.classList.remove('selected-row'));
    };

    container.querySelectorAll('.time-btn').forEach(btn => {
        if (btn.dataset.period === period) btn.classList.add('active');
        btn.onclick = () => renderChart(row, container, isFunding, btn.dataset.period);
    });

    if (state.chartInstance) state.chartInstance.destroy();
    const ctx = container.querySelector('canvas').getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

    const labels = generateTimeLabels(period, history.length);

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: isFunding ? 'APR %' : 'Spread %',
                data: history,
                borderColor: '#06B6D4',
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#111',
                    titleColor: '#FFF',
                    borderColor: '#333',
                    borderWidth: 1,
                    bodyFont: { family: 'JetBrains Mono' }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false, drawBorder: false },
                    ticks: {
                        color: '#666',
                        font: { family: 'JetBrains Mono', size: 10 },
                        maxTicksLimit: period === '30D' ? 10 : (period === 'ALL' ? 12 : 24),
                        maxRotation: 0,
                        autoSkip: true
                    }
                },
                y: { grid: { color: '#1A1A1A' }, ticks: { color: '#666', font: { family: 'JetBrains Mono' } } }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

function generateTimeLabels(period, count) {
    const labels = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const d = new Date(now);
        const offset = count - 1 - i;

        if (period === '24H') {
            d.setHours(d.getHours() - offset);
            labels.push(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
        } else if (period === '7D') {
            d.setDate(d.getDate() - offset);
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        } else if (period === '30D') {
            d.setDate(d.getDate() - offset);
            labels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
        } else { // ALL
            d.setDate(d.getDate() - offset);
            labels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
        }
    }
    return labels;
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

/**
 * Initializes sidebar toggles
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
            updateVisibility();
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

// Make openExchange available globally for backward compatibility
window.openExchangeGlobal = openExchange;
