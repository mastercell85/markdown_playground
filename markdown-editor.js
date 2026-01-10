/**
 * Markdown Editor - Manages dynamic tab creation and content
 *
 * Behavior:
 * - Starts with a clean slate (no tabs)
 * - Tabs will be created dynamically as needed
 * - Same panel management system as main page
 */

(function() {
    'use strict';

    // Track which panel is currently open (only one at a time)
    let currentlyOpenPanel = null;

    // Panel selectors for the five editor panels
    const panels = [
        { element: null, selector: '.files-panel', class: 'panel-open' },
        { element: null, selector: '.edit-panel', class: 'panel-open' },
        { element: null, selector: '.view-panel', class: 'panel-open' },
        { element: null, selector: '.settings-panel', class: 'panel-open' },
        { element: null, selector: '.back-panel', class: 'panel-open' }
    ];

    // Initialize when DOM is ready
    function init() {
        console.log('Markdown Editor initialized');

        // Get panel elements
        panels.forEach(panel => {
            panel.element = document.querySelector(panel.selector);
        });

        // Add mouseenter listeners to open panels
        panels.forEach(panel => {
            if (panel.element) {
                panel.element.addEventListener('mouseenter', function() {
                    openPanel(panel);
                });

                // Add click listener to tab label
                const tabLabel = panel.element.querySelector('.panel-tab-label');
                if (tabLabel) {
                    tabLabel.addEventListener('click', function(event) {
                        event.stopPropagation(); // Prevent click-outside from closing immediately
                        openPanel(panel);
                    });
                }

                // Prevent clicks inside panel content from closing the panel
                const panelContent = panel.element.querySelector('.panel-content');
                if (panelContent) {
                    panelContent.addEventListener('click', function(event) {
                        event.stopPropagation(); // Keep panel open when clicking inside
                    });
                }
            }
        });

        // Add click listener to document for click-outside detection
        document.addEventListener('click', handleClickOutside);

        // Add special handler for Back button
        const backButton = document.getElementById('back-to-home');
        if (backButton) {
            backButton.addEventListener('click', function(event) {
                event.stopPropagation();
                window.location.href = 'index.html';
            });
        }
    }

    /**
     * Create a new panel/tab dynamically
     * @param {Object} config - Configuration for the new panel
     * @param {string} config.name - Display name for the tab
     * @param {string} config.selector - CSS selector class
     * @param {string} config.content - HTML content for the panel
     */
    function createPanel(config) {
        // TODO: Implement dynamic panel creation
        console.log('Creating panel:', config);
    }

    /**
     * Open a panel (closes any previously open panel)
     */
    function openPanel(panel) {
        if (!panel.element) return;

        // Close the currently open panel if it's different from the one being opened
        if (currentlyOpenPanel && currentlyOpenPanel !== panel) {
            closePanel(currentlyOpenPanel);
        }

        // Open the new panel
        panel.element.classList.add(panel.class);
        currentlyOpenPanel = panel;
    }

    /**
     * Close a panel
     */
    function closePanel(panel) {
        if (!panel.element) return;

        panel.element.classList.remove(panel.class);

        // Clear the currently open panel reference if this is it
        if (currentlyOpenPanel === panel) {
            currentlyOpenPanel = null;
        }
    }

    /**
     * Handle clicks outside of open panels
     */
    function handleClickOutside(event) {
        // If there's a currently open panel, check if click was outside it
        if (currentlyOpenPanel && currentlyOpenPanel.element) {
            if (!currentlyOpenPanel.element.contains(event.target)) {
                closePanel(currentlyOpenPanel);
            }
        }
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose createPanel for external use if needed
    window.MarkdownEditor = {
        createPanel: createPanel,
        parser: null,
        renderer: null,
        syncManager: null
    };
})();

/**
 * Markdown Parser Module
 * Converts markdown syntax to HTML
 * Modular design allows easy extension for keyword syntax later
 */
(function() {
    'use strict';

    class MarkdownParser {
        constructor() {
            this.rules = this.initializeRules();
        }

        /**
         * Initialize parsing rules
         * Structured for easy extension with keyword rules later
         */
        initializeRules() {
            return [
                // Headers
                { pattern: /^### (.*$)/gim, replacement: '<h3>$1</h3>' },
                { pattern: /^## (.*$)/gim, replacement: '<h2>$1</h2>' },
                { pattern: /^# (.*$)/gim, replacement: '<h1>$1</h1>' },

                // Bold and Italic
                { pattern: /\*\*\*(.+?)\*\*\*/g, replacement: '<strong><em>$1</em></strong>' },
                { pattern: /\*\*(.+?)\*\*/g, replacement: '<strong>$1</strong>' },
                { pattern: /\*(.+?)\*/g, replacement: '<em>$1</em>' },
                { pattern: /___(.+?)___/g, replacement: '<strong><em>$1</em></strong>' },
                { pattern: /__(.+?)__/g, replacement: '<strong>$1</strong>' },
                { pattern: /_(.+?)_/g, replacement: '<em>$1</em>' },

                // Links
                { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2">$1</a>' },

                // Inline code
                { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },

                // Line breaks
                { pattern: /\n$/gim, replacement: '<br />' }
            ];
        }

        /**
         * Parse markdown text to HTML
         * @param {string} markdown - Raw markdown text
         * @returns {string} - Rendered HTML
         */
        parse(markdown) {
            if (!markdown) return '';

            let html = markdown;

            // Apply all rules
            this.rules.forEach(rule => {
                html = html.replace(rule.pattern, rule.replacement);
            });

            // Handle paragraphs and lists
            html = this.processParagraphsAndLists(html);

            return html;
        }

        /**
         * Process paragraphs and lists
         * @param {string} html - HTML string
         * @returns {string} - Processed HTML
         */
        processParagraphsAndLists(html) {
            const lines = html.split('\n');
            let result = [];
            let inList = false;
            let listType = null;

            for (let line of lines) {
                // Unordered list
                if (line.trim().match(/^[-*+] /)) {
                    if (!inList || listType !== 'ul') {
                        if (inList) result.push(`</${listType}>`);
                        result.push('<ul>');
                        inList = true;
                        listType = 'ul';
                    }
                    result.push(`<li>${line.trim().substring(2)}</li>`);
                }
                // Ordered list
                else if (line.trim().match(/^\d+\. /)) {
                    if (!inList || listType !== 'ol') {
                        if (inList) result.push(`</${listType}>`);
                        result.push('<ol>');
                        inList = true;
                        listType = 'ol';
                    }
                    result.push(`<li>${line.trim().replace(/^\d+\. /, '')}</li>`);
                }
                // Blockquote
                else if (line.trim().startsWith('> ')) {
                    if (inList) {
                        result.push(`</${listType}>`);
                        inList = false;
                        listType = null;
                    }
                    result.push(`<blockquote>${line.trim().substring(2)}</blockquote>`);
                }
                // Code block
                else if (line.trim().startsWith('```')) {
                    if (inList) {
                        result.push(`</${listType}>`);
                        inList = false;
                        listType = null;
                    }
                    // Handle code blocks (simplified)
                    result.push('<pre><code>' + line.trim().substring(3) + '</code></pre>');
                }
                // Regular paragraph
                else if (line.trim()) {
                    if (inList) {
                        result.push(`</${listType}>`);
                        inList = false;
                        listType = null;
                    }
                    // Don't wrap if already wrapped in HTML tags
                    if (!line.trim().match(/^<[^>]+>/)) {
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
    }

    /**
     * Markdown Renderer Module
     * Handles rendering and live preview updates
     */
    class MarkdownRenderer {
        constructor(parser, inputElement, outputElement) {
            this.parser = parser;
            this.inputElement = inputElement;
            this.outputElement = outputElement;
            this.externalWindow = null;

            this.init();
        }

        init() {
            if (this.inputElement) {
                // Use input event for real-time updates
                this.inputElement.addEventListener('input', () => this.render());
                // Initial render
                this.render();
            }
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
            if (this.externalWindow && !this.externalWindow.closed) {
                const previewElement = this.externalWindow.document.getElementById('markdown-preview');
                if (previewElement) {
                    previewElement.innerHTML = html;
                }
            }
        }

        /**
         * Open preview in new window
         */
        openExternalWindow() {
            const width = 800;
            const height = 600;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;

            this.externalWindow = window.open(
                '',
                'MarkdownPreview',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );

            if (this.externalWindow) {
                this.setupExternalWindow();
                this.render(); // Render current content
            }
        }

        /**
         * Setup external window with styles
         */
        setupExternalWindow() {
            this.externalWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Markdown Preview</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            background: #1a1a1a;
                            color: #fff;
                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                            font-size: 14px;
                            line-height: 1.6;
                        }
                        h1 {
                            font-size: 32px;
                            margin: 20px 0 10px 0;
                            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                            padding-bottom: 10px;
                        }
                        h2 { font-size: 24px; margin: 18px 0 8px 0; }
                        h3 { font-size: 20px; margin: 16px 0 6px 0; }
                        p { margin: 10px 0; }
                        strong { font-weight: bold; }
                        em { font-style: italic; }
                        code {
                            background: rgba(255, 255, 255, 0.1);
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', Courier, monospace;
                        }
                        pre {
                            background: rgba(0, 0, 0, 0.5);
                            padding: 15px;
                            border-radius: 5px;
                            overflow-x: auto;
                        }
                        ul, ol { padding-left: 30px; }
                        li { margin: 5px 0; }
                        a { color: #66b3ff; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                        blockquote {
                            border-left: 4px solid rgba(255, 255, 255, 0.3);
                            padding-left: 15px;
                            color: #ccc;
                            font-style: italic;
                        }
                    </style>
                </head>
                <body>
                    <div id="markdown-preview"></div>
                </body>
                </html>
            `);
            this.externalWindow.document.close();
        }

        /**
         * Close external window
         */
        closeExternalWindow() {
            if (this.externalWindow && !this.externalWindow.closed) {
                this.externalWindow.close();
            }
            this.externalWindow = null;
        }
    }

    // Initialize when DOM is ready
    function initializeMarkdownEditor() {
        const inputElement = document.getElementById('markdown-input');
        const outputElement = document.getElementById('markdown-preview');

        if (inputElement && outputElement) {
            const parser = new MarkdownParser();
            const renderer = new MarkdownRenderer(parser, inputElement, outputElement);

            // Expose to global MarkdownEditor object
            window.MarkdownEditor.parser = parser;
            window.MarkdownEditor.renderer = renderer;

            // Setup View panel buttons
            setupViewControls(renderer);

            console.log('Markdown editor initialized with live preview');
        }
    }

    /**
     * Setup View panel controls
     */
    function setupViewControls(renderer) {
        const openBtn = document.getElementById('open-external-preview');
        const closeBtn = document.getElementById('close-external-preview');

        if (openBtn) {
            openBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent click from bubbling
                renderer.openExternalWindow();
                openBtn.disabled = true;
                if (closeBtn) closeBtn.disabled = false;
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent click from bubbling
                renderer.closeExternalWindow();
                closeBtn.disabled = true;
                if (openBtn) openBtn.disabled = false;
            });
        }

        // Check if external window closes manually
        setInterval(() => {
            if (renderer.externalWindow && renderer.externalWindow.closed) {
                renderer.externalWindow = null;
                if (openBtn) openBtn.disabled = false;
                if (closeBtn) closeBtn.disabled = true;
            }
        }, 500);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMarkdownEditor);
    } else {
        initializeMarkdownEditor();
    }
})();
