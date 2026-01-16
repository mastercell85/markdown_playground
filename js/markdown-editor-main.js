/**
 * Markdown Editor Main Script
 * Initializes and coordinates all markdown editor modules
 */

(function() {
    'use strict';

    // Module-level variables
    let themeLoader = null;
    let findManager = null;
    let settingsManager = null;
    let lineMapper = null;
    let wysiwygEngine = null;

    // Initialize when DOM is ready
    function init() {
        // Initialize settings manager first (with legacy migration)
        settingsManager = new SettingsManager();
        settingsManager.initWithMigration();

        // Expose to window for console testing
        window.settingsManager = settingsManager;
        window.SettingsError = SettingsError;

        // Initialize theme loader
        themeLoader = new ThemeLoader({
            onThemeChange: (theme) => {
                updateThemeDisplay(theme);
            }
        });
        themeLoader.init(settingsManager);

        // Initialize panel management
        initializePanelManagement();

        // Initialize WYSIWYG markdown editor
        initializeWysiwygEditor();
    }

    /**
     * Initialize panel management for editor panels
     */
    function initializePanelManagement() {
        const panelConfig = {
            panels: [
                { element: null, selector: '.files-panel', class: 'panel-open' },
                { element: null, selector: '.edit-panel', class: 'panel-open' },
                { element: null, selector: '.view-panel', class: 'panel-open' },
                { element: null, selector: '.settings-panel', class: 'panel-open' },
                { element: null, selector: '.help-panel', class: 'panel-open' },
                { element: null, selector: '.back-panel', class: 'panel-open' }
            ]
        };

        const panelManager = new PanelManager(panelConfig);
        panelManager.init();

        // Tab menu JS is loaded via applyTabMenuStyle() in restoreViewPreferences()

        // Setup Back button
        const backButton = document.getElementById('back-to-home');
        if (backButton) {
            backButton.addEventListener('click', function(event) {
                event.stopPropagation();
                window.location.href = 'index.html';
            });
        }

        // Setup File menu buttons
        setupFileMenuButtons();

        // Setup Edit menu buttons
        setupEditMenuButtons();

        // Setup View menu buttons
        setupViewMenuButtons();

        // Setup Settings panel
        setupSettingsPanel();

        // Initialize line numbers
        initLineNumbers();

        // Restore user preferences
        restoreViewPreferences();
    }

    /**
     * Setup File menu button handlers
     */
    function setupFileMenuButtons() {
        // New File button
        const newFileBtn = document.getElementById('new-file-btn');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleNewFile();
            });
        }

        // Open File button
        const openFileBtn = document.getElementById('open-file-btn');
        if (openFileBtn) {
            openFileBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleOpenFile();
            });
        }

        // Open Folder button
        const openFolderBtn = document.getElementById('open-folder-btn');
        if (openFolderBtn) {
            openFolderBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleOpenFolder();
            });
        }

        // Save button
        const saveFileBtn = document.getElementById('save-file-btn');
        if (saveFileBtn) {
            saveFileBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleSaveFile();
            });
        }

        // Save As button
        const saveAsBtn = document.getElementById('save-as-btn');
        if (saveAsBtn) {
            saveAsBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleSaveAsFile();
            });
        }

        // Close File button
        const closeFileBtn = document.getElementById('close-file-btn');
        if (closeFileBtn) {
            closeFileBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleCloseFile();
            });
        }

        // View Regex Documentation button (in Help menu)
        const viewRegexDocsBtn = document.getElementById('view-regex-docs-btn');
        if (viewRegexDocsBtn) {
            viewRegexDocsBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                openRegexDocumentation();
            });
        }

        // Close Folder button
        const closeFolderBtn = document.getElementById('close-folder-btn');
        if (closeFolderBtn) {
            closeFolderBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleCloseFolder();
            });
        }

        // Exit button
        const exitBtn = document.getElementById('exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleExit();
            });
        }

        // File input change handler
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    const filename = file.name.replace(/\.(md|markdown|txt)$/i, '');

                    if (window.MarkdownEditor && window.MarkdownEditor.documentManager) {
                        const newDoc = window.MarkdownEditor.documentManager.createDocument({
                            name: filename,
                            content: content
                        });

                        window.MarkdownEditor.documentManager.switchDocument(newDoc.id);
                        window.MarkdownEditor.tabController.renderTabs();

                        // Explicitly render the document content in WYSIWYG mode
                        if (window.MarkdownEditor.wysiwygEngine) {
                            window.MarkdownEditor.wysiwygEngine.setMarkdown(content, true);
                        }
                    }

                    // Reset file input
                    event.target.value = '';
                };
                reader.readAsText(file);
            });
        }
    }

    /**
     * Setup Edit menu button handlers
     */
    function setupEditMenuButtons() {
        // Undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleUndo();
            });
        }

        // Redo button
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleRedo();
            });
        }

        // Cut button
        const cutBtn = document.getElementById('cut-btn');
        if (cutBtn) {
            cutBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleCut();
            });
        }

        // Copy button
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleCopy();
            });
        }

        // Paste button
        const pasteBtn = document.getElementById('paste-btn');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handlePaste();
            });
        }

        // Select All button
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleSelectAll();
            });
        }

        // Find button
        const findBtn = document.getElementById('find-btn');
        if (findBtn) {
            findBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleFind();
            });
        }

        // Replace button
        const replaceBtn = document.getElementById('replace-btn');
        if (replaceBtn) {
            replaceBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleReplace();
            });
        }
    }

    /**
     * Get the active editor element (WYSIWYG or source editor)
     * @returns {HTMLElement|null}
     */
    function getActiveEditor() {
        const sourceEditor = document.getElementById('source-editor');
        const wysiwygEditor = document.getElementById('wysiwyg-editor');

        // Check if source editor is visible (source mode active)
        if (sourceEditor && sourceEditor.style.display !== 'none') {
            return sourceEditor;
        }
        // Default to WYSIWYG editor
        return wysiwygEditor;
    }

    /**
     * Handle Undo action
     */
    function handleUndo() {
        const editor = getActiveEditor();
        if (!editor) return;

        editor.focus();
        document.execCommand('undo');
    }

    /**
     * Handle Redo action
     */
    function handleRedo() {
        const editor = getActiveEditor();
        if (!editor) return;

        editor.focus();
        document.execCommand('redo');
    }

    /**
     * Handle Cut action
     */
    function handleCut() {
        const editor = getActiveEditor();
        if (!editor) return;

        editor.focus();
        document.execCommand('cut');
    }

    /**
     * Handle Copy action
     */
    function handleCopy() {
        const editor = getActiveEditor();
        if (!editor) return;

        editor.focus();
        document.execCommand('copy');
    }

    /**
     * Handle Paste action
     */
    async function handlePaste() {
        const editor = getActiveEditor();
        if (!editor) return;

        editor.focus();

        // Try modern Clipboard API for textarea (source mode)
        if (editor.tagName === 'TEXTAREA' && navigator.clipboard && navigator.clipboard.readText) {
            try {
                const text = await navigator.clipboard.readText();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                const currentValue = editor.value;

                // Insert text at cursor position
                editor.value = currentValue.substring(0, start) + text + currentValue.substring(end);

                // Move cursor to end of pasted text
                const newPosition = start + text.length;
                editor.setSelectionRange(newPosition, newPosition);

                // Trigger input event to update the preview
                editor.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (err) {
                // If Clipboard API fails, try execCommand as fallback
                document.execCommand('paste');
            }
        } else {
            // For contenteditable WYSIWYG or as fallback
            document.execCommand('paste');
        }
    }

    /**
     * Handle Select All action
     */
    function handleSelectAll() {
        const editor = getActiveEditor();
        if (!editor) return;

        editor.focus();

        if (editor.tagName === 'TEXTAREA') {
            // For textarea, use select()
            editor.select();
        } else {
            // For contenteditable, use Selection API
            const range = document.createRange();
            range.selectNodeContents(editor);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    /**
     * Handle Find action
     */
    function handleFind() {
        if (!findManager) {
            initializeFindManager();
        }

        findManager.open();
    }

    /**
     * Handle Replace action - opens Find & Replace dialog
     */
    function handleReplace() {
        // Use the FindManager dialog for Replace (same as Find)
        handleFind();
    }

    /**
     * Setup View menu button handlers
     */
    function setupViewMenuButtons() {
        // Tab Menu Style selector button
        const tabMenuSelectorBtn = document.getElementById('tab-menu-selector-btn');

        if (tabMenuSelectorBtn) {
            tabMenuSelectorBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                showTabMenuSelector();
            });
        }

        // Theme selector button
        const themeSelectorBtn = document.getElementById('theme-selector-btn');
        const themeLoadCustomBtn = document.getElementById('theme-load-custom-btn');
        const customThemeInput = document.getElementById('custom-theme-input');

        if (themeSelectorBtn) {
            themeSelectorBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                showThemeSelector();
            });
        }

        if (themeLoadCustomBtn) {
            themeLoadCustomBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                customThemeInput.click();
            });
        }

        if (customThemeInput) {
            customThemeInput.addEventListener('change', async function(event) {
                const file = event.target.files[0];
                if (file && themeLoader) {
                    await themeLoader.loadCustomCSSFile(file);
                }
                // Reset input so same file can be loaded again
                event.target.value = '';
            });
        }
    }

    /**
     * Setup Settings panel controls and handlers
     */
    function setupSettingsPanel() {
        // Initialize collapsible sections
        initializeSettingsSections();

        // Get control elements
        const fontSizeSlider = document.getElementById('settings-font-size');
        const fontSizeValue = document.getElementById('settings-font-size-value');
        const lineHeightSlider = document.getElementById('settings-line-height');
        const lineHeightValue = document.getElementById('settings-line-height-value');
        const tabSizeSelect = document.getElementById('settings-tab-size');
        const fontFamilySelect = document.getElementById('settings-font-family');
        const lineNumbersCheckbox = document.getElementById('settings-line-numbers');
        const wordWrapCheckbox = document.getElementById('settings-word-wrap');
        const exportBtn = document.getElementById('settings-export-btn');
        const importBtn = document.getElementById('settings-import-btn');
        const importInput = document.getElementById('settings-import-input');
        const resetEditorBtn = document.getElementById('settings-reset-editor-btn');
        const resetAllBtn = document.getElementById('settings-reset-all-btn');

        // Initialize controls with current settings
        if (settingsManager && settingsManager.settings) {
            const settings = settingsManager.settings;

            // Font Size
            if (fontSizeSlider && fontSizeValue) {
                fontSizeSlider.value = settings.editor.fontSize;
                fontSizeValue.textContent = settings.editor.fontSize + 'px';
            }

            // Line Height
            if (lineHeightSlider && lineHeightValue) {
                lineHeightSlider.value = settings.editor.lineHeight;
                lineHeightValue.textContent = settings.editor.lineHeight.toFixed(1);
            }

            // Tab Size
            if (tabSizeSelect) {
                tabSizeSelect.value = settings.editor.tabSize;
            }

            // Font Family
            if (fontFamilySelect) {
                fontFamilySelect.value = settings.editor.fontFamily;
            }

            // Line Numbers
            if (lineNumbersCheckbox) {
                lineNumbersCheckbox.checked = settings.editor.lineNumbers;
            }

            // Word Wrap
            if (wordWrapCheckbox) {
                wordWrapCheckbox.checked = settings.editor.wordWrap;
            }

        }

        // Font Size slider handler
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', function(event) {
                const value = parseInt(event.target.value);
                if (fontSizeValue) {
                    fontSizeValue.textContent = value + 'px';
                }
                try {
                    settingsManager.set('editor.fontSize', value);
                    applyEditorFontSize(value);
                } catch (error) {
                    console.error('Settings error:', error.message);
                }
            });
        }

        // Line Height slider handler
        if (lineHeightSlider) {
            lineHeightSlider.addEventListener('input', function(event) {
                const value = parseFloat(event.target.value);
                if (lineHeightValue) {
                    lineHeightValue.textContent = value.toFixed(1);
                }
                try {
                    settingsManager.set('editor.lineHeight', value);
                    applyEditorLineHeight(value);
                } catch (error) {
                    console.error('Settings error:', error.message);
                }
            });
        }

        // Tab Size select handler
        if (tabSizeSelect) {
            tabSizeSelect.addEventListener('change', function(event) {
                const value = parseInt(event.target.value);
                try {
                    settingsManager.set('editor.tabSize', value);
                    applyEditorTabSize(value);
                } catch (error) {
                    console.error('Settings error:', error.message);
                }
            });
        }

        // Font Family select handler
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', function(event) {
                const value = event.target.value;
                try {
                    settingsManager.set('editor.fontFamily', value);
                    applyEditorFontFamily(value);
                } catch (error) {
                    console.error('Settings error:', error.message);
                }
            });
        }

        // Line Numbers checkbox handler
        if (lineNumbersCheckbox) {
            lineNumbersCheckbox.addEventListener('change', function(event) {
                const value = event.target.checked;
                try {
                    settingsManager.set('editor.lineNumbers', value);
                    applyLineNumbers(value);
                } catch (error) {
                    console.error('Settings error:', error.message);
                }
            });
        }

        // Word Wrap checkbox handler
        if (wordWrapCheckbox) {
            wordWrapCheckbox.addEventListener('change', function(event) {
                const value = event.target.checked;
                try {
                    settingsManager.set('editor.wordWrap', value);
                    applyWordWrap(value);
                } catch (error) {
                    console.error('Settings error:', error.message);
                }
            });
        }


        // Export button handler
        if (exportBtn) {
            exportBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                settingsManager.exportToFile();
            });
        }

        // Import button handler
        if (importBtn && importInput) {
            importBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                importInput.click();
            });

            importInput.addEventListener('change', async function(event) {
                const file = event.target.files[0];
                if (file) {
                    const result = await settingsManager.importFromFile(file);
                    if (result.success) {
                        alert('Settings imported successfully!' + (result.warnings ? '\n\nWarnings:\n' + result.warnings.join('\n') : ''));
                        // Refresh the settings panel UI
                        refreshSettingsPanelUI();
                    } else {
                        alert('Failed to import settings:\n' + result.errors.join('\n'));
                    }
                }
                // Reset input so same file can be imported again
                event.target.value = '';
            });
        }

        // Reset Editor button handler
        if (resetEditorBtn) {
            resetEditorBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                if (confirm('Reset all Editor settings to defaults? This cannot be undone.')) {
                    try {
                        settingsManager.resetModule('editor');
                        refreshSettingsPanelUI();
                        alert('Editor settings have been reset to defaults.');
                    } catch (error) {
                        console.error('Reset error:', error.message);
                    }
                }
            });
        }

        // Reset All button handler
        if (resetAllBtn) {
            resetAllBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                if (confirm('Reset ALL settings to defaults? This cannot be undone.')) {
                    settingsManager.resetAll();
                    refreshSettingsPanelUI();
                    alert('All settings have been reset to defaults.');
                }
            });
        }
    }

    /**
     * Initialize collapsible sections for Settings panel
     */
    function initializeSettingsSections() {
        const sections = document.querySelectorAll('.settings-section');
        const expandAllCheckbox = document.getElementById('settings-expand-all-sections');

        sections.forEach(section => {
            const header = section.querySelector('.settings-section-header');
            if (header) {
                header.addEventListener('click', function(event) {
                    event.stopPropagation();
                    section.classList.toggle('expanded');
                    updateSettingsExpandAllCheckbox();
                });
            }
        });

        if (expandAllCheckbox) {
            expandAllCheckbox.addEventListener('change', function(event) {
                event.stopPropagation();
                const expand = event.target.checked;
                sections.forEach(section => {
                    if (expand) {
                        section.classList.add('expanded');
                    } else {
                        section.classList.remove('expanded');
                    }
                });
            });
        }
    }

    /**
     * Update the Expand All checkbox based on current section states
     */
    function updateSettingsExpandAllCheckbox() {
        const sections = document.querySelectorAll('.settings-section');
        const expandAllCheckbox = document.getElementById('settings-expand-all-sections');
        if (!expandAllCheckbox) return;

        const expandedCount = document.querySelectorAll('.settings-section.expanded').length;
        expandAllCheckbox.checked = expandedCount === sections.length;
        expandAllCheckbox.indeterminate = expandedCount > 0 && expandedCount < sections.length;
    }

    /**
     * Refresh the Settings panel UI with current settings values
     */
    function refreshSettingsPanelUI() {
        if (!settingsManager || !settingsManager.settings) return;

        const settings = settingsManager.settings;

        // Font Size
        const fontSizeSlider = document.getElementById('settings-font-size');
        const fontSizeValue = document.getElementById('settings-font-size-value');
        if (fontSizeSlider && fontSizeValue) {
            fontSizeSlider.value = settings.editor.fontSize;
            fontSizeValue.textContent = settings.editor.fontSize + 'px';
            applyEditorFontSize(settings.editor.fontSize);
        }

        // Line Height
        const lineHeightSlider = document.getElementById('settings-line-height');
        const lineHeightValue = document.getElementById('settings-line-height-value');
        if (lineHeightSlider && lineHeightValue) {
            lineHeightSlider.value = settings.editor.lineHeight;
            lineHeightValue.textContent = settings.editor.lineHeight.toFixed(1);
            applyEditorLineHeight(settings.editor.lineHeight);
        }

        // Tab Size
        const tabSizeSelect = document.getElementById('settings-tab-size');
        if (tabSizeSelect) {
            tabSizeSelect.value = settings.editor.tabSize;
            applyEditorTabSize(settings.editor.tabSize);
        }

        // Font Family
        const fontFamilySelect = document.getElementById('settings-font-family');
        if (fontFamilySelect) {
            fontFamilySelect.value = settings.editor.fontFamily;
            applyEditorFontFamily(settings.editor.fontFamily);
        }

        // Line Numbers
        const lineNumbersCheckbox = document.getElementById('settings-line-numbers');
        if (lineNumbersCheckbox) {
            lineNumbersCheckbox.checked = settings.editor.lineNumbers;
            applyLineNumbers(settings.editor.lineNumbers);
        }

        // Word Wrap
        const wordWrapCheckbox = document.getElementById('settings-word-wrap');
        if (wordWrapCheckbox) {
            wordWrapCheckbox.checked = settings.editor.wordWrap;
            applyWordWrap(settings.editor.wordWrap);
        }

    }

    /**
     * Apply font size to the editor
     */
    function applyEditorFontSize(size) {
        // Apply to WYSIWYG editor
        const wysiwygEditor = document.getElementById('wysiwyg-editor');
        if (wysiwygEditor) {
            wysiwygEditor.style.fontSize = size + 'px';
        }
        // Apply to source editor
        const sourceEditor = document.getElementById('source-editor');
        if (sourceEditor) {
            sourceEditor.style.fontSize = size + 'px';
        }
        // Apply to line numbers gutter (must match source editor)
        const lineNumbersGutter = document.getElementById('line-numbers');
        if (lineNumbersGutter) {
            lineNumbersGutter.style.fontSize = size + 'px';
        }
    }

    /**
     * Apply line height to the editor
     */
    function applyEditorLineHeight(height) {
        // Apply to WYSIWYG editor
        const wysiwygEditor = document.getElementById('wysiwyg-editor');
        if (wysiwygEditor) {
            wysiwygEditor.style.lineHeight = height;
        }
        // Apply to source editor
        const sourceEditor = document.getElementById('source-editor');
        if (sourceEditor) {
            sourceEditor.style.lineHeight = height;
        }
        // Apply to line numbers gutter (must match source editor)
        const lineNumbersGutter = document.getElementById('line-numbers');
        if (lineNumbersGutter) {
            lineNumbersGutter.style.lineHeight = height;
        }
    }

    /**
     * Apply tab size to the editor
     */
    function applyEditorTabSize(size) {
        // Apply to WYSIWYG editor
        const wysiwygEditor = document.getElementById('wysiwyg-editor');
        if (wysiwygEditor) {
            wysiwygEditor.style.tabSize = size;
            wysiwygEditor.style.MozTabSize = size;
        }
        // Apply to source editor
        const sourceEditor = document.getElementById('source-editor');
        if (sourceEditor) {
            sourceEditor.style.tabSize = size;
            sourceEditor.style.MozTabSize = size;
        }
    }

    /**
     * Apply font family to the editor
     */
    function applyEditorFontFamily(family) {
        // Apply to WYSIWYG editor
        const wysiwygEditor = document.getElementById('wysiwyg-editor');
        if (wysiwygEditor) {
            wysiwygEditor.style.fontFamily = family;
        }
        // Apply to source editor
        const sourceEditor = document.getElementById('source-editor');
        if (sourceEditor) {
            sourceEditor.style.fontFamily = family;
        }
    }

    function applyWordWrap(enabled) {
        // Apply to source editor textarea (used in source mode)
        const sourceTextarea = document.getElementById('source-editor');
        if (sourceTextarea) {
            sourceTextarea.style.whiteSpace = enabled ? 'pre-wrap' : 'pre';
            sourceTextarea.style.overflowWrap = enabled ? 'break-word' : 'normal';
        }
    }

    /**
     * Apply line numbers setting for source mode
     * Line numbers are displayed in a gutter next to the source textarea
     */
    function applyLineNumbers(enabled) {
        const lineNumbersGutter = document.getElementById('line-numbers');
        if (!lineNumbersGutter) return;

        if (enabled) {
            lineNumbersGutter.classList.remove('hidden');
            updateLineNumbers();
        } else {
            lineNumbersGutter.classList.add('hidden');
        }
    }

    /**
     * Update line numbers in the gutter based on textarea content
     */
    function updateLineNumbers() {
        const sourceEditor = document.getElementById('source-editor');
        const lineNumbersGutter = document.getElementById('line-numbers');

        if (!sourceEditor || !lineNumbersGutter || lineNumbersGutter.classList.contains('hidden')) {
            return;
        }

        const content = sourceEditor.value || '';
        const lineCount = content.split('\n').length;

        // Build line numbers HTML
        let lineNumbersHtml = '';
        for (let i = 1; i <= lineCount; i++) {
            lineNumbersHtml += `<span class="line-number">${i}</span>`;
        }

        lineNumbersGutter.innerHTML = lineNumbersHtml;
    }

    /**
     * Sync line numbers scroll position with textarea
     */
    function syncLineNumbersScroll() {
        const sourceEditor = document.getElementById('source-editor');
        const lineNumbersGutter = document.getElementById('line-numbers');

        if (!sourceEditor || !lineNumbersGutter) return;

        lineNumbersGutter.scrollTop = sourceEditor.scrollTop;
    }

    /**
     * Initialize line numbers event listeners
     */
    function initLineNumbers() {
        const sourceEditor = document.getElementById('source-editor');
        const lineNumbersGutter = document.getElementById('line-numbers');

        if (!sourceEditor || !lineNumbersGutter) return;

        // Update line numbers when content changes
        sourceEditor.addEventListener('input', updateLineNumbers);

        // Sync scroll position
        sourceEditor.addEventListener('scroll', syncLineNumbersScroll);

        // Initial update if line numbers are enabled
        const lineNumbersEnabled = settingsManager?.settings?.editor?.lineNumbers;
        if (lineNumbersEnabled) {
            updateLineNumbers();
        }
    }

    /**
     * Initialize the FindManager instance
     */
    function initializeFindManager() {
        if (!findManager) {
            findManager = new FindManager({
                textareaSelector: '#source-editor',
                dialogSelector: '#find-replace-dialog'
            });
            findManager.init();
        }
    }

    /**
     * Show theme selector modal
     */
    function showThemeSelector() {
        if (!themeLoader) return;

        // Remove any existing theme selector
        const existingModal = document.getElementById('theme-selector-modal');
        if (existingModal) existingModal.remove();

        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'theme-selector-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: rgba(40, 40, 40, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 70vh;
            overflow-y: auto;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        `;

        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Select Theme';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
        `;

        // Create theme list
        const themeList = document.createElement('div');
        const allThemes = themeLoader.getAllThemes();
        const currentTheme = themeLoader.getCurrentTheme();

        Object.keys(allThemes).forEach(themeId => {
            const theme = allThemes[themeId];
            const themeItem = document.createElement('div');
            const isActive = currentTheme && currentTheme.name === theme.name;

            themeItem.style.cssText = `
                padding: 12px;
                margin: 8px 0;
                background: ${isActive ? 'rgba(100, 100, 255, 0.2)' : 'rgba(60, 60, 60, 0.5)'};
                border: 1px solid ${isActive ? 'rgba(100, 100, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const themeInfo = document.createElement('div');
            themeInfo.innerHTML = `
                <div style="color: rgba(255, 255, 255, 0.9); font-weight: bold; margin-bottom: 4px;">
                    ${theme.name}
                </div>
                <div style="color: rgba(255, 255, 255, 0.5); font-size: 11px;">
                    ${theme.type.toUpperCase()}${isActive ? ' • ACTIVE' : ''}
                </div>
            `;

            themeItem.appendChild(themeInfo);

            // Add delete button for custom themes (but not protected ones)
            if (themeId.startsWith('custom-') && !theme.isProtected) {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '×';
                deleteBtn.style.cssText = `
                    background: rgba(255, 60, 60, 0.3);
                    border: 1px solid rgba(255, 60, 60, 0.5);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 18px;
                    line-height: 1;
                `;
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete custom theme "${theme.name}"?`)) {
                        themeLoader.deleteCustomTheme(themeId);
                        modal.remove();
                        showThemeSelector();
                    }
                });
                themeItem.appendChild(deleteBtn);
            }

            // Hover effect
            themeItem.addEventListener('mouseenter', () => {
                if (!isActive) {
                    themeItem.style.background = 'rgba(80, 80, 80, 0.5)';
                }
            });
            themeItem.addEventListener('mouseleave', () => {
                if (!isActive) {
                    themeItem.style.background = 'rgba(60, 60, 60, 0.5)';
                }
            });

            // Click to select theme
            themeItem.addEventListener('click', () => {
                // Load theme directly by ID - no fetch needed
                themeLoader.loadThemeById(themeId);
                modal.remove();
            });

            themeList.appendChild(themeItem);
        });

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            margin-top: 20px;
            padding: 8px 16px;
            background: rgba(80, 80, 80, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            color: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            width: 100%;
        `;

        closeButton.addEventListener('click', () => {
            modal.remove();
        });

        // Assemble modal
        modalContent.appendChild(title);
        modalContent.appendChild(themeList);
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Add to document
        document.body.appendChild(modal);
    }

    /**
     * Update theme display label
     * @param {Object} theme - Theme object
     */
    function updateThemeDisplay(theme) {
        const display = document.getElementById('current-theme-display');
        if (display && theme) {
            display.textContent = `Current: ${theme.name}`;
        }

        // Add/remove external-theme class to hide default decorative elements
        if (theme && (theme.type === 'zen-garden' || theme.type === 'custom')) {
            document.body.classList.add('external-theme');
        } else {
            document.body.classList.remove('external-theme');
        }
    }

    /**
     * Available tab menu styles
     * Add new styles here as they are created
     */
    const TAB_MENU_STYLES = {
        'steel': {
            name: 'Steel',
            cssFile: 'css/tab-menus/tab-menu-steel.css',
            jsFile: 'js/tab-menus/tab-menu-steel.js',
            description: 'Industrial steel frame design with hooks'
        },
        'classic': {
            name: 'Classic',
            cssFile: 'css/tab-menus/tab-menu-classic.css',
            jsFile: 'js/tab-menus/tab-menu-classic.js',
            description: 'Clean dropdown-style menus'
        }
    };

    /**
     * Show tab menu style selector modal
     */
    function showTabMenuSelector() {
        // Remove any existing modal
        const existingModal = document.getElementById('tab-menu-selector-modal');
        if (existingModal) existingModal.remove();

        const currentStyle = settingsManager.settings.theme.tabMenu;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'tab-menu-selector-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: rgba(40, 40, 40, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            width: 90%;
            max-height: 70vh;
            overflow-y: auto;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        `;

        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Select Tab Menu Style';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
        `;

        // Create style list
        const styleList = document.createElement('div');

        Object.keys(TAB_MENU_STYLES).forEach(styleId => {
            const style = TAB_MENU_STYLES[styleId];
            const isActive = currentStyle === styleId;

            const styleItem = document.createElement('div');
            styleItem.style.cssText = `
                padding: 12px;
                margin: 8px 0;
                background: ${isActive ? 'rgba(100, 100, 255, 0.2)' : 'rgba(60, 60, 60, 0.5)'};
                border: 1px solid ${isActive ? 'rgba(100, 100, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            `;

            styleItem.innerHTML = `
                <div style="color: rgba(255, 255, 255, 0.9); font-weight: bold; margin-bottom: 4px;">
                    ${style.name}${isActive ? ' • ACTIVE' : ''}
                </div>
                <div style="color: rgba(255, 255, 255, 0.5); font-size: 11px;">
                    ${style.description}
                </div>
            `;

            // Hover effect
            styleItem.addEventListener('mouseenter', () => {
                if (!isActive) {
                    styleItem.style.background = 'rgba(80, 80, 80, 0.5)';
                }
            });
            styleItem.addEventListener('mouseleave', () => {
                if (!isActive) {
                    styleItem.style.background = 'rgba(60, 60, 60, 0.5)';
                }
            });

            // Click to select style
            styleItem.addEventListener('click', () => {
                applyTabMenuStyle(styleId);
                modal.remove();
            });

            styleList.appendChild(styleItem);
        });

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            margin-top: 20px;
            padding: 8px 16px;
            background: rgba(80, 80, 80, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            color: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            width: 100%;
        `;

        closeButton.addEventListener('click', () => {
            modal.remove();
        });

        // Assemble modal
        modalContent.appendChild(title);
        modalContent.appendChild(styleList);
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Add to document
        document.body.appendChild(modal);
    }

    /**
     * Apply a tab menu style
     * @param {string} styleId - The style ID (e.g., 'steel', 'classic')
     */
    function applyTabMenuStyle(styleId) {
        const style = TAB_MENU_STYLES[styleId];
        if (!style) return;

        const introSection = document.getElementById('zen-intro');
        const tabMenuDisplay = document.getElementById('current-tab-menu-display');
        const stylesheet = document.getElementById('tab-menu-stylesheet');

        if (!introSection || !stylesheet) return;

        // Remove all tab menu classes
        Object.keys(TAB_MENU_STYLES).forEach(id => {
            introSection.classList.remove(`tab-menu-${id}`);
        });

        // Add the new class
        introSection.classList.add(`tab-menu-${styleId}`);

        // Update the CSS stylesheet href
        stylesheet.href = style.cssFile;

        // Load the corresponding JS file
        loadTabMenuScript(styleId, style.jsFile);

        // Update the display text
        if (tabMenuDisplay) {
            tabMenuDisplay.textContent = `Current: ${style.name}`;
        }

        // Save preference via SettingsManager
        settingsManager.set('theme.tabMenu', styleId);
    }

    /**
     * Load tab menu JavaScript file
     * @param {string} styleId - The style ID
     * @param {string} jsFile - Path to the JS file
     */
    function loadTabMenuScript(styleId, jsFile) {
        // Remove any existing tab menu scripts
        const existingScripts = document.querySelectorAll('script[data-tab-menu-script]');
        existingScripts.forEach(script => script.remove());

        // Create and load the new script
        const script = document.createElement('script');
        script.src = jsFile;
        script.setAttribute('data-tab-menu-script', styleId);

        // Re-initialize the tab menu after script loads
        script.onload = function() {
            // Call the appropriate init function based on style
            if (styleId === 'steel' && window.SteelTabMenu) {
                window.SteelTabMenu.init();
            } else if (styleId === 'classic' && window.ClassicTabMenu) {
                window.ClassicTabMenu.init();
            }
        };

        document.body.appendChild(script);
    }

    /**
     * Handle layout change
     * @param {string} layout - 'split', 'editor', or 'preview'
     */
    function handleLayoutChange(layout) {
        const editorContainer = document.querySelector('.editor-container');
        if (!editorContainer) return;

        // Update data-layout attribute
        editorContainer.setAttribute('data-layout', layout);

        // Save preference to SettingsManager
        settingsManager.set('editor.layout', layout);
    }

    /**
     * Restore view preferences from localStorage
     */
    function restoreViewPreferences() {
        // Theme is restored by ThemeLoader.init()

        // Restore tab menu style (default: steel)
        const savedTabMenuStyle = settingsManager.settings.theme.tabMenu;
        applyTabMenuStyle(savedTabMenuStyle);

        // Restore layout - but only if not already set in HTML
        const editorContainer = document.querySelector('.editor-container');
        const currentLayout = editorContainer?.getAttribute('data-layout');
        if (!currentLayout) {
            // No layout specified in HTML, use saved preference
            const savedLayout = settingsManager.settings.editor.layout;
            handleLayoutChange(savedLayout);
        }

        // Restore editor appearance settings using the apply functions
        // These functions handle both WYSIWYG and source editor elements
        const savedFontSize = settingsManager.settings.editor.fontSize;
        applyEditorFontSize(savedFontSize);

        const savedLineHeight = settingsManager.settings.editor.lineHeight;
        applyEditorLineHeight(savedLineHeight);

        const savedTabSize = settingsManager.settings.editor.tabSize;
        applyEditorTabSize(savedTabSize);

        const savedFontFamily = settingsManager.settings.editor.fontFamily;
        applyEditorFontFamily(savedFontFamily);

        // Line Numbers
        const savedLineNumbers = settingsManager.settings.editor.lineNumbers;
        applyLineNumbers(savedLineNumbers);

        // Word Wrap
        const savedWordWrap = settingsManager.settings.editor.wordWrap;
        applyWordWrap(savedWordWrap);
    }

    /**
     * Handle New File action
     */
    function handleNewFile() {
        // Access the document manager from the global scope
        if (window.MarkdownEditor && window.MarkdownEditor.documentManager) {
            const newDoc = window.MarkdownEditor.documentManager.createDocument();
            window.MarkdownEditor.documentManager.switchDocument(newDoc.id);
            window.MarkdownEditor.tabController.renderTabs();
        }
    }

    /**
     * Open regex documentation as read-only tab
     */
    function openRegexDocumentation() {
        // Use embedded content to avoid CORS issues with local files
        if (!window.REGEX_DOCUMENTATION_CONTENT) {
            console.error('Regex documentation content not found');
            alert('Failed to load regex documentation. The documentation file may not be loaded properly.');
            return;
        }

        if (window.MarkdownEditor && window.MarkdownEditor.documentManager) {
            // Create read-only document
            const regexDoc = window.MarkdownEditor.documentManager.createDocument({
                name: 'Regex Documentation (Read-Only)',
                content: window.REGEX_DOCUMENTATION_CONTENT,
                metadata: { readOnly: true }
            });
            window.MarkdownEditor.documentManager.switchDocument(regexDoc.id);
            window.MarkdownEditor.tabController.renderTabs();
        }
    }

    /**
     * Handle Open File action using File System Access API
     * Falls back to traditional file input for unsupported browsers
     */
    async function handleOpenFile() {
        // Check for File System Access API support
        if (!window.showOpenFilePicker) {
            console.log('[Open] File System Access API not available, using fallback');
            // Fallback to traditional file input
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.click();
            }
            return;
        }

        console.log('[Open] Using File System Access API');

        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Markdown Files',
                    accept: { 'text/markdown': ['.md', '.markdown', '.txt'] }
                }],
                multiple: false
            });

            console.log('[Open] Got file handle:', fileHandle.name);

            const file = await fileHandle.getFile();
            const content = await file.text();
            const filename = file.name.replace(/\.(md|markdown|txt)$/i, '');

            console.log('[Open] File content length:', content.length, 'filename:', filename);

            if (window.MarkdownEditor && window.MarkdownEditor.documentManager) {
                // Create document with file handle stored in metadata
                const newDoc = window.MarkdownEditor.documentManager.createDocument({
                    name: filename,
                    content: content,
                    metadata: { fileHandle: fileHandle }
                });

                console.log('[Open] Document created with fileHandle in metadata:', !!newDoc.metadata.fileHandle);

                window.MarkdownEditor.documentManager.switchDocument(newDoc.id);
                window.MarkdownEditor.tabController.renderTabs();

                // Render content in WYSIWYG mode
                if (window.MarkdownEditor.wysiwygEngine) {
                    window.MarkdownEditor.wysiwygEngine.setMarkdown(content, true);
                }
            }
        } catch (err) {
            // User cancelled the file picker - not an error
            if (err.name !== 'AbortError') {
                console.error('Failed to open file:', err);
            }
        }
    }

    /**
     * Handle Open Folder action
     */
    function handleOpenFolder() {
        alert('Open Folder feature will be available in the desktop app version.\n\nFor now, you can use "Open File" to open individual markdown files.');
    }

    /**
     * Show a toast notification message
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', or 'info'
     * @param {number} duration - How long to show in ms (default 2000)
     */
    function showToast(message, type = 'success', duration = 2000) {
        // Remove existing toast if any
        const existingToast = document.getElementById('save-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.id = 'save-toast';
        toast.textContent = message;

        // Style based on type
        const colors = {
            success: { bg: 'rgba(34, 197, 94, 0.9)', border: 'rgba(34, 197, 94, 1)' },
            error: { bg: 'rgba(239, 68, 68, 0.9)', border: 'rgba(239, 68, 68, 1)' },
            info: { bg: 'rgba(59, 130, 246, 0.9)', border: 'rgba(59, 130, 246, 1)' }
        };
        const color = colors[type] || colors.info;

        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: ${color.bg};
            border: 1px solid ${color.border};
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: toastFadeIn 0.3s ease;
        `;

        // Add animation keyframes if not exists
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes toastFadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes toastFadeOut {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Get current markdown content from the editor
     * Ensures we get the latest content from WYSIWYG or source mode
     * @returns {string} Current markdown content
     */
    function getCurrentMarkdownContent() {
        const wysiwygEngine = window.MarkdownEditor?.wysiwygEngine;
        const activeDoc = window.MarkdownEditor?.documentManager?.getActiveDocument();

        if (!activeDoc) return '';

        // If in source mode, get content from source textarea
        if (wysiwygEngine?.isSourceMode()) {
            const sourceTextarea = document.getElementById('source-editor');
            return sourceTextarea?.value || activeDoc.content;
        }

        // Otherwise get current markdown from WYSIWYG engine
        if (wysiwygEngine) {
            return wysiwygEngine.getMarkdown();
        }

        return activeDoc.content;
    }

    /**
     * Handle Save File action using File System Access API
     * Saves directly to original file if opened via File System API
     * Falls back to Save As for new documents or unsupported browsers
     */
    async function handleSaveFile() {
        console.log('[Save] handleSaveFile called');

        const activeDoc = window.MarkdownEditor?.documentManager?.getActiveDocument();
        if (!activeDoc) {
            console.warn('[Save] No active document to save');
            return;
        }

        console.log('[Save] Active doc:', activeDoc.name, 'has fileHandle:', !!activeDoc.metadata?.fileHandle);

        // Get current markdown content from editor
        const markdownContent = getCurrentMarkdownContent();
        console.log('[Save] Markdown content length:', markdownContent.length);
        console.log('[Save] Content preview:', markdownContent.substring(0, 100));

        // Update document content before saving
        activeDoc.setContent(markdownContent);

        // If document has a file handle from File System API, save directly to it
        if (activeDoc.metadata?.fileHandle) {
            console.log('[Save] Attempting direct save to:', activeDoc.metadata.fileHandle.name);
            try {
                const writable = await activeDoc.metadata.fileHandle.createWritable();
                await writable.write(markdownContent);
                await writable.close();
                console.log('[Save] File saved successfully to:', activeDoc.metadata.fileHandle.name);
                showToast('File saved');
                return;
            } catch (err) {
                console.error('[Save] Failed to save file directly:', err);
                // Fall through to Save As if direct save fails (e.g., permission denied)
            }
        }

        // No file handle or direct save failed - use Save As
        console.log('[Save] No file handle, calling Save As');
        await handleSaveAsFile();
    }

    /**
     * Handle Save As File action using File System Access API
     * Allows user to choose save location
     * Falls back to download for unsupported browsers
     */
    async function handleSaveAsFile() {
        const activeDoc = window.MarkdownEditor?.documentManager?.getActiveDocument();
        if (!activeDoc) {
            console.warn('No active document to save');
            return;
        }

        // Get current markdown content from editor
        const markdownContent = getCurrentMarkdownContent();

        // Update document content
        activeDoc.setContent(markdownContent);

        // Check for File System Access API support
        if (!window.showSaveFilePicker) {
            // Fallback to download approach
            fallbackSaveFile(activeDoc);
            return;
        }

        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: activeDoc.name + '.md',
                types: [{
                    description: 'Markdown Files',
                    accept: { 'text/markdown': ['.md'] }
                }]
            });

            const writable = await fileHandle.createWritable();
            await writable.write(markdownContent);
            await writable.close();

            // Update document with new file handle and name
            activeDoc.metadata.fileHandle = fileHandle;
            const newName = fileHandle.name.replace(/\.md$/i, '');
            activeDoc.setName(newName);

            console.log('[SaveAs] fileHandle stored on doc:', activeDoc.id, 'handle:', !!activeDoc.metadata.fileHandle);

            window.MarkdownEditor.tabController.renderTabs();
            console.log('File saved as:', fileHandle.name);
            showToast('File saved as ' + fileHandle.name);
        } catch (err) {
            // User cancelled the file picker - not an error
            if (err.name !== 'AbortError') {
                console.error('Failed to save file:', err);
            }
        }
    }

    /**
     * Fallback save function for browsers without File System Access API
     * Downloads the file to the browser's Downloads folder
     * @param {MarkdownDocument} doc - Document to save
     */
    function fallbackSaveFile(doc) {
        const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = doc.name + '.md';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('File downloaded to Downloads folder');
    }

    /**
     * Handle Close File action
     */
    function handleCloseFile() {
        if (window.MarkdownEditor && window.MarkdownEditor.documentManager) {
            const activeDoc = window.MarkdownEditor.documentManager.getActiveDocument();
            if (activeDoc) {
                window.MarkdownEditor.documentManager.closeDocument(activeDoc.id);
                window.MarkdownEditor.tabController.renderTabs();
            }
        }
    }

    /**
     * Handle Close Folder action
     */
    function handleCloseFolder() {
        alert('Close Folder feature will be available in the desktop app version.\n\nFor now, you can close individual tabs by clicking the × button on each tab.');
    }

    /**
     * Handle Exit action
     */
    function handleExit() {
        window.location.href = 'index.html';
    }


    /**
     * Initialize WYSIWYG editor (unified view mode)
     */
    function initializeWysiwygEditor() {
        const wysiwygElement = document.getElementById('wysiwyg-editor');

        if (!wysiwygElement) {
            console.warn('WYSIWYG editor element not found');
            return;
        }

        // Create parser components (needed for markdown rendering)
        const ruleEngine = new RuleEngine();
        const blockProcessor = new BlockProcessor();
        const parser = new MarkdownParser(ruleEngine, blockProcessor);

        // Initialize LineMapper (can be used for future features)
        lineMapper = new LineMapper({
            previewContainer: wysiwygElement,
            rebuildDebounceMs: 200,
            debug: false
        });
        lineMapper.init();

        // Create WYSIWYG engine
        wysiwygEngine = new WysiwygEngine(wysiwygElement, lineMapper, parser);

        // Create document manager for WYSIWYG mode
        const documentManager = new DocumentManager({
            autoSave: true,
            autoSaveDelay: 1000,
            onDocumentSwitch: (doc) => {
                // Load document content into WYSIWYG editor with rendering enabled by default
                wysiwygEngine.setMarkdown(doc.content, true);
            },
            onDocumentUpdate: (doc) => {
                // Document auto-saved
            }
        });

        // Setup auto-save: save content when input changes
        wysiwygElement.addEventListener('input', () => {
            // Skip saving during document loading to prevent corruption
            if (wysiwygEngine.isLoadingDocument) {
                return;
            }
            const markdown = wysiwygEngine.getMarkdown();
            documentManager.updateActiveContent(markdown);
        });

        // Try to load documents from storage, or create initial document
        if (!documentManager.loadFromStorage()) {
            const initialDoc = documentManager.createDocument();
            documentManager.switchDocument(initialDoc.id);
        } else {
            // Restore active document
            const activeDoc = documentManager.getActiveDocument();
            if (activeDoc) {
                // Load with rendering enabled by default
                wysiwygEngine.setMarkdown(activeDoc.content, true);
            }
        }

        // Initialize tab controller AFTER documents are loaded (same as split view)
        const tabController = new TabController({
            documentManager: documentManager,
            tabsContainer: document.getElementById('document-tabs'),
            newTabButton: document.getElementById('new-document-btn')
        });

        tabController.init();

        // Focus the editor after initialization
        setTimeout(() => {
            wysiwygElement.focus();
        }, 100);

        // Setup source mode toggle button and keyboard shortcut
        setupSourceModeToggle(wysiwygEngine, documentManager);

        // Expose to global scope
        window.MarkdownEditor = {
            parser: parser,
            wysiwygEngine: wysiwygEngine,
            documentManager: documentManager,
            tabController: tabController,
            lineMapper: lineMapper
        };
    }

    /**
     * Setup source mode toggle functionality
     */
    function setupSourceModeToggle(wysiwygEngine, documentManager) {
        const toggleButton = document.getElementById('toolbar-source-toggle');
        const sourceTextarea = document.getElementById('source-editor');

        if (!toggleButton) {
            console.warn('Source toggle button not found');
            return;
        }

        // Restore source mode state from settings
        const savedSourceMode = settingsManager.get('editor.sourceMode');
        if (savedSourceMode) {
            // Switch to source mode
            wysiwygEngine.toggleSourceMode();
            toggleButton.classList.add('active');
        }

        // Handle toolbar button click
        toggleButton.addEventListener('click', () => {
            wysiwygEngine.toggleSourceMode();

            // Update active button state and save to settings
            if (wysiwygEngine.isSourceMode()) {
                toggleButton.classList.add('active');
                settingsManager.set('editor.sourceMode', true);
            } else {
                toggleButton.classList.remove('active');
                settingsManager.set('editor.sourceMode', false);
            }
        });

        // Handle source textarea input (for auto-save)
        if (sourceTextarea) {
            sourceTextarea.addEventListener('input', () => {
                if (wysiwygEngine.isSourceMode()) {
                    const markdown = sourceTextarea.value;
                    documentManager.updateActiveContent(markdown);
                }
            });
        }

        // Handle Ctrl+/ keyboard shortcut
        document.addEventListener('keydown', (event) => {
            // Ctrl+/ or Cmd+/ to toggle source mode
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                toggleButton.click(); // Trigger the button click to keep logic in one place
            }
        });

    }

    // Handle Ctrl+S keyboard shortcut for save (at module level for proper scope)
    document.addEventListener('keydown', (event) => {
        // Ctrl+S or Cmd+S to save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            console.log('[Ctrl+S] Save shortcut triggered');
            handleSaveFile();
        }
    });

    // Listen for regex help event from FindManager
    document.addEventListener('openRegexHelp', () => {
        openRegexDocumentation();
    });

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
