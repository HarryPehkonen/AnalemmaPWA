/**
 * Integration tests for the refactored AnalemmaPWA application
 */

const { AnalemmaPWA } = require('../../src/js/app.js');
const StatusLogic = require('../../src/js/core/status-logic.js');
const UIHelpers = require('../../src/js/ui/ui-helpers.js');

describe('AnalemmaPWA Integration Tests', () => {
    let app;
    let mockDependencies;
    let originalConsoleError;
    let originalConsoleLog;
    
    beforeEach(() => {
        // Mock console to suppress expected errors during tests
        originalConsoleError = console.error;
        originalConsoleLog = console.log;
        console.error = jest.fn();
        console.log = jest.fn();
        
        // Set up DOM
        document.body.innerHTML = `
            <div id="app"></div>
            <div id="location-prompt" class="hidden"></div>
            <div id="location-denied" class="hidden"></div>
            <div id="main-content" class="hidden"></div>
            <div id="loading" class="hidden"><p></p></div>
            <div id="online-status"><span class="status-text"></span></div>
            <div id="location-status"><span class="status-text"></span></div>
        `;
        
        // Create mock dependencies
        mockDependencies = {
            StatusLogic,
            UIHelpers,
            LocationUtils: {
                getSavedLocation: jest.fn(),
                getLocationPermissionState: jest.fn(),
                requestLocation: jest.fn(),
                formatLocationForDisplay: jest.fn(() => '40.7°N, 74.0°W'),
                getAccuracyDescription: jest.fn(() => 'High accuracy')
            },
            SolarCalculations: {
                validateCoordinates: jest.fn(() => ({ isValid: true })),
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
        
        // Mock fetch
        global.fetch = jest.fn();
        global.navigator.onLine = true;
        
        // Mock window.confirm
        global.confirm = jest.fn(() => false);
        
        // Create app instance with mocked dependencies
        app = new AnalemmaPWA(mockDependencies);
    });
    
    afterEach(() => {
        jest.clearAllMocks();
        // Restore console methods
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
    });

    describe('State Management', () => {
        test('initializes with correct default state', () => {
            expect(app.state).toEqual({
                location: null,
                permissionState: null,
                isLoading: false,
                hasError: false,
                errorMessage: null,
                isOnline: true,
                currentDate: expect.any(Date)
            });
        });

        test('updates state when setting location', async () => {
            const mockLocation = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: Date.now()
            };
            
            await app.setLocation(mockLocation);
            
            expect(app.state.location).toEqual(mockLocation);
            expect(app.state.isLoading).toBe(false);
            expect(app.state.hasError).toBe(false);
        });
    });

    describe('Screen Management', () => {
        test('shows loading screen when requesting location', async () => {
            mockDependencies.LocationUtils.requestLocation.mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 100))
            );
            
            const requestPromise = app.requestLocation();
            
            // Should be loading
            expect(app.state.isLoading).toBe(true);
            expect(document.getElementById('loading').classList.contains('hidden')).toBe(false);
            
            await requestPromise;
        });

        test('shows main screen when location is set', async () => {
            const mockLocation = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: Date.now()
            };
            
            await app.setLocation(mockLocation);
            
            expect(document.getElementById('main-content').classList.contains('hidden')).toBe(false);
            expect(document.getElementById('loading').classList.contains('hidden')).toBe(true);
            expect(document.getElementById('location-prompt').classList.contains('hidden')).toBe(true);
        });

        test('shows error screen on location error', async () => {
            mockDependencies.LocationUtils.requestLocation.mockRejectedValue(
                new Error('Location unavailable')
            );
            
            await app.requestLocation();
            
            expect(app.state.hasError).toBe(true);
            expect(document.getElementById('location-denied').classList.contains('hidden')).toBe(false);
        });
    });

    describe('Status Indicators', () => {
        test('updates location status when location is set', async () => {
            const mockLocation = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: Date.now()
            };
            
            // Need to await the permission state check that happens in setLocation
            mockDependencies.LocationUtils.getLocationPermissionState.mockResolvedValue('granted');
            
            await app.setLocation(mockLocation);
            
            // Wait for async updates
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const statusElement = document.getElementById('location-status');
            expect(statusElement.className).toBe('status-indicator current');
            expect(statusElement.querySelector('.status-text').textContent).toBe('Current Location');
        });

        test('updates online status based on connectivity', async () => {
            // Mock successful connectivity check
            global.fetch.mockResolvedValueOnce({ ok: true });
            
            await app.updateOnlineStatusWithConnectivityCheck();
            
            const statusElement = document.getElementById('online-status');
            expect(statusElement.className).toBe('status-indicator online');
            expect(statusElement.querySelector('.status-text').textContent).toBe('Online');
            
            // Mock failed connectivity check
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            
            await app.updateOnlineStatusWithConnectivityCheck();
            
            expect(statusElement.className).toBe('status-indicator offline');
            expect(statusElement.querySelector('.status-text').textContent).toBe('Offline');
        });
    });

    describe('Permission Handling', () => {
        test('requests location when permission is granted on init', async () => {
            mockDependencies.LocationUtils.getLocationPermissionState.mockResolvedValue('granted');
            mockDependencies.LocationUtils.getSavedLocation.mockReturnValue(null);
            mockDependencies.LocationUtils.requestLocation.mockResolvedValue({
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: Date.now()
            });
            
            await app.initialize();
            
            expect(mockDependencies.LocationUtils.requestLocation).toHaveBeenCalled();
        });

        test('shows prompt when permission is needed', async () => {
            mockDependencies.LocationUtils.getLocationPermissionState.mockResolvedValue('prompt');
            mockDependencies.LocationUtils.getSavedLocation.mockReturnValue(null);
            
            await app.initialize();
            
            expect(document.getElementById('location-prompt').classList.contains('hidden')).toBe(false);
        });

        test('shows denied screen when permission is denied', async () => {
            mockDependencies.LocationUtils.requestLocation.mockRejectedValue(
                new Error('User denied permission')
            );
            
            await app.requestLocation();
            
            expect(app.state.permissionState).toBe('denied');
            expect(document.getElementById('location-denied').classList.contains('hidden')).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('handles invalid coordinates gracefully', async () => {
            mockDependencies.SolarCalculations.validateCoordinates.mockReturnValue({
                isValid: false,
                error: 'Invalid latitude'
            });
            
            await app.setLocation({ latitude: 200, longitude: 0 });
            
            expect(app.state.hasError).toBe(true);
            expect(app.state.errorMessage).toContain('Invalid latitude');
        });

        test('handles network errors during connectivity check', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));
            
            const result = await app.checkNetworkConnectivity();
            
            expect(result).toBe(false);
        });
    });

    describe('Service Worker Registration', () => {
        test('registers service worker when going offline', async () => {
            const mockRegister = jest.fn().mockResolvedValue({});
            global.navigator.serviceWorker = { register: mockRegister };
            
            // Mock failed connectivity check (offline)
            global.fetch.mockRejectedValue(new Error('Network error'));
            
            await app.updateOnlineStatusWithConnectivityCheck();
            
            expect(mockRegister).toHaveBeenCalledWith('/sw.js');
        });

        test('handles service worker registration failure gracefully', async () => {
            const mockRegister = jest.fn().mockRejectedValue(new Error('Registration failed'));
            global.navigator.serviceWorker = { register: mockRegister };
            
            // Mock failed connectivity check (offline)
            global.fetch.mockRejectedValue(new Error('Network error'));
            
            // Should not throw
            await expect(app.updateOnlineStatusWithConnectivityCheck()).resolves.not.toThrow();
        });
    });
}); 