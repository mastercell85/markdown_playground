# Markdown Playground

A feature-rich, browser-based markdown editor built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies. Live split-view preview, multiple document tabs, swappable themes, bidirectional scroll sync, and Find & Replace with full regex support.

## Features

### Editor
- **Live split-view preview** with resizable panes and double-click to center
- **Bidirectional scroll sync** between editor and preview using line-tracking attributes
- **Multiple document tabs** with auto-save to localStorage
- **Find & Replace** with regex support, case sensitivity, whole-word matching, and match navigation
- **Line numbers** and word wrap toggles
- **Zoom levels**: 90%, 100%, 110%, 125%, 150%
- **External preview window** with real-time sync via postMessage API

### Themes
- **Default** — Clean dark theme
- **Cyberpunk** — Neon-styled with matrix effects
- **LCARS** — Star Trek-inspired interface with signature L-shaped frames
- Load custom CSS themes at runtime

### Tab Menu Styles
- **Steel** — Industrial frame design with animated SVG hooks and two-column layout
- **Classic** — Clean dropdown-style menus
- Fully modular and extensible — add new styles without modifying core code

### Extended Syntax
Multiple shortcut variations for every markdown feature (5–7 per element), supporting standard markdown, HTML-style, BBCode-style, and custom shorthand syntaxes.

### Layout
- Split view, editor-only, or preview-only modes
- Resizable divider with drag handle
- Collapsible help and view panels with Expand/Collapse All
- Responsive panel system for narrow screens

## Architecture

The editor follows SOLID principles with a modular component structure:

```
markdown-editor-main.js (Orchestrator)
    ├── PanelManager          — Tab/panel switching
    ├── ResizablePane         — Draggable divider
    ├── ScrollSync            — Bidirectional scroll sync
    ├── FindManager           — Find & Replace with regex
    ├── DocumentManager       — Document storage & persistence
    │   └── Document          — Individual document class
    ├── TabController         — Document tabs UI
    ├── MarkdownParser        — Parsing orchestrator
    │   ├── RuleEngine        — Standard markdown rules
    │   ├── BlockProcessor    — Block-level processing
    │   └── ShortcutProcessor — Custom syntax conversion
    ├── MarkdownRenderer      — HTML rendering
    ├── WindowManager         — External preview window
    └── ThemeLoader           — Theme loading & persistence
```

Key design patterns: Single Responsibility, Dependency Injection, Observer Pattern, and Factory Pattern.

## Project Structure

```
├── assets/                        # SVG decorations and images
├── css/
│   ├── markdown-editor-base.css   # Base styles and CSS variables
│   ├── markdown-editor.css        # Editor-specific styles
│   ├── 219*.css                   # CSS Zen Garden animation files
│   └── tab-menus/                 # Modular tab menu stylesheets
├── js/
│   ├── markdown-editor-main.js    # Main application orchestrator
│   ├── shared/                    # Shared modules (panels, resize, scroll sync, find)
│   ├── markdown/                  # Markdown processing pipeline
│   └── tab-menus/                 # Modular tab menu scripts
├── themes/                        # Cyberpunk and LCARS theme CSS
├── tests/                         # Unit tests (FindManager: 15 tests, 29 assertions)
├── old-monolithic-code/           # Original codebase before SOLID refactor
├── index.html                     # Home page (CSS Zen Garden animation)
├── markdown-editor.html           # Main editor application
└── typora-window.html             # External preview window
```

## Getting Started

No build tools or installation required. Clone the repo and open in a browser:

```bash
git clone https://github.com/mastercell85/markdown_playground.git
cd markdown_playground
```

Open `markdown-editor.html` in your browser to launch the editor, or open `index.html` to see the CSS Zen Garden animation.

## Background

This project started as a CSS Zen Garden responsive refactor and evolved into a full markdown editor. The initial codebase was a single monolithic file (preserved in `old-monolithic-code/`) which was later refactored from the ground up into a modular architecture following SOLID principles. The rebuild prioritized separated concerns, extensibility, and maintainability — each component is independent and swappable without affecting the rest of the system.

## Development

This project was developed using AI-assisted coding (Claude) with all architectural decisions, feature specifications, technology choices, and project direction by Patrick Rucker.

## Credits

- **Original CSS Design**: "Steel" (#219) by [Steffen Knoeller](http://www.steffen-knoeller.de/) from [CSS Zen Garden](https://github.com/mezzoblue/csszengarden.com)
- **CSS Zen Garden**: Created by Dave Shea ([mezzoblue](https://github.com/mezzoblue))
- **Cyberpunk Theme**: Adapted from [Typora Cyberpunk theme](https://theme.typora.io/theme/Cyberpunk/) by Channing Walton ([channingwalton](https://github.com/channingwalton))
- **LCARS Theme**: Adapted from [Typora LCARS theme](https://theme.typora.io/theme/LCARS/) by TEParsons ([TEParsons](https://github.com/TEParsons/LCARS))

## License

Original CSS Zen Garden design licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 1.0](http://creativecommons.org/licenses/by-nc-sa/1.0/)
