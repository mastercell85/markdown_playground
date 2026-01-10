/**
 * Markdown Editor Main Script
 * Initializes and coordinates all markdown editor modules
 */

(function() {
    'use strict';

    // Initialize when DOM is ready
    function init() {
        console.log('Markdown Editor initialized');

        // Initialize panel management
        initializePanelManagement();

        // Initialize markdown editor
        initializeMarkdownEditor();

        // Initialize resizable divider
        initializeResizableDivider();
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
                { element: null, selector: '.back-panel', class: 'panel-open' }
            ]
        };

        const panelManager = new PanelManager(panelConfig);
        panelManager.init();

        // Setup Back button
        const backButton = document.getElementById('back-to-home');
        if (backButton) {
            backButton.addEventListener('click', function(event) {
                event.stopPropagation();
                window.location.href = 'index.html';
            });
        }
    }

    /**
     * Initialize markdown editor components
     */
    function initializeMarkdownEditor() {
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
                console.log('Switched to document:', doc.name);
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
            }
        }

        renderer.init();

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
            tabController: tabController
        };

        console.log('Markdown editor initialized with live preview and document management');
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

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
