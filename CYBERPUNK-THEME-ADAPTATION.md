# Cyberpunk Theme Adaptation for Markdown Editor

## Issues Identified

### 1. **Typora-Specific Selectors**
The theme is designed for Typora and uses `#write` as the main container.
- **Typora**: `#write` (preview/editor combined)
- **Our Editor**:
  - `#markdown-input` (textarea for input)
  - `#markdown-preview` (div for rendered output)
  - `#write-input` (duplicated styles for Typora themes)

### 2. **Missing Editor-Specific Elements**
The theme doesn't style our editor's UI components:
- Document tabs (`.document-tab`, `.document-tab.active`)
- Side panels (`.files-panel`, `.edit-panel`, `.view-panel`, etc.)
- Resizable divider (`#editor-divider`)
- Panel buttons (`.panel-button`)
- Editor container (`.editor-container`)

### 3. **Background/Body Styling**
- Theme sets `body::before` with grid background
- May conflict with existing editor layout
- Fixed positioning may not work well with split-view

## Adaptation Strategy

### Phase 1: Make it Load (Quick Fixes)
1. Duplicate all `#write` selectors to also target `#write-input` (for Typora adapter)
2. Add missing selectors for editor input/output elements
3. Style the textarea background and colors

### Phase 2: Full Integration (Editor-Specific)
1. Style document tabs with cyberpunk theme
2. Style side panels with neon borders/colors
3. Adapt grid background to work with split-view
4. Style panel buttons and UI elements
5. Adapt scrollbars for both panes

### Phase 3: Polish
1. Ensure all animations work smoothly
2. Test with different content types
3. Verify readability in both editor and preview
4. Fix any z-index or positioning issues

## Selector Mapping

| Typora Selector | Our Editor Equivalent |
|----------------|----------------------|
| `#write` | `#markdown-preview`, `#write-input` |
| `#write p` | `#markdown-preview p` |
| `#write h1-h6` | `#markdown-preview h1-h6` |
| `#write code` | `#markdown-preview code` |
| `#write pre.md-fences` | `#markdown-preview pre` |
| `.markdown-textarea` | Need to add (for input area) |
| `.editor-panel` | Need to add (for panels) |
| `.document-tab` | Need to add (for tabs) |

## Required Changes

### Critical (Must Have)
- [ ] Add styles for `#markdown-input` (textarea)
- [ ] Add styles for `#markdown-preview` (preview div)
- [ ] Fix background to not overflow or conflict
- [ ] Ensure text is readable in input area

### Important (Should Have)
- [ ] Style document tabs
- [ ] Style side panels
- [ ] Style panel buttons
- [ ] Adapt scrollbars

### Nice to Have
- [ ] Cyberpunk animations on UI elements
- [ ] Neon glow effects on active tabs
- [ ] Custom panel decorations
