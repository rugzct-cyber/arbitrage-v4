// src/services/historicalData.js

const { createClient } = require('@supabase/supabase-js');

// Supabase client initialization (must be present in the environment)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/**
 * Utility function to calculate spread/max-min for a given timestamp
 * Logic inspired by client-side strategy calculation.
 */
function calculateMetric(items, type) {
    if (items.length < 2) return null;

    // Sort by value ascending
    const sorted = items.sort((a, b) => a.value - b.value);

    const min = sorted[0].value;
    const max = sorted[sorted.length - 1].value;

    if (type === 'apr') {
        // APR: Max - Min
        return max - min;
    } else {
        // Price: ((Max - Min) / Min) * 100
        return min > 0
            ? ((max - min) / min) * 100
            : 0;
    }
}


/**
 * Fetches and aggregates historical data from Supabase
 * @param {string} pair - Trading pair (e.g., 'BTC')
 * @param {string} type - 'apr' or 'price'
 * @param {string} period - '24H', '7D', '30D', 'ALL'
 * @returns {Object} { success, history: Array<number> }
 */
async function getHistoryForPair(pair, type, period) {
    if (!supabase) {
        console.error("[HISTORY] Supabase client is not initialized.");
        return { success: false, history: [] };
    }

    const metricColumn = type === 'apr' ? 'apr' : 'price';
    let timeFilter = new Date();

    // Determine time range for the WHERE clause
    if (period === '24H') timeFilter.setHours(timeFilter.getHours() - 24);
    else if (period === '7D') timeFilter.setDate(timeFilter.getDate() - 7);
    else if (period === '30D') timeFilter.setDate(timeFilter.getDate() - 30);
    // 'ALL' remains open (no time filter)

    // 1. Fetching all raw points for the pair and period
    let query = supabase
        .from('market_history')
        .select(`timestamp, exchange, ${metricColumn}`)
        .eq('pair', pair);

    if (period !== 'ALL') {
        query = query.gte('timestamp', timeFilter.toISOString());
    }

    const { data, error } = await query
        .order('timestamp', { ascending: true });

    if (error) {
        console.error("[HISTORY] Error fetching historical data:", error.message);
        return { success: false, history: [] };
    }

    if (!data || data.length === 0) {
        return { success: true, history: [] };
    }

    // 2. Group data by Timestamp
    const groupedByTime = new Map();
    data.forEach(item => {
        // Use raw millisecond for grouping key
        const key = new Date(item.timestamp).getTime();

        if (!groupedByTime.has(key)) {
            groupedByTime.set(key, []);
        }

        groupedByTime.get(key).push({
            exchange: item.exchange,
            value: item[metricColumn],
        });
    });

    // 3. Calculate the Metric (Spread/Max-Min) for each timestamp group
    const history = [];
    // Sort keys (timestamps) to ensure chronological order
    const sortedTimestamps = Array.from(groupedByTime.keys()).sort((a, b) => a - b);

    sortedTimestamps.forEach(key => {
        const items = groupedByTime.get(key);
        // Only calculate if there are at least two exchanges (arbitrage minimum)
        if (items.length >= 2) {
            const metricValue = calculateMetric(items, type);
            if (metricValue !== null) {
                history.push(metricValue);
            }
        }
    });

    return {
        success: true,
        pair: pair,
        type: type,
        period: period,
        // Array of metric values for Chart.js
        history: history,
    };
}

module.exports = { getHistoryForPair };
