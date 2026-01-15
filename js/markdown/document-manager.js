/**
 * Document Manager
 * Manages multiple markdown documents and tab switching
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages document collection and active state
 * - Open/Closed: Extensible through callbacks
 * - Dependency Inversion: Depends on Document abstraction
 */

class DocumentManager {
    constructor(config = {}) {
        this.documents = [];
        this.activeDocumentId = null;
        this.untitledCounter = 1;

        // Callbacks
        this.onDocumentCreate = config.onDocumentCreate || null;
        this.onDocumentSwitch = config.onDocumentSwitch || null;
        this.onDocumentClose = config.onDocumentClose || null;
        this.onDocumentUpdate = config.onDocumentUpdate || null;

        // Auto-save configuration
        this.autoSave = config.autoSave !== false;
        this.autoSaveDelay = config.autoSaveDelay || 1000;
        this.autoSaveTimer = null;
    }

    /**
     * Create a new document
     * @param {Object} config - Document configuration
     * @returns {Document}
     */
    createDocument(config = {}) {
        // Auto-generate name if not provided
        if (!config.name) {
            config.name = this.untitledCounter === 1
                ? 'Untitled-1'
                : `Untitled-${this.untitledCounter}`;
            this.untitledCounter++;
        }

        const document = new MarkdownDocument(config);
        this.documents.push(document);

        // Trigger callback
        if (this.onDocumentCreate) {
            this.onDocumentCreate(document);
        }

        return document;
    }

    /**
     * Get document by ID
     * @param {string} id - Document ID
     * @returns {Document|null}
     */
    getDocument(id) {
        return this.documents.find(doc => doc.id === id) || null;
    }

    /**
     * Get active document
     * @returns {Document|null}
     */
    getActiveDocument() {
        if (!this.activeDocumentId) return null;
        return this.getDocument(this.activeDocumentId);
    }

    /**
     * Switch to a different document
     * @param {string} id - Document ID to switch to
     * @returns {Document|null}
     */
    switchDocument(id) {
        const document = this.getDocument(id);
        if (!document) return null;

        // Update active document ID
        this.activeDocumentId = id;

        // Save to storage after switching (to persist the new active document ID)
        if (this.autoSave) {
            this.saveToStorage();
        }

        // Trigger callback
        if (this.onDocumentSwitch) {
            this.onDocumentSwitch(document);
        }

        return document;
    }

    /**
     * Close a document
     * @param {string} id - Document ID to close
     * @returns {boolean} - Success status
     */
    closeDocument(id) {
        const index = this.documents.findIndex(doc => doc.id === id);
        if (index === -1) return false;

        const document = this.documents[index];

        // Remove document
        this.documents.splice(index, 1);

        // If closing active document, switch to another
        if (this.activeDocumentId === id) {
            if (this.documents.length > 0) {
                // Switch to previous document, or first if closing first
                const newIndex = index > 0 ? index - 1 : 0;
                this.switchDocument(this.documents[newIndex].id);
            } else {
                // Reset untitled counter when all documents are closed
                this.untitledCounter = 1;
                // Create a new empty document
                const newDoc = this.createDocument();
                this.switchDocument(newDoc.id);
            }
        }

        // Trigger callback
        if (this.onDocumentClose) {
            this.onDocumentClose(document);
        }

        // Update storage
        if (this.autoSave) {
            this.saveToStorage();
        }

        return true;
    }

    /**
     * Update active document content
     * @param {string} content - New content
     */
    updateActiveContent(content) {
        const activeDoc = this.getActiveDocument();
        if (!activeDoc) return;

        activeDoc.setContent(content);

        // Trigger callback
        if (this.onDocumentUpdate) {
            this.onDocumentUpdate(activeDoc);
        }

        // Schedule auto-save
        if (this.autoSave) {
            this.scheduleAutoSave();
        }
    }

    /**
     * Rename a document
     * @param {string} id - Document ID
     * @param {string} name - New name
     */
    renameDocument(id, name) {
        const document = this.getDocument(id);
        if (!document) return;

        document.setName(name);

        // Trigger callback
        if (this.onDocumentUpdate) {
            this.onDocumentUpdate(document);
        }

        if (this.autoSave) {
            this.saveToStorage();
        }
    }

    /**
     * Get all documents
     * @returns {Array<Document>}
     */
    getAllDocuments() {
        return [...this.documents];
    }

    /**
     * Get document count
     * @returns {number}
     */
    getDocumentCount() {
        return this.documents.length;
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(() => {
            this.saveToStorage();
        }, this.autoSaveDelay);
    }

    /**
     * Save all documents to localStorage
     */
    saveToStorage() {
        try {
            const data = {
                documents: this.documents.map(doc => doc.toJSON()),
                activeDocumentId: this.activeDocumentId,
                untitledCounter: this.untitledCounter
            };
            localStorage.setItem('markdown-documents', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save documents:', error);
        }
    }

    /**
     * Load documents from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem('markdown-documents');
            if (!data) return false;

            const parsed = JSON.parse(data);

            // Restore documents
            this.documents = parsed.documents.map(doc => MarkdownDocument.fromJSON(doc));
            this.activeDocumentId = parsed.activeDocumentId;
            this.untitledCounter = parsed.untitledCounter || 1;

            return true;
        } catch (error) {
            console.error('Failed to load documents:', error);
            return false;
        }
    }

    /**
     * Clear all documents
     */
    clearAll() {
        this.documents = [];
        this.activeDocumentId = null;
        this.untitledCounter = 1;

        if (this.autoSave) {
            localStorage.removeItem('markdown-documents');
        }
    }

    /**
     * Export active document as markdown file
     * @returns {Object} - {filename, content}
     */
    exportActiveDocument() {
        const activeDoc = this.getActiveDocument();
        if (!activeDoc) return null;

        return {
            filename: `${activeDoc.name}.md`,
            content: activeDoc.content
        };
    }
}

// Export for use in other modules (browser environment)
if (typeof window !== 'undefined') {
    window.DocumentManager = DocumentManager;
}
// Also support Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentManager;
}
