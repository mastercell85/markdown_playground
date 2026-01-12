# Markdown Editor - Project Documentation

A feature-rich, modular markdown editor with live preview, multiple themes, and extensible tab menu styles.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Tab Menu System](#tab-menu-system)
6. [Theme System](#theme-system)
7. [Shortcut Syntax](#shortcut-syntax)
8. [Adding New Features](#adding-new-features)

---

## Overview

This markdown editor provides:
- Live preview with split-view layout
- Multiple document tabs with auto-save
- Swappable tab menu styles (Steel, Classic, extensible)
- Theme support (Default, Cyberpunk, LCARS, custom CSS)
- Extended shortcut syntax (5-7 variations per markdown feature)
- External preview window support

---

## Project Structure

```
Website playground/
├── assets/                     # Images and SVG decorations
│   ├── hook1.svg, hook2.svg, hook3.svg    # Steel menu hooks
│   ├── layer.svg, layer-middle.svg        # Panel backgrounds
│   ├── layer-frame.svg                    # Panel frames
│   ├── sample-photo.jpg                   # Help panel sample image
│   └── bg.png, bg1.svg, bg2.svg           # Backgrounds
│
├── css/
│   ├── markdown-editor-base.css           # Base editor styles (CSS variables)
│   ├── markdown-editor.css                # Editor-specific styles
│   ├── 219*.css                           # CSS Zen Garden theme files
│   └── tab-menus/                         # Tab menu styles
│       ├── tab-menu-steel.css             # Steel frame design
│       └── tab-menu-classic.css           # Classic dropdown design
│
├── js/
│   ├── markdown-editor-main.js            # Main application orchestrator
│   ├── index-main.js                      # Home page scripts
│   ├── shared/                            # Shared modules
│   │   ├── panel-manager.js               # Tab/panel switching
│   │   ├── resizable-pane.js              # Draggable divider
│   │   └── scroll-sync.js                 # Bidirectional scroll synchronization
│   ├── markdown/                          # Markdown processing
│   │   ├── markdown-parser.js             # Parser orchestrator
│   │   ├── rule-engine.js                 # Standard markdown rules
│   │   ├── block-processor.js             # Block-level processing
│   │   ├── shortcut-processor.js          # Custom syntax conversion
│   │   ├── markdown-renderer.js           # HTML rendering
│   │   ├── document.js                    # Document class
│   │   ├── document-manager.js            # Multi-document management
│   │   ├── tab-controller.js              # Document tabs UI
│   │   ├── window-manager.js              # External window handling
│   │   └── theme-loader.js                # Theme loading system
│   └── tab-menus/                         # Tab menu scripts
│       ├── tab-menu-steel.js              # Steel menu features
│       └── tab-menu-classic.js            # Classic menu features
│
├── themes/                                # Custom themes
│   ├── cyberpunk.css, cyberpunk-theme-v2.css
│   └── lcars-theme.css, lcars-theme-v2.css
│
├── index.html                             # Home page
├── markdown-editor.html                   # Main editor
└── typora-window.html                     # External preview window
```

---

## Features

### Core Markdown Support
- Headers (H1-H6)
- Text formatting (bold, italic, strikethrough)
- Links and images
- Code blocks with syntax highlighting
- Lists (ordered, unordered, task lists)
- Blockquotes
- Horizontal rules
- Tables

### Document Management
- Multiple document tabs
- Auto-save to localStorage (every 1 second)
- New, Open, Save, Save As operations
- Document persistence across sessions

### Layout Options
- **Split View**: Editor and preview side-by-side (equal height panels)
- **Editor Only**: Full-width editor
- **Preview Only**: Full-width preview
- Resizable divider between panes
- Input and preview panels always match in height across all themes

### View Options
- Zoom levels: 90%, 100%, 110%, 125%, 150%
- Line numbers toggle
- Word wrap toggle
- Scroll sync toggle (bidirectional sync between input and preview)
- Tab menu style switching
- Theme selection
- Collapsible sections with Expand/Collapse All toggle
- Two-column layout (Steel theme)

### External Preview
- Open preview in separate window
- Real-time sync via postMessage API

### Scroll Sync
Bidirectional synchronized scrolling between input and preview panes using row-based index synchronization.

**UI Controls:**
- Toggle button in View panel → Editor section
- Sync icon button on the resizable divider (visual on/off color states)
- Sync offset adjustment control (appears when sync is enabled)

**Architecture:**
- Managed by `ScrollSync` class in `js/shared/scroll-sync.js`
- State persisted to localStorage (`editor-scroll-sync`)
- Offset value persisted to localStorage (`editor-scroll-sync-offset`)
- Debounced scroll handlers prevent feedback loops

**Implementation:**
The scroll sync uses `data-line` attributes for accurate line-to-element mapping:

1. **Line Tracking**: `BlockProcessor` adds `data-line` attributes to rendered HTML elements during markdown parsing, enabled via `MarkdownParser.setLineTracking(true)`

2. **Input → Preview Sync**:
   - Calculates visible line number from input scroll position and line height
   - Applies configurable line offset for fine-tuning accuracy
   - Finds closest element with matching `data-line` attribute
   - Interpolates scroll position between elements when exact match not found

3. **Preview → Input Sync**:
   - Finds first visible element with `data-line` in preview viewport
   - Calculates corresponding line position in input
   - Scrolls input to matching line with visibility adjustment

4. **Fallback**: Uses percentage-based sync when no `data-line` elements exist

**Offset Adjustment:**
- Default offset: 3 lines
- Positive values = preview scrolls less (lags behind input)
- Negative values = preview scrolls more (gets ahead of input)
- Adjustable via View panel → Editor section (when sync enabled)

This approach (similar to VS Code, Joplin, etc.) provides accurate sync (~95%) regardless of content height differences between input and rendered preview.

---

## Architecture

The editor follows SOLID principles with modular components:

### Module Communication Flow
```
markdown-editor-main.js (Orchestrator)
    ├── PanelManager (panel switching)
    ├── ResizablePane (divider handling)
    ├── ScrollSync (bidirectional scroll sync)
    ├── DocumentManager (document storage)
    │   └── Document (individual docs)
    ├── TabController (tab UI)
    ├── MarkdownParser (parsing)
    │   ├── RuleEngine (standard rules)
    │   ├── BlockProcessor (blocks)
    │   └── ShortcutProcessor (shortcuts)
    ├── MarkdownRenderer (rendering)
    ├── WindowManager (external window)
    └── ThemeLoader (themes)
```

### Key Design Patterns
- **Single Responsibility**: Each module handles one concern
- **Dependency Injection**: Modules receive dependencies via config
- **Observer Pattern**: Callbacks for inter-module communication
- **Factory Pattern**: Document creation and management

---

## Tab Menu System

Tab menus are fully modular with separate CSS and JS files.

### Available Styles
| Style | Description |
|-------|-------------|
| **Steel** | Industrial frame design with SVG hooks, two-column View panel layout |
| **Classic** | Clean dropdown-style menus with single-column layout |

### File Structure
Each tab menu style has:
- `css/tab-menus/tab-menu-{name}.css` - Styling
- `js/tab-menus/tab-menu-{name}.js` - Functionality

### Adding a New Tab Menu Style

1. **Create CSS file** (`css/tab-menus/tab-menu-{name}.css`):
   - Define panel appearance, hover states, animations
   - Include Help panel accordion styles
   - Include View panel collapsible section styles
   - Include two-column layout styles (if applicable)

2. **Create JS file** (`js/tab-menus/tab-menu-{name}.js`):
   - Initialize Help panel collapsible sections
   - Initialize View panel collapsible sections
   - Handle Expand All toggles for both panels
   - Add any style-specific interactivity

3. **Register in main.js** (`TAB_MENU_STYLES` object):
```javascript
const TAB_MENU_STYLES = {
    'steel': { ... },
    'classic': { ... },
    'newstyle': {
        name: 'New Style',
        cssFile: 'css/tab-menus/tab-menu-newstyle.css',
        jsFile: 'js/tab-menus/tab-menu-newstyle.js',
        description: 'Description of your style'
    }
};
```

### Tab Menu Switching

When switching tab menu styles at runtime, the system:

1. **Loads new CSS**: Removes old stylesheet, loads new one
2. **Loads new JS**: Removes old script, loads new one with `onload` callback
3. **Re-initializes**: Calls the appropriate `init()` function after script loads
4. **Cleans up listeners**: Each tab menu JS has a `cleanupListeners()` function that clones and replaces DOM elements to remove old event listeners before attaching new ones

This ensures collapsible sections and other interactive features work correctly without requiring a page refresh.

**Required exports for tab menu JS:**
```javascript
window.YourStyleTabMenu = {
    init: initYourStyleTabMenu,
    toggleAllHelpSections: toggleAllHelpSections,
    toggleAllViewSections: toggleAllViewSections,
    updateHelpExpandAllCheckbox: updateHelpExpandAllCheckbox,
    updateViewExpandAllCheckbox: updateViewExpandAllCheckbox
};
```

---

## Theme System

### Built-in Themes
- **Default**: Clean dark theme
- **Cyberpunk**: Neon-styled with matrix effects
- **LCARS**: Star Trek inspired interface with purple L-shaped frames

### Theme Loading
Themes are managed by `theme-loader.js`:
- Stored in localStorage for persistence
- Custom CSS files can be loaded
- Themes apply to editor, preview, and panels

### LCARS Theme Structure
The LCARS theme uses a combination of CSS pseudo-elements and HTML elements for the frame:

**CSS Pseudo-elements** (fixed frame decorations):
- `::before` - Left sidebar (purple vertical bar)
- `::after` - Top bar (purple horizontal bar with rounded corner)

**HTML Elements** (header decorations in `.lcars-frame`):
```html
<div class="lcars-frame">
    <div class="lcars-header-blocks">
        <div class="lcars-block-grey"></div>
        <div class="lcars-block-orange"></div>
        <div class="lcars-title">INPUT</div>
        <div class="lcars-block-pink"></div>
    </div>
</div>
```

The frame stays fixed while content scrolls inside. Each editor pane (input and preview) has its own independent LCARS frame.

### Adding a Theme
1. Create CSS file in `themes/` folder
2. Define CSS variables or override existing styles
3. Load via "Load Custom CSS" in View menu

---

## Shortcut Syntax

The editor supports multiple syntax variations for each markdown feature:

### Headers
```
# Standard H1           →  <h1>
h1: Header Text         →  <h1>
heading1: Header Text   →  <h1>
<h1>Header Text</h1>    →  <h1>
[h1]Header Text[/h1]    →  <h1>
title: Main Title       →  <h1>
```

### Text Formatting
```
**bold** or __bold__    →  <strong>
<b>bold</b>             →  <strong>
[b]bold[/b]             →  <strong>
:b:bold:b:              →  <strong>
b{bold}                 →  <strong>
```

### Links
```
[Link text](url)              →  <a href>
link: text | url              →  <a href>
<link href="url">text</link>  →  <a href>
[url=url]text[/url]           →  <a href>
```

### Images
```
![alt](url)                    →  <img>
img: alt | url                 →  <img>
<img src="url" alt="alt" />    →  <img>
[img=url]alt[/img]             →  <img>
```

### Lists
```
- Unordered item    →  <ul><li>
ul: List item       →  <ul><li>
1. Ordered item     →  <ol><li>
ol: Numbered item   →  <ol><li>
- [ ] Task item     →  task checkbox
task: Task item     →  task checkbox
done: Completed     →  checked checkbox
```

### Blockquotes
```
> Quote text                    →  <blockquote>
quote: Quote text               →  <blockquote>
bq: Quote text                  →  <blockquote>
<blockquote>text</blockquote>   →  <blockquote>
```

### Horizontal Rules
```
---          →  <hr>
hr:          →  <hr>
divider:     →  <hr>
<hr>         →  <hr>
```

---

## Adding New Features

### Adding a Panel Button

1. Add HTML in `markdown-editor.html`:
```html
<button id="my-button" class="panel-button">Button Text</button>
```

2. Add handler in `markdown-editor-main.js`:
```javascript
const myButton = document.getElementById('my-button');
if (myButton) {
    myButton.addEventListener('click', function(event) {
        event.stopPropagation();
        handleMyFeature();
    });
}
```

### Adding a Shortcut Syntax

Edit `js/markdown/shortcut-processor.js`:
```javascript
// Add pattern to appropriate method
processMyShortcut(text) {
    return text.replace(/pattern/g, 'replacement');
}
```

### Adding a Markdown Rule

Edit `js/markdown/rule-engine.js`:
```javascript
// Add to rules array
{ pattern: /regex/, replacement: 'html' }
```

---

## Panel Structure

### Help Panel
- Collapsible accordion sections (Markdown Basics, Shortcut Syntax)
- Two-column layout showing syntax and rendered preview
- Expand/Collapse All checkbox to toggle all sections
- **Theme-aware preview**: Preview column renders using current theme styles

### Help Panel Preview System
The help panel preview (`.help-preview`) renders markdown examples in the current theme's style:

**Architecture:**
- Help preview elements have the `markdown-output` class, allowing them to inherit styles from main preview
- Base styles in `css/markdown-editor-base.css` use CSS custom properties for default styling
- Theme-specific styles (like LCARS heading decorations) are inherited from `.markdown-output` selectors
- Help preview only overrides compact sizing and removes decorative elements that are too large for the compact view

**Inheritance Model:**
The help preview inherits from main preview styles, ensuring consistency:
- Heading decorations (::before/::after bars) come from `.markdown-output h1-h6` styles
- Colors, fonts, and formatting inherit from theme's `.markdown-output` rules
- Help preview overrides only: compact margins, smaller font sizes, removed box-shadows

**CSS Custom Properties Used:**
| Property | Purpose |
|----------|---------|
| `--preview-text` | Base text color |
| `--md-heading-color` | Heading color |
| `--md-link-color` | Link color |
| `--md-link-hover` | Link hover color |
| `--md-code-bg` | Code background |
| `--md-code-text` | Code text color |
| `--md-blockquote-border` | Blockquote border |
| `--md-blockquote-text` | Blockquote text color |
| `--md-hr-color` | Horizontal rule color |

**Adding Theme Support for Help Preview:**
Since help preview inherits from `.markdown-output`, most styling is automatic. Only add overrides for compact sizing:
```css
/* Help preview inherits from .markdown-output - only override sizing */
[data-theme="yourtheme"] .help-preview h1,
[data-theme="yourtheme"] .help-preview h2,
[data-theme="yourtheme"] .help-preview h3 {
    box-shadow: none !important;  /* Remove side decorations */
    margin: 0.5rem 0 !important;  /* Compact margins */
}

/* Remove extra decorative elements for compact view */
[data-theme="yourtheme"] .help-preview h1::before,
[data-theme="yourtheme"] .help-preview h2::before,
[data-theme="yourtheme"] .help-preview h3::before {
    margin-left: 0 !important;
    box-shadow: none !important;
}

/* Compact font sizes */
[data-theme="yourtheme"] .help-preview h1 { font-size: 1.5rem !important; }
[data-theme="yourtheme"] .help-preview h2 { font-size: 1.3rem !important; }
[data-theme="yourtheme"] .help-preview h3 { font-size: 1.1rem !important; }
```

### View Panel
- Collapsible sections: Tab Menu, Theme, Layout, Editor, Zoom, External Window
- Expand/Collapse All checkbox to toggle all sections
- **Steel theme**: Two-column layout (left: Tab Menu/Theme/Layout, right: Editor/Zoom/External Window)
- **Classic theme**: Single-column layout

### Sticky Expand/Collapse All Checkbox
The "Expand/Collapse All" checkbox in Help and View panels is sticky, remaining visible at the top when scrolling through panel content.

**Implementation:**
- `.help-header-row` and `.panel-header-row` use `position: sticky`
- `top` value set negative to close gap at top of panel
- `z-index: 100` ensures scrolling content goes behind the sticky header
- Background color matches panel background to hide content scrolling underneath

**CSS Structure:**
```css
.help-header-row,
.panel-header-row {
    position: sticky;
    top: -20px;
    z-index: 100;
    background: var(--tab-dropdown-bg);
    padding: 20px 0 10px 0;
    margin-top: -20px;
}
```

**Theme Overrides:**
Each theme/tab menu style may override the background to match its styling:
- Steel menu: Uses `layer-middle.svg` background
- LCARS theme: Uses solid black (`#000`) background

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `tab-menu-style` | Selected tab menu style (steel/classic) |
| `current-theme` | Active theme name |
| `editor-layout` | Layout mode (split/editor/preview) |
| `editor-zoom` | Zoom percentage |
| `editor-line-numbers` | Line numbers enabled |
| `editor-word-wrap` | Word wrap enabled |
| `editor-scroll-sync` | Scroll sync enabled |
| `editor-scroll-sync-offset` | Scroll sync line offset value |
| `markdown-documents` | Stored documents JSON |
| `active-document-id` | Current document ID |

---

## Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari

Requires modern JavaScript (ES6+) and CSS Grid/Flexbox support.

---

*Last updated: January 2026*
