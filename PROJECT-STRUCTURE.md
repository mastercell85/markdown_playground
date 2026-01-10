# Project Structure

## Clean, Organized Directory Layout

```
Website playground/
│
├── 📁 assets/                    # All SVG and image files
│   ├── bg.png                   # Background image (479 KB)
│   ├── bg1.svg                  # Background SVG (59 KB)
│   ├── bg2.svg                  # Background SVG (46 KB)
│   ├── footer.svg               # Footer decoration (8 KB)
│   ├── hook1.svg                # Panel hook graphic (12 KB)
│   ├── hook2.svg                # Panel hook graphic (12 KB)
│   ├── hook3.svg                # Panel hook graphic (14 KB)
│   ├── layer.svg                # Layer decoration (24 KB)
│   ├── layer-frame.svg          # Frame decoration (25 KB)
│   └── layer-middle.svg         # Middle layer (25 KB)
│
├── 📁 css/                       # All stylesheets
│   ├── 219.css                  # Main stylesheet (imports others)
│   ├── 219-400.css              # Mobile styles (400-799px)
│   ├── 219-800-compat.css       # Tablet compatibility (800px+)
│   ├── 219-1367.css             # Desktop styles (1367px+)
│   ├── 219-1367-scaled.css      # Scaled desktop (imports panel CSS)
│   ├── 219-1600.css             # Large screen styles (1600px+)
│   ├── 219-base.css             # Base typography and resets
│   ├── 219-bg.css               # Background styles
│   ├── 219-custom-hide.css      # Custom hiding rules
│   ├── 219-keyframes.css        # Animation keyframes
│   ├── 219-panel-base.css       # Panel base styles
│   ├── 219-panel-benefits.css   # Benefits panel
│   ├── 219-panel-header.css     # Header panel
│   ├── 219-panel-menu.css       # Document menu styling
│   ├── 219-panel-preamble.css   # Preamble panel
│   ├── 219-panel-summary.css    # Summary/documents panel
│   ├── 219-panel-tabs.css       # Panel tab labels
│   └── markdown-editor.css      # Markdown editor styles
│
├── 📁 js/                        # All JavaScript (modular architecture)
│   ├── 📁 shared/               # Reusable modules
│   │   ├── panel-manager.js    # Panel open/close management
│   │   └── resizable-pane.js   # Resizable divider component
│   │
│   ├── 📁 markdown/             # Markdown editor modules
│   │   ├── rule-engine.js      # Inline markdown rules
│   │   ├── block-processor.js  # Block-level processing
│   │   ├── markdown-parser.js  # Parser coordinator
│   │   ├── window-manager.js   # External preview windows
│   │   └── markdown-renderer.js # Rendering logic
│   │
│   ├── index-main.js            # Main page initialization
│   ├── markdown-editor-main.js  # Editor initialization
│   ├── README.md                # Module documentation
│   └── ARCHITECTURE.md          # System design guide
│
├── 📁 old-monolithic-code/      # Backup of old code (pre-refactor)
│   ├── panel-manager.js         # Old monolithic panel manager
│   └── markdown-editor.js       # Old all-in-one editor
│
├── 📄 index.html                 # Main CSS Zen Garden page
├── 📄 markdown-editor.html       # Markdown editor page
│
├── 📄 README.md                  # Original CSS Zen Garden README
├── 📄 REFACTORING.md             # Refactoring summary
├── 📄 ARCHITECTURE.md            # Architecture documentation
├── 📄 PROJECT-STRUCTURE.md       # This file
│
└── 219.jpg                       # Preview thumbnail

Total: 759 KB (0.74 MB)
```

## Folder Organization Benefits

### Before (Root Directory Clutter)
```
❌ 18 CSS files in root
❌ 10 SVG/PNG files in root
❌ 2 JS files in root
❌ 3 HTML files in root
❌ 33+ files in root directory!
```

### After (Clean Organization)
```
✅ Root: Only 3 HTML + 4 documentation files + 1 image
✅ css/: 18 stylesheets organized
✅ assets/: 10 images/SVG organized
✅ js/: Modular JS architecture with subfolders
✅ old-monolithic-code/: Archived backups
```

## File Reference Paths

### HTML Files Reference CSS
```html
<!-- index.html and markdown-editor.html -->
<link rel="stylesheet" href="css/219.css">
<link rel="stylesheet" href="css/markdown-editor.css">
```

### CSS Files Import Other CSS
```css
/* css/219.css imports from same folder */
@import url("219-keyframes.css");
@import url("219-base.css");
```

### CSS Files Reference Assets
```css
/* All CSS files reference ../assets/ */
background: url(../assets/bg1.svg);
background: url(../assets/hook1.svg);
background: url(../assets/layer-frame.svg);
```

### HTML Files Reference JavaScript
```html
<!-- Modular JavaScript -->
<script src="js/shared/panel-manager.js"></script>
<script src="js/markdown/rule-engine.js"></script>
<script src="js/index-main.js"></script>
```

## Directory Purpose

| Folder | Purpose | Contents |
|--------|---------|----------|
| **assets/** | Static assets (images, graphics) | 10 SVG/PNG files |
| **css/** | All stylesheets | 18 CSS files |
| **js/** | Modular JavaScript | 2 subfolders, 9 modules |
| **js/shared/** | Reusable components | 2 modules |
| **js/markdown/** | Markdown-specific | 5 modules |
| **old-monolithic-code/** | Archived backups | 2 old files |

## Benefits of This Structure

### 1. **Cleaner Root Directory**
- Only essential files at root level
- Easy to find HTML files
- Documentation grouped together

### 2. **Logical Organization**
- Assets grouped by type
- CSS organized together
- JavaScript organized by purpose

### 3. **Easier Navigation**
- Know exactly where to find files
- Clear separation of concerns
- Scalable structure

### 4. **Better Version Control**
- Changes grouped by file type
- Easier to track modifications
- Clear commit diffs

### 5. **Deployment Ready**
- Can easily exclude old-monolithic-code/
- Asset folder can be CDN-optimized
- Clear what's production vs. backup

## Future Additions

New files will fit naturally into this structure:

```
css/
└── dark-mode.css              # Future: dark theme

assets/
├── icons/                     # Future: icon set
└── fonts/                     # Future: custom fonts

js/
├── markdown/
│   └── document-manager.js    # Future: tab management
├── shared/
│   └── keyboard-manager.js    # Future: shortcuts
└── utils/
    └── storage.js             # Future: localStorage wrapper
```

## Migration Complete! ✨

All files have been organized into logical folders while maintaining 100% functionality. The project is now much cleaner and easier to navigate!
