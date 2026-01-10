/**
 * Document Model
 * Represents a single markdown document
 *
 * SOLID Principles:
 * - Single Responsibility: Only represents document data
 * - Open/Closed: Can be extended with metadata properties
 */

class MarkdownDocument {
    constructor(config = {}) {
        this.id = config.id || this.generateId();
        this.name = config.name || 'Untitled';
        this.content = config.content || '';
        this.created = config.created || new Date();
        this.modified = config.modified || new Date();
        this.metadata = config.metadata || {};
    }

    /**
     * Generate unique document ID
     * @returns {string}
     */
    generateId() {
        return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update document content
     * @param {string} content - New content
     */
    setContent(content) {
        this.content = content;
        this.modified = new Date();
    }

    /**
     * Update document name
     * @param {string} name - New name
     */
    setName(name) {
        this.name = name;
        this.modified = new Date();
    }

    /**
     * Get document data as plain object
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            content: this.content,
            created: this.created,
            modified: this.modified,
            metadata: this.metadata
        };
    }

    /**
     * Create Document from plain object
     * @param {Object} data - Document data
     * @returns {Document}
     */
    static fromJSON(data) {
        return new MarkdownDocument({
            id: data.id,
            name: data.name,
            content: data.content,
            created: new Date(data.created),
            modified: new Date(data.modified),
            metadata: data.metadata || {}
        });
    }

    /**
     * Get display name (truncated if too long)
     * @param {number} maxLength - Maximum length
     * @returns {string}
     */
    getDisplayName(maxLength = 20) {
        if (this.name.length <= maxLength) {
            return this.name;
        }
        return this.name.substring(0, maxLength - 3) + '...';
    }

    /**
     * Check if document is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.content.trim().length === 0;
    }

    /**
     * Check if document is modified (has content and name is still Untitled)
     * @returns {boolean}
     */
    isUntitled() {
        return this.name === 'Untitled' || this.name.startsWith('Untitled-');
    }

    /**
     * Clone document with new ID
     * @returns {Document}
     */
    clone() {
        return new MarkdownDocument({
            name: `${this.name} (Copy)`,
            content: this.content,
            metadata: { ...this.metadata }
        });
    }
}

// Export for use in other modules (browser environment)
if (typeof window !== 'undefined') {
    window.MarkdownDocument = MarkdownDocument;
}
// Also support Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownDocument;
}
