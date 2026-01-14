/**
 * Panel Manager Module
 * Manages panel hover, click-outside behavior, and state
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles panel opening/closing logic
 * - Open/Closed: Extensible through configuration
 * - Dependency Inversion: Depends on abstractions (config), not concrete implementations
 */

class PanelManager {
    constructor(config = {}) {
        this.panels = config.panels || [];
        this.currentlyOpenPanel = null;
        this.onPanelOpen = config.onPanelOpen || null;
        this.onPanelClose = config.onPanelClose || null;
    }

    /**
     * Initialize panel management
     */
    init() {
        // Get panel elements from DOM
        this.panels.forEach(panel => {
            panel.element = document.querySelector(panel.selector);
        });

        // Setup event listeners (click-based, not hover)
        this.setupTabClickListeners();
        this.setupClickOutsideListener();

        return this;
    }

    /**
     * Setup click listeners for tab labels (click to toggle panels)
     */
    setupTabClickListeners() {
        this.panels.forEach(panel => {
            if (panel.element) {
                const tabLabel = panel.element.querySelector('.panel-tab-label');
                if (tabLabel) {
                    tabLabel.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.togglePanel(panel);
                    });
                }

                // Prevent clicks inside panel content from closing the panel
                const panelContent = panel.element.querySelector('.panel-content');
                if (panelContent) {
                    panelContent.addEventListener('click', (event) => {
                        event.stopPropagation();
                    });
                }
            }
        });
    }

    /**
     * Toggle a panel open/closed
     * @param {Object} panel - Panel configuration object
     */
    togglePanel(panel) {
        if (!panel.element) return;

        const isCurrentlyOpen = panel.element.classList.contains(panel.class);

        if (isCurrentlyOpen) {
            // Close this panel
            this.closePanel(panel);
        } else {
            // Close any other open panel first, then open this one
            this.openPanel(panel);
        }
    }

    /**
     * Setup click-outside detection
     */
    setupClickOutsideListener() {
        document.addEventListener('click', (event) => {
            this.handleClickOutside(event);
        });
    }

    /**
     * Open a panel (closes any previously open panel)
     * @param {Object} panel - Panel configuration object
     */
    openPanel(panel) {
        if (!panel.element) return;

        // Close the currently open panel if it's different
        if (this.currentlyOpenPanel && this.currentlyOpenPanel !== panel) {
            this.closePanel(this.currentlyOpenPanel);
        }

        // Open the new panel
        panel.element.classList.add(panel.class);
        this.currentlyOpenPanel = panel;

        // Trigger callback if provided
        if (this.onPanelOpen) {
            this.onPanelOpen(panel);
        }
    }

    /**
     * Close a panel
     * @param {Object} panel - Panel configuration object
     */
    closePanel(panel) {
        if (!panel.element) return;

        panel.element.classList.remove(panel.class);

        // Clear the currently open panel reference if this is it
        if (this.currentlyOpenPanel === panel) {
            this.currentlyOpenPanel = null;
        }

        // Trigger callback if provided
        if (this.onPanelClose) {
            this.onPanelClose(panel);
        }
    }

    /**
     * Handle clicks outside of open panels
     * @param {Event} event - Click event
     */
    handleClickOutside(event) {
        if (this.currentlyOpenPanel && this.currentlyOpenPanel.element) {
            if (!this.currentlyOpenPanel.element.contains(event.target)) {
                this.closePanel(this.currentlyOpenPanel);
            }
        }
    }

    /**
     * Get currently open panel
     * @returns {Object|null} - Currently open panel or null
     */
    getCurrentPanel() {
        return this.currentlyOpenPanel;
    }

    /**
     * Close all panels
     */
    closeAll() {
        if (this.currentlyOpenPanel) {
            this.closePanel(this.currentlyOpenPanel);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelManager;
}
