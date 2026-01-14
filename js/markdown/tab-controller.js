/**
 * Tab Controller
 * Manages the document tabs UI
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles tab UI rendering and interactions
 * - Dependency Inversion: Depends on DocumentManager abstraction
 * - Interface Segregation: Clean, focused API
 */

class TabController {
    constructor(config = {}) {
        this.documentManager = config.documentManager;
        this.tabsContainer = config.tabsContainer;
        this.newTabButton = config.newTabButton;

        if (!this.documentManager || !this.tabsContainer) {
            throw new Error('TabController requires documentManager and tabsContainer');
        }
    }

    /**
     * Initialize tab controller
     */
    init() {
        // Setup new tab button
        if (this.newTabButton) {
            this.newTabButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleNewTab();
            });
        }

        // Initial render
        this.renderTabs();

        return this;
    }

    /**
     * Render all tabs
     */
    renderTabs() {
        console.log('TabController.renderTabs() called');
        // Clear existing tabs
        this.tabsContainer.innerHTML = '';

        const documents = this.documentManager.getAllDocuments();
        const activeId = this.documentManager.activeDocumentId;

        console.log('TabController: Found', documents.length, 'documents');
        console.log('TabController: Active ID:', activeId);
        console.log('TabController: Documents:', documents.map(d => ({ id: d.id, name: d.name })));

        documents.forEach(doc => {
            console.log('TabController: Creating tab for', doc.name);
            const tabElement = this.createTabElement(doc, doc.id === activeId);
            this.tabsContainer.appendChild(tabElement);
        });

        console.log('TabController: Finished rendering', documents.length, 'tabs');
    }

    /**
     * Create a single tab element
     * @param {MarkdownDocument} doc - Document to create tab for
     * @param {boolean} isActive - Whether this is the active tab
     * @returns {HTMLElement}
     */
    createTabElement(doc, isActive) {
        const tab = window.document.createElement('div');
        tab.className = 'document-tab';
        if (isActive) {
            tab.classList.add('active');
        }
        tab.dataset.docId = doc.id;

        // Tab name
        const nameSpan = window.document.createElement('span');
        nameSpan.className = 'document-tab-name';
        nameSpan.textContent = doc.getDisplayName();
        nameSpan.title = doc.name; // Full name on hover

        // Close button
        const closeSpan = window.document.createElement('span');
        closeSpan.className = 'document-tab-close';
        closeSpan.textContent = '×';

        // Event listeners
        // Use tab element for click to avoid interference with double-click on name
        tab.addEventListener('click', (e) => {
            // Don't switch if clicking close button or name span (name has its own handlers)
            if (e.target === closeSpan || e.target === nameSpan) return;
            e.stopPropagation();
            this.handleTabClick(doc.id);
        });

        // Handle clicks on name span separately to support both click and double-click
        let clickTimer = null;
        nameSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            // Clear any existing timer
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
                return; // This is a double-click, let the dblclick handler take care of it
            }
            // Set a timer for single click
            clickTimer = setTimeout(() => {
                clickTimer = null;
                this.handleTabClick(doc.id);
            }, 250); // 250ms delay to detect double-click
        });

        // Double-click to rename
        nameSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
            }
            this.handleTabRename(doc.id, nameSpan);
        });

        // Right-click context menu
        tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(e, doc.id);
        });

        closeSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleTabClose(doc.id);
        });

        tab.appendChild(nameSpan);
        tab.appendChild(closeSpan);

        return tab;
    }

    /**
     * Handle tab click (switch document)
     * @param {string} docId - Document ID
     */
    handleTabClick(docId) {
        this.documentManager.switchDocument(docId);
        this.renderTabs();
    }

    /**
     * Handle tab close
     * @param {string} docId - Document ID
     */
    handleTabClose(docId) {
        // No confirmation needed - documents are auto-saved to localStorage
        this.documentManager.closeDocument(docId);
        this.renderTabs();
    }

    /**
     * Handle new tab creation
     */
    handleNewTab() {
        const newDoc = this.documentManager.createDocument();
        this.documentManager.switchDocument(newDoc.id);
        this.renderTabs();
    }

    /**
     * Handle tab rename (double-click)
     * @param {string} docId - Document ID
     * @param {HTMLElement} nameElement - Name span element
     */
    handleTabRename(docId, nameElement) {
        const doc = this.documentManager.getDocument(docId);
        if (!doc) return;

        const currentName = doc.name;

        // Create input for inline editing
        const input = window.document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'document-tab-name-input';
        input.style.cssText = `
            width: 150px;
            padding: 2px 6px;
            font-size: 11px;
            background: rgba(255, 255, 255, 0.9);
            color: #000;
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 2px;
            outline: none;
        `;

        // Replace name with input
        nameElement.style.display = 'none';
        nameElement.parentNode.insertBefore(input, nameElement);
        input.focus();
        input.select();

        // Handle save
        const saveRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                this.documentManager.renameDocument(docId, newName);
            }
            this.renderTabs();
        };

        // Save on blur or enter
        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveRename();
            } else if (e.key === 'Escape') {
                this.renderTabs();
            }
        });

        // Prevent tab switch on click
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Update specific tab (without full re-render)
     * @param {string} docId - Document ID
     */
    updateTab(docId) {
        const tabElement = this.tabsContainer.querySelector(`[data-doc-id="${docId}"]`);
        if (!tabElement) return;

        const doc = this.documentManager.getDocument(docId);
        if (!doc) return;

        const nameSpan = tabElement.querySelector('.document-tab-name');
        if (nameSpan) {
            nameSpan.textContent = doc.getDisplayName();
            nameSpan.title = doc.name;
        }

        // Update active state
        const isActive = docId === this.documentManager.activeDocumentId;
        tabElement.classList.toggle('active', isActive);
    }

    /**
     * Scroll active tab into view
     */
    scrollToActiveTab() {
        const activeTab = this.tabsContainer.querySelector('.document-tab.active');
        if (activeTab) {
            activeTab.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
        }
    }

    /**
     * Show context menu for tab
     * @param {MouseEvent} event - Context menu event
     * @param {string} docId - Document ID
     */
    showContextMenu(event, docId) {
        // Remove any existing context menu
        const existingMenu = window.document.getElementById('tab-context-menu');
        if (existingMenu) existingMenu.remove();

        // Create context menu
        const menu = window.document.createElement('div');
        menu.id = 'tab-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            background: rgba(40, 40, 40, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            padding: 5px 0;
            z-index: 10000;
            min-width: 150px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        const menuItemStyle = `
            padding: 8px 16px;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.9);
            font-size: 12px;
            transition: background 0.2s;
        `;

        const menuItemHoverStyle = `
            background: rgba(255, 255, 255, 0.1);
        `;

        // Menu options
        const options = [
            {
                label: 'Rename',
                action: () => {
                    const tabElement = this.tabsContainer.querySelector(`[data-doc-id="${docId}"]`);
                    const nameSpan = tabElement?.querySelector('.document-tab-name');
                    if (nameSpan) {
                        this.handleTabRename(docId, nameSpan);
                    }
                }
            },
            {
                label: 'Close',
                action: () => this.handleTabClose(docId)
            },
            {
                label: 'Close Others',
                action: () => {
                    const allDocs = this.documentManager.getAllDocuments();
                    allDocs.forEach(doc => {
                        if (doc.id !== docId) {
                            this.documentManager.closeDocument(doc.id);
                        }
                    });
                    this.renderTabs();
                }
            },
            {
                label: 'Close All',
                action: () => {
                    const confirmed = confirm('Close all documents? Unsaved changes will be lost.');
                    if (confirmed) {
                        const allDocs = this.documentManager.getAllDocuments();
                        allDocs.forEach(doc => {
                            this.documentManager.closeDocument(doc.id);
                        });
                        this.renderTabs();
                    }
                }
            }
        ];

        // Create menu items
        options.forEach(option => {
            const item = window.document.createElement('div');
            item.textContent = option.label;
            item.style.cssText = menuItemStyle;

            // Hover effects
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255, 255, 255, 0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });

            // Click handler
            item.addEventListener('click', () => {
                option.action();
                menu.remove();
            });

            menu.appendChild(item);
        });

        // Add to document
        window.document.body.appendChild(menu);

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                window.document.removeEventListener('click', closeMenu);
            }
        };

        // Delay to prevent immediate closing from the same click
        setTimeout(() => {
            window.document.addEventListener('click', closeMenu);
        }, 10);

        // Close menu on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                menu.remove();
                window.document.removeEventListener('keydown', handleEscape);
            }
        };
        window.document.addEventListener('keydown', handleEscape);
    }
}

// Export for use in other modules (browser environment)
if (typeof window !== 'undefined') {
    window.TabController = TabController;
}
// Also support Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabController;
}
