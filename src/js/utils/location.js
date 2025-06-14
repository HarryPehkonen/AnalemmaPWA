/**
 * Location Utilities Module
 * Handles geolocation permissions, location storage, and coordinate management
 */

/**
 * Location permission states
 */
const LocationPermissionState = {
    UNKNOWN: 'unknown',
    GRANTED: 'granted', 
    DENIED: 'denied',
    PROMPT: 'prompt'
};

/**
 * Storage key for saved location
 */
const LOCATION_STORAGE_KEY = 'analemma_location';

/**
 * Check if geolocation is supported
 * @returns {boolean} True if geolocation is supported
 */
function isGeolocationSupported() {
    return 'geolocation' in navigator;
}

/**
 * Check if we're in a secure context for geolocation
 * @returns {Object} Security context information
 */
function getSecurityContext() {
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const isHttps = location.protocol === 'https:';
    const isSecure = isLocalhost || isHttps;
    
    return {
        isSecure,
        isLocalhost,
        isHttps,
        protocol: location.protocol,
        hostname: location.hostname,
        message: isSecure ? 'Secure context - geolocation should work' : 'Insecure context - geolocation may be blocked'
    };
}

/**
 * Get current location permission state
 * @returns {Promise<string>} Permission state
 */
async function getLocationPermissionState() {
    try {
        if (!navigator.permissions) {
            return LocationPermissionState.UNKNOWN;
        }
        
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state;
    } catch (error) {
        console.warn('Could not check location permission:', error);
        return LocationPermissionState.UNKNOWN;
    }
}

/**
 * Request location permission and get coordinates
 * @param {Object} options Geolocation options
 * @returns {Promise<Object>} Location object with latitude, longitude, and timestamp
 */
function requestLocation(options = {}) {
    return new Promise((resolve, reject) => {
        if (!isGeolocationSupported()) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        const defaultOptions = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        const finalOptions = { ...defaultOptions, ...options };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
                
                // Save location to localStorage for offline use
                saveLocationToStorage(location);
                
                resolve(location);
            },
            (error) => {
                console.error('Geolocation error:', error);
                
                let errorMessage;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        // Check if it's due to insecure context
                        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                            errorMessage = 'Location access requires HTTPS when not on localhost. Please use HTTPS or test on localhost.';
                        } else {
                            errorMessage = 'Location access denied by user';
                        }
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred while retrieving location';
                        break;
                }
                
                reject(new Error(errorMessage));
            }, 
            finalOptions
        );
    });
}

/**
 * Save location to localStorage
 * @param {Object} location Location object
 */
function saveLocationToStorage(location) {
    try {
        const locationData = {
            ...location,
            savedAt: Date.now()
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
        console.log('Location saved to localStorage');
    } catch (error) {
        console.warn('Could not save location to localStorage:', error);
    }
}

/**
 * Get saved location from localStorage
 * @returns {Object|null} Saved location or null if not found/expired
 */
function getSavedLocation() {
    try {
        const savedData = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (!savedData) {
            return null;
        }

        const location = JSON.parse(savedData);
        
        // Check if location is still fresh (less than 24 hours old)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const age = Date.now() - location.savedAt;
        
        if (age > maxAge) {
            console.log('Saved location is too old, removing from storage');
            localStorage.removeItem(LOCATION_STORAGE_KEY);
            return null;
        }

        return location;
    } catch (error) {
        console.warn('Could not retrieve saved location:', error);
        return null;
    }
}

/**
 * Clear saved location from storage
 */
function clearSavedLocation() {
    try {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
        console.log('Saved location cleared');
    } catch (error) {
        console.warn('Could not clear saved location:', error);
    }
}

/**
 * Get location with fallback to saved location
 * @param {boolean} forceRefresh Force a new location request
 * @returns {Promise<Object>} Location object
 */
async function getLocation(forceRefresh = false) {
    // Try to get fresh location first if not forced to use saved
    if (!forceRefresh) {
        try {
            const permissionState = await getLocationPermissionState();
            if (permissionState === LocationPermissionState.GRANTED) {
                // Try to get fresh location
                return await requestLocation();
            }
        } catch (error) {
            console.log('Could not get fresh location, trying saved location');
        }
    }

    // Fallback to saved location
    const savedLocation = getSavedLocation();
    if (savedLocation) {
        console.log('Using saved location');
        return savedLocation;
    }

    // No location available
    throw new Error('No location available');
}

/**
 * Format location for display
 * @param {Object} location Location object
 * @returns {string} Formatted location string
 */
function formatLocationForDisplay(location) {
    const lat = location.latitude.toFixed(4);
    const lng = location.longitude.toFixed(4);
    const latDir = location.latitude >= 0 ? 'N' : 'S';
    const lngDir = location.longitude >= 0 ? 'E' : 'W';
    
    return `${Math.abs(lat)}°${latDir}, ${Math.abs(lng)}°${lngDir}`;
}

/**
 * Get location accuracy description
 * @param {number} accuracy Accuracy in meters
 * @returns {string} Human-readable accuracy description
 */
function getAccuracyDescription(accuracy) {
    if (!accuracy) return 'Unknown accuracy';
    
    if (accuracy < 10) return 'Very precise';
    if (accuracy < 50) return 'Precise';
    if (accuracy < 100) return 'Good';
    if (accuracy < 500) return 'Moderate';
    return 'Low precision';
}

// Export functions for use in other modules
window.LocationUtils = {
    LocationPermissionState,
    isGeolocationSupported,
    getSecurityContext,
    getLocationPermissionState,
    requestLocation,
    saveLocationToStorage,
    getSavedLocation,
    clearSavedLocation,
    getLocation,
    formatLocationForDisplay,
    getAccuracyDescription
}; 