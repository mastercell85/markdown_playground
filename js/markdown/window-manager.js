/**
 * Window Manager Module
 * Handles external preview window creation and management
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages external preview windows
 * - Open/Closed: Can be extended for different window types
 */

class WindowManager {
    constructor(config = {}) {
        this.windowTitle = config.windowTitle || 'Preview';
        this.windowWidth = config.windowWidth || 800;
        this.windowHeight = config.windowHeight || 600;
        this.windowStyles = config.windowStyles || this.getDefaultStyles();
        this.previewElementId = config.previewElementId || 'preview';
        this.externalWindow = null;
    }

    /**
     * Get default styles for preview window
     * @returns {string} - CSS styles
     */
    getDefaultStyles() {
        return `
            body {
                margin: 0;
                padding: 20px;
                background: #1a1a1a;
                color: #fff;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
            }
            h1 {
                font-size: 32px;
                margin: 20px 0 10px 0;
                border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 10px;
            }
            h2 { font-size: 24px; margin: 18px 0 8px 0; }
            h3 { font-size: 20px; margin: 16px 0 6px 0; }
            p { margin: 10px 0; }
            strong { font-weight: bold; }
            em { font-style: italic; }
            code {
                background: rgba(255, 255, 255, 0.1);
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', Courier, monospace;
            }
            pre {
                background: rgba(0, 0, 0, 0.5);
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
            }
            ul, ol { padding-left: 30px; }
            li { margin: 5px 0; }
            a { color: #66b3ff; text-decoration: none; }
            a:hover { text-decoration: underline; }
            blockquote {
                border-left: 4px solid rgba(255, 255, 255, 0.3);
                padding-left: 15px;
                color: #ccc;
                font-style: italic;
            }
        `;
    }

    /**
     * Open external preview window
     * @returns {Window|null} - External window reference
     */
    open() {
        const left = (screen.width - this.windowWidth) / 2;
        const top = (screen.height - this.windowHeight) / 2;

        this.externalWindow = window.open(
            '',
            this.windowTitle,
            `width=${this.windowWidth},height=${this.windowHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        if (this.externalWindow) {
            this.setupWindow();
            return this.externalWindow;
        }

        return null;
    }

    /**
     * Setup external window with HTML and styles
     */
    setupWindow() {
        this.externalWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${this.windowTitle}</title>
                <style>${this.windowStyles}</style>
            </head>
            <body>
                <div id="${this.previewElementId}"></div>
            </body>
            </html>
        `);
        this.externalWindow.document.close();
    }

    /**
     * Update content in external window
     * @param {string} html - HTML content to display
     */
    updateContent(html) {
        if (this.externalWindow && !this.externalWindow.closed) {
            const previewElement = this.externalWindow.document.getElementById(this.previewElementId);
            if (previewElement) {
                previewElement.innerHTML = html;
            }
        }
    }

    /**
     * Close external window
     */
    close() {
        if (this.externalWindow && !this.externalWindow.closed) {
            this.externalWindow.close();
        }
        this.externalWindow = null;
    }

    /**
     * Check if window is open
     * @returns {boolean}
     */
    isOpen() {
        return this.externalWindow && !this.externalWindow.closed;
    }

    /**
     * Get external window reference
     * @returns {Window|null}
     */
    getWindow() {
        return this.externalWindow;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowManager;
}
