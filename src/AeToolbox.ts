/// <reference path="./ae.d.ts" />

// Injected by esbuild banner — captures `this` (Panel or global) at global scope
declare var __panelThis: any;

// ── Color Palette ─────────────────────────────────────────────────────────────

const COLORS = {
    bg:          [0.15, 0.15, 0.15, 1],
    bgLight:     [0.20, 0.20, 0.20, 1],
    bgLighter:   [0.25, 0.25, 0.25, 1],
    border:      [0.30, 0.30, 0.30, 1],
    text:        [0.85, 0.85, 0.85, 1],
    textDim:     [0.50, 0.50, 0.50, 1],
    accent:      [0.30, 0.60, 1.00, 1],
    accentHover: [0.40, 0.68, 1.00, 1],
    white:       [1.00, 1.00, 1.00, 1],
    checkmark:   [0.30, 0.60, 1.00, 1],
    transparent: [0, 0, 0, 0],
};

// ── Layout Constants ──────────────────────────────────────────────────────────

const PANEL_MARGINS    = 12;
const SECTION_SPACING  = 10;
const CONTROL_SPACING  = 6;
const BUTTON_HEIGHT    = 28;
const INPUT_HEIGHT     = 22;
const TAB_HEIGHT       = 28;

// ── Drawing Helpers ───────────────────────────────────────────────────────────

function drawRoundedRect(g: any, brush: any, width: number, height: number, radius: number, x: number, y: number): void {
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
    g.newPath();
    g.rectPath(x + radius / 2, y, width - x * 2 - radius, height - y * 2);
    g.fillPath(brush);
    g.newPath();
    g.rectPath(x, y + radius / 2, width - x * 2, height - y * 2 - radius);
    g.fillPath(brush);
}

// ── Custom Controls ───────────────────────────────────────────────────────────

function CustomButton(parent: any, text: string, options?: { width?: number; height?: number; isAccent?: boolean }): any {
    const opts = options || {};
    const btn: any = parent.add("customButton", undefined, "");
    btn.preferredSize = [opts.width || -1, opts.height || BUTTON_HEIGHT];
    btn.text = text;
    btn._isAccent = opts.isAccent || false;

    function redraw(hover: boolean): void {
        const g = btn.graphics;
        const fillColor = btn._isAccent
            ? (hover ? COLORS.accentHover : COLORS.accent)
            : (hover ? COLORS.bgLighter : COLORS.bgLight);
        const textColor = btn._isAccent ? COLORS.white : COLORS.text;
        const fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, fillColor);
        const textPen   = g.newPen(g.PenType.SOLID_COLOR, textColor, 1);

        btn.onDraw = function(this: any): void {
            const sz = this.size;
            const ts = g.measureString(btn.text);
            drawRoundedRect(g, fillBrush, sz.width, sz.height, 4, 0, 0);
            g.drawString(btn.text, textPen,
                (sz.width  - ts.width)  / 2,
                (sz.height - ts.height) / 2);
        };
    }

    redraw(false);
    btn.addEventListener("mouseover", function() { redraw(true);  btn.notify("onDraw"); });
    btn.addEventListener("mouseout",  function() { redraw(false); btn.notify("onDraw"); });
    return btn;
}

function CustomCheckbox(parent: any, text: string, defaultValue?: boolean): any {
    const grp: any = parent.add("group");
    grp.orientation = "row";
    grp.spacing = 6;
    grp.alignment = ["left", "center"];

    const box: any = grp.add("customButton", undefined, "");
    box.preferredSize = [16, 16];
    box._checked = defaultValue || false;

    const lbl: any = grp.add("statictext", undefined, text);
    lbl.graphics.foregroundColor = lbl.graphics.newPen(lbl.graphics.PenType.SOLID_COLOR, COLORS.text, 1);

    function redraw(): void {
        const g = box.graphics;
        const bgBrush   = g.newBrush(g.BrushType.SOLID_COLOR, box._checked ? COLORS.checkmark : COLORS.bgLight);
        const checkPen  = g.newPen(g.PenType.SOLID_COLOR, COLORS.white, 2);

        box.onDraw = function(this: any): void {
            const sz = this.size;
            drawRoundedRect(g, bgBrush, sz.width, sz.height, 3, 0, 0);
            if (box._checked) {
                g.newPath();
                g.moveTo(3, 8);
                g.lineTo(6, 12);
                g.lineTo(13, 3);
                g.strokePath(checkPen);
            }
        };
    }

    function toggle(): void {
        box._checked = !box._checked;
        redraw();
        box.notify("onDraw");
        if (grp.onValueChange) grp.onValueChange();
    }

    box.addEventListener("click", toggle);
    lbl.addEventListener("click", toggle);
    redraw();

    grp.getValue = function(): boolean { return box._checked; };
    grp.setValue = function(v: boolean): void { box._checked = v; redraw(); box.notify("onDraw"); };
    grp._box = box;
    return grp;
}

function SegmentedToggle(parent: any, labels: string[], defaultIndex?: number): any {
    const grp: any = parent.add("group");
    grp.orientation = "row";
    grp.spacing = 0;
    grp._selectedIndex = defaultIndex || 0;
    grp._buttons = [];

    for (let i = 0; i < labels.length; i++) {
        (function(idx: number): void {
            const seg: any = grp.add("customButton", undefined, "");
            const labelLen = labels[idx].length;
            seg.preferredSize = [labelLen > 6 ? 80 : 60, 24];
            seg.text = labels[idx];

            function redraw(): void {
                const g = seg.graphics;
                const isActive = (grp._selectedIndex === idx);
                const fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, isActive ? COLORS.accent : COLORS.bgLight);
                const textPen   = g.newPen(g.PenType.SOLID_COLOR, isActive ? COLORS.white : COLORS.textDim, 1);

                seg.onDraw = function(this: any): void {
                    const sz = this.size;
                    const ts = g.measureString(seg.text);
                    drawRoundedRect(g, fillBrush, sz.width, sz.height, 4, 0, 0);
                    g.drawString(seg.text, textPen,
                        (sz.width  - ts.width)  / 2,
                        (sz.height - ts.height) / 2);
                };
            }

            seg.addEventListener("click", function(): void {
                grp._selectedIndex = idx;
                for (let j = 0; j < grp._buttons.length; j++) {
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

    grp.getValue = function(): number { return grp._selectedIndex; };
    grp.setValue = function(idx: number): void {
        grp._selectedIndex = idx;
        for (let j = 0; j < grp._buttons.length; j++) {
            grp._buttons[j]._redraw();
            grp._buttons[j].notify("onDraw");
        }
    };
    return grp;
}

function SectionLabel(parent: any, text: string): any {
    const lbl: any = parent.add("statictext", undefined, text);
    lbl.graphics.font = ScriptUI.newFont("dialog", "BOLD", 10);
    lbl.graphics.foregroundColor = lbl.graphics.newPen(lbl.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);
    return lbl;
}

function Separator(parent: any): any {
    const sep: any = parent.add("customView", undefined, "");
    sep.preferredSize = [-1, 1];
    sep.onDraw = function(this: any): void {
        const g = this.graphics;
        const pen = g.newPen(g.PenType.SOLID_COLOR, COLORS.border, 1);
        g.newPath();
        g.moveTo(0, 0);
        g.lineTo(this.size.width, 0);
        g.strokePath(pen);
    };
    return sep;
}

function DirectionPad(parent: any): any {
    const container: any = parent.add("group");
    container.orientation = "column";
    container.spacing = 2;
    container.alignment = ["center", "center"];

    const directions = ["up", "left", "right", "down"] as const;
    type Direction = typeof directions[number];
    const arrows: { [key in Direction]: string } = {
        up:    "\u25B2",
        down:  "\u25BC",
        left:  "\u25C4",
        right: "\u25BA",
    };

    let activeDir: Direction = "right";
    const btns: { [key in Direction]?: any } = {};

    function makeArrowBtn(rowParent: any, dir: Direction): any {
        const btn: any = rowParent.add("customButton", undefined, "");
        btn.preferredSize = [28, 22];

        function redraw(): void {
            const g = btn.graphics;
            const isActive = (activeDir === dir);
            const fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, isActive ? COLORS.accent : COLORS.bgLight);
            const arrowPen  = g.newPen(g.PenType.SOLID_COLOR, isActive ? COLORS.white : COLORS.textDim, 1);

            btn.onDraw = function(this: any): void {
                const sz = this.size;
                const label = arrows[dir];
                const ts = g.measureString(label);
                drawRoundedRect(g, fillBrush, sz.width, sz.height, 3, 0, 0);
                g.drawString(label, arrowPen,
                    (sz.width  - ts.width)  / 2,
                    (sz.height - ts.height) / 2);
            };
        }

        btn.addEventListener("click", function(): void {
            activeDir = dir;
            for (const d of directions) {
                if (btns[d]) {
                    btns[d]._redraw();
                    btns[d].notify("onDraw");
                }
            }
            if (container.onChange) container.onChange();
        });

        btn._redraw = redraw;
        redraw();
        btns[dir] = btn;
        return btn;
    }

    // Row 1: up
    const row1: any = container.add("group");
    row1.orientation = "row";
    row1.alignment = ["center", "center"];
    makeArrowBtn(row1, "up");

    // Row 2: left + right
    const row2: any = container.add("group");
    row2.orientation = "row";
    row2.spacing = 4;
    row2.alignment = ["center", "center"];
    makeArrowBtn(row2, "left");
    makeArrowBtn(row2, "right");

    // Row 3: down
    const row3: any = container.add("group");
    row3.orientation = "row";
    row3.alignment = ["center", "center"];
    makeArrowBtn(row3, "down");

    container.getValue = function(): Direction { return activeDir; };
    container.setValue = function(dir: Direction): void {
        activeDir = dir;
        for (const d of directions) {
            if (btns[d]) {
                btns[d]._redraw();
                btns[d].notify("onDraw");
            }
        }
    };

    return container;
}

function StyledInput(parent: any, defaultText: string, width: number): any {
    const input: any = parent.add("edittext", undefined, defaultText);
    input.preferredSize = [width, INPUT_HEIGHT];
    input.graphics.backgroundColor = input.graphics.newBrush(
        input.graphics.BrushType.SOLID_COLOR, COLORS.bgLight);
    input.graphics.foregroundColor = input.graphics.newPen(
        input.graphics.PenType.SOLID_COLOR, COLORS.text, 1);
    return input;
}

// ── Tab 1 Logic: Assign Null ──────────────────────────────────────────────────

function hasNullParent(layer: Layer): boolean {
    return layer.parent !== null && (layer.parent as AVLayer).nullLayer === true;
}

function isNull(layer: Layer): boolean {
    return (layer as AVLayer).nullLayer === true;
}

function findNullByName(comp: CompItem, name: string): AVLayer | null {
    for (let i = 1; i <= comp.numLayers; i++) {
        const l = comp.layer(i) as AVLayer;
        if (l.nullLayer && l.name === name) return l;
    }
    return null;
}

function averagePosition(layers: Layer[]): number[] {
    let sumX = 0, sumY = 0;
    for (let i = 0; i < layers.length; i++) {
        const p = (layers[i] as AVLayer).transform.position.value as number[];
        sumX += p[0];
        sumY += p[1];
    }
    return [sumX / layers.length, sumY / layers.length];
}

function earliestIn(layers: Layer[]): number {
    let t = layers[0].inPoint;
    for (let i = 1; i < layers.length; i++) {
        if (layers[i].inPoint < t) t = layers[i].inPoint;
    }
    return t;
}

function latestOut(layers: Layer[]): number {
    let t = layers[0].outPoint;
    for (let i = 1; i < layers.length; i++) {
        if (layers[i].outPoint > t) t = layers[i].outPoint;
    }
    return t;
}

function any3D(layers: Layer[]): boolean {
    for (let i = 0; i < layers.length; i++) {
        if ((layers[i] as AVLayer).threeDLayer) return true;
    }
    return false;
}

function makeNull(comp: CompItem, name: string, pos: number[], inPt: number, outPt: number, threeD: boolean): AVLayer {
    const n = comp.layers.addNull() as AVLayer;
    n.name        = name;
    n.inPoint     = inPt;
    n.outPoint    = outPt;
    n.threeDLayer = threeD;
    (n.transform.position as Property).setValue(pos);
    return n;
}

function runIndividual(comp: CompItem, layers: Layer[], skipNullLayers: boolean): { created: number; skipped: number } {
    let created = 0, skipped = 0;
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (skipNullLayers && isNull(layer)) { skipped++; continue; }
        if (hasNullParent(layer))            { skipped++; continue; }

        const name = layer.name + "_Null";
        let n = findNullByName(comp, name);
        if (!n) {
            const pos = (layer as AVLayer).transform.position.value as number[];
            n = makeNull(comp, name, pos, layer.inPoint, layer.outPoint, (layer as AVLayer).threeDLayer);
            n.moveAfter(layer);
            created++;
        }
        layer.parent = n;
    }
    return { created, skipped };
}

function runShared(comp: CompItem, layers: Layer[], nullName: string, skipNullLayers: boolean): { created: number; skipped: number } {
    const actionable: Layer[] = [];
    let skipped = 0;
    for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        if (skipNullLayers && isNull(l)) { skipped++; continue; }
        if (hasNullParent(l))            { skipped++; continue; }
        actionable.push(l);
    }
    if (actionable.length === 0) return { created: 0, skipped };

    let n = findNullByName(comp, nullName);
    let created = 0;
    if (!n) {
        const pos    = averagePosition(actionable);
        const inPt   = earliestIn(actionable);
        const outPt  = latestOut(actionable);
        const threeD = any3D(actionable);
        n = makeNull(comp, nullName, pos, inPt, outPt, threeD);
        let topLayer = actionable[0];
        for (let j = 1; j < actionable.length; j++) {
            if (actionable[j].index < topLayer.index) topLayer = actionable[j];
        }
        n.moveBefore(topLayer);
        created = 1;
    }
    for (let k = 0; k < actionable.length; k++) {
        actionable[k].parent = n;
    }
    return { created, skipped };
}

// ── Tab 2 Logic: Precomp ──────────────────────────────────────────────────────

function runPrecomp(comp: CompItem): void {
    const selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("No layers are selected. Please select at least one layer.");
        return;
    }

    app.beginUndoGroup("Precomp Selected Layers Individually");

    const compDuration = comp.duration;
    const layerData: Array<{ layer: Layer; name: string; index: number; inPoint: number; outPoint: number }> = [];
    for (let i = 0; i < selectedLayers.length; i++) {
        const layer = selectedLayers[i];
        layerData.push({
            layer,
            name:     layer.name,
            index:    layer.index,
            inPoint:  layer.inPoint,
            outPoint: layer.outPoint,
        });
    }

    for (let j = 0; j < layerData.length; j++) {
        const data  = layerData[j];
        const layer = data.layer;

        for (let k = 0; k < comp.numLayers; k++) {
            comp.layer(k + 1).selected = false;
        }
        layer.selected = true;

        let precompDuration = data.outPoint - data.inPoint;
        if (precompDuration <= 0) precompDuration = compDuration;

        comp.layers.precompose([layer.index], data.name, true);

        let newPrecomp: CompItem | null = null;
        for (let p = 1; p <= app.project.numItems; p++) {
            const item = app.project.item(p);
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
}

// ── Tab 3 Logic: Move & Opacity ───────────────────────────────────────────────

type Direction = "up" | "down" | "left" | "right";

function computeOffset(original: number[], dir: Direction, dis: number, opposite: boolean): number[] {
    if (original.length >= 2) {
        const result = original.slice();
        if (dir === "left")  result[0] = opposite ? result[0] + dis : result[0] - dis;
        if (dir === "right") result[0] = opposite ? result[0] - dis : result[0] + dis;
        if (dir === "up")    result[1] = opposite ? result[1] + dis : result[1] - dis;
        if (dir === "down")  result[1] = opposite ? result[1] - dis : result[1] + dis;
        return result;
    }
    return original;
}

interface MoveOpOptions {
    makePos:       boolean;
    posDir:        Direction;
    dis:           number;
    frs:           number;
    displaceFirst: boolean;
    applyEase:     boolean;
    makeOp:        boolean;
    opMode:        string;
    opFrs:         number;
}

function applyMoveOp(opts: MoveOpOptions): void {
    const comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("No active composition."); return; }
    const sel = comp.selectedLayers;
    if (!sel || sel.length === 0)   { alert("No layers selected."); return; }

    const t = comp.time;

    app.beginUndoGroup("Move&Opacity");

    for (let i = 0; i < sel.length; i++) {
        const layer = sel[i];

        // Position
        if (opts.makePos) {
            const endTimePos = t + (opts.frs / comp.frameRate);
            const posProp = (layer.property("ADBE Transform Group") as PropertyGroup)
                .property("ADBE Position") as Property;
            let original: number[];
            try { original = posProp.valueAtTime(t, false) as unknown as number[]; }
            catch (e) { original = posProp.value as unknown as number[]; }

            if (opts.displaceFirst) {
                const displaced = computeOffset(original, opts.posDir, opts.dis, true);
                posProp.setValueAtTime(t, displaced as any);
                posProp.setValueAtTime(endTimePos, original as any);
            } else {
                const moved = computeOffset(original, opts.posDir, opts.dis, false);
                posProp.setValueAtTime(t, original as any);
                posProp.setValueAtTime(endTimePos, moved as any);
            }

            if (opts.applyEase) {
                const startIdx = posProp.nearestKeyIndex(t);
                const endIdx   = posProp.nearestKeyIndex(endTimePos);
                const easeObj  = new KeyframeEase(0, 100);
                const dims     = (posProp.value as unknown as number[]).length;
                const easeArr: any[] = [];
                for (let d = 0; d < dims; d++) easeArr.push(easeObj);
                posProp.setTemporalEaseAtKey(startIdx, easeArr as any, easeArr as any);
                posProp.setTemporalEaseAtKey(endIdx,   easeArr as any, easeArr as any);
            }

            posProp.selected = true;
        }

        // Opacity
        if (opts.makeOp) {
            const endTimeOp = t + (opts.opFrs / comp.frameRate);
            const opProp = (layer.property("ADBE Transform Group") as PropertyGroup)
                .property("ADBE Opacity") as Property;
            const startOp = opts.opMode === "0\u21920" ? 100 : 0;
            const endOp   = opts.opMode === "0\u21920" ? 0   : 100;
            opProp.setValueAtTime(t, startOp as any);
            opProp.setValueAtTime(endTimeOp, endOp as any);
        }
    }

    app.endUndoGroup();
}

// ── Build UI ──────────────────────────────────────────────────────────────────

function buildUI(thisObj: any): void {
    const win: any = (thisObj instanceof Panel)
        ? thisObj
        : new Window("palette", "AE Toolbox", undefined, { resizeable: true });

    win.orientation    = "column";
    win.alignChildren  = ["fill", "top"];
    win.margins        = PANEL_MARGINS;
    win.spacing        = 0;

    const wg = win.graphics;
    wg.backgroundColor = wg.newBrush(wg.BrushType.SOLID_COLOR, COLORS.bg);

    // ── Tab Bar ────────────────────────────────────────────

    const tabBar: any = win.add("group");
    tabBar.orientation   = "row";
    tabBar.alignment     = ["fill", "top"];
    tabBar.spacing       = 0;
    tabBar.margins       = [0, 0, 0, 0];

    const tabNames = ["Assign Null", "Precomp", "Move"];
    const tabBtns: any[]      = [];
    const tabContents: any[]  = [];
    let activeTab = 0;

    // ── Content Stack ──────────────────────────────────────

    const contentGrp: any = win.add("group");
    contentGrp.orientation   = "stack";
    contentGrp.alignment     = ["fill", "fill"];
    contentGrp.alignChildren = ["fill", "top"];

    // ══════════════════════════════════════════════════════
    // Tab 1: Assign Null
    // ══════════════════════════════════════════════════════

    const tab1: any = contentGrp.add("group");
    tab1.orientation   = "column";
    tab1.alignChildren = ["fill", "top"];
    tab1.spacing       = SECTION_SPACING;
    tab1.margins       = [0, SECTION_SPACING, 0, 0];
    tabContents.push(tab1);

    // Mode
    SectionLabel(tab1, "MODE");
    const modeToggle: any = SegmentedToggle(tab1, ["Individual", "Shared"], 0);

    // Shared null name
    const nullNameRow: any = tab1.add("group");
    nullNameRow.orientation   = "row";
    nullNameRow.alignChildren = ["left", "center"];
    nullNameRow.spacing       = CONTROL_SPACING;
    const nullNameLabel: any = nullNameRow.add("statictext", undefined, "Name:");
    nullNameLabel.graphics.foregroundColor = nullNameLabel.graphics.newPen(
        nullNameLabel.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);
    const nullNameInput: any = StyledInput(nullNameRow, "Group_Null", 120);
    nullNameInput.enabled = false;

    // Options
    SectionLabel(tab1, "OPTIONS");
    const skipNullCb: any = CustomCheckbox(tab1, "Skip null layers", true);
    skipNullCb.helpTip = "When checked, null layers in the selection are left alone.";

    // Description
    const descText: any = tab1.add("statictext", undefined, "Each layer gets its own null\nmatched to its position.", { multiline: true });
    descText.graphics.foregroundColor = descText.graphics.newPen(
        descText.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);

    Separator(tab1);

    // Run button
    const assignBtn: any = CustomButton(tab1, "Assign Null", { isAccent: true });
    assignBtn.helpTip = "Parent selected layers to null objects.";

    // Mode toggle logic
    modeToggle.onChange = function(): void {
        const isShared = modeToggle.getValue() === 1;
        nullNameInput.enabled = isShared;
        descText.text = isShared
            ? "All selected layers share one null\npositioned at their average centre."
            : "Each layer gets its own null\nmatched to its position.";
    };

    // Run logic
    assignBtn.addEventListener("click", function(): void {
        if (!app.project) { alert("No project is open."); return; }
        const comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition first."); return; }
        const selected = comp.selectedLayers;
        if (selected.length === 0) { alert("No layers selected."); return; }

        const layers: Layer[] = [];
        for (let i = 0; i < selected.length; i++) layers.push(selected[i]);

        app.beginUndoGroup("Assign Null to Selected Layers");
        const skipNulls = skipNullCb.getValue();
        let result: { created: number; skipped: number };

        if (modeToggle.getValue() === 0) {
            result = runIndividual(comp, layers, skipNulls);
        } else {
            const name = (nullNameInput.text || "Group_Null").replace(/^\s+|\s+$/g, "");
            result = runShared(comp, layers, name || "Group_Null", skipNulls);
        }
        app.endUndoGroup();

        let msg = "Done!\n\nNulls created : " + result.created + "\nLayers skipped: " + result.skipped;
        if (result.skipped > 0) msg += "\n\n(Skipped layers already had a null parent or were null layers.)";
        alert(msg);
    });

    // ══════════════════════════════════════════════════════
    // Tab 2: Precomp
    // ══════════════════════════════════════════════════════

    const tab2: any = contentGrp.add("group");
    tab2.orientation   = "column";
    tab2.alignChildren = ["fill", "top"];
    tab2.spacing       = SECTION_SPACING;
    tab2.margins       = [0, SECTION_SPACING, 0, 0];
    tab2.visible       = false;
    tabContents.push(tab2);

    const precompDesc: any = tab2.add("statictext", undefined,
        "Precomps each selected layer into its own individual composition, using the layer name as the precomp name.",
        { multiline: true });
    precompDesc.graphics.foregroundColor = precompDesc.graphics.newPen(
        precompDesc.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);

    Separator(tab2);

    const precompBtn: any = CustomButton(tab2, "Precomp Individually", { isAccent: true });
    precompBtn.helpTip = "Precomp each selected layer into its own composition.";

    precompBtn.addEventListener("click", function(): void {
        if (!app.project) { alert("No project is open."); return; }
        const comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition first."); return; }
        runPrecomp(comp);
    });

    // ══════════════════════════════════════════════════════
    // Tab 3: Move & Opacity
    // ══════════════════════════════════════════════════════

    const tab3: any = contentGrp.add("group");
    tab3.orientation   = "column";
    tab3.alignChildren = ["fill", "top"];
    tab3.spacing       = SECTION_SPACING;
    tab3.margins       = [0, SECTION_SPACING, 0, 0];
    tab3.visible       = false;
    tabContents.push(tab3);

    // Position section
    const posCb: any = CustomCheckbox(tab3, "Position", true);
    posCb.helpTip = "Enable position keyframing.";

    const posControls: any = tab3.add("group");
    posControls.orientation   = "column";
    posControls.alignChildren = ["fill", "top"];
    posControls.spacing       = CONTROL_SPACING;

    const dirPad: any = DirectionPad(posControls);
    dirPad.alignment = ["center", "top"];

    const distRow: any = posControls.add("group");
    distRow.orientation   = "row";
    distRow.alignChildren = ["left", "center"];
    distRow.spacing       = CONTROL_SPACING;
    const distLabel: any = distRow.add("statictext", undefined, "Distance:");
    distLabel.graphics.foregroundColor = distLabel.graphics.newPen(
        distLabel.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);
    const distInput: any = StyledInput(distRow, "50", 55);
    distInput.helpTip = "Pixels to move the layer.";

    const frsRow: any = posControls.add("group");
    frsRow.orientation   = "row";
    frsRow.alignChildren = ["left", "center"];
    frsRow.spacing       = CONTROL_SPACING;
    const frsLabel: any = frsRow.add("statictext", undefined, "Frames:  ");
    frsLabel.graphics.foregroundColor = frsLabel.graphics.newPen(
        frsLabel.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);
    const frsInput: any = StyledInput(frsRow, "10", 55);
    frsInput.helpTip = "Duration of the position animation in frames.";

    const displaceCb: any = CustomCheckbox(posControls, "Displace (start offset, animate to position)", true);
    displaceCb.helpTip = "Checked: layer starts displaced and animates to its current position. Unchecked: layer starts at its current position and animates away.";

    const easeCb: any = CustomCheckbox(posControls, "Ease (1, 0, 0, 1)", false);
    easeCb.helpTip = "Apply strong ease-in-out (cubic bezier 1,0,0,1) to position keyframes.";

    // Opacity section
    Separator(tab3);

    const opCb: any = CustomCheckbox(tab3, "Opacity", false);
    opCb.helpTip = "Enable opacity keyframing.";

    const opControls: any = tab3.add("group");
    opControls.orientation   = "column";
    opControls.alignChildren = ["fill", "top"];
    opControls.spacing       = CONTROL_SPACING;
    opControls.enabled       = false;

    const opModeRow: any = opControls.add("group");
    opModeRow.orientation   = "row";
    opModeRow.alignChildren = ["left", "center"];
    opModeRow.spacing       = CONTROL_SPACING;
    const opModeLabel: any = opModeRow.add("statictext", undefined, "Mode:");
    opModeLabel.graphics.foregroundColor = opModeLabel.graphics.newPen(
        opModeLabel.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);
    const opModeToggle: any = SegmentedToggle(opModeRow, ["0\u2192100", "100\u21920"], 0);

    const opFrsRow: any = opControls.add("group");
    opFrsRow.orientation   = "row";
    opFrsRow.alignChildren = ["left", "center"];
    opFrsRow.spacing       = CONTROL_SPACING;
    const opFrsLabel: any = opFrsRow.add("statictext", undefined, "Frames:  ");
    opFrsLabel.graphics.foregroundColor = opFrsLabel.graphics.newPen(
        opFrsLabel.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);
    const opFrsInput: any = StyledInput(opFrsRow, "10", 55);

    Separator(tab3);

    const applyBtn: any = CustomButton(tab3, "Apply", { isAccent: true });
    applyBtn.helpTip = "Apply position and/or opacity keyframes to selected layers.";

    // Enable/disable logic
    posCb.onValueChange = function(): void {
        posControls.enabled = posCb.getValue();
    };
    opCb.onValueChange = function(): void {
        opControls.enabled = opCb.getValue();
    };

    // Apply logic
    function doApply(): void {
        const makePos = posCb.getValue();
        const makeOp  = opCb.getValue();

        if (!makePos && !makeOp) { alert("Enable at least one of Position or Opacity."); return; }

        let dis = 0, frs = 0, opFrs = 0;

        if (makePos) {
            dis = parseFloat(distInput.text);
            frs = parseInt(frsInput.text, 10);
            if (isNaN(dis))   { alert("Distance must be a valid number."); return; }
            if (isNaN(frs) || frs < 0) { alert("Frames must be a non-negative integer."); return; }
        }
        if (makeOp) {
            opFrs = parseInt(opFrsInput.text, 10);
            if (isNaN(opFrs) || opFrs < 0) { alert("Opacity frames must be a non-negative integer."); return; }
        }

        applyMoveOp({
            makePos,
            posDir:        dirPad.getValue() as Direction,
            dis,
            frs,
            displaceFirst: displaceCb.getValue(),
            applyEase:     easeCb.getValue(),
            makeOp,
            opMode:        opModeToggle.getValue() === 1 ? "0\u21920" : "0\u2192100",
            opFrs,
        });
    }

    applyBtn.addEventListener("click", doApply);
    win.addEventListener("keydown", function(e: any): void {
        if (e.keyName === "Enter") doApply();
    });

    // ── Custom Tab Bar Drawing & Switching ─────────────────

    function switchTab(index: number): void {
        activeTab = index;
        for (let i = 0; i < tabContents.length; i++) {
            tabContents[i].visible = (i === index);
        }
        for (let j = 0; j < tabBtns.length; j++) {
            tabBtns[j]._redraw();
            tabBtns[j].notify("onDraw");
        }
    }

    for (let i = 0; i < tabNames.length; i++) {
        (function(idx: number): void {
            const tb: any = tabBar.add("customButton", undefined, "");
            tb.preferredSize = [-1, TAB_HEIGHT];
            tb.text = tabNames[idx];

            function redraw(): void {
                const g = tb.graphics;
                const isActive = (activeTab === idx);
                const fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, isActive ? COLORS.bgLighter : COLORS.bg);
                const textPen   = g.newPen(g.PenType.SOLID_COLOR, isActive ? COLORS.text : COLORS.textDim, 1);
                const accentPen = g.newPen(g.PenType.SOLID_COLOR, COLORS.accent, 2);

                tb.onDraw = function(this: any): void {
                    const sz = this.size;
                    const ts = g.measureString(tb.text);
                    drawRoundedRect(g, fillBrush, sz.width, sz.height, 0, 0, 0);
                    g.drawString(tb.text, textPen,
                        (sz.width  - ts.width)  / 2,
                        (sz.height - ts.height) / 2);
                    if (isActive) {
                        g.newPath();
                        g.moveTo(0, sz.height - 2);
                        g.lineTo(sz.width, sz.height - 2);
                        g.strokePath(accentPen);
                    }
                };
            }

            tb.addEventListener("click", function(): void { switchTab(idx); });
            tb._redraw = redraw;
            redraw();
            tabBtns.push(tb);
        })(i);
    }

    // ── Resize handlers ────────────────────────────────────

    win.onResizing = win.onResize = function(): void {
        win.layout.resize();
    };

    // ── Show ───────────────────────────────────────────────

    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }
}

buildUI(__panelThis);
