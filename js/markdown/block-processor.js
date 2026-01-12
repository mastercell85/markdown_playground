/**
 * Block Processor Module
 * Handles block-level markdown elements (paragraphs, lists, blockquotes, code blocks, tables, hr)
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
            taskList: this.isTaskListItem.bind(this),
            blockquote: this.isBlockquote.bind(this),
            codeBlock: this.isCodeBlock.bind(this),
            horizontalRule: this.isHorizontalRule.bind(this),
            table: this.isTableRow.bind(this),
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
        let inCodeBlock = false;
        let codeBlockContent = [];
        let codeBlockLanguage = '';
        let inTable = false;
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Code block handling
            if (this.isCodeBlock(trimmed)) {
                if (!inCodeBlock) {
                    // Starting code block
                    inCodeBlock = true;
                    codeBlockLanguage = trimmed.substring(3).trim(); // Get language after ```
                    codeBlockContent = [];

                    // Close any open list or table
                    if (inList) {
                        result.push(`</${listType}>`);
                        inList = false;
                        listType = null;
                    }
                    if (inTable) {
                        result.push(this.processTable(tableRows));
                        inTable = false;
                        tableRows = [];
                    }
                } else {
                    // Ending code block
                    inCodeBlock = false;
                    result.push(this.processCodeBlock(codeBlockContent, codeBlockLanguage));
                    codeBlockContent = [];
                    codeBlockLanguage = '';
                }
                continue;
            }

            // If inside code block, collect lines
            if (inCodeBlock) {
                codeBlockContent.push(line);
                continue;
            }

            // Horizontal rule
            if (this.isHorizontalRule(trimmed)) {
                // Close any open list or table
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                if (inTable) {
                    result.push(this.processTable(tableRows));
                    inTable = false;
                    tableRows = [];
                }
                result.push('<hr />');
                continue;
            }

            // Table handling
            if (this.isTableRow(trimmed)) {
                // Close any open list
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }

                inTable = true;
                tableRows.push(trimmed);
                continue;
            } else if (inTable) {
                // End of table
                result.push(this.processTable(tableRows));
                inTable = false;
                tableRows = [];
                // Process current line normally (fall through)
            }

            // Task list (special type of unordered list)
            if (this.isTaskListItem(trimmed)) {
                if (!inList || listType !== 'ul-task') {
                    if (inList) result.push(`</${listType}>`);
                    result.push('<ul class="task-list">');
                    inList = true;
                    listType = 'ul-task';
                }
                result.push(this.processTaskListItem(trimmed));
                continue;
            }

            // Unordered list
            if (this.isUnorderedListItem(trimmed)) {
                if (!inList || listType !== 'ul') {
                    if (inList) result.push(`</${listType}>`);
                    result.push('<ul>');
                    inList = true;
                    listType = 'ul';
                }
                result.push(this.processUnorderedListItem(trimmed));
                continue;
            }

            // Ordered list
            if (this.isOrderedListItem(trimmed)) {
                if (!inList || listType !== 'ol') {
                    if (inList) result.push(`</${listType}>`);
                    result.push('<ol>');
                    inList = true;
                    listType = 'ol';
                }
                result.push(this.processOrderedListItem(trimmed));
                continue;
            }

            // Blockquote
            if (this.isBlockquote(trimmed)) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                result.push(this.processBlockquote(trimmed));
                continue;
            }

            // Regular paragraph or heading
            if (trimmed) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                // Check if it's a heading and process it
                if (this.isHeading(trimmed)) {
                    result.push(this.processHeading(trimmed));
                } else {
                    result.push(`<p>${line}</p>`);
                }
            } else {
                // Empty line - close lists
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
            }
        }

        // Close any open list at end
        if (inList) {
            result.push(`</${listType}>`);
        }

        // Close any open table at end
        if (inTable) {
            result.push(this.processTable(tableRows));
        }

        // Close any open code block at end (shouldn't happen but just in case)
        if (inCodeBlock) {
            result.push(this.processCodeBlock(codeBlockContent, codeBlockLanguage));
        }

        return result.join('\n');
    }

    /**
     * Check if line is unordered list item
     */
    isUnorderedListItem(line) {
        return line.match(/^[-*+] /) && !this.isTaskListItem(line);
    }

    /**
     * Check if line is ordered list item
     */
    isOrderedListItem(line) {
        return line.match(/^\d+\. /);
    }

    /**
     * Check if line is task list item
     */
    isTaskListItem(line) {
        return line.match(/^[-*+] \[([ xX])\] /);
    }

    /**
     * Check if line is blockquote
     */
    isBlockquote(line) {
        return line.startsWith('> ');
    }

    /**
     * Check if line is code block fence
     */
    isCodeBlock(line) {
        return line.startsWith('```');
    }

    /**
     * Check if line is horizontal rule
     */
    isHorizontalRule(line) {
        return line.match(/^(---+|\*\*\*+|___+)$/);
    }

    /**
     * Check if line is table row
     */
    isTableRow(line) {
        return line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|');
    }

    /**
     * Check if line is heading (markdown syntax)
     */
    isHeading(line) {
        return line.match(/^#{1,6} /);
    }

    /**
     * Process heading into HTML
     */
    processHeading(line) {
        const match = line.match(/^(#{1,6}) (.+)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2];
            return `<h${level}>${text}</h${level}>`;
        }
        return line;
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
     * Process task list item
     */
    processTaskListItem(line) {
        const match = line.match(/^[-*+] \[([ xX])\] (.*)$/);
        if (match) {
            const checked = match[1].toLowerCase() === 'x';
            const content = match[2];
            const checkbox = checked
                ? '<input type="checkbox" checked disabled />'
                : '<input type="checkbox" disabled />';
            return `<li class="task-list-item">${checkbox} ${content}</li>`;
        }
        return `<li>${line}</li>`;
    }

    /**
     * Process blockquote
     */
    processBlockquote(line) {
        return `<blockquote>${line.substring(2)}</blockquote>`;
    }

    /**
     * Process code block (multi-line)
     */
    processCodeBlock(lines, language) {
        const escapedContent = lines
            .map(line => this.escapeHtml(line))
            .join('\n');

        const langClass = language ? ` class="language-${language}"` : '';
        return `<pre><code${langClass}>${escapedContent}</code></pre>`;
    }

    /**
     * Process table
     */
    processTable(rows) {
        if (rows.length < 2) return ''; // Need at least header and separator

        const tableHtml = ['<table>'];

        // First row is header
        const headerCells = this.parseTableRow(rows[0]);
        tableHtml.push('<thead>');
        tableHtml.push('<tr>');
        headerCells.forEach(cell => {
            tableHtml.push(`<th>${cell}</th>`);
        });
        tableHtml.push('</tr>');
        tableHtml.push('</thead>');

        // Second row should be separator (skip it)
        if (rows.length > 2) {
            tableHtml.push('<tbody>');
            for (let i = 2; i < rows.length; i++) {
                const cells = this.parseTableRow(rows[i]);
                tableHtml.push('<tr>');
                cells.forEach(cell => {
                    tableHtml.push(`<td>${cell}</td>`);
                });
                tableHtml.push('</tr>');
            }
            tableHtml.push('</tbody>');
        }

        tableHtml.push('</table>');
        return tableHtml.join('\n');
    }

    /**
     * Parse table row into cells
     */
    parseTableRow(row) {
        // Remove leading/trailing pipes and split by pipe
        return row
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map(cell => cell.trim());
    }

    /**
     * Escape HTML entities in code blocks
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockProcessor;
}
