/**
 * Browser Services
 * Abstractions for browser-specific APIs to improve testability
 */

/**
 * Navigator Service - Wraps browser navigator APIs
 */
class NavigatorService {
    constructor(navigatorObj = null) {
        // Allow injection for testing, otherwise use global navigator
        this._navigator = navigatorObj || ((typeof navigator !== 'undefined') ? navigator : null);
    }

    /**
     * Get current position using geolocation API
     * @returns {Promise<Object>} Position object with coords
     */
    async getPosition(options = {}) {
        if (!this._navigator?.geolocation) {
            throw new Error('Geolocation is not supported');
        }

        return new Promise((resolve, reject) => {
            this._navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    let message = 'Location request failed';
                    switch (error.code) {
                        case 1: // PERMISSION_DENIED
                            message = 'User denied permission';
                            break;
                        case 2: // POSITION_UNAVAILABLE
                            message = 'Location unavailable';
                            break;
                        case 3: // TIMEOUT
                            message = 'Location request timed out';
                            break;
                    }
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5 * 60 * 1000, // 5 minutes
                    ...options
                }
            );
        });
    }

    /**
     * Get permission state for geolocation
     * @returns {Promise<string>} Permission state: 'granted', 'denied', or 'prompt'
     */
    async getLocationPermissionState() {
        if (!this._navigator?.permissions) {
            return 'prompt'; // Default if permissions API not available
        }

        try {
            const permission = await this._navigator.permissions.query({ name: 'geolocation' });
            return permission.state;
        } catch (error) {
            console.warn('Permissions API error:', error);
            return 'prompt';
        }
    }

    /**
     * Check if device is online
     * @returns {boolean} Online status
     */
    get isOnline() {
        return this._navigator ? this._navigator.onLine : true;
    }

    /**
     * Register service worker
     * @param {string} path Service worker path
     * @returns {Promise<ServiceWorkerRegistration>}
     */
    async registerServiceWorker(path) {
        if (!this._navigator?.serviceWorker) {
            throw new Error('Service Worker not supported');
        }

        return this._navigator.serviceWorker.register(path);
    }
}

/**
 * Storage Service - Wraps localStorage with error handling
 */
class StorageService {
    constructor(prefix = 'analemma_') {
        this.prefix = prefix;
        this._storage = (typeof localStorage !== 'undefined') ? localStorage : null;
    }

    /**
     * Save data to storage
     * @param {string} key Storage key
     * @param {*} value Value to store (will be JSON stringified)
     * @returns {boolean} Success status
     */
    save(key, value) {
        if (!this._storage) return false;

        try {
            const fullKey = this.prefix + key;
            this._storage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }

    /**
     * Load data from storage
     * @param {string} key Storage key
     * @returns {*} Stored value or null
     */
    load(key) {
        if (!this._storage) return null;

        try {
            const fullKey = this.prefix + key;
            const item = this._storage.getItem(fullKey);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    }

    /**
     * Remove item from storage
     * @param {string} key Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        if (!this._storage) return false;

        try {
            const fullKey = this.prefix + key;
            this._storage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * Clear all items with the prefix
     * @returns {boolean} Success status
     */
    clear() {
        if (!this._storage) return false;

        try {
            const keys = Object.keys(this._storage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    this._storage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
}

/**
 * Network Service - Handles network connectivity checks
 */
class NetworkService {
    constructor(checkUrl = 'https://www.google.com/favicon.ico') {
        this.checkUrl = checkUrl;
    }

    /**
     * Check actual network connectivity
     * @returns {Promise<boolean>} True if connected
     */
    async checkConnectivity() {
        try {
            const response = await fetch(this.checkUrl, {
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Monitor online/offline events
     * @param {Function} callback Called with online status
     * @returns {Function} Cleanup function
     */
    monitorConnectivity(callback) {
        const handleOnline = () => callback(true);
        const handleOffline = () => callback(false);

        if (typeof window !== 'undefined') {
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Return cleanup function
            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }

        return () => {}; // No-op cleanup
    }
}

/**
 * Timer Service - Handles intervals and timeouts
 */
class TimerService {
    constructor() {
        this.timers = new Set();
    }

    /**
     * Set an interval
     * @param {Function} callback Function to call
     * @param {number} interval Interval in milliseconds
     * @returns {number} Timer ID
     */
    setInterval(callback, interval) {
        const timerId = setInterval(callback, interval);
        this.timers.add(timerId);
        return timerId;
    }

    /**
     * Clear an interval
     * @param {number} timerId Timer ID to clear
     */
    clearInterval(timerId) {
        clearInterval(timerId);
        this.timers.delete(timerId);
    }

    /**
     * Clear all timers
     */
    clearAll() {
        this.timers.forEach(timerId => clearInterval(timerId));
        this.timers.clear();
    }
}

// Export services
const BrowserServices = {
    NavigatorService,
    StorageService,
    NetworkService,
    TimerService
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserServices;
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.BrowserServices = BrowserServices;
} 