/**
 * Tests for status-logic.js - Pure business logic functions
 */

const { 
    getLocationStatus, 
    getOnlineStatus, 
    getActiveScreen, 
    getLocationSource 
} = require('../../src/js/core/status-logic.js');

describe('Status Logic Functions', () => {
    describe('getLocationStatus', () => {
        const mockTime = Date.now();
        
        test('returns denied status when location is null and permission denied', () => {
            const result = getLocationStatus(null, 'denied', mockTime);
            expect(result).toEqual({
                class: 'status-indicator denied',
                text: 'Location Access Denied'
            });
        });

        test('returns error status when location is null and permission not denied', () => {
            const result = getLocationStatus(null, 'prompt', mockTime);
            expect(result).toEqual({
                class: 'status-indicator error',
                text: 'Location Error'
            });
        });

        test('returns current status for fresh location with granted permission', () => {
            const location = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: mockTime - 1000 // 1 second ago
            };
            const result = getLocationStatus(location, 'granted', mockTime);
            expect(result).toEqual({
                class: 'status-indicator current',
                text: 'Current Location'
            });
        });

        test('returns cached status for old location', () => {
            const location = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: mockTime - (10 * 60 * 1000) // 10 minutes ago
            };
            const result = getLocationStatus(location, 'granted', mockTime);
            expect(result).toEqual({
                class: 'status-indicator cached',
                text: 'Cached Location'
            });
        });

        test('returns cached status when permission not granted', () => {
            const location = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: mockTime - 1000 // Fresh but no permission
            };
            const result = getLocationStatus(location, 'denied', mockTime);
            expect(result).toEqual({
                class: 'status-indicator cached',
                text: 'Cached Location'
            });
        });
    });

    describe('getOnlineStatus', () => {
        test('returns online status when online', () => {
            const result = getOnlineStatus(true);
            expect(result).toEqual({
                class: 'status-indicator online',
                text: 'Online'
            });
        });

        test('returns offline status when offline', () => {
            const result = getOnlineStatus(false);
            expect(result).toEqual({
                class: 'status-indicator offline',
                text: 'Offline'
            });
        });
    });

    describe('getActiveScreen', () => {
        test('returns loading screen when loading', () => {
            const state = {
                isLoading: true,
                location: null,
                permissionState: null,
                hasError: false
            };
            expect(getActiveScreen(state)).toBe('loading');
        });

        test('returns main screen when location is set', () => {
            const state = {
                isLoading: false,
                location: { latitude: 40, longitude: -74 },
                permissionState: 'granted',
                hasError: false
            };
            expect(getActiveScreen(state)).toBe('main');
        });

        test('returns error screen when error and no location', () => {
            const state = {
                isLoading: false,
                location: null,
                permissionState: null,
                hasError: true,
                errorMessage: 'Test error'
            };
            expect(getActiveScreen(state)).toBe('error');
        });

        test('returns denied screen when permission denied', () => {
            const state = {
                isLoading: false,
                location: null,
                permissionState: 'denied',
                hasError: false
            };
            expect(getActiveScreen(state)).toBe('denied');
        });

        test('returns prompt screen by default', () => {
            const state = {
                isLoading: false,
                location: null,
                permissionState: null,
                hasError: false
            };
            expect(getActiveScreen(state)).toBe('prompt');
        });

        test('prioritizes loading over other states', () => {
            const state = {
                isLoading: true,
                location: { latitude: 40, longitude: -74 },
                permissionState: 'granted',
                hasError: true
            };
            expect(getActiveScreen(state)).toBe('loading');
        });
    });

    describe('getLocationSource', () => {
        const mockTime = Date.now();

        test('returns none when location is null', () => {
            expect(getLocationSource(null, 'granted', mockTime)).toBe('none');
        });

        test('returns current for fresh location with permission', () => {
            const location = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: mockTime - 1000 // 1 second ago
            };
            expect(getLocationSource(location, 'granted', mockTime)).toBe('current');
        });

        test('returns cached for old location', () => {
            const location = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: mockTime - (10 * 60 * 1000) // 10 minutes ago
            };
            expect(getLocationSource(location, 'granted', mockTime)).toBe('cached');
        });

        test('returns cached when permission not granted', () => {
            const location = {
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: mockTime - 1000 // Fresh but no permission
            };
            expect(getLocationSource(location, 'denied', mockTime)).toBe('cached');
        });
    });
}); 