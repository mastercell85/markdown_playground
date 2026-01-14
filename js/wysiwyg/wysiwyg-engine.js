/**
 * WYSIWYG Engine - Typora-style editing
 * Provides contenteditable-based markdown editing with live rendering
 *
 * Behavior:
 * - Type mode: Shows markdown syntax as plain text while typing
 * - Render on Enter: Pressing Enter renders the current block
 * - Click to edit: Clicking rendered element returns it to markdown
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

        // Initialize shortcut processor for custom markdown syntax
        this.shortcutProcessor = new ShortcutProcessor();

        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleInput = this.handleInput.bind(this);

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

        // Set initial placeholder if empty
        if (this.editorElement.textContent.trim() === '') {
            this.editorElement.innerHTML = '<p><br></p>';
        }

        console.log('WysiwygEngine: Initialized');
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

        // Tab key - insert spaces
        if (event.key === 'Tab') {
            event.preventDefault();
            document.execCommand('insertText', false, '  '); // 2 spaces
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

        // Get the markdown text from the block
        const markdownText = block.textContent.trim();

        if (markdownText === '') {
            // Empty block, just insert new paragraph
            document.execCommand('insertParagraph');
            return;
        }

        // Render the markdown
        const rendered = this.renderMarkdown(markdownText);

        if (rendered) {
            // Replace the block with rendered HTML
            const newBlock = this.createRenderedBlock(rendered, markdownText);
            block.parentNode.replaceChild(newBlock, block);

            // Insert new paragraph after rendered block
            const newParagraph = document.createElement('p');
            newParagraph.innerHTML = '<br>';
            newBlock.parentNode.insertBefore(newParagraph, newBlock.nextSibling);

            // Move cursor to new paragraph
            this.setCursorAt(newParagraph, 0);
        } else {
            // No special markdown detected, just insert paragraph
            document.execCommand('insertParagraph');
        }
    }

    /**
     * Handle click events - convert rendered blocks back to edit mode
     */
    handleClick(event) {
        const target = event.target;

        // Check if clicked element is a rendered block
        const renderedBlock = target.closest('[data-wysiwyg-rendered="true"]');
        if (renderedBlock) {
            event.preventDefault();
            this.convertToEditMode(renderedBlock);
        }
    }

    /**
     * Handle input events - track changes
     */
    handleInput(event) {
        // Auto-save could be triggered here
        // For now, just ensure we maintain proper structure
        this.ensureProperStructure();
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

        // First, process any shortcut syntax to convert to standard markdown
        // Note: Need to handle bi{} before b{} to avoid pattern collision
        let processedText = text;

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
            return `<h${level}>${this.escapeHtml(content)}</h${level}>`;
        }

        // Blockquote (> text)
        const quoteMatch = processedText.match(/^>\s*(.+)$/);
        if (quoteMatch) {
            const content = quoteMatch[1];
            return `<blockquote>${this.escapeHtml(content)}</blockquote>`;
        }

        // Horizontal rule (--- or ***)
        if (processedText.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
            return '<hr>';
        }

        // Code block (```lang or just ```)
        const codeMatch = processedText.match(/^```(\w+)?$/);
        if (codeMatch) {
            // Start of code block - needs special handling
            return null; // For now, don't render incomplete code blocks
        }

        // Unordered list (- item or * item)
        const ulMatch = processedText.match(/^[-*]\s+(.+)$/);
        if (ulMatch) {
            const content = ulMatch[1];
            const formattedContent = this.renderInlineFormatting(content);
            return `<ul><li>${formattedContent}</li></ul>`;
        }

        // Ordered list (1. item)
        const olMatch = processedText.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
            const content = olMatch[1];
            const formattedContent = this.renderInlineFormatting(content);
            return `<ol><li>${formattedContent}</li></ol>`;
        }

        // Task list (- [ ] or - [x])
        const taskMatch = processedText.match(/^-\s+\[([ x])\]\s+(.+)$/i);
        if (taskMatch) {
            const checked = taskMatch[1].toLowerCase() === 'x';
            const content = taskMatch[2];
            const formattedContent = this.renderInlineFormatting(content);
            const checkbox = checked ? '☑' : '☐';
            return `<p>${checkbox} ${formattedContent}</p>`;
        }

        // Regular paragraph with inline formatting
        const formatted = this.renderInlineFormatting(processedText);
        if (formatted !== processedText) {
            return `<p>${formatted}</p>`;
        }

        // No special markdown detected
        return null;
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
        element.contentEditable = 'false'; // Make it non-editable until clicked

        return element;
    }

    /**
     * Convert a rendered block back to edit mode
     */
    convertToEditMode(renderedBlock) {
        // Get original markdown
        const markdown = renderedBlock.getAttribute('data-wysiwyg-markdown');
        if (!markdown) return;

        // Create editable paragraph with markdown text
        const editBlock = document.createElement('p');
        editBlock.textContent = markdown;
        editBlock.contentEditable = 'true';

        // Replace rendered block with editable block
        renderedBlock.parentNode.replaceChild(editBlock, renderedBlock);

        // Focus and select all text
        this.setCursorAt(editBlock, markdown.length);
        editBlock.focus();

        // Select all text in the block
        const range = document.createRange();
        range.selectNodeContents(editBlock);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
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
        const markdown = blocks.map(block => {
            // If it's a rendered block, return original markdown
            if (block.hasAttribute('data-wysiwyg-markdown')) {
                return block.getAttribute('data-wysiwyg-markdown');
            }
            // Otherwise return text content
            return block.textContent || '';
        }).join('\n');

        return markdown;
    }

    /**
     * Set document content from markdown
     * @param {boolean} renderAll - If true, render all markdown blocks immediately
     */
    setMarkdown(markdown, renderAll = false) {
        if (!markdown || markdown.trim() === '') {
            this.editorElement.innerHTML = '<p><br></p>';
            return;
        }

        // Split into lines and create paragraphs
        const lines = markdown.split('\n');
        const blocks = [];

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            if (line.trim() === '') {
                blocks.push('<p><br></p>');
                i++;
                continue;
            }

            // If renderAll is true, try to render the markdown
            if (renderAll) {
                const rendered = this.renderMarkdown(line);

                // Group consecutive ordered list items
                if (rendered && rendered.startsWith('<ol>')) {
                    const olItems = [];
                    const olMarkdown = [];

                    while (i < lines.length) {
                        const currentLine = lines[i];
                        const currentRendered = this.renderMarkdown(currentLine);

                        if (currentRendered && currentRendered.startsWith('<ol>')) {
                            const liMatch = currentRendered.match(/<li>(.+?)<\/li>/);
                            if (liMatch) {
                                olItems.push(liMatch[1]);
                                olMarkdown.push(currentLine);
                            }
                            i++;
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
                    ol.contentEditable = 'false';
                    blocks.push(ol.outerHTML);
                    continue;
                }

                // Group consecutive unordered list items
                if (rendered && rendered.startsWith('<ul>')) {
                    const ulItems = [];
                    const ulMarkdown = [];

                    while (i < lines.length) {
                        const currentLine = lines[i];
                        const currentRendered = this.renderMarkdown(currentLine);

                        if (currentRendered && currentRendered.startsWith('<ul>')) {
                            const liMatch = currentRendered.match(/<li>(.+?)<\/li>/);
                            if (liMatch) {
                                ulItems.push(liMatch[1]);
                                ulMarkdown.push(currentLine);
                            }
                            i++;
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
                    ul.contentEditable = 'false';
                    blocks.push(ul.outerHTML);
                    continue;
                }

                if (rendered) {
                    // Return a rendered block with the original markdown stored
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = rendered;
                    const element = wrapper.firstChild;
                    element.setAttribute('data-wysiwyg-rendered', 'true');
                    element.setAttribute('data-wysiwyg-markdown', line);
                    element.contentEditable = 'false';
                    blocks.push(element.outerHTML);
                    i++;
                    continue;
                }
            }

            blocks.push(`<p>${this.escapeHtml(line)}</p>`);
            i++;
        }

        this.editorElement.innerHTML = blocks.join('');
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

        // Find the source textarea
        this.sourceTextarea = document.getElementById('source-editor');
        if (!this.sourceTextarea) {
            console.warn('Source editor textarea not found');
            return;
        }

        // Get current markdown from WYSIWYG editor
        const markdown = this.getMarkdown();

        // Hide WYSIWYG editor, show source textarea
        this.editorElement.style.display = 'none';
        this.sourceTextarea.style.display = 'block';

        // Load markdown into source textarea
        this.sourceTextarea.value = markdown;

        // Focus the textarea
        this.sourceTextarea.focus();

        this.sourceMode = true;
        console.log('Switched to source mode');
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

        // Get markdown from source textarea
        const markdown = this.sourceTextarea.value;

        // Hide source textarea, show WYSIWYG editor
        this.sourceTextarea.style.display = 'none';
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
        console.log('Switched to WYSIWYG mode');
    }

    /**
     * Check if currently in source mode
     */
    isSourceMode() {
        return this.sourceMode;
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
