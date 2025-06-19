/**
 * Tests for AppState module
 * Test state management functionality
 */

const AppState = require('../../src/js/core/app-state.js');

describe('AppState', () => {
    let state;

    beforeEach(() => {
        state = new AppState();
    });

    describe('initialization', () => {
        test('initializes with default state', () => {
            const currentState = state.getState();
            
            expect(currentState).toEqual({
                location: null,
                permissionState: null,
                isLoading: false,
                hasError: false,
                errorMessage: null,
                isOnline: true,
                currentDate: expect.any(Date)
            });
        });

        test('accepts initial state in constructor', () => {
            const initialState = { isLoading: true, isOnline: false };
            const customState = new AppState(initialState);
            
            const currentState = customState.getState();
            expect(currentState.isLoading).toBe(true);
            expect(currentState.isOnline).toBe(false);
        });
    });

    describe('state updates', () => {
        test('updates state partially', () => {
            state.update({ isLoading: true });
            
            const currentState = state.getState();
            expect(currentState.isLoading).toBe(true);
            expect(currentState.isOnline).toBe(true); // unchanged
        });

        test('updates multiple properties at once', () => {
            const location = { latitude: 40.7, longitude: -74.0 };
            state.update({ 
                location, 
                permissionState: 'granted',
                isLoading: false 
            });
            
            const currentState = state.getState();
            expect(currentState.location).toEqual(location);
            expect(currentState.permissionState).toBe('granted');
            expect(currentState.isLoading).toBe(false);
        });

        test('does not mutate previous state', () => {
            const firstState = state.getState();
            state.update({ isLoading: true });
            const secondState = state.getState();
            
            expect(firstState.isLoading).toBe(false);
            expect(secondState.isLoading).toBe(true);
            expect(firstState).not.toBe(secondState);
        });
    });

    describe('subscriptions', () => {
        test('notifies subscribers on state change', () => {
            const listener = jest.fn();
            state.subscribe(listener);
            
            state.update({ isLoading: true });
            
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ isLoading: true }),
                expect.objectContaining({ isLoading: false })
            );
        });

        test('supports multiple subscribers', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            state.subscribe(listener1);
            state.subscribe(listener2);
            
            state.update({ isLoading: true });
            
            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });

        test('unsubscribe removes listener', () => {
            const listener = jest.fn();
            const unsubscribe = state.subscribe(listener);
            
            unsubscribe();
            state.update({ isLoading: true });
            
            expect(listener).not.toHaveBeenCalled();
        });

        test('handles listener errors gracefully', () => {
            const errorListener = jest.fn(() => {
                throw new Error('Listener error');
            });
            const goodListener = jest.fn();
            
            // Mock console.error
            const consoleError = console.error;
            console.error = jest.fn();
            
            state.subscribe(errorListener);
            state.subscribe(goodListener);
            
            // Should not throw
            expect(() => state.update({ isLoading: true })).not.toThrow();
            
            expect(errorListener).toHaveBeenCalled();
            expect(goodListener).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
            
            // Restore console.error
            console.error = consoleError;
        });
    });

    describe('reset', () => {
        test('resets state to initial values', () => {
            // Modify state
            state.update({
                location: { latitude: 40, longitude: -74 },
                isLoading: true,
                hasError: true,
                errorMessage: 'Test error'
            });
            
            // Reset
            state.reset();
            
            const currentState = state.getState();
            expect(currentState).toEqual({
                location: null,
                permissionState: null,
                isLoading: false,
                hasError: false,
                errorMessage: null,
                isOnline: true,
                currentDate: expect.any(Date)
            });
        });

        test('notifies subscribers on reset', () => {
            const listener = jest.fn();
            state.subscribe(listener);
            
            state.update({ isLoading: true });
            listener.mockClear();
            
            state.reset();
            
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ isLoading: false }),
                expect.objectContaining({ isLoading: true })
            );
        });
    });
}); 