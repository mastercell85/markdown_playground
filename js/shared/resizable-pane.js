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

        // Calculate new widths
        const newLeftWidth = this.startLeftWidth + deltaX;
        const newRightWidth = this.startRightWidth - deltaX;

        // Enforce minimum widths
        if (newLeftWidth >= this.minPaneWidth && newRightWidth >= this.minPaneWidth) {
            const leftFlex = newLeftWidth / containerWidth;
            const rightFlex = newRightWidth / containerWidth;

            this.leftPane.style.flex = `${leftFlex} 0 0px`;
            this.rightPane.style.flex = `${rightFlex} 0 0px`;

            // Trigger callback if provided
            if (this.onResize) {
                this.onResize({
                    leftWidth: newLeftWidth,
                    rightWidth: newRightWidth,
                    leftFlex,
                    rightFlex
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
        this.leftPane.style.flex = '1 0 0px';
        this.rightPane.style.flex = '1 0 0px';
    }

    /**
     * Set specific widths
     * @param {number} leftPercent - Left pane percentage (0-100)
     */
    setWidths(leftPercent) {
        const rightPercent = 100 - leftPercent;
        this.leftPane.style.flex = `${leftPercent / 100} 0 0px`;
        this.rightPane.style.flex = `${rightPercent / 100} 0 0px`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResizablePane;
}
