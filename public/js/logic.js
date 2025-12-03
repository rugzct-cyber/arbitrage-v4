/**
 * Business Logic Functions
 */

import { state } from './state.js';

/**
 * Processes raw API data into a structured format for the table.
 * @param {Array|Object} rawData - The raw API response
 * @param {string} metricKey - 'apr' or 'price'
 * @returns {Array} Processed data array
 */
export function processData(rawData, metricKey) {
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
            const min = values[0][1];
            const max = values[values.length - 1][1];
            row.metric = min > 0 ? ((max - min) / min) * 100 : 0;
        }
        return row;
    });
}

/**
 * Generates simulated historical data for charting
 * @param {number} currentVal - Current metric value
 * @param {string} type - 'apr' or 'price'
 * @param {string} period - '24H', '7D', '30D', or 'ALL'
 * @returns {Array} Historical data points
 */
export function generateHistory(currentVal, type, period = '30D') {
    let points = 30;
    let volatility = 1;

    if (period === '24H') { points = 24; volatility = 0.5; }
    if (period === '7D') { points = 7; volatility = 0.8; }
    if (period === '30D') { points = 30; volatility = 1; }
    if (period === 'ALL') { points = 90; volatility = 1.5; }

    const data = [];
    let val = currentVal || 0;

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
 * Calculates statistics from historical data
 * @param {Array} history - Array of numerical values
 * @returns {Object} { avg, min, max }
 */
export function calculateStats(history) {
    if (!history || history.length === 0) return { avg: 0, min: 0, max: 0 };
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    const min = Math.min(...history);
    const max = Math.max(...history);
    return { avg, min, max };
}

/**
 * Returns sorted copy of data based on current sort state
 * @param {Array} data - Data array to sort
 * @returns {Array} Sorted data
 */
export function getSortedData(data) {
    const { column, direction } = state.sort;
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
        let valA, valB;
        if (column === 'pair') {
            valA = a.pair;
            valB = b.pair;
            return valA.localeCompare(valB) * multiplier;
        } else if (column === 'metric') {
            valA = a.metric || -Infinity;
            valB = b.metric || -Infinity;
        } else {
            valA = a.exchanges[column] ?? -Infinity;
            valB = b.exchanges[column] ?? -Infinity;
        }
        return (valA - valB) * multiplier;
    });
}
