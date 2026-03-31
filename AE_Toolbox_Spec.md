# AE Toolbox — Combined ScriptUI Panel Specification

## Overview

Build a single dockable ScriptUI panel (`.jsx`) for After Effects that combines three tools into a custom-drawn tabbed interface. **Do NOT use native `tabbedpanel`** — instead, build a custom tab bar using `customButton` elements with `onDraw` callbacks, and swap content groups for each tab via `visible` toggling.

Install location: `After Effects/Support Files/Scripts/ScriptUI Panels/`
Access: `Window → AE Toolbox`

The panel name/title is **"AE Toolbox"**.

---

## Custom UI Drawing System

The goal is a polished, flat, dark-themed panel similar to professional AE tools (MotionTools Pro, Flow, etc.). This means **no native buttons, no native checkboxes, no native radio buttons** for interactive controls. Instead, use ScriptUI's `customButton` and `customView` elements with `onDraw` callbacks to paint every control from scratch.

### Color Palette (Dark Theme)

Define these as reusable RGBA arrays (0–1 range) at the top of the script:

```javascript
var COLORS = {
    bg:             [0.15, 0.15, 0.15, 1],    // panel background — dark gray
    bgLight:        [0.20, 0.20, 0.20, 1],    // slightly lighter surface (input fields, cards)
    bgLighter:      [0.25, 0.25, 0.25, 1],    // hover states, active tab bg
    border:         [0.30, 0.30, 0.30, 1],    // subtle borders / separators
    text:           [0.85, 0.85, 0.85, 1],    // primary text — light gray
    textDim:        [0.50, 0.50, 0.50, 1],    // secondary/disabled text
    accent:         [0.30, 0.60, 1.00, 1],    // accent blue — active states, highlights
    accentHover:    [0.40, 0.68, 1.00, 1],    // accent hover
    white:          [1.00, 1.00, 1.00, 1],    // white text on accent
    checkmark:      [0.30, 0.60, 1.00, 1],    // checkbox fill when checked
    transparent:    [0, 0, 0, 0]
};
```

### ScriptUIGraphics Drawing API Reference

All custom drawing happens inside `onDraw` callbacks. The key methods on the `this.graphics` object:

```javascript
var g = this.graphics;

// Brushes (fills)
g.newBrush(g.BrushType.SOLID_COLOR, [r, g, b, a]);

// Pens (strokes, text)
g.newPen(g.PenType.SOLID_COLOR, [r, g, b, a], lineWidth);

// Paths
g.newPath();
g.rectPath(left, top, width, height);
g.ellipsePath(left, top, width, height);
g.moveTo(x, y);
g.lineTo(x, y);
g.fillPath(brush);
g.strokePath(pen);

// Text
g.measureString(text, font);  // returns {width, height}
g.drawString(text, pen, x, y, font);
```

### Rounded Rectangle Helper

This is the core drawing primitive. Use it for buttons, toggles, input field backgrounds, tab backgrounds, etc.

```javascript
function drawRoundedRect(g, brush, width, height, radius, x, y) {
    // Draw 4 corner circles
    g.newPath();
    g.ellipsePath(x, y, radius, radius);
    g.fillPath(brush);
    g.newPath();
    g.ellipsePath(width - x - radius, y, radius, radius);
    g.fillPath(brush);
    g.newPath();
    g.ellipsePath(width - x - radius, height - y - radius, radius, radius);
    g.fillPath(brush);
    g.newPath();
    g.ellipsePath(x, height - y - radius, radius, radius);
    g.fillPath(brush);

    // Fill center cross (two overlapping rects)
    g.newPath();
    g.rectPath(x + radius / 2, y, width - x * 2 - radius, height - y * 2);
    g.fillPath(brush);
    g.newPath();
    g.rectPath(x, y + radius / 2, width - x * 2, height - y * 2 - radius);
    g.fillPath(brush);
}
```

### Custom Control Constructors

Build reusable constructor functions for each control type. Each returns a ScriptUI element with custom drawing and event handling.

#### Custom Button

```javascript
function CustomButton(parent, text, options) {
    // options: { width, height, isAccent }
    var btn = parent.add("customButton", undefined, "");
    btn.preferredSize = [options.width || 200, options.height || 28];
    btn.text = text;
    btn._hover = false;
    btn._isAccent = options.isAccent || false;

    function redraw(hover) {
        var g = btn.graphics;
        var fillColor = btn._isAccent
            ? (hover ? COLORS.accentHover : COLORS.accent)
            : (hover ? COLORS.bgLighter : COLORS.bgLight);
        var textColor = btn._isAccent ? COLORS.white : COLORS.text;

        var fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, fillColor);
        var textPen = g.newPen(g.PenType.SOLID_COLOR, textColor, 1);
        var textSize = g.measureString(btn.text);

        btn.onDraw = function() {
            drawRoundedRect(g, fillBrush, this.size.width, this.size.height, 6, 0, 0);
            g.drawString(btn.text, textPen,
                (this.size.width - textSize.width) / 2,
                (this.size.height - textSize.height) / 2);
        };
    }

    redraw(false);
    btn.addEventListener("mouseover", function() { redraw(true); btn.notify("onDraw"); });
    btn.addEventListener("mouseout", function() { redraw(false); btn.notify("onDraw"); });

    return btn;
}
```

#### Custom Checkbox

```javascript
function CustomCheckbox(parent, text, defaultValue) {
    var grp = parent.add("group");
    grp.orientation = "row";
    grp.spacing = 6;
    grp.alignment = ["left", "center"];

    var box = grp.add("customButton", undefined, "");
    box.preferredSize = [16, 16];
    box._checked = defaultValue || false;

    var label = grp.add("statictext", undefined, text);
    // Style label text color via graphics after layout

    function redraw() {
        var g = box.graphics;
        var bgBrush = g.newBrush(g.BrushType.SOLID_COLOR,
            box._checked ? COLORS.checkmark : COLORS.bgLight);
        var borderPen = g.newPen(g.PenType.SOLID_COLOR,
            box._checked ? COLORS.accent : COLORS.border, 1);
        var checkPen = g.newPen(g.PenType.SOLID_COLOR, COLORS.white, 2);

        box.onDraw = function() {
            drawRoundedRect(g, bgBrush, this.size.width, this.size.height, 4, 0, 0);
            if (box._checked) {
                // Draw checkmark
                g.newPath();
                g.moveTo(3, 8);
                g.lineTo(6, 12);
                g.lineTo(13, 3);
                g.strokePath(checkPen);
            }
        };
    }

    box.addEventListener("click", function() {
        box._checked = !box._checked;
        redraw();
        box.notify("onDraw");
        if (grp.onValueChange) grp.onValueChange();
    });
    label.addEventListener("click", function() {
        box._checked = !box._checked;
        redraw();
        box.notify("onDraw");
        if (grp.onValueChange) grp.onValueChange();
    });

    redraw();

    // Expose value getter/setter on the group
    grp.getValue = function() { return box._checked; };
    grp.setValue = function(v) { box._checked = v; redraw(); box.notify("onDraw"); };

    return grp;
}
```

#### Custom Segmented Toggle (for Mode: Individual/Shared, Opacity: 0→100 / 100→0)

```javascript
function SegmentedToggle(parent, labels, defaultIndex) {
    var grp = parent.add("group");
    grp.orientation = "row";
    grp.spacing = 0;
    grp._selectedIndex = defaultIndex || 0;
    grp._buttons = [];

    for (var i = 0; i < labels.length; i++) {
        (function(idx) {
            var seg = grp.add("customButton", undefined, "");
            seg.preferredSize = [labels[idx].length > 6 ? 80 : 60, 24];
            seg.text = labels[idx];
            seg._index = idx;

            function redraw() {
                var g = seg.graphics;
                var isActive = (grp._selectedIndex === idx);
                var fillBrush = g.newBrush(g.BrushType.SOLID_COLOR,
                    isActive ? COLORS.accent : COLORS.bgLight);
                var textPen = g.newPen(g.PenType.SOLID_COLOR,
                    isActive ? COLORS.white : COLORS.textDim, 1);
                var textSize = g.measureString(seg.text);

                seg.onDraw = function() {
                    // First segment: left rounded corners
                    // Last segment: right rounded corners
                    // Middle: no rounded corners
                    drawRoundedRect(g, fillBrush, this.size.width, this.size.height, 4, 0, 0);
                    g.drawString(seg.text, textPen,
                        (this.size.width - textSize.width) / 2,
                        (this.size.height - textSize.height) / 2);
                };
            }

            seg.addEventListener("click", function() {
                grp._selectedIndex = idx;
                // Redraw all segments
                for (var j = 0; j < grp._buttons.length; j++) {
                    grp._buttons[j]._redraw();
                    grp._buttons[j].notify("onDraw");
                }
                if (grp.onChange) grp.onChange();
            });

            seg._redraw = redraw;
            redraw();
            grp._buttons.push(seg);
        })(i);
    }

    grp.getValue = function() { return grp._selectedIndex; };
    grp.setValue = function(idx) {
        grp._selectedIndex = idx;
        for (var j = 0; j < grp._buttons.length; j++) {
            grp._buttons[j]._redraw();
            grp._buttons[j].notify("onDraw");
        }
    };

    return grp;
}
```

#### Custom Direction Pad (for Move tab)

Build as a group of 4 `customButton` elements arranged in a cross. Each button draws an arrow icon. The active direction gets the accent fill, others get the default fill.

```javascript
// Arrow icons drawn with g.moveTo / g.lineTo paths
// Up: chevron pointing up
// Down: chevron pointing down
// Left: chevron pointing left
// Right: chevron pointing right (default active)
```

The direction pad should be laid out as:
```
         [ ▲ ]
    [ ◄ ]     [ ► ]
         [ ▼ ]
```

Each arrow button size: `[28, 22]`. Use nested groups:
- Outer group: column orientation
- Row 1 (center-aligned): up button
- Row 2 (center-aligned): left + right buttons with spacing
- Row 3 (center-aligned): down button

#### Custom Text Input

Use native `edittext` for actual text input (ScriptUI doesn't let you draw into edit fields), but style its background:

```javascript
var input = parent.add("edittext", undefined, defaultText);
input.preferredSize = [width, 22];
// After layout, style background:
input.graphics.backgroundColor = input.graphics.newBrush(
    input.graphics.BrushType.SOLID_COLOR, COLORS.bgLight);
input.graphics.foregroundColor = input.graphics.newPen(
    input.graphics.PenType.SOLID_COLOR, COLORS.text, 1);
```

#### Section Labels

Small uppercase labels for sections (like "MODE", "OPTIONS", "DISTANCE"). Use `statictext` with a custom font:

```javascript
var label = parent.add("statictext", undefined, "MODE");
label.graphics.font = ScriptUI.newFont("dialog", "BOLD", 10);
label.graphics.foregroundColor = label.graphics.newPen(
    label.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);
```

### Custom Tab System

**Do NOT use native `tabbedpanel`** — it can't be styled. Instead:

1. Create a **tab bar group** at the top with `customButton` elements for each tab
2. Create a **content stack** — three groups (one per tab), all in the same container
3. Toggle `visible` on the content groups when a tab is clicked
4. Redraw tab buttons to show active/inactive state

```javascript
// Tab bar
var tabBar = win.add("group");
tabBar.orientation = "row";
tabBar.alignment = ["fill", "top"];
tabBar.spacing = 0;

var tabNames = ["Assign Null", "Precomp", "Move"];
var tabBtns = [];
var tabContents = [];

// Content container
var contentGrp = win.add("group");
contentGrp.orientation = "stack";  // all children overlap
contentGrp.alignment = ["fill", "fill"];
contentGrp.alignChildren = ["fill", "top"];

for (var i = 0; i < tabNames.length; i++) {
    // Tab button
    var tabBtn = tabBar.add("customButton", undefined, "");
    tabBtn.preferredSize = [-1, 28]; // fill width, 28px tall
    tabBtn.text = tabNames[i];
    tabBtn._index = i;
    tabBtns.push(tabBtn);

    // Tab content group
    var content = contentGrp.add("group");
    content.orientation = "column";
    content.alignChildren = ["fill", "top"];
    content.visible = (i === 0); // only first tab visible
    tabContents.push(content);
}

// Active tab index
var activeTab = 0;

function switchTab(index) {
    activeTab = index;
    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].visible = (i === index);
    }
    // Redraw all tab buttons
    for (var j = 0; j < tabBtns.length; j++) {
        tabBtns[j]._redraw();
        tabBtns[j].notify("onDraw");
    }
}

// Tab button drawing — active tab gets accent underline or lighter bg
// Each tab button onDraw:
//   - Active: COLORS.bgLighter fill, accent-colored bottom border (2px line), COLORS.text label
//   - Inactive: COLORS.bg fill (transparent), COLORS.textDim label
```

### Panel Background

Set the window/panel background to the dark color:

```javascript
var g = win.graphics;
g.backgroundColor = g.newBrush(g.BrushType.SOLID_COLOR, COLORS.bg);
```

For groups that need the dark background, set `graphics.backgroundColor` after layout.

### Separator Lines

Use a `customView` with height 1 to draw a horizontal line:

```javascript
var sep = parent.add("customView", undefined, "");
sep.preferredSize = [-1, 1];  // fill width, 1px tall
sep.onDraw = function() {
    var g = this.graphics;
    var pen = g.newPen(g.PenType.SOLID_COLOR, COLORS.border, 1);
    g.newPath();
    g.moveTo(0, 0);
    g.lineTo(this.size.width, 0);
    g.strokePath(pen);
};
```

### Spacing & Layout Constants

```javascript
var PANEL_MARGINS = 12;
var SECTION_SPACING = 12;
var CONTROL_SPACING = 6;
var LABEL_SPACING = 4;
var BUTTON_HEIGHT = 28;
var BUTTON_RADIUS = 4;
var CHECKBOX_SIZE = 16;
var CHECKBOX_RADIUS = 3;
var INPUT_HEIGHT = 22;
var TAB_HEIGHT = 28;
var DIRECTION_BTN_SIZE = [28, 22];
```

### Tooltip Text

Apply `helpTip` strings to controls for hover-over tooltips explaining functionality.

### Font

Use the default `"dialog"` font at size 11 for body text, size 10 BOLD for section labels. Don't try to load external fonts — they aren't supported in ScriptUI.

---

## Tab 1: Assign Null

### Purpose
Parent selected layers to null layers. Two modes: Individual (each layer gets its own null) and Shared (all layers share one null).

### UI Elements
- **Mode toggle**: two radio buttons — "Individual" (default selected) and "Shared"
- **Shared null name**: text input field, default `"Group_Null"`, disabled when Individual is selected, enabled when Shared is selected
- **Options**: checkbox "Skip null layers" (checked by default)
- **Description label**: multiline static text that updates based on mode
  - Individual: `"Each layer gets its own null\nmatched to its position."`
  - Shared: `"All selected layers share one null\npositioned at their average centre."`
- **Run button**: labeled "Assign Null"

### Logic

#### Helpers
- `hasNullParent(layer)` — returns true if layer.parent exists and is a null layer
- `isNull(layer)` — returns true if layer.nullLayer is true
- `findNullByName(comp, name)` — searches comp for an existing null with that name
- `averagePosition(layers)` — returns [avgX, avgY] across all layers
- `earliestIn(layers)` — returns the smallest inPoint
- `latestOut(layers)` — returns the largest outPoint
- `any3D(layers)` — returns true if any layer is 3D
- `makeNull(comp, name, pos, inPt, outPt, threeD)` — creates a null, sets name/position/in/out/3D

#### Always-on behavior (not a toggle)
Layers that already have a null parent are always skipped.

#### "Skip null layers" checkbox
When checked, null layers in the selection are also skipped (left alone). This is a separate behavior from the always-on null-parent skip.

#### Individual Mode
For each selected layer (that passes the skip checks):
1. Generate name: `layerName + "_Null"`
2. Check if a null with that name already exists in comp — reuse it if so
3. If creating new: position at layer's position, match in/out points and 3D state, place just below the layer (`n.moveAfter(layer)`)
4. Set `layer.parent = n`
5. Track created count and skipped count

#### Shared Mode
1. Filter selection through skip checks into `actionable` array
2. If no actionable layers, return early
3. Check if a null with the shared name already exists — reuse if so
4. If creating new: position at average of all actionable layers, inPoint = earliest, outPoint = latest, 3D if any are 3D
5. Place above the topmost selected layer (`n.moveBefore(topLayer)`)
6. Parent all actionable layers to this null
7. Track created (0 or 1) and skipped count

#### Post-run
Show alert: `"Done!\n\nNulls created : X\nLayers skipped: Y"` with explanation if skipped > 0.

Wrap all modifications in `app.beginUndoGroup("Assign Null to Selected Layers")` / `app.endUndoGroup()`.

---

## Tab 2: Precomp

### Purpose
Precomp each selected layer into its own individual composition, preserving the original layer name as the precomp name.

### UI Elements
- **Description label**: static text explaining what the tool does
- **Run button**: labeled "Precomp Individually"

This is the simplest tab — no settings needed.

### Logic

#### Guards
- Check `app.project` exists
- Check `app.project.activeItem` is a CompItem
- Check at least one layer is selected

#### Process
1. Capture comp properties: width, height, pixelAspect, frameRate, duration
2. Snapshot all selected layer data BEFORE modifying (indices shift on deletion): layer reference, name, index, startTime, inPoint, outPoint
3. For each layer:
   a. Deselect all layers in comp, then select only this layer
   b. Calculate precomp duration: `outPoint - inPoint` (fallback to comp duration if <= 0)
   c. Call `comp.layers.precompose([layer.index], data.name, true)` — "Move all attributes"
   d. Find the newly created precomp in the project (CompItem matching name, not the parent comp, highest `.id` wins on name collision)
   e. Set the new precomp's duration to the calculated precomp duration

#### Post-run
Show alert: `"Done!\nX layer(s) precomped individually."`

Wrap in `app.beginUndoGroup("Precomp Selected Layers Individually")` / `app.endUndoGroup()`.

---

## Tab 3: Move & Opacity

### Purpose
Keyframe position movement and/or opacity transitions on selected layers from the current time indicator.

### UI Elements

#### Position Section
- **Position checkbox**: checked by default. When unchecked, all position controls are disabled.
- **Direction pad**: 4 radio buttons arranged in a cross pattern (up, left, right, down). Default: right. Only one can be active at a time. Use manual onClick handlers to enforce mutual exclusivity (ExtendScript radio buttons in different groups don't auto-exclude).
- **Distance input**: edittext, default `"50"`, label "Dis" or "Distance"
- **Frames input**: edittext, default `"10"`, label "Frs" or "Frames"
- **Displace checkbox**: checked by default. Controls whether the layer starts displaced and animates TO its current position (checked) or starts at current position and animates AWAY (unchecked).
- **Ease checkbox**: unchecked by default. When checked, applies easing to both position keyframes after they are created.

#### Opacity Section (below a separator)
- **Opacity checkbox**: unchecked by default. When unchecked, all opacity controls are disabled.
- **Mode toggle**: two radio buttons — "0→100" (default) and "100→0"
- **Frames input**: edittext, default `"10"`

#### Bottom
- **Apply button**: labeled "Apply"
- Enter key also triggers apply

### Logic

#### Position Keyframing
Given:
- `t` = current comp time
- `endTime` = `t + (frames / comp.frameRate)`
- `dis` = distance value
- `posDir` = direction ("up", "down", "left", "right")

`computeOffset(original, dir, dis, opposite)`:
- Supports both 2D `[x, y]` and 3D `[x, y, z]` position arrays
- "left" modifies X: subtract dis (or add if opposite)
- "right" modifies X: add dis (or subtract if opposite)
- "up" modifies Y: subtract dis (or add if opposite) — AE Y increases downward
- "down" modifies Y: add dis (or subtract if opposite)

**If Displace is checked** (displaced → original):
- Set keyframe at `t` with displaced position (opposite=true)
- Set keyframe at `endTime` with original position

**If Displace is unchecked** (original → moved):
- Set keyframe at `t` with original position
- Set keyframe at `endTime` with moved position (opposite=false)

Access position property via: `layer.property("ADBE Transform Group").property("ADBE Position")`

Get current value: `posProp.valueAtTime(t, false)` with fallback to `posProp.value`

#### Ease (NEW)
When the **Ease checkbox is checked**, after setting both position keyframes, apply easing corresponding to the cubic bezier `(1.00, 0.00, 0.00, 1.00)`.

This is a strong ease-in-out curve. In ExtendScript `KeyframeEase` terms:

```javascript
// After setting both keyframes, find their indices
var startIdx = posProp.nearestKeyIndex(t);
var endIdx = posProp.nearestKeyIndex(endTime);

// Create ease objects
// The bezier 1.00, 0.00, 0.00, 1.00 translates to:
// - Start keyframe outgoing: high influence (100%), speed 0
// - End keyframe incoming: high influence (100%), speed 0
var easeIn = new KeyframeEase(0, 100);   // speed 0, influence 100%
var easeOut = new KeyframeEase(0, 100);  // speed 0, influence 100%

// Determine dimension count for the ease arrays
var dims = posProp.value.length; // 2 for 2D, 3 for 3D
var easeInArr = [];
var easeOutArr = [];
for (var d = 0; d < dims; d++) {
    easeInArr.push(easeIn);
    easeOutArr.push(easeOut);
}

// Apply to start keyframe (outgoing ease matters)
posProp.setTemporalEaseAtKey(startIdx, easeInArr, easeOutArr);

// Apply to end keyframe (incoming ease matters)
posProp.setTemporalEaseAtKey(endIdx, easeInArr, easeOutArr);
```

The key concept: `KeyframeEase(speed, influence)` where speed=0 means the animation starts/ends at rest, and influence=100% means maximum curve pull. This matches the bezier `(1.00, 0.00, 0.00, 1.00)`.

#### Reveal Position Property in Timeline (NEW)
After adding position keyframes, set the position property to selected so it opens/expands in the AE timeline:

```javascript
posProp.selected = true;
```

This makes the keyframes immediately visible and editable in the timeline panel.

#### Opacity Keyframing
Given:
- `t` = current comp time
- `endTimeOp` = `t + (opFrs / comp.frameRate)`
- `opMode` = "0-100" or "100-0"

Access opacity via: `layer.property("ADBE Transform Group").property("ADBE Opacity")`

- If "0-100": set keyframe at `t` with value 0, at `endTimeOp` with value 100
- If "100-0": set keyframe at `t` with value 100, at `endTimeOp` with value 0

#### Validation
- If Position is enabled: `dis` must be a valid number, `frs` must be a non-negative integer
- If Opacity is enabled: `opFrs` must be a non-negative integer

#### Post-run
Wrap in `app.beginUndoGroup("Move&Opacity")` / `app.endUndoGroup()`. No alert needed.

---

## Panel Structure (ExtendScript)

```
(function AEToolbox(thisObj) {

    // ── Color palette ──
    var COLORS = { /* see Custom UI Drawing System section */ };

    // ── Drawing helpers ──
    function drawRoundedRect(g, brush, w, h, r, x, y) { /* ... */ }

    // ── Custom control constructors ──
    function CustomButton(parent, text, options) { /* ... */ }
    function CustomCheckbox(parent, text, defaultValue) { /* ... */ }
    function SegmentedToggle(parent, labels, defaultIndex) { /* ... */ }
    function SectionLabel(parent, text) { /* ... */ }
    function Separator(parent) { /* ... */ }

    // ── Tool logic (helpers, modes, apply functions) ──
    // AssignNull helpers: hasNullParent, isNull, findNullByName, etc.
    // Precomp logic
    // Move & Opacity logic: computeOffset, applyAction

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "AE Toolbox", undefined, { resizeable: true });

        // Set dark background
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = PANEL_MARGINS;
        win.spacing = 0;
        var wg = win.graphics;
        wg.backgroundColor = wg.newBrush(wg.BrushType.SOLID_COLOR, COLORS.bg);

        // ── Custom Tab Bar ──
        var tabBar = win.add("group");
        // Three customButton tabs: "Assign Null", "Precomp", "Move"
        // Active tab: accent underline + light text
        // Inactive tab: no underline + dim text

        // ── Content Stack ──
        var contentGrp = win.add("group");
        contentGrp.orientation = "stack";

        // --- Tab 1 content: Assign Null ---
        var tab1 = contentGrp.add("group");
        tab1.orientation = "column";
        tab1.alignChildren = ["fill", "top"];
        // Mode: SegmentedToggle(["Individual", "Shared"])
        // Null name: edittext (disabled when Individual)
        // Skip null layers: CustomCheckbox
        // Description: statictext
        // Run: CustomButton("Assign Null", {isAccent: true})

        // --- Tab 2 content: Precomp ---
        var tab2 = contentGrp.add("group");
        tab2.orientation = "column";
        tab2.alignChildren = ["fill", "top"];
        tab2.visible = false;
        // Description: statictext
        // Run: CustomButton("Precomp Individually", {isAccent: true})

        // --- Tab 3 content: Move ---
        var tab3 = contentGrp.add("group");
        tab3.orientation = "column";
        tab3.alignChildren = ["fill", "top"];
        tab3.visible = false;
        // Position: CustomCheckbox
        // Direction pad: 4 customButton arrows
        // Distance + Frames: edittext inputs
        // Displace: CustomCheckbox
        // Ease: CustomCheckbox
        // Separator
        // Opacity: CustomCheckbox
        // Mode: SegmentedToggle(["0→100", "100→0"])
        // Frames: edittext
        // Apply: CustomButton("Apply", {isAccent: true})

        // ── Tab switching logic ──
        function switchTab(index) { /* toggle visible, redraw tabs */ }

        // Layout
        if (win instanceof Window) {
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
        }

        return win;
    }

    buildUI(thisObj);

}(this));
```

### Key Implementation Notes
- **No native `tabbedpanel`** — use custom tab bar with `customButton` + content `"stack"` group
- **All interactive controls are custom-drawn** — buttons, checkboxes, segmented toggles, direction pad arrows
- **`edittext` is the exception** — ScriptUI doesn't support custom-drawn text inputs, so use native `edittext` with styled `backgroundColor` and `foregroundColor`
- **`statictext` labels** — use native `statictext` but set `foregroundColor` via graphics for the light-on-dark text
- **Hover states** — use `addEventListener("mouseover"/"mouseout")` and `notify("onDraw")` to trigger visual updates
- **Redraw pattern** — each custom control has a `_redraw()` function that recreates the `onDraw` callback with current state, then calls `notify("onDraw")` to force the repaint
- The panel should be resizeable with proper `onResizing`/`onResize` handlers calling `this.layout.resize()`
- Wrap all comp modifications in `beginUndoGroup` / `endUndoGroup`
- Snapshot `comp.selectedLayers` into an array before modifying (indices shift)

---

## Complete Source Code Reference

Below are the three original scripts in full for reference during implementation.

### AssignNull.jsx (Original)

```jsx
// ============================================================
//  Assign Null — ScriptUI Panel
//  After Effects ExtendScript (.jsx)
//
//  INDIVIDUAL mode: each selected layer gets its own null
//  SHARED mode:     all selected layers share one null
//
//  Install: place in After Effects/Support Files/Scripts/ScriptUI Panels/
//  Access:  Window menu → AssignNull
// ============================================================

(function AssignNull(thisObj) {

    // ── Helpers ──────────────────────────────────────────────

    function hasNullParent(layer) {
        return layer.parent !== null && layer.parent.nullLayer === true;
    }

    function isNull(layer) {
        return layer.nullLayer === true;
    }

    function findNullByName(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var l = comp.layer(i);
            if (l.nullLayer && l.name === name) return l;
        }
        return null;
    }

    function averagePosition(layers) {
        var sumX = 0, sumY = 0;
        for (var i = 0; i < layers.length; i++) {
            var p = layers[i].transform.position.value;
            sumX += p[0];
            sumY += p[1];
        }
        return [sumX / layers.length, sumY / layers.length];
    }

    function earliestIn(layers) {
        var t = layers[0].inPoint;
        for (var i = 1; i < layers.length; i++) {
            if (layers[i].inPoint < t) t = layers[i].inPoint;
        }
        return t;
    }

    function latestOut(layers) {
        var t = layers[0].outPoint;
        for (var i = 1; i < layers.length; i++) {
            if (layers[i].outPoint > t) t = layers[i].outPoint;
        }
        return t;
    }

    function any3D(layers) {
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].threeDLayer) return true;
        }
        return false;
    }

    function makeNull(comp, name, pos, inPt, outPt, threeD) {
        var n = comp.layers.addNull();
        n.name      = name;
        n.inPoint   = inPt;
        n.outPoint  = outPt;
        n.threeDLayer = threeD;
        n.transform.position.setValue(pos);
        return n;
    }

    // ── Modes ────────────────────────────────────────────────

    function runIndividual(comp, layers, skipNullLayers) {
        var created = 0, skipped = 0;

        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];

            if (skipNullLayers && isNull(layer)) { skipped++; continue; }
            if (hasNullParent(layer))            { skipped++; continue; }

            var name = layer.name + "_Null";
            var n    = findNullByName(comp, name);

            if (!n) {
                var pos = layer.transform.position.value;
                n = makeNull(comp, name, pos,
                             layer.inPoint, layer.outPoint,
                             layer.threeDLayer);
                n.moveAfter(layer);
                created++;
            }

            layer.parent = n;
        }

        return { created: created, skipped: skipped };
    }

    function runShared(comp, layers, nullName, skipNullLayers) {
        var actionable = [];
        var skipped    = 0;

        for (var i = 0; i < layers.length; i++) {
            var l = layers[i];
            if (skipNullLayers && isNull(l)) { skipped++; continue; }
            if (hasNullParent(l))            { skipped++; continue; }
            actionable.push(l);
        }

        if (actionable.length === 0) {
            return { created: 0, skipped: skipped };
        }

        var n = findNullByName(comp, nullName);
        var created = 0;

        if (!n) {
            var pos    = averagePosition(actionable);
            var inPt   = earliestIn(actionable);
            var outPt  = latestOut(actionable);
            var threeD = any3D(actionable);
            n = makeNull(comp, nullName, pos, inPt, outPt, threeD);
            var topLayer = actionable[0];
            for (var j = 1; j < actionable.length; j++) {
                if (actionable[j].index < topLayer.index) topLayer = actionable[j];
            }
            n.moveBefore(topLayer);
            created = 1;
        }

        for (var k = 0; k < actionable.length; k++) {
            actionable[k].parent = n;
        }

        return { created: created, skipped: skipped };
    }

    // ... UI building omitted (see Tab 1 spec above for layout) ...

}(this));
```

### PrecompSelectedLayersIndividually.jsx (Original)

```jsx
(function precompSelectedLayersIndividually() {

    if (!app.project) {
        alert("No project is open.");
        return;
    }

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("No layers are selected. Please select at least one layer.");
        return;
    }

    app.beginUndoGroup("Precomp Selected Layers Individually");

    var compWidth    = comp.width;
    var compHeight   = comp.height;
    var compPixelAspect = comp.pixelAspect;
    var compFrameRate   = comp.frameRate;
    var compDuration    = comp.duration;

    var layerData = [];
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        layerData.push({
            layer:     layer,
            name:      layer.name,
            index:     layer.index,
            startTime: layer.startTime,
            inPoint:   layer.inPoint,
            outPoint:  layer.outPoint
        });
    }

    for (var j = 0; j < layerData.length; j++) {
        var data  = layerData[j];
        var layer = data.layer;

        for (var k = 0; k < comp.numLayers; k++) {
            comp.layer(k + 1).selected = false;
        }
        layer.selected = true;

        var precompDuration = data.outPoint - data.inPoint;
        if (precompDuration <= 0) {
            precompDuration = compDuration;
        }

        comp.layers.precompose([layer.index], data.name, true);

        var newPrecomp = null;
        for (var p = 1; p <= app.project.numItems; p++) {
            var item = app.project.item(p);
            if (item instanceof CompItem && item.name === data.name && item !== comp) {
                if (newPrecomp === null || item.id > newPrecomp.id) {
                    newPrecomp = item;
                }
            }
        }

        if (newPrecomp !== null && precompDuration > 0) {
            newPrecomp.duration = precompDuration;
        }
    }

    app.endUndoGroup();
    alert("Done!\n" + layerData.length + " layer(s) precomped individually.");

})();
```

### Move_selected_Layer.jsx (Original)

```jsx
(function(thisObj){
    function buildUI(thisObj){
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Move&Opacity", undefined, {resizeable:true});

        // ... resource string builds the UI with:
        // - Position checkbox, direction pad (up/left/right/down radio buttons)
        // - Distance input, Frames input
        // - Displace checkbox
        // - Opacity checkbox, 0-100 / 100-0 radio buttons, Frames input
        // - Apply button

        // Direction state variable
        var posDir = "right";  // "up","down","left","right"
        var opMode = "0-100";  // "0-100" or "100-0"

        // computeOffset handles 2D and 3D positions
        function computeOffset(original, dir, dis, opposite){
            if(!(original instanceof Array)) return original;
            if(original.length === 2){
                var x = original[0], y = original[1];
                if(dir === "left")  x = opposite ? x + dis : x - dis;
                if(dir === "right") x = opposite ? x - dis : x + dis;
                if(dir === "up")    y = opposite ? y + dis : y - dis;
                if(dir === "down")  y = opposite ? y - dis : y + dis;
                return [x,y];
            } else if(original.length === 3){
                var x3 = original[0], y3 = original[1], z3 = original[2];
                if(dir === "left")  x3 = opposite ? x3 + dis : x3 - dis;
                if(dir === "right") x3 = opposite ? x3 - dis : x3 + dis;
                if(dir === "up")    y3 = opposite ? y3 + dis : y3 - dis;
                if(dir === "down")  y3 = opposite ? y3 - dis : y3 + dis;
                return [x3,y3,z3];
            }
            return original;
        }

        function applyAction(){
            var comp = app.project.activeItem;
            if(!(comp && comp instanceof CompItem)){ alert("No active composition."); return; }
            var sel = comp.selectedLayers;
            if(!sel || sel.length === 0){ alert("No layers selected."); return; }

            var makePos = !!positionToggle.value;
            var displaceFirst = !!displaceToggle.value;

            // ... validation ...

            var t = comp.time;
            var endTimePos = makePos ? t + (frs / comp.frameRate) : null;
            var endTimeOp = makeOp ? t + (opFrs / comp.frameRate) : null;

            app.beginUndoGroup("Move&Opacity");

            for(var i=0; i<sel.length; i++){
                var layer = sel[i];

                // POSITION
                if(makePos){
                    var posProp = layer.property("ADBE Transform Group").property("ADBE Position");
                    var original = posProp.valueAtTime(t, false); // fallback: posProp.value

                    if(displaceFirst){
                        // Displace checked: start displaced, end at original
                        var displaced = computeOffset(original, posDir, dis, true);
                        posProp.setValueAtTime(t, displaced);
                        posProp.setValueAtTime(endTimePos, original);
                    } else {
                        // Displace unchecked: start at original, end moved
                        var moved = computeOffset(original, posDir, dis, false);
                        posProp.setValueAtTime(t, original);
                        posProp.setValueAtTime(endTimePos, moved);
                    }

                    // NEW: Apply ease if checkbox is checked
                    // Bezier (1.00, 0.00, 0.00, 1.00) = KeyframeEase(0, 100) on both keyframes
                    if(easeToggle.value){
                        var startIdx = posProp.nearestKeyIndex(t);
                        var endIdx = posProp.nearestKeyIndex(endTimePos);
                        var easeObj = new KeyframeEase(0, 100);
                        var dims = posProp.value.length;
                        var easeArr = [];
                        for(var d = 0; d < dims; d++) easeArr.push(easeObj);
                        posProp.setTemporalEaseAtKey(startIdx, easeArr, easeArr);
                        posProp.setTemporalEaseAtKey(endIdx, easeArr, easeArr);
                    }

                    // NEW: Reveal position property in timeline
                    posProp.selected = true;
                }

                // OPACITY
                if(makeOp){
                    var opProp = layer.property("ADBE Transform Group").property("ADBE Opacity");
                    var startOp = (opMode === "0-100") ? 0 : 100;
                    var endOp   = (opMode === "0-100") ? 100 : 0;
                    opProp.setValueAtTime(t, startOp);
                    opProp.setValueAtTime(endTimeOp, endOp);
                }
            }

            app.endUndoGroup();
        }

        // ... button/key handlers ...
    }

    // ... panel show logic ...
})();
```

---

## Summary of New Features (vs originals)

1. **Combined panel**: All three scripts in one panel with a custom-drawn tab bar (not native `tabbedpanel`). Tabs: Assign Null, Precomp, Move.
2. **Custom-drawn UI**: Dark theme, flat design. All buttons, checkboxes, segmented toggles, and the direction pad are drawn via `customButton`/`customView` `onDraw` callbacks using `ScriptUIGraphics`. Hover states on buttons. Accent color for active states and primary action buttons.
3. **Ease checkbox** (Move tab): When checked, applies `KeyframeEase(0, 100)` — equivalent to cubic bezier `(1.00, 0.00, 0.00, 1.00)` — to both the start and end position keyframes. This sets speed=0 and influence=100% on the outgoing ease of the start keyframe and incoming ease of the end keyframe, producing a strong ease-in-out.
4. **Reveal position in timeline** (Move tab): After adding position keyframes, `posProp.selected = true` is called so the Position property expands in the timeline, making keyframes immediately visible and editable.
