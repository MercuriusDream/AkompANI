# VSCode-Style Layout Toggle Buttons

## What
Add VSCode-style layout toggle buttons to the **flow tabs bar** (right side, before the `+` new tab button). Two small icon buttons:
- **Toggle Left Panel** (sidebar/blocks) — filled-left/unfilled-right vs unfilled-left/unfilled-right
- **Toggle Right Panel** (inspector) — unfilled-left/filled-right vs unfilled-left/unfilled-right

When a panel is collapsed it shrinks to a slim ~40px strip showing a rotated label (already done for right panel), with the resize handle hidden. Clicking the collapsed strip or the toggle button re-expands it.

## Changes

### 1. HTML — `public/app/index.html`
- Add a `.layout-toggles` group inside `.flow-tabs`, after the scroll area and before `#flowTabNew`:
  ```html
  <div class="layout-toggles">
    <button id="toggleLeftPanel" class="layout-toggle-btn active" title="Toggle left panel">
      <!-- Two-rect SVG: left filled, right outline -->
    </button>
    <button id="toggleRightPanel" class="layout-toggle-btn active" title="Toggle right panel">
      <!-- Two-rect SVG: left outline, right filled -->
    </button>
  </div>
  ```
- Remove `#toggleInspectorBtn` and `#floatInspectorBtn` from inspector panel header (no longer needed there)

### 2. CSS — `public/editor/editor.css`
- **`.layout-toggles`**: flex, gap 2px, align-items center, margin-left auto, padding-right 4px, separator line on left
- **`.layout-toggle-btn`**: 24x24, ghost button style, SVG icons 16x16. `.active` state = panel visible (filled rect). Inactive = panel hidden (both rects outline)
- **Left collapse** (`body.left-collapsed`):
  - Grid: `40px 0px 1fr 4px 300px` (collapse left + hide its resize handle)
  - `.blocks-panel`: `min-width: 0; overflow: hidden; cursor: pointer`
  - Hide `.panel-tabs` and `.panel-tab-content`
  - Show `::after` rotated "BLOCKS" label
- **Right collapse** — keep existing `body.right-collapsed` styles (already working with `::after` label)
- **Both collapsed**: `40px 0px 1fr 0px 40px`

### 3. JS — `public/app.js`
- Add `state.isLeftCollapsed` (persisted to `akompani_left_collapsed`)
- Add `toggleLeftPanelCollapse()` mirroring the right panel toggle
- Wire `#toggleLeftPanel` and `#toggleRightPanel` click handlers
- Update `.active` class on buttons to reflect state
- Click on collapsed left panel strip → expand
- Update `persistEditorMode()` to save left collapse state
- Update `boot()` to restore left collapse state
- Update `switchMode()` to apply both collapse states in canvas mode
- Remove old `#toggleInspectorBtn` / `#floatInspectorBtn` references (clean up dead code)
- Update resize drag handler to check `body.left-collapsed`

### 4. Files touched
- `public/app/index.html` — flow-tabs area + inspector header cleanup
- `public/editor/editor.css` — layout-toggles styles + left-collapsed styles
- `public/app.js` — left panel toggle logic + rewire right panel toggle
