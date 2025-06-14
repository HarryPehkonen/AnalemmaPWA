/**
 * Analemma Calculations Module
 * Handles loading and processing of pre-calculated analemma data
 */

let analemmaCacheData = null;

async function loadAnalemmaData() {
    if (analemmaCacheData) {
        return analemmaCacheData;
    }

    try {
        const response = await fetch('assets/analemma-data.json');
        if (!response.ok) {
            throw new Error(`Failed to load analemma data: ${response.status}`);
        }
        
        analemmaCacheData = await response.json();
        console.log('Analemma data loaded successfully');
        return analemmaCacheData;
    } catch (error) {
        console.error('Error loading analemma data:', error);
        throw new Error('Could not load analemma coordinate data');
    }
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

async function getAnalemmaCoordinatesForDate(date = new Date()) {
    const data = await loadAnalemmaData();
    const dayOfYear = getDayOfYear(date);
    
    const maxDay = Object.keys(data.data).length;
    const adjustedDay = Math.min(dayOfYear, maxDay);
    
    const coordinates = data.data[adjustedDay];
    if (!coordinates) {
        throw new Error(`No analemma data found for day ${adjustedDay}`);
    }
    
    return {
        x: coordinates[0],
        y: coordinates[1],
        dayOfYear: adjustedDay,
        date: date
    };
}

async function getAllAnalemmaCoordinates() {
    const data = await loadAnalemmaData();
    
    return Object.entries(data.data).map(([day, coords]) => ({
        dayOfYear: parseInt(day),
        x: coords[0],
        y: coords[1],
    }));
}

function convertToSVGCoordinates(coordinates, svgBounds = {width: 400, height: 300}, padding = {top: 30, right: 30, bottom: 30, left: 30}) {
    const xValues = coordinates.map(c => c.x);
    const yValues = coordinates.map(c => c.y);
    
    const dataBounds = {
        xMin: Math.min(...xValues),
        xMax: Math.max(...xValues),
        yMin: Math.min(...yValues),
        yMax: Math.max(...yValues)
    };
    


    
    const drawWidth = svgBounds.width - padding.left - padding.right;
    const drawHeight = svgBounds.height - padding.top - padding.bottom;
    
    const xScale = drawWidth / (dataBounds.xMax - dataBounds.xMin);
    const yScale = drawHeight / (dataBounds.yMax - dataBounds.yMin);
    

    
    if (isNaN(xScale) || isNaN(yScale)) {
        console.error('❌ SCALES ARE NaN!', { xScale, yScale, drawWidth, drawHeight, dataBounds });
    }
    
    return coordinates.map(coord => ({
        ...coord,
        svgX: padding.left + (coord.x - dataBounds.xMin) * xScale,
        svgY: padding.top + (dataBounds.yMax - coord.y) * yScale
    }));
}

function applyHemisphereCorrection(coordinates, latitude, svgBounds = {height: 300}) {
    if (latitude < 0) {
        return coordinates.map(coord => ({
            ...coord,
            svgY: svgBounds.height - coord.svgY
        }));
    }
    
    return coordinates;
}

function generateSVGPath(coordinates) {
    if (coordinates.length === 0) {
        return '';
    }
    
    const sortedCoords = [...coordinates].sort((a, b) => a.dayOfYear - b.dayOfYear);
    
    let pathString = `M ${sortedCoords[0].svgX} ${sortedCoords[0].svgY}`;
    
    for (let i = 1; i < sortedCoords.length; i++) {
        pathString += ` L ${sortedCoords[i].svgX} ${sortedCoords[i].svgY}`;
    }
    
    pathString += ' Z';
    
    return pathString;
}

async function getAnalemmaBounds() {
    const data = await loadAnalemmaData();
    return data.metadata?.bounds || null;
}

async function getAnalemmaMetadata() {
    const data = await loadAnalemmaData();
    return data.metadata || {};
}

window.AnalemmaCalculations = {
    loadAnalemmaData,
    getAnalemmaCoordinatesForDate,
    getAllAnalemmaCoordinates,
    convertToSVGCoordinates,
    applyHemisphereCorrection,
    generateSVGPath,
    getAnalemmaBounds,
    getAnalemmaMetadata,
    getDayOfYear
}; 