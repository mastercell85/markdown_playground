/**
 * Scroll Sync Debug Utilities
 *
 * This file contains debug code snippets that can be temporarily added
 * to scroll-sync.js and block-processor.js for troubleshooting sync issues.
 *
 * DO NOT include this file in production - it's for reference only.
 */

// ==============================================================================
// DEBUG CODE FOR scroll-sync.js
// ==============================================================================

/**
 * Add this to _syncPreviewToInputWithElementMatching() method
 * Location: After finding targetElement, before highlighting
 *
 * Shows which input line is being synced to which preview element
 */
const debugScrollSyncMatching = () => {
    // Add after line: for (let i = 0; i < previewElements.length; i++) { ... }

    // Debug logging
    const elementText = targetElement ? targetElement.textContent.substring(0, 50) : 'none';
    console.log(`ScrollSync: Input line ${visibleLineNumber}, found element at line ${targetElement ? targetElement.dataset.line : 'none'}, text: "${elementText}"`);
};

/**
 * Add this to constructor to enable/disable debug highlighting
 * Location: In ScrollSync constructor config options
 */
const debugHighlightConfig = {
    showSyncLineHighlight: true  // Set to true to see which lines are being synced
};

/**
 * Console command to toggle sync line highlighting at runtime:
 *
 * window.scrollSync.setSyncLineHighlight(true);   // Enable
 * window.scrollSync.setSyncLineHighlight(false);  // Disable
 */


// ==============================================================================
// DEBUG CODE FOR block-processor.js
// ==============================================================================

/**
 * Add this to process() method inside the main for loop
 * Location: After calculating lineNum, before processing line content
 *
 * Shows what text the block processor sees at each line number
 */
const debugBlockProcessorLines = () => {
    // Add inside for (let i = 0; i < lines.length; i++) { ... }
    // After: const lineNum = i + 1;

    // Debug: log first 30 lines to see what's being processed
    if (i < 30 && trimmed) {
        console.log(`BlockProcessor: Line ${lineNum}: "${trimmed.substring(0, 50)}"`);
    }
};

/**
 * Add this to process() method at the beginning
 * Shows total line count being processed
 */
const debugBlockProcessorLineCount = () => {
    // Add at the start of process() method
    console.log('BlockProcessor: Total lines to process:', lines.length);
};


// ==============================================================================
// COMMON DEBUG SCENARIOS
// ==============================================================================

/**
 * Scenario 1: Preview is N lines ahead of input
 *
 * Check:
 * 1. Enable scroll sync debugging (add debugScrollSyncMatching)
 * 2. Enable block processor debugging (add debugBlockProcessorLines)
 * 3. Scroll in input and compare:
 *    - What input line the scroll sync thinks it's at
 *    - What text the preview element has
 *    - What line number the preview element has (data-line)
 *    - What the block processor assigned to that line
 *
 * Common causes:
 * - Shortcut processor adding/removing lines before block processor runs
 * - Word wrap causing visual lines != actual lines
 * - 0-based vs 1-based indexing mismatch
 */

/**
 * Scenario 2: Sync works at top but gets worse toward bottom
 *
 * Check:
 * 1. Are there code blocks or complex elements that span multiple lines?
 * 2. Is word wrap enabled? (Should be disabled for accurate sync)
 * 3. Are blank lines being counted correctly?
 *
 * Solution:
 * - Ensure word wrap is disabled
 * - Check that data-line attributes are being set for all elements
 * - Verify line height calculation is accurate
 */

/**
 * Scenario 3: Sync breaks when scrolling through images
 *
 * Check:
 * 1. Are images getting data-line attributes?
 * 2. Is the element matching finding the right elements?
 *
 * Solution:
 * - Ensure images have data-line attributes
 * - Use element index matching instead of pixel-based sync
 * - Add viewport padding so elements aren't cut off
 */


// ==============================================================================
// USEFUL CONSOLE COMMANDS
// ==============================================================================

/**
 * Check which elements have data-line attributes:
 *
 * document.querySelectorAll('[data-line]').forEach(el => {
 *     console.log(`Line ${el.dataset.line}: ${el.tagName} - ${el.textContent.substring(0, 50)}`);
 * });
 */

/**
 * Check if line numbers are sequential:
 *
 * const lines = Array.from(document.querySelectorAll('[data-line]'))
 *     .map(el => parseInt(el.dataset.line))
 *     .sort((a, b) => a - b);
 * console.log('Line numbers:', lines);
 * console.log('Missing lines:', lines.filter((line, i) => i > 0 && line !== lines[i-1] + 1));
 */

/**
 * Get current scroll sync state:
 *
 * console.log('Scroll sync enabled:', window.scrollSync.isEnabled());
 * console.log('Scroll sync paused:', window.scrollSync.isPaused());
 * console.log('Line offset:', window.scrollSync.lineOffset);
 */

/**
 * Force a sync:
 *
 * window.scrollSync.forceSync();
 */

/**
 * Check line height calculation:
 *
 * console.log('Line height:', window.scrollSync.getInputLineHeight());
 */


// ==============================================================================
// KNOWN ISSUES & SOLUTIONS
// ==============================================================================

/**
 * Issue: Word wrap causes line number mismatch
 *
 * Problem: Long lines wrap to multiple visual lines, making scrollTop/lineHeight
 *          calculation think it's at line 15 when actually at line 10.
 *
 * Solution: Disable word wrap in editor settings (Settings > Editor > Word Wrap)
 */

/**
 * Issue: Parser assigns wrong line numbers to elements
 *
 * Problem: Element with text from line 21 has data-line="19"
 *
 * Cause: Shortcut processor modifies text before block processor runs,
 *        potentially changing line count
 *
 * Solution: Enable block processor debugging to see what lines it's processing
 */

/**
 * Issue: Sync works but highlights are in wrong position
 *
 * Problem: Line numbers match but visual position is off
 *
 * Cause: Line height calculation might be wrong, or elements have margins/padding
 *
 * Solution: Check getInputLineHeight() returns correct value, add viewport padding
 */
