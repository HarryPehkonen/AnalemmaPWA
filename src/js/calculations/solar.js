/**
 * Solar Calculations Module
 * Functions for calculating solar noon time, solar elevation, and related astronomical values
 */

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 * @param {number} radians 
 * @returns {number} Degrees
 */
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Get day of year from date
 * @param {Date} date 
 * @returns {number} Day of year (1-366)
 */
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

/**
 * Calculate solar declination angle
 * @param {number} dayOfYear Day of year (1-366)
 * @returns {number} Solar declination in degrees
 */
function calculateSolarDeclination(dayOfYear) {
    // Solar declination calculation
    const P = Math.asin(0.39795 * Math.cos(toRadians(0.98563 * (dayOfYear - 173) + 1.914 * Math.sin(toRadians(0.98563 * (dayOfYear - 2))))));
    return toDegrees(P);
}

/**
 * Calculate equation of time
 * @param {number} dayOfYear Day of year (1-366)
 * @returns {number} Equation of time in minutes
 */
function calculateEquationOfTime(dayOfYear) {
    // Equation of time calculation
    const B = toRadians(360 * (dayOfYear - 81) / 365);
    const E = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    return E;
}

/**
 * Calculate solar noon time for a given location and date
 * @param {number} longitude Longitude in degrees (positive east, negative west)
 * @param {Date} date Date to calculate for (default: today)
 * @returns {Date} Solar noon time as Date object
 */
function calculateSolarNoon(longitude, date = new Date()) {
    const dayOfYear = getDayOfYear(date);
    const equationOfTime = calculateEquationOfTime(dayOfYear);
    
    // Calculate solar noon in UTC
    // Solar noon occurs when the sun is at its highest point
    // Longitude adjustment: 15 degrees = 1 hour
    const solarNoonUTC = 12 - (longitude / 15) - (equationOfTime / 60);
    
    // Create solar noon time for the given date
    const solarNoonDate = new Date(date);
    const hours = Math.floor(solarNoonUTC);
    const minutes = (solarNoonUTC - hours) * 60;
    
    solarNoonDate.setUTCHours(hours, minutes, 0, 0);
    
    return solarNoonDate;
}

/**
 * Calculate solar elevation angle at solar noon
 * @param {number} latitude Latitude in degrees (positive north, negative south)
 * @param {Date} date Date to calculate for (default: today)
 * @returns {number} Solar elevation angle in degrees
 */
function calculateSolarElevationAtNoon(latitude, date = new Date()) {
    const dayOfYear = getDayOfYear(date);
    const solarDeclination = calculateSolarDeclination(dayOfYear);
    
    // Solar elevation at solar noon = 90° - |latitude - declination|
    const elevation = 90 - Math.abs(latitude - solarDeclination);
    
    return elevation;
}

/**
 * Check if the sun is below the horizon at solar noon (extreme latitudes)
 * @param {number} latitude Latitude in degrees
 * @param {Date} date Date to check (default: today)
 * @returns {boolean} True if sun is below horizon at solar noon
 */
function isSunBelowHorizonAtNoon(latitude, date = new Date()) {
    const elevation = calculateSolarElevationAtNoon(latitude, date);
    return elevation < 0;
}

/**
 * Format time for display (handles both 12-hour and 24-hour formats)
 * @param {Date} date Date to format
 * @param {boolean} use24Hour Use 24-hour format (default: false)
 * @returns {string} Formatted time string
 */
function formatSolarNoonTime(date, use24Hour = false) {
    if (use24Hour) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } else {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
}

/**
 * Get hemisphere direction for looking at analemma
 * @param {number} latitude Latitude in degrees
 * @returns {string} Direction to look ('N' or 'S')
 */
function getAnalemmaDirection(latitude) {
    // Northern hemisphere looks south, southern hemisphere looks north
    // At equator (lat = 0), look north as specified in requirements
    return latitude > 0 ? 'S' : 'N';
}

/**
 * Validate latitude and longitude values
 * @param {number} latitude Latitude in degrees
 * @param {number} longitude Longitude in degrees
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateCoordinates(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return { isValid: false, error: 'Coordinates must be numbers' };
    }
    
    if (latitude < -90 || latitude > 90) {
        return { isValid: false, error: 'Latitude must be between -90 and 90 degrees' };
    }
    
    if (longitude < -180 || longitude > 180) {
        return { isValid: false, error: 'Longitude must be between -180 and 180 degrees' };
    }
    
    return { isValid: true };
}

// Export functions for use in other modules
window.SolarCalculations = {
    calculateSolarNoon,
    calculateSolarElevationAtNoon,
    isSunBelowHorizonAtNoon,
    formatSolarNoonTime,
    getAnalemmaDirection,
    validateCoordinates,
    getDayOfYear,
    calculateSolarDeclination,
    calculateEquationOfTime
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.SolarCalculations;
} 