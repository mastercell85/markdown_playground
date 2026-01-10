# System Architecture

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTML Pages                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  index.html                      markdown-editor.html           │
│       │                                   │                      │
│       └─────────┬─────────────────────────┘                     │
│                 │                                                │
└─────────────────┼────────────────────────────────────────────────┘
                  │
    ┌─────────────┴──────────────┐
    │                            │
    ▼                            ▼
┌──────────────┐         ┌──────────────────┐
│ index-main.js│         │markdown-editor-  │
│              │         │main.js           │
└───────┬──────┘         └────────┬─────────┘
        │                         │
        │        ┌────────────────┼────────────────┐
        │        │                │                │
        ▼        ▼                ▼                ▼
   ┌─────────────────────┐  ┌─────────────────────────────┐
   │  Shared Modules     │  │   Markdown Modules          │
   ├─────────────────────┤  ├─────────────────────────────┤
   │                     │  │                             │
   │ • PanelManager ◄────┼──┤ • RuleEngine                │
   │                     │  │ • BlockProcessor            │
   │ • ResizablePane ◄───┼──┤ • MarkdownParser            │
   │                     │  │ • WindowManager             │
   │                     │  │ • MarkdownRenderer          │
   └─────────────────────┘  └─────────────────────────────┘
```

## Component Relationships

### Index Page Flow
```
User Interaction
      │
      ▼
┌─────────────┐
│ index.html  │
└──────┬──────┘
       │ loads
       ▼
┌─────────────────┐
│ index-main.js   │
└──────┬──────────┘
       │ initializes
       ▼
┌──────────────────┐      ┌──────────────┐
│ PanelManager     │◄─────│ Panel Config │
└──────────────────┘      └──────────────┘
       │
       ├─ manages: .preamble panel
       └─ manages: .summary panel
```

### Markdown Editor Flow
```
User Types Markdown
        │
        ▼
┌────────────────────┐
│ markdown-editor    │
│ .html              │
└────────┬───────────┘
         │ loads modules
         ▼
┌──────────────────────┐
│ markdown-editor-     │
│ main.js              │
└──────┬───────────────┘
       │
       ├───► PanelManager ───► Manages 5 editor panels
       │
       ├───► ResizablePane ──► Manages split-view divider
       │
       └───► Markdown Pipeline:
             │
             ├───► RuleEngine ────────┐
             │                         │
             ├───► BlockProcessor ─────┤
             │                         │
             └───► MarkdownParser ◄────┘
                         │
                         ▼
                   MarkdownRenderer
                         │
                         ├───► Updates split-screen preview
                         │
                         └───► WindowManager ───► External preview
```

## SOLID Principles Map

### Single Responsibility Principle (SRP)
```
┌─────────────────────┐   One Responsibility Each:
│ PanelManager        │ → Open/close panels
├─────────────────────┤
│ ResizablePane       │ → Resize split panes
├─────────────────────┤
│ RuleEngine          │ → Manage inline rules
├─────────────────────┤
│ BlockProcessor      │ → Process block elements
├─────────────────────┤
│ MarkdownParser      │ → Coordinate parsing
├─────────────────────┤
│ WindowManager       │ → Manage external windows
├─────────────────────┤
│ MarkdownRenderer    │ → Render markdown
└─────────────────────┘
```

### Dependency Inversion Principle (DIP)
```
High-Level Modules          Abstractions           Low-Level Modules
────────────────────────────────────────────────────────────────────

┌──────────────────┐                            ┌──────────────┐
│ MarkdownRenderer │────depends on─────────────►│ Parser API   │
└──────────────────┘                            └──────┬───────┘
                                                       │
                                                  implements
                                                       │
                                                       ▼
                                             ┌──────────────────┐
                                             │ MarkdownParser   │
                                             └──────────────────┘

┌──────────────────┐                            ┌──────────────┐
│ MarkdownParser   │────depends on─────────────►│ RuleEngine   │
└──────────────────┘                            │ API          │
                                                └──────┬───────┘
                                                       │
                                                  implements
                                                       │
                                                       ▼
                                             ┌──────────────────┐
                                             │ RuleEngine       │
                                             └──────────────────┘
```

### Open/Closed Principle (OCP)
```
Closed for Modification       │      Open for Extension
──────────────────────────────┼────────────────────────────────
                              │
┌──────────────────┐          │   ┌─────────────────────────┐
│ RuleEngine       │          │   │ ruleEngine.addRule(     │
│                  │   ◄──────┼───│   /custom/,             │
│ Core logic stays │          │   │   '<custom>$1</custom>',│
│ unchanged        │          │   │   'custom-rule'         │
└──────────────────┘          │   │ )                       │
                              │   └─────────────────────────┘
                              │
┌──────────────────┐          │   ┌─────────────────────────┐
│ PanelManager     │          │   │ new PanelManager({      │
│                  │   ◄──────┼───│   panels: [...],        │
│ Core logic stays │          │   │   onPanelOpen: callback │
│ unchanged        │          │   │ })                      │
└──────────────────┘          │   └─────────────────────────┘
```

## Data Flow

### Markdown Rendering Pipeline
```
┌──────────────┐
│ User Input   │
│ (textarea)   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ MarkdownRenderer.render()                            │
└───────────────┬──────────────────────────────────────┘
                │
                ├─► Gets markdown from inputElement
                │
                ▼
       ┌────────────────────┐
       │ MarkdownParser     │
       │ .parse(markdown)   │
       └────────┬───────────┘
                │
                ├──► Step 1: RuleEngine.apply()
                │    ├─ Bold: **text** → <strong>text</strong>
                │    ├─ Italic: *text* → <em>text</em>
                │    ├─ Links: [t](u) → <a href="u">t</a>
                │    └─ Code: `code` → <code>code</code>
                │
                ▼
       ┌────────────────────┐
       │ Inline-processed   │
       │ HTML               │
       └────────┬───────────┘
                │
                ├──► Step 2: BlockProcessor.process()
                │    ├─ Lists: - item → <ul><li>item</li></ul>
                │    ├─ Quotes: > text → <blockquote>text</blockquote>
                │    └─ Paragraphs: text → <p>text</p>
                │
                ▼
       ┌────────────────────┐
       │ Final HTML         │
       └────────┬───────────┘
                │
                ├──► Update outputElement.innerHTML
                │
                └──► If external window open:
                     WindowManager.updateContent(html)
```

### Panel Management Flow
```
┌──────────────┐
│ User Hovers  │
│ Panel Tab    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ mouseenter event             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ PanelManager.openPanel()     │
└──────┬───────────────────────┘
       │
       ├──► Close currently open panel (if different)
       │    └─ Remove 'panel-open' class
       │
       └──► Open new panel
            └─ Add 'panel-open' class
                 │
                 ▼
            CSS Transitions trigger
                 │
                 ▼
            Panel animates into view
```

## Module Reusability

### Shared Modules Can Be Used In:
```
PanelManager:
✓ CSS Zen Garden main page
✓ Markdown editor page
✓ Any project with slide-out panels
✓ Settings panels
✓ Sidebars
✓ Navigation menus

ResizablePane:
✓ Markdown editor split view
✓ Code editors
✓ File explorers
✓ Chat applications (sidebar + chat)
✓ Email clients (folder list + message)
✓ Any two-pane interface

WindowManager:
✓ Markdown preview window
✓ Pop-out video players
✓ External documentation viewers
✓ Multi-monitor support
✓ Detachable tool palettes
```

### Markdown Modules Can Be Used In:
```
RuleEngine:
✓ Markdown editors
✓ Comment systems
✓ Documentation generators
✓ Custom text processors
✓ Any pattern-based text transformation

BlockProcessor:
✓ Markdown parsers
✓ Rich text editors
✓ Document converters
✓ Wiki systems
✓ Blog engines

MarkdownParser:
✓ Static site generators
✓ README renderers
✓ Documentation sites
✓ Note-taking apps
✓ Content management systems

MarkdownRenderer:
✓ Live preview editors
✓ WYSIWYG editors
✓ Real-time collaboration tools
✓ Markdown preview plugins
✓ Browser extensions
```

## Extension Points

### Adding New Features

#### 1. Custom Markdown Syntax
```javascript
// Extend without modifying core
const ruleEngine = window.MarkdownEditor.ruleEngine;

// Strikethrough
ruleEngine.addRule(/~~(.+?)~~/g, '<del>$1</del>', 'strikethrough');

// Highlight
ruleEngine.addRule(/==(.+?)==/g, '<mark>$1</mark>', 'highlight');

// Footnotes
ruleEngine.addRule(/\[\^(\d+)\]/g, '<sup>$1</sup>', 'footnote');
```

#### 2. Auto-Save Feature
```javascript
const renderer = new MarkdownRenderer({
    parser: parser,
    inputElement: input,
    outputElement: output,
    onRender: ({ markdown, html }) => {
        // Auto-save every render
        localStorage.setItem('draft', markdown);
        localStorage.setItem('lastSaved', new Date().toISOString());
    }
});
```

#### 3. Word Count Feature
```javascript
const renderer = new MarkdownRenderer({
    // ... config
    onRender: ({ markdown }) => {
        const words = markdown.split(/\s+/).filter(w => w.length > 0).length;
        document.getElementById('word-count').textContent = `${words} words`;
    }
});
```

#### 4. Custom Panel Behavior
```javascript
const panelManager = new PanelManager({
    panels: [...],
    onPanelOpen: (panel) => {
        console.log('Opened:', panel.selector);
        trackAnalytics('panel_open', panel.selector);
    },
    onPanelClose: (panel) => {
        console.log('Closed:', panel.selector);
    }
});
```

## Testing Strategy

### Unit Testing
```javascript
// Each module can be tested independently

// Test RuleEngine
const ruleEngine = new RuleEngine();
ruleEngine.addRule(/\*\*(.+?)\*\*/g, '<strong>$1</strong>', 'bold');
assert(ruleEngine.apply('**test**') === '<strong>test</strong>');

// Test BlockProcessor
const processor = new BlockProcessor();
assert(processor.process('- item') === '<ul>\n<li>item</li>\n</ul>');

// Test MarkdownParser with mocks
const mockRuleEngine = { apply: (text) => text };
const mockBlockProcessor = { process: (html) => html };
const parser = new MarkdownParser(mockRuleEngine, mockBlockProcessor);
```

### Integration Testing
```javascript
// Test full pipeline
const parser = new MarkdownParser(new RuleEngine(), new BlockProcessor());
const result = parser.parse('# Heading\n\n**Bold** text\n\n- Item 1\n- Item 2');
assert(result.includes('<h1>Heading</h1>'));
assert(result.includes('<strong>Bold</strong>'));
assert(result.includes('<ul>'));
```

This architecture provides a solid foundation for future development while maintaining clean separation of concerns and adhering to SOLID principles.
