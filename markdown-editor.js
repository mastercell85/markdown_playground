/**
 * Markdown Editor - Manages dynamic tab creation and content
 *
 * Behavior:
 * - Starts with a clean slate (no tabs)
 * - Tabs will be created dynamically as needed
 * - Same panel management system as main page
 */

(function() {
    'use strict';

    // Track which panel is currently open (only one at a time)
    let currentlyOpenPanel = null;

    // Panel selectors for the five editor panels
    const panels = [
        { element: null, selector: '.files-panel', class: 'panel-open' },
        { element: null, selector: '.edit-panel', class: 'panel-open' },
        { element: null, selector: '.view-panel', class: 'panel-open' },
        { element: null, selector: '.settings-panel', class: 'panel-open' },
        { element: null, selector: '.back-panel', class: 'panel-open' }
    ];

    // Initialize when DOM is ready
    function init() {
        console.log('Markdown Editor initialized');

        // Get panel elements
        panels.forEach(panel => {
            panel.element = document.querySelector(panel.selector);
        });

        // Add mouseenter listeners to open panels
        panels.forEach(panel => {
            if (panel.element) {
                panel.element.addEventListener('mouseenter', function() {
                    openPanel(panel);
                });

                // Add click listener to tab label
                const tabLabel = panel.element.querySelector('.panel-tab-label');
                if (tabLabel) {
                    tabLabel.addEventListener('click', function(event) {
                        event.stopPropagation(); // Prevent click-outside from closing immediately
                        openPanel(panel);
                    });
                }
            }
        });

        // Add click listener to document for click-outside detection
        document.addEventListener('click', handleClickOutside);

        // Add special handler for Back button
        const backPanel = document.querySelector('.back-panel');
        if (backPanel) {
            backPanel.addEventListener('click', function(event) {
                event.stopPropagation();
                window.location.href = 'index.html';
            });
        }
    }

    /**
     * Create a new panel/tab dynamically
     * @param {Object} config - Configuration for the new panel
     * @param {string} config.name - Display name for the tab
     * @param {string} config.selector - CSS selector class
     * @param {string} config.content - HTML content for the panel
     */
    function createPanel(config) {
        // TODO: Implement dynamic panel creation
        console.log('Creating panel:', config);
    }

    /**
     * Open a panel (closes any previously open panel)
     */
    function openPanel(panel) {
        if (!panel.element) return;

        // Close the currently open panel if it's different from the one being opened
        if (currentlyOpenPanel && currentlyOpenPanel !== panel) {
            closePanel(currentlyOpenPanel);
        }

        // Open the new panel
        panel.element.classList.add(panel.class);
        currentlyOpenPanel = panel;
    }

    /**
     * Close a panel
     */
    function closePanel(panel) {
        if (!panel.element) return;

        panel.element.classList.remove(panel.class);

        // Clear the currently open panel reference if this is it
        if (currentlyOpenPanel === panel) {
            currentlyOpenPanel = null;
        }
    }

    /**
     * Handle clicks outside of open panels
     */
    function handleClickOutside(event) {
        // If there's a currently open panel, check if click was outside it
        if (currentlyOpenPanel && currentlyOpenPanel.element) {
            if (!currentlyOpenPanel.element.contains(event.target)) {
                closePanel(currentlyOpenPanel);
            }
        }
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose createPanel for external use if needed
    window.MarkdownEditor = {
        createPanel: createPanel
    };
})();
