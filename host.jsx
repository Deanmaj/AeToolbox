/// <reference path="./ae.d.ts" />
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function hasNullParent(layer) {
    return layer.parent !== null && layer.parent.nullLayer === true;
}
function isNull(layer) {
    return layer.nullLayer === true;
}
function findNullByName(comp, name) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        if (l.nullLayer && l.name === name)
            return l;
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
        if (layers[i].inPoint < t)
            t = layers[i].inPoint;
    }
    return t;
}
function latestOut(layers) {
    var t = layers[0].outPoint;
    for (var i = 1; i < layers.length; i++) {
        if (layers[i].outPoint > t)
            t = layers[i].outPoint;
    }
    return t;
}
function any3D(layers) {
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].threeDLayer)
            return true;
    }
    return false;
}
function makeNullLayer(comp, name, pos, inPt, outPt, threeD) {
    var n = comp.layers.addNull();
    n.name = name;
    n.inPoint = inPt;
    n.outPoint = outPt;
    n.threeDLayer = threeD;
    n.transform.position.setValue(pos);
    return n;
}
function computeOffset(original, dir, dis, opposite) {
    var r = original.slice();
    if (dir === "left")
        r[0] = opposite ? r[0] + dis : r[0] - dis;
    if (dir === "right")
        r[0] = opposite ? r[0] - dis : r[0] + dis;
    if (dir === "up")
        r[1] = opposite ? r[1] + dis : r[1] - dis;
    if (dir === "down")
        r[1] = opposite ? r[1] - dis : r[1] + dis;
    return r;
}
// ─────────────────────────────────────────────────────────────────────────────
// Assign Null
// ─────────────────────────────────────────────────────────────────────────────
function aeAssignNull(mode, nullName, skipNulls) {
    try {
        if (!app.project)
            return "err:No project is open.";
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem))
            return "err:Please select a composition first.";
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0)
            return "err:No layers are selected.";
        var layers = [];
        for (var i = 0; i < sel.length; i++)
            layers.push(sel[i]);
        app.beginUndoGroup("Assign Null to Selected Layers");
        var created = 0, skipped = 0;
        if (mode === "individual") {
            for (var j = 0; j < layers.length; j++) {
                var layer = layers[j];
                if (skipNulls && isNull(layer)) {
                    skipped++;
                    continue;
                }
                if (hasNullParent(layer)) {
                    skipped++;
                    continue;
                }
                var name = layer.name + "_Null";
                var n = findNullByName(comp, name);
                if (!n) {
                    var pos = layer.transform.position.value;
                    n = makeNullLayer(comp, name, pos, layer.inPoint, layer.outPoint, layer.threeDLayer);
                    n.moveAfter(layer);
                    created++;
                }
                layer.parent = n;
            }
        }
        else {
            var actionable = [];
            for (var k = 0; k < layers.length; k++) {
                var l = layers[k];
                if (skipNulls && isNull(l)) {
                    skipped++;
                    continue;
                }
                if (hasNullParent(l)) {
                    skipped++;
                    continue;
                }
                actionable.push(l);
            }
            if (actionable.length > 0) {
                var sharedNull = findNullByName(comp, nullName);
                if (!sharedNull) {
                    var avgPos = averagePosition(actionable);
                    sharedNull = makeNullLayer(comp, nullName, avgPos, earliestIn(actionable), latestOut(actionable), any3D(actionable));
                    var topLayer = actionable[0];
                    for (var m = 1; m < actionable.length; m++) {
                        if (actionable[m].index < topLayer.index)
                            topLayer = actionable[m];
                    }
                    sharedNull.moveBefore(topLayer);
                    created = 1;
                }
                for (var q = 0; q < actionable.length; q++)
                    actionable[q].parent = sharedNull;
            }
        }
        app.endUndoGroup();
        var msg = "Done!\n\nNulls created:  " + created + "\nLayers skipped: " + skipped;
        if (skipped > 0)
            msg += "\n\n(Skipped layers already had a null parent, or were null layers.)";
        return "ok:" + msg;
    }
    catch (e) {
        return "err:" + e.toString();
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Precomp
// ─────────────────────────────────────────────────────────────────────────────
function aePrecomp() {
    try {
        if (!app.project)
            return "err:No project is open.";
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem))
            return "err:Please select a composition first.";
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0)
            return "err:No layers are selected.";
        app.beginUndoGroup("Precomp Selected Layers Individually");
        var data = [];
        for (var i = 0; i < sel.length; i++) {
            data.push({ layer: sel[i], name: sel[i].name, index: sel[i].index, inPoint: sel[i].inPoint, outPoint: sel[i].outPoint });
        }
        for (var j = 0; j < data.length; j++) {
            var d = data[j];
            for (var k = 0; k < comp.numLayers; k++)
                comp.layer(k + 1).selected = false;
            d.layer.selected = true;
            var dur = d.outPoint - d.inPoint;
            if (dur <= 0)
                dur = comp.duration;
            comp.layers.precompose([d.layer.index], d.name, true);
            var newComp = null;
            for (var p = 1; p <= app.project.numItems; p++) {
                var item = app.project.item(p);
                if (item instanceof CompItem && item.name === d.name && item !== comp) {
                    if (newComp === null || item.id > newComp.id)
                        newComp = item;
                }
            }
            if (newComp !== null && dur > 0)
                newComp.duration = dur;
        }
        app.endUndoGroup();
        return "ok:Done!\n" + data.length + " layer(s) precomped individually.";
    }
    catch (e) {
        return "err:" + e.toString();
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Move & Opacity
// ─────────────────────────────────────────────────────────────────────────────
function aeMoveOp(makePos, posDir, dis, frs, displaceFirst, makeOp, opMode, opFrs) {
    try {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem))
            return "err:No active composition.";
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0)
            return "err:No layers are selected.";
        var t = comp.time;
        app.beginUndoGroup("Move & Opacity");
        for (var i = 0; i < sel.length; i++) {
            var layer = sel[i];
            if (makePos) {
                var endPos = t + (frs / comp.frameRate);
                var posProp = layer.property("ADBE Transform Group")
                    .property("ADBE Position");
                var orig;
                try {
                    orig = posProp.valueAtTime(t, false);
                }
                catch (e2) {
                    orig = posProp.value;
                }
                if (displaceFirst) {
                    posProp.setValueAtTime(t, computeOffset(orig, posDir, dis, true));
                    posProp.setValueAtTime(endPos, orig);
                }
                else {
                    posProp.setValueAtTime(t, orig);
                    posProp.setValueAtTime(endPos, computeOffset(orig, posDir, dis, false));
                }
                posProp.selected = true;
            }
            if (makeOp) {
                var endOp = t + (opFrs / comp.frameRate);
                var opProp = layer.property("ADBE Transform Group")
                    .property("ADBE Opacity");
                var startVal = opMode === 1 ? 100 : 0;
                var endVal = opMode === 1 ? 0 : 100;
                opProp.setValueAtTime(t, startVal);
                opProp.setValueAtTime(endOp, endVal);
            }
        }
        app.endUndoGroup();
        return "ok";
    }
    catch (e) {
        return "err:" + e.toString();
    }
}
