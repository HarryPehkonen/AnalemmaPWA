/**
 * Tests for Renderers module
 * Test pure rendering functions
 */

const Renderers = require('../../src/js/ui/renderers.js');

describe('Renderers', () => {
    describe('renderLocationStatus', () => {
        test('renders current location status', () => {
            const state = {
                location: { latitude: 40, longitude: -74, timestamp: Date.now() },
                permissionState: 'granted'
            };
            
            const result = Renderers.renderLocationStatus(state);
            
            expect(result).toEqual({
                className: 'status-indicator current',
                text: 'Current Location'
            });
        });

        test('renders cached location status', () => {
            const state = {
                location: { latitude: 40, longitude: -74, timestamp: Date.now() - 10 * 60 * 1000 },
                permissionState: 'granted'
            };
            
            const result = Renderers.renderLocationStatus(state);
            
            expect(result).toEqual({
                className: 'status-indicator cached',
                text: 'Cached Location'
            });
        });

        test('renders denied status', () => {
            const state = {
                location: null,
                permissionState: 'denied'
            };
            
            const result = Renderers.renderLocationStatus(state);
            
            expect(result).toEqual({
                className: 'status-indicator denied',
                text: 'Location Access Denied'
            });
        });
    });

    describe('renderOnlineStatus', () => {
        test('renders online status', () => {
            const state = { isOnline: true };
            
            const result = Renderers.renderOnlineStatus(state);
            
            expect(result).toEqual({
                className: 'status-indicator online',
                text: 'Online'
            });
        });

        test('renders offline status', () => {
            const state = { isOnline: false };
            
            const result = Renderers.renderOnlineStatus(state);
            
            expect(result).toEqual({
                className: 'status-indicator offline',
                text: 'Offline'
            });
        });
    });

    describe('renderActiveScreen', () => {
        test('returns loading screen when loading', () => {
            const state = { isLoading: true };
            expect(Renderers.renderActiveScreen(state)).toBe('loading');
        });

        test('returns main screen when has location', () => {
            const state = { 
                isLoading: false, 
                location: { latitude: 40, longitude: -74 } 
            };
            expect(Renderers.renderActiveScreen(state)).toBe('main');
        });

        test('returns denied screen when permission denied', () => {
            const state = { 
                isLoading: false, 
                location: null,
                permissionState: 'denied' 
            };
            expect(Renderers.renderActiveScreen(state)).toBe('denied');
        });

        test('returns prompt screen by default', () => {
            const state = { 
                isLoading: false, 
                location: null,
                permissionState: null 
            };
            expect(Renderers.renderActiveScreen(state)).toBe('prompt');
        });
    });

    describe('renderLoadingMessage', () => {
        test('returns null when not loading', () => {
            const state = { isLoading: false };
            expect(Renderers.renderLoadingMessage(state)).toBeNull();
        });

        test('returns custom loading message', () => {
            const state = { isLoading: true, loadingMessage: 'Custom message' };
            expect(Renderers.renderLoadingMessage(state)).toBe('Custom message');
        });

        test('returns default messages based on context', () => {
            const state1 = { isLoading: true, location: null, permissionState: null };
            expect(Renderers.renderLoadingMessage(state1)).toBe('Checking location permissions...');

            const state2 = { isLoading: true, location: null, permissionState: 'granted' };
            expect(Renderers.renderLoadingMessage(state2)).toBe('Getting your location...');

            const state3 = { isLoading: true, location: { latitude: 40, longitude: -74 } };
            expect(Renderers.renderLoadingMessage(state3)).toBe('Loading...');
        });
    });

    describe('renderErrorMessage', () => {
        test('returns null when no error', () => {
            const state = { hasError: false };
            expect(Renderers.renderErrorMessage(state)).toBeNull();
        });

        test('returns error data when has error', () => {
            const state = { 
                hasError: true, 
                errorMessage: 'Test error',
                location: null 
            };
            
            const result = Renderers.renderErrorMessage(state);
            
            expect(result).toEqual({
                title: 'An error occurred',
                message: 'Test error',
                showRetry: true
            });
        });

        test('hides retry when has location', () => {
            const state = { 
                hasError: true, 
                errorMessage: 'Test error',
                location: { latitude: 40, longitude: -74 } 
            };
            
            const result = Renderers.renderErrorMessage(state);
            expect(result.showRetry).toBe(false);
        });
    });

    describe('renderLocationInfo', () => {
        test('renders location with high accuracy', () => {
            const location = { latitude: 40.7128, longitude: -74.0060 };
            const accuracy = 30;
            
            const result = Renderers.renderLocationInfo(location, accuracy);
            
            expect(result).toEqual({
                text: '40.7128°N, 74.0060°W',
                accuracy: 'High accuracy'
            });
        });

        test('renders location with medium accuracy', () => {
            const location = { latitude: -33.8688, longitude: 151.2093 };
            const accuracy = 150;
            
            const result = Renderers.renderLocationInfo(location, accuracy);
            
            expect(result).toEqual({
                text: '33.8688°S, 151.2093°E',
                accuracy: 'Medium accuracy'
            });
        });

        test('renders location with low accuracy', () => {
            const location = { latitude: 51.5074, longitude: -0.1278 };
            const accuracy = 500;
            
            const result = Renderers.renderLocationInfo(location, accuracy);
            
            expect(result).toEqual({
                text: '51.5074°N, 0.1278°W',
                accuracy: 'Low accuracy'
            });
        });

        test('handles null location', () => {
            const result = Renderers.renderLocationInfo(null, null);
            
            expect(result).toEqual({
                text: '',
                accuracy: ''
            });
        });
    });

    describe('renderExtremeLatitudeWarning', () => {
        test('shows warning when extreme', () => {
            const state = {};
            const isExtreme = true;
            
            const result = Renderers.renderExtremeLatitudeWarning(state, isExtreme);
            
            expect(result).toEqual({
                show: true,
                message: 'At this latitude, the sun may not be visible at solar noon during parts of the year.',
                className: 'extreme-latitude'
            });
        });

        test('hides warning when not extreme', () => {
            const state = {};
            const isExtreme = false;
            
            const result = Renderers.renderExtremeLatitudeWarning(state, isExtreme);
            
            expect(result).toEqual({
                show: false,
                message: 'At this latitude, the sun may not be visible at solar noon during parts of the year.',
                className: ''
            });
        });
    });

    describe('renderUI', () => {
        test('renders complete UI state', () => {
            const state = {
                isLoading: false,
                location: { latitude: 40.7, longitude: -74, accuracy: 30 },
                permissionState: 'granted',
                isOnline: true,
                hasError: false
            };
            
            const result = Renderers.renderUI(state);
            
            expect(result).toHaveProperty('activeScreen', 'main');
            expect(result).toHaveProperty('locationStatus');
            expect(result).toHaveProperty('onlineStatus');
            expect(result).toHaveProperty('loadingMessage', null);
            expect(result).toHaveProperty('errorMessage', null);
            expect(result).toHaveProperty('locationInfo');
        });
    });
}); 