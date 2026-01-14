/**
 * LineMapper - Bidirectional Line-to-Element Mapping System
 *
 * Provides accurate mapping between source markdown lines and rendered DOM elements,
 * enabling precise scroll synchronization and future WYSIWYG editing support.
 *
 * Architecture:
 * - Block-level mapping for scroll sync (fast, low memory)
 * - Character-level mapping on-demand for WYSIWYG (calculated when needed)
 * - Two-phase generation: parser seeds data-line attributes, post-render adds measurements
 * - Element-height weighted interpolation for accurate scroll positioning
 * - Time-debounced rebuild (150-300ms) after DOM changes
 * - Single active map only (cleared on document switch to prevent memory leaks)
 *
 * @version 1.0.0
 * @see DOCUMENTATION.md Phase 2: Scroll Sync Accuracy & WYSIWYG Infrastructure
 */

'use strict';

/**
 * LineMapper class - Core mapping system
 */
class LineMapper {
    /**
     * Create a LineMapper instance
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.previewContainer - The preview container element
     * @param {number} [options.rebuildDebounceMs=200] - Debounce delay for rebuilds in ms
     * @param {boolean} [options.debug=false] - Enable debug logging and performance marks
     */
    constructor(options = {}) {
        // Configuration
        this.previewContainer = options.previewContainer || null;
        this.rebuildDebounceMs = options.rebuildDebounceMs || 200;
        this.debug = options.debug || false;

        // SourceMap: line-to-element mappings
        this.lineToElement = new Map();      // Map<lineNumber, ElementInfo>
        this.elementToLines = new Map();     // Map<element, LineRange>

        // DOMTracker: element measurements
        this.elementHeights = new Map();     // Map<element, number>
        this.elementOffsets = new Map();     // Map<element, number>
        this.totalMappedHeight = 0;
        this.totalSourceLines = 0;

        // State management
        this.isDirty = true;                 // Map needs rebuild
        this.isBuilding = false;             // Currently rebuilding
        this.lastBuildTime = 0;              // Performance tracking

        // Debounce timer
        this.rebuildTimer = null;

        // MutationObserver for DOM changes
        this.observer = null;

        // Event listeners
        this.listeners = {
            update: [],
            error: []
        };

        // Bind methods for event handlers
        this._handleMutation = this._handleMutation.bind(this);
        this._debouncedRebuild = this._debouncedRebuild.bind(this);
    }

    /**
     * Initialize the LineMapper
     * @param {HTMLElement} [previewContainer] - Optional preview container override
     * @returns {LineMapper} this for chaining
     */
    init(previewContainer) {
        if (previewContainer) {
            this.previewContainer = previewContainer;
        }

        if (!this.previewContainer) {
            this._emitError('LineMapper: No preview container provided');
            return this;
        }

        // Setup MutationObserver for DOM changes
        this._setupObserver();

        // Initial build
        this.rebuild();

        if (this.debug) {
            console.log('LineMapper: Initialized', {
                container: this.previewContainer,
                debounceMs: this.rebuildDebounceMs
            });
        }

        return this;
    }

    /**
     * Setup MutationObserver to watch for DOM changes
     * @private
     */
    _setupObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new MutationObserver(this._handleMutation);

        this.observer.observe(this.previewContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-line', 'data-line-start', 'data-line-end']
        });
    }

    /**
     * Handle MutationObserver callbacks
     * @private
     * @param {MutationRecord[]} mutations - Array of mutation records
     */
    _handleMutation(mutations) {
        // Mark as dirty and schedule rebuild
        this.isDirty = true;
        this._debouncedRebuild();
    }

    /**
     * Debounced rebuild - waits for changes to settle
     * @private
     */
    _debouncedRebuild() {
        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
        }

        this.rebuildTimer = setTimeout(() => {
            this.rebuildTimer = null;
            if (this.isDirty) {
                this.rebuild();
            }
        }, this.rebuildDebounceMs);
    }

    // =========================================================================
    // CORE MAPPING QUERIES
    // =========================================================================

    /**
     * Get the DOM element for a source line number
     * @param {number} line - Source line number (1-based)
     * @returns {Element|null} The element containing that line, or null
     */
    getElementForLine(line) {
        this._ensureBuilt();

        // Direct lookup first
        if (this.lineToElement.has(line)) {
            return this.lineToElement.get(line).element;
        }

        // Find containing element (for lines within multi-line blocks)
        for (const [element, range] of this.elementToLines) {
            if (line >= range.start && line <= range.end) {
                return element;
            }
        }

        return null;
    }

    /**
     * Get the source line range for a DOM element
     * @param {Element} element - The DOM element
     * @returns {{start: number, end: number}|null} Line range or null
     */
    getLinesForElement(element) {
        this._ensureBuilt();
        return this.elementToLines.get(element) || null;
    }

    /**
     * Get the scroll position (in pixels) for a source line
     * Uses element-height weighted interpolation for accuracy
     * @param {number} line - Source line number (1-based)
     * @returns {number} Scroll position in pixels
     */
    getScrollPositionForLine(line) {
        this._ensureBuilt();

        if (this.elementToLines.size === 0) {
            return 0;
        }

        // Find the element containing this line
        let targetElement = null;
        let targetRange = null;

        for (const [element, range] of this.elementToLines) {
            if (line >= range.start && line <= range.end) {
                targetElement = element;
                targetRange = range;
                break;
            }
            // Track last element before our target line
            if (range.end < line) {
                targetElement = element;
                targetRange = range;
            }
        }

        if (!targetElement || !targetRange) {
            // Line is before first mapped element
            return 0;
        }

        const elementOffset = this.elementOffsets.get(targetElement) || 0;
        const elementHeight = this.elementHeights.get(targetElement) || 0;

        // Sub-element interpolation: calculate position within the element
        const lineSpan = targetRange.end - targetRange.start + 1;
        const lineOffset = line - targetRange.start;
        const fraction = lineSpan > 1 ? lineOffset / lineSpan : 0;

        return elementOffset + (elementHeight * fraction);
    }

    /**
     * Get the source line number for a scroll position
     * Uses element-height weighted reverse interpolation
     * @param {number} scrollTop - Scroll position in pixels
     * @returns {number} Source line number (may be fractional for sub-element positions)
     */
    getLineForScrollPosition(scrollTop) {
        this._ensureBuilt();

        if (this.elementToLines.size === 0) {
            return 1;
        }

        // Find element at this scroll position
        let targetElement = null;
        let targetRange = null;
        let prevElement = null;
        let prevRange = null;

        for (const [element, range] of this.elementToLines) {
            const offset = this.elementOffsets.get(element) || 0;
            const height = this.elementHeights.get(element) || 0;

            if (scrollTop >= offset && scrollTop < offset + height) {
                targetElement = element;
                targetRange = range;
                break;
            }

            if (offset + height <= scrollTop) {
                prevElement = element;
                prevRange = range;
            }
        }

        // If we're past all elements, return last line
        if (!targetElement && prevElement) {
            return prevRange.end;
        }

        if (!targetElement) {
            return 1;
        }

        const elementOffset = this.elementOffsets.get(targetElement) || 0;
        const elementHeight = this.elementHeights.get(targetElement) || 0;

        // Sub-element interpolation: calculate line within the element
        const lineSpan = targetRange.end - targetRange.start + 1;
        const positionInElement = scrollTop - elementOffset;
        const fraction = elementHeight > 0 ? positionInElement / elementHeight : 0;

        return targetRange.start + (fraction * lineSpan);
    }

    // =========================================================================
    // HEIGHT/POSITION INFO
    // =========================================================================

    /**
     * Get the rendered height of an element
     * @param {Element} element - The DOM element
     * @returns {number} Height in pixels
     */
    getElementHeight(element) {
        this._ensureBuilt();
        return this.elementHeights.get(element) || 0;
    }

    /**
     * Get the offset (from container top) of an element
     * @param {Element} element - The DOM element
     * @returns {number} Offset in pixels
     */
    getElementOffset(element) {
        this._ensureBuilt();
        return this.elementOffsets.get(element) || 0;
    }

    /**
     * Get the total mapped content height
     * @returns {number} Total height in pixels
     */
    getTotalMappedHeight() {
        this._ensureBuilt();
        return this.totalMappedHeight;
    }

    /**
     * Get the total number of source lines mapped
     * @returns {number} Total line count
     */
    getTotalSourceLines() {
        this._ensureBuilt();
        return this.totalSourceLines;
    }

    // =========================================================================
    // WYSIWYG HOOKS (Essential - On-Demand Calculation)
    // =========================================================================

    /**
     * Get the rendered DOM position for a source cursor position
     * Calculates character-level mapping on-demand
     * @param {number} line - Source line number (1-based)
     * @param {number} column - Column position (0-based)
     * @returns {{element: Element, offset: number}|null} DOM position or null
     */
    getRenderedPositionForCursor(line, column) {
        this._ensureBuilt();

        const element = this.getElementForLine(line);
        if (!element) {
            return null;
        }

        // For now, return block-level position
        // Character-level calculation will be enhanced in Phase 2c
        const range = this.elementToLines.get(element);
        if (!range) {
            return { element, offset: 0 };
        }

        // Estimate offset based on line position within block
        const lineSpan = range.end - range.start + 1;
        const lineOffset = line - range.start;
        const textContent = element.textContent || '';
        const estimatedOffset = Math.floor((textContent.length / lineSpan) * lineOffset) + column;

        return {
            element,
            offset: Math.min(estimatedOffset, textContent.length)
        };
    }

    /**
     * Get the source position for a DOM selection
     * @param {Selection} selection - DOM Selection object
     * @returns {{line: number, column: number}|null} Source position or null
     */
    getSourcePositionForSelection(selection) {
        this._ensureBuilt();

        if (!selection || !selection.anchorNode) {
            return null;
        }

        // Find the mapped element containing the selection
        let node = selection.anchorNode;
        let element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;

        while (element && !this.elementToLines.has(element)) {
            element = element.parentElement;
            if (element === this.previewContainer || !element) {
                return null;
            }
        }

        if (!element) {
            return null;
        }

        const range = this.elementToLines.get(element);
        if (!range) {
            return null;
        }

        // Estimate line based on offset
        const textContent = element.textContent || '';
        const offset = selection.anchorOffset;
        const lineSpan = range.end - range.start + 1;
        const fraction = textContent.length > 0 ? offset / textContent.length : 0;
        const lineOffset = Math.floor(fraction * lineSpan);

        return {
            line: range.start + lineOffset,
            column: 0 // Column calculation will be enhanced in Phase 2c
        };
    }

    /**
     * Get the block element containing a source position
     * @param {number} line - Source line number
     * @returns {{element: Element, startLine: number, endLine: number}|null}
     */
    getContainingBlock(line) {
        this._ensureBuilt();

        const element = this.getElementForLine(line);
        if (!element) {
            return null;
        }

        const range = this.elementToLines.get(element);
        if (!range) {
            return null;
        }

        return {
            element,
            startLine: range.start,
            endLine: range.end
        };
    }

    /**
     * Check if a source line is in a "raw" zone (code block, frontmatter, etc.)
     * Raw zones should not have WYSIWYG rendering applied
     * @param {number} line - Source line number
     * @returns {boolean} True if in a raw zone
     */
    isRawZone(line) {
        this._ensureBuilt();

        const element = this.getElementForLine(line);
        if (!element) {
            return false;
        }

        // Check for code blocks
        if (element.tagName === 'PRE' || element.tagName === 'CODE') {
            return true;
        }

        // Check for code block parent
        if (element.closest('pre')) {
            return true;
        }

        // Check for frontmatter (if marked with data attribute)
        if (element.hasAttribute('data-frontmatter')) {
            return true;
        }

        return false;
    }

    /**
     * Get the editable range for the block containing a line
     * @param {number} line - Source line number
     * @returns {{startLine: number, endLine: number, startCol: number, endCol: number}|null}
     */
    getEditableRange(line) {
        const block = this.getContainingBlock(line);
        if (!block) {
            return null;
        }

        return {
            startLine: block.startLine,
            endLine: block.endLine,
            startCol: 0,
            endCol: Infinity // Full line editing for now
        };
    }

    // =========================================================================
    // LIFECYCLE METHODS
    // =========================================================================

    /**
     * Manually trigger a map rebuild
     * Called after markdown is rendered
     */
    update() {
        this.isDirty = true;
        this.rebuild();
    }

    /**
     * Mark the map as dirty/invalid
     * Used for document switches - clears the map immediately
     */
    invalidate() {
        // Clear all mappings
        this.lineToElement.clear();
        this.elementToLines.clear();
        this.elementHeights.clear();
        this.elementOffsets.clear();
        this.totalMappedHeight = 0;
        this.totalSourceLines = 0;
        this.isDirty = true;

        // Cancel any pending rebuild
        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
            this.rebuildTimer = null;
        }

        if (this.debug) {
            console.log('LineMapper: Invalidated (map cleared)');
        }
    }

    /**
     * Cleanup and destroy the LineMapper
     */
    destroy() {
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Clear timer
        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
            this.rebuildTimer = null;
        }

        // Clear all maps
        this.invalidate();

        // Clear listeners
        this.listeners.update = [];
        this.listeners.error = [];

        if (this.debug) {
            console.log('LineMapper: Destroyed');
        }
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    /**
     * Register an event listener
     * @param {string} event - Event name ('update' or 'error')
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback to remove
     */
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    /**
     * Emit an update event
     * @private
     */
    _emitUpdate() {
        const data = {
            lineCount: this.totalSourceLines,
            elementCount: this.elementToLines.size,
            buildTime: this.lastBuildTime
        };

        this.listeners.update.forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.error('LineMapper: Error in update listener', e);
            }
        });
    }

    /**
     * Emit an error event
     * @private
     * @param {string} message - Error message
     */
    _emitError(message) {
        console.error(message);
        this.listeners.error.forEach(cb => {
            try {
                cb({ message });
            } catch (e) {
                console.error('LineMapper: Error in error listener', e);
            }
        });
    }

    // =========================================================================
    // BUILD SYSTEM
    // =========================================================================

    /**
     * Ensure the map is built before queries
     * @private
     */
    _ensureBuilt() {
        if (this.isDirty && !this.isBuilding) {
            this.rebuild();
        }
    }

    /**
     * Rebuild the entire source map
     * Two-phase: collect elements with data-line, then measure heights
     */
    rebuild() {
        if (!this.previewContainer) {
            return;
        }

        if (this.isBuilding) {
            // Already building, schedule another rebuild after
            this.isDirty = true;
            return;
        }

        this.isBuilding = true;
        const startTime = performance.now();

        if (this.debug) {
            performance.mark('lineMapper-rebuild-start');
        }

        try {
            // Clear existing maps
            this.lineToElement.clear();
            this.elementToLines.clear();
            this.elementHeights.clear();
            this.elementOffsets.clear();

            // Phase 1: Collect elements with line data
            this._collectLineElements();

            // Phase 2: Measure heights and offsets
            this._measureElements();

            this.isDirty = false;
            this.lastBuildTime = performance.now() - startTime;

            if (this.debug) {
                performance.mark('lineMapper-rebuild-end');
                performance.measure('lineMapper-rebuild', 'lineMapper-rebuild-start', 'lineMapper-rebuild-end');
                console.log(`LineMapper: Rebuilt in ${this.lastBuildTime.toFixed(2)}ms`, {
                    elements: this.elementToLines.size,
                    lines: this.totalSourceLines,
                    height: this.totalMappedHeight
                });
            }

            this._emitUpdate();

        } catch (error) {
            this._emitError(`LineMapper: Build error - ${error.message}`);
        } finally {
            this.isBuilding = false;
        }
    }

    /**
     * Phase 1: Collect all elements with data-line attributes
     * @private
     */
    _collectLineElements() {
        // Find all elements with line data
        const elements = this.previewContainer.querySelectorAll('[data-line], [data-line-start]');

        let maxLine = 0;

        elements.forEach(element => {
            let startLine, endLine;

            // Check for range attributes first (multi-line blocks)
            if (element.hasAttribute('data-line-start')) {
                startLine = parseInt(element.getAttribute('data-line-start'), 10);
                endLine = parseInt(element.getAttribute('data-line-end') || startLine, 10);
            } else {
                // Single line attribute
                startLine = parseInt(element.getAttribute('data-line'), 10);
                endLine = startLine;
            }

            if (isNaN(startLine)) {
                return; // Skip invalid
            }

            // Store mappings
            const range = { start: startLine, end: endLine };
            this.elementToLines.set(element, range);

            // Map each line to this element
            for (let line = startLine; line <= endLine; line++) {
                if (!this.lineToElement.has(line)) {
                    this.lineToElement.set(line, {
                        element,
                        isStart: line === startLine,
                        isEnd: line === endLine
                    });
                }
            }

            maxLine = Math.max(maxLine, endLine);
        });

        this.totalSourceLines = maxLine;
    }

    /**
     * Phase 2: Measure element heights and offsets
     * @private
     */
    _measureElements() {
        const containerRect = this.previewContainer.getBoundingClientRect();
        const containerScrollTop = this.previewContainer.scrollTop;
        let totalHeight = 0;

        // Sort elements by their position in the document
        const sortedElements = Array.from(this.elementToLines.keys()).sort((a, b) => {
            const aRect = a.getBoundingClientRect();
            const bRect = b.getBoundingClientRect();
            return aRect.top - bRect.top;
        });

        sortedElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const height = rect.height;
            const offset = rect.top - containerRect.top + containerScrollTop;

            this.elementHeights.set(element, height);
            this.elementOffsets.set(element, offset);

            totalHeight = Math.max(totalHeight, offset + height);
        });

        this.totalMappedHeight = totalHeight;
    }

    // =========================================================================
    // DEBUG UTILITIES
    // =========================================================================

    /**
     * Get a debug dump of the current map state
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const elements = [];
        for (const [element, range] of this.elementToLines) {
            elements.push({
                tag: element.tagName.toLowerCase(),
                lines: `${range.start}-${range.end}`,
                height: this.elementHeights.get(element),
                offset: this.elementOffsets.get(element),
                text: element.textContent?.substring(0, 50) + '...'
            });
        }

        return {
            isDirty: this.isDirty,
            isBuilding: this.isBuilding,
            totalLines: this.totalSourceLines,
            totalHeight: this.totalMappedHeight,
            elementCount: this.elementToLines.size,
            lastBuildTime: this.lastBuildTime,
            elements
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LineMapper;
}
