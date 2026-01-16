/**
 * WYSIWYG Engine - Typora-style editing
 * Provides contenteditable-based markdown editing with live rendering
 *
 * Behavior:
 * - Type mode: Shows markdown syntax as plain text while typing
 * - Render on Enter: Pressing Enter renders the current block
 * - Edit in place: Rendered elements stay rendered and can be edited directly
 */

class WysiwygEngine {
    constructor(editorElement, lineMapper, markdownParser) {
        this.editorElement = editorElement;
        this.lineMapper = lineMapper;
        this.markdownParser = markdownParser;

        // Current editing state
        this.currentBlock = null;
        this.editMode = false; // true = showing markdown, false = showing rendered

        // Source mode state
        this.sourceMode = false; // true = raw markdown textarea, false = WYSIWYG
        this.sourceTextarea = null;

        // Loading state - prevents input events from saving during document switches
        this.isLoadingDocument = false;

        // Scroll debounce timer - prevents excessive scroll calculations during rapid typing
        this.scrollDebounceTimer = null;

        // Initialize shortcut processor for custom markdown syntax
        this.shortcutProcessor = new ShortcutProcessor();

        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handlePaste = this.handlePaste.bind(this);
        this.handleSourceKeyDown = this.handleSourceKeyDown.bind(this);

        this.init();
    }

    /**
     * Initialize the WYSIWYG engine
     */
    init() {
        if (!this.editorElement) {
            console.warn('WysiwygEngine: No editor element provided');
            return;
        }

        // Attach event listeners
        this.editorElement.addEventListener('keydown', this.handleKeyDown);
        this.editorElement.addEventListener('click', this.handleClick);
        this.editorElement.addEventListener('input', this.handleInput);
        this.editorElement.addEventListener('paste', this.handlePaste);

        // Set initial placeholder if empty
        if (this.editorElement.textContent.trim() === '') {
            this.editorElement.innerHTML = '<p><br></p>';
        }

    }

    /**
     * Handle keydown events
     */
    handleKeyDown(event) {
        // Enter key - render current block
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleEnterKey();
            return;
        }

        // Shift+Enter - insert line break within block
        if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();
            document.execCommand('insertLineBreak');
            return;
        }

        // Tab key - insert tab character for indentation
        if (event.key === 'Tab') {
            event.preventDefault();
            document.execCommand('insertText', false, '\t'); // Tab character
            return;
        }
    }

    /**
     * Handle Enter key - render current block
     */
    handleEnterKey() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const currentNode = range.startContainer;

        // Get the current block (paragraph, heading, etc.)
        const block = this.getCurrentBlock(currentNode);
        if (!block) {
            // No block found, insert new paragraph
            document.execCommand('insertParagraph');
            return;
        }

        // Check if we're inside a rendered list (UL or OL)
        const parentList = block.closest('ul[data-wysiwyg-rendered="true"], ol[data-wysiwyg-rendered="true"]');
        if (parentList && block.tagName === 'LI') {
            // We're inside a list item in a rendered list
            const listItemContent = block.textContent.trim();

            if (listItemContent === '') {
                // Empty list item - exit the list by creating a new paragraph after it
                const newParagraph = document.createElement('p');
                newParagraph.innerHTML = '<br>';
                parentList.parentNode.insertBefore(newParagraph, parentList.nextSibling);

                // Remove the empty list item
                block.remove();

                // Move cursor to new paragraph
                this.setCursorAt(newParagraph, 0);

                // Update the list's markdown
                this.updateRenderedBlockMarkdown(parentList);

                // Scroll into view
                this.scrollCursorIntoView();
            } else {
                // Non-empty list item - add a new list item after current one
                const newLi = document.createElement('li');
                newLi.innerHTML = '<br>';
                block.parentNode.insertBefore(newLi, block.nextSibling);

                // Move cursor to new list item
                this.setCursorAt(newLi, 0);

                // Update the list's markdown
                this.updateRenderedBlockMarkdown(parentList);

                // Scroll into view
                this.scrollCursorIntoView();
            }
            return;
        }

        // Get the markdown text from the block - preserve leading whitespace for indentation
        let markdownText = block.textContent;
        const trimmedText = markdownText.trim();

        if (trimmedText === '') {
            // Empty block, just insert new paragraph
            document.execCommand('insertParagraph');
            return;
        }

        // Check if block already has an indent level (from previous auto-render)
        // If so, prepend tabs to reconstruct the full markdown with indentation
        const existingIndentLevel = parseInt(block.getAttribute('data-indent-level')) || 0;
        if (existingIndentLevel > 0) {
            const tabs = '\t'.repeat(existingIndentLevel);
            markdownText = tabs + markdownText;
        }

        // Render the markdown (renderMarkdown handles indentation detection)
        const rendered = this.renderMarkdown(markdownText);

        if (rendered) {
            // Replace the block with rendered HTML
            // Store original text with leading whitespace for proper markdown reconstruction
            const newBlock = this.createRenderedBlock(rendered, markdownText.trimEnd());
            block.parentNode.replaceChild(newBlock, block);

            // Insert new paragraph after rendered block
            const newParagraph = document.createElement('p');
            newParagraph.innerHTML = '<br>';
            newBlock.parentNode.insertBefore(newParagraph, newBlock.nextSibling);

            // Move cursor to new paragraph
            this.setCursorAt(newParagraph, 0);

            // Scroll the new paragraph into view
            this.scrollCursorIntoView();
        } else {
            // No special markdown detected, just insert paragraph
            document.execCommand('insertParagraph');

            // Scroll cursor into view after paragraph insertion
            this.scrollCursorIntoView();
        }
    }

    /**
     * Handle click events - allow editing in rendered state
     */
    handleClick(event) {
        // Rendered blocks now stay rendered and are editable
        // No need to convert back to markdown syntax on click
    }

    /**
     * Handle input events - track changes and auto-render
     */
    handleInput(event) {
        // Skip input handling during document loading to prevent corruption
        if (this.isLoadingDocument) {
            return;
        }

        // Use selection to find the actual element being edited, not event.target
        // (event.target may be the main editor DIV due to event bubbling)
        const selection = window.getSelection();
        let editedElement = null;

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const node = range.startContainer;
            editedElement = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        }

        // Fallback to event target if selection didn't give us anything useful
        if (!editedElement || editedElement === this.editorElement) {
            editedElement = event.target;
        }

        // Check if we're editing within a rendered block
        const renderedBlock = editedElement?.closest('[data-wysiwyg-rendered="true"]');
        if (renderedBlock) {
            // Update the stored markdown when rendered content changes
            this.updateRenderedBlockMarkdown(renderedBlock);
        } else {
            // Check if we should auto-render the current block
            this.tryAutoRender();
        }

        // Auto-save could be triggered here
        // For now, just ensure we maintain proper structure
        this.ensureProperStructure();

        // Ensure cursor stays visible when typing near bottom of editor (debounced)
        if (this.scrollDebounceTimer) {
            clearTimeout(this.scrollDebounceTimer);
        }
        this.scrollDebounceTimer = setTimeout(() => {
            this.scrollCursorIntoView();
        }, 50); // Small delay to batch rapid keystrokes
    }

    /**
     * Handle paste events - render pasted markdown content
     */
    handlePaste(event) {
        // Get plain text from clipboard
        const clipboardData = event.clipboardData || window.clipboardData;
        const pastedText = clipboardData.getData('text/plain');

        if (!pastedText) return; // Let default paste behavior handle non-text

        // Prevent default paste behavior
        event.preventDefault();

        // Normalize line endings
        const normalizedText = pastedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = normalizedText.split('\n');

        // Get current selection/cursor position
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const currentBlock = this.getCurrentBlock(range.startContainer);

        // If pasting multiple lines, we need to handle them properly
        if (lines.length === 1) {
            // Single line paste - just insert at cursor and try to render
            document.execCommand('insertText', false, lines[0]);
            this.tryAutoRender();
        } else {
            // Multi-line paste - render each line as a block
            // First, delete any selected content
            if (!range.collapsed) {
                range.deleteContents();
            }

            // Build HTML for pasted content
            const blocks = [];
            let i = 0;
            while (i < lines.length) {
                const line = lines[i];

                if (line.trim() === '') {
                    blocks.push('<p><br></p>');
                    i++;
                    continue;
                }

                // Try to render as markdown
                const rendered = this.renderMarkdown(line);

                // Handle list grouping for consecutive list items
                if (rendered && rendered.match(/^<ul[\s>]/)) {
                    const ulItems = [];
                    const ulMarkdown = [];
                    const indentMatch = rendered.match(/data-indent-level="(\d+)"/);
                    const groupIndentLevel = indentMatch ? parseInt(indentMatch[1]) : 0;

                    while (i < lines.length) {
                        const currentLine = lines[i];
                        const currentRendered = this.renderMarkdown(currentLine);

                        if (currentRendered && currentRendered.match(/^<ul[\s>]/)) {
                            const currentIndentMatch = currentRendered.match(/data-indent-level="(\d+)"/);
                            const currentIndentLevel = currentIndentMatch ? parseInt(currentIndentMatch[1]) : 0;

                            if (currentIndentLevel === groupIndentLevel) {
                                const liMatch = currentRendered.match(/<li>(.+?)<\/li>/);
                                if (liMatch) {
                                    ulItems.push(liMatch[1]);
                                    ulMarkdown.push(currentLine);
                                }
                                i++;
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }

                    const ul = document.createElement('ul');
                    ulItems.forEach(itemContent => {
                        const li = document.createElement('li');
                        li.innerHTML = itemContent;
                        ul.appendChild(li);
                    });

                    ul.setAttribute('data-wysiwyg-rendered', 'true');
                    ul.setAttribute('data-wysiwyg-markdown', ulMarkdown.join('\n'));
                    ul.contentEditable = 'true';
                    if (groupIndentLevel > 0) {
                        ul.setAttribute('data-indent-level', groupIndentLevel);
                    }
                    blocks.push(ul.outerHTML);
                    continue;
                }

                // Handle ordered list grouping
                if (rendered && rendered.match(/^<ol[\s>]/)) {
                    const olItems = [];
                    const olMarkdown = [];
                    const indentMatch = rendered.match(/data-indent-level="(\d+)"/);
                    const groupIndentLevel = indentMatch ? parseInt(indentMatch[1]) : 0;

                    while (i < lines.length) {
                        const currentLine = lines[i];
                        const currentRendered = this.renderMarkdown(currentLine);

                        if (currentRendered && currentRendered.match(/^<ol[\s>]/)) {
                            const currentIndentMatch = currentRendered.match(/data-indent-level="(\d+)"/);
                            const currentIndentLevel = currentIndentMatch ? parseInt(currentIndentMatch[1]) : 0;

                            if (currentIndentLevel === groupIndentLevel) {
                                const liMatch = currentRendered.match(/<li>(.+?)<\/li>/);
                                if (liMatch) {
                                    olItems.push(liMatch[1]);
                                    olMarkdown.push(currentLine);
                                }
                                i++;
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }

                    const ol = document.createElement('ol');
                    olItems.forEach(itemContent => {
                        const li = document.createElement('li');
                        li.innerHTML = itemContent;
                        ol.appendChild(li);
                    });

                    ol.setAttribute('data-wysiwyg-rendered', 'true');
                    ol.setAttribute('data-wysiwyg-markdown', olMarkdown.join('\n'));
                    ol.contentEditable = 'true';
                    if (groupIndentLevel > 0) {
                        ol.setAttribute('data-indent-level', groupIndentLevel);
                    }
                    blocks.push(ol.outerHTML);
                    continue;
                }

                if (rendered) {
                    // Wrap rendered content with data attributes
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = rendered;
                    const element = wrapper.firstChild;
                    element.setAttribute('data-wysiwyg-rendered', 'true');
                    element.setAttribute('data-wysiwyg-markdown', line);
                    element.contentEditable = 'true';
                    blocks.push(element.outerHTML);
                } else {
                    // Plain text paragraph
                    blocks.push(`<p>${this.escapeHtml(line)}</p>`);
                }
                i++;
            }

            // Insert the rendered HTML
            const htmlToInsert = blocks.join('');

            // If we're inside an empty paragraph, replace it
            if (currentBlock && currentBlock.tagName === 'P' && currentBlock.textContent.trim() === '') {
                currentBlock.insertAdjacentHTML('afterend', htmlToInsert);
                currentBlock.remove();
            } else {
                // Insert at cursor position
                document.execCommand('insertHTML', false, htmlToInsert);
            }

            // Move cursor to end of pasted content
            const lastInserted = this.editorElement.querySelector('[data-wysiwyg-rendered]:last-of-type') ||
                                 this.editorElement.lastElementChild;
            if (lastInserted) {
                this.setCursorAtEnd(lastInserted);
            }
        }

        // Dispatch input event to trigger auto-save
        // This ensures pasted content is persisted to storage
        this.editorElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Try to automatically render the current block if it contains valid markdown
     */
    tryAutoRender() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const currentNode = range.startContainer;
        const block = this.getCurrentBlock(currentNode);

        if (!block) return;

        // Don't auto-render if block is already rendered
        if (block.hasAttribute('data-wysiwyg-rendered')) return;

        // Get the text content - preserve leading whitespace for indentation
        const text = block.textContent;
        if (!text.trim()) return;

        // Check if the text matches a renderable markdown pattern
        const rendered = this.renderMarkdown(text);
        if (!rendered) return;

        // Save cursor position within the block
        const cursorOffset = this.getCursorOffsetInBlock(block);

        // Replace the block with rendered version
        // Store original text with leading whitespace for proper markdown reconstruction
        const newBlock = this.createRenderedBlock(rendered, text.trimEnd());
        block.parentNode.replaceChild(newBlock, block);

        // Restore cursor position at the end of the rendered block
        this.setCursorAtEnd(newBlock);
    }

    /**
     * Get the cursor offset within a block (in characters)
     */
    getCursorOffsetInBlock(block) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return 0;

        const range = selection.getRangeAt(0);
        const preRange = range.cloneRange();
        preRange.selectNodeContents(block);
        preRange.setEnd(range.endContainer, range.endOffset);

        return preRange.toString().length;
    }

    /**
     * Set cursor at the end of an element
     */
    setCursorAtEnd(element) {
        const range = document.createRange();
        const selection = window.getSelection();

        // Find the last text node or use the element itself
        const lastNode = this.getLastTextNode(element) || element;

        if (lastNode.nodeType === Node.TEXT_NODE) {
            range.setStart(lastNode, lastNode.length);
        } else {
            range.setStart(lastNode, lastNode.childNodes.length);
        }

        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Get the last text node in an element
     */
    getLastTextNode(element) {
        if (element.nodeType === Node.TEXT_NODE) {
            return element;
        }

        const children = element.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {
            const result = this.getLastTextNode(children[i]);
            if (result) return result;
        }

        return null;
    }

    /**
     * Get the current block element containing the cursor/node
     */
    getCurrentBlock(node) {
        if (!node) return null;

        // Walk up the DOM tree to find a block-level element
        let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

        while (current && current !== this.editorElement) {
            const tag = current.tagName?.toLowerCase();
            if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'li', 'div'].includes(tag)) {
                return current;
            }
            current = current.parentElement;
        }

        return null;
    }

    /**
     * Render markdown text to HTML
     */
    renderMarkdown(text) {
        if (!text || text.trim() === '') return null;

        // Count and strip leading whitespace for indentation
        // Supports both tabs and spaces (4 spaces = 1 indent level, or 1 tab = 1 indent level)
        let indentLevel = 0;
        let processedText = text;

        // First, count leading whitespace
        const leadingWhitespace = text.match(/^(\s*)/)[1];
        if (leadingWhitespace && leadingWhitespace.length > 0) {
            // Count tabs (each tab = 1 level)
            const tabCount = (leadingWhitespace.match(/\t/g) || []).length;
            // Count spaces (every 2-4 spaces = 1 level, using 2 as minimum for flexibility)
            const spaceOnlyPart = leadingWhitespace.replace(/\t/g, '');
            const spaceCount = Math.floor(spaceOnlyPart.length / 2); // 2 spaces = 1 indent level

            indentLevel = tabCount + spaceCount;
            processedText = text.substring(leadingWhitespace.length);
        }

        // First, process any shortcut syntax to convert to standard markdown
        // Note: Need to handle bi{} before b{} to avoid pattern collision

        // Manually process bi{text} first to avoid collision with b{text}
        processedText = processedText.replace(/bi\{(.+?)\}/g, '***$1***');

        // Then process the rest of the shortcuts
        processedText = this.shortcutProcessor.process(processedText);

        // Detect markdown patterns and render

        // Headers (# through ######)
        const headerMatch = processedText.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const content = headerMatch[2];
            return this.applyIndent(`<h${level}>${this.escapeHtml(content)}</h${level}>`, indentLevel);
        }

        // Blockquote (> text)
        const quoteMatch = processedText.match(/^>\s*(.+)$/);
        if (quoteMatch) {
            const content = quoteMatch[1];
            return this.applyIndent(`<blockquote>${this.escapeHtml(content)}</blockquote>`, indentLevel);
        }

        // Horizontal rule (--- or ***)
        if (processedText.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
            return this.applyIndent('<hr>', indentLevel);
        }

        // Code block (```lang or just ```)
        const codeMatch = processedText.match(/^```(\w+)?$/);
        if (codeMatch) {
            // Start of code block - needs special handling
            return null; // For now, don't render incomplete code blocks
        }

        // Table row detection (| cell | cell |)
        if (this.isTableRow(processedText)) {
            // Return special marker for table handling
            return '<table-row>' + processedText + '</table-row>';
        }

        // Unordered list (- item or * item)
        const ulMatch = processedText.match(/^[-*]\s+(.+)$/);
        if (ulMatch) {
            const content = ulMatch[1];
            const formattedContent = this.renderInlineFormatting(content);
            return this.applyIndent(`<ul><li>${formattedContent}</li></ul>`, indentLevel);
        }

        // Ordered list (1. item)
        const olMatch = processedText.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
            const content = olMatch[1];
            const formattedContent = this.renderInlineFormatting(content);
            return this.applyIndent(`<ol><li>${formattedContent}</li></ol>`, indentLevel);
        }

        // Task list (- [ ] or - [x])
        const taskMatch = processedText.match(/^-\s+\[([ x])\]\s+(.+)$/i);
        if (taskMatch) {
            const checked = taskMatch[1].toLowerCase() === 'x';
            const content = taskMatch[2];
            const formattedContent = this.renderInlineFormatting(content);
            const checkbox = checked ? '☑' : '☐';
            return this.applyIndent(`<p>${checkbox} ${formattedContent}</p>`, indentLevel);
        }

        // Regular paragraph with inline formatting
        const formatted = this.renderInlineFormatting(processedText);
        if (formatted !== processedText) {
            return this.applyIndent(`<p>${formatted}</p>`, indentLevel);
        }

        // No special markdown detected
        return null;
    }

    /**
     * Apply indent level to rendered HTML
     */
    applyIndent(html, indentLevel) {
        if (indentLevel === 0) return html;

        // Inject data-indent-level attribute into the opening tag
        return html.replace(/^<(\w+)/, `<$1 data-indent-level="${indentLevel}"`);
    }

    /**
     * Check if a line is a markdown table row
     */
    isTableRow(text) {
        // Must start and end with |
        // Must have at least 2 cells (one |)
        return /^\|.+\|$/.test(text.trim());
    }

    /**
     * Check if a line is a table separator row (|---|---|)
     */
    isTableSeparator(text) {
        return /^\|[\s:-]+\|$/.test(text.trim()) && text.includes('-');
    }

    /**
     * Parse a table row into cells
     */
    parseTableRow(text) {
        // Remove leading/trailing pipes and split by |
        const trimmed = text.trim().replace(/^\||\|$/g, '');
        const cells = trimmed.split('|').map(cell => cell.trim());
        return cells;
    }

    /**
     * Render inline markdown formatting (bold, italic, code, links)
     */
    renderInlineFormatting(text) {
        // Process images and links BEFORE escaping HTML to preserve special characters
        let result = text;

        // Images (![alt](url)) - process first before escaping
        result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // Links ([text](url))
        result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Now escape HTML for the rest of the text (but preserve our HTML tags)
        // Split by HTML tags, escape only non-tag parts
        const parts = result.split(/(<img[^>]*>|<a[^>]*>.*?<\/a>)/g);
        result = parts.map(part => {
            if (part.startsWith('<img') || part.startsWith('<a')) {
                return part; // Keep HTML tags as-is
            }
            return this.escapeHtml(part);
        }).join('');

        // Bold + Italic (***text***)
        result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

        // Bold (**text** or __text__)
        result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Italic (*text* or _text_)
        result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
        result = result.replace(/_(.+?)_/g, '<em>$1</em>');

        // Strikethrough (~~text~~)
        result = result.replace(/~~(.+?)~~/g, '<s>$1</s>');

        // Inline code (`code`)
        result = result.replace(/`(.+?)`/g, '<code>$1</code>');

        return result;
    }

    /**
     * Create a rendered block element
     */
    createRenderedBlock(html, originalMarkdown) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const element = wrapper.firstChild;

        // Mark as rendered and store original markdown
        element.setAttribute('data-wysiwyg-rendered', 'true');
        element.setAttribute('data-wysiwyg-markdown', originalMarkdown);
        element.contentEditable = 'true'; // Make it editable in rendered state

        return element;
    }

    /**
     * Update the markdown stored in a rendered block based on its current content
     */
    updateRenderedBlockMarkdown(renderedBlock) {
        const tagName = renderedBlock.tagName.toLowerCase();
        let markdown = '';

        switch (tagName) {
            case 'h1':
                markdown = '# ' + renderedBlock.textContent;
                break;
            case 'h2':
                markdown = '## ' + renderedBlock.textContent;
                break;
            case 'h3':
                markdown = '### ' + renderedBlock.textContent;
                break;
            case 'h4':
                markdown = '#### ' + renderedBlock.textContent;
                break;
            case 'h5':
                markdown = '##### ' + renderedBlock.textContent;
                break;
            case 'h6':
                markdown = '###### ' + renderedBlock.textContent;
                break;
            case 'blockquote':
                markdown = '> ' + renderedBlock.textContent;
                break;
            case 'hr':
                markdown = '---';
                break;
            case 'ol':
                // Ordered list - extract list items, filtering out empty ones
                const olItems = Array.from(renderedBlock.querySelectorAll('li'))
                    .filter(li => li.textContent.trim() !== '');
                markdown = olItems.map((li, index) => `${index + 1}. ${li.textContent}`).join('\n');
                break;
            case 'ul':
                // Unordered list - extract list items, filtering out empty ones
                // Use direct children only to avoid nested list issues
                const ulItems = Array.from(renderedBlock.children)
                    .filter(el => el.tagName === 'LI' && el.textContent.trim() !== '');
                markdown = ulItems.map(li => `- ${li.textContent}`).join('\n');
                break;
            case 'p':
                // Paragraph - could have inline formatting
                markdown = this.htmlToMarkdown(renderedBlock.innerHTML);
                break;
            default:
                // Fallback to text content
                markdown = renderedBlock.textContent;
        }

        // Prepend tabs based on indent level
        const indentLevel = parseInt(renderedBlock.getAttribute('data-indent-level')) || 0;
        if (indentLevel > 0) {
            const tabs = '\t'.repeat(indentLevel);
            markdown = tabs + markdown;
        }

        // Update the stored markdown
        renderedBlock.setAttribute('data-wysiwyg-markdown', markdown);
    }

    /**
     * Convert HTML back to markdown (for inline formatting)
     */
    htmlToMarkdown(html) {
        let result = html;

        // Convert HTML tags back to markdown syntax
        // Bold + Italic
        result = result.replace(/<strong><em>(.+?)<\/em><\/strong>/g, '***$1***');
        result = result.replace(/<em><strong>(.+?)<\/strong><\/em>/g, '***$1***');

        // Bold
        result = result.replace(/<strong>(.+?)<\/strong>/g, '**$1**');

        // Italic
        result = result.replace(/<em>(.+?)<\/em>/g, '*$1*');

        // Strikethrough
        result = result.replace(/<s>(.+?)<\/s>/g, '~~$1~~');

        // Inline code
        result = result.replace(/<code>(.+?)<\/code>/g, '`$1`');

        // Links
        result = result.replace(/<a href="(.+?)">(.+?)<\/a>/g, '[$2]($1)');

        // Images
        result = result.replace(/<img src="(.+?)" alt="(.+?)">/g, '![$2]($1)');

        // Remove any remaining HTML tags
        result = result.replace(/<[^>]+>/g, '');

        return result;
    }

    /**
     * Set cursor position within an element
     */
    setCursorAt(element, offset) {
        const range = document.createRange();
        const selection = window.getSelection();

        if (element.childNodes.length === 0) {
            // Empty element, place cursor at start
            range.setStart(element, 0);
        } else {
            // Place cursor at specified offset in first text node
            const textNode = element.childNodes[0];
            if (textNode.nodeType === Node.TEXT_NODE) {
                range.setStart(textNode, Math.min(offset, textNode.length));
            } else {
                range.setStart(element, 0);
            }
        }

        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Ensure proper document structure (at least one paragraph)
     */
    ensureProperStructure() {
        if (this.editorElement.children.length === 0 ||
            (this.editorElement.children.length === 1 &&
             this.editorElement.firstChild.textContent === '')) {
            this.editorElement.innerHTML = '<p><br></p>';
        }
    }

    /**
     * Scroll the current cursor/caret position into view
     * This ensures the user can always see where they're typing
     */
    scrollCursorIntoView() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        // Try to get cursor position from range's client rects first (less intrusive)
        const rects = range.getClientRects();
        if (rects.length > 0) {
            const rect = rects[0];
            const editorRect = this.editorElement.getBoundingClientRect();

            // Use a larger buffer to ensure cursor is comfortably visible
            // Account for line height (~24px) plus extra padding
            const buffer = 50;

            // Check if cursor is below the visible area (or too close to bottom)
            if (rect.bottom > editorRect.bottom - buffer) {
                // Scroll down to show the cursor with comfortable padding
                const scrollAmount = (rect.bottom - editorRect.bottom) + buffer;
                this.editorElement.scrollTop += scrollAmount;
            }
            // Check if cursor is above the visible area (or too close to top)
            else if (rect.top < editorRect.top + buffer) {
                // Scroll up to show the cursor with comfortable padding
                const scrollAmount = (editorRect.top - rect.top) + buffer;
                this.editorElement.scrollTop -= scrollAmount;
            }
            return;
        }

        // Fallback: use temporary element if getClientRects didn't work
        // (can happen at start of empty elements)
        const tempSpan = document.createElement('span');
        tempSpan.textContent = '\u200B'; // Zero-width space

        // Clone range to avoid modifying the original selection
        const clonedRange = range.cloneRange();
        clonedRange.insertNode(tempSpan);

        // Scroll the temp element into view with 'center' to ensure visibility
        tempSpan.scrollIntoView({
            behavior: 'instant',
            block: 'center',
            inline: 'nearest'
        });

        // Remove the temp element
        const parent = tempSpan.parentNode;
        parent.removeChild(tempSpan);

        // Normalize to merge any split text nodes
        parent.normalize();
    }

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get current document content as markdown
     */
    getMarkdown() {
        const blocks = Array.from(this.editorElement.children);
        const markdownLines = blocks.map(block => {
            // If it's a rendered block, refresh and return markdown
            if (block.hasAttribute('data-wysiwyg-rendered')) {
                // Update the stored markdown from current content
                // This ensures empty list items etc. are filtered out
                this.updateRenderedBlockMarkdown(block);
                const md = block.getAttribute('data-wysiwyg-markdown');
                // Filter out blocks that became empty (e.g., list with all empty items)
                return md || '';
            }
            // Otherwise return text content
            return block.textContent || '';
        });

        // Filter out completely empty lines that came from empty rendered blocks
        // But keep intentional empty lines (from <p><br></p> or plain empty paragraphs)
        return markdownLines.join('\n');
    }

    /**
     * Set document content from markdown
     * @param {boolean} renderAll - If true, render all markdown blocks immediately
     */
    setMarkdown(markdown, renderAll = false) {
        // Set loading flag to prevent input events from corrupting content
        this.isLoadingDocument = true;

        if (!markdown || markdown.trim() === '') {
            this.editorElement.innerHTML = '<p><br></p>';
            this.isLoadingDocument = false;
            return;
        }

        // Normalize line endings (convert \r\n and \r to \n) before splitting
        const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Split into lines and create paragraphs
        const lines = normalizedMarkdown.split('\n');
        const blocks = [];

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            if (line.trim() === '') {
                blocks.push('<p><br></p>');
                i++;
                continue;
            }

            // Filter out empty list item lines (e.g., "- " or "1. " with no content)
            // These are created when user presses Enter in source mode but doesn't add content
            const emptyListItemMatch = line.match(/^(\s*)([-*+]|\d+\.)\s*$/);
            if (emptyListItemMatch) {
                // Skip empty list items - they shouldn't be rendered
                i++;
                continue;
            }

            // If renderAll is true, try to render the markdown
            if (renderAll) {
                const rendered = this.renderMarkdown(line);

                // Group consecutive ordered list items WITH SAME INDENT LEVEL
                if (rendered && rendered.match(/^<ol[\s>]/)) {
                    const olItems = [];
                    const olMarkdown = [];
                    // Extract indent level from first item
                    const indentMatch = rendered.match(/data-indent-level="(\d+)"/);
                    const groupIndentLevel = indentMatch ? parseInt(indentMatch[1]) : 0;

                    while (i < lines.length) {
                        const currentLine = lines[i];
                        const currentRendered = this.renderMarkdown(currentLine);

                        if (currentRendered && currentRendered.match(/^<ol[\s>]/)) {
                            // Check if this item has the same indent level
                            const currentIndentMatch = currentRendered.match(/data-indent-level="(\d+)"/);
                            const currentIndentLevel = currentIndentMatch ? parseInt(currentIndentMatch[1]) : 0;

                            if (currentIndentLevel === groupIndentLevel) {
                                const liMatch = currentRendered.match(/<li>(.+?)<\/li>/);
                                if (liMatch) {
                                    olItems.push(liMatch[1]);
                                    olMarkdown.push(currentLine);
                                }
                                i++;
                            } else {
                                // Different indent level - stop grouping
                                break;
                            }
                        } else {
                            break;
                        }
                    }

                    const ol = document.createElement('ol');
                    olItems.forEach(itemContent => {
                        const li = document.createElement('li');
                        li.innerHTML = itemContent;
                        ol.appendChild(li);
                    });

                    ol.setAttribute('data-wysiwyg-rendered', 'true');
                    ol.setAttribute('data-wysiwyg-markdown', olMarkdown.join('\n'));
                    ol.contentEditable = 'true';
                    if (groupIndentLevel > 0) {
                        ol.setAttribute('data-indent-level', groupIndentLevel);
                    }
                    blocks.push(ol.outerHTML);
                    continue;
                }

                // Group consecutive unordered list items WITH SAME INDENT LEVEL
                if (rendered && rendered.match(/^<ul[\s>]/)) {
                    const ulItems = [];
                    const ulMarkdown = [];
                    // Extract indent level from first item
                    const indentMatch = rendered.match(/data-indent-level="(\d+)"/);
                    const groupIndentLevel = indentMatch ? parseInt(indentMatch[1]) : 0;

                    while (i < lines.length) {
                        const currentLine = lines[i];
                        const currentRendered = this.renderMarkdown(currentLine);

                        if (currentRendered && currentRendered.match(/^<ul[\s>]/)) {
                            // Check if this item has the same indent level
                            const currentIndentMatch = currentRendered.match(/data-indent-level="(\d+)"/);
                            const currentIndentLevel = currentIndentMatch ? parseInt(currentIndentMatch[1]) : 0;

                            if (currentIndentLevel === groupIndentLevel) {
                                const liMatch = currentRendered.match(/<li>(.+?)<\/li>/);
                                if (liMatch) {
                                    ulItems.push(liMatch[1]);
                                    ulMarkdown.push(currentLine);
                                }
                                i++;
                            } else {
                                // Different indent level - stop grouping
                                break;
                            }
                        } else {
                            break;
                        }
                    }

                    const ul = document.createElement('ul');
                    ulItems.forEach(itemContent => {
                        const li = document.createElement('li');
                        li.innerHTML = itemContent;
                        ul.appendChild(li);
                    });

                    ul.setAttribute('data-wysiwyg-rendered', 'true');
                    ul.setAttribute('data-wysiwyg-markdown', ulMarkdown.join('\n'));
                    ul.contentEditable = 'true';
                    if (groupIndentLevel > 0) {
                        ul.setAttribute('data-indent-level', groupIndentLevel);
                    }
                    blocks.push(ul.outerHTML);
                    continue;
                }

                // Group consecutive table rows into a table
                if (rendered && rendered.startsWith('<table-row>')) {
                    const tableRows = [];
                    const tableMarkdown = [];
                    let hasHeader = false;
                    let headerRowIndex = -1;

                    // Collect all consecutive table rows
                    while (i < lines.length) {
                        const currentLine = lines[i];
                        const currentRendered = this.renderMarkdown(currentLine);

                        if (currentRendered && currentRendered.startsWith('<table-row>')) {
                            // Extract the raw markdown from the marker
                            const rawRow = currentRendered.replace('<table-row>', '').replace('</table-row>', '');

                            // Check if this is a separator row
                            if (this.isTableSeparator(rawRow)) {
                                hasHeader = true;
                                headerRowIndex = tableRows.length - 1; // Previous row is the header
                            } else {
                                tableRows.push(rawRow);
                            }

                            tableMarkdown.push(currentLine);
                            i++;
                        } else {
                            break;
                        }
                    }

                    // Build the HTML table
                    const table = document.createElement('table');
                    table.className = 'markdown-table';

                    // Add header if present
                    if (hasHeader && headerRowIndex >= 0) {
                        const thead = document.createElement('thead');
                        const headerRow = document.createElement('tr');
                        const headerCells = this.parseTableRow(tableRows[headerRowIndex]);

                        headerCells.forEach(cellContent => {
                            const th = document.createElement('th');
                            th.innerHTML = this.renderInlineFormatting(cellContent);
                            headerRow.appendChild(th);
                        });

                        thead.appendChild(headerRow);
                        table.appendChild(thead);
                    }

                    // Add body rows
                    const tbody = document.createElement('tbody');
                    const bodyStartIndex = hasHeader ? headerRowIndex + 1 : 0;

                    for (let j = bodyStartIndex; j < tableRows.length; j++) {
                        const row = document.createElement('tr');
                        const cells = this.parseTableRow(tableRows[j]);

                        cells.forEach(cellContent => {
                            const td = document.createElement('td');
                            td.innerHTML = this.renderInlineFormatting(cellContent);
                            row.appendChild(td);
                        });

                        tbody.appendChild(row);
                    }

                    table.appendChild(tbody);
                    table.setAttribute('data-wysiwyg-rendered', 'true');
                    table.setAttribute('data-wysiwyg-markdown', tableMarkdown.join('\n'));
                    table.contentEditable = 'true';
                    blocks.push(table.outerHTML);
                    continue;
                }

                if (rendered) {
                    // Return a rendered block with the original markdown stored
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = rendered;
                    const element = wrapper.firstChild;
                    element.setAttribute('data-wysiwyg-rendered', 'true');
                    element.setAttribute('data-wysiwyg-markdown', line);
                    element.contentEditable = 'true';
                    blocks.push(element.outerHTML);
                    i++;
                    continue;
                }

                // If renderAll is true but no pattern matched, create plain paragraph
                blocks.push(`<p>${line}</p>`);
                i++;
                continue;
            }

            // renderAll is false - escape HTML for plain text editing
            blocks.push(`<p>${this.escapeHtml(line)}</p>`);
            i++;
        }

        const htmlToSet = blocks.join('');
        this.editorElement.innerHTML = htmlToSet;

        // Reset loading flag after content is set
        this.isLoadingDocument = false;
    }

    /**
     * Toggle between WYSIWYG and source mode
     */
    toggleSourceMode() {
        if (this.sourceMode) {
            this.switchToWysiwyg();
        } else {
            this.switchToSource();
        }
        return this.sourceMode;
    }

    /**
     * Switch to source mode (raw markdown textarea)
     */
    switchToSource() {
        if (this.sourceMode) return;

        // Find the source textarea and its container
        this.sourceTextarea = document.getElementById('source-editor');
        const sourceContainer = document.getElementById('source-editor-container');
        if (!this.sourceTextarea) {
            console.warn('Source editor textarea not found');
            return;
        }

        // Get current markdown from WYSIWYG editor
        const markdown = this.getMarkdown();

        // Hide WYSIWYG editor, show source container (includes line numbers)
        this.editorElement.style.display = 'none';
        if (sourceContainer) {
            sourceContainer.style.display = 'flex';
        } else {
            this.sourceTextarea.style.display = 'block';
        }

        // Load markdown into source textarea
        this.sourceTextarea.value = markdown;

        // Trigger line numbers update if available
        if (typeof window.updateLineNumbers === 'function') {
            window.updateLineNumbers();
        } else {
            // Dispatch event for line numbers update
            this.sourceTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Attach smart list continuation handler
        this.sourceTextarea.addEventListener('keydown', this.handleSourceKeyDown);

        // Focus the textarea
        this.sourceTextarea.focus();

        this.sourceMode = true;
    }

    /**
     * Switch to WYSIWYG mode (rendered editing)
     */
    switchToWysiwyg() {
        if (!this.sourceMode) return;

        if (!this.sourceTextarea) {
            console.warn('Source textarea not initialized');
            return;
        }

        // Remove source mode event listener
        this.sourceTextarea.removeEventListener('keydown', this.handleSourceKeyDown);

        // Get markdown from source textarea
        const markdown = this.sourceTextarea.value;

        // Hide source container (includes line numbers), show WYSIWYG editor
        const sourceContainer = document.getElementById('source-editor-container');
        if (sourceContainer) {
            sourceContainer.style.display = 'none';
        } else {
            this.sourceTextarea.style.display = 'none';
        }
        this.editorElement.style.display = 'block';

        // Load markdown into WYSIWYG editor with rendering enabled
        this.setMarkdown(markdown, true);

        // Place cursor at the end of the content
        const lastChild = this.editorElement.lastElementChild;
        if (lastChild) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(lastChild, Math.min(1, lastChild.childNodes.length));
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // Focus the WYSIWYG editor
        this.editorElement.focus();

        this.sourceMode = false;
    }

    /**
     * Check if currently in source mode
     */
    isSourceMode() {
        return this.sourceMode;
    }

    /**
     * Handle keydown events in source mode (textarea)
     * Provides smart list continuation and tab insertion like other markdown editors
     */
    handleSourceKeyDown(event) {
        // Handle Tab key - insert tab character instead of moving focus
        if (event.key === 'Tab') {
            event.preventDefault();
            const textarea = this.sourceTextarea;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;

            // Insert tab at cursor position
            textarea.value = text.substring(0, start) + '\t' + text.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            return;
        }

        if (event.key !== 'Enter' || event.shiftKey) return;

        const textarea = this.sourceTextarea;
        const cursorPos = textarea.selectionStart;
        const text = textarea.value;

        // Get the current line
        const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
        const lineEnd = text.indexOf('\n', cursorPos);
        const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

        // Check for unordered list pattern: "- ", "* ", "+ "
        const ulMatch = currentLine.match(/^(\s*)([-*+])\s(.*)$/);
        if (ulMatch) {
            const [, indent, marker, content] = ulMatch;

            if (content.trim() === '') {
                // Empty list item - exit list by removing the entire line
                event.preventDefault();
                const beforeLine = text.substring(0, lineStart);
                const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
                const afterLine = text.substring(actualLineEnd);
                // Remove the empty list item line and just leave a newline
                textarea.value = beforeLine.trimEnd() + '\n' + afterLine.trimStart();
                // Position cursor at the start of the new line
                textarea.selectionStart = textarea.selectionEnd = beforeLine.trimEnd().length + 1;
            } else {
                // Continue list with same marker
                event.preventDefault();
                const beforeCursor = text.substring(0, cursorPos);
                const afterCursor = text.substring(cursorPos);
                const newListItem = `\n${indent}${marker} `;
                textarea.value = beforeCursor + newListItem + afterCursor;
                textarea.selectionStart = textarea.selectionEnd = cursorPos + newListItem.length;
            }
            return;
        }

        // Check for ordered list pattern: "1. ", "2. ", etc.
        const olMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/);
        if (olMatch) {
            const [, indent, num, content] = olMatch;

            if (content.trim() === '') {
                // Empty list item - exit list by removing the entire line
                event.preventDefault();
                const beforeLine = text.substring(0, lineStart);
                const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
                const afterLine = text.substring(actualLineEnd);
                textarea.value = beforeLine.trimEnd() + '\n' + afterLine.trimStart();
                textarea.selectionStart = textarea.selectionEnd = beforeLine.trimEnd().length + 1;
            } else {
                // Continue list with incremented number
                event.preventDefault();
                const beforeCursor = text.substring(0, cursorPos);
                const afterCursor = text.substring(cursorPos);
                const nextNum = parseInt(num) + 1;
                const newListItem = `\n${indent}${nextNum}. `;
                textarea.value = beforeCursor + newListItem + afterCursor;
                textarea.selectionStart = textarea.selectionEnd = cursorPos + newListItem.length;
            }
            return;
        }

        // Check for blockquote pattern: "> "
        const bqMatch = currentLine.match(/^(\s*)(>+)\s(.*)$/);
        if (bqMatch) {
            const [, indent, markers, content] = bqMatch;

            if (content.trim() === '') {
                // Empty blockquote line - exit blockquote by removing the entire line
                event.preventDefault();
                const beforeLine = text.substring(0, lineStart);
                const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
                const afterLine = text.substring(actualLineEnd);
                textarea.value = beforeLine.trimEnd() + '\n' + afterLine.trimStart();
                textarea.selectionStart = textarea.selectionEnd = beforeLine.trimEnd().length + 1;
            } else {
                // Continue blockquote
                event.preventDefault();
                const beforeCursor = text.substring(0, cursorPos);
                const afterCursor = text.substring(cursorPos);
                const newLine = `\n${indent}${markers} `;
                textarea.value = beforeCursor + newLine + afterCursor;
                textarea.selectionStart = textarea.selectionEnd = cursorPos + newLine.length;
            }
            return;
        }
    }

    /**
     * Clean up and destroy
     */
    destroy() {
        if (this.editorElement) {
            this.editorElement.removeEventListener('keydown', this.handleKeyDown);
            this.editorElement.removeEventListener('click', this.handleClick);
            this.editorElement.removeEventListener('input', this.handleInput);
        }
        if (this.sourceTextarea) {
            this.sourceTextarea.removeEventListener('keydown', this.handleSourceKeyDown);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WysiwygEngine;
}

// Also expose globally for browser use
if (typeof window !== 'undefined') {
    window.WysiwygEngine = WysiwygEngine;
}
