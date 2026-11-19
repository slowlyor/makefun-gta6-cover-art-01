// main.js — the Vice Cover Studio editor.
//
// Wires the controls to the cover engine in cover.js: photos in, panels
// arranged, caption edited, PNG out. Photos are read on this machine only
// (FileReader / canvas) and never uploaded anywhere.

import { SIZES, LAYOUTS, GRADES, layoutPanels, drawCover, panelCount } from './cover.js';
import { SAMPLES } from './samples.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'); // "cover" | "editor" | null

const state = {
  size: params.get('size') || 'wide',
  layout: params.get('layout') || 'hero',
  grade: params.get('grade') || 'sunset',
  title: params.get('caption') || 'NEON COAST',
  subtitle: params.get('subtitle') || 'a neon coast story',
  badge: 'EST. 2026',
  photos: [], // { img, name }
  panels: [], // { photo, zoom, ox, oy } — photo is an index into state.photos
  selected: 0,
};

function resetPanels() {
  const n = panelCount(state.layout);
  state.panels = Array.from({ length: n }, (_, i) => ({
    photo: state.photos.length ? i % state.photos.length : -1,
    zoom: 1,
    ox: 0,
    oy: 0,
  }));
  state.selected = 0;
}

function coverState() {
  return {
    layout: state.layout,
    grade: state.grade,
    title: state.title.toUpperCase(),
    subtitle: state.subtitle,
    badge: state.badge,
    panels: state.panels.map((p) => ({
      img: p.photo >= 0 ? state.photos[p.photo]?.img ?? null : null,
      zoom: p.zoom,
      ox: p.ox,
      oy: p.oy,
    })),
  };
}

function loadSamplePhotos() {
  state.photos = SAMPLES.map((s) => ({ img: s.make(), name: s.label }));
  resetPanels();
}

// ---- rendering -------------------------------------------------------------

const preview = document.getElementById('preview');
const pctx = preview.getContext('2d');

function renderPreview() {
  const { w, h } = SIZES[state.size];
  const scale = Math.min(920 / w, 620 / h);
  preview.width = Math.round(w * scale);
  preview.height = Math.round(h * scale);
  pctx.save();
  pctx.scale(scale, scale);
  drawCover(pctx, coverState(), w, h);
  pctx.restore();
  // Selected panel outline.
  const panels = layoutPanels(state.layout, preview.width, preview.height)
    .filter((p) => p.kind === 'photo');
  const sel = panels[state.selected];
  if (sel && SHOT !== 'cover') {
    pctx.save();
    pctx.strokeStyle = '#00e5ff';
    pctx.lineWidth = 3;
    pctx.setLineDash([10, 6]);
    pctx.strokeRect(sel.x + 1.5, sel.y + 1.5, sel.w - 3, sel.h - 3);
    pctx.restore();
  }
}

function renderCoverCanvas() {
  const { w, h } = SIZES[state.size];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  drawCover(c.getContext('2d'), coverState(), w, h);
  return c;
}

// ---- editor UI -------------------------------------------------------------

const $ = (id) => document.getElementById(id);

function buildButtons(container, entries, current, onPick) {
  const el = $(container);
  el.innerHTML = '';
  for (const [id, def] of Object.entries(entries)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (id === current ? ' on' : '');
    b.textContent = def.label;
    b.title = def.blurb || def.label;
    b.addEventListener('click', () => {
      onPick(id);
      buildButtons(container, entries, id, onPick);
    });
    el.appendChild(b);
  }
}

function refreshOptionButtons() {
  buildButtons('layoutRow', LAYOUTS, state.layout, (id) => {
    state.layout = id;
    resetPanels();
    syncPanelControls();
    renderPreview();
  });
  buildButtons('gradeRow', GRADES, state.grade, (id) => {
    state.grade = id;
    renderPreview();
  });
  buildButtons('sizeRow', SIZES, state.size, (id) => {
    state.size = id;
    renderPreview();
  });
}

function renderTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'thumb';
    thumb.title = photo.name + ' — click, then click a panel to place it';
    const img = document.createElement('img');
    // Thumbnails are drawn from the photo itself, never from a stale URL.
    const tw = 120;
    const th = Math.round((120 * (photo.img.naturalHeight || photo.img.height)) / (photo.img.naturalWidth || photo.img.width));
    const tc = document.createElement('canvas');
    tc.width = tw;
    tc.height = th;
    tc.getContext('2d').drawImage(photo.img, 0, 0, tw, th);
    img.src = tc.toDataURL('image/jpeg', 0.8);
    img.alt = photo.name;
    thumb.appendChild(img);
    const tag = document.createElement('span');
    tag.textContent = photo.name;
    thumb.appendChild(tag);
    thumb.addEventListener('click', () => {
      const p = state.panels[state.selected];
      if (p) {
        p.photo = i;
        p.zoom = 1;
        p.ox = 0;
        p.oy = 0;
      }
      syncPanelControls();
      renderPreview();
    });
    tray.appendChild(thumb);
  });
  $('photoCount').textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded`;
}

function syncPanelControls() {
  const p = state.panels[state.selected];
  $('panelLabel').textContent = p
    ? `Panel ${state.selected + 1} of ${state.panels.length}`
    : 'No panel selected';
  $('zoom').value = p ? p.zoom : 1;
  $('zoomVal').textContent = p ? `${Math.round(p.zoom * 100)}%` : '—';
  $('nextPhoto').disabled = !p || state.photos.length < 2;
}

function setStatus(msg) {
  $('status').textContent = msg;
}

// Panel picking: click the preview to select a panel; drag to pan it.
function panelAt(clientX, clientY) {
  const r = preview.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * preview.width;
  const y = ((clientY - r.top) / r.height) * preview.height;
  const panels = layoutPanels(state.layout, preview.width, preview.height)
    .filter((p) => p.kind === 'photo');
  return panels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
}

let drag = null;
preview.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selected = i;
  syncPanelControls();
  renderPreview();
  drag = { x: e.clientX, y: e.clientY, ox: state.panels[i].ox, oy: state.panels[i].oy };
  preview.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = state.panels[state.selected];
  const r = preview.getBoundingClientRect();
  const k = preview.width / r.width;
  p.ox = drag.ox + (e.clientX - drag.x) * k;
  p.oy = drag.oy + (e.clientY - drag.y) * k;
  renderPreview();
});
preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[state.selected];
  if (!p) return;
  p.zoom = Math.min(3, Math.max(0.6, p.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  syncPanelControls();
  renderPreview();
}, { passive: false });

// ---- controls --------------------------------------------------------------

$('photoInput').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    const img = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = () => reject(new Error('could not read ' + file.name));
      im.src = url;
    });
    state.photos.push({ img, name: file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo' });
  }
  if (state.panels.length === 0) resetPanels();
  else state.panels.forEach((p, i) => { if (p.photo < 0) p.photo = (state.photos.length - 1) % state.photos.length; });
  renderTray();
  syncPanelControls();
  renderPreview();
  setStatus(`${files.length} photo${files.length === 1 ? '' : 's'} added — click a thumbnail, then a panel, to place it.`);
  e.target.value = '';
});

$('sampleBtn').addEventListener('click', () => {
  loadSamplePhotos();
  renderTray();
  syncPanelControls();
  renderPreview();
  setStatus('Sample photos loaded — drag a panel to reposition, scroll to zoom.');
});

$('titleInput').addEventListener('input', (e) => {
  state.title = e.target.value || 'NEON COAST';
  renderPreview();
});
$('subtitleInput').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  renderPreview();
});
$('zoom').addEventListener('input', (e) => {
  const p = state.panels[state.selected];
  if (!p) return;
  p.zoom = Number(e.target.value);
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  renderPreview();
});
$('nextPhoto').addEventListener('click', () => {
  const p = state.panels[state.selected];
  if (!p || !state.photos.length) return;
  p.photo = (p.photo + 1) % state.photos.length;
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  syncPanelControls();
  renderPreview();
});
$('resetPanel').addEventListener('click', () => {
  const p = state.panels[state.selected];
  if (!p) return;
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  syncPanelControls();
  renderPreview();
});

$('exportBtn').addEventListener('click', () => {
  const { w, h } = SIZES[state.size];
  renderCoverCanvas().toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — try again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Exported ${w} x ${h} PNG — check your downloads.`);
  }, 'image/png');
});

// ---- shot modes (for screenshots) ------------------------------------------

if (SHOT === 'cover') {
  // Full-frame cover: the exported art itself, drawn by the app.
  document.body.classList.add('shot-cover');
  loadSamplePhotos();
  const { w, h } = SIZES[state.size];
  const c = renderCoverCanvas();
  const holder = $('coverShot');
  holder.width = w;
  holder.height = h;
  holder.getContext('2d').drawImage(c, 0, 0);
  document.title = `Vice Cover — ${w} x ${h}`;
} else {
  loadSamplePhotos();
  refreshOptionButtons();
  renderTray();
  syncPanelControls();
  renderPreview();
  setStatus('Sample photos loaded. Add your own photos, pick a layout and grade, then export a PNG.');
  if (SHOT === 'editor') document.title = 'Vice Cover Studio — editor';
}
