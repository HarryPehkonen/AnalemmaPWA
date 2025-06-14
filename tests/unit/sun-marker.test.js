/**
 * Unit Tests for Sun Marker Positioning
 * Specific tests to debug the sun marker coordinate issue
 */

// Simple DOM mock for tests
global.window = {};

// Load the required modules
const fs = require('fs');
const path = require('path');

// Read and execute the calculation modules
const analemmacCalcCode = fs.readFileSync(path.join(__dirname, '../../src/js/calculations/analemma.js'), 'utf8');
const solarCalcCode = fs.readFileSync(path.join(__dirname, '../../src/js/calculations/solar.js'), 'utf8');

eval(analemmacCalcCode);
eval(solarCalcCode);

const AnalemmaCalculations = global.window.AnalemmaCalculations;
const SolarCalculations = global.window.SolarCalculations;

describe('Sun Marker Positioning Tests', () => {
    let mockAnalemmaData;
    
    beforeEach(() => {
        // Create mock analemma data similar to what we generate
        mockAnalemmaData = {
            metadata: {
                bounds: {
                    equationOfTime: { min: -14.6, max: 16.45 },
                    declination: { min: -23.45, max: 23.45 }
                }
            },
            data: {}
        };
        
        // Generate some sample data points for testing
        for (let day = 1; day <= 10; day++) {
            // Mock some realistic equation of time and declination values
            const eot = -10 + (day * 2); // Spread from -10 to +10
            const dec = -20 + (day * 4); // Spread from -20 to +20
            mockAnalemmaData.data[day] = [eot, dec];
        }
        
        // Mock the loadAnalemmaData function
        global.window.AnalemmaCalculations.loadAnalemmaData = async () => mockAnalemmaData;
    });

    test('should load analemma data correctly', async () => {
        const data = await AnalemmaCalculations.loadAnalemmaData();
        expect(data).toBeDefined();
        expect(data.data).toBeDefined();
        expect(Object.keys(data.data).length).toBeGreaterThan(0);
    });

    test('should get coordinates for a specific date', async () => {
        const testDate = new Date(2024, 0, 5); // January 5th (day 5)
        const coords = await AnalemmaCalculations.getAnalemmaCoordinatesForDate(testDate);
        
        expect(coords).toBeDefined();
        expect(coords.x).toBeDefined(); // Equation of time
        expect(coords.y).toBeDefined(); // Solar declination
        expect(coords.dayOfYear).toBe(5);
        
        console.log('Day 5 coordinates:', coords);
    });

    test('should convert coordinates to SVG space consistently', async () => {
        // Get all coordinates
        const allCoords = await AnalemmaCalculations.getAllAnalemmaCoordinates();
        const todayCoords = await AnalemmaCalculations.getAnalemmaCoordinatesForDate(new Date(2024, 0, 5));
        
        console.log('All coordinates count:', allCoords.length);
        console.log('Today coordinates:', todayCoords);
        
        // Test the current (broken) approach - converting separately
        const allSvgCoords = AnalemmaCalculations.convertToSVGCoordinates(allCoords);
        const todaySvgCoords = AnalemmaCalculations.convertToSVGCoordinates([todayCoords]);
        
        console.log('Separate conversion - All coords bounds:');
        console.log('X range:', Math.min(...allSvgCoords.map(c => c.svgX)), 'to', Math.max(...allSvgCoords.map(c => c.svgX)));
        console.log('Y range:', Math.min(...allSvgCoords.map(c => c.svgY)), 'to', Math.max(...allSvgCoords.map(c => c.svgY)));
        console.log('Today SVG coords (separate):', todaySvgCoords[0]);
        
        // Test the fixed approach - converting together
        const allCoordsWithToday = [...allCoords, todayCoords];
        const combinedSvgCoords = AnalemmaCalculations.convertToSVGCoordinates(allCoordsWithToday);
        const analemmaCoords = combinedSvgCoords.slice(0, allCoords.length);
        const todayCombined = combinedSvgCoords.slice(-1)[0];
        
        console.log('Combined conversion - All coords bounds:');
        console.log('X range:', Math.min(...analemmaCoords.map(c => c.svgX)), 'to', Math.max(...analemmaCoords.map(c => c.svgX)));
        console.log('Y range:', Math.min(...analemmaCoords.map(c => c.svgY)), 'to', Math.max(...analemmaCoords.map(c => c.svgY)));
        console.log('Today SVG coords (combined):', todayCombined);
        
        // The coordinates should be within the SVG bounds (0-400 for x, 0-300 for y with padding)
        expect(todayCombined.svgX).toBeGreaterThan(0);
        expect(todayCombined.svgX).toBeLessThan(400);
        expect(todayCombined.svgY).toBeGreaterThan(0);
        expect(todayCombined.svgY).toBeLessThan(300);
        
        // The combined approach should place today's coordinates within the analemma bounds
        const analemmaXMin = Math.min(...analemmaCoords.map(c => c.svgX));
        const analemmaXMax = Math.max(...analemmaCoords.map(c => c.svgX));
        const analemmaYMin = Math.min(...analemmaCoords.map(c => c.svgY));
        const analemmaYMax = Math.max(...analemmaCoords.map(c => c.svgY));
        
        expect(todayCombined.svgX).toBeGreaterThanOrEqual(analemmaXMin);
        expect(todayCombined.svgX).toBeLessThanOrEqual(analemmaXMax);
        expect(todayCombined.svgY).toBeGreaterThanOrEqual(analemmaYMin);
        expect(todayCombined.svgY).toBeLessThanOrEqual(analemmaYMax);
    });

    test('should demonstrate the coordinate bounds issue', async () => {
        const testCoord = { x: 5.0, y: 10.0, dayOfYear: 150 };
        
        const singleResult = AnalemmaCalculations.convertToSVGCoordinates([testCoord]);
        console.log('Single coordinate result:', singleResult[0]);
        
        const rangeCoords = [
            { x: -14.6, y: -23.45, dayOfYear: 1 },
            { x: 16.45, y: 23.45, dayOfYear: 172 },
            { x: 5.0, y: 10.0, dayOfYear: 150 }
        ];
        
        const rangeResult = AnalemmaCalculations.convertToSVGCoordinates(rangeCoords);
        const testPointInRange = rangeResult[2];
        
        console.log('Range result for same point:', testPointInRange);
        console.log('X difference:', Math.abs(singleResult[0].svgX - testPointInRange.svgX));
        console.log('Y difference:', Math.abs(singleResult[0].svgY - testPointInRange.svgY));
        
        expect(singleResult[0].svgX).not.toEqual(testPointInRange.svgX);
        expect(singleResult[0].svgY).not.toEqual(testPointInRange.svgY);
    });

    test('should verify the actual coordinate ranges from data', async () => {
        const allCoords = await AnalemmaCalculations.getAllAnalemmaCoordinates();
        
        const xValues = allCoords.map(c => c.x);
        const yValues = allCoords.map(c => c.y);
        
        const actualBounds = {
            xMin: Math.min(...xValues),
            xMax: Math.max(...xValues),
            yMin: Math.min(...yValues),
            yMax: Math.max(...yValues)
        };
        
        console.log('Actual data bounds:', actualBounds);
        
        // These should match approximately with our expected analemma bounds
        expect(actualBounds.xMin).toBeLessThan(0); // Equation of time goes negative
        expect(actualBounds.xMax).toBeGreaterThan(0); // And positive
        expect(actualBounds.yMin).toBeLessThan(0); // Declination goes negative (winter)
        expect(actualBounds.yMax).toBeGreaterThan(0); // And positive (summer)
    });

    test('should position June 14th sun correctly', async () => {
        const june14 = new Date(2024, 5, 14); // June 14th (month is 0-indexed)
        const dayOfYear = SolarCalculations.getDayOfYear(june14);
        
        console.log('June 14th day of year:', dayOfYear);
        
        const coords = await AnalemmaCalculations.getAnalemmaCoordinatesForDate(june14);
        console.log('June 14th analemma coordinates:', coords);
        
        // June 14th should be:
        // - Near summer solstice, so high positive declination
        // - Equation of time should be small/negative in June
        expect(coords.y).toBeGreaterThan(15); // High declination (summer)
        expect(coords.x).toBeLessThan(5); // Small/negative equation of time
        
        // Test SVG positioning with proper bounds
        const allCoords = await AnalemmaCalculations.getAllAnalemmaCoordinates();
        const allWithToday = [...allCoords, coords];
        const svgCoords = AnalemmaCalculations.convertToSVGCoordinates(allWithToday);
        const june14Svg = svgCoords[svgCoords.length - 1];
        
        console.log('June 14th SVG coordinates:', june14Svg);
        
        // Should be positioned in upper part of analemma (high Y value means lower on screen)
        // With SVG Y-axis flipped, high declination should result in LOW Y values
        expect(june14Svg.svgY).toBeLessThan(150); // Upper half of 300px height
    });
}); 