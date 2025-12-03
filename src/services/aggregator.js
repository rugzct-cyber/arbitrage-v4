const fs = require('fs');
const path = require('path');
const adaptersPath = path.join(__dirname, '../adapters');
const adapters = {};

// Chargement dynamique
fs.readdirSync(adaptersPath).forEach(file => {
    if (file === 'base.adapter.js' || !file.endsWith('.js')) return;
    try {
        const adapter = require(path.join(adaptersPath, file));
        if (adapter.name) adapters[adapter.name] = adapter;
    } catch (e) { console.error("Failed to load adapter", file); }
});

async function getAllMarketData() {
    const promises = Object.values(adapters).map(async (adapter) => {
        try {
            return await adapter.getGlobalData();
        } catch (error) { return []; }
    });
    const results = await Promise.all(promises);
    return results.flat();
}
module.exports = { getAllMarketData };
