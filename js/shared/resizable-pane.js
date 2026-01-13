/**
 * Resizable Pane Module
 * Handles draggable divider between two panes
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles pane resizing logic
 * - Open/Closed: Can be extended with new resize behaviors
 * - Dependency Inversion: Uses configuration instead of hardcoded values
 */

class ResizablePane {
    constructor(config = {}) {
        this.dividerSelector = config.dividerSelector;
        this.leftPaneSelector = config.leftPaneSelector;
        this.rightPaneSelector = config.rightPaneSelector;
        this.containerSelector = config.containerSelector;
        this.minPaneWidth = config.minPaneWidth || 200;
        this.onResize = config.onResize || null;

        this.isDragging = false;
        this.startX = 0;
        this.startLeftWidth = 0;
        this.startRightWidth = 0;

        this.divider = null;
        this.leftPane = null;
        this.rightPane = null;
        this.container = null;
    }

    /**
     * Initialize resizable pane
     */
    init() {
        // Get DOM elements
        this.divider = document.querySelector(this.dividerSelector);
        this.leftPane = document.querySelector(this.leftPaneSelector);
        this.rightPane = document.querySelector(this.rightPaneSelector);
        this.container = document.querySelector(this.containerSelector);

        // Validate elements exist
        if (!this.divider || !this.leftPane || !this.rightPane || !this.container) {
            console.warn('ResizablePane: Required elements not found');
            return this;
        }

        // Setup event listeners
        this.setupMouseDownListener();
        this.setupMouseMoveListener();
        this.setupMouseUpListener();
        this.setupCursorHandling();
        this.setupDoubleClickListener();

        return this;
    }

    /**
     * Setup mousedown listener on divider
     */
    setupMouseDownListener() {
        this.divider.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });
    }

    /**
     * Setup mousemove listener for dragging
     */
    setupMouseMoveListener() {
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
    }

    /**
     * Setup mouseup listener to end dragging
     */
    setupMouseUpListener() {
        document.addEventListener('mouseup', () => {
            this.handleMouseUp();
        });
    }

    /**
     * Setup cursor handling during drag
     */
    setupCursorHandling() {
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                document.body.style.cursor = 'col-resize';
            }
        });

        document.addEventListener('mouseup', () => {
            document.body.style.cursor = '';
        });
    }

    /**
     * Setup double-click listener to center split
     */
    setupDoubleClickListener() {
        this.divider.addEventListener('dblclick', (e) => {
            this.centerSplit();
            e.preventDefault();
        });
    }

    /**
     * Handle mousedown event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown(e) {
        this.isDragging = true;
        this.startX = e.clientX;

        // Get current widths
        this.startLeftWidth = this.leftPane.offsetWidth;
        this.startRightWidth = this.rightPane.offsetWidth;

        // Add dragging class for visual feedback
        this.divider.classList.add('dragging');

        // Prevent text selection during drag
        e.preventDefault();
    }

    /**
     * Handle mousemove event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.startX;
        const containerWidth = this.container.offsetWidth;

        // Calculate new left width
        const newLeftWidth = this.startLeftWidth + deltaX;

        // Calculate available space for right pane (accounting for gap if present)
        const gap = this.container.querySelector('.editor-gap');
        const gapWidth = gap ? gap.offsetWidth : 0;
        const availableForRight = containerWidth - newLeftWidth - gapWidth;

        // Enforce minimum widths
        if (newLeftWidth >= this.minPaneWidth && availableForRight >= this.minPaneWidth) {
            // Only set left pane width explicitly - right pane uses flex: 1 to fill remaining space
            this.leftPane.style.flex = `0 0 ${newLeftWidth}px`;
            this.rightPane.style.flex = '1 1 0px';

            // Trigger callback if provided
            if (this.onResize) {
                this.onResize({
                    leftWidth: newLeftWidth,
                    rightWidth: availableForRight,
                    leftFlex: newLeftWidth / containerWidth,
                    rightFlex: availableForRight / containerWidth
                });
            }
        }
    }

    /**
     * Handle mouseup event
     */
    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.divider.classList.remove('dragging');
        }
    }

    /**
     * Reset panes to equal width
     */
    reset() {
        this.leftPane.style.flex = '1 1 0px';
        this.rightPane.style.flex = '1 1 0px';
    }

    /**
     * Set specific widths
     * @param {number} leftPercent - Left pane percentage (0-100)
     */
    setWidths(leftPercent) {
        const containerWidth = this.container.offsetWidth;
        const gap = this.container.querySelector('.editor-gap');
        const gapWidth = gap ? gap.offsetWidth : 0;
        const availableWidth = containerWidth - gapWidth;
        const leftWidth = (availableWidth * leftPercent) / 100;

        this.leftPane.style.flex = `0 0 ${leftWidth}px`;
        this.rightPane.style.flex = '1 1 0px';
    }

    /**
     * Center the split (50/50 layout)
     * Animates the transition smoothly
     */
    centerSplit() {
        // Calculate 50% split accounting for gap
        const containerWidth = this.container.offsetWidth;
        const gap = this.container.querySelector('.editor-gap');
        const gapWidth = gap ? gap.offsetWidth : 0;
        const availableWidth = containerWidth - gapWidth;
        const halfWidth = availableWidth / 2;

        // Add transition for smooth animation
        this.leftPane.style.transition = 'flex 0.3s ease-in-out';
        this.rightPane.style.transition = 'flex 0.3s ease-in-out';

        // Set to 50/50
        this.leftPane.style.flex = `0 0 ${halfWidth}px`;
        this.rightPane.style.flex = '1 1 0px';

        // Visual feedback - briefly add a class to the divider
        this.divider.classList.add('centering');

        // Remove transition and visual feedback after animation completes
        setTimeout(() => {
            this.leftPane.style.transition = '';
            this.rightPane.style.transition = '';
            this.divider.classList.remove('centering');
        }, 300);

        // Trigger callback if provided
        if (this.onResize) {
            this.onResize({
                leftWidth: halfWidth,
                rightWidth: halfWidth,
                leftFlex: 0.5,
                rightFlex: 0.5
            });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResizablePane;
}
