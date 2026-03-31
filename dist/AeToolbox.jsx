var __panelThis = this;
"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/AeToolbox.ts
  var require_AeToolbox = __commonJS({
    "src/AeToolbox.ts"() {
      var COLORS = {
        bg: [0.15, 0.15, 0.15, 1],
        bgLight: [0.2, 0.2, 0.2, 1],
        bgLighter: [0.25, 0.25, 0.25, 1],
        border: [0.3, 0.3, 0.3, 1],
        text: [0.85, 0.85, 0.85, 1],
        textDim: [0.5, 0.5, 0.5, 1],
        accent: [0.3, 0.6, 1, 1],
        accentHover: [0.4, 0.68, 1, 1],
        white: [1, 1, 1, 1],
        checkmark: [0.3, 0.6, 1, 1],
        transparent: [0, 0, 0, 0]
      };
      var PANEL_MARGINS = 12;
      var SECTION_SPACING = 10;
      var CONTROL_SPACING = 6;
      var BUTTON_HEIGHT = 28;
      var INPUT_HEIGHT = 22;
      var TAB_HEIGHT = 28;
      function drawRoundedRect(g, brush, width, height, radius, x, y) {
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
      function CustomButton(parent, text, options) {
        const opts = options || {};
        const btn = parent.add("customButton", void 0, "");
        btn.preferredSize = [opts.width || -1, opts.height || BUTTON_HEIGHT];
        btn.text = text;
        btn._isAccent = opts.isAccent || false;
        function redraw(hover) {
          const g = btn.graphics;
          const fillColor = btn._isAccent ? hover ? COLORS.accentHover : COLORS.accent : hover ? COLORS.bgLighter : COLORS.bgLight;
          const textColor = btn._isAccent ? COLORS.white : COLORS.text;
          const fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, fillColor);
          const textPen = g.newPen(g.PenType.SOLID_COLOR, textColor, 1);
          btn.onDraw = function() {
            const sz = this.size;
            const ts = g.measureString(btn.text);
            drawRoundedRect(g, fillBrush, sz.width, sz.height, 4, 0, 0);
            g.drawString(
              btn.text,
              textPen,
              (sz.width - ts.width) / 2,
              (sz.height - ts.height) / 2
            );
          };
        }
        redraw(false);
        btn.addEventListener("mouseover", function() {
          redraw(true);
          btn.notify("onDraw");
        });
        btn.addEventListener("mouseout", function() {
          redraw(false);
          btn.notify("onDraw");
        });
        return btn;
      }
      function CustomCheckbox(parent, text, defaultValue) {
        const grp = parent.add("group");
        grp.orientation = "row";
        grp.spacing = 6;
        grp.alignment = ["left", "center"];
        const box = grp.add("customButton", void 0, "");
        box.preferredSize = [16, 16];
        box._checked = defaultValue || false;
        const lbl = grp.add("statictext", void 0, text);
        lbl.graphics.foregroundColor = lbl.graphics.newPen(lbl.graphics.PenType.SOLID_COLOR, COLORS.text, 1);
        function redraw() {
          const g = box.graphics;
          const bgBrush = g.newBrush(g.BrushType.SOLID_COLOR, box._checked ? COLORS.checkmark : COLORS.bgLight);
          const checkPen = g.newPen(g.PenType.SOLID_COLOR, COLORS.white, 2);
          box.onDraw = function() {
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
        function toggle() {
          box._checked = !box._checked;
          redraw();
          box.notify("onDraw");
          if (grp.onValueChange) grp.onValueChange();
        }
        box.addEventListener("click", toggle);
        lbl.addEventListener("click", toggle);
        redraw();
        grp.getValue = function() {
          return box._checked;
        };
        grp.setValue = function(v) {
          box._checked = v;
          redraw();
          box.notify("onDraw");
        };
        grp._box = box;
        return grp;
      }
      function SegmentedToggle(parent, labels, defaultIndex) {
        const grp = parent.add("group");
        grp.orientation = "row";
        grp.spacing = 0;
        grp._selectedIndex = defaultIndex || 0;
        grp._buttons = [];
        for (let i = 0; i < labels.length; i++) {
          (function(idx) {
            const seg = grp.add("customButton", void 0, "");
            const labelLen = labels[idx].length;
            seg.preferredSize = [labelLen > 6 ? 80 : 60, 24];
            seg.text = labels[idx];
            function redraw() {
              const g = seg.graphics;
              const isActive = grp._selectedIndex === idx;
              const fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, isActive ? COLORS.accent : COLORS.bgLight);
              const textPen = g.newPen(g.PenType.SOLID_COLOR, isActive ? COLORS.white : COLORS.textDim, 1);
              seg.onDraw = function() {
                const sz = this.size;
                const ts = g.measureString(seg.text);
                drawRoundedRect(g, fillBrush, sz.width, sz.height, 4, 0, 0);
                g.drawString(
                  seg.text,
                  textPen,
                  (sz.width - ts.width) / 2,
                  (sz.height - ts.height) / 2
                );
              };
            }
            seg.addEventListener("click", function() {
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
        grp.getValue = function() {
          return grp._selectedIndex;
        };
        grp.setValue = function(idx) {
          grp._selectedIndex = idx;
          for (let j = 0; j < grp._buttons.length; j++) {
            grp._buttons[j]._redraw();
            grp._buttons[j].notify("onDraw");
          }
        };
        return grp;
      }
      function SectionLabel(parent, text) {
        const lbl = parent.add("statictext", void 0, text);
        lbl.graphics.font = ScriptUI.newFont("dialog", "BOLD", 10);
        lbl.graphics.foregroundColor = lbl.graphics.newPen(lbl.graphics.PenType.SOLID_COLOR, COLORS.textDim, 1);
        return lbl;
      }
      function Separator(parent) {
        const sep = parent.add("customView", void 0, "");
        sep.preferredSize = [-1, 1];
        sep.onDraw = function() {
          const g = this.graphics;
          const pen = g.newPen(g.PenType.SOLID_COLOR, COLORS.border, 1);
          g.newPath();
          g.moveTo(0, 0);
          g.lineTo(this.size.width, 0);
          g.strokePath(pen);
        };
        return sep;
      }
      function DirectionPad(parent) {
        const container = parent.add("group");
        container.orientation = "column";
        container.spacing = 2;
        container.alignment = ["center", "center"];
        const directions = ["up", "left", "right", "down"];
        const arrows = {
          up: "\u25B2",
          down: "\u25BC",
          left: "\u25C4",
          right: "\u25BA"
        };
        let activeDir = "right";
        const btns = {};
        function makeArrowBtn(rowParent, dir) {
          const btn = rowParent.add("customButton", void 0, "");
          btn.preferredSize = [28, 22];
          function redraw() {
            const g = btn.graphics;
            const isActive = activeDir === dir;
            const fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, isActive ? COLORS.accent : COLORS.bgLight);
            const arrowPen = g.newPen(g.PenType.SOLID_COLOR, isActive ? COLORS.white : COLORS.textDim, 1);
            btn.onDraw = function() {
              const sz = this.size;
              const label = arrows[dir];
              const ts = g.measureString(label);
              drawRoundedRect(g, fillBrush, sz.width, sz.height, 3, 0, 0);
              g.drawString(
                label,
                arrowPen,
                (sz.width - ts.width) / 2,
                (sz.height - ts.height) / 2
              );
            };
          }
          btn.addEventListener("click", function() {
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
        const row1 = container.add("group");
        row1.orientation = "row";
        row1.alignment = ["center", "center"];
        makeArrowBtn(row1, "up");
        const row2 = container.add("group");
        row2.orientation = "row";
        row2.spacing = 4;
        row2.alignment = ["center", "center"];
        makeArrowBtn(row2, "left");
        makeArrowBtn(row2, "right");
        const row3 = container.add("group");
        row3.orientation = "row";
        row3.alignment = ["center", "center"];
        makeArrowBtn(row3, "down");
        container.getValue = function() {
          return activeDir;
        };
        container.setValue = function(dir) {
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
      function StyledInput(parent, defaultText, width) {
        const input = parent.add("edittext", void 0, defaultText);
        input.preferredSize = [width, INPUT_HEIGHT];
        input.graphics.backgroundColor = input.graphics.newBrush(
          input.graphics.BrushType.SOLID_COLOR,
          COLORS.bgLight
        );
        input.graphics.foregroundColor = input.graphics.newPen(
          input.graphics.PenType.SOLID_COLOR,
          COLORS.text,
          1
        );
        return input;
      }
      function hasNullParent(layer) {
        return layer.parent !== null && layer.parent.nullLayer === true;
      }
      function isNull(layer) {
        return layer.nullLayer === true;
      }
      function findNullByName(comp, name) {
        for (let i = 1; i <= comp.numLayers; i++) {
          const l = comp.layer(i);
          if (l.nullLayer && l.name === name) return l;
        }
        return null;
      }
      function averagePosition(layers) {
        let sumX = 0, sumY = 0;
        for (let i = 0; i < layers.length; i++) {
          const p = layers[i].transform.position.value;
          sumX += p[0];
          sumY += p[1];
        }
        return [sumX / layers.length, sumY / layers.length];
      }
      function earliestIn(layers) {
        let t = layers[0].inPoint;
        for (let i = 1; i < layers.length; i++) {
          if (layers[i].inPoint < t) t = layers[i].inPoint;
        }
        return t;
      }
      function latestOut(layers) {
        let t = layers[0].outPoint;
        for (let i = 1; i < layers.length; i++) {
          if (layers[i].outPoint > t) t = layers[i].outPoint;
        }
        return t;
      }
      function any3D(layers) {
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].threeDLayer) return true;
        }
        return false;
      }
      function makeNull(comp, name, pos, inPt, outPt, threeD) {
        const n = comp.layers.addNull();
        n.name = name;
        n.inPoint = inPt;
        n.outPoint = outPt;
        n.threeDLayer = threeD;
        n.transform.position.setValue(pos);
        return n;
      }
      function runIndividual(comp, layers, skipNullLayers) {
        let created = 0, skipped = 0;
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          if (skipNullLayers && isNull(layer)) {
            skipped++;
            continue;
          }
          if (hasNullParent(layer)) {
            skipped++;
            continue;
          }
          const name = layer.name + "_Null";
          let n = findNullByName(comp, name);
          if (!n) {
            const pos = layer.transform.position.value;
            n = makeNull(comp, name, pos, layer.inPoint, layer.outPoint, layer.threeDLayer);
            n.moveAfter(layer);
            created++;
          }
          layer.parent = n;
        }
        return { created, skipped };
      }
      function runShared(comp, layers, nullName, skipNullLayers) {
        const actionable = [];
        let skipped = 0;
        for (let i = 0; i < layers.length; i++) {
          const l = layers[i];
          if (skipNullLayers && isNull(l)) {
            skipped++;
            continue;
          }
          if (hasNullParent(l)) {
            skipped++;
            continue;
          }
          actionable.push(l);
        }
        if (actionable.length === 0) return { created: 0, skipped };
        let n = findNullByName(comp, nullName);
        let created = 0;
        if (!n) {
          const pos = averagePosition(actionable);
          const inPt = earliestIn(actionable);
          const outPt = latestOut(actionable);
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
      function runPrecomp(comp) {
        const selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
          alert("No layers are selected. Please select at least one layer.");
          return;
        }
        app.beginUndoGroup("Precomp Selected Layers Individually");
        const compDuration = comp.duration;
        const layerData = [];
        for (let i = 0; i < selectedLayers.length; i++) {
          const layer = selectedLayers[i];
          layerData.push({
            layer,
            name: layer.name,
            index: layer.index,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint
          });
        }
        for (let j = 0; j < layerData.length; j++) {
          const data = layerData[j];
          const layer = data.layer;
          for (let k = 0; k < comp.numLayers; k++) {
            comp.layer(k + 1).selected = false;
          }
          layer.selected = true;
          let precompDuration = data.outPoint - data.inPoint;
          if (precompDuration <= 0) precompDuration = compDuration;
          comp.layers.precompose([layer.index], data.name, true);
          let newPrecomp = null;
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
      function computeOffset(original, dir, dis, opposite) {
        if (original.length >= 2) {
          const result = original.slice();
          if (dir === "left") result[0] = opposite ? result[0] + dis : result[0] - dis;
          if (dir === "right") result[0] = opposite ? result[0] - dis : result[0] + dis;
          if (dir === "up") result[1] = opposite ? result[1] + dis : result[1] - dis;
          if (dir === "down") result[1] = opposite ? result[1] - dis : result[1] + dis;
          return result;
        }
        return original;
      }
      function applyMoveOp(opts) {
        const comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
          alert("No active composition.");
          return;
        }
        const sel = comp.selectedLayers;
        if (!sel || sel.length === 0) {
          alert("No layers selected.");
          return;
        }
        const t = comp.time;
        app.beginUndoGroup("Move&Opacity");
        for (let i = 0; i < sel.length; i++) {
          const layer = sel[i];
          if (opts.makePos) {
            const endTimePos = t + opts.frs / comp.frameRate;
            const posProp = layer.property("ADBE Transform Group").property("ADBE Position");
            let original;
            try {
              original = posProp.valueAtTime(t, false);
            } catch (e) {
              original = posProp.value;
            }
            if (opts.displaceFirst) {
              const displaced = computeOffset(original, opts.posDir, opts.dis, true);
              posProp.setValueAtTime(t, displaced);
              posProp.setValueAtTime(endTimePos, original);
            } else {
              const moved = computeOffset(original, opts.posDir, opts.dis, false);
              posProp.setValueAtTime(t, original);
              posProp.setValueAtTime(endTimePos, moved);
            }
            if (opts.applyEase) {
              const startIdx = posProp.nearestKeyIndex(t);
              const endIdx = posProp.nearestKeyIndex(endTimePos);
              const easeObj = new KeyframeEase(0, 100);
              const dims = posProp.value.length;
              const easeArr = [];
              for (let d = 0; d < dims; d++) easeArr.push(easeObj);
              posProp.setTemporalEaseAtKey(startIdx, easeArr, easeArr);
              posProp.setTemporalEaseAtKey(endIdx, easeArr, easeArr);
            }
            posProp.selected = true;
          }
          if (opts.makeOp) {
            const endTimeOp = t + opts.opFrs / comp.frameRate;
            const opProp = layer.property("ADBE Transform Group").property("ADBE Opacity");
            const startOp = opts.opMode === "0\u21920" ? 100 : 0;
            const endOp = opts.opMode === "0\u21920" ? 0 : 100;
            opProp.setValueAtTime(t, startOp);
            opProp.setValueAtTime(endTimeOp, endOp);
          }
        }
        app.endUndoGroup();
      }
      function buildUI(thisObj) {
        const win = thisObj instanceof Panel ? thisObj : new Window("palette", "AE Toolbox", void 0, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = PANEL_MARGINS;
        win.spacing = 0;
        const wg = win.graphics;
        wg.backgroundColor = wg.newBrush(wg.BrushType.SOLID_COLOR, COLORS.bg);
        const tabBar = win.add("group");
        tabBar.orientation = "row";
        tabBar.alignment = ["fill", "top"];
        tabBar.spacing = 0;
        tabBar.margins = [0, 0, 0, 0];
        const tabNames = ["Assign Null", "Precomp", "Move"];
        const tabBtns = [];
        const tabContents = [];
        let activeTab = 0;
        const contentGrp = win.add("group");
        contentGrp.orientation = "stack";
        contentGrp.alignment = ["fill", "fill"];
        contentGrp.alignChildren = ["fill", "top"];
        const tab1 = contentGrp.add("group");
        tab1.orientation = "column";
        tab1.alignChildren = ["fill", "top"];
        tab1.spacing = SECTION_SPACING;
        tab1.margins = [0, SECTION_SPACING, 0, 0];
        tabContents.push(tab1);
        SectionLabel(tab1, "MODE");
        const modeToggle = SegmentedToggle(tab1, ["Individual", "Shared"], 0);
        const nullNameRow = tab1.add("group");
        nullNameRow.orientation = "row";
        nullNameRow.alignChildren = ["left", "center"];
        nullNameRow.spacing = CONTROL_SPACING;
        const nullNameLabel = nullNameRow.add("statictext", void 0, "Name:");
        nullNameLabel.graphics.foregroundColor = nullNameLabel.graphics.newPen(
          nullNameLabel.graphics.PenType.SOLID_COLOR,
          COLORS.textDim,
          1
        );
        const nullNameInput = StyledInput(nullNameRow, "Group_Null", 120);
        nullNameInput.enabled = false;
        SectionLabel(tab1, "OPTIONS");
        const skipNullCb = CustomCheckbox(tab1, "Skip null layers", true);
        skipNullCb.helpTip = "When checked, null layers in the selection are left alone.";
        const descText = tab1.add("statictext", void 0, "Each layer gets its own null\nmatched to its position.", { multiline: true });
        descText.graphics.foregroundColor = descText.graphics.newPen(
          descText.graphics.PenType.SOLID_COLOR,
          COLORS.textDim,
          1
        );
        Separator(tab1);
        const assignBtn = CustomButton(tab1, "Assign Null", { isAccent: true });
        assignBtn.helpTip = "Parent selected layers to null objects.";
        modeToggle.onChange = function() {
          const isShared = modeToggle.getValue() === 1;
          nullNameInput.enabled = isShared;
          descText.text = isShared ? "All selected layers share one null\npositioned at their average centre." : "Each layer gets its own null\nmatched to its position.";
        };
        assignBtn.addEventListener("click", function() {
          if (!app.project) {
            alert("No project is open.");
            return;
          }
          const comp = app.project.activeItem;
          if (!(comp instanceof CompItem)) {
            alert("Please select a composition first.");
            return;
          }
          const selected = comp.selectedLayers;
          if (selected.length === 0) {
            alert("No layers selected.");
            return;
          }
          const layers = [];
          for (let i = 0; i < selected.length; i++) layers.push(selected[i]);
          app.beginUndoGroup("Assign Null to Selected Layers");
          const skipNulls = skipNullCb.getValue();
          let result;
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
        const tab2 = contentGrp.add("group");
        tab2.orientation = "column";
        tab2.alignChildren = ["fill", "top"];
        tab2.spacing = SECTION_SPACING;
        tab2.margins = [0, SECTION_SPACING, 0, 0];
        tab2.visible = false;
        tabContents.push(tab2);
        const precompDesc = tab2.add(
          "statictext",
          void 0,
          "Precomps each selected layer into its own individual composition, using the layer name as the precomp name.",
          { multiline: true }
        );
        precompDesc.graphics.foregroundColor = precompDesc.graphics.newPen(
          precompDesc.graphics.PenType.SOLID_COLOR,
          COLORS.textDim,
          1
        );
        Separator(tab2);
        const precompBtn = CustomButton(tab2, "Precomp Individually", { isAccent: true });
        precompBtn.helpTip = "Precomp each selected layer into its own composition.";
        precompBtn.addEventListener("click", function() {
          if (!app.project) {
            alert("No project is open.");
            return;
          }
          const comp = app.project.activeItem;
          if (!(comp instanceof CompItem)) {
            alert("Please select a composition first.");
            return;
          }
          runPrecomp(comp);
        });
        const tab3 = contentGrp.add("group");
        tab3.orientation = "column";
        tab3.alignChildren = ["fill", "top"];
        tab3.spacing = SECTION_SPACING;
        tab3.margins = [0, SECTION_SPACING, 0, 0];
        tab3.visible = false;
        tabContents.push(tab3);
        const posCb = CustomCheckbox(tab3, "Position", true);
        posCb.helpTip = "Enable position keyframing.";
        const posControls = tab3.add("group");
        posControls.orientation = "column";
        posControls.alignChildren = ["fill", "top"];
        posControls.spacing = CONTROL_SPACING;
        const dirPad = DirectionPad(posControls);
        dirPad.alignment = ["center", "top"];
        const distRow = posControls.add("group");
        distRow.orientation = "row";
        distRow.alignChildren = ["left", "center"];
        distRow.spacing = CONTROL_SPACING;
        const distLabel = distRow.add("statictext", void 0, "Distance:");
        distLabel.graphics.foregroundColor = distLabel.graphics.newPen(
          distLabel.graphics.PenType.SOLID_COLOR,
          COLORS.textDim,
          1
        );
        const distInput = StyledInput(distRow, "50", 55);
        distInput.helpTip = "Pixels to move the layer.";
        const frsRow = posControls.add("group");
        frsRow.orientation = "row";
        frsRow.alignChildren = ["left", "center"];
        frsRow.spacing = CONTROL_SPACING;
        const frsLabel = frsRow.add("statictext", void 0, "Frames:  ");
        frsLabel.graphics.foregroundColor = frsLabel.graphics.newPen(
          frsLabel.graphics.PenType.SOLID_COLOR,
          COLORS.textDim,
          1
        );
        const frsInput = StyledInput(frsRow, "10", 55);
        frsInput.helpTip = "Duration of the position animation in frames.";
        const displaceCb = CustomCheckbox(posControls, "Displace (start offset, animate to position)", true);
        displaceCb.helpTip = "Checked: layer starts displaced and animates to its current position. Unchecked: layer starts at its current position and animates away.";
        const easeCb = CustomCheckbox(posControls, "Ease (1, 0, 0, 1)", false);
        easeCb.helpTip = "Apply strong ease-in-out (cubic bezier 1,0,0,1) to position keyframes.";
        Separator(tab3);
        const opCb = CustomCheckbox(tab3, "Opacity", false);
        opCb.helpTip = "Enable opacity keyframing.";
        const opControls = tab3.add("group");
        opControls.orientation = "column";
        opControls.alignChildren = ["fill", "top"];
        opControls.spacing = CONTROL_SPACING;
        opControls.enabled = false;
        const opModeRow = opControls.add("group");
        opModeRow.orientation = "row";
        opModeRow.alignChildren = ["left", "center"];
        opModeRow.spacing = CONTROL_SPACING;
        const opModeLabel = opModeRow.add("statictext", void 0, "Mode:");
        opModeLabel.graphics.foregroundColor = opModeLabel.graphics.newPen(
          opModeLabel.graphics.PenType.SOLID_COLOR,
          COLORS.textDim,
          1
        );
        const opModeToggle = SegmentedToggle(opModeRow, ["0\u2192100", "100\u21920"], 0);
        const opFrsRow = opControls.add("group");
        opFrsRow.orientation = "row";
        opFrsRow.alignChildren = ["left", "center"];
        opFrsRow.spacing = CONTROL_SPACING;
        const opFrsLabel = opFrsRow.add("statictext", void 0, "Frames:  ");
        opFrsLabel.graphics.foregroundColor = opFrsLabel.graphics.newPen(
          opFrsLabel.graphics.PenType.SOLID_COLOR,
          COLORS.textDim,
          1
        );
        const opFrsInput = StyledInput(opFrsRow, "10", 55);
        Separator(tab3);
        const applyBtn = CustomButton(tab3, "Apply", { isAccent: true });
        applyBtn.helpTip = "Apply position and/or opacity keyframes to selected layers.";
        posCb.onValueChange = function() {
          posControls.enabled = posCb.getValue();
        };
        opCb.onValueChange = function() {
          opControls.enabled = opCb.getValue();
        };
        function doApply() {
          const makePos = posCb.getValue();
          const makeOp = opCb.getValue();
          if (!makePos && !makeOp) {
            alert("Enable at least one of Position or Opacity.");
            return;
          }
          let dis = 0, frs = 0, opFrs = 0;
          if (makePos) {
            dis = parseFloat(distInput.text);
            frs = parseInt(frsInput.text, 10);
            if (isNaN(dis)) {
              alert("Distance must be a valid number.");
              return;
            }
            if (isNaN(frs) || frs < 0) {
              alert("Frames must be a non-negative integer.");
              return;
            }
          }
          if (makeOp) {
            opFrs = parseInt(opFrsInput.text, 10);
            if (isNaN(opFrs) || opFrs < 0) {
              alert("Opacity frames must be a non-negative integer.");
              return;
            }
          }
          applyMoveOp({
            makePos,
            posDir: dirPad.getValue(),
            dis,
            frs,
            displaceFirst: displaceCb.getValue(),
            applyEase: easeCb.getValue(),
            makeOp,
            opMode: opModeToggle.getValue() === 1 ? "0\u21920" : "0\u2192100",
            opFrs
          });
        }
        applyBtn.addEventListener("click", doApply);
        win.addEventListener("keydown", function(e) {
          if (e.keyName === "Enter") doApply();
        });
        function switchTab(index) {
          activeTab = index;
          for (let i = 0; i < tabContents.length; i++) {
            tabContents[i].visible = i === index;
          }
          for (let j = 0; j < tabBtns.length; j++) {
            tabBtns[j]._redraw();
            tabBtns[j].notify("onDraw");
          }
        }
        for (let i = 0; i < tabNames.length; i++) {
          (function(idx) {
            const tb = tabBar.add("customButton", void 0, "");
            tb.preferredSize = [-1, TAB_HEIGHT];
            tb.text = tabNames[idx];
            function redraw() {
              const g = tb.graphics;
              const isActive = activeTab === idx;
              const fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, isActive ? COLORS.bgLighter : COLORS.bg);
              const textPen = g.newPen(g.PenType.SOLID_COLOR, isActive ? COLORS.text : COLORS.textDim, 1);
              const accentPen = g.newPen(g.PenType.SOLID_COLOR, COLORS.accent, 2);
              tb.onDraw = function() {
                const sz = this.size;
                const ts = g.measureString(tb.text);
                drawRoundedRect(g, fillBrush, sz.width, sz.height, 0, 0, 0);
                g.drawString(
                  tb.text,
                  textPen,
                  (sz.width - ts.width) / 2,
                  (sz.height - ts.height) / 2
                );
                if (isActive) {
                  g.newPath();
                  g.moveTo(0, sz.height - 2);
                  g.lineTo(sz.width, sz.height - 2);
                  g.strokePath(accentPen);
                }
              };
            }
            tb.addEventListener("click", function() {
              switchTab(idx);
            });
            tb._redraw = redraw;
            redraw();
            tabBtns.push(tb);
          })(i);
        }
        win.onResizing = win.onResize = function() {
          win.layout.resize();
        };
        if (win instanceof Window) {
          win.center();
          win.show();
        } else {
          win.layout.layout(true);
        }
      }
      buildUI(__panelThis);
    }
  });
  require_AeToolbox();
})();
