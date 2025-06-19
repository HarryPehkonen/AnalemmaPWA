/**
 * Simplified Analemma PWA
 * Coordinates between modules without handling implementation details
 */

// Import all modules
const AppState = (typeof window !== 'undefined' && window.AppState) || 
                 (typeof require !== 'undefined' && require('./core/app-state.js'));
const Renderers = (typeof window !== 'undefined' && window.Renderers) || 
                  (typeof require !== 'undefined' && require('./ui/renderers.js'));
const DOMUpdater = (typeof window !== 'undefined' && window.DOMUpdater) || 
                   (typeof require !== 'undefined' && require('./ui/dom-updater.js'));
const LocationService = (typeof window !== 'undefined' && window.LocationService) || 
                        (typeof require !== 'undefined' && require('./services/location-service.js'));
const { NetworkService, TimerService } = (typeof window !== 'undefined' && window.BrowserServices) || 
                                         (typeof require !== 'undefined' && require('./services/browser-services.js'));
const SolarCalculations = (typeof window !== 'undefined' && window.SolarCalculations) || 
                          (typeof require !== 'undefined' && require('./calculations/solar.js'));
const AnalemmaRenderer = (typeof window !== 'undefined' && window.AnalemmaRenderer) || 
                         (typeof require !== 'undefined' && require('./visualization/analemma-renderer.js'));

class SimplifiedAnalemmaPWA {
    constructor(dependencies = {}) {
        // Initialize services
        this.state = dependencies.state || new AppState();
        this.location = dependencies.locationService || new LocationService();
        this.network = dependencies.networkService || new NetworkService();
        this.timers = dependencies.timerService || new TimerService();
        this.renderer = dependencies.analemmaRenderer || new AnalemmaRenderer();
        
        // Get DOM elements
        this.elements = this._getElements();
        this.domUpdater = dependencies.domUpdater || new DOMUpdater(this.elements);
        
        // Subscribe to state changes
        this.unsubscribe = this.state.subscribe((newState, oldState) => {
            this.render(newState, oldState);
        });
        
        // Set up event handlers
        this._setupEventHandlers();
        
        // Initialize timers
        this._initializeTimers();
    }

    /**
     * Get DOM elements
     * @private
     */
    _getElements() {
        if (typeof document === 'undefined') return {};
        
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
     * Set up event handlers
     * @private
     */
    _setupEventHandlers() {
        if (typeof window === 'undefined') return;
        
        // Location buttons
        this.elements.grantLocationBtn?.addEventListener('click', () => this.requestLocation());
        this.elements.retryLocationBtn?.addEventListener('click', () => this.requestLocation());
        
        // Network monitoring
        this.cleanupNetwork = this.network.monitorConnectivity(async (isOnline) => {
            this.state.update({ isOnline });
            
            // Verify connectivity
            if (isOnline) {
                const actuallyOnline = await this.network.checkConnectivity();
                this.state.update({ isOnline: actuallyOnline });
            }
        });
    }

    /**
     * Initialize timers
     * @private
     */
    _initializeTimers() {
        // Update time every minute
        this.timers.setInterval(() => {
            if (this.state.getState().location) {
                this.updateSolarNoonTime();
            }
        }, 60000);
        
        // Check for date change every minute
        this.timers.setInterval(() => {
            const state = this.state.getState();
            const now = new Date();
            const currentDate = new Date(state.currentDate);
            
            if (now.getDate() !== currentDate.getDate()) {
                this.state.update({ currentDate: now });
                if (state.location) {
                    this.updateVisualization();
                }
            }
        }, 60000);
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Check for saved location
            const savedLocation = this.location.getSavedLocation();
            if (savedLocation) {
                this.state.update({ location: savedLocation });
                const permissionState = await this.location.getPermissionState();
                this.state.update({ permissionState });
                await this.updateAllDisplays();
                return;
            }
            
            // Check permission state
            const permissionState = await this.location.getPermissionState();
            this.state.update({ permissionState });
            
            if (permissionState === 'granted') {
                await this.requestLocation();
            }
        } catch (error) {
            console.error('Initialization error:', error);
            this.state.update({
                hasError: true,
                errorMessage: 'Failed to initialize application'
            });
        }
    }

    /**
     * Request location from user
     */
    async requestLocation() {
        this.state.update({ 
            isLoading: true, 
            loadingMessage: 'Getting your location...' 
        });
        
        try {
            const location = await this.location.requestLocation();
            const permissionState = await this.location.getPermissionState();
            
            // Validate coordinates
            const validation = SolarCalculations.validateCoordinates(
                location.latitude, 
                location.longitude
            );
            
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            
            this.state.update({
                location,
                permissionState,
                isLoading: false,
                hasError: false,
                errorMessage: null
            });
            
            await this.updateAllDisplays();
            
        } catch (error) {
            console.error('Location request failed:', error);
            
            const isDenied = error.message.includes('denied');
            this.state.update({
                isLoading: false,
                hasError: true,
                errorMessage: error.message,
                permissionState: isDenied ? 'denied' : this.state.getState().permissionState
            });
        }
    }

    /**
     * Update all displays
     */
    async updateAllDisplays() {
        await Promise.all([
            this.updateSolarNoonTime(),
            this.updateVisualization()
        ]);
    }

    /**
     * Update solar noon time
     */
    async updateSolarNoonTime() {
        const state = this.state.getState();
        if (!state.location) return;
        
        try {
            const solarNoon = SolarCalculations.calculateSolarNoon(
                state.location.longitude,
                state.currentDate
            );
            const timeString = SolarCalculations.formatSolarNoonTime(solarNoon, true);
            this.domUpdater.updateSolarNoonTime(timeString);
        } catch (error) {
            console.error('Error calculating solar noon:', error);
            this.domUpdater.updateSolarNoonTime('Error calculating time');
        }
    }

    /**
     * Update analemma visualization
     */
    async updateVisualization() {
        const state = this.state.getState();
        if (!state.location) return;
        
        try {
            const visualization = await this.renderer.generateVisualization(
                state.location,
                state.currentDate
            );
            this.domUpdater.updateAnalemmaVisualization(visualization);
        } catch (error) {
            console.error('Error updating visualization:', error);
        }
    }

    /**
     * Render UI based on state changes
     * @param {Object} newState New state
     * @param {Object} oldState Previous state
     */
    render(newState, oldState) {
        // Generate render data
        const renderData = Renderers.renderUI(newState);
        
        // Update DOM
        this.domUpdater.updateUI(renderData);
        
        // Update location info if changed
        if (newState.location !== oldState.location && newState.location) {
            const locationInfo = Renderers.renderLocationInfo(
                newState.location,
                newState.location.accuracy
            );
            this.domUpdater.updateLocationInfo(locationInfo);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.unsubscribe();
        this.timers.clearAll();
        if (this.cleanupNetwork) {
            this.cleanupNetwork();
        }
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimplifiedAnalemmaPWA;
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.SimplifiedAnalemmaPWA = SimplifiedAnalemmaPWA;
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new SimplifiedAnalemmaPWA();
        app.initialize();
        
        // Store reference for debugging
        window.analemmaApp = app;
    });
} 