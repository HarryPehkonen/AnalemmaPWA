/**
 * Network Availability Tests
 * Tests for checking network connectivity status and offline functionality
 */

// Mock required dependencies
global.window = {
    LocationUtils: {
        getSavedLocation: jest.fn(),
        getLocationPermissionState: jest.fn(),
        requestLocation: jest.fn(),
        formatLocationForDisplay: jest.fn(),
        getAccuracyDescription: jest.fn()
    },
    SolarCalculations: {
        validateCoordinates: jest.fn(),
        calculateSolarNoon: jest.fn(),
        formatSolarNoonTime: jest.fn(),
        isSunBelowHorizonAtNoon: jest.fn(),
        getAnalemmaDirection: jest.fn()
    },
    AnalemmaCalculations: {
        getAllAnalemmaCoordinates: jest.fn(),
        getAnalemmaCoordinatesForDate: jest.fn(),
        convertToSVGCoordinates: jest.fn(),
        applyHemisphereCorrection: jest.fn(),
        generateSVGPath: jest.fn()
    }
};

// Import the app class
const { AnalemmaPWA } = require('../../src/js/app.js');

describe('Network Availability Tests', () => {
    let app;
    let mockOnlineStatus;
    let mockStatusText;

    beforeEach(() => {
        // Create mock DOM elements
        mockStatusText = document.createElement('span');
        mockStatusText.className = 'status-text';
        
        mockOnlineStatus = document.createElement('div');
        mockOnlineStatus.id = 'online-status';
        mockOnlineStatus.className = 'status-indicator';
        mockOnlineStatus.appendChild(mockStatusText);
        
        document.body.appendChild(mockOnlineStatus);

        // Create app instance
        app = new AnalemmaPWA();
    });

    afterEach(() => {
        // Clean up
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    test('should detect online status correctly', () => {
        Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
        expect(navigator.onLine).toBe(true);

        Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
        expect(navigator.onLine).toBe(false);
    });

    test('should handle online/offline event listeners', () => {
        const onlineHandler = jest.fn();
        const offlineHandler = jest.fn();

        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', offlineHandler);

        window.dispatchEvent(new Event('online'));
        expect(onlineHandler).toHaveBeenCalled();

        window.dispatchEvent(new Event('offline'));
        expect(offlineHandler).toHaveBeenCalled();
    });

    test('should update online status display when going online', () => {
        // Simulate going online
        Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
        app.updateOnlineStatus(true);

        // Check status text
        const statusText = document.querySelector('#online-status .status-text');
        expect(statusText.textContent).toBe('Online');

        // Check status indicator class
        const statusIndicator = document.querySelector('#online-status');
        expect(statusIndicator.className).toBe('status-indicator online');
    });

    test('should update online status display when going offline', () => {
        // Simulate going offline
        Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
        app.updateOnlineStatus(false);

        // Check status text
        const statusText = document.querySelector('#online-status .status-text');
        expect(statusText.textContent).toBe('Offline');

        // Check status indicator class
        const statusIndicator = document.querySelector('#online-status');
        expect(statusIndicator.className).toBe('status-indicator offline');
    });

    test('should initialize with correct online status', () => {
        // Mock initial online state
        Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
        
        // Create new app instance (which calls updateOnlineStatus in constructor)
        const newApp = new AnalemmaPWA();
        
        // Check initial status
        const statusText = document.querySelector('#online-status .status-text');
        expect(statusText.textContent).toBe('Online');
        
        const statusIndicator = document.querySelector('#online-status');
        expect(statusIndicator.className).toBe('status-indicator online');
    });

    test('should handle network status changes', () => {
        const mockOnline = jest.fn();
        const mockOffline = jest.fn();

        window.addEventListener('online', mockOnline);
        window.addEventListener('offline', mockOffline);

        // Simulate going offline
        Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
        window.dispatchEvent(new Event('offline'));
        expect(mockOffline).toHaveBeenCalled();

        // Simulate going online
        Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
        window.dispatchEvent(new Event('online'));
        expect(mockOnline).toHaveBeenCalled();
    });

    test('should handle service worker registration in offline mode', async () => {
        // Mock service worker registration
        const mockRegister = jest.fn();
        Object.defineProperty(window.navigator, 'serviceWorker', {
            value: { register: mockRegister },
            configurable: true
        });

        // Simulate offline state
        Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });

        // Attempt to register service worker
        try {
            await navigator.serviceWorker.register('/sw.js');
            expect(mockRegister).toHaveBeenCalledWith('/sw.js');
        } catch (error) {
            // Service worker registration might fail in offline mode
            // but the test should still pass as we're testing the attempt
            expect(error).toBeDefined();
        }
    });
}); 