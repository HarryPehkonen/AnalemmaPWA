/**
 * Test Builders
 * Utility functions for creating consistent test data
 */

/**
 * Location data builder
 */
const locationBuilder = {
    /**
     * Build a valid location object
     * @param {Object} overrides Properties to override
     * @returns {Object} Location object
     */
    valid: (overrides = {}) => ({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 50,
        timestamp: Date.now(),
        ...overrides
    }),

    /**
     * Build a location in the northern hemisphere
     */
    northern: (overrides = {}) => locationBuilder.valid({
        latitude: 51.5074,
        longitude: -0.1278,
        ...overrides
    }),

    /**
     * Build a location in the southern hemisphere
     */
    southern: (overrides = {}) => locationBuilder.valid({
        latitude: -33.8688,
        longitude: 151.2093,
        ...overrides
    }),

    /**
     * Build a location near the equator
     */
    equatorial: (overrides = {}) => locationBuilder.valid({
        latitude: 0.3476,
        longitude: 32.5825,
        ...overrides
    }),

    /**
     * Build an extreme latitude location
     */
    extreme: (overrides = {}) => locationBuilder.valid({
        latitude: 71.0, // Above Arctic Circle
        longitude: 25.0,
        ...overrides
    }),

    /**
     * Build an old/cached location
     */
    cached: (overrides = {}) => locationBuilder.valid({
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        ...overrides
    }),

    /**
     * Build an invalid location
     */
    invalid: (overrides = {}) => ({
        latitude: 200, // Invalid latitude
        longitude: -74,
        ...overrides
    })
};

/**
 * Application state builder
 */
const stateBuilder = {
    /**
     * Build default/initial state
     */
    initial: (overrides = {}) => ({
        location: null,
        permissionState: null,
        isLoading: false,
        hasError: false,
        errorMessage: null,
        isOnline: true,
        currentDate: new Date(),
        ...overrides
    }),

    /**
     * Build loading state
     */
    loading: (overrides = {}) => stateBuilder.initial({
        isLoading: true,
        loadingMessage: 'Getting your location...',
        ...overrides
    }),

    /**
     * Build state with location
     */
    withLocation: (location = locationBuilder.valid(), overrides = {}) => 
        stateBuilder.initial({
            location,
            permissionState: 'granted',
            ...overrides
        }),

    /**
     * Build error state
     */
    error: (message = 'Test error', overrides = {}) => stateBuilder.initial({
        hasError: true,
        errorMessage: message,
        ...overrides
    }),

    /**
     * Build denied state
     */
    denied: (overrides = {}) => stateBuilder.initial({
        permissionState: 'denied',
        hasError: true,
        errorMessage: 'User denied permission',
        ...overrides
    }),

    /**
     * Build offline state
     */
    offline: (overrides = {}) => stateBuilder.initial({
        isOnline: false,
        ...overrides
    })
};

/**
 * Date builder utilities
 */
const dateBuilder = {
    /**
     * Build a date for a specific day of year
     * @param {number} dayOfYear Day of year (1-365)
     * @returns {Date} Date object
     */
    dayOfYear: (dayOfYear) => {
        const date = new Date();
        date.setMonth(0); // January
        date.setDate(dayOfYear);
        return date;
    },

    /**
     * Build summer solstice date
     */
    summerSolstice: () => dateBuilder.dayOfYear(172), // ~June 21

    /**
     * Build winter solstice date
     */
    winterSolstice: () => dateBuilder.dayOfYear(355), // ~Dec 21

    /**
     * Build spring equinox date
     */
    springEquinox: () => dateBuilder.dayOfYear(80), // ~March 20

    /**
     * Build fall equinox date
     */
    fallEquinox: () => dateBuilder.dayOfYear(264) // ~Sept 22
};

/**
 * Mock DOM element builder
 */
const elementBuilder = {
    /**
     * Build a mock DOM element
     * @param {string} tagName HTML tag name
     * @param {Object} properties Properties to add
     * @returns {Object} Mock element
     */
    create: (tagName = 'div', properties = {}) => ({
        tagName,
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false)
        },
        style: {},
        textContent: '',
        innerHTML: '',
        querySelector: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        ...properties
    }),

    /**
     * Build a button element
     */
    button: (properties = {}) => elementBuilder.create('button', {
        disabled: false,
        click: jest.fn(),
        ...properties
    }),

    /**
     * Build a div with status indicator
     */
    statusIndicator: (properties = {}) => elementBuilder.create('div', {
        className: 'status-indicator',
        querySelector: jest.fn(() => elementBuilder.create('span', {
            className: 'status-text'
        })),
        ...properties
    })
};

/**
 * Visualization data builder
 */
const visualizationBuilder = {
    /**
     * Build analemma visualization data
     */
    analemma: (overrides = {}) => ({
        path: {
            pathString: 'M 100 100 L 200 200 Z',
            coordinates: [],
            bounds: { minX: 0, maxX: 400, minY: 0, maxY: 300 }
        },
        sunPosition: {
            x: 150,
            y: 150,
            elevation: 45,
            azimuth: 180,
            date: new Date()
        },
        direction: {
            direction: 'S',
            rotation: 0,
            label: 'Looking South'
        },
        isExtreme: false,
        error: null,
        ...overrides
    }),

    /**
     * Build extreme latitude visualization
     */
    extreme: (overrides = {}) => visualizationBuilder.analemma({
        isExtreme: true,
        ...overrides
    })
};

// Export all builders
module.exports = {
    locationBuilder,
    stateBuilder,
    dateBuilder,
    elementBuilder,
    visualizationBuilder
}; 