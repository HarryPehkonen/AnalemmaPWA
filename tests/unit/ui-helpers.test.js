/**
 * Tests for ui-helpers.js - UI update functions
 */

const {
    updateLocationStatusUI,
    updateOnlineStatusUI,
    showScreen,
    updateLoadingMessage,
    updateErrorMessage
} = require('../../src/js/ui/ui-helpers.js');

describe('UI Helper Functions', () => {
    beforeEach(() => {
        // Reset DOM for each test
        document.body.innerHTML = '';
    });

    describe('updateLocationStatusUI', () => {
        test('updates location status element correctly', () => {
            document.body.innerHTML = `
                <div id="location-status" class="old-class">
                    <span class="status-text">Old Text</span>
                </div>
            `;
            
            const element = document.getElementById('location-status');
            const status = {
                class: 'status-indicator current',
                text: 'Current Location'
            };
            
            updateLocationStatusUI(element, status);
            
            expect(element.className).toBe('status-indicator current');
            expect(element.querySelector('.status-text').textContent).toBe('Current Location');
        });

        test('handles null element gracefully', () => {
            const status = {
                class: 'status-indicator current',
                text: 'Current Location'
            };
            
            // Should not throw
            expect(() => updateLocationStatusUI(null, status)).not.toThrow();
        });

        test('handles missing text element gracefully', () => {
            document.body.innerHTML = `<div id="location-status"></div>`;
            
            const element = document.getElementById('location-status');
            const status = {
                class: 'status-indicator current',
                text: 'Current Location'
            };
            
            updateLocationStatusUI(element, status);
            
            expect(element.className).toBe('status-indicator current');
        });
    });

    describe('updateOnlineStatusUI', () => {
        test('updates online status element correctly', () => {
            document.body.innerHTML = `
                <div id="online-status" class="old-class">
                    <span class="status-text">Old Text</span>
                </div>
            `;
            
            const element = document.getElementById('online-status');
            const status = {
                class: 'status-indicator online',
                text: 'Online'
            };
            
            updateOnlineStatusUI(element, status);
            
            expect(element.className).toBe('status-indicator online');
            expect(element.querySelector('.status-text').textContent).toBe('Online');
        });

        test('handles offline status', () => {
            document.body.innerHTML = `
                <div id="online-status">
                    <span class="status-text"></span>
                </div>
            `;
            
            const element = document.getElementById('online-status');
            const status = {
                class: 'status-indicator offline',
                text: 'Offline'
            };
            
            updateOnlineStatusUI(element, status);
            
            expect(element.className).toBe('status-indicator offline');
            expect(element.querySelector('.status-text').textContent).toBe('Offline');
        });
    });

    describe('showScreen', () => {
        test('shows only the requested screen', () => {
            document.body.innerHTML = `
                <div id="prompt" class=""></div>
                <div id="loading" class="hidden"></div>
                <div id="main" class="hidden"></div>
                <div id="error" class="hidden"></div>
            `;
            
            const screens = {
                prompt: document.getElementById('prompt'),
                loading: document.getElementById('loading'),
                main: document.getElementById('main'),
                error: document.getElementById('error')
            };
            
            showScreen(screens, 'main');
            
            expect(screens.prompt.classList.contains('hidden')).toBe(true);
            expect(screens.loading.classList.contains('hidden')).toBe(true);
            expect(screens.main.classList.contains('hidden')).toBe(false);
            expect(screens.error.classList.contains('hidden')).toBe(true);
        });

        test('handles non-existent screen gracefully', () => {
            const screens = {
                prompt: document.createElement('div'),
                main: document.createElement('div')
            };
            
            // Should not throw
            expect(() => showScreen(screens, 'nonexistent')).not.toThrow();
        });

        test('handles null screen elements', () => {
            const screens = {
                prompt: null,
                main: document.createElement('div')
            };
            
            // Should not throw
            expect(() => showScreen(screens, 'main')).not.toThrow();
        });
    });

    describe('updateLoadingMessage', () => {
        test('updates loading message correctly', () => {
            document.body.innerHTML = `
                <div id="loading">
                    <p>Old Message</p>
                </div>
            `;
            
            const element = document.getElementById('loading');
            updateLoadingMessage(element, 'Getting your location...');
            
            expect(element.querySelector('p').textContent).toBe('Getting your location...');
        });

        test('handles null element gracefully', () => {
            expect(() => updateLoadingMessage(null, 'Test')).not.toThrow();
        });

        test('handles missing p element', () => {
            document.body.innerHTML = `<div id="loading"></div>`;
            const element = document.getElementById('loading');
            
            expect(() => updateLoadingMessage(element, 'Test')).not.toThrow();
        });
    });

    describe('updateErrorMessage', () => {
        test('updates error title and message correctly', () => {
            document.body.innerHTML = `
                <div id="error">
                    <div class="error-content">
                        <h2>Old Title</h2>
                        <p>Old Message</p>
                    </div>
                </div>
            `;
            
            const element = document.getElementById('error');
            updateErrorMessage(element, 'Error Title', 'Error details here');
            
            expect(element.querySelector('h2').textContent).toBe('Error Title');
            expect(element.querySelector('p').textContent).toBe('Error details here');
        });

        test('handles null element gracefully', () => {
            expect(() => updateErrorMessage(null, 'Title', 'Message')).not.toThrow();
        });

        test('handles missing child elements', () => {
            document.body.innerHTML = `<div id="error"></div>`;
            const element = document.getElementById('error');
            
            expect(() => updateErrorMessage(element, 'Title', 'Message')).not.toThrow();
        });
    });
}); 