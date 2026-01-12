/**
 * Steel Tab Menu - JavaScript Features
 * Self-contained functionality for the Steel tab menu style
 */

(function() {
    'use strict';

    /**
     * Initialize Steel tab menu features
     */
    function initSteelTabMenu() {
        initializeHelpPanelSections();
        initializeExpandAllToggle();
    }

    /**
     * Initialize Help panel collapsible sections
     */
    function initializeHelpPanelSections() {
        const helpSections = document.querySelectorAll('.help-section-header');

        helpSections.forEach(header => {
            header.addEventListener('click', function(event) {
                event.stopPropagation();

                const section = this.closest('.help-section');
                if (section) {
                    section.classList.toggle('expanded');
                    updateExpandAllCheckbox();
                }
            });
        });
    }

    /**
     * Initialize expand all checkbox
     */
    function initializeExpandAllToggle() {
        const expandAllCheckbox = document.getElementById('expand-all-sections');
        if (expandAllCheckbox) {
            expandAllCheckbox.addEventListener('change', function(event) {
                event.stopPropagation();
                toggleAllSections(this.checked);
            });
        }
    }

    /**
     * Toggle all collapsible sections expanded/collapsed
     * @param {boolean} expand - True to expand all, false to collapse all
     */
    function toggleAllSections(expand) {
        const sections = document.querySelectorAll('.help-section');
        sections.forEach(section => {
            if (expand) {
                section.classList.add('expanded');
            } else {
                section.classList.remove('expanded');
            }
        });
    }

    /**
     * Update expand all checkbox state based on current section states
     */
    function updateExpandAllCheckbox() {
        const expandAllCheckbox = document.getElementById('expand-all-sections');
        if (!expandAllCheckbox) return;

        const sections = document.querySelectorAll('.help-section');
        const expandedSections = document.querySelectorAll('.help-section.expanded');

        expandAllCheckbox.checked = sections.length > 0 && sections.length === expandedSections.length;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSteelTabMenu);
    } else {
        initSteelTabMenu();
    }

    // Expose functions globally if needed
    window.SteelTabMenu = {
        init: initSteelTabMenu,
        toggleAllSections: toggleAllSections,
        updateExpandAllCheckbox: updateExpandAllCheckbox
    };
})();
