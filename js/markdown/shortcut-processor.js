/**
 * Shortcut Processor Module
 * Converts shortcut syntax to standard markdown
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles shortcut-to-markdown conversion
 * - Open/Closed: Can be extended with new shortcuts
 */

class ShortcutProcessor {
    constructor() {
        this.shortcuts = this.initializeShortcuts();
    }

    /**
     * Initialize all shortcut conversion rules
     */
    initializeShortcuts() {
        return {
            // Block-level shortcuts (processed line-by-line)
            block: [
                // Headers - must be processed in order from most specific to least
                ...this.createHeaderShortcuts(),
                ...this.createListShortcuts(),
                ...this.createBlockquoteShortcuts(),
                ...this.createHorizontalRuleShortcuts(),
                ...this.createCodeBlockShortcuts()
            ],
            // Inline shortcuts (processed within text)
            inline: [
                ...this.createTextFormattingShortcuts(),
                ...this.createLinkShortcuts(),
                ...this.createImageShortcuts(),
                ...this.createInlineCodeShortcuts()
            ]
        };
    }

    /**
     * Create header shortcut patterns
     */
    createHeaderShortcuts() {
        const shortcuts = [];

        // Semantic aliases
        shortcuts.push({ pattern: /^title:\s*(.+)$/i, replacement: '# $1', name: 'title-alias' });
        shortcuts.push({ pattern: /^subtitle:\s*(.+)$/i, replacement: '## $1', name: 'subtitle-alias' });
        shortcuts.push({ pattern: /^section:\s*(.+)$/i, replacement: '### $1', name: 'section-alias' });
        shortcuts.push({ pattern: /^subsection:\s*(.+)$/i, replacement: '#### $1', name: 'subsection-alias' });

        // BBCode style [h1]text[/h1]
        for (let i = 1; i <= 6; i++) {
            shortcuts.push({
                pattern: new RegExp(`^\\[h${i}\\](.+?)\\[/h${i}\\]$`, 'i'),
                replacement: `${'#'.repeat(i)} $1`,
                name: `header-bbcode-h${i}`
            });
        }

        // HTML-like <h1>text</h1>
        for (let i = 1; i <= 6; i++) {
            shortcuts.push({
                pattern: new RegExp(`^<h${i}>(.+?)</h${i}>$`, 'i'),
                replacement: `${'#'.repeat(i)} $1`,
                name: `header-html-h${i}`
            });
        }

        // Full word: heading1: text
        for (let i = 1; i <= 6; i++) {
            shortcuts.push({
                pattern: new RegExp(`^heading${i}:\\s*(.+)$`, 'i'),
                replacement: `${'#'.repeat(i)} $1`,
                name: `header-word-h${i}`
            });
        }

        // Shorthand: h1: text
        for (let i = 1; i <= 6; i++) {
            shortcuts.push({
                pattern: new RegExp(`^h${i}:\\s*(.+)$`, 'i'),
                replacement: `${'#'.repeat(i)} $1`,
                name: `header-short-h${i}`
            });
        }

        return shortcuts;
    }

    /**
     * Create text formatting shortcuts (bold, italic, strikethrough)
     */
    createTextFormattingShortcuts() {
        return [
            // Bold
            { pattern: /<b>(.+?)<\/b>/g, replacement: '**$1**', name: 'bold-html' },
            { pattern: /\[b\](.+?)\[\/b\]/g, replacement: '**$1**', name: 'bold-bbcode' },
            { pattern: /:bold:(.+?):bold:/g, replacement: '**$1**', name: 'bold-colon-full' },
            { pattern: /:b:(.+?):b:/g, replacement: '**$1**', name: 'bold-colon-short' },
            { pattern: /b\{(.+?)\}/g, replacement: '**$1**', name: 'bold-brace' },

            // Italic
            { pattern: /<i>(.+?)<\/i>/g, replacement: '*$1*', name: 'italic-html' },
            { pattern: /\[i\](.+?)\[\/i\]/g, replacement: '*$1*', name: 'italic-bbcode' },
            { pattern: /:italic:(.+?):italic:/g, replacement: '*$1*', name: 'italic-colon-full' },
            { pattern: /:i:(.+?):i:/g, replacement: '*$1*', name: 'italic-colon-short' },
            { pattern: /i\{(.+?)\}/g, replacement: '*$1*', name: 'italic-brace' },

            // Strikethrough
            { pattern: /<s>(.+?)<\/s>/g, replacement: '~~$1~~', name: 'strike-html' },
            { pattern: /\[s\](.+?)\[\/s\]/g, replacement: '~~$1~~', name: 'strike-bbcode' },
            { pattern: /:strike:(.+?):strike:/g, replacement: '~~$1~~', name: 'strike-colon-full' },
            { pattern: /:s:(.+?):s:/g, replacement: '~~$1~~', name: 'strike-colon-short' },
            { pattern: /s\{(.+?)\}/g, replacement: '~~$1~~', name: 'strike-brace' },

            // Bold + Italic
            { pattern: /<bi>(.+?)<\/bi>/g, replacement: '***$1***', name: 'bold-italic-html' },
            { pattern: /\[bi\](.+?)\[\/bi\]/g, replacement: '***$1***', name: 'bold-italic-bbcode' },
            { pattern: /:bi:(.+?):bi:/g, replacement: '***$1***', name: 'bold-italic-colon' },
            { pattern: /bi\{(.+?)\}/g, replacement: '***$1***', name: 'bold-italic-brace' }
        ];
    }

    /**
     * Create link shortcuts
     */
    createLinkShortcuts() {
        return [
            // BBCode [url=link]text[/url]
            { pattern: /\[url=([^\]]+)\](.+?)\[\/url\]/g, replacement: '[$2]($1)', name: 'link-bbcode-with-text' },
            // BBCode [url]link[/url] (auto-link)
            { pattern: /\[url\]([^\]]+)\[\/url\]/g, replacement: '[$1]($1)', name: 'link-bbcode-auto' },
            // HTML <link href="url">text</link>
            { pattern: /<link href="([^"]+)">(.+?)<\/link>/g, replacement: '[$2]($1)', name: 'link-html-with-text' },
            // HTML <link>url</link> (auto-link)
            { pattern: /<link>(.+?)<\/link>/g, replacement: '[$1]($1)', name: 'link-html-auto' }
            // Note: "link: " shortcuts are handled in processBlockShortcuts as they're line-based
        ];
    }

    /**
     * Create image shortcuts
     */
    createImageShortcuts() {
        return [
            // BBCode [img=url]alt[/img]
            { pattern: /\[img=([^\]]+)\](.+?)\[\/img\]/g, replacement: '![$2]($1)', name: 'img-bbcode-with-alt' },
            // BBCode [img]url[/img]
            { pattern: /\[img\]([^\]]+)\[\/img\]/g, replacement: '![]($1)', name: 'img-bbcode' },
            // HTML <img src="url" alt="text" />
            { pattern: /<img src="([^"]+)" alt="([^"]+)"\s*\/?>/g, replacement: '![$2]($1)', name: 'img-html-full' },
            // HTML <img>url</img>
            { pattern: /<img>(.+?)<\/img>/g, replacement: '![]($1)', name: 'img-html' }
            // Note: "img: " shortcuts are handled in processBlockShortcuts as they're line-based
        ];
    }

    /**
     * Create inline code shortcuts
     */
    createInlineCodeShortcuts() {
        return [
            // HTML <code>text</code>
            { pattern: /<code>(.+?)<\/code>/g, replacement: '`$1`', name: 'code-html' },
            // BBCode [code]text[/code]
            { pattern: /\[code\](.+?)\[\/code\]/g, replacement: '`$1`', name: 'code-bbcode' },
            // Colon wrap :code:text:code:
            { pattern: /:code:(.+?):code:/g, replacement: '`$1`', name: 'code-colon' },
            // Brace wrap c{text}
            { pattern: /c\{(.+?)\}/g, replacement: '`$1`', name: 'code-brace' }
        ];
    }

    /**
     * Create list shortcuts
     */
    createListShortcuts() {
        return [
            // Task lists - done/checked
            { pattern: /^done:\s*(.+)$/i, replacement: '- [x] $1', name: 'task-done' },
            { pattern: /^\[done\]\s*(.+)$/i, replacement: '- [x] $1', name: 'task-done-bbcode' },

            // Task lists - todo/unchecked (with 'x' marker for checked)
            { pattern: /^task:\s*x\s+(.+)$/i, replacement: '- [x] $1', name: 'task-checked' },
            { pattern: /^task:\s*(.+)$/i, replacement: '- [ ] $1', name: 'task-unchecked' },
            { pattern: /^todo:\s*(.+)$/i, replacement: '- [ ] $1', name: 'task-todo' },
            { pattern: /^\[task\]\s*(.+)$/i, replacement: '- [ ] $1', name: 'task-bbcode' },

            // Unordered lists
            { pattern: /^ul:\s*(.+)$/i, replacement: '- $1', name: 'ul-short' },
            { pattern: /^list:\s*(.+)$/i, replacement: '- $1', name: 'ul-list' },
            { pattern: /^•\s*(.+)$/, replacement: '- $1', name: 'ul-bullet' },

            // Ordered lists (auto-numbered)
            { pattern: /^ol:\s*(.+)$/i, replacement: '1. $1', name: 'ol-short' },
            { pattern: /^#\.\s*(.+)$/, replacement: '1. $1', name: 'ol-hash' }
        ];
    }

    /**
     * Create blockquote shortcuts
     */
    createBlockquoteShortcuts() {
        return [
            // BBCode [quote]text[/quote]
            { pattern: /^\[quote\](.+?)\[\/quote\]$/i, replacement: '> $1', name: 'quote-bbcode' },
            // HTML <blockquote>text</blockquote>
            { pattern: /^<blockquote>(.+?)<\/blockquote>$/i, replacement: '> $1', name: 'quote-html' },
            // Shorthand bq: text
            { pattern: /^bq:\s*(.+)$/i, replacement: '> $1', name: 'quote-bq' },
            // Shorthand quote: text
            { pattern: /^quote:\s*(.+)$/i, replacement: '> $1', name: 'quote-short' }
        ];
    }

    /**
     * Create horizontal rule shortcuts
     */
    createHorizontalRuleShortcuts() {
        return [
            // BBCode [hr]
            { pattern: /^\[hr\]$/i, replacement: '---', name: 'hr-bbcode' },
            // HTML <hr>
            { pattern: /^<hr>$/i, replacement: '---', name: 'hr-html' },
            // Shorthand divider:
            { pattern: /^divider:\s*$/i, replacement: '---', name: 'hr-divider' },
            // Shorthand hr:
            { pattern: /^hr:\s*$/i, replacement: '---', name: 'hr-short' }
        ];
    }

    /**
     * Create code block shortcuts
     */
    createCodeBlockShortcuts() {
        return [
            // These are handled specially in processCodeBlockShortcuts
            // because they're multi-line
        ];
    }

    /**
     * Process all shortcuts in markdown text
     * @param {string} markdown - Raw markdown with shortcuts
     * @returns {string} - Markdown with shortcuts converted to standard syntax
     */
    process(markdown) {
        if (!markdown) return '';

        // Step 1: Process code block shortcuts (multi-line, must be first)
        let result = this.processCodeBlockShortcuts(markdown);

        // Step 2: Process block-level shortcuts (line-by-line)
        result = this.processBlockShortcuts(result);

        // Step 3: Process inline shortcuts (within text)
        result = this.processInlineShortcuts(result);

        return result;
    }

    /**
     * Process code block shortcuts (multi-line)
     */
    processCodeBlockShortcuts(markdown) {
        let result = markdown;

        // BBCode [code=language]...[/code]
        result = result.replace(/\[code=([^\]]+)\]([\s\S]*?)\[\/code\]/gi, (match, lang, code) => {
            return '```' + lang + '\n' + code.trim() + '\n```';
        });

        // BBCode [code]...[/code] (no language)
        result = result.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, (match, code) => {
            return '```\n' + code.trim() + '\n```';
        });

        // HTML <code language="lang">...</code>
        result = result.replace(/<code language="([^"]+)">([\s\S]*?)<\/code>/gi, (match, lang, code) => {
            return '```' + lang + '\n' + code.trim() + '\n```';
        });

        // Shorthand code: language ... endcode:
        result = result.replace(/^code:\s*(\w+)\s*$([\s\S]*?)^endcode:\s*$/gim, (match, lang, code) => {
            return '```' + lang + '\n' + code.trim() + '\n```';
        });

        // Shorthand code: ... endcode: (no language)
        result = result.replace(/^code:\s*$([\s\S]*?)^endcode:\s*$/gim, (match, code) => {
            return '```\n' + code.trim() + '\n```';
        });

        return result;
    }

    /**
     * Process block-level shortcuts (line-by-line)
     */
    processBlockShortcuts(markdown) {
        const lines = markdown.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const trimmed = line.trim();

            // Special handling for link: shortcuts
            if (/^link:\s*/i.test(trimmed)) {
                const linkMatch = trimmed.match(/^link:\s*(.+?)\s*\|\s*(.+)$/i);
                if (linkMatch) {
                    // link: text | url
                    line = line.replace(/^(\s*)link:\s*(.+?)\s*\|\s*(.+)$/i, '$1[$2]($3)');
                } else {
                    // link: url (auto-link, use URL as text)
                    line = line.replace(/^(\s*)link:\s*(.+)$/i, (match, indent, url) => {
                        return indent + '[' + url.trim() + '](' + url.trim() + ')';
                    });
                }
            }

            // Special handling for img: shortcuts
            if (/^img:\s*/i.test(trimmed)) {
                const imgMatch = trimmed.match(/^img:\s*(.+?)\s*\|\s*(.+)$/i);
                if (imgMatch) {
                    // img: alt | url
                    line = line.replace(/^(\s*)img:\s*(.+?)\s*\|\s*(.+)$/i, '$1![$2]($3)');
                } else {
                    // img: url (no alt text)
                    line = line.replace(/^(\s*)img:\s*(.+)$/i, '$1![]($2)');
                }
            }

            // Apply block-level shortcut rules
            for (const shortcut of this.shortcuts.block) {
                if (shortcut.pattern.test(line)) {
                    line = line.replace(shortcut.pattern, shortcut.replacement);
                    break; // Only apply first matching rule
                }
            }

            result.push(line);
        }

        return result.join('\n');
    }

    /**
     * Process inline shortcuts (within text)
     */
    processInlineShortcuts(markdown) {
        let result = markdown;

        // Apply all inline shortcut rules
        for (const shortcut of this.shortcuts.inline) {
            result = result.replace(shortcut.pattern, shortcut.replacement);
        }

        return result;
    }

    /**
     * Get all registered shortcuts
     */
    getShortcuts() {
        return this.shortcuts;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShortcutProcessor;
}
