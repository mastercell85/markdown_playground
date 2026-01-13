/**
 * FindManager Module
 * Handles find and replace functionality with theme-aware UI
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles find/replace logic and UI
 * - Open/Closed: Can be extended with new search features
 * - Dependency Inversion: Uses configuration instead of hardcoded values
 */

class FindManager {
    constructor(config = {}) {
        this.textareaSelector = config.textareaSelector || '#markdown-input';
        this.dialogSelector = config.dialogSelector || '#find-replace-dialog';

        this.textarea = null;
        this.dialog = null;
        this.findInput = null;
        this.replaceInput = null;
        this.matchCounter = null;

        // Search state
        this.matches = [];
        this.currentMatchIndex = -1;
        this.currentMatchVisited = false; // Track if current match has been shown with focus
        this.caseSensitive = false;
        this.wholeWord = false;
        this.useRegex = false;

        // Drag state
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dialogStartX = 0;
        this.dialogStartY = 0;
    }

    /**
     * Initialize the find manager
     */
    init() {
        // Get DOM elements
        this.textarea = document.querySelector(this.textareaSelector);
        this.dialog = document.querySelector(this.dialogSelector);

        if (!this.textarea || !this.dialog) {
            console.warn('FindManager: Required elements not found');
            return this;
        }

        // Get dialog elements
        this.findInput = document.getElementById('find-input');
        this.replaceInput = document.getElementById('replace-input');
        this.matchCounter = document.getElementById('find-match-counter');

        // Setup event listeners
        this.setupDialogListeners();
        this.setupKeyboardShortcuts();
        this.setupDragging();

        return this;
    }

    /**
     * Setup dialog event listeners
     */
    setupDialogListeners() {
        // Close button
        const closeBtn = document.getElementById('find-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Find input - search as you type
        if (this.findInput) {
            this.findInput.addEventListener('input', () => this.findAll());
        }

        // Options checkboxes
        const caseSensitiveCheckbox = document.getElementById('find-case-sensitive');
        const wholeWordCheckbox = document.getElementById('find-whole-word');
        const regexCheckbox = document.getElementById('find-regex');

        if (caseSensitiveCheckbox) {
            caseSensitiveCheckbox.addEventListener('change', (e) => {
                this.caseSensitive = e.target.checked;
                this.findAll();
            });
        }

        if (wholeWordCheckbox) {
            wholeWordCheckbox.addEventListener('change', (e) => {
                this.wholeWord = e.target.checked;
                this.findAll();
            });
        }

        if (regexCheckbox) {
            regexCheckbox.addEventListener('change', (e) => {
                this.useRegex = e.target.checked;
                this.findAll();
            });
        }

        // Navigation buttons
        const prevBtn = document.getElementById('find-previous-btn');
        const nextBtn = document.getElementById('find-next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.findPrevious());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.findNext());
        }

        // Replace buttons
        const replaceBtn = document.getElementById('find-replace-btn');
        const replaceAllBtn = document.getElementById('find-replace-all-btn');

        if (replaceBtn) {
            replaceBtn.addEventListener('click', () => this.replaceCurrent());
        }

        if (replaceAllBtn) {
            replaceAllBtn.addEventListener('click', () => this.replaceAll());
        }

        // Enter key in find input
        if (this.findInput) {
            this.findInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (e.shiftKey) {
                        this.findPrevious();
                    } else {
                        this.findNext();
                    }
                    e.preventDefault();
                }
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+F or Cmd+F to open find dialog
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.open();
            }

            // Escape to close dialog
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }

            // F3 for next, Shift+F3 for previous (when dialog is open)
            if (e.key === 'F3' && this.isOpen()) {
                e.preventDefault();
                if (e.shiftKey) {
                    this.findPrevious();
                } else {
                    this.findNext();
                }
            }
        });
    }

    /**
     * Setup dragging functionality
     */
    setupDragging() {
        const header = this.dialog.querySelector('.find-replace-header');
        if (!header) return;

        header.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on close button
            if (e.target.classList.contains('find-close-btn') ||
                e.target.closest('.find-close-btn')) {
                return;
            }

            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            // Get current position
            const rect = this.dialog.getBoundingClientRect();
            this.dialogStartX = rect.left;
            this.dialogStartY = rect.top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;

            const newX = this.dialogStartX + deltaX;
            const newY = this.dialogStartY + deltaY;

            // Keep dialog within viewport bounds
            const maxX = window.innerWidth - this.dialog.offsetWidth;
            const maxY = window.innerHeight - this.dialog.offsetHeight;

            const boundedX = Math.max(0, Math.min(newX, maxX));
            const boundedY = Math.max(0, Math.min(newY, maxY));

            this.dialog.style.left = boundedX + 'px';
            this.dialog.style.top = boundedY + 'px';
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    /**
     * Position dialog in center-upper area of viewport
     */
    positionDialog() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dialogWidth = this.dialog.offsetWidth;

        // Center horizontally
        const left = (viewportWidth - dialogWidth) / 2;

        // Position in upper area (20% from top)
        const top = viewportHeight * 0.2;

        this.dialog.style.left = left + 'px';
        this.dialog.style.top = top + 'px';
    }

    /**
     * Open the find dialog
     */
    open() {
        this.dialog.style.display = 'block';

        // Position dialog on first open (if not already positioned)
        if (!this.dialog.style.left) {
            this.positionDialog();
        }

        this.findInput.focus();

        // Select any existing text in find input
        this.findInput.select();

        // If there's text selected in textarea, use it as search term
        const selectedText = this.getSelectedText();
        if (selectedText) {
            this.findInput.value = selectedText;
            this.findAll();
        }
    }

    /**
     * Close the find dialog
     */
    close() {
        this.dialog.style.display = 'none';
        this.clearHighlights();
        this.textarea.focus();
    }

    /**
     * Check if dialog is open
     */
    isOpen() {
        return this.dialog.style.display !== 'none';
    }

    /**
     * Get selected text from textarea
     */
    getSelectedText() {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        return this.textarea.value.substring(start, end);
    }

    /**
     * Find all occurrences
     */
    findAll() {
        const searchTerm = this.findInput.value;

        if (!searchTerm) {
            this.matches = [];
            this.currentMatchIndex = -1;
            this.updateMatchCounter();
            this.clearHighlights();
            return;
        }

        const text = this.textarea.value;
        this.matches = [];

        try {
            if (this.useRegex) {
                // Regex search
                const flags = this.caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(searchTerm, flags);
                let match;

                while ((match = regex.exec(text)) !== null) {
                    this.matches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[0]
                    });
                }
            } else {
                // Plain text search
                let searchText = searchTerm;
                let textToSearch = text;

                if (!this.caseSensitive) {
                    searchText = searchText.toLowerCase();
                    textToSearch = textToSearch.toLowerCase();
                }

                let index = textToSearch.indexOf(searchText);

                while (index !== -1) {
                    const matchText = text.substring(index, index + searchTerm.length);

                    // Check whole word if needed
                    if (this.wholeWord) {
                        const before = index > 0 ? text[index - 1] : ' ';
                        const after = index + searchTerm.length < text.length ?
                                     text[index + searchTerm.length] : ' ';

                        const isWordBoundary = /\W/.test(before) && /\W/.test(after);

                        if (isWordBoundary) {
                            this.matches.push({
                                start: index,
                                end: index + searchTerm.length,
                                text: matchText
                            });
                        }
                    } else {
                        this.matches.push({
                            start: index,
                            end: index + searchTerm.length,
                            text: matchText
                        });
                    }

                    index = textToSearch.indexOf(searchText, index + 1);
                }
            }

            // Select first match if found
            if (this.matches.length > 0) {
                this.currentMatchIndex = 0;
                this.currentMatchVisited = false; // Mark as not visited yet
                // Highlight first match and scroll to it automatically
                // Don't steal focus - user is typing in find input
                this.highlightCurrentMatch(false);
            } else {
                this.currentMatchIndex = -1;
                this.currentMatchVisited = false;
            }

            this.updateMatchCounter();
        } catch (error) {
            // Invalid regex
            console.warn('FindManager: Invalid search pattern', error);
            this.matches = [];
            this.currentMatchIndex = -1;
            this.updateMatchCounter();
        }
    }

    /**
     * Find next match
     */
    findNext() {
        if (this.matches.length === 0) {
            this.findAll();
            return;
        }

        // If current match hasn't been visited yet (shown with focus), show it first
        if (!this.currentMatchVisited) {
            this.currentMatchVisited = true;
            this.highlightCurrentMatch(true); // Focus and show current match
        } else {
            // Current match already visited, advance to next
            this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
            this.currentMatchVisited = true;
            this.highlightCurrentMatch(true);
        }

        this.updateMatchCounter();
    }

    /**
     * Find previous match
     */
    findPrevious() {
        if (this.matches.length === 0) {
            this.findAll();
            return;
        }

        // If current match hasn't been visited yet (shown with focus), show it first
        if (!this.currentMatchVisited) {
            this.currentMatchVisited = true;
            this.highlightCurrentMatch(true); // Focus and show current match
        } else {
            // Current match already visited, go to previous
            this.currentMatchIndex = this.currentMatchIndex - 1;
            if (this.currentMatchIndex < 0) {
                this.currentMatchIndex = this.matches.length - 1;
            }
            this.currentMatchVisited = true;
            this.highlightCurrentMatch(true);
        }

        this.updateMatchCounter();
    }

    /**
     * Highlight current match and scroll to it
     * @param {boolean} shouldFocus - Whether to focus the textarea (default: true)
     */
    highlightCurrentMatch(shouldFocus = true) {
        if (this.currentMatchIndex < 0 || this.currentMatchIndex >= this.matches.length) {
            return;
        }

        const match = this.matches[this.currentMatchIndex];

        // Select the match in textarea
        this.textarea.setSelectionRange(match.start, match.end);

        // Only focus if requested (don't steal focus while user is typing in find input)
        if (shouldFocus) {
            this.textarea.focus();
        }

        // Scroll to make it visible
        this.scrollToMatch();
    }

    /**
     * Scroll textarea to show current match
     */
    scrollToMatch() {
        // Get textarea dimensions and scroll position
        const lineHeight = parseFloat(getComputedStyle(this.textarea).lineHeight);
        const textBeforeCursor = this.textarea.value.substring(0, this.textarea.selectionStart);
        const linesBeforeCursor = textBeforeCursor.split('\n').length;

        // Calculate scroll position to center the match
        const targetScrollTop = (linesBeforeCursor * lineHeight) - (this.textarea.clientHeight / 2);

        this.textarea.scrollTop = Math.max(0, targetScrollTop);
    }

    /**
     * Replace current match
     */
    replaceCurrent() {
        if (this.currentMatchIndex < 0 || this.currentMatchIndex >= this.matches.length) {
            return;
        }

        const replaceText = this.replaceInput.value;
        const match = this.matches[this.currentMatchIndex];

        const text = this.textarea.value;
        const newText = text.substring(0, match.start) +
                       replaceText +
                       text.substring(match.end);

        this.textarea.value = newText;

        // Trigger input event to update preview
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // Re-find all matches (positions have changed)
        this.findAll();
    }

    /**
     * Replace all matches
     */
    replaceAll() {
        if (this.matches.length === 0) {
            return;
        }

        const replaceText = this.replaceInput.value;
        let text = this.textarea.value;

        // Replace from end to start to maintain positions
        for (let i = this.matches.length - 1; i >= 0; i--) {
            const match = this.matches[i];
            text = text.substring(0, match.start) +
                  replaceText +
                  text.substring(match.end);
        }

        const count = this.matches.length;
        this.textarea.value = text;

        // Trigger input event to update preview
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // Clear matches
        this.matches = [];
        this.currentMatchIndex = -1;
        this.updateMatchCounter();

        // Log confirmation (removed alert to not block automated tests)
        console.log(`FindManager: Replaced ${count} occurrence(s).`);
    }

    /**
     * Update match counter display
     */
    updateMatchCounter() {
        if (!this.matchCounter) return;

        if (this.matches.length === 0) {
            this.matchCounter.textContent = this.findInput.value ? 'No results' : '';
        } else {
            this.matchCounter.textContent = `${this.currentMatchIndex + 1} of ${this.matches.length}`;
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        // Clear selection in textarea
        if (this.textarea) {
            const pos = this.textarea.selectionStart;
            this.textarea.setSelectionRange(pos, pos);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FindManager;
}
