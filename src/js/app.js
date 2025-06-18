/**
 * Analemma PWA - Main Application
 * Coordinates all functionality and manages application state
 */

class AnalemmaPWA {
    constructor() {
        this.currentLocation = null;
        this.currentDate = new Date();
        this.isInitialized = false;
        
        // DOM element references
        this.elements = {
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
        
        // Status tracking
        this.isOnline = navigator.onLine;
        this.locationSource = 'none'; // 'current', 'cached', 'test'
        
        this.bindEvents();
        this.updateOnlineStatus(this.isOnline); // Initialize online status display
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Location permission buttons
        this.elements.grantLocationBtn?.addEventListener('click', () => this.requestLocation());
        this.elements.retryLocationBtn?.addEventListener('click', () => this.requestLocation());
        
        // Online/offline status
        window.addEventListener('online', () => this.updateOnlineStatus(true));
        window.addEventListener('offline', () => this.updateOnlineStatus(false));
        
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
            const savedLocation = window.LocationUtils.getSavedLocation();
            if (savedLocation) {
                console.log('Found saved location');
                await this.setLocation(savedLocation);
                return;
            }
            
            // Check current permission state
            const permissionState = await window.LocationUtils.getLocationPermissionState();
            
            if (permissionState === window.LocationUtils.LocationPermissionState.GRANTED) {
                console.log('Location permission already granted');
                await this.requestLocation();
            } else {
                console.log('Location permission required');
                this.showLocationPrompt();
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
            this.showLoading('Getting your location...');
            
            const location = await window.LocationUtils.requestLocation();
            await this.setLocation(location);
            
        } catch (error) {
            console.error('Location request failed:', error);
            
            if (error.message.includes('denied')) {
                this.showLocationDenied();
            } else {
                // For testing purposes, offer to use a default location
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
                } else {
                    this.showError(`Location error: ${error.message}`);
                }
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
            const validation = window.SolarCalculations.validateCoordinates(location.latitude, location.longitude);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            this.currentLocation = location;
            console.log(`Location set: ${window.LocationUtils.formatLocationForDisplay(location)}`);
            
            // Update all displays
            await this.updateAllDisplays();
            
            // Show main content
            this.showMainContent();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Error setting location:', error);
            this.showError(`Failed to process location: ${error.message}`);
        }
    }

    /**
     * Update all displays with current data
     */
    async updateAllDisplays() {
        if (!this.currentLocation) return;
        
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
        if (!this.currentLocation) return;
        
        try {
            const solarNoon = window.SolarCalculations.calculateSolarNoon(
                this.currentLocation.longitude, 
                this.currentDate
            );
            
            const timeString = window.SolarCalculations.formatSolarNoonTime(solarNoon, true);
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
        if (!this.currentLocation) return;
        
        const locationString = window.LocationUtils.formatLocationForDisplay(this.currentLocation);
        const accuracy = window.LocationUtils.getAccuracyDescription(this.currentLocation.accuracy);
        
        this.elements.locationInfo.textContent = `${locationString} (${accuracy})`;
    }

    /**
     * Update the analemma visualization
     */
    async updateAnalemmaDisplay() {
        if (!this.currentLocation) return;
        
        try {
            // Check for extreme latitude conditions
            const isExtreme = window.SolarCalculations.isSunBelowHorizonAtNoon(
                this.currentLocation.latitude, 
                this.currentDate
            );
            
            if (isExtreme) {
                this.elements.app.classList.add('extreme-latitude');
                this.elements.extremeMessage.classList.remove('hidden');
            } else {
                this.elements.app.classList.remove('extreme-latitude');
                this.elements.extremeMessage.classList.add('hidden');
            }
            
            // Get analemma coordinates
            const allCoords = await window.AnalemmaCalculations.getAllAnalemmaCoordinates();
            const todayCoords = await window.AnalemmaCalculations.getAnalemmaCoordinatesForDate(this.currentDate);
            
            // Convert ALL coordinates to SVG (including today's) to get consistent bounds
            const allCoordsWithToday = [...allCoords, todayCoords];
            
            const svgCoords = window.AnalemmaCalculations.convertToSVGCoordinates(allCoordsWithToday);
            
            // Separate the analemma path from today's position
            const analemmaCoords = svgCoords.slice(0, allCoords.length);
            const todaySvgCoords = svgCoords.slice(-1); // Last coordinate is today's
            
            const correctedCoords = window.AnalemmaCalculations.applyHemisphereCorrection(
                analemmaCoords, 
                this.currentLocation.latitude
            );
            
            const todayCorrected = window.AnalemmaCalculations.applyHemisphereCorrection(
                todaySvgCoords, 
                this.currentLocation.latitude
            );
            
            // Generate path
            const pathString = window.AnalemmaCalculations.generateSVGPath(correctedCoords);
            this.elements.analemmaPath.setAttribute('d', pathString);
            
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
        if (!this.currentLocation) return;
        
        const direction = window.SolarCalculations.getAnalemmaDirection(this.currentLocation.latitude);
        this.elements.directionLabel.textContent = direction;
        
        // Rotate arrow for Southern Hemisphere
        if (this.currentLocation.latitude < 0) {
            this.elements.directionArrow.style.transform = 'rotate(180deg)';
        } else {
            this.elements.directionArrow.style.transform = '';
        }
    }

    /**
     * Check if date has changed and update if necessary
     */
    checkDateChange() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate());
        
        if (today.getTime() !== currentDay.getTime()) {
            console.log('Date changed, updating displays');
            this.currentDate = now;
            if (this.isInitialized) {
                this.updateAllDisplays();
            }
        }
    }

    /**
     * Show location permission prompt
     */
    showLocationPrompt() {
        this.hideAllScreens();
        this.elements.locationPrompt.classList.remove('hidden');
    }

    /**
     * Show location denied message
     */
    showLocationDenied() {
        this.hideAllScreens();
        this.elements.locationDenied.classList.remove('hidden');
    }

    /**
     * Show loading screen
     * @param {string} message Loading message
     */
    showLoading(message = 'Loading...') {
        this.hideAllScreens();
        this.elements.loading.classList.remove('hidden');
        const loadingText = this.elements.loading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    /**
     * Show main application content
     */
    showMainContent() {
        this.hideAllScreens();
        this.elements.mainContent.classList.remove('hidden');
    }

    /**
     * Show error message
     * @param {string} message Error message
     */
    showError(message) {
        console.error(message);
        // For now, show in location denied screen
        this.showLocationDenied();
        const errorContent = this.elements.locationDenied.querySelector('.error-content h2');
        if (errorContent) {
            errorContent.textContent = 'An error occurred';
        }
        const errorText = this.elements.locationDenied.querySelector('.error-content p');
        if (errorText) {
            errorText.textContent = message;
        }
    }

    /**
     * Hide all screen elements
     */
    hideAllScreens() {
        this.elements.locationPrompt.classList.add('hidden');
        this.elements.locationDenied.classList.add('hidden');
        this.elements.loading.classList.add('hidden');
        this.elements.mainContent.classList.add('hidden');
    }

    /**
     * Update online status display and state
     * @param {boolean} isOnline Whether the device is online
     */
    updateOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        
        if (this.elements.onlineStatus) {
            const statusText = this.elements.onlineStatus.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = isOnline ? 'Online' : 'Offline';
            }
            this.elements.onlineStatus.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        }
        
        // If we're offline, try to use cached data
        if (!isOnline && this.currentLocation) {
            console.log('Device is offline, using cached data');
            // The app should continue working with cached data
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