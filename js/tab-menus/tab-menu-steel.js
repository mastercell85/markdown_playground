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
        initializeHelpExpandAllToggle();
        initializeViewPanelSections();
        initializeViewExpandAllToggle();
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
                    updateHelpExpandAllCheckbox();
                }
            });
        });
    }

    /**
     * Initialize Help panel expand all checkbox
     */
    function initializeHelpExpandAllToggle() {
        const expandAllCheckbox = document.getElementById('expand-all-sections');
        if (expandAllCheckbox) {
            expandAllCheckbox.addEventListener('change', function(event) {
                event.stopPropagation();
                toggleAllHelpSections(this.checked);
            });
        }
    }

    /**
     * Toggle all Help panel sections expanded/collapsed
     * @param {boolean} expand - True to expand all, false to collapse all
     */
    function toggleAllHelpSections(expand) {
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
     * Update Help expand all checkbox state based on current section states
     */
    function updateHelpExpandAllCheckbox() {
        const expandAllCheckbox = document.getElementById('expand-all-sections');
        if (!expandAllCheckbox) return;

        const sections = document.querySelectorAll('.help-section');
        const expandedSections = document.querySelectorAll('.help-section.expanded');

        expandAllCheckbox.checked = sections.length > 0 && sections.length === expandedSections.length;
    }

    /**
     * Initialize View panel collapsible sections
     */
    function initializeViewPanelSections() {
        const viewSections = document.querySelectorAll('.view-section-header');

        viewSections.forEach(header => {
            header.addEventListener('click', function(event) {
                event.stopPropagation();

                const section = this.closest('.view-section');
                if (section) {
                    section.classList.toggle('expanded');
                    updateViewExpandAllCheckbox();
                }
            });
        });
    }

    /**
     * Initialize View panel expand all checkbox
     */
    function initializeViewExpandAllToggle() {
        const expandAllCheckbox = document.getElementById('view-expand-all-sections');
        if (expandAllCheckbox) {
            expandAllCheckbox.addEventListener('change', function(event) {
                event.stopPropagation();
                toggleAllViewSections(this.checked);
            });
        }
    }

    /**
     * Toggle all View panel sections expanded/collapsed
     * @param {boolean} expand - True to expand all, false to collapse all
     */
    function toggleAllViewSections(expand) {
        const sections = document.querySelectorAll('.view-section');
        sections.forEach(section => {
            if (expand) {
                section.classList.add('expanded');
            } else {
                section.classList.remove('expanded');
            }
        });
    }

    /**
     * Update View expand all checkbox state based on current section states
     */
    function updateViewExpandAllCheckbox() {
        const expandAllCheckbox = document.getElementById('view-expand-all-sections');
        if (!expandAllCheckbox) return;

        const sections = document.querySelectorAll('.view-section');
        const expandedSections = document.querySelectorAll('.view-section.expanded');

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
        toggleAllHelpSections: toggleAllHelpSections,
        toggleAllViewSections: toggleAllViewSections,
        updateHelpExpandAllCheckbox: updateHelpExpandAllCheckbox,
        updateViewExpandAllCheckbox: updateViewExpandAllCheckbox
    };
})();
