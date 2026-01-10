/**
 * Markdown Parser Module
 * Main parser that coordinates RuleEngine and BlockProcessor
 *
 * SOLID Principles:
 * - Single Responsibility: Coordinates parsing, doesn't implement details
 * - Dependency Inversion: Depends on RuleEngine and BlockProcessor abstractions
 * - Open/Closed: Can be extended with new processors
 */

class MarkdownParser {
    constructor(ruleEngine, blockProcessor) {
        this.ruleEngine = ruleEngine || new RuleEngine();
        this.blockProcessor = blockProcessor || new BlockProcessor();
    }

    /**
     * Parse markdown text to HTML
     * @param {string} markdown - Raw markdown text
     * @returns {string} - Rendered HTML
     */
    parse(markdown) {
        if (!markdown) return '';

        // Step 1: Apply inline rules (bold, italic, links, code, etc.)
        let html = this.ruleEngine.apply(markdown);

        // Step 2: Process block-level elements (paragraphs, lists, blockquotes)
        html = this.blockProcessor.process(html);

        return html;
    }

    /**
     * Get the rule engine instance
     * @returns {RuleEngine}
     */
    getRuleEngine() {
        return this.ruleEngine;
    }

    /**
     * Get the block processor instance
     * @returns {BlockProcessor}
     */
    getBlockProcessor() {
        return this.blockProcessor;
    }

    /**
     * Add a custom inline rule
     * @param {RegExp} pattern - Regular expression pattern
     * @param {string} replacement - Replacement string
     * @param {string} name - Rule identifier
     */
    addInlineRule(pattern, replacement, name) {
        this.ruleEngine.addRule(pattern, replacement, name);
    }

    /**
     * Remove a custom inline rule
     * @param {string} name - Rule identifier
     */
    removeInlineRule(name) {
        this.ruleEngine.removeRule(name);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownParser;
}
