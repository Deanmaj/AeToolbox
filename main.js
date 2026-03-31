// ── Minimal CSInterface (evalScript bridge to ExtendScript) ──────────────────
var cs = {
  evalScript: function(script, callback) {
    if (typeof __adobe_cep__ !== 'undefined') {
      __adobe_cep__.evalScript(script, callback || function() {});
    } else {
      console.warn('[CEP] Not inside After Effects. Script:', script);
      if (callback) callback('err:Not running inside After Effects');
    }
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function showStatus(msg, isError) {
  // Simple status: use alert for now (can be replaced with a toast later)
  if (isError) alert('Error: ' + msg);
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var idx = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
    btn.classList.add('active');
    $('tab-' + idx).classList.add('active');
  });
});

// ── Segmented toggles ─────────────────────────────────────────────────────────

function makeSegmented(containerId, onChange) {
  var container = $(containerId);
  container.querySelectorAll('.seg').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('.seg').forEach(function(s) { s.classList.remove('active'); });
      btn.classList.add('active');
      if (onChange) onChange(parseInt(btn.dataset.index, 10));
    });
  });
  return {
    getValue: function() {
      var active = container.querySelector('.seg.active');
      return active ? parseInt(active.dataset.index, 10) : 0;
    }
  };
}

var modeToggle   = makeSegmented('mode-toggle', function(idx) {
  $('null-name').disabled = idx !== 1;
  $('assign-desc').textContent = idx === 1
    ? 'All selected layers share one null positioned at their average centre.'
    : 'Each layer gets its own null matched to its position.';
});

var opModeToggle = makeSegmented('op-mode-toggle', null);

// ── Checkboxes ────────────────────────────────────────────────────────────────

function makeCheckbox(boxId, defaultChecked, onChange) {
  var box = $(boxId);
  var checked = defaultChecked;
  if (checked) box.classList.add('checked');

  function toggle() {
    checked = !checked;
    box.classList.toggle('checked', checked);
    if (onChange) onChange(checked);
  }

  // click on the box itself
  box.addEventListener('click', function(e) { e.stopPropagation(); toggle(); });
  // click on the parent label row
  var row = box.closest('.check-row');
  if (row) row.addEventListener('click', function(e) {
    if (e.target !== box) toggle();
  });

  return { getValue: function() { return checked; } };
}

var skipNullsCb = makeCheckbox('skip-nulls-box', true, null);
var posCb = makeCheckbox('pos-box', true, function(checked) {
  $('pos-controls').style.opacity    = checked ? '1' : '0.4';
  $('pos-controls').style.pointerEvents = checked ? 'auto' : 'none';
});
var displaceCb  = makeCheckbox('displace-box', true, null);
var opCb = makeCheckbox('op-box', false, function(checked) {
  var ctrl = $('op-controls');
  ctrl.classList.toggle('enabled', checked);
});

// ── Direction pad ─────────────────────────────────────────────────────────────

var activeDir = 'right';

document.querySelectorAll('.dir-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.dir-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    activeDir = btn.dataset.dir;
  });
});

// ── Tab 1: Assign Null ────────────────────────────────────────────────────────

$('assign-btn').addEventListener('click', function() {
  var mode      = modeToggle.getValue() === 0 ? 'individual' : 'shared';
  var nullName  = $('null-name').value.trim() || 'Group_Null';
  var skipNulls = skipNullsCb.getValue() ? 'true' : 'false';

  cs.evalScript(
    'aeAssignNull("' + mode + '","' + nullName + '",' + skipNulls + ')',
    function(result) {
      if (!result || result.slice(0, 4) === 'err:') {
        showStatus(result ? result.slice(4) : 'Unknown error', true);
      } else {
        alert(result.slice(4)); // strips "ok: "
      }
    }
  );
});

// ── Tab 2: Precomp ────────────────────────────────────────────────────────────

$('precomp-btn').addEventListener('click', function() {
  cs.evalScript('aePrecomp()', function(result) {
    if (!result || result.slice(0, 4) === 'err:') {
      showStatus(result ? result.slice(4) : 'Unknown error', true);
    } else {
      alert(result.slice(4));
    }
  });
});

// ── Tab 3: Apply ─────────────────────────────────────────────────────────────

$('apply-btn').addEventListener('click', function() {
  var makePos     = posCb.getValue();
  var makeOp      = opCb.getValue();

  if (!makePos && !makeOp) {
    alert('Enable at least Position or Opacity.');
    return;
  }

  var dis     = parseFloat($('distance').value)   || 0;
  var frs     = parseInt($('pos-frames').value, 10) || 0;
  var opFrs   = parseInt($('op-frames').value,  10) || 0;
  var opMode  = opModeToggle.getValue();
  var displace = displaceCb.getValue();

  if (makePos && isNaN(dis))           { alert('Distance must be a number.');             return; }
  if (makePos && (isNaN(frs) || frs < 0)) { alert('Frames must be a non-negative integer.'); return; }
  if (makeOp  && (isNaN(opFrs) || opFrs < 0)) { alert('Opacity frames must be a non-negative integer.'); return; }

  var script = 'aeMoveOp('
    + (makePos ? 'true' : 'false') + ','
    + '"' + activeDir + '",'
    + dis + ','
    + frs + ','
    + (displace ? 'true' : 'false') + ','
    + (makeOp  ? 'true' : 'false') + ','
    + opMode + ','
    + opFrs
    + ')';

  cs.evalScript(script, function(result) {
    if (!result || result.slice(0, 4) === 'err:') {
      showStatus(result ? result.slice(4) : 'Unknown error', true);
    }
    // success is silent (keyframes were added)
  });
});
