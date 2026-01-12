/**
 * Main Index Page Script
 * Initializes panel management for the CSS Zen Garden homepage
 */

(function() {
    'use strict';

    // Initialize when DOM is ready
    function init() {
        // Configure panels for the main page
        const panelConfig = {
            panels: [
                { element: null, selector: '.preamble', class: 'panel-open' },
                { element: null, selector: '.summary', class: 'panel-open' }
            ]
        };

        // Create panel manager
        const panelManager = new PanelManager(panelConfig);
        panelManager.init();

        // Setup menu items
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
                openMarkdownEditor();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    /**
     * Open the markdown editor
     */
    function openMarkdownEditor() {
        window.location.href = 'markdown-editor.html';
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
