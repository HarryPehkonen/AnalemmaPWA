/**
 * Tests for BrowserServices module
 * Test browser API abstractions
 */

const { NavigatorService, StorageService, NetworkService, TimerService } = require('../../src/js/services/browser-services.js');

describe('NavigatorService', () => {
    let service;
    let mockGeolocation;
    let mockPermissions;
    let originalConsoleWarn;
    let originalNavigator;

    beforeEach(() => {
        // Mock console to suppress expected warnings
        originalConsoleWarn = console.warn;
        console.warn = jest.fn();
        
        // Save original navigator if it exists
        originalNavigator = global.navigator;
        
        mockGeolocation = {
            getCurrentPosition: jest.fn()
        };
        mockPermissions = {
            query: jest.fn()
        };
        
        // Create mock navigator object
        const mockNavigator = {
            geolocation: mockGeolocation,
            permissions: mockPermissions,
            onLine: true
        };
        
        // Set up global navigator for other tests
        global.navigator = mockNavigator;
        
        // Create service with injected navigator
        service = new NavigatorService(mockNavigator);
    });

    afterEach(() => {
        console.warn = originalConsoleWarn;
        
        // Restore original navigator
        if (originalNavigator) {
            global.navigator = originalNavigator;
        } else {
            delete global.navigator;
        }
    });

    describe('getPosition', () => {
        test('returns position on success', async () => {
            const mockPosition = {
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    accuracy: 50
                },
                timestamp: Date.now()
            };
            
            mockGeolocation.getCurrentPosition.mockImplementation((success) => {
                success(mockPosition);
            });
            
            const position = await service.getPosition();
            
            expect(position).toEqual({
                latitude: 40.7128,
                longitude: -74.0060,
                accuracy: 50,
                timestamp: mockPosition.timestamp
            });
        });

        test('handles permission denied error', async () => {
            const mockError = { code: 1 }; // PERMISSION_DENIED
            
            mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
                error(mockError);
            });
            
            await expect(service.getPosition()).rejects.toThrow('User denied permission');
        });

        test('handles position unavailable error', async () => {
            const mockError = { code: 2 }; // POSITION_UNAVAILABLE
            
            mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
                error(mockError);
            });
            
            await expect(service.getPosition()).rejects.toThrow('Location unavailable');
        });

        test('throws when geolocation not supported', async () => {
            // Create a new navigator without geolocation
            global.navigator = {
                permissions: mockPermissions,
                onLine: true
            };
            
            // Create new service instance with updated navigator
            const serviceWithoutGeo = new NavigatorService();
            
            await expect(serviceWithoutGeo.getPosition()).rejects.toThrow('Geolocation is not supported');
        });
    });

    describe('getLocationPermissionState', () => {
        test('returns permission state', async () => {
            mockPermissions.query.mockResolvedValue({ state: 'granted' });
            
            const state = await service.getLocationPermissionState();
            
            expect(state).toBe('granted');
            expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
        });

        test('returns prompt when permissions API not available', async () => {
            delete global.navigator.permissions;
            service = new NavigatorService();
            
            const state = await service.getLocationPermissionState();
            
            expect(state).toBe('prompt');
        });

        test('handles permissions API errors', async () => {
            mockPermissions.query.mockRejectedValue(new Error('Permission error'));
            
            const state = await service.getLocationPermissionState();
            
            expect(state).toBe('prompt');
        });
    });

    describe('isOnline', () => {
        test('returns online status', () => {
            // Test online state
            service._navigator.onLine = true;
            expect(service.isOnline).toBe(true);
            
            // Test offline state
            service._navigator.onLine = false;
            expect(service.isOnline).toBe(false);
        });

        test('returns true when navigator not available', () => {
            service._navigator = null;
            expect(service.isOnline).toBe(true);
        });
    });
});

describe('StorageService', () => {
    let service;
    let mockStorage;
    let originalConsoleError;

    beforeEach(() => {
        // Mock console to suppress expected errors
        originalConsoleError = console.error;
        console.error = jest.fn();
        
        mockStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            length: 0,
            key: jest.fn(),
            clear: jest.fn()
        };
        
        Object.defineProperty(window, 'localStorage', {
            value: mockStorage,
            writable: true
        });
        
        service = new StorageService();
    });

    afterEach(() => {
        console.error = originalConsoleError;
        delete window.localStorage;
    });

    describe('save', () => {
        test('saves data with prefix', () => {
            const data = { test: 'value' };
            service.save('key', data);
            
            expect(mockStorage.setItem).toHaveBeenCalledWith(
                'analemma_key',
                JSON.stringify(data)
            );
        });

        test('returns false when storage not available', () => {
            service._storage = null;
            expect(service.save('key', 'value')).toBe(false);
        });

        test('handles storage errors gracefully', () => {
            mockStorage.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });
            
            expect(service.save('key', 'value')).toBe(false);
        });
    });

    describe('load', () => {
        test('loads data with prefix', () => {
            const data = { test: 'value' };
            mockStorage.getItem.mockReturnValue(JSON.stringify(data));
            
            const result = service.load('key');
            
            expect(mockStorage.getItem).toHaveBeenCalledWith('analemma_key');
            expect(result).toEqual(data);
        });

        test('returns null when item not found', () => {
            mockStorage.getItem.mockReturnValue(null);
            expect(service.load('key')).toBeNull();
        });

        test('returns null when storage not available', () => {
            service._storage = null;
            expect(service.load('key')).toBeNull();
        });

        test('handles JSON parse errors', () => {
            mockStorage.getItem.mockReturnValue('invalid json');
            expect(service.load('key')).toBeNull();
        });
    });

    describe('remove', () => {
        test('removes item with prefix', () => {
            service.remove('key');
            expect(mockStorage.removeItem).toHaveBeenCalledWith('analemma_key');
        });

        test('returns false when storage not available', () => {
            service._storage = null;
            expect(service.remove('key')).toBe(false);
        });
    });
});

describe('NetworkService', () => {
    let service;
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
        global.fetch = jest.fn();
        service = new NetworkService();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('checkConnectivity', () => {
        test('returns true when fetch succeeds', async () => {
            global.fetch.mockResolvedValue({ ok: true });
            
            const result = await service.checkConnectivity();
            
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://www.google.com/favicon.ico',
                { mode: 'no-cors', cache: 'no-cache' }
            );
        });

        test('returns false when fetch fails', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));
            
            const result = await service.checkConnectivity();
            
            expect(result).toBe(false);
        });
    });

    describe('monitorConnectivity', () => {
        test('sets up event listeners and returns cleanup function', () => {
            const callback = jest.fn();
            const addEventListener = jest.spyOn(window, 'addEventListener');
            const removeEventListener = jest.spyOn(window, 'removeEventListener');
            
            const cleanup = service.monitorConnectivity(callback);
            
            expect(addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
            expect(addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
            
            // Trigger online event
            window.dispatchEvent(new Event('online'));
            expect(callback).toHaveBeenCalledWith(true);
            
            // Trigger offline event
            window.dispatchEvent(new Event('offline'));
            expect(callback).toHaveBeenCalledWith(false);
            
            // Cleanup
            cleanup();
            expect(removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
            expect(removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
        });
    });
});

describe('TimerService', () => {
    let service;

    beforeEach(() => {
        jest.useFakeTimers();
        service = new TimerService();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('sets interval and tracks timer', () => {
        const callback = jest.fn();
        const timerId = service.setInterval(callback, 1000);
        
        expect(service.timers.has(timerId)).toBe(true);
        
        jest.advanceTimersByTime(3000);
        expect(callback).toHaveBeenCalledTimes(3);
    });

    test('clears specific interval', () => {
        const callback = jest.fn();
        const timerId = service.setInterval(callback, 1000);
        
        service.clearInterval(timerId);
        expect(service.timers.has(timerId)).toBe(false);
        
        jest.advanceTimersByTime(2000);
        expect(callback).not.toHaveBeenCalled();
    });

    test('clears all intervals', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        
        service.setInterval(callback1, 1000);
        service.setInterval(callback2, 2000);
        
        expect(service.timers.size).toBe(2);
        
        service.clearAll();
        expect(service.timers.size).toBe(0);
        
        jest.advanceTimersByTime(3000);
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
    });
}); 