/// <reference path="./ae.d.ts" />

declare var __panelThis: any;

// ─────────────────────────────────────────────────────────────────────────────
// Palette  (plain arrays — no lib types needed)
// ─────────────────────────────────────────────────────────────────────────────

var BG       = [0.149, 0.149, 0.149, 1];
var CARD     = [0.196, 0.196, 0.196, 1];
var BORDER   = [0.255, 0.255, 0.255, 1];
var TEXT     = [0.867, 0.867, 0.867, 1];
var DIM      = [0.467, 0.467, 0.467, 1];
var ACCENT   = [0.302, 0.600, 1.000, 1];
var BTN_BG   = [0.918, 0.918, 0.902, 1];
var BTN_TEXT = [0.118, 0.118, 0.118, 1];
var SEG_ON   = [0.918, 0.918, 0.902, 1];
var SEG_OFF  = [0.220, 0.220, 0.220, 1];
var WHITE    = [1.000, 1.000, 1.000, 1];
var CHECK    = [0.302, 0.600, 1.000, 1];

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

var PAD     = 12;
var GAP     = 8;
var SGAP    = 6;
var BTN_H   = 30;
var TAB_H   = 30;
var SEG_H   = 28;
var INPUT_H = 24;

// ─────────────────────────────────────────────────────────────────────────────
// Drawing helpers
// ─────────────────────────────────────────────────────────────────────────────

function fillRoundRect(g: any, color: number[], w: number, h: number, r: number): void {
    var d = r * 2;
    var brush = g.newBrush(g.BrushType.SOLID_COLOR, color);
    g.newPath(); g.ellipsePath(0,     0,     d, d); g.fillPath(brush);
    g.newPath(); g.ellipsePath(w - d, 0,     d, d); g.fillPath(brush);
    g.newPath(); g.ellipsePath(w - d, h - d, d, d); g.fillPath(brush);
    g.newPath(); g.ellipsePath(0,     h - d, d, d); g.fillPath(brush);
    g.newPath(); g.rectPath(r, 0,     w - d, h);     g.fillPath(brush);
    g.newPath(); g.rectPath(0, r,     w,     h - d); g.fillPath(brush);
}

function fillRect(g: any, color: number[], x: number, y: number, w: number, h: number): void {
    var brush = g.newBrush(g.BrushType.SOLID_COLOR, color);
    g.newPath();
    g.rectPath(x, y, w, h);
    g.fillPath(brush);
}

function drawText(g: any, text: string, color: number[], x: number, y: number, font?: any): void {
    var pen = g.newPen(g.PenType.SOLID_COLOR, color, 1);
    if (font) g.drawString(text, pen, x, y, font);
    else      g.drawString(text, pen, x, y);
}

// ─────────────────────────────────────────────────────────────────────────────
// Controls
// ─────────────────────────────────────────────────────────────────────────────

function PanelHeader(parent: any): void {
    var hdr: any = parent.add("customView", undefined, "");
    hdr.preferredSize = [-1, 26];
    hdr.onDraw = function(this: any): void {
        var g   = this.graphics;
        var sz  = this.size;
        var fnt = ScriptUI.newFont("dialog", "BOLD", 10);
        fillRect(g, BG, 0, 0, sz.width, sz.height);
        // blue dot
        var dot = g.newBrush(g.BrushType.SOLID_COLOR, ACCENT);
        g.newPath();
        g.ellipsePath(0, (sz.height - 7) / 2, 7, 7);
        g.fillPath(dot);
        // title
        drawText(g, "AE TOOLBOX", DIM, 13, (sz.height - g.measureString("AE TOOLBOX", fnt).height) / 2, fnt);
    };
}

function SectionLabel(parent: any, text: string): void {
    var lbl: any = parent.add("statictext", undefined, text);
    lbl.graphics.font = ScriptUI.newFont("dialog", "BOLD", 9);
    lbl.graphics.foregroundColor = lbl.graphics.newPen(
        lbl.graphics.PenType.SOLID_COLOR, DIM, 1);
}

function Separator(parent: any): void {
    var sep: any = parent.add("customView", undefined, "");
    sep.preferredSize = [-1, 1];
    sep.onDraw = function(this: any): void {
        var g   = this.graphics;
        var pen = g.newPen(g.PenType.SOLID_COLOR, BORDER, 1);
        g.newPath();
        g.moveTo(0, 0);
        g.lineTo(this.size.width, 0);
        g.strokePath(pen);
    };
}

// Light cream action button
function CustomButton(parent: any, text: string): any {
    var btn: any = parent.add("customButton", undefined, "");
    btn.preferredSize  = [-1, BTN_H];
    btn.text           = text;
    btn._hovered       = false;

    btn.onDraw = function(this: any): void {
        var g    = this.graphics;
        var sz   = this.size;
        var bg   = btn._hovered ? [0.96, 0.96, 0.95, 1] : BTN_BG;
        var fnt  = ScriptUI.newFont("dialog", "REGULAR", 11);
        var ts   = g.measureString(btn.text, fnt);
        fillRoundRect(g, bg, sz.width, sz.height, 12);
        drawText(g, btn.text, BTN_TEXT,
            (sz.width  - ts.width)  / 2,
            (sz.height - ts.height) / 2,
            fnt);
    };

    btn.addEventListener("mouseover", function(): void { btn._hovered = true;  btn.notify("onDraw"); });
    btn.addEventListener("mouseout",  function(): void { btn._hovered = false; btn.notify("onDraw"); });
    return btn;
}

// Custom checkbox  (box + label)
function CustomCheckbox(parent: any, text: string, defaultChecked: boolean): any {
    var grp: any = parent.add("group");
    grp.orientation   = "row";
    grp.spacing       = SGAP;
    grp.alignment     = ["left", "center"];
    grp.alignChildren = ["left", "center"];

    var box: any = grp.add("customButton", undefined, "");
    box.preferredSize = [16, 16];
    box._checked = defaultChecked;

    box.onDraw = function(this: any): void {
        var g  = this.graphics;
        var sz = this.size;
        fillRoundRect(g, box._checked ? CHECK : CARD, sz.width, sz.height, 3);
        if (!box._checked) {
            var bpen = g.newPen(g.PenType.SOLID_COLOR, BORDER, 1);
            g.newPath(); g.rectPath(0.5, 0.5, sz.width - 1, sz.height - 1); g.strokePath(bpen);
        }
        if (box._checked) {
            var cpen = g.newPen(g.PenType.SOLID_COLOR, WHITE, 2);
            g.newPath(); g.moveTo(3, 8); g.lineTo(6, 12); g.lineTo(13, 4); g.strokePath(cpen);
        }
    };

    var lbl: any = grp.add("statictext", undefined, text);
    lbl.graphics.foregroundColor = lbl.graphics.newPen(
        lbl.graphics.PenType.SOLID_COLOR, TEXT, 1);

    function toggle(): void {
        box._checked = !box._checked;
        box.notify("onDraw");
        if (grp.onValueChange) grp.onValueChange();
    }

    box.onClick = toggle;
    lbl.onClick = toggle;

    grp.getValue = function(): boolean { return box._checked; };
    grp.setValue = function(v: boolean): void { box._checked = v; box.notify("onDraw"); };
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

            seg.onDraw = function(this: any): void {
                var g   = this.graphics;
                var sz  = this.size;
                var on  = grp._selected === idx;
                var bg  = on ? SEG_ON  : SEG_OFF;
                var fg  = on ? BTN_TEXT : DIM;
                var fnt = ScriptUI.newFont("dialog", on ? "BOLD" : "REGULAR", 11);
                var ts  = g.measureString(seg.text, fnt);
                fillRoundRect(g, bg, sz.width, sz.height, 5);
                drawText(g, seg.text, fg,
                    (sz.width  - ts.width)  / 2,
                    (sz.height - ts.height) / 2,
                    fnt);
            };

            seg.onClick = function(): void {
                grp._selected = idx;
                for (var j = 0; j < grp._btns.length; j++) {
                    grp._btns[j].notify("onDraw");
                }
                if (grp.onChange) grp.onChange();
            };

            grp._btns.push(seg);
        })(i);
    }

    grp.getValue = function(): number { return grp._selected; };
    grp.setValue = function(idx: number): void {
        grp._selected = idx;
        for (var j = 0; j < grp._btns.length; j++) { grp._btns[j].notify("onDraw"); }
    };
    return grp;
}

// Description text card
function DescCard(parent: any, text: string): any {
    var wrap: any = parent.add("group");
    wrap.orientation   = "stack";
    wrap.alignment     = ["fill", "top"];
    wrap.alignChildren = ["fill", "top"];

    var bg: any = wrap.add("customView", undefined, "");
    bg.preferredSize = [-1, 1];
    bg.onDraw = function(this: any): void {
        fillRoundRect(this.graphics, CARD, this.size.width, this.size.height, 5);
    };

    var inner: any = wrap.add("group");
    inner.orientation   = "column";
    inner.alignChildren = ["fill", "top"];
    inner.margins       = [8, 8, 8, 8];
    inner.spacing       = 0;

    var txt: any = inner.add("statictext", undefined, text, { multiline: true });
    txt.graphics.foregroundColor = txt.graphics.newPen(
        txt.graphics.PenType.SOLID_COLOR, DIM, 1);
    return txt;
}

function StyledInput(parent: any, defaultText: string, w: number): any {
    var inp: any = parent.add("edittext", undefined, defaultText);
    inp.preferredSize = [w, INPUT_H];
    inp.graphics.backgroundColor = inp.graphics.newBrush(
        inp.graphics.BrushType.SOLID_COLOR, CARD);
    inp.graphics.foregroundColor = inp.graphics.newPen(
        inp.graphics.PenType.SOLID_COLOR, TEXT, 1);
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

        btn.onDraw = function(this: any): void {
            var g   = this.graphics;
            var sz  = this.size;
            var on  = active === dir;
            var bg  = on ? CARD : BG;
            var fg  = on ? TEXT : DIM;
            var fnt = ScriptUI.newFont("dialog", "REGULAR", 11);
            var ts  = g.measureString(ARROWS[dir], fnt);
            fillRoundRect(g, bg, sz.width, sz.height, 4);
            if (on) {
                var bpen = g.newPen(g.PenType.SOLID_COLOR, BORDER, 1);
                g.newPath(); g.rectPath(0.5, 0.5, sz.width - 1, sz.height - 1); g.strokePath(bpen);
            }
            drawText(g, ARROWS[dir], fg,
                (sz.width  - ts.width)  / 2,
                (sz.height - ts.height) / 2,
                fnt);
        };

        btn.onClick = function(): void {
            active = dir;
            for (var i = 0; i < DIRS.length; i++) {
                var d = DIRS[i];
                if (btns[d]) btns[d].notify("onDraw");
            }
            if (wrap.onChange) wrap.onChange();
        };

        btns[dir] = btn;
    }

    var r1: any = wrap.add("group"); r1.orientation = "row"; r1.spacing = 3;
    makeDirBtn(r1, "up");

    var r2: any = wrap.add("group"); r2.orientation = "row"; r2.spacing = 3;
    makeDirBtn(r2, "left");
    makeDirBtn(r2, "right");

    var r3: any = wrap.add("group"); r3.orientation = "row"; r3.spacing = 3;
    makeDirBtn(r3, "down");

    wrap.getValue = function(): Direction { return active; };
    wrap.setValue = function(d: Direction): void {
        active = d;
        for (var i = 0; i < DIRS.length; i++) {
            var dir = DIRS[i];
            if (btns[dir]) btns[dir].notify("onDraw");
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
        sumX += p[0]; sumY += p[1];
    }
    return [sumX / layers.length, sumY / layers.length];
}

function earliestIn(layers: Layer[]): number {
    var t = layers[0].inPoint;
    for (var i = 1; i < layers.length; i++) { if (layers[i].inPoint  < t) t = layers[i].inPoint; }
    return t;
}

function latestOut(layers: Layer[]): number {
    var t = layers[0].outPoint;
    for (var i = 1; i < layers.length; i++) { if (layers[i].outPoint > t) t = layers[i].outPoint; }
    return t;
}

function any3D(layers: Layer[]): boolean {
    for (var i = 0; i < layers.length; i++) { if ((layers[i] as AVLayer).threeDLayer) return true; }
    return false;
}

function makeNull(comp: CompItem, name: string, pos: number[], inPt: number, outPt: number, threeD: boolean): AVLayer {
    var n = comp.layers.addNull() as AVLayer;
    n.name = name; n.inPoint = inPt; n.outPoint = outPt; n.threeDLayer = threeD;
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
        var pos = averagePosition(actionable);
        n = makeNull(comp, nullName, pos, earliestIn(actionable), latestOut(actionable), any3D(actionable));
        var topLayer = actionable[0];
        for (var j = 1; j < actionable.length; j++) {
            if (actionable[j].index < topLayer.index) topLayer = actionable[j];
        }
        n.moveBefore(topLayer);
        created = 1;
    }
    for (var k = 0; k < actionable.length; k++) { actionable[k].parent = n; }
    return { created: created, skipped: skipped };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 Logic: Precomp
// ─────────────────────────────────────────────────────────────────────────────

function runPrecomp(comp: CompItem): void {
    var sel = comp.selectedLayers;
    if (sel.length === 0) { alert("Select at least one layer."); return; }

    app.beginUndoGroup("Precomp Selected Layers Individually");

    var data: Array<{ layer: Layer; name: string; index: number; inPoint: number; outPoint: number }> = [];
    for (var i = 0; i < sel.length; i++) {
        data.push({ layer: sel[i], name: sel[i].name, index: sel[i].index, inPoint: sel[i].inPoint, outPoint: sel[i].outPoint });
    }

    for (var j = 0; j < data.length; j++) {
        var d = data[j];
        for (var k = 0; k < comp.numLayers; k++) comp.layer(k + 1).selected = false;
        d.layer.selected = true;

        var dur = d.outPoint - d.inPoint;
        if (dur <= 0) dur = comp.duration;

        comp.layers.precompose([d.layer.index], d.name, true);

        var newComp: CompItem | null = null;
        for (var p = 1; p <= app.project.numItems; p++) {
            var item = app.project.item(p);
            if (item instanceof CompItem && item.name === d.name && item !== comp) {
                if (newComp === null || item.id > newComp.id) newComp = item;
            }
        }
        if (newComp !== null && dur > 0) newComp.duration = dur;
    }

    app.endUndoGroup();
    alert("Done!\n" + data.length + " layer(s) precomped individually.");
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 Logic: Move & Opacity
// ─────────────────────────────────────────────────────────────────────────────

function computeOffset(original: number[], dir: Direction, dis: number, opposite: boolean): number[] {
    var r = original.slice();
    if (dir === "left")  r[0] = opposite ? r[0] + dis : r[0] - dis;
    if (dir === "right") r[0] = opposite ? r[0] - dis : r[0] + dis;
    if (dir === "up")    r[1] = opposite ? r[1] + dis : r[1] - dis;
    if (dir === "down")  r[1] = opposite ? r[1] - dis : r[1] + dis;
    return r;
}

interface MoveOpOptions {
    makePos: boolean; posDir: Direction; dis: number; frs: number; displaceFirst: boolean;
    makeOp: boolean;  opMode: number;   opFrs: number;
}

function applyMoveOp(opts: MoveOpOptions): void {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("No active composition."); return; }
    var sel = comp.selectedLayers;
    if (!sel || sel.length === 0)    { alert("No layers selected."); return; }

    var t = comp.time;
    app.beginUndoGroup("Move & Opacity");

    for (var i = 0; i < sel.length; i++) {
        var layer = sel[i];

        if (opts.makePos) {
            var endPos = t + (opts.frs / comp.frameRate);
            var posProp = (layer.property("ADBE Transform Group") as PropertyGroup).property("ADBE Position") as Property;
            var orig: number[];
            try { orig = posProp.valueAtTime(t, false) as any; } catch (e) { orig = posProp.value as any; }

            if (opts.displaceFirst) {
                posProp.setValueAtTime(t,      computeOffset(orig, opts.posDir, opts.dis, true)  as any);
                posProp.setValueAtTime(endPos, orig as any);
            } else {
                posProp.setValueAtTime(t,      orig as any);
                posProp.setValueAtTime(endPos, computeOffset(orig, opts.posDir, opts.dis, false) as any);
            }
            posProp.selected = true;
        }

        if (opts.makeOp) {
            var endOp  = t + (opts.opFrs / comp.frameRate);
            var opProp = (layer.property("ADBE Transform Group") as PropertyGroup).property("ADBE Opacity") as Property;
            var s = opts.opMode === 1 ? 100 : 0;
            var e = opts.opMode === 1 ? 0   : 100;
            opProp.setValueAtTime(t,     s as any);
            opProp.setValueAtTime(endOp, e as any);
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
    win.spacing       = GAP;
    win.graphics.backgroundColor = win.graphics.newBrush(
        win.graphics.BrushType.SOLID_COLOR, BG);

    // ── Header ────────────────────────────────────────────────────────────────
    PanelHeader(win);

    // ── Tab bar ───────────────────────────────────────────────────────────────
    var tabBar: any = win.add("group");
    tabBar.orientation = "row";
    tabBar.alignment   = ["fill", "top"];
    tabBar.spacing     = 0;
    tabBar.margins     = [0, 0, 0, 0];

    var tabNames: string[]  = ["Assign null", "Precomp", "Move"];
    var tabBtns: any[]      = [];
    var tabContents: any[]  = [];
    var activeTab           = 0;

    // ── Content stack ─────────────────────────────────────────────────────────
    var contentGrp: any = win.add("group");
    contentGrp.orientation   = "stack";
    contentGrp.alignment     = ["fill", "fill"];
    contentGrp.alignChildren = ["fill", "top"];

    // ═════════════════════════════════════════════════════════════════════════
    // Tab 1: Assign Null
    // ═════════════════════════════════════════════════════════════════════════

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

    Separator(tab1);
    var assignBtn: any = CustomButton(tab1, "Assign null");

    modeToggle.onChange = function(): void {
        var shared = modeToggle.getValue() === 1;
        nullNameInput.enabled = shared;
        descTxt.text = shared
            ? "All selected layers share one null\npositioned at their average centre."
            : "Each layer gets its own null\nmatched to its position.";
    };

    assignBtn.onClick = function(): void {
        if (!app.project) { alert("No project open."); return; }
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Select a composition first."); return; }
        var sel = comp.selectedLayers;
        if (sel.length === 0) { alert("No layers selected."); return; }

        var layers: Layer[] = [];
        for (var i = 0; i < sel.length; i++) layers.push(sel[i]);

        app.beginUndoGroup("Assign Null to Selected Layers");
        var skipNulls = skipNullCb.getValue();
        var result: { created: number; skipped: number };

        if (modeToggle.getValue() === 0) {
            result = runIndividual(comp, layers, skipNulls);
        } else {
            var nullName = (nullNameInput.text || "Group_Null").replace(/^\s+|\s+$/g, "") || "Group_Null";
            result = runShared(comp, layers, nullName, skipNulls);
        }
        app.endUndoGroup();

        var msg = "Done!\n\nNulls created : " + result.created + "\nLayers skipped: " + result.skipped;
        if (result.skipped > 0) msg += "\n\n(Skipped: already had null parent or were null layers.)";
        alert(msg);
    };

    // ═════════════════════════════════════════════════════════════════════════
    // Tab 2: Precomp
    // ═════════════════════════════════════════════════════════════════════════

    var tab2: any = contentGrp.add("group");
    tab2.orientation   = "column";
    tab2.alignChildren = ["fill", "top"];
    tab2.spacing       = GAP;
    tab2.visible       = false;
    tabContents.push(tab2);

    DescCard(tab2, "Precomps each selected layer into its own composition, preserving the original layer name.");
    Separator(tab2);
    var precompBtn: any = CustomButton(tab2, "Precomp individually");

    precompBtn.onClick = function(): void {
        if (!app.project) { alert("No project open."); return; }
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Select a composition first."); return; }
        runPrecomp(comp);
    };

    // ═════════════════════════════════════════════════════════════════════════
    // Tab 3: Move & Opacity
    // ═════════════════════════════════════════════════════════════════════════

    var tab3: any = contentGrp.add("group");
    tab3.orientation   = "column";
    tab3.alignChildren = ["fill", "top"];
    tab3.spacing       = GAP;
    tab3.visible       = false;
    tabContents.push(tab3);

    var posCb: any = CustomCheckbox(tab3, "Position", true);

    var posControls: any = tab3.add("group");
    posControls.orientation   = "column";
    posControls.alignChildren = ["fill", "top"];
    posControls.spacing       = GAP;

    var dirPad: any = DirectionPad(posControls);

    var dfRow: any = posControls.add("group");
    dfRow.orientation = "row"; dfRow.spacing = GAP;

    var distCol: any = dfRow.add("group");
    distCol.orientation = "column"; distCol.spacing = 3; distCol.alignChildren = ["fill", "top"];
    var distLbl: any = distCol.add("statictext", undefined, "Distance");
    distLbl.graphics.foregroundColor = distLbl.graphics.newPen(distLbl.graphics.PenType.SOLID_COLOR, DIM, 1);
    var distInput: any = StyledInput(distCol, "50", -1);

    var frsCol: any = dfRow.add("group");
    frsCol.orientation = "column"; frsCol.spacing = 3; frsCol.alignChildren = ["fill", "top"];
    var frsLbl: any = frsCol.add("statictext", undefined, "Frames");
    frsLbl.graphics.foregroundColor = frsLbl.graphics.newPen(frsLbl.graphics.PenType.SOLID_COLOR, DIM, 1);
    var frsInput: any = StyledInput(frsCol, "10", -1);

    var displaceCb: any = CustomCheckbox(posControls, "Displace", true);

    Separator(tab3);

    var opCb: any = CustomCheckbox(tab3, "Opacity", false);

    var opControls: any = tab3.add("group");
    opControls.orientation   = "column";
    opControls.alignChildren = ["fill", "top"];
    opControls.spacing       = GAP;
    opControls.enabled       = false;

    var opModeToggle: any = SegmentedToggle(opControls, ["0\u2192100", "100\u21920"], 0);

    var opFrsCol: any = opControls.add("group");
    opFrsCol.orientation = "column"; opFrsCol.spacing = 3; opFrsCol.alignChildren = ["fill", "top"];
    var opFrsLbl: any = opFrsCol.add("statictext", undefined, "Frames");
    opFrsLbl.graphics.foregroundColor = opFrsLbl.graphics.newPen(opFrsLbl.graphics.PenType.SOLID_COLOR, DIM, 1);
    var opFrsInput: any = StyledInput(opFrsCol, "10", -1);

    Separator(tab3);
    var applyBtn: any = CustomButton(tab3, "Apply");

    posCb.onValueChange = function(): void { posControls.enabled = posCb.getValue(); };
    opCb.onValueChange  = function(): void { opControls.enabled  = opCb.getValue();  };

    function doApply(): void {
        var makePos = posCb.getValue();
        var makeOp  = opCb.getValue();
        if (!makePos && !makeOp) { alert("Enable at least Position or Opacity."); return; }

        var dis = 0, frs = 0, opFrs = 0;
        if (makePos) {
            dis = parseFloat(distInput.text);
            frs = parseInt(frsInput.text, 10);
            if (isNaN(dis))             { alert("Distance must be a number."); return; }
            if (isNaN(frs) || frs < 0)  { alert("Frames must be a non-negative integer."); return; }
        }
        if (makeOp) {
            opFrs = parseInt(opFrsInput.text, 10);
            if (isNaN(opFrs) || opFrs < 0) { alert("Opacity frames must be a non-negative integer."); return; }
        }

        applyMoveOp({
            makePos: makePos, posDir: dirPad.getValue() as Direction,
            dis: dis, frs: frs, displaceFirst: displaceCb.getValue(),
            makeOp: makeOp, opMode: opModeToggle.getValue(), opFrs: opFrs,
        });
    }

    applyBtn.onClick = doApply;

    // ── Tab bar ───────────────────────────────────────────────────────────────

    function switchTab(index: number): void {
        activeTab = index;
        for (var i = 0; i < tabContents.length; i++) tabContents[i].visible = (i === index);
        for (var j = 0; j < tabBtns.length; j++) tabBtns[j].notify("onDraw");
    }

    for (var ti = 0; ti < tabNames.length; ti++) {
        (function(idx: number): void {
            var tb: any = tabBar.add("customButton", undefined, "");
            tb.preferredSize = [-1, TAB_H];
            tb.text = tabNames[idx];

            tb.onDraw = function(this: any): void {
                var g      = this.graphics;
                var sz     = this.size;
                var isOn   = activeTab === idx;
                var fg     = isOn ? TEXT : DIM;
                var fnt    = ScriptUI.newFont("dialog", isOn ? "BOLD" : "REGULAR", 11);
                var ts     = g.measureString(tb.text, fnt);
                fillRect(g, BG, 0, 0, sz.width, sz.height);
                drawText(g, tb.text, fg,
                    (sz.width  - ts.width)  / 2,
                    (sz.height - ts.height) / 2,
                    fnt);
                if (isOn) {
                    var lpen = g.newPen(g.PenType.SOLID_COLOR, WHITE, 2);
                    g.newPath(); g.moveTo(0, sz.height - 2); g.lineTo(sz.width, sz.height - 2); g.strokePath(lpen);
                }
            };

            tb.onClick = function(): void { switchTab(idx); };
            tabBtns.push(tb);
        })(ti);
    }

    // tab bar bottom separator
    Separator(win);

    // ── Resize & show ─────────────────────────────────────────────────────────
    win.onResizing = win.onResize = function(): void { win.layout.resize(); };

    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }
}

buildUI(__panelThis);
