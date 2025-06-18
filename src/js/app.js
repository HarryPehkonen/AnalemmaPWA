/**
 * Analemma PWA - Main Application
 * Coordinates all functionality and manages application state
 */

// Import logic modules (in browser, these would be loaded via script tags)
const StatusLogic = (typeof window !== 'undefined' && window.StatusLogic) || 
                   (typeof require !== 'undefined' && require('./core/status-logic.js'));
const UIHelpers = (typeof window !== 'undefined' && window.UIHelpers) || 
                  (typeof require !== 'undefined' && require('./ui/ui-helpers.js'));

class AnalemmaPWA {
    constructor(dependencies = {}) {
        // Dependency injection for testability
        this.StatusLogic = dependencies.StatusLogic || StatusLogic;
        this.UIHelpers = dependencies.UIHelpers || UIHelpers;
        this.LocationUtils = dependencies.LocationUtils || (typeof window !== 'undefined' && window.LocationUtils);
        this.SolarCalculations = dependencies.SolarCalculations || (typeof window !== 'undefined' && window.SolarCalculations);
        this.AnalemmaCalculations = dependencies.AnalemmaCalculations || (typeof window !== 'undefined' && window.AnalemmaCalculations);
        
        // Application state
        this.state = {
            location: null,
            permissionState: null,
            isLoading: false,
            hasError: false,
            errorMessage: null,
            isOnline: true,
            currentDate: new Date()
        };
        
        // DOM element references
        this.elements = this._getElements();
        
        // Screens mapping for showScreen function
        this.screens = {
            prompt: this.elements.locationPrompt,
            denied: this.elements.locationDenied,
            error: this.elements.locationDenied, // Reuse denied screen for errors
            loading: this.elements.loading,
            main: this.elements.mainContent
        };
        
        this.bindEvents();
        // Set initial online status immediately based on browser state
        this.updateOnlineStatus(navigator.onLine);
        // Then verify with actual connectivity check
        if (typeof window !== 'undefined') {
            this.updateOnlineStatusWithConnectivityCheck();
        }
    }

    /**
     * Get DOM elements (separated for testability)
     */
    _getElements() {
        if (typeof document === 'undefined') {
            return {}; // Return empty object in test environment
        }
        
        return {
            app: document.getElementById('app'),
            locationPrompt: document.getElementById('location-prompt'),
            locationDenied: document.getElementById('location-denied'),
            mainContent: document.getElementById('main-content'),
            loading: document.getElementById('loading'),
            noonTime: document.getElementById('noon-time'),
            locationInfo: document.getElementById('location-info'),
            extremeMessage: document.getElementById('extreme-latitude-message'),
            analemmaSvg: document.getElementById('analemma-svg'),
            analemmaPath: document.getElementById('analemma-path'),
            sunMarker: document.getElementById('sun-marker'),
            directionLabel: document.getElementById('direction-label'),
            directionArrow: document.getElementById('direction-arrow'),
            grantLocationBtn: document.getElementById('grant-location-btn'),
            retryLocationBtn: document.getElementById('retry-location-btn'),
            onlineStatus: document.getElementById('online-status'),
            locationStatus: document.getElementById('location-status')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (typeof window === 'undefined') return; // Skip in test environment
        
        // Location permission buttons
        this.elements.grantLocationBtn?.addEventListener('click', () => this.requestLocation());
        this.elements.retryLocationBtn?.addEventListener('click', () => this.requestLocation());
        
        // Online/offline status
        window.addEventListener('online', () => {
            // Immediately update UI based on browser's online state
            this.updateOnlineStatus(true);
            // Then verify with actual connectivity check
            this.updateOnlineStatusWithConnectivityCheck();
        });
        
        window.addEventListener('offline', () => {
            // Immediately update UI to offline
            this.updateOnlineStatus(false);
            // Still do connectivity check (though it will likely fail)
            this.updateOnlineStatusWithConnectivityCheck();
        });
        
        // Update every minute
        setInterval(() => this.updateTimeDisplay(), 60000);
        
        // Update daily at midnight
        setInterval(() => this.checkDateChange(), 60000);
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Check if we have a saved location
            const savedLocation = this.LocationUtils.getSavedLocation();
            if (savedLocation) {
                console.log('Found saved location');
                this.state.location = savedLocation;
                this.state.permissionState = await this.LocationUtils.getLocationPermissionState();
                await this.setLocation(savedLocation);
                return;
            }
            
            // Check current permission state
            this.state.permissionState = await this.LocationUtils.getLocationPermissionState();
            
            if (this.state.permissionState === 'granted') {
                console.log('Location permission already granted');
                await this.requestLocation();
            } else {
                console.log('Location permission required');
                this.updateScreen();
            }
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize application');
        }
    }

    /**
     * Request location permission and coordinates
     */
    async requestLocation() {
        try {
            this.state.isLoading = true;
            this.state.hasError = false;
            this.updateScreen('Getting your location...');
            
            const location = await this.LocationUtils.requestLocation();
            this.state.permissionState = await this.LocationUtils.getLocationPermissionState();
            await this.setLocation(location);
            
        } catch (error) {
            console.error('Location request failed:', error);
            this.state.isLoading = false;
            
            if (error.message.includes('denied')) {
                this.state.permissionState = 'denied';
                this.updateScreen();
            } else {
                // For testing purposes, offer to use a default location
                if (typeof confirm !== 'undefined') {
                    const useTestLocation = confirm(
                        'Location request failed. Would you like to use a test location (Vancouver, BC) for debugging?'
                    );
                    
                    if (useTestLocation) {
                        const testLocation = {
                            latitude: 49.2827,
                            longitude: -123.1207,
                            accuracy: 100,
                            timestamp: Date.now()
                        };
                        await this.setLocation(testLocation);
                        return;
                    }
                }
                
                this.showError(`Location error: ${error.message}`);
            }
        }
    }

    /**
     * Set the current location and update the display
     * @param {Object} location Location object
     */
    async setLocation(location) {
        try {
            // Validate coordinates
            const validation = this.SolarCalculations.validateCoordinates(location.latitude, location.longitude);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            this.state.location = location;
            this.state.isLoading = false;
            this.state.hasError = false;
            
            // Update permission state if not already set
            if (!this.state.permissionState) {
                this.state.permissionState = await this.LocationUtils.getLocationPermissionState();
            }
            
            console.log(`Location set: ${this.LocationUtils.formatLocationForDisplay(location)}`);
            
            // Update all displays
            await this.updateAllDisplays();
            
            // Update UI state
            this.updateScreen();
            this.updateLocationStatus();
            
        } catch (error) {
            console.error('Error setting location:', error);
            this.showError(`Failed to process location: ${error.message}`);
        }
    }

    /**
     * Update the screen based on current state
     * @param {string} loadingMessage - Optional loading message
     */
    updateScreen(loadingMessage = null) {
        const activeScreen = this.StatusLogic.getActiveScreen(this.state);
        this.UIHelpers.showScreen(this.screens, activeScreen);
        
        if (loadingMessage) {
            this.UIHelpers.updateLoadingMessage(this.elements.loading, loadingMessage);
        }
    }

    /**
     * Update location status indicator
     */
    updateLocationStatus() {
        const status = this.StatusLogic.getLocationStatus(
            this.state.location,
            this.state.permissionState
        );
        this.UIHelpers.updateLocationStatusUI(this.elements.locationStatus, status);
    }

    /**
     * Update online status display
     * @param {boolean} isOnline Whether the device is online
     */
    updateOnlineStatus(isOnline) {
        this.state.isOnline = isOnline;
        const status = this.StatusLogic.getOnlineStatus(isOnline);
        this.UIHelpers.updateOnlineStatusUI(this.elements.onlineStatus, status);
    }

    /**
     * Check actual network connectivity
     */
    async checkNetworkConnectivity() {
        try {
            const response = await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
            return true;
        } catch (error) {
            console.log('Network connectivity check failed:', error);
            return false;
        }
    }

    /**
     * Update online status with connectivity check
     */
    async updateOnlineStatusWithConnectivityCheck() {
        const isActuallyOnline = await this.checkNetworkConnectivity();
        this.updateOnlineStatus(isActuallyOnline);
        
        // Register service worker if offline
        if (!isActuallyOnline && typeof navigator !== 'undefined' && navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    }

    /**
     * Show error message
     * @param {string} message Error message
     */
    showError(message) {
        console.error(message);
        this.state.hasError = true;
        this.state.errorMessage = message;
        this.state.isLoading = false;
        
        this.updateScreen();
        this.UIHelpers.updateErrorMessage(
            this.elements.locationDenied,
            'An error occurred',
            message
        );
    }

    /**
     * Update all displays with current data
     */
    async updateAllDisplays() {
        if (!this.state.location) return;
        
        try {
            await Promise.all([
                this.updateTimeDisplay(),
                this.updateLocationDisplay(),
                this.updateAnalemmaDisplay(),
                this.updateDirectionDisplay()
            ]);
        } catch (error) {
            console.error('Error updating displays:', error);
        }
    }

    /**
     * Update the solar noon time display
     */
    async updateTimeDisplay() {
        if (!this.state.location || !this.elements.noonTime) return;
        
        try {
            const solarNoon = this.SolarCalculations.calculateSolarNoon(
                this.state.location.longitude, 
                this.state.currentDate
            );
            
            const timeString = this.SolarCalculations.formatSolarNoonTime(solarNoon, true);
            this.elements.noonTime.textContent = timeString;
            
        } catch (error) {
            console.error('Error updating time display:', error);
            this.elements.noonTime.textContent = 'Error calculating time';
        }
    }

    /**
     * Update the location information display
     */
    updateLocationDisplay() {
        if (!this.state.location || !this.elements.locationInfo) return;
        
        const locationString = this.LocationUtils.formatLocationForDisplay(this.state.location);
        const accuracy = this.LocationUtils.getAccuracyDescription(this.state.location.accuracy);
        
        this.elements.locationInfo.textContent = `${locationString} (${accuracy})`;
    }

    /**
     * Update the analemma visualization
     */
    async updateAnalemmaDisplay() {
        if (!this.state.location || !this.elements.analemmaSvg) return;
        
        try {
            // Check for extreme latitude conditions
            const isExtreme = this.SolarCalculations.isSunBelowHorizonAtNoon(
                this.state.location.latitude, 
                this.state.currentDate
            );
            
            if (this.elements.app) {
                if (isExtreme) {
                    this.elements.app.classList.add('extreme-latitude');
                    this.elements.extremeMessage?.classList.remove('hidden');
                } else {
                    this.elements.app.classList.remove('extreme-latitude');
                    this.elements.extremeMessage?.classList.add('hidden');
                }
            }
            
            // Get analemma coordinates
            const allCoords = await this.AnalemmaCalculations.getAllAnalemmaCoordinates();
            const todayCoords = await this.AnalemmaCalculations.getAnalemmaCoordinatesForDate(this.state.currentDate);
            
            // Convert ALL coordinates to SVG (including today's) to get consistent bounds
            const allCoordsWithToday = [...allCoords, todayCoords];
            
            const svgCoords = this.AnalemmaCalculations.convertToSVGCoordinates(allCoordsWithToday);
            
            // Separate the analemma path from today's position
            const analemmaCoords = svgCoords.slice(0, allCoords.length);
            const todaySvgCoords = svgCoords.slice(-1); // Last coordinate is today's
            
            const correctedCoords = this.AnalemmaCalculations.applyHemisphereCorrection(
                analemmaCoords, 
                this.state.location.latitude
            );
            
            const todayCorrected = this.AnalemmaCalculations.applyHemisphereCorrection(
                todaySvgCoords, 
                this.state.location.latitude
            );
            
            // Generate path
            const pathString = this.AnalemmaCalculations.generateSVGPath(correctedCoords);
            if (this.elements.analemmaPath) {
                this.elements.analemmaPath.setAttribute('d', pathString);
            }
            
            // Position sun marker
            if (todayCorrected.length > 0) {
                this.updateSunMarker(todayCorrected[0]);
            }
            
        } catch (error) {
            console.error('Error updating analemma display:', error);
        }
    }

    /**
     * Update the sun marker position
     * @param {Object} coords SVG coordinates
     */
    updateSunMarker(coords) {
        if (!this.elements.sunMarker) return;
        
        // Create sun icon SVG
        const sunIcon = `
            <circle cx="${coords.svgX}" cy="${coords.svgY}" r="8" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
            <g transform="translate(${coords.svgX}, ${coords.svgY})">
                <path d="M-12,0 L-8,0 M12,0 L8,0 M0,-12 L0,-8 M0,12 L0,8 M-8,-8 L-6,-6 M8,8 L6,6 M8,-8 L6,-6 M-8,8 L-6,6" 
                      stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
            </g>
        `;
        
        this.elements.sunMarker.innerHTML = sunIcon;
    }

    /**
     * Update the direction indicator
     */
    updateDirectionDisplay() {
        if (!this.state.location || !this.elements.directionLabel) return;
        
        const direction = this.SolarCalculations.getAnalemmaDirection(this.state.location.latitude);
        this.elements.directionLabel.textContent = direction;
        
        // Rotate arrow for Southern Hemisphere
        if (this.elements.directionArrow) {
            if (this.state.location.latitude < 0) {
                this.elements.directionArrow.style.transform = 'rotate(180deg)';
            } else {
                this.elements.directionArrow.style.transform = '';
            }
        }
    }

    /**
     * Check if date has changed and update if necessary
     */
    checkDateChange() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentDay = new Date(this.state.currentDate.getFullYear(), this.state.currentDate.getMonth(), this.state.currentDate.getDate());
        
        if (today.getTime() !== currentDay.getTime()) {
            console.log('Date changed, updating displays');
            this.state.currentDate = now;
            if (this.state.location) {
                this.updateAllDisplays();
            }
        }
    }
}

// Export the class for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalemmaPWA };
}

// Initialize application when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new AnalemmaPWA();
        app.initialize();
    });
} 