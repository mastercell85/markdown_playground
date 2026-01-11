/**
 * Universal Theme Loader
 * Dynamically loads and manages CSS themes for the markdown editor
 *
 * Supports:
 * - CSS Zen Garden themes
 * - Typora themes
 * - Generic markdown editor themes
 * - Custom CSS files
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages theme loading and switching
 * - Open/Closed: Extensible for new theme types
 * - Dependency Inversion: Minimal dependencies
 */

class ThemeLoader {
    constructor(config = {}) {
        this.currentTheme = null;
        this.themeLink = null;
        this.onThemeChange = config.onThemeChange || null;

        // Initialize Typora adapter
        this.typoraAdapter = new TyporaAdapter();

        // Built-in themes registry - Updated for v2 CSS variable system
        this.builtInThemes = {
            'default': {
                name: 'Default',
                type: 'builtin',
                themeId: 'default',
                url: null // No external CSS, uses base styles
            },
            'cyberpunk': {
                name: 'Cyberpunk',
                type: 'variable-theme',
                themeId: 'cyberpunk',
                url: 'themes/cyberpunk-theme-v2.css',
                isProtected: true
            },
            'lcars': {
                name: 'LCARS',
                type: 'variable-theme',
                themeId: 'lcars',
                url: 'themes/lcars-theme-v2.css',
                isProtected: true
            }
        };

        // Custom themes loaded by user
        this.customThemes = this.loadCustomThemes();
    }

    /**
     * Initialize theme loader
     */
    init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('editor-current-theme');
        if (savedTheme) {
            try {
                const themeData = JSON.parse(savedTheme);
                console.log('Loading saved theme from localStorage:', themeData);

                // Try to find the theme by name in built-in or custom themes first
                const allThemes = this.getAllThemes();
                const matchingTheme = Object.values(allThemes).find(t => t.name === themeData.name);

                if (matchingTheme) {
                    console.log('Found matching theme in registry:', matchingTheme);
                    this.loadTheme(matchingTheme);
                } else {
                    console.log('Theme not in registry, loading from saved data');
                    this.loadTheme(themeData);
                }
            } catch (error) {
                console.error('Failed to load saved theme:', error);
            }
        }

        return this;
    }

    /**
     * Get all available themes
     * @returns {Object} - All themes (built-in + custom)
     */
    getAllThemes() {
        return {
            ...this.builtInThemes,
            ...this.customThemes
        };
    }

    /**
     * Load a theme
     * @param {Object} theme - Theme object with url, name, type
     */
    loadTheme(theme) {
        if (!theme) {
            // If no theme provided, remove data-theme attribute
            document.documentElement.removeAttribute('data-theme');
            return;
        }

        // Remove existing theme link if any
        if (this.themeLink) {
            this.themeLink.remove();
            this.themeLink = null;
        }

        // Remove any duplicate style elements from previous Typora themes
        const duplicateStyle = document.getElementById('typora-input-duplicate');
        if (duplicateStyle) {
            duplicateStyle.remove();
        }

        // Remove old typora-mode class (from old system)
        document.body.classList.remove('typora-mode');

        // Handle new CSS variable-based themes
        if (theme.type === 'variable-theme') {
            console.log('CSS variable theme detected:', theme.name);

            // Set data-theme attribute on root element
            document.documentElement.setAttribute('data-theme', theme.themeId);
            console.log('Set data-theme attribute:', theme.themeId);

            // Load the theme CSS file
            if (theme.url) {
                this.themeLink = document.createElement('link');
                this.themeLink.rel = 'stylesheet';
                const cacheBuster = `?v=${Date.now()}`;
                this.themeLink.href = theme.url + cacheBuster;
                this.themeLink.id = 'dynamic-theme';
                document.head.appendChild(this.themeLink);
                console.log('Loaded theme CSS:', theme.url);
            }

        // Handle legacy Typora themes (for backward compatibility)
        } else if (theme.type === 'typora') {
            console.log('Legacy Typora theme detected, loading in compatibility mode');

            // Load the CSS in main window
            if (theme.url) {
                this.themeLink = document.createElement('link');
                this.themeLink.rel = 'stylesheet';
                const cacheBuster = theme.url.includes('blob:') ? '' : `?v=${Date.now()}`;
                this.themeLink.href = theme.url + cacheBuster;
                this.themeLink.id = 'dynamic-theme';
                document.head.appendChild(this.themeLink);

                // Wait for CSS to load, then duplicate #write styles to #write-input
                this.themeLink.addEventListener('load', () => {
                    this.duplicateWriteStyles();
                });
            }

            // Add typora-mode class for legacy themes
            if (!theme.disableWireDecorations) {
                document.body.classList.add('typora-mode');
            }

        // Handle built-in default theme
        } else if (theme.type === 'builtin') {
            console.log('Built-in theme (uses base CSS variables)');
            // Remove data-theme to use default :root variables
            document.documentElement.removeAttribute('data-theme');

        // Handle custom themes
        } else {
            console.log('Custom theme, loading normally (type: ' + theme.type + ')');

            // For custom themes, load normally
            if (theme.url) {
                this.themeLink = document.createElement('link');
                this.themeLink.rel = 'stylesheet';
                this.themeLink.href = theme.url;
                this.themeLink.id = 'dynamic-theme';
                document.head.appendChild(this.themeLink);
            }
        }

        // Update current theme
        this.currentTheme = theme;

        // Save to localStorage
        localStorage.setItem('editor-current-theme', JSON.stringify(theme));

        // Trigger callback
        if (this.onThemeChange) {
            this.onThemeChange(theme);
        }

        console.log('Theme loaded:', theme.name, `(type: ${theme.type})`);
    }

    /**
     * Load theme by ID
     * @param {string} themeId - Theme ID
     */
    loadThemeById(themeId) {
        const allThemes = this.getAllThemes();
        const theme = allThemes[themeId];

        if (!theme) {
            console.error('Theme not found:', themeId);
            return;
        }

        this.loadTheme(theme);
    }

    /**
     * Load custom CSS file
     * @param {File} file - CSS file from file input
     * @param {Object} options - Optional configuration
     * @param {boolean} options.isProtected - If true, theme won't be saved to custom themes
     * @param {boolean} options.disableWireDecorations - If true, removes typora-mode class to hide wire decorations
     */
    async loadCustomCSSFile(file, options = {}) {
        if (!file || !file.name.endsWith('.css')) {
            console.error('Invalid CSS file');
            return;
        }

        try {
            // Read file content
            const content = await file.text();

            // Detect theme type (typora or custom)
            const detectedType = this.detectThemeType(file.name, content);

            // Auto-detect if wire decorations should be disabled
            // Cyberpunk and similar modern themes don't need LCARS-style wire decorations
            const shouldDisableWires = options.disableWireDecorations !== undefined
                ? options.disableWireDecorations
                : (file.name.toLowerCase().includes('cyberpunk') ||
                   file.name.toLowerCase().includes('modern') ||
                   file.name.toLowerCase().includes('minimal'));

            // Create data URL
            const blob = new Blob([content], { type: 'text/css' });
            const url = URL.createObjectURL(blob);

            // Create theme object
            const customTheme = {
                name: file.name.replace('.css', ''),
                type: detectedType,
                url: url,
                content: content,
                timestamp: Date.now(),
                isProtected: options.isProtected || false,
                disableWireDecorations: shouldDisableWires
            };

            // Add to custom themes ONLY if not protected
            let themeId;
            if (!options.isProtected) {
                // Check if a theme with this name already exists
                const existingThemeId = Object.keys(this.customThemes).find(
                    id => this.customThemes[id].name === customTheme.name
                );

                if (existingThemeId) {
                    // Update existing theme instead of creating duplicate
                    themeId = existingThemeId;
                    console.log(`Updating existing theme: ${customTheme.name}`);

                    // Revoke old blob URL
                    if (this.customThemes[themeId].url &&
                        this.customThemes[themeId].url.startsWith('blob:')) {
                        URL.revokeObjectURL(this.customThemes[themeId].url);
                    }
                } else {
                    // Create new theme
                    themeId = `custom-${Date.now()}`;
                    console.log(`Creating new custom theme: ${customTheme.name}`);
                }

                this.customThemes[themeId] = customTheme;

                // Save custom themes
                this.saveCustomThemes();
            } else {
                // For protected themes, use the original built-in ID
                themeId = 'lcars';
            }

            // Load the theme
            this.loadTheme(customTheme);

            console.log('Custom theme loaded:', customTheme.name);

            return themeId;
        } catch (error) {
            console.error('Failed to load custom CSS file:', error);
        }
    }

    /**
     * Detect theme type
     * @param {string} filename - Name of the CSS file
     * @param {string} content - CSS content
     * @returns {string} - 'typora' or 'custom'
     */
    detectThemeType(filename, content) {
        // Check if filename suggests Typora theme
        if (filename.toLowerCase().includes('typora')) {
            console.log('Detected as Typora (filename contains "typora")');
            return 'typora';
        }

        // Check CSS content for Typora-specific patterns
        if (content.includes('#write') ||
            content.includes('.typora-export') ||
            content.includes('content.typora')) {
            console.log('Detected as Typora (CSS contains Typora selectors)');
            return 'typora';
        }

        // Everything else is custom (including CSS variable themes)
        console.log('Detected as custom theme');
        return 'custom';
    }

    /**
     * Load custom themes from localStorage
     * @returns {Object} - Custom themes
     */
    loadCustomThemes() {
        try {
            const saved = localStorage.getItem('editor-custom-themes');
            if (!saved) return {};

            const themes = JSON.parse(saved);

            // Recreate blob URLs for custom themes
            let needsResave = false;
            Object.keys(themes).forEach(id => {
                const theme = themes[id];
                if (theme.content) {
                    const blob = new Blob([theme.content], { type: 'text/css' });
                    theme.url = URL.createObjectURL(blob);

                    // Re-detect theme type in case detection logic changed
                    const detectedType = this.detectThemeType(theme.name, theme.content);
                    if (detectedType !== theme.type) {
                        console.log(`Re-detected theme "${theme.name}" as ${detectedType} (was ${theme.type})`);
                        theme.type = detectedType;
                        needsResave = true;
                    }
                } else {
                    console.warn(`Theme "${theme.name}" has no content - cannot re-detect type`);
                }
            });

            // Save if any types were updated
            if (needsResave) {
                console.log('Saving updated theme types to localStorage');
                localStorage.setItem('editor-custom-themes', JSON.stringify(themes));
            }

            return themes;
        } catch (error) {
            console.error('Failed to load custom themes:', error);
            return {};
        }
    }

    /**
     * Duplicate #write styles to #write-input for Typora themes
     * This allows the input area to also be styled by Typora themes
     */
    duplicateWriteStyles() {
        // Create a style element for duplicated rules
        const duplicateStyleId = 'typora-input-duplicate';
        let duplicateStyle = document.getElementById(duplicateStyleId);

        if (!duplicateStyle) {
            duplicateStyle = document.createElement('style');
            duplicateStyle.id = duplicateStyleId;
            document.head.appendChild(duplicateStyle);
        }

        // Get all stylesheets
        const sheets = Array.from(document.styleSheets);
        const duplicatedRules = [];

        sheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach(rule => {
                    // Check if rule targets #write
                    if (rule.selectorText && rule.selectorText.includes('#write')) {
                        // Duplicate the rule but replace #write with #write-input
                        const newSelector = rule.selectorText.replace(/#write/g, '#write-input');
                        const newRule = `${newSelector} { ${rule.style.cssText} }`;
                        duplicatedRules.push(newRule);
                    }
                });
            } catch (e) {
                // Cross-origin stylesheet, skip
            }
        });

        // Apply duplicated rules
        duplicateStyle.textContent = duplicatedRules.join('\n');
        console.log(`Duplicated ${duplicatedRules.length} #write styles to #write-input`);
    }

    /**
     * Save custom themes to localStorage
     */
    saveCustomThemes() {
        try {
            localStorage.setItem('editor-custom-themes', JSON.stringify(this.customThemes));
        } catch (error) {
            console.error('Failed to save custom themes:', error);
        }
    }

    /**
     * Delete a custom theme
     * @param {string} themeId - Theme ID
     */
    deleteCustomTheme(themeId) {
        if (!themeId.startsWith('custom-')) {
            console.error('Cannot delete built-in theme');
            return false;
        }

        const theme = this.customThemes[themeId];
        if (!theme) return false;

        // Revoke blob URL if it exists
        if (theme.url && theme.url.startsWith('blob:')) {
            URL.revokeObjectURL(theme.url);
        }

        // Remove from custom themes
        delete this.customThemes[themeId];

        // Save
        this.saveCustomThemes();

        // If currently active, switch to default
        if (this.currentTheme === theme) {
            this.loadThemeById('default');
        }

        return true;
    }

    /**
     * Get current theme
     * @returns {Object|null}
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Reset to default theme
     */
    resetToDefault() {
        this.loadThemeById('default');
    }

}

// Export for use in other modules (browser environment)
if (typeof window !== 'undefined') {
    window.ThemeLoader = ThemeLoader;
}

// Also support Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeLoader;
}
