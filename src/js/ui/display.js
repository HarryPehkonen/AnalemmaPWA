/**
 * Display Utilities Module
 * Helper functions for UI display and formatting
 */

/**
 * Format numbers for display with proper precision
 * @param {number} num Number to format
 * @param {number} decimals Number of decimal places
 * @returns {string} Formatted number string
 */
function formatNumber(num, decimals = 2) {
    return num.toFixed(decimals);
}

/**
 * Format coordinates for display
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {string} Formatted coordinate string
 */
function formatCoordinates(lat, lng) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

/**
 * Show/hide elements with smooth transition
 * @param {HTMLElement} element Element to toggle
 * @param {boolean} show Whether to show or hide
 */
function toggleElement(element, show) {
    if (show) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Add loading state to button
 * @param {HTMLElement} button Button element
 * @param {boolean} loading Whether to show loading state
 */
function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Grant Location Access';
    }
}

// Export functions for use in other modules
window.DisplayUtils = {
    formatNumber,
    formatCoordinates,
    toggleElement,
    setButtonLoading
}; 