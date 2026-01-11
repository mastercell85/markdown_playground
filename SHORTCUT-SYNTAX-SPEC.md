# Markdown Shortcut Syntax Specification

This document defines all supported shortcut syntaxes for the markdown editor.

## 1. Headers (H1-H6)

### Standard Markdown
```
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header
```

### Shorthand (h1-h6)
```
h1: H1 Header
h2: H2 Header
h3: H3 Header
h4: H4 Header
h5: H5 Header
h6: H6 Header
```

### Full Word (heading1-heading6)
```
heading1: H1 Header
heading2: H2 Header
heading3: H3 Header
heading4: H4 Header
heading5: H5 Header
heading6: H6 Header
```

### HTML-like
```
<h1>H1 Header</h1>
<h2>H2 Header</h2>
<h3>H3 Header</h3>
<h4>H4 Header</h4>
<h5>H5 Header</h5>
<h6>H6 Header</h6>
```

### BBCode-style
```
[h1]H1 Header[/h1]
[h2]H2 Header[/h2]
[h3]H3 Header[/h3]
[h4]H4 Header[/h4]
[h5]H5 Header[/h5]
[h6]H6 Header[/h6]
```

### Semantic Aliases
```
title: Main Title        → H1
subtitle: Subtitle       → H2
section: Section Name    → H3
subsection: Subsection   → H4
```

---

## 2. Text Formatting

### Bold

```
**bold text**                  (standard markdown)
__bold text__                  (standard markdown alt)
<b>bold text</b>               (HTML-like)
[b]bold text[/b]               (BBCode-style)
:b:bold text:b:                (colon wrap short)
:bold:bold text:bold:          (colon wrap full)
b{bold text}                   (brace wrap)
```

### Italic

```
*italic text*                  (standard markdown)
_italic text_                  (standard markdown alt)
<i>italic text</i>             (HTML-like)
[i]italic text[/i]             (BBCode-style)
:i:italic text:i:              (colon wrap short)
:italic:italic text:italic:    (colon wrap full)
i{italic text}                 (brace wrap)
```

### Strikethrough

```
~~strike text~~                (standard markdown)
<s>strike text</s>             (HTML-like)
[s]strike text[/s]             (BBCode-style)
:s:strike text:s:              (colon wrap short)
:strike:strike text:strike:    (colon wrap full)
s{strike text}                 (brace wrap)
```

### Bold + Italic

```
***text***                     (standard markdown)
___text___                     (standard markdown alt)
<bi>text</bi>                  (HTML-like)
[bi]text[/bi]                  (BBCode-style)
:bi:text:bi:                   (colon wrap short)
bi{text}                       (brace wrap)
```

---

## 3. Links

### Standard Markdown
```
[link text](https://url.com)
```

### Shorthand
```
link: https://url.com                   (auto link - URL as text)
link: Click here | https://url.com      (custom text with pipe separator)
```

### HTML-like
```
<link>https://url.com</link>                     (auto link)
<link href="https://url.com">Click here</link>   (with custom text)
```

### BBCode
```
[url]https://url.com[/url]                       (auto link)
[url=https://url.com]Click here[/url]            (with custom text)
```

---

## 4. Images

### Standard Markdown
```
![alt text](image-url.jpg)
```

### Shorthand
```
img: image-url.jpg                      (simple image)
img: Alt text | image-url.jpg           (with alt text and pipe separator)
```

### HTML-like
```
<img>image-url.jpg</img>                (simple)
<img src="image-url.jpg" alt="Alt text" />  (full HTML)
```

### BBCode
```
[img]image-url.jpg[/img]                (simple)
[img=image-url.jpg]Alt text[/img]       (with alt text)
```

---

## 5. Code

### Inline Code

```
`inline code`                  (standard markdown)
<code>inline code</code>       (HTML-like)
[code]inline code[/code]       (BBCode)
:code:inline code:code:        (colon wrap)
c{inline code}                 (brace wrap)
```

### Code Blocks

**Standard Markdown:**
```
```javascript
code here
```
```

**Shorthand with Language:**
```
code: javascript
code here
endcode:
```

**Shorthand without Language:**
```
code:
code here
endcode:
```

**HTML-like:**
```
<code language="javascript">
code here
</code>
```

**BBCode with Language:**
```
[code=javascript]
code here
[/code]
```

**BBCode without Language:**
```
[code]
code here
[/code]
```

---

## 6. Lists

### Unordered Lists

```
- Item                         (standard markdown)
* Item                         (standard markdown)
+ Item                         (standard markdown)
ul: Item                       (shorthand)
list: Item                     (shorthand alt)
• Item                         (bullet character - Alt+0149 on Windows, Option+8 on Mac)
```

### Ordered Lists

```
1. Item                        (standard markdown)
2. Item
ol: Item                       (shorthand - auto-numbered)
#. Item                        (auto-number alt)
```

### Task Lists

```
- [ ] Unchecked task           (standard markdown)
- [x] Checked task             (standard markdown)
task: Task item                (unchecked shorthand)
task: x Task item              (checked shorthand)
todo: Task item                (unchecked alt)
done: Task item                (checked alt)
[task] Task item               (BBCode unchecked)
[done] Task item               (BBCode checked)
```

---

## 7. Blockquotes

```
> Quote text                   (standard markdown)
quote: Quote text              (shorthand)
bq: Quote text                 (shorthand alt)
<blockquote>Quote text</blockquote>  (HTML-like)
[quote]Quote text[/quote]      (BBCode)
```

---

## 8. Horizontal Rules

```
---                            (standard markdown)
***                            (standard markdown)
___                            (standard markdown)
hr:                            (shorthand)
divider:                       (shorthand alt)
<hr>                           (HTML-like)
[hr]                           (BBCode)
```

---

## 9. Tables

**Standard Markdown Only:**
```
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

---

## Future Features

### Inline Formatters (To Be Implemented)

These will allow dynamic formatting switches that persist until changed:

```
font: Arial                    (change font family)
fontsize: 16px                 (change font size)
fontcolor: #ff0000            (change text color)
fontweight: bold              (change font weight)
color: red                    (text color alias)
bgcolor: yellow               (background color)
align: center                 (text alignment)
indent: 2                     (indentation level)
spacing: 1.5                  (line spacing)
```

**Example usage:**
```
This is normal text.
font: Courier New
This text is now in Courier New.
fontsize: 18px
This is Courier New at 18px.
font: default
Back to normal font.
```

### Math Equations (To Be Implemented Later)

```
$inline math$                  (inline LaTeX)
$$display math$$               (block LaTeX)
```

---

## Implementation Notes

1. **Processing Order:**
   - Block-level elements first (headers, code blocks, lists, tables, blockquotes, HR)
   - Then inline elements (bold, italic, links, images, inline code)
   - Code blocks and math (when implemented) are protected from inline processing

2. **Conflict Resolution:**
   - More specific patterns are processed before general ones
   - Standard markdown always takes precedence
   - Shortcuts are processed after standard syntax fails to match

3. **Escape Sequences:**
   - Use backslash `\` to escape any shortcut syntax if needed
   - Example: `\h1: This is not a header` → displays literally

4. **Case Sensitivity:**
   - Keywords are case-insensitive: `h1:`, `H1:`, and `H1:` all work
   - Content preserves original case

---

## Design Principles

1. **Maximum Flexibility:** Support multiple syntax styles to accommodate different user preferences
2. **Backward Compatibility:** All standard markdown syntax remains fully supported
3. **Discoverability:** Similar patterns across features (`:keyword:` pattern, `keyword:` pattern)
4. **No Breaking Changes:** Shortcuts never interfere with standard markdown
5. **Extensibility:** Easy to add new shortcuts and formatters in the future
