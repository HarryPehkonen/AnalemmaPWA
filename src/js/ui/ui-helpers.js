/**
 * UI Helper Functions
 * Thin layer for DOM updates, uses pure logic from status-logic.js
 */

/**
 * Update location status indicator in the DOM
 * @param {Object} statusElement - DOM element for location status
 * @param {Object} status - Status object from getLocationStatus
 */
function updateLocationStatusUI(statusElement, status) {
    if (!statusElement) return;
    
    statusElement.className = status.class;
    const textElement = statusElement.querySelector('.status-text');
    if (textElement) {
        textElement.textContent = status.text;
    }
}

/**
 * Update online status indicator in the DOM
 * @param {Object} statusElement - DOM element for online status
 * @param {Object} status - Status object from getOnlineStatus
 */
function updateOnlineStatusUI(statusElement, status) {
    if (!statusElement) return;
    
    statusElement.className = status.class;
    const textElement = statusElement.querySelector('.status-text');
    if (textElement) {
        textElement.textContent = status.text;
    }
}

/**
 * Show a specific screen and hide all others
 * @param {Object} screens - Object mapping screen names to DOM elements
 * @param {string} screenToShow - Name of screen to show
 */
function showScreen(screens, screenToShow) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.add('hidden');
        }
    });
    
    // Show the requested screen
    if (screens[screenToShow]) {
        screens[screenToShow].classList.remove('hidden');
    }
}

/**
 * Update loading screen message
 * @param {Object} loadingElement - Loading screen DOM element
 * @param {string} message - Message to display
 */
function updateLoadingMessage(loadingElement, message) {
    if (!loadingElement) return;
    
    const textElement = loadingElement.querySelector('p');
    if (textElement) {
        textElement.textContent = message;
    }
}

/**
 * Update error screen with message
 * @param {Object} errorElement - Error screen DOM element
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function updateErrorMessage(errorElement, title, message) {
    if (!errorElement) return;
    
    const titleElement = errorElement.querySelector('.error-content h2');
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    const messageElement = errorElement.querySelector('.error-content p');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateLocationStatusUI,
        updateOnlineStatusUI,
        showScreen,
        updateLoadingMessage,
        updateErrorMessage
    };
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.UIHelpers = {
        updateLocationStatusUI,
        updateOnlineStatusUI,
        showScreen,
        updateLoadingMessage,
        updateErrorMessage
    };
} 