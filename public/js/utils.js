/**
 * Utility Functions
 */

import { EXCHANGE_LINKS } from './config.js';

export function openExchange(ex) {
    if (EXCHANGE_LINKS[ex]) window.open(EXCHANGE_LINKS[ex], '_blank');
}

export function updateLastUpdate() {
    const el = document.getElementById('last-update');
    if (el) el.textContent = `UPDATED: ${new Date().toLocaleTimeString()}`;
}

export function formatElastic(val, type = 'price') {
    if (val === undefined || val === null) return '-';
    const num = Number(val);
    if (isNaN(num)) return '-';
    if (num === 0) return '0.00';

    if (type === 'apr') {
        return num.toFixed(2);
    }

    // Elastic Price Logic
    const abs = Math.abs(num);
    if (abs < 0.01) return num.toFixed(6);
    if (abs < 1) return num.toFixed(4);
    if (abs < 10) return num.toFixed(3);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
