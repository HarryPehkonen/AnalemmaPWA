/**
 * Pure business logic for status calculations
 * No DOM dependencies, fully testable
 */

/**
 * Determine location status based on location data and permission state
 * @param {Object|null} location - Location object with latitude, longitude, timestamp
 * @param {string} permissionState - 'granted', 'denied', 'prompt', or null
 * @param {number} currentTime - Current timestamp for comparison
 * @returns {Object} Status object with class and text
 */
function getLocationStatus(location, permissionState, currentTime = Date.now()) {
    if (!location) {
        if (permissionState === 'denied') {
            return {
                class: 'status-indicator denied',
                text: 'Location Access Denied'
            };
        }
        return {
            class: 'status-indicator error',
            text: 'Location Error'
        };
    }

    // Check if location is fresh (less than 5 minutes old)
    const locationAge = currentTime - (location.timestamp || 0);
    const isFresh = locationAge < 5 * 60 * 1000; // 5 minutes

    if (permissionState === 'granted' && isFresh) {
        return {
            class: 'status-indicator current',
            text: 'Current Location'
        };
    }

    return {
        class: 'status-indicator cached',
        text: 'Cached Location'
    };
}

/**
 * Determine online status based on connectivity check result
 * @param {boolean} isOnline - Whether the device has network connectivity
 * @returns {Object} Status object with class and text
 */
function getOnlineStatus(isOnline) {
    return {
        class: `status-indicator ${isOnline ? 'online' : 'offline'}`,
        text: isOnline ? 'Online' : 'Offline'
    };
}

/**
 * Calculate which screen should be shown based on app state
 * @param {Object} state - Application state
 * @returns {string} Screen name to show
 */
function getActiveScreen(state) {
    const { isLoading, location, permissionState, hasError, errorMessage } = state;

    if (isLoading) {
        return 'loading';
    }

    if (hasError && !location) {
        return 'error';
    }

    if (location) {
        return 'main';
    }

    if (permissionState === 'denied') {
        return 'denied';
    }

    return 'prompt';
}

/**
 * Determine if location is from cache or current
 * @param {Object} location - Location object
 * @param {string} permissionState - Permission state
 * @param {number} currentTime - Current timestamp
 * @returns {string} 'current' or 'cached'
 */
function getLocationSource(location, permissionState, currentTime = Date.now()) {
    if (!location) return 'none';
    
    const locationAge = currentTime - (location.timestamp || 0);
    const isFresh = locationAge < 5 * 60 * 1000; // 5 minutes

    return (permissionState === 'granted' && isFresh) ? 'current' : 'cached';
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getLocationStatus,
        getOnlineStatus,
        getActiveScreen,
        getLocationSource
    };
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.StatusLogic = {
        getLocationStatus,
        getOnlineStatus,
        getActiveScreen,
        getLocationSource
    };
} 