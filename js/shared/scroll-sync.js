/**
 * Scroll Sync Module
 * Provides bidirectional synchronized scrolling between input and preview panes
 * Uses element index matching to handle varying element heights (images, headers, etc.)
 *
 * @version 3.0.0 - Element index matching approach for better accuracy with images
 */

class ScrollSync {
    constructor(config = {}) {
        this.inputElement = config.inputElement || null;
        this.previewElement = config.previewElement || null;
        this.lineMapper = config.lineMapper || null;
        this.enabled = false;
        this.isScrolling = false;
        this.scrollTimeout = null;

        // Debounce delay to prevent scroll loops
        this.debounceDelay = 50;

        // Cache for line height calculation
        this.cachedLineHeight = null;

        // Offset adjustment (in lines) - positive = preview scrolls more (gets ahead)
        // Negative = preview scrolls less (lags behind)
        // Default of 0 lines means neutral mapping
        this.lineOffset = config.lineOffset !== undefined ? config.lineOffset : 0;

        // Edge threshold - percentage of document near edges where we blend with percentage sync
        this.edgeThreshold = 0.1; // 10% from top/bottom

        // Adaptive sync: pause when scrolling fast through problematic content
        this.syncPaused = false;
        this.lastScrollTime = 0;
        this.lastScrollPosition = 0;
        this.scrollVelocity = 0;
        this.resyncTimeout = null;
        this.resyncDelay = 300; // ms to wait after scrolling stops before re-syncing
        this.velocityThreshold = 1500; // pixels/second - above this, consider "fast scrolling"

        // Visual indicator for sync pause state
        this.showPauseIndicator = config.showPauseIndicator !== false; // default true
        this.pauseIndicatorElement = null;

        // Debug: highlight the current sync line in preview and input
        this.showSyncLineHighlight = config.showSyncLineHighlight || false;
        this.lastHighlightedPreviewElement = null;
        this.lastHighlightedInputLine = null;

        // Bind methods
        this.handleInputScroll = this.handleInputScroll.bind(this);
        this.handlePreviewScroll = this.handlePreviewScroll.bind(this);
        this._scheduleResync = this._scheduleResync.bind(this);
    }

    /**
     * Set the LineMapper instance for accurate mapping
     * @param {LineMapper} lineMapper - The LineMapper instance
     */
    setLineMapper(lineMapper) {
        this.lineMapper = lineMapper;
    }

    /**
     * Create the pause indicator element
     * Shows when sync is temporarily paused due to fast scrolling
     * @private
     */
    _createPauseIndicator() {
        if (this.pauseIndicatorElement) return;

        this.pauseIndicatorElement = document.createElement('div');
        this.pauseIndicatorElement.className = 'scroll-sync-pause-indicator';
        this.pauseIndicatorElement.innerHTML = `
            <span class="pause-icon">⏸</span>
            <span class="pause-text">Sync paused</span>
        `;
        this.pauseIndicatorElement.style.display = 'none';

        // Append to the editor container or body
        const container = document.querySelector('.editor-container') || document.body;
        container.appendChild(this.pauseIndicatorElement);
    }

    /**
     * Show/hide the pause indicator
     * @param {boolean} show - Whether to show the indicator
     * @private
     */
    _showPauseIndicator(show) {
        if (!this.showPauseIndicator || !this.pauseIndicatorElement) return;

        if (show) {
            this.pauseIndicatorElement.style.display = 'flex';
            this.pauseIndicatorElement.classList.add('visible');
        } else {
            this.pauseIndicatorElement.classList.remove('visible');
            // Hide after fade out animation
            setTimeout(() => {
                if (!this.pauseIndicatorElement.classList.contains('visible')) {
                    this.pauseIndicatorElement.style.display = 'none';
                }
            }, 300);
        }
    }

    /**
     * Pause sync temporarily (during fast scrolling through problematic content)
     * @private
     */
    _pauseSync() {
        if (this.syncPaused) return;

        this.syncPaused = true;
        this._showPauseIndicator(true);
        console.log('ScrollSync: Paused (fast scrolling detected)');
    }

    /**
     * Resume sync and perform a re-sync
     * @private
     */
    _resumeSync() {
        if (!this.syncPaused) return;

        this.syncPaused = false;
        this._showPauseIndicator(false);

        // Perform a smart resync - find the current line and scroll preview to match
        this._smartResync();
        console.log('ScrollSync: Resumed and re-synced');
    }

    /**
     * Smart resync - uses line mapping for accuracy after pause
     * Falls back to percentage if line mapping unavailable
     * @private
     */
    _smartResync() {
        if (!this.inputElement || !this.previewElement) return;

        // Calculate current line from input scroll position
        const scrollTop = this.inputElement.scrollTop;
        const lineHeight = this.getInputLineHeight();
        const currentLine = Math.floor(scrollTop / lineHeight) + 1;

        // Highlight the sync line for debugging
        this._highlightSyncLine(currentLine);

        // Try to find the element for this line in the preview
        const targetElement = this.previewElement.querySelector(`[data-line="${currentLine}"]`);

        if (targetElement) {
            // Direct match - scroll to this element
            const elementTop = targetElement.offsetTop;
            this.previewElement.scrollTop = elementTop;
            // Update highlight with the actual element
            this._highlightSyncLine(currentLine, targetElement);
            return;
        }

        // No exact match - find closest element before this line
        const allLineElements = this.previewElement.querySelectorAll('[data-line]');
        let closestElement = null;
        let closestLine = 0;

        for (const element of allLineElements) {
            const line = parseInt(element.dataset.line, 10);
            if (line <= currentLine && line > closestLine) {
                closestLine = line;
                closestElement = element;
            }
        }

        if (closestElement) {
            // Scroll to closest element, with interpolation for the remaining lines
            const elementTop = closestElement.offsetTop;
            const elementHeight = closestElement.offsetHeight;
            const lineDiff = currentLine - closestLine;

            // Estimate additional scroll based on average line height in preview
            // This helps when the closest element is several lines before current line
            const avgPreviewLineHeight = elementHeight / Math.max(1, this._getElementLineSpan(closestElement));
            const additionalScroll = lineDiff * avgPreviewLineHeight;

            this.previewElement.scrollTop = elementTop + Math.min(additionalScroll, elementHeight);
            // Update highlight with the closest element
            this._highlightSyncLine(currentLine, closestElement);
            return;
        }

        // Fallback to percentage-based sync if no data-line elements found
        this.syncByPercentage(this.inputElement, this.previewElement);
    }

    /**
     * Get the line span of an element (how many source lines it covers)
     * @private
     */
    _getElementLineSpan(element) {
        const startLine = parseInt(element.dataset.line, 10);
        if (isNaN(startLine)) return 1;

        // Find next sibling with data-line to determine span
        let next = element.nextElementSibling;
        while (next) {
            if (next.dataset && next.dataset.line) {
                const nextLine = parseInt(next.dataset.line, 10);
                if (!isNaN(nextLine)) {
                    return Math.max(1, nextLine - startLine);
                }
            }
            next = next.nextElementSibling;
        }

        // Default to 1 if can't determine
        return 1;
    }

    /**
     * Schedule a resync after scrolling stops
     * @private
     */
    _scheduleResync() {
        clearTimeout(this.resyncTimeout);
        this.resyncTimeout = setTimeout(() => {
            if (this.syncPaused && this.enabled) {
                this._resumeSync();
            }
        }, this.resyncDelay);
    }

    /**
     * Calculate scroll velocity
     * @param {number} currentPosition - Current scroll position
     * @returns {number} Velocity in pixels per second
     * @private
     */
    _calculateVelocity(currentPosition) {
        const now = performance.now();
        const timeDelta = now - this.lastScrollTime;

        if (timeDelta > 0 && this.lastScrollTime > 0) {
            const positionDelta = Math.abs(currentPosition - this.lastScrollPosition);
            this.scrollVelocity = (positionDelta / timeDelta) * 1000; // px/sec
        }

        this.lastScrollTime = now;
        this.lastScrollPosition = currentPosition;

        return this.scrollVelocity;
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
        this.syncPaused = false;
        this.lastScrollTime = 0;
        this.lastScrollPosition = 0;

        // Create pause indicator if needed
        if (this.showPauseIndicator) {
            this._createPauseIndicator();
        }

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

        // Calculate velocity
        const velocity = this._calculateVelocity(this.inputElement.scrollTop);

        // Check if we should pause due to fast scrolling
        if (velocity > this.velocityThreshold) {
            this._pauseSync();
            this._scheduleResync();
            return;
        }

        // If paused, just schedule resync (don't sync until scrolling stops)
        if (this.syncPaused) {
            this._scheduleResync();
            return;
        }

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

        // Calculate velocity
        const velocity = this._calculateVelocity(this.previewElement.scrollTop);

        // Check if we should pause due to fast scrolling
        if (velocity > this.velocityThreshold) {
            this._pauseSync();
            this._scheduleResync();
            return;
        }

        // If paused, just schedule resync
        if (this.syncPaused) {
            this._scheduleResync();
            return;
        }

        this.isScrolling = true;
        this.syncInputToPreview();

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, this.debounceDelay);
    }

    /**
     * Sync preview scroll position to match input
     * Uses element index matching for accurate sync regardless of element heights
     */
    syncPreviewToInput() {
        if (!this.inputElement || !this.previewElement) return;

        // Use element matching approach - works better with images and varying heights
        this._syncPreviewToInputWithElementMatching();
    }

    /**
     * Sync preview using element index matching approach
     * Counts semantic elements (headers, paragraphs, images, etc.) instead of using pixel heights
     * This handles documents with large images or varying element heights
     * @private
     */
    _syncPreviewToInputWithElementMatching() {
        // Find which line is at the top of the viewport
        // With word wrap disabled, this is simple: scrollTop / lineHeight
        const inputViewportTop = this.inputElement.scrollTop;
        const lineHeight = this.getInputLineHeight();
        // Calculate which line is at the scroll position
        // Adding 1 converts from 0-based to 1-based line numbers
        const visibleLineNumber = Math.floor(inputViewportTop / lineHeight) + 1;

        // Get all elements in preview that have data-line attributes
        const previewElements = Array.from(this.previewElement.querySelectorAll('[data-line]'));

        if (previewElements.length === 0) {
            // Fallback to percentage if no data-line elements
            this.syncByPercentage(this.inputElement, this.previewElement);
            return;
        }

        // Sort elements by their line numbers (should already be sorted, but just in case)
        previewElements.sort((a, b) => {
            const lineA = parseInt(a.dataset.line, 10);
            const lineB = parseInt(b.dataset.line, 10);
            return lineA - lineB;
        });

        // Find the preview element that corresponds to the visible line
        // We want the element whose line number is closest to (but not exceeding) the visible line
        let targetElement = null;
        let targetIndex = -1;

        for (let i = 0; i < previewElements.length; i++) {
            const elementLine = parseInt(previewElements[i].dataset.line, 10);

            if (elementLine <= visibleLineNumber) {
                targetElement = previewElements[i];
                targetIndex = i;
            } else {
                // We've passed the visible line, use the previous element
                break;
            }
        }


        if (!targetElement) {
            // No element found before visible line, use first element
            targetElement = previewElements[0];
            targetIndex = 0;
        }

        // Highlight the sync line for debugging
        this._highlightSyncLine(visibleLineNumber, targetElement);

        // Calculate how far between this element and the next we should scroll
        // This provides smooth scrolling between elements
        const currentElementLine = parseInt(targetElement.dataset.line, 10);
        const nextElement = previewElements[targetIndex + 1];

        if (nextElement) {
            const nextElementLine = parseInt(nextElement.dataset.line, 10);
            const lineDiff = nextElementLine - currentElementLine;

            // Only interpolate if we have a reasonable line difference
            if (lineDiff > 0) {
                const lineProgress = Math.min(1, (visibleLineNumber - currentElementLine) / lineDiff);

                // Interpolate between current and next element positions
                const currentElementTop = targetElement.offsetTop;
                const nextElementTop = nextElement.offsetTop;
                const elementHeightDiff = nextElementTop - currentElementTop;

                // Add padding above the element so it's not cut off at the top
                // Subtract 60px to show some content above the target element
                const viewportPadding = 60;
                const targetScrollTop = currentElementTop + (elementHeightDiff * lineProgress * 0.8) - viewportPadding;
                this.previewElement.scrollTop = Math.max(0, targetScrollTop); // Don't scroll negative
            } else {
                // Lines are the same, scroll to element with padding
                const viewportPadding = 60;
                this.previewElement.scrollTop = Math.max(0, targetElement.offsetTop - viewportPadding);
            }
        } else {
            // Last element - scroll to it with padding
            const viewportPadding = 60;
            this.previewElement.scrollTop = Math.max(0, targetElement.offsetTop - viewportPadding);
        }
    }

    /**
     * Sync input scroll position to match preview
     * Uses LineMapper for accurate reverse mapping
     */
    syncInputToPreview() {
        if (!this.inputElement || !this.previewElement) return;

        // Use LineMapper if available
        if (this.lineMapper) {
            this._syncInputToPreviewWithLineMapper();
            return;
        }

        // Fallback to percentage-based sync if no LineMapper
        this.syncByPercentage(this.previewElement, this.inputElement);
    }

    /**
     * Sync input using percentage-based approach with LineMapper refinement
     * Primary: percentage sync (reliable), Secondary: LineMapper adjustment (accuracy)
     * @private
     */
    _syncInputToPreviewWithLineMapper() {
        const previewScrollTop = this.previewElement.scrollTop;
        const previewMaxScroll = this.previewElement.scrollHeight - this.previewElement.clientHeight;

        // Handle edge case: no scrollable content
        if (previewMaxScroll <= 0) return;

        const scrollPercent = previewScrollTop / previewMaxScroll;

        // Primary: percentage-based scroll position (always reliable)
        const inputMaxScroll = this.inputElement.scrollHeight - this.inputElement.clientHeight;
        const percentageScrollTop = scrollPercent * inputMaxScroll;

        // Secondary: LineMapper-based refinement
        let sourceLine = this.lineMapper.getLineForScrollPosition(previewScrollTop);
        sourceLine = sourceLine + this.lineOffset;
        const lineHeight = this.getInputLineHeight();
        const lineMapperScrollTop = (sourceLine - 1) * lineHeight;

        // Calculate divergence between the two methods
        const divergence = Math.abs(lineMapperScrollTop - percentageScrollTop);
        const maxDivergence = inputMaxScroll * 0.15;

        // If LineMapper diverges too much, trust percentage more
        let blendFactor;
        if (divergence > maxDivergence) {
            blendFactor = 0.8;
        } else {
            blendFactor = 0.3;
        }

        const finalScrollTop = lineMapperScrollTop * (1 - blendFactor) + percentageScrollTop * blendFactor;

        this.inputElement.scrollTop = finalScrollTop;
    }

    /**
     * Fallback: sync by percentage when no LineMapper available
     */
    syncByPercentage(source, target) {
        const sourceMaxScroll = source.scrollHeight - source.clientHeight;
        const targetMaxScroll = target.scrollHeight - target.clientHeight;

        if (sourceMaxScroll <= 0) return;

        const scrollPercent = source.scrollTop / sourceMaxScroll;
        target.scrollTop = scrollPercent * targetMaxScroll;
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
        clearTimeout(this.resyncTimeout);

        // Clear sync line highlights
        this._clearSyncHighlights();

        // Remove pause indicator
        if (this.pauseIndicatorElement) {
            this.pauseIndicatorElement.remove();
            this.pauseIndicatorElement = null;
        }

        this.inputElement = null;
        this.previewElement = null;
        this.cachedLineHeight = null;
    }

    /**
     * Check if sync is currently paused
     * @returns {boolean}
     */
    isPaused() {
        return this.syncPaused;
    }

    /**
     * Highlight the current sync line in both input and preview
     * @param {number} lineNumber - The source line number being synced from
     * @param {HTMLElement} [previewElement] - Optional preview element to highlight
     * @private
     */
    _highlightSyncLine(lineNumber, previewElement = null) {
        if (!this.showSyncLineHighlight) return;

        // Clear previous highlights
        this._clearSyncHighlights();

        // Highlight in input (line numbers gutter)
        const lineNumbersGutter = document.querySelector('.line-numbers-gutter');
        if (lineNumbersGutter) {
            const lineElements = lineNumbersGutter.querySelectorAll('.line-number');
            const lineIndex = lineNumber - 1; // Convert to 0-based index
            if (lineIndex >= 0 && lineIndex < lineElements.length) {
                lineElements[lineIndex].classList.add('sync-line-highlight');
                this.lastHighlightedInputLine = lineElements[lineIndex];
            }
        }

        // Highlight in preview
        if (previewElement) {
            previewElement.classList.add('sync-line-highlight-preview');
            this.lastHighlightedPreviewElement = previewElement;
        } else if (this.previewElement) {
            // Try to find the element for this line
            const targetElement = this.previewElement.querySelector(`[data-line="${lineNumber}"]`);
            if (targetElement) {
                targetElement.classList.add('sync-line-highlight-preview');
                this.lastHighlightedPreviewElement = targetElement;
            } else {
                // Find closest element before this line
                const allLineElements = this.previewElement.querySelectorAll('[data-line]');
                let closestElement = null;
                let closestLine = 0;
                for (const element of allLineElements) {
                    const line = parseInt(element.dataset.line, 10);
                    if (line <= lineNumber && line > closestLine) {
                        closestLine = line;
                        closestElement = element;
                    }
                }
                if (closestElement) {
                    closestElement.classList.add('sync-line-highlight-preview');
                    this.lastHighlightedPreviewElement = closestElement;
                }
            }
        }
    }

    /**
     * Clear all sync line highlights
     * @private
     */
    _clearSyncHighlights() {
        if (this.lastHighlightedInputLine) {
            this.lastHighlightedInputLine.classList.remove('sync-line-highlight');
            this.lastHighlightedInputLine = null;
        }
        if (this.lastHighlightedPreviewElement) {
            this.lastHighlightedPreviewElement.classList.remove('sync-line-highlight-preview');
            this.lastHighlightedPreviewElement = null;
        }
    }

    /**
     * Enable or disable sync line highlighting
     * @param {boolean} enable - Whether to enable highlighting
     */
    setSyncLineHighlight(enable) {
        this.showSyncLineHighlight = enable;
        if (!enable) {
            this._clearSyncHighlights();
        }
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
