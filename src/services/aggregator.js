const fs = require('fs');
const path = require('path');
const adaptersPath = path.join(__dirname, '../adapters');
const adapters = {};

// Chargement dynamique des adaptateurs
fs.readdirSync(adaptersPath).forEach(file => {
    if (file === 'base.adapter.js' || !file.endsWith('.js')) return;
    try {
        const adapter = require(path.join(adaptersPath, file));
        if (adapter.name) adapters[adapter.name] = adapter;
    } catch (e) {
        console.error("Failed to load adapter", file);
    }
});

// --- SYSTÈME DE CACHE ---
let cache = { data: [], lastFetch: 0 };

const CACHE_DURATION = 15 * 1000; // 15 secondes de cache (ajustable)

async function getAllMarketData() {
    const now = Date.now();

    // 1. Si le cache est encore frais, on le renvoie instantanément (0ms de latence)
    if (cache.data.length > 0 && (now - cache.lastFetch < CACHE_DURATION)) {
        return cache.data;
    }

    // 2. Sinon, on rafraîchit les données
    console.log(`[AGGREGATOR] Refreshing data from ${Object.keys(adapters).length} exchanges...`);

    const promises = Object.values(adapters).map(async (adapter) => {
        try {
            // Timeout de sécurité : si un exchange met > 3s, on l'ignore pour ne pas bloquer le site
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 3000)
            );

            return await Promise.race([adapter.getGlobalData(), timeoutPromise]);
        } catch (error) {
            console.warn(`[WARNING] Failed to fetch ${adapter.name}: ${error.message}`);
            return [];
        }
    });

    const results = await Promise.all(promises);
    const flatResults = results.flat();

    // Mise à jour du cache seulement si on a récupéré des données
    if (flatResults.length > 0) {
        cache.data = flatResults;
        cache.lastFetch = now;
    }
    return cache.data;
}

module.exports = { getAllMarketData };
