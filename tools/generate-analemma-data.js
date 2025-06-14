/**
 * Analemma Data Generation Script
 * Generates pre-calculated coordinates for the analemma visualization
 * Output: JSON file with equation of time and solar declination for each day
 */

const fs = require('fs');
const path = require('path');

/**
 * Calculate the day of year from date
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
 * Calculate Julian Day Number
 * @param {Date} date 
 * @returns {number} Julian Day Number
 */
function getJulianDayNumber(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

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
 * Calculate solar declination angle
 * @param {number} dayOfYear Day of year (1-366)
 * @returns {number} Solar declination in degrees
 */
function calculateSolarDeclination(dayOfYear) {
    // Solar declination calculation using more accurate formula
    const P = Math.asin(0.39795 * Math.cos(toRadians(0.98563 * (dayOfYear - 173) + 1.914 * Math.sin(toRadians(0.98563 * (dayOfYear - 2))))));
    return toDegrees(P);
}

/**
 * Calculate equation of time
 * @param {number} dayOfYear Day of year (1-366)
 * @returns {number} Equation of time in minutes
 */
function calculateEquationOfTime(dayOfYear) {
    // More accurate equation of time calculation
    const B = toRadians(360 * (dayOfYear - 81) / 365);
    
    // Equation of time in minutes
    const E = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    
    return E;
}

/**
 * Generate analemma data for all days of the year
 * @param {number} year Year to calculate (default: 2024 for leap year coverage)
 * @returns {Object} Analemma data object
 */
function generateAnalemmaData(year = 2024) {
    console.log(`Generating analemma data for year ${year}...`);
    
    const data = {};
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st
    
    // Check if it's a leap year
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    
    console.log(`Processing ${totalDays} days (${isLeapYear ? 'leap' : 'regular'} year)...`);
    
    for (let dayOfYear = 1; dayOfYear <= totalDays; dayOfYear++) {
        const currentDate = new Date(year, 0, dayOfYear);
        
        // Calculate solar declination and equation of time
        const declination = calculateSolarDeclination(dayOfYear);
        const equationOfTime = calculateEquationOfTime(dayOfYear);
        
        // Store the coordinates [x, y] where:
        // x = equation of time (minutes)
        // y = solar declination (degrees)
        data[dayOfYear] = [
            Math.round(equationOfTime * 100) / 100, // Round to 2 decimal places
            Math.round(declination * 100) / 100      // Round to 2 decimal places
        ];
        
        // Log progress every 50 days
        if (dayOfYear % 50 === 0 || dayOfYear === 1 || dayOfYear === totalDays) {
            const date = currentDate.toISOString().split('T')[0];
            console.log(`Day ${dayOfYear}: ${date} -> EoT: ${data[dayOfYear][0]}min, Dec: ${data[dayOfYear][1]}°`);
        }
    }
    
    // Calculate bounds for reference
    const eotValues = Object.values(data).map(d => d[0]);
    const decValues = Object.values(data).map(d => d[1]);
    
    const bounds = {
        equationOfTime: {
            min: Math.min(...eotValues),
            max: Math.max(...eotValues)
        },
        declination: {
            min: Math.min(...decValues),
            max: Math.max(...decValues)
        }
    };
    
    console.log('\nCalculated bounds:');
    console.log(`Equation of Time: ${bounds.equationOfTime.min} to ${bounds.equationOfTime.max} minutes`);
    console.log(`Solar Declination: ${bounds.declination.min} to ${bounds.declination.max} degrees`);
    
    return {
        metadata: {
            year: year,
            isLeapYear: isLeapYear,
            totalDays: totalDays,
            generated: new Date().toISOString(),
            coordinateSystem: {
                x: "Equation of Time (minutes)",
                y: "Solar Declination (degrees)"
            },
            bounds: bounds
        },
        data: data
    };
}

/**
 * Save data to JSON file
 * @param {Object} data Analemma data
 * @param {string} outputPath Output file path
 */
function saveToFile(data, outputPath) {
    try {
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write JSON file with pretty formatting
        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync(outputPath, jsonString);
        
        console.log(`\n✓ Analemma data saved to: ${outputPath}`);
        console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
    } catch (error) {
        console.error('Error saving file:', error);
        process.exit(1);
    }
}

// Main execution
function main() {
    console.log('🌞 Analemma Data Generator');
    console.log('=' .repeat(40));
    
    // Generate data for 2024 (leap year to include day 366)
    const analemmaData = generateAnalemmaData(2024);
    
    // Output path
    const outputPath = path.join(__dirname, '..', 'src', 'assets', 'analemma-data.json');
    
    // Save to file
    saveToFile(analemmaData, outputPath);
    
    console.log('\n✅ Analemma data generation complete!');
    console.log(`Total data points: ${Object.keys(analemmaData.data).length}`);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    generateAnalemmaData,
    calculateSolarDeclination,
    calculateEquationOfTime
}; 