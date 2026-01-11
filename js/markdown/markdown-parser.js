/**
 * Markdown Parser Module
 * Main parser that coordinates ShortcutProcessor, RuleEngine, and BlockProcessor
 *
 * SOLID Principles:
 * - Single Responsibility: Coordinates parsing, doesn't implement details
 * - Dependency Inversion: Depends on processor abstractions
 * - Open/Closed: Can be extended with new processors
 */

class MarkdownParser {
    constructor(ruleEngine, blockProcessor, shortcutProcessor) {
        this.ruleEngine = ruleEngine || new RuleEngine();
        this.blockProcessor = blockProcessor || new BlockProcessor();

        // Check if ShortcutProcessor is available
        if (typeof ShortcutProcessor !== 'undefined') {
            this.shortcutProcessor = shortcutProcessor || new ShortcutProcessor();
        } else {
            console.warn('ShortcutProcessor not loaded, shortcuts will not work');
            this.shortcutProcessor = null;
        }
    }

    /**
     * Parse markdown text to HTML
     * @param {string} markdown - Raw markdown text
     * @returns {string} - Rendered HTML
     */
    parse(markdown) {
        if (!markdown) return '';

        // Step 0: Convert shortcuts to standard markdown (if shortcut processor is available)
        let processedMarkdown = markdown;
        if (this.shortcutProcessor) {
            try {
                processedMarkdown = this.shortcutProcessor.process(markdown);
            } catch (error) {
                console.error('Error in shortcut processing:', error);
                processedMarkdown = markdown; // Fallback to original markdown
            }
        }

        // Step 1: Process block-level elements first (code blocks, lists, tables, etc.)
        // This prevents inline rules from interfering with block syntax
        let html = this.blockProcessor.process(processedMarkdown);

        // Step 2: Apply inline rules (bold, italic, links, code, etc.)
        // But we need to avoid processing content inside <pre><code> blocks
        html = this.applyInlineRulesSelectively(html);

        return html;
    }

    /**
     * Apply inline rules but skip content inside code blocks
     * @param {string} html - HTML with block elements processed
     * @returns {string} - HTML with inline rules applied
     */
    applyInlineRulesSelectively(html) {
        // Split by code blocks to protect them
        const codeBlockRegex = /(<pre><code[\s\S]*?<\/code><\/pre>)/g;
        const parts = html.split(codeBlockRegex);

        // Apply inline rules only to non-code-block parts
        for (let i = 0; i < parts.length; i++) {
            // Odd indices are code blocks (captured groups), even indices are regular content
            if (i % 2 === 0) {
                parts[i] = this.ruleEngine.apply(parts[i]);
            }
        }

        return parts.join('');
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
     * Get the shortcut processor instance
     * @returns {ShortcutProcessor}
     */
    getShortcutProcessor() {
        return this.shortcutProcessor;
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
