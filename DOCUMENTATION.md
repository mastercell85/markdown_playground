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
- **Split View**: Editor and preview side-by-side with equal height panels
- **Editor Only**: Full-width editor
- **Preview Only**: Full-width preview
- Resizable divider between panes (horizontal bar at top of center gap, 32px height)
- 80px center gap separates input and preview panels with subtle border styling
- Input and preview panels always match in height across all themes

**Equal Height Panel Implementation:**
The editor container uses Flexbox with `align-items: stretch` to ensure input and preview panels always match in height:

- **Base Layout**: `.editor-container` uses `display: flex` with `align-items: stretch`
- **Panel Structure**: Input, gap, and preview sections all stretch to full container height
- **CSS Pseudo-elements**: INPUT and PREVIEW label bars are created with `::before` elements
  - Full-width (100%) horizontal bars at top of each panel
  - Semi-transparent background: `rgba(0, 0, 0, 0.3)`
  - Contain centered text labels with padding
  - Positioned using absolute positioning relative to `.editor-section`
- **Center Gap**: Fixed 80px width column between panels
  - Dark semi-transparent background: `rgba(0, 0, 0, 0.6)`
  - Subtle borders on left and right: `rgba(255, 255, 255, 0.1)`
  - Contains 32px horizontal divider bar at top with resize grip
  - Flexbox column layout for vertical organization
- **Theme Consistency**: All themes (Default, Cyberpunk, LCARS) use the same gap and label styling
- **LCARS Theme**: `.lcars-frame` elements are hidden in default theme using `display: none !important`

**Resize Behavior:**
- Only the left (input) pane gets an explicit width during resize
- Right (preview) pane uses `flex: 1` to fill remaining space
- Divider positioned at top of center gap (32px height, full-width horizontal bar)
- Resize grip provides visual feedback with opacity changes on hover
- **Double-click divider** to instantly center split to 50/50 layout with smooth animation
- This prevents right edge shifting during resize operations
- Theme-specific scrollbar positioning ensures scrollbars are flush with panel edges

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

### Theme-Specific Scrollbar Positioning

Both LCARS and Cyberpunk themes use special CSS to ensure scrollbars are flush with panel edges:

**Cyberpunk Theme:**
- Preview panel uses absolute positioning on `#write` container
- `padding-right: 0` on `#write` places scrollbar at right edge
- Inner `.markdown-output` has `padding-right: 1rem` for readable text spacing

**LCARS Theme:**
- Input panel uses negative right margin (`-10px`) to push scrollbar to edge
- Preview panel uses absolute positioning with `right: 0` on `.editor-section-content`
- Frame decorations (::before, ::after) stop before edges to avoid overlap with gap

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

## Implementation Planning

This section documents planned features and architectural decisions made during the design phase.

### Phase 1: Settings/Preferences System - Planning Session

**Status:** IN PROGRESS - Question 4 of 10
**Session Date:** January 13, 2026

This section contains detailed architectural decisions for implementing a centralized settings/preferences system. Planning uses a systematic Q&A approach to ensure all design decisions are documented before implementation.

---

#### Architecture Overview

**Purpose:** Create a centralized, validated, persistent settings system that all modules can use for user preferences.

**Core Requirements:**
- Type-safe settings with runtime validation
- Module-based defaults (co-located with feature code)
- localStorage persistence with schema versioning
- Clean API for reading/writing settings
- Support for migrations between versions

---

#### ✅ Decision 1: Data Structure (Q1.1)

**Chosen Approach:** Nested/Namespaced Structure (Option B)

**Structure:**
```javascript
{
  version: 1,
  settings: {
    editor: {
      fontSize: 14,
      lineHeight: 1.5,
      theme: 'default',
      wordWrap: true,
      tabSize: 2
    },
    view: {
      mode: 'split',
      splitPosition: 50,
      zoom: 100
    },
    scrollSync: {
      enabled: true,
      offset: 3
    },
    theme: {
      current: 'default',
      tabMenu: 'steel'
    },
    gapMenu: {
      buttons: [...]
    }
  }
}
```

**Rationale:**
- Logical organization by module/feature
- Prevents naming conflicts across modules
- Easier to add new modules without restructuring
- Clear ownership of settings (each module manages its namespace)
- Better than flat structure (no key collision) or fully nested (not as maintainable)

**Advantages:**
- Each module has its own namespace (`editor.*`, `view.*`, etc.)
- Easy to see which settings belong to which feature
- Adding new modules doesn't require refactoring existing code
- Settings objects can be passed directly to modules

**Rejected Alternatives:**
- Flat with Prefixes: Would create `editor-fontSize` keys (harder to group/iterate)
- Completely Flat: No organization, prone to key collisions

---

#### ✅ Decision 2: Schema Versioning (Q1.2)

**Chosen Approach:** Include schema versioning from Phase 1

**Implementation:**
```javascript
{
  version: 1,  // Schema version number
  settings: { ... }
}
```

**Migration Strategy:**
```javascript
migrate(oldVersion, newVersion) {
  if (oldVersion === 1 && newVersion === 2) {
    // Example: Restructure theme settings
    this.settings.appearance = {
      theme: this.settings.theme,
      ...this.settings.editor
    };
    delete this.settings.theme;
    delete this.settings.editor;
    this.settings.version = 2;
  }
}
```

**Rationale:**
- Adding versioning later is much harder than including it from the start
- Enables safe schema evolution as app grows
- Allows automatic migration of user settings when upgrading app
- Prevents breaking changes from losing user preferences

**Use Cases:**
- Renaming settings keys
- Moving settings to different namespaces
- Changing data types (string → number, etc.)
- Removing deprecated settings

---

#### ✅ Decision 3: Default Values & Validation (Q2.1)

**Chosen Approach:** Module-Based Defaults (Option B)

**Implementation Pattern:**
Each module provides its own defaults and validation rules:

```javascript
class EditorManager {
  /**
   * Returns default settings for the editor
   */
  static getDefaultSettings() {
    return {
      fontSize: 14,
      lineHeight: 1.5,
      theme: 'default',
      wordWrap: true,
      tabSize: 2
    };
  }

  /**
   * Returns validation schema
   */
  static getSettingsSchema() {
    return {
      fontSize: {
        type: 'number',
        min: 8,
        max: 72,
        required: true
      },
      lineHeight: {
        type: 'number',
        min: 1.0,
        max: 3.0,
        required: true
      },
      theme: {
        type: 'string',
        enum: ['default', 'dark', 'cyberpunk', 'steel'],
        required: true
      },
      wordWrap: {
        type: 'boolean',
        required: true
      },
      tabSize: {
        type: 'number',
        min: 2,
        max: 8,
        required: true
      }
    };
  }

  /**
   * Validates loaded settings against schema
   */
  static validateSettings(loadedSettings) {
    const schema = this.getSettingsSchema();
    const defaults = this.getDefaultSettings();
    const errors = [];
    const sanitized = {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = loadedSettings[key];

      // Type validation
      if (value !== undefined && typeof value !== rules.type) {
        errors.push(`Invalid type for ${key}`);
        sanitized[key] = defaults[key];
        continue;
      }

      // Range validation for numbers
      if (rules.type === 'number' && value !== undefined) {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${key} below minimum`);
          sanitized[key] = defaults[key];
          continue;
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${key} above maximum`);
          sanitized[key] = defaults[key];
          continue;
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Invalid value for ${key}`);
        sanitized[key] = defaults[key];
        continue;
      }

      // Passed validation
      sanitized[key] = value;
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      sanitized: sanitized
    };
  }
}
```

**SettingsManager Integration:**
```javascript
class SettingsManager {
  constructor() {
    this.modules = [
      EditorManager,
      ViewManager,
      ThemeManager,
      ScrollSyncManager
    ];
    this.settings = this.loadSettings();
  }

  loadSettings() {
    // Get defaults from all modules
    const allDefaults = {};
    this.modules.forEach(module => {
      const moduleName = this.getModuleName(module);
      allDefaults[moduleName] = module.getDefaultSettings();
    });

    // Load from localStorage
    let rawSettings = {};
    try {
      const stored = localStorage.getItem('markdownEditorSettings');
      if (stored) {
        rawSettings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to parse settings:', error);
      return { version: 1, settings: allDefaults };
    }

    // Validate each module's settings
    const validatedSettings = {};
    this.modules.forEach(module => {
      const moduleName = this.getModuleName(module);
      const loadedModuleSettings = rawSettings.settings?.[moduleName] || {};

      const validationResult = module.validateSettings(loadedModuleSettings);

      if (!validationResult.valid) {
        console.warn(`Validation errors for ${moduleName}:`, validationResult.errors);
      }

      validatedSettings[moduleName] = validationResult.sanitized;
    });

    return {
      version: rawSettings.version || 1,
      settings: validatedSettings
    };
  }
}
```

**Rationale:**
- **Co-location:** Defaults live with the code that uses them
- **Modularity:** Each module is self-contained and manages its own settings
- **Scalability:** Adding new modules doesn't require editing a central config
- **Type Safety:** Each module validates and documents its own settings
- **Testability:** Can test each module's defaults/validation independently

**Advantages:**
- No orphaned settings when features are removed
- Defaults always in sync with module requirements
- Validation happens automatically on load
- Invalid settings replaced with safe defaults

**Rejected Alternatives:**
- Centralized Default Object: Would create maintenance burden, orphaned configs
- Lazy/On-Demand Defaults: Would scatter defaults across codebase inconsistently

---

#### ✅ Decision 4: Settings Access API (Q3.1)

**Chosen Approach:** Hybrid - Direct Read, Method Write (Option C)

**Three-Tier Access Control:**

| Role | Access Level | Usage | Reason |
|------|-------------|-------|--------|
| **Employee** (Application Code) | Read-only | `settings.editor.fontSize` | Need info frequently, can't break anything by reading |
| **Supervisor** (`set()` method) | Validate & write | `set('editor.fontSize', 16)` | Enforces rules, validates changes |
| **Owner** (SettingsManager internals) | Full structural control | `migrate()`, `importSettings()`, `resetToDefaults()` | Architectural operations |

**Implementation:**
```javascript
class SettingsManager {
  constructor() {
    this.modules = [...];
    this.settings = this.loadSettings(); // Owner loads & validates
  }

  // ===== EMPLOYEE ACCESS (Reading - Direct) =====
  // Direct property access for reads
  // Usage: const fontSize = settingsManager.settings.editor.fontSize

  // ===== SUPERVISOR ACCESS (Writing - Validated) =====
  /**
   * Validates and updates a single setting
   * @param {string} path - Dot-notation path (e.g., 'editor.fontSize')
   * @param {*} value - New value to set
   */
  set(path, value) {
    const [module, setting] = path.split('.');

    // Get module manager
    const Manager = this.modules.find(m =>
      this.getModuleName(m) === module
    );

    if (!Manager) {
      console.error(`Unknown module: ${module}`);
      return false;
    }

    // Validate with module's schema
    const validation = Manager.validateSetting(setting, value);

    if (!validation.valid) {
      console.error(`Validation failed: ${validation.error}`);
      return false;
    }

    // Update setting
    this.settings.settings[module][setting] = value;

    // Auto-save (will be debounced - see Q4)
    this.save();

    // Notify listeners
    this.notifyListeners(path, value);

    return true;
  }

  // ===== OWNER ACCESS (Structural - Internal Only) =====
  /**
   * Schema migration for version upgrades
   * OWNER DECISION: Restructuring entire settings system
   */
  migrate(oldVersion, newVersion) {
    // Owner can directly manipulate structure
    // Bypasses validation - architectural operation
  }

  /**
   * Import entire settings object from file
   * OWNER DECISION: Replace all settings at once
   */
  importSettings(importedData) {
    // Validate entire structure
    // Replace settings object
    // Too complex for supervisor (would need 50+ set() calls)
  }

  /**
   * Reset all settings to defaults
   * OWNER DECISION: Nuclear option requiring owner authority
   */
  resetToDefaults() {
    // Rebuild settings from module defaults
    // Direct replacement of entire structure
  }
}
```

**Rationale (Company Hierarchy Analogy):**
- **Reading = Checking employee handbook:** Everyone can view policies freely without permission
- **Writing = Changing policy:** Must go through supervisor who validates the change
- **Structural changes = Business restructuring:** Only owner can authorize (migrations, imports, resets)

**Usage Examples:**
```javascript
// FREQUENT: Read settings (direct access, fast, clean)
const fontSize = settingsManager.settings.editor.fontSize;
const { fontSize, lineHeight, tabSize } = settingsManager.settings.editor;

// INFREQUENT: Write settings (validated, safe)
settingsManager.set('editor.fontSize', 16);  // Validates, saves, notifies
settingsManager.set('theme.current', 'cyberpunk');

// RARE: Structural operations (internal only)
settingsManager.migrate(1, 2);  // Owner migrates schema
settingsManager.resetToDefaults();  // Owner resets everything
```

**Advantages:**
- Reads are clean and fast (99% of operations)
- Writes are safe and validated (1% of operations)
- Structural operations are controlled and internal
- Best performance (no function calls for reads)
- Best safety (validation on all writes)

**Rejected Alternatives:**
- Option A (Direct Access): No validation on writes, easy to corrupt settings
- Option B (Getter/Setter Methods): Verbose for reads (`get('editor.fontSize')` everywhere)

---

#### 🔄 Current Question: Persistence & Save Strategy (Q4.1)

**Status:** AWAITING DECISION

**Options Under Consideration:**

**Option A: Auto-Save on Every Change**
```javascript
set(path, value) {
  this.settings.settings[module][setting] = value;
  localStorage.setItem('markdownEditorSettings', JSON.stringify(this.settings));
  this.notifyListeners(path, value);
}
```
- **Pros:** Excellent data safety (instant save)
- **Cons:** Many localStorage writes (expensive), could lag with rapid changes (slider dragging)

**Option B: Debounced Auto-Save** ⭐ RECOMMENDED
```javascript
set(path, value) {
  this.settings.settings[module][setting] = value;

  // Schedule save after 500ms of no changes
  clearTimeout(this.saveTimeout);
  this.saveTimeout = setTimeout(() => {
    localStorage.setItem('markdownEditorSettings', JSON.stringify(this.settings));
  }, 500);

  this.notifyListeners(path, value); // Immediate notification
}
```
- **Pros:** Smooth performance, minimal localStorage writes, still saves automatically
- **Cons:** Small 500ms delay (acceptable for settings)

**Option C: Manual Save (with Auto-Save on Exit)**
```javascript
set(path, value) {
  this.settings.settings[module][setting] = value;
  this.dirty = true;
  this.notifyListeners(path, value);
  // User must call save() OR auto-save on window.beforeunload
}
```
- **Pros:** Best performance, fewest writes
- **Cons:** Risk of data loss if browser crashes before exit

**Key Questions:**
1. How important is immediate persistence vs. performance?
2. Can users tolerate 500ms delay for settings to save?
3. What if user closes browser quickly (no time for beforeunload)?

**Next Steps:** User to decide on persistence strategy before continuing to Q5 (Change Notifications & Reactivity).

---

#### Remaining Planning Questions (Q5-Q10)

**Q5: Change Notifications & Reactivity**
- How do modules react when settings change?
- Event-based listeners vs callbacks vs polling?
- Global events vs module-specific subscriptions?

**Q6: Cross-Tab Synchronization**
- Should settings sync across multiple browser tabs?
- Use `storage` event listener?
- Handle conflicts when tabs have different settings?

**Q7: Import/Export & Reset Functionality**
- Export settings to JSON file for backup?
- Import settings from file?
- Reset individual modules vs. reset all?
- Confirmation dialogs for destructive operations?

**Q8: Initial Settings Priority**
- Which settings to implement first (editor, view, theme, etc.)?
- Minimal viable settings for Phase 1?
- Which can be deferred to future phases?

**Q9: API Design & Developer Experience**
- Public API surface for SettingsManager?
- Error handling strategy?
- TypeScript type definitions (if using TS)?
- JSDoc comments for IDE autocomplete?

**Q10: Testing Strategy**
- Unit tests for validation?
- Integration tests for persistence?
- Mock localStorage for testing?
- Test migrations between schema versions?

---

#### Implementation Checklist (Phase 1)

**After planning is complete:**

- [ ] Create `js/shared/settings-manager.js`
- [ ] Add `getDefaultSettings()` to existing managers (EditorManager, etc.)
- [ ] Add `getSettingsSchema()` to existing managers
- [ ] Add `validateSettings()` to existing managers
- [ ] Implement SettingsManager class with chosen API
- [ ] Add persistence logic (localStorage with debouncing)
- [ ] Add migration system (version 1 → version 2 template)
- [ ] Replace direct localStorage calls with SettingsManager
- [ ] Add settings panel UI (if needed)
- [ ] Write unit tests for validation
- [ ] Write integration tests for persistence
- [ ] Update DOCUMENTATION.md with usage examples

---

## Planned Features & Enhancements

This section tracks features planned for future implementation.

### WYSIWYG Editing Mode (Typora-Style)

**Priority: High (Post-Phase 1 Settings)**

**What it is:**
A true "What You See Is What You Get" editing experience where you type directly in the rendered preview, similar to Typora. When you type `# Header` and press Enter, the `#` syntax disappears and you see a rendered heading with your cursor positioned correctly below it.

**Why we're waiting:**
This is a significant architectural feature that requires:
1. **ContentEditable or custom rendering engine** - Not a simple textarea overlay
2. **Block-level state management** - Tracking which block (paragraph, heading, list item) the cursor is in
3. **Inline syntax detection and transformation** - Detecting completed markdown patterns and rendering them
4. **Cursor position mapping** - Translating between source text positions and rendered DOM positions
5. **Settings System** - To configure WYSIWYG behavior preferences

**Previous attempt (removed):**
A "Live Preview" overlay approach was attempted but removed because it only provided a transparent textarea over the preview - the cursor stayed in raw markdown position, not the rendered position. This was misleading and didn't provide the true Typora experience.

**Implementation approach (when ready):**
1. Research existing WYSIWYG markdown editors (Typora, MarkText, Zettlr)
2. Consider using ContentEditable with custom input handling
3. Build on our existing block processor to track block boundaries
4. Create a cursor position mapping system between source and rendered DOM
5. Handle special cases: code blocks (don't render), tables, nested lists

**Key behavioral requirements:**
- Cursor must be in the **logical rendered position**, not raw markdown position
- Typing `# ` shows the `#` until Enter, then renders as heading
- Block syntax (headings, lists, code fences) transforms on Enter
- Inline syntax (**bold**, *italic*) can transform immediately or on specific triggers
- Must support undo/redo with correct cursor restoration

---

### Markdown Extensions

**Multi-Column Layout**
- Support for 2, 3, or more column layouts within markdown documents
- Multiple syntax options (custom shortcuts, HTML-style tags, BBCode-style, divider syntax)
- Theme-aware styling to match current theme aesthetics
- Use cases: Comparisons, side-by-side content, magazine-style layouts

**Containers/Callouts**
- Warning, info, note, success, error boxes
- Multiple syntax variations: `::: type`, `!!! type`, `[callout:type]`
- Custom icons and colors per callout type
- Collapsible callout support

**Footnotes**
- Reference-style footnotes with automatic numbering
- Syntax: `text[^1]` with `[^1]: definition` at bottom
- Multiple shortcut variations for footnote references
- Auto-linking between reference and definition

**Definition Lists**
- Term and definition pairs with proper semantic HTML
- Multiple syntax options: standard markdown-it style, custom shortcuts
- Styled appropriately for each theme

**Emoji Shortcodes**
- Convert `:emoji_name:` to actual emoji characters
- Support for hundreds of common emoji
- Alternative syntaxes: `emoji{heart}`, `::heart::`
- Emoji picker/browser in Help panel

**Superscript/Subscript**
- Chemical formulas (H~2~O), mathematical notation (X^2^)
- Multiple syntax variations: `~sub~`, `^super^`, `[sub]text[/sub]`, `sub{text}`
- Proper baseline alignment in all themes

**Mark/Highlight**
- Highlight text with yellow or custom colors
- Syntax variations: `==text==`, `[mark]text[/mark]`, `highlight{text}`
- Theme-aware highlight colors

**Insertions/Deletions**
- Show added/removed text with strikethrough and underline
- Syntax: `++inserted++`, `--deleted--`, `[ins]text[/ins]`, `[del]text[/del]`
- Useful for tracking document changes

**Spoilers**
- Hide content until clicked (spoiler blur/black-out effect)
- Syntax variations: `>! spoiler`, `[spoiler]text[/spoiler]`, `||hidden||`
- Click to reveal functionality

**Keyboard Keys**
- Style keyboard shortcuts with key cap appearance
- Syntax: `[[Ctrl]]+[[C]]`, `kbd{Ctrl+C}`, `<kbd>Ctrl</kbd>`
- Platform-aware (Ctrl vs Cmd)

**Math Equations (LaTeX)**
- Inline and block mathematical expressions
- Syntax: `$inline$`, `$$block$$`, `[math]expression[/math]`
- Requires LaTeX rendering library (KaTeX or MathJax)

**Diagrams (Mermaid-style)**
- Flowcharts, sequence diagrams, Gantt charts
- Syntax: Code blocks with `mermaid` language tag
- Requires Mermaid.js integration

**Accordions/Details**
- Native HTML details/summary elements
- Custom markdown syntax alternatives
- Nested accordion support

**Multi-line Blockquotes with Attribution**
- Quote blocks with author attribution
- Syntax: `> quote\n> -- Author Name`
- Special styling for attribution line

**Progress Bars**
- Visual progress indicators
- Syntax variations: `[progress=75]`, `progress{75}`, `[75%]`
- Customizable colors and labels

**Badges/Tags**
- Inline status badges (success, warning, error, info)
- Syntax: `[badge:type]text[/badge]`, `badge{type:text}`
- Multiple color schemes per theme

**Abbreviations**
- Hover tooltips for abbreviations
- Syntax: `*[HTML]: Hyper Text Markup Language`
- Auto-expansion on hover

### Editor Enhancements

**Enhanced Find Function** ✓ IMPLEMENTED
- Unified Find & Replace dialog with theme-aware styling
- Find all occurrences of search term in document
- Next/Previous navigation buttons to jump between matches
- Highlight and auto-scroll to current match
- Match counter display (e.g., "3 of 15")
- Case-sensitive toggle (Aa)
- Whole word match toggle (Ab|)
  - Works with both plain text and regex searches
  - Applies word boundary checking to regex pattern matches
- Regular expression support (.*)
  - Full regex syntax support with configurable flags
  - Regex patterns respect whole word option when enabled
- Replace and Replace All functionality
- Draggable dialog positioned in upper-center viewport
- Live document update detection
  - Search results automatically refresh when document content changes
  - Only triggers when dialog is open and search term is present
- Keyboard shortcuts: Ctrl+F to open, Escape to close, Enter for Next, Shift+Enter for Previous, F3/Shift+F3
- Implemented in `js/shared/find-manager.js` with FindManager class
- Theme-aware CSS in `css/markdown-editor-base.css`
- Comprehensive unit test suite in `tests/find-manager.test.js` (15 tests, 29 assertions)
- Visual test runner at `tests/test-runner.html`

**Double-Click Center Split** ✓ IMPLEMENTED
- Double-click the divider grip to instantly center the split
- Smooth 0.3s animation to 50/50 layout
- Visual feedback with pulse animation and blue glow
- Properly accounts for 80px gap width in calculations
- Implemented in `js/shared/resizable-pane.js` with `centerSplit()` method
- CSS animations in `css/markdown-editor-base.css` with `.centering` class

**Regex Documentation Viewer** ✓ IMPLEMENTED
- Comprehensive regex reference guide embedded in the application
- Dual access points:
  - Blue "?" help button in Find & Replace dialog (next to regex checkbox)
  - "View Regex Documentation" button in Help menu's Regular Expressions section
- Opens as read-only tab that automatically switches to active view
- Covers all regex syntax: character classes, quantifiers, anchors, groups, lookahead/lookbehind
- Practical examples for emails, phone numbers, URLs, IP addresses, dates, hex colors
- Common patterns for text manipulation and code searching
- Tips, best practices, and quick reference card
- Embedded content approach avoids CORS issues with local file loading
- Documentation markdown source: `regex-documentation.md`
- Embedded JavaScript content: `js/shared/regex-docs-content.js`
- Handler implementation in `js/markdown-editor-main.js` with `openRegexDocumentation()` function
- Event-based communication between FindManager and main editor

**Sync Offset Documentation**
- Add Scroll Sync section to Help panel explaining offset behavior
- Document what positive/negative offset values mean
- Include visual examples or diagrams
- Best practices for adjusting offset based on document structure

**Inline Font Styling**
- Change font family, size, color, and weight for specific text spans
- Multiple syntax approaches to be planned:
  - HTML-style attributes: `<span font="Arial" size="20px" color="#ff0000">text</span>`
  - Custom shortcut syntax: `[font:Arial|size:20px|color:red]text[/font]`
  - CSS-style syntax: `{font-family: Arial; font-size: 20px}text{/}`
  - BBCode-style: `[font=Arial][size=20]text[/size][/font]`
- Font picker UI in toolbar or View panel
- Theme-aware default fonts
- Preserve inline styles in exported HTML
- Support for web-safe fonts + custom font loading
- Font preview in Help panel

**Features to brainstorm for inline styling:**
- Font family selection (web-safe fonts, Google Fonts integration?)
- Font size (absolute px, relative em/rem, percentage?)
- Font weight (normal, bold, 100-900 numeric)
- Font color (hex, rgb, named colors, theme variables?)
- Background color for text spans
- Letter spacing / line height adjustments?
- Text shadow effects?
- Gradient text effects for specific themes (Cyberpunk)?
- Should inline styles override theme styles or blend with them?
- Export behavior - preserve inline styles or strip them?

### Future Considerations

Features to evaluate and potentially add:

**Customizable Gap Menu System**
- Scrollable button container in gap area when too many buttons to fit vertically
- Easy-to-implement button system for adding custom actions to gap area
- User-repositionable buttons via drag-and-drop
- Buttons can be positioned anywhere on screen for minimal/focus mode
- Save button positions to user preferences
- Read-only mode toggle button for editor view
- Repositionable gap adjuster button (currently fixed position)

**Enhanced Table of Contents**
- Auto-generation from document heading structure
- Animated expand/collapse functionality
- Clickable links to jump to sections
- Visual indicators for current section while scrolling
- Collapsible nested heading levels
- Smooth scroll animation when clicking TOC items

**View Positioning & Switching**
- View positioning configuration for editor-only and preview-only modes
  - Centered single-pane view option
  - Left-aligned or right-aligned single-pane option
- Convert INPUT/PREVIEW labels to clickable view switchers
  - Click "INPUT" to switch to editor-only mode
  - Click "PREVIEW" to switch to preview-only mode
  - Visual active state indicators
- Remember last view mode preference

**Additional Features**
- Word count / reading time indicators
- Export to PDF with print-friendly formatting
- Markdown templates (blog post, documentation, README, etc.)
- Autocomplete for markdown syntax
- Live collaboration (multiple users editing)
- Version history / document snapshots
- Spell check integration
- Grammar check integration
- Image paste from clipboard
- Drag-and-drop image upload
- Custom CSS class injection for advanced styling
- Plugin/extension system for community add-ons

---

*Last updated: January 2026*
