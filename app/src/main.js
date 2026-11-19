// Wires the Vice Sunset cover maker: photo uploads, per-panel crop/position,
// layout and colour-grade pickers, live preview and one-click PNG export.
// Photos are read on the user's own machine and never uploaded anywhere.
// A `?shot=` query sets up a fixed scene for screenshots (./shots.js);
// `?demo=1` auto-loads the bundled sample photos.
import { LAYOUTS, GRADES, SIZES, freshTransform, drawCoverArt } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const taglineInput = document.getElementById('tagline');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const panelList = document.getElementById('panels');
const layoutRow = document.getElementById('layouts');
const gradeRow = document.getElementById('grades');
const sizeRow = document.getElementById('sizes');

/** The live cover state: one photo and transform per panel slot. */
export const state = {
  layout: 'trio',
  grade: 'sunset',
  size: 'square',
  title: 'Sunset Heist',
  subtitle: 'A Vice City Story',
  tagline: 'Coming soon · Neon Nights',
  photos: [null, null, null, null],
  transforms: [freshTransform(), freshTransform(), freshTransform(), freshTransform()],
};
let selectedPanel = 0;

function panelCount() {
  return LAYOUTS[state.layout].panels.length;
}

/** Redraws the preview canvas at the chosen export aspect ratio. */
export function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCoverArt(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}

/** Loads an image from a user-picked file into panel `index`. */
export async function loadFileIntoPanel(file, index) {
  if (!file) return;
  state.photos[index] = await loadImage(URL.createObjectURL(file));
  state.transforms[index] = freshTransform();
  syncPanelControls();
  redraw();
}

/** Rebuilds the per-panel upload buttons for the current layout. */
function buildPanelButtons() {
  panelList.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const wrap = document.createElement('div');
    wrap.className = 'panel-slot';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-pick' + (i === selectedPanel ? ' active' : '');
    btn.textContent = state.photos[i] ? `Panel ${i + 1} ✓ photo` : `Panel ${i + 1} · add photo`;
    btn.addEventListener('click', () => {
      selectedPanel = i;
      syncPanelControls();
      buildPanelButtons();
      redraw();
    });
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.hidden = true;
    input.addEventListener('change', async (e) => {
      await loadFileIntoPanel(e.target.files[0], i);
      buildPanelButtons();
    });
    const upload = document.createElement('button');
    upload.type = 'button';
    upload.className = 'panel-upload';
    upload.textContent = 'Upload…';
    upload.addEventListener('click', () => input.click());
    wrap.append(btn, upload, input);
    panelList.append(wrap);
  }
}

/** Syncs the zoom/pan sliders with the selected panel's transform. */
function syncPanelControls() {
  const t = state.transforms[selectedPanel];
  zoomInput.value = String(t.zoom);
  panXInput.value = String(t.dx);
  panYInput.value = String(t.dy);
  document.getElementById('panel-label').textContent = `Panel ${selectedPanel + 1} — drag the preview to move it, scroll to zoom`;
}

function buildPicker(row, entries, current, onPick) {
  row.innerHTML = '';
  for (const [key, entry] of Object.entries(entries)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (key === current ? ' active' : '');
    btn.textContent = entry.label;
    btn.addEventListener('click', () => {
      onPick(key);
      buildPicker(row, entries, key, onPick);
    });
    row.append(btn);
  }
}

function buildLayoutPicker() {
  buildPicker(layoutRow, LAYOUTS, state.layout, (key) => {
    state.layout = key;
    selectedPanel = 0;
    syncPanelControls();
    buildPanelButtons();
    redraw();
  });
}

function buildGradePicker() {
  buildPicker(gradeRow, GRADES, state.grade, (key) => {
    state.grade = key;
    redraw();
  });
}

function buildSizePicker() {
  buildPicker(sizeRow, SIZES, state.size, (key) => {
    state.size = key;
    redraw();
  });
}

/** Fills every panel with the same photo (one photo, several panels). */
export function fillAllPanels(photo) {
  for (let i = 0; i < 4; i++) {
    state.photos[i] = photo;
    state.transforms[i] = freshTransform();
  }
  buildPanelButtons();
  redraw();
}

/** Exports the cover at the chosen size as a PNG download. */
export function exportCover() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCoverArt(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-sunset-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-sunset-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
}

// --- text inputs: live preview on every keystroke ---
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });

// --- crop / position controls for the selected panel ---
zoomInput.addEventListener('input', () => {
  state.transforms[selectedPanel].zoom = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  state.transforms[selectedPanel].dx = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  state.transforms[selectedPanel].dy = Number(panYInput.value);
  redraw();
});
document.getElementById('reset-panel').addEventListener('click', () => {
  state.transforms[selectedPanel] = freshTransform();
  syncPanelControls();
  redraw();
});

// --- drag to pan, scroll to zoom, on the preview itself ---
let dragging = false;
let lastX = 0;
let lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const t = state.transforms[selectedPanel];
  t.dx += (e.clientX - lastX) / rect.width;
  t.dy += (e.clientY - lastY) / rect.height;
  lastX = e.clientX;
  lastY = e.clientY;
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const t = state.transforms[selectedPanel];
  t.zoom = Math.min(3, Math.max(1, t.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  syncPanelControls();
  redraw();
}, { passive: false });

// --- one-photo, samples and export buttons ---
document.getElementById('one-photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  fillAllPanels(await loadImage(URL.createObjectURL(file)));
});
document.getElementById('samples').addEventListener('click', async () => {
  const pier = await loadImage('samples/pier.jpg');
  const boulevard = await loadImage('samples/boulevard.jpg');
  state.photos[0] = pier;
  state.photos[1] = boulevard;
  state.photos[2] = pier;
  state.photos[3] = boulevard;
  state.transforms = state.transforms.map(() => freshTransform());
  buildPanelButtons();
  redraw();
  status.textContent = 'Sample photos loaded — replace any panel with your own.';
});
document.getElementById('export').addEventListener('click', exportCover);

// --- boot: pickers, panels, then demo / shot scene or a plain redraw ---
buildLayoutPicker();
buildGradePicker();
buildSizePicker();
buildPanelButtons();
syncPanelControls();

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  // A shot scene may also pin the layout, grade and export size in the URL.
  if (LAYOUTS[query.get('layout')]) state.layout = query.get('layout');
  if (GRADES[query.get('grade')]) state.grade = query.get('grade');
  if (SIZES[query.get('size')]) state.size = query.get('size');
  buildLayoutPicker();
  buildGradePicker();
  buildSizePicker();
  runShot(query.get('shot'), query, async (photos, text) => {
    state.photos = photos;
    state.title = text;
    titleInput.value = text;
    buildPanelButtons();
    redraw();
  });
} else if (query.get('demo') === '1') {
  document.getElementById('samples').click();
  window.__shotReady = true;
} else {
  redraw();
}
