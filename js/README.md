# JavaScript Module Architecture

This directory contains the refactored JavaScript codebase following SOLID principles for maintainability, reusability, and extensibility.

## Directory Structure

```
js/
├── shared/              # Shared modules used across the application
│   ├── panel-manager.js      # Panel open/close management
│   └── resizable-pane.js     # Resizable divider component
│
├── markdown/            # Markdown editor modules
│   ├── rule-engine.js        # Inline markdown rule management
│   ├── block-processor.js    # Block-level element processing
│   ├── markdown-parser.js    # Main parser coordinator
│   ├── window-manager.js     # External preview window management
│   └── markdown-renderer.js  # Rendering and preview updates
│
├── index-main.js        # Main page initialization
└── markdown-editor-main.js   # Markdown editor initialization
```

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
Each module has a single, well-defined purpose:
- **PanelManager**: Only handles panel opening/closing logic
- **ResizablePane**: Only handles pane resizing
- **RuleEngine**: Only manages parsing rules
- **BlockProcessor**: Only processes block-level elements
- **WindowManager**: Only manages external preview windows
- **MarkdownRenderer**: Only handles rendering logic

### Open/Closed Principle (OCP)
Modules are open for extension, closed for modification:
- **RuleEngine**: Add/remove rules without modifying core logic
- **PanelManager**: Configure panels via constructor config
- **ResizablePane**: Extend with callbacks for custom behavior

### Liskov Substitution Principle (LSP)
- All parsing rules follow consistent interface (pattern, replacement, name)
- Components can be swapped with compatible implementations

### Interface Segregation Principle (ISP)
- Modules expose only necessary public methods
- No client forced to depend on methods it doesn't use

### Dependency Inversion Principle (DIP)
- Modules depend on abstractions (config objects), not concrete implementations
- `MarkdownParser` depends on `RuleEngine` and `BlockProcessor` interfaces
- `MarkdownRenderer` depends on `MarkdownParser` and `WindowManager` interfaces

## Module Usage

### PanelManager
```javascript
const panelManager = new PanelManager({
    panels: [
        { element: null, selector: '.my-panel', class: 'panel-open' }
    ],
    onPanelOpen: (panel) => console.log('Panel opened:', panel),
    onPanelClose: (panel) => console.log('Panel closed:', panel)
});
panelManager.init();
```

### ResizablePane
```javascript
const resizablePane = new ResizablePane({
    dividerSelector: '#divider',
    leftPaneSelector: '.left-pane',
    rightPaneSelector: '.right-pane',
    containerSelector: '.container',
    minPaneWidth: 200,
    onResize: (sizes) => console.log('Resized:', sizes)
});
resizablePane.init();
```

### Markdown Components
```javascript
// Create parser
const parser = new MarkdownParser(
    new RuleEngine(),
    new BlockProcessor()
);

// Add custom rule
parser.addInlineRule(/~(.+?)~/g, '<del>$1</del>', 'strikethrough');

// Create window manager
const windowManager = new WindowManager({
    windowTitle: 'Preview',
    windowWidth: 800,
    windowHeight: 600
});

// Create renderer
const renderer = new MarkdownRenderer({
    parser: parser,
    inputElement: document.getElementById('input'),
    outputElement: document.getElementById('output'),
    windowManager: windowManager
});
renderer.init();
```

## Benefits of This Architecture

1. **Code Reusability**: PanelManager and ResizablePane can be used in any project
2. **Easy Testing**: Each module can be tested independently
3. **Maintainability**: Changes to one module don't affect others
4. **Extensibility**: Add new features without modifying existing code
5. **No Code Duplication**: Shared logic is centralized
6. **Clear Dependencies**: Easy to understand module relationships

## Future Extensibility

### Adding New Markdown Syntax
```javascript
// Add to existing parser without modifying core
const ruleEngine = window.MarkdownEditor.ruleEngine;
ruleEngine.addRule(/==(.+?)==/g, '<mark>$1</mark>', 'highlight');
```

### Creating Custom Block Processors
```javascript
class CustomBlockProcessor extends BlockProcessor {
    process(html) {
        // Custom processing logic
        return super.process(html);
    }
}

const parser = new MarkdownParser(
    new RuleEngine(),
    new CustomBlockProcessor()
);
```

### Adding Event Callbacks
```javascript
const renderer = new MarkdownRenderer({
    parser: parser,
    inputElement: input,
    outputElement: output,
    onRender: ({ markdown, html }) => {
        console.log('Rendered:', markdown.length, 'chars');
        // Save to localStorage, sync to server, etc.
    }
});
```

## Migration Notes

The old monolithic files (`panel-manager.js` and `markdown-editor.js`) have been replaced with this modular architecture. The functionality remains identical, but the code is now:
- More maintainable
- More testable
- More reusable
- Better organized
- Follows SOLID principles
