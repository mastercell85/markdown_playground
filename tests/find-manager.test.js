/**
 * FindManager Unit Tests
 * Comprehensive test suite for find and replace functionality
 *
 * Test Coverage:
 * - Basic find functionality
 * - Case sensitivity
 * - Whole word matching
 * - Regular expression support
 * - Replace functionality
 * - Replace All functionality
 * - Match counting
 * - Edge cases
 */

class FindManagerTests {
    constructor() {
        this.testResults = [];
        this.passCount = 0;
        this.failCount = 0;
    }

    /**
     * Create a mock textarea element for testing
     */
    createMockTextarea(content) {
        const textarea = document.createElement('textarea');
        textarea.id = 'test-textarea';
        textarea.value = content;
        return textarea;
    }

    /**
     * Create a mock find manager instance
     */
    createMockFindManager(textareaContent) {
        // Create mock DOM elements
        const textarea = this.createMockTextarea(textareaContent);
        document.body.appendChild(textarea);

        // Create mock dialog
        const dialog = document.createElement('div');
        dialog.id = 'test-dialog';
        dialog.style.display = 'none';

        const header = document.createElement('div');
        header.className = 'find-replace-header';
        dialog.appendChild(header);

        const findInput = document.createElement('input');
        findInput.id = 'test-find-input';
        dialog.appendChild(findInput);

        const replaceInput = document.createElement('input');
        replaceInput.id = 'test-replace-input';
        dialog.appendChild(replaceInput);

        const matchCounter = document.createElement('span');
        matchCounter.id = 'test-match-counter';
        dialog.appendChild(matchCounter);

        document.body.appendChild(dialog);

        // Create FindManager instance
        const findManager = new FindManager({
            textareaSelector: '#test-textarea',
            dialogSelector: '#test-dialog'
        });

        // Override element IDs for testing
        findManager.init();
        findManager.findInput = findInput;
        findManager.replaceInput = replaceInput;
        findManager.matchCounter = matchCounter;

        return { findManager, textarea, dialog, findInput, replaceInput, matchCounter };
    }

    /**
     * Clean up mock elements
     */
    cleanup() {
        const textarea = document.getElementById('test-textarea');
        const dialog = document.getElementById('test-dialog');
        if (textarea) textarea.remove();
        if (dialog) dialog.remove();
    }

    /**
     * Assert helper
     */
    assert(condition, testName, expected, actual) {
        if (condition) {
            this.passCount++;
            this.testResults.push({
                status: 'PASS',
                name: testName,
                expected,
                actual
            });
            console.log(`✓ PASS: ${testName}`);
        } else {
            this.failCount++;
            this.testResults.push({
                status: 'FAIL',
                name: testName,
                expected,
                actual
            });
            console.error(`✗ FAIL: ${testName}`);
            console.error(`  Expected: ${expected}`);
            console.error(`  Actual: ${actual}`);
        }
    }

    /**
     * Test 1: Basic find functionality
     */
    testBasicFind() {
        console.log('\n--- Test 1: Basic Find ---');
        const { findManager, findInput } = this.createMockFindManager(
            'The quick brown fox jumps over the lazy dog. The fox is quick.'
        );

        findInput.value = 'fox';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 2,
            'Basic find: Should find 2 occurrences of "fox"',
            2,
            findManager.matches.length
        );

        this.assert(
            findManager.matches[0].start === 16,
            'Basic find: First match starts at position 16',
            16,
            findManager.matches[0].start
        );

        this.assert(
            findManager.matches[1].start === 49,
            'Basic find: Second match starts at position 49',
            49,
            findManager.matches[1].start
        );

        this.cleanup();
    }

    /**
     * Test 2: Case sensitivity
     */
    testCaseSensitivity() {
        console.log('\n--- Test 2: Case Sensitivity ---');
        const { findManager, findInput } = this.createMockFindManager(
            'Test test TEST tEsT testing'
        );

        // Case insensitive (default)
        findManager.caseSensitive = false;
        findInput.value = 'test';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 5,
            'Case insensitive: Should find 5 matches (including "testing")',
            5,
            findManager.matches.length
        );

        // Case sensitive
        this.cleanup();
        const { findManager: fm2, findInput: fi2 } = this.createMockFindManager(
            'Test test TEST tEsT testing'
        );

        fm2.caseSensitive = true;
        fi2.value = 'test';
        fm2.findAll();

        this.assert(
            fm2.matches.length === 2,
            'Case sensitive: Should find 2 exact matches of "test"',
            2,
            fm2.matches.length
        );

        this.cleanup();
    }

    /**
     * Test 3: Whole word matching
     */
    testWholeWord() {
        console.log('\n--- Test 3: Whole Word Matching ---');
        const { findManager, findInput } = this.createMockFindManager(
            'test testing fastest protest test'
        );

        // Without whole word
        findManager.wholeWord = false;
        findInput.value = 'test';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 5,
            'Without whole word: Should find 5 occurrences (partial matches)',
            5,
            findManager.matches.length
        );

        // With whole word
        this.cleanup();
        const { findManager: fm2, findInput: fi2 } = this.createMockFindManager(
            'test testing fastest protest test'
        );

        fm2.wholeWord = true;
        fi2.value = 'test';
        fm2.findAll();

        this.assert(
            fm2.matches.length === 2,
            'With whole word: Should find 2 complete word matches',
            2,
            fm2.matches.length
        );

        this.assert(
            fm2.matches[0].start === 0,
            'With whole word: First match at position 0',
            0,
            fm2.matches[0].start
        );

        this.assert(
            fm2.matches[1].start === 31,
            'With whole word: Second match at position 31',
            31,
            fm2.matches[1].start
        );

        this.cleanup();
    }

    /**
     * Test 4: Regular expression support
     */
    testRegex() {
        console.log('\n--- Test 4: Regular Expression ---');
        const { findManager, findInput } = this.createMockFindManager(
            'h1 h2 h3 h4 h5 h6 hello h123'
        );

        // Test regex pattern h\d (h followed by single digit)
        findManager.useRegex = true;
        findInput.value = 'h\\d';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 7,
            'Regex h\\d: Should find 7 matches (h1-h6 + h1 from h123)',
            7,
            findManager.matches.length
        );

        // Test regex pattern h\d$ (h followed by digit at word boundary)
        this.cleanup();
        const { findManager: fm2, findInput: fi2 } = this.createMockFindManager(
            'h1 h2 h3 h4 h5 h6 hello h123'
        );

        fm2.useRegex = true;
        fi2.value = 'h\\d+';
        fm2.findAll();

        this.assert(
            fm2.matches.length === 7,
            'Regex h\\d+: Should find 7 matches',
            7,
            fm2.matches.length
        );

        // Test email regex pattern
        this.cleanup();
        const { findManager: fm3, findInput: fi3 } = this.createMockFindManager(
            'Contact us at test@example.com or support@test.org for help'
        );

        fm3.useRegex = true;
        fi3.value = '\\w+@\\w+\\.\\w+';
        fm3.findAll();

        this.assert(
            fm3.matches.length === 2,
            'Regex email pattern: Should find 2 email addresses',
            2,
            fm3.matches.length
        );

        this.cleanup();
    }

    /**
     * Test 5: Replace functionality
     */
    testReplace() {
        console.log('\n--- Test 5: Replace Functionality ---');
        const { findManager, findInput, replaceInput, textarea } = this.createMockFindManager(
            'The quick brown fox jumps over the lazy fox'
        );

        findInput.value = 'fox';
        replaceInput.value = 'cat';
        findManager.findAll();

        // Replace first occurrence
        findManager.replaceCurrent();

        this.assert(
            textarea.value === 'The quick brown cat jumps over the lazy fox',
            'Replace first: Should replace first "fox" with "cat"',
            'The quick brown cat jumps over the lazy fox',
            textarea.value
        );

        // After replace, matches should be updated
        this.assert(
            findManager.matches.length === 1,
            'Replace first: Should have 1 match remaining',
            1,
            findManager.matches.length
        );

        this.cleanup();
    }

    /**
     * Test 6: Replace All functionality
     */
    testReplaceAll() {
        console.log('\n--- Test 6: Replace All Functionality ---');
        const { findManager, findInput, replaceInput, textarea } = this.createMockFindManager(
            'The fox jumps over the fox. The fox is quick.'
        );

        findInput.value = 'fox';
        replaceInput.value = 'cat';
        findManager.findAll();

        const initialMatches = findManager.matches.length;
        this.assert(
            initialMatches === 3,
            'Replace all: Should find 3 occurrences before replace',
            3,
            initialMatches
        );

        // Replace all occurrences
        findManager.replaceAll();

        this.assert(
            textarea.value === 'The cat jumps over the cat. The cat is quick.',
            'Replace all: Should replace all "fox" with "cat"',
            'The cat jumps over the cat. The cat is quick.',
            textarea.value
        );

        this.assert(
            findManager.matches.length === 0,
            'Replace all: Should have 0 matches after replace all',
            0,
            findManager.matches.length
        );

        this.cleanup();
    }

    /**
     * Test 7: Match counter accuracy
     */
    testMatchCounter() {
        console.log('\n--- Test 7: Match Counter Accuracy ---');
        const { findManager, findInput, matchCounter } = this.createMockFindManager(
            'test test test test test'
        );

        findInput.value = 'test';
        findManager.findAll();

        this.assert(
            matchCounter.textContent === '1 of 5',
            'Match counter: Should show "1 of 5"',
            '1 of 5',
            matchCounter.textContent
        );

        // Navigate to next match
        findManager.findNext();
        findManager.updateMatchCounter();

        this.assert(
            matchCounter.textContent === '2 of 5',
            'Match counter after next: Should show "2 of 5"',
            '2 of 5',
            matchCounter.textContent
        );

        this.cleanup();
    }

    /**
     * Test 8: Edge cases - empty search
     */
    testEmptySearch() {
        console.log('\n--- Test 8: Edge Case - Empty Search ---');
        const { findManager, findInput } = this.createMockFindManager(
            'Some text content'
        );

        findInput.value = '';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 0,
            'Empty search: Should find 0 matches',
            0,
            findManager.matches.length
        );

        this.cleanup();
    }

    /**
     * Test 9: Edge cases - no matches
     */
    testNoMatches() {
        console.log('\n--- Test 9: Edge Case - No Matches ---');
        const { findManager, findInput, matchCounter } = this.createMockFindManager(
            'The quick brown fox'
        );

        findInput.value = 'zebra';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 0,
            'No matches: Should find 0 matches',
            0,
            findManager.matches.length
        );

        this.assert(
            matchCounter.textContent === 'No results',
            'No matches counter: Should show "No results"',
            'No results',
            matchCounter.textContent
        );

        this.cleanup();
    }

    /**
     * Test 10: Edge cases - special characters
     */
    testSpecialCharacters() {
        console.log('\n--- Test 10: Special Characters ---');
        const { findManager, findInput } = this.createMockFindManager(
            'Price: $100. Discount: $50. Total: $150.'
        );

        findInput.value = '$';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 3,
            'Special chars: Should find 3 occurrences of "$"',
            3,
            findManager.matches.length
        );

        this.cleanup();
    }

    /**
     * Test 11: Combining case sensitivity and whole word
     */
    testCombinedOptions() {
        console.log('\n--- Test 11: Combined Options (Case + Whole Word) ---');
        const { findManager, findInput } = this.createMockFindManager(
            'Test test testing TEST tester test'
        );

        findManager.caseSensitive = true;
        findManager.wholeWord = true;
        findInput.value = 'test';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 2,
            'Case sensitive + whole word: Should find 2 exact matches',
            2,
            findManager.matches.length
        );

        this.cleanup();
    }

    /**
     * Test 12: Replace with regex
     */
    testRegexReplace() {
        console.log('\n--- Test 12: Regex Replace ---');
        const { findManager, findInput, replaceInput, textarea } = this.createMockFindManager(
            'h1 Header\nh2 Subheader\nh3 Section'
        );

        findManager.useRegex = true;
        findInput.value = 'h\\d';
        replaceInput.value = '##';
        findManager.findAll();

        findManager.replaceAll();

        this.assert(
            textarea.value === '## Header\n## Subheader\n## Section',
            'Regex replace all: Should replace h1, h2, h3 with ##',
            '## Header\n## Subheader\n## Section',
            textarea.value
        );

        this.cleanup();
    }

    /**
     * Test 13: Match cycling (wrap around)
     */
    testMatchCycling() {
        console.log('\n--- Test 13: Match Cycling ---');
        const { findManager, findInput } = this.createMockFindManager(
            'one two three'
        );

        findInput.value = 'e';
        findManager.findAll();

        this.assert(
            findManager.matches.length === 3,
            'Match cycling: Should find 3 occurrences of "e"',
            3,
            findManager.matches.length
        );

        // Navigate through all matches and wrap around
        findManager.currentMatchIndex = 2; // Last match
        findManager.currentMatchVisited = true;
        findManager.findNext();

        this.assert(
            findManager.currentMatchIndex === 0,
            'Match cycling: Should wrap to first match (index 0)',
            0,
            findManager.currentMatchIndex
        );

        this.cleanup();
    }

    /**
     * Test 14: Invalid regex handling
     */
    testInvalidRegex() {
        console.log('\n--- Test 14: Invalid Regex Handling ---');
        const { findManager, findInput } = this.createMockFindManager(
            'Some text content'
        );

        findManager.useRegex = true;
        findInput.value = '[invalid(regex'; // Invalid regex pattern
        findManager.findAll();

        this.assert(
            findManager.matches.length === 0,
            'Invalid regex: Should gracefully handle with 0 matches',
            0,
            findManager.matches.length
        );

        this.cleanup();
    }

    /**
     * Test 15: Overlapping matches
     */
    testOverlappingMatches() {
        console.log('\n--- Test 15: Overlapping Matches ---');
        const { findManager, findInput } = this.createMockFindManager(
            'aaa bbb ccc'
        );

        findInput.value = 'aa';
        findManager.findAll();

        // Should find 2 non-overlapping matches in 'aaa'
        this.assert(
            findManager.matches.length === 2,
            'Overlapping: Should find 2 non-overlapping matches in "aaa"',
            2,
            findManager.matches.length
        );

        this.cleanup();
    }

    /**
     * Run all tests
     */
    runAllTests() {
        console.clear();
        console.log('═══════════════════════════════════════════════════════');
        console.log('         FindManager Unit Test Suite');
        console.log('═══════════════════════════════════════════════════════\n');

        this.testBasicFind();
        this.testCaseSensitivity();
        this.testWholeWord();
        this.testRegex();
        this.testReplace();
        this.testReplaceAll();
        this.testMatchCounter();
        this.testEmptySearch();
        this.testNoMatches();
        this.testSpecialCharacters();
        this.testCombinedOptions();
        this.testRegexReplace();
        this.testMatchCycling();
        this.testInvalidRegex();
        this.testOverlappingMatches();

        this.printSummary();
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('                  TEST SUMMARY');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`Total Tests: ${this.passCount + this.failCount}`);
        console.log(`✓ Passed: ${this.passCount}`);
        console.log(`✗ Failed: ${this.failCount}`);
        console.log(`Success Rate: ${((this.passCount / (this.passCount + this.failCount)) * 100).toFixed(2)}%`);
        console.log('═══════════════════════════════════════════════════════\n');

        if (this.failCount > 0) {
            console.log('Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => {
                    console.log(`  ✗ ${r.name}`);
                    console.log(`    Expected: ${r.expected}`);
                    console.log(`    Actual: ${r.actual}`);
                });
        }

        return {
            total: this.passCount + this.failCount,
            passed: this.passCount,
            failed: this.failCount,
            results: this.testResults
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FindManagerTests;
}
