/**
 * Chart Rendering Module
 * Handles Chart.js graphs and time labels
 */

import { state } from '../state.js';
import { generateHistory, calculateStats } from '../logic.js';
import { formatElastic } from '../utils.js';

/**
 * Renders Chart.js graph or "No Historical Data" message
 */
export function renderChart(row, container, isFunding, period) {
    const type = isFunding ? 'apr' : 'price';
    const history = generateHistory(row.metric, type, period);

    // No historical data available - show message
    if (!history || history.length === 0) {
        container.innerHTML = `
        <div class="inline-header">
            <div class="inline-title">${row.pair} <span style="font-size:12px; color:#666; margin-left:10px">${isFunding ? 'FUNDING HISTORY' : 'SPREAD EVOLUTION'}</span></div>
            <div class="time-filters">
                <button class="inline-close">CLOSE</button>
            </div>
        </div>
        <div class="no-history-message">
            <div class="no-history-icon">📊</div>
            <div class="no-history-text">No Historical Data Available</div>
            <div class="no-history-subtext">Historical charts will be available when API provides time-series data</div>
        </div>
        `;

        container.querySelector('.inline-close').onclick = () => {
            container.closest('.chart-row').classList.remove('active');
            document.querySelectorAll('tr.selected-row').forEach(el => el.classList.remove('selected-row'));
        };
        return;
    }

    // Has historical data - render chart
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
    gradient.addColorStop(0, 'rgba(60, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(60, 130, 246, 0)');

    const labels = generateTimeLabels(period, history.length);

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: isFunding ? 'APR %' : 'Spread %',
                data: history,
                borderColor: '#3C82F6',
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

/**
 * Generates time labels for chart X-axis
 */
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
