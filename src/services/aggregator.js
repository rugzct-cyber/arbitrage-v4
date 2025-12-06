// src/services/aggregator.js

/**
 * AGGREGATOR SERVICE V4 (Serverless Optimized)
 * - No local cache (bad for serverless - resets each request)
 * - Enhanced error handling with status per exchange
 */

// 1. ADD SUPABASE IMPORT (REQUIRED FOR PHASE 2)
const { createClient } = require('@supabase/supabase-js');

// --- SUPABASE CLIENT INITIALIZATION ---
// NOTE: These environment variables must be set in your .env file or Vercel settings.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Initialize Supabase Client (Only if keys are present)
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;
// ------------------------------------

// Static imports (required for Vercel bundling)
const adapters = {
    hyperliquid: require('../adapters/hyperliquid'),
    paradex: require('../adapters/paradex'),
    vest: require('../adapters/vest'),
    extended: require('../adapters/extended'),
    lighter: require('../adapters/lighter'),
    hibachi: require('../adapters/hibachi'),
    aster: require('../adapters/aster'),
    pacifica: require('../adapters/pacifica'),
    xyz: require('../adapters/xyz')
};

// --- CONFIGURATION ---
const API_TIMEOUT = 10000; // 10 seconds - allows WebSocket adapters to complete

/**
 * Fetches market data from all exchanges
 * @returns {Object} { data: Array, status: Object }
 */
async function getAllMarketData() {
    const exchangeStatus = {};

    const promises = Object.entries(adapters).map(async ([name, adapter]) => {
        const startTime = Date.now();
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), API_TIMEOUT)
            );

            const data = await Promise.race([adapter.getGlobalData(), timeoutPromise]);
            const duration = Date.now() - startTime;

            exchangeStatus[name] = {
                success: true,
                count: data.length,
                duration
            };

            return data;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.warn(`[AGGREGATOR] ${name} failed: ${error.message} (${duration}ms)`);

            exchangeStatus[name] = {
                success: false,
                error: error.message,
                duration
            };

            return [];
        }
    });

    const results = await Promise.all(promises);
    const flatResults = results.flat();

    // 2. NEW LOGIC: BATCH INSERT INTO SUPABASE
    if (supabase && flatResults.length > 0) {
        const dataToInsert = flatResults.map(item => ({
            timestamp: new Date().toISOString(), // Use ISO string for TIMESTAMPZ type
            pair: item.pair,
            exchange: item.exchange,
            price: item.price,
            funding_rate: item.fundingRate,
            apr: item.apr,
        }));

        // Insertion in bulk
        const { error } = await supabase
            .from('market_history') // Use the table name created in Supabase
            .insert(dataToInsert);

        if (error) {
            // Log Supabase error but do not fail the main API call
            console.error("[SUPABASE] Error inserting historical data:", error.message);
        }
    }
    // ------------------------------------

    return {
        data: flatResults,
        status: exchangeStatus,
        timestamp: Date.now()
    };
}

module.exports = { getAllMarketData };
