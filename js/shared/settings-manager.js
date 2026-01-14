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
                fontFamily: 'monospace',
                lineNumbers: true,
                wordWrap: true
            },
            view: {
                mode: 'split',
                zoom: 100
            },
            scrollSync: {
                enabled: true,
                offset: 3
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
                    values: ['monospace', 'Consolas', 'Monaco', 'Courier New'],
                    description: 'Editor font family'
                },
                lineNumbers: {
                    type: 'boolean',
                    description: 'Show line numbers'
                },
                wordWrap: {
                    type: 'boolean',
                    description: 'Enable word wrap'
                }
            },
            view: {
                mode: {
                    type: 'string',
                    values: ['edit', 'split', 'preview'],
                    description: 'View mode'
                },
                zoom: {
                    type: 'number',
                    min: 50,
                    max: 200,
                    step: 10,
                    description: 'Zoom level percentage'
                }
            },
            scrollSync: {
                enabled: {
                    type: 'boolean',
                    description: 'Enable scroll synchronization'
                },
                offset: {
                    type: 'number',
                    min: 0,
                    max: 10,
                    description: 'Scroll sync offset in lines'
                }
            },
            theme: {
                current: {
                    type: 'string',
                    values: ['default', 'dark', 'light', 'sepia'],
                    description: 'Current theme'
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
        // TODO: Implement in feature/settings-manager-validation branch
        throw new SettingsError('set() not yet implemented', path, value, 'Pending implementation');
    }

    /**
     * Load settings from localStorage
     * @returns {Object} Loaded settings
     */
    load() {
        // TODO: Implement in feature/settings-manager-persistence branch
        // For now, initialize with defaults
        const defaults = SettingsManager.getDefaultSettings();
        this.lastSavedSettings = JSON.parse(JSON.stringify(defaults));
        this.previousSettings = JSON.parse(JSON.stringify(defaults));
        this.currentSettings = JSON.parse(JSON.stringify(defaults));
        return this.currentSettings;
    }

    /**
     * Save current settings to localStorage
     * @returns {boolean} Success status
     */
    save() {
        // TODO: Implement in feature/settings-manager-state branch
        return false;
    }

    /**
     * Cancel pending changes and revert to last saved state
     * @returns {SettingsManager} this instance for chaining
     */
    cancel() {
        // TODO: Implement in feature/settings-manager-state branch
        return this;
    }

    /**
     * Revert to previous settings (before last change)
     * @returns {SettingsManager} this instance for chaining
     */
    revert() {
        // TODO: Implement in feature/settings-manager-state branch
        return this;
    }

    /**
     * Check if there are unsaved changes
     * @returns {boolean} True if there are unsaved changes
     */
    hasUnsavedChanges() {
        // TODO: Implement in feature/settings-manager-state branch
        return false;
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
        // TODO: Implement in feature/settings-manager-events branch
        return () => {};
    }

    /**
     * Emit a settings event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        // TODO: Implement in feature/settings-manager-events branch
    }

    /**
     * Export settings to JSON string
     * @returns {string} JSON string of current settings
     */
    export() {
        // TODO: Implement in feature/settings-manager-import-export branch
        return '';
    }

    /**
     * Import settings from JSON string
     * @param {string} json - JSON string of settings
     * @returns {boolean} Success status
     */
    import(json) {
        // TODO: Implement in feature/settings-manager-import-export branch
        return false;
    }

    /**
     * Reset a specific module to defaults
     * @param {string} module - Module name (e.g., 'editor', 'view')
     * @returns {SettingsManager} this instance for chaining
     */
    resetModule(module) {
        // TODO: Implement in feature/settings-manager-import-export branch
        return this;
    }

    /**
     * Reset all settings to defaults
     * @returns {SettingsManager} this instance for chaining
     */
    resetAll() {
        // TODO: Implement in feature/settings-manager-import-export branch
        return this;
    }

    /**
     * Migrate legacy localStorage keys to new settings structure
     * @returns {boolean} True if migration was performed
     */
    migrateLegacy() {
        // TODO: Implement in feature/settings-manager-migration branch
        return false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsManager, SettingsError };
}
