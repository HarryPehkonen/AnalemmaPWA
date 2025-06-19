/**
 * Analemma Renderer
 * Pure functions for calculating analemma visualization data
 * No DOM manipulation, returns data objects only
 */

// Import calculation modules
const SolarCalculations = (typeof window !== 'undefined' && window.SolarCalculations) || 
                         (typeof require !== 'undefined' && require('../calculations/solar.js'));
const AnalemmaCalculations = (typeof window !== 'undefined' && window.AnalemmaCalculations) || 
                            (typeof require !== 'undefined' && require('../calculations/analemma.js'));

class AnalemmaRenderer {
    constructor() {
        this.svgWidth = 400;
        this.svgHeight = 600;
        this.padding = 40;
    }

    /**
     * Generate complete analemma visualization data
     * @param {Object} location Location object with latitude/longitude
     * @param {Date} date Current date
     * @returns {Promise<Object>} Visualization data
     */
    async generateVisualization(location, date) {
        if (!location) {
            return {
                path: null,
                sunPosition: null,
                direction: null,
                isExtreme: false,
                error: 'No location provided'
            };
        }

        try {
            // Check for extreme latitude
            const isExtreme = SolarCalculations.isSunBelowHorizonAtNoon(
                location.latitude,
                date
            );

            // Get analemma path
            const pathData = await this.calculatePath(location, date);

            // Get current sun position
            const sunPosition = await this.calculateSunPosition(location, date);

            // Get viewing direction
            const direction = this.calculateDirection(location.latitude);

            return {
                path: pathData,
                sunPosition,
                direction,
                isExtreme,
                error: null
            };
        } catch (error) {
            console.error('Analemma visualization error:', error);
            return {
                path: null,
                sunPosition: null,
                direction: null,
                isExtreme: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate analemma path data
     * @param {Object} location Location object
     * @param {Date} date Current date for reference
     * @returns {Promise<Object>} Path data object
     */
    async calculatePath(location, date) {
        // Get all analemma coordinates
        const allCoords = await AnalemmaCalculations.getAllAnalemmaCoordinates();
        
        // Get today's coordinates to ensure consistent scaling
        const todayCoords = await AnalemmaCalculations.getAnalemmaCoordinatesForDate(date);
        
        // Combine for consistent bounds calculation
        const allCoordsWithToday = [...allCoords, todayCoords];
        
        // Convert to SVG coordinates
        const svgCoords = AnalemmaCalculations.convertToSVGCoordinates(allCoordsWithToday);
        
        // Separate analemma path from today's position
        const analemmaCoords = svgCoords.slice(0, allCoords.length);
        
        // Apply hemisphere correction
        const correctedCoords = AnalemmaCalculations.applyHemisphereCorrection(
            analemmaCoords,
            location.latitude
        );
        
        // Generate SVG path string
        const pathString = AnalemmaCalculations.generateSVGPath(correctedCoords);
        
        return {
            pathString,
            coordinates: correctedCoords,
            bounds: this.calculateBounds(correctedCoords)
        };
    }

    /**
     * Calculate current sun position
     * @param {Object} location Location object
     * @param {Date} date Current date
     * @returns {Promise<Object>} Sun position data
     */
    async calculateSunPosition(location, date) {
        // Get today's analemma coordinates
        const todayCoords = await AnalemmaCalculations.getAnalemmaCoordinatesForDate(date);
        
        // Need to get all coordinates to ensure consistent scaling
        const allCoords = await AnalemmaCalculations.getAllAnalemmaCoordinates();
        const allCoordsWithToday = [...allCoords, todayCoords];
        
        // Convert to SVG coordinates
        const svgCoords = AnalemmaCalculations.convertToSVGCoordinates(allCoordsWithToday);
        
        // Get today's SVG coordinates (last in array)
        const todaySvgCoords = svgCoords.slice(-1);
        
        // Apply hemisphere correction
        const corrected = AnalemmaCalculations.applyHemisphereCorrection(
            todaySvgCoords,
            location.latitude
        );
        
        if (corrected.length === 0) {
            return null;
        }
        
        const position = corrected[0];
        
        return {
            x: position.svgX,
            y: position.svgY,
            elevation: todayCoords.elevation,
            azimuth: todayCoords.azimuth,
            date: todayCoords.date
        };
    }

    /**
     * Calculate viewing direction
     * @param {number} latitude Latitude in degrees
     * @returns {Object} Direction data
     */
    calculateDirection(latitude) {
        const direction = SolarCalculations.getAnalemmaDirection(latitude);
        return {
            direction,
            rotation: latitude < 0 ? 180 : 0, // Rotate arrow for Southern Hemisphere
            label: `Looking ${direction === 'N' ? 'North' : 'South'}`
        };
    }

    /**
     * Calculate bounds of coordinates
     * @param {Array} coordinates Array of coordinate objects
     * @returns {Object} Bounds object
     */
    calculateBounds(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        coordinates.forEach(coord => {
            minX = Math.min(minX, coord.svgX);
            maxX = Math.max(maxX, coord.svgX);
            minY = Math.min(minY, coord.svgY);
            maxY = Math.max(maxY, coord.svgY);
        });

        return { minX, maxX, minY, maxY };
    }

    /**
     * Generate sun icon data
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {number} radius Sun radius
     * @returns {Object} Sun icon data
     */
    generateSunIcon(x, y, radius = 8) {
        return {
            center: { x, y },
            radius,
            rays: [
                { x1: x - radius - 4, y1: y, x2: x - radius, y2: y },
                { x1: x + radius, y1: y, x2: x + radius + 4, y2: y },
                { x1: x, y1: y - radius - 4, x2: x, y2: y - radius },
                { x1: x, y1: y + radius, x2: x, y2: y + radius + 4 },
                // Diagonal rays
                { x1: x - radius * 0.7 - 3, y1: y - radius * 0.7 - 3, 
                  x2: x - radius * 0.7, y2: y - radius * 0.7 },
                { x1: x + radius * 0.7, y1: y + radius * 0.7, 
                  x2: x + radius * 0.7 + 3, y2: y + radius * 0.7 + 3 },
                { x1: x + radius * 0.7, y1: y - radius * 0.7, 
                  x2: x + radius * 0.7 + 3, y2: y - radius * 0.7 - 3 },
                { x1: x - radius * 0.7 - 3, y1: y + radius * 0.7 + 3, 
                  x2: x - radius * 0.7, y2: y + radius * 0.7 }
            ],
            colors: {
                fill: '#FFD700',
                stroke: '#FFA500'
            }
        };
    }

    /**
     * Get SVG viewBox for the visualization
     * @returns {string} ViewBox string
     */
    getViewBox() {
        return `0 0 ${this.svgWidth} ${this.svgHeight}`;
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalemmaRenderer;
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.AnalemmaRenderer = AnalemmaRenderer;
} 