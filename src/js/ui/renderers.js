/**
 * Pure UI Rendering Functions
 * These functions take state and return data objects for rendering
 * No DOM manipulation, just data transformation
 */

// Import StatusLogic for calculations
const StatusLogic = (typeof window !== 'undefined' && window.StatusLogic) || 
                   (typeof require !== 'undefined' && require('../core/status-logic.js'));

/**
 * Render location status data
 * @param {Object} state Application state
 * @returns {Object} Status rendering data
 */
function renderLocationStatus(state) {
    const status = StatusLogic.getLocationStatus(
        state.location,
        state.permissionState,
        Date.now()
    );
    return {
        className: status.class,
        text: status.text
    };
}

/**
 * Render online status data
 * @param {Object} state Application state
 * @returns {Object} Status rendering data
 */
function renderOnlineStatus(state) {
    const status = StatusLogic.getOnlineStatus(state.isOnline);
    return {
        className: status.class,
        text: status.text
    };
}

/**
 * Determine which screen should be active
 * @param {Object} state Application state
 * @returns {string} Active screen name
 */
function renderActiveScreen(state) {
    return StatusLogic.getActiveScreen(state);
}

/**
 * Render loading message
 * @param {Object} state Application state
 * @returns {string|null} Loading message or null
 */
function renderLoadingMessage(state) {
    if (!state.isLoading) return null;
    
    if (state.loadingMessage) return state.loadingMessage;
    
    // Default messages based on context
    if (!state.location && !state.permissionState) {
        return 'Checking location permissions...';
    }
    if (!state.location) {
        return 'Getting your location...';
    }
    return 'Loading...';
}

/**
 * Render error message data
 * @param {Object} state Application state
 * @returns {Object|null} Error rendering data or null
 */
function renderErrorMessage(state) {
    if (!state.hasError || !state.errorMessage) return null;
    
    return {
        title: 'An error occurred',
        message: state.errorMessage,
        showRetry: !state.location
    };
}

/**
 * Render location info text
 * @param {Object} location Location object
 * @param {number} accuracy Accuracy in meters
 * @returns {Object} Location info rendering data
 */
function renderLocationInfo(location, accuracy) {
    if (!location) return { text: '', accuracy: '' };
    
    const latDir = location.latitude >= 0 ? 'N' : 'S';
    const lngDir = location.longitude >= 0 ? 'E' : 'W';
    const locationText = `${Math.abs(location.latitude).toFixed(4)}°${latDir}, ${Math.abs(location.longitude).toFixed(4)}°${lngDir}`;
    
    let accuracyText = '';
    if (accuracy) {
        if (accuracy < 50) accuracyText = 'High accuracy';
        else if (accuracy < 200) accuracyText = 'Medium accuracy';
        else accuracyText = 'Low accuracy';
    }
    
    return {
        text: locationText,
        accuracy: accuracyText
    };
}

/**
 * Render extreme latitude warning
 * @param {Object} state Application state
 * @param {boolean} isExtreme Whether sun is below horizon at noon
 * @returns {Object} Warning rendering data
 */
function renderExtremeLatitudeWarning(state, isExtreme) {
    return {
        show: isExtreme,
        message: 'At this latitude, the sun may not be visible at solar noon during parts of the year.',
        className: isExtreme ? 'extreme-latitude' : ''
    };
}

/**
 * Render all UI state from application state
 * @param {Object} state Application state
 * @returns {Object} Complete UI rendering data
 */
function renderUI(state) {
    return {
        activeScreen: renderActiveScreen(state),
        locationStatus: renderLocationStatus(state),
        onlineStatus: renderOnlineStatus(state),
        loadingMessage: renderLoadingMessage(state),
        errorMessage: renderErrorMessage(state),
        locationInfo: state.location ? renderLocationInfo(state.location, state.location.accuracy) : null
    };
}

// Export functions
const Renderers = {
    renderLocationStatus,
    renderOnlineStatus,
    renderActiveScreen,
    renderLoadingMessage,
    renderErrorMessage,
    renderLocationInfo,
    renderExtremeLatitudeWarning,
    renderUI
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderers;
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.Renderers = Renderers;
} 