# Markdown Feature Test Document

This document tests all supported markdown features.

## Headers

# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

## Text Formatting

**Bold text** and __also bold__

*Italic text* and _also italic_

***Bold and italic*** and ___also bold and italic___

~~Strikethrough text~~

## Links and Images

[This is a link](https://example.com)

![Alt text for image](https://via.placeholder.com/150)

## Code

Inline `code` looks like this.

### Code Blocks

```javascript
function hello() {
    console.log("Hello, World!");
    return true;
}
```

```python
def greet(name):
    print(f"Hello, {name}!")
    return name
```

```
Plain code block without language
Multiple lines
Work fine
```

## Lists

### Unordered Lists

- Item 1
- Item 2
- Item 3

* Also works with asterisks
* Item 2
* Item 3

+ And plus signs
+ Item 2
+ Item 3

### Ordered Lists

1. First item
2. Second item
3. Third item

### Task Lists

- [ ] Unchecked task
- [x] Checked task
- [ ] Another unchecked task
- [X] Another checked task (capital X)

## Blockquotes

> This is a blockquote.
> It can span multiple lines.
> And continues here.

## Horizontal Rules

---

***

___

## Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
| Cell 7   | Cell 8   | Cell 9   |

## Mixed Content

You can have **bold text** with `inline code` and [links](https://example.com) in the same paragraph.

Even ~~strikethrough~~ works with ***bold italic*** text.

## Complex Example

### Project Requirements

- [x] Fix code blocks
- [x] Add tables
- [x] Add strikethrough
- [x] Add horizontal rules
- [x] Add images
- [x] Add task lists

**Status:** All features implemented! ~~In progress~~ Complete.

---

### Code Example with Explanation

```javascript
// This is a comment
const markdown = {
    bold: '**text**',
    italic: '*text*',
    code: '`code`'
};
```

The above code shows how to format markdown syntax.

---

**End of test document**
