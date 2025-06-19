/**
 * DOM Updater Service
 * Handles all DOM manipulation based on rendering data
 * Single responsibility: Update DOM elements
 */

class DOMUpdater {
    constructor(elements = {}) {
        this.elements = elements;
    }

    /**
     * Update all UI elements based on render data
     * @param {Object} renderData Data from renderers
     */
    updateUI(renderData) {
        if (renderData.activeScreen) {
            this.showScreen(renderData.activeScreen);
        }

        if (renderData.locationStatus) {
            this.updateLocationStatus(renderData.locationStatus);
        }

        if (renderData.onlineStatus) {
            this.updateOnlineStatus(renderData.onlineStatus);
        }

        if (renderData.loadingMessage !== undefined) {
            this.updateLoadingMessage(renderData.loadingMessage);
        }

        if (renderData.errorMessage) {
            this.updateErrorMessage(renderData.errorMessage);
        }

        if (renderData.locationInfo) {
            this.updateLocationInfo(renderData.locationInfo);
        }
    }

    /**
     * Show specific screen and hide others
     * @param {string} screenName Name of screen to show
     */
    showScreen(screenName) {
        const screens = {
            prompt: this.elements.locationPrompt,
            denied: this.elements.locationDenied,
            error: this.elements.locationDenied,
            loading: this.elements.loading,
            main: this.elements.mainContent
        };

        // Hide all screens
        Object.values(screens).forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });

        // Show active screen
        const activeScreen = screens[screenName];
        if (activeScreen) {
            activeScreen.classList.remove('hidden');
        }
    }

    /**
     * Update location status indicator
     * @param {Object} status Status data with className and text
     */
    updateLocationStatus(status) {
        if (!this.elements.locationStatus) return;

        this.elements.locationStatus.className = status.className;
        const textElement = this.elements.locationStatus.querySelector('.status-text');
        if (textElement) {
            textElement.textContent = status.text;
        }
    }

    /**
     * Update online status indicator
     * @param {Object} status Status data with className and text
     */
    updateOnlineStatus(status) {
        if (!this.elements.onlineStatus) return;

        this.elements.onlineStatus.className = status.className;
        const textElement = this.elements.onlineStatus.querySelector('.status-text');
        if (textElement) {
            textElement.textContent = status.text;
        }
    }

    /**
     * Update loading message
     * @param {string|null} message Loading message or null to hide
     */
    updateLoadingMessage(message) {
        if (!this.elements.loading) return;

        const messageElement = this.elements.loading.querySelector('p');
        if (messageElement && message) {
            messageElement.textContent = message;
        }
    }

    /**
     * Update error message
     * @param {Object} error Error data with title, message, and showRetry
     */
    updateErrorMessage(error) {
        if (!this.elements.locationDenied) return;

        const titleElement = this.elements.locationDenied.querySelector('h2');
        const messageElement = this.elements.locationDenied.querySelector('p');
        const retryButton = this.elements.retryLocationBtn;

        if (titleElement) {
            titleElement.textContent = error.title;
        }

        if (messageElement) {
            messageElement.textContent = error.message;
        }

        if (retryButton) {
            retryButton.style.display = error.showRetry ? 'block' : 'none';
        }
    }

    /**
     * Update location info display
     * @param {Object} locationInfo Location info with text and accuracy
     */
    updateLocationInfo(locationInfo) {
        if (!this.elements.locationInfo) return;

        const displayText = locationInfo.accuracy 
            ? `${locationInfo.text} (${locationInfo.accuracy})`
            : locationInfo.text;

        this.elements.locationInfo.textContent = displayText;
    }

    /**
     * Update solar noon time display
     * @param {string} timeString Formatted time string
     */
    updateSolarNoonTime(timeString) {
        if (!this.elements.noonTime) return;
        this.elements.noonTime.textContent = timeString;
    }

    /**
     * Update analemma visualization
     * @param {Object} visualization Visualization data
     */
    updateAnalemmaVisualization(visualization) {
        if (!visualization) return;

        // Update analemma path
        if (this.elements.analemmaPath && visualization.path) {
            this.elements.analemmaPath.setAttribute('d', visualization.path.pathString);
        }

        // Update sun position
        if (this.elements.sunMarker && visualization.sunPosition) {
            this.updateSunMarker(visualization.sunPosition);
        }

        // Update direction
        if (visualization.direction) {
            this.updateDirection(visualization.direction);
        }

        // Update extreme latitude warning
        if (visualization.isExtreme !== undefined) {
            this.updateExtremeLatitudeWarning(visualization.isExtreme);
        }
    }

    /**
     * Update sun marker position
     * @param {Object} position Sun position data
     */
    updateSunMarker(position) {
        if (!this.elements.sunMarker || !position) return;

        const sunIcon = `
            <circle cx="${position.x}" cy="${position.y}" r="8" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
            <g transform="translate(${position.x}, ${position.y})">
                <path d="M-12,0 L-8,0 M12,0 L8,0 M0,-12 L0,-8 M0,12 L0,8 M-8,-8 L-6,-6 M8,8 L6,6 M8,-8 L6,-6 M-8,8 L-6,6" 
                      stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
            </g>
        `;

        this.elements.sunMarker.innerHTML = sunIcon;
    }

    /**
     * Update direction indicator
     * @param {Object} direction Direction data
     */
    updateDirection(direction) {
        if (this.elements.directionLabel) {
            this.elements.directionLabel.textContent = direction.direction;
        }

        if (this.elements.directionArrow) {
            this.elements.directionArrow.style.transform = 
                direction.rotation ? `rotate(${direction.rotation}deg)` : '';
        }
    }

    /**
     * Update extreme latitude warning
     * @param {boolean} isExtreme Whether to show warning
     */
    updateExtremeLatitudeWarning(isExtreme) {
        if (this.elements.app) {
            if (isExtreme) {
                this.elements.app.classList.add('extreme-latitude');
            } else {
                this.elements.app.classList.remove('extreme-latitude');
            }
        }

        if (this.elements.extremeMessage) {
            if (isExtreme) {
                this.elements.extremeMessage.classList.remove('hidden');
            } else {
                this.elements.extremeMessage.classList.add('hidden');
            }
        }
    }

    /**
     * Set button loading state
     * @param {HTMLElement} button Button element
     * @param {boolean} isLoading Loading state
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Loading...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Grant Location Access';
        }
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMUpdater;
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.DOMUpdater = DOMUpdater;
} 