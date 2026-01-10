/**
 * Typora Theme Adapter
 * Opens Typora themes in a dedicated window with proper structure
 *
 * Typora uses #write as the main container
 * This adapter creates a separate window with Typora-compatible HTML
 */

class TyporaAdapter {
    constructor() {
        this.adapterStyleSheet = null;
        this.typoraWindow = null;
        this.currentThemeCSS = null;
        this.updateInterval = null;
    }

    /**
     * Activate Typora adapter mode
     * Opens a dedicated window for Typora theme preview
     * @param {string} themeCSS - The CSS content of the Typora theme
     */
    activate(themeCSS) {
        this.currentThemeCSS = themeCSS;

        // Open Typora window
        this.openTyporaWindow();

        // Start syncing content
        this.startContentSync();
    }

    /**
     * Open the dedicated Typora window
     */
    openTyporaWindow() {
        console.log('Opening Typora theme window...');

        // Close existing window if any
        if (this.typoraWindow && !this.typoraWindow.closed) {
            this.typoraWindow.close();
        }

        // Open new window
        const width = 1200;
        const height = 800;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        this.typoraWindow = window.open(
            'typora-window.html',
            'TyporaThemePreview',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        // Check if popup was blocked
        if (!this.typoraWindow || this.typoraWindow.closed) {
            console.error('Typora window popup was blocked! Please allow popups for this site.');
            alert('Popup blocked! Please allow popups for this site to view Typora themes in a dedicated window.');
            return;
        }

        console.log('Typora window opened successfully');

        // Wait for window to load, then send theme
        const checkReady = setInterval(() => {
            if (this.typoraWindow && !this.typoraWindow.closed) {
                try {
                    // Try to send theme CSS
                    this.typoraWindow.postMessage({
                        type: 'LOAD_THEME',
                        themeCSS: this.currentThemeCSS
                    }, window.location.origin);

                    // Send initial content
                    this.syncContent();

                    console.log('Theme CSS sent to Typora window');
                    clearInterval(checkReady);
                } catch (e) {
                    // Window not ready yet, will try again
                }
            } else {
                clearInterval(checkReady);
            }
        }, 100);

        // Listen for messages from Typora window
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'TYPORA_WINDOW_CLOSED') {
                this.deactivate();
            }
        });
    }

    /**
     * Start syncing content to Typora window
     */
    startContentSync() {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Sync content every 500ms
        this.updateInterval = setInterval(() => {
            this.syncContent();
        }, 500);
    }

    /**
     * Sync current preview content to Typora window
     */
    syncContent() {
        if (!this.typoraWindow || this.typoraWindow.closed) {
            this.deactivate();
            return;
        }

        // Get rendered HTML from preview
        const preview = document.querySelector('.markdown-output');
        if (preview) {
            this.typoraWindow.postMessage({
                type: 'UPDATE_CONTENT',
                html: preview.innerHTML
            }, window.location.origin);
        }
    }

    /**
     * Deactivate Typora adapter mode
     */
    deactivate() {
        // Stop syncing content
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Close Typora window
        if (this.typoraWindow && !this.typoraWindow.closed) {
            this.typoraWindow.postMessage({
                type: 'CLOSE'
            }, window.location.origin);
            this.typoraWindow.close();
        }

        this.typoraWindow = null;
        this.currentThemeCSS = null;
    }

    /**
     * Check if adapter is active
     * @returns {boolean}
     */
    isActive() {
        return this.typoraWindow !== null && !this.typoraWindow.closed;
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.TyporaAdapter = TyporaAdapter;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TyporaAdapter;
}
