/**
 * Settings Manager Module
 * Manages application settings with validation, persistence, and event notifications
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles settings management
 * - Open/Closed: Extensible through schema definitions
 * - Dependency Inversion: Depends on abstractions (schemas), not concrete implementations
 */

/**
 * Custom error class for settings validation failures
 */
class SettingsError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} path - Settings path that caused the error (e.g., 'editor.fontSize')
     * @param {*} value - The invalid value
     * @param {string} reason - Why the value is invalid
     */
    constructor(message, path = null, value = undefined, reason = null) {
        super(message);
        this.name = 'SettingsError';
        this.path = path;
        this.value = value;
        this.reason = reason;
    }
}

/**
 * Settings Manager Class
 * Handles all settings operations with validation and persistence
 */
class SettingsManager {
    /**
     * Storage key for localStorage
     * @type {string}
     */
    static STORAGE_KEY = 'markdownEditor_settings';

    /**
     * Current schema version for migrations
     * @type {number}
     */
    static SCHEMA_VERSION = 1;

    /**
     * Default debounce delay for auto-save (ms)
     * @type {number}
     */
    static DEBOUNCE_DELAY = 500;

    /**
     * Default settings structure
     * @returns {Object} Default settings object
     */
    static getDefaultSettings() {
        return {
            editor: {
                fontSize: 14,
                lineHeight: 1.5,
                tabSize: 2,
                fontFamily: "'Consolas', monospace",
                lineNumbers: false,
                wordWrap: true,
                layout: 'split',
                zoom: 100,
                scrollSync: {
                    enabled: false,
                    offset: 0
                }
            },
            theme: {
                current: 'default',
                tabMenu: 'steel'
            }
        };
    }

    /**
     * Settings schema for validation
     * Each setting defines its type, constraints, and validation rules
     * @returns {Object} Schema object
     */
    static getSettingsSchema() {
        return {
            editor: {
                fontSize: {
                    type: 'number',
                    min: 8,
                    max: 72,
                    description: 'Editor font size in pixels'
                },
                lineHeight: {
                    type: 'number',
                    min: 1.0,
                    max: 3.0,
                    description: 'Line height multiplier'
                },
                tabSize: {
                    type: 'number',
                    min: 1,
                    max: 8,
                    values: [1, 2, 4, 8],
                    description: 'Tab size in spaces'
                },
                fontFamily: {
                    type: 'string',
                    description: 'Editor font family'
                },
                lineNumbers: {
                    type: 'boolean',
                    description: 'Show line numbers'
                },
                wordWrap: {
                    type: 'boolean',
                    description: 'Enable word wrap'
                },
                layout: {
                    type: 'string',
                    values: ['edit', 'split', 'preview'],
                    description: 'Editor layout mode'
                },
                zoom: {
                    type: 'number',
                    min: 50,
                    max: 200,
                    step: 10,
                    description: 'Zoom level percentage'
                },
                scrollSync: {
                    enabled: {
                        type: 'boolean',
                        description: 'Enable scroll synchronization'
                    },
                    offset: {
                        type: 'number',
                        min: -10,
                        max: 10,
                        description: 'Scroll sync offset in lines'
                    }
                }
            },
            theme: {
                current: {
                    type: 'string',
                    description: 'Current theme ID'
                },
                tabMenu: {
                    type: 'string',
                    values: ['steel', 'minimal', 'classic'],
                    description: 'Tab menu style'
                }
            }
        };
    }

    constructor() {
        // Three-state system for tracking changes
        this.lastSavedSettings = null;  // What's actually in localStorage
        this.previousSettings = null;    // For revert functionality
        this.currentSettings = null;     // Live working state

        // Debounce timer for auto-save
        this.saveDebounceTimer = null;

        // Event listeners registry
        this.listeners = new Map();

        // Initialization flag
        this.initialized = false;
    }

    /**
     * Initialize the settings manager
     * Loads settings from storage or creates defaults
     * @returns {SettingsManager} this instance for chaining
     */
    init() {
        if (this.initialized) {
            return this;
        }

        // Load settings from storage or use defaults
        this.load();

        this.initialized = true;
        return this;
    }

    /**
     * Get a setting value by path
     * @param {string} path - Dot-notation path (e.g., 'editor.fontSize')
     * @returns {*} The setting value
     * @throws {SettingsError} If path is invalid
     */
    get(path) {
        if (!path || typeof path !== 'string') {
            throw new SettingsError('Invalid settings path', path, undefined, 'Path must be a non-empty string');
        }

        const parts = path.split('.');
        let value = this.currentSettings;

        for (const part of parts) {
            if (value === null || value === undefined || typeof value !== 'object') {
                throw new SettingsError(`Invalid settings path: ${path}`, path, undefined, `Path segment '${part}' not found`);
            }
            value = value[part];
        }

        if (value === undefined) {
            throw new SettingsError(`Setting not found: ${path}`, path, undefined, 'Setting does not exist');
        }

        return value;
    }

    /**
     * Set a setting value by path with validation
     * @param {string} path - Dot-notation path (e.g., 'editor.fontSize')
     * @param {*} value - The value to set
     * @param {Object} options - Options { skipValidation: false, skipAutoSave: false }
     * @returns {SettingsManager} this instance for chaining
     * @throws {SettingsError} If validation fails
     */
    set(path, value, options = {}) {
        const { skipValidation = false, skipAutoSave = false } = options;

        if (!path || typeof path !== 'string') {
            throw new SettingsError('Invalid settings path', path, value, 'Path must be a non-empty string');
        }

        // Get schema for validation
        const schema = this.getSchema(path);
        if (!schema) {
            throw new SettingsError(`Unknown setting: ${path}`, path, value, 'Setting not found in schema');
        }

        // Validate value against schema
        if (!skipValidation) {
            this.validateValue(value, schema, path);
        }

        // Update the setting value
        this.setNestedValue(this.currentSettings, path, value);

        // Notify listeners of the change
        this.emit(`settings:${path}`, { path, value, timestamp: Date.now() });
        this.emit('settings:changed', { path, value, timestamp: Date.now() });

        // Schedule debounced save unless skipped
        if (!skipAutoSave) {
            this.scheduleSave();
        }

        return this;
    }

    /**
     * Set a nested value in an object by dot-notation path
     * @param {Object} obj - Object to modify
     * @param {string} path - Dot-notation path
     * @param {*} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const parts = path.split('.');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (current[part] === undefined || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Load settings from localStorage
     * Merges stored settings with defaults to handle new settings added in updates
     * @returns {Object} Loaded settings
     */
    load() {
        const defaults = SettingsManager.getDefaultSettings();
        let loadedSettings = null;

        try {
            const stored = localStorage.getItem(SettingsManager.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all settings exist
                loadedSettings = this.mergeWithDefaults(parsed.settings || parsed, defaults);
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }

        // Use loaded settings or defaults
        const settings = loadedSettings || defaults;

        // Initialize three-state system using structuredClone for deep copy
        this.lastSavedSettings = structuredClone(settings);
        this.previousSettings = structuredClone(settings);
        this.currentSettings = structuredClone(settings);

        return this.currentSettings;
    }

    /**
     * Merge loaded settings with defaults
     * Ensures new settings added in updates get their default values
     * @param {Object} loaded - Settings loaded from storage
     * @param {Object} defaults - Default settings
     * @returns {Object} Merged settings
     */
    mergeWithDefaults(loaded, defaults) {
        const result = structuredClone(defaults);

        for (const module of Object.keys(defaults)) {
            if (loaded[module] && typeof loaded[module] === 'object') {
                for (const key of Object.keys(defaults[module])) {
                    if (loaded[module][key] !== undefined) {
                        result[module][key] = loaded[module][key];
                    }
                }
            }
        }

        return result;
    }

    /**
     * Save current settings to localStorage
     * @returns {boolean} Success status
     */
    saveToStorage() {
        try {
            const data = {
                version: SettingsManager.SCHEMA_VERSION,
                settings: this.currentSettings
            };
            localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
            return false;
        }
    }

    /**
     * Schedule a debounced save to localStorage
     */
    scheduleSave() {
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        this.saveDebounceTimer = setTimeout(() => {
            this.saveToStorage();
            this.lastSavedSettings = structuredClone(this.currentSettings);
            this.saveDebounceTimer = null;
        }, SettingsManager.DEBOUNCE_DELAY);
    }

    /**
     * Explicit save - immediately persist and update snapshots
     * @returns {boolean} Success status
     */
    save() {
        // Clear any pending debounced save
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = null;
        }

        const success = this.saveToStorage();
        if (success) {
            this.lastSavedSettings = structuredClone(this.currentSettings);
            this.previousSettings = structuredClone(this.currentSettings);
        }
        return success;
    }

    /**
     * Cancel - revert to previousSettings (before edit session)
     * @returns {SettingsManager} this instance for chaining
     */
    cancel() {
        // Clear any pending debounced save
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = null;
        }

        this.currentSettings = structuredClone(this.previousSettings);
        this.saveToStorage();
        this.lastSavedSettings = structuredClone(this.currentSettings);

        // Notify all listeners of the revert
        this.notifyAllListeners();

        return this;
    }

    /**
     * Revert - go back to lastSavedSettings (last disk state)
     * @returns {SettingsManager} this instance for chaining
     */
    revert() {
        // Clear any pending debounced save
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = null;
        }

        this.currentSettings = structuredClone(this.lastSavedSettings);

        // Notify all listeners of the revert
        this.notifyAllListeners();

        return this;
    }

    /**
     * Check if there are unsaved changes
     * @returns {boolean} True if there are unsaved changes
     */
    hasUnsavedChanges() {
        return JSON.stringify(this.currentSettings) !== JSON.stringify(this.lastSavedSettings);
    }

    /**
     * Notify all listeners of current settings (used after revert/cancel)
     * Emits events for each setting that may have changed
     */
    notifyAllListeners() {
        const timestamp = Date.now();

        // Iterate through all modules and their settings
        for (const [module, settings] of Object.entries(this.currentSettings)) {
            if (typeof settings === 'object' && settings !== null) {
                for (const [key, value] of Object.entries(settings)) {
                    const path = `${module}.${key}`;
                    this.emit(`settings:${path}`, { path, value, timestamp });
                }
            }
        }

        // Also emit generic changed event
        this.emit('settings:changed', {
            path: '*',
            value: this.currentSettings,
            timestamp
        });
    }

    /**
     * Validate a value against a schema definition
     * @param {*} value - Value to validate
     * @param {Object} schema - Schema definition
     * @param {string} path - Settings path for error reporting
     * @returns {boolean} True if valid
     * @throws {SettingsError} If validation fails
     */
    validateValue(value, schema, path) {
        // Type validation
        if (schema.type === 'boolean' && typeof value !== 'boolean') {
            throw new SettingsError(
                `Invalid type for ${path}: expected boolean, got ${typeof value}`,
                path,
                value,
                'Type mismatch'
            );
        }

        if (schema.type === 'number') {
            if (typeof value !== 'number' || isNaN(value)) {
                throw new SettingsError(
                    `Invalid type for ${path}: expected number, got ${typeof value}`,
                    path,
                    value,
                    'Type mismatch'
                );
            }

            // Range validation
            if (schema.min !== undefined && value < schema.min) {
                throw new SettingsError(
                    `Value for ${path} is below minimum (${schema.min})`,
                    path,
                    value,
                    'Below minimum'
                );
            }

            if (schema.max !== undefined && value > schema.max) {
                throw new SettingsError(
                    `Value for ${path} is above maximum (${schema.max})`,
                    path,
                    value,
                    'Above maximum'
                );
            }

            // Allowed values validation
            if (schema.values && !schema.values.includes(value)) {
                throw new SettingsError(
                    `Invalid value for ${path}: must be one of [${schema.values.join(', ')}]`,
                    path,
                    value,
                    'Invalid value'
                );
            }
        }

        if (schema.type === 'string') {
            if (typeof value !== 'string') {
                throw new SettingsError(
                    `Invalid type for ${path}: expected string, got ${typeof value}`,
                    path,
                    value,
                    'Type mismatch'
                );
            }

            // Allowed values validation
            if (schema.values && !schema.values.includes(value)) {
                throw new SettingsError(
                    `Invalid value for ${path}: must be one of [${schema.values.join(', ')}]`,
                    path,
                    value,
                    'Invalid value'
                );
            }
        }

        return true;
    }

    /**
     * Get schema for a settings path
     * @param {string} path - Dot-notation path
     * @returns {Object|null} Schema definition or null if not found
     */
    getSchema(path) {
        const parts = path.split('.');
        let schema = SettingsManager.getSettingsSchema();

        for (const part of parts) {
            if (!schema || typeof schema !== 'object') {
                return null;
            }
            schema = schema[part];
        }

        return schema || null;
    }

    /**
     * Subscribe to settings changes
     * @param {string} event - Event name (e.g., 'settings:changed', 'settings:editor.fontSize')
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        // Note: DOM events are dispatched by emit() for external modules that use
        // document.addEventListener() directly. Internal subscribers use this.listeners only.
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    /**
     * Emit a settings event
     * Notifies both internal listeners and dispatches DOM CustomEvent
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        // Notify internal listeners
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in settings listener for ${event}:`, error);
                }
            });
        }

        // Dispatch DOM CustomEvent for cross-module communication
        const customEvent = new CustomEvent(event, { detail: data });
        document.dispatchEvent(customEvent);
    }

    /**
     * Export settings to JSON string
     * @returns {string} JSON string of current settings
     */
    export() {
        const exportData = {
            version: SettingsManager.SCHEMA_VERSION,
            exportDate: new Date().toISOString(),
            settings: this.currentSettings
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Export settings and trigger download
     */
    exportToFile() {
        const json = this.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `markdown-editor-settings-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import settings from JSON string
     * @param {string} json - JSON string of settings
     * @returns {Object} Result { success: boolean, errors?: string[], warnings?: string[] }
     */
    import(json) {
        const errors = [];
        const warnings = [];

        try {
            const imported = JSON.parse(json);

            // Validate structure
            if (!imported.settings || typeof imported.settings !== 'object') {
                return { success: false, errors: ['Invalid settings file format: missing settings object'] };
            }

            const defaults = SettingsManager.getDefaultSettings();
            const schema = SettingsManager.getSettingsSchema();

            // Validate and sanitize each module's settings
            for (const [moduleName, moduleSettings] of Object.entries(imported.settings)) {
                if (!defaults[moduleName]) {
                    warnings.push(`Unknown module '${moduleName}' will be ignored`);
                    continue;
                }

                if (typeof moduleSettings !== 'object' || moduleSettings === null) {
                    warnings.push(`Invalid settings for module '${moduleName}'`);
                    continue;
                }

                for (const [key, value] of Object.entries(moduleSettings)) {
                    const path = `${moduleName}.${key}`;
                    const settingSchema = schema[moduleName]?.[key];

                    if (!settingSchema) {
                        warnings.push(`Unknown setting '${path}' will be ignored`);
                        continue;
                    }

                    try {
                        this.validateValue(value, settingSchema, path);
                        this.setNestedValue(this.currentSettings, path, value);
                    } catch (error) {
                        warnings.push(`Invalid value for '${path}': ${error.message}`);
                    }
                }
            }

            // Save the imported settings
            this.save();
            this.notifyAllListeners();

            return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
        } catch (error) {
            return { success: false, errors: [`Parse error: ${error.message}`] };
        }
    }

    /**
     * Import settings from a File object
     * @param {File} file - JSON file to import
     * @returns {Promise<Object>} Result { success: boolean, errors?: string[], warnings?: string[] }
     */
    async importFromFile(file) {
        try {
            const text = await file.text();
            return this.import(text);
        } catch (error) {
            return { success: false, errors: [`Failed to read file: ${error.message}`] };
        }
    }

    /**
     * Reset a specific module to defaults
     * @param {string} moduleName - Module name (e.g., 'editor', 'view')
     * @returns {SettingsManager} this instance for chaining
     * @throws {SettingsError} If module is unknown
     */
    resetModule(moduleName) {
        const defaults = SettingsManager.getDefaultSettings();

        if (!defaults[moduleName]) {
            throw new SettingsError(`Unknown module: ${moduleName}`, moduleName, undefined, 'Module not found');
        }

        this.currentSettings[moduleName] = structuredClone(defaults[moduleName]);
        this.save();

        // Notify listeners for each reset setting
        const timestamp = Date.now();
        for (const [key, value] of Object.entries(this.currentSettings[moduleName])) {
            const path = `${moduleName}.${key}`;
            this.emit(`settings:${path}`, { path, value, timestamp });
        }

        this.emit('settings:changed', {
            path: `${moduleName}:reset`,
            value: this.currentSettings[moduleName],
            timestamp
        });

        return this;
    }

    /**
     * Reset all settings to defaults
     * @returns {SettingsManager} this instance for chaining
     */
    resetAll() {
        this.currentSettings = structuredClone(SettingsManager.getDefaultSettings());
        this.save();
        this.notifyAllListeners();
        return this;
    }

    /**
     * Migrate legacy localStorage keys to new settings structure
     * @returns {boolean} True if migration was performed
     */
    migrateLegacy() {
        const migrations = [
            { oldKey: 'tab-menu-style', newPath: 'theme.tabMenu', default: 'steel' },
            { oldKey: 'current-theme', newPath: 'theme.current', default: 'default' },
            { oldKey: 'editor-layout', newPath: 'view.mode', default: 'split' },
            { oldKey: 'editor-zoom', newPath: 'view.zoom', default: 100, transform: parseInt },
            { oldKey: 'editor-line-numbers', newPath: 'editor.lineNumbers', default: true, transform: v => v === 'true' },
            { oldKey: 'editor-word-wrap', newPath: 'editor.wordWrap', default: true, transform: v => v === 'true' },
            { oldKey: 'editor-scroll-sync', newPath: 'scrollSync.enabled', default: true, transform: v => v === 'true' },
            { oldKey: 'editor-scroll-sync-offset', newPath: 'scrollSync.offset', default: 3, transform: parseInt }
        ];

        let migrated = false;

        migrations.forEach(({ oldKey, newPath, transform }) => {
            const oldValue = localStorage.getItem(oldKey);
            if (oldValue !== null) {
                try {
                    const value = transform ? transform(oldValue) : oldValue;
                    this.setNestedValue(this.currentSettings, newPath, value);
                    localStorage.removeItem(oldKey); // Clean up old key
                    migrated = true;
                } catch (error) {
                    console.warn(`Failed to migrate ${oldKey}:`, error);
                }
            }
        });

        if (migrated) {
            this.save();
        }

        return migrated;
    }

    /**
     * Initialize with migration check
     * Call this instead of init() to automatically migrate legacy settings
     * @returns {SettingsManager} this instance for chaining
     */
    initWithMigration() {
        if (this.initialized) {
            return this;
        }

        // Check if we have new settings format already
        const hasNewSettings = localStorage.getItem(SettingsManager.STORAGE_KEY) !== null;

        // Load settings (defaults or from storage)
        this.load();

        // If no new settings exist, try to migrate legacy keys
        if (!hasNewSettings) {
            this.migrateLegacy();
        }

        this.initialized = true;
        return this;
    }

    // ========================================================================
    // CONVENIENCE METHODS
    // ========================================================================

    /**
     * Update multiple settings at once
     * @param {Object} settings - Object with path:value pairs
     * @returns {SettingsManager} this instance for chaining
     * @throws {SettingsError} If any validation fails
     */
    setMultiple(settings) {
        for (const [path, value] of Object.entries(settings)) {
            this.set(path, value, { skipAutoSave: true });
        }
        this.scheduleSave();
        return this;
    }

    /**
     * Get all settings for a specific module
     * @param {string} moduleName - Module name (e.g., 'editor', 'view')
     * @returns {Object} Module settings object (copy)
     * @throws {SettingsError} If module is unknown
     */
    getModule(moduleName) {
        if (!this.currentSettings[moduleName]) {
            throw new SettingsError(`Unknown module: ${moduleName}`, moduleName, undefined, 'Module not found');
        }
        return structuredClone(this.currentSettings[moduleName]);
    }

    /**
     * Get default value for a setting
     * @param {string} path - Dot-notation path
     * @returns {*} Default value
     * @throws {SettingsError} If path is invalid
     */
    getDefault(path) {
        const parts = path.split('.');
        let value = SettingsManager.getDefaultSettings();

        for (const part of parts) {
            if (value === null || value === undefined || typeof value !== 'object') {
                throw new SettingsError(`Invalid settings path: ${path}`, path, undefined, 'Path not found');
            }
            value = value[part];
        }

        if (value === undefined) {
            throw new SettingsError(`Default not found for: ${path}`, path, undefined, 'Setting does not exist');
        }

        return value;
    }

    /**
     * Convenience wrapper for subscribing to a specific setting change
     * @param {string} path - Setting path to watch (e.g., 'editor.fontSize')
     * @param {Function} callback - Function to call on change: (value, detail) => {}
     * @returns {Function} Unsubscribe function
     */
    onChange(path, callback) {
        return this.on(`settings:${path}`, (detail) => {
            callback(detail.value, detail);
        });
    }

    /**
     * Convenience wrapper for subscribing to any setting change
     * @param {Function} callback - Function to call on any change: (detail) => {}
     * @returns {Function} Unsubscribe function
     */
    onAnyChange(callback) {
        return this.on('settings:changed', callback);
    }

    /**
     * Get the settings object for direct read access
     * Note: For writes, always use set() method
     * @returns {Object} Current settings (reference, not copy)
     */
    get settings() {
        return this.currentSettings;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsManager, SettingsError };
}
