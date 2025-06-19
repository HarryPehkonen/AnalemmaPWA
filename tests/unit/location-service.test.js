/**
 * Tests for LocationService module
 * Test location management functionality
 */

const LocationService = require('../../src/js/services/location-service.js');

describe('LocationService', () => {
    let service;
    let mockNavigator;
    let mockStorage;

    beforeEach(() => {
        // Mock dependencies
        mockNavigator = {
            getPosition: jest.fn(),
            getLocationPermissionState: jest.fn()
        };
        
        mockStorage = {
            save: jest.fn(),
            load: jest.fn(),
            remove: jest.fn()
        };
        
        service = new LocationService({
            navigator: mockNavigator,
            storage: mockStorage
        });
    });

    describe('requestLocation', () => {
        test('gets position and saves it', async () => {
            const mockLocation = {
                latitude: 40.7128,
                longitude: -74.0060,
                accuracy: 50,
                timestamp: Date.now()
            };
            
            mockNavigator.getPosition.mockResolvedValue(mockLocation);
            mockStorage.save.mockReturnValue(true);
            
            const location = await service.requestLocation();
            
            expect(location).toEqual(mockLocation);
            expect(mockNavigator.getPosition).toHaveBeenCalled();
            expect(mockStorage.save).toHaveBeenCalledWith('saved_location', mockLocation);
        });

        test('throws when position request fails', async () => {
            mockNavigator.getPosition.mockRejectedValue(new Error('Permission denied'));
            
            await expect(service.requestLocation()).rejects.toThrow('Permission denied');
        });
    });

    describe('getPermissionState', () => {
        test('returns permission state from navigator', async () => {
            mockNavigator.getLocationPermissionState.mockResolvedValue('granted');
            
            const state = await service.getPermissionState();
            
            expect(state).toBe('granted');
            expect(mockNavigator.getLocationPermissionState).toHaveBeenCalled();
        });
    });

    describe('getSavedLocation', () => {
        test('returns valid saved location', () => {
            const savedLocation = {
                latitude: 40.7128,
                longitude: -74.0060,
                accuracy: 50,
                timestamp: Date.now()
            };
            
            mockStorage.load.mockReturnValue(savedLocation);
            
            const location = service.getSavedLocation();
            
            expect(location).toEqual(savedLocation);
            expect(mockStorage.load).toHaveBeenCalledWith('saved_location');
        });

        test('returns null for invalid location', () => {
            const invalidLocation = {
                latitude: 200, // Invalid
                longitude: -74
            };
            
            mockStorage.load.mockReturnValue(invalidLocation);
            
            const location = service.getSavedLocation();
            
            expect(location).toBeNull();
        });

        test('returns null when no saved location', () => {
            mockStorage.load.mockReturnValue(null);
            
            const location = service.getSavedLocation();
            
            expect(location).toBeNull();
        });
    });

    describe('saveLocation', () => {
        test('saves valid location', () => {
            const location = {
                latitude: 40.7128,
                longitude: -74.0060
            };
            
            mockStorage.save.mockReturnValue(true);
            
            const result = service.saveLocation(location);
            
            expect(result).toBe(true);
            expect(mockStorage.save).toHaveBeenCalledWith('saved_location', location);
        });

        test('rejects invalid location', () => {
            const invalidLocation = {
                latitude: 'invalid',
                longitude: -74
            };
            
            const result = service.saveLocation(invalidLocation);
            
            expect(result).toBe(false);
            expect(mockStorage.save).not.toHaveBeenCalled();
        });
    });

    describe('isValidLocation', () => {
        test('validates correct location', () => {
            const validLocation = {
                latitude: 40.7128,
                longitude: -74.0060
            };
            
            expect(service.isValidLocation(validLocation)).toBe(true);
        });

        test('rejects location with invalid latitude', () => {
            expect(service.isValidLocation({ latitude: 91, longitude: 0 })).toBe(false);
            expect(service.isValidLocation({ latitude: -91, longitude: 0 })).toBe(false);
        });

        test('rejects location with invalid longitude', () => {
            expect(service.isValidLocation({ latitude: 0, longitude: 181 })).toBe(false);
            expect(service.isValidLocation({ latitude: 0, longitude: -181 })).toBe(false);
        });

        test('rejects null or invalid types', () => {
            expect(service.isValidLocation(null)).toBe(false);
            expect(service.isValidLocation({})).toBe(false);
            expect(service.isValidLocation({ latitude: 'string', longitude: 0 })).toBe(false);
        });
    });

    describe('formatLocationForDisplay', () => {
        test('formats northern hemisphere location', () => {
            const location = { latitude: 40.7128, longitude: -74.0060 };
            
            const formatted = service.formatLocationForDisplay(location);
            
            expect(formatted).toBe('40.7°N, 74.0°W');
        });

        test('formats southern hemisphere location', () => {
            const location = { latitude: -33.8688, longitude: 151.2093 };
            
            const formatted = service.formatLocationForDisplay(location);
            
            expect(formatted).toBe('33.9°S, 151.2°E');
        });

        test('handles null location', () => {
            const formatted = service.formatLocationForDisplay(null);
            expect(formatted).toBe('');
        });
    });

    describe('getAccuracyDescription', () => {
        test('returns high accuracy for < 50m', () => {
            expect(service.getAccuracyDescription(30)).toBe('High accuracy');
        });

        test('returns medium accuracy for 50-200m', () => {
            expect(service.getAccuracyDescription(100)).toBe('Medium accuracy');
        });

        test('returns low accuracy for > 200m', () => {
            expect(service.getAccuracyDescription(300)).toBe('Low accuracy');
        });

        test('handles null accuracy', () => {
            expect(service.getAccuracyDescription(null)).toBe('Unknown accuracy');
        });
    });

    describe('isLocationFresh', () => {
        const now = Date.now();

        test('returns true for recent location', () => {
            const location = { timestamp: now - 1000 }; // 1 second ago
            expect(service.isLocationFresh(location)).toBe(true);
        });

        test('returns false for old location', () => {
            const location = { timestamp: now - 10 * 60 * 1000 }; // 10 minutes ago
            expect(service.isLocationFresh(location)).toBe(false);
        });

        test('accepts custom max age', () => {
            const location = { timestamp: now - 1000 }; // 1 second ago
            expect(service.isLocationFresh(location, 500)).toBe(false); // Max 500ms
        });

        test('handles missing timestamp', () => {
            expect(service.isLocationFresh({})).toBe(false);
            expect(service.isLocationFresh(null)).toBe(false);
        });
    });

    describe('clearSavedLocation', () => {
        test('removes saved location', () => {
            mockStorage.remove.mockReturnValue(true);
            
            const result = service.clearSavedLocation();
            
            expect(result).toBe(true);
            expect(mockStorage.remove).toHaveBeenCalledWith('saved_location');
        });
    });
}); 