/// <reference path="./ae.d.ts" />

declare var __panelThis: any;

// ─────────────────────────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────────────────────────

var C = {
    bg:      [0.149, 0.149, 0.149, 1],
    card:    [0.196, 0.196, 0.196, 1],
    border:  [0.275, 0.275, 0.275, 1],
    text:    [0.867, 0.867, 0.867, 1],
    dim:     [0.467, 0.467, 0.467, 1],
    accent:  [0.302, 0.600, 1.000, 1],
    btnBg:   [0.918, 0.918, 0.902, 1],
    btnText: [0.118, 0.118, 0.118, 1],
    segOn:   [0.918, 0.918, 0.902, 1],
    white:   [1.000, 1.000, 1.000, 1],
    check:   [0.302, 0.600, 1.000, 1],
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────────────

var PAD     = 12;
var GAP     = 8;
var SGAP    = 6;
var BTN_H   = 32;
var TAB_H   = 32;
var SEG_H   = 32;
var INPUT_H = 26;

// ─────────────────────────────────────────────────────────────────────────────
// Drawing helpers
// ─────────────────────────────────────────────────────────────────────────────

function drawRoundRect(g: any, brush: any, w: number, h: number, r: number): void {
    var d = r * 2;
    g.newPath(); g.ellipsePath(0,     0,     d, d); g.fillPath(brush);
    g.newPath(); g.ellipsePath(w - d, 0,     d, d); g.fillPath(brush);
    g.newPath(); g.ellipsePath(w - d, h - d, d, d); g.fillPath(brush);
    g.newPath(); g.ellipsePath(0,     h - d, d, d); g.fillPath(brush);
    g.newPath(); g.rectPath(r, 0,     w - d, h);     g.fillPath(brush);
    g.newPath(); g.rectPath(0, r,     w,     h - d); g.fillPath(brush);
}

// ─────────────────────────────────────────────────────────────────────────────
// Controls
// ─────────────────────────────────────────────────────────────────────────────

function PanelHeader(parent: any): void {
    var hdr: any = parent.add("customView", undefined, "");
    hdr.preferredSize = [-1, 28];
    hdr.onDraw = function(this: any): void {
        var g = this.graphics;
        var sz = this.size;
        // background
        var bgBrush = g.newBrush(g.BrushType.SOLID_COLOR, C.bg);
        g.newPath(); g.rectPath(0, 0, sz.width, sz.height); g.fillPath(bgBrush);
        // blue dot
        var dotBrush = g.newBrush(g.BrushType.SOLID_COLOR, C.accent);
        g.newPath(); g.ellipsePath(0, (sz.height - 8) / 2, 8, 8); g.fillPath(dotBrush);
        // title
        var font = ScriptUI.newFont("dialog", "BOLD", 10);
        var textPen = g.newPen(g.PenType.SOLID_COLOR, C.dim, 1);
        var ts = g.measureString("AE TOOLBOX", font);
        g.drawString("AE TOOLBOX", textPen, 14, (sz.height - ts.height) / 2, font);
    };
}

function SectionLabel(parent: any, text: string): void {
    var lbl: any = parent.add("statictext", undefined, text);
    lbl.graphics.font = ScriptUI.newFont("dialog", "BOLD", 9);
    lbl.graphics.foregroundColor = lbl.graphics.newPen(
        lbl.graphics.PenType.SOLID_COLOR, C.dim, 1);
}

function Separator(parent: any): void {
    var sep: any = parent.add("customView", undefined, "");
    sep.preferredSize = [-1, 1];
    sep.onDraw = function(this: any): void {
        var g = this.graphics;
        var pen = g.newPen(g.PenType.SOLID_COLOR, C.border, 1);
        g.newPath();
        g.moveTo(0, 0);
        g.lineTo(this.size.width, 0);
        g.strokePath(pen);
    };
}

// Light-style button (cream bg, dark text)
function CustomButton(parent: any, text: string): any {
    var btn: any = parent.add("customButton", undefined, "");
    btn.preferredSize = [-1, BTN_H];
    btn.text = text;

    function redraw(hover: boolean): void {
        var g = btn.graphics;
        var bgColor = hover ? [0.96, 0.96, 0.95, 1] : C.btnBg;
        var fill = g.newBrush(g.BrushType.SOLID_COLOR, bgColor);
        var pen  = g.newPen(g.PenType.SOLID_COLOR, C.btnText, 1);
        btn.onDraw = function(this: any): void {
            var sz = this.size;
            var ts = g.measureString(btn.text);
            drawRoundRect(g, fill, sz.width, sz.height, 14);
            g.drawString(btn.text, pen,
                (sz.width  - ts.width)  / 2,
                (sz.height - ts.height) / 2);
        };
    }

    redraw(false);
    btn.addEventListener("mouseover", function(): void { redraw(true);  btn.notify("onDraw"); });
    btn.addEventListener("mouseout",  function(): void { redraw(false); btn.notify("onDraw"); });
    return btn;
}

function CustomCheckbox(parent: any, text: string, defaultChecked: boolean): any {
    var grp: any = parent.add("group");
    grp.orientation   = "row";
    grp.spacing       = SGAP;
    grp.alignment     = ["left", "center"];
    grp.alignChildren = ["left", "center"];

    var box: any = grp.add("customButton", undefined, "");
    box.preferredSize = [16, 16];
    box._checked = defaultChecked;

    var lbl: any = grp.add("statictext", undefined, text);
    lbl.graphics.foregroundColor = lbl.graphics.newPen(
        lbl.graphics.PenType.SOLID_COLOR, C.text, 1);

    function redraw(): void {
        var g = box.graphics;
        var bgBrush  = g.newBrush(g.BrushType.SOLID_COLOR, box._checked ? C.check : C.card);
        var checkPen = g.newPen(g.PenType.SOLID_COLOR, C.white, 2);
        box.onDraw = function(this: any): void {
            var sz = this.size;
            drawRoundRect(g, bgBrush, sz.width, sz.height, 3);
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

    box.onClick = toggle;
    lbl.onClick = toggle;
    redraw();

    grp.getValue = function(): boolean { return box._checked; };
    grp.setValue = function(v: boolean): void {
        box._checked = v;
        redraw();
        box.notify("onDraw");
    };
    return grp;
}

// Full-width segmented toggle
function SegmentedToggle(parent: any, labels: string[], defaultIdx: number): any {
    var grp: any = parent.add("group");
    grp.orientation = "row";
    grp.spacing     = 2;
    grp._selected   = defaultIdx;
    grp._btns       = [];

    for (var i = 0; i < labels.length; i++) {
        (function(idx: number): void {
            var seg: any = grp.add("customButton", undefined, "");
            seg.preferredSize = [-1, SEG_H];
            seg.text = labels[idx];

            function redraw(): void {
                var g = seg.graphics;
                var on   = grp._selected === idx;
                var fill = g.newBrush(g.BrushType.SOLID_COLOR, on ? C.segOn : C.card);
                var pen  = g.newPen(g.PenType.SOLID_COLOR, on ? C.btnText : C.dim, 1);
                seg.onDraw = function(this: any): void {
                    var sz = this.size;
                    var ts = g.measureString(seg.text);
                    drawRoundRect(g, fill, sz.width, sz.height, 6);
                    g.drawString(seg.text, pen,
                        (sz.width  - ts.width)  / 2,
                        (sz.height - ts.height) / 2);
                };
            }

            seg.onClick = function(): void {
                grp._selected = idx;
                for (var j = 0; j < grp._btns.length; j++) {
                    grp._btns[j]._redraw();
                    grp._btns[j].notify("onDraw");
                }
                if (grp.onChange) grp.onChange();
            };

            seg._redraw = redraw;
            redraw();
            grp._btns.push(seg);
        })(i);
    }

    grp.getValue = function(): number { return grp._selected; };
    grp.setValue = function(idx: number): void {
        grp._selected = idx;
        for (var j = 0; j < grp._btns.length; j++) {
            grp._btns[j]._redraw();
            grp._btns[j].notify("onDraw");
        }
    };
    return grp;
}

// Description text inside a slightly lighter card
function DescCard(parent: any, text: string): any {
    var card: any = parent.add("group");
    card.orientation   = "column";
    card.alignChildren = ["fill", "top"];
    card.margins       = [8, 8, 8, 8];
    card.spacing       = 0;
    card.graphics.backgroundColor = card.graphics.newBrush(
        card.graphics.BrushType.SOLID_COLOR, C.card);
    var txt: any = card.add("statictext", undefined, text, { multiline: true });
    txt.graphics.foregroundColor = txt.graphics.newPen(
        txt.graphics.PenType.SOLID_COLOR, C.dim, 1);
    return txt;
}

function StyledInput(parent: any, defaultText: string, w: number): any {
    var inp: any = parent.add("edittext", undefined, defaultText);
    inp.preferredSize = [w, INPUT_H];
    inp.graphics.backgroundColor = inp.graphics.newBrush(
        inp.graphics.BrushType.SOLID_COLOR, C.card);
    inp.graphics.foregroundColor = inp.graphics.newPen(
        inp.graphics.PenType.SOLID_COLOR, C.text, 1);
    return inp;
}

type Direction = "up" | "down" | "left" | "right";

function DirectionPad(parent: any): any {
    var wrap: any = parent.add("group");
    wrap.orientation   = "column";
    wrap.alignChildren = ["center", "center"];
    wrap.spacing       = 3;
    wrap.alignment     = ["center", "top"];

    var ARROWS: { [k: string]: string } = { up: "^", down: "v", left: "<", right: ">" };
    var DIRS: Direction[] = ["up", "down", "left", "right"];
    var active: Direction = "right";
    var btns: { [k: string]: any } = {};

    function makeDirBtn(row: any, dir: Direction): void {
        var btn: any = row.add("customButton", undefined, "");
        btn.preferredSize = [30, 24];

        function redraw(): void {
            var g = btn.graphics;
            var on   = active === dir;
            var fill = g.newBrush(g.BrushType.SOLID_COLOR, on ? C.card : C.bg);
            var pen  = g.newPen(g.PenType.SOLID_COLOR, on ? C.text : C.dim, 1);
            var bordPen = g.newPen(g.PenType.SOLID_COLOR, C.border, 1);
            btn.onDraw = function(this: any): void {
                var sz = this.size;
                var ts = g.measureString(ARROWS[dir]);
                drawRoundRect(g, fill, sz.width, sz.height, 4);
                if (on) {
                    // draw border for active state
                    g.newPath();
                    g.rectPath(0.5, 0.5, sz.width - 1, sz.height - 1);
                    g.strokePath(bordPen);
                }
                g.drawString(ARROWS[dir], pen,
                    (sz.width  - ts.width)  / 2,
                    (sz.height - ts.height) / 2);
            };
        }

        btn.onClick = function(): void {
            active = dir;
            for (var i = 0; i < DIRS.length; i++) {
                var d = DIRS[i];
                if (btns[d]) { btns[d]._redraw(); btns[d].notify("onDraw"); }
            }
            if (wrap.onChange) wrap.onChange();
        };

        btn._redraw = redraw;
        redraw();
        btns[dir] = btn;
    }

    var r1: any = wrap.add("group"); r1.orientation = "row"; r1.spacing = 3; r1.alignment = ["center", "center"];
    makeDirBtn(r1, "up");

    var r2: any = wrap.add("group"); r2.orientation = "row"; r2.spacing = 3; r2.alignment = ["center", "center"];
    makeDirBtn(r2, "left");
    makeDirBtn(r2, "right");

    var r3: any = wrap.add("group"); r3.orientation = "row"; r3.spacing = 3; r3.alignment = ["center", "center"];
    makeDirBtn(r3, "down");

    wrap.getValue = function(): Direction { return active; };
    wrap.setValue = function(d: Direction): void {
        active = d;
        for (var i = 0; i < DIRS.length; i++) {
            var dir = DIRS[i];
            if (btns[dir]) { btns[dir]._redraw(); btns[dir].notify("onDraw"); }
        }
    };
    return wrap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 Logic: Assign Null
// ─────────────────────────────────────────────────────────────────────────────

function hasNullParent(layer: Layer): boolean {
    return layer.parent !== null && (layer.parent as AVLayer).nullLayer === true;
}

function isNull(layer: Layer): boolean {
    return (layer as AVLayer).nullLayer === true;
}

function findNullByName(comp: CompItem, name: string): AVLayer | null {
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i) as AVLayer;
        if (l.nullLayer && l.name === name) return l;
    }
    return null;
}

function averagePosition(layers: Layer[]): number[] {
    var sumX = 0, sumY = 0;
    for (var i = 0; i < layers.length; i++) {
        var p = (layers[i] as AVLayer).transform.position.value as number[];
        sumX += p[0];
        sumY += p[1];
    }
    return [sumX / layers.length, sumY / layers.length];
}

function earliestIn(layers: Layer[]): number {
    var t = layers[0].inPoint;
    for (var i = 1; i < layers.length; i++) {
        if (layers[i].inPoint < t) t = layers[i].inPoint;
    }
    return t;
}

function latestOut(layers: Layer[]): number {
    var t = layers[0].outPoint;
    for (var i = 1; i < layers.length; i++) {
        if (layers[i].outPoint > t) t = layers[i].outPoint;
    }
    return t;
}

function any3D(layers: Layer[]): boolean {
    for (var i = 0; i < layers.length; i++) {
        if ((layers[i] as AVLayer).threeDLayer) return true;
    }
    return false;
}

function makeNull(comp: CompItem, name: string, pos: number[], inPt: number, outPt: number, threeD: boolean): AVLayer {
    var n = comp.layers.addNull() as AVLayer;
    n.name        = name;
    n.inPoint     = inPt;
    n.outPoint    = outPt;
    n.threeDLayer = threeD;
    (n.transform.position as Property).setValue(pos);
    return n;
}

function runIndividual(comp: CompItem, layers: Layer[], skipNullLayers: boolean): { created: number; skipped: number } {
    var created = 0, skipped = 0;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (skipNullLayers && isNull(layer)) { skipped++; continue; }
        if (hasNullParent(layer))            { skipped++; continue; }

        var name = layer.name + "_Null";
        var n = findNullByName(comp, name);
        if (!n) {
            var pos = (layer as AVLayer).transform.position.value as number[];
            n = makeNull(comp, name, pos, layer.inPoint, layer.outPoint, (layer as AVLayer).threeDLayer);
            n.moveAfter(layer);
            created++;
        }
        layer.parent = n;
    }
    return { created: created, skipped: skipped };
}

function runShared(comp: CompItem, layers: Layer[], nullName: string, skipNullLayers: boolean): { created: number; skipped: number } {
    var actionable: Layer[] = [];
    var skipped = 0;
    for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        if (skipNullLayers && isNull(l)) { skipped++; continue; }
        if (hasNullParent(l))            { skipped++; continue; }
        actionable.push(l);
    }
    if (actionable.length === 0) return { created: 0, skipped: skipped };

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

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 Logic: Precomp
// ─────────────────────────────────────────────────────────────────────────────

function runPrecomp(comp: CompItem): void {
    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("No layers are selected. Please select at least one layer.");
        return;
    }

    app.beginUndoGroup("Precomp Selected Layers Individually");

    var compDuration = comp.duration;
    var layerData: Array<{ layer: Layer; name: string; index: number; inPoint: number; outPoint: number }> = [];
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        layerData.push({
            layer:    layer,
            name:     layer.name,
            index:    layer.index,
            inPoint:  layer.inPoint,
            outPoint: layer.outPoint,
        });
    }

    for (var j = 0; j < layerData.length; j++) {
        var data  = layerData[j];
        var lyr   = data.layer;

        for (var k = 0; k < comp.numLayers; k++) {
            comp.layer(k + 1).selected = false;
        }
        lyr.selected = true;

        var precompDuration = data.outPoint - data.inPoint;
        if (precompDuration <= 0) precompDuration = compDuration;

        comp.layers.precompose([lyr.index], data.name, true);

        var newPrecomp: CompItem | null = null;
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 Logic: Move & Opacity
// ─────────────────────────────────────────────────────────────────────────────

function computeOffset(original: number[], dir: Direction, dis: number, opposite: boolean): number[] {
    var result = original.slice();
    if (dir === "left")  result[0] = opposite ? result[0] + dis : result[0] - dis;
    if (dir === "right") result[0] = opposite ? result[0] - dis : result[0] + dis;
    if (dir === "up")    result[1] = opposite ? result[1] + dis : result[1] - dis;
    if (dir === "down")  result[1] = opposite ? result[1] - dis : result[1] + dis;
    return result;
}

interface MoveOpOptions {
    makePos:       boolean;
    posDir:        Direction;
    dis:           number;
    frs:           number;
    displaceFirst: boolean;
    makeOp:        boolean;
    opMode:        number;  // 0 = 0→100, 1 = 100→0
    opFrs:         number;
}

function applyMoveOp(opts: MoveOpOptions): void {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("No active composition."); return; }
    var sel = comp.selectedLayers;
    if (!sel || sel.length === 0) { alert("No layers selected."); return; }

    var t = comp.time;

    app.beginUndoGroup("Move & Opacity");

    for (var i = 0; i < sel.length; i++) {
        var layer = sel[i];

        // ── Position ──────────────────────────────────────────
        if (opts.makePos) {
            var endTimePos = t + (opts.frs / comp.frameRate);
            var posProp = (layer.property("ADBE Transform Group") as PropertyGroup)
                .property("ADBE Position") as Property;

            var original: number[];
            try { original = posProp.valueAtTime(t, false) as any; }
            catch (e) { original = posProp.value as any; }

            if (opts.displaceFirst) {
                var displaced = computeOffset(original, opts.posDir, opts.dis, true);
                posProp.setValueAtTime(t, displaced as any);
                posProp.setValueAtTime(endTimePos, original as any);
            } else {
                var moved = computeOffset(original, opts.posDir, opts.dis, false);
                posProp.setValueAtTime(t, original as any);
                posProp.setValueAtTime(endTimePos, moved as any);
            }

            posProp.selected = true;
        }

        // ── Opacity ───────────────────────────────────────────
        if (opts.makeOp) {
            var endTimeOp = t + (opts.opFrs / comp.frameRate);
            var opProp = (layer.property("ADBE Transform Group") as PropertyGroup)
                .property("ADBE Opacity") as Property;
            var startOp = opts.opMode === 1 ? 100 : 0;
            var endOp   = opts.opMode === 1 ? 0   : 100;
            opProp.setValueAtTime(t, startOp as any);
            opProp.setValueAtTime(endTimeOp, endOp as any);
        }
    }

    app.endUndoGroup();
}

// ─────────────────────────────────────────────────────────────────────────────
// Build UI
// ─────────────────────────────────────────────────────────────────────────────

function buildUI(thisObj: any): void {
    var win: any = (thisObj instanceof Panel)
        ? thisObj
        : new Window("palette", "AE Toolbox", undefined, { resizeable: true });

    win.orientation   = "column";
    win.alignChildren = ["fill", "top"];
    win.margins       = [PAD, PAD, PAD, PAD];
    win.spacing       = 0;
    win.graphics.backgroundColor = win.graphics.newBrush(
        win.graphics.BrushType.SOLID_COLOR, C.bg);

    // ── Header ─────────────────────────────────────────────────────────────────
    PanelHeader(win);

    // ── Tab bar ────────────────────────────────────────────────────────────────
    var tabBar: any = win.add("group");
    tabBar.orientation   = "row";
    tabBar.alignment     = ["fill", "top"];
    tabBar.spacing       = 0;
    tabBar.margins       = [0, 6, 0, 0];

    var tabNames: string[] = ["Assign null", "Precomp", "Move"];
    var tabBtns: any[]     = [];
    var tabContents: any[] = [];
    var activeTab = 0;

    // ── Content stack ──────────────────────────────────────────────────────────
    var contentGrp: any = win.add("group");
    contentGrp.orientation   = "stack";
    contentGrp.alignment     = ["fill", "fill"];
    contentGrp.alignChildren = ["fill", "top"];
    contentGrp.margins       = [0, GAP, 0, 0];

    // ══════════════════════════════════════════════════════════════════════════
    // Tab 1: Assign Null
    // ══════════════════════════════════════════════════════════════════════════

    var tab1: any = contentGrp.add("group");
    tab1.orientation   = "column";
    tab1.alignChildren = ["fill", "top"];
    tab1.spacing       = GAP;
    tabContents.push(tab1);

    SectionLabel(tab1, "MODE");
    var modeToggle: any = SegmentedToggle(tab1, ["Individual", "Shared"], 0);

    SectionLabel(tab1, "NULL NAME");
    var nullNameInput: any = StyledInput(tab1, "Group_Null", -1);
    nullNameInput.enabled = false;

    SectionLabel(tab1, "OPTIONS");
    var skipNullCb: any = CustomCheckbox(tab1, "Skip null layers", true);

    var descTxt: any = DescCard(tab1, "Each layer gets its own null\nmatched to its position.");

    var assignBtn: any = CustomButton(tab1, "Assign null");

    // Mode toggle logic
    modeToggle.onChange = function(): void {
        var isShared = modeToggle.getValue() === 1;
        nullNameInput.enabled = isShared;
        descTxt.text = isShared
            ? "All selected layers share one null\npositioned at their average centre."
            : "Each layer gets its own null\nmatched to its position.";
    };

    // Run
    assignBtn.onClick = function(): void {
        if (!app.project) { alert("No project is open."); return; }
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition first."); return; }
        var selected = comp.selectedLayers;
        if (selected.length === 0) { alert("No layers selected."); return; }

        var layers: Layer[] = [];
        for (var i = 0; i < selected.length; i++) layers.push(selected[i]);

        app.beginUndoGroup("Assign Null to Selected Layers");
        var skipNulls = skipNullCb.getValue();
        var result: { created: number; skipped: number };

        if (modeToggle.getValue() === 0) {
            result = runIndividual(comp, layers, skipNulls);
        } else {
            var name = (nullNameInput.text || "Group_Null").replace(/^\s+|\s+$/g, "");
            result = runShared(comp, layers, name || "Group_Null", skipNulls);
        }
        app.endUndoGroup();

        var msg = "Done!\n\nNulls created : " + result.created + "\nLayers skipped: " + result.skipped;
        if (result.skipped > 0) msg += "\n\n(Skipped layers already had a null parent or were null layers.)";
        alert(msg);
    };

    // ══════════════════════════════════════════════════════════════════════════
    // Tab 2: Precomp
    // ══════════════════════════════════════════════════════════════════════════

    var tab2: any = contentGrp.add("group");
    tab2.orientation   = "column";
    tab2.alignChildren = ["fill", "top"];
    tab2.spacing       = GAP;
    tab2.visible       = false;
    tabContents.push(tab2);

    DescCard(tab2, "Precomps each selected layer into its own composition, preserving the original name.");

    var precompBtn: any = CustomButton(tab2, "Precomp individually");
    precompBtn.onClick = function(): void {
        if (!app.project) { alert("No project is open."); return; }
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Please select a composition first."); return; }
        runPrecomp(comp);
    };

    // ══════════════════════════════════════════════════════════════════════════
    // Tab 3: Move & Opacity
    // ══════════════════════════════════════════════════════════════════════════

    var tab3: any = contentGrp.add("group");
    tab3.orientation   = "column";
    tab3.alignChildren = ["fill", "top"];
    tab3.spacing       = GAP;
    tab3.visible       = false;
    tabContents.push(tab3);

    // Position section
    var posCb: any = CustomCheckbox(tab3, "Position", true);

    var posControls: any = tab3.add("group");
    posControls.orientation   = "column";
    posControls.alignChildren = ["fill", "top"];
    posControls.spacing       = GAP;

    var dirPad: any = DirectionPad(posControls);

    // Distance + Frames side by side
    var dfRow: any = posControls.add("group");
    dfRow.orientation   = "row";
    dfRow.alignChildren = ["fill", "top"];
    dfRow.spacing       = GAP;

    var distCol: any = dfRow.add("group");
    distCol.orientation   = "column";
    distCol.alignChildren = ["fill", "top"];
    distCol.spacing       = 3;

    var distLbl: any = distCol.add("statictext", undefined, "Distance");
    distLbl.graphics.foregroundColor = distLbl.graphics.newPen(
        distLbl.graphics.PenType.SOLID_COLOR, C.dim, 1);
    var distInput: any = StyledInput(distCol, "50", -1);

    var frsCol: any = dfRow.add("group");
    frsCol.orientation   = "column";
    frsCol.alignChildren = ["fill", "top"];
    frsCol.spacing       = 3;

    var frsLbl: any = frsCol.add("statictext", undefined, "Frames");
    frsLbl.graphics.foregroundColor = frsLbl.graphics.newPen(
        frsLbl.graphics.PenType.SOLID_COLOR, C.dim, 1);
    var frsInput: any = StyledInput(frsCol, "10", -1);

    var displaceCb: any = CustomCheckbox(posControls, "Displace", true);

    Separator(tab3);

    // Opacity section
    var opCb: any = CustomCheckbox(tab3, "Opacity", false);

    var opControls: any = tab3.add("group");
    opControls.orientation   = "column";
    opControls.alignChildren = ["fill", "top"];
    opControls.spacing       = GAP;
    opControls.enabled       = false;

    var opModeToggle: any = SegmentedToggle(opControls, ["0\u2192100", "100\u21920"], 0);

    var opFrsCol: any = opControls.add("group");
    opFrsCol.orientation   = "column";
    opFrsCol.alignChildren = ["fill", "top"];
    opFrsCol.spacing       = 3;

    var opFrsLbl: any = opFrsCol.add("statictext", undefined, "Frames");
    opFrsLbl.graphics.foregroundColor = opFrsLbl.graphics.newPen(
        opFrsLbl.graphics.PenType.SOLID_COLOR, C.dim, 1);
    var opFrsInput: any = StyledInput(opFrsCol, "10", -1);

    Separator(tab3);

    var applyBtn: any = CustomButton(tab3, "Apply");

    // Enable/disable logic
    posCb.onValueChange = function(): void {
        posControls.enabled = posCb.getValue();
    };
    opCb.onValueChange = function(): void {
        opControls.enabled = opCb.getValue();
    };

    // Apply
    function doApply(): void {
        var makePos = posCb.getValue();
        var makeOp  = opCb.getValue();
        if (!makePos && !makeOp) { alert("Enable at least Position or Opacity."); return; }

        var dis = 0, frs = 0, opFrs = 0;
        if (makePos) {
            dis = parseFloat(distInput.text);
            frs = parseInt(frsInput.text, 10);
            if (isNaN(dis))              { alert("Distance must be a valid number."); return; }
            if (isNaN(frs) || frs < 0)  { alert("Frames must be a non-negative integer."); return; }
        }
        if (makeOp) {
            opFrs = parseInt(opFrsInput.text, 10);
            if (isNaN(opFrs) || opFrs < 0) { alert("Opacity frames must be a non-negative integer."); return; }
        }

        applyMoveOp({
            makePos:       makePos,
            posDir:        dirPad.getValue() as Direction,
            dis:           dis,
            frs:           frs,
            displaceFirst: displaceCb.getValue(),
            makeOp:        makeOp,
            opMode:        opModeToggle.getValue(),
            opFrs:         opFrs,
        });
    }

    applyBtn.onClick = doApply;

    // ── Tab bar drawing & switching ────────────────────────────────────────────

    function switchTab(index: number): void {
        activeTab = index;
        for (var i = 0; i < tabContents.length; i++) {
            tabContents[i].visible = (i === index);
        }
        for (var j = 0; j < tabBtns.length; j++) {
            tabBtns[j]._redraw();
            tabBtns[j].notify("onDraw");
        }
    }

    for (var t2 = 0; t2 < tabNames.length; t2++) {
        (function(idx: number): void {
            var tb: any = tabBar.add("customButton", undefined, "");
            tb.preferredSize = [-1, TAB_H];
            tb.text = tabNames[idx];

            function redraw(): void {
                var g = tb.graphics;
                var isActive = activeTab === idx;
                var bgBrush  = g.newBrush(g.BrushType.SOLID_COLOR, C.bg);
                var textPen  = g.newPen(g.PenType.SOLID_COLOR, isActive ? C.text : C.dim, 1);
                var linePen  = g.newPen(g.PenType.SOLID_COLOR, C.white, 2);
                var font     = isActive
                    ? ScriptUI.newFont("dialog", "BOLD", 11)
                    : ScriptUI.newFont("dialog", "REGULAR", 11);
                tb.onDraw = function(this: any): void {
                    var sz = this.size;
                    var ts = g.measureString(tb.text, font);
                    // background
                    g.newPath(); g.rectPath(0, 0, sz.width, sz.height); g.fillPath(bgBrush);
                    // label
                    g.drawString(tb.text, textPen,
                        (sz.width  - ts.width)  / 2,
                        (sz.height - ts.height) / 2,
                        font);
                    // active underline
                    if (isActive) {
                        g.newPath();
                        g.moveTo(0, sz.height - 2);
                        g.lineTo(sz.width, sz.height - 2);
                        g.strokePath(linePen);
                    }
                };
            }

            tb.onClick = function(): void { switchTab(idx); };
            tb._redraw = redraw;
            redraw();
            tabBtns.push(tb);
        })(t2);
    }

    // Tab bar separator
    Separator(win);

    // ── Resize & show ──────────────────────────────────────────────────────────
    win.onResizing = win.onResize = function(): void { win.layout.resize(); };

    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }
}

buildUI(__panelThis);
