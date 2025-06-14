/**
 * Unit Tests for Solar Calculations
 */

// Simple DOM mock for tests
global.window = {};

// Load the solar calculations module by requiring and executing the code
const fs = require('fs');
const path = require('path');

// Read and execute the solar calculations code
const solarCalcCode = fs.readFileSync(path.join(__dirname, '../../src/js/calculations/solar.js'), 'utf8');
eval(solarCalcCode);

const SolarCalculations = global.window.SolarCalculations;

describe('Solar Calculations', () => {
    describe('validateCoordinates', () => {
        test('should validate correct coordinates', () => {
            const result = SolarCalculations.validateCoordinates(40.7128, -74.0060);
            expect(result.isValid).toBe(true);
        });

        test('should reject invalid latitude', () => {
            const result = SolarCalculations.validateCoordinates(95, -74.0060);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Latitude must be between');
        });

        test('should reject invalid longitude', () => {
            const result = SolarCalculations.validateCoordinates(40.7128, 185);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Longitude must be between');
        });

        test('should reject non-numeric inputs', () => {
            const result = SolarCalculations.validateCoordinates('invalid', -74.0060);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('must be numbers');
        });
    });

    describe('getDayOfYear', () => {
        test('should calculate day of year correctly', () => {
            const jan1 = new Date(2024, 0, 1);
            expect(SolarCalculations.getDayOfYear(jan1)).toBe(1);

            const dec31 = new Date(2024, 11, 31);
            expect(SolarCalculations.getDayOfYear(dec31)).toBe(366);

            const july4 = new Date(2024, 6, 4);
            expect(SolarCalculations.getDayOfYear(july4)).toBe(185);
        });
    });

    describe('calculateSolarDeclination', () => {
        test('should calculate solar declination for known dates', () => {
            const winterSolstice = SolarCalculations.calculateSolarDeclination(355);
            expect(winterSolstice).toBeLessThan(-20);
            expect(winterSolstice).toBeGreaterThan(-25);

            const summerSolstice = SolarCalculations.calculateSolarDeclination(172);
            expect(summerSolstice).toBeGreaterThan(20);
            expect(summerSolstice).toBeLessThan(25);

            const springEquinox = SolarCalculations.calculateSolarDeclination(80);
            expect(Math.abs(springEquinox)).toBeLessThan(5);
        });
    });

    describe('calculateEquationOfTime', () => {
        test('should calculate equation of time within expected range', () => {
            const eot1 = SolarCalculations.calculateEquationOfTime(1);
            const eot100 = SolarCalculations.calculateEquationOfTime(100);
            const eot200 = SolarCalculations.calculateEquationOfTime(200);
            const eot300 = SolarCalculations.calculateEquationOfTime(300);

            [eot1, eot100, eot200, eot300].forEach(eot => {
                expect(eot).toBeGreaterThan(-17);
                expect(eot).toBeLessThan(17);
            });
        });
    });

    describe('calculateSolarNoon', () => {
        test('should calculate solar noon for NYC', () => {
            const longitude = -74.0060;
            const testDate = new Date(2024, 5, 21);
            
            const solarNoon = SolarCalculations.calculateSolarNoon(longitude, testDate);
            
            expect(solarNoon).toBeInstanceOf(Date);
            
            const utcHour = solarNoon.getUTCHours();
            expect(utcHour).toBeGreaterThan(11);
            expect(utcHour).toBeLessThan(18);
        });
    });

    describe('calculateSolarElevationAtNoon', () => {
        test('should calculate solar elevation for mid-latitudes', () => {
            const latitude = 40;
            const testDate = new Date(2024, 5, 21);
            
            const elevation = SolarCalculations.calculateSolarElevationAtNoon(latitude, testDate);
            
            expect(elevation).toBeGreaterThan(70);
            expect(elevation).toBeLessThan(80);
        });
    });

    describe('isSunBelowHorizonAtNoon', () => {
        test('should detect polar night conditions', () => {
            const arcticLatitude = 75;
            const winterDate = new Date(2024, 11, 21);
            
            const isBelowHorizon = SolarCalculations.isSunBelowHorizonAtNoon(arcticLatitude, winterDate);
            expect(isBelowHorizon).toBe(true);
        });

        test('should not detect polar night at moderate latitudes', () => {
            const moderateLatitude = 45;
            const winterDate = new Date(2024, 11, 21);
            
            const isBelowHorizon = SolarCalculations.isSunBelowHorizonAtNoon(moderateLatitude, winterDate);
            expect(isBelowHorizon).toBe(false);
        });
    });

    describe('getAnalemmaDirection', () => {
        test('should return correct direction for hemispheres', () => {
            expect(SolarCalculations.getAnalemmaDirection(45)).toBe('S');
            expect(SolarCalculations.getAnalemmaDirection(-45)).toBe('N');
            expect(SolarCalculations.getAnalemmaDirection(0)).toBe('N');
        });
    });

    describe('formatSolarNoonTime', () => {
        test('should format time correctly in 12-hour format', () => {
            const testDate = new Date(2024, 0, 1, 13, 30, 45);
            const formatted = SolarCalculations.formatSolarNoonTime(testDate, false);
            
            expect(formatted).toMatch(/1:30:45\s*(PM|pm)/);
        });

        test('should format time correctly in 24-hour format', () => {
            const testDate = new Date(2024, 0, 1, 13, 30, 45);
            const formatted = SolarCalculations.formatSolarNoonTime(testDate, true);
            
            expect(formatted).toBe('13:30:45');
        });
    });
}); 