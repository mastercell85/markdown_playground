# Document Tab Management

## Overview
The markdown editor now supports **multiple documents** with tab-based navigation, auto-save to localStorage, and seamless switching between documents.

## Features

### ✨ **Tab Management**
- **Create new tabs** - Click the "+" button to create a new document
- **Switch between tabs** - Click tab name to switch to that document
- **Close tabs** - Click "×" to close a document (with confirmation if it has content)
- **Rename tabs** - Double-click tab name to rename inline
- **Right-click context menu** - Access Rename, Close, Close Others, and Close All options
- **Auto-naming** - New documents named "Untitled-1", "Untitled-2", etc.
- **Smart counter reset** - Counter resets to 1 when all tabs are closed

### 💾 **Auto-Save**
- Documents automatically save to localStorage every 1 second
- All tabs and content restored on page reload
- No data loss on browser refresh or accidental closure

### 🎯 **Smart Behavior**
- Active tab highlighted
- Closing last tab creates a new empty document
- Content isolated per document
- Switching tabs loads document content instantly

## SOLID Architecture

### 📦 **New Modules**

#### 1. **Document.js** - Document Model
```javascript
class Document {
    - id: unique identifier
    - name: document name
    - content: markdown content
    - created: creation timestamp
    - modified: last modified timestamp
    - metadata: extensible metadata object
}
```

**Responsibilities:**
- Represents a single document
- Manages document data
- Provides serialization (toJSON/fromJSON)

**SOLID Principles:**
- ✅ Single Responsibility: Only represents document data
- ✅ Open/Closed: Extensible via metadata

#### 2. **DocumentManager.js** - Document Collection Manager
```javascript
class DocumentManager {
    - documents: array of Document objects
    - activeDocumentId: currently active document
    - Auto-save to localStorage
    - Document CRUD operations
}
```

**Responsibilities:**
- Create, read, update, delete documents
- Track active document
- Auto-save to localStorage
- Load from localStorage on init

**SOLID Principles:**
- ✅ Single Responsibility: Only manages document collection
- ✅ Dependency Inversion: Depends on Document abstraction
- ✅ Open/Closed: Extensible through callbacks

#### 3. **TabController.js** - Tab UI Manager
```javascript
class TabController {
    - Renders tabs from DocumentManager
    - Handles tab clicks, creation, closing
    - Inline rename on double-click
    - Right-click context menu with options
    - Click-delay pattern for double-click detection
    - UI-only, no business logic
}
```

**Responsibilities:**
- Render tab UI
- Handle tab interactions (click, double-click, right-click)
- Show context menu with tab options
- Sync UI with DocumentManager state

**SOLID Principles:**
- ✅ Single Responsibility: Only handles tab UI
- ✅ Dependency Inversion: Depends on DocumentManager interface
- ✅ Interface Segregation: Clean, focused API

## Data Flow

### Creating a New Document
```
User clicks "+" button
       │
       ▼
TabController.handleNewTab()
       │
       ▼
DocumentManager.createDocument()
       │
       ├─► Create new Document instance
       ├─► Add to documents array
       ├─► Auto-generate name (Untitled-N)
       └─► Trigger onDocumentCreate callback
       │
       ▼
DocumentManager.switchDocument(newId)
       │
       ├─► Set as activeDocumentId
       └─► Trigger onDocumentSwitch callback
              │
              ▼
         Renderer.setMarkdown(doc.content)
              │
              ▼
         Editor loads document content
       │
       ▼
TabController.renderTabs()
       │
       └─► Re-render all tabs with new tab included
```

### Switching Documents
```
User clicks tab
       │
       ▼
TabController.handleTabClick(docId)
       │
       ▼
DocumentManager.switchDocument(docId)
       │
       ├─► Save current document (if auto-save enabled)
       ├─► Set activeDocumentId = docId
       └─► Trigger onDocumentSwitch callback
              │
              ▼
         Renderer.setMarkdown(doc.content)
              │
              ▼
         Editor displays document content
       │
       ▼
TabController.renderTabs()
       │
       └─► Update active tab highlighting
```

### Auto-Save Flow
```
User types in editor
       │
       ▼
Renderer detects input event
       │
       ▼
Renderer.render()
       │
       ├─► Parse markdown
       ├─► Update preview
       └─► Trigger onRender callback
              │
              ▼
         DocumentManager.updateActiveContent(markdown)
              │
              ├─► Update Document.content
              ├─► Update Document.modified timestamp
              └─► Schedule auto-save (1 second debounce)
                     │
                     ▼
                DocumentManager.saveToStorage()
                     │
                     └─► Save all docs to localStorage
```

### Closing a Document
```
User clicks "×" on tab
       │
       ▼
TabController.handleTabClose(docId)
       │
       ├─► Check if document has content
       ├─► Show confirmation if not empty
       └─► If confirmed:
              │
              ▼
         DocumentManager.closeDocument(docId)
              │
              ├─► Remove from documents array
              ├─► If closing active document:
              │   └─► Switch to previous/next document
              ├─► If last document:
              │   └─► Create new empty document
              └─► Trigger onDocumentClose callback
              │
              ▼
         TabController.renderTabs()
              │
              └─► Re-render tabs without closed tab
```

## LocalStorage Structure

```json
{
  "documents": [
    {
      "id": "doc-1736498234567-abc123xyz",
      "name": "Untitled-1",
      "content": "# My Document\n\nContent here...",
      "created": "2026-01-10T12:30:34.567Z",
      "modified": "2026-01-10T12:35:12.123Z",
      "metadata": {}
    },
    {
      "id": "doc-1736498456789-def456uvw",
      "name": "Notes",
      "content": "- Item 1\n- Item 2",
      "created": "2026-01-10T12:34:16.789Z",
      "modified": "2026-01-10T12:40:22.456Z",
      "metadata": {}
    }
  ],
  "activeDocumentId": "doc-1736498234567-abc123xyz",
  "untitledCounter": 2
}
```

## API Reference

### DocumentManager API

```javascript
// Create new document
const doc = documentManager.createDocument({ name: 'My Doc', content: '# Hello' });

// Get document by ID
const doc = documentManager.getDocument(docId);

// Get active document
const activeDoc = documentManager.getActiveDocument();

// Switch to document
documentManager.switchDocument(docId);

// Close document
documentManager.closeDocument(docId);

// Update active document content
documentManager.updateActiveContent(markdown);

// Rename document
documentManager.renameDocument(docId, 'New Name');

// Get all documents
const allDocs = documentManager.getAllDocuments();

// Manual save
documentManager.saveToStorage();

// Load from storage
documentManager.loadFromStorage();

// Export active document
const { filename, content } = documentManager.exportActiveDocument();
```

### TabController API

```javascript
// Render all tabs
tabController.renderTabs();

// Update specific tab
tabController.updateTab(docId);

// Scroll active tab into view
tabController.scrollToActiveTab();

// Show context menu (called internally on right-click)
tabController.showContextMenu(event, docId);
```

**Context Menu Options:**
- **Rename** - Opens inline rename input
- **Close** - Closes the selected tab
- **Close Others** - Closes all tabs except the selected one
- **Close All** - Closes all tabs with confirmation

### Document API

```javascript
// Create document
const doc = new Document({ name: 'My Doc', content: '# Hello' });

// Update content
doc.setContent('# Updated content');

// Update name
doc.setName('New Name');

// Get display name (truncated)
const displayName = doc.getDisplayName(20);

// Check if empty
if (doc.isEmpty()) { }

// Check if untitled
if (doc.isUntitled()) { }

// Clone document
const copy = doc.clone();

// Serialize
const json = doc.toJSON();

// Deserialize
const doc = Document.fromJSON(json);
```

## Extending the System

### Add Custom Metadata
```javascript
// Track word count
renderer.onRender = ({ markdown }) => {
    const activeDoc = documentManager.getActiveDocument();
    if (activeDoc) {
        activeDoc.metadata.wordCount = markdown.split(/\s+/).length;
        documentManager.updateActiveContent(markdown);
    }
};
```

### Add Export Feature
```javascript
function exportAsMarkdown() {
    const { filename, content } = documentManager.exportActiveDocument();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
```

### Add Document Templates
```javascript
function createFromTemplate(template) {
    const templates = {
        'meeting-notes': '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n## Notes\n\n## Action Items\n',
        'blog-post': '# Blog Title\n\n**Author:** \n**Date:** \n\n## Introduction\n\n## Main Content\n\n## Conclusion\n'
    };

    documentManager.createDocument({
        name: `New ${template}`,
        content: templates[template] || ''
    });
}
```

### Add Cloud Sync
```javascript
documentManager.onDocumentUpdate = async (doc) => {
    // Sync to server
    await fetch('/api/documents/' + doc.id, {
        method: 'PUT',
        body: JSON.stringify(doc.toJSON())
    });
};
```

## Benefits

### Before (No Document Management)
- ❌ Single document only
- ❌ Content lost on refresh
- ❌ No way to work on multiple documents
- ❌ Manual copy/paste to switch content

### After (With Document Management)
- ✅ Multiple documents with tabs
- ✅ Auto-save to localStorage
- ✅ Seamless tab switching
- ✅ Rename documents inline (double-click)
- ✅ Right-click context menu with tab options
- ✅ Content persists across sessions
- ✅ Smart untitled counter reset
- ✅ Professional workflow

## Future Enhancements

Easily add these features thanks to SOLID architecture:

1. **Keyboard Shortcuts**
   - Ctrl+N: New document
   - Ctrl+W: Close document
   - Ctrl+Tab: Switch documents

2. **Document Search**
   - Search across all documents
   - Filter tabs by name

3. **Document History**
   - Track document revisions
   - Undo/redo support

4. **Cloud Sync**
   - Sync documents to server
   - Real-time collaboration

5. **Export Options**
   - Export as HTML
   - Export as PDF
   - Batch export

All implemented following SOLID principles for easy extension! 🎉
