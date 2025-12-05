/**
 * Business Logic Functions
 * Refactored with modular design, Map-based grouping, and clean sorting
 */

import { state } from './state.js';

// ============================================================================
// PHASE 1: GROUPING
// ============================================================================

/**
 * Groups raw API data by pair using Map for better performance
 * @param {Array|Object} rawData - Raw API response
 * @param {string} metricKey - 'apr' or 'price'
 * @returns {Map} Map of pair -> { pair, exchanges: Map }
 */
function groupByPair(rawData, metricKey) {
    const pairMap = new Map();
    const list = Array.isArray(rawData) ? rawData : (rawData.data || []);

    for (const item of list) {
        if (!pairMap.has(item.pair)) {
            pairMap.set(item.pair, {
                pair: item.pair,
                exchanges: new Map()
            });
        }

        let val = metricKey === 'apr' ? item.apr : item.price;

        // Apply funding basis conversion for APR
        if (metricKey === 'apr' && !state.showAverage) {
            if (state.fundingBasis === '8h') val = val / 1095;
            if (state.fundingBasis === '1h') val = val / 8760;
        }

        pairMap.get(item.pair).exchanges.set(item.exchange, val);
    }

    return pairMap;
}

// ============================================================================
// PHASE 2: STRATEGY CALCULATION
// ============================================================================

/**
 * Calculates arbitrage strategy from exchange values
 * @param {Map} exchangesMap - Map of exchange -> value
 * @param {string} metricKey - 'apr' or 'price'
 * @returns {Object} { metric, strategy, validEntries }
 */
function calculateStrategy(exchangesMap, metricKey) {
    // Filter to only visible/selected exchanges with valid values
    const validEntries = [];

    for (const [exchange, value] of exchangesMap) {
        if (state.selectedExchanges[exchange] && value != null) {
            validEntries.push([exchange, value]);
        }
    }

    // Default result for insufficient data
    const defaultResult = {
        metric: 0,
        strategy: { long: '-', short: '-' },
        validEntries
    };

    if (validEntries.length < 2) {
        return {
            ...defaultResult,
            strategy: {
                long: validEntries[0]?.[0] || '-',
                short: '-'
            }
        };
    }

    // Sort by value ascending (min first, max last)
    validEntries.sort((a, b) => a[1] - b[1]);

    const minEntry = validEntries[0];
    const maxEntry = validEntries[validEntries.length - 1];

    // Calculate metric based on type
    let metric;
    if (metricKey === 'apr') {
        // APR: Max - Min (Long lowest, Short highest)
        metric = maxEntry[1] - minEntry[1];
    } else {
        // Price: ((Max - Min) / Min) * 100
        metric = minEntry[1] > 0
            ? ((maxEntry[1] - minEntry[1]) / minEntry[1]) * 100
            : 0;
    }

    return {
        metric,
        strategy: {
            long: minEntry[0],
            short: maxEntry[0]
        },
        validEntries
    };
}

// ============================================================================
// MAIN EXPORTS
// ============================================================================

/**
 * Processes raw API data into structured format for table display
 * @param {Array|Object} rawData - Raw API response
 * @param {string} metricKey - 'apr' or 'price'
 * @returns {Array} Processed data array with strategy calculations
 */
export function processData(rawData, metricKey) {
    // Phase 1: Group data by pair
    const pairMap = groupByPair(rawData, metricKey);

    // Phase 2: Calculate strategy for each pair
    const result = [];

    for (const [pair, data] of pairMap) {
        const { metric, strategy } = calculateStrategy(data.exchanges, metricKey);

        // Convert exchanges Map to Object for compatibility
        const exchangesObj = {};
        for (const [ex, val] of data.exchanges) {
            exchangesObj[ex] = val;
        }

        // Data quality check: flag suspicious spreads
        const WARNING_THRESHOLD_PRICE = 10;   // 10% spread
        const WARNING_THRESHOLD_APR = 500;    // 500% APR difference
        const threshold = metricKey === 'apr' ? WARNING_THRESHOLD_APR : WARNING_THRESHOLD_PRICE;
        const warning = Math.abs(metric) > threshold;

        result.push({
            pair,
            exchanges: exchangesObj,
            metric,
            strategy,
            warning
        });
    }

    return result;
}

/**
 * Returns sorted copy of data based on current sort state
 * Implements "Nulls Last" strategy: null/undefined always at bottom
 * @param {Array} data - Data array to sort
 * @returns {Array} Sorted data copy
 */
export function getSortedData(data) {
    const { column, direction } = state.sort;
    const isAsc = direction === 'asc';

    return [...data].sort((a, b) => {
        // Get values based on column
        const valA = column === 'pair' ? a.pair
            : column === 'metric' ? a.metric
                : a.exchanges[column];

        const valB = column === 'pair' ? b.pair
            : column === 'metric' ? b.metric
                : b.exchanges[column];

        // Nulls-last: push null/undefined to bottom regardless of direction
        const isValidA = valA != null;
        const isValidB = valB != null;

        if (!isValidA && !isValidB) return 0;
        if (!isValidA) return 1;  // A is null -> goes to bottom
        if (!isValidB) return -1; // B is null -> goes to bottom

        // String comparison for pair column
        if (column === 'pair') {
            return isAsc
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }

        // Numeric comparison for other columns
        return isAsc ? valA - valB : valB - valA;
    });
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Returns historical data for charting
 * NOTE: Returns null until real API provides historical data
 * @param {number} currentVal - Current metric value (unused)
 * @param {string} type - 'apr' or 'price' (unused)
 * @param {string} period - '24H', '7D', '30D', or 'ALL' (unused)
 * @param {Array} realHistory - Real historical data from API
 * @returns {Array|null} Historical data or null
 */
export function generateHistory(currentVal, type, period = '30D', realHistory = null) {
    return (realHistory && realHistory.length > 0) ? realHistory : null;
}

/**
 * Calculates statistics from historical data
 * @param {Array} history - Array of numerical values
 * @returns {Object} { avg, min, max }
 */
export function calculateStats(history) {
    if (!history?.length) {
        return { avg: 0, min: 0, max: 0 };
    }

    const sum = history.reduce((a, b) => a + b, 0);

    return {
        avg: sum / history.length,
        min: Math.min(...history),
        max: Math.max(...history)
    };
}
