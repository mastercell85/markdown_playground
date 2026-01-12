/**
 * Rule Engine Module
 * Manages markdown parsing rules
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages parsing rules
 * - Open/Closed: Open for extension (add rules), closed for modification
 * - Liskov Substitution: Rules follow consistent interface
 */

class RuleEngine {
    constructor() {
        this.rules = [];
        this.initializeDefaultRules();
    }

    /**
     * Initialize default markdown rules
     */
    initializeDefaultRules() {
        // Note: Headers are now processed by BlockProcessor, not here

        // Images (must come before links)
        this.addRule(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />', 'image');

        // Links
        this.addRule(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>', 'link');

        // Bold and Italic (process in order from most specific to least)
        this.addRule(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>', 'bold-italic-asterisk');
        this.addRule(/\*\*(.+?)\*\*/g, '<strong>$1</strong>', 'bold-asterisk');
        this.addRule(/\*(.+?)\*/g, '<em>$1</em>', 'italic-asterisk');
        this.addRule(/___(.+?)___/g, '<strong><em>$1</em></strong>', 'bold-italic-underscore');
        this.addRule(/__(.+?)__/g, '<strong>$1</strong>', 'bold-underscore');
        this.addRule(/_(.+?)_/g, '<em>$1</em>', 'italic-underscore');

        // Strikethrough
        this.addRule(/~~(.+?)~~/g, '<del>$1</del>', 'strikethrough');

        // Inline code
        this.addRule(/`([^`]+)`/g, '<code>$1</code>', 'inline-code');

        // Line breaks
        this.addRule(/\n$/gim, '<br />', 'line-break');
    }

    /**
     * Add a new parsing rule
     * @param {RegExp} pattern - Regular expression pattern
     * @param {string} replacement - Replacement string or template
     * @param {string} name - Rule identifier
     */
    addRule(pattern, replacement, name) {
        this.rules.push({ pattern, replacement, name });
    }

    /**
     * Remove a rule by name
     * @param {string} name - Rule identifier
     */
    removeRule(name) {
        this.rules = this.rules.filter(rule => rule.name !== name);
    }

    /**
     * Apply all rules to text
     * @param {string} text - Text to process
     * @returns {string} - Processed text
     */
    apply(text) {
        if (!text) return '';

        let result = text;

        // Apply all rules in order
        this.rules.forEach(rule => {
            result = result.replace(rule.pattern, rule.replacement);
        });

        return result;
    }

    /**
     * Get all rules
     * @returns {Array} - Array of rule objects
     */
    getRules() {
        return [...this.rules];
    }

    /**
     * Clear all rules
     */
    clearRules() {
        this.rules = [];
    }

    /**
     * Reset to default rules
     */
    resetToDefaults() {
        this.clearRules();
        this.initializeDefaultRules();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuleEngine;
}
