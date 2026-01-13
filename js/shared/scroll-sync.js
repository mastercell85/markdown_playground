/**
 * Scroll Sync Module
 * Provides bidirectional synchronized scrolling between input and preview panes
 * Uses row-based index synchronization with data-line attributes for accuracy
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

        // Cache for line height calculation
        this.cachedLineHeight = null;

        // Offset adjustment (in lines) - positive = preview scrolls less (lags behind)
        // Negative = preview scrolls more (gets ahead)
        // Default of 3 lines helps account for rendering differences
        this.lineOffset = config.lineOffset !== undefined ? config.lineOffset : 3;

        // Bind methods
        this.handleInputScroll = this.handleInputScroll.bind(this);
        this.handlePreviewScroll = this.handlePreviewScroll.bind(this);
    }

    /**
     * Set the line offset for fine-tuning sync accuracy
     * @param {number} offset - Number of lines to offset (can be negative)
     */
    setLineOffset(offset) {
        this.lineOffset = offset;
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

        // Invalidate line height cache when font changes
        this.cachedLineHeight = null;

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

        // Get all elements with data-line in preview
        const elements = this.previewElement.querySelectorAll('[data-line]');
        if (elements.length === 0) {
            // Fall back to percentage-based sync if no data-line elements
            this.syncByPercentage(this.inputElement, this.previewElement);
            return;
        }

        // Find visible line in input (with offset adjustment)
        let visibleLine = this.getVisibleLineInInput();
        if (visibleLine === null) return;

        // Apply line offset for fine-tuning
        visibleLine = Math.max(0, visibleLine - this.lineOffset);

        // Find the closest element to the visible line
        const { element: targetElement, before, after } = this.findClosestElements(elements, visibleLine);

        if (targetElement) {
            const targetLine = parseInt(targetElement.dataset.line, 10);

            // Calculate how far through the current line we are
            const lineProgress = this.getLineVisibilityPercent(visibleLine);

            // Get the element's position in the preview
            const targetTop = targetElement.offsetTop;
            const targetHeight = targetElement.offsetHeight;

            // If there's a gap between the visible line and the closest element,
            // interpolate the scroll position
            if (targetLine !== visibleLine && before && after) {
                const beforeLine = parseInt(before.dataset.line, 10);
                const afterLine = parseInt(after.dataset.line, 10);
                const beforeTop = before.offsetTop;
                const afterTop = after.offsetTop;

                // Calculate interpolation factor
                const lineRange = afterLine - beforeLine;
                const positionRange = afterTop - beforeTop;
                const lineDiff = visibleLine - beforeLine + lineProgress;

                if (lineRange > 0) {
                    const interpolatedTop = beforeTop + (lineDiff / lineRange) * positionRange;
                    this.previewElement.scrollTop = interpolatedTop;
                    return;
                }
            }

            // Simple case: scroll to the target element
            this.previewElement.scrollTop = targetTop + (targetHeight * lineProgress);
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
        if (!visibleElement) {
            // Fall back to percentage-based sync
            this.syncByPercentage(this.previewElement, this.inputElement);
            return;
        }

        let line = parseInt(visibleElement.dataset.line, 10);
        if (isNaN(line)) return;

        // Apply line offset (reverse direction for input->preview)
        line = line + this.lineOffset;

        // Scroll input to that line
        const lineHeight = this.getInputLineHeight();
        const targetTop = line * lineHeight;

        // Adjust for partial visibility
        const elementPercent = this.getElementVisibilityPercent(visibleElement);
        this.inputElement.scrollTop = targetTop + (lineHeight * elementPercent);
    }

    /**
     * Find the closest elements to a given line number
     * Returns the exact match if found, or the elements before and after
     */
    findClosestElements(elements, targetLine) {
        let before = null;
        let after = null;
        let exact = null;

        for (const element of elements) {
            const line = parseInt(element.dataset.line, 10);
            if (isNaN(line)) continue;

            if (line === targetLine) {
                exact = element;
                break;
            } else if (line < targetLine) {
                if (!before || line > parseInt(before.dataset.line, 10)) {
                    before = element;
                }
            } else {
                if (!after || line < parseInt(after.dataset.line, 10)) {
                    after = element;
                }
            }
        }

        // Return exact match if found, otherwise the closest before element
        return {
            element: exact || before || after,
            before,
            after
        };
    }

    /**
     * Fallback: sync by percentage when no data-line elements exist
     */
    syncByPercentage(source, target) {
        const sourceMaxScroll = source.scrollHeight - source.clientHeight;
        const targetMaxScroll = target.scrollHeight - target.clientHeight;

        if (sourceMaxScroll <= 0) return;

        const scrollPercent = source.scrollTop / sourceMaxScroll;
        target.scrollTop = scrollPercent * targetMaxScroll;
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
     * Get what percentage of the current line is scrolled past (0-1)
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
     * Get visibility percentage of an element (0 = top visible, 1 = bottom just entering)
     */
    getElementVisibilityPercent(element) {
        const rect = element.getBoundingClientRect();
        const containerRect = this.previewElement.getBoundingClientRect();

        if (rect.top >= containerRect.top) return 0;

        const hiddenAmount = containerRect.top - rect.top;
        return Math.min(1, hiddenAmount / rect.height);
    }

    /**
     * Get the line height of the input textarea (cached for performance)
     */
    getInputLineHeight() {
        if (this.cachedLineHeight) return this.cachedLineHeight;

        if (!this.inputElement) return 22.4; // Default

        const computedStyle = window.getComputedStyle(this.inputElement);
        this.cachedLineHeight = parseFloat(computedStyle.lineHeight) || 22.4;
        return this.cachedLineHeight;
    }

    /**
     * Invalidate cached values (call when font/zoom changes)
     */
    invalidateCache() {
        this.cachedLineHeight = null;
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
        this.cachedLineHeight = null;
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
