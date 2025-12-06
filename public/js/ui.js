/**
 * UI Module Orchestrator
 * Re-exports all UI functions from specialized modules
 * Maintains backward compatibility with app.js
 */

// Re-export from render module
export { renderSkeleton, renderCurrentView, updateVisibility } from './modules/render.js';

// Charts module is now loaded dynamically in events.js on first click

// Re-export from events module
export { initTableEvents, toggleDetails } from './modules/events.js';

// Re-export from controls module
export {
    initSidebar,
    initTabs,
    initFundingToggles,
    initSorting,
    handleSort,
    updateLastUpdate,
    initSearch
} from './modules/controls.js';

// Global compatibility
import { openExchange } from './utils.js';
window.openExchangeGlobal = openExchange;
