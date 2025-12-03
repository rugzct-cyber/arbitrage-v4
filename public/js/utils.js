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
