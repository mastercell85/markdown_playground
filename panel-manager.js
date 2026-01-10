/**
 * Panel Manager - Handles tab hover and click-outside behavior
 *
 * Behavior:
 * - Mouse over tab: Panel begins to lower
 * - Panel lowers completely and stays open
 * - Only one panel can be open at a time - opening a new panel closes the previous one
 * - Click outside panel: Panel closes and retracts to tab
 */

(function() {
    'use strict';

    // Track which panel is currently open (only one at a time)
    let currentlyOpenPanel = null;

    // Panel selectors
    const panels = [
        { element: null, selector: '.preamble', class: 'panel-open' },
        { element: null, selector: '.summary', class: 'panel-open' }
    ];

    // Initialize when DOM is ready
    function init() {
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

        // Add click listeners to menu items
        initMenuItems();
    }

    /**
     * Initialize menu item click handlers
     */
    function initMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();

                const action = this.getAttribute('data-action');
                handleMenuAction(action);
            });
        });
    }

    /**
     * Handle menu item actions
     */
    function handleMenuAction(action) {
        switch(action) {
            case 'create-markdown':
                console.log('Create Markdown Document clicked');
                // TODO: Implement markdown document creation
                alert('Create Markdown Document feature - Coming soon!');
                break;
            default:
                console.log('Unknown action:', action);
        }
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
})();
