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

## Built-in Themes

### Default
- Type: `builtin`
- Uses the base CSS Zen Garden styling
- No external CSS loaded

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
        url: 'themes/my-new-theme.css'
    }
};
```

Then create the CSS file at `themes/my-new-theme.css`.

## Typora Theme Support

To use Typora themes:

1. Download a Typora theme CSS file
2. Load it via "Load Custom CSS"
3. The system auto-detects it as type `typora`

**Note**: Typora themes may need adaptation since they target different HTML structure. You may need to modify the CSS to work with this editor.

## CSS Zen Garden Theme Support

CSS Zen Garden themes are fully supported:

1. Use built-in Zen Garden themes from the selector
2. Or find more at https://www.csszengarden.com
3. Add them to `builtInThemes` or load via URL

**Note**: Zen Garden themes redesign the entire page and may affect layout significantly.

## Best Practices

### Theme Design
- Use relative units (em, rem, %) for responsiveness
- Test with different content lengths
- Ensure good contrast for readability
- Support both light and dark preferences

### Performance
- Keep CSS files small (<100KB recommended)
- Minimize use of heavy shadows/effects
- Use CSS variables for consistency

### Compatibility
- Test theme with editor features (tabs, panels, etc.)
- Ensure buttons remain clickable
- Check scrollbar visibility
- Verify divider remains draggable

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
