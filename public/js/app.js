/**
 * ARBITRADE FRONTEND LOGIC
 * Version Finale : Persistance des données (Local Storage)
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

// --- STATE ---
let state = {
    fundingData: [],
    priceData: [],
    rawFundingData: [],
    // Préférences par défaut
    selectedExchanges: EXCHANGES.reduce((acc, ex) => ({ ...acc, [ex]: true }), {}),
    activeTab: 'funding',
    sort: { column: 'metric', direction: 'desc' },
    fundingBasis: 'apy',
    chartInstance: null
};

// --- STORAGE MANAGER ---
function loadState() {
    const saved = localStorage.getItem('arbitrade_prefs');
    if (saved) {
        try {
            const prefs = JSON.parse(saved);
            // On fusionne intelligemment pour garder les données par défaut si besoin
            state.selectedExchanges = prefs.selectedExchanges || state.selectedExchanges;
            state.activeTab = prefs.activeTab || state.activeTab;
            state.fundingBasis = prefs.fundingBasis || state.fundingBasis;
            if (prefs.sort) state.sort = prefs.sort;
        } catch (e) {
            console.error("Erreur lecture sauvegarde", e);
        }
    }
}

function saveState() {
    const prefs = {
        selectedExchanges: state.selectedExchanges,
        activeTab: state.activeTab,
        fundingBasis: state.fundingBasis,
        sort: state.sort
    };
    localStorage.setItem('arbitrade_prefs', JSON.stringify(prefs));
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadState(); // Chargement des préférences AVANT l'initialisation UI

    initTabs();
    initSidebar();
    initSorting();
    initFundingToggles();

    // Applique l'état initial au DOM
    applyInitialState();

    refreshAllData();
    document.getElementById('btn-refresh').addEventListener('click', refreshAllData);
});

function applyInitialState() {
    // Restaure l'onglet actif
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });
    document.getElementById('funding-view').style.display = state.activeTab === 'funding' ? 'block' : 'none';
    document.getElementById('price-view').style.display = state.activeTab === 'price' ? 'block' : 'none';

    // Restaure le toggle Funding
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.basis === state.fundingBasis);
    });
}

// --- DATA FETCHING ---
async function refreshAllData() {
    const btn = document.getElementById('btn-refresh');
    if (btn) {
        btn.textContent = "...";
        btn.disabled = true;
    }
    renderSkeleton();

    try {
        const [fundingRes, priceRes] = await Promise.all([
            fetch(`${API_URL}/funding`),
            fetch(`${API_URL}/price`)
        ]);
        const fundingJson = await fundingRes.json();
        const priceJson = await priceRes.json();

        state.rawFundingData = fundingJson.data || [];
        state.fundingData = processData(state.rawFundingData, 'apr');
        state.priceData = processData(priceJson.data || [], 'price');

        renderCurrentView();
        updateLastUpdate();
    } catch (e) {
        console.error(e);
    } finally {
        if (btn) {
            btn.textContent = "REFRESH";
            btn.disabled = false;
        }
    }
}

function processData(rawData, metricKey) {
    const pairs = {};
    const list = Array.isArray(rawData) ? rawData : (rawData.data || []);

    list.forEach(item => {
        if (!pairs[item.pair]) pairs[item.pair] = { pair: item.pair, exchanges: {} };
        let val = metricKey === 'apr' ? item.apr : item.price;

        if (metricKey === 'apr') {
            if (state.fundingBasis === '8h') val = val / 1095;
            if (state.fundingBasis === '1h') val = val / 8760;
        }
        pairs[item.pair].exchanges[item.exchange] = val;
    });
    return Object.values(pairs).map(row => {
        const values = Object.entries(row.exchanges).filter(v => v[1] !== undefined && v[1] !== null);
        if (values.length === 0) return row;
        values.sort((a, b) => a[1] - b[1]);
        if (metricKey === 'apr') {
            row.strategy = { long: values[0][0], short: values[values.length - 1][0] };
            row.metric = values[values.length - 1][1];
        } else {
            row.strategy = { long: values[0][0], short: values[values.length - 1][0] };
            const min = values[0][1], max = values[values.length - 1][1];
            row.metric = min > 0 ? ((max - min) / min) * 100 : 0;
        }
        return row;
    });
}

// --- UI HELPERS & EVENT HANDLERS ---
function initFundingToggles() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.fundingBasis = btn.dataset.basis;
            saveState(); // Sauvegarde

            if (state.rawFundingData.length > 0) {
                state.fundingData = processData(state.rawFundingData, 'apr');
                renderCurrentView();
            }
        };
    });
}

function initSidebar() {
    const container = document.getElementById('exchanges-list');
    if (!container) return;
    container.innerHTML = '';
    EXCHANGES.forEach(ex => {
        const btn = document.createElement('div');
        // Restaure l'état actif depuis le state
        const isActive = state.selectedExchanges[ex];
        btn.className = `exchange-toggle ${isActive ? 'active' : ''}`;
        btn.innerHTML = `<img src="assets/logos/${ex}.png" onerror="this.style.display='none'"> <span>${ex.toUpperCase()}</span>`;

        btn.onclick = () => {
            state.selectedExchanges[ex] = !state.selectedExchanges[ex];
            btn.classList.toggle('active');
            saveState(); // Sauvegarde
            updateVisibility();
        };
        container.appendChild(btn);
    });
}

function initTabs() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeTab = btn.dataset.tab;
            document.getElementById('funding-view').style.display = state.activeTab === 'funding' ? 'block' : 'none';
            document.getElementById('price-view').style.display = state.activeTab === 'price' ? 'block' : 'none';
            saveState(); // Sauvegarde
            renderCurrentView();
        };
    });
}

// --- SORTING ---
function initSorting() {
    const tables = ['funding-table', 'price-table'];
    tables.forEach(id => {
        const table = document.getElementById(id);
        if (!table) return;
        const headers = table.querySelectorAll('th');
        headers.forEach((th, index) => {
            if (index === 2) return;
            th.style.cursor = 'pointer';
            th.onclick = () => {
                let col = 'metric';
                if (index === 0) col = 'pair';
                else if (th.dataset.exchange) col = th.dataset.exchange;
                handleSort(col);
            };
        });
    });
}

function handleSort(col) {
    if (state.sort.column === col) state.sort.direction = state.sort.direction === 'desc' ? 'asc' : 'desc';
    else {
        state.sort.column = col;
        state.sort.direction = 'desc';
    }
    saveState(); // Sauvegarde
    renderCurrentView();
}

function getSortedData(data) {
    const { column, direction } = state.sort;
    const mod = direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
        if (column === 'pair') return a.pair.localeCompare(b.pair) * mod;
        if (column === 'metric') return ((a.metric || -9e9) - (b.metric || -9e9)) * mod;
        const valA = a.exchanges[column] ?? -9e9;
        const valB = b.exchanges[column] ?? -9e9;
        return (valA - valB) * mod;
    });
}

// --- CHARTING & RENDERING ---
function generateHistory(currentVal, type, period = '30D') {
    const pointsMap = { '24H': 24, '7D': 7, '30D': 30, 'ALL': 90 };
    const points = pointsMap[period] || 30;
    const data = [];
    let val = currentVal || 0;
    for (let i = 0; i < points; i++) {
        const noise = type === 'apr' ? 5 : 0.2;
        val = val - (Math.random() - 0.5) * noise;
        if (type === 'price' && val < 0) val = 0;
        data.unshift(val);
    }
    data.push(currentVal);
    return data;
}

function calculateStats(h) {
    if (!h.length) return { avg: 0, min: 0, max: 0 };
    const avg = h.reduce((a, b) => a + b, 0) / h.length;
    return { avg, min: Math.min(...h), max: Math.max(...h) };
}

function renderCurrentView() {
    const isFunding = state.activeTab === 'funding';
    const data = getSortedData(isFunding ? state.fundingData : state.priceData);
    const tbody = document.getElementById(isFunding ? 'funding-table-body' : 'price-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Update Header Colors
    const tableId = isFunding ? 'funding-table' : 'price-table';
    const headers = document.querySelectorAll(`#${tableId} th`);
    headers.forEach(th => th.style.color = '');
    if (state.sort.column === 'pair' && headers[0]) headers[0].style.color = '#F0E68C';
    else if (state.sort.column === 'metric' && headers[1]) headers[1].style.color = '#F0E68C';

    data.forEach(row => {
        const tr = document.createElement('tr');
        let metricLabel = `${(row.metric || 0).toFixed(2)}%`;
        let metricClass = '';
        if (isFunding) {
            if (state.fundingBasis !== 'apy') metricLabel = `${(row.metric || 0).toFixed(4)}%`;
            metricClass = row.metric < 0 ? 'text-short' : '';
        }
        tr.innerHTML = `
        <td class="col-pair has-tooltip">${row.pair}</td>
        <td class="col-metric ${metricClass} has-tooltip">${metricLabel}</td>
        <td class="col-strategy">
            <div class="strategy-cell">
                <div class="strategy-line"><span class="strategy-label">LONG</span><span class="strategy-val" onclick="event.stopPropagation(); openExchange('${row.strategy?.long}')">${row.strategy?.long || '-'}</span></div>
                <div class="strategy-line"><span class="strategy-label">SHORT</span><span class="strategy-val" onclick="event.stopPropagation(); openExchange('${row.strategy?.short}')">${row.strategy?.short || '-'}</span></div>
            </div>
        </td>
    `;
        EXCHANGES.forEach(ex => {
            const val = row.exchanges[ex];
            const td = document.createElement('td');
            if (val !== undefined && val !== null) {
                let displayVal = val;
                if (isFunding) {
                    if (state.fundingBasis === '1h') displayVal = val / 8760;
                    else if (state.fundingBasis === '8h') displayVal = val / 1095;
                    td.innerHTML = `<span class="exchange-val">${displayVal.toFixed(state.fundingBasis === 'apy' ? 2 : 4)}%</span>`;
                } else {
                    td.innerHTML = `<span class="exchange-val">$${val.toLocaleString()}</span>`;
                }
                td.style.cursor = "pointer";
                td.onclick = (e) => { e.stopPropagation(); openExchange(ex); };
            } else {
                td.innerHTML = '<span style="opacity:0.2">-</span>';
            }
            tr.appendChild(td);
        });
        tr.onclick = () => toggleDetails(row, tr, isFunding);
        tbody.appendChild(tr);
        const chartTr = document.createElement('tr');
        chartTr.className = 'chart-row';
        chartTr.id = `chart-${isFunding ? 'funding' : 'price'}-${row.pair}`;
        chartTr.innerHTML = `<td colspan="${3 + EXCHANGES.length}"><div class="inline-chart-container"></div></td>`;
        tbody.appendChild(chartTr);
    });
    updateVisibility();
}

function toggleDetails(row, tr, isFunding) {
    const chartId = `chart-${isFunding ? 'funding' : 'price'}-${row.pair}`;
    const chartRow = document.getElementById(chartId);
    if (!chartRow) return;

    if (chartRow.classList.contains('active')) {
        chartRow.classList.remove('active');
        tr.classList.remove('selected-row');
    } else {
        document.querySelectorAll('.chart-row.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('tr.selected-row').forEach(el => el.classList.remove('selected-row'));
        chartRow.classList.add('active');
        tr.classList.add('selected-row');
        renderChart(row, chartRow.querySelector('.inline-chart-container'), isFunding, '30D');
    }
}

function renderChart(row, container, isFunding, period) {
    const type = isFunding ? 'apr' : 'price';
    const history = generateHistory(row.metric, type, period);
    const stats = calculateStats(history);
    const fmt = (n) => isFunding && state.fundingBasis !== 'apy' ? n.toFixed(4) : n.toFixed(2);

    container.innerHTML = `
    <div class="inline-header">
        <div class="inline-title">${row.pair} <span style="font-size:12px; color:#666; margin-left:10px">${isFunding ? 'FUNDING HISTORY' : 'SPREAD EVOLUTION'}</span></div>
        <div class="time-filters">
            <button class="time-btn ${period == '24H' ? 'active' : ''}" data-p="24H">24H</button>
            <button class="time-btn ${period == '7D' ? 'active' : ''}" data-p="7D">7D</button>
            <button class="time-btn ${period == '30D' ? 'active' : ''}" data-p="30D">30D</button>
            <button class="time-btn ${period == 'ALL' ? 'active' : ''}" data-p="ALL">ALL</button>
            <button class="inline-close">CLOSE</button>
        </div>
    </div>
    <div class="inline-stats">
        <div class="stat-card"><div class="stat-label">CURRENT</div><div class="stat-value gold">${fmt(row.metric || 0)}%</div></div>
        <div class="stat-card"><div class="stat-label">AVG (${period})</div><div class="stat-value">${fmt(stats.avg)}%</div></div>
        <div class="stat-card"><div class="stat-label">MAX</div><div class="stat-value cyan">${fmt(stats.max)}%</div></div>
        <div class="stat-card"><div class="stat-label">MIN</div><div class="stat-value">${fmt(stats.min)}%</div></div>
    </div>
    <div class="chart-wrapper"><canvas></canvas></div>
`;
    container.querySelector('.inline-close').onclick = () => {
        container.closest('.chart-row').classList.remove('active');
        const prev = container.closest('.chart-row').previousElementSibling;
        if (prev) prev.classList.remove('selected-row');
    };
    container.querySelectorAll('.time-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); renderChart(row, container, isFunding, btn.dataset.p); }; });

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
                data: history, borderColor: '#F0E68C', backgroundColor: gradient, borderWidth: 2, pointRadius: 0, pointHoverRadius: 6, fill: true, tension: 0.4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#F0E68C', borderColor: '#333', borderWidth: 1 } },
            scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666', font: { family: 'JetBrains Mono' } } } },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

function renderSkeleton() {
    const tbody = document.getElementById(state.activeTab === 'funding' ? 'funding-table-body' : 'price-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="${3 + EXCHANGES.length}" style="padding:15px;"><div class="skeleton"></div></td>`;
        tbody.appendChild(tr);
    }
}

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
                    const count = Object.values(state.selectedExchanges).filter(Boolean).length;
                    tr.cells[0].colSpan = 3 + count;
                }
            });
        });
    });
}

function openExchange(ex) {
    if (EXCHANGE_LINKS[ex]) window.open(EXCHANGE_LINKS[ex], '_blank');
}

function updateLastUpdate() {
    const el = document.getElementById('last-update');
    if (el) el.textContent = `UPDATED: ${new Date().toLocaleTimeString()}`;
}
