/**
 * Location Service
 * Manages location acquisition, caching, and permissions
 */

// Import dependencies
const { NavigatorService, StorageService } = (typeof window !== 'undefined' && window.BrowserServices) || 
                                             (typeof require !== 'undefined' && require('./browser-services.js'));

class LocationService {
    constructor(dependencies = {}) {
        this.navigator = dependencies.navigator || new NavigatorService();
        this.storage = dependencies.storage || new StorageService();
        this.locationKey = 'saved_location';
    }

    /**
     * Request location from user
     * @returns {Promise<Object>} Location object
     */
    async requestLocation() {
        const location = await this.navigator.getPosition();
        
        // Save to storage
        this.saveLocation(location);
        
        return location;
    }

    /**
     * Get location permission state
     * @returns {Promise<string>} Permission state
     */
    async getPermissionState() {
        return await this.navigator.getLocationPermissionState();
    }

    /**
     * Get saved location from storage
     * @returns {Object|null} Saved location or null
     */
    getSavedLocation() {
        const saved = this.storage.load(this.locationKey);
        
        // Validate saved location
        if (saved && this.isValidLocation(saved)) {
            return saved;
        }
        
        return null;
    }

    /**
     * Save location to storage
     * @param {Object} location Location to save
     * @returns {boolean} Success status
     */
    saveLocation(location) {
        if (!this.isValidLocation(location)) {
            return false;
        }
        
        return this.storage.save(this.locationKey, location);
    }

    /**
     * Clear saved location
     * @returns {boolean} Success status
     */
    clearSavedLocation() {
        return this.storage.remove(this.locationKey);
    }

    /**
     * Validate location object
     * @param {Object} location Location to validate
     * @returns {boolean} Is valid
     */
    isValidLocation(location) {
        return !!(location &&
               typeof location.latitude === 'number' &&
               typeof location.longitude === 'number' &&
               location.latitude >= -90 && location.latitude <= 90 &&
               location.longitude >= -180 && location.longitude <= 180);
    }

    /**
     * Format location for display
     * @param {Object} location Location object
     * @returns {string} Formatted location string
     */
    formatLocationForDisplay(location) {
        if (!location) return '';
        
        const latDir = location.latitude >= 0 ? 'N' : 'S';
        const lngDir = location.longitude >= 0 ? 'E' : 'W';
        
        return `${Math.abs(location.latitude).toFixed(1)}°${latDir}, ${Math.abs(location.longitude).toFixed(1)}°${lngDir}`;
    }

    /**
     * Get accuracy description
     * @param {number} accuracy Accuracy in meters
     * @returns {string} Accuracy description
     */
    getAccuracyDescription(accuracy) {
        if (!accuracy) return 'Unknown accuracy';
        
        if (accuracy < 50) return 'High accuracy';
        if (accuracy < 200) return 'Medium accuracy';
        return 'Low accuracy';
    }

    /**
     * Check if location is fresh
     * @param {Object} location Location object
     * @param {number} maxAge Maximum age in milliseconds
     * @returns {boolean} Is fresh
     */
    isLocationFresh(location, maxAge = 5 * 60 * 1000) {
        if (!location || !location.timestamp) return false;
        
        const age = Date.now() - location.timestamp;
        return age < maxAge;
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationService;
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.LocationService = LocationService;
} 