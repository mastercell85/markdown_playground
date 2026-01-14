/**
 * Markdown Editor Main Script
 * Initializes and coordinates all markdown editor modules
 */

(function() {
    'use strict';

    // Module-level variables
    let themeLoader = null;
    let scrollSync = null;
    let findManager = null;
    let settingsManager = null;
    let lineMapper = null;
    let wysiwygEngine = null;

    // Initialize when DOM is ready
    function init() {
        console.log('Markdown Editor initialized');

        // Initialize settings manager first (with legacy migration)
        settingsManager = new SettingsManager();
        settingsManager.initWithMigration();

        // Expose to window for console testing
        window.settingsManager = settingsManager;
        window.SettingsError = SettingsError;
        console.log('SettingsManager initialized:', settingsManager.settings);

        // Initialize theme loader
        themeLoader = new ThemeLoader({
            onThemeChange: (theme) => {
                updateThemeDisplay(theme);
            }
        });
        themeLoader.init(settingsManager);

        // Initialize panel management
        initializePanelManagement();

        // Initialize markdown editor
        initializeMarkdownEditor();

        // Initialize resizable divider
        initializeResizableDivider();

        // Initialize find manager
        initializeFindManager();
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
                        console.log('File opened:', filename);
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
     * Handle Undo action
     */
    function handleUndo() {
        const inputElement = document.getElementById('markdown-input');
        if (!inputElement) return;

        // Focus the textarea first to ensure the undo command works
        inputElement.focus();

        // Try the modern approach first
        if (document.execCommand) {
            document.execCommand('undo');
        }
    }

    /**
     * Handle Redo action
     */
    function handleRedo() {
        const inputElement = document.getElementById('markdown-input');
        if (!inputElement) return;

        // Focus the textarea first to ensure the redo command works
        inputElement.focus();

        // Execute redo command
        if (document.execCommand) {
            document.execCommand('redo');
        }
    }

    /**
     * Handle Cut action
     */
    function handleCut() {
        const inputElement = document.getElementById('markdown-input');
        if (!inputElement) return;

        // Focus the textarea first
        inputElement.focus();

        // Execute cut command
        if (document.execCommand) {
            document.execCommand('cut');
        }
    }

    /**
     * Handle Copy action
     */
    function handleCopy() {
        const inputElement = document.getElementById('markdown-input');
        if (!inputElement) return;

        // Focus the textarea first
        inputElement.focus();

        // Execute copy command
        if (document.execCommand) {
            document.execCommand('copy');
        }
    }

    /**
     * Handle Paste action
     */
    async function handlePaste() {
        const inputElement = document.getElementById('markdown-input');
        if (!inputElement) return;

        // Focus the textarea first
        inputElement.focus();

        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.readText) {
            try {
                const text = await navigator.clipboard.readText();
                const start = inputElement.selectionStart;
                const end = inputElement.selectionEnd;
                const currentValue = inputElement.value;

                // Insert text at cursor position
                inputElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);

                // Move cursor to end of pasted text
                const newPosition = start + text.length;
                inputElement.setSelectionRange(newPosition, newPosition);

                // Trigger input event to update the preview
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (err) {
                // If Clipboard API fails, try execCommand as fallback
                console.warn('Clipboard API failed, trying execCommand:', err);
                if (document.execCommand) {
                    document.execCommand('paste');
                }
            }
        } else {
            // Fallback to execCommand for older browsers
            if (document.execCommand) {
                document.execCommand('paste');
            }
        }
    }

    /**
     * Handle Select All action
     */
    function handleSelectAll() {
        const inputElement = document.getElementById('markdown-input');
        if (!inputElement) return;

        // Focus the textarea first
        inputElement.focus();

        // Select all text
        inputElement.select();
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
     * Handle Replace action
     */
    function handleReplace() {
        const inputElement = document.getElementById('markdown-input');
        if (!inputElement) return;

        // Focus the textarea
        inputElement.focus();

        // Prompt user for find and replace text
        const findText = prompt('Find:');
        if (!findText) return;

        const replaceText = prompt('Replace with:');
        if (replaceText === null) return; // User cancelled

        let content = inputElement.value;
        let currentIndex = 0;
        let replacedCount = 0;

        // Find all occurrences
        const occurrences = [];
        let index = content.indexOf(findText);
        while (index !== -1) {
            occurrences.push(index);
            index = content.indexOf(findText, index + 1);
        }

        if (occurrences.length === 0) {
            alert(`"${findText}" not found.`);
            return;
        }

        // Ask user how they want to proceed
        const choice = confirm(`Found ${occurrences.length} occurrence(s).\n\nClick OK to replace one by one, or Cancel to replace all at once.`);

        if (!choice) {
            // Replace all occurrences
            const newContent = content.split(findText).join(replaceText);
            inputElement.value = newContent;

            // Trigger input event to update the preview
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));

            alert(`Replaced ${occurrences.length} occurrence(s).`);
            return;
        }

        // Interactive replace - go through each occurrence
        function replaceNext() {
            if (currentIndex >= occurrences.length) {
                alert(`Finished! Replaced ${replacedCount} of ${occurrences.length} occurrence(s).`);
                return;
            }

            // Recalculate position based on previous replacements
            const offset = replacedCount * (replaceText.length - findText.length);
            const position = occurrences[currentIndex] + offset;

            // Select the current occurrence
            inputElement.setSelectionRange(position, position + findText.length);
            inputElement.focus();

            // Ask user if they want to replace this occurrence
            const shouldReplace = confirm(`Replace this occurrence?\n\nOccurrence ${currentIndex + 1} of ${occurrences.length}\n\nClick OK to replace, Cancel to skip.`);

            if (shouldReplace) {
                // Replace this occurrence
                content = inputElement.value;
                inputElement.value = content.substring(0, position) + replaceText + content.substring(position + findText.length);

                // Trigger input event to update the preview
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));

                replacedCount++;

                // Select the replaced text
                inputElement.setSelectionRange(position, position + replaceText.length);
            }

            currentIndex++;

            // Continue to next occurrence
            setTimeout(replaceNext, 10);
        }

        // Start the interactive replacement
        replaceNext();
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

        // Layout buttons
        const layoutSplitBtn = document.getElementById('layout-split-btn');
        const layoutEditorBtn = document.getElementById('layout-editor-btn');
        const layoutPreviewBtn = document.getElementById('layout-preview-btn');

        if (layoutSplitBtn) {
            layoutSplitBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleLayoutChange('split');
            });
        }

        if (layoutEditorBtn) {
            layoutEditorBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleLayoutChange('editor');
            });
        }

        if (layoutPreviewBtn) {
            layoutPreviewBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleLayoutChange('preview');
            });
        }

        // Scroll Sync toggle button on divider (Editor options moved to Settings panel)
        const dividerSyncBtn = document.getElementById('divider-sync-btn');

        if (dividerSyncBtn) {
            dividerSyncBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                event.preventDefault();
                handleToggleScrollSync();
            });
        }

        // Zoom buttons
        const zoom90Btn = document.getElementById('zoom-90-btn');
        const zoom100Btn = document.getElementById('zoom-100-btn');
        const zoom110Btn = document.getElementById('zoom-110-btn');
        const zoom125Btn = document.getElementById('zoom-125-btn');
        const zoom150Btn = document.getElementById('zoom-150-btn');

        if (zoom90Btn) {
            zoom90Btn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleZoomChange(90);
            });
        }

        if (zoom100Btn) {
            zoom100Btn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleZoomChange(100);
            });
        }

        if (zoom110Btn) {
            zoom110Btn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleZoomChange(110);
            });
        }

        if (zoom125Btn) {
            zoom125Btn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleZoomChange(125);
            });
        }

        if (zoom150Btn) {
            zoom150Btn.addEventListener('click', function(event) {
                event.stopPropagation();
                handleZoomChange(150);
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
        const scrollSyncCheckbox = document.getElementById('settings-scroll-sync');
        const scrollOffsetSlider = document.getElementById('settings-scroll-offset');
        const scrollOffsetValue = document.getElementById('settings-scroll-offset-value');
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

            // Scroll Sync
            if (scrollSyncCheckbox) {
                scrollSyncCheckbox.checked = settings.editor.scrollSync.enabled;
            }

            // Scroll Offset
            if (scrollOffsetSlider && scrollOffsetValue) {
                scrollOffsetSlider.value = settings.editor.scrollSync.offset;
                scrollOffsetValue.textContent = settings.editor.scrollSync.offset + ' lines';
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

        // Scroll Sync checkbox handler
        if (scrollSyncCheckbox) {
            scrollSyncCheckbox.addEventListener('change', function(event) {
                const value = event.target.checked;
                try {
                    settingsManager.set('editor.scrollSync.enabled', value);
                    applyScrollSync(value);
                } catch (error) {
                    console.error('Settings error:', error.message);
                }
            });
        }

        // Scroll Offset slider handler
        if (scrollOffsetSlider) {
            scrollOffsetSlider.addEventListener('input', function(event) {
                const value = parseInt(event.target.value);
                if (scrollOffsetValue) {
                    scrollOffsetValue.textContent = value + ' lines';
                }
                try {
                    settingsManager.set('editor.scrollSync.offset', value);
                    applyScrollOffset(value);
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

        // Scroll Sync
        const scrollSyncCheckbox = document.getElementById('settings-scroll-sync');
        if (scrollSyncCheckbox) {
            scrollSyncCheckbox.checked = settings.editor.scrollSync.enabled;
            applyScrollSync(settings.editor.scrollSync.enabled);
        }

        // Scroll Offset
        const scrollOffsetSlider = document.getElementById('settings-scroll-offset');
        const scrollOffsetValue = document.getElementById('settings-scroll-offset-value');
        if (scrollOffsetSlider && scrollOffsetValue) {
            scrollOffsetSlider.value = settings.editor.scrollSync.offset;
            scrollOffsetValue.textContent = settings.editor.scrollSync.offset + ' lines';
            applyScrollOffset(settings.editor.scrollSync.offset);
        }
    }

    /**
     * Apply font size to the editor textarea
     */
    function applyEditorFontSize(size) {
        const textarea = document.getElementById('markdown-input');
        if (textarea) {
            textarea.style.fontSize = size + 'px';
        }
    }

    /**
     * Apply line height to the editor textarea
     */
    function applyEditorLineHeight(height) {
        const textarea = document.getElementById('markdown-input');
        if (textarea) {
            textarea.style.lineHeight = height;
        }
    }

    /**
     * Apply tab size to the editor textarea
     */
    function applyEditorTabSize(size) {
        const textarea = document.getElementById('markdown-input');
        if (textarea) {
            textarea.style.tabSize = size;
            textarea.style.MozTabSize = size;
        }
    }

    /**
     * Apply font family to the editor textarea
     */
    function applyEditorFontFamily(family) {
        const textarea = document.getElementById('markdown-input');
        if (textarea) {
            textarea.style.fontFamily = family;
        }
    }

    /**
     * Apply line numbers setting
     */
    function applyLineNumbers(enabled) {
        const textarea = document.getElementById('markdown-input');
        const gutter = document.getElementById('line-numbers-gutter');

        if (!textarea || !gutter) return;

        if (enabled) {
            textarea.classList.add('show-line-numbers');
            gutter.classList.add('visible');
            updateLineNumbers();
            setupLineNumberListeners();
        } else {
            textarea.classList.remove('show-line-numbers');
            gutter.classList.remove('visible');
            removeLineNumberListeners();
        }

        updateToggleLineNumbersButton(enabled);
    }

    // Store references to event listeners for cleanup
    let lineNumberScrollHandler = null;
    let lineNumberInputHandler = null;

    /**
     * Set up event listeners for line number synchronization
     */
    function setupLineNumberListeners() {
        const textarea = document.getElementById('markdown-input');
        if (!textarea) return;

        // Remove any existing listeners first
        removeLineNumberListeners();

        // Create scroll handler to sync gutter scroll position
        lineNumberScrollHandler = function() {
            syncLineNumberScroll();
        };

        // Create input handler to update line count when content changes
        lineNumberInputHandler = function() {
            updateLineNumbers();
        };

        textarea.addEventListener('scroll', lineNumberScrollHandler);
        textarea.addEventListener('input', lineNumberInputHandler);
    }

    /**
     * Remove line number event listeners
     */
    function removeLineNumberListeners() {
        const textarea = document.getElementById('markdown-input');
        if (!textarea) return;

        if (lineNumberScrollHandler) {
            textarea.removeEventListener('scroll', lineNumberScrollHandler);
            lineNumberScrollHandler = null;
        }
        if (lineNumberInputHandler) {
            textarea.removeEventListener('input', lineNumberInputHandler);
            lineNumberInputHandler = null;
        }
    }

    /**
     * Update line numbers based on textarea content
     */
    function updateLineNumbers() {
        const textarea = document.getElementById('markdown-input');
        const gutter = document.getElementById('line-numbers-gutter');

        if (!textarea || !gutter) return;

        const content = textarea.value;
        const lineCount = content.split('\n').length;

        // Get current line height from computed styles
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight) ||
                          (parseFloat(computedStyle.fontSize) * 1.5);

        // Build line numbers HTML
        let html = '';
        for (let i = 1; i <= lineCount; i++) {
            html += `<span class="line-number" style="height: ${lineHeight}px; line-height: ${lineHeight}px;">${i}</span>`;
        }

        gutter.innerHTML = html;

        // Sync scroll position
        syncLineNumberScroll();
    }

    /**
     * Sync line numbers gutter scroll with textarea scroll
     */
    function syncLineNumberScroll() {
        const textarea = document.getElementById('markdown-input');
        const gutter = document.getElementById('line-numbers-gutter');

        if (!textarea || !gutter) return;

        // Apply the same scroll offset to the gutter
        gutter.scrollTop = textarea.scrollTop;
    }

    /**
     * Update the Toggle Line Numbers button text in View panel
     */
    function updateToggleLineNumbersButton() {
        // The View panel toggle button text doesn't change, but we could update visual state if needed
    }

    /**
     * Apply word wrap setting
     */
    function applyWordWrap(enabled) {
        const textarea = document.getElementById('markdown-input');
        if (textarea) {
            textarea.style.whiteSpace = enabled ? 'pre-wrap' : 'pre';
            textarea.style.overflowWrap = enabled ? 'break-word' : 'normal';
        }
    }

    /**
     * Apply scroll sync setting
     */
    function applyScrollSync(enabled) {
        if (scrollSync) {
            if (enabled) {
                scrollSync.enable();
            } else {
                scrollSync.disable();
            }
        }
        // Update sync button visuals
        updateScrollSyncUI(enabled);
    }

    /**
     * Apply scroll offset setting
     */
    function applyScrollOffset(offset) {
        if (scrollSync) {
            scrollSync.setLineOffset(offset);
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

        console.log(`Tab menu style changed to: ${style.name}`);
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

        console.log(`Layout changed to: ${layout}`);
    }

    /**
     * Handle toggle scroll sync (used by divider sync button)
     */
    function handleToggleScrollSync() {
        if (!scrollSync) {
            initializeScrollSync();
        }

        const enabled = scrollSync.toggle();

        // Update UI to reflect state
        updateScrollSyncUI(enabled);

        // Save preference to SettingsManager
        settingsManager.set('editor.scrollSync.enabled', enabled);

        console.log(`Scroll sync: ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Initialize scroll sync module
     */
    function initializeScrollSync() {
        if (scrollSync) return;

        const inputElement = document.querySelector('.editor-input .markdown-textarea');
        const previewElement = document.querySelector('.editor-preview .markdown-output');

        if (!inputElement || !previewElement) {
            console.warn('ScrollSync: Could not find input or preview elements');
            return;
        }

        scrollSync = new ScrollSync();
        scrollSync.init(inputElement, previewElement);

        // Expose scrollSync globally for debugging and UI controls
        window.scrollSync = scrollSync;

        console.log('ScrollSync: Initialized');
    }

    /**
     * Update scroll sync UI elements to reflect state
     */
    function updateScrollSyncUI(enabled) {
        // Update divider sync button (Editor section controls moved to Settings panel)
        const dividerBtn = document.getElementById('divider-sync-btn');

        if (dividerBtn) {
            dividerBtn.classList.toggle('sync-active', enabled);
            dividerBtn.title = enabled ? 'Scroll Sync: On (Click to disable)' : 'Scroll Sync: Off (Click to enable)';
        }

        // Update Settings panel checkbox if it exists
        const settingsCheckbox = document.getElementById('settings-scroll-sync');
        if (settingsCheckbox) {
            settingsCheckbox.checked = enabled;
        }
    }

    /**
     * Handle zoom change
     * @param {number} percent - Zoom percentage (90, 100, 110, 125, 150)
     */
    function handleZoomChange(percent) {
        const editorContainer = document.querySelector('.editor-container');
        if (!editorContainer) return;

        // Set font size based on zoom percentage
        const baseFontSize = 16; // Base font size in pixels
        const newFontSize = (baseFontSize * percent) / 100;

        editorContainer.style.fontSize = `${newFontSize}px`;

        // Invalidate scroll sync cache since line height changes with zoom
        if (scrollSync) {
            scrollSync.invalidateCache();
        }

        // Save preference to SettingsManager
        settingsManager.set('editor.zoom', percent);

        console.log(`Zoom changed to: ${percent}%`);
    }

    /**
     * Restore view preferences from localStorage
     */
    function restoreViewPreferences() {
        // Theme is restored by ThemeLoader.init()

        // Restore tab menu style (default: steel)
        const savedTabMenuStyle = settingsManager.settings.theme.tabMenu;
        applyTabMenuStyle(savedTabMenuStyle);

        // Restore layout
        const savedLayout = settingsManager.settings.editor.layout;
        handleLayoutChange(savedLayout);

        // Restore editor appearance settings
        const inputElement = document.getElementById('markdown-input');
        if (inputElement) {
            // Font Size
            const savedFontSize = settingsManager.settings.editor.fontSize;
            inputElement.style.fontSize = savedFontSize + 'px';

            // Line Height
            const savedLineHeight = settingsManager.settings.editor.lineHeight;
            inputElement.style.lineHeight = savedLineHeight;

            // Tab Size
            const savedTabSize = settingsManager.settings.editor.tabSize;
            inputElement.style.tabSize = savedTabSize;
            inputElement.style.MozTabSize = savedTabSize;

            // Font Family
            const savedFontFamily = settingsManager.settings.editor.fontFamily;
            inputElement.style.fontFamily = savedFontFamily;

            // Line Numbers - use applyLineNumbers to set up gutter and listeners
            const savedLineNumbers = settingsManager.settings.editor.lineNumbers;
            applyLineNumbers(savedLineNumbers);

            // Word Wrap
            const savedWordWrap = settingsManager.settings.editor.wordWrap;
            inputElement.style.whiteSpace = savedWordWrap ? 'pre-wrap' : 'pre';
            inputElement.style.overflowWrap = savedWordWrap ? 'break-word' : 'normal';
        }

        // Restore zoom
        const savedZoom = settingsManager.settings.editor.zoom;
        handleZoomChange(savedZoom);

        // Restore scroll sync (default: off)
        const savedScrollSync = settingsManager.settings.editor.scrollSync.enabled;
        const savedScrollOffset = settingsManager.settings.editor.scrollSync.offset;

        // Delay initialization to ensure DOM is ready
        setTimeout(() => {
            initializeScrollSync();
            if (scrollSync) {
                // Set the saved offset
                scrollSync.setLineOffset(savedScrollOffset);

                if (savedScrollSync) {
                    scrollSync.enable();
                    updateScrollSyncUI(true);
                } else {
                    updateScrollSyncUI(false);
                }
            }
        }, 100);

        console.log('View preferences restored');
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
            console.log('New file created:', newDoc.name);
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

            console.log('Regex documentation loaded as read-only');
        }
    }

    /**
     * Handle Open File action
     */
    function handleOpenFile() {
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * Handle Open Folder action
     */
    function handleOpenFolder() {
        alert('Open Folder feature will be available in the desktop app version.\n\nFor now, you can use "Open File" to open individual markdown files.');
    }

    /**
     * Handle Save File action
     */
    function handleSaveFile() {
        if (window.MarkdownEditor && window.MarkdownEditor.documentManager) {
            const exportData = window.MarkdownEditor.documentManager.exportActiveDocument();
            if (!exportData) {
                console.warn('No active document to save');
                return;
            }

            // Create a blob with the markdown content
            const blob = new Blob([exportData.content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            // Create a temporary download link
            const link = document.createElement('a');
            link.href = url;
            link.download = exportData.filename;
            link.style.display = 'none';

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('File saved:', exportData.filename);
        }
    }

    /**
     * Handle Save As File action
     */
    function handleSaveAsFile() {
        if (window.MarkdownEditor && window.MarkdownEditor.documentManager) {
            const activeDoc = window.MarkdownEditor.documentManager.getActiveDocument();
            if (!activeDoc) {
                console.warn('No active document to save');
                return;
            }

            // Prompt user for custom filename
            const currentName = activeDoc.name.replace(/\.md$/, ''); // Remove .md if present
            const customName = prompt('Enter filename (without .md extension):', currentName);

            if (customName === null || customName.trim() === '') {
                // User cancelled or entered empty name
                return;
            }

            const filename = customName.trim() + '.md';

            // Create a blob with the markdown content
            const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            // Create a temporary download link
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('File saved as:', filename);
        }
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
                console.log('File closed:', activeDoc.name);
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
     * Initialize markdown editor components
     */
    function initializeMarkdownEditor() {
        // Check layout mode
        const editorContainer = document.querySelector('.editor-container');
        const layoutMode = editorContainer?.dataset?.layout || 'split';

        if (layoutMode === 'wysiwyg') {
            initializeWysiwygEditor();
            return;
        }

        // Split view mode initialization
        const inputElement = document.getElementById('markdown-input');
        const outputElement = document.getElementById('markdown-preview');

        if (!inputElement || !outputElement) {
            console.warn('Markdown editor elements not found');
            return;
        }

        // Create parser components
        const ruleEngine = new RuleEngine();
        const blockProcessor = new BlockProcessor();
        const parser = new MarkdownParser(ruleEngine, blockProcessor);

        // Enable line tracking for scroll sync (adds data-line attributes to output)
        parser.setLineTracking(true);

        // Create window manager for external preview
        const windowManager = new WindowManager({
            windowTitle: 'Markdown Preview',
            windowWidth: 800,
            windowHeight: 600,
            previewElementId: 'markdown-preview'
        });

        // Create renderer first
        const renderer = new MarkdownRenderer({
            parser: parser,
            inputElement: inputElement,
            outputElement: outputElement,
            windowManager: windowManager
        });

        // Create document manager with renderer callbacks
        const documentManager = new DocumentManager({
            autoSave: true,
            autoSaveDelay: 1000,
            onDocumentSwitch: (doc) => {
                // Load document content into editor
                renderer.setMarkdown(doc.content);

                // Handle read-only status
                const textarea = document.getElementById('markdown-input');
                if (textarea) {
                    if (doc.metadata && doc.metadata.readOnly) {
                        textarea.readOnly = true;
                        textarea.style.cursor = 'default';
                        console.log('Document is read-only:', doc.name);
                    } else {
                        textarea.readOnly = false;
                        textarea.style.cursor = '';
                        console.log('Switched to document:', doc.name);
                    }
                }

                // Update line numbers if enabled (content has changed)
                const gutter = document.getElementById('line-numbers-gutter');
                if (gutter && gutter.classList.contains('visible')) {
                    updateLineNumbers();
                }

                // Invalidate LineMapper on document switch (single-map memory strategy)
                if (lineMapper) {
                    lineMapper.invalidate();
                }
            },
            onDocumentUpdate: (doc) => {
                console.log('Document updated:', doc.name);
            }
        });

        // Update renderer callback to sync with document manager
        renderer.onRender = ({ markdown }) => {
            documentManager.updateActiveContent(markdown);
        };

        // Try to load documents from storage, or create initial document
        if (!documentManager.loadFromStorage()) {
            const initialDoc = documentManager.createDocument();
            documentManager.switchDocument(initialDoc.id);
        } else {
            // Restore active document
            const activeDoc = documentManager.getActiveDocument();
            if (activeDoc) {
                renderer.setMarkdown(activeDoc.content);

                // Update line numbers if enabled after content is restored
                const gutter = document.getElementById('line-numbers-gutter');
                if (gutter && gutter.classList.contains('visible')) {
                    updateLineNumbers();
                }
            }
        }

        renderer.init();

        // Initialize LineMapper for scroll sync accuracy
        lineMapper = new LineMapper({
            previewContainer: outputElement,
            rebuildDebounceMs: 200,
            debug: false // Set to true for performance logging
        });
        lineMapper.init();

        // Expose lineMapper to window for debugging
        window.lineMapper = lineMapper;

        // Hook LineMapper into renderer - rebuild map after each render
        const originalOnRender = renderer.onRender;
        renderer.onRender = ({ markdown }) => {
            // Call original handler
            if (originalOnRender) {
                originalOnRender({ markdown });
            } else {
                documentManager.updateActiveContent(markdown);
            }
            // Trigger LineMapper update after render
            if (lineMapper) {
                lineMapper.update();
            }
        };

        // Initialize tab controller
        const tabController = new TabController({
            documentManager: documentManager,
            tabsContainer: document.getElementById('document-tabs'),
            newTabButton: document.getElementById('new-document-btn')
        });

        tabController.init();

        // Setup View panel controls
        setupViewControls(windowManager, renderer);

        // Expose to global scope for potential external access
        window.MarkdownEditor = {
            parser: parser,
            renderer: renderer,
            windowManager: windowManager,
            ruleEngine: ruleEngine,
            blockProcessor: blockProcessor,
            documentManager: documentManager,
            tabController: tabController,
            lineMapper: lineMapper
        };

        // Update line numbers now that document content is loaded
        const gutter = document.getElementById('line-numbers-gutter');
        if (gutter && gutter.classList.contains('visible')) {
            updateLineNumbers();
        }

        console.log('Markdown editor initialized with live preview and document management');
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
                // Load document content into WYSIWYG editor
                wysiwygEngine.setMarkdown(doc.content);
                console.log('Switched to document:', doc.name);
            },
            onDocumentUpdate: (doc) => {
                console.log('Document updated:', doc.name);
            }
        });

        // Initialize tab controller FIRST so it can render tabs
        const tabController = new TabController({
            documentManager: documentManager,
            tabsContainer: document.getElementById('document-tabs'),
            newTabButton: document.getElementById('new-document-btn')
        });

        tabController.init();

        // Setup auto-save: save content when input changes
        wysiwygElement.addEventListener('input', () => {
            const markdown = wysiwygEngine.getMarkdown();
            documentManager.updateActiveContent(markdown);
        });

        // Try to load documents from storage, or create initial document
        if (!documentManager.loadFromStorage()) {
            const initialDoc = documentManager.createDocument();
            documentManager.switchDocument(initialDoc.id);
            // Focus the editor after creating initial document
            setTimeout(() => {
                wysiwygElement.focus();
            }, 100);
        } else {
            // Restore active document
            const activeDoc = documentManager.getActiveDocument();
            if (activeDoc) {
                wysiwygEngine.setMarkdown(activeDoc.content);
            }
        }

        // Render tabs after documents are loaded
        tabController.renderTabs();

        // Expose to global scope
        window.MarkdownEditor = {
            parser: parser,
            wysiwygEngine: wysiwygEngine,
            documentManager: documentManager,
            tabController: tabController,
            lineMapper: lineMapper
        };

        console.log('WYSIWYG editor initialized');
    }

    /**
     * Setup View panel controls for external window
     */
    function setupViewControls(windowManager, renderer) {
        const openBtn = document.getElementById('open-external-preview');
        const closeBtn = document.getElementById('close-external-preview');

        if (openBtn) {
            openBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                windowManager.open();
                renderer.render(); // Update external window with current content
                openBtn.disabled = true;
                if (closeBtn) closeBtn.disabled = false;
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                windowManager.close();
                closeBtn.disabled = true;
                if (openBtn) openBtn.disabled = false;
            });
        }

        // Check if external window closes manually
        setInterval(() => {
            if (!windowManager.isOpen()) {
                if (openBtn) openBtn.disabled = false;
                if (closeBtn) closeBtn.disabled = true;
            }
        }, 500);
    }

    /**
     * Initialize resizable divider between editor and preview
     */
    function initializeResizableDivider() {
        const resizablePane = new ResizablePane({
            dividerSelector: '#editor-divider',
            leftPaneSelector: '.editor-input',
            rightPaneSelector: '.editor-preview',
            containerSelector: '.editor-container',
            minPaneWidth: 200
        });

        resizablePane.init();

        // Expose to global scope
        window.MarkdownEditor = window.MarkdownEditor || {};
        window.MarkdownEditor.resizablePane = resizablePane;
    }

    /**
     * Initialize find manager
     */
    function initializeFindManager() {
        if (findManager) return;

        findManager = new FindManager({
            textareaSelector: '#markdown-input',
            dialogSelector: '#find-replace-dialog'
        });

        findManager.init();

        // Expose globally for debugging
        window.MarkdownEditor.findManager = findManager;

        console.log('FindManager: Initialized');
    }

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
