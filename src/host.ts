/// <reference path="./ae.d.ts" />

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
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
    for (var i = 0; i < layers.length; i++) {
        if ((layers[i] as AVLayer).threeDLayer) return true;
    }
    return false;
}

function makeNullLayer(comp: CompItem, name: string, pos: number[], inPt: number, outPt: number, threeD: boolean): AVLayer {
    var n = comp.layers.addNull() as AVLayer;
    n.name = name; n.inPoint = inPt; n.outPoint = outPt; n.threeDLayer = threeD;
    (n.transform.position as Property).setValue(pos);
    return n;
}

function computeOffset(original: number[], dir: string, dis: number, opposite: boolean): number[] {
    var r = original.slice();
    if (dir === "left")  r[0] = opposite ? r[0] + dis : r[0] - dis;
    if (dir === "right") r[0] = opposite ? r[0] - dis : r[0] + dis;
    if (dir === "up")    r[1] = opposite ? r[1] + dis : r[1] - dis;
    if (dir === "down")  r[1] = opposite ? r[1] - dis : r[1] + dis;
    return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign Null
// ─────────────────────────────────────────────────────────────────────────────

function aeAssignNull(mode: string, nullName: string, skipNulls: boolean): string {
    try {
        if (!app.project) return "err:No project is open.";
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return "err:Please select a composition first.";
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0) return "err:No layers are selected.";

        var layers: Layer[] = [];
        for (var i = 0; i < sel.length; i++) layers.push(sel[i]);

        app.beginUndoGroup("Assign Null to Selected Layers");

        var created = 0, skipped = 0;

        if (mode === "individual") {
            for (var j = 0; j < layers.length; j++) {
                var layer = layers[j];
                if (skipNulls && isNull(layer)) { skipped++; continue; }
                if (hasNullParent(layer))       { skipped++; continue; }
                var name = layer.name + "_Null";
                var n = findNullByName(comp, name);
                if (!n) {
                    var pos = (layer as AVLayer).transform.position.value as number[];
                    n = makeNullLayer(comp, name, pos, layer.inPoint, layer.outPoint, (layer as AVLayer).threeDLayer);
                    n.moveAfter(layer);
                    created++;
                }
                layer.parent = n;
            }
        } else {
            var actionable: Layer[] = [];
            for (var k = 0; k < layers.length; k++) {
                var l = layers[k];
                if (skipNulls && isNull(l)) { skipped++; continue; }
                if (hasNullParent(l))       { skipped++; continue; }
                actionable.push(l);
            }
            if (actionable.length > 0) {
                var sharedNull = findNullByName(comp, nullName);
                if (!sharedNull) {
                    var avgPos = averagePosition(actionable);
                    sharedNull = makeNullLayer(comp, nullName, avgPos, earliestIn(actionable), latestOut(actionable), any3D(actionable));
                    var topLayer = actionable[0];
                    for (var m = 1; m < actionable.length; m++) {
                        if (actionable[m].index < topLayer.index) topLayer = actionable[m];
                    }
                    sharedNull.moveBefore(topLayer);
                    created = 1;
                }
                for (var q = 0; q < actionable.length; q++) actionable[q].parent = sharedNull;
            }
        }

        app.endUndoGroup();

        var msg = "Done!\n\nNulls created:  " + created + "\nLayers skipped: " + skipped;
        if (skipped > 0) msg += "\n\n(Skipped layers already had a null parent, or were null layers.)";
        return "ok:" + msg;

    } catch (e: any) {
        return "err:" + e.toString();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Precomp
// ─────────────────────────────────────────────────────────────────────────────

function aePrecomp(): string {
    try {
        if (!app.project) return "err:No project is open.";
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return "err:Please select a composition first.";
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0) return "err:No layers are selected.";

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
        return "ok:Done!\n" + data.length + " layer(s) precomped individually.";

    } catch (e: any) {
        return "err:" + e.toString();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Move & Opacity
// ─────────────────────────────────────────────────────────────────────────────

function aeMoveOp(makePos: boolean, posDir: string, dis: number, frs: number, displaceFirst: boolean,
                  ease: boolean, makeOp: boolean, opMode: number, opFrs: number): string {
    try {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return "err:No active composition.";
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0) return "err:No layers are selected.";

        var t = comp.time;
        app.beginUndoGroup("Move & Opacity");

        for (var i = 0; i < sel.length; i++) {
            var layer = sel[i];

            if (makePos) {
                var endPos = t + (frs / comp.frameRate);
                var posProp = (layer.property("ADBE Transform Group") as PropertyGroup)
                    .property("ADBE Position") as Property;
                var orig: number[];
                try { orig = posProp.valueAtTime(t, false) as any; }
                catch (e2) { orig = posProp.value as any; }

                if (displaceFirst) {
                    posProp.setValueAtTime(t,      computeOffset(orig, posDir, dis, true)  as any);
                    posProp.setValueAtTime(endPos, orig as any);
                } else {
                    posProp.setValueAtTime(t,      orig as any);
                    posProp.setValueAtTime(endPos, computeOffset(orig, posDir, dis, false) as any);
                }

                if (ease) {
                    var easeObj  = new KeyframeEase(0, 100);
                    var startIdx = posProp.nearestKeyIndex(t);
                    var endIdx   = posProp.nearestKeyIndex(endPos);
                    var easeCandidates: KeyframeEase[][] = [
                        [easeObj, easeObj],
                        [easeObj, easeObj, easeObj],
                        [easeObj]
                    ];
                    for (var ec = 0; ec < easeCandidates.length; ec++) {
                        try {
                            var ea = easeCandidates[ec];
                            posProp.setTemporalEaseAtKey(startIdx, ea as any, ea as any);
                            posProp.setTemporalEaseAtKey(endIdx,   ea as any, ea as any);
                            break;
                        } catch (easeErr) {}
                    }
                }

                posProp.selected = true;
            }

            if (makeOp) {
                var endOp  = t + (opFrs / comp.frameRate);
                var opProp = (layer.property("ADBE Transform Group") as PropertyGroup)
                    .property("ADBE Opacity") as Property;
                var startVal = opMode === 1 ? 100 : 0;
                var endVal   = opMode === 1 ? 0   : 100;
                opProp.setValueAtTime(t,     startVal as any);
                opProp.setValueAtTime(endOp, endVal   as any);
            }
        }

        app.endUndoGroup();
        return "ok";

    } catch (e: any) {
        return "err:" + e.toString();
    }
}
