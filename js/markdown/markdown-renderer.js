/**
 * Markdown Renderer Module
 * Handles rendering markdown to HTML and updating preview
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles rendering logic
 * - Dependency Inversion: Depends on MarkdownParser and WindowManager abstractions
 * - Interface Segregation: Clean, focused public API
 */

class MarkdownRenderer {
    constructor(config = {}) {
        this.parser = config.parser;
        this.inputElement = config.inputElement;
        this.outputElement = config.outputElement;
        this.windowManager = config.windowManager;
        this.onRender = config.onRender || null;
    }

    /**
     * Initialize renderer and setup event listeners
     */
    init() {
        if (this.inputElement) {
            // Use input event for real-time updates
            this.inputElement.addEventListener('input', () => this.render());
            // Initial render
            this.render();
        }
        return this;
    }

    /**
     * Render markdown to preview
     */
    render() {
        const markdown = this.inputElement.value;
        const html = this.parser.parse(markdown);

        // Update split-screen preview
        if (this.outputElement) {
            this.outputElement.innerHTML = html;
        }

        // Update external window if open
        if (this.windowManager && this.windowManager.isOpen()) {
            this.windowManager.updateContent(html);
        }

        // Trigger callback if provided
        if (this.onRender) {
            this.onRender({ markdown, html });
        }
    }

    /**
     * Get current markdown content
     * @returns {string}
     */
    getMarkdown() {
        return this.inputElement ? this.inputElement.value : '';
    }

    /**
     * Set markdown content
     * @param {string} markdown - Markdown text
     */
    setMarkdown(markdown) {
        if (this.inputElement) {
            this.inputElement.value = markdown;
            this.render();
        }
    }

    /**
     * Get current HTML output
     * @returns {string}
     */
    getHtml() {
        return this.outputElement ? this.outputElement.innerHTML : '';
    }

    /**
     * Clear all content
     */
    clear() {
        if (this.inputElement) {
            this.inputElement.value = '';
        }
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
        }
        if (this.windowManager && this.windowManager.isOpen()) {
            this.windowManager.updateContent('');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownRenderer;
}
