/**
 * Scroll Sync Module
 * Provides bidirectional synchronized scrolling between input and preview panes
 *
 * TODO: Implement row-based index synchronization for accurate scroll sync
 * This requires modifying the markdown parser to add data-line attributes
 */

class ScrollSync {
    constructor(config = {}) {
        this.inputElement = config.inputElement || null;
        this.previewElement = config.previewElement || null;
        this.enabled = false;
        this.isScrolling = false;
        this.scrollTimeout = null;

        // Debounce delay to prevent scroll loops
        this.debounceDelay = 50;

        // Bind methods
        this.handleInputScroll = this.handleInputScroll.bind(this);
        this.handlePreviewScroll = this.handlePreviewScroll.bind(this);
    }

    /**
     * Initialize scroll sync with DOM elements
     */
    init(inputElement, previewElement) {
        this.inputElement = inputElement;
        this.previewElement = previewElement;

        if (!this.inputElement || !this.previewElement) {
            console.warn('ScrollSync: Missing input or preview element');
            return false;
        }

        return true;
    }

    /**
     * Enable scroll synchronization
     */
    enable() {
        if (!this.inputElement || !this.previewElement) {
            console.warn('ScrollSync: Cannot enable - elements not initialized');
            return;
        }

        this.enabled = true;
        this.attachListeners();
        console.log('ScrollSync: Enabled');
    }

    /**
     * Disable scroll synchronization
     */
    disable() {
        this.enabled = false;
        this.detachListeners();
        console.log('ScrollSync: Disabled');
    }

    /**
     * Toggle scroll synchronization
     */
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }

    /**
     * Check if sync is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Attach scroll event listeners
     */
    attachListeners() {
        if (this.inputElement) {
            this.inputElement.addEventListener('scroll', this.handleInputScroll);
        }
        if (this.previewElement) {
            this.previewElement.addEventListener('scroll', this.handlePreviewScroll);
        }
    }

    /**
     * Detach scroll event listeners
     */
    detachListeners() {
        if (this.inputElement) {
            this.inputElement.removeEventListener('scroll', this.handleInputScroll);
        }
        if (this.previewElement) {
            this.previewElement.removeEventListener('scroll', this.handlePreviewScroll);
        }
    }

    /**
     * Handle scroll event from input pane
     */
    handleInputScroll() {
        if (!this.enabled || this.isScrolling) return;

        this.isScrolling = true;
        this.syncPreviewToInput();

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, this.debounceDelay);
    }

    /**
     * Handle scroll event from preview pane
     */
    handlePreviewScroll() {
        if (!this.enabled || this.isScrolling) return;

        this.isScrolling = true;
        this.syncInputToPreview();

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, this.debounceDelay);
    }

    /**
     * Sync preview scroll position to match input
     * Uses data-line attributes for accurate mapping
     */
    syncPreviewToInput() {
        if (!this.inputElement || !this.previewElement) return;

        // Find visible line in input
        const visibleLine = this.getVisibleLineInInput();
        if (visibleLine === null) return;

        // Find corresponding element in preview
        const targetElement = this.previewElement.querySelector(`[data-line="${visibleLine}"]`);
        if (targetElement) {
            // Calculate how much of the current line is scrolled past
            const linePercent = this.getLineVisibilityPercent(visibleLine);
            const targetTop = targetElement.offsetTop;
            const targetHeight = targetElement.offsetHeight;

            this.previewElement.scrollTop = targetTop - (targetHeight * linePercent);
        }
    }

    /**
     * Sync input scroll position to match preview
     * Uses data-line attributes for accurate mapping
     */
    syncInputToPreview() {
        if (!this.inputElement || !this.previewElement) return;

        // Find first visible element with data-line in preview
        const visibleElement = this.getFirstVisibleElementInPreview();
        if (!visibleElement) return;

        const line = parseInt(visibleElement.dataset.line, 10);
        if (isNaN(line)) return;

        // Scroll input to that line
        const lineHeight = this.getInputLineHeight();
        const targetTop = line * lineHeight;

        // Adjust for partial visibility
        const elementPercent = this.getElementVisibilityPercent(visibleElement);
        this.inputElement.scrollTop = targetTop - (lineHeight * elementPercent);
    }

    /**
     * Get the line number visible at the top of the input
     */
    getVisibleLineInInput() {
        if (!this.inputElement) return null;

        const scrollTop = this.inputElement.scrollTop;
        const lineHeight = this.getInputLineHeight();

        return Math.floor(scrollTop / lineHeight);
    }

    /**
     * Get what percentage of the current line is visible (0-1)
     */
    getLineVisibilityPercent(lineNumber) {
        const lineHeight = this.getInputLineHeight();
        const lineTop = lineNumber * lineHeight;
        const scrollTop = this.inputElement.scrollTop;

        return (scrollTop - lineTop) / lineHeight;
    }

    /**
     * Get the first visible element with data-line attribute in preview
     */
    getFirstVisibleElementInPreview() {
        const elements = this.previewElement.querySelectorAll('[data-line]');
        const containerRect = this.previewElement.getBoundingClientRect();
        const scrollTop = this.previewElement.scrollTop;

        for (const element of elements) {
            const rect = element.getBoundingClientRect();
            // Check if element is at or below the top of the viewport
            if (rect.bottom > containerRect.top) {
                return element;
            }
        }
        return null;
    }

    /**
     * Get visibility percentage of an element (0 = fully visible, 1 = just entering)
     */
    getElementVisibilityPercent(element) {
        const rect = element.getBoundingClientRect();
        const containerRect = this.previewElement.getBoundingClientRect();

        if (rect.top >= containerRect.top) return 0;

        const hiddenAmount = containerRect.top - rect.top;
        return Math.min(1, hiddenAmount / rect.height);
    }

    /**
     * Get the line height of the input textarea
     */
    getInputLineHeight() {
        if (!this.inputElement) return 22.4; // Default

        const computedStyle = window.getComputedStyle(this.inputElement);
        return parseFloat(computedStyle.lineHeight) || 22.4;
    }

    /**
     * Force a sync from input to preview
     */
    forceSync() {
        if (!this.enabled) return;
        this.syncPreviewToInput();
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.disable();
        this.inputElement = null;
        this.previewElement = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollSync;
}

// Also expose globally for browser use
if (typeof window !== 'undefined') {
    window.ScrollSync = ScrollSync;
}
