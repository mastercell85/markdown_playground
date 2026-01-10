/**
 * Block Processor Module
 * Handles block-level markdown elements (paragraphs, lists, blockquotes, code blocks)
 *
 * SOLID Principles:
 * - Single Responsibility: Only processes block-level elements
 * - Open/Closed: Can be extended with new block types
 */

class BlockProcessor {
    constructor() {
        this.blockHandlers = this.initializeBlockHandlers();
    }

    /**
     * Initialize block type handlers
     */
    initializeBlockHandlers() {
        return {
            unorderedList: this.isUnorderedListItem.bind(this),
            orderedList: this.isOrderedListItem.bind(this),
            blockquote: this.isBlockquote.bind(this),
            codeBlock: this.isCodeBlock.bind(this),
            heading: this.isHeading.bind(this),
            paragraph: this.isParagraph.bind(this)
        };
    }

    /**
     * Process text into block-level HTML
     * @param {string} html - Pre-processed HTML from inline rules
     * @returns {string} - Fully processed HTML with blocks
     */
    process(html) {
        const lines = html.split('\n');
        const result = [];
        let inList = false;
        let listType = null;

        for (let line of lines) {
            const trimmed = line.trim();

            // Unordered list
            if (this.isUnorderedListItem(trimmed)) {
                if (!inList || listType !== 'ul') {
                    if (inList) result.push(`</${listType}>`);
                    result.push('<ul>');
                    inList = true;
                    listType = 'ul';
                }
                result.push(this.processUnorderedListItem(trimmed));
            }
            // Ordered list
            else if (this.isOrderedListItem(trimmed)) {
                if (!inList || listType !== 'ol') {
                    if (inList) result.push(`</${listType}>`);
                    result.push('<ol>');
                    inList = true;
                    listType = 'ol';
                }
                result.push(this.processOrderedListItem(trimmed));
            }
            // Blockquote
            else if (this.isBlockquote(trimmed)) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                result.push(this.processBlockquote(trimmed));
            }
            // Code block
            else if (this.isCodeBlock(trimmed)) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                result.push(this.processCodeBlock(trimmed));
            }
            // Regular paragraph
            else if (trimmed) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                // Don't wrap if already wrapped in HTML tags
                if (!this.isHeading(trimmed)) {
                    result.push(`<p>${line}</p>`);
                } else {
                    result.push(line);
                }
            }
            // Empty line
            else {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
            }
        }

        // Close any open list
        if (inList) {
            result.push(`</${listType}>`);
        }

        return result.join('\n');
    }

    /**
     * Check if line is unordered list item
     */
    isUnorderedListItem(line) {
        return line.match(/^[-*+] /);
    }

    /**
     * Check if line is ordered list item
     */
    isOrderedListItem(line) {
        return line.match(/^\d+\. /);
    }

    /**
     * Check if line is blockquote
     */
    isBlockquote(line) {
        return line.startsWith('> ');
    }

    /**
     * Check if line is code block
     */
    isCodeBlock(line) {
        return line.startsWith('```');
    }

    /**
     * Check if line is heading (already processed)
     */
    isHeading(line) {
        return line.match(/^<h[1-6]>/);
    }

    /**
     * Check if line is paragraph
     */
    isParagraph(line) {
        return line.trim() && !this.isHeading(line);
    }

    /**
     * Process unordered list item
     */
    processUnorderedListItem(line) {
        return `<li>${line.substring(2)}</li>`;
    }

    /**
     * Process ordered list item
     */
    processOrderedListItem(line) {
        return `<li>${line.replace(/^\d+\. /, '')}</li>`;
    }

    /**
     * Process blockquote
     */
    processBlockquote(line) {
        return `<blockquote>${line.substring(2)}</blockquote>`;
    }

    /**
     * Process code block (simplified)
     */
    processCodeBlock(line) {
        return `<pre><code>${line.substring(3)}</code></pre>`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockProcessor;
}
