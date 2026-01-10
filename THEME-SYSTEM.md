# Universal Theme System

## Overview
The markdown editor now supports **universal CSS theme loading**, allowing you to switch between different visual styles including CSS Zen Garden themes, Typora themes, and custom CSS files.

## Features

### Theme Management
- **Built-in Themes** - Includes default theme and sample themes
- **CSS Zen Garden Support** - Load external CSS Zen Garden themes
- **Custom CSS Loading** - Upload and use your own CSS files
- **Theme Persistence** - Selected theme saved to localStorage
- **Theme Deletion** - Remove custom themes when no longer needed

### User Interface
- **Theme Selector Modal** - Clean modal interface to browse and select themes
- **Current Theme Display** - Shows active theme name in View panel
- **Load Custom CSS Button** - Upload CSS files from your computer
- **Delete Custom Themes** - Remove uploaded themes with confirmation

## How to Use

### Selecting a Theme

1. Open the **View** panel
2. Click **"Select Theme..."** button
3. Browse available themes in the modal
4. Click on any theme to apply it immediately
5. The theme is automatically saved

### Loading Custom CSS

1. Open the **View** panel
2. Click **"Load Custom CSS"** button
3. Select a `.css` file from your computer
4. The theme is loaded and saved automatically

### Deleting Custom Themes

1. Open the theme selector
2. Find your custom theme (marked as CUSTOM type)
3. Click the **×** button next to the theme name
4. Confirm deletion

**Note**: Built-in and protected themes cannot be deleted. Only custom user-uploaded themes show the delete button.

## Built-in Themes

### Default
- Type: `builtin`
- Uses the base CSS Zen Garden styling
- No external CSS loaded

### Cyberpunk
- Type: `typora` (protected)
- Modern cyberpunk theme with neon aesthetics and backlit glass UI
- Located at `themes/cyberpunk.css`
- **Protected**: Cannot be deleted from theme selector
- Features:
  - Neon color palette (cyan, pink, purple, yellow, green)
  - Orbitron and Rajdhani fonts
  - Glowing text effects on headings
  - Matrix-style code blocks with green text
  - Backlit glass effect on panel content areas
  - Wire decorations disabled for clean modern look

### LCARS
- Type: `typora` (protected)
- Star Trek LCARS interface theme
- Located at `themes/lcars-theme.css`
- **Protected**: Cannot be deleted from theme selector
- Features:
  - Orange/purple LCARS color scheme
  - Decorative wire frame elements
  - Teko font for authentic LCARS typography

### Sample Dark
- Type: `local`
- Dark theme with blue accents
- Located at `themes/sample-dark.css`

### Sample Nature
- Type: `local`
- Light theme with green/earth tones
- Located at `themes/sample-nature.css`

### CSS Zen Garden Themes
- Type: `zen-garden`
- External themes from csszengarden.com
- Screen Filler (#214)
- Fountain Kiss (#213)
- A Robot Named Jimmy (#212)

## Creating Your Own Theme

### Theme File Structure

Create a standard CSS file that targets the markdown editor elements:

```css
/**
 * My Custom Theme
 * Description of your theme
 */

/* Global styling */
body {
    background: #yourcolor;
    color: #textcolor;
}

/* Panels */
.editor-panel {
    background: rgba(0, 0, 0, 0.9);
    border-color: #yourcolor;
}

/* Editor */
.markdown-textarea {
    background: #editorcolor !important;
    color: #textcolor !important;
}

/* Preview */
.markdown-output {
    background: #previewcolor !important;
    color: #textcolor !important;
}

/* Document tabs */
.document-tab {
    background: #tabcolor;
    color: #textcolor;
}

.document-tab.active {
    background: #activetabcolor;
    color: #activetext;
}
```

### Key CSS Classes to Style

#### Main Structure
- `body` - Global background and text
- `.page-wrapper` - Main page container
- `header h1` - Main title
- `header h2` - Subtitle

#### Panels
- `.editor-panel` - Side panel background
- `.panel-tab-label` - Panel tab buttons
- `.panel-content` - Panel content area
- `.panel-button` - Buttons inside panels

#### Editor
- `.markdown-textarea` - Raw markdown input area
- `.markdown-output` - Rendered preview area
- `.editor-divider` - Resizable divider between editor/preview
- `.editor-container` - Container for editor and preview

#### Document Tabs
- `.document-tabs-container` - Tab bar container
- `.document-tab` - Individual tab
- `.document-tab.active` - Active tab
- `.document-tab-name` - Tab text
- `.document-tab-close` - Close button (×)
- `.document-tab-new` - New tab button (+)

### Using !important

Some properties like background and color in `.markdown-textarea` and `.markdown-output` should use `!important` to override inline styles.

## Theme Types

The system automatically detects theme types:

### 1. Builtin
- No external CSS file
- Uses base editor styles
- Example: Default theme

### 2. Local
- Local CSS file in project
- Located in `themes/` folder
- Example: Sample Dark, Sample Nature

### 3. Zen Garden
- External CSS from csszengarden.com
- Full page redesign
- May affect entire page structure

### 4. Typora
- Themes from Typora markdown editor
- Detected by `#write` or `.typora-export` selectors
- May need adaptation for this editor

### 5. Generic
- Any other CSS file
- Custom or third-party themes
- Fallback category

### 6. Custom
- User-uploaded themes
- Stored in localStorage
- Can be deleted by user

## Protected Themes

Some built-in themes are marked as **protected** to prevent accidental deletion:

- Protected themes are part of the project's theme collection
- They appear in the theme selector but without a delete button (×)
- Loading a protected theme uses the same mechanism as custom CSS for compatibility
- Protected themes are NOT saved to localStorage as custom themes

Example: The LCARS theme is protected because it ships with the project.

## Technical Details

### ThemeLoader API

```javascript
// Create theme loader
const themeLoader = new ThemeLoader({
    onThemeChange: (theme) => {
        console.log('Theme changed:', theme.name);
    }
});

// Initialize (loads saved theme)
themeLoader.init();

// Get all themes
const allThemes = themeLoader.getAllThemes();

// Load theme by ID
themeLoader.loadThemeById('sample-dark');

// Load custom CSS file
await themeLoader.loadCustomCSSFile(file);

// Load custom CSS file as protected (won't be saved to localStorage)
await themeLoader.loadCustomCSSFile(file, { isProtected: true });

// Load custom CSS file with wire decorations disabled
await themeLoader.loadCustomCSSFile(file, { disableWireDecorations: true });

// Get current theme
const current = themeLoader.getCurrentTheme();

// Reset to default
themeLoader.resetToDefault();

// Delete custom theme
themeLoader.deleteCustomTheme('custom-123456');
```

### Theme Object Structure

```javascript
{
    name: 'Theme Name',
    type: 'local' | 'zen-garden' | 'typora' | 'generic' | 'builtin' | 'custom',
    url: 'path/to/theme.css' | null,
    content: 'css content...' // Only for custom themes
    isProtected: true | false // Optional, prevents deletion and localStorage saving
    disableWireDecorations: true | false // Optional, disables LCARS-style wire decorations for typora themes
}
```

### LocalStorage

#### Active Theme
- Key: `editor-current-theme`
- Value: JSON theme object
- Restored on page load

#### Custom Themes
- Key: `editor-custom-themes`
- Value: JSON object of custom themes
- Blob URLs recreated on load

## Adding More Built-in Themes

Edit `js/markdown/theme-loader.js`:

```javascript
this.builtInThemes = {
    // ... existing themes
    'my-new-theme': {
        name: 'My New Theme',
        type: 'local',
        url: 'themes/my-new-theme.css',
        isProtected: true // Optional: prevent deletion
    }
};
```

Then create the CSS file at `themes/my-new-theme.css`.

### Protected vs Regular Built-in Themes

- **Regular built-in**: Can be accessed normally, deletable if user uploads duplicate
- **Protected built-in**: Cannot be deleted, uses custom CSS loading mechanism for compatibility

## Typora Theme Support

To use Typora themes:

1. Download a Typora theme CSS file
2. Load it via "Load Custom CSS"
3. The system auto-detects it as type `typora`

**Note**: Typora themes may need adaptation since they target different HTML structure. You may need to modify the CSS to work with this editor.

### Wire Decorations for Typora Themes

Typora themes can optionally use LCARS-style wire decorations on panel tabs (FILE, EDIT, VIEW, etc.). These decorations consist of two types:

1. **Tab Label Decorations** - Small rectangles before/after tab text (e.g., FILE, EDIT, VIEW)
   - Defined in `css/219-panel-tabs.css` as `.panel-tab-label::before/::after`
   - Only apply when `body.typora-mode` class is present
   - Controlled by `disableWireDecorations` flag

2. **Panel Container Decorations** - SVG background wire frames on panel containers
   - Defined in `css/markdown-editor.css` as `.files-panel::before`, `.edit-panel::before`, etc.
   - Use SVG backgrounds: `url(../assets/hook2.svg)` and `url(../assets/layer-frame.svg)`
   - These are always present unless explicitly hidden by theme CSS
   - Located at lines 111-287 in markdown-editor.css

**Auto-Detection**:
- Themes with "cyberpunk", "modern", or "minimal" in the filename automatically disable wire decorations
- LCARS theme keeps wire decorations enabled (they match the LCARS aesthetic)
- Other Typora themes use wire decorations by default

**Manual Control**:
```javascript
// Explicitly disable wire decorations
await themeLoader.loadCustomCSSFile(file, { disableWireDecorations: true });

// Explicitly enable wire decorations
await themeLoader.loadCustomCSSFile(file, { disableWireDecorations: false });
```

**How It Works**:
1. Setting `disableWireDecorations: true` removes the `typora-mode` class from `<body>`
2. This prevents tab label decorations (::before/::after on .panel-tab-label) from applying
3. Themes should also include CSS to hide panel container decorations:
```css
.files-panel::before,
.files-panel::after,
.edit-panel::before,
.edit-panel::after,
.view-panel::before,
.view-panel::after,
.settings-panel::before,
.settings-panel::after,
.back-panel::before,
.back-panel::after {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
    background: none !important;
    content: normal !important;
}
```

**Troubleshooting Wire Decorations**:
If wire decorations are still visible after setting `disableWireDecorations: true`:
1. Use browser DevTools to inspect the wire element
2. Check the Styles panel to identify the source CSS file and line number
3. Wire decorations can come from:
   - `.panel-tab-label::before/::after` (tab labels) - controlled by typora-mode class
   - `.files-panel::before`, `.edit-panel::before`, etc. (panel containers) - need explicit CSS hiding
4. Add CSS rules targeting the specific selectors to your theme

## CSS Zen Garden Theme Support

CSS Zen Garden themes are fully supported:

1. Use built-in Zen Garden themes from the selector
2. Or find more at https://www.csszengarden.com
3. Add them to `builtInThemes` or load via URL

**Note**: Zen Garden themes redesign the entire page and may affect layout significantly.

## Advanced Theme Features

### Backlit Glass Effect

The Cyberpunk theme demonstrates a realistic backlit glass effect for panel content areas. This creates an illuminated, translucent appearance similar to backlit frosted glass.

**Implementation**:
```css
.panel-content {
    position: relative !important;
    background:
        /* Edge lighting - brightest at borders */
        radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.12) 0%, transparent 40%),
        radial-gradient(ellipse at top right, rgba(0, 245, 255, 0.10) 0%, transparent 40%),
        radial-gradient(ellipse at bottom left, rgba(179, 0, 255, 0.08) 0%, transparent 40%),
        radial-gradient(ellipse at bottom right, rgba(255, 255, 255, 0.10) 0%, transparent 40%),
        /* Base gradient */
        linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(0, 245, 255, 0.04) 20%,
            rgba(10, 10, 15, 0.98) 40%,
            rgba(10, 10, 15, 0.98) 60%,
            rgba(179, 0, 255, 0.04) 80%,
            rgba(255, 255, 255, 0.06) 100%
        ),
        var(--cyber-black) !important;
    box-shadow:
        /* Inner glow layers for depth */
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 245, 255, 0.08),
        inset 1px 0 0 rgba(179, 0, 255, 0.06),
        inset -1px 0 0 rgba(255, 255, 255, 0.08),
        /* Soft overall glow */
        inset 0 0 60px rgba(255, 255, 255, 0.02),
        inset 0 0 120px rgba(0, 245, 255, 0.015) !important;
    backdrop-filter: blur(3px) brightness(1.05) !important;
    border: 1px solid rgba(0, 245, 255, 0.1) !important;
}
```

**Key Techniques**:
1. **Radial gradients at corners** - Creates edge lighting effect where light appears brightest at borders
2. **Layered inset box-shadows** - Simulates light hitting the inner surface from different angles
3. **Diagonal base gradient** - Darker in center, brighter at edges mimics real backlit glass
4. **Backdrop-filter with brightness** - Makes it look like light is passing through the glass
5. **Low opacity values** (0.02-0.15) - Subtle effect that doesn't overwhelm content

## Best Practices

### Theme Design
- Use relative units (em, rem, %) for responsiveness
- Test with different content lengths
- Ensure good contrast for readability
- Support both light and dark preferences
- Consider adding special effects (glow, glass, shadows) for immersive themes

### Performance
- Keep CSS files small (<100KB recommended)
- Minimize use of heavy shadows/effects
- Use CSS variables for consistency
- Multiple layered gradients and shadows can impact performance on low-end devices

### Compatibility
- Test theme with editor features (tabs, panels, etc.)
- Ensure buttons remain clickable
- Check scrollbar visibility
- Verify divider remains draggable
- Test panel expansion/collapse animations with your theme styling

## Troubleshooting

### Theme Not Loading
- Check browser console for CSS errors
- Verify CSS file path is correct
- Ensure file is accessible (CORS for external)

### Theme Looks Broken
- Some themes may need adaptation
- Check if selectors match editor structure
- Try resetting to Default theme

### Custom Theme Lost
- Custom themes use blob URLs
- Only persist in localStorage
- Export/backup custom CSS files separately

## Future Enhancements

- Theme preview before applying
- Theme export/import
- Online theme repository
- Theme editor interface
- Dark mode auto-detection
- Theme categories/tags
- Theme ratings/favorites

## Architecture

### SOLID Principles
- **Single Responsibility**: ThemeLoader only manages themes
- **Open/Closed**: Extensible for new theme types
- **Dependency Inversion**: Minimal dependencies

### Files
- `js/markdown/theme-loader.js` - Theme loader class
- `js/markdown-editor-main.js` - Integration code
- `themes/` - Built-in theme CSS files

### Flow
```
User clicks "Select Theme..."
         │
         ▼
showThemeSelector() displays modal
         │
         ▼
User selects theme
         │
         ▼
themeLoader.loadThemeById(id)
         │
         ├─► Remove existing <link> if any
         ├─► Create new <link> element
         ├─► Set href to theme URL
         ├─► Append to <head>
         └─► Save to localStorage
         │
         ▼
onThemeChange callback
         │
         └─► updateThemeDisplay()
```

## Credits

- CSS Zen Garden themes: http://www.csszengarden.com
- Typora editor: https://typora.io
- Base CSS Zen Garden design: Dave Shea

## License

The theme system is part of the markdown editor project.
Individual themes retain their original licenses.
