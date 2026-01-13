/**
 * Regex Documentation Content
 * Embedded documentation to avoid CORS issues with local file loading
 */

const REGEX_DOCUMENTATION_CONTENT = `# Regular Expression (Regex) Reference Guide

A comprehensive guide to using regular expressions in the Find & Replace dialog.

---

## Table of Contents

1. [Basic Syntax](#basic-syntax)
2. [Character Classes](#character-classes)
3. [Quantifiers](#quantifiers)
4. [Anchors](#anchors)
5. [Groups and Capturing](#groups-and-capturing)
6. [Lookahead and Lookbehind](#lookahead-and-lookbehind)
7. [Flags and Modifiers](#flags-and-modifiers)
8. [Practical Examples](#practical-examples)
9. [Common Patterns](#common-patterns)

---

## Basic Syntax

### Literal Characters
Match exact characters in the text.

| Pattern | Description | Example | Matches |
|---------|-------------|---------|---------|
| \`abc\` | Matches the exact sequence "abc" | \`abc\` | **abc**, **abc**def, 123**abc** |
| \`123\` | Matches the exact sequence "123" | \`123\` | **123**, abc**123**, **123**456 |
| \`hello world\` | Matches "hello world" | \`hello world\` | **hello world** |

### Special Characters
Characters with special meaning in regex.

| Character | Description | Example | Matches |
|-----------|-------------|---------|---------|
| \`.\` | Matches any single character except newline | \`a.c\` | **abc**, **a1c**, **a@c** |
| \`\\\\\` | Escapes special characters | \`\\\\.\` | Period/dot character: **.** |
| \`\\|\` | OR operator (alternation) | \`cat\\|dog\` | **cat**, **dog** |

---

## Character Classes

Match specific sets or ranges of characters.

### Predefined Classes

| Pattern | Description | Example | Matches |
|---------|-------------|---------|---------|
| \`\\d\` | Any digit (0-9) | \`\\d\\d\\d\` | **123**, **456**, **789** |
| \`\\D\` | Any non-digit | \`\\D+\` | **abc**, **XYZ**, **!!!** |
| \`\\w\` | Word character (a-z, A-Z, 0-9, _) | \`\\w+\` | **hello**, **test123**, **my_var** |
| \`\\W\` | Non-word character | \`\\W\` | Space, **!**, **@**, **#** |
| \`\\s\` | Whitespace (space, tab, newline) | \`\\s+\` | Spaces, tabs, line breaks |
| \`\\S\` | Non-whitespace | \`\\S+\` | **hello**, **123**, **@#$** |

### Custom Classes

| Pattern | Description | Example | Matches |
|---------|-------------|---------|---------|
| \`[abc]\` | Matches a, b, or c | \`[abc]\` | **a**, **b**, **c** |
| \`[a-z]\` | Any lowercase letter | \`[a-z]+\` | **hello**, **world** |
| \`[A-Z]\` | Any uppercase letter | \`[A-Z]+\` | **HELLO**, **WORLD** |
| \`[0-9]\` | Any digit (same as \\d) | \`[0-9]+\` | **123**, **456** |
| \`[a-zA-Z]\` | Any letter | \`[a-zA-Z]+\` | **Hello**, **WORLD** |
| \`[^abc]\` | NOT a, b, or c (negation) | \`[^0-9]\` | Any non-digit |
| \`[a-z0-9]\` | Lowercase letters or digits | \`[a-z0-9]+\` | **hello123**, **test** |

---

## Quantifiers

Specify how many times a pattern should match.

### Basic Quantifiers

| Pattern | Description | Example | Matches |
|---------|-------------|---------|---------|
| \`*\` | 0 or more times | \`a*\` | "", **a**, **aa**, **aaa** |
| \`+\` | 1 or more times | \`a+\` | **a**, **aa**, **aaa** (not "") |
| \`?\` | 0 or 1 time (optional) | \`colou?r\` | **color**, **colour** |
| \`{n}\` | Exactly n times | \`\\d{3}\` | **123**, **456** |
| \`{n,}\` | n or more times | \`\\d{3,}\` | **123**, **1234**, **12345** |
| \`{n,m}\` | Between n and m times | \`\\d{2,4}\` | **12**, **123**, **1234** |

### Greedy vs Lazy

| Pattern | Description | Example | Input: \`<div>Hello</div>\` |
|---------|-------------|---------|---------------------------|
| \`<.*>\` | Greedy (matches as much as possible) | \`<.*>\` | **\`<div>Hello</div>\`** (entire string) |
| \`<.*?>\` | Lazy (matches as little as possible) | \`<.*?>\` | **\`<div>\`**, **\`</div>\`** |

---

## Anchors

Match positions rather than characters.

| Pattern | Description | Example | Matches in "hello world" |
|---------|-------------|---------|--------------------------|
| \`^\` | Start of string/line | \`^hello\` | **hello** world |
| \`$\` | End of string/line | \`world$\` | hello **world** |
| \`\\b\` | Word boundary | \`\\bcat\\b\` | **cat** (not in "catch") |
| \`\\B\` | Non-word boundary | \`\\Bcat\\B\` | s**cat**ter (not "cat") |

### Examples

\`\`\`regex
^Hello        Matches "Hello" only at start of line
world$        Matches "world" only at end of line
^\\d+$         Matches lines that are only digits
\\btest\\b      Matches "test" as whole word only
\`\`\`

---

## Groups and Capturing

Group patterns together and capture matched text.

### Basic Groups

| Pattern | Description | Example | Matches |
|---------|-------------|---------|---------|
| \`(abc)\` | Capturing group | \`(abc)+\` | **abc**, **abcabc** |
| \`(?:abc)\` | Non-capturing group | \`(?:abc)+\` | **abc**, **abcabc** |
| \`\\1\` | Backreference to group 1 | \`(\\w+)\\s\\1\` | **hello hello**, **test test** |

### Example with Backreferences

\`\`\`regex
Pattern: (\\w+)\\s+\\1
Input:   "the the quick quick brown"
Matches: "the the", "quick quick"

Pattern: (\\d{3})-(\\d{4})
Input:   "Phone: 555-1234"
Matches: "555-1234" (Group 1: "555", Group 2: "1234")
\`\`\`

---

## Lookahead and Lookbehind

Match patterns based on what comes before or after, without including it in the match.

### Lookahead

| Pattern | Description | Example | Matches |
|---------|-------------|---------|---------|
| \`(?=...)\` | Positive lookahead | \`\\d+(?=px)\` | **100** in "100px" |
| \`(?!...)\` | Negative lookahead | \`\\d+(?!px)\` | **100** in "100em" |

### Lookbehind

| Pattern | Description | Example | Matches |
|---------|-------------|---------|---------|
| \`(?<=...)\` | Positive lookbehind | \`(?<=\\$)\\d+\` | **100** in "$100" |
| \`(?<!...)\` | Negative lookbehind | \`(?<!\\$)\\d+\` | **100** in "€100" |

### Examples

\`\`\`regex
Pattern: \\d+(?=px)
Input:   "width: 100px, height: 50em"
Matches: 100 (not 50, because 50 is followed by "em")

Pattern: (?<=@)\\w+
Input:   "Email: user@example.com"
Matches: example (the word after @)
\`\`\`

---

## Flags and Modifiers

Control how regex patterns match.

| Flag | Name | Description | How to Use in Find Dialog |
|------|------|-------------|---------------------------|
| \`g\` | Global | Find all matches (not just first) | Always enabled |
| \`i\` | Case-insensitive | Ignore case | Uncheck "Case sensitive (Aa)" |
| \`m\` | Multiline | ^ and $ match line breaks | N/A (single-line mode) |

**Note:** In this editor's Find & Replace dialog:
- Global search (\`g\` flag) is always enabled
- Case sensitivity is controlled by the "Case sensitive (Aa)" checkbox
- Use \`\\n\` to match newline characters

---

## Practical Examples

### Email Addresses

\`\`\`regex
Pattern: \\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z]{2,}\\b

Matches:
✓ user@example.com
✓ john.doe@company.co.uk
✓ test_email123@domain.org

Does NOT match:
✗ @example.com (no username)
✗ user@.com (no domain)
✗ user@domain (no TLD)
\`\`\`

### Phone Numbers

\`\`\`regex
# US Format: (555) 123-4567
Pattern: \\(\\d{3}\\)\\s?\\d{3}-\\d{4}

# International: +1-555-123-4567
Pattern: \\+\\d{1,3}-\\d{3}-\\d{3}-\\d{4}

# Flexible: Match various formats
Pattern: \\d{3}[-.\\s]?\\d{3}[-.\\s]?\\d{4}

Matches:
✓ 555-123-4567
✓ 555.123.4567
✓ 555 123 4567
✓ 5551234567
\`\`\`

### URLs

\`\`\`regex
Pattern: https?://[^\\s]+

Matches:
✓ http://example.com
✓ https://www.example.com/path
✓ http://example.com?query=value

Pattern: https?://(?:www\\.)?[\\w.-]+\\.[a-z]{2,}

Matches:
✓ http://example.com
✓ https://www.example.com
✓ http://sub.domain.example.com
\`\`\`

### IP Addresses

\`\`\`regex
# Simple version
Pattern: \\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}

# More strict (validates 0-255)
Pattern: \\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b

Matches:
✓ 192.168.1.1
✓ 10.0.0.1
✓ 255.255.255.255

Does NOT match:
✗ 256.1.1.1 (too large)
✗ 192.168.1 (incomplete)
\`\`\`

### Dates

\`\`\`regex
# MM/DD/YYYY
Pattern: \\d{2}/\\d{2}/\\d{4}

# YYYY-MM-DD
Pattern: \\d{4}-\\d{2}-\\d{2}

# Flexible: MM/DD/YYYY or M/D/YYYY
Pattern: \\d{1,2}/\\d{1,2}/\\d{4}

Matches:
✓ 01/15/2024
✓ 12/31/2023
✓ 1/5/2024
\`\`\`

### Hexadecimal Colors

\`\`\`regex
Pattern: #[0-9A-Fa-f]{6}\\b

Matches:
✓ #FF5733
✓ #00ff00
✓ #123ABC

Pattern: #[0-9A-Fa-f]{3,6}\\b

Matches (includes short form):
✓ #FFF
✓ #000
✓ #FF5733
\`\`\`

---

## Common Patterns

### Text Manipulation

| Task | Pattern | Replacement | Example |
|------|---------|-------------|---------|
| Remove extra spaces | \`\\s+\` | \` \` (single space) | "hello  world" → "hello world" |
| Remove leading spaces | \`^\\s+\` | (empty) | "  text" → "text" |
| Remove trailing spaces | \`\\s+$\` | (empty) | "text  " → "text" |
| Remove all spaces | \`\\s\` | (empty) | "hello world" → "helloworld" |

### Finding Code Patterns

\`\`\`regex
# Find TODO comments
Pattern: //\\s*TODO:.*

# Find function definitions (simple)
Pattern: function\\s+\\w+\\s*\\(

# Find CSS colors
Pattern: #[0-9A-Fa-f]{3,6}

# Find HTML tags
Pattern: <[^>]+>

# Find variables (camelCase)
Pattern: \\b[a-z][a-zA-Z0-9]*\\b

# Find variables (snake_case)
Pattern: \\b[a-z][a-z0-9_]*\\b

# Find CONSTANTS (UPPER_CASE)
Pattern: \\b[A-Z][A-Z0-9_]*\\b
\`\`\`

### Validation Patterns

\`\`\`regex
# Username (alphanumeric, 3-16 chars)
Pattern: ^[a-zA-Z0-9_]{3,16}$

# Strong password (min 8 chars, with upper, lower, digit, special)
Pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$

# Alphanumeric only
Pattern: ^[a-zA-Z0-9]+$

# Letters and spaces only
Pattern: ^[a-zA-Z\\s]+$

# Positive integers
Pattern: ^\\d+$

# Decimal numbers
Pattern: ^\\d+\\.?\\d*$
\`\`\`

---

## Tips and Best Practices

### 1. Escaping Special Characters
If you need to match literal special characters, escape them with backslash \`\\\\\`:

\`\`\`regex
\\. matches a period
\\? matches a question mark
\\* matches an asterisk
\\+ matches a plus sign
\\( matches opening parenthesis
\\) matches closing parenthesis
\\[ matches opening bracket
\\] matches closing bracket
\\{ matches opening brace
\\} matches closing brace
\\\\ matches a backslash
\`\`\`

### 2. Testing Your Patterns
- Start simple and build complexity gradually
- Test edge cases and unexpected input
- Use the match counter to verify you're finding what you expect

### 3. Performance Considerations
- Avoid excessive backtracking with nested quantifiers
- Use non-capturing groups \`(?:...)\` when you don't need to capture
- Be specific rather than overly general (e.g., use \`\\d\` instead of \`.\` when matching digits)

### 4. Common Mistakes

❌ **Too greedy:**
\`\`\`regex
Pattern: <.*>
Input:   <div>Hello</div>
Matches: <div>Hello</div> (entire string, not just tags)
\`\`\`

✓ **Use lazy quantifier:**
\`\`\`regex
Pattern: <.*?>
Input:   <div>Hello</div>
Matches: <div>, </div> (individual tags)
\`\`\`

❌ **Forgetting to escape special characters:**
\`\`\`regex
Pattern: test.js
Matches: test.js, testXjs (. matches any character)
\`\`\`

✓ **Escape the period:**
\`\`\`regex
Pattern: test\\.js
Matches: test.js only
\`\`\`

### 5. Whole Word Option
When "Whole word (Ab|)" is enabled:
- Your regex pattern will only match if surrounded by word boundaries
- Useful for finding exact variable names without partial matches
- Example: \`h\\d\\d\` with whole word finds "h12" but not "h1" in "h123"

---

## Quick Reference Card

### Most Common Patterns

| Need to Match | Pattern | Example |
|---------------|---------|---------|
| Any digit | \`\\d\` | 0-9 |
| Any letter | \`[a-zA-Z]\` | a-z, A-Z |
| Any word char | \`\\w\` | a-z, A-Z, 0-9, _ |
| Any whitespace | \`\\s\` | space, tab, newline |
| Anything | \`.\` | any character |
| Optional | \`?\` | 0 or 1 time |
| One or more | \`+\` | 1+ times |
| Zero or more | \`*\` | 0+ times |
| Exactly n times | \`{n}\` | n times |
| Word boundary | \`\\b\` | edge of word |
| Start of line | \`^\` | beginning |
| End of line | \`$\` | end |
| OR | \`\\|\` | this or that |

---

## Additional Resources

### Online Tools for Testing
- regex101.com - Interactive regex tester with explanation
- regexr.com - Visual regex tester
- regexpal.com - Simple online regex validator

### Learning Resources
- Regular-Expressions.info - Comprehensive tutorial
- MDN Web Docs - JavaScript RegExp reference
- RegexOne.com - Interactive regex lessons

---

**Remember:** Regular expressions are powerful but can be complex. Start simple, test often, and build up to more complex patterns as you become comfortable with the basics.

---

*This documentation is for reference within the Markdown Editor's Find & Replace feature.*
`;

// Make it available globally
if (typeof window !== 'undefined') {
    window.REGEX_DOCUMENTATION_CONTENT = REGEX_DOCUMENTATION_CONTENT;
}
