/**
 * Application State Management
 * Centralized state management with observer pattern for reactivity
 */

class AppState {
    constructor(initialState = {}) {
        this.state = {
            location: null,
            permissionState: null,
            isLoading: false,
            hasError: false,
            errorMessage: null,
            isOnline: true,
            currentDate: new Date(),
            ...initialState
        };
        this.listeners = [];
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update state with partial updates
     * @param {Object} updates Partial state updates
     */
    update(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notify(this.state, oldState);
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener Callback function (newState, oldState) => void
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of state change
     * @param {Object} newState New state
     * @param {Object} oldState Old state
     */
    notify(newState, oldState) {
        this.listeners.forEach(listener => {
            try {
                listener(newState, oldState);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.update({
            location: null,
            permissionState: null,
            isLoading: false,
            hasError: false,
            errorMessage: null,
            isOnline: true,
            currentDate: new Date()
        });
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
}

// Export to window for browser
if (typeof window !== 'undefined') {
    window.AppState = AppState;
} 