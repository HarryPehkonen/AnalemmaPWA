/**
 * Integration test for location flow
 * Tests the critical user journey of granting location permission
 */

const SimplifiedAnalemmaPWA = require('../../src/js/app-simple.js');
const AppState = require('../../src/js/core/app-state.js');

describe('Location Flow Integration', () => {
    let app;
    let mockLocationService;
    let mockDOMUpdater;
    let state;

    beforeEach(() => {
        // Set up DOM elements
        document.body.innerHTML = `
            <div id="app"></div>
            <div id="location-prompt" class="hidden"></div>
            <div id="location-denied" class="hidden"></div>
            <div id="main-content" class="hidden"></div>
            <div id="loading" class="hidden"></div>
            <button id="grant-location-btn"></button>
        `;

        // Create real state instance
        state = new AppState();

        // Mock services
        mockLocationService = {
            getSavedLocation: jest.fn().mockReturnValue(null),
            getPermissionState: jest.fn(),
            requestLocation: jest.fn()
        };

        mockDOMUpdater = {
            updateUI: jest.fn(),
            updateSolarNoonTime: jest.fn(),
            updateAnalemmaVisualization: jest.fn(),
            updateLocationInfo: jest.fn()
        };

        // Create app with mocked dependencies
        app = new SimplifiedAnalemmaPWA({
            state,
            locationService: mockLocationService,
            domUpdater: mockDOMUpdater,
            networkService: { monitorConnectivity: () => () => {} },
            timerService: { setInterval: () => {}, clearAll: () => {} },
            analemmaRenderer: { generateVisualization: jest.fn() }
        });
    });

    afterEach(() => {
        app.destroy();
    });

    test('shows location prompt when permission not granted', async () => {
        // Arrange
        mockLocationService.getPermissionState.mockResolvedValue('prompt');

        // Act
        await app.initialize();

        // Assert
        const currentState = state.getState();
        expect(currentState.permissionState).toBe('prompt');
        expect(currentState.location).toBeNull();
        
        // Verify UI was updated to show prompt screen
        expect(mockDOMUpdater.updateUI).toHaveBeenCalledWith(
            expect.objectContaining({
                activeScreen: 'prompt'
            })
        );
    });

    test('automatically requests location when permission already granted', async () => {
        // Arrange
        const mockLocation = {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 50,
            timestamp: Date.now()
        };
        
        mockLocationService.getPermissionState.mockResolvedValue('granted');
        mockLocationService.requestLocation.mockResolvedValue(mockLocation);

        // Act
        await app.initialize();

        // Assert
        expect(mockLocationService.requestLocation).toHaveBeenCalled();
        
        const currentState = state.getState();
        expect(currentState.location).toEqual(mockLocation);
        expect(currentState.permissionState).toBe('granted');
        
        // Verify main screen is shown
        expect(mockDOMUpdater.updateUI).toHaveBeenCalledWith(
            expect.objectContaining({
                activeScreen: 'main'
            })
        );
    });

    test('handles location request when user clicks grant button', async () => {
        // Arrange
        const mockLocation = {
            latitude: 51.5074,
            longitude: -0.1278,
            accuracy: 100,
            timestamp: Date.now()
        };
        
        mockLocationService.getPermissionState
            .mockResolvedValueOnce('prompt')
            .mockResolvedValueOnce('granted');
        mockLocationService.requestLocation.mockResolvedValue(mockLocation);

        await app.initialize();

        // Act - simulate button click
        const grantButton = document.getElementById('grant-location-btn');
        grantButton.click();
        
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert
        const currentState = state.getState();
        expect(currentState.location).toEqual(mockLocation);
        expect(currentState.isLoading).toBe(false);
        expect(currentState.hasError).toBe(false);
        
        // Verify displays were updated
        expect(mockDOMUpdater.updateSolarNoonTime).toHaveBeenCalled();
        expect(mockDOMUpdater.updateAnalemmaVisualization).toHaveBeenCalled();
    });

    test('shows error when location permission denied', async () => {
        // Arrange
        mockLocationService.getPermissionState.mockResolvedValue('prompt');
        mockLocationService.requestLocation.mockRejectedValue(
            new Error('User denied permission')
        );

        await app.initialize();

        // Act
        await app.requestLocation();

        // Assert
        const currentState = state.getState();
        expect(currentState.hasError).toBe(true);
        expect(currentState.errorMessage).toBe('User denied permission');
        expect(currentState.permissionState).toBe('denied');
        
        // Verify denied screen is shown
        expect(mockDOMUpdater.updateUI).toHaveBeenCalledWith(
            expect.objectContaining({
                activeScreen: 'denied'
            })
        );
    });

    test('loads saved location on startup', async () => {
        // Arrange
        const savedLocation = {
            latitude: -33.8688,
            longitude: 151.2093,
            accuracy: 75,
            timestamp: Date.now() - 60000 // 1 minute ago
        };
        
        mockLocationService.getSavedLocation.mockReturnValue(savedLocation);
        mockLocationService.getPermissionState.mockResolvedValue('granted');

        // Act
        await app.initialize();

        // Assert
        const currentState = state.getState();
        expect(currentState.location).toEqual(savedLocation);
        expect(mockLocationService.requestLocation).not.toHaveBeenCalled();
        
        // Verify cached location status
        expect(mockDOMUpdater.updateUI).toHaveBeenCalledWith(
            expect.objectContaining({
                locationStatus: {
                    className: 'status-indicator cached',
                    text: 'Cached Location'
                }
            })
        );
    });

    test('validates coordinates before accepting location', async () => {
        // Arrange
        const invalidLocation = {
            latitude: 200, // Invalid!
            longitude: -74,
            accuracy: 50,
            timestamp: Date.now()
        };
        
        mockLocationService.getPermissionState.mockResolvedValue('granted');
        mockLocationService.requestLocation.mockResolvedValue(invalidLocation);

        // Act
        await app.requestLocation();

        // Assert
        const currentState = state.getState();
        expect(currentState.hasError).toBe(true);
        expect(currentState.errorMessage).toContain('Latitude must be between');
        expect(currentState.location).toBeNull();
    });
}); 