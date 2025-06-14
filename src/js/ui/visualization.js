/**
 * Visualization Utilities Module
 * Helper functions for SVG rendering and analemma visualization
 */

/**
 * Create SVG element with namespace
 * @param {string} tagName SVG tag name
 * @param {Object} attributes Attributes to set
 * @returns {SVGElement} Created SVG element
 */
function createSVGElement(tagName, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    
    return element;
}

/**
 * Create sun icon SVG
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {number} size Size of the sun icon
 * @returns {SVGElement} Sun icon group element
 */
function createSunIcon(x, y, size = 8) {
    const group = createSVGElement('g');
    
    // Main sun circle
    const circle = createSVGElement('circle', {
        cx: x,
        cy: y,
        r: size,
        fill: '#FFD700',
        stroke: '#FFA500',
        'stroke-width': '2'
    });
    
    // Sun rays
    const rays = createSVGElement('g', {
        transform: `translate(${x}, ${y})`
    });
    
    const rayPath = createSVGElement('path', {
        d: `M-${size + 4},0 L-${size},0 M${size + 4},0 L${size},0 M0,-${size + 4} L0,-${size} M0,${size + 4} L0,${size} M-${size - 2},-${size - 2} L-${size + 2},-${size + 2} M${size - 2},${size - 2} L${size + 2},${size + 2} M${size - 2},-${size - 2} L${size + 2},-${size + 2} M-${size - 2},${size - 2} L-${size + 2},${size + 2}`,
        stroke: '#FFD700',
        'stroke-width': '2',
        'stroke-linecap': 'round'
    });
    
    rays.appendChild(rayPath);
    group.appendChild(circle);
    group.appendChild(rays);
    
    return group;
}

/**
 * Animate element with CSS transitions
 * @param {HTMLElement} element Element to animate
 * @param {Object} styles CSS styles to apply
 * @param {number} duration Animation duration in ms
 */
function animateElement(element, styles, duration = 300) {
    element.style.transition = `all ${duration}ms ease`;
    
    Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
    });
}

/**
 * Update SVG path with smooth animation
 * @param {SVGPathElement} pathElement Path element to update
 * @param {string} newPath New path data
 */
function updatePathWithAnimation(pathElement, newPath) {
    pathElement.style.transition = 'opacity 0.3s ease';
    pathElement.style.opacity = '0';
    
    setTimeout(() => {
        pathElement.setAttribute('d', newPath);
        pathElement.style.opacity = '1';
    }, 150);
}

/**
 * Get viewport dimensions for responsive SVG
 * @returns {Object} Viewport dimensions
 */
function getViewportDimensions() {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768
    };
}

/**
 * Scale coordinates for different screen sizes
 * @param {Array} coordinates Array of coordinate objects
 * @param {Object} viewport Viewport dimensions
 * @returns {Array} Scaled coordinates
 */
function scaleCoordinatesForViewport(coordinates, viewport) {
    const scale = viewport.isMobile ? 0.8 : 1.0;
    
    return coordinates.map(coord => ({
        ...coord,
        svgX: coord.svgX * scale,
        svgY: coord.svgY * scale
    }));
}

// Export functions for use in other modules
window.VisualizationUtils = {
    createSVGElement,
    createSunIcon,
    animateElement,
    updatePathWithAnimation,
    getViewportDimensions,
    scaleCoordinatesForViewport
}; 