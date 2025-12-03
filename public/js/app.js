/**
 * ARBITRADE FRONTEND LOGIC
 * Handles data fetching, processing, rendering, and interactivity.
 */

// --- CONFIGURATION ---
const API_URL = "/api";
const EXCHANGES = ['paradex', 'vest', 'extended', 'hyperliquid', 'lighter', 'hibachi', 'aster', 'pacifica', 'variational'];
const EXCHANGE_LINKS = {
    paradex: "https://app.paradex.trade/r/0xrugz",
    vest: "https://alpha.vestmarkets.com/join/0XRGZ",
    extended: "https://app.extended.exchange/join/0XRUGZ",
    hyperliquid: "https://app.hyperliquid.xyz/join/0XRUGZ",
    lighter: "https://app.lighter.xyz/?referral=0XRUGZ",
    hibachi: "https://hibachi.xyz/r/0xrugz",
    aster: "https://www.asterdex.com/en/referral/6f113B",
    pacifica: "https://app.pacifica.fi?referral=0xrugz",
    variational: "https://omni.variational.io/?ref=OMNIILQCGBAI"
};

/**
 * Application State
 * Stores fetched data, user preferences, and UI state.
 */
let state = {
    fundingData: [],
    priceData: [],
    selectedExchanges: EXCHANGES.reduce((acc, ex) => ({ ...acc, [ex]: true }), {}),
    activeTab: 'funding',
    sortColumn: 'metric',
    sortOrder: 'desc',
    sortColumn: 'metric',
    sortOrder: 'desc',
    rawFundingData: [], // Nouvelle variable pour stocker la source
    fundingBasis: 'apy',
    chartInstance: null
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSidebar();
    initSorting();
    initFundingToggles();
    refreshAllData();
    document.getElementById('btn-refresh').addEventListener('click', refreshAllData);
});

// --- DATA FETCHING ---

/**
 * Fetches funding and price data from the API.
 * Updates the state and triggers a re-render.
 */
async function refreshAllData() {
    const btn = document.getElementById('btn-refresh');
    btn.textContent = "...";
    btn.disabled = true;

    // Show Skeleton Loading
    renderSkeleton();

    try {


        const [fundingRes, priceRes] = await Promise.all([
            fetch(`${API_URL}/funding`),
            fetch(`${API_URL}/price`)
        ]);

        const fundingJson = await fundingRes.json();
        const priceJson = await priceRes.json();

        // SAUVEGARDE POUR CALCUL LOCAL
        state.rawFundingData = fundingJson.data || [];
        state.fundingData = processData(state.rawFundingData, 'apr');
        state.priceData = processData(priceJson.data || [], 'price');

        renderCurrentView();
        updateLastUpdate();
    } catch (e) {
        console.error("Failed to fetch data:", e);
    } finally {
        btn.textContent = "REFRESH";
        btn.disabled = false;
    }
}

/**
 * Renders skeleton rows while data is loading.
 */
function renderSkeleton() {
    const tbody = document.getElementById(state.activeTab === 'funding' ? 'funding-table-body' : 'price-table-body');
    tbody.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const tr = document.createElement('tr');
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
 * Processes raw API data into a structured format for the table.
 * Calculates strategies (Long/Short) and primary metrics (APR or Spread).
 * 
 * @param {Object} rawData - The JSON response from the API.
 * @param {string} metricKey - 'apr' or 'price'.
 * @returns {Array} Processed data array.
 */
function processData(rawData, metricKey) {
    const pairs = {};
    const list = Array.isArray(rawData) ? rawData : (rawData.data || []);
    list.forEach(item => {
        if (!pairs[item.pair]) pairs[item.pair] = { pair: item.pair, exchanges: {} };

        let val = metricKey === 'apr' ? item.apr : item.price;

        if (metricKey === 'apr') {
            if (state.fundingBasis === '8h') val = val / 1095; // 3 * 365
            if (state.fundingBasis === '1h') val = val / 8760; // 24 * 365
        }

        pairs[item.pair].exchanges[item.exchange] = val;
    });

    return Object.values(pairs).map(row => {
        const values = Object.entries(row.exchanges).filter(v => v[1] !== undefined);

        if (values.length === 0) return row;

        values.sort((a, b) => a[1] - b[1]);

        if (metricKey === 'apr') {
            // Funding Strategy: Long lowest APR, Short highest APR
            row.strategy = { long: values[0][0], short: values[values.length - 1][0] };
            row.metric = values[values.length - 1][1];
        } else {
            // Price Strategy: Buy Low (min), Sell High (max)
            row.strategy = { long: values[0][0], short: values[values.length - 1][0] };
            const min = values[0][1];
            const max = values[values.length - 1][1];
            // SAFEGUARD: Avoid division by zero
            row.metric = min > 0 ? ((max - min) / min) * 100 : 0;
        }
        return row;
    });
}

function initFundingToggles() {
    const toggles = document.querySelectorAll('.toggle-btn');
    toggles.forEach(btn => {
        btn.onclick = () => {
            // UI Update
            toggles.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // State Update
            state.fundingBasis = btn.dataset.basis;

            // RE-CALCUL INSTANTANÉ (Magie !)
            if (state.rawFundingData.length > 0) {
                state.fundingData = processData(state.rawFundingData, 'apr');
                renderCurrentView();
            }
        };
    });
}

// --- SORTING ---

/**
 * Initializes click listeners for table headers to enable sorting.
 */
function initSorting() {
    const tables = ['funding-table', 'price-table'];
    tables.forEach(tid => {
        const table = document.getElementById(tid);
        if (!table) return;
        const thead = table.querySelector('thead');
        if (!thead) return;

        // Sort by Pair
        thead.rows[0].cells[0].onclick = () => handleSort('pair');
        thead.rows[0].cells[0].style.cursor = 'pointer';

        // Sort by Metric (APR/Spread)
        thead.rows[0].cells[1].onclick = () => handleSort('metric');
        thead.rows[0].cells[1].style.cursor = 'pointer';

        // Sort by Exchange Columns
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
 * Updates the sort state and triggers a re-render.
 * Toggles order if the same column is clicked.
 * 
 * @param {string} column - The column identifier to sort by.
 */
function handleSort(column) {
    if (state.sortColumn === column) {
        state.sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc';
    } else {
        state.sortColumn = column;
        state.sortOrder = 'desc';
    }
    renderCurrentView();
}

/**
 * Returns a sorted copy of the data based on the current sort state.
 * 
 * @param {Array} data - The data array to sort.
 * @returns {Array} Sorted data array.
 */
function getSortedData(data) {
    const { sortColumn, sortOrder } = state;
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
        let valA, valB;
        if (sortColumn === 'pair') {
            valA = a.pair;
            valB = b.pair;
            return valA.localeCompare(valB) * multiplier;
        } else if (sortColumn === 'metric') {
            valA = a.metric || -Infinity;
            valB = b.metric || -Infinity;
        } else {
            valA = a.exchanges[sortColumn] ?? -Infinity;
            valB = b.exchanges[sortColumn] ?? -Infinity;
        }
        return (valA - valB) * multiplier;
    });
}

// --- HISTORY SIMULATOR ---

/**
 * Generates simulated historical data based on the current value.
 * Used for charting purposes as the API only provides real-time data.
 * 
 * @param {number} currentVal - The current metric value.
 * @param {string} type - 'apr' or 'price'.
 * @param {string} period - '24H', '7D', '30D', or 'ALL'.
 * @returns {Array} Array of historical values.
 */
function generateHistory(currentVal, type, period) {
    let points = 30;
    let volatility = 1;

    if (period === '24H') { points = 24; volatility = 0.5; }
    if (period === '7D') { points = 7; volatility = 0.8; }
    if (period === '30D') { points = 30; volatility = 1; }
    if (period === 'ALL') { points = 90; volatility = 1.5; }

    const data = [];
    let val = currentVal;

    // Safety check for invalid currentVal
    if (val === undefined || val === null || isNaN(val)) val = 0;

    for (let i = 0; i < points; i++) {
        const noise = type === 'apr' ? (Math.random() - 0.5) * 10 * volatility : (Math.random() - 0.5) * 0.2 * volatility;
        val = val - noise;
        if (type === 'price' && val < 0) val = 0;
        data.unshift(val);
    }
    data.push(currentVal);
    return data;
}

/**
 * Calculates simple statistics from historical data.
 * 
 * @param {Array} history - Array of numerical values.
 * @returns {Object} { avg, min, max }
 */
function calculateStats(history) {
    if (!history || history.length === 0) return { avg: 0, min: 0, max: 0 };
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    const min = Math.min(...history);
    const max = Math.max(...history);
    return { avg, min, max };
}

// --- RENDERING ---

/**
 * Renders the main table view (Funding or Price).
 * Handles sorting, row creation, and visibility updates.
 */
function renderCurrentView() {
    const isFunding = state.activeTab === 'funding';
    const data = getSortedData(isFunding ? state.fundingData : state.priceData);
    const tbody = document.getElementById(isFunding ? 'funding-table-body' : 'price-table-body');
    tbody.innerHTML = '';

    // Update Header Styles (Highlight sorted column)
    const tableId = isFunding ? 'funding-table' : 'price-table';
    const thead = document.getElementById(tableId).querySelector('thead');
    Array.from(thead.rows[0].cells).forEach(cell => cell.style.color = '');

    if (state.sortColumn === 'pair') thead.rows[0].cells[0].style.color = '#F0E68C';
    else if (state.sortColumn === 'metric') thead.rows[0].cells[1].style.color = '#F0E68C';
    else {
        const idx = EXCHANGES.indexOf(state.sortColumn);
        if (idx !== -1) thead.rows[0].cells[idx + 3].style.color = '#F0E68C';
    }

    data.forEach(row => {
        // 1. Create Main Data Row
        const tr = document.createElement('tr');
        const metricLabel = `${(row.metric || 0).toFixed(2)}%`;
        // Removed green color for positive APRs, kept red for negative
        const metricClass = (isFunding && row.metric < 0) ? 'text-short' : '';

        tr.innerHTML = `
            <td class="col-pair has-tooltip">${row.pair}</td>
            <td class="col-metric ${metricClass} has-tooltip">${metricLabel}</td>
            <td class="col-strategy">
                <div class="strategy-cell">
                    <div class="strategy-line"><span class="strategy-label">LONG</span><span class="strategy-val" onclick="event.stopPropagation(); openExchange('${row.strategy?.long}')">${row.strategy?.long || '-'}</span></div>
                    <div class="strategy-line"><span class="strategy-label">SHORT</span><span class="strategy-val" onclick="event.stopPropagation(); openExchange('${row.strategy?.short}')">${row.strategy?.short || '-'}</span><span class="chevron">▼</span></div>
                </div>
            </td>
        `;

        EXCHANGES.forEach(ex => {
            const val = row.exchanges[ex];
            const td = document.createElement('td');
            // Check for null/undefined to avoid crashes
            const isValid = val !== undefined && val !== null;
            td.innerHTML = isValid ? `<span class="exchange-val">${isFunding ? `${Number(val).toFixed(2)}%` : `$${Number(val).toLocaleString()}`}</span>` : '<span style="opacity:0.2">-</span>';
            if (isValid) {
                td.style.cursor = "pointer";
                td.onclick = (e) => { e.stopPropagation(); openExchange(ex); }
            }
            tr.appendChild(td);
        });

        tr.onclick = () => toggleDetails(row, tr, isFunding);
        tbody.appendChild(tr);

        // 2. Create Hidden Chart Row
        const chartTr = document.createElement('tr');
        chartTr.className = 'chart-row';
        chartTr.id = `chart-${isFunding ? 'funding' : 'price'}-${row.pair}`;
        chartTr.innerHTML = `<td colspan="${3 + EXCHANGES.length}"><div class="inline-chart-container"></div></td>`;
        tbody.appendChild(chartTr);
    });
    updateVisibility();
}

/**
 * Toggles the visibility of the details/chart row.
 * 
 * @param {Object} row - The data object for the row.
 * @param {HTMLElement} tr - The DOM element of the clicked row.
 * @param {boolean} isFunding - Whether the current view is Funding.
 */
function toggleDetails(row, tr, isFunding) {
    const chartRow = document.getElementById(`chart-${isFunding ? 'funding' : 'price'}-${row.pair}`);
    const isActive = chartRow.classList.contains('active');

    // Close other open rows
    document.querySelectorAll('.chart-row.active').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('tr.selected-row').forEach(el => el.classList.remove('selected-row'));

    if (!isActive) {
        chartRow.classList.add('active');
        tr.classList.add('selected-row');
        // Render chart immediately
        renderChart(row, chartRow.querySelector('.inline-chart-container'), isFunding, '30D');
    }
}

/**
 * Renders the Chart.js graph and statistics within the details row.
 * 
 * @param {Object} row - The data object.
 * @param {HTMLElement} container - The container element for the chart.
 * @param {boolean} isFunding - Whether the current view is Funding.
 * @param {string} period - The time period to display.
 */
function renderChart(row, container, isFunding, period) {
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
        <div class="stat-card"><div class="stat-label">CURRENT</div><div class="stat-value gold">${(row.metric || 0).toFixed(2)}%</div></div>
        <div class="stat-card"><div class="stat-label">${lblAvg}</div><div class="stat-value">${stats.avg.toFixed(2)}%</div></div>
        <div class="stat-card"><div class="stat-label">${lblMax}</div><div class="stat-value cyan">${stats.max.toFixed(2)}%</div></div>
        <div class="stat-card"><div class="stat-label">${lblMin}</div><div class="stat-value">${stats.min.toFixed(2)}%</div></div>
    </div>
    <div class="chart-wrapper">
        <canvas></canvas>
    </div>
    `;

    // Bind Close Event
    container.querySelector('.inline-close').onclick = () => {
        container.closest('.chart-row').classList.remove('active');
        document.querySelectorAll('tr.selected-row').forEach(el => el.classList.remove('selected-row'));
    };

    // Bind Time Filter Events
    container.querySelectorAll('.time-btn').forEach(btn => {
        if (btn.dataset.period === period) btn.classList.add('active');
        btn.onclick = () => renderChart(row, container, isFunding, btn.dataset.period);
    });

    // Initialize Chart.js
    if (state.chartInstance) state.chartInstance.destroy();
    const ctx = container.querySelector('canvas').getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(240, 230, 140, 0.2)');
    gradient.addColorStop(1, 'rgba(240, 230, 140, 0)');

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: history.length }, (_, i) => i),
            datasets: [{
                label: isFunding ? 'APR %' : 'Spread %',
                data: history,
                borderColor: '#F0E68C',
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
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#F0E68C',
                    bodyFont: { family: 'JetBrains Mono' }
                }
            },
            scales: {
                x: { display: false },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666', font: { family: 'JetBrains Mono' } } }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

// --- UI HELPERS ---

/**
 * Initializes the sidebar exchange toggles.
 */
function initSidebar() {
    const container = document.getElementById('exchanges-list');
    if (!container) return;
    container.innerHTML = '';
    EXCHANGES.forEach(ex => {
        const btn = document.createElement('div');
        btn.className = 'exchange-toggle active';
        btn.innerHTML = `<img src="assets/logos/${ex}.png" onerror="this.style.display='none'"> <span>${ex.toUpperCase()}</span>`;
        btn.onclick = () => {
            state.selectedExchanges[ex] = !state.selectedExchanges[ex];
            btn.classList.toggle('active');
            updateVisibility();
        };
        container.appendChild(btn);
    });
}

/**
 * Updates the visibility of table columns based on selected exchanges.
 * Adjusts colspan for the chart row to span the correct width.
 */
function updateVisibility() {
    const tables = ['funding-table', 'price-table'];
    tables.forEach(tid => {
        const table = document.getElementById(tid);
        if (!table) return;
        EXCHANGES.forEach((ex, idx) => {
            const colIdx = idx + 3;
            const visible = state.selectedExchanges[ex];
            if (table.rows[0].cells[colIdx]) table.rows[0].cells[colIdx].style.display = visible ? '' : 'none';
            Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
                if (tr.cells[colIdx]) tr.cells[colIdx].style.display = visible ? '' : 'none';
                if (tr.classList.contains('chart-row')) {
                    const visibleCount = Object.values(state.selectedExchanges).filter(Boolean).length;
                    tr.cells[0].colSpan = 3 + visibleCount;
                }
            });
        });
    });
}

/**
 * Initializes the tab switching logic (Funding vs Price).
 */
function initTabs() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.onclick = () => {
            // Gestion des classes actives
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Changement d'état
            state.activeTab = btn.dataset.tab;

            // Gestion de l'affichage (DOM)
            document.getElementById('funding-view').style.display = state.activeTab === 'funding' ? 'block' : 'none';
            document.getElementById('price-view').style.display = state.activeTab === 'price' ? 'block' : 'none';

            // Rendu INSTANTANÉ avec les données en mémoire
            renderCurrentView();
        };
    });
}

/**
 * Opens the exchange referral link in a new tab.
 * 
 * @param {string} ex - The exchange identifier.
 */
function openExchange(ex) {
    if (EXCHANGE_LINKS[ex]) window.open(EXCHANGE_LINKS[ex], '_blank');
}

/**
 * Updates the "Last Updated" timestamp in the UI.
 */
function updateLastUpdate() {
    const el = document.getElementById('last-update');
    if (el) el.textContent = `UPDATED: ${new Date().toLocaleTimeString()}`;
}
