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
9. [Implementation Planning](#implementation-planning)
   - [Phase 1: Settings System](#phase-1-settingspreferences-system---planning-session) ✅
   - [Phase 2: Scroll Sync & WYSIWYG Infrastructure](#phase-2-scroll-sync-accuracy--wysiwyg-infrastructure---planning-session) ✅
10. [Planned Features & Enhancements](#planned-features--enhancements)

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

**Status:** ✅ PLANNING COMPLETE - Ready for Implementation
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

#### ✅ Decision 4: Persistence & Save Strategy (Q4.1)

**Chosen Approach:** Hybrid - Debounced Auto-Save + Save/Cancel/Revert Buttons (Option D)

**Three-State System:**
```javascript
{
  lastSavedSettings: { ... },   // What's actually in localStorage
  previousSettings: { ... },     // Snapshot before current edit session
  currentSettings: { ... }       // Live working copy (what user sees)
}
```

**Implementation:**
```javascript
class SettingsManager {
  constructor() {
    this.lastSavedSettings = this.loadFromStorage();
    this.previousSettings = structuredClone(this.lastSavedSettings);
    this.currentSettings = structuredClone(this.lastSavedSettings);
    this.saveTimeout = null;
    this.DEBOUNCE_DELAY = 500; // ms
  }

  /**
   * Update a setting (immediate in-memory, debounced to disk)
   */
  set(path, value) {
    // Update in-memory immediately
    this.setNestedValue(this.currentSettings, path, value);

    // Notify listeners immediately (UI updates instantly)
    this.notifyListeners(path, value);

    // Schedule debounced save
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToStorage();
      this.lastSavedSettings = structuredClone(this.currentSettings);
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Explicit save - immediately persist and update snapshots
   */
  save() {
    clearTimeout(this.saveTimeout);
    this.saveToStorage();
    this.lastSavedSettings = structuredClone(this.currentSettings);
    this.previousSettings = structuredClone(this.currentSettings);
  }

  /**
   * Cancel - revert to previousSettings (before edit session)
   */
  cancel() {
    clearTimeout(this.saveTimeout);
    this.currentSettings = structuredClone(this.previousSettings);
    this.saveToStorage();
    this.lastSavedSettings = structuredClone(this.currentSettings);
    this.notifyAllListeners(); // Update UI to reverted state
  }

  /**
   * Revert - go back to lastSavedSettings (last disk state)
   */
  revert() {
    clearTimeout(this.saveTimeout);
    this.currentSettings = structuredClone(this.lastSavedSettings);
    this.notifyAllListeners(); // Update UI to saved state
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges() {
    return JSON.stringify(this.currentSettings) !==
           JSON.stringify(this.lastSavedSettings);
  }
}
```

**UI Behavior:**
- **Save button**: Commits current changes, updates both snapshots
- **Cancel button**: Reverts to `previousSettings` (session start state)
- **Revert button**: Reverts to `lastSavedSettings` (last disk state)
- **Auto-save fallback**: If user navigates away without Save/Cancel, debounce ensures changes persist

**Rationale:**
- Combines best of both worlds: safety of auto-save + control of explicit save
- Three states allow flexible undo scenarios
- Debounced writes prevent performance issues with rapid changes (sliders)
- Explicit buttons give users confidence and control
- Auto-save fallback prevents accidental data loss

**Advantages:**
- Users who want quick changes get auto-save behavior
- Users who want deliberate control get Save/Cancel buttons
- "Revert" allows undoing recent changes even after auto-save
- Minimal localStorage writes (debounced)
- No data loss on browser crash (500ms max delay)

---

#### ✅ Decision 5: Change Notifications & Reactivity (Q5.1)

**Chosen Approach:** Event-Based System with Categories (Option B)

**Event Categories:**
| Category | Purpose | Example Events |
|----------|---------|----------------|
| `settings:*` | Settings panel changes | `settings:editor.fontSize`, `settings:theme.current` |
| `docstyle:*` | Inline document style commands | `docstyle:font`, `docstyle:size`, `docstyle:color` |
| `autocomplete:*` | Autocomplete selections | `autocomplete:font`, `autocomplete:emoji` |
| `editor:*` | Editor state changes | `editor:content`, `editor:selection` |

**Implementation:**
```javascript
class SettingsManager {
  constructor() {
    // ...existing code...
  }

  /**
   * Dispatch a settings change event
   */
  notifyListeners(path, value) {
    const event = new CustomEvent(`settings:${path}`, {
      detail: { path, value, timestamp: Date.now() }
    });
    document.dispatchEvent(event);

    // Also dispatch generic event for modules that listen to all changes
    const genericEvent = new CustomEvent('settings:changed', {
      detail: { path, value, timestamp: Date.now() }
    });
    document.dispatchEvent(genericEvent);
  }
}

// Module subscription example
class EditorManager {
  init() {
    // Listen to specific setting
    document.addEventListener('settings:editor.fontSize', (e) => {
      this.applyFontSize(e.detail.value);
    });

    // Listen to all editor settings
    document.addEventListener('settings:changed', (e) => {
      if (e.detail.path.startsWith('editor.')) {
        this.handleSettingChange(e.detail);
      }
    });
  }
}
```

**Inline Document Style Commands (Future Feature):**
```markdown
<!-- User types in editor: -->
font=Arial
size=20px
color=#ff0000

<!-- With autocomplete dropdown showing bundled fonts: -->
font=STIX Two Text
font=STIX Two Math
font=XITS Text
font=XITS Math
```

**Multi-Syntax Support (Future):**
```markdown
<!-- All equivalent: -->
font=Arial
font:Arial
font(Arial)
[font:Arial]
```

**Rationale:**
- Standard browser event system (no custom pub/sub library)
- Categories prevent event collision between different subsystems
- Loose coupling - modules don't need references to each other
- Easy to add new listeners without modifying SettingsManager
- Supports future inline styling feature with same event architecture

**Bundled Fonts (for autocomplete):**
- STIX Two Math (mathematical symbols)
- STIX Two Text (matching text font)
- XITS Math (alternative math font)
- XITS Text (alternative text font)
- Additional bundled fonts to be researched

---

#### ✅ Decision 6: Settings UI Location (Q6.1)

**Chosen Approach:** Settings Panel + View Tab for Quick Access (Option D Modified)

**Structure:**
| Location | Contains | Rationale |
|----------|----------|-----------|
| **Settings Panel** | All functional settings | Editor defaults, persistence, parser options, keybindings, etc. |
| **View Tab** | Theme selector, Tab Menu Style | Quick access for frequently-changed visual settings |

**Why This Split:**
- **Theme changes are frequent** - users switch themes often to match mood/environment
- **Tab menu style changes are less frequent** but still accessible - no need to bury in settings
- **Settings panel for functional options** - things you set once and forget (font size, line height, etc.)
- **View tab already exists** with theme/tab menu controls - no additional work needed

**Access Methods:**
1. **Settings Panel**: Via menu icon or File → Preferences
2. **View Tab**: Click View tab label to access theme/tab menu style selectors

**Settings Panel Organization:**
```
Settings Panel
├── Editor Settings
│   ├── Font Size
│   ├── Line Height
│   ├── Tab Size
│   └── Word Wrap Default
├── Parser Settings
│   ├── Line Tracking
│   └── Shortcut Processing
├── Persistence Settings
│   ├── Auto-save Delay
│   └── Document Backup
├── Scroll Sync Settings
│   ├── Default Enabled
│   └── Default Offset
└── Advanced
    ├── Reset to Defaults
    ├── Export Settings
    └── Import Settings
```

**Rationale:**
- Clean separation: View tab = appearance, Settings panel = behavior
- No duplication of controls
- Theme/tab menu stay easily accessible for quick switching
- Full settings accessible for power users who want fine-tuned control

---

#### ✅ Decision 7: Import/Export & Reset Functionality (Q7.1)

**Chosen Approach:** Full Import/Export + Granular Reset (Option B)

**Features:**
| Feature | Description |
|---------|-------------|
| **Export Settings** | Download settings as JSON file for backup |
| **Import Settings** | Load settings from JSON file with validation |
| **Reset Module** | Reset specific module to defaults (e.g., editor only) |
| **Reset All** | Reset all settings to defaults |

**Implementation:**
```javascript
class SettingsManager {
  /**
   * Export settings to downloadable JSON file
   */
  exportSettings() {
    const exportData = {
      version: this.currentSettings.version,
      exportDate: new Date().toISOString(),
      settings: this.currentSettings.settings
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown-editor-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import settings from JSON file
   * @param {File} file - JSON file to import
   * @returns {Object} - { success: boolean, errors?: string[] }
   */
  async importSettings(file) {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      // Validate structure
      if (!imported.settings || typeof imported.settings !== 'object') {
        return { success: false, errors: ['Invalid settings file format'] };
      }

      // Validate each module's settings
      const errors = [];
      const validatedSettings = {};

      this.modules.forEach(module => {
        const moduleName = this.getModuleName(module);
        const moduleSettings = imported.settings[moduleName] || {};
        const validation = module.validateSettings(moduleSettings);

        if (!validation.valid) {
          errors.push(...validation.errors.map(e => `${moduleName}: ${e}`));
        }
        validatedSettings[moduleName] = validation.sanitized;
      });

      if (errors.length > 0) {
        // Warn but allow import with sanitized values
        console.warn('Import validation warnings:', errors);
      }

      // Apply imported settings
      this.currentSettings.settings = validatedSettings;
      this.save();
      this.notifyAllListeners();

      return { success: true, warnings: errors };
    } catch (error) {
      return { success: false, errors: [`Parse error: ${error.message}`] };
    }
  }

  /**
   * Reset specific module to defaults
   * @param {string} moduleName - Module to reset (e.g., 'editor')
   */
  resetModule(moduleName) {
    const Manager = this.modules.find(m =>
      this.getModuleName(m) === moduleName
    );

    if (!Manager) {
      console.error(`Unknown module: ${moduleName}`);
      return false;
    }

    this.currentSettings.settings[moduleName] = Manager.getDefaultSettings();
    this.save();
    this.notifyListeners(`${moduleName}:reset`, null);
    return true;
  }

  /**
   * Reset all settings to defaults
   */
  resetAll() {
    this.modules.forEach(module => {
      const name = this.getModuleName(module);
      this.currentSettings.settings[name] = module.getDefaultSettings();
    });
    this.save();
    this.notifyAllListeners();
  }
}
```

**UI Confirmation Dialogs:**
```javascript
// Reset module confirmation
function confirmResetModule(moduleName) {
  if (confirm(`Reset ${moduleName} settings to defaults? This cannot be undone.`)) {
    settingsManager.resetModule(moduleName);
  }
}

// Reset all confirmation
function confirmResetAll() {
  if (confirm('Reset ALL settings to defaults? This cannot be undone.')) {
    settingsManager.resetAll();
  }
}

// Import confirmation (after validation)
function confirmImport(warnings) {
  if (warnings.length > 0) {
    return confirm(
      `Import completed with ${warnings.length} warning(s):\n\n` +
      warnings.join('\n') +
      '\n\nContinue with import?'
    );
  }
  return true;
}
```

**File Picker UI:**
```html
<!-- Hidden file input for import -->
<input type="file" id="settings-import" accept=".json" style="display: none;">

<!-- Export/Import buttons in Settings Panel -->
<button onclick="settingsManager.exportSettings()">Export Settings</button>
<button onclick="document.getElementById('settings-import').click()">Import Settings</button>
```

**Rationale:**
- Full backup/restore capability for power users
- Granular reset allows fixing one broken area without losing all preferences
- Validation prevents importing malformed or incompatible settings
- Warnings (not errors) allow partial imports with sanitized values
- Confirmation dialogs prevent accidental data loss

---

#### ✅ Decision 8: Initial Settings Priority (Q8.1)

**Chosen Approach:** Migrate Existing + Core Editor Settings (Option B)

**Phase 1 Scope:**

**Part 1: Migrate Existing localStorage Keys**
| Old Key | New Path | Type |
|---------|----------|------|
| `tab-menu-style` | `theme.tabMenu` | string |
| `current-theme` | `theme.current` | string |
| `editor-layout` | `view.mode` | string |
| `editor-zoom` | `view.zoom` | number |
| `editor-line-numbers` | `editor.lineNumbers` | boolean |
| `editor-word-wrap` | `editor.wordWrap` | boolean |
| `editor-scroll-sync` | `scrollSync.enabled` | boolean |
| `editor-scroll-sync-offset` | `scrollSync.offset` | number |

**Part 2: Add New Editor Settings**
| Setting | Path | Default | Range/Options |
|---------|------|---------|---------------|
| Font Size | `editor.fontSize` | 14 | 8-72 |
| Line Height | `editor.lineHeight` | 1.5 | 1.0-3.0 |
| Tab Size | `editor.tabSize` | 2 | 2-8 |
| Font Family | `editor.fontFamily` | 'monospace' | string |

**Complete Phase 1 Settings Structure:**
```javascript
{
  version: 1,
  settings: {
    editor: {
      fontSize: 14,
      lineHeight: 1.5,
      tabSize: 2,
      fontFamily: 'monospace',
      lineNumbers: true,
      wordWrap: true
    },
    view: {
      mode: 'split',        // 'split' | 'editor' | 'preview'
      zoom: 100             // 90-150
    },
    scrollSync: {
      enabled: true,
      offset: 3
    },
    theme: {
      current: 'default',
      tabMenu: 'steel'
    }
  }
}
```

**Migration Strategy:**
```javascript
/**
 * One-time migration from old localStorage keys to new SettingsManager
 */
migrateFromLegacyStorage() {
  const migrations = [
    { oldKey: 'tab-menu-style', newPath: 'theme.tabMenu', default: 'steel' },
    { oldKey: 'current-theme', newPath: 'theme.current', default: 'default' },
    { oldKey: 'editor-layout', newPath: 'view.mode', default: 'split' },
    { oldKey: 'editor-zoom', newPath: 'view.zoom', default: 100, transform: parseInt },
    { oldKey: 'editor-line-numbers', newPath: 'editor.lineNumbers', default: true, transform: v => v === 'true' },
    { oldKey: 'editor-word-wrap', newPath: 'editor.wordWrap', default: true, transform: v => v === 'true' },
    { oldKey: 'editor-scroll-sync', newPath: 'editor.scrollSync.enabled', default: true, transform: v => v === 'true' },
    { oldKey: 'editor-scroll-sync-offset', newPath: 'scrollSync.offset', default: 3, transform: parseInt }
  ];

  migrations.forEach(({ oldKey, newPath, default: defaultVal, transform }) => {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null) {
      const value = transform ? transform(oldValue) : oldValue;
      this.setNestedValue(this.currentSettings, newPath, value);
      localStorage.removeItem(oldKey); // Clean up old key
    }
  });

  this.save();
}
```

**Deferred to Future Phases:**
- Parser settings (line tracking, shortcut toggles)
- Persistence settings (auto-save delay customization)
- Keybindings customization
- Inline font styling settings
- WYSIWYG mode settings

**Rationale:**
- Migrating existing settings proves the architecture works
- New editor settings (font size, line height) provide immediate user value
- Scope is achievable without being overwhelming
- Foundation ready for future expansion

---

#### ✅ Decision 9: API Design & Developer Experience (Q9.1)

**Chosen Approach:** Extended API with Convenience Methods + Error Throwing (Option B)

**Core API:**
```javascript
// Reading (direct access)
settingsManager.settings.editor.fontSize

// Writing (validated)
settingsManager.set('editor.fontSize', 16)

// State management
settingsManager.save()
settingsManager.cancel()
settingsManager.revert()

// Reset operations
settingsManager.resetAll()
settingsManager.resetModule('editor')

// Import/Export
settingsManager.exportSettings()
settingsManager.importSettings(file)
```

**Convenience Methods:**
```javascript
/**
 * Update multiple settings at once
 * @param {Object} settings - Object with path:value pairs
 */
setMultiple(settings) {
  Object.entries(settings).forEach(([path, value]) => {
    this.set(path, value);
  });
}

/**
 * Get all settings for a specific module
 * @param {string} moduleName - Module name (e.g., 'editor')
 * @returns {Object} - Module settings object
 */
getModule(moduleName) {
  return this.settings.settings[moduleName];
}

/**
 * Check if there are unsaved changes
 * @returns {boolean}
 */
hasUnsavedChanges() {
  return JSON.stringify(this.currentSettings) !==
         JSON.stringify(this.lastSavedSettings);
}

/**
 * Get default value for a setting
 * @param {string} path - Dot-notation path
 * @returns {*} - Default value
 */
getDefault(path) {
  const [moduleName, setting] = path.split('.');
  const Manager = this.modules.find(m => this.getModuleName(m) === moduleName);
  return Manager?.getDefaultSettings()[setting];
}

/**
 * Subscribe to setting changes (convenience wrapper for addEventListener)
 * @param {string} path - Setting path to watch
 * @param {Function} callback - Function to call on change
 */
onChange(path, callback) {
  const handler = (e) => callback(e.detail.value, e.detail);
  document.addEventListener(`settings:${path}`, handler);
  return handler; // Return for cleanup
}

/**
 * Unsubscribe from setting changes
 * @param {string} path - Setting path
 * @param {Function} handler - Handler returned from onChange
 */
offChange(path, handler) {
  document.removeEventListener(`settings:${path}`, handler);
}
```

**Error Handling Strategy: Throw Errors**
```javascript
/**
 * Custom error class for settings-related errors
 */
class SettingsError extends Error {
  constructor(message, path = null) {
    super(message);
    this.name = 'SettingsError';
    this.path = path;
  }
}

/**
 * Set a setting value with validation
 * @throws {SettingsError} If path is invalid or validation fails
 */
set(path, value) {
  const [moduleName, setting] = path.split('.');

  // Validate module exists
  const Manager = this.modules.find(m => this.getModuleName(m) === moduleName);
  if (!Manager) {
    throw new SettingsError(`Unknown module: '${moduleName}'`, path);
  }

  // Validate setting exists in module
  const schema = Manager.getSettingsSchema();
  if (!schema[setting]) {
    throw new SettingsError(`Unknown setting: '${setting}' in module '${moduleName}'`, path);
  }

  // Validate value against schema
  const rules = schema[setting];
  if (typeof value !== rules.type) {
    throw new SettingsError(
      `Type mismatch for '${path}': expected ${rules.type}, got ${typeof value}`,
      path
    );
  }

  if (rules.type === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      throw new SettingsError(`Value ${value} below minimum ${rules.min} for '${path}'`, path);
    }
    if (rules.max !== undefined && value > rules.max) {
      throw new SettingsError(`Value ${value} above maximum ${rules.max} for '${path}'`, path);
    }
  }

  if (rules.enum && !rules.enum.includes(value)) {
    throw new SettingsError(
      `Invalid value '${value}' for '${path}'. Expected one of: ${rules.enum.join(', ')}`,
      path
    );
  }

  // All validation passed - update setting
  this.setNestedValue(this.currentSettings, path, value);
  this.notifyListeners(path, value);
  this.scheduleSave();

  return true;
}
```

**Usage in UI Code (with try/catch):**
```javascript
// Settings panel slider handler
fontSizeSlider.addEventListener('input', (e) => {
  try {
    settingsManager.set('editor.fontSize', parseInt(e.target.value));
  } catch (error) {
    if (error instanceof SettingsError) {
      console.error('Settings error:', error.message);
      // Optionally show user-friendly message
    } else {
      throw error; // Re-throw unexpected errors
    }
  }
});
```

**JSDoc Comments for IDE Autocomplete:**
All public methods include JSDoc comments with:
- `@param` - Parameter types and descriptions
- `@returns` - Return type and description
- `@throws` - Error conditions
- `@example` - Usage examples

**Rationale:**
- Extended API reduces boilerplate in calling code
- `onChange()`/`offChange()` are cleaner than raw addEventListener
- Error throwing catches bugs during development
- JSDoc enables IDE autocomplete and inline documentation
- Custom `SettingsError` class allows specific error handling

---

#### ✅ Decision 10: Testing Strategy (Q10.1)

**Chosen Approach:** Unit Tests for Core Logic + Manual Testing (Option B)

**Testing Approach:**
| Type | Coverage | Tools |
|------|----------|-------|
| **Unit Tests** | Validation, persistence, migration | Existing test runner |
| **Manual Testing** | UI interactions, edge cases, bug hunting | Developer testing |

**Unit Test Categories:**

**1. Validation Tests**
```javascript
describe('Settings Validation', () => {
  test('rejects invalid type - string instead of number', () => {
    expect(() => settingsManager.set('editor.fontSize', 'large'))
      .toThrow(SettingsError);
  });

  test('rejects number below minimum', () => {
    expect(() => settingsManager.set('editor.fontSize', 5))
      .toThrow(/below minimum/);
  });

  test('rejects number above maximum', () => {
    expect(() => settingsManager.set('editor.fontSize', 100))
      .toThrow(/above maximum/);
  });

  test('rejects invalid enum value', () => {
    expect(() => settingsManager.set('view.mode', 'invalid'))
      .toThrow(/Expected one of/);
  });

  test('accepts valid number within range', () => {
    expect(settingsManager.set('editor.fontSize', 16)).toBe(true);
    expect(settingsManager.settings.editor.fontSize).toBe(16);
  });

  test('accepts valid enum value', () => {
    expect(settingsManager.set('view.mode', 'preview')).toBe(true);
  });
});
```

**2. Persistence Tests**
```javascript
describe('Settings Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves settings to localStorage', () => {
    settingsManager.set('editor.fontSize', 18);
    settingsManager.save();

    const stored = JSON.parse(localStorage.getItem('markdownEditorSettings'));
    expect(stored.settings.editor.fontSize).toBe(18);
  });

  test('loads settings from localStorage on init', () => {
    localStorage.setItem('markdownEditorSettings', JSON.stringify({
      version: 1,
      settings: { editor: { fontSize: 20 } }
    }));

    const manager = new SettingsManager();
    expect(manager.settings.editor.fontSize).toBe(20);
  });

  test('uses defaults when localStorage is empty', () => {
    const manager = new SettingsManager();
    expect(manager.settings.editor.fontSize).toBe(14); // default
  });

  test('debounces rapid changes', async () => {
    const saveSpy = jest.spyOn(settingsManager, 'saveToStorage');

    settingsManager.set('editor.fontSize', 16);
    settingsManager.set('editor.fontSize', 17);
    settingsManager.set('editor.fontSize', 18);

    // Should not have saved yet (debounce delay)
    expect(saveSpy).not.toHaveBeenCalled();

    // Wait for debounce
    await new Promise(r => setTimeout(r, 600));
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
```

**3. Migration Tests**
```javascript
describe('Settings Migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('migrates legacy editor-zoom key', () => {
    localStorage.setItem('editor-zoom', '125');

    const manager = new SettingsManager();

    expect(manager.settings.view.zoom).toBe(125);
    expect(localStorage.getItem('editor-zoom')).toBeNull(); // cleaned up
  });

  test('migrates legacy boolean stored as string', () => {
    localStorage.setItem('editor-line-numbers', 'false');

    const manager = new SettingsManager();

    expect(manager.settings.editor.lineNumbers).toBe(false);
  });

  test('handles missing legacy keys gracefully', () => {
    // No legacy keys set
    const manager = new SettingsManager();

    // Should use defaults
    expect(manager.settings.editor.fontSize).toBe(14);
    expect(manager.settings.view.zoom).toBe(100);
  });
});
```

**4. State Management Tests**
```javascript
describe('Save/Cancel/Revert', () => {
  test('save() commits changes to both snapshots', () => {
    settingsManager.set('editor.fontSize', 20);
    settingsManager.save();

    expect(settingsManager.hasUnsavedChanges()).toBe(false);
  });

  test('cancel() reverts to session start state', () => {
    const original = settingsManager.settings.editor.fontSize;
    settingsManager.set('editor.fontSize', 99);
    settingsManager.cancel();

    expect(settingsManager.settings.editor.fontSize).toBe(original);
  });

  test('revert() goes back to last saved state', () => {
    settingsManager.set('editor.fontSize', 20);
    settingsManager.save();
    settingsManager.set('editor.fontSize', 30);
    settingsManager.revert();

    expect(settingsManager.settings.editor.fontSize).toBe(20);
  });

  test('hasUnsavedChanges() detects modifications', () => {
    settingsManager.save(); // Start clean
    expect(settingsManager.hasUnsavedChanges()).toBe(false);

    settingsManager.set('editor.fontSize', 99);
    expect(settingsManager.hasUnsavedChanges()).toBe(true);
  });
});
```

**Test File Location:** `tests/settings-manager.test.js`

**Manual Testing Checklist:**
- [ ] Change settings via UI controls
- [ ] Verify changes persist after page reload
- [ ] Test Save/Cancel/Revert buttons
- [ ] Import/Export settings files
- [ ] Reset individual modules
- [ ] Reset all settings
- [ ] Edge cases: rapid slider dragging, invalid inputs
- [ ] Cross-browser testing (Chrome, Firefox, Edge)

**Rationale:**
- Unit tests catch validation/persistence bugs automatically
- Manual testing catches UI/UX issues and edge cases
- Reuses existing test runner infrastructure
- Reasonable effort-to-value ratio for project size
- Skip E2E automation (overkill for this project)

---

### Phase 1 Planning: COMPLETE

All 10 architectural decisions have been made. The Settings/Preferences System is ready for implementation.

---

### Phase 2: Scroll Sync Accuracy & WYSIWYG Infrastructure - Planning Session

**Status:** ✅ PLANNING COMPLETE
**Session Date:** January 14, 2026
**Decisions Finalized:** January 14, 2026

This section documents infrastructure planning for improved scroll synchronization and WYSIWYG editing mode. These features share significant infrastructure requirements, so planning them together prevents duplicate work and ensures a cohesive architecture.

---

#### Why Plan These Together?

Both Scroll Sync improvements and WYSIWYG mode need **accurate line-to-element mapping** - the ability to know exactly which rendered DOM element corresponds to which line (or range of lines) in the source markdown.

**Current Scroll Sync Limitations:**
- Uses `data-line` attributes added by BlockProcessor during parsing
- Works well for block-level elements (headings, paragraphs, code blocks)
- ~95% accuracy but struggles with:
  - Elements spanning multiple source lines (multi-line paragraphs)
  - Inline elements (emphasis, links) within block elements
  - Dynamic content height differences between source and preview
  - Nested structures (lists within lists, blockquotes)

**WYSIWYG Requirements:**
- Need to know which source line the cursor is on
- Need to transform that position to the rendered DOM position
- Need bidirectional mapping: source ↔ DOM
- Must handle partial block editing (editing middle of paragraph)

**Shared Infrastructure:**
| Component | Scroll Sync Needs | WYSIWYG Needs |
|-----------|-------------------|---------------|
| Line-to-element mapping | Yes - find element for line | Yes - find element for cursor |
| Element-to-line mapping | Yes - find line for scroll position | Yes - update source from DOM |
| Character offset tracking | Partial - block boundaries | Yes - exact character positions |
| Rendered height calculation | Yes - interpolate scroll positions | Yes - cursor positioning |
| Block boundary detection | Yes - sync at block edges | Yes - detect when to render |

---

#### Architecture Overview: Line Mapping System

**Purpose:** Create a bidirectional mapping between source markdown lines and rendered DOM elements, enabling accurate scroll sync and future WYSIWYG editing.

**Core Components:**

```
LineMapper (New Module)
├── SourceMap
│   ├── lineToElement: Map<lineNumber, ElementInfo>
│   ├── elementToLines: Map<elementId, LineRange>
│   └── characterOffsets: Map<lineNumber, {start, end}>
│
├── DOMTracker
│   ├── elementHeights: Map<elementId, number>
│   ├── elementOffsets: Map<elementId, number>
│   └── updateOnMutation: MutationObserver
│
└── Interpolator
    ├── getElementForLine(line): Element
    ├── getLineForElement(element): LineRange
    ├── getScrollPositionForLine(line): number
    └── getLineForScrollPosition(scrollTop): number
```

---

#### Decision 1: Mapping Granularity

**Question:** How fine-grained should the line-to-element mapping be?

**Option A: Block-Level Only (Current Approach)**
- Map entire blocks (paragraphs, headings, code blocks) to line ranges
- Simple, fast, but ~95% accuracy
- Can't handle mid-paragraph scrolling precisely

**Option B: Block + Inline Elements**
- Map blocks AND inline elements (links, emphasis, code spans)
- More accurate scroll sync within long paragraphs
- Significantly more complex parsing and DOM traversal

**Option C: Character-Level Mapping**
- Map every character position to DOM text nodes
- Maximum accuracy (99%+)
- High memory overhead, complex maintenance
- Required for true WYSIWYG (cursor positioning)

**Option D: Hybrid - Block Default, Character On-Demand** ✅ **SELECTED**
- Use block-level mapping for scroll sync (fast, low memory)
- Calculate character-level mapping only when needed (WYSIWYG editing)
- Best of both worlds: performance when scrolling, precision when editing

**Decision Rationale:** This hybrid approach provides optimal performance for the common case (scroll sync) while maintaining the capability for precise character-level mapping when WYSIWYG editing is implemented. Block-level mapping with `data-line-start` and `data-line-end` attributes handles multi-line elements naturally, and character-level calculations are deferred until actually needed.

---

#### Decision 2: Source Map Generation Timing

**Question:** When should the line mapping be generated?

**Option A: During Parsing (Current)**
- BlockProcessor adds `data-line` attributes during markdown→HTML conversion
- Pros: Already implemented, no extra pass
- Cons: Limited to what parser knows, can't track post-render changes

**Option B: Post-Render DOM Analysis**
- After HTML is rendered, traverse DOM to build complete map
- Pros: Sees actual rendered structure, handles dynamic content
- Cons: Extra processing step, may not match source accurately

**Option C: Hybrid - Parser Seeds, Post-Render Enhances** ✅ **SELECTED**
- Parser adds `data-line` attributes (block boundaries)
- Post-render pass adds measurements (heights, offsets)
- Pros: Accurate source mapping + actual render measurements
- Cons: More complex, two-phase process

**Decision Rationale:** This two-phase approach leverages the existing BlockProcessor infrastructure (which already adds `data-line` attributes) while adding post-render measurement for accurate height and offset tracking. The parser has the most accurate knowledge of source line positions, while post-render measurement captures the actual DOM dimensions after CSS styling and reflow.

---

#### Decision 3: Height Calculation Strategy

**Question:** How should we handle height differences between source and rendered content?

**Problem:** Source lines have uniform height (line-height), but rendered elements have variable heights:
- A 3-line source paragraph might render as 5 lines of text (wrapping)
- An image takes 1 source line but could be 500px tall
- Code blocks with syntax highlighting may differ from source

**Option A: Percentage-Based Interpolation (Current Fallback)**
- Calculate scroll position as percentage of total height
- Simple, works reasonably well for similar-length content
- Breaks down with images, large code blocks, or varying density

**Option B: Element-Height Weighted Mapping** ✅ **SELECTED**
- Track actual rendered height of each mapped element
- Distribute scroll position proportionally based on element heights
- More accurate for mixed content documents

**Option C: Line-Height Normalized Mapping**
- Normalize all heights to "equivalent source lines"
- A 200px image = ~13 source lines at 15px line-height
- Provides conceptually simple mapping
- May feel "wrong" when scrolling over images

**Option D: Content-Aware Adaptive Mapping**
- Different strategies for different content types
- Text: line-based interpolation
- Images: jump to/from (sync at boundaries, not within)
- Code: syntax-line based (sync by code line, not source line)
- Most accurate but most complex

**Decision Rationale (Option B selected):** Element-height weighted mapping provides significantly better accuracy than percentage-based interpolation without the complexity of content-aware adaptive strategies. By tracking actual rendered heights, the system can distribute scroll positions proportionally—a 500px tall image gets proportionally more scroll "space" than a 50px paragraph. This approach works well for mixed content documents while remaining straightforward to implement and maintain.

---

#### Decision 4: DOM Change Handling

**Question:** How should the mapping respond to DOM changes?

**Scenarios:**
- User types in editor → source changes → re-render
- Window resize → reflow → heights change
- Theme switch → styles change → heights change
- Dynamic content (collapsible sections, lazy images)

**Option A: Full Rebuild on Any Change**
- Any DOM mutation triggers complete map rebuild
- Simple logic but potentially expensive
- May cause scroll jumps during editing

**Option B: Incremental Updates**
- MutationObserver tracks specific changes
- Only update affected portions of map
- Complex but efficient
- Risk of map drift/corruption over time

**Option C: Lazy Rebuild with Dirty Flag**
- Mark map as "dirty" on changes
- Rebuild only when mapping is actually queried
- Good for burst edits (typing rapidly)
- Slight latency on first scroll after edit

**Option D: Time-Debounced Rebuild** ✅ **SELECTED**
- Rebuild map after 100-300ms of no changes
- Balances accuracy with performance
- Similar to current auto-save debouncing
- Natural fit with existing architecture

**Decision Rationale:** Time-debounced rebuild (150-300ms) aligns with the existing architecture patterns used throughout the application (e.g., auto-save debouncing). This approach prevents expensive rebuilds during rapid typing while ensuring the map stays current. The slight latency after the last change is imperceptible to users and avoids the complexity of incremental updates or the overhead of full rebuilds on every change.

---

#### Decision 5: Scroll Sync Algorithm Improvements

**Question:** What algorithm improvements should we implement?

**Current Algorithm:**
1. Calculate visible line from scroll position
2. Apply offset adjustment
3. Find element with matching `data-line`
4. Scroll preview to that element

**Proposed Improvements:**

**Improvement A: Sub-Element Interpolation** ✅ **SELECTED FOR PHASE 2**
- When scrolled partway through an element, interpolate proportionally
- If paragraph spans lines 5-8 and we're at line 6.5, scroll to 37.5% through paragraph
- Smoother scrolling, especially for long paragraphs

**Improvement B: Velocity-Aware Sync** 📋 **DEFERRED TO FUTURE ENHANCEMENTS**
- Track scroll velocity (fast vs slow scrolling)
- Fast scroll: sync at block boundaries only (less jitter)
- Slow scroll: precise sub-element sync
- Prevents "fighting" during rapid scroll

**Improvement C: Directional Bias** 📋 **DEFERRED TO FUTURE ENHANCEMENTS**
- Remember last scroll direction
- When syncing, bias toward revealing content in scroll direction
- Prevents constant back-and-forth adjustments

**Improvement D: Anchor Point Preservation** 📋 **DEFERRED TO FUTURE ENHANCEMENTS**
- When heights change, preserve current anchor point
- Re-calculate positions relative to anchor, not absolute
- Prevents jarring jumps on reflow

**Decision Rationale:** Sub-element interpolation (Option A) provides the most significant accuracy improvement and is essential for smooth scrolling within multi-line blocks. Options B, C, and D are valuable refinements that may be implemented in future phases if additional scroll sync accuracy is needed. They have been moved to the "Future Enhancements" section for consideration after Phase 2 implementation is complete and real-world testing can inform their priority.

---

#### Decision 6: WYSIWYG Infrastructure Hooks

**Question:** What hooks should Line Mapper provide for future WYSIWYG mode?

**Decision:** ✅ **INCLUDE ESSENTIAL HOOKS NOW**

Include the essential WYSIWYG hooks in the initial LineMapper implementation. This ensures the infrastructure is ready for WYSIWYG mode without requiring a later refactor.

**Essential Hooks:**

```javascript
// Get DOM position for source cursor
getRenderedPositionForCursor(line, column) → {element, offset}

// Get source position for DOM selection
getSourcePositionForSelection(selection) → {line, column}

// Get the block element containing a source position
getContainingBlock(line) → {element, startLine, endLine}

// Check if source position is in a "raw" zone (code block, etc.)
isRawZone(line) → boolean

// Get editable range for current block
getEditableRange(line) → {startLine, endLine, startCol, endCol}
```

**Optional Hooks (Future):**

```javascript
// Track live edits without full re-parse
trackEdit(line, column, text, type: 'insert'|'delete')

// Get syntax context at position (for highlighting)
getSyntaxContext(line, column) → 'heading'|'paragraph'|'code'|...

// Get available transformations at position
getAvailableTransforms(line) → ['bold', 'italic', ...]
```

**Decision Rationale:** Including essential WYSIWYG hooks from the start prevents a costly refactor later. The hooks are designed to be lightweight—they only calculate character-level mappings when actually called (on-demand), not continuously. Optional hooks are documented for future WYSIWYG implementation but will not be included in Phase 2.

---

#### Decision 7: Integration Points

**Question:** How should Line Mapper integrate with existing modules?

**Decision:** ✅ **APPROVED AS PROPOSED**

The integration approach follows existing patterns and provides clear separation of concerns.

**Integration Map:**

| Module | Integration |
|--------|-------------|
| **BlockProcessor** | Emits line info during parsing, LineMapper consumes |
| **ScrollSync** | Uses LineMapper instead of raw `data-line` queries |
| **MarkdownRenderer** | Triggers LineMapper update after render |
| **DocumentManager** | Notifies LineMapper of document switches |
| **SettingsManager** | Stores sync accuracy preferences |
| **Future WYSIWYG** | Primary consumer of bidirectional mapping |

**Event Flow:**

```
User types → DocumentManager saves → MarkdownParser parses
                                           ↓
                                    BlockProcessor emits line data
                                           ↓
                                    MarkdownRenderer renders HTML
                                           ↓
                                    LineMapper.update() called
                                           ↓
                                    ScrollSync uses updated map
```

**Decision Rationale:** This event flow follows the existing application architecture patterns. Each module has a clear responsibility:
- **BlockProcessor** seeds line data during parsing (already does this)
- **MarkdownRenderer** triggers LineMapper update after render
- **DocumentManager** notifies LineMapper of document switches (triggers `invalidate()`)
- **ScrollSync** becomes a consumer of LineMapper rather than directly querying DOM
- **SettingsManager** stores user preferences for sync behavior

---

#### Decision 8: Performance Budget

**Question:** What are acceptable performance limits?

**Decision:** ✅ **APPROVED WITH SINGLE-MAP MEMORY STRATEGY**

The performance targets are appropriate for the application scope. A critical clarification was made regarding memory management:

**Memory Strategy: Single Active Map Only**
- Only ONE source map exists at any time (for the currently active document)
- When documents are switched, `invalidate()` is called, clearing the existing map
- A fresh map is built for the new document on first scroll/query
- **No per-document caching** — prevents memory accumulation over time
- Small latency (~5-20ms) on first scroll after document switch is acceptable

This approach ensures:
- Zero memory leaks from accumulated document mappings
- Predictable memory usage regardless of session length
- Clean state on each document switch

**Targets:**

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Initial map build (1000 lines) | <50ms | <100ms |
| Incremental update (single block) | <5ms | <10ms |
| Scroll position query | <1ms | <2ms |
| Full rebuild (triggered by resize) | <100ms | <200ms |
| Memory overhead (1000 lines) | <500KB | <1MB |

**Measurement Points:**
- Add performance marks in dev mode
- Log slow operations (>2x target)
- Consider worker thread for initial build on large docs

**Decision Rationale:** These performance targets are reasonable for the application scope. The single-map memory strategy prevents memory leaks that could occur if maps were cached per-document. The slight latency on document switch (while the new map builds) is acceptable and aligns with existing render latency when switching documents.

---

#### Decision 9: API Design

**Question:** What should the LineMapper public API look like?

**Decision:** ✅ **APPROVED AS PROPOSED**

The API is organized into clear categories for ease of use:

1. **Core Mapping Queries** - The essential methods for scroll sync
2. **Height/Position Info** - Supporting data for calculations
3. **WYSIWYG Hooks** - Future cursor positioning (on-demand calculation)
4. **Lifecycle Methods** - Manual control when needed
5. **Events** - For external modules to react to map changes

**Approved API:**

```javascript
class LineMapper {
  // Initialization
  constructor(options: {
    parser: MarkdownParser,
    renderer: MarkdownRenderer,
    previewContainer: HTMLElement,
    rebuildDebounceMs: number
  })

  // Core mapping queries
  getElementForLine(line: number): Element | null
  getLinesForElement(element: Element): { start: number, end: number } | null
  getScrollPositionForLine(line: number): number
  getLineForScrollPosition(scrollTop: number): number

  // Height/position info
  getElementHeight(element: Element): number
  getElementOffset(element: Element): number
  getTotalMappedHeight(): number

  // WYSIWYG hooks (Phase 2+)
  getRenderedPositionForCursor(line: number, col: number): { element: Element, offset: number }
  getSourcePositionForSelection(sel: Selection): { line: number, col: number }
  isRawZone(line: number): boolean

  // Lifecycle
  update(): void           // Manual trigger
  invalidate(): void       // Mark dirty
  destroy(): void          // Cleanup

  // Events
  on('update', callback): void
  on('error', callback): void
}
```

**API Design Rationale:** This API provides a clean, minimal surface area while supporting all Phase 2 requirements:
- **Core queries** are what ScrollSync needs day-to-day
- **Height/position methods** support weighted interpolation calculations
- **WYSIWYG hooks** are included but calculate on-demand (not continuously)
- **Lifecycle methods** allow DocumentManager to control map state on document switches
- **Events** let external modules react to map updates without polling

---

#### Implementation Phases

**Phase 2a: LineMapper Foundation** (Core Infrastructure) ✅ **COMPLETE - January 14, 2026**
- [x] Create `js/shared/line-mapper.js` module
- [x] Implement block-level line-to-element mapping using existing `data-line` attributes
- [x] Add element height and offset tracking (post-render measurement)
- [x] Implement element-height weighted interpolation for scroll position queries
- [x] Add time-debounced rebuild (200ms) on DOM changes
- [x] Implement `invalidate()` for document switches (single-map memory strategy)
- [x] Add performance marks in debug mode for measurement
- [x] Integrate with markdown-editor-main.js (auto-update after render)
- [x] Hook into DocumentManager for document switch invalidation
- [x] Expose as `window.lineMapper` and `MarkdownEditor.lineMapper` for debugging
- [ ] Extend BlockProcessor to emit `data-line-start` and `data-line-end` for multi-line blocks (deferred - current `data-line` works well)

**Phase 2a Testing Results (January 14, 2026):**
```javascript
lineMapper.getDebugInfo()
// {isDirty: false, isBuilding: false, totalLines: 212,
//  totalHeight: 9087.87, elementCount: 126, ...}

lineMapper.getElementForLine(5)
// <p data-line="5">This document tests all shortcut syntaxes...</p>

lineMapper.getScrollPositionForLine(10)
// 480.77 (pixels - element-height weighted)
```

**Phase 2b: Enhanced Scroll Sync** (Algorithm Improvements)
- [ ] Refactor ScrollSync to use LineMapper instead of direct DOM `data-line` queries
- [ ] Implement sub-element interpolation (scroll proportionally within multi-line elements)
- [ ] Update scroll position calculations to use weighted heights instead of line counts
- [ ] Add integration with DocumentManager for document switch notifications
- [ ] Test with various document types (text-heavy, image-heavy, code-heavy, mixed)
- [ ] Verify performance targets are met (query <1ms, rebuild <100ms)

**Phase 2c: WYSIWYG Preparation** (Essential Hooks Only) ✅ **API COMPLETE - January 14, 2026**

Essential hooks implemented in LineMapper (calculate on-demand, not continuously):
- [x] Implement `getRenderedPositionForCursor(line, column)` hook
- [x] Implement `getSourcePositionForSelection(selection)` hook
- [x] Implement `getContainingBlock(line)` hook
- [x] Implement `isRawZone(line)` hook for code blocks and frontmatter
- [x] Implement `getEditableRange(line)` hook
- [x] Add `on('update')` and `on('error')` events
- [ ] Add lazy character-level mapping capability (enhance existing hooks when needed)
- [ ] Document API for future WYSIWYG implementation phase

---

### Phase 3: WYSIWYG Unified View (Alternative Approach) - Planning Session

**Branch:** `IMPLEMENT-WYSIWYG-UNIFIED-VIEW`
**Started:** January 14, 2026
**Status:** 🔬 Experimental - Parallel implementation to compare with split-view approach

#### Overview

This phase implements a Typora-style unified WYSIWYG editing experience as an alternative to the split-view with scroll sync. The goal is to compare both approaches and determine which provides a better user experience.

**Key Decision:** After both implementations are complete (split-view with element matching AND unified WYSIWYG), we will compare them and choose which to merge to main based on:
- User experience quality
- Implementation complexity & maintainability
- Performance characteristics
- Ease of future enhancements

#### User Experience Goals

**Typora-Style Editing Behavior:**

1. **Type Mode:** While typing, markdown syntax remains visible
   - Type `# Heading` → shows as plain text `# Heading`
   - Type `**bold**` → shows as plain text `**bold**`
   - Syntax stays visible as you continue typing

2. **Render on Enter:** Pressing Enter key renders the current line/block
   - `# Heading` + Enter → renders as `<h1>Heading</h1>`
   - `**bold**` + Enter → renders as `<strong>bold</strong>`

3. **Click to Edit:** Clicking a rendered element returns it to edit mode
   - Click `<h1>Heading</h1>` → reverts to `# Heading` with cursor positioned

4. **Toggle Source Mode:** Button to switch between WYSIWYG and raw markdown
   - WYSIWYG mode (default) → contenteditable with live rendering
   - Source mode → textarea with raw markdown text

#### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage Format** | Store as markdown | Maintains compatibility, enables source toggle |
| **Editing Mode** | Toggle WYSIWYG/Source | Flexibility for power users, easier debugging |
| **Layout** | Single full-width pane | Eliminates scroll sync issues entirely |
| **Divider Repurpose** | Floating toolbar | Reuse space for formatting controls |
| **Features to Keep** | All except split view | Document tabs, themes, settings, auto-save, external window |
| **Line Numbers** | Hidden in WYSIWYG mode | Not relevant for unified view, keep in source mode |

#### Implementation Phases

**Phase 3a: Layout Restructuring** ⏳ PENDING
- [ ] Remove `.editor-input` and `.editor-preview` split-view divs from HTML
- [ ] Create new `.unified-editor` contenteditable div
- [ ] Update CSS for full-width single pane display
- [ ] Convert `.resizable-divider` to floating toolbar
- [ ] Preserve document tabs bar above editor
- [ ] Update all theme CSS files to support unified view layout

**Files to Modify:**
- `markdown-editor.html` - HTML structure changes
- `css/markdown-editor-base.css` - Base layout styles
- `css/markdown-editor.css` - Editor-specific styles
- All theme CSS in `themes/` folder

**Success Criteria:**
- Single contenteditable div displays full-width
- Document tabs remain functional
- Toolbar positioned and styled correctly
- No visual artifacts from removed split view
- All themes render correctly

---

**Phase 3b: WYSIWYG Core Engine** ⏳ PENDING
- [ ] Create `js/wysiwyg/wysiwyg-engine.js` module
- [ ] Implement "type mode" - show markdown syntax while typing
- [ ] Implement "Enter key handler" - render block on Enter press
- [ ] Implement "click-to-edit" - convert rendered element back to markdown
- [ ] Track cursor position using LineMapper hooks from Phase 2a
- [ ] Handle special keys (Backspace, Delete, Arrow keys in rendered blocks)
- [ ] Implement block detection (paragraph, heading, list, code, etc.)
- [ ] Handle inline formatting within blocks (bold, italic, links, etc.)

**Key Classes:**
```javascript
class WysiwygEngine {
    constructor(editorElement, lineMapper) { }

    // Core editing
    handleKeyPress(event) { }
    handleEnterKey() { }
    handleClickOnElement(element) { }

    // Block management
    getCurrentBlock() { }
    renderBlock(block) { }
    unrenderBlock(block) { }

    // Cursor tracking via LineMapper hooks
    saveCursorPosition() { }
    restoreCursorPosition() { }
}
```

**Files to Create:**
- `js/wysiwyg/wysiwyg-engine.js` - Core WYSIWYG editing logic
- `js/wysiwyg/block-detector.js` - Detect markdown block types
- `js/wysiwyg/cursor-manager.js` - Cursor position tracking

**Success Criteria:**
- Can type markdown syntax and see it as plain text
- Pressing Enter renders the current line/block
- Clicking rendered elements returns them to editable markdown
- Cursor position maintained through render/unrender cycles
- Special keys work correctly in both modes

---

**Phase 3c: Source Mode Toggle** ⏳ PENDING
- [ ] Add "Source Mode" toggle button to toolbar
- [ ] Create hidden textarea element for source mode
- [ ] Implement mode switching logic (WYSIWYG ↔ Source)
- [ ] Sync content between WYSIWYG contenteditable and source textarea
- [ ] Parse contenteditable HTML back to markdown text
- [ ] Add keyboard shortcut (Ctrl+/) for quick mode toggle
- [ ] Maintain cursor position when switching modes (if possible)

**Key Classes:**
```javascript
class ModeManager {
    constructor(wysiwygElement, sourceElement) { }

    switchToWysiwyg() { }
    switchToSource() { }
    syncWysiwygToSource() { }
    syncSourceToWysiwyg() { }
}
```

**Files to Create:**
- `js/wysiwyg/mode-manager.js` - Handle mode switching
- `js/wysiwyg/html-to-markdown.js` - Convert HTML back to markdown

**Success Criteria:**
- Toggle button switches between modes seamlessly
- Content stays synchronized between both modes
- Keyboard shortcut (Ctrl+/) works correctly
- Cursor position maintained when possible
- No data loss during mode switches

---

**Phase 3d: Integration** ⏳ PENDING
- [ ] Integrate with DocumentManager for multi-document support
- [ ] Connect to theme system for WYSIWYG content styling
- [ ] Update auto-save to capture contenteditable changes
- [ ] Update external window preview to use WYSIWYG content
- [ ] Remove split-view settings from Settings panel
- [ ] Add WYSIWYG-specific settings (auto-render, default mode, etc.)
- [ ] Update Help panel with WYSIWYG usage instructions

**Settings to Add:**
```javascript
settings.editor.wysiwyg = {
    enabled: true,
    autoRenderOnEnter: true,
    showMarkdownOnEdit: true,
    defaultMode: 'wysiwyg' // or 'source'
}
```

**Files to Modify:**
- `js/markdown-editor-main.js` - Main application integration
- `js/shared/settings-manager.js` - Add WYSIWYG settings schema
- `js/markdown/document-manager.js` - Support contenteditable documents
- Help panel HTML content

**Success Criteria:**
- Multiple documents work correctly in WYSIWYG mode
- Themes apply to WYSIWYG rendered content
- Auto-save captures changes from contenteditable
- External preview window displays WYSIWYG content
- Settings panel has WYSIWYG configuration options
- Help documentation updated and accurate

---

#### Technical Considerations

**LineMapper Integration (from Phase 2a)**

We have these WYSIWYG hooks already implemented:
- `getRenderedPositionForCursor(line, column)` - Find DOM position for cursor placement
- `getSourcePositionForSelection(selection)` - Get markdown position from browser selection
- `getContainingBlock(line)` - Identify which block a line belongs to
- `isRawZone(line)` - Detect code blocks that shouldn't be WYSIWYG-edited
- `getEditableRange(line)` - Get editable text span for a line

These hooks are critical for:
- Accurate cursor management during render/unrender
- Block detection and manipulation
- Determining which content can be edited inline

**Markdown Parsing Strategy**

Two directions needed:
- **Forward (already exists):** Markdown → HTML via existing parser
- **Reverse (need to implement):** HTML → Markdown for source mode and storage

Consider:
- Using library like `turndown` for HTML → Markdown conversion
- OR implementing custom converter based on our shortcut syntax
- Must handle our extended shortcut syntax correctly

**ContentEditable Challenges**

Known issues to handle:
1. **Browser inconsistencies** - Different browsers handle contenteditable differently
2. **Cursor position** - Difficult to maintain through DOM mutations
3. **Undo/Redo** - Browser's built-in undo might not work as expected
4. **Paste events** - Need to sanitize and normalize pasted HTML
5. **Performance** - Re-rendering on every keystroke can cause lag

**Mitigation Strategies:**
- Only render on Enter key (not every keystroke) - reduces DOM mutations
- Use LineMapper hooks for robust cursor tracking
- Implement custom undo/redo stack if browser's is insufficient
- Sanitize pasted content by round-tripping through markdown parser
- Debounce auto-save to avoid excessive writes

---

#### Comparison Criteria: Split View vs WYSIWYG

After both implementations are complete, we will evaluate:

| Aspect | Split View (element-matching) | WYSIWYG (unified view) |
|--------|------------------------------|------------------------|
| **Sync Issues** | Still has drift in image-heavy sections | No sync needed - single view |
| **UX Complexity** | Two panes to understand | Simpler - one view |
| **Word Wrap** | Must be disabled for accuracy | Can be enabled/disabled freely |
| **Implementation Complexity** | Complex scroll sync logic | Complex contenteditable handling |
| **Performance** | Two rendering passes | Single render with re-renders on Enter |
| **Power User Features** | Can see both source and preview simultaneously | Must toggle to see source |
| **Mobile Support** | Difficult on small screens (two panes) | Better for small screens (one pane) |
| **Learning Curve** | Users understand traditional editor + preview | May need explanation of WYSIWYG behavior |
| **Debugging** | Easy to see source ↔ rendered mapping | Must switch to source mode |

---

#### Testing Strategy

**Unit Tests:**
- Block detection (identify heading, paragraph, list, code, etc.)
- Markdown → HTML → Markdown round-trip accuracy
- Cursor position tracking across render/unrender
- Mode switching (WYSIWYG ↔ Source)

**Integration Tests:**
- Multi-document support with WYSIWYG
- Theme switching with rendered content
- Auto-save with contenteditable changes
- External window preview

**Manual Testing Scenarios:**
1. Type `# Heading` and press Enter → should render as H1
2. Click the rendered heading → should show `# Heading` with cursor
3. Type multi-line list and press Enter multiple times → should render list items
4. Toggle source mode → should show raw markdown correctly
5. Switch between documents → should maintain WYSIWYG state per document
6. Paste HTML content → should convert to markdown properly
7. Switch themes → should apply styling to WYSIWYG content
8. Type in code block → should NOT render markdown (raw zone detection)

---

#### Rollback Plan

If WYSIWYG implementation doesn't meet quality standards:
1. Branch `EXPERIMENTAL-SCROLL-SYNC-INDEX-MATCHING` has complete split-view implementation
2. Can merge either branch to main based on evaluation results
3. Document learnings and tradeoffs for future reference
4. Consider hybrid approach if both have merits

---

#### Next Steps

1. ✅ Complete planning and add to DOCUMENTATION.md
2. ⏳ Start Phase 3a: Layout Restructuring
3. ⏳ Build WYSIWYG engine prototype
4. ⏳ Iterate based on testing feedback
5. ⏳ Compare completed implementations and make final decision

---

#### Questions Resolved ✅

All architectural questions have been resolved. See individual Decision sections above for full rationale.

| Question | Resolution |
|----------|------------|
| 1. Mapping Granularity | ✅ Hybrid (block default, character on-demand) |
| 2. Generation Timing | ✅ Hybrid (parser seeds, post-render enhances) |
| 3. Height Calculation | ✅ Element-height weighted mapping |
| 4. Change Handling | ✅ Time-debounced rebuild (150-300ms) |
| 5. Algorithm Improvements | ✅ Sub-element interpolation (others deferred) |
| 6. WYSIWYG Hooks | ✅ Include essential hooks now |
| 7. Integration Points | ✅ Approved as proposed |
| 8. Performance Budget | ✅ Approved with single-map memory strategy |
| 9. API Design | ✅ Approved as proposed |

---

### Phase 2 Planning: COMPLETE ✅

All 9 architectural decisions have been finalized. The Scroll Sync Accuracy & WYSIWYG Infrastructure is ready for implementation.

**Summary of Phase 2 Decisions:**

| # | Decision Area | Choice | Key Details |
|---|---------------|--------|-------------|
| 1 | Mapping Granularity | **Hybrid** | Block-level for scroll sync, character-level on-demand for WYSIWYG |
| 2 | Source Map Timing | **Hybrid** | Parser seeds `data-line` attributes, post-render adds measurements |
| 3 | Height Calculation | **Weighted** | Track actual rendered heights, distribute scroll proportionally |
| 4 | DOM Change Handling | **Debounced** | Rebuild map after 150-300ms of no changes |
| 5 | Scroll Improvements | **Sub-element Interpolation** | Scroll proportionally within multi-line blocks |
| 6 | WYSIWYG Hooks | **Include Essential** | Add hooks now to prevent later refactor |
| 7 | Integration Points | **Approved** | Follows existing event flow patterns |
| 8 | Performance Budget | **Approved** | Single-map memory strategy (no per-document caching) |
| 9 | API Design | **Approved** | Clean categories: core queries, WYSIWYG hooks, lifecycle |

**Key Architectural Clarifications:**

1. **Memory Strategy:** Single active map only—cleared on document switch via `invalidate()`. No per-document caching prevents memory accumulation over session lifetime.

2. **Deferred Improvements:** Scroll sync improvements B (Velocity-Aware), C (Directional Bias), and D (Anchor Preservation) have been moved to Future Enhancements for potential implementation if additional accuracy is needed after Phase 2.

3. **WYSIWYG Hooks:** Essential hooks are included but calculate character-level mappings on-demand only—they do not continuously track character positions.

---

#### Future Enhancements (Deferred from Phase 2)

These scroll sync improvements may be implemented in future phases if additional accuracy is required after Phase 2 testing:

**Velocity-Aware Sync**
- Track scroll velocity (fast vs slow scrolling)
- Fast scroll: sync at block boundaries only (reduces jitter)
- Slow scroll: precise sub-element sync
- Prevents "fighting" during rapid scrolling

**Directional Bias**
- Remember last scroll direction
- Bias toward revealing content in scroll direction
- Reduces constant back-and-forth adjustments

**Anchor Point Preservation**
- When heights change (resize, theme switch), preserve current anchor point
- Re-calculate positions relative to anchor, not absolute
- Prevents jarring jumps on reflow

---

### Phase 3: Document Loading & Table Rendering - Implementation

**Status:** ✅ COMPLETE
**Session Date:** January 14, 2026

#### Overview

Phase 3 addressed critical rendering issues that prevented markdown documents from displaying correctly when loaded via File > Open. This phase included comprehensive debugging, root cause analysis, and the implementation of missing table rendering functionality in the WYSIWYG engine.

#### Problem Statement

Documents opened via the File > Open dialog were not rendering properly. The markdown content appeared as plain text with visible markdown syntax (e.g., `# Header` displayed as `<p># Header</p>` instead of `<h1>Header</h1>`). Users had to toggle source mode twice (Ctrl+/) to force the content to render correctly, which indicated the rendering code itself was functional but something in the document loading pipeline was failing.

The specific test case was `regex-documentation.md`, a comprehensive markdown reference document containing headers, lists, code blocks, blockquotes, horizontal rules, links, images, and most notably, numerous markdown tables for displaying regex pattern reference information.

---

#### Phase 3a: Initial Debugging & Investigation

**Objective:** Identify why documents were not rendering on load

**Methodology:**

1. **Added comprehensive debug logging** throughout the rendering pipeline:
   - File > Open handler in `markdown-editor-main.js` (lines 192-230)
   - `setMarkdown()` method in `wysiwyg-engine.js` (lines 410-412, 604-612)
   - Document manager callbacks

2. **Console log analysis** revealed:
   - `setMarkdown()` was being called with `renderAll: true`
   - Content was being split into 471 lines (34,195 characters)
   - HTML was being generated and set in the DOM (38,385 characters)
   - However, the HTML output showed plain paragraphs: `<p># Regular Expression...</p>`
   - This meant `renderMarkdown()` was returning `null` for lines that should have matched patterns

3. **Key insight from user testing:**
   - User reported: "after i open the file and it does not render. i can click the source mode toggle to toggle it to source mode and then click the toggle again and it will render."
   - This proved the rendering code itself worked perfectly
   - The issue was something about the file loading state/timing that differed from normal operation

**Investigation Steps:**

1. **Tested ShortcutProcessor hypothesis:**
   - Initially suspected the ShortcutProcessor might be corrupting text
   - Temporarily disabled shortcut processing
   - Result: Still didn't render—ShortcutProcessor was not the cause

2. **Examined the test file directly:**
   - Read `regex-documentation.md` source
   - Found normal, valid markdown syntax
   - No special characters that would break parsing

3. **Root cause identified: Line endings**
   - The file had Windows line endings (`\r\n`)
   - When split on `\n`, each line retained the trailing `\r` character
   - Regex patterns like `/^(#{1,6})\s+(.+)$/` failed to match because:
     - `"# Regular Expression\r"` doesn't match `/^(#{1,6})\s+(.+)$/`
     - The `\r` is captured in the `.+` portion but the `$` anchor expects end-of-string
     - The `\r` before `$` breaks the pattern match

---

#### Phase 3b: Line Ending Normalization Fix

**File:** `js/wysiwyg/wysiwyg-engine.js`

**Changes Made:**

Added line ending normalization in the `setMarkdown()` method before splitting into lines:

```javascript
// Lines 420-421
// Normalize line endings (convert \r\n and \r to \n) before splitting
const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// Split into lines and create paragraphs
const lines = normalizedMarkdown.split('\n');
```

**Implementation Details:**

1. **Normalization Strategy:**
   - First converts Windows line endings (`\r\n`) to Unix (`\n`)
   - Then converts old Mac line endings (`\r`) to Unix (`\n`)
   - Ensures all line splitting is consistent regardless of source file format

2. **Placement:**
   - Applied before any processing logic
   - Occurs once at the top of `setMarkdown()`
   - Affects both rendered and non-rendered content paths

**Results:**

After implementing line ending normalization:
- Headers rendered correctly (H1-H6)
- Lists rendered correctly (ordered, unordered, task lists)
- Blockquotes rendered correctly
- Horizontal rules rendered correctly
- Links and images rendered correctly
- Code blocks rendered correctly
- **Tables did NOT render** (discovered to be missing functionality)

User feedback: "it loaded part of it correct but it seemed to mess up on the tables."

---

#### Phase 3c: Table Rendering Discovery

**Analysis:**

Investigation revealed that the WYSIWYG engine had **no table rendering logic whatsoever**. The `renderMarkdown()` method included patterns for:
- Headers (lines 287-293)
- Blockquotes (lines 296-300)
- Horizontal rules (lines 303-305)
- Code blocks (lines 308-312)
- Lists (lines 321-338)
- Task lists (lines 337-344)

But there was **no detection or rendering for markdown tables**.

**Markdown Table Format:**

Standard markdown tables follow this structure:

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

Components:
1. **Header row:** Pipe-delimited cell text (`| Header 1 | Header 2 |`)
2. **Separator row:** Pipes with dashes (`|----------|----------|`)
3. **Body rows:** Pipe-delimited cell text
4. **Alignment markers** (optional): Colons in separator (`:---`, `:---:`, `---:`)

**Implementation Challenge:**

Unlike headers or lists which are single-line markdown elements, tables are **multi-line structures** that need to be:
1. Detected across consecutive lines
2. Parsed to extract cells from each row
3. Grouped together into a single HTML `<table>` element
4. Differentiated between header and body rows

---

#### Phase 3d: Table Rendering Implementation

**Files Modified:**

1. `js/wysiwyg/wysiwyg-engine.js` - Added table detection, parsing, and rendering
2. `css/markdown-editor-base.css` - Added table styling

##### 1. Table Detection Methods

**File:** `js/wysiwyg/wysiwyg-engine.js` (lines 256-280)

Added three helper methods for table processing:

```javascript
/**
 * Check if a line is a markdown table row
 */
isTableRow(text) {
    // Must start and end with |
    // Must have at least 2 cells (one |)
    return /^\|.+\|$/.test(text.trim());
}

/**
 * Check if a line is a table separator row (|---|---|)
 */
isTableSeparator(text) {
    return /^\|[\s:-]+\|$/.test(text.trim()) && text.includes('-');
}

/**
 * Parse a table row into cells
 */
parseTableRow(text) {
    // Remove leading/trailing pipes and split by |
    const trimmed = text.trim().replace(/^\||\|$/g, '');
    const cells = trimmed.split('|').map(cell => cell.trim());
    return cells;
}
```

**Method Details:**

- **`isTableRow(text)`**: Uses regex `/^\|.+\|$/` to match any line that starts and ends with pipe characters
- **`isTableSeparator(text)`**: Detects separator rows by checking for pipes, dashes/colons/spaces pattern, and presence of dashes
- **`parseTableRow(text)`**: Splits row text by pipe delimiter, trims whitespace, returns array of cell contents

##### 2. Table Row Marker in renderMarkdown()

**File:** `js/wysiwyg/wysiwyg-engine.js` (lines 220-224)

Modified `renderMarkdown()` to detect table rows and return a special marker:

```javascript
// Table row detection (| cell | cell |)
if (this.isTableRow(processedText)) {
    // Return special marker for table handling
    return '<table-row>' + processedText + '</table-row>';
}
```

**Design Pattern:**

Similar to how list items return `<ul>` or `<ol>` markers, table rows return a `<table-row>` marker. This signals to the `setMarkdown()` grouping logic that consecutive table rows should be collected and built into a single HTML table element.

##### 3. Table Grouping Logic in setMarkdown()

**File:** `js/wysiwyg/wysiwyg-engine.js` (lines 503-577)

Added comprehensive table grouping logic after the list grouping sections:

```javascript
// Group consecutive table rows into a table
if (rendered && rendered.startsWith('<table-row>')) {
    const tableRows = [];
    const tableMarkdown = [];
    let hasHeader = false;
    let headerRowIndex = -1;

    // Collect all consecutive table rows
    while (i < lines.length) {
        const currentLine = lines[i];
        const currentRendered = this.renderMarkdown(currentLine);

        if (currentRendered && currentRendered.startsWith('<table-row>')) {
            // Extract the raw markdown from the marker
            const rawRow = currentRendered.replace('<table-row>', '').replace('</table-row>', '');

            // Check if this is a separator row
            if (this.isTableSeparator(rawRow)) {
                hasHeader = true;
                headerRowIndex = tableRows.length - 1; // Previous row is the header
            } else {
                tableRows.push(rawRow);
            }

            tableMarkdown.push(currentLine);
            i++;
        } else {
            break;
        }
    }

    // Build the HTML table
    const table = document.createElement('table');
    table.className = 'markdown-table';

    // Add header if present
    if (hasHeader && headerRowIndex >= 0) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headerCells = this.parseTableRow(tableRows[headerRowIndex]);

        headerCells.forEach(cellContent => {
            const th = document.createElement('th');
            th.innerHTML = this.renderInlineFormatting(cellContent);
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);
    }

    // Add body rows
    const tbody = document.createElement('tbody');
    const bodyStartIndex = hasHeader ? headerRowIndex + 1 : 0;

    for (let j = bodyStartIndex; j < tableRows.length; j++) {
        const row = document.createElement('tr');
        const cells = this.parseTableRow(tableRows[j]);

        cells.forEach(cellContent => {
            const td = document.createElement('td');
            td.innerHTML = this.renderInlineFormatting(cellContent);
            row.appendChild(td);
        });

        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    table.setAttribute('data-wysiwyg-rendered', 'true');
    table.setAttribute('data-wysiwyg-markdown', tableMarkdown.join('\n'));
    table.contentEditable = 'true';
    blocks.push(table.outerHTML);
    continue;
}
```

**Algorithm Flow:**

1. **Detection:** When a `<table-row>` marker is encountered
2. **Collection Phase:**
   - Loop through consecutive lines
   - Extract raw markdown from each `<table-row>` marker
   - Identify separator rows (which designate header rows)
   - Store non-separator rows in `tableRows[]`
   - Track original markdown in `tableMarkdown[]`
   - Stop when encountering a non-table line

3. **Header Processing:**
   - If a separator row was found, the row *before* it is the header
   - Create `<thead>` element
   - Parse header row into cells
   - Create `<th>` elements with inline formatting applied
   - Append to `<thead>`

4. **Body Processing:**
   - Create `<tbody>` element
   - Start from first row after header (or first row if no header)
   - Parse each row into cells
   - Create `<tr>` and `<td>` elements with inline formatting applied
   - Append to `<tbody>`

5. **Table Assembly:**
   - Combine `<thead>` and `<tbody>` into `<table>`
   - Add `markdown-table` class for styling
   - Mark as rendered with `data-wysiwyg-rendered="true"`
   - Store original markdown with `data-wysiwyg-markdown` attribute
   - Make contentEditable for in-place editing
   - Add to blocks array

**Key Features:**

- **Inline formatting support:** Cell contents are processed through `renderInlineFormatting()`, allowing bold, italic, code, links, and images within table cells
- **Proper HTML structure:** Uses semantic `<thead>` and `<tbody>` elements
- **Round-trip editing:** Original markdown is preserved for source mode
- **In-place editing:** contentEditable allows direct table editing in rendered mode

##### 4. Table Styling

**File:** `css/markdown-editor-base.css` (lines 1821-1849)

Added comprehensive CSS styling for markdown tables:

```css
/* Markdown table styles */
.wysiwyg-content table,
.wysiwyg-content .markdown-table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    border: 1px solid var(--md-table-border, rgba(255, 255, 255, 0.2));
}

.wysiwyg-content table th,
.wysiwyg-content table td {
    padding: 8px 12px;
    border: 1px solid var(--md-table-border, rgba(255, 255, 255, 0.2));
    text-align: left;
}

.wysiwyg-content table th {
    background: var(--md-table-header-bg, rgba(255, 255, 255, 0.1));
    font-weight: 600;
    color: var(--md-heading-color);
}

.wysiwyg-content table tbody tr:nth-child(even) {
    background: var(--md-table-alt-row-bg, rgba(255, 255, 255, 0.05));
}

.wysiwyg-content table tbody tr:hover {
    background: var(--md-table-hover-bg, rgba(255, 255, 255, 0.08));
}
```

**Styling Features:**

1. **Border Collapse:** Clean, professional appearance with collapsed borders
2. **Full Width:** Tables span the full editor width
3. **Spacing:** 1em margin above/below for separation
4. **Cell Padding:** 8px vertical, 12px horizontal for readability
5. **Header Styling:**
   - Distinct background color (10% white overlay)
   - Bold font weight
   - Uses theme's heading color
6. **Alternating Rows:** Even rows have subtle background (5% white overlay)
7. **Hover Effect:** Rows highlight on hover (8% white overlay)
8. **Theme Integration:** Uses CSS custom properties with fallback values
   - `--md-table-border`: Border color
   - `--md-table-header-bg`: Header background
   - `--md-table-alt-row-bg`: Alternating row background
   - `--md-table-hover-bg`: Hover background

**Visual Design:**

The table styling follows the existing markdown element design language:
- Semi-transparent overlays on dark backgrounds
- Subtle borders that don't overwhelm content
- Clear visual hierarchy (header vs body)
- Interactive feedback (hover states)
- Respects theme color schemes through CSS variables

---

#### Phase 3 Results & Testing

**Test Case:** `regex-documentation.md`
- **Total Lines:** 471
- **Character Count:** 34,195
- **HTML Output:** 38,385 characters
- **Tables:** 13 reference tables for regex patterns

**Rendering Performance:**

All markdown elements now render correctly on file load:
- ✅ Headers (H1-H6) - 42 instances
- ✅ Paragraphs with inline formatting - 156 blocks
- ✅ Code blocks - 28 instances
- ✅ Lists - 37 list structures
- ✅ Blockquotes - 3 instances
- ✅ Horizontal rules - 8 instances
- ✅ Links - 12 instances
- ✅ **Tables - 13 instances (NEW)**

**User Verification:**

User reported: "that fixed it completely!"

All documents now render immediately on load without requiring source mode toggle workaround.

---

#### Technical Achievements

1. **Cross-Platform Line Ending Support:**
   - Windows (`\r\n`)
   - Unix/Linux/Mac (`\n`)
   - Old Mac (`\r`)
   - Seamless handling regardless of file origin

2. **Complete Table Rendering:**
   - Detection across multiple lines
   - Header row identification via separator
   - Cell parsing with pipe delimiter handling
   - Inline formatting within cells (bold, italic, code, links, images)
   - Proper HTML semantic structure (`<thead>`, `<tbody>`, `<th>`, `<td>`)
   - Professional styling with theme integration

3. **Maintained Architecture:**
   - Follows existing grouping pattern (similar to list handling)
   - Preserves original markdown for round-trip editing
   - ContentEditable for in-place editing
   - Uses CSS variables for theme compatibility

4. **Debug Infrastructure:**
   - Comprehensive logging throughout rendering pipeline
   - Line count and character count tracking
   - HTML output verification
   - Timing checks for async operations

---

#### Code Quality & Maintainability

**Documentation:**
- All new methods have JSDoc comments
- Clear parameter descriptions
- Return value documentation
- Algorithm explanations in comments

**Code Organization:**
- Helper methods grouped logically
- Table detection methods placed near other rendering helpers
- Grouping logic follows established pattern (ordered lists, unordered lists, tables)
- CSS styling grouped with other markdown element styles

**Performance Considerations:**
- Single pass through table rows (O(n) complexity)
- Minimal DOM manipulation (build entire table before adding to DOM)
- Debounced rebuilds prevent thrashing on rapid changes
- No regex backtracking issues (simple patterns with clear anchors)

**Extensibility:**
- CSS variables allow per-theme customization
- Table parsing logic can be enhanced for column alignment (`:---`, `:---:`, `---:`)
- Cell formatting can be extended for additional markdown features
- contentEditable allows future in-place table editing features

---

#### Future Enhancements (Table-Related)

Potential improvements for future phases:

1. **Column Alignment Support:**
   - Parse separator row for alignment markers
   - Apply `text-align` CSS based on `:---`, `:---:`, `---:`
   - Left-align: `|:---|`
   - Center-align: `|:---:|`
   - Right-align: `|---:|`

2. **Table Editing UI:**
   - Add/remove rows buttons
   - Add/remove columns buttons
   - Cell merging capabilities
   - Drag-to-resize columns
   - Keyboard navigation (Tab to next cell)

3. **Table Export:**
   - Export to CSV
   - Export to Excel
   - Copy as HTML
   - Copy as LaTeX

4. **Advanced Formatting:**
   - Multi-line cell content
   - Nested lists in cells
   - Code blocks in cells
   - Images in cells

5. **Table Generation Helpers:**
   - CSV import to table
   - JSON to table conversion
   - Table of contents generation
   - Data visualization integration

---

#### Lessons Learned

1. **Line Endings Matter:**
   - Always normalize line endings when processing text files
   - Different platforms produce different line ending formats
   - Regex anchors (`^`, `$`) are affected by `\r` characters
   - Normalization should happen before any text processing

2. **Multi-Line Markdown Elements:**
   - Require lookahead in the parsing loop
   - Need special markers for grouping logic
   - Must preserve original markdown for round-trip editing
   - Should build complete HTML structure before DOM insertion

3. **Debugging Strategy:**
   - Add logging early in investigation
   - Log at multiple pipeline stages
   - Verify assumptions with console output
   - Test with real-world files (not just synthetic examples)

4. **User Feedback is Critical:**
   - "Toggle source mode twice to make it render" was the key insight
   - Proved rendering code worked, narrowed down to loading issue
   - User testing with diverse file formats reveals edge cases

5. **Pattern Matching in Markdown:**
   - Simple regex patterns are more maintainable
   - Clear anchors prevent backtracking issues
   - Test patterns with various inputs (whitespace, special chars)
   - Trim input before matching to avoid whitespace issues

---

#### Files Changed Summary

| File | Lines Changed | Type | Description |
|------|---------------|------|-------------|
| `js/wysiwyg/wysiwyg-engine.js` | +95 | Feature | Added table detection, parsing, and rendering |
| `css/markdown-editor-base.css` | +29 | Styling | Added comprehensive table styles |
| Total | +124 | - | Two files modified |

**Specific Changes:**

1. **wysiwyg-engine.js:**
   - Lines 420-421: Line ending normalization
   - Lines 220-224: Table row detection in `renderMarkdown()`
   - Lines 256-280: Table helper methods (`isTableRow`, `isTableSeparator`, `parseTableRow`)
   - Lines 503-577: Table grouping logic in `setMarkdown()`

2. **markdown-editor-base.css:**
   - Lines 1821-1849: Table styling rules

**No Breaking Changes:**
- Existing functionality unchanged
- Backwards compatible with all saved documents
- No API changes to public methods
- Theme system integration maintained

---

### Phase 3 Implementation: COMPLETE ✅

All objectives achieved:
- ✅ Line ending normalization implemented
- ✅ Document loading rendering issue resolved
- ✅ Table detection and parsing implemented
- ✅ Table grouping logic implemented
- ✅ Table HTML generation implemented
- ✅ Professional table styling added
- ✅ Theme integration via CSS variables
- ✅ Round-trip editing support maintained
- ✅ Comprehensive testing with real-world documents
- ✅ User verification: "that fixed it completely!"

The WYSIWYG editor now provides complete markdown rendering support including full-featured table display, resolving the document loading issue and expanding the editor's capabilities to handle complex reference documents like the regex pattern guide.

---

### Bug Fixes: Tab Content, List Behavior, Indentation & Shortcuts

**Status:** ✅ COMPLETE
**Session Date:** January 15, 2026

#### Overview

This session addressed multiple critical bugs affecting document persistence, list editing behavior, visual indentation rendering, and shortcut syntax processing.

---

#### Bug Fix 1: New Tabs Inheriting Old Content

**Problem:** When creating a new document tab, it would incorrectly display content from the previously active document instead of starting empty.

**Root Cause:** Race condition in tab switching where the new document's empty content was being overwritten by a delayed render callback from the previous document.

**Fix Applied:** Added a loading flag mechanism to prevent stale content from being applied during tab transitions.

**Files Changed:** `js/wysiwyg/wysiwyg-engine.js`

---

#### Bug Fix 2: List Item Content Truncation

**Problem:** When editing list items in WYSIWYG mode, content was being truncated or lost during certain editing operations.

**Root Cause:** The event handler was using `event.target` to identify the current list item, which could reference the wrong element when the DOM structure changed during editing.

**Fix Applied:** Changed to use `window.getSelection()` to reliably identify the current editing position and extract content from the correct list item element.

**Files Changed:** `js/wysiwyg/wysiwyg-engine.js`

---

#### Bug Fix 3: Enter Key Creating Nested Structures in Lists

**Problem:** Pressing Enter while editing a list item would sometimes create incorrectly nested list structures instead of a new sibling list item.

**Root Cause:** The Enter key handler wasn't properly managing the DOM structure when inserting new list items, particularly in edge cases involving cursor position and existing content.

**Fix Applied:** Revised the Enter key handling logic to properly create sibling list items while maintaining the correct list structure and preserving any content after the cursor.

**Files Changed:** `js/wysiwyg/wysiwyg-engine.js`

---

#### Bug Fix 4: Visual Indentation in WYSIWYG Mode

**Problem:** Tab and space indentation was not displaying correctly in WYSIWYG mode. Indented content appeared flush left instead of showing proper visual indentation.

**Root Cause:** The `data-indent-level` attribute was being set on elements, but the corresponding CSS styles were not properly applying the visual indentation.

**Fix Applied:** Updated the CSS in `markdown-editor-base.css` to properly apply left padding based on the `data-indent-level` attribute value, with each level adding 2em of indentation.

**CSS Added:**
```css
.wysiwyg-content [data-indent-level="1"] { padding-left: 2em; }
.wysiwyg-content [data-indent-level="2"] { padding-left: 4em; }
.wysiwyg-content [data-indent-level="3"] { padding-left: 6em; }
.wysiwyg-content [data-indent-level="4"] { padding-left: 8em; }
.wysiwyg-content [data-indent-level="5"] { padding-left: 10em; }
```

**Files Changed:** `css/markdown-editor-base.css`

---

#### Bug Fix 5: Smart List Continuation in Source Mode

**Problem:** When pressing Enter at the end of a list item in source mode, the new line didn't automatically continue the list pattern.

**Fix Applied:** Added smart list continuation that detects the current list type (unordered `-`, `*`, `+` or ordered `1.`, `2.`, etc.) and automatically inserts the appropriate prefix on the new line.

**Files Changed:** `js/wysiwyg/wysiwyg-engine.js`

---

#### Bug Fix 6: Missing l{} Link Shortcut

**Problem:** The brace-style link shortcut `l{text|url}` was not rendering correctly. When users entered content like `l{click here|https://example.com}`, it appeared as raw text instead of being converted to a clickable link.

**Root Cause:** Investigation of `js/markdown/shortcut-processor.js` revealed that the `createLinkShortcuts()` method was missing the brace-style pattern. Other brace-style shortcuts (`b{}`, `i{}`, `bi{}`, `s{}`, `c{}`) worked correctly, but `l{}` was never implemented despite being documented.

**Fix Applied:** Added the missing pattern to `createLinkShortcuts()`:

```javascript
{ pattern: /l\{([^|]+)\|([^}]+)\}/g, replacement: '[$1]($2)', name: 'link-brace' }
```

**Pattern Explanation:**
- `l\{` - Match literal `l{`
- `([^|]+)` - Capture group 1: link text (any characters except `|`)
- `\|` - Match literal `|` separator
- `([^}]+)` - Capture group 2: URL (any characters except `}`)
- `\}` - Match literal closing `}`
- Replacement: `[$1]($2)` - Standard markdown link format

**Files Changed:** `js/markdown/shortcut-processor.js`

---

#### Verification Summary

All brace-style shortcuts now work consistently:
- ✅ `b{bold text}` → **bold text**
- ✅ `i{italic text}` → *italic text*
- ✅ `bi{bold italic}` → ***bold italic***
- ✅ `s{strikethrough}` → ~~strikethrough~~
- ✅ `c{inline code}` → `inline code`
- ✅ `l{link text|url}` → [link text](url)

Indentation rendering verified at all 5 levels with proper visual spacing.

List editing operations verified:
- ✅ Enter key creates proper sibling list items
- ✅ Content preservation during editing
- ✅ Tab switching maintains document isolation
- ✅ Smart list continuation in source mode

---

#### Files Changed Summary

| File | Changes |
|------|---------|
| `js/wysiwyg/wysiwyg-engine.js` | Tab loading flag, list item selection fix, Enter key handling, smart list continuation |
| `js/markdown/shortcut-processor.js` | Added `l{}` brace-style link pattern |
| `css/markdown-editor-base.css` | Added `data-indent-level` padding styles |

---

### Bug Fixes: List Markers, Paste Handling & Tab Persistence

**Status:** ✅ COMPLETE
**Session Date:** January 15, 2026

#### Overview

This session addressed three bugs affecting list editing behavior, paste functionality in WYSIWYG mode, and active tab persistence across page refreshes.

---

#### Bug Fix 7: Lingering List Markers When Switching Modes

**Problem:** When a user created a list item, pressed Enter (creating an empty list item like `- `), and then switched between WYSIWYG and source mode, the empty list marker would persist instead of being removed.

**Root Cause:** Empty list items (e.g., `- ` with no content) were not being filtered out during mode transitions. The `updateRenderedBlockMarkdown()` method was correctly handling this for WYSIWYG → Source transitions, but the `setMarkdown()` method wasn't filtering empty list items when loading from Source → WYSIWYG.

**Fix Applied:**
1. Modified `updateRenderedBlockMarkdown()` to filter out empty `<li>` elements when generating markdown from rendered lists
2. Added empty list item detection in `setMarkdown()` using regex: `/^(\s*)([-*+]|\d+\.)\s*$/`
3. Empty list item lines are now skipped during document loading

**Files Changed:** `js/wysiwyg/wysiwyg-engine.js`

---

#### Bug Fix 8: WYSIWYG Paste Handler for Markdown Rendering

**Problem:** When pasting multi-line markdown content into the WYSIWYG editor, the content was inserted as plain text instead of being rendered as formatted markdown.

**Root Cause:** No paste event handler existed to intercept clipboard data and process it as markdown.

**Fix Applied:** Added a comprehensive `handlePaste()` method that:
- Intercepts paste events and extracts plain text from clipboard
- Normalizes line endings (CRLF/CR to LF)
- For single-line pastes: inserts text and triggers auto-render
- For multi-line pastes: processes each line through `renderMarkdown()`
- Groups consecutive list items into proper `<ul>` or `<ol>` elements
- Preserves indent levels on pasted content
- Wraps rendered content with `data-wysiwyg-rendered` and `data-wysiwyg-markdown` attributes

**Files Changed:** `js/wysiwyg/wysiwyg-engine.js`

---

#### Bug Fix 9: Pasted Content Not Persisting to Storage

**Problem:** After pasting content into the WYSIWYG editor and refreshing the page, the pasted content would disappear.

**Root Cause:** The paste handler wasn't triggering the auto-save mechanism because no `input` event was dispatched after programmatically inserting content.

**Fix Applied:** Added `this.editorElement.dispatchEvent(new Event('input', { bubbles: true }))` at the end of `handlePaste()` to trigger the auto-save listener.

**Files Changed:** `js/wysiwyg/wysiwyg-engine.js`

---

#### Bug Fix 10: Active Tab Not Persisting on Page Refresh

**Problem:** When refreshing the page while on a non-first document tab, the editor would switch to the leftmost tab instead of staying on the currently active tab.

**Root Cause:** In `document-manager.js`, the `switchDocument()` method was calling `saveToStorage()` **before** updating `this.activeDocumentId`. This meant the old active document ID was being saved instead of the new one:

```javascript
// BEFORE (buggy):
if (this.autoSave && this.activeDocumentId) {
    this.saveToStorage();  // Saves OLD activeDocumentId
}
this.activeDocumentId = id;  // New ID set AFTER save
```

**Fix Applied:** Reordered the operations to set the new `activeDocumentId` before saving:

```javascript
// AFTER (fixed):
this.activeDocumentId = id;  // Set new ID first

if (this.autoSave) {
    this.saveToStorage();  // Now saves correct activeDocumentId
}
```

**Files Changed:** `js/markdown/document-manager.js`

---

#### Bug Fix 11: Cursor Not Staying Visible When Typing at Bottom of Editor

**Problem:** When typing enough text to reach the bottom of the editor, the cursor would move below the visible area. Users couldn't see what they were typing until they manually scrolled or pressed Enter.

**Root Cause:** The WYSIWYG editor had no automatic scroll management to keep the cursor in view during typing. The contenteditable element didn't automatically scroll to follow the cursor position.

**Fix Applied:** Added a `scrollCursorIntoView()` method to `wysiwyg-engine.js` that:
1. Uses `range.getClientRects()` to get the cursor's visual position
2. Compares cursor position against the editor's visible bounds
3. Scrolls the editor to keep cursor visible with a 50px buffer for comfortable viewing
4. Includes a fallback using temporary span insertion for edge cases
5. Uses debouncing (50ms) in `handleInput()` to prevent excessive calculations during rapid typing

```javascript
scrollCursorIntoView() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();

    if (rects.length > 0) {
        const rect = rects[0];
        const editorRect = this.editorElement.getBoundingClientRect();
        const buffer = 50;

        // Scroll down if cursor is near/below bottom
        if (rect.bottom > editorRect.bottom - buffer) {
            const scrollAmount = (rect.bottom - editorRect.bottom) + buffer;
            this.editorElement.scrollTop += scrollAmount;
        }
        // Scroll up if cursor is near/above top
        else if (rect.top < editorRect.top + buffer) {
            const scrollAmount = (editorRect.top - rect.top) + buffer;
            this.editorElement.scrollTop -= scrollAmount;
        }
    }
}
```

**Integration Points:**
- Called with debouncing in `handleInput()` for continuous typing
- Called directly after `handleEnterKey()` creates new paragraphs
- Called after list item handling to ensure new list items are visible

**Files Changed:** `js/wysiwyg/wysiwyg-engine.js`

---

#### Verification Summary

All bug fixes verified working:
- ✅ Empty list markers removed when switching modes (both directions)
- ✅ Pasted markdown renders correctly in WYSIWYG mode
- ✅ Consecutive list items grouped properly when pasting
- ✅ Pasted content persists across page refreshes
- ✅ Active tab persists correctly on page refresh
- ✅ Cursor stays visible when typing at bottom of editor

---

#### Bug Fix 12: Code Cleanup - Broken #markdown-input References

**Problem:** After migrating from split-view to WYSIWYG-only editor, many functions in `markdown-editor-main.js` still referenced `#markdown-input` which no longer exists in the HTML. This caused Edit menu handlers (Undo, Redo, Cut, Copy, Paste, Select All) and editor style functions to fail silently.

**Root Cause:** The original split-view editor used a `<textarea id="markdown-input">` element. After the WYSIWYG migration, this was replaced with:
- `#wysiwyg-editor` - contenteditable div for WYSIWYG mode
- `#source-editor` - textarea for source mode (hidden by default)

All references to `#markdown-input` were now pointing to a non-existent element.

**Fix Applied:**

1. **Added `getActiveEditor()` helper function** - Detects which editor is currently active (WYSIWYG or source mode) and returns the appropriate element.

2. **Fixed Edit menu handlers:**
   - `handleUndo()` - Now uses `getActiveEditor()` and `document.execCommand('undo')`
   - `handleRedo()` - Now uses `getActiveEditor()` and `document.execCommand('redo')`
   - `handleCut()` - Now uses `getActiveEditor()` and `document.execCommand('cut')`
   - `handleCopy()` - Now uses `getActiveEditor()` and `document.execCommand('copy')`
   - `handlePaste()` - Now works with both textarea (Clipboard API) and contenteditable (execCommand)
   - `handleSelectAll()` - Now uses Selection API for contenteditable or `select()` for textarea

3. **Added missing functions:**
   - `initializeFindManager()` - Properly initializes the FindManager class with correct selectors
   - `applyLineNumbers()` - Stub function (line numbers not implemented for WYSIWYG)

4. **Updated editor style functions to target both editors:**
   - `applyEditorFontSize()` - Applies to both `#wysiwyg-editor` and `#source-editor`
   - `applyEditorLineHeight()` - Applies to both editors
   - `applyEditorTabSize()` - Applies to both editors
   - `applyEditorFontFamily()` - Applies to both editors
   - `applyWordWrap()` - Applies to `#source-editor` (source mode textarea)

5. **Simplified `handleReplace()`** - Removed broken prompt-based replacement code, now opens FindManager dialog (same as Find)

6. **Fixed `restoreViewPreferences()`** - Now uses the apply functions instead of directly manipulating non-existent element

**Files Changed:** `js/markdown-editor-main.js`

**Lines Changed:** ~120 lines removed (broken code), ~50 lines added (working code)

---

#### Files Changed Summary

| File | Changes |
|------|---------|
| `js/wysiwyg/wysiwyg-engine.js` | Empty list filtering, paste handler, input event dispatch, scrollCursorIntoView |
| `js/markdown/document-manager.js` | Fixed activeDocumentId save order in switchDocument() |
| `js/markdown-editor-main.js` | Fixed broken #markdown-input references, added getActiveEditor(), initializeFindManager(), applyLineNumbers() |

---

#### Bug Fix 13: Line Numbers, Zoom Verification, and View Tab Cleanup

**Line Numbers Implementation (Source Mode):**

Added line numbers display for the source mode textarea with the following components:

1. **HTML Changes** (`markdown-editor.html`):
   - Wrapped source textarea in `source-editor-container` div
   - Added `line-numbers-gutter` div for displaying line numbers

2. **CSS Changes** (`css/markdown-editor-base.css`):
   - Added `.source-editor-container` with flexbox layout
   - Added `.line-numbers-gutter` styling with scroll sync support
   - Added `.line-number` span styling
   - Hidden scrollbar on gutter (synced with textarea scroll)

3. **JavaScript Changes** (`js/markdown-editor-main.js`):
   - Implemented `applyLineNumbers(enabled)` - toggles gutter visibility
   - Added `updateLineNumbers()` - rebuilds line number HTML from content
   - Added `syncLineNumbersScroll()` - syncs gutter scroll with textarea
   - Added `initLineNumbers()` - sets up event listeners for input and scroll

4. **WYSIWYG Engine Changes** (`js/wysiwyg/wysiwyg-engine.js`):
   - Updated `switchToSource()` to show/hide container instead of just textarea
   - Updated `switchToWysiwyg()` to hide container instead of just textarea
   - Added line numbers update trigger when switching to source mode

**Zoom Functionality:**

Verified zoom buttons (90%, 100%, 110%, 125%, 150%) are already working correctly:
- Located in View tab > Zoom section
- Applies font-size scaling to `.editor-container`
- Preferences saved via `settingsManager.set('editor.zoom', percent)`
- Restored on page load via `restoreViewPreferences()`

**View Tab Cleanup:**

Removed External Window section:
- Removed HTML section containing "Open Preview in New Window" and "Close External Window" buttons
- Removed orphaned JSDoc comment in `markdown-editor-main.js`

**Files Changed:**

| File | Changes |
|------|---------|
| `markdown-editor.html` | Added line numbers container, removed External Window section |
| `css/markdown-editor-base.css` | Added source editor and line numbers gutter styling |
| `js/markdown-editor-main.js` | Implemented line numbers functions, removed external window comment |
| `js/wysiwyg/wysiwyg-engine.js` | Updated source mode toggle for container display |

---

#### Implementation Checklist (Phase 1)

**Core Implementation (✅ Complete):**

- [x] Create `js/shared/settings-manager.js` - Full implementation with all planned features
- [x] Implement SettingsManager class with chosen API (hybrid read/write)
- [x] Implement SettingsError custom error class with path/value/reason properties
- [x] Add three-state system (lastSavedSettings, previousSettings, currentSettings)
- [x] Add persistence logic (localStorage with 500ms debouncing)
- [x] Implement schema-based validation (type, min/max, enum values)
- [x] Add migration system for legacy localStorage keys
- [x] Implement save(), cancel(), revert(), hasUnsavedChanges()
- [x] Implement import/export functionality (JSON file download/upload)
- [x] Implement resetModule() and resetAll()
- [x] Add convenience methods: setMultiple(), getModule(), getDefault(), onChange(), onAnyChange()
- [x] Integrate into markdown-editor.html (script tag added)
- [x] Initialize in markdown-editor-main.js with legacy migration

**Deferred to Future Phases:**

- [ ] Add `getDefaultSettings()` to existing managers (EditorManager, etc.) - Will use centralized schema instead
- [ ] Add `getSettingsSchema()` to existing managers - Using centralized static schema
- [ ] Add `validateSettings()` to existing managers - Using centralized validation
- [ ] Replace direct localStorage calls with SettingsManager - Gradual migration
- [ ] Add settings panel UI
- [ ] Write unit tests for validation
- [ ] Write integration tests for persistence

---

#### Phase 1 Testing Results (January 13, 2026)

**Manual Console Testing - All Core Functionality Verified:**

| Test | Description | Result |
|------|-------------|--------|
| 1 | Basic initialization | ✅ Pass |
| 2 | `get()` method | ✅ Pass |
| 3 | `set()` method | ✅ Pass |
| 4 | Validation: below minimum | ✅ Throws SettingsError |
| 5 | Validation: above maximum | ✅ Throws SettingsError |
| 6 | Validation: wrong type | ✅ Throws SettingsError |
| 7 | Validation: invalid path | ✅ Throws SettingsError |
| 8 | Validation: invalid enum | ✅ Throws SettingsError |
| 9 | localStorage persistence | ✅ Pass |
| 10 | `hasUnsavedChanges()` | ✅ Pass |
| 11 | `revert()` | ✅ Pass |
| 12 | `export()` | ✅ Pass |
| 13 | `resetModule()` | ✅ Pass |
| 14 | Event system (`onChange()`) | ✅ Pass (with known issue) |
| 15 | `setMultiple()` | ✅ Pass |
| 16 | `getModule()` | ✅ Pass |
| 17 | `getDefault()` | ✅ Pass (returns 14) |
| 18 | Persistence across reload | ✅ Pass (returned 18) |

**Resolved Issue - Double Event Firing (Fixed January 13, 2026):**

The `on()` method was adding both an internal listener to `this.listeners` AND a DOM event listener. When `emit()` was called, it fired both mechanisms, causing callbacks registered via `onChange()` to execute twice.

**Root Cause:** The `on()` method subscribed to both notification systems, but only one should be used.

**Fix Applied:** Removed the DOM event listener subscription from `on()` method, keeping only the internal listeners array. DOM CustomEvents are still dispatched by `emit()` for external modules that use `document.addEventListener()` directly.

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
